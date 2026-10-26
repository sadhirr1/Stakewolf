import test from 'node:test';
import assert from 'node:assert/strict';
import {createCouncil,councilAct,councilView} from '../dist/council.mjs';
import {STORAGE_KEY,MAX_SAVED,createSavedCouncil,loadSavedCouncils,saveCouncil,deleteSavedCouncil,clearSavedCouncils,compareSavedCouncils} from '../dist/council-saves.mjs';

const act = (state,type,fields={}) => councilAct(state,{type,...fields});
const clone = value => JSON.parse(JSON.stringify(value));
const meta = (id='attempt-1',minute=0) => ({id,completedAt:new Date(Date.UTC(2026,9,25,12,minute)).toISOString(),origin:'general'});
function completed(topic='accessibility',proposalId='repair',actions=[],workId=null) {
  let state = act(createCouncil(topic),'propose',{proposalId});
  for (const action of actions) state = councilAct(state,action);
  const closed = councilView(state);
  state = act(state,'commit');
  if (workId) state = act(state,'allocate',{workId});
  return {state:act(state,'finish'),attempt:{closed,questions:[],events:[],droppedQuestions:0,droppedEvents:0}};
}
const snapshot = (id='attempt-1',minute=0,run=completed()) => createSavedCouncil(run.state,run.attempt,meta(id,minute));
function memory(raw=null) {
  const data = new Map(raw === null ? [] : [[STORAGE_KEY,raw]]);
  return {data,writes:0,getItem(key){return data.has(key)?data.get(key):null;},setItem(key,value){this.writes++;data.set(key,value);},removeItem(key){this.writes++;data.delete(key);}};
}
const packed = items => JSON.stringify({schemaVersion:1,items});

test('only completed councils and valid metadata produce a snapshot',()=>{
  assert.equal(createSavedCouncil(createCouncil('accessibility'),{},meta()),null);
  const halfway = act(act(createCouncil('systems'),'propose',{proposalId:'readiness'}),'commit');
  assert.equal(createSavedCouncil(halfway,{},meta()),null);
  assert.equal(createSavedCouncil(null,{},meta()),null);
  const {state,attempt} = completed();
  for (const invalid of [{},{...meta(),id:'<img>'},{...meta(),completedAt:'2026-02-30T12:00:00.000Z'},{...meta(),origin:'x'.repeat(81)}]) assert.equal(createSavedCouncil(state,attempt,invalid),null);
  assert.equal(snapshot().schemaVersion,1);
});

test('snapshots retain exact confirmed facts and capacity in both cases',()=>{
  const routes = [
    completed('accessibility','repair',[{type:'investigate',recordId:'focus'},{type:'promise',commitmentId:'verification'}],'announce'),
    completed('systems','versioned',[{type:'investigate',recordId:'consumers'},{type:'promise',commitmentId:'rollback'}],'parser')
  ];
  for (const run of routes) {
    const saved = snapshot('complete',0,run), view = councilView(run.state);
    assert.ok(saved);
    assert.equal(saved.reserved,4);assert.equal(saved.used,6);assert.equal(saved.capacity,6);
    assert.deepEqual(saved.records,view.records.filter(row=>row.opened).map(({id,title})=>({id,title})));
    assert.equal(saved.promises[0].cost,2);
    assert.equal(saved.fulfilled.length,3);assert.equal(saved.deferred.length,1);
    assert.equal(saved.deferred[0].detail,view.debrief.deferred[0].detail);
  }
});

test('snapshots are deeply immutable and detached from the attempt',()=>{
  const run = completed(), before = clone(run);
  const saved = snapshot('frozen',0,run);
  assert.deepEqual(run,before);
  assert.ok(Object.isFrozen(saved));assert.ok(Object.isFrozen(saved.feedback.sections[0].observations));
  assert.throws(()=>{saved.feedback.sections[0].summary='changed';},TypeError);
  run.attempt.questions.push({speakerId:'design',phase:'council',question:'ADDED AFTER SAVING'});
  run.state.proposalId='fallback';
  assert.equal(saved.decision.id,'repair');assert.doesNotMatch(JSON.stringify(saved),/ADDED AFTER SAVING/);
});

test('private objectives, job description and full conversation are excluded',()=>{
  const run = completed();
  run.attempt.jd='SECRET FULL JOB DESCRIPTION';
  run.attempt.questions = [
    {speakerId:'design',phase:'council',question:'UNSELECTED CHAT MESSAGE'},
    {speakerId:'design',phase:'council',question:'What does the audit establish?',topic:'source:audit'},
    {speakerId:'support',phase:'council',question:'What would change your support?',topic:'support'},
    {speakerId:'design',phase:'debrief',question:'PRIVATE DEBRIEF CHAT'}
  ];
  const saved = snapshot('privacy',0,run), raw = JSON.stringify(saved);
  assert.doesNotMatch(raw,/SECRET FULL JOB DESCRIPTION|UNSELECTED CHAT MESSAGE|PRIVATE DEBRIEF CHAT/);
  assert.match(raw,/What does the audit establish/);
  for (const person of councilView(run.state).debrief.reveals) assert.ok(!raw.includes(person.objective));
  assert.equal(saved.questions,undefined);assert.equal(saved.jd,undefined);assert.equal(saved.questionCount,3);
});

