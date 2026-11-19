#!/usr/bin/env bash
# Gera o APK assinado do Leitor & Estudos.
# Requisitos: JDK 17+, Android SDK (platforms;android-34, build-tools;34.0.0) e ANDROID_HOME definido.
set -euo pipefail
cd "$(dirname "$0")/android"
: "${ANDROID_HOME:?Defina ANDROID_HOME com o caminho do Android SDK}"
echo "sdk.dir=$ANDROID_HOME" > local.properties
PASS="${LEITOR_KS_PASS:-leitor123}"
if [ ! -f keystore/leitor.jks ]; then
  mkdir -p keystore
  keytool -genkeypair -v -keystore keystore/leitor.jks -alias leitor -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "$PASS" -keypass "$PASS" -dname "CN=Leitor Estudos, O=Leitor, C=BR"
fi
./gradlew --no-daemon assembleRelease
mkdir -p ../dist
cp app/build/outputs/apk/release/app-release.apk ../dist/LeitorEstudos.apk
echo "APK gerado em: $(cd ..; pwd)/dist/LeitorEstudos.apk"
