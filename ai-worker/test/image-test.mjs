// Resim çizme testi: node test/image-test.mjs (Workers AI taklit edilir, internete bağlanmaz).
import worker, { _drawImage, _imageBlocked } from "../src/index.js";
let fail = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) fail++; };

// süzgeç
ok(!_imageBlocked("kedi çiz", false), "kedi serbest");
ok(_imageBlocked("çıplak kadın", false), "çıplaklık engellenir");
ok(_imageBlocked("NAKED man", false), "İngilizce büyük harf de engellenir");
ok(_imageBlocked("iç çamaşırlı manken", false), "ifade + ek engellenir");
ok(!_imageBlocked("seksen yaşında dede", false) && !_imageBlocked("nazik bir köpek", false) && !_imageBlocked("biraz çiçek", false) && !_imageBlocked("esrarengiz orman", false), "seksen/nazik/biraz/esrarengiz serbest");
ok(!_imageBlocked("kanlı bıçak", false), "yetişkinde kelime süzgeci kanlı bıçağı geçirir (karar çeviri modelinde)");
ok(_imageBlocked("kanlı bıçak", true) && _imageBlocked("silahlı robot", true) && _imageBlocked("uzay gemisi savaşı", true), "çocuk modunda şiddet engellenir");
ok(!_imageBlocked("kanatlı at", true) && !_imageBlocked("ejderha ve kale", true), "çocuk modunda kanatlı at, ejderha serbest");

// çizim
const B64 = btoa("\xff\xd8\xff\xe0" + "x".repeat(300));
let calls = [];
const mkEnv = (over = {}) => ({
  IMAGE_DAILY_LIMIT: "3",
  AI: {
    run: async (m, o) => {
      calls.push({ m, o });
      if (o.messages) return { response: over.en !== undefined ? over.en : "a cute orange cat, colorful illustration" };
      if (over.imgErr) throw new Error("kota");
      if (over.stream) return new ReadableStream({ start(c) { c.enqueue(new Uint8Array([0x89, 0x50, 0x4e, 0x47, ...new Array(200).fill(1)])); c.close(); } });
      return { image: B64 };
    },
  },
  ...over.env,
});
let r = await _drawImage(mkEnv(), { prompt: "turuncu bir kedi" }, "u1");
ok(r.status === 200 && r.data.image.startsWith("data:image/jpeg;base64,") && r.data.prompt.includes("cat"), "kedi çizildi, jpeg döndü");
ok(calls[1].m === "@cf/black-forest-labs/flux-1-schnell" && calls[1].o.prompt.includes("cat") && calls[1].o.steps === 4, "FLUX'a İngilizce istem gitti");
calls = [];
r = await _drawImage(mkEnv({ env: { IMAGE_MODEL: "@cf/stabilityai/stable-diffusion-xl-base-1.0" }, stream: true }), { prompt: "dağ manzarası" }, "u2");
ok(r.status === 200 && r.data.image.startsWith("data:image/png;base64,") && calls[1].m.includes("stable-diffusion"), "IMAGE_MODEL değişir, PNG akışı da okunur");
calls = [];
r = await _drawImage(mkEnv(), { prompt: "çıplak kadın" }, "u3");
ok(r.status === 400 && r.data.error === "unsafe" && calls.length === 0, "uygunsuz istem modele hiç gitmez");
r = await _drawImage(mkEnv({ en: "UNSAFE" }), { prompt: "garip bir şey" }, "u3");
ok(r.status === 400 && r.data.error === "unsafe", "çeviri UNSAFE derse çizilmez");
r = await _drawImage(mkEnv(), { prompt: "silahlı asker", child: true }, "u3");
ok(r.status === 400 && /Hayvan/.test(r.data.message), "çocuk modunda şiddet çizilmez");
r = await _drawImage(mkEnv(), { prompt: "x" }, "u3");
ok(r.status === 400 && r.data.error === "bad_request", "çok kısa istem");
r = await _drawImage(mkEnv({ imgErr: true }), { prompt: "deniz feneri" }, "u4");
ok(r.status === 502 && r.data.error === "image_failed", "model hata verirse 502");
// sınır: 3 hak; başarısız ve uygunsuz denemeler hak yemez
const env = mkEnv();
let n200 = 0, last;
for (let i = 0; i < 5; i++) { last = await _drawImage(env, { prompt: "çiçek " + i }, "u5"); if (last.status === 200) n200++; }
ok(n200 === 3 && last.status === 429 && /yarın/.test(last.data.message), "günlük sınır (3) çalışır");
const env2 = mkEnv({ imgErr: true });
for (let i = 0; i < 4; i++) await _drawImage(env2, { prompt: "kuş " + i }, "u6");
env2.AI.run = mkEnv().AI.run;
r = await _drawImage(env2, { prompt: "kuş" }, "u6");
ok(r.status === 200, "başarısız çizim hak yemez");
calls = [];
r = await _drawImage(mkEnv({ en: "" }), { prompt: "kırmızı balon" }, "u7");
ok(r.status === 200 && calls[1].o.prompt === "kırmızı balon", "çeviri boşsa asıl metin kullanılır");

// uç noktalar
const req = (path, init = {}) => new Request("https://k.workers.dev" + path, { ...init, headers: { Origin: "https://kadrajsosyalmedya.github.io", ...(init.headers || {}) } });
let res = await worker.fetch(req("/health"), { AI: {} });
let j = await res.json();
ok(j.image === true, "/health image:true (Workers AI var)");
res = await worker.fetch(req("/health"), {});
j = await res.json();
ok(j.image === false, "/health image:false (Workers AI yok)");
res = await worker.fetch(req("/image", { method: "POST", body: "{}" }), {});
ok(res.status === 501, "/image Workers AI yoksa 501");
res = await worker.fetch(req("/image", { method: "POST", body: "{}", headers: { Authorization: "Bearer bozuk" } }), { AI: {} });
ok(res.status === 401, "/image jetonsuz 401");
res = await worker.fetch(new Request("https://k.workers.dev/image", { method: "POST", body: "{}" }), { AI: {} });
ok(res.status === 403, "/image Kadraj dışından 403");

console.log(fail ? fail + " hata" : "hepsi geçti");
process.exit(fail ? 1 : 0);
