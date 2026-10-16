import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {createStaticServer} from '../server.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const files=new Map([
 ['/', ['public/wild/wolf-proof/index.html','text/html; charset=utf-8']],
 ['/proof/style.css',['public/wild/wolf-proof/style.css','text/css; charset=utf-8']],
 ['/proof/scene.bundle.js',['public/wild/wolf-proof/scene.bundle.js','text/javascript; charset=utf-8']],
 ['/proof/wolf.glb',['.tmp-scrum36/wolf-proof/Dire_Wolf_Lite/Dire_Wolf_Lite.glb','model/gltf-binary']]
]);
const scenery=createStaticServer();
const server=createServer(async(req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
 const path=(req.url||'').split('?')[0],entry=files.get(path);
 if(!entry){scenery.emit('request',req,res);return;}
 try{const bytes=await readFile(resolve(root,entry[0]));res.writeHead(200,{'Content-Type':entry[1],'Content-Length':bytes.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self' blob:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});res.end(req.method==='HEAD'?undefined:bytes);}
 catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Local proof asset unavailable. See the wolf proof README.');}
});
server.once('error',error=>{console.error(error.message);process.exitCode=1;});
server.listen(4179,'127.0.0.1',()=>console.log('Wolf study: http://127.0.0.1:4179/'));
