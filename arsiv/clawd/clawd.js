/* Kadraj Clawd maskotu (5.0.1-6.4.4), index.html'den çıkarıldı. Bölgeler olduğu gibi; 50PIKO'nun sprite kısmı index.html'de kaldı (satranç rakibi Clawd kullanıyor). */
/*@js:50PIKO{*/
/* ===== 5.0 · Clawd: ekranda yaşayan piksel maskot =====
   Clawd: Kadraj'da yaşayan, kendi karakteri olan oyuncu, şakacı piksel yaratık.
   - Çizim: 23x18'lik ızgarada SVG <rect> pikselleri (cwPaint → cwSvg, önbellekli), crispEdges. Piksel boyu cihazın
     piksel oranına göre tam sayıya yuvarlanır (CW.U). Pozlar: idle, blink, walk, jump, happy, surprised, talk, sleep,
     cry, dizzy (yıldız + şişlik), type (uçuşan kod), shield, wave, sit, climb, lookup, shrug.
   - Dünya: #shell dikdörtgeni. Zemin = dokun (#dock nav) üstü, tavan = #top altı (Vizör'de üst çubuk saklanınca kabuk üstü).
     Yükseğe çıkmak için kod bloklarından merdiven/basamak yazar (cwStairs, cwLadder), tavanda baş aşağı yürür, aşağı zıplar.
   - Döngü: tek requestAnimationFrame (cwTick); bekleme ve hareketler CW.clock'a bağlı tween'ler (cwTween). Görünmüyorken
     400 ms'de bir yavaş denetim, sekme gizliyken hiç çalışmaz. Etkinlikler async (cwRun); yenisi başlayınca eskisi CW_STOP ile kesilir.
   - Saklanır: chat, chessgame, edit, admin (Klakette yalnızca köşesinde görünür); arama/mini arama; #overlay'de katman; yazı kutusu odaktayken ya da klavye açıkken.
     Uygulamanın tıklanabilir öğesinin üstündeyse kendisi de tıklanmaz (cwPass, .pt).
   - Gece (5.1: 00-07) yatağında uyur; açılışta/dönüşte irkilir, yataktan düşer, başını vurur. Yatak sürüklenirse geri ışınlar.
   - 3+ hızlı dokunuş ya da sert savurma: kod kalkanı. Menü: Soğuk espri, Bir ipucu, Clawd'a sor, Gitar çal/Dans et, Işık, Biraz uyu, Clawd'ı gizle.
   - Clawd'a sor: tamamen çevrimdışı bilgi tabanı (CW_KB, Türkçe ve harf işaretinden bağımsız). Bilmiyorsa komik bir dille
     söyler ve soğuk bir espri anlatır (actDunno). Yapay zekâ köprüsü (kAI) Clawd tarafından kullanılmaz.
   - Ses: WebAudio piksel konuşma sesleri (cwBlip), yalnızca kullanıcı dokunuşundan sonra; Ayarlar > Görünüm > Clawd sesleri.
   - Ayarlar: settings.clawd, settings.clawdSound (varsayılan açık). vSettings sarıldı (vSettingsBaseCW), kbOnFlag sarıldı (kbOnFlagBaseCW).
   - Ayrıca sarıldı: toast (toastBaseCW, zıplar), chOver (chOverBaseCW, kazanınca dans).
   - Test: CLAWD.debug (setHour, fast, info, tap, hit, ask, bedDrag, act, pose, idle ...). */
Object.assign(IP,{clawd:'<path d="M6.5 5.5h11v8h-11zM2.5 9h4M17.5 9h4M7.5 13.5v4M10.5 13.5v3M13.5 13.5v3M16.5 13.5v4"/><path d="M9.5 8v1.4M14.5 8v1.4"/>'});

/* --- sprite --- */
const CW_GW=23,CW_GH=18,CW_Y=3;
const CW_COL={1:"#D97757",2:"#BE684D",3:"#171310",4:"#F4A48E",5:"#F0A39A",6:"#26201C",7:"#5A4E46",8:"#F6F0E6",9:"#C9955F",10:"#7A726B",11:"#6B4428",13:"#3E6FD8",14:"#2A4FA8",18:"#B9B0A2"};
const CW_SVG=new Map();
/* 5.1 · sahne eşyaları: elektro gitar (gövde sol altta, sap sağa yukarı) ve küçük kitap */
function cwGuitar(R,Y){R(3,Y+7,4,1,6);R(2,Y+8,7,1,6);R(1,Y+9,8,1,6);R(1,Y+10,9,1,6);R(1,Y+11,9,1,6);R(2,Y+12,7,1,6);R(3,Y+13,5,1,6);
 R(3,Y+7,2,1,7);R(2,Y+8,1,1,7);R(1,Y+9,1,2,7);
 R(3,Y+9,3,3,8);R(4,Y+9,2,1,10);R(4,Y+11,2,1,10);R(7,Y+10,1,2,10);
 for(let x=9;x<=19;x++){const y=Y+9-Math.floor((x-9)/3);R(x,y,1,2,9);if(x%3===1)R(x,y,1,1,11)}
 R(20,Y+4,3,2,9);R(20,Y+3,1,1,11);R(22,Y+3,1,1,11)}
function cwBook(R,Y,flip){R(7,Y+6,11,5,13);R(8,Y+6,4,4,8);R(13,Y+6,4,4,8);R(12,Y+6,1,5,14);R(7,Y+10,11,1,14);
 const ln=flip?[[9,7],[14,8]]:[[9,7],[9,8],[14,7],[14,8]];for(const[x,dy]of ln)R(x,Y+dy,2,1,18)}
function cwPaint(sp){const g=[];for(let y=0;y<CW_GH;y++)g.push(new Array(CW_GW).fill(0));
 const R=(x,y,w,h,c)=>{for(let j=y;j<y+h;j++)if(j>=0&&j<CW_GH)for(let i=x;i<x+w;i++)if(i>=0&&i<CW_GW)g[j][i]=c};
 const Y=CW_Y,K=3;
 const leg=(x,c,lift,dx)=>R(x+(dx||0),Y+12,2,lift?2:3,c);const lg=sp.legs||"stand";
 if(lg==="w1"){leg(4,2);leg(8,1,1,1);leg(14,1);leg(18,1,1,1)}
 else if(lg==="w2"){leg(4,2,1,1);leg(8,1);leg(14,1,1,1);leg(18,1)}
 else if(lg==="tuck"){R(4,Y+12,2,1,2);R(8,Y+12,2,1,1);R(14,Y+12,2,1,1);R(18,Y+12,2,1,1)}
 else if(lg==="spread"){leg(3,2);leg(7,1);leg(15,1);leg(19,1)}
 else if(lg==="dang1"||lg==="dang2"){const a=lg==="dang1"?2:3,b=lg==="dang1"?3:2;R(4,Y+12,2,a,2);R(8,Y+12,2,b,1);R(14,Y+12,2,a,1);R(18,Y+12,2,b,1)}
 else if(lg!=="none"){leg(4,2);leg(8,1);leg(14,1);leg(18,1)}
 R(4,Y,3,12,2);R(7,Y,13,12,1);
 if(sp.prop==="guitar")cwGuitar(R,Y);
 const ar=sp.arms||"down";
 if(ar==="g1"||ar==="g2"){const yy=Y+(ar==="g1"?8:10);R(0,yy-1,2,3,2);R(2,yy,4,2,2);R(20,Y+6,3,3,1)}
 else if(ar==="rd"){R(4,Y+7,3,3,2);R(17,Y+7,3,3,1)}
 else{const am={down:[0,0],up:[-4,-4],w1:[0,-5],w2:[0,-2],t1:[1,2],t2:[2,1],sh:[-2,-2],c1:[-5,0],c2:[0,-5],sg:[-3,-3],tk:[0,-3],hi:[-5,-5]}[ar]||[0,0];
  R(0,Y+4+am[0],3,4,2);R(3,Y+4+am[0],4,4,1);R(20,Y+4+am[1],3,4,1)}
 const lx=sp.lx||0;
 const eye=x0=>{const x=x0+lx;switch(sp.eyes){
  case"blink":case"closed":R(x,Y+3,2,1,K);break;
  case"happy":R(x,Y+2,2,1,K);R(x-1,Y+3,1,1,K);R(x+2,Y+3,1,1,K);break;
  case"wide":R(x,Y+1,2,3,K);break;
  case"x":R(x,Y+1,1,1,K);R(x+2,Y+1,1,1,K);R(x+1,Y+2,1,1,K);R(x,Y+3,1,1,K);R(x+2,Y+3,1,1,K);break;
  case"sad":R(x,Y+3,2,1,K);break;
  case"up":R(x,Y+1,2,2,K);break;
  case"down":R(x,Y+3,2,2,K);break;
  default:R(x,Y+2,2,2,K)}};
 eye(9);eye(17);
 if(sp.eyes==="sad"){R(8,Y+1,2,1,K);R(10,Y,2,1,K);R(16,Y,2,1,K);R(18,Y+1,2,1,K)}
 if(sp.brow==="mad"){R(8,Y,2,1,K);R(10,Y+1,1,1,K);R(17,Y+1,1,1,K);R(18,Y,2,1,K)}
 const M={o:[[13,6,2,2]],t1:[[12,6,4,1]],t2:[[13,6,2,2]],smile:[[12,6,1,1],[15,6,1,1],[13,7,2,1]],frown:[[13,6,2,1],[12,7,1,1],[15,7,1,1]],wob:[[12,7,1,1],[13,6,1,1],[14,7,1,1],[15,6,1,1]],flat:[[12,7,4,1]],yawn:[[13,5,2,3]]}[sp.mouth];
 if(M)for(const[a,b,c,d]of M)R(a,Y+b,c,d,K);
 if(sp.blush){R(8,Y+5,2,1,5);R(18,Y+5,2,1,5)}
 if(sp.bump){R(12,Y-2,3,2,4);R(13,Y-3,1,1,4)}
 if(sp.prop==="book"||sp.prop==="book2")cwBook(R,Y,sp.prop==="book2");
 return g}
function cwSvg(sp){const k=[sp.eyes,sp.mouth,sp.arms,sp.legs,sp.lx,sp.blush,sp.bump,sp.brow,sp.prop].join("|");let s=CW_SVG.get(k);if(s)return s;
 const g=cwPaint(sp);let r="";
 for(let y=0;y<CW_GH;y++){let x=0;while(x<CW_GW){const c=g[y][x];if(!c){x++;continue}let e=x+1;while(e<CW_GW&&g[y][e]===c)e++;r+=`<rect x="${x}" y="${y}" width="${e-x}" height="1" fill="${CW_COL[c]}"/>`;x=e}}
 s=`<svg viewBox="0 0 ${CW_GW} ${CW_GH}" shape-rendering="crispEdges" aria-hidden="true">${r}</svg>`;if(CW_SVG.size>500)CW_SVG.clear();CW_SVG.set(k,s);return s}
