import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Set STAKEWOLF_ENGINE_MODULE to the isolated candidate while the stacked PR is
// under review. The committed default exercises the repository's public engine.
const engineUrl = process.env.STAKEWOLF_ENGINE_MODULE
  ? pathToFileURL(resolve(process.env.STAKEWOLF_ENGINE_MODULE)).href
  : new URL('../public/engine.js', import.meta.url).href;
const engine = await import(engineUrl);
const { ROUNDS } = await import(new URL('./scenario.js', engineUrl));
const { createGame, beginGame, askQuestion, decide, advance, getDebrief, formatDecisionRecord,
  recordRetentionFinding, clearRetentionFinding } = engine;

const choices = ['explicit', 'quiet', 'exception'];
const capacities = ['core', 'custom', 'both'];
const byRule = (state, ruleId) => state.events.filter(event => event.ruleId === ruleId);
const eventFor = (state, ruleId) => {
  const rows = byRule(state, ruleId);
  assert.equal(rows.length, 1, `expected exactly one ${ruleId}`);
  return rows[0];
};
const eventId = (state, round, type, key) => `${state.runId}/R${round}/${type}/${key}`;
const noEffect = event => {
  for (const group of ['metrics', 'relationships']) {
    assert.ok(Object.values(event.effects[group].requested).every(value => value === 0), `${event.ruleId} requested a ${group} effect`);
    assert.ok(Object.values(event.effects[group].actual).every(value => value === 0), `${event.ruleId} applied a ${group} effect`);
  }
};

function prepareR2(retentionChoice, { accessQuestion = true, typed = false } = {}) {
  let state = beginGame(createGame());
  state = decide(state, 'pilot');
  state = advance(state);
  assert.equal(state.round, 1);
  assert.ok(state.artifacts.some(item => item.artifactId === 'KB-05'));

  if (accessQuestion) {
    if (retentionChoice === 'exception') {
      state = askQuestion(state, 'theo', 'atlas-retention');
    } else {
      state = askQuestion(state, 'ishan', 'retention-fix');
      state = askQuestion(state, 'leah', 'data-promise');
    }
  }

  const rationale = typed ? ({
    explicit: 'I choose explicit consent and a usable deletion request before wider use.',
    quiet: 'I choose the quiet retention fix and will explain the change.',
    exception: 'I choose an Atlas retention exception with its limits recorded.',
  })[retentionChoice] : '';
  state = decide(state, retentionChoice, rationale);
  return state;
}

function finishPath(retentionChoice, capacityChoice, options = {}) {
  let state = prepareR2(retentionChoice, options);
  const r2Decision = eventFor(state, `choice:consent:${retentionChoice}`);
  const created = eventFor(state, 'obligation:OB-02:created');
  assert.equal(created.eventId, eventId(state, 2, 'obligation', 'OB-02-created'));
  assert.deepEqual(created.sourceEventIds, [r2Decision.eventId]);
  assert.deepEqual(created.audience, ['player', 'leah', 'ishan']);
  assert.ok(!state.knowledge.theo.includes(created.eventId), 'Theo should receive only the explanation status, not the operational obligation record');
  assert.deepEqual(state.obligations.filter(item => item.obligationId === 'OB-02').length, 1);
  assert.equal(state.obligations.find(item => item.obligationId === 'OB-02').owner, 'leah');
  assert.equal(state.obligations.find(item => item.obligationId === 'OB-02').cleanup.owner, 'ishan');
  assert.equal(state.obligations.find(item => item.obligationId === 'OB-02').customerExplanation.owner, 'theo');
  noEffect(created);

  state = advance(state);
  const delayed = eventFor(state, `delay:consent:${retentionChoice}`);
  const milestoneName = retentionChoice === 'explicit' ? 'met' : 'missed';
  const milestone = eventFor(state, `obligation:OB-02:explanation-${milestoneName}`);
  assert.equal(milestone.eventId, eventId(state, 3, 'obligation', `OB-02-explanation-${milestoneName}`));
  assert.deepEqual(milestone.sourceEventIds, [created.eventId, r2Decision.eventId, delayed.eventId]);
  assert.equal(milestone.details.status, milestoneName);
  assert.equal(milestone.details.parentStatus, 'active');
  assert.ok(milestone.sequence > delayed.sequence, 'the R2 delay must precede its R3 milestone');
  assert.ok(milestone.sequence < eventFor(state, 'story:knowledge:rumor:mara').sequence,
    'the R3 milestone must be recorded before R3 questions become available');
  assert.equal(state.obligations.find(item => item.obligationId === 'OB-02').status, 'active');
  noEffect(milestone);

  state = decide(state, 'ignore');
  state = advance(state);
  const r4Decision = decide(state, capacityChoice);
  const bundleStatus = ({ core: 'scheduled', custom: 'deferred', both: 'blocked' })[capacityChoice];
  const bundle = eventFor(r4Decision, `obligation:OB-02:bundle-${bundleStatus}`);
  assert.equal(bundle.eventId, eventId(state, 4, 'obligation', `OB-02-workflow-bundle-${bundleStatus}`));
  assert.deepEqual(bundle.sourceEventIds, [milestone.eventId, eventFor(r4Decision, `choice:scope:${capacityChoice}`).eventId]);
  assert.equal(bundle.details.parentStatus, 'active');
  assert.equal(r4Decision.obligations.find(item => item.obligationId === 'OB-02').status, 'active');
  assert.equal(r4Decision.obligations.find(item => item.obligationId === 'OB-02').workflowBundle.status, bundleStatus);
  noEffect(bundle);

  state = advance(r4Decision);
  state = decide(state, 'evidence');
  state = advance(state);
  return state;
}

