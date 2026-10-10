import test from 'node:test';
import assert from 'node:assert/strict';
import { PEOPLE, createWildState, act, outcome, dawnReport } from '../public/wild/state.js';
import { createForestScene } from '../public/wild/scene.js';

const enter = () => act(createWildState(), 'enter');
const inspect = state => act(act(state, 'travel', 'crossing'), 'inspect');
const atCouncil = state => act(state, 'travel', 'council');
const commit = (choice, observed = false) => act(observed ? atCouncil(inspect(enter())) : enter(), 'decide', choice);
function freeze(state) {
  Object.freeze(state.heard);
  return Object.freeze(state);
}
function reportText(report) {
  return [report.title, report.text, report.consequence, report.uncertainty,
    ...report.threads.map(thread => `${thread.label}: ${thread.status}. ${thread.detail}`),
    ...report.voices.map(voice => voice.line)].join('\n');
}

test('SCRUM-33 state: daylight requires a committed choice and an explicit advance', () => {
  for (const state of [createWildState(), enter(), inspect(enter()), atCouncil(inspect(enter()))]) {
    const before = structuredClone(state);
    assert.equal(state.dawn, false);
    assert.equal(state.decisionEvidence, null);
    assert.equal(dawnReport(state), null);
    assert.equal(act(freeze(state), 'advance'), state, 'entry and investigation cannot end the night');
    assert.deepEqual(state, before);
  }
  for (const [choice, observed] of [['hold', false], ['hold', true], ['repair', true]]) {
    let night = commit(choice, observed);
    assert.equal(night.dawn, false, 'commitment alone does not advance time');
    assert.equal(dawnReport(night), null);
    for (const [action, value] of [['hear', 'vela'], ['travel', 'crossing'], ['inspect'], ['travel', 'trail'], ['travel', 'council']]) {
      night = act(night, action, value);
      assert.equal(night.dawn, false, `${action} cannot advance time`);
      assert.equal(dawnReport(night), null);
    }
  }
});

test('SCRUM-33 state: each commitment records exactly the evidence available at that moment', () => {
  for (const [choice, observed] of [['hold', false], ['hold', true], ['repair', true]]) {
    const council = observed ? atCouncil(inspect(enter())) : enter();
    const original = structuredClone(council);
    const decided = act(freeze(council), 'decide', choice);
    assert.equal(decided.decision, choice);
    assert.equal(decided.decisionEvidence, observed);
    assert.equal(decided.dawn, false);
    assert.deepEqual(council, original, 'commitment does not rewrite the prior snapshot');
    for (const laterChoice of ['repair', 'hold']) {
      assert.equal(act(freeze(decided), 'decide', laterChoice), decided, 'neither repeated nor opposite commitments can replace the record');
    }
  }
  const unsupported = Object.keys(PEOPLE).reduce((state, person) => act(state, 'hear', person), enter());
  assert.equal(act(freeze(unsupported), 'decide', 'repair'), unsupported, 'three claims still do not establish the anchor condition');
  assert.equal(unsupported.decisionEvidence, null);
});

test('SCRUM-33 state: inspection after an uninformed hold does not rewrite its rationale', () => {
  const held = freeze(commit('hold'));
  const initialOutcome = outcome(held);
  const later = atCouncil(inspect(held));
  assert.equal(later.evidence, true, 'a late observation may still be recorded during the night');
  assert.equal(later.decisionEvidence, false, 'the decision still preceded that observation');
  assert.deepEqual(outcome(later), initialOutcome);
  assert.match(outcome(later).uncertainty, /without inspecting|not inspected/i);
  assert.equal(held.evidence, false);
  const earlyReport = dawnReport(act(held, 'advance'));
  const lateReport = dawnReport(act(later, 'advance'));
  assert.match(earlyReport.uncertainty, /unverified/i);
  assert.match(lateReport.uncertainty, /night inspection|recorded/i, 'dawn can acknowledge an actual later observation');
  assert.equal(later.decisionEvidence, false, 'that later observation still cannot grant hindsight to the commitment');
});

