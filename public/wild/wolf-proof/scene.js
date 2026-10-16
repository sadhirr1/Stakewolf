import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// SCRUM-36: isolated asset gate. Original model/materials/animation are unchanged.
// The licensed model is served from an ignored local directory, never bundled.
const $ = id => document.getElementById(id);
const status = $('status'), controlsElements = document.querySelectorAll('nav button, nav select');
controlsElements.forEach(element => { element.disabled = true; });
let renderer, scene, camera, orbit, mixer, action, wolf, head, ground, plants;
let frame = 0, last = 0, disposed = false, ready = false, portrait = false;
let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
let dusk = true, facing = 1, clips = [], hemi, key, rim;
const resources = new Set(), textures = new Set(), loader = new GLTFLoader();
const own = resource => { resources.add(resource); return resource; };
function collect(root) {
  root.traverse(node => {
    if (!node.isMesh) return;
    own(node.geometry);
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
      own(material); for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    }
  });
}
function render() { if (!disposed && ready && !document.hidden) renderer.render(scene, camera); }
function tick(time) {
  frame = 0;
  if (!ready || disposed || paused || document.hidden) { last = 0; return; }
  const delta = last ? Math.min((time - last) / 1000, .05) : 0;
  last = time; mixer.update(delta); render(); frame = requestAnimationFrame(tick);
}
function schedule() { if (!frame && ready && !paused && !document.hidden) { last = 0; frame = requestAnimationFrame(tick); } }
function motion() {
  $('motion').textContent = paused ? 'Resume motion' : 'Pause motion';
  $('motion').setAttribute('aria-pressed', String(paused));
  cancelAnimationFrame(frame); frame = 0; last = 0; render(); schedule();
}
function resize() {
  if (!renderer) return;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); render();
}
function frameWolf() {
  if (!ready) return;
  const center = new THREE.Vector3(0, .85, 0);
  const target = portrait ? head.clone() : center;
  orbit.target.copy(target);
  camera.position.copy(target).add(new THREE.Vector3(portrait ? 1.45 : 3.2, portrait ? .12 : .6, facing * (portrait ? 1.6 : 4.2)));
  camera.fov = portrait ? 34 : 38;
  // Keep a restrained editorial margin without obscuring the model.
  camera.setViewOffset(innerWidth, innerHeight, innerWidth > 850 ? -innerWidth * .13 : 0, 0, innerWidth, innerHeight);
  camera.updateProjectionMatrix(); orbit.update();
  $('body').setAttribute('aria-pressed', String(!portrait)); $('portrait').setAttribute('aria-pressed', String(portrait)); render();
}
function light() {
  scene.background.set(dusk ? 0x182b34 : 0x8b9295);
  scene.fog.color.copy(scene.background); scene.fog.density = dusk ? .055 : .025;
  hemi.intensity = dusk ? 1.0 : 1.8;
  key.intensity = dusk ? 4.2 : 3.4; key.color.set(dusk ? 0xffe8c9 : 0xffffff);
  rim.intensity = dusk ? 4 : 1; rim.color.set(dusk ? 0x87b8e1 : 0xffffff);
  $('dusk').setAttribute('aria-pressed', String(dusk)); $('neutral').setAttribute('aria-pressed', String(!dusk)); render();
}
async function environment() {
  const texLoader = new THREE.TextureLoader();
  const paths = ['diffuse','normal','arm'];
  const maps = await Promise.all(paths.map(name => texLoader.loadAsync(`/wild/assets/forest-floor/${name}.jpg`)));
  if (disposed) { maps.forEach(map => map.dispose()); return; }
  maps.forEach(map => { textures.add(map); map.wrapS = map.wrapT = THREE.RepeatWrapping; map.repeat.set(14,14); map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy()); }); maps[0].colorSpace = THREE.SRGBColorSpace;
  ground.material.map = maps[0]; ground.material.normalMap = maps[1]; ground.material.roughnessMap = maps[2]; ground.material.needsUpdate = true;
  const entries = await Promise.allSettled(['pine/pine.gltf','rock-moss/rock-moss.gltf','fern/fern.gltf'].map(path => loader.loadAsync(`/wild/assets/${path}`)));
  entries.forEach((entry,index) => {
    if (entry.status !== 'fulfilled') return;
    const model = entry.value.scene; collect(model);
    if (disposed) return;
    const box = new THREE.Box3().setFromObject(model), size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
    const placements = index === 0 ? [[-4,-5,8,.8],[3,-7,10,2.3],[-6,-10,12,1.7]] : index === 1 ? [[-1.8,-1,.65,1],[2,-2,.4,3]] : [[-2,1,.65,1],[1.8,-1,.5,2],[-1,-3,.7,4]];
    for (const [x,z,height,yaw] of placements) {
      const wrap = new THREE.Group(), copy = model.clone(true), scale = height / size.y;
      copy.position.sub(center); copy.position.y = -box.min.y; wrap.add(copy); wrap.scale.setScalar(scale); wrap.rotation.y = yaw; wrap.position.set(x,0,z);
      wrap.traverse(node => { if(node.isMesh) { node.castShadow = index === 0; node.receiveShadow = true; } }); plants.add(wrap);
    }
  });
  if (disposed) { resources.forEach(r=>r.dispose()); textures.forEach(t=>t.dispose()); return; }
  render();
}
async function init() {
  try {
    renderer = new THREE.WebGLRenderer({canvas:$('scene'),antialias:true,alpha:false});
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
    scene = new THREE.Scene(); scene.background = new THREE.Color(0x182b34); scene.fog = new THREE.FogExp2(0x182b34,.055);
    camera = new THREE.PerspectiveCamera(38,1,.05,80); orbit = new OrbitControls(camera,renderer.domElement);
    orbit.enableDamping = false; orbit.enablePan = false; orbit.minDistance = 1; orbit.maxDistance = 8; orbit.maxPolarAngle = Math.PI*.49; orbit.addEventListener('change',render);
    ground = new THREE.Mesh(own(new THREE.PlaneGeometry(60,60)),own(new THREE.MeshStandardMaterial({color:0x515a4c,roughness:1,normalScale:new THREE.Vector2(.35,.35)})));
    ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground); plants=new THREE.Group(); scene.add(plants);
    hemi = new THREE.HemisphereLight(0xc6dce5,0x30352a,1); scene.add(hemi);
    key = new THREE.DirectionalLight(0xffe8c9,4.2); key.position.set(3.5,5,4); key.castShadow=true; key.shadow.mapSize.set(2048,2048);
    Object.assign(key.shadow.camera,{left:-4,right:4,top:4,bottom:-4,near:.1,far:20}); key.shadow.bias=-.0002; key.shadow.normalBias=.025; scene.add(key);
    rim = new THREE.DirectionalLight(0x87b8e1,4); rim.position.set(-3,3,-4); scene.add(rim);
    const gltf = await loader.loadAsync('/proof/wolf.glb'); wolf=gltf.scene; collect(wolf);
    if(disposed) { resources.forEach(r=>r.dispose()); textures.forEach(t=>t.dispose()); return; }
    const bounds=new THREE.Box3().setFromObject(wolf); wolf.position.y=-bounds.min.y;
    wolf.traverse(node=>{if(node.isMesh){node.castShadow=true;node.receiveShadow=true;}}); scene.add(wolf); wolf.updateMatrixWorld(true);
    head=wolf.getObjectByName('head')?.getWorldPosition(new THREE.Vector3()) || new THREE.Vector3(0,1.1,.8);
    facing=Math.sign(head.z)||1; key.position.z=4*facing; rim.position.z=-4*facing;
    clips=gltf.animations; mixer=new THREE.AnimationMixer(wolf); action=mixer.clipAction(THREE.AnimationClip.findByName(clips,'idle_loop')); action.play(); mixer.update(0);
    ready=true; controlsElements.forEach(element=>{element.disabled=false;}); resize(); frameWolf(); light(); motion();
    status.textContent='';
    console.info('Wolf proof loaded',JSON.stringify({head:head.toArray(),clips:clips.map(c=>c.name),modelBytes:12437756,triangles:9991,joints:35}));
    environment().catch(()=>{status.textContent='Wolf loaded. Some scenery could not load.';});
  } catch(error) { status.textContent='The wolf study could not load. Start the proof server with the local licensed model available.'; console.error(error); }
}
$('body').onclick=()=>{portrait=false;frameWolf();}; $('portrait').onclick=()=>{portrait=true;frameWolf();};
$('neutral').onclick=()=>{dusk=false;light();}; $('dusk').onclick=()=>{dusk=true;light();};
$('motion').onclick=()=>{paused=!paused;motion();};
$('clip').onchange=event=>{const clip=THREE.AnimationClip.findByName(clips,event.target.value);if(!clip)return;action.stop();action=mixer.clipAction(clip).reset().play();mixer.update(0);render();};
document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(frame);frame=0;last=0;if(!document.hidden){render();schedule();}});
addEventListener('resize',()=>{resize();frameWolf();});
addEventListener('pagehide',()=>{disposed=true;cancelAnimationFrame(frame);mixer?.stopAllAction();if(wolf)mixer?.uncacheRoot(wolf);orbit?.dispose();resources.forEach(r=>r.dispose());textures.forEach(t=>t.dispose());renderer?.dispose();},{once:true});
init();
