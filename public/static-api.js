// GitHub Pages adapter. Saves are private to this browser; nothing is uploaded.
import { DEFAULT_CARD, clone, applyEditingPolicy, validateCard } from './model.js';

const appBase = new URL('.', import.meta.url);
const recordKey = `tapx-omal-pages-saved-v1:${appBase.pathname}`;
const nativeFetch = window.fetch.bind(window);
const jsonResponse = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
function readRecord() {
  const serialized = localStorage.getItem(recordKey);
  const record = serialized ? JSON.parse(serialized) : { card: clone(DEFAULT_CARD), revision: 0, savedAt: null };
  record.card = applyEditingPolicy(record.card);
  if (validateCard(record.card).length) throw new Error('The saved browser data could not be read.');
  return { ...record, storage: 'browser' };
}
async function savePayload(payload) {
  const errors = validateCard(payload?.card);
  if (errors.length) return jsonResponse({ error: 'Check the highlighted details before saving.', errors }, 422);
  const write = () => {
    const current = readRecord();
    if (payload.revision !== current.revision) return jsonResponse({ error: 'This card changed in another tab. Reload this page, then restore your draft to review your edits.' }, 409);
    const next = { card: payload.card, revision: current.revision + 1, savedAt: new Date().toISOString(), storage: 'browser' };
    try { localStorage.setItem(recordKey, JSON.stringify(next)); }
    catch { return jsonResponse({ error: 'Browser storage is full or unavailable. Allow site storage or choose a smaller photo, then try again.' }, 507); }
    return jsonResponse(next);
  };
  return navigator.locks?.request ? navigator.locks.request(recordKey, write) : write();
}

window.fetch = async (input, options = {}) => {
  const url = new URL(input instanceof Request ? input.url : input, location.href);
  if (url.origin === location.origin && url.pathname === '/api/export') return jsonResponse({ error: 'This download is unavailable.' }, 404);
  if (url.origin !== location.origin || url.pathname !== '/api/card') return nativeFetch(input, options);
  try {
    const method = (options.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    if (url.pathname === '/api/card' && method === 'GET') return jsonResponse(readRecord());
    if (url.pathname === '/api/card' && method === 'PUT') {
      let payload;
      try { payload = input instanceof Request ? await input.json() : JSON.parse(options.body); }
      catch { return jsonResponse({ error: 'The card details could not be read.' }, 400); }
      return await savePayload(payload);
    }
    return jsonResponse({ error: 'This action is unavailable on the GitHub Pages editor.' }, 405);
  } catch { return jsonResponse({ error: 'Browser storage or card files are unavailable. Allow site storage and reload the page.' }, 500); }
};
