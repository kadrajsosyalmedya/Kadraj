/* Kadraj Cephe: piksel savaş oyunu (5.8.0).
   index.html bu dosyayı yalnızca Keşfet'teki Cephe kartına dokunulunca yükler (cpOpen) ve window.CEPHE.open() çağırır.
   Kadraj'ın genel adlarını kullanır: S, DB, I, esc, toast, openLayer, closeLayer, sheet, P, me, humans, sendMessage, rid, now, vib, kbReduce, LS, APP_V.
   Haritalar cephe/<ad>.json: {W,H,bb,names,rle} (Natural Earth 1:50m'den ızgaraya çizildi; rle = [ülke,uzunluk,...], 0 deniz).
   Oyun: hücre ızgarası; owner[c] = -2 deniz, -1 boş kara, >=0 oyuncu. Kurucu (ya da tek kişilik oyunda bu cihaz) 100 ms'de bir benzetimi yürütür.
   Arkadaşla: oda games/cp-<KOD> (alanlar: cp, host, sc, diff, nb, st, oy, s), komutlar games/cp-<KOD>-<uid> ({q: JSON}), anlık görüntü `s` (JSON metin, saniyede bir).
   Asker gücü: seviye 1-10, asker başına güç seviye×10 (2. seviyede 15.000 asker, 1. seviyede 30.000 askere denk). */
