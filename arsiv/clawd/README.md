# Clawd (arşiv)

Clawd, Kadraj'ın ekranda yaşayan piksel maskotuydu (5.0.1'de geldi, 6.4.5'te sahibinin isteğiyle kaldırıldı). Kod uygulamadan çıkarıldı ama burada saklanıyor; Kadraj bu klasördeki dosyaları **yüklemez**.

## Neler vardı
- **Odalar:** Akış'ta hikâyelerin yanında, Keşfet'te kartın altında, Sohbet'te notların yanında, profilde adın yanında küçük piksel oda (yatak, çekmece, ışık düğmesi). Sığmazsa ekranda gezerdi.
- **Klaket rafı:** Klaket izlerken köşede patlamış mısırla oturur, yeni Klakete geçince alkışlardı. Yorumlar açıkken dans ederdi.
- **Gece ve sabah:** 00:00-07:00 arası uyur, sabah gitar çalardı.
- **Sohbet:** Clawd'a dokunup soru sorulurdu. Çevrimdışı bilgi tabanıyla yanıt verir, bilmediğinde soğuk espri anlatırdı.
- **Sesler:** Piksel konuşma sesleri vardı (Ayarlar › Görünüm › Clawd sesleri).
- **Hızlı yönetici girişi:** Clawd'a gizli söz yazılınca yönetici paneli şifresiz açılırdı (yalnızca sahibin hesabında). Animasyonu da buradaydı.
- **Ayarlar:** `settings.clawd`, `settings.clawdSound`.

## Dosyalar
- `clawd.js`: index.html'deki `/*@js:50PIKO{*/` ve `/*@js:51CLAWD{*/` bölgeleri ve hızlı giriş kodu (bölge 511).
- `clawd.css`: `/*@css:50PIKO{*/` ve `/*@css:51CLAWD{*/` bölgeleri ve hızlı giriş animasyonunun CSS'i.

## Uygulamada kalanlar
- Piksel yüz çizimi (`cwSvg`, `cwPaint`, `CW_*`), index.html'deki küçük `50PIKO` bölgesinde duruyor. Satrançtaki **Clawd rakibi** ve **Clawd–Rota maçı** bunu kullanıyor, onlar uygulamada kalıyor.
- `IP.clawd` simgesi de duruyor.

## Geri getirmek için
En kolay yol: Clawd'ın hâlâ durduğu son sürüm **6.4.4** (kayıt `0cfe0d4`). O sürümün `index.html` dosyasındaki bölgeler, bugünkü dosyada aynı adlı yerlere geri konur. Elle yapılacaksa:
1. `clawd.css` içeriğini index.html'in CSS kısmına koy (eski yeri: 50UI'dan sonra).
2. `clawd.js` içindeki iki bölgeyi index.html'deki küçük `50PIKO` bölgesinin yerine koy. Sprite kısmı arşivde de var, ikisini birden koyma.
3. Hızlı giriş kodu bölge 511'de "5.1.6" bloğundan önceye gider.
4. Aradaki sürümlerde değişen sarmalanmış fonksiyonları (vSettings, toast, chOver, kbOnFlag, notifyChats, notifyMeta) denetle.
