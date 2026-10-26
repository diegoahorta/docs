#!/usr/bin/env bash
# Compila o APK sem Gradle, usando as ferramentas do Android SDK
# (no Ubuntu/Debian: apt install android-sdk-platform-23 aapt dalvik-exchange zipalign apksigner).
set -euo pipefail
cd "$(dirname "$0")"

ANDROID_JAR="${ANDROID_JAR:-/usr/lib/android-sdk/platforms/android-23/android.jar}"
OUT=build
APK_NAME=DiarioDeClasse.apk
KEYSTORE=keystore/diario.keystore
KS_PASS="${KS_PASS:-diario123}"

rm -rf "$OUT" && mkdir -p "$OUT/res" "$OUT/gen" "$OUT/classes" "$OUT/dex"

echo "> Recursos (aapt2)"
aapt2 compile --dir res -o "$OUT/res/res.zip"
aapt2 link -I "$ANDROID_JAR" --manifest AndroidManifest.xml -A assets \
  --java "$OUT/gen" -o "$OUT/unsigned.apk" "$OUT/res/res.zip"

echo "> Java (javac)"
javac -nowarn -source 8 -target 8 -encoding UTF-8 -Xlint:-options \
  -bootclasspath "$ANDROID_JAR" -d "$OUT/classes" \
  $(find src "$OUT/gen" -name '*.java')

echo "> DEX (dx)"
dalvik-exchange --dex --min-sdk-version=21 --output="$OUT/dex/classes.dex" "$OUT/classes"
(cd "$OUT/dex" && zip -q -j ../unsigned.apk classes.dex)

echo "> Alinhamento e assinatura"
zipalign -f -p 4 "$OUT/unsigned.apk" "$OUT/aligned.apk"
if [ ! -f "$KEYSTORE" ]; then
  mkdir -p keystore
  keytool -genkeypair -keystore "$KEYSTORE" -alias diario -keyalg RSA -keysize 2048 \
    -validity 10000 -storepass "$KS_PASS" -keypass "$KS_PASS" \
    -dname "CN=Diario de Classe, O=Diario de Classe, C=BR"
fi
apksigner sign --ks "$KEYSTORE" --ks-key-alias diario --ks-pass "pass:$KS_PASS" \
  --key-pass "pass:$KS_PASS" --out "$APK_NAME" "$OUT/aligned.apk"
apksigner verify "$APK_NAME"
echo "OK: $(pwd)/$APK_NAME ($(du -h "$APK_NAME" | cut -f1))"
