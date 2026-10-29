// Kadraj 6.8.20 Android bildirimi (Firebase Cloud Messaging HTTP v1) testleri: node test/fcm-test.mjs  (hazır paket: BUNDLE=hazir/kadraj-ai.js)
import http from "node:http";
const WT=new URL("../src/",import.meta.url).href;
const W=(await import(process.env.BUNDLE?new URL("../"+process.env.BUNDLE,import.meta.url).href:(WT+"index.js"))).default;
const P=await import(WT+"push.js");const {b64u,unb64u}=P;
const te=new TextEncoder(),td=new TextDecoder();
const ok=(c,m)=>{console.log((c?"PASS ":"FAIL ")+m);if(!c)process.exitCode=1};
// Firebase giriş jetonu için sahte JWKS
const kp=await crypto.subtle.generateKey({name:"RSASSA-PKCS1-v1_5",modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:"SHA-256"},true,["sign","verify"]);
const pubj=await crypto.subtle.exportKey("jwk",kp.publicKey);
async function jwt(){const now=Math.floor(Date.now()/1000);const h=b64u(te.encode(JSON.stringify({alg:"RS256",kid:"k1"})));const p=b64u(te.encode(JSON.stringify({aud:"kadraj-6f1e0",iss:"https://securetoken.google.com/kadraj-6f1e0",sub:"u1",iat:now-10,exp:now+3600})));const sig=await crypto.subtle.sign("RSASSA-PKCS1-v1_5",kp.privateKey,te.encode(h+"."+p));return h+"."+p+"."+b64u(new Uint8Array(sig))}
const srv=http.createServer((q,r)=>{r.setHeader("content-type","application/json");r.end(JSON.stringify({keys:[{...pubj,kid:"k1",alg:"RS256",use:"sig"}]}))});
await new Promise(r=>srv.listen(0,r));const port=srv.address().port;
// sahte hizmet hesabı (gerçek gibi PKCS8 PEM)
const sak=await crypto.subtle.generateKey({name:"RSASSA-PKCS1-v1_5",modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:"SHA-256"},true,["sign","verify"]);
const pk8=new Uint8Array(await crypto.subtle.exportKey("pkcs8",sak.privateKey));const b64=Buffer.from(pk8).toString("base64").match(/.{1,64}/g).join("\n");
const SA={type:"service_account",project_id:"kadraj-6f1e0",private_key_id:"x",private_key:"-----BEGIN PRIVATE KEY-----\n"+b64+"\n-----END PRIVATE KEY-----\n",client_email:"firebase-adminsdk-x@kadraj-6f1e0.iam.gserviceaccount.com"};
const env={JWKS_URL:`http://127.0.0.1:${port}/jwks`,ALLOWED_ORIGINS:"https://kadrajsosyalmedya.github.io",FIREBASE_PROJECT:"kadraj-6f1e0",FCM_SA:JSON.stringify(SA),PUSH_DAILY_LIMIT:"50"};
const O="https://kadrajsosyalmedya.github.io";
// Google uçlarını yakala
const realFetch=globalThis.fetch;let oauth=[],sends=[];let fcmStatus=()=>[200,'{"name":"projects/kadraj-6f1e0/messages/1"}'];
globalThis.fetch=async(u,o={})=>{const url=typeof u==="string"?u:u.url;
 if(url==="https://oauth2.googleapis.com/token"){oauth.push(String(o.body));return new Response(JSON.stringify({access_token:"ya29.sahte",expires_in:3599,token_type:"Bearer"}),{status:200,headers:{"content-type":"application/json"}})}
 if(url.startsWith("https://fcm.googleapis.com/v1/")){const b=JSON.parse(o.body);sends.push({url,auth:o.headers.Authorization,b});const [st,tx]=fcmStatus(b.message.token);return new Response(tx,{status:st})}
 return realFetch(u,o)};