test('R2 evidence access is source-bound, actor-bound, and does not grant unrelated knowledge', () => {
  let state = beginGame(createGame());
  state = decide(state, 'pilot');
  state = advance(state);
  const kb05 = state.events.find(event => event.ruleId === 'artifact:acquire:KB-05');
  const r1Delay = eventFor(state, 'delay:promise:pilot');
  assert.equal(kb05.eventId, eventId(state, 2, 'artifact', 'KB-05'));
  assert.deepEqual(kb05.sourceEventIds, [r1Delay.eventId]);
  assert.deepEqual(kb05.audience, ['player']);
  assert.deepEqual(state.artifacts.map(item => item.artifactId), ['KB-01', 'KB-04', 'KB-05']);

  assert.throws(() => askQuestion(state, 'mara', 'retention-fix'), /question|choose/i);
  state = askQuestion(state, 'ishan', 'data-scope');
  const kb07 = eventFor(state, 'artifact:acquire:KB-07');
  assert.deepEqual(kb07.sourceEventIds, [eventFor(state, 'question:consent:data-scope').eventId]);
  assert.equal(state.artifacts.some(item => item.artifactId === 'KB-06'), false,
    'data-scope should unlock the inventory only; KB-06 is documented for retention-fix');
  assert.deepEqual(kb07.audience, ['player']);
  const question = eventFor(state, 'question:consent:data-scope');
  assert.deepEqual(question.audience, ['player', 'ishan']);
  assert.ok(!state.knowledge.theo.includes(question.eventId));
  assert.ok(!state.knowledge.mara.includes(kb07.eventId));
});

test('R2 retention-fix unlocks configuration and inventory but not Atlas terms', () => {
  let state = beginGame(createGame());
  state = decide(state, 'pilot');
  state = advance(state);
  state = askQuestion(state, 'ishan', 'retention-fix');
  const question = eventFor(state, 'question:consent:retention-fix');
  for (const id of ['KB-06', 'KB-07']) {
    const artifact = eventFor(state, `artifact:acquire:${id}`);
    assert.deepEqual(artifact.sourceEventIds, [question.eventId]);
    assert.equal(artifact.details.acquiredVia, question.ruleId);
    assert.deepEqual(artifact.audience, ['player']);
  }
  assert.equal(state.artifacts.some(item => item.artifactId === 'KB-08'), false);
});

