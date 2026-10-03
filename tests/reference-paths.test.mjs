import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame, beginGame, askQuestion, decide, advance,
  interpretDecision, getDebrief,
} from '../public/engine.js';

// Expected values transcribed from the independently reviewed
// launch-room-rules-v1 contract. Never regenerate them from engine output.
// Tuple order: delivery/trust/quality; Mara/Ishan/Leah/Theo.
const roundIds = ['promise', 'consent', 'rumor', 'scope', 'accountability'];
const metricTuple = state => ['delivery', 'trust', 'quality'].map(k => state.metrics[k]);
const relationTuple = state => ['mara', 'ishan', 'leah', 'theo'].map(k => state.relationships[k]);
const difference = (after, before) => Object.fromEntries(
  ['delivery', 'trust', 'quality'].map((key, i) => [key, after[i] - before[i]]),
);

// choice, questions [source,id], entry, commit, next, relationships, flag
const paths = {
  A: {
    title: 'You earned the next step.',
    rows: [
      ['pilot', [['ishan', 'failure'], ['mara', 'mara-pressure']], [50,55,50], [55,60,64], [55,60,67], [49,57,53,53], 'pilot'],
      ['explicit', [['ishan', 'retention-fix'], ['leah', 'data-promise']], [55,60,67], [52,71,76], [52,74,76], [44,61,63,58], 'explicitConsent'],
      ['open', [['ishan', 'full-thread'], ['mara', 'screenshot-source']], [52,74,76], [47,91,79], [47,93,82], [42,69,68,61], 'openContext'],
      ['core', [['theo', 'market-sample'], ['ishan', 'review-bottleneck']], [47,93,82], [49,96,96], [49,96,100], [39,77,70,59], 'sharedCore'],
      ['evidence', [['ishan', 'gate'], ['leah', 'owners']], [49,96,100], [54,100,100], [54,100,100], [39,84,78,62], 'evidenceBrief'],
    ],
  },
  B: {
    title: 'You launched on borrowed time.',
    rows: [
      ['launch', [], [50,55,50], [68,50,36], [68,46,34], [58,42,45,47], 'publicLaunch'],
      ['quiet', [], [68,46,34], [75,39,38], [75,33,38], [62,45,39,43], 'quietFix'],
      ['ignore', [], [75,33,38], [84,19,33], [84,16,28], [65,36,35,38], 'ignoredRumor'],
      ['both', [], [84,16,28], [90,10,21], [84,10,17], [69,26,32,41], 'splitTeam'],
      ['momentum', [], [84,10,17], [99,2,8], [99,2,8], [76,21,25,39], 'momentumBrief'],
    ],
  },
  C: {
    title: 'The room believes you. Now prove it.',
    rows: [
      ['delay', [['mara', 'campaign'], ['ishan', 'rewrite']], [50,55,50], [36,63,68], [40,63,71], [42,60,55,50], 'delay'],
      ['exception', [['theo', 'atlas-retention'], ['leah', 'legal-path']], [40,63,71], [50,63,69], [50,63,67], [46,56,54,57], 'atlasException'],
      ['broker', [['mara', 'mara-reset'], ['leah', 'rumor-boundary']], [50,63,67], [53,68,68], [53,69,68], [53,59,56,55], 'privateReset'],
      ['custom', [['theo', 'contract-terms'], ['leah', 'exception-cost']], [53,69,68], [67,75,58], [71,75,55], [59,52,56,65], 'customBranch'],
      ['shared', [['leah', 'owners'], ['theo', 'customer-next']], [71,75,55], [63,86,63], [63,86,63], [55,56,62,71], 'jointCheckpoint'],
    ],
  },
  brokerControl: {
    title: 'You launched on borrowed time.',
    rows: [
      ['launch', [], [50,55,50], [68,50,36], [68,46,34], [58,42,45,47], 'publicLaunch'],
      ['quiet', [], [68,46,34], [75,39,38], [75,33,38], [62,45,39,43], 'quietFix'],
      ['broker', [], [75,33,38], [78,38,39], [78,39,39], [67,48,39,41], 'privateReset'],
      ['both', [], [78,39,39], [84,33,32], [78,33,28], [71,38,36,44], 'splitTeam'],
      ['momentum', [], [78,33,28], [93,25,19], [93,25,19], [78,33,29,42], 'momentumBrief'],
    ],
  },
};

const typedBroker = 'I will broker a private reset with the leads.';

