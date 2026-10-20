package io.github.kadrajsosyalmedya.kadraj;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.view.Window;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

/* Kadraj Android: Capacitor köprüsü + telefon galerisi eklentisi (KadrajGaleri). Site server.url ile açılır, güncellemeler kendiliğinden gelir. */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(KadrajGaleri.class);
        super.onCreate(savedInstanceState);
        boya(this, 0xFF0A110F);
        /* Geri tuşu: önce Kadraj'a sorar (window.kBack: katman, yığın, Akış'a dön); "0" dönerse uygulamadan çıkar. */
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (bridge == null) { finish(); return; }
                bridge.getWebView().evaluateJavascript("String(window.kBack?window.kBack():0)", v -> {
                    if (v == null || !v.contains("1")) finish();
                });
            }
        });
    }

    /* Durum ve gezinme çubuğunu boyar; renk açıksa simgeler koyu. */
    static void boya(Activity a, int c) {
        Window w = a.getWindow();
        w.setStatusBarColor(c);
        w.setNavigationBarColor(c);
        boolean acik = (0.299 * Color.red(c) + 0.587 * Color.green(c) + 0.114 * Color.blue(c)) / 255 > 0.6;
        WindowInsetsControllerCompat ic = WindowCompat.getInsetsController(w, w.getDecorView());
        ic.setAppearanceLightStatusBars(acik);
        ic.setAppearanceLightNavigationBars(acik);
    }
}
