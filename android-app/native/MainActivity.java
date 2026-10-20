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
        /* Geri tuşu: sayfa geçmişinde geri gider (Kadraj navPush/popstate), geçmiş bitince uygulamadan çıkar. */
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (bridge != null && bridge.getWebView().canGoBack()) bridge.getWebView().goBack();
                else { setEnabled(false); getOnBackPressedDispatcher().onBackPressed(); setEnabled(true); }
            }
        });
    }
}
