import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Tests the isolated stacked candidate when STAKEWOLF_ENGINE_MODULE is set;
// from this candidate directory, the default resolves to its public engine.
const engineUrl = process.env.STAKEWOLF_ENGINE_MODULE
  ? pathToFileURL(resolve(process.env.STAKEWOLF_ENGINE_MODULE)).href
  : new URL('../public/engine.js', import.meta.url).href;
const engine = await import(engineUrl);
const { ROUNDS } = await import(new URL('./scenario.js', engineUrl));
const { createGame, beginGame, currentRound, askQuestion, decide, advance,
  getDebrief, formatDecisionRecord } = engine;

const capacities = ['core', 'custom', 'both'];
const retentionPaths = ['explicit', 'quiet', 'exception'];
const eventFor = (state, ruleId) => {
  const matches = state.events.filter(event => event.ruleId === ruleId);
  assert.equal(matches.length, 1, `expected exactly one ${ruleId}`);
  return matches[0];
};
const artifactRow = (state, artifactId) => state.artifacts.find(row => row.artifactId === artifactId);
const artifactEvent = (state, artifactId) => eventFor(state, `artifact:acquire:${artifactId}`);
const noEffect = event => {
  for (const group of ['metrics', 'relationships']) {
    assert.ok(Object.values(event.effects[group].requested).every(value => value === 0), `${event.ruleId} requested a ${group} effect`);
    assert.ok(Object.values(event.effects[group].actual).every(value => value === 0), `${event.ruleId} applied a ${group} effect`);
  }
};

function reachR4({ retention = 'exception', firstChoice = 'pilot' } = {}) {
  let state = beginGame(createGame());
  state = decide(state, firstChoice);
  state = advance(state);
  if (retention === 'exception') state = askQuestion(state, 'theo', 'atlas-retention');
  state = decide(state, retention);
  state = advance(state);
  const beforeR3Attempt = structuredClone(state);
  assert.throws(() => askQuestion(state, 'theo', 'contract-terms'), /question|choose/i);
  assert.deepEqual(state, beforeR3Attempt, 'the R4-only contract question is unavailable in R3');
  state = decide(state, 'broker');
  state = advance(state);
  assert.equal(currentRound(state).id, 'scope');
  return state;
}

function chooseR4({ retention = 'exception', capacity = 'core', firstChoice = 'pilot' } = {}) {
  return decide(reachR4({ retention, firstChoice }), capacity);
}

test('R4 entry exposes only the capacity index and record, before the decision', () => {
  const state = reachR4();
  const capacity = eventFor(state, 'story:review-capacity');
  assert.deepEqual(state.artifacts.map(row => row.artifactId).filter(id => id.startsWith('KB-10')),
    ['KB-10', 'KB-10a']);
  assert.equal(artifactRow(state, 'KB-10b'), undefined, 'R5 validation receipt is not available at R4');
  assert.equal(artifactRow(state, 'KB-10c'), undefined, 'R5 workflow receipt is not available at R4');
  assert.equal(capacity.round, 4);
  assert.deepEqual(capacity.audience, ['player']);
  assert.equal(capacity.evidenceStatus, 'authored-capacity');
  assert.deepEqual(capacity.details.carriedObligations, ['OB-01', 'OB-02']);
  assert.equal(capacity.details.result, 'capacity constraint; no review or test result');
  const source = artifactEvent(state, 'KB-10a');
  assert.deepEqual(source.sourceEventIds, [capacity.eventId]);
  assert.equal(artifactRow(state, 'KB-10a').acquiredAtRound, 4);
  assert.equal(source.details.time, 'Tuesday · 14:45');
  assert.equal(artifactRow(state, 'KB-10a').sequence, source.sequence);
  assert.equal(artifactRow(state, 'KB-08-R4'), undefined, 'Atlas addendum stays locked until its R4 interview');
  for (const choice of currentRound(state).choices) {
    assert.match(choice.description, /review bundle/i, `${choice.id} must disclose bundle consequence before confirmation`);
  }
  assert.match(currentRound(state).choices.find(choice => choice.id === 'core').description, /old transcripts are not deleted/i);
  assert.match(currentRound(state).choices.find(choice => choice.id === 'custom').description, /defer/i);
  assert.match(currentRound(state).choices.find(choice => choice.id === 'both').description, /blocked/i);
});

