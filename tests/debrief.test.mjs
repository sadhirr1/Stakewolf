import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame, beginGame, askQuestion, decide, advance,
  evaluateOutcome, getDebrief, formatDecisionRecord,
} from '../public/engine.js';

// Independent expectations from scenario-rules and debrief-contract. These tests
// exercise actual transitions, except the explicitly pure rubric boundary table.
const standard = ['pilot', 'explicit', 'open', 'core', 'evidence'];
const allQuestions = [
  [['ishan', 'failure'], ['mara', 'mara-pressure']],
  [['ishan', 'retention-fix'], ['leah', 'data-promise']],
  [['ishan', 'full-thread'], ['mara', 'screenshot-source']],
  [['theo', 'market-sample'], ['ishan', 'review-bottleneck']],
  [['ishan', 'gate'], ['leah', 'owners']],
];
const privateWords = 'I chose a small pilot; private rationale: violet heron <731> & margin.';
const sorted = values => [...values].sort();
const equalIds = (actual, expected, message) => assert.deepEqual(sorted(actual), sorted(expected), message);
function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
function play(choices = standard, questions = [], typedFirst = '') {
  let state = beginGame(createGame());
  for (const [index, id] of choices.entries()) {
    for (const pair of questions[index] || []) state = askQuestion(state, ...pair);
    state = advance(decide(state, id, index === 0 ? typedFirst : ''));
  }
  return state;
}
function event(state, ruleId) {
  const matches = state.events.filter(row => row.ruleId === ruleId);
  assert.equal(matches.length, 1, `exactly one actual event: ${ruleId}`);
  return matches[0];
}
function reflection(model, id) {
  const matches = model.reflections.filter(row => row.id === id);
  assert.equal(matches.length, 1, `exactly one reflection: ${id}`);
  return matches[0];
}

test('the ordered outcome rubric honors exact thresholds and overlaps without inventing a path', () => {
  const cases = [
    // D/T/Q: expected values are literal specification boundaries, not engine-derived.
    [[40, 65, 65], 'earned'], [[39, 65, 65], 'deadline'],
    [[40, 64, 65], 'deadline'], [[40, 60, 65], 'deadline'],
    [[40, 59, 65], 'fragile'], [[40, 65, 64], 'proof'],
    [[70, 50, 54], 'borrowed'], [[69, 50, 54], 'fragile'],
    [[70, 50, 55], 'fragile'], [[70, 65, 54], 'borrowed'],
    [[40, 54, 60], 'room'], [[40, 55, 60], 'fragile'],
    [[40, 54, 59], 'fragile'], [[40, 65, 59], 'proof'],
    [[40, 64, 59], 'fragile'], [[100, 100, 100], 'earned'],
    [[0, 0, 0], 'fragile'],
  ];
  for (const [[delivery, trust, quality], expected] of cases) {
    const metrics = freeze({ delivery, trust, quality });
    const actual = evaluateOutcome(metrics);
    assert.equal(actual.ruleId, `outcome:${expected}`, `${delivery}/${trust}/${quality}`);
    assert.deepEqual(actual.metrics, metrics);
    assert.equal(typeof actual.predicate, 'string');
    assert.ok(actual.predicate.length > 0);
  }
});

test('a deadline interpretation does not fabricate repeated launch delays', () => {
  const state = play(['pilot', 'quiet', 'open', 'both', 'shared']);
  assert.deepEqual(state.metrics, { delivery: 49, trust: 63, quality: 69 });
  assert.equal(state.history.some(row => row.choiceId === 'delay'), false);
  const model = getDebrief(state);
  assert.equal(model.outcome.ruleId, 'outcome:deadline');
  assert.doesNotMatch(model.description, /repeated delays|kept the team engaged|team believes/i);
  assert.deepEqual(model.outcome.metrics, { delivery: 49, trust: 63, quality: 69 });
});

