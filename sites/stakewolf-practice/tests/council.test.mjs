import test from 'node:test';
import assert from 'node:assert/strict';
import {councilTopics,createCouncil,councilView,councilAct} from '../dist/council.mjs';

const act = (s,type,fields={}) => councilAct(s,{type,...fields});
const promise = (s,id) => act(s,'promise',{commitmentId:id});
const investigate = (s,id) => act(s,'investigate',{recordId:id});
const propose = (s,id) => act(s,'propose',{proposalId:id});
const allocate = (s,id) => act(s,'allocate',{workId:id});
const support = (s,id) => councilView(s).stakeholders.find(p=>p.id===id).support;
const freeze = value => {
  if (value && typeof value==='object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};
const fixtures = {
  accessibility:{records:['audit','focus','queue'],proposals:['repair','fallback','replace'],promises:['showcase','verification','triage'],responses:{repair:['announce','interim'],fallback:['fallback-verify','new-errors'],replace:['interim','component-errors']},secret:'Retain the simplified design for the scheduled showcase.'},
  systems:{records:['consumers','contract','canary'],proposals:['versioned','readiness','narrow'],promises:['retirement','rollback','customer'],responses:{versioned:['parser','maintenance'],readiness:['parser','pilot'],narrow:['adapter','legacy']},secret:'Retire legacy maintenance before the team’s maintenance review.'}
};

test('supported topics are immutable metadata; unsupported and invalid states fail explicitly',()=>{
  assert.deepEqual(councilTopics.map(c=>c.id),['accessibility','systems']);
  assert.ok(councilTopics.every(c=>c.title && c.description));
  assert.throws(()=>councilTopics[0].title='changed',TypeError);
  for (const topic of ['research','__proto__','toString',undefined]) assert.throws(()=>createCouncil(topic),RangeError);
  for (const state of [null,{}, {...createCouncil('accessibility'),phase:'invented'}, {...createCouncil('systems'),opened:['consumers','contract','canary']}]) {
    assert.equal(councilAct(state,{type:'finish'}),state);
    assert.throws(()=>councilView(state),TypeError);
  }
});

for (const [topic,f] of Object.entries(fixtures)) {
  test(`${topic}: investigation has a hard two-record limit and no ordinary-play motive leakage`,()=>{
    let s=createCouncil(topic);
    let view=councilView(s);
    assert.equal(view.phase,'council');
    assert.equal(view.round,1);
    assert.equal(view.stakeholders.length,3);
    assert.equal(view.investigationRemaining,2);
    assert.equal(view.cost,0);
    assert.equal(view.capacity,6);
    assert.equal(view.canCommit,false);
    assert.equal(view.debrief,null);
    assert.equal(view.aftermath,null);
    assert.ok(view.records.every(r=>!Object.hasOwn(r,'text')));
    assert.ok(!JSON.stringify(view).includes(f.secret));
    assert.ok(view.stakeholders.every(p=>!Object.hasOwn(p,'objective')));
    assert.equal(act(s,'commit'),s);
    assert.equal(investigate(s,'invented'),s);
    s=investigate(s,f.records[0]);
    assert.equal(investigate(s,f.records[0]),s);
    view=councilView(s);
    assert.ok(view.records[0].text);
    assert.ok(!Object.hasOwn(view.records[1],'text'));
    s=investigate(s,f.records[1]);
    assert.equal(councilView(s).investigationRemaining,0);
    assert.equal(investigate(s,f.records[2]),s);
    assert.equal(councilView(s).trace.length,2);
    s=act(propose(s,f.proposals[0]),'commit');
    assert.ok(!JSON.stringify(councilView(s)).includes(f.secret));
    assert.equal(investigate(s,f.records[2]),s);
    assert.equal(promise(s,f.promises[0]),s);
    assert.equal(propose(s,f.proposals[1]),s);
  });

  test(`${topic}: all promises are feasible but leave no capacity for the surprise`,()=>{
    let s=propose(createCouncil(topic),f.proposals[0]);
    for (const id of f.promises) s=promise(s,id);
    assert.equal(councilView(s).cost,6); // Decision 2 + promises 1,2,1.
    assert.equal(councilView(s).canCommit,true);
    s=act(s,'commit');
    assert.equal(councilView(s).aftermath.cost,6);
    assert.equal(councilView(s).aftermath.work.filter(w=>w.locked).length,4);
    for (const workId of f.responses[f.proposals[0]]) assert.equal(allocate(s,workId),s);
    assert.equal(councilView(s).aftermath.canFinish,true);
    s=act(s,'finish');
    const v=councilView(s);
    assert.equal(v.debrief.fulfilled.length,4);
    assert.equal(v.debrief.deferred.length,2);
    assert.ok(v.debrief.summary.includes('3 promised actions were delivered automatically'));
    assert.ok(JSON.stringify(v.debrief.reveals).includes(f.secret));
    assert.ok(v.debrief.deferred.every(w=>w.detail===w.consequence));
    assert.equal(v.debrief.trace.length,2);
    assert.equal(act(s,'finish'),s);
    assert.equal(allocate(s,f.responses[f.proposals[0]][0]),s);
    assert.deepEqual(act(s,'replay'),createCouncil(topic));
  });

  test(`${topic}: each proposal changes carried work, consequences and the response set`,()=>{
    const views=f.proposals.map(id=>councilView(act(propose(createCouncil(topic),id),'commit')));
    assert.equal(new Set(views.map(v=>v.aftermath.summary)).size,3);
    assert.equal(new Set(views.map(v=>v.aftermath.work[0].id)).size,3);
    for (const [index,id] of f.proposals.entries()) {
      const v=views[index];
      assert.deepEqual(v.aftermath.work.filter(w=>!w.locked).map(w=>w.id),f.responses[id]);
      assert.deepEqual(v.aftermath.work.filter(w=>!w.locked).map(w=>w.cost),[2,3]);
      assert.ok(v.aftermath.work.every(w=>w.consequence));
      let s=act(propose(createCouncil(topic),id),'commit');
      const before=councilView(s).aftermath.reactions;
      s=allocate(s,f.responses[id][0]);
      assert.equal(councilView(s).aftermath.cost,4);
      assert.notDeepEqual(councilView(s).aftermath.reactions,before);
      assert.equal(allocate(s,f.responses[id][1]),s); // 2 decision + 2 response + 3 response > 6.
      s=allocate(s,f.responses[id][0]);
      s=allocate(s,f.responses[id][1]);
      assert.equal(councilView(s).aftermath.cost,5);
      s=act(s,'finish');
      assert.equal(councilView(s).debrief.fulfilled.length,2);
      assert.equal(councilView(s).debrief.deferred[0].id,f.responses[id][0]);
    }
  });

  test(`${topic}: reducer and views do not mutate or share writable authored data`,()=>{
    const original=freeze(createCouncil(topic));
    const investigated=investigate(original,f.records[0]);
    const promised=promise(freeze(investigated),f.promises[0]);
    const chosen=propose(freeze(promised),f.proposals[0]);
    const committed=act(freeze(chosen),'commit');
    const allocated=allocate(freeze(committed),f.responses[f.proposals[0]][0]);
    const finished=act(freeze(allocated),'finish');
    assert.equal(original.opened.length,0);
    assert.equal(investigated.commitmentIds.length,0);
    assert.equal(promised.proposalId,null);
    assert.equal(chosen.phase,'council');
    assert.equal(committed.workIds.length,0);
    assert.equal(allocated.phase,'aftermath');
    assert.equal(finished.phase,'debrief');
    const v=councilView(finished);
    v.stakeholders[0].claim='changed';
    v.debrief.reveals[0].objective='changed';
    v.aftermath.work[0].title='changed';
    assert.ok(!JSON.stringify(councilView(finished)).includes('changed'));
    assert.equal(act(original,'unknown'),original);
    assert.equal(councilAct(original,null),original);
    assert.equal(promise(original,'unknown'),original);
    assert.equal(propose(original,'unknown'),original);
    assert.equal(allocate(committed,'unknown'),committed);
    assert.equal(allocate(committed,councilView(committed).aftermath.work[0].id),committed);
  });

  test(`${topic}: all proposal/promise combinations preserve capacity, terminality and deterministic replay`,()=>{
    for (const proposalId of f.proposals) for (let mask=0;mask<8;mask++) {
      let s=propose(createCouncil(topic),proposalId);
      let expectedCost=2;
      f.promises.forEach((id,i)=>{if(mask & (1<<i)){s=promise(s,id);expectedCost += [1,2,1][i];}});
      assert.equal(councilView(s).cost,expectedCost);
      s=act(s,'commit');
      for (const responseId of f.responses[proposalId]) {
        const next=allocate(s,responseId);
        assert.ok(councilView(next).aftermath.cost<=6);
        const ended=act(next,'finish');
        assert.equal(ended.phase,'debrief');
        assert.ok(councilView(ended).debrief.deferred.length>=1);
        assert.deepEqual(councilView(ended),councilView(act(allocate(s,responseId),'finish')));
        assert.deepEqual(act(ended,'replay'),createCouncil(topic));
      }
    }
  });
}

test('accessibility support changes only when the documented proposal, evidence and promise conditions are met',()=>{
  let s=propose(createCouncil('accessibility'),'repair');
  s=promise(s,'verification');
  assert.equal(support(s,'engineering'),'conditional');
  s=investigate(s,'focus');
  assert.equal(support(s,'engineering'),'supports');
  s=promise(s,'verification');
  assert.equal(support(s,'engineering'),'conditional');
  s=propose(s,'replace');
  assert.equal(support(s,'engineering'),'supports');
  assert.equal(support(s,'design'),'opposes');
  s=promise(s,'showcase');
  assert.equal(support(s,'design'),'opposes');
  s=investigate(s,'audit');
  assert.equal(support(s,'design'),'supports');
  let t=promise(propose(createCouncil('accessibility'),'repair'),'triage');
  assert.equal(support(t,'support'),'conditional');
  t=investigate(t,'queue');
  assert.equal(support(t,'support'),'supports');
});

test('systems support changes with commitments, coverage evidence and the chosen route',()=>{
  let s=propose(createCouncil('systems'),'versioned');
  assert.equal(support(s,'reliability'),'opposes');
  s=promise(s,'rollback');
  assert.equal(support(s,'reliability'),'opposes');
  s=investigate(s,'canary');
  assert.equal(support(s,'reliability'),'supports');
  s=promise(s,'retirement');
  assert.equal(support(s,'platform'),'conditional');
  s=investigate(s,'consumers');
  assert.equal(support(s,'platform'),'supports');
  s=propose(s,'narrow');
  assert.equal(support(s,'platform'),'opposes');
  let t=promise(propose(createCouncil('systems'),'narrow'),'customer');
  assert.equal(support(t,'account'),'conditional');
  t=investigate(t,'contract');
  assert.equal(support(t,'account'),'supports');
  let all=propose(createCouncil('systems'),'readiness');
  for (const id of ['retirement','rollback','customer']) all=promise(all,id);
  assert.ok(councilView(all).stakeholders.every(p=>p.support==='supports'));
  assert.equal(councilView(all).cost,6); // Consensus has a visible opportunity cost, not a grade bonus.
});
