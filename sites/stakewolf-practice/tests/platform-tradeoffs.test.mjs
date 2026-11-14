import test from 'node:test';
import assert from 'node:assert/strict';
import {createCouncil,councilAct,councilView} from '../dist/council.mjs';
import {platformDecisionLens,platformOpportunityCosts} from '../dist/platform-tradeoffs.mjs';
import {buildCouncilCoaching} from '../dist/council-coaching.mjs';
import {councilMarkup} from '../dist/council-view.mjs';
import {STORAGE_KEY,createSavedCouncil,loadSavedCouncils} from '../dist/council-saves.mjs';

// SCRUM-38 independent QA: follow real transitions, then check independently
// reconstructed alternatives. These checks do not establish learning outcomes.
const variants=['original','b','c'];
const routes=['versioned','readiness','narrow'];
const promiseIds=['retirement','rollback','customer'];
const responseIds={versioned:['parser','maintenance'],readiness:['parser','pilot'],narrow:['adapter','legacy']};
const act=(s,type,fields={})=>councilAct(s,{type,...fields});
function plan(variant='original',route='versioned',opened=[],promises=[]) {
  let s=createCouncil('systems',variant);
  for(const recordId of opened)s=act(s,'investigate',{recordId});
  s=act(s,'propose',{proposalId:route});
  for(const commitmentId of promises)s=act(s,'promise',{commitmentId});
  return s;
}
function finish(s,work=[]) {
  s=act(s,'commit');
  for(const workId of work)s=act(s,'allocate',{workId});
  return act(s,'finish');
}
const text=value=>JSON.stringify(value);
const section=(report,id)=>report.sections.find(row=>row.id===id);
const metadata={id:'qa-platform',completedAt:'2026-11-14T18:00:00.000Z',origin:'general'};

test('decision guidance is scoped to a selected Platform approach; comparisons wait for the debrief',()=>{
  assert.equal(platformDecisionLens(councilView(createCouncil('systems'))),null);
  for(const phase of ['council','aftermath','debrief']) {
    let s=act(createCouncil('accessibility'),'propose',{proposalId:'repair'});
    if(phase!=='council')s=act(s,'commit');
    if(phase==='debrief')s=act(s,'finish');
    assert.equal(platformDecisionLens(councilView(s)),null);
    assert.equal(platformOpportunityCosts(s),null);
    const markup=councilMarkup(councilView(s),'practice');
    assert.doesNotMatch(markup,/data-council="systems"/);
    if(phase==='council')assert.match(markup,/data-council="accessibility"/);
    else assert.doesNotMatch(markup,/YOUR DECISION IN CONTEXT/);
  }
  const s=plan();
  assert.equal(platformOpportunityCosts(s),null);
  assert.equal(platformOpportunityCosts(act(s,'commit')),null);
});

test('all nine Platform routes explain a distinct benefit, cost and reconsideration condition',()=>{
  const lenses=[];
  for(const variant of variants)for(const route of routes) {
    const lens=platformDecisionLens(councilView(plan(variant,route)));
    assert.ok(lens.protects.length>20 && lens.cost.length>20 && lens.reconsider.length>20);
    assert.equal(lens.evidence.length,3);
    assert.ok(lens.evidence.every(row=>!row.opened));
    lenses.push(text([lens.protects,lens.cost,lens.reconsider]));
  }
  assert.equal(new Set(lenses).size,9);
});

