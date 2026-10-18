/* Kadraj Cephe 5.9: piksel toprak savaşı (baştan yazıldı).
   index.html bu dosyayı yalnızca Keşfet'teki Cephe kartına dokunulunca yükler ve window.CEPHE.open() çağırır; sohbetteki davet CEPHE.join(kod).
   Kadraj'ın genel adlarını kullanır: S, DB, I, esc, toast, openLayer, closeLayer, sheet, P, me, humans, avatar, sendMessage, now, vib, kbReduce, guard, LS, APP_V.
   Haritalar cephe/<ad>.png (tek kanal; 0 derin deniz, 1 sığ deniz, 2+iklim*32+yükseklik kara; iklim 0 ılıman, 1 çöl, 2 buzul, 3 tundra) ve menü küçük resmi cephe/<ad>.jpg.
     Kaynak: Natural Earth kıyıları, NASA Blue Marble renkleri ve yükseklik görüntüsünden üretildi (üretici betik oturum notlarında).
   Oyun: hücre ızgarası; owner[c] = -2 deniz, -1 boş kara, >=0 oyuncu. Saldırı = bir cephe; asker harcanarak hücre hücre ilerler (arazi zorluğu, savunmacının
     asker yoğunluğu ve asker gücü fiyatı belirler). Asker gücü seviye 1-10, güç = seviye×10 (2. seviyede 15.000 asker, 1. seviyede 30.000'e denk).
   Arkadaşla: oda games/cp-<KOD> (cp, host, sc, diff, nb, tb, st lobby|spawn|play|done|over, oy, seed, se, s, kf, kn, d), komutlar games/cp-<KOD>-<uid> ({q: JSON}).
     Kurucu benzetimi yürütür, saniyede bir yazar: s (oyuncular, saldırılar, gemiler, füzeler, olaylar), kf (sahiplik RLE, 10 sn'de bir), d (kf'den beri değişen hücreler). */
(()=>{"use strict";
if(window.CEPHE)return;
const CP={};window.CEPHE=CP;
const AV=typeof APP_V!=="undefined"?APP_V:0;

/* ---------- haritalar ve senaryolar ---------- */
const MAPDEF={dunya:[-170,-56,190,78],avrasya:[-12,4,150,74],avrupa:[-12,34,48,71],asya:[38,-10,150,58],kore:[123.5,32.8,131.6,43.3],anadolu:[24,34.6,45.5,43.2]};
const SC=[
 {id:"avrasya",n:"Avrasya",map:"avrasya",d:"Avrupa'dan Japonya'ya koca kıta",tr:26,b:[["Rusya","ru",50,57],["Çin","cn",104,34],["Hindistan","in",78,22],["Almanya","de",10,51],["Fransa","fr",2,46.5],["Britanya","gb",-2,53],["İran","ir",53,32],["Japonya","jp",138,36],["Kazakistan","kz",67,48],["Türkiye","tr",35,39],["Pakistan","pk",70,30],["Suudi Arabistan","sa",45,24],["Moğolistan","mn",103,47],["İspanya","es",-4,40],["Polonya","pl",19,52],["Ukrayna","ua",31,49]]},
 {id:"dunya",n:"Dünya",map:"dunya",d:"Bütün kıtalar, okyanus aşırı savaş",tr:30,b:[["ABD","us",-98,39],["Rusya","ru",70,60],["Çin","cn",103,34],["Brezilya","br",-50,-10],["Hindistan","in",78,22],["Almanya","de",10,51],["Avustralya","au",134,-25],["Kanada","ca",-106,56],["Mısır","eg",30,26],["Japonya","jp",138,36],["Arjantin","ar",-64,-35],["Nijerya","ng",8,9],["İran","ir",53,32],["Endonezya","id",113,-1],["Fransa","fr",2,46.5],["Kazakistan","kz",67,48]]},
 {id:"avrupa",n:"Avrupa",map:"avrupa",d:"Sıkışık sınırlar, hızlı çatışma",tr:16,b:[["Almanya","de",10,51],["Fransa","fr",2,46.5],["Britanya","gb",-2,53],["İtalya","it",12.5,42.8],["İspanya","es",-3.7,40.4],["Polonya","pl",19,52],["Ukrayna","ua",31,49],["Rusya","ru",37,55.7],["İsveç","se",15,62],["Yunanistan","gr",22,39.5],["Romanya","ro",25,45.8],["Türkiye","tr",32.8,39.9]]},
 {id:"asya",n:"Asya",map:"asya",d:"Bozkırlar, dağlar ve adalar",tr:22,b:[["Çin","cn",104,34],["Hindistan","in",78,22],["Japonya","jp",138,36],["Rusya","ru",90,55],["Kazakistan","kz",67,48],["İran","ir",53,32],["Pakistan","pk",70,30],["Suudi Arabistan","sa",45,24],["Endonezya","id",113,-1],["Vietnam","vn",106,16],["Moğolistan","mn",103,47],["Güney Kore","kr",127.8,36.5]]},
 {id:"kurtulus",n:"Kurtuluş Savaşı (1919)",map:"anadolu",d:"Anadolu'da bağımsızlık cephesi",tr:10,b:[["Türkiye","tr",32.8,39.9],["Yunanistan","gr",27.1,38.4],["Britanya","gb",29,41],["Fransa","fr",35.3,37],["İtalya","it",30.7,36.9],["Sovyet Rusya","su",44.8,41.7]]},
 {id:"kore",n:"Kore Savaşı (1950)",map:"kore",d:"Yarımadada kuzey ile güney",tr:6,b:[["Kuzey Kore","kp",126.5,39.8],["Güney Kore","kr",127.6,36.4],["Çin","cn",124.6,42.3],["Birleşmiş Milletler","un",129.1,35.3],["Japonya","jp",130.6,33.4]]},
 {id:"ww1",n:"1. Dünya Savaşı (1914)",map:"avrupa",d:"İmparatorluklar çarpışıyor",tr:12,b:[["Osmanlı","osm",32.8,39.9],["Alman İmparatorluğu","dei",13.4,52.5],["Avusturya-Macaristan","ah",16.4,48.2],["Rus İmparatorluğu","ru",37.6,55.7],["Fransa","fr",2.3,48.8],["Britanya","gb",-1.5,52.5],["İtalya","it",12.5,41.9],["Sırbistan","rs",20.5,44.8],["Bulgaristan","bg",23.3,42.7],["Romanya","ro",26.1,44.4]]},
 {id:"ww2",n:"2. Dünya Savaşı (1939)",map:"avrasya",d:"Avrupa'dan Pasifik'e cepheler",tr:20,b:[["Almanya","dei",13.4,52.5],["Sovyetler Birliği","su",37.6,55.7],["Japonya","jp",139.7,35.7],["Britanya","gb",-1.5,52.5],["Fransa","fr",2.3,48.8],["İtalya","it",12.5,41.9],["Çin","cn",106.5,29.5],["Polonya","pl",21,52.2],["Türkiye","tr",32.8,39.9]]}
];
const DIFF={kolay:{n:"Kolay",g:.8,think:2600,pct:.22,agg:.2,build:.45,nuke:0,lvl:.3},normal:{n:"Normal",g:1,think:1500,pct:.33,agg:.5,build:.8,nuke:.35,lvl:.6},zor:{n:"Zor",g:1.22,think:850,pct:.42,agg:.85,build:1,nuke:1,lvl:1}};
const TRIBE={g:.55,think:3200,pct:.3,agg:.15,build:0,nuke:0,lvl:0};
const TRN1=["Nehir","Tuz","Kartal","Bozkır","Çam","Kızıl","Demir","Rüzgâr","Gök","Ay","Kurt","Ceylan","Sarp","Kaya","Sis","Yaban","Akçay","Kara","Ilgın","Göl","Turna","Atmaca","Bulut","Orman","Fırtına","Mavi","Altın","Gümüş","Yıldız","Çakıl","Söğüt","Doğan"];
const TRN2=["Kuşu","Alanı","Boyu","Obası","Kurtları","Atlıları","Kabilesi","Yurdu","Ovası","Beyliği","Ocağı","Çobanları","Avcıları","Kalesi"];

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

/* toprak renkleri: canlı ve birbirinden ayrık */
const PCOL={kadraj:"#12b886",tr:"#e5383b",osm:"#c9184a",de:"#f4a261",dei:"#6c7a89",fr:"#3a86ff",gb:"#ef6f9c",it:"#57cc04",es:"#ffbe0b",pl:"#ff5d8f",ua:"#4cc9f0",ru:"#2a9d8f",su:"#d00000",se:"#219ebc",gr:"#5390d9",ro:"#e9c46a",ah:"#f6bd60",rs:"#9d4edd",bg:"#2d6a4f",us:"#4361ee",br:"#2dc653",cn:"#ff6b35",in:"#ff9f1c",jp:"#ff4d6d",kr:"#3d5a80",kp:"#7209b7",ir:"#06d6a0",pk:"#1b998b",sa:"#52b788",kz:"#00b4d8",mn:"#bc4749",vn:"#f94144",id:"#f3722c",eg:"#d4a373",ng:"#90be6d",ar:"#74c0fc",ca:"#f8961e",au:"#c77dff",un:"#48cae4"};

/* ---------- yardımcılar ---------- */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const nf=n=>Math.round(Math.max(0,n||0)).toLocaleString("tr-TR");
const pf=(x,d=1)=>"%"+(Math.max(0,x)*100).toFixed(d).replace(".",",");
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hexRgb=h=>{const n=parseInt(h.slice(1),16);return[(n>>16)&255,(n>>8)&255,n&255]};
const rgbHex=c=>"#"+c.map(v=>Math.round(clamp(v,0,255)).toString(16).padStart(2,"0")).join("");
function hsl(h,s,l){const k=n=>(n+h/30)%12,a=s*Math.min(l,1-l),f=n=>l-a*Math.max(-1,Math.min(k(n)-3,9-k(n),1));return[f(0)*255,f(8)*255,f(4)*255].map(Math.round)}
let rng=Math.random;
function seeded(s){let a=s>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const mtime=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return Math.floor(s/60)+":"+String(s%60).padStart(2,"0")};

/* ---------- harita ---------- */
const KIND=["Deniz","Ova","Yayla","Dağ","Çöl","Kayalık","Tundra","Buzul"];
const KMUL=[0,1,1.45,2.3,1.25,1.7,1.35,1.9];
function kindOf(v){if(v<2)return 0;const b=(v-2)>>5,y=(v-2)&31;if(b===2)return 7;if(b===3)return y>19?3:6;if(b===1)return y>19?3:y>11?5:4;return y>=19?3:y>=10?2:1}
const MAPS={};
function loadMap(id){if(MAPS[id])return MAPS[id];return MAPS[id]=new Promise((res,rej)=>{const im=new Image();const fail=()=>{delete MAPS[id];rej(new Error("Harita indirilemedi"))};
 im.onload=()=>{try{const W=im.naturalWidth,H=im.naturalHeight,c=document.createElement("canvas");c.width=W;c.height=H;const x=c.getContext("2d",{willReadFrequently:true});x.drawImage(im,0,0);const d=x.getImageData(0,0,W,H).data,t=new Uint8Array(W*H);for(let i=0;i<t.length;i++)t[i]=d[i*4];res(mkMap(id,W,H,t))}catch(e){fail()}};
 im.onerror=fail;im.src=`cephe/${id}.png?v=${AV}`})}
function mkMap(id,W,H,t){const N=W*H,kind=new Uint8Array(N),coast=new Uint8Array(N),lm=new Int32Array(N).fill(-1);let land=0;for(let i=0;i<N;i++){kind[i]=kindOf(t[i]);if(kind[i])land++}
 for(let i=0;i<N;i++)if(kind[i]){const x=i%W;if((x>0&&!kind[i-1])||(x<W-1&&!kind[i+1])||(i>=W&&!kind[i-W])||(i<N-W&&!kind[i+W]))coast[i]=1}
 /* kara parçaları (aynı parçadaysa karadan gidilir) */
 const q=new Int32Array(N);let nl=0;for(let i=0;i<N;i++){if(!kind[i]||lm[i]>=0)continue;let h=0,e=0;q[e++]=i;lm[i]=nl;while(h<e){const c=q[h++],x=c%W;const f=j=>{if(kind[j]&&lm[j]<0){lm[j]=nl;q[e++]=j}};if(x>0)f(c-1);if(x<W-1)f(c+1);if(c>=W)f(c-W);if(c<N-W)f(c+W)}nl++}
 const bb=MAPDEF[id],merc=la=>Math.log(Math.tan(Math.PI/4+la*Math.PI/360));
 const cell=(lon,lat)=>{const x=Math.floor((lon-bb[0])/(bb[2]-bb[0])*W),y=Math.floor((merc(bb[3])-merc(lat))/(merc(bb[3])-merc(bb[1]))*H);return clamp(y,0,H-1)*W+clamp(x,0,W-1)};
 return{id,W,H,N,t,kind,coast,lm,land,bb,cell}}
function nbrs(m,i,f){const W=m.W,x=i%W;if(x>0)f(i-1);if(x<W-1)f(i+1);if(i>=W)f(i-W);if(i<m.N-W)f(i+W)}
/* arazi renkleri: (yükseklik, r, g, b) durakları; iklim sırası ılıman, çöl, buzul, tundra */
const TSTOP=[[[0,96,190,72],[5,120,200,80],[10,166,206,104],[15,206,200,140],[20,190,172,146],[25,214,210,206],[29,250,250,252]],
 [[0,238,214,150],[8,230,200,136],[15,214,184,140],[21,196,176,158],[26,226,222,218],[30,252,252,252]],
 [[0,236,242,246],[31,255,255,255]],
 [[0,150,196,128],[8,172,200,150],[16,196,204,182],[24,226,228,226],[31,252,252,252]]];
const SEA=[46,120,204],SHALLOW=[82,160,226];
function baseCanvas(m){if(m.base)return m.base;const L=new Uint8Array(256*3);L.set(SEA,0);L.set(SHALLOW,3);
 for(let b=0;b<4;b++)for(let y=0;y<32;y++){const s=TSTOP[b];let k=0;while(k<s.length-2&&y>s[k+1][0])k++;const a=s[k],c=s[k+1],f=clamp((y-a[0])/Math.max(1,c[0]-a[0]),0,1);for(let j=0;j<3;j++)L[(2+b*32+y)*3+j]=Math.round(a[j+1]+(c[j+1]-a[j+1])*f)}
 const {W,H,N,t}=m,cv=document.createElement("canvas");cv.width=W;cv.height=H;const x=cv.getContext("2d"),im=x.createImageData(W,H),d=im.data;const ey=i=>t[i]>=2?(t[i]-2)&31:0;
 for(let i=0;i<N;i++){const v=t[i],k=i*4;let sh=0;if(v>=2){const X=i%W;const gx=(X<W-1?ey(i+1):0)-(X>0?ey(i-1):0),gy=(i<N-W?ey(i+W):0)-(i>=W?ey(i-W):0);sh=clamp(-(gx+gy)*.045,-.22,.22)}
  d[k]=clamp(L[v*3]*(1+sh),0,255);d[k+1]=clamp(L[v*3+1]*(1+sh),0,255);d[k+2]=clamp(L[v*3+2]*(1+sh),0,255);d[k+3]=255}
 x.putImageData(im,0,0);return m.base=cv}

/* ---------- oyun kuralları ---------- */
const BLD={ev:{n:"Şehir",d:"Asker sınırı +30.000, nüfus artar",c:3000,inc:2500},lim:{n:"Liman",d:"Kıyıya kurulur, altın getirir",c:4000,inc:3000},fab:{n:"Fabrika",d:"Saniyede +220 altın",c:5000,inc:4000},sav:{n:"Savunma",d:"Çevresini almak iki kat zor",c:2500,inc:1500},silo:{n:"Füze deposu",d:"Bomba atmak için gerekir",c:25000,inc:15000},sam:{n:"SAM",d:"Yakına gelen bombaları vurur",c:15000,inc:8000}};
const NUK={atom:{n:"Atom bombası",c:50000,r:6,sam:.9},nuk:{n:"Nükleer füze",c:120000,r:10,sam:.75},hid:{n:"Hidrojen bombası",c:260000,r:16,sam:.5}};
const SLOTS=["ev","lim","fab","sav","silo","sam","atom","nuk","hid","lvl"];
const PEACE=25e3,WIN=.8,TLIM=30*60e3,START_T=3000,START_G=2000,BOAT_MAX=3,BOAT_V=14,SAM_R=22,SAM_CD=8000,SAV_R=8;
let G=null;   /* oyun */
let V=null;   /* görünüm ve arayüz */

function newGame(m,opt){const g={m,opt,t:0,owner:new Int16Array(m.N),pl:[],bld:[],bmap:new Map(),att:[],boats:[],mis:[],booms:[],ev:[],over:null,seq:0,dirt:[],war:false,peace:0,chg:null};
 for(let i=0;i<m.N;i++)g.owner[i]=m.kind[i]?-1:-2;return g}
function addPlayer(g,o){const col=o.col||hexRgb(PCOL[o.flag]||"#12b886");
 const p={i:g.pl.length,uid:o.uid||null,name:o.name,flag:o.flag||null,col,hex:rgbHex(col),fc:col.map(v=>v*.62+255*.38),bc:col.map(v=>v*.82),bh:rgbHex(col.map(v=>v*.82)),bot:o.bot||null,diff:o.diff||null,troops:START_T,gold:START_G,lvl:1,cells:0,alive:true,border:new Set(),nb:{},nk:0,think:1500+rng()*1500,kills:0,spawn:-1,lx:-1,ly:-1,lr:0,peak:START_T,boatT:0,nukeT:0};
 g.pl.push(p);return p}
function isB(g,c){const ow=g.owner,o=ow[c],W=g.m.W,x=c%W;return(x>0&&ow[c-1]!==o)||(x<W-1&&ow[c+1]!==o)||(c>=W&&ow[c-W]!==o)||(c<g.m.N-W&&ow[c+W]!==o)}
function refB(g,c){const o=g.owner[c];if(o<0)return;const P=g.pl[o];if(isB(g,c))P.border.add(c);else P.border.delete(c)}
function setOwner(g,c,o){const old=g.owner[c];if(old===o)return;const W=g.m.W,x=c%W;
 if(old>=0){const P=g.pl[old];P.cells--;P.border.delete(c)}
 g.owner[c]=o;if(o>=0)g.pl[o].cells++;
 refB(g,c);if(x>0)refB(g,c-1);if(x<W-1)refB(g,c+1);if(c>=W)refB(g,c-W);if(c<g.m.N-W)refB(g,c+W);
 g.dirt.push(c);if(g.chg)g.chg.add(c);
 const b=g.bmap.get(c);if(b){if(old>=0)g.pl[old].nb[b.k]--;if(o>=0){b.o=o;g.pl[o].nb[b.k]=(g.pl[o].nb[b.k]||0)+1}else delBld(g,b)}}
function delBld(g,b){const i=g.bld.indexOf(b);if(i>=0)g.bld.splice(i,1);g.bmap.delete(b.c);if(b.o>=0&&g.owner[b.c]===b.o&&g.pl[b.o].nb[b.k])g.pl[b.o].nb[b.k]--}
const cnt=(p,k)=>p.nb[k]||0;
const cap=p=>4000+p.cells*70+cnt(p,"ev")*30000;
const popOf=p=>p.cells*520+cnt(p,"ev")*75000;
const goldRate=p=>p.alive?30+p.cells*.5+cnt(p,"fab")*220+cnt(p,"lim")*130:0;
const gm=p=>p.bot==="t"?TRIBE.g:p.bot?DIFF[p.diff].g:1;
const troopRate=p=>{if(!p.alive)return 0;const C=cap(p);return p.troops>C?-(p.troops-C)*.02:(600+C*.018)*(1-p.troops/C)*gm(p)};
const power=p=>p.lvl*10;
const lvlCost=p=>p.lvl>=10?Infinity:6000*2**(p.lvl-1);
const bCost=(p,k)=>BLD[k].c+BLD[k].inc*cnt(p,k);
const nCost=(p,k)=>Math.round(NUK[k].c*(1+.25*p.nk));
const slotCost=(p,k)=>k==="lvl"?lvlCost(p):NUK[k]?nCost(p,k):bCost(p,k);
function ev(g,s,w,k){g.ev.push({id:++g.seq,t:g.t,s,w:w||[],k:k||""});if(g.ev.length>40)g.ev.splice(0,g.ev.length-40)}
const tname=(g,t)=>t>=0?g.pl[t].name:"boş topraklar";

/* ---------- başlangıç yerleri ---------- */
function freeAt(g,c,r){const m=g.m,W=m.W,x0=c%W,y0=(c/W)|0;if(!m.kind[c]||g.owner[c]!==-1)return false;for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const x=x0+dx,y=y0+dy;if(x<0||y<0||x>=W||y>=m.H)continue;if(g.owner[y*W+x]>=0)return false}return true}
function nearFree(g,c,r=4){const m=g.m,W=m.W,x0=c%W,y0=(c/W)|0;if(freeAt(g,c,r))return c;for(let R=1;R<80;R++)for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==R)continue;const x=x0+dx,y=y0+dy;if(x<0||y<0||x>=W||y>=m.H)continue;const i=y*W+x;if(freeAt(g,i,r))return i}return -1}
function spawnAt(g,p,c,r=3){unspawn(g,p);c=nearFree(g,c,r+1);if(c<0)return false;const m=g.m,W=m.W,x0=c%W,y0=(c/W)|0;
 for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(dx*dx+dy*dy>r*r+1)continue;const x=x0+dx,y=y0+dy;if(x<0||y<0||x>=W||y>=m.H)continue;const i=y*W+x;if(m.kind[i]&&g.owner[i]===-1)setOwner(g,i,p.i)}
 p.spawn=c;p.lx=x0;p.ly=y0;p.lr=r;return true}
