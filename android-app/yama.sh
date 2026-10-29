#!/usr/bin/env bash
# npx cap add android'den sonra çalışır: eklenti, izinler, simge, sürüm numarası.
set -euo pipefail
P=android/app/src/main/java/io/github/kadrajsosyalmedya/kadraj
mkdir -p "$P"
cp native/KadrajGaleri.java native/MainActivity.java "$P/"
M=android/app/src/main/AndroidManifest.xml
perl -0pi -e 's#</manifest>#    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />\n    <uses-permission android:name="android.permission.READ_MEDIA_VISUAL_USER_SELECTED" />\n    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />\n    <uses-permission android:name="android.permission.CAMERA" />\n    <uses-permission android:name="android.permission.RECORD_AUDIO" />\n    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />\n</manifest>#' "$M"
# 6.8.20 bildirimler: POST_NOTIFICATIONS izni, beyaz K bildirim simgesi, renk ve varsayılan kanal (FCM). google-services.json yoksa bildirim yok, derleme yine olur.
perl -0pi -e 's#</manifest>#    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />\n</manifest>#' "$M"
perl -0pi -e 's#(<application[^>]*>)#$1\n        <meta-data android:name="com.google.firebase.messaging.default_notification_icon" android:resource="\@drawable/ic_stat_kadraj" />\n        <meta-data android:name="com.google.firebase.messaging.default_notification_color" android:resource="\@color/kadraj_bildirim" />\n        <meta-data android:name="com.google.firebase.messaging.default_notification_channel_id" android:value="kadraj" />#' "$M"
R=android/app/src/main/res
mkdir -p "$R/drawable" "$R/values"
cat > "$R/drawable/ic_stat_kadraj.xml" <<'XML'
<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24">
    <path android:fillColor="#FFFFFFFF" android:pathData="M6,3.5h3.2v7.3l6.3,-7.3h4l-6.6,7.5l7,9.5h-4l-5.2,-7.2l-1.5,1.6v5.6h-3.2z" />
</vector>
XML
cat > "$R/values/kadraj_bildirim.xml" <<'XML'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="kadraj_bildirim">#0C7A63</color>
</resources>
XML
if [ -f google-services.json ]; then cp google-services.json android/app/google-services.json; echo "google-services.json eklendi (bildirimler açık)"; else echo "UYARI: google-services.json yok, bildirimler kapalı derlenir"; fi
rm -rf "$R"/mipmap-anydpi-v26
for d in "$R"/mipmap-*; do
  cp ../icon-192.png "$d/ic_launcher.png"; cp ../icon-192.png "$d/ic_launcher_round.png"
  [ -f "$d/ic_launcher_foreground.png" ] && cp ../icon-192.png "$d/ic_launcher_foreground.png" || true
done
VER=$(grep -o 'APP_VER="[0-9.]*"' ../app.js | head -1 | cut -d'"' -f2)
G=android/app/build.gradle
sed -i "s/versionCode 1$/versionCode ${GITHUB_RUN_NUMBER:-1}/; s/versionName \"1.0\"/versionName \"${VER:-1.0}\"/" "$G"
grep -n "versionCode\|versionName" "$G"
grep -c READ_MEDIA_IMAGES "$M"
grep -c "default_notification_icon\|POST_NOTIFICATIONS" "$M"
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
