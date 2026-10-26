/* acil.js: Kadraj acil modu (6.8.1). Firebase koparsa app.js bölge 69'daki acStart bunu yükler ve ACIL.open() çağırır.
   Supabase istemcisi acSb() (yedek/supabase.js, oturum anahtarı "kadraj-acil"), tablolar yedek/kurulum.sql sonunda:
   k_user (Kadraj uid = kuid ↔ Supabase hesabı), k_chat (cid Kadraj'daki gibi: dm-…, gr-…, meydan), k_msg (metin ya da fotoğraf).
   Ekranlar: giriş (kullanıcı adı ya da e-posta + şifre; ad → e-posta k_mail), sohbet listesi, sohbet, yeni sohbet.
   Kadraj'ın genel adlarını (esc, I, toast, cidFor, cleanText, ago, now, LS, EMBED_CFG, FBV, initialsAv) doğrudan kullanır.
   Eşleme denetimi: normal modda kaydedilen kadraj_acil_map'teki Supabase kimliği k_user'dakiyle uyuşmayan hesap "doğrulanmamış" sayılır, mesajları gösterilmez.
   Sunucu dönüşü: 45 sn'de bir Firestore REST (5xx değilse ayakta) ve gerekirse gstatic yoklanır; dönünce üstte "Kadraj'a dön". */
