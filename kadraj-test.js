/* Kadraj testi (6.1.4, yalnızca Yönetici paneli › Kadraj testi; index.html bölge 61TEST bu dosyayı ilk kullanımda yükler, window.KTEST).
   Sahibi gerçek test hesabını sildirdi, "yönetici paneline Kadraj testi ekle, siz orada ajanlarla test yapın" dedi.
   - KTEST.open(): sitenin şu anki index.html'i indirilir, sürüm arşivinin archPrep'iyle (ağ kapalı CSP, bellekte localStorage, service worker yok, boot → bootLocal)
     sandbox iframe'de açılır. Önce __ktSeed çalışır: ajanların testlerdeki demo dünyası (Bilal Kara = sen, Ayşe Yıldız, Can Demir; paylaşımlar,
     çıkartmalı hikâye, yakın arkadaş hikâyesi, bir yıl önceki paylaşım, sohbetler). Gerçek hesaplara ve Firebase'e hiçbir şey gitmez; kapatınca silinir.
   - KTEST.run(box): aynı sandbox gizli açılır, __ktRun adımları (sekmeler, sohbet, mesaj gönderme, hikâye, oluştur, çıkartma, ayarlar…) sırayla
     yürütülür, her adımda sayfa hatası ve boş ekran denetlenir; sonuç postMessage ile gelir ve listelenir.
   - KTEST.report(box): ajanların scratchpad testlerinin özeti testler/rapor.json (her yayında güncellenir). */
