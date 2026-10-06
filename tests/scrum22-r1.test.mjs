import test from 'node:test';
import assert from 'node:assert/strict';
import { DOSSIER_ARTIFACTS, ROUNDS } from '../public/scenario.js';
import { createGame, beginGame, askQuestion, decide, advance, recordReadinessFinding } from '../public/engine.js';

const start=()=>beginGame(createGame());
const acquired=(state,id)=>state.artifacts.find(item=>item.artifactId===id);

test('R1 launch wording matches its schedule effect and campaign evidence uses teams consistently',()=>{
  const promise=ROUNDS[0];
  const launch=promise.choices.find(choice=>choice.id==='launch');
  assert.equal(launch.title,'Proceed with the public launch');
  assert.match(launch.description,/honor the campaign/i);
  assert.match(launch.commitment,/after broader exposure begins/i);
  assert.match(promise.quote,/600 teams on the waitlist/i);
  assert.match(DOSSIER_ARTIFACTS.find(item=>item.id==='KB-02').scope,/600 teams are waitlisted/i);
});

test('R1 dossier starts with only the launch brief and proposed containment runbook',()=>{
  const state=start();
  assert.deepEqual(state.artifacts.map(item=>item.artifactId),['KB-01','KB-04']);
  assert.equal(state.evidence.length,0);
  assert.equal(state.talksLeft,2);
  const runbook=state.events.find(event=>event.eventId===acquired(state,'KB-04').eventId);
  assert.equal(runbook.details.reliability,'Proposed control, not an execution receipt');
  assert.equal(runbook.details.acquiredVia,'case-entry');
  assert.match(runbook.details.text,/not shown as enabled/i);
});

test('campaign and reliability artifacts unlock only through their matching R1 interviews',()=>{
  let state=start();
  assert.throws(()=>recordReadinessFinding(state),/acquire.*before comparing/i);
  state=askQuestion(state,'mara','campaign');
  assert.ok(acquired(state,'KB-02'));
  assert.equal(state.talksLeft,1);
  assert.equal(state.events.find(event=>event.eventId===acquired(state,'KB-02').eventId).sourceEventIds.length,1);
  assert.equal(acquired(state,'KB-03'),undefined);
  state=askQuestion(state,'ishan','failure');
  assert.ok(acquired(state,'KB-03'));
  assert.equal(state.talksLeft,0);
  const report=state.events.find(event=>event.eventId===acquired(state,'KB-03').eventId);
  assert.match(report.details.text,/three of 40 reviewed long meetings/i);
  assert.match(report.details.text,/does not establish a population failure rate/);
});

test('dossier access rejects the right question asked of the wrong stakeholder',()=>{
  const state=askQuestion(askQuestion(start(),'mara','campaign'),'ishan','failure');
  const campaign=state.events.find(event=>event.ruleId==='question:promise:campaign');
  campaign.actor='ishan';
  assert.throws(()=>recordReadinessFinding(state),/invalid interview access for KB-02/);
});

test('dossier access rejects a mismatched question provenance',()=>{
  const state=askQuestion(askQuestion(start(),'mara','campaign'),'ishan','failure');
  const campaign=state.events.find(event=>event.ruleId==='question:promise:campaign');
  campaign.details.questionId='mara-pressure';
  assert.throws(()=>recordReadinessFinding(state),/invalid interview access for KB-02/);
});

test('comparison rejects dossier text whose provenance was altered',()=>{
  const state=askQuestion(askQuestion(start(),'mara','campaign'),'ishan','failure');
  const artifact=state.events.find(event=>event.ruleId==='artifact:acquire:KB-02');
  artifact.details.text='600 teams are ready to launch.';
  assert.throws(()=>recordReadinessFinding(state),/contradictory dossier provenance for KB-02/);
});

test('readiness comparison records its acquired source chain without a conversation or score effect',()=>{
  let state=askQuestion(askQuestion(start(),'mara','campaign'),'ishan','failure');
  const before=structuredClone(state);
  state=recordReadinessFinding(state);
  const finding=state.events.find(event=>event.ruleId==='finding:readiness-has-distinct-tests');
  assert.ok(finding);
  assert.deepEqual(finding.sourceEventIds,['KB-02','KB-03','KB-04'].map(id=>acquired(state,id).eventId));
  assert.equal(finding.evidenceStatus,'player-interpretation');
  assert.match(finding.details.text,/do not prove that a broad launch is ready/i);
  assert.deepEqual(state.metrics,before.metrics);
  assert.deepEqual(state.relationships,before.relationships);
  assert.equal(state.talksLeft,before.talksLeft);
  assert.deepEqual(before.findings,[]);
  assert.throws(()=>recordReadinessFinding(state),/already recorded/i);
});

test('each confirmed R1 choice creates one Ishan-owned OB-01 and activates it in R2',()=>{
  for (const choiceId of ['pilot','launch','delay']) {
    const initial=start();
    const committed=decide(initial,choiceId);
    assert.deepEqual(committed.obligations.map(({obligationId,owner,dueRound,status})=>({obligationId,owner,dueRound,status})),[
      {obligationId:'OB-01',owner:'ishan',dueRound:5,status:'open'},
    ]);
    assert.equal(committed.obligations[0].createdByDecision,committed.history[0].eventId);
    const created=committed.events.find(event=>event.ruleId==='obligation:OB-01:created');
    assert.deepEqual(created.sourceEventIds,[committed.history[0].eventId]);
    assert.equal(created.effects.metrics.actual.delivery,0);
    assert.equal(created.effects.metrics.actual.trust,0);
    assert.equal(created.effects.metrics.actual.quality,0);
    assert.throws(()=>decide(committed,choiceId),/no active decision/i);
    const r2=advance(committed);
    assert.equal(r2.round,1);
    assert.equal(r2.obligations.length,1);
    assert.equal(r2.obligations[0].status,'active');
    const activated=r2.events.find(event=>event.ruleId==='obligation:OB-01:active');
    const delayed=r2.events.find(event=>event.type==='delayed'&&event.round===2);
    assert.ok(activated.sourceEventIds.includes(created.eventId));
    assert.ok(activated.sourceEventIds.includes(delayed.eventId));
    assert.equal(activated.details.owner,'ishan');
    assert.equal(activated.details.text,delayed.details.text);
  }
});

test('restart creates a clean run without R1 dossier comparisons or obligations',()=>{
  const initial=start();
  const withComparison=recordReadinessFinding(askQuestion(askQuestion(initial,'mara','campaign'),'ishan','failure'));
  const committed=decide(withComparison,'pilot');
  const oldRun=committed.runId;
  const fresh=createGame();
  assert.notEqual(fresh.runId,oldRun);
  assert.deepEqual(fresh.artifacts,[]);
  assert.deepEqual(fresh.findings,[]);
  assert.deepEqual(fresh.obligations,[]);
  assert.deepEqual(fresh.events,[]);
});