test('KB-08 R4 addendum is acquired only from Theo’s R4 contract-terms answer', () => {
  let state = beginGame(createGame());
  state = decide(state, 'pilot');
  state = advance(state);
  assert.equal(artifactRow(state, 'KB-08'), undefined);
  assert.equal(artifactRow(state, 'KB-08-R4'), undefined);
  const beforeEarlyAttempt = structuredClone(state);
  assert.throws(() => askQuestion(state, 'theo', 'contract-terms'), /question|choose/i);
  assert.deepEqual(state, beforeEarlyAttempt, 'an early access attempt has no state effect');
  state = askQuestion(state, 'theo', 'atlas-retention');
  assert.ok(artifactRow(state, 'KB-08'));
  assert.equal(artifactRow(state, 'KB-08-R4'), undefined, 'the R2 Atlas request is not the R4 addendum');
  state = decide(state, 'exception');
  state = advance(state);
  state = decide(state, 'broker');
  state = advance(state);

  const before = structuredClone(state);
  assert.equal(currentRound(state).id, 'scope');
  assert.equal(artifactRow(state, 'KB-08-R4'), undefined);
  assert.throws(() => askQuestion(state, 'ishan', 'contract-terms'), /question|choose/i);
  assert.deepEqual(state, before, 'wrong-person access does not mutate the run');

  const initial = artifactRow(state, 'KB-08');
  const initialEvent = artifactEvent(state, 'KB-08');
  const r2Decision = eventFor(state, 'choice:consent:exception');
  const r2AtlasQuestion = eventFor(state, 'question:consent:atlas-retention');
  assert.equal(initial.acquiredAtRound, 2);
  assert.equal(r2Decision.bonus.sourceEventId, r2AtlasQuestion.eventId);
  const metricsBefore = structuredClone(state.metrics);
  state = askQuestion(state, 'theo', 'contract-terms');
  const question = eventFor(state, 'question:scope:contract-terms');
  const addendum = artifactEvent(state, 'KB-08-R4');
  const row = artifactRow(state, 'KB-08-R4');
  assert.equal(question.round, 4);
  assert.equal(question.actor, 'theo');
  assert.deepEqual(question.audience, ['player', 'theo']);
  assert.equal(addendum.round, 4);
  assert.deepEqual(addendum.sourceEventIds, [question.eventId]);
  assert.deepEqual(addendum.audience, ['player']);
  assert.equal(addendum.details.acquiredVia, question.ruleId);
  assert.equal(addendum.details.time, 'Tuesday · 14:30');
  assert.equal(row.acquiredAtRound, 4);
  assert.equal(row.sequence, addendum.sequence);
  assert.ok(addendum.sequence > question.sequence);
  assert.equal(artifactRow(state, 'KB-08').eventId, initial.eventId, 'R4 acquisition must not rewrite R2 discovery');
  assert.equal(initialEvent.round, 2);
  assert.deepEqual(state.metrics, metricsBefore, 'the R4 interview and addendum do not change score');
  assert.match(addendum.details.text, /conditional commitment/i);
  assert.match(addendum.details.text, /reference rights need separate approval/i);
  assert.doesNotMatch(addendum.details.text, /unconditional sale|general authorization/i);
  assert.equal(state.events.filter(event => event.ruleId === 'artifact:acquire:KB-08-R4').length, 1);
  assert.equal(eventFor(state, 'choice:consent:exception').bonus.sourceEventId, r2AtlasQuestion.eventId,
    'late evidence cannot rewrite the R2 interview bonus or discovery time');
  const committed = decide(state, 'custom');
  assert.equal(eventFor(committed, 'choice:scope:custom').bonus.sourceEventId, question.eventId,
    'the R4 custom-deal bonus cites its R4 contract-terms answer');
  assert.equal(eventFor(committed, 'choice:scope:custom').bonus.questionId, 'contract-terms');
  const afterFirst = structuredClone(state);
  assert.throws(() => askQuestion(state, 'theo', 'contract-terms'), /already asked/i);
  assert.deepEqual(state, afterFirst, 'repeat acquisition cannot duplicate the addendum or mutate state');
});

