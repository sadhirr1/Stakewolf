import { PEOPLE, ROUNDS } from './scenario.js';
import { createGame, beginGame, currentRound, askQuestion, decide, advance, interpretDecision, relationshipLabel, getDebrief, getConversationMemory, METRICS } from './engine.js';
const app = document.querySelector('#app');
app.innerHTML = `<main id="main" class="intro"><div class="intro-heading"><span class="case-number">CASE 001</span><span class="eyebrow">THE LAUNCH ROOM</span></div><div class="intro-grid"><section><h1>Everyone has<br>an agenda.<br><em>Including you.</em></h1><p class="intro-lead">A product launch. Four stakeholders. Five decisions that change everything. Step into the room, find the missing context, and make the call.</p><div class="intro-actions"><button class="primary" id="start-game" aria-describedby="session-policy">Enter the launch room</button><span class="small-meta">10–15 minutes<br>Single-player simulation</span></div><p id="session-policy" class="fine-print">Progress is not saved. Refreshing or reopening this page starts a new attempt.</p></section><aside class="dossier"><div class="dossier-heading"><span class="eyebrow lime">YOUR ASSIGNMENT</span><span class="stamp">INTERNAL / RELAY</span></div><h2>48 hours to launch.</h2><p>Relay’s AI meeting assistant is about to go live. Growth has promised the date. Engineering has concerns. A customer has noticed something you haven’t.</p><div class="brief-facts"><div><span class="eyebrow">YOUR ROLE</span><strong>Product Manager</strong></div><div><span class="eyebrow">YOUR OBJECTIVE</span><strong>Earn the launch.</strong></div></div><div class="cast-preview"><div class="cast-line"><span class="avatar" style="color:var(--orange)">MV</span><span class="cast-name"><strong>Mara Voss</strong><small>Growth lead</small></span><span class="cast-motto">“Momentum matters.”</span></div><div class="cast-line"><span class="avatar" style="color:var(--blue)">IC</span><span class="cast-name"><strong>Ishan Chen</strong><small>Engineering lead</small></span><span class="cast-motto">“Show me the failure.”</span></div><div class="cast-line"><span class="avatar" style="color:var(--pink)">LO</span><span class="cast-name"><strong>Leah Okafor</strong><small>Trust & legal</small></span><span class="cast-motto">“Who carries the risk?”</span></div><div class="cast-line"><span class="avatar" style="color:var(--lime)">TB</span><span class="cast-name"><strong>Theo Bell</strong><small>Customer advocate</small></span><span class="cast-motto">“Someone has to listen.”</span></div></div></aside></div><footer class="intro-foot"><span>Decisions leave a trace. People remember.</span><span>Authored scenario · No account or API key needed</span></footer></main>`;
const introHTML = app.innerHTML;
let state = createGame();
let selected = null;
let activeTab = 'decision';
let customMode = false;
let draft = '';
let proposal = null;
let screenVersion = 0;
const dialogReturns = new WeakMap();
const esc = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const avatar = p => `<span class="avatar" style="color:var(--${p.color})" aria-hidden="true">${p.initials}</span>`;
const announce = message => { document.querySelector('#announcement').textContent = message; };
const metricNames = {delivery:'Delivery',trust:'Team trust',quality:'Product quality'};
const metricNotes = {delivery:'Momentum behind the commitment',trust:'Willingness to share and cooperate',quality:'Evidence of a dependable product'};
const deltaHTML = delta => `<div class="delta-list">${METRICS.filter(k=>delta[k]).map(k=>`<span class="delta ${delta[k]<0?'negative':''}">${metricNames[k]}<strong>${delta[k]>0?'+':''}${delta[k]}</strong></span>`).join('')}</div>`;
function metricsHTML() {
  return `<section class="metrics" aria-label="Simulation signals">${METRICS.map(k=>`<div class="metric"><div class="metric-heading"><span>${metricNames[k]}</span><strong>${state.metrics[k]}<span class="small-meta"> / 100</span></strong></div><div class="metric-track" role="meter" aria-label="${metricNames[k]}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${state.metrics[k]}"><div class="metric-fill" style="width:${state.metrics[k]}%"></div></div><small>${metricNotes[k]}</small></div>`).join('')}</section><p class="metric-note">Game signals reflect this scenario’s rules, not an assessment of your abilities.</p>`;
}
function roomHTML() {
  return `<aside class="room" aria-label="Stakeholders"><div class="room-title"><span class="eyebrow">THE ROOM</span><span class="badge">${state.phase==='play'?state.talksLeft:0} / 2</span></div><p class="small-meta">${state.phase==='play'?'Conversations left this round.':'The room is reacting to your call.'}</p><div class="stakeholder-list">${PEOPLE.map(p=>`<button class="stakeholder" data-person="${p.id}" ${state.phase!=='play'?'disabled':''} aria-label="Talk to ${p.name}, ${p.role}">${avatar(p)}<span class="cast-name"><strong>${p.name}</strong><small>${p.role}</small><span class="talk-state">${state.evidence.some(e=>e.round===state.round&&e.person===p.id)?'Heard this round':'Open conversation'}</span></span></button>`).join('')}</div><div class="room-divider"><span class="eyebrow">FIVE CALLS TO MAKE</span><ol class="round-list">${ROUNDS.map((r,i)=>`<li class="${i===state.round?'active':''}" ${i===state.round?'aria-current="step"':''}><span class="num">${i<state.round?'✓':String(i+1).padStart(2,'0')}</span>${r.label}</li>`).join('')}</ol></div><div class="room-bottom"><p class="small-meta">Everyone has a reason.<br>You decide which ones matter.</p><button class="text-button" data-action="restart">Restart this attempt</button></div></aside>`;
}
function tabsHTML() {
  return `<div class="workspace-tabs" role="tablist" aria-label="Round workspace">${[['decision','Your decision'],['evidence','Evidence '+state.evidence.length],['journal','Decision record']].map(([id,name])=>`<button role="tab" id="tab-${id}" aria-selected="${activeTab===id}" aria-controls="workspace-panel" tabindex="${activeTab===id?0:-1}" data-tab="${id}">${name}</button>`).join('')}</div>`;
}
function decisionHTML() {
  const round=currentRound(state);
  if(customMode) return `<form id="custom-form" class="custom-form"><label for="written-decision">Make the call in your own words</label><p>Describe what you would do and why. You’ll review the matching approach before it affects the game.</p><textarea id="written-decision" name="decision" minlength="20" maxlength="1200" required placeholder="I would start with a limited pilot, ask Engineering to define a stop condition, and explain the change to Growth…">${esc(draft)}</textarea><div class="form-meta"><span>20–1,200 characters · Your reasoning stays in the record</span><span id="character-count">${draft.length} / 1200</span></div><div class="button-row"><button type="submit" class="primary">Review my approach</button><button type="button" class="secondary" data-action="show-choices">Use a prepared approach</button></div><p class="fine-print" style="margin:15px 0 0">This edition matches words to three authored approaches. You choose the interpretation; it isn’t live AI analysis.</p></form>`;
  return `<div class="decision-heading"><h3 style="margin:0">${round.question}</h3><span class="small-meta">${state.talksLeft?'You can still hear '+state.talksLeft+' perspective'+(state.talksLeft===1?'':'s')+'.':'Your conversations are complete.'}</span></div><div class="choices" role="group" aria-label="Available approaches">${round.choices.map((c,i)=>`<button class="choice ${selected===c.id?'selected':''}" data-choice="${c.id}" aria-pressed="${selected===c.id}"><span class="choice-letter">${String.fromCharCode(65+i)}</span><strong>${c.title}</strong><p>${c.description}</p></button>`).join('')}</div><div class="decision-footer"><button class="text-button" data-action="write">Write your own decision</button><button class="primary" data-action="commit" ${selected?'':'disabled'}>Commit to this approach</button></div>`;
}
function evidenceHTML() {
  if(!state.evidence.length)return `<div class="panel-empty">The file is empty. Talk to a stakeholder to uncover evidence. You have two conversations per round, and each question uses one.</div>`;
  return `<div>${[...state.evidence].reverse().map(e=>`<article class="evidence-card"><span class="eyebrow">ROUND ${e.round+1} · ${esc(e.kind)}</span><h3>${esc(e.title)}</h3><p>${esc(e.text)}</p><p class="source-note">Source: ${PEOPLE.find(p=>p.id===e.person).name}. ${e.kind==='Unverified concern'?'This concern has not yet been independently verified.':'A source’s account may still be incomplete.'}</p></article>`).join('')}</div>`;
}
function journalHTML() {
  if(!state.history.length) return `<div class="panel-empty">Your decisions will appear here with their immediate effects and later consequences.</div>`;
  return state.history.map(h=>`<article class="journal-entry"><span class="eyebrow">ROUND ${h.round+1} · ${ROUNDS[h.round].label}</span><h3>${esc(h.title)}</h3>${h.writtenDecision?`<blockquote class="quote-user">${esc(h.writtenDecision)}</blockquote><p class="fine-print">Confirmed approach: ${esc(h.title)}</p>`:''}<p>${esc(h.outcome)}</p>${deltaHTML(h.delta)}${h.bonus?`<p class="consequence-note">Evidence mattered: ${esc(h.bonus)}</p>`:''}${h.followup?`<p><strong>Later:</strong> ${esc(h.followup.text)}</p>${deltaHTML(h.followup.delta)}`:''}</article>`).join('');
}
function sceneHTML() {
  const r=currentRound(state);
  return `<section class="scene"><div class="scene-topline"><span class="eyebrow lime">${r.time}</span><span class="eyebrow">${r.countdown}</span></div><h1 id="scene-title" tabindex="-1">${r.title}</h1><p class="scene-intro">${r.description}</p>${state.arrival?`<div class="consequence-note"><strong>From your last call:</strong> ${esc(state.arrival.text)}</div>`:''}<div class="scene-message"><cite>${r.speaker}</cite><blockquote>“${r.quote}”</blockquote></div></section>${tabsHTML()}<section id="workspace-panel" role="tabpanel" aria-labelledby="tab-${activeTab}" tabindex="0">${activeTab==='decision'?decisionHTML():activeTab==='evidence'?evidenceHTML():journalHTML()}</section>`;
}
function resultHTML() {
  const h=state.history.at(-1);
  return `<section class="round-result"><span class="eyebrow lime">YOUR CALL IS IN</span><h1 id="scene-title" tabindex="-1" style="font-family:var(--serif);font-size:clamp(2.2rem,3.8vw,3.75rem);line-height:1.12;font-weight:400;margin:18px 0">${h.headline}</h1><p class="small-meta">You chose: ${esc(h.title)}</p><p class="result-summary">${h.outcome}</p>${deltaHTML(h.delta)}${h.bonus?`<div class="consequence-note"><strong>Evidence mattered.</strong> ${esc(h.bonus)}</div>`:''}<div class="reaction-grid">${PEOPLE.map(p=>`<article class="reaction">${avatar(p)}<div><strong>${p.name}</strong><p>“${h.reactions[p.id]}”</p></div></article>`).join('')}</div><div class="result-controls"><span class="small-meta">The immediate response is only part of the story.</span><button class="primary" data-action="advance">${state.round===4?'Open your debrief':'Continue to round '+(state.round+2)}</button></div></section>`;
}
function debriefHTML() {
  const d=getDebrief(state);
  return `<main id="main" class="debrief"><span class="eyebrow lime">CASE CLOSED · YOUR DECISION TRACE</span><h1 id="scene-title" tabindex="-1">${d.title}</h1><p class="debrief-lead">${d.description}</p>${metricsHTML()}<div class="button-row" style="margin-top:26px"><button class="primary" data-action="replay">Play another attempt</button><button class="secondary" data-action="download">Download decision record</button></div><div class="debrief-layout"><div><section class="debrief-section"><span class="eyebrow">WHAT YOUR CHOICES REVEAL</span><h2 style="margin-top:12px">A pattern, with receipts.</h2>${d.reflections.map(r=>`<div class="reflection"><h3>${r.title}</h3><p>${r.text}</p></div>`).join('')}<p class="fine-print">These observations describe this attempt. They are not a personality profile, hiring score, or validated assessment.</p></section><section class="debrief-section"><h2>The five decisions</h2>${journalHTML()}</section></div><aside><section class="debrief-section"><span class="eyebrow">THE AGENDAS BEHIND THE ARGUMENTS</span><h2 style="margin-top:12px">What they weren’t saying.</h2>${PEOPLE.map(p=>`<article class="agenda-card"><div class="agenda-person">${avatar(p)}<span class="cast-name"><strong>${p.name}</strong><small>${p.role}</small></span></div><span class="agenda-label">PRIVATE MOTIVATION</span><p>${p.agenda}</p><p><strong>On a replay:</strong> ${p.tell}</p><div class="summary-stat"><span>Final relationship</span><strong>${relationshipLabel(state.relationships[p.id])}</strong></div></article>`).join('')}</section></aside></div><footer class="game-footer"><span>STAKEWOLF · THE LAUNCH ROOM</span><span>Fictional scenario · Authored rules · Your reasoning stays on this device</span></footer></main>`;
}
function render(focus=false) {
  if(focus) screenVersion++;
  if(state.phase==='briefing') app.innerHTML=introHTML;
  else if(state.phase==='complete') app.innerHTML=debriefHTML();
  else app.innerHTML=`<div class="game">${roomHTML()}<main id="main" class="main"><div class="chapter-top"><span class="eyebrow">CASE 001 / ROUND ${String(state.round+1).padStart(2,'0')} OF 05</span><div class="chapter-steps" aria-hidden="true">${ROUNDS.map((r,i)=>`<span class="chapter-step ${i<state.round?'done':i===state.round?'current':''}"></span>`).join('')}</div></div>${state.phase==='play'?sceneHTML():resultHTML()}${metricsHTML()}<footer class="game-footer"><span>RELAY / INTERNAL DECISIONS</span><button class="text-button" data-action="restart">Restart attempt</button></footer></main></div>`;
  if(focus) {document.querySelector('#scene-title, #start-game')?.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
}
function resetUI() {selected=null;activeTab='decision';customMode=false;draft='';proposal=null;}
function showDialog(dialog, returnFocus = document.activeElement) {
  if(dialog.open) return;
  dialogReturns.set(dialog, {returnFocus, screenVersion});
  dialog.showModal();
}
function closeDialogs() {
  document.querySelectorAll('dialog[open]').forEach(dialog=>{
    // A committed action owns the next screen's focus, not the old opener.
    dialogReturns.delete(dialog);
    dialog.close();
  });
}
document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('close',()=>{
  if(dialog.open) return;
  const saved = dialogReturns.get(dialog);
  dialogReturns.delete(dialog);
  if(!saved || saved.screenVersion!==screenVersion || document.querySelector('dialog[open]')) return;
  const opener = typeof saved.returnFocus==='function' ? saved.returnFocus() : saved.returnFocus;
  const target = opener?.isConnected && !opener.disabled && opener.getClientRects().length
    ? opener : document.querySelector('#scene-title, #start-game');
  target?.focus({preventScroll:true});
}));
function start() {state=beginGame(state);resetUI();render(true);announce('Round one. You have two stakeholder conversations.');}
function commit(choiceId, text='') {state=decide(state,choiceId,text);closeDialogs();resetUI();render(true);announce('Decision recorded. Read the stakeholder reactions.');}
function nextRound() {state=advance(state);resetUI();render(true);announce(state.phase==='complete'?'Your five-round debrief is ready.':'Round '+(state.round+1)+'. Two new conversations are available.');}
function openConversation(personId, answerId=null) {
  if(state.phase!=='play')throw new Error('Conversations are available during a decision round.');
  const p=PEOPLE.find(p=>p.id===personId);
  if(!p)throw new Error('Unknown stakeholder.');
  const questions=currentRound(state).conversations[p.id];
  const memory=getConversationMemory(state,p.id);
  const answered=answerId?questions.find(q=>q.id===answerId):null;
  const dialog=document.querySelector('#conversation-dialog');
  document.querySelector('#conversation-content').innerHTML=`<div class="dialog-top"><span class="eyebrow">PRIVATE CONVERSATION · ${state.talksLeft} LEFT</span><button class="icon-button" data-close-dialog aria-label="Close conversation">×</button></div><div class="conversation-person">${avatar(p)}<div><h2 id="conversation-title">${p.name}</h2><p>${p.role} · ${relationshipLabel(state.relationships[p.id])}</p></div></div>${memory?`<div class="consequence-note" data-stakeholder-memory><span class="eyebrow">REMEMBERING YOUR EARLIER CALL</span><p>“${esc(memory.text)}”</p></div>`:''}${answered?`<div class="answer"><span class="eyebrow">YOU ASKED: ${esc(answered.question)}</span><blockquote style="margin-top:12px">“${answered.answer}”</blockquote><p><strong>Added to evidence:</strong> ${answered.title}</p></div>`:`<p>“${p.motto}”</p>`}<span class="eyebrow">${state.talksLeft?'CHOOSE ONE QUESTION · USES ONE CONVERSATION':'NO CONVERSATIONS REMAIN THIS ROUND'}</span>${questions.map(q=>`<button class="question" data-ask-person="${p.id}" data-question="${q.id}" ${state.asked.includes(q.id)||!state.talksLeft?'disabled':''}>${q.question}${state.asked.includes(q.id)?' · Asked':''}</button>`).join('')}<button class="secondary" data-close-dialog style="margin-top:15px">Back to the room</button>`;
  showDialog(dialog, ()=>document.querySelector('[data-person="'+personId+'"]'));
  if(answered)dialog.querySelector('[data-close-dialog]').focus();
}
function reviewProposal(text) {
  proposal=interpretDecision(state,text);
  const r=currentRound(state);
  document.querySelector('#proposal-content').innerHTML=`<div class="dialog-top"><span class="eyebrow">YOUR WORDS, YOUR CALL</span><button class="icon-button" data-close-dialog aria-label="Close approach review">×</button></div><h2 id="proposal-title">Confirm your approach.</h2><p>${proposal.suggestedId?'Words in your decision suggest the selected approach below. Change it if it doesn’t fit.':'There isn’t one clear match. Choose the approach that best captures your intention.'}</p><p class="fine-print">The game applies the selected approach’s consequences. Your full wording is preserved in the record.</p><form id="proposal-form"><fieldset style="border:0;padding:0;margin:0"><legend class="sr-only">Choose how the simulation should interpret your decision</legend><div class="proposal-options">${r.choices.map(c=>`<label class="proposal-option"><input type="radio" name="approach" value="${c.id}" required ${proposal.suggestedId===c.id?'checked':''}><span>${c.title}<small>${c.description}</small></span></label>`).join('')}</div></fieldset><div class="button-row"><button type="submit" class="primary">Confirm and make the call</button><button type="button" class="secondary" data-close-dialog data-edit-wording>Edit my wording</button></div></form>`;
  showDialog(document.querySelector('#proposal-dialog'), ()=>document.querySelector('#custom-form [type="submit"]'));
}
function downloadRecord() {
  const d=getDebrief(state);
  const lines=['STAKEWOLF — THE LAUNCH ROOM','Decision record','',d.title,d.description,'',...METRICS.map(k=>metricNames[k]+': '+state.metrics[k]+'/100'),'','Game signals use authored rules; they are not an assessment of ability.',''];
  for(const h of state.history) {
    lines.push('ROUND '+(h.round+1)+' — '+ROUNDS[h.round].label,'Decision: '+h.title);
    if(h.writtenDecision)lines.push('Your words: '+h.writtenDecision);
    lines.push(h.outcome,'Immediate effects: '+METRICS.map(k=>metricNames[k]+' '+(h.delta[k]>0?'+':'')+h.delta[k]).join(', '));
    if(h.bonus)lines.push('Evidence mattered: '+h.bonus);
    for(const id of h.heard){const e=state.evidence.find(item=>item.id===id);lines.push('Heard from '+PEOPLE.find(p=>p.id===e.person).name+': '+e.text);}
    if(h.followup)lines.push('Later: '+h.followup.text);
    lines.push('');
  }
  lines.push('PRIVATE AGENDAS',...PEOPLE.flatMap(p=>[p.name+': '+p.agenda,'']),'This record was generated locally.');
  const url=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download='stakewolf-decision-record.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  announce('Your decision record has been downloaded.');
}
document.querySelector('#how-button').addEventListener('click',()=>showDialog(document.querySelector('#help-dialog'), document.querySelector('#how-button')));
document.querySelector('#confirm-restart').addEventListener('click',()=>{closeDialogs();state=createGame();resetUI();render(true);announce('A fresh attempt is ready.');});
document.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button||button.disabled)return;
  try {
    if(button.hasAttribute('data-close-dialog')){
      const dialog=button.closest('dialog');
      if(button.hasAttribute('data-edit-wording')) dialogReturns.set(dialog, {returnFocus:()=>document.querySelector('#written-decision'), screenVersion});
      dialog.close();return;
    }
    if(button.id==='start-game'){start();return;}
    if(button.dataset.person){openConversation(button.dataset.person);return;}
    if(button.dataset.question){state=askQuestion(state,button.dataset.askPerson,button.dataset.question);render();openConversation(button.dataset.askPerson,button.dataset.question);announce('Evidence added. '+state.talksLeft+' conversations remaining.');return;}
    if(button.dataset.choice){selected=button.dataset.choice;render();app.querySelector('[data-choice="'+selected+'"]').focus({preventScroll:true});return;}
    if(button.dataset.tab){activeTab=button.dataset.tab;render();document.querySelector('#tab-'+activeTab).focus({preventScroll:true});return;}
    switch(button.dataset.action){
      case 'commit':commit(selected);break;
      case 'advance':nextRound();break;
      case 'write':customMode=true;activeTab='decision';render();document.querySelector('#written-decision').focus();break;
      case 'show-choices':customMode=false;render();app.querySelector('[data-action="write"]').focus();break;
      case 'restart':showDialog(document.querySelector('#restart-dialog'), button);break;
      case 'replay':state=createGame();resetUI();render(true);announce('A fresh attempt is ready.');break;
      case 'download':downloadRecord();break;
    }
  }catch(error){announce(error.message);}
});
document.addEventListener('input',event=>{if(event.target.id==='written-decision'){draft=event.target.value;document.querySelector('#character-count').textContent=draft.length+' / 1200';}});
document.addEventListener('submit',event=>{
  if(event.target.id!=='custom-form'&&event.target.id!=='proposal-form')return;
  event.preventDefault();
  try{if(event.target.id==='custom-form')reviewProposal(draft);else if(proposal)commit(new FormData(event.target).get('approach'),proposal.text);}catch(error){announce(error.message);}
});
document.addEventListener('keydown',event=>{
  const tab=event.target.closest('[role="tab"]');
  if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  event.preventDefault();const ids=['decision','evidence','journal'];let i=ids.indexOf(activeTab);
  if(event.key==='Home')i=0;else if(event.key==='End')i=2;else i=(i+(event.key==='ArrowRight'?1:2))%3;
  activeTab=ids[i];render();document.querySelector('#tab-'+activeTab).focus();
});

