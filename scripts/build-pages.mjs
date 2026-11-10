import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const output = path.join(root, 'pages-dist');
const assetHash = createHash('sha256');
async function hashAssets(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) await hashAssets(full);
    else if (entry.isFile()) assetHash.update(path.relative(publicDir, full).split(path.sep).join('/')).update(await readFile(full));
  }
}
await hashAssets(publicDir);
assetHash.update(await readFile(fileURLToPath(import.meta.url)));
const buildVersion = assetHash.digest('hex').slice(0, 12);
let count = 0;
async function copyDirectory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const original = path.join(directory, entry.name);
    const relative = path.relative(publicDir, original);
    const destination = path.join(output, relative);
    if (entry.isDirectory()) { await mkdir(destination, { recursive: true }); await copyDirectory(original); continue; }
    if (!entry.isFile()) continue;
    const extension = path.extname(entry.name);
    let content = await readFile(original);
    if (['.html', '.css', '.js'].includes(extension)) {
      let source = content.toString('utf8');
      if (extension === '.html') {
        source = source.replaceAll('href="/card"', 'href="./card.html"').replaceAll(/\b(href|src)="\/(?!\/)/g, '$1="./');
        source = source.replace('</head>', '  <meta name="tapx-hosting" content="github-pages">\n</head>');
        source = source.replaceAll(/(\b(?:href|src)=")((?:\.\/)[^"?]+\.(?:js|css))(\")/g, `$1$2?v=${buildVersion}$3`);
      }
      if (extension === '.css') source = source.replaceAll(/url\((['"]?)\/assets\//g, 'url($1./assets/');
      if (extension === '.js') source = source.replaceAll("'/assets/", "'./assets/");
      if (['dashboard.js', 'card.js'].includes(entry.name)) source = `import './static-api.js';\n${source}`;
      if (extension === '.js') source = source.replaceAll(/(\bfrom\s+|\bimport\s*)(['"])(\.[^'"?]+\.js)\2/g, `$1$2$3?v=${buildVersion}$2`);
      content = source;
    }
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, content); count++;
  }
}
await mkdir(output, { recursive: true });
await copyDirectory(publicDir);
await writeFile(path.join(output, '.nojekyll'), '');
await writeFile(path.join(output, 'README.md'), '# TapX Card Studio\n\nGitHub Pages deployment files. Changes are saved only in each visitor’s browser.\n');
console.log(`GitHub Pages build ready: ${count + 2} files in pages-dist/.`);