(()=>{"use strict";if(window.KTEST)return;const X={};window.KTEST=X;
/* ---------- iframe içinde çalışan kod (Kadraj'ın genel adlarını kullanır) ---------- */
function seedFn(){window.__ktSeed=async function(){const now=Date.now(),H=36e5;
 const prof=(uid,un,name,extra)=>({uid,username:un,name,bio:"",avatar:null,following:{"bot:rota":now},botFollowers:{},private:false,createdAt:now-30*24*H,...extra});
 const me=prof("u1","bilal","Bilal Kara",{bio:"Kadraj testi · ajanların test hesabı",following:{"bot:rota":now,u2:now,u3:now},note:{text:"Test Kadraj'ındasın",at:now}});
 const u2=prof("u2","ayse","Ayşe Yıldız",{bio:"Fotoğraf ve kahve",following:{u1:now},close:{u1:now},music:{u:"yt:cpp69ghR1IM",t:"Tarkan · Şımarık",s:45,d:0}});
 const u3=prof("u3","can","Can Demir",{bio:"Satranç ve Cephe",following:{u1:now}});
 for(const p of[me,u2,u3])await DB.set("profiles/"+p.uid,p);S.uid="u1";S.profiles={...S.profiles,u1:me,u2,u3};
 const acc=LS.get("kadraj_accounts",{})||{};acc.bilal="u1";LS.set("kadraj_accounts",acc);LS.set("kadraj_session","u1");
 const y=new Date();y.setFullYear(y.getFullYear()-1);y.setHours(12,0,0,0);
 const posts=[["kt-p1",{uid:"u2",at:now-2*H,kind:"photo",src:"img/kahve.jpg",more:["img/kedi.jpg","img/uzay.jpg"],ar:"1/1",css:"",exif:"",caption:"Sabah kahvesi, kaydırarak bak #kahve",loc:"Kadıköy"}],
  ["kt-p2",{uid:"u3",at:now-5*H,kind:"note",text:"Akşam Cephe oynayan var mı?",bg:2,caption:"",loc:""}],
  ["kt-p3",{uid:"u2",at:now-8*H,kind:"poll",question:"Hafta sonu ne yapalım?",options:["Sinema","Piknik","Evde oyun"],caption:"",loc:""}],
  ["kt-p4",{uid:"u1",at:y.getTime(),kind:"photo",src:"img/gunbatimi.jpg",ar:"1/1",css:"",exif:"",caption:"Geçen yıl bugün",loc:""}],
  ["kt-p5",{uid:"u1",at:now-26*H,kind:"photo",src:"img/iskele.jpg",ar:"4/5",css:"",exif:"",caption:"İskele",loc:""}]];
 for(const[id,d]of posts)await DB.set("posts/"+id,d);
 const st=[["kt-s1",{uid:"u2",at:now-H,img:"img/sisli-dag.jpg",st:[{t:"poll",q:"Bu manzara nasıl?",o:["Harika","Eh işte"],x:.5,y:.25},{t:"ask",q:"Bir sonraki yer neresi olsun?",x:.5,y:.66}]}],
  ["kt-s2",{uid:"u2",at:now-.5*H,img:"img/col.jpg",cf:1}],["kt-s3",{uid:"u3",at:now-3*H,img:"img/motor.jpg"}]];
 for(const[id,d]of st){await DB.set("stories/"+id,d);S.stories={...S.stories,[id]:{id,...d}}}
 const cid=cidFor("u1","u2"),t0=now-40*6e4;const ms=[["u2","Selam, Kadraj testine hoş geldin"],["u2","Burada her şeyi deneyebilirsin"],["u1","Gerçek hesaplara bir şey gider mi?"],["u2","Hayır, hepsi bu sayfada kalıyor"],["u2","Kapatınca silinir"],["u1","Süper"],["u2","Bir oyun da açabilirsin: + › Oyun oyna"]];
 await DB.set("chats/"+cid,{members:["u1","u2"],updatedAt:t0+ms.length*6e4,last:{text:ms[ms.length-1][1],from:"u2",at:t0+ms.length*6e4},reads:{u2:t0+5*6e4}});
 for(let i=0;i<ms.length;i++)await DB.set(`chats/${cid}/msgs/kt${i}`,{from:ms[i][0],text:ms[i][1],at:t0+(i+1)*6e4});
 const gid="gr-kttest";await DB.set("chats/"+gid,{members:["u1","u2","u3"],group:1,name:"Kadraj ekibi",createdBy:"u1",updatedAt:now-10*6e4,last:{text:"Test grubuna hoş geldiniz",from:"u3",at:now-10*6e4}});
 await DB.set(`chats/${gid}/msgs/g1`,{from:"u3",text:"Test grubuna hoş geldiniz",at:now-10*6e4});
 await enterApp(false)}}
function runFn(){window.__ktRun=async function(){const out=[];const errs=[];const W=ms=>new Promise(r=>setTimeout(r,ms));
 const onE=e=>errs.push(String(e&&(e.message||e.reason&&e.reason.message||e.reason)||"hata"));addEventListener("error",onE);addEventListener("unhandledrejection",onE);
 const step=async(ad,fn,chk)=>{const n=errs.length;let ok=true,not="";try{await fn();await W(450);if(chk){const c=await chk();if(c!==true){ok=false;not=c||"beklenen görünmedi"}}}catch(e){ok=false;not=String(e&&e.message||e)}
  if(errs.length>n){ok=false;not=(not?not+" · ":"")+errs.slice(n).join(" | ").slice(0,200)}out.push({ad,ok,not});try{closeAll()}catch{}await W(150)};
 const has=sel=>()=>document.querySelector(sel)?true:sel+" yok";
 await step("Akış",()=>tab("feed"),()=>document.querySelector("#main .card,#main .stories")?true:"kart yok");
 await step("Anılar kartı",()=>{tab("explore");tab("feed")},has(".memc"));
 await step("Çoklu fotoğraf",()=>tab("feed"),has(".phc-tr"));
 await step("Keşfet ve arama",async()=>{tab("explore");await W(300);const q=$("#q");q.value="ayse";q.dispatchEvent(new Event("input",{bubbles:true}))},has("#main [data-prof]"));
 await step("Klaketler",()=>tab("reels"),has("#main .reel"));
 await step("Bildirimler",()=>tab("activity"),()=>$("#main").children.length?true:"boş");
 await step("Sohbet listesi",()=>tab("chats"),has("#main [data-crow],#main [data-chat]"));
 await step("Sohbet açma",()=>go("chat",{key:"u:u2"}),has("#msgs .mrow"));
 await step("DM profil fotoğrafı",()=>go("chat",{key:"u:u2"}),has("#msgs .dmav"));
 await step("Mesaj gönderme",async()=>{go("chat",{key:"u:u2"});await W(300);await sendMessage("u:u2",{text:"Hızlı test mesajı"})},()=>[...document.querySelectorAll("#msgs .msg")].some(m=>/Hızlı test mesajı/.test(m.textContent))?true:"mesaj görünmedi");
 await step("Grup sohbeti",()=>go("chat",{key:"g:gr-kttest"}),has("#msgs .mrow"));
 await step("Hikâye ve çıkartmalar",()=>openStories("u2"),()=>document.querySelectorAll(".svst .stk").length>=2?true:"çıkartma yok");
 await step("Yakın Arkadaşlar halkası",()=>tab("feed"),()=>storyRing("u2")==="ring cf"||storyRing("u2")==="ring seen"?true:"halka: "+storyRing("u2"));
 await step("Hikâye oluştur + çıkartma",async()=>{const cv=document.createElement("canvas");cv.width=72;cv.height=128;const img=await loadImg(cv.toDataURL());S.cmp={kind:"story",filter:0,ar:"1/1",slides:[],fx:"zoom",music:"lofi",text:"",bg:0,options:["",""],mode:"slides",img,src:null,st:[{t:"time",v:"12:00",x:360,y:860,s:1},{t:"poll",q:"Test",o:["A","B"],x:360,y:330,s:1}]};drawComposer()},has("#cCv"));
 await step("Not yazma kutusu",()=>openNote(),()=>{const n=$("#nIn");return n&&n.classList.contains("kce")&&n.isContentEditable?true:"not kutusu yok"});
 await step("Fotoğraf seçici ve kütüphane",()=>{kmpOpen({})},has('[data-src="lib"]'));
 await step("Profil",()=>tab("profile"),has("#main .prof"));
 await step("Başkasının profili ve müzik",()=>go("profile",{uid:"u2"}),has(".pmus"));
 await step("Profili düzenle",()=>go("edit"),has("#pmEdit"));
 await step("Ayarlar",()=>tab("settings"),has("#cfEntry"));
 await step("Taslaklar (6.2)",async()=>{tab("settings");await W(300);$("#k62D").click();await W(400)},has('#overlay [data-layer="dft"]'));
 await step("Hikâye arşivi (6.2)",async()=>{tab("settings");await W(300);$("#k62A").click();await W(400)},has('#overlay [data-layer="ars"]'));
 await step("Okunmadı işaretle (6.2)",async()=>{tab("chats");await W(300);chatRowMenu("u:u2");await W(300)},()=>[...document.querySelectorAll('#overlay [data-layer="crow"] .opt')].some(b=>/Okun(ma)?dı olarak/.test(b.textContent))?true:"menü satırı yok");
 await step("Okul sayacı (6.3)",async()=>{S.q="";S.srMode=false;tab("explore");await W(400)},()=>document.querySelectorAll("#main .okc .okc-i").length>=2?true:"sayaç yok");
 await step("Ayarlar › Oyunlar (6.3)",async()=>{tab("settings");await W(400);$("#k63G button").click();await W(300)},()=>document.querySelectorAll('#overlay [data-layer="games"] [data-gm]').length===3?true:"oyun kutucukları yok");
 await step("+ menüsü Oyunlar (6.3)",async()=>{go("chat",{key:"u:u2"});await W(500);plusMenu();await W(300)},()=>$("#pgm")&&!$("#pch")&&!$("#pog")?true:"Oyunlar satırı yok");
 await step("Notta şarkı (6.3)",async()=>{tab("chats");await W(300);openNote();await W(300)},has(".nm-row"));
 await step("Satranç",()=>go("chess"),()=>$("#main").children.length?true:"boş");
 await step("Rota",()=>go("chat",{key:"u:bot:rota"}),has("#msgs"));
 removeEventListener("error",onE);removeEventListener("unhandledrejection",onE);tab("feed");
 parent.postMessage({kt:"sonuc",out,ver:APP_FULL},"*")};
 addEventListener("message",e=>{if(e.data&&e.data.kt==="calistir"&&window.__ktRun)window.__ktRun()})}
/* ---------- iframe hazırlığı ---------- */
async function build(){const r=await fetch("index.html?_kt="+Date.now(),{cache:"no-store"});if(!r.ok)throw new Error("index.html indirilemedi ("+r.status+")");let h=archPrep(await r.text());
 const o=location.origin;h=h.replace("script-src 'unsafe-inline' 'unsafe-eval' blob: data:","script-src 'unsafe-inline' 'unsafe-eval' blob: data: "+o).replace("default-src 'none';","default-src 'none'; frame-src https://www.youtube-nocookie.com;").replace("img-src data: blob: "+o,"img-src data: blob: "+o+" https://i.ytimg.com");
 const inj=`<script>(${seedFn.toString()})();(${runFn.toString()})();<\/script>`;h=h.replace(/<\/head>/i,inj+"</head>");
 const i=h.lastIndexOf("bootLocal();");if(i>0)h=h.slice(0,i)+"bootLocal().then(()=>window.__ktSeed&&window.__ktSeed()).then(()=>parent.postMessage({kt:'hazir'},'*'));"+h.slice(i+12);return h}
function frame(html,hidden){const u=URL.createObjectURL(new Blob([html],{type:"text/html"}));const f=document.createElement("iframe");f.src=u;f.title="Kadraj testi";f.setAttribute("sandbox","allow-scripts allow-forms allow-modals allow-popups");f.style.cssText=hidden?"position:fixed;left:-10000px;top:0;width:390px;height:844px;border:0":"flex:1;width:100%;border:0;background:#fff";f._u=u;return f}
X.open=async function(){const l=openLayer("ktest",`<div class="full" role="dialog" aria-label="Kadraj testi"><div class="hd"><button class="ib plain" data-act="close" aria-label="Kapat">${I("back")}</button><h1>Kadraj testi</h1><span class="muted" style="font-size:.78rem;margin-left:auto">demo · gerçek veriye dokunmaz</span></div><div class="body" id="ktB" style="padding:0;flex:1;display:flex;min-height:0"><div class="vbusy" style="margin:auto"><span class="spin"></span><b>Test Kadraj'ı hazırlanıyor</b></div></div></div>`,{noScrim:true,onClose:()=>{const f=l&&l.querySelector("iframe");if(f&&f._u)URL.revokeObjectURL(f._u)}});
 let h;try{h=await build()}catch(e){const b=$("#ktB",l);if(b)b.innerHTML=`<div class="empty" style="margin:auto"><b>Açılamadı</b>${esc((e&&e.message)||"")}</div>`;return}const b=$("#ktB",l);if(!b)return;b.innerHTML="";b.appendChild(frame(h,false))};
X.run=async function(box){if(X._busy)return;X._busy=true;box.innerHTML=`<div class="kt-busy"><span class="spin"></span>Hızlı test çalışıyor (yaklaşık 30 sn)…</div>`;let f=null,done=false;
 const fin=(html)=>{if(done)return;done=true;X._busy=false;removeEventListener("message",on);clearTimeout(to);if(f){if(f._u)URL.revokeObjectURL(f._u);f.remove()}box.innerHTML=html};
 const on=e=>{if(!f||e.source!==f.contentWindow||!e.data)return;if(e.data.kt==="hazir")setTimeout(()=>{try{f.contentWindow.postMessage({kt:"calistir"},"*")}catch{}},600);
  if(e.data.kt==="sonuc"){const out=Array.isArray(e.data.out)?e.data.out:[];const bad=out.filter(x=>!x.ok).length;
   fin(`<div class="kt-sum ${bad?"bad":"ok"}">${I(bad?"info":"check")}<b>${bad?bad+" adım sorunlu":"Hepsi geçti"}</b><span>${out.length} adım · ${esc(String(e.data.ver||""))} · ${new Date().toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"})}</span></div><div class="kt-list">${out.map(x=>`<div class="kt-row ${x.ok?"ok":"bad"}">${I(x.ok?"check":"close")}<span><b>${esc(String(x.ad))}</b>${x.not?`<small>${esc(String(x.not))}</small>`:""}</span></div>`).join("")}</div>`)}};
 addEventListener("message",on);const to=setTimeout(()=>fin(`<div class="kt-sum bad">${I("info")}<b>Test zaman aşımına uğradı</b><span>Sayfa 90 sn içinde yanıt vermedi.</span></div>`),90000);
 try{f=frame(await build(),true);document.body.appendChild(f)}catch(e){fin(`<div class="kt-sum bad">${I("info")}<b>Başlatılamadı</b><span>${esc((e&&e.message)||"")}</span></div>`)}};
X.report=async function(box){box.innerHTML=`<div class="muted" style="font-size:.84rem">Rapor indiriliyor…</div>`;let d=null;try{const r=await fetch("testler/rapor.json?_="+Date.now(),{cache:"no-store"});if(r.ok)d=await r.json()}catch{}
 if(!d||!Array.isArray(d.items)){box.innerHTML=`<div class="muted" style="font-size:.84rem">Henüz ajan raporu yok.</div>`;return}const bad=d.items.filter(x=>!x.ok).length;
 box.innerHTML=`<div class="kt-sum ${bad?"bad":"ok"}">${I(bad?"info":"check")}<b>${esc(String(d.title||"Ajan testleri"))}</b><span>${esc(String(d.ver||""))} · ${esc(String(d.at||""))} · ${d.items.length} test${bad?`, ${bad} sorunlu`:", hepsi geçti"}</span></div>${d.note?`<p class="muted" style="margin:6px 0 8px;font-size:.82rem;line-height:1.45">${esc(String(d.note))}</p>`:""}<div class="kt-list">${d.items.map(x=>`<div class="kt-row ${x.ok?"ok":"bad"}">${I(x.ok?"check":"close")}<span><b>${esc(String(x.ad||""))}</b>${x.not?`<small>${esc(String(x.not))}</small>`:""}</span></div>`).join("")}</div>`};
})();