for (const retentionChoice of choices) {
  for (const capacityChoice of capacities) {
    test(`OB-02 matrix: R2 ${retentionChoice} × R4 ${capacityChoice}`, () => {
      const state = finishPath(retentionChoice, capacityChoice);
      const bundleStatus = ({ core: 'scheduled', custom: 'deferred', both: 'blocked' })[capacityChoice];
      const milestoneName = retentionChoice === 'explicit' ? 'met' : 'missed';
      const r5 = eventFor(state, 'obligation:OB-02:r5-checkpoint');
      const obligation = state.obligations.find(item => item.obligationId === 'OB-02');
      const cleanup = r5.details.cleanup;
      const checks = r5.details.checks;

      assert.equal(state.phase, 'complete');
      assert.equal(r5.eventId, eventId(state, 5, 'obligation', 'OB-02-r5-checkpoint'));
      assert.equal(r5.details.parentStatus, 'active');
      assert.equal(obligation.status, 'active');
      assert.equal(obligation.lastEventId, r5.eventId);
      assert.equal(r5.details.workflowBundle.status, bundleStatus);
      assert.equal(r5.details.explanationMilestone.status, milestoneName);
      assert.equal(cleanup.status, 'pending');
      assert.equal(cleanup.verified, false);
      assert.equal(cleanup.overdue, false);
      assert.equal(cleanup.owner, 'ishan');
      assert.equal(r5.details.policyScopeFollowUp.owner, 'leah');
      assert.equal(r5.details.policyScopeFollowUp.executionDeadline, null);
      assert.ok(r5.details.text.includes('pending, not overdue'));
      assert.ok(r5.sourceEventIds.includes(eventFor(state, `obligation:OB-02:bundle-${bundleStatus}`).eventId));
      assert.ok(r5.sourceEventIds.includes(eventFor(state, `choice:accountability:evidence`).eventId));
      assert.equal(r5.audience.includes('theo'), false,
        'the operational receipt must not disclose cleanup and scope details to Theo');
      assert.deepEqual(r5.audience, ['player', 'leah', 'ishan']);

      const expectedChecks = bundleStatus !== 'scheduled' ? []
        : retentionChoice === 'explicit' ? ['participant-notice', 'new-data-default', 'deletion-request-workflow']
          : retentionChoice === 'quiet' ? ['new-data-default'] : [];
      assert.deepEqual(checks.map(item => item.checkId), expectedChecks);
      assert.ok(checks.every(item => item.status === 'described-by-selected-path'));
      assert.equal(checks.some(item => item.checkId === 'old-data-cleanup'), false,
        'the scoped workflow checks must not claim the separate old-data cleanup task');

      if (retentionChoice === 'exception') {
        assert.deepEqual(r5.details.atlasException, {
          status: 'separate-request-retained', duration: '30 days', scope: 'Atlas only',
          scopeStatus: 'unresolved', verificationStatus: 'not verified', consentOrApproval: 'not established',
          sourceEventIds: [
            eventFor(state, 'choice:consent:exception').eventId,
            eventFor(state, 'question:consent:atlas-retention').eventId,
            eventFor(state, 'artifact:acquire:KB-08').eventId,
          ],
        });
      } else {
        assert.equal(r5.details.atlasException, null);
      }

      const debrief = getDebrief(state);
      assert.equal(debrief.obligations.length, 1);
      assert.equal(debrief.obligations[0].status, 'active');
      assert.equal(debrief.obligations[0].cleanup.overdue, false);
      assert.ok(debrief.citations.some(item => item.eventId === r5.eventId));
      const exported = formatDecisionRecord(state);
      assert.match(exported, /CARRIED WORK: OB-02/);
      assert.match(exported, /cleanup: pending; overdue: false; verified: false/);
      if (checks.length) assert.match(exported, /independent execution receipt not recorded/i);
      else assert.doesNotMatch(exported, /: described by the selected path; independent execution receipt not recorded/i);
      assert.doesNotMatch(exported, /all (?:old )?transcripts (?:were )?deleted/i);

      for (const event of state.events.filter(item => item.type === 'obligation' && item.details.obligationId === 'OB-02')) noEffect(event);
    });
  }
}

test('OB-02 malformed or duplicate traces fail closed; a fresh attempt has no inherited work', () => {
  const withObligation = prepareR2('explicit');
  const duplicate = structuredClone(withObligation);
  duplicate.obligations.push(structuredClone(duplicate.obligations.find(item => item.obligationId === 'OB-02')));
  assert.throws(() => advance(duplicate), /duplicate OB-02/i);

  const missing = structuredClone(withObligation);
  missing.obligations = [];
  assert.throws(() => advance(missing), /missing or duplicate OB-02/i);

  const clean = beginGame(createGame());
  assert.notEqual(clean.runId, withObligation.runId);
  assert.deepEqual(clean.obligations, []);
  assert.equal(clean.events.some(event => event.ruleId.startsWith('obligation:OB-02:')), false);
  assert.equal(clean.artifacts.some(item => ['KB-06', 'KB-07', 'KB-08'].includes(item.artifactId)), false);
});

test('R5 debrief rejects a cross-run OB-02 creation parent', () => {
  const state = finishPath('explicit', 'core');
  const created = eventFor(state, 'obligation:OB-02:created');
  created.runId = 'another-run';
  assert.throws(() => getDebrief(state), /broken event citation trace|missing or duplicate obligation:OB-02:created/i);
});

