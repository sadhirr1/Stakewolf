import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame, beginGame, askQuestion, decide, advance, interpretDecision,
  getConversationMemory, getDebrief, formatDecisionRecord,
} from '../public/engine.js';

// Combined contracts: conservative matching chooses no action by itself; the
// confirmed approach owns effects and memories, while wording stays private.
const choices = ['pilot', 'explicit', 'open', 'core', 'evidence'];
const questions = [
  ['ishan', 'failure'], ['ishan', 'retention-fix'], ['ishan', 'full-thread'],
  ['theo', 'market-sample'], ['ishan', 'gate'],
];
const wording = [
  '  I will not run a small pilot this week.\n',
  'I will ask for explicit consent and provide a deletion path.',
  'I will share the full thread and broker a private reset.',
  'I will protect the shared core and improve reliability for all teams.',
  'I will present a bounded recommendation with evidence and a next gate.',
];
const suggestions = [null, 'explicit', null, 'core', 'evidence'];
function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
function event(state, ruleId) {
  const matches = state.events.filter(row => row.ruleId === ruleId);
  assert.equal(matches.length, 1, `one recorded ${ruleId}`);
  return matches[0];
}
function playPrefix(selected) {
  let state = beginGame(createGame());
  for (const id of selected) state = advance(decide(state, id));
  return state;
}
function assertPrivateInput(state, input, text) {
  assert.equal(input.runId, state.runId);
  assert.equal(input.actor, 'player');
  assert.equal(input.evidenceStatus, 'confirmed-input');
  assert.equal(input.playerVisible, true);
  assert.equal(input.details.mode, 'typed');
  assert.equal(input.details.text, text);
  assert.equal(state.events.filter(row => row.type === 'input' && row.round === input.round).length, 1);
  const decision = state.events.find(row => row.type === 'decision' && row.round === input.round);
  assert.ok(decision);
  assert.equal(decision.details.inputEventId, input.eventId);
  assert.ok(input.sequence < decision.sequence);
  assert.equal(state.events[input.sequence - 1].eventId, input.eventId);
  assert.deepEqual(input.audience, ['player']);
  assert.ok(state.knowledge.player.includes(input.eventId));
  for (const person of ['mara', 'ishan', 'leah', 'theo']) {
    assert.equal(state.knowledge[person].includes(input.eventId), false);
    assert.equal(JSON.stringify(state.events.filter(row => row.audience.includes(person))).includes(text), false);
  }
  assert.deepEqual(input.effects.metrics.actual, { delivery: 0, trust: 0, quality: 0 });
  assert.deepEqual(input.effects.relationships.actual, { mara: 0, ishan: 0, leah: 0, theo: 0 });
  assert.deepEqual(input.effects.metrics.requested, { delivery: 0, trust: 0, quality: 0 });
  assert.deepEqual(input.effects.relationships.requested, { mara: 0, ishan: 0, leah: 0, theo: 0 });
  assert.deepEqual(input.effects.metrics.before, input.effects.metrics.after);
  assert.deepEqual(input.effects.relationships.before, input.effects.relationships.after);
}
function assertEquivalent(typed, preset) {
  const comparable = structuredClone(typed);
  const typedInputs = typed.events.filter(row => row.type === 'input');
  const presetInputs = preset.events.filter(row => row.type === 'input');
  assert.equal(typedInputs.length, presetInputs.length);
  assert.equal(typedInputs.length, typed.history.length);
  for (const [index, input] of typedInputs.entries()) {
    assert.equal(input.round, index + 1);
    assertPrivateInput(typed, input, wording[index].trim());
    const other = presetInputs[index];
    assert.equal(input.eventId, other.eventId, 'shared predecessor preserves exact causal IDs');
    assert.equal(other.details.mode, 'preset');
    assert.equal(other.details.text, '');
    assert.deepEqual(other.audience, ['player']);
    assert.equal(preset.history[index].writtenDecision, '');
    // Only these independently asserted payloads differ. Do not remove ledgers,
    // references, audiences, sequence, effects or knowledge to obtain equality.
    const normalizedInput = comparable.events.find(row => row.eventId === input.eventId);
    normalizedInput.details.mode = other.details.mode;
    normalizedInput.details.text = other.details.text;
    assert.equal(comparable.history[index].writtenDecision, wording[index].trim());
    comparable.history[index].writtenDecision = '';
  }
  assert.deepEqual(comparable, preset);
}