function unspawn(g,p){if(p.spawn<0)return;const W=g.m.W,x0=p.spawn%W,y0=(p.spawn/W)|0;for(let dy=-5;dy<=5;dy++)for(let dx=-5;dx<=5;dx++){const x=x0+dx,y=y0+dy;if(x<0||y<0||x>=W||y>=g.m.H)continue;const i=y*W+x;if(g.owner[i]===p.i)setOwner(g,i,-1)}p.spawn=-1}
function randLand(g){const m=g.m;for(let k=0;k<4000;k++){const c=(rng()*m.N)|0;if(m.kind[c]&&g.owner[c]===-1)return c}return -1}
/* oyuncular: insanlar, ülke botları, kabileler; herkeste aynı sırayla (oda tohumu) kurulur */
function setupPlayers(g,sc,hum,nb,diff,tb){const uf=new Set();hum.forEach((h,i)=>{addPlayer(g,{uid:h.uid,name:h.name,flag:h.flag,col:uf.has(h.flag||"kadraj")?hsl((i*137+40)%360,.7,.5):null});uf.add(h.flag||"kadraj")});
 const taken=hum.map(h=>h.flag);for(const b of sc.b.filter(b=>!taken.includes(b[1])).slice(0,nb)){const p=addPlayer(g,{name:b[0],flag:b[1],bot:"n",diff});p.home=[b[2],b[3]]}
 const nt=Math.round(sc.tr*[0,.5,1][tb]);const used=new Set();for(let i=0;i<nt;i++){let nm;for(let k=0;k<20;k++){nm=TRN1[(rng()*TRN1.length)|0]+" "+TRN2[(rng()*TRN2.length)|0];if(!used.has(nm))break}used.add(nm);
  addPlayer(g,{name:nm,bot:"t",col:hsl(rng()*360,.5+rng()*.2,.5+rng()*.1)})}}
function spawnBots(g){const m=g.m,minD=Math.sqrt(m.land/Math.max(1,g.pl.length)/3);
 for(const p of g.pl){if(p.bot!=="n")continue;spawnAt(g,p,m.cell(p.home[0],p.home[1]))}
 for(const p of g.pl){if(p.bot!=="t")continue;let best=-1,bd=-1;for(let k=0;k<30;k++){const c=randLand(g);if(c<0)break;const d=minDist(g,c);if(d>bd){bd=d;best=c}if(d>minD)break}if(best>=0)spawnAt(g,p,best,2)}}
function minDist(g,c){const W=g.m.W,x=c%W,y=(c/W)|0;let d=1e9;for(const p of g.pl)if(p.spawn>=0){const e=Math.hypot(p.spawn%W-x,((p.spawn/W)|0)-y);if(e<d)d=e}return d}
function nearCount(g,c,R=40){const W=g.m.W,x=c%W,y=(c/W)|0;let n=0;for(const p of g.pl)if(p.spawn>=0&&p.i!==(V&&V.me)&&Math.hypot(p.spawn%W-x,((p.spawn/W)|0)-y)<R)n++;return n}

/* ---------- benzetim ---------- */
function step(g,dt){if(g.over||!g.war)return;g.t+=dt;const s=dt/1000;
 if(g.peace>0){g.peace-=dt;if(g.peace<=0){g.peace=0;ev(g,"Barış bitti, artık ülkelere saldırılabilir.",[],"peace")}}
 for(const p of g.pl){if(!p.alive)continue;p.troops=Math.max(0,p.troops+troopRate(p)*s);p.gold+=goldRate(p)*s;if(p.troops>p.peak)p.peak=p.troops}
 for(const a of g.att.slice())runAtt(g,a,dt);
 for(const b of g.boats.slice()){b.pi+=s*BOAT_V;if(b.pi>=b.path.length-1){g.boats.splice(g.boats.indexOf(b),1);landBoat(g,b)}}
 for(const ms of g.mis.slice()){ms.f+=dt/ms.dur;if(!ms.chk&&ms.f>=.72){ms.chk=1;samCheck(g,ms)}if(ms.f>=1||ms.dn){g.mis.splice(g.mis.indexOf(ms),1);if(!ms.dn)boom(g,ms)}}
 if(g.booms.length)g.booms=g.booms.filter(b=>g.t-b.t<3000);
 for(const p of g.pl)if(p.bot&&p.alive){p.think-=dt;if(p.think<=0){const D=p.bot==="t"?TRIBE:DIFF[p.diff];p.think=D.think*(.7+rng()*.6);botThink(g,p)}}
 for(const p of g.pl)if(p.alive&&p.cells<=0&&p.spawn>=0)die(g,p,null);
 checkOver(g)}
function die(g,T,A){if(!T.alive)return;T.alive=false;T.troops=0;g.att=g.att.filter(a=>a.o!==T.i);g.boats=g.boats.filter(b=>b.o!==T.i);
 if(A){A.kills++;A.gold+=T.gold;T.gold=0;ev(g,`${A.name}, ${T.name} ülkesini haritadan sildi.`,[A.i,T.i],"kill")}else ev(g,`${T.name} yok oldu.`,[T.i],"kill")}
function checkOver(g){if(g.over)return;const land=g.m.land;let lead=null;for(const p of g.pl)if(p.alive&&(!lead||p.cells>lead.cells))lead=p;if(!lead)return;
 const big=g.pl.filter(p=>p.bot!=="t"),alive=big.filter(p=>p.alive);
 if(lead.cells/land>=WIN)g.over={w:lead.i,why:"pct"};
 else if(big.length>1&&alive.length===1)g.over={w:alive[0].i,why:"son"};
 else if(big.length&&!alive.length)g.over={w:lead.i,why:"son"};
 else if(g.t>=TLIM)g.over={w:lead.i,why:"sure"};
 if(g.over)ev(g,`${g.pl[g.over.w].name} savaşı kazandı!`,[g.over.w],"win")}

/* saldırı: cephe adayları (hedefe ait, saldırana komşu hücreler) arasından komşusu en çok olan seçilir, cephe düzgün ilerler */
const ownN=(g,c,o)=>{const ow=g.owner,W=g.m.W,x=c%W;return(x>0&&ow[c-1]===o)+(x<W-1&&ow[c+1]===o)+(c>=W&&ow[c-W]===o)+(c<g.m.N-W&&ow[c+W]===o)};
function seedCand(g,a){const A=g.pl[a.o],ow=g.owner;a.cand.length=0;for(const b of A.border)nbrs(g.m,b,j=>{if(ow[j]===a.t)a.cand.push(j)})}
function pickCand(g,a){const C=a.cand,ow=g.owner;let best=-1,bs=-1,ok=0;
 for(let k=0;k<10&&C.length&&ok<3;k++){const j=(rng()*C.length)|0,c=C[j];if(ow[c]!==a.t){C[j]=C[C.length-1];C.pop();continue}const n=ownN(g,c,a.o);if(!n){C[j]=C[C.length-1];C.pop();continue}ok++;const sc=n+rng()*.9;if(sc>bs){bs=sc;best=c}}
 return best}
function defMul(g,c,t){const W=g.m.W,x=c%W,y=(c/W)|0;for(const b of g.bld)if(b.o===t&&b.k==="sav"&&Math.abs(b.c%W-x)<=SAV_R&&Math.abs(((b.c/W)|0)-y)<=SAV_R)return 2;return 1}
function cellCost(g,c,A,T){const mul=KMUL[g.m.kind[c]];if(!T)return(6+Math.sqrt(A.cells)*.45)*mul;const dens=T.troops/Math.max(1,T.cells);return(18+dens*1.1)*mul*power(T)/power(A)*defMul(g,c,T.i)}
function runAtt(g,a,dt){const A=g.pl[a.o],T=a.t>=0?g.pl[a.t]:null,W=g.m.W;if(!A.alive){g.att.splice(g.att.indexOf(a),1);return}if(T&&!T.alive)return retreat(g,a,1);
 if(!a.cand){a.cand=[];seedCand(g,a)}
 a.acc+=dt/1000*(T?3+Math.sqrt(a.cand.length)*1.6:5+Math.sqrt(a.cand.length)*4);let n=0;
 while(a.acc>=1&&n++<60){let c=pickCand(g,a);if(c<0){if(!a.rs){a.rs=1;seedCand(g,a);continue}return retreat(g,a,1)}a.rs=0;
  const cost=cellCost(g,c,A,T);if(a.n<cost){g.att.splice(g.att.indexOf(a),1);if(T&&!T.bot)ev(g,`${T.name}, ${A.name} saldırısını durdurdu.`,[T.i,A.i],"hold");return}
  a.n-=cost;a.acc-=KMUL[g.m.kind[c]];
  if(T){const dens=T.troops/Math.max(1,T.cells);T.troops=Math.max(0,T.troops-(dens*.85+2))}
  setOwner(g,c,a.o);const x=c%W,y=(c/W)|0;if(a.fx==null){a.fx=x;a.fy=y}else{a.fx=a.fx*.9+x*.1;a.fy=a.fy*.9+y*.1}
  nbrs(g.m,c,j=>{if(g.owner[j]===a.t)a.cand.push(j)});
  if(T&&T.cells<=0){die(g,T,A);return retreat(g,a,1)}}}
function retreat(g,a,auto){const i=g.att.indexOf(a);if(i<0)return;g.att.splice(i,1);const A=g.pl[a.o];if(A.alive)A.troops+=a.n*(auto?1:.85)}
function adjacent(g,o,t){const P=g.pl[o],ow=g.owner,W=g.m.W,N=g.m.N;for(const b of P.border){const x=b%W;if((x>0&&ow[b-1]===t)||(x<W-1&&ow[b+1]===t)||(b>=W&&ow[b-W]===t)||(b<N-W&&ow[b+W]===t))return true}return false}
function attack(g,o,t,n){const P=g.pl[o];n=Math.min(n,P.troops);if(n<20||t===o)return"az";P.troops-=n;
 const op=g.att.find(a=>a.o===t&&a.t===o);if(op){const k=Math.min(op.n,n);op.n-=k;n-=k;if(op.n<1)g.att.splice(g.att.indexOf(op),1);if(n<1)return"ok"}
 const ex=g.att.find(a=>a.o===o&&a.t===t);if(ex){ex.n+=n;ex.cand=null}else{g.att.push({id:++g.seq,o,t,n,acc:0,cand:null});if(t>=0)ev(g,`${P.name} sana ${nf(n)} askerle saldırıyor!`,[t],"att")}return"ok"}
