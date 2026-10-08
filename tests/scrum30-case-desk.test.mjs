import test from 'node:test';
import assert from 'node:assert/strict';
import { PEOPLE, ROUNDS } from '../public/scenario.js';
import { createGame, beginGame, askQuestion, decide, advance, getCaseDesk, getDebrief } from '../public/engine.js';

const start = () => beginGame(createGame());
const next = (state, choice, wording = '') => advance(decide(state, choice, wording));
const eventFor = (state, ruleId) => {
  const events = state.events.filter(event => event.ruleId === ruleId);
  assert.equal(events.length, 1, `exactly one ${ruleId}`);
  return events[0];
};
const item = (desk, id) => {
  const row = desk.statusItems.find(value => value.id === id);
  assert.ok(row, `${id} is visible`);
  return row;
};
const milestone = (desk, id, milestoneId) => {
  const row = item(desk, id).milestones.find(value => value.id === milestoneId);
  assert.ok(row, `${milestoneId} is visible`);
  return row;
};
function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
function inspect(state, choiceId) {
  const before = structuredClone(state);
  const desk = getCaseDesk(freeze(state), choiceId);
  assert.deepEqual(state, before, 'desk reads preserve the entire run, including events, knowledge and conversations');
  assert.deepEqual(getCaseDesk(state, choiceId), desk, 'repeated reads are deterministic and append nothing');
  return desk;
}
function sources(value) {
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, child]) => key === 'sourceEventIds'
    ? child : sources(child));
}
function assertPlayerSources(state, desk) {
  for (const id of sources(desk)) {
    const event = state.events.find(row => row.eventId === id);
    assert.ok(event, `source ${id} exists in this run`);
    assert.equal(event.runId, state.runId);
    assert.ok(event.playerVisible || state.knowledge.player.includes(id), `${id} is available to the player`);
    assert.ok(event.audience.includes('player'), `${id} does not expose a private NPC source`);
  }
}
function reachR4(retention = 'explicit', { first = 'pilot', atlas = false, addendum = false } = {}) {
  let state = next(start(), first);
  if (atlas) state = askQuestion(state, 'theo', 'atlas-retention');
  state = next(state, retention);
  state = next(state, 'ignore');
  if (addendum) state = askQuestion(state, 'theo', 'contract-terms');
  return state;
}
function reachR5(retention = 'explicit', capacity = 'core', options) {
  return next(reachR4(retention, options), capacity);
}

test('briefing and R1 expose no recorded or future debt; previews do not create OB-01', () => {
  const briefing = inspect(createGame());
  assert.deepEqual(briefing.statusItems, []);
  assert.deepEqual(briefing.impacts, []);
  assert.equal(briefing.sharedReview, null);
  assert.equal(briefing.launchReview, null);
  const state = start();
  const desk = inspect(state);
  assert.deepEqual(desk.statusItems, []);
  assert.deepEqual(desk.impacts.map(row => row.choiceId), ['pilot', 'launch', 'delay']);
  assert.equal(desk.sharedReview, null);
  assert.equal(desk.launchReview, null);
  for (const choice of ['pilot', 'launch', 'delay']) {
    const selected = inspect(state, choice);
    assert.deepEqual(selected.impacts.map(row => row.choiceId), [choice]);
    assert.deepEqual(selected.statusItems, []);
    assert.deepEqual(selected.impacts[0].sourceEventIds, [], 'authored prospective rule has no fabricated decision citation');
  }
  assert.equal(state.obligations.length, 0);
  assert.doesNotMatch(JSON.stringify(desk), /KB-10|Thursday|twelve teams|12 beta|30.day Atlas/i);
});

for (const first of ['pilot', 'launch', 'delay']) {
  test(`R1 ${first} creates one truthful OB-01 origin that survives into R2`, () => {
    const committed = decide(start(), first, 'My private wording does not create extra promises.');
    const decision = eventFor(committed, `choice:promise:${first}`);
    const obligation = eventFor(committed, 'obligation:OB-01:created');
    for (const state of [committed, advance(committed)]) {
      const desk = inspect(state);
      assert.deepEqual(desk.statusItems.map(row => row.id), ['OB-01']);
      const row = item(desk, 'OB-01');
      assert.equal(row.status, state.round === 0 ? 'open' : 'active');
      assert.equal(row.owner, 'Ishan Chen');
      assert.equal(row.origin.round, 1);
      assert.equal(row.origin.title, ROUNDS[0].choices.find(choice => choice.id === first).title);
      assert.equal(row.originEventId, decision.eventId);
      assert.equal(row.commitmentEventId, obligation.eventId);
      assert.equal(row.commitment, obligation.details.text);
      assert.ok(row.sourceEventIds.includes(decision.eventId));
      assert.ok(row.sourceEventIds.includes(obligation.eventId));
      assert.equal(row.currentEventId, state.obligations.find(value => value.obligationId === 'OB-01').lastEventId);
      assert.ok(row.sourceEventIds.includes(row.currentEventId));
      assert.match(row.due, /R5/);
      assert.doesNotMatch(JSON.stringify(desk), /My private wording/);
      assert.equal(desk.sharedReview, null);
      assertPlayerSources(state, desk);
    }
  });
}

