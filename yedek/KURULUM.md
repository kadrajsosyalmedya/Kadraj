# Kadraj'ın Supabase yedeği kurulumu

Firebase koparsa Kadraj sohbetlere Supabase üzerinden devam eder (ekranda "Firebase bağlantısı koptu, Supabase ile devam ediliyor"). Bu klasörde yalnızca yedeğin ayarı (`ayar.js`), Supabase istemcisi (`supabase.js`) ve veritabanı kurulumu (`kurulum.sql`) var; ayrı bir uygulama yok (eski Orbit 6.8.17'de kaldırıldı).

1. https://supabase.com › ücretsiz hesap › **New project** (Region: Europe).
2. **SQL Editor › New query** › `kurulum.sql` dosyasının tamamını yapıştır › **Run**.
3. **Authentication › Sign In / Providers › Email › Confirm email** kapatılmalı: Kadraj yedek hesabı arka planda açar, e-posta doğrulaması açıksa yedek hazırlanamaz.
4. **Authentication › URL Configuration**: Site URL = `https://kadrajsosyalmedya.github.io/Kadraj/`.
5. **Project Settings › API**: Project URL ve **anon / publishable** anahtar `ayar.js`'e (`url`, `key`) yazılır. **service_role / secret anahtarı asla yazılmaz.**

ayar.js dolunca herkes Kadraj'a bir sonraki girişinde (şifre girince) yedeğe kendiliğinden hazırlanır; beni hatırla ile girenler Ayarlar › Uygulama › Supabase yedeği'nden şifresini bir kez yazar.

Uyanık tutma: `.github/workflows/yedek-uyanik.yml` haftada iki kez `ping` çağırır (ücretsiz proje 7 gün boşta kalınca uyutulur).
Test: `scratchpad/yd/ac.js <genişlik>` (sahte `fake2.js`), kurallar `rls2.py` (yerel Postgres).