function attackAt(g,o,c,n){const P=g.pl[o],m=g.m;if(c<0||!P||!P.alive)return"yok";const t=g.owner[c];if(t===-2)return"deniz";if(t===o)return"kendi";if(t>=0&&g.peace>0)return"baris";
 const mine=new Set();for(const b of P.border)mine.add(m.lm[b]);
 if(mine.has(m.lm[c])&&adjacent(g,o,t))return attack(g,o,t,n);
 const r=sendBoat(g,o,c,n);if(r==="ok"||r==="az"||r==="gemi")return r;return mine.has(m.lm[c])?"komsu":r}

/* gemiyle çıkarma: hedefin yanındaki denizden geriye doğru arama, kendi kıyımıza ulaşınca yol hazır */
function seaPath(g,o,target){const m=g.m,W=m.W,N=m.N,ow=g.owner,kind=m.kind;const prev=new Int32Array(N).fill(-1),q=new Int32Array(N);let h=0,e=0;
 nbrs(m,target,j=>{if(!kind[j]&&prev[j]<0){prev[j]=j;q[e++]=j}});
 while(h<e&&h<260000){const c=q[h++],x=c%W;let found=-1;
  const f=j=>{if(found>=0)return;if(kind[j]){if(ow[j]===o)found=j;return}if(prev[j]<0){prev[j]=c;q[e++]=j}};
  if(x>0)f(c-1);if(x<W-1)f(c+1);if(c>=W)f(c-W);if(c<N-W)f(c+W);
  if(found>=0){const path=[found];let k=c;while(true){path.push(k);if(prev[k]===k)break;k=prev[k]}path.push(target);return path}}
 return null}
function sendBoat(g,o,target,n){const P=g.pl[o];if(g.boats.filter(b=>b.o===o).length>=BOAT_MAX)return"gemi";n=Math.min(n,P.troops);if(n<20)return"az";const path=seaPath(g,o,target);if(!path)return"yol";
 P.troops-=n;g.boats.push({id:++g.seq,o,n,path,pi:0,tc:target});return"ok"}
function landBoat(g,b){const P=g.pl[b.o];if(!P.alive)return;const c=b.tc,t=g.owner[c];if(t===b.o||t===-2||(t>=0&&g.peace>0)){P.troops+=b.n;return}
 const T=t>=0?g.pl[t]:null;const cost=cellCost(g,c,P,T)*1.5;if(b.n<cost){ev(g,`${P.name} gemisinin çıkarması püskürtüldü.`,[b.o,t],"boat");return}
 setOwner(g,c,b.o);if(T){const d=T.troops/Math.max(1,T.cells);T.troops=Math.max(0,T.troops-d)}
 ev(g,`${P.name} ${T?T.name:"boş kıyıya"} ${T?"kıyısına ":""}çıkarma yaptı.`,[b.o,t],"boat");
 const n=b.n-cost;if(n>=20){P.troops+=n;attack(g,b.o,t,n)}}

/* yapılar, asker gücü, bombalar */
function tooClose(g,c,r){const W=g.m.W,x=c%W,y=(c/W)|0;return g.bld.some(b=>Math.abs(b.c%W-x)<=r&&Math.abs(((b.c/W)|0)-y)<=r)}
function build(g,o,k,c){const P=g.pl[o];if(!P||!P.alive||!BLD[k])return"yok";if(c<0||g.owner[c]!==o)return"toprak";
 if(k==="lim"&&!g.m.coast[c]){const W=g.m.W,x0=c%W,y0=(c/W)|0;let best=-1,bd=1e9;for(let dy=-8;dy<=8;dy++)for(let dx=-8;dx<=8;dx++){const x=x0+dx,y=y0+dy;if(x<0||y<0||x>=W||y>=g.m.H)continue;const i=y*W+x;if(g.m.coast[i]&&g.owner[i]===o&&dx*dx+dy*dy<bd&&!tooClose(g,i,2)){bd=dx*dx+dy*dy;best=i}}if(best<0)return"kiyi";c=best}
 if(tooClose(g,c,2))return"dolu";const cost=bCost(P,k);if(P.gold<cost)return"altin";P.gold-=cost;const b={id:++g.seq,k,o,c};g.bld.push(b);g.bmap.set(c,b);P.nb[k]=(P.nb[k]||0)+1;return"ok"}
function lvlUp(g,o){const P=g.pl[o];if(!P||!P.alive)return"yok";if(P.lvl>=10)return"max";const c=lvlCost(P);if(P.gold<c)return"altin";P.gold-=c;P.lvl++;if(!P.bot)ev(g,`Asker gücü ${P.lvl}. seviyeye çıktı: her asker artık ${power(P)} güçte.`,[o],"lvl");return"ok"}
function launch(g,o,k,c){const P=g.pl[o],N=NUK[k];if(!P||!N||!P.alive||c<0)return"yok";if(g.peace>0)return"baris";if(g.owner[c]===o)return"kendi";
 const silos=g.bld.filter(b=>b.o===o&&b.k==="silo");if(!silos.length)return"silo";const cost=nCost(P,k);if(P.gold<cost)return"altin";
 const W=g.m.W,tx=c%W,ty=(c/W)|0;let s=silos[0],sd=1e12;for(const b of silos){const d=(b.c%W-tx)**2+(((b.c/W)|0)-ty)**2;if(d<sd){sd=d;s=b}}
 P.gold-=cost;P.nk++;const t=g.owner[c];g.mis.push({id:++g.seq,k,o,from:s.c,to:c,f:0,dur:clamp(Math.sqrt(sd)*40,2400,7000)});
 ev(g,`${P.name} ${N.n.toLocaleLowerCase("tr-TR")} fırlattı${t>=0?" → "+g.pl[t].name:""}!`,[o,t],"nuke");return"ok"}
function samCheck(g,ms){const W=g.m.W,tx=ms.to%W,ty=(ms.to/W)|0;for(const b of g.bld){if(b.k!=="sam"||b.o===ms.o||(b.cd||0)>g.t)continue;if(Math.hypot(b.c%W-tx,((b.c/W)|0)-ty)>SAM_R)continue;b.cd=g.t+SAM_CD;
  if(rng()<NUK[ms.k].sam){ms.dn=1;ms.sx=b.c;g.booms.push({c:ms.to,r:0,t:g.t,air:1,f:ms.f,from:ms.from});ev(g,`${g.pl[b.o].name} SAM'ı ${g.pl[ms.o].name} bombasını havada vurdu!`,[b.o,ms.o],"sam");return}}}
function boom(g,ms){const N=NUK[ms.k],m=g.m,W=m.W,tx=ms.to%W,ty=(ms.to/W)|0,r=N.r,hit={},before={};for(const p of g.pl)before[p.i]=p.cells;
 for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const d=Math.hypot(dx,dy);if(d>r)continue;const x=tx+dx,y=ty+dy;if(x<0||y<0||x>=W||y>=m.H)continue;const c=y*W+x;const o=g.owner[c];if(o<0)continue;
  if(d<r*.6||rng()<(1-(d-r*.6)/(r*.4))*.9){hit[o]=(hit[o]||0)+1;setOwner(g,c,-1)}}
 for(const b of g.bld.slice())if(Math.hypot(b.c%W-tx,((b.c/W)|0)-ty)<=r)delBld(g,b);
 for(const o in hit){const T=g.pl[o];T.troops*=Math.max(0,1-hit[o]/Math.max(1,before[o])*1.3);if(T.cells<=0)die(g,T,g.pl[ms.o])}
 g.booms.push({c:ms.to,r,t:g.t,k:ms.k})}

/* ---------- botlar ---------- */
function botThink(g,p){const tribe=p.bot==="t",D=tribe?TRIBE:DIFF[p.diff],ow=g.owner,W=g.m.W,N=g.m.N;
 const nb=new Map(),stepN=Math.max(1,Math.floor(p.border.size/300));let k=0;
 for(const c of p.border){if(k++%stepN)continue;const x=c%W;const f=j=>{const o=ow[j];if(o!==-2&&o!==p.i)nb.set(o,(nb.get(o)||0)+1)};if(x>0)f(c-1);if(x<W-1)f(c+1);if(c>=W)f(c-W);if(c<N-W)f(c+W)}
 if(!tribe)botBuild(g,p,D,nb);
 const mine=g.att.filter(a=>a.o===p.i).length;if(mine>=(tribe?1:3))return;
 const C=cap(p);if(p.troops<C*(tribe?.4:.3+(1-D.agg)*.25))return;
 const send=p.troops*D.pct*(.85+rng()*.3);
 if(nb.has(-1)&&(rng()<.8||nb.size===1))return void attack(g,p.i,-1,send);
 let best=null,bs=-1e18;
 if(g.peace<=0)for(const[o,n]of nb){if(o<0)continue;const T=g.pl[o];if(!T.alive)continue;const eff=T.troops*power(T),my=send*power(p);if(my<eff*(tribe?1:.5))continue;
  const hostile=g.att.some(a=>a.o===o&&a.t===p.i);let sc=n*2-eff/Math.max(1,my)*40+(T.bot==="t"?15:0)+(!T.bot&&!tribe?D.agg*25:0)+(hostile?30:0);if(sc>bs){bs=sc;best=o}}
 if(best!==null)return void attack(g,p.i,best,send);
 if(!tribe&&!nb.has(-1)&&g.t>p.boatT&&p.troops>C*.55&&rng()<.35){p.boatT=g.t+12000;botBoat(g,p,send*.8)}}
function botBoat(g,p,n){const W=g.m.W;let best=-1,bd=1e9;for(let k=0;k<50;k++){const c=(rng()*g.m.N)|0;if(!g.m.coast[c])continue;const o=g.owner[c];if(o===p.i)continue;if(o>=0&&(g.peace>0||g.pl[o].troops*power(g.pl[o])>n*power(p)*.6))continue;const d=Math.hypot(c%W-p.lx,((c/W)|0)-p.ly);if(d<bd){bd=d;best=c}}
 if(best>=0&&bd<W*.45)sendBoat(g,p.i,best,n)}
function ownCell(g,p,near){const W=g.m.W;for(let k=0;k<40;k++){const r=Math.max(2,p.lr*(near?1.4:.85));const x=Math.round(p.lx+(rng()*2-1)*r),y=Math.round(p.ly+(rng()*2-1)*r);if(x<0||y<0||x>=W||y>=g.m.H)continue;const c=y*W+x;if(g.owner[c]===p.i&&!tooClose(g,c,2))return c}
 const arr=[...p.border];for(let k=0;k<20&&arr.length;k++){const c=arr[(rng()*arr.length)|0];if(!tooClose(g,c,2))return c}return -1}
function botBuild(g,p,D,nb){if(rng()>D.build)return;const gold=p.gold;
 if(p.lvl<10&&gold>lvlCost(p)*1.8&&rng()<D.lvl&&p.cells>150)return void lvlUp(g,p.i);
 const coastal=[...p.border].some(c=>g.m.coast[c]);const attacked=g.att.some(a=>a.t===p.i);const foeSilo=g.bld.some(b=>b.k==="silo"&&b.o!==p.i);
 let want=null;
 if(cnt(p,"ev")<1+p.cells/700)want="ev";else if(cnt(p,"fab")<cnt(p,"ev"))want="fab";else if(coastal&&cnt(p,"lim")<1+cnt(p,"ev")/3)want="lim";
 else if(attacked&&cnt(p,"sav")<2+p.cells/1500)want="sav";else if(D.nuke&&p.cells>1200&&cnt(p,"silo")<1)want="silo";else if(D.nuke&&foeSilo&&cnt(p,"sam")<1+cnt(p,"ev")/4)want="sam";
 if(want&&gold>=bCost(p,want)){const c=ownCell(g,p,want==="sav");if(c>=0)build(g,p.i,want,c);return}
 if(D.nuke&&cnt(p,"silo")&&g.peace<=0&&g.t>p.nukeT&&rng()<D.nuke){const ks=["hid","nuk","atom"].filter(k=>gold>=nCost(p,k)*1.15);if(!ks.length)return;
  let tgt=null;for(const o of nb.keys()){if(o<0)continue;const T=g.pl[o];if(T.bot!=="t"&&T.cells>p.cells*.7&&(!tgt||T.cells>tgt.cells))tgt=T}
  const lead=g.pl.filter(q=>q.alive&&q.i!==p.i).sort((a,b)=>b.cells-a.cells)[0];if(!tgt&&lead&&lead.cells>p.cells*1.3)tgt=lead;if(!tgt)return;
  const cities=g.bld.filter(b=>b.o===tgt.i&&(b.k==="ev"||b.k==="silo"));const c=cities.length?cities[(rng()*cities.length)|0].c:Math.round(tgt.ly)*g.m.W+Math.round(tgt.lx);
  if(launch(g,p.i,ks[0],c)==="ok")p.nukeT=g.t+45000}}

/* ---------- etiket yerleri: sınıra en uzak hücre (iki geçişli uzaklık dönüşümü) ---------- */
let DT=null;
function labels(g){const m=g.m,W=m.W,H=m.H,N=m.N,ow=g.owner;if(!DT||DT.length!==N)DT=new Uint16Array(N);const d=DT;
 for(let i=0;i<N;i++)d[i]=ow[i]<0?0:60000;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(!d[i])continue;const o=ow[i];let v=d[i];
  if(x===0||y===0||x===W-1||y===H-1){d[i]=3;continue}
  let j=i-1;v=Math.min(v,ow[j]===o?d[j]+3:3);j=i-W;v=Math.min(v,ow[j]===o?d[j]+3:3);j=i-W-1;v=Math.min(v,ow[j]===o?d[j]+4:4);j=i-W+1;v=Math.min(v,ow[j]===o?d[j]+4:4);d[i]=v}
 const best=new Int32Array(g.pl.length).fill(-1),bv=new Uint16Array(g.pl.length);
 for(let y=H-1;y>=0;y--)for(let x=W-1;x>=0;x--){const i=y*W+x;if(!d[i])continue;const o=ow[i];let v=d[i];
  if(x>0&&y>0&&x<W-1&&y<H-1){let j=i+1;v=Math.min(v,ow[j]===o?d[j]+3:3);j=i+W;v=Math.min(v,ow[j]===o?d[j]+3:3);j=i+W+1;v=Math.min(v,ow[j]===o?d[j]+4:4);j=i+W-1;v=Math.min(v,ow[j]===o?d[j]+4:4);d[i]=v}
  if(v>bv[o]){bv[o]=v;best[o]=i}}
 for(const p of g.pl){if(best[p.i]<0){p.lr=0;continue}p.lx=best[p.i]%W;p.ly=(best[p.i]/W)|0;p.lr=bv[p.i]/3}}

