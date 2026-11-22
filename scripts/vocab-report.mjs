// Vocabulary and difficulty report for every task, in play order (docs/specs/curriculum.md).
//
//   node scripts/vocab-report.mjs [--starter=100] [--json]
//
// For each task: new items, new words with their band (N = NGSL rank, T = TSL rank,
// S = supplementary list, 外 = off-list), story size, the share of story words the player
// already knows, words in the story that were never taught, and the difficulty score.
// Rule breaks against the smoothness rules are listed at the end (tests/smoothness.test.ts
// enforces the same rules). Report only: exits 0.
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { UNIT_ORDER } from '../src/content/unitOrder.ts';
import {
  parseWordLists,
  previousTeaching,
  profileUnits,
  smoothnessBreaks,
} from '../src/content/vocab.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LISTS = join(ROOT, 'src', 'data', 'wordlists');
const UNITS = join(ROOT, 'src', 'data', 'units');

const args = process.argv.slice(2);
const starterRank = Number(args.find((a) => a.startsWith('--starter='))?.split('=')[1] ?? 100);

const read = (f, enc = 'utf8') => readFileSync(join(LISTS, f), enc);
const lists = parseWordLists({
  ngslStats: read('NGSL_12_stats.csv'),
  ngslForms: read('NGSL_12_lemmatized_for_research.csv'),
  supForms: read('SUP_lemmatized.csv'),
  tslStats: read('TSL_12_stats.csv', 'latin1'),
  tslForms: read('TSL_12_lemmatized_for_research.csv', 'latin1'),
});

const order = (id) => {
  const i = UNIT_ORDER.indexOf(id);
  return i < 0 ? 99 : i;
};
const units = readdirSync(UNITS)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(UNITS, f), 'utf8')))
  .sort((a, b) => order(a.id) - order(b.id));

const profiles = profileUnits(units, lists, { starterRank });

if (args.includes('--json')) {
  console.log(JSON.stringify(profiles, null, 2));
  process.exit(0);
}

const pct = (n) => `${(n * 100).toFixed(0)}%`;
console.log(`起始已知字：NGSL 前 ${starterRank} 名\n`);
profiles.forEach((p, i) => {
  const prev = previousTeaching(profiles, i);
  const delta = prev ? p.score - prev.score : 0;
  const where = `${p.unitId}/${p.taskId}`;
  const scoreText = p.review
    ? '只複習，不算分數'
    : `分數 ${String(p.score).padStart(3)} (${delta >= 0 ? '+' : ''}${delta})`;
  console.log(
    `${where.padEnd(12)} ${scoreText}` +
      `  新項目 ${p.newItems}  詞塊平均 ${p.chunkWords.toFixed(1)} 字  字的程度 ${Math.round(p.freqLevel)}` +
      `  劇情 ${p.lines} 句、平均 ${p.avgLineWords.toFixed(1)} 字` +
      `  學過的字 ${pct(p.coverage)}`,
  );
  console.log(`  新字：${p.newLemmas.map((l) => `${l.lemma}(${l.band})`).join(' ') || '—'}`);
  if (p.unplanned.length) console.log(`  沒教過：${p.unplanned.join(' ')}`);
});

const breaks = smoothnessBreaks(profiles, lists);
console.log(`\n不符合平滑規則（${breaks.length}）：`);
for (const b of breaks) console.log(`- ${b}`);
