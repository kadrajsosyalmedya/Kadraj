package io.github.kadrajsosyalmedya.kadraj;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.ImageDecoder;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Size;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.LinkedHashMap;
import java.util.Map;

/* Telefon galerisi (MediaStore). Sayfadan: Capacitor.Plugins.KadrajGaleri
   izin() → {ok, kismi}, albumler() → {items:[{name,count,thumb}]},
   liste({offset,limit,album,thumb}) → {items:[{id,at,album,thumb}], total}, al({id,max}) → {data:"data:image/jpeg;base64,…", w, h}.
   Küçük resimler base64 JPEG (varsayılan 240 px); al() en fazla max px (varsayılan 2048), yön (EXIF) ImageDecoder ile düzelir. */
@CapacitorPlugin(
    name = "KadrajGaleri",
    permissions = {
        @Permission(alias = "foto", strings = { Manifest.permission.READ_MEDIA_IMAGES }),
        @Permission(alias = "fotoEski", strings = { Manifest.permission.READ_EXTERNAL_STORAGE })
    }
)
public class KadrajGaleri extends Plugin {

    private String alias() {
        return Build.VERSION.SDK_INT >= 33 ? "foto" : "fotoEski";
    }

    /* Android 14: kişi "Bazı fotoğrafları seç" derse yalnızca seçtikleri görünür (kısmi izin). */
    private boolean kismi() {
        return Build.VERSION.SDK_INT >= 34
            && ContextCompat.checkSelfPermission(getContext(), "android.permission.READ_MEDIA_VISUAL_USER_SELECTED") == PackageManager.PERMISSION_GRANTED;
    }

    private JSObject izinDurumu() {
        JSObject r = new JSObject();
        boolean tam = getPermissionState(alias()) == PermissionState.GRANTED;
        boolean k = !tam && kismi();
        r.put("ok", tam || k);
        r.put("kismi", k);
        return r;
    }

    @PluginMethod
    public void izin(PluginCall call) {
        JSObject r = izinDurumu();
        if (r.getBool("ok")) {
            call.resolve(r);
            return;
        }
        requestPermissionForAlias(alias(), call, "izinSonuc");
    }

    @PermissionCallback
    private void izinSonuc(PluginCall call) {
        call.resolve(izinDurumu());
    }

    private static final Uri BASE = MediaStore.Images.Media.EXTERNAL_CONTENT_URI;

    private String jpeg(Bitmap b, int q) {
        ByteArrayOutputStream o = new ByteArrayOutputStream();
        b.compress(Bitmap.CompressFormat.JPEG, q, o);
        return "data:image/jpeg;base64," + Base64.encodeToString(o.toByteArray(), Base64.NO_WRAP);
    }

    private String kucuk(long id, int ts) {
        try {
            ContentResolver cr = getContext().getContentResolver();
            Bitmap b;
            if (Build.VERSION.SDK_INT >= 29) {
                b = cr.loadThumbnail(ContentUris.withAppendedId(BASE, id), new Size(ts, ts), null);
            } else {
                b = MediaStore.Images.Thumbnails.getThumbnail(cr, id, MediaStore.Images.Thumbnails.MINI_KIND, null);
            }
            return b == null ? null : jpeg(b, 72);
        } catch (Exception e) {
            return null;
        }
    }

    @PluginMethod
    public void albumler(PluginCall call) {
        if (!izinDurumu().getBool("ok")) {
            call.reject("izin yok", "IZIN");
            return;
        }
        String[] proj = { MediaStore.Images.Media._ID, MediaStore.Images.Media.BUCKET_DISPLAY_NAME };
        Map<String, long[]> m = new LinkedHashMap<>();
        try (Cursor c = getContext().getContentResolver().query(BASE, proj, null, null, MediaStore.Images.Media.DATE_ADDED + " DESC")) {
            if (c != null) {
                while (c.moveToNext()) {
                    String n = c.getString(1);
                    if (n == null) n = "Diğer";
                    long[] v = m.get(n);
                    if (v == null) m.put(n, new long[] { c.getLong(0), 1 });
                    else v[1]++;
                }
            }
        } catch (Exception e) {
            call.reject("Albümler okunamadı");
            return;
        }
        JSArray a = new JSArray();
        for (Map.Entry<String, long[]> e : m.entrySet()) {
            JSObject o = new JSObject();
            o.put("name", e.getKey());
            o.put("count", e.getValue()[1]);
            o.put("thumb", kucuk(e.getValue()[0], 160));
            a.put(o);
        }
        JSObject r = new JSObject();
        r.put("items", a);
        call.resolve(r);
    }

