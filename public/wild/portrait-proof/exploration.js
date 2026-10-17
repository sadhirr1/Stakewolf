import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// Presentation-only study. It neither imports the encounter rules nor accesses its save.
const VIEWS={
  council:{name:'Council fire',index:'01 / THE CLEARING',title:'The Hollow.',detail:'Step into the clearing. Choose a person or a place to move closer.',position:[0,2.85,10.4],target:[0,1.3,-1.1],fov:46},
  orin:{name:'Orin',index:'02 / BY THE FIRE',title:'Orin.',detail:'At the edge of the firelight. Look around, then choose where to go next.',position:[-1.5,1.82,2.3],target:[-2.1,1.72,-1.2],fov:37},
  sera:{name:'Sera',index:'03 / AT THE TREE LINE',title:'Sera.',detail:'Beneath the pines, where the river meets the clearing.',position:[2.1,1.83,2.6],target:[2.65,1.72,-1.2],fov:37},
  river:{name:'Riverbank',index:'04 / BEYOND THE CLEARING',title:'Follow the water.',detail:'Mist hangs over the river. The crossing leads deeper into the trees.',position:[-2.3,1.6,-3.5],target:[1,.8,-9.8],fov:52},
  shelter:{name:'Shelter',index:'05 / UNDER THE CANOPY',title:'A little shelter.',detail:'Canvas, timber and lamplight. A quiet corner of the world to return to.',position:[5.8,1.9,4.1],target:[5.7,1.3,-1.6],fov:49}
};
const stage=document.querySelector('#world'),canvas=document.querySelector('#landscape'),status=document.querySelector('#world-status');
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),narrow=matchMedia('(max-width: 760px)');
const motionButton=document.querySelector('#motion'),resources=new Set(),actors=[],ferns=[],embers=[],hotspots=new Map();
const textureLoader=new THREE.TextureLoader(),loader=new GLTFLoader();
let renderer,scene,camera,sun,fill,firelight,water,smoke,flame,ground,woodMaterial,shadowMapDirty=true;
let disposed=false,suspended=false,loaded=false,userPaused=false,frame=0,last=0,clock=0,current='council',light='moon',transition=null,observer;
const look=new THREE.Vector3(),base=new THREE.Vector3(),pointer=new THREE.Vector2(),pointerSmooth=new THREE.Vector2();
const temporary=new THREE.Vector3();
function remember(object){object.traverse(node=>{if(node.geometry)resources.add(node.geometry);for(const material of(Array.isArray(node.material)?node.material:[node.material]).filter(Boolean)){resources.add(material);for(const value of Object.values(material))if(value?.isTexture)resources.add(value);}});return object;}
function material(color,extra={}){const m=new THREE.MeshStandardMaterial({color,roughness:.93,...extra});resources.add(m);return m;}
function mesh(geometry,mat,position,parent=scene){resources.add(geometry);const m=new THREE.Mesh(geometry,mat);m.position.set(...position);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function beam(a,b,radius,mat,parent=scene){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);const m=mesh(new THREE.CylinderGeometry(radius,radius*1.12,delta.length(),7),mat,start.clone().add(end).multiplyScalar(.5).toArray(),parent);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;}
function softTexture(){const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(32,32,1,32,32,31);g.addColorStop(0,'#fff');g.addColorStop(.25,'#fff9');g.addColorStop(1,'#fff0');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);const t=new THREE.CanvasTexture(c);resources.add(t);return t;}
function cameraPose(key){const v=VIEWS[key],position=new THREE.Vector3(...v.position),target=new THREE.Vector3(...v.target);if(narrow.matches){if(key==='orin'||key==='sera'){position.z+=1.4;target.y=1.65;}else position.z+=2;}return{position,target,fov:v.fov+(narrow.matches?9:0)};}
function motionAllowed(){return !userPaused&&!reduced.matches;}
function setPlace(key){
  if(!Object.hasOwn(VIEWS,key))return;
  current=key;const v=VIEWS[key];stage.dataset.place=key;
  document.querySelector('#location-mark').textContent=v.name.toUpperCase();document.querySelector('#scene-index').textContent=v.index;document.querySelector('#place-name').innerHTML=v.title;document.querySelector('#place-detail').textContent=v.detail;
  for(const button of document.querySelectorAll('.journey button')){if(button.dataset.destination===key)button.setAttribute('aria-current','location');else button.removeAttribute('aria-current');}
  document.querySelector('#travel-status').textContent=`${v.name}. ${v.detail}`;
  if(!camera)return;
  const pose=cameraPose(key);pointer.set(0,0);pointerSmooth.set(0,0);
  if(loaded&&motionAllowed()&&!document.hidden){transition={start:clock,from:base.clone(),target:look.clone(),fov:camera.fov,to:pose};stage.dataset.moving='true';}
  else{base.copy(pose.position);look.copy(pose.target);camera.fov=pose.fov;transition=null;stage.dataset.moving='false';}
  for(const actor of actors)actor.visible=key==='council'||actor.userData.key===key;
  draw();schedule();
}
function setLight(key){
  light=key==='dawn'?'dawn':'moon';stage.dataset.light=light;
  document.querySelector('#moon').setAttribute('aria-pressed',String(light==='moon'));document.querySelector('#dawn').setAttribute('aria-pressed',String(light==='dawn'));
  if(!scene)return;
  const dawn=light==='dawn';scene.background.set(dawn?0x71847b:0x182e36);scene.fog.color.copy(scene.background);scene.fog.density=dawn?.034:.043;
  sun.color.set(dawn?0xffd19e:0x9ecfef);sun.intensity=dawn?3.2:1.65;sun.position.set(dawn?-9:4,dawn?9:13,-10);
  fill.intensity=dawn?1.8:1;fill.color.set(dawn?0xc6d5bc:0x8dafc5);
  for(const actor of actors)actor.material.color.set(dawn?0xc9cab5:0x8b9f9f);
  if(water){water.material.uniforms.waterColor.value.set(dawn?0x536e69:0x22373b);water.material.uniforms.shine.value.set(dawn?0xd7b890:0x8dbecc);water.material.uniforms.mist.value.copy(scene.background);}
  shadowMapDirty=true;draw();
}
function syncMotion(){
  const allowed=motionAllowed();stage.dataset.motion=allowed?'playing':'paused';
  motionButton.disabled=reduced.matches;motionButton.textContent=reduced.matches?'Reduced motion':userPaused?'Resume motion':'Pause motion';motionButton.setAttribute('aria-pressed',String(!allowed));
  if(!allowed){pointer.set(0,0);pointerSmooth.set(0,0);if(transition){const pose=transition.to;base.copy(pose.position);look.copy(pose.target);camera.fov=pose.fov;transition=null;stage.dataset.moving='false';}}
  stop();draw();schedule();
}
function stop(){if(frame)cancelAnimationFrame(frame);frame=0;last=0;}
function schedule(){if(!frame&&loaded&&!disposed&&!suspended&&!document.hidden&&motionAllowed())frame=requestAnimationFrame(tick);}
function tick(time){
  frame=0;if(!loaded||disposed||suspended||document.hidden||!motionAllowed())return;
  if(!last)last=time;
  if(time-last>=1000/30){const delta=Math.min((time-last)/1000,.06);last=time;clock+=delta;
    if(transition){const p=Math.min(1,(clock-transition.start)/1.7),t=p*p*(3-2*p);base.lerpVectors(transition.from,transition.to.position,t);look.lerpVectors(transition.target,transition.to.target,t);camera.fov=THREE.MathUtils.lerp(transition.fov,transition.to.fov,t);if(p===1){transition=null;stage.dataset.moving='false';}}
    pointerSmooth.lerp(pointer,.065);
    firelight.intensity=17+Math.sin(clock*5.1)*1.2+Math.sin(clock*8.3)*.7;
    water.material.uniforms.time.value=clock;
    flame.material.uniforms.time.value=clock;
    for(let i=0;i<embers.length;i++){const e=embers[i],p=(clock*.2+i*.093)%1;e.position.set(Math.sin(i*13+clock*.7)*(.12+p*.24),.35+p*1.5,Math.cos(i*7+clock*.4)*.18);e.material.opacity=(1-p)*.7;}
    for(let i=0;i<smoke.children.length;i++){const s=smoke.children[i],p=(clock*.045+i*.19)%1;s.position.set(Math.sin(p*3+i)*p*.38,.35+p*2.5,-p*.24);s.scale.setScalar(.35+p*1.3);s.material.opacity=Math.sin(p*Math.PI)*.12;}
    for(let i=0;i<ferns.length;i++)ferns[i].rotation.z=Math.sin(clock*.65+i)*.009;
    draw();
  }schedule();
}
function draw(){
  if(!loaded||disposed||suspended||document.hidden)return;
  camera.position.copy(base);if(motionAllowed()&&!transition){camera.position.x+=pointerSmooth.x*.16;camera.position.y+=pointerSmooth.y*.07;}
  camera.lookAt(look);camera.updateProjectionMatrix();
  for(const actor of actors)if(actor.visible)actor.rotation.y=Math.atan2(camera.position.x-actor.position.x,camera.position.z-actor.position.z);
  if(shadowMapDirty){renderer.shadowMap.needsUpdate=true;shadowMapDirty=false;}
  renderer.render(scene,camera);
  for(const [button,point] of hotspots){temporary.copy(point).project(camera);const visible=current==='council'&&!transition&&temporary.z>-1&&temporary.z<1&&Math.abs(temporary.x)<.94&&Math.abs(temporary.y)<.8;button.hidden=!visible;if(visible)button.style.transform=`translate(${(temporary.x*.5+.5)*canvas.clientWidth}px,${(-temporary.y*.5+.5)*canvas.clientHeight}px) translate(-50%,-50%)`;}
}
function resize(){if(!renderer||disposed)return;const rect=stage.getBoundingClientRect();renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();if(loaded){const pose=cameraPose(current);base.copy(pose.position);look.copy(pose.target);camera.fov=pose.fov;transition=null;stage.dataset.moving='false';draw();}}
function buildPlace(){
  const wood=material(0x807159),darkWood=material(0x302e24),iron=material(0x252b29,{metalness:.65,roughness:.5}),canvasMat=material(0x7a7560,{side:THREE.DoubleSide});woodMaterial=wood;
  const floor=new THREE.PlaneGeometry(90,90,128,128);floor.rotateX(-Math.PI/2);
  for(let i=0;i<floor.attributes.position.count;i++){const x=floor.attributes.position.getX(i),z=floor.attributes.position.getZ(i),riverDip=Math.exp(-(((z+8.5-Math.sin(x*.17)*.7)/2.5)**2))*.8;floor.attributes.position.setY(i,Math.sin(x*.47)*Math.cos(z*.3)*.09-riverDip);}
  floor.computeVertexNormals();ground=mesh(floor,material(0x777866),[0,-.08,0]);ground.castShadow=false;
  // Hand-built staging props are separate from the retained scanned vegetation.
  for(let i=0;i<5;i++){const a=i*Math.PI/2.5;beam([Math.cos(a)*.4,.12,Math.sin(a)*.4],[-Math.cos(a)*.33,.28,-Math.sin(a)*.33],.07,darkWood);}
  const coal=mesh(new THREE.SphereGeometry(.3,12,6),material(0xd76115,{emissive:0xff510b,emissiveIntensity:2}),[0,.1,0]);coal.scale.y=.25;coal.castShadow=false;
  const fireMaterial=new THREE.ShaderMaterial({uniforms:{time:{value:0}},transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,vertexShader:'varying vec2 uvFire; void main(){uvFire=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float time; varying vec2 uvFire; void main(){float y=uvFire.y;float x=(uvFire.x-.5)*2.+sin(y*10.-time*4.)*.07*y;float width=.43*(1.-y)+.015;float core=1.-smoothstep(width*.2,width,abs(x));float taper=1.-smoothstep(.45,.96,y+sin(time*3.+y*12.)*.09);float a=core*taper*.85;vec3 c=mix(vec3(1.,.64,.22),vec3(.8,.15,.025),y);gl_FragColor=vec4(c,a);}' });resources.add(fireMaterial);
  flame=mesh(new THREE.PlaneGeometry(.85,.95),fireMaterial,[0,.52,0]);flame.castShadow=false;const otherFlame=mesh(new THREE.PlaneGeometry(.7,.83),fireMaterial,[0,.46,.02]);otherFlame.rotation.y=Math.PI/2;otherFlame.castShadow=false;
  smoke=new THREE.Group();scene.add(smoke);const puff=softTexture();
  for(let i=0;i<6;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:puff,color:0x9babb0,opacity:.06,transparent:true,depthWrite:false}));resources.add(s.material);s.position.set(i*.03,.5+i*.4,0);s.scale.setScalar(.6+i*.2);smoke.add(s);}
  for(let i=0;i<11;i++){const spark=new THREE.Sprite(new THREE.SpriteMaterial({map:puff,color:0xffb84b,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));spark.scale.setScalar(.022+i%3*.008);spark.position.set(Math.sin(i)*.2,.3+i*.1,0);resources.add(spark.material);embers.push(spark);scene.add(spark);}
  firelight=new THREE.PointLight(0xffb45b,18,8,2);firelight.position.set(0,.65,0);scene.add(firelight);
  for(const [x,z,angle]of[[-2.1,.2,.14],[2.8,.3,-.12],[-.5,2.4,1.55]]){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=angle;scene.add(g);beam([-.9,.28,0],[.9,.28,0],.19,wood,g);beam([-.65,0,-.18],[-.65,.25,.2],.1,darkWood,g);beam([.65,0,-.18],[.65,.25,.2],.1,darkWood,g);}
  water=mesh(new THREE.PlaneGeometry(80,5.4,96,4),new THREE.ShaderMaterial({uniforms:{time:{value:0},waterColor:{value:new THREE.Color(0x142d38)},shine:{value:new THREE.Color(0x8dbecc)},mist:{value:new THREE.Color(0x182e36)}},vertexShader:'varying vec3 p; void main(){vec4 w=modelMatrix*vec4(position,1.);p=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',fragmentShader:'uniform float time; uniform vec3 waterColor,shine,mist; varying vec3 p; float hash(vec2 v){return fract(sin(dot(v,vec2(127.1,311.7)))*43758.5453);} float noise(vec2 v){vec2 i=floor(v),f=fract(v);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);} void main(){float n=noise(vec2(p.x*1.2,p.z*16.+time*.5))*.65+noise(vec2(p.x*3.1-time*.14,p.z*32.-time*.3))*.35;float ripple=pow(max(n-.35,0.)*1.5,5.);float reflection=exp(-pow((p.x-1.)*.27,2.));vec3 c=mix(waterColor,shine,ripple*(.15+reflection*.45));c=mix(c,mist,smoothstep(8.,45.,length(p-cameraPosition)));gl_FragColor=vec4(c,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}',side:THREE.DoubleSide}),[0,-.11,-8.5]);resources.add(water.material);water.rotation.x=-Math.PI/2;water.castShadow=false;for(let i=0;i<water.geometry.attributes.position.count;i++){const x=water.geometry.attributes.position.getX(i),y=water.geometry.attributes.position.getY(i);water.geometry.attributes.position.setY(i,y-Math.sin(x*.17)*.7-Math.sin(x*.72)*.12);}
  for(let i=0;i<24;i++){const plank=mesh(new THREE.BoxGeometry(1.25,.09,.22),wood,[1.3,.02,-5.7-i*.235]);plank.rotation.z=Math.sin(i*3)*.018;}
  for(const x of [.62,1.98]){for(const z of[-5.65,-8.35,-11.2])beam([x,-.2,z],[x,.88,z],.065,wood);beam([x,.8,-5.65],[x,.78,-11.2],.024,canvasMat);}
  const shelter=new THREE.Group();shelter.position.set(5.7,0,-1.7);shelter.rotation.y=-.2;scene.add(shelter);
  for(const z of[-1.7,1.7]){beam([-1.35,0,z],[0,2.6,z],.065,wood,shelter);beam([0,2.6,z],[1.35,0,z],.065,wood,shelter);}
  beam([0,2.6,-1.9],[0,2.6,1.9],.085,wood,shelter);
  for(const side of[-1,1]){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([0,2.56,-1.8,side*1.55,.24,-1.8,side*1.55,.24,1.8,0,2.56,-1.8,side*1.55,.24,1.8,0,2.56,1.8],3));g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,1,0,0,1,1,0,1],2));g.computeVertexNormals();mesh(g,canvasMat,[0,0,0],shelter);}
  const bed=mesh(new THREE.BoxGeometry(.9,.14,1.7),material(0x373f32),[.35,.14,-.45],shelter);bed.rotation.y=.04;
  for(const [x,z]of[[4,.8],[6.7,-3.4],[-3.5,-3.9]]){beam([x,0,z],[x,1.6,z],.055,wood);const lamp=mesh(new THREE.CylinderGeometry(.09,.1,.24,8),material(0xe1b06a,{emissive:0xffb652,emissiveIntensity:2.2}),[x+.12,1.25,z]);lamp.castShadow=false;beam([x,1.6,z],[x+.26,1.6,z],.024,iron);const bulb=new THREE.PointLight(0xffbf73,4,4.5,2);bulb.position.set(x+.12,1.3,z);scene.add(bulb);}
  const points={orin:[-2.1,2.62,-1.2],sera:[2.65,2.62,-1.2],river:[1.3,.65,-5.6],shelter:[5.7,2.8,-1.7]};
  for(const b of document.querySelectorAll('.waypoint')){b.hidden=true;hotspots.set(b,new THREE.Vector3(...points[b.dataset.destination]));}
}
async function loadForest(){
  const loadMap=async(path)=>{const t=await textureLoader.loadAsync(path);if(disposed){t.dispose();return null;}resources.add(t);return t;};
  let failures=0;
  await Promise.all([
    (async()=>{try{const map=await loadMap('/wild/assets/bark/diffuse.jpg');if(disposed)return;map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(2,1);woodMaterial.map=map;woodMaterial.needsUpdate=true;}catch{failures++;}})(),
    (async()=>{const maps=await Promise.allSettled(['diffuse','normal','arm'].map(name=>loadMap(`/wild/assets/forest-floor/${name}.jpg`)));if(disposed)return;for(let i=0;i<3;i++){if(maps[i].status!=='fulfilled'){failures++;continue;}const t=maps[i].value;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(23,23);t.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),4);if(i===0){t.colorSpace=THREE.SRGBColorSpace;ground.material.map=t;}else if(i===1){ground.material.normalMap=t;ground.material.normalScale.set(.35,.35);}else ground.material.roughnessMap=t;}ground.material.needsUpdate=true;})(),
    ...[
      ['pine/pine.gltf',null,[[-4,2,10,1],[8,3,12,2],[-6,-2,14,3],[9,-5,15,1],[-7,-7,14,2],[8,-12,13,4],[-3,-14,15,1],[3,-15,16,2],[-9,-17,15,3],[12,-17,18,1],[-13,-8,16,4],[-15,-22,18,2],[-6,-25,17,3],[3,-25,18,1],[11,-27,16,4],[14,-3,15,2]]],
      ['rock-moss/rock-moss.gltf','rock_moss_set_01_rock03',[...Array.from({length:10},(_,i)=>[Math.cos(i*Math.PI/5)*.6,Math.sin(i*Math.PI/5)*.6,.17+i%3*.025,i]),...Array.from({length:10},(_,i)=>[-12+i*2.6,-11.35+Math.sin(i)*.25,.28+i%3*.16,i]),[-2.2,-.6,.42,1],[2.7,-.5,.45,3],[-4,3,.9,2],[4.5,3.3,.65,4],[-3.4,-5.6,.8,1],[3.1,-6,.6,3],[5,-10,.95,2],[-3,-12,1.2,1],[8,-2,.55,2]]],
      ['fern/fern.gltf','fern_02_b',[...Array.from({length:9},(_,i)=>[-11+i*2.8,-11.4+Math.sin(i)*.3,.45+i%3*.12,i]),[-3.5,2,1.1,1],[3.8,2.3,.9,3],[-3,-1.1,.9,2],[3.6,-1,.8,1],[-4.4,-4,.9,3],[3.6,-4.5,.85,1],[4.3,-2.8,.7,3],[7.6,-.9,.9,2],[-1,-5,.7,2],[5,3,.8,1],[-5,3,1,2]]]
    ].map(async([path,nodeName,spots])=>{try{const {scene:model}=await loader.loadAsync(`/wild/assets/${path}`);remember(model);if(disposed){for(const r of resources)r.dispose();resources.clear();return;}const source=nodeName?model.getObjectByName(nodeName):model;if(!source)throw new Error('Asset variant missing');source.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(source),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());for(const [x,z,height,yaw]of spots){const clone=source.clone(true),group=new THREE.Group();clone.position.sub(new THREE.Vector3(center.x,bounds.min.y,center.z));group.add(clone);group.scale.setScalar(height/size.y);group.position.set(x,0,z);group.rotation.y=yaw;clone.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true;}});scene.add(group);if(path.startsWith('fern'))ferns.push(group);}}catch{failures++;}}),
    ...[['orin','leader-cutout.png',-2.1],['sera','sera-cutout-v1.png',2.65]].map(async([key,file,x])=>{try{const t=await loadMap(`/portrait/${file}`);if(disposed)return;t.colorSpace=THREE.SRGBColorSpace;const m=new THREE.MeshBasicMaterial({map:t,transparent:true,alphaTest:.025,color:0x8b9f9f,side:THREE.FrontSide,depthWrite:false});m.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <alphamap_fragment>','#include <alphamap_fragment>\n diffuseColor.a *= smoothstep(0.01,0.21,vMapUv.y);');};resources.add(m);const actor=mesh(new THREE.PlaneGeometry(2.5*1084/1451,2.5),m,[x,1.27,-1.2]);actor.castShadow=false;actor.receiveShadow=false;actor.userData.key=key;actors.push(actor);actor.visible=current==='council'||current===key;}catch{failures++;}})
  ]);return failures;
}
async function init(){
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,narrow.matches?1:1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.shadowMap.autoUpdate=false;
  scene=new THREE.Scene();scene.background=new THREE.Color(0x182e36);scene.fog=new THREE.FogExp2(0x182e36,.043);camera=new THREE.PerspectiveCamera(46,1,.12,90);
  fill=new THREE.HemisphereLight(0x8dafc5,0x242718,1);scene.add(fill);sun=new THREE.DirectionalLight(0x9ecfef,1.65);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-12,right:12,top:14,bottom:-14,near:1,far:45});sun.shadow.bias=-.0007;sun.shadow.normalBias=.025;sun.position.set(4,13,-10);sun.target.position.set(0,0,-2);scene.add(sun,sun.target);
  buildPlace();const pose=cameraPose(current);base.copy(pose.position);look.copy(pose.target);camera.fov=pose.fov;resize();
  const failures=await loadForest();if(disposed)return;loaded=true;setLight(light);stage.dataset.ready='true';status.textContent=failures?'Some scene details could not load. You can still move between places.':'Explore at your own pace.';observer=new ResizeObserver(resize);observer.observe(stage);draw();schedule();
}
for(const button of document.querySelectorAll('[data-destination]'))button.addEventListener('click',()=>{
  const key=button.dataset.destination;setPlace(key);
  // The world pin disappears during travel; keep keyboard focus on a visible control.
  if(button.classList.contains('waypoint'))document.querySelector(`.journey [data-destination="${key}"]`).focus({preventScroll:true});
});
document.querySelector('#moon').addEventListener('click',()=>setLight('moon'));document.querySelector('#dawn').addEventListener('click',()=>setLight('dawn'));
motionButton.addEventListener('click',()=>{userPaused=!userPaused;syncMotion();});reduced.addEventListener('change',syncMotion);
stage.addEventListener('pointermove',event=>{if(event.pointerType!=='mouse'||narrow.matches||!motionAllowed()||event.target.closest('button,a'))return;const r=stage.getBoundingClientRect();pointer.set(THREE.MathUtils.clamp((event.clientX-r.left)/r.width*2-1,-1,1),THREE.MathUtils.clamp(1-(event.clientY-r.top)/r.height*2,-1,1));});stage.addEventListener('pointerleave',()=>pointer.set(0,0));
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();stop();loaded=false;status.textContent='The 3D view stopped. Reload to restore it; your encounter is unchanged.';});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else{draw();schedule();}});
window.addEventListener('pagehide',event=>{suspended=true;stop();if(event.persisted)return;disposed=true;observer?.disconnect();for(const r of resources)r.dispose();resources.clear();sun?.shadow.dispose();renderer?.dispose();});
window.addEventListener('pageshow',()=>{suspended=false;draw();schedule();});
syncMotion();init().catch(()=>{status.textContent='3D is unavailable here. Try another browser; your saved encounter is unchanged.';document.querySelector('#place-detail').textContent='The environment could not start on this device. Return to the encounter to keep playing.';});



