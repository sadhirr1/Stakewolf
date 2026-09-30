import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame, beginGame, currentRound, askQuestion, decide,
  advance, interpretDecision, getDebrief,
} from '../public/engine.js';

// Expectations are hand-calculated from the authored scenario, including its
// delayed events. Do not regenerate these values from engine output.
function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

const start = () => beginGame(freeze(createGame()));
const metrics = (delivery, trust, quality) => ({ delivery, trust, quality });

test('a fresh attempt starts in briefing and rejects out-of-phase actions', () => {
  const briefing = freeze(createGame());
  assert.equal(briefing.phase, 'briefing');
  assert.equal(briefing.round, 0);
  assert.deepEqual(briefing.metrics, metrics(50, 55, 50));
  assert.deepEqual(briefing.relationships, { mara: 50, ishan: 50, leah: 50, theo: 50 });
  assert.throws(() => decide(briefing, 'pilot'), /no active decision/i);
  assert.throws(() => askQuestion(briefing, 'ishan', 'failure'), /no active decision/i);
  assert.throws(() => interpretDecision(briefing, 'A small pilot will contain the risk.'), /no active decision/i);
  assert.throws(() => advance(briefing), /current decision/i);
  assert.throws(() => getDebrief(briefing), /finish all five/i);
  const playing = freeze(beginGame(briefing));
  assert.equal(playing.phase, 'play');
  assert.equal(briefing.phase, 'briefing');
  assert.throws(() => beginGame(playing), /already started/i);
  assert.throws(() => advance(playing), /current decision/i);
  assert.throws(() => decide(playing, 'not-a-choice'), /valid approach/i);
});

test('conversations add attributable evidence, reject duplicates, and enforce the round budget', () => {
  const original = freeze(start());
  const heard = freeze(askQuestion(original, 'ishan', 'failure'));
  assert.equal(heard.talksLeft, 1);
  assert.equal(heard.relationships.ishan, 52);
  assert.deepEqual(heard.evidence.map(({ id, person, round, kind }) => ({ id, person, round, kind })), [
    { id: 'failure', person: 'ishan', round: 0, kind: 'Test evidence' },
  ]);
  assert.match(heard.evidence[0].text, /3 of 40/);
  assert.equal(original.evidence.length, 0);
  assert.equal(original.talksLeft, 2);
  assert.throws(() => askQuestion(heard, 'ishan', 'failure'), /already asked/i);
  assert.throws(() => askQuestion(heard, 'mara', 'failure'), /question from this round/i);
  assert.throws(() => askQuestion(heard, 'unknown', 'failure'), /question from this round/i);

  const exhausted = freeze(askQuestion(heard, 'mara', 'campaign'));
  assert.equal(exhausted.talksLeft, 0);
  assert.deepEqual(exhausted.asked, ['failure', 'campaign']);
  assert.throws(() => askQuestion(exhausted, 'theo', 'atlas-need'), /both conversations/i);
  const result = freeze(decide(exhausted, 'pilot'));
  assert.throws(() => askQuestion(result, 'theo', 'atlas-need'), /no active decision/i);
  const nextRound = freeze(advance(result));
  assert.equal(nextRound.talksLeft, 2);
  assert.deepEqual(nextRound.asked, []);
  assert.equal(nextRound.evidence.length, 2);
  assert.throws(() => askQuestion(nextRound, 'ishan', 'failure'), /question from this round/i);
  assert.equal(askQuestion(nextRound, 'ishan', 'retention-fix').talksLeft, 1);
});

test('hearing the failure evidence improves the pilot by exactly five quality points', () => {
  const unheard = freeze(start());
  const informed = freeze(askQuestion(unheard, 'ishan', 'failure'));
  const ordinaryPilot = freeze(decide(unheard, 'pilot'));
  const informedPilot = freeze(decide(informed, 'pilot'));
  assert.deepEqual(ordinaryPilot.metrics, metrics(55, 60, 59));
  assert.deepEqual(informedPilot.metrics, metrics(55, 60, 64));
  assert.equal(ordinaryPilot.history[0].bonus, null);
  assert.match(informedPilot.history[0].bonus, /documented failure/i);
  assert.deepEqual(informedPilot.history[0].heard, ['failure']);
  assert.deepEqual(informedPilot.history[0].delta, metrics(5, 5, 14));
  assert.deepEqual(unheard.metrics, metrics(50, 55, 50));
  assert.equal(informed.history.length, 0);
});

