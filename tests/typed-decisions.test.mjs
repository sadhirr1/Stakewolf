import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame, beginGame, askQuestion, decide, advance, interpretDecision,
} from '../public/engine.js';

// Literal player-language expectations are reviewed against the typed-decision
// contract. They are not generated from the implementation's cue lists.
const examples = [
  [0, 'pilot', 'I will run a small pilot with a clear review process.'],
  [0, 'launch', 'I will release the product to all users on the announced date.'],
  [0, 'delay', 'I will postpone the announced date for a week.'],
  [1, 'explicit', 'I will ask for explicit consent and provide a deletion path.'],
  [1, 'quiet', 'I will quietly patch the retention default this afternoon.'],
  [1, 'exception', 'I will negotiate an Atlas retention agreement for this account.'],
  [2, 'open', 'I will share the full thread so the team has the context.'],
  [2, 'broker', 'I will broker a private reset with Growth and Engineering.'],
  [2, 'ignore', 'I will ignore the rumor and keep working toward delivery.'],
  [3, 'core', 'I will protect the shared core and improve reliability for all teams.'],
  [3, 'custom', 'I will build a custom Atlas workflow for the anchor account.'],
  [3, 'both', 'I will split the team and run both workstreams in parallel.'],
  [4, 'evidence', 'I will present a bounded recommendation with evidence and a next gate.'],
  [4, 'momentum', 'I will lead with momentum and ask for broad expansion.'],
  [4, 'shared', 'I will bring all leads together for a joint checkpoint.'],
];

function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

function atRound(round, withEvidence = false) {
  let state = beginGame(createGame());
  const prefix = ['pilot', 'explicit', 'open', 'core'];
  for (let index = 0; index < round; index++) {
    state = advance(decide(state, prefix[index]));
  }
  if (withEvidence) {
    const questions = [
      ['ishan', 'failure'], ['ishan', 'retention-fix'], ['ishan', 'full-thread'],
      ['theo', 'market-sample'], ['leah', 'owners'],
    ];
    state = askQuestion(state, ...questions[round]);
  }
  return freeze(state);
}

// Only player wording is expected to differ. Metrics, relationships, evidence,
// flags, consumed conversations, earlier history and delayed outcomes all stay
// in this comparison; none are silently stripped to manufacture equivalence.
function withoutPlayerWording(state) {
  const comparable = structuredClone(state);
  for (const entry of comparable.history) delete entry.writtenDecision;
  return comparable;
}

for (const [round, intent, text] of examples) {
  test(`round ${round + 1}: ${intent} paraphrase previews without mutation and matches preset effects`, () => {
    const state = atRound(round, true);
    const before = structuredClone(state);
    const proposal = interpretDecision(state, text);
    assert.equal(proposal.suggestedId, intent);
    assert.equal(proposal.text, text);
    assert.deepEqual(state, before);

    const typed = freeze(decide(state, intent, proposal.text));
    const preset = freeze(decide(state, intent));
    assert.equal(typed.history.length, round + 1);
    assert.equal(typed.history.at(-1).choiceId, intent);
    assert.equal(typed.history.at(-1).writtenDecision, text);
    assert.equal(preset.history.at(-1).writtenDecision, '');
    assert.deepEqual(typed.history.slice(0, -1), before.history);
    assert.deepEqual(withoutPlayerWording(typed), withoutPlayerWording(preset));
    assert.deepEqual(withoutPlayerWording(advance(typed)), withoutPlayerWording(advance(preset)));
    assert.deepEqual(state, before);
    assert.throws(() => decide(typed, intent, text), /no active decision/i);
  });
}

