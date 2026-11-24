/**
 * The exam generators against the real data (units, lexicons, patterns, sentence pool,
 * verified 應答題 bank). While a data file is still empty the checks that need it skip, so
 * this passes with the placeholders; once an Act has its respond bank or patterns, every
 * section must reach its planned counts.
 *
 *   EXAM_POOL=print npx vitest run tests/examPool.test.ts --reporter=verbose
 *     prints, per Act, every 應答題 candidate as 「Q → correct | wrong1 | wrong2」 and a
 *     sample of generated sections, for the reviewers (the output shows with the verbose
 *     reporter).
 *   RESPOND_BANK=write npx vitest run tests/examPool.test.ts
 *     writes the candidates to .tmp/respond-candidates/act<N>.json (never to src/data):
 *     the blind review turns the survivors into src/data/responds/act<N>.json.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { EXAM_PLAN, examAct, type ExamId } from '../src/content/exam';
import { COMPATIBLE, type Lexicon } from '../src/content/lexicon';
import { LEXICONS, PATTERNS, RESPOND_BANK, SENTENCE_POOL } from '../src/content/lexicons';
import { makeRng } from '../src/learning/gen/common';
import {
  buildRespondBank,
  generateForSectionDetailed,
  realInput,
  realLineTags,
} from '../src/learning/examGen';
import type { Question } from '../src/learning/questions';
import { buildQa, type Qa } from '../src/learning/sentenceGen';

const PRINT = process.env.EXAM_POOL === 'print';
const WRITE = process.env.RESPOND_BANK === 'write';
const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];
const CANDIDATE_SEED = 1;
const QA_TRIES = 200;

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EXAMS: ExamId[] = ['exam1', 'exam2', 'exam3', 'exam4'];

/** Whether the Act's data can supply a kind in full (otherwise its count check is skipped). */
function ready(exam: ExamId, kind: string, wanted: number): boolean {
  const act = examAct(exam);
  switch (kind) {
    case 'respond':
      return (RESPOND_BANK[act]?.length ?? 0) >= wanted;
    case 'sentenceFill':
    case 'grammarFill':
      return (PATTERNS[act]?.length ?? 0) > 0;
    default:
      return false;
  }
}

/** The labels of a question's options, to check they differ. */
function optionLabels(q: Question): string[] {
  switch (q.kind) {
    case 'respond':
      return q.options.map((o) => o.en);
    case 'cloze':
    case 'fill':
    case 'read-sign':
      return q.options.map((o) => o.label);
    case 'choose-reply':
      return q.options.map((o) => o.text);
    default:
      return [];
  }
}

describe('generated sections from the real data', () => {
  for (const exam of EXAMS) {
    for (const section of EXAM_PLAN[exam].sections) {
      const generated = Object.entries(section.generated).filter(([, n]) => (n ?? 0) > 0);
      if (generated.length === 0) continue;
      describe(`${exam}.${section.id}`, () => {
        it('never throws, repeats nothing and has sound options for every seed', () => {
          for (const seed of SEEDS) {
            const { questions, shortfall } = generateForSectionDetailed(
              realInput(exam, section.id, seed),
            );
            const planned = generated.reduce((n, [, count]) => n + (count ?? 0), 0);
            const missing = shortfall.reduce((n, s) => n + (s.wanted - s.got), 0);
            expect(questions.length).toBe(planned - missing);
            for (const q of questions) {
              const labels = optionLabels(q);
              // 文法選句 wrong versions may differ in capitals only (english / English): exact text there.
              const same = (l: string) => (q.kind === 'choose-reply' ? l : l.toLowerCase());
              expect(new Set(labels.map(same)).size).toBe(labels.length);
              if ('correctId' in q) {
                const ids = 'options' in q ? q.options.map((o) => o.id) : [];
                expect(ids.filter((id) => id === q.correctId)).toHaveLength(1);
              }
            }
            const prompts = questions.flatMap((q) =>
              q.kind === 'respond' ? [q.prompt.en] : q.kind === 'cloze' ? [q.audioId] : [],
            );
            expect(new Set(prompts).size).toBe(prompts.length);
          }
        });

        it('keeps every wrong reply of a 應答題 outside the question type', () => {
          const bank = new Map((RESPOND_BANK[examAct(exam)] ?? []).map((b) => [b.id, b]));
          for (const seed of SEEDS) {
            const { questions } = generateForSectionDetailed(realInput(exam, section.id, seed));
            for (const q of questions) {
              if (q.kind !== 'respond') continue;
              const item = bank.get(q.respondId);
              if (!item) continue;
              for (const o of q.options.filter((x) => x.id !== q.correctId)) {
                const type = item.wrong.find((w) => w.en === o.en)?.atype;
                expect(type).toBeDefined();
                expect(type).not.toBe('universal');
                expect(COMPATIBLE[item.question.qtype]).not.toContain(type);
              }
            }
          }
        });

        for (const [kind, wanted] of generated) {
          const run = ready(exam, kind, wanted ?? 0) ? it : it.skip;
          run(`reaches its planned ${wanted} ${kind} questions for every seed`, () => {
            for (const seed of SEEDS) {
              const { shortfall } = generateForSectionDetailed(realInput(exam, section.id, seed));
              expect(shortfall.filter((s) => s.kind === kind)).toEqual([]);
            }
          });
        }

        it('is the same section for the same seed', () => {
          const a = generateForSectionDetailed(realInput(exam, section.id, 3)).questions;
          const b = generateForSectionDetailed(realInput(exam, section.id, 3)).questions;
          expect(b).toEqual(a);
        });
      });
    }
  }
});

