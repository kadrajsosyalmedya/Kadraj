# Orbit ve Kadraj acil modu kurulumu

Aynı Supabase projesi iki işe yarar: Orbit (ayrı yedek uygulama) ve Kadraj'ın acil modu (Firebase koparsa Kadraj buraya geçer).

Adres: https://kadrajsosyalmedya.github.io/Kadraj/yedek/

1. https://supabase.com › ücretsiz hesap › **New project** (bölge: Frankfurt ya da en yakını).
2. **SQL Editor › New query** › `kurulum.sql` dosyasının tamamını yapıştır › **Run**.
3. **Authentication › URL Configuration**: Site URL = `https://kadrajsosyalmedya.github.io/Kadraj/yedek/`, Redirect URLs'e aynı adresi ekle (şifre sıfırlama ve e-posta doğrulama bağlantıları buraya döner).
4. **Authentication › Sign In / Providers › Email › Confirm email** kapatılmalı: Kadraj acil mod hesabını arka planda açar, e-posta doğrulaması açıksa acil mod hazırlanamaz (Orbit'te de kayıt olan hemen girer).
5. **Project Settings › API**: Project URL ve **anon / publishable** anahtarı `yedek/ayar.js`'e (`url`, `key`) yazılır. Orbit ve Kadraj ikisi de bu dosyayı okur. **service_role / secret anahtarı asla yazılmaz.**

Kadraj acil modu: ayar.js dolunca herkes Kadraj'a bir sonraki girişinde (şifre girince) kendiliğinden hazırlanır; beni hatırla ile girenler Ayarlar › Uygulama › Acil mod'dan şifresini bir kez yazar.

Uyanık tutma: `.github/workflows/yedek-uyanik.yml` haftada iki kez `ping` çağırır (ücretsiz proje 7 gün boşta kalınca uyutulur).
Videolar (Spark) Kadraj'ın Cloudinary hesabına yüklenir; resimler (profil, hikâye, mesaj) küçültülüp veritabanında durur.
Test: Kadraj acil modu `scratchpad/yd/ac.js <genişlik>` (sahte `fake2.js`), kuralları `rls2.py`; Orbit `scratchpad/yd/t.js <genişlik>` (sahte Supabase istemcisi `fake.js`, `python3 -m http.server 8781`), kurallar `scratchpad/yd/rls.py` (yerel Postgres).