for (const [retention, expected] of [['explicit', 'met'], ['quiet', 'missed'], ['exception', 'missed']]) {
  test(`R2 ${retention} preview stays prospective; explanation becomes ${expected} only at R3 entry`, () => {
    const r2 = next(start(), 'pilot');
    const preview = inspect(r2, retention);
    assert.deepEqual(preview.statusItems.map(row => row.id), ['OB-01']);
    assert.equal(r2.events.some(event => /explanation-(met|missed)/.test(event.ruleId)), false);
    const committed = decide(r2, retention, 'I will explain everything and all cleanup is complete.');
    const beforeEntry = inspect(committed);
    assert.deepEqual(beforeEntry.impacts, []);
    assert.equal(milestone(beforeEntry, 'OB-02', 'OB-02-R3').status, 'due');
    assert.equal(committed.events.some(event => /explanation-(met|missed)/.test(event.ruleId)), false);
    const r3 = advance(committed);
    const desk = inspect(r3);
    const explanation = milestone(desk, 'OB-02', 'OB-02-R3');
    assert.equal(explanation.status, expected, 'confirmed action, not an unsupported typed promise, determines the milestone');
    assert.ok(explanation.sourceEventIds.includes(eventFor(r3, `obligation:OB-02:explanation-${expected}`).eventId));
    assert.equal(milestone(desk, 'OB-02', 'OB-02-cleanup').status, 'pending');
    for (const carried of [beforeEntry, desk, inspect(next(r3, 'ignore'))]) {
      const explanationWork = milestone(carried, 'OB-02', 'OB-02-R3');
      assert.equal(explanationWork.owner, 'Theo Bell');
      assert.match(explanationWork.due, /entry to R3/i);
      const cleanup = milestone(carried, 'OB-02', 'OB-02-cleanup');
      assert.equal(cleanup.owner, 'Ishan Chen');
      assert.equal(cleanup.status, 'pending');
      assert.match(cleanup.due, /execution deadline unset/i);
      assert.match(cleanup.nextAction, /not overdue/i);
      const policy = milestone(carried, 'OB-02', 'OB-02-policy-scope');
      assert.equal(policy.owner, 'Leah Okafor');
      assert.equal(policy.status, 'pending');
      assert.match(policy.due, /Thursday 12:00.*fictional launch week.*execution deadline unset/i);
    }
    assert.equal(item(desk, 'OB-02').owner, 'Leah Okafor');
    assert.equal(item(desk, 'OB-02').origin.round, 2);
    assert.equal(desk.sharedReview, null);
    assert.equal(desk.launchReview, null);
    assert.doesNotMatch(JSON.stringify(desk), /all cleanup is complete/);
    assertPlayerSources(r3, desk);
  });
}

test('R4 entry reveals acquired capacity; selecting every alternative changes neither recorded bundle nor budget', () => {
  const state = reachR4();
  const capacity = eventFor(state, 'artifact:acquire:KB-10a');
  const before = structuredClone(state);
  const desk = inspect(state);
  assert.equal(desk.sharedReview.reviewerCount, 2);
  assert.equal(desk.sharedReview.status, 'pending');
  assert.deepEqual(desk.sharedReview.sourceEventIds, [capacity.eventId]);
  assert.equal(capacity.round, 4);
  assert.deepEqual(desk.impacts.map(row => row.choiceId), ['core', 'custom', 'both']);
  for (const [choice, consequence] of [['core', /schedul.*one shared bundle/i], ['custom', /defer.*shared bundle/i], ['both', /blocked/i]]) {
    const selected = inspect(state, choice);
    assert.deepEqual(selected.impacts.map(row => row.choiceId), [choice]);
    assert.match(selected.impacts[0].summary, consequence);
    assert.ok(selected.impacts[0].sourceEventIds.includes(capacity.eventId));
    assert.deepEqual(selected.statusItems, desk.statusItems, 'selected consequence is not a recorded obligation transition');
    assert.equal(selected.sharedReview.status, 'pending');
    assertPlayerSources(state, selected);
  }
  assert.deepEqual(state, before);
  assert.equal(state.talksLeft, 2);
  assert.ok(state.obligations.every(row => row.validationBundle.status === 'unselected'));
  assert.equal(state.events.some(row => row.ruleId === 'obligation:shared-review-bundle:selected'), false);
});

