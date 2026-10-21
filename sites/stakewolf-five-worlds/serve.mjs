import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
const root = fileURLToPath(new URL('./dist/', import.meta.url));
const files = new Set(['index.html','style.css','app.js','scenes.js']);
const types = {html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',js:'text/javascript; charset=utf-8'};
createServer(async(req,res)=>{
  const pathname = new URL(req.url,'http://localhost').pathname;
  const file = pathname==='/'?'index.html':pathname.slice(1);
  if(!files.has(file)){res.writeHead(404);res.end('Not found');return;}
  try{const body=await readFile(join(root,file));res.writeHead(200,{'Content-Type':types[file.split('.').pop()],'Cache-Control':'no-store'});res.end(body);}catch{res.writeHead(500);res.end('Preview unavailable');}
}).listen(4183,'127.0.0.1',()=>console.log('Five Other Worlds preview: http://127.0.0.1:4183/'));
