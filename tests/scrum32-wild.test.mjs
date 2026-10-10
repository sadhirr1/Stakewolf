import test from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { createStaticServer } from '../server.mjs';
import { PEOPLE, createWildState, act, outcome } from '../public/wild/state.js';
import { createForestScene } from '../public/wild/scene.js';

const enter = () => act(createWildState(), 'enter');
const inspect = state => act(act(state, 'travel', 'crossing'), 'inspect');
const returnWithEvidence = () => act(inspect(enter()), 'travel', 'council');
function freezeState(state) {
  Object.freeze(state.heard);
  return Object.freeze(state);
}

test('SCRUM-32 state: the opening blocks exploration, accounts, evidence, and decisions until entry', () => {
  const state = freezeState(createWildState());
  assert.deepEqual(state, { started: false, location: 'overlook', heard: [], evidence: false, decision: null });
  for (const [type, value] of [
    ['travel', 'council'], ['travel', 'trail'], ['travel', 'crossing'],
    ['hear', 'orin'], ['hear', 'sera'], ['hear', 'vela'],
    ['inspect'], ['decide', 'hold'], ['decide', 'repair'],
  ]) assert.equal(act(state, type, value), state, `${type}: ${value}`);
  assert.equal(outcome(state), null);
  const started = act(state, 'enter');
  assert.equal(started.started, true);
  assert.equal(started.location, 'council');
  assert.deepEqual(started.heard, []);
  assert.equal(started.evidence, false);
  assert.equal(started.decision, null);
});

test('SCRUM-32 state: the three authored accounts are unique and can only be recorded at council', () => {
  assert.deepEqual(Object.keys(PEOPLE).sort(), ['orin', 'sera', 'vela']);
  let state = enter();
  for (const person of ['vela', 'orin', 'sera', 'vela', 'orin', 'sera']) {
    const before = structuredClone(state);
    const next = act(freezeState(state), 'hear', person);
    assert.deepEqual(state, before, 'hearing an account preserves its input snapshot');
    state = next;
  }
  assert.deepEqual(state.heard, ['vela', 'orin', 'sera']);
  assert.equal(state.evidence, false, 'an account does not become an observed field note');
  for (const location of ['trail', 'crossing']) {
    const away = freezeState(act(enter(), 'travel', location));
    for (const person of Object.keys(PEOPLE)) assert.equal(act(away, 'hear', person), away);
    assert.deepEqual(away.heard, []);
  }
});

test('SCRUM-32 state: only an actual inspection at the crossing creates evidence', () => {
  for (const location of ['council', 'trail']) {
    const state = freezeState(act(enter(), 'travel', location));
    assert.equal(act(state, 'inspect'), state);
    assert.equal(state.evidence, false);
  }
  const crossing = freezeState(act(enter(), 'travel', 'crossing'));
  assert.equal(crossing.evidence, false, 'arrival alone is not inspection');
  const observed = act(crossing, 'inspect');
  assert.equal(crossing.evidence, false, 'the earlier snapshot remains unobserved');
  assert.equal(observed.evidence, true);
  assert.equal(observed.decision, null);
  assert.deepEqual(act(freezeState(observed), 'inspect'), observed, 'repeated inspection adds no second record');
  assert.equal(act(observed, 'travel', 'council').evidence, true, 'the observed condition survives travel');
});

test('SCRUM-32 state: repair requires observed evidence and council presence', () => {
  const uninspected = freezeState(enter());
  assert.equal(act(uninspected, 'decide', 'repair'), uninspected);
  const accounts = Object.keys(PEOPLE).reduce((state, id) => act(state, 'hear', id), enter());
  assert.equal(act(accounts, 'decide', 'repair'), accounts, 'even all accounts do not substitute for inspection');
  for (const location of ['trail', 'crossing']) {
    const away = freezeState(act(inspect(enter()), 'travel', location));
    for (const choice of ['repair', 'hold']) assert.equal(act(away, 'decide', choice), away);
  }
  const council = freezeState(returnWithEvidence());
  const repaired = act(council, 'decide', 'repair');
  assert.equal(council.decision, null);
  assert.equal(repaired.decision, 'repair');
  const result = outcome(repaired);
  assert.match(result.consequence, /being repaired/i, 'work has begun, not completed');
  assert.match(result.consequence, /northern path is unwatched/i);
  assert.match(result.uncertainty, /no crossing is approved.*needs inspection/i);
  assert.match(result.uncertainty, /unknown/i, 'the cause remains unresolved');
});

