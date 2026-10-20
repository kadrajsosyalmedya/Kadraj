// 6.1: ana model hata verince yedek modele geçer; ikisi de hata verirse hata fırlatır
import { _askFree } from "../src/index.js";
let ok = true;
const t = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) ok = false; };
const body = { messages: [{ role: "user", content: "merhaba" }] };
const env1 = { SMART_MODEL: "off", FREE_MODEL: "big", AI: { run: async (m) => { if (m === "big") throw new Error("quota"); return { response: "selam" }; } } };
const r1 = await _askFree(env1, body, "u1");
t(r1.data.text === "selam" && r1.data.model === "@cf/meta/llama-3.1-8b-instruct-fast", "ana model hata verince yedek model yanıt verir");
const env2 = { SMART_MODEL: "off", FREE_MODEL: "big", AI: { run: async () => { throw new Error("quota"); } } };
let threw = false;
try { await _askFree(env2, body, "u1"); } catch { threw = true; }
t(threw, "ikisi de hata verirse hata fırlatır (istemci kota mesajını görür)");
const env3 = { SMART_MODEL: "off", FREE_MODEL: "big", AI: { run: async () => ({ response: "tamam" }) } };
const r3 = await _askFree(env3, body, "u1");
t(r3.data.text === "tamam" && r3.data.model === "big", "ana model çalışıyorsa yedek kullanılmaz");
// 6.1.1: önce gpt-oss-120b (Responses biçimi), çıktı output[].content[].text içinde
const seen = [];
const env4 = { FREE_MODEL: "big", AI: { run: async (m, inp) => { seen.push(m); if (/gpt-oss/.test(m)) { t(Array.isArray(inp.input) && inp.input[0].role === "system" && inp.reasoning && !inp.messages, "gpt-oss Responses biçimiyle çağrılır"); return { output: [{ type: "reasoning", content: [{ type: "reasoning_text", text: "düşünce" }] }, { type: "message", content: [{ type: "output_text", text: "Akıllı yanıt" }] }] }; } return { response: "llama" }; } } };
const r4 = await _askFree(env4, body, "u1");
t(r4.data.text === "Akıllı yanıt" && r4.data.model === "@cf/openai/gpt-oss-120b" && seen.length === 1, "önce gpt-oss-120b, düşünce metni yanıta karışmaz");
const env5 = { FREE_MODEL: "big", AI: { run: async (m) => { if (/gpt-oss/.test(m)) throw new Error("yok"); return { response: "llama yanıtı" }; } } };
const r5 = await _askFree(env5, body, "u1");
t(r5.data.text === "llama yanıtı" && r5.data.model === "big", "gpt-oss hata verirse FREE_MODEL");
const env6 = { FREE_MODEL: "big", AI: { run: async (m) => (/gpt-oss/.test(m) ? { output_text: "kısa yol" } : { response: "x" }) } };
t((await _askFree(env6, body, "u1")).data.text === "kısa yol", "output_text alanı da okunur");
console.log(ok ? "hepsi geçti" : "HATA");
