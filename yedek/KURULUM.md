# Orbit kurulumu (Kadraj'ın yedeği)

Adres: https://kadrajsosyalmedya.github.io/Kadraj/yedek/

1. https://supabase.com › ücretsiz hesap › **New project** (bölge: Frankfurt ya da en yakını).
2. **SQL Editor › New query** › `kurulum.sql` dosyasının tamamını yapıştır › **Run**.
3. **Authentication › URL Configuration**: Site URL = `https://kadrajsosyalmedya.github.io/Kadraj/yedek/`, Redirect URLs'e aynı adresi ekle (şifre sıfırlama ve e-posta doğrulama bağlantıları buraya döner).
4. İsteğe bağlı: **Authentication › Sign In / Providers › Email › Confirm email** kapatılırsa kayıt olan hemen girer; açık kalırsa e-postadaki bağlantıya dokunması gerekir (ücretsiz planda saatte birkaç e-posta sınırı var).
5. **Project Settings › API**: Project URL ve **anon / publishable** anahtarı `index.html`'deki `SUPA_URL` ve `SUPA_KEY`'e yazılır. **service_role / secret anahtarı asla yazılmaz.**

Uyanık tutma: `.github/workflows/yedek-uyanik.yml` haftada iki kez `ping` çağırır (ücretsiz proje 7 gün boşta kalınca uyutulur).
Videolar (Spark) Kadraj'ın Cloudinary hesabına yüklenir; resimler (profil, hikâye, mesaj) küçültülüp veritabanında durur.
Test: `scratchpad/yd/t.js <genişlik>` (sahte Supabase istemcisi `fake.js`, `python3 -m http.server 8781`), kurallar `scratchpad/yd/rls.py` (yerel Postgres).
