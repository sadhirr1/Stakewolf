import test from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { readFile } from 'node:fs/promises';
import { buildCharacter } from '../public/wild/cast.js';
import { createForestScene } from '../public/wild/scene.js';
import { createStaticServer } from '../server.mjs';

const profiles = {
  orin: { color: [0.40, 0.22, 0.13], fur: [0.48, 0.43, 0.34], trim: [0.67, 0.49, 0.25], index: 0 },
  sera: { color: [0.16, 0.31, 0.25], fur: [0.56, 0.59, 0.54], trim: [0.43, 0.55, 0.39], index: 1 },
  vela: { color: [0.23, 0.23, 0.38], fur: [0.27, 0.31, 0.33], trim: [0.69, 0.64, 0.46], index: 2 },
};

test('SCRUM-35 cast: builds are deterministic, distinct and isolated from caller mutation', () => {
  const cast = [];
  for (const [id, profile] of Object.entries(profiles)) {
    const spec = structuredClone(profile);
    Object.values(spec).filter(Array.isArray).forEach(Object.freeze);
    Object.freeze(spec);
    const first = buildCharacter(id, spec);
    const second = buildCharacter(id, spec);
    assert.ok(Array.isArray(first));
    assert.notEqual(first, second);
    assert.deepEqual(first, second);
    assert.deepEqual(spec, profile, 'geometry construction preserves its palette input');
    first[0] += 100;
    assert.deepEqual(buildCharacter(id, spec), second, 'returned geometry is owned by its caller');
    cast.push(second);
  }
  for (let i = 0; i < cast.length; i++) for (let j = i + 1; j < cast.length; j++) assert.notDeepEqual(cast[i], cast[j]);
});

test('SCRUM-35 cast: finite triangle streams fit the authored character envelope and vertex budget', () => {
  let totalVertices = 0;
  for (const [id, spec] of Object.entries(profiles)) {
    const mesh = buildCharacter(id, spec);
    assert.ok(mesh.length > 0);
    assert.equal(mesh.length % 30, 0, `${id} must contain complete interleaved triangles`);
    totalVertices += mesh.length / 10;
    let top = -Infinity;
    for (let i = 0; i < mesh.length; i += 10) {
      const vertex = mesh.slice(i, i + 10);
      assert.ok(vertex.every(Number.isFinite), `${id} has a nonfinite attribute at vertex ${i / 10}`);
      const [x, y, z, nx, ny, nz, r, g, b, kind] = vertex;
      assert.ok(Math.abs(x) <= 0.85 + 1e-7 && y >= -1e-7 && y <= 2.75 + 1e-7 && z >= -0.8 - 1e-7 && z <= 0.7 + 1e-7, `${id} exceeds its integration envelope`);
      assert.ok(Math.abs(Math.hypot(nx, ny, nz) - 1) < 1e-5, `${id} normal is not unit length`);
      for (const color of [r, g, b]) assert.ok(color >= 0 && color <= 1, `${id} color exceeds the shader input range`);
      assert.ok(kind >= 4 + spec.index && kind <= 4 + spec.index + 0.35 + 1e-7, `${id} animation tag selects another character`);
      top = Math.max(top, y);
    }
    assert.ok(top >= 2.6, `${id} must retain the head height expected by encounter framing`);
  }
  assert.ok(totalVertices < 35000, 'the three character streams exceed the agreed geometry budget');
});

test('SCRUM-35 cast: surfaces have area and lighting normals face with their triangle winding', () => {
  for (const [id, spec] of Object.entries(profiles)) {
    const mesh = buildCharacter(id, spec);
    for (let i = 0; i < mesh.length; i += 30) {
      const a = mesh.slice(i, i + 3), b = mesh.slice(i + 10, i + 13), c = mesh.slice(i + 20, i + 23);
      const u = b.map((value, axis) => value - a[axis]), v = c.map((value, axis) => value - a[axis]);
      const cross = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      const area = Math.hypot(...cross);
      assert.ok(area > 1e-10, `${id} triangle ${i / 30} is degenerate`);
      const averageNormal = [0, 1, 2].map(axis => mesh[i + 3 + axis] + mesh[i + 13 + axis] + mesh[i + 23 + axis]);
      const agreement = cross.reduce((sum, value, axis) => sum + value * averageNormal[axis], 0) / area;
      assert.ok(agreement > 0, `${id} triangle ${i / 30} normals oppose its winding`);
    }
  }
});