test('all five interpreted rounds preserve private input and yield the reviewed cited outcome', () => {
  let state = beginGame(createGame());
  for (const [index, id] of choices.entries()) {
    state = freeze(askQuestion(state, ...questions[index]));
    const before = structuredClone(state);
    const proposal = interpretDecision(state, wording[index]);
    assert.equal(proposal.suggestedId, suggestions[index]);
    assert.equal(proposal.text, wording[index].trim());
    assert.deepEqual(state, before, 'review/clarification creates no input, evidence or decision event');
    const result = freeze(decide(state, id, proposal.text));
    assert.equal(result.events.filter(row => row.type === 'decision').length, index + 1);
    const input = result.events.filter(row => row.type === 'input').at(-1);
    assertPrivateInput(result, input, proposal.text);
    assert.throws(() => decide(result, id, proposal.text), /no active decision/i);
    assert.deepEqual(state, before, 'confirmation does not mutate its predecessor');
    state = freeze(advance(result));
  }
  assert.deepEqual(state.metrics, { delivery: 54, trust: 100, quality: 100 });
  assert.equal(state.events.filter(row => row.type === 'delayed').length, 4);
  assert.equal(state.events.filter(row => row.type === 'completion').length, 1);
  const model = getDebrief(state);
  assert.equal(model.outcome.ruleId, 'outcome:earned');
  assert.deepEqual(model.counts, { conversations: 5, stakeholders: 2, positiveBonuses: 5, cappedBonuses: 0 });
  assert.deepEqual(model.decisions.map(row => row.choiceId), choices);
  assert.deepEqual(model.decisions.map(row => row.wording), wording.map(text => text.trim()));
  const sources = new Set(model.citations.map(row => row.eventId));
  for (const row of [model.outcome, ...model.decisions, ...model.reflections, ...model.agendas]) {
    for (const id of row.sourceEventIds) assert.ok(sources.has(id));
  }
  const exported = formatDecisionRecord(state);
  for (const text of wording) assert.ok(exported.includes(text.trim()));
  for (const input of state.events.filter(row => row.type === 'input')) assert.ok(exported.includes(input.eventId));
});

test('typed and preset branches retain the complete causal graph through completion and debrief', () => {
  const seed = freeze(beginGame(createGame()));
  let typed = seed;
  let preset = seed;
  for (const [index, id] of choices.entries()) {
    typed = freeze(askQuestion(typed, ...questions[index]));
    preset = freeze(askQuestion(preset, ...questions[index]));
    const proposal = interpretDecision(typed, wording[index]);
    typed = freeze(decide(typed, id, proposal.text));
    preset = freeze(decide(preset, id));
    assertEquivalent(typed, preset);
    typed = freeze(advance(typed));
    preset = freeze(advance(preset));
    assertEquivalent(typed, preset);
  }
  assert.equal(seed.history.length, 0);
  const actual = getDebrief(typed);
  const expected = getDebrief(preset);
  const comparable = structuredClone(actual);
  for (const [index, decision] of comparable.decisions.entries()) {
    assert.equal(decision.inputMode, 'typed');
    assert.equal(decision.wording, wording[index].trim());
    assert.equal(expected.decisions[index].inputMode, 'preset');
    assert.equal(expected.decisions[index].wording, '');
    decision.inputMode = 'preset';
    decision.wording = '';
  }
  for (const citation of comparable.citations.filter(row => row.type === 'input')) {
    const counterpart = expected.citations.find(row => row.eventId === citation.eventId);
    assert.ok(counterpart);
    assert.equal(citation.text, wording[citation.round - 1].trim());
    assert.match(citation.label, /Your wording/);
    assert.match(counterpart.label, /Prepared approach/);
    assert.match(counterpart.text, /prepared approach.*no player wording was supplied/i);
    citation.text = counterpart.text;
    citation.label = counterpart.label;
  }
  assert.deepEqual(comparable, expected, 'all other claims, sources, effects, motives and rubric stay equal');
});

test('manual selection, not a rejected draft or suggestion, controls later stakeholder memory', () => {
  const cases = [
    ['I will run a small pilot with a clear review process.', 'pilot', 'delay', { delivery: 40, trust: 59, quality: 71 }, /moved the launch date/i],
    ['I will not run a small pilot this week.', null, 'pilot', { delivery: 55, trust: 60, quality: 62 }, /limited opening/i],
  ];
  for (const [text, suggestion, selected, metrics, meaning] of cases) {
    const initial = freeze(beginGame(createGame()));
    const before = structuredClone(initial);
    const proposal = interpretDecision(initial, text);
    assert.equal(proposal.suggestedId, suggestion);
    assert.deepEqual(initial, before);
    const state = freeze(advance(decide(initial, selected, proposal.text)));
    assert.deepEqual(state.metrics, metrics);
    assert.equal(state.history[0].choiceId, selected);
    const memory = getConversationMemory(state, 'mara');
    assert.match(memory.text, meaning);
    assert.ok(memory.sourceEventIds.includes(event(state, `choice:promise:${selected}`).eventId));
    assert.equal(memory.text.includes(text), false);
    const input = state.events.find(row => row.type === 'input');
    assertPrivateInput(state, input, text);
  }
});