test('Theo describes his own account bias without admitting player overfit on three scope paths', () => {
  for (const scope of ['core', 'custom', 'both']) {
    const before = play(['pilot', 'explicit', 'open', scope]);
    const heard = askQuestion(before, 'theo', 'theo-reflection');
    const answer = heard.evidence.at(-1);
    assert.doesNotMatch(answer.answer, /^At times, yes\.|you overfit|you optimized.*Atlas/i);
    assert.match(answer.answer, /I|my/i, 'the statement must be attributed to Theo');
    assert.match(answer.answer, /Atlas|account|team/i);
    assert.deepEqual(heard.metrics, before.metrics, 'copy correction adds no metric effect');
    assert.equal(heard.relationships.theo, before.relationships.theo + 2);
    assert.equal(heard.talksLeft, before.talksLeft - 1);
    assert.equal(heard.evidence.at(-1).id, 'theo-reflection');
  }
});

test('debrief and text export reveal no final motive model before actual completion', () => {
  let state = beginGame(createGame());
  assert.throws(() => getDebrief(createGame()));
  assert.throws(() => formatDecisionRecord(createGame()));
  for (const choice of standard) {
    assert.throws(() => getDebrief(state));
    assert.throws(() => formatDecisionRecord(state));
    state = decide(state, choice);
    assert.throws(() => getDebrief(state));
    assert.throws(() => formatDecisionRecord(state));
    state = advance(state);
  }
  const model = getDebrief(state);
  assert.equal(model.agendas.length, 4);
  equalIds(model.agendas.map(row => row.personId), ['mara', 'ishan', 'leah', 'theo']);
  const completion = event(state, 'completion:launch-room');
  for (const row of model.agendas) {
    assert.ok(row.sourceEventIds.includes(completion.eventId));
    assert.equal(row.text, completion.details.privateMotives.find(motive => motive.personId === row.personId).text);
    assert.equal(row.relationship, state.relationships[row.personId]);
    const relationshipChanges = state.events.filter(source => source.effects.relationships.actual[row.personId] !== 0);
    for (const source of relationshipChanges) assert.ok(row.sourceEventIds.includes(source.eventId));
    assert.equal(50 + relationshipChanges.reduce((sum, source) => sum + source.effects.relationships.actual[row.personId], 0), row.relationship);
  }
});

test('zero conversations stay zero and cannot be replaced by memory or motive counts', () => {
  const state = play(['launch', 'quiet', 'ignore', 'both', 'momentum']);
  const model = getDebrief(state);
  assert.deepEqual(model.counts, { conversations: 0, stakeholders: 0, positiveBonuses: 0, cappedBonuses: 0 });
  assert.deepEqual(model.outcome.metrics, { delivery: 99, trust: 2, quality: 8 });
  assert.equal(model.outcome.ruleId, 'outcome:borrowed');
  const conversations = reflection(model, 'conversations');
  assert.match(conversations.fact, /0 of 10/);
  assert.match(conversations.fact, /0 of 4/);
  equalIds(conversations.sourceEventIds, [event(state, 'completion:launch-room').eventId]);
  assert.match(reflection(model, 'evidence-bonus').fact, /0 decisions/);
  assert.ok(model.citations.every(row => row.type !== 'question'));
});

test('ten conversations, four sources, and five positive bonuses cite the counted events', () => {
  const state = play(standard, allQuestions);
  const model = getDebrief(state);
  assert.deepEqual(model.counts, { conversations: 10, stakeholders: 4, positiveBonuses: 5, cappedBonuses: 0 });
  assert.deepEqual(model.outcome.metrics, { delivery: 54, trust: 100, quality: 100 });
  const questions = state.events.filter(row => row.type === 'question');
  equalIds(reflection(model, 'conversations').sourceEventIds, questions.map(row => row.eventId));
  const expectedBonusSources = [
    ['choice:promise:pilot', 'question:promise:failure'],
    ['choice:consent:explicit', 'question:consent:retention-fix'],
    ['choice:rumor:open', 'question:rumor:full-thread'],
    ['choice:scope:core', 'question:scope:market-sample'],
    ['choice:accountability:evidence', 'question:accountability:gate'],
  ].flatMap(pair => pair.map(id => event(state, id).eventId));
  equalIds(reflection(model, 'evidence-bonus').sourceEventIds, expectedBonusSources);
  equalIds(model.reflections.map(row => row.id), ['conversations', 'evidence-bonus']);
});

test('two interviews with one person count two conversations and one source', () => {
  const state = play(standard, [[['ishan', 'failure'], ['ishan', 'rewrite']]]);
  const model = getDebrief(state);
  assert.deepEqual(model.counts, { conversations: 2, stakeholders: 1, positiveBonuses: 1, cappedBonuses: 0 });
  assert.equal(reflection(model, 'conversations').sourceEventIds.length, 2);
});

