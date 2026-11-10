import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.webp': 'image/webp', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8' };
export function createPreviewServer({ built = false } = {}) {
  const directory = path.resolve(root, built ? 'pages-dist' : 'public');
  return http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-cache');
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const filename = path.resolve(directory, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!filename.startsWith(directory + path.sep)) { res.writeHead(403).end(); return; }
      const content = await readFile(filename);
      res.writeHead(200, { 'Content-Type': mime[path.extname(filename)] || 'application/octet-stream' });
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch (error) { res.writeHead(error instanceof URIError ? 400 : 404).end(); }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT || 4174);
  const server = createPreviewServer({ built: process.argv.includes('--built') });
  server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? 'Port ' + port + ' is in use. Open the existing preview or set PORT to another number.' : error.message); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => {
    const url = 'http://127.0.0.1:' + port;
    console.log('\nTapX Card Studio preview: ' + url + '\nEdits are saved only in this browser. Keep this window open.\n');
    if (process.argv.includes('--open') && process.platform === 'win32') {
      const browser = spawn('explorer.exe', [url], { detached: true, stdio: 'ignore', windowsHide: true });
      browser.on('error', () => console.log('Open ' + url + ' in your browser.')); browser.unref();
    }
  });
}