test('typing about the full thread does not grant hidden knowledge when ignore is confirmed', () => {
  const state = freeze(playPrefix(['pilot', 'explicit']));
  const text = 'I will share the full thread so the team has the context.';
  const proposal = interpretDecision(state, text);
  assert.equal(proposal.suggestedId, 'open');
  const result = advance(decide(state, 'ignore', proposal.text));
  const note = event(result, 'story:planning-note');
  assert.equal(result.knowledge.player.includes(note.eventId), false);
  assert.equal(result.events.some(row => row.ruleId.startsWith('disclosure:rumor:')), false);
  assert.deepEqual(result.evidence, []);
  assertPrivateInput(result, result.events.filter(row => row.type === 'input').at(-1), text);
  const complete = advance(decide(advance(decide(result, 'core')), 'evidence'));
  const model = getDebrief(complete);
  assert.ok(model.reflections.some(row => row.id === 'ignored-rumor'));
  assert.equal(model.citations.some(row => row.eventId === note.eventId), false);
  assert.equal(formatDecisionRecord(complete).includes(note.eventId), false);
});

test('unsupported input and repeat submission leave combined records unchanged; replay starts a separate run', () => {
  const state = freeze(beginGame(createGame()));
  const before = structuredClone(state);
  for (const invalid of ['', 'x'.repeat(19), 'x'.repeat(1201)]) assert.throws(() => interpretDecision(state, invalid));
  for (const text of ["I will use 'pilot' as a label for the lunch menu.", 'I will visit a public park tomorrow afternoon.']) {
    assert.equal(interpretDecision(state, text).suggestedId, null);
  }
  assert.deepEqual(state, before);
  assert.throws(() => decide(state, null, wording[0].trim()));
  const committed = freeze(decide(state, 'pilot', wording[0].trim()));
  const committedBefore = structuredClone(committed);
  assert.throws(() => getDebrief(committed));
  assert.throws(() => interpretDecision(committed, wording[1]));
  assert.throws(() => decide(committed, 'pilot', wording[0].trim()));
  assert.deepEqual(committed, committedBefore);
  const next = freeze(advance(committed));
  const nextBefore = structuredClone(next);
  assert.throws(() => advance(next));
  assert.deepEqual(next, nextBefore);
  const fresh = freeze(beginGame(createGame()));
  assert.notEqual(fresh.runId, next.runId);
  assert.deepEqual(fresh.metrics, { delivery: 50, trust: 55, quality: 50 });
  assert.deepEqual(fresh.history, []);
  assert.deepEqual(fresh.evidence, []);
  assert.equal(JSON.stringify(fresh).includes(wording[0].trim()), false);
  const oldIds = new Set(next.events.map(row => row.eventId));
  assert.ok(fresh.events.every(row => !oldIds.has(row.eventId)));
});

test('equivalence comparison detects effects, private disclosure, causal links and unexpected wording', () => {
  const state = freeze(beginGame(createGame()));
  const typed = decide(state, 'pilot', wording[0].trim());
  const preset = freeze(decide(state, 'pilot'));
  assertEquivalent(typed, preset);
  const corruptions = [
    ['metric', s => { s.metrics.quality += 1; }],
    ['recorded effect', s => { s.events.find(row => row.type === 'decision').effects.metrics.actual.quality += 1; }],
    ['input audience', s => { s.events.find(row => row.type === 'input').audience.push('theo'); }],
    ['input knowledge', s => { s.knowledge.theo.push(s.events.find(row => row.type === 'input').eventId); }],
    ['causal reference', s => { s.events.find(row => row.type === 'decision').sourceEventIds.push('invented-source'); }],
    ['input text', s => { s.events.find(row => row.type === 'input').details.text = 'unexpected words in the input'; }],
    ['history text', s => { s.history[0].writtenDecision = 'unexpected words in the history'; }],
  ];
  for (const [label, corrupt] of corruptions) {
    const changed = structuredClone(typed);
    corrupt(changed);
    assert.throws(() => assertEquivalent(changed, preset), assert.AssertionError, label);
  }
});

test('typed confirmation retains the capped bonus distinction in the integrated debrief and export', () => {
  let state = beginGame(createGame());
  const selected = ['pilot', 'explicit', 'open', 'core', 'shared'];
  for (const [index, id] of selected.entries()) {
    const question = index === 4 ? ['leah', 'owners'] : questions[index];
    state = askQuestion(state, ...question);
    const text = index === 4 ? 'I will bring all leads together for a joint checkpoint.' : wording[index];
    const proposal = interpretDecision(state, text);
    state = advance(decide(state, id, proposal.text));
  }
  assert.deepEqual(state.metrics, { delivery: 41, trust: 100, quality: 100 });
  const model = getDebrief(state);
  assert.deepEqual(model.counts, { conversations: 5, stakeholders: 3, positiveBonuses: 4, cappedBonuses: 1 });
  assert.equal(model.decisions[4].inputMode, 'typed');
  assert.equal(model.decisions[4].bonus.eligible, true);
  assert.equal(model.decisions[4].bonus.marginalBenefit, 0);
  assert.deepEqual(model.decisions[4].effects.metrics.actual, { delivery: -8, trust: 4, quality: 0 });
  assert.equal(state.history[4].bonus, null);
  const exported = formatDecisionRecord(state);
  assert.match(exported, /4 decisions used recorded evidence/);
  assert.match(exported, /1 eligible bonus added no points/);
  assert.ok(exported.includes(model.decisions[4].wording));
});
