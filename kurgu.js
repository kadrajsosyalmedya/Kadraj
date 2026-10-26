/* Kadraj Kurgu (6.8 Meltem): Klaket video düzenleyici. app.js bölge 68'deki kgLoad ilk kullanımda yükler; window.KURGU.open(file, ed) →
   Promise<{file, ed, poster} | null>. Kadraj'ın genel adlarını (S, $, I, esc, toast, sheet, stAsk, FILTERS, cldOn, CLD, vib, openLayer,
   closeLayer) doğrudan kullanır (const olanlar window'da yok).
   Düzenleme ed = {s, e (kaynak saniyesi, kesim), r (hız 0.5-3), f (FILTERS sırası), fm ("o" orijinal | "916" | "11" | "45"), mute,
   tx:[{id, t, x, y (0-1), c (renk), st ("p" düz | "b" kutulu | "s" gölgeli), z ("s"|"m"|"l"), a ("0"|"fade"|"pop"|"type"|"up"), from, to
   (kaynak saniyesi)}], cv (kapak karesi, kaynak saniyesi | null)}.
   Önizleme ve dışa aktarma aynı çizim fonksiyonunu (frame) kullanır: ne görürsen o çıkar. Dışa aktarma compressVideo gibi: video seçilen
   yerden seçilen hızla oynatılır, her kare tuvale (filtre + yazılar) çizilir, captureStream + MediaRecorder kaydeder; ses WebAudio ile alınır
   (sessizse ses izi yok). Çıkış süresi (e-s)/r, en çok maxOut saniye; bit hızı boyut sınırına göre. Kapak kayıt sırasında cv anında yakalanır. */
