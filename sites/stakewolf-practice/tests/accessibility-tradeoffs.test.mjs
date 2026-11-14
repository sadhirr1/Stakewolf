import test from 'node:test';
import assert from 'node:assert/strict';
import {createCouncil,councilAct,councilView} from '../dist/council.mjs';
import {accessibilityDecisionLens} from '../dist/accessibility-tradeoffs.mjs';
import {councilOpportunityCosts} from '../dist/council-opportunity-costs.mjs';
import {platformDecisionLens,platformOpportunityCosts} from '../dist/platform-tradeoffs.mjs';
import {buildCouncilCoaching} from '../dist/council-coaching.mjs';
import {councilMarkup} from '../dist/council-view.mjs';
import {STORAGE_KEY,createSavedCouncil,loadSavedCouncils} from '../dist/council-saves.mjs';

// SCRUM-38 independent QA: actual choices and counterfactual replays. These
// assertions check authored scope, not real-world accessibility certification.
const variants=['original','b','c'],routes=['repair','fallback','replace'];
const promises=['showcase','verification','triage'];
const responseIds={repair:['announce','interim'],fallback:['fallback-verify','new-errors'],replace:['interim','component-errors']};
const act=(s,type,fields={})=>councilAct(s,{type,...fields});
const text=value=>JSON.stringify(value);
function plan(variant='original',route='repair',opened=[],commitments=[]) {
  let s=createCouncil('accessibility',variant);
  for(const recordId of opened)s=act(s,'investigate',{recordId});
  s=act(s,'propose',{proposalId:route});
  for(const commitmentId of commitments)s=act(s,'promise',{commitmentId});
  return s;
}
function finish(s,work=[]) {
  s=act(s,'commit');
  for(const workId of work)s=act(s,'allocate',{workId});
  return act(s,'finish');
}
const metadata={id:'qa-accessibility',completedAt:'2026-11-14T18:00:00.000Z',origin:'general'};

test('Accessibility guidance is limited to the selected council route and comparisons wait for completion',()=>{
  assert.equal(accessibilityDecisionLens(councilView(createCouncil('accessibility'))),null);
  const platform=act(createCouncil('systems'),'propose',{proposalId:'versioned'});
  assert.equal(accessibilityDecisionLens(councilView(platform)),null);
  assert.ok(platformDecisionLens(councilView(platform)));
  assert.equal(councilOpportunityCosts(plan()),null);
  assert.equal(councilOpportunityCosts(act(plan(),'commit')),null);
  assert.equal(platformOpportunityCosts(finish(plan())),null);
  assert.ok(councilOpportunityCosts(finish(plan())));
});

test('all nine Accessibility approaches have distinct benefit, cost and reconsideration guidance',()=>{
  const unique=[];
  for(const variant of variants)for(const route of routes) {
    const view=councilView(plan(variant,route)),lens=accessibilityDecisionLens(view);
    assert.ok(lens.protects.length>20 && lens.cost.length>20 && lens.reconsider.length>20);
    unique.push(text([lens.protects,lens.cost,lens.reconsider]));
    assert.deepEqual(lens.evidence.map(row=>row.recordId),['audit','focus','queue']);
    const markup=councilMarkup(view,'practice');
    assert.match(markup,/data-council="accessibility"/);
    assert.match(markup,/4 units unreserved/);
    for(const row of lens.evidence)assert.equal(row.opened,false);
  }
  assert.equal(new Set(unique).size,9);
});

test('fallback guidance distinguishes unverified routes from narrowly checked browser and zoom evidence',()=>{
  const a=accessibilityDecisionLens(councilView(plan('original','fallback',['audit'])));
  const b=accessibilityDecisionLens(councilView(plan('b','fallback',['audit','focus'])));
  const c=accessibilityDecisionLens(councilView(plan('c','fallback',['audit'])));
  assert.match(a.cost,/accessibility remains unverified/);
  assert.match(b.cost,/longer timeout alone does not establish successful recovery/);
  assert.match(b.evidence.find(row=>row.recordId==='focus').detail,/lacks checked recovery/);
  assert.match(c.protects,/recorded browser and task-check scope/);
  assert.match(c.evidence.find(row=>row.recordId==='audit').detail,/keyboard and 400% zoom save task in one browser/);
  assert.match(c.evidence.find(row=>row.recordId==='audit').detail,/not universal accessibility/);
  assert.doesNotMatch(c.cost,/previous route.*unverified|no.*task evidence/);
});

