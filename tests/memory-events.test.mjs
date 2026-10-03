import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame, beginGame, askQuestion, decide, advance, getDebrief,
  getConversationMemory, getMemoryValidationErrors, getPlayerEvents,
} from '../public/engine.js';

// Behavioral expectations come from launch-room-rules-v1, independently of
// engine implementation. Browser rendering and debrief citation UI are separate.
const people = ['mara', 'ishan', 'leah', 'theo'];
const privateWords = 'My private rationale marker: violet heron 731; confirm this chosen approach.';
const sorted = values => [...values].sort();
function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
function playTo(choices, typedFirst = false) {
  let state = beginGame(createGame());
  choices.forEach((choice, index) => {
    state = advance(decide(state, choice, typedFirst && index === 0 ? privateWords : ''));
  });
  return state;
}
function eventFor(state, ruleId, type) {
  const found = state.events.filter(event => event.ruleId === ruleId && (!type || event.type === type));
  assert.equal(found.length, 1, `one ${type || ''} event for ${ruleId}`);
  return found[0];
}

const callbacks = [
  ['mara', ['pilot'], 'memory:mara:promise', 'choice:promise:pilot', /limited|pilot/i],
  ['mara', ['launch'], 'memory:mara:promise', 'choice:promise:launch', /public|date/i],
  ['mara', ['delay'], 'memory:mara:promise', 'choice:promise:delay', /moved|date/i],
  ['ishan', ['pilot'], 'memory:ishan:promise', 'choice:promise:pilot', /containment|review gate/i],
  ['ishan', ['launch'], 'memory:ishan:promise', 'choice:promise:launch', /public launch.*risk/i],
  ['ishan', ['delay'], 'memory:ishan:promise', 'choice:promise:delay', /review time.*rewrite/i],
  ['leah', ['pilot', 'explicit'], 'memory:leah:consent', 'choice:consent:explicit', /explicit consent/i],
  ['leah', ['pilot', 'quiet'], 'memory:leah:consent', 'choice:consent:quiet', /without explaining.*recordings/i],
  ['leah', ['pilot', 'exception'], 'memory:leah:consent', 'choice:consent:exception', /separate Atlas policy/i],
  ['theo', ['pilot', 'explicit', 'open', 'core'], 'memory:theo:scope', 'choice:scope:core', /shared core.*follow-up/i],
  ['theo', ['pilot', 'explicit', 'open', 'custom'], 'memory:theo:scope', 'choice:scope:custom', /Atlas.*conditional/i],
  ['theo', ['pilot', 'explicit', 'open', 'both'], 'memory:theo:scope', 'choice:scope:both', /split.*bottleneck/i],
];

for (const [person, choices, ruleId, decisionRule, meaning] of callbacks) {
  test(`memory: ${person} recalls ${choices.at(-1)} from permitted recorded events`, () => {
    const state = freeze(playTo(choices, true));
    const before = structuredClone(state);
    const memory = getConversationMemory(state, person);
    assert.ok(memory);
    assert.equal(memory.ruleId, ruleId);
    assert.match(memory.text, meaning);
    assert.doesNotMatch(memory.text, /violet heron 731/);
    const decision = eventFor(state, decisionRule, 'decision');
    assert.ok(memory.sourceEventIds.includes(decision.eventId));
    const recorded = eventFor(state, ruleId, 'memory');
    assert.equal(memory.eventId, recorded.eventId);
    for (const id of memory.sourceEventIds) {
      assert.ok(state.events.some(event => event.eventId === id), 'memory source exists');
      assert.ok(state.knowledge[person].includes(id), 'speaker knows each cited source');
    }
    assert.deepEqual(getConversationMemory(state, person), memory);
    assert.deepEqual(getMemoryValidationErrors(state, person), []);
    assert.deepEqual(state, before, 'memory reads append no events and move no scores');
  });
}

test('no callback is fabricated for a fresh round or an unrelated stakeholder', () => {
  const first = freeze(beginGame(createGame()));
  for (const person of people) assert.equal(getConversationMemory(first, person), null);
  const second = freeze(playTo(['pilot']));
  assert.equal(getConversationMemory(second, 'leah'), null);
  assert.equal(getConversationMemory(second, 'theo'), null);
});

