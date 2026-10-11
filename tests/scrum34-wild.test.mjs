import test from 'node:test';
import assert from 'node:assert/strict';
import { createWildState, act, outcome, dawnReport, morningOptions, morningWork, morningReport } from '../public/wild/state.js';
import { createForestScene } from '../public/wild/scene.js';

const enter = () => act(createWildState(), 'enter');
const inspect = state => act(act(state, 'travel', 'crossing'), 'inspect');
const at = (state, location) => act(state, 'travel', location);
const night = (decision, observed = decision === 'repair') => act(observed ? at(inspect(enter()), 'council') : enter(), 'decide', decision);
const dawn = (decision, observed) => act(night(decision, observed), 'advance');
const morning = (decision, observed) => act(dawn(decision, observed), 'begin-morning');
const assign = (state, choice) => act(at(state, choice), 'assign-morning', choice);
function freeze(state) {
  Object.freeze(state.heard);
  return Object.freeze(state);
}
function history(state) {
  return structuredClone({ heard: state.heard, evidence: state.evidence, decision: state.decision, decisionEvidence: state.decisionEvidence, immediate: outcome(state), dawn: dawnReport(state) });
}
const paths = [['repair', true], ['hold', true], ['hold', false]];
const byId = work => Object.fromEntries(work.map(item => [item.id, item]));

test('SCRUM-34 state: morning planning cannot start before the explicit dawn transition', () => {
  for (const state of [createWildState(), enter(), inspect(enter()), night('repair'), night('hold')]) {
    const before = structuredClone(state);
    freeze(state);
    assert.equal(state.morningStarted, false);
    assert.equal(state.morningChoice, null);
    assert.equal(act(state, 'begin-morning'), state);
    for (const choice of ['crossing', 'trail']) assert.equal(act(state, 'assign-morning', choice), state);
    assert.deepEqual(morningOptions(state), []);
    assert.deepEqual(morningWork(state), []);
    assert.equal(morningReport(state), null);
    assert.deepEqual(state, before);
  }
});

test('SCRUM-34 state: dawn reveals obligations but assignment still needs a separate start', () => {
  for (const [decision, observed] of paths) {
    const state = freeze(at(dawn(decision, observed), 'trail'));
    const before = structuredClone(state);
    assert.equal(morningReport(state), null);
    assert.deepEqual(morningOptions(state), []);
    assert.ok(morningWork(state).length >= 3, 'the morning begins with carried obligations');
    assert.equal(act(state, 'assign-morning', 'trail'), state);
    const started = act(state, 'begin-morning');
    assert.equal(started.morningStarted, true);
    assert.equal(started.morningChoice, null);
    assert.equal(started.location, 'council');
    assert.equal(started.dawn, true);
    assert.deepEqual(history(started), history(state));
    assert.deepEqual(state, before);
    const travelled = freeze(at(started, 'crossing'));
    assert.equal(act(travelled, 'begin-morning'), travelled, 'repeated start cannot reset work or teleport the player');
  }
});

test('SCRUM-34 state: each assignment requires its matching work site', () => {
  for (const [decision, observed] of paths) {
    for (const choice of ['crossing', 'trail']) {
      for (const location of ['council', 'crossing', 'trail']) {
        const state = freeze(at(morning(decision, observed), location));
        const before = structuredClone(state);
        const next = act(state, 'assign-morning', choice);
        if (location === choice) {
          assert.equal(next.morningChoice, choice);
          assert.ok(morningReport(next));
        } else {
          assert.equal(next, state, `${choice} cannot be completed from ${location}`);
          assert.equal(morningReport(next), null);
        }
        assert.deepEqual(state, before, 'the input snapshot remains unchanged');
      }
    }
  }
});

