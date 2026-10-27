import test from 'node:test';
import assert from 'node:assert/strict';
import {createCouncil,councilAct,councilView} from '../dist/council.mjs';
import {buildCouncilCoaching} from '../dist/council-coaching.mjs';

const act = (state,type,fields={}) => councilAct(state,{type,...fields});
function completed(topic='accessibility', proposalId='repair', actions=[], workId=null) {
  let state = act(createCouncil(topic),'propose',{proposalId});
  for (const action of actions) state = councilAct(state,action);
  const closed = councilView(state);
  state = act(state,'commit');
  if (workId) state = act(state,'allocate',{workId});
  return {state:act(state,'finish'),attempt:{closed,questions:[],events:[],droppedQuestions:0,droppedEvents:0}};
}
const text = result => JSON.stringify(result);
const section = (result,id) => result.sections.find(row => row.id === id);
const freeze = value => {
  if (value && typeof value === 'object') {Object.values(value).forEach(freeze); Object.freeze(value);}
  return value;
};

test('only completed councils receive the three coaching sections',()=>{
  let state = createCouncil('accessibility');
  assert.equal(buildCouncilCoaching(state),null);
  state = act(act(state,'propose',{proposalId:'repair'}),'commit');
  assert.equal(buildCouncilCoaching(state),null);
  const result = buildCouncilCoaching(act(state,'finish'));
  assert.deepEqual(result.sections.map(row=>row.id),['questioning','negotiation','consequences']);
  assert.ok(result.sections.every(row=>row.title && row.summary && row.observations.length && row.next));
  assert.equal(result.rehearsal.length,3);
});

test('preset-only play reports decisions without inventing questions or criticizing their absence',()=>{
  const {state,attempt} = completed('accessibility','repair',[{type:'investigate',recordId:'focus'}],'announce');
  const result = buildCouncilCoaching(state,attempt);
  assert.match(text(result),/No typed-message examples/);
  assert.match(text(result),/Preset controls can still inspect/);
  assert.match(text(result),/You funded Repair and verify error announcements/);
  assert.match(text(result),/You deferred Provide a verified interim save route/);
  assert.doesNotMatch(text(result),/matching pre-commit snapshot was unavailable/);
});

test('opened evidence is quoted but unopened source contents and private objectives never enter coaching',()=>{
  const {state,attempt} = completed('accessibility','repair',[{type:'investigate',recordId:'audit'}]);
  const result = text(buildCouncilCoaching(state,attempt));
  assert.match(result,/Audit scope states: The automated scan/);
  assert.doesNotMatch(result,/Two customers reported save failures|keyboard-only walkthrough gets trapped/);
  for (const person of councilView(state).debrief.reveals) assert.ok(!result.includes(person.objective));
  assert.match(result,/does not establish how you understood or used it/);
});

test('inspection offers do not become inspected records or confirmed commitments',()=>{
  const {state,attempt} = completed();
  attempt.questions.push({speakerId:'design',question:'Can I see the audit?',kind:'inspection',topic:'source:audit',phase:'council'});
  attempt.questions.push({speakerId:'engineering',question:'Fund task checks.',kind:'offer',topic:'promise:verification',phase:'council'});
  const result = text(buildCouncilCoaching(state,attempt));
  assert.match(result,/You inspected 0/);
  assert.match(result,/1 retained typed message offered a source inspection/);
  assert.match(result,/closed without reserving any promises/);
  assert.doesNotMatch(result,/Audit scope states:/);
});

test('typed messages show speaker and phase, clarification stays a matcher limitation, debrief messages are excluded',()=>{
  const {state,attempt} = completed();
  attempt.questions = [
    {speakerId:'design',question:'Which claim can we test?',kind:'clarify',phase:'council'},
    {speakerId:'support',question:'What is the cost of the interim route?',kind:'answer',phase:'aftermath'},
    {speakerId:'design',question:'PRIVATE DEBRIEF QUESTION',kind:'answer',phase:'debrief'}
  ];
  const result = text(buildCouncilCoaching(state,attempt));
  assert.match(result,/council message to Mara/);
  assert.match(result,/aftermath message to Jules/);
  assert.match(result,/not a judgment of the question’s quality/);
  assert.doesNotMatch(result,/PRIVATE DEBRIEF QUESTION/);
});

test('retained question examples are bounded and omitted questions are disclosed',()=>{
  const {state,attempt} = completed();
  attempt.questions = Array.from({length:62},(_,index)=>({speakerId:'design',question:`MESSAGE-${index} ${'a'.repeat(250)}`,kind:'answer',phase:'council'}));
  attempt.droppedQuestions = 5;
  const result = text(buildCouncilCoaching(state,attempt));
  assert.match(result,/7 messages were not retained/);
  assert.match(result,/MESSAGE-61/);
  assert.doesNotMatch(result,/MESSAGE-0 |a{180}/);
  assert.match(result,/…/);
});

