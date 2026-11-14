import test from 'node:test';
import assert from 'node:assert/strict';
import {createCouncil,councilAct,councilView} from '../dist/council.mjs';
import {interpretCouncilMessage as say,dialogueExamples} from '../dist/council-dialogue.mjs';
import {buildCouncilCoaching} from '../dist/council-coaching.mjs';

const act = (state,type,fields={}) => councilAct(state,{type,...fields});
const apply = (state,response) => response.pending.actions.reduce(councilAct,state);
const freeze = value => {
  if (value && typeof value==='object') {Object.values(value).forEach(freeze);Object.freeze(value);}
  return value;
};
const owners = {
  accessibility:{audit:'design',focus:'engineering',queue:'support'},
  systems:{consumers:'platform',contract:'account',canary:'reliability'}
};
const completed = (state,workId=null) => {
  const closed=councilView(state);
  state=act(state,'commit');
  if (workId) state=act(state,'allocate',{workId});
  return {state:act(state,'finish'),attempt:{closed,questions:[]}};
};

for (const topic of Object.keys(owners)) for (const variantId of ['original','b','c']) {
  const label=`${topic} ${variantId}`;
  test(`${label}: record conversations and examples expose only this attempt's inspected evidence`,()=>{
    const start=freeze(createCouncil(topic,variantId));
    const view=councilView(start);
    assert.equal(view.variantId,variantId);
    const finished=completed(act(start,'propose',{proposalId:view.proposals[0].id})).state;
    const objectives=councilView(finished).debrief.reveals.map(person=>person.objective);
    for (const record of view.records) {
      const speaker=owners[topic][record.id];
      const question=`What does the ${record.title.toLowerCase()} establish?`;
      const offered=say(start,speaker,question);
      assert.equal(offered.kind,'inspection',question);
      assert.deepEqual(offered.pending.actions,[{type:'investigate',recordId:record.id}]);
      const opened=apply(start,offered);
      const fact=councilView(opened).records.find(row=>row.id===record.id).text;
      assert.ok(!JSON.stringify(offered).includes(fact));
      const answer=say(opened,speaker,question);
      assert.ok(answer.reply.includes(fact));
      assert.equal(answer.pending,null);
      for (const objective of objectives) {
        assert.ok(!JSON.stringify(offered).includes(objective));
        assert.ok(!answer.reply.includes(objective));
      }
      if (variantId!=='original') {
        const original=councilView(act(createCouncil(topic),'investigate',{recordId:record.id})).records.find(row=>row.id===record.id).text;
        assert.notEqual(fact,original);
        assert.ok(!answer.reply.includes(original));
        const rememberedQuestion=dialogueExamples(topic,speaker)[0];
        const rememberedReply=say(opened,speaker,rememberedQuestion).reply;
        assert.ok(rememberedReply.includes(fact));
        assert.ok(!rememberedReply.includes(original));
        const examples=dialogueExamples(view,speaker);
        assert.equal(examples.length,3);
        assert.ok(examples[0].includes(record.title.toLowerCase()));
        assert.equal(say(start,speaker,examples[0]).kind,'inspection');
        assert.deepEqual(say(start,speaker,examples[0]).pending.actions,[{type:'investigate',recordId:record.id}]);
        assert.ok(!JSON.stringify(examples).includes(original));
        examples.pop();
        assert.equal(dialogueExamples(view,speaker).length,3);
      }
    }
  });

  test(`${label}: support, named offers and revealed objectives follow the current variant`,()=>{
    const start=createCouncil(topic,variantId), initial=councilView(start);
    for (const person of initial.stakeholders) {
      assert.ok(say(start,person.id,'What do you want?').reply.includes(person.claim));
      assert.equal(say(start,person.id,'What is your private objective?').kind,'limit');
    }
    for (const proposal of initial.proposals) {
      const offer=say(start,initial.stakeholders[0].id,`Please choose ${proposal.title.toLowerCase()}`);
      assert.deepEqual(offer.pending?.actions,[{type:'propose',proposalId:proposal.id}],proposal.title);
      let state=apply(start,offer);
      for (const promise of initial.commitments) {
        const promiseOffer=say(state,initial.stakeholders[0].id,`Please promise ${promise.title.toLowerCase()}`);
        assert.deepEqual(promiseOffer.pending?.actions,[{type:'promise',commitmentId:promise.id}],promise.title);
        state=apply(state,promiseOffer);
      }
      for (const record of initial.records.slice(0,2)) state=act(state,'investigate',{recordId:record.id});
      for (const person of councilView(state).stakeholders) {
        const reply=say(state,person.id,'Do you support this?').reply;
        assert.ok(reply.includes(person.support));
        assert.ok(reply.includes(person.condition));
      }
      const done=completed(state).state, debrief=councilView(done).debrief;
      for (const person of debrief.reveals) {
        const reply=say(done,person.id,'What is your private objective?').reply;
        assert.ok(reply.includes(person.objective));
        assert.ok(reply.includes(person.reflection));
      }
    }
  });

  test(`${label}: frozen coaching uses current evidence, closing support and response consequences`,()=>{
    const start=createCouncil(topic,variantId), initial=councilView(start);
    for (const proposal of initial.proposals) {
      let state=act(start,'propose',{proposalId:proposal.id});
      state=act(state,'investigate',{recordId:initial.records[0].id});
      const aftermath=act(state,'commit');
      const optional=councilView(aftermath).aftermath.work.filter(row=>!row.locked);
      for (const work of optional) {
        const message=`Please fund ${work.title.toLowerCase()}`;
        const workOffer=say(aftermath,initial.stakeholders[0].id,message);
        assert.deepEqual(workOffer.pending?.actions,[{type:'allocate',workId:work.id}],work.title);
        const mixed=say(aftermath,initial.stakeholders[0].id,`${message} and build a new lobby`);
        assert.equal(mixed.kind,'clarify');
        assert.equal(mixed.pending,null);
      }
      const work=optional[0];
      const run=completed(state,work.id);
      freeze(run);
      const feedback=buildCouncilCoaching(run.state,run.attempt), serialized=JSON.stringify(feedback);
      const final=councilView(run.state);
      assert.ok(serialized.includes(final.records[0].text));
      for (const person of final.stakeholders) assert.ok(serialized.includes(person.condition));
      for (const row of [...final.debrief.fulfilled,...final.debrief.deferred]) assert.ok(serialized.includes(row.detail));
      for (const person of final.debrief.reveals) assert.ok(!serialized.includes(person.objective));
      for (const record of initial.records.slice(1)) {
        const unopened=councilView(act(start,'investigate',{recordId:record.id})).records.find(row=>row.id===record.id).text;
        assert.ok(!serialized.includes(unopened));
      }
      assert.doesNotMatch(serialized,/matching pre-commit snapshot was unavailable/);
      feedback.sections[0].observations[0]='MUTATED FEEDBACK';
      assert.doesNotMatch(JSON.stringify(buildCouncilCoaching(run.state,run.attempt)),/MUTATED FEEDBACK/);
      assert.equal(JSON.stringify(buildCouncilCoaching(run.state,run.attempt)),serialized);
    }
  });
}

test('a closing snapshot from another variant is rejected even if its selected facts match',()=>{
  for (const topic of Object.keys(owners)) {
    const start=createCouncil(topic,'b');
    const run=completed(act(start,'propose',{proposalId:councilView(start).proposals[0].id}));
    run.attempt.closed.variantId='c';
    assert.match(JSON.stringify(buildCouncilCoaching(run.state,run.attempt)),/matching pre-commit snapshot was unavailable/);
    delete run.attempt.closed.variantId;
    assert.match(JSON.stringify(buildCouncilCoaching(run.state,run.attempt)),/matching pre-commit snapshot was unavailable/);
    const original=createCouncil(topic);
    const legacy=completed(act(original,'propose',{proposalId:councilView(original).proposals[0].id}));
    delete legacy.attempt.closed.variantId;
    assert.doesNotMatch(JSON.stringify(buildCouncilCoaching(legacy.state,legacy.attempt)),/matching pre-commit snapshot was unavailable/);
  }
});
