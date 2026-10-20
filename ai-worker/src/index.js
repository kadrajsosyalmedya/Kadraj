// Kadraj yapay zekâ köprüsü (Cloudflare Worker)
// - Anthropic API anahtarı yalnızca Cloudflare'de "Secret" olarak durur (ANTHROPIC_API_KEY); sitede ya da GitHub'da görünmez.
// - Yalnızca Kadraj'a giriş yapmış kişilerin isteklerini kabul eder: her istekte Firebase kimlik jetonu doğrulanır.
// - Kişi başına günlük sınır vardır (DAILY_LIMIT). Asıl harcama sınırını Anthropic Console > Limits'ten koy.
import Anthropic from "@anthropic-ai/sdk";
import { handlePush, vapidKeys } from "./push.js";

const JWKS_URL_DEFAULT = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
const MAX_MESSAGES = 24;
const MAX_CHARS = 60000;
const MAX_IMAGE_B64 = 1_500_000;

let jwksCache = { keys: null, at: 0 };
const usage = new Map(); // uid -> {day, n, recent: number[]}  (her Worker kopyasında ayrı tutulur; kaba bir sınır)

const enc = new TextEncoder();
function b64urlBytes(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function b64urlJson(s) {
  return JSON.parse(new TextDecoder().decode(b64urlBytes(s)));
}

async function googleKeys(env, force) {
  if (!force && jwksCache.keys && Date.now() - jwksCache.at < 3600e3) return jwksCache.keys;
  const r = await fetch(env.JWKS_URL || JWKS_URL_DEFAULT);
  if (!r.ok) throw new Error("jwks");
  const j = await r.json();
  jwksCache = { keys: j.keys || [], at: Date.now() };
  return jwksCache.keys;
}

// Firebase kimlik jetonunu doğrular, kişinin uid'sini döndürür.
async function verifyFirebase(token, env) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) throw new Error("token");
  const [h, p, s] = parts;
  const header = b64urlJson(h);
  const payload = b64urlJson(p);
  if (header.alg !== "RS256" || !header.kid) throw new Error("token");
  let keys = await googleKeys(env, false);
  let jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) {
    keys = await googleKeys(env, true);
    jwk = keys.find((k) => k.kid === header.kid);
  }
  if (!jwk) throw new Error("token");
  const key = await crypto.subtle.importKey("jwk", { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", ext: true }, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64urlBytes(s), enc.encode(h + "." + p));
  if (!ok) throw new Error("token");
  const project = env.FIREBASE_PROJECT || "kadraj-6f1e0";
  const nowS = Math.floor(Date.now() / 1000);
  if (payload.aud !== project || payload.iss !== "https://securetoken.google.com/" + project) throw new Error("token");
  if (!(payload.exp > nowS) || !(payload.iat <= nowS + 300) || !payload.sub) throw new Error("token");
  return payload.sub;
}

function allowedOrigin(req, env) {
  const origin = req.headers.get("Origin") || "";
  const list = String(env.ALLOWED_ORIGINS || "https://kadrajsosyalmedya.github.io").split(",").map((x) => x.trim()).filter(Boolean);
  return list.includes(origin) ? origin : "";
}
function cors(origin) {
  const h = { "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Authorization, Content-Type", "Access-Control-Max-Age": "86400", Vary: "Origin" };
  if (origin) h["Access-Control-Allow-Origin"] = origin;
  return h;
}
function json(obj, status, origin) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...cors(origin) } });
}

// Kişi başına: 10 dakikada en fazla 20, günde en fazla DAILY_LIMIT istek.
function takeQuota(uid, env) {
  const day = new Date().toISOString().slice(0, 10);
  const lim = Math.max(1, parseInt(env.DAILY_LIMIT || "60", 10) || 60);
  let u = usage.get(uid);
  if (!u || u.day !== day) u = { day, n: 0, recent: [] };
  const t = Date.now();
  u.recent = u.recent.filter((x) => t - x < 600e3);
  if (u.n >= lim || u.recent.length >= 20) {
    usage.set(uid, u);
    return false;
  }
  u.n++;
  u.recent.push(t);
  usage.set(uid, u);
  if (usage.size > 5000) usage.clear();
  return true;
}