test('SCRUM-32 state: hold is available without investigation and reports the missing evidence truthfully', () => {
  const held = act(freezeState(enter()), 'decide', 'hold');
  assert.equal(held.decision, 'hold');
  assert.equal(held.evidence, false);
  assert.deepEqual(held.heard, []);
  const result = outcome(held);
  assert.match(result.consequence, /watch remains staffed.*crossing is postponed/i);
  assert.match(result.uncertainty, /without inspecting.*unverified/i);
  assert.doesNotMatch(result.uncertainty, /loose anchor/i, 'unseen anchor condition is not presented as established evidence');
  const observedHold = outcome(act(returnWithEvidence(), 'decide', 'hold'));
  assert.match(observedHold.uncertainty, /loose anchor remains unresolved/i);
  assert.match(observedHold.uncertainty, /not repaired/i);
});

test('SCRUM-32 state: commitment is applied once and cannot be replaced by a later choice', () => {
  for (const choice of ['repair', 'hold']) {
    let state = act(returnWithEvidence(), 'decide', choice);
    const expectedOutcome = outcome(state);
    for (const repeated of [choice, choice, choice === 'repair' ? 'hold' : 'repair']) {
      const committed = freezeState(state);
      assert.equal(act(committed, 'decide', repeated), committed);
      assert.deepEqual(outcome(committed), expectedOutcome);
    }
    state = act(act(state, 'travel', 'crossing'), 'travel', 'council');
    assert.equal(act(state, 'decide', choice === 'repair' ? 'hold' : 'repair'), state);
    assert.equal(state.decision, choice, 'travel does not unlock another commitment');
  }
});

test('SCRUM-32 state: restart isolates records, observation, and commitment from the earlier run', () => {
  let completed = returnWithEvidence();
  for (const person of Object.keys(PEOPLE)) completed = act(completed, 'hear', person);
  completed = freezeState(act(completed, 'decide', 'repair'));
  const before = structuredClone(completed);
  const restarted = act(completed, 'restart');
  assert.deepEqual(restarted, createWildState());
  assert.notEqual(restarted, completed);
  assert.notEqual(restarted.heard, completed.heard);
  assert.notEqual(createWildState().heard, createWildState().heard, 'new runs own distinct record arrays');
  const second = act(act(act(restarted, 'enter'), 'hear', 'sera'), 'decide', 'hold');
  assert.equal(second.evidence, false);
  assert.equal(second.decision, 'hold');
  assert.deepEqual(second.heard, ['sera']);
  assert.deepEqual(completed, before, 'playing again cannot mutate the retained earlier snapshot');
});

test('SCRUM-32 state: unsupported actions and values leave a valid run untouched', () => {
  for (const state of [freezeState(enter()), freezeState(returnWithEvidence())]) {
    for (const value of [undefined, null, '', 'missing', '__proto__', 'constructor', 0, false, {}, [], ['orin'], new String('orin'), Object.create(null)]) {
      for (const type of ['travel', 'hear', 'decide']) assert.equal(act(state, type, value), state, `${type} rejects a noncanonical input`);
    }
    for (const type of [undefined, null, '', 'finish', {}, 0]) assert.equal(act(state, type, 'hold'), state);
    assert.equal(act(state, 'travel', 'overlook'), state, 'the opening is reached through restart only');
    assert.equal(outcome(state), null);
  }
});

test('SCRUM-32 scene: unavailable or denied WebGL reports fallback and preserves callable controls', () => {
  for (const getContext of [() => null, () => { throw new Error('WebGL denied by test fixture'); }]) {
    const messages = [];
    let ready = false;
    const scene = createForestScene({ getContext }, {
      onReady: () => { ready = true; },
      onFailure: message => messages.push(message),
    });
    assert.equal(ready, false, 'the fallback does not claim that a scene rendered');
    assert.equal(messages.length, 1, 'one failure notification is enough for the accessible DOM notice');
    assert.match(messages[0], /unavailable/i);
    assert.doesNotThrow(() => {
      scene.travelTo('council');
      scene.setPaused(true);
      scene.setReducedMotion(true);
      scene.setOutcome('hold');
      scene.setOutcome(null);
      scene.dispose();
      scene.dispose();
    }, 'the app can continue exploring, choosing, replaying, and leaving without a GPU');
  }
});

