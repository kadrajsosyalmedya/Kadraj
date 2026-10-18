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
 {id:"kurtulus",n:"Kurtuluş Savaşı (1919)",map:"anadolu",d:"Anadolu'da bağımsızlık cephesi",tr:10,g:{tr:["Turkey","N. Cyprus"],gb:["Iraq","Cyprus"],fr:["Syria"],su:["Russia","Georgia","Armenia","Azerbaijan"]},b:[["Türkiye","tr",32.8,39.9],["Yunanistan","gr",27.1,38.4],["Britanya","gb",29,41],["Fransa","fr",35.3,37],["İtalya","it",30.7,36.9],["Sovyet Rusya","su",44.8,41.7]]},
 {id:"kore",n:"Kore Savaşı (1950)",map:"kore",d:"Yarımadada kuzey ile güney",tr:6,g:{kp:["North Korea"],kr:["South Korea"],cn:["China"],jp:["Japan"]},b:[["Kuzey Kore","kp",126.5,39.8],["Güney Kore","kr",127.6,36.4],["Çin","cn",124.6,42.3],["Birleşmiş Milletler","un",129.1,35.3],["Japonya","jp",130.6,33.4]]},
 {id:"ww1",n:"1. Dünya Savaşı (1914)",map:"avrupa",d:"İmparatorluklar çarpışıyor",tr:12,g:{osm:["Turkey","Syria","Iraq","Lebanon","Israel","Palestine","Jordan","N. Cyprus"],dei:["Germany","Poland"],ah:["Austria","Hungary","Czechia","Slovakia","Slovenia","Croatia","Bosnia and Herz."],ru:["Russia","Ukraine","Belarus","Finland","Estonia","Latvia","Lithuania","Moldova","Georgia","Armenia","Azerbaijan","Kazakhstan"],fr:["France","Algeria","Tunisia","Morocco"],gb:["United Kingdom","Ireland","Cyprus"],it:["Italy"],rs:["Serbia","Montenegro","Kosovo","Macedonia"],bg:["Bulgaria"],ro:["Romania"]},b:[["Osmanlı","osm",32.8,39.9],["Alman İmparatorluğu","dei",13.4,52.5],["Avusturya-Macaristan","ah",16.4,48.2],["Rus İmparatorluğu","ru",37.6,55.7],["Fransa","fr",2.3,48.8],["Britanya","gb",-1.5,52.5],["İtalya","it",12.5,41.9],["Sırbistan","rs",20.5,44.8],["Bulgaristan","bg",23.3,42.7],["Romanya","ro",26.1,44.4]]},
 {id:"ww2",n:"2. Dünya Savaşı (1939)",map:"avrasya",d:"Avrupa'dan Pasifik'e cepheler",tr:20,g:{dei:["Germany","Austria","Czechia"],su:["Russia","Ukraine","Belarus","Kazakhstan","Uzbekistan","Turkmenistan","Kyrgyzstan","Tajikistan","Georgia","Armenia","Azerbaijan"],jp:["Japan","North Korea","South Korea","Taiwan"],gb:["United Kingdom","India","Pakistan","Bangladesh","Myanmar","Egypt","Sudan","Malaysia","Cyprus"],fr:["France","Algeria","Tunisia","Morocco","Syria","Lebanon","Vietnam","Laos","Cambodia"],it:["Italy","Libya","Albania","Ethiopia","Eritrea","Somalia"],cn:["China"],pl:["Poland"],tr:["Turkey"]},b:[["Almanya","dei",13.4,52.5],["Sovyetler Birliği","su",37.6,55.7],["Japonya","jp",139.7,35.7],["Britanya","gb",-1.5,52.5],["Fransa","fr",2.3,48.8],["İtalya","it",12.5,41.9],["Çin","cn",106.5,29.5],["Polonya","pl",21,52.2],["Türkiye","tr",32.8,39.9]]}
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
const tri=(x,w,h,c)=>{x.fillStyle=c;x.beginPath();x.moveTo(0,0);x.lineTo(w*.42,h/2);x.lineTo(0,h);x.closePath();x.fill()};
const fill=(x,w,h,c)=>{x.fillStyle=c;x.fillRect(0,0,w,h)};
Object.assign(FL,{
 nl:["Hollanda",(x,w,h)=>bands(x,w,h,["#AE1C28","#fff","#21468B"])],be:["Belçika",(x,w,h)=>bands(x,w,h,["#000","#FAE042","#ED2939"],1)],at:["Avusturya",(x,w,h)=>bands(x,w,h,["#ED2939","#fff","#ED2939"])],
 hu:["Macaristan",(x,w,h)=>bands(x,w,h,["#CD2A3E","#fff","#436F4D"])],ie:["İrlanda",(x,w,h)=>bands(x,w,h,["#169B62","#fff","#FF883E"],1)],ee:["Estonya",(x,w,h)=>bands(x,w,h,["#0072CE","#000","#fff"])],
 lt:["Litvanya",(x,w,h)=>bands(x,w,h,["#FDB913","#006A44","#C1272D"])],lv:["Letonya",(x,w,h)=>bands(x,w,h,["#9E3039","#9E3039","#fff","#9E3039","#9E3039"])],
 ye:["Yemen",(x,w,h)=>bands(x,w,h,["#CE1126","#fff","#000"])],sy:["Suriye",(x,w,h)=>{bands(x,w,h,["#CE1126","#fff","#000"]);star(x,w*.38,h*.5,h*.1,"#007A3D");star(x,w*.62,h*.5,h*.1,"#007A3D")}],
 co:["Kolombiya",(x,w,h)=>bands(x,w,h,["#FCD116","#FCD116","#003893","#CE1126"])],pe:["Peru",(x,w,h)=>bands(x,w,h,["#D91023","#fff","#D91023"],1)],
 mx:["Meksika",(x,w,h)=>{bands(x,w,h,["#006847","#fff","#CE1126"],1);circ(x,w/2,h/2,h*.12,"#8C5A2B")}],
 cl:["Şili",(x,w,h)=>{fill(x,w,h,"#D52B1E");x.fillStyle="#fff";x.fillRect(0,0,w,h/2);x.fillStyle="#0039A6";x.fillRect(0,0,h/2,h/2);star(x,h/4,h/4,h*.13,"#fff")}],
 td:["Çad",(x,w,h)=>bands(x,w,h,["#002664","#FECB00","#C60C30"],1)],ml:["Mali",(x,w,h)=>bands(x,w,h,["#14B53A","#FCD116","#CE1126"],1)],gn:["Gine",(x,w,h)=>bands(x,w,h,["#CE1126","#FCD116","#009460"],1)],
 ci:["Fildişi Sahili",(x,w,h)=>bands(x,w,h,["#F77F00","#fff","#009E60"],1)],ga:["Gabon",(x,w,h)=>bands(x,w,h,["#009E60","#FCD116","#3A75C4"])],am:["Ermenistan",(x,w,h)=>bands(x,w,h,["#D90012","#0033A0","#F2A800"])],
 az:["Azerbaycan",(x,w,h)=>bands(x,w,h,["#0092BC","#E4002B","#00AF66"])],ge:["Gürcistan",(x,w,h)=>{fill(x,w,h,"#fff");x.fillStyle="#FF0000";x.fillRect(w*.44,0,w*.12,h);x.fillRect(0,h*.41,w,h*.18)}],
 fi:["Finlandiya",(x,w,h)=>nordic(x,w,h,"#fff","#003580")],dk:["Danimarka",(x,w,h)=>nordic(x,w,h,"#C8102E","#fff")],
 no:["Norveç",(x,w,h)=>{nordic(x,w,h,"#BA0C2F","#fff");x.fillStyle="#00205B";x.fillRect(w*.335,0,w*.06,h);x.fillRect(0,h*.46,w,h*.08)}],
 is:["İzlanda",(x,w,h)=>{nordic(x,w,h,"#02529C","#fff");x.fillStyle="#DC1E35";x.fillRect(w*.335,0,w*.06,h);x.fillRect(0,h*.46,w,h*.08)}],
 ch:["İsviçre",(x,w,h)=>{fill(x,w,h,"#DA291C");x.fillStyle="#fff";x.fillRect(w*.45,h*.2,w*.1,h*.6);x.fillRect(w*.32,h*.42,w*.36,h*.16)}],
 bd:["Bangladeş",(x,w,h)=>{fill(x,w,h,"#006A4E");circ(x,w*.45,h/2,h*.3,"#F42A41")}],th:["Tayland",(x,w,h)=>bands(x,w,h,["#A51931","#F4F5F8","#2D2A4A","#2D2A4A","#F4F5F8","#A51931"])],
 dz:["Cezayir",(x,w,h)=>{bands(x,w,h,["#006233","#fff"],1);circ(x,w/2,h/2,h*.22,"#D21034");circ(x,w/2+h*.07,h/2,h*.18,"#fff")}],ly:["Libya",(x,w,h)=>bands(x,w,h,["#E70013","#000","#000","#239E46"])],
 tn:["Tunus",(x,w,h)=>{fill(x,w,h,"#E70013");circ(x,w/2,h/2,h*.28,"#fff");circ(x,w/2,h/2,h*.17,"#E70013");circ(x,w/2+h*.05,h/2,h*.14,"#fff")}],ma:["Fas",(x,w,h)=>{fill(x,w,h,"#C1272D");star(x,w/2,h/2,h*.26,"#006233")}],
 af:["Afganistan",(x,w,h)=>bands(x,w,h,["#000","#D32011","#007A36"],1)],sd:["Sudan",(x,w,h)=>{bands(x,w,h,["#D21034","#fff","#000"]);tri(x,w,h,"#007229")}],
 et:["Etiyopya",(x,w,h)=>{bands(x,w,h,["#078930","#FCDD09","#DA121A"]);circ(x,w/2,h/2,h*.2,"#0F47AF")}],ph:["Filipinler",(x,w,h)=>{bands(x,w,h,["#0038A8","#CE1126"]);tri(x,w,h,"#fff")}],
 la:["Laos",(x,w,h)=>{bands(x,w,h,["#CE1126","#002868","#002868","#CE1126"]);circ(x,w/2,h/2,h*.18,"#fff")}],mm:["Myanmar",(x,w,h)=>{bands(x,w,h,["#FECB00","#34B233","#EA2839"]);star(x,w/2,h*.55,h*.3,"#fff")}],
 uz:["Özbekistan",(x,w,h)=>bands(x,w,h,["#0099B5","#fff","#1EB53A"])],tm:["Türkmenistan",(x,w,h)=>{fill(x,w,h,"#00843D");x.fillStyle="#C8102E";x.fillRect(w*.18,0,w*.14,h)}],
 kg:["Kırgızistan",(x,w,h)=>{fill(x,w,h,"#E8112D");circ(x,w/2,h/2,h*.26,"#FFEF00")}],tj:["Tacikistan",(x,w,h)=>bands(x,w,h,["#CC0000","#fff","#006600"])],
 by:["Belarus",(x,w,h)=>bands(x,w,h,["#C8313E","#C8313E","#4AA657"])],md:["Moldova",(x,w,h)=>bands(x,w,h,["#0046AE","#FFD200","#CC092F"],1)],
 cz:["Çekya",(x,w,h)=>{bands(x,w,h,["#fff","#D7141A"]);tri(x,w,h,"#11457E")}],sk:["Slovakya",(x,w,h)=>bands(x,w,h,["#fff","#0B4EA2","#EE1C25"])],si:["Slovenya",(x,w,h)=>bands(x,w,h,["#fff","#005DA4","#ED1C24"])],
 hr:["Hırvatistan",(x,w,h)=>bands(x,w,h,["#FF0000","#fff","#171796"])],ba:["Bosna-Hersek",(x,w,h)=>{fill(x,w,h,"#002395");x.fillStyle="#FECB00";x.beginPath();x.moveTo(w*.3,0);x.lineTo(w*.75,0);x.lineTo(w*.75,h);x.closePath();x.fill()}],
 al:["Arnavutluk",(x,w,h)=>{fill(x,w,h,"#E41E20");circ(x,w/2,h/2,h*.24,"#000")}],mk:["K. Makedonya",(x,w,h)=>{fill(x,w,h,"#D20000");circ(x,w/2,h/2,h*.22,"#FFE600")}],
 pt:["Portekiz",(x,w,h)=>{bands(x,w,h,["#006600","#FF0000","#FF0000"],1);circ(x,w*.4,h/2,h*.2,"#FFE000")}],ve:["Venezuela",(x,w,h)=>bands(x,w,h,["#FFCC00","#00247D","#CF142B"])],
 bo:["Bolivya",(x,w,h)=>bands(x,w,h,["#D52B1E","#F9E300","#007934"])],py:["Paraguay",(x,w,h)=>bands(x,w,h,["#D52B1E","#fff","#0038A8"])],
 gh:["Gana",(x,w,h)=>{bands(x,w,h,["#CE1126","#FCD116","#006B3F"]);star(x,w/2,h/2,h*.16,"#000")}],ne:["Nijer",(x,w,h)=>{bands(x,w,h,["#E05206","#fff","#0DB02B"]);circ(x,w/2,h/2,h*.11,"#E05206")}],
 cm:["Kamerun",(x,w,h)=>{bands(x,w,h,["#007A5E","#CE1126","#FCD116"],1);star(x,w/2,h/2,h*.14,"#FCD116")}],sn:["Senegal",(x,w,h)=>bands(x,w,h,["#00853F","#FDEF42","#E31B23"],1)],
 ke:["Kenya",(x,w,h)=>bands(x,w,h,["#000","#BB0000","#006600"])],kw:["Kuveyt",(x,w,h)=>bands(x,w,h,["#007A3D","#fff","#CE1126"])],
 ae:["BAE",(x,w,h)=>{bands(x,w,h,["#00732F","#fff","#000"]);x.fillStyle="#FF0000";x.fillRect(0,0,w*.26,h)}],
 gl:["Grönland",(x,w,h)=>{bands(x,w,h,["#fff","#C8102E"]);circ(x,w*.38,h/2,h*.3,"#C8102E");x.save();x.beginPath();x.rect(0,0,w,h/2);x.clip();circ(x,w*.38,h/2,h*.3,"#C8102E");x.restore();x.save();x.beginPath();x.rect(0,h/2,w,h/2);x.clip();circ(x,w*.38,h/2,h*.3,"#fff");x.restore()}],
 lb:["Lübnan",(x,w,h)=>{bands(x,w,h,["#ED1C24","#fff","#fff","#ED1C24"]);star(x,w/2,h/2,h*.16,"#00A651")}],
 il:["İsrail",(x,w,h)=>{fill(x,w,h,"#fff");x.fillStyle="#0038B8";x.fillRect(0,h*.12,w,h*.14);x.fillRect(0,h*.74,w,h*.14)}]});
/* Natural Earth ülke listesi (harita resmindeki değer = sıra + 1), Türkçe adlar ve bayraklar */
const CTRY=["Afghanistan","Albania","Algeria","American Samoa","Andorra","Angola","Anguilla","Antarctica","Antigua and Barb.","Argentina","Armenia","Aruba","Ashmore and Cartier Is.","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bermuda","Bhutan","Bolivia","Bosnia and Herz.","Botswana","Br. Indian Ocean Ter.","Brazil","British Virgin Is.","Brunei","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia","Cameroon","Canada","Cayman Is.","Central African Rep.","Chad","Chile","China","Colombia","Comoros","Congo","Cook Is.","Costa Rica","Croatia","Cuba","Curaçao","Cyprus","Czechia","Côte d'Ivoire","Dem. Rep. Congo","Denmark","Djibouti","Dominica","Dominican Rep.","Ecuador","Egypt","El Salvador","Eq. Guinea","Eritrea","Estonia","Ethiopia","Faeroe Is.","Falkland Is.","Fiji","Finland","Fr. Polynesia","Fr. S. Antarctic Lands","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Greenland","Grenada","Guam","Guatemala","Guernsey","Guinea","Guinea-Bissau","Guyana","Haiti","Heard I. and McDonald Is.","Honduras","Hong Kong","Hungary","Iceland","India","Indian Ocean Ter.","Indonesia","Iran","Iraq","Ireland","Isle of Man","Israel","Italy","Jamaica","Japan","Jersey","Jordan","Kazakhstan","Kenya","Kiribati","Kosovo","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Macao","Macedonia","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Is.","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Montserrat","Morocco","Mozambique","Myanmar","N. Cyprus","N. Mariana Is.","Namibia","Nauru","Nepal","Netherlands","New Caledonia","New Zealand","Nicaragua","Niger","Nigeria","Niue","Norfolk Island","North Korea","Norway","Oman","Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Pitcairn Is.","Poland","Portugal","Puerto Rico","Qatar","Romania","Russia","Rwanda","S. Geo. and the Is.","S. Sudan","Saint Helena","Saint Lucia","Samoa","San Marino","Saudi Arabia","Senegal","Serbia","Seychelles","Siachen Glacier","Sierra Leone","Singapore","Sint Maarten","Slovakia","Slovenia","Solomon Is.","Somalia","Somaliland","South Africa","South Korea","Spain","Sri Lanka","St-Barthélemy","St-Martin","St. Kitts and Nevis","St. Pierre and Miquelon","St. Vin. and Gren.","Sudan","Suriname","Sweden","Switzerland","Syria","São Tomé and Principe","Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Turks and Caicos Is.","U.S. Virgin Is.","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States of America","Uruguay","Uzbekistan","Vanuatu","Vatican","Venezuela","Vietnam","W. Sahara","Wallis and Futuna Is.","Yemen","Zambia","Zimbabwe","eSwatini","Åland"];
const CTR={"Afghanistan":"Afganistan|af","Albania":"Arnavutluk|al","Algeria":"Cezayir|dz","Angola":"Angola","Argentina":"Arjantin|ar","Armenia":"Ermenistan|am","Australia":"Avustralya|au","Austria":"Avusturya|at","Azerbaijan":"Azerbaycan|az","Bahamas":"Bahamalar","Bahrain":"Bahreyn","Bangladesh":"Bangladeş|bd","Belarus":"Belarus|by","Belgium":"Belçika|be","Belize":"Belize","Benin":"Benin","Bhutan":"Butan","Bolivia":"Bolivya|bo","Bosnia and Herz.":"Bosna-Hersek|ba","Botswana":"Botsvana","Brazil":"Brezilya|br","Brunei":"Brunei","Bulgaria":"Bulgaristan|bg","Burkina Faso":"Burkina Faso","Burundi":"Burundi","Cambodia":"Kamboçya","Cameroon":"Kamerun|cm","Canada":"Kanada|ca","Central African Rep.":"Orta Afrika","Chad":"Çad|td","Chile":"Şili|cl","China":"Çin|cn","Colombia":"Kolombiya|co","Congo":"Kongo","Costa Rica":"Kosta Rika","Croatia":"Hırvatistan|hr","Cuba":"Küba","Cyprus":"Kıbrıs","Czechia":"Çekya|cz","Côte d'Ivoire":"Fildişi Sahili|ci","Dem. Rep. Congo":"Kongo DC","Denmark":"Danimarka|dk","Djibouti":"Cibuti","Dominican Rep.":"Dominik","Ecuador":"Ekvador","Egypt":"Mısır|eg","El Salvador":"El Salvador","Eq. Guinea":"Ekvator Ginesi","Eritrea":"Eritre","Estonia":"Estonya|ee","Ethiopia":"Etiyopya|et","Faeroe Is.":"Faroe Adaları","Falkland Is.":"Falkland Adaları","Fiji":"Fiji","Finland":"Finlandiya|fi","France":"Fransa|fr","Gabon":"Gabon|ga","Gambia":"Gambiya","Georgia":"Gürcistan|ge","Germany":"Almanya|de","Ghana":"Gana|gh","Greece":"Yunanistan|gr","Greenland":"Grönland|gl","Guatemala":"Guatemala","Guinea":"Gine|gn","Guinea-Bissau":"Gine-Bissau","Guyana":"Guyana","Haiti":"Haiti","Honduras":"Honduras","Hungary":"Macaristan|hu","Iceland":"İzlanda|is","India":"Hindistan|in","Indonesia":"Endonezya|id","Iran":"İran|ir","Iraq":"Irak","Ireland":"İrlanda|ie","Israel":"İsrail|il","Italy":"İtalya|it","Jamaica":"Jamaika","Japan":"Japonya|jp","Jordan":"Ürdün","Kazakhstan":"Kazakistan|kz","Kenya":"Kenya|ke","Kosovo":"Kosova","Kuwait":"Kuveyt|kw","Kyrgyzstan":"Kırgızistan|kg","Laos":"Laos|la","Latvia":"Letonya|lv","Lebanon":"Lübnan|lb","Lesotho":"Lesotho","Liberia":"Liberya","Libya":"Libya|ly","Lithuania":"Litvanya|lt","Luxembourg":"Lüksemburg","Macedonia":"K. Makedonya|mk","Madagascar":"Madagaskar","Malawi":"Malavi","Malaysia":"Malezya","Mali":"Mali|ml","Mauritania":"Moritanya","Mexico":"Meksika|mx","Moldova":"Moldova|md","Mongolia":"Moğolistan|mn","Montenegro":"Karadağ","Morocco":"Fas|ma","Mozambique":"Mozambik","Myanmar":"Myanmar|mm","N. Cyprus":"KKTC","Namibia":"Namibya","Nepal":"Nepal","Netherlands":"Hollanda|nl","New Caledonia":"Yeni Kaledonya","New Zealand":"Yeni Zelanda","Nicaragua":"Nikaragua","Niger":"Nijer|ne","Nigeria":"Nijerya|ng","North Korea":"Kuzey Kore|kp","Norway":"Norveç|no","Oman":"Umman","Pakistan":"Pakistan|pk","Palestine":"Filistin","Panama":"Panama","Papua New Guinea":"Papua Yeni Gine","Paraguay":"Paraguay|py","Peru":"Peru|pe","Philippines":"Filipinler|ph","Poland":"Polonya|pl","Portugal":"Portekiz|pt","Puerto Rico":"Porto Riko","Qatar":"Katar","Romania":"Romanya|ro","Russia":"Rusya|ru","Rwanda":"Ruanda","S. Sudan":"Güney Sudan","Saudi Arabia":"Suudi Arabistan|sa","Senegal":"Senegal|sn","Serbia":"Sırbistan|rs","Sierra Leone":"Sierra Leone","Slovakia":"Slovakya|sk","Slovenia":"Slovenya|si","Solomon Is.":"Solomon Adaları","Somalia":"Somali","Somaliland":"Somaliland","South Africa":"Güney Afrika","South Korea":"Güney Kore|kr","Spain":"İspanya|es","Sri Lanka":"Sri Lanka","Sudan":"Sudan|sd","Suriname":"Surinam","Sweden":"İsveç|se","Switzerland":"İsviçre|ch","Syria":"Suriye|sy","Taiwan":"Tayvan","Tajikistan":"Tacikistan|tj","Tanzania":"Tanzanya","Thailand":"Tayland|th","Timor-Leste":"Doğu Timor","Togo":"Togo","Trinidad and Tobago":"Trinidad ve Tobago","Tunisia":"Tunus|tn","Turkey":"Türkiye|tr","Turkmenistan":"Türkmenistan|tm","Uganda":"Uganda","Ukraine":"Ukrayna|ua","United Arab Emirates":"BAE|ae","United Kingdom":"Britanya|gb","United States of America":"ABD|us","Uruguay":"Uruguay","Uzbekistan":"Özbekistan|uz","Vanuatu":"Vanuatu","Venezuela":"Venezuela|ve","Vietnam":"Vietnam|vn","W. Sahara":"Batı Sahra","Yemen":"Yemen|ye","Zambia":"Zambiya","Zimbabwe":"Zimbabve","eSwatini":"Esvatini","Åland":"Åland"};
const ctrInfo=en=>{const v=(CTR[en]||en).split("|");return{name:v[0],flag:v[1]||null}};
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
const kf=n=>{n=Math.max(0,Math.round(n));return n>=1e6?(n/1e6).toFixed(n>=1e7?0:1).replace(".",",")+" Mn":n>=1e4?Math.round(n/1e3)+" B":nf(n)};
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
 const r0=new Int32Array(H).fill(W),r1=new Int32Array(H).fill(-1);for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(kind[y*W+x]){if(x<r0[y])r0[y]=x;r1[y]=x}
 const bb=MAPDEF[id],merc=la=>Math.log(Math.tan(Math.PI/4+la*Math.PI/360));
 const cell=(lon,lat)=>{const x=Math.floor((lon-bb[0])/(bb[2]-bb[0])*W),y=Math.floor((merc(bb[3])-merc(lat))/(merc(bb[3])-merc(bb[1]))*H);return clamp(y,0,H-1)*W+clamp(x,0,W-1)};
 return{id,W,H,N,t,kind,coast,lm,land,bb,cell,r0,r1}}
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