for (const [retention, explanation] of [['explicit', 'met'], ['quiet', 'missed'], ['exception', 'missed']]) {
  for (const [capacity, expectedStatus] of [['core', 'scheduled'], ['custom', 'deferred'], ['both', 'blocked']]) {
    test(`R5 ${retention}/${capacity} brief preserves ${explanation} explanation and ${expectedStatus} shared work`, () => {
      const r4 = reachR4(retention);
      const committed = decide(r4, capacity);
      const recorded = inspect(committed);
      assert.deepEqual(recorded.impacts, []);
      assert.equal(milestone(recorded, 'OB-01', 'OB-01-R5').status, expectedStatus);
      assert.equal(milestone(recorded, 'OB-02', 'OB-02-R4').status, expectedStatus);
      assert.equal(recorded.sharedReview.status, expectedStatus, 'confirmed R4 result reports the recorded bundle, not an unselected preview');
      assert.ok(recorded.sharedReview.sourceEventIds.includes(eventFor(committed, 'obligation:shared-review-bundle:selected').eventId));
      const state = advance(committed);
      const desk = inspect(state);
      const brief = desk.launchReview;
      assert.match(brief.label, /brief.*not a receipt/i);
      assert.equal(brief.sharedReview.status, expectedStatus);
      assert.equal(brief.customerExplanation.status, explanation);
      assert.equal(brief.cleanup.status, 'pending');
      assert.match(brief.cleanup.summary, /not verified/);
      assert.match(brief.cleanup.summary, /not overdue/);
      assert.match(brief.followUp.summary, /Leah.*Thursday 12:00.*fictional.*execution deadline unset/i);
      const sharedEvent = eventFor(state, 'obligation:shared-review-bundle:selected');
      assert.equal(sharedEvent.details.reviewerCount, 2);
      assert.deepEqual(sharedEvent.details.obligationIds, ['OB-01', 'OB-02']);
      assert.ok(brief.sourceEventIds.includes(sharedEvent.eventId));
      assert.ok(brief.sourceEventIds.includes(eventFor(state, `obligation:OB-02:explanation-${explanation}`).eventId));
      assert.equal(state.events.some(event => event.ruleId === 'obligation:OB-02:r5-checkpoint'), false);
      assert.ok(sources(brief).every(id => state.events.find(event => event.eventId === id).round <= 4), 'precommit brief uses only already recorded R1–R4 sources');
      if (capacity === 'core' && retention === 'explicit') assert.match(brief.sharedReview.summary, /notice.*new-data default.*deletion-request.*no independent execution receipt/i);
      if (capacity === 'core' && retention === 'quiet') assert.match(brief.sharedReview.summary, /new-data default only.*missed explanation/i);
      if (retention === 'exception') assert.doesNotMatch(JSON.stringify(brief), /30.day/);
      for (const choice of ['evidence', 'momentum', 'shared']) {
        const projected = inspect(state, choice);
        assert.deepEqual(projected.launchReview, brief, 'board framing selection cannot rewrite accumulated work');
        assert.deepEqual(projected.impacts.map(row => row.choiceId), [choice]);
      }
      assertPlayerSources(state, desk);
    });
  }
}

test('Atlas duration requires actual earlier question plus its artifact, not the later conditional addendum', () => {
  const lateOnly = reachR5('exception', 'core', { addendum: true });
  assert.ok(lateOnly.artifacts.some(row => row.artifactId === 'KB-08-R4'));
  assert.equal(lateOnly.artifacts.some(row => row.artifactId === 'KB-08'), false);
  assert.doesNotMatch(JSON.stringify(inspect(lateOnly).launchReview), /30.day/);
  const acquired = reachR5('exception', 'core', { atlas: true });
  const brief = inspect(acquired).launchReview;
  assert.match(brief.sharedReview.summary, /30.day Atlas.*approval and scope remain unestablished/i);
  assert.ok(brief.sourceEventIds.includes(eventFor(acquired, 'question:consent:atlas-retention').eventId));
  assert.ok(brief.sourceEventIds.includes(eventFor(acquired, 'artifact:acquire:KB-08').eventId));
  assertPlayerSources(acquired, brief);
});

