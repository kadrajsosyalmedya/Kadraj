#!/usr/bin/env bash
# npx cap add android'den sonra çalışır: eklenti, izinler, simge, sürüm numarası.
set -euo pipefail
P=android/app/src/main/java/io/github/kadrajsosyalmedya/kadraj
mkdir -p "$P"
cp native/KadrajGaleri.java native/MainActivity.java "$P/"
M=android/app/src/main/AndroidManifest.xml
perl -0pi -e 's#</manifest>#    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />\n    <uses-permission android:name="android.permission.READ_MEDIA_VISUAL_USER_SELECTED" />\n    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />\n    <uses-permission android:name="android.permission.CAMERA" />\n    <uses-permission android:name="android.permission.RECORD_AUDIO" />\n    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />\n</manifest>#' "$M"
R=android/app/src/main/res
rm -rf "$R"/mipmap-anydpi-v26
for d in "$R"/mipmap-*; do
  cp ../icon-192.png "$d/ic_launcher.png"; cp ../icon-192.png "$d/ic_launcher_round.png"
  [ -f "$d/ic_launcher_foreground.png" ] && cp ../icon-192.png "$d/ic_launcher_foreground.png" || true
done
VER=$(grep -o 'APP_VER="[0-9.]*"' ../index.html | head -1 | cut -d'"' -f2)
G=android/app/build.gradle
sed -i "s/versionCode 1$/versionCode ${GITHUB_RUN_NUMBER:-1}/; s/versionName \"1.0\"/versionName \"${VER:-1.0}\"/" "$G"
grep -n "versionCode\|versionName" "$G"
grep -c READ_MEDIA_IMAGES "$M"
# Sabit imza: anahtar GitHub önbelleğinde (~/.android/kadraj.keystore), iş akışı yoksa oluşturur. Depoda anahtar yok.
cat >> "$G" <<'GR'

android {
    signingConfigs {
        kadraj {
            storeFile file(System.getenv("KADRAJ_KS") ?: (System.getProperty("user.home") + "/.android/kadraj.keystore"))
            storePassword "kadraj-android"
            keyAlias "kadraj"
            keyPassword "kadraj-android"
        }
    }
    buildTypes {
        debug { signingConfig signingConfigs.kadraj }
    }
}
GR