test('quiet and ignored-rumor claims have separate causes; broker removes only ignored-rumor', () => {
  for (const rumor of ['ignore', 'broker']) {
    const state = play(['launch', 'quiet', rumor, 'both', 'momentum']);
    const model = getDebrief(state);
    equalIds(reflection(model, 'quiet-fix').sourceEventIds,
      ['choice:consent:quiet', 'delay:consent:quiet'].map(id => event(state, id).eventId));
    assert.match(reflection(model, 'quiet-fix').fact, /recordings|default|retention/i);
    if (rumor === 'ignore') {
      equalIds(reflection(model, 'ignored-rumor').sourceEventIds,
        ['choice:rumor:ignore', 'delay:rumor:ignore'].map(id => event(state, id).eventId));
      assert.match(reflection(model, 'ignored-rumor').fact, /defect.*checklist/i);
    } else {
      assert.equal(model.reflections.some(row => row.id === 'ignored-rumor'), false);
      assert.deepEqual(model.outcome.metrics, { delivery: 93, trust: 25, quality: 19 });
    }
    assert.equal(model.reflections.some(row => row.id.startsWith('atlas-')), false);
  }
});

test('Atlas retention and workflow claims are independent and retain conditional scope', () => {
  for (const consent of ['explicit', 'exception']) {
    for (const scope of ['core', 'custom']) {
      const state = play(['pilot', consent, 'broker', scope, 'shared']);
      const model = getDebrief(state);
      const expected = ['conversations', 'evidence-bonus'];
      if (consent === 'exception') {
        expected.push('atlas-retention');
        equalIds(reflection(model, 'atlas-retention').sourceEventIds,
          ['choice:consent:exception', 'delay:consent:exception'].map(id => event(state, id).eventId));
        assert.match(reflection(model, 'atlas-retention').fact, /retention|policy/i);
      }
      if (scope === 'custom') {
        expected.push('atlas-workflow');
        equalIds(reflection(model, 'atlas-workflow').sourceEventIds,
          ['choice:scope:custom', 'delay:scope:custom'].map(id => event(state, id).eventId));
        assert.match(reflection(model, 'atlas-workflow').fact, /conditional/i);
      }
      equalIds(model.reflections.map(row => row.id), expected);
      assert.doesNotMatch(model.reflections.map(row => row.fact).join('\n'), /realized revenue|closed (the )?sale|you surfaced/i);
    }
  }
});

test('eligible evidence at the quality/trust cap is cited but not counted as an improvement', () => {
  const questions = allQuestions.map(pair => [pair[0]]);
  questions[4] = [['leah', 'owners']];
  const state = play(['pilot', 'explicit', 'open', 'core', 'shared'], questions);
  const model = getDebrief(state);
  assert.deepEqual(model.counts, { conversations: 5, stakeholders: 3, positiveBonuses: 4, cappedBonuses: 1 });
  assert.deepEqual(model.outcome.metrics, { delivery: 41, trust: 100, quality: 100 });
  const bonus = reflection(model, 'evidence-bonus');
  assert.match(bonus.fact, /4 decisions/);
  assert.match(bonus.fact, /cap|no additional|zero|0 additional/i);
  const shared = event(state, 'choice:accountability:shared');
  const owners = event(state, 'question:accountability:owners');
  assert.ok(bonus.sourceEventIds.includes(shared.eventId));
  assert.ok(bonus.sourceEventIds.includes(owners.eventId));
  assert.equal(shared.bonus.marginalBenefit, 0);
  assert.equal(state.history[4].bonus, null);
  const citedShared = model.citations.find(row => row.eventId === shared.eventId);
  assert.deepEqual(citedShared.effects.metrics.requested, { delivery: -8, trust: 11, quality: 8 });
  assert.deepEqual(citedShared.effects.metrics.actual, { delivery: -8, trust: 4, quality: 0 });
  const delayed = model.citations.find(row => row.eventId === event(state, 'delay:scope:core').eventId);
  assert.equal(delayed.effects.metrics.requested.quality, 5);
  assert.equal(delayed.effects.metrics.actual.quality, 4);
});