/* ---------- oda anlık görüntüsü ---------- */
function rleOf(ow){const s=[];let prev=ow[0],run=0;for(let i=0;i<ow.length;i++){const v=ow[i];if(v===prev)run++;else{s.push((prev+2).toString(36)+(run>1?"."+run.toString(36):""));prev=v;run=1}}s.push((prev+2).toString(36)+(run>1?"."+run.toString(36):""));return s.join(",")}
function rawSet(g,c,o){if(g.owner[c]!==o){g.owner[c]=o;g.dirt.push(c)}}
function rleApply(g,str){let i=0;for(const part of str.split(",")){const[v,r]=part.split(".");const val=parseInt(v,36)-2,len=r?parseInt(r,36):1;for(let k=0;k<len;k++)rawSet(g,i+k,val);i+=len}}
function encD(g){const a=[...g.chg].sort((x,y)=>x-y),s=[];let prev=0;for(let i=0;i<a.length;){let j=i;const o=g.owner[a[i]];while(j+1<a.length&&a[j+1]===a[j]+1&&g.owner[a[j+1]]===o)j++;s.push((a[i]-prev).toString(36)+"."+(j-i+1).toString(36)+"."+(o+2).toString(36));prev=a[i];i=j+1}return s.join(",")}
function decD(g,str){if(!str)return;let prev=0;for(const part of str.split(",")){const[gp,l,o]=part.split(".").map(v=>parseInt(v,36));const st=prev+gp;for(let k=0;k<l;k++)rawSet(g,st+k,o-2);prev=st}}
function snapOf(g){return JSON.stringify({t:Math.round(g.t),pe:Math.round(g.peace),w:g.war?1:0,
 p:g.pl.map(p=>[Math.round(p.troops),Math.round(p.gold),p.lvl,p.alive?1:0,p.nk,p.kills,p.spawn,p.cells,Math.round(p.peak)]),
 b:g.bld.map(b=>[b.k,b.o,b.c]),a:g.att.map(a=>[a.id,a.o,a.t,Math.round(a.n),a.fx==null?-1:Math.round(a.fx),a.fy==null?-1:Math.round(a.fy)]),
 bo:g.boats.map(b=>[b.id,b.o,Math.round(b.n),b.path[Math.min(b.path.length-1,Math.floor(b.pi))],b.tc]),
 mi:g.mis.map(m=>[m.id,m.k,m.o,m.from,m.to,+m.f.toFixed(3),Math.round(m.dur)]),bm:g.booms.map(b=>[b.c,b.r,Math.round(g.t-b.t),b.air?1:0]),
 ev:g.ev.slice(-10).map(e=>[e.id,e.s,e.w,e.k]),over:g.over})}
function applySnap(g,str){const d=JSON.parse(str);g.t=d.t;g.peace=d.pe;g.war=!!d.w;
 d.p.forEach((a,i)=>{const p=g.pl[i];if(!p)return;[p.troops,p.gold,p.lvl]=a;p.alive=!!a[3];p.nk=a[4];p.kills=a[5];p.spawn=a[6];p.cells=a[7];p.peak=a[8]});
 g.bld=d.b.map(([k,o,c])=>({k,o,c}));g.bmap=new Map(g.bld.map(b=>[b.c,b]));for(const p of g.pl)p.nb={};for(const b of g.bld)if(g.pl[b.o])g.pl[b.o].nb[b.k]=(g.pl[b.o].nb[b.k]||0)+1;
 g.att=d.a.map(([id,o,t,n,fx,fy])=>({id,o,t,n,fx:fx<0?null:fx,fy:fy<0?null:fy}));
 g.boats=d.bo.map(([id,o,n,at,tc])=>({id,o,n,at,tc}));
 const t0=performance.now();g.mis=d.mi.map(([id,k,o,from,to,f,dur])=>({id,k,o,from,to,f,dur,rt:t0-f*dur}));
 g.booms=d.bm.map(([c,r,age,air])=>({c,r,t:g.t-age,air,rt:t0-age}));
 for(const e of d.ev)if(!g.ev.some(x=>x.id===e[0]))g.ev.push({id:e[0],s:e[1],w:e[2],k:e[3]});if(g.ev.length>40)g.ev.splice(0,g.ev.length-40);
 g.over=d.over||null}

/* ---------- görünüm ---------- */
function css(){if($("#cpCss"))return;const st=document.createElement("style");st.id="cpCss";st.textContent=`
.cp{position:absolute;inset:0;background:#2e78cc;color:#fff;pointer-events:auto;overflow:hidden;font-family:var(--f-body);user-select:none;-webkit-user-select:none;touch-action:none;--g:rgba(16,24,38,.8);--gl:rgba(255,255,255,.14)}
.cp canvas.cp-cv{position:absolute;inset:0;width:100%;height:100%;display:block}
.cp button{font:inherit;color:inherit;cursor:pointer}
.cp svg{width:18px;height:18px;flex:none}
.cp-gl{background:var(--g);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border:1px solid var(--gl);border-radius:14px;box-shadow:0 6px 22px rgba(0,0,0,.22)}
.cp-tl{position:absolute;left:10px;top:calc(10px + env(safe-area-inset-top,0px));display:flex;gap:6px;z-index:3}
.cp-rb{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:var(--g);border:1px solid var(--gl);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);box-shadow:0 4px 14px rgba(0,0,0,.25)}
.cp-rb[aria-pressed=true]{background:#fff;color:#152033}
.cp-tc{position:absolute;left:50%;transform:translateX(-50%);top:calc(10px + env(safe-area-inset-top,0px));width:min(430px,calc(100% - 330px));display:grid;gap:6px;justify-items:center;z-index:2;pointer-events:none}
.cp-wc{width:100%;padding:7px 12px 8px}
.cp-wc .h{display:flex;justify-content:space-between;align-items:center;font:800 .6rem/1 var(--f-mono);letter-spacing:.14em;color:#c3d0e2}
.cp-bar{position:relative;height:10px;border-radius:6px;background:rgba(255,255,255,.16);margin-top:6px}
.cp-bar i{position:absolute;left:0;top:0;bottom:0;border-radius:6px;min-width:3px;transition:width .4s}
.cp-bar .ld{position:absolute;top:-3px;bottom:-3px;width:3px;margin-left:-1px;border-radius:2px;background:#fff;box-shadow:0 0 0 1px rgba(0,0,0,.3)}
.cp-bar .goal{position:absolute;left:80%;top:-5px;bottom:-5px;width:2px;background:#ffd166}
.cp-bar .goal::after{content:"%80";position:absolute;left:4px;top:-1px;font:800 .5rem var(--f-mono);color:#ffd166}
.cp-wc .r{display:flex;justify-content:space-between;gap:8px;margin-top:5px;font:600 .68rem/1.2 var(--f-mono);color:#e7eef8}
.cp-wc .r span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cp-pill{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;font:800 .74rem/1 var(--f-mono);letter-spacing:.04em}
.cp-peace{background:rgba(18,184,134,.92);color:#fff;border:0}
.cp-tr{position:absolute;right:10px;top:calc(10px + env(safe-area-inset-top,0px));display:grid;gap:6px;justify-items:end;z-index:3;max-width:min(250px,48vw)}
.cp-rank{padding:9px 13px}
.cp-lb{width:min(250px,48vw);padding:8px;display:grid;gap:2px;font-size:.74rem}
.cp-lb div{display:grid;grid-template-columns:18px 20px minmax(0,1fr) auto;align-items:center;gap:6px;padding:3px 4px;border-radius:8px}
.cp-lb .me{background:rgba(255,255,255,.14);font-weight:800}
.cp-lb s{text-decoration:none;font:700 .62rem var(--f-mono);color:#9fb0c6;text-align:right}
.cp-lb i{width:18px;height:12px;border-radius:3px;display:block;box-shadow:0 0 0 1px rgba(0,0,0,.25);background-size:cover}
.cp-lb span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cp-lb em{font:600 .66rem var(--f-mono);font-style:normal;color:#d7e2f0}
.cp-ban{position:absolute;left:50%;top:calc(64px + env(safe-area-inset-top,0px));transform:translateX(-50%);padding:12px 20px;text-align:center;display:grid;gap:4px;justify-items:center;z-index:2;pointer-events:none;width:max-content;max-width:calc(100% - 24px)}
.cp-ban b{font:800 clamp(.95rem,4.2vw,1.35rem)/1.15 var(--f-display);letter-spacing:.05em}
.cp-ban small{font-size:.78rem;color:#c9d6e8}
.cp-ring{position:relative;width:64px;height:64px;display:grid;place-items:center;font:800 1.6rem var(--f-display)}
.cp-ring svg{position:absolute;inset:0;width:64px;height:64px;transform:rotate(-90deg)}
.cp-bp{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(8px + env(safe-area-inset-bottom,0px));width:min(640px,calc(100% - 16px));padding:10px 10px 8px;display:grid;gap:7px;z-index:3}
.cp-r1{display:flex;align-items:center;gap:8px;min-width:0}
.cp-r1 .fl{width:30px;height:20px;border-radius:4px;box-shadow:0 0 0 1px rgba(255,255,255,.35);flex:none;background-size:cover}
.cp-r1 .nm{font-weight:800;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cp-r1 .cp-pcx{font:700 .72rem var(--f-mono);color:#c3d0e2;flex:none}
.cp-r1 .sp{flex:1}
.cp-kv{display:grid;gap:1px;text-align:right;flex:none}
.cp-kv small,.cp-lbl{font:800 .55rem/1 var(--f-mono);letter-spacing:.12em;color:#9fb0c6;text-transform:uppercase}
.cp-kv b{font:700 .8rem/1.15 var(--f-mono)}
.cp-kv em{font:600 .62rem var(--f-mono);font-style:normal;color:#8ce99a}
.cp-tp{display:grid;gap:4px}
.cp-tp .h{display:flex;align-items:baseline;gap:8px}
.cp-tp .h b{font:800 1rem var(--f-mono)}
.cp-tp .h span{font:600 .72rem var(--f-mono);color:#c3d0e2}
.cp-tp .h em{font:700 .7rem var(--f-mono);font-style:normal;color:#8ce99a;margin-left:auto}
.cp-tb{height:8px;border-radius:5px;background:rgba(255,255,255,.14);overflow:hidden}
.cp-tb i{display:block;height:100%;border-radius:5px;background:linear-gradient(90deg,#4ade80,#a3e635);transition:width .3s}
.cp-r3{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.cp-ch{padding:6px 0;min-width:2.7rem;border-radius:9px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.1);font:800 .72rem var(--f-mono)}
.cp-ch[aria-pressed=true]{background:#ffd166;color:#1b2333;border-color:#ffd166}
.cp-send{font:600 .72rem var(--f-mono);color:#e7eef8;margin-left:auto;white-space:nowrap}
.cp-sl{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:4px}
.cp-s{position:relative;display:grid;justify-items:center;gap:2px;padding:6px 2px 5px;border-radius:10px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.08);min-width:0}
.cp-s svg{width:20px;height:20px}
.cp-s u{position:absolute;left:4px;top:2px;text-decoration:none;font:700 .5rem var(--f-mono);color:#9fb0c6}
.cp-s small{font-size:.56rem;font-weight:700;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cp-s em{font:700 .54rem var(--f-mono);font-style:normal;color:#ffd166;max-width:100%;overflow:hidden;white-space:nowrap}
.cp-s[aria-disabled=true]{opacity:.42}
.cp-s[aria-pressed=true]{background:#ffd166;color:#1b2333;border-color:#ffd166}.cp-s[aria-pressed=true] em,.cp-s[aria-pressed=true] u{color:#1b2333}
.cp-s.bomb svg{color:#ff8787}.cp-s.bomb[aria-pressed=true] svg{color:#c92a2a}
.cp-side{position:absolute;left:10px;bottom:calc(var(--bph,200px) + 16px + env(safe-area-inset-bottom,0px));width:min(300px,calc(100% - 20px));display:grid;gap:6px;z-index:2;pointer-events:none}
.cp-side>*{pointer-events:auto}
.cp-at{padding:7px 8px;display:grid;gap:4px}
.cp-at .cp-lbl{padding:0 2px 2px}
.cp-ar{display:flex;align-items:center;gap:7px;font-size:.76rem;min-width:0}
.cp-ar i{width:10px;height:10px;border-radius:3px;flex:none}
.cp-ar span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cp-ar b{font:700 .72rem var(--f-mono)}
.cp-ar.cin b{color:#ff8787}
.cp-ar button{width:28px;height:24px;border-radius:7px;display:grid;place-items:center;background:rgba(255,255,255,.12);border:0}
.cp-ar button svg{width:14px;height:14px}
.cp-feed{display:grid;gap:4px;justify-items:start}
.cp-fd{padding:6px 10px;border-radius:10px;font-size:.74rem;line-height:1.3;max-width:100%;animation:cpIn .25s ease-out}
.cp-fd.bad{border-color:rgba(255,107,107,.6)}.cp-fd.good{border-color:rgba(140,233,154,.6)}
@keyframes cpIn{from{opacity:0;transform:translateY(6px)}}
.cp-tt{position:absolute;z-index:4;pointer-events:none;padding:8px 10px;min-width:150px;max-width:230px;display:grid;gap:3px;font-size:.74rem}
.cp-tt .t{display:flex;align-items:center;gap:6px;font-weight:800;font-size:.82rem}
.cp-tt .t i{width:18px;height:12px;border-radius:3px;background-size:cover;flex:none}
.cp-tt .w{font:800 .55rem var(--f-mono);letter-spacing:.12em;color:#ff8787}.cp-tt .w.ok{color:#8ce99a}
.cp-tt .k{display:flex;justify-content:space-between;gap:10px;font-family:var(--f-mono);font-size:.7rem}
.cp-tt .c{margin-top:2px;color:#ffd166;font-weight:700;font-size:.7rem}
.cp-hint{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(var(--bph,200px) + 16px + env(safe-area-inset-bottom,0px));padding:8px 8px 8px 14px;display:flex;align-items:center;gap:10px;font-size:.8rem;z-index:3;max-width:calc(100% - 24px)}
.cp-hint button{padding:6px 10px;border-radius:9px;background:rgba(255,255,255,.14);border:0;font-weight:700;font-size:.74rem}
.cp-mini{display:none}
@media (max-width:600px){.cp-tc{top:calc(58px + env(safe-area-inset-top,0px));width:calc(100% - 20px)}.cp-ban{top:calc(130px + env(safe-area-inset-top,0px))}.cp-tr{max-width:60vw}.cp-lb{width:min(240px,62vw)}
 .cp-sl{grid-template-columns:repeat(5,minmax(0,1fr))}.cp-bp{padding:8px 8px 6px;gap:6px}.cp-lbopen .cp-tc{display:none}}
@media (max-height:560px) and (min-width:601px){.cp-sl{grid-template-columns:repeat(10,minmax(0,1fr))}.cp-s small{display:none}}
.cp-bp.min .cp-sl,.cp-bp.min .cp-r3{display:none}
.cp-col{position:absolute;right:8px;top:-14px;width:30px;height:22px;border-radius:8px;display:grid;place-items:center;background:var(--g);border:1px solid var(--gl)}
.cp-col svg{width:14px;height:14px}
.cp-over{position:absolute;inset:0;display:grid;place-items:center;background:rgba(6,12,22,.55);z-index:6;padding:20px}
.cp-over>div{width:min(360px,100%);padding:22px;text-align:center;display:grid;gap:10px}
.cp-over h2{font:800 1.7rem/1.1 var(--f-display);margin:0}
.cp-over p{margin:0;color:#c9d6e8;font-size:.86rem}
.cp-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.cp-stats div{padding:8px 4px;border-radius:10px;background:rgba(255,255,255,.08);display:grid;gap:2px}
.cp-stats b{font:800 .9rem var(--f-mono)}.cp-stats small{font-size:.6rem;color:#9fb0c6}
.cp-btn{padding:12px 14px;border-radius:12px;border:0;font-weight:800;display:flex;align-items:center;justify-content:center;gap:8px}
.cp-btn.p{background:#ffd166;color:#1b2333}.cp-btn.s{background:rgba(255,255,255,.12);color:#fff}
.cp-menu{position:absolute;inset:0;overflow:auto;touch-action:pan-y;padding:calc(18px + env(safe-area-inset-top,0px)) 16px calc(24px + env(safe-area-inset-bottom,0px));background:radial-gradient(circle at 20% 0%,#2f7fd6,#173a6b 55%,#0e2140)}
.cp-menu>*{max-width:620px;margin-left:auto;margin-right:auto}
.cp-menu .top{display:flex;align-items:center;justify-content:space-between}
.cp-menu h1{font:900 clamp(2.4rem,11vw,3.6rem)/1 var(--f-display);margin:14px 0 4px;letter-spacing:.04em;text-shadow:0 4px 0 rgba(0,0,0,.25)}
.cp-menu .sub{margin:0 0 16px;color:#cfe0f5;font-size:.9rem}
.cp-sec{margin:18px 0 8px;font:800 .62rem var(--f-mono);letter-spacing:.14em;color:#a9c3e2;text-transform:uppercase}
.cp-maps{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
.cp-map{padding:0;border-radius:14px;overflow:hidden;background:rgba(255,255,255,.08);border:2px solid transparent;text-align:left;display:grid}
.cp-map img{width:100%;aspect-ratio:2/1;object-fit:cover;display:block;background:#2e78cc}
.cp-map div{padding:7px 9px 9px;display:grid;gap:2px}.cp-map b{font-size:.84rem}.cp-map small{font-size:.68rem;color:#bcd0e8;line-height:1.25}
.cp-map[aria-pressed=true]{border-color:#ffd166;box-shadow:0 0 0 3px rgba(255,209,102,.25)}
.cp-seg{display:flex;flex-wrap:wrap;gap:6px}
.cp-seg button{flex:1 0 auto;padding:10px 12px;border-radius:12px;border:0;background:rgba(255,255,255,.1);font-weight:700;font-size:.82rem}
.cp-seg button[aria-pressed=true]{background:#ffd166;color:#1b2333}
.cp-flags{display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:6px;max-height:212px;overflow:auto;padding:2px}
.cp-flags button{display:grid;justify-items:center;gap:4px;padding:7px 2px;border-radius:10px;border:2px solid transparent;background:rgba(255,255,255,.07);font-size:.6rem;line-height:1.1}
.cp-flags img{width:38px;height:25px;border-radius:3px;box-shadow:0 0 0 1px rgba(0,0,0,.3)}
.cp-flags button[aria-pressed=true]{border-color:#ffd166;background:rgba(255,209,102,.16)}
.cp-go{display:grid;gap:8px;margin-top:20px}
.cp-code{font:900 2.4rem var(--f-mono);letter-spacing:.3em;text-align:center;padding:8px 0}
.cp-room{padding:12px;display:grid;gap:8px}
.cp-pl{display:flex;align-items:center;gap:10px}.cp-pl img{width:30px;height:20px;border-radius:3px}
.cp-in{width:100%;padding:12px;border-radius:12px;border:1px solid;background:transparent;font:800 1.4rem var(--f-mono);letter-spacing:.3em;text-align:center;text-transform:uppercase}
.cp-help{display:grid;gap:10px;font-size:.88rem;line-height:1.45}.cp-help b{font-weight:800}
`;document.head.appendChild(st)}