(()=>{"use strict";
if(window.CEPHE)return;
const CP={};window.CEPHE=CP;

/* ---------- senaryolar ---------- */
const SC=[
 {id:"avrasya",n:"Avrasya",map:"avrasya",d:"Avrupa'dan Japonya'ya koca kıta",b:[["Rusya","ru",50,57],["Çin","cn",104,34],["Hindistan","in",78,22],["Almanya","de",10,51],["Fransa","fr",2,46.5],["Britanya","gb",-2,53],["İran","ir",53,32],["Japonya","jp",138,36],["Kazakistan","kz",67,48],["Türkiye","tr",35,39],["Pakistan","pk",70,30],["Suudi Arabistan","sa",45,24],["Moğolistan","mn",103,47],["İspanya","es",-4,40],["Polonya","pl",19,52],["Ukrayna","ua",31,49]]},
 {id:"dunya",n:"Dünya",map:"dunya",d:"Bütün kıtalar, okyanus aşırı savaş",b:[["ABD","us",-98,39],["Rusya","ru",70,60],["Çin","cn",103,34],["Brezilya","br",-50,-10],["Hindistan","in",78,22],["Almanya","de",10,51],["Avustralya","au",134,-25],["Kanada","ca",-106,56],["Mısır","eg",30,26],["Japonya","jp",138,36],["Arjantin","ar",-64,-35],["Nijerya","ng",8,9],["İran","ir",53,32],["Endonezya","id",113,-1],["Fransa","fr",2,46.5],["Kazakistan","kz",67,48]]},
 {id:"avrupa",n:"Avrupa",map:"avrupa",d:"Sıkışık sınırlar, hızlı çatışma",b:[["Almanya","de",10,51],["Fransa","fr",2,46.5],["Britanya","gb",-2,53],["İtalya","it",12.5,42.8],["İspanya","es",-3.7,40.4],["Polonya","pl",19,52],["Ukrayna","ua",31,49],["Rusya","ru",37,55.7],["İsveç","se",15,62],["Yunanistan","gr",22,39.5],["Romanya","ro",25,45.8],["Türkiye","tr",32.8,39.9]]},
 {id:"asya",n:"Asya",map:"asya",d:"Bozkırlar, dağlar ve adalar",b:[["Çin","cn",104,34],["Hindistan","in",78,22],["Japonya","jp",138,36],["Rusya","ru",90,60],["Kazakistan","kz",67,48],["İran","ir",53,32],["Pakistan","pk",70,30],["Suudi Arabistan","sa",45,24],["Endonezya","id",113,-1],["Vietnam","vn",106,16],["Moğolistan","mn",103,47],["Güney Kore","kr",127.8,36.5]]},
 {id:"kore",n:"Kore Savaşı (1950)",map:"kore",d:"Yarımadada kuzey ile güney",b:[["Kuzey Kore","kp",126.5,39.8],["Güney Kore","kr",127.6,36.4],["Çin","cn",124.6,42.3],["Birleşmiş Milletler","un",129.1,35.3],["Japonya","jp",130.6,33.4]]},
 {id:"ww1",n:"1. Dünya Savaşı (1914)",map:"avrupa",d:"İmparatorluklar çarpışıyor",b:[["Osmanlı","osm",32.8,39.9],["Alman İmparatorluğu","dei",13.4,52.5],["Avusturya-Macaristan","ah",16.4,48.2],["Rus İmparatorluğu","ru",37.6,55.7],["Fransa","fr",2.3,48.8],["Britanya","gb",-1.5,52.5],["İtalya","it",12.5,41.9],["Sırbistan","rs",20.5,44.8],["Bulgaristan","bg",23.3,42.7],["Romanya","ro",26.1,44.4]]},
 {id:"ww2",n:"2. Dünya Savaşı (1939)",map:"avrasya",d:"Avrupa'dan Pasifik'e cepheler",b:[["Almanya","dei",13.4,52.5],["Sovyetler Birliği","su",37.6,55.7],["Japonya","jp",139.7,35.7],["Britanya","gb",-1.5,52.5],["Fransa","fr",2.3,48.8],["İtalya","it",12.5,41.9],["Çin","cn",106.5,29.5],["Polonya","pl",21,52.2],["Türkiye","tr",32.8,39.9]]}
];
const DIFF={kolay:{n:"Kolay",g:.75,think:2600,pct:.3,nuke:0,lvl:.4},normal:{n:"Normal",g:1,think:1500,pct:.45,nuke:.5,lvl:.7},zor:{n:"Zor",g:1.3,think:800,pct:.6,nuke:1,lvl:1}};

/* ---------- bayraklar (tuval çizimi, sadeleştirilmiş) ---------- */
const bands=(x,w,h,cs,v)=>cs.forEach((c,i)=>{x.fillStyle=c;v?x.fillRect(w*i/cs.length,0,Math.ceil(w/cs.length)+1,h):x.fillRect(0,h*i/cs.length,w,Math.ceil(h/cs.length)+1)});
const circ=(x,cx,cy,r,c)=>{x.fillStyle=c;x.beginPath();x.arc(cx,cy,r,0,7);x.fill()};
function star(x,cx,cy,R,c,rot=-Math.PI/2){x.fillStyle=c;x.beginPath();for(let i=0;i<10;i++){const r=i%2?R*.42:R,a=rot+i*Math.PI/5;x.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r)}x.closePath();x.fill()}
function cres(x,w,h,bg,fg,cx=.38){circ(x,w*cx,h*.5,h*.25,fg);circ(x,w*cx+h*.065,h*.5,h*.2,bg);star(x,w*cx+h*.24,h*.5,h*.09,fg,0)}
const nordic=(x,w,h,bg,fg)=>{x.fillStyle=bg;x.fillRect(0,0,w,h);x.fillStyle=fg;x.fillRect(w*.3,0,w*.13,h);x.fillRect(0,h*.42,w,h*.16)};
const FL={
 kadraj:["Kadraj",(x,w,h)=>{x.fillStyle="#0C7A63";x.fillRect(0,0,w,h);x.strokeStyle="#fff";x.lineWidth=h*.08;const m=h*.2,l=h*.2;x.beginPath();[[m,m,1,1],[w-m,m,-1,1],[m,h-m,1,-1],[w-m,h-m,-1,-1]].forEach(([a,b,s,t])=>{x.moveTo(a,b+t*l);x.lineTo(a,b);x.lineTo(a+s*l,b)});x.stroke();circ(x,w*.5,h*.5,h*.12,"#F59E0B")}],
 tr:["Türkiye",(x,w,h)=>{x.fillStyle="#E30A17";x.fillRect(0,0,w,h);cres(x,w,h,"#E30A17","#fff")}],
 osm:["Osmanlı",(x,w,h)=>{x.fillStyle="#B0141E";x.fillRect(0,0,w,h);cres(x,w,h,"#B0141E","#fff",.42)}],
 de:["Almanya",(x,w,h)=>bands(x,w,h,["#111","#DD0000","#FFCE00"])],
 dei:["Alman İmparatorluğu",(x,w,h)=>bands(x,w,h,["#111","#fff","#DD0000"])],
 fr:["Fransa",(x,w,h)=>bands(x,w,h,["#0055A4","#fff","#EF4135"],1)],
 gb:["Britanya",(x,w,h)=>{x.fillStyle="#012169";x.fillRect(0,0,w,h);x.strokeStyle="#fff";x.lineWidth=h*.2;x.beginPath();x.moveTo(0,0);x.lineTo(w,h);x.moveTo(w,0);x.lineTo(0,h);x.stroke();x.strokeStyle="#C8102E";x.lineWidth=h*.07;x.stroke();x.fillStyle="#fff";x.fillRect(w*.42,0,w*.16,h);x.fillRect(0,h*.37,w,h*.26);x.fillStyle="#C8102E";x.fillRect(w*.455,0,w*.09,h);x.fillRect(0,h*.42,w,h*.16)}],
 it:["İtalya",(x,w,h)=>bands(x,w,h,["#009246","#fff","#CE2B37"],1)],
 es:["İspanya",(x,w,h)=>bands(x,w,h,["#AA151B","#F1BF00","#F1BF00","#AA151B"])],
 pl:["Polonya",(x,w,h)=>bands(x,w,h,["#fff","#DC143C"])],
 ua:["Ukrayna",(x,w,h)=>bands(x,w,h,["#0057B7","#FFD700"])],
 ru:["Rusya",(x,w,h)=>bands(x,w,h,["#fff","#0039A6","#D52B1E"])],
 su:["Sovyetler Birliği",(x,w,h)=>{x.fillStyle="#CC0000";x.fillRect(0,0,w,h);star(x,w*.2,h*.25,h*.13,"#FFD700")}],
 se:["İsveç",(x,w,h)=>nordic(x,w,h,"#006AA7","#FECC00")],
 gr:["Yunanistan",(x,w,h)=>{bands(x,w,h,["#0D5EAF","#fff","#0D5EAF","#fff","#0D5EAF","#fff","#0D5EAF","#fff","#0D5EAF"]);x.fillStyle="#0D5EAF";x.fillRect(0,0,w*.37,h*.56);x.fillStyle="#fff";x.fillRect(w*.15,0,w*.07,h*.56);x.fillRect(0,h*.22,w*.37,h*.11)}],
 ro:["Romanya",(x,w,h)=>bands(x,w,h,["#002B7F","#FCD116","#CE1126"],1)],
 ah:["Avusturya-Macaristan",(x,w,h)=>{bands(x,w,h,["#ED2939","#fff","#ED2939"]);x.fillStyle="#477050";x.fillRect(w*.5,h*.66,w*.5,h*.34)}],
 rs:["Sırbistan",(x,w,h)=>bands(x,w,h,["#C6363C","#0C4076","#fff"])],
 bg:["Bulgaristan",(x,w,h)=>bands(x,w,h,["#fff","#00966E","#D62612"])],
 us:["ABD",(x,w,h)=>{bands(x,w,h,Array.from({length:13},(_,i)=>i%2?"#fff":"#B22234"));x.fillStyle="#3C3B6E";x.fillRect(0,0,w*.42,h*.54);for(let i=0;i<4;i++)for(let j=0;j<5;j++)circ(x,w*(.05+j*.08),h*(.08+i*.13),h*.025,"#fff")}],
 br:["Brezilya",(x,w,h)=>{x.fillStyle="#009C3B";x.fillRect(0,0,w,h);x.fillStyle="#FFDF00";x.beginPath();x.moveTo(w*.08,h*.5);x.lineTo(w*.5,h*.1);x.lineTo(w*.92,h*.5);x.lineTo(w*.5,h*.9);x.fill();circ(x,w*.5,h*.5,h*.22,"#002776")}],
 cn:["Çin",(x,w,h)=>{x.fillStyle="#DE2910";x.fillRect(0,0,w,h);star(x,w*.17,h*.27,h*.16,"#FFDE00");[[.33,.1],[.4,.2],[.4,.35],[.33,.45]].forEach(([a,b])=>star(x,w*a,h*b,h*.05,"#FFDE00"))}],
 in:["Hindistan",(x,w,h)=>{bands(x,w,h,["#FF9933","#fff","#138808"]);x.strokeStyle="#000080";x.lineWidth=h*.03;x.beginPath();x.arc(w*.5,h*.5,h*.12,0,7);x.stroke()}],
 jp:["Japonya",(x,w,h)=>{x.fillStyle="#fff";x.fillRect(0,0,w,h);circ(x,w*.5,h*.5,h*.3,"#BC002D")}],
 kr:["Güney Kore",(x,w,h)=>{x.fillStyle="#fff";x.fillRect(0,0,w,h);circ(x,w*.5,h*.5,h*.25,"#003478");x.fillStyle="#CD2E3A";x.beginPath();x.arc(w*.5,h*.5,h*.25,Math.PI,0);x.fill();x.fillStyle="#111";[[.18,.22],[.82,.22],[.18,.78],[.82,.78]].forEach(([a,b])=>x.fillRect(w*a-w*.04,h*b-h*.08,w*.08,h*.16))}],
 kp:["Kuzey Kore",(x,w,h)=>{bands(x,w,h,["#024FA2","#fff","#ED1C27","#ED1C27","#ED1C27","#fff","#024FA2"]);circ(x,w*.33,h*.5,h*.17,"#fff");star(x,w*.33,h*.5,h*.15,"#ED1C27")}],
 ir:["İran",(x,w,h)=>bands(x,w,h,["#239F40","#fff","#DA0000"])],
 pk:["Pakistan",(x,w,h)=>{x.fillStyle="#01411C";x.fillRect(0,0,w,h);x.fillStyle="#fff";x.fillRect(0,0,w*.25,h);cres(x,w,h,"#01411C","#fff",.6)}],
 sa:["Suudi Arabistan",(x,w,h)=>{x.fillStyle="#006C35";x.fillRect(0,0,w,h);x.fillStyle="#fff";x.fillRect(w*.2,h*.62,w*.6,h*.06);x.fillRect(w*.25,h*.3,w*.5,h*.16)}],
 kz:["Kazakistan",(x,w,h)=>{x.fillStyle="#00AFCA";x.fillRect(0,0,w,h);circ(x,w*.5,h*.45,h*.18,"#FEC50C")}],
 mn:["Moğolistan",(x,w,h)=>{bands(x,w,h,["#C4272F","#015197","#C4272F"],1);x.fillStyle="#F9CF02";x.fillRect(w*.12,h*.25,w*.1,h*.5)}],
 vn:["Vietnam",(x,w,h)=>{x.fillStyle="#DA251D";x.fillRect(0,0,w,h);star(x,w*.5,h*.52,h*.3,"#FFFF00")}],
 id:["Endonezya",(x,w,h)=>bands(x,w,h,["#CE1126","#fff"])],
 eg:["Mısır",(x,w,h)=>{bands(x,w,h,["#CE1126","#fff","#111"]);circ(x,w*.5,h*.5,h*.09,"#C09300")}],
 ng:["Nijerya",(x,w,h)=>bands(x,w,h,["#008751","#fff","#008751"],1)],
 ar:["Arjantin",(x,w,h)=>{bands(x,w,h,["#74ACDF","#fff","#74ACDF"]);circ(x,w*.5,h*.5,h*.1,"#F6B40E")}],
 ca:["Kanada",(x,w,h)=>{bands(x,w,h,["#D80621","#fff","#fff","#D80621"],1);star(x,w*.5,h*.5,h*.26,"#D80621")}],
 au:["Avustralya",(x,w,h)=>{x.fillStyle="#012169";x.fillRect(0,0,w,h);x.fillStyle="#fff";x.fillRect(w*.2,0,w*.06,h*.5);x.fillRect(0,h*.21,w*.46,h*.08);x.fillStyle="#C8102E";x.fillRect(w*.215,0,w*.03,h*.5);x.fillRect(0,h*.23,w*.46,h*.04);[[.75,.25],[.65,.5],[.82,.45],[.75,.8],[.25,.75]].forEach(([a,b])=>star(x,w*a,h*b,h*.07,"#fff"))}],
 un:["Birleşmiş Milletler",(x,w,h)=>{x.fillStyle="#5B92E5";x.fillRect(0,0,w,h);x.strokeStyle="#fff";x.lineWidth=h*.04;x.beginPath();x.arc(w*.5,h*.5,h*.25,0,7);x.stroke();x.beginPath();x.moveTo(w*.5,h*.25);x.lineTo(w*.5,h*.75);x.moveTo(w*.5-h*.25,h*.5);x.lineTo(w*.5+h*.25,h*.5);x.stroke()}]
};
const FLAG_PICK=["kadraj","tr","osm","de","dei","fr","gb","it","es","pl","ua","ru","su","se","gr","ro","ah","rs","bg","us","br","cn","in","jp","kr","kp","ir","pk","sa","kz","mn","vn","id","eg","ng","ar","ca","au","un"];
const flagCache={};
function flagCanvas(id,w=48,h=32){const k=id+"|"+w+"x"+h;if(flagCache[k])return flagCache[k];const c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d");(FL[id]||FL.kadraj)[1](x,w,h);return flagCache[k]=c}
const flagURL=id=>flagCanvas(id,60,40).toDataURL();
const FCOL={kadraj:"#0C7A63",tr:"#E30A17",osm:"#B0141E",de:"#3a3a3a",dei:"#555",fr:"#0055A4",gb:"#012169",it:"#009246",es:"#C8961E",pl:"#DC143C",ua:"#0057B7",ru:"#2f5fb4",su:"#CC0000",se:"#006AA7",gr:"#0D5EAF",ro:"#C9A800",ah:"#C9C9C9",rs:"#C6363C",bg:"#00966E",us:"#3C3B6E",br:"#009C3B",cn:"#DE2910",in:"#FF9933",jp:"#BC002D",kr:"#003478",kp:"#024FA2",ir:"#239F40",pk:"#01411C",sa:"#006C35",kz:"#00AFCA",mn:"#C4272F",vn:"#DA251D",id:"#CE1126",eg:"#8a6a00",ng:"#008751",ar:"#74ACDF",ca:"#D80621",au:"#1d3c8f",un:"#5B92E5"};

/* ---------- yardımcılar ---------- */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const nf=n=>Math.round(n).toLocaleString("tr-TR");
const kf=n=>{n=Math.max(0,Math.round(n));return n>=1e6?(n/1e6).toFixed(n>=1e7?0:1).replace(".",",")+" Mn":n>=1e4?Math.round(n/1e3)+" B":n>=1e3?(n/1e3).toFixed(1).replace(".",",")+" B":String(n)};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hex2=(h)=>{const n=parseInt(h.slice(1),16);return[(n>>16)&255,(n>>8)&255,n&255]};
let rng=Math.random;
function seeded(s){let a=s>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

/* ---------- harita ---------- */
const MAPS={};
async function loadMap(id){if(MAPS[id])return MAPS[id];const r=await fetch(`cephe/${id}.json?v=${typeof APP_V!=="undefined"?APP_V:0}`);if(!r.ok)throw new Error("Harita indirilemedi");const j=await r.json();
 const N=j.W*j.H,cid=new Uint8Array(N);let p=0;for(let i=0;i<j.rle.length;i+=2){cid.fill(j.rle[i],p,p+j.rle[i+1]);p+=j.rle[i+1]}
 const m={id,W:j.W,H:j.H,N,cid,names:j.names,bb:j.bb};let land=0;for(let i=0;i<N;i++)if(cid[i])land++;m.land=land;
 const merc=lat=>Math.log(Math.tan(Math.PI/4+lat*Math.PI/360));
 m.cell=(lon,lat)=>{const[x0,y0,x1,y1]=m.bb;const x=Math.round((lon-x0)/(x1-x0)*m.W),y=Math.round((merc(y1)-merc(lat))/(merc(y1)-merc(y0))*m.H);return clamp(y,0,m.H-1)*m.W+clamp(x,0,m.W-1)};
 /* kıyı: komşusunda deniz olan kara */
 m.coast=new Uint8Array(N);for(let i=0;i<N;i++)if(cid[i]){const x=i%m.W,y=(i/m.W)|0;if((x>0&&!cid[i-1])||(x<m.W-1&&!cid[i+1])||(y>0&&!cid[i-m.W])||(y<m.H-1&&!cid[i+m.W]))m.coast[i]=1}
 return MAPS[id]=m}
function nearLand(m,c,taken){if(m.cid[c]&&!(taken&&taken(c)))return c;const W=m.W,x0=c%W,y0=(c/W)|0;for(let r=1;r<40;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const x=x0+dx,y=y0+dy;if(x<0||y<0||x>=W||y>=m.H)continue;const i=y*W+x;if(m.cid[i]&&!(taken&&taken(i)))return i}return -1}
function nbrs(m,i,f){const W=m.W,x=i%W;if(x>0)f(i-1);if(x<W-1)f(i+1);if(i>=W)f(i-W);if(i<m.N-W)f(i+W)}

/* ---------- oyun durumu ---------- */
const BLD={ev:{n:"Şehir",d:"Nüfus ve asker sınırı artar",c:4000,inc:2500,ic:"ev"},fab:{n:"Fabrika",d:"Saniyede altın kazandırır",c:6000,inc:3000,ic:"fab"},lim:{n:"Liman",d:"Altın kazandırır, denizden çıkarma yapar (kıyıda)",c:8000,inc:4000,ic:"lim"},silo:{n:"Füze deposu",d:"Atom, nükleer ve hidrojen bombası atar",c:20000,inc:10000,ic:"silo"},sam:{n:"SAM",d:"Yakındaki şehirlere gelen bombaları düşürür",c:15000,inc:6000,ic:"sam"}};
const NUK={atom:{n:"Atom bombası",c:40000,r:5,dur:2600,sam:1},nuk:{n:"Nükleer füze",c:90000,r:8,dur:3200,sam:.85},hid:{n:"Hidrojen bombası",c:180000,r:13,dur:3800,sam:.6}};
const TIME_LIMIT=25*60e3,SAM_R=16,SAM_CD=9000,START_TROOPS=6000,START_GOLD=6000,WIN_PCT=.7;
let G=null;   /* oyun */
let V=null;   /* görünüm ve arayüz */

function newGame(m,opt){const g={m,opt,t:0,owner:new Int16Array(m.N),pl:[],bld:[],att:[],boats:[],mis:[],booms:[],over:null,dirty:true,seq:0,log:[]};
 for(let i=0;i<m.N;i++)g.owner[i]=m.cid[i]?-1:-2;return g}
function addPlayer(g,o){const p={i:g.pl.length,uid:o.uid||null,name:o.name,flag:o.flag||null,col:o.col||FCOL[o.flag]||"#888",bot:o.bot||null,troops:START_TROOPS,gold:START_GOLD,lvl:1,cells:0,sx:0,sy:0,alive:true,border:new Set(),nb:{},think:0,lost:0,kills:0};
 p.rgb=hex2(p.col);g.pl.push(p);return p}
function isBorder(g,i){const o=g.owner[i];if(o<0)return false;let b=false;nbrs(g.m,i,j=>{if(g.owner[j]!==o)b=true});return b}
function setOwner(g,i,o){const old=g.owner[i];if(old===o)return;const W=g.m.W,x=i%W,y=(i/W)|0;
 if(old>=0){const p=g.pl[old];p.cells--;p.sx-=x;p.sy-=y;p.border.delete(i);if(p.cells<=0&&p.alive){p.alive=false;p.troops=0;g.att=g.att.filter(a=>a.o!==old);g.log.push({t:"dead",p:old})}}
 g.owner[i]=o;if(o>=0){const p=g.pl[o];p.cells++;p.sx+=x;p.sy+=y}
 const fix=j=>{const q=g.owner[j];if(q<0)return;if(isBorder(g,j))g.pl[q].border.add(j);else g.pl[q].border.delete(j)};fix(i);nbrs(g.m,i,fix);
 for(const b of g.bld)if(b.c===i){if(o>=0)b.o=o;else b.dead=1}
 if(o===-1)g.bld=g.bld.filter(b=>!b.dead);g.dirty=true}
function spawn(g,p,c){const m=g.m;c=nearLand(m,c,i=>g.owner[i]>=0);if(c<0)return false;const W=m.W,x0=c%W,y0=(c/W)|0;
 for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){if(dx*dx+dy*dy>10)continue;const x=x0+dx,y=y0+dy;if(x<0||y<0||x>=W||y>=m.H)continue;const i=y*W+x;if(g.owner[i]===-1)setOwner(g,i,p.i)}
 g.bld.push({k:"ev",c,o:p.i,cd:0});p.home=c;return true}
const cnt=(g,o,k)=>{let n=0;for(const b of g.bld)if(b.o===o&&b.k===k)n++;return n};
const cap=(g,p)=>3000+p.cells*90+cnt(g,p.i,"ev")*30000;
const popOf=(g,p)=>p.cells*450+cnt(g,p.i,"ev")*65000;
const power=p=>p.lvl*10;
const bCost=(g,p,k)=>BLD[k].c+BLD[k].inc*cnt(g,p.i,k);
const nukCost=(p,k)=>Math.round(NUK[k].c*(1+.25*(p.nk||0)));
const lvlCost=p=>p.lvl>=10?Infinity:15000*p.lvl;

/* ---------- benzetim (100 ms) ---------- */
function step(g,dt){if(g.over)return;g.t+=dt;const s=dt/1000;
 for(const p of g.pl){if(!p.alive)continue;const df=p.bot?DIFF[p.bot].g:1;const c=cap(g,p);
  const gain=(260+p.cells*2.2+cnt(g,p.i,"ev")*900)*df*s;p.troops=Math.min(c,p.troops+gain*Math.max(0,1-p.troops/c));if(p.troops>c)p.troops-=(p.troops-c)*.1*s;
  p.gold+=(40+p.cells*.35+cnt(g,p.i,"fab")*150+cnt(g,p.i,"lim")*100)*df*s}
 /* saldırılar */
 for(const a of g.att){const P=g.pl[a.o];if(!P||!P.alive){a.n=0;continue}const T=a.t>=0?g.pl[a.t]:null;if(T&&!T.alive){a.n=0;continue}
  const cand=[];for(const b of P.border)nbrs(g.m,b,j=>{if(g.owner[j]===a.t)cand.push(j)});
  if(!cand.length){a.idle=(a.idle||0)+1;if(a.idle>8){P.troops+=a.n;a.n=0}continue}a.idle=0;
  const dens=T?T.troops/Math.max(1,T.cells):0;const ratio=T?power(T)/power(P):1;const cost=T?(60+dens*1.3)*ratio:140;
  let k=clamp(Math.floor(a.n/(cost*8))+1,1,4);k=Math.min(k,cand.length);
  let sx=0,sy=0,got=0;for(let q=0;q<k;q++){if(a.n<cost)break;const j=cand.splice((rng()*cand.length)|0,1)[0];if(g.owner[j]!==a.t)continue;a.n-=cost;if(T){T.troops=Math.max(0,T.troops-dens*.85);T.lost+=dens*.85}setOwner(g,j,a.o);sx+=j%g.m.W;sy+=(j/g.m.W)|0;got++}
  if(got){a.lx=sx/got;a.ly=sy/got}
  if(a.n<cost){if(a.n>0&&!T)P.troops+=a.n;a.n=0}}
 g.att=g.att.filter(a=>a.n>0);
 /* gemiler */
 for(const b of g.boats){b.pi+=s*9;if(b.pi>=b.path.length-1){b.done=1;landBoat(g,b)}}
 g.boats=g.boats.filter(b=>!b.done);
 /* füzeler */
 for(const m of g.mis){if(g.t>=m.t0+m.dur){m.done=1;if(!m.ic)boom(g,m)}}
 g.mis=g.mis.filter(m=>!m.done);
 for(const b of g.bld)if(b.cd>0)b.cd-=dt;
 g.booms=g.booms.filter(b=>g.t-b.t<2600);
 /* botlar */
 for(const p of g.pl)if(p.bot&&p.alive){p.think-=dt;if(p.think<=0){p.think=DIFF[p.bot].think*(.7+rng()*.6);botThink(g,p)}}
 /* bitiş */
 const alive=g.pl.filter(p=>p.alive);const lead=alive.reduce((a,b)=>b.cells>a.cells?b:a,alive[0]);
 if(!g.over&&lead&&(lead.cells>=g.m.land*WIN_PCT||alive.length===1||g.t>=TIME_LIMIT))g.over={w:lead.i,t:g.t,lim:g.t>=TIME_LIMIT?1:0}}
function attack(g,o,t,n){const P=g.pl[o];n=Math.min(n,P.troops);if(n<50||t===o)return false;const ex=g.att.find(a=>a.o===o&&a.t===t);P.troops-=n;if(ex)ex.n+=n;else g.att.push({o,t,n,id:++g.seq});return true}
function adjacent(g,o,t){const P=g.pl[o];for(const b of P.border){let f=false;nbrs(g.m,b,j=>{if(g.owner[j]===t)f=true});if(f)return true}return false}
/* deniz yolu: limandan hedef kıyıya BFS */
function seaPath(g,o,target){const m=g.m,W=m.W;const ports=g.bld.filter(b=>b.o===o&&b.k==="lim");if(!ports.length)return null;
 const goal=new Set();nbrs(m,target,j=>{if(g.owner[j]===-2)goal.add(j)});if(!goal.size)return null;
 const prev=new Int32Array(m.N).fill(-1);const q=[];for(const b of ports)nbrs(m,b.c,j=>{if(g.owner[j]===-2&&prev[j]===-1){prev[j]=j;q.push(j)}});
 let end=-1;for(let h=0;h<q.length&&end<0;h++){const c=q[h];if(goal.has(c)){end=c;break}nbrs(m,c,j=>{if(g.owner[j]===-2&&prev[j]===-1){prev[j]=c;q.push(j)}})}
 if(end<0)return null;const path=[target];for(let c=end;;c=prev[c]){path.push(c);if(prev[c]===c)break}const port=ports.find(b=>{let f=false;nbrs(m,b.c,j=>{if(j===path[path.length-1])f=true});return f});path.push(port?port.c:path[path.length-1]);path.reverse();
 return path.map(c=>[c%W,(c/W)|0])}
function sendBoat(g,o,target,n){const P=g.pl[o];n=Math.min(n,P.troops);if(n<50)return"az";const path=seaPath(g,o,target);if(!path)return"yol";P.troops-=n;g.boats.push({o,n,path,pi:0,tc:target,id:++g.seq});return"ok"}
function landBoat(g,b){const P=g.pl[b.o];if(!P.alive)return;const c=b.tc,t=g.owner[c];if(t===b.o){P.troops+=b.n;return}
 const T=t>=0?g.pl[t]:null;const dens=T?T.troops/Math.max(1,T.cells):0;const cost=T?(60+dens*1.3)*power(T)/power(P)*1.5:140;
 if(b.n<cost){return}b.n-=cost;if(T)T.troops=Math.max(0,T.troops-dens);setOwner(g,c,b.o);if(b.n>50)attack(g,b.o,t,0)||g.att.push({o:b.o,t,n:b.n,id:++g.seq})}
function build(g,o,k,c){const P=g.pl[o];if(!P||!P.alive||!BLD[k])return"yok";if(g.owner[c]!==o)return"toprak";if(g.bld.some(b=>Math.abs(b.c%g.m.W-c%g.m.W)<=1&&Math.abs(((b.c/g.m.W)|0)-((c/g.m.W)|0))<=1))return"dolu";
 if(k==="lim"&&!g.m.coast[c])return"kiyi";const cost=bCost(g,P,k);if(P.gold<cost)return"altin";P.gold-=cost;g.bld.push({k,c,o,cd:0});g.dirty=true;return"ok"}
function launch(g,o,k,c){const P=g.pl[o],N=NUK[k];if(!P||!N)return"yok";const silos=g.bld.filter(b=>b.o===o&&b.k==="silo");if(!silos.length)return"silo";const cost=nukCost(P,k);if(P.gold<cost)return"altin";
 const W=g.m.W,tx=c%W,ty=(c/W)|0;const s=silos.reduce((a,b)=>{const d=(b.c%W-tx)**2+(((b.c/W)|0)-ty)**2;return d<a.d?{b,d}:a},{b:null,d:1e12}).b;
 P.gold-=cost;P.nk=(P.nk||0)+1;P.lastNuke=g.t;const dist=Math.sqrt(((s.c%W)-tx)**2+((((s.c/W)|0))-ty)**2);
 const m={o,k,from:s.c,to:c,t0:g.t,dur:N.dur+dist*12,ic:null,id:++g.seq};
 /* SAM: hedefin yakınında başkasına ait hazır SAM varsa düşürebilir */
 const sam=g.bld.find(b=>b.k==="sam"&&b.o!==o&&b.cd<=0&&((b.c%W-tx)**2+(((b.c/W)|0)-ty)**2)<=SAM_R*SAM_R);
 if(sam&&rng()<N.sam){sam.cd=SAM_CD;m.ic=sam.c}
 g.mis.push(m);return"ok"}
function boom(g,m){g.nk=(g.nk||0)+1;const N=NUK[m.k],W=g.m.W,tx=m.to%W,ty=(m.to/W)|0,r=N.r;const hit={};
 for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(dx*dx+dy*dy>r*r)continue;const x=tx+dx,y=ty+dy;if(x<0||y<0||x>=W||y>=g.m.H)continue;const i=y*W+x;const o=g.owner[i];if(o>=0){hit[o]=(hit[o]||0)+1}}
 for(const o in hit){const T=g.pl[o];const dens=T.troops/Math.max(1,T.cells);const loss=Math.min(T.troops,dens*hit[o]*1.6);T.troops-=loss;T.lost+=loss;g.pl[m.o].kills+=loss}
 g.bld=g.bld.filter(b=>{const dx=b.c%W-tx,dy=((b.c/W)|0)-ty;return dx*dx+dy*dy>r*r});
 for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(dx*dx+dy*dy>r*r)continue;const x=tx+dx,y=ty+dy;if(x<0||y<0||x>=W||y>=g.m.H)continue;const i=y*W+x;if(g.owner[i]>=0)setOwner(g,i,-1)}
 g.booms.push({x:tx,y:ty,r,t:g.t,k:m.k})}