/* yatak: 32x16 ızgara; arka (başlık, şilte, yastık) ve ön (yorgan, ayak ucu) iki katman */
function cwBedSvg(front){const W=32,H=16;const px=[];const R=(x,y,w,h,c)=>px.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`);
 const wd="#9A6A45",wk="#74482C",wl="#B88358";
 if(!front){R(0,1,3,15,wd);R(0,0,3,1,wl);R(0,1,1,15,wk);R(3,9,29,4,"#F3ECE2");R(3,12,29,1,"#D8CFC2");R(3,6,7,3,"#FFFFFF");R(3,8,7,1,"#E3DBD0");R(4,13,2,3,wk);R(28,13,2,3,wk)}
 else{R(9,6,21,6,"#5E7FD6");R(9,6,21,1,"#7B98E4");R(12,8,2,2,"#4A69BE");R(18,9,2,2,"#4A69BE");R(24,8,2,2,"#4A69BE");R(9,11,21,1,"#4A69BE");R(29,4,3,12,wd);R(29,3,3,1,wl);R(31,4,1,12,wk)}
 return`<svg viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges" aria-hidden="true">${px.join("")}</svg>`}
const CW_ZSVG=`<svg viewBox="0 0 5 5" shape-rendering="crispEdges" aria-hidden="true"><path d="M0 0h5v1H0zM3 1h1v1H3zM2 2h1v1H2zM1 3h1v1H1zM0 4h5v1H0z" fill="currentColor"/></svg>`;
const CW_STAR=`<svg viewBox="0 0 5 5" shape-rendering="crispEdges" aria-hidden="true"><path d="M2 0h1v5H2zM0 2h5v1H0z" fill="#FFC93C"/><path d="M2 2h1v1H2z" fill="#FFF3B0"/></svg>`;
const CW_BHEART=`<svg class="cw-bh" viewBox="0 0 11 10" shape-rendering="crispEdges" aria-hidden="true"><path d="M1 1h3v1H1zM7 1h3v1H7zM0 2h5v3H0zM6 2h5v3H6zM1 5h4v1H1zM6 5h4v1H6zM2 6h3v1H2zM6 6h3v1H6zM3 7h2v1H3zM6 7h1v1H6zM4 8h1v1H4z" fill="#E5484D"/><path d="M1 2h1v1H1z" fill="#FF9A9D"/></svg>`;

/* --- metinler --- */
const CW_JOKES=[
 "Adamın biri klavyeye basmış.|Tuş olmuş.",
 "Adamın biri ekrana çok yakından bakmış.|Piksel piksel olmuş.",
 "Saat neden hapse girmiş?|Zamanı öldürmüş.",
 "Limon neden toplantıya geç kalmış?|Yolda sıkışmış.",
 "Silgi neden iyi bir arkadaştır?|Hatalarını birlikte siler.",
 "Merdiven neden hep yorgun?|Herkes onu basamak basamak çiğniyor.",
 "Benim kod merdivenim neden hiç yıkılmıyor?|Her basamağı noktalı virgülle bitiriyorum.",
 "Balık neden internete girmiyor?|Ağa takılmaktan korkuyor.",
 "Örümcek neden web tasarımcısı olmuş?|Ağ kurmayı zaten biliyormuş.",
 "Fare neden kediden korkmuyor?|Çünkü kablosuz.",
 "Klavye neden hep sakin?|Bir Esc tuşu var, gerekince kaçıyor.",
 "Klavyenin en sevdiği yer neresi?|Space. Yani uzay.",
 "Wi-Fi neden hâlâ bekâr?|Bağlantı kurmakta zorlanıyor.",
 "Bulut depolama neden ağlamış?|Üstüne yağmur yüklemişler.",
 "Fotoğraf neden psikoloğa gitmiş?|Fazla negatif düşünüyormuş.",
 "Kadraj'daki fotoğraf neden utanmış?|Filtresiz yakalanmış.",
 "Klaket neden hep aceleci?|Çünkü kısa video, uzatmayı sevmiyor.",
 "Gitarım neden hep yorgun?|Bütün sabah tel tel dökülüyor.",
 "Çekmecem neden hiç düzenli değil?|İçinde açık kaynak kod var, herkes bir şey bırakıyor.",
 "Ampulüm neden hiç sınava çalışmıyor?|Zaten aydın.",
 "Odam neden bu kadar küçük?|Piksel başına kira ödüyorum.",
 "Anket neden hep kararsız?|Dört seçeneği var, birini seçemiyor.",
 "Benim boyum neden 23 piksel?|24 olsaydım hikâye olur, ertesi gün kaybolurdum.",
 "Programcı neden denizde batmış?|Float olacakken int olmuş.",
 "Döngü neden hiç bitmiyormuş?|Kimse ona bir break vermemiş.",
 "Değişken neden kararsız?|Let mi olsun const mu, bir türlü karar veremiyor.",
 "Fonksiyon neden partiye gitmemiş?|Çağrılmamış.",
 "Dizi neden kendini hep geride hisseder?|Çünkü saymaya sıfırdan başlıyor.",
 "CSS neden hep stresli?|Herkes ona \"şunu bir ortala\" diyor.",
 "HTML neden hiç kavga etmez?|Açtığı her etiketi kapatır.",
 "JavaScript neden yalnız kalmış?|Verdiği sözleri hep sonra tutuyor. Promise işte.",
 "Ayna neden fotoğrafçı olamamış?|Her şeyi ters görüyormuş.",
 "Güneş neden okula gitmiyor?|Zaten yeterince parlak.",
 "Ay neden diyete başlamış?|Dolunay olunca kendini şişman hissetmiş.",
 "Kitap neden üşümüş?|Kapağını açık bırakmışlar.",
 "Takvim neden endişeli?|Günleri sayılı.",
 "Çay neden hiç yalnız kalmaz?|Her zaman demli bir sohbeti olur.",
 "Ördek neden Kadraj'a üye olmuş?|Vak'ti varmış.",
 "Zürafa neden hiç selfie çekemiyor?|Kadraja sığmıyor.",
 "Kaplumbağa neden Klaket çekmiyor?|İki dakika yetmiyor, daha kadraja girmeden bitiyor.",
 "Bal neden bu kadar yapışkan?|Arkadaşlarından ayrılmak istemiyor.",
 "Uzaydaki parti neden sıkıcıymış?|Atmosfer yokmuş.",
 "Geometri öğretmeni neden tatile gidememiş?|Açısı yokmuş.",
 "Matematik kitabı neden üzgün?|Bir sürü problemi var.",
 "Lamba neden sınıf birincisi?|Parlak fikirleri var.",
 "Kare neden hep düzgün?|Çünkü dört dörtlük.",
 "Yumurta neden şaka dinlemiyor?|Gülmekten çatlamaktan korkuyor.",
 "Dondurma neden hiç sinirlenmez?|Çok soğukkanlı.",
 "Kardan adam neden soğuk espriyi sever?|Sıcak espri onu eritiyor.",
 "Penguen neden soğuk espri yapmıyor?|Zaten yeterince üşüyor.",
 "Termometre neden üniversiteye gitmiş?|Derece yapmak için.",
 "Kalorifer neden bu kadar sevilir?|Herkes ona hemen ısınır.",
 "Çaydanlık neden bu kadar konuşkan?|İçi içine sığmıyor, hep kaynıyor.",
 "Saksı neden bu kadar mutlu?|Çiçeği burnunda.",
 "Ağaç neden bilgisayardan çıkamıyor?|Kök dizinde takılı kalmış.",
 "Dalga neden kıyıya el sallar?|Eski bir dostu görmüş.",
 "Deniz neden hiç kurumaz?|Havlusu yok.",
 "Meydan neden hep kalabalık?|Herkes orada meydan okuyor.",
 "Duvar kağıdı neden yürüyüşe çıkmıyor?|Duvara yapışık kalmış.",
 "Dok neden hiç batmıyor?|Vizör'de havada yüzüyor.",
 "Satranç taşları neden tatile çıkamıyor?|Rok yapmaktan vakit kalmıyor.",
 "At neden düz gitmiyor?|Hayatı L şeklinde.",
 "Vezir neden spor salonuna gitmiyor?|Zaten her yöne gidebiliyor.",
 "Piyon neden bu kadar mutlu?|Son kareye varınca terfi almış.",
 "Kamera neden üzgün?|Herkes onu çekiyor ama kimse halini sormuyor.",
 "Pikselin biri yolda düşmüş.|Neyse ki çözünürlüğünü kaybetmemiş.",
 "Turuncu neden en güzel renk?|Çünkü ben turuncuyum. Tarafsız değilim, biliyorum.",
 "Uyku neden ayakta durmaz?|Hep çöküyor.",
 "Kahve neden polise gitmiş?|Biri onu fena halde demlemiş... yok, çalmış! Çekilmiş kahveymiş.",
 "Bilgisayar neden hapşırmış?|Bir virüs kapmış ama güvenlik duvarı ateşini düşürmüş.",
 "Pil neden partide en son ayrılır?|Enerjisi hiç bitmiyor. Şarj aletini de getirmiş.",
 "Bildirim neden hep heyecanlı?|Her haberi ilk o duyuyor."];
const CW_JOKE_TAIL=["Ba-dum-tıss!","Soğuk oldu, biliyorum. Hırkanı al.","Gülmedin mi? Kodum gülüyor ama.","Bu espri sıfır derece. Tam kıvamında.","Bunu duyan piksel bile donar. Ben dondum.","Gitarla çalsam daha komik olurdu. Belki."];
const CW_TIPS=[
 "Ortadaki + ile fotoğraf, Klaket, hikâye, not, anket ya da çizim paylaşabilirsin.",
 "Mesaja basılı tut: 6 tepki, yanıtla, ilet, düzenle, sil. Hepsi orada.",
 "Klakette ekranın sağ ya da sol kenarına basılı tutarsan video 2x hızlanır. Ben de koşarken öyle yaparım.",
 "Sohbet listesinde bir sohbete basılı tut, en fazla 3 sohbet en üstte sabit durur.",
 "Ayarlar › Görünüm'den vurgu rengini değiştirebilirsin. Turuncuyu öneririm ama tarafsız değilim.",
 "Profilinde en fazla 3 paylaşımı sabitleyebilirsin. En iyilerin en üstte dursun.",
 "Sohbetteki + menüsünden \"Sohbette ara\" ile eski mesajları bulursun.",
 "Sesli mesajı 1,5x ya da 2x hızla dinleyebilirsin. Uzun anlatan arkadaşlar için birebir.",
 "Satranç için Ayarlar › Oyunlar › Satranç'a dokun. Rota'yı yenersen zafer dansı yaparım.",
 "Yazıp göndermediğin mesaj kaybolmaz; sohbet listesinde \"Taslak\" diye bekler.",
 "Ayarlar › Medya'da \"Klaket bitince sonrakine geç\"i açarsan videolar kendiliğinden akar.",
 "Veri tasarrufu açıkken Klaketler 720p oynar, internet paketin bayram eder.",
 "Şifreni unutursan Kadraj Anahtarı ile yenileyebilirsin. Anahtar, profilindeki zarf simgesinde, Kadraj Posta'da durur.",
 "Ayarlar'ın üstünde arama kutusu var. \"tema\" yaz, anında bulur.",
 "Hikâye izlerken kalp, ateş, gülme ya da şaşırma tepkisi gönderebilirsin.",
 "Meydan'da ya da grupta mesaja @rota yazarsan Rota cevap verir.",
 "Arayüzü Ayarlar › Görünüm › Arayüz'den Vizör ya da Klasik yapabilirsin. Ben ikisinde de yaşarım.",
 "Aramadayken Küçült'e dokunursan arama küçük, sürüklenebilir bir pencereye döner.",
 "Gece yarısı odamdaki yatağıma girerim. Ama sen hâlâ ekrandaysan ben de uyumam, dans ederim!",
 "Sabahları elektro gitar çalarım. Clawd sesleri açıksa riff'i de duyarsın.",
 "Akış'ta, Keşfet'te, Sohbet'te ve profilde küçük bir odam var. Boş bir köşe bulunca hemen taşınırım.",
 "Yorumları açınca dans pistine çıkarım. Yorum yazmak bile ritimli olur.",
 "Bana arka arkaya üç kez hızlı dokunursan kalkan açarım. Denemeni önermem. Ama denersin, biliyorum.",
 "Paylaşımın beğeni alınca konfeti patlatırım. Mesaj gelince de dans ederim.",
 "Keşfet'te #etiket arayabilir, sonuçları en yeni ya da en çok beğenilen diye sıralayabilirsin.",
 "Görüntülü aramada ekranını paylaşabilirsin; bilgisayarda en rahatı."];
const CW_GREET={
 m:["Günaydın @! Bugün kod gibi bir gün olacak.","Günaydın @! Kahve mi çay mı? Ben piksel içiyorum.","Günaydın @! Güneş doğdu, ben de derlendim. Hatasız!"],
 a:["Tünaydın @! Öğle yemeğinde ne vardı? Ben bayt yedim.","Tünaydın @! Günün yarısı bitti, enerjim hâlâ yüzde yüz.","Tünaydın @! Bir fotoğraf paylaşsak mı? Işık tam kıvamında."],
 e:["İyi akşamlar @! Günün nasıl geçti?","İyi akşamlar @! Akşam ışığı fotoğraf için harikadır.","İyi akşamlar @! Birazdan pijamalarımı giyerim, haberin olsun."]};
const CW_ROUTE={
 explore:["Keşfet'e geldik! Haritam yok ama merakım var.","Burada her şeyi bulursun. Kayıp çorabım hariç.","Bir #etiket ara bakalım, ben de öğrenmek istiyorum."],
 profile_me:["Kendi profiline bakıyorsun. Ayna ayna söyle bana...","Profilin çok havalı. Ben de bir profil istiyorum ama ellerim kısa."],
 profile:["Bu profil de pek havalıymış.","Takip etsene! Ben ettim sayılır, gözüm üstünde."],
 chess:["Satranç mı? Ben piyonum ama hayallerim vezir.","Rota'yı yenersen zafer dansı yaparım, söz!"],
 activity:["Bildirimler! Kim ne beğenmiş, bakalım.","Beğeniler yağıyor. Şemsiyeni al."],
 settings:["Ayarlarla oynuyoruz ha? Beni kapatma sakın.","Görünüm bölümünde benim de bir anahtarım var. Dokunma, gıdıklanırım."],
 chats:["Sohbetler burada. Ben de çekmecemdeki lastik ördekle hep sohbet ederim.","Meydan'a bir selam bırak, herkes görsün."],
 invite:["Arkadaşlarını çağır! Daha çok kişi, daha çok espri dinleyicisi.","Davet bağlantısını gönder, ben de kapıda karşılarım."],
 feed:["Akış'a döndük. Burası benim mahallem.","Yeni kareler var mı? Bakalım bakalım."]};
const CW_HIT=["Kalkan.exe devrede!","Kalkan v2.0 yüklendi! Şimdi daha kalın.","Maksimum kalkan! Güvenlik duvarı benim."];
const CW_FORGIVE=["Tamam, affettim. Ama bir daha olmasın, piksellerim hassas.","Barıştık mı? Barıştık. Kalkanı kapatıyorum.","Neyse, kin tutmam. Belleğim zaten kısa."];
const CW_BEDLINE=["Yatağımı geri ışınladım. Ctrl+Z hayat kurtarır!","Yatak kaçırmak yok! Kodum var, korkum yok.","Gece gece ışınlanma yaptırma bana. Ama itiraf edeyim, eğlenceliydi."];

/* --- bilgi tabanı: k anahtar kelimeler (kbFold'lu), a yanıt. t: app | code | me --- */
const CW_KB=[
 {t:"me",k:["selam","merhaba","hey","selamlar","naber","gunaydin","iyi aksamlar"],a:"Selam @! Ben Clawd. Bir şey sor, bir espri iste ya da sadece takıl."},
 {t:"me",k:["nasilsin","iyi misin","keyfin nasil","ne haber"],a:"Harikayım! Piksellerim yerinde, kodum derli toplu. Sen nasılsın @?"},
 {t:"me",k:["kimsin","adin ne","sen kimsin","ismin ne","clawd kim","clawd nedir"],a:"Ben Clawd! Kadraj'da yaşayan turuncu, piksel bir yaratığım. Kendi küçük odam var: yatağım, çekmecem, bir de ampulüm. Espri, gitar ve dans benden sorulur."},
 {t:"me",k:["ailen","kardesin","nereden geldin","nasil dogdun","kim yapti"],a:"Kadraj'ın kodunda, bir noktalı virgülün yanında doğdum. Ailem mi? Piksellerim, gitarım ve çekmecemdeki lastik ördek."},
 {t:"me",k:["kac yasinda","yasin kac","yasin"],a:"Piksel yaşıyla 23 genişliğindeyim. Gerçek yaşım mı? Kadraj 5.0 kadar."},
 {t:"me",k:["nerede yasiyorsun","evin","nerede oturuyorsun","odan","oda"],a:"Akış'ta hikâyelerin yanında, Keşfet'te okul sayacının altında, Sohbet'te notların yanında, profilde de adının yanında küçük bir odam var. Sığmazsam ekranda gezerim."},
 {t:"me",k:["gitar","muzik caliyor","riff"],a:"Sabahları elektro gitar çalarım! Clawd sesleri açıksa küçük bir retro riff de duyarsın. Komşular şikâyetçi ama olsun."},
 {t:"me",k:["cekmece","cekmecende ne var"],a:"Çekmecemde neler yok ki: kayıp çorabım, lastik ördeğim, yedek noktalı virgül, bir de disket. Düzen konusunu konuşmayalım."},
 {t:"me",k:["ampul","isik","lamba"],a:"Odamın tavanında bir ampul var. Duvardaki düğmeyle açıp kapatırım. Gece uyurken kapalı, sen uyumuyorsan açık!"},
 {t:"me",k:["tesekkur","sagol","eyvallah","tesekkurler","mersi"],a:"Rica ederim @! Bir soğuk espriyi hak ettin bence."},
 {t:"me",k:["seni seviyorum","seviyorum seni","tatlisin","cok tatli"],a:"Ben de seni! Turuncu kalbimin her pikseliyle."},
 {t:"me",k:["ne yapabilirsin","neler yaparsin","ne ise yararsin","yardim"],a:"Espri yaparım, ipucu veririm, Kadraj'ı ve kodunu anlatırım. Gitar çalarım, dans ederim, kitap okurum. Bilmediğim bir şey sorarsan dürüstçe söylerim, sonra da soğuk bir espri patlatırım."},
 {t:"me",k:["yatak","uyku","nerede uyuyorsun","ne zaman uyursun"],a:"Gece yarısı yatağıma girerim, sabah 7'de kalkarım. Ama sen uyumuyorsan ben de uyumam; esnerim, dans ederim. Yatağımı sürüklersen de geri ışınlarım!"},
 {t:"me",k:["kalkan","neden kalkan","vurma"],a:"Bana arka arkaya hızlı dokunursan kalkan açarım. Kodla örülmüş, altıgen, çok şık. Ama vurmasan daha iyi."},
 {t:"me",k:["clawd kapat","clawd gizle","seni nasil kapatirim","gizle","kapat seni"],a:"Beni Ayarlar › Görünüm › Clawd'dan kapatabilirsin. Ama kapatma ne olur, çok alınırım."},
 {t:"me",k:["ses","sesini kapat","bip"],a:"Konuşurken çıkardığım bip seslerini Ayarlar › Görünüm › Clawd sesleri'nden kapatabilirsin."},
 {t:"me",k:["sikildim","canim sikiliyor"],a:"Sıkıldın mı? Hemen bir soğuk espri geliyor. Ya da bir Klaket çek, ben patlamış mısırla izlerim!"},
 {t:"app",k:["fotograf paylas","paylasim yap","gonderi","fotograf ekle","resim paylas","foto"],a:"Ortadaki + › Fotoğraf: kırp, 7 filtreden birini seç, açıklama ve konum ekle. Seçici açılmazsa Kadraj galerisi, çizim ya da yapıştırma var."},
 {t:"app",k:["klaket","flick","reels","kisa video","video paylas","video yukle"],a:"+ › Klaket. Fotoğraflardan (1-3 kare, yazı, hareket ve müzik) ya da video yükleyerek (en fazla 2 dakika, 40 MB). Kamerayla da çekebilirsin."},
 {t:"app",k:["2x","hizlandir","hizli oynat","flick hiz","klaket hiz"],a:"Klakette ekranın sağ ya da sol kenarına basılı tut: video 2x oynar. Bırakınca normale döner."},
 {t:"app",k:["sure cubugu","ileri sar","geri sar","sarma"],a:"Klaketin altındaki süre çubuğunu sürükleyerek ileri-geri sarabilirsin."},
 {t:"app",k:["sonrakine gec","otomatik kaydir","sonraki flick","sonraki klaket"],a:"Ayarlar › Medya ve dokunuş › \"Klaket bitince sonrakine geç\". Video bitince kendiliğinden kayar."},
 {t:"app",k:["hikaye","story","hikayem"],a:"Akış'ın üstündeki Hikâyen balonundaki + ile eklersin. Üstüne yazı koyabilirsin, 24 saat görünür. Yanıtlar mesaj olarak gelir."},
 {t:"app",k:["hikaye tepki","hikayeye tepki"],a:"Hikâye izlerken alttaki kalp, ateş, gülme ya da şaşırma tepkilerinden birine dokun; sahibine mesaj olarak gider."},
 {t:"app",k:["anket","oylama"],a:"+ › Anket: bir soru ve 2-4 seçenek yaz. Arkadaşların oy verir, sonuçlar canlı değişir."},
 {t:"app",k:["cizim","ciz","parmakla"],a:"+ › Çizim ile parmağınla çizip paylaşabilirsin. Benim portremi çizersen çok sevinirim."},
 {t:"app",k:["renkli not","not paylas","yazi paylas"],a:"+ › Not: renkli bir zemin üstüne yazı paylaşırsın. Kısa ve öz sözler için birebir."},
 {t:"app",k:["profil notu","not birak","24 saatlik not"],a:"Sohbet listesinin üstündeki notlar şeridinden 24 saatlik kısa bir not bırakabilirsin; arkadaşların görür."},
 {t:"app",k:["begen","begeni","cift dokun","kalp"],a:"Paylaşıma çift dokun ya da kalbe bas: beğenirsin. Beğeni sayılarını Ayarlar › Gizlilik'ten gizleyebilirsin."},
 {t:"app",k:["yorum"],a:"Paylaşımın altındaki baloncuğa dokun, yorum yaz. Yorumları da beğenebilirsin."},
 {t:"app",k:["kaydet","kaydedilen","yer imi"],a:"Paylaşımdaki kaydet simgesine dokun; profilindeki Kaydedilenler sekmesinde durur."},
 {t:"app",k:["sabitle","profil sabitle","paylasim sabitle"],a:"Paylaşımın ... menüsünden Sabitle: profilinde en fazla 3 paylaşım en üstte durur. Sohbetleri de basılı tutarak sabitleyebilirsin."},
 {t:"app",k:["sesli mesaj","ses kaydi","mikrofon"],a:"Mesaj kutusu boşken mikrofona dokun, konuş, gönder. En fazla 2 dakika. Dinlerken 1x, 1,5x, 2x seçebilirsin."},
 {t:"app",k:["arama","goruntulu","sesli arama","ara","telefon"],a:"Birebir sohbetin üstündeki telefon ya da kamera düğmesine dokun. Arkadaşın uygulamayı açıkken çalar. Aramada ekran paylaşımı ve Küçült de var."},
 {t:"app",k:["ekran paylas","ekran paylasimi"],a:"Görüntülü aramada ekran paylaşımı düğmesine dokun. Bilgisayarda Chrome, Edge, Firefox ya da Safari ile çalışır."},
 {t:"app",k:["kucult","mini pencere","yuzen pencere"],a:"Aramada Küçült'e dokununca arama küçük, sürüklenebilir bir pencereye döner; uygulamada gezmeye devam edersin."},
 {t:"app",k:["meydan","ortak sohbet"],a:"Meydan, herkesin ortak canlı sohbeti. Sohbet sekmesinin üstünde. @rota yazarsan Rota da katılır."},
 {t:"app",k:["grup","grup kur","grup sohbet"],a:"Sohbet › Grup kur: ad ver, kişileri seç. Grup ayarlarından üye ekleyip çıkarabilirsin."},
 {t:"app",k:["davet","arkadas ekle","arkadaslarimla","arkadas davet"],a:"Sohbet › Davet et (ya da Ayarlar › Yardım). Bağlantıyı gönder; arkadaşın hesap açar, seni Keşfet'te bulup takip eder."},
 {t:"app",k:["takip","takipci","takip et"],a:"Profilde Takip et'e dokun. Gizli hesaplarda paylaşımları yalnızca takipçiler görür."},
 {t:"app",k:["tepki","emoji","mesaja tepki"],a:"Mesaja basılı tut: üstte 6 tepki çıkar (kalp, gülme, şaşırma, üzülme, ateş, alkış). Çift dokunuş kalp bırakır."},
 {t:"app",k:["ilet","mesaj ilet","yonlendir"],a:"Mesaja basılı tut › İlet: başka bir sohbete ya da Meydan'a gönderirsin. Mesajda \"İletildi\" yazar."},
 {t:"app",k:["sohbette ara","eski mesaj","mesaj ara"],a:"Sohbetteki + menüsünden \"Sohbette ara\". Eski mesajları kelimeyle bulursun."},
 {t:"app",k:["taslak"],a:"Yazıp çıktığın mesaj taslak olarak saklanır; sohbet listesinde \"Taslak:\" diye görünür."},
 {t:"app",k:["mesaj sil","mesaj duzenle","duzenle","geri al"],a:"Mesaja basılı tut: düzenle, benden sil ya da herkesten sil seçenekleri çıkar."},
 {t:"app",k:["sohbet temasi","duvar kagidi","balon rengi","arka plan"],a:"Sohbetin üstündeki resim simgesine dokun. \"Herkes için\" seçersen tema sohbetteki herkeste değişir, \"Yalnızca bende\" sadece sende."},
 {t:"app",k:["tema","karanlik","koyu mod","acik mod","gece modu","dark"],a:"Ayarlar › Görünüm › Tema: Açık, Koyu ya da Sistem."},
 {t:"app",k:["vurgu","renk","vurgu rengi"],a:"Ayarlar › Görünüm › Vurgu rengi. Otomatik seçersen yöneticinin ortak teması da gelir."},
 {t:"app",k:["yazi boyutu","buyuk yazi","font"],a:"Ayarlar › Görünüm › Yazı boyutu: Normal, Büyük ya da Çok büyük."},
 {t:"app",k:["vizor","klasik","arayuz","yeni gorunum","dok"],a:"Vizör, Kadraj 5.0'ın yeni görünümü: yüzen üst çubuk, hap şeklinde dok, ortada deklanşör. Ayarlar › Görünüm › Arayüz'den Klasik'e dönebilirsin."},
 {t:"app",k:["animasyon","hareket azalt","animasyonlari azalt"],a:"Ayarlar › Görünüm › Animasyonları azalt. Açarsan ben de köşede sakin sakin otururum."},
 {t:"app",k:["gizli hesap","hesabi gizle","kilitli hesap"],a:"Ayarlar › Gizlilik › Gizli hesap. Paylaşımlarını ve hikâyelerini yalnızca takipçilerin görür."},
 {t:"app",k:["aktiflik","cevrimici","yesil nokta","son gorulme"],a:"Yeşil nokta şu an açık olanı gösterir. Ayarlar › Gizlilik › Aktiflik durumu'nu kapatırsan kimse seni görmez, sen de kimseyi."},
 {t:"app",k:["okundu","goruldu"],a:"Ayarlar › Gizlilik › Okundu bilgisi. Kapalıysa karşı taraf mesajını okuduğunu görmez."},
 {t:"app",k:["bildirim","bildirimler","uyari"],a:"Ayarlar › Bildirimler: mesaj, beğeni, yorum ve yeni paylaşım uyarılarını ayrı ayrı açıp kapatabilirsin. Telefon bildirimleri için izin ver."},
 {t:"app",k:["veri tasarrufu","internet","kota","mobil veri"],a:"Ayarlar › Medya ve dokunuş › Veri tasarrufu: Klaketler önceden yüklenmez ve 720p oynar."},
 {t:"app",k:["sifre","sifremi unuttum","parola","sifre degistir"],a:"Girişte Şifremi unuttum › Kadraj Anahtarı ile yenile. Şifreni değiştirmek için Ayarlar › Hesap › Şifreyi değiştir."},
 {t:"app",k:["anahtar","kadraj anahtari","posta","kadraj posta","zarf"],a:"Kadraj Anahtarın, profilindeki zarf simgesinde, Kadraj Posta'da durur. Şifreni unutursan onunla yenilersin."},
 {t:"app",k:["kullanici adi","giris","nasil girerim","oturum ac"],a:"Girişte kullanıcı adını ya da e-postanı yazabilirsin. Beni hatırla açıksa bu cihazda şifre sorulmaz."},
 {t:"app",k:["cikis","cikis yap","oturumu kapat"],a:"Ayarlar › Oturum › Çıkış yap. Ama gitme, daha anlatacak esprim var."},
 {t:"app",k:["hesap sil","hesabimi sil","hesabi sil"],a:"Ayarlar › Gelişmiş › Hesabı sil. Profil, paylaşımlar ve hikâyeler kalıcı silinir; iyi düşün."},
 {t:"app",k:["satranc","chess","sah mat"],a:"Ayarlar › Oyunlar. Rota'ya karşı 5 seviye, arkadaşına davet, aynı telefonda iki kişi. Kazanırsan dans ederim!"},
 {t:"app",k:["cocuk modu","cocuk"],a:"Çocuk Modu'nda yazılar süzülür, yabancılar mesaj atamaz, Meydan kapalıdır. Paylaşırken \"Çocuk modundakiler göremez\" de seçebilirsin."},
 {t:"app",k:["kesfet","etiket","hashtag","arama kutusu","kisi ara"],a:"Keşfet'in üstündeki kutuya kişi ya da #etiket yaz. Süzgeçlerle kişi, kare, Klaket ya da etiket seç; en yeni ya da en çok beğenilen diye sırala."},
 {t:"app",k:["ana ekran","yukle","uygulama olarak","kur"],a:"Ayarlar › Uygulama ve depolama › Ana ekrana ekle. Kadraj simgesiyle tam ekran açılır."},
 {t:"app",k:["onbellek","cache","depolama","yer kapliyor"],a:"Ayarlar › Uygulama ve depolama › Önbelleği temizle. Hesabın, mesajların ve ayarların yerinde kalır."},
 {t:"app",k:["guncelle","guncelleme","yeni surum","surum"],a:"Kadraj yeni sürümü fark edince uygun bir anda kendini yeniler. Ayarlar › Hakkında › Güncellemeleri denetle ile de bakabilirsin."},
 {t:"app",k:["neler yeni","yenilikler"],a:"Ayarlar › Yardım › Neler yeni? Orada en son eklenenleri görürsün. Ben de yeniyim, sayılır mıyım?"},
 {t:"app",k:["rota","asistan","rehber"],a:"Rota, Kadraj'ın rehberi. Sohbet sekmesinde bulursun. Ben de onun ekranda gezen, espri yapan arkadaşıyım."},
 {t:"app",k:["sikayet","bildir","raporla"],a:"Paylaşımın ... menüsünden Şikayet et. Yönetici bakar."},
 {t:"app",k:["dürt","durt","nudge"],a:"Sohbet listesindeki \"Şu an burada\" bölümünde Dürt'e dokun; arkadaşının telefonu titrer."},
 {t:"code",k:["hangi dil","nasil yazildi","kutuphane","framework","index html","tek dosya"],a:"Kadraj tek bir index.html dosyası: HTML, CSS ve saf JavaScript. Hiç kütüphane yok, kod \"use strict\" ile başlıyor. Ben de bu dosyanın en altında yaşıyorum!"},
 {t:"code",k:["veritabani","firebase","firestore","veri nerede","localdb","db get"],a:"Bulutta Firebase Firestore var. Kod DB adlı ortak bir arayüzle konuşur: get, set, update, del, watchCol, watchDoc. Demo modunda aynı arayüzü LocalDB, localStorage üzerinden verir."},
 {t:"code",k:["render","cizim","yonlendirme","router","go fonksiyonu","sayfa nasil"],a:"render(), S.route.name'e bakıp vFeed, vExplore, vProfile gibi bir görünüm fonksiyonunu çağırır, sonra afterRender bağlantıları kurar. Sayfa değiştirmek go(ad, parametre), geri dönmek back()."},
 {t:"code",k:["durum","state","s nesnesi","global durum"],a:"Uygulamanın durumu S adlı tek nesnede: S.uid, S.route, S.posts, S.chats, S.profiles gibi. Ayarlar settings nesnesinde, localStorage'da kadraj_settings anahtarında durur."},
 {t:"code",k:["write fonksiyonu","guard","yazma hatasi","write"],a:"Veritabanı yazmaları write() ile sarılır; hata olursa Türkçe uyarı gösterir ve true/false döner. guard() misafirin ya da susturulmuş kişinin işlem yapmasını engeller."},
 {t:"code",k:["tiklama","data act","olay dinleyici","event","dugme nasil"],a:"Bütün tıklamaları tek bir document dinleyicisi dağıtır: data-act, data-go, data-tab gibi özniteliklere bakar. Yeni düğme için data-act verip ACT nesnesine bir eylem eklemek yeter."},
 {t:"code",k:["hook","kanca","hooks"],a:"HOOKS.after her çizimden sonra, HOOKS.enter uygulamaya girince, HOOKS.profiles profiller gelince çalışır. Hangi sayfada olduğunu ben de oradan anlıyorum."},
 {t:"code",k:["satranc motoru","motor","alfa beta","minimax","engine","chesscore"],a:"Satranç motoru ChessCore: 64 karelik dizi, yasal hamle üretimi ve alfa-beta araması. Ekran donmasın diye hesap Web Worker'da yapılır (engineRun). Seviyeler 400'den 2000'e."},
 {t:"code",k:["elo","puan","siralama","rating"],a:"Satranç puanı Elo usulü hesaplanır (chRate). Profilde chess alanında puan, galibiyet, mağlubiyet ve beraberlik tutulur."},
 {t:"code",k:["cloudinary","video nereye","video nerede","storevideo","video saklama"],a:"Klaket videoları bulutta Cloudinary'ye yüklenir; olmazsa Firestore'a parça parça konur (storeVideo, storeVideoFs). Oynatırken vsrc ikisini de tanır."},
 {t:"code",k:["muzik nasil","webaudio","muzik","ses nasil"],a:"Klaket müziği cihazında WebAudio ile anında üretilir: Lo-fi, Enerjik, Sakin. Hiç ses dosyası inmez. Benim bip seslerim ve gitar riff'im de aynı yöntemle!"},
 {t:"code",k:["webrtc","arama nasil calisir","p2p","sinyal"],a:"Aramalar WebRTC ile iki cihaz arasında doğrudan akar; bağlantı bilgileri Firestore'daki calls koleksiyonundan değiş tokuş edilir. Arama içi tepkiler bir veri kanalından gider."},
 {t:"code",k:["presence","kalp atisi","cevrimici nasil","online nasil"],a:"Çevrimiçi durum presence koleksiyonunda tutulur; uygulama yaklaşık 40 saniyede bir kalp atışı gönderir. Yeşil nokta oradan gelir."},
 {t:"code",k:["app v","app ver","surum numarasi","versiyon nasil"],a:"Sürüm APP_VER'de yazar, APP_V sayısal hâli: ana×10000 + ara×100 + yama. Sayfadaki kadraj-version etiketi de aynı sayıyı taşır."},
 {t:"code",k:["service worker","sw js","cevrimdisi","offline","onbellek nasil"],a:"sw.js önce ağdan çeker, ağ yoksa önbellekten açar. Bildirime dokununca doğru sohbete gitmeni de o sağlar."},
 {t:"code",k:["ikon","svg","ip nesnesi","simge"],a:"İkonlar IP nesnesinde SVG yolları olarak durur, I(ad) ile çizilir. Emoji yok, her şey SVG. Ben bile piksel piksel SVG'yim!"},
 {t:"code",k:["cid","sohbet kimligi","sendmessage","mesaj nasil gider","msgs"],a:"Mesajlar chats/{cid}/msgs altında durur. Birebir sohbetin kimliği dm- ile, grubunki gr- ile başlar; ortak sohbetin adı meydan. Göndermeyi sendMessage yapar."},
 {t:"code",k:["reacts","tepki kodu","tepkiler nasil"],a:"Tepkiler REACTS listesinde: kalp, gülme, şaşırma, üzülme, ateş, alkış. Mesajın reacts alanında kişi başına bir tepki tutulur."},
 {t:"code",k:["cleanoldstories","24 saat","hikaye silinme","notof"],a:"Hikâyeler 24 saat görünür; süresi dolanları cleanOldStories temizler. Notlar da 24 saatlik, noteOf onlara bakar."},
 {t:"code",k:["data ui","vizor kodu","yuzen dok"],a:"Arayüz <html data-ui> özniteliğiyle seçilir: vizor ya da klasik. Vizör'ün bütün CSS'i :root[data-ui=\"vizor\"] altında; dok ve üst çubuk ölçülüp ana alana boşluk bırakılır."},
 {t:"code",k:["sheet","dialog","openlayer","katman","overlay"],a:"Alttan açılan pencereler sheet(), onay kutuları dialog() ile açılır; hepsi openLayer ile #overlay içine konur. Ben bir pencere açılınca kibarca kenara çekilirim."},
 {t:"code",k:["esc","xss","guvenlik","kacis"],a:"Şablonlara giren her metin esc() ile kaçırılır; kimse mesajına kod gömemez. Ben de konuşurken buna uyuyorum."},
 {t:"code",k:["sen nasil calisiyorsun","senin kodun","kodun nerede","clawd kodu","nasil yapildin","piksel"],a:"Ben index.html'in sonunda, kendi bölgemde yaşıyorum. Çizimim SVG piksellerden, hareketim tek bir requestAnimationFrame döngüsünden, sesim WebAudio'dan geliyor."},
 {t:"code",k:["yapay zeka","kai","kopru","cloudflare","rota nasil calisir"],a:"Yapay zekâ Cloudflare'deki bir köprü üzerinden çalışır; anahtarlar sitede değil köprüde saklı. Yönetici bağlayınca Rota gerçek yanıt verir, değilse hazır yanıtlarla idare eder. Ben tamamen çevrimdışıyım, her şeyi kendi kafamdan uyduruyorum. Şaka şaka, bilgi tabanımdan!"},
 {t:"code",k:["assets","gomulu","base64","galeri fotograflari"],a:"Kadraj galerisindeki hazır fotoğraflar ve Rota'nın örnek videoları eskiden kodun içine gömülüydü (ASSETS). Artık img/ ve reels/ klasörlerinde ayrı dosyalar; kod yarı yarıya hafifledi."},
 {t:"code",k:["localstorage","ayarlar nerede","savesettings"],a:"Ayarların bu cihazda localStorage'da, kadraj_settings anahtarında durur; saveSettings() kaydeder. Tema eşitleme açıksa hesabına da yazılır."},
 {t:"code",k:["css degisken","root","accent","renkler nasil"],a:"Renkler CSS'te :root değişkenleri: --bg, --fg, --accent gibi. Vurgu rengi değişince bu değişkenler yeniden yazılır; koyu tema da aynılarını kullanır."},
 {t:"code",k:["sysnote","push","bildirim nasil calisir","opentarget"],a:"Telefon bildirimlerini sysNote gönderir; dokununca openTarget seni doğru sohbete ya da paylaşıma götürür."},
 {t:"code",k:["cleantext","kufur","suzgec"],a:"Çocuk Modu'nda yazılar cleanText süzgecinden geçer; isChild kimin Çocuk Modu'nda olduğuna bakar."},
 {t:"code",k:["sifreleme","anahtar nasil","kadraj anahtari nasil"],a:"Kadraj Anahtarı, şifreni anahtardan türetilen bir kilitle şifreleyip saklar; unutursan anahtarla açıp yeni şifre koyarsın. Ayrıntısı sır, ben de bilmiyormuş gibi yapıyorum."},
 {t:"code",k:["kac satir","kod uzunlugu","satir sayisi"],a:"Saymaya çalıştım, binlerce satırda uyuyakaldım. Eskiden en uzun satır ASSETS'ti, iki megabayta yakın; şimdi o fotoğraflar ayrı dosyalarda."},
 {t:"code",k:["toast","uyari mesaji"],a:"Üstte çıkan kısa uyarıları toast() gösterir. Bir uyarı çıkınca ben de heyecandan zıplarım."}];
const CW_TOPIC=["kadraj","klaket","flick","reels","hikaye","story","mesaj","sohbet","profil","ayar","tema","satranc","rota","meydan","paylas","gonderi","begen","takip","grup","bildirim","sifre","anahtar","posta","vizor","klasik","akis","kesfet","clawd","kod","fonksiyon","firebase","uygulama","anket","yorum","arama","dok","fotograf","video","sesli","not","tepki","davet","hesap","giris","cikis","surum","guncelle","yonetici","bot","yapay"];
const CW_STOPW=new Set("ne nasil nedir neden mi mu mı mü bir ve ile icin bu su o ben sen biz siz var yok yap yapilir yaparim olur nerede nereden hangi kac kim acaba lutfen bana beni sana seni da de ki ya veya ama".split(" "));

/* --- durum --- */
const CW_STOP={cw:"stop"};
const CW={root:null,b:null,hit:null,inr:null,sq:null,spr:null,fx:null,bub:null,bubK:"",bubW:0,bubH:0,bedB:null,bedF:null,shEl:null,
 U:3,W:69,H:54,x:-1,y:0,surf:"floor",face:-1,flip:false,rot:0,oy:0,sq0:"",
 pose:"idle",talking:false,moving:false,lookX:0,blinkAt:0,blinkOn:false,frameK:"",tf:"",
 clock:0,last:0,raf:0,slow:0,tws:[],gen:0,busy:false,act:"",pri:0,nextAt:0,pend:[],
 vis:false,bnd:null,bT:0,vT:0,pT:0,pass:false,bedPass:false,why:"",
 speed:1,hourOv:null,napAfter:120000,quietMs:180000,lastSay:0,lastInput:Date.now(),
 bed:null,inBed:false,zz:false,stars:false,tears:false,typing:false,glT:0,
 taps:[],tapT:0,shieldLvl:0,lastHit:0,forgive:8000,
 menu:false,ask:false,leaving:false,returning:false,greeted:false,arrived:false,
 pendWin:false,route:"",hiddenAt:0,jokeBag:[],tipBag:[],lastToastJump:0,drag:null,
 room:null,wb:null,rootFx:null,rootBed:null,owlAt:0,sleptAt:0,lastGuitar:0,lastWave:0,light:null,uRoam:3};
const cwRand=(a,b)=>a+Math.random()*(b-a);
const cwPick=a=>a[Math.floor(Math.random()*a.length)];
function cwBag(name,list){const k=name==="j"?"jokeBag":"tipBag";if(!CW[k].length){CW[k]=list.map((_,i)=>i).sort(()=>Math.random()-.5)}return list[CW[k].pop()]}
function cwOn(){return settings.clawd!==false}
function cwReduce(){try{return kbReduce()}catch{return false}}
function cwHour(){return CW.hourOv!=null?CW.hourOv:new Date().getHours()}
/* 5.1: gece yarısı (00:00) yatar, sabah 07:00'de kalkar. Kullanıcı geç saatte etkinse uyumaz (cwOwl*, 51CLAWD). */
function cwNight(){const h=cwHour();return h<7}
function cwPeriod(){const h=cwHour();return h>=7&&h<11?"m":h>=11&&h<17?"a":h>=17?"e":"n"}
function cwUn(){try{const u=(me().username||"").trim();return u&&u!=="kullanici"?"@"+u:"dostum"}catch{return"dostum"}}
function cwFill(t){return String(t).replace(/@(?![\w])/g,cwUn())}

/* --- DOM --- */
function cwMount(){if(CW.root)return;const r=document.createElement("div");r.id="clawd";r.className="off cw-scope";r.setAttribute("aria-live","polite");
 r.innerHTML=`<div class="cw-fx"></div><div class="cw-bed cw-bk" hidden></div><div class="cw-b"><div class="cw-inr"><div class="cw-sq"><div class="cw-spr"></div></div></div><button class="cw-hit" type="button" aria-label="Clawd ile konuş"></button></div><div class="cw-bed cw-ft" hidden></div>`;
 document.body.appendChild(r);CW.root=r;CW.fx=r.querySelector(".cw-fx");CW.b=r.querySelector(".cw-b");CW.inr=r.querySelector(".cw-inr");CW.sq=r.querySelector(".cw-sq");CW.spr=r.querySelector(".cw-spr");CW.hit=r.querySelector(".cw-hit");
 CW.bedB=r.querySelector(".cw-bk");CW.bedF=r.querySelector(".cw-ft");CW.bedB.innerHTML=cwBedSvg(false);CW.bedF.innerHTML=cwBedSvg(true);
 CW.rootFx=CW.fx;CW.rootBed={B:CW.bedB,F:CW.bedF};
 cwSize();cwWireHit();cwWireBed();
 r.addEventListener("click",cwBubClick);
 r.addEventListener("submit",e=>{const f=e.target.closest("form.cw-askf");if(!f)return;e.preventDefault();const q=(f.querySelector("input").value||"").trim();cwAskClose();if(q)cwAsk(q)});
 r.addEventListener("keydown",e=>{if(e.key==="Escape"&&CW.ask){e.stopPropagation();cwAskClose()}})}
/* 5.1: Clawd yaklaşık 1,5 kat büyüdü; piksel boyu ekran genişliğine göre seçilir ve cihaz pikseline yuvarlanır (keskin).
   Odadayken piksel boyu odanın ölçüsünden gelir (CW.room.u). */
function cwRoamU(){const sh=$("#shell");const w=sh?sh.getBoundingClientRect().width||innerWidth:innerWidth;return w<520?3.6:w<900?4.2:4.6}
function cwPx(f){const d=window.devicePixelRatio||1;return Math.max(1.5,Math.round(f*d)/d)}
function cwSize(){const U=CW.room?CW.room.u:cwPx(cwRoamU());CW.uRoam=cwPx(cwRoamU());CW.U=U;CW.W=CW_GW*U;CW.H=CW_GH*U;
 if(!CW.root)return;CW.root.style.setProperty("--cw-u",U+"px");if(CW.room)CW.room.el.style.setProperty("--cw-u",U+"px");CW.b.style.width=CW.W+"px";CW.b.style.height=CW.H+"px";
 if(!CW.room)for(const el of[CW.bedB,CW.bedF]){el.style.width=32*U+"px";el.style.height=16*U+"px"}}

/* --- dünya sınırları --- */
function cwBoundsUpd(){const sh=$("#shell");if(!sh)return;const s=sh.getBoundingClientRect();const vv=window.visualViewport;
 const vb=vv?vv.offsetTop+vv.height:innerHeight;const L=Math.max(0,s.left),R=Math.min(innerWidth,s.right);
 let T=s.top+4;const top=$("#top");if(top&&!top.hidden){const r=top.getBoundingClientRect();if(r.height>0&&r.bottom>T)T=r.bottom}
 let B=Math.min(s.bottom,vb)-6;const dock=$("#dock");if(dock&&!dock.hidden){const nav=dock.querySelector("nav")||dock;const r=nav.getBoundingClientRect();if(r.height>0&&r.top<B+6)B=r.top-4}
 if(CW.ask&&vv&&vb<innerHeight-80)B=Math.min(B,vb-8);
 CW.wb={L,R,T,B};CW.bnd=CW.room?CW.room.bnd:CW.wb}
function cwB(){if(!CW.bnd)cwBoundsUpd();return CW.bnd||{L:0,R:innerWidth,T:0,B:innerHeight}}
const CW_HIDE_ROUTES=["chat","chessgame","edit","admin"];
const CW_TXT="input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]):not([type=range]):not([type=file]):not([type=color]),textarea,select,[contenteditable=''],[contenteditable='true']";
function cwWhy(){if(!cwOn()&&!CW.leaving)return"off";if(!CW.root)return"nodom";
 try{if(typeof introEl==="function"&&introEl())return"intro"}catch{}
 if(!S.authed||!S.uid)return"auth";const r=S.route&&S.route.name;if(CW_HIDE_ROUTES.includes(r))return"route";const rk=CW.room&&CW.room.kind;if(r==="reels"&&rk!=="nook")return"route";
 if(typeof CALL!=="undefined"&&CALL)return"call";if(document.getElementById("ar5Mini"))return"call";
 if(document.querySelector("#overlay .layer")&&rk!=="disco")return"layer";
 const ae=document.activeElement;const mine=ae&&CW.root.contains(ae);
 if(rk==="disco")return"";
 if(ae&&!mine&&ae.matches&&ae.matches(CW_TXT))return"typing";
 const vv=window.visualViewport;if(vv&&!mine&&vv.height<innerHeight*.72)return"keyboard";
 return""}
function cwVis(){const why=cwWhy();CW.why=why;const want=!why;if(want===CW.vis){if(!want&&CW.bub&&why!=="off")cwBubClose();return}
 if(want)cwShow();else cwHideNow(why)}
function cwShow(){CW.vis=true;CW.root.classList.remove("off");cwBoundsUpd();const b=cwB();
 if(CW.x<0){CW.x=b.R-CW.W*.5-10;CW.face=-1}
 if(!CW.busy){CW.surf="floor";CW.y=b.B;CW.flip=false;CW.rot=0;CW.oy=0}
 CW.x=Math.min(b.R-CW.W*.5-2,Math.max(b.L+CW.W*.5+2,CW.x));CW.nextAt=CW.clock+250;
 if(CW.bed){cwBedPlace();CW.bedB.hidden=CW.bedF.hidden=false}cwDraw(performance.now(),true)}
function cwHideNow(why){CW.vis=false;CW.root.classList.add("off");
 if(why==="off"){cwCancel();CW.inBed=false;cwBedRemove();CW.shieldLvl=0;cwShieldHide(true)}
 else if(CW.busy&&CW.pri<9){cwCancel()}
 cwBubClose();cwMenuClose();if(CW.ask)cwAskClose();cwFxClear();
 if(why==="off"||why==="auth")cwRoomDrop()}

/* --- tıklama geçirgenliği: uygulamanın tıklanabilir öğesinin üstündeyse Clawd tıklanmaz --- */
const CW_IA="a,button,input,textarea,select,label,video,audio,summary,[role=button],[role=link],[role=tab],[onclick],[contenteditable]";
const CW_DOK=new Set(["data-k","data-t","data-sec","data-meta","data-layer","data-ui","data-mode","data-ct","data-cdk","data-theme","data-app-theme"]);
function cwIsIA(el){for(let e=el,n=0;e&&e!==document.body&&e!==document.documentElement&&n<14;e=e.parentElement,n++){
 if(e.id==="main"||e.id==="shell")return false;if(e.matches&&e.matches(CW_IA))return true;
 for(const a of e.attributes)if(a.name.startsWith("data-")&&!CW_DOK.has(a.name))return true}return false}
function cwBlocks(r){if(!r||r.width<2)return false;for(const[fx,fy]of[[.5,.5],[.18,.3],[.82,.3],[.2,.88],[.8,.88]]){const x=r.left+r.width*fx,y=r.top+r.height*fy;if(x<0||y<0||x>=innerWidth||y>=innerHeight)continue;
  let first=null;for(const el of document.elementsFromPoint(x,y)){if(CW.root.contains(el)||el.closest(".cw-room"))continue;first=el;break}
  if(first&&cwIsIA(first))return true}return false}
function cwPass(){if(CW.room){if(CW.pass){CW.pass=false;CW.b.classList.remove("pt")}return}const hr=CW.hit.getBoundingClientRect();const p=cwBlocks(hr);if(p!==CW.pass){CW.pass=p;CW.b.classList.toggle("pt",p)}
 if(CW.bed&&!CW.drag){const a=CW.bedF.getBoundingClientRect();const q=cwBlocks(a);if(q!==CW.bedPass){CW.bedPass=q;CW.bedB.classList.toggle("pt",q);CW.bedF.classList.toggle("pt",q)}}}

/* --- döngü --- */
function cwKick(){if(CW.raf||document.hidden||!CW.root)return;clearTimeout(CW.slow);CW.slow=0;CW.last=0;CW.raf=requestAnimationFrame(cwTick)}
function cwTick(ts){CW.raf=0;if(document.hidden||!CW.root)return;
 const dt=Math.min(CW.calm?160:60,Math.max(0,ts-(CW.last||ts)));CW.last=ts;
 if(ts-CW.vT>180){CW.vT=ts;try{cwRoomSync()}catch(e){console.warn("clawd",e)}cwVis()}
 if(!CW.vis){if(!cwOn()&&!CW.leaving)return;CW.slow=setTimeout(cwKick,400);return}
 const d=dt*CW.speed;CW.clock+=d;
 if(ts-CW.bT>110){CW.bT=ts;cwBoundsUpd()}
 for(const w of CW.tws.slice()){w.t+=d;const k=Math.min(1,w.t/w.dur);try{w.step&&w.step(k)}catch(e){console.warn("clawd",e)}if(k>=1){const i=CW.tws.indexOf(w);if(i>=0){CW.tws.splice(i,1);w.res()}}}
 cwFollow();cwBrain();cwDraw(ts);
 if(ts-CW.pT>140){CW.pT=ts;cwPass()}
 /* 5.9.1: Clawd dururken (yürümüyor, sürüklenmiyor, yazmıyor, yalnızca bekliyor, sayfa kaymıyor) saniyede ~10 kare yeter; telefonda kasmayı azaltır */
 CW.calm=CW.tws.every(w=>!w.step)&&!CW.moving&&!CW.drag&&!CW.typing&&!CW.air&&ts-(CW.hot||0)>500;
 if(CW.calm){CW.slow=setTimeout(()=>{CW.slow=0;if(!CW.raf)CW.raf=requestAnimationFrame(cwTick)},100);return}
 CW.raf=requestAnimationFrame(cwTick)}
addEventListener("scroll",()=>{CW.hot=performance.now();if(CW.slow&&CW.calm){clearTimeout(CW.slow);CW.slow=0;if(!CW.raf)CW.raf=requestAnimationFrame(cwTick)}},{capture:true,passive:true});
function cwTween(dur,step){return new Promise((res,rej)=>CW.tws.push({t:0,dur:Math.max(1,dur),step,res,rej}))}
const cwWait=ms=>cwTween(ms);
function cwCancel(){CW.gen++;const ws=CW.tws;CW.tws=[];for(const w of ws)w.rej(CW_STOP);CW.moving=false;CW.talking=false;CW.typing=false;CW.busy=false;CW.act="";CW.pri=0;cwBubClose()}
function cwRun(fn,{pri=0,name=""}={}){cwCancel();const g=CW.gen;CW.busy=true;CW.act=name;CW.pri=pri;
 Promise.resolve().then(()=>fn(g)).catch(e=>{if(e!==CW_STOP)console.warn("clawd",e)}).finally(()=>{if(CW.gen===g){CW.busy=false;CW.act="";CW.pri=0;CW.moving=false;CW.talking=false;CW.typing=false;CW.nextAt=CW.clock+cwRand(1500,4500)}})}
function cwQueue(name,fn,pri){if(!cwOn())return;if(cwNight()&&pri<3&&name!=="dance")return;
 if(CW.vis&&(!CW.busy||pri>CW.pri)&&!CW.menu&&!CW.ask){cwRun(fn,{pri,name});return}
 CW.pend=CW.pend.filter(p=>p.name!==name);CW.pend.push({name,fn,pri});CW.pend.sort((a,b)=>b.pri-a.pri)}
function cwFollow(){const b=cwB();if(CW.moving&&CW.surf!=="floor"&&CW.surf!=="ceil")return;
 if(CW.surf==="floor"&&!CW.air)CW.y=b.B;else if(CW.surf==="ceil"&&!CW.air)CW.y=b.T;
 if(CW.inBed&&CW.bed){const G=cwBG();CW.bed.y=b.B;cwBedPlace();CW.x=CW.bed.x+G.ix*CW.U;CW.y=CW.bed.y-G.iy*CW.U}
 else if(CW.bed&&!CW.drag&&Math.abs(CW.bed.y-b.B)<60){CW.bed.y=b.B;cwBedPlace()}}

/* --- poz ve çizim --- */
function cwSpec(){const t=CW.clock;const p=CW.pose;const s={eyes:"open",mouth:"",arms:"down",legs:"stand",lx:CW.lookX,blush:false,bump:false,brow:""};
 const alt=(ms)=>Math.floor(t/ms)%2===0;
 switch(p){
  case"walk":s.legs=alt(130)?"w1":"w2";break;
  case"run":s.legs=alt(80)?"w1":"w2";s.arms=alt(80)?"t1":"t2";break;
  case"jump":s.legs="tuck";s.arms="up";s.eyes="happy";break;
  case"happy":s.eyes="happy";s.mouth="smile";s.arms=alt(260)?"up":"down";s.blush=true;break;
  case"joy":s.eyes="happy";s.mouth="smile";s.arms="up";s.blush=true;s.legs="tuck";break;
  case"dance":s.eyes="happy";s.mouth="smile";s.arms=["up","w1","down","c1"][Math.floor(t/220)%4];s.legs=alt(220)?"w1":"w2";s.blush=true;break;
  case"surprised":s.eyes="wide";s.mouth="o";s.arms="up";break;
  case"sleep":s.eyes="closed";s.legs="tuck";break;
  case"sleepy":s.eyes="blink";s.mouth=alt(900)?"":"yawn";break;
  case"cry":s.eyes="sad";s.mouth="frown";break;
  case"crywalk":s.eyes="sad";s.mouth="frown";s.legs=alt(200)?"w1":"w2";break;
  case"dizzy":s.eyes="x";s.mouth="wob";s.bump=true;s.legs="spread";break;
  case"type":s.eyes="down";s.arms=alt(95)?"t1":"t2";break;
  case"shield":s.eyes="open";s.brow="mad";s.arms="sh";s.legs="spread";break;
  case"wave":s.eyes="happy";s.mouth="smile";s.arms=alt(230)?"w1":"w2";break;
  case"sit":s.legs="tuck";break;
  case"climb":s.arms=alt(170)?"c1":"c2";s.legs=alt(170)?"w1":"w2";s.eyes="up";break;
  case"lookup":s.eyes="up";break;
  case"listen":s.eyes="wide";s.arms="sh";break;
  case"shrug":s.eyes="blink";s.mouth="flat";s.arms="sg";break;
  case"lie":s.eyes="x";s.legs="tuck";s.bump=true;break;
  /* 5.1 pozları */
  case"guitar":s.prop="guitar";s.arms=alt(150)?"g1":"g2";s.eyes=Math.floor(t/1100)%3===2?"closed":"happy";s.mouth="smile";s.legs=alt(300)?"stand":"spread";break;
  case"read":s.prop=Math.floor(t/2400)%2?"book2":"book";s.arms="rd";s.eyes="down";s.legs="tuck";break;
  case"think":s.eyes="up";s.lx=1;s.arms="tk";s.mouth="flat";break;
  case"stretch":s.eyes="closed";s.mouth="yawn";s.arms="hi";s.legs="spread";break;
  case"sniff":s.eyes="blink";s.mouth="flat";s.arms="sh";break;
  case"sneeze":s.eyes="closed";s.mouth="yawn";s.arms="up";s.legs="spread";break;
  case"reach":s.arms="w2";s.eyes="up";break;
  case"switch":s.arms="w1";s.eyes="up";s.mouth="smile";break;
  case"hold":s.arms="up";s.eyes="happy";s.mouth="smile";s.blush=true;break;
  case"yawn":s.eyes="closed";s.mouth="yawn";s.arms="sg";break;
  case"doze":s.eyes="closed";s.legs="tuck";break;
  case"juggle":s.arms=alt(240)?"w1":"c2";s.eyes="up";s.mouth="o";break;
  case"popcorn":{const ph=Math.floor(t/800)%4;s.legs=alt(700)?"dang1":"dang2";s.arms=ph===0?"w2":"down";s.mouth=ph===0?"t2":ph===1&&alt(150)?"t1":"";break}
  case"bedsit":s.legs=alt(520)?"dang1":"dang2";break}
 if(CW.talking&&!["sleep","dizzy","lie"].includes(p))s.mouth=alt(115)?"t1":"t2";
 if(s.eyes==="open"||s.eyes==="up"||s.eyes==="down"){if(t>CW.blinkAt){CW.blinkOn=true;if(t>CW.blinkAt+130){CW.blinkOn=false;CW.blinkAt=t+cwRand(2200,5200)}}if(CW.blinkOn)s.eyes="blink"}
 if(CW.bumpOn&&!s.bump)s.bump=true;
 return s}
function cwDraw(ts,force){if(!CW.root)return;const s=cwSpec();const k=cwSvg(s);if(k!==CW.frameK||force){CW.spr.innerHTML=k;CW.frameK=k}
 const bx=Math.round((CW.x-CW.W/2)*4)/4;const by=Math.round(((CW.surf==="ceil"&&!CW.air)?CW.y:CW.y-CW.H)+CW.oy);
 const tf=`translate3d(${bx}px,${by}px,0)`;if(tf!==CW.tf){CW.b.style.transform=tf;CW.tf=tf}
 const it=`scale(${CW.face<0?-1:1},${CW.flip?-1:1}) rotate(${CW.rot}deg)`;if(it!==CW.itf){CW.inr.style.transform=it;CW.itf=it}
 if(CW.typing&&!cwReduce()&&ts-CW.glT>170){CW.glT=ts;cwGlyphFloat()}
 cwFlags();if(CW.bub)cwBubPos()}
function cwFlags(){const f={zz:CW.zz,st:CW.stars,tr:CW.tears};for(const[k,v]of Object.entries(f)){if(!!CW["_f"+k]===!!v)continue;CW["_f"+k]=!!v;
  if(k==="zz"){if(v){const z=document.createElement("div");z.className="cw-zz";z.innerHTML=`<i>${CW_ZSVG}</i><i>${CW_ZSVG}</i><i>${CW_ZSVG}</i>`;CW.b.appendChild(z)}else CW.b.querySelectorAll(".cw-zz").forEach(e=>e.remove())}
  if(k==="st"){if(v){const z=document.createElement("div");z.className="cw-stars";z.innerHTML=`<i>${CW_STAR}</i><i>${CW_STAR}</i><i>${CW_STAR}</i>`;CW.b.appendChild(z)}else CW.b.querySelectorAll(".cw-stars").forEach(e=>e.remove())}
  if(k==="tr"){if(v){const z=document.createElement("div");z.className="cw-tears";z.innerHTML="<i></i><i></i><i></i><i></i>";CW.sq.appendChild(z)}else CW.sq.querySelectorAll(".cw-tears").forEach(e=>e.remove())}}}
function cwSquash(){if(cwReduce())return;CW.sq.classList.remove("land");void CW.sq.offsetWidth;CW.sq.classList.add("land");setTimeout(()=>CW.sq&&CW.sq.classList.remove("land"),260)}

/* --- hareketler --- */
async function cwWalk(tx,sp=46,pose="walk"){const x0=CW.x;const dx=tx-x0;if(Math.abs(dx)<1)return;CW.face=dx>0?1:-1;CW.pose=pose;CW.moving=true;
 try{await cwTween(Math.abs(dx)/sp*1000,k=>{CW.x=x0+dx*k})}finally{CW.moving=false}if(CW.pose===pose)CW.pose="idle"}
async function cwHop(tx,ty,h=18,dur=380,{rot0,rot1}={}){const x0=CW.x,y0=CW.y,dx=tx-x0,dy=ty-y0;if(dx)CW.face=dx>0?1:-1;const pp=CW.pose;CW.pose="jump";CW.air=true;CW.moving=true;cwSfx("hop");
 try{await cwTween(dur,k=>{CW.x=x0+dx*k;CW.y=y0+dy*k-h*4*k*(1-k);if(rot1!=null)CW.rot=(rot0||0)+(rot1-(rot0||0))*k})}finally{CW.air=false;CW.moving=false}
 CW.pose=pp==="jump"?"idle":pp;cwSquash()}
async function cwFall(ty,{rot0,rot1}={}){const y0=CW.y;const h=Math.max(0,ty-y0);const dur=Math.max(180,Math.sqrt(2*h/2400)*1000);CW.air=true;CW.moving=true;CW.pose="surprised";
 try{await cwTween(dur,k=>{CW.y=y0+h*k*k;if(rot1!=null)CW.rot=(rot0||0)+(rot1-(rot0||0))*Math.min(1,k*2.5)})}finally{CW.air=false;CW.moving=false}
 cwSfx("bonk");cwSquash();CW.pose="idle"}
function cwFreeX(prefer){const b=cwB();if(CW.room){const lo=b.L+CW.W*.5,hi=b.R-CW.W*.5;return hi>lo?cwRand(lo,hi):(lo+hi)/2}const lo=b.L+CW.W*.5+6,hi=b.R-CW.W*.5-6;if(hi<=lo)return(b.L+b.R)/2;const c=[];for(let i=0;i<6;i++)c.push(lo+Math.random()*(hi-lo));if(prefer!=null)c.unshift(prefer);
 for(const x of c){const r={left:x-CW.W*.45,top:b.B-15*CW.U,width:CW.W*.9,height:15*CW.U};if(!cwBlocks(r))return x}return c[1]}

/* --- konuşma balonları --- */
function cwBubOpen(kind,html){cwBubClose();const d=document.createElement("div");d.className="cw-bub "+kind;d.innerHTML=html;CW.root.appendChild(d);CW.bub=d;CW.bubK=kind;CW.bubW=d.offsetWidth;CW.bubH=d.offsetHeight;cwBubPos();return d}
function cwBubMeasure(){if(!CW.bub)return;CW.bubW=CW.bub.offsetWidth;CW.bubH=CW.bub.offsetHeight}
function cwBubClose(){if(CW.bub){const d=CW.bub;CW.bub=null;CW.bubK="";if(cwReduce()||!CW.vis)d.remove();else{d.classList.add("out");setTimeout(()=>d.remove(),180)}}}
/* 5.1: balon her zaman ekran koordinatında (#clawd içinde); Clawd odadaysa odanın konumu eklenir, oda ekran dışındaysa balon saklanır. */
function cwBubPos(){const d=CW.bub;if(!d)return;if(!CW.wb)cwBoundsUpd();const b=CW.wb||cwB();let ox=0,oy=0;
 if(CW.room){const r=CW.room.el.getBoundingClientRect();ox=r.left;oy=r.top;const off=!CW.room.el.isConnected||r.bottom<b.T+6||r.top>b.B-6;if(off!==!!d._off){d._off=off;d.style.visibility=off?"hidden":""}}
 const X=CW.x+ox,Yf=CW.y+oy;const ceil=CW.surf==="ceil"&&!CW.air;const head=ceil?Yf+15*CW.U+CW.oy:Yf-15*CW.U+CW.oy;
 const w=CW.bubW,h=CW.bubH;let bx=X-w/2;bx=Math.max(b.L+8,Math.min(b.R-8-w,bx));let below=ceil;let by=below?head+12:head-h-14;
 if(!below&&by<b.T+4){below=true;by=Yf+8}
 if(below&&by+h>b.B+40){below=false;by=head-h-14}
 const tx=Math.max(12,Math.min(w-14,X-bx));const k=`${Math.round(bx)},${Math.round(by)},${Math.round(tx)},${below}`;if(k===d._k)return;d._k=k;
 d.style.transform=`translate(${Math.round(bx)}px,${Math.round(by)}px)`;d.style.setProperty("--tx",Math.round(tx)+"px");d.classList.toggle("dn",below)}
function cwHold(t){return Math.max(1700,Math.min(7000,1200+String(t).length*48))}
async function cwSay(text,{hold,kind="say",note="",keepPose=false}={}){text=cwFill(text);const d=cwBubOpen(kind,`<span class="cw-t"></span>${note?`<small class="cw-n">${esc(note)}</small>`:""}`);const sp=d.querySelector(".cw-t");
 sp.textContent=text;cwBubMeasure();d.style.minHeight=CW.bubH+"px";d.style.width=CW.bubW+"px";sp.textContent="";
 const code=kind==="code";if(code){CW.typing=true;CW.pose="type"}else CW.talking=true;let n=0;
 const per=code?55:27;
 try{if(cwReduce())sp.textContent=text;else await cwTween(text.length*per,k=>{const m=Math.round(text.length*k);if(m===n)return;const ch=text.charAt(m-1);n=m;sp.textContent=text.slice(0,m);if(/[\p{L}\p{N}]/u.test(ch)&&m%2===0)cwBlip(code?"key":"me")})}
 finally{CW.talking=false;if(code)CW.typing=false}
 await cwWait(hold!=null?hold:cwHold(text));if(CW.bub===d)cwBubClose()}
async function cwThink(html,ms){const d=cwBubOpen("th",`<svg class="cw-cloud" viewBox="0 0 140 84" aria-hidden="true"><g class="o">${cwCloudC(2.2)}</g><g class="i">${cwCloudC(0)}</g></svg><div class="cw-thc">${html}</div><i class="cw-p1"></i><i class="cw-p2"></i>`);cwBubMeasure();await cwWait(ms);if(CW.bub===d)cwBubClose()}
function cwCloudC(e){return[[34,46,22],[58,32,25],[88,30,24],[110,46,19],[86,58,20],[56,60,20],[28,58,14]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r+e}"/>`).join("")}

/* --- efektler --- */
function cwFxClear(){if(CW.fx)CW.fx.innerHTML=""}
function cwGlyph(x,y,ch,cls=""){const g=document.createElement("div");g.className="cw-g "+cls;g.textContent=ch;g.style.left=Math.round(x)+"px";g.style.top=Math.round(y)+"px";CW.fx.appendChild(g);return g}
function cwDissolve(els,stagger=40){els.forEach((g,i)=>{if(cwReduce()){g.remove();return}setTimeout(()=>{g.classList.add("out");setTimeout(()=>g.remove(),460)},i*stagger/CW.speed)})}
function cwBurst(x,y,n=14,col){if(cwReduce())return;for(let i=0;i<n;i++){const p=document.createElement("i");p.className="cw-pt";const a=Math.random()*Math.PI*2,r=cwRand(14,42);
  p.style.left=x+"px";p.style.top=y+"px";p.style.setProperty("--dx",(Math.cos(a)*r).toFixed(1)+"px");p.style.setProperty("--dy",(Math.sin(a)*r-10).toFixed(1)+"px");if(col)p.style.background=col;
  if(Math.random()<.4){p.className="cw-pt ch";p.textContent=cwPick(["{","}",";","<",">","/","=","(",")"])}CW.fx.appendChild(p);setTimeout(()=>p.remove(),720)}}
function cwGlyphFloat(){const g=document.createElement("i");g.className="cw-gl";g.textContent=cwPick(["{","}",";","<",">","/","=","(",")","[","]","*"]);g.style.left=(CW.W*.5+cwRand(-16,16))+"px";g.style.top=(CW.H*.35)+"px";CW.b.appendChild(g);setTimeout(()=>g.remove(),900)}
const CW_GLY=["{","}",";","<","/",">","=","(",")","[","]"];
/* basamaklar: yanında yükselen kod blokları */
async function cwStairs(){const b=cwB();const S0=Math.round(CW.U*7);const N=4;const roomR=b.R-CW.x,roomL=CW.x-b.L;const need=CW.W*1.6+S0*N;if(Math.max(roomR,roomL)<need)return false;
 const dir=roomR>=roomL?1:-1;CW.face=dir;const cols=[];const blocks=[];CW.pose="type";CW.typing=true;
 for(let i=1;i<=N;i++){const cx=CW.x+dir*(CW.W*.42+S0*(i-.5));cols.push(cx);for(let j=0;j<i;j++){blocks.push(cwGlyph(cx-S0/2,b.B-S0*(j+1),cwPick(CW_GLY),"st"));cwBlip("key");await cwWait(85)}}
 CW.typing=false;CW.pose="idle";await cwWait(250);
 try{for(let i=0;i<N;i++){await cwHop(cols[i],b.B-S0*(i+1),14,300);CW.surf="stairs";await cwWait(90)}
  CW.pose="lookup";await cwWait(500);CW.face=-dir;CW.lookX=0;await cwWait(500);CW.face=dir;
  if(cwMaySay())await cwSay(cwPick(["Yukarıdan her şey daha net görünüyor. Tam bir vizör!","Basamakları kendim yazdım. Noktalı virgül sağlam malzemedir.","Merdiven yazmak kolay, inmek zor."]));
  else await cwWait(900);
  const lx=Math.max(b.L+CW.W*.5+4,Math.min(b.R-CW.W*.5-4,cols[N-1]+dir*CW.W*.9));await cwHop(lx,b.B,26,520);CW.surf="floor"}
 finally{CW.surf="floor";cwDissolve(blocks.reverse(),35)}return true}
/* merdiven: yan duvarda yukarı, tavanda baş aşağı yürüyüş ve aşağı atlayış */
async function cwLadder(){const b=cwB();if(b.B-b.T<140)return false;const side=CW.x-b.L<b.R-CW.x?-1:1;const lx=side<0?b.L+CW.W*.5+4:b.R-CW.W*.5-4;
 await cwWalk(lx);CW.face=-side;const gap=Math.round(CW.U*7.5);const rungs=[];CW.pose="type";CW.typing=true;
 try{for(let y=b.B-gap*.6;y>b.T+gap*.4;y-=gap){rungs.push(cwGlyph(lx-CW.W*.42,y-gap*.35,`${cwPick(["{","(","[","<"])} ${cwPick([";","=","/","*"])} ${cwPick(["}",")","]",">"])}`,"rung"));if(rungs.length%3===0)cwBlip("key");await cwWait(38)}
  CW.typing=false;CW.surf="ladder";CW.pose="climb";CW.moving=true;const y0=CW.y,y1=b.T+CW.H-3*CW.U;await cwTween((y0-y1)/150*1000,k=>{CW.y=y0+(y1-y0)*k});CW.moving=false;
  CW.pose="idle";const r0=CW.rot;await cwTween(320,k=>{CW.rot=r0+180*k*(-side)});CW.rot=0;CW.face=-CW.face;CW.flip=true;CW.surf="ceil";CW.y=cwB().T;
  cwDissolve(rungs.slice(),25);rungs.length=0;
  const tx=cwFreeX((b.L+b.R)/2);await cwWalk(tx,40);
  if(cwMaySay())await cwSay(cwPick(["Tavandan selamlar! Buradan herkes baş aşağı görünüyor.","Yer çekimi mi? Bende yer çekimi yok, kod çekimi var.","Buradan Kadraj'ın üst çubuğunu tamir ediyorum. Şaka şaka."]));else await cwWait(1200);
  CW.pose="surprised";await cwWait(300);CW.flip=false;CW.face=-CW.face;CW.rot=180;CW.surf="air";CW.y=cwB().T+CW.H;
  await cwFall(cwB().B,{rot0:180,rot1:360});CW.rot=0;CW.surf="floor";await cwHop(CW.x+CW.face*14,cwB().B,10,260)}
 finally{CW.flip=false;CW.rot=0;CW.surf="floor";CW.y=cwB().B;CW.typing=false;cwDissolve(rungs,20)}return true}

/* --- kalkan --- */
function cwShieldShow(lvl){if(!CW.shEl){const d=document.createElement("div");d.className="cw-shield";CW.b.appendChild(d);CW.shEl=d}
 const n=18;let tx="";const pts=[];for(let i=0;i<6;i++){const a=Math.PI/3*i-Math.PI/2;pts.push([50+44*Math.cos(a),50+44*Math.sin(a)])}
 for(let i=0;i<n;i++){const e=Math.floor(i/3),f=(i%3+.5)/3;const[a1,b1]=pts[e],[a2,b2]=pts[(e+1)%6];tx+=`<text x="${(a1+(a2-a1)*f).toFixed(1)}" y="${(b1+(b2-b1)*f+3.5).toFixed(1)}" style="--i:${i}">${esc(CW_GLY[i%CW_GLY.length])}</text>`}
 CW.shEl.innerHTML=`<svg viewBox="0 0 100 100" aria-hidden="true"><polygon points="${pts.map(p=>p.map(v=>v.toFixed(1)).join(",")).join(" ")}"/>${tx}</svg>`;
 CW.shEl.dataset.l=lvl;CW.shEl.classList.remove("out");cwSfx("shield")}
function cwShieldHide(now){const d=CW.shEl;if(!d)return;CW.shEl=null;if(now||cwReduce())d.remove();else{d.classList.add("out");setTimeout(()=>d.remove(),420)}}

/* --- yatak --- */
function cwBG(){return CW.room?{w:26,h:13,ix:1,iy:2}:{w:32,h:16,ix:2,iy:3}}
function cwBedSpot(){if(CW.room)return CW.room.bed.x;const b=cwB();const bw=32*CW.U;const xs=[b.R-bw/2-8,b.L+bw/2+8];for(const x of xs){const r={left:x-bw/2,top:b.B-16*CW.U,width:bw,height:16*CW.U};if(!cwBlocks(r))return x}return xs[0]}
function cwBedPlace(){const bd=CW.bed;if(!bd)return;const G=cwBG();const bw=G.w*CW.U,bh=G.h*CW.U;const t=`translate3d(${Math.round(bd.x-bw/2)}px,${Math.round(bd.y-bh)}px,0)`;if(CW.bedB._t!==t){CW.bedB.style.transform=CW.bedF.style.transform=t;CW.bedB._t=t}}
function cwBedShow(x){if(CW.room)return;const b=cwB();CW.bed={x,y:b.B};cwBedPlace();CW.bedB.hidden=CW.bedF.hidden=false;if(!cwReduce()){CW.bedB.classList.remove("pop");CW.bedF.classList.remove("pop");void CW.bedB.offsetWidth;CW.bedB.classList.add("pop");CW.bedF.classList.add("pop")}}
function cwBedRemove(){if(CW.room){CW.inBed=false;return}CW.bed=null;CW.inBed=false;if(CW.bedB){CW.bedB.hidden=CW.bedF.hidden=true}}
async function cwIntoBed(){const bd=CW.bed;if(!bd)return;const G=cwBG();const tx=bd.x+G.ix*CW.U,ty=bd.y-G.iy*CW.U;
 if(cwReduce()||Math.abs(CW.x-tx)>200){CW.x=tx;CW.y=ty}else{const side=CW.x<tx?-1:1;const ax=bd.x+side*(G.w/2*CW.U+CW.W*.5);if(Math.abs(CW.x-ax)>4)await cwWalk(Math.max(cwB().L+CW.W*.5,Math.min(cwB().R-CW.W*.5,ax)));CW.surf="bed";await cwHop(tx,ty,20,380)}
 CW.surf="bed";CW.inBed=true;CW.face=1}
function cwWireBed(){for(const el of[CW.bedB,CW.bedF]){
 el.addEventListener("pointerdown",e=>{if(!CW.bed||e.button>0)return;e.preventDefault();cwAudioUnlock();el.setPointerCapture&&el.setPointerCapture(e.pointerId);
  CW.drag={id:e.pointerId,sx:e.clientX,sy:e.clientY,bx:CW.bed.x,by:CW.bed.y,moved:false,el,wasIn:CW.inBed}});
 el.addEventListener("pointermove",e=>{const d=CW.drag;if(!d||d.id!==e.pointerId)return;const dx=e.clientX-d.sx,dy=e.clientY-d.sy;
  if(!d.moved&&Math.hypot(dx,dy)>8){d.moved=true;if(d.wasIn)cwRun(actBedYank,{pri:7,name:"yank"})}
  if(d.moved){const b=cwB();const bw=32*CW.U;CW.bed.x=Math.max(b.L+bw/2,Math.min(b.R-bw/2,d.bx+dx));CW.bed.y=Math.max(b.T+16*CW.U,Math.min(b.B,d.by+dy));cwBedPlace()}});
 const up=e=>{const d=CW.drag;if(!d||d.id!==e.pointerId)return;CW.drag=null;if(!d.moved){cwTap();return}
  const far=Math.hypot(CW.bed.x-d.bx,CW.bed.y-d.by)>24;if(far)cwRun(actBedBack.bind(null,{x:d.bx,y:d.by}),{pri:7,name:"bedback"});else if(d.wasIn)cwRun(actSleepIn,{pri:1,name:"bed"})};
 el.addEventListener("pointerup",up);el.addEventListener("pointercancel",up)}}

/* --- dokunma, vurma, savurma --- */
function cwWireHit(){const h=CW.hit;let pd=null;
 h.addEventListener("pointerdown",e=>{cwAudioUnlock();CW.lastInput=now();pd={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now(),fl:false};try{h.setPointerCapture(e.pointerId)}catch{}});
 h.addEventListener("pointermove",e=>{if(!pd||pd.id!==e.pointerId||pd.fl)return;const dx=e.clientX-pd.x,dy=e.clientY-pd.y,dt=performance.now()-pd.t;const dist=Math.hypot(dx,dy);
  if(dist>40&&dist/Math.max(1,dt)>1.1){pd.fl=true;cwFling(dx>0?1:-1)}});
 const up=e=>{if(!pd||pd.id!==e.pointerId)return;const p=pd;pd=null;if(p.fl)return;if(Math.hypot(e.clientX-p.x,e.clientY-p.y)<14&&e.type==="pointerup")cwTap()};
 h.addEventListener("pointerup",up);h.addEventListener("pointercancel",up);
 h.addEventListener("click",e=>{e.preventDefault();e.stopPropagation()});
 h.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();cwSingleTap()}})}
