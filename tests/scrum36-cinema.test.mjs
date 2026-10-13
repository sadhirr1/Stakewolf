import test from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { posix } from 'node:path';
import { createHash } from 'node:crypto';
import { createStaticServer } from '../server.mjs';

const assetRoot = new URL('../public/wild/assets/', import.meta.url);
const runtimeTypes = new Map([
  ['.gltf', 'model/gltf+json'], ['.glb', 'model/gltf-binary'],
  ['.bin', 'application/octet-stream'], ['.jpg', 'image/jpeg'], ['.png', 'image/png'],
]);
async function runtimeFiles(directory = '') {
  const paths = [];
  for (const entry of await readdir(new URL(directory, assetRoot), { withFileTypes: true })) {
    const path = `${directory}${entry.name}`;
    if (entry.isDirectory()) paths.push(...await runtimeFiles(`${path}/`));
    else if (runtimeTypes.has(posix.extname(path))) paths.push(path);
  }
  return paths.sort();
}

function dependencyPath(modelPath, uri) {
  assert.equal(typeof uri, 'string', `${modelPath} has an invalid dependency URI`);
  assert.ok(uri.length > 0 && !/[:\\?#%\u0000-\u0020\u007f]/.test(uri) && !uri.startsWith('/'),
    `${modelPath}: dependencies must stay in the local packaged asset tree (${uri})`);
  const resolved = posix.normalize(posix.join(posix.dirname(modelPath), uri));
  assert.ok(resolved !== '..' && !resolved.startsWith('../') && !posix.isAbsolute(resolved),
    `${modelPath}: dependency escapes the local asset tree (${uri})`);
  return resolved;
}

async function readModel(path) {
  const bytes = await readFile(new URL(path, assetRoot));
  if (path.endsWith('.gltf')) return { model: JSON.parse(bytes.toString()), embedded: null };
  assert.equal(bytes.toString('ascii', 0, 4), 'glTF', `${path} has a GLB header`);
  assert.equal(bytes.readUInt32LE(4), 2, `${path} uses GLB 2`);
  assert.equal(bytes.readUInt32LE(8), bytes.length, `${path} is not truncated`);
  let offset = 12, model, embedded;
  while (offset < bytes.length) {
    assert.ok(offset + 8 <= bytes.length, `${path} has a complete chunk header`);
    const length = bytes.readUInt32LE(offset), type = bytes.readUInt32LE(offset + 4);
    offset += 8;
    assert.equal(length % 4, 0, `${path} chunks are aligned`);
    assert.ok(offset + length <= bytes.length, `${path} chunk exceeds its container`);
    if (type === 0x4e4f534a) model = JSON.parse(bytes.toString('utf8', offset, offset + length));
    if (type === 0x004e4942) embedded = bytes.subarray(offset, offset + length);
    offset += length;
  }
  assert.ok(model, `${path} has a JSON chunk`);
  return { model, embedded };
}

test('SCRUM-36 assets: the retained inventory identifies every runtime file by size and checksum', async () => {
  const manifest = JSON.parse(await readFile(new URL('manifest.json', assetRoot), 'utf8'));
  const files = await runtimeFiles();
  assert.equal(manifest.schemaVersion, 1);
  assert.deepEqual(manifest.files.map(file => file.path).sort(), files, 'inventory must cover every packaged runtime asset exactly once');
  assert.equal(manifest.runtimeFileCount, files.length);
  let total = 0;
  for (const entry of manifest.files) {
    const bytes = await readFile(new URL(entry.path, assetRoot));
    assert.equal(bytes.length, entry.bytes, entry.path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), entry.sha256, entry.path);
    if (entry.md5) assert.equal(createHash('md5').update(bytes).digest('hex'), entry.md5, `${entry.path} matches its recorded source bytes`);
    assert.equal(entry.mimeType, runtimeTypes.get(posix.extname(entry.path)), entry.path);
    total += bytes.length;
  }
  assert.equal(manifest.runtimeBytes, total);
});