/* ---------- botlar ---------- */
function botThink(g,p){const D=DIFF[p.bot],W=g.m.W;const nb={};for(const b of p.border)nbrs(g.m,b,j=>{const o=g.owner[j];if(o!==-2&&o!==p.i)nb[o]=(nb[o]||0)+1});
 const c=cap(g,p);
 /* inşaat */
 const ev=cnt(g,p.i,"ev"),fab=cnt(g,p.i,"fab");const want=(D.nuke&&!cnt(g,p.i,"silo")&&p.cells>600&&ev>=3)?"silo":ev<1+p.cells/220?"ev":fab<ev?"fab":(D.nuke&&cnt(g,p.i,"sam")<ev/3&&p.cells>300)?"sam":rng()<.5?"ev":"fab";
 const saving=D.nuke&&cnt(g,p.i,"silo")&&p.cells>500&&p.gold<NUK.atom.c*1.6;
 if(!saving&&p.gold>bCost(g,p,want)*1.1){const cells=[...p.border];const inner=[];for(let t=0;t<30;t++){const i=(rng()*g.m.N)|0;if(g.owner[i]===p.i&&!p.border.has(i))inner.push(i)}const pick=inner[0]??cells[(rng()*cells.length)|0];if(pick!=null)build(g,p.i,want,pick)}
 if(rng()<D.lvl&&p.gold>lvlCost(p)*1.4&&p.lvl<10){p.gold-=lvlCost(p);p.lvl++}
 /* bomba */
 if(D.nuke&&rng()<D.nuke*.2&&cnt(g,p.i,"silo")&&g.t-(p.lastNuke||-1e9)>40000){const k=p.gold>nukCost(p,"hid")*1.2?"hid":p.gold>nukCost(p,"nuk")*1.2?"nuk":p.gold>nukCost(p,"atom")*1.3?"atom":null;
  if(k){const foes=g.pl.filter(q=>q.alive&&q.i!==p.i&&q.cells>p.cells*1.2);const f=foes.sort((a,b)=>b.cells-a.cells)[0];if(f){const cx=Math.round(f.sx/f.cells),cy=Math.round(f.sy/f.cells);const t=nearLand(g.m,cy*W+cx,i=>g.owner[i]!==f.i);if(t>=0&&g.owner[t]===f.i)launch(g,p.i,k,t)}}}
 if(p.troops<c*.25)return;
 /* boş toprak varsa önce onu al */
 if(nb[-1]&&nb[-1]>0){attack(g,p.i,-1,p.troops*D.pct);return}
 /* en zayıf komşu */
 let best=null,bs=0;for(const o in nb){if(o<0)continue;const q=g.pl[o];const sc=(p.troops*power(p))/(Math.max(1,q.troops)*power(q));if(sc>bs){bs=sc;best=q}}
 if(best&&bs>(p.bot==="zor"?1.05:1.4)&&p.troops>c*.45)attack(g,p.i,best.i,p.troops*D.pct);
 else if(!Object.keys(nb).length&&cnt(g,p.i,"lim")&&p.troops>c*.6){/* adadaysa denizden çık */const t=(rng()*g.m.N)|0;const tc=nearLand(g.m,t,i=>g.owner[i]===p.i||!g.m.coast[i]);if(tc>=0)sendBoat(g,p.i,tc,p.troops*.4)}
 else if(!cnt(g,p.i,"lim")&&!nb[-1]&&p.gold>bCost(g,p,"lim")){const cs=[...p.border].filter(i=>g.m.coast[i]);if(cs.length)build(g,p.i,"lim",cs[(rng()*cs.length)|0])}}

