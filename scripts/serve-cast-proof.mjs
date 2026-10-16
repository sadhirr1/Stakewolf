import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {createStaticServer} from '../server.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const files=new Map([
 ['/', ['public/wild/cast-proof/index.html','text/html; charset=utf-8']],
 ['/cast/style.css',['public/wild/cast-proof/style.css','text/css; charset=utf-8']],
 ['/cast/scene.bundle.js',['public/wild/cast-proof/scene.bundle.js','text/javascript; charset=utf-8']],
 ['/cast/ashfen-ranger.glb',['.tmp-scrum36/cast-proof/ashfen-ranger.glb','model/gltf-binary']],
 ['/cast/vale-shieldmaiden.glb',['.tmp-scrum36/cast-proof/vale-shieldmaiden.glb','model/gltf-binary']]
]);
const scenery=createStaticServer();
const server=createServer(async(req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
 const path=(req.url||'').split('?')[0],entry=files.get(path);
 if(!entry){scenery.emit('request',req,res);return;}
 try{const bytes=await readFile(resolve(root,entry[0]));res.writeHead(200,{'Content-Type':entry[1],'Content-Length':bytes.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self' blob:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});res.end(req.method==='HEAD'?undefined:bytes);}
 catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Local cast asset unavailable. See the cast proof README.');}
});
server.once('error',error=>{console.error(error.message);process.exitCode=1;});
server.listen(4180,'127.0.0.1',()=>console.log('Council study: http://127.0.0.1:4180/'));