test('SCRUM-34 state: one assignment uses the morning capacity even after travel or repeated requests', () => {
  for (const [decision, observed] of paths) {
    for (const choice of ['crossing', 'trail']) {
      let state = assign(morning(decision, observed), choice);
      const report = structuredClone(morningReport(state));
      const ledger = structuredClone(morningWork(state));
      for (const location of ['crossing', 'trail', 'council', choice]) {
        state = freeze(at(state, location));
        for (const retry of [choice, 'crossing', 'trail', choice]) assert.equal(act(state, 'assign-morning', retry), state);
        assert.equal(act(state, 'begin-morning'), state);
        assert.equal(act(state, 'advance'), state);
        assert.equal(state.morningChoice, choice);
        assert.deepEqual(morningWork(state), ledger, 'travel cannot perform a second job');
        assert.deepEqual(morningReport(state), report);
      }
    }
  }
});

test('SCRUM-34 history: morning work never rewrites night evidence or either earlier report', () => {
  for (const [decision, observed] of paths) {
    for (const choice of ['crossing', 'trail']) {
      let state = morning(decision, observed);
      const before = history(state);
      state = assign(freeze(state), choice);
      for (const location of ['crossing', 'trail', 'council']) {
        state = at(state, location);
        state = act(state, 'inspect');
        state = act(state, 'decide', decision === 'repair' ? 'hold' : 'repair');
        for (const person of ['orin', 'sera', 'vela']) state = act(state, 'hear', person);
        assert.deepEqual(history(state), before);
      }
      if (decision === 'hold' && !observed && choice === 'crossing') {
        assert.equal(morningReport(state).scene, 'anchor-found', 'morning can discover the fastening independently');
        assert.equal(state.evidence, false, 'that discovery is not a night observation');
        assert.equal(state.decisionEvidence, false, 'nor evidence the player had at commitment');
      }
    }
  }
  for (const state of [dawn('hold'), morning('hold')]) {
    const before = history(state);
    for (const person of ['orin', 'sera', 'vela']) assert.equal(act(freeze(state), 'hear', person), state, 'post-dawn claims cannot enter the night archive');
    assert.deepEqual(history(state), before);
  }
});

test('SCRUM-34 history: late night evidence remains distinct from an uninformed commitment through morning', () => {
  const held = night('hold', false);
  const lateInspection = at(inspect(held), 'council');
  assert.equal(lateInspection.evidence, true);
  assert.equal(lateInspection.decisionEvidence, false);
  const started = act(act(lateInspection, 'advance'), 'begin-morning');
  const before = history(started);
  for (const choice of ['crossing', 'trail']) assert.deepEqual(history(assign(started, choice)), before);
});

test('SCRUM-34 planning: two competing options disclose a cost without performing either job', () => {
  for (const [decision, observed] of paths) {
    const state = freeze(morning(decision, observed));
    const before = structuredClone(state);
    const options = morningOptions(state);
    assert.deepEqual(options.map(option => option.id).sort(), ['crossing', 'trail']);
    for (const option of options) {
      assert.equal(option.location, option.id);
      for (const field of ['title', 'detail', 'cost']) assert.ok(typeof option[field] === 'string' && option[field].trim(), field);
    }
    assert.match(options.find(option => option.id === 'crossing').cost, /trail/i);
    assert.match(options.find(option => option.id === 'trail').cost, /crossing|anchor/i);
    assert.equal(morningReport(state), null);
    assert.deepEqual(state, before);
  }
  const repaired = morningOptions(morning('repair')).find(option => option.id === 'crossing');
  const held = morningOptions(morning('hold')).find(option => option.id === 'crossing');
  assert.match(repaired.title, /guid/i);
  assert.match(held.title, /inspect/i);
  assert.notDeepEqual(repaired, held, 'the earlier commitment must change the work now possible');
});