(() => {
"use strict";
const A = {sb: null, why: "", me: null, U: {}, C: {}, L: {}, un: {}, cur: null, msgs: [], ch: null, chk: 0, up: false, v: "list"};
const CSS = `
#acil{position:fixed;inset:0;z-index:2147483000;background:var(--bg,#0A110F);color:var(--fg,#EAF2EF);font-family:var(--f-body,system-ui),system-ui,sans-serif;display:flex;flex-direction:column;height:var(--vvh,100dvh)}
#acil *{box-sizing:border-box}
#acil .ax-ah{display:flex;align-items:center;gap:10px;padding:calc(env(safe-area-inset-top,0px) + 10px) 14px 10px;border-bottom:1px solid var(--line,#24302C);min-height:58px}
#acil .ax-ah h1{font:700 1.05rem var(--f-display,system-ui);margin:0;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#acil .ax-chip{font-size:.72rem;font-weight:700;padding:4px 9px;border-radius:99px;background:#7C2D12;color:#fff;white-space:nowrap}
#acil .ax-chip.ax-up{background:var(--accent,#0C7A63)}
#acil .ax-ib{background:none;border:0;color:inherit;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;cursor:pointer;flex:none}
#acil .ax-ib .i{width:22px;height:22px}
#acil .ax-bd{flex:1;overflow:auto;min-height:0}
#acil .ax-nt{margin:12px 14px;padding:12px;border-radius:14px;background:color-mix(in srgb,#B45309 16%,var(--surface,#131C19));font-size:.86rem;line-height:1.4}
#acil .ax-nt.ax-up{background:color-mix(in srgb,var(--accent,#0C7A63) 20%,var(--surface,#131C19));display:flex;gap:10px;align-items:center;justify-content:space-between}
#acil .ax-btn{text-align:center;border:0;border-radius:12px;padding:11px 16px;font:700 .92rem var(--f-body,system-ui);background:var(--accent,#0C7A63);color:#fff;cursor:pointer}
#acil .ax-btn.ax-sec{background:var(--surface-2,#1B2622);color:var(--fg,#EAF2EF)}#acil .ax-btn:disabled{opacity:.55}
#acil .ax-row{display:flex;align-items:center;gap:12px;padding:10px 14px;cursor:pointer;width:100%;background:none;border:0;color:inherit;text-align:left;font:inherit}
#acil .ax-row:active{background:var(--surface,#131C19)}
#acil .ax-row .ax-t{flex:1;min-width:0}#acil .ax-row b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#acil .ax-row small{display:block;color:var(--muted,#8DA39B);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#acil .ax-row.ax-un b::after{content:"";display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--accent,#0C7A63);margin-left:6px;vertical-align:middle}
#acil .ax-av{width:46px;height:46px;border-radius:14px;object-fit:cover;flex:none;background:var(--surface-2,#1B2622)}
#acil .ax-av.ax-s{width:28px;height:28px;border-radius:9px}
#acil .ax-gi{width:46px;height:46px;border-radius:14px;display:grid;place-items:center;background:var(--accent,#0C7A63);color:#fff;flex:none}
#acil .ax-sh{font-size:.74rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted,#8DA39B);padding:14px 14px 4px}
#acil .ax-em{padding:28px 20px;text-align:center;color:var(--muted,#8DA39B)}
#acil .ax-ms{flex:1;overflow:auto;min-height:0;padding:12px 10px;display:flex;flex-direction:column;gap:4px}
#acil .ax-mr{display:flex;gap:6px;align-items:flex-end}#acil .ax-mr.ax-me{flex-direction:row-reverse}
#acil .ax-b{max-width:78%;padding:8px 12px;border-radius:18px;background:var(--surface-2,#1B2622);white-space:pre-wrap;overflow-wrap:anywhere;font-size:.95rem}
#acil .ax-me .ax-b{background:var(--accent,#0C7A63);color:#fff}
#acil .ax-b small{display:block;font-size:.72rem;opacity:.75;margin-bottom:2px}#acil .ax-b img{display:block;max-width:100%;border-radius:12px}
#acil .ax-b time{display:block;font-size:.66rem;opacity:.6;margin-top:2px;text-align:right}
#acil .ax-cb{display:flex;gap:6px;align-items:flex-end;padding:8px 8px calc(env(safe-area-inset-bottom,0px) + 8px);border-top:1px solid var(--line,#24302C)}
#acil textarea,#acil input{width:100%;padding:12px;border-radius:14px;border:1px solid var(--line,#24302C);background:var(--surface,#131C19);color:inherit;font:inherit;outline:none}
#acil textarea{resize:none;min-height:46px;max-height:130px;margin:0;line-height:1.35}
#acil .ax-fm{display:grid;gap:10px;padding:18px;max-width:420px;margin:0 auto;width:100%}
#acil .ax-er{color:#F87171;font-size:.86rem;min-height:1.2em}
#acil .ax-tst{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom,0px) + 86px);background:#111;color:#fff;padding:9px 14px;border-radius:14px;font-size:.86rem;max-width:90%;z-index:2}
`;
const now_ = () => Date.now();
const ts = x => Date.parse(x) || 0;
const root = () => {let r = document.getElementById("acil"); if (!r) {const st = document.createElement("style"); st.id = "acilCss"; st.textContent = CSS; document.head.appendChild(st); r = document.createElement("div"); r.id = "acil"; r.setAttribute("role", "application"); document.body.appendChild(r)} return r};
const q = s => document.querySelector("#acil " + s);
const say = t => {const o = q(".ax-tst"); if (o) o.remove(); const d = document.createElement("div"); d.className = "ax-tst"; d.textContent = t; root().appendChild(d); setTimeout(() => d.remove(), 2600)};
const kid = () => !!(A.me && A.me.child);
const nm = k => (A.U[k] && A.U[k].name) || "Bilinmeyen";
const avSrc = k => {const u = A.U[k]; return u && typeof u.av === "string" && u.av.startsWith("data:image/") ? u.av : initialsAv(nm(k), k)};
const avImg = (k, s) => `<img class="ax-av${s ? " ax-s" : ""}" alt="" src="${esc(avSrc(k))}">`;
const chatName = c => c.cid === "meydan" ? "Meydan" : c.grp ? (c.name || "Grup") : nm((c.members || []).find(x => x !== A.me.kuid) || A.me.kuid);
const errTr = e => {const m = String((e && e.message) || e || ""); return /Invalid login/i.test(m) ? "Şifre yanlış ya da bu hesap acil mod için hazırlanmamış." : /fetch|network|Failed/i.test(m) ? "Sunucuya ulaşılamadı. İnternetini kontrol et." : /rate|too many/i.test(m) ? "Çok fazla deneme oldu, biraz bekle." : "Olmadı" + (m ? ": " + m : ".")};

async function open(o) {
  A.why = (o && o.why) || ""; A.sb = await acSb(); if (!A.sb) throw new Error("Supabase yok");
  root(); document.documentElement.classList.add("acil-on");
  clearInterval(A.chk); A.chk = setInterval(checkUp, 45000); setTimeout(checkUp, 15000);
  const s = ((await A.sb.auth.getSession()).data || {}).session;
  return s ? start(s) : login();
}

/* ---------- giriş ---------- */
function login(msg) {
  stopCh();
  root().innerHTML = `<div class="ax-ah"><h1>Kadraj</h1><span class="ax-chip">Acil mod</span></div><div class="ax-bd"><div class="ax-nt">Kadraj'ın sunucusuna şu an ulaşılamıyor. Acil modda sohbetlerine devam edebilirsin; mesajların sunucu dönünce Kadraj'a taşınır.</div>
  <form class="ax-fm" id="acL"><input id="acU" autocomplete="username" autocapitalize="off" placeholder="Kullanıcı adı ya da e-posta" value="${esc(LS.get("kadraj_last_login", "") || "")}"><input id="acP" type="password" autocomplete="current-password" placeholder="Kadraj şifren"><button class="ax-btn" id="acB">Giriş yap</button><div class="ax-er" id="acE" role="status">${esc(msg || "")}</div></form></div>`;
  q("#acL").onsubmit = async e => {
    e.preventDefault(); const id = q("#acU").value.trim(), pw = q("#acP").value, er = q("#acE"), b = q("#acB"); if (!id || !pw) {er.textContent = "Kullanıcı adını ve şifreni yaz."; return}
    b.disabled = true; er.textContent = "";
    try {
      let email = id.includes("@") ? id.toLowerCase() : null;
      if (!email) {const r = await A.sb.rpc("k_mail", {u: id.replace(/^@/, "")}); if (r.error) throw r.error; email = r.data; if (!email) {b.disabled = false; er.textContent = "Bu hesap acil mod için hazırlanmamış."; return}}
      const r = await A.sb.auth.signInWithPassword({email, password: pw}); if (r.error) throw r.error;
      await start(r.data.session);
    } catch (x) {b.disabled = false; er.textContent = errTr(x)}
  };
}

/* ---------- veriler ---------- */
async function start(session) {
  root().innerHTML = `<div class="ax-em" style="padding-top:35vh">Bağlanılıyor…</div>`;
  const sbid = session.user.id;
  const [u, c, m] = await Promise.all([A.sb.from("k_user").select("sb,kuid,un,name,av,child"), A.sb.from("k_chat").select("cid,members,grp,name,at"), A.sb.from("k_msg").select("id,cid,kuid,text,at").order("id", {ascending: false}).limit(400)]);
  for (const r of [u, c, m]) if (r.error) return login(errTr(r.error));
  const map = LS.get("kadraj_acil_map", {}) || {};
  A.U = {}; A.bad = new Set();
  for (const x of u.data) {if (map[x.kuid] && map[x.kuid] !== x.sb) {A.bad.add(x.kuid); continue} A.U[x.kuid] = x}
  A.me = u.data.find(x => x.sb === sbid) || null;
  if (!A.me) {await A.sb.auth.signOut({scope: "local"}).catch(() => {}); return login("Bu hesap acil mod için hazırlanmamış. Kadraj sunucusu dönünce Ayarlar › Uygulama › Acil mod'dan hazırlayabilirsin.")}
  A.U[A.me.kuid] = A.me;
  A.C = {}; for (const x of c.data) A.C[x.cid] = x;
  A.L = {}; for (const x of m.data) if (!A.L[x.cid] && !A.bad.has(x.kuid)) A.L[x.cid] = x;
  A.un = LS.get("kadraj_acil_rd_" + A.me.kuid, {}) || {};
  stopCh();
  A.ch = A.sb.channel("kadraj-acil")
    .on("postgres_changes", {event: "INSERT", schema: "public", table: "k_msg"}, p => onMsg(p.new))
    .on("postgres_changes", {event: "*", schema: "public", table: "k_chat"}, p => {const n = p.new; if (n && n.cid) {A.C[n.cid] = n; if (A.v === "list") list()}})
    .subscribe();
  list();
}
const stopCh = () => {if (A.ch) {A.sb.removeChannel(A.ch); A.ch = null}};
function onMsg(m) {
  if (!m || !m.cid || A.bad.has(m.kuid)) return;
  A.L[m.cid] = m; if (A.C[m.cid]) A.C[m.cid].at = m.at;
  if (A.v === "chat" && A.cur === m.cid) {if (!A.msgs.some(x => x.id === m.id)) {A.msgs.push(m); drawMsgs()} seen(m.cid); return}
  if (m.kuid !== A.me.kuid) {const c = A.C[m.cid]; if (c || m.cid === "meydan") say(`${nm(m.kuid)}: ${m.text || "Fotoğraf"}`)}
  if (A.v === "list") list();
}
const seen = cid => {A.un[cid] = now_(); LS.set("kadraj_acil_rd_" + A.me.kuid, A.un)};
const unread = cid => {const l = A.L[cid]; return l && l.kuid !== A.me.kuid && ts(l.at) > (A.un[cid] || 0)};

/* ---------- sunucu döndü mü ---------- */
async function checkUp() {
  if (A.up) return;
  let ok = false;
  try {
    if (window.ACIL_FAKE) ok = !!window.ACIL_FAKE.fbUp;
    else {
      const r = await fetch(`https://firestore.googleapis.com/v1/projects/${EMBED_CFG.projectId}/databases/(default)/documents/meta/_surum?key=${EMBED_CFG.apiKey}`, {cache: "no-store"});
      ok = r.status < 500;
      if (ok && A.why === "fb") await fetch(`https://www.gstatic.com/firebasejs/${FBV}/firebase-app.js`, {mode: "no-cors", cache: "no-store"});
    }
  } catch {ok = false}
  if (!ok) return;
  A.up = true; const h = q(".ax-ah .ax-chip"); if (h) {h.textContent = "Sunucu döndü"; h.classList.add("ax-up")}
  if (!q("#acUp")) {const d = document.createElement("div"); d.className = "ax-nt ax-up"; d.id = "acUp"; d.innerHTML = `<span>Kadraj sunucusu geri geldi.</span><button class="ax-btn" data-ac="back">Kadraj'a dön</button>`; const b = q(".ax-bd") || q(".ax-ms"); if (b) b.parentNode.insertBefore(d, b)}
}

/* ---------- ekranlar ---------- */
const head = (title, back, extra = "") => `<div class="ax-ah">${back ? `<button class="ax-ib" data-ac="list" aria-label="Geri">${I("back")}</button>` : ""}<h1>${esc(title)}</h1><span class="ax-chip${A.up ? " ax-up" : ""}">${A.up ? "Sunucu döndü" : "Acil mod"}</span>${extra}</div>${A.up ? `<div class="ax-nt ax-up" id="acUp"><span>Kadraj sunucusu geri geldi.</span><button class="ax-btn" data-ac="back">Kadraj'a dön</button></div>` : ""}`;
function list() {
  A.v = "list"; A.cur = null;
  const cs = Object.values(A.C).filter(c => c.cid !== "meydan" && (c.members || []).includes(A.me.kuid)).sort((a, b) => ts((A.L[b.cid] || b).at) - ts((A.L[a.cid] || a).at));
  const row = c => {const l = A.L[c.cid]; const pv = l ? (l.kuid === A.me.kuid ? "Sen: " : c.grp || c.cid === "meydan" ? nm(l.kuid).split(" ")[0] + ": " : "") + (l.text || "Fotoğraf") : "Henüz acil mesaj yok";
    const o = (c.members || []).find(x => x !== A.me.kuid) || A.me.kuid;
    return `<button class="ax-row${unread(c.cid) ? " ax-un" : ""}" data-ac="open" data-v="${esc(c.cid)}">${c.cid === "meydan" || c.grp ? `<span class="ax-gi">${I(c.cid === "meydan" ? "globe" : "users")}</span>` : avImg(o)}<span class="ax-t"><b>${esc(chatName(c))}</b><small>${esc(pv)}${l ? " · " + ago(ts(l.at)) : ""}</small></span></button>`};
  root().innerHTML = head("Kadraj", false, `<button class="ax-ib" data-ac="out" aria-label="Çıkış">${I("logout")}</button>`) +
    `<div class="ax-bd"><div class="ax-nt">Kadraj'ın sunucusuna şu an ulaşılamıyor. Sohbetlerin burada sürüyor; eski mesajlar burada görünmez, acil mesajların sunucu dönünce Kadraj'a taşınır.</div>
    ${kid() ? "" : row(A.C.meydan || {cid: "meydan", grp: true, at: 0})}
    <div class="ax-sh">Sohbetler</div>${cs.map(row).join("") || `<div class="ax-em">Acil modda sohbet yok.</div>`}
    ${kid() ? "" : `<div style="padding:12px 14px"><button class="ax-btn ax-sec" data-ac="new" style="width:100%">Yeni sohbet</button></div>`}</div>`;
}
function people() {
  A.v = "people";
  const us = Object.values(A.U).filter(u => u.kuid !== A.me.kuid && !u.child).sort((a, b) => (a.name || "").localeCompare(b.name || "", "tr"));
  root().innerHTML = head("Yeni sohbet", true) + `<div class="ax-bd">${us.map(u => `<button class="ax-row" data-ac="dm" data-v="${esc(u.kuid)}">${avImg(u.kuid)}<span class="ax-t"><b>${esc(u.name || "?")}</b><small>@${esc(u.un || "")}</small></span></button>`).join("") || `<div class="ax-em">Acil mod için hazırlanmış başka kimse yok.</div>`}</div>`;
}
async function dm(k) {
  const cid = cidFor(A.me.kuid, k);
  if (!A.C[cid]) {const r = await A.sb.from("k_chat").upsert({cid, members: [A.me.kuid, k].sort(), grp: false}, {onConflict: "cid"}).select().maybeSingle(); if (r.error) return say(errTr(r.error)); A.C[cid] = r.data || {cid, members: [A.me.kuid, k].sort(), grp: false, at: new Date().toISOString()}}
  openChat(cid);
}
async function openChat(cid) {
  const c = A.C[cid] || (cid === "meydan" ? {cid, grp: true} : null); if (!c) return;
  if (cid === "meydan" && kid()) return say("Çocuk Modu'nda Meydan kapalı.");
  A.v = "chat"; A.cur = cid; A.msgs = [];
  const o = !c.grp && cid !== "meydan" ? (c.members || []).find(x => x !== A.me.kuid) : null;
  root().innerHTML = head(chatName(c), true) + `<div class="ax-ms" id="acM"><div class="ax-em">Yükleniyor…</div></div>
  <form class="ax-cb" id="acS"><button class="ax-ib" type="button" data-ac="img" aria-label="Fotoğraf gönder">${I("image")}</button><textarea id="acT" rows="1" maxlength="2000" placeholder="Mesaj yaz…" autocomplete="off"></textarea><button class="ax-ib" aria-label="Gönder">${I("send")}</button></form>`;
  if (o) q(".ax-ah h1").insertAdjacentHTML("beforebegin", avImg(o, 1));
  const t = q("#acT");
  q("#acS").onsubmit = e => {e.preventDefault(); send()};
  t.onkeydown = e => {if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {e.preventDefault(); send()}};
  t.oninput = () => {t.style.height = "auto"; t.style.height = Math.min(130, t.scrollHeight + 2) + "px"};
  const r = await A.sb.from("k_msg").select("id,cid,kuid,text,img,at").eq("cid", cid).order("id", {ascending: false}).limit(200);
  if (A.cur !== cid) return;
  if (r.error) {q("#acM").innerHTML = `<div class="ax-em">${esc(errTr(r.error))}</div>`; return}
  const got = r.data.filter(m => !A.bad.has(m.kuid)).reverse();
  A.msgs = [...got, ...A.msgs.filter(m => !got.some(g => g.id === m.id))].sort((a, b) => a.id - b.id);
  seen(cid); drawMsgs(true);
}
function drawMsgs(first) {
  const m = q("#acM"); if (!m) return; const c = A.C[A.cur] || {grp: true}; const many = c.grp || A.cur === "meydan";
  const atEnd = first || m.scrollHeight - m.scrollTop - m.clientHeight < 120;
  m.innerHTML = A.msgs.map((x, i) => {const me = x.kuid === A.me.kuid, prev = A.msgs[i - 1], first_ = !prev || prev.kuid !== x.kuid;
    const img = typeof x.img === "string" && x.img.startsWith("data:image/") ? `<img alt="" src="${esc(x.img)}">` : "";
    return `<div class="ax-mr${me ? " ax-me" : ""}">${me ? "" : first_ || !many ? avImg(x.kuid, 1) : `<span style="width:28px;flex:none"></span>`}<div class="ax-b">${many && !me && first_ ? `<small>${esc(nm(x.kuid))}</small>` : ""}${img}${esc(x.text || "")}<time>${ago(ts(x.at))}</time></div></div>`}).join("")
    || `<div class="ax-em">Acil modda henüz mesaj yok. İlk mesajı sen yaz.</div>`;
  if (atEnd) m.scrollTop = m.scrollHeight;
  for (const im of m.querySelectorAll("img")) if (!im.complete) im.addEventListener("load", () => {if (atEnd) m.scrollTop = m.scrollHeight}, {once: true});
}
async function post(row) {
  const cid = A.cur; const r = await A.sb.from("k_msg").insert({cid, ...row}).select("id,cid,kuid,text,img,at").single();
  if (r.error) {say(errTr(r.error)); return false}
  if (A.cur === cid && !A.msgs.some(x => x.id === r.data.id)) {A.msgs.push(r.data); drawMsgs(true)}
  A.L[cid] = r.data; return true;
}
async function send() {
  const t = q("#acT"); let v = t.value.trim(); if (!v || !A.cur) return; if (kid() && typeof cleanText === "function") v = cleanText(v);
  t.value = ""; t.style.height = ""; if (!await post({text: v.slice(0, 2000)}) && !t.value) t.value = v;
}
function pickPhoto() {
  const i = document.createElement("input"); i.type = "file"; i.accept = "image/*"; i.style.cssText = "position:fixed;left:-999px";
  i.onchange = async () => {const f = i.files[0]; i.remove(); if (!f) return; try {await post({img: await shrink(f)})} catch (e) {say(errTr(e))}};
  document.body.appendChild(i); i.click();
}
function shrink(f) {
  return new Promise((res, rej) => {const u = URL.createObjectURL(f), im = new Image(); im.onerror = () => {URL.revokeObjectURL(u); rej(new Error("Fotoğraf açılamadı"))};
    im.onload = () => {URL.revokeObjectURL(u); let k = Math.min(1, 900 / Math.max(im.width, im.height));
      for (let n = 0; n < 5; n++) {const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(im.width * k)); c.height = Math.max(1, Math.round(im.height * k)); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        for (let qq = .82; qq > .35; qq -= .12) {const d = c.toDataURL("image/jpeg", qq); if (d.length < 150000) return res(d)} k *= .75}
      rej(new Error("Fotoğraf çok büyük"))}; im.src = u});
}

/* ---------- tıklamalar ---------- */
document.addEventListener("click", async e => {
  const b = e.target.closest("#acil [data-ac]"); if (!b) return; e.preventDefault(); const a = b.dataset.ac, v = b.dataset.v;
  if (a === "list") list(); else if (a === "open") openChat(v); else if (a === "new") people(); else if (a === "dm") dm(v); else if (a === "img") pickPhoto();
  else if (a === "back") location.reload();
  else if (a === "out") {stopCh(); await A.sb.auth.signOut({scope: "local"}).catch(() => {}); login()}
});
window.ACIL = {open, _A: A};
})();