test('every returned claim and visible citation link resolves inside this run without leaking hidden parents', () => {
  const state = play(['pilot', 'quiet', 'ignore', 'both', 'shared'], [[['leah', 'consent-warning']]], privateWords);
  const model = getDebrief(state);
  const catalog = new Map(model.citations.map(row => [row.eventId, row]));
  assert.equal(catalog.size, model.citations.length);
  for (const row of [model.outcome, ...model.reflections, ...model.decisions, ...model.agendas, ...model.citations]) {
    for (const id of row.sourceEventIds) assert.ok(catalog.has(id), `visible link resolves: ${id}`);
  }
  for (const cited of model.citations) {
    const recorded = state.events.find(row => row.eventId === cited.eventId);
    assert.ok(recorded);
    assert.equal(recorded.runId, state.runId);
    assert.ok(recorded.playerVisible || state.knowledge.player.includes(recorded.eventId));
    assert.ok(cited.label && !cited.label.includes(state.runId), 'human-readable label is not a UUID');
    assert.equal(cited.status, recorded.evidenceStatus);
    assert.deepEqual(cited.effects, recorded.effects);
  }
  const hidden = state.events.filter(row => !row.playerVisible && !state.knowledge.player.includes(row.eventId));
  assert.ok(hidden.length > 0, 'this control must actually contain hidden source parents');
  const serialized = JSON.stringify(model);
  for (const row of hidden) assert.equal(serialized.includes(row.eventId), false, 'do not expose hidden parent links');
  const concern = event(state, 'question:promise:consent-warning');
  assert.equal(catalog.get(concern.eventId).status, 'unverified-claim');
});

test('the five decisions preserve confirmed wording and cite actual immediate and delayed records', () => {
  const state = play(standard, allQuestions, privateWords);
  const model = getDebrief(state);
  assert.deepEqual(model.decisions.map(row => row.round), [1, 2, 3, 4, 5]);
  assert.deepEqual(model.decisions.map(row => row.choiceId), standard);
  assert.equal(model.decisions[0].inputMode, 'typed');
  assert.equal(model.decisions[0].wording, privateWords);
  assert.ok(model.decisions.slice(1).every(row => row.inputMode === 'preset' && !row.wording));
  const rounds = ['promise', 'consent', 'rumor', 'scope', 'accountability'];
  for (const [index, row] of model.decisions.entries()) {
    assert.ok(row.sourceEventIds.includes(event(state, `choice:${rounds[index]}:${standard[index]}`).eventId));
    if (index < 4) assert.ok(row.sourceEventIds.includes(event(state, `delay:${rounds[index]}:${standard[index]}`).eventId));
  }
  const supporting = state.events.filter(row => ['decision', 'delayed', 'completion'].includes(row.type));
  equalIds(model.outcome.sourceEventIds, supporting.map(row => row.eventId));
  const calculated = { delivery: 50, trust: 55, quality: 50 };
  for (const source of supporting) for (const key of Object.keys(calculated)) calculated[key] += source.effects.metrics.actual[key];
  assert.deepEqual(calculated, { delivery: 54, trust: 100, quality: 100 });
});

test('debrief projections and repeat text exports are pure and return detached records', () => {
  const state = freeze(play(standard, allQuestions, privateWords));
  const before = structuredClone(state);
  const first = getDebrief(state);
  const exportText = formatDecisionRecord(state);
  assert.deepEqual(getDebrief(state), first);
  assert.equal(formatDecisionRecord(state), exportText);
  first.outcome.metrics.quality = -123;
  first.decisions[0].sourceEventIds.length = 0;
  first.citations[0].effects.metrics.actual.quality = -456;
  first.agendas[0].text = 'altered outside state';
  assert.deepEqual(state, before);
  assert.deepEqual(getDebrief(state).outcome.metrics, { delivery: 54, trust: 100, quality: 100 });
});