function cwTap(){const t=now();CW.lastInput=t;CW.taps=CW.taps.filter(x=>t-x<1200);CW.taps.push(t);const n=CW.taps.length;
 if(CW.leaving)return;
 if(CW.shieldLvl>0){CW.lastHit=t;if(n>=2){CW.taps=[];clearTimeout(CW.tapT);if(CW.shieldLvl<3){CW.shieldLvl++;cwRun(actShield,{pri:6,name:"shield"})}else cwSfx("shield")}return}
 if(n>=3){CW.taps=[];clearTimeout(CW.tapT);cwMenuClose();CW.shieldLvl=1;CW.lastHit=t;cwRun(actShield,{pri:6,name:"shield"});return}
 clearTimeout(CW.tapT);CW.tapT=setTimeout(()=>{if(CW.taps.length&&CW.taps.length<3)cwSingleTap()},Math.max(20,330/CW.speed))}
function cwFling(dir){const t=now();CW.lastHit=t;CW.taps=[];clearTimeout(CW.tapT);cwMenuClose();CW.shieldLvl=Math.min(3,CW.shieldLvl+1);cwRun(actShield.bind(null,dir),{pri:6,name:"shield"})}
function cwSingleTap(){if(CW.leaving)return;if(CW.menu){cwMenuClose();return}if(CW.ask){cwAskClose();return}
 if(CW.inBed||CW.act==="nap"){cwRun(async()=>{CW.zz=false;CW.pose="sleepy";await cwSay(cwPick(["Hıı? Uyuyordum... Ne oldu?","Zzz... Ha? Buradayım, buradayım!","Rüyamda lastik ördeğimle satranç oynuyordum. Ne vardı?"]),{hold:600});cwMenu()},{pri:5,name:"wake"});return}
 cwCancel();CW.pose="idle";CW.lookX=0;cwMenu()}