test('SCRUM-33 state: advancing returns to council once and cannot apply a second consequence', () => {
  for (const [choice, observed] of [['hold', false], ['hold', true], ['repair', true]]) {
    const committed = freeze(act(commit(choice, observed), 'travel', 'crossing'));
    const before = structuredClone(committed);
    const dawn = act(committed, 'advance');
    assert.equal(dawn.dawn, true);
    assert.equal(dawn.location, 'council');
    assert.equal(dawn.decision, choice);
    assert.equal(dawn.decisionEvidence, observed);
    assert.equal(dawn.evidence, committed.evidence);
    assert.deepEqual(committed, before, 'advancing preserves the night snapshot');
    const report = dawnReport(dawn);
    assert.ok(report);
    for (let count = 0; count < 3; count++) {
      assert.equal(act(freeze(dawn), 'advance'), dawn);
      assert.deepEqual(dawnReport(dawn), report);
    }
    for (const next of ['repair', 'hold']) assert.equal(act(dawn, 'decide', next), dawn);
    const crossing = freeze(act(dawn, 'travel', 'crossing'));
    assert.equal(act(crossing, 'inspect'), crossing, 'the night observation cannot be created or rewritten at dawn');
  }
});

test('SCRUM-33 report: each completed branch carries three obligations and attributed reactions', () => {
  for (const [choice, observed] of [['hold', false], ['hold', true], ['repair', true]]) {
    const state = freeze(act(commit(choice, observed), 'advance'));
    const report = dawnReport(state);
    for (const property of ['title', 'text', 'consequence', 'uncertainty']) assert.ok(typeof report[property] === 'string' && report[property].trim(), property);
    assert.equal(report.threads.length, 3, 'three outstanding obligations each require a visible state');
    assert.equal(new Set(report.threads.map(thread => thread.label)).size, 3);
    for (const thread of report.threads) {
      for (const field of ['label', 'status', 'detail']) assert.ok(typeof thread[field] === 'string' && thread[field].trim(), field);
    }
    assert.deepEqual(report.voices.map(voice => voice.id).sort(), Object.keys(PEOPLE).sort());
    for (const voice of report.voices) assert.ok(typeof voice.line === 'string' && voice.line.trim());
    assert.match(reportText(report), /crossing|anchor/i);
    assert.match(reportText(report), /watch|northern/i);
    assert.match(reportText(report), /families|promise/i);
  }
});

test('SCRUM-33 report: repair earns a bounded inspection while retaining fatigue and uncertainty', () => {
  const dawn = act(commit('repair', true), 'advance');
  const report = dawnReport(dawn);
  assert.match(report.text, /Sera inspects|Sera.*inspection/i);
  assert.match(report.text, /load|river level|conditions/i);
  assert.match(report.consequence, /passes.*inspection/i);
  assert.match(reportText(report), /exhausted|exhaustion|rest/i);
  assert.match(report.uncertainty, /does not guarantee/i);
  assert.match(report.uncertainty, /not proof.*intrusion/i);
  assert.match(report.uncertainty, /original.*unknown/i);
  assert.ok(report.threads.some(thread => /watch/i.test(thread.label) && /unknown|unresolved/i.test(`${thread.status} ${thread.detail}`)));
  assert.ok(report.threads.some(thread => /crew/i.test(thread.label) && /rest|exhaustion/i.test(`${thread.status} ${thread.detail}`)));
  assert.match(outcome(dawn).consequence, /being repaired/i, 'the recorded immediate outcome remains a night event');
});

test('SCRUM-33 report: holding preserves the watch, delays the promise, and never invents an inspection', () => {
  for (const observed of [false, true]) {
    const report = dawnReport(act(commit('hold', observed), 'advance'));
    assert.match(report.text, /still closed/i);
    assert.match(report.text, /no repair or dawn inspection/i);
    assert.match(report.consequence, /watch remained staffed/i);
    assert.match(report.consequence, /families.*waiting/i);
    assert.ok(report.threads.some(thread => /families/i.test(thread.label) && /delay/i.test(thread.status)));
    assert.ok(report.threads.some(thread => /watch/i.test(thread.label) && /staff|kept/i.test(thread.status)));
    if (observed) {
      assert.match(report.uncertainty, /night inspection.*slipping fastening/i);
      assert.match(report.uncertainty, /unrepaired.*unknown/i);
    } else {
      assert.match(report.uncertainty, /claim.*unverified/i);
      assert.doesNotMatch(reportText(report), /observed slipping|recorded a slipping|loose anchor remains/i, 'an unobserved defect is not presented as established evidence');
    }
    assert.notDeepEqual(report, dawnReport(act(commit('repair', true), 'advance')), 'the two commitments have materially different morning results');
  }
});

