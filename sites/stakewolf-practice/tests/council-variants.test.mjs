import test from 'node:test';
import assert from 'node:assert/strict';
import {createCouncil,createFreshCouncil,councilVariantIds,councilView,councilAct} from '../dist/council.mjs';

const act=(s,type,fields={})=>councilAct(s,{type,...fields});
const plan=(topic,variantId,proposalId,opened=[],commitmentIds=[])=>{
  let s=createCouncil(topic,variantId);
  for(const recordId of opened) s=act(s,'investigate',{recordId});
  for(const commitmentId of commitmentIds) s=act(s,'promise',{commitmentId});
  return act(s,'propose',{proposalId});
};
const ended=s=>act(act(s,'commit'),'finish');
const fixtures={
  accessibility:{records:['audit','focus','queue'],proposals:['repair','fallback','replace'],promises:['showcase','verification','triage'],responses:[['announce','interim'],['fallback-verify','new-errors'],['interim','component-errors']]},
  systems:{records:['consumers','contract','canary'],proposals:['versioned','readiness','narrow'],promises:['retirement','rollback','customer'],responses:[['parser','maintenance'],['parser','pilot'],['adapter','legacy']]}
};

test('variant identity is explicit, neutral, stable and backwards compatible',()=>{
  for(const topic of Object.keys(fixtures)) {
    assert.deepEqual(councilVariantIds(topic),['original','b','c']);
    assert.ok(Object.isFrozen(councilVariantIds(topic)));
    assert.deepEqual(createCouncil(topic),createCouncil(topic,'original'));
    const legacy={...createCouncil(topic)};
    delete legacy.variantId;
    assert.deepEqual(councilView(legacy),councilView(createCouncil(topic)));
    assert.deepEqual(act(legacy,'replay'),createCouncil(topic));
    for(const [i,id] of councilVariantIds(topic).entries()) {
      const s=plan(topic,id,fixtures[topic].proposals[0],[fixtures[topic].records[0]],[fixtures[topic].promises[0]]);
      const v=councilView(s);
      assert.equal(v.variantId,id);
      assert.equal(v.variantLabel,`Situation ${['A','B','C'][i]}`);
      assert.deepEqual(councilView(s),councilView(structuredClone(s)));
      assert.equal(ended(s).variantId,id);
      assert.deepEqual(act(s,'replay'),createCouncil(topic,id));
      assert.deepEqual(act(ended(s),'replay'),createCouncil(topic,id));
    }
    for(const id of [null,'a','other','__proto__',0]) {
      assert.throws(()=>createCouncil(topic,id),RangeError);
      const invalid={...createCouncil(topic),variantId:id};
      assert.throws(()=>councilView(invalid),TypeError);
      assert.equal(act(invalid,'replay'),invalid);
    }
  }
  assert.throws(()=>councilVariantIds('__proto__'),RangeError);
  assert.throws(()=>createFreshCouncil('unknown'),RangeError);
});

test('fresh situations sample only once and never immediately repeat a known situation',()=>{
  for(const topic of Object.keys(fixtures)) for(const previous of councilVariantIds(topic)) {
    const expected=councilVariantIds(topic).filter(id=>id!==previous);
    let calls=0;
    const first=createFreshCouncil(topic,previous,()=>{calls++;return 0;});
    assert.equal(calls,1);
    assert.equal(first.variantId,expected[0]);
    assert.equal(createFreshCouncil(topic,previous,()=>0.499999).variantId,expected[0]);
    assert.equal(createFreshCouncil(topic,previous,()=>0.5).variantId,expected[1]);
    assert.equal(createFreshCouncil(topic,previous,()=>0.999999).variantId,expected[1]);
    assert.deepEqual(first,createCouncil(topic,expected[0]));
  }
  assert.equal(createFreshCouncil('accessibility',undefined,()=>0).variantId,'original');
  assert.equal(createFreshCouncil('accessibility',undefined,()=>0.5).variantId,'b');
  assert.equal(createFreshCouncil('accessibility',undefined,()=>0.99).variantId,'c');
  for(const value of [-1,1,NaN,Infinity,'0.5',null]) assert.throws(()=>createFreshCouncil('systems','b',()=>value),RangeError);
  assert.throws(()=>createFreshCouncil('systems','b',0.5),TypeError);
});

