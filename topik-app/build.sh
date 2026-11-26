#!/usr/bin/env bash
# Compila o APK sem Gradle, usando as ferramentas Android do Ubuntu:
#   sudo apt-get install aapt apksigner zipalign dalvik-exchange android-sdk-platform-23
set -euo pipefail
cd "$(dirname "$0")"
SDK=/usr/lib/android-sdk
JAR=$SDK/platforms/android-23/android.jar
OUT=build
rm -rf "$OUT" && mkdir -p "$OUT/gen" "$OUT/classes"

aapt package -f -m -J "$OUT/gen" -M AndroidManifest.xml -S res -I "$JAR"
javac --release 8 -nowarn -classpath "$JAR" -d "$OUT/classes" \
  $(find src "$OUT/gen" -name '*.java') 2>&1 | grep -v "bootstrap\|^1 warning\|release 8" || true
"$SDK/build-tools/debian/dx" --dex --output="$OUT/classes.dex" "$OUT/classes"

aapt package -f -M AndroidManifest.xml -S res -A assets -I "$JAR" -F "$OUT/unsigned.apk" -0 arsc
(cd "$OUT" && aapt add unsigned.apk classes.dex >/dev/null)
zipalign -f -p 4 "$OUT/unsigned.apk" "$OUT/aligned.apk"

KS=${KEYSTORE:-release.keystore}
if [ ! -f "$KS" ]; then
  keytool -genkeypair -keystore "$KS" -alias topik -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass topik1671 -keypass topik1671 -dname "CN=TOPIK I Vocab" >/dev/null 2>&1
fi
apksigner sign --ks "$KS" --ks-pass pass:topik1671 --ks-key-alias topik --out TOPIK-I-1671.apk "$OUT/aligned.apk"
apksigner verify TOPIK-I-1671.apk && echo "OK: $(pwd)/TOPIK-I-1671.apk"
