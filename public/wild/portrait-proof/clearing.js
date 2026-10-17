import {SAVE_KEY,TASKS,RECORDS,fresh,used,act,restore,result} from '/portrait/clearing-state.js';
const stage=document.querySelector('.encounter'),panel=document.querySelector('#play-panel');
const saveNotice=document.querySelector('#save-notice'),resetDialog=document.querySelector('#reset-dialog');
let state=fresh(),view='table',record=null,saveAvailable=true;
try{
  const stored=localStorage.getItem(SAVE_KEY);
  if(stored){const restored=restore(stored);if(restored)state=restored;else saveNotice.textContent='An incompatible local save could not be restored. A fresh attempt is ready.';}
}catch{saveAvailable=false;saveNotice.textContent='Saving is unavailable. Keep this tab open to retain your attempt.';}
function persist(){
  try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));saveAvailable=true;saveNotice.textContent='Progress saved on this device.';}
  catch{saveAvailable=false;saveNotice.textContent='Progress could not be saved. This attempt continues in the current tab.';}
}
const escape=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(action,label,extra='')=>`<button type="button" data-action="${action}" ${extra}>${label}</button>`;
const map=`<svg class="route-map" viewBox="0 0 440 170" role="img" aria-label="Route sketch: council clearing west of the river, crossing to the east, stores on the north path."><path class="contour" d="M0 22Q95 80 148 20T322 35T440 13M0 145Q100 85 155 145T315 129T440 155M0 101Q90 140 130 80T310 95"/><path class="river" d="M295 -10Q240 40 280 85T259 180"/><path class="trail" d="M60 116Q130 120 170 92T330 76M170 92L191 29"/><circle cx="60" cy="116" r="5"/><circle cx="191" cy="29" r="5"/><path class="bridge" d="M264 65L293 65M265 84L297 84"/><text x="20" y="146">CLEARING</text><text x="153" y="16">STORES</text><text x="315" y="71">CROSSING</text><text x="307" y="96" class="map-note">last checked yesterday</text></svg>`;
function render(focus=true){
  const previousScroll=panel.scrollTop;
  stage.dataset.phase=state.phase;
  document.querySelector('#phase-label').textContent=state.phase==='dawn'?'FIRST LIGHT':state.phase==='dispatched'?'NIGHTFALL':'DUSK';
  document.querySelector('#world-work').innerHTML=state.phase==='dispatched'||state.phase==='dawn'?Object.entries(state.crew).filter(([,n])=>n).map(([key,n])=>`<span class="work-marker ${key}"><i aria-hidden="true">${'● '.repeat(n)}</i>${escape(TASKS[key].short)}${state.phase==='dawn'?' · returned':' · crew away'}</span>`).join(''):'';
  document.querySelector('#restart-encounter').hidden=state.phase==='intro';
  if(state.phase==='intro'){
    panel.innerHTML=`<p class="eyebrow">ONE NIGHT AT THE HOLLOW</p><h1 tabindex="-1">Before the council</h1><p class="opening">The river has risen. Families are waiting beyond the crossing. The leader has promised them a way through by dawn.</p><p class="opening quiet">Two people are available. Three jobs need doing.</p>${button('start','Enter the clearing <span aria-hidden="true">→</span>','class="primary"')}<p class="small">Inspect the evidence. Give the orders. Live with what waits.</p>`;
  }else if(state.phase==='planning'&&record){
    const item=RECORDS[record];
    panel.innerHTML=`${button('close-record','← Back to the clearing','class="back"')}<p class="eyebrow">${record==='map'?'01 / ROUTE REGISTER':'02 / FIELD NOTE'}</p><h2 tabindex="-1">${escape(item.title)}</h2><p class="source">${escape(item.source)}</p>${record==='map'?map:'<div class="report-mark" aria-hidden="true">S.</div>'}<blockquote class="record-copy">${escape(item.text)}</blockquote><p class="evidence-limit">${escape(item.limit)}</p>${button('close-record','Return to the plan','class="primary"')}`;
  }else if(state.phase==='planning'){
    panel.innerHTML=`<p class="eyebrow">THE LEADER’S REQUEST</p><h2 tabindex="-1">“We can still make dawn.”</h2><p class="opening">“The route was open yesterday. Put our people on the crossing. The families are counting on us.”</p><div class="play-tabs" role="group" aria-label="Encounter views">${button('table','Evidence on the table',`aria-pressed="${view==='table'}"`)}${button('plan','Assign the crew',`aria-pressed="${view==='plan'}"`)}</div>${view==='table'?`
      <div class="evidence-items">${Object.entries(RECORDS).map(([key,item],i)=>`<button class="evidence-object" type="button" data-record="${key}"><span class="object-index">0${i+1}</span><span><strong>${escape(item.title)}</strong><small>${key==='map'?'Yesterday’s promise':'Tonight’s warning'}</small></span><span class="read-mark">${state.seen.includes(key)?'Read':'Inspect ↗'}</span></button>`).join('')}</div>${map}<p class="small">These accounts describe different moments. Neither establishes anyone’s intent.</p>${button('plan','Decide where the two people go →','class="primary"')}`:`
      <div class="capacity"><span><b>${2-used(state)}</b> of 2 people unassigned</span><span>One night’s capacity</span></div><div class="task-list">${Object.entries(TASKS).map(([key,task])=>{const selected=state.crew[key]>0,blocked=!selected&&used(state)+task.cost>2;return `<div class="crew-task"><div><h3>${escape(task.name)}</h3><p>${escape(task.detail)}</p></div><button type="button" data-task="${key}" aria-label="${selected?'Recall':'Assign'} ${task.cost} ${task.cost===1?'person':'people'}: ${escape(task.name)}" aria-pressed="${selected}" ${blocked?'disabled':''}>${selected?'Recall':task.cost===2?'Send pair':'Send one'}<small>${task.cost} ${task.cost===2?'people':'person'}</small></button></div>`;}).join('')}</div><p class="small">${2-used(state)>0?`${2-used(state)} ${2-used(state)===1?'person stays':'people stay'} in the clearing. Unassigned people do no work this night.`:'Both people are assigned. Recall a task to change the plan.'}</p><p class="commit-note">The crossing stays closed until work is checked. Orders are final for this night.</p>${button('commit','Give the orders →',`class="primary" ${used(state)===0?'disabled':''}`)}`}`;
  }else if(state.phase==='dispatched'){
    panel.innerHTML=`<p class="eyebrow">YOUR ORDERS ARE GIVEN</p><h2 tabindex="-1">Lanterns leave the clearing.</h2><p class="opening">${state.crew.repair?'Both workers take the river path with tools. The leader watches their lanterns disappear.':state.crew.inspect?'An inspector follows the river path. The leader folds yesterday’s map without looking at it.':'A worker takes the northern path to move the stores. The crossing stays closed.'}</p><ul class="dispatch-list">${Object.entries(state.crew).filter(([,n])=>n).map(([key,n])=>`<li>${escape(TASKS[key].name)} <span>${n} ${n===1?'person':'people'}</span></li>`).join('')}</ul><p class="small">${2-used(state)?'One person remains in the clearing, unassigned.':'Nobody remains available for another job tonight.'} Work is underway; no completion has been verified.</p>${button('dawn','Wait for first light →','class="primary"')}`;
  }else{
    const outcome=result(state);
    panel.innerHTML=`<p class="eyebrow">FIRST LIGHT / WHAT YOUR ORDERS LEFT BEHIND</p><h2 tabindex="-1">${escape(outcome.title)}</h2><blockquote class="leader-reaction">“${escape(outcome.reaction)}”</blockquote><p class="small">${escape(outcome.context)}</p><div class="obligations">${outcome.threads.map(thread=>`<article><p class="thread-status">${escape(thread.status)}</p><h3>${escape(thread.name)}</h3><p>${escape(thread.detail)}</p><p class="next-work"><b>Still to do</b> ${escape(thread.next)}</p></article>`).join('')}</div><p class="small">${outcome.unassigned?'One person stayed unassigned this night; no extra task was completed. ':''}The cause of the anchor movement is still unknown. This encounter ends here; these obligations are retained in your saved result.</p>${button('replay','Try another allocation','class="primary"')}`;
  }
  panel.scrollTop=focus?0:previousScroll;
  if(focus)panel.querySelector('h1,h2')?.focus({preventScroll:!matchMedia('(max-width:760px)').matches});
}
panel.addEventListener('click',event=>{
  const target=event.target.closest('button');if(!target||target.disabled)return;
  if(target.dataset.record){record=target.dataset.record;state=act(state,'read',record);persist();render();return;}
  if(target.dataset.task){state=act(state,'assign',target.dataset.task);persist();const key=target.dataset.task;render(false);panel.querySelector(`[data-task="${key}"]`)?.focus({preventScroll:true});return;}
  const action=target.dataset.action;
  if(action==='replay'){resetDialog.showModal();return;}
  if(action==='close-record'){record=null;render();return;}
  if(action==='table'||action==='plan'){view=action;render();return;}
  state=act(state,action);persist();render();
});
document.querySelector('#restart-encounter').addEventListener('click',()=>resetDialog.showModal());
document.querySelector('#cancel-reset').addEventListener('click',()=>resetDialog.close());
document.querySelector('#confirm-reset').addEventListener('click',()=>{state=fresh();record=null;view='table';persist();resetDialog.close();render();});
if(saveAvailable&&saveNotice.textContent==='')saveNotice.textContent=state.phase==='intro'?'Progress saves on this device.':'Your previous encounter has been restored.';
render(false);
