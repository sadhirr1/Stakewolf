import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

// SCRUM-36: a visual cast study only. No allegiance or gameplay state is assigned.
const $=id=>document.getElementById(id), buttons=[...document.querySelectorAll('button')];
buttons.forEach(b=>b.disabled=true);
const cast=[
 {id:'scout',file:'ashfen-ranger',name:'Dain',height:1.82,x:-.7,z:.25,yaw:.14,role:'SCOUT / PATHS & INFORMATION',description:'“I crossed the southern trail before dawn. It was clear then.”',context:'Knows the terrain. Reports what he saw.<br>What changed after he left is still unknown.'},
 {id:'guardian',file:'vale-shieldmaiden',name:'Rhea',height:1.78,x:.9,z:-.12,yaw:-.14,role:'GUARDIAN / PEOPLE & SAFETY',description:'“One safe crossing is not a promise that everyone will make it.”',context:'Responsible for getting the community across.<br>Her caution has a cost. So does being wrong.'}
];
const resources=new Set(), textures=new Set(), loader=new GLTFLoader();
let renderer,scene,camera,orbit,key,rim,hemi,ground,environmentTarget;
let ready=false,disposed=false,frame=0,last=0,view='together',neutral=false;
let paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
const own=x=>(resources.add(x),x);
function collect(root){root.traverse(n=>{if(!n.isMesh)return;own(n.geometry);for(const m of(Array.isArray(n.material)?n.material:[n.material])){own(m);for(const t of Object.values(m))if(t?.isTexture)textures.add(t);}});}
function disposeAll(){resources.forEach(r=>r.dispose());textures.forEach(t=>t.dispose());}
function render(){if(ready&&!disposed&&!document.hidden)renderer.render(scene,camera);}
function tick(time){frame=0;if(!ready||disposed||paused||document.hidden){last=0;return;}const dt=last?Math.min((time-last)/1000,.05):0;last=time;cast.forEach(c=>c.mixer.update(dt));render();frame=requestAnimationFrame(tick);}
function schedule(){if(!frame&&ready&&!disposed&&!paused&&!document.hidden){last=0;frame=requestAnimationFrame(tick);}}
function motion(){cancelAnimationFrame(frame);frame=0;last=0;$('motion').textContent=paused?'Resume motion':'Pause motion';$('motion').setAttribute('aria-pressed',String(paused));render();schedule();}
function frameCast(){
 if(!ready)return;
 const narrow=innerWidth<600, person=cast.find(c=>c.id===view);
 if(person){orbit.target.copy(person.head);orbit.target.y-=.15;camera.position.copy(orbit.target).add(new THREE.Vector3(.28,.04,1.6));camera.fov=35;}
 else{orbit.target.set(.1,1.02,0);camera.position.set(.3,1.55,narrow?6.7:5.2);camera.fov=narrow?55:38;}
 camera.setViewOffset(innerWidth,innerHeight,innerWidth>850?-innerWidth*.14:0,0,innerWidth,innerHeight);camera.updateProjectionMatrix();orbit.update();
 for(const id of ['together','scout','guardian'])$(id).setAttribute('aria-pressed',String(view===id));
 document.querySelector('.eyebrow').textContent=person?person.role:'BEFORE NIGHTFALL';
 $('title').innerHTML=person?person.name:'Two voices.<br> <i>One crossing.</i>';
 $('description').textContent=person?person.description:'The scout knows the trail. The guardian carries the risk. Neither tells you whom to trust.';
 $('context').innerHTML=person?person.context:'A community of different people.<br>Public roles. Uncertain allegiances.';render();
}
function resize(){if(!renderer)return;renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();frameCast();}
function light(){scene.background.set(neutral?0x596560:0x152a2d);scene.fog.color.copy(scene.background);hemi.intensity=neutral?1.6:1;key.color.set(neutral?0xffffff:0xffddae);key.intensity=neutral?3:2.8;rim.color.set(neutral?0xffffff:0xa8cfda);rim.intensity=neutral?1:3;scene.environmentIntensity=neutral?.5:.3;$('light').setAttribute('aria-pressed',String(neutral));$('light').textContent=neutral?'Dusk light':'Neutral light';render();}
async function loadPerson(c){
 const gltf=await loader.loadAsync(`/cast/${c.file}.glb`);collect(gltf.scene);
 if(disposed){disposeAll();return;}
 const model=gltf.scene,mixer=new THREE.AnimationMixer(model),idle=THREE.AnimationClip.findByName(gltf.animations,'idle');
 if(!idle)throw new Error(`Missing idle animation: ${c.file}`);
 mixer.clipAction(idle).play();mixer.update(0);model.updateMatrixWorld(true);
 const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
 const scale=c.height/size.y,offset=new THREE.Group(),anchor=new THREE.Group();offset.add(model);offset.position.set(-center.x,-box.min.y,-center.z);anchor.add(offset);anchor.scale.setScalar(scale);anchor.position.set(c.x,0,c.z);anchor.rotation.y=c.yaw;
 model.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true;}});scene.add(anchor);anchor.updateMatrixWorld(true);
 c.model=model;c.anchor=anchor;c.mixer=mixer;c.head=model.getObjectByName('Head')?.getWorldPosition(new THREE.Vector3())||new THREE.Vector3(c.x,c.height*.9,c.z);
 console.info('Cast loaded',JSON.stringify({id:c.id,clips:gltf.animations.map(a=>a.name),height:c.height,head:c.head.toArray()}));
}
async function scenery(){
 const textureLoader=new THREE.TextureLoader();
 const maps=await Promise.all(['diffuse','normal','arm'].map(p=>textureLoader.loadAsync(`/wild/assets/forest-floor/${p}.jpg`)));
 if(disposed){maps.forEach(m=>m.dispose());return;}
 maps.forEach(m=>{textures.add(m);m.wrapS=m.wrapT=THREE.RepeatWrapping;m.repeat.set(18,18);m.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());});maps[0].colorSpace=THREE.SRGBColorSpace;
 Object.assign(ground.material,{map:maps[0],normalMap:maps[1],roughnessMap:maps[2],needsUpdate:true});
 const entries=await Promise.allSettled(['pine/pine.gltf','rock-moss/rock-moss.gltf','fern/fern.gltf'].map(p=>loader.loadAsync(`/wild/assets/${p}`)));
 for(let i=0;i<entries.length;i++){
  const entry=entries[i];if(entry.status!=='fulfilled')continue;const model=entry.value.scene;collect(model);if(disposed)continue;
  const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
  const spots=i===0?[[-3,-4,7,1],[3.3,-5,9,2],[-6,-7,11,3],[-1,-9,10,2],[1.7,-12,13,1],[6,-11,12,4],[7,-5,8,2],[-8,-3,10,4]]:i===1?[[-2,-.7,.6,1],[2.7,-1,.4,3]]:[[-1.8,.4,.5,2],[2,-.8,.5,1],[-2.7,-2,.6,3]];
  for(const[x,z,h,yaw]of spots){const wrap=new THREE.Group(),copy=model.clone(true);copy.position.set(-center.x,-box.min.y,-center.z);wrap.add(copy);wrap.scale.setScalar(h/size.y);wrap.position.set(x,0,z);wrap.rotation.y=yaw;wrap.traverse(n=>{if(n.isMesh){n.receiveShadow=true;}});scene.add(wrap);}
 }
 if(disposed){disposeAll();return;}render();
}
async function init(){
 try{
  renderer=new THREE.WebGLRenderer({canvas:$('scene'),antialias:true});renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  scene=new THREE.Scene();scene.background=new THREE.Color(0x152a2d);scene.fog=new THREE.FogExp2(0x152a2d,.085);
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();environmentTarget=pmrem.fromScene(room,.08);scene.environment=environmentTarget.texture;room.dispose();pmrem.dispose();
  camera=new THREE.PerspectiveCamera(38,1,.05,80);orbit=new OrbitControls(camera,renderer.domElement);orbit.enablePan=false;orbit.minDistance=.75;orbit.maxDistance=9;orbit.maxPolarAngle=Math.PI*.49;orbit.addEventListener('change',render);
  ground=new THREE.Mesh(own(new THREE.PlaneGeometry(60,60)),own(new THREE.MeshStandardMaterial({color:0x4e5b47,roughness:1,normalScale:new THREE.Vector2(.2,.2)})));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
  hemi=new THREE.HemisphereLight(0xbdd5d5,0x27301e,1);scene.add(hemi);
  key=new THREE.DirectionalLight(0xffddae,2.8);key.position.set(-3,5,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-4,right:4,top:4,bottom:-4,near:.1,far:20});key.shadow.normalBias=.018;key.shadow.bias=-.0001;scene.add(key);
  rim=new THREE.DirectionalLight(0xa8cfda,3);rim.position.set(3,4,-3);scene.add(rim);
  await Promise.all(cast.map(loadPerson));if(disposed)return;
  ready=true;buttons.forEach(b=>b.disabled=false);resize();light();motion();$('status').textContent='';
  scenery().catch(()=>{if(!disposed)$('status').textContent='Characters loaded. Some scenery is unavailable.';});
 }catch(error){$('status').textContent='The study could not load. Check the local character files and restart the cast preview.';console.error(error);}
}
for(const id of ['together','scout','guardian'])$(id).onclick=()=>{view=id;frameCast();};
$('motion').onclick=()=>{paused=!paused;motion();};$('light').onclick=()=>{neutral=!neutral;light();};
addEventListener('resize',resize);
document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(frame);frame=0;last=0;if(!document.hidden){render();schedule();}});
addEventListener('pagehide',event=>{cancelAnimationFrame(frame);frame=0;last=0;if(event.persisted)return;disposed=true;cast.forEach(c=>{c.mixer?.stopAllAction();if(c.model)c.mixer?.uncacheRoot(c.model);});orbit?.dispose();disposeAll();environmentTarget?.dispose();renderer?.dispose();});
addEventListener('pageshow',event=>{if(event.persisted){render();schedule();}});
init();
