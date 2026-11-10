import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'public');
const output = path.resolve(root, 'pages-dist');
if (path.dirname(output) !== root || path.basename(output) !== 'pages-dist') throw new Error('Unexpected build output directory.');

async function files(directory) {
  const result = [];
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await files(filename));
    else if (entry.isFile()) result.push(filename);
    else throw new Error('Build source must contain regular files: ' + filename);
  }
  return result;
}
const entries = await files(source);
const hash = createHash('sha256');
for (const filename of entries) hash.update(path.relative(source, filename).split(path.sep).join('/')).update(await readFile(filename));
hash.update(await readFile(fileURLToPath(import.meta.url)));
const version = hash.digest('hex').slice(0, 12);

// Remove only the checked, generated output so old assets never reach a deployment.
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const filename of entries) {
  const relative = path.relative(source, filename);
  const destination = path.resolve(output, relative);
  if (!destination.startsWith(output + path.sep)) throw new Error('Unexpected output file.');
  const extension = path.extname(filename);
  let content = await readFile(filename);
  if (extension === '.html') content = content.toString('utf8').replaceAll(/(\b(?:href|src)=")((?:\.\/)[^"?]+\.(?:js|css))(\")/g, '$1$2?v=' + version + '$3');
  if (extension === '.js') content = content.toString('utf8').replaceAll(/(\bfrom\s+|\bimport\s*)(['"])(\.[^'"?]+\.js)\2/g, '$1$2$3?v=' + version + '$2');
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, content);
}
await writeFile(path.join(output, '.nojekyll'), '');
console.log('GitHub Pages build ready: ' + (entries.length + 1) + ' files in pages-dist/.');