test('questionCount counts at most sixty valid retained messages, not omitted or invalid submissions',()=>{
  const run=completed();
  run.attempt.questions=Array.from({length:65},()=>({speakerId:'design',phase:'council',question:'A question'}));
  run.attempt.questions.push(null,{speakerId:'unknown',phase:'council',question:'Unknown'}, {speakerId:'design',phase:'debrief',question:'Excluded'}, {speakerId:'design',phase:'council',question:' '});
  run.attempt.droppedQuestions=20;
  const saved=snapshot('count',0,run);
  assert.equal(saved.questionCount,60);assert.match(JSON.stringify(saved.feedback),/25 messages were not retained/);
});

test('an empty store is a successful empty history and null storage is unavailable',()=>{
  assert.deepEqual(loadSavedCouncils(memory()),{items:[],error:null});
  for(const storage of [null,{}, {getItem(){throw Error('denied');}}]) {
    assert.ok(loadSavedCouncils(storage).error);assert.ok(saveCouncil(storage,snapshot()).error);
    assert.ok(deleteSavedCouncil(storage,'attempt-1').error);assert.ok(clearSavedCouncils(storage).error);
  }
});

test('round trip restores frozen original feedback and public facts',()=>{
  const store=memory(), saved=snapshot();
  const written=saveCouncil(store,saved);
  assert.equal(written.error,null);assert.deepEqual(written.items,[saved]);
  const restored=loadSavedCouncils(store);
  assert.equal(restored.error,null);assert.deepEqual(restored.items,[saved]);
  assert.ok(Object.isFrozen(restored.items));assert.ok(Object.isFrozen(restored.items[0].feedback.rehearsal));
  assert.notEqual(restored.items[0],saved);
});

test('save merges a fresh storage read and upserts identity without duplicating it',()=>{
  const store=memory();
  saveCouncil(store,snapshot('a',0));
  const stale=loadSavedCouncils(store);
  store.setItem(STORAGE_KEY,packed([snapshot('b',1),...stale.items]));
  let saved=saveCouncil(store,snapshot('c',2));
  assert.deepEqual(saved.items.map(row=>row.id),['c','b','a']);
  const writes=store.writes;
  saved=saveCouncil(store,snapshot('c',2));
  assert.equal(saved.items.length,3);assert.equal(saved.items.filter(row=>row.id==='c').length,1);
  assert.equal(store.writes,writes);
  const revised=snapshot('c',2,completed('accessibility','fallback'));
  const rejected=saveCouncil(store,revised);
  assert.match(rejected.error,/original snapshot has been kept unchanged/);
  assert.equal(rejected.items[0].decision.id,'repair');assert.equal(store.writes,writes);
});

test('the twenty most recent completed councils survive a save',()=>{
  const store=memory();
  for(let index=0;index<23;index++) assert.equal(saveCouncil(store,snapshot(`id-${index}`,index)).error,null);
  const loaded=loadSavedCouncils(store);
  assert.equal(MAX_SAVED,20);assert.equal(loaded.items.length,20);
  assert.equal(loaded.items[0].id,'id-22');assert.equal(loaded.items.at(-1).id,'id-3');
  const old=saveCouncil(store,snapshot('old',0));
  assert.match(old.error,/older council was not saved/);
  assert.equal(old.items.length,20);assert.ok(!old.items.some(row=>row.id==='old'));
});

test('quota and denied writes never report a candidate as persisted or delete existing records',()=>{
  const original=snapshot('existing'), store=memory(packed([original])), raw=store.getItem(STORAGE_KEY);
  store.setItem=()=>{throw Error('quota');};
  const attempted=saveCouncil(store,snapshot('new',1));
  assert.ok(attempted.error);assert.deepEqual(attempted.items,[original]);assert.equal(store.getItem(STORAGE_KEY),raw);
  const deleted=deleteSavedCouncil(store,'existing');
  assert.ok(deleted.error);assert.deepEqual(deleted.items,[original]);assert.equal(store.getItem(STORAGE_KEY),raw);
  store.removeItem=()=>{throw Error('denied');};
  assert.ok(clearSavedCouncils(store).error);assert.equal(store.getItem(STORAGE_KEY),raw);
});