/* ---------- anlık görüntü (arkadaş oyunu) ---------- */
function snapOf(g){let s="",prev=null,run=0;const o=g.owner;for(let i=0;i<o.length;i++){const v=o[i]+2;if(v===prev)run++;else{if(run)s+=prev.toString(36)+(run>1?"."+run.toString(36):"")+",";prev=v;run=1}}s+=prev.toString(36)+(run>1?"."+run.toString(36):"");
 return JSON.stringify({t:Math.round(g.t),o:s,p:g.pl.map(p=>[p.name,p.flag,p.col,Math.round(p.troops),Math.round(p.gold),p.lvl,p.cells,p.alive?1:0,p.uid,p.bot,Math.round(p.sx),Math.round(p.sy),Math.round(p.lost),Math.round(p.kills),p.nk||0]),b:g.bld.map(b=>[b.k,b.c,b.o,Math.max(0,Math.round(b.cd))]),a:g.att.map(a=>[a.o,a.t,Math.round(a.n),a.lx??-1,a.ly??-1]),bo:g.boats.map(b=>[b.o,Math.round(b.n),b.path,b.pi]),mi:g.mis.map(m=>[m.o,m.k,m.from,m.to,m.t0,m.dur,m.ic]),bm:g.booms.map(b=>[b.x,b.y,b.r,b.t,b.k]),ov:g.over})}
function applySnap(g,str){const d=JSON.parse(str);g.t=d.t;let i=0;for(const part of d.o.split(",")){const [v,r]=part.split(".");const val=parseInt(v,36)-2,len=r?parseInt(r,36):1;g.owner.fill(val,i,i+len);i+=len}
 g.pl=d.p.map((a,j)=>{const old=g.pl[j]||{};return{i:j,name:a[0],flag:a[1],col:a[2],rgb:hex2(a[2]),troops:a[3],gold:a[4],lvl:a[5],cells:a[6],alive:!!a[7],uid:a[8],bot:a[9],sx:a[10],sy:a[11],lost:a[12],kills:a[13],nk:a[14]||0,border:old.border||new Set()}});
 g.bld=d.b.map(a=>({k:a[0],c:a[1],o:a[2],cd:a[3]}));g.att=d.a.map(a=>({o:a[0],t:a[1],n:a[2],lx:a[3]<0?undefined:a[3],ly:a[4]<0?undefined:a[4]}));
 g.boats=d.bo.map(a=>({o:a[0],n:a[1],path:a[2],pi:a[3]}));g.mis=d.mi.map(a=>({o:a[0],k:a[1],from:a[2],to:a[3],t0:a[4],dur:a[5],ic:a[6]}));g.booms=d.bm.map(a=>({x:a[0],y:a[1],r:a[2],t:a[3],k:a[4]}));g.over=d.ov;g.dirty=true;g.snapAt=performance.now()}

/* ---------- stil ---------- */
function css(){if($("#cpCss"))return;const st=document.createElement("style");st.id="cpCss";st.textContent=`
.cp{position:absolute;inset:0;background:#06121c;color:#e8f1ee;pointer-events:auto;overflow:hidden;font-family:var(--f-body);user-select:none;-webkit-user-select:none;touch-action:none}
.cp canvas.cp-cv{position:absolute;inset:0;width:100%;height:100%;display:block}
.cp .ib{background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.14)}
.cp-hud{position:absolute;left:0;right:0;top:0;display:flex;gap:8px;align-items:center;padding:calc(8px + env(safe-area-inset-top,0px)) 10px 8px;background:linear-gradient(rgba(4,12,20,.92),rgba(4,12,20,.55) 70%,transparent);pointer-events:none}
.cp-hud>*{pointer-events:auto}
.cp-me{display:flex;align-items:center;gap:8px;min-width:0}
.cp-me img{width:30px;height:20px;border-radius:3px;box-shadow:0 0 0 1px rgba(255,255,255,.4)}
.cp-st{display:flex;gap:6px;flex-wrap:wrap;flex:1;justify-content:flex-end}
.cp-chip{display:grid;gap:1px;padding:5px 9px;border-radius:12px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);min-width:4.4rem}
.cp-chip small{font:600 .56rem/1 var(--f-mono);letter-spacing:.08em;color:#9fb6ae;text-transform:uppercase}
.cp-chip b{font:700 .9rem/1.1 var(--f-mono)}
.cp-lb{position:absolute;right:10px;top:calc(64px + env(safe-area-inset-top,0px));width:min(46vw,210px);display:grid;gap:3px;padding:8px;border-radius:14px;background:rgba(4,12,20,.62);border:1px solid rgba(255,255,255,.08);font-size:.74rem;pointer-events:none}
.cp-lb div{display:flex;align-items:center;gap:6px;min-width:0}.cp-lb img{width:18px;height:12px;border-radius:2px;flex:none}.cp-lb span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cp-lb em{font:600 .7rem var(--f-mono);font-style:normal;color:#9fb6ae}
.cp-lb .me{color:#5eead4;font-weight:700}
.cp-bot{position:absolute;left:0;right:0;bottom:0;padding:10px 10px calc(10px + env(safe-area-inset-bottom,0px));background:linear-gradient(transparent,rgba(4,12,20,.9) 35%);display:grid;gap:8px}
.cp-pct{display:flex;align-items:center;gap:10px;font-size:.82rem}
.cp-pct input{flex:1;accent-color:#2dd4bf}
.cp-pct b{font-family:var(--f-mono);text-align:right;white-space:nowrap}
.cp-pct span{white-space:nowrap}
.cp-bar{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none}
.cp-bar::-webkit-scrollbar{display:none}
.cp-b{flex:none;display:grid;justify-items:center;gap:3px;min-width:4.6rem;padding:7px 8px;border-radius:14px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);color:#fff;font-size:.7rem;font-weight:600;cursor:pointer}
.cp-b svg{width:22px;height:22px}
.cp-b small{font:600 .6rem var(--f-mono);color:#9fb6ae}
.cp-b[aria-pressed="true"]{background:#0C7A63;border-color:#2dd4bf}
.cp-b[disabled]{opacity:.4}
.cp-b.red{background:rgba(220,38,38,.18);border-color:rgba(248,113,113,.4)}
.cp-b.red[aria-pressed="true"]{background:#b91c1c}
.cp-center{position:absolute;left:50%;top:42%;transform:translate(-50%,-50%);text-align:center;pointer-events:none;text-shadow:0 2px 12px rgba(0,0,0,.8)}
.cp-center b{display:block;font:700 clamp(2.4rem,9vw,4.4rem)/1 var(--f-display)}
.cp-center span{font-size:1rem;font-weight:600}
.cp-hint{position:absolute;left:50%;top:calc(70px + env(safe-area-inset-top,0px));transform:translateX(-50%);padding:7px 14px;border-radius:999px;background:rgba(12,122,99,.92);font-size:.82rem;font-weight:600;white-space:nowrap;pointer-events:none}
.cp-menu{position:absolute;inset:0;overflow-y:auto;background:radial-gradient(120% 80% at 50% 0%,#0f3b33 0%,#06121c 60%);padding:calc(14px + env(safe-area-inset-top,0px)) 16px 40px}
.cp-menu h1{font:800 2.6rem/1 var(--f-display);letter-spacing:.04em;margin:14px 0 4px;background:linear-gradient(90deg,#5eead4,#f59e0b);-webkit-background-clip:text;background-clip:text;color:transparent}
.cp-menu .sub{color:#9fb6ae;margin:0 0 18px;font-size:.9rem}
.cp-sec{font:700 .66rem/1 var(--f-mono);letter-spacing:.12em;text-transform:uppercase;color:#9fb6ae;margin:18px 0 8px}
.cp-scs{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
.cp-sc{text-align:left;padding:12px;border-radius:16px;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.08);color:#fff;cursor:pointer;display:grid;gap:4px}
.cp-sc b{font-size:.92rem}.cp-sc small{color:#9fb6ae;font-size:.74rem;line-height:1.3}
.cp-sc[aria-pressed="true"]{border-color:#2dd4bf;background:rgba(45,212,191,.12)}
.cp-seg{display:flex;gap:6px;flex-wrap:wrap}
.cp-seg button{padding:9px 14px;border-radius:12px;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.08);color:#fff;font-weight:600;font-size:.86rem;cursor:pointer}
.cp-seg button[aria-pressed="true"]{border-color:#2dd4bf;background:rgba(45,212,191,.14)}
.cp-flags{display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:8px}
.cp-flags button{display:grid;justify-items:center;gap:4px;padding:6px 2px;border-radius:12px;background:rgba(255,255,255,.05);border:1.5px solid transparent;color:#cfe;font-size:.62rem;cursor:pointer}
.cp-flags button img{width:42px;height:28px;border-radius:3px}
.cp-flags button[aria-pressed="true"]{border-color:#2dd4bf;background:rgba(45,212,191,.12)}
.cp-go{display:grid;gap:8px;margin-top:22px}
.cp-go button{padding:15px;border-radius:16px;border:0;font:700 1rem var(--f-body);cursor:pointer;display:flex;gap:10px;align-items:center;justify-content:center}
.cp-go .p{background:linear-gradient(135deg,#0C7A63,#14b8a6);color:#fff}
.cp-go .s{background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.12)}
.cp-go svg{width:20px;height:20px}
.cp-room{padding:14px;border-radius:18px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);display:grid;gap:10px}
.cp-code{font:800 2rem/1 var(--f-mono);letter-spacing:.2em;color:#5eead4}
.cp-pl{display:flex;align-items:center;gap:10px}.cp-pl img{width:30px;height:20px;border-radius:3px}
.cp-in{padding:12px 14px;border-radius:14px;border:1.5px solid rgba(255,255,255,.18);background:rgba(0,0,0,.25);color:#fff;font:700 1.2rem var(--f-mono);letter-spacing:.2em;text-transform:uppercase;width:100%}
.cp-x{position:absolute;right:12px;top:calc(12px + env(safe-area-inset-top,0px))}
.cp-pop{position:absolute;left:10px;right:10px;bottom:calc(120px + env(safe-area-inset-bottom,0px));padding:10px;border-radius:18px;background:rgba(6,18,28,.96);border:1px solid rgba(255,255,255,.12);display:grid;gap:6px;max-width:460px;margin:0 auto}
.cp-pop button{display:flex;align-items:center;gap:10px;padding:10px;border-radius:12px;background:rgba(255,255,255,.05);border:0;color:#fff;text-align:left;cursor:pointer}
.cp-pop button[disabled]{opacity:.4}
.cp-pop svg{width:26px;height:26px;flex:none;color:#5eead4}
.cp-pop button span{flex:1}.cp-pop small{display:block;color:#9fb6ae;font-size:.72rem}.cp-pop em{font:700 .78rem var(--f-mono);font-style:normal;color:#fcd34d}
.cp-over{position:absolute;inset:0;display:grid;place-items:center;background:rgba(2,8,14,.7);padding:20px}
.cp-over>div{max-width:360px;width:100%;padding:22px;border-radius:22px;background:#0b1d2a;border:1px solid rgba(255,255,255,.12);text-align:center;display:grid;gap:10px}
.cp-over h2{font:800 1.8rem/1.1 var(--f-display);margin:0}
.cp-shake{animation:cpShake .5s}
@keyframes cpShake{20%{transform:translate(-6px,3px)}40%{transform:translate(5px,-4px)}60%{transform:translate(-4px,-2px)}80%{transform:translate(3px,4px)}}
@media (max-width:520px){.cp-st{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px}.cp-chip{min-width:0;padding:4px 7px}.cp-chip b{font-size:.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cp-lb{font-size:.66rem;width:min(52vw,190px)}.cp-b{min-width:4rem;padding:6px}}`;document.head.appendChild(st)}

