// Geçici deneme: Commons ve diğer video kaynaklarının gerçek yanıtları (yayından önce silinecek)
const UA={"User-Agent":"Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36","Origin":"https://kadrajsosyalmedya.github.io"};
async function j(u){const r=await fetch(u,{headers:UA});const t=await r.text();return{st:r.status,acao:r.headers.get("access-control-allow-origin"),t}}
async function head(u){try{const r=await fetch(u,{headers:{...UA,Range:"bytes=0-1"}});return r.status+" "+r.headers.get("content-type")+" acao="+r.headers.get("access-control-allow-origin")}catch(e){return"ERR "+e.message}}
for(const cat of ["Videos of cats","Time-lapse videos","Videos of dogs"]){
 const u="https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2&origin=*&generator=categorymembers&gcmtype=file&gcmlimit=6&gcmtitle="+encodeURIComponent("Category:"+cat)+"&prop=videoinfo&viprop=url|size|mime|extmetadata|derivatives&viurlwidth=480&viextmetadatafilter=Artist|LicenseShortName";
 const r=await j(u);console.log("\n=== "+cat+" status",r.st,"acao",r.acao,"len",r.t.length);
 let d;try{d=JSON.parse(r.t)}catch{console.log(r.t.slice(0,500));continue}
 const ps=(d.query&&d.query.pages)||[];console.log("pages",ps.length, d.warnings?JSON.stringify(d.warnings).slice(0,300):"");
 for(const p of ps.slice(0,3)){const v=(p.videoinfo||p.imageinfo||[])[0]||{};console.log("-",p.title,"keys",Object.keys(v).join(","),"dur",v.duration,"mime",v.mime,"wh",v.width,v.height);
  console.log("  url",v.url,"->",await head(v.url));console.log("  thumb",v.thumburl);
  for(const dv of (v.derivatives||[]).slice(0,8)){console.log("  der",JSON.stringify(dv).slice(0,220));}
  const w=(v.derivatives||[]).find(x=>/webm/.test(x.type||"")&&x.height<=480);if(w)console.log("  derHEAD",await head(w.src));
  const m=(v.derivatives||[]).find(x=>/mp4/.test(x.type||""));if(m)console.log("  mp4HEAD",await head(m.src));}
}
for(const u of ["https://www.reddit.com/r/aww/top.json?t=week&limit=5","https://api.reddit.com/r/aww/top?t=week&limit=5","https://archive.org/advancedsearch.php?q=mediatype%3Amovies&fl%5B%5D=identifier&rows=3&output=json","https://api.dailymotion.com/videos?limit=2&fields=id,title","https://api.pexels.com/videos/popular?per_page=1"]){
 try{const r=await j(u);console.log("\n###",u,"status",r.st,"acao",r.acao,"\n",r.t.slice(0,400))}catch(e){console.log("###",u,"ERR",e.message)}}
