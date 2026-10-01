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
export function getDebrief(state) {
  if(state.phase!=='complete') throw new Error('Finish all five decisions to see the debrief.');
  const {delivery,trust,quality}=state.metrics;
  let title,description;
  if(quality>=65 && trust>=65 && delivery>=40) { title='You earned the next step.';description='Relay has a credible basis for controlled expansion. The product has improved, the room is still sharing information, and you have enough momentum to act. The next test is whether your release criteria hold up with unfamiliar teams.'; }
  else if(quality>=65 && trust>=60) {title='Credibility needs a deadline.';description='You protected product quality and kept the team engaged, but repeated delays weakened momentum. Relay can move forward once you turn its safeguards into a concrete release date and a small, testable scope.';}
  else if(delivery>=70 && quality<55) {title='You launched on borrowed time.';description='You created commercial momentum faster than the product could become dependable. The open risks now travel with the release. Your next responsibility is to narrow exposure, repair the experience, and correct any overstatement.';}
  else if(quality>=60 && trust<55) {title='The product is ahead of the room.';description='The product has a stronger foundation, but the team is less willing to share uncertainty. A good release can still fail when important information stays private. Restoring a shared, credible record is the next product decision.';}
  else if(trust>=65) {title='The room believes you. Now prove it.';description='You built enough trust for people to keep talking. The product evidence is still incomplete, so agreement needs to turn into a bounded experiment with a clear owner and a stop condition.';}
  else {title='A fragile compromise.';description='Relay leaves the review with unresolved tension across delivery, trust, and product quality. Revisit the weakest signal, narrow the next promise, and identify the evidence that would justify expanding it.';}
  const heardPeople=new Set(state.evidence.map(e=>e.person));
  const reflections=[{title:'How you gathered evidence',text:'You used '+state.evidence.length+' of 10 available conversations and heard from '+heardPeople.size+' of 4 stakeholders. '+(heardPeople.size===4?'Your evidence included every function. That gives you more perspectives, not certainty.':'The voices you did not hear may explain some of the surprises in this attempt.')}];
  const knowledgeWins=state.history.filter(h=>h.bonusEffect?.marginalBenefit>0).length;
  if(knowledgeWins) reflections.push({title:'When listening changed the result',text:knowledgeWins+' decision'+(knowledgeWins===1?' used':'s used')+' a specific piece of evidence to improve the outcome. Those effects are identified in your decision record.'});
  const hidden=state.flags.includes('quietFix')||state.flags.includes('ignoredRumor');
  reflections.push({title:hidden?'The cost of missing context':'Your response to uncertainty',text:hidden?'You left at least one important issue unexplained. Later events show where silence reduced trust or hid a defect. Consider what the team needed to know at the time.':'You created opportunities to surface uncomfortable information. The useful question is whether that information changed your next action.'});
  if(state.flags.includes('customBranch')||state.flags.includes('atlasException')) reflections.push({title:'The account you optimized for',text:'You made an exception for Atlas. That protected a relationship while creating additional work. In a replay, inspect the evidence from other teams before deciding how far to specialize.'});
  return {title,description,reflections};
}
