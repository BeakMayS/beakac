// AC/DC Bilişim ortak demo sunucusu — Node.js built-ins only.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3017);
const HOST = process.env.HOST || '0.0.0.0';
const ADMIN_USER = process.env.ACDC_ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ACDC_ADMIN_PASS || 'acdc1439';
const LEGACY_DATA_DIR = path.join(ROOT, 'data');
const PUBLIC_ASSET_DIR = path.join(ROOT, 'public', 'assets');
const GALLERY_DIR = path.join(PUBLIC_ASSET_DIR, 'gallery');
fs.mkdirSync(GALLERY_DIR, {recursive:true});
// GoDaddy recommends public/assets for files that must survive deployments.
// Keep app state in a plainly named subdirectory and block all HTTP access to it.
const DATA_DIR = process.env.ACDC_DATA_DIR || path.join(PUBLIC_ASSET_DIR, 'acdc-data');
const REQUESTS_FILE = path.join(DATA_DIR, 'requests.json');
const SITE_FILE = path.join(DATA_DIR, 'site-state.json');
const sessions = new Map();
const TYPES = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.mp4':'video/mp4','.webm':'video/webm','.mov':'video/quicktime','.svg':'image/svg+xml','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8'};
fs.mkdirSync(DATA_DIR, {recursive:true});
// One-time migration from prior storage locations. Prefer existing production state in
// public/assets/.acdc-data, then fall back to the ZIP's legacy data/ directory. Never overwrite target data.
const PRIOR_DATA_DIR = path.join(PUBLIC_ASSET_DIR, '.acdc-data');
for (const name of ['requests.json','site-state.json']) {
 const target=path.join(DATA_DIR,name);
 const candidates=[path.join(PRIOR_DATA_DIR,name),path.join(LEGACY_DATA_DIR,name)];
 if(!fs.existsSync(target)) { for (const legacy of candidates) { if(fs.existsSync(legacy)) { try { fs.copyFileSync(legacy,target); console.log('Eski veri taşındı:',name,'->',DATA_DIR); break; } catch(e) { console.error('Eski veri taşınamadı:',name,e.message); } } } }
}
if (!fs.existsSync(REQUESTS_FILE)) fs.writeFileSync(REQUESTS_FILE, '[]', 'utf8');
if (!fs.existsSync(SITE_FILE)) fs.writeFileSync(SITE_FILE, '{}', 'utf8');
// Remove legacy client-side credentials from the public site state.
try { const initial=JSON.parse(fs.readFileSync(SITE_FILE,'utf8')); if(initial && typeof initial==='object' && 'credentials' in initial) { delete initial.credentials; writeJson(SITE_FILE,initial); } } catch {}
function readJson(file, fallback){try{return JSON.parse(fs.readFileSync(file,'utf8'))}catch{return fallback}}
function writeJson(file, value){const tmp=file+'.tmp';fs.writeFileSync(tmp,JSON.stringify(value,null,2),'utf8');fs.renameSync(tmp,file)}
function readRequests(){return readJson(REQUESTS_FILE,[])}
function writeRequests(rows){writeJson(REQUESTS_FILE,rows)}
function send(res,status,obj,extra={}){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...extra});res.end(JSON.stringify(obj))}
function readBody(req,limit=100*1024*1024){return new Promise((resolve,reject)=>{let data='',failed=false;req.on('data',chunk=>{if(failed)return;data+=chunk.toString('utf8');if(Buffer.byteLength(data,'utf8')>limit){failed=true;reject(new Error('İstek çok büyük. Fotoğrafları daha küçük boyutla yükleyin.'));req.pause()}});req.on('end',()=>{if(failed)return;try{resolve(data?JSON.parse(data):{})}catch{reject(new Error('Geçersiz JSON'))}});req.on('error',reject)})}
function isAdmin(req){const m=(req.headers.cookie||'').match(/(?:^|;\s*)acdc_session=([a-f0-9]+)/);if(!m)return false;const exp=sessions.get(m[1]);if(!exp||exp<Date.now()){sessions.delete(m[1]);return false}return true}
function requireAdmin(req,res){if(isAdmin(req))return true;send(res,401,{error:'Oturum bulunamadı. Yönetici girişi yapın.'});return false}
function clean(v,max=3000){return String(v??'').trim().slice(0,max)}
function validPhone(v){return /^[+\d\s().-]{7,30}$/.test(v)}
function publicState(){const s=readJson(SITE_FILE,{});if(s&&typeof s==='object')delete s.credentials;return s}
function baseUrl(req){if(process.env.SITE_URL){try{return new URL(process.env.SITE_URL).origin}catch{}}const host=String(req.headers.host||'').replace(/[^a-zA-Z0-9.:-]/g,'');const proto=(req.headers['x-forwarded-proto']==='https'||req.socket.encrypted)?'https':'http';return host?`${proto}://${host}`:'https://example.invalid'}
function seoHtml(req){const base=baseUrl(req),title='Kırklareli Elektrikçi | Elektrik, Kamera ve Network — AC/DC Bilişim';const schema={"@context":"https://schema.org","@type":"Electrician","name":"AC/DC Bilişim","url":base,"logo":base+"/acdc-logo.png","image":base+"/acdc-hero.png","telephone":"+905303382741","areaServed":{"@type":"City","name":"Kırklareli","containedInPlace":{"@type":"Country","name":"Türkiye"}},"knowsAbout":["Kırklareli elektrikçi hizmetleri","elektrik tesisatı","elektrik arıza ve bakım","güvenlik kamerası kurulumu","alarm sistemleri","network altyapısı"],"description":"AC/DC Bilişim; Kırklareli elektrikçi, elektrik tesisatı, arıza ve bakım, güvenlik kamerası ve network altyapısı hizmetleri sunar."};let html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');const canonical=`<link rel="canonical" href="${base}/">`;const ld=`<script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>`;return html.replace('</head>',`${canonical}\n${ld}\n</head>`)}
function safeEqual(a,b){const aa=Buffer.from(String(a));const bb=Buffer.from(String(b));return aa.length===bb.length&&crypto.timingSafeEqual(aa,bb)}
function routeApi(req,res,url){
 if(req.method==='POST'&&url.pathname==='/api/admin/gallery-upload'){
  if(!requireAdmin(req,res))return;
  return readBody(req,140*1024*1024).then(body=>{
   const allowed={'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp','image/gif':'.gif','video/mp4':'.mp4','video/webm':'.webm','video/quicktime':'.mov'};
   const mime=String(body.mime||'').toLowerCase(),ext=allowed[mime],data=String(body.data||'');
   if(!ext||!data.startsWith('data:'+mime+';base64,'))return send(res,400,{error:'Dosya türü desteklenmiyor.'});
   const b64=data.slice(data.indexOf(',')+1);if(!b64||b64.length>140*1024*1024)return send(res,413,{error:'Dosya çok büyük.'});
   const bytes=Buffer.from(b64,'base64');if(!bytes.length||bytes.length>100*1024*1024)return send(res,413,{error:'Dosya boş veya 100 MB sınırını aşıyor.'});
   const id=crypto.randomUUID(),filename=id+ext,dest=path.join(GALLERY_DIR,filename);fs.writeFileSync(dest,bytes,{flag:'wx'});
   return send(res,201,{ok:true,id,url:'/public/assets/gallery/'+filename,size:bytes.length});
  }).catch(e=>send(res,413,{error:e.message||'Dosya yüklenemedi.'}));
 }
 if(req.method==='POST'&&url.pathname==='/api/admin/gallery-delete'){
  if(!requireAdmin(req,res))return;
  return readBody(req,10000).then(body=>{const urlPath=String(body.url||'');const name=path.basename(urlPath);if(!urlPath.startsWith('/public/assets/gallery/')||name!==urlPath.slice('/public/assets/gallery/'.length)||!/^[-a-f0-9]+\.(jpg|png|webp|gif|mp4|webm|mov)$/i.test(name))return send(res,400,{error:'Geçersiz dosya adresi.'});const file=path.join(GALLERY_DIR,name);try{if(fs.existsSync(file))fs.unlinkSync(file)}catch(e){return send(res,500,{error:'Dosya silinemedi.'})}return send(res,200,{ok:true})}).catch(e=>send(res,400,{error:e.message}));
 }
 if(req.method==='GET'&&url.pathname==='/api/site-state')return send(res,200,{state:publicState()});
 if(req.method==='GET'&&url.pathname==='/api/admin/site-state'){if(!requireAdmin(req,res))return;return send(res,200,{state:publicState()});}
 if(req.method==='PUT'&&url.pathname==='/api/admin/site-state'){
  if(!requireAdmin(req,res))return;
  return readBody(req).then(body=>{if(!body||typeof body!=='object'||Array.isArray(body))return send(res,400,{error:'Site verisi geçersiz.'});delete body.credentials;writeJson(SITE_FILE,body);return send(res,200,{ok:true})}).catch(e=>send(res,413,{error:e.message||'Site kaydedilemedi.'}));
 }
 if(req.method==='POST'&&url.pathname==='/api/requests')return readBody(req,100000).then(body=>{const name=clean(body.name,100),phone=clean(body.phone,30),service=clean(body.service,100),details=clean(body.details,3000);if(name.length<2||!validPhone(phone)||!service||details.length<5)return send(res,400,{error:'Lütfen ad, geçerli telefon, hizmet ve iş detaylarını doldurun.'});const rows=readRequests();const item={id:crypto.randomUUID(),createdAt:new Date().toISOString(),name,phone,service,place:clean(body.place,120),budget:clean(body.budget,80),timing:clean(body.timing,80),details,status:'Yeni'};rows.unshift(item);writeRequests(rows);return send(res,201,{ok:true,id:item.id})}).catch(e=>send(res,400,{error:e.message||'Talep kaydedilemedi.'}));
 if(req.method==='POST'&&url.pathname==='/api/admin/login')return readBody(req,10000).then(body=>{if(!safeEqual(body.username||'',ADMIN_USER)||!safeEqual(body.password||'',ADMIN_PASS))return send(res,401,{error:'Kullanıcı adı veya şifre yanlış.'});const token=crypto.randomBytes(32).toString('hex');sessions.set(token,Date.now()+8*60*60*1000);const secure=(req.headers['x-forwarded-proto']==='https'||req.socket.encrypted)?'; Secure':'';return send(res,200,{ok:true},{'Set-Cookie':`acdc_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${secure}`})}).catch(e=>send(res,400,{error:e.message}));
 if(req.method==='POST'&&url.pathname==='/api/admin/logout'){const m=(req.headers.cookie||'').match(/(?:^|;\s*)acdc_session=([a-f0-9]+)/);if(m)sessions.delete(m[1]);const secure=(req.headers['x-forwarded-proto']==='https'||req.socket.encrypted)?'; Secure':'';return send(res,200,{ok:true},{'Set-Cookie':`acdc_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`});}
 if(url.pathname==='/api/admin/requests'&&req.method==='GET'){if(!requireAdmin(req,res))return;return send(res,200,{requests:readRequests()});}
 const match=url.pathname.match(/^\/api\/admin\/requests\/([a-f0-9-]+)$/i);
 if(match&&req.method==='PATCH'){if(!requireAdmin(req,res))return;return readBody(req,10000).then(body=>{const allowed=['Yeni','İnceleniyor','Teklif verildi','Tamamlandı'];if(!allowed.includes(body.status))return send(res,400,{error:'Geçersiz talep durumu.'});const rows=readRequests(),item=rows.find(x=>x.id===match[1]);if(!item)return send(res,404,{error:'Talep bulunamadı.'});item.status=body.status;writeRequests(rows);return send(res,200,{ok:true})}).catch(e=>send(res,400,{error:e.message}));}
 if(match&&req.method==='DELETE'){if(!requireAdmin(req,res))return;const rows=readRequests(),next=rows.filter(x=>x.id!==match[1]);if(next.length===rows.length)return send(res,404,{error:'Talep bulunamadı.'});writeRequests(next);return send(res,200,{ok:true});}
 send(res,404,{error:'API adresi bulunamadı.'});
}
http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');if(url.pathname.startsWith('/api/'))return routeApi(req,res,url);if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,{'Allow':'GET, HEAD'});return res.end('Method not allowed')}if(url.pathname==='/robots.txt'){const body=`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: ${baseUrl(req)}/sitemap.xml\n`;res.writeHead(200,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'public, max-age=3600'});return req.method==='HEAD'?res.end():res.end(body)}if(url.pathname==='/sitemap.xml'){const body=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${baseUrl(req)}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url></urlset>`;res.writeHead(200,{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=3600'});return req.method==='HEAD'?res.end():res.end(body)}if(url.pathname==='/'||url.pathname==='/admin'||url.pathname==='/admin/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'});return req.method==='HEAD'?res.end():res.end(seoHtml(req))}const decoded=decodeURIComponent(url.pathname);if(decoded.includes('/.acdc-data')||decoded.includes('/acdc-data')||decoded.startsWith('/data/')||decoded==='/data'){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8','X-Content-Type-Options':'nosniff'});return res.end('Not found')}const target=path.resolve(ROOT,'.'+decoded);if(!target.startsWith(ROOT+path.sep)){res.writeHead(403);return res.end('Forbidden')}fs.stat(target,(err,st)=>{if(err||!st.isFile()){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});return res.end('Not found')}const type=TYPES[path.extname(target).toLowerCase()]||'application/octet-stream';const common={'Content-Type':type,'X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes','Cache-Control':'public, max-age=3600'};const range=req.headers.range;if(range&&/^bytes=\d*-\d*$/.test(range)){const parts=range.slice(6).split('-');let start=parts[0]===''?Math.max(0,st.size-Number(parts[1]||0)):Number(parts[0]);let end=parts[0]===''?st.size-1:(parts[1]===''?st.size-1:Number(parts[1]));if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=st.size||end<start){res.writeHead(416,{'Content-Range':`bytes */${st.size}`,'Accept-Ranges':'bytes'});return res.end()}end=Math.min(end,st.size-1);res.writeHead(206,{...common,'Content-Range':`bytes ${start}-${end}/${st.size}`,'Content-Length':end-start+1});if(req.method==='HEAD')return res.end();return fs.createReadStream(target,{start,end}).pipe(res)}res.writeHead(200,{...common,'Content-Length':st.size});if(req.method==='HEAD')return res.end();fs.createReadStream(target).pipe(res)})}).listen(PORT,HOST,()=>console.log(`AC/DC Bilişim: port ${PORT} | Yönetim: /admin | Kalıcı kayıt dizini: ${DATA_DIR}`));
