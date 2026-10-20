/* Kadraj 6.1 sohbette mini oyunlar: XOX, 4'lü Bağla, Kelime (Türkçe, Wordle benzeri).
   index.html bu dosyayı ilk kullanımda yükler (61GAME bölgesindeki ogLoad/ogGo, cephe.js'in kalıbı): + menüsü > Oyun oyna > X.invite(key,t),
   sohbetteki davet/sonuç mesajındaki düğme > X.open(gid) ya da X.rematch(gid).
   Kadraj'ın genel adlarını kullanır: S, DB, $, $$, I, esc, toast, openLayer, closeLayer, avatar, P, sendMessage, keyInfo, now, rid, vib, kbReduce, guard, write.
   Veri: games/og-<id> (games kuralı: girişli herkes okur/yazar). Satrancın alanlarını (players, status, moves...) KULLANMAZ; satrancın dinleyicisi
   `players array-contains` ile süzdüğü için bu belgeler satranç listesine düşmez.
     {og:1, t:"xox"|"c4"|"kel", by:kurucu, u:[uid,uid] (grupta katılan gelene kadar tek), ch:sohbet cid, gk:"g:<cid>" (grup) ya da "" (DM),
      st:"wait"|"play"|"done", at, up, f:ilk oynayanın u içindeki sırası (0/1),
      m:[hamle] (XOX: hücre 0-8; 4'lü Bağla: sütun 0-6), g:{uid:[tahmin]} (Kelime), w:şifreli cevap (Kelime), s0:{uid:ilk açılış} ft:{uid:bitiş},
      rs:pes eden uid, end:{w:kazanan uid|"",why:"cizgi"|"dolu"|"pes"|"kel"}, rm:1 (sonuç mesajı gönderildi), re:rövanş gid}
   Kurallar iki tarafta denetlenir: tahta her zaman m'den baştan kurulur (replay); sırası olmayan/geçersiz hamle varsa oradan sonrası yok sayılır,
   kazananı belgedeki end değil replay belirler. Kelime: tahminler listede olmalı, en fazla 6, bulduktan sonra yenisi yok sayılır.
   Kelime sonucu: bulan bulamayana karşı kazanır; ikisi de bulduysa az denemede bulan, eşitse kendi açılışından (s0) bitişe (ft) kadar daha kısa süren;
   kimse bulamazsa berabere. Bulan kişi n denemede bulduysa ve rakip n deneme yapıp bulamadıysa rakip daha iyisini yapamaz, oyun hemen biter.
   Sonuç mesajını kazanma hamlesini yapan gönderir (rm:1 aynı yazmada); Kelime'de karar sonradan gelirse belgeyi ilk gören oyuncu (önce u[0]) kapatır.
   Testler için motor window.OYUNLAR._e (DOM'suz). */