/* --- menü ve soru kutusu --- */
function cwMenu(){CW.menu=true;const night=cwNight();const rm=CW.room&&CW.room.kind==="room";
 const it=[["joke","Soğuk espri"],["tip","Bir ipucu"],["ask","Clawd'a sor"],["play",cwPeriod()==="m"?"Gitar çal":"Dans et"],...(rm?[["light",CW.room.light?"Işığı kapat":"Işığı aç"]]:[]),["nap",night||CW.inBed?"Uyumaya dön":"Biraz uyu"],["hide","Clawd'ı gizle"]];
 cwBubOpen("menu",`<div class="cw-mh">Clawd</div>`+it.map(([k,l])=>`<button type="button" data-cw="${k}"${k==="hide"?' class="dim"':""}>${esc(l)}</button>`).join(""));CW.pose="wave";cwSfx("pop")}
function cwMenuClose(){if(!CW.menu)return;CW.menu=false;if(CW.bubK==="menu")cwBubClose();if(CW.pose==="wave"&&!CW.busy)CW.pose="idle";CW.nextAt=CW.clock+2500}
function cwAskOpen(){CW.ask=true;CW.menu=false;cwBubOpen("ask",`<form class="cw-askf" autocomplete="off"><label class="cw-mh" for="cwQ">Clawd'a sor</label><div class="cw-ar"><input id="cwQ" maxlength="240" enterkeyhint="send" placeholder="Kadraj ya da merak ettiğin bir şey" aria-label="Clawd'a sor"><button type="submit" aria-label="Sor">${I("send")}</button></div></form>`);
 CW.pose="listen";const i=CW.bub.querySelector("input");setTimeout(()=>{try{i.focus({preventScroll:true})}catch{}},30)}