/* ---------- ikonlar ---------- */
const IC={
 ev:'<path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z"/>',fab:'<path d="M3 20V10l6 3V10l6 3V6h4v14z"/>',lim:'<path d="M12 3v15M8 7h8M5 13a7 7 0 0 0 14 0"/><circle cx="12" cy="4" r="1.5"/>',silo:'<path d="M9 21V8l3-5 3 5v13zM6 21h12"/>',sam:'<path d="M4 20 10 14M10 14a6 6 0 0 0 8-8M13 11l5-5"/><circle cx="18" cy="6" r="1.5"/>',
 atom:'<circle cx="12" cy="12" r="2"/><ellipse cx="12" cy="12" rx="9" ry="3.5"/><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(120 12 12)"/>',
 nuk:'<path d="M12 2c-3 4-4 7-4 10a4 4 0 0 0 8 0c0-3-1-6-4-10zM10 20h4M12 16v6"/>',hid:'<circle cx="12" cy="12" r="9"/><path d="M8 8v8M16 8v8M8 12h8"/>',
 up:'<path d="M12 4 5 11h4v8h6v-8h4z"/>',sw:'<path d="M14 4l6 6-9 9-4 1 1-4zM4 20l3-3"/>',ret:'<path d="M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3"/>',build:'<path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6"/>',boom:'<circle cx="12" cy="13" r="7"/><path d="M15 6l3-3M17 3h2v2"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',users:'<circle cx="9" cy="8" r="3.5"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5M16 14.5c3 0 6 1.5 6 4.5"/>',door:'<path d="M5 21V4h10v17M15 12h0M19 21H3"/>',play:'<path d="M7 4v16l13-8z"/>'};
const svg=(k,cls="")=>`<svg viewBox="0 0 24 24" class="${cls}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IC[k]||""}</svg>`;

/* ---------- menü ---------- */
const OPT=(()=>{let o={};try{o=LS.get("kadraj_cephe",{})||{}}catch{}return{sc:o.sc||"avrasya",diff:o.diff||"normal",nb:o.nb||8,flag:o.flag||"kadraj"}})();
const saveOpt=()=>{try{LS.set("kadraj_cephe",OPT)}catch{}};
CP.open=function(){css();const l=openLayer("cephe",`<div class="cp" id="cp"></div>`,{noScrim:true,onClose:()=>stop(true)});V={root:$("#cp",l),layer:l};menu()};
function menu(){if(!V)return;stopSim();cancelAnimationFrame(V.raf);V.raf=0;G=null;V.tw=null;V.overShown=false;V.tool=null;V.popOpen=null;V.mode="menu";const r=V.root;
 r.innerHTML=`<div class="cp-menu"><button class="ib cp-x" data-cpx aria-label="Kapat">${I("close")}</button>
 <h1>CEPHE</h1><p class="sub">Kadraj'ın piksel savaşı. Yerini seç, topraklarını büyüt, şehir kur, füze at.</p>
 <div class="cp-sec">Harita</div><div class="cp-scs">${SC.map(s=>`<button class="cp-sc" data-sc="${s.id}" aria-pressed="${OPT.sc===s.id}"><b>${esc(s.n)}</b><small>${esc(s.d)} · ${s.b.length} ülke</small></button>`).join("")}</div>
 <div class="cp-sec">Botlar</div><div class="cp-seg">${Object.entries(DIFF).map(([k,d])=>`<button data-df="${k}" aria-pressed="${OPT.diff===k}">${d.n}</button>`).join("")}</div>
 <div class="cp-seg" style="margin-top:8px">${[3,5,8,12].map(n=>`<button data-nb="${n}" aria-pressed="${OPT.nb===n}">${n} bot</button>`).join("")}</div>
 <div class="cp-sec">Bayrağın</div><div class="cp-flags">${FLAG_PICK.map(f=>`<button data-fl="${f}" aria-pressed="${OPT.flag===f}"><img src="${flagURL(f)}" alt="">${esc(FL[f][0])}</button>`).join("")}</div>
 <div class="cp-go"><button class="p" data-cpgo="solo">${svg("play")}Botlarla oyna</button><button class="s" data-cpgo="room">${svg("users")}Oda kur, arkadaşını çağır</button><button class="s" data-cpgo="join">${svg("door")}Odaya katıl</button></div></div>`;
 r.onclick=e=>{const t=e.target.closest("button");if(!t)return;const d=t.dataset;
  if(d.cpx!==undefined)return closeLayer("cephe");
  if(d.sc){OPT.sc=d.sc;saveOpt();$$("[data-sc]",r).forEach(b=>b.setAttribute("aria-pressed",b===t))}
  if(d.df){OPT.diff=d.df;saveOpt();$$("[data-df]",r).forEach(b=>b.setAttribute("aria-pressed",b===t))}
  if(d.nb){OPT.nb=+d.nb;saveOpt();$$("[data-nb]",r).forEach(b=>b.setAttribute("aria-pressed",b===t))}
  if(d.fl){OPT.flag=d.fl;saveOpt();$$("[data-fl]",r).forEach(b=>b.setAttribute("aria-pressed",b===t))}
  if(d.cpgo==="solo")startSolo();if(d.cpgo==="room")createRoom();if(d.cpgo==="join")joinAsk()}}

/* ---------- tek kişilik ve kurucu oyunu ---------- */
async function prepare(scId,seed){const sc=SC.find(s=>s.id===scId)||SC[0];const m=await loadMap(sc.map);rng=seed?seeded(seed):Math.random;return{sc,m}}
async function startSolo(){let sc,m;try{({sc,m}=await prepare(OPT.sc))}catch(e){return toast("Harita indirilemedi. İnternetini kontrol et.")}
 const g=newGame(m,{sc:sc.id,diff:OPT.diff,nb:OPT.nb});G=g;V.host=true;V.room=null;
 const me0=addPlayer(g,{uid:S.uid,name:me().name||me().username||"Sen",flag:OPT.flag});V.me=me0.i;
 addBots(g,sc,OPT.nb,OPT.diff,[OPT.flag]);spawnPhase()}
function addBots(g,sc,nb,diff,taken){const list=sc.b.filter(b=>!taken.includes(b[1])).slice(0,nb);for(const b of list){const p=addPlayer(g,{name:b[0],flag:b[1],bot:diff});p.spawnAt=g.m.cell(b[2],b[3])}}
/* 5 sn: herkes yerini seçer; seçmeyen rastgele yere düşer */
function spawnPhase(){const g=G;V.mode="spawn";V.spawnEnd=performance.now()+5000;V.pick=null;ui();fitView();loop();
 const tick=()=>{if(!V||V.mode!=="spawn"||G!==g)return;const left=Math.ceil((V.spawnEnd-performance.now())/1000);const c=$("#cpCenter");if(c)c.innerHTML=`<b>${Math.max(0,left)}</b><span>${V.pick!=null?"Yerin hazır, savaş başlıyor":"Haritada başlamak istediğin yere dokun"}</span>`;
  if(left<=0){if(V.host)beginWar(g);return}setTimeout(tick,200)};tick()}
function beginWar(g){const W=g.m.W;
 for(const p of g.pl){if(p.cells)continue;let c=p.spawnAt;if(p.uid&&V.picks&&V.picks[p.uid]!=null)c=V.picks[p.uid];else if(p.uid===S.uid&&V.pick!=null)c=V.pick;
  if(c==null||c<0){for(let t=0;t<400;t++){const i=(rng()*g.m.N)|0;if(g.owner[i]===-1){let far=true;for(const q of g.pl)if(q.home!=null&&Math.abs(q.home%W-i%W)+Math.abs(((q.home/W)|0)-((i/W)|0))<14)far=false;if(far){c=i;break}}}}
  spawn(g,p,c)}
 V.mode="play";V.t0=performance.now();ui();startSim()}
function startSim(){stopSim();let last=performance.now();V.simT=setInterval(()=>{if(!G)return;const n=performance.now();let dt=Math.min(400,n-last);last=n;while(dt>0){const d=Math.min(100,dt);step(G,d);dt-=d}
 const mine=G.pl[V.me];if(!G.over&&mine&&!mine.alive&&!V.room){const lead=G.pl.filter(p=>p.alive).sort((a,b)=>b.cells-a.cells)[0];G.over={w:lead?lead.i:-1,t:G.t}}
 if(V.room&&V.host&&n-(V.snapW||0)>1000){V.snapW=n;roomSnap()}if(G.over&&!V.overShown)showOver()},100)}
function stopSim(){if(V&&V.simT){clearInterval(V.simT);V.simT=null}}
function stop(closing){stopSim();if(V){cancelAnimationFrame(V.raf);V.raf=0;if(V.room)leaveRoom();if(V.ro)V.ro.disconnect()}if(closing){V=null;G=null}}

/* ---------- oyun arayüzü ---------- */
function ui(){const r=V.root;const g=G;
 r.innerHTML=`<canvas class="cp-cv" id="cpCv"></canvas>
 <div class="cp-hud"><button class="ib" data-cpq aria-label="Oyundan çık">${I("back")}</button><div class="cp-me"><img id="cpFlag" alt=""></div><div class="cp-st" id="cpSt"></div></div>
 <div class="cp-lb" id="cpLb"></div>
 ${V.mode==="spawn"?`<div class="cp-center" id="cpCenter"></div>`:`<div class="cp-hint" id="cpHint" hidden></div>
 <div class="cp-bot"><div class="cp-pct"><span>Gönder</span><input id="cpPct" type="range" min="5" max="100" step="5" value="${V.pct||40}"><b id="cpPctV"></b></div>
 <div class="cp-bar"><button class="cp-b" data-cpm="atk" aria-pressed="${!V.tool}">${svg("sw")}Saldır</button><button class="cp-b" data-cppop="build">${svg("build")}İnşa et</button><button class="cp-b red" data-cppop="nuke">${svg("boom")}Bomba</button><button class="cp-b" data-cplvl>${svg("up")}<span id="cpLvl">Güç</span><small id="cpLvlC"></small></button><button class="cp-b" data-cpret>${svg("ret")}Geri çek</button></div></div>`}<div id="cpPop"></div>`;
 const me0=g.pl[V.me];$("#cpFlag").src=flagURL(me0?me0.flag||"kadraj":"kadraj");
 V.cv=$("#cpCv");V.cx=V.cv.getContext("2d");resize();
 if(!V.ro){V.ro=new ResizeObserver(()=>{resize();fitView(true)});}V.ro.observe(r);
 wireInput();hud();
 r.onclick=e=>{const t=e.target.closest("button");if(!t)return;const d=t.dataset;
  if(d.cpq!==undefined)return quitAsk();
  if(d.cpm==="atk"){V.tool=null;pop(null);hint(null);syncTool()}
  if(d.cppop)pop(V.popOpen===d.cppop?null:d.cppop);
  if(d.cpbld){V.tool={k:"bld",v:d.cpbld};pop(null);hint(`${BLD[d.cpbld].n} için kendi toprağına dokun`);syncTool()}
  if(d.cpnuk){V.tool={k:"nuk",v:d.cpnuk};pop(null);hint(`${NUK[d.cpnuk].n}: hedefe dokun`);syncTool()}
  if(d.cplvl!==undefined)act({a:"lvl"});
  if(d.cpret!==undefined)act({a:"ret"})};
 const pct=$("#cpPct");if(pct)pct.oninput=()=>{V.pct=+pct.value;hud()}}