test('SCRUM-33 state: dawn replay clears the decision, its evidence basis, and time of day', () => {
  for (const [choice, observed] of [['hold', false], ['hold', true], ['repair', true]]) {
    const night = Object.keys(PEOPLE).reduce((state, id) => act(state, 'hear', id), commit(choice, observed));
    const first = freeze(act(night, 'advance'));
    const before = structuredClone(first);
    const firstReport = structuredClone(dawnReport(first));
    const replay = act(first, 'restart');
    assert.deepEqual(replay, createWildState());
    assert.equal(replay.dawn, false);
    assert.equal(replay.decisionEvidence, null);
    assert.equal(dawnReport(replay), null);
    assert.equal(outcome(replay), null);
    assert.notEqual(replay.heard, first.heard);
    const second = act(act(act(replay, 'enter'), 'decide', 'hold'), 'advance');
    assert.equal(second.decisionEvidence, false);
    assert.equal(second.evidence, false);
    assert.deepEqual(second.heard, []);
    assert.deepEqual(first, before);
    assert.deepEqual(dawnReport(first), firstReport);
  }
});

test('SCRUM-33 state: noncanonical choices, people, locations, and actions do not change any phase', () => {
  const invalid = [undefined, null, '', 'missing', '__proto__', 'constructor', 0, false, {}, [], ['hold'], ['orin'], ['council'], new String('repair'), Object.create(null)];
  for (const state of [createWildState(), enter(), atCouncil(inspect(enter())), commit('hold'), act(commit('repair', true), 'advance')]) {
    const original = structuredClone(state);
    freeze(state);
    for (const value of invalid) {
      for (const action of ['decide', 'hear', 'travel']) assert.equal(act(state, action, value), state, `${action} rejected noncanonical value`);
    }
    for (const action of [undefined, null, 'dawn', 'finish', 'ADVANCE', {}, ['advance'], new String('advance')]) assert.equal(act(state, action), state);
    assert.deepEqual(state, original);
  }
});

test('SCRUM-33 report: readers cannot mutate the retained report or state through returned arrays', () => {
  const dawn = freeze(act(commit('repair', true), 'advance'));
  const originalState = structuredClone(dawn);
  const originalReport = structuredClone(dawnReport(dawn));
  const view = dawnReport(dawn);
  view.threads[0].detail = 'reader-modified';
  view.threads.pop();
  view.voices[0].line = 'reader-modified';
  view.voices.pop();
  assert.deepEqual(dawnReport(dawn), originalReport);
  assert.deepEqual(dawn, originalState);
});

test('SCRUM-33 fallback: focus and dawn controllers remain safe when WebGL is absent or denied', () => {
  for (const getContext of [() => null, () => { throw new Error('WebGL denied by test fixture'); }]) {
    const failures = [];
    let readyCount = 0;
    const scene = createForestScene({ getContext }, {
      reducedMotion: true,
      onReady: () => { readyCount++; },
      onFailure: message => failures.push(message),
    });
    assert.equal(readyCount, 0, 'an inert controller never claims that a scene rendered');
    assert.equal(failures.length, 1);
    assert.match(failures[0], /unavailable/i);
    assert.doesNotThrow(() => {
      scene.travelTo('council');
      for (const person of ['orin', 'sera', 'vela', null]) scene.focusPerson(person);
      scene.setOutcome('repair');
      scene.setDawn(true);
      scene.setPaused(true);
      scene.setReducedMotion(true);
      scene.travelTo('crossing');
      scene.setDawn(false);
      scene.setOutcome(null);
      scene.focusPerson(null);
      scene.travelTo('overlook');
      scene.dispose();
      scene.setDawn(true);
      scene.focusPerson('orin');
      scene.dispose();
    }, 'the same app lifecycle works through unavailable rendering and fresh replay');
    assert.equal(readyCount, 0);
    assert.equal(failures.length, 1);
  }
});