/* ---------- oyun kuralları (6.0: Age of History tarzı piksel savaş) ----------
   Nüfus p.pop, sınırı popCap (toprak + şehir + hastane; işgal altındaki hücre az sayılır), artışı hastane ve kalkınma ile hızlanır.
   Asker: yedek p.troops + cephedeki p.front. Üretim nüfusa, şehre ve kışlaya bağlı; sınır troopCap (nüfusun %22'si + kışla).
   Altın: nüfus, fabrika, liman × kalkınma (1-10). Vasal gelirinin dörtte birini efendisine öder.
   Cephe: her saldırı a = {o saldıran, t savunan (-1 boş toprak), n saldıranın cephedeki askeri, d savunanın cephedeki askeri, tx/ty hedef noktası}.
     Savunan yedeğinden cepheye kendiliğinden takviye gönderir (reinforce). Güç = asker × eğitim seviyesi × 10 × (1 + generaller × %8) × (savunmada sur/dağ).
     İki taraf her saniye karşının gücüyle orantılı kayıp verir (K_CMB); güçlü taraf ilerler, ilerleme hızı cephedeki asker sayısıyla artar; zayıf taraf toprak kaybeder.
     Saldırı hedef noktasına doğru ilerler (pickCand uzaklığa bakar), her yöne değil.
   İşgal: düşmandan alınan hücre işgal altında (g.occ), zamanla asimile olur (assim). Kuşatma: düşmanın tamamen çevrelenen küçük toprağı kuşatana geçer (encircle).
   Diplomasi: barış antlaşması (PACT_T boyunca saldırı yok), vasal (efendisine saldıramaz, haraç öder). İnsanlara teklif (g.offers) gelir, botlar kendisi karar verir. */
const BLD={ev:{n:"Şehir",d:"Nüfus sınırı ve asker üretimi artar",c:3000,inc:2500},fab:{n:"Fabrika",d:"Saniyede +260 altın",c:5000,inc:4000},
 lim:{n:"Liman",d:"Kıyıya kurulur, altın getirir, gemileri hızlandırır",c:4000,inc:3000},kis:{n:"Kışla",d:"Asker üretimi %25 artar, asker sınırı yükselir",c:6000,inc:5000},
 has:{n:"Hastane",d:"Nüfus sınırı ve nüfus artışı yükselir",c:4500,inc:3500},sav:{n:"Sur",d:"Çevresini savunan askerler %60 güçlü",c:2500,inc:1500},
 silo:{n:"Füze deposu",d:"Bomba atmak için gerekir",c:25000,inc:15000},sam:{n:"SAM",d:"Yakına gelen bombaları havada vurur",c:15000,inc:8000}};
const NUK={atom:{n:"Atom bombası",c:50000,r:6,sam:.9},nuk:{n:"Nükleer füze",c:120000,r:10,sam:.75},hid:{n:"Hidrojen bombası",c:260000,r:16,sam:.5}};
const OPS=["Yıldırım","Kartal","Fırtına","Demir Yumruk","Şafak","Kızıl Ok","Kasırga","Çelik Kalkan","Anka","Bozkurt","Tayfun","Volkan","Mızrak","Kılıç","Gök Gürültüsü","Pençe","Şimşek","Akın","Barbarossa","Çığ","Kuzey Yıldızı","Kara Bulut","Deli Dalga","Tunç"];
const GEN_N=["Kara Paşa","Demir Mehmet","Fırtına Ali","Yıldız Selim","Bozkurt Ahmet","Kılıç Arslan","Şahin Murat","Çelik Kemal","Tunç Osman","Akıncı Hasan","Kartal Ömer","Volkan Cem","Toprak Rıza","Sancak Emre","Mete Han"];
const TABS=[["insa","İnşa",["ev","fab","lim","kis","has","sav"]],["ordu","Ordu",["lvl","gen","eco"]],["silah","Silah",["silo","sam","atom","nuk","hid"]],["dip","Diplomasi",["baris","vasal"]]];
const PEACE=25e3,WIN=.8,TLIM=35*60e3,START_T=3000,START_G=2000,BOAT_MAX=3,BOAT_V=16,SAM_R=22,SAM_CD=8000,SAV_R=9,PACT_T=180e3,K_CMB=.075,GEN_MAX=5,RAD_T=60e3,OFFER_T=30e3;
let G=null;   /* oyun */
let V=null;   /* görünüm ve arayüz */

function newGame(m,opt){const g={m,opt,t:0,owner:new Int16Array(m.N),occ:new Uint8Array(m.N),pl:[],bld:[],bmap:new Map(),att:[],boats:[],mis:[],booms:[],rad:[],ev:[],pact:{},offers:[],over:null,seq:0,dirt:[],war:false,peace:0,chg:null,vis:new Int32Array(m.N),vg:0,q:new Int32Array(m.N)};
 for(let i=0;i<m.N;i++)g.owner[i]=m.kind[i]?-1:-2;return g}
const hstr=t=>{let h=7;for(const ch of String(t))h=(h*31+ch.charCodeAt(0))>>>0;return h};
function addPlayer(g,o){const col=o.col||(PCOL[o.flag]?hexRgb(PCOL[o.flag]):o.uid?hexRgb("#12b886"):hsl(hstr(o.name)%360,.55,.5));
 const p={i:g.pl.length,uid:o.uid||null,name:o.name,flag:o.flag||null,col,hex:rgbHex(col),fc:col.map(v=>v*.62+255*.38),bc:col.map(v=>v*.82),bh:rgbHex(col.map(v=>v*.82)),bot:o.bot||null,diff:o.diff||null,
  troops:START_T,front:0,gold:START_G,pop:0,lvl:1,eco:1,gens:[],ov:-1,occ:0,oq:[],trib:0,cells:0,alive:true,border:new Set(),nb:{},nk:0,think:1500+rng()*1500,kills:0,lost:0,spawn:-1,lx:-1,ly:-1,lr:0,peak:START_T,boatT:0,nukeT:0,dipT:0};
 if(p.uid){p.uname=p.name;p.uflag=p.flag;p.ucol=col}g.pl.push(p);return p}
function isB(g,c){const ow=g.owner,o=ow[c],W=g.m.W,x=c%W;return(x>0&&ow[c-1]!==o)||(x<W-1&&ow[c+1]!==o)||(c>=W&&ow[c-W]!==o)||(c<g.m.N-W&&ow[c+W]!==o)}
function refB(g,c){const o=g.owner[c];if(o<0)return;const P=g.pl[o];if(isB(g,c))P.border.add(c);else P.border.delete(c)}
/* hücrenin sahibi değişir; oc=1 ise yeni sahibi için işgal altında sayılır */
function setOwner(g,c,o,oc){const old=g.owner[c];if(old===o)return;const W=g.m.W,x=c%W;
 if(old>=0){const P=g.pl[old];P.cells--;P.border.delete(c);if(g.occ[c])P.occ--}
 g.owner[c]=o;g.occ[c]=0;if(o>=0){const Q=g.pl[o];Q.cells++;if(oc){g.occ[c]=1;Q.occ++;Q.oq.push(c)}}
 refB(g,c);if(x>0)refB(g,c-1);if(x<W-1)refB(g,c+1);if(c>=W)refB(g,c-W);if(c<g.m.N-W)refB(g,c+W);
 g.dirt.push(c);if(g.chg)g.chg.add(c);
 const b=g.bmap.get(c);if(b){if(old>=0)g.pl[old].nb[b.k]--;if(o>=0){b.o=o;g.pl[o].nb[b.k]=(g.pl[o].nb[b.k]||0)+1}else delBld(g,b)}}
function delBld(g,b){const i=g.bld.indexOf(b);if(i>=0)g.bld.splice(i,1);g.bmap.delete(b.c);if(b.o>=0&&g.owner[b.c]===b.o&&g.pl[b.o].nb[b.k])g.pl[b.o].nb[b.k]--}
const cnt=(p,k)=>p.nb[k]||0;
const inRad=(g,c)=>{if(!g.rad.length)return false;const W=g.m.W,x=c%W,y=(c/W)|0;for(const z of g.rad)if(z.until>g.t&&Math.hypot(z.c%W-x,((z.c/W)|0)-y)<=z.r)return true;return false};
const popCap=p=>Math.max(1500,(p.cells-p.occ*.6)*800+cnt(p,"ev")*120000+cnt(p,"has")*80000);
const troopCap=p=>5000+p.pop*.22+cnt(p,"kis")*40000;
const cap=troopCap;
const gm=p=>p.bot==="t"?TRIBE.g:p.bot?DIFF[p.diff].g:1;
const ecoM=p=>1+.15*(p.eco-1);
const popRate=p=>{if(!p.alive)return 0;const C=popCap(p);return p.pop>C?-(p.pop-C)*.03:(C-p.pop)*.012*(1+.15*cnt(p,"has"))*(1+.08*(p.eco-1))+5};
const troopRate=p=>{if(!p.alive)return 0;const C=troopCap(p),t=p.troops+p.front;if(t>C)return -Math.min(p.troops,(t-C))*.02;return(300+p.pop*.004)*(1+.06*cnt(p,"ev")+.25*cnt(p,"kis"))*gm(p)*(1-t/C)};
const goldGross=p=>p.alive?(40+p.pop*.00012+cnt(p,"fab")*260+cnt(p,"lim")*160)*ecoM(p):0;
const goldRate=p=>goldGross(p)*(p.ov>=0?.75:1)+(p.trib||0);
const power=p=>p.lvl*10;
const genM=p=>1+.08*p.gens.length;
const atkM=p=>power(p)*genM(p);
/* büyük ülke için eğitim, kalkınma ve general pahalıdır (sf: ülke büyüklüğü) */
const sf=p=>1+p.cells/1500;
const lvlCost=p=>p.lvl>=10?Infinity:Math.round(6000*2**(p.lvl-1)*sf(p));
const ecoCost=p=>p.eco>=10?Infinity:Math.round(8000*2**(p.eco-1)*sf(p));
const genCost=p=>p.gens.length>=GEN_MAX?Infinity:Math.round(30000*(1+p.gens.length)**1.6*sf(p));
const bCost=(p,k)=>BLD[k].c+BLD[k].inc*cnt(p,k);
const nCost=(p,k)=>Math.round(NUK[k].c*(1+.25*p.nk));
const slotCost=(p,k)=>k==="lvl"?lvlCost(p):k==="eco"?ecoCost(p):k==="gen"?genCost(p):NUK[k]?nCost(p,k):BLD[k]?bCost(p,k):0;
const strength=p=>(p.troops+p.front)*atkM(p)+p.cells*20;
const pkey=(a,b)=>a<b?a+","+b:b+","+a;
/* iki oyuncu birbirine saldırabilir mi: barış antlaşması ya da vasallık varsa hayır */
function pactOf(g,a,b){if(a<0||b<0)return false;if((g.pact[pkey(a,b)]||0)>g.t)return true;const A=g.pl[a],B=g.pl[b];if(!A||!B)return false;
 if(A.ov===b||B.ov===a)return true;if(A.ov>=0&&A.ov===B.ov)return true;return false}
const bloc=(g,p)=>{let c=p.cells;for(const q of g.pl)if(q.alive&&q.ov===p.i)c+=q.cells;return c};
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
/* ---------- hazır ülkeler (5.9.1): cephe/<harita>.u.png ülke katmanı ---------- */
const MINC=20;
function loadCtry(m){if(m.ctry)return Promise.resolve(m);return new Promise((res,rej)=>{const im=new Image();im.onload=()=>{try{const c=document.createElement("canvas");c.width=m.W;c.height=m.H;const x=c.getContext("2d",{willReadFrequently:true});x.drawImage(im,0,0);const d=x.getImageData(0,0,m.W,m.H).data,t=new Uint8Array(m.N);for(let i=0;i<m.N;i++)t[i]=d[i*4];m.ctry=t;res(m)}catch(e){rej(e)}};im.onerror=()=>rej(new Error("Ülkeler indirilemedi"));im.src=`cephe/${m.id}.u.png?v=${AV}`})}
function setupCountries(g,sc,diff){const m=g.m,cnt=new Int32Array(256);for(let i=0;i<m.N;i++)if(m.kind[i])cnt[m.ctry[i]]++;
 const grp={};if(sc.g)for(const[f,list]of Object.entries(sc.g))for(const en of list)grp[en]=f;const pid=new Int16Array(256).fill(-1),gp={};
 for(let v=1;v<256;v++){const en=CTRY[v-1];if(!en||!cnt[v])continue;const f=grp[en];if(cnt[v]<MINC&&!f)continue;
  if(f){if(gp[f]==null){const b=sc.b.find(b=>b[1]===f);gp[f]=addPlayer(g,{name:b?b[0]:FL[f]?FL[f][0]:ctrInfo(en).name,flag:f,bot:"n",diff}).i}pid[v]=gp[f]}
  else{const ci=ctrInfo(en);pid[v]=addPlayer(g,{name:ci.name,flag:ci.flag&&FL[ci.flag]?ci.flag:null,bot:"n",diff}).i}}
 for(let i=0;i<m.N;i++){if(!m.kind[i])continue;const o=pid[m.ctry[i]];if(o>=0)setOwner(g,i,o)}
 for(const p of g.pl)if(p.bot==="n"&&p.cells){let b=-1;for(const c of p.border){b=c;break}p.spawn=b;p.pop=popCap(p)*.7;p.troops=Math.round(troopCap(p)*.4);p.gold=3000+Math.min(p.cells,20000)*.6;p.peak=p.troops}
 g.hz=true}
function claim(g,h,c){if(c<0)return"yok";const o=g.owner[c];if(o<0)return"bos";if(o===h.i)return"ok";const P=g.pl[o];if(P.uid)return"dolu";unclaim(g,h);
 const ow=g.owner;for(let i=0;i<ow.length;i++)if(ow[i]===o)setOwner(g,i,h.i);
 Object.assign(h,{took:o,name:P.name,flag:P.flag,troops:P.troops,gold:P.gold,lvl:P.lvl,pop:P.pop,eco:P.eco,gens:P.gens.slice(),spawn:P.spawn,peak:P.troops,alive:true});setCol(h,P.col);P.alive=false;P.gone=true;return"ok"}
function unclaim(g,h){if(h.took==null)return;const P=g.pl[h.took],ow=g.owner;for(let i=0;i<ow.length;i++)if(ow[i]===h.i)setOwner(g,i,P.i);P.alive=true;P.gone=false;
 Object.assign(h,{took:null,spawn:-1,name:h.uname,flag:h.uflag});setCol(h,h.ucol)}
function setCol(p,col){Object.assign(p,{col,hex:rgbHex(col),fc:col.map(v=>v*.62+255*.38),bc:col.map(v=>v*.82),bh:rgbHex(col.map(v=>v*.82))})}
function minDist(g,c){const W=g.m.W,x=c%W,y=(c/W)|0;let d=1e9;for(const p of g.pl)if(p.spawn>=0){const e=Math.hypot(p.spawn%W-x,((p.spawn/W)|0)-y);if(e<d)d=e}return d}
function nearCount(g,c,R=40){const W=g.m.W,x=c%W,y=(c/W)|0;let n=0;for(const p of g.pl)if(p.spawn>=0&&p.i!==(V&&V.me)&&Math.hypot(p.spawn%W-x,((p.spawn/W)|0)-y)<R)n++;return n}

/* ---------- benzetim ---------- */
function step(g,dt){if(g.over||!g.war)return;g.t+=dt;const s=dt/1000;
 if(g.peace>0){g.peace-=dt;if(g.peace<=0){g.peace=0;ev(g,"Barış bitti, artık ülkelere saldırılabilir.",[],"peace")}}
 for(const p of g.pl){p.front=0;p.trib=0}
 for(const a of g.att){const A=g.pl[a.o];if(A)A.front+=a.n;if(a.t>=0&&g.pl[a.t])g.pl[a.t].front+=a.d||0}
 for(const p of g.pl)if(p.alive&&p.ov>=0){const O=g.pl[p.ov];if(O&&O.alive)O.trib+=goldGross(p)*.25;else p.ov=-1}
 for(const p of g.pl){if(!p.alive)continue;p.pop=Math.max(0,p.pop+popRate(p)*s);p.troops=Math.max(0,p.troops+troopRate(p)*s);p.gold+=goldRate(p)*s;const tt=p.troops+p.front;if(tt>p.peak)p.peak=tt}
 for(const a of g.att.slice())runAtt(g,a,dt);
 for(const b of g.boats.slice()){const P=g.pl[b.o];b.pi+=s*BOAT_V*(1+.1*Math.min(5,cnt(P,"lim")));if(b.pi>=b.path.length-1){g.boats.splice(g.boats.indexOf(b),1);landBoat(g,b)}}
 for(const ms of g.mis.slice()){ms.f+=dt/ms.dur;if(!ms.chk&&ms.f>=.72){ms.chk=1;samCheck(g,ms)}if(ms.f>=1||ms.dn){g.mis.splice(g.mis.indexOf(ms),1);if(!ms.dn)boom(g,ms)}}
 if(g.booms.length)g.booms=g.booms.filter(b=>g.t-b.t<(b.air?3000:9000));
 if(g.rad.length)g.rad=g.rad.filter(z=>z.until>g.t);
 if(g.offers.length)g.offers=g.offers.filter(f=>g.t-f.at<OFFER_T);
 for(const p of g.pl)if(p.bot&&p.alive){p.think-=dt;if(p.think<=0){const D=p.bot==="t"?TRIBE:DIFF[p.diff];p.think=D.think*(.7+rng()*.6);botThink(g,p)}}
 const sec=Math.floor(g.t/1000);if(sec!==g.sec){g.sec=sec;assim(g);if(sec%2===0)for(const a of g.att.slice())if(g.pl[a.o]&&g.pl[a.o].alive&&g.att.includes(a))encircle(g,a)}
 for(const p of g.pl)if(p.alive&&p.cells<=0&&p.spawn>=0)die(g,p,null);
 checkOver(g)}
function die(g,T,A){if(!T.alive)return;T.alive=false;T.troops=0;
 for(const a of g.att.slice()){if(a.o===T.i){a.n=0;endAtt(g,a,0)}else if(a.t===T.i){a.d=0;endAtt(g,a,1)}}
 g.boats=g.boats.filter(b=>b.o!==T.i);for(const q of g.pl)if(q.ov===T.i)q.ov=-1;g.offers=g.offers.filter(f=>f.from!==T.i&&f.to!==T.i);
 if(A){A.kills++;A.gold+=T.gold;T.gold=0;ev(g,`${A.name}, ${T.name} ülkesini haritadan sildi.`,[A.i,T.i],"kill")}else ev(g,`${T.name} yok oldu.`,[T.i],"kill")}
function checkOver(g){if(g.over)return;const land=g.m.land;let lead=null,lb=0;for(const p of g.pl)if(p.alive&&p.ov<0){const b=bloc(g,p);if(!lead||b>lb){lead=p;lb=b}}if(!lead)return;
 const big=g.pl.filter(p=>p.bot!=="t"&&!p.gone),alive=big.filter(p=>p.alive&&p.ov<0);
 if(lb/land>=WIN)g.over={w:lead.i,why:"pct"};
 else if(big.length>1&&alive.length===1)g.over={w:alive[0].i,why:"son"};
 else if(big.length&&!alive.length)g.over={w:lead.i,why:"son"};
 else if(g.t>=TLIM)g.over={w:lead.i,why:"sure"};
 if(g.over)ev(g,`${g.pl[g.over.w].name} savaşı kazandı!`,[g.over.w],"win")}

/* ---------- cephe savaşı ---------- */
const ownN=(g,c,o)=>{const ow=g.owner,W=g.m.W,x=c%W;return(x>0&&ow[c-1]===o)+(x<W-1&&ow[c+1]===o)+(c>=W&&ow[c-W]===o)+(c<g.m.N-W&&ow[c+W]===o)};
function seedCand(g,a){const A=g.pl[a.o],ow=g.owner;a.cand.length=0;for(const b of A.border)nbrs(g.m,b,j=>{if(ow[j]===a.t)a.cand.push(j)})}
/* hedef noktasına yakın, saldırana çok komşu olan aday seçilir: cephe dokunulan yere doğru ilerler */
function pickCand(g,a){const C=a.cand,ow=g.owner,W=g.m.W,tg=a.tx!=null;let best=-1,bs=-1e9,ok=0;
 for(let k=0;k<16&&C.length&&ok<5;k++){const j=(rng()*C.length)|0,c=C[j];if(ow[c]!==a.t){C[j]=C[C.length-1];C.pop();continue}const n=ownN(g,c,a.o);if(!n){C[j]=C[C.length-1];C.pop();continue}ok++;
  let sc=n*1.2+rng()*1.4;if(tg)sc-=Math.hypot(c%W-a.tx,((c/W)|0)-a.ty)*.16;if(sc>bs){bs=sc;best=c}}
 return best}
function fortAt(g,t,x,y){for(const b of g.bld)if(b.o===t&&b.k==="sav"&&Math.abs(b.c%g.m.W-x)<=SAV_R&&Math.abs(((b.c/g.m.W)|0)-y)<=SAV_R)return 1.6;return 1}
const defM=(g,a,T)=>power(T)*genM(T)*(a.fort||1)*(1+((a.km||1)-1)*.3)*(a.push?1.1:1);
/* ilerleme hızı (hücre/sn): cephe ne kadar genişse ve cephede ne kadar çok asker varsa o kadar hızlı */
const spd=a=>a.t<0?(5+Math.sqrt(a.fl||8)*3)*clamp(.6+Math.sqrt(a.n/10000)*.5,.7,15):(2.5+Math.sqrt(a.fl||8)*1.4)*clamp(.4+Math.sqrt((a.n+(a.d||0))/20000)*.4,.5,12);
/* cephe noktaları: cephedeki hücrelerden birbirine uzak en çok 10 tanesi (asker bayrakları burada durur) */
function frontPts(g,a){const C=a.cand,ow=g.owner,W=g.m.W,kind=g.m.kind;a.fp=[];if(!C||!C.length){a.fl=0;return}
 const seen=new Set(),val=[];const tries=Math.min(C.length,500);for(let k=0;k<tries;k++){const c=C[(rng()*C.length)|0];if(seen.has(c))continue;seen.add(c);if(ow[c]===a.t&&ownN(g,c,a.o)>0)val.push(c)}
 a.fl=Math.max(1,Math.round(val.length*Math.max(1,C.length/1000)));if(!val.length)return;
 let first=val[0];if(a.tx!=null){let bd=1e18;for(const c of val){const d=(c%W-a.tx)**2+(((c/W)|0)-a.ty)**2;if(d<bd){bd=d;first=c}}}
 const pts=[first],md=val.map(c=>(c%W-first%W)**2+(((c/W)|0)-((first/W)|0))**2);
 while(pts.length<10){let bi=-1,bv=-1;for(let i=0;i<val.length;i++)if(md[i]>bv){bv=md[i];bi=i}if(bv<9)break;const c=val[bi];pts.push(c);for(let i=0;i<val.length;i++){const d=(val[i]%W-c%W)**2+(((val[i]/W)|0)-((c/W)|0))**2;if(d<md[i])md[i]=d}}
 let sx=0,sy=0,km=0;for(const c of pts){const x=c%W,y=(c/W)|0;let dx=0,dy=0;if(x>0&&ow[c-1]===a.o)dx=1;else if(x<W-1&&ow[c+1]===a.o)dx=-1;else if(c>=W&&ow[c-W]===a.o)dy=1;else dy=-1;a.fp.push(x,y,dx,dy);sx+=x;sy+=y;km+=KMUL[kind[c]]}
 a.fx=sx/pts.length;a.fy=sy/pts.length;a.km=km/pts.length;a.fort=a.t>=0?fortAt(g,a.t,a.fx,a.fy):1}
