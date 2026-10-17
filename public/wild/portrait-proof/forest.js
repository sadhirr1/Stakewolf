import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// Scene changes render on demand. Worker lantern journeys run for four seconds,
// capped at 30fps, then stop. They are activity markers, not character models.
const canvas=document.querySelector('#forest');
const host=document.querySelector('.environment');
const status=document.querySelector('#scene-status');
const stage=document.querySelector('.encounter');
let renderer,scene,camera,observer,stateObserver,disposed=false,loaded=false,suspended=false;
let sun,ambient,gate,slackLine,tautLine,crates,lanterns=[],frame=0,lastFrame=0,travel=4,projection=null;
const resources=new Set();
function remember(object){
  object.traverse(node=>{
    if(node.geometry)resources.add(node.geometry);
    for(const material of (Array.isArray(node.material)?node.material:[node.material]).filter(Boolean)){
      resources.add(material);
      for(const value of Object.values(material))if(value?.isTexture)resources.add(value);
    }
  });
}
function render(){
  if(!loaded||disposed||document.hidden)return;
  const {width,height}=host.getBoundingClientRect();
  if(!width||!height)return;
  renderer.setSize(width,height,false);camera.aspect=width/height;
  camera.updateProjectionMatrix();renderer.render(scene,camera);
}
const places={idle:[-.7,.9],watch:[-.65,.65],hearing:[.5,.7],escort:[-4.8,1.3],crossing:[1.25,-2.5],stores:[-2.65,-1.5]};
function locateWorkers(){
  for(let i=0;i<lanterns.length;i++){
    const job=projection?.jobs[i]||'idle',target=places[job]||places.idle,progress=job==='idle'||job==='watch'||job==='hearing'?1:Math.min(travel/4,1);
    const t=progress*progress*(3-2*progress),offset=i*.28;
    lanterns[i].position.set(-.7+(target[0]+.7)*t+offset,.38+(progress<1?Math.sin(progress*26+i)*.035:0),.9+(target[1]-.9)*t+offset);
  }
}
function stopTravel(){if(frame)cancelAnimationFrame(frame);frame=0;lastFrame=0;}
function animate(time){
  frame=0;if(!loaded||disposed||suspended||document.hidden||stage.dataset.motion!=='playing')return;
  if(!lastFrame)lastFrame=time;
  const delta=time-lastFrame;
  if(delta>=1000/30){travel=Math.min(4,travel+Math.min(delta/1000,.1));lastFrame=time;locateWorkers();render();}
  if(travel<4)frame=requestAnimationFrame(animate);
}
function syncWorld(){
  if(!loaded||disposed)return;
  let next;try{next=JSON.parse(stage.dataset.world||'null');}catch{return;}
  if(!next)return;
  const changed=JSON.stringify(next)!==JSON.stringify(projection);
  if(changed){
    projection=next;travel=next.phase==='dispatched'||next.phase==='morning-dispatched'?0:4;
    // Reduced motion and paused initial loads show the assigned destination immediately.
    if(stage.dataset.motion!=='playing')travel=4;
    gate.rotation.y=next.crossing==='open'?-Math.PI/2:0;
    slackLine.visible=next.crossing==='damaged';tautLine.visible=!slackLine.visible;
    crates.position.set(-2.65,next.stores==='protected'?.36:0,next.stores==='protected'?.5:-1.5);
    const night=next.light==='night',noon=next.light==='noon',morning=next.light==='morning';
    scene.background.set(night?0x111f2c:noon?0x67877b:morning?0x60766a:0x304b46);scene.fog.color.copy(scene.background);
    sun.intensity=night?.45:noon?3.1:morning?2.8:2.5;ambient.intensity=night?.65:noon?2.5:2.1;
    sun.color.set(morning?0xffd09a:night?0x9fbcd5:0xffdfae);locateWorkers();
  }
  const overview=stage.dataset.overview==='true';
  camera.position.set(overview?0:0,overview?5.4:1.65,overview?9.5:5.5);camera.lookAt(0,overview?.1:1.8,overview?-1.7:-2);
  stopTravel();render();if(travel<4&&!document.hidden&&!suspended&&stage.dataset.motion==='playing')frame=requestAnimationFrame(animate);
}
function buildWorksites(){
  const root=new THREE.Group();scene.add(root);
  const wood=new THREE.MeshStandardMaterial({color:0x5f5036,roughness:1}),edge=new THREE.MeshStandardMaterial({color:0x918064,roughness:1}),rope=new THREE.MeshStandardMaterial({color:0xd2b487,roughness:1});
  const box=(w,h,d,material,x,y,z,parent=root)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);parent.add(mesh);return mesh;};
  box(24,.025,2.6,new THREE.MeshStandardMaterial({color:0x28484c,metalness:.2,roughness:.25}),0,.025,-3.4);
  for(let i=0;i<13;i++)box(1.25,.1,.26,wood,1.3,.16,-1.45-i*.29);
  for(const x of [.6,2])for(const z of [-1.3,-5.05])box(.12,.85,.12,wood,x,.48,z);
  const line=sag=>new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(.6,.85,-1.3),new THREE.Vector3(.6,sag,-3.2),new THREE.Vector3(.6,.85,-5.05)]),12,.023,5,false),rope);
  slackLine=line(.2);tautLine=line(.72);root.add(slackLine,tautLine);
  gate=new THREE.Group();gate.position.set(.6,.6,-1.2);root.add(gate);box(1.35,.09,.09,edge,.67,0,0,gate);
  box(.28,.3,.015,new THREE.MeshStandardMaterial({color:0x9f533c,roughness:1}),.8,-.03,.07,gate);
  // Raised northern platform and movable stores share one physical location.
  box(1.55,.3,1.1,wood,-2.65,.15,.5);
  crates=new THREE.Group();root.add(crates);
  for(const [x,z]of [[-.23,0],[.25,.12]]){
    box(.42,.42,.42,edge,x,.21,z,crates);box(.44,.045,.44,wood,x,.1,z,crates);box(.44,.045,.44,wood,x,.32,z,crates);
  }
  for(let i=0;i<2;i++){
    const lantern=new THREE.Group();root.add(lantern);lanterns.push(lantern);
    box(.1,.2,.1,new THREE.MeshStandardMaterial({color:0xffd68c,emissive:0xffa844,emissiveIntensity:2}),0,0,0,lantern);
    box(.16,.035,.16,wood,0,.12,0,lantern);box(.16,.035,.16,wood,0,-.12,0,lantern);
    const glow=new THREE.PointLight(0xffb858,1.3,2.3,2);lantern.add(glow);
  }
  remember(root);
}
async function buildForest(){
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  scene=new THREE.Scene();scene.background=new THREE.Color(0x304b46);scene.fog=new THREE.FogExp2(0x304b46,.065);
  camera=new THREE.PerspectiveCamera(39,1,.1,90);camera.position.set(0,1.65,5.5);camera.lookAt(0,1.8,-2);
  ambient=new THREE.HemisphereLight(0xc2d4ce,0x313924,2.1);scene.add(ambient);
  sun=new THREE.DirectionalLight(0xffdfae,2.5);sun.position.set(-5,8,2);scene.add(sun);
  const rim=new THREE.DirectionalLight(0x98c6cf,1.4);rim.position.set(4,5,-8);scene.add(rim);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(70,70),new THREE.MeshStandardMaterial({color:0x88927a,roughness:1,normalScale:new THREE.Vector2(.25,.25)}));
  ground.rotation.x=-Math.PI/2;scene.add(ground);remember(ground);
  buildWorksites();
  const textureLoader=new THREE.TextureLoader(),loader=new GLTFLoader();
  let failures=0;
  await Promise.all([
    (async()=>{
      const maps=await Promise.allSettled(['diffuse','normal','arm'].map(async name=>{
        const map=await textureLoader.loadAsync(`/wild/assets/forest-floor/${name}.jpg`);
        if(disposed){map.dispose();return null;}
        resources.add(map);map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(16,16);map.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),4);
        return map;
      }));
      if(disposed)return;
      const [diffuse,normal,arm]=maps.map(result=>result.status==='fulfilled'?result.value:null);
      failures+=maps.filter(result=>result.status==='rejected').length;
      if(diffuse){diffuse.colorSpace=THREE.SRGBColorSpace;ground.material.map=diffuse;}
      if(normal)ground.material.normalMap=normal;if(arm)ground.material.roughnessMap=arm;
      ground.material.needsUpdate=true;
    })(),
    ...[
      ['pine/pine.gltf',[[-3.3,-1,8,1],[4.8,-3.5,10,2],[-5.8,-5,12,3],[-1.8,-8,11,2],[1.1,-11,14,1],[6,-9,12,4],[7,-3,9,2],[-8,-1,10,4],[-4.3,-14,14,2],[4,-16,15,1]]],
      ['rock-moss/rock-moss.gltf',[[-4,2,.65,1],[3.4,-1,.5,3]]],
      ['fern/fern.gltf',[[-4,1.5,.65,2],[3,1.5,.6,1],[-3.8,-2,.65,3],[3.4,-3,.7,2]]]
    ].map(async([path,spots])=>{
      try{
        const {scene:model}=await loader.loadAsync(`/wild/assets/${path}`);
        remember(model);
        if(disposed){for(const resource of resources)resource.dispose();resources.clear();return;}
        const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
        for(const [x,z,height,yaw]of spots){
          const clone=model.clone(true),group=new THREE.Group();
          clone.position.sub(new THREE.Vector3(center.x,bounds.min.y,center.z));group.add(clone);
          group.scale.setScalar(height/size.y);group.position.set(x,0,z);group.rotation.y=yaw;scene.add(group);
        }
      }catch{failures++;}
    })
  ]);
  if(disposed)return;
  loaded=true;syncWorld();stage.classList.add('forest-ready');
  status.textContent=failures?'Some forest details are unavailable. Work and decisions remain available in text.':'Existing forest · lanterns indicate worker activity';
  observer=new ResizeObserver(render);observer.observe(host);
  stateObserver=new MutationObserver(syncWorld);stateObserver.observe(stage,{attributes:true,attributeFilter:['data-world','data-motion','data-overview']});
}
canvas.addEventListener('webglcontextlost',event=>{
  event.preventDefault();stopTravel();loaded=false;stage.classList.remove('forest-ready');
  status.textContent='The forest renderer stopped. Your portrait remains visible; reload to restore the trees.';
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopTravel();else syncWorld();});
window.addEventListener('pageshow',()=>{suspended=false;syncWorld();});
window.addEventListener('pagehide',event=>{
  suspended=true;stopTravel();
  if(event.persisted)return;
  disposed=true;observer?.disconnect();stateObserver?.disconnect();for(const resource of resources)resource.dispose();resources.clear();renderer?.dispose();
});
buildForest().catch(()=>{
  status.textContent='3D forest unavailable on this device. The portrait is shown against a simple atmospheric background.';
});
