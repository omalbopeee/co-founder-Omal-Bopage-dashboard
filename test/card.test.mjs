import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { DEFAULT_CARD, clone, validateCard, makeVCard } from '../public/model.js';
import { createCardStore } from '../public/storage.js';
import { createPreviewServer } from '../scripts/preview.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const run = promisify(execFile);
const memoryStorage = () => {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
};

test('card validation rejects unsafe social URLs and unsupported images', () => {
  assert.deepEqual(validateCard(clone(DEFAULT_CARD)), []);
  const card = clone(DEFAULT_CARD); card.socials[0].url = 'javascript:alert(1)'; card.company.products[0].photo = 'data:image/svg+xml;base64,AAAA';
  const paths = validateCard(card).map(issue => issue.path);
  assert.ok(paths.includes('socials.0.url')); assert.ok(paths.includes('company.products.0.photo'));
});

test('personal and company vCards retain separate edited details', () => {
  const card = clone(DEFAULT_CARD); card.profile.contactName = 'නිමල්; Perera'; card.contacts[0].value = '+94771234567'; card.company.phone = '+94771112222';
  assert.ok(makeVCard(card).includes('FN:නිමල්\\; Perera'));
  assert.ok(makeVCard(card).includes('TEL;TYPE=CELL:+94771234567'));
  assert.ok(!makeVCard(card).includes('+94771112222'));
  assert.ok(makeVCard(card, true).includes('TEL;TYPE=WORK,VOICE:+94771112222'));
  assert.ok(!makeVCard(card, true).includes('omalbopage@gmail.com'));
});

test('browser storage persists Unicode and photos, isolates project paths and rejects stale or invalid saves', async () => {
  const storage = memoryStorage();
  const first = createCardStore({ storage, pathname: '/first/' });
  const otherTab = createCardStore({ storage, pathname: '/first/' });
  const otherProject = createCardStore({ storage, pathname: '/other/' });
  const card = clone(DEFAULT_CARD); card.profile.firstName = 'ඕමාල්'; card.profile.photo = 'data:image/png;base64,iVBORw0KGgo=';
  card.company.products.reverse();
  const saved = await first.save(card, 0);
  assert.equal(saved.revision, 1); assert.deepEqual(otherTab.read().card, card);
  assert.deepEqual(otherProject.read().card, DEFAULT_CARD);
  await assert.rejects(otherTab.save(DEFAULT_CARD, 0), /another tab/);
  const invalid = clone(card); invalid.company.website = 'javascript:alert(1)';
  await assert.rejects(first.save(invalid, 1), error => error.errors.some(issue => issue.path === 'company.website'));
  assert.deepEqual(first.read().card, card);
});

test('a full or disabled browser store preserves the last saved record', async () => {
  const storage = memoryStorage();
  const store = createCardStore({ storage }); await store.save(DEFAULT_CARD, 0);
  storage.setItem = () => { throw new Error('QuotaExceededError'); };
  const edited = clone(DEFAULT_CARD); edited.profile.role = 'New role';
  await assert.rejects(store.save(edited, 1), /full or unavailable/);
  assert.deepEqual(store.read().card, DEFAULT_CARD);
  const blocked = createCardStore({ storage: { getItem() { throw new Error('SecurityError'); } } });
  assert.throws(() => blocked.read(), /storage is unavailable/);
});

test('Web Locks serialize competing saves so only one tab can save the same revision', async () => {
  let queue = Promise.resolve();
  const locks = { request(key, callback) { const next = queue.then(callback); queue = next.catch(() => {}); return next; } };
  const storage = memoryStorage();
  const a = createCardStore({ storage, locks }), b = createCardStore({ storage, locks });
  const results = await Promise.allSettled([a.save(DEFAULT_CARD, 0), b.save(DEFAULT_CARD, 0)]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(results.filter(result => result.status === 'rejected').length, 1);
  assert.equal(a.read().revision, 1);
});

test('build removes stale artifacts and includes only standalone relative static files', async () => {
  await run(process.execPath, ['scripts/build-pages.mjs'], { cwd: root });
  const output = path.join(root, 'pages-dist');
  await writeFile(path.join(output, 'stale.txt'), 'stale');
  await run(process.execPath, ['scripts/build-pages.mjs'], { cwd: root });
  assert.ok(!(await readdir(output)).includes('stale.txt'));
  assert.ok(!(await readdir(output)).includes('server.mjs'));
  const html = await readFile(path.join(output, 'index.html'), 'utf8');
  assert.ok(html.includes('href="./card.html"')); assert.match(html, /dashboard.js\?v=[a-f0-9]{12}/);
  for (const file of ['dashboard.js', 'card.js']) {
    const source = await readFile(path.join(output, file), 'utf8');
    assert.match(source, /storage.js\?v=[a-f0-9]{12}/); assert.ok(!source.includes('/api/'));
  }
  assert.ok(!(await readdir(path.join(output, 'assets'))).some(file => file.endsWith('.vcf') || file === 'omal-bopage-share.jpg'));
});

test('preview serves the static app and has no disk-save API or project-file access', async () => {
  const server = createPreviewServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  try {
    for (const route of ['/', '/card.html', '/storage.js', '/assets/omal-profile.webp']) assert.equal((await fetch(base + route)).status, 200, route);
    for (const route of ['/api/card', '/data/card.json', '/package.json', '/%2e%2e%5cpackage.json']) assert.ok([403, 404].includes((await fetch(base + route)).status), route);
    assert.equal((await fetch(base + '/', { method: 'PUT' })).status, 405);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
