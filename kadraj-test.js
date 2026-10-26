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
function seedFn(){window.__ktSeed=async function(){const now=Date.now(),H=36e5,M=6e4;
 const prof=(uid,un,name,extra)=>({uid,username:un,name,bio:"",avatar:null,following:{"bot:rota":now},botFollowers:{},private:false,createdAt:now-30*24*H,...extra});
 const all={u1:now,u2:now,u3:now,u4:now,u5:now,u6:now};
 const me=prof("u1","bilal","Bilal Kara",{bio:"Kadraj testi · ajanların test hesabı",avatar:"img/sisli-dag.jpg",following:{...all,"bot:rota":now},note:{text:"Test Kadraj'ındasın",at:now}});
 const u2=prof("u2","ayse","Ayşe Yıldız",{bio:"Fotoğraf ve kahve",avatar:"img/kedi.jpg",following:{...all},close:{u1:now},music:{u:"dz:16412330",t:"Tarkan · Şımarık",s:0,d:30},note:{text:"Kahve molası kimde?",at:now-H,music:{u:"dz:66156227",t:"Barış Manço · Gülpembe",s:0}}});
 const u3=prof("u3","can","Can Demir",{bio:"Satranç ve Cephe",avatar:"img/motor.jpg",following:{...all}});
 const u4=prof("u4","zeynep","Zeynep Kaya",{bio:"LGS'ye hazırlanıyorum",following:{...all},note:{text:"Final haftası, dua edin",at:now-2*H}});
 const u5=prof("u5","mert","Mert Aydın",{bio:"Uzay meraklısı",avatar:"img/roket.jpg",following:{u1:now,u2:now}});
 const u6=prof("u6","elif","Elif Şahin",{bio:"Müzik + manzara",following:{u1:now,u4:now}});
 const ppl=[me,u2,u3,u4,u5,u6];for(const p of ppl)await DB.set("profiles/"+p.uid,p);S.uid="u1";const pm={};for(const p of ppl)pm[p.uid]=p;S.profiles={...S.profiles,...pm};
 const acc=LS.get("kadraj_accounts",{})||{};for(const p of ppl)acc[p.username]=p.uid;LS.set("kadraj_accounts",acc);LS.set("kadraj_session","u1");
 const y=new Date();y.setFullYear(y.getFullYear()-1);y.setHours(12,0,0,0);
 const posts=[["kt-p1",{uid:"u2",at:now-2*H,kind:"photo",src:"img/kahve.jpg",more:["img/kedi.jpg","img/uzay.jpg"],ar:"1/1",css:"",exif:"",caption:"Sabah kahvesi, kaydırarak bak #kahve",loc:"Kadıköy"}],
  ["kt-p2",{uid:"u3",at:now-5*H,kind:"note",text:"Akşam Cephe oynayan var mı?",bg:2,caption:"",loc:""}],
  ["kt-p3",{uid:"u2",at:now-8*H,kind:"poll",question:"Hafta sonu ne yapalım?",options:["Sinema","Piknik","Evde oyun"],caption:"",loc:""}],
  ["kt-p4",{uid:"u1",at:y.getTime(),kind:"photo",src:"img/gunbatimi.jpg",ar:"1/1",css:"",exif:"",caption:"Geçen yıl bugün",loc:""}],
  ["kt-p5",{uid:"u1",at:now-26*H,kind:"photo",src:"img/iskele.jpg",ar:"4/5",css:"",exif:"",caption:"İskele",loc:""}],
  ["kt-p6",{uid:"u5",at:now-3*H,kind:"photo",src:"img/roket.jpg",ar:"1/1",css:"",exif:"",caption:"Bu gece fırlatma var #uzay",loc:""}],
  ["kt-p7",{uid:"u4",at:now-6*H,kind:"note",text:"LGS'ye kaç gün kaldı biliyor musunuz? Keşfet'te sayaç var",bg:4,caption:"",loc:""}],
  ["kt-p8",{uid:"u6",at:now-11*H,kind:"photo",src:"img/col.jpg",ar:"4/5",css:"",exif:"",caption:"Çölde gün doğumu",loc:"Kapadokya"}]];
 for(const[id,d]of posts)await DB.set("posts/"+id,d);
 await DB.set("meta/kt-p1",{likes:{u3:now,u4:now,u5:now},comments:{kc1:{uid:"u3",text:"Kahve nerede?",at:now-90*M},kc2:{uid:"u2",text:"@can Kadıköy'de küçük bir yer",at:now-80*M,re:"kc1"},kc3:{uid:"u4",text:"Kedi çok tatlı",at:now-60*M}},pin:"kc3"});
 await DB.set("meta/kt-p5",{likes:{u2:now,u3:now},comments:{kc4:{uid:"u2",text:"Çok güzel çıkmış!",at:now-20*H}}});
 await DB.set("meta/kt-p6",{likes:{u1:now,u2:now},comments:{kc5:{uid:"u1",text:"Saat kaçta?",at:now-2*H},kc6:{uid:"u5",text:"@bilal 22.00'de",at:now-110*M,re:"kc5"}}});
 const st=[["kt-s1",{uid:"u2",at:now-H,img:"img/sisli-dag.jpg",st:[{t:"poll",q:"Bu manzara nasıl?",o:["Harika","Eh işte"],x:.5,y:.25},{t:"ask",q:"Bir sonraki yer neresi olsun?",x:.5,y:.66}]}],
  ["kt-s2",{uid:"u2",at:now-.5*H,img:"img/col.jpg",cf:1}],["kt-s3",{uid:"u3",at:now-3*H,img:"img/motor.jpg"}],
  ["kt-s4",{uid:"u5",at:now-2*H,img:"img/uzay.jpg",mus:{u:"dz:66191768",t:"Barış Manço · Gülpembe",s:0}}],["kt-s5",{uid:"u6",at:now-4*H,img:"img/gunbatimi.jpg"}]];
 for(const[id,d]of st){await DB.set("stories/"+id,d);S.stories={...S.stories,[id]:{id,...d}}}
 const chat=async(cid,members,ms,extra={})=>{const t0=now-(ms.length+3)*M*3;const last=ms[ms.length-1];const lt=t0+ms.length*M*3;
  await DB.set("chats/"+cid,{members,updatedAt:lt,last:{text:last[1]||"Fotoğraf",from:last[0],at:lt},reads:extra.reads||Object.fromEntries(members.map(u=>[u,lt])),...(extra.doc||{})});
  for(let i=0;i<ms.length;i++){const[f,t,o]=ms[i];await DB.set(`chats/${cid}/msgs/kt${i}`,{from:f,text:t||"",at:t0+(i+1)*M*3,...(o||{})})}};
 await chat(cidFor("u1","u2"),["u1","u2"],[["u2","Selam, Kadraj testine hoş geldin"],["u2","Burada her şeyi deneyebilirsin, ben de cevap veririm"],["u1","Gerçek hesaplara bir şey gider mi?"],["u2","Hayır, hepsi bu sayfada kalıyor"],["u2","",{img:"img/kahve.jpg"}],["u1","Kahve güzelmiş",{reacts:{u2:"heart"}}],["u2","Bir oyun da açabilirsin: + › Oyunlar"]]);
 await chat(cidFor("u1","u3"),["u1","u3"],[["u3","Akşam satranç?"],["u1","Olur, kaçta?"],["u3","21.00 gibi"],["u1","Tamam, bu sefer kazanacağım"],["u3","Göreceğiz"]]);
 await chat(cidFor("u1","u4"),["u1","u4"],[["u4","Matematik ödevini yaptın mı?"],["u4","3. soruyu anlamadım"],["u4","Bakabilir misin?"]],{reads:{u4:now,u1:now-10*H}});
 await chat(cidFor("u1","u5"),["u1","u5"],[["u5","Fırlatmayı izledin mi?"],["u1","Evet, inanılmazdı"],["u5","",{img:"img/roket.jpg"}],["u5","Fotoğrafını çektim"]]);
 await chat("gr-kttest",["u1","u2","u3","u4","u5"],[["u3","Test grubuna hoş geldiniz"],["u2","Selam herkese"],["u4","Hafta sonu buluşalım mı?"],["u5","Ben varım"],["u1","Ben de"],["u2","Cumartesi 14.00?"],["u3","Tamamdır"]],{doc:{group:1,name:"Kadraj ekibi",createdBy:"u1"}});
 await enterApp(false)}}