test('unopened record guidance stays generic; opened contract guidance respects each situation',()=>{
  const unopened=variants.map(variant=>platformDecisionLens(councilView(plan(variant,'narrow'))).evidence);
  for(let i=0;i<3;i++)assert.equal(new Set(unopened.map(rows=>rows[i].detail)).size,1);
  const contracts=variants.map(variant=>platformDecisionLens(councilView(plan(variant,'narrow',['contract']))).evidence.find(row=>row.recordId==='contract'));
  assert.ok(contracts.every(row=>row.opened));
  assert.match(contracts[0].detail,/integration outcome/);
  assert.match(contracts[1].detail,/callback outcome by a date/);
  assert.match(contracts[2].detail,/written amendment/);
  assert.doesNotMatch(contracts[0].detail,/signed specification names the response version/);
  for(const variant of variants)for(const route of routes) {
    const s=plan(variant,route,['contract']);
    const result=text(platformDecisionLens(councilView(s)));
    const final=councilView(finish(s));
    for(const person of final.debrief.reveals)assert.ok(!result.includes(person.objective));
    assert.doesNotMatch(result,/rejects unknown response fields|loses the deduplication token|silently rounded/);
  }
});

test('live guidance distinguishes capacity held for response from fully committed capacity',()=>{
  const open=councilMarkup(councilView(plan()),'practice');
  const one=councilMarkup(councilView(plan('original','readiness',[],['retirement','rollback'])),'practice');
  const full=councilMarkup(councilView(plan('original','readiness',[],promiseIds)),'practice');
  assert.match(open,/4 units unreserved/);
  assert.match(one,/1 unit unreserved/);
  assert.match(one,/Only one unit remains/);
  assert.match(full,/0 units unreserved/);
  assert.match(full,/No additional response work can fit/);
});

test('a unanimous bargain can exhaust the response budget without being graded as success',()=>{
  const s=finish(plan('original','readiness',[],promiseIds));
  assert.equal(councilView(s).stakeholders.filter(p=>p.support==='supports').length,3);
  const opportunity=platformOpportunityCosts(s);
  assert.deepEqual(opportunity.alternatives.map(row=>row.required),[2,3]);
  const report=buildCouncilCoaching(s);
  assert.match(section(report,'negotiation').summary,/left 0/);
  assert.match(text(report),/At least one task must carry forward/);
  assert.match(text(report),/Support describes a negotiated position, not decision quality/);
  assert.ok(opportunity.alternatives.some(row=>row.swaps.some(swap=>swap.supportChanges.length)));
});

test('deliberate affordable deferral reports no sacrifice and does not force spending',()=>{
  for(const variant of variants) {
    const s=finish(plan(variant,'narrow'));
    const result=platformOpportunityCosts(s);
    assert.match(result.unavoidable,/two response tasks need 5 units/);
    for(const task of result.alternatives) {
      assert.equal(task.required,0);
      assert.equal(task.swaps.length,1);
      const swap=task.swaps[0];
      assert.deepEqual(swap.removedPromises,[]);
      assert.deepEqual(swap.removedWork,[]);
      assert.equal(swap.freed,0);
      assert.equal(swap.remaining,4-task.cost);
      assert.match(swap.explanation,/Leaving it deferred may be deliberate/);
      assert.ok(swap.explanation.includes(councilView(s).debrief.deferred.find(row=>row.id===task.deferredId).consequence));
    }
  }
});

test('risk investigation and operating coverage paths preserve their distinct residual costs',()=>{
  for(const variant of variants) {
    const parser=finish(plan(variant,'versioned',['consumers'],['retirement']),['parser']);
    const operations=finish(plan(variant,'versioned',['consumers'],['retirement']),['maintenance']);
    const parserFeedback=text(buildCouncilCoaching(parser));
    const operationsFeedback=text(buildCouncilCoaching(operations));
    const pv=councilView(parser),ov=councilView(operations);
    assert.ok(parserFeedback.includes(pv.debrief.deferred[0].detail));
    assert.ok(operationsFeedback.includes(ov.debrief.deferred[0].detail));
    assert.notEqual(pv.debrief.deferred[0].id,ov.debrief.deferred[0].id);
    for(const state of [parser,operations]) {
      const option=platformOpportunityCosts(state).alternatives[0];
      assert.ok(option.swaps.some(swap=>swap.removedWork.length));
    }
  }
});