/** The candidates of one Act: story pairs and the sentence generator's question and answer pairs. */
function candidatesOf(act: number) {
  const input = realInput(`exam${act}` as ExamId, 's1', CANDIDATE_SEED);
  const lexicon: Lexicon = {};
  for (const unit of input.units) Object.assign(lexicon, LEXICONS[unit.id] ?? {});
  const taught = new Set(Object.keys(lexicon).filter((id) => !lexicon[id]?.skip));
  const qaPairs: Qa[] = [];
  for (const pattern of PATTERNS[act] ?? []) {
    for (let seed = 1; seed <= QA_TRIES; seed++) {
      const qa = buildQa(pattern, lexicon, taught, makeRng(seed));
      if (qa) qaPairs.push(qa);
    }
  }
  const units = input.units.filter((u) => input.actOf?.(u.id) === act);
  return buildRespondBank(act, units, LEXICONS, realLineTags(), CANDIDATE_SEED, qaPairs);
}

describe('應答題 candidates', () => {
  for (const act of [1, 2, 3, 4]) {
    it(`Act ${act}: every candidate has wrong replies of an incompatible type`, () => {
      const items = candidatesOf(act);
      for (const item of items) {
        expect(item.wrong.length).toBeGreaterThanOrEqual(2);
        for (const w of item.wrong) {
          expect(w.atype).not.toBe('universal');
          expect(COMPATIBLE[item.question.qtype]).not.toContain(w.atype);
        }
      }
      if (WRITE) {
        const dir = join(ROOT, '.tmp', 'respond-candidates');
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, `act${act}.json`), `${JSON.stringify(items, null, 2)}\n`);
      }
      if (PRINT) {
        const lines = items.map(
          (i) =>
            `${i.id}  ${i.question.en} → ${i.answer.en} | ${i.wrong.map((w) => w.en).join(' | ')}`,
        );
        console.log(`Act ${act}: ${items.length} candidates\n${lines.join('\n')}`);
      }
    });
  }
});

describe.skipIf(!PRINT)('sample sections', () => {
  for (const exam of EXAMS) {
    it(`prints a sample of ${exam}`, () => {
      const act = examAct(exam);
      const out: string[] = [
        `${exam}: bank ${RESPOND_BANK[act]?.length ?? 0}, pool ${SENTENCE_POOL[act]?.length ?? 0}`,
      ];
      for (const section of EXAM_PLAN[exam].sections) {
        for (const seed of [1, 2]) {
          const { questions, shortfall } = generateForSectionDetailed(
            realInput(exam, section.id, seed),
          );
          out.push(`-- ${exam}.${section.id} seed ${seed}: ${questions.length} questions`);
          for (const s of shortfall) out.push(`   short: ${s.kind} ${s.got}/${s.wanted}`);
          for (const q of questions) out.push(`   ${describeQuestion(q)}`);
        }
      }
      console.log(out.join('\n'));
    });
  }
});

function describeQuestion(q: Question): string {
  switch (q.kind) {
    case 'respond':
      return `respond: ${q.prompt.en} → ${q.options.map((o) => `${o.id === q.correctId ? '*' : ''}${o.en}`).join(' | ')}`;
    case 'cloze':
      return `cloze: ${q.before}___${q.after} [${q.options.map((o) => `${o.id === q.correctId ? '*' : ''}${o.label}`).join(' | ')}]`;
    case 'choose-reply':
      return `pick: ${q.npcText} → ${q.options.map((o) => `${o.id === q.correctId ? '*' : ''}${o.text}`).join(' | ')}`;
    case 'read-sign':
      return `price: ${q.rows.map((r) => `${r.label} ${r.value}`).join(', ')}; ${q.en} [${q.options.map((o) => `${o.id === q.correctId ? '*' : ''}${o.label}`).join(' | ')}]`;
    case 'fill':
      return `fill: ${q.before}___${q.after} [${q.options.map((o) => `${o.id === q.correctId ? '*' : ''}${o.label}`).join(' | ')}]`;
    default:
      return q.kind;
  }
}