test('unopened evidence remains generic and the new lens leaks neither private motives nor later findings',()=>{
  const unknown=variants.map(variant=>accessibilityDecisionLens(councilView(plan(variant))).evidence);
  for(let i=0;i<3;i++)assert.equal(new Set(unknown.map(rows=>rows[i].detail)).size,1);
  for(const variant of variants)for(const route of routes) {
    for(const recordId of ['audit','focus','queue']) {
      const state=plan(variant,route,[recordId]),lens=accessibilityDecisionLens(councilView(state));
      assert.deepEqual(lens.evidence.filter(row=>row.opened).map(row=>row.recordId),[recordId]);
      const guidance=text(lens);
      assert.doesNotMatch(guidance,/unannounced save-error|warning is not announced|longer error text|translated|reported language/);
      for(const person of councilView(finish(state)).debrief.reveals)assert.ok(!guidance.includes(person.objective));
      if(recordId!=='queue')assert.doesNotMatch(guidance,/Five repeat|Eight tagged|six know|two save failures/);
    }
  }
});

test('a fully supported promise set exhausts capacity without proving task access',()=>{
  const start=plan('original','repair',['focus','queue'],promises),state=finish(start);
  const view=councilView(state),report=buildCouncilCoaching(state);
  assert.equal(view.stakeholders.filter(row=>row.support==='supports').length,3);
  assert.equal(view.cost,6);
  assert.match(councilMarkup(councilView(start),'practice'),/0 units unreserved.*No additional response work can fit/);
  assert.match(text(report),/At least one task must carry forward/);
  assert.match(text(report),/not recommendations or proof that a task is accessible/);
  assert.match(text(report),/Support describes a negotiated position, not decision quality/);
  assert.deepEqual(councilOpportunityCosts(state).alternatives.map(row=>row.required),[2,3]);
});

test('affordable deferral explains real consequences without inventing a sacrificed promise',()=>{
  for(const variant of variants)for(const route of routes) {
    const state=finish(plan(variant,route)),view=councilView(state);
    const opportunity=councilOpportunityCosts(state);
    assert.match(opportunity.unavoidable,/response tasks need 5 units/);
    for(const alternative of opportunity.alternatives) {
      assert.equal(alternative.required,0);
      assert.equal(alternative.swaps.length,1);
      const swap=alternative.swaps[0];
      assert.deepEqual(swap.removedPromises,[]);assert.deepEqual(swap.removedWork,[]);
      assert.equal(swap.freed,0);assert.equal(swap.remaining,4-alternative.cost);
      assert.match(swap.explanation,/Leaving it deferred may be deliberate/);
      assert.ok(swap.explanation.includes(view.debrief.deferred.find(row=>row.id===alternative.deferredId).consequence));
    }
    const next=buildCouncilCoaching(state).sections[2].next;
    assert.match(next,/would fit in the 4 unused units without changing a promise or funded response/);
    assert.doesNotMatch(next,/work or support you would lose/);
  }
});

test('task repair and interim access retain different unresolved outcomes in every situation',()=>{
  for(const variant of variants) {
    const repair=finish(plan(variant,'repair',['focus'],['showcase']),['announce']);
    const interim=finish(plan(variant,'repair',['focus'],['showcase']),['interim']);
    for(const state of [repair,interim]) {
      const view=councilView(state),report=text(buildCouncilCoaching(state));
      assert.equal(view.debrief.deferred.length,1);
      assert.ok(report.includes(view.debrief.deferred[0].detail));
      assert.ok(report.includes(view.debrief.fulfilled.find(row=>row.origin==='response').detail));
      assert.ok(councilOpportunityCosts(state).alternatives[0].swaps.some(row=>row.removedWork.length));
    }
    assert.notEqual(councilView(repair).debrief.deferred[0].id,councilView(interim).debrief.deferred[0].id);
  }
});