const IC={ev:'<path d="M3 21h18M5 21V10l5-3v14M10 21V4l9 4v13M13 11h3M13 15h3M7 13h1M7 17h1"/>',
 lim:'<path d="M12 8v13M5 13H3a9 9 0 0 0 18 0h-2M8 11h8M12 2a3 3 0 1 1 0 6a3 3 0 1 1 0-6"/>',
 fab:'<path d="M3 21V10l6 4v-4l6 4V5h3l1.5 16zM3 21h18"/>',
 sav:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
 silo:'<path d="M12 2c3 3 4 7 4 11l-4 2-4-2c0-4 1-8 4-11zM8 13l-3 4h3M16 13l3 4h-3M10 19l2 3 2-3"/>',
 sam:'<path d="M4 21h16M8 21l3-7M16 21l-3-7M11 14h2M12 14a5 5 0 0 0 5-5M12 14a5 5 0 0 1-5-5M12 9l6-6M15 3h3v3"/>',
 atom:'<path d="M12 10.5a1.5 1.5 0 1 1 0 3a1.5 1.5 0 1 1 0-3M2 12c0-2.2 4.5-4 10-4s10 1.8 10 4-4.5 4-10 4-10-1.8-10-4zM7 3.3c1.9-1.1 5.7 1.9 8.5 6.7s3.4 9.6 1.5 10.7-5.7-1.9-8.5-6.7S5.1 4.4 7 3.3zM17 3.3c1.9 1.1 1.3 5.9-1.5 10.7S8.9 21.8 7 20.7 5.7 14.8 8.5 10 15.1 2.2 17 3.3z"/>',
 nuk:'<path d="M12 2c2.5 2.5 3.5 6 3.5 10v5h-7v-5C8.5 8 9.5 4.5 12 2zM8.5 13l-3 3v3l3-1M15.5 13l3 3v3l-3-1M10 20l2 2 2-2"/>',
 hid:'<path d="M7 11a5 5 0 0 1 1-9 6 6 0 0 1 8 0 5 5 0 0 1 1 9zM10 11v6M14 11v6M5 21c1-3 3.5-4 7-4s6 1 7 4z"/>',
 lvl:'<path d="M5 13l7-6 7 6M5 19l7-6 7 6"/>',
 back:'<path d="M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3"/>',users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 1 0 8a4 4 0 1 1 0-8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
 door:'<path d="M14 3h5v18h-5M10 17l5-5-5-5M15 12H3"/>',play:'<path d="M6 4l14 8-14 8z"/>',target:'<path d="M12 2v4M12 18v4M2 12h4M18 12h4M12 6a6 6 0 1 1 0 12a6 6 0 1 1 0-12"/>',
 down:'<path d="M6 9l6 6 6-6"/>',up:'<path d="M6 15l6-6 6 6"/>',list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',help:'<path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01M12 2a10 10 0 1 1 0 20a10 10 0 1 1 0-20"/>'};
const svg=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IC[k]||""}</svg>`;
const SLN={ev:"Şehir",lim:"Liman",fab:"Fabrika",sav:"Savunma",silo:"Füze d.",sam:"SAM",atom:"Atom",nuk:"Nükleer",hid:"Hidrojen",lvl:"Güç"};

/* ---------- menü ---------- */
const OPT=(()=>{let o={};try{o=LS.get("kadraj_cephe",{})||{}}catch{}return{sc:SC.some(s=>s.id===o.sc)?o.sc:"avrasya",diff:DIFF[o.diff]?o.diff:"normal",nb:[0,4,8,12,16].includes(o.nb)?o.nb:8,tb:[0,1,2].includes(o.tb)?o.tb:2,flag:FL[o.flag]?o.flag:"kadraj"}})();
const saveOpt=()=>{try{LS.set("kadraj_cephe",OPT)}catch{}};
const myName=()=>{try{const u=me();return(u&&(u.name||u.username))||"Sen"}catch{return"Sen"}};
CP.open=function(){css();if(V&&V.layer&&document.body.contains(V.layer))return;const l=openLayer("cephe",`<div class="cp" id="cp"></div>`,{noScrim:true,onClose:()=>stop(true)});V={root:$("#cp",l),layer:l,ratio:.35};menu()};
function menu(){if(!V)return;stop();G=null;Object.assign(V,{mode:"menu",tool:null,overShown:false,spawnEnd:0,feedSeen:0,ov:null});const r=V.root;
 r.innerHTML=`<div class="cp-menu"><div class="top"><span class="cp-pill cp-gl">${svg("target")}PİKSEL SAVAŞI</span><button class="cp-rb" data-cpx aria-label="Kapat">${I("close")}</button></div>
 <h1>CEPHE</h1><p class="sub">Yerini seç, topraklarını büyüt, şehir kur, füze at. Dünyanın %80'ini alan kazanır.</p>
 <div class="cp-sec">Harita</div><div class="cp-maps">${SC.map(s=>`<button class="cp-map" data-sc="${s.id}" aria-pressed="${OPT.sc===s.id}"><img src="cephe/${s.map}.jpg?v=${AV}" alt="" loading="lazy"><div><b>${esc(s.n)}</b><small>${esc(s.d)}</small></div></button>`).join("")}</div>
 <div class="cp-sec">Ülke botları</div><div class="cp-seg">${[0,4,8,12,16].map(n=>`<button data-nb="${n}" aria-pressed="${OPT.nb===n}">${n?n:"Botsuz"}</button>`).join("")}</div>
 <div class="cp-sec">Küçük kabileler</div><div class="cp-seg">${["Yok","Az","Çok"].map((t,i)=>`<button data-tb="${i}" aria-pressed="${OPT.tb===i}">${t}</button>`).join("")}</div>
 <div class="cp-sec">Bot zorluğu</div><div class="cp-seg">${Object.entries(DIFF).map(([k,d])=>`<button data-df="${k}" aria-pressed="${OPT.diff===k}">${d.n}</button>`).join("")}</div>
 <div class="cp-sec">Bayrağın</div><div class="cp-flags">${FLAG_PICK.map(f=>`<button data-fl="${f}" aria-pressed="${OPT.flag===f}"><img src="${flagURL(f)}" alt="">${esc(FL[f][0])}</button>`).join("")}</div>
 <div class="cp-go"><button class="cp-btn p" data-cpgo="solo">${svg("play")}Oyna</button><button class="cp-btn s" data-cpgo="room">${svg("users")}Oda kur, arkadaşını çağır</button><button class="cp-btn s" data-cpgo="join">${svg("door")}Odaya katıl</button></div></div>`;
 r.onclick=e=>{const t=e.target.closest("button");if(!t)return;const d=t.dataset;
  if(d.cpx!==undefined)return closeLayer("cephe");
  const pick=(sel,b)=>$$(sel,r).forEach(x=>x.setAttribute("aria-pressed",x===b));
  if(d.sc){OPT.sc=d.sc;pick("[data-sc]",t)}if(d.nb){OPT.nb=+d.nb;pick("[data-nb]",t)}if(d.tb){OPT.tb=+d.tb;pick("[data-tb]",t)}if(d.df){OPT.diff=d.df;pick("[data-df]",t)}if(d.fl){OPT.flag=d.fl;pick("[data-fl]",t)}saveOpt();
  if(d.cpgo==="solo")startSolo();if(d.cpgo==="room")createRoom();if(d.cpgo==="join")joinAsk()}}
async function prepare(scId,seed){const sc=SC.find(s=>s.id===scId)||SC[0];const m=await loadMap(sc.map);rng=seed?seeded(seed):Math.random;return{sc,m}}
async function startSolo(){let sc,m;toast("Harita hazırlanıyor…");try{({sc,m}=await prepare(OPT.sc))}catch(e){return toast("Harita indirilemedi. İnternetini kontrol et.")}if(!V)return;
 const g=newGame(m,{sc:sc.id});G=g;setupPlayers(g,sc,[{uid:S.uid,name:myName(),flag:OPT.flag}],OPT.nb,OPT.diff,OPT.tb);V.me=0;spawnBots(g);spawnPhase()}
function spawnPhase(){Object.assign(V,{mode:"spawn",spawnEnd:0,overShown:false,deadShown:false,feedSeen:0,tool:null,myPick:null,ov:null});V.spawnT0=performance.now();ui();fitView();const m=G.m,s2=Math.max(V.s,V.ch*.58/m.H);if(s2>V.s){V.s=s2;V.ox=(V.cw-m.W*s2)/2;V.oy=(V.ch-m.H*s2)/2;clampView()}loop()}
function beginWar(){const g=G;if(!g||g.war)return;for(const p of g.pl)if(p.spawn<0){const c=randLand(g);if(c>=0)spawnAt(g,p,c,p.bot==="t"?2:3)}
 g.war=true;g.peace=PEACE;ev(g,"Savaş başladı! İlk 25 saniye barış: boş topraklara yayıl.",[],"peace");V.mode="play";ui();focusMe(2.2);if(!V.room||V.host)startSim();if(V.room&&V.host)roomSnap(true)}
function startSim(){stopSim();let last=performance.now();V.snapT=0;V.simT=setInterval(()=>{if(!G)return;const n=performance.now();let dt=Math.min(500,n-last);last=n;while(dt>0){const d=Math.min(100,dt);step(G,d);dt-=d}V.stepAt=n;
 if(V.room&&V.host&&n-V.snapT>1000){V.snapT=n;roomSnap()}},100)}
function stopSim(){if(V&&V.simT){clearInterval(V.simT);V.simT=null}}
function stop(closing){stopSim();if(V){cancelAnimationFrame(V.raf);V.raf=0;if(V.room)leaveRoom();if(V.ro){V.ro.disconnect();V.ro=null}if(V.keys){document.removeEventListener("keydown",V.keys);V.keys=null}}if(closing){V=null;G=null}}

/* ---------- oyun arayüzü ---------- */
function ui(){const r=V.root,g=G,p=g.pl[V.me];const play=V.mode==="play";
 r.innerHTML=`<canvas class="cp-cv"></canvas>
 <div class="cp-tl"><button class="cp-rb" data-cq aria-label="Çık">${svg("door")}</button><button class="cp-rb" data-clb aria-label="Sıralama" aria-pressed="${!!V.lbOpen}">${svg("list")}</button><button class="cp-rb" data-cme aria-label="Konumuma git">${svg("target")}</button><button class="cp-rb" data-chelp aria-label="Nasıl oynanır">${svg("help")}</button></div>
 <div class="cp-tc">${play?`<div class="cp-wc cp-gl"><div class="h"><span>DÜNYA HAKİMİYETİ</span><span id="cpTm"></span></div><div class="cp-bar"><i id="cpMy" style="background:${p.hex}"></i><span class="ld" id="cpLd"></span><span class="goal"></span></div><div class="r"><span id="cpMyT"></span><span id="cpLdT"></span></div></div><span class="cp-pill cp-peace" id="cpPe" hidden>${svg("sav")}<span></span></span>`:""}</div>
 <div class="cp-tr"><span class="cp-pill cp-gl cp-rank" id="cpRk"></span><div class="cp-lb cp-gl" id="cpLb" ${V.lbOpen?"":"hidden"}></div></div>
 ${V.mode==="spawn"?`<div class="cp-ban cp-gl" id="cpBan"></div>`:""}
 <div class="cp-side"><div class="cp-at cp-gl" id="cpAt" hidden></div><div class="cp-feed" id="cpFeed"></div></div>
 <div class="cp-hint cp-gl" id="cpHint" hidden><span></span><button data-cno>Vazgeç</button></div>
 <div class="cp-tt cp-gl" id="cpTt" hidden></div>
 ${V.mode==="spawn"?"":`<div class="cp-bp cp-gl${V.min?" min":""}" id="cpBp">
  <button class="cp-col" data-cmin aria-label="Paneli küçült">${svg(V.min?"up":"down")}</button>
  <div class="cp-r1"><i class="fl" style="background-image:url(${p.flag?flagURL(p.flag):""});${p.flag?"":"background:"+p.hex}"></i><span class="nm">${esc(p.name)}</span><span class="cp-pcx" id="cpPct"></span><span class="sp"></span>
   <div class="cp-kv"><small>Nüfus</small><b id="cpPop"></b></div><div class="cp-kv"><small>Altın</small><b id="cpGo"></b><em id="cpGr"></em></div></div>
  <div class="cp-tp"><div class="h"><span class="cp-lbl">Asker</span><b id="cpTr"></b><span id="cpCap"></span><em id="cpTrr"></em></div><div class="cp-tb"><i id="cpTb"></i></div></div>
  <div class="cp-r3"><span class="cp-lbl">Saldırı</span>${[.1,.25,.35,.5,.75,1].map(v=>`<button class="cp-ch" data-cr="${v}" aria-pressed="${V.ratio===v}">%${v*100}</button>`).join("")}<span class="cp-send" id="cpSend"></span></div>
  <div class="cp-sl">${SLOTS.map((k,i)=>`<button class="cp-s${NUK[k]?" bomb":""}" data-cs="${k}" aria-pressed="false" title="${esc(k==="lvl"?"Asker gücü: her seviye askerin gücünü 10 artırır":(BLD[k]||NUK[k]).n+(BLD[k]?": "+BLD[k].d:""))}"><u>${(i+1)%10}</u>${svg(k)}<small>${SLN[k]}</small><em id="cpS_${k}"></em></button>`).join("")}</div>
 </div>`}`;
 r.classList.toggle("cp-lbopen",!!V.lbOpen);
 V.cv=$(".cp-cv",r);V.cx=V.cv.getContext("2d");V.ov=null;resize();wireInput();
 if(V.ro)V.ro.disconnect();V.ro=new ResizeObserver(()=>{resize();fitView(true);bph()});V.ro.observe(r);if($("#cpBp"))V.ro.observe($("#cpBp"))
 if(!V.keys){V.keys=onKey;document.addEventListener("keydown",V.keys)}
 r.onclick=e=>{const t=e.target.closest("button");if(!t)return;const d=t.dataset;
  if(d.cq!==undefined)return quitAsk();
  if(d.clb!==undefined){V.lbOpen=!V.lbOpen;t.setAttribute("aria-pressed",V.lbOpen);$("#cpLb").hidden=!V.lbOpen;r.classList.toggle("cp-lbopen",V.lbOpen);return hud()}
  if(d.cme!==undefined)return focusMe(V.s<fitScale()*1.5?2.4:0);
  if(d.chelp!==undefined)return help();
  if(d.cmin!==undefined){V.min=!V.min;$("#cpBp").classList.toggle("min",V.min);t.innerHTML=svg(V.min?"up":"down");return bph()}
  if(d.cr){V.ratio=+d.cr;$$("[data-cr]",r).forEach(b=>b.setAttribute("aria-pressed",b===t));return hud()}
  if(d.cs)return slot(d.cs);if(d.cno!==undefined)return setTool(null);if(d.cret)return act({a:"ret",id:+d.cret})}
 bph();hud()}
function bph(){if(!V)return;const b=$("#cpBp");V.root.style.setProperty("--bph",(b?b.offsetHeight:0)+"px")}
function onKey(e){if(!V||!G||V.mode==="menu"||V.mode==="lobby")return;if(e.target&&/INPUT|TEXTAREA/.test(e.target.tagName))return;
 if(/^[0-9]$/.test(e.key)){const i=(+e.key+9)%10;slot(SLOTS[i]);e.preventDefault()}else if(e.key==="Escape"){if(V.tool){setTool(null);e.preventDefault()}}
 else if(e.key===" "){focusMe(0);e.preventDefault()}else if(e.key==="q"||e.key==="e"){const L=[.1,.25,.35,.5,.75,1];let i=L.indexOf(V.ratio);i=clamp(i+(e.key==="e"?1:-1),0,L.length-1);V.ratio=L[i];$$("[data-cr]",V.root).forEach(b=>b.setAttribute("aria-pressed",+b.dataset.cr===V.ratio));hud()}}
function slot(k){if(V.mode!=="play")return toast("Önce başlangıç yerini seç.");const p=G.pl[V.me];if(!p.alive)return;
 if(k==="lvl")return act({a:"lvl"});if(V.tool===k)return setTool(null);setTool(k)}
function setTool(k){V.tool=k;$$("[data-cs]",V.root).forEach(b=>b.setAttribute("aria-pressed",b.dataset.cs===k));const h=$("#cpHint");if(!h)return;h.hidden=!k;
 if(k)$("span",h).textContent=NUK[k]?`${NUK[k].n}: hedefe dokun (en yakın füze deposundan atılır)`:BLD[k]?`${BLD[k].n}: kendi toprağına dokun${k==="lim"?" (kıyıya yakın)":""}`:""}
const MSG={deniz:"Denize dokundun. Karşı kıyıdaki bir yere dokun, gemiyle gidersin.",kendi:"Burası zaten senin.",az:"Gönderecek kadar askerin yok.",komsu:"Oraya karadan yolun yok; araya başka ülke giriyor.",yol:"Oraya deniz yolu bulunamadı.",gemi:"Aynı anda en fazla 3 gemin denizde olabilir.",baris:"Barış sürüyor: şimdilik yalnızca boş topraklara yayılabilirsin.",toprak:"Yalnızca kendi toprağına kurabilirsin.",dolu:"Burada zaten bir yapı var, biraz öteye kur.",kiyi:"Liman kıyıya kurulur; denize yakın bir yerine dokun.",altin:"Altının yetmiyor.",silo:"Önce bir füze deposu kur.",max:"Asker gücün en üst seviyede.",yok:""};
function feedback(r){if(r&&MSG[r]){toast(MSG[r]);vib&&vib(20)}}
function act(c){if(!G||!V)return;if(V.room&&!V.host)return sendCmd(c);const r=applyCmd(G,V.me,c);if(r&&r!=="ok")feedback(r);else if(c.a==="bld"||c.a==="nuk")setTool(null);hud()}
function applyCmd(g,o,c){const p=g.pl[o];if(!p||!p.alive||g.over||!g.war)return"yok";
 if(c.a==="att")return attackAt(g,o,c.c,p.troops*clamp(+c.r||.35,.01,1));
 if(c.a==="ret"){const a=g.att.find(a=>a.id===c.id&&a.o===o);if(!a)return"yok";retreat(g,a);return"ok"}
 if(c.a==="bld")return build(g,o,c.k,c.c);if(c.a==="nuk")return launch(g,o,c.k,c.c);if(c.a==="lvl")return lvlUp(g,o);return"yok"}
function tapCell(c,sx,sy){const g=G;if(!g||c<0)return;
 if(V.mode==="spawn"){if(!g.m.kind[c])return toast("Karada bir yer seç.");if(V.room&&!V.host){V.myPick=c;sendCmd({a:"spawn",c});tip(c,sx,sy);return}
  if(!spawnAt(g,g.pl[V.me],c))return toast("Burası dolu, başka yer seç.");vib&&vib(15);if(!V.spawnEnd&&!V.room)V.spawnEnd=performance.now()+5000;tip(c,sx,sy);hud();return}
 if(V.mode!=="play"||!g.pl[V.me].alive)return;
 if(V.tool){act({a:NUK[V.tool]?"nuk":"bld",k:V.tool,c});return}
 V.pings.push({c,t:performance.now()});act({a:"att",c,r:V.ratio})}

/* ---------- üst bilgiler ---------- */
let hudT=0;
function hud(){if(!V||!G||!V.cv)return;const g=G,p=g.pl[V.me],m=g.m;if(!p)return;const land=m.land;
 const set=(id,v)=>{const e=document.getElementById(id);if(e&&e.textContent!==v)e.textContent=v};
 const C=cap(p),tr=troopRate(p);set("cpPct",pf(p.cells/land,2));set("cpPop",nf(popOf(p)));set("cpGo",nf(p.gold));set("cpGr","+"+nf(goldRate(p))+"/sn");
 set("cpTr",nf(p.troops));set("cpCap","/ "+nf(C));set("cpTrr",(tr>=0?"+":"−")+nf(Math.abs(tr))+"/sn");const tb=$("#cpTb");if(tb)tb.style.width=clamp(p.troops/C*100,0,100)+"%";
 set("cpSend",`${nf(p.troops*V.ratio)} asker gönderilir · güç ${p.lvl}/10`);
 for(const k of SLOTS){const e=document.getElementById("cpS_"+k);if(!e)continue;const c=slotCost(p,k);const no=!isFinite(c)||p.gold<c||(NUK[k]&&!cnt(p,"silo"));e.textContent=isFinite(c)?(c>=1e6?(c/1e6).toFixed(1).replace(".",",")+" Mn":nf(c)):"EN ÜST";
  const b=e.parentNode;if(b.getAttribute("aria-disabled")!==String(no))b.setAttribute("aria-disabled",no);if(k==="lvl"){const s=b.querySelector("small");if(s)s.textContent="Güç "+p.lvl}}
 const al=g.pl.filter(q=>q.alive||q.cells>0).sort((a,b)=>b.cells-a.cells),rank=al.indexOf(p)+1,lead=al[0];
 set("cpRk",p.alive?`#${rank} · ${pf(p.cells/land,2)}`:"YENİLDİN");
 if(V.mode==="play"){const my=$("#cpMy");if(my)my.style.width=clamp(p.cells/land*100,0,100)+"%";const ld=$("#cpLd");if(ld&&lead)ld.style.left=clamp(lead.cells/land*100,0,100)+"%";
  set("cpMyT","Sen "+pf(p.cells/land));set("cpLdT",lead&&lead!==p?`Lider ${lead.name} ${pf(lead.cells/land)}`:"Lider sensin");set("cpTm",mtime(TLIM-g.t));
  const pe=$("#cpPe");if(pe){pe.hidden=!(g.peace>0);if(g.peace>0)$("span",pe).textContent="BARIŞ "+mtime(g.peace)}}
 if(V.lbOpen){const lb=$("#cpLb");if(lb){const top=al.slice(0,8);if(!top.includes(p)&&p.cells)top.push(p);
  lb.innerHTML=top.map(q=>`<div class="${q===p?"me":""}"><s>${al.indexOf(q)+1}</s><i style="${q.flag?`background-image:url(${flagURL(q.flag)})`:`background:${q.hex}`}"></i><span>${esc(q.name)}</span><em>${pf(q.cells/land)} · ${nf(q.troops)}</em></div>`).join("")}}
 /* saldırılar */
 const at=$("#cpAt");if(at){const out=g.att.filter(a=>a.o===V.me),inc=g.att.filter(a=>a.t===V.me),bo=g.boats.filter(b=>b.o===V.me);
  const rows=[...out.map(a=>`<div class="cp-ar"><i style="background:${a.t>=0?g.pl[a.t].hex:"#cfd8dc"}"></i><span>${esc(a.t>=0?g.pl[a.t].name:"Boş topraklar")}</span><b>${nf(a.n)}</b><button data-cret="${a.id}" aria-label="Geri çek" title="Geri çek">${svg("back")}</button></div>`),
   ...bo.map(b=>`<div class="cp-ar"><i style="background:#8ecdf7"></i><span>Gemi → ${esc(tname(g,g.owner[b.tc]))}</span><b>${nf(b.n)}</b></div>`),
   ...inc.map(a=>`<div class="cp-ar cin"><i style="background:${g.pl[a.o].hex}"></i><span>${esc(g.pl[a.o].name)} saldırıyor</span><b>${nf(a.n)}</b></div>`)];
  at.hidden=!rows.length;const h=rows.length?`<span class="cp-lbl">Saldırılar</span>${rows.slice(0,5).join("")}`:"";if(at._h!==h){at.innerHTML=h;at._h=h}}
 feed();if(V.mode==="spawn")banner();if(g.over&&!V.overShown)showOver();if(!p.alive&&!V.deadShown&&!g.over){V.deadShown=true;showDead()}}
