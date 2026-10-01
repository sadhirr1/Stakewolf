import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame, beginGame, currentRound, askQuestion,
  decide, advance, interpretDecision,
} from '../public/engine.js';

// Regression for SCRUM-7's source-attribution contract. These are authored
// scenario facts, not a test of the still-pending conditional memory feature.
const firstDecisions = [
  ['pilot', 'I choose a small pilot with limited access and a clear stop condition.'],
  ['launch', 'Launch publicly on the promised date and accept the immediate risk.'],
  ['delay', 'Delay the launch until Engineering has reproduced and fixed the defect.'],
];

function reachRumor(choice, wording = '') {
  let state = beginGame(createGame());
  if (wording) {
    const before = structuredClone(state);
    const proposal = interpretDecision(state, wording);
    assert.deepEqual(state, before, 'reviewing a typed decision must not commit it');
    assert.equal(proposal.text, wording);
    // The player confirms this approach; matching is only a suggestion.
    state = decide(state, choice, proposal.text);
  } else {
    state = decide(state, choice);
  }
  state = advance(state);
  state = advance(decide(state, 'explicit'));
  assert.equal(currentRound(state).id, 'rumor');
  return state;
}

for (const [choice, wording] of firstDecisions) {
  for (const mode of ['preset', 'typed']) {
    test(`${mode} ${choice}: the crop concerns a prior team note, not invented player wording`, () => {
      const original = reachRumor(choice, mode === 'typed' ? wording : '');
      const firstRecord = structuredClone(original.history[0]);
      const round = currentRound(original);
      assert.doesNotMatch(`${round.title} ${round.description}`, /your (?:decision|planning thread)/i);
      assert.match(round.description, /team planning note/i);
      assert.match(round.description, /before|predat/i);

      let heard = askQuestion(original, 'ishan', 'full-thread');
      heard = askQuestion(heard, 'mara', 'screenshot-source');
      const source = heard.evidence.find(e => e.id === 'full-thread');
      const admission = heard.evidence.find(e => e.id === 'screenshot-source');
      assert.deepEqual(
        { id: source.id, person: source.person, round: source.round, kind: source.kind },
        { id: 'full-thread', person: 'ishan', round: 2, kind: 'Source document' },
      );
      assert.match(source.answer, /team (?:planning )?note/i);
      assert.match(source.text, /team planning note/i);
      assert.doesNotMatch(source.answer, /you wrote/i);
      assert.match(source.answer, /predat|before/i);
      assert.doesNotMatch(admission.answer, /campaign change/i);
      assert.match(admission.answer, /team (?:planning )?note/i);
      assert.match(admission.text, /unverified/i, 'Mara cannot establish who circulated it further');
      assert.equal(admission.kind, 'Firsthand admission');

      const committed = decide(heard, 'open');
      assert.doesNotMatch(committed.history[2].reactions.ishan, /you were asking/i);
      assert.match(committed.history[2].reactions.ishan, /note/i);
      assert.deepEqual(committed.history[2].heard, ['full-thread', 'screenshot-source']);
      assert.deepEqual(committed.history[0], firstRecord, 'later narrative must not rewrite the player record');
      assert.equal(committed.history[0].writtenDecision, mode === 'typed' ? wording : '');
      const later = advance(committed);
      assert.deepEqual(later.evidence, heard.evidence, 'the source account remains stable after the next transition');
      assert.deepEqual(later.history[0], firstRecord);
      assert.equal(original.evidence.length, 0);
    });
  }
}

test('correcting the source attribution preserves the full-thread bonus and delayed effects', () => {
  // Independent arithmetic: pilot 55/60/59 -> quality +3;
  // explicit -7/+11/+9 -> trust +3 = 48/74/71 before the rumor.
  const original = reachRumor('pilot');
  assert.deepEqual(original.metrics, { delivery: 48, trust: 74, quality: 71 });
  const control = decide(original, 'open');
  const heard = askQuestion(original, 'ishan', 'full-thread');
  const informed = decide(heard, 'open');
  assert.deepEqual(control.metrics, { delivery: 43, trust: 87, quality: 74 });
  assert.deepEqual(informed.metrics, { delivery: 43, trust: 91, quality: 74 });
  assert.deepEqual(informed.history[2].delta, { delivery: -5, trust: 17, quality: 3 });
  assert.equal(control.history[2].bonus, null);
  assert.equal(typeof informed.history[2].bonus, 'string');
  assert.deepEqual(informed.history[2].heard, ['full-thread']);
  assert.deepEqual(informed.relationships, { mara: 38, ishan: 65, leah: 66, theo: 61 });
  const later = advance(informed);
  assert.deepEqual(later.metrics, { delivery: 43, trust: 93, quality: 77 });
  assert.deepEqual(later.history[2].followup.delta, { delivery: 0, trust: 2, quality: 3 });
  assert.deepEqual(later.history[2].heard, ['full-thread']);
});