const call=async(path,{method="POST",body,e=env}={})=>{const r=await W.fetch(new Request("https://w.example"+path,{method,headers:{Origin:O,"Content-Type":"application/json",Authorization:"Bearer "+await jwt()},...(body?{body:JSON.stringify(body)}:{})}),e);let j=null;try{j=await r.json()}catch{}return {status:r.status,json:j}};
const TOK="fcmtok_"+"a".repeat(140);
// 1) sağlık
let r=await call("/health",{method:"GET"});ok(r.status===200&&r.json.fcm===true&&r.json.push===false,"/health fcm:true (VAPID yokken push:false)");
// 2) VAPID olmadan yalnızca FCM ile gönderim
r=await call("/push",{body:{subscriptions:[{fcm:TOK}],payload:{title:"Ali",body:"selam",key:"u:abc",tag:"m-dm-1",kind:"msg",cid:"dm-1",mid:"m1"}}});
ok(r.status===200&&r.json.ok===true&&r.json.results[0].status===200,"VAPID olmadan Android'e gönderildi");
ok(oauth.length===1,"bir kez erişim jetonu alındı");
const [ah,ap,as]=decodeURIComponent(oauth[0].split("assertion=")[1]).split(".");const claims=JSON.parse(td.decode(unb64u(ap)));
const vk=await crypto.subtle.importKey("jwk",await crypto.subtle.exportKey("jwk",sak.publicKey),{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
ok(await crypto.subtle.verify("RSASSA-PKCS1-v1_5",vk,unb64u(as),te.encode(ah+"."+ap)),"hizmet hesabı imzası (RS256) doğrulanıyor");
ok(claims.iss===SA.client_email&&claims.aud==="https://oauth2.googleapis.com/token"&&/firebase\.messaging/.test(claims.scope)&&claims.exp-claims.iat===3600,"jeton istekleri doğru (iss, aud, scope, 1 saat)");
ok(/grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer/.test(oauth[0]),"grant_type jwt-bearer");
const m=sends[0];ok(m.url==="https://fcm.googleapis.com/v1/projects/kadraj-6f1e0/messages:send"&&m.auth==="Bearer ya29.sahte","FCM v1 adresi ve yetki");
const an=m.b.message.android;ok(m.b.message.token===TOK&&an.priority==="high"&&an.notification.title==="Ali"&&an.notification.body==="selam"&&an.notification.tag==="m-dm-1"&&an.notification.channel_id==="kadraj"&&an.notification.icon==="ic_stat_kadraj","Android bildirimi: başlık, metin, aynı sohbet etiketi, kanal, simge");
const d=m.b.message.data;ok(d.key==="u:abc"&&d.cid==="dm-1"&&d.mid==="m1"&&d.from==="u1"&&Object.values(d).every(v=>typeof v==="string"),"data: dokununca açılacak yer (key) ve gönderen Worker'dan, hepsi metin");
// 3) ikinci gönderim jetonu yeniden kullanır; karışık liste
r=await call("/push",{body:{subscriptions:[{fcm:TOK},{fcm:"kisa"}],payload:{title:"B",body:"x",kind:"like",key:"post:p1"}}});
ok(oauth.length===1,"erişim jetonu bellekte, yeniden alınmadı");
ok(r.json.results[1].error==="invalid"&&sends[1].b.message.android.priority==="normal","geçersiz jeton reddedildi, beğeni normal öncelik");
// 4) kaldırılmış uygulama: gone
fcmStatus=()=>[404,'{"error":{"status":"NOT_FOUND","details":[{"errorCode":"UNREGISTERED"}]}}'];
r=await call("/push",{body:{subscriptions:[{fcm:TOK}],payload:{title:"A",body:"b"}}});ok(r.json.results[0].gone===true,"404 UNREGISTERED → gone");
fcmStatus=()=>[400,'{"error":{"code":400,"message":"The registration token is not a valid FCM registration token","status":"INVALID_ARGUMENT"}}'];
r=await call("/push",{body:{subscriptions:[{fcm:TOK}],payload:{title:"A",body:"b"}}});ok(r.json.results[0].gone===true,"400 geçersiz jeton → gone");
fcmStatus=()=>[500,'{}'];r=await call("/push",{body:{subscriptions:[{fcm:TOK}],payload:{title:"A",body:"b"}}});ok(r.json.results[0].gone===false&&r.json.ok===false,"500'de silinmez");
// 5) FCM_SA yoksa
const e2={...env,FCM_SA:"",VAPID_PUBLIC_KEY:"",VAPID_PRIVATE_KEY:""};r=await call("/push",{body:{subscriptions:[{fcm:TOK}],payload:{}},e:e2});ok(r.status===501,"ne VAPID ne FCM_SA: 501");
const e3={...env,FCM_SA:"{bozuk"};r=await call("/health",{method:"GET",e:e3});ok(r.json.fcm===false,"bozuk FCM_SA → fcm:false");
srv.close();console.log(process.exitCode?"\nBAZI TESTLER KALDI":"\nhepsi geçti");
