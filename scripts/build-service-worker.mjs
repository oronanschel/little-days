import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(file) : [file];
  }));
  return nested.flat();
}

const files = (await filesIn(root)).filter((file) => path.basename(file) !== 'sw.js').sort();
const hash = createHash('sha256');
const template = await readFile(new URL('./service-worker.js', import.meta.url), 'utf8');
hash.update(template).update('\0');
const urls = [];
for (const file of files) {
  const url = path.relative(root, file).split(path.sep).map(encodeURIComponent).join('/');
  urls.push(url);
  hash.update(url).update('\0').update(await readFile(file)).update('\0');
}
const worker = template
  .replace('__BUILD_VERSION__', JSON.stringify(hash.digest('hex')))
  .replace('__PRECACHE_URLS__', JSON.stringify(urls));
await writeFile(path.join(root, 'sw.js'), worker);
console.log(`Offline cache includes ${urls.length} production files.`);
