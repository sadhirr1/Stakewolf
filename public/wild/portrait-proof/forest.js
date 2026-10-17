import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// The forest renders only after loading or resizing. Gentle movement is handled
// by composited CSS layers, not a perpetual WebGL loop or a simulated face rig.
const canvas=document.querySelector('#forest');
const host=document.querySelector('.environment');
const status=document.querySelector('#scene-status');
let renderer,scene,camera,observer,disposed=false,loaded=false;
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
async function buildForest(){
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  scene=new THREE.Scene();scene.background=new THREE.Color(0x304b46);scene.fog=new THREE.FogExp2(0x304b46,.065);
  camera=new THREE.PerspectiveCamera(39,1,.1,90);camera.position.set(0,1.65,5.5);camera.lookAt(0,1.8,-2);
  scene.add(new THREE.HemisphereLight(0xc2d4ce,0x313924,2.1));
  const key=new THREE.DirectionalLight(0xffdfae,2.5);key.position.set(-5,8,2);scene.add(key);
  const rim=new THREE.DirectionalLight(0x98c6cf,1.4);rim.position.set(4,5,-8);scene.add(rim);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(70,70),new THREE.MeshStandardMaterial({color:0x88927a,roughness:1,normalScale:new THREE.Vector2(.25,.25)}));
  ground.rotation.x=-Math.PI/2;scene.add(ground);remember(ground);
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
      ['pine/pine.gltf',[[-3.3,-1,8,1],[3.2,-2.3,10,2],[-5.8,-5,12,3],[-1.8,-8,11,2],[1.1,-11,14,1],[6,-9,12,4],[7,-3,9,2],[-8,-1,10,4],[-4.3,-14,14,2],[4,-16,15,1]]],
      ['rock-moss/rock-moss.gltf',[[-2.2,1,.65,1],[2.5,-1,.5,3]]],
      ['fern/fern.gltf',[[-1.9,2,.65,2],[2.1,1,.6,1],[-2.7,-2,.65,3],[3,-3,.7,2]]]
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
  loaded=true;render();document.querySelector('.encounter').classList.add('forest-ready');
  status.textContent=failures?'Some forest details are unavailable. The portrait preview remains usable.':'Existing forest assets · no new character generation';
  observer=new ResizeObserver(render);observer.observe(host);
}
canvas.addEventListener('webglcontextlost',event=>{
  event.preventDefault();loaded=false;document.querySelector('.encounter').classList.remove('forest-ready');
  status.textContent='The forest renderer stopped. Your portrait remains visible; reload to restore the trees.';
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)render();});
window.addEventListener('pageshow',render);
window.addEventListener('pagehide',event=>{
  if(event.persisted)return;
  disposed=true;observer?.disconnect();for(const resource of resources)resource.dispose();resources.clear();renderer?.dispose();
});
buildForest().catch(()=>{
  status.textContent='3D forest unavailable on this device. The portrait is shown against a simple atmospheric background.';
});
