package io.github.kadrajsosyalmedya.kadraj;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

/* Kadraj Android: Capacitor köprüsü + telefon galerisi eklentisi (KadrajGaleri). Site server.url ile açılır, güncellemeler kendiliğinden gelir. */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(KadrajGaleri.class);
        super.onCreate(savedInstanceState);
    }
}
