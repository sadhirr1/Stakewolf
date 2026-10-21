import { mountScene } from './scenes.js';

const worlds = [
  {slug:'afterlight',name:'Afterlight',title:'After<em>light.</em>',type:'A PLACE YOU ENTER',kicker:"FOLLOW WHAT’S MISSING.",summary:'A forest that reveals itself through attention. The path you illuminate changes what remains in the dark.',action:'Send a lantern',label:'Lantern reach',hint:'Move across the clearing, or change the light here.',note:'A lantern, a clearing, an unanswered question.',headline:'The world is the interface.',experience:'You discover places, notice absences and decide where to put your attention. The environment carries the tension before anyone speaks.',cost:'A strong environment, deliberate camera work and a few convincing characters. The most demanding route for art production.',feedback:['A light crosses the clearing. Something answers beyond the trees.','Another lantern leaves the path. The dark has edges now.','The forest holds its breath. You have made yourself visible.']},
  {slug:'the-verdict',name:'The Verdict',title:'The <em>Verdict.</em>',type:'A STAGE THAT TAKES SIDES',kicker:'TWO STORIES. ONE FACE.',summary:'A graphic confrontation where claims occupy physical space. Shift the balance and watch a different version of the same person emerge.',action:'Challenge the account',label:'Balance of belief',hint:'Drag the balance between two opposing accounts.',note:'Neither side owns the whole picture.',headline:'Doubt becomes a physical act.',experience:'A theatrical close-up, stark typography and portraits that fracture under scrutiny. You confront contradictions by pulling competing accounts apart.',cost:'A tightly directed portrait collection, expressive transitions and excellent writing later. Strong presence without a fully rigged cast.',feedback:['The first account fractures. The competing version moves into view.','The mask shifts again. A convincing story is still only one side.','The confrontation resets its balance. Look at what changed.']},
  {slug:'chorus',name:'Chorus',title:'<em>Chorus.</em>',type:'A WORLD THAT GROWS',kicker:'NOBODY ACTS ALONE.',summary:'The community is a living organism. Grow one connection and watch the shape of the whole change around it.',action:'Grow a connection',label:'Collective pressure',hint:'Change the pressure. Add a connection. Watch the system respond.',note:'An ecosystem of influence, not a room full of avatars.',headline:'The characters are the system.',experience:'People become living forms with visible relationships. Trust, work and influence could reshape a shared organism instead of filling a dashboard.',cost:'A distinctive visual language and a small, legible simulation. Less character modelling; more care making the effects understandable.',feedback:['A new connection joins the chorus. The whole form adjusts.','Another relationship takes root. Growth changes the balance.','The network reaches further. More connections mean more dependencies.']},
  {slug:'cabinet',name:'Cabinet of Motives',title:'Cabinet <em>of motives.</em>',type:'A MYSTERY YOU HANDLE',kicker:'EVERY OBJECT KEEPS SOMETHING.',summary:'A strange collection of instruments, keepsakes and evidence. Rotate, align and open objects to discover the people behind them.',action:'Turn the mechanism',label:'Ring alignment',hint:'Align the rings, or turn the mechanism one step.',note:'A small object can carry an entire world.',headline:'Objects do the storytelling.',experience:'A tactile cabinet replaces the conventional menu. The player handles an instrument, a seal or a letter and discovers a perspective hidden inside it.',cost:'A few beautifully made objects, satisfying motion and sound. A practical way to achieve a distinctive portfolio piece with a small asset set.',feedback:['The outer ring advances. A different alignment comes into focus.','The mechanism turns again. Each layer conceals another reading.','Another turn exposes the centre. The object rewards attention.']},
  {slug:'dead-air',name:'Dead Air',title:'Dead <em>air.</em>',type:'A SIGNAL YOU SHOULD NOT HEAR',kicker:'SOMEONE IS STILL TRANSMITTING.',summary:'An abandoned listening station. Tune through interference, trace a source and decide which fragment deserves your attention.',action:'Send a pulse',label:'Receiver frequency',hint:'Tune toward the quiet band. Send a pulse into the field.',note:'For this first study, the signal is visual. No sound required.',headline:'Listening becomes exploration.',experience:'A visual radio thriller built from frequencies, traces and competing transmissions. Characters could first exist as voices and partial signals.',cost:'Careful sound design and a fully readable visual equivalent. Faces can appear sparingly; atmosphere comes from timing and uncertainty.',feedback:['A pulse leaves the station. Watch for the returning trace.','Another pulse cuts through the interference. The pattern has shifted.','The receiver answers in fragments. Keep tuning.']}
];
const $ = id => document.getElementById(id);
const media = matchMedia('(prefers-reduced-motion: reduce)');
let paused = media.matches;
let current = 0;
let scene;
let favourite = null;
let persistentStorage = true;
let actions = 0;
const values = worlds.map(() => 50);
try { const stored = localStorage.getItem('stakewolf-five-worlds-favourite'); if(worlds.some(w=>w.slug===stored)) favourite=stored; } catch {}
const byHash = () => worlds.findIndex(w => `#${w.slug}` === location.hash);
function updateSaved(){
  const selected = favourite === worlds[current].slug;
  $('save-world').setAttribute('aria-pressed',String(selected));
  $('save-world').innerHTML = `<span aria-hidden="true">${selected?'★':'☆'}</span> ${selected?'Direction kept':'Keep this direction'}`;
  $('saved-note').textContent = favourite ? `${worlds.find(w=>w.slug===favourite).name} is your current favourite${persistentStorage?' on this device':' for this visit only; browser storage is unavailable'}. You can change it at any time.` : 'No favourite yet. Keep a direction above to remember it on this device.';
}
function startScene(){
  scene?.destroy();
  scene=mountScene($('scene'),current,{reducedMotion:paused,onChange:state=>{
    values[current]=state.value;
    $('world-value').value=state.value;
    $('value-output').textContent=Math.round(state.value);
  }});
  scene.setValue(values[current]);
}
function selectWorld(index, changeHash=false){
  if(index<0||index>=worlds.length)return;
  current=index; actions=0;
  const w=worlds[index];
  $('stage').dataset.theme=index;
  $('world-title').innerHTML=w.title;
  const fields={'world-type':'type','world-kicker':'kicker','world-summary':'summary','value-label':'label','interaction-hint':'hint','scene-note':'note','detail-headline':'headline','detail-experience':'experience','detail-cost':'cost'};
  for(const [id,key] of Object.entries(fields))$(id).textContent=w[key];
  $('world-action').innerHTML=`${w.action} <span aria-hidden="true">↗</span>`;
  $('world-number').textContent=`WORLD 0${index+1} / 05`;
  $('live-status').textContent=`${w.name} selected. ${w.hint}`;
  document.querySelectorAll('[data-world]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.world)===index)));
  startScene();updateSaved();
  if(changeHash)history.replaceState(null,'',`#${w.slug}`);
}
document.querySelectorAll('[data-world]').forEach(b=>b.addEventListener('click',()=>selectWorld(Number(b.dataset.world),true)));
document.querySelectorAll('[data-jump]').forEach(b=>b.addEventListener('click',()=>{
  selectWorld(Number(b.dataset.jump),true);
  $('worlds').scrollIntoView({behavior:paused?'instant':'smooth'});
  document.querySelector(`[data-world="${current}"]`).focus({preventScroll:true});
}));
$('world-value').addEventListener('input',e=>scene.setValue(Number(e.target.value)));
$('world-action').addEventListener('click',()=>{
  scene.action();
  actions++;
  $('live-status').textContent=current===2&&actions%6===0?'The chorus returns to its seed form. Grow a new set of connections.':worlds[current].feedback[(actions-1)%3];
});
$('save-world').addEventListener('click',()=>{
  favourite=favourite===worlds[current].slug?null:worlds[current].slug;
  let persisted=true;
  try { favourite?localStorage.setItem('stakewolf-five-worlds-favourite',favourite):localStorage.removeItem('stakewolf-five-worlds-favourite'); } catch { persisted=false; }
  persistentStorage=persisted;
  updateSaved();
  $('live-status').textContent=favourite?`${worlds[current].name} kept${persisted?' on this device':' for this visit; browser storage is unavailable'}.`:'Saved direction cleared.';
  if(!persisted)$('saved-note').textContent=favourite?`${worlds[current].name} kept for this visit only. Browser storage is unavailable.`:'No favourite selected.';
});
function updateMotion(){
  $('motion').setAttribute('aria-pressed',String(paused));
  $('motion').innerHTML=paused?'Motion paused <span aria-hidden="true">▷</span>':'Pause motion <span aria-hidden="true">Ⅱ</span>';
}
$('motion').addEventListener('click',()=>{paused=!paused;updateMotion();scene.setReducedMotion(paused);$('live-status').textContent=paused?'Motion paused. The controls still work.':'Ambient motion resumed.';});
media.addEventListener('change',e=>{paused=e.matches;updateMotion();scene.setReducedMotion(paused);});
window.addEventListener('hashchange',()=>{const n=byHash();if(n>=0&&n!==current)selectWorld(n);});
window.addEventListener('pagehide',()=>scene?.destroy());
window.addEventListener('pageshow',e=>{if(e.persisted)startScene();});
updateMotion();selectWorld(Math.max(0,byHash()));
