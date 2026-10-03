import test from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createStaticServer } from '../server.mjs';

async function listen(t) {
  const server = createStaticServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  t.after(() => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
  return server.address().port;
}

function read(port, path, method = 'GET') {
  // Send raw paths through http.request so traversal cases are not normalized
  // away by a URL constructor before they reach the server.
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

test('the local server serves all six game assets with browser-usable content types', async t => {
  const port = await listen(t);
  const files = [
    ['index.html', 'text/html'],
    ['bootstrap.js', 'text/javascript'],
    ['app.js', 'text/javascript'],
    ['engine.js', 'text/javascript'],
    ['scenario.js', 'text/javascript'],
    ['style.css', 'text/css'],
  ];
  for (const [file, type] of files) {
    const response = await read(port, `/${file}`);
    assert.equal(response.status, 200, file);
    assert.ok(response.headers['content-type'].startsWith(type), file);
    assert.deepEqual(response.body, await readFile(new URL(`../public/${file}`, import.meta.url)));
    assert.equal(response.headers['cache-control'], 'no-store');
    assert.equal(response.headers['x-content-type-options'], 'nosniff');
  }
  const index = await read(port, '/');
  assert.equal(index.status, 200);
  assert.deepEqual(index.body, await readFile(new URL('../public/index.html', import.meta.url)));
});

test('startup assets retain a same-origin script policy without network or inline-script exceptions', async t => {
  const port = await listen(t);
  for (const path of ['/', '/bootstrap.js', '/app.js']) {
    const response = await read(port, path);
    assert.equal(response.status, 200, path);
    const policy = Object.fromEntries(response.headers['content-security-policy'].split(';')
      .map(part => part.trim().split(/\s+/)).filter(([name]) => name)
      .map(([name, ...sources]) => [name, sources]));
    assert.deepEqual(policy['default-src'], ["'self'"]);
    assert.deepEqual(policy['script-src'], ["'self'"]);
    assert.deepEqual(policy['connect-src'], ["'none'"]);
    assert.deepEqual(policy['object-src'], ["'none'"]);
    assert.deepEqual(policy['base-uri'], ["'none'"]);
    assert.deepEqual(policy['frame-ancestors'], ["'none'"]);
    assert.deepEqual(policy['form-action'], ["'none'"]);
  }
  assert.equal((await read(port, '/unlisted-startup-helper.js')).status, 404);
});

test('HEAD is bodyless and query strings do not break module delivery', async t => {
  const port = await listen(t);
  const get = await read(port, '/engine.js');
  const head = await read(port, '/engine.js', 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(head.body.length, 0);
  assert.equal(Number(head.headers['content-length']), get.body.length);
  assert.equal(head.headers['content-type'], get.headers['content-type']);
  const query = await read(port, '/engine.js?build=baseline');
  assert.equal(query.status, 200);
  assert.deepEqual(query.body, get.body);
});

test('repository files and unrecognized routes are not served', async t => {
  const port = await listen(t);
  for (const path of ['/README.md', '/AGENTS.md', '/.git/config', '/docs/product-brief.md', '/package.json', '/missing.js']) {
    const response = await read(port, path);
    assert.equal(response.status, 404, path);
    assert.equal(response.body.toString(), 'Not found.\n');
  }
  const post = await read(port, '/', 'POST');
  assert.equal(post.status, 405);
  assert.equal(post.headers.allow, 'GET, HEAD');
});

test('malformed and traversal paths are rejected before filesystem lookup', async t => {
  const port = await listen(t);
  for (const path of ['/../README.md', '/%2e%2e/README.md', '/%2e%2e%2fREADME.md', '/.%2findex.html', '/%5c..%5cREADME.md', '/%00index.html', '/%ZZ']) {
    const response = await read(port, path);
    assert.equal(response.status, 400, path);
    assert.equal(response.body.toString(), 'Invalid request path.\n');
  }
});