test('question, input, decision, and delayed events preserve an append-only causal record', () => {
  let state = freeze(beginGame(createGame()));
  const transitions = [
    s => askQuestion(s, 'ishan', 'failure'),
    s => decide(s, 'pilot', privateWords),
    s => advance(s),
    s => askQuestion(s, 'leah', 'data-promise'),
    s => decide(s, 'explicit'),
    s => advance(s),
  ];
  for (const transition of transitions) {
    const before = structuredClone(state);
    const next = freeze(transition(state));
    assert.deepEqual(next.events.slice(0, state.events.length), state.events);
    assert.deepEqual(state, before, 'transition must not mutate its input');
    assert.equal(new Set(next.events.map(event => event.eventId)).size, next.events.length);
    const prior = new Map();
    for (const event of next.events) {
      assert.equal(event.runId, next.runId);
      assert.equal(event.rulesVersion, 'launch-room-rules-v1');
      assert.ok(Number.isInteger(event.sequence));
      for (const sourceId of event.sourceEventIds) {
        assert.ok(prior.has(sourceId), 'a cause must precede the event that cites it');
      }
      if (prior.size) assert.ok(event.sequence > [...prior.values()].at(-1));
      prior.set(event.eventId, event.sequence);
    }
    state = next;
  }
  const decision = eventFor(state, 'choice:promise:pilot', 'decision');
  assert.deepEqual(decision.details.reactions, state.history[0].reactions, 'reaction claims have explicit decision-event provenance');
  const delayed = eventFor(state, 'delay:promise:pilot', 'delayed');
  assert.ok(delayed.sourceEventIds.includes(decision.eventId));
  assert.deepEqual(delayed.effects.metrics.requested, { delivery: 0, trust: 0, quality: 3 });
  assert.deepEqual(delayed.effects.metrics.actual, { delivery: 0, trust: 0, quality: 3 });
});

test('private input and interviews never become the other stakeholders\' raw knowledge', () => {
  const heard = askQuestion(beginGame(createGame()), 'ishan', 'failure');
  const state = freeze(decide(heard, 'pilot', privateWords));
  const question = state.events.find(event => event.type === 'question');
  assert.ok(question);
  assert.deepEqual(sorted(question.audience), ['ishan', 'player']);
  const input = state.events.find(event => event.type === 'input' && event.details.text === privateWords);
  assert.ok(input);
  assert.deepEqual(input.audience, ['player']);
  assert.equal(input.details.mode, 'typed');
  const decision = eventFor(state, 'choice:promise:pilot', 'decision');
  assert.equal(decision.details.inputEventId, input.eventId);
  assert.deepEqual(sorted(decision.audience), sorted(['player', ...people]));
  for (const person of people) {
    assert.equal(state.knowledge[person].includes(input.eventId), false);
    assert.equal(JSON.stringify(state.events.filter(event => event.audience.includes(person))).includes(privateWords), false);
    if (person !== 'ishan') assert.equal(state.knowledge[person].includes(question.eventId), false);
  }
  assert.equal(state.history[0].writtenDecision, privateWords);
  const visible = getPlayerEvents(state);
  assert.ok(visible.some(event => event.eventId === input.eventId));
  assert.ok(visible.every(event => event.playerVisible));
  const count = state.events.length;
  visible.pop();
  assert.equal(state.events.length, count, 'player-event projection cannot mutate stored events');
});

test('open disclosure grants the note without inventing interviews or a listening bonus', () => {
  const original = playTo(['pilot', 'explicit']);
  const state = freeze(decide(original, 'open'));
  const note = eventFor(state, 'story:planning-note');
  const disclosure = eventFor(state, 'disclosure:rumor:open');
  assert.deepEqual(sorted(disclosure.audience), sorted(['player', ...people, 'engineering-channel']));
  assert.ok(disclosure.sourceEventIds.includes(note.eventId));
  for (const person of ['player', ...people]) assert.ok(state.knowledge[person].includes(note.eventId));
  assert.deepEqual(state.evidence, []);
  assert.deepEqual(state.asked, []);
  assert.equal(state.talksLeft, 2);
  assert.equal(state.history[2].bonus, null);
  assert.deepEqual(state.metrics, { delivery: 43, trust: 87, quality: 74 });
  assert.equal(state.events.filter(event => event.type === 'question').length, 0);
});