test('every suggested exchange executes within capacity, is minimal and predicts actual support changes',()=>{
  let checked=0;
  for(const variant of variants)for(const route of routes)for(let mask=0;mask<8;mask++)for(let workMask=0;workMask<4;workMask++) {
    const promises=promiseIds.filter((_,i)=>mask&(1<<i));
    const selectedWork=responseIds[route].filter((_,i)=>workMask&(1<<i));
    const s=finish(plan(variant,route,['consumers','contract'],promises),selectedWork);
    // Some requested allocations are intentionally refused by the engine.
    const view=councilView(s),before=text(s);
    const opportunity=platformOpportunityCosts(s);
    assert.equal(text(s),before);
    for(const alternative of opportunity.alternatives) {
      assert.ok(alternative.swaps.length>0 && alternative.swaps.length<=2);
      const unused=6-view.aftermath.cost;
      assert.equal(alternative.required,Math.max(0,alternative.cost-unused));
      for(const swap of alternative.swaps) {
        const removed=[...view.commitments.filter(p=>swap.removedPromises.includes(p.id)),...view.debrief.fulfilled.filter(w=>swap.removedWork.includes(w.id))];
        assert.equal(removed.length,swap.removedPromises.length+swap.removedWork.length);
        assert.equal(swap.freed,removed.reduce((sum,row)=>sum+row.cost,0));
        for(const row of removed)assert.ok(swap.freed-row.cost<alternative.required,'No removable surplus task');
        const remainingPromises=promises.filter(id=>!swap.removedPromises.includes(id));
        const replayStart=plan(variant,route,['consumers','contract'],remainingPromises);
        const replayWork=[...s.workIds.filter(id=>!swap.removedWork.includes(id)),alternative.deferredId];
        const replay=finish(replayStart,replayWork),after=councilView(replay);
        assert.deepEqual([...replay.workIds].sort(),[...replayWork].sort());
        assert.equal(swap.remaining,6-after.aftermath.cost);
        assert.ok(after.aftermath.cost<=6);
        const changes=view.stakeholders.flatMap(person=>{
          const next=after.stakeholders.find(row=>row.id===person.id);
          return next.support===person.support?[]:[{id:person.id,name:person.name,before:person.support,after:next.support}];
        });
        assert.deepEqual(swap.supportChanges,changes);
        if(removed.length)assert.match(swap.explanation,/Replay comparison:.*Promises are locked/);
        checked++;
      }
    }
  }
  assert.ok(checked>300);
});

test('all Platform completions remain saveable and use only the existing three feedback sections',()=>{
  for(const variant of variants)for(const route of routes)for(let mask=0;mask<8;mask++)for(const work of [[],...responseIds[route].map(id=>[id])]) {
    const s=finish(plan(variant,route,['consumers','contract'],promiseIds.filter((_,i)=>mask&(1<<i))),work);
    const questions=[{speakerId:'platform',question:'What is unknown?',kind:'answer',phase:'council'},{speakerId:'account',question:'What is the cost?',kind:'answer',phase:'aftermath'}];
    const saved=createSavedCouncil(s,{questions},metadata);
    assert.ok(saved,`${variant}/${route}/${mask}/${work}`);
    assert.deepEqual(saved.feedback.sections.map(row=>row.id),['questioning','negotiation','consequences']);
    assert.ok(saved.feedback.sections.every(row=>row.observations.length<=12));
    assert.equal(saved.caseVersion,variant==='original'?'council-v1':`council-v1:${variant}`);
  }
});

test('loading an earlier saved report preserves its original feedback instead of regenerating guidance',()=>{
  const saved=structuredClone(createSavedCouncil(finish(plan()),{},metadata));
  saved.feedback.sections[2].observations=['Earlier feedback retained exactly.'];
  const raw=JSON.stringify({schemaVersion:1,items:[saved]});
  const storage={getItem(key){assert.equal(key,STORAGE_KEY);return raw;},setItem(){assert.fail('Read must not overwrite history');}};
  const loaded=loadSavedCouncils(storage);
  assert.equal(loaded.error,null);
  assert.deepEqual(loaded.items[0].feedback,saved.feedback);
});
