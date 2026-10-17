import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,act,used,restore,result} from '../public/wild/portrait-proof/clearing-state.js';

const plan=()=>act(fresh(),'start');
function committed(tasks,records=[],watch='none'){let state=act(plan(),'watch',watch);for(const key of records)state=act(state,'read',key);for(const key of tasks)state=act(state,'assign',key);return act(state,'commit');}

test('investigation is optional, idempotent knowledge and does not allocate crew',()=>{
  const start=plan(),read=act(act(start,'read','map'),'read','map');
  assert.deepEqual(read.seen,['map']);assert.equal(used(read),0);assert.deepEqual(start.seen,[]);
  assert.equal(act(start,'read','__proto__'),start);assert.equal(act(fresh(),'assign','inspect').phase,'intro');
});
test('two-person capacity rejects overbooking, supports recall and never mutates earlier state',()=>{
  const start=plan(),inspected=act(start,'assign','inspect');
  assert.equal(act(inspected,'assign','repair'),inspected);
  const both=act(inspected,'assign','supplies');assert.equal(used(both),2);assert.equal(act(both,'assign','repair'),both);
  const recalled=act(both,'assign','inspect');assert.equal(used(recalled),1);assert.equal(used(both),2);assert.equal(used(start),0);
  const pair=act(plan(),'assign','repair');assert.equal(used(pair),2);assert.equal(act(pair,'assign','supplies'),pair);
});
test('empty orders cannot commit; committed night cannot gain work or evidence on replayed actions',()=>{
  const start=plan();assert.equal(act(start,'commit'),start);
  const night=committed(['repair'],['report']);
  for(const [type,key]of [['commit'],['assign','inspect'],['read','map'],['start']])assert.equal(act(night,type,key),night);
  const dawn=act(night,'dawn');assert.equal(act(dawn,'dawn'),dawn);assert.equal(act(dawn,'assign','supplies'),dawn);
  assert.equal(result(start),null);
});
test('inspection and protection reveal concrete condition and complete stores without repairing',()=>{
  const end=act(committed(['inspect','supplies'],['map','report']),'dawn'),report=result(end);
  assert.match(report.threads[0].status,/repair pending/);assert.match(report.threads[0].detail,/fastening loose/);
  assert.match(report.threads[0].detail,/No repair/);assert.match(report.threads[1].status,/protected/);
  assert.match(report.threads[2].status,/Delayed/);assert.equal(report.unassigned,0);
});
test('repair is never clearance and unprotected supplies never imply an invented loss',()=>{
  const report=result(act(committed(['repair']),'dawn'));
  assert.match(report.threads[0].status,/inspection pending/);assert.match(report.threads[0].detail,/path stays closed/);
  assert.match(report.threads[1].status,/Exposed/);assert.match(report.threads[1].detail,/No loss or theft has been confirmed/);
});
test('all four feasible nonempty allocations survive reload with identical physical outcomes regardless of reading',()=>{
  for(const tasks of [['inspect'],['supplies'],['inspect','supplies'],['repair']]){
    const without=act(committed(tasks),'dawn'),withEvidence=act(committed(tasks,['map','report']),'dawn');
    assert.deepEqual(result(without).threads,result(withEvidence).threads);assert.deepEqual(result(without).events,result(withEvidence).events);
    assert.deepEqual(restore(JSON.stringify(withEvidence)),withEvidence);
    assert.equal(result(without).unassigned,tasks.length===1&&tasks[0]!=='repair'?1:0);
    assert.equal(act(restore(JSON.stringify(withEvidence)),'assign','supplies').phase,'dawn');
  }
});
test('saved intro, in-progress plan and committed night restore; fresh restart clears the whole attempt',()=>{
  for(const state of [fresh(),act(plan(),'read','map'),act(plan(),'assign','repair'),committed(['supplies'])])assert.deepEqual(restore(JSON.stringify(state)),state);
  const reset=fresh();assert.deepEqual(reset.seen,[]);assert.equal(used(reset),0);assert.equal(reset.phase,'intro');
});
test('corrupt, unsupported, forged over-capacity and impossible phase saves are rejected',()=>{
  assert.equal(restore('{broken'),null);assert.equal(restore('null'),null);
  const bad=[{...fresh(),version:3},{...plan(),seen:['map','map']},{...plan(),seen:['__proto__']},{...plan(),crew:{inspect:-1,repair:0,supplies:0}},{...plan(),crew:{inspect:1,repair:2,supplies:1}},{...plan(),crew:{inspect:1,repair:1,supplies:0}},{...plan(),crew:{inspect:1,repair:0}},{...fresh(),phase:'dawn'},{...fresh(),seen:['report']},{...fresh(),phase:'hacked'},{...plan(),watch:'__proto__'},{...plan(),challenged:true},{...fresh(),watch:'none'},{...committed(['repair']),watch:'orin'},{...committed(['inspect']),watch:null}];
  for(const state of bad)assert.equal(restore(JSON.stringify(state)),null);
});