test('SCRUM-34 ledger: carried work keeps its identity, owner and origin as statuses change', () => {
  for (const [decision, observed] of paths) {
    const baseline = byId(morningWork(dawn(decision, observed)));
    assert.deepEqual(Object.keys(baseline).sort(), decision === 'repair' ? ['crew', 'crossing', 'families', 'trail'] : ['crossing', 'families', 'trail']);
    for (const choice of ['crossing', 'trail']) {
      const completed = assign(morning(decision, observed), choice);
      const work = morningWork(completed);
      assert.equal(new Set(work.map(item => item.id)).size, work.length, 'a repeated obligation is updated rather than duplicated');
      assert.deepEqual(work.map(item => item.id).sort(), Object.keys(baseline).sort());
      for (const item of work) {
        for (const field of ['label', 'owner', 'origin', 'status', 'detail']) assert.ok(typeof item[field] === 'string' && item[field].trim(), field);
        assert.equal(item.owner, baseline[item.id].owner);
        assert.equal(item.origin, baseline[item.id].origin);
      }
      const report = morningReport(completed);
      assert.deepEqual(report.threads, work, 'the report and work ledger agree about outstanding obligations');
      assert.deepEqual(report.voices.map(voice => voice.id).sort(), ['orin', 'sera', 'vela']);
      for (const voice of report.voices) assert.ok(voice.line.trim());
    }
  }
});

test('SCRUM-34 outcomes: crossing assignment advances passage only after the prior repair', () => {
  const repair = assign(morning('repair'), 'crossing');
  const repairedWork = byId(morningWork(repair));
  assert.equal(morningReport(repair).scene, 'crossing-guided');
  assert.match(repairedWork.families.status, /first party.*across/i);
  assert.match(repairedWork.families.detail, /partly|partial|remaining/i, 'one party is not the entire promise');
  assert.match(repairedWork.trail.status, /defer/i);
  assert.match(repairedWork.crew.status, /rest/i, 'guidance does not spend the exhausted repair crew again');
  assert.match(morningReport(repair).uncertainty, /does not guarantee.*conditions/i);
  for (const observed of [false, true]) {
    const hold = assign(morning('hold', observed), 'crossing');
    const heldWork = byId(morningWork(hold));
    assert.equal(morningReport(hold).scene, 'anchor-found');
    assert.match(heldWork.crossing.status, /repair pending/i);
    assert.match(heldWork.crossing.detail, /closed/i);
    assert.match(heldWork.families.status, /waiting/i);
    assert.match(heldWork.trail.status, /defer/i);
    assert.equal(heldWork.crew, undefined, 'a hold cannot invent overnight repair exhaustion');
    assert.match(morningReport(hold).uncertainty, /not.*cause.*completed repair/i);
    assert.notDeepEqual(morningReport(hold), morningReport(repair));
  }
});

test('SCRUM-34 outcomes: a trail check spends the morning without dating tracks or identifying a culprit', () => {
  for (const [decision, observed] of paths) {
    const state = assign(morning(decision, observed), 'trail');
    const report = morningReport(state);
    const work = byId(morningWork(state));
    assert.equal(report.scene, 'trail-checked');
    assert.match(work.trail.status, /checked/i);
    assert.match(work.trail.detail, /undated/i);
    assert.match(report.text, /cannot date.*identify/i);
    assert.match(report.uncertainty, /no culprit/i);
    assert.match(work.crossing.status, /defer/i);
    assert.match(work.families.status, /waiting/i);
    if (decision === 'repair') {
      assert.match(work.trail.detail, /unobserved night/i);
      assert.match(work.crew.status, /rest/i);
    } else {
      assert.match(report.uncertainty, /watch was staffed/i);
      assert.equal(work.crew, undefined);
      if (!observed) assert.match(work.crossing.detail, /unverified/i, 'trail marks cannot establish the unseen anchor condition');
    }
  }
});