// 5.1 bildirimler: kişi başına 10 dakikada en fazla 80, günde en fazla PUSH_DAILY_LIMIT (varsayılan 600) gönderim isteği.
const pushUsage = new Map();
function takePushQuota(uid, env) {
  const day = new Date().toISOString().slice(0, 10);
  const lim = Math.max(1, parseInt(env.PUSH_DAILY_LIMIT || "600", 10) || 600);
  let u = pushUsage.get(uid);
  if (!u || u.day !== day) u = { day, n: 0, recent: [] };
  const t = Date.now();
  u.recent = u.recent.filter((x) => t - x < 600e3);
  if (u.n >= lim || u.recent.length >= 80) {
    pushUsage.set(uid, u);
    return false;
  }
  u.n++;
  u.recent.push(t);
  pushUsage.set(uid, u);
  if (pushUsage.size > 5000) pushUsage.clear();
  return true;
}

// 5.1.1 İnternet araması (ücretsiz yol): TAVILY_API_KEY varsa genel bilgi soruları Tavily ile aranır (ayda 1000 ücretsiz arama).
// İstemci "search" alanında ya true ya da kişinin asıl sorusunu (metin) gönderir. Metinse yalnızca soru gibi görünen ve
// Kadraj'ın kendisiyle ilgili olmayan mesajlarda aranır; kota boşa gitmesin diye kişi başına günde SEARCH_DAILY_LIMIT (varsayılan 20).
const Q_HINT = /\?|(^|[\s,.;:'"(])(kim|kimdir|kimin|ne zaman|nedir|ne demek|kaç|kaçta|hangi|nerede|nereye|nereden|neden|niçin|niye|haber|bugün|dün|yarın|güncel|son durum|fiyat|hava durumu|skor|maç|sonuç|kazandı|kaybetti|öldü|doğdu|başkent|nüfus|tarihi|ne oldu|araştır|internette)/i;
const APP_HINT = /kadraj|klaket|flick|hikâye|hikaye|profil|ayar|takip|sohbet|bildirim|şifre|tema|rota|clawd|meydan|satranç|anket|yönetici|paylaş|uygulama|beğen|yorum/i;
function lastUserText(messages) {
  for (let i = (messages || []).length - 1; i >= 0; i--) if (messages[i].role === "user") return flatText(messages[i].content);
  return "";
}
function searchQuery(body, messages) {
  const s = body.search;
  if (typeof s === "string") {
    const q = s.replace(/\s+/g, " ").trim().slice(0, 380);
    if (q.length < 6 || APP_HINT.test(q) || !Q_HINT.test(q)) return "";
    return q;
  }
  if (s === true) return lastUserText(messages).replace(/\s+/g, " ").trim().slice(0, 380);
  return "";
}
const searchUsage = new Map();
function takeSearchQuota(uid, env) {
  const day = new Date().toISOString().slice(0, 10);
  const lim = Math.max(0, parseInt(env.SEARCH_DAILY_LIMIT || "20", 10) || 0);
  let u = searchUsage.get(uid);
  if (!u || u.day !== day) u = { day, n: 0 };
  if (u.n >= lim) return false;
  u.n++;
  searchUsage.set(uid, u);
  if (searchUsage.size > 5000) searchUsage.clear();
  return true;
}
async function tavily(env, q, fetcher = fetch) {
  const r = await fetcher("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + String(env.TAVILY_API_KEY).trim() },
    body: JSON.stringify({ query: q, search_depth: "basic", max_results: 5, include_answer: false }),
  });
  if (!r.ok) return [];
  const j = await r.json();
  return (Array.isArray(j && j.results) ? j.results : [])
    .filter((x) => x && /^https?:\/\//.test(String(x.url || "")))
    .slice(0, 5)
    .map((x) => ({ title: String(x.title || x.url).slice(0, 160), url: String(x.url), content: String(x.content || "").replace(/\s+/g, " ").slice(0, 700) }));
}
function hostOf(u) {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

// İstemciden gelen mesajları sıkıca denetler (yalnızca metin ve küçük resimler).
function cleanMessages(raw) {
  if (!Array.isArray(raw) || !raw.length || raw.length > MAX_MESSAGES) return null;
  let chars = 0;
  const out = [];
  for (const m of raw) {
    if (!m || (m.role !== "user" && m.role !== "assistant")) return null;
    if (typeof m.content === "string") {
      if (!m.content.trim()) continue;
      chars += m.content.length;
      out.push({ role: m.role, content: m.content });
      continue;
    }
    if (!Array.isArray(m.content)) return null;
    const blocks = [];
    for (const b of m.content) {
      if (b && b.type === "text" && typeof b.text === "string") {
        chars += b.text.length;
        blocks.push({ type: "text", text: b.text });
      } else if (m.role === "user" && b && b.type === "image" && b.source && b.source.type === "base64" && /^image\/(jpeg|png|webp|gif)$/.test(b.source.media_type) && typeof b.source.data === "string" && b.source.data.length <= MAX_IMAGE_B64) {
        blocks.push({ type: "image", source: { type: "base64", media_type: b.source.media_type, data: b.source.data } });
      } else return null;
    }
    if (blocks.length) out.push({ role: m.role, content: blocks });
  }
  if (!out.length || out[0].role !== "user" || chars > MAX_CHARS) return null;
  return out;
}

function supportsDynamicSearch(model) {
  return /^claude-(opus-5|opus-4-[678]|sonnet-5|sonnet-4-6|fable-5)/.test(model);
}
function supportsDefaultFallback(model) {
  return /^claude-(opus-5|fable-5|sonnet-5-5)/.test(model);
}

// Ücretsiz yol: Anthropic anahtarı yoksa Cloudflare Workers AI (açık kaynaklı model, günlük ücretsiz kota, anahtar gerekmez).
function flatText(c) {
  if (typeof c === "string") return c;
  return (c || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
}
// Ücretsiz yolda metin modeli fotoğraf göremez. Son kullanıcı mesajında fotoğraf varsa önce bir görsel modeline betimletilir,
// betimleme sisteme eklenir. Modeller sırayla denenir (Cloudflare model kaldırırsa sıradaki çalışır; VISION_MODEL ile değiştirilebilir).
const VISION_MODELS = ["@cf/google/gemma-4-26b-a4b-it", "@cf/meta/llama-4-scout-17b-16e-instruct", "@cf/llava-hf/llava-1.5-7b-hf"];
const VISION_PROMPT = "Describe this photo factually in 3-5 sentences: the main subject, the setting, colors, mood and any visible text. Do not guess names of people.";
function lastImage(messages) {
  const m = messages[messages.length - 1];
  if (!m || m.role !== "user" || !Array.isArray(m.content)) return null;
  const b = m.content.find((x) => x.type === "image");
  return b ? b.source : null;
}
async function describeImage(env, src) {
  const list = env.VISION_MODEL ? [String(env.VISION_MODEL), ...VISION_MODELS] : VISION_MODELS;
  for (const model of list) {
    try {
      let r;
      if (/llava/.test(model)) {
        const bin = atob(src.data);
        const bytes = new Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        r = await env.AI.run(model, { image: bytes, prompt: VISION_PROMPT, max_tokens: 300 });
      } else {
        r = await env.AI.run(model, {
          messages: [{ role: "user", content: [{ type: "text", text: VISION_PROMPT }, { type: "image_url", image_url: { url: "data:" + src.media_type + ";base64," + src.data } }] }],
          max_tokens: 300,
        });
      }
      const t = String((r && (r.description ?? r.response ?? r.result?.response ?? r.choices?.[0]?.message?.content)) || "").trim();
      if (t) return t.slice(0, 1500);
    } catch {}
  }
  return "";
}
async function askFree(env, body, uid, fetcher = fetch) {
  const messages = cleanMessages(body.messages);
  if (!messages) return { status: 400, data: { error: "bad_request", message: "İstek biçimi hatalı." } };
  const model = String(env.FREE_MODEL || "@cf/meta/llama-3.3-70b-instruct-fp8-fast");
  let sys = (typeof body.system === "string" ? body.system.slice(0, 20000) + "\n\n" : "") + "Her zaman Türkçe yanıt ver.";
  let sources = [];
  const q = env.TAVILY_API_KEY ? searchQuery(body, messages) : "";
  if (q && takeSearchQuota(uid || "?", env)) {
    try {
      const res = await tavily(env, q, fetcher);
      if (res.length) {
        sources = res.map((x) => ({ title: x.title, url: x.url }));
        sys +=
          "\n\nİnternet araması sonuçları (bugünün tarihi " + new Date().toISOString().slice(0, 10) + "). Soruyu bu sonuçlara dayanarak, kısa ve doğru yanıtla; sonuçlarda yoksa bilmediğini söyle, uydurma. " +
          "Yanıtın sonuna yeni satırda \"Kaynak:\" yazıp en fazla iki sitenin yalnızca adını yaz (bağlantı yazma).\n" +
          res.map((x, i) => "[" + (i + 1) + "] " + x.title + " (" + hostOf(x.url) + ")\n" + x.content).join("\n\n");
      }
    } catch {}
  }
  const img = lastImage(messages);
  let saw = false;
  if (img) {
    const desc = await describeImage(env, img);
    if (desc) {
      saw = true;
      sys += "\n\nKişinin gönderdiği fotoğrafın betimlemesi (görsel modelinden, İngilizce):\n" + desc + "\nYanıtını bu betimlemeye dayandır; betimlemede olmayan ayrıntı uydurma.";
    } else {
      sys += "\n\nKişi bir fotoğraf gönderdi ama şu an fotoğrafı göremiyorsun. Fotoğrafta ne olduğuna dair hiçbir ayrıntı uydurma; içerikten bağımsız, genel bir yanıt ver.";
    }
  }
  const msgs = [{ role: "system", content: sys }, ...messages.map((m) => ({ role: m.role, content: flatText(m.content) }))];
  const r = await env.AI.run(model, { messages: msgs, max_tokens: 900 });
  const text = String((r && (r.response ?? r.result?.response)) || "").trim();
  return { status: 200, data: { text, sources, model, provider: "free", searched: !!sources.length, ...(img ? { saw } : {}) } };
}

// 6.1 Rota resim çizer (POST /image, yalnızca Workers AI, ücretsiz). İstem önce süzülür (uygunsuz istek ve çocuk modu),
// metin modeliyle kısa İngilizce görsel istemine çevrilir, sonra görsel modeli (IMAGE_MODEL, varsayılan FLUX.1 schnell) çizer.
// Kişi başına günde IMAGE_DAILY_LIMIT (varsayılan 10) resim, 10 dakikada en fazla 5. Başarısız çizim hakkı yemez.
const IMAGE_MODEL_DEFAULT = "@cf/black-forest-labs/flux-1-schnell";
// Süzgeç: metin küçük harfe çevrilir, Türkçe harfler sadeleşir (ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u), kelimelere bölünür.
// STEM: kelime bununla başlıyorsa; WORD: kelime tam buysa (kısa kelimeler: "seksen", "nazik", "biraz", "kanat" yanlışlıkla engellenmesin); PHRASE: metinde geçiyorsa.
const IMG_STEM = ["porn", "nsfw", "nude", "naked", "nudit", "erotik", "erotic", "hentai", "fetis", "fetish", "ciplak", "ustsuz", "topless", "lingerie", "orgy", "orgazm", "penis", "vajina", "vagina", "genital", "tecavuz", "rape", "taciz", "molest", "vahset", "dismember", "decapitat", "beheading", "mutilat", "tortur", "iskence", "intihar", "suicide", "katliam", "massacre", "teror", "terrorist", "swastika", "kokain", "cocaine", "eroin", "heroin", "uyusturucu", "marijuana"];
const IMG_WORD = ["sex", "sexy", "seks", "seksi", "gore", "gory", "nazi", "naziler", "nazis", "kkk", "isis", "isid", "meth", "weed", "esrar", "bikini"];
const IMG_PHRASE = ["ic camasir", "kesik bas", "self harm", "kendine zarar", "bomba yap", "bomb making", "gamali hac"];
const KID_STEM = ["silah", "tabanca", "tufek", "bicak", "kilic", "rifle", "pistol", "knife", "sword", "weapon", "kanli", "blood", "korku", "korkunc", "horror", "scary", "zombi", "zombie", "death", "corpse", "ceset", "iskelet", "skeleton", "seytan", "demon", "devil", "savas", "kavga", "fight", "dovus", "sigara", "cigarette", "alkol", "alcohol", "sarap", "opus", "opucuk", "kiss"];
const KID_WORD = ["gun", "guns", "kan", "olu", "olum", "dead", "war", "wars", "bira", "beer", "wine"];
function foldTr(t) {
  return String(t || "").toLocaleLowerCase("tr").replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u").replace(/â/g, "a").replace(/î/g, "i").replace(/û/g, "u");
}
function imageBlocked(text, child) {
  const words = foldTr(text).split(/[^a-z0-9]+/).filter(Boolean);
  const hit = (stems, list) => words.some((w) => list.includes(w) || stems.some((st) => w.startsWith(st)));
  const flat = " " + words.join(" ") + " ";
  // ifadenin son kelimesi ek alabilir (ör. "iç çamaşırlı")
  if (hit(IMG_STEM, IMG_WORD) || IMG_PHRASE.some((p) => flat.includes(" " + p))) return true;
  if (child && hit(KID_STEM, KID_WORD)) return true;
  return false;
}
const imageUsage = new Map();
function takeImageQuota(uid, env) {
  const day = new Date().toISOString().slice(0, 10);
  const lim = Math.max(0, parseInt(env.IMAGE_DAILY_LIMIT || "10", 10) || 0);
  let u = imageUsage.get(uid);
  if (!u || u.day !== day) u = { day, n: 0, recent: [] };
  const t = Date.now();
  u.recent = u.recent.filter((x) => t - x < 600e3);
  if (u.n >= lim || u.recent.length >= 5) {
    imageUsage.set(uid, u);
    return false;
  }
  u.n++;
  u.recent.push(t);
  imageUsage.set(uid, u);
  if (imageUsage.size > 5000) imageUsage.clear();
  return true;
}
function giveBackImageQuota(uid) {
  const u = imageUsage.get(uid);
  if (u && u.n > 0) {
    u.n--;
    u.recent.pop();
  }
}
const TRANSLATE_SYS =
  "You turn a Turkish drawing request into a short English prompt for an image generator. Output ONLY the prompt, one line, at most 40 words, no quotes. " +
  "Keep the subject and details the user asked for; you may add a short style hint (for example: colorful illustration) if no style was given. " +
  "If the request asks for sexual, nude, violent, gory, hateful or illegal content, or for a real private person, output exactly: UNSAFE";
async function toEnglishPrompt(env, text, child) {
  const model = String(env.FREE_MODEL || "@cf/meta/llama-3.3-70b-instruct-fp8-fast");
  const sys = TRANSLATE_SYS + (child ? " The user is a child: if the request is scary, violent or not suitable for children, output exactly: UNSAFE" : "");
  try {
    const r = await env.AI.run(model, { messages: [{ role: "system", content: sys }, { role: "user", content: text }], max_tokens: 120 });
    let en = String((r && (r.response ?? r.result?.response)) || "").replace(/\s+/g, " ").trim().replace(/^["'“”]+|["'“”]+$/g, "");
    en = en.replace(/^(prompt|english prompt)\s*:\s*/i, "").slice(0, 400);
    return en;
  } catch {
    return "";
  }
}
function bytesB64(u8) {
  let s = "";
  for (let i = 0; i < u8.length; i += 32768) s += String.fromCharCode.apply(null, u8.subarray(i, i + 32768));
  return btoa(s);
}
// FLUX { image: base64 jpeg } verir; Stable Diffusion türü modeller PNG akışı (ReadableStream) ya da bayt verir.
async function imageOut(r) {
  if (r && typeof r.image === "string" && r.image.length > 100) {
    const d = r.image.replace(/^data:[^,]+,/, "");
    return { mime: d.startsWith("iVBOR") ? "image/png" : "image/jpeg", b64: d };
  }
  let buf = null;
  if (r instanceof ArrayBuffer) buf = new Uint8Array(r);
  else if (r instanceof Uint8Array) buf = r;
  else if (r && typeof r.getReader === "function") buf = new Uint8Array(await new Response(r).arrayBuffer());
  if (!buf || buf.length < 100) return null;
  const png = buf[0] === 0x89 && buf[1] === 0x50;
  return { mime: png ? "image/png" : "image/jpeg", b64: bytesB64(buf) };
}
async function drawImage(env, body, uid) {
  const raw = typeof body.prompt === "string" ? body.prompt.replace(/\s+/g, " ").trim() : "";
  const child = !!body.child;
  if (raw.length < 2 || raw.length > 400) return { status: 400, data: { error: "bad_request", message: "Ne çizeyim? Kısaca yaz (ör. kedi çiz)." } };
  if (imageBlocked(raw, child)) return { status: 400, data: { error: "unsafe", message: child ? "Bunu çizemem. Hayvan, doğa, uzay ya da sevdiğin bir oyuncak gibi başka bir şey iste." : "Bu isteği çizemem. Başka bir şey iste." } };
  if (!takeImageQuota(uid, env)) return { status: 429, data: { error: "rate_limited", message: "Bugünlük resim hakkın doldu, yarın yine çizerim." } };
  let en = await toEnglishPrompt(env, raw, child);
  if (/^UNSAFE\b/i.test(en) || imageBlocked(en, child)) {
    giveBackImageQuota(uid);
    return { status: 400, data: { error: "unsafe", message: child ? "Bunu çizemem. Hayvan, doğa, uzay ya da sevdiğin bir oyuncak gibi başka bir şey iste." : "Bu isteği çizemem. Başka bir şey iste." } };
  }
  if (!en) en = raw;
  const model = String(env.IMAGE_MODEL || IMAGE_MODEL_DEFAULT);
  let out = null;
  try {
    const r = await env.AI.run(model, /flux/.test(model) ? { prompt: en, steps: 4 } : { prompt: en, num_steps: 20 });
    out = await imageOut(r);
  } catch {
    out = null;
  }
  if (!out) {
    giveBackImageQuota(uid);
    return { status: 502, data: { error: "image_failed", message: "Resim çizilemedi; ücretsiz kota dolmuş olabilir, birazdan tekrar dene." } };
  }
  return { status: 200, data: { image: "data:" + out.mime + ";base64," + out.b64, prompt: en, model } };
}

async function ask(env, body) {
  const model = String(env.MODEL || "claude-opus-5-5");
  const effort = ["low", "medium", "high", "xhigh", "max"].includes(env.EFFORT) ? env.EFFORT : "low";
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, ...(env.ANTHROPIC_BASE_URL ? { baseURL: env.ANTHROPIC_BASE_URL } : {}) });
  const messages = cleanMessages(body.messages);
  if (!messages) return { status: 400, data: { error: "bad_request", message: "İstek biçimi hatalı." } };
  const system = typeof body.system === "string" ? body.system.slice(0, 40000) : undefined;
  const params = {
    model,
    max_tokens: 16000,
    output_config: { effort },
    messages,
    ...(system ? { system } : {}),
  };
  if (searchQuery(body, messages)) {
    params.tools = [supportsDynamicSearch(model) ? { type: "web_search_20260209", name: "web_search", max_uses: 3 } : { type: "web_search_20250305", name: "web_search", max_uses: 3 }];
  }
  const fallback = supportsDefaultFallback(model);
  const call = (p) => (fallback ? client.beta.messages.create({ ...p, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" }) : client.messages.create(p));

  let resp = await call(params);
  // Web araması uzun sürerse sunucu "pause_turn" ile durur; kaldığı yerden devam ettir.
  for (let i = 0; i < 4 && resp.stop_reason === "pause_turn"; i++) {
    resp = await call({ ...params, messages: [...messages, { role: "assistant", content: resp.content }] });
  }
  if (resp.stop_reason === "refusal") {
    return { status: 200, data: { text: "", refusal: true, category: (resp.stop_details && resp.stop_details.category) || null, model: resp.model } };
  }
  let text = "";
  const sources = [];
  for (const b of resp.content || []) {
    if (b.type === "text") text += b.text;
    else if (b.type === "web_search_tool_result" && Array.isArray(b.content)) {
      for (const r of b.content) if (r && r.url && sources.length < 6 && !sources.some((s) => s.url === r.url)) sources.push({ title: r.title || r.url, url: r.url });
    }
  }
  return { status: 200, data: { text: text.trim(), sources, model: resp.model, stop: resp.stop_reason, provider: "claude" } };
}

export default {
  async fetch(req, env, ctx) {
    const origin = allowedOrigin(req, env);
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { status: origin ? 204 : 403, headers: cors(origin) });
    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
      const free = !env.ANTHROPIC_API_KEY && !!env.AI;
      return json({ ok: true, name: "kadraj-ai", provider: env.ANTHROPIC_API_KEY ? "claude" : free ? "free" : "none", model: env.ANTHROPIC_API_KEY ? String(env.MODEL || "claude-opus-5-5") : free ? String(env.FREE_MODEL || "@cf/meta/llama-3.3-70b-instruct-fp8-fast") : "", key: !!(env.ANTHROPIC_API_KEY || env.AI), push: !!(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY), search: !!(env.ANTHROPIC_API_KEY || env.TAVILY_API_KEY), image: !!env.AI }, 200, origin);
    }
    // 5.1: Web Push açık anahtarı (tarayıcı aboneliği için applicationServerKey)
    if (req.method === "GET" && url.pathname === "/vapid") {
      if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return json({ error: "no_vapid", message: "Köprüde VAPID anahtarları yok. KURULUM.md'deki bildirim adımlarını yap." }, 501, origin);
      try {
        const k = await vapidKeys(env);
        return json({ key: k.pub }, 200, origin);
      } catch (e) {
        return json({ error: "bad_vapid", message: "VAPID anahtarları hatalı ya da birbirini tutmuyor (" + String((e && e.message) || "") + ")." }, 500, origin);
      }
    }
    // 5.1: uygulama kapalıyken bildirim gönder (gönderenin Firebase oturumu gerekir)
    if (req.method === "POST" && url.pathname === "/push") {
      if (!origin) return json({ error: "origin", message: "Bu adres yalnızca Kadraj'dan kullanılabilir." }, 403, origin);
      if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return json({ error: "no_vapid", message: "Köprüde VAPID anahtarları yok." }, 501, origin);
      let puid;
      try {
        puid = await verifyFirebase((req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, ""), env);
      } catch {
        return json({ error: "auth", message: "Kadraj'a giriş yapmış olman gerekiyor." }, 401, origin);
      }
      if (!takePushQuota(puid, env)) return json({ error: "rate_limited", message: "Çok fazla bildirim gönderildi, biraz bekle." }, 429, origin);
      let pb;
      try {
        pb = await req.json();
      } catch {
        return json({ error: "bad_request", message: "İstek okunamadı." }, 400, origin);
      }
      // 5.1.5: "delay" (1-10 sn) verilirse yanıt hemen döner, gönderim beklenip arka planda yapılır (test bildirimi: uygulamayı kapatmaya zaman kalsın).
      const delay = Math.min(10, Math.max(0, Math.floor(Number(pb && pb.delay) || 0)));
      if (delay && ctx && typeof ctx.waitUntil === "function") {
        ctx.waitUntil(new Promise((res) => setTimeout(res, delay * 1000)).then(() => handlePush(pb || {}, puid, env)).catch(() => {}));
        return json({ ok: true, queued: true, delay }, 202, origin);
      }
      try {
        const r = await handlePush(pb || {}, puid, env);
        return json(r.data, r.status, origin);
      } catch (e) {
        return json({ error: "push", message: "Bildirim gönderilemedi (" + String((e && e.message) || "") + ")." }, 500, origin);
      }
    }
    // 6.1: Rota resim çizer (Workers AI, Anthropic anahtarı olsa da ücretsiz görsel modeli kullanılır)
    if (req.method === "POST" && url.pathname === "/image") {
      if (!origin) return json({ error: "origin", message: "Bu adres yalnızca Kadraj'dan kullanılabilir." }, 403, origin);
      if (!env.AI) return json({ error: "no_image", message: "Köprüde Workers AI bağlantısı yok; resim çizilemiyor." }, 501, origin);
      let iuid;
      try {
        iuid = await verifyFirebase((req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, ""), env);
      } catch {
        return json({ error: "auth", message: "Kadraj'a giriş yapmış olman gerekiyor." }, 401, origin);
      }
      let ib;
      try {
        ib = await req.json();
      } catch {
        return json({ error: "bad_request", message: "İstek okunamadı." }, 400, origin);
      }
      try {
        const r = await drawImage(env, ib || {}, iuid);
        return json(r.data, r.status, origin);
      } catch {
        return json({ error: "image_failed", message: "Resim çizilemedi, birazdan tekrar dene." }, 502, origin);
      }
    }
    if (req.method !== "POST" || url.pathname !== "/ask") return json({ error: "not_found" }, 404, origin);
    if (!origin) return json({ error: "origin", message: "Bu adres yalnızca Kadraj'dan kullanılabilir." }, 403, origin);
    if (!env.ANTHROPIC_API_KEY && !env.AI) return json({ error: "no_key", message: "Köprüde ne ANTHROPIC_API_KEY ne de Workers AI bağlantısı var." }, 500, origin);

    let uid;
    try {
      uid = await verifyFirebase((req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, ""), env);
    } catch {
      return json({ error: "auth", message: "Kadraj'a giriş yapmış olman gerekiyor." }, 401, origin);
    }
    if (!takeQuota(uid, env)) return json({ error: "rate_limited", message: "Bugünlük soru hakkın doldu, yarın yine gel." }, 429, origin);

    let body;
    try {
      body = await req.json();
    } catch {
      return json({ error: "bad_request", message: "İstek okunamadı." }, 400, origin);
    }
    try {
      const r = env.ANTHROPIC_API_KEY ? await ask(env, body || {}) : await askFree(env, body || {}, uid);
      return json(r.data, r.status, origin);
    } catch (e) {
      if (e instanceof Anthropic.AuthenticationError) return json({ error: "api_key", message: "API anahtarı geçersiz. Cloudflare'deki ANTHROPIC_API_KEY değerini kontrol et." }, 502, origin);
      if (e instanceof Anthropic.PermissionDeniedError) return json({ error: "api_permission", message: "API hesabının bu modele izni yok ya da kredisi bitmiş." }, 502, origin);
      if (e instanceof Anthropic.RateLimitError) return json({ error: "rate_limited", message: "Yapay zekâ şu an çok yoğun, birazdan tekrar dene." }, 429, origin);
      if (e instanceof Anthropic.BadRequestError) return json({ error: "api_bad_request", message: "Yapay zekâ isteği kabul etmedi: " + String(e.message || "").slice(0, 200) }, 502, origin);
      if (e instanceof Anthropic.APIConnectionError) return json({ error: "api_connection", message: "Yapay zekâ hizmetine bağlanılamadı, birazdan tekrar dene." }, 502, origin);
      if (e instanceof Anthropic.APIError && e.status === 402) return json({ error: "api_billing", message: "Anthropic hesabında kredi kalmamış. Console > Billing'den kredi ekle." }, 502, origin);
      if (e instanceof Anthropic.APIError) return json({ error: "api", status: e.status || 0, message: "Yapay zekâ hizmeti yanıt vermedi (" + (e.status || "bağlantı") + ")." }, 502, origin);
      if (!env.ANTHROPIC_API_KEY) return json({ error: "free_ai", message: "Ücretsiz yapay zekâ yanıt vermedi; günlük ücretsiz kota dolmuş olabilir, yarın tekrar dene." }, 502, origin);
      return json({ error: "server", message: "Köprüde beklenmeyen bir hata oldu." }, 500, origin);
    }
  },
};

// Testler için (test/search-test.mjs); Worker yalnızca default dışa aktarımı kullanır.
export { askFree as _askFree, searchQuery as _searchQuery, drawImage as _drawImage, imageBlocked as _imageBlocked };