(()=>{"use strict";
const FMT=[["o","Orijinal",0],["916","9:16",9/16],["45","4:5",4/5],["11","1:1",1]];
const SPD=[.5,1,1.5,2,3];
const COL=["#ffffff","#111111","#FFD43B","#FF4D4F","#22C55E","#3B82F6","#EC4899","#A855F7"];
const STY=[["s","Gölgeli"],["b","Kutulu"],["p","Çerçeveli"]];
const SZ=[["s","Küçük",.034],["m","Orta",.048],["l","Büyük",.068]];
const ANI=[["0","Yok"],["fade","Belir"],["pop","Zıpla"],["type","Daktilo"],["up","Kay"]];
const FONT="Figtree, 'Avenir Next', system-ui, sans-serif";
const TABS=[["cut","Kes","eraser"],["spd","Hız","next"],["txt","Yazı","type"],["flt","Filtre","spark"],["fmt","Format","grid"],["snd","Ses","vol"],["cov","Kapak","image"]];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const tf=x=>{x=Math.max(0,+x||0);const m=Math.floor(x/60),s=x-m*60;return m+":"+(s<10?"0":"")+s.toFixed(1)};
const light=c=>{const h=String(c).replace("#","");if(h.length<6)return true;const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);return r*.299+g*.587+b*.114>160};
const fmtA=(fm,vw,vh)=>{const f=FMT.find(x=>x[0]===fm);return f&&f[2]?f[2]:(vw&&vh?vw/vh:9/16)};
function dims(vw,vh,fm,max){const A=fmtA(fm,vw,vh);let W,H;if(A<1){H=max;W=Math.round(H*A/2)*2}else{W=max;H=Math.round(W/A/2)*2}return[W,H]}
function crop(vw,vh,A){const sa=vw/vh;if(sa>A){const sw=vh*A;return[(vw-sw)/2,0,sw,vh]}const sh=vw/A;return[0,(vh-sh)/2,vw,sh]}
function wrap(x,t,w){const out=[];for(const para of String(t||"").split("\n")){const ws=para.split(/\s+/).filter(Boolean);let cur="";for(const wd of ws){const n=cur?cur+" "+wd:wd;if(x.measureText(n).width<=w||!cur)cur=n;else{out.push(cur);cur=wd}}out.push(cur)}return out.slice(0,6)}
const eob=p=>{const c=1.70158,d=p-1;return 1+(c+1)*d*d*d+c*d*d};
/* tek yazıyı çizer; dt = görünür olduğundan beri geçen çıkış saniyesi; tuval koordinatında kutu döner */
function drawText(x,W,H,t,dt){const fs=Math.max(10,Math.round(H*((SZ.find(z=>z[0]===t.z)||SZ[1])[2])));x.font=`800 ${fs}px ${FONT}`;const lines=wrap(x,t.t,W*.84);const lh=fs*1.2;
 const bw=Math.max(...lines.map(l=>x.measureText(l).width),fs),bh=lines.length*lh;let a=1,sc=1,dy=0,show=Infinity;
 if(t.a==="fade")a=clamp(dt/.35,0,1);else if(t.a==="pop"){const p=clamp(dt/.4,0,1);sc=Math.max(.01,eob(p));a=clamp(dt/.12,0,1)}else if(t.a==="up"){const p=clamp(dt/.4,0,1);a=p;dy=(1-(1-Math.pow(1-p,3)))*H*.05}else if(t.a==="type")show=Math.floor(dt*24);
 const cx=t.x*W,cy=t.y*H;const pad=fs*.38;const box={x0:cx-bw/2-pad,y0:cy-bh/2-pad,x1:cx+bw/2+pad,y1:cy+bh/2+pad};if(a<=0)return box;
 x.save();x.globalAlpha=a;x.translate(cx,cy+dy);x.scale(sc,sc);x.textAlign="center";x.textBaseline="middle";
 if(t.st==="b"){x.fillStyle=t.c;const r=fs*.32;x.beginPath();if(x.roundRect)x.roundRect(-bw/2-pad,-bh/2-pad*.7,bw+pad*2,bh+pad*1.4,r);else x.rect(-bw/2-pad,-bh/2-pad*.7,bw+pad*2,bh+pad*1.4);x.fill()}
 let left=show;lines.forEach((l,i)=>{let s=l;if(left!==Infinity){s=l.slice(0,Math.max(0,left));left-=l.length+1}if(!s)return;const y=-bh/2+lh*(i+.5);
  if(t.st==="b"){x.fillStyle=light(t.c)?"#111":"#fff";x.fillText(s,0,y)}
  else if(t.st==="p"){x.lineJoin="round";x.lineWidth=fs*.16;x.strokeStyle=light(t.c)?"rgba(0,0,0,.85)":"rgba(255,255,255,.95)";x.strokeText(s,0,y);x.fillStyle=t.c;x.fillText(s,0,y)}
  else{x.shadowColor="rgba(0,0,0,.7)";x.shadowBlur=fs*.3;x.shadowOffsetY=fs*.06;x.fillStyle=t.c;x.fillText(s,0,y);x.shadowColor="transparent"}});
 x.restore();return box}
/* bir kare: kırpma + filtre + o anda görünen yazılar. st = kaynak saniyesi */
function frame(x,W,H,v,ed,st,sel){x.fillStyle="#000";x.fillRect(0,0,W,H);const vw=v.videoWidth,vh=v.videoHeight;
 if(vw&&vh){const[sx,sy,sw,sh]=crop(vw,vh,W/H);const f=FILTERS[ed.f]&&FILTERS[ed.f][1];x.filter=f||"none";try{x.drawImage(v,sx,sy,sw,sh,0,0,W,H)}catch{}x.filter="none"}
 const bb=[];for(const t of ed.tx||[]){if(st<t.from-.001||st>t.to+.001)continue;const b=drawText(x,W,H,t,(st-t.from)/(ed.r||1));bb.push({id:t.id,...b});
  if(sel===t.id){x.save();x.setLineDash([8,6]);x.lineWidth=2;x.strokeStyle="rgba(255,255,255,.9)";x.strokeRect(b.x0,b.y0,b.x1-b.x0,b.y1-b.y0);x.restore()}}return bb}
function mediaDur(v){return new Promise(res=>{if(isFinite(v.duration)&&v.duration>0)return res(v.duration);const done=()=>{if(isFinite(v.duration)&&v.duration>0){v.removeEventListener("durationchange",done);v.currentTime=0;res(v.duration)}};v.addEventListener("durationchange",done);try{v.currentTime=1e7}catch{}setTimeout(()=>res(isFinite(v.duration)&&v.duration>0?v.duration:0),4000)})}
const seek=(v,t)=>new Promise(res=>{let ok=false;const f=()=>{if(ok)return;ok=true;v.removeEventListener("seeked",f);res()};v.addEventListener("seeked",f);try{v.currentTime=t}catch{f()}setTimeout(f,2500)});
const maxOut=()=>{try{return cldOn()?CLD.maxS:30}catch{return 30}};
const limitB=()=>{try{return S.mode==="local"?1.5*1048576:cldOn()?25*1048576:3*1048576}catch{return 3*1048576}};
const maxSide=()=>{try{return cldOn()?1280:854}catch{return 854}};
const isPlain=(ed,D)=>ed.s<=.05&&ed.e>=D-.05&&ed.r===1&&!ed.f&&ed.fm==="o"&&!ed.mute&&!(ed.tx||[]).length&&ed.cv==null;

/* dışa aktarma */
function render(url,ed,{onProg,alive}={}){return new Promise((resolve,reject)=>{const v=document.createElement("video");v.playsInline=true;v.preload="auto";v.setAttribute("playsinline","");
 let raf=0,mr=null,chunks=[],done=false,ac=null,poster=null,cv=null,ctx=null;
 const clean=()=>{cancelAnimationFrame(raf);try{v.pause()}catch{}try{ac&&ac.close()}catch{}v.removeAttribute("src");try{v.load()}catch{}};
 const fail=m=>{if(done)return;done=true;try{mr&&mr.state!=="inactive"&&mr.stop()}catch{}clean();reject(new Error(m))};
 v.onerror=()=>fail("Video açılamadı.");
 v.onloadedmetadata=async()=>{const vw=v.videoWidth,vh=v.videoHeight;if(!vw||!vh)return fail("Video okunamadı.");const[W,H]=dims(vw,vh,ed.fm,maxSide());cv=document.createElement("canvas");cv.width=W;cv.height=H;ctx=cv.getContext("2d");
  const dur=Math.max(.3,(ed.e-ed.s)/ed.r);let stream;try{stream=cv.captureStream(30)}catch{return fail("Bu tarayıcı videoyu düzenleyemiyor.")}
  if(!ed.mute)try{const AC=window.AudioContext||window.webkitAudioContext;ac=new AC();const src=ac.createMediaElementSource(v);const dst=ac.createMediaStreamDestination();src.connect(dst);dst.stream.getAudioTracks().forEach(t=>stream.addTrack(t));ac.resume&&ac.resume()}catch{v.muted=true}else v.muted=true;
  const types=["video/mp4;codecs=avc1","video/mp4","video/webm;codecs=vp9,opus","video/webm;codecs=vp8,opus","video/webm"];const mt=types.find(t=>window.MediaRecorder&&MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(t))||"";
  const br=Math.round(clamp((limitB()*.82*8)/dur-56000,350000,maxSide()>854?2500000:1200000));
  try{mr=new MediaRecorder(stream,mt?{mimeType:mt,videoBitsPerSecond:br,audioBitsPerSecond:64000}:{videoBitsPerSecond:br})}catch{return fail("Bu tarayıcı video kaydedemiyor.")}
  mr.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
  mr.onstop=()=>{if(done)return;done=true;clean();const type=(mr.mimeType||mt||"video/webm").split(";")[0];const blob=new Blob(chunks,{type});if(!blob.size)return reject(new Error("Video hazırlanamadı."));resolve({file:new File([blob],"kurgu."+(type.includes("mp4")?"mp4":"webm"),{type}),poster,W,H})};
  const want=ed.cv!=null?clamp(ed.cv,ed.s,ed.e):ed.s+(ed.e-ed.s)/2;
  const grab=()=>{try{const s=Math.min(1,360/Math.max(W,H)*1.8);const pc=document.createElement("canvas");pc.width=Math.round(W*s);pc.height=Math.round(H*s);pc.getContext("2d").drawImage(cv,0,0,pc.width,pc.height);poster=pc.toDataURL("image/jpeg",.72)}catch{}};
  const draw=()=>{if(done)return;if(alive&&!alive()){fail("iptal");return}const t=v.currentTime;frame(ctx,W,H,v,ed,t,null);if(!poster&&t>=want-.02)grab();onProg&&onProg(clamp((t-ed.s)/(ed.e-ed.s),0,1));
   if(t>=ed.e-.03||v.ended){if(!poster)grab();try{v.pause();mr.state!=="inactive"&&mr.stop()}catch{}return}raf=requestAnimationFrame(draw)};
  v.onended=()=>{if(!poster)grab();try{mr.state!=="inactive"&&mr.stop()}catch{}};
  await seek(v,ed.s);v.playbackRate=ed.r;try{v.preservesPitch=true}catch{}frame(ctx,W,H,v,ed,ed.s,null);if(ed.cv==null&&!poster&&ed.e-ed.s<.2)grab();
  mr.start(500);try{await v.play()}catch{v.muted=true;try{await v.play()}catch{return fail("Video oynatılamadı.")}}draw()};
 v.src=url})}

/* düzenleyici */
function open(file,prev){return new Promise(async done=>{const url=URL.createObjectURL(file);const v=document.createElement("video");v.playsInline=true;v.preload="auto";v.setAttribute("playsinline","");v.src=url;
 let fin=false;const stop=()=>{cancelAnimationFrame(K.raf);try{v.pause()}catch{}v.removeAttribute("src");try{v.load()}catch{}URL.revokeObjectURL(url)};const finish=r=>{if(fin)return;fin=true;stop();try{closeLayer("kurgu")}catch{}done(r)};const out=r=>{if(fin)return;fin=true;stop();done(r)};
 const K={raf:0,tab:"cut",sel:null,play:false,thumbs:[],busy:false,cancel:false};
 const l=openLayer("kurgu",`<div class="full ked" role="dialog" aria-label="Kurgu"><div class="hd"><button class="ib plain" data-kdx="1" aria-label="Kapat">${I("close")}</button><h1>Kurgu</h1><button class="btn sm" id="kdOk" type="button">Bitti</button></div>
  <div class="kd-stage" id="kdStage"><canvas id="kdCv" aria-label="Önizleme"></canvas><button class="kd-play" id="kdPlay" type="button" aria-label="Oynat">${I("play")}</button><div class="kd-load" id="kdLoad"><span class="spin"></span></div></div>
  <div class="kd-time"><b id="kdT">0:00.0</b><span class="muted"> / <span id="kdD">0:00.0</span></span><span class="kd-info" id="kdInfo"></span></div>
  <div class="kd-tl" id="kdTl"><div class="kd-strip" id="kdStrip"></div><div class="kd-dim l" id="kdDl"></div><div class="kd-dim r" id="kdDr"></div><div class="kd-sel" id="kdSel"><i class="kd-h l" data-h="s" aria-label="Başlangıç"></i><i class="kd-h r" data-h="e" aria-label="Bitiş"></i></div><i class="kd-ph" id="kdPh"></i><div class="kd-txl" id="kdTxl"></div></div>
  <div class="kd-tabs" role="tablist">${TABS.map(([k,lb,ic])=>`<button type="button" role="tab" data-kt="${k}" aria-pressed="${k==="cut"}">${I(ic)}<span>${lb}</span></button>`).join("")}</div>
  <div class="kd-pane" id="kdPane"></div><div class="kd-busy" id="kdBusy" hidden><div><span class="spin"></span><b>Video hazırlanıyor</b><span class="pct" id="kdPct">%0</span><small>Düzenlemen videoya işleniyor. Bu ekrandan çıkma.</small><button class="btn ghost sm" id="kdCancel" type="button">İptal</button></div></div></div>`,
  {noScrim:true,onClose:()=>{K.cancel=true;out(null)}});
 l._guard=()=>{if(K.busy){K.cancel=true;return true}return false};
 const $l=s=>l.querySelector(s);const cv=$l("#kdCv"),cx=cv.getContext("2d");
 await new Promise(r=>{if(v.readyState>=1)return r();v.onloadedmetadata=r;v.onerror=r;setTimeout(r,8000)});
 if(!v.videoWidth){toast("Video açılamadı.");closeLayer("kurgu");return}
 const D=await mediaDur(v);if(!D){toast("Videonun süresi okunamadı.");closeLayer("kurgu");return}
 const MO=maxOut();const ed=Object.assign({s:0,e:Math.min(D,MO),r:1,f:0,fm:"o",mute:false,tx:[],cv:null},prev&&prev.D&&Math.abs(prev.D-D)<.2?JSON.parse(JSON.stringify(prev)):{});ed.D=D;
 $l("#kdLoad").hidden=true;
 const outDur=()=>(ed.e-ed.s)/ed.r;
 const fixLen=()=>{ed.s=clamp(ed.s,0,D-.3);ed.e=clamp(ed.e,ed.s+.3,D);if(outDur()>MO+.01)ed.e=ed.s+MO*ed.r;for(const t of ed.tx){t.from=clamp(t.from,ed.s,ed.e);t.to=clamp(t.to,t.from+.2,Math.max(t.from+.2,ed.e))}};fixLen();
 const size=()=>{const st=$l("#kdStage");const A=fmtA(ed.fm,v.videoWidth,v.videoHeight);const bw=st.clientWidth-24,bh=st.clientHeight-16;let w=bw,h=w/A;if(h>bh){h=bh;w=h*A}const dpr=Math.min(2,devicePixelRatio||1);cv.style.width=Math.round(w)+"px";cv.style.height=Math.round(h)+"px";cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);K.bb=[];draw()};
 const draw=()=>{K.bb=frame(cx,cv.width,cv.height,v,ed,v.currentTime,K.sel);ui()};
 const ui=()=>{$l("#kdT").textContent=tf((v.currentTime-ed.s)/ed.r);$l("#kdD").textContent=tf(outDur());const tw=$l("#kdTl").clientWidth||1;const px=t=>t/D*100+"%";
  const sel=$l("#kdSel");sel.style.left=px(ed.s);sel.style.width=((ed.e-ed.s)/D*100)+"%";$l("#kdDl").style.width=px(ed.s);$l("#kdDr").style.left=px(ed.e);$l("#kdPh").style.left=px(clamp(v.currentTime,0,D));
  $l("#kdInfo").textContent=[ed.r!==1?ed.r.toString().replace(".",",")+"x":"",ed.tx.length?ed.tx.length+" yazı":"",ed.f?FILTERS[ed.f][0]:"",ed.fm!=="o"?FMT.find(f=>f[0]===ed.fm)[1]:"",ed.mute?"sessiz":""].filter(Boolean).join(" · ");
  const txl=$l("#kdTxl");const t=ed.tx.find(x=>x.id===K.sel);txl.innerHTML=t?`<i style="left:${px(t.from)};width:${(t.to-t.from)/D*100}%"></i>`:"";$l("#kdPlay").innerHTML=I(K.play?"pause":"play");$l("#kdPlay").classList.toggle("on",K.play)};
 const loop=()=>{if(fin)return;if(K.play){if(v.currentTime>=ed.e-.02||v.ended||v.currentTime<ed.s-.3){v.currentTime=ed.s;if(v.paused)v.play().catch(()=>{})}draw()}K.raf=requestAnimationFrame(loop)};
 const play=on=>{K.play=on;v.playbackRate=ed.r;v.muted=!!ed.mute;if(on){if(v.currentTime<ed.s||v.currentTime>=ed.e-.05)v.currentTime=ed.s;v.play().catch(()=>{v.muted=true;v.play().catch(()=>{K.play=false;ui()})})}else v.pause();ui()};
 const goT=async t=>{await seek(v,clamp(t,0,D));draw()};
 v.onseeked=()=>{if(!K.play)draw()};
 /* küçük resim şeridi */
 (async()=>{const n=10,tv=document.createElement("video");tv.muted=true;tv.preload="auto";tv.src=url;tv.playsInline=true;await new Promise(r=>{tv.onloadeddata=r;tv.onerror=r;setTimeout(r,5000)});if(!tv.videoWidth)return;
  const strip=$l("#kdStrip");const c=document.createElement("canvas");c.height=96;c.width=Math.round(96*tv.videoWidth/tv.videoHeight)||54;const x=c.getContext("2d");
  for(let i=0;i<n&&!fin;i++){await seek(tv,D*(i+.5)/n);try{x.drawImage(tv,0,0,c.width,c.height);const im=document.createElement("img");im.src=c.toDataURL("image/jpeg",.6);im.alt="";strip.appendChild(im);if(i===0)K.thumb=im.src}catch{break}}
  tv.removeAttribute("src");try{tv.load()}catch{};if(K.tab==="flt")pane()})();
 /* zaman çizgisi: tutamaçlar ve oynatma çizgisi */
 const tl=$l("#kdTl");let drag=null;const tAt=e=>{const r=tl.getBoundingClientRect();return clamp((e.clientX-r.left)/r.width,0,1)*D};
 tl.onpointerdown=e=>{e.preventDefault();try{tl.setPointerCapture(e.pointerId)}catch{}const h=e.target.closest("[data-h]");drag=h?h.dataset.h:"p";if(K.play)play(false);mv(e)};
 const mv=e=>{if(!drag)return;const t=tAt(e);if(drag==="s"){ed.s=clamp(t,0,ed.e-.3);if((ed.e-ed.s)/ed.r>MO)ed.s=ed.e-MO*ed.r;fixLen();goT(ed.s)}else if(drag==="e"){ed.e=clamp(t,ed.s+.3,D);if((ed.e-ed.s)/ed.r>MO)ed.e=ed.s+MO*ed.r;fixLen();goT(ed.e-.04)}else goT(t)};
 tl.onpointermove=mv;tl.onpointerup=tl.onpointercancel=()=>{drag=null;if(K.tab==="cut"||K.tab==="txt"||K.tab==="cov")pane()};
 /* önizlemede yazıyı seç ve sürükle */
 let td=null;const cp=e=>{const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)*cv.width/r.width,y:(e.clientY-r.top)*cv.height/r.height}};
 cv.onpointerdown=e=>{const p=cp(e);const h=[...(K.bb||[])].reverse().find(b=>p.x>=b.x0&&p.x<=b.x1&&p.y>=b.y0&&p.y<=b.y1);if(!h){if(K.sel){K.sel=null;draw();if(K.tab==="txt")pane()}else play(!K.play);return}
  e.preventDefault();try{cv.setPointerCapture(e.pointerId)}catch{}const t=ed.tx.find(x=>x.id===h.id);K.sel=t.id;if(K.tab!=="txt"){K.tab="txt";tabs()}pane();td={t,sx:p.x,sy:p.y,ox:t.x,oy:t.y};draw()};
 cv.onpointermove=e=>{if(!td)return;const p=cp(e);td.t.x=clamp(td.ox+(p.x-td.sx)/cv.width,.05,.95);td.t.y=clamp(td.oy+(p.y-td.sy)/cv.height,.05,.95);draw()};
 cv.onpointerup=cv.onpointercancel=()=>{td=null};
 $l("#kdPlay").onclick=()=>play(!K.play);
 /* araç sekmeleri */
 const tabs=()=>l.querySelectorAll("[data-kt]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.kt===K.tab));
 l.querySelector(".kd-tabs").onclick=e=>{const b=e.target.closest("[data-kt]");if(!b)return;K.tab=b.dataset.kt;tabs();pane()};
 const seg=(name,list,cur)=>`<div class="seg kd-seg">${list.map(([v2,lb])=>`<button type="button" data-${name}="${v2}" aria-pressed="${String(cur)===String(v2)}">${lb}</button>`).join("")}</div>`;
 const pane=()=>{const p=$l("#kdPane");const tsel=ed.tx.find(x=>x.id===K.sel);let h="";
  if(K.tab==="cut")h=`<p class="kd-hint">Alttaki şeritte iki ucu sürükleyerek videonun başını ve sonunu kes. ${tf(ed.s)} – ${tf(ed.e)} arası, ${tf(outDur())} sürecek${MO<D?` (en çok ${MO} sn)`:""}.</p><div class="kd-row"><button class="btn sec sm" type="button" data-kc="s">${I("prev")}Başı buradan</button><button class="btn sec sm" type="button" data-kc="e">Sonu burada${I("next")}</button><button class="btn ghost sm" type="button" data-kc="0">Sıfırla</button></div>`;
  else if(K.tab==="spd")h=`<p class="kd-hint">Hızlandırınca video kısalır, sesi de hızlanır. Yavaşlatınca uzar.</p>${seg("ks",SPD.map(x=>[x,String(x).replace(".",",")+"x"]),ed.r)}`;
  else if(K.tab==="txt")h=`<div class="kd-row"><button class="btn sm" type="button" data-ka="1">${I("add")}Yazı ekle</button>${ed.tx.map(t=>`<button type="button" class="chip kd-tc" data-kts="${t.id}" aria-pressed="${t.id===K.sel}">${esc(String(t.t).slice(0,14))}</button>`).join("")}</div>`+
   (tsel?`<div class="kd-ed"><div class="kd-cols">${COL.map(c=>`<button type="button" data-kcol="${c}" style="--c:${c}" aria-pressed="${tsel.c===c}" aria-label="Renk"></button>`).join("")}</div>${seg("kst",STY,tsel.st)}${seg("ksz",SZ.map(z=>[z[0],z[1]]),tsel.z)}<span class="lbl">Animasyon</span>${seg("kan",ANI,tsel.a)}
    <div class="kd-row kd-tm"><span>Görünür: <b>${tf((tsel.from-ed.s)/ed.r)} – ${tf((tsel.to-ed.s)/ed.r)}</b></span><button class="btn ghost sm" type="button" data-kfr="1">Buradan başlasın</button><button class="btn ghost sm" type="button" data-kto="1">Burada bitsin</button></div>
    <div class="kd-row"><button class="btn sec sm" type="button" data-ke="1">${I("edit")}Yazıyı değiştir</button><button class="btn ghost sm" type="button" data-kdl="1" style="color:var(--heart)">${I("trash")}Sil</button></div></div>`:ed.tx.length?`<p class="kd-hint">Düzenlemek için bir yazıya dokun; önizlemede sürükleyerek yerini değiştir.</p>`:`<p class="kd-hint">Videonun üstüne yazı ekle. Renk, stil, boyut, animasyon ve ne zaman görüneceğini seçebilirsin.</p>`);
  else if(K.tab==="flt")h=`<div class="kd-flt">${FILTERS.map((f,i)=>`<button type="button" data-kf="${i}" aria-pressed="${ed.f===i}">${K.thumb?`<img src="${K.thumb}" alt="" style="filter:${f[1]||"none"}">`:`<i></i>`}<span>${f[0]}</span></button>`).join("")}</div>`;
  else if(K.tab==="fmt")h=`<p class="kd-hint">Videoyu bu orana kırp. Klaket için en iyisi 9:16.</p>${seg("kfm",FMT.map(f=>[f[0],f[1]]),ed.fm)}`;
  else if(K.tab==="snd")h=`<label class="srow"><span class="t">Videonun kendi sesi<small>Kapatırsan video sessiz çıkar; müziği Klaket ekranından ekleyebilirsin</small></span><span class="sw"><input type="checkbox" id="kdSnd" ${ed.mute?"":"checked"}><span></span></span></label>`;
  else if(K.tab==="cov")h=`<p class="kd-hint">Klaketin kapağı olacak kareyi seç: oynatma çizgisini istediğin yere getir.</p><div class="kd-row"><button class="btn sm" type="button" data-kcv="1">${I("image")}Bu kareyi kapak yap</button>${ed.cv!=null?`<span class="muted">Kapak: ${tf((ed.cv-ed.s)/ed.r)}</span><button class="btn ghost sm" type="button" data-kcv="0">Otomatik</button>`:`<span class="muted">Şu an otomatik (ortadaki kare)</span>`}</div>`;
  p.innerHTML=h;const sw=$l("#kdSnd");if(sw)sw.onchange=()=>{ed.mute=!sw.checked;v.muted=ed.mute;ui()}};
 $l("#kdPane").onclick=async e=>{const b=e.target.closest("button");if(!b)return;const d=b.dataset;const tsel=ed.tx.find(x=>x.id===K.sel);const cur=clamp(v.currentTime,ed.s,ed.e);
  if(d.kc){if(d.kc==="0"){ed.s=0;ed.e=Math.min(D,MO*ed.r)}else if(d.kc==="s"){ed.s=Math.min(cur,ed.e-.3)}else ed.e=Math.max(cur,ed.s+.3);fixLen();await goT(d.kc==="e"?ed.e-.04:ed.s);pane();return}
  if(d.ks){ed.r=+d.ks;fixLen();v.playbackRate=ed.r;pane();draw();return}
  if(d.ka){if(ed.tx.length>=8)return toast("En fazla 8 yazı ekleyebilirsin.");if(K.play)play(false);const t=await stAsk("Yazı ekle","Ne yazmak istersin?",80);if(!t)return;const from=cur>=ed.e-.3?ed.s:cur;const id="t"+Date.now().toString(36);
   ed.tx.push({id,t:kidClean(t),x:.5,y:clamp(.32+ed.tx.length*.12,.12,.86),c:"#ffffff",st:"s",z:"m",a:"fade",from,to:ed.e});K.sel=id;await goT(from+.45*ed.r);pane();return}
  if(d.kts){K.sel=d.kts===K.sel?null:d.kts;const t=ed.tx.find(x=>x.id===K.sel);if(t&&(v.currentTime<t.from||v.currentTime>t.to))await goT(t.from+.45*ed.r);pane();draw();return}
  if(d.kf){ed.f=+d.kf;pane();draw();return}
  if(d.kfm){ed.fm=d.kfm;pane();size();return}
  if(d.kcv){ed.cv=d.kcv==="1"?cur:null;if(d.kcv==="1")toast("Kapak seçildi");pane();return}
  if(!tsel)return;
  if(d.kcol){tsel.c=d.kcol}else if(d.kst){tsel.st=d.kst}else if(d.ksz){tsel.z=d.ksz}else if(d.kan){tsel.a=d.kan;await goT(tsel.from);if(!K.play)play(true)}
  else if(d.kfr){tsel.from=Math.min(cur,tsel.to-.2)}else if(d.kto){tsel.to=Math.max(cur,tsel.from+.2)}
  else if(d.ke){const t=await stAsk("Yazıyı değiştir","Yazı",80,tsel.t);if(t)tsel.t=kidClean(t)}
  else if(d.kdl){ed.tx=ed.tx.filter(x=>x!==tsel);K.sel=null}
  pane();draw()};
 l.addEventListener("click",e=>{if(e.target.closest("[data-kdx]")){if(isPlain(ed,D)||K.busy)return closeLayer("kurgu");dialog("Düzenleme bırakılsın mı?","Yaptığın değişiklikler kaydedilmez.",[{label:"Bırak",cls:"danger",fn:()=>closeLayer("kurgu")},{label:"Düzenlemeye devam"}])}});
 $l("#kdCancel").onclick=()=>{K.cancel=true};
 $l("#kdOk").onclick=async()=>{if(K.busy)return;play(false);if(isPlain(ed,D))return finish({file,ed:null,poster:null});
  K.busy=true;K.cancel=false;$l("#kdBusy").hidden=false;try{const r=await render(url,ed,{onProg:p=>{const e=$l("#kdPct");if(e)e.textContent="%"+Math.round(p*100)},alive:()=>!K.cancel&&l.isConnected});
   finish({file:r.file,ed:JSON.parse(JSON.stringify(ed)),poster:r.poster})}
  catch(e){K.busy=false;$l("#kdBusy").hidden=true;if(e&&e.message==="iptal")toast("Hazırlama iptal edildi.");else toast((e&&e.message)||"Video hazırlanamadı.")}};
 addEventListener("resize",function rs(){if(fin)return removeEventListener("resize",rs);size()});
 pane();await seek(v,ed.s);size();loop()})}
window.KURGU={open,render,frame,dims,_test:{drawText,wrap,crop,isPlain}};
})();
