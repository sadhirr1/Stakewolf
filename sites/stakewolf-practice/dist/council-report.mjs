import {councilView} from './council.mjs';
import {buildCouncilCoaching} from './council-coaching.mjs';

const LIMIT=60;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const newCouncilAttempt=()=>({questions:[],events:[],droppedQuestions:0,droppedEvents:0,closed:null});
export function noteCouncilQuestion(attempt,phase,message){
  if(!attempt||phase==='debrief'||!message?.question)return attempt;
  const {speakerId,question,kind,topic}=message;
  return {...attempt,questions:[...attempt.questions,{speakerId,question,kind,topic,phase}].slice(-LIMIT),droppedQuestions:attempt.droppedQuestions+(attempt.questions.length>=LIMIT?1:0)};
}
export function noteCouncilChange(attempt,before,after,source,actions){
  if(!attempt||before===after||before.phase==='debrief')return attempt;
  const additions=actions.map(a=>({type:a.type,phase:before.phase,source}));
  const events=[...attempt.events,...additions];
  return {...attempt,events:events.slice(-LIMIT),droppedEvents:attempt.droppedEvents+Math.max(0,events.length-LIMIT),closed:before.phase==='council'&&after.phase==='aftermath'?councilView(before):attempt.closed};
}
export function councilReportMarkup(state,attempt){
  const f=buildCouncilCoaching(state,attempt);
  if(!f)return '';
  return `<section class="council-coaching" aria-labelledby="council-coaching-title"><div class="section-line"><div><p class="eyebrow">YOUR COUNCIL / PERSONAL FEEDBACK</p><h2 id="council-coaching-title">What your decisions show.</h2></div><span class="outline-badge">LOCAL COACHING · NO SCORE</span></div><p class="council-muted">A review of the actions recorded in this attempt. Use it to sharpen your next interview explanation.</p><div class="council-coach-grid">${f.sections.map((s,i)=>`<article class="council-coach-card" aria-labelledby="coach-${esc(s.id)}"><p class="eyebrow">0${i+1} / ${esc(s.title)}</p><h3 id="coach-${esc(s.id)}">${esc(s.summary)}</h3><ul>${s.observations.map(o=>`<li>${esc(o)}</li>`).join('')}</ul><div class="council-coach-next"><strong>Try next time</strong><p>${esc(s.next)}</p></div></article>`).join('')}</div><section class="council-coach-rehearsal"><p class="eyebrow">TURN THE EXPERIENCE INTO AN INTERVIEW ANSWER</p><h3>Explain the evidence, the bargain and the cost.</h3><ol>${f.rehearsal.map(p=>`<li>${esc(p)}</li>`).join('')}</ol></section><details class="council-coach-limits"><summary>How this feedback works</summary><ul>${f.limits.map(l=>`<li>${esc(l)}</li>`).join('')}</ul></details></section>`;
}
