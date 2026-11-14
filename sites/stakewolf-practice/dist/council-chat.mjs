import {councilView,councilAct} from './council.mjs';
import {interpretCouncilMessage,dialogueExamples} from './council-dialogue.mjs';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label=s=>s==='supports'?'Supports':s==='opposes'?'Opposes':'Conditional';
const budget=v=>v.phase==='council'?v.cost:v.aftermath?.cost??v.cost;
const allowed=new Set(['investigate','propose','promise','allocate']);
export function newCouncilChat(s){return {speakerId:councilView(s).stakeholders[0].id,draft:'',total:0,messages:[],pending:null,notice:''};}
function preview(s,p){
  if(!p||!Array.isArray(p.actions)||!p.actions.length||p.actions.length>4)return null;
  let next=s;
  for(const action of p.actions){
    if(!allowed.has(action.type))return null;
    const changed=councilAct(next,action);
    if(changed===next)return null;
    next=changed;
  }
  return next;
}
const append=(chat,message)=>[...chat.messages,message].slice(-12);
export function submitCouncilMessage(s,chat,text){
  if(typeof text!=='string'||!text.trim())return {...chat,pending:null,notice:'Write a question or offer first.'};
  if(text.length>600)return {...chat,pending:null,notice:'Keep this message within 600 characters so we can handle one clear request.'};
  const question=text.trim();
  const history=chat.messages.filter(m=>m.speakerId===chat.speakerId);
  const result=interpretCouncilMessage(s,chat.speakerId,question,{history});
  const proposed=result.pending&&preview(s,result.pending);
  return {...chat,total:chat.total+1,draft:'',notice:'',messages:append(chat,{speakerId:chat.speakerId,question,reply:result.reply,kind:result.kind,topic:result.topic,phase:s.phase}),pending:proposed?{...result.pending,base:JSON.stringify(s),speakerId:chat.speakerId}:null};
}
export function confirmCouncilMessage(s,chat){
  const pending=chat.pending;
  if(!pending||pending.base!==JSON.stringify(s)||pending.speakerId!==chat.speakerId)return {state:s,chat:{...chat,pending:null,notice:'The council has changed. Ask again to review an up-to-date offer.'}};
  const next=preview(s,pending);
  if(!next)return {state:s,chat:{...chat,pending:null,notice:'That request no longer fits the current round. No changes were made.'}};
  const v=councilView(next),person=v.stakeholders.find(p=>p.id===chat.speakerId);
  const inspected=pending.actions.filter(a=>a.type==='investigate').map(a=>v.records.find(r=>r.id===a.recordId));
  const reply=inspected.length?inspected.map(r=>`${r.title}: ${r.text}`).join('\n\n'):
    v.phase==='aftermath'?v.aftermath.reactions.find(r=>r.name===person.name).text:
    `Recorded. ${person.condition} Your next-round reservation is ${v.cost} of ${v.capacity} units.`;
  return {state:next,chat:{...chat,pending:null,notice:'Your confirmed interpretation has been applied.',messages:append(chat,{speakerId:chat.speakerId,question:null,reply,kind:'confirmed',topic:inspected[0]?`source:${inspected[0].id}`:undefined,phase:next.phase})}};
}
export function councilChatMarkup(s,chat){
  const v=councilView(s),person=v.stakeholders.find(p=>p.id===chat.speakerId),examples=dialogueExamples(v,chat.speakerId);
  const pending=chat.pending&&chat.pending.base===JSON.stringify(s)?chat.pending:null;
  const next=pending&&preview(s,pending),after=next&&councilView(next);
  return `<section class="council-chat" aria-labelledby="council-chat-title"><div class="chat-heading"><div><p class="eyebrow">YOUR WORDS / AT THE TABLE</p><h2 id="council-chat-title">Ask. Challenge. Make an offer.</h2></div><span class="outline-badge">LOCAL REPLIES · NO AI CALLS</span></div><div class="chat-layout"><div><form id="council-chat-form"><label for="council-speaker">Speak to</label><select id="council-speaker">${v.stakeholders.map(p=>`<option value="${esc(p.id)}" ${p.id===chat.speakerId?'selected':''}>${esc(p.name)} — ${esc(p.role)}</option>`).join('')}</select><blockquote class="chat-claim">“${esc(person.claim)}”</blockquote><label for="council-message">Your question or offer</label><textarea id="council-message" rows="3" maxlength="600" aria-describedby="chat-help" placeholder="What evidence supports that? What would change your mind?">${esc(chat.draft)}</textarea><p id="chat-help" class="council-muted">Use your own wording. Evidence inspections share the two-source budget. Offers show their interpretation before you confirm them.</p><button class="council-button" type="submit">Send to ${esc(person.name)} →</button></form><details class="chat-examples"><summary>Examples of questions you can ask</summary><ul>${examples.map(e=>`<li>${esc(e)}</li>`).join('')}</ul></details></div><div class="chat-conversation"><div class="chat-log" role="region" aria-label="Council conversation">${chat.messages.length?chat.messages.map(m=>{const p=v.stakeholders.find(x=>x.id===m.speakerId);return `<article class="chat-exchange" tabindex="-1">${m.question!==null?`<div class="chat-you"><span>You → ${esc(p.name)} · ${m.phase==='council'?'Council':m.phase==='aftermath'?'Next round':'Debrief'}</span><p>${esc(m.question)}</p></div>`:''}<div class="chat-reply"><span>${esc(p.name)} / ${esc(p.role)}${m.kind==='confirmed'?' · Confirmed':''}</span><p>${esc(m.reply)}</p></div></article>`;}).join(''):`<div class="chat-empty"><span aria-hidden="true">“</span><h3>Start with the claim<br>that troubles you.</h3><p>Questions can uncover evidence. A bargain can win support and leave less room for tomorrow’s work.</p></div>`}</div><div id="chat-response" tabindex="-1"><p class="chat-notice" role="status">${esc(chat.notice)}</p>${pending&&after?`<section class="chat-offer"><p class="eyebrow">CHECK MY UNDERSTANDING</p><h3>${esc(pending.label)}</h3><p>${esc(pending.summary)}</p><div class="chat-offer-cost"><span>Work reserved<br><b>${budget(v)} → ${budget(after)} / ${v.capacity}</b></span><span>Inspections left<br><b>${v.investigationRemaining} → ${after.investigationRemaining}</b></span></div><ul class="chat-offer-support">${v.stakeholders.map((p,i)=>`<li><b>${esc(p.name)}</b><span>${label(p.support)} → ${label(after.stakeholders[i].support)}</span></li>`).join('')}</ul><p class="council-muted">Nothing has changed yet. Confirm only if this matches your intent.</p><div class="chat-offer-actions"><button class="council-button" data-action="talk-confirm">Confirm this interpretation</button><button class="text-button" data-action="talk-cancel">Dismiss</button></div></section>`:''}</div></div></div><p class="chat-limits">These local replies recognise supported topics and may miss your meaning. Unsupported requests receive a clarification; no new facts, prices or promises are invented. The last 12 exchanges stay in this tab only. Replay clears them.</p></section>`;
}
