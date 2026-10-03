import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadApplication } from '../public/bootstrap.js';

async function moduleFixture(t, source) {
  const root = resolve(tmpdir());
  const directory = await mkdtemp(join(root, 'stakewolf-startup-'));
  t.after(async () => {
    // Only remove the freshly allocated fixture directory beneath the temp root.
    assert.equal(dirname(resolve(directory)), root);
    assert.ok(basename(directory).startsWith('stakewolf-startup-'));
    await rm(directory, { recursive: true, force: true });
  });
  const entry = join(directory, 'entry.mjs');
  if (source !== undefined) await writeFile(entry, source, 'utf8');
  return pathToFileURL(entry).href;
}

test('successful startup waits for module evaluation and invokes its loader once', async t => {
  const url = await moduleFixture(t, 'export const initialized = true;');
  let release;
  const gate = new Promise(resolveGate => { release = resolveGate; });
  let calls = 0;
  let imported;
  let settled = false;
  const result = loadApplication(async () => {
    calls++;
    await gate;
    imported = await import(url);
    return imported;
  }).then(value => { settled = true; return value; });
  await Promise.resolve();
  assert.equal(calls, 1);
  assert.equal(settled, false, 'pending initialization must not be reported ready');
  release();
  assert.deepEqual(await result, { status: 'ready' });
  assert.equal(imported.initialized, true);
  assert.equal(calls, 1);
});

test('an absent application module produces a handled failed startup', async t => {
  const url = await moduleFixture(t);
  await assert.rejects(import(url), { code: 'ERR_MODULE_NOT_FOUND' });
  assert.deepEqual(await loadApplication(() => import(url)), { status: 'failed' });
});

test('a missing transitive dependency prevents application initialization', async t => {
  const url = await moduleFixture(t, "import './missing-dependency.mjs';\nexport const initialized = true;");
  await assert.rejects(import(url), { code: 'ERR_MODULE_NOT_FOUND' });
  assert.deepEqual(await loadApplication(() => import(url)), { status: 'failed' });
});

test('invalid module syntax is handled without exposing parser diagnostics', async t => {
  const url = await moduleFixture(t, 'export const broken = ;');
  await assert.rejects(import(url), SyntaxError);
  assert.deepEqual(await loadApplication(() => import(url)), { status: 'failed' });
});

test('an initializer that throws during real module evaluation reports failure', async t => {
  const url = await moduleFixture(t, "function initialize() { throw new Error('private diagnostic: fixture path'); }\ninitialize();");
  await assert.rejects(import(url), /private diagnostic: fixture path/);
  assert.deepEqual(await loadApplication(() => import(url)), { status: 'failed' });
});

test('asynchronous module initialization rejection is awaited and handled', async t => {
  const url = await moduleFixture(t, "await Promise.reject(new Error('async initializer failed'));\nexport const initialized = true;");
  await assert.rejects(import(url), /async initializer failed/);
  assert.deepEqual(await loadApplication(() => import(url)), { status: 'failed' });
});

test('a synchronous loader exception does not poison a subsequent independent startup', async t => {
  let failures = 0;
  assert.deepEqual(await loadApplication(() => {
    failures++;
    throw new Error('loader unavailable');
  }), { status: 'failed' });
  assert.equal(failures, 1);
  const url = await moduleFixture(t, 'export const initialized = true;');
  assert.deepEqual(await loadApplication(() => import(url)), { status: 'ready' });
});

test('the shipped document provides recovery before any application script executes', async () => {
  const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
  const main = html.match(/<main\b[^>]*\bid=["']main["'][^>]*>([\s\S]*?)<\/main>/i);
  assert.ok(main, 'the skip destination must exist in the original response');
  assert.match(main[0], /tabindex=["']-1["']/i);
  assert.equal((html.match(/\bid=["']main["']/g) || []).length, 1);
  const text = main[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  assert.match(text, /reload/i);
  assert.match(text, /new attempt|fresh attempt/i);
  assert.match(text, /not saved/i);
  assert.doesNotMatch(html, /\bid=["']start-game["']/i, 'Start belongs to initialized application state');
  const links = [...main[1].matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)];
  const reload = links.find(([, , label]) => /reload/i.test(label.replace(/<[^>]*>/g, ' ')));
  assert.ok(reload, 'recovery must work as a native link without JavaScript');
  const href = reload[1].match(/\bhref=["']([^"']+)["']/i)?.[1];
  assert.ok(href);
  const destination = new URL(href, 'http://127.0.0.1:4173/');
  assert.equal(destination.href, 'http://127.0.0.1:4173/');
  assert.doesNotMatch(reload[1], /\bon\w+\s*=/i, 'the native reload must not depend on an inline handler');
});

test('native no-script guidance is retained and startup uses an external module', async () => {
  const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
  const noscript = html.match(/<noscript\b[^>]*>([\s\S]*?)<\/noscript>/i)?.[1];
  assert.ok(noscript);
  assert.match(noscript, /JavaScript/i);
  assert.match(noscript, /enable|turn on/i);
  assert.match(noscript, /reload/i);
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length, 1);
  assert.match(scripts[0][1], /\btype=["']module["']/i);
  assert.match(scripts[0][1], /\bsrc=["']\.\/bootstrap\.js["']/i);
  assert.equal(scripts[0][2].trim(), '', 'no inline executable exception is needed');
});