test('R4 review-bottleneck question is the documented Ishan question and does not add capacity', () => {
  const state = reachR4();
  const prompt = currentRound(state).conversations.ishan.find(question => question.id === 'review-bottleneck');
  assert.ok(prompt);
  assert.equal(prompt.question, 'Which of our remaining promises use the same reviewers, and what can they validate before the launch review?');
  const beforeMetrics = structuredClone(state.metrics);
  const beforeIshanRelationship = state.relationships.ishan;
  const capacityBefore = artifactEvent(state, 'KB-10a').eventId;
  const after = askQuestion(state, 'ishan', 'review-bottleneck');
  const answer = eventFor(after, 'question:scope:review-bottleneck');
  assert.equal(answer.actor, 'ishan');
  assert.deepEqual(answer.audience, ['player', 'ishan']);
  assert.deepEqual(answer.sourceEventIds, [eventFor(after, 'story:knowledge:scope:ishan').eventId]);
  assert.deepEqual(after.metrics, beforeMetrics, 'an interview reveals the constraint; it does not create another reviewer');
  assert.equal(after.relationships.ishan, beforeIshanRelationship + 2,
    'the standard interview relationship gain still applies');
  assert.equal(artifactEvent(after, 'KB-10a').eventId, capacityBefore);
  assert.equal(after.artifacts.filter(row => row.artifactId === 'KB-10a').length, 1);
});

test('R5 core arrival says scoped checks are pending until a receipt exists', () => {
  let state = chooseR4({ retention: 'explicit', capacity: 'core' });
  assert.equal(state.phase, 'result');
  assert.equal(state.events.some(event => event.ruleId === 'artifact:acquire:KB-10b'), false);
  state = advance(state);
  assert.equal(currentRound(state).id, 'accountability');
  assert.match(state.arrival.text, /reaches review/i);
  assert.match(state.arrival.text, /scoped checks still need to run/i);
  assert.doesNotMatch(state.arrival.text, /(?:fix|bundle|review) (?:has )?(?:passed|verified|succeeded|completed)/i);
  assert.equal(state.events.some(event => event.ruleId === 'artifact:acquire:KB-10b'), false,
    'the R5 arrival is not the scoped validation receipt');
  assert.equal(state.events.some(event => /obligation:OB-01:.*verified/.test(event.ruleId)), false,
    'the pending arrival cannot verify OB-01');
  assert.equal(state.obligations.find(item => item.obligationId === 'OB-01').status, 'active');
});

test('the two R4 interviews share the round budget; a third question fails without mutation', () => {
  let state = reachR4();
  state = askQuestion(state, 'theo', 'contract-terms');
  state = askQuestion(state, 'ishan', 'review-bottleneck');
  assert.equal(state.talksLeft, 0);
  const before = structuredClone(state);
  const third = Object.entries(currentRound(state).conversations)
    .flatMap(([personId, rows]) => rows.map(row => ({ personId, id: row.id })))
    .find(question => !state.asked.includes(question.id));
  assert.ok(third, 'the authored R4 round has another question available to reject');
  assert.throws(() => askQuestion(state, third.personId, third.id), /used both conversations/i);
  assert.deepEqual(state, before);
  assert.equal(state.events.filter(event => event.ruleId === 'artifact:acquire:KB-08-R4').length, 1);
});

