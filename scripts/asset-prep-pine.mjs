// SCRUM-36: bounded offline reduction of Poly Haven's CC0 Pine Sapling Small.
// Usage: node scripts/asset-prep-pine.mjs <source-directory> <meshopt_simplifier.js>
// Source directory holds pine_sapling_small.gltf and pine_sapling_small.bin.
// Prep only: meshoptimizer 1.3.0 (MIT), https://www.npmjs.com/package/meshoptimizer
// The exported glTF needs no decoder or meshoptimizer runtime dependency.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [input, modulePath] = process.argv.slice(2);
if (!input || !modulePath) throw new Error('Pass source directory and meshopt_simplifier.js.');
const { MeshoptSimplifier } = await import(pathToFileURL(path.resolve(modulePath)));
await MeshoptSimplifier.ready;
const source = JSON.parse(fs.readFileSync(path.join(input, 'pine_sapling_small.gltf')));
const sourceBin = fs.readFileSync(path.join(input, 'pine_sapling_small.bin'));
const size = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
function readAccessor(index) {
  const a = source.accessors[index], view = source.bufferViews[a.bufferView];
  if (view.byteStride || a.sparse) throw new Error('Unexpected source storage.');
  const ArrayType = {5123:Uint16Array,5125:Uint32Array,5126:Float32Array}[a.componentType];
  const start = (view.byteOffset ?? 0) + (a.byteOffset ?? 0);
  const bytes = sourceBin.subarray(start, start + a.count * size[a.type] * ArrayType.BYTES_PER_ELEMENT);
  return new ArrayType(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
}
const gltf = structuredClone(source);
gltf.asset.generator = 'Stakewolf SCRUM-36; meshoptimizer 1.3.0 offline simplification';
gltf.asset.copyright = 'Pine Sapling Small by Rob Tuytel and Rico Cilliers / Poly Haven, CC0. Variant b extracted and foliage reduced.';
gltf.scene = 0; gltf.scenes = [{ name:'Pine', nodes:[0] }];
gltf.nodes = [{ name:'pine_sapling_small_b', mesh:0 }];
gltf.meshes = [{ name:'pine_sapling_small_b', primitives:[] }];
gltf.accessors = []; gltf.bufferViews = [];
gltf.images = gltf.images.map((image,index)=>({ ...image, uri:index<3 ? ['../bark/normal.jpg','../bark/diffuse.jpg','../bark/arm.jpg'][index] : ['twig-normal.jpg','twig-diffuse.jpg','twig-arm.jpg'][index-3] }));
const chunks = []; let byteLength = 0;
function append(data, type, target) {
  const padding = (4-byteLength%4)%4;
  if(padding){chunks.push(Buffer.alloc(padding));byteLength+=padding;}
  const bytes = Buffer.from(data.buffer,data.byteOffset,data.byteLength);
  gltf.bufferViews.push({buffer:0,byteOffset:byteLength,byteLength:bytes.length,target});
  chunks.push(bytes); byteLength += bytes.length;
  const a = {bufferView:gltf.bufferViews.length-1,componentType:data instanceof Float32Array?5126:data instanceof Uint16Array?5123:5125,count:data.length/size[type],type};
  if(type==='VEC3') {
    a.min = [Infinity,Infinity,Infinity];a.max = [-Infinity,-Infinity,-Infinity];
    for(let i=0;i<data.length;i++){const axis=i%3;a.min[axis]=Math.min(a.min[axis],data[i]);a.max[axis]=Math.max(a.max[axis],data[i]);}
  }
  gltf.accessors.push(a);return gltf.accessors.length-1;
}
const stats = [];
for(const primitive of source.meshes[0].primitives) {
  const positions = readAccessor(primitive.attributes.POSITION);
  const normals = readAccessor(primitive.attributes.NORMAL);
  const uvs = readAccessor(primitive.attributes.TEXCOORD_0);
  const originalIndices = Uint32Array.from(readAccessor(primitive.indices));
  let indices = originalIndices, error = 0;
  if(primitive.material===1) {
    const attributes = new Float32Array(positions.length/3*5);
    for(let v=0;v<positions.length/3;v++) {
      attributes.set(normals.subarray(v*3,v*3+3),v*5);
      attributes.set(uvs.subarray(v*2,v*2+2),v*5+3);
    }
    [indices,error] = MeshoptSimplifier.simplifyWithAttributes(originalIndices,positions,3,attributes,5,[0.1,0.1,0.1,1,1],null,24000*3,0.025,['Prune','Permissive']);
  }
  const [remap, count] = MeshoptSimplifier.compactMesh(indices);
  const reduced = [new Float32Array(count*3),new Float32Array(count*3),new Float32Array(count*2)];
  for(let old=0;old<remap.length;old++) if(remap[old]!==0xffffffff) {
    reduced[0].set(positions.subarray(old*3,old*3+3),remap[old]*3);
    reduced[1].set(normals.subarray(old*3,old*3+3),remap[old]*3);
    reduced[2].set(uvs.subarray(old*2,old*2+2),remap[old]*2);
  }
  const attributes = {POSITION:append(reduced[0],'VEC3',34962),NORMAL:append(reduced[1],'VEC3',34962),TEXCOORD_0:append(reduced[2],'VEC2',34962)};
  gltf.meshes[0].primitives.push({attributes,indices:append(count<65536?Uint16Array.from(indices):indices,'SCALAR',34963),material:primitive.material});
  stats.push({material:primitive.material,originalTriangles:originalIndices.length/3,triangles:indices.length/3,vertices:count,error});
}
const triangles = stats.reduce((sum,p)=>sum+p.triangles,0);
if(triangles>30000) throw new Error(`Simplification exceeded 30k triangle limit: ${triangles}`);
gltf.buffers = [{ uri:'pine.bin',byteLength }];
const output = path.resolve('public/wild/assets/pine');fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,'pine.gltf'),JSON.stringify(gltf));
fs.writeFileSync(path.join(output,'pine.bin'),Buffer.concat(chunks));
console.log(JSON.stringify({triangles,bytes:byteLength,parts:stats},null,2));
