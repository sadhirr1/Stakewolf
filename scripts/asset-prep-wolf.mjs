// SCRUM-36: convert Sirren's licensed static OBJ to a self-contained glTF 2 GLB.
// Usage: node scripts/asset-prep-wolf.mjs <extracted-Wolf.zip-directory>
// Source archive: https://opengameart.org/sites/default/files/Wolf.zip
// Source license: CC BY-SA 3.0; see public/wild/assets/README.md.
import fs from 'node:fs';
import path from 'node:path';

const input = process.argv[2];
if (!input) throw new Error('Pass the extracted Wolf.zip directory.');
const positions = [], normals = [], uvs = [];
const groups = new Map();
let group = 'Wolf', material = 'material2';
for (const line of fs.readFileSync(path.join(input, 'wolf.obj'), 'utf8').split(/\r?\n/)) {
  const [tag, ...values] = line.trim().split(/\s+/);
  if (tag === 'v') positions.push(values.map(Number));
  if (tag === 'vn') normals.push(values.map(Number));
  if (tag === 'vt') uvs.push(values.map(Number));
  if (tag === 'g') group = values.join(' ');
  if (tag === 'usemtl') material = values[0];
  if (tag !== 'f') continue;
  const key = `${group}:${material}`;
  if (!groups.has(key)) groups.set(key, { name: group, material, faces: [] });
  const face = values.map(value => value.split('/').map(Number));
  for (let index = 1; index < face.length - 1; index++) groups.get(key).faces.push([face[0], face[index], face[index + 1]]);
}
const min = [0,1,2].map(axis => Math.min(...positions.map(v => v[axis])));
const max = [0,1,2].map(axis => Math.max(...positions.map(v => v[axis])));
const scale = 1.2 / (max[1] - min[1]);
const center = [(min[0]+max[0])/2, min[1], (min[2]+max[2])/2];
const chunks = [];
let byteLength = 0;
const gltf = {
  asset: { version: '2.0', generator: 'Stakewolf SCRUM-36 OBJ conversion', copyright: 'Wolf by Sirren for PARPG, CC BY-SA 3.0. Converted to glTF; geometry normalized to 1.2m total height.' },
  scene: 0, scenes: [{ nodes: [] }], nodes: [], meshes: [], accessors: [], bufferViews: [], buffers: [],
  images: [], samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }], textures: [{ source: 0, sampler: 0 }],
  materials: [
    { name: 'Sirren hand-painted fur', pbrMetallicRoughness: { baseColorTexture: { index: 0 }, metallicFactor: 0, roughnessFactor: 0.95 }, doubleSided: true },
    { name: 'Ivory teeth', pbrMetallicRoughness: { baseColorFactor: [0.8,0.77,0.67,1], metallicFactor: 0, roughnessFactor: 0.72 } },
  ],
};
function append(buffer, target) {
  const padding = (4 - byteLength % 4) % 4;
  if (padding) { chunks.push(Buffer.alloc(padding)); byteLength += padding; }
  const view = { buffer: 0, byteOffset: byteLength, byteLength: buffer.length };
  if (target) view.target = target;
  gltf.bufferViews.push(view); chunks.push(buffer); byteLength += buffer.length;
  return gltf.bufferViews.length - 1;
}
function accessor(data, type) {
  const array = new Float32Array(data.flat());
  const acc = { bufferView: append(Buffer.from(array.buffer), 34962), componentType: 5126, count: data.length, type };
  if (type === 'VEC3') { acc.min = [0,1,2].map(a => Math.min(...data.map(v=>v[a]))); acc.max = [0,1,2].map(a => Math.max(...data.map(v=>v[a]))); }
  gltf.accessors.push(acc); return gltf.accessors.length - 1;
}
let triangles = 0;
for (const item of groups.values()) {
  const pos = [], norm = [], tex = [];
  for (const face of item.faces) for (const [v,t,n] of face) {
    const p = positions[v-1];
    if (!p || !normals[n-1]) throw new Error('Missing source vertex or normal.');
    pos.push(p.map((value,axis)=>(value-center[axis])*scale));
    norm.push(normals[n-1]);
    const uv = uvs[t-1] ?? [0,0]; tex.push([uv[0],1-uv[1]]);
  }
  triangles += item.faces.length;
  const attributes = { POSITION: accessor(pos,'VEC3'), NORMAL: accessor(norm,'VEC3'), TEXCOORD_0: accessor(tex,'VEC2') };
  const mesh = gltf.meshes.length;
  gltf.meshes.push({ name: item.name, primitives: [{ attributes, material: item.material === 'material2' ? 0 : 1 }] });
  gltf.scenes[0].nodes.push(gltf.nodes.length);
  gltf.nodes.push({ name: item.name, mesh });
}
const png = fs.readFileSync(path.join(input,'Pelt.png'));
gltf.images.push({ mimeType: 'image/png', bufferView: append(png) });
const pad = (4-byteLength%4)%4; if(pad){chunks.push(Buffer.alloc(pad)); byteLength += pad;}
gltf.buffers.push({ byteLength });
const jsonRaw = Buffer.from(JSON.stringify(gltf));
const json = Buffer.concat([jsonRaw, Buffer.alloc((4-jsonRaw.length%4)%4, 32)]);
const bin = Buffer.concat(chunks);
const header = Buffer.alloc(12); header.write('glTF'); header.writeUInt32LE(2,4); header.writeUInt32LE(12+8+json.length+8+bin.length,8);
const jsonHeader = Buffer.alloc(8); jsonHeader.writeUInt32LE(json.length); jsonHeader.writeUInt32LE(0x4e4f534a,4);
const binHeader = Buffer.alloc(8); binHeader.writeUInt32LE(bin.length); binHeader.writeUInt32LE(0x004e4942,4);
const output = path.resolve('public/wild/assets/wolf/wolf.glb');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output,Buffer.concat([header,jsonHeader,json,binHeader,bin]));
console.log(JSON.stringify({output,bytes:fs.statSync(output).size,meshes:gltf.meshes.length,triangles,sourceBounds:{min,max},height:1.2,animations:0,rigged:false},null,2));
