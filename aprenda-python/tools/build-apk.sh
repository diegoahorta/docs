#!/usr/bin/env bash
# Compila o APK do Aprenda Python sem Gradle, usando as ferramentas do Android SDK
# empacotadas pelo Debian/Ubuntu:
#   sudo apt-get install -y aapt dalvik-exchange zipalign apksigner android-sdk-platform-23 openjdk-17-jdk-headless
# Variáveis opcionais:
#   ANDROID_JAR   caminho do android.jar (padrão: /usr/lib/android-sdk/platforms/android-23/android.jar)
#   KEYSTORE, KEYSTORE_SENHA, KEY_ALIAS   chave de assinatura (se ausente, gera tools/aprenda-python.keystore)
#   VERSAO_NOME, VERSAO_CODIGO            sobrescrevem versionName/versionCode do manifesto
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
SAIDA="$RAIZ/build"
ANDROID_JAR="${ANDROID_JAR:-/usr/lib/android-sdk/platforms/android-23/android.jar}"
AAPT="${AAPT:-aapt}"
DX="${DX:-$(command -v dalvik-exchange || command -v dx)}"
ZIPALIGN="${ZIPALIGN:-zipalign}"
APKSIGNER="${APKSIGNER:-apksigner}"

for f in "$ANDROID_JAR"; do [ -f "$f" ] || { echo "Não encontrado: $f"; exit 1; }; done

echo "==> 1/7 Pyodide (Python em WebAssembly)"
bash "$RAIZ/tools/baixar-pyodide.sh"

echo "==> 2/7 Validando o conteúdo (executa todos os exemplos e exercícios)"
if [ "${PULAR_VALIDACAO:-0}" != "1" ]; then node "$RAIZ/tools/validar.js"; fi

echo "==> 3/7 Preparando assets"
rm -rf "$SAIDA"
mkdir -p "$SAIDA/assets/www" "$SAIDA/gen" "$SAIDA/classes"
( cd "$RAIZ/web" && tar cf - --exclude='conteudo/FORMATO.md' --exclude='*.map' . ) | ( cd "$SAIDA/assets/www" && tar xf - )
MANIFESTO="$SAIDA/AndroidManifest.xml"
cp "$RAIZ/android/AndroidManifest.xml" "$MANIFESTO"
if [ -n "${VERSAO_NOME:-}" ]; then sed -i "s/android:versionName=\"[^\"]*\"/android:versionName=\"$VERSAO_NOME\"/" "$MANIFESTO"; fi
if [ -n "${VERSAO_CODIGO:-}" ]; then sed -i "s/android:versionCode=\"[^\"]*\"/android:versionCode=\"$VERSAO_CODIGO\"/" "$MANIFESTO"; fi

echo "==> 4/7 Recursos (aapt)"
"$AAPT" package -f -m \
  -M "$MANIFESTO" -S "$RAIZ/android/res" -A "$SAIDA/assets" \
  -I "$ANDROID_JAR" -J "$SAIDA/gen" -0 zip \
  -F "$SAIDA/app.semdex.apk"

echo "==> 5/7 Java -> bytecode -> dex"
javac -nowarn -Xlint:-options -source 8 -target 8 -encoding UTF-8 \
  -bootclasspath "$ANDROID_JAR" -classpath "$ANDROID_JAR" \
  -d "$SAIDA/classes" \
  $(find "$RAIZ/android/src" "$SAIDA/gen" -name '*.java')
"$DX" --dex --output="$SAIDA/classes.dex" "$SAIDA/classes"
( cd "$SAIDA" && cp app.semdex.apk app.naoassinado.apk && "$AAPT" add app.naoassinado.apk classes.dex >/dev/null )

echo "==> 6/7 Alinhando (zipalign)"
"$ZIPALIGN" -f -p 4 "$SAIDA/app.naoassinado.apk" "$SAIDA/app.alinhado.apk"

echo "==> 7/7 Assinando (apksigner)"
KEYSTORE="${KEYSTORE:-$RAIZ/tools/aprenda-python.keystore}"
KEYSTORE_SENHA="${KEYSTORE_SENHA:-aprenda-python}"
KEY_ALIAS="${KEY_ALIAS:-aprenda-python}"
if [ ! -f "$KEYSTORE" ]; then
  echo "    gerando chave de assinatura em $KEYSTORE"
  keytool -genkeypair -keystore "$KEYSTORE" -storepass "$KEYSTORE_SENHA" -keypass "$KEYSTORE_SENHA" \
    -alias "$KEY_ALIAS" -keyalg RSA -keysize 2048 -validity 10000 \
    -dname "CN=Aprenda Python, OU=Estudos, O=Aprenda Python, C=BR" 2>/dev/null
fi
"$APKSIGNER" sign --ks "$KEYSTORE" --ks-pass "pass:$KEYSTORE_SENHA" --key-pass "pass:$KEYSTORE_SENHA" \
  --ks-key-alias "$KEY_ALIAS" --min-sdk-version 24 \
  --out "$SAIDA/AprendaPython.apk" "$SAIDA/app.alinhado.apk"
"$APKSIGNER" verify "$SAIDA/AprendaPython.apk"
rm -f "$SAIDA"/app.*.apk "$SAIDA"/*.idsig
echo
echo "APK pronto: $SAIDA/AprendaPython.apk ($(du -h "$SAIDA/AprendaPython.apk" | cut -f1))"