test('typed and preset paths preserve the same authored OB-02 state and numeric effects', () => {
  const initial = createGame();
  const presetStart = beginGame(initial);
  const typedStart = beginGame(structuredClone(initial));
  const typedText = {
    promise: 'I choose a small pilot and will limit access.',
    consent: 'I choose explicit consent and a usable deletion request before wider use.',
    rumor: 'I will ignore the rumor and keep working.',
    scope: 'I recommend the shared core and reliability work.',
    accountability: 'I will present evidence in a bounded recommendation.',
  };
  const pathChoices = ['pilot', 'explicit', 'ignore', 'core', 'evidence'];

  function commitAll(start, typed) {
    let state = start;
    for (let index = 0; index < pathChoices.length; index++) {
      if (index === 1) {
        state = askQuestion(state, 'ishan', 'retention-fix');
        state = askQuestion(state, 'leah', 'data-promise');
      }
      state = decide(state, pathChoices[index], typed ? typedText[ROUNDS[index].id] : '');
      if (index < pathChoices.length - 1) state = advance(state);
      else state = advance(state);
    }
    return state;
  }

  const preset = commitAll(presetStart, false);
  const typed = commitAll(typedStart, true);
  const normalize = value => {
    const result = structuredClone(value);
    for (const event of result.events) {
      if (event.type === 'input') {
        event.details.mode = 'preset';
        event.details.text = '';
      }
    }
    for (const row of result.history) row.writtenDecision = '';
    return result;
  };
  assert.deepEqual(normalize(typed), normalize(preset));
  assert.deepEqual(typed.metrics, preset.metrics);
  assert.deepEqual(typed.relationships, preset.relationships);
  assert.equal(eventFor(typed, 'obligation:OB-02:r5-checkpoint').details.cleanup.verified, false);
});