/* savunan yedeğinden cepheye asker gönderir; fazlası yedeğe döner */
function reinforce(g,a,A,T){const des=T.uid?1.05:T.bot==="t"?.8:({kolay:.8,normal:1,zor:1.15}[T.diff]||1);
 const need=(a.n*atkM(A)*des)/defM(g,a,T)-a.d;
 if(need>0){const take=Math.min(need,T.troops*.7);if(take>0){T.troops-=take;a.d+=take}}
 else if(a.d>0&&-need>a.d*.4){const back=Math.min(a.d*.25,-need*.5);a.d-=back;T.troops+=back}}
function runAtt(g,a,dt){const A=g.pl[a.o],T=a.t>=0?g.pl[a.t]:null,s=dt/1000;
 if(!A||!A.alive)return endAtt(g,a,0);
 if(T&&(!T.alive||pactOf(g,a.o,a.t)))return endAtt(g,a,1);
 if(!a.cand){a.cand=[];seedCand(g,a);a.fpT=0}
 if(g.t>=(a.fpT||0)){a.fpT=g.t+600;frontPts(g,a)}
 if(!T){a.r=1;return advance(g,a,A,null,spd(a)*s)}
 if(g.t>=(a.rt||0)){a.rt=g.t+800;reinforce(g,a,A,T)}
 const mA=atkM(A),mD=defM(g,a,T),SA=a.n*mA,SD=a.d*mD+1e-6;
 const la=K_CMB*SD/mA*s,ld=K_CMB*SA/mD*s;a.n=Math.max(0,a.n-la);a.d=Math.max(0,a.d-ld);A.lost+=la;T.lost+=ld;
 if(a.n<1){if(!A.bot||!T.bot)ev(g,`${T.name}, ${A.name} saldırısını durdurdu.`,[T.i,A.i],"hold");return endAtt(g,a,1)}
 const r=SA/(SA+SD);a.r=r;
 if(r>.52)advance(g,a,A,T,spd(a)*Math.min(1,(r-.5)*2.4)*s);
 else if(r<.48)pushBack(g,a,A,T,spd(a)*Math.min(1,(.5-r)*2.4)*s)}
function advance(g,a,A,T,budget){const W=g.m.W,kind=g.m.kind;a.acc+=budget;let n=0;
 while(a.acc>=1&&n++<300){const c=pickCand(g,a);if(c<0){if(!a.rs){a.rs=1;seedCand(g,a);continue}return endAtt(g,a,1)}a.rs=0;
  const mul=KMUL[kind[c]]*(inRad(g,c)?3:1);let cost;
  if(!T)cost=(6+Math.sqrt(A.cells)*.45)*mul;
  else if(a.d<1){const dens=T.troops/Math.max(1,T.cells);cost=(8+dens*.5)*mul;T.troops=Math.max(0,T.troops-dens*.5)}
  else cost=2*mul;
  if(a.n<cost){if(!T&&!A.bot)ev(g,"Boş topraklara giden askerlerin tükendi.",[A.i],"hold");return endAtt(g,a,1)}
  a.n-=cost;a.acc-=mul;setOwner(g,c,a.o,T?1:0);
  nbrs(g.m,c,j=>{if(g.owner[j]===a.t)a.cand.push(j)});
  if(a.tx!=null&&c%W===Math.round(a.tx)&&((c/W)|0)===Math.round(a.ty)){if(T){a.tx=T.lx;a.ty=T.ly}else a.tx=a.ty=null}
  if(T&&T.cells<=0){die(g,T,A);return endAtt(g,a,1)}}}
/* savunan güçlüyse saldıranın topraklarına girer */
function pushBack(g,a,A,T,budget){const W=g.m.W,kind=g.m.kind,ow=g.owner;a.bacc=(a.bacc||0)+budget;
 if(!a.rc||g.t>=(a.rcT||0)){a.rcT=g.t+1500;a.rc=[];for(const c of a.cand){if(ow[c]!==a.t)continue;nbrs(g.m,c,j=>{if(ow[j]===a.o&&a.rc.length<4000)a.rc.push(j)})}}
 const R=a.rc,ttx=a.ctx!=null?a.ctx:A.lx,tty=a.ctx!=null?a.cty:A.ly;let n=0;
 while(a.bacc>=1&&n++<300){let best=-1,bs=-1e9,ok=0;for(let k=0;k<16&&R.length&&ok<5;k++){const j=(rng()*R.length)|0,c=R[j];if(ow[c]!==a.o||!ownN(g,c,a.t)){R[j]=R[R.length-1];R.pop();continue}ok++;const sc=ownN(g,c,a.t)*1.2+rng()*1.4-Math.hypot(c%W-ttx,((c/W)|0)-tty)*.08;if(sc>bs){bs=sc;best=c}}
  if(best<0){a.rcT=0;break}const mul=KMUL[kind[best]];if(a.d<2*mul)break;a.d-=2*mul;a.bacc-=mul;setOwner(g,best,a.t,1);a.cand.push(best);
  nbrs(g.m,best,j=>{if(ow[j]===a.o)R.push(j)});if(A.cells<=0){die(g,A,T);return endAtt(g,a,1)}}
 if(a.bacc>3)a.bacc=3}
function endAtt(g,a,mult){const i=g.att.indexOf(a);if(i<0)return;g.att.splice(i,1);const A=g.pl[a.o];if(A&&A.alive)A.troops+=a.n*mult;if(a.t>=0){const T=g.pl[a.t];if(T&&T.alive)T.troops+=a.d||0}}
function retreat(g,a,auto){endAtt(g,a,auto?1:.85)}
function adjacent(g,o,t){const P=g.pl[o],ow=g.owner,W=g.m.W,N=g.m.N;for(const b of P.border){const x=b%W;if((x>0&&ow[b-1]===t)||(x<W-1&&ow[b+1]===t)||(b>=W&&ow[b-W]===t)||(b<N-W&&ow[b+W]===t))return true}return false}
function attack(g,o,t,n,tc){const P=g.pl[o];n=Math.min(n,P.troops);if(n<20||t===o)return"az";if(t>=0&&pactOf(g,o,t))return"antlasma";
 const W=g.m.W,has=tc!=null&&tc>=0,tx=has?tc%W:null,ty=has?(tc/W)|0:null;P.troops-=n;
 const op=t>=0?g.att.find(a=>a.o===t&&a.t===o):null;
 if(op){op.d+=n;op.push=1;if(has){op.ctx=tx;op.cty=ty}return"ok"}
 const ex=g.att.find(a=>a.o===o&&a.t===t);if(ex){ex.n+=n;if(has){ex.tx=tx;ex.ty=ty}ex.cand=null;return"ok"}
 const T=t>=0?g.pl[t]:null,opn=T&&P.bot!=="t"&&T.bot!=="t"?OPS[(g.seq*7+o)%OPS.length]+" Harekâtı":null;
 const a={id:++g.seq,o,t,n,d:0,acc:0,cand:null,op:opn,tx:has?tx:T&&T.lx>=0?T.lx:null,ty:has?ty:T&&T.ly>=0?T.ly:null,born:g.t};g.att.push(a);
 if(T){reinforce(g,a,P,T);a.rt=g.t+800;ev(g,opn?`${opn}: ${P.name} sana ${nf(n)} askerle saldırıyor!`:`${P.name} sana ${nf(n)} askerle saldırıyor!`,[t],"att");if(opn&&!P.bot)ev(g,`${opn} başladı: ${T.name} üzerine ${nf(n)} asker.`,[o],"op")}return"ok"}
/* dokunulan yere karadan gidilebilir mi: o yerin sahibinin topraklarında arama, bizim toprağa değerse evet */
function landReach(g,o,c){const t=g.owner[c],W=g.m.W,N=g.m.N,ow=g.owner,q=g.q,vis=g.vis;const vg=++g.vg;let h=0,e=0;q[e++]=c;vis[c]=vg;
 while(h<e){const x=q[h++],xx=x%W;const f=j=>{const v=ow[j];if(v===o){h=e=-1;return}if(v===t&&vis[j]!==vg){vis[j]=vg;q[e++]=j}};
  if(xx>0)f(x-1);if(h<0)return true;if(xx<W-1)f(x+1);if(h<0)return true;if(x>=W)f(x-W);if(h<0)return true;if(x<N-W)f(x+W);if(h<0)return true}
 return false}
function attackAt(g,o,c,n){const P=g.pl[o];if(c<0||!P||!P.alive)return"yok";const t=g.owner[c];if(t===-2)return"deniz";if(t===o)return"kendi";if(t>=0&&g.peace>0)return"baris";if(t>=0&&pactOf(g,o,t))return"antlasma";
 if(landReach(g,o,c))return attack(g,o,t,n,c);
 return sendBoat(g,o,c,n)}
/* kuşatma: cephedeki düşman (ya da boş) toprağın tamamen çevrelenmiş küçük parçaları saldırana geçer */
function encircle(g,a){const A=g.pl[a.o],t=a.t,T=t>=0?g.pl[t]:null,C=a.cand;if(!C||!C.length)return;const m=g.m,W=m.W,H=m.H,N=m.N,ow=g.owner,q=g.q,vis=g.vis;
 const lim=T?Math.min(4000,Math.max(60,T.cells*.25)):2500,vg=++g.vg;
 for(let k=0;k<6;k++){const s0=C[(rng()*C.length)|0];if(ow[s0]!==t||vis[s0]===vg)continue;let h=0,e=0,ok=true;q[e++]=s0;vis[s0]=vg;
  while(h<e){const x=q[h++],xx=x%W,yy=(x/W)|0;if(xx===0||yy===0||xx===W-1||yy===H-1){ok=false;break}
   for(const j of [x-1,x+1,x-W,x+W]){const v=ow[j];if(v===t){if(vis[j]!==vg){vis[j]=vg;q[e++]=j}}else if(v!==a.o){ok=false;break}}
   if(!ok||e>lim){ok=false;break}}
  if(!ok)continue;const size=e;for(let i=0;i<size;i++)setOwner(g,q[i],a.o,T?1:0);
  if(T){T.troops=Math.max(0,T.troops-T.troops*Math.min(.5,size/Math.max(1,T.cells+size)));if(!A.bot||!T.bot)ev(g,`Kuşatma: ${A.name}, ${T.name} ülkesinin ${nf(size)} hücresini çevirdi, teslim oldular.`,[A.i,T.i],"enc");if(T.cells<=0){die(g,T,A);return endAtt(g,a,1)}}
  else if(!A.bot&&size>20)ev(g,`Çevrelenen ${nf(size)} hücrelik boş toprak senin oldu.`,[A.i],"enc")}}
/* asimilasyon: işgal altındaki hücreler zamanla ülkene katılır */
function assim(g){for(const p of g.pl){if(!p.alive||p.occ<=0){p.oq.length=0;p.oqh=0;continue}let k=Math.ceil(2+p.occ*.02+cnt(p,"ev")+cnt(p,"has")*.5);let h=p.oqh||0;
  while(k>0&&h<p.oq.length){const c=p.oq[h++];if(g.owner[c]!==p.i||!g.occ[c])continue;g.occ[c]=0;p.occ--;g.dirt.push(c);if(g.chg)g.chg.add(c);k--}
  if(h>5000){p.oq=p.oq.slice(h);h=0}p.oqh=h}}

/* ---------- gemiyle çıkarma ---------- */
function seaPath(g,o,target){const m=g.m,W=m.W,N=m.N,ow=g.owner,kind=m.kind;const prev=new Int32Array(N).fill(-1),q=g.q;let h=0,e=0;
 nbrs(m,target,j=>{if(!kind[j]&&prev[j]<0){prev[j]=j;q[e++]=j}});
 while(h<e&&h<260000){const c=q[h++],x=c%W;let found=-1;
  const f=j=>{if(found>=0)return;if(kind[j]){if(ow[j]===o)found=j;return}if(prev[j]<0){prev[j]=c;q[e++]=j}};
  if(x>0)f(c-1);if(x<W-1)f(c+1);if(c>=W)f(c-W);if(c<N-W)f(c+W);
  if(found>=0){const path=[found];let k=c;while(true){path.push(k);if(prev[k]===k)break;k=prev[k]}path.push(target);return path}}
 return null}
function sendBoat(g,o,target,n){const P=g.pl[o];if(g.boats.filter(b=>b.o===o).length>=BOAT_MAX)return"gemi";n=Math.min(n,P.troops);if(n<20)return"az";const path=seaPath(g,o,target);if(!path)return"yol";
 P.troops-=n;g.boats.push({id:++g.seq,o,n,path,pi:0,tc:target});return"ok"}
function landBoat(g,b){const P=g.pl[b.o];if(!P.alive)return;const c=b.tc,t=g.owner[c];if(t===b.o||t===-2||(t>=0&&(g.peace>0||pactOf(g,b.o,t)))){P.troops+=b.n;return}
 const T=t>=0?g.pl[t]:null,mul=KMUL[g.m.kind[c]];const cost=T?(20+T.troops/Math.max(1,T.cells))*mul*atkM(T)/atkM(P):(6+Math.sqrt(P.cells)*.45)*mul;
 if(b.n<cost){ev(g,`${P.name} gemisinin çıkarması püskürtüldü.`,[b.o,t],"boat");return}
 setOwner(g,c,b.o,T?1:0);if(T){const d=T.troops/Math.max(1,T.cells);T.troops=Math.max(0,T.troops-d)}
 ev(g,`${P.name} ${T?T.name+" kıyısına":"boş kıyıya"} çıkarma yaptı.`,[b.o,t],"boat");
 const n=b.n-cost;if(n>=20){P.troops+=n;attack(g,b.o,t,n,c)}}

/* ---------- yapılar, eğitim, kalkınma, generaller, bombalar ---------- */
function tooClose(g,c,r){const W=g.m.W,x=c%W,y=(c/W)|0;return g.bld.some(b=>Math.abs(b.c%W-x)<=r&&Math.abs(((b.c/W)|0)-y)<=r)}
function build(g,o,k,c){const P=g.pl[o];if(!P||!P.alive||!BLD[k])return"yok";if(c<0||g.owner[c]!==o)return"toprak";
 if(k==="lim"&&!g.m.coast[c]){const W=g.m.W,x0=c%W,y0=(c/W)|0;let best=-1,bd=1e9;for(let dy=-8;dy<=8;dy++)for(let dx=-8;dx<=8;dx++){const x=x0+dx,y=y0+dy;if(x<0||y<0||x>=W||y>=g.m.H)continue;const i=y*W+x;if(g.m.coast[i]&&g.owner[i]===o&&dx*dx+dy*dy<bd&&!tooClose(g,i,2)){bd=dx*dx+dy*dy;best=i}}if(best<0)return"kiyi";c=best}
 if(tooClose(g,c,2))return"dolu";const cost=bCost(P,k);if(P.gold<cost)return"altin";P.gold-=cost;const b={id:++g.seq,k,o,c,t0:g.t};g.bld.push(b);g.bmap.set(c,b);P.nb[k]=(P.nb[k]||0)+1;return"ok"}
function lvlUp(g,o){const P=g.pl[o];if(!P||!P.alive)return"yok";if(P.lvl>=10)return"max";const c=lvlCost(P);if(P.gold<c)return"altin";P.gold-=c;P.lvl++;if(!P.bot)ev(g,`Ordu eğitimi ${P.lvl}. seviye: her asker artık ${power(P)} güçte.`,[o],"lvl");return"ok"}
function ecoUp(g,o){const P=g.pl[o];if(!P||!P.alive)return"yok";if(P.eco>=10)return"max";const c=ecoCost(P);if(P.gold<c)return"altin";P.gold-=c;P.eco++;if(!P.bot)ev(g,`Kalkınma ${P.eco}. seviye: altın geliri %${(P.eco-1)*15} arttı, nüfus daha hızlı büyüyor.`,[o],"lvl");return"ok"}
function hireGen(g,o){const P=g.pl[o];if(!P||!P.alive)return"yok";const c=genCost(P);if(!isFinite(c))return"max";if(P.gold<c)return"altin";P.gold-=c;const nm=GEN_N.find(n=>!P.gens.includes(n))||"General "+(P.gens.length+1);P.gens.push(nm);
 if(!P.bot)ev(g,`${nm} orduya katıldı: saldırı ve savunma gücün %${P.gens.length*8} arttı.`,[o],"lvl");return"ok"}
function launch(g,o,k,c){const P=g.pl[o],N=NUK[k];if(!P||!N||!P.alive||c<0)return"yok";if(g.peace>0)return"baris";if(g.owner[c]===o)return"kendi";const t=g.owner[c];if(t>=0&&pactOf(g,o,t))return"antlasma";
 const silos=g.bld.filter(b=>b.o===o&&b.k==="silo");if(!silos.length)return"silo";const cost=nCost(P,k);if(P.gold<cost)return"altin";
 const W=g.m.W,tx=c%W,ty=(c/W)|0;let s=silos[0],sd=1e12;for(const b of silos){const d=(b.c%W-tx)**2+(((b.c/W)|0)-ty)**2;if(d<sd){sd=d;s=b}}
 P.gold-=cost;P.nk++;g.mis.push({id:++g.seq,k,o,from:s.c,to:c,f:0,dur:clamp(Math.sqrt(sd)*40,2600,7500)});
 ev(g,`${P.name} ${N.n.toLocaleLowerCase("tr-TR")} fırlattı${t>=0?" → "+g.pl[t].name:""}!`,[o,t],"nuke");return"ok"}
/* SAM: bomba hedefe yaklaşınca havada vurulur; patlama füzenin o anki yerinde ve yüksekliğinde olur */
function samCheck(g,ms){const W=g.m.W,tx=ms.to%W,ty=(ms.to/W)|0;for(const b of g.bld){if(b.k!=="sam"||b.o===ms.o||(b.cd||0)>g.t)continue;if(Math.hypot(b.c%W-tx,((b.c/W)|0)-ty)>SAM_R)continue;if(pactOf(g,b.o,ms.o))continue;b.cd=g.t+SAM_CD;
  if(rng()<NUK[ms.k].sam){ms.dn=1;const fx=ms.from%W,fy=(ms.from/W)|0,f=ms.f,d=Math.hypot(tx-fx,ty-fy);
   g.booms.push({c:ms.to,r:NUK[ms.k].r,t:g.t,air:1,ax:fx+(tx-fx)*f,ay:fy+(ty-fy)*f,ah:Math.sin(Math.PI*f)*d*.32,sam:b.c,k:ms.k});
   ev(g,`${g.pl[b.o].name} SAM'ı ${g.pl[ms.o].name} bombasını havada vurdu!`,[b.o,ms.o],"sam");return}}}
function boom(g,ms){const N=NUK[ms.k],m=g.m,W=m.W,tx=ms.to%W,ty=(ms.to/W)|0,r=N.r,hit={},before={};for(const p of g.pl)before[p.i]=p.cells;
 for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const d=Math.hypot(dx,dy);if(d>r)continue;const x=tx+dx,y=ty+dy;if(x<0||y<0||x>=W||y>=m.H)continue;const c=y*W+x;const o=g.owner[c];if(o<0)continue;
  if(d<r*.6||rng()<(1-(d-r*.6)/(r*.4))*.9){hit[o]=(hit[o]||0)+1;setOwner(g,c,-1)}}
 for(const b of g.bld.slice())if(Math.hypot(b.c%W-tx,((b.c/W)|0)-ty)<=r)delBld(g,b);
 for(const a of g.att){if(a.fx==null||Math.hypot(a.fx-tx,a.fy-ty)>r*1.3)continue;a.n*=.4;a.d=(a.d||0)*.4}
 for(const o in hit){const T=g.pl[o],f=Math.min(1,hit[o]/Math.max(1,before[o]));T.troops*=Math.max(0,1-f*1.3);T.pop*=Math.max(0,1-f*1.5);if(T.cells<=0)die(g,T,g.pl[ms.o])}
 g.rad.push({c:ms.to,r:Math.round(r*1.3),until:g.t+RAD_T});g.booms.push({c:ms.to,r,t:g.t,k:ms.k})}

/* ---------- diplomasi ---------- */
function makePeace(g,a,b){for(const x of g.att.slice())if((x.o===a&&x.t===b)||(x.o===b&&x.t===a))endAtt(g,x,1);g.pact[pkey(a,b)]=g.t+PACT_T;ev(g,`${g.pl[a].name} ile ${g.pl[b].name} barış antlaşması imzaladı (3 dakika).`,[a,b],"pact")}
function makeVassal(g,o,t){const T=g.pl[t];for(const x of g.att.slice())if((x.o===o&&x.t===t)||(x.o===t&&x.t===o))endAtt(g,x,1);T.ov=o;for(const q of g.pl)if(q.ov===t)q.ov=o;ev(g,`${T.name}, ${g.pl[o].name} ülkesinin vasalı oldu.`,[o,t],"vassal")}
function offer(g,k,o,t){if(g.offers.some(f=>f.from===o&&f.to===t&&f.k===k))return"bekle";g.offers.push({id:++g.seq,k,from:o,to:t,at:g.t});ev(g,k==="peace"?`${g.pl[o].name} sana barış teklif ediyor.`:`${g.pl[o].name} senden vasalı olmanı istiyor.`,[t],"offer");return"teklif"}
function dipPeace(g,o,t){const P=g.pl[o],T=g.pl[t];if(!P||!T||!T.alive||t===o)return"yok";if(pactOf(g,o,t))return"zaten";if(g.peace>0)return"zaten";
 if(T.uid)return offer(g,"peace",o,t);if(g.t<(T.dipT||0))return"red";
 const war=g.att.some(a=>(a.o===o&&a.t===t)||(a.o===t&&a.t===o)),sp=strength(P),st=strength(T);
 let ch=war?(st<sp*.7?.85:st<sp*1.2?.45:.15):.6;if(T.bot==="t")ch+=.2;if(rng()<ch){makePeace(g,o,t);return"kabul"}T.dipT=g.t+20000;return"red"}
function dipVassal(g,o,t){const P=g.pl[o],T=g.pl[t];if(!P||!T||!T.alive||t===o)return"yok";if(T.ov===o)return"zaten";if(P.ov===t)return"efendi";
 if(!adjacent(g,o,t)&&!g.att.some(a=>(a.o===o&&a.t===t)||(a.o===t&&a.t===o)))return"komsu";if(strength(T)>strength(P)*.6)return"guclu";
 if(T.uid)return offer(g,"vassal",o,t);if(g.t<(T.dipT||0))return"red";
 const r=strength(T)/strength(P),ch=r<.2?.85:r<.35?.5:.2;if(rng()<ch){makeVassal(g,o,t);return"kabul"}T.dipT=g.t+25000;return"red"}