function feed(){const g=G,f=$("#cpFeed");if(!f)return;const now_=performance.now();
 for(const e of g.ev){if(e.id<=V.feedSeen)continue;V.feedSeen=e.id;const mine=e.w.includes(V.me);if(!mine&&!["kill","nuke","win","peace","sam"].includes(e.k))continue;
  const bad=mine&&(e.k==="att"||(e.k==="nuke"&&e.w[0]!==V.me)||(e.k==="kill"&&e.w[1]===V.me));const d=document.createElement("div");d.className="cp-fd cp-gl"+(bad?" bad":mine?" good":"");d.textContent=e.s;d._t=now_;f.appendChild(d);if(bad)vib&&vib([30,40,30])}
 const items=[...f.children];items.slice(0,Math.max(0,items.length-4)).forEach(x=>x.remove());items.forEach(x=>{if(now_-x._t>6500)x.remove()})}
function banner(){const b=$("#cpBan");if(!b)return;const p=G.pl[V.me];const left=V.spawnEnd?Math.max(0,V.spawnEnd-performance.now()):0;
 let h;if(!V.spawnEnd)h=`<b>BAŞLANGIÇ YERİNİ SEÇ</b><small>${p.spawn>=0||V.myPick!=null?(V.room?"Arkadaşların bekleniyor…":"Hazır"):"Haritada bir yere dokun. İstersen sonra değiştirebilirsin."}</small>`;
 else{const s=Math.ceil(left/1000),fr=left/5000;h=`<div class="cp-ring"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="5"/><circle cx="32" cy="32" r="28" fill="none" stroke="#ffd166" stroke-width="5" stroke-linecap="round" stroke-dasharray="${(176*fr).toFixed(1)} 176"/></svg>${s}</div><b>YERLEŞİYOR</b><small>${p.spawn>=0||V.myPick!=null?"Yerini hâlâ değiştirebilirsin":"Bir yer seç, yoksa rastgele yerleşirsin"}</small>`}
 if(b._h!==h){b.innerHTML=h;b._h=h}}
function quitAsk(){const g=G;if(!g||V.mode==="spawn"&&!V.room||g.over||!g.pl[V.me].alive)return menu();
 dialog("Savaştan çık?",V.room&&V.host?"Kurucu sensin; çıkarsan oda kapanır.":"Ülken haritada kalır ama sen yönetemezsin.",[{label:"Çık",cls:"danger",fn:()=>menu()},{label:"Devam et",cls:"sec"}])}
function help(){sheet("cphelp","Cephe nasıl oynanır",`<div class="cp-help">
 <p><b>Başla:</b> haritada bir yere dokun, 5 saniye sonra savaş başlar. İlk 25 saniye barış: yalnızca boş topraklara yayılabilirsin.</p>
 <p><b>Saldır:</b> haritada bir yere dokun. Boş toprağa, komşu ülkeye ya da denizin karşısına (gemiyle) asker gider. Kaç asker gideceğini alttaki yüzde seçer. Saldırılar panelinden geri çekebilirsin.</p>
 <p><b>Arazi:</b> Ova kolay; yayla, çöl ve tundra biraz zor; dağ ve buzul en zor ve en yavaş.</p>
 <p><b>Asker gücü (1-10):</b> her seviye askerin gücünü 10 artırır. 2. seviyede 15.000 asker, 1. seviyede 30.000 askere denktir.</p>
 <p><b>Yapılar:</b> Şehir asker sınırını ve nüfusu artırır, Fabrika ve Liman altın getirir, Savunma çevresini almayı iki kat zorlaştırır, Füze deposu bomba atar, SAM yakına gelen bombaları vurur.</p>
 <p><b>Bombalar:</b> Atom, Nükleer ve Hidrojen. Her atışta fiyat artar. Vurulan yer boşalır, yapılar yıkılır.</p>
 <p><b>Kazanmak:</b> dünyanın %80'ini al ya da son ülke sen kal. 30 dakika dolarsa en büyük kazanır.</p>
 <p><b>Kısayollar:</b> 1-0 yapılar ve bombalar, Q/E yüzde, Esc vazgeç, boşluk konumuna git. Bilgisayarda bir ülkenin üstüne gelince, telefonda basılı tutunca bilgisi çıkar.</p></div>`,{tall:true})}
function stat(g,p){return`<div class="cp-stats"><div><b>${pf(p.cells/g.m.land)}</b><small>Toprak</small></div><div><b>${nf(p.peak)}</b><small>En çok asker</small></div><div><b>${p.kills}</b><small>Silinen ülke</small></div></div>`}
function showOver(){V.overShown=true;const g=G,p=g.pl[V.me],w=g.pl[g.over.w];const win=w&&w.i===V.me;const el=document.createElement("div");el.className="cp-over";
 el.innerHTML=`<div class="cp-gl"><h2>${win?"Zafer!":"Savaş bitti"}</h2><p>${win?(g.over.why==="pct"?"Dünyanın %80'ini aldın.":g.over.why==="sure"?"Süre doldu, en büyük ülke sensin.":"Ayakta kalan son ülke sensin."):`${esc(w?w.name:"")} kazandı.`}</p>${stat(g,p)}
 ${!V.room?`<button class="cp-btn p" data-again>${svg("play")}Yeniden oyna</button>`:""}<button class="cp-btn s" data-menu>Ana menü</button></div>`;
 V.root.appendChild(el);el.onclick=e=>{if(e.target.closest("[data-again]"))startSolo();else if(e.target.closest("[data-menu]"))menu()};if(win)vib&&vib([40,60,40,60,80])}
