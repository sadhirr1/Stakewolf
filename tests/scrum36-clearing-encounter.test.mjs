import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,act,used,restore,result} from '../public/wild/portrait-proof/clearing-state.js';

const plan=()=>act(fresh(),'start');
function committed(tasks,records=[]){let state=plan();for(const key of records)state=act(state,'read',key);for(const key of tasks)state=act(state,'assign',key);return act(state,'commit');}

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
    assert.deepEqual(result(without).threads,result(withEvidence).threads);assert.notEqual(result(without).context,result(withEvidence).context);
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
  const bad=[{...fresh(),version:2},{...plan(),seen:['map','map']},{...plan(),seen:['__proto__']},{...plan(),crew:{inspect:-1,repair:0,supplies:0}},{...plan(),crew:{inspect:1,repair:2,supplies:1}},{...plan(),crew:{inspect:1,repair:1,supplies:0}},{...plan(),crew:{inspect:1,repair:0}},{...fresh(),phase:'dawn'},{...fresh(),seen:['report']},{...fresh(),phase:'hacked'}];
  for(const state of bad)assert.equal(restore(JSON.stringify(state)),null);
});