function answerOffer(g,o,id,yes){const f=g.offers.find(f=>f.id===id&&f.to===o);if(!f)return"yok";g.offers.splice(g.offers.indexOf(f),1);const F=g.pl[f.from];if(!F||!F.alive)return"yok";
 if(!yes){ev(g,`${g.pl[o].name} teklifini reddetti.`,[f.from],"offer");return"ok"}if(f.k==="peace")makePeace(g,f.from,o);else makeVassal(g,f.from,o);return"ok"}

/* ---------- botlar ---------- */
function botThink(g,p){const tribe=p.bot==="t",D=tribe?TRIBE:DIFF[p.diff],ow=g.owner,W=g.m.W,N=g.m.N;
 const nb=new Map(),cellOf=new Map(),stepN=Math.max(1,Math.floor(p.border.size/300));let k=0;
 for(const c of p.border){if(k++%stepN)continue;const x=c%W;const f=j=>{const o=ow[j];if(o!==-2&&o!==p.i){nb.set(o,(nb.get(o)||0)+1);if(!cellOf.has(o)||rng()<.15)cellOf.set(o,j)}};if(x>0)f(c-1);if(x<W-1)f(c+1);if(c>=W)f(c-W);if(c<N-W)f(c+W)}
 if(!tribe){botBuild(g,p,D,nb);botDip(g,p,D,nb)}
 const mine=g.att.filter(a=>a.o===p.i).length;if(mine>=(tribe?1:3))return;
 const C=troopCap(p);if(p.troops<C*(tribe?.4:.25+(1-D.agg)*.25))return;
 const send=p.troops*D.pct*(.85+rng()*.3);
 if(nb.has(-1)&&(rng()<.8||nb.size===1))return void attack(g,p.i,-1,send,cellOf.get(-1));
 let best=null,bs=-1e18;
 if(g.peace<=0)for(const[o,n]of nb){if(o<0)continue;const T=g.pl[o];if(!T.alive||pactOf(g,p.i,o))continue;
  const my=send*atkM(p),their=T.troops*.7*atkM(T)*(T.uid?1.05:1);if(my<their*(tribe?1.1:.8))continue;
  const hostile=g.att.some(a=>a.o===o&&a.t===p.i);const sc=n*2-their/Math.max(1,my)*40+(T.bot==="t"?15:0)+(!T.bot&&!tribe?D.agg*25:0)+(hostile?30:0);if(sc>bs){bs=sc;best=o}}
 if(best!==null)return void attack(g,p.i,best,send,cellOf.get(best));
 if(!tribe&&!nb.has(-1)&&g.t>p.boatT&&p.troops>C*.5&&rng()<.35){p.boatT=g.t+12000;botBoat(g,p,send*.8)}}
function botBoat(g,p,n){const W=g.m.W;let best=-1,bd=1e9;for(let k=0;k<50;k++){const c=(rng()*g.m.N)|0;if(!g.m.coast[c])continue;const o=g.owner[c];if(o===p.i)continue;if(o>=0&&(g.peace>0||pactOf(g,p.i,o)||g.pl[o].troops*atkM(g.pl[o])>n*atkM(p)*.6))continue;const d=Math.hypot(c%W-p.lx,((c/W)|0)-p.ly);if(d<bd){bd=d;best=c}}
 if(best>=0&&bd<W*.45)sendBoat(g,p.i,best,n)}
function ownCell(g,p,near){const W=g.m.W;for(let k=0;k<40;k++){const r=Math.max(2,p.lr*(near?1.4:.85));const x=Math.round(p.lx+(rng()*2-1)*r),y=Math.round(p.ly+(rng()*2-1)*r);if(x<0||y<0||x>=W||y>=g.m.H)continue;const c=y*W+x;if(g.owner[c]===p.i&&!tooClose(g,c,2))return c}
 const arr=[...p.border];for(let k=0;k<20&&arr.length;k++){const c=arr[(rng()*arr.length)|0];if(!tooClose(g,c,2))return c}return -1}
function botBuild(g,p,D,nb){if(rng()>D.build)return;const gold=p.gold;
 if(p.lvl<10&&gold>lvlCost(p)*1.8&&rng()<D.lvl&&p.cells>150)return void lvlUp(g,p.i);
 if(p.eco<10&&gold>ecoCost(p)*1.7&&rng()<D.lvl*.7&&p.cells>150)return void ecoUp(g,p.i);
 if(p.gens.length<GEN_MAX&&gold>genCost(p)*1.6&&rng()<D.lvl*.5&&p.cells>400)return void hireGen(g,p.i);
 const coastal=[...p.border].some(c=>g.m.coast[c]),attacked=g.att.some(a=>a.t===p.i),foeSilo=g.bld.some(b=>b.k==="silo"&&b.o!==p.i);
 const ne=cnt(p,"ev");let want=null;
 if(ne<Math.min(14,1+p.cells/700))want="ev";else if(cnt(p,"fab")<Math.min(ne,10))want="fab";else if(cnt(p,"kis")<Math.min(6,Math.ceil(ne/2)))want="kis";else if(cnt(p,"has")<Math.min(6,Math.ceil(ne/2)))want="has";
 else if(coastal&&cnt(p,"lim")<Math.min(4,1+ne/3))want="lim";else if(attacked&&cnt(p,"sav")<Math.min(8,2+p.cells/1500))want="sav";else if(D.nuke&&p.cells>1200&&cnt(p,"silo")<1)want="silo";else if(D.nuke&&foeSilo&&cnt(p,"sam")<1+ne/4)want="sam";
 if(want&&gold>=bCost(p,want)){const c=ownCell(g,p,want==="sav");if(c>=0)build(g,p.i,want,c);return}
 if(D.nuke&&cnt(p,"silo")&&g.peace<=0&&g.t>p.nukeT&&rng()<D.nuke){const ks=["hid","nuk","atom"].filter(k=>gold>=nCost(p,k)*1.15);if(!ks.length)return;
  let tgt=null;for(const o of nb.keys()){if(o<0)continue;const T=g.pl[o];if(T.bot!=="t"&&!pactOf(g,p.i,o)&&T.cells>p.cells*.7&&(!tgt||T.cells>tgt.cells))tgt=T}
  const lead=g.pl.filter(q=>q.alive&&q.i!==p.i&&!pactOf(g,p.i,q.i)).sort((a,b)=>b.cells-a.cells)[0];if(!tgt&&lead&&lead.cells>p.cells*1.3)tgt=lead;if(!tgt)return;
  const cities=g.bld.filter(b=>b.o===tgt.i&&(b.k==="ev"||b.k==="silo"));const c=cities.length?cities[(rng()*cities.length)|0].c:Math.round(tgt.ly)*g.m.W+Math.round(tgt.lx);
  if(launch(g,p.i,ks[0],c)==="ok")p.nukeT=g.t+45000}}
/* bot diplomasisi: kaybettiği savaşta barış ister, zayıf komşuyu vasal yapar, güçlenen vasal bağımsızlığını ilan eder */
function botDip(g,p,D,nb){if(g.t<(p.dipN||0))return;p.dipN=g.t+12000+rng()*12000;
 if(p.ov>=0){const O=g.pl[p.ov];if(!O||!O.alive||strength(p)>strength(O)*1.3){const o=p.ov;p.ov=-1;if(O)ev(g,`${p.name} bağımsızlığını ilan etti!`,[p.i,o],"vassal")}return}
 for(const a of g.att){if(a.t!==p.i&&a.o!==p.i)continue;const o=a.o===p.i?a.t:a.o;if(o<0||!g.pl[o].alive)continue;const losing=a.t===p.i?(a.r||.5)>.56:(a.r||.5)<.44;
  if(losing&&rng()<.45){dipPeace(g,p.i,o);return}}
 if(D.agg>=.5&&rng()<.25)for(const a of g.att){if(a.o!==p.i||a.t<0)continue;const T=g.pl[a.t];if(!T.alive||T.ov>=0||T.cells>p.cells*.15||(a.r||.5)<.6)continue;if(strength(T)<strength(p)*.2){dipVassal(g,p.i,a.t);return}}}

/* ---------- etiket yerleri: sınıra en uzak hücre (iki geçişli uzaklık dönüşümü) ---------- */
let DT=null;
function labels(g){const m=g.m,W=m.W,H=m.H,N=m.N,ow=g.owner;if(!DT||DT.length!==N)DT=new Uint16Array(N);const d=DT;
 for(let i=0;i<N;i++)d[i]=ow[i]<0?0:60000;
 for(let y=0;y<H;y++)for(let x=m.r0[y],xe=m.r1[y];x<=xe;x++){const i=y*W+x;if(!d[i])continue;const o=ow[i];let v=d[i];
  if(x===0||y===0||x===W-1||y===H-1){d[i]=3;continue}
  let j=i-1;v=Math.min(v,ow[j]===o?d[j]+3:3);j=i-W;v=Math.min(v,ow[j]===o?d[j]+3:3);j=i-W-1;v=Math.min(v,ow[j]===o?d[j]+4:4);j=i-W+1;v=Math.min(v,ow[j]===o?d[j]+4:4);d[i]=v}
 const best=new Int32Array(g.pl.length).fill(-1),bv=new Uint16Array(g.pl.length);
 for(let y=H-1;y>=0;y--)for(let x=m.r1[y],xs=m.r0[y];x>=xs;x--){const i=y*W+x;if(!d[i])continue;const o=ow[i];let v=d[i];
  if(x>0&&y>0&&x<W-1&&y<H-1){let j=i+1;v=Math.min(v,ow[j]===o?d[j]+3:3);j=i+W;v=Math.min(v,ow[j]===o?d[j]+3:3);j=i+W+1;v=Math.min(v,ow[j]===o?d[j]+4:4);j=i+W-1;v=Math.min(v,ow[j]===o?d[j]+4:4);d[i]=v}
  if(v>bv[o]){bv[o]=v;best[o]=i}}
 for(const p of g.pl){if(best[p.i]<0){p.lr=0;continue}p.lx=best[p.i]%W;p.ly=(best[p.i]/W)|0;p.lr=bv[p.i]/3}}

/* ---------- oda anlık görüntüsü: hücre değeri (sahip+2)*2+işgal ---------- */
const cv_=(g,i)=>(g.owner[i]+2)*2+g.occ[i];
function rleOf(g){const N=g.owner.length,s=[];let prev=cv_(g,0),run=0;for(let i=0;i<N;i++){const v=cv_(g,i);if(v===prev)run++;else{s.push(prev.toString(36)+(run>1?"."+run.toString(36):""));prev=v;run=1}}s.push(prev.toString(36)+(run>1?"."+run.toString(36):""));return s.join(",")}
function rawSet(g,c,v){const o=(v>>1)-2,oc=v&1;if(g.owner[c]!==o||g.occ[c]!==oc){g.owner[c]=o;g.occ[c]=oc;g.dirt.push(c)}}
function rleApply(g,str){let i=0;for(const part of str.split(",")){const[v,r]=part.split(".");const val=parseInt(v,36),len=r?parseInt(r,36):1;for(let k=0;k<len;k++)rawSet(g,i+k,val);i+=len}}
function encD(g){const a=[...g.chg].sort((x,y)=>x-y),s=[];let prev=0;for(let i=0;i<a.length;){let j=i;const v=cv_(g,a[i]);while(j+1<a.length&&a[j+1]===a[j]+1&&cv_(g,a[j+1])===v)j++;s.push((a[i]-prev).toString(36)+"."+(j-i+1).toString(36)+"."+v.toString(36));prev=a[i];i=j+1}return s.join(",")}
function decD(g,str){if(!str)return;let prev=0;for(const part of str.split(",")){const[gp,l,v]=part.split(".").map(x=>parseInt(x,36));const st=prev+gp;for(let k=0;k<l;k++)rawSet(g,st+k,v);prev=st}}
const R1=v=>Math.round(v);
function snapOf(g){return JSON.stringify({t:R1(g.t),pe:R1(g.peace),w:g.war?1:0,
 p:g.pl.map(p=>[R1(p.troops),R1(p.gold),p.lvl,p.alive?1:0,p.nk,p.kills,p.spawn,p.cells,R1(p.peak),R1(p.pop),p.eco,p.gens.length,p.ov,R1(p.front),p.occ]),
 b:g.bld.map(b=>[b.k,b.o,b.c,b.t0==null?-1:R1(g.t-b.t0)]),
 a:g.att.map(a=>[a.id,a.o,a.t,R1(a.n),R1(a.d||0),a.fx==null?-1:+a.fx.toFixed(1),a.fy==null?-1:+a.fy.toFixed(1),a.op||0,(a.fp||[]).join(" "),+(a.r||1).toFixed(2)]),
 bo:g.boats.map(b=>[b.id,b.o,R1(b.n),b.path[Math.min(b.path.length-1,Math.floor(b.pi))],b.tc]),
 mi:g.mis.map(m=>[m.id,m.k,m.o,m.from,m.to,+m.f.toFixed(3),R1(m.dur)]),
 bm:g.booms.map(b=>[b.c,b.r,R1(g.t-b.t),b.air?1:0,b.ax==null?-1:+b.ax.toFixed(1),b.ay==null?-1:+b.ay.toFixed(1),b.ah==null?0:+b.ah.toFixed(1),b.sam==null?-1:b.sam,b.k||""]),
 rz:g.rad.map(z=>[z.c,z.r,R1(z.until-g.t)]),pa:Object.entries(g.pact).filter(([,u])=>u>g.t).map(([k,u])=>[k,R1(u-g.t)]),of:g.offers.map(f=>[f.id,f.k,f.from,f.to,R1(g.t-f.at)]),
 ev:g.ev.slice(-10).map(e=>[e.id,e.s,e.w,e.k]),over:g.over,hu:g.pl.filter(p=>p.uid).map(p=>[p.i,p.name,p.flag,p.hex,p.gens.join("|")]),go:g.pl.filter(p=>p.gone).map(p=>p.i)})}
