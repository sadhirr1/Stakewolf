import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

// Offline conversion only: no downloads, installs or creator script execution.
// See public/wild/assets/warg/README.md for source/license and exact tool versions.
// Sharp is supplied separately as a module path; Three is the pinned project copy.
const [sourceDir, targetDir, sharpModule, variant] = process.argv.slice(2);
const optimized=variant!=='lossless';
if (!sourceDir || !targetDir || !sharpModule) throw new Error('Usage: node scripts/asset-prep-warg.mjs extracted-Beasts-dir output-dir sharp-module [lossless]');
const require = createRequire(import.meta.url);
const sharp = require(sharpModule);
const files = [];
function walk(dir) { for (const e of fs.readdirSync(dir,{withFileTypes:true})) { const p=path.join(dir,e.name); if(e.isDirectory()) walk(p); else files.push(p); } }
walk(sourceDir);
const get = name => { const hits=files.filter(f=>path.basename(f)===name); if(hits.length!==1) throw new Error(`Need exactly one ${name}, got ${hits.length}`); return hits[0]; };
const manager = new THREE.LoadingManager();
manager.addHandler(/\.(png|jpg|jpeg)$/i, {path:'',setPath(v){this.path=v;return this;},load(name){const t=new THREE.Texture();t.name=name;return t;}});
const loader = new FBXLoader(manager);
function parse(file) {const b=fs.readFileSync(file);return loader.parse(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),path.dirname(file)+'/');}
const root=parse(get('Warg.fbx'));
const remove=[];
root.traverse(o=>{if(o.isMesh && o.name!=='WargBody') remove.push(o);});
for(const o of remove) o.removeFromParent();
const body=root.getObjectByName('WargBody');
if(!body?.isSkinnedMesh) throw new Error('Missing skinned WargBody');
// The author's FBX color attribute stores part/bake masks, not rendered albedo.
// glTF enables vertex-color multiplication whenever COLOR_0 exists.
body.geometry.deleteAttribute('color');
// FBXLoader creates an identity duplicate of each shared bone for every mesh.
// Retain the first (animated) bone only after proving the bind-world matrices match.
root.updateMatrixWorld(true);
const allBones=[];root.traverse(o=>{if(o.isBone)allBones.push(o);});
const canonical=new Map();for(const bone of allBones) if(!canonical.has(bone.name))canonical.set(bone.name,bone);
const canonicalBones=body.skeleton.bones.map(bone=>{
  const kept=canonical.get(bone.name);
  if(bone.matrixWorld.elements.some((v,i)=>Math.abs(v-kept.matrixWorld.elements[i])>1e-7)) throw new Error(`Non-equivalent duplicate ${bone.name}`);
  return kept;
});
body.skeleton=new THREE.Skeleton(canonicalBones,body.skeleton.boneInverses.map(m=>m.clone()));
for(const bone of allBones) if(canonical.get(bone.name)!==bone){
  if(bone.position.length()>1e-7||bone.quaternion.angleTo(new THREE.Quaternion())>1e-7||bone.scale.distanceTo(new THREE.Vector3(1,1,1))>1e-7)throw new Error('Nonidentity duplicate');
  bone.removeFromParent();
}
body.material=new THREE.MeshStandardMaterial({name:'Warg authored coat',color:0xffffff,roughness:1,metalness:0});
const clips=[];
const optimization=[];
for(const name of ['Idle','IdlePant']) {
  const animationRoot=parse(get(`Warg@${name}.fbx`));
  if(animationRoot.animations.length!==1) throw new Error(`${name}: expected one take`);
  const clip=animationRoot.animations[0];clip.name=name;
  for(const track of clip.tracks) {
    const binding=THREE.PropertyBinding.parseTrackName(track.name);
    if(!root.getObjectByName(binding.nodeName)) throw new Error(`Unbound animation track ${track.name}`);
  }
  if(optimized){
    const smaller=clip.clone().optimize();let maxError=0;
    for(let i=0;i<clip.tracks.length;i++){
      const before=clip.tracks[i],after=smaller.tracks[i];
      const a=before.createInterpolant(),b=after.createInterpolant();
      const samples=[...before.times,...Array.from({length:Math.ceil(clip.duration*120)+1},(_,n)=>n/120)];
      for(const time of samples){const av=a.evaluate(time),bv=b.evaluate(time);for(let n=0;n<av.length;n++)maxError=Math.max(maxError,Math.abs(av[n]-bv[n]));}
    }
    if(maxError>1e-6)throw new Error(`Optimization changed ${name} interpolation by ${maxError}`);
    optimization.push({name,beforeKeys:clip.tracks.reduce((n,t)=>n+t.times.length,0),afterKeys:smaller.tracks.reduce((n,t)=>n+t.times.length,0),maxSampledInterpolationError:maxError});
    clips.push(smaller);
  }else clips.push(clip);
}
root.updateMatrixWorld(true);
const bounds=new THREE.Box3().setFromObject(root);
// Wrapper normalization leaves authored local rest matrices and skin weights intact.
const wrapper=new THREE.Group();wrapper.name='WargMeters';wrapper.add(root);
const scale=1.2/(bounds.max.y-bounds.min.y);
wrapper.scale.setScalar(scale);wrapper.position.y=-bounds.min.y*scale;
wrapper.updateMatrixWorld(true);
globalThis.FileReader=class {
  readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}
  readAsDataURL(blob){blob.arrayBuffer().then(result=>{this.result=`data:${blob.type};base64,${Buffer.from(result).toString('base64')}`;this.onloadend?.();});}
};
const gltf=await new GLTFExporter().parseAsync(wrapper,{binary:false,animations:clips,onlyVisible:true,trs:true});
const binary=Buffer.from(gltf.buffers[0].uri.split(',')[1],'base64');
gltf.buffers[0].uri='warg.bin';
gltf.asset.copyright='Daniel Gruginski / algumacoisaqq — CC0-1.0';
gltf.asset.extras={source:'https://github.com/danielgruginski/Beasts',adaptation:'Removed WargTack, WargMask and non-display vertex-color masks; canonicalized equivalent FBXLoader identity bone duplicates; retained authored rig, Idle/IdlePant; normalized total height to 1.2m with outer wrapper; converted FBX to glTF. Texture rows flipped for glTF orientation; roughness derived from smoothness alpha.',compression:optimized?'Redundant animation keys removed with sampled interpolation equivalence checks; full-resolution coat JPEG quality94 and normal JPEG quality98, 4:4:4 chroma; exact roughness PNG.':'Lossless PNG textures; original animation keys.'};
gltf.images=[{uri:optimized?'coat.jpg':'coat.png'},{uri:optimized?'normal.jpg':'normal.png'},{uri:'roughness.png'}];
gltf.samplers=[{magFilter:9729,minFilter:9987,wrapS:10497,wrapT:10497}];
gltf.textures=gltf.images.map((_,source)=>({source,sampler:0}));
gltf.materials[0].pbrMetallicRoughness.baseColorTexture={index:0};
gltf.materials[0].pbrMetallicRoughness.metallicRoughnessTexture={index:2};
gltf.materials[0].normalTexture={index:1};
gltf.materials[0].alphaMode='OPAQUE';
fs.mkdirSync(targetDir,{recursive:true});
fs.writeFileSync(path.join(targetDir,'warg.bin'),binary);
if(optimized){
  await sharp(get('T_Warg.png')).flip().removeAlpha().jpeg({quality:94,chromaSubsampling:'4:4:4'}).toFile(path.join(targetDir,'coat.jpg'));
  await sharp(get('T_Warg_Normal.png')).flip().jpeg({quality:98,chromaSubsampling:'4:4:4'}).toFile(path.join(targetDir,'normal.jpg'));
}else{
  await sharp(get('T_Warg.png')).flip().removeAlpha().png().toFile(path.join(targetDir,'coat.png'));
  await sharp(get('T_Warg_Normal.png')).flip().png().toFile(path.join(targetDir,'normal.png'));
}
await sharp(get('T_Warg.png')).flip().extractChannel('alpha').negate().png().toFile(path.join(targetDir,'roughness.png'));
fs.writeFileSync(path.join(targetDir,'warg.gltf'),JSON.stringify(gltf));
fs.writeFileSync(path.join(targetDir,'conversion-report.json'),JSON.stringify({optimized,optimization,sourceBounds:bounds,normalizedBounds:new THREE.Box3().setFromObject(wrapper),scale,
  triangles:(body.geometry.index?.count??body.geometry.attributes.position.count)/3,bones:body.skeleton.bones.length,
  clips:clips.map(c=>({name:c.name,duration:c.duration,tracks:c.tracks.length})),head:root.getObjectByName('Head')?.getWorldPosition(new THREE.Vector3()).toArray()},null,2));