function syncTool(){$$("[data-cpm]").forEach(b=>b.setAttribute("aria-pressed",!V.tool))}
function hint(t){const h=$("#cpHint");if(!h)return;h.hidden=!t;if(t)h.textContent=t}
function pop(k){V.popOpen=k;const el=$("#cpPop");if(!el)return;if(!k){el.innerHTML="";return}const g=G,p=g.pl[V.me];
 if(k==="build")el.innerHTML=`<div class="cp-pop">${Object.entries(BLD).map(([id,b])=>{const c=bCost(g,p,id);return`<button data-cpbld="${id}" ${p.gold<c?"disabled":""}>${svg(b.ic)}<span>${b.n}<small>${b.d} · sende ${cnt(g,p.i,id)}</small></span><em>${kf(c)}</em></button>`}).join("")}</div>`;
 else el.innerHTML=`<div class="cp-pop">${cnt(g,p.i,"silo")?"":`<button disabled>${svg("silo")}<span>Önce füze deposu kur<small>İnşa et › Füze deposu</small></span></button>`}${Object.entries(NUK).map(([id,n])=>`<button data-cpnuk="${id}" ${p.gold<nukCost(p,id)||!cnt(g,p.i,"silo")?"disabled":""}>${svg(id)}<span>${n.n}<small>Yarıçap ${n.r} kare · SAM ${n.sam<1?"bazen ":""}düşürebilir · her atışta %25 pahalanır</small></span><em>${kf(nukCost(p,id))}</em></button>`).join("")}</div>`}
let hudT=0;function hud(){if(!V||!G||!$("#cpSt"))return;const g=G,p=g.pl[V.me];if(!p)return;
 const sec=Math.floor(g.t/1000);$("#cpSt").innerHTML=[["Nüfus",kf(popOf(g,p))],["Asker · sınır "+kf(cap(g,p)),nf(p.troops)],["Altın",kf(p.gold)],["Güç",p.lvl+" · "+power(p)],["Toprak","%"+Math.round(p.cells/g.m.land*100)],["Süre",`${Math.floor(sec/60)}:${String(sec%60).padStart(2,"0")}`]].map(([a,b])=>`<div class="cp-chip"><small>${a}</small><b>${b}</b></div>`).join("");
 const pv=$("#cpPctV");if(pv)pv.textContent=`%${V.pct||40} · ${nf(p.troops*(V.pct||40)/100)} asker`;
 const lv=$("#cpLvl"),lc=$("#cpLvlC");if(lv){lv.textContent=`Güç ${p.lvl}${p.lvl<10?" → "+(p.lvl+1):""}`;lc.textContent=p.lvl<10?kf(lvlCost(p)):"en yüksek";lv.closest("button").disabled=p.lvl>=10||p.gold<lvlCost(p)}
 const top=g.pl.filter(q=>q.alive).sort((a,b)=>b.cells-a.cells).slice(0,7);if(!top.includes(p)&&p.alive)top.push(p);
 const lbE=$("#cpLb"),hb=$(".cp-hud");if(hb&&lbE)lbE.style.top=(hb.offsetHeight+4)+"px";lbE.innerHTML=top.slice(0,innerWidth<520?5:8).map((q,i)=>`<div class="${q===p?"me":""}"><img src="${q.flag?flagURL(q.flag):swatch(q.col)}" alt=""><span>${i+1}. ${esc(q.name)}</span><em>%${Math.round(q.cells/g.m.land*100)} · ${nf(q.troops)}</em></div>`).join("");
 if(V.popOpen)pop(V.popOpen)}
const swc={};function swatch(c){if(swc[c])return swc[c];const k=document.createElement("canvas");k.width=6;k.height=4;const x=k.getContext("2d");x.fillStyle=c;x.fillRect(0,0,6,4);return swc[c]=k.toDataURL()}
function quitAsk(){const g=G;if(!g||V.mode==="spawn"&&!V.room||g.over)return menu();
 const l=sheet("cpq","Oyundan çıkılsın mı?",`<div class="form"><p class="muted" style="margin:0">${V.room&&V.host?"Odayı kurduğun için oyun herkes için biter.":"Savaş yarıda kalır."}</p><button class="btn block danger" id="cpQy">Çık</button><button class="btn sec block" data-act="close">Devam et</button></div>`);
 $("#cpQy",l).onclick=()=>{closeLayer("cpq");if(V.room)leaveRoom();menu()}}
function showOver(){V.overShown=true;const g=G,p=g.pl[V.me],w=g.pl[g.over.w]||null;const win=w&&w.i===V.me;const el=document.createElement("div");el.className="cp-over";
 el.innerHTML=`<div><img src="${w&&w.flag?flagURL(w.flag):swatch(w?w.col:"#888")}" alt="" style="width:72px;height:48px;border-radius:5px;margin:0 auto"><h2>${win?"Zafer!":"Savaş bitti"}</h2><p style="margin:0;color:#9fb6ae">${g.over.lim?"25 dakika doldu. ":""}${win?"Haritanın büyük kısmı artık senin.":`${esc(w?w.name:"?")} kazandı.`}</p>
 <p style="margin:0;font:600 .82rem var(--f-mono)">Toprak %${Math.round((p?p.cells:0)/g.m.land*100)} · kaybedilen asker ${nf(p?p.lost:0)}</p><button class="btn block" data-cpmenu>Ana menü</button><button class="btn sec block" data-cpwatch>Haritaya bak</button></div>`;
 V.root.appendChild(el);el.onclick=e=>{if(e.target.closest("[data-cpmenu]")){if(V.room)leaveRoom();menu()}if(e.target.closest("[data-cpwatch]"))el.remove()};vib&&vib(win?[40,60,40]:80)}

/* ---------- komutlar (yerelde uygula ya da kurucuya gönder) ---------- */
function act(c){if(!G||!V)return;if(V.room&&!V.host)return sendCmd(c);const r=applyCmd(G,V.me,c);if(r&&r!=="ok")feedback(r);hud()}
function applyCmd(g,o,c){const p=g.pl[o];if(!p||!p.alive||g.over)return;
 if(c.a==="atk"){const t=g.owner[c.c];if(t===-2)return"deniz";if(t===o)return;const n=p.troops*clamp(c.p,5,100)/100;if(adjacent(g,o,t))return attack(g,o,t,n)?"ok":"az";const r=sendBoat(g,o,c.c,n);return r==="yol"?(cnt(g,o,"lim")?"uzak":"komsu"):r}
 if(c.a==="bld")return build(g,o,c.k,c.c);
 if(c.a==="nuk")return launch(g,o,c.k,c.c);
 if(c.a==="lvl"){if(p.lvl>=10||p.gold<lvlCost(p))return"altin";p.gold-=lvlCost(p);p.lvl++;return"ok"}
 if(c.a==="ret"){let n=0;g.att=g.att.filter(a=>{if(a.o===o){n+=a.n*.8;return false}return true});p.troops+=n;return n?"ok":"yok"}}
const MSG={deniz:"Denize asker gönderemezsin. Karşı kıyıya dokun (liman gerekir).",az:"Gönderecek kadar askerin yok.",komsu:"Burası sınırında değil. Denizden gitmek için kıyına liman kur.",uzak:"Limandan oraya deniz yolu yok.",toprak:"Yalnızca kendi toprağına kurabilirsin.",dolu:"Burada zaten bir yapı var, biraz öteye kur.",kiyi:"Liman yalnızca kıyıya kurulur.",altin:"Altının yetmiyor.",silo:"Önce füze deposu kur.",yok:"Geri çekilecek saldırı yok."};
function feedback(r){if(MSG[r]){toast(MSG[r]);vib&&vib(20)}}
function tapCell(c){const g=G;if(!g||c<0)return;
 if(V.mode==="spawn"){if(g.owner[c]!==-1)return toast("Karada boş bir yer seç.");V.pick=c;if(V.room&&!V.host)sendCmd({a:"spawn",c});else if(V.room&&V.host){(V.picks=V.picks||{})[S.uid]=c}vib&&vib(15);return}
 if(V.mode!=="play")return;
 if(V.tool&&V.tool.k==="bld"){act({a:"bld",k:V.tool.v,c});V.tool=null;hint(null);syncTool();return}
 if(V.tool&&V.tool.k==="nuk"){act({a:"nuk",k:V.tool.v,c});V.tool=null;hint(null);syncTool();return}
 act({a:"atk",c,p:V.pct||40})}

/* ---------- çizim ---------- */
function resize(){if(!V||!V.cv)return;const r=V.root.getBoundingClientRect();const dpr=Math.min(window.devicePixelRatio||1,1.6);V.dpr=dpr;V.cw=r.width;V.ch=r.height;V.cv.width=Math.round(r.width*dpr);V.cv.height=Math.round(r.height*dpr);V.need=true}
function fitView(keep){if(!V||!G)return;const m=G.m;const s=Math.min(V.cw/m.W,(V.ch-60)/m.H)*1.02;if(keep&&V.s){V.need=true;return}V.s=Math.max(s,1);V.ox=(V.cw-m.W*V.s)/2;V.oy=(V.ch-m.H*V.s)/2+10;V.need=true}
const BS=5;
function baseCanvas(m){if(m.base)return m.base;const c=document.createElement("canvas");c.width=m.W*BS;c.height=m.H*BS;const x=c.getContext("2d");
 const gr=x.createLinearGradient(0,0,0,c.height);gr.addColorStop(0,"#0b2a3f");gr.addColorStop(1,"#071a29");x.fillStyle=gr;x.fillRect(0,0,c.width,c.height);
 /* deniz dokusu */x.globalAlpha=.06;x.fillStyle="#9fd";for(let i=0;i<m.W*m.H/40;i++){x.fillRect(Math.random()*c.width,Math.random()*c.height,3,1)}x.globalAlpha=1;
 const img=x.getImageData(0,0,c.width,c.height),d=img.data;
 for(let i=0;i<m.N;i++){const v=m.cid[i];if(!v)continue;const cx=i%m.W,cy=(i/m.W)|0;const h=(v*2654435761>>>0)%40-20;const lat=cy/m.H;
  const R=58+h*.3+lat*10,Gc=78+h*.5-lat*6,B=56+h*.2;
  for(let yy=0;yy<BS;yy++)for(let xx=0;xx<BS;xx++){const o=((cy*BS+yy)*c.width+cx*BS+xx)*4;const n=((xx*7+yy*13+i)%5)-2;d[o]=R+n;d[o+1]=Gc+n;d[o+2]=B+n;d[o+3]=255}}
 x.putImageData(img,0,0);
 /* ülke sınırları ve kıyılar */
 x.lineWidth=1;x.beginPath();x.strokeStyle="rgba(10,20,15,.55)";
 for(let i=0;i<m.N;i++){const v=m.cid[i];if(!v)continue;const cx=i%m.W,cy=(i/m.W)|0;if(cx<m.W-1&&m.cid[i+1]&&m.cid[i+1]!==v){x.moveTo((cx+1)*BS+.5,cy*BS);x.lineTo((cx+1)*BS+.5,(cy+1)*BS)}if(cy<m.H-1&&m.cid[i+m.W]&&m.cid[i+m.W]!==v){x.moveTo(cx*BS,(cy+1)*BS+.5);x.lineTo((cx+1)*BS,(cy+1)*BS+.5)}}x.stroke();
 x.beginPath();x.strokeStyle="rgba(190,230,210,.35)";for(let i=0;i<m.N;i++){if(!m.cid[i])continue;const cx=i%m.W,cy=(i/m.W)|0;if(cx<m.W-1&&!m.cid[i+1]){x.moveTo((cx+1)*BS,cy*BS);x.lineTo((cx+1)*BS,(cy+1)*BS)}if(cx>0&&!m.cid[i-1]){x.moveTo(cx*BS,cy*BS);x.lineTo(cx*BS,(cy+1)*BS)}if(cy<m.H-1&&!m.cid[i+m.W]){x.moveTo(cx*BS,(cy+1)*BS);x.lineTo((cx+1)*BS,(cy+1)*BS)}if(cy>0&&!m.cid[i-m.W]){x.moveTo(cx*BS,cy*BS);x.lineTo((cx+1)*BS,cy*BS)}}x.stroke();
 return m.base=c}