for (const retention of retentionPaths) {
  for (const capacity of capacities) {
    test(`R4 ${capacity} preserves the R2 ${retention} OB-02 boundary through R5`, () => {
      const before = reachR4({ retention });
      const priorOB01 = before.obligations.find(item => item.obligationId === 'OB-01');
      const priorOB02 = before.obligations.find(item => item.obligationId === 'OB-02');
      let state = decide(before, capacity);
      const choice = eventFor(state, `choice:scope:${capacity}`);
      const expectedBundleStatus = ({ core: 'scheduled', custom: 'deferred', both: 'blocked' })[capacity];
      const bundleTransition = eventFor(state, `obligation:OB-02:bundle-${expectedBundleStatus}`);
      const ob02 = state.obligations.find(item => item.obligationId === 'OB-02');
      assert.equal(choice.round, 4);
      assert.equal(bundleTransition.round, 4);
      assert.equal(bundleTransition.details.bundleStatus, expectedBundleStatus);
      assert.equal(bundleTransition.details.parentStatus, 'active');
      assert.equal(bundleTransition.details.choiceId, capacity);
      assert.ok(bundleTransition.sourceEventIds.includes(choice.eventId));
      assert.equal(ob02.status, 'active', 'bundle status never closes OB-02');
      assert.equal(ob02.workflowBundle.status, expectedBundleStatus);
      assert.equal(ob02.cleanup.status, 'pending');
      assert.equal(ob02.cleanup.verified, false);
      assert.equal(ob02.cleanup.overdue, false);
      noEffect(bundleTransition);

      const scheduled = eventFor(state, 'obligation:shared-review-bundle:selected');
      assert.equal(scheduled.details.bundleId, 'R4-SHARED-REVIEW-BUNDLE');
      assert.equal(scheduled.details.status, expectedBundleStatus);
      assert.deepEqual(scheduled.details.obligationIds, ['OB-01', 'OB-02']);
      assert.equal(scheduled.details.reviewerCount, 2);
      assert.equal(scheduled.sourceEventIds.length, 4);
      assert.deepEqual(scheduled.sourceEventIds, [priorOB01.lastEventId, priorOB02.lastEventId, choice.eventId,
        artifactEvent(before, 'KB-10a').eventId]);
      assert.equal(state.events.filter(event => event.ruleId === 'obligation:shared-review-bundle:selected').length, 1,
        'one shared bundle represents both workstreams');
      const ob01 = state.obligations.find(item => item.obligationId === 'OB-01');
      assert.equal(ob01.status, 'active', 'scheduling or deferring review is not verification');
      assert.equal(ob01.validationBundle.status, expectedBundleStatus);
      assert.equal(ob01.validationBundle.eventId, scheduled.eventId);
      assert.equal(ob02.validationBundle.status, expectedBundleStatus);
      assert.equal(ob02.validationBundle.eventId, scheduled.eventId);
      assert.equal(new Set([ob01.validationBundle.eventId, ob02.validationBundle.eventId]).size, 1);
      noEffect(scheduled);

      state = advance(state);
      state = decide(state, 'evidence');
      assert.equal(state.events.some(event => event.ruleId === 'obligation:OB-02:r5-checkpoint'), false,
        'the checkpoint is recorded at R5 completion, not when the choice is confirmed');
      state = advance(state);
      const ob01Final = state.obligations.find(item => item.obligationId === 'OB-01');
      const ob02Final = state.obligations.find(item => item.obligationId === 'OB-02');
      const receipt = eventFor(state, 'obligation:OB-02:r5-checkpoint');
      assert.equal(state.phase, 'complete');
      assert.equal(receipt.details.parentStatus, 'active');
      assert.equal(ob02Final.status, 'active');
      assert.equal(ob02Final.cleanup.status, 'pending');
      assert.equal(ob02Final.cleanup.verified, false);
      assert.equal(ob02Final.cleanup.overdue, false);
      assert.equal(receipt.details.workflowBundle.status, expectedBundleStatus);
      assert.equal(ob01Final.status, 'active', 'the authored test-and-review gate is still outstanding');
      assert.equal(ob01Final.validationBundle.status, expectedBundleStatus);
      assert.equal(ob01Final.verified, false, 'a planned bundle is not an execution receipt');
      assert.equal(ob01Final.reliabilityReview.status, expectedBundleStatus);
      if (capacity === 'core') {
        const expectedChecks = retention === 'explicit'
          ? ['participant-notice', 'new-data-default', 'deletion-request-workflow']
          : retention === 'quiet' ? ['new-data-default'] : [];
        assert.deepEqual(receipt.details.checks.map(check => check.checkId), expectedChecks);
        assert.ok(receipt.details.checks.every(check => check.status === 'described-by-selected-path'));
      } else {
        assert.deepEqual(receipt.details.checks, []);
      }
      assert.equal(receipt.details.cleanup.status, 'pending');
      assert.equal(receipt.details.cleanup.overdue, false);
      assert.equal(receipt.details.cleanup.verified, false);
      for (const event of state.events.filter(row => row.type === 'obligation' && ['OB-01', 'OB-02'].includes(row.details.obligationId))) noEffect(event);
    });
  }
}