test('SCRUM-36 assets: models and their buffer/image dependencies are complete local glTF packages', async () => {
  const files = await runtimeFiles(), packaged = new Set(files);
  const models = files.filter(path => /\.gl(?:tf|b)$/.test(path));
  assert.ok(models.length >= 3, 'the environment models and provisional wolf must be packaged');
  assert.ok(packaged.has('wolf/wolf.glb'));
  for (const path of models) {
    const { model, embedded } = await readModel(path);
    assert.equal(model.asset.version, '2.0', path);
    assert.ok(model.meshes?.length > 0 && model.scenes?.length > 0, `${path} contains a renderable scene`);
    const buffers = [];
    for (const buffer of model.buffers ?? []) {
      const dependency = buffer.uri ? dependencyPath(path, buffer.uri) : null;
      if (dependency) assert.ok(packaged.has(dependency), `${path} needs missing ${dependency}`);
      const bytes = dependency ? await readFile(new URL(dependency, assetRoot)) : embedded;
      assert.ok(bytes && Number.isInteger(buffer.byteLength) && buffer.byteLength > 0, `${path} has buffer bytes`);
      assert.ok(bytes.length >= buffer.byteLength && bytes.length - buffer.byteLength <= 3,
        `${path} buffer length matches its glTF metadata (allowing GLB padding)`);
      buffers.push(bytes);
    }
    for (const view of model.bufferViews ?? []) {
      const buffer = buffers[view.buffer];
      assert.ok(buffer, `${path} bufferView refers to an existing buffer`);
      assert.ok(Number.isInteger(view.byteLength) && view.byteLength > 0 && (view.byteOffset ?? 0) >= 0);
      assert.ok((view.byteOffset ?? 0) + view.byteLength <= buffer.length, `${path} bufferView is in bounds`);
    }
    for (const image of model.images ?? []) {
      if (image.uri) assert.ok(packaged.has(dependencyPath(path, image.uri)), `${path} has its local texture`);
      else assert.ok(model.bufferViews?.[image.bufferView] && /^image\/(png|jpeg)$/.test(image.mimeType),
        `${path} embedded texture has a valid bufferView and MIME`);
    }
    // Check the actual position bytes rather than trusting the JSON bounds alone.
    for (const mesh of model.meshes) for (const primitive of mesh.primitives) {
      const accessor = model.accessors[primitive.attributes.POSITION];
      assert.ok(accessor && accessor.type === 'VEC3' && accessor.componentType === 5126 && accessor.count > 0,
        `${path} has supported floating-point positions`);
      const view = model.bufferViews[accessor.bufferView], buffer = buffers[view.buffer];
      const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0), stride = view.byteStride ?? 12;
      assert.ok((accessor.byteOffset ?? 0) + (accessor.count - 1) * stride + 12 <= view.byteLength,
        `${path} position accessor cannot overrun its bufferView`);
      for (let i = 0; i < accessor.count; i++) for (let axis = 0; axis < 3; axis++) {
        assert.ok(Number.isFinite(buffer.readFloatLE(start + i * stride + axis * 4)), `${path} contains a nonfinite position`);
      }
    }
  }
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
function policy(response) {
  return Object.fromEntries(response.headers['content-security-policy'].split(';')
    .map(part => part.trim().split(/\s+/)).filter(([name]) => name)
    .map(([name, ...sources]) => [name, sources]));
}

test('SCRUM-36 HTTP: the bundle and every packaged model/texture are served byte-exactly with usable MIME and HEAD', async t => {
  const port = await listen(t);
  const files = [['cinema.bundle.js', 'text/javascript'], ...(await runtimeFiles()).map(path => [`assets/${path}`, runtimeTypes.get(posix.extname(path))])];
  for (const [file, type] of files) {
    const path = `/wild/${file}`, expected = await readFile(new URL(`../public/wild/${file}`, import.meta.url));
    const get = await read(port, `${path}?preview=36`), head = await read(port, path, 'HEAD');
    assert.equal(get.status, 200, path);
    assert.equal(get.headers['content-type'].split(';')[0], type, path);
    assert.deepEqual(get.body, expected, path);
    assert.equal(get.headers['x-content-type-options'], 'nosniff', path);
    assert.equal(Number(get.headers['content-length']), expected.length, path);
    assert.equal(head.status, 200, path);
    assert.equal(head.body.length, 0, path);
    assert.equal(Number(head.headers['content-length']), expected.length, path);
    assert.equal(head.headers['content-type'], get.headers['content-type'], path);
  }
});

test('SCRUM-36 HTTP: only the wild document permits local model fetches and embedded model images', async t => {
  const port = await listen(t);
  for (const path of ['/wild/', '/wild/index.html', '/wild/cinema.bundle.js']) {
    const response = await read(port, path), csp = policy(response);
    assert.equal(response.status, 200);
    assert.deepEqual(csp['script-src'], ["'self'"]);
    assert.deepEqual(csp['connect-src'], ["'self'", 'blob:']);
    assert.deepEqual(csp['img-src'], ["'self'", 'data:', 'blob:']);
    for (const directive of ['object-src', 'base-uri', 'frame-ancestors', 'form-action']) assert.deepEqual(csp[directive], ["'none'"]);
  }
  for (const path of ['/', '/bootstrap.js', '/app.js']) {
    const csp = policy(await read(port, path));
    assert.deepEqual(csp['connect-src'], ["'none'"]);
    assert.deepEqual(csp['script-src'], ["'self'"]);
    assert.deepEqual(csp['img-src'], ["'self'", 'data:']);
  }
});

test('SCRUM-36 HTTP: adding asset routes does not expose neighbouring files or accept traversal and writes', async t => {
  const port = await listen(t);
  for (const path of ['/wild/cinema.bundle.js.map', '/wild/cinema.bundle.js/extra', '/wild/assets/wolf/missing.glb',
    '/wild/assets/wolf/wolf.obj', '/wild/assets/.git/config', '/node_modules/three/package.json', '/scripts/asset-prep-wolf.mjs']) {
    assert.equal((await read(port, path)).status, 404, path);
  }
  for (const path of ['/wild/assets/../app.js', '/wild/assets/%2e%2e/app.js', '/wild/assets/%5c..%5capp.js', '/wild/assets/%00wolf.glb']) {
    assert.equal((await read(port, path)).status, 400, path);
  }
  for (const method of ['POST', 'PUT', 'DELETE']) {
    const response = await read(port, '/wild/assets/wolf/wolf.glb', method);
    assert.equal(response.status, 405); assert.equal(response.headers.allow, 'GET, HEAD');
  }
});

test('SCRUM-36 renderer: unavailable graphics returns safe controls and reports failure once without scheduling work', async t => {
  const { createForestScene } = await import('../public/wild/cinema.js');
  const frames = new Set(), failures = [], listeners = new Map();
  let ready = 0;
  const original = new Map();
  const replacements = {
    window: { devicePixelRatio: 1, innerWidth: 1440, matchMedia: () => ({ matches: false }) },
    document: { hidden: false },
    requestAnimationFrame(callback) { frames.add(callback); return callback; },
    cancelAnimationFrame(callback) { frames.delete(callback); },
  };
  for (const [name, value] of Object.entries(replacements)) {
    original.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }
  t.after(() => {
    for (const [name, descriptor] of original) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name];
    }
  });
  t.mock.method(console, 'error', () => {});
  t.mock.method(console, 'warn', () => {});
  const canvas = {
    width: 1440, height: 900, style: {}, getContext: () => null, setAttribute() {},
    getBoundingClientRect: () => ({ width: 1440, height: 900 }),
    addEventListener(type, callback) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(callback); },
    removeEventListener(type, callback) { listeners.get(type)?.delete(callback); },
  };
  const controller = createForestScene(canvas, { onReady() { ready++; }, onFailure(message) { failures.push(message); } });
  assert.equal(ready, 0); assert.equal(failures.length, 1); assert.equal(frames.size, 0);
  assert.doesNotThrow(() => {
    controller.travelTo('council'); controller.focusPerson('orin'); controller.focusPerson(null);
    controller.setOutcome('hold'); controller.setDawn(true); controller.setMorning('trail-checked');
    controller.setPaused(true); controller.setReducedMotion(true); controller.setPaused(false);
    controller.dispose(); controller.dispose();
  });
  assert.equal(ready, 0); assert.equal(failures.length, 1); assert.equal(frames.size, 0);
  assert.equal([...listeners.values()].reduce((sum, set) => sum + set.size, 0), 0, 'failed startup must not retain canvas listeners');
});
