/**
 * The sentence generator against the real data (src/data/lexicon, patterns, sentences).
 * Until an Act has patterns its block is skipped.
 *
 *   SENTENCE_SAMPLE=print npx vitest run tests/sentencePool.test.ts
 *     prints 20 sentences (and a fill of each blank) per pattern, for a human to read.
 *   SENTENCE_POOL=write npx vitest run tests/sentencePool.test.ts
 *     writes the draft src/data/sentences/act<N>.json (60 statements, 15 Q/A) with a fixed seed.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ACTS } from '../src/content/acts';
import { GRAMMAR_POINTS } from '../src/content/grammar';
import type { BlankKind, Lexicon, Pattern } from '../src/content/lexicon';
import { LEXICONS, PATTERNS } from '../src/content/lexicons';
import { makeRng } from '../src/learning/gen/common';
import {
  buildPool,
  buildQa,
  buildSentence,
  sentenceFill,
  type Sentence,
} from '../src/learning/sentenceGen';

const PRINT = process.env.SENTENCE_SAMPLE === 'print';
const WRITE = process.env.SENTENCE_POOL === 'write';
/** Distinct sentences every pattern must be able to make. */
const MIN_DISTINCT = 10;
const TRIES = 300;
const POOL_SEED = 1;

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** The lexicon and taught words from the first location up to the end of the Act. */
function dataOf(act: number): { lexicon: Lexicon; taught: Set<string> } {
  const unitIds = ACTS.slice(0, act).flatMap((a) =>
    a.places.flatMap((p) => (p.unitId ? [p.unitId] : [])),
  );
  const lexicon: Lexicon = {};
  for (const id of unitIds) Object.assign(lexicon, LEXICONS[id] ?? {});
  const taught = new Set(Object.keys(lexicon).filter((w) => !lexicon[w]?.skip));
  return { lexicon, taught };
}

function sentencesOf(pattern: Pattern, act: number, tries = TRIES): Sentence[] {
  const { lexicon, taught } = dataOf(act);
  const out: Sentence[] = [];
  for (let seed = 1; seed <= tries; seed++) {
    const s = buildSentence(pattern, lexicon, taught, makeRng(seed));
    if (s) out.push(s);
  }
  return out;
}

const QA_SHAPES = ['svo', 'svo-prep', 'svo-time', 'wh-question'];

for (const act of [1, 2, 3, 4]) {
  const patterns = PATTERNS[act] ?? [];
  describe.skipIf(patterns.length === 0)(`Act ${act} sentence patterns`, () => {
    const { lexicon, taught } = dataOf(act);
    const grammarIds = new Set(GRAMMAR_POINTS.map((g) => g.id));

    it('has unique pattern ids and known grammar points', () => {
      expect(new Set(patterns.map((p) => p.id)).size).toBe(patterns.length);
      if (grammarIds.size > 0) {
        for (const p of patterns) expect(grammarIds, p.id).toContain(p.grammarId);
      }
    });

    for (const pattern of patterns) {
      it(`${pattern.id}: makes at least ${MIN_DISTINCT} different sentences`, () => {
        const list = sentencesOf(pattern, act);
        const distinct = new Set(list.map((s) => s.en));
        expect(distinct.size).toBeGreaterThanOrEqual(MIN_DISTINCT);
        for (const s of list) {
          expect(s.en).toMatch(/^[A-Z"].*[.?]$/);
          expect(s.en).not.toMatch(/ {2}|\s[.?,]|\bundefined\b/);
        }
      });

      for (const blank of pattern.blanks) {
        it(`${pattern.id}: blank ${blank} makes clean questions`, () => {
          let made = 0;
          for (const s of sentencesOf(pattern, act, 120)) {
            const q = sentenceFill(s, blank as BlankKind, makeRng(made + 1));
            if (!q) continue;
            made++;
            expect(q.options).toHaveLength(4);
            expect(new Set(q.options.map((o) => o.label.toLowerCase())).size).toBe(4);
            expect(q.options.find((o) => o.id === q.correctId)?.label).toBe(q.answer);
            expect(q.grammarIds).toEqual([pattern.grammarId]);
          }
          expect(made).toBeGreaterThanOrEqual(3);
        });
      }

      if (QA_SHAPES.includes(pattern.shape)) {
        it(`${pattern.id}: makes question and answer pairs`, () => {
          let made = 0;
          for (let seed = 1; seed <= 120; seed++) {
            const qa = buildQa(pattern, lexicon, taught, makeRng(seed));
            if (!qa) continue;
            made++;
            expect(new Set([qa.answer, ...qa.wrong]).size).toBe(4);
          }
          expect(made).toBeGreaterThanOrEqual(3);
        });
      }
    }

    it('builds a pool that is the same for the same seed', () => {
      const a = buildPool(act, patterns, lexicon, taught, { seed: POOL_SEED });
      const b = buildPool(act, patterns, lexicon, taught, { seed: POOL_SEED });
      expect(a).toEqual(b);
      expect(a.filter((s) => s.kind === 'statement').length).toBeGreaterThan(0);
    });

    it.skipIf(!PRINT)('prints a sample for review', () => {
      const lines: string[] = [];
      for (const pattern of patterns) {
        lines.push('', `== Act ${act} ${pattern.id} (${pattern.shape}, ${pattern.tense})`);
        const seen = new Set<string>();
        for (const s of sentencesOf(pattern, act, 400)) {
          if (seen.has(s.en) || seen.size >= 20) continue;
          seen.add(s.en);
          lines.push(`  ${s.en}`);
        }
        for (let i = 0; i < pattern.blanks.length; i++) {
          const blank = pattern.blanks[i] as BlankKind;
          const first = sentencesOf(pattern, act, 60).find((s) =>
            sentenceFill(s, blank, makeRng(1)),
          );
          const q = first ? sentenceFill(first, blank, makeRng(1)) : null;
          if (q) {
            const options = q.options.map((o) => o.label).join(' / ');
            lines.push(`  [${blank}] ${q.before}___${q.after}  -> ${q.answer}   (${options})`);
          }
        }
        if (QA_SHAPES.includes(pattern.shape)) {
          for (let seed = 1; seed <= 5; seed++) {
            const qa = buildQa(pattern, lexicon, taught, makeRng(seed));
            if (qa)
              lines.push(`  Q ${qa.question} -> ${qa.answer}  (not: ${qa.wrong.join(' | ')})`);
          }
        }
      }
      console.log(lines.join('\n'));
    });

    it.skipIf(!WRITE)('writes the draft sentence pool', async () => {
      const pool = buildPool(act, patterns, lexicon, taught, {
        seed: POOL_SEED,
        statements: 60,
        qa: 15,
      });
      expect(pool.length).toBeGreaterThan(0);
      const file = join(ROOT, 'src', 'data', 'sentences', `act${act}.json`);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, `${JSON.stringify(pool, null, 2)}\n`, 'utf8');
    });
  });
}

describe('sentence pool data', () => {
  it('is registered for each Act (the placeholder is an empty list)', () => {
    for (const act of [1, 2, 3, 4]) {
      expect(Array.isArray(PATTERNS[act] ?? [])).toBe(true);
    }
  });
});