test('a watch consumes a real worker; changes cannot silently drop work or exceed capacity',()=>{
  const pair=act(plan(),'assign','repair');assert.equal(act(pair,'watch','orin'),pair);
  const guard=act(plan(),'watch','orin');assert.equal(used(guard),1);assert.equal(act(guard,'assign','repair'),guard);
  const protectedStores=act(guard,'assign','supplies');assert.equal(used(protectedStores),2);
  assert.equal(act(protectedStores,'assign','inspect'),protectedStores);
  const freed=act(protectedStores,'watch','none');assert.equal(used(freed),1);assert.equal(freed.crew.supplies,1);
  assert.equal(used(act(freed,'assign','inspect')),2);assert.equal(protectedStores.watch,'orin');
});
test('a council choice is required; guard-only orders are allowed and count no other work',()=>{
  const unset=act(plan(),'assign','repair');assert.equal(act(unset,'commit'),unset);
  const guard=committed([],[],'orin');assert.equal(guard.phase,'dispatched');assert.equal(result(guard).unassigned,1);
  assert.match(result(guard).threads[0].status,/Uninspected/);assert.match(result(guard).threads[1].status,/Exposed/);
});
test('challenge requires both conflicting accounts and persists without changing physical outcomes',()=>{
  let state=plan();assert.equal(act(state,'challenge'),state);state=act(state,'read','report');assert.equal(act(state,'challenge'),state);
  state=act(state,'read','leader');const challenged=act(state,'challenge');assert.equal(challenged.challenged,true);
  assert.deepEqual(restore(JSON.stringify(challenged)),challenged);
  const end=s=>act(act(act(act(s,'watch','none'),'assign','repair'),'commit'),'dawn');
  assert.match(result(end(challenged)).context,/admitted/);assert.match(result(end(state)).context,/did not obtain/);
  assert.deepEqual(result(end(challenged)).events,result(end(state)).events);
  assert.equal(act(end(state),'challenge').challenged,false);
});
test('watching Orin prevents his attempt, while free Orin creates an escort cost even after repair or inspection',()=>{
  for(const [watch,tasks]of [['orin',[]],['orin',['inspect']],['orin',['supplies']],['sera',[]],['sera',['inspect']],['sera',['supplies']],['none',['inspect']],['none',['repair']],['none',['supplies']],['none',['inspect','supplies']]]){
    const end=act(committed(tasks,[],watch),'dawn'),out=result(end);
    assert.deepEqual(restore(JSON.stringify(end)),end);assert.ok(used(end)<=2);
    assert.equal(out.availableTomorrow,watch==='orin'?2:1);
    assert.equal(out.threads.some(t=>t.name==='The injured traveler'),watch!=='orin');
    assert.match(out.events[1].text,watch==='orin'?/guard stopped Orin/:/turned an ankle/);
    assert.equal(act(end,'watch','none'),end);assert.equal(act(end,'read','leader'),end);
    assert.match(out.unresolved,/No wolf identity/);
  }
});
test('confining Sera produces a specific witnessed-hearing obligation without declaring guilt',()=>{
  const out=result(act(committed(['supplies'],[],'sera'),'dawn'));
  assert.match(out.threads[3].status,/Witness required/);assert.match(out.threads[3].detail,/confined me/);
  assert.match(out.threads[4].next,/Escort/);assert.match(out.unresolved,/not proof/);
});
test('non-string watch values cannot restore contradictory custody and injury outcomes',()=>{
  const dawn=act(committed(['supplies'],[],'orin'),'dawn');
  for(const watch of [['orin'],['sera'],['none'],{},1,true])assert.equal(restore(JSON.stringify({...dawn,watch})),null);
});
test('completed legacy nights retain their outcomes, with no retroactive council incident',()=>{
  for(const phase of ['dispatched','dawn']){
    const old={version:1,phase,seen:['map','report'],crew:{inspect:0,repair:2,supplies:0}};
    const saved=restore(JSON.stringify(old));assert.deepEqual(saved,old);
    const out=result(act(saved,'dawn'));assert.equal(out.threads.length,3);assert.equal(out.events,undefined);
    assert.equal(out.availableTomorrow,undefined);assert.match(out.context,/old map beside the new report/);
    assert.equal(act(saved,'watch','orin'),saved);
  }
});
test('legacy plans keep allocations but changed testimony is unread and new council decision is explicit',()=>{
  const old={version:1,phase:'planning',seen:['map','report'],crew:{inspect:1,repair:0,supplies:1}};
  const migrated=restore(JSON.stringify(old));assert.equal(migrated.version,2);assert.deepEqual(migrated.crew,old.crew);
  assert.deepEqual(migrated.seen,['map']);assert.equal(migrated.watch,null);assert.equal(migrated.challenged,false);
  assert.equal(act(migrated,'commit'),migrated);assert.deepEqual(restore(JSON.stringify(migrated)),migrated);
});