for(const [topic,f] of Object.entries(fixtures)) {
  test(`${topic}: each authored situation changes claims, facts and private objectives without early disclosure`,()=>{
    const variants=councilVariantIds(topic).map(id=>{
      const state=createCouncil(topic,id), view=councilView(state);
      const records=f.records.map(recordId=>councilView(act(state,'investigate',{recordId})).records.find(r=>r.id===recordId).text);
      const final=councilView(ended(plan(topic,id,f.proposals[0])));
      const council=councilView(plan(topic,id,f.proposals[0],f.records.slice(0,2),f.promises));
      const aftermath=councilView(act(plan(topic,id,f.proposals[0],f.records.slice(0,2),f.promises),'commit'));
      assert.ok(view.records.every(r=>!Object.hasOwn(r,'text')));
      assert.ok(view.stakeholders.every(p=>!Object.hasOwn(p,'objective')));
      for(const reveal of final.debrief.reveals) {
        assert.ok(!JSON.stringify(view).includes(reveal.objective));
        assert.ok(!JSON.stringify(council).includes(reveal.objective));
        assert.ok(!JSON.stringify(aftermath).includes(reveal.objective));
        assert.equal(reveal.role,view.stakeholders.find(p=>p.id===reveal.id).role);
      }
      const opened=act(state,'investigate',{recordId:f.records[0]});
      const later=act(opened,'investigate',{recordId:f.records[1]});
      assert.equal(councilView(later).records[0].text,records[0]);
      assert.equal(act(later,'investigate',{recordId:f.records[2]}),later);
      const mutation=councilView(final.phase==='debrief'?ended(plan(topic,id,f.proposals[0])):state);
      mutation.debrief.reveals[0].objective='mutated';
      mutation.aftermath.work[0].detail='mutated';
      assert.ok(!JSON.stringify(councilView(ended(plan(topic,id,f.proposals[0])))).includes('mutated'));
      return {view,records,final};
    });
    for(let i=0;i<3;i++) {
      assert.equal(new Set(variants.map(v=>v.view.stakeholders[i].claim)).size,3);
      assert.equal(new Set(variants.map(v=>v.records[i])).size,3);
      assert.equal(new Set(variants.map(v=>v.final.debrief.reveals[i].objective)).size,3);
    }
  });

  for(const id of ['original','b','c']) test(`${topic}/${id}: every route and promise set preserves capacity and truthful work ledgers`,()=>{
    const first=createCouncil(topic,id), view=councilView(first);
    assert.deepEqual(view.records.map(r=>r.id),f.records);
    assert.deepEqual(view.proposals.map(p=>p.id),f.proposals);
    assert.deepEqual(view.commitments.map(c=>c.id),f.promises);
    assert.deepEqual(view.commitments.map(c=>c.cost),[1,2,1]);
    for(const [index,proposalId] of f.proposals.entries()) for(let mask=0;mask<8;mask++) {
      const promises=f.promises.filter((_,i)=>mask&(1<<i));
      const s=plan(topic,id,proposalId,[],promises);
      const before=JSON.stringify(s);
      const committed=act(s,'commit'), v=councilView(committed);
      const reserved=2+view.commitments.filter(c=>promises.includes(c.id)).reduce((sum,c)=>sum+c.cost,0);
      assert.equal(v.aftermath.cost,reserved);
      assert.equal(v.aftermath.work.filter(w=>w.locked).length,1+promises.length);
      assert.deepEqual(v.aftermath.work.filter(w=>!w.locked).map(w=>w.id),f.responses[index]);
      assert.deepEqual(v.aftermath.work.filter(w=>!w.locked).map(w=>w.cost),[2,3]);
      for(const w of v.aftermath.work.filter(w=>!w.locked)) {
        const allocated=act(committed,'allocate',{workId:w.id});
        if(reserved+w.cost>6) assert.equal(allocated,committed);
        else assert.ok(allocated.workIds.includes(w.id));
        for(const other of f.responses[index]) {
          const both=act(allocated,'allocate',{workId:other});
          assert.ok(councilView(both).aftermath.cost<=6);
          assert.ok(both.workIds.length<=1);
        }
        const done=act(allocated,'finish'), final=councilView(done);
        assert.ok(final.debrief.deferred.length>=1);
        assert.equal(final.debrief.fulfilled.reduce((sum,w)=>sum+w.cost,0),final.aftermath.cost);
        assert.ok(final.debrief.fulfilled.every(w=>w.detail===w.outcome));
        assert.ok(final.debrief.deferred.every(w=>w.detail===w.consequence));
        assert.equal(final.debrief.fulfilled.filter(w=>w.origin==='commitment').length,promises.length);
        assert.equal(done.variantId,id);
        assert.equal(act(done,'finish'),done);
        assert.deepEqual(act(done,'replay'),createCouncil(topic,id));
      }
      assert.equal(JSON.stringify(s),before);
    }
  });
}