function applySnap(g,str){const d=JSON.parse(str);g.t=d.t;g.peace=d.pe;g.war=!!d.w;
 d.p.forEach((a,i)=>{const p=g.pl[i];if(!p)return;[p.troops,p.gold,p.lvl]=a;p.alive=!!a[3];p.nk=a[4];p.kills=a[5];p.spawn=a[6];p.cells=a[7];p.peak=a[8];p.pop=a[9]||0;p.eco=a[10]||1;
  const gc=a[11]||0;if(p.gens.length!==gc)p.gens=Array.from({length:gc},(_,k)=>p.gens[k]||"");p.ov=a[12]==null?-1:a[12];p.front=a[13]||0;p.occ=a[14]||0});
 g.bld=d.b.map(([k,o,c,age])=>({k,o,c,t0:age<0?null:g.t-age}));g.bmap=new Map(g.bld.map(b=>[b.c,b]));for(const p of g.pl)p.nb={};for(const b of g.bld)if(g.pl[b.o])g.pl[b.o].nb[b.k]=(g.pl[b.o].nb[b.k]||0)+1;
 g.att=d.a.map(([id,o,t,n,dd,fx,fy,op,fp,r])=>({id,o,t,n,d:dd,fx:fx<0?null:fx,fy:fy<0?null:fy,op:op||null,fp:fp?fp.split(" ").map(Number):[],r}));
 g.boats=d.bo.map(([id,o,n,at,tc])=>({id,o,n,at,tc}));
 const t0=performance.now();g.mis=d.mi.map(([id,k,o,from,to,f,dur])=>({id,k,o,from,to,f,dur,rt:t0-f*dur}));
 g.booms=d.bm.map(([c,r,age,air,ax,ay,ah,sam,k])=>({c,r,t:g.t-age,air,rt:t0-age,ax:ax<0?null:ax,ay:ay<0?null:ay,ah,sam:sam<0?null:sam,k}));
 g.rad=(d.rz||[]).map(([c,r,left])=>({c,r,until:g.t+left}));g.pact={};for(const[k,left]of d.pa||[])g.pact[k]=g.t+left;g.offers=(d.of||[]).map(([id,k,from,to,age])=>({id,k,from,to,at:g.t-age}));
 for(const e of d.ev)if(!g.ev.some(x=>x.id===e[0]))g.ev.push({id:e[0],s:e[1],w:e[2],k:e[3]});if(g.ev.length>40)g.ev.splice(0,g.ev.length-40);
 g.over=d.over||null;for(const[i,n,f,hx,gn]of d.hu||[]){const p=g.pl[i];if(!p)continue;p.name=n;p.flag=f;if(hx!==p.hex)setCol(p,hexRgb(hx));if(gn!=null)p.gens=gn?gn.split("|"):[]}const go=new Set(d.go||[]);for(const p of g.pl)p.gone=go.has(p.i)}

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
.cp-rb svg.i{width:18px;height:18px}
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
.cp-bp{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(8px + env(safe-area-inset-bottom,0px));width:min(640px,calc(100% - 16px));padding:10px 10px 8px;display:grid;gap:7px;z-index:3;grid-template-columns:minmax(0,1fr)}
.cp-r1{display:flex;align-items:center;gap:8px;min-width:0}
.cp-r1 .fl{width:30px;height:20px;border-radius:4px;box-shadow:0 0 0 1px rgba(255,255,255,.35);flex:none;background-size:cover}
.cp-r1 .nm{font-weight:800;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cp-r1 .cp-pcx{font:700 .72rem var(--f-mono);color:#c3d0e2;flex:none}
.cp-r1 .sp{flex:1}
.cp-kv{display:grid;gap:1px;text-align:right;flex:none}
.cp-kv small,.cp-lbl{font:800 .55rem/1 var(--f-mono);letter-spacing:.12em;color:#9fb0c6;text-transform:uppercase}
.cp-kv b{font:700 .8rem/1.15 var(--f-mono)}
.cp-kv em{font:600 .62rem var(--f-mono);font-style:normal;color:#8ce99a}
.cp-tp{display:grid;gap:4px;grid-template-columns:minmax(0,1fr)}
.cp-tp .h{display:flex;align-items:baseline;gap:8px;min-width:0}
.cp-tp .h b{font:800 1rem var(--f-mono)}
.cp-tp .h span{font:600 .72rem var(--f-mono);color:#c3d0e2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.cp-tp .h em{white-space:nowrap}
.cp-tp .h em{font:700 .7rem var(--f-mono);font-style:normal;color:#8ce99a;margin-left:auto}
.cp-tb{height:8px;border-radius:5px;background:rgba(255,255,255,.14);overflow:hidden}
.cp-tb i{display:block;height:100%;border-radius:5px;background:linear-gradient(90deg,#4ade80,#a3e635);transition:width .3s}
.cp-r3{display:flex;align-items:center;gap:6px;flex-wrap:wrap;min-width:0}
.cp-ch{flex:1 1 0;padding:6px 0;min-width:2.5rem;border-radius:9px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.1);font:800 .72rem var(--f-mono)}
.cp-ch[aria-pressed=true]{background:#ffd166;color:#1b2333;border-color:#ffd166}
.cp-send{font:600 .72rem var(--f-mono);color:#e7eef8;margin-left:auto;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.cp-sl{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:4px}
.cp-tabs{display:flex;gap:4px}.cp-tab{flex:1;text-align:center;padding:6px 0;border-radius:9px;border:0;background:rgba(255,255,255,.07);font:800 .68rem var(--f-body);letter-spacing:.02em}.cp-tab[aria-pressed=true]{background:#fff;color:#1b2333}
.cp-s.dip svg{color:#8ce99a}
.cp-tb{position:relative}.cp-tb i.f{position:absolute;top:0;bottom:0;background:repeating-linear-gradient(45deg,#ffd166 0 4px,#f59f00 4px 8px);border-radius:0 5px 5px 0}
.cp-of{display:grid;gap:6px}.cp-offer{display:flex;align-items:center;gap:8px;padding:8px 10px;font-size:.76rem;animation:cpIn .25s ease-out;border-color:rgba(255,209,102,.6)}
.cp-offer i{width:22px;height:15px;border-radius:3px;background-size:cover;flex:none}.cp-offer span{flex:1;min-width:0}.cp-offer small{color:#9fb0c6;font-family:var(--f-mono)}
.cp-offer button{padding:6px 9px;border-radius:8px;border:0;background:rgba(255,255,255,.14);font-weight:800;font-size:.7rem}.cp-offer button.ok{background:#8ce99a;color:#0d2a14}
.cp-rb2{display:block;width:34px;height:6px;border-radius:3px;background:rgba(255,107,107,.75);overflow:hidden;flex:none}.cp-rb2 b{display:block;height:100%;background:#8ce99a}
.cp-ar small{font-weight:600;color:#9fb0c6}.cp-lbl small{letter-spacing:0;text-transform:none;font-weight:600;color:#7f90a6;margin-left:4px}
.cp-vs{font-size:.62rem;font-weight:700;color:#ffd166}
.cp-spd{font:900 .78rem var(--f-mono)}
.cp-s{position:relative;display:grid;justify-items:center;gap:2px;padding:6px 2px 5px;border-radius:10px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.08);min-width:0}
.cp-s svg{width:20px;height:20px}
.cp-s u{position:absolute;left:4px;top:2px;text-decoration:none;font:700 .5rem var(--f-mono);color:#9fb0c6}
.cp-s small{font-size:.56rem;font-weight:700;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cp-kv em{display:block}
.cp-s em{font:700 .54rem var(--f-mono);font-style:normal;color:#ffd166;max-width:100%;overflow:hidden;white-space:nowrap}
.cp-s[aria-disabled=true]{opacity:.42}
.cp-s[aria-pressed=true]{background:#ffd166;color:#1b2333;border-color:#ffd166}.cp-s[aria-pressed=true] em,.cp-s[aria-pressed=true] u{color:#1b2333}
.cp-s.bomb svg{color:#ff8787}.cp-s.bomb[aria-pressed=true] svg{color:#c92a2a}
.cp-side{position:absolute;left:10px;max-height:46%;overflow:hidden;bottom:calc(var(--bph,200px) + 16px + env(safe-area-inset-bottom,0px));width:min(300px,calc(100% - 20px));display:grid;gap:6px;z-index:2;pointer-events:none}
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
.cp-fd{padding:5px 9px;border-radius:10px;font-size:.72rem;line-height:1.3;max-width:100%;animation:cpIn .25s ease-out}
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
@media (max-width:600px){.cp-rb{width:35px;height:35px}.cp-tl{gap:5px}.cp-rb svg{width:16px;height:16px}.cp-tc{top:calc(58px + env(safe-area-inset-top,0px));width:calc(100% - 20px)}.cp-ban{top:calc(130px + env(safe-area-inset-top,0px))}.cp-tr{max-width:60vw}.cp-lb{width:min(240px,62vw)}
 .cp-sl{grid-template-columns:repeat(6,minmax(0,1fr))}.cp-bp{padding:8px 8px 6px;gap:6px}.cp-lbopen .cp-tc{display:none}}
@media (max-height:560px) and (min-width:601px){.cp-s small{display:none}}
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
.cp-md button{display:grid;gap:3px;text-align:left;padding:11px 12px;flex:1 1 200px}.cp-md small{font-weight:500;font-size:.7rem;opacity:.8}
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
 kis:'<path d="M3 20h18M5 20V11l7-5 7 5v9M10 20v-5h4v5M12 6V2l4 2-4 2"/>',
 has:'<path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14H4zM12 8v8M8 12h8"/>',
 gen:'<path d="M12 2l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8zM8 21h8"/>',
 eco:'<path d="M3 20h18M6 16v-4M11 16V9M16 16V6M4 9l5-4 4 3 7-5"/>',
 baris:'<path d="M3 12l4-4 4 2 3-3 7 7M3 12l6 6 3-2 3 2 6-6M9 15l2 1"/>',
 vasal:'<path d="M4 18h16l1-11-5 4-4-6-4 6-5-4zM4 21h16"/>',
 back:'<path d="M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3"/>',users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 1 0 8a4 4 0 1 1 0-8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
 door:'<path d="M14 3h5v18h-5M10 17l5-5-5-5M15 12H3"/>',play:'<path d="M6 4l14 8-14 8z"/>',target:'<path d="M12 2v4M12 18v4M2 12h4M18 12h4M12 6a6 6 0 1 1 0 12a6 6 0 1 1 0-12"/>',
 down:'<path d="M6 9l6 6 6-6"/>',up:'<path d="M6 15l6-6 6 6"/>',list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',help:'<path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01M12 2a10 10 0 1 1 0 20a10 10 0 1 1 0-20"/>'};
const svg=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IC[k]||""}</svg>`;

/* ---------- sesler (6.0): hepsi Web Audio ile cihazda üretilir, dosya yok. Yankı (ConvolverNode, üretilmiş gürültü dürtüsü) uzak savaş havası verir ---------- */
const SND=(()=>{let ac=null,out=null,rv=null,nb=null,musT=0,musOn=false,step=0,nextT=0;const last={};
 const ctx=()=>{if(!ac){try{ac=new(window.AudioContext||window.webkitAudioContext)();out=ac.createGain();out.gain.value=.55;const comp=ac.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=4;out.connect(comp);comp.connect(ac.destination);
   const L=ac.sampleRate*2;nb=ac.createBuffer(1,L,ac.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<L;i++)d[i]=Math.random()*2-1;
   const IL=ac.sampleRate*2.6,ir=ac.createBuffer(2,IL,ac.sampleRate);for(let ch=0;ch<2;ch++){const q=ir.getChannelData(ch);for(let i=0;i<IL;i++)q[i]=(Math.random()*2-1)*Math.pow(1-i/IL,2.6)}
   const cv=ac.createConvolver();cv.buffer=ir;rv=ac.createGain();rv.gain.value=.38;rv.connect(cv);cv.connect(comp)}catch{ac=null;return null}}if(ac.state==="suspended")ac.resume().catch(()=>{});return ac};
 const lvl=()=>OPT.snd==null?2:OPT.snd;
 function env(src,t,a,peak,dec,wet){const g=ac.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,peak),t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+dec);src.connect(g);g.connect(out);if(wet){const w=ac.createGain();w.gain.value=wet;g.connect(w);w.connect(rv)}return g}
 function tone(type,f0,f1,t,dur,vol,wet){const o=ac.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);if(f1!==f0)o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);env(o,t,.008,vol,dur,wet);o.start(t);o.stop(t+dur+.05)}
 function nz(t,dur,vol,ft,f,q,f2,wet,a){const s=ac.createBufferSource();s.buffer=nb;const b=ac.createBiquadFilter();b.type=ft;b.frequency.setValueAtTime(f,t);if(f2)b.frequency.exponentialRampToValueAtTime(f2,t+dur);b.Q.value=q||1;s.connect(b);env(b,t,a||.005,vol,dur,wet);s.start(t,Math.random()*1.5);s.stop(t+dur+.1)}
 const FX={
  att:t=>{nz(t,.06,.5,"highpass",1200,.7,0,.6);tone("sine",110,40,t,.45,.8,.3);nz(t+.02,.5,.35,"lowpass",500,1,120,.5);tone("sawtooth",196,294,t+.12,.22,.06,.3);tone("sawtooth",294,392,t+.32,.35,.06,.3)},
  gun:t=>{const n=3+((Math.random()*5)|0);for(let i=0;i<n;i++){const tt=t+i*(.04+Math.random()*.11);nz(tt,.035,.18+Math.random()*.14,"highpass",1600+Math.random()*1800,.8,0,.9);nz(tt,.12,.06,"bandpass",500,1,0,.6)}},
  art:t=>{tone("sine",70,32,t,.9,.7,.8);nz(t,.08,.4,"highpass",900,.7,0,.6);nz(t+.03,1.4,.3,"lowpass",300,1,60,.9,.02)},
  build:t=>{for(let i=0;i<3;i++){tone("square",1500+i*120,1250,t+i*.14,.05,.06,.2);nz(t+i*.14,.05,.16,"bandpass",3200,2,0,.2)}const s=t+.48;for(let i=0;i<4;i++)nz(s+i*.09,.07,.09,"bandpass",2200+i*200,3,0,.1);tone("sine",150,70,t+.85,.2,.4,.2)},
  lvl:t=>[523,659,784,1047].forEach((f,i)=>tone("triangle",f,f,t+i*.09,.3,.16,.35)),
  boat:t=>{tone("sawtooth",98,94,t,1.1,.13,.5);tone("sawtooth",147,141,t,1.1,.08,.5);nz(t,1.2,.06,"lowpass",400,1,0,.3,.3)},
  launch:t=>{nz(t,2.2,.5,"bandpass",250,1.5,2600,.5,.15);tone("sawtooth",120,700,t,1.8,.06,.4);nz(t,2.6,.35,"lowpass",180,1,80,.6,.3)},
  siren:t=>{for(let i=0;i<2;i++){const s0=t+i*2.6;for(const det of[0,6]){const o=ac.createOscillator();o.type="sawtooth";o.frequency.setValueAtTime(330+det,s0);o.frequency.linearRampToValueAtTime(720+det,s0+1.2);o.frequency.linearRampToValueAtTime(330+det,s0+2.6);const f=ac.createBiquadFilter();f.type="lowpass";f.frequency.value=1300;o.connect(f);env(f,s0,.3,.045,2.3,.7);o.start(s0);o.stop(s0+2.7)}}},
  boom:t=>{nz(t,.12,.7,"highpass",1200,.7,0,.8);tone("sine",72,24,t,2.4,1,.6);nz(t+.01,3.5,.8,"lowpass",700,1,60,.9,.02);nz(t+.4,4,.35,"lowpass",160,1,40,1,.4)},
  nuke:t=>{nz(t,.2,.8,"highpass",900,.7,0,1);tone("sine",60,18,t,4.5,1,.8);nz(t,6,.9,"lowpass",500,1,30,1,.05);nz(t+.8,6,.5,"lowpass",120,1,25,1,.8);tone("sine",38,22,t+.3,5,.6,.6)},
  air:t=>{nz(t,.08,.5,"highpass",1500,.7,0,.9);tone("sine",140,60,t,.6,.5,.7);nz(t+.05,1.6,.35,"bandpass",900,1,200,.9,.02)},
  sam:t=>{nz(t,.8,.3,"bandpass",1800,2,600,.4,.03);tone("square",900,200,t+.6,.12,.08,.5)},
  kill:t=>{tone("sine",196,196,t,2.4,.25,.7);tone("sine",293,293,t,2,.12,.7);tone("sine",392,392,t,1.4,.06,.7)},
  pact:t=>[523,659,784].forEach((f,i)=>tone("sine",f,f,t+i*.05,1.6,.14,.8)),
  vassal:t=>[392,523,659,784].forEach((f,i)=>tone("triangle",f,f,t+i*.12,.5,.16,.6)),
  enc:t=>{tone("triangle",330,330,t,.2,.15,.5);tone("triangle",440,440,t+.15,.3,.15,.5)},
  win:t=>[392,523,659,784,659,784].forEach((f,i)=>tone("triangle",f,f,t+i*.16,i===5?1:.2,.2,.5)),
  lose:t=>[[220,262,330],[196,233,294]].forEach((c,i)=>c.forEach(f=>tone("triangle",f,f*.98,t+i*.7,1,.08,.6))),
  tick:t=>tone("sine",880,880,t,.09,.15,.2),go:t=>{tone("sine",1320,1320,t,.3,.2,.4);nz(t,.2,.2,"bandpass",1200,1,0,.3)},
  hit:t=>{tone("square",700,700,t,.08,.07,.3);tone("square",520,520,t+.12,.1,.07,.3);tone("sine",90,50,t,.4,.4,.5)},
  click:t=>tone("sine",640,520,t,.04,.08)};
 const GAP={gun:160,art:700,att:120,build:150,boom:250,nuke:400,air:250,hit:900,siren:5500,click:60,enc:500};
 function play(k){if(!lvl()||!FX[k])return;const c=ctx();if(!c)return;const n=performance.now();if(n-(last[k]||0)<(GAP[k]||80))return;last[k]=n;try{FX[k](c.currentTime+.01)}catch{}}
 /* arka plan: yavaş savaş davulu, trampet ve alçak bas */
 function musTick(){if(!ac||!musOn)return;const sp=60/88/2;while(nextT<ac.currentTime+.3){const t=nextT,i=step%32;const mg=.5;
   if(i%8===0)tone("sine",70,42,t,.5,.32*mg,.3);if(i%8===4)nz(t,.18,.16*mg,"bandpass",1100,1.2,0,.3);if(i===14||i===15||i===30||i===31||i===29)nz(t,.08,.07*mg,"bandpass",1500,1.2,0,.2);if(i%16===10)tone("sine",90,55,t,.3,.18*mg,.3);
   if(i%32===0){const root=[73.4,73.4,65.4,82.4][(step/32|0)%4];tone("triangle",root,root,t,sp*30,.05,.4);tone("triangle",root*1.5,root*1.5,t,sp*30,.02,.5)}
   nextT+=sp;step++}}
 function music(on){on=on&&lvl()===2;if(on===musOn)return;musOn=on;clearInterval(musT);if(!on)return;const c=ctx();if(!c){musOn=false;return}nextT=c.currentTime+.1;musT=setInterval(musTick,100)}
 document.addEventListener("visibilitychange",()=>{if(!ac)return;if(document.hidden)ac.suspend().catch(()=>{});else if(musOn||lvl())ac.resume().catch(()=>{})});
 return{play,music,ctx,lvl}})();
const SNDIC=()=>[I("mute"),I("vol"),I("music")][SND.lvl()];
const SNDT=["Ses kapalı","Ses açık, müzik kapalı","Ses ve müzik açık"];
function sndEv(e){const me=V&&V.me;const mine=e.w.includes(me);
 if(e.k==="att"&&mine)SND.play("hit");else if(e.k==="kill")SND.play(mine&&e.w[1]===me?"lose":"kill");else if(e.k==="nuke"){if(e.w[1]===me)SND.play("siren");SND.play("launch")}
 else if(e.k==="sam")SND.play("sam");else if(e.k==="lvl"&&mine)SND.play("lvl");else if(e.k==="peace")SND.play("go");else if(e.k==="pact"&&mine)SND.play("pact");else if(e.k==="vassal"&&mine)SND.play("vassal");else if(e.k==="enc"&&mine)SND.play("enc");else if(e.k==="offer"&&mine)SND.play("hit");else if(e.k==="win")SND.play(e.w[0]===me?"win":"lose")}

/* ---------- menü ---------- */
const OPT=(()=>{let o={};try{o=LS.get("kadraj_cephe",{})||{}}catch{}return{sc:SC.some(s=>s.id===o.sc)?o.sc:"avrasya",diff:DIFF[o.diff]?o.diff:"normal",nb:[0,4,8,12,16].includes(o.nb)?o.nb:8,tb:[0,1,2].includes(o.tb)?o.tb:2,flag:FL[o.flag]&&FLAG_PICK.includes(o.flag)?o.flag:"kadraj",md:o.md==="yeni"?"yeni":"hazir",snd:[0,1,2].includes(o.snd)?o.snd:2}})();
const saveOpt=()=>{try{LS.set("kadraj_cephe",OPT)}catch{}};
const myName=()=>{try{const u=me();return(u&&(u.name||u.username))||"Sen"}catch{return"Sen"}};
CP.open=function(){css();if(V&&V.layer&&document.body.contains(V.layer))return;const l=openLayer("cephe",`<div class="cp" id="cp"></div>`,{noScrim:true,onClose:()=>stop(true)});V={root:$("#cp",l),layer:l,ratio:.35};menu()};
function menu(){if(!V)return;stop();SND.music(false);G=null;Object.assign(V,{mode:"menu",tool:null,overShown:false,spawnEnd:0,feedSeen:0,ov:null});const r=V.root;
 r.innerHTML=`<div class="cp-menu"><div class="top"><span class="cp-pill cp-gl">${svg("target")}PİKSEL SAVAŞI</span><button class="cp-rb" data-cpx aria-label="Kapat">${I("close")}</button></div>
 <h1>CEPHE</h1><p class="sub">Yerini seç, topraklarını büyüt, şehir kur, füze at. Dünyanın %80'ini alan kazanır.</p>
 <div class="cp-sec">Harita</div><div class="cp-maps">${SC.map(s=>`<button class="cp-map" data-sc="${s.id}" aria-pressed="${OPT.sc===s.id}"><img src="cephe/${s.map}.jpg?v=${AV}" alt="" loading="lazy"><div><b>${esc(s.n)}</b><small>${esc(s.d)}</small></div></button>`).join("")}</div>
 <div class="cp-sec">Oyun türü</div><div class="cp-seg cp-md">${[["hazir","Hazır ülke seç","Gerçek sınırlarla bir ülke ol (Türkiye, Rusya, ABD…)"],["yeni","Yeni devlet kur","Boş haritada küçük bir yerden başla"]].map(([k,t,d])=>`<button data-md="${k}" aria-pressed="${OPT.md===k}"><b>${t}</b><small>${d}</small></button>`).join("")}</div>
 <div data-mdv="hazir" ${OPT.md==="hazir"?"":"hidden"}><div class="cp-sec">Diğer ülkeler</div><div class="cp-seg">${[[8,"Botlar yönetsin"],[0,"Boş toprak olsun (botsuz)"]].map(([n,t])=>`<button data-nb="${n}" aria-pressed="${!!OPT.nb===!!n}">${t}</button>`).join("")}</div></div>
 <div data-mdv="yeni" ${OPT.md==="yeni"?"":"hidden"}><div class="cp-sec">Ülke botları</div><div class="cp-seg">${[0,4,8,12,16].map(n=>`<button data-nb="${n}" aria-pressed="${OPT.nb===n}">${n?n:"Botsuz"}</button>`).join("")}</div>
 <div class="cp-sec">Küçük kabileler</div><div class="cp-seg">${["Yok","Az","Çok"].map((t,i)=>`<button data-tb="${i}" aria-pressed="${OPT.tb===i}">${t}</button>`).join("")}</div></div>
 <div class="cp-sec">Bot zorluğu</div><div class="cp-seg">${Object.entries(DIFF).map(([k,d])=>`<button data-df="${k}" aria-pressed="${OPT.diff===k}">${d.n}</button>`).join("")}</div>
 <div data-mdv="yeni" ${OPT.md==="yeni"?"":"hidden"}> <div class="cp-sec">Bayrağın</div><div class="cp-flags">${FLAG_PICK.map(f=>`<button data-fl="${f}" aria-pressed="${OPT.flag===f}"><img src="${flagURL(f)}" alt="">${esc(FL[f][0])}</button>`).join("")}</div></div>
 <div class="cp-go"><button class="cp-btn p" data-cpgo="solo">${svg("play")}Oyna</button><button class="cp-btn s" data-cpgo="room">${svg("users")}Oda kur, arkadaşını çağır</button><button class="cp-btn s" data-cpgo="join">${svg("door")}Odaya katıl</button></div></div>`;
 r.onclick=e=>{const t=e.target.closest("button");if(!t)return;const d=t.dataset;
  if(d.cpx!==undefined)return closeLayer("cephe");
  const pick=(sel,b)=>$$(sel,r).forEach(x=>x.setAttribute("aria-pressed",x===b));
  if(d.sc){OPT.sc=d.sc;pick("[data-sc]",t)}if(d.md){OPT.md=d.md;pick("[data-md]",t);$$("[data-mdv]",r).forEach(x=>x.hidden=x.dataset.mdv!==d.md)}if(d.nb){OPT.nb=+d.nb;$$("[data-nb]",r).forEach(x=>x.setAttribute("aria-pressed",OPT.md==="hazir"?!!+x.dataset.nb===!!OPT.nb:+x.dataset.nb===OPT.nb))}SND.play("click");if(d.tb){OPT.tb=+d.tb;pick("[data-tb]",t)}if(d.df){OPT.diff=d.df;pick("[data-df]",t)}if(d.fl){OPT.flag=d.fl;pick("[data-fl]",t)}saveOpt();
  if(d.cpgo==="solo")startSolo();if(d.cpgo==="room")createRoom();if(d.cpgo==="join")joinAsk()}}
async function prepare(scId,seed,hz){const sc=SC.find(s=>s.id===scId)||SC[0];const m=await loadMap(sc.map);if(hz)await loadCtry(m);rng=seed?seeded(seed):Math.random;return{sc,m}}
async function startSolo(){let sc,m;const hz=OPT.md==="hazir";toast("Harita hazırlanıyor…");try{({sc,m}=await prepare(OPT.sc,0,hz))}catch(e){return toast("Harita indirilemedi. İnternetini kontrol et.")}if(!V)return;
 const g=newGame(m,{sc:sc.id,nob:hz&&!OPT.nb});G=g;setupGame(g,sc,[{uid:S.uid,name:myName(),flag:OPT.flag}],OPT.nb,OPT.diff,OPT.tb,hz);V.me=0;spawnPhase()}
function setupGame(g,sc,hum,nb,diff,tb,hz){if(hz){for(const h of hum)addPlayer(g,{uid:h.uid,name:h.name,flag:h.flag});setupCountries(g,sc,diff)}else{setupPlayers(g,sc,hum,nb,diff,tb);spawnBots(g)}}
function spawnPhase(){SND.music(true);Object.assign(V,{mode:"spawn",spawnEnd:0,overShown:false,deadShown:false,feedSeen:0,tool:null,myPick:null,ov:null});V.spawnT0=performance.now();ui();fitView();const m=G.m,s2=Math.max(V.s,V.ch*.58/m.H);if(s2>V.s){V.s=s2;V.ox=(V.cw-m.W*s2)/2;V.oy=(V.ch-m.H*s2)/2;clampView()}loop()}
function beginWar(){const g=G;if(!g||g.war)return;
 if(g.hz){for(const p of g.pl)if(p.uid&&p.took==null){const free=g.pl.filter(q=>q.bot==="n"&&q.alive&&q.cells>30);if(free.length)claim(g,p,free[(rng()*free.length)|0].spawn)}
  if(g.opt.nob){for(let i=0;i<g.owner.length;i++){const o=g.owner[i];if(o>=0&&!g.pl[o].uid)setOwner(g,i,-1)}for(const p of g.pl)if(!p.uid){p.alive=false;p.gone=true}}}
 else{for(const p of g.pl)if(p.spawn<0){const c=randLand(g);if(c>=0)spawnAt(g,p,c,p.bot==="t"?2:3)}for(const p of g.pl)p.pop=popCap(p)*.6}
 g.war=true;g.peace=g.hz?15e3:PEACE;ev(g,g.hz?"Savaş başladı! 15 saniye barış: şehir ve fabrika kur, sonra saldır.":"Savaş başladı! İlk 25 saniye barış: boş topraklara yayıl.",[],"peace");V.mode="play";ui();focusMe(2.2);if(!V.room||V.host)startSim();if(V.room&&V.host)roomSnap(true)}
function startSim(){stopSim();let last=performance.now();V.snapT=0;V.simT=setInterval(()=>{if(!G)return;const n=performance.now();let dt=Math.min(500,n-last)*(V.speed||1);last=n;while(dt>0){const d=Math.min(100,dt);step(G,d);dt-=d}V.stepAt=n;
 if(V.room&&V.host&&n-V.snapT>1000){V.snapT=n;roomSnap()}},100)}
function stopSim(){if(V&&V.simT){clearInterval(V.simT);V.simT=null}}
function stop(closing){stopSim();if(closing)SND.music(false);if(V){cancelAnimationFrame(V.raf);V.raf=0;if(V.room)leaveRoom();if(V.ro){V.ro.disconnect();V.ro=null}if(V.keys){document.removeEventListener("keydown",V.keys);V.keys=null}}if(closing){V=null;G=null}}

/* ---------- oyun arayüzü ---------- */
const SLOTI={ev:"Şehir",fab:"Fabrika",lim:"Liman",kis:"Kışla",has:"Hastane",sav:"Sur",lvl:"Eğitim",gen:"General",eco:"Kalkınma",silo:"Füze d.",sam:"SAM",atom:"Atom",nuk:"Nükleer",hid:"Hidrojen",baris:"Barış",vasal:"Vasal"};
const SLOTD={lvl:"Ordu eğitimi: her seviye askerin gücünü 10 artırır (1-10)",gen:"General: saldırı ve savunma gücü her biri için %8 artar (en çok 5)",eco:"Kalkınma: her seviye altın %15, nüfus artışı %8 artar",baris:"Bir ülkeye dokun: barış teklif et (3 dakika birbirinize saldıramazsınız)",vasal:"Bir ülkeye dokun: vasalın olmasını iste (çok zayıfsa kabul eder, sana haraç öder)"};
const INSTANT={lvl:"lvl",gen:"gen",eco:"eco"};
const slotTitle=k=>SLOTD[k]||(BLD[k]?BLD[k].n+": "+BLD[k].d:NUK[k]?NUK[k].n+": hedefe dokun":SLOTI[k]);
const tabOf=k=>(TABS.find(t=>t[2].includes(k))||TABS[0])[0];
function ui(){const r=V.root,g=G,p=g.pl[V.me];const play=V.mode==="play";V.tab=V.tab||"insa";const tab=TABS.find(t=>t[0]===V.tab)||TABS[0];
 r.innerHTML=`<canvas class="cp-cv"></canvas>
 <div class="cp-tl"><button class="cp-rb" data-cq aria-label="Çık">${svg("door")}</button><button class="cp-rb" data-clb aria-label="Sıralama" aria-pressed="${!!V.lbOpen}">${svg("list")}</button><button class="cp-rb" data-cme aria-label="Konumuma git">${svg("target")}</button><button class="cp-rb" data-chelp aria-label="Nasıl oynanır">${svg("help")}</button><button class="cp-rb cp-snd" data-csnd aria-label="${SNDT[SND.lvl()]}" title="${SNDT[SND.lvl()]}">${SNDIC()}</button>${!V.room||V.host?`<button class="cp-rb cp-spd" data-cspd aria-label="Oyun hızı" title="Oyun hızı">${V.speed||1}x</button>`:""}</div>
 <div class="cp-tc">${play?`<div class="cp-wc cp-gl"><div class="h"><span>DÜNYA HAKİMİYETİ</span><span id="cpTm"></span></div><div class="cp-bar"><i id="cpMy" style="background:${p.hex}"></i><span class="ld" id="cpLd"></span><span class="goal"></span></div><div class="r"><span id="cpMyT"></span><span id="cpLdT"></span></div></div><span class="cp-pill cp-peace" id="cpPe" hidden>${svg("sav")}<span></span></span>`:""}</div>
 <div class="cp-tr"><span class="cp-pill cp-gl cp-rank" id="cpRk"></span><div class="cp-lb cp-gl" id="cpLb" ${V.lbOpen?"":"hidden"}></div></div>
 ${V.mode==="spawn"?`<div class="cp-ban cp-gl" id="cpBan"></div>`:""}
 <div class="cp-side"><div class="cp-of" id="cpOf"></div><div class="cp-at cp-gl" id="cpAt" hidden></div><div class="cp-feed" id="cpFeed"></div></div>
 <div class="cp-hint cp-gl" id="cpHint" hidden><span></span><button data-cno>Vazgeç</button></div>
 <div class="cp-tt cp-gl" id="cpTt" hidden></div>
 ${V.mode==="spawn"?"":`<div class="cp-bp cp-gl${V.min?" min":""}" id="cpBp">
  <button class="cp-col" data-cmin aria-label="Paneli küçült">${svg(V.min?"up":"down")}</button>
  <div class="cp-r1"><i class="fl" style="background-image:url(${p.flag?flagURL(p.flag):""});${p.flag?"":"background:"+p.hex}"></i><span class="nm">${esc(p.name)}${p.uname&&p.uname!==p.name?` <small style="font-weight:600;opacity:.7">${esc(p.uname)}</small>`:""}</span><span class="cp-pcx" id="cpPct"></span><span class="sp"></span>
   <div class="cp-kv"><small>Nüfus</small><b id="cpPop"></b><em id="cpPopR"></em></div><div class="cp-kv"><small>Altın</small><b id="cpGo"></b><em id="cpGr"></em></div></div>
  <div class="cp-tp"><div class="h"><span class="cp-lbl">Asker</span><b id="cpTr"></b><span id="cpCap"></span><em id="cpTrr"></em></div><div class="cp-tb"><i id="cpTb"></i><i id="cpTf" class="f"></i></div></div>
  <div class="cp-r3"><span class="cp-lbl">Saldırı</span>${[.1,.25,.35,.5,.75,1].map(v=>`<button class="cp-ch" data-cr="${v}" aria-pressed="${V.ratio===v}">%${v*100}</button>`).join("")}<span class="cp-send" id="cpSend"></span></div>
  <div class="cp-tabs">${TABS.map(t=>`<button class="cp-tab" data-ctab="${t[0]}" aria-pressed="${t[0]===tab[0]}">${t[1]}</button>`).join("")}</div>
  <div class="cp-sl">${tab[2].map((k,i)=>`<button class="cp-s${NUK[k]?" bomb":""}${k==="baris"||k==="vasal"?" dip":""}" data-cs="${k}" aria-pressed="${V.tool===k}" title="${esc(slotTitle(k))}"><u>${i+1}</u>${svg(k)}<small>${SLOTI[k]}</small><em id="cpS_${k}"></em></button>`).join("")}</div>
 </div>`}`;
 r.classList.toggle("cp-lbopen",!!V.lbOpen);
 V.cv=$(".cp-cv",r);V.cx=V.cv.getContext("2d");V.ov=null;V.comp=null;resize();wireInput();
 if(V.ro)V.ro.disconnect();V.ro=new ResizeObserver(()=>{resize();fitView(true);bph()});V.ro.observe(r);if($("#cpBp"))V.ro.observe($("#cpBp"))
 if(!V.keys){V.keys=onKey;document.addEventListener("keydown",V.keys)}
 r.onclick=e=>{const t=e.target.closest("button");if(!t)return;const d=t.dataset;
  if(d.cq!==undefined)return quitAsk();
  if(d.csnd!==undefined){OPT.snd=(SND.lvl()+2)%3;saveOpt();t.innerHTML=SNDIC();t.title=t.ariaLabel=SNDT[OPT.snd];SND.music(V.mode!=="menu");SND.play("click");return toast(SNDT[OPT.snd])}
  if(d.cspd!==undefined){V.speed=V.speed===1?2:V.speed===2?3:1;t.textContent=V.speed+"x";SND.play("click");if(V.room&&V.host)roomSnap();return toast(V.speed===1?"Normal hız":V.speed+" kat hız")}
  if(d.clb!==undefined){V.lbOpen=!V.lbOpen;t.setAttribute("aria-pressed",V.lbOpen);$("#cpLb").hidden=!V.lbOpen;r.classList.toggle("cp-lbopen",V.lbOpen);return hud()}
  if(d.cme!==undefined)return focusMe(V.s<fitScale()*1.5?2.4:0);
  if(d.chelp!==undefined)return help();
  if(d.cmin!==undefined){V.min=!V.min;$("#cpBp").classList.toggle("min",V.min);t.innerHTML=svg(V.min?"up":"down");return bph()}
  if(d.cr){V.ratio=+d.cr;$$("[data-cr]",r).forEach(b=>b.setAttribute("aria-pressed",b===t));SND.play("click");return hud()}
  if(d.ctab){V.tab=d.ctab;SND.play("click");return slotsRedraw()}
  if(d.cs)return slot(d.cs);if(d.cno!==undefined)return setTool(null);if(d.cret)return act({a:"ret",id:+d.cret});
  if(d.cofa)return act({a:"acc",id:+d.cofa});if(d.cofr)return act({a:"rej",id:+d.cofr})}
 bph();hud()}
function slotsRedraw(){const bp=$("#cpBp");if(!bp)return;const tab=TABS.find(t=>t[0]===V.tab)||TABS[0];$$("[data-ctab]",bp).forEach(b=>b.setAttribute("aria-pressed",b.dataset.ctab===tab[0]));
 $(".cp-sl",bp).innerHTML=tab[2].map((k,i)=>`<button class="cp-s${NUK[k]?" bomb":""}${k==="baris"||k==="vasal"?" dip":""}" data-cs="${k}" aria-pressed="${V.tool===k}" title="${esc(slotTitle(k))}"><u>${i+1}</u>${svg(k)}<small>${SLOTI[k]}</small><em id="cpS_${k}"></em></button>`).join("");hud()}
function bph(){if(!V)return;const b=$("#cpBp");V.root.style.setProperty("--bph",(b?b.offsetHeight:0)+"px")}
function onKey(e){if(!V||!G||V.mode==="menu"||V.mode==="lobby")return;if(e.target&&/INPUT|TEXTAREA/.test(e.target.tagName))return;
 const tab=TABS.find(t=>t[0]===V.tab)||TABS[0];
 if(/^[1-9]$/.test(e.key)){const k=tab[2][+e.key-1];if(k){slot(k);e.preventDefault()}}
 else if(e.key==="Tab"){const i=TABS.indexOf(tab);V.tab=TABS[(i+(e.shiftKey?TABS.length-1:1))%TABS.length][0];slotsRedraw();e.preventDefault()}
 else if(e.key==="Escape"){if(V.tool){setTool(null);e.preventDefault()}}
 else if(e.key===" "){focusMe(0);e.preventDefault()}else if(e.key==="q"||e.key==="e"){const L=[.1,.25,.35,.5,.75,1];let i=L.indexOf(V.ratio);i=clamp(i+(e.key==="e"?1:-1),0,L.length-1);V.ratio=L[i];$$("[data-cr]",V.root).forEach(b=>b.setAttribute("aria-pressed",+b.dataset.cr===V.ratio));hud()}}
function slot(k){if(V.mode!=="play")return toast(G&&G.hz?"Önce ülkeni seç.":"Önce başlangıç yerini seç.");const p=G.pl[V.me];if(!p.alive)return;
 if(V.tab!==tabOf(k)){V.tab=tabOf(k);slotsRedraw()}
 if(INSTANT[k])return act({a:INSTANT[k]});if(V.tool===k)return setTool(null);setTool(k)}
function setTool(k){V.tool=k;$$("[data-cs]",V.root).forEach(b=>b.setAttribute("aria-pressed",b.dataset.cs===k));const h=$("#cpHint");if(!h)return;h.hidden=!k;
 if(k)$("span",h).textContent=NUK[k]?`${NUK[k].n}: hedefe dokun (en yakın füze deposundan atılır)`:BLD[k]?`${BLD[k].n}: kendi toprağına dokun${k==="lim"?" (kıyıya yakın)":""}`:k==="baris"?"Barış teklif edeceğin ülkeye dokun":k==="vasal"?"Vasalın olmasını istediğin ülkeye dokun":""}
const MSG={deniz:"Denize dokundun. Karşı kıyıdaki bir yere dokun, gemiyle gidersin.",kendi:"Burası zaten senin.",az:"Gönderecek kadar askerin yok.",komsu:"Bu ülkeyle komşu ya da savaşta değilsiniz.",yol:"Oraya ne karadan ne denizden yol var.",gemi:"Aynı anda en fazla 3 gemin denizde olabilir.",baris:"Barış süresi sürüyor: şimdilik yalnızca boş topraklara yayılabilirsin.",toprak:"Yalnızca kendi toprağına kurabilirsin.",dolu:"Burada zaten bir yapı var, biraz öteye kur.",kiyi:"Liman kıyıya kurulur; denize yakın bir yerine dokun.",altin:"Altının yetmiyor.",silo:"Önce bir füze deposu kur.",max:"En üst seviyedesin.",
 antlasma:"Bu ülkeyle antlaşman ya da vasallık bağın var, saldıramazsın.",zaten:"Zaten barıştasınız.",bekle:"Teklifin hâlâ bekliyor.",guclu:"Bu ülke vasalın olamayacak kadar güçlü.",efendi:"Bu ülke senin efendin.",red:"Teklifini reddetti.",bos:"Bir ülkeye dokun.",yok:""};
const GOOD={teklif:"Teklif gönderildi, cevap bekleniyor.",kabul:"Kabul etti!"};
function feedback(r){if(GOOD[r]){toast(GOOD[r]);SND.play(r==="kabul"?"pact":"click");return}if(r&&MSG[r]){toast(MSG[r]);vib&&vib(20);SND.play("click")}}
function act(c){if(!G||!V)return;SND.ctx();if(V.room&&!V.host){actSnd(c,"ok");if(c.a==="peace"||c.a==="vasal")toast("Teklif gönderildi.");return sendCmd(c)}
 const r=applyCmd(G,V.me,c);if(r&&r!=="ok")feedback(r);else actSnd(c,r);if(c.a==="bld"||c.a==="nuk"||c.a==="peace"||c.a==="vasal")setTool(null);hud()}
function actSnd(c,r){if(r!=="ok")return;if(c.a==="att")SND.play(G&&G.boats.some(b=>b.o===V.me&&b.tc===c.c)?"boat":"att");else if(c.a==="bld")SND.play("build");else if(c.a==="lvl"||c.a==="eco"||c.a==="gen")SND.play("lvl");else SND.play("click")}
function applyCmd(g,o,c){const p=g.pl[o];if(!p||!p.alive||g.over||!g.war)return"yok";
 if(c.a==="att")return attackAt(g,o,c.c,p.troops*clamp(+c.r||.35,.01,1));
 if(c.a==="ret"){const a=g.att.find(a=>a.id===c.id&&a.o===o);if(!a)return"yok";retreat(g,a);return"ok"}
 if(c.a==="bld")return build(g,o,c.k,c.c);if(c.a==="nuk")return launch(g,o,c.k,c.c);if(c.a==="lvl")return lvlUp(g,o);if(c.a==="eco")return ecoUp(g,o);if(c.a==="gen")return hireGen(g,o);
 if(c.a==="peace")return dipPeace(g,o,+c.t);if(c.a==="vasal")return dipVassal(g,o,+c.t);if(c.a==="acc"||c.a==="rej")return answerOffer(g,o,+c.id,c.a==="acc");return"yok"}
function tapCell(c,sx,sy){const g=G;if(!g||c<0)return;
 if(V.mode==="spawn"){if(!g.m.kind[c])return toast("Karada bir yer seç.");if(V.room&&!V.host){V.myPick=c;sendCmd({a:"spawn",c});tip(c,sx,sy);return}
  if(g.hz){const r=claim(g,g.pl[V.me],c);if(r!=="ok")return toast(r==="dolu"?"Bu ülkeyi başka bir oyuncu seçti.":"Bir ülkeye dokun.");SND.play("build")}
  else if(!spawnAt(g,g.pl[V.me],c))return toast("Burası dolu, başka yer seç.");vib&&vib(15);if(!V.spawnEnd&&!V.room)V.spawnEnd=performance.now()+5000;tip(c,sx,sy);hud();return}
 if(V.mode!=="play"||!g.pl[V.me].alive)return;
 if(V.tool==="baris"||V.tool==="vasal"){const t=g.owner[c];if(t<0||t===V.me)return toast("Başka bir ülkeye dokun.");act({a:V.tool==="baris"?"peace":"vasal",t});return}
 if(V.tool){act({a:NUK[V.tool]?"nuk":"bld",k:V.tool,c});return}
 V.pings.push({c,t:performance.now()});act({a:"att",c,r:V.ratio})}

/* ---------- üst bilgiler ---------- */
const relOf=(g,a,b)=>{const A=g.pl[a],B=g.pl[b];if(!A||!B)return"";if(B.ov===a)return"VASALIN";if(A.ov===b)return"EFENDİN";const u=g.pact[pkey(a,b)]||0;if(u>g.t)return"BARIŞ "+mtime(u-g.t);
 if(g.att.some(x=>(x.o===a&&x.t===b)||(x.o===b&&x.t===a)))return"SAVAŞTA";return g.peace>0?"BARIŞ SÜRESİ":"SINIRDA"};
function hud(){if(!V||!G||!V.cv)return;const g=G,p=g.pl[V.me],m=g.m;if(!p)return;const land=m.land;
 const set=(id,v)=>{const e=document.getElementById(id);if(e&&e.textContent!==v)e.textContent=v};
 const C=troopCap(p),tr=troopRate(p),pr=popRate(p);set("cpPct",pf(p.cells/land,2));set("cpPop",kf(p.pop));set("cpPopR",(pr>=0?"+":"−")+kf(Math.abs(pr))+"/sn");set("cpGo",kf(p.gold));set("cpGr","+"+kf(goldRate(p))+"/sn");
 set("cpTr",nf(p.troops+p.front));set("cpCap",(p.front>0?`· cephede ${nf(p.front)} `:"")+"/ "+kf(C));set("cpTrr",(tr>=0?"+":"−")+nf(Math.abs(tr))+"/sn");
 const tb=$("#cpTb"),tf=$("#cpTf");if(tb)tb.style.width=clamp(p.troops/C*100,0,100)+"%";if(tf){tf.style.left=clamp(p.troops/C*100,0,100)+"%";tf.style.width=clamp(p.front/C*100,0,100-p.troops/C*100)+"%"}
 set("cpSend",`${nf(p.troops*V.ratio)} asker · güç ${power(p)}${p.gens.length?` · ${p.gens.length} general`:""}`);
 for(const b of $$(".cp-sl [data-cs]",V.root)){const k=b.dataset.cs,e=b.querySelector("em");const c=slotCost(p,k),dip=k==="baris"||k==="vasal";const no=!dip&&(!isFinite(c)||p.gold<c||(NUK[k]&&!cnt(p,"silo")));
  const tx=dip?"":isFinite(c)?(c>=1e6?(c/1e6).toFixed(1).replace(".",",")+" Mn":nf(c)):"EN ÜST";if(e&&e.textContent!==tx)e.textContent=tx;if(b.getAttribute("aria-disabled")!==String(no))b.setAttribute("aria-disabled",no);
  const s=b.querySelector("small");if(s){const lab=k==="lvl"?"Eğitim "+p.lvl:k==="eco"?"Kalkınma "+p.eco:k==="gen"?"General "+p.gens.length:SLOTI[k];if(s.textContent!==lab)s.textContent=lab}}
 const al=g.pl.filter(q=>(q.alive||q.cells>0)&&!q.gone).sort((a,b)=>b.cells-a.cells),rank=al.indexOf(p)+1;let lead=null,lb=0;for(const q of al)if(q.ov<0){const b=bloc(g,q);if(b>lb){lb=b;lead=q}}const myb=bloc(g,p);
 set("cpRk",p.alive?`#${rank} · ${pf(p.cells/land,2)}`:"YENİLDİN");
 if(V.mode==="play"){const my=$("#cpMy");if(my)my.style.width=clamp(myb/land*100,0,100)+"%";const ld=$("#cpLd");if(ld&&lead)ld.style.left=clamp(lb/land*100,0,100)+"%";
  set("cpMyT","Sen "+pf(myb/land));set("cpLdT",lead&&lead!==p?`Lider ${lead.name} ${pf(lb/land)}`:"Lider sensin");set("cpTm",mtime(TLIM-g.t));
  const pe=$("#cpPe");if(pe){pe.hidden=!(g.peace>0);if(g.peace>0)$("span",pe).textContent="BARIŞ "+mtime(g.peace)}}
 if(V.lbOpen){const lbx=$("#cpLb");if(lbx){const top=al.slice(0,8);if(!top.includes(p)&&p.cells)top.push(p);
  lbx.innerHTML=top.map(q=>`<div class="${q===p?"me":""}"><s>${al.indexOf(q)+1}</s><i style="${q.flag?`background-image:url(${flagURL(q.flag)})`:`background:${q.hex}`}"></i><span>${esc(q.name)}${q.ov>=0?` <small class="cp-vs">vasal</small>`:""}</span><em>${pf(q.cells/land)} · ${nf(q.troops+q.front)}</em></div>`).join("")}}
 /* teklifler */
 const ofb=$("#cpOf");if(ofb){const ofs=g.offers.filter(f=>f.to===V.me);const h=ofs.map(f=>{const F=g.pl[f.from];return`<div class="cp-offer cp-gl"><i style="${F.flag?`background-image:url(${flagURL(F.flag)})`:`background:${F.hex}`}"></i><span><b>${esc(F.name)}</b> ${f.k==="peace"?"barış teklif ediyor":"vasalı olmanı istiyor"} <small>${Math.max(0,Math.ceil((OFFER_T-(g.t-f.at))/1000))} sn</small></span><button class="ok" data-cofa="${f.id}">Kabul</button><button data-cofr="${f.id}">Reddet</button></div>`}).join("");if(ofb._h!==h){ofb.innerHTML=h;ofb._h=h}}
 /* cepheler */
 const at=$("#cpAt");if(at){const out=g.att.filter(a=>a.o===V.me),inc=g.att.filter(a=>a.t===V.me),bo=g.boats.filter(b=>b.o===V.me);
  const bar=r=>`<i class="cp-rb2"><b style="width:${Math.round(clamp(r==null?1:r,0,1)*100)}%"></b></i>`;
  const rows=[...out.map(a=>`<div class="cp-ar"><i style="background:${a.t>=0?g.pl[a.t].hex:"#cfd8dc"}"></i><span>${esc(a.t>=0?g.pl[a.t].name:"Boş topraklar")}</span><b>${nf(a.n)}${a.t>=0?` <small>/ ${nf(a.d||0)}</small>`:""}</b>${a.t>=0?bar(a.r):""}<button data-cret="${a.id}" aria-label="Geri çek" title="Geri çek">${svg("back")}</button></div>`),
   ...bo.map(b=>`<div class="cp-ar"><i style="background:#8ecdf7"></i><span>Gemi → ${esc(tname(g,g.owner[b.tc]))}</span><b>${nf(b.n)}</b></div>`),
   ...inc.map(a=>`<div class="cp-ar cin"><i style="background:${g.pl[a.o].hex}"></i><span>${esc(g.pl[a.o].name)}</span><b>${nf(a.n)} <small>/ ${nf(a.d||0)}</small></b>${bar(1-(a.r==null?.5:a.r))}</div>`)];
  at.hidden=!rows.length;const mx=V.cw<600?3:5,h=rows.length?`<span class="cp-lbl">Cepheler${rows.length>mx?` (${rows.length})`:""} <small>bizim / onların</small></span>${rows.slice(0,mx).join("")}`:"";if(at._h!==h){at.innerHTML=h;at._h=h}}
 feed();if(V.mode==="spawn")banner();if(g.over&&!V.overShown)showOver();if(!p.alive&&!V.deadShown&&!g.over){V.deadShown=true;showDead()}}
function feed(){const g=G,f=$("#cpFeed");if(!f)return;const now_=performance.now();
 for(const e of g.ev){if(e.id<=V.feedSeen)continue;V.feedSeen=e.id;const mine=e.w.includes(V.me);if(V.mode==="play")sndEv(e);if(!mine&&!["kill","nuke","win","peace","sam","vassal"].includes(e.k))continue;if(e.k==="offer"&&e.w[0]===V.me&&/teklif ediyor|istiyor/.test(e.s))continue;
  const bad=mine&&(e.k==="att"||(e.k==="nuke"&&e.w[0]!==V.me)||(e.k==="kill"&&e.w[1]===V.me)||(e.k==="enc"&&e.w[1]===V.me));const d=document.createElement("div");d.className="cp-fd cp-gl"+(bad?" bad":mine?" good":"");d.textContent=e.s;d._t=now_;f.appendChild(d);if(bad)vib&&vib([30,40,30])}
 const items=[...f.children];items.slice(0,Math.max(0,items.length-(V.cw<600?2:4))).forEach(x=>x.remove());items.forEach(x=>{if(now_-x._t>5500)x.remove()})}
function banner(){const b=$("#cpBan");if(!b)return;const p=G.pl[V.me];const left=V.spawnEnd?Math.max(0,V.spawnEnd-performance.now()):0,hz=G.hz,picked=p.spawn>=0||V.myPick!=null;
 if(V.spawnEnd){const sec=Math.ceil(left/1000);if(sec!==V.tickS){V.tickS=sec;if(sec>0)SND.play("tick")}}
 let h;if(!V.spawnEnd)h=hz?`<b>ÜLKENİ SEÇ</b><small>${p.took!=null?`Seçtiğin: ${esc(p.name)}${V.room?" · arkadaşların bekleniyor…":""}`:"Haritada bir ülkeye dokun, o ülke sen olursun."}</small>`:`<b>BAŞLANGIÇ YERİNİ SEÇ</b><small>${picked?(V.room?"Arkadaşların bekleniyor…":"Hazır"):"Haritada bir yere dokun. İstersen sonra değiştirebilirsin."}</small>`;
 else{const s=Math.ceil(left/1000),fr=left/5000;h=`<div class="cp-ring"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="5"/><circle cx="32" cy="32" r="28" fill="none" stroke="#ffd166" stroke-width="5" stroke-linecap="round" stroke-dasharray="${(176*fr).toFixed(1)} 176"/></svg>${s}</div><b>${hz?"SAVAŞ BAŞLIYOR":"YERLEŞİYOR"}</b><small>${hz?(p.took!=null?`${esc(p.name)} · ülkeni hâlâ değiştirebilirsin`:"Bir ülke seç, yoksa rastgele verilir"):picked?"Yerini hâlâ değiştirebilirsin":"Bir yer seç, yoksa rastgele yerleşirsin"}</small>`}
 if(b._h!==h){b.innerHTML=h;b._h=h}}
function quitAsk(){const g=G;if(!g||V.mode==="spawn"&&!V.room||g.over||!g.pl[V.me].alive)return menu();
 dialog("Savaştan çık?",V.room&&V.host?"Kurucu sensin; çıkarsan oda kapanır.":"Ülken haritada kalır ama sen yönetemezsin.",[{label:"Çık",cls:"danger",fn:()=>menu()},{label:"Devam et",cls:"sec"}])}
function help(){sheet("cphelp","Cephe nasıl oynanır",`<div class="cp-help">
 <p><b>Başla:</b> "Hazır ülke"de haritada bir ülkeye, "Yeni devlet"te bir yere dokun; 5 saniye sonra savaş başlar. Başta kısa bir barış süresi var.</p>
 <p><b>Saldır:</b> haritada nereye dokunursan askerlerin oraya doğru ilerler (her yöne değil). Boş toprağa, komşuya ya da denizin karşısına (gemiyle) gidebilirsin. Kaç asker gideceğini alttaki yüzde seçer.</p>
 <p><b>Cephe:</b> saldırdığın yerde iki ordu karşı karşıya durur; bayraklar askerleri gösterir. Güçlü olan ilerler. Güç = asker × eğitim seviyesi × generaller. 2. seviye 40.000 asker, 1. seviye 50.000 askeri yener. Çok askerle saldırırsan cephe çok hızlı ilerler. Cepheler panelinde bizim/onların asker sayısı ve geri çek düğmesi var.</p>
 <p><b>Kuşatma:</b> düşmanın küçük bir parçasını tamamen çevirirsen teslim olur, senin olur.</p>
 <p><b>İşgal ve asimilasyon:</b> aldığın düşman toprağı bir süre çizgili görünür ve az nüfus verir; zamanla ülkene katılır. Şehir ve hastane bunu hızlandırır.</p>
 <p><b>Ekonomi:</b> Şehir nüfusu ve asker üretimini, Kışla asker üretimini, Hastane nüfusu, Fabrika ve Liman altını artırır. Ordu sekmesinde Eğitim (asker gücü 1-10), General (+%8 güç) ve Kalkınma (altın ve nüfus artışı) var.</p>
 <p><b>Diplomasi:</b> Barış teklif et (3 dakika saldırı yok) ya da zayıf bir ülkeden vasalın olmasını iste: vasal sana gelirinin dörtte birini öder ve sana saldıramaz; toprakları dünya hakimiyetine sayılır.</p>
 <p><b>Bombalar:</b> Atom, Nükleer, Hidrojen. Patlama yeri bir dakika radyasyonlu kalır. SAM bombayı havada vurur.</p>
 <p><b>Kazanmak:</b> dünyanın %80'ine (vasallarınla birlikte) hükmet ya da son ülke sen kal. 35 dakika dolarsa en büyük kazanır. Sol üstteki hız düğmesiyle oyunu 2-3 kat hızlandırabilirsin.</p>
 <p><b>Kısayollar:</b> 1-6 seçili sekmedeki yuvalar, Tab sekme değiştir, Q/E yüzde, Esc vazgeç, boşluk konumuna git. Bilgisayarda bir ülkenin üstüne gelince, telefonda basılı tutunca bilgisi çıkar.</p></div>`,{tall:true})}
function stat(g,p){return`<div class="cp-stats"><div><b>${pf(p.cells/g.m.land)}</b><small>Toprak</small></div><div><b>${nf(p.peak)}</b><small>En çok asker</small></div><div><b>${p.kills}</b><small>Silinen ülke</small></div></div>`}
function showOver(){V.overShown=true;const g=G,p=g.pl[V.me],w=g.pl[g.over.w];const win=w&&w.i===V.me;const el=document.createElement("div");el.className="cp-over";
 el.innerHTML=`<div class="cp-gl"><h2>${win?"Zafer!":"Savaş bitti"}</h2><p>${win?(g.over.why==="pct"?"Dünyanın %80'ine hükmediyorsun.":g.over.why==="sure"?"Süre doldu, en büyük ülke sensin.":"Ayakta kalan son ülke sensin."):`${esc(w?w.name:"")} kazandı.`}</p>${stat(g,p)}
 ${!V.room?`<button class="cp-btn p" data-again>${svg("play")}Yeniden oyna</button>`:""}<button class="cp-btn s" data-menu>Ana menü</button></div>`;
 V.root.appendChild(el);el.onclick=e=>{if(e.target.closest("[data-again]"))startSolo();else if(e.target.closest("[data-menu]"))menu()};if(win)vib&&vib([40,60,40,60,80])}
function showDead(){const g=G,p=g.pl[V.me];const el=document.createElement("div");el.className="cp-over";el.innerHTML=`<div class="cp-gl"><h2>Yenildin</h2><p>Toprakların elinden gitti. Savaşı izlemeye devam edebilirsin.</p>${stat(g,p)}<button class="cp-btn p" data-watch>İzle</button><button class="cp-btn s" data-menu>Ana menü</button></div>`;
 V.root.appendChild(el);el.onclick=e=>{if(e.target.closest("[data-watch]"))el.remove();else if(e.target.closest("[data-menu]"))menu()}}

/* ---------- ipucu (üstüne gelince / basılı tutunca) ---------- */
const flagSty=q=>q.flag?`background-image:url(${flagURL(q.flag)})`:`background:${q.hex}`;
function tip(c,sx,sy){const t=$("#cpTt");if(!t)return;if(c<0||!G){t.hidden=true;return}const g=G,m=g.m,o=g.owner[c],k=m.kind[c];let h;const me=g.pl[V.me];
 if(V.mode==="spawn"&&g.hz&&o>=0){const q=g.pl[o];h=`<div class="t"><i style="${flagSty(q)}"></i>${esc(q.name)}</div><div class="k"><span>Toprak</span><b>${pf(q.cells/m.land,2)}</b></div><div class="k"><span>Nüfus</span><b>${nf(q.pop)}</b></div><div class="k"><span>Asker</span><b>${nf(q.troops)}</b></div><div class="c">${q.uid?(o===V.me?"Senin ülken":"Başka oyuncu seçti"):"Dokun: bu ülke ol"}</div>`}
 else if(V.mode==="spawn"){if(!k){t.hidden=true;return}const n=nearCount(g,c);h=`<div class="t">${KIND[k]}</div><div class="k"><span>Zorluk</span><b>×${String(KMUL[k]).replace(".",",")}</b></div><div class="k"><span>Yakındaki oyuncu</span><b>${n}</b></div>`}
 else if(o===-2){t.hidden=true;return}
 else if(o===-1)h=`<div class="t">Boş toprak</div><div class="k"><span>Arazi</span><b>${KIND[k]} ×${String(KMUL[k]).replace(".",",")}</b></div>${inRad(g,c)?`<div class="w">RADYASYON</div>`:""}<div class="c">Dokun: ${nf(me.troops*V.ratio)} askerle oraya git</div>`;
 else{const q=g.pl[o],mine=o===V.me,rel=mine?"":relOf(g,V.me,o),war=rel==="SAVAŞTA";
  h=`<div class="t"><i style="${flagSty(q)}"></i>${esc(q.name)}${q.ov>=0?` <small class="cp-vs">${esc(g.pl[q.ov].name)} vasalı</small>`:""}</div>${mine?"":`<div class="w${war?"":" ok"}">${rel}</div>`}
  <div class="k"><span>Asker</span><b>${nf(q.troops+q.front)}</b></div><div class="k"><span>Güç</span><b>${power(q)}${q.gens.length?` · ${q.gens.length} general`:""}</b></div><div class="k"><span>Nüfus</span><b>${nf(q.pop)}</b></div><div class="k"><span>Toprak</span><b>${pf(q.cells/m.land,2)}</b></div><div class="k"><span>Arazi</span><b>${KIND[k]}${g.occ[c]?" · işgalde":""}</b></div>
  ${mine?"":V.tool==="baris"?`<div class="c">Dokun: barış teklif et</div>`:V.tool==="vasal"?`<div class="c">Dokun: vasal olmasını iste</div>`:pactOf(g,V.me,o)?`<div class="c">Antlaşma var, saldıramazsın</div>`:`<div class="c">Dokun: ${nf(me.troops*V.ratio)} askerle saldır</div>`}`}
 t.innerHTML=h;t.hidden=false;const W=V.cw,H=V.ch,tw=t.offsetWidth,th=t.offsetHeight;let x=sx+14,y=sy+14;if(x+tw>W-8)x=sx-tw-14;if(y+th>H-8)y=sy-th-14;t.style.left=clamp(x,8,W-tw-8)+"px";t.style.top=clamp(y,8,H-th-8)+"px";clearTimeout(V.ttT);V.ttT=setTimeout(()=>{if(!V.hoverC)t.hidden=true},V.hov?60000:2600)}

/* ---------- çizim ---------- */
function resize(){if(!V||!V.cv)return;const r=V.root.getBoundingClientRect();const dpr=Math.min(window.devicePixelRatio||1,1.5);V.dpr=dpr;V.cw=r.width;V.ch=r.height;V.cv.width=Math.round(r.width*dpr);V.cv.height=Math.round(r.height*dpr)}
const fitScale=()=>Math.min(V.cw/G.m.W,V.ch/G.m.H);
function clampView(){const m=G.m,w=m.W*V.s,h=m.H*V.s;V.ox=clamp(V.ox,V.cw/2-w,V.cw/2);V.oy=clamp(V.oy,V.ch/2-h,V.ch/2)}
function fitView(keep){if(!V||!G||!V.cw)return;if(keep&&V.s){clampView();return}const m=G.m,s=fitScale();V.s=s;V.ox=(V.cw-m.W*s)/2;V.oy=(V.ch-m.H*s)/2}
function focusMe(mul){const p=G&&G.pl[V.me];if(!p||p.lx<0)return;const W=G.m.W;let x=p.lx,y=p.ly;if(p.lr<=0&&p.spawn>=0){x=p.spawn%W;y=(p.spawn/W)|0}
 if(mul)V.s=clamp(fitScale()*mul,fitScale(),48);V.ox=V.cw/2-(x+.5)*V.s;V.oy=V.ch*.42-(y+.5)*V.s;clampView()}
function ensureOv(){const g=G,m=g.m;if(V.ov&&V.ovG===g)return;V.ov=document.createElement("canvas");V.ov.width=m.W;V.ov.height=m.H;V.ovx=V.ov.getContext("2d");V.ovd=V.ovx.createImageData(m.W,m.H);V.ovG=g;
 for(let i=0;i<m.N;i++)if(g.owner[i]>=0)paint(i);V.ovx.putImageData(V.ovd,0,0);g.dirt.length=0;V.labD=1;V.compD=2}
function paint(c){const g=G,ow=g.owner,o=ow[c],d=V.ovd.data,k=c*4;if(o<0){d[k+3]=0;return}const P=g.pl[o],W=g.m.W,x=c%W;
 const b=(x>0&&ow[c-1]!==o)||(x<W-1&&ow[c+1]!==o)||(c>=W&&ow[c-W]!==o)||(c<g.m.N-W&&ow[c+W]!==o),st=!b&&g.occ[c]&&(x+((c/W)|0))%3===0;const col=b||st?P.bc:P.fc;d[k]=col[0];d[k+1]=col[1];d[k+2]=col[2];d[k+3]=b?255:st?205:(o===V.me?170:150)}
function flushOv(){const g=G,D=g.dirt,W=g.m.W,H=g.m.H;if(D.length>150000){for(let i=0;i<g.m.N;i++)paint(i);V.ovx.putImageData(V.ovd,0,0);D.length=0;V.compD=1;return}
 let x0=W,y0=H,x1=-1,y1=-1;for(const c of D){const x=c%W,y=(c/W)|0;paint(c);if(x>0)paint(c-1);if(x<W-1)paint(c+1);if(y>0)paint(c-W);if(y<H-1)paint(c+W);if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
 D.length=0;x0=Math.max(0,x0-1);y0=Math.max(0,y0-1);x1=Math.min(W-1,x1+1);y1=Math.min(H-1,y1+1);V.ovx.putImageData(V.ovd,0,0,x0,y0,x1-x0+1,y1-y0+1);V.compD=1}
function loop(){if(!V)return;cancelAnimationFrame(V.raf);V.pings=V.pings||[];V.seenBoom=V.seenBoom||new Set();let labT=0,hT=0,dT=0;
 const f=ts=>{if(!V||!G||!V.cv||!V.cv.isConnected)return;V.raf=requestAnimationFrame(f);
  if(V.mode==="spawn"){if(V.room&&V.host)hostSpawnTick();if(V.spawnEnd&&performance.now()>=V.spawnEnd&&(!V.room||V.host))beginWar()}
  ensureOv();if(G.dirt.length){flushOv();V.labD=1}
  if(V.labD&&ts-labT>(G.pl.length>60?1300:900)){labT=ts;V.labD=0;labels(G)}
  const busy=V.mode==="spawn"||G.att.length||G.boats.length||G.mis.length||G.booms.length||G.rad.length||V.pings.length||V.shake||ts-(V.inT||0)<1500;
  if(ts-dT>=(busy?45:140)){dT=ts;draw(ts)}
  if(V.mode==="play"&&ts-(V.gunT||0)>380){V.gunT=ts;const n=G.att.filter(a=>(a.o===V.me||a.t===V.me)&&a.t>=0).length;if(n&&Math.random()<.35+.15*n)SND.play("gun");if(n&&Math.random()<.08*n)SND.play("art")}
  if(ts-hT>250){hT=ts;hud()}};V.raf=requestAnimationFrame(f)}
const ICP={};function icon(x,k,cx,cy,sz){let p=ICP[k];if(!p){p=ICP[k]=new Path2D((IC[k]||"").match(/d="([^"]+)"/g).map(s=>s.slice(3,-1)).join(" "))}x.save();x.translate(cx-sz/2,cy-sz/2);x.scale(sz/24,sz/24);x.strokeStyle="#fff";x.lineWidth=2.4;x.lineCap="round";x.lineJoin="round";x.stroke(p);x.restore()}
function rr(x,a,b,w,h,r){x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()}
function pill(x,t,cx,cy,bg,fs=11){x.font=`800 ${fs}px ${V.mono||"monospace"}`;const w=x.measureText(t).width+fs*1.1,h=fs*1.7;rr(x,cx-w/2,cy-h/2,w,h,h/2);x.fillStyle=bg;x.fill();x.strokeStyle="rgba(255,255,255,.85)";x.lineWidth=1.5;x.stroke();x.fillStyle="#fff";x.textAlign="center";x.textBaseline="middle";x.fillText(t,cx,cy+.5)}
/* zemin + toprak tek resimde: her karede iki büyük resim yerine bir tane büyütülür */
function compCanvas(m){if(!V.comp||V.comp.width!==m.W||V.compG!==G){V.comp=document.createElement("canvas");V.comp.width=m.W;V.comp.height=m.H;V.compx=V.comp.getContext("2d");V.compG=G;V.compD=1}
 const n=performance.now();if(V.compD&&(V.compD>1||n-(V.compT||0)>90)){V.compD=0;V.compT=n;V.compx.drawImage(baseCanvas(m),0,0);V.compx.drawImage(V.ov,0,0)}return V.comp}
const NMW=new Map();function nmW(x,t,font){let w=NMW.get(t);if(w==null){const f=x.font;x.font=`800 100px ${font}`;w=x.measureText(t).width;x.font=f;NMW.set(t,w)}return w}
function draw(ts){const g=G,m=g.m,x=V.cx,s=V.s,W=m.W;x.setTransform(V.dpr,0,0,V.dpr,0,0);
 let jx=0,jy=0;if(V.shake>.4){jx=(Math.random()-.5)*V.shake;jy=(Math.random()-.5)*V.shake;V.shake*=.88}else V.shake=0;
 x.fillStyle="rgb(46,120,204)";x.fillRect(0,0,V.cw,V.ch);
 x.save();x.translate(V.ox+jx,V.oy+jy);x.scale(s,s);x.imageSmoothingEnabled=false;x.drawImage(compCanvas(m),0,0);x.restore();
 const ox=V.ox+jx,oy=V.oy+jy,X=c=>ox+(c%W+.5)*s,Y=c=>oy+(((c/W)|0)+.5)*s,now_=performance.now(),solo=!V.room||V.host;
 const font=V.font||(V.font=(getComputedStyle(V.root).getPropertyValue("--f-body")||"sans-serif").trim()),mono=V.mono||(V.mono=(getComputedStyle(V.root).getPropertyValue("--f-mono")||"monospace").trim());
 /* başlangıç yerleri */
 if(V.mode==="spawn"&&!g.hz){for(const p of g.pl){if(p.spawn<0)continue;const r=Math.max(9,(p.bot==="t"?3:4.5)*s);x.beginPath();x.arc(X(p.spawn),Y(p.spawn),r,0,7);
   if(p.i===V.me){x.lineWidth=3;x.strokeStyle="#ffd166";x.stroke();x.beginPath();x.arc(X(p.spawn),Y(p.spawn),r+6+4*Math.sin(now_/200),0,7);x.lineWidth=2;x.strokeStyle="rgba(255,209,102,.6)";x.stroke()}else{x.lineWidth=1.5;x.strokeStyle="rgba(255,255,255,.75)";x.stroke()}}
  if(V.myPick!=null&&G.pl[V.me].spawn<0){x.beginPath();x.arc(X(V.myPick),Y(V.myPick),Math.max(10,4.5*s)+3*Math.sin(now_/150),0,7);x.lineWidth=3;x.strokeStyle="#ffd166";x.stroke()}}
 /* radyasyon bölgeleri */
 for(const z of g.rad){const cx=X(z.c),cy=Y(z.c),R=Math.max(8,z.r*s);if(cx<-R||cy<-R||cx>V.cw+R||cy>V.ch+R)continue;const left=clamp((z.until-g.t)/RAD_T,0,1),pu=.75+.25*Math.sin(now_/400);
  const gr=x.createRadialGradient(cx,cy,0,cx,cy,R);gr.addColorStop(0,`rgba(190,255,70,${.32*left*pu})`);gr.addColorStop(1,"rgba(190,255,70,0)");x.fillStyle=gr;x.beginPath();x.arc(cx,cy,R,0,7);x.fill();
  x.setLineDash([5,6]);x.lineWidth=1.5;x.strokeStyle=`rgba(220,255,90,${.7*left})`;x.beginPath();x.arc(cx,cy,R,0,7);x.stroke();x.setLineDash([]);
  if(R>26){const r=Math.min(R*.28,18);x.fillStyle=`rgba(30,30,10,${.55*left})`;for(let i=0;i<3;i++){const a0=-Math.PI/2+i*2.094-.5;x.beginPath();x.moveTo(cx,cy);x.arc(cx,cy,r,a0,a0+1);x.closePath();x.fill()}x.beginPath();x.arc(cx,cy,r*.22,0,7);x.fill()}}
 /* yapılar (yeni kurulan zıplayarak çıkar) */
 if(s>=(g.hz?2.2:1.3)){const sz=clamp(s*3.2,10,28);for(const b of g.bld){const cx=X(b.c),cy=Y(b.c);if(cx<-30||cy<-30||cx>V.cw+30||cy>V.ch+30)continue;const p=g.pl[b.o];
  const age=b.t0==null?1e9:g.t-b.t0+(solo?now_-(V.stepAt||now_):0);let sc=1;if(age<700){const q=clamp(age/700,0,1);sc=1+2.70158*Math.pow(q-1,3)+1.70158*Math.pow(q-1,2);
   x.beginPath();x.arc(cx,cy,sz*(.6+q),0,7);x.strokeStyle=`rgba(255,255,255,${.6*(1-q)})`;x.lineWidth=2;x.stroke()}
  const r=(sz/2+2)*Math.max(.05,sc);x.beginPath();x.arc(cx,cy+1.5,r,0,7);x.fillStyle="rgba(0,0,0,.25)";x.fill();x.beginPath();x.arc(cx,cy,r,0,7);x.fillStyle=p?p.bh:"#555";x.fill();x.lineWidth=1.5;x.strokeStyle="#fff";x.stroke();if(sc>.4)icon(x,b.k,cx,cy,sz*.68*sc)}}
 /* adlar ve asker sayıları */
 x.textAlign="center";x.textBaseline="middle";x.lineJoin="round";
 const LB=[];for(const p of g.pl)if((p.alive||p.cells)&&p.lr>0&&p.lx>=0&&!p.gone)LB.push(p);LB.sort((a,b)=>(b.i===V.me)-(a.i===V.me)||b.lr-a.lr);const used=[];
 for(const p of LB){const cx=ox+(p.lx+.5)*s,cy=oy+(p.ly+.5)*s;if(cx<-200||cy<-80||cx>V.cw+200||cy>V.ch+80)continue;let fs=Math.min(p.lr*s*.62,52);const fs0=fs;
  const nm=p.name+(p.ov>=0?" (vasal)":""),tr=nf(p.troops+p.front),fl=!!p.flag,tw0=tr.length*fs*.62,nw0=nmW(x,nm,font)*fs*.62/100*(fl?1.25:1);
  const maxw=p.lr*s*2.5,tw=Math.max(tw0,nw0);if(tw>maxw)fs*=maxw/tw;if(fs<(p.i===V.me?9:11))continue;
  const nf_=fs*.62;x.font=`800 ${nf_}px ${font}`;const w2=nmW(x,nm,font)*nf_/100,fw=fl&&nf_>=8?nf_*1.4:0,bw=Math.max(w2+fw+nf_*.3,tw0*fs/fs0),box=[cx-bw/2,cy-fs*1.05,cx+bw/2,cy+fs*.6];
  if(used.some(u=>box[0]<u[2]&&box[2]>u[0]&&box[1]<u[3]&&box[3]>u[1]))continue;used.push(box);
  const ny=cy-fs*.62,nx=cx+fw/2+(fw?nf_*.15:0);x.strokeStyle="rgba(255,255,255,.8)";x.lineWidth=Math.max(2,nf_*.22);x.fillStyle="#132033";x.strokeText(nm,nx,ny);x.fillText(nm,nx,ny);
  if(fw)x.drawImage(flagCanvas(p.flag,48,32),nx-w2/2-fw-nf_*.15,ny-nf_*.48,fw,nf_*.93);
  x.font=`900 ${fs}px ${mono}`;x.lineWidth=Math.max(2.5,fs*.2);x.strokeStyle="rgba(255,255,255,.85)";x.strokeText(tr,cx,cy+fs*.12);x.fillStyle=p.i===V.me?"#0b1726":"#1b2a40";x.fillText(tr,cx,cy+fs*.12)}
 /* cepheler: iki ordu karşı karşıya; her bayrak bir birlik (1.000 asker, çok askerde daha fazla), sayılar kendi tarafında */
 drawFronts(x,g,s,ox,oy,now_,font,mono,solo);
 /* gemiler (arkasında köpük izi) */
 for(const b of g.boats){const c=b.path?b.path[Math.min(b.path.length-1,Math.floor(b.pi))]:b.at;if(c==null)continue;const cx=X(c),cy=Y(c),z=clamp(s*1.6,6,14),p=g.pl[b.o];
  if(b.path){const pc=b.path[Math.max(0,Math.floor(b.pi)-3)];const px=X(pc),py=Y(pc);x.strokeStyle="rgba(255,255,255,.55)";x.lineWidth=2;x.beginPath();x.moveTo(cx,cy+z*.3);x.lineTo(px+(cy-py)*.25,py-(cx-px)*.25+z*.3);x.moveTo(cx,cy+z*.3);x.lineTo(px-(cy-py)*.25,py+(cx-px)*.25+z*.3);x.stroke()}
  x.beginPath();x.moveTo(cx-z,cy-z*.2);x.lineTo(cx+z,cy-z*.2);x.lineTo(cx+z*.6,cy+z*.5);x.lineTo(cx-z*.6,cy+z*.5);x.closePath();x.fillStyle=p.hex;x.fill();x.lineWidth=1.5;x.strokeStyle="#fff";x.stroke();
  x.beginPath();x.moveTo(cx,cy-z*.2);x.lineTo(cx,cy-z*1.4);x.lineTo(cx+z*.7,cy-z*.5);x.closePath();x.fillStyle="#fff";x.fill();
  if(b.o===V.me||s>2)pill(x,nf(b.n),cx,cy-z*2.2,"rgba(16,24,38,.85)",9)}
 /* füzeler: yay, duman izi, hedef halkası */
 for(const ms of g.mis){const f=clamp(solo?ms.f+(now_-(V.stepAt||now_))/ms.dur:(now_-ms.rt)/ms.dur,0,1);const ax=X(ms.from),ay=Y(ms.from),bx=X(ms.to),by=Y(ms.to),d=Math.hypot(bx-ax,by-ay),h=d*.32;
  const pt=t=>[ax+(bx-ax)*t,ay+(by-ay)*t-Math.sin(Math.PI*t)*h];const R=NUK[ms.k].r*s;
  x.setLineDash([6,5]);x.beginPath();x.arc(bx,by,Math.max(8,R),0,7);x.lineWidth=2;x.strokeStyle=`rgba(255,60,60,${.5+.4*Math.sin(now_/120)})`;x.stroke();x.setLineDash([]);
  x.beginPath();x.moveTo(bx-8,by);x.lineTo(bx+8,by);x.moveTo(bx,by-8);x.lineTo(bx,by+8);x.stroke();
  for(let i=14;i>=1;i--){const tt=f-i*.012;if(tt<0)continue;const[px,py]=pt(tt);x.beginPath();x.arc(px,py,2+i*.55,0,7);x.fillStyle=`rgba(225,225,225,${.42*(1-i/15)})`;x.fill()}
  if(f<.12){const q=f/.12;x.beginPath();x.arc(ax,ay,6+q*18,0,7);x.fillStyle=`rgba(255,200,120,${.6*(1-q)})`;x.fill()}
  const[hx,hy]=pt(f);const glow=x.createRadialGradient(hx,hy,0,hx,hy,10);glow.addColorStop(0,"rgba(255,240,200,.95)");glow.addColorStop(1,"rgba(255,120,40,0)");x.fillStyle=glow;x.beginPath();x.arc(hx,hy,10,0,7);x.fill();
  x.beginPath();x.arc(hx,hy,3.5,0,7);x.fillStyle="#ff6b35";x.fill()}
 /* patlamalar */
 let flash=0;
 for(const b of g.booms){const age=b.rt!=null?now_-b.rt:g.t-b.t+(now_-(V.stepAt||now_));const key=b.c+":"+Math.round(b.t/1000)+(b.air?"a":"");
  if(!V.seenBoom.has(key)){V.seenBoom.add(key);const red=typeof kbReduce==="function"&&kbReduce();if(!b.air&&!red)V.shake=b.r>12?30:b.r>8?22:15;vib&&vib(b.air?30:[80,40,120]);if(V.mode==="play")SND.play(b.air?"air":b.r>=10?"nuke":"boom")}
  if(b.air){drawAir(x,b,age,ox,oy,s,W);continue}
  const cx=X(b.c),cy=Y(b.c),R=Math.max(18,b.r*s*1.5);if(age<380&&cx>-R*3&&cy>-R*3&&cx<V.cw+R*3&&cy<V.ch+R*3)flash=Math.max(flash,(1-age/380)*(b.r>=10?.85:.6));
  drawNuke(x,cx,cy,R,age,b.r)}
 if(flash>0&&!(typeof kbReduce==="function"&&kbReduce())){x.fillStyle=`rgba(255,255,245,${flash})`;x.fillRect(0,0,V.cw,V.ch)}
 /* dokunma halkaları */
 V.pings=V.pings.filter(p=>now_-p.t<450);for(const p of V.pings){const q=(now_-p.t)/450;x.beginPath();x.arc(X(p.c),Y(p.c),6+q*22,0,7);x.lineWidth=2.5;x.strokeStyle=`rgba(255,209,102,${1-q})`;x.stroke()}}
/* yer patlaması: ateş topu, şok dalgası, yükselen mantar bulutu, yanık iz ve saçılan parçalar */
function drawNuke(x,cx,cy,R,age,r){const big=r>=10;
 if(age<9000){const k=clamp(age/9000,0,1);const sg=x.createRadialGradient(cx,cy,0,cx,cy,R*1.05);sg.addColorStop(0,`rgba(40,25,15,${.45*(1-k)})`);sg.addColorStop(1,"rgba(40,25,15,0)");x.fillStyle=sg;x.beginPath();x.arc(cx,cy,R*1.05,0,7);x.fill()}
 if(age<1900){const q=age/1900;x.beginPath();x.arc(cx,cy,R*(.3+q*2.4),0,7);x.lineWidth=2+4*(1-q);x.strokeStyle=`rgba(255,255,255,${.75*(1-q)})`;x.stroke();
  x.beginPath();x.arc(cx,cy,R*(.2+q*1.9),0,7);x.lineWidth=1.5;x.strokeStyle=`rgba(255,200,140,${.4*(1-q)})`;x.stroke()}
 if(age<1500){for(let i=0;i<18;i++){const a=i*2.39996,sp=(.6+((i*37)%10)/10)*R*1.6,q=age/1500;const px=cx+Math.cos(a)*sp*q,py=cy+Math.sin(a)*sp*q*.6-Math.sin(q*Math.PI)*R*.4;x.fillStyle=`rgba(255,${150+((i*53)%100)},60,${1-q})`;x.fillRect(px-1.5,py-1.5,3,3)}}
 const fb=clamp(age/900,0,1),fade=age<2500?1:clamp(1-(age-2500)/2500,0,1);
 if(fade>0){const rf=R*(.35+.6*fb);const g2=x.createRadialGradient(cx,cy,0,cx,cy,rf);g2.addColorStop(0,`rgba(255,255,235,${fade})`);g2.addColorStop(.35,`rgba(255,220,120,${.95*fade})`);g2.addColorStop(.7,`rgba(255,110,30,${.85*fade})`);g2.addColorStop(1,"rgba(150,30,10,0)");x.fillStyle=g2;x.beginPath();x.arc(cx,cy,rf,0,7);x.fill()}
 if(age>350&&age<9000){const gq=clamp((age-350)/2800,0,1),eg=1-Math.pow(1-gq,3),al=age<6000?1:clamp(1-(age-6000)/3000,0,1);const H=R*(.45+(big?1.6:1.2)*eg),top=cy-H,sw=R*(.16+.08*eg);
  const hot=clamp(1-(age-350)/3500,0,1);const st=x.createLinearGradient(cx,cy,cx,top);st.addColorStop(0,`rgba(${Math.round(120+120*hot)},${Math.round(90+60*hot)},70,${.85*al})`);st.addColorStop(1,`rgba(${Math.round(110+120*hot)},${Math.round(100+40*hot)},90,${.9*al})`);
  x.fillStyle=st;x.beginPath();x.moveTo(cx-sw*1.4,cy);x.quadraticCurveTo(cx-sw*.6,cy-H*.5,cx-sw*.7,top+R*.1);x.lineTo(cx+sw*.7,top+R*.1);x.quadraticCurveTo(cx+sw*.6,cy-H*.5,cx+sw*1.4,cy);x.closePath();x.fill();
  if(big&&eg>.5){x.beginPath();x.ellipse(cx,cy-H*.5,sw*2.4,sw*.6,0,0,7);x.strokeStyle=`rgba(235,235,235,${.45*al*(eg-.5)*2})`;x.lineWidth=2.5;x.stroke()}
  const rx=R*(.32+.6*eg),ry=rx*.55;const cg=x.createRadialGradient(cx,top,rx*.1,cx,top,rx);cg.addColorStop(0,`rgba(${Math.round(255*hot+150*(1-hot))},${Math.round(180*hot+140*(1-hot))},${Math.round(90*hot+130*(1-hot))},${.95*al})`);cg.addColorStop(.7,`rgba(${Math.round(200*hot+120*(1-hot))},${Math.round(90*hot+110*(1-hot))},${Math.round(40*hot+105*(1-hot))},${.9*al})`);cg.addColorStop(1,`rgba(90,85,85,${.0})`);
  x.fillStyle=cg;x.beginPath();x.ellipse(cx,top,rx,ry,0,0,7);x.fill();
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2+age/4000;const bx=cx+Math.cos(a)*rx*.7,by=top+Math.sin(a)*ry*.55;x.beginPath();x.arc(bx,by,rx*.32,0,7);x.fillStyle=`rgba(${Math.round(150+80*hot)},${Math.round(120+40*hot)},${Math.round(105)},${.35*al})`;x.fill()}}}
/* havada vurulan bomba: füzenin o anki yerinde ve yüksekliğinde küçük ateş topu, duman ve düşen kıvılcımlar; SAM'dan gelen önleyici izi */
function drawAir(x,b,age,ox,oy,s,W){if(age>3000||b.ax==null)return;const px=ox+(b.ax+.5)*s,py=oy+(b.ay+.5)*s-b.ah*s,R=Math.max(10,3*s);
 if(b.sam!=null&&age<500){const sx=ox+(b.sam%W+.5)*s,sy=oy+(((b.sam/W)|0)+.5)*s;const q=age/500;x.strokeStyle=`rgba(255,255,255,${.8*(1-q)})`;x.lineWidth=2;x.beginPath();x.moveTo(sx,sy);x.lineTo(px,py);x.stroke()}
 const q=clamp(age/600,0,1),fade=clamp(1-(age-400)/2600,0,1);
 const sm=R*(1+age/900);x.beginPath();x.arc(px,py-age/120,sm,0,7);x.fillStyle=`rgba(170,170,170,${.45*fade})`;x.fill();
 if(age<900){const g2=x.createRadialGradient(px,py,0,px,py,R*(.6+q));g2.addColorStop(0,`rgba(255,255,230,${1-q*.6})`);g2.addColorStop(.5,`rgba(255,160,60,${.9*(1-q*.5)})`);g2.addColorStop(1,"rgba(200,60,20,0)");x.fillStyle=g2;x.beginPath();x.arc(px,py,R*(.6+q),0,7);x.fill()}
 for(let i=0;i<12;i++){const a=i*2.39996,v=R*1.4*(.5+((i*29)%10)/10),t=age/1000;const qx=px+Math.cos(a)*v*t,qy=py+Math.sin(a)*v*t*.5+t*t*R*2.2;x.fillStyle=`rgba(255,${180+((i*41)%70)},80,${fade})`;x.fillRect(qx-1,qy-1,2.5,2.5)}}
/* cephe çizimi: her ordu kendi tarafında, cepheye paralel sıralar halinde bayraklı birlikler (1 bayrak = 1.000 asker; çok askerde bir bayrak daha fazlasını temsil eder, en çok 24) */
function drawFronts(x,g,s,ox,oy,now_,font,mono,solo){const list=[];for(const a of g.att){if(!a.fp||a.fp.length<4)continue;const mine=a.o===V.me||a.t===V.me;if(!mine&&(s<1.1||a.t<0))continue;list.push(a)}
 list.sort((p,q)=>((q.o===V.me||q.t===V.me)-(p.o===V.me||p.t===V.me))||(q.n+(q.d||0))-(p.n+(p.d||0)));
 const tw=clamp(9+s*1.4,13,22),th=tw*.68,sp=tw*1.25,red=typeof kbReduce==="function"&&kbReduce(),boxes=[];
 for(const a of list.slice(0,V.cw<600?5:10)){const A=g.pl[a.o],T=a.t>=0?g.pl[a.t]:null,fp=a.fp,P=fp.length/4;
  let cx=0,cy=0,mx=0,my=0;for(let i=0;i<P;i++){cx+=fp[i*4];cy+=fp[i*4+1];mx+=fp[i*4+2];my+=fp[i*4+3]}cx=ox+(cx/P+.5)*s;cy=oy+(cy/P+.5)*s;let ml=Math.hypot(mx,my);if(ml<.01){mx=1;my=0;ml=1}mx/=ml;my/=ml;
  if(cx<-160||cy<-160||cx>V.cw+160||cy>V.ch+160)continue;const ux=-my,uy=mx;let lo=1e9,hi=-1e9;for(let i=0;i<P;i++){const px=(fp[i*4]+.5)*s+ox-cx,py=(fp[i*4+1]+.5)*s+oy-cy,pr=px*ux+py*uy;if(pr<lo)lo=pr;if(pr>hi)hi=pr}
  const span=clamp(hi-lo,sp*3,sp*9),perRow=Math.max(3,Math.floor(span/sp)),mid=(lo+hi)/2;
  const mineF=a.o===V.me||a.t===V.me;const army=(Q,n,dir,inc)=>{if(!Q||n<1)return;const k=Math.min(mineF?24:12,Math.max(1,Math.ceil(n/1000))),rows=Math.ceil(k/perRow),fc=Q.flag?flagCanvas(Q.flag,24,16):null;
   for(let i=0;i<k;i++){const row=(i/perRow)|0,col=i%perRow,inRow=Math.min(perRow,k-row*perRow),o=(col-(inRow-1)/2)*sp+mid+(row%2?sp*.35:0),back=(row+.9)*sp*.95;
    const march=red?0:Math.sin(now_/220+i*1.3+(dir>0?1.5:0))*1.4;const px=cx+ux*o+mx*back*dir,py=cy+uy*o+my*back*dir+(red?0:Math.abs(march)*-.6);
    x.fillStyle="rgba(0,0,0,.3)";x.beginPath();x.ellipse(px,py+th*.55,tw*.45,tw*.14,0,0,7);x.fill();
    x.strokeStyle="rgba(25,20,15,.9)";x.lineWidth=1.4;x.beginPath();x.moveTo(px-tw/2,py-th+march*.3);x.lineTo(px-tw/2,py+th*.55);x.stroke();
    if(fc)x.drawImage(fc,px-tw/2,py-th+march*.3,tw,th);else{x.fillStyle=Q.hex;x.fillRect(px-tw/2,py-th+march*.3,tw,th)}x.strokeStyle="rgba(255,255,255,.95)";x.lineWidth=1;x.strokeRect(px-tw/2+.5,py-th+march*.3+.5,tw-1,th-1)}
   const dist=(rows+.9)*sp*.95+tw*1.25,lx=cx+mx*dist*dir+ux*mid,ly=cy+my*dist*dir+uy*mid;const fz=clamp(12+Math.log10(n+10),13,18),t=nf(n),sub=`güç ${power(Q)}${Q.gens.length?` · ${Q.gens.length} general`:""}`;
   x.font=`900 ${fz}px ${mono}`;const w=Math.max(t.length*fz*.62+fz*1.6,fz*5.2),hh=fz*2.15,bx=[lx-w/2,ly-hh/2,lx+w/2,ly+hh/2];if(!inc&&boxes.some(u=>bx[0]<u[2]&&bx[2]>u[0]&&bx[1]<u[3]&&bx[3]>u[1]))return;boxes.push(bx);
   rr(x,lx-w/2,ly-hh/2,w,hh,8);x.fillStyle=inc?"rgba(150,18,18,.92)":"rgba(14,22,36,.88)";x.fill();x.lineWidth=2;x.strokeStyle=Q.hex;x.stroke();
   if(Q.flag)x.drawImage(flagCanvas(Q.flag,24,16),lx-w/2+5,ly-fz*.62,fz*1.05,fz*.7);else{x.fillStyle=Q.hex;x.fillRect(lx-w/2+5,ly-fz*.62,fz*1.05,fz*.7)}
   x.fillStyle="#fff";x.textAlign="center";x.textBaseline="middle";x.fillText(t,lx+fz*.5,ly-fz*.22);x.font=`700 ${Math.round(fz*.55)}px ${font}`;x.fillStyle="#c9d6e8";x.fillText(sub,lx+fz*.5,ly+fz*.55)};
  army(A,a.n,-1,a.t===V.me);if(T)army(T,a.d||0,1,false);
  /* çatışma: cephe hattında namlu ışıkları ve duman */
  if(T&&a.n>0&&(a.d||0)>0&&!red){const nfl=Math.min(5,1+Math.floor(P/2));for(let i=0;i<nfl;i++){if(Math.random()>.6)continue;const j=(Math.random()*P)|0,px=ox+(fp[j*4]+.5-fp[j*4+2]*.5)*s+(Math.random()-.5)*s*1.5,py=oy+(fp[j*4+1]+.5-fp[j*4+3]*.5)*s+(Math.random()-.5)*s*1.5;
   x.beginPath();x.arc(px,py,1.5+Math.random()*2.5,0,7);x.fillStyle=Math.random()<.5?"rgba(255,240,170,.95)":"rgba(255,150,60,.9)";x.fill();if(Math.random()<.4){x.beginPath();x.arc(px+2,py-4,3+Math.random()*5,0,7);x.fillStyle="rgba(210,210,210,.35)";x.fill()}}}}}
function wireInput(){const cv=V.cv,pts=new Map();let pinch=null,down=null,moved=0,lp=0;
 const cell=(px,py)=>{const m=G.m,x=Math.floor((px-V.ox)/V.s),y=Math.floor((py-V.oy)/V.s);return x<0||y<0||x>=m.W||y>=m.H?-1:y*m.W+x};
 const rel=e=>{V.inT=performance.now();const r=cv.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]};
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
async function createRoom(){if(!guard())return;const c=code5();const d={cp:1,host:S.uid,sc:OPT.sc,md:OPT.md,diff:OPT.diff,nb:OPT.nb,tb:OPT.tb,st:"lobby",oy:{[S.uid]:meEntry()},at:now(),up:now()};
 try{await DB.set(roomPath(c),d)}catch(e){return toast("Oda kurulamadı: "+(e.message||""))}enterRoom(c,true)}
function joinAsk(){const l=sheet("cpj","Odaya katıl",`<div class="form"><input class="cp-in" id="cpCode" maxlength="5" placeholder="KOD" autocomplete="off" style="color:var(--fg);border-color:var(--line)"><button class="btn block" id="cpJg">Katıl</button></div>`);const i=$("#cpCode",l);setTimeout(()=>i.focus(),50);
 $("#cpJg",l).onclick=()=>{const c=i.value.trim().toUpperCase();if(c.length!==5)return toast("5 harfli oda kodunu yaz.");closeLayer("cpj");CP.join(c)}}
CP.join=async function(c){if(!V)CP.open();c=String(c||"").toUpperCase();let d=null;try{d=await DB.get(roomPath(c))}catch{}if(!d||!d.cp)return toast("Böyle bir oda yok.");if(d.st!=="lobby"&&!(d.oy&&d.oy[S.uid]))return toast("Bu odada savaş başlamış.");
 try{await DB.update(roomPath(c),{oy:{[S.uid]:d.oy&&d.oy[S.uid]||meEntry()},up:now()})}catch(e){return toast("Odaya girilemedi.")}if(V.room&&V.room!==c)leaveRoom();enterRoom(c,d.host===S.uid)};
function enterRoom(c,host){stop();G=null;Object.assign(V,{room:c,host,mode:"lobby",cmdSeq:0,cmdQ:[],kn:0,lastSeq:{},myPick:null,spawnEnd:0,overShown:false,deadShown:false,feedSeen:0,prep:false});if(V.roomUn)V.roomUn();V.roomUn=DB.watchDoc(roomPath(c),d=>onRoom(d))}
function lobby(d){const r=V.root,sc=SC.find(s=>s.id===d.sc)||SC[0],oy=Object.entries(d.oy||{}).filter(([,v])=>v).sort((a,b)=>(a[1].at||0)-(b[1].at||0));
 r.innerHTML=`<div class="cp-menu"><div class="top"><span class="cp-pill cp-gl">${svg("users")}SAVAŞ ODASI</span><button class="cp-rb" data-cpleave aria-label="Odadan çık">${I("close")}</button></div>
 <h1 style="font-size:2.2rem">${esc(sc.n)}</h1><p class="sub">${d.md==="hazir"?`Hazır ülkeler · ${d.nb?`diğer ülkeler bot (${esc(DIFF[d.diff].n)})`:"diğer ülkeler boş toprak"}`:`Yeni devlet · ${d.nb?`${d.nb} ülke botu (${esc(DIFF[d.diff].n)})`:"botsuz"} · kabile ${["yok","az","çok"][d.tb||0]}`}</p>
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
 if(!G){V.prep=true;let sc,m;const hz=d.md==="hazir";try{({sc,m}=await prepare(d.sc,d.seed,hz))}catch{V.prep=false;return toast("Harita indirilemedi.")}if(!V||!V.room){return}
  const g=newGame(m,{sc:d.sc,nob:hz&&!d.nb});G=g;const oy=Object.entries(d.oy||{}).filter(([,v])=>v).sort((a,b)=>(a[1].at||0)-(b[1].at||0));const hum=oy.map(([u,v])=>({uid:u,name:v.n||"?",flag:v.f||null}));
  if(hz)setupGame(g,sc,hum,d.nb,d.diff,0,true);else setupPlayers(g,sc,hum,d.nb,d.diff,d.tb||0);V.me=g.pl.findIndex(p=>p.uid===S.uid);
  if(V.host){g.chg=new Set();if(!hz)spawnBots(g);V.cmdUn=oy.filter(([u])=>u!==S.uid).map(([u])=>DB.watchDoc(cmdPath(V.room,u),c=>hostCmds(u,c)))}
  V.prep=false;spawnPhase();if(V.host)roomSnap(true);if(V.lastDoc){d=V.lastDoc;V.lastDoc=null}}
 if(V.host)return;
 if(d.kn&&d.kf&&d.kn!==V.kn){V.kn=d.kn;rleApply(G,d.kf)}if(V.kn)decD(G,d.d);if(d.s)applySnap(G,d.s);
 if(d.se&&!V.spawnEnd&&V.mode==="spawn")V.spawnEnd=performance.now()+Math.max(0,d.se-now());
 if(d.st!=="spawn"&&V.mode==="spawn"){V.mode="play";ui();focusMe(2.2)}}
function hostSpawnTick(){const t=performance.now();if(t-(V.snapT||0)>1000){V.snapT=t;roomSnap()}if(V.spawnEnd)return;
 const hum=G.pl.filter(p=>p.uid);if(hum.every(p=>p.spawn>=0)||t-V.spawnT0>30000){V.spawnEnd=t+5000;DB.update(roomPath(V.room),{se:now()+5000}).catch(()=>{})}}
function hostCmds(u,c){if(!c||!c.q||!G)return;let q=[];try{q=JSON.parse(c.q)}catch{}const o=G.pl.findIndex(p=>p.uid===u);if(o<0)return;
 for(const k of q){if(k.s<=(V.lastSeq[u]||0))continue;V.lastSeq[u]=k.s;if(k.a==="spawn"){if(V.mode==="spawn"){if(G.hz)claim(G,G.pl[o],k.c);else spawnAt(G,G.pl[o],k.c)}continue}applyCmd(G,o,k)}}
function sendCmd(c){if(c.a==="spawn"&&V.mode!=="spawn")return;V.cmdQ.push({...c,s:++V.cmdSeq});V.cmdQ=V.cmdQ.slice(-30);DB.set(cmdPath(V.room,S.uid),{q:JSON.stringify(V.cmdQ),up:now()}).catch(()=>{});vib&&vib(10);if(c.a==="bld"||c.a==="nuk")setTool(null)}
function roomSnap(full){if(!V.room||!G||!V.host)return;const g=G;const u={st:g.over?"done":V.mode==="spawn"?"spawn":"play",s:snapOf(g),up:now()};
 if(full||!V.kn||performance.now()-V.kfT>10000||g.chg.size>9000){V.kn=(V.kn||0)+1;V.kfT=performance.now();u.kf=rleOf(g);u.kn=V.kn;g.chg.clear();u.d=""}else u.d=encD(g);
 DB.update(roomPath(V.room),u).catch(e=>console.warn("cephe",e))}
function leaveRoom(){const c=V&&V.room;if(!c)return;V.room=null;try{V.roomUn&&V.roomUn()}catch{}V.roomUn=null;(V.cmdUn||[]).forEach(f=>{try{f()}catch{}});V.cmdUn=null;
 if(V.host)DB.update(roomPath(c),{st:"over",why:"Kurucu odadan çıktı, savaş bitti.",up:now()}).catch(()=>{});else DB.update(roomPath(c),{oy:{[S.uid]:null},up:now()}).catch(()=>{});
 DB.del(cmdPath(c,S.uid)).catch(()=>{})}
CP._test={SC,FL,MAPDEF,NUK,dipPeace,dipVassal,pactOf,loadMap,loadCtry,setupGame,claim,newGame,addPlayer,setupPlayers,spawnBots,spawnAt,step,attack,attackAt,applyCmd,build,launch,lvlUp,snapOf,applySnap,rleOf,rleApply,encD,decD,labels,botThink,cap,power,troopRate,goldRate,kindOf,roomSnap:f=>roomSnap(f),G:()=>G,V:()=>V,beginWar:()=>beginWar(),setRng:s=>{rng=seeded(s)}};
})();