test('broker retains Leah\'s note knowledge while Theo only receives a leadership summary', () => {
  const original = playTo(['pilot', 'explicit']);
  const note = eventFor(original, 'story:planning-note');
  assert.ok(original.knowledge.leah.includes(note.eventId));
  assert.equal(original.knowledge.theo.includes(note.eventId), false);
  const result = decide(original, 'broker');
  const disclosure = eventFor(result, 'disclosure:rumor:broker');
  assert.deepEqual(sorted(disclosure.audience), ['ishan', 'mara', 'player']);
  for (const person of ['player', 'mara', 'ishan', 'leah']) assert.ok(result.knowledge[person].includes(note.eventId));
  assert.equal(result.knowledge.theo.includes(note.eventId), false);
  const state = advance(result);
  const summary = eventFor(state, 'delay:rumor:broker', 'delayed');
  for (const person of people) assert.ok(state.knowledge[person].includes(summary.eventId));
  for (const person of ['leah', 'theo']) assert.equal(state.knowledge[person].includes(disclosure.eventId), false);
  assert.equal(state.knowledge.theo.includes(note.eventId), false);
  assert.deepEqual(state.evidence, []);
});

test('ignored rumor preserves the private defect boundary and does not become verified truth', () => {
  const state = freeze(playTo(['launch', 'quiet', 'ignore']));
  const rumor = eventFor(state, 'story:rumor-circulates');
  assert.match(rumor.evidenceStatus, /unverified/i);
  const defect = eventFor(state, 'delay:rumor:ignore', 'delayed');
  assert.deepEqual(sorted(defect.audience), ['ishan', 'player']);
  assert.ok(state.knowledge.ishan.includes(defect.eventId));
  for (const person of ['mara', 'leah', 'theo']) assert.equal(state.knowledge[person].includes(defect.eventId), false);
  assert.equal(state.events.some(event => event.ruleId.startsWith('disclosure:rumor:')), false);
});

test('missing or contradictory predecessor records cannot create a default consequence', () => {
  const valid = decide(beginGame(createGame()), 'pilot');
  const corruptions = [
    ['missing history', state => { state.history = []; }],
    ['duplicate history', state => { state.history.push(structuredClone(state.history[0])); }],
    ['contradictory history', state => { state.history[0].choiceId = 'launch'; }],
    ['missing flag', state => { state.flags = []; }],
    ['conflicting flags', state => { state.flags.push('publicLaunch'); }],
    ['missing decision event', state => { state.events = state.events.filter(event => event.type !== 'decision'); }],
  ];
  for (const [label, corrupt] of corruptions) {
    const state = structuredClone(valid);
    corrupt(state);
    freeze(state);
    const before = structuredClone(state);
    assert.throws(() => advance(state), error => error.code === 'INVALID_STATE', label);
    assert.deepEqual(state, before, `${label}: rejecting invalid state must not mutate it`);
  }
});

test('invalid memory predecessors are reported and never replaced with invented callbacks', () => {
  const state = playTo(['launch']);
  state.history = [];
  freeze(state);
  const before = structuredClone(state);
  assert.equal(getConversationMemory(state, 'mara'), null);
  assert.equal(getConversationMemory(state, 'ishan'), null);
  assert.ok(getMemoryValidationErrors(state, 'mara').length > 0);
  assert.ok(getMemoryValidationErrors(state, 'ishan').length > 0);
  assert.deepEqual(state, before);
});

test('completion cannot certify five rounds when an earlier decision record is invalid', () => {
  const valid = decide(playTo(['pilot', 'explicit', 'open', 'core']), 'evidence');
  const corruptions = [
    ['missing R1', state => { state.history.shift(); }],
    ['duplicate R1', state => { state.history.push(structuredClone(state.history[0])); }],
    ['contradictory R1', state => { state.history[0].choiceId = 'launch'; }],
    ['missing R1 flag', state => { state.flags = state.flags.filter(flag => flag !== 'pilot'); }],
  ];
  for (const [label, corrupt] of corruptions) {
    const state = structuredClone(valid);
    corrupt(state);
    freeze(state);
    const before = structuredClone(state);
    assert.throws(() => advance(state), error => error.code === 'INVALID_STATE', label);
    assert.deepEqual(state, before, `${label}: no completion event or state mutation`);
  }
});