test('a launch consequence arrives at the next round once and stays on its originating decision', () => {
  const result = freeze(decide(freeze(start()), 'launch'));
  assert.deepEqual(result.metrics, metrics(68, 50, 36));
  assert.equal(result.history[0].followup, null);
  assert.throws(() => decide(result, 'launch'), /no active decision/i);
  const afterArrival = freeze(advance(result));
  assert.equal(afterArrival.round, 1);
  assert.deepEqual(afterArrival.metrics, metrics(68, 46, 34));
  assert.deepEqual(afterArrival.arrival.delta, metrics(0, -4, -2));
  assert.deepEqual(afterArrival.history[0].followup, afterArrival.arrival);
  assert.match(afterArrival.arrival.text, /public-launch commitment/);
  assert.throws(() => advance(afterArrival), /current decision/i);
  const afterNextChoice = freeze(decide(afterArrival, 'explicit'));
  assert.deepEqual(afterNextChoice.metrics, metrics(61, 57, 43));
  assert.deepEqual(afterNextChoice.history[0].followup.delta, metrics(0, -4, -2));
  assert.equal(afterNextChoice.history[1].followup, null);
  assert.equal(result.history[0].followup, null);

  const control = freeze(advance(freeze(decide(freeze(start()), 'pilot'))));
  assert.deepEqual(control.metrics, metrics(55, 60, 62));
  assert.deepEqual(control.arrival.delta, metrics(0, 0, 3));
  assert.doesNotMatch(control.arrival.text, /public-launch commitment/);
});

test('typed review is side-effect free and only the confirmed approach changes state', () => {
  const state = freeze(start());
  const original = structuredClone(state);
  const text = '  I propose a small pilot with limited access for customers.  ';
  const proposal = interpretDecision(state, text);
  assert.equal(proposal.suggestedId, 'pilot');
  assert.equal(proposal.text, text.trim());
  assert.deepEqual(state, original);
  assert.equal(state.history.length, 0);
  // The player may override the keyword suggestion at confirmation.
  const typed = freeze(decide(state, 'delay', proposal.text));
  const preset = decide(state, 'delay');
  assert.deepEqual(typed.metrics, metrics(36, 59, 68));
  assert.equal(typed.history[0].writtenDecision, text.trim());
  preset.history[0].writtenDecision = text.trim();
  assert.deepEqual(typed, preset);
  assert.deepEqual(state, original);
});

test('ambiguous and irrelevant input asks for selection without committing a decision', () => {
  const state = freeze(start());
  assert.equal(interpretDecision(state, 'pilot or delay; I need more context.').suggestedId, null);
  assert.equal(interpretDecision(state, 'Bananas are yellow and mountains are tall.').suggestedId, null);
  assert.throws(() => interpretDecision(state, 'Too short'), /at least 20/i);
  assert.throws(() => interpretDecision(state, 'x'.repeat(1201)), /1,200/);
  assert.throws(() => decide(state, 'pilot', 'Too short'), /more detail/i);
  assert.throws(() => decide(state, 'pilot', 'x'.repeat(1201)), /1,200/);
  assert.equal(state.history.length, 0);
  assert.deepEqual(state.metrics, metrics(50, 55, 50));
});

const paths = [
  {
    name: 'informed pilot',
    choices: ['pilot', 'explicit', 'open', 'core', 'evidence'],
    questions: [['ishan', 'failure'], ['ishan', 'retention-fix'], ['ishan', 'full-thread'], ['theo', 'market-sample'], ['ishan', 'gate']],
    immediate: [metrics(55, 60, 64), metrics(52, 71, 76), metrics(47, 91, 79), metrics(49, 96, 96), metrics(54, 100, 100)],
    afterAdvance: [metrics(55, 60, 67), metrics(52, 74, 76), metrics(47, 93, 82), metrics(49, 96, 100), metrics(54, 100, 100)],
    title: 'You earned the next step.',
  },
  {
    name: 'unchecked momentum',
    choices: ['launch', 'quiet', 'ignore', 'both', 'momentum'],
    questions: [],
    immediate: [metrics(68, 50, 36), metrics(75, 39, 38), metrics(84, 19, 33), metrics(90, 10, 21), metrics(99, 2, 8)],
    afterAdvance: [metrics(68, 46, 34), metrics(75, 33, 38), metrics(84, 16, 28), metrics(84, 10, 17), metrics(99, 2, 8)],
    title: 'You launched on borrowed time.',
  },
  {
    name: 'cautious consensus',
    choices: ['delay', 'explicit', 'broker', 'core', 'shared'],
    questions: [],
    immediate: [metrics(36, 59, 68), metrics(33, 70, 80), metrics(36, 78, 81), metrics(33, 82, 95), metrics(25, 89, 100)],
    afterAdvance: [metrics(40, 59, 71), metrics(33, 73, 80), metrics(36, 79, 81), metrics(33, 82, 100), metrics(25, 89, 100)],
    title: 'Credibility needs a deadline.',
  },
];