    @PluginMethod
    public void liste(PluginCall call) {
        if (!izinDurumu().getBool("ok")) {
            call.reject("izin yok", "IZIN");
            return;
        }
        final int off = Math.max(0, call.getInt("offset", 0));
        final int lim = Math.max(1, Math.min(200, call.getInt("limit", 60)));
        final int ts = Math.max(96, Math.min(512, call.getInt("thumb", 240)));
        String album = call.getString("album", null);
        String[] proj = {
            MediaStore.Images.Media._ID, MediaStore.Images.Media.DATE_TAKEN, MediaStore.Images.Media.DATE_ADDED, MediaStore.Images.Media.BUCKET_DISPLAY_NAME
        };
        String sel = album != null ? MediaStore.Images.Media.BUCKET_DISPLAY_NAME + "=?" : null;
        String[] args = album != null ? new String[] { album } : null;
        JSArray arr = new JSArray();
        int total = 0;
        try (Cursor c = getContext().getContentResolver().query(BASE, proj, sel, args, MediaStore.Images.Media.DATE_ADDED + " DESC")) {
            if (c != null) {
                total = c.getCount();
                if (c.moveToPosition(off)) {
                    int n = 0;
                    do {
                        long id = c.getLong(0);
                        long at = c.getLong(1);
                        if (at == 0) at = c.getLong(2) * 1000L;
                        JSObject o = new JSObject();
                        o.put("id", String.valueOf(id));
                        o.put("at", at);
                        o.put("album", c.getString(3));
                        o.put("thumb", kucuk(id, ts));
                        arr.put(o);
                        n++;
                    } while (n < lim && c.moveToNext());
                }
            }
        } catch (Exception e) {
            call.reject("Galeri okunamadı: " + e.getMessage());
            return;
        }
        JSObject r = new JSObject();
        r.put("items", arr);
        r.put("total", total);
        call.resolve(r);
    }

    @PluginMethod
    public void al(PluginCall call) {
        String sid = call.getString("id");
        final int max = Math.max(256, Math.min(4096, call.getInt("max", 2048)));
        if (sid == null) {
            call.reject("id yok");
            return;
        }
        try {
            Uri u = ContentUris.withAppendedId(BASE, Long.parseLong(sid));
            ContentResolver cr = getContext().getContentResolver();
            Bitmap b;
            if (Build.VERSION.SDK_INT >= 28) {
                ImageDecoder.Source s = ImageDecoder.createSource(cr, u);
                b = ImageDecoder.decodeBitmap(s, (dec, info, src) -> {
                    int w = info.getSize().getWidth(), h = info.getSize().getHeight();
                    float k = Math.min(1f, (float) max / Math.max(w, h));
                    if (k < 1f) dec.setTargetSize(Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k)));
                    dec.setAllocator(ImageDecoder.ALLOCATOR_SOFTWARE);
                });
            } else {
                BitmapFactory.Options o = new BitmapFactory.Options();
                o.inJustDecodeBounds = true;
                try (InputStream is = cr.openInputStream(u)) {
                    BitmapFactory.decodeStream(is, null, o);
                }
                int smp = 1;
                while (Math.max(o.outWidth, o.outHeight) / (smp * 2) >= max) smp *= 2;
                BitmapFactory.Options o2 = new BitmapFactory.Options();
                o2.inSampleSize = smp;
                try (InputStream is = cr.openInputStream(u)) {
                    b = BitmapFactory.decodeStream(is, null, o2);
                }
                if (b != null && Math.max(b.getWidth(), b.getHeight()) > max) {
                    float k = (float) max / Math.max(b.getWidth(), b.getHeight());
                    b = Bitmap.createScaledBitmap(b, Math.round(b.getWidth() * k), Math.round(b.getHeight() * k), true);
                }
            }
            if (b == null) {
                call.reject("Fotoğraf açılamadı");
                return;
            }
            JSObject r = new JSObject();
            r.put("data", jpeg(b, 88));
            r.put("w", b.getWidth());
            r.put("h", b.getHeight());
            call.resolve(r);
        } catch (Exception e) {
            call.reject("Fotoğraf açılamadı: " + e.getMessage());
        }
    }
}