/* toprak katmanı: düz renkler + bayrak desenleri, ızgara değişince en çok saniyede 6 kez */
function terrLayer(){const g=G,m=g.m;if(!V.tw){V.tw=document.createElement("canvas");V.tw.width=m.W*BS;V.tw.height=m.H*BS;V.tg=document.createElement("canvas");V.tg.width=m.W;V.tg.height=m.H;V.tm=document.createElement("canvas");V.tm.width=m.W;V.tm.height=m.H;V.tt=document.createElement("canvas");V.tt.width=m.W*BS;V.tt.height=m.H*BS}
 const tgx=V.tg.getContext("2d"),img=tgx.createImageData(m.W,m.H),d=img.data,own=g.owner;const flagP=new Set(g.pl.filter(p=>p.flag).map(p=>p.i));
 for(let i=0;i<m.N;i++){const o=own[i];if(o<0)continue;const p=g.pl[o];if(!p)continue;const k=i*4;let b=false;const x=i%m.W;if((x>0&&own[i-1]!==o)||(x<m.W-1&&own[i+1]!==o)||(i>=m.W&&own[i-m.W]!==o)||(i<m.N-m.W&&own[i+m.W]!==o))b=true;
  const [r,gg,bb]=p.rgb;if(b){d[k]=r*.55;d[k+1]=gg*.55;d[k+2]=bb*.55;d[k+3]=235}else if(!flagP.has(o)){d[k]=r;d[k+1]=gg;d[k+2]=bb;d[k+3]=190}}
 tgx.putImageData(img,0,0);
 const w=V.tw.getContext("2d");w.clearRect(0,0,V.tw.width,V.tw.height);w.imageSmoothingEnabled=false;
 const tm=V.tm.getContext("2d"),tt=V.tt.getContext("2d");tt.imageSmoothingEnabled=false;
 /* 5.8.1: toprağın üstünde tek, büyük bayrak (toprağı kaplayacak kadar büyütülür, toprağın dışı kesilir) */
 for(const o of flagP){const p=g.pl[o];if(!p.alive)continue;const mi=tm.createImageData(m.W,m.H),md=mi.data;let x0=1e9,y0=1e9,x1=-1,y1=-1;
  for(let i=0;i<m.N;i++)if(own[i]===o){md[i*4+3]=255;const x=i%m.W,y=(i/m.W)|0;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}if(x1<0)continue;tm.putImageData(mi,0,0);
  tt.globalCompositeOperation="source-over";tt.clearRect(0,0,V.tt.width,V.tt.height);tt.imageSmoothingEnabled=false;tt.drawImage(V.tm,0,0,V.tt.width,V.tt.height);tt.globalCompositeOperation="source-in";
  const bw=(x1-x0+1)*BS,bh=(y1-y0+1)*BS,sc=Math.max(bw/3,bh/2),fw=sc*3,fh=sc*2;tt.imageSmoothingEnabled=true;tt.globalAlpha=.92;tt.drawImage(flagCanvas(p.flag,450,300),x0*BS+(bw-fw)/2,y0*BS+(bh-fh)/2,fw,fh);
  tt.globalAlpha=1;tt.globalCompositeOperation="source-over";w.drawImage(V.tt,0,0)}
 w.drawImage(V.tg,0,0,V.tw.width,V.tw.height)}
function loop(){if(!V)return;cancelAnimationFrame(V.raf);let lastT=0,lastTerr=0,lastHud=0;
 const f=ts=>{if(!V||!G){return}V.raf=requestAnimationFrame(f);if(ts-lastT<33)return;lastT=ts;
  const g=G;if(g.dirty&&ts-lastTerr>160){g.dirty=false;lastTerr=ts;terrLayer();V.need=true}
  const anim=g.mis.length||g.boats.length||g.booms.length||g.att.length||V.mode==="spawn";if(!V.need&&!anim)return;V.need=false;draw(ts);
  if(ts-lastHud>500){lastHud=ts;if(V.mode==="play")hud()}};V.raf=requestAnimationFrame(f)}
function w2s(x,y){return[V.ox+x*V.s,V.oy+y*V.s]}
function draw(ts){const g=G,m=g.m,x=V.cx,dpr=V.dpr;x.setTransform(dpr,0,0,dpr,0,0);x.fillStyle="#06121c";x.fillRect(0,0,V.cw,V.ch);x.imageSmoothingEnabled=false;
 const s=V.s;x.drawImage(baseCanvas(m),V.ox,V.oy,m.W*s,m.H*s);if(V.tw)x.drawImage(V.tw,V.ox,V.oy,m.W*s,m.H*s);
 /* yer seçimi */
 if(V.mode==="spawn"&&V.pick!=null){const [px,py]=w2s(V.pick%m.W+.5,((V.pick/m.W)|0)+.5);const r=(3.4+Math.sin(ts/200)*.4)*s;x.strokeStyle="#fff";x.lineWidth=2;x.beginPath();x.arc(px,py,r,0,7);x.stroke();x.fillStyle="rgba(45,212,191,.35)";x.fill()}
 /* yapılar */
 const is=Math.max(9,Math.min(22,s*2.4));
 for(const b of g.bld){const [bx,by]=w2s(b.c%m.W+.5,((b.c/m.W)|0)+.5);const p=g.pl[b.o];x.fillStyle="rgba(4,12,20,.75)";x.beginPath();x.arc(bx,by,is*.62,0,7);x.fill();x.strokeStyle=p?p.col:"#fff";x.lineWidth=1.5;x.stroke();drawIcon(x,b.k,bx,by,is*.8);if(b.k==="sam"&&b.cd>0){x.strokeStyle="rgba(250,204,21,.8)";x.beginPath();x.arc(bx,by,is*.75,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-b.cd/SAM_CD));x.stroke()}}
 /* ülke adları ve asker sayıları */
 x.textAlign="center";x.textBaseline="middle";
 for(const p of g.pl){if(!p.alive||!p.cells)continue;const cxw=p.sx/p.cells+.5,cyw=p.sy/p.cells+.5;const [px,py]=w2s(cxw,cyw);const fs=clamp(Math.sqrt(p.cells)*s*.22,10,30);if(fs<10.5&&p.i!==V.me)continue;
  x.font=`700 ${fs}px Figtree, sans-serif`;x.lineWidth=3;x.strokeStyle="rgba(0,0,0,.65)";x.fillStyle="#fff";x.strokeText(p.name,px,py-fs*.45);x.fillText(p.name,px,py-fs*.45);
  x.font=`600 ${fs*.8}px "JetBrains Mono", monospace`;const tx=nf(p.troops)+(p.lvl>1?" · G"+p.lvl:"");x.strokeText(tx,px,py+fs*.5);x.fillStyle=p.i===V.me?"#5eead4":"#e5f0ec";x.fillText(tx,px,py+fs*.5)}
 /* saldırı cepheleri */
 x.font=`700 12px "JetBrains Mono", monospace`;
 for(const a of g.att){if(a.lx==null)continue;const [ax,ay]=w2s(a.lx+.5,a.ly+.5);const p=g.pl[a.o];const t=nf(a.n);const w=x.measureText(t).width+18;
  x.fillStyle="rgba(4,12,20,.82)";x.strokeStyle=p?p.col:"#fff";x.lineWidth=1.5;rrect(x,ax-w/2,ay-10,w,20,10);x.fill();x.stroke();x.fillStyle="#fff";x.fillText(t,ax+5,ay+1);x.fillStyle=p?p.col:"#fff";x.beginPath();x.arc(ax-w/2+8,ay,3.5+Math.sin(ts/120)*1,0,7);x.fill()}
 /* gemiler */
 for(const b of g.boats){const k=Math.min(b.path.length-1,Math.floor(b.pi)),f=b.pi-k,a=b.path[k],c=b.path[Math.min(b.path.length-1,k+1)];const wx=a[0]+(c[0]-a[0])*f+.5,wy=a[1]+(c[1]-a[1])*f+.5;const [bx,by]=w2s(wx,wy);const p=g.pl[b.o];
  x.save();x.translate(bx,by);x.rotate(Math.atan2(c[1]-a[1],c[0]-a[0]));x.fillStyle=p?p.col:"#fff";x.strokeStyle="#fff";x.lineWidth=1.5;x.beginPath();x.moveTo(9,0);x.lineTo(-7,-5);x.lineTo(-7,5);x.closePath();x.fill();x.stroke();x.restore();
  x.fillStyle="#fff";x.font=`700 11px "JetBrains Mono", monospace`;x.strokeStyle="rgba(0,0,0,.7)";x.lineWidth=3;x.strokeText(nf(b.n),bx,by-12);x.fillText(nf(b.n),bx,by-12)}
 /* füzeler */
 const now=V.room&&!V.host&&g.snapAt?g.t+(performance.now()-g.snapAt):g.t;
 for(const mi of g.mis){const pr=clamp((now-mi.t0)/mi.dur,0,1);const [x0,y0]=w2s(mi.from%m.W+.5,((mi.from/m.W)|0)+.5),[x1,y1]=w2s(mi.to%m.W+.5,((mi.to/m.W)|0)+.5);const h=Math.hypot(x1-x0,y1-y0)*.35+40;
  const pt=t=>[x0+(x1-x0)*t,y0+(y1-y0)*t-Math.sin(Math.PI*t)*h];const end=mi.ic?Math.min(pr,.86):pr;
  x.strokeStyle="rgba(255,255,255,.25)";x.lineWidth=1.5;x.setLineDash([4,5]);x.beginPath();for(let t=0;t<=1;t+=.05){const q=pt(t);t?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1])}x.stroke();x.setLineDash([]);
  x.strokeStyle=mi.k==="hid"?"#f472b6":mi.k==="nuk"?"#fb923c":"#facc15";x.lineWidth=3;x.beginPath();for(let t=Math.max(0,end-.15);t<=end;t+=.01){const q=pt(t);t>Math.max(0,end-.15)?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1])}x.stroke();
  const q=pt(end);circ(x,q[0],q[1],4,"#fff");
  if(mi.ic&&pr>=.78){const [sx,sy]=w2s(mi.ic%m.W+.5,((mi.ic/m.W)|0)+.5);const it=clamp((pr-.78)/.08,0,1);x.strokeStyle="#5eead4";x.lineWidth=2;x.beginPath();x.moveTo(sx,sy);x.lineTo(sx+(q[0]-sx)*it,sy+(q[1]-sy)*it);x.stroke();if(pr>.86){const r=(pr-.86)*260;x.fillStyle=`rgba(94,234,212,${1-(pr-.86)*7})`;x.beginPath();x.arc(q[0],q[1],r,0,7);x.fill()}}}
 /* patlamalar */
 for(const b of g.booms){const age=(now-b.t)/2600;if(age<0||age>1)continue;const [bx,by]=w2s(b.x+.5,b.y+.5);const R=b.r*s;
  x.fillStyle=`rgba(255,255,255,${Math.max(0,.9-age*3)})`;x.beginPath();x.arc(bx,by,R*(.3+age*1.2),0,7);x.fill();
  const gr=x.createRadialGradient(bx,by,0,bx,by,R*1.4);gr.addColorStop(0,`rgba(255,220,120,${.85*(1-age)})`);gr.addColorStop(.5,`rgba(249,115,22,${.6*(1-age)})`);gr.addColorStop(1,"rgba(120,20,0,0)");x.fillStyle=gr;x.beginPath();x.arc(bx,by,R*1.4,0,7);x.fill();
  x.strokeStyle=`rgba(255,255,255,${.7*(1-age)})`;x.lineWidth=2;x.beginPath();x.arc(bx,by,R*(.6+age*1.6),0,7);x.stroke();
  if(!b.shook){b.shook=1;if(!kbReduce()){V.root.classList.remove("cp-shake");void V.root.offsetWidth;V.root.classList.add("cp-shake")}vib&&vib([60,40,90])}}}
