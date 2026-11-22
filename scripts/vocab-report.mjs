// Vocabulary and difficulty report for every task, in play order (docs/specs/curriculum.md).
//
//   node scripts/vocab-report.mjs [--starter=100] [--json]
//
// For each task: new items, new words with their band (N = NGSL rank, T = TSL rank,
// S = supplementary list, 外 = off-list), story size, the share of story words the player
// already knows, words in the story that were never taught, and the difficulty score.
// Rule breaks against the smoothness rules are listed at the end. Report only: exits 0.
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { UNIT_ORDER } from '../src/content/unitOrder.ts';
import { equivalentRank, parseWordLists, profileUnits } from '../src/content/vocab.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LISTS = join(ROOT, 'src', 'data', 'wordlists');
const UNITS = join(ROOT, 'src', 'data', 'units');

/** Smoothness rules (curriculum.md, 平滑規則). Act 1 values. */
/** Texts this long are judged by coverage; shorter stories by a count of untaught words. */
const LONG_TEXT = 50;
const MIN_COVERAGE = 0.98;
const MAX_UNPLANNED = 1;
/** An untaught word in a short story must be at least this frequent (NGSL rank scale). */
const MAX_UNPLANNED_RANK = 1000;
const MAX_STEP = 3;
const MAX_NEW_PLACE_DROP = 5;
const MAX_ITEM_GROWTH = 1;

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
const breaks = [];
console.log(`起始已知字：NGSL 前 ${starterRank} 名\n`);
profiles.forEach((p, i) => {
  const prev = profiles[i - 1];
  const delta = prev ? p.score - prev.score : 0;
  const newPlace = prev && prev.unitId !== p.unitId;
  const where = `${p.unitId}/${p.taskId}`;
  console.log(
    `${where.padEnd(12)} 分數 ${String(p.score).padStart(3)} (${delta >= 0 ? '+' : ''}${delta})` +
      `  新項目 ${p.newItems}  劇情 ${p.lines} 句、平均 ${p.avgLineWords.toFixed(1)} 字` +
      `  學過的字 ${pct(p.coverage)}`,
  );
  console.log(`  新字：${p.newLemmas.map((l) => `${l.lemma}(${l.band})`).join(' ') || '—'}`);
  if (p.unplanned.length) console.log(`  沒教過：${p.unplanned.join(' ')}`);

  if (p.tokens >= LONG_TEXT) {
    if (p.coverage < MIN_COVERAGE) {
      breaks.push(`${where}：學過的字 ${pct(p.coverage)}，低於 ${pct(MIN_COVERAGE)}`);
    }
  } else {
    if (p.unplanned.length > MAX_UNPLANNED) {
      breaks.push(
        `${where}：劇情有 ${p.unplanned.length} 個沒教過的字，最多 ${MAX_UNPLANNED} 個（${p.unplanned.join('、')}）`,
      );
    }
    const rare = p.unplanned.filter((w) => equivalentRank(lists, w) > MAX_UNPLANNED_RANK);
    if (rare.length) {
      breaks.push(`${where}：沒教過的字不在 NGSL 前 ${MAX_UNPLANNED_RANK} 名：${rare.join('、')}`);
    }
  }
  if (prev && !newPlace && Math.abs(delta) > MAX_STEP) {
    breaks.push(`${where}：分數和上一個任務差 ${delta}，超過 ±${MAX_STEP}`);
  }
  if (newPlace && (delta > MAX_STEP || delta < -MAX_NEW_PLACE_DROP)) {
    breaks.push(
      `${where}：換地點時分數變化 ${delta}（可以 -${MAX_NEW_PLACE_DROP} 到 +${MAX_STEP}）`,
    );
  }
  if (prev && p.newItems - prev.newItems > MAX_ITEM_GROWTH) {
    breaks.push(
      `${where}：新項目從 ${prev.newItems} 增加到 ${p.newItems}，一次最多多 ${MAX_ITEM_GROWTH} 個`,
    );
  }
});

console.log(`\n不符合平滑規則（${breaks.length}）：`);
for (const b of breaks) console.log(`- ${b}`);
