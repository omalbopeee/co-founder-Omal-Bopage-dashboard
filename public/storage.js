import { DEFAULT_CARD, clone, applyEditingPolicy, validateCard } from './model.js';

const appPath = new URL('.', import.meta.url).pathname;
export function createCardStore({ storage, pathname = appPath, locks = globalThis.navigator?.locks, now = () => new Date().toISOString() } = {}) {
  const recordKey = 'tapx-omal-pages-saved-v1:' + pathname;
  const getStorage = () => storage ?? globalThis.localStorage;
  function read() {
    let record;
    try {
      const serialized = getStorage().getItem(recordKey);
      record = serialized ? JSON.parse(serialized) : { card: clone(DEFAULT_CARD), revision: 0, savedAt: null };
    } catch { throw new Error('Browser storage is unavailable or the saved details could not be read. Allow site storage and reload.'); }
    if (!record || !Number.isSafeInteger(record.revision) || record.revision < 0 || (record.savedAt !== null && (typeof record.savedAt !== 'string' || !Number.isFinite(Date.parse(record.savedAt))))) throw new Error('The saved browser record could not be read.');
    record.card = applyEditingPolicy(record.card);
    if (validateCard(record.card).length) throw new Error('The saved browser card could not be read.');
    return record;
  }
  async function save(card, revision) {
    const errors = validateCard(card);
    if (errors.length) throw Object.assign(new Error('Check the highlighted details before saving.'), { errors });
    const submitted = clone(card);
    const write = () => {
      const current = read();
      if (revision !== current.revision) throw new Error('This card changed in another tab. Reload this page, then restore your draft to review your edits.');
      const next = { card: submitted, revision: current.revision + 1, savedAt: now() };
      try { getStorage().setItem(recordKey, JSON.stringify(next)); }
      catch { throw new Error('Browser storage is full or unavailable. Allow site storage or choose a smaller photo, then try again.'); }
      return clone(next);
    };
    return locks?.request ? locks.request(recordKey, write) : write();
  }
  return { read, save };
}

export const cardStore = createCardStore();
