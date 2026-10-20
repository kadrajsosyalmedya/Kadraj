package io.github.kadrajsosyalmedya.kadraj;

import android.os.Bundle;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

/* Kadraj Android: Capacitor köprüsü + telefon galerisi eklentisi (KadrajGaleri). Site server.url ile açılır, güncellemeler kendiliğinden gelir. */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(KadrajGaleri.class);
        super.onCreate(savedInstanceState);
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
}