test('SCRUM-35 cast: unsupported characters and malformed profiles cannot generate silent substitute geometry', () => {
  for (const id of [undefined, null, '', 'missing', '__proto__', 'constructor', [], ['orin'], new String('orin'), Object.create(null)]) {
    assert.throws(() => buildCharacter(id, profiles.orin), TypeError);
  }
  for (const spec of [undefined, null, {}, { ...profiles.orin, color: [] }, { ...profiles.orin, fur: [0, NaN, 0] }, { ...profiles.orin, trim: [0, 0, Infinity] }, { ...profiles.orin, index: -1 }, { ...profiles.orin, index: 3 }, { ...profiles.orin, index: 0.5 }]) {
    assert.throws(() => buildCharacter('orin', spec), TypeError);
  }
});

function events() {
  const listeners = new Map();
  return {
    addEventListener(type, listener) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(listener); },
    removeEventListener(type, listener) { listeners.get(type)?.delete(listener); },
    emit(type, event = {}) { for (const listener of listeners.get(type) ?? []) listener(event); },
    count() { return [...listeners.values()].reduce((sum, set) => sum + set.size, 0); },
  };
}

// This controlled context verifies JavaScript lifecycle and public projections.
// It neither compiles GLSL nor produces pixels and is not GPU/performance evidence.
function sceneHarness(t, { reducedMotion = false, compileFailure = false } = {}) {
  const frames = new Map(), buffers = new Set(), programs = new Set(), shaders = new Set();
  let frameId = 0, resourceId = 0, draws = 0, uploads = 0, disconnected = false;
  const canvas = { ...events(), width: 0, height: 0, getBoundingClientRect: () => ({ width: 1280, height: 800 }) };
  const doc = { ...events(), hidden: false };
  const win = { ...events(), devicePixelRatio: 1 };
  const gl = {
    createShader() { const value = { id: ++resourceId }; shaders.add(value); return value; },
    getShaderParameter: () => !compileFailure,
    getShaderInfoLog: () => 'Deliberate fixture compilation failure',
    deleteShader(value) { shaders.delete(value); },
    createProgram() { const value = { id: ++resourceId }; programs.add(value); return value; },
    getProgramParameter: () => true,
    deleteProgram(value) { programs.delete(value); },
    createBuffer() { const value = { id: ++resourceId }; buffers.add(value); return value; },
    deleteBuffer(value) { buffers.delete(value); },
    bufferData(target, data) { assert.ok(data instanceof Float32Array); assert.ok(data.every(Number.isFinite), 'uploaded scene contains a nonfinite attribute'); uploads++; },
    getParameter: () => new Float32Array([1, 64]),
    getUniformLocation: (program, name) => `${program.id}:${name}`,
    getAttribLocation: (program, name) => ['aPosition', 'aNormal', 'aColor', 'aKind', 'aSize', 'aPhase'].indexOf(name),
    drawArrays() { draws++; },
  };
  for (const name of ['shaderSource', 'compileShader', 'attachShader', 'linkProgram', 'bindBuffer', 'enableVertexAttribArray', 'disableVertexAttribArray', 'vertexAttribPointer', 'useProgram', 'uniformMatrix4fv', 'uniform4fv', 'uniform3fv', 'uniform1f', 'blendFunc', 'viewport', 'clearColor', 'clear', 'disable', 'depthMask', 'enable', 'depthFunc']) gl[name] = () => {};
  for (const [index, name] of ['VERTEX_SHADER', 'FRAGMENT_SHADER', 'COMPILE_STATUS', 'LINK_STATUS', 'ARRAY_BUFFER', 'STATIC_DRAW', 'FLOAT', 'ALIASED_POINT_SIZE_RANGE', 'POINTS', 'TRIANGLES', 'SRC_ALPHA', 'ONE', 'ONE_MINUS_SRC_ALPHA', 'COLOR_BUFFER_BIT', 'DEPTH_BUFFER_BIT', 'DEPTH_TEST', 'BLEND', 'CULL_FACE', 'LEQUAL'].entries()) gl[name] = index + 1;
  canvas.getContext = () => gl;
  const replacements = {
    document: doc, window: win,
    requestAnimationFrame(callback) { const id = ++frameId; frames.set(id, callback); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
    ResizeObserver: class { observe() {} disconnect() { disconnected = true; } },
  };
  const originals = new Map();
  for (const [name, value] of Object.entries(replacements)) {
    originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
  }
  let controller;
  t.after(() => {
    controller?.dispose();
    for (const [name, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name];
    }
  });
  const projected = [], failures = [];
  let ready = 0;
  if (compileFailure) t.mock.method(console, 'warn', () => {});
  controller = createForestScene(canvas, { reducedMotion, onProject: points => projected.push(structuredClone(points)), onReady: () => { ready++; }, onFailure: message => failures.push(message) });
  return {
    controller, canvas, doc, win, failures,
    snapshot: () => structuredClone(projected.at(-1)),
    stats: () => ({ frames: frames.size, draws, uploads, buffers: buffers.size, programs: programs.size, shaders: shaders.size, ready, disconnected, projections: projected.length }),
    tick(time) { const callbacks = [...frames.values()]; frames.clear(); for (const callback of callbacks) callback(time); },
  };
}

test('SCRUM-35 controller: reduced motion keeps encounters immediate, distinct and safely reversible', t => {
  const h = sceneHarness(t, { reducedMotion: true });
  assert.equal(h.stats().ready, 1);
  assert.deepEqual(h.failures, []);
  assert.equal(h.stats().frames, 0);
  h.controller.travelTo('council');
  const council = h.snapshot();
  const uploadCount = h.stats().uploads;
  for (const person of ['orin', 'sera', 'vela']) {
    h.controller.focusPerson(person);
    assert.notDeepEqual(h.snapshot(), council, `${person} must receive an encounter camera`);
    assert.ok(h.snapshot().every(point => Number.isFinite(point.x) && Number.isFinite(point.y)));
    assert.equal(h.stats().frames, 0);
    const focused = h.snapshot();
    for (const invalid of [undefined, '', '__proto__', 'constructor', ['orin'], new String('orin'), Object.create(null)]) {
      h.controller.focusPerson(invalid);
      assert.deepEqual(h.snapshot(), focused, 'invalid focus cannot change the camera');
    }
    h.controller.focusPerson(null);
    assert.deepEqual(h.snapshot(), council, 'leaving the encounter restores the clearing');
  }
  h.controller.focusPerson('vela');
  h.controller.travelTo('council');
  assert.deepEqual(h.snapshot(), council, 'travel clears any retained encounter');
  assert.equal(h.stats().uploads, uploadCount, 'encounters do not rebuild/upload character meshes');
});

test('SCRUM-35 controller: pause, hidden pages and disposal bound cinematic scheduling and resources', t => {
  const h = sceneHarness(t);
  assert.equal(h.stats().frames, 1);
  h.controller.travelTo('council');
  h.tick(100);
  h.tick(350);
  h.controller.setPaused(true);
  assert.equal(h.stats().frames, 0);
  const paused = h.snapshot(), drawCount = h.stats().draws;
  h.tick(5000);
  assert.deepEqual(h.snapshot(), paused);
  assert.equal(h.stats().draws, drawCount);
  h.controller.focusPerson('orin');
  assert.equal(h.stats().frames, 0, 'paused focus remains immediate');
  h.controller.setPaused(false);
  assert.equal(h.stats().frames, 1);
  h.doc.hidden = true;
  h.doc.emit('visibilitychange');
  assert.equal(h.stats().frames, 0);
  const hiddenDraws = h.stats().draws;
  h.tick(60000);
  h.controller.setDawn(true);
  assert.equal(h.stats().draws, hiddenDraws, 'hidden changes must not render a background frame');
  h.doc.hidden = false;
  h.doc.emit('visibilitychange');
  assert.equal(h.stats().frames, 1);
  h.controller.setReducedMotion(true);
  assert.equal(h.stats().frames, 0);
  assert.ok(h.stats().buffers > 0 && h.stats().programs > 0);
  h.controller.dispose();
  const disposed = h.stats();
  assert.equal(disposed.frames, 0);
  assert.equal(disposed.buffers + disposed.programs + disposed.shaders, 0, 'all allocated GPU handles must be released');
  assert.equal(disposed.disconnected, true);
  assert.equal(h.canvas.count() + h.doc.count() + h.win.count(), 0);
  h.controller.focusPerson('sera');
  h.controller.travelTo('crossing');
  h.controller.setMorning('trail-checked');
  h.controller.setDawn(false);
  h.controller.setReducedMotion(false);
  h.controller.setPaused(false);
  h.controller.dispose();
  assert.deepEqual(h.stats(), disposed, 'late controller calls cannot revive disposed work');
});

test('SCRUM-35 controller: slow animation frames still settle encounters before enabling world targets', t => {
  const h = sceneHarness(t);
  let time = 100;
  h.tick(time);
  const settle = () => {
    for (let step = 0; step < 16; step++) {
      time += 250;
      h.tick(time);
      const points = h.snapshot();
      assert.ok(points.every(point => Number.isFinite(point.x) && Number.isFinite(point.y)));
      if (points.some(point => point.visible)) return;
    }
    assert.fail('camera did not settle within four seconds of slow frames');
  };
  h.controller.travelTo('council');
  assert.ok(h.snapshot().every(point => !point.visible), 'moving world targets must not be clickable');
  settle();
  const uploadCount = h.stats().uploads;
  for (const person of ['orin', 'sera', 'vela']) {
    h.controller.focusPerson(person);
    assert.ok(h.snapshot().every(point => !point.visible));
    settle();
    h.controller.focusPerson(null);
    assert.ok(h.snapshot().every(point => !point.visible));
    settle();
  }
  assert.equal(h.stats().uploads, uploadCount, 'camera animation must reuse the authored meshes');
});

test('SCRUM-35 controller: shader initialization failure releases resources and retains readable-flow controls', t => {
  const h = sceneHarness(t, { compileFailure: true });
  assert.equal(h.stats().ready, 0);
  assert.equal(h.stats().projections, 0);
  assert.equal(h.failures.length, 1);
  assert.equal(h.stats().buffers + h.stats().programs + h.stats().shaders, 0);
  assert.doesNotThrow(() => {
    h.controller.travelTo('council'); h.controller.focusPerson('orin');
    h.controller.setPaused(true); h.controller.setReducedMotion(true);
    h.controller.setOutcome('hold'); h.controller.setDawn(true);
    h.controller.setMorning('anchor-found'); h.controller.setMorning(null);
    h.controller.focusPerson(null); h.controller.dispose(); h.controller.dispose();
  });
  assert.equal(h.failures.length, 1);
  assert.equal(h.stats().frames, 0);
});

async function listen(t) {
  const server = createStaticServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  t.after(() => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
  return server.address().port;
}
function read(port, path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = request({ host: '127.0.0.1', port, path, method, agent: false }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk)); response.on('error', reject);
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject); req.setTimeout(3000, () => req.destroy(new Error(`Timed out: ${method} ${path}`))); req.end();
  });
}