function rrect(x,a,b,w,h,r){x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()}
const ICP={};function drawIcon(x,k,cx,cy,sz){let p=ICP[k];if(!p){p=ICP[k]=new Path2D((IC[k]||"").replace(/<[^>]*d="([^"]+)"[^>]*>/g," $1 ").replace(/<[^>]*>/g," ").trim()||"M0 0")}x.save();x.translate(cx-sz/2,cy-sz/2);x.scale(sz/24,sz/24);x.strokeStyle="#fff";x.lineWidth=2.2;x.lineCap="round";x.lineJoin="round";x.stroke(p);x.restore()}

/* ---------- dokunma: kaydır, yakınlaştır, dokun ---------- */
function wireInput(){const cv=V.cv;const pts=new Map();let moved=0,pinch=null,down=null;
 const cell=(cx,cy)=>{const r=cv.getBoundingClientRect();const wx=Math.floor((cx-r.left-V.ox)/V.s),wy=Math.floor((cy-r.top-V.oy)/V.s);if(wx<0||wy<0||wx>=G.m.W||wy>=G.m.H)return -1;return wy*G.m.W+wx};
 const zoom=(f,cx,cy)=>{const r=cv.getBoundingClientRect();const px=cx-r.left,py=cy-r.top;const ns=clamp(V.s*f,Math.min(V.cw/G.m.W,V.ch/G.m.H)*.8,60);const k=ns/V.s;V.ox=px-(px-V.ox)*k;V.oy=py-(py-V.oy)*k;V.s=ns;V.need=true};
 cv.onpointerdown=e=>{cv.setPointerCapture&&cv.setPointerCapture(e.pointerId);pts.set(e.pointerId,[e.clientX,e.clientY]);if(pts.size===1){down=[e.clientX,e.clientY];moved=0}if(pts.size===2){const [a,b]=[...pts.values()];pinch={d:Math.hypot(a[0]-b[0],a[1]-b[1]),s:V.s}}};
 cv.onpointermove=e=>{if(!pts.has(e.pointerId))return;const prev=pts.get(e.pointerId);pts.set(e.pointerId,[e.clientX,e.clientY]);
  if(pts.size===2&&pinch){const [a,b]=[...pts.values()];const d=Math.hypot(a[0]-b[0],a[1]-b[1]);zoom(pinch.s*d/pinch.d/V.s,(a[0]+b[0])/2,(a[1]+b[1])/2);moved=99;return}
  const dx=e.clientX-prev[0],dy=e.clientY-prev[1];moved+=Math.abs(dx)+Math.abs(dy);if(moved>8){V.ox+=dx;V.oy+=dy;V.need=true}};
 const up=e=>{if(!pts.has(e.pointerId))return;pts.delete(e.pointerId);if(pts.size<2)pinch=null;if(!pts.size&&moved<=8&&down&&e.type==="pointerup")tapCell(cell(e.clientX,e.clientY));if(!pts.size)down=null};
 cv.onpointerup=up;cv.onpointercancel=up;cv.onwheel=e=>{e.preventDefault();zoom(e.deltaY<0?1.15:1/1.15,e.clientX,e.clientY)}}

/* ---------- arkadaşla: oda ---------- */
const code5=()=>Array.from({length:5},()=>"ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[(Math.random()*32)|0]).join("");
const roomPath=c=>"games/cp-"+c,cmdPath=(c,u)=>"games/cp-"+c+"-"+u;
async function createRoom(){if(!guard())return;const c=code5();const d={cp:1,host:S.uid,sc:OPT.sc,diff:OPT.diff,nb:OPT.nb,st:"lobby",oy:{[S.uid]:{n:me().name||me().username,f:OPT.flag,at:now()}},at:now(),up:now()};
 try{await DB.set(roomPath(c),d)}catch(e){return toast("Oda kurulamadı: "+(e.message||""))}enterRoom(c,true)}
function joinAsk(){const l=sheet("cpj","Odaya katıl",`<div class="form"><input class="cp-in" id="cpCode" maxlength="5" placeholder="KOD" autocomplete="off" style="color:var(--fg);border-color:var(--line)"><button class="btn block" id="cpJg">Katıl</button></div>`);const i=$("#cpCode",l);setTimeout(()=>i.focus(),50);
 $("#cpJg",l).onclick=()=>{const c=i.value.trim().toUpperCase();if(c.length!==5)return toast("5 harfli oda kodunu yaz.");closeLayer("cpj");CP.join(c)}}
CP.join=async function(c){if(!V)CP.open();c=String(c||"").toUpperCase();let d=null;try{d=await DB.get(roomPath(c))}catch{}if(!d||!d.cp)return toast("Böyle bir oda yok.");if(d.st!=="lobby"&&!(d.oy&&d.oy[S.uid]))return toast("Bu odada savaş başlamış.");
 try{await DB.update(roomPath(c),{oy:{[S.uid]:{n:me().name||me().username,f:OPT.flag,at:now()}},up:now()})}catch(e){return toast("Odaya girilemedi.")}enterRoom(c,d.host===S.uid)};
function enterRoom(c,host){V.room=c;V.host=host;V.mode="lobby";V.cmdSeq=0;V.cmdQ=[];if(V.roomUn)V.roomUn();V.roomUn=DB.watchDoc(roomPath(c),d=>onRoom(d));}
function lobby(d){const r=V.root;const sc=SC.find(s=>s.id===d.sc)||SC[0];const oy=Object.entries(d.oy||{}).filter(([,v])=>v);
 r.innerHTML=`<div class="cp-menu"><button class="ib cp-x" data-cpleave aria-label="Odadan çık">${I("close")}</button><h1 style="font-size:2rem">Savaş odası</h1><p class="sub">${esc(sc.n)} · botlar ${esc(DIFF[d.diff].n)} · ${d.nb} bot</p>
 <div class="cp-room"><div class="cp-sec" style="margin:0">Oda kodu</div><div class="cp-code">${esc(V.room)}</div><small style="color:#9fb6ae">Arkadaşın Cephe › Odaya katıl'a bu kodu yazsın ya da aşağıdan çağır.</small></div>
 <div class="cp-sec">Oyuncular (${oy.length})</div><div class="cp-room">${oy.map(([u,v])=>`<div class="cp-pl"><img src="${flagURL(v.f||"kadraj")}" alt=""><b>${esc(v.n||"?")}</b>${u===d.host?'<small style="color:#5eead4">kurucu</small>':""}</div>`).join("")}</div>
 <div class="cp-go">${V.host?`<button class="p" data-cpstart>${svg("play")}Savaşı başlat</button>`:`<button class="s" disabled>Kurucunun başlatması bekleniyor…</button>`}<button class="s" data-cpinv>${svg("users")}Arkadaşını çağır</button></div></div>`;
 r.onclick=e=>{const t=e.target.closest("button");if(!t)return;if(t.dataset.cpleave!==undefined){leaveRoom();menu()}if(t.dataset.cpstart!==undefined)hostStart(d);if(t.dataset.cpinv!==undefined)invite()}}
function invite(){const ppl=humans().slice(0,60);const l=sheet("cpinv","Arkadaşını çağır",ppl.length?`<div class="box">${ppl.map(u=>`<button class="opt" data-cpu="${esc(u)}">${avatar(u,36,{click:false,ring:false})}<span>${esc(P(u).name)}<small class="muted" style="display:block">@${esc(P(u).username)}</small></span></button>`).join("")}</div>`:`<p class="muted">Henüz arkadaşın yok. Kodu kendin paylaş: <b>${esc(V.room)}</b></p>`,{tall:true});
 $$("[data-cpu]",l).forEach(b=>b.onclick=async()=>{b.disabled=true;const ok=await sendMessage("u:"+b.dataset.cpu,{text:`Cephe'de savaşa çağırıyorum! Oda kodu: ${V.room}`,cephe:V.room});toast(ok?"Çağrı gönderildi":"Gönderilemedi")})}
async function hostStart(d){const oy=Object.entries(d.oy||{}).filter(([,v])=>v);const seed=(Math.random()*1e9)|0;try{await DB.update(roomPath(V.room),{st:"spawn",seed,t0:now()+5500,up:now()})}catch{toast("Başlatılamadı.")}}
async function onRoom(d){if(!V||!V.room)return;if(!d){toast("Oda kapandı.");V.room=null;return menu()}
 if(d.st==="lobby"){if(V.mode!=="lobby"){V.mode="lobby"}return lobby(d)}
 if(d.st==="over"&&d.why){toast(d.why);V.room=null;return menu()}
 if(d.st==="spawn"&&!G){let sc,m;try{({sc,m}=await prepare(d.sc,d.seed))}catch{return toast("Harita indirilemedi.")}
  const g=newGame(m,{sc:d.sc});G=g;const oy=Object.entries(d.oy||{}).filter(([,v])=>v).sort((a,b)=>(a[1].at||0)-(b[1].at||0));
  for(const [u,v] of oy){const p=addPlayer(g,{uid:u,name:v.n,flag:v.f||null});if(u===S.uid)V.me=p.i}
  addBots(g,sc,d.nb,d.diff,oy.map(([,v])=>v.f));V.picks={};
  if(V.host){V.cmdUn=oy.filter(([u])=>u!==S.uid).map(([u])=>DB.watchDoc(cmdPath(V.room,u),c=>hostCmds(u,c)))}
  spawnPhase();V.spawnEnd=performance.now()+Math.max(1500,(d.t0||now()+5000)-now());return}
 if(!V.host&&d.s&&G){applySnap(G,d.s);if(V.mode!=="play"){V.mode="play";ui()}V.need=true;if(G.over&&!V.overShown)showOver()}}
function hostCmds(u,c){if(!c||!c.q||!G)return;let q=[];try{q=JSON.parse(c.q)}catch{}const o=G.pl.findIndex(p=>p.uid===u);V.lastSeq=V.lastSeq||{};
 for(const k of q){if(k.s<=(V.lastSeq[u]||0))continue;V.lastSeq[u]=k.s;if(k.a==="spawn"){(V.picks=V.picks||{})[u]=k.c;continue}if(o>=0)applyCmd(G,o,k)}}
function sendCmd(c){if(c.a==="spawn"&&V.mode!=="spawn")return;V.cmdQ.push({...c,s:++V.cmdSeq});V.cmdQ=V.cmdQ.slice(-30);DB.set(cmdPath(V.room,S.uid),{q:JSON.stringify(V.cmdQ),up:now()}).catch(()=>{});vib&&vib(10)}
function roomSnap(){if(!V.room||!G)return;DB.update(roomPath(V.room),{st:G.over?"done":"play",s:snapOf(G),up:now()}).catch(e=>console.warn("cephe",e))}
function leaveRoom(){const c=V&&V.room;if(!c)return;V.room=null;try{V.roomUn&&V.roomUn()}catch{}(V.cmdUn||[]).forEach(f=>{try{f()}catch{}});V.cmdUn=null;
 if(V.host)DB.update(roomPath(c),{st:"over",why:"Kurucu odadan çıktı, savaş bitti.",up:now()}).catch(()=>{});else DB.update(roomPath(c),{oy:{[S.uid]:null},up:now()}).catch(()=>{});
 DB.del(cmdPath(c,S.uid)).catch(()=>{});G=null}
CP._test={SC,FL,loadMap,newGame,addPlayer,spawn,step,attack,applyCmd,snapOf,applySnap,botThink,cap,power,G:()=>G,V:()=>V};
})();