(()=>{"use strict";
if(window.OYUNLAR)return;
const X={};window.OYUNLAR=X;

/* ---------- motor (DOM'suz) ---------- */
const TN={xox:"XOX",c4:"4'lü Bağla",kel:"Kelime"};
const XL=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
function xoxRes(b){for(const l of XL){const v=b[l[0]];if(v>=0&&v===b[l[1]]&&v===b[l[2]])return{w:v,line:l,why:"cizgi"}}return b.every(x=>x>=0)?{w:-1,why:"dolu"}:null}
const CW=7,CH=6;
function c4Drop(b,col){if(!Number.isInteger(col)||col<0||col>=CW)return-1;for(let r=CH-1;r>=0;r--)if(b[r*CW+col]<0)return r*CW+col;return-1}
function c4Res(b,cell){if(cell>=0){const v=b[cell],r0=(cell/CW)|0,c0=cell%CW;
  for(const[dr,dc]of[[0,1],[1,0],[1,1],[1,-1]]){const line=[cell];
   for(const s of[1,-1]){let r=r0+dr*s,c=c0+dc*s;while(r>=0&&r<CH&&c>=0&&c<CW&&b[r*CW+c]===v){line.push(r*CW+c);r+=dr*s;c+=dc*s}}
   if(line.length>=4)return{w:v,line:line.sort((a,b)=>a-b),why:"cizgi"}}}
 return b.every(x=>x>=0)?{w:-1,why:"dolu"}:null}
/* XOX ve 4'lü Bağla: tahtayı hamle listesinden kurar. b[i]: -1 boş, 0/1 oyuncunun u içindeki sırası */
function replay(t,d){const n=t==="c4"?CW*CH:9;const b=new Array(n).fill(-1);const f=d&&d.f===1?1:0;const ms=Array.isArray(d&&d.m)?d.m:[];
 let res=null,bad=false,last=-1,i=0;
 for(;i<ms.length;i++){if(res){bad=true;break}const who=(f+i)%2;const v=ms[i];let cell=-1;
  if(t==="c4")cell=c4Drop(b,v);else if(Number.isInteger(v)&&v>=0&&v<9&&b[v]<0)cell=v;
  if(cell<0){bad=true;break}b[cell]=who;last=cell;res=t==="c4"?c4Res(b,cell):xoxRes(b)}
 const turn=(f+i)%2;
 if(!res&&d&&d.rs&&Array.isArray(d.u)){const k=d.u.indexOf(d.rs);if(k>=0)res={w:1-k,why:"pes"}}
 return{b,turn,res,bad,last,n:i}}

/* Kelime */
/* Cevaplar (ANS, elle seçilmiş yaygın kelimeler) ve ek tahmin listesi (GUESS: TDK sözlüğündeki 5 harfli sözcükler, özel adlar, argo ve küfür ayıklandı) */
const ANS="kalem kitap deniz güneş bulut çiçek orman nehir kuzey güney limon elmas armut kiraz kavun incir ceviz badem havuç soğan mısır ekmek çorba tatlı şeker reçel kahve ayran gazoz börek pasta simit pilav köfte kebap turşu tuzlu köpek aslan tavuk horoz ördek serçe balık yunus koyun tilki kirpi kumru karga böcek sinek akrep yılan zebra panda koala geyik katır midye burun dudak kulak bilek göğüs karın bacak topuk beyin ciğer kemik yanak duvar tavan zemin perde yatak dolap lamba banyo salon bahçe fırın tabak çatal kaşık bıçak tepsi sabun havlu tarak fırça makas düğme çanta ceket palto çorap şapka kemer yüzük kolye çakıl çamur ırmak dalga köpük dünya buzul yayla çayır çimen filiz tohum fidan gonca yosun çınar kavak söğüt ladin servi sevgi hayal huzur barış zafer cesur korku sabır bilgi fikir sanat müzik şarkı türkü resim kural hedef değer güven saygı komşu bebek çocuk yaşlı teyze kuzen gelin damat polis asker pilot şoför terzi yazar müdür memur hakim bekçi şehir sokak cadde çarşı pazar liman durak köprü saray tarla kümes sınıf araba vapur kayık motor tekne taksi metro dümen sabah öğlen akşam hafta yarın bugün bahar zaman büyük küçük geniş derin alçak güzel temiz kirli sıcak soğuk serin hafif hızlı yavaş kolay basit bayat fakir mutlu üzgün sakin kibar nazik yeşil beyaz siyah pembe aydın almak atmak açmak içmek olmak yemek davet düğün tatil yolcu bilet valiz kumaş iplik pamuk kağıt silgi tahta sayfa cümle masal roman dergi posta radyo ekran video kablo robot roket atlas üçgen daire nokta çizgi rakam yarım altın gümüş bakır demir çelik kömür yakut duman gölge yankı ritim davul zurna gitar keman kanun tenis yüzme güreş kayak tavla takım hakem rekor raket nohut mantı dolma sarma helva lokum meyve sebze tahıl susam kekik çilek vişne hurma mango kabak marul yağış nemli";
const GUESS="abacı abadi abalı abani abaşo abdal abece abide abiye ablak abone abraş abril abuli acaba acele acemi aceze acibe acube acuze acıca acılı acıma adale adalı adama adedi adese adeta adres adsız adına afaki afazi afife afili afişe afoni afsun aftos afyon agami agora agraf ahali ahbap ahcar ahenk ahfat ahize ahkam ahlaf ahlak ahlat ahraz ahval ahşap aidat ajans ajite akabe akait akaju akala akbaş akdut akemi akide akkor akkuş aklan aklen aklık akmak akman akmaz akont akort akpas akran aksak aksam aksan akson aktar aktif aktör akvam akçıl akıcı akşın alaca alaka alarm alaza albay albüm aleni aleyh algın alize alkan alkil alkol alkım alkış allah allak allem allık almaç almaş alnaç altes altlı altık altız alyan alyon alıcı amade ambar amber amele ameli amigo amorf amper ampir ampul amudi anaca analı anane ancak andaç andık andız andıç anele anemi angut angın angıç anide anime anjin anket anlak anlam anlık anmak anons ansız anten antet antik antlı antre anyon anüri apacı apiko aplik aport apotr apoşi apsis aracı araka arama arazi ardak ardıl ardıç arena argaç argon argın argıt arife ariya ariza arkaç arkoz arkıt armuz aroma arpej arpçı arsız arter artma artçı artık artım artın artış arıcı arıza arızi arşiv arşın asabi ashap aside asist askat asklı aslen aslık asmak aspur astar astat astik astım asude asyön asılı atama atari ataşe atfen atlet atmık atıcı atılı avans avara avare avdet avene avize avlak avrat avret avunç avurt ayevi aygın aygır aygıt aylak aylık aymak aymaz aynaz aynen ayraç ayrık ayrım ayrıt ayrıç aysar aysız ayvan ayvaz ayyar ayyuk ayıcı azade azami azgın azize azlık azmak azman aznif azoik azvay azılı açgöz açlık açmaz açval açıcı ağcık ağmak ağnam ağraz ağyar ağılı aşama aşari aşağı aşevi aşina aşkın aşlık aşmak aşure aşıcı aşılı aşırı babaç badas badat badik badya badıç bagaj baget bahir bahis bahri bakam bakan bakaç bakir bakla bakma bakım bakış balar balat balcı baldo balet baliğ balkı ballı balon baloz balta balya bambu bamya banak banal bando banka banko banma banço baraj barak baran barba barcı barda bardo barem baret barit bariz barka barok baron barut barça basak basar basen basil baskı basma basso bastı basur basya basık basım basın basış batak batar batik batkı batma batur batöz batık batıl batın batış bavcı bavlı bavul bayan bayma bayrı bayır bazal bazen bazik bazit baççı bağan bağcı bağda bağlı bağıl bağım bağın bağır bağıt bağış başak başat başka başlı başta başçı becet bedel beden bedii bedik bedir bedük begüm beher behey behre bekar bekas bekri belce belde belek belen beleş belge belgi belik belit beliğ belki belli bemol bence benci bende benek bengi beniz benli berat beril berri besin beste beter betik betim beton beyan beyit beyzi bezci bezek bezen bezgi bezik bezir bezme bezsi beşer beşik beşiz beşli beşme beşon biber biblo bicik bidar bidat bidon bihuş bikes bikir bilar bilge bilim bilir biliş bilme bilye bindi binek biner bingi binit biniş binme biraz birci birer birey birim birli birun bitap bitek bitey bitik bitim bitiş bitki bitli bitme bitüm biyel bizar bizce bizde bizon biçem biçim biçiş biçki biçme bişek bloke bobin bocuk bodur boduç bohem bohça bolca bomba bombe borak boran borat borda bordo borik borsa boruk boyar boyca boylu boyna boyoz boyun boyut bozca bozma bozuk bozum boğak boğaz boğma boğuk boğum branş bravo bronz bronş bröve bucak budak budun buhar buhur buket bukle bulak bulgu bulma buluş bunak bunca bunda bunlu bunma burcu burgu burma buruk butik butlu buton buyma buyot buzcu buzla buzlu buçuk buğra buğur buğuz buşon böbür bölen bölge bölme bölük bölüm bölüt bölüş bönce böyle böğür bücür büken bükme bükük büküm bükün büküç büküş büluğ bünye bürgü bürük bürüm bütan büten bütçe bütün büvet büzgü büzme büzük büğet büğlü bıcıl bıdık bıkma bıkış bıyık bızır bıçkı bıçık cacık cahil caize calip camcı camia camit camlı camsı camız canan canip canlı carlı carta casus cayma cayış cazcı cazip cazlı cebel cebin cebir cebri cedel cedit cedre cehil cehre cehri celal celbe celep celil celse cemal ceman cemil cemre cenah cenap cenin cenup cephe cepçi ceren ceset cesim cevap cevaz cevir cevvi cezai cezbe cezir cezri cezve cibin cibre cicik cicim cicoz cidal cidar ciddi cihan cihar cihat cihaz cihet cilve cimri cinai cinas cinci cinli cinsi cirim cirit cisim civan civar cizye conta corum coşku coşma cudam cukka cumba cunda cunta cuşiş cübbe cücük cülus cünha cünun cünüp cüret cüruf cürüm cüsse cıbıl cıcık cıdak cılız cıvma cıvık cızık dadaş dahil daima daimi dakik dalak dalan dalaş dalgı dallı dalma dalsı dalya dalız dalış damak damar damga damla damlı danış daraç daraş darbe darca dasit datif davar davya dayak dağar dağcı dağlı debbe debil defin defne degaj deist deizm dekan dekar dekor delgi delik delil delme delta demek demet demeç demin demli denek denet deney denge denim denli denme denyo depar derbi derme derun derya desen deste detay devam devce devim devir devre devri deyim deyiş değil değim değin değiş değme deşik deşme dibek didar didon dikel diken dikey dikeç dikim dikit dikiz dikiş dikme dikse dikta dikte dikçe dilci dilek dilim diliş dilli dilme dilsi dimağ dinar dince dinci dinek dinen dingi diniş dinli dinme dipli direk diren direy diril dirim diriğ disko ditme dival divan divik divit diyar diyet diyez dizek dizel dizem dizge dizgi dizim dizin diziş dizme diğer dişil dişli dişçi dobra dogma dokuz dolak dolam dolar dolay dolgu dolum doluş domur domuz donam donlu donma donra donuk dorse doruk dorum dosya doygu doyma doyum doyuş dozaj dozer doğal doğan doğaç doğma doğru doğum doğuş draje drama duacı dualı dubar duble duhul dulda duluk dumur dural duraç durgu durma duruk durum duruş duvak duyar duygu duyma duyum duyuş duşak dökme dökük döküm dölek dölüt dönek dönel dönem döner döneç döngü dönme dönük dönüm dönüt dönüş döveç döviz dövme dövüş döşek döşem döşlü dübel dübeş düden düdük dügah dünit dünkü dünür dürme dürtü dürüm düvel düven düver düyek düyun düzce düzem düzen düzey düzeç düzgü düzme düçar düğüm düşes düşey düşeş düşkü düşme düşçü düşük düşün düşüt düşüş dılak dığan dışkı dışık ebcet ebedi ebeli ebleh ecdat edalı edebi edinç edvar efdal efece efekt efkar eflak efrat efriz efsun efsus eglog egzoz ehram ehven ejder ekici ekili eklem ekler ekose eksen ekser eksik eksin eksiz elbet elcik elden eleji eleme elgin elhak elifi elips ellik elmek elvan elyaf elzem elçek elçim emare emaye emcek emcik emici emlak emlik emmek emmeç emraz emsal emtia emval emzik encam endam ender eneme enfes engel engin enkaz enlem ensar enser ensiz entel enzim enöte eosen epeyi epope erbap erbaş erbin ercik erdem erden ergen ergin erika erime erinç erkan erkek erken erkeç erkin erkli erlik ermek ermin ermiş ersiz ervah erzak erzel esami esans esasi esbak esbap eseme esham esire eskiz eslaf eslek esmek esmer esnaf esnek espas espri esrik essah ester estet esvap etene etfal etken etkin etlik etmek etmen etnik etraf etsiz etçik etçil evaze evcek evcik evcil evdeş evgin evham eviye evkaf evlat evlek evlik evrak evrat evren evrik evrim evsaf evsel evsin evsiz evvel eylem eylül eytam eyvah eyvan eyyam ezani ezber ezeli ezgin ezgiç ezici ezinç ezmek eçhel eğlek eğmek eğmeç eğrez eğrim eşarp eşhas eşkal eşkin eşlek eşlem eşlik eşmek eşraf eşref eşsiz facia fagot fahiş fahri fahte fahur fakat fakih fakül falan falcı falez falso falya fanta fanti fanus fanya farad faraş farba faril fariğ faset fasih fasit faska fason fasık fasıl fatih fauna fayda fazla fazıl fecir fedai fehim fehva fekül felah felek fenci fener fenik fenni fenol ferah ferağ ferda ferde ferdi ferih ferik ferli ferma fesat fesih fetha fetih fetiş fetva fetüs fevri feyiz fiber fidye fifre figan figür fiili fikri filan filar filet filoz filsi filum final finiş firak firar firez firik firma fiske fisto fitil fitin fitne fitre fitçi fiyat fizik fişek fişka fişli flama fleol flora flori flöre flört fodla fodra fodul fokus folyo fonda fonem forma foroz forsa forte forum fosil frank frape fresk freze frigo frisa fuaye fujer fular fulya funda furya fülüs fünye füsun fütur füzen fıkra fıkıh fırka fıtri fıtık fışkı gabin gabro gabya gadir gafil gafur gaile gaita galat galip galiz galon galop galoş gamba gamet gamlı gamze garaj garaz garip garoz gasil gasıp gauss gavot gayda gayet gayri gayrı gayur gayya gazal gazap gazel gazlı gazve gaşiy gebre gedik gedme gelen gelir geliş gelme genel geniz genom geoit gerek geren gereç gergi geriz geriş germe gerçi getto geven geviş gevme geyşa geziş gezme geçek geçen geçer geçim geçit geçiş geçme geççe gider gidiş gidon giray girdi giren girim giriş girme gitme giyim giyit giyiş giyme giysi gizem gizil gizli glase gnays gocuk golcü gollü goril grado grena grizu grogi grosa guano guatr gudde guguk gulaş gulet gurme gurup gurur gusto gusül göbek göbel göbüt göcen göden gödeş gökçe gölek gölet gölük gömme gömük gömüt gömüş göncü gönen gönye gönül görev görgü görme görüm görüş gövde gövek gövel gövem göyme göyük gözcü gözde gözer gözgü gözlü göçer göçme göçük göçüm göçüş göğem gübre gübür gücük gücün güdek güdük güdüm güfte gülcü güleç gülle güllü gülme gülük gülüt gülüş gümeç gümül günah günce günde güneç günlü güpür güruh gütme güvez güveç güzaf güzey güzün güçlü güğüm gıcık gıcır gıdık gıdım gıpta gırla gıyap habbe haber habeş habip habis hacet hacim hacir haciz hadde hadim hadis hadım hafit hafız haham hahha haile hakan hakir haklı hakça halas halat halay halef halel halen halet halfa halim halis haliç halka haluk hamak hamal hamam hamil hamiş hamla hamle hamse hamsi hamur hamut hamız hanay hancı hande hanek hangi hanut hanım hapaz hapis hapçı hapşu haram harap harar haraç harbe harbi harem harim harir haris hariç harlı harta harım harın hasar hasat hasbi hasep haset hasis haspa hassa hasse hasta hasut hasıl hasım hasır hatif hatim hatip hatmi hatta hatun hatıl hatır havai havan havas havil havlı havra havut havuz havya havza hayat haybe hayda haydi hayfa hayli hayta hayıf hayır hayıt hayız hazan hazar hazcı hazin hazne hazık hazım hazır haçlı haşat haşin haşir haşiv haşiş haşıl hecin heder hedik hekim helak helal helik helis helke helme hemen hempa hemze henüz hepsi herek herif herik herke hertz herze hesap heves heybe heyet hezel hicap hicaz hiciv hicri hidra hikem hilaf hilal hilat hilye himen hindi hippi hisar hisli hisse hissi hitam hitan hitap hizip hiççi hodan hodri hokey hokka hoppa horon horst hotoz hozan hoşaf hoşur hoşça hudut hukuk hulul hulus humar humma humor humus hurda hurra huruç husuf husul husus husye hutbe hutut huylu höyük hücre hücum hükmi hüküm hülle hülya hüner hünsa hürle hürya hüsün hüzme hüzün hıdiv hıfız hımış hırbo hırka hırlı hısım hıyar hızar hızla hızma hızır hışım hışır ibare ibate ibdai iblağ iblis ibraz ibret ibrik ibzal icbar icmal idadi idame idare idari iddia ideal idman idrak idrar ifade iffet ifham iflah iflas ifrat ifraz ifrağ ifrit ifsat iftar ihale ihata ihbar ihdas ihlal ihlas ihmal ihram ihraz ihraç ihsan ihsas ihtar ihvan ihzar ikame ikbal ikdam ikici ikili iklim ikmal ikrah ikram ikrar ikraz iksir ilahe ilahi ilave ilbay ilenç ileri ileti ilgeç ilhak ilham ilhan ilkah ilkel ilkin illet ilmek ilmik ilzam imale imalı imame imbat imbik imdat imece imkan imleç imlik imren imroz imsak inanç incik indis infak infaz ingin inkar inmek insaf insan intak intan intaç inzal inşat ipeka ipham ipsiz iptal ipucu ipçik irade iradi irfan irice irkme irmik ironi irsal irsen irşat isale ishal iskan islim ismen ismet isnat ispat ispir ispit israf istek istem ister istif istim istop isyan itaat iteği ithaf ithal itham itici itila itina itlaf itlik itmam itmek ivedi ivesi ivmek iyice izabe izafe izafi izale izhar izlek izlem izole izzet içeri içici içkin içlem içlik içrek içsel içsiz içten içyüz iğdiş iğfal iğlik işeme işgal işkal işkil işlek işlem işlev işlik işmar işret işsiz iştah işteş işyar jarse jeloz jeton jikle jilet joker jokey jüpon kaban kabil kabin kabir kabuk kabul kabus kabza kabız kadar kadeh kadem kader kadim kadir kadit kadro kadük kadın kafes kaffe kafur kagir kahil kahin kahir kahya kahır kaide kaime kakao kakaç kakma kakül kakım kakıç kakış kalak kalan kalas kalay kalbi kalcı kalfa kalma kalya kalça kalık kalım kalın kalıp kalıt kalıç kalış kamer kamet kamga kamil kamus kamçı kamış kanal kanat kanca kaniş kanlı kanma kanon kanto kanık kanıt kanış kapak kapan kapik kaplı kapma kaput kapuz kapış karar kargo kargı karha karlı karma karne karni karst karun karye karık karış karşı kasap kasem kaset kasis kasko kaslı kasma kasnı kasti kasık kasım kasır kasıt katar katil katip katkı katlı katma katot katre katık katım kavaf kaval kavas kavat kavga kavil kavim kavis kavkı kavmi kavuk kavut kavuz kayan kayar kayaç kaygı kayma kayme kayra kayın kayıp kayır kayıt kayış kayşa kazak kazan kazaz kazma kazık kazıl kazım kaçak kaçar kaçlı kaçma kaçta kaçık kaçış kağan kağnı kaşan kaşar kaşif kaşlı kebir kebze keder kefal kefek kefen kefil kefir kefne kehle kekeç kekre kelam kelek kelem kelep keler keleş kelik kelle kelli kemal kemha kemre kenar kendi kenef kenet kepek kepez kepir kepme kepçe kerde kerem keres kerih kerim kerki kerte kerti kesat kesbi kesek kesel kesen keser kesif kesik kesim kesin kesir kesit kesiş keski kesme kesre ketal keten keton ketum kevel keyfi keyif keşen keşif keşik keşiş keşke keşki kibir kifaf kikla kiler kilim kilit kiliz killi kilsi kilüs kimse kimya kimüs kinci kinik kinin kiniş kinli kirde kireç kiriş kirve kisve kitin kitle kitre kizir klapa klima klips klişe kobay kobra kofra koful kokak koket kokma kokot kokoz kokuş kolaj kolan kolcu kolej kolik kolit kollu kolon kolpo kolsu kolza komar kombi komik komot komut konak konik konma konsa konuk konum konur konut konuş kopal kopek kopil kopma kopoy kopuk kopuz kopya kopça koral korna korno korse korte koruk korun korza kotan koton kotra kovan kovcu kovma kovuk kovuş koyak koyar koyma koyut kozak koçak koçan koçma koğuş koşam koşaç koşin koşma koşuk koşul koşum koşun koşut kramp krank kravl kraça kredi krema kriko kroki krome kroşe kubat kubbe kubur kucak kudas kuduz kudüm kukla kulaç kulis kulun kulüp kumar kumcu kumla kumlu kumsu kumul kumuç kunda kupes kuple kupon kupür kurak kuram kurca kurgu kurma kurna kuron kurul kurum kurut kuruş kurya kurye kusma kusur kutan kutlu kutnu kutsi kutup kutur kuver kuvve kuvöz kuytu kuyum kuzay kuzin kuşak kuşet kuşku kuşçu köhne köken köklü köksü kökçü kölük kömbe kömeç kömüş körpe körük kösem kösnü kösçü kötek köycü köylü köçek köşek kübik küflü küfür kükre külah külek külli küllü külot külte külçe küncü künde künye küplü kürar kürdi kürek kürit kürsü küskü küsme küspe küsuf küsur kütin kütle kütlü kütör kütük küvet küşat küşne küşüm kıble kıdem kılgı kıllı kılma kılıf kılık kılır kılıç kılış kımıl kımız kınlı kıpma kıpık kıran kırat kıray kıraç kırba kırca kırcı kırkı kırma kırık kırım kısas kıska kıskı kısma kısmi kıssa kısık kısım kısır kısıt kısış kıtal kıtık kıtır kıvam kıyak kıyam kıyas kıygı kıyma kıyye kıyık kıyım kıyın kıyış kızak kızan kızma kızıl kızış kışla kışın kışır laden lades lafzi lafçı lafız lagar lagün lahit lahos lahut lahza lakap lakin lakoz lakçı lamel lando lanet lanse largo larva laski lasta latif lavaj lavaş lavta layık lazer lazut lazım laçka laçın lağım lağıv ledün legal lehim lehçe lemis lenfa lento lepra lerze levha levye leyli lezar leziz leçek leğen libas liboş libre lider lifli liken likit likör limbo limit linet linin lipit lipom liret lirik lisan liste litre livar liyan lizol lizöz lobut lodos logos lojik lokal lokma lonca longa lopur lorta lotus loşça lökoz löpür lüfer lügat lügol lümen lünet lüpçü lütuf lüzum lıkır lığlı maada mabat mabet mabut macun madam madde maddi madem maden mader madik madun mafiş mafya magma magri mahal mahfe mahfi mahir mahra mahur mahut mahya mahıv maile majör makak makam makat maket makro maksi makta maktu makul makus malak malaz malca malen malik malta malul malum malya mambo mamul mamur mamut manas manat manav manca manda manej manen manga mania manti manto mapus maral maraz marda mariz marka marke marki maron martı maruf maruz marya masaj masat masif maske masnu mason mastı masum masun masör masöz matah matbu matem matiz matla matuf matuh maval maviş mavna mavra mayna mayın mayıs mazak mazot mazur maşer maşuk mebde mebiz mebni mebus mecal mecaz mecmu mecra medar medet medih medya medüz meful mehaz mehdi mehel mehil mehle mekan mekik melal melas melce melek meles melez meleş melik melon melul melun memat memba memnu memul menfa menfi menus menşe merak meral meram merci merek meres meret mermi mersi mesai mesaj mesel mesen mesmu mesul mesut metal metan metbu metil metin metis metot metre mevdu mevki mevla mevta mevut mevzi mevzu meyan meyil meyus mezar mezat mezon mezra mezru mezun mezür meğer meşbu meşin meşru meşum mikap mikoz mikro milat milel milim milis milli mimar mimik mimli minik minör miras mirat miraç mirim mirza misak misal misel misil misis mitil mitos mitoz miyar miyav miyaz miyom miyop mizah mizan mizaç miçel mobil model modem modül moher molas molla moloz monat monte moral moren morto moruk motel motif mozak muare mucip mucir mucit mucuk mucur mudil mufla muhal muhat muhik muhil muhip muhit mujik mukim mukni mukus mulaj mumcu mumlu mumya munis murat muris musap muska muson musır mutaf mutat muylu muzip muzsu muzır muşta muştu möble mösyö mübah müfit müftü mühim mühre mühür müjde mülga mülki mümas mümin münşi mürai mürit mürur müziç müşir mıcır mıgri mıgır mıhlı mırra mısra nabız nacak nadan nadas nadim nadir nafia nafiz nafta nahak nahif nahiv nahoş nahır nakdi nakil nakip nakit nakli nakıs nakız nakış nalan nalça nalın namaz namlu namlı namus nanay nanik narin nasip nasir nasıl nasıp nasır natuk natür natır nazal nazar nazil nazir nazlı nazım nazır naçar naçiz nağme naşir nebat nebze necat necip nedbe neden nedim nefer nefes nefha nefir nefis nefiy nefti nehiy nekes nekre nesep nesih nesil nesim nesir nesiç nesne nevir neyse neyçe nezif nezih nezir nezle neşet neşir nicel nifak nihai nihan nikah nikap nikel nimet ninni nipel nisai nisan nisap nispi nitel niyaz niyet nizam niçin nişan nodul nokra nonoş notam noter nukut numen nurlu nutuk nöbet nöron nüans nüfus nüfuz nükte nükul nüsha nüzul nısıf oberj obruk ocuma odacı odalı odeon odsuz oflaz ofris ofset ojeli okapi okluk oksit oktan oktav okuma okume olası oleik olein olgun olmaz olmuş oluru olçum ombra omlet onama ondan ongen ongun oniks onlar onluk onmak onsuz ontik oosit opera optik orada oralı orası oraya orcik orfoz organ orgcu orkit orlon ortak ortam ortay ortaç ortoz otacı otama otist otizm otlak otluk otsul otsuz otçul ovalı ovmak ovmaç oyacı oyalı oydaş oylum oymak oynak oynaş ozmos ozuga oğlak oğlan pabuç padok pafta pagan pahal paket palan palas palaz palet pampa panel panik papak papaz papel paraf parka parke parpa parsa parti parya parça pasaj pasak pasif paslı pasör patak paten patik paunt payan payda payen payet paylı pazen paçal paçoz pedal peder pekçe pelin pelit pelte pelür pelüş penes pengö pense penye pençe peren perki perma permi peron peruk perva pesek pesüs petek peyda peyke peçiç peşin peşli pigme pikaj pikap piket piliç pilli pinel pines pinti pipet pirit pisik pisin piton piyan piyaz piyes piyon pizza pişek pişik pişim pişme pişti plaka plase plati plato plaza plöra poker polar polat polen polip polka pomat pompa ponje ponza popçu porno porte porto potas potin potuk potur poyra poşet prafa prens prese print proje prova pruva pudra pufla pulcu pullu puluç pumba punto pusat puset puslu pusma pünez püren pürüz püsür pütür pıhtı pınar pırpı pırtı pısma rabıt racon radar radde radon rafit rafya ragbi rahat rahim rahip rahle rahne rakik rakip rakit rakor rakun rakım ralli ramak rambo rampa randa ranza rapor rasat raspa rasıt ratıp raunt rayiç reaya rebap recep recim redif refah refik refüj rehin rejim rekat rekiz remel remil remiz rende resen resif resmi resul revak revan revaç revir reviş reybi reyon rezil reşit reşme rical ricat rimel ringa riyal rodaj rodeo rolcü rosto rotil rotor rozet rubai ruble rugan ruhen ruhlu rujlu rulet rumba rumuz runik rutin röfle rögar rötar rötuş rüesa rükün rüküş rüsum rüsup rüsva rütbe rüyet rızık saban sabit sabuh sabur sabık sadak sadet sadik sadme sadık sadır safer safha safir safra safça sagar sahaf sahan sahih sahil sahip sahne sahra sahre sahte sahur saika sakaf sakak sakal sakar sakat sakil sakim sakit saklı saksı sakın sakıt sakız salah salam salat salaş salcı salep salgı salik salim salip sallı salma saloz salpa salsa salta salto salvo salya salça salık saman samba samsa samur samut sanal sancı sanem sangı sanki sanlı sanma sanrı sanık sapak sapan sapkı saplı sapma sapık sapış sarak sarat saraç sargı sarig sarih sarpa sarpi sarık sarım sarış saten sathi satir satma satıh satım satın satır satış sauna savak savan savat savaş savca savcı savla savma sayaç sayha sayma sayrı sayım sayın sayış sazak sazan sazcı sazlı saçak saçlı saçma saçık saçış sağcı sağma sağrı sağım sağın sağır seans sebat sebep sebil secde sedef sedir sedye sefer sefih sefil sefir segah seher sehim sehiv sehpa sekel sekiz sekiş sekme sekte selam selef selek selen selim selis selva semah semai seman semen semer semih semiz sence sende senek senet senir senit sepek sepet sepya serak serap seren sergi serim seriş serme serum sesli sesçi seter setik setir setre sevap sevda sever sevim seviş sevme seyek seyir seyis seyit sezgi seziş sezme sezon seçal seçik seçim seçiş seçki seçme sicil sicim sidik sifin sifon sigar sihir sikke silah silaj silik silis siliş silki sille silme simge simya sinik sinir siniş sinle sinme sinsi sinüs siper sipsi siren sirer sirke sirmo siroz sirto sisli sitem sitil sivil sivri siyak siyek siyer siyme sizce sizde siğil skala sking slayt sofra softa soket sokma sokra sokum sokur sokuş solak solcu solma soluk soluş somak somon somun somut somya sonar sonat sonda sonlu sonra sonuç sorgu sorit sorma sorti sorum sorun sosis soyka soylu soyma soyut soyuş spazm sperm sprey stant statü steno stent stilo stres streç suare subay subra subye sucuk sucul sudak sudan sufle sukut sulak sulta suluk sumak sunak sungu sunma sunta sunum sunuş suoku supap surat suret susak susku susma susta susuz susuş suvat suyuk suçlu sökel sökme sökük söküm sökün söküş sölom sönme sönük sönüm söven sövgü sövme sövüş sözce sözcü sözde sözel sözlü söğüş sübek sübut sübye sücut süfli sükse sükun sükut süluk sülük sülün sülüs sümek sümen sümük süngü sünme süper sürat sürek süreç sürfe sürgü sürme sürre sürur sürüm sürüş süsen süslü süsme sütlü sütre sütsü sütun sütçü süven süyek süyüm süzek süzgü süzme süzük sıfat sıfır sıhhi sıhri sıkma sıkça sıkım sıkıt sımak sınai sınav sındı sınma sınık sınır sırat sırlı sırma sırça sırık sırım sıska sıtma sıvık sıyga sıygı sızak sızma sızış sıçan sığla sığma sığın sığır taban tabii tabip tabir tabla tablo tabur tabut tabya tacil tacir taciz tadat tadil tadım tafra tafta tahin tahra takas takat takim takip takke takla takma takoz taksa takti takva talak talan talaz talaş talep talih talik talil talim talip tamah tamam tamik tamim tamir tanen tango tanin tanrı tanık tanım tanıt tanış tapan tapir tapma tapon tapış taraf taraz taraş taret tarif tarih tarik tariz tartı tarım tasar tasdi tasma tasni tasım tatar tatma tavaf tavcı tavik taviz tavlı tavus tavır tayfa tayga tayin tayip tayın tazim tazip taziz taçlı taşlı taşma taşra taşsı taşçı taşıl taşım taşıt teali teati tebaa teber tecil tecim tedai tedip tehir teizm tekel teker tekil tekin tekir tekit tekke tekli tekme tekst tekçi telaş telef telek telem teles telif telin telis telli telsi telve temas temek temel temin tempo tenge tenha tenor tente tenya teori tepik tepir tepiş tepke tepki tepme teras terbi terek teres terfi terim terki terli terme terör tesir tesis tesit tesri testi tetik tetir tevdi tevek tevil tevki tevsi tevzi teyel teyit tezat tezce tezek tezli teğet teşci teşne teşri teşyi tifüs tikel timüs tiner tipik tiraj tiran tirat tirit tiriz tirle tirsi tirşe titan titiz tokat tokaç toklu tokuz tokyo tolga tomak tomar tonaj toner tonga tonik tonoz topak topal topaz topaç topik topla toplu topur toput topuz topçu torak torba torik torna tortu torum torun tosun total totem toyca toycu toyga tozan tozlu trafo trake trans tranş trata trias triko tromp tröst tufan tugay tuhaf tuluk tulum tulup tuman tumba tunik turaç turba turbo turfa turna turne turno turta tutak tutam tutar tutaç tutku tutma tutuk tutum tutuş tutya tuval tuyuğ tuzak tuzcu tuzla tuzsu tuğcu tuğla tuğlu tuğra tvist törel tören törpü tövbe tözel tüfek tümce tümel tümen tümör tümür tünek tünel tünme tüplü tüpçü türap türbe türel türev türlü türüm tütme tütsü tütün tüvit tüylü tüyme tüzel tüzük tıbbi tıfıl tıkaç tıkma tıkım tıkır tıkız tımar tınaz tınma tıpkı tırak tıraş tırık tırıl tırıs ucube ukala uknum ulama ulema ulufe uluma umacı ummak umman umumi unluk unsur unvan urgan usanç usare uskur ussal utanç utmak uyarı uygar uygun uyluk uymak uymaz uyruk uysal uyuma uzama uzlet uzluk uzman uçarı uçkun uçmak uçman uçsuz uçucu uğrak uğraş uğrun uşkun uşşak vacip vagon vahim vahit vahiy vahşi vakar vakfe vakit vakum vakur vakıa vakıf valör varak varan varda vargı varil varis varit varma varoş varta varış vasat vasıf vasıl vatan vatka vatoz vazıh vaşak vebal vecih veciz vedia vefat vehim vekil velet velev velur velut verdi verem verev vergi verim verit veriş verme vezin vezir vezne veçhe vigla villa viraj viran virüs visal viski vites vitir viyak viyol vizon vizör vokal volan volta vonoz votka voyvo vukuf vulva vuraç vurgu vurma vuruk vuruş vusul vuzuh vücut vürut vüsat vıcık yaban yabgu yafta yahey yahni yahut yahşi yakin yakma yakım yakın yakıt yakış yalak yalan yalaz yalpa yalpı yalım yalın yalız yamak yaman yamaç yamuk yamçı yanal yanay yancı yangı yanlı yanma yansı yanık yanıt yanış yapak yapay yapma yapık yapım yapıt yapış yaran yarar yaraş yarda yaren yarga yargı yarka yarma yarık yarış yasak yasal yaslı yasma yassı yatay yatma yatsı yatuk yatçı yatık yatım yatır yatış yavan yaver yavru yavsı yavuz yayan yaygı yaylı yayma yayık yayım yayın yayış yazgı yazma yazık yazım yazın yazıt yazış yağar yağcı yağlı yağma yağır yağız yaşam yaşıt yedek yediz yedme yegah yegan yekta yekun yelek yeleç yelin yelli yelme yelve yemci yemin yemiş yenge yengi yenik yenli yenme yerel yerey yergi yerli yerme yeter yetik yetim yetke yetki yetme yevmi yeygi yezit yeğen yeğin yeğni yeşim yirik yirmi yitik yitim yitme yivli yiyim yiyiş yiğit yobaz yoksa yokuş yokçu yolak yollu yolma yoluk yonca yonga yonma yontu yorga yorma yortu yorum yoğun yudum yufka yukaç yulaf yular yumak yumma yumru yumuk yunak yunma yurdu yutak yutma yutum yuvak yuvar yuvgu yönlü yörük yüklü yükçü yüküm yükün yülgü yülük yünlü yürek yürük yüsrü yüzde yüzer yüzey yüzlü yüzüş yıkma yıkık yıkım yıkış yılgı yılkı yılma yılık yırık yığma yığın yığış zabit zabıt zahir zahit zalim zamir zamlı zamme zanka zanlı zarar zarcı zarif zarsı zarta zaten zayıf zağar zağcı zağlı zeban zebun zecir zecri zefir zehap zehir zekat zeker zelil zelve zenne zerde zerre zeval zevat zevce zeyil zifaf zifin zifir zifos zigon zigot zihaf zihin zihni zikir zilli zimmi zinde zirai zirve ziyan zloti zorba zorca zorgu zorla zorlu zuhur zulüm zübde zühul zükam zülal zülüf zümre züppe zürra züyuf zıbın zıhlı zımba zımni zıpka zıpır zırva çabuk çadır çakal çakar çaker çakma çakım çakın çakır çakış çalak çalar çalgı çalkı çalma çaltı çalık çalım çalış çamat çamça çanak çancı çandı çapak çapar çapla çaplı çapma çapul çaput çarka çarpı çarık çasar çatak çatkı çatma çatık çatış çavlı çavma çavun çavuş çayan çaycı çaylı çağla çağma çağrı çaşıt çebiç çecik çedik çehre çekek çekel çekem çeker çekik çekim çekiç çekiş çekme çekül çelek çelen çelgi çelim çello çelme çemen çemiç çemiş çemçe çenek çenet çengi çepel çeper çepez çepin çerez çerge çerçi çetin çevik çevre çevri çeyiz çeşit çeşme çeşni çifte çilli çimek çimme çinko çipil çiriş çiroz çitar çiten çitme çivit çizge çizik çizim çiziş çizme çiğde çiğin çiğit çişik çoban çokal çoklu çokça çokçu çolak çolpa çomak çomar çopra çopur çorak çorlu çotra çotuk çoğul çoğun çubuk çukur çulcu çulha çupra çuval çuşka çökek çökel çökme çökük çöküm çöküş çömez çömme çömçe çöplü çöpçü çörek çörkü çörtü çöven çözgü çözme çözük çözüm çözüş çöğme çöğür çükür çünkü çürük çıban çıdam çıfıt çıkak çıkan çıkar çıkma çıkra çıktı çıkık çıkın çıkıt çıkış çıngı çıpır çırak çırağ çırpı çıtak çıvma çıyan çığır öbürü ödeme ödlek ödünç öksüz ölgün ölmek ölmez ölmüş ölçek ölçer ölçme ölçüm ölçün ölçüt ölçüş öncel öncül önder öneri öneze önlem önlük önsel öpmek örcin öreke örgen örgün örgüt örmek örnek örtme örtük örtüş örücü örülü öteki ötmek ötücü ötürü övmek övücü övünç özdek özden özdeş özeme özeni özenç özerk özgül özgün özgür özlem özlük öznel özsel öğrek ücret üdeba üfleç ülfet ülger ülser ümera ümmet ümran ündeş ünite ünlem ünsüz üreme üremi ürkek ürkme ürküş üryan ürüme üsera üsküf üslup üstat üstel üstlü üstün ütmek ütücü ütülü üzere üzeri üzlük üzmek üzücü üzünç üçgül üçler üçlük üçtaş üğrüm üşenç üşmek üşüme ıhmak ılgar ılgım ılgın ıltar ılıca ılıma ırama ırgat ırkçı ıskat ıslah ıslak ıslık ısrar ıssız ıstar ıtlak ıtrah ızgın ızrar ığrıp ışkın ıştır ışıma şaban şafak şaful şahap şahin şahit şahne şahsi şahım şahıs şaibe şaire şakak şakul şalak şamar şamil şanlı şaplı şapçı şarap şarpi şaryo şataf şatır şavul şayak şayan şayet şayia şayka şaşaa şaşma şebek şedde şedit şefik şehit şehla şekel şekil şekli şekva şelek şemse şemsi şepit şeran şeref şerha şerif şerik şerir şerit şetim şifon şifre şikar şilem şilep şilin şilte şimal şimdi şinik şirin şişek şişko şişme şopar şoset şoson şoven şuara şubat şunca şunda şurup şölen şömiz şöyle şükür şümul şüphe şıpka şırak";
const up=s=>String(s).toLocaleUpperCase("tr"),lo=s=>String(s).toLocaleLowerCase("tr");
const ANSL=ANS.split(" ");let GSET=null;
const gset=()=>GSET||(GSET=new Set(ANSL.concat(GUESS.split(" "))));
const KMAX=6,KLEN=5;
function score(g,a){g=Array.from(g);a=Array.from(a);const r=[0,0,0,0,0],cnt={};
 for(let i=0;i<KLEN;i++){if(g[i]===a[i])r[i]=2;else cnt[a[i]]=(cnt[a[i]]||0)+1}
 for(let i=0;i<KLEN;i++)if(r[i]!==2&&cnt[g[i]]>0){r[i]=1;cnt[g[i]]--}
 return r}
function okWord(w){return typeof w==="string"&&Array.from(w).length===KLEN&&gset().has(w)}
function encW(w){return Array.from(w).map((c,i)=>(c.codePointAt(0)^(91+i*17)).toString(36)).join(".")}
function decW(s){try{return String(s).split(".").map((x,i)=>String.fromCodePoint(parseInt(x,36)^(91+i*17))).join("")}catch{return""}}
/* bir oyuncunun Kelime durumu: geçerli tahminler (en fazla 6, bulduktan sonrası yok) */
function kelOf(d,uid){const a=decW(d&&d.w);const raw=(d&&d.g&&Array.isArray(d.g[uid]))?d.g[uid]:[];const gs=[];let found=false;
 for(const w of raw){if(found||gs.length>=KMAX)break;if(!okWord(w)&&w!==a)continue;gs.push(w);if(w===a)found=true}
 const ft=d&&d.ft&&d.ft[uid],s0=d&&d.s0&&d.s0[uid];
 return{gs,found,n:gs.length,done:found||gs.length>=KMAX,dur:ft&&s0?Math.max(0,ft-s0):(ft?ft-(d.at||0):Infinity)}}
/* {w:0|1|-1, why} ya da null (sürüyor) */
function kelRes(d){const u=(d&&d.u)||[];if(u.length<2)return null;
 if(d.rs){const k=u.indexOf(d.rs);if(k>=0)return{w:1-k,why:"pes"}}
 const A=kelOf(d,u[0]),B=kelOf(d,u[1]);
 if(A.found&&!B.found&&B.n>=A.n)return{w:0,why:"kel"};
 if(B.found&&!A.found&&A.n>=B.n)return{w:1,why:"kel"};
 if(!A.done||!B.done)return null;
 if(A.found&&B.found){if(A.n!==B.n)return{w:A.n<B.n?0:1,why:"kel"};if(A.dur!==B.dur)return{w:A.dur<B.dur?0:1,why:"sure"};return{w:-1,why:"kel"}}
 return{w:-1,why:"kel"}}
function resOf(d){if(!d)return null;if(d.t==="kel")return kelRes(d);return replay(d.t,d).res}
X._e={xoxRes,c4Drop,c4Res,replay,score,okWord,encW,decW,kelOf,kelRes,resOf,ANSL,gset,up,lo};

/* ---------- durum ---------- */
const st={d:null,gid:null,un:null,layer:null,root:null,kel:"",shake:0,anim:-1,lastN:-1,closing:0,openAt:0,revealN:-1,gone:false};
const gp=g=>"games/"+g;
const meIdx=d=>d&&Array.isArray(d.u)?d.u.indexOf(S.uid):-1;
const oppOf=d=>{const i=meIdx(d);return i<0?null:(d.u[1-i]||null)};
const nm=u=>u?(P(u).name||P(u).username||"Oyuncu"):"Oyuncu";
const keyFor=d=>d.gk||(oppOf(d)?"u:"+oppOf(d):"");
const reduce=()=>{try{return kbReduce()}catch{return false}};

/* ---------- ikonlar ---------- */
const SV=(p,c="")=>`<svg class="og-ic ${c}" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const ICX='<path d="M6 6l12 12M18 6 6 18"/>',ICO='<circle cx="12" cy="12" r="7"/>';
X.icons={xox:'<path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>',c4:'<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8" cy="9" r="1.6"/><circle cx="12" cy="9" r="1.6"/><circle cx="16" cy="9" r="1.6"/><circle cx="8" cy="15" r="1.6"/><circle cx="12" cy="15" r="1.6"/><circle cx="16" cy="15" r="1.6"/>',kel:'<rect x="2.5" y="8" width="5.5" height="8" rx="1.2"/><rect x="9.25" y="8" width="5.5" height="8" rx="1.2"/><rect x="16" y="8" width="5.5" height="8" rx="1.2"/>'};

/* ---------- görünüm ---------- */
function css(){if(document.getElementById("ogCss"))return;const el=document.createElement("style");el.id="ogCss";el.textContent=`
.og{position:absolute;inset:0;display:flex;flex-direction:column;background:var(--bg);color:var(--fg);pointer-events:auto;overflow:hidden;font-family:var(--f-body);padding-bottom:env(safe-area-inset-bottom,0px);
 --og-a:#e5484d;--og-b:#f2b01e;--og-g:#2f9e5b;--og-y:#d4a018;--og-n:#7b8580;--og-cell:var(--surface-2,#eef1ef)}
:root[data-theme="dark"] .og,:root[data-app-theme="dark"] .og{--og-n:#4b5451}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]):not([data-app-theme="light"]) .og{--og-n:#4b5451}}
.og-ic{width:1.3rem;height:1.3rem;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.og-hd{display:flex;align-items:center;gap:8px;padding:calc(8px + env(safe-area-inset-top,0px)) 10px 6px;flex:none}
.og-hd .og-t{flex:1;min-width:0}
.og-hd b{display:block;font:600 1.05rem/1.2 var(--f-display);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.og-hd small{display:block;font:600 .64rem/1.3 var(--f-mono);letter-spacing:.08em;color:var(--muted);text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.og-ib{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;flex:none;color:var(--fg)}
.og-ib svg.i{width:1.35rem;height:1.35rem}
.og-pes{flex:none;padding:8px 12px;border-radius:999px;border:1px solid var(--line);font:600 .8rem/1 var(--f-body);color:var(--muted)}
.og-ps{display:flex;gap:8px;padding:2px 12px 8px;flex:none}
.og-p{flex:1;min-width:0;display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:14px;background:var(--surface);border:1.5px solid transparent;transition:border-color .2s}
.og-p.on{border-color:var(--pc,var(--accent))}
.og-p .av{flex:none}
.og-p .og-pn{min-width:0;flex:1}
.og-p b{display:block;font-size:.88rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.og-p small{display:block;font-size:.72rem;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.og-mk{flex:none;width:22px;height:22px;display:grid;place-items:center;color:var(--pc)}
.og-mk .og-ic{width:20px;height:20px;stroke-width:3}
.og-dot{width:16px;height:16px;border-radius:50%;background:var(--pc)}
.og-st{flex:none;text-align:center;font-weight:700;font-size:.95rem;padding:2px 12px 6px;min-height:1.6em}
.og-st.me{color:var(--accent)}
.og-bw{flex:1 1 auto;min-height:0;container-type:size;display:grid;place-items:center;padding:0 10px;position:relative}
.og-x{width:min(100cqw - 8px,100cqh - 8px,440px);aspect-ratio:1;display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.og-x button{position:relative;border-radius:16px;background:var(--og-cell);display:grid;place-items:center;color:var(--fg);touch-action:manipulation}
.og-x button:disabled{cursor:default}
.og-x button.can:hover{filter:brightness(.97)}
.og-x .og-ic{width:62%;height:62%;stroke-width:2.6}
.og-x .p0{color:var(--og-a)}.og-x .p1{color:var(--og-b)}
.og-x .wl{background:color-mix(in srgb,var(--pc) 22%,var(--og-cell))}
.og-x .nw path,.og-x .nw circle{stroke-dasharray:60;stroke-dashoffset:60;animation:ogDraw .32s ease-out forwards}
@keyframes ogDraw{to{stroke-dashoffset:0}}
.og-c{position:relative;width:min(100cqw - 4px,(100cqh - 8px)*7/6,560px);aspect-ratio:7/6;background:#1f5fbf;border-radius:16px;padding:1.6%;display:grid;grid-template-columns:repeat(7,1fr);grid-template-rows:repeat(6,1fr);gap:1.4%;touch-action:manipulation}
.og-c .k{position:relative;border-radius:50%;background:var(--bg);box-shadow:inset 0 2px 4px rgba(0,0,0,.25)}
.og-c .k i{position:absolute;inset:0;border-radius:50%;background:var(--pc);box-shadow:inset 0 -3px 0 rgba(0,0,0,.18)}
.og-c .k i.p0{--pc:var(--og-a)}.og-c .k i.p1{--pc:var(--og-b)}
.og-c .k i.nw{animation:ogDrop var(--dd,.4s) cubic-bezier(.5,0,.75,0) both}
@keyframes ogDrop{from{transform:translateY(var(--dy,-300%))}to{transform:none}}
.og-c .k i.wl{outline:3px solid #fff;outline-offset:-5px}
.og-c .cols{position:absolute;inset:0;display:grid;grid-template-columns:repeat(7,1fr)}
.og-c .cols button{border-radius:10px}
.og-c .cols button.can:hover{background:rgba(255,255,255,.12)}
.og-c .cols button:disabled{cursor:default}
.og-kw{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;align-items:center;gap:8px;padding:0 10px;container-type:size;width:100%}
.og-kg{--kw:min(100cqw - 8px,(100cqh - 4px)*5/6,330px);width:var(--kw);display:grid;grid-template-rows:repeat(6,1fr);gap:5px;aspect-ratio:5/6}
.og-kr{display:grid;grid-template-columns:repeat(5,1fr);gap:5px}
.og-kr.sh{animation:ogSh .4s}
@keyframes ogSh{20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
.og-kt{display:grid;place-items:center;border:2px solid var(--line);border-radius:8px;font:700 calc(var(--kw)/11)/1 var(--f-body);text-transform:none}
.og-kt.f{border-color:var(--muted)}
.og-kt.s0,.og-kt.s1,.og-kt.s2{border-color:transparent;color:#fff}
.og-kt.s0{background:var(--og-n)}.og-kt.s1{background:var(--og-y)}.og-kt.s2{background:var(--og-g)}
.og-kt.rv{animation:ogFlip .45s ease both;animation-delay:calc(var(--i)*.12s)}
@keyframes ogFlip{0%{transform:scaleY(1);background:transparent;border-color:var(--muted);color:var(--fg)}49%{transform:scaleY(0);background:transparent;border-color:var(--muted);color:var(--fg)}50%{transform:scaleY(0)}100%{transform:scaleY(1)}}
.og-op{display:flex;align-items:center;gap:8px;flex:none;font-size:.78rem;color:var(--muted);min-height:44px}
.og-mini{display:grid;grid-template-rows:repeat(6,6px);gap:2px}
.og-mini span{display:grid;grid-template-columns:repeat(5,6px);gap:2px}
.og-mini i{border-radius:1.5px;background:var(--line)}
.og-mini i.s0{background:var(--og-n)}.og-mini i.s1{background:var(--og-y)}.og-mini i.s2{background:var(--og-g)}
.og-kb{flex:none;display:flex;flex-direction:column;gap:6px;padding:6px 4px 10px;user-select:none;-webkit-user-select:none}
.og-kb div{display:flex;gap:4px;justify-content:center}
.og-kb button{flex:1 1 0;max-width:44px;min-width:0;height:50px;border-radius:7px;background:var(--surface-2,#e5e8e6);color:var(--fg);font:700 1rem/1 var(--f-body);touch-action:manipulation;display:grid;place-items:center;padding:0}
.og-kb button.w{max-width:66px;flex-grow:1.6;font-size:.72rem}
.og-kb button.s0,.og-kb button.s1,.og-kb button.s2{color:#fff}
.og-kb button.s0{background:var(--og-n)}.og-kb button.s1{background:var(--og-y)}.og-kb button.s2{background:var(--og-g)}
.og-kb button:disabled{opacity:.5}
@media (max-height:680px){.og-kb button{height:42px}.og-ps{padding-bottom:4px}.og-p{padding:5px 8px}}
.og-end{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);width:min(92%,380px);background:var(--surface);border-radius:20px;padding:16px;box-shadow:var(--k6-e3,0 10px 30px rgba(0,0,0,.25));text-align:center;z-index:2;animation:ogUp .3s ease-out both}
@keyframes ogUp{from{opacity:0;transform:translate(-50%,16px)}}
.og-end h3{font:600 1.2rem/1.2 var(--f-display);margin:0 0 4px}
.og-end p{margin:0 0 12px;color:var(--muted);font-size:.88rem}
.og-end .og-w{font:700 1.3rem/1 var(--f-mono);letter-spacing:.18em;margin:2px 0 10px;color:var(--fg)}
.og-end .btns{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
.og-end .x{position:absolute;top:6px;right:6px;width:32px;height:32px;border-radius:10px;display:grid;place-items:center;color:var(--muted)}
.og-end .x .og-ic{width:1rem;height:1rem}
.og-wait{text-align:center;padding:20px;max-width:340px}
.og-wait p{color:var(--muted);font-size:.9rem;margin:6px 0 14px}
.og-msg{text-align:center;color:var(--muted);padding:30px 20px}
@media (min-width:900px){.og-ps{max-width:640px;margin:0 auto;width:100%}.og-kb{width:520px;margin:0 auto}}
.og-reduce *{animation:none!important;transition:none!important}
`;document.head.appendChild(el)}

function pchip(d,k){const u=(d.u||[])[k];const t=d.t;const on=d.st==="play"&&!resOf(d)&&(t==="kel"?(u&&!kelOf(d,u).done):replay(t,d).turn===k)&&u;
 const pc=k===(d.f===1?1:0)?"var(--og-a)":"var(--og-b)";
 let sub="",mk="";
 if(t==="xox"){mk=`<span class="og-mk">${SV(k===(d.f===1?1:0)?ICX:ICO)}</span>`}
 else if(t==="c4"){mk=`<span class="og-mk"><span class="og-dot"></span></span>`}
 if(!u)return`<div class="og-p"><span class="og-pn"><b>Bekleniyor</b><small>Rakip yok</small></span></div>`;
 if(t==="kel"){const s=kelOf(d,u);sub=s.found?`${s.n}. denemede buldu`:s.done?"Bulamadı":`${s.n}/${KMAX} deneme`}
 else sub=u===S.uid?"Sen":"@"+(P(u).username||"");
 return`<div class="og-p${on?" on":""}" style="--pc:${t==="kel"?"var(--accent)":pc}">${avatar(u,34,{click:false,ring:false,online:false})}<span class="og-pn"><b>${esc(u===S.uid?"Sen":nm(u))}</b><small>${esc(sub)}</small></span>${mk}</div>`}

function shell(){const r=st.root;if(!r)return;
 r.innerHTML=`<div class="og-hd"><button class="og-ib" data-og="close" aria-label="Kapat">${I("back")}</button><div class="og-t"><small id="ogSub"></small><b id="ogTi"></b></div><span id="ogHx"></span></div>
 <div class="og-ps" id="ogPs"></div><div class="og-st" id="ogSt" role="status" aria-live="polite"></div><div id="ogBd" style="flex:1 1 auto;min-height:0;display:flex;flex-direction:column;position:relative"></div>`}

function statusText(d){const res=resOf(d);const i=meIdx(d);
 if(d.end&&d.end.why==="iptal")return["İptal edildi",false];
 if(d.st==="wait")return["Rakip bekleniyor",false];
 if(res){if(res.w<0)return["Berabere",false];const wu=d.u[res.w];return[wu===S.uid?"Kazandın":`${nm(wu)} kazandı`,wu===S.uid]}
 if(d.t==="kel"){if(i<0)return["İzliyorsun",false];const s=kelOf(d,S.uid);if(s.done)return[s.found?"Buldun, rakip bekleniyor":"Hakların bitti, rakip bekleniyor",false];return[`${s.n+1}. deneme`,true]}
 const rp=replay(d.t,d);if(i<0)return[`${nm(d.u[rp.turn])} oynuyor`,false];
 return rp.turn===i?["Sıra sende",true]:[`${nm(d.u[rp.turn])} düşünüyor`,false]}

function draw(){const d=st.d,r=st.root;if(!r)return;r.classList.toggle("og-reduce",reduce());
 if(!d){$("#ogTi",r).textContent="Oyun";$("#ogSub",r).textContent="";$("#ogPs",r).innerHTML="";$("#ogSt",r).textContent="";
  $("#ogBd",r).innerHTML=`<div class="og-msg">${st.gone?"Bu oyun bulunamadı. Silinmiş olabilir.":"Yükleniyor"}</div>`;$("#ogHx",r).innerHTML="";return}
 $("#ogTi",r).textContent=TN[d.t]||"Oyun";$("#ogSub",r).textContent=d.gk?"Grup oyunu":"Sohbet oyunu";
 const res=resOf(d);const i=meIdx(d);
 $("#ogHx",r).innerHTML=i>=0&&d.st==="play"&&!res?`<button class="og-pes" data-og="pes">Pes et</button>`:"";
 $("#ogPs",r).innerHTML=pchip(d,0)+pchip(d,1);
 const[t,me]=statusText(d);const se=$("#ogSt",r);se.textContent=t;se.classList.toggle("me",!!me);
 const bd=$("#ogBd",r);
 if(d.end&&d.end.why==="iptal"){bd.innerHTML=`<div class="og-bw"><div class="og-wait">${SV(X.icons[d.t]||"","")}<h3>${esc(TN[d.t])}</h3><p>Bu oyun iptal edildi.</p></div></div>`;return}
 if(d.st==="wait"){const host=d.by===S.uid;
  bd.innerHTML=`<div class="og-bw"><div class="og-wait">${SV(X.icons[d.t]||"","")}<h3>${esc(TN[d.t])}</h3><p>${host?"Grupta Oyna'ya ilk dokunan kişi rakibin olur.":`${esc(nm(d.by))} bir rakip arıyor.`}</p>${host?`<button class="btn ghost" data-og="cancel">İptal et</button>`:`<button class="btn" data-og="join">Oyuna katıl</button>`}</div></div>`;return}
 if(d.t==="kel")drawKel(bd,d,res);else drawGrid(bd,d,res);
 endCard(bd,d,res)}

function drawGrid(bd,d,res){const t=d.t;const rp=replay(t,d);const i=meIdx(d);const my=i>=0&&d.st==="play"&&!res&&rp.turn===i;
 const wl=new Set(res&&res.line||[]);const fresh=rp.n!==st.lastN&&st.lastN>=0&&rp.last>=0;const first=d.f===1?1:0;
 let h="";
 if(t==="xox"){h=`<div class="og-x" id="ogBoard">`;for(let c=0;c<9;c++){const v=rp.b[c];const pcls=v<0?"":(v===first?"p0":"p1");
   h+=`<button data-oc="${c}" class="${my&&v<0?"can":""} ${wl.has(c)?"wl":""}" style="--pc:${v===first?"var(--og-a)":"var(--og-b)"}" ${my&&v<0?"":"disabled"} aria-label="${v<0?"Boş kare":v===first?"X":"O"} ${c+1}">${v<0?"":SV(v===first?ICX:ICO,pcls+(fresh&&c===rp.last?" nw":""))}</button>`}
  h+="</div>"}
 else{h=`<div class="og-c" id="ogBoard">`;for(let c=0;c<CW*CH;c++){const v=rp.b[c];const row=(c/CW)|0;
   h+=`<span class="k">${v<0?"":`<i class="${v===first?"p0":"p1"}${wl.has(c)?" wl":""}${fresh&&c===rp.last?" nw":""}" style="--dy:${-(row+1)*118}%;--dd:${(.18+.05*row).toFixed(2)}s"></i>`}</span>`}
  h+=`<div class="cols">${Array.from({length:CW},(_,c)=>{const ok=my&&c4Drop(rp.b,c)>=0;return`<button data-oc="${c}" class="${ok?"can":""}" ${ok?"":"disabled"} aria-label="${c+1}. sütun"></button>`}).join("")}</div></div>`}
 bd.innerHTML=`<div class="og-bw">${h}</div>`;st.lastN=rp.n}

const KROWS=[["e","r","t","y","u","ı","o","p","ğ","ü"],["a","s","d","f","g","h","j","k","l","ş","i"],["ENTER","z","c","v","b","n","m","ö","ç","DEL"]];
function drawKel(bd,d,res){const i=meIdx(d);const a=decW(d.w);const meU=i>=0?S.uid:d.u[0];const s=kelOf(d,meU);const opp=i>=0?oppOf(d):d.u[1];
 const can=i>=0&&d.st==="play"&&!res&&!s.done;
 const kst={};const rows=[];
 for(let r=0;r<KMAX;r++){const g=s.gs[r];let cells="";
  if(g){const sc=score(g,a);const L=Array.from(g);const rv=r===s.n-1&&st.revealN!==s.n;
   for(let c=0;c<KLEN;c++){const k=L[c];kst[k]=Math.max(kst[k]??-1,sc[c]);cells+=`<span class="og-kt s${sc[c]}${rv?" rv":""}" style="--i:${c}">${i>=0||res?esc(up(k)):""}</span>`}}
  else if(can&&r===s.n){const L=Array.from(st.kel);for(let c=0;c<KLEN;c++)cells+=`<span class="og-kt${L[c]?" f":""}">${L[c]?esc(up(L[c])):""}</span>`}
  else for(let c=0;c<KLEN;c++)cells+=`<span class="og-kt"></span>`;
  rows.push(`<div class="og-kr${can&&r===s.n&&st.shake?" sh":""}">${cells}</div>`)}
 st.revealN=s.n;st.shake=0;
 const mini=u=>{const o=kelOf(d,u);let h='<div class="og-mini" aria-hidden="true">';for(let r=0;r<KMAX;r++){h+="<span>";const g=o.gs[r];const sc=g?score(g,a):null;for(let c=0;c<KLEN;c++)h+=`<i${sc?` class="s${sc[c]}"`:""}></i>`;h+="</span>"}return h+"</div>"};
 const opTxt=opp?`${esc(i>=0?nm(opp):nm(opp))}: ${(()=>{const o=kelOf(d,opp);return o.found?`${o.n}. denemede buldu`:o.done?"bulamadı":`${o.n} deneme`})()}`:"";
 const kb=i>=0?`<div class="og-kb" id="ogKb">${KROWS.map(row=>`<div>${row.map(k=>k==="ENTER"?`<button class="w" data-ok="ENTER" ${can?"":"disabled"}>GİR</button>`:k==="DEL"?`<button class="w" data-ok="DEL" aria-label="Sil" ${can?"":"disabled"}>${I("back")}</button>`:`<button data-ok="${k}" class="${kst[k]!=null?"s"+kst[k]:""}" ${can?"":"disabled"}>${esc(up(k))}</button>`).join("")}</div>`).join("")}</div>`:"";
 bd.innerHTML=`<div class="og-kw"><div class="og-op">${i<0?`${mini(d.u[0])}<span>${esc(nm(d.u[0]))}</span>`:""}${opp?mini(opp):""}<span>${opTxt}</span></div><div class="og-kg" id="ogBoard">${rows.join("")}</div></div>${kb}`}

function endCard(bd,d,res){if(!res||st.endHid===st.gid)return;const i=meIdx(d);const wu=res.w>=0?d.u[res.w]:null;
 let h3,p;
 if(res.w<0){h3="Berabere";p=d.t==="kel"?"İkiniz de aynı sonucu aldınız.":"Tahta doldu, kazanan yok."}
 else if(wu===S.uid){h3="Kazandın";p=res.why==="pes"?`${nm(d.u[1-res.w])} pes etti.`:res.why==="sure"?"Aynı denemede buldunuz, sen daha hızlıydın.":d.t==="kel"?`${kelOf(d,S.uid).n}. denemede buldun.`:"Tebrikler!"}
 else if(i>=0){h3="Kaybettin";p=res.why==="pes"?"Pes ettin.":res.why==="sure"?`Aynı denemede buldunuz, ${nm(wu)} daha hızlıydı.`:`${nm(wu)} kazandı.`}
 else{h3=`${nm(wu)} kazandı`;p=res.why==="pes"?`${nm(d.u[1-res.w])} pes etti.`:""}
 const w=d.t==="kel"?`<div class="og-w">${esc(up(decW(d.w)))}</div>`:"";
 const re=i>=0?(d.re?`<button class="btn" data-og="re">${I("rotate")}Rövanşa git</button>`:`<button class="btn" data-og="re">${I("rotate")}Rövanş</button>`):"";
 bd.insertAdjacentHTML("beforeend",`<div class="og-end" role="dialog" aria-label="${esc(h3)}"><button class="x" data-og="hide" aria-label="Tahtaya bak">${SV(ICX)}</button><h3>${esc(h3)}</h3>${p?`<p>${esc(p)}</p>`:""}${w}<div class="btns">${re}<button class="btn ghost" data-og="close">Sohbete dön</button></div></div>`)}

/* ---------- eylemler ---------- */
/* yerel iyimser güncelleme: DB.update gibi iç içe nesneleri birleştirir, dizileri üzerine yazar */
function merge(a,b){const o={...a};for(const[k,v]of Object.entries(b)){if(v&&typeof v==="object"&&!Array.isArray(v)&&o[k]&&typeof o[k]==="object"&&!Array.isArray(o[k]))o[k]=merge(o[k],v);else o[k]=v}return o}
async function apply(patch,{msg}={}){const prev=st.d;const gid=st.gid;const nd=merge(prev||{},patch);st.d=nd;draw();
 const ok=await write(()=>DB.update(gp(gid),patch));
 if(!ok){if(st.gid===gid){st.d=prev;draw()}return false}
 if(msg)sendResult(nd,gid);return true}

async function move(v){const d=st.d;if(!d||d.st!=="play"||d.t==="kel")return;const i=meIdx(d);const rp=replay(d.t,d);if(i<0||rp.res||rp.turn!==i)return;
 const m=[...(Array.isArray(d.m)?d.m.slice(0,rp.n):[]),v];const nx=replay(d.t,{...d,m});if(nx.bad||nx.n!==m.length)return;
 vib(8);const patch={m,up:now()};let fin=false;if(nx.res){fin=true;patch.st="done";patch.end={w:nx.res.w>=0?d.u[nx.res.w]:"",why:nx.res.why};patch.rm=1}
 await apply(patch,{msg:fin})}

async function guess(){const d=st.d;if(!d||d.t!=="kel"||d.st!=="play")return;const i=meIdx(d);if(i<0)return;const s=kelOf(d,S.uid);if(s.done||resOf(d))return;
 const w=st.kel;const a=decW(d.w);
 if(Array.from(w).length<KLEN){shake("Kelime 5 harf olmalı");return}
 if(w!==a&&!okWord(w)){shake("Bu kelime listede yok");return}
 st.kel="";const gs=[...s.gs,w];const patch={g:{[S.uid]:gs},up:now()};const nd=merge(d,{g:{[S.uid]:gs}});
 if(w===a||gs.length>=KMAX){patch.ft={[S.uid]:now()};nd.ft={...(d.ft||{}),[S.uid]:patch.ft[S.uid]}}
 const r=kelRes(nd);let fin=false;if(r){fin=true;patch.st="done";patch.end={w:r.w>=0?d.u[r.w]:"",why:r.why};patch.rm=1}
 vib(8);await apply(patch,{msg:fin})}
function shake(t){st.shake=1;toast(t);draw()}

function kelKey(k){const d=st.d;if(!d||d.t!=="kel")return;const s=kelOf(d,S.uid);if(meIdx(d)<0||s.done||resOf(d)||d.st!=="play")return;
 if(k==="ENTER")return guess();
 if(k==="DEL"){st.kel=Array.from(st.kel).slice(0,-1).join("");draw();return}
 if(Array.from(st.kel).length>=KLEN)return;st.kel+=k;draw()}

async function resign(){const d=st.d;if(!d||meIdx(d)<0||d.st!=="play")return;
 const ok=await new Promise(res=>{try{dialog("Pes et?","Oyunu rakibine bırakırsın.",[{label:"Vazgeç",cls:"ghost",fn:()=>res(false)},{label:"Pes et",cls:"danger",fn:()=>res(true)}])}catch{res(confirm("Pes et?"))}});
 if(!ok||!st.d||st.d.st!=="play")return;const opp=oppOf(st.d);
 await apply({rs:S.uid,st:"done",end:{w:opp||"",why:"pes"},rm:1,up:now()},{msg:true})}

function resultText(d){const res=resOf(d);const n=TN[d.t];if(!res)return"";
 if(res.why==="pes")return`${n}: ${nm(d.u[1-res.w])} pes etti, ${nm(d.u[res.w])} kazandı.`;
 const word=d.t==="kel"?` Kelime: ${up(decW(d.w))}`:"";
 if(res.w<0)return`${n}: berabere bitti.${word}`;
 const wu=d.u[res.w];if(d.t==="kel"){const o=kelOf(d,wu);return`${n}: ${nm(wu)} ${o.n}. denemede buldu ve kazandı.${word}`}
 return`${n}: ${nm(wu)} kazandı.`}
async function sendResult(d,gid){const key=keyFor(d);if(!key)return;const text=resultText(d);if(!text)return;
 try{await sendMessage(key,{text,oyun:{t:d.t,gid,r:1,u:(d.u||[]).slice(0,2)}})}catch(e){console.warn(e)}}

/* Kelime'de karar sonradan (rakibin yazmasıyla) belli olduysa: önce u[0], o yoksa 4 sn sonra diğeri kapatır */
function closeCheck(){const d=st.d;if(!d||d.st!=="play"||meIdx(d)<0)return;const r=resOf(d);if(!r)return;if(st.closing===st.gid)return;st.closing=st.gid;const gid=st.gid;
 setTimeout(async()=>{if(st.gid!==gid)return;let cur=null;try{cur=await DB.get(gp(gid))}catch{}if(!cur||cur.st!=="play")return;const r2=resOf(cur);if(!r2)return;
  st.d={...cur};await apply({st:"done",end:{w:r2.w>=0?cur.u[r2.w]:"",why:r2.why},rm:1,up:now()},{msg:true})},meIdx(d)===0?500:4000)}

async function join(){const d=st.d;if(!d||d.st!=="wait"||!guard())return;if(d.by===S.uid)return;
 let cur=null;try{cur=await DB.get(gp(st.gid))}catch{}if(!cur||cur.st!=="wait"){toast("Başka biri katıldı.");return}
 const patch={u:[cur.u[0],S.uid],st:"play",up:now()};if(cur.t==="kel")patch.s0={[S.uid]:now()};
 if(await apply(patch)){let chk=null;try{chk=await DB.get(gp(st.gid))}catch{}if(chk&&Array.isArray(chk.u)&&chk.u[1]!==S.uid){st.d=chk;draw();toast("Başka biri senden önce katıldı.")}}}

async function cancel(){const d=st.d;if(!d||d.by!==S.uid||d.st!=="wait")return;await apply({st:"done",end:{w:"",why:"iptal"},up:now()});close()}

async function rematch(gid){gid=gid||st.gid;let d=null;try{d=await DB.get(gp(gid))}catch{}if(!d||!d.og||!Array.isArray(d.u)||d.u.indexOf(S.uid)<0){toast("Rövanş başlatılamadı.");return}
 if(d.re){X.open(d.re);return}
 if(!guard())return;const opp=d.u[1-d.u.indexOf(S.uid)];if(!opp){toast("Rövanş başlatılamadı.");return}
 const prevFirst=d.u[d.f===1?1:0];const u=[S.uid,opp];const f=u[0]===prevFirst?1:0;
 const ng=await create(d.t,{key:d.gk||"u:"+opp,u,f,ch:d.ch,gk:d.gk||"",re:true});if(!ng)return;
 await write(()=>DB.update(gp(gid),{re:ng,up:now()}),{quiet:true});X.open(ng)}

async function create(t,{key,u,f=0,ch,gk,re}){const gid="og-"+rid();const at=now();
 const doc={og:1,t,by:S.uid,u,ch:ch||"",gk:gk||"",st:u.length>=2?"play":"wait",at,up:at,f};
 if(t==="kel"){doc.w=encW(ANSL[Math.floor(Math.random()*ANSL.length)]);doc.g={};doc.s0={[S.uid]:at};doc.ft={}}else doc.m=[];
 if(!await write(()=>DB.set(gp(gid),doc)))return null;
 const n=TN[t];const text=re?`Rövanş! ${n}`:gk?`${n} oynamak isteyen? İlk dokunan rakibim olur.`:t==="kel"?`${n} yarışı: aynı kelimeyi kim daha az denemede bulacak?`:`${n} oynayalım mı?`;
 const ok=await sendMessage(key,{text,oyun:{t,gid}});if(!ok){try{await DB.del(gp(gid))}catch{}return null}
 return gid}

X.invite=async function(key,t){if(!TN[t]||!guard())return;let k;try{k=keyInfo(key)}catch{return}if(!k||(k.type!=="dm"&&k.type!=="group"))return;
 const u=k.type==="dm"?[S.uid,k.uid]:[S.uid];const gid=await create(t,{key,u,f:0,ch:k.cid,gk:k.type==="group"?key:""});if(gid)X.open(gid)};
X.rematch=rematch;

/* ---------- katman ---------- */
function close(){closeLayer("oyun")}
function stop(){if(st.un){try{st.un()}catch{}}st.un=null;st.layer=null;st.root=null;st.d=null;st.gid=null;removeEventListener("keydown",onKey,true)}
function onKey(e){if(!st.layer||!st.d||st.d.t!=="kel")return;const ls=$$("#overlay .layer");if(ls[ls.length-1]!==st.layer)return;
 const tg=e.target;if(tg&&(tg.tagName==="INPUT"||tg.tagName==="TEXTAREA"||tg.isContentEditable))return;if(e.ctrlKey||e.metaKey||e.altKey)return;
 let k=e.key;if(k==="Enter")k="ENTER";else if(k==="Backspace")k="DEL";else if(typeof k==="string"&&Array.from(k).length===1){k=lo(k);if(!/^[a-zçğıöşüi]$/.test(k)||"qwx".includes(k))return}else return;
 e.preventDefault();e.stopPropagation();kelKey(k)}

function onData(doc){if(!st.layer)return;if(!doc||!doc.og){st.gone=!doc;st.d=null;draw();return}
 const was=st.d;st.d=doc;st.gone=false;
 if(doc.t==="kel"&&meIdx(doc)>=0&&doc.st==="play"&&!(doc.s0&&doc.s0[S.uid])){write(()=>DB.update(gp(st.gid),{s0:{[S.uid]:now()}}),{quiet:true})}
 if(was&&was.st!=="done"&&doc.st==="done"&&meIdx(doc)>=0)vib(14);
 draw();closeCheck()}

X.open=function(gid){if(!S.authed||typeof gid!=="string"||!/^og-[a-z0-9]{4,30}$/.test(gid))return;css();
 if(st.layer&&document.body.contains(st.layer)&&st.gid===gid)return;
 if(st.layer)closeLayer("oyun");
 const l=openLayer("oyun",`<div class="og" id="og"></div>`,{noScrim:true,onClose:stop});
 st.layer=l;st.root=$("#og",l);st.gid=gid;st.d=null;st.kel="";st.lastN=-1;st.revealN=-2;st.closing=0;st.endHid=null;st.gone=false;
 shell();draw();addEventListener("keydown",onKey,true);
 st.root.addEventListener("click",e=>{const b=e.target.closest("button");if(!b||!st.root.contains(b))return;
  if(b.dataset.oc!=null){move(+b.dataset.oc);return}
  if(b.dataset.ok){kelKey(b.dataset.ok);return}
  const a=b.dataset.og;if(a==="close")close();else if(a==="pes")resign();else if(a==="join")join();else if(a==="cancel")cancel();
  else if(a==="re")rematch(st.gid);else if(a==="hide"){st.endHid=st.gid;draw()}});
 /* revealN=-2: açılışta son tahmin yeniden çevrilmez */
 st.un=DB.watchDoc(gp(gid),doc=>{if(st.revealN===-2&&doc&&doc.t==="kel")st.revealN=kelOf(doc,S.uid).n;onData(doc)})};
X.state=()=>st;
})();