function showDead(){const g=G,p=g.pl[V.me];const el=document.createElement("div");el.className="cp-over";el.innerHTML=`<div class="cp-gl"><h2>Yenildin</h2><p>Toprakların elinden gitti. Savaşı izlemeye devam edebilirsin.</p>${stat(g,p)}<button class="cp-btn p" data-watch>İzle</button><button class="cp-btn s" data-menu>Ana menü</button></div>`;
 V.root.appendChild(el);el.onclick=e=>{if(e.target.closest("[data-watch]"))el.remove();else if(e.target.closest("[data-menu]"))menu()}}

/* ---------- ipucu (üstüne gelince / basılı tutunca) ---------- */
function tip(c,sx,sy){const t=$("#cpTt");if(!t)return;if(c<0||!G){t.hidden=true;return}const g=G,m=g.m,o=g.owner[c],k=m.kind[c];let h;
 if(V.mode==="spawn"){if(!k){t.hidden=true;return}const n=nearCount(g,c);h=`<div class="t">${KIND[k]}</div><div class="k"><span>Zorluk</span><b>×${String(KMUL[k]).replace(".",",")}</b></div><div class="k"><span>Yakındaki oyuncu</span><b>${n}</b></div>`}
 else if(o===-2){t.hidden=true;return}
 else if(o===-1)h=`<div class="t">Boş toprak</div><div class="k"><span>Arazi</span><b>${KIND[k]} ×${String(KMUL[k]).replace(".",",")}</b></div><div class="c">Dokun: ${nf(g.pl[V.me].troops*V.ratio)} askerle yayıl</div>`;
 else{const q=g.pl[o],mine=o===V.me,war=g.att.some(a=>(a.o===o&&a.t===V.me)||(a.o===V.me&&a.t===o));
  h=`<div class="t"><i style="${q.flag?`background-image:url(${flagURL(q.flag)})`:`background:${q.hex}`}"></i>${esc(q.name)}</div>${mine?"":`<div class="w${war?"":" ok"}">${war?"SAVAŞTA":g.peace>0?"BARIŞ":"SINIRDA"}</div>`}
  <div class="k"><span>Asker</span><b>${nf(q.troops)}</b></div><div class="k"><span>Toprak</span><b>${pf(q.cells/m.land,2)}</b></div><div class="k"><span>Güç</span><b>${q.lvl}/10</b></div><div class="k"><span>Arazi</span><b>${KIND[k]}</b></div>
  ${mine?"":`<div class="c">Dokun: ${nf(g.pl[V.me].troops*V.ratio)} askerle saldır</div>`}`}
 t.innerHTML=h;t.hidden=false;const W=V.cw,H=V.ch,tw=t.offsetWidth,th=t.offsetHeight;let x=sx+14,y=sy+14;if(x+tw>W-8)x=sx-tw-14;if(y+th>H-8)y=sy-th-14;t.style.left=clamp(x,8,W-tw-8)+"px";t.style.top=clamp(y,8,H-th-8)+"px";clearTimeout(V.ttT);V.ttT=setTimeout(()=>{if(!V.hoverC)t.hidden=true},V.hov?60000:2600)}

/* ---------- çizim ---------- */
function resize(){if(!V||!V.cv)return;const r=V.root.getBoundingClientRect();const dpr=Math.min(window.devicePixelRatio||1,2);V.dpr=dpr;V.cw=r.width;V.ch=r.height;V.cv.width=Math.round(r.width*dpr);V.cv.height=Math.round(r.height*dpr)}
const fitScale=()=>Math.min(V.cw/G.m.W,V.ch/G.m.H);
function clampView(){const m=G.m,w=m.W*V.s,h=m.H*V.s;V.ox=clamp(V.ox,V.cw/2-w,V.cw/2);V.oy=clamp(V.oy,V.ch/2-h,V.ch/2)}
function fitView(keep){if(!V||!G||!V.cw)return;if(keep&&V.s){clampView();return}const m=G.m,s=fitScale();V.s=s;V.ox=(V.cw-m.W*s)/2;V.oy=(V.ch-m.H*s)/2}
function focusMe(mul){const p=G&&G.pl[V.me];if(!p||p.lx<0)return;const W=G.m.W;let x=p.lx,y=p.ly;if(p.lr<=0&&p.spawn>=0){x=p.spawn%W;y=(p.spawn/W)|0}
 if(mul)V.s=clamp(fitScale()*mul,fitScale(),48);V.ox=V.cw/2-(x+.5)*V.s;V.oy=V.ch*.42-(y+.5)*V.s;clampView()}
function ensureOv(){const g=G,m=g.m;if(V.ov&&V.ovG===g)return;V.ov=document.createElement("canvas");V.ov.width=m.W;V.ov.height=m.H;V.ovx=V.ov.getContext("2d");V.ovd=V.ovx.createImageData(m.W,m.H);V.ovG=g;
 for(let i=0;i<m.N;i++)if(g.owner[i]>=0)paint(i);V.ovx.putImageData(V.ovd,0,0);g.dirt.length=0;V.labD=1}
function paint(c){const g=G,ow=g.owner,o=ow[c],d=V.ovd.data,k=c*4;if(o<0){d[k+3]=0;return}const P=g.pl[o],W=g.m.W,x=c%W;
 const b=(x>0&&ow[c-1]!==o)||(x<W-1&&ow[c+1]!==o)||(c>=W&&ow[c-W]!==o)||(c<g.m.N-W&&ow[c+W]!==o);const col=b?P.bc:P.fc;d[k]=col[0];d[k+1]=col[1];d[k+2]=col[2];d[k+3]=b?255:(o===V.me?170:150)}
function flushOv(){const g=G,D=g.dirt,W=g.m.W,H=g.m.H;if(D.length>150000){for(let i=0;i<g.m.N;i++)paint(i);V.ovx.putImageData(V.ovd,0,0);D.length=0;return}
 let x0=W,y0=H,x1=-1,y1=-1;for(const c of D){const x=c%W,y=(c/W)|0;paint(c);if(x>0)paint(c-1);if(x<W-1)paint(c+1);if(y>0)paint(c-W);if(y<H-1)paint(c+W);if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
 D.length=0;x0=Math.max(0,x0-1);y0=Math.max(0,y0-1);x1=Math.min(W-1,x1+1);y1=Math.min(H-1,y1+1);V.ovx.putImageData(V.ovd,0,0,x0,y0,x1-x0+1,y1-y0+1)}
function loop(){if(!V)return;cancelAnimationFrame(V.raf);V.pings=V.pings||[];V.seenBoom=V.seenBoom||new Set();let labT=0,hT=0,dT=0;
 const f=ts=>{if(!V||!G||!V.cv||!V.cv.isConnected)return;V.raf=requestAnimationFrame(f);
  if(V.mode==="spawn"){if(V.room&&V.host)hostSpawnTick();if(V.spawnEnd&&performance.now()>=V.spawnEnd&&(!V.room||V.host))beginWar()}
  ensureOv();if(G.dirt.length){flushOv();V.labD=1}
  if(V.labD&&ts-labT>500){labT=ts;V.labD=0;labels(G)}
  if(ts-dT>=30){dT=ts;draw(ts)}
  if(ts-hT>250){hT=ts;hud()}};V.raf=requestAnimationFrame(f)}
const ICP={};function icon(x,k,cx,cy,sz){let p=ICP[k];if(!p){p=ICP[k]=new Path2D((IC[k]||"").match(/d="([^"]+)"/g).map(s=>s.slice(3,-1)).join(" "))}x.save();x.translate(cx-sz/2,cy-sz/2);x.scale(sz/24,sz/24);x.strokeStyle="#fff";x.lineWidth=2.4;x.lineCap="round";x.lineJoin="round";x.stroke(p);x.restore()}
function rr(x,a,b,w,h,r){x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()}
function pill(x,t,cx,cy,bg,fs=11){x.font=`800 ${fs}px ${V.mono||"monospace"}`;const w=x.measureText(t).width+fs*1.1,h=fs*1.7;rr(x,cx-w/2,cy-h/2,w,h,h/2);x.fillStyle=bg;x.fill();x.strokeStyle="rgba(255,255,255,.85)";x.lineWidth=1.5;x.stroke();x.fillStyle="#fff";x.textAlign="center";x.textBaseline="middle";x.fillText(t,cx,cy+.5)}
function draw(ts){const g=G,m=g.m,x=V.cx,s=V.s,W=m.W;x.setTransform(V.dpr,0,0,V.dpr,0,0);
 let jx=0,jy=0;if(V.shake>.4){jx=(Math.random()-.5)*V.shake;jy=(Math.random()-.5)*V.shake;V.shake*=.88}else V.shake=0;
 x.fillStyle="rgb(46,120,204)";x.fillRect(0,0,V.cw,V.ch);
 x.save();x.translate(V.ox+jx,V.oy+jy);x.scale(s,s);x.imageSmoothingEnabled=false;x.drawImage(baseCanvas(m),0,0);x.drawImage(V.ov,0,0);x.restore();
 const ox=V.ox+jx,oy=V.oy+jy,X=c=>ox+(c%W+.5)*s,Y=c=>oy+(((c/W)|0)+.5)*s,now_=performance.now();
 const font=V.font||(V.font=(getComputedStyle(V.root).getPropertyValue("--f-body")||"sans-serif").trim()),mono=V.mono||(V.mono=(getComputedStyle(V.root).getPropertyValue("--f-mono")||"monospace").trim());
 /* başlangıç yerleri */
 if(V.mode==="spawn"){for(const p of g.pl){if(p.spawn<0)continue;const r=Math.max(9,(p.bot==="t"?3:4.5)*s);x.beginPath();x.arc(X(p.spawn),Y(p.spawn),r,0,7);
   if(p.i===V.me){x.lineWidth=3;x.strokeStyle="#ffd166";x.stroke();x.beginPath();x.arc(X(p.spawn),Y(p.spawn),r+6+4*Math.sin(now_/200),0,7);x.lineWidth=2;x.strokeStyle="rgba(255,209,102,.6)";x.stroke()}else{x.lineWidth=1.5;x.strokeStyle="rgba(255,255,255,.75)";x.stroke()}}
  if(V.myPick!=null&&G.pl[V.me].spawn<0){x.beginPath();x.arc(X(V.myPick),Y(V.myPick),Math.max(10,4.5*s)+3*Math.sin(now_/150),0,7);x.lineWidth=3;x.strokeStyle="#ffd166";x.stroke()}}
 /* yapılar */
 if(s>=1.3){const sz=clamp(s*3.2,10,28);for(const b of g.bld){const cx=X(b.c),cy=Y(b.c);if(cx<-30||cy<-30||cx>V.cw+30||cy>V.ch+30)continue;const p=g.pl[b.o];x.beginPath();x.arc(cx,cy,sz/2+2,0,7);x.fillStyle=p?p.bh:"#555";x.fill();x.lineWidth=1.5;x.strokeStyle="#fff";x.stroke();icon(x,b.k,cx,cy,sz*.68)}}
 /* adlar ve asker sayıları */
 x.textAlign="center";x.textBaseline="middle";x.lineJoin="round";
 const LB=[];for(const p of g.pl)if((p.alive||p.cells)&&p.lr>0&&p.lx>=0)LB.push(p);LB.sort((a,b)=>(b.i===V.me)-(a.i===V.me)||b.lr-a.lr);const used=[];
 for(const p of LB){const cx=ox+(p.lx+.5)*s,cy=oy+(p.ly+.5)*s;if(cx<-200||cy<-60||cx>V.cw+200||cy>V.ch+60)continue;let fs=Math.min(p.lr*s*.5,40);
  const nm=p.name,tr=nf(p.troops),fl=!!p.flag;x.font=`800 ${fs}px ${font}`;const tw=x.measureText(nm).width*(fl?1.3:1),maxw=p.lr*s*2.1;if(tw>maxw)fs*=maxw/tw;if(fs<(p.i===V.me?6:8))continue;
  x.font=`800 ${fs}px ${font}`;const w2=x.measureText(nm).width,fw=fl&&fs>=10?fs*1.35:0,bw=w2+fw+fs*.2,box=[cx-bw/2,cy-fs*.95,cx+bw/2,cy+fs*1.05];
  if(used.some(u=>box[0]<u[2]&&box[2]>u[0]&&box[1]<u[3]&&box[3]>u[1]))continue;used.push(box);
  const nx=cx+fw/2+(fw?fs*.1:0);x.strokeStyle="rgba(255,255,255,.72)";x.lineWidth=Math.max(2,fs*.2);x.fillStyle="#132033";x.strokeText(nm,nx,cy-fs*.38);x.fillText(nm,nx,cy-fs*.38);
  if(fw)x.drawImage(flagCanvas(p.flag,48,32),nx-w2/2-fw-fs*.1,cy-fs*.38-fs*.45,fw,fs*.9);
  const f2=fs*.78;x.font=`700 ${f2}px ${mono}`;x.lineWidth=Math.max(2,f2*.2);x.strokeText(tr,cx,cy+fs*.55);x.fillStyle="#22324a";x.fillText(tr,cx,cy+fs*.55)}
 /* saldırı cepheleri */
 for(const a of g.att){if(a.fx==null||(a.o!==V.me&&a.t!==V.me))continue;const cx=ox+(a.fx+.5)*s,cy=oy+(a.fy+.5)*s-Math.max(10,s*2);pill(x,nf(a.n),cx,cy,a.o===V.me?g.pl[V.me].hex:"#e03131",11)}
 /* gemiler */
 for(const b of g.boats){const c=b.path?b.path[Math.min(b.path.length-1,Math.floor(b.pi))]:b.at;if(c==null)continue;const cx=X(c),cy=Y(c),z=clamp(s*1.6,6,14),p=g.pl[b.o];
  x.beginPath();x.moveTo(cx-z,cy-z*.2);x.lineTo(cx+z,cy-z*.2);x.lineTo(cx+z*.6,cy+z*.5);x.lineTo(cx-z*.6,cy+z*.5);x.closePath();x.fillStyle=p.hex;x.fill();x.lineWidth=1.5;x.strokeStyle="#fff";x.stroke();
  x.beginPath();x.moveTo(cx,cy-z*.2);x.lineTo(cx,cy-z*1.4);x.lineTo(cx+z*.7,cy-z*.5);x.closePath();x.fillStyle="#fff";x.fill();
  if(b.o===V.me||s>2)pill(x,nf(b.n),cx,cy-z*2.2,"rgba(16,24,38,.85)",9)}
 /* füzeler */
 const solo=!V.room||V.host;for(const ms of g.mis){const f=clamp(solo?ms.f+(now_-(V.stepAt||now_))/ms.dur:(now_-ms.rt)/ms.dur,0,1);const ax=X(ms.from),ay=Y(ms.from),bx=X(ms.to),by=Y(ms.to),d=Math.hypot(bx-ax,by-ay),h=d*.32;
  const pt=t=>[ax+(bx-ax)*t,ay+(by-ay)*t-Math.sin(Math.PI*t)*h];const R=NUK[ms.k].r*s;
  x.setLineDash([6,5]);x.beginPath();x.arc(bx,by,Math.max(8,R),0,7);x.lineWidth=2;x.strokeStyle=`rgba(255,60,60,${.5+.4*Math.sin(now_/120)})`;x.stroke();x.setLineDash([]);
  x.beginPath();for(let i=0;i<=16;i++){const [px,py]=pt(f*i/16);i?x.lineTo(px,py):x.moveTo(px,py)}x.lineWidth=2.5;x.strokeStyle="rgba(255,255,255,.8)";x.stroke();
  const [hx,hy]=pt(f);x.beginPath();x.arc(hx,hy,4.5,0,7);x.fillStyle="#ff6b35";x.fill();x.lineWidth=1.5;x.strokeStyle="#fff";x.stroke()}
 /* patlamalar */
 for(const b of g.booms){const age=b.rt!=null?now_-b.rt:g.t-b.t+(now_-(V.stepAt||now_));const key=b.c+":"+Math.round(b.t/1000);if(!V.seenBoom.has(key)){V.seenBoom.add(key);if(!b.air&&!(typeof kbReduce==="function"&&kbReduce()))V.shake=b.r>12?26:16;vib&&vib(b.air?20:[60,30,90])}
  const cx=X(b.c),cy=Y(b.c),R=Math.max(10,(b.air?3:b.r)*s);if(b.air){const k=clamp(age/900,0,1);x.beginPath();x.arc(cx,cy-R*2,R*(.5+k),0,7);x.fillStyle=`rgba(255,255,255,${.8*(1-k)})`;x.fill();continue}
  if(age<500){x.beginPath();x.arc(cx,cy,R*1.8,0,7);x.fillStyle=`rgba(255,255,240,${.9*(1-age/500)})`;x.fill()}
  const k=clamp(age/2800,0,1);const gr=x.createRadialGradient(cx,cy,0,cx,cy,R*(.7+k*.5));gr.addColorStop(0,`rgba(255,240,180,${.95*(1-k)})`);gr.addColorStop(.45,`rgba(255,120,40,${.85*(1-k)})`);gr.addColorStop(1,"rgba(120,30,10,0)");x.fillStyle=gr;x.beginPath();x.arc(cx,cy,R*(.7+k*.5),0,7);x.fill();
  if(age<1400){const q=age/1400;x.beginPath();x.arc(cx,cy,R*(.4+q*1.6),0,7);x.lineWidth=3*(1-q)+1;x.strokeStyle=`rgba(255,255,255,${.8*(1-q)})`;x.stroke()}}
 /* dokunma halkaları */
 V.pings=V.pings.filter(p=>now_-p.t<450);for(const p of V.pings){const q=(now_-p.t)/450;x.beginPath();x.arc(X(p.c),Y(p.c),6+q*22,0,7);x.lineWidth=2.5;x.strokeStyle=`rgba(255,209,102,${1-q})`;x.stroke()}}
function wireInput(){const cv=V.cv,pts=new Map();let pinch=null,down=null,moved=0,lp=0;
 const cell=(px,py)=>{const m=G.m,x=Math.floor((px-V.ox)/V.s),y=Math.floor((py-V.oy)/V.s);return x<0||y<0||x>=m.W||y>=m.H?-1:y*m.W+x};
 const rel=e=>{const r=cv.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]};
 cv.onpointerdown=e=>{try{cv.setPointerCapture(e.pointerId)}catch{}const[x,y]=rel(e);pts.set(e.pointerId,{x,y});
  if(pts.size===1){down={x,y,ox:V.ox,oy:V.oy};moved=0;clearTimeout(lp);if(e.pointerType!=="mouse")lp=setTimeout(()=>{if(down&&!moved){down.lp=1;V.hov=0;tip(cell(x,y),x,y);vib&&vib(10)}},450)}
  else if(pts.size===2){clearTimeout(lp);const[a,b]=[...pts.values()];pinch={d:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)),s:V.s,cx:(a.x+b.x)/2,cy:(a.y+b.y)/2,ox:V.ox,oy:V.oy};down=null}};
 cv.onpointermove=e=>{const[x,y]=rel(e);
  if(e.pointerType==="mouse"&&!pts.size){V.hov=1;V.hoverC=cell(x,y);tip(V.hoverC,x,y);return}
  if(!pts.has(e.pointerId))return;pts.set(e.pointerId,{x,y});
  if(pinch&&pts.size>=2){const[a,b]=[...pts.values()];const d=Math.hypot(a.x-b.x,a.y-b.y),ns=clamp(pinch.s*d/pinch.d,fitScale()*.8,48),cx=(a.x+b.x)/2,cy=(a.y+b.y)/2;V.ox=cx-(pinch.cx-pinch.ox)*ns/pinch.s;V.oy=cy-(pinch.cy-pinch.oy)*ns/pinch.s;V.s=ns;clampView();return}
  if(down){const dx=x-down.x,dy=y-down.y;if(!moved&&Math.hypot(dx,dy)>8){moved=1;clearTimeout(lp)}if(moved){V.ox=down.ox+dx;V.oy=down.oy+dy;clampView()}}};
 const up=e=>{const had=pts.has(e.pointerId);pts.delete(e.pointerId);clearTimeout(lp);if(!had)return;
  if(pinch){if(pts.size<2)pinch=null;if(pts.size===1){const[a]=[...pts.values()];down={x:a.x,y:a.y,ox:V.ox,oy:V.oy};moved=1}return}
  if(down&&!moved&&!down.lp&&e.type==="pointerup"){const[x,y]=rel(e);tapCell(cell(x,y),x,y)}down=null};
 cv.onpointerup=up;cv.onpointercancel=up;
 cv.onpointerleave=e=>{if(e.pointerType==="mouse"){V.hoverC=null;const t=$("#cpTt");if(t)t.hidden=true}};
 cv.onwheel=e=>{e.preventDefault();const[x,y]=rel(e),ns=clamp(V.s*Math.exp(-e.deltaY*.0015),fitScale()*.8,48);V.ox=x-(x-V.ox)*ns/V.s;V.oy=y-(y-V.oy)*ns/V.s;V.s=ns;clampView()};
 cv.oncontextmenu=e=>e.preventDefault()}

