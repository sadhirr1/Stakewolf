import {SAVE_KEY,TASKS,RECORDS,WATCH,MORNING_TASKS,fresh,used,act,restore,result,morningCapacity,morningUsed,morningBlock,noonResult,world} from '/portrait/clearing-state.js';
import {TOPICS,SPEAKERS,respond} from '/portrait/dialogue.js';
const stage=document.querySelector('.encounter'),panel=document.querySelector('#play-panel');
const saveNotice=document.querySelector('#save-notice'),resetDialog=document.querySelector('#reset-dialog');
let state=fresh(),view='table',record=null,saveAvailable=true;
let talking=false,speaker='orin',conversation=[],dialogueMemory={orin:null,sera:null},questionDraft='',talkError='';
try{
  const stored=localStorage.getItem(SAVE_KEY);
  if(stored){const restored=restore(stored);if(restored){state=restored;if(JSON.parse(stored).version===1)saveNotice.textContent=state.version===1?'Your earlier night is preserved. Start again to play the new council dispute.':'Your work plan is retained. Read the changed accounts and choose a council watch before committing.';}else saveNotice.textContent='An incompatible local save could not be restored. A fresh attempt is ready.';}
}catch{saveAvailable=false;saveNotice.textContent='Saving is unavailable. Keep this tab open to retain your attempt.';}
function persist(){
  try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));saveAvailable=true;saveNotice.textContent='Progress saved on this device.';}
  catch{saveAvailable=false;saveNotice.textContent='Progress could not be saved. This attempt continues in the current tab.';}
}
const escape=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(action,label,extra='')=>`<button type="button" data-action="${action}" ${extra}>${label}</button>`;
const map=`<svg class="route-map" viewBox="0 0 440 170" role="img" aria-label="Route sketch: council clearing west of the river, crossing to the east, stores on the north path."><path class="contour" d="M0 22Q95 80 148 20T322 35T440 13M0 145Q100 85 155 145T315 129T440 155M0 101Q90 140 130 80T310 95"/><path class="river" d="M295 -10Q240 40 280 85T259 180"/><path class="trail" d="M60 116Q130 120 170 92T330 76M170 92L191 29"/><circle cx="60" cy="116" r="5"/><circle cx="191" cy="29" r="5"/><path class="bridge" d="M264 65L293 65M265 84L297 84"/><text x="20" y="146">CLEARING</text><text x="153" y="16">STORES</text><text x="315" y="71">CROSSING</text><text x="307" y="96" class="map-note">last checked yesterday</text></svg>`;
function council(){
  const heardBoth=state.seen.includes('leader')&&state.seen.includes('report');
  return `<p class="eyebrow">01 / THE ACCOUNTS</p><div class="evidence-items">${Object.entries(RECORDS).map(([key,item],i)=>`<button class="evidence-object" type="button" data-record="${key}"><span class="object-index">0${i+1}</span><span><strong>${escape(item.title)}</strong><small>${key==='map'?'Before the river rose':key==='leader'?'“I gave no such order.”':'“He told me to loosen it.”'}</small></span><span class="read-mark">${state.seen.includes(key)?'Read':'Hear ↗'}</span></button>`).join('')}</div>
  ${heardBoth?`<div class="contradiction"><p class="eyebrow">THE STORIES CANNOT BOTH BE TRUE</p><p>Orin denies giving the order. Sera says he gave it. Both agree that she handled the line.</p>${state.challenged?`<blockquote>“I told her to ease the outer line. To free the ferry for the stores. I did not tell her to leave it loose.”</blockquote><p class="small">Orin has changed his account. The instruction is admitted; his reason and the cause of the slip remain unverified.</p>`:button('challenge','Challenge Orin’s denial','class="challenge"')}</div>`:''}
  ${button('council','Make the council decision →','class="primary"')}`;
}
function watchChoices(){
  return `<p class="eyebrow">02 / YOUR COUNCIL DECISION</p><p class="opening">“Keep the scout here,” Orin says. “But if I am free, I will take the first family over at the last bell.”</p><p class="small">You decide who stays under watch until dawn. A watch is temporary custody, not a verdict of guilt. Orin and Sera are not the two workers you can assign.</p><div class="watch-options">${Object.entries(WATCH).map(([key,item])=>{
    const blocked=used(state)-(WATCH[state.watch]?.cost||0)+item.cost>2;
    return `<button type="button" data-watch="${key}" aria-pressed="${state.watch===key}" ${blocked?'disabled':''}><strong>${escape(item.name)}</strong><span>${item.cost?'1 worker on watch':'No worker on watch'}</span><small>${escape(item.detail)}</small></button>`;
  }).join('')}</div>${used(state)===2&&state.watch==='none'?'<p class="small">Recall a work assignment to free someone for a watch.</p>':''}<p class="commit-note">An inspector can report damage but cannot overrule Orin. Keeping him under watch is the only order here that prevents him opening the gate.</p>${button('plan','Allocate the remaining workers →','class="primary"')}`;
}
function morningScreen(){
  const capacity=morningCapacity(state),spent=morningUsed(state),escort=capacity===1;
  const memory=state.watch==='sera'?'Sera will only give a new briefing with a witness present. You held her while Orin kept the key.':state.watch==='orin'?'Orin remembers the guard. He demands that you explain his custody in public.':'Orin must answer for the injured traveler. Leaving both free did not keep the night neutral.';
  if(state.phase==='morning')return `<p class="eyebrow">THE NEXT SHIFT / YOUR HISTORY REMAINS</p><h2 tabindex="-1">Yesterday has a cost.</h2><p class="opening">${escape(memory)}</p><p class="commit-note">${escort?'One worker is reserved for the traveler’s escort until noon. You cannot recall that worker or use their time twice.':'No escort is needed. Both workers are available again. The night watch has ended.'}</p><div class="capacity"><span><b>${capacity-spent}</b> of ${capacity} available workers unassigned</span><span>${escort?'1 on escort':'2-person crew'}</span></div><div class="task-list">${Object.entries(MORNING_TASKS).map(([key,task])=>{
    const selected=state.morning[key]>0,reason=morningBlock(state,key),blocked=!selected&&(Boolean(reason)||spent+task.cost>capacity);
    return `<div class="crew-task"><div><h3>${escape(task.name)}</h3><p>${escape(reason||task.detail)}</p>${!reason&&!selected&&spent+task.cost>capacity?'<p class="task-reason">Not enough workers this shift.</p>':''}</div><button type="button" data-morning="${key}" aria-label="${selected?'Recall':'Assign'} morning job: ${escape(task.name)}" aria-pressed="${selected}" ${blocked?'disabled':''}>${selected?'Recall':task.cost===2?'Send pair':'Send one'}<small>${task.cost} ${task.cost===1?'person':'people'}</small></button></div>`;
  }).join('')}</div><p class="small">A repair begun this morning cannot be checked in the same shift. A witnessed hearing records the accounts; it does not prove anyone’s allegiance.</p><p class="commit-note">${capacity-spent} worker${capacity-spent===1?'':'s'} will remain unassigned. These orders are final until noon.</p>${button('morning-commit',spent?'Begin the morning shift →':'Leave new work waiting →','class="primary"')}`;
  if(state.phase==='morning-dispatched')return `<p class="eyebrow">MORNING / ORDERS LOCKED</p><h2 tabindex="-1">The clearing gets to work.</h2><p class="opening">${escort?'A lantern takes the western path with the injured traveler.':'Both workers start from the council fire.'} Look around the clearing to see the assignments.</p><ul class="dispatch-list">${escort?'<li>Traveler’s escort <span>1 person</span></li>':''}${Object.entries(state.morning).filter(([,n])=>n).map(([key,n])=>`<li>${escape(MORNING_TASKS[key].name)}<span>${n} ${n===1?'person':'people'}</span></li>`).join('')}</ul><p class="small">${capacity-spent} worker${capacity-spent===1?' is':'s are'} unassigned. Work is in progress; waiting in real time does not change its outcome.</p>${button('noon','Advance to noon →','class="primary"')}`;
  const out=noonResult(state);
  return `<p class="eyebrow">NOON / WHAT ACTUALLY CHANGED</p><h2 tabindex="-1">${escape(out.title)}</h2><div class="obligations">${[['The crossing',out.crossing],['The stores',out.stores],['The traveler',out.escortText],['The council record',out.testimony],['What they remember',out.memory]].map(([title,detail])=>`<article><h3>${title}</h3><p>${escape(detail)}</p></article>`).join('')}</div><h3 class="pending-title">Work still waiting</h3><ul class="pending-work">${out.pending.map(text=>`<li>${escape(text)}</li>`).join('')}</ul><p class="small">${out.unused} available worker${out.unused===1?' was':'s were'} left unassigned this morning. No additional job was completed. This short test ends at noon; the remaining work and accusation history stay saved. No hidden allegiance has been proved.</p>${button('replay','Try a different night','class="primary"')}`;
}
function conversationScreen(){
  const labels={planning:'Before nightfall',dispatched:'Night work',dawn:'First light',morning:'Morning plan','morning-dispatched':'Morning work',noon:'Noon'};
  return `${button('close-talk','← Return to your decisions','class="back"')}<p class="eyebrow">BY THE COUNCIL FIRE / ${labels[state.phase]}</p><h2 tabindex="-1">Ask in your own words.</h2><p class="small">Local dialogue about this encounter. Replies use the current work record and each person’s account. Asking does not issue orders or challenge a denial on the record.</p><label class="speaker-label" for="talk-speaker">Speak to</label><select id="talk-speaker">${Object.entries(SPEAKERS).map(([key,name])=>`<option value="${key}" ${speaker===key?'selected':''}>${name}${key==='orin'?' · council leader':' · scout (off-screen)'}</option>`).join('')}</select><ol class="conversation-log" aria-label="Recent conversation">${conversation.map(item=>`<li><p class="conversation-time">${escape(item.phase)} · ${SPEAKERS[item.speaker]}</p><p class="your-question"><b>You</b> ${escape(item.question)}</p><blockquote><b>${item.kind==='reply'?SPEAKERS[item.speaker]:'Choose a topic'}</b> ${escape(item.answer)}</blockquote></li>`).join('')}</ol><form id="question-form"><label for="character-question">Your question for ${SPEAKERS[speaker]}</label><textarea id="character-question" rows="3" maxlength="360" aria-describedby="question-help question-error" placeholder="${speaker==='orin'?'Why did you blame Sera?':'Who told you to loosen the line?'}">${escape(questionDraft)}</textarea><p id="question-help" class="small">Try Why? or How do you know? One topic at a time · 360 characters. Enter sends; Shift+Enter adds a line.</p><p id="question-error" class="question-error" role="alert">${escape(talkError)}</p><button type="submit" class="primary">Ask ${SPEAKERS[speaker]} →</button></form><details class="question-examples"><summary>Questions this encounter can answer</summary><div>${Object.entries(TOPICS).map(([key,text])=>`<button type="button" data-question="${key}">${escape(text)}</button>`).join('')}</div></details><p class="small">Only the latest eight exchanges stay in this tab. Reload or restart clears the conversation; your saved game decisions remain.</p>`;
}
function render(focus=true){
  const previousScroll=panel.scrollTop;
  stage.dataset.phase=state.phase;
  const visible=world(state);stage.dataset.world=JSON.stringify(visible);
  document.querySelector('#phase-label').textContent=({dusk:'DUSK',night:'NIGHTFALL',morning:'FIRST LIGHT',noon:'NOON'})[visible.light];
  document.querySelector('#world-work').textContent='';
  const jobNames={idle:'at the clearing',crossing:'at the crossing',stores:'at the stores',watch:'on council watch',escort:'escorting the traveler',hearing:'witnessing the hearing'};
  document.querySelector('#world-summary').innerHTML=`<h2>The work on the ground</h2><p class="small">The two lanterns mark your workers. Movement shows activity; only advancing the shift confirms completion.</p><div class="world-facts"><p><b>River crossing</b>${visible.crossing==='open'?'Gate open · verified higher approach':visible.crossing==='reset'?'Anchor reset · clearance pending':'Loose line · gate closed'}</p><p><b>Northern stores</b>${visible.stores==='protected'?'Moved to the raised platform':'Still at the water’s edge'}</p><p><b>Your two workers</b>${visible.jobs.map((job,i)=>`${i+1}: ${jobNames[job]}`).join('<br>')}</p></div>`;
  document.querySelector('#restart-encounter').hidden=state.phase==='intro';
  document.querySelector('#talk').hidden=state.phase==='intro'||state.version!==3;
  stage.querySelector('.character-position').hidden=stage.dataset.overview==='true'||(talking&&speaker==='sera');
  if(state.phase==='intro'){
    panel.innerHTML=`<p class="eyebrow">ONE NIGHT AT THE HOLLOW</p><h1 tabindex="-1">Someone is lying.</h1><p class="opening">The crossing is failing. The leader blames his scout. She says she followed his order. Beyond the river, families wait for the dawn he promised.</p><p class="opening quiet">Two workers. One night. Someone may have to stay by the fire.</p>${button('start','Enter the clearing <span aria-hidden="true">→</span>','class="primary"')}<p class="small">Hear their stories. Decide whom to watch. Live with the work left undone.</p>`;
  }else if(state.phase==='planning'&&record){
    const item=RECORDS[record];
    panel.innerHTML=`${button('close-record','← Back to the clearing','class="back"')}<p class="eyebrow">${record==='map'?'ROUTE REGISTER':'A DISPUTED ACCOUNT'}</p><h2 tabindex="-1">${escape(item.title)}</h2><p class="source">${escape(item.source)}</p>${record==='map'?map:`<div class="report-mark" aria-hidden="true">${record==='leader'?'O.':'S.'}</div>`}<blockquote class="record-copy">${escape(item.text)}</blockquote><p class="evidence-limit">${escape(item.limit)}</p>${button('close-record','Return to the council','class="primary"')}`;
  }else if(state.phase==='planning'){
    panel.innerHTML=`<p class="eyebrow">THE CLEARING / BEFORE NIGHTFALL</p><h2 tabindex="-1">${view==='table'?'Two voices. One loose line.':view==='council'?'Who stays by the fire?':'What can wait until dawn?'}</h2><div class="play-tabs" role="group" aria-label="Encounter views">${button('table','1 · Accounts',`aria-pressed="${view==='table'}"`)}${button('council','2 · Council',`aria-pressed="${view==='council'}"`)}${button('plan','3 · Work',`aria-pressed="${view==='plan'}"`)}</div>${view==='table'?council():view==='council'?watchChoices():`
      <p class="council-summary">${state.watch===null?'No council decision yet.':escape(WATCH[state.watch].name)+` · ${WATCH[state.watch].cost} worker on watch.`} ${button('council','Review council decision','class="back"')}</p>
      <div class="capacity"><span><b>${2-used(state)}</b> of 2 workers unassigned</span><span>Watch included</span></div><div class="task-list">${Object.entries(TASKS).map(([key,task])=>{const selected=state.crew[key]>0,blocked=!selected&&used(state)+task.cost>2;return `<div class="crew-task"><div><h3>${escape(task.name)}</h3><p>${escape(task.detail)}</p></div><button type="button" data-task="${key}" aria-label="${selected?'Recall':'Assign'} ${task.cost} ${task.cost===1?'person':'people'}: ${escape(task.name)}" aria-pressed="${selected}" ${blocked?'disabled':''}>${selected?'Recall':task.cost===2?'Send pair':'Send one'}<small>${task.cost} ${task.cost===2?'people':'person'}</small></button></div>`;}).join('')}</div><p class="small">${2-used(state)>0?`${2-used(state)} ${2-used(state)===1?'worker stays':'workers stay'} unassigned. They do no work this night.`:'Both workers are assigned. Recall a task to change the plan.'}</p><p class="commit-note">${state.watch===null?'Choose a council decision before giving orders.':state.watch==='orin'?'Orin will be held until dawn. The other worker cannot complete the two-person repair.':'Orin remains free. He has said he will attempt a passage without waiting for clearance. An inspection cannot stop that order.'} Orders are final for this night.</p>${button('commit','Give the orders →',`class="primary" ${used(state)===0||state.watch===null?'disabled':''}`)}`}`;
  }else if(state.phase==='dispatched'){
    const watched=WATCH[state.watch]?.cost;
    panel.innerHTML=`<p class="eyebrow">YOUR ORDERS ARE GIVEN</p><h2 tabindex="-1">The last bell is coming.</h2>${state.version>=2?`<blockquote class="leader-reaction">${state.watch==='orin'?'“A guard. For me. I hope you can explain this when they ask where I was.”':state.watch==='sera'?'“You chose to believe me. I will bring them through.”':'“Then I still have the key. I will keep my promise.”'}</blockquote>`:''}<p class="opening">${state.crew.repair?'Both workers take the river path with tools.':state.crew.inspect?'An inspector follows the river path.':state.crew.supplies?'A worker takes the northern path to move the stores.':'The guard settles beside the fire. No worker has been sent to the crossing or stores.'}</p><ul class="dispatch-list">${watched?`<li>${escape(WATCH[state.watch].name)} <span>1 worker</span></li>`:''}${Object.entries(state.crew).filter(([,n])=>n).map(([key,n])=>`<li>${escape(TASKS[key].name)} <span>${n} ${n===1?'person':'people'}</span></li>`).join('')}</ul><p class="small">${2-used(state)?'One worker remains unassigned.':'Nobody remains available for another job tonight.'} Work is underway; no completion has been verified.</p>${button('dawn','Wait for first light →','class="primary"')}`;
  }else if(['morning','morning-dispatched','noon'].includes(state.phase)){
    panel.innerHTML=morningScreen();
  }else{
    const outcome=result(state);
    panel.innerHTML=`<p class="eyebrow">FIRST LIGHT / WHAT YOUR ORDERS LEFT BEHIND</p><h2 tabindex="-1">${escape(outcome.title)}</h2><blockquote class="leader-reaction">“${escape(outcome.reaction)}”</blockquote><p class="small">${escape(outcome.context)}</p>${outcome.events?`<ol class="night-events">${outcome.events.map(item=>`<li><span>${escape(item.time)}</span><p>${escape(item.text)}</p></li>`).join('')}</ol><p class="morning-capacity"><b>${outcome.availableTomorrow} / 2</b> workers available for new work this morning</p>${button('morning','Take the morning’s work →','class="primary"')}`:'<p class="small">Earlier edition: your original outcome has been preserved. Start again for the council dispute.</p>'}<div class="obligations">${outcome.threads.map(thread=>`<article><p class="thread-status">${escape(thread.status)}</p><h3>${escape(thread.name)}</h3><p>${escape(thread.detail)}</p><p class="next-work"><b>Still to do</b> ${escape(thread.next)}</p></article>`).join('')}</div><p class="small">${outcome.unassigned?'One worker stayed unassigned this night; no extra task was completed. ':''}${escape(outcome.unresolved||'The cause of the anchor movement is still unknown.')}</p>${button('replay','Try another council decision')}`;
  }
  if(talking)panel.innerHTML=conversationScreen();
  panel.scrollTop=focus?0:previousScroll;
  if(focus)panel.querySelector('h1,h2')?.focus({preventScroll:!matchMedia('(max-width:760px)').matches});
}
panel.addEventListener('click',event=>{
  const target=event.target.closest('button');if(!target||target.disabled)return;
  if(target.type==='submit')return;
  if(target.dataset.record){record=target.dataset.record;state=act(state,'read',record);persist();render();return;}
  if(target.dataset.task){state=act(state,'assign',target.dataset.task);persist();const key=target.dataset.task;render(false);panel.querySelector(`[data-task="${key}"]`)?.focus({preventScroll:true});return;}
  if(target.dataset.morning){const key=target.dataset.morning;state=act(state,'morning-assign',key);persist();render(false);panel.querySelector(`[data-morning="${key}"]`)?.focus({preventScroll:true});return;}
  if(target.dataset.watch){state=act(state,'watch',target.dataset.watch);persist();const key=target.dataset.watch;render(false);panel.querySelector(`[data-watch="${key}"]`)?.focus({preventScroll:true});return;}
  const action=target.dataset.action;
  if(target.dataset.question){const input=panel.querySelector('#character-question');questionDraft=TOPICS[target.dataset.question];input.value=questionDraft;input.focus();return;}
  if(action==='close-talk'){talking=false;talkError='';render();return;}
  if(action==='replay'){resetDialog.showModal();return;}
  if(action==='close-record'){record=null;render();return;}
  if(action==='challenge'){
    state=act(state,action);persist();render(false);
    const reply=panel.querySelector('.contradiction blockquote');
    if(reply){reply.tabIndex=-1;reply.focus();}return;
  }
  if(action==='table'||action==='council'||action==='plan'){view=action;render();return;}
  state=act(state,action);persist();render();
});
function askQuestion(){
  const input=panel.querySelector('#character-question');questionDraft=input.value;
  const reply=respond(state,speaker,questionDraft,dialogueMemory[speaker]);
  if(reply.kind==='validation'||reply.kind==='unavailable'){talkError=reply.text;render(false);panel.querySelector('#character-question')?.focus();return;}
  const phases={planning:'Dusk',dispatched:'Nightfall',dawn:'First light',morning:'Morning plan','morning-dispatched':'Morning work',noon:'Noon'};
  conversation.push({phase:phases[state.phase],speaker,question:questionDraft.trim(),answer:reply.text,kind:reply.kind});conversation=conversation.slice(-8);
  dialogueMemory[speaker]=reply.memory||null;questionDraft='';talkError='';render(false);
  panel.querySelector('#character-question').focus();document.querySelector('#talk-status').textContent=`${SPEAKERS[speaker]}: ${reply.text}`;
}
panel.addEventListener('submit',event=>{if(event.target.id==='question-form'){event.preventDefault();askQuestion();}});
panel.addEventListener('keydown',event=>{if(event.target.id==='character-question'&&event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();if(!event.repeat)askQuestion();}});
panel.addEventListener('input',event=>{if(event.target.id==='character-question')questionDraft=event.target.value;});
panel.addEventListener('change',event=>{if(event.target.id==='talk-speaker'){speaker=event.target.value;talkError='';render(false);panel.querySelector('#talk-speaker').focus();}});
document.querySelector('#talk').addEventListener('click',()=>{setOverview(false);talking=true;record=null;render();});
document.querySelector('#restart-encounter').addEventListener('click',()=>resetDialog.showModal());
const overviewButton=document.querySelector('#overview'),worldSummary=document.querySelector('#world-summary');
function setOverview(open){
  stage.dataset.overview=String(open);
  overviewButton.setAttribute('aria-pressed',String(open));overviewButton.textContent=open?'Return to the council':'Look around the clearing';
  panel.hidden=open;worldSummary.hidden=!open;stage.querySelector('.character-position').hidden=open||(talking&&speaker==='sera');
  if(matchMedia('(max-width:760px)').matches)stage.scrollIntoView({block:'start',behavior:'instant'});
}
overviewButton.addEventListener('click',()=>setOverview(stage.dataset.overview!=='true'));
document.querySelector('#cancel-reset').addEventListener('click',()=>resetDialog.close());
document.querySelector('#confirm-reset').addEventListener('click',()=>{state=fresh();record=null;view='table';talking=false;speaker='orin';conversation=[];dialogueMemory={orin:null,sera:null};questionDraft='';talkError='';document.querySelector('#talk-status').textContent='';setOverview(false);persist();resetDialog.close();render();});
if(saveAvailable&&saveNotice.textContent==='')saveNotice.textContent=state.phase==='intro'?'Progress saves on this device.':'Your previous encounter has been restored.';
render(false);