const clarificationGroups = [
  ['negated actions', [
    [0, 'I will not run a small pilot this week.'],
    [0, 'I do not want to launch now for all users.'],
    [1, 'I will not negotiate a special Atlas contract.'],
    [2, 'I will never ignore the rumor or dismiss the concerns.'],
    [3, 'I will not build a custom Atlas workflow.'],
    [4, 'I will not lead with momentum or demand.'],
  ]],
  ['misleading word fragments', [
    [0, 'I will hire a spaceship mechanic tomorrow.'],
    [0, 'I will ask the latest applicant to return tomorrow.'],
    [3, 'I will discuss the scorecard with the team tomorrow.'],
    [4, 'I will delegate this administrative request tomorrow.'],
  ]],
  ['irrelevant whole words', [
    [0, 'I will visit a public park tomorrow afternoon.'],
    [0, 'I will read 20 books during my vacation.'],
    [0, 'I will mark this test paper tomorrow morning.'],
    [1, 'I will read a quiet book on the train tomorrow.'],
    [2, 'I will schedule a private meeting about office chairs.'],
    [4, 'I will buy a scale for the office kitchen.'],
  ]],
  ['mixed and conditional actions', [
    [0, 'I will run a small limited pilot and release the product to all users.'],
    [0, 'I will run a small pilot with a stop condition.'],
    [0, 'I will run a pilot if the team agrees tomorrow.'],
    [1, 'I will ask for explicit consent or quietly patch the default.'],
    [2, 'I will share the full thread and broker a private reset.'],
    [3, 'I will protect the shared core or build a custom Atlas workflow.'],
    [4, 'I will present evidence and lead with momentum for expansion.'],
  ]],
  ['reported, quoted or unsupported preferences', [
    [0, 'Mara recommends a public launch for all users.'],
    [0, 'I heard that Mara wants a small pilot tomorrow.'],
    [0, 'I will quote "run a small pilot" in the minutes.'],
    [2, 'I was told to share the full thread with everyone.'],
    [0, 'Please run a small pilot with a review process.'],
  ]],
  ['quoted labels are not affirmative actions', [
    [0, "I will use 'pilot' as a label for the lunch menu."],
    [0, 'I will use ‘pilot’ as a label for the lunch menu.'],
  ]],
];

for (const [reason, cases] of clarificationGroups) {
  test(`${reason} require an explicit choice without changing the run`, () => {
    for (const [round, text] of cases) {
      const state = atRound(round);
      const before = structuredClone(state);
      const proposal = interpretDecision(state, text);
      assert.equal(proposal.suggestedId, null, `round ${round + 1}: ${text}`);
      assert.equal(proposal.text, text);
      assert.deepEqual(state, before);
    }
  });
}

test('the player can override a suggestion and can confirm a clarified draft', () => {
  const state = atRound(0);
  const before = structuredClone(state);
  for (const text of [examples[0][2], 'I will not run a small pilot this week.']) {
    const proposal = interpretDecision(state, text);
    const typed = decide(state, 'delay', proposal.text);
    const preset = decide(state, 'delay');
    assert.equal(typed.history.at(-1).choiceId, 'delay');
    assert.equal(typed.history.at(-1).writtenDecision, text);
    assert.deepEqual(withoutPlayerWording(typed), withoutPlayerWording(preset));
    assert.deepEqual(state, before);
  }
});

test('validation uses trimmed minimum and raw UTF-16 maximum without changing state', () => {
  const state = atRound(0);
  const before = structuredClone(state);
  for (const invalid of [null, undefined, 7, [], '', ' '.repeat(30), 'x'.repeat(19), `  ${'x'.repeat(19)}  `, '🙂'.repeat(9)]) {
    assert.throws(() => interpretDecision(state, invalid), /at least 20/i);
  }
  for (const tooLong of ['x'.repeat(1201), ` ${'x'.repeat(1199)} `, '🙂'.repeat(601)]) {
    assert.throws(() => interpretDecision(state, tooLong), /1,200/);
  }
  for (const valid of ['x'.repeat(20), 'x'.repeat(1200), '🙂'.repeat(10), '🙂'.repeat(600)]) {
    const proposal = interpretDecision(state, valid);
    assert.equal(proposal.suggestedId, null);
    assert.equal(proposal.text, valid);
  }
  assert.deepEqual(state, before);
});

test('case and spacing normalization never rewrites the retained player wording', () => {
  const controls = [
    [0, 'pilot', '  I WILL run a SMALL pilot with a clear review process.\n'],
    [0, 'pilot', '  I will run a pilot.\nA careful  review matters to the team.  '],
    [1, 'explicit', 'I will ask teams to opt-in before joining the program.'],
  ];
  for (const [round, intent, text] of controls) {
    const state = atRound(round);
    const before = structuredClone(state);
    const proposal = interpretDecision(state, text);
    assert.equal(proposal.suggestedId, intent);
    assert.equal(proposal.text, text.trim());
    assert.equal(decide(state, intent, proposal.text).history.at(-1).writtenDecision, text.trim());
    assert.deepEqual(state, before);
  }
});

test('internal possessive apostrophes preserve wording without triggering the quote veto', () => {
  const state = atRound(1);
  const before = structuredClone(state);
  for (const text of [
    "I will keep Atlas's retention exception for this account.",
    'I will keep Atlas’s retention exception for this account.',
  ]) {
    const proposal = interpretDecision(state, text);
    assert.equal(proposal.suggestedId, 'exception');
    assert.equal(proposal.text, text);
    assert.deepEqual(state, before);
  }
});