test('a retained memory cannot bypass revoked source knowledge or a forged audience', () => {
  const cases = [
    { person: 'mara', choices: ['pilot'], source: 'choice:promise:pilot' },
    { person: 'theo', choices: ['pilot', 'explicit', 'open', 'core'], source: 'delay:scope:core' },
  ];
  for (const { person, choices, source } of cases) {
    const state = playTo(choices);
    const memory = getConversationMemory(state, person);
    assert.ok(memory);
    const sourceId = eventFor(state, source).eventId;
    state.knowledge[person] = state.knowledge[person].filter(id => id !== sourceId);
    assert.ok(state.knowledge[person].includes(memory.eventId), 'the memory itself was deliberately retained');
    freeze(state);
    const before = structuredClone(state);
    assert.equal(getConversationMemory(state, person), null, `${person} must know the cited source`);
    assert.ok(getMemoryValidationErrors(state, person).length > 0);
    assert.deepEqual(state, before);
  }
  const forged = playTo(['pilot']);
  eventFor(forged, 'memory:mara:promise', 'memory').audience.push('theo');
  freeze(forged);
  assert.equal(getConversationMemory(forged, 'mara'), null);
  assert.ok(getMemoryValidationErrors(forged, 'mara').length > 0);
});

test('fresh attempts have separate identities and cannot reuse prior evidence or memories', () => {
  const previous = freeze(playTo(['pilot', 'explicit', 'open', 'core']));
  const fresh = freeze(beginGame(createGame()));
  assert.notEqual(fresh.runId, previous.runId);
  const oldIds = new Set(previous.events.map(event => event.eventId));
  assert.ok(fresh.events.every(event => !oldIds.has(event.eventId)));
  assert.deepEqual(fresh.history, []);
  assert.deepEqual(fresh.evidence, []);
  assert.deepEqual(fresh.metrics, { delivery: 50, trust: 55, quality: 50 });
  for (const person of people) {
    assert.equal(getConversationMemory(fresh, person), null);
    assert.ok(fresh.knowledge[person].every(id => !oldIds.has(id)));
  }
});

test('bonus provenance distinguishes positive marginal benefit from a zero-effect cap', () => {
  let state = beginGame(createGame());
  const choices = ['pilot', 'explicit', 'open', 'core'];
  const questions = [['ishan', 'failure'], ['ishan', 'retention-fix'], ['ishan', 'full-thread'], ['theo', 'market-sample']];
  for (const [index, choice] of choices.entries()) {
    state = askQuestion(state, ...questions[index]);
    state = advance(decide(state, choice));
  }
  assert.deepEqual(state.metrics, { delivery: 49, trust: 96, quality: 100 });
  const pilot = eventFor(state, 'choice:promise:pilot', 'decision');
  assert.equal(pilot.bonus.questionId, 'failure');
  assert.equal(pilot.bonus.requested, 5);
  assert.equal(pilot.bonus.marginalBenefit, 5);
  const cappedDelay = eventFor(state, 'delay:scope:core', 'delayed');
  assert.deepEqual(cappedDelay.effects.metrics.before, { delivery: 49, trust: 96, quality: 96 });
  assert.deepEqual(cappedDelay.effects.metrics.requested, { delivery: 0, trust: 0, quality: 5 });
  assert.deepEqual(cappedDelay.effects.metrics.actual, { delivery: 0, trust: 0, quality: 4 });
  const completed = advance(decide(askQuestion(state, 'leah', 'owners'), 'shared'));
  const shared = eventFor(completed, 'choice:accountability:shared', 'decision');
  assert.equal(shared.bonus.questionId, 'owners');
  assert.equal(shared.bonus.eligible, true);
  assert.equal(shared.bonus.requested, 4);
  assert.equal(shared.bonus.marginalBenefit, 0);
  assert.equal(completed.history[4].bonus, null, 'a capped bonus must not trigger the Evidence mattered display');
  assert.deepEqual(shared.effects.metrics.requested, { delivery: -8, trust: 11, quality: 8 });
  assert.deepEqual(shared.effects.metrics.actual, { delivery: -8, trust: 4, quality: 0 });
  assert.deepEqual(completed.metrics, { delivery: 41, trust: 100, quality: 100 });
  assert.match(getDebrief(completed).reflections.find(row => row.id === 'evidence-bonus').text, /4 decisions used/);
});
