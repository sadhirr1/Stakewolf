import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {createStaticServer} from '../server.mjs';
const scenery=createStaticServer();
const files=new Map([
  ['/', ['public/wild/portrait-proof/forest.html','text/html; charset=utf-8']],
  ['/study', ['public/wild/portrait-proof/index.html','text/html; charset=utf-8']],
  ['/portrait/clearing.css',['public/wild/portrait-proof/clearing.css','text/css; charset=utf-8']],
  ['/portrait/clearing.js',['public/wild/portrait-proof/clearing.js','text/javascript; charset=utf-8']],
  ['/portrait/clearing-state.js',['public/wild/portrait-proof/clearing-state.js','text/javascript; charset=utf-8']],
  ['/portrait/forest.css',['public/wild/portrait-proof/forest.css','text/css; charset=utf-8']],
  ['/portrait/encounter.js',['public/wild/portrait-proof/encounter.js','text/javascript; charset=utf-8']],
  ['/portrait/forest.bundle.js',['public/wild/portrait-proof/forest.bundle.js','text/javascript; charset=utf-8']],
  ['/portrait/style.css',['public/wild/portrait-proof/style.css','text/css; charset=utf-8']],
  ['/portrait/portrait.js',['public/wild/portrait-proof/portrait.js','text/javascript; charset=utf-8']],
  ['/portrait/leader-cutout.png',['.tmp-scrum36/portrait-proof/leader-cutout.png','image/png']],
  ['/portrait/leader-original.jpg',['.tmp-scrum36/portrait-proof/leader-original.jpg','image/jpeg']]
]);
const root=new URL('../',import.meta.url);
const server=createServer(async(req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
  const pathname=(req.url||'').split('?')[0];
  if(/^\/wild\/assets\/(forest-floor|bark|pine|fern|rock-moss)\//.test(pathname)){scenery.emit('request',req,res);return;}
  const entry=files.get(pathname);
  if(!entry){res.writeHead(404);res.end('Not found');return;}
  try{
    const bytes=await readFile(new URL(entry[0],root));
    res.writeHead(200,{'Content-Type':entry[1],'Content-Length':bytes.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});
    res.end(req.method==='HEAD'?undefined:bytes);
  }catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Local portrait unavailable. See public/wild/portrait-proof/README.md.');}
});
server.once('error',error=>{console.error(error.message);process.exitCode=1;});
server.listen(4181,'127.0.0.1',()=>console.log('Council leader portrait: http://127.0.0.1:4181/'));