test('SCRUM-35 HTTP: the new cast module is served exactly with browser-safe metadata', async t => {
  const port = await listen(t);
  const bytes = await readFile(new URL('../public/wild/cast.js', import.meta.url));
  for (const path of ['/wild/cast.js', '/wild/cast.js?preview=35']) {
    const response = await read(port, path);
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, bytes);
    assert.equal(response.headers['content-type'], 'text/javascript; charset=utf-8');
    assert.equal(Number(response.headers['content-length']), bytes.length);
    assert.equal(response.headers['cache-control'], 'no-store');
    assert.equal(response.headers['x-content-type-options'], 'nosniff');
    assert.match(response.headers['content-security-policy'], /script-src 'self';/);
    const head = await read(port, path, 'HEAD');
    assert.equal(head.status, 200);
    assert.equal(head.body.length, 0);
    assert.equal(Number(head.headers['content-length']), bytes.length);
  }
});

test('SCRUM-35 HTTP: adding cast does not enable neighbouring paths, traversal or writes', async t => {
  const port = await listen(t);
  for (const path of ['/wild/cast.js.map', '/wild/CAST.js', '/wild/cast.js/extra', '/wild//cast.js']) assert.equal((await read(port, path)).status, 404, path);
  for (const path of ['/wild/../cast.js', '/wild/%2e%2e/cast.js', '/wild/%5c..%5ccast.js', '/wild/%00cast.js']) assert.equal((await read(port, path)).status, 400, path);
  for (const method of ['POST', 'PUT', 'DELETE']) {
    const response = await read(port, '/wild/cast.js', method);
    assert.equal(response.status, 405);
    assert.equal(response.headers.allow, 'GET, HEAD');
  }
});
