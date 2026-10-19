/* Kadraj 4 kişilik satranç (6.0; gizli deneme, yalnızca Yönetici panelinden açılır).
   index.html bu dosyayı ilk kullanımda yükler (60CHS bölgesindeki s4Load/s4Go) ve window.SATRANC4.open() çağırır.
   Kadraj'ın genel adlarını kullanır: S, $, $$, I, esc, toast, openLayer, closeLayer, dialog, avatar, P, LS, vib, kbReduce, CSND, settings,
   ch60PieceSvg (60CHS'teki Modern taş çizimleri; burada dört renge boyanır).
   Kurallar (chess.com'un 4 kişilik "herkes tek başına" oyununa yakın):
   - 14x14 tahta, 3x3 köşeler yok. Kırmızı altta (sen), Mavi solda, Sarı üstte, Yeşil sağda; sıra saat yönünde: Kırmızı → Mavi → Sarı → Yeşil.
     Herkesin dizilişi Kırmızı'nınkinin 90° döndürülmüşü (rot): şah sağda, vezir solda.
   - Piyon bir ya da (başlangıçta) iki kare ilerler, çapraz alır; tahtanın ortasındaki 8. sıraya (kendi tarafından) varınca vezir olur.
     Geçerken alma yok. Rok var (şah ve kale oynamamış, arası boş, şah tehdit altında değil ve geçtiği kareler tehdit altında değil).
   - Şah alınamaz. Sırası gelen oyuncunun yasal hamlesi yoksa elenir: şah çekilmişse mat, değilse pat. Teslim olan da elenir.
     Elenenin şahı kalkar, diğer taşları gri kalır (engel olur, herkes alabilir, kimseye tehdit etmez).
   - Son kalan kazanır. 200 yarım hamle boyunca taş alınmaz ve piyon oynanmazsa oyun biter; kalanlardan taş değeri en yüksek olan kazanır.
   Botlar (botPick): her yasal hamleye puan verir: alınan taş, terfi, rok, şah çekme (mat/pat ettirme büyük artı), varılan karenin
   tehlikesi (savunuluyor mu, en ucuz saldıran), açıkta kalan taşlar (hangValue), merkez, gelişim; seviyeye göre rastgelelik. Hamle ~0,4-0,7 sn.
   Kayıt: kadraj_s4_<uid> {ev: [["m",f,t,pr]|["r",renk]], lvl} (yarım oyun açılınca kaldığı yerden), ayarlar kadraj_s4 {lvl, spd}.
   Testler için motor window.SATRANC4._e (DOM'suz). */