/* ---------- arkadaşla: oda ---------- */
const code5=()=>Array.from({length:5},()=>"ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[(Math.random()*32)|0]).join("");
const roomPath=c=>"games/cp-"+c,cmdPath=(c,u)=>"games/cp-"+c+"-"+u;
const meEntry=()=>({n:myName(),f:OPT.flag,at:now()});
async function createRoom(){if(!guard())return;const c=code5();const d={cp:1,host:S.uid,sc:OPT.sc,diff:OPT.diff,nb:OPT.nb,tb:OPT.tb,st:"lobby",oy:{[S.uid]:meEntry()},at:now(),up:now()};
 try{await DB.set(roomPath(c),d)}catch(e){return toast("Oda kurulamadı: "+(e.message||""))}enterRoom(c,true)}
function joinAsk(){const l=sheet("cpj","Odaya katıl",`<div class="form"><input class="cp-in" id="cpCode" maxlength="5" placeholder="KOD" autocomplete="off" style="color:var(--fg);border-color:var(--line)"><button class="btn block" id="cpJg">Katıl</button></div>`);const i=$("#cpCode",l);setTimeout(()=>i.focus(),50);
 $("#cpJg",l).onclick=()=>{const c=i.value.trim().toUpperCase();if(c.length!==5)return toast("5 harfli oda kodunu yaz.");closeLayer("cpj");CP.join(c)}}
CP.join=async function(c){if(!V)CP.open();c=String(c||"").toUpperCase();let d=null;try{d=await DB.get(roomPath(c))}catch{}if(!d||!d.cp)return toast("Böyle bir oda yok.");if(d.st!=="lobby"&&!(d.oy&&d.oy[S.uid]))return toast("Bu odada savaş başlamış.");
 try{await DB.update(roomPath(c),{oy:{[S.uid]:d.oy&&d.oy[S.uid]||meEntry()},up:now()})}catch(e){return toast("Odaya girilemedi.")}if(V.room&&V.room!==c)leaveRoom();enterRoom(c,d.host===S.uid)};
function enterRoom(c,host){stop();G=null;Object.assign(V,{room:c,host,mode:"lobby",cmdSeq:0,cmdQ:[],kn:0,lastSeq:{},myPick:null,spawnEnd:0,overShown:false,deadShown:false,feedSeen:0,prep:false});if(V.roomUn)V.roomUn();V.roomUn=DB.watchDoc(roomPath(c),d=>onRoom(d))}
function lobby(d){const r=V.root,sc=SC.find(s=>s.id===d.sc)||SC[0],oy=Object.entries(d.oy||{}).filter(([,v])=>v).sort((a,b)=>(a[1].at||0)-(b[1].at||0));
 r.innerHTML=`<div class="cp-menu"><div class="top"><span class="cp-pill cp-gl">${svg("users")}SAVAŞ ODASI</span><button class="cp-rb" data-cpleave aria-label="Odadan çık">${I("close")}</button></div>
 <h1 style="font-size:2.2rem">${esc(sc.n)}</h1><p class="sub">${d.nb?`${d.nb} ülke botu (${esc(DIFF[d.diff].n)})`:"Botsuz"} · kabile ${["yok","az","çok"][d.tb||0]}</p>
 <div class="cp-room cp-gl"><div class="cp-sec" style="margin:0">Oda kodu</div><div class="cp-code">${esc(V.room)}</div><small style="color:#c9d6e8">Arkadaşın Cephe › Odaya katıl'a bu kodu yazsın ya da aşağıdan çağır.</small></div>
 <div class="cp-sec">Oyuncular (${oy.length})</div><div class="cp-room cp-gl">${oy.map(([u,v])=>`<div class="cp-pl"><img src="${flagURL(v.f||"kadraj")}" alt=""><b>${esc(v.n||"?")}</b>${u===d.host?'<small style="color:#ffd166">kurucu</small>':""}</div>`).join("")}</div>
 <div class="cp-go">${V.host?`<button class="cp-btn p" data-cpstart>${svg("play")}Savaşı başlat</button>`:`<button class="cp-btn s" disabled>Kurucunun başlatması bekleniyor…</button>`}<button class="cp-btn s" data-cpinv>${svg("users")}Arkadaşını çağır</button></div></div>`;
 r.onclick=e=>{const t=e.target.closest("button");if(!t)return;if(t.dataset.cpleave!==undefined){leaveRoom();menu()}if(t.dataset.cpstart!==undefined)hostStart();if(t.dataset.cpinv!==undefined)invite()}}
function invite(){const ppl=humans().slice(0,60);const l=sheet("cpinv","Arkadaşını çağır",ppl.length?`<div class="box">${ppl.map(u=>`<button class="opt" data-cpu="${esc(u)}">${avatar(u,36,{click:false,ring:false})}<span>${esc(P(u).name)}<small class="muted" style="display:block">@${esc(P(u).username)}</small></span></button>`).join("")}</div>`:`<p class="muted">Henüz arkadaşın yok. Kodu kendin paylaş: <b>${esc(V.room)}</b></p>`,{tall:true});
 $$("[data-cpu]",l).forEach(b=>b.onclick=async()=>{b.disabled=true;const ok=await sendMessage("u:"+b.dataset.cpu,{text:`Cephe'de savaşa çağırıyorum! Oda kodu: ${V.room}`,cephe:V.room});toast(ok?"Çağrı gönderildi":"Gönderilemedi")})}
async function hostStart(){try{await DB.update(roomPath(V.room),{st:"spawn",seed:(Math.random()*1e9)|0,up:now()})}catch{toast("Başlatılamadı.")}}
async function onRoom(d){if(!V||!V.room)return;if(!d){toast("Oda kapandı.");V.room=null;return menu()}
 if(d.st==="lobby"){V.mode="lobby";return lobby(d)}
 if(d.st==="over"){toast(d.why||"Oda kapandı.");V.room=null;return menu()}
 if(V.prep){V.lastDoc=d;return}
 if(!G){V.prep=true;let sc,m;try{({sc,m}=await prepare(d.sc,d.seed))}catch{V.prep=false;return toast("Harita indirilemedi.")}if(!V||!V.room){return}
  const g=newGame(m,{sc:d.sc});G=g;const oy=Object.entries(d.oy||{}).filter(([,v])=>v).sort((a,b)=>(a[1].at||0)-(b[1].at||0));
  setupPlayers(g,sc,oy.map(([u,v])=>({uid:u,name:v.n||"?",flag:v.f||null})),d.nb,d.diff,d.tb||0);V.me=g.pl.findIndex(p=>p.uid===S.uid);
  if(V.host){g.chg=new Set();spawnBots(g);V.cmdUn=oy.filter(([u])=>u!==S.uid).map(([u])=>DB.watchDoc(cmdPath(V.room,u),c=>hostCmds(u,c)))}
  V.prep=false;spawnPhase();if(V.host)roomSnap(true);if(V.lastDoc){d=V.lastDoc;V.lastDoc=null}}
 if(V.host)return;
 if(d.kn&&d.kf&&d.kn!==V.kn){V.kn=d.kn;rleApply(G,d.kf)}if(V.kn)decD(G,d.d);if(d.s)applySnap(G,d.s);
 if(d.se&&!V.spawnEnd&&V.mode==="spawn")V.spawnEnd=performance.now()+Math.max(0,d.se-now());
 if(d.st!=="spawn"&&V.mode==="spawn"){V.mode="play";ui();focusMe(2.2)}}
function hostSpawnTick(){const t=performance.now();if(t-(V.snapT||0)>1000){V.snapT=t;roomSnap()}if(V.spawnEnd)return;
 const hum=G.pl.filter(p=>p.uid);if(hum.every(p=>p.spawn>=0)||t-V.spawnT0>30000){V.spawnEnd=t+5000;DB.update(roomPath(V.room),{se:now()+5000}).catch(()=>{})}}
function hostCmds(u,c){if(!c||!c.q||!G)return;let q=[];try{q=JSON.parse(c.q)}catch{}const o=G.pl.findIndex(p=>p.uid===u);if(o<0)return;
 for(const k of q){if(k.s<=(V.lastSeq[u]||0))continue;V.lastSeq[u]=k.s;if(k.a==="spawn"){if(V.mode==="spawn")spawnAt(G,G.pl[o],k.c);continue}applyCmd(G,o,k)}}
function sendCmd(c){if(c.a==="spawn"&&V.mode!=="spawn")return;V.cmdQ.push({...c,s:++V.cmdSeq});V.cmdQ=V.cmdQ.slice(-30);DB.set(cmdPath(V.room,S.uid),{q:JSON.stringify(V.cmdQ),up:now()}).catch(()=>{});vib&&vib(10);if(c.a==="bld"||c.a==="nuk")setTool(null)}
function roomSnap(full){if(!V.room||!G||!V.host)return;const g=G;const u={st:g.over?"done":V.mode==="spawn"?"spawn":"play",s:snapOf(g),up:now()};
 if(full||!V.kn||performance.now()-V.kfT>10000||g.chg.size>9000){V.kn=(V.kn||0)+1;V.kfT=performance.now();u.kf=rleOf(g.owner);u.kn=V.kn;g.chg.clear();u.d=""}else u.d=encD(g);
 DB.update(roomPath(V.room),u).catch(e=>console.warn("cephe",e))}
function leaveRoom(){const c=V&&V.room;if(!c)return;V.room=null;try{V.roomUn&&V.roomUn()}catch{}V.roomUn=null;(V.cmdUn||[]).forEach(f=>{try{f()}catch{}});V.cmdUn=null;
 if(V.host)DB.update(roomPath(c),{st:"over",why:"Kurucu odadan çıktı, savaş bitti.",up:now()}).catch(()=>{});else DB.update(roomPath(c),{oy:{[S.uid]:null},up:now()}).catch(()=>{});
 DB.del(cmdPath(c,S.uid)).catch(()=>{})}
CP._test={SC,FL,MAPDEF,loadMap,newGame,addPlayer,setupPlayers,spawnBots,spawnAt,step,attack,attackAt,applyCmd,build,launch,lvlUp,snapOf,applySnap,rleOf,rleApply,encD,decD,labels,botThink,cap,power,troopRate,goldRate,kindOf,roomSnap:f=>roomSnap(f),G:()=>G,V:()=>V,beginWar:()=>beginWar(),setRng:s=>{rng=seeded(s)}};
})();
