import test from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { createStaticServer } from '../server.mjs';

async function listen(t, options) {
  const server = createStaticServer(options);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  t.after(() => new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
  }));
  return server.address().port;
}

function read(port, path, method = 'GET') {
  // Preserve raw traversal paths rather than normalizing them through URL.
  return new Promise((resolve, reject) => {
    const req = request({ host: '127.0.0.1', port, path, method, agent: false }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('error', reject);
      response.on('end', () => resolve({
        status: response.statusCode,
        headers: response.headers,
        body: Buffer.concat(chunks),
      }));
    });
    req.on('error', reject);
    req.setTimeout(3000, () => req.destroy(new Error(`Timed out: ${method} ${path}`)));
    req.end();
  });
}

test('SCRUM-31: all three cover images serve their exact WebP bytes through GET and bodyless HEAD', async t => {
  const port = await listen(t);
  for (const file of ['the-room.webp', 'the-pressure.webp', 'the-aftermath.webp']) {
    const bytes = await readFile(new URL(`../public/cover/${file}`, import.meta.url));
    assert.equal(bytes.subarray(0, 4).toString(), 'RIFF', file);
    assert.equal(bytes.subarray(8, 12).toString(), 'WEBP', file);
    const get = await read(port, `/cover/${file}`);
    assert.equal(get.status, 200, file);
    assert.equal(get.headers['content-type'], 'image/webp', file);
    assert.deepEqual(get.body, bytes, file);
    assert.equal(Number(get.headers['content-length']), bytes.length, file);
    assert.equal(get.headers['x-content-type-options'], 'nosniff', file);
    const head = await read(port, `/cover/${file}`, 'HEAD');
    assert.equal(head.status, 200, file);
    assert.equal(head.body.length, 0, file);
    assert.equal(head.headers['content-type'], 'image/webp', file);
    assert.equal(Number(head.headers['content-length']), bytes.length, file);
    const query = await read(port, `/cover/${file}?case=001`);
    assert.equal(query.status, 200, file);
    assert.deepEqual(query.body, bytes, file);
  }
});

test('SCRUM-31: an existing unlisted cover file and repository asset remain inaccessible', async t => {
  const tempRoot = resolve(tmpdir());
  const directory = await mkdtemp(join(tempRoot, 'stakewolf-cover-'));
  t.after(async () => {
    assert.equal(dirname(resolve(directory)), tempRoot);
    assert.ok(basename(directory).startsWith('stakewolf-cover-'));
    await rm(directory, { recursive: true, force: true });
  });
  await mkdir(join(directory, 'cover'));
  await mkdir(join(directory, 'Assets'));
  const allowed = Buffer.from('allowed test fixture');
  const privateBytes = Buffer.from('unlisted test fixture must never be returned');
  await writeFile(join(directory, 'cover', 'the-room.webp'), allowed);
  await writeFile(join(directory, 'cover', 'unlisted.webp'), privateBytes);
  await writeFile(join(directory, 'Assets', 'original.jpg'), privateBytes);
  const port = await listen(t, { root: directory });
  assert.deepEqual((await read(port, '/cover/the-room.webp')).body, allowed);
  for (const path of ['/cover/unlisted.webp', '/Assets/original.jpg', '/cover/', '/cover/the-room.jpg', '/cover/THE-ROOM.webp']) {
    const response = await read(port, path);
    assert.equal(response.status, 404, path);
    assert.equal(response.body.toString(), 'Not found.\n', path);
  }
});

test('SCRUM-31: raw and encoded cover traversal cannot reach public or repository files', async t => {
  const port = await listen(t);
  for (const path of [
    '/cover/../index.html',
    '/cover/%2e%2e/index.html',
    '/cover/%2E%2E%2Findex.html',
    '/cover/%2e%2e/%2e%2e/Assets/original.jpg',
    '/cover/%5c..%5cindex.html',
    '/cover/%00the-room.webp',
    '/cover/%ZZ',
  ]) {
    const response = await read(port, path);
    assert.equal(response.status, 400, path);
    assert.equal(response.body.toString(), 'Invalid request path.\n', path);
  }
  const doubleEncoded = await read(port, '/cover/%252e%252e/index.html');
  assert.equal(doubleEncoded.status, 404);
  assert.equal(doubleEncoded.body.toString(), 'Not found.\n');
});