test('zero-question desk leaks neither unseen dossier content, private agendas nor a wider rumor attribution', () => {
  const r3 = next(next(start(), 'launch'), 'quiet');
  const hidden = ['story:planning-note', 'story:crop-admission'].map(rule => eventFor(r3, rule));
  assert.ok(hidden.every(event => !event.playerVisible && !event.audience.includes('player')));
  for (const state of [r3, next(r3, 'ignore'), reachR5('quiet', 'custom', { first: 'launch' })]) {
    const desk = inspect(state);
    const text = JSON.stringify(desk);
    for (const person of PEOPLE) assert.ok(!text.includes(person.agenda), 'completion motives are not desk discoveries');
    for (const event of hidden) {
      assert.ok(!text.includes(event.eventId));
      assert.ok(!text.includes(event.details.text));
    }
    assert.doesNotMatch(text, /KB-02|KB-03|KB-06|KB-07|KB-08|KB-09a|KB-09c|KB-10b|KB-10c|600 waitlisted|three of 40|12 beta|twelve teams|two leads|promotion case/i);
    assertPlayerSources(state, desk);
  }
});

test('choice lookup never silently substitutes an option, including another round’s valid ID', () => {
  const states = [start(), next(start(), 'pilot'), reachR4(), reachR5()];
  for (const state of states) {
    for (const invalid of ['not-a-choice', '', null, 0, { id: 'core' }]) assert.deepEqual(inspect(state, invalid).impacts, []);
  }
  assert.deepEqual(inspect(start(), 'core').impacts, []);
  assert.deepEqual(inspect(reachR4(), 'pilot').impacts, []);
});

test('desk return values are detached, completed work stays unresolved, and restart has no prior-run sources', () => {
  let state = reachR5('quiet', 'both');
  const before = structuredClone(state);
  const first = getCaseDesk(state);
  first.statusItems[0].title = 'Changed by a consumer';
  first.statusItems[0].milestones[0].sourceEventIds.push('forged');
  first.launchReview.cleanup.status = 'verified';
  first.impacts[0].sourceEventIds.push('forged');
  assert.deepEqual(state, before, 'mutating a returned object never changes its source run');
  assert.notDeepEqual(first, inspect(state));
  state = decide(state, 'momentum');
  const result = inspect(state);
  assert.deepEqual(result.impacts, []);
  state = advance(state);
  const completed = inspect(state);
  assert.deepEqual(completed.impacts, []);
  assert.equal(completed.launchReview.sharedReview.status, 'blocked');
  assert.equal(completed.launchReview.customerExplanation.status, 'missed');
  assert.equal(completed.launchReview.cleanup.status, 'pending');
  assertPlayerSources(state, completed);
  const fresh = createGame();
  assert.notEqual(fresh.runId, state.runId);
  assert.deepEqual(inspect(fresh).statusItems, []);
  assert.deepEqual(inspect(beginGame(fresh)).statusItems, []);
  assert.ok(!JSON.stringify(inspect(beginGame(fresh))).includes(state.runId));
});

// Coordinator's actual browser path exposed a missing renderer-consumed field.
// Keep the model contract tied to the recorded bundle; do not invent a status
// fallback in the renderer or drop source validation to conceal the mismatch.
for (const [capacity, status, metrics] of [
  ['core', 'scheduled', { delivery: 41, trust: 100, quality: 100 }],
  ['custom', 'deferred', { delivery: 62, trust: 100, quality: 69 }],
  ['both', 'blocked', { delivery: 44, trust: 97, quality: 71 }],
]) {
  test(`debrief shared-bundle contract: ${capacity} exposes its recorded ${status} state`, () => {
    let state = next(start(), 'pilot');
    state = next(state, 'explicit', 'Ask teams to opt in and give them a deletion path.');
    state = askQuestion(state, 'mara', 'screenshot-source');
    state = askQuestion(state, 'ishan', 'full-thread');
    state = next(state, 'open');
    state = next(state, capacity);
    state = next(state, 'evidence');
    assert.deepEqual(state.metrics, metrics);
    const before = structuredClone(state);
    const debrief = getDebrief(freeze(state));
    assert.deepEqual(state, before);
    const shared = eventFor(state, 'obligation:shared-review-bundle:selected');
    const checkpoint = eventFor(state, 'obligation:OB-02:r5-checkpoint');
    const retention = debrief.obligations.find(row => row.obligationId === 'OB-02');
    assert.deepEqual(retention.validationBundle, {
      id: 'R4-SHARED-REVIEW-BUNDLE', status, eventId: shared.eventId,
    }, 'the field consumed by the debrief renderer must expose the actual shared bundle');
    assert.deepEqual(retention.validationBundle, checkpoint.details.sharedReviewBundle);
    assert.equal(retention.workflowBundle.status, status);
    assert.equal(retention.cleanup.verified, false);
    assert.equal(retention.cleanup.overdue, false);
    const citations = new Set(debrief.citations.map(row => row.eventId));
    assert.ok(citations.has(shared.eventId));
    for (const id of sources(debrief)) assert.ok(citations.has(id), `debrief source ${id} resolves`);
    retention.validationBundle.status = 'verified';
    assert.deepEqual(state, before, 'consumer edits cannot rewrite the actual bundle');
  });
}