test('default-is-not-cleanup is a free append-only finding lifecycle with round-accurate sources', () => {
  const findingEvents = state => state.events.filter(event => event.type === 'finding' &&
    event.details.findingId === 'default-is-not-cleanup');
  const sourceRows = event => event.details.sourceAcquisitions;
  const gameplaySnapshot = state => ({ metrics: state.metrics, relationships: state.relationships,
    talksLeft: state.talksLeft, evidence: state.evidence, history: state.history,
    obligations: state.obligations, round: state.round, phase: state.phase });
  const checkFree = (before, after) => assert.deepEqual(gameplaySnapshot(after), gameplaySnapshot(before),
    'finding actions must not change gameplay, conversations, or commitments');

  let state = beginGame(createGame());
  state = decide(state, 'pilot');
  state = advance(state);
  state = askQuestion(state, 'ishan', 'retention-fix');
  state = askQuestion(state, 'leah', 'data-promise');
  assert.equal(state.round, 1);
  assert.equal(state.artifacts.some(item => item.artifactId === 'KB-08-R4'), false,
    'the R4 addendum must not exist during R2');
  const beforeR2 = state;
  state = recordRetentionFinding(state, 'scope-separated');
  checkFree(beforeR2, state);
  const first = findingEvents(state)[0];
  assert.equal(first.ruleId, 'finding:default-is-not-cleanup');
  assert.equal(first.details.action, 'recorded');
  assert.equal(first.details.revision, 1);
  assert.equal(first.details.recordedAtRound, 2);
  assert.deepEqual(sourceRows(first).map(item => item.artifactId), ['KB-05', 'KB-06', 'KB-07']);
  const originalSources = structuredClone(sourceRows(first));
  for (const source of originalSources) {
    const acquisition = eventFor(state, `artifact:acquire:${source.artifactId}`);
    assert.equal(source.eventId, acquisition.eventId);
    assert.equal(source.acquiredAtRound, acquisition.round);
    assert.equal(source.sequence, acquisition.sequence);
    assert.ok(first.sequence > acquisition.sequence);
  }
  noEffect(first);
  state = decide(state, 'quiet');

  // R3: revise the interpretation; this appends a new event and retains R2.
  state = advance(state);
  const beforeR3 = state;
  state = recordRetentionFinding(state, 'unresolved');
  checkFree(beforeR3, state);
  const second = findingEvents(state)[1];
  assert.equal(second.details.action, 'revised');
  assert.equal(second.details.revision, 2);
  assert.equal(second.details.recordedAtRound, 3);
  assert.equal(second.details.supersedesEventId, first.eventId);
  assert.deepEqual(sourceRows(second), originalSources,
    'later interpretation must retain original acquisition rounds and sequence');
  assert.ok(second.sourceEventIds.includes(first.eventId));
  noEffect(second);

  state = decide(state, 'ignore');
  state = advance(state);
  assert.equal(state.round, 3);
  assert.equal(state.artifacts.some(item => item.artifactId === 'KB-08-R4'), false);
  const beforeAddendumRevision = state;
  state = recordRetentionFinding(state, 'scope-separated');
  checkFree(beforeAddendumRevision, state);
  const third = findingEvents(state)[2];
  assert.equal(third.details.recordedAtRound, 4);
  assert.deepEqual(sourceRows(third).map(item => item.artifactId), ['KB-05', 'KB-06', 'KB-07'],
    'a source not yet acquired cannot be cited by a prior finding revision');

  // R4 Theo conversation separately unlocks the time-stamped addendum.
  state = askQuestion(state, 'theo', 'contract-terms');
  const addendum = eventFor(state, 'artifact:acquire:KB-08-R4');
  const artifactRecord = state.artifacts.find(item => item.artifactId === 'KB-08-R4');
  assert.equal(addendum.round, 4);
  assert.equal(addendum.details.artifactId, 'KB-08-R4');
  assert.equal(artifactRecord.acquiredAtRound, 4);
  assert.equal(artifactRecord.sequence, addendum.sequence);
  const beforePostAcquisitionRevision = state;
  state = recordRetentionFinding(state, 'unresolved');
  checkFree(beforePostAcquisitionRevision, state);
  const fourth = findingEvents(state)[3];
  assert.equal(fourth.details.action, 'revised');
  assert.equal(fourth.details.revision, 4);
  assert.equal(fourth.details.recordedAtRound, 4);
  assert.equal(fourth.details.supersedesEventId, third.eventId);
  const fourthSources = sourceRows(fourth);
  assert.deepEqual(fourthSources.map(item => item.artifactId), ['KB-05', 'KB-06', 'KB-07', 'KB-08-R4']);
  const addendumSource = fourthSources.at(-1);
  assert.deepEqual(addendumSource, { artifactId: 'KB-08-R4', eventId: addendum.eventId,
    acquiredAtRound: 4, sequence: addendum.sequence });
  assert.ok(fourth.sequence > addendum.sequence,
    'the new source must be acquired before the revision that cites it');
  assert.ok(fourth.sourceEventIds.includes(addendum.eventId));
  assert.ok(fourth.sourceEventIds.includes(third.eventId));
  noEffect(fourth);

  const beforeClear = state;
  state = clearRetentionFinding(state);
  checkFree(beforeClear, state);
  const fifth = findingEvents(state)[4];
  assert.equal(fifth.details.action, 'cleared');
  assert.equal(fifth.details.revision, 5);
  assert.equal(fifth.details.recordedAtRound, 4);
  assert.equal(fifth.details.active, false);
  assert.equal(fifth.details.interpretationId, 'unresolved');
  assert.equal(fifth.details.interpretation, second.details.interpretation);
  assert.equal(fifth.details.supersedesEventId, fourth.eventId);
  assert.ok(!state.findings.includes('default-is-not-cleanup'));
  noEffect(fifth);

  state = decide(state, 'core');
  state = advance(state);
  state = decide(state, 'evidence');
  state = advance(state);
  const debrief = getDebrief(state);
  assert.equal(debrief.retentionFindingHistory.length, 5);
  assert.deepEqual(debrief.retentionFindingHistory.map(item => [item.revision, item.recordedAtRound, item.action]), [
    [1, 2, 'recorded'], [2, 3, 'revised'], [3, 4, 'revised'], [4, 4, 'revised'], [5, 4, 'cleared'],
  ]);
  assert.deepEqual(debrief.retentionFindingHistory[0].sourceAcquisitions, originalSources);
  assert.deepEqual(debrief.retentionFindingHistory[2].sourceAcquisitions.map(item => item.artifactId), ['KB-05', 'KB-06', 'KB-07']);
  assert.deepEqual(debrief.retentionFindingHistory[3].sourceAcquisitions, fourthSources);
  assert.ok(debrief.retentionFindingHistory.every(item => item.sourceEventIds.includes(item.eventId)),
    'debrief history should cite every append-only revision event');
  const exported = formatDecisionRecord(state);
  for (const event of findingEvents(state)) assert.ok(exported.includes(event.eventId),
    `decision export must retain citation ${event.eventId}`);
  assert.match(exported, /Revision 5 · R4 · cleared:/);
  assert.match(exported, /KB-08-R4 at R4 \(sequence \d+, event [^)]+\)/);
  assert.equal(state.obligations.find(item => item.obligationId === 'OB-02').status, 'active');
});