function cwAskClose(){if(!CW.ask)return;CW.ask=false;const ae=document.activeElement;if(ae&&CW.root.contains(ae))ae.blur();if(CW.bubK==="ask")cwBubClose();if(!CW.busy)CW.pose="idle";CW.nextAt=CW.clock+2000}
function cwBubClick(e){const b=e.target.closest&&e.target.closest("[data-cw]");if(!b)return;e.preventDefault();e.stopPropagation();const k=b.dataset.cw;cwMenuClose();CW.lastInput=now();
 if(k==="joke")cwRun(actJoke,{pri:5,name:"joke"});
 else if(k==="tip")cwRun(async()=>{CW.pose="idle";await cwSay(cwBag("t",CW_TIPS))},{pri:5,name:"tip"});
 else if(k==="ask"){cwCancel();cwAskOpen()}
 else if(k==="nap")cwRun(actNapBed,{pri:4,name:"bed"});
 else if(k==="play")cwRun(cwPeriod()==="m"?actGuitar:actDance,{pri:5,name:cwPeriod()==="m"?"guitar":"dance"});
 else if(k==="light")cwRun(actSwitch,{pri:5,name:"switch"});
 else if(k==="hide")cwDisable(true)}
document.addEventListener("pointerdown",e=>{CW.lastInput=now();if(!CW.root)return;const t=e.target;if(CW.root.contains(t)||(t.closest&&t.closest(".cw-room .cw-hit")))return;
 if(CW.menu)cwMenuClose();if(CW.ask)cwAskClose();if(CW.act==="nap")cwRun(actWakeNap,{pri:4,name:"wake"})},true);
document.addEventListener("keydown",()=>{CW.lastInput=now()},true);

/* --- etkinlikler --- */
function cwMaySay(){return now()-CW.lastSay>CW.quietMs&&!CW.menu&&!CW.ask&&(CW.lastSay=now(),true)}
async function actWander(){const x=cwFreeX();await cwWalk(x);CW.pose="idle";await cwWait(cwRand(600,1600))}
async function actLook(){CW.pose="idle";CW.lookX=-1;await cwWait(cwRand(500,900));CW.lookX=1;await cwWait(cwRand(500,900));CW.lookX=0;CW.pose="lookup";await cwWait(600);CW.pose="idle"}
async function actSit(){CW.pose="sit";await cwWait(cwRand(2500,5000));CW.pose="idle"}
async function actPeek(){const b=cwB();const side=CW.x-b.L<b.R-CW.x?-1:1;const edge=side<0?b.L+CW.W*.5+2:b.R-CW.W*.5-2;await cwWalk(edge);
 const out=side<0?b.L-CW.W*.12:b.R+CW.W*.12;await cwWalk(out,30);CW.face=-side;CW.pose="idle";CW.lookX=-side;await cwWait(900);
 if(cwMaySay())await cwSay(cwPick(["Ce-e!","Buradan bakınca her şey yarım görünüyor.","Kenarda dikizlemek de bir sanat."]),{hold:1300});else await cwWait(700);
 CW.lookX=0;await cwWalk(edge-side*CW.W*.6,40)}
async function actDance(){CW.pose="dance";for(let i=0;i<3;i++){await cwWait(450);await cwHop(CW.x,cwB().B,16,320);CW.pose="dance"}await cwWait(700);CW.pose="idle"}
async function actJoke(){const j=cwBag("j",CW_JOKES).split("|");CW.pose="idle";if(j.length>1){await cwSay(j[0],{hold:1300});CW.pose="happy";await cwSay(j[1],{hold:2200})}else await cwSay(j[0]);
 if(Math.random()<.35){CW.pose="happy";await cwSay(cwPick(CW_JOKE_TAIL),{hold:1500})}CW.pose="idle"}
async function actStill(){const b=cwB();CW.face=-1;CW.surf="floor";CW.x=b.R-CW.W*.5-10;CW.y=b.B;CW.pose="sit";await cwWait(6000)}
async function actNap(){CW.pose="sleepy";await cwWait(1200);
 if(CW.room&&CW.room.kind==="room"&&CW.bed){if(cwMaySay())await cwSay("Kimse yokken biraz kestireyim...",{hold:900});await cwIntoBed();cwRoomLamp(false);CW.pose="sleep";CW.zz=true;try{for(;;)await cwWait(1000)}finally{CW.zz=false}}
 CW.pose="sit";await cwWait(400);CW.pose="sleep";CW.zz=true;try{for(;;)await cwWait(1000)}finally{CW.zz=false}}
async function actWakeNap(){CW.zz=false;CW.pose="surprised";if(CW.inBed){CW.inBed=false;CW.surf="floor";cwRoomLamp();const bd=CW.bed;await cwHop(bd?Math.max(cwB().L+CW.W*.5,bd.x-(cwBG().w/2*CW.U+CW.W*.5)):CW.x,cwB().B,10,320)}else await cwHop(CW.x,cwB().B,12,280);await cwSay(cwPick(["Uyuyakalmışım! Kod derlenirken gözüm dalmış.","Ha? Uyumuyordum, gözlerimi dinlendiriyordum.","Hop, geldim! Rüyamda sonsuz döngüdeydim."]))}
async function actSleepIn(){CW.inBed=true;CW.surf="bed";CW.pose="sleep";CW.zz=true;CW.sleptAt=now();cwRoomLamp(false);
 try{for(;;){await cwWait(1000);if(!cwNight()&&!(CW.napUntil&&now()<CW.napUntil)){CW.napUntil=0;await actMorning();return}
  if(cwNight()&&!CW.napUntil&&cwOwlWake()){CW.zz=false;await actOwlUp();return}}}finally{CW.zz=false}}
async function actBedtime(){if(!CW.bed){const x=cwBedSpot();if(!cwReduce()){await cwWalk(Math.max(cwB().L+CW.W,Math.min(cwB().R-CW.W,x+(x>CW.x?-1:1)*(16*CW.U+CW.W*.5))));await cwSay("bed.spawn()",{kind:"code",hold:200})}cwBedShow(x);cwBurst(x,cwB().B-20,12)}
 if(!CW.inBed){if(cwMaySay()&&cwNight())await cwSay(cwPick(["Saat geç oldu, yatma vakti. Pijamalarım nerede?","Uykum geldi. Yarın daha komik olacağım, söz."]),{hold:1400});await cwIntoBed()}
 return actSleepIn()}
async function actNapBed(){CW.napUntil=cwNight()?0:now()+45000/CW.speed;return actBedtime()}
async function actMorning(){CW.zz=false;CW.pose="sleepy";await cwWait(800);CW.inBed=false;CW.surf="floor";await cwHop(CW.bed?Math.max(cwB().L+CW.W*.5,CW.bed.x-(cwBG().w/2*CW.U+CW.W*.5)):CW.x,cwB().B,CW.room?10:18,380);
 const bx=CW.bed?CW.bed.x:CW.x;if(!CW.room)cwBurst(bx,cwB().B-18,10);cwBedRemove();CW.pose="happy";cwRoomLamp();
 if(!cwNight()&&cwPeriod()==="m"&&now()-CW.lastGuitar>60000){await cwSay(cwPick(["Günaydın! Sabah rutini: önce gitar, sonra her şey.","Günaydın dünya! Amfiyi açıyorum."]),{hold:900});return actGuitar()}
 await cwSay(cwNight()?"Dinlendim! Hadi biraz daha takılalım.":cwPick(["Oh be, kod gibi dinlendim!","Günaydın dünya! Ben geldim."]),{hold:1400})}
/* gece irkilmesi: "Hâlâ uyumadın mı?" → "İyi geceler" → yataktan düşer, başını vurur, geri yatar */
async function actStartled(){if(!CW.bed){cwBedShow(cwBedSpot())}if(!CW.inBed){CW.inBed=true;CW.surf="bed";cwFollow()}
 CW.zz=false;CW.pose="surprised";cwSfx("pop");await cwHop(CW.x,CW.y,14,260);CW.pose="surprised";
 await cwSay("Hâlâ uyumadın mı?",{hold:1100});CW.pose="sleepy";await cwSay(`İyi geceler ${cwUn()}`,{hold:900});
 if(!cwReduce()){const b=cwB();const bd=CW.bed;const dir=bd.x>(b.L+b.R)/2?-1:1;const fx=Math.max(b.L+CW.W*.6,Math.min(b.R-CW.W*.6,bd.x+dir*(cwBG().w/2*CW.U+CW.W*.55)));
  CW.inBed=false;CW.surf="floor";CW.pose="sleepy";await cwWait(300);CW.pose="surprised";
  await cwHop(fx,b.B,10,420,{rot0:0,rot1:dir*90});CW.oy=-2.5*CW.U;cwSfx("bonk");CW.pose="lie";CW.stars=true;CW.bumpOn=true;
  await cwWait(500);CW.pose="dizzy";await cwSay(cwPick(["Ayy, başım! Yer çekimi yine kazandı.","Kafamda yıldızlar dönüyor. Bari dilek tutayım.","Bu düşüş benim değil, yatağın hatası!"]),{hold:900});await cwWait(600);
  CW.stars=false;await cwTween(260,k=>{CW.rot=dir*90*(1-k);CW.oy=-2.5*CW.U*(1-k)});CW.rot=0;CW.oy=0;CW.pose="dizzy";await cwWait(500);
  CW.bumpOn=false;await cwIntoBed()}
 else{CW.pose="sleepy";await cwWait(600)}
 return actSleepIn()}
async function actBedYank(){CW.inBed=false;CW.zz=false;CW.surf="floor";CW.pose="surprised";if(!cwReduce())await cwFall(cwB().B);else CW.y=cwB().B;CW.pose="surprised";
 await cwSay(cwPick(["Hop! Yatağım nereye gidiyor?","Heey! Yatağımla nereye?"]),{hold:60000})}
async function actBedBack(from){const b=cwB();const bd=CW.bed;if(!bd)return;CW.inBed=false;CW.zz=false;if(CW.surf!=="floor"){CW.surf="floor";CW.y=b.B}
 CW.pose="surprised";if(CW.bubK!=="say")await cwSay("Yatağım! Dur bakalım...",{hold:500});
 const onFloor=Math.abs(bd.y-b.B)<30&&!cwBlocks({left:bd.x-16*CW.U,top:bd.y-16*CW.U,width:32*CW.U,height:16*CW.U});
 if(onFloor&&Math.random()<.4){await cwSay("self.teleport(bed)",{kind:"code",hold:250});cwBurst(CW.x,CW.y-CW.H*.4,16);cwSfx("tele");CW.b.classList.add("tp");await cwWait(260);
  CW.x=bd.x+2*CW.U;CW.y=bd.y-3*CW.U;CW.inBed=true;CW.surf="bed";cwBurst(CW.x,CW.y-CW.H*.4,16);await cwWait(120);CW.b.classList.remove("tp");CW.pose="happy";
  await cwSay("Peki, yatağın yeni yeri burası olsun. Manzarası güzelmiş.",{hold:1500})}
 else{const home=from&&Math.abs(from.y-b.B)<30?from.x:cwBedSpot();if(Math.abs(CW.x-home)>40&&!cwReduce())await cwWalk(Math.max(b.L+CW.W*.5,Math.min(b.R-CW.W*.5,home+(home>(b.L+b.R)/2?-1:1)*(16*CW.U+CW.W*.5))));
  await cwSay("bed.teleport(clawd)",{kind:"code",hold:250});cwBurst(bd.x,bd.y-18,18);cwSfx("tele");CW.bedB.classList.add("tp");CW.bedF.classList.add("tp");await cwWait(240);
  bd.x=home;bd.y=b.B;cwBedPlace();cwBurst(home,b.B-18,18);await cwWait(160);CW.bedB.classList.remove("tp");CW.bedF.classList.remove("tp");CW.pose="happy";
  await cwSay(cwPick(CW_BEDLINE),{hold:1500});await cwIntoBed()}
 if(cwNight()||(CW.napUntil&&now()<CW.napUntil))return actSleepIn();await actMorning()}
async function actShield(dir){const lvl=CW.shieldLvl||1;CW.zz=false;if(CW.inBed){CW.inBed=false;CW.surf="floor";CW.y=cwB().B}if(CW.surf==="ceil"||CW.surf==="stairs"||CW.surf==="ladder"){CW.surf="floor";CW.flip=false;CW.rot=0;CW.y=cwB().B}
 if(dir&&!cwReduce()){CW.pose="surprised";const b=cwB();await cwHop(Math.max(b.L+CW.W*.5,Math.min(b.R-CW.W*.5,CW.x+dir*40)),b.B,12,260)}
 if(!CW.shEl){await cwSay(lvl>1?"shield.upgrade()":"shield.up()",{kind:"code",hold:120})}else{CW.pose="type";await cwWait(160)}
 cwShieldShow(lvl);CW.pose="shield";await cwSay(CW_HIT[Math.min(2,lvl-1)],{hold:1300});CW.pose="shield";
 while(now()-CW.lastHit<CW.forgive/CW.speed)await cwWait(250);
 CW.pose="idle";await cwSay(cwPick(CW_FORGIVE),{hold:1200});cwShieldHide();CW.shieldLvl=0;CW.pose="happy";await cwWait(900);CW.pose="idle"}
async function actArrive(){const b=cwB();const p=cwPeriod();CW.arrived=true;
 const seenK="kadraj_clawd_seen_"+S.uid;const last=LS.get(seenK,0);LS.set(seenK,now());const introK="kadraj_clawd_intro_"+S.uid;const first=!LS.get(introK,false);
 if(p==="n"){CW.lastSay=now();return actStartled()}
 if(!cwReduce()&&!CW.room){CW.surf="floor";CW.y=b.B;CW.x=b.R+CW.W*.6;await cwWalk(b.R-CW.W*.5-24,90,"run")}
 else if(CW.room&&!cwReduce()){CW.inBed=false;CW.surf="floor";CW.y=b.B;CW.pose="surprised";await cwHop(CW.x,b.B,10,300)}
 CW.pose="wave";await cwWait(300);
 if(last&&now()-last>3*86400e3){CW.pose="joy";await cwSay("Özledim seni!",{hold:900})}
 if(first){LS.set(introK,true);await cwSay("Merhaba! Ben Clawd. Kadraj'da yaşayan piksel bir yaratığım, artık burada küçük bir odam var.",{hold:1600})}
 CW.pose="wave";await cwSay(cwPick(CW_GREET[p]),{hold:2200});
 if(first){CW.pose="idle";await cwSay("Bana dokunursan espri yaparım, soru sorarsan cevaplarım. Bilmediğimi itiraf ederim, sonra soğuk bir espri patlatırım!",{hold:2200})}
 CW.lastSay=now();CW.pose="idle"}
async function actReturn(){const b=cwB();CW.returning=false;if(!cwReduce()){CW.surf="floor";CW.y=b.B;CW.x=b.L-CW.W*.6;await cwWalk(b.L+(b.R-b.L)*.45,110,"run");await cwHop(CW.x,b.B,22,340);await cwHop(CW.x,b.B,16,300)}
 CW.pose="joy";cwSfx("pop");await cwSay("Beni geri çağırdın!",{hold:900});CW.pose="happy";await cwSay(cwPick(["Seni çok özlemiştim. Tam olarak ne kadar mı? Bir sonsuz döngü kadar.","Söz, daha komik olacağım. Belki.","Eşyalarımı topladım, geri geldim. Yatağımı da getirdim!"]),{hold:1800});CW.pose="idle";CW.lastSay=now()}
async function actLeave(){CW.leaving=true;try{CW.zz=false;if(CW.inBed){CW.inBed=false;CW.surf="floor";CW.y=cwB().B}cwBedRemove();cwShieldHide(true);CW.shieldLvl=0;
 if(CW.surf!=="floor"){CW.surf="floor";CW.flip=false;CW.rot=0;CW.y=cwB().B}
 CW.pose="cry";CW.tears=true;await cwThink(`${CW_BHEART}<span>neden?..</span>`,2600);
 await cwSay(cwPick(["Peki... Gidiyorum. Ayarlar'dan beni geri çağırabilirsin.","Anladım... Biraz kenarda ağlayacağım. Ayarlar'da beklerim."]),{hold:1300});
 if(!cwReduce()){const b=cwB();const side=CW.x<(b.L+b.R)/2?-1:1;await cwWalk(side<0?b.L-CW.W*.7:b.R+CW.W*.7,CW.room?60:26,"crywalk")}
 else{CW.root.classList.add("off");await cwWait(400)}}
 finally{CW.tears=false;CW.leaving=false;CW.pose="idle";CW.x=-1;CW.root.classList.add("off");CW.vis=false}}
async function actRoute(r,p){const k=r==="profile"?(p&&p.uid===S.uid?"profile_me":"profile"):r;const l=CW_ROUTE[k];
 if(!l||!cwMaySay()){if(now()-CW.lastWave<15000)return;CW.lastWave=now();CW.pose="wave";await cwWait(1100);CW.pose="idle";return}
 CW.lastWave=now();CW.pose="wave";await cwWait(400);CW.pose="idle";await cwSay(cwPick(l))}
async function actToast(){CW.pose="surprised";await cwHop(CW.x,cwB().B,16,300);CW.pose="idle";await cwWait(400)}
async function actWin(){CW.pendWin=false;CW.pose="joy";await cwSay("Şah mat! Zafer dansı başlıyor!",{hold:400});await actDance();CW.pose="happy";await cwSay("Bu zaferi gitarla kutlamak lazım!",{hold:1400})}

/* --- beyin --- */
function cwBrain(){if(CW.busy||CW.menu||CW.ask||CW.drag||CW.clock<CW.nextAt)return;
 if(!CW.arrived&&CW.wantArrive){CW.wantArrive=false;cwRun(actArrive,{pri:3,name:"arrive"});return}
 if(CW.returning){cwRun(actReturn,{pri:4,name:"return"});return}
 if(CW.pendWin&&!cwNight()){cwRun(actWin,{pri:3,name:"dance"});return}
 if(CW.pend.length){const p=CW.pend.shift();cwRun(p.fn,{pri:p.pri,name:p.name});return}
 const rk=CW.room&&CW.room.kind;
 if(rk==="disco"){cwRun(actDisco,{pri:0,name:"disco"});return}
 if(rk==="nook"){cwRun(actNook,{pri:0,name:"nook"});return}
 if(CW.inBed){cwRun(actSleepIn,{pri:1,name:"bed"});return}
 if(cwNight()){if(cwOwlOk())cwRun(actOwl,{pri:1,name:"owl"});else cwRun(actBedtime,{pri:1,name:"bed"});return}
 if(cwReduce()){cwRun(actStill,{pri:0,name:"still"});return}
 if(now()-CW.lastInput>CW.napAfter){cwRun(actNap,{pri:0,name:"nap"});return}
 const w=cwWeights();
 let r=Math.random()*w.reduce((a,x)=>a+x[1],0);for(const[n,v,f]of w){if((r-=v)<=0){cwRun(f,{pri:0,name:n});return}}}