test('corrupt or unknown-version stores remain unchanged until explicit clear',()=>{
  const unknown=clone(snapshot());unknown.caseVersion='council-v2';
  const bads=['{','null','[]','',JSON.stringify({schemaVersion:2,items:[]}),packed([unknown]),packed([snapshot(),snapshot()]),'x'.repeat(1024*1024+1)];
  for(const raw of bads) {
    const store=memory(raw);
    assert.ok(loadSavedCouncils(store).error);assert.ok(saveCouncil(store,snapshot('new')).error);
    assert.ok(deleteSavedCouncil(store,'attempt-1').error);assert.equal(store.writes,0);assert.equal(store.getItem(STORAGE_KEY),raw);
    assert.deepEqual(clearSavedCouncils(store),{items:[],error:null});assert.equal(store.getItem(STORAGE_KEY),null);
  }
});

test('malformed records, impossible costs, unknown IDs and unbounded text reject the whole store',()=>{
  const badChanges=[
    saved=>{saved.reserved=7;},saved=>{saved.used=-1;},saved=>{saved.decision.id='unknown';},
    saved=>{saved.decision.title='<img src=x onerror=alert(1)>';},saved=>{saved.support[0].support='excellent';},
    saved=>{saved.fulfilled.push(clone(saved.fulfilled[0]));},saved=>{saved.promises=[{id:'showcase',title:'Give Design a revised showcase',cost:99}];},
    saved=>{saved.feedback.sections[0].observations[0]='x'.repeat(4001);},saved=>{saved.feedback.sections[0].observations={};},
    saved=>{saved.jd='unexpected personal data';},saved=>{saved.records=[{id:'__proto__',title:'Injected'}];}
  ];
  for(const change of badChanges) {
    const saved=clone(snapshot());change(saved);
    const store=memory(packed([snapshot('valid'),saved])), raw=store.getItem(STORAGE_KEY);
    assert.ok(loadSavedCouncils(store).error);assert.ok(saveCouncil(store,snapshot('replacement')).error);
    assert.equal(store.getItem(STORAGE_KEY),raw);
  }
});

test('delete and clear affect only this history key; deleting absent IDs is a no-op',()=>{
  const store=memory(packed([snapshot('a'),snapshot('b',1)]));
  store.data.set('unrelated','keep me');
  assert.equal(deleteSavedCouncil(store,'missing').error,null);assert.equal(store.writes,0);
  assert.deepEqual(deleteSavedCouncil(store,'a').items.map(row=>row.id),['b']);
  assert.equal(clearSavedCouncils(store).error,null);assert.equal(store.data.get('unrelated'),'keep me');
});

test('comparison describes named changes and trade-offs in both fixed cases',()=>{
  for(const [topic,first,second,record,promise,work] of [
    ['accessibility','repair','fallback','audit','showcase','fallback-verify'],
    ['systems','versioned','readiness','contract','customer','parser']
  ]) {
    const before=snapshot('first',0,completed(topic,first));
    const after=snapshot('second',1,completed(topic,second,[{type:'investigate',recordId:record},{type:'promise',commitmentId:promise}],work));
    const compared=compareSavedCouncils(before,after);
    assert.ok(compared);assert.equal(compared.rows.find(row=>row.label==='Confirmed approach').after,after.decision.title);
    assert.ok(compared.changes.some(line=>line.includes(after.records[0].title)));
    assert.ok(compared.changes.some(line=>line.includes(after.promises[0].title)));
    assert.ok(compared.rows.some(row=>row.label==='Retained messages'));
    assert.match(compared.limits.join(' '),/retry knows the same fixed case/);
    assert.match(compared.limits.join(' '),/not scores/);assert.doesNotMatch(compared.changes.join(' '),/improved|better|grade|score/i);
    assert.deepEqual(before,snapshot('first',0,completed(topic,first)));
  }
});

test('comparison refuses same identity, different cases, versions and invalid saves',()=>{
  const original=snapshot('a'), otherCase=snapshot('b',1,completed('systems','versioned'));
  const otherVersion=clone(snapshot('b'));otherVersion.caseVersion='council-v2';
  assert.equal(compareSavedCouncils(original,original),null);
  assert.equal(compareSavedCouncils(original,otherCase),null);
  assert.equal(compareSavedCouncils(original,otherVersion),null);
  assert.equal(compareSavedCouncils(original,{}),null);
  assert.match(compareSavedCouncils(original,snapshot('b')).changes[0],/same evidence/);
});

test('saved feedback stays verbatim on load and comparison, with text treated as inert data',()=>{
  const saved=clone(snapshot('a'));
  saved.feedback.sections[0].observations[0]='Original <script>alert("text only")</script> feedback';
  const store=memory(packed([saved])), loaded=loadSavedCouncils(store);
  assert.equal(loaded.error,null);assert.deepEqual(loaded.items[0].feedback,saved.feedback);
  const before=JSON.stringify(loaded.items[0]);
  assert.ok(compareSavedCouncils(loaded.items[0],snapshot('b')));
  assert.equal(JSON.stringify(loaded.items[0]),before);
});