function runPath(path, typed = false) {
  let state = beginGame(createGame());
  const evidence = [];
  const flags = [];
  for (const [round, row] of path.rows.entries()) {
    const [choice, questions, entry, committed, next, relationships, flag] = row;
    const label = `R${round + 1} ${choice}`;
    assert.equal(state.phase, 'play', label);
    assert.equal(state.round, round, label);
    assert.equal(state.talksLeft, 2, label);
    assert.deepEqual(state.asked, [], label);
    assert.deepEqual(metricTuple(state), entry, `${label} entry`);
    assert.deepEqual(relationTuple(state), round ? path.rows[round - 1][5] : [50,50,50,50], `${label} relationship entry`);
    for (const [person, id] of questions) {
      state = askQuestion(state, person, id);
      evidence.push({ id, person, round });
      assert.deepEqual(metricTuple(state), entry, 'interviews cannot move D/T/Q');
    }
    const words = typed && round === 2 ? typedBroker : '';
    if (words) {
      const before = structuredClone(state);
      interpretDecision(state, 'I need more context before choosing an approach.');
      assert.deepEqual(state, before, 'unconfirmed first interpretation is not a decision');
      assert.equal(interpretDecision(state, 'zzzz qqqq xxxx vvvv nnnn').suggestedId, null);
      assert.deepEqual(state, before, 'no-match input consumes nothing');
      assert.equal(interpretDecision(state, words).text, words);
      assert.deepEqual(state, before, 'editing a proposal consumes nothing');
    }
    state = decide(state, choice, words);
    flags.push(flag);
    assert.equal(state.phase, 'result', label);
    assert.equal(state.history.length, round + 1, label);
    assert.equal(state.talksLeft, 2 - questions.length, label);
    assert.deepEqual(metricTuple(state), committed, `${label} commit`);
    assert.deepEqual(relationTuple(state), relationships, `${label} relationships`);
    assert.deepEqual(state.flags, flags, `${label} accumulated flags`);
    assert.deepEqual(state.evidence.map(({id, person, round}) => ({id, person, round})), evidence, `${label} accumulated evidence`);
    const record = state.history.at(-1);
    assert.equal(record.roundId, roundIds[round]);
    assert.equal(record.choiceId, choice);
    assert.equal(record.writtenDecision, words);
    assert.deepEqual(record.heard, questions.map(([, id]) => id));
    assert.deepEqual(record.delta, difference(committed, entry), `${label} actual immediate change`);
    state = advance(state);
    assert.deepEqual(metricTuple(state), next, `${label} delayed/complete`);
    assert.deepEqual(relationTuple(state), relationships, 'delayed events cannot change relationships');
    assert.deepEqual(state.evidence.map(({id, person, round}) => ({id, person, round})), evidence);
    assert.deepEqual(state.flags, flags);
    if (round < 4) assert.deepEqual(state.history[round].followup.delta, difference(next, committed));
    else assert.equal(state.history[round].followup, null, 'R5 has no delayed effect');
  }
  assert.equal(state.phase, 'complete');
  assert.equal(state.history.length, 5);
  assert.deepEqual(state.history.map(h => h.choiceId), path.rows.map(row => row[0]));
  assert.equal(getDebrief(state).title, path.title);
  return state;
}

for (const name of ['A', 'B', 'C']) {
  test(`approved PATH-${name}: exact per-round rules, evidence, flags, and outcome`, () => {
    runPath(paths[name]);
  });
}

test('PATH-B broker control has a leadership summary instead of the ignored-rumor defect', () => {
  const control = runPath(paths.brokerControl);
  assert.equal(control.flags.includes('ignoredRumor'), false);
  assert.match(control.history[2].followup.text, /joint leadership update/i);
  assert.doesNotMatch(control.history[2].followup.text, /defect reported privately/i);
});

test('PATH-C edit/no-match/confirmed wording preserves preset numeric and evidence outcomes', () => {
  const preset = runPath(paths.C);
  const typed = runPath(paths.C, true);
  // Run/event IDs and private confirmed wording must differ; the underlying
  // authored game effects and collected evidence must not.
  for (const key of ['phase', 'round', 'metrics', 'relationships', 'flags']) {
    assert.deepEqual(typed[key], preset[key], key);
  }
  assert.deepEqual(
    typed.evidence.map(({ id, person, round, text }) => ({ id, person, round, text })),
    preset.evidence.map(({ id, person, round, text }) => ({ id, person, round, text })),
  );
  assert.equal(typed.history[2].writtenDecision, typedBroker);
  assert.equal(preset.history[2].writtenDecision, '');
  assert.deepEqual(typed.history.map(h => h.choiceId), preset.history.map(h => h.choiceId));
});
