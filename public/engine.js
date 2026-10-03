import { PEOPLE, ROUNDS, RULES_VERSION, DELAY_RULES, MEMORY_RULES } from './scenario.js';

export const METRICS = ['delivery', 'trust', 'quality'];
const PEOPLE_IDS = PEOPLE.map(person => person.id);
const copy = value => structuredClone(value);
const clamp = value => Math.max(0, Math.min(100, value));
const invalidState = message => Object.assign(new Error(`Invalid state: ${message}`), {code:'INVALID_STATE'});
const requirePlay = state => { if (state.phase !== 'play') throw new Error('There is no active decision right now.'); };
const eventId = (state, round, type, key) => `${state.runId}/R${round}/${type}/${key}`;

export function createGame() {
  return { version:1, runId:crypto.randomUUID(), rulesVersion:RULES_VERSION, events:[],
    knowledge:Object.fromEntries(['player', ...PEOPLE_IDS].map(id=>[id,[]])),
    phase:'briefing', round:0, metrics:{delivery:50,trust:55,quality:50},
    relationships:Object.fromEntries(PEOPLE_IDS.map(id=>[id,50])), flags:[], evidence:[],
    asked:[], talksLeft:2, history:[], arrival:null };
}
export function currentRound(state) { return ROUNDS[state.round]; }
function measures(state) { return {metrics:{...state.metrics},relationships:{...state.relationships}}; }
function effects(before, state, requested = {}) {
  return Object.fromEntries(['metrics','relationships'].map(group=>[group,{
    before:{...before[group]}, requested:Object.fromEntries(Object.keys(before[group]).map(key=>[key,requested[group]?.[key]??0])),
    actual:Object.fromEntries(Object.keys(before[group]).map(key=>[key,state[group][key]-before[group][key]])),
    after:{...state[group]},
  }]));
}
function grant(state, audience, id) {
  for (const actor of audience) {
    const known = state.knowledge[actor] ??= [];
    if (!known.includes(id)) known.push(id);
  }
}
function appendEvent(state, {type, key, ruleId, actor='narrator', sourceEventIds=[], audience=[], playerVisible=true,
  evidenceStatus='authored-fact', details={}, before=measures(state), requested={}, bonus}) {
  const id = eventId(state, state.round+1, type, key);
  if (state.events.some(event=>event.eventId===id)) throw invalidState(`duplicate event ${ruleId}`);
  for (const source of sourceEventIds) {
    if (!state.events.some(event=>event.eventId===source)) throw invalidState(`missing source for ${ruleId}`);
  }
  const event = {runId:state.runId,eventId:id,sequence:state.events.length+1,round:state.round+1,
    roundId:currentRound(state).id,rulesVersion:RULES_VERSION,type,ruleId,actor,
    sourceEventIds:[...sourceEventIds],audience:[...new Set([...audience,...(playerVisible?['player']:[])])],playerVisible,evidenceStatus,
    details:copy(details),effects:effects(before,state,requested),...(bonus?{bonus:copy(bonus)}:{})};
  state.events.push(event);
  grant(state,event.audience,id);
  return event;
}
function requireEvent(state, type, ruleId, round) {
  const found = state.events?.filter(event=>event.type===type && event.ruleId===ruleId && event.round===round) ?? [];
  if (state.rulesVersion!==RULES_VERSION || found.length!==1 || found[0].runId!==state.runId || found[0].rulesVersion!==RULES_VERSION ||
      found[0].roundId!==ROUNDS[round-1]?.id || found[0].sequence!==state.events.indexOf(found[0])+1)
    throw invalidState(`missing or duplicate ${ruleId}`);
  return found[0];
}
function predecessor(state, index) {
  const round = ROUNDS[index];
  if (!round) throw invalidState('unknown predecessor round');
  if (!Array.isArray(state.history) || !Array.isArray(state.events) || !Array.isArray(state.flags))
    throw invalidState('missing decision records');
  const rows = state.history.filter(row=>row.round===index);
  if (rows.length!==1 || rows[0].roundId!==round.id) throw invalidState(`missing or duplicate decision for ${round.id}`);
  const choice = round.choices.find(item=>item.id===rows[0].choiceId);
  if (!choice) throw invalidState(`unknown predecessor choice for ${round.id}`);
  const decisions = state.events.filter(event=>event.type==='decision' && event.round===index+1);
  const decision = requireEvent(state,'decision',`choice:${round.id}:${choice.id}`,index+1);
  if (decisions.length!==1 || decision.details.choiceId!==choice.id || rows[0].eventId!==decision.eventId ||
      decision.eventId!==eventId(state,index+1,'decision',choice.id)) throw invalidState(`contradictory decision for ${round.id}`);
  const roundFlags = round.choices.flatMap(item=>item.flags);
  const observedFlags = state.flags.filter(flag=>roundFlags.includes(flag));
  if (observedFlags.length!==choice.flags.length || choice.flags.some(flag=>!observedFlags.includes(flag)))
    throw invalidState(`contradictory flags for ${round.id}`);
  return {choice,decision,history:rows[0],round};
}
function memorySources(state, rule) {
  const prior = predecessor(state,rule.originRound-1);
  if (!rule.text[prior.choice.id] || !prior.decision.audience.includes(rule.personId) ||
      !state.knowledge[rule.personId]?.includes(prior.decision.eventId))
    throw invalidState(`unavailable decision knowledge for ${rule.ruleId}`);
  const sources = [prior.decision.eventId];
  if (rule.requiresDelayed) {
    const delayed = requireEvent(state,'delayed',`delay:${prior.round.id}:${prior.choice.id}`,rule.round);
    if (state.events.filter(event=>event.type==='delayed' && event.round===rule.round).length!==1 ||
        delayed.eventId!==eventId(state,rule.round,'delayed',prior.choice.id) ||
        delayed.sourceEventIds.length!==1 || delayed.sourceEventIds[0]!==prior.decision.eventId ||
        !delayed.audience.includes(rule.personId) || !state.knowledge[rule.personId]?.includes(delayed.eventId) ||
        delayed.details.choiceId!==prior.choice.id) throw invalidState(`unavailable delayed knowledge for ${rule.ruleId}`);
    sources.push(delayed.eventId);
  }
  return {text:rule.text[prior.choice.id],sourceEventIds:sources};
}
function enterRound(state) {
  appendEvent(state,{type:'story',key:'briefing',ruleId:`story:briefing:${currentRound(state).id}`,
    audience:['player',...PEOPLE_IDS],details:{title:currentRound(state).title}});
  for (const person of PEOPLE_IDS) appendEvent(state,{type:'story',key:`knowledge-${person}`,
    ruleId:`story:knowledge:${currentRound(state).id}:${person}`,actor:person,audience:[person],playerVisible:false,
    details:{questionIds:currentRound(state).conversations[person].map(question=>question.id)}});
  if (state.round===2) {
    appendEvent(state,{type:'story',key:'planning-note',ruleId:'story:planning-note',audience:['ishan','leah'],playerVisible:false,
      details:{origin:'earlier team planning, before the run',text:'What evidence would make a limited launch safe?',context:'The full note also mentions a review gate.'}});
    appendEvent(state,{type:'story',key:'rumor-circulates',ruleId:'story:rumor-circulates',
      audience:['player',...PEOPLE_IDS,'engineering-channel'],evidenceStatus:'unverified-claim',
      details:{text:'Product has lost confidence in Engineering',status:'uncorrected',source:'cropped earlier team-planning note; wider spread unattributed'}});
    appendEvent(state,{type:'story',key:'crop-admission',ruleId:'story:crop-admission',actor:'mara',audience:['mara'],playerVisible:false,
      evidenceStatus:'attributed-account',details:{text:'Mara shared a crop with two leads to discuss launch planning and added her interpretation; wider spread is unknown.'}});
  }
  for (const rule of MEMORY_RULES.filter(rule=>rule.round===state.round+1)) {
    const memory = memorySources(state,rule);
    appendEvent(state,{type:'memory',key:rule.personId,ruleId:rule.ruleId,actor:rule.personId,
      audience:['player',rule.personId],evidenceStatus:'interpretation',sourceEventIds:memory.sourceEventIds,details:{text:memory.text}});
  }
}
export function getMemoryValidationErrors(state, personId) {
  if (personId===undefined) return MEMORY_RULES.filter(rule=>rule.round===state.round+1)
    .flatMap(rule=>getMemoryValidationErrors(state,rule.personId));
  const rule = MEMORY_RULES.find(rule=>rule.round===state.round+1 && rule.personId===personId);
  if (!rule || state.phase!=='play') return [];
  try {
    const expected = memorySources(state,rule);
    const memory = requireEvent(state,'memory',rule.ruleId,rule.round);
    if (memory.details.text!==expected.text || memory.actor!==personId || !memory.playerVisible ||
        memory.eventId!==eventId(state,rule.round,'memory',personId) ||
        memory.audience.length!==2 || !memory.audience.includes('player') || !memory.audience.includes(personId) ||
        !state.knowledge[personId]?.includes(memory.eventId) || !state.knowledge.player?.includes(memory.eventId) ||
        JSON.stringify(memory.sourceEventIds)!==JSON.stringify(expected.sourceEventIds)) throw invalidState(`contradictory memory ${rule.ruleId}`);
    return [];
  } catch (error) { return [error.message]; }
}
export function getConversationMemory(state, personId) {
  const rule = MEMORY_RULES.find(rule=>rule.round===state.round+1 && rule.personId===personId);
  if (!rule || state.phase!=='play' || getMemoryValidationErrors(state,personId).length) return null;
  const event = requireEvent(state,'memory',rule.ruleId,rule.round);
  return {text:event.details.text,sourceEventIds:[...event.sourceEventIds],ruleId:event.ruleId,eventId:event.eventId};
}
export function getPlayerEvents(state) {
  return copy(state.events.filter(event=>event.playerVisible || state.knowledge.player.includes(event.eventId)));
}
export function beginGame(state) {
  if (state.phase!=='briefing') throw new Error('This attempt has already started.');
  const next = copy(state); next.phase='play'; enterRound(next); return next;
}
export function askQuestion(state, personId, questionId) {
  requirePlay(state);
  const person = PEOPLE.find(person=>person.id===personId);
  const question = currentRound(state).conversations[personId]?.find(question=>question.id===questionId);
  if (!person || !question) throw new Error('Choose a question from this round.');
  if (state.asked.includes(questionId)) throw new Error('You already asked this question.');
  if (state.talksLeft<1) throw new Error('You have used both conversations this round.');
  const next=copy(state), before=measures(state);
  next.talksLeft--; next.asked.push(questionId);
  next.evidence.push({id:question.id,round:state.round,person:personId,title:question.title,text:question.evidence,kind:question.kind,question:question.question,answer:question.answer});
  next.relationships[personId]=clamp(next.relationships[personId]+2);
  const knowledge = requireEvent(next,'story',`story:knowledge:${currentRound(state).id}:${personId}`,state.round+1);
  const sources = [knowledge.eventId];
  if (questionId==='full-thread') sources.push(requireEvent(next,'story','story:planning-note',3).eventId);
  if (questionId==='screenshot-source') sources.push(requireEvent(next,'story','story:crop-admission',3).eventId);
  appendEvent(next,{type:'question',key:questionId,ruleId:`question:${currentRound(state).id}:${questionId}`,actor:personId,
    audience:['player',personId],evidenceStatus:question.kind==='Unverified concern'?'unverified-claim':'attributed-account',
    sourceEventIds:sources,details:{questionId,title:question.title,text:question.evidence,kind:question.kind},
    before,requested:{relationships:{[personId]:2}}});
  if (questionId==='full-thread') grant(next,['player'],sources[1]);
  return next;
}
function shiftMetrics(state, delta) {
  const actual={};
  for (const key of METRICS) { const old=state.metrics[key]; state.metrics[key]=clamp(old+(delta[key]||0)); actual[key]=state.metrics[key]-old; }
  return actual;
}
export function decide(state, choiceId, writtenDecision='') {
  requirePlay(state);
  const round=currentRound(state), choice=round.choices.find(choice=>choice.id===choiceId);
  if (!choice) throw new Error('Choose a valid approach.');
  if (typeof writtenDecision!=='string' || writtenDecision.length>1200) throw new Error('Keep your decision within 1,200 characters.');
  if (writtenDecision && writtenDecision.trim().length<20) throw new Error('Add a little more detail to your decision.');
  if (state.history.some(row=>row.round===state.round) || state.events.some(event=>event.type==='decision' && event.round===state.round+1))
    throw invalidState('this round already has a decision');
  const next=copy(state), before=measures(state), requested={...choice.delta};
  const config=choice.evidenceBonus;
  const questionEvent=config?state.events.find(event=>event.type==='question' && event.details.questionId===config.id):null;
  const eligible=Boolean(config && questionEvent && state.evidence.some(evidence=>evidence.id===config.id));
  const bonus=config?{questionId:config.id,eligible,requested:config.amount,applied:eligible?config.amount:0,metric:config.metric,
    marginalBenefit:eligible?clamp(state.metrics[config.metric]+(choice.delta[config.metric]||0)+config.amount)-clamp(state.metrics[config.metric]+(choice.delta[config.metric]||0)):0,
    sourceEventId:eligible?questionEvent.eventId:null}:null;
  if (eligible) requested[config.metric]=(requested[config.metric]||0)+config.amount;
  const input=appendEvent(next,{type:'input',key:choiceId,ruleId:`input:${round.id}:${choiceId}`,actor:'player',audience:['player'],
    evidenceStatus:'confirmed-input',details:{mode:writtenDecision?'typed':'preset',text:writtenDecision.trim()}});
  const actual=shiftMetrics(next,requested);
  for (const person of PEOPLE_IDS) next.relationships[person]=clamp(next.relationships[person]+(choice.relations[person]||0));
  next.flags.push(...choice.flags);
  const decision=appendEvent(next,{type:'decision',key:choiceId,ruleId:`choice:${round.id}:${choiceId}`,actor:'player',
    audience:['player',...PEOPLE_IDS],details:{choiceId,title:choice.title,outcome:choice.outcome,reactions:{...choice.reactions},inputEventId:input.eventId},
    sourceEventIds:[...state.events.filter(event=>event.type==='question' && event.round===state.round+1).map(event=>event.eventId)],
    before,requested:{metrics:requested,relationships:choice.relations},bonus});
  next.history.push({round:state.round,roundId:round.id,choiceId,title:choice.title,writtenDecision:writtenDecision.trim(),
    headline:choice.headline,outcome:choice.outcome,delta:actual,bonus:eligible && bonus.marginalBenefit>0?config.reason:null,
    reactions:{...choice.reactions},heard:state.evidence.filter(evidence=>evidence.round===state.round).map(evidence=>evidence.id),
    metrics:{...next.metrics},followup:null,eventId:decision.eventId,bonusEffect:bonus});
  if (round.id==='rumor' && choiceId!=='ignore') {
    const note=requireEvent(next,'story','story:planning-note',3);
    const rumor=requireEvent(next,'story','story:rumor-circulates',3);
    const audience=choiceId==='open'?['player',...PEOPLE_IDS,'engineering-channel']:['player','mara','ishan'];
    appendEvent(next,{type:'disclosure',key:choiceId,ruleId:`disclosure:rumor:${choiceId}`,actor:'player',audience,
      sourceEventIds:[decision.eventId,rumor.eventId,note.eventId],details:{topic:'planning-note',
        text:choiceId==='open'?'The full planning note and correction are shared publicly.':'The full planning note and private leadership agreement are shared with Mara and Ishan.'}});
    grant(next,audience,note.eventId);
  }
  next.phase='result'; return next;
}
export function advance(state) {
  if (state.phase!=='result') throw new Error('Complete the current decision first.');
  const prior=predecessor(state,state.round);
  if (state.history.length!==state.round+1) throw invalidState('unexpected number of committed decisions');
  for (let index=0; index<state.round; index++) predecessor(state,index);
  const next=copy(state);
  if (state.round===ROUNDS.length-1) {
    next.phase='complete';
    appendEvent(next,{type:'completion',key:'complete',ruleId:'completion:launch-room',audience:['player'],
      sourceEventIds:state.events.filter(event=>event.type==='decision').map(event=>event.eventId),
      details:{completedRounds:ROUNDS.length,privateMotives:PEOPLE.map(({id,agenda})=>({personId:id,text:agenda}))}});
    return next;
  }
  const rule=DELAY_RULES[prior.round.id]?.[prior.choice.id];
  if (!rule) throw invalidState('missing authored delayed rule');
  next.round++; next.phase='play'; next.asked=[]; next.talksLeft=2;
  const before=measures(next), actual=shiftMetrics(next,rule.delta);
  const delayed=appendEvent(next,{type:'delayed',key:prior.choice.id,ruleId:`delay:${prior.round.id}:${prior.choice.id}`,
    sourceEventIds:[prior.decision.eventId],audience:rule.audience,details:{choiceId:prior.choice.id,text:rule.text},
    before,requested:{metrics:rule.delta}});
  next.arrival={text:rule.text,delta:actual,eventId:delayed.eventId};
  next.history[next.history.length-1].followup={...next.arrival};
  enterRound(next);
  return next;
}
export function interpretDecision(state,text) {
  requirePlay(state);
  if(typeof text!=='string' || text.trim().length<20) throw new Error('Write at least 20 characters so you can record a meaningful decision.');
  if(text.length>1200) throw new Error('Keep your decision within 1,200 characters.');
  const normalized=text.toLowerCase().replace(/[’']/g,'');
  const scores=currentRound(state).choices.map(c=>({id:c.id,score:c.keywords.reduce((n,word)=>n+(normalized.includes(word)?1:0),0)})).sort((a,b)=>b.score-a.score);
  // A tie or no match requires the player to select the approach. The match is
  // only a convenience; it is never described as semantic or model analysis.
  return {suggestedId:scores[0].score>0 && scores[0].score>scores[1].score?scores[0].id:null,text:text.trim()};
}
export function relationshipLabel(value) {return value>=65?'Backing your decisions':value>=48?'Still open to persuasion':value>=32?'Guarded':'Trust is strained';}
const OUTCOMES = [
  {ruleId:'outcome:earned',title:'You earned the next step.',predicate:'Quality ≥ 65, team trust ≥ 65, delivery ≥ 40',description:'The authored rubric combines quality and trust of at least 65 with delivery of at least 40.',matches:m=>m.quality>=65 && m.trust>=65 && m.delivery>=40},
  {ruleId:'outcome:deadline',title:'Credibility needs a deadline.',predicate:'Earlier rules excluded; quality ≥ 65 and team trust ≥ 60',description:'After earlier rules are excluded, the authored rubric finds quality of at least 65 and trust of at least 60.',matches:m=>m.quality>=65 && m.trust>=60},
  {ruleId:'outcome:borrowed',title:'You launched on borrowed time.',predicate:'Earlier rules excluded; delivery ≥ 70 and quality < 55',description:'After earlier rules are excluded, delivery is at least 70 while quality is below 55.',matches:m=>m.delivery>=70 && m.quality<55},
  {ruleId:'outcome:room',title:'The product is ahead of the room.',predicate:'Earlier rules excluded; quality ≥ 60 and team trust < 55',description:'After earlier rules are excluded, quality is at least 60 while trust is below 55.',matches:m=>m.quality>=60 && m.trust<55},
  {ruleId:'outcome:proof',title:'The room believes you. Now prove it.',predicate:'Earlier rules excluded; team trust ≥ 65',description:'After earlier rules are excluded, trust is at least 65.',matches:m=>m.trust>=65},
  {ruleId:'outcome:fragile',title:'A fragile compromise.',predicate:'No earlier outcome condition matched',description:'The final signals do not meet any earlier outcome condition.',matches:()=>true},
];
export function evaluateOutcome(metrics) {
  if(!METRICS.every(key=>Number.isFinite(metrics[key]) && metrics[key]>=0 && metrics[key]<=100)) throw invalidState('invalid outcome metrics');
  const {matches,...rule}=OUTCOMES.find(rule=>rule.matches(metrics));
  const prompts={earned:'What evidence would justify the next bounded expansion?',deadline:'What scope and deadline would make the next commitment inspectable?',borrowed:'Which exposure would you narrow while testing the weakest quality signal?',room:'What shared record or conversation would help people challenge the next decision?',proof:'Which bounded experiment would distinguish agreement from product evidence?',fragile:'Which tradeoff and uncertainty would you make explicit before the next promise?'};
  return {...rule,prompt:prompts[rule.ruleId.split(':')[1]],metrics:{...metrics}};
}
function completedTrace(state) {
  if(state.phase!=='complete') throw new Error('Finish all five decisions to see the debrief.');
  if(state.round!==4 || state.history.length!==5) throw invalidState('incomplete decision trace');
  const decisions=ROUNDS.map((_,index)=>predecessor(state,index).decision);
  const completion=requireEvent(state,'completion','completion:launch-room',5);
  if(completion.details.completedRounds!==5 || JSON.stringify(completion.sourceEventIds)!==JSON.stringify(decisions.map(event=>event.eventId))) throw invalidState('unsupported completion record');
  const seen=new Set();
  const cursor={metrics:{delivery:50,trust:55,quality:50},relationships:Object.fromEntries(PEOPLE_IDS.map(id=>[id,50]))};
  for(const [index,event] of state.events.entries()) {
    if(seen.has(event.eventId) || event.runId!==state.runId || event.rulesVersion!==RULES_VERSION || event.sequence!==index+1 || event.roundId!==ROUNDS[event.round-1]?.id || !Array.isArray(event.sourceEventIds) || event.sourceEventIds.some(id=>!seen.has(id))) throw invalidState('broken event citation trace');
    for(const group of ['metrics','relationships']) for(const key of Object.keys(cursor[group])) {
      const effect=event.effects?.[group];
      if(!effect || effect.before?.[key]!==cursor[group][key] || !Number.isFinite(effect.requested?.[key]) || effect.after?.[key]!==clamp(effect.before[key]+effect.requested[key]) || effect.actual?.[key]!==effect.after[key]-effect.before[key]) throw invalidState('inconsistent recorded effect');
      cursor[group][key]=effect.after[key];
    }
    seen.add(event.eventId);
  }
  if(completion!==state.events.at(-1)) throw invalidState('completion must finish the trace');
  for(const group of ['metrics','relationships']) for(const key of Object.keys(cursor[group])) if(cursor[group][key]!==state[group][key]) throw invalidState('final signals disagree with the trace');
  for(const person of PEOPLE) if(completion.details.privateMotives?.filter(item=>item.personId===person.id && item.text===person.agenda).length!==1) throw invalidState('missing authored motive provenance');
  const questions=state.events.filter(event=>event.type==='question');
  if(questions.length!==state.evidence.length || new Set(questions.map(event=>event.details.questionId)).size!==questions.length) throw invalidState('inconsistent conversation count');
  for(const question of questions) {
    const authored=ROUNDS[question.round-1].conversations[question.actor]?.find(item=>item.id===question.details.questionId);
    if(!authored || question.details.title!==authored.title || question.details.text!==authored.evidence || !state.evidence.some(item=>item.id===question.details.questionId && item.person===question.actor && item.round===question.round-1)) throw invalidState('missing or contradictory conversation evidence');
  }
  for(const decision of decisions) {
    const {choice,history,round}=predecessor(state,decision.round-1), config=choice.evidenceBonus;
    const question=config?questions.find(event=>event.details.questionId===config.id && event.round===decision.round):null;
    const eligible=Boolean(question), bonus=decision.bonus;
    const expected=config?{questionId:config.id,eligible,requested:config.amount,applied:eligible?config.amount:0,metric:config.metric,
      marginalBenefit:eligible?clamp(decision.effects.metrics.before[config.metric]+(choice.delta[config.metric]||0)+config.amount)-clamp(decision.effects.metrics.before[config.metric]+(choice.delta[config.metric]||0)):0,sourceEventId:question?.eventId||null}:null;
    if(expected ? !bonus || Object.keys(expected).some(key=>bonus[key]!==expected[key]) : bonus) throw invalidState('contradictory evidence bonus');
    if(decision.details.title!==choice.title || decision.details.outcome!==choice.outcome || PEOPLE_IDS.some(id=>decision.details.reactions?.[id]!==choice.reactions[id])) throw invalidState('contradictory authored decision');
    for(const key of METRICS) if(decision.effects.metrics.requested[key]!==((choice.delta[key]||0)+(eligible && config.metric===key?config.amount:0))) throw invalidState('contradictory decision effect');
    for(const id of PEOPLE_IDS) if(decision.effects.relationships.requested[id]!== (choice.relations[id]||0)) throw invalidState('contradictory relationship effect');
    const input=state.events.find(event=>event.eventId===decision.details.inputEventId && event.type==='input');
    if(!input || input.round!==decision.round || input.sequence>=decision.sequence || input.details.text!==history.writtenDecision || !['preset','typed'].includes(input.details.mode) || (input.details.mode==='preset' && input.details.text!=='')) throw invalidState('contradictory confirmed input');
    if(decision.round<5) {
      const delayed=requireEvent(state,'delayed','delay:'+round.id+':'+choice.id,decision.round+1), rule=DELAY_RULES[round.id][choice.id];
      if(delayed.sourceEventIds.length!==1 || delayed.sourceEventIds[0]!==decision.eventId || delayed.details.text!==rule.text || delayed.details.choiceId!==choice.id || METRICS.some(key=>delayed.effects.metrics.requested[key]!== (rule.delta[key]||0))) throw invalidState('contradictory delayed consequence');
    }
  }
  return {decisions,completion,questions};
}
function citationFor(event,visibleIds) {
  const person=PEOPLE.find(person=>person.id===event.actor);
  const names={decision:'Decision',question:'Conversation',delayed:'Later consequence',completion:'Completed attempt',input:'Confirmed input',disclosure:'Disclosure',memory:'Stakeholder recollection',story:'Scenario record'};
  const detail=event.type==='decision'?event.details.title:event.type==='question'?person.name+' — '+event.details.title:event.type==='input'?event.details.mode==='typed'?'Your wording':'Prepared approach':event.details.title||'';
  const text=event.type==='decision'?event.details.outcome:event.type==='completion'?'Five decisions completed. Final signals and authored motives are recorded here.':event.type==='input'?event.details.mode==='typed'?event.details.text:'A prepared approach was confirmed; no player wording was supplied.':event.details.text||event.details.title||'';
  return {eventId:event.eventId,label:'Round '+event.round+' · '+names[event.type]+(detail?': '+detail:''),round:event.round,type:event.type,status:event.evidenceStatus,text,effects:copy(event.effects),sourceEventIds:event.sourceEventIds.filter(id=>visibleIds.has(id))};
}
export function getDebrief(state) {
  const {decisions,completion,questions}=completedTrace(state);
  const visible=getPlayerEvents(state), visibleIds=new Set(visible.map(event=>event.eventId));
  const citations=visible.map(event=>citationFor(event,visibleIds));
  const sources=ids=>{
    const unique=[...new Set(ids)];
    if(!unique.length || unique.some(id=>!visibleIds.has(id))) throw invalidState('unavailable debrief source');
    return unique;
  };
  const delayed=state.events.filter(event=>event.type==='delayed');
  const outcome={...evaluateOutcome(state.metrics),sourceEventIds:sources([...decisions.map(event=>event.eventId),...delayed.map(event=>event.eventId),completion.eventId])};
  const reflections=[];
  const add=(id,title,fact,interpretation,prompt,ids)=>reflections.push({id,title,fact,text:fact,interpretation,prompt,sourceEventIds:sources(ids)});
  add('conversations','How you gathered evidence',
    'You used '+questions.length+' of 10 optional conversations and heard from '+new Set(questions.map(event=>event.actor)).size+' of 4 stakeholders.',
    'These are the perspectives recorded in this attempt; they do not establish certainty or what you considered privately.',
    'Which unasked question, or conflicting account, would most change your next decision?',questions.length?questions.map(event=>event.eventId):[completion.eventId]);
  const positive=decisions.filter(event=>event.bonus?.marginalBenefit>0);
  const capped=decisions.filter(event=>event.bonus?.eligible && event.bonus.marginalBenefit===0);
  const bonusDecisions=decisions.filter(event=>event.bonus?.eligible);
  for(const event of bonusDecisions) {
    const question=questions.find(question=>question.eventId===event.bonus.sourceEventId && question.details.questionId===event.bonus.questionId);
    if(!question || !event.sourceEventIds.includes(question.eventId)) throw invalidState('missing bonus evidence source');
  }
  add('evidence-bonus','Recorded evidence bonuses',
    positive.length+' decision'+(positive.length===1?'':'s')+' used recorded evidence to gain additional points.'+(capped.length?' '+capped.length+' eligible bonus'+(capped.length===1?'':'es')+' added no points at the score cap.':''),
    'This measures the authored rule’s extra points, not the quality of your reasoning.',
    'Which evidence changed your approach, and which did you collect without using?',bonusDecisions.length?bonusDecisions.flatMap(event=>[event.eventId,event.bonus.sourceEventId]):[completion.eventId]);
  const themes=[
    ['quiet-fix','consent','quiet','Explaining earlier recordings','How would you explain the earlier recordings and the change in policy?'],
    ['ignored-rumor','rumor','ignore','A private report and the checklist','How could a private defect reach the shared checklist without indiscriminate disclosure?'],
    ['atlas-retention','consent','exception','The cost of an account exception','How would you compare the review cost with this account’s need?'],
    ['atlas-workflow','scope','custom','A conditional customer commitment','What would distinguish this account’s conditional commitment from wider demand?'],
  ];
  for(const [id,roundId,choiceId,title,prompt] of themes) {
    const decision=decisions.find(event=>event.roundId===roundId && event.details.choiceId===choiceId);
    if(!decision) continue;
    const delayed=requireEvent(state,'delayed','delay:'+roundId+':'+choiceId,decision.round+1);
    if(!delayed.sourceEventIds.includes(decision.eventId)) throw invalidState('unsupported later consequence');
    add(id,title,'You chose “'+decision.details.title+'”. Later: '+delayed.details.text,
      'This is a scripted consequence of that approach in this scenario.',prompt,[decision.eventId,delayed.eventId]);
  }
  const decisionRecords=decisions.map(decision=>{
    const input=state.events.find(event=>event.eventId===decision.details.inputEventId && event.type==='input');
    if(!input || input.round!==decision.round) throw invalidState('missing confirmed input source');
    const later=state.events.filter(event=>event.type==='delayed' && event.sourceEventIds.includes(decision.eventId));
    if(later.length!==(decision.round<5?1:0)) throw invalidState('missing or duplicate later consequence');
    return {round:decision.round,choiceId:decision.details.choiceId,title:decision.details.title,wording:input.details.text,inputMode:input.details.mode,
      outcome:decision.details.outcome,reactions:copy(decision.details.reactions),effects:copy(decision.effects),bonus:copy(decision.bonus||null),
      followup:later[0]?{text:later[0].details.text,effects:copy(later[0].effects),sourceEventIds:[later[0].eventId]}:null,
      sourceEventIds:sources([decision.eventId,input.eventId,...decision.sourceEventIds,...later.map(event=>event.eventId)])};
  });
  const agendas=PEOPLE.map(person=>({personId:person.id,name:person.name,role:person.role,
    text:completion.details.privateMotives.find(item=>item.personId===person.id).text,prompt:person.tell,
    relationship:completion.effects.relationships.after[person.id],sourceEventIds:sources([completion.eventId,...[...questions,...decisions].filter(event=>event.effects.relationships.requested[person.id]!==0).map(event=>event.eventId)])}));
  const counts={conversations:questions.length,stakeholders:new Set(questions.map(event=>event.actor)).size,positiveBonuses:positive.length,cappedBonuses:capped.length};
  const cited=new Set([outcome,...reflections,...decisionRecords,...agendas].flatMap(item=>item.sourceEventIds));
  // Follow only already-allowed ancestors. A visible account never reveals a private parent.
  for(const id of cited) for(const parent of citations.find(item=>item.eventId===id)?.sourceEventIds||[]) cited.add(parent);
  return {title:outcome.title,description:outcome.description,outcome,counts,reflections,decisions:decisionRecords,agendas,citations:citations.filter(item=>cited.has(item.eventId))};
}
export function formatDecisionRecord(state) {
  const debrief=getDebrief(state);
  const refs=ids=>ids.map(id=>'['+(debrief.citations.findIndex(item=>item.eventId===id)+1)+']').join(' ');
  const effectLines=effects=>['metrics','relationships'].flatMap(group=>Object.keys(effects[group].before).map(key=>
    key+': '+effects[group].before[key]+' → '+effects[group].after[key]+'; actual '+effects[group].actual[key]+'; requested '+effects[group].requested[key]));
  const lines=['STAKEWOLF — THE LAUNCH ROOM','Scenario interpretation: '+debrief.title,debrief.description,
    'Matched rubric: '+debrief.outcome.ruleId+' — '+debrief.outcome.predicate,'Reflection prompt: '+debrief.outcome.prompt,
    'Final signals: '+METRICS.map(key=>key+' '+debrief.outcome.metrics[key]+'/100').join(', '),refs(debrief.outcome.sourceEventIds),'',
    'This authored rubric describes game signals; it is not a personality or professional assessment.',''];
  for(const item of debrief.reflections) lines.push(item.title,'Observation: '+item.fact,'Interpretation: '+item.interpretation,'Reflection prompt: '+item.prompt,refs(item.sourceEventIds),'');
  for(const decision of debrief.decisions) {
    lines.push('ROUND '+decision.round,'Confirmed approach: '+decision.title);
    if(decision.inputMode==='typed') lines.push('Your wording:',decision.wording);
    lines.push('Authored response: '+decision.outcome,...effectLines(decision.effects));
    for(const person of PEOPLE) lines.push(person.name+': '+decision.reactions[person.id]);
    if(decision.bonus?.eligible) lines.push('Evidence bonus: eligible; requested '+decision.bonus.requested+'; additional points '+decision.bonus.marginalBenefit);
    if(decision.followup) lines.push('Later: '+decision.followup.text,...effectLines(decision.followup.effects));
    lines.push(refs(decision.sourceEventIds),'');
  }
  for(const agenda of debrief.agendas) lines.push('Authored motive: '+agenda.name,agenda.text,'Final relationship: '+agenda.relationship+'/100 — '+relationshipLabel(agenda.relationship),'Reflection prompt: '+agenda.prompt,refs(agenda.sourceEventIds),'');
  lines.push('SOURCES');
  debrief.citations.forEach((citation,index)=>lines.push('['+(index+1)+'] '+citation.label,'Event ID: '+citation.eventId,'Evidence status: '+citation.status,citation.text,...effectLines(citation.effects),citation.sourceEventIds.length?'Earlier sources: '+refs(citation.sourceEventIds):'',''));
  return lines.join('\n');
}