test('new support rules change actual bargaining, not just stakeholder prose',()=>{
  // Authored paths chosen independently from the implementation's conditions.
  const paths=[
    ['accessibility','b','fallback',['focus'],[],'engineering','supports','conditional'],
    ['accessibility','b','replace',[],[],'engineering','opposes','supports'],
    ['accessibility','b','repair',[],['triage'],'support','supports','conditional'],
    ['accessibility','b','repair',[],['showcase'],'design','conditional','supports'],
    ['accessibility','c','fallback',['audit'],[],'engineering','supports','conditional'],
    ['accessibility','c','repair',['focus'],['verification'],'engineering','conditional','supports'],
    ['accessibility','c','repair',['focus'],['verification'],'design','supports','conditional'],
    ['accessibility','c','fallback',[],['triage'],'support','opposes','supports'],
    ['systems','b','narrow',['contract'],['retirement'],'platform','supports','opposes'],
    ['systems','b','versioned',['consumers'],['rollback'],'reliability','supports','opposes'],
    ['systems','b','versioned',['consumers'],['customer'],'account','supports','conditional'],
    ['systems','c','versioned',['consumers'],['retirement'],'platform','opposes','supports'],
    ['systems','c','narrow',['contract'],['retirement'],'platform','supports','opposes'],
    ['systems','c','narrow',['contract'],['customer'],'account','opposes','supports'],
    ['systems','c','readiness',[],['rollback'],'reliability','conditional','supports']
  ];
  for(const [topic,id,p,records,promises,person,expected,original] of paths) {
    const standing=variant=>councilView(plan(topic,variant,p,records,promises)).stakeholders.find(s=>s.id===person).support;
    assert.equal(standing(id),expected,`${topic}/${id}/${p}/${person}`);
    assert.equal(standing('original'),original,`original comparison ${topic}/${p}/${person}`);
  }
});

test('variant evidence and every route’s consequences stay in the authored situation',()=>{
  const checks=[
    {topic:'accessibility',id:'b',source:'focus',fact:/Focus reaches Save.*session expires/,update:/expiry warning is not announced/,work:/session|recovery|expiry|warning/i,stale:/focus trap|two save failures|contrast issues/},
    {topic:'accessibility',id:'c',source:'audit',fact:/previous route passed.*400% zoom/,update:/longer error text covers/,work:/layout|translated|language|route|label/i,stale:/focus trap|unannounced save-error|two save failures/},
    {topic:'systems',id:'b',source:'consumers',fact:/Both external owners confirmed.*parse/,update:/executing the same callback twice/,work:/callback|retry|adapter|duplicate|legacy/i,stale:/rejects unknown response fields|rejecting parser|proposal email/},
    {topic:'systems',id:'c',source:'contract',fact:/explicitly names the new response version.*written amendment/,update:/decimal amounts silently rounded/,work:/decimal|numeric|amount|version|adapter|legacy/i,stale:/rejects unknown response fields|rejecting parser|proposal email/}
  ];
  for(const x of checks) {
    const opened=councilView(act(createCouncil(x.topic,x.id),'investigate',{recordId:x.source}));
    assert.match(opened.records.find(r=>r.id===x.source).text,x.fact);
    for(const proposalId of fixtures[x.topic].proposals) {
      const s=plan(x.topic,x.id,proposalId,[],fixtures[x.topic].promises);
      const v=councilView(ended(s));
      assert.match(v.aftermath.summary,x.update);
      assert.doesNotMatch(JSON.stringify(v),x.stale);
      for(const w of v.aftermath.work.filter(w=>w.origin!=='commitment')) {
        assert.match(`${w.title} ${w.detail} ${w.outcome}`,x.work);
      }
    }
  }
});