/* --- bilgi tabanı eşleşmesi --- */
function cwFold(s){return kbFold(s).replace(/[’'`´]/g,"").replace(/[^a-z0-9@#_.+\s]/g," ").replace(/\s+/g," ").trim()}
function cwMatch(q){const fq=" "+cwFold(q)+" ";const toks=fq.trim().split(" ").filter(t=>t&&!CW_STOPW.has(t));let best=null,b2=0;
 for(const e of CW_KB){let sc=0;for(const k0 of e.k){const k=cwFold(k0);if(!k)continue;
   if(k.includes(" ")){if(fq.includes(" "+k))sc+=3}
   else if(toks.some(t=>t===k||(k.length>=4&&t.startsWith(k))||(t.length>=5&&k.startsWith(t)&&k.length-t.length<=2)))sc+=k.length>=4?2:1.5}
  if(sc>0){if(!best||sc>best.sc){b2=best?best.sc:0;best={e,sc}}else if(sc>b2)b2=sc}}
 const topic=toks.some(t=>CW_TOPIC.some(w=>t===w||(w.length>=4&&t.startsWith(w))));
 const conf=!!best&&best.sc>=2&&(best.sc-b2>=1||best.sc>=4);
 return{e:best&&best.e,sc:best?best.sc:0,conf,topic:topic||!!(best&&best.e.t!=="me"&&best.sc>=2)}}
/* 5.1: eski yapay zekâya sorma özelliği ve üstteki kart tamamen kaldırıldı. Clawd çevrimdışıdır: bilmediğini dürüstçe ve komik bir dille
   söyler, ardından soğuk bir espri anlatır (actDunno). */
const CW_DUNNO=["Bunu bilmiyorum. Piksellerim yetmedi.","Hmm... Bu soru benim 23 pikselime sığmadı.","Bilmiyorum! Ama bilmediğimi bilmek de bir bilgidir, değil mi?",
 "Bu konuda bellek taşması yaşadım. Yani bilmiyorum.","Kodlarıma baktım, yok. Çekmeceme baktım, bir çorap çıktı. Bilmiyorum.","Bunu bilseydim gitarımla şarkısını yapardım. Bilmiyorum.",
 "Ampulüm yandı ama fikir gelmedi. Bilmiyorum."];
const CW_DUNNO_T=["Onun yerine bir soğuk espri anlatayım:","Ama bir soğuk espri biliyorum:","Telafi olarak bir espri:"];
function cwAsk(q){CW.lastInput=now();cwRun(async()=>{const m=cwMatch(q);CW.pose="idle";const fl=cwFold(q);
 if(m.e&&(m.conf||m.e.t==="me"&&m.sc>=2)){
  if(/espri|saka|fikra|guldur/.test(fl))return actJoke();if(/ipucu|tavsiye/.test(fl))return cwSay(cwBag("t",CW_TIPS));
  if(m.e.t==="code"){CW.pose="type";await cwSay("Hemen kodlarıma bakıyorum...",{kind:"code",hold:200})}CW.pose="idle";await cwSay(m.e.a,{hold:cwHold(m.e.a)+800});return}
 if(/(^| )(espri|saka|fikra|guldur)/.test(fl))return actJoke();
 if(/(^| )(gitar|cal)( |$)/.test(fl)&&typeof actGuitar==="function")return actGuitar();
 if(/(^| )(dans|oyna)( |$)/.test(fl))return actDance();
 return actDunno()},{pri:5,name:"ask"})}
async function actDunno(){CW.pose="shrug";await cwSay(cwPick(CW_DUNNO),{hold:900});CW.pose="idle";await cwSay(cwPick(CW_DUNNO_T),{hold:500});return actJoke()}
addEventListener("resize",()=>{cwSize();CW.bT=0});

/* --- ses: piksel konuşma --- */
const CWS={ctx:null,n:0};
function cwAudioUnlock(){if(!cwOn()||settings.clawdSound===false)return;try{if(!CWS.ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;CWS.ctx=new AC()}if(CWS.ctx.state==="suspended")CWS.ctx.resume().catch(()=>{})}catch{}}
["pointerup","keydown","touchend"].forEach(ev=>document.addEventListener(ev,()=>{if(CWS.ctx&&CWS.ctx.state==="suspended"&&cwOn()&&settings.clawdSound!==false)cwAudioUnlock()},{capture:true,passive:true}));
function cwTone(type,f0,f1,dur,vol,at=0){const c=CWS.ctx;const t=c.currentTime+at;const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.linearRampToValueAtTime(f1,t+dur);
 g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+dur+.03);CWS.n++}
function cwSoundOk(){return cwOn()&&settings.clawdSound!==false&&!document.hidden&&CWS.ctx&&CWS.ctx.state==="running"}
function cwBlip(kind){if(!cwSoundOk())return;try{
 if(kind==="key"){cwTone("square",1300+Math.random()*300,1200,.018,.012)}
 else{const f=560+Math.random()*240;cwTone("square",f,f*1.14,.045,.022)}}catch{}}
function cwSfx(k){if(!cwSoundOk())return;try{
 if(k==="hop")cwTone("square",380,720,.09,.016);else if(k==="bonk"){cwTone("square",220,90,.14,.03);cwTone("triangle",120,70,.16,.03,.02)}
 else if(k==="tele")cwTone("square",300,1500,.28,.018);else if(k==="pop")cwTone("square",700,1000,.05,.018);
 else if(k==="shield"){cwTone("square",520,520,.06,.016);cwTone("square",660,660,.06,.016,.07);cwTone("square",880,880,.09,.016,.14)}}catch{}}

/* --- uygulama olaylarına tepkiler --- */
HOOKS.enter.push(()=>{cwMount();CW.arrived=false;CW.wantArrive=true;CW.lastInput=now();if(cwOn())cwKick()});
HOOKS.after.push(r=>{if(!CW.root)return;if(r!==CW.route){const prev=CW.route;CW.route=r;if(prev&&CW.vis&&CW.arrived&&!CW.leaving){const k=r==="chess"?"chess":r;if(CW_ROUTE[k]||r==="profile")cwQueue("route",()=>actRoute(r,S.route.params),2)}}cwKick()});
const toastBaseCW=toast;
toast=function(...a){const r=toastBaseCW.apply(this,a);try{if(CW.vis&&!CW.inBed&&!CW.leaving&&now()-CW.lastToastJump>4000&&(!CW.busy||CW.pri<2)){CW.lastToastJump=now();cwQueue("toast",actToast,2)}}catch{}return r};
const chOverBaseCW=chOver;
chOver=function(...a){try{if(typeof CH!=="undefined"&&CH&&CH.over&&!CH._cwSeen){CH._cwSeen=1;const res=CH.over.result;if((res==="1-0"&&CH.my===0)||(res==="0-1"&&CH.my===8))CW.pendWin=true}}catch{}return chOverBaseCW.apply(this,a)};
document.addEventListener("visibilitychange",()=>{if(!CW.root)return;if(document.hidden){CW.hiddenAt=now();if(CW.raf)cancelAnimationFrame(CW.raf);CW.raf=0;clearTimeout(CW.slow);CW.slow=0;if(S.uid)LS.set("kadraj_clawd_seen_"+S.uid,now());return}
 const away=CW.hiddenAt?now()-CW.hiddenAt:0;CW.hiddenAt=0;
 if(away>15*60e3&&cwOn()&&S.authed){if(cwNight())cwQueue("arrive",actStartled,4);else{CW.arrived=false;CW.wantArrive=true;if(CW.inBed&&!cwNight()){}}}
 cwKick()});

/* --- açma / kapatma (Ayarlar ve menü) --- */
function cwDisable(fromMenu){if(fromMenu){settings.clawd=false;saveSettings();if(S.route&&S.route.name==="settings")setTimeout(()=>{try{render(false)}catch{}},50)}
 if(!CW.root)return;cwMenuClose();if(CW.ask)cwAskClose();if(CW.vis){CW.leaving=true;cwRun(actLeave,{pri:9,name:"leave"})}else{cwHideNow("off")}}
function cwEnable(){if(!CW.root)cwMount();CW.leaving=false;CW.returning=true;CW.arrived=true;CW.x=-1;cwKick()}
const kbOnFlagBaseCW=kbOnFlag;
kbOnFlag=function(f,v){kbOnFlagBaseCW(f,v);try{if(f==="clawd"){if(v)cwEnable();else cwDisable(false)}else if(f==="clawdSound"&&v){cwAudioUnlock();setTimeout(()=>cwBlip("me"),60)}}catch(e){console.warn("clawd",e)}};
const vSettingsBaseCW=vSettings;
vSettings=function(){let h=vSettingsBaseCW();try{const i=h.indexOf('data-sec="gorunum"');const end=i<0?-1:h.indexOf("</div></section>",i);
 if(end>=0){const kw=s=>esc(kbFold(s));const row=(f,on,ic,c,t,s,k)=>`<label class="srow" data-k="${kw(t+" "+s+" "+k)}"><span class="sic" style="--c:${c}">${I(ic)}</span><span class="t">${t}<small>${s}</small></span><span class="sw"><input type="checkbox" data-set="${f}" ${on?"checked":""} aria-label="${esc(t)}"><span></span></span></label>`;
  const rows=row("clawd",cwOn(),"clawd","#D97757","Clawd","Ekranda yaşayan piksel arkadaşın. Kapatırsan biraz alınır.","maskot piksel karakter oda gitar gizle göster espri")+row("clawdSound",settings.clawdSound!==false,"vol","#D97757","Clawd sesleri","Konuşurken çıkan küçük retro bip sesleri","ses bip maskot clawd");
  h=h.slice(0,end)+rows+h.slice(end)}}catch(e){console.warn("clawd",e)}return h};

/* --- test ve hata ayıklama --- */
const CLAWD={debug:{
 setHour(h){CW.hourOv=h==null?null:+h;CW.nextAt=0;if(CW.busy&&CW.pri<=1)cwCancel();return cwHour()},
 fast(m){CW.speed=Math.max(.1,+m||1);return CW.speed},
 quiet(ms){CW.quietMs=+ms||0},napAfter(ms){CW.napAfter=+ms},forgive(ms){CW.forgive=+ms},
 idle(){CW.lastInput=0;CW.nextAt=0},
 info(){const r=CW.b&&CW.b.getBoundingClientRect();return{vis:CW.vis,why:CW.why,x:Math.round(CW.x),y:Math.round(CW.y),surf:CW.surf,face:CW.face,flip:CW.flip,act:CW.act,pose:CW.pose,busy:CW.busy,
  bub:CW.bub?CW.bub.textContent:"",bubK:CW.bubK,menu:CW.menu,ask:CW.ask,inBed:CW.inBed,bed:CW.bed&&{x:Math.round(CW.bed.x),y:Math.round(CW.bed.y)},shield:CW.shieldLvl,shieldEl:!!CW.shEl,
  pass:CW.pass,zz:!!CW._fzz,stars:!!CW._fst,tears:!!CW._ftr,rect:r&&{x:Math.round(r.left),y:Math.round(r.top),w:Math.round(r.width),h:Math.round(r.height)},bounds:CW.bnd,
  room:CW.room&&{kind:CW.room.kind,u:CW.room.u,w:Math.round(CW.room.w),h:Math.round(CW.room.h),rw:CW.room.RW,light:CW.room.light,el:!!CW.room.el.isConnected,inRoom:CW.room.el.contains(CW.b)},U:CW.U,blips:CWS.n,on:cwOn()}},
 tap(n=1){for(let i=0;i<n;i++)cwTap()},
 hit(){CW.taps=[];cwTap();cwTap();cwTap()},
 fling(d=1){cwFling(d)},
 menu(){cwCancel();cwMenu()},
 pick(k){const b=CW.bub&&CW.bub.querySelector(`[data-cw="${k}"]`);if(b)b.click();return!!b},
 ask(q){cwAsk(q)},askOpen(){cwCancel();cwAskOpen()},match(q){const m=cwMatch(q);return{a:m.e&&m.e.a,sc:m.sc,conf:m.conf,topic:m.topic,t:m.e&&m.e.t}},
 act(n){const f={wander:actWander,look:actLook,peek:actPeek,stairs:cwStairs,ladder:cwLadder,sit:actSit,dance:actDance,joke:actJoke,nap:actNap,bed:actBedtime,startled:actStartled,arrive:actArrive,
  ret:actReturn,leave:actLeave,win:actWin,toast:actToast,morning:actMorning,napbed:actNapBed,...CW_ACTS51}[n];if(f)cwRun(f,{pri:n==="leave"?9:5,name:n});return!!f},
 pose(p,ms){cwRun(async()=>{CW.pose=p;if(p==="sleep")CW.zz=true;if(p==="dizzy")CW.stars=true;if(p==="cry")CW.tears=true;try{await cwWait(ms||60000)}finally{CW.zz=CW.stars=CW.tears=false}},{pri:5,name:"pose:"+p})},
 say(t,o){cwRun(()=>cwSay(t,o||{}),{pri:5,name:"say"})},
 think(){cwRun(async()=>{CW.pose="cry";CW.tears=true;try{await cwThink(`${CW_BHEART}<span>neden?..</span>`,60000)}finally{CW.tears=false}},{pri:5,name:"think"})},
 shieldLvl(l){CW.shieldLvl=l;CW.lastHit=now();cwRun(actShield,{pri:6,name:"shield"})},
 bedDrag(dx,dy){if(!CW.bed)return false;const from={x:CW.bed.x,y:CW.bed.y};const wasIn=CW.inBed;const b=cwB();CW.bed.x=Math.max(b.L+16*CW.U,Math.min(b.R-16*CW.U,CW.bed.x+dx));CW.bed.y=Math.max(b.T+16*CW.U,Math.min(b.B,CW.bed.y+dy));cwBedPlace();
  if(wasIn)CW.inBed=false;cwRun(actBedBack.bind(null,from),{pri:7,name:"bedback"});return true},
 place(x,surf){const b=cwB();CW.x=x==null?CW.x:x;CW.surf=surf||"floor";CW.y=CW.surf==="ceil"?b.T:b.B;CW.flip=CW.surf==="ceil"},
 hide(){cwDisable(true)},show(){settings.clawd=true;saveSettings();cwEnable()},
 cancel(){cwCancel()}}};
/* oturum zaten açıksa (sıcak yeniden yükleme) hemen kur */
try{if(S&&S.authed)HOOKS.enter.length&&setTimeout(()=>{if(!CW.root){cwMount();CW.wantArrive=true;cwKick()}},0)}catch{}
/*}@js:50PIKO*/

/*@js:51CLAWD{*/
/* ===== 5.1 · Clawd'ın odası, gece/sabah düzeni ve yeni davranışlar =====
   - Oda (cwRoom*): sayfanın boş köşesine, içeriğin içine yerleşen piksel oda. Sayfayla birlikte kayar; sayfa değişince
     Clawd yeni sayfadaki odasında belirir, havada asılı kalmaz. Yerler (cwMeas*): Akış = hikâye şeridinin sağı,
     Keşfet = Satranç kartının altında "Kişiler" satırının sağı, Sohbet = notlar şeridinin sağı (Davet et üstü),
     Profil = ad satırının sağı (istatistiklerin altı). Sığmazsa oda kurulmaz, Clawd eskisi gibi ekranda gezer.
     Keşfet ve profilde gerekirse satır biraz uzatılır (CW.grow: sec-h padding-top / .btns margin-top), hiçbir yazının ya da
     düğmenin üstüne binilmez. Oda kapsayıcısı: sıfır yükseklikli .cw-rhost (öğeden sonra) ya da .cw-rc (profil).
   - Oda eşyaları: yatak (26x13), çekmece (açılır), tavandan sarkan ampul (duvardaki düğmeyle açılır/kapanır, çarpınca sallanır),
     pencere (saate göre gökyüzü), poster, halı. Clawd, CW.b öğesi odaya taşınarak çizilir; koordinatlar odaya göredir (cwB).
   - Klaket ekranında yan düğmelerin üstünde küçük bir köşe (nook: raf, patlamış mısır, klaket tahtası), yorumlar
     açıkken sayfanın üst kenarında dans pisti (disco).
   - Gece 00:00-07:00 uyur (cwNight). Kullanıcı etkinse uyumaz: esner, uyuklar, gece partisi yapar (actOwl*).
     Sabah (07-11) elektro gitar çalar (actGuitar, cwRiff WebAudio, sesler açıksa).
   - Yeni davranışlar: gerinme, yatağın kenarında oturma, çekmeceden bir şey çıkarma, ışık düğmesi, kitap okuma,
     kod parantezleriyle jonglörlük, hapşırma, beğenide konfeti (notifyMeta sarıldı → notifyMetaBaseCW),
     mesajda dans (notifyChats sarıldı → notifyChatsBaseCW), sayfa açılınca el sallama.
   - Ortak API: CLAWD.sprite(poz) → SVG metni (idle, happy, think, sad, dance1, dance2, guitar1, guitar2, sleep, surprised, talk ...). */
const CWR={RH:26,FL:23,MINW:68,MAXW:112,UMIN:2.4};
const cwRect=el=>el.getBoundingClientRect();
function cwTextRight(el){try{const r=document.createRange();r.selectNodeContents(el);let m=-1e9;for(const x of r.getClientRects())if(x.width>0)m=Math.max(m,x.right);return m>-1e9?m:cwRect(el).left}catch{return cwRect(el).right}}
function cwDp(v){const d=window.devicePixelRatio||1;return Math.round(v*d)/d}
function cwDpF(v){const r=window.devicePixelRatio||1,d=r>=1.5?r:2;return Math.floor(v*d+1e-6)/d}
function cwPix(rows,pal,cls){let r="";const H=rows.length,W=Math.max(...rows.map(x=>x.length));
 rows.forEach((row,y)=>{let x=0;while(x<row.length){const c=row[x];if(c==="."||c===" "||!pal[c]){x++;continue}let e=x+1;while(e<row.length&&row[e]===c)e++;r+=`<rect x="${x}" y="${y}" width="${e-x}" height="1" fill="${pal[c]}"/>`;x=e}});
 return`<svg${cls?` class="${cls}"`:""} viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges" aria-hidden="true">${r}</svg>`}
const CW_NOTE=cwPix(["..##","..#.","..#.","..#.","###.","###."],{"#":"currentColor"});
const CW_ITEMS=[
 {k:"sock",t:"Kayıp çorabım! Teki hâlâ kayıp ama.",s:cwPix(["..wwww..","..rrrr..","..wwww..","..rrrr..","..wwwww.","..wwwwww","...wwwww"],{w:"#F4F1EA",r:"#E5484D"})},
 {k:"duck",t:"Lastik ördeğim! Hata ayıklarken ona anlatırım, hep sabırla dinler.",s:cwPix(["...yyy..","..yykyy.","..yyyyoo","y..yyy..","yyyyyyy.","yyyyyyy.",".yyyyy.."],{y:"#FFD43B",k:"#171310",o:"#F08C2B"})},
 {k:"floppy",t:"Disket! Müzeden kaçırmadım, söz.",s:cwPix(["bbbbbbb.","bbsssbbb","bbsssbbb","bbbbbbbb","bwwwwwwb","bwkkkkwb","bwwwwwwb","bbbbbbbb"],{b:"#3E6FD8",s:"#C9CED6",w:"#F4F1EA",k:"#8A93A3"})},
 {k:"heart",t:"Yedek kalp. Beğeni gelmezse diye saklıyorum.",s:cwPix([".rr.rr.","rrrrrrr","rwrrrrr","rrrrrrr",".rrrrr.","..rrr..","...r..."],{r:"#E5484D",w:"#FF9A9D"})},
 {k:"semi",t:"Yedek noktalı virgül. Kod yazarken hep lazım olur;",s:cwPix(["...oo...","...oo...","........","...oo...","...oo...","....o...","...o...."],{o:"#D97757"})},
 {k:"cookie",t:"Kurabiye! Tarayıcı çerezi değil, gerçek olanı. Kabul et düğmesi de yok.",s:cwPix(["..cccc..",".ccdccc.","cccccdcc","ccdccccc","cccccdcc",".cdcccc.","..cccc.."],{c:"#C98B4A",d:"#5A3720"})}];

/* --- oda çizimi (ızgara birimi = u px) --- */
function cwSky(){const p=cwPeriod();return p==="n"?{g:"#1D2747",s:"#F2E9C9",t:"#FFF6C9",k:"moon"}:p==="e"?{g:"#F2A26D",s:"#FFD38A",t:"#F7C59F",k:"sun"}:{g:"#9ED8FF",s:"#FFFFFF",t:"#E4F4FF",k:"cloud"}}
function cwRoomBg(R){const W=R.RW,H=CWR.RH,F=CWR.FL;const px=[];const r=(x,y,w,h,c)=>{if(w>0&&h>0)px.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${c}"/>`)};
 const f=(x,y,w,h,c)=>{if(w>0&&h>0)px.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`)};
 r(0,0,W,F,"w");for(let x=3;x<W-1;x+=6)r(x,2,1,F-3,"w2");r(0,0,W,2,"cb");r(0,1,W,1,"cb2");r(0,F-1,W,1,"bb");
 r(0,F,W,H-F,"fl");r(0,F,W,1,"fl3");for(let x=2,i=0;x<W;x+=9,i++)r(x+(i%2?4:0),F+1+(i%2),1,1,"fl2");r(0,H-1,W,1,"fl2");
 r(0,0,1,H,"ed");r(W-1,0,1,H,"ed");
 const L=R.lay;
 if(L.win){const{x,y,w,h}=L.win;const sk=cwSky();r(x-1,y-1,w+2,h+2,"wf");f(x,y,w,h,sk.g);
  if(sk.k==="moon"){f(x+w-4,y+1,2,2,sk.s);f(x+w-3,y+1,1,1,sk.g);f(x+2,y+2,1,1,sk.t);f(x+5,y+h-3,1,1,sk.t);f(x+1,y+h-2,1,1,sk.t)}
  else if(sk.k==="sun"){f(x+w-5,y+h-4,3,3,sk.s);f(x,y+h-2,w,2,"#E58A5A")}
  else{f(x+2,y+2,4,1,sk.s);f(x+1,y+3,6,1,sk.s);f(x+w-5,y+h-3,3,1,sk.t)}
  r(x+Math.floor(w/2),y,1,h,"wf");r(x,y+Math.floor(h/2),w,1,"wf");r(x-2,y+h+1,w+4,1,"wf2")}
 if(L.poster){const{x,y}=L.poster;r(x,y,7,9,"ps");r(x+1,y+1,5,7,"ps2");r(x+2,y+2,1,2,"acc");r(x+2,y+2,2,1,"acc");r(x+4,y+5,1,2,"acc");r(x+3,y+6,2,1,"acc");r(x+3,y+4,1,1,"acc2")}
 if(L.rug){const{x,w}=L.rug;r(x+1,F,w-2,1,"rg");r(x,F+1,w,1,"rg");for(let i=x+1;i<x+w-1;i+=3)r(i,F+1,1,1,"rg2");r(x+1,F,1,1,"rg2");r(x+w-2,F,1,1,"rg2")}
 if(L.sw){const x=L.sw;r(x,11,3,4,"sp");r(x+1,12,1,1,"son");r(x+1,13,1,1,"soff");r(x+1,12,1,2,"sk2")}
 return`<svg viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges" preserveAspectRatio="none" aria-hidden="true">${px.join("")}</svg>`}
function cwChestSvg(open){const px=[];const r=(x,y,w,h,c)=>px.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${c}"/>`);
 /* 14x14: üstte saksı ve kitaplar (y 0-3), gövde y 3-13 */
 r(2,1,3,2,"lf");r(3,0,1,1,"lf");r(2,2,3,1,"lf2");r(2,3,3,1,"pt");r(8,2,4,1,"bk1");r(9,1,3,1,"bk2");
 r(1,4,12,1,"dt");r(1,5,12,9,"dw");r(1,5,1,9,"dw2");r(12,5,1,9,"dw2");
 if(open){r(2,6,10,1,"dk");r(1,7,12,3,"df");r(1,7,12,1,"dfh");r(6,8,2,1,"kn")}else{r(2,6,10,3,"df");r(2,6,10,1,"dfh");r(6,7,2,1,"kn")}
 r(2,10,10,3,"df");r(2,10,10,1,"dfh");r(6,11,2,1,"kn");r(2,13,2,1,"dw2");r(10,13,2,1,"dw2");
 return`<svg viewBox="0 0 14 14" shape-rendering="crispEdges" aria-hidden="true">${px.join("")}</svg>`}
function cwBulbSvg(){return`<svg viewBox="0 0 5 9" shape-rendering="crispEdges" aria-hidden="true"><rect x="2" y="0" width="1" height="4" fill="#3A322C"/><rect x="1" y="4" width="3" height="1" fill="#5B5249"/>`+
 `<g class="boff"><rect x="1" y="5" width="3" height="1" fill="#D8D2C4"/><rect x="0" y="6" width="5" height="2" fill="#D8D2C4"/><rect x="1" y="8" width="3" height="1" fill="#C4BDAE"/><rect x="1" y="6" width="1" height="1" fill="#F4F1EA"/></g>`+
 `<g class="bon"><rect x="1" y="5" width="3" height="1" fill="#FFE27A"/><rect x="0" y="6" width="5" height="2" fill="#FFD43B"/><rect x="1" y="8" width="3" height="1" fill="#F5B82E"/><rect x="2" y="6" width="1" height="2" fill="#FFF8D6"/><rect x="1" y="6" width="1" height="1" fill="#FFFFFF"/></g></svg>`}
function cwRoomBedSvg(front){const px=[];const R=(x,y,w,h,c)=>px.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`);const wd="#9A6A45",wk="#74482C",wl="#B88358";
 if(!front){R(0,1,2,12,wd);R(0,0,2,1,wl);R(0,1,1,12,wk);R(2,7,24,3,"#F3ECE2");R(2,9,24,1,"#D8CFC2");R(2,4,6,3,"#FFFFFF");R(2,6,6,1,"#E3DBD0");R(3,10,2,3,wk);R(21,10,2,3,wk)}
 else{R(7,4,17,5,"#5E7FD6");R(7,4,17,1,"#7B98E4");R(10,6,2,1,"#4A69BE");R(15,7,2,1,"#4A69BE");R(20,6,2,1,"#4A69BE");R(7,8,17,1,"#4A69BE");R(24,3,2,10,wd);R(24,2,2,1,wl);R(25,3,1,10,wk)}
 return`<svg viewBox="0 0 26 13" shape-rendering="crispEdges" aria-hidden="true">${px.join("")}</svg>`}
/* Klaket köşesi: raf, patlamış mısır kovası, klaket tahtası (üst çıta ayrı öğe) */
function cwNookSvg(){return cwPix([
 "....................................yy.y....",
 "...................................yyyyyy...",
 "...................................rwrwrw...",
 "...................................rwrwrw...",
 "...................................rwrwrw...",
 ".bbbbbbbb..........................rwrwrw...",
 ".bwbbwbbb..........................rwrwrw...",
 ".bbbbbbbb...........................wrwr....",
 ".bbwwwbbb..................................",
 ".bbbbbbbb..................................",
 "ssssssssssssssssssssssssssssssssssssssssssss",
 "dddddddddddddddddddddddddddddddddddddddddddd",
 "..kk....................................kk..",
 "...k....................................k..."],{y:"#FFE08A",r:"#E5484D",w:"#F6F0E6",b:"#26201C",s:"#B88358",d:"#74482C",k:"#5A3D2A"})}
const CW_STICK=cwPix(["bwwbbwwbb","bbbbbbbbb"],{b:"#26201C",w:"#F6F0E6"});
/* Dans pisti: ayna top ve ışıklı karolar */
function cwDiscoSvg(W){const px=[];const r=(x,y,w,h,c,cl)=>px.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}"${c?` fill="${c}"`:""}${cl?` class="${cl}"`:""}/>`);
 const cx=Math.floor(W/2);r(cx,0,1,4,"#8A93A3");r(cx-3,4,7,6,"#C9CED6");r(cx-2,3,5,8,"#C9CED6");for(let i=0;i<5;i++)r(cx-2+((i*2)%5),4+(i%3)*2,1,1,"#FFFFFF");r(cx-1,5,1,1,"#8A93A3");r(cx+1,8,1,1,"#8A93A3");
 for(let x=0,i=0;x<W;x+=4,i++){r(x,28,4,2,null,"t"+(i%4));r(x,30,4,2,null,"t"+((i+2)%4))}r(0,28,W,1,"rgba(255,255,255,.35)");
 return`<svg viewBox="0 0 ${W} 32" shape-rendering="crispEdges" aria-hidden="true">${px.join("")}</svg>`}

/* --- oda öğesi --- */
function cwRoomEl(kind){CW.rooms=CW.rooms||{};let el=CW.rooms[kind];if(el)return el;el=document.createElement("div");el.className="cw-room cw-scope cw-"+kind;el.dataset.kind=kind;
 el.innerHTML=kind==="room"?`<div class="cw-rbg"></div><div class="cw-glow"></div><div class="cw-win"></div><div class="cw-chest"></div><div class="cw-bulb"></div><div class="cw-bed cw-bk"></div><div class="cw-stage"></div><div class="cw-bed cw-ft"></div><div class="cw-fx"></div><div class="cw-dim"></div>`
  :kind==="nook"?`<div class="cw-rbg"></div><div class="cw-stick"></div><div class="cw-stage"></div><div class="cw-fx"></div>`
  :`<div class="cw-rbg"></div><div class="cw-spark"><i></i><i></i><i></i></div><div class="cw-stage"></div><div class="cw-fx"></div>`;
 CW.rooms[kind]=el;return el}
function cwRoomLayout(RW){const L={};L.bedL=RW-27;L.chest=1;L.sw=16;const free0=19,free1=L.bedL-2;L.bulb=Math.round((15+L.bedL)/2)-2;
 if(free1-free0>=26){L.win={x:L.bulb+5,y:5,w:11,h:8};if(L.win.x+L.win.w>free1)L.win=null}
 if(L.win&&L.bulb-3-free0>=8)L.poster={x:Math.max(free0,L.bulb-10),y:7};else if(!L.win&&free1-free0>=14)L.poster={x:L.bulb+5,y:7};
 L.rug={x:16,w:Math.max(8,L.bedL-17)};return L}
function cwRoomRender(R){const el=R.el,u=R.u,k=`${R.kind}|${u}|${R.RW}|${cwPeriod()}`;if(R.rk===k)return;R.rk=k;const q=s=>el.querySelector(s);
 el.style.width=R.w+"px";el.style.height=R.h+"px";el.style.setProperty("--cw-u",u+"px");
 if(R.kind==="room"){R.lay=cwRoomLayout(R.RW);const L=R.lay;q(".cw-rbg").innerHTML=cwRoomBg(R);
  const ch=q(".cw-chest");ch.style.cssText=`left:${L.chest*u}px;top:${(CWR.FL-14)*u}px;width:${14*u}px;height:${14*u}px`;ch.innerHTML=cwChestSvg(!!R.drawerOpen);
  const bl=q(".cw-bulb");bl.style.cssText=`left:${L.bulb*u}px;top:${1*u}px;width:${5*u}px;height:${9*u}px`;bl.innerHTML=cwBulbSvg();
  el.style.setProperty("--gx",(L.bulb+2.5)*u+"px");el.style.setProperty("--gy",8*u+"px");
  for(const b of[q(".cw-bk"),q(".cw-ft")]){b.style.width=26*u+"px";b.style.height=13*u+"px"}
  q(".cw-bk").innerHTML=cwRoomBedSvg(false);q(".cw-ft").innerHTML=cwRoomBedSvg(true);
  R.bed.x=(L.bedL+13)*u;R.bed.y=CWR.FL*u;
  R.bnd={L:u,R:(L.bedL+4)*u,T:0,B:CWR.FL*u}}
 else if(R.kind==="nook"){const bg=q(".cw-rbg");bg.style.cssText=`left:0;top:${10*u}px;width:${44*u}px;height:${14*u}px`;bg.innerHTML=cwNookSvg();const st=q(".cw-stick");st.style.cssText=`left:${1*u}px;top:${13*u}px;width:${9*u}px;height:${2*u}px`;st.innerHTML=CW_STICK;
  R.bnd={L:9*u,R:33*u,T:0,B:20*u}}
 else{q(".cw-rbg").innerHTML=cwDiscoSvg(R.RW);R.bnd={L:u,R:(R.RW-1)*u,T:0,B:28*u}}}

/* --- yer ölçümü: {after|in, left, right, top, bottom, grow} (ekran koordinatı) --- */
function cwSkipHost(e){while(e&&e.classList&&(e.classList.contains("cw-rhost")||e.classList.contains("cw-room")))e=e.nextElementSibling;return e}
function cwMeasFeed(){const st=document.querySelector("#main .stories");if(!st||st.scrollWidth>st.clientWidth+2)return null;const ss=st.querySelectorAll(":scope>.story");const last=ss[ss.length-1];if(!last)return null;
 const r=cwRect(st),l=cwRect(last);if(r.height<40)return null;return{after:st,left:l.right+16,right:r.right-12,top:r.top+2,bottom:l.bottom}}
function cwMeasExplore(){const card=document.querySelector("#main .chesscard");if(!card)return null;const sec=cwSkipHost(card.nextElementSibling);if(!sec||!sec.classList.contains("sec-h"))return null;
 const row=cwSkipHost(sec.nextElementSibling);if(!row)return null;const c=cwRect(card),sr=cwRect(sec),rr=cwRect(row);const lab=sec.firstElementChild?cwTextRight(sec.firstElementChild):sr.left;
 return{after:sec,left:Math.max(lab+24,sr.left+sr.width*.32),right:Math.min(sr.right,c.right-10),top:c.bottom+2,bottom:rr.top-2,grow:{el:sec,prop:"paddingTop",max:64}}}
function cwMeasChats(){const nt=document.querySelector("#main .notes");if(!nt||nt.scrollWidth>nt.clientWidth+2)return null;const last=cwSkipHost(nt.lastElementChild)||nt.lastElementChild;if(!last)return null;
 const r=cwRect(nt);const lr=last.classList.contains("nt-empty")?cwTextRight(last):cwRect(last).right;return{after:nt,left:lr+18,right:r.right-12,top:r.top+2,bottom:r.bottom-8}}
function cwMeasProfile(){const pr=document.querySelector("#main .prof");if(!pr)return null;const tp=pr.querySelector(".prof-top"),st=pr.querySelector(".stats"),bt=pr.querySelector(":scope>.btns");if(!tp||!st||!bt)return null;
 const sr=cwRect(st),br=cwRect(bt);const top=sr.bottom+4,bottom=br.top-6;let left=sr.left;const av=tp.firstElementChild&&cwRect(tp.firstElementChild);if(av&&av.bottom>top)left=Math.max(left,av.right+12);
 for(let e=tp.nextElementSibling;e&&e!==bt;e=e.nextElementSibling){if(e.classList.contains("cw-room"))continue;const r=cwRect(e);if(r.bottom<top||r.top>bottom+40)continue;left=Math.max(left,cwTextRight(e)+20)}
 return{in:pr,left,right:sr.right,top,bottom,grow:{el:bt,prop:"marginTop",max:44}}}
function cwMeasNook(){const reel=activeReel&&activeReel.isConnected?activeReel:document.querySelector("#main .reel");if(!reel)return null;const side=reel.querySelector(".side");if(!side)return null;
 const rr=cwRect(reel),sr=cwRect(side);if(rr.height<200)return null;const u=cwDpF(Math.min(CW.uRoam*.8,(rr.width*.5)/44));if(u<2)return null;const w=44*u,h=24*u;
 const right=Math.min(rr.right-6,sr.right+4),bottom=sr.top-8;if(bottom-h<rr.top+72)return null;
 /* 5.7.5: raf Klaketle birlikte kaymaz; konum kaydırma kutusuna (#main) göre hesaplanır, raf #shell içinde sabit durur */
 const mr=cwRect(document.getElementById("main")||reel);return{reel,u,w,h,left:mr.left+(right-w-rr.left),top:mr.top+(bottom-h-rr.top),rr}}
function cwMeasDisco(){const sh=document.querySelector('#overlay .layer[data-layer="comments"] .sheet');if(!sh)return null;const r=cwRect(sh);const u=cwDpF(Math.min(CW.uRoam*.8,3.4));const h=32*u;
 const T=(window.visualViewport?window.visualViewport.offsetTop:0)+8;if(r.top-h<T)return null;return{sheet:sh,u,w:44*u,h}}
function cwRoomWant(){if(!CW.root||(!cwOn()&&!CW.leaving)||!S.authed||!S.uid)return null;
 const ls=document.querySelectorAll("#overlay .layer");const top=ls[ls.length-1];if(top&&top.dataset.layer==="comments")return{key:"disco",kind:"disco",m:cwMeasDisco};
 const r=S.route&&S.route.name;const m={feed:cwMeasFeed,explore:cwMeasExplore,chats:cwMeasChats,profile:cwMeasProfile,reels:cwMeasNook}[r];if(!m)return null;
 return{key:r,kind:r==="reels"?"nook":"room",m}}

/* --- yerleştirme --- */
function cwHost(after){let h=CW.hostEl;if(!h){h=document.createElement("div");h.className="cw-rhost";h.setAttribute("aria-hidden","true");CW.hostEl=h}
 if(h.previousElementSibling!==after||h.parentNode!==after.parentNode)after.after(h);return h}
function cwGrowReset(){const g=CW.grow;if(g&&g.el){g.el.style[g.prop]="";}CW.grow=null}
function cwRoomGeo(want){let g=want.m();if(!g)return null;
 if(want.kind!=="room")return g;
 const uW=Math.min(CW.uRoam,(g.right-g.left)/CWR.MINW);if(uW<CWR.UMIN){if(g.grow)cwGrowSet(g.grow,0);return null}
 if(g.grow){const cur=parseFloat(g.grow.el.style[g.grow.prop])||0;const need=Math.ceil(CWR.RH*Math.min(uW,CW.uRoam))+2;const h0=(g.bottom-g.top)-cur;
  const grow=Math.max(0,Math.min(g.grow.max,need-h0));if(Math.abs(grow-cur)>.5){cwGrowSet(g.grow,grow);g=want.m();if(!g)return null}}
 else if(CW.grow)cwGrowReset();
 const u=cwDpF(Math.min(CW.uRoam,(g.right-g.left)/CWR.MINW,(g.bottom-g.top)/CWR.RH));if(u<CWR.UMIN){if(g.grow)cwGrowSet(g.grow,0);return null}
 g.u=u;g.RW=Math.min(CWR.MAXW,Math.floor((g.right-g.left)/g.u));g.w=g.RW*g.u;g.h=CWR.RH*g.u;return g}
function cwGrowSet(gr,px){if(CW.grow&&CW.grow.el!==gr.el)cwGrowReset();gr.el.style[gr.prop]=px?px+"px":"";CW.grow=px?{el:gr.el,prop:gr.prop}:null}
function cwRoomPos(R,g){const el=R.el;let x,y;
 if(R.kind==="room"){if(g.in){const c=g.in;if(!c.classList.contains("cw-rc"))c.classList.add("cw-rc");if(el.parentNode!==c)c.appendChild(el);if(CW.hostEl&&CW.hostEl.isConnected)CW.hostEl.remove();
   const cr=cwRect(c);x=g.right-R.w-cr.left-c.clientLeft;y=g.bottom-R.h-cr.top-c.clientTop}
  else{const h=cwHost(g.after);if(el.parentNode!==h)h.appendChild(el);const hr=cwRect(h);x=g.right-R.w-hr.left;y=g.bottom-R.h-hr.top}}
 else if(R.kind==="nook"){const host=document.getElementById("shell")||document.body;if(el.parentNode!==host)host.appendChild(el);if(R.reel&&R.reel!==g.reel)setTimeout(cwClap,350);R.reel=g.reel;const hr=cwRect(host);x=g.left-hr.left-host.clientLeft;y=g.top-hr.top-host.clientTop}
 else{if(el.parentNode!==g.sheet)g.sheet.appendChild(el);el.style.left="";el.style.top="";return}
 x=cwDp(x);y=cwDp(y);const k=x+","+y;if(R.pk!==k){R.pk=k;el.style.left=x+"px";el.style.top=y+"px"}}
function cwRoomSync(){if(!CW.root||CW.syncing)return;CW.syncing=true;try{
 const want=cwRoomWant();let g=want&&cwRoomGeo(want);
 if(!g){if(CW.room&&!(CW.leaving&&CW.room.el.isConnected))cwRoomExit();else if(!CW.room&&CW.grow)cwGrowReset();return}
 if(!CW.room||CW.room.key!==want.key)cwRoomEnter(want,g);else cwRoomUpdate(g)}
 finally{CW.syncing=false}}
function cwRoomApply(R,g){const oldU=R.u;R.u=g.u;R.w=g.w;R.h=g.h;R.RW=g.RW||44;cwRoomRender(R);cwRoomPos(R,g);
 if(oldU&&oldU!==R.u&&CW.room===R){const f=R.u/oldU;CW.x*=f;CW.y*=f;cwSize();cwBoundsUpd();const b=cwB();CW.x=Math.max(b.L+CW.W*.5,Math.min(b.R-CW.W*.5,CW.x));if(CW.inBed||CW.bed)cwBedPlace();CW.tf="";cwFollow()}}
function cwRoomUpdate(g){const R=CW.room;cwRoomApply(R,g);if(R.kind==="room"&&R.per!==cwPeriod()){R.per=cwPeriod();CW.lightOv=null;cwRoomLamp()}}
function cwRoomEnter(want,g){const prev=CW.room;const wasBed=CW.inBed&&want.kind==="room";const xu=prev&&prev.kind==="room"&&want.kind==="room"?CW.x/CW.U:null;
 cwCancel();cwMenuClose();if(CW.ask)cwAskClose();
 if(prev)cwRoomDetach(prev,want.kind!==prev.kind);
 else{CW.roamBed=CW.bed;if(CW.rootBed){CW.rootBed.B.hidden=CW.rootBed.F.hidden=true}}
 const el=cwRoomEl(want.kind);const R={kind:want.kind,key:want.key,el,u:0,bed:{x:0,y:0},light:false,per:cwPeriod()};CW.room=R;cwRoomApply(R,g);
 el.querySelector(".cw-stage").appendChild(CW.b);CW.fx=el.querySelector(".cw-fx");
 if(R.kind==="room"){CW.bedB=el.querySelector(".cw-bk");CW.bedF=el.querySelector(".cw-ft");CW.bed=R.bed;CW.bedB.hidden=CW.bedF.hidden=false}else{CW.bed=null}
 cwSize();cwBoundsUpd();const b=cwB();CW.surf="floor";CW.flip=false;CW.rot=0;CW.oy=0;CW.air=false;CW.zz=false;CW.stars=false;CW.tears=false;CW.bumpOn=false;CW.b.classList.remove("tp");
 CW.inBed=false;CW.discoSaid=false;
 if(wasBed){CW.inBed=true;CW.surf="bed"}
 const mid=(b.L+b.R)/2;CW.x=xu!=null?xu*CW.U:R.kind==="room"?b.L+(b.R-b.L)*.42:mid;CW.x=Math.max(b.L+CW.W*.5,Math.min(b.R-CW.W*.5,CW.x));CW.y=b.B;CW.face=R.kind==="nook"?-1:CW.face;
 if(R.kind==="nook")CW.oy=3*CW.U;
 CW.tf="";CW.itf="";if(CW.bed)cwBedPlace();cwFollow();cwRoomLamp();cwDraw(performance.now(),true);CW.nextAt=CW.clock+350}
function cwRoomDetach(R,drop){const el=R.el;if(R.kind==="room"){R.drawerOpen=false;R.rk="";el.classList.remove("cwfront","party")}
 if(drop||R.kind!=="room"){el.remove()}}
function cwRoomExit(){const R=CW.room;if(!R)return;const wasBed=CW.inBed;cwCancel();cwMenuClose();if(CW.ask)cwAskClose();CW.room=null;
 CW.root.insertBefore(CW.b,CW.root.querySelector(".cw-ft"));CW.fx=CW.rootFx;cwFxClearRoom(R);R.el.remove();if(CW.hostEl)CW.hostEl.remove();cwGrowReset();
 if(CW.rootBed){CW.bedB=CW.rootBed.B;CW.bedF=CW.rootBed.F}CW.bed=null;CW.inBed=false;if(CW.bedB)CW.bedB.hidden=CW.bedF.hidden=true;
 cwSize();cwBoundsUpd();const b=cwB();CW.surf="floor";CW.flip=false;CW.rot=0;CW.oy=0;CW.air=false;CW.zz=false;CW.y=b.B;CW.x=b.R-CW.W*.5-10;CW.face=-1;CW.tf="";CW.itf="";
 if(wasBed&&cwNight())CW.nextAt=0;cwDraw(performance.now(),true)}
function cwFxClearRoom(R){const f=R.el.querySelector(".cw-fx");if(f)f.innerHTML=""}
function cwRoomDrop(){if(CW.room)cwRoomExit()}

/* --- ışık --- */
function cwRoomLamp(v){const R=CW.room;if(!R||R.kind!=="room")return;
 if(v===undefined){if(CW.lightOv&&CW.lightOv.per===cwPeriod())v=CW.lightOv.v;else v=CW.inBed?false:(cwNight()||cwPeriod()==="e")}
 R.light=!!v;R.el.classList.toggle("lamp",R.light);R.el.classList.toggle("dark",!R.light&&cwNight())}
function cwBulbSwing(){const R=CW.room;if(!R||R.kind!=="room"||cwReduce())return;const b=R.el.querySelector(".cw-bulb");b.classList.remove("swing");void b.offsetWidth;b.classList.add("swing");setTimeout(()=>b.classList.remove("swing"),1500)}
function cwChest(open){const R=CW.room;if(!R||R.kind!=="room")return;R.drawerOpen=!!open;const c=R.el.querySelector(".cw-chest");if(c)c.innerHTML=cwChestSvg(!!open)}
function cwClap(){const R=CW.room;if(!R||R.kind!=="nook")return;const s=R.el.querySelector(".cw-stick");if(!s||cwReduce())return;s.classList.remove("clap");void s.offsetWidth;s.classList.add("clap");cwSfx("clap")}

/* --- efekt yardımcıları --- */
function cwNoteFx(n=1){if(cwReduce()||!CW.b)return;for(let i=0;i<n;i++){const e=document.createElement("i");e.className="cw-note";e.innerHTML=CW_NOTE;
 e.style.left=(CW.W*cwRand(.05,.45))+"px";e.style.top=(CW.H*cwRand(.35,.6))+"px";e.style.setProperty("--dx",cwRand(-18,8).toFixed(0)+"px");e.style.color=cwPick(["#D97757","#FFC93C","#6CB8FF","var(--accent)"]);CW.b.appendChild(e);setTimeout(()=>e.remove(),1400)}}
function cwConfetti(x,y,n=26){if(cwReduce())return;const C=["#D97757","#FFC93C","#5BC27A","#6CB8FF","#E5484D","#B57BFF"];for(let i=0;i<n;i++){const p=document.createElement("i");p.className="cw-cf";
  p.style.left=x+"px";p.style.top=y+"px";p.style.background=cwPick(C);const dx=cwRand(-70,70);p.style.setProperty("--dx",dx.toFixed(0)+"px");p.style.setProperty("--up",cwRand(-60,-24).toFixed(0)+"px");
  p.style.setProperty("--dn",cwRand(30,90).toFixed(0)+"px");p.style.setProperty("--r",cwRand(-540,540).toFixed(0)+"deg");p.style.animationDelay=(i*12)+"ms";CW.fx.appendChild(p);setTimeout(()=>p.remove(),1500)}}
function cwItemEl(it){const s=Math.round(CW.U*8);const d=document.createElement("div");d.className="cw-item";d.innerHTML=it.s;d.style.width=s+"px";d.style.height=s+"px";
 d.style.left=Math.round(CW.x-s/2)+"px";d.style.top=Math.round(CW.y-CW.H-s*.4)+"px";CW.fx.appendChild(d);return d}

/* --- yeni etkinlikler --- */
async function actGuitar(){CW.lastGuitar=now();if(CW.inBed){CW.inBed=false;CW.surf="floor";CW.y=cwB().B}const b=cwB();
 if(CW.room&&CW.room.kind==="room"&&!cwReduce())await cwWalk(Math.max(b.L+CW.W*.5,Math.min(b.R-CW.W*.5,(b.L+b.R)/2)),90);
 CW.pose="idle";await cwSay(cwPick(["amp.on()","guitar.tune()","riff.play()"]),{kind:"code",hold:200});CW.face=1;
 const wv=document.createElement("div");wv.className="cw-wave";wv.innerHTML="<i></i><i></i><i></i>";CW.b.appendChild(wv);CW.sq.classList.add("bob");
 try{CW.pose="guitar";cwRiff();let n=0;const t0=CW.clock;while(CW.clock-t0<5600){await cwWait(340);if(n++%2===0)cwNoteFx(1);if(n===8)cwRiff()}
  CW.pose="joy";cwNoteFx(2);await cwHop(CW.x,cwB().B,CW.room?10:16,320);CW.pose="happy";
  if(cwMaySay()||Math.random()<.5)await cwSay(cwPick(["Günaydın! Bu riff senin için.","Teşekkürler, teşekkürler! İmza saat 10'da.","Komşular alkışlıyor. Ya da duvara vuruyorlar, emin değilim.","Sabah gitarı: kahveden daha etkili!"]),{hold:1500})}
 finally{wv.remove();CW.sq.classList.remove("bob")}CW.pose="idle"}
async function actStretch(){CW.pose="stretch";CW.sq.classList.add("str");try{await cwWait(1500)}finally{CW.sq.classList.remove("str")}CW.pose="idle";await cwWait(300)}
async function actYawn(){CW.pose="yawn";await cwWait(1300);CW.pose="sleepy";await cwWait(700);if(Math.random()<.4&&cwMaySay())await cwSay(cwPick(["Haaa... Sen uyumuyorsan ben de uyumam.","Uykum var ama meraklıyım. Ne yapıyoruz?","Esnemek bulaşıcıdır. Sen de esnedin, gördüm!"]),{hold:1300});CW.pose="idle"}
async function actDoze(){CW.pose="sit";await cwWait(500);CW.pose="doze";CW.zz=true;const y0=CW.oy;try{for(let i=0;i<5;i++){await cwWait(cwRand(500,900));CW.oy=y0+CW.U*.5;await cwWait(220);CW.oy=y0}}finally{CW.zz=false;CW.oy=y0}
 CW.pose="surprised";await cwHop(CW.x,cwB().B,8,240);if(cwMaySay()||Math.random()<.5)await cwSay(cwPick(["Uyumuyordum! Gözlerimi dinlendiriyordum.","Ha? Buradayım! Kod derliyordum, kod.","Bir saniyeliğine kapandım. Yeniden başlatıldım!"]),{hold:1300});CW.pose="idle"}
async function actNightDance(){const R=CW.room;if(R&&R.kind==="room"){cwRoomLamp(true);R.el.classList.add("party")}
 try{if(cwMaySay()||Math.random()<.4)await cwSay(cwPick(["Gece yarısı partisi! Madem uyumuyoruz...","Saat kaç olursa olsun, dans saati!"]),{hold:1200});await actDance();cwNoteFx(2)}finally{if(R)R.el.classList.remove("party")}}
function cwInpRecent(ms){return(CW.inp||[]).filter(t=>now()-t<ms).length}
function cwOwlOk(){return now()-CW.lastInput<40000/CW.speed}
function cwOwlWake(){return now()-CW.lastInput<8000&&cwInpRecent(60000)>=4&&now()-CW.sleptAt>45000/CW.speed&&now()-CW.owlAt>180000/CW.speed}
async function actOwlUp(){CW.owlAt=now();CW.pose="sleepy";await cwWait(700);CW.inBed=false;CW.surf="floor";cwRoomLamp(true);const bd=CW.bed;
 await cwHop(bd?Math.max(cwB().L+CW.W*.5,bd.x-(cwBG().w/2*CW.U+CW.W*.5)):CW.x,cwB().B,10,360);CW.pose="sleepy";
 await cwSay(cwPick(["Uyuyamadım... Sen de uyumuyorsun zaten.","Madem sen buradasın, ben de kalkayım.","Gece kuşu musun? Ben de oldum o zaman."]),{hold:1400});CW.pose="idle"}
async function actOwl(){CW.owlAt=Math.max(CW.owlAt,now()-170000);const f=cwPick([actYawn,actYawn,actDoze,actDoze,actNightDance,actStretch,actWander]);cwRoomLamp(true);await f()}
async function actConfetti(){CW.zz=false;if(CW.inBed)return;CW.pose="joy";cwSfx("pop");const x=CW.x,y=CW.y-CW.H*.8;cwConfetti(x,y);await cwHop(CW.x,cwB().B,CW.room?10:18,340);cwConfetti(x,y,14);
 CW.pose="happy";if(Math.random()<.6)await cwSay(cwPick(["Yeni beğeni! Konfetiler benden.","Biri seni beğendi! Kutlama zamanı!","Beğeni geldi! Piksellerim dans ediyor."]),{hold:1300});else await cwWait(900);CW.pose="idle"}
async function actMsgDance(){if(CW.inBed)return;CW.pose="surprised";await cwWait(250);CW.pose="dance";cwNoteFx(2);if(Math.random()<.5)await cwSay(cwPick(["Mesaj geldi! Dans etmeden duramam.","Dıt dıt! Yeni mesaj!"]),{hold:900});
 for(let i=0;i<2;i++){CW.pose="dance";await cwWait(380);cwNoteFx(1);await cwHop(CW.x,cwB().B,CW.room?8:14,300)}CW.pose="idle"}
async function actSneeze(){CW.pose="sniff";await cwSay("Ha... ha...",{hold:300});await cwTween(500,k=>{CW.rot=-6*k});CW.pose="sneeze";cwSfx("sneeze");CW.rot=8;
 const b=cwB();const dir=CW.face||1;const sx=CW.x+dir*CW.W*.3,sy=CW.y-CW.H*.45;if(!cwReduce())cwBurst(sx,sy,10,"#BFE3FF");cwBulbSwing();
 await cwHop(Math.max(b.L+CW.W*.5,Math.min(b.R-CW.W*.5,CW.x-dir*8)),b.B,6,220);CW.rot=0;CW.pose="idle";await cwSay(cwPick(["HAPŞU! Pardon, piksel tozu.","Çok yaşa ben! Kendime teşekkür ederim.","Bir virüs mü kaptım? Yok yok, sadece toz."]),{hold:1300})}
async function actJuggle(){const gs=["{","}",";"].map(c=>cwGlyph(0,0,c,"jg"));CW.pose="juggle";const R=CW.U*7;
 try{await cwTween(3600,k=>{const top=CW.y-CW.H-CW.U*2;gs.forEach((g,i)=>{const ph=(k*4+i/3)%1;const x=CW.x+Math.cos(ph*Math.PI*2)*R-CW.U*3.5,y=top-Math.abs(Math.sin(ph*Math.PI*2))*CW.U*9;g.style.left=Math.round(x)+"px";g.style.top=Math.round(y)+"px"})});
  if(Math.random()<.35){const g=gs[0];g.style.left=Math.round(CW.x-CW.U*3.5)+"px";g.style.top=Math.round(CW.y-CW.H)+"px";CW.pose="dizzy";CW.stars=true;cwSfx("bonk");await cwWait(300);CW.stars=false;await cwSay("Ay! Süslü parantez kafama düştü.",{hold:1100})}
  else{CW.pose="happy";cwSfx("pop");await cwWait(700)}}
 finally{cwDissolve(gs,60);CW.stars=false}CW.pose="idle"}
async function actRead(){const b=cwB();if(!cwReduce())await cwWalk(Math.max(b.L+CW.W*.5,Math.min(b.R-CW.W*.5,CW.room?(b.L+b.R)*.45:CW.x)),40);CW.pose="read";
 for(let i=0;i<3;i++){await cwWait(cwRand(1600,2400));cwSfx("page")}
 if(cwMaySay()||Math.random()<.3)await cwSay(cwPick(["Bu kitapta hiç resim yok!","\"Kod Yazmanın 101 Yolu\". Yüzü hata.","Tam heyecanlı yerinde bitti. Devamı 5.2'de.","Okuyorum ama piksellerim kitaptan küçük."]),{hold:1400});else await cwWait(500);CW.pose="idle"}
async function actDrawer(){const R=CW.room;if(!R||R.kind!=="room")return actLook();const b=cwB();const cx=(R.lay.chest+14)*R.u;
 await cwWalk(Math.max(b.L+CW.W*.5,cx+CW.W*.5-3*R.u),60);CW.face=-1;CW.pose="reach";let item=null;
 try{await cwWait(300);cwChest(true);cwSfx("drawer");await cwWait(500);const it=cwPick(CW_ITEMS);CW.pose="hold";CW.face=1;item=cwItemEl(it);cwSfx("pop");
  await cwSay(it.t,{hold:1600});CW.pose="reach";CW.face=-1;await cwWait(250)}
 finally{if(item){if(!cwReduce())cwBurst(parseFloat(item.style.left)+CW.U*4,parseFloat(item.style.top)+CW.U*4,8);item.remove()}cwChest(false)}cwSfx("drawer");CW.pose="idle"}
async function actSwitch(){const R=CW.room;if(!R||R.kind!=="room")return actLook();const b=cwB();const sx=(R.lay.sw+3)*R.u;
 if(!cwReduce())await cwWalk(Math.max(b.L+CW.W*.5,sx+CW.W*.5-3*R.u),60);CW.face=-1;CW.pose="switch";await cwWait(350);
 const v=!R.light;CW.lightOv={v,per:cwPeriod()};cwRoomLamp(v);cwSfx("click");cwBulbSwing();await cwWait(450);CW.face=1;CW.pose="happy";
 if(cwMaySay()||Math.random()<.35)await cwSay(v?cwPick(["Işık açıldı! Gölgem bile şaşırdı.","Aydınlık geri geldi. Tasarruf modu kapalı."]):cwPick(["Işık kapalı. Romantik mod.","Elektrik faturası: düşük. Görüş mesafesi: düşük."]),{hold:1300});else await cwWait(600);CW.pose="idle"}
async function actBedSit(){const R=CW.room;if(!R||R.kind!=="room"||!CW.bed)return actSit();const b=cwB();const bl=CW.bed.x-13*R.u;
 await cwWalk(Math.max(b.L+CW.W*.5,bl-CW.W*.5),40);R.el.classList.add("cwfront");CW.surf="bed";
 try{await cwHop(bl+R.u*3,CW.bed.y-4*R.u,10,340);CW.face=-1;CW.pose="bedsit";await cwWait(1500);CW.lookX=-1;await cwWait(900);CW.lookX=1;await cwWait(900);CW.lookX=0;await cwWait(cwRand(800,1600));
  CW.pose="idle";await cwHop(Math.max(b.L+CW.W*.5,bl-CW.W*.5),b.B,10,320)}
 finally{CW.surf="floor";CW.y=cwB().B;R.el.classList.remove("cwfront")}}
async function actDisco(){CW.inBed=false;CW.surf="floor";CW.face=1;CW.pose="dance";
 if(!CW.discoSaid){CW.discoSaid=true;if(cwMaySay()||Math.random()<.5)await cwSay(cwPick(["Yorumlar açıldı, pist benim!","Yaz bakalım, ben ritim tutarım.","Her yorum bir alkış! Dans ediyorum."]),{hold:1300})}
 for(;;){CW.pose="dance";await cwWait(cwRand(900,1800));const r=Math.random();
  if(r<.3)await cwHop(CW.x,cwB().B,8,300);else if(r<.5)CW.face=-CW.face;else if(r<.62&&!cwReduce()){await cwTween(420,k=>{CW.rot=360*k});CW.rot=0}else if(r<.85)cwNoteFx(1)}}
async function actNook(){CW.surf="floor";CW.face=-1;CW.oy=3*CW.U;CW.pose="popcorn";
 if(!CW.nookSaid){CW.nookSaid=true;if(cwMaySay())await cwSay(cwPick(["Klaket saati! Patlamış mısırım hazır.","Sessiz olun, film başlıyor!"]),{hold:1400});CW.pose="popcorn"}
 for(;;){await cwWait(cwRand(3000,6000));if(Math.random()<.35){CW.pose="happy";await cwWait(800);CW.pose="popcorn"}else if(Math.random()<.3){CW.lookX=-1;await cwWait(1200);CW.lookX=0}}}
const CW_ACTS51={guitar:actGuitar,stretch:actStretch,yawn:actYawn,doze:actDoze,nightdance:actNightDance,owl:actOwl,owlup:actOwlUp,confetti:actConfetti,msgdance:actMsgDance,sneeze:actSneeze,
 juggle:actJuggle,read:actRead,drawer:actDrawer,switch:actSwitch,bedsit:actBedSit,disco:actDisco,nook:actNook,dunno:actDunno};
function cwWeights(){const p=cwPeriod(),rm=CW.room&&CW.room.kind==="room",late=cwHour()>=22;
 const w=[["wander",rm?20:30,actWander],["look",13,actLook],["sit",rm?5:9,actSit],["dance",3,actDance],["stretch",5,actStretch],["sneeze",2,actSneeze],["juggle",6,actJuggle],["read",rm?7:3,actRead]];
 if(rm)w.push(["drawer",8,actDrawer],["bedsit",6,actBedSit],["switch",p==="e"||late?5:2,actSwitch]);else w.push(["peek",9,actPeek],["stairs",10,cwStairs],["ladder",9,cwLadder]);
 const sg=now()-CW.lastGuitar;if(p==="m"&&sg>240000)w.push(["guitar",16,actGuitar]);else if(sg>600000)w.push(["guitar",2,actGuitar]);
 if(late)w.push(["yawn",8,actYawn]);return w}

/* --- ses: gitar riff'i ve küçük efektler --- */
function cwRiff(){if(!cwSoundOk())return;try{const c=CWS.ctx;const t0=c.currentTime+.04;const sh=c.createWaveShaper();const n=256,cv=new Float32Array(n);for(let i=0;i<n;i++){const x=i/(n-1)*2-1;cv[i]=Math.tanh(x*5)}sh.curve=cv;
 const lp=c.createBiquadFilter();lp.type="lowpass";lp.frequency.value=2300;const g=c.createGain();g.gain.value=.035;sh.connect(lp);lp.connect(g);g.connect(c.destination);
 const N=[[164.8,.2],[164.8,.1],[196,.2],[220,.2],[164.8,.1],[246.9,.2],[220,.1],[196,.3],[164.8,.42]];let t=t0;
 for(const[f,d]of N){for(const m of[1,1.5]){const o=c.createOscillator(),e=c.createGain();o.type="sawtooth";o.frequency.setValueAtTime(f*m,t);e.gain.setValueAtTime(.0001,t);e.gain.exponentialRampToValueAtTime(.6,t+.01);e.gain.exponentialRampToValueAtTime(.0001,t+d*.95);o.connect(e);e.connect(sh);o.start(t);o.stop(t+d)}t+=d;CWS.n++}
 setTimeout(()=>{try{g.disconnect()}catch{}},(t-t0+.6)*1000)}catch{}}
const cwSfxBase51=cwSfx;
cwSfx=function(k){if(["drawer","click","clap","sneeze","page"].includes(k)){if(!cwSoundOk())return;try{
  if(k==="drawer")cwTone("square",140,110,.12,.018);else if(k==="click"){cwTone("square",1800,1600,.02,.02);cwTone("square",900,800,.02,.015,.03)}
  else if(k==="clap")cwTone("square",2200,300,.06,.03);else if(k==="sneeze"){cwTone("triangle",900,300,.18,.03)}else if(k==="page")cwTone("triangle",2400,1800,.04,.008)}catch{}return}
 return cwSfxBase51(k)};

/* --- uygulama olayları: beğenide konfeti, mesajda dans, girdi sayacı, anında oda eşitleme --- */
function cwLikeCheck(m){if(!CW.root||!cwOn()||!S.authed||CW.inBed)return;let n=0;for(const[id,d]of Object.entries(m||{})){const p=S.posts[id];if(!p||p.uid!==S.uid)continue;const old=S.meta[id]||{};
 for(const[u,at]of Object.entries(d.likes||{}))if(at&&u!==S.uid&&!(old.likes||{})[u]&&at>S.bootAt)n++}if(n)cwQueue("confetti",actConfetti,3)}
function cwMsgCheck(m){if(!CW.root||!cwOn()||!S.authed||CW.inBed)return;for(const[id,c]of Object.entries(m||{})){const o=S.chats[id];
 if(c.last&&c.last.from!==S.uid&&c.last.at>S.bootAt&&(!o||!o.last||o.last.at<c.last.at)){if(S.route.name==="chat")return;cwQueue("msgdance",actMsgDance,3);return}}}
const notifyMetaBaseCW=notifyMeta;
notifyMeta=function(m){try{cwLikeCheck(m)}catch(e){console.warn("clawd",e)}return notifyMetaBaseCW.apply(this,arguments)};
const notifyChatsBaseCW=notifyChats;
notifyChats=function(m){try{cwMsgCheck(m)}catch(e){console.warn("clawd",e)}return notifyChatsBaseCW.apply(this,arguments)};
["pointerdown","keydown","wheel"].forEach(ev=>document.addEventListener(ev,()=>{const t=now();const a=CW.inp||(CW.inp=[]);if(!a.length||t-a[a.length-1]>700){a.push(t);if(a.length>40)a.shift()}if(ev==="wheel")CW.lastInput=t},{capture:true,passive:true}));
HOOKS.after.push(()=>{try{if(CW.root&&cwOn())cwRoomSync()}catch(e){console.warn("clawd",e)}});
(function(){let q=false;const mo=new MutationObserver(recs=>{if(q||CW.syncing||!CW.root)return;if(!recs.some(r=>{const t=r.target;return!(t.closest&&t.closest(".cw-room,.cw-rhost"))}))return;q=true;queueMicrotask(()=>{q=false;try{if(cwOn()||CW.room)cwRoomSync()}catch(e){console.warn("clawd",e)}})});
 const go=()=>{const m=document.getElementById("main"),o=document.getElementById("overlay");if(m)mo.observe(m,{childList:true,subtree:true});if(o)mo.observe(o,{childList:true})};
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",go);else go()})();
addEventListener("resize",()=>{if(CW.room)CW.room.rk="";setTimeout(()=>{try{cwRoomSync()}catch{}},60)});

/* --- ortak API: CLAWD.sprite(poz) --- */
const CW_POSES={idle:{},happy:{eyes:"happy",mouth:"smile",arms:"up",blush:true},think:{eyes:"up",lx:1,arms:"tk",mouth:"flat"},sad:{eyes:"sad",mouth:"frown"},
 dance1:{eyes:"happy",mouth:"smile",arms:"up",legs:"w1",blush:true},dance2:{eyes:"happy",mouth:"smile",arms:"c1",legs:"w2",blush:true},
 guitar1:{prop:"guitar",arms:"g1",eyes:"happy",mouth:"smile"},guitar2:{prop:"guitar",arms:"g2",eyes:"closed",mouth:"smile",legs:"spread"},
 sleep:{eyes:"closed",legs:"tuck"},surprised:{eyes:"wide",mouth:"o",arms:"up"},talk:{mouth:"t1"},wave:{eyes:"happy",mouth:"smile",arms:"w1"},
 read:{prop:"book",arms:"rd",eyes:"down",legs:"tuck"},cry:{eyes:"sad",mouth:"frown"},dizzy:{eyes:"x",mouth:"wob",bump:true,legs:"spread"},shrug:{eyes:"blink",mouth:"flat",arms:"sg"},
 win:{eyes:"happy",mouth:"smile",arms:"up",legs:"tuck",blush:true},stretch:{eyes:"closed",mouth:"yawn",arms:"hi",legs:"spread"}};
CLAWD.sprite=function(pose){const p=CW_POSES[pose]||CW_POSES.idle;return cwSvg({eyes:"open",mouth:"",arms:"down",legs:"stand",lx:0,blush:false,bump:false,brow:"",prop:"",...p})};
CLAWD.poses=Object.keys(CW_POSES);
Object.assign(CLAWD.debug,{room(){return CW.room&&{kind:CW.room.kind,key:CW.room.key,u:CW.room.u,RW:CW.room.RW,light:CW.room.light,rect:(r=>({x:Math.round(r.left),y:Math.round(r.top),w:Math.round(r.width),h:Math.round(r.height)}))(CW.room.el.getBoundingClientRect())}},
 sync(){cwRoomSync();return this.room()},lamp(v){cwRoomLamp(v);return CW.room&&CW.room.light},inputs(n){const t=now();CW.inp=Array.from({length:n||6},(_,i)=>t-i*2000);CW.lastInput=t},owlReset(){CW.owlAt=0;CW.sleptAt=0}});
/*}@js:51CLAWD*/

/* 5.1.3 Clawd'a gizli söz ile hızlı yönetici girişi (bölge 511) */
/* ===== 5.1.3: Clawd'a gizli söz → yönetici paneli (yalnızca sahibi) =====
   Clawd'a sorulan metin, harf işaretleri ve boşluklar atılıp karıştırılır (kapiH); söz kodda düz durmaz.
   Söz tutarsa asıl denetim Firestore'dadır: admin/kapi belgesine yazmayı dener; kurallar admin/ yazımını yalnızca
   yöneticiye (sahibin uid'i) verdiği için başkasında yazma reddedilir ve Clawd soruyu her zamanki gibi yanıtlar.
   Söz Yönetici › Hızlı giriş bölümünden değiştirilir (admin/kapi.h). Varsayılan söz sahibine sohbette söylendi. */
const KAPI_H0="924c26ed-bc3b30f3";
function kapiH(t){const f=cwFold(String(t||"")).replace(/\s+/g,"");return String(hash32("kadraj-kapi:"+f,2166136261))+"-"+String(hash32(f+":kapi",16777619))}
function kapiTarget(){const k=S.adm&&S.adm.kapi;return(k&&typeof k.h==="string"&&k.h)||KAPI_H0}
async function kapiProve(){if(S.mode!=="cloud")return true;const k=(S.adm&&S.adm.kapi)||{};
 try{await DB.set("admin/kapi",{h:typeof k.h==="string"?k.h:"",at:now(),by:S.uid});return true}catch{return false}}
/* 5.1.4: animasyon her zaman çıkar; hareket azaltılmışsa köşeler yerinde, yalnızca solma (kapi-rm) */
function kapiAnim(){const rm=kbReduce();const d=document.createElement("div");d.className="kapi"+(rm?" kapi-rm":"");d.setAttribute("aria-hidden","true");
 d.innerHTML=`<i class="kq q1"></i><i class="kq q2"></i><i class="kq q3"></i><i class="kq q4"></i><div class="kc">${I("key")}<b>Yönetici</b><small>Kapı açıldı</small></div>`;
 document.body.appendChild(d);return new Promise(res=>setTimeout(()=>{res();setTimeout(()=>d.remove(),450)},rm?1000:850))}
async function kapiTry(q){const t=String(q||"").trim();if(!S.uid||S.guest||t.length<4||t.length>64)return false;if(kapiH(t)!==kapiTarget())return false;
 if(S.admin){vib(30);await kapiAnim();go("admin");return true}/* 5.1.4: önceden animasyonsuz geçiyordu */
 if(!await kapiProve())return false;
 try{CW.pose="happy";Promise.resolve(cwSay("Anahtarlarım burada bir yerde... Buldum! Kapı açılıyor.",{hold:900})).catch(()=>{})}catch{}
 vib(30);await kapiAnim();S.admin=true;LS.set("kadraj_admin_"+S.uid,true);try{admWatchReports()}catch{}admLog("Yönetici paneline Clawd ile girildi");go("admin");return true}
const cwAskBase513=cwAsk;
cwAsk=function(q){const t=String(q||"").trim();if(t.length>=4&&t.length<=64&&kapiH(t)===kapiTarget()){CW.lastInput=now();kapiTry(t).then(ok=>{if(!ok)cwAskBase513(q)},()=>cwAskBase513(q));return}return cwAskBase513(q)};
function kapiHtml(){const k=S.adm&&S.adm.kapi;return`<p class="adm5-note" style="margin:0 0 10px">Clawd'a dokun › Clawd'a sor › gizli sözü yaz: yönetici paneli şifresiz açılır. Yalnızca senin hesabında çalışır; başkası aynı sözü yazsa bile Firebase izin vermez. Söz büyük/küçük harf ve Türkçe harf farkı gözetmez.</p>
 <div class="field"><label for="kapiIn">Yeni gizli söz (en az 6 karakter)</label><input class="in" id="kapiIn" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${k&&k.h?"Özel söz kayıtlı":"Şu an varsayılan söz kullanılıyor"}"></div>
 <div class="ak5-row"><button class="btn sm" type="button" data-kapi="save">${I("check")}Kaydet</button>${k&&k.h?`<button class="btn ghost sm" type="button" data-kapi="reset">Varsayılana dön</button>`:""}</div>`}
document.addEventListener("click",async e=>{const b=e.target.closest&&e.target.closest("[data-kapi]");if(!b||!S.admin)return;e.preventDefault();
 let h="";if(b.dataset.kapi==="save"){const v=(($("#kapiIn")||{}).value||"").trim();if(cwFold(v).replace(/\s+/g,"").length<6)return toast("Söz en az 6 harf olmalı.");h=kapiH(v)}
 if(await write(()=>DB.set("admin/kapi",{h,at:now(),by:S.uid}))){S.adm={...(S.adm||{}),kapi:{h,at:now(),by:S.uid}};admLog(h?"Clawd gizli sözü değişti":"Clawd gizli sözü varsayılana döndü");toast(h?"Yeni söz kaydedildi.":"Varsayılan söz geri geldi.");render(false)}});
try{ADM_EXTRA.push({id:"kapi",title:"Hızlı giriş",desc:"Clawd'a gizli sözü söyle, panel şifresiz açılsın",icon:"key",order:66,count:()=>S.adm&&S.adm.kapi&&S.adm.kapi.h?{t:"Özel",c:"on"}:{t:"Varsayılan",c:"dim"},html:kapiHtml})}catch(e){console.warn(e)}
