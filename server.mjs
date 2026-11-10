import http from 'node:http';
import { readFile, writeFile, rename, mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { DEFAULT_CARD, clone, validateCard, applyEditingPolicy } from './public/model.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, 'public');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const json = (res, code, value) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); };

export async function createApp({ dataDir = path.join(ROOT, 'data') } = {}) {
  await mkdir(dataDir, { recursive: true });
  const dataFile = path.join(dataDir, 'card.json');
  try { await readFile(dataFile); } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    await writeFile(dataFile, JSON.stringify({ card: clone(DEFAULT_CARD), savedAt: null, revision: 0 }, null, 2), { flag: 'wx' });
  }
  const readSaved = async () => {
    const record = JSON.parse(await readFile(dataFile, 'utf8'));
    record.card = applyEditingPolicy(record.card);
    record.storage = 'local';
    if (validateCard(record.card).length) throw new Error('Saved card data is invalid. Restore data/card.previous.json from your folder backup.');
    return record;
  };
  let saveQueue = Promise.resolve();
  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    const host = req.headers.host || '';
    if (!/^(?:127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/.test(host)) return json(res, 403, { error: 'This dashboard is available on this computer only.' });
    let url;
    try { url = new URL(req.url, `http://${host}`); } catch { return json(res, 400, { error: 'Invalid URL.' }); }
    try {
      if (url.pathname === '/api/card' && req.method === 'GET') return json(res, 200, await readSaved());
      if (url.pathname === '/api/card' && req.method === 'PUT') {
        if (req.headers.origin && req.headers.origin !== `http://${host}`) return json(res, 403, { error: 'Save from the dashboard on this computer.' });
        if (!req.headers['content-type']?.startsWith('application/json')) return json(res, 415, { error: 'Send a JSON card.' });
        const chunks = []; let bytes = 0;
        for await (const chunk of req) {
          bytes += chunk.length;
          if (bytes > 7_000_000) { json(res, 413, { error: 'This card is too large. Choose a smaller photo.' }); req.resume(); return; }
          chunks.push(chunk);
        }
        let payload;
        try { payload = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return json(res, 400, { error: 'The card could not be read. Try again.' }); }
        const errors = validateCard(payload?.card);
        if (errors.length) return json(res, 422, { error: 'Check the highlighted details before saving.', errors });
        const operation = saveQueue.then(async () => {
          const current = await readSaved();
          if (payload.revision !== current.revision) return json(res, 409, { error: 'This card was saved in another tab. Reload this page, then restore your draft to review your edits.' });
          const record = { card: payload.card, savedAt: new Date().toISOString(), revision: current.revision + 1 };
          const temporary = `${dataFile}.tmp`;
          await copyFile(dataFile, path.join(dataDir, 'card.previous.json'));
          await writeFile(temporary, JSON.stringify(record, null, 2), 'utf8');
          await rename(temporary, dataFile);
          json(res, 200, record);
        });
        saveQueue = operation.catch(() => {});
        await operation;
        return;
      }
      if (url.pathname.startsWith('/api/')) return json(res, 404, { error: 'API endpoint not found.' });
      if (!['GET', 'HEAD'].includes(req.method)) return json(res, 405, { error: 'Method not allowed.' });
      const route = url.pathname === '/' ? '/index.html' : url.pathname === '/card' ? '/card.html' : url.pathname;
      const filename = path.resolve(PUBLIC, `.${decodeURIComponent(route)}`);
      if (!filename.startsWith(`${PUBLIC}${path.sep}`)) return json(res, 403, { error: 'Access denied.' });
      const file = await readFile(filename);
      res.writeHead(200, { 'Content-Type': MIME[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(req.method === 'HEAD' ? undefined : file);
    } catch (error) {
      if (res.writableEnded) return;
      if (error.code === 'ENOENT' || error.code === 'EISDIR') return json(res, 404, { error: 'Page not found.' });
      console.error(error.message);
      json(res, 500, { error: 'Could not read or save the card. Check that the data folder is writable and try again.' });
    }
  });
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT || 4174);
  const server = await createApp();
  server.on('error', error => {
    console.error(error.code === 'EADDRINUSE' ? `Port ${port} is already in use. If the dashboard is already running, open http://127.0.0.1:${port}. Otherwise set PORT to another number.` : error.message);
    process.exitCode = 1;
  });
  server.listen(port, '127.0.0.1', () => {
    const url = `http://127.0.0.1:${port}`;
    console.log(`\n  TapX Card Studio\n  Dashboard: ${url}\n  Saved card: ${url}/card\n\n  Keep this window open. Press Ctrl+C to stop.\n`);
    if (process.argv.includes('--open') && process.platform === 'win32') {
      const browser = spawn('explorer.exe', [url], { detached: true, stdio: 'ignore', windowsHide: true });
      browser.on('error', () => console.log(`Open ${url} in your browser.`));
      browser.unref();
    }
  });
}
