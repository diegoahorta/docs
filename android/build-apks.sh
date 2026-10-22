#!/usr/bin/env bash
# Gera os APKs Android do Nihongo Drops (japonês) e do Hangul Drops (coreano).
#
# Cada app é uma WebView em tela cheia com o jogo inteiro embutido (versão
# offline do HTML único), voz nativa (TextToSpeech) e botão "voltar" ligado ao jogo.
# Não usa Gradle: empacota direto com as ferramentas do Android SDK.
#
# Requisitos (Ubuntu/Debian):
#   sudo apt install aapt dalvik-exchange zipalign apksigner android-sdk-platform-23 openjdk-21-jdk
#   e Node.js (npm install em nihongo-drops/ e hangul-drops/).
#
# Uso:  ./android/build-apks.sh
# Saída: android/dist/nihongo-drops.apk e android/dist/hangul-drops.apk
#
# Assinatura: na primeira vez é criada a chave android/.chave/drops.keystore
# (fora do git). Guarde-a: para atualizar um app já instalado, o novo APK
# precisa ser assinado com a MESMA chave. Senha: variável SENHA_DA_CHAVE.

set -euo pipefail

AQUI="$(cd "$(dirname "$0")" && pwd)"
RAIZ="$(dirname "$AQUI")"
ANDROID_JAR="${ANDROID_JAR:-/usr/lib/android-sdk/platforms/android-23/android.jar}"
CHAVE="${CHAVE:-$AQUI/.chave/drops.keystore}"
SENHA="${SENHA_DA_CHAVE:-drops-local}"
VERSAO_CODIGO="${VERSAO_CODIGO:-1}"
VERSAO_NOME="${VERSAO_NOME:-1.0}"
CONSTRUCAO="$AQUI/build"
SAIDA="$AQUI/dist"

# Densidades de ícone (pasta mipmap-<densidade>).
DENSIDADES=(mdpi hdpi xhdpi xxhdpi xxxhdpi)

falhar() {
  echo "✖ $*" >&2
  exit 1
}

verificar_ferramentas() {
  local ferramenta
  for ferramenta in aapt dalvik-exchange zipalign apksigner javac keytool node; do
    command -v "$ferramenta" >/dev/null || falhar "Falta a ferramenta: $ferramenta (veja os requisitos no topo do script)."
  done
  [[ -f "$ANDROID_JAR" ]] || falhar "android.jar não encontrado em $ANDROID_JAR (instale android-sdk-platform-23 ou defina ANDROID_JAR)."
}

criar_chave_se_preciso() {
  [[ -f "$CHAVE" ]] && return
  echo "• Criando a chave de assinatura em $CHAVE"
  mkdir -p "$(dirname "$CHAVE")"
  keytool -genkeypair -keystore "$CHAVE" -alias drops -keyalg RSA -keysize 2048 \
    -validity 10000 -storepass "$SENHA" -keypass "$SENHA" \
    -dname "CN=Drops, OU=Jogos, O=Drops, C=BR" >/dev/null 2>&1
}

# Compila o código Java (igual para os dois apps) e converte para DEX.
compilar_java() {
  echo "• Compilando o código Java"
  rm -rf "$CONSTRUCAO/classes" && mkdir -p "$CONSTRUCAO/classes"
  javac --release 8 -Xlint:-options -classpath "$ANDROID_JAR" -d "$CONSTRUCAO/classes" \
    $(find "$AQUI/java" -name '*.java') 2>&1 | grep -v '^Picked up' || true
  [[ -f "$CONSTRUCAO/classes/io/github/diegoahorta/drops/MainActivity.class" ]] || falhar "A compilação Java falhou."
  dalvik-exchange --dex --min-sdk-version=24 --output="$CONSTRUCAO/classes.dex" "$CONSTRUCAO/classes"
}

# Escapa um texto para dentro de um XML.
escapar_xml() {
  printf '%s' "$1" | sed -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g' -e "s/'/\\\\'/g"
}

# gerar_apk <projeto> <id do app> <nome> <idioma da voz> <ícone>
gerar_apk() {
  local projeto="$1" id="$2" nome="$3" voz="$4" icone="$5"
  local pasta="$CONSTRUCAO/$projeto"
  echo "• $nome ($id)"
  rm -rf "$pasta" && mkdir -p "$pasta/assets" "$pasta/res/values"

  # 1. O jogo inteiro num HTML só, com as bibliotecas embutidas (funciona offline).
  (cd "$RAIZ/$projeto" && node scripts/build-html.js --offline --saida "$pasta/assets/index.html")

  # 2. Recursos: nome do app e ícones.
  cat > "$pasta/res/values/strings.xml" <<XML
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">$(escapar_xml "$nome")</string>
</resources>
XML
  local densidade
  for densidade in "${DENSIDADES[@]}"; do
    mkdir -p "$pasta/res/mipmap-$densidade"
    cp "$AQUI/icones/$icone/ic_launcher-$densidade.png" "$pasta/res/mipmap-$densidade/ic_launcher.png"
  done

  # 3. Manifesto a partir do modelo.
  sed -e "s/@ID@/$id/" -e "s/@VERSAO_CODIGO@/$VERSAO_CODIGO/" \
    -e "s/@VERSAO_NOME@/$VERSAO_NOME/" -e "s/@IDIOMA_DA_VOZ@/$voz/" \
    "$AQUI/AndroidManifest.modelo.xml" > "$pasta/AndroidManifest.xml"

  # 4. Empacota manifesto, recursos e assets; acrescenta o código (classes.dex).
  aapt package -f -M "$pasta/AndroidManifest.xml" -S "$pasta/res" -A "$pasta/assets" \
    -I "$ANDROID_JAR" -F "$pasta/sem-codigo.apk"
  cp "$CONSTRUCAO/classes.dex" "$pasta/classes.dex"
  (cd "$pasta" && aapt add -f sem-codigo.apk classes.dex >/dev/null)

  # 5. Alinha (exigido pelo Android 11+) e assina (esquemas v1, v2 e v3).
  zipalign -f -p 4 "$pasta/sem-codigo.apk" "$pasta/alinhado.apk"
  mkdir -p "$SAIDA"
  apksigner sign --ks "$CHAVE" --ks-key-alias drops --ks-pass "pass:$SENHA" \
    --key-pass "pass:$SENHA" --out "$SAIDA/$projeto.apk" "$pasta/alinhado.apk"
  apksigner verify "$SAIDA/$projeto.apk"
  echo "  ✔ android/dist/$projeto.apk ($(du -k "$SAIDA/$projeto.apk" | cut -f1) KB)"
}

verificar_ferramentas
criar_chave_se_preciso
compilar_java
gerar_apk nihongo-drops io.github.diegoahorta.nihongodrops "Nihongo Drops" ja-JP nihongo
gerar_apk hangul-drops io.github.diegoahorta.hanguldrops "Hangul Drops" ko-KR hangul
echo "Pronto! APKs em android/dist/"