test('SCRUM-34 projections: callers cannot mutate later options, ledger records or reports', () => {
  const state = freeze(assign(morning('repair'), 'trail'));
  const original = structuredClone(state);
  const expected = { options: structuredClone(morningOptions(state)), work: structuredClone(morningWork(state)), report: structuredClone(morningReport(state)) };
  const options = morningOptions(state);
  const work = morningWork(state);
  const report = morningReport(state);
  options[0].cost = 'reader changed the cost';
  options.pop();
  work[0].origin = 'reader invented an origin';
  work.pop();
  report.threads[0].status = 'reader completed another job';
  report.voices[0].line = 'reader invented a claim';
  report.threads.pop();
  assert.deepEqual(morningOptions(state), expected.options);
  assert.deepEqual(morningWork(state), expected.work);
  assert.deepEqual(morningReport(state), expected.report);
  assert.deepEqual(state, original);
});

test('SCRUM-34 state: invalid assignment values and action names preserve every stage', () => {
  const invalid = [undefined, null, '', 'council', 'overlook', 'Crossing', 'crossing-guided', 'repair', '__proto__', 'constructor', 0, false, {}, [], ['crossing'], new String('trail'), Object.create(null)];
  for (const state of [createWildState(), enter(), dawn('hold'), at(morning('repair'), 'crossing'), at(morning('hold'), 'trail'), assign(morning('hold'), 'crossing')]) {
    const before = structuredClone(state);
    freeze(state);
    for (const value of invalid) assert.equal(act(state, 'assign-morning', value), state);
    for (const action of [undefined, null, 'morning', 'finish-morning', 'ASSIGN-MORNING', {}, ['begin-morning'], new String('begin-morning')]) assert.equal(act(state, action, 'trail'), state);
    assert.deepEqual(state, before);
  }
});

test('SCRUM-34 replay: a fresh run inherits neither morning work nor earlier evidence', () => {
  for (const [decision, observed] of paths) {
    for (const choice of ['crossing', 'trail']) {
      const first = freeze(assign(morning(decision, observed), choice));
      const before = structuredClone(first);
      const firstReport = structuredClone(morningReport(first));
      const restarted = act(first, 'restart');
      assert.deepEqual(restarted, createWildState());
      assert.equal(restarted.morningStarted, false);
      assert.equal(restarted.morningChoice, null);
      assert.deepEqual(morningOptions(restarted), []);
      assert.deepEqual(morningWork(restarted), []);
      assert.equal(morningReport(restarted), null);
      assert.notEqual(restarted.heard, first.heard);
      const second = act(act(act(restarted, 'enter'), 'decide', 'hold'), 'advance');
      const secondCompleted = assign(act(second, 'begin-morning'), choice === 'trail' ? 'crossing' : 'trail');
      assert.equal(secondCompleted.decisionEvidence, false);
      assert.equal(secondCompleted.evidence, false);
      assert.deepEqual(first, before);
      assert.deepEqual(morningReport(first), firstReport);
    }
  }
});

test('SCRUM-34 fallback: the morning controller remains callable without WebGL', () => {
  for (const getContext of [() => null, () => { throw new Error('WebGL denied by test fixture'); }]) {
    const failures = [];
    let readyCount = 0;
    const scene = createForestScene({ getContext }, { onFailure: message => failures.push(message), onReady: () => { readyCount++; } });
    assert.doesNotThrow(() => {
      scene.setDawn(true);
      for (const morning of ['crossing-guided', 'anchor-found', 'trail-checked', null]) {
        scene.setMorning(morning);
        scene.setPaused(true);
        scene.setReducedMotion(true);
        scene.travelTo(morning === 'trail-checked' ? 'trail' : 'crossing');
      }
      scene.setMorning(null);
      scene.setOutcome(null);
      scene.setDawn(false);
      scene.travelTo('overlook');
      scene.dispose();
      scene.setMorning('trail-checked');
      scene.dispose();
    });
    assert.equal(readyCount, 0, 'the no-GPU controller never claims pixels rendered');
    assert.equal(failures.length, 1);
    assert.match(failures[0], /unavailable/i);
  }
});