// WebMCP uses the same validated actions as the visible game. It is optional;
// browsers without document.modelContext keep every normal UI capability.
const registry=document.modelContext;
if(registry?.registerTool){
  const lifecycle=new AbortController();
  const result=value=>({content:[{type:'text',text:JSON.stringify(value)}]});
  const snapshot=()=>({phase:state.phase,round:state.round+1,metrics:{...state.metrics},conversationsRemaining:state.talksLeft,evidence:state.evidence.map(({title,text,person})=>({title,text,person})),choices:state.phase==='play'?currentRound(state).choices.map(({id,title,description})=>({id,title,description})):[],stakeholders:PEOPLE.map(({id,name,role})=>({id,name,role,memory:state.phase==='play'?getConversationMemory(state,id):null})),questions:state.phase==='play'?Object.fromEntries(PEOPLE.map(p=>[p.id,currentRound(state).conversations[p.id].map(({id,question})=>({id,question,asked:state.asked.includes(id)}))])):{}});
  const tools=[
    {name:'read_stakewolf_state',title:'Read Stakewolf game state',description:'Read the current round, evidence, available questions, and choices. Hidden agendas remain concealed until the debrief.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute:()=>result(snapshot())},
    {name:'start_stakewolf_attempt',title:'Start Stakewolf',description:'Begin the current fresh attempt. Fails if an attempt has already begun; does not erase progress.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:()=>{start();return result(snapshot());}},
    {name:'ask_stakewolf_question',title:'Ask a stakeholder',description:'Ask one available question and consume one of this round’s two conversations. Adds the answer to visible evidence.',inputSchema:{type:'object',properties:{personId:{type:'string'},questionId:{type:'string'}},required:['personId','questionId'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(!input||typeof input.personId!=='string'||typeof input.questionId!=='string')throw new Error('Provide a stakeholder and question ID.');state=askQuestion(state,input.personId,input.questionId);render();openConversation(input.personId,input.questionId);return result({evidence:state.evidence.at(-1),conversationsRemaining:state.talksLeft});}},
    {name:'commit_stakewolf_decision',title:'Commit a Stakewolf decision',description:'Commit an available approach immediately, applying its consequences and recording the decision. Use read_stakewolf_state to get valid choice IDs.',inputSchema:{type:'object',properties:{choiceId:{type:'string'}},required:['choiceId'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(!input||typeof input.choiceId!=='string')throw new Error('Provide a choice ID.');commit(input.choiceId);return result({phase:state.phase,decision:state.history.at(-1)});}},
    {name:'advance_stakewolf_round',title:'Continue Stakewolf',description:'Continue after a committed decision, applying delayed consequences and opening the next round or final debrief.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:()=>{closeDialogs();nextRound();return result(snapshot());}}
  ];
  for(const tool of tools){try{Promise.resolve(registry.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