/* canlı arkadaşlar: sandbox'ta mesaj atınca karşı taraf görür, yazıyor… gösterir ve yanıt verir; kişi değiştir (Bilal, Ayşe, Can …) */
function liveFn(){const pick=a=>a[Math.floor(Math.random()*a.length)];const HUM=["u1","u2","u3","u4","u5","u6"];
 const reply=(t,p)=>{t=String(t||"").toLocaleLowerCase("tr");if(p&&p.img)return pick(["Çok güzel çıkmış!","Bu fotoğraf harika","Nerede çektin?"]);if(p&&p.audio)return "Sesli mesajını dinledim";
  const hi=/(^|\s)(selam|merhaba|hey|slm|sa)(\s|$|[!,.])/.test(t);
  if(/nasılsın|naber|ne haber|napıyorsun|ne yapıyorsun/.test(t))return(hi?"Selam! ":"")+pick(["İyiyim, sen nasılsın?","Ders çalışıyorum, sen?","Biraz yorgunum ama iyiyim"]);
  if(hi)return pick(["Selam! Nasılsın?","Selaam, ne var ne yok?","Merhaba!"]);
  if(/lgs|sınav|ders|ödev|okul/.test(t))return pick(["LGS'ye az kaldı, çalışmamız lazım","Ödevi bitirdin mi?","Okul ne zaman bitecek ya"]);
  if(/oyun|satranç|cephe|xox|kelime/.test(t))return pick(["Olur, bir el oynayalım!","Satrançta seni yenerim","Cephe'de bu sefer ben kazanırım"]);
  if(/\?\s*$/.test(t))return pick(["Bilmiyorum ya, sen ne dersin?","Bence evet","Hmm, düşüneyim"]);
  return pick(["Haha","Aynen","Çok iyi","Tamam","Olur","Gerçekten mi?","Süper"])};
 const plan=(key,p)=>{let k;try{k=keyInfo(key)}catch{return}if(!k||!k.cid)return;let who=null;
  if(k.type==="dm"&&HUM.includes(k.uid)&&k.uid!==S.uid)who=k.uid;else if(k.type==="group"){const c=S.chats[k.cid];const ms=((c&&c.members)||[]).filter(u=>u!==S.uid&&HUM.includes(u));if(ms.length)who=pick(ms)}
  if(!who)return;const cid=k.cid,me=S.uid,text=reply(p&&p.text,p);
  setTimeout(async()=>{if(S.uid!==me)return;try{await DB.update("chats/"+cid,{reads:{[who]:Date.now()}})}catch{}
   const end=Date.now()+1400+Math.min(2600,text.length*70);const ty=setInterval(()=>{if(Date.now()>end||S.uid!==me){clearInterval(ty);if(S.typing[who]===cid){delete S.typing[who];scheduleRefresh()}return}if(S.typing[who]!==cid){S.typing={...S.typing,[who]:cid};scheduleRefresh()}},200);
   setTimeout(async()=>{if(S.uid!==me)return;const at=Date.now();try{await DB.set(`chats/${cid}/msgs/kl${at}`,{from:who,text,at});await DB.update("chats/"+cid,{last:{text,from:who,at},updatedAt:at,reads:{[who]:at}})}catch(e){console.warn(e)}},end-Date.now()+50)},900)};
 const hook=()=>{if(typeof sendMessage!=="function"||sendMessage._kt)return false;const f=sendMessage;sendMessage=async function(key,payload,...r){const ok=await f.call(this,key,payload,...r);try{if(ok)plan(key,payload||{})}catch{}return ok};sendMessage._kt=1;return true};
 window.__ktAs=async function(uid){if(!S.profiles[uid])return;closeAll();endSession();S.uid=uid;S.authed=true;LS.set("kadraj_session",uid);await startSession(false);hook();toast(P(uid).name+" olarak bakıyorsun")};
 addEventListener("message",e=>{const d=e.data||{};if(d.kt==="as"&&typeof d.uid==="string")window.__ktAs(d.uid)});
 const iv=setInterval(()=>{if(hook())clearInterval(iv)},300)}
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
 await step("Okunmadı işaretle (6.2)",async()=>{tab("chats");await W(300);chatRowMenu("u:u3");await W(300)},()=>[...document.querySelectorAll('#overlay [data-layer="crow"] .opt')].some(b=>/Okun(ma)?dı olarak/.test(b.textContent))?true:"menü satırı yok");
 await step("Okul sayacı (6.3)",async()=>{S.q="";S.srMode=false;tab("explore");await W(400)},()=>document.querySelectorAll("#main .okc .okc-i").length>=2?true:"sayaç yok");
 await step("Sohbet › Oyunlar (6.4.6)",async()=>{tab("chats");await W(400);$('#top [data-act="games"]').click();await W(300)},()=>document.querySelectorAll('#overlay [data-layer="games"] [data-gm]').length===3?true:"oyun kutucukları yok");
 await step("+ menüsü Oyunlar (6.3)",async()=>{go("chat",{key:"u:u2"});await W(500);plusMenu();await W(300)},()=>$("#pgm")&&!$("#pch")&&!$("#pog")?true:"Oyunlar satırı yok");
 await step("Notta şarkı (6.3)",async()=>{tab("chats");await W(300);openNote();await W(300)},has(".nm-row"));
 await step("Yorum yanıtı (6.4)",async()=>{const id=(allPosts().find(p=>p.uid==="u1")||{}).id;if(!id)throw new Error("paylaşım yok");await setMeta(id,{comments:{ktc1:{uid:"u2",text:"Çok güzel olmuş",at:now()}}});openComments(id);await W(400);const b=$("[data-crep]");if(!b)throw new Error("Yanıtla düğmesi yok");b.click();await W(200)},()=>$(".cm-rb")&&!$(".cm-rb").hidden?true:"yanıt şeridi yok");
 await step("Şarkı arama (6.4.10)",async()=>{closeAll&&closeAll();await W(200);nmPick(null,()=>{});await W(400)},has('#overlay [data-layer="nmp"] #itQ'));
 await step("Sohbette şarkı (6.5)",async()=>{closeAll&&closeAll();openChat("u:u2");await W(600);plusMenu();await W(300)},has('#overlay [data-layer="plus"] #psong'));
 await step("Grupta anket (6.5)",async()=>{closeAll&&closeAll();const g=Object.keys(S.chats).find(c=>S.chats[c].group);if(!g)throw new Error("grup yok");openChat("g:"+g);await W(600);plusMenu();await W(300);$("#pgpoll").click();await W(300)},has('#overlay [data-layer="gpoll"] #gpQ'));
 await step("Doğum günü (6.5)",async()=>{closeAll&&closeAll();go("edit");await W(500);$("#bdEdit").click();await W(300)},has('#overlay [data-layer="bday"] #bdM'));
 await step("Klakete şarkı (6.5)",async()=>{closeAll&&closeAll();S.cmp={kind:"reel",filter:0,ar:"1/1",slides:["img/kahve.jpg"],fx:"zoom",music:"lofi",text:"",bg:0,options:["",""],mode:"slides"};drawComposer();await W(400)},has("#rSong"));
 await step("Özel günler (6.6)",async()=>{closeAll&&closeAll();GUN.prev={id:"29ekim"};tab("feed");await W(700)},()=>{const ok=!!document.querySelector("#main .gnc.milli [data-gns]");GUN.prev=null;document.querySelectorAll("#main .gnc,.gconf").forEach(e=>e.remove());return ok||"29 Ekim kartı yok"});
 await step("Tanıtım bağlantısı (6.6)",()=>{},()=>/tanitim\.html$/.test(tanitimUrl())&&/tanitim\.html/.test(inviteText())?true:"tanıtım bağlantısı yok");
 await step("Yeniden paylaş (6.7)",async()=>{closeAll&&closeAll();tab("feed");await W(500)},has("#main [data-rp]"));
 await step("Günün sorusu (6.7)",async()=>{LS.del("kadraj_gq_"+S.uid);tab("feed");await W(500)},has("#main .gqc"));
 await step("Koleksiyonlar (6.7)",async()=>{const id=(allPosts().find(p=>p.uid!==S.uid&&!BOT[p.uid])||{}).id;if(!id)throw new Error("paylaşım yok");postMenu(id);await W(300)},has('#overlay [data-layer="menu"] #mKol'));
 await step("Kadraj kodu (6.7)",async()=>{closeAll&&closeAll();qrSheet(S.uid);await W(300)},has('#overlay [data-layer="qr"] #qrBox canvas'));
 await step("Sessiz mod (6.7)",async()=>{closeAll&&closeAll();qmSheet();await W(300)},has('#overlay [data-layer="qm"] [data-qmv]'));
 await step("Zaman kapsülü ve etiket (6.7)",async()=>{closeAll&&closeAll();const c=document.createElement("canvas");c.width=400;c.height=400;S.cmp={kind:"photo",filter:0,ar:"1/1",slides:[],fx:"zoom",music:"lofi",text:"",bg:0,options:["",""],mode:"slides",img:c,src:"img/kahve.jpg"};drawComposer();await W(400)},()=>$("#cCapT")&&$("#cTagB")?true:"kapsül/etiket yok");
 await step("Hikâye test çıkartması (6.7)",async()=>{closeAll&&closeAll();const c=document.createElement("canvas");c.width=720;c.height=1280;S.cmp={kind:"story",filter:0,ar:"1/1",slides:[],fx:"zoom",music:"lofi",text:"",bg:0,options:["",""],mode:"slides",img:c,src:null};drawComposer();await W(400);$("#cStk").click();await W(300)},has('#overlay [data-stt="quiz"]'));
 await step("Kurgu düğmesi (6.8)",async()=>{closeAll&&closeAll();const f=new File([new Uint8Array(16)],"deneme.webm",{type:"video/webm"});S.cmp={kind:"reel",filter:0,ar:"1/1",slides:[],fx:"zoom",music:"lofi",text:"",bg:0,options:["",""],mode:"video",video:f,videoUrl:URL.createObjectURL(f)};drawComposer();await W(400)},has('#overlay #vKed[data-act="kurgu"]'));
 await step("Hikâyede müzik (6.4)",async()=>{const c=document.createElement("canvas");c.width=720;c.height=1280;S.cmp={kind:"story",filter:0,ar:"1/1",slides:[],fx:"zoom",music:"lofi",text:"",bg:0,options:["",""],mode:"slides",img:c,src:null};drawComposer();await W(400)},has("#cMus"));
 await step("Ayarlar 6.4 satırları",async()=>{tab("settings");await W(400);$("#k64T").click();await W(300)},has('#overlay [data-layer="tm"] .tm-c'));
 await step("Satranç",()=>go("chess"),()=>$("#main").children.length?true:"boş");
 await step("Rota",()=>go("chat",{key:"u:bot:rota"}),has("#msgs"));
 removeEventListener("error",onE);removeEventListener("unhandledrejection",onE);tab("feed");
 parent.postMessage({kt:"sonuc",out,ver:APP_FULL},"*")};
 addEventListener("message",e=>{if(e.data&&e.data.kt==="calistir"&&window.__ktRun)window.__ktRun()})}
