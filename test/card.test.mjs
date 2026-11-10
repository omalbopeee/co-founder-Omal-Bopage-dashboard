import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createApp } from '../server.mjs';
import { DEFAULT_CARD, clone, validateCard, applyEditingPolicy, makeVCard, contactURL } from '../public/model.js';

async function withServer(run) {
  const prefix = path.join(os.tmpdir(), 'tapx-omal-test-');
  const dir = await mkdtemp(prefix);
  const server = await createApp({ dataDir: dir });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try { await run({ base, dir }); }
  finally {
    await new Promise(resolve => server.close(resolve));
    assert.ok(path.resolve(dir).startsWith(path.resolve(prefix)), 'Cleanup stays in the test temporary directory');
    await rm(dir, { recursive: true, force: true });
  }
}
const put = (base, card, revision = 0, headers = {}) => fetch(`${base}/api/card`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ card, revision }) });

test('Omal defaults validate and malformed records, unsafe links and SVG uploads are rejected', () => {
  assert.deepEqual(validateCard(clone(DEFAULT_CARD)), []);
  for (const value of [null, [], {}, { profile: {} }]) assert.ok(validateCard(value).length);
  const card = clone(DEFAULT_CARD);
  card.company.products[0] = null;
  card.socials[0].url = 'javascript:alert(1)';
  card.profile.photo = 'data:image/svg+xml;base64,AAAA';
  card.company.phone = 'not a number';
  const paths = validateCard(card).map(issue => issue.path);
  for (const expected of ['company.products.0', 'socials.0.url', 'profile.photo', 'company.phone']) assert.ok(paths.includes(expected), expected);
  card.socials[1].url = '';
  assert.ok(!validateCard(card, { allowIncomplete: true }).some(issue => issue.path === 'socials.1.url'));
});

test('personal and business contacts use their own edited details and escape vCard text', () => {
  const card = clone(DEFAULT_CARD);
  card.profile.contactName = 'නිමල්; Perera'; card.contacts[0].value = '+94 77 123 4567';
  card.company.name = 'Example, Lanka'; card.company.phone = '+94771112222';
  const personal = makeVCard(card), company = makeVCard(card, true);
  assert.equal(contactURL(card.contacts[0]), 'tel:+94771234567');
  assert.match(personal, /FN:නිමල්\\; Perera/);
  assert.match(personal, /TEL;TYPE=CELL:\+94 77 123 4567/);
  assert.match(personal, /X-SOCIALPROFILE;TYPE=WhatsApp:https:\/\/wa.me\/94762199292/);
  assert.doesNotMatch(personal, /94771112222/);
  assert.match(company, /FN:Example\\, Lanka/);
  assert.match(company, /TEL;TYPE=WORK,VOICE:\+94771112222/);
  assert.doesNotMatch(company, /omalbopage@gmail.com/);
});

test('Unicode edits and product uploads persist, retain a backup and survive server restart', async () => withServer(async ({ base, dir }) => {
  const initial = await (await fetch(`${base}/api/card`)).json();
  const card = clone(initial.card);
  card.profile.firstName = 'ඕමාල්'; card.company.summary = 'අලුත් සම්බන්ධතා';
  card.company.products.reverse();
  card.company.products[0].name = 'New product';
  card.company.products[0].photo = 'data:image/png;base64,iVBORw0KGgo=';
  card.contacts[0].label = 'Call Omal'; card.design.accent = '#aabbcc';
  const response = await put(base, card); assert.equal(response.status, 200);
  const saved = await response.json(); assert.equal(saved.revision, 1);
  assert.deepEqual((await (await fetch(`${base}/api/card`)).json()).card, card);
  assert.deepEqual(JSON.parse(await readFile(path.join(dir, 'card.json'), 'utf8')).card, card);
  assert.deepEqual(JSON.parse(await readFile(path.join(dir, 'card.previous.json'), 'utf8')).card, initial.card);
  const restarted = await createApp({ dataDir: dir });
  await new Promise(resolve => restarted.listen(0, '127.0.0.1', resolve));
  try { assert.deepEqual((await (await fetch(`http://127.0.0.1:${restarted.address().port}/api/card`)).json()).card, card); }
  finally { await new Promise(resolve => restarted.close(resolve)); }
}));

test('stale, invalid and cross-origin saves do not overwrite the saved card', async () => withServer(async ({ base }) => {
  const card = clone(DEFAULT_CARD); card.profile.role = 'Founder';
  assert.equal((await put(base, card)).status, 200);
  assert.equal((await put(base, DEFAULT_CARD, 0)).status, 409);
  const invalid = clone(card); invalid.company.website = 'javascript:alert(1)';
  assert.equal((await put(base, invalid, 1)).status, 422);
  assert.equal((await put(base, card, 1, { Origin: 'https://example.com' })).status, 403);
  assert.equal((await fetch(`${base}/api/card`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{bad' })).status, 400);
  assert.deepEqual((await (await fetch(`${base}/api/card`)).json()).card, card);
}));

test('the managed URL, footer and fixed contacts are enforced', () => {
  const card = clone(DEFAULT_CARD);
  card.profile.cardUrl = 'https://example.com/'; card.wording.brandName = 'Other'; card.design.showFooter = false;
  card.contacts[0].visible = false;
  assert.ok(validateCard(card).length >= 4);
  const normalized = applyEditingPolicy(card);
  assert.deepEqual(validateCard(normalized), []);
  assert.equal(normalized.profile.cardUrl, DEFAULT_CARD.profile.cardUrl);
});

test('public editor assets are served and private runtime files stay outside public routes', async () => withServer(async ({ base }) => {
  for (const route of ['/', '/card', '/card.js', '/model.js', '/assets/omal-profile.webp', '/assets/manrope-400.woff2', '/assets/card.css']) assert.equal((await fetch(base + route)).status, 200, route);
  for (const route of ['/data/card.json', '/server.mjs', '/api/export', '/%2e%2e%5cserver.mjs']) assert.ok([403, 404].includes((await fetch(base + route)).status), route);
}));
