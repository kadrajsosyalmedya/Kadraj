// 6.1: ana model hata verince yedek modele geçer; ikisi de hata verirse hata fırlatır
import { _askFree } from "../src/index.js";
let ok = true;
const t = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) ok = false; };
const body = { messages: [{ role: "user", content: "merhaba" }] };
const env1 = { FREE_MODEL: "big", AI: { run: async (m) => { if (m === "big") throw new Error("quota"); return { response: "selam" }; } } };
const r1 = await _askFree(env1, body, "u1");
t(r1.data.text === "selam" && r1.data.model === "@cf/meta/llama-3.1-8b-instruct-fast", "ana model hata verince yedek model yanıt verir");
const env2 = { FREE_MODEL: "big", AI: { run: async () => { throw new Error("quota"); } } };
let threw = false;
try { await _askFree(env2, body, "u1"); } catch { threw = true; }
t(threw, "ikisi de hata verirse hata fırlatır (istemci kota mesajını görür)");
const env3 = { FREE_MODEL: "big", AI: { run: async () => ({ response: "tamam" }) } };
const r3 = await _askFree(env3, body, "u1");
t(r3.data.text === "tamam" && r3.data.model === "big", "ana model çalışıyorsa yedek kullanılmaz");
console.log(ok ? "hepsi geçti" : "HATA");
