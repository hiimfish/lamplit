// Checks a finished build before it is deployed (.github/workflows/pages.yml), so a phone can
// always notice the new version (src/core/update.ts) and never gets an old page from a cache:
//   - dist/version.json names this build (the commit on Actions),
//   - the bundle carries the same id (else every page would think it is out of date, or never),
//   - dist/sw.js is there (the page and version.json skip every cache),
//   - index.html turns zoom off.
// Usage: node scripts/check-dist.mjs [dist]   (exits 1 and lists the problems if any)
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dist = process.argv[2] ?? 'dist';
const problems = [];

let id = null;
try {
  id = JSON.parse(readFileSync(join(dist, 'version.json'), 'utf8')).id;
  if (typeof id !== 'string' || !id) problems.push('version.json has no id');
} catch (err) {
  problems.push(`version.json missing or unreadable: ${err.message}`);
}

const sha = process.env.GITHUB_SHA;
if (id && sha && id !== sha.slice(0, 12)) {
  problems.push(`version.json id ${id} is not this commit ${sha.slice(0, 12)}`);
}

if (id) {
  const assets = join(dist, 'assets');
  const scripts = existsSync(assets) ? readdirSync(assets).filter((f) => f.endsWith('.js')) : [];
  // The minifier may quote it with ", ' or `.
  const quoted = new RegExp(`["'\`]${id.replace(/[^\w-]/g, '\\$&')}["'\`]`);
  const carries = scripts.some((f) => quoted.test(readFileSync(join(assets, f), 'utf8')));
  if (!carries) problems.push(`no script in ${assets} carries the build id ${id}`);
}

if (!existsSync(join(dist, 'sw.js'))) problems.push('sw.js is missing');

const html = existsSync(join(dist, 'index.html'))
  ? readFileSync(join(dist, 'index.html'), 'utf8')
  : '';
if (!html) problems.push('index.html is missing');
else if (!/user-scalable=no/.test(html) || !/maximum-scale=1/.test(html)) {
  problems.push('index.html viewport lets the page zoom');
}

if (problems.length) {
  console.error(`dist check failed:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log(`dist check ok: build ${id}`);
