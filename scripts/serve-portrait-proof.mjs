import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
const files=new Map([
  ['/', ['public/wild/portrait-proof/index.html','text/html; charset=utf-8']],
  ['/portrait/style.css',['public/wild/portrait-proof/style.css','text/css; charset=utf-8']],
  ['/portrait/portrait.js',['public/wild/portrait-proof/portrait.js','text/javascript; charset=utf-8']],
  ['/portrait/leader-cutout.png',['.tmp-scrum36/portrait-proof/leader-cutout.png','image/png']],
  ['/portrait/leader-original.jpg',['.tmp-scrum36/portrait-proof/leader-original.jpg','image/jpeg']]
]);
const root=new URL('../',import.meta.url);
const server=createServer(async(req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
  const entry=files.get((req.url||'').split('?')[0]);
  if(!entry){res.writeHead(404);res.end('Not found');return;}
  try{
    const bytes=await readFile(new URL(entry[0],root));
    res.writeHead(200,{'Content-Type':entry[1],'Content-Length':bytes.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});
    res.end(req.method==='HEAD'?undefined:bytes);
  }catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Local portrait unavailable. See public/wild/portrait-proof/README.md.');}
});
server.once('error',error=>{console.error(error.message);process.exitCode=1;});
server.listen(4181,'127.0.0.1',()=>console.log('Council leader portrait: http://127.0.0.1:4181/'));
