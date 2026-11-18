#!/usr/bin/env bash
# Compila o APK sem Gradle/Android Studio, usando apenas as ferramentas de linha de comando:
#   aapt (recursos), javac (Java 8), dx (dex), zipalign e apksigner.
# Requisitos (Ubuntu/Debian):  sudo apt install aapt dalvik-exchange zipalign apksigner openjdk-17-jdk
# e um android.jar (API 33) em $ANDROID_JAR  (padrão: ./tools/android.jar)
set -euo pipefail
cd "$(dirname "$0")"

APP=android
OUT=build
ANDROID_JAR="${ANDROID_JAR:-tools/android.jar}"
KEYSTORE="${KEYSTORE:-tools/bujo-release.keystore}"
KS_PASS="${KS_PASS:-bujo-offline}"
DX="${DX:-dalvik-exchange}"

if [ ! -f "$ANDROID_JAR" ]; then
  echo "Baixando android.jar (API 33)..."
  curl -fsSL -o "$ANDROID_JAR" https://raw.githubusercontent.com/Sable/android-platforms/master/android-33/android.jar
fi

rm -rf "$OUT"; mkdir -p "$OUT"/{gen,classes,dex}

# ícones
python3 tools/make_icons.py "$APP/res"

# testes de lógica do app (opcional: requer node)
if command -v node >/dev/null && [ -f tools/test_logic.js ]; then node tools/test_logic.js; fi

# 1) recursos -> R.java + apk base
aapt package -f -m -J "$OUT/gen" -M "$APP/AndroidManifest.xml" -S "$APP/res" \
  -A "$APP/assets" -I "$ANDROID_JAR" -F "$OUT/base.apk" --min-sdk-version 24 --target-sdk-version 33

# 2) Java -> .class
javac -nowarn -Xlint:-options --release 8 -encoding UTF-8 -classpath "$ANDROID_JAR" -d "$OUT/classes" \
  $(find "$APP/src" "$OUT/gen" -name '*.java')

# 3) .class -> classes.dex
$DX --dex --min-sdk-version=24 --output="$OUT/dex/classes.dex" "$OUT/classes"
(cd "$OUT/dex" && zip -q -j ../base.apk classes.dex)

# 4) alinhar e assinar
zipalign -f -p 4 "$OUT/base.apk" "$OUT/aligned.apk"
if [ ! -f "$KEYSTORE" ]; then
  keytool -genkeypair -keystore "$KEYSTORE" -storepass "$KS_PASS" -keypass "$KS_PASS" -alias bujo \
    -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Bullet Journal Offline" >/dev/null 2>&1
fi
apksigner sign --ks "$KEYSTORE" --ks-pass "pass:$KS_PASS" --ks-key-alias bujo \
  --out "$OUT/BulletJournal.apk" "$OUT/aligned.apk"
apksigner verify --print-certs "$OUT/BulletJournal.apk" | head -1
cp "$OUT/BulletJournal.apk" ./BulletJournal.apk
echo "OK -> $(pwd)/BulletJournal.apk ($(du -h BulletJournal.apk | cut -f1))"