test('earlier source and support questions remain examples after later unrelated messages',()=>{
  const {state,attempt} = completed();
  attempt.questions = [
    {speakerId:'design',question:'What did the audit check?',kind:'inspection',topic:'source:audit',phase:'council'},
    {speakerId:'engineering',question:'What would change your mind?',kind:'answer',topic:'support',phase:'council'},
    ...Array.from({length:20},()=>({speakerId:'support',question:'How much capacity remains?',kind:'answer',topic:'capacity',phase:'aftermath'}))
  ];
  const result = text(buildCouncilCoaching(state,attempt));
  assert.match(result,/What did the audit check/);
  assert.match(result,/What would change your mind/);
  assert.doesNotMatch(result,/How much capacity remains/);
});

test('blank, oversized, wrong-speaker and invalid-phase messages cannot supply examples',()=>{
  const {state,attempt} = completed();
  attempt.questions = [null,{speakerId:'design',question:' ',phase:'council'},{speakerId:'design',question:'x'.repeat(601),phase:'council'},{speakerId:'unknown',question:'INVENTED',phase:'council'},{speakerId:'design',question:'INVENTED',phase:'unknown'}];
  const result = text(buildCouncilCoaching(state,attempt));
  assert.match(result,/No typed-message examples/);
  assert.doesNotMatch(result,/INVENTED/);
});

test('unanimous support and automatically fulfilled promises do not imply good decisions or discretionary follow-through',()=>{
  const {state,attempt} = completed('systems','readiness',['retirement','rollback','customer'].map(commitmentId=>({type:'promise',commitmentId})));
  const result = buildCouncilCoaching(state,attempt);
  assert.match(section(result,'negotiation').summary,/promises reserved 4. That left 0/);
  assert.equal(section(result,'negotiation').observations.filter(row=>row.includes('supported the approach at closing')).length,3);
  assert.match(text(result),/3 promises were delivered automatically/);
  assert.match(text(result),/not evidence of discretionary follow-through/);
  assert.match(text(result),/Unanimity and a larger number of promises are not universal goals/);
});

test('both cases preserve their route-specific outcomes and deferred consequences',()=>{
  const paths = [
    ['accessibility','fallback','fallback-verify','new screen keeps its separate error-announcement defect'],
    ['accessibility','replace','component-errors','Users have no verified interim save route'],
    ['systems','versioned','parser','without dedicated maintenance coverage'],
    ['systems','readiness','pilot','known readiness blocker'],
    ['systems','narrow','adapter','Legacy maintenance has no dedicated new coverage']
  ];
  for (const [topic,proposalId,workId,consequence] of paths) {
    const {state,attempt} = completed(topic,proposalId,[],workId);
    const result = text(buildCouncilCoaching(state,attempt));
    const view = councilView(state);
    assert.ok(result.includes(view.debrief.fulfilled.find(work=>work.id===workId).detail));
    assert.ok(result.includes(consequence));
    for (const person of view.debrief.reveals) assert.ok(!result.includes(person.objective));
  }
});

test('an affordable deferral invites a reason without prescribing maximum spending',()=>{
  const {state,attempt} = completed('systems','narrow');
  const result = buildCouncilCoaching(state,attempt);
  assert.match(section(result,'consequences').next,/would fit in the 4 unused units/);
  assert.match(section(result,'consequences').next,/fund it or leave it deferred/);
  assert.match(text(result),/Spending every unit is not itself an objective/);
});

test('an unaffordable response invites a specific trade-off rather than pretending more work fits',()=>{
  const {state,attempt} = completed('accessibility','repair',[{type:'promise',commitmentId:'verification'}],'announce');
  const result = buildCouncilCoaching(state,attempt);
  assert.match(section(result,'consequences').next,/Provide a verified interim save route/);
  assert.match(section(result,'consequences').next,/which reservation or response you would need to change/);
  assert.match(text(result),/final plan left 0 units unused/);
});

test('confirmed final facts override inconsistent snapshots and inflated event logs',()=>{
  const {state,attempt} = completed('systems','versioned');
  attempt.closed.commitments[0].selected = true;
  attempt.events = Array.from({length:60},()=>({type:'promise',phase:'council',source:'typed'}));
  attempt.droppedEvents = 20;
  const result = text(buildCouncilCoaching(state,attempt));
  assert.match(result,/promises reserved 0/);
  assert.match(result,/matching pre-commit snapshot was unavailable/);
  assert.match(result,/action log omitted 20 events/);
});

test('coaching is deterministic, input-immutable and freshly detached on every call',()=>{
  const {state,attempt} = completed('systems','versioned',[{type:'investigate',recordId:'consumers'},{type:'promise',commitmentId:'retirement'}],'parser');
  freeze(state); freeze(attempt);
  const result = buildCouncilCoaching(state,attempt);
  assert.deepEqual(result,buildCouncilCoaching(state,attempt));
  result.sections[0].observations[0] = 'CHANGED';
  assert.doesNotMatch(text(buildCouncilCoaching(state,attempt)),/CHANGED/);
});
