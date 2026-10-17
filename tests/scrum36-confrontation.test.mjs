import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,act,restore,result,morningCapacity,used} from '../public/wild/portrait-proof/clearing-state.js';
import {PLANS,sceneLine,proposedOrders,confirmOrders} from '../public/wild/portrait-proof/confrontation.js';
const planning=()=>act(fresh(),'start');
const heard=()=>act(act(planning(),'read','leader'),'read','report');

test('preview replaces an existing full plan without mutating it or committing',()=>{
  const original=act(act(planning(),'watch','none'),'assign','repair');
  const before=JSON.stringify(original),preview=proposedOrders(original,'holdOrin');
  assert.equal(JSON.stringify(original),before);
  assert.equal(preview.phase,'planning');assert.equal(preview.watch,'orin');
  assert.deepEqual(preview.crew,{inspect:1,repair:0,supplies:0});assert.equal(used(preview),2);
});
test('holding Orin prevents the attempted passage but leaves repair and stores pending',()=>{
  const committed=confirmOrders(heard(),'holdOrin'),dawn=act(committed,'dawn'),out=result(dawn);
  assert.equal(committed.phase,'dispatched');assert.equal(morningCapacity(dawn),2);
  assert.match(out.events[1].text,/No family entered/);
  assert.equal(out.threads[0].status,'Inspected · repair pending');
  assert.match(out.threads[1].status,/Exposed/);
  assert.deepEqual(restore(JSON.stringify(dawn)),dawn);
});
test('holding Sera leaves unsafe passage, escort cost and witnessed-hearing obligation',()=>{
  const dawn=act(confirmOrders(heard(),'holdSera'),'dawn'),out=result(dawn);
  assert.equal(morningCapacity(dawn),1);assert.match(out.events[1].text,/turned an ankle/);
  assert.match(out.threads.find(t=>t.name==='The council’s trust').detail,/witness at every/);
});
test('repair uses both workers and does not prevent injury or imply clearance',()=>{
  const dawn=act(confirmOrders(heard(),'repair'),'dawn'),out=result(dawn);
  assert.equal(used(dawn),2);assert.equal(dawn.crew.repair,2);assert.equal(dawn.watch,'none');
  assert.equal(morningCapacity(dawn),1);assert.match(out.threads[0].status,/inspection pending/);
  assert.match(out.events[1].text,/turned an ankle/);
});
test('committed/legacy states and invalid choices cannot acquire replacement orders',()=>{
  for(const state of [fresh(),confirmOrders(heard(),'repair'),{...heard(),version:1}]){
    assert.equal(proposedOrders(state,'holdOrin'),null);assert.equal(confirmOrders(state,'holdOrin'),state);
  }
  for(const key of ['invalid','__proto__','constructor',null])assert.equal(confirmOrders(heard(),key).phase,'planning');
});
test('pressing Orin requires both accounts and preserves admission on reload and confirmation',()=>{
  assert.equal(act(planning(),'challenge').challenged,false);
  const admitted=act(heard(),'challenge'),order=confirmOrders(admitted,'holdOrin');
  assert.equal(restore(JSON.stringify(order)).challenged,true);
  assert.match(sceneLine('opening',admitted).line,/I told her/);
  assert.doesNotMatch(sceneLine('opening',admitted).line,/I gave no such order/);
  assert.equal(confirmOrders(order,'holdSera'),order);
});
test('script branches end in a decision and reveal no secret allegiance',()=>{
  for(const first of ['opening','admission','limits']){
    let beat=first,steps=0;
    while(!['intervene','decision'].includes(beat)){
      const line=sceneLine(beat,heard());assert.ok(line);assert.ok(['orin','sera'].includes(line.speaker));
      beat=line.next;assert.ok(++steps<8);
    }
  }
  for(const order of Object.values(PLANS)){assert.ok(order.summary);assert.ok(order.risk);}
});