/* ---------- iframe hazırlığı ---------- */
async function build(){const r=await fetch("index.html?_kt="+Date.now(),{cache:"no-store"});if(!r.ok)throw new Error("index.html indirilemedi ("+r.status+")");let h=archPrep(await archInline(await r.text(),async f=>{const a=await fetch(f+"?_kt="+Date.now(),{cache:"no-store"});if(!a.ok)throw new Error(f+" indirilemedi ("+a.status+")");return a.text()}));
 const o=location.origin;h=h.replace("script-src 'unsafe-inline' 'unsafe-eval' blob: data:","script-src 'unsafe-inline' 'unsafe-eval' blob: data: "+o);
 const inj=`<script>(${seedFn.toString()})();(${runFn.toString()})();(${liveFn.toString()})();<\/script>`;h=h.replace(/<\/head>/i,inj+"</head>");
 const i=h.lastIndexOf("bootLocal();");if(i>0)h=h.slice(0,i)+"bootLocal().then(()=>window.__ktSeed&&window.__ktSeed()).then(()=>parent.postMessage({kt:'hazir'},'*'));"+h.slice(i+12);return h}
function frame(html,hidden){const u=URL.createObjectURL(new Blob([html],{type:"text/html"}));const f=document.createElement("iframe");f.src=u;f.title="Kadraj testi";f.setAttribute("sandbox","allow-scripts allow-forms allow-modals allow-popups");f.style.cssText=hidden?"position:fixed;left:-10000px;top:0;width:390px;height:844px;border:0":"flex:1;width:100%;border:0;background:#fff";f._u=u;return f}
X.open=async function(){const l=openLayer("ktest",`<div class="full" role="dialog" aria-label="Kadraj testi"><div class="hd"><button class="ib plain" data-act="close" aria-label="Kapat">${I("back")}</button><h1>Kadraj testi</h1><span class="muted" style="font-size:.78rem;margin-left:auto">demo · gerçek veriye dokunmaz</span></div><div class="kt-as" id="ktAs" style="display:flex;align-items:center;gap:6px;padding:6px 12px 8px;overflow-x:auto;flex:none;font-size:.8rem"><span class="muted" style="white-space:nowrap">Kimin gözünden:</span>${[["u1","Bilal"],["u2","Ayşe"],["u3","Can"],["u4","Zeynep"]].map(([u,n],i)=>`<button type="button" class="chip" data-ktas="${u}" aria-pressed="${!i}">${n}</button>`).join("")}</div><div class="body" id="ktB" style="padding:0;flex:1;display:flex;min-height:0"><div class="vbusy" style="margin:auto"><span class="spin"></span><b>Test Kadraj'ı hazırlanıyor</b></div></div></div>`,{noScrim:true,onClose:()=>{const f=l&&l.querySelector("iframe");if(f&&f._u)URL.revokeObjectURL(f._u)}});
 let h;try{h=await build()}catch(e){const b=$("#ktB",l);if(b)b.innerHTML=`<div class="empty" style="margin:auto"><b>Açılamadı</b>${esc((e&&e.message)||"")}</div>`;return}const b=$("#ktB",l);if(!b)return;b.innerHTML="";const f=frame(h,false);b.appendChild(f);const as=$("#ktAs",l);if(as)as.onclick=e=>{const c=e.target.closest("[data-ktas]");if(!c)return;try{f.contentWindow.postMessage({kt:"as",uid:c.dataset.ktas},"*")}catch{}as.querySelectorAll("[data-ktas]").forEach(x=>x.setAttribute("aria-pressed",String(x===c)))}};
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