(()=>{"use strict";
if(window.SATRANC4)return;
const X={};window.SATRANC4=X;

/* ---------- motor ---------- */
const N=14,SQ=N*N,DEAD=4;
const ON=new Uint8Array(SQ);for(let r=0;r<N;r++)for(let c=0;c<N;c++)ON[r*N+c]=(r<3||r>10)&&(c<3||c>10)?0:1;
const CNAME=["Kırmızı","Mavi","Sarı","Yeşil"];
const CHEX=["#c9434b","#4a8cc6","#cf9f2c","#529a66"];
const VAL=[0,1,3,4,5,9,0];
const LET={2:"A",3:"F",4:"K",5:"V",6:"Ş"};
const rot=(k,r,c)=>{for(let i=0;i<k;i++){const t=r;r=c;c=13-t}return[r,c]};
const rvec=(k,dr,dc)=>{for(let i=0;i<k;i++){const t=dr;dr=dc;dc=-t}return[dr,dc]};
const at=(r,c)=>r>=0&&r<N&&c>=0&&c<N&&ON[r*N+c]?r*N+c:-1;
const FWD=[0,1,2,3].map(k=>rvec(k,-1,0));
const PERP=FWD.map(([dr,dc])=>[[dc,dr],[-dc,-dr]]);
/* her renk için karenin Kırmızı'nın gözünden satırı: piyon başlangıcı 12, terfi 6 */
const REL=[0,1,2,3].map(k=>{const a=new Int8Array(SQ).fill(-1);for(let s=0;s<SQ;s++){if(!ON[s])continue;const[r]=rot((4-k)%4,(s/N)|0,s%N);a[s]=r}return a});
const BACK=[4,2,3,5,6,3,2,4];
const sqOf=(k,r,c)=>{const[a,b]=rot(k,r,c);return a*N+b};
const CASTLE=[0,1,2,3].map(k=>[
 {rook:sqOf(k,13,10),kto:sqOf(k,13,9),rto:sqOf(k,13,8),empty:[sqOf(k,13,8),sqOf(k,13,9)],pass:[sqOf(k,13,8),sqOf(k,13,9)]},
 {rook:sqOf(k,13,3),kto:sqOf(k,13,5),rto:sqOf(k,13,6),empty:[sqOf(k,13,4),sqOf(k,13,5),sqOf(k,13,6)],pass:[sqOf(k,13,6),sqOf(k,13,5)]}]);
const KHOME=[0,1,2,3].map(k=>sqOf(k,13,7));
const KN=[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]],KG=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
const DIAG=[[-1,-1],[-1,1],[1,-1],[1,1]],ORTH=[[-1,0],[1,0],[0,-1],[0,1]];
function newGame(){const b=new Int8Array(SQ);
 for(let k=0;k<4;k++)for(let i=0;i<8;i++){b[sqOf(k,13,3+i)]=k*8+BACK[i];b[sqOf(k,12,3+i)]=k*8+1}
 return{b,turn:0,alive:[1,1,1,1],king:KHOME.slice(),cs:[[1,1],[1,1],[1,1],[1,1]],half:0,hist:[],log:[],elim:[],over:null,cap:[0,0,0,0],ply:0}}
const colOf=p=>p>>3;
/* sq'ya, who(renk) doğru dönen renklerden saldıran en ucuz taşın değeri (yoksa 0; şah 10 sayılır) */
function att(G,sq,who){const b=G.b,r=(sq/N)|0,c=sq%N;let best=0;const ok=(x,t)=>{const j=x>>3;if(j<4&&G.alive[j]&&who(j)){const v=t===6?10:VAL[t];if(!best||v<best)best=v}};
 for(let j=0;j<4;j++){if(!G.alive[j]||!who(j))continue;const[dr,dc]=FWD[j];for(const[pr,pc]of PERP[j]){const q=at(r-dr-pr,c-dc-pc);if(q>=0&&b[q]===j*8+1)return 1}}
 for(const[a,d]of KN){const q=at(r+a,c+d);if(q>=0){const x=b[q];if(x&&(x&7)===2)ok(x,2)}}
 for(const[a,d]of DIAG){let R=r+a,C=c+d,q;while((q=at(R,C))>=0){const x=b[q];if(x){const t=x&7;if(t===3||t===5)ok(x,t);break}R+=a;C+=d}}
 for(const[a,d]of ORTH){let R=r+a,C=c+d,q;while((q=at(R,C))>=0){const x=b[q];if(x){const t=x&7;if(t===4||t===5)ok(x,t);break}R+=a;C+=d}}
 for(const[a,d]of KG){const q=at(r+a,c+d);if(q>=0){const x=b[q];if(x&&(x&7)===6)ok(x,6)}}
 return best}
const enemyOf=k=>j=>j!==k;
const attacked=(G,sq,k)=>att(G,sq,enemyOf(k))>0;
const inCheck=(G,k)=>G.alive[k]&&attacked(G,G.king[k],k);
function gen(G,k){const out=[],b=G.b;
 for(let s=0;s<SQ;s++){const p=b[s];if(!p||(p>>3)!==k)continue;const t=p&7,r=(s/N)|0,c=s%N;
  const free=q=>{const x=b[q];return!x||((x>>3)!==k&&(x&7)!==6)};
  const add=(q,o)=>out.push({k,f:s,t:q,p,x:b[q],pr:o&&o.pr||0,ca:o&&o.ca||null});
  if(t===1){const[dr,dc]=FWD[k];const one=at(r+dr,c+dc);
   if(one>=0&&!b[one]){add(one,REL[k][one]===6?{pr:5}:null);if(REL[k][s]===12){const two=at(r+2*dr,c+2*dc);if(two>=0&&!b[two])add(two,REL[k][two]===6?{pr:5}:null)}}
   for(const[pr,pc]of PERP[k]){const q=at(r+dr+pr,c+dc+pc);if(q>=0){const x=b[q];if(x&&(x>>3)!==k&&(x&7)!==6)add(q,REL[k][q]===6?{pr:5}:null)}}continue}
  if(t===2||t===6){for(const[a,d]of t===2?KN:KG){const q=at(r+a,c+d);if(q>=0&&free(q))add(q)}
   if(t===6&&s===KHOME[k])for(let i=0;i<2;i++){const C=CASTLE[k][i];if(!G.cs[k][i]||b[C.rook]!==k*8+4||C.empty.some(q=>b[q]))continue;
    if(attacked(G,s,k)||C.pass.some(q=>attacked(G,q,k)))continue;add(C.kto,{ca:C})}
   continue}
  for(const[a,d]of t===3?DIAG:t===4?ORTH:[...DIAG,...ORTH]){let R=r+a,C=c+d,q;while((q=at(R,C))>=0){const x=b[q];if(!x){add(q);R+=a;C+=d;continue}if((x>>3)!==k&&(x&7)!==6)add(q);break}}}
 return out}
function make(G,m){const b=G.b;const u={m,x:b[m.t],cs:G.cs.map(a=>a.slice()),half:G.half,king:G.king[m.k]};
 b[m.f]=0;b[m.t]=m.pr?m.k*8+m.pr:m.p;if(m.ca){b[m.ca.rook]=0;b[m.ca.rto]=m.k*8+4}
 const t=m.p&7;if(t===6){G.king[m.k]=m.t;G.cs[m.k]=[0,0]}
 if(t===4)for(let i=0;i<2;i++)if(CASTLE[m.k][i].rook===m.f)G.cs[m.k][i]=0;
 if(u.x&&(u.x&7)===4){const j=u.x>>3;if(j<4)for(let i=0;i<2;i++)if(CASTLE[j][i].rook===m.t)G.cs[j][i]=0}
 G.half=t===1||u.x?0:G.half+1;G.hist.push(u)}
function unmake(G){const u=G.hist.pop(),m=u.m,b=G.b;b[m.f]=m.p;b[m.t]=u.x;if(m.ca){b[m.ca.rto]=0;b[m.ca.rook]=m.k*8+4}G.cs=u.cs;G.half=u.half;G.king[m.k]=u.king}
function legal(G,k){if(!G.alive[k])return[];const out=[];for(const m of gen(G,k)){make(G,m);if(!attacked(G,G.king[k],k))out.push(m);unmake(G)}return out}
const nextAlive=(G,k)=>{for(let i=1;i<=4;i++){const j=(k+i)%4;if(G.alive[j])return j}return k};
const aliveN=G=>G.alive.reduce((a,v)=>a+v,0);
function eliminate(G,k,why){if(!G.alive[k])return;G.alive[k]=0;G.b[G.king[k]]=0;for(let s=0;s<SQ;s++){const p=G.b[s];if(p&&(p>>3)===k)G.b[s]=DEAD*8+(p&7)}G.elim.push({k,why,ply:G.ply})}
function material(G,k){let v=0;for(let s=0;s<SQ;s++){const p=G.b[s];if(p&&(p>>3)===k)v+=VAL[p&7]}return v}
/* hamleyi uygula, sırayı ilerlet; sırası gelen hamlesizse ele (mat/pat). Dönen: olaylar */
function play(G,m){const ev=[];const x=G.b[m.t];make(G,m);G.hist.length=0;G.ply++;if(x&&(x>>3)<4)G.cap[m.k]+=VAL[x&7];
 G.log.push({k:m.k,f:m.f,t:m.t,p:m.p,x,pr:m.pr,ca:!!m.ca,s:san(m,x)});G.turn=nextAlive(G,m.k);settle(G,ev);return ev}
function settle(G,ev){while(!G.over){if(aliveN(G)<=1){G.over={win:G.alive.indexOf(1),why:"son"};break}
 if(G.half>=200){let w=-1,bv=-1;for(let k=0;k<4;k++)if(G.alive[k]){const v=material(G,k);if(v>bv){bv=v;w=k}}G.over={win:w,why:"uzun"};break}
 const k=G.turn;if(legal(G,k).length)break;const why=inCheck(G,k)?"mat":"pat";eliminate(G,k,why);ev.push({e:"elim",k,why});G.turn=nextAlive(G,k)}
 if(G.over)ev.push({e:"over"});
 for(let k=0;k<4;k++)if(G.alive[k]&&inCheck(G,k))ev.push({e:"check",k})}
function resign(G,k){const ev=[];if(G.over||!G.alive[k])return ev;eliminate(G,k,"teslim");ev.push({e:"elim",k,why:"teslim"});if(G.turn===k)G.turn=nextAlive(G,k);settle(G,ev);return ev}
const sqName=s=>"abcdefghijklmn"[s%N]+(N-((s/N)|0));
function san(m,x){if(m.ca)return m.ca===CASTLE[m.k][0]?"O-O":"O-O-O";const t=m.p&7;return(t===1?(x?"abcdefghijklmn"[m.f%N]:""):LET[t])+(x?"x":"")+sqName(m.t)+(m.pr?"=V":"")}
/* ---------- bot ---------- */
const CEN=s=>{const r=(s/N)|0,c=s%N;return Math.abs(r-6.5)+Math.abs(c-6.5)};
function hangValue(G,k){let v=0;const en=enemyOf(k),me=j=>j===k;for(let s=0;s<SQ;s++){const p=G.b[s];if(!p||(p>>3)!==k||(p&7)===6)continue;const a=att(G,s,en);if(!a)continue;const val=VAL[p&7];v+=att(G,s,me)?Math.max(0,val-a):val}return v}
/* s'deki taşın tehdit ettiği kareler */
function hits(G,s){const b=G.b,p=b[s],t=p&7,k=p>>3,r=(s/N)|0,c=s%N,out=[];
 if(t===1){const[dr,dc]=FWD[k];for(const[pr,pc]of PERP[k]){const q=at(r+dr+pr,c+dc+pc);if(q>=0)out.push(q)}return out}
 if(t===2||t===6){for(const[a,d]of t===2?KN:KG){const q=at(r+a,c+d);if(q>=0)out.push(q)}return out}
 for(const[a,d]of t===3?DIAG:t===4?ORTH:[...DIAG,...ORTH]){let R=r+a,C=c+d,q;while((q=at(R,C))>=0){out.push(q);if(b[q])break;R+=a;C+=d}}return out}
const kdist=(a,b)=>Math.max(Math.abs(((a/N)|0)-((b/N)|0)),Math.abs(a%N-b%N));
function botPick(G,k,lvl){const ms=legal(G,k);if(!ms.length)return null;const noise=[1.5,.45,.12][lvl]??.45;const early=G.ply<48,late=G.ply>140;const hb=hangValue(G,k);let best=ms[0],bv=-1e9;
 let tk=-1,tv=1e9;if(late)for(let j=0;j<4;j++)if(j!==k&&G.alive[j]){const v=material(G,j);if(v<tv){tv=v;tk=j}}
 for(const m of ms){let v=0;const x=m.x;const t=m.p&7;
  if(x)v+=((x>>3)===DEAD?.35:1)*VAL[x&7]*1.05;
  if(m.pr)v+=7.5;if(m.ca)v+=.7;
  make(G,m);
  const nt=m.pr?5:t;const a=att(G,m.t,enemyOf(k));if(a){const def=att(G,m.t,j=>j===k);v-=def?Math.max(0,VAL[nt]-a)*.9:VAL[nt]*.95}
  if(lvl>0){const ha=hangValue(G,k)-(a?(att(G,m.t,j=>j===k)?Math.max(0,VAL[nt]-a):VAL[nt]):0);v-=Math.max(0,ha-hb)*.6;if(hb>ha)v+=(hb-ha)*.5}
  for(let j=0;j<4;j++){if(j===k||!G.alive[j])continue;if(att(G,G.king[j],i=>i===k)){v+=.35;if(lvl>0&&!legal(G,j).length)v+=8}}
  if(!a||att(G,m.t,j=>j===k)){for(const q of hits(G,m.t)){const y=G.b[q];if(!y||(y&7)===6)continue;const j=y>>3;if(j===k||(j<4&&!G.alive[j]))continue;const yv=VAL[y&7]*(j===DEAD?.35:1);if(j===DEAD||!att(G,q,i=>i===j))v+=yv*.28;else if(yv>VAL[nt])v+=(yv-VAL[nt])*.18}}
  unmake(G);
  if(tk>=0&&(t===4||t===5||t===2))v+=(kdist(m.f,G.king[tk])-kdist(m.t,G.king[tk]))*.06;
  if(t===2||t===3||t===5)v+=(CEN(m.f)-CEN(m.t))*(t===5&&early?.02:.07);
  if((t===2||t===3)&&REL[k][m.f]===13)v+=.3;
  if(t===1){v+=(REL[k][m.f]-REL[k][m.t])*(early?.05:.14);const c0=rot((4-k)%4,(m.f/N)|0,m.f%N)[1];if(early&&(c0===6||c0===7))v+=.12}
  if(t===6&&!m.ca)v-=early?.5:.1;
  if(t===5&&early)v-=.15;
  v+=(Math.random()-.5)*2*noise;
  if(v>bv){bv=v;best=m}}
 return best}
X._e={N,ON,newGame,gen,legal,play,resign,make,unmake,attacked,inCheck,botPick,material,sqName,eliminate,REL,FWD,CASTLE,KHOME,DEAD,VAL,nextAlive};

/* ---------- arayüz ---------- */
const st={G:null,lvl:1,spd:1,sel:-1,tg:[],last:null,busy:false,tm:0,drag:null,el:{},layer:null,ev:[],shown:false,warn:{}};
const PAL4=[{lit:"#ee7f84",mid:"#c9434b",sh:"#8e2a30",st:"#3b1013",ln:"#ffd6d8",hi:"#ffc2c5",base:"#a8343b"},{lit:"#86b9e6",mid:"#4a8cc6",sh:"#2c5c88",st:"#10263b",ln:"#dcecfa",hi:"#cfe4f7",base:"#3a73a6"},
 {lit:"#f2d27a",mid:"#cf9f2c",sh:"#8d6a14",st:"#3d2d06",ln:"#fff1c9",hi:"#fff0c2",base:"#b58620"},{lit:"#8fcb9e",mid:"#529a66",sh:"#326643",st:"#122b1b",ln:"#dcf2e2",hi:"#cdebd6",base:"#43815a"},
 {lit:"#c9c9c6",mid:"#a3a3a0",sh:"#7d7d7a",st:"#4a4a48",ln:"#e9e9e6",hi:"#ececea",base:"#8f8f8c"}];
let IMG=null;
function imgs(){if(IMG)return IMG;IMG={};for(let k=0;k<5;k++)for(const t of[1,2,3,4,5,6]){const svg=typeof ch60PieceSvg==="function"?ch60PieceSvg(t,PAL4[k]):`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="34" fill="${PAL4[k].mid}" stroke="${PAL4[k].st}" stroke-width="4"/><text x="50" y="62" font-size="36" text-anchor="middle" fill="#fff" font-family="sans-serif">${" PAFKVŞ"[t]}</text></svg>`;IMG[k*8+t]="data:image/svg+xml,"+encodeURIComponent(svg)}return IMG}
const cfg=()=>{const d=LS.get("kadraj_s4",{})||{};return{lvl:[0,1,2].includes(d.lvl)?d.lvl:1,spd:[0,1,2].includes(d.spd)?d.spd:1}};
const saveCfg=()=>LS.set("kadraj_s4",{lvl:st.lvl,spd:st.spd});
const saveKey=()=>"kadraj_s4_"+(S.uid||"misafir");
const reduce=()=>typeof kbReduce==="function"&&kbReduce();
const snd=k=>{try{CSND.play(k)}catch{}};
const NAMES=["Sen","Mavi Bot","Sarı Bot","Yeşil Bot"];
const LVN=["Kolay","Normal","Zor"],SPN=["Yavaş","Normal","Hızlı"],SPD=[900,520,200];
const WHY={mat:"Mat oldu",pat:"Pat oldu",teslim:"Teslim oldu",son:"Son kalan",uzun:"Oyun çok uzadı"};

function css(){if(document.getElementById("s4Css"))return;const el=document.createElement("style");el.id="s4Css";el.textContent=`
.s4{position:absolute;inset:0;display:flex;flex-direction:column;background:var(--bg);color:var(--fg);pointer-events:auto;overflow:hidden;font-family:var(--f-body);padding-bottom:env(safe-area-inset-bottom,0px)}
.s4-hd{display:flex;align-items:center;gap:8px;padding:calc(8px + env(safe-area-inset-top,0px)) 10px 6px;flex:none}
.s4-hd b{flex:1;font:600 1.05rem/1.2 var(--f-display);min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.s4-hd small{display:block;font:600 .64rem/1.2 var(--f-mono);letter-spacing:.08em;color:var(--muted);text-transform:uppercase}
.s4-ib{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;flex:none;color:var(--fg)}
.s4-ib svg.i{width:1.35rem;height:1.35rem}
.s4-body{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;gap:8px;padding:0 6px 8px}
.s4-bw{flex:1 1 auto;min-height:0;width:100%;display:grid;place-items:center}
.s4-b{position:relative;width:var(--s4,360px);height:var(--s4,360px);touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
.s4-b>i,.s4-mk>i,.s4-p{position:absolute;left:0;top:0;width:calc(100%/14);height:calc(100%/14)}
.s4-b>i{background:#eeeed2}.s4-b>i.d{background:#769656}
.s4-b>i em{position:absolute;font:700 calc(var(--s4,360px)/14*.24)/1 var(--f-body);font-style:normal;color:#769656}.s4-b>i.d em{color:#eeeed2}
.s4-b>i em.r{left:2px;top:2px}.s4-b>i em.f{right:2px;bottom:1px}
.s4-mk{position:absolute;inset:0;pointer-events:none}
.s4-mk .lm{background:rgba(255,255,51,.5)}.s4-mk .sel{background:rgba(255,255,51,.55)}
.s4-mk .dot::after{content:"";position:absolute;inset:35%;border-radius:50%;background:rgba(0,0,0,.18)}
.s4-mk .cap::after{content:"";position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle,transparent 0 60%,rgba(0,0,0,.18) 61%)}
.s4-mk .chk{background:radial-gradient(circle,rgba(230,30,40,.95) 0,rgba(230,30,40,.55) 40%,transparent 72%)}
.s4-mk .hov{box-shadow:inset 0 0 0 2px rgba(255,255,255,.8)}
.s4-pcs{position:absolute;inset:0;pointer-events:none}
.s4-p{transition:transform .18s cubic-bezier(.25,.75,.3,1);will-change:transform}
.s4-p img{width:100%;height:100%;display:block;filter:drop-shadow(0 1px 1px rgba(0,0,0,.25))}
.s4-p.drag{transition:none;z-index:5}.s4-p.drag img{filter:drop-shadow(0 6px 5px rgba(0,0,0,.35))}
.s4-p.gone{transition:opacity .2s;opacity:0}
.s4-cn{position:absolute;width:calc(300%/14);height:calc(300%/14);padding:3px;display:grid}
.s4-cd{display:grid;align-content:center;justify-items:center;gap:2px;border-radius:12px;background:var(--surface);border:1.5px solid var(--line);padding:4px 3px;text-align:center;min-width:0;position:relative;transition:box-shadow .25s,opacity .25s}
.s4-cd .av{--s:calc(var(--s4,360px)/14*1.05)!important}
.s4-cd .av img{border-radius:8px}
.s4-cf{width:calc(var(--s4,360px)/14*1.05);height:calc(var(--s4,360px)/14*1.05);border-radius:9px;display:grid;place-items:center;background:var(--c);color:#fff}
.s4-cf svg.i{width:62%;height:62%}
.s4-cd b{font-size:calc(var(--s4,360px)/14*.3);line-height:1.15;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.s4-cd small{font:700 calc(var(--s4,360px)/14*.24)/1.1 var(--f-mono);color:var(--muted);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.s4-cd.on{border-color:var(--c);box-shadow:0 0 0 2px var(--c),0 4px 14px color-mix(in srgb,var(--c) 40%,transparent)}
.s4-cd.out{opacity:.5}.s4-cd.out b{text-decoration:line-through}
.s4-cd.chk small{color:#d23c3c}
.s4-cd .s4-dots{position:absolute;top:4px;right:5px;display:flex;gap:2px}.s4-cd .s4-dots i{width:4px;height:4px;border-radius:50%;background:var(--c);animation:s4dot 1s infinite}.s4-cd .s4-dots i:nth-child(2){animation-delay:.15s}.s4-cd .s4-dots i:nth-child(3){animation-delay:.3s}
@keyframes s4dot{50%{opacity:.25}}
.s4-ft{width:100%;max-width:640px;display:grid;gap:8px;flex:none}
.s4-log{display:flex;gap:2px;align-items:center;overflow-x:auto;scrollbar-width:none;min-height:34px;padding:3px 5px;border-radius:12px;background:var(--surface);border:1px solid var(--line)}
.s4-log::-webkit-scrollbar{display:none}
.s4-log span{flex:none;padding:4px 6px;border-radius:6px;font-weight:700;font-size:.82rem;display:inline-flex;align-items:center;gap:4px}
.s4-log span i{width:8px;height:8px;border-radius:50%;background:var(--c)}
.s4-log span.cur{background:color-mix(in srgb,var(--fg) 12%,transparent)}
.s4-log em{font-style:normal;color:var(--muted);font-size:.8rem;padding:0 6px}
.s4-ctl{display:flex;gap:2px;padding:4px;border-radius:16px;background:var(--surface);border:1px solid var(--line)}
.s4-ctl button{flex:1 1 0;min-width:0;display:grid;justify-items:center;gap:2px;padding:7px 0 6px;border-radius:12px;font-size:.64rem;font-weight:700;color:var(--muted)}
.s4-ctl button svg.i{width:1.35rem;height:1.35rem;color:var(--fg)}
.s4-ctl button:disabled{opacity:.38}
@media (hover:hover){.s4-ctl button:not(:disabled):hover{background:var(--surface-2);color:var(--fg)}}
.s4-ov{position:absolute;inset:0;display:none;place-items:center;background:rgba(10,14,12,.45);z-index:30;padding:12px}
.s4-ov.on{display:grid}
.s4-card{width:min(100%,340px);max-height:100%;overflow:auto;background:var(--surface);color:var(--fg);border-radius:22px;box-shadow:var(--shadow);display:grid;gap:10px;padding:18px 16px 14px;justify-items:center;text-align:center;animation:s4pop .3s cubic-bezier(.2,1.4,.4,1)}
@keyframes s4pop{from{transform:scale(.85);opacity:0}}
.s4-card .ic{width:50px;height:50px;border-radius:16px;display:grid;place-items:center;background:var(--c,#81b64c);color:#fff}
.s4-card .ic svg.i{width:1.5rem;height:1.5rem}
.s4-card>b{font:600 1.3rem/1.2 var(--f-display)}.s4-card>span{color:var(--muted);font-size:.86rem}
.s4-rank{display:grid;gap:4px;width:100%;margin:2px 0}
.s4-rank div{display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:10px;background:var(--surface-2);font-size:.86rem;text-align:left}
.s4-rank div b{width:1.2rem;font-family:var(--f-mono)}.s4-rank div i{width:12px;height:12px;border-radius:4px;background:var(--c);flex:none}.s4-rank div span{flex:1}.s4-rank div small{color:var(--muted)}
.s4-card .btns{display:grid;gap:6px;width:100%}
.s4-seg{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:4px;padding:4px;border-radius:14px;background:var(--surface-2);width:100%}
.s4-seg button{min-height:2.3rem;border-radius:10px;font-weight:700;font-size:.82rem;color:var(--muted)}
.s4-seg button[aria-pressed="true"]{background:var(--surface);color:var(--fg);box-shadow:var(--shadow-s)}
.s4-lbl{justify-self:start;font-size:.78rem;font-weight:700;color:var(--muted)}
@media (min-width:900px){.s4-body{flex-direction:row;align-items:stretch;justify-content:center;padding:0 16px 14px;gap:16px}.s4-bw{flex:0 0 auto;width:auto}.s4-ft{width:300px;align-content:start}.s4-log{flex-wrap:wrap;max-height:60vh;overflow-y:auto;align-content:flex-start}}
html.reduce-motion .s4-p{transition:none}html.reduce-motion .s4-card{animation:none}html.reduce-motion .s4-cd .s4-dots i{animation:none}
@media (prefers-reduced-motion:reduce){.s4-p{transition:none}.s4-card{animation:none}}`;document.head.appendChild(el)}

const xy=s=>[s%N,(s/N)|0];
const tf=s=>{const[x,y]=xy(s);return`translate(${x*100}%,${y*100}%)`};
function squaresHtml(){let h="";for(let s=0;s<SQ;s++){if(!ON[s])continue;const[x,y]=xy(s);const d=(x+y)%2===1;const left=x===0||!ON[s-1],bottom=y===13||!ON[s+N];
 h+=`<i class="${d?"d":"l"}" style="transform:${tf(s)}">${left?`<em class="r">${N-y}</em>`:""}${bottom?`<em class="f">${"abcdefghijklmn"[x]}</em>`:""}</i>`}return h}
/* köşe kartları: Kırmızı sol alt, Mavi sol üst, Sarı sağ üst, Yeşil sağ alt */
const CORNER=[[0,11],[0,0],[11,0],[11,11]];
function cardHtml(k){const G=st.G;const on=!G.over&&G.turn===k&&G.alive[k];const out=!G.alive[k];const el=G.elim.find(e=>e.k===k);
 const chk=!out&&inCheck(G,k);const sub=out?(WHY[el&&el.why]||"Elendi"):chk?"Şah!":`${G.cap[k]} puan`;
 const av=k===0?avatar(S.uid,40,{click:false,ring:false}):`<span class="s4-cf">${I("admbot")}</span>`;
 return`<div class="s4-cd${on?" on":""}${out?" out":""}${chk?" chk":""}" style="--c:${CHEX[k]}">${av}<b>${esc(k===0?"Sen":NAMES[k])}</b><small>${esc(sub)}</small>${on&&k!==0&&st.busy?'<span class="s4-dots"><i></i><i></i><i></i></span>':""}</div>`}
function shell(){const r=st.root;r.innerHTML=`<div class="s4-hd"><button class="s4-ib" data-s4="close" aria-label="Kapat">${I("back")}</button><b>4 Kişilik Satranç<small id="s4Sub"></small></b><button class="s4-ib" data-s4="menu" aria-label="Seçenekler">${I("more")}</button></div>
 <div class="s4-body"><div class="s4-bw" id="s4Bw"><div class="s4-b" id="s4B">${squaresHtml()}<div class="s4-mk" id="s4Mk"></div><div class="s4-pcs" id="s4Pcs"></div>${[0,1,2,3].map(k=>`<div class="s4-cn" id="s4C${k}" style="left:${CORNER[k][0]*100/14}%;top:${CORNER[k][1]*100/14}%"></div>`).join("")}</div></div>
 <div class="s4-ft"><div class="s4-log" id="s4Log" aria-live="polite"></div><div class="s4-ctl" id="s4Ctl"></div></div></div><div class="s4-ov" id="s4Ov"></div>`;
 r.onclick=onClick;wire();fit()}
function fit(){const bw=$("#s4Bw"),b=$("#s4B");if(!bw||!b||!st.root)return;const wide=innerWidth>=900;const w=wide?st.root.clientWidth-300-48:bw.clientWidth,h=bw.clientHeight;const s=Math.max(240,Math.floor(Math.min(w,h,820)/14)*14);b.style.setProperty("--s4",s+"px");st.root.style.setProperty("--s4",s+"px")}
function drawPieces(){const G=st.G,pc=$("#s4Pcs");if(!pc)return;const im=imgs();pc.innerHTML="";st.el={};
 for(let s=0;s<SQ;s++){const p=G.b[s];if(!p)continue;const d=document.createElement("div");d.className="s4-p";d.style.transform=tf(s);d.innerHTML=`<img src="${im[p]}" alt="" draggable="false">`;pc.appendChild(d);st.el[s]=d}}
function marks(){const mk=$("#s4Mk");if(!mk)return;const G=st.G;let h="";
 if(st.last)h+=`<i class="lm" style="transform:${tf(st.last.f)}"></i><i class="lm" style="transform:${tf(st.last.t)}"></i>`;
 for(let k=0;k<4;k++)if(G.alive[k]&&inCheck(G,k))h+=`<i class="chk" style="transform:${tf(G.king[k])}"></i>`;
 if(st.sel>=0){h+=`<i class="sel" style="transform:${tf(st.sel)}"></i>`;for(const m of st.tg)h+=`<i class="${m.x?"cap":"dot"}" style="transform:${tf(m.t)}"></i>`}
 if(st.hov>=0)h+=`<i class="hov" style="transform:${tf(st.hov)}"></i>`;
 mk.innerHTML=h}
function cards(){for(let k=0;k<4;k++){const c=$("#s4C"+k);if(c)c.innerHTML=cardHtml(k)}}
function logUI(){const l=$("#s4Log");if(!l)return;const G=st.G;
 l.innerHTML=G.log.length?G.log.map((x,i)=>`<span class="${i===G.log.length-1?"cur":""}" style="--c:${CHEX[x.k]}"><i></i>${esc(x.s)}</span>`).join(""):`<em>${G.turn===0?"İlk hamle senden. Kırmızı taşlar senin.":"Oyun başlıyor"}</em>`;
 const c=l.querySelector(".cur");if(c)c.scrollIntoView({inline:"nearest",block:"nearest"})}
function ctlUI(){const c=$("#s4Ctl");if(!c)return;const G=st.G;const me=G.alive[0]&&!G.over;
 const B=(a,ic,t,dis)=>`<button data-s4="${a}" ${dis?"disabled":""}>${I(ic)}<span>${t}</span></button>`;
 c.innerHTML=B("resign","flag","Teslim ol",!me)+B("new","rotate","Yeni oyun")+B("speed","chclock",SPN[st.spd])+B("menu","more","Seçenekler");
 const sub=$("#s4Sub");if(sub)sub.textContent=G.over?"Oyun bitti":`${LVN[st.lvl]} botlar · ${Math.floor(G.ply/4)+1}. tur`}
function ui(){cards();marks();logUI();ctlUI()}
const human=()=>st.G&&!st.G.over&&st.G.turn===0&&st.G.alive[0]&&!st.busy;

/* hamle animasyonu ve olaylar */
function animate(m,x){const el=st.el;const cap=el[m.t];if(cap&&cap!==el[m.f]){delete el[m.t];cap.classList.add("gone");setTimeout(()=>cap.remove(),220)}
 const e=el[m.f];if(e){delete el[m.f];e.classList.remove("drag");e.style.transform=tf(m.t);el[m.t]=e;if(m.pr){const im=e.querySelector("img");if(im)setTimeout(()=>{im.src=imgs()[m.k*8+m.pr]},reduce()?0:170)}}
 if(m.ca){const r=el[m.ca.rook];if(r){delete el[m.ca.rook];r.style.transform=tf(m.ca.rto);el[m.ca.rto]=r}}}
function afterMove(m,x,ev){st.last={f:m.f,t:m.t};st.sel=-1;st.tg=[];
 const ck=ev.filter(e=>e.e==="check").map(e=>e.k);const chk=ck.some(k=>!(st.chk||[]).includes(k));st.chk=ck;const el=ev.filter(e=>e.e==="elim");
 animate(m,x);
 if(el.length||ev.some(e=>e.e==="over")){setTimeout(()=>{drawPieces();marks()},reduce()?0:240)}
 snd(m.pr?"promote":chk?"check":m.ca?"castle":x?"capture":"move");
 for(const e of el){toastE(e)}
 save();ui();
 if(st.G.over){setTimeout(endCard,el.length?700:450);return}
 if(el.some(e=>e.k===0)){setTimeout(()=>outCard(e0(el)),600);return}
 schedule()}
const e0=el=>el.find(e=>e.k===0);
function toastE(e){const t=`${CNAME[e.k]} ${e.k===0?"(sen) ":""}elendi: ${(WHY[e.why]||"").toLocaleLowerCase("tr")}`;try{toast(t)}catch{}if(e.k===0)snd("lose")}
function schedule(){clearTimeout(st.tm);const G=st.G;if(!G||G.over||!st.shown)return;if(G.turn===0&&G.alive[0]){st.busy=false;ui();return}
 st.busy=true;cards();const tok=G;st.tm=setTimeout(()=>{if(st.G!==tok||!st.shown)return;const k=G.turn;if(k===0||!G.alive[k]){st.busy=false;return}
  const m=botPick(G,k,st.lvl);if(!m){st.busy=false;return}const x=G.b[m.t];const ev=play(G,m);st.ev.push(["m",m.f,m.t,m.pr]);st.busy=false;afterMove(m,x,ev)},SPD[st.spd]*(G.alive[0]?1:.6)+(Math.random()*.4-.2)*SPD[st.spd])}
function userMove(m){if(!human())return;const G=st.G;const x=G.b[m.t];const ev=play(G,m);st.ev.push(["m",m.f,m.t,m.pr]);vib(8);afterMove(m,x,ev)}

/* giriş */
function sqAt(e){const b=$("#s4B");if(!b)return-1;const r=b.getBoundingClientRect();const x=Math.floor((e.clientX-r.left)/r.width*N),y=Math.floor((e.clientY-r.top)/r.height*N);if(x<0||x>=N||y<0||y>=N)return-1;const s=y*N+x;return ON[s]?s:-1}
function select(s){const G=st.G;st.sel=s;st.tg=s<0?[]:legal(G,0).filter(m=>m.f===s);marks()}
function wire(){const b=$("#s4B");if(!b)return;
 b.onpointerdown=e=>{if(e.button>0&&e.pointerType==="mouse")return;const s=sqAt(e);if(s<0||!st.G)return;const G=st.G;
  if(st.sel>=0&&st.tg.some(m=>m.t===s)){const m=st.tg.find(m=>m.t===s);userMove(m);return}
  const p=G.b[s];if(p&&(p>>3)===0&&human()){const was=st.sel===s;select(s);st.drag={s,el:st.el[s],x:e.clientX,y:e.clientY,moved:false,was};try{b.setPointerCapture(e.pointerId)}catch{}e.preventDefault()}
  else{if(p&&(p>>3)===0&&!human()&&!G.over&&G.alive[0])try{toast("Sıra botlarda, biraz bekle.")}catch{};select(-1)}};
 b.onpointermove=e=>{const D=st.drag;if(!D||!D.el)return;if(!D.moved&&Math.hypot(e.clientX-D.x,e.clientY-D.y)>5){D.moved=true;D.el.classList.add("drag")}
  if(D.moved){const r=b.getBoundingClientRect(),z=r.width/N;const touch=e.pointerType!=="mouse";D.el.style.transform=`translate(${e.clientX-r.left-z/2}px,${e.clientY-r.top-z/2-(touch?z*.6:0)}px) scale(${touch?1.45:1.1})`;const h=sqAt(e);if(h!==st.hov){st.hov=h;marks()}}};
 const up=e=>{const D=st.drag;st.drag=null;if(st.hov>=0){st.hov=-1;marks()}if(!D)return;
  if(D.moved){const s=sqAt(e);const m=st.tg.find(x=>x.t===s);if(s>=0&&s!==D.s&&m&&human()){userMove(m);return}D.el.classList.remove("drag");D.el.style.transform=tf(D.s);if(s>=0&&s!==D.s)snd("bad")}
  else if(D.was)select(-1)};
 b.onpointerup=up;b.onpointercancel=()=>{const D=st.drag;st.drag=null;st.hov=-1;if(D&&D.el){D.el.classList.remove("drag");D.el.style.transform=tf(D.s)}marks()};
 b.oncontextmenu=e=>e.preventDefault()}
function onClick(e){const t=e.target.closest("[data-s4]");if(!t)return;const a=t.dataset.s4;
 if(a==="close")return closeLayer("s4");
 if(a==="new")return st.G&&!st.G.over&&st.G.ply&&st.G.alive[0]?dialog("Yeni oyun?","Bu oyun yarıda kalır.",[{label:"Yeni oyun",fn:()=>start(true)},{label:"Vazgeç"}]):start(true);
 if(a==="resign")return dialog("Teslim olunsun mu?","Oyundan çıkarsın; botlar aralarında devam eder.",[{label:"Teslim ol",cls:"danger",fn:()=>{const G=st.G;if(!G||G.over||!G.alive[0])return;clearTimeout(st.tm);const ev=resign(G,0);st.ev.push(["r",0]);st.busy=false;drawPieces();snd("lose");save();ui();if(G.over)setTimeout(endCard,400);else outCard({k:0,why:"teslim"})}},{label:"Vazgeç"}]);
 if(a==="speed"){st.spd=(st.spd+1)%3;saveCfg();ctlUI();return}
 if(a==="menu")return menu();
 if(a==="watch"){$("#s4Ov").classList.remove("on");schedule();return}
 if(a==="again"){$("#s4Ov").classList.remove("on");return start(true)}
 if(a==="ovx"){$("#s4Ov").classList.remove("on");return}
 if(a==="lvl"){st.lvl=+t.dataset.v;saveCfg();$$("[data-s4='lvl']").forEach(b=>b.setAttribute("aria-pressed",String(+b.dataset.v===st.lvl)));ctlUI();return}}
function menu(){const ov=$("#s4Ov");ov.innerHTML=`<div class="s4-card" role="dialog" aria-label="Seçenekler"><b>Seçenekler</b><span class="s4-lbl">Botların seviyesi</span><div class="s4-seg">${LVN.map((n,i)=>`<button data-s4="lvl" data-v="${i}" aria-pressed="${st.lvl===i}">${n}</button>`).join("")}</div>
 <span>Kırmızı sensin; sıra saat yönünde. Mat ya da pat olan, teslim olan elenir; elenenin taşları gri kalır, herkes alabilir. Piyon ortadaki 8. sıraya varınca vezir olur. Son kalan kazanır.</span>
 <div class="btns"><button class="btn" data-s4="ovx">Tamam</button></div></div>`;ov.classList.add("on")}
function outCard(e){const ov=$("#s4Ov");if(!ov||st.G.over)return;ov.innerHTML=`<div class="s4-card" style="--c:${CHEX[0]}"><span class="ic">${I("flag")}</span><b>Elendin</b><span>${esc(WHY[e&&e.why]||"")}. Botlar aralarında oynamaya devam ediyor.</span><div class="btns"><button class="btn" data-s4="watch">İzlemeye devam</button><button class="btn sec" data-s4="again">${I("rotate")}Yeni oyun</button></div></div>`;ov.classList.add("on")}
function endCard(){const G=st.G;if(!G||!G.over)return;const ov=$("#s4Ov");if(!ov)return;const w=G.over.win;const me=w===0;
 const order=[w,...G.elim.slice().reverse().map(e=>e.k)].filter((k,i,a)=>k>=0&&a.indexOf(k)===i);for(let k=0;k<4;k++)if(!order.includes(k))order.push(k);
 ov.innerHTML=`<div class="s4-card" style="--c:${me?"#81b64c":CHEX[w]||"#9aa39e"}"><span class="ic">${I(me?"trophy":"knight")}</span><b>${me?"Kazandın!":w>=0?`${esc(NAMES[w])} kazandı`:"Oyun bitti"}</b><span>${esc(WHY[G.over.why]||"")} · ${Math.floor(G.ply/4)+1} tur</span>
 <div class="s4-rank">${order.map((k,i)=>{const e=G.elim.find(x=>x.k===k);return`<div style="--c:${CHEX[k]}"><b>${i+1}.</b><i></i><span>${esc(k===0?"Sen":NAMES[k])}</span><small>${k===w?"Kazanan":esc(WHY[e&&e.why]||"")} · ${G.cap[k]} puan</small></div>`}).join("")}</div>
 <div class="btns"><button class="btn" data-s4="again">${I("rotate")}Yeni oyun</button><button class="btn ghost" data-s4="ovx">Tahtaya bak</button></div></div>`;ov.classList.add("on");
 snd(me?"end":"lose");save()}

/* kayıt */
function save(){try{const G=st.G;if(!G)return;if(G.over){LS.del(saveKey());return}LS.set(saveKey(),{ev:st.ev,lvl:st.lvl,at:Date.now()})}catch{}}
function load(){const d=LS.get(saveKey(),null);if(!d||!Array.isArray(d.ev)||!d.ev.length)return false;const G=newGame();const ev=[];
 try{for(const e of d.ev){if(G.over)break;if(e[0]==="r"){resign(G,e[1]);ev.push(e);continue}const m=legal(G,G.turn).find(x=>x.f===e[1]&&x.t===e[2]&&(x.pr||0)===(e[3]||0));if(!m)break;play(G,m);ev.push(e)}}catch(err){console.warn("s4",err);return false}
 if(G.over)return false;st.G=G;st.ev=ev;const l=G.log[G.log.length-1];st.last=l?{f:l.f,t:l.t}:null;return true}
function start(fresh){clearTimeout(st.tm);const c=cfg();st.lvl=c.lvl;st.spd=c.spd;st.sel=-1;st.tg=[];st.hov=-1;st.busy=false;st.drag=null;st.chk=[];
 if(fresh||!load()){st.G=newGame();st.ev=[];st.last=null;if(fresh)LS.del(saveKey());setTimeout(()=>snd("start"),200)}
 const ov=$("#s4Ov");if(ov){ov.classList.remove("on");ov.innerHTML=""}
 drawPieces();ui();schedule()}
X.open=function(){if(!S.admin)return;css();if(st.layer&&document.body.contains(st.layer))return;
 const l=openLayer("s4",`<div class="s4" id="s4"></div>`,{noScrim:true,onClose:()=>{st.shown=false;clearTimeout(st.tm);removeEventListener("resize",fit);st.layer=null}});
 st.layer=l;st.root=$("#s4",l);st.shown=true;shell();addEventListener("resize",fit);requestAnimationFrame(fit);start(false)};
X.state=()=>st;
X._t={endCard,ui,drawPieces,schedule};
})();