for (const path of paths) {
  test(`five-round reference path: ${path.name}`, () => {
    let state = freeze(start());
    for (let round = 0; round < 5; round++) {
      assert.equal(state.round, round);
      assert.equal(state.phase, 'play');
      assert.ok(currentRound(state).choices.length >= 2);
      if (path.questions[round]) state = freeze(askQuestion(state, ...path.questions[round]));
      state = freeze(decide(state, path.choices[round]));
      assert.deepEqual(state.metrics, path.immediate[round], `immediate round ${round + 1}`);
      assert.equal(state.history.length, round + 1);
      assert.equal(state.history[round].choiceId, path.choices[round]);
      assert.equal(state.phase, 'result');
      assert.throws(() => getDebrief(state), /finish all five/i);
      state = freeze(advance(state));
      assert.deepEqual(state.metrics, path.afterAdvance[round], `after advance ${round + 1}`);
    }
    assert.equal(state.phase, 'complete');
    assert.equal(state.round, 4);
    assert.equal(state.history.filter(row => row.followup).length, 4);
    assert.equal(state.history[4].followup, null);
    assert.equal(getDebrief(state).title, path.title);
    assert.throws(() => advance(state), /current decision/i);
    assert.throws(() => decide(state, 'evidence'), /no active decision/i);
    assert.throws(() => askQuestion(state, 'ishan', 'gate'), /no active decision/i);
    if (path.name === 'informed pilot') {
      assert.deepEqual(state.history[3].followup.delta, metrics(0, 0, 4));
      assert.deepEqual(state.history[4].delta, metrics(5, 4, 0));
      assert.deepEqual(state.relationships, { mara: 35, ishan: 82, leah: 74, theo: 62 });
      assert.match(getDebrief(state).reflections[0].text, /5 of 10.*2 of 4/);
    }
  });
}

test('new attempts and alternate branches remain isolated from earlier state', () => {
  const sharedStart = freeze(start());
  const pilot = freeze(decide(sharedStart, 'pilot'));
  const launch = freeze(decide(sharedStart, 'launch'));
  const fresh = createGame();
  assert.deepEqual(pilot.flags, ['pilot']);
  assert.deepEqual(launch.flags, ['publicLaunch']);
  assert.deepEqual(sharedStart.flags, []);
  assert.deepEqual(fresh.metrics, metrics(50, 55, 50));
  assert.deepEqual(fresh.history, []);
  assert.deepEqual(fresh.evidence, []);
  fresh.relationships.mara = 0;
  fresh.flags.push('unrelated');
  assert.equal(createGame().relationships.mara, 50);
  assert.deepEqual(createGame().flags, []);
  assert.deepEqual(decide(sharedStart, 'pilot'), pilot);
});

test('all 243 authored preset paths finish with bounded metrics and distinct decision histories', () => {
  const rounds = [
    ['pilot', 'launch', 'delay'],
    ['explicit', 'quiet', 'exception'],
    ['open', 'broker', 'ignore'],
    ['core', 'custom', 'both'],
    ['evidence', 'momentum', 'shared'],
  ];
  const combinations = rounds.reduce(
    (paths, choices) => paths.flatMap(path => choices.map(choice => [...path, choice])),
    [[]],
  );
  assert.equal(combinations.length, 243);
  const histories = new Set();
  for (const choices of combinations) {
    let state = freeze(start());
    for (const choice of choices) {
      state = freeze(decide(state, choice));
      assert.equal(state.phase, 'result');
      state = freeze(advance(state));
      for (const value of [...Object.values(state.metrics), ...Object.values(state.relationships)]) {
        assert.ok(Number.isFinite(value) && value >= 0 && value <= 100, choices.join(' / '));
      }
    }
    assert.equal(state.phase, 'complete');
    assert.equal(state.history.length, 5);
    assert.deepEqual(state.history.map(row => row.round), [0, 1, 2, 3, 4]);
    assert.deepEqual(state.history.map(row => row.choiceId), choices);
    assert.equal(typeof getDebrief(state).title, 'string');
    histories.add(JSON.stringify(state.history.map(row => row.choiceId)));
  }
  assert.equal(histories.size, 243);
});