test('all replay exchanges are affordable, minimal and reproduce their claimed support changes',()=>{
  let checked=0;
  for(const variant of variants)for(const route of routes)for(let mask=0;mask<8;mask++)for(let workMask=0;workMask<4;workMask++) {
    const commitments=promises.filter((_,i)=>mask&(1<<i));
    const requestedWork=responseIds[route].filter((_,i)=>workMask&(1<<i));
    const state=finish(plan(variant,route,['audit','focus'],commitments),requestedWork),before=text(state),view=councilView(state);
    const opportunity=councilOpportunityCosts(state);
    assert.equal(text(state),before);
    for(const alternative of opportunity.alternatives)for(const swap of alternative.swaps) {
      const removed=[...view.commitments.filter(row=>swap.removedPromises.includes(row.id)),...view.debrief.fulfilled.filter(row=>swap.removedWork.includes(row.id))];
      const unused=6-view.aftermath.cost;
      assert.equal(alternative.required,Math.max(0,alternative.cost-unused));
      assert.equal(removed.length,swap.removedPromises.length+swap.removedWork.length);
      assert.equal(swap.freed,removed.reduce((sum,row)=>sum+row.cost,0));
      for(const row of removed)assert.ok(swap.freed-row.cost<alternative.required);
      const replayWork=[...state.workIds.filter(id=>!swap.removedWork.includes(id)),alternative.deferredId];
      const replay=finish(plan(variant,route,['audit','focus'],commitments.filter(id=>!swap.removedPromises.includes(id))),replayWork),after=councilView(replay);
      assert.deepEqual([...replay.workIds].sort(),[...replayWork].sort());
      assert.equal(swap.remaining,6-after.aftermath.cost);
      const changes=view.stakeholders.flatMap(person=>{
        const next=after.stakeholders.find(row=>row.id===person.id);
        return next.support===person.support?[]:[{id:person.id,name:person.name,before:person.support,after:next.support}];
      });
      assert.deepEqual(swap.supportChanges,changes);
      if(removed.length)assert.match(swap.explanation,/Replay comparison:.*Promises are locked/);
      checked++;
    }
  }
  assert.ok(checked>300);
});

test('every route stays saveable within the existing feedback schema and saved reports are not rewritten',()=>{
  for(const variant of variants)for(const route of routes)for(let mask=0;mask<8;mask++)for(const work of [[],...responseIds[route].map(id=>[id])]) {
    const state=finish(plan(variant,route,['audit','focus'],promises.filter((_,i)=>mask&(1<<i))),work);
    const questions=[{speakerId:'design',question:'What was checked?',kind:'answer',phase:'council'},{speakerId:'support',question:'What is still unknown?',kind:'answer',phase:'aftermath'}];
    const saved=createSavedCouncil(state,{questions},metadata);
    assert.ok(saved,`${variant}/${route}/${mask}/${work}`);
    assert.deepEqual(saved.feedback.sections.map(row=>row.id),['questioning','negotiation','consequences']);
    assert.ok(saved.feedback.sections.every(row=>row.observations.length<=12));
  }
  const old=structuredClone(createSavedCouncil(finish(plan()),{},metadata));
  old.feedback.sections[0].observations=['Original saved assessment wording.'];
  const raw=JSON.stringify({schemaVersion:1,items:[old]});
  const storage={getItem(key){assert.equal(key,STORAGE_KEY);return raw;},setItem(){assert.fail('Loading must not rewrite saved feedback');}};
  const loaded=loadSavedCouncils(storage);
  assert.equal(loaded.error,null);assert.deepEqual(loaded.items[0].feedback,old.feedback);
});

test('shared comparisons preserve the Platform API and its route-specific guidance',()=>{
  for(const variant of variants)for(const route of ['versioned','readiness','narrow']) {
    let state=act(createCouncil('systems',variant),'propose',{proposalId:route});
    state=act(state,'investigate',{recordId:'contract'});
    for(const commitmentId of ['rollback','retirement','customer'])state=act(state,'promise',{commitmentId});
    state=finish(state);
    assert.deepEqual(councilOpportunityCosts(state),platformOpportunityCosts(state));
    assert.equal(accessibilityDecisionLens(councilView(state)),null);
    const report=buildCouncilCoaching(state);
    assert.match(text(report),/not recommendations or predictions of customer acceptance/);
    assert.doesNotMatch(text(report),/proof that a task is accessible/);
  }
});