// Package the same scene and textures into a self-contained GLB.
const packed=structuredClone(gltf),chunks=[];let length=0;
const append=bytes=>{const offset=length;const padded=Buffer.alloc(Math.ceil(bytes.length/4)*4);bytes.copy(padded);chunks.push(padded);length+=padded.length;return offset;};
append(binary);
for(const img of packed.images){const bytes=fs.readFileSync(path.join(targetDir,img.uri));const byteOffset=append(bytes);img.bufferView=packed.bufferViews.length;img.mimeType=img.uri.endsWith('.jpg')?'image/jpeg':'image/png';packed.bufferViews.push({buffer:0,byteOffset,byteLength:bytes.length});delete img.uri;}
packed.buffers=[{byteLength:length}];
const json=Buffer.from(JSON.stringify(packed));const jsonChunk=Buffer.alloc(Math.ceil(json.length/4)*4,32);json.copy(jsonChunk);
const header=Buffer.alloc(12),jhead=Buffer.alloc(8),bhead=Buffer.alloc(8);
header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(12+8+jsonChunk.length+8+length,8);
jhead.writeUInt32LE(jsonChunk.length);jhead.writeUInt32LE(0x4e4f534a,4);bhead.writeUInt32LE(length);bhead.writeUInt32LE(0x004e4942,4);
const glb=Buffer.concat([header,jhead,jsonChunk,bhead,...chunks]);fs.writeFileSync(path.join(targetDir,'warg.glb'),glb);
console.log(JSON.stringify({bytes:glb.length,sha256:crypto.createHash('sha256').update(glb).digest('hex'),three:THREE.REVISION,sharp:sharp.versions.sharp,optimization},null,2));