test('text export shares model claims, allowed source IDs, effects, input and authored motives', () => {
  const questions = allQuestions.map(pair => [pair[0]]);
  questions[4] = [['leah', 'owners']];
  const state = play(['pilot', 'explicit', 'open', 'core', 'shared'], questions, privateWords);
  const model = getDebrief(state);
  const text = formatDecisionRecord(state);
  for (const value of [model.title, model.description, model.outcome.ruleId, model.outcome.predicate, privateWords]) {
    assert.ok(text.includes(value), `export retains ${value}`);
  }
  for (const row of model.reflections) for (const field of ['fact', 'interpretation', 'prompt']) assert.ok(text.includes(row[field]));
  for (const row of model.agendas) assert.ok(text.includes(row.text));
  for (const row of model.decisions) assert.ok(text.includes(row.title));
  for (const row of model.citations) {
    assert.ok(text.includes(row.eventId));
    assert.ok(text.includes(row.label));
    assert.ok(text.includes(row.status));
    if (row.text) assert.ok(text.includes(row.text));
  }
  assert.match(text, /requested/i);
  assert.match(text, /actual/i);
  assert.match(text, /marginal|extra points|additional points/i);
  // Literal capped-path arithmetic must survive export; merely printing the
  // words "requested" and "actual" would not establish content parity.
  assert.match(text, /quality: 96 → 100; actual 4; requested 5/);
  assert.match(text, /quality: 100 → 100; actual 0; requested 8/);
  assert.match(text, /trust: 96 → 100; actual 4; requested 11/);
  assert.match(text, /Evidence bonus: eligible; requested 4; additional points 0/);
  for (const row of state.events.filter(row => !row.playerVisible && !state.knowledge.player.includes(row.eventId))) {
    assert.equal(text.includes(row.eventId), false);
  }
});

test('inconsistent completed traces are rejected without mutating them or inventing sources', () => {
  const valid = play(['pilot', 'quiet', 'ignore', 'custom', 'shared'], [[['ishan', 'failure']]], privateWords);
  const corruptions = [
    ['missing completion', s => { s.events = s.events.filter(row => row.type !== 'completion'); }],
    ['missing decision', s => { s.events = s.events.filter(row => row.ruleId !== 'choice:consent:quiet'); }],
    ['missing delayed source', s => { s.events = s.events.filter(row => row.ruleId !== 'delay:rumor:ignore'); }],
    ['missing question source', s => { s.events = s.events.filter(row => row.ruleId !== 'question:promise:failure'); }],
    ['duplicate source', s => { s.events.push(structuredClone(event(s, 'delay:scope:custom'))); }],
    ['cross-run source', s => { event(s, 'delay:scope:custom').runId = 'another-attempt'; }],
    ['contradictory completed count', s => { event(s, 'completion:launch-room').details.completedRounds = 4; }],
    ['contradictory decision', s => { s.history[0].choiceId = 'launch'; }],
    ['inconsistent final score', s => { s.metrics.quality -= 1; }],
  ];
  for (const [label, corrupt] of corruptions) {
    const state = structuredClone(valid);
    corrupt(state);
    freeze(state);
    const before = structuredClone(state);
    assert.throws(() => getDebrief(state), error => error.code === 'INVALID_STATE', label);
    assert.throws(() => formatDecisionRecord(state), error => error.code === 'INVALID_STATE', `${label}: export`);
    assert.deepEqual(state, before, `${label}: no mutation on failure`);
  }
});

test('bonus facts cannot certify fabricated gain, eligibility or a different question source', () => {
  const questions = allQuestions.map(pair => [pair[0]]);
  questions[4] = [['leah', 'owners']];
  const valid = play(['pilot', 'explicit', 'open', 'core', 'shared'], questions);
  const corruptions = [
    ['zero cap declared positive', s => { event(s, 'choice:accountability:shared').bonus.marginalBenefit = 4; }],
    ['earned bonus declared ineligible', s => { event(s, 'choice:promise:pilot').bonus.eligible = false; }],
    ['bonus refers to unrelated heard question', s => {
      event(s, 'choice:promise:pilot').bonus.sourceEventId = event(s, 'question:accountability:owners').eventId;
    }],
  ];
  for (const [label, corrupt] of corruptions) {
    const state = structuredClone(valid);
    corrupt(state);
    freeze(state);
    const before = structuredClone(state);
    assert.throws(() => getDebrief(state), error => error.code === 'INVALID_STATE', label);
    assert.throws(() => formatDecisionRecord(state), error => error.code === 'INVALID_STATE', label);
    assert.deepEqual(state, before);
  }
});
