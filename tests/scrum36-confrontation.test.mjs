import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,act,restore,result,morningCapacity,used} from '../public/wild/portrait-proof/clearing-state.js';
import {PLANS,sceneLine,proposedOrders,confirmOrders,aftermathLine} from '../public/wild/portrait-proof/confrontation.js';
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

test('morning reactions distinguish restraint from injury and preserve Sera witness boundary',()=>{
  const orin=act(confirmOrders(heard(),'holdOrin'),'dawn');
  const sera=act(confirmOrders(heard(),'holdSera'),'dawn');
  assert.match(aftermathLine('morning-orin',orin).line,/No family went/);
  assert.doesNotMatch(aftermathLine('morning-orin',orin).line,/traveler turned an ankle/);
  assert.match(aftermathLine('morning-orin',sera).line,/traveler turned an ankle/);
  assert.match(aftermathLine('morning-sera',sera).line,/will not give another field briefing without a witness/);
  assert.match(aftermathLine('morning-work',sera).note,/Only one remains/);
  assert.match(aftermathLine('morning-work',orin).note,/Both workers are available/);
});
test('morning report uses completed night work, not pending morning assignments',()=>{
  let repaired=act(act(confirmOrders(heard(),'repair'),'dawn'),'morning');
  repaired=act(repaired,'morning-assign','check');
  const line=aftermathLine('morning-work',repaired);
  assert.match(line.line,/reset the anchor/);assert.match(line.line,/No one has load-checked/);
  assert.match(line.line,/stores are still exposed/);
  let stores=act(act(planning(),'watch','orin'),'assign','supplies');
  stores=act(act(stores,'commit'),'dawn');
  assert.match(aftermathLine('morning-work',stores).line,/No worker examined/);
  assert.match(aftermathLine('morning-work',stores).line,/stores were moved above the water/);
});
test('morning dialogue never invents an admission or adds knowledge on replay',()=>{
  for(const challenged of [false,true]){
    let state=challenged?act(heard(),'challenge'):heard();
    state=act(confirmOrders(state,'holdOrin'),'dawn');
    const before=JSON.stringify(state),sera=aftermathLine('morning-sera',state).line;
    assert.match(sera,challenged?/admitted giving/:/still denies/);
    for(let replay=0;replay<3;replay++)for(const beat of ['morning-orin','morning-sera','morning-work'])assert.ok(sceneLine(beat,state));
    assert.equal(JSON.stringify(state),before);assert.deepEqual(restore(before),state);
  }
});
test('aftermath is unavailable before dawn, for legacy saves, and outside its phase',()=>{
  for(const state of [fresh(),heard(),confirmOrders(heard(),'repair'),{...act(confirmOrders(heard(),'repair'),'dawn'),version:1}]){
    assert.equal(aftermathLine('morning-orin',state),null);assert.equal(aftermathLine('noon-orin',state),null);
  }
  let morning=act(act(confirmOrders(heard(),'repair'),'dawn'),'morning');
  assert.equal(aftermathLine('noon-orin',morning),null);
  assert.equal(aftermathLine('morning-orin',act(morning,'morning-commit')),null);
});
test('noon reacts to completed clearance, does not heal injury or erase custody',()=>{
  let state=act(act(confirmOrders(heard(),'repair'),'dawn'),'morning');
  state=act(state,'morning-assign','check');
  assert.equal(aftermathLine('noon-orin',state),null);
  state=act(act(state,'morning-commit'),'noon');
  const before=JSON.stringify(state),line=aftermathLine('noon-orin',state).line;
  assert.match(line,/open that route for supervised passage/);assert.match(line,/does not undo the injury/);
  assert.match(aftermathLine('noon-sera',state).line,/stores are still exposed/);
  assert.match(aftermathLine('noon-sera',state).line,/not had the witnessed hearing/);
  assert.equal(aftermathLine('morning-orin',state),null);assert.equal(JSON.stringify(state),before);
});
test('Sera only gives new hearing testimony after a completed hearing, retaining confinement memory',()=>{
  for(const hearing of [false,true]){
    let state=act(act(confirmOrders(act(heard(),'challenge'),'holdSera'),'dawn'),'morning');
    if(hearing)state=act(state,'morning-assign','hearing');
    state=act(act(state,'morning-commit'),'noon');
    const sera=aftermathLine('noon-sera',state);
    if(hearing){assert.match(sera.line,/no one said when to restore/);assert.match(sera.line,/did not erase the night you held me/);}
    else{assert.match(sera.line,/still withholding/);assert.doesNotMatch(sera.line,/when to restore/);assert.match(sera.note,/Workers’ record/);}
    assert.match(aftermathLine('noon-orin',state).line,/anchor still needs a pair/);
  }
});