async function listen(t, options) {
  const server = createStaticServer(options);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  t.after(() => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
  return server.address().port;
}
function read(port, path, method = 'GET') {
  // Preserve raw paths so URL normalization cannot erase the traversal test.
  return new Promise((resolve, reject) => {
    const req = request({ host: '127.0.0.1', port, path, method, agent: false }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('error', reject);
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.setTimeout(3000, () => req.destroy(new Error(`Timed out: ${method} ${path}`)));
    req.end();
  });
}

test('SCRUM-32 HTTP: all six explicit routes deliver exact bytes, correct MIME, and bodyless HEAD', async t => {
  const port = await listen(t);
  for (const [path, file, type] of [
    ['/wild/', 'index.html', 'text/html; charset=utf-8'],
    ['/wild/index.html', 'index.html', 'text/html; charset=utf-8'],
    ['/wild/style.css', 'style.css', 'text/css; charset=utf-8'],
    ['/wild/app.js', 'app.js', 'text/javascript; charset=utf-8'],
    ['/wild/state.js', 'state.js', 'text/javascript; charset=utf-8'],
    ['/wild/scene.js', 'scene.js', 'text/javascript; charset=utf-8'],
  ]) {
    const expected = await readFile(new URL(`../public/wild/${file}`, import.meta.url));
    const get = await read(port, path);
    assert.equal(get.status, 200, path);
    assert.equal(get.headers['content-type'], type, path);
    assert.deepEqual(get.body, expected, path);
    assert.equal(Number(get.headers['content-length']), expected.length, path);
    assert.equal(get.headers['cache-control'], 'no-store', path);
    assert.equal(get.headers['x-content-type-options'], 'nosniff', path);
    assert.match(get.headers['content-security-policy'], /(?:^|; )script-src 'self';/, path);
    assert.match(get.headers['content-security-policy'], /(?:^|; )connect-src 'none';/, path);
    const head = await read(port, path, 'HEAD');
    assert.equal(head.status, 200, path);
    assert.equal(head.body.length, 0, path);
    assert.equal(head.headers['content-type'], type, path);
    assert.equal(Number(head.headers['content-length']), expected.length, path);
    assert.deepEqual((await read(port, `${path}?preview=32`)).body, expected, path);
  }
});

test('SCRUM-32 HTTP: files existing below wild are inaccessible unless explicitly allowlisted', async t => {
  const tempRoot = resolve(tmpdir());
  const directory = await mkdtemp(join(tempRoot, 'stakewolf-wild-'));
  t.after(async () => {
    assert.equal(dirname(resolve(directory)), tempRoot);
    assert.ok(basename(directory).startsWith('stakewolf-wild-'));
    await rm(directory, { recursive: true, force: true });
  });
  await mkdir(join(directory, 'wild'));
  await writeFile(join(directory, 'wild', 'index.html'), '<p>allowlisted fixture</p>');
  await writeFile(join(directory, 'wild', 'unlisted.js'), 'private test fixture');
  await writeFile(join(directory, 'wild', 'app.js.map'), 'private source map fixture');
  const port = await listen(t, { root: directory });
  assert.equal((await read(port, '/wild/')).status, 200, 'fixture root is readable');
  for (const path of ['/wild', '/wild/unlisted.js', '/wild/app.js.map', '/wild/scene.js.map', '/wild/INDEX.html', '/wild//index.html', '/wild/scene.js/extra']) {
    const response = await read(port, path);
    assert.equal(response.status, 404, path);
    assert.equal(response.body.toString(), 'Not found.\n', path);
  }
});

test('SCRUM-32 HTTP: raw and encoded wild traversal is rejected before asset lookup', async t => {
  const port = await listen(t);
  for (const path of [
    '/wild/../index.html', '/wild/./index.html', '/wild/%2e%2e/index.html',
    '/wild/%2E%2E%2Findex.html', '/wild/%2e%2e/%2e%2e/README.md',
    '/wild/%5c..%5cindex.html', '/wild/%00index.html', '/wild/%0ascene.js', '/wild/%ZZ',
  ]) {
    const response = await read(port, path);
    assert.equal(response.status, 400, path);
    assert.equal(response.body.toString(), 'Invalid request path.\n', path);
  }
  assert.equal((await read(port, '/wild/%252e%252e/index.html')).status, 404);
});

test('SCRUM-32 HTTP: mutating and unknown methods never serve the scene', async t => {
  const port = await listen(t);
  for (const method of ['POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']) {
    const response = await read(port, '/wild/', method);
    assert.equal(response.status, 405, method);
    assert.equal(response.headers.allow, 'GET, HEAD', method);
    assert.equal(response.body.toString(), 'Method not allowed.\n', method);
  }
});
