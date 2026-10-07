import { PEOPLE, ROUNDS, RULES_VERSION, DELAY_RULES, MEMORY_RULES, DOSSIER_ARTIFACTS } from './scenario.js';

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
    relationships:Object.fromEntries(PEOPLE_IDS.map(id=>[id,50])), flags:[], evidence:[], artifacts:[], findings:[], findingRecords:[], obligations:[],
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
      details:{origin:'earlier team planning, before the run',authoredAt:'Monday · 08:15',text:'What evidence would make a limited launch safe?',context:'The full note also mentions a review gate.'}});
    const rumor=appendEvent(state,{type:'story',key:'rumor-circulates',ruleId:'story:rumor-circulates',
      audience:['player',...PEOPLE_IDS,'engineering-channel'],evidenceStatus:'unverified-claim',
      details:{text:'Product has lost confidence in Engineering',status:'uncorrected',source:'caption attached to a cropped earlier team-planning note',captionStatus:'interpretation, not source wording; author unconfirmed at R3 opening',knownRecipients:['mara','ishan','leah','theo','engineering-channel'],widerSpread:'unattributed'}});
    appendEvent(state,{type:'story',key:'crop-admission',ruleId:'story:crop-admission',actor:'mara',audience:['mara'],playerVisible:false,
      evidenceStatus:'attributed-account',details:{text:'Mara shared a crop with two leads to discuss launch planning and added her interpretation; wider spread is unknown.'}});
    acquireArtifact(state,'KB-09',rumor,'round-entry');
    acquireArtifact(state,'KB-09b',rumor,'round-entry');
  }
  if (state.round===3) {
    const capacity=appendEvent(state,{type:'story',key:'review-capacity',ruleId:'story:review-capacity',
      audience:['player'],evidenceStatus:'authored-capacity',details:{text:'Two shared integration reviewers can validate one agreed change bundle before the launch review. The Atlas custom workflow uses the same review window.',
        carriedObligations:['OB-01','OB-02'],result:'capacity constraint; no review or test result'}});
    acquireArtifact(state,'KB-10',capacity,'round-entry');
    acquireArtifact(state,'KB-10a',capacity,'round-entry');
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
  const next = copy(state); next.phase='play'; enterRound(next);
  for (const artifact of DOSSIER_ARTIFACTS.filter(item=>item.availableRound===1 && item.access==='start')) acquireArtifact(next,artifact.id,null,'case-entry');
  return next;
}
function acquireArtifact(state, artifactId, sourceEvent, accessMode) {
  const artifact=DOSSIER_ARTIFACTS.find(item=>item.id===artifactId);
  if (!artifact || state.artifacts.some(item=>item.artifactId===artifactId)) throw invalidState(`duplicate or unknown dossier artifact ${artifactId}`);
  const expectedMode=artifact.access==='start'?'case-entry':artifact.access==='round-entry'?'round-entry':'interview';
  const modeAllowed=accessMode===expectedMode || (accessMode==='decision-disclosure'&&artifact.decisionChoices?.length);
  if(!modeAllowed || state.round+1!==artifact.availableRound || (accessMode!=='case-entry'&&!sourceEvent))
    throw invalidState(`invalid access route for ${artifactId}`);
  const event=appendEvent(state,{type:'artifact',key:artifactId,ruleId:`artifact:acquire:${artifactId}`,actor:'narrator',
    audience:artifact.acquisitionAudience||['player'],evidenceStatus:artifact.reliability,sourceEventIds:sourceEvent?[sourceEvent.eventId]:[],
    details:{artifactId,title:artifact.title,source:artifact.source,time:artifact.time,reliability:artifact.reliability,text:artifact.scope,
      availableRound:artifact.availableRound,acquiredVia:accessMode==='round-entry'?'round-entry':sourceEvent?.ruleId||accessMode}});
  state.artifacts.push({artifactId,eventId:event.eventId,acquiredAtRound:event.round,sequence:event.sequence});
  return event;
}
function acquireForQuestion(state, questionId) {
  const question=state.events.find(event=>event.type==='question'&&event.details.questionId===questionId&&event.round===state.round+1);
  if (!question) throw invalidState(`missing access source for ${questionId}`);
  const artifacts=DOSSIER_ARTIFACTS.filter(item=>item.availableRound===state.round+1 &&
    (Array.isArray(item.access)?item.access.includes(questionId):item.access===questionId));
  for(const artifact of artifacts) {
    if(artifact.accessActor!==question.actor) throw invalidState(`wrong stakeholder for ${artifact.id}`);
    acquireArtifact(state,artifact.id,question,'interview');
  }
}
function requireArtifact(state, artifactId) {
  const artifact=DOSSIER_ARTIFACTS.find(item=>item.id===artifactId);
  const rows=state.artifacts?.filter(item=>item.artifactId===artifactId)||[];
  if (!artifact || rows.length!==1) throw invalidState(`missing or duplicate dossier access for ${artifactId}`);
  const event=requireEvent(state,'artifact',`artifact:acquire:${artifactId}`,artifact.availableRound);
  const expectedAudience=artifact.acquisitionAudience||['player'];
  if (event.eventId!==rows[0].eventId || event.actor!=='narrator' || !event.playerVisible ||
      JSON.stringify(event.audience)!==JSON.stringify(expectedAudience) || !state.knowledge.player?.includes(event.eventId) ||
      event.details.artifactId!==artifact.id || event.details.title!==artifact.title || event.details.source!==artifact.source ||
      event.details.time!==artifact.time || event.details.reliability!==artifact.reliability || event.details.text!==artifact.scope ||
      event.details.availableRound!==artifact.availableRound || rows[0].acquiredAtRound!==event.round || rows[0].sequence!==event.sequence)
    throw invalidState(`contradictory dossier provenance for ${artifactId}`);
  if (artifact.access==='start') {
    if (event.details.acquiredVia!=='case-entry' || event.sourceEventIds.length) throw invalidState(`invalid entry access for ${artifactId}`);
  } else if(artifact.access==='round-entry') {
    const source=state.events.find(row=>row.eventId===event.sourceEventIds[0]&&row.round===artifact.availableRound);
    const expectedRule=artifact.accessSourceRule||`delay:promise:${state.history[0]?.choiceId}`;
    const expectedType=artifact.accessSourceRule?'story':'delayed';
    if(event.details.acquiredVia!=='round-entry'||event.sourceEventIds.length!==1||!source||source.type!==expectedType||source.ruleId!==expectedRule)
      throw invalidState(`invalid round-entry access for ${artifactId}`);
  } else {
    const source=state.events.find(row=>row.eventId===event.sourceEventIds[0]&&row.round===artifact.availableRound);
    if(event.sourceEventIds.length!==1 || !source) throw invalidState(`invalid source event for ${artifactId}`);
    if(source.type==='question') {
      const allowed=Array.isArray(artifact.access)?artifact.access:[artifact.access];
      if(!allowed.includes(source.details.questionId)||source.actor!==artifact.accessActor||event.details.acquiredVia!==source.ruleId)
        throw invalidState(`invalid interview access for ${artifactId}`);
    } else if(source.type==='disclosure'&&artifact.decisionChoices?.length) {
      const decision=state.events.find(row=>row.eventId===source.sourceEventIds[0]&&row.type==='decision');
      const choiceId=decision?.details.choiceId;
      if(!decision || !artifact.decisionChoices.includes(choiceId) || source.ruleId!==`disclosure:rumor:${choiceId}` ||
          source.round!==artifact.availableRound || event.details.acquiredVia!==source.ruleId)
        throw invalidState(`invalid decision disclosure access for ${artifactId}`);
    } else throw invalidState(`invalid access event for ${artifactId}`);
  }
  return event;
}
export function recordReadinessFinding(state) {
  requirePlay(state);
  if (state.round!==0) throw new Error('This comparison is available in round one.');
  if (state.findings.includes('readiness-has-distinct-tests')) throw new Error('You already recorded this comparison.');
  const required=['KB-02','KB-03','KB-04'];
  if (required.some(id=>!state.artifacts.some(item=>item.artifactId===id)))
    throw new Error('Acquire the campaign register, reliability report, and containment runbook before comparing them.');
  for (const id of required) requireArtifact(state,id);
  const next=copy(state);
  const sources=required.map(id=>requireArtifact(next,id).eventId);
  const event=appendEvent(next,{type:'finding',key:'readiness-has-distinct-tests',ruleId:'finding:readiness-has-distinct-tests',
    actor:'player',audience:['player'],evidenceStatus:'player-interpretation',sourceEventIds:sources,
    details:{findingId:'readiness-has-distinct-tests',title:'Reach and reliability are different questions',
      text:'The waitlist measures interest, while the test report describes a bounded failure in reviewed long meetings. Together they do not prove that a broad launch is ready. The runbook describes a possible human-review control; it does not show that the control is enabled.'}});
  next.findings.push('readiness-has-distinct-tests');
  return next;
}
const RETENTION_FINDING_ID='default-is-not-cleanup';
const RETENTION_INTERPRETATIONS={
  'scope-separated':'The invitation, configuration, and inventory describe different scopes. A changed default does not clean up earlier transcripts.',
  unresolved:'The records do not establish the authorization, object-level scope, or completed cleanup of earlier transcripts.',
};
function latestRetentionFinding(state) {
  return state.events.filter(event=>event.type==='finding'&&event.details.findingId===RETENTION_FINDING_ID).at(-1)||null;
}
function retentionSourceAcquisitions(state) {
  const required=['KB-05','KB-06','KB-07'];
  if(required.some(id=>!state.artifacts.some(item=>item.artifactId===id)))
    throw new Error('Acquire the preserved invitation, configuration record, and retained-account inventory before recording this finding.');
  const eligible=['KB-05','KB-06','KB-07','KB-08','KB-08-R4'].map(id=>state.artifacts.find(item=>item.artifactId===id)).filter(Boolean);
  return eligible.map(row=>{
    const event=requireArtifact(state,row.artifactId);
    if(row.acquiredAtRound>state.round+1 || row.sequence>=state.events.length+1)
      throw invalidState(`finding source ${row.artifactId} is not yet available`);
    return {artifactId:row.artifactId,eventId:event.eventId,acquiredAtRound:row.acquiredAtRound,sequence:row.sequence};
  });
}
export function recordRetentionFinding(state, interpretationId='scope-separated') {
  requirePlay(state);
  if(state.round<1||state.round>4) throw new Error('This finding can be recorded or revised from round two onward.');
  const interpretation=RETENTION_INTERPRETATIONS[interpretationId];
  if(!interpretation) throw new Error('Choose one of the available sourced interpretations.');
  const next=copy(state), sources=retentionSourceAcquisitions(next), previous=latestRetentionFinding(next);
  const nextSourceIds=sources.map(item=>item.eventId);
  if(previous?.details.active && previous.details.interpretationId===interpretationId &&
      JSON.stringify(previous.details.sourceAcquisitions.map(item=>item.eventId))===JSON.stringify(nextSourceIds))
    throw new Error('This finding already records that interpretation and its currently acquired sources.');
  const revision=(previous?.details.revision||0)+1;
  const action=previous?(previous.details.active?'revised':'recorded-again'):'recorded';
  const recordedAtRound=next.round+1;
  const sourceEventIds=[...(previous?[previous.eventId]:[]),...nextSourceIds];
  const event=appendEvent(next,{type:'finding',key:`${RETENTION_FINDING_ID}-revision-${revision}`,
    ruleId:`finding:${RETENTION_FINDING_ID}`,actor:'player',audience:['player'],evidenceStatus:'player-interpretation',sourceEventIds,
    details:{findingId:RETENTION_FINDING_ID,title:'The invitation, setting, and inventory answer different questions',
      action,revision,recordedAtRound,sourceEventIds:nextSourceIds,sourceAcquisitions:sources,
      interpretationId,interpretation,supersedesEventId:previous?.eventId||null,active:true,text:interpretation}});
  const record={findingId:RETENTION_FINDING_ID,eventId:event.eventId,action,revision,recordedAtRound,
    sourceEventIds:nextSourceIds,sourceAcquisitions:sources,interpretationId,interpretation,active:true,
    supersedesEventId:previous?.eventId||null};
  next.findingRecords.push(record);
  if(!next.findings.includes(RETENTION_FINDING_ID)) next.findings.push(RETENTION_FINDING_ID);
  return next;
}
export function clearRetentionFinding(state) {
  requirePlay(state);
  if(state.round<1||state.round>4) throw new Error('This finding can be cleared from round two onward.');
  const previous=latestRetentionFinding(state);
  if(!previous?.details.active) throw new Error('There is no active finding to clear.');
  const next=copy(state), revision=previous.details.revision+1;
  const sourceAcquisitions=retentionSourceAcquisitions(next);
  const event=appendEvent(next,{type:'finding',key:`${RETENTION_FINDING_ID}-revision-${revision}`,
    ruleId:`finding:${RETENTION_FINDING_ID}`,actor:'player',audience:['player'],evidenceStatus:'player-interpretation',
    sourceEventIds:[previous.eventId,...sourceAcquisitions.map(item=>item.eventId)],details:{findingId:RETENTION_FINDING_ID,
      title:'The invitation, setting, and inventory answer different questions',action:'cleared',revision,
      recordedAtRound:next.round+1,sourceEventIds:sourceAcquisitions.map(item=>item.eventId),sourceAcquisitions,
      interpretationId:previous.details.interpretationId,interpretation:previous.details.interpretation,
      supersedesEventId:previous.eventId,active:false,text:'The player cleared this interpretation; the earlier entry remains in the case history.'}});
  next.findingRecords.push({findingId:RETENTION_FINDING_ID,eventId:event.eventId,action:'cleared',revision,
    recordedAtRound:next.round+1,sourceEventIds:sourceAcquisitions.map(item=>item.eventId),sourceAcquisitions,
    interpretationId:previous.details.interpretationId,interpretation:previous.details.interpretation,active:false,
    supersedesEventId:previous.eventId});
  next.findings=next.findings.filter(id=>id!==RETENTION_FINDING_ID);
  return next;
}
function createReliabilityObligation(state, decision) {
  if (state.obligations.some(item=>item.obligationId==='OB-01')) throw invalidState('duplicate OB-01');
  const commitment=currentRound(state).choices.find(choice=>choice.id===decision.details.choiceId)?.commitment;
  if (!commitment) throw invalidState('missing OB-01 commitment for confirmed R1 choice');
  const event=appendEvent(state,{type:'obligation',key:'OB-01-open',ruleId:'obligation:OB-01:created',actor:'player',
    audience:['player','ishan'],evidenceStatus:'confirmed-commitment',sourceEventIds:[decision.eventId],
    details:{obligationId:'OB-01',title:'Verify the shared reliability boundary',owner:'ishan',dueRound:5,status:'open',text:commitment}});
  state.obligations.push({obligationId:'OB-01',title:'Verify the shared reliability boundary',owner:'ishan',dueRound:5,
    status:'open',commitment,createdByDecision:decision.eventId,lastEventId:event.eventId,
    verified:false,validationBundle:{id:'R4-SHARED-REVIEW-BUNDLE',status:'unselected',eventId:null},
    reliabilityReview:{id:'OB-01-SHARED-RELIABILITY-REVIEW',status:'unselected',eventId:null}});
}
function createRetentionObligation(state, decision) {
  if(state.obligations.some(item=>item.obligationId==='OB-02')) throw invalidState('duplicate OB-02');
  const choice=ROUNDS[1].choices.find(item=>item.id===decision.details.choiceId);
  if(!choice) throw invalidState('missing confirmed R2 choice for OB-02');
  const event=appendEvent(state,{type:'obligation',key:'OB-02-created',ruleId:'obligation:OB-02:created',actor:'player',
    audience:['player','leah','ishan'],evidenceStatus:'confirmed-commitment',sourceEventIds:[decision.eventId],
      details:{obligationId:'OB-02',title:'Account for earlier retained transcripts',owner:'leah',dueRound:null,
      status:'active',createdByDecision:decision.eventId,cleanup:{owner:'ishan',status:'pending',verified:false,overdue:false},
      policyScope:{owner:'leah',status:'open',followUp:'Thursday 12:00 in the fictional launch week',executionDeadline:null},
      customerExplanation:{owner:'theo',status:'due-at-R3-entry',dueRound:3},
      text:'Define policy and scope, explain the retention decision to customers, and leave old-data cleanup pending until authorization and object scope are established.'}});
  state.obligations.push({obligationId:'OB-02',title:'Account for earlier retained transcripts',owner:'leah',dueRound:null,status:'active',
    createdByDecision:decision.eventId,lastEventId:event.eventId,
    cleanup:{id:'OB-02-OLD-DATA-CLEANUP',owner:'ishan',status:'pending',verified:false,overdue:false},
    policyScope:{id:'OB-02-POLICY-SCOPE',owner:'leah',status:'open',followUp:'Thursday 12:00 in the fictional launch week',executionDeadline:null},
    customerExplanation:{id:'OB-02-CUSTOMER-EXPLANATION',owner:'theo',dueRound:3,status:'due'},
    workflowBundle:{id:'OB-02-RETENTION-WORKFLOW-REVIEW',owner:'leah',status:'unselected',sourceEventId:null},
    validationBundle:{id:'R4-SHARED-REVIEW-BUNDLE',status:'unselected',eventId:null},
    atlasRequestEventId:null});
  const customerUpdate=appendEvent(state,{type:'obligation',key:'OB-02-customer-status-created',ruleId:'obligation:OB-02:customer-status',
    actor:'narrator',audience:['player','theo'],evidenceStatus:'authored-status',sourceEventIds:[event.eventId],
    details:{obligationId:'OB-02',status:'due',owner:'theo',dueRound:3,text:'A customer explanation is due at the start of R3.'}});
  state.obligations.at(-1).customerExplanation.statusEventId=customerUpdate.eventId;
}
function recordExplanationMilestone(state, consentDecision, delayed) {
  const rows=state.obligations.filter(item=>item.obligationId==='OB-02');
  if(rows.length!==1) throw invalidState('missing or duplicate OB-02 at R3 entry');
  const obligation=rows[0], met=consentDecision.details.choiceId==='explicit';
  const ruleId=`obligation:OB-02:explanation-${met?'met':'missed'}`;
  const sources=[obligation.lastEventId,consentDecision.eventId,delayed.eventId];
  const event=appendEvent(state,{type:'obligation',key:`OB-02-explanation-${met?'met':'missed'}`,ruleId,actor:'narrator',
    audience:['player','leah','ishan'],evidenceStatus:'authored-status',sourceEventIds:sources,
    details:{obligationId:'OB-02',milestoneId:'OB-02-CUSTOMER-EXPLANATION',owner:'theo',dueRound:3,
      status:met?'met':'missed',parentStatus:'active',choiceId:consentDecision.details.choiceId,
      text:met?'The explicit path includes a clear explanation before the next invitation. This does not verify old-data cleanup.':
        'The general explanation was not included before the customer asked again. The missed R3 milestone remains on record; old-data cleanup is still unverified.'}});
  obligation.customerExplanation.status=met?'met':'missed';
  obligation.customerExplanation.lastEventId=event.eventId;
  obligation.status='active'; obligation.lastEventId=event.eventId;
  const customerUpdate=appendEvent(state,{type:'obligation',key:`OB-02-customer-status-${met?'met':'missed'}`,
    ruleId:'obligation:OB-02:customer-status',actor:'narrator',audience:['player','theo'],evidenceStatus:'authored-status',
    sourceEventIds:[event.eventId],details:{obligationId:'OB-02',status:met?'met':'missed',owner:'theo',dueRound:3,
      text:met?'The R3 customer-explanation milestone was met.':'The R3 customer-explanation milestone was missed.'}});
  obligation.customerExplanation.statusEventId=customerUpdate.eventId;
}
function recordWorkflowBundle(state, scopeDecision) {
  const rows=state.obligations.filter(item=>item.obligationId==='OB-02');
  if(rows.length!==1) throw invalidState('missing or duplicate OB-02 at R4 decision');
  const obligation=rows[0], selection=scopeDecision.details.choiceId;
  const status=selection==='core'?'scheduled':selection==='custom'?'deferred':'blocked';
  const event=appendEvent(state,{type:'obligation',key:`OB-02-workflow-bundle-${status}`,ruleId:`obligation:OB-02:bundle-${status}`,
    actor:'narrator',audience:['player','leah','ishan'],evidenceStatus:'authored-status',
    sourceEventIds:[obligation.lastEventId,scopeDecision.eventId],details:{obligationId:'OB-02',parentStatus:'active',
      bundleId:obligation.workflowBundle.id,bundleStatus:status,choiceId:selection,owner:'leah',
      text:status==='scheduled'?'The shared review bundle includes the selected retention workflow; it does not authorize or prove deletion of old transcripts.':
        status==='deferred'?'The shared retention-workflow review bundle is deferred for the Atlas branch. OB-02 and old-data cleanup remain active and pending.':
          'The shared retention-workflow review bundle is blocked by competing review capacity. OB-02 and old-data cleanup remain active and pending.'}});
  obligation.workflowBundle.status=status; obligation.workflowBundle.sourceEventId=event.eventId;
  obligation.workflowBundle.sharedReviewBundleEventId=obligation.validationBundle?.eventId||null;
  obligation.status='active'; obligation.lastEventId=event.eventId;
}
function recordSharedReviewBundle(state, scopeDecision) {
  const reliability=state.obligations.filter(item=>item.obligationId==='OB-01');
  const retention=state.obligations.filter(item=>item.obligationId==='OB-02');
  if(reliability.length!==1||retention.length!==1) throw invalidState('missing or duplicate obligations at R4 shared bundle');
  const selection=scopeDecision.details.choiceId;
  const status=selection==='core'?'scheduled':selection==='custom'?'deferred':'blocked';
  const capacity=requireArtifact(state,'KB-10a');
  const event=appendEvent(state,{type:'obligation',key:'shared-review-bundle-selected',ruleId:'obligation:shared-review-bundle:selected',
    actor:'narrator',audience:['player','ishan','leah'],evidenceStatus:'authored-status',
    sourceEventIds:[reliability[0].lastEventId,retention[0].lastEventId,scopeDecision.eventId,capacity.eventId],
    details:{bundleId:'R4-SHARED-REVIEW-BUNDLE',status,choiceId:selection,owner:'ishan',reviewerCount:2,
      obligationIds:['OB-01','OB-02'],subtaskIds:['OB-01-SHARED-RELIABILITY-REVIEW','OB-02-RETENTION-WORKFLOW-REVIEW'],
      text:status==='scheduled'?'One shared review bundle is scheduled for the R5 launch review. It contains reliability validation and the selected retention workflow; scheduling is not verification.':
        status==='deferred'?'The one shared review bundle is deferred while capacity goes to the Atlas branch. Both obligations remain active and unresolved.':
          'The one shared review bundle is blocked because both workstreams use the same two reviewers. Both obligations remain active and unresolved.'}});
  const projection={id:'R4-SHARED-REVIEW-BUNDLE',status,eventId:event.eventId};
  reliability[0].validationBundle=copy(projection);
  retention[0].validationBundle=copy(projection);
  return event;
}
function recordReliabilityBundle(state, scopeDecision, sharedBundle) {
  const rows=state.obligations.filter(item=>item.obligationId==='OB-01');
  if(rows.length!==1) throw invalidState('missing or duplicate OB-01 at R4 decision');
  const obligation=rows[0], selection=scopeDecision.details.choiceId;
  const status=selection==='core'?'scheduled':selection==='custom'?'deferred':'blocked';
  const capacity=requireArtifact(state,'KB-10a');
  const event=appendEvent(state,{type:'obligation',key:`OB-01-review-bundle-${status}`,ruleId:`obligation:OB-01:bundle-${status}`,
    actor:'narrator',audience:['player','ishan'],evidenceStatus:'authored-status',
      sourceEventIds:[obligation.lastEventId,scopeDecision.eventId,capacity.eventId,sharedBundle.eventId],details:{obligationId:'OB-01',parentStatus:'active',
      bundleId:obligation.reliabilityReview.id,bundleStatus:status,choiceId:selection,owner:'ishan',dueRound:5,
        sharedBundleEventId:sharedBundle.eventId,
      text:status==='scheduled'?'The shared reliability validation bundle is scheduled for the R5 review. Scheduling is not a passing test or verification.':
        status==='deferred'?'Shared reliability validation is deferred while capacity goes to the Atlas workflow. OB-01 remains active and unresolved.':
          'Shared reliability validation is blocked by competing work in the same reviewer window. OB-01 remains active and unresolved.'}});
  obligation.reliabilityReview.status=status; obligation.reliabilityReview.eventId=event.eventId;
  obligation.reliabilityReview.sharedBundleEventId=sharedBundle.eventId;
  obligation.status='active'; obligation.lastEventId=event.eventId;
}
function recordRetentionCheckpoint(state, finalDecision) {
  const obligation=state.obligations.find(item=>item.obligationId==='OB-02');
  if(!obligation || obligation.status!=='active' || !obligation.workflowBundle.sourceEventId || !obligation.validationBundle?.eventId)
    throw invalidState('missing OB-02 parent or R4 bundle before R5 checkpoint');
  const consentDecision=state.events.find(event=>event.eventId===obligation.createdByDecision);
  const bundleEvent=state.events.find(event=>event.eventId===obligation.workflowBundle.sourceEventId);
  const scopeDecision=state.events.find(event=>event.eventId===bundleEvent?.sourceEventIds?.[1]);
  if(!consentDecision||!bundleEvent||!scopeDecision) throw invalidState('missing OB-02 checkpoint source');
  const consent=consentDecision.details.choiceId, scope=scopeDecision.details.choiceId;
  const artifacts=Object.fromEntries(state.artifacts.map(row=>[row.artifactId,row.eventId]));
  const checks=[];
  if(scope==='core'&&consent==='explicit') {
    for(const id of ['participant-notice','new-data-default','deletion-request-workflow']) checks.push({checkId:id,status:'described-by-selected-path',sourceEventIds:[consentDecision.eventId,...(id==='new-data-default'&&artifacts['KB-06']?[artifacts['KB-06']]:id==='deletion-request-workflow'&&artifacts['KB-07']?[artifacts['KB-07']]:[])]});
  } else if(scope==='core'&&consent==='quiet') {
    checks.push({checkId:'new-data-default',status:'described-by-selected-path',sourceEventIds:[consentDecision.eventId,...(artifacts['KB-06']?[artifacts['KB-06']]:[])]});
  }
  // Exception+core has no general-policy checks. Preserve only the Atlas-specific
  // request and mark its scope and verification unresolved; a request is not consent.
  const atlasEvent=state.events.find(event=>event.type==='question'&&event.round===2&&event.actor==='theo'&&event.details.questionId==='atlas-retention');
  const exception=consent==='exception';
  const atlasDurationSupported=Boolean(atlasEvent&&artifacts['KB-08']);
  const atlasSources=[consentDecision.eventId,...(atlasEvent?[atlasEvent.eventId]:[]),...(atlasDurationSupported?[artifacts['KB-08']]:[])];
  const event=appendEvent(state,{type:'obligation',key:'OB-02-r5-checkpoint',ruleId:'obligation:OB-02:r5-checkpoint',actor:'narrator',
    audience:['player','leah','ishan'],evidenceStatus:'authored-status',
    sourceEventIds:[obligation.lastEventId,obligation.validationBundle.eventId,consentDecision.eventId,scopeDecision.eventId,finalDecision.eventId,
      ...checks.flatMap(check=>check.sourceEventIds.filter(id=>id!==consentDecision.eventId)),...atlasSources.slice(1)],
    details:{obligationId:'OB-02',checkpointId:'OB-02-R5-CHECKPOINT',parentStatus:'active',owner:'leah',
      selectedRetentionPath:consent,selectedCapacityPath:scope,
      sharedReviewBundle:copy(obligation.validationBundle),
      workflowBundle:{id:obligation.workflowBundle.id,status:obligation.workflowBundle.status,sourceEventId:bundleEvent.eventId},
      checks,atlasException:exception?{status:'separate-request-retained',duration:atlasDurationSupported?'30 days':null,
        scope:'Atlas only',scopeStatus:'unresolved',verificationStatus:'not verified',consentOrApproval:'not established',
        sourceEventIds:atlasSources}:null,
      cleanup:{id:obligation.cleanup.id,owner:'ishan',status:'pending',verified:false,overdue:false},
      policyScopeFollowUp:{id:obligation.policyScope.id,owner:'leah',due:'Thursday 12:00 in the fictional launch week',executionDeadline:null},
      explanationMilestone:{id:obligation.customerExplanation.id,owner:'theo',status:obligation.customerExplanation.status,
        dueRound:3,eventId:obligation.customerExplanation.lastEventId},
      text:'R5 is an ownership and workflow checkpoint. Old-data cleanup remains pending, not overdue, and unverified. Path descriptions are not independent execution receipts.'}});
  obligation.r5Checkpoint={eventId:event.eventId,status:'recorded'};
  obligation.lastEventId=event.eventId;
  obligation.status='active';
  const customerUpdate=appendEvent(state,{type:'obligation',key:'OB-02-customer-status-r5',ruleId:'obligation:OB-02:customer-status',
    actor:'narrator',audience:['player','theo'],evidenceStatus:'authored-status',
    sourceEventIds:[obligation.customerExplanation.statusEventId],details:{obligationId:'OB-02',status:obligation.customerExplanation.status,
      owner:'theo',dueRound:3,text:`R5 status of the customer-explanation milestone: ${obligation.customerExplanation.status}.`}});
  obligation.customerExplanation.statusEventId=customerUpdate.eventId;
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
  acquireForQuestion(next,questionId);
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
  if (round.id==='promise') createReliabilityObligation(next,decision);
  if (round.id==='consent') createRetentionObligation(next,decision);
  if (round.id==='scope') {
    const sharedBundle=recordSharedReviewBundle(next,decision);
    recordReliabilityBundle(next,decision,sharedBundle);
    recordWorkflowBundle(next,decision);
  }
  if (round.id==='rumor' && choiceId!=='ignore') {
    const note=requireEvent(next,'story','story:planning-note',3);
    const rumor=requireEvent(next,'story','story:rumor-circulates',3);
    const audience=choiceId==='open'?['player',...PEOPLE_IDS,'engineering-channel']:['player','mara','ishan'];
    const disclosure=appendEvent(next,{type:'disclosure',key:choiceId,ruleId:`disclosure:rumor:${choiceId}`,actor:'player',audience,
      sourceEventIds:[decision.eventId,rumor.eventId,note.eventId],details:{topic:'planning-note',choiceId,
        text:choiceId==='open'?'The earlier note, written Monday at 08:15, asks what evidence would make a limited launch safe and mentions a review gate. The screenshot caption is an interpretation, not wording from the source or from your decision. The wider spread remains unattributed.':'The earlier note is available to Mara, Ishan, and you. Mara and Ishan agree to a concise joint update; this private reset is not a full-room correction.'}});
    grant(next,audience,note.eventId);
    if(!next.artifacts.some(item=>item.artifactId==='KB-09a')) acquireArtifact(next,'KB-09a',disclosure,'decision-disclosure');
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
    recordRetentionCheckpoint(next,prior.decision);
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
  if (prior.round.id==='promise') {
    const rows=next.obligations.filter(item=>item.obligationId==='OB-01');
    if (rows.length!==1 || rows[0].status!=='open' || rows[0].createdByDecision!==prior.decision.eventId)
      throw invalidState('missing or contradictory OB-01 before R2');
    const obligation=rows[0];
    const created=requireEvent(next,'obligation','obligation:OB-01:created',1);
    if (created.eventId!==obligation.lastEventId || created.details.obligationId!=='OB-01' ||
        created.details.owner!=='ishan' || created.details.dueRound!==5 || created.details.status!=='open' ||
        created.sourceEventIds.length!==1 || created.sourceEventIds[0]!==prior.decision.eventId)
      throw invalidState('contradictory OB-01 creation record');
    const event=appendEvent(next,{type:'obligation',key:'OB-01-active',ruleId:'obligation:OB-01:active',actor:'narrator',
      audience:['player','ishan'],evidenceStatus:'authored-status',sourceEventIds:[obligation.lastEventId,delayed.eventId],
      details:{obligationId:'OB-01',title:obligation.title,owner:obligation.owner,dueRound:obligation.dueRound,status:'active',
        text:delayed.details.text}});
    obligation.status='active'; obligation.lastEventId=event.eventId;
  }
  if(prior.round.id==='consent') recordExplanationMilestone(next,prior.decision,delayed);
  if(next.round===1) acquireArtifact(next,'KB-05',delayed,'round-entry');
  next.arrival={text:rule.text,delta:actual,eventId:delayed.eventId};
  next.history[next.history.length-1].followup={...next.arrival};
  enterRound(next);
  return next;
}
// A finite suggestion grammar, not a semantic interpretation of arbitrary prose.
// All authored keywords still identify competing approaches; an action anchor
// is an additional requirement before any one approach may be suggested.
const INTENT_FRAMES = [
  'i will', 'i would', 'i choose', 'i propose', 'i recommend', 'i plan to',
  'we will', 'we should', 'we choose', 'we propose', 'we recommend', 'we plan to',
];
const UNCERTAIN_WORDS = new Set([
  'no', 'not', 'never', 'neither', 'nor', 'without', 'avoid', 'avoiding',
  'refuse', 'refusing', 'reject', 'rejecting', 'instead', 'rather',
  'if', 'unless', 'until', 'when', 'provided', 'assuming', 'depending',
  'otherwise', 'maybe', 'perhaps', 'might', 'could', 'or', 'either', 'versus', 'vs',
  'dont', 'doesnt', 'didnt', 'cant', 'cannot', 'wont', 'wouldnt', 'shouldnt',
  'couldnt', 'isnt', 'arent', 'wasnt', 'werent', 'havent', 'hasnt', 'hadnt',
  'said', 'says', 'quote', 'quoted',
]);
const ACTION_ANCHORS = {
  promise: {
    pilot:['pilot', 'limited rollout', 'staged rollout'],
    launch:['launch now', 'public launch', 'public release', 'release the product', 'all users'],
    delay:['postpone', 'delay the launch', 'pause the launch', 'move the date'],
  },
  consent: {
    explicit:['explicit consent', 'opt in', 'permission', 'deletion'],
    quiet:['patch the retention', 'retention default', 'quiet fix', 'silently patch'],
    exception:['atlas', 'retention exception'],
  },
  rumor: {
    open:['full thread', 'all hands', 'share the context'],
    broker:['broker', 'mediate', 'private reset', 'one on one'],
    ignore:['ignore the rumor', 'dismiss the rumor', 'keep working', 'move on'],
  },
  scope: {
    core:['shared core', 'reliability', 'all teams'],
    custom:['atlas', 'custom workflow'],
    both:['split the team', 'both workstreams', 'parallel workstreams', 'two teams'],
  },
  accountability: {
    evidence:['bounded recommendation', 'present evidence', 'release gate', 'risk threshold'],
    momentum:['lead with momentum', 'broad expansion', 'expand the launch'],
    shared:['joint checkpoint', 'bring all leads together', 'align all leads'],
  },
};
const matchText = text => text.toLowerCase().replace(/[‘’']/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export function interpretDecision(state,text) {
  requirePlay(state);
  if(typeof text!=='string' || text.trim().length<20) throw new Error('Write at least 20 characters so you can record a meaningful decision.');
  if(text.length>1200) throw new Error('Keep your decision within 1,200 characters.');
  const wording=text.trim(), normalized=matchText(wording);
  const result={suggestedId:null,text:wording};
  // Quotation marks at word boundaries require a choice. Apostrophes within
  // words (Atlas's, don't) remain available to the separate token/veto rules.
  if(/[?"“”`]/u.test(wording) || /(^|[^\p{L}\p{N}])['‘’]|['‘’]($|[^\p{L}\p{N}])/u.test(wording)) return result;
  if(!INTENT_FRAMES.some(frame=>normalized.startsWith(frame+' ')) ||
      normalized.split(' ').some(word=>UNCERTAIN_WORDS.has(word))) return result;
  const containsPhrase=phrase=>(' '+normalized+' ').includes(' '+matchText(phrase)+' ');
  const round=currentRound(state);
  const candidates=round.choices.filter(choice=>choice.keywords.some(containsPhrase));
  if(candidates.length===1 && ACTION_ANCHORS[round.id][candidates[0].id].some(containsPhrase))
    result.suggestedId=candidates[0].id;
  return result;
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
  const artifactIds=state.artifacts.map(item=>item.artifactId);
  if(new Set(artifactIds).size!==artifactIds.length) throw invalidState('duplicate dossier acquisition');
  for(const id of artifactIds) requireArtifact(state,id);
  const rumor=requireEvent(state,'story','story:rumor-circulates',3);
  const planningNote=requireEvent(state,'story','story:planning-note',3);
  if(planningNote.details.authoredAt!=='Monday · 08:15' || planningNote.round!==3 ||
      JSON.stringify(planningNote.audience)!==JSON.stringify(['ishan','leah']) || planningNote.playerVisible ||
      rumor.evidenceStatus!=='unverified-claim' || rumor.details.status!=='uncorrected' ||
      rumor.details.captionStatus!=='interpretation, not source wording; author unconfirmed at R3 opening' ||
      rumor.details.widerSpread!=='unattributed' || JSON.stringify(rumor.audience)!==JSON.stringify(['player',...PEOPLE_IDS,'engineering-channel']))
    throw invalidState('contradictory R3 planning note or unverified crop circulation');
  requireArtifact(state,'KB-09');
  requireArtifact(state,'KB-09b');
  const r3Choice=decisions[2].details.choiceId;
  const fullThread=questions.find(event=>event.round===3&&event.actor==='ishan'&&event.details.questionId==='full-thread');
  const screenshotSource=questions.find(event=>event.round===3&&event.actor==='mara'&&event.details.questionId==='screenshot-source');
  const noteAcquired=Boolean(fullThread||['open','broker'].includes(r3Choice));
  if(noteAcquired) requireArtifact(state,'KB-09a');
  else if(artifactIds.includes('KB-09a')) throw invalidState('KB-09a was acquired without its R3 permission route');
  if(screenshotSource) requireArtifact(state,'KB-09c');
  else if(artifactIds.includes('KB-09c')) throw invalidState('KB-09c was acquired without Mara’s R3 source admission');
  const rumorDisclosures=state.events.filter(event=>event.type==='disclosure'&&event.ruleId.startsWith('disclosure:rumor:'));
  if(r3Choice==='ignore') {
    if(rumorDisclosures.length) throw invalidState('ignored R3 rumor produced a disclosure');
    const privateDefect=requireEvent(state,'delayed','delay:rumor:ignore',4);
    if(JSON.stringify(privateDefect.audience)!==JSON.stringify(['ishan','player'])) throw invalidState('ignored R3 defect escaped its private boundary');
  } else {
    const audience=r3Choice==='open'?['player',...PEOPLE_IDS,'engineering-channel']:['player','mara','ishan'];
    if(rumorDisclosures.length!==1) throw invalidState('missing or duplicate R3 rumor disclosure');
    const disclosure=rumorDisclosures[0];
    if(disclosure.eventId!==eventId(state,3,'disclosure',r3Choice) || disclosure.actor!=='player' ||
        disclosure.ruleId!==`disclosure:rumor:${r3Choice}` || JSON.stringify(disclosure.audience)!==JSON.stringify(audience) ||
        disclosure.details.choiceId!==r3Choice || JSON.stringify(disclosure.sourceEventIds)!==JSON.stringify([decisions[2].eventId,rumor.eventId,planningNote.eventId]) ||
        !state.knowledge.player.includes(planningNote.eventId) ||
        (r3Choice==='broker'&&state.knowledge.theo.includes(planningNote.eventId)))
      throw invalidState('contradictory R3 disclosure audience or source trace');
  }
  const retentionFindingEvents=state.events.filter(event=>event.type==='finding'&&event.details.findingId===RETENTION_FINDING_ID);
  let previousFinding=null;
  for(const [index,event] of retentionFindingEvents.entries()) {
    const detail=event.details, expectedRevision=index+1;
    const acquisitions=detail.sourceAcquisitions||[], acquisitionIds=acquisitions.map(item=>item.eventId);
    if(detail.revision!==expectedRevision || detail.recordedAtRound!==event.round ||
        !['recorded','revised','recorded-again','cleared'].includes(detail.action) ||
        event.ruleId!==`finding:${RETENTION_FINDING_ID}` ||
        event.eventId!==eventId(state,event.round,'finding',`${RETENTION_FINDING_ID}-revision-${expectedRevision}`) ||
        detail.supersedesEventId!==(previousFinding?.eventId||null) ||
        JSON.stringify(detail.sourceEventIds)!==JSON.stringify(acquisitionIds) ||
        JSON.stringify(event.sourceEventIds)!==JSON.stringify([...(previousFinding?[previousFinding.eventId]:[]),...acquisitionIds]))
      throw invalidState('contradictory append-only retention finding');
    if(previousFinding && previousFinding.details.sourceEventIds.some(id=>!acquisitionIds.includes(id)))
      throw invalidState('retention finding revision dropped a previously recorded source');
    for(const acquisition of acquisitions) {
      const source=state.events.find(row=>row.eventId===acquisition.eventId), stored=state.artifacts.find(row=>row.artifactId===acquisition.artifactId);
      if(!source || !stored || source.type!=='artifact' || source.details.artifactId!==acquisition.artifactId ||
          acquisition.acquiredAtRound!==source.round || acquisition.sequence!==source.sequence ||
          stored.acquiredAtRound!==source.round || stored.sequence!==source.sequence || source.sequence>=event.sequence ||
          source.round>event.round || !['KB-05','KB-06','KB-07','KB-08','KB-08-R4'].includes(acquisition.artifactId))
        throw invalidState('retention finding used a future or mismatched source acquisition');
    }
    if(detail.active!==(detail.action!=='cleared') || (detail.active&&!RETENTION_INTERPRETATIONS[detail.interpretationId]) ||
        !Number.isInteger(detail.recordedAtRound) || detail.recordedAtRound<2 || detail.recordedAtRound>5)
      throw invalidState('invalid retention finding interpretation state');
    if((!previousFinding&&detail.action!=='recorded') ||
        (previousFinding&&detail.action==='recorded') ||
        (detail.action==='revised'&&!previousFinding.details.active) ||
        (detail.action==='recorded-again'&&previousFinding.details.active) ||
        (detail.action==='cleared'&&(!previousFinding?.details.active || detail.interpretationId!==previousFinding.details.interpretationId)))
      throw invalidState('invalid retention finding lifecycle transition');
    const projection=state.findingRecords?.[index];
    if(!projection || projection.eventId!==event.eventId || projection.revision!==detail.revision ||
        projection.recordedAtRound!==detail.recordedAtRound || projection.active!==detail.active ||
        projection.action!==detail.action || projection.interpretationId!==detail.interpretationId ||
        projection.supersedesEventId!==detail.supersedesEventId ||
        JSON.stringify(projection.sourceAcquisitions)!==JSON.stringify(detail.sourceAcquisitions))
      throw invalidState('retention finding projection disagrees with its event history');
    previousFinding=event;
  }
  const activeRetentionFinding=Boolean(previousFinding?.details.active);
  if(state.findings.includes(RETENTION_FINDING_ID)!==activeRetentionFinding ||
      (state.findingRecords||[]).length!==retentionFindingEvents.length)
    throw invalidState('retention finding active state disagrees with its append-only history');
  const r2=predecessor(state,1), r3=predecessor(state,2), r4=predecessor(state,3), r5=predecessor(state,4);
  const capacityStory=requireEvent(state,'story','story:review-capacity',4);
  if(capacityStory.evidenceStatus!=='authored-capacity' || JSON.stringify(capacityStory.audience)!==JSON.stringify(['player']) ||
      capacityStory.details.result!=='capacity constraint; no review or test result')
    throw invalidState('contradictory R4 review capacity record');
  for(const id of ['KB-10','KB-10a']) {
    const file=requireArtifact(state,id);
    if(file.sourceEventIds.length!==1 || file.sourceEventIds[0]!==capacityStory.eventId || file.round!==4)
      throw invalidState(`contradictory R4 access for ${id}`);
  }
  if(state.artifacts.some(item=>item.artifactId==='KB-10b'||item.artifactId==='KB-10c'))
    throw invalidState('R5 receipt artifacts cannot be acquired from the R4 capacity record');
  const reliabilityRows=state.obligations.filter(item=>item.obligationId==='OB-01');
  if(reliabilityRows.length!==1) throw invalidState('missing or duplicate OB-01');
  const reliability=reliabilityRows[0], r1=predecessor(state,0);
  const reliabilityStatus=r4.choice.id==='core'?'scheduled':r4.choice.id==='custom'?'deferred':'blocked';
  const reliabilityReview=requireEvent(state,'obligation',`obligation:OB-01:bundle-${reliabilityStatus}`,4);
  const sharedBundle=requireEvent(state,'obligation','obligation:shared-review-bundle:selected',4);
  const reliabilityActive=requireEvent(state,'obligation','obligation:OB-01:active',2);
  const r3MilestoneName=r2.choice.id==='explicit'?'met':'missed';
  const r3Milestone=requireEvent(state,'obligation',`obligation:OB-02:explanation-${r3MilestoneName}`,3);
  if(reliability.createdByDecision!==r1.decision.eventId || reliability.owner!=='ishan' || reliability.dueRound!==5 ||
      reliability.status!=='active' || reliability.verified!==false || reliability.validationBundle?.id!=='R4-SHARED-REVIEW-BUNDLE' ||
      reliability.validationBundle.status!==reliabilityStatus || reliability.validationBundle.eventId!==sharedBundle.eventId ||
      reliability.reliabilityReview?.id!=='OB-01-SHARED-RELIABILITY-REVIEW' ||
      reliability.reliabilityReview.status!==reliabilityStatus || reliability.reliabilityReview.eventId!==reliabilityReview.eventId ||
      reliabilityReview.details.choiceId!==r4.choice.id || reliabilityReview.details.bundleStatus!==reliabilityStatus ||
      reliabilityReview.details.parentStatus!=='active' || reliabilityReview.details.owner!=='ishan' ||
      reliabilityReview.details.sharedBundleEventId!==sharedBundle.eventId ||
      JSON.stringify(reliabilityReview.audience)!==JSON.stringify(['player','ishan']) ||
      JSON.stringify(reliabilityReview.sourceEventIds)!==JSON.stringify([reliabilityActive.eventId,r4.decision.eventId,requireArtifact(state,'KB-10a').eventId,sharedBundle.eventId]) ||
      reliability.lastEventId!==reliabilityReview.eventId)
    throw invalidState('contradictory OB-01 R4 capacity transition');
  const sharedExpectedSources=[reliabilityActive.eventId,r3Milestone.eventId,r4.decision.eventId,requireArtifact(state,'KB-10a').eventId];
  if(sharedBundle.details.bundleId!=='R4-SHARED-REVIEW-BUNDLE' || sharedBundle.details.status!==reliabilityStatus ||
      sharedBundle.details.choiceId!==r4.choice.id || sharedBundle.details.owner!=='ishan' || sharedBundle.details.reviewerCount!==2 ||
      JSON.stringify(sharedBundle.details.obligationIds)!==JSON.stringify(['OB-01','OB-02']) ||
      JSON.stringify(sharedBundle.details.subtaskIds)!==JSON.stringify(['OB-01-SHARED-RELIABILITY-REVIEW','OB-02-RETENTION-WORKFLOW-REVIEW']) ||
      JSON.stringify(sharedBundle.audience)!==JSON.stringify(['player','ishan','leah']) ||
      JSON.stringify(sharedBundle.sourceEventIds)!==JSON.stringify(sharedExpectedSources) ||
      sharedBundle.eventId!==eventId(state,4,'obligation','shared-review-bundle-selected') ||
      JSON.stringify(sharedBundle.details.obligationIds)!==JSON.stringify(['OB-01','OB-02']) ||
      sharedBundle.audience.includes('theo'))
    throw invalidState('contradictory R4 shared review bundle');
  if(state.events.filter(event=>event.type==='obligation'&&event.details.obligationId==='OB-01'&&event.round===4).length!==1)
    throw invalidState('duplicate OB-01 R4 capacity transition');
  const reliabilityEvents=state.events.filter(event=>event.type==='obligation'&&event.details.obligationId==='OB-01');
  for(const event of reliabilityEvents) for(const group of ['metrics','relationships'])
    if(Object.values(event.effects[group].requested).some(value=>value!==0)||Object.values(event.effects[group].actual).some(value=>value!==0))
      throw invalidState('OB-01 event changed numeric signals');
  const obRows=state.obligations.filter(item=>item.obligationId==='OB-02');
  if(obRows.length!==1) throw invalidState('missing or duplicate OB-02');
  const obligation=obRows[0], created=requireEvent(state,'obligation','obligation:OB-02:created',2);
  if(created.eventId!==eventId(state,2,'obligation','OB-02-created') || created.details.owner!=='leah' ||
      JSON.stringify(created.audience)!==JSON.stringify(['player','leah','ishan']) ||
      created.details.status!=='active' || created.details.dueRound!==null || created.sourceEventIds.length!==1 ||
      created.sourceEventIds[0]!==r2.decision.eventId || obligation.createdByDecision!==r2.decision.eventId)
    throw invalidState('contradictory OB-02 creation record');
  const customerCreated=requireEvent(state,'obligation','obligation:OB-02:customer-status',2);
  if(customerCreated.eventId!==eventId(state,2,'obligation','OB-02-customer-status-created') ||
      JSON.stringify(customerCreated.audience)!==JSON.stringify(['player','theo']) || customerCreated.sourceEventIds.length!==1 ||
      customerCreated.sourceEventIds[0]!==created.eventId || customerCreated.details.status!=='due' ||
      Object.keys(customerCreated.details).some(key=>!['obligationId','status','owner','dueRound','text'].includes(key)))
    throw invalidState('contradictory OB-02 customer-only status update');
  const milestoneName=r2.choice.id==='explicit'?'met':'missed';
  const milestone=requireEvent(state,'obligation',`obligation:OB-02:explanation-${milestoneName}`,3);
  const r2Delayed=requireEvent(state,'delayed',`delay:consent:${r2.choice.id}`,3);
  if(milestone.eventId!==eventId(state,3,'obligation',`OB-02-explanation-${milestoneName}`) ||
      milestone.audience.includes('theo') ||
      milestone.details.status!==milestoneName || milestone.details.parentStatus!=='active' ||
      JSON.stringify(milestone.audience)!==JSON.stringify(['player','leah','ishan']) ||
      milestone.sourceEventIds.length!==3 || milestone.sourceEventIds[0]!==created.eventId ||
      milestone.sourceEventIds[1]!==r2.decision.eventId || milestone.sourceEventIds[2]!==r2Delayed.eventId ||
      obligation.customerExplanation.status!==milestoneName || obligation.customerExplanation.lastEventId!==milestone.eventId)
    throw invalidState('contradictory OB-02 R3 explanation milestone');
  const customerMilestone=requireEvent(state,'obligation','obligation:OB-02:customer-status',3);
  if(customerMilestone.eventId!==eventId(state,3,'obligation',`OB-02-customer-status-${milestoneName}`) ||
      JSON.stringify(customerMilestone.audience)!==JSON.stringify(['player','theo']) || customerMilestone.sourceEventIds.length!==1 ||
      customerMilestone.sourceEventIds[0]!==milestone.eventId || customerMilestone.details.status!==milestoneName ||
      Object.keys(customerMilestone.details).some(key=>!['obligationId','status','owner','dueRound','text'].includes(key)))
    throw invalidState('contradictory OB-02 customer-only milestone status');
  const bundleStatus=r4.choice.id==='core'?'scheduled':r4.choice.id==='custom'?'deferred':'blocked';
  const bundle=requireEvent(state,'obligation',`obligation:OB-02:bundle-${bundleStatus}`,4);
  if(bundle.eventId!==eventId(state,4,'obligation',`OB-02-workflow-bundle-${bundleStatus}`) ||
      bundle.details.bundleId!=='OB-02-RETENTION-WORKFLOW-REVIEW' || bundle.details.bundleStatus!==bundleStatus ||
      JSON.stringify(bundle.audience)!==JSON.stringify(['player','leah','ishan']) ||
      bundle.details.parentStatus!=='active' || bundle.details.choiceId!==r4.choice.id ||
      bundle.sourceEventIds.length!==2 || bundle.sourceEventIds[0]!==milestone.eventId || bundle.sourceEventIds[1]!==r4.decision.eventId ||
      obligation.workflowBundle.status!==bundleStatus || obligation.workflowBundle.sourceEventId!==bundle.eventId ||
      obligation.workflowBundle.sharedReviewBundleEventId!==sharedBundle.eventId ||
      obligation.validationBundle?.id!=='R4-SHARED-REVIEW-BUNDLE' || obligation.validationBundle.eventId!==sharedBundle.eventId ||
      obligation.validationBundle.status!==bundleStatus ||
      obligation.status!=='active') throw invalidState('contradictory OB-02 R4 workflow bundle');
  const receipt=requireEvent(state,'obligation','obligation:OB-02:r5-checkpoint',5);
  if(receipt.eventId!==eventId(state,5,'obligation','OB-02-r5-checkpoint') || receipt.details.checkpointId!=='OB-02-R5-CHECKPOINT' ||
      JSON.stringify(receipt.audience)!==JSON.stringify(['player','leah','ishan']) ||
      receipt.details.parentStatus!=='active' || receipt.details.cleanup?.owner!=='ishan' || receipt.details.cleanup.status!=='pending' ||
      receipt.details.cleanup.verified!==false || receipt.details.cleanup.overdue!==false ||
      receipt.details.workflowBundle?.status!==bundleStatus || receipt.details.sharedReviewBundle?.id!=='R4-SHARED-REVIEW-BUNDLE' ||
      receipt.details.sharedReviewBundle?.status!==bundleStatus ||
      receipt.details.sharedReviewBundle?.eventId!==sharedBundle.eventId || receipt.details.explanationMilestone?.status!==milestoneName ||
      receipt.details.selectedRetentionPath!==r2.choice.id || receipt.details.selectedCapacityPath!==r4.choice.id ||
      receipt.sourceEventIds[0]!==bundle.eventId || !receipt.sourceEventIds.includes(sharedBundle.eventId) || !receipt.sourceEventIds.includes(r5.decision.eventId) ||
      obligation.status!=='active' || obligation.lastEventId!==receipt.eventId || obligation.r5Checkpoint?.eventId!==receipt.eventId)
    throw invalidState('contradictory OB-02 R5 checkpoint');
  const expectedCheckIds=bundleStatus!=='scheduled'?[]:r2.choice.id==='explicit'?
    ['participant-notice','new-data-default','deletion-request-workflow']:r2.choice.id==='quiet'?['new-data-default']:[];
  if(JSON.stringify(receipt.details.checks.map(item=>item.checkId))!==JSON.stringify(expectedCheckIds) ||
      receipt.details.checks.some(item=>item.status!=='described-by-selected-path'||item.sourceEventIds[0]!==r2.decision.eventId))
    throw invalidState('contradictory OB-02 per-check selection');
  const customerR5=requireEvent(state,'obligation','obligation:OB-02:customer-status',5);
  if(customerR5.eventId!==eventId(state,5,'obligation','OB-02-customer-status-r5') ||
      JSON.stringify(customerR5.audience)!==JSON.stringify(['player','theo']) || customerR5.sourceEventIds.length!==1 ||
      customerR5.sourceEventIds[0]!==customerMilestone.eventId || customerR5.details.status!==milestoneName ||
      Object.keys(customerR5.details).some(key=>!['obligationId','status','owner','dueRound','text'].includes(key)))
    throw invalidState('contradictory OB-02 customer-only R5 status');
  const atlasQuestion=questions.find(event=>event.round===2&&event.actor==='theo'&&event.details.questionId==='atlas-retention');
  const kb08=state.artifacts.find(item=>item.artifactId==='KB-08');
  if(r2.choice.id==='exception') {
    if(receipt.details.checks.length || receipt.details.atlasException?.status!=='separate-request-retained' ||
        receipt.details.atlasException.scope!=='Atlas only' || receipt.details.atlasException.scopeStatus!=='unresolved' ||
        receipt.details.atlasException.verificationStatus!=='not verified' || receipt.details.atlasException.consentOrApproval!=='not established' ||
        receipt.details.atlasException.duration!==(atlasQuestion&&kb08?'30 days':null) ||
        JSON.stringify(receipt.details.atlasException.sourceEventIds)!==JSON.stringify([r2.decision.eventId,...(atlasQuestion?[atlasQuestion.eventId]:[]),...(atlasQuestion&&kb08?[kb08.eventId]:[])]))
      throw invalidState('contradictory OB-02 Atlas exception boundary');
  } else if(receipt.details.atlasException!==null) throw invalidState('unsupported OB-02 Atlas exception receipt');
  const obEvents=state.events.filter(event=>event.type==='obligation'&&event.details.obligationId==='OB-02');
  for(const event of obEvents) for(const group of ['metrics','relationships'])
    if(Object.values(event.effects[group].requested).some(value=>value!==0)||Object.values(event.effects[group].actual).some(value=>value!==0))
      throw invalidState('OB-02 event changed numeric signals');
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
  return {decisions,completion,questions,obligationCheckpoint:receipt,obligation,reliability,reliabilityBundle:sharedBundle,reliabilityReview};
}
function citationFor(event,visibleIds) {
  const person=PEOPLE.find(person=>person.id===event.actor);
  const names={decision:'Decision',question:'Conversation',delayed:'Later consequence',completion:'Completed attempt',input:'Confirmed input',disclosure:'Disclosure',memory:'Stakeholder recollection',story:'Scenario record',artifact:'Case file',finding:'Recorded comparison',obligation:'Carried-work update'};
  const detail=event.type==='decision'?event.details.title:event.type==='question'?person.name+' — '+event.details.title:event.type==='input'?event.details.mode==='typed'?'Your wording':'Prepared approach':event.details.title||event.details.milestoneId||event.details.bundleId||event.details.checkpointId||'';
  const text=event.type==='decision'?event.details.outcome:event.type==='completion'?'Five decisions completed. Final signals and authored motives are recorded here.':event.type==='input'?event.details.mode==='typed'?event.details.text:'A prepared approach was confirmed; no player wording was supplied.':event.details.text||event.details.title||'';
  return {eventId:event.eventId,label:'Round '+event.round+' · '+names[event.type]+(detail?': '+detail:''),round:event.round,type:event.type,status:event.evidenceStatus,text,effects:copy(event.effects),sourceEventIds:event.sourceEventIds.filter(id=>visibleIds.has(id))};
}
export function getDebrief(state) {
  const {decisions,completion,questions,obligationCheckpoint,obligation,reliability,reliabilityBundle,reliabilityReview}=completedTrace(state);
  const visible=getPlayerEvents(state), visibleIds=new Set(visible.map(event=>event.eventId));
  const citations=visible.map(event=>citationFor(event,visibleIds));
  const sources=ids=>{
    const unique=[...new Set(ids)];
    if(!unique.length || unique.some(id=>!visibleIds.has(id))) throw invalidState('unavailable debrief source');
    return unique;
  };
  const delayed=state.events.filter(event=>event.type==='delayed');
  const findings=state.events.filter(event=>event.type==='finding');
  const retentionFindingHistory=findings.filter(event=>event.details.findingId===RETENTION_FINDING_ID).map(event=>({
    eventId:event.eventId,action:event.details.action,revision:event.details.revision,recordedAtRound:event.details.recordedAtRound,
    interpretation:event.details.interpretation,active:event.details.active,
    sourceAcquisitions:copy(event.details.sourceAcquisitions),sourceEventIds:sources([event.eventId,...event.sourceEventIds])
  }));
  const outcome={...evaluateOutcome(state.metrics),sourceEventIds:sources([...decisions.map(event=>event.eventId),...delayed.map(event=>event.eventId),completion.eventId,...findings.map(event=>event.eventId)])};
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
  cited.add(obligationCheckpoint.eventId);
  cited.add(reliabilityBundle.eventId);
  cited.add(reliabilityReview.eventId);
  // Follow only already-allowed ancestors. A visible account never reveals a private parent.
  for(const id of cited) for(const parent of citations.find(item=>item.eventId===id)?.sourceEventIds||[]) cited.add(parent);
  const obligations=[{obligationId:obligation.obligationId,title:obligation.title,owner:obligation.owner,status:obligation.status,
    cleanup:copy(obligationCheckpoint.details.cleanup),policyScopeFollowUp:copy(obligationCheckpoint.details.policyScopeFollowUp),
    explanationMilestone:copy(obligationCheckpoint.details.explanationMilestone),workflowBundle:copy(obligationCheckpoint.details.workflowBundle),
    checks:copy(obligationCheckpoint.details.checks),atlasException:copy(obligationCheckpoint.details.atlasException),
    sourceEventIds:sources([obligationCheckpoint.eventId])}];
  const reliabilityBundleSummary={obligationId:reliability.obligationId,title:reliability.title,owner:reliability.owner,status:reliability.status,
    dueRound:reliability.dueRound,bundleId:reliability.validationBundle.id,bundleStatus:reliability.validationBundle.status,
    sharedBundleId:reliability.validationBundle.id,sharedBundleStatus:reliability.validationBundle.status,
    sharedBundleEventId:reliability.validationBundle.eventId,verified:reliability.verified,
    text:reliabilityReview.details.text,sourceEventIds:sources([reliabilityReview.eventId,reliability.validationBundle.eventId])};
  return {title:outcome.title,description:outcome.description,outcome,counts,reflections,decisions:decisionRecords,agendas,obligations,
    reliabilityBundle:reliabilityBundleSummary,retentionFindingHistory,citations:citations.filter(item=>cited.has(item.eventId))};
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
  for(const item of debrief.obligations) {
    lines.push('CARRIED WORK: '+item.obligationId+' — '+item.title,'Accountable owner: '+item.owner+'; status: '+item.status,
      'Cleanup owner: '+item.cleanup.owner+'; cleanup: '+item.cleanup.status+'; overdue: '+item.cleanup.overdue+'; verified: '+item.cleanup.verified,
      'Policy/scope follow-up: '+item.policyScopeFollowUp.owner+'; '+item.policyScopeFollowUp.due+'; execution deadline: not set',
      'R3 explanation: '+item.explanationMilestone.status+'; workflow bundle: '+item.workflowBundle.status,
      ...item.checks.map(check=>check.checkId+': described by the selected path; independent execution receipt not recorded.'),refs(item.sourceEventIds));
    if(item.atlasException) lines.push('Atlas-only request: '+(item.atlasException.duration||'duration not established')+'; scope and verification unresolved; approval and deletion not established; no general default or authorization inferred.');
    lines.push('');
  }
  lines.push('RELIABILITY VALIDATION: '+debrief.reliabilityBundle.bundleStatus+' — '+debrief.reliabilityBundle.text,
    'Shared bundle: '+debrief.reliabilityBundle.sharedBundleId+' ('+debrief.reliabilityBundle.sharedBundleStatus+'). Parent status: '+debrief.reliabilityBundle.status+
    '; owner: '+debrief.reliabilityBundle.owner+'; due R'+debrief.reliabilityBundle.dueRound+'.',refs(debrief.reliabilityBundle.sourceEventIds),'');
  if(debrief.retentionFindingHistory.length) {
    lines.push('PLAYER INVESTIGATION · DEFAULT IS NOT CLEANUP');
    for(const item of debrief.retentionFindingHistory) lines.push('Revision '+item.revision+' · R'+item.recordedAtRound+' · '+item.action+': '+item.interpretation,
      'Active: '+item.active+'; acquired sources: '+item.sourceAcquisitions.map(source=>source.artifactId+' at R'+source.acquiredAtRound+' (sequence '+source.sequence+', event '+source.eventId+')').join(', '),refs(item.sourceEventIds));
    lines.push('');
  }
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
