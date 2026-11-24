import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ACT1_PICTURES } from '../src/art/pictures/act1';
import { ACT2_PICTURES } from '../src/art/pictures/act2';
import { ACT4_PICTURES } from '../src/art/pictures/act4';
import { PICTURE_IDS } from '../src/art/pictures';
import { VOICE_NAMES, isValidAudioId } from '../src/audio/voices';
import { ACTS } from '../src/content/acts';
import { unitToAudioItems } from '../src/content/audioItems';
import {
  EXAM_IDS,
  EXAM_PLAN,
  examAct,
  sectionAsUnit,
  sectionHasFile,
  type ExamSectionFile,
} from '../src/content/exam';
import type { Task, Unit } from '../src/content/types';
import { UNIT_ORDER } from '../src/content/unitOrder';
import { validateExam, examCopyKeys } from '../src/content/validateExam';
import { parseWordLists, profileUnits, questionTexts } from '../src/content/vocab';

/**
 * Checks every finished file in src/data/exams. Drafts are skipped, so the suite passes
 * while the files are placeholders; EXAM_REQUIRE_COMPLETE=1 makes a draft or a missing
 * file fail. EXAM_FILE=exam3.s2 picks one file.
 */
const EXAMS = join(__dirname, '..', 'src', 'data', 'exams');
const UNITS = join(__dirname, '..', 'src', 'data', 'units');
const LISTS = join(__dirname, '..', 'src', 'data', 'wordlists');
const only = process.env.EXAM_FILE;
const requireComplete = process.env.EXAM_REQUIRE_COMPLETE === '1';

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8'));
const names = readdirSync(EXAMS).filter((f) => /^exam\d\.s\d\.json$/.test(f));
const all = names.map((name) => ({ name, file: readJson(join(EXAMS, name)) as ExamSectionFile }));
const picked = all.filter(({ name }) => !only || name === `${only}.json`);
const ready = picked.filter(({ file }) => file.draft !== true);

const planned = EXAM_IDS.flatMap((exam) =>
  EXAM_PLAN[exam].sections.filter(sectionHasFile).map((s) => `${exam}.${s.id}.json`),
);

describe('the exam files', () => {
  it('has only files the plan names, each named after its exam and section', () => {
    expect(names.filter((name) => !planned.includes(name))).toEqual([]);
    for (const { name, file } of all) expect(name).toBe(`${file.exam}.${file.section}.json`);
  });

  it('is complete when EXAM_REQUIRE_COMPLETE=1', () => {
    if (!requireComplete) return;
    const missing = planned.filter((name) => !names.includes(name));
    const drafts = all.filter(({ file }) => file.draft === true).map(({ name }) => name);
    expect({ missing, drafts }).toEqual({ missing: [], drafts: [] });
  });

  it('has one exam at a time to pick with EXAM_FILE', () => {
    if (only) expect(picked.length).toBeLessThanOrEqual(1);
  });
});

const utf8 = (f: string) => readFileSync(join(LISTS, f), 'utf8');
const latin1 = (f: string) => readFileSync(join(LISTS, f), 'latin1');
const lists = parseWordLists({
  ngslStats: utf8('NGSL_12_stats.csv'),
  ngslForms: utf8('NGSL_12_lemmatized_for_research.csv'),
  supForms: utf8('SUP_lemmatized.csv'),
  tslStats: latin1('TSL_12_stats.csv'),
  tslForms: latin1('TSL_12_lemmatized_for_research.csv'),
});

const units = (): Unit[] =>
  readdirSync(UNITS)
    .filter((f) => f.endsWith('.json'))
    .map((f) => readJson(join(UNITS, f)) as Unit)
    .filter((u) => UNIT_ORDER.includes(u.id))
    .sort((a, b) => UNIT_ORDER.indexOf(a.id) - UNIT_ORDER.indexOf(b.id));

/** Every text of 5 or more words in a JSON value, lower-cased, on one line. */
function longTexts(value: unknown, into = new Set<string>()): Set<string> {
  if (typeof value === 'string') {
    const text = value.trim().toLowerCase().replace(/\s+/g, ' ');
    if (text.split(' ').length >= 5) into.add(text);
  } else if (Array.isArray(value)) {
    for (const item of value) longTexts(item, into);
  } else if (typeof value === 'object' && value !== null) {
    for (const item of Object.values(value)) longTexts(item, into);
  }
  return into;
}

/**
 * TOEIC frames its questions with the people in them ("What does the man want?", "A
 * woman is ...", "Why is the speaker calling?"), so these may appear anywhere in an exam
 * though no unit teaches them in Act 1.
 */
const EXAM_FRAME_WORDS = new Set(['man', 'woman', 'speaker', 'listener', 'reader']);

/** Words of a TOEIC question stem ("What does the man ask?", "What is true about ..."), allowed in stems only. */
const EXAM_STEM_WORDS = new Set(['ask', 'tell', 'why', 'happen', 'true', 'mention', 'suggest']);

/** The task with every question stem (talk, passage and sign questions) left empty. */
function withoutStems(task: Task): Task {
  const blank = <Q extends { en: string }>(qs: readonly Q[]): Q[] =>
    qs.map((q) => ({ ...q, en: '' }));
  return {
    ...task,
    ...(task.talks
      ? { talks: task.talks.map((t) => ({ ...t, questions: blank(t.questions) })) }
      : {}),
    ...(task.passages
      ? { passages: task.passages.map((p) => ({ ...p, questions: blank(p.questions) })) }
      : {}),
    ...(task.signs
      ? { signs: task.signs.map((s) => ({ ...s, question: { ...s.question, en: '' } })) }
      : {}),
  } as Task;
}

/** The act whose picture file holds a picture (Act 3 has none), or 0 for an unknown id. */
const pictureAct = (id: string) =>
  id in ACT1_PICTURES ? 1 : id in ACT2_PICTURES ? 2 : id in ACT4_PICTURES ? 4 : 0;

for (const { name, file } of ready) {
  describe(name, () => {
    const act = examAct(file.exam);

    it('has no problems', () => {
      expect(validateExam(file)).toEqual([]);
    });

    it('uses only words taught by the end of the act', () => {
      const last = ACTS[act - 1]!.places.at(-1)!.unitId!;
      const upTo = units().filter((u) => UNIT_ORDER.indexOf(u.id) <= UNIT_ORDER.indexOf(last));
      const task = sectionAsUnit(file).tasks[0]!;
      const unplanned = (t: Task): string[] => {
        const probe: Unit = {
          id: '__exam',
          title: '__exam',
          titleEn: '__exam',
          chunks: [],
          words: [],
          tasks: [{ ...t, scene: questionTexts(t) }],
        };
        const profile = profileUnits([...upTo, probe], lists).at(-1);
        expect(profile?.unitId).toBe('__exam');
        return profile?.unplanned ?? [];
      };
      // The same task with the question stems blanked: a stem word is only let through
      // when nothing but a stem uses it.
      const stemless = new Set(unplanned(withoutStems(task)));
      const left = unplanned(task).filter(
        (w) => !EXAM_FRAME_WORDS.has(w) && !(EXAM_STEM_WORDS.has(w) && !stemless.has(w)),
      );
      expect(left).toEqual([]);
    });

    it('uses pictures that exist and belong to this act or an earlier one', () => {
      const wrong = (file.pictures ?? [])
        .filter((p) => !PICTURE_IDS.includes(p.pictureId) || pictureAct(p.pictureId) > act)
        .map((p) => `${p.id}: ${p.pictureId}`);
      expect(wrong).toEqual([]);
    });

    it('copies no sentence of 5 words or more from the units', () => {
      const own = longTexts(file);
      const theirs = longTexts(units());
      expect([...own].filter((text) => theirs.has(text))).toEqual([]);
    });

    it('gives every audio id a valid pattern and every role a voice', () => {
      const items = unitToAudioItems(sectionAsUnit(file));
      const badIds = items.filter(
        (i) => !isValidAudioId(i.id) || !i.id.startsWith(`${file.exam}.`),
      );
      const noVoice = items.filter(
        (i) => !VOICE_NAMES.neural2[i.role] || !VOICE_NAMES.chirp[i.role],
      );
      expect(badIds.map((i) => i.id)).toEqual([]);
      expect(noVoice.map((i) => `${i.id}: ${i.role}`)).toEqual([]);
    });
  });
}

const wholeExams = EXAM_IDS.map((exam) => ({
  exam,
  files: ready.filter(({ file }) => file.exam === exam).map(({ file }) => file),
})).filter(({ files }) => files.length > 0);

if (wholeExams.length > 0) {
  describe('one exam as a whole', () => {
    it.each(wholeExams.map(({ exam, files }) => [exam, files] as const))(
      '%s repeats no question or long line across its sections',
      (_exam, files) => {
        const seen = new Map<string, number>();
        for (const file of files) {
          for (const key of new Set(examCopyKeys(file))) seen.set(key, (seen.get(key) ?? 0) + 1);
        }
        expect([...seen].filter(([, n]) => n > 1).map(([key]) => key)).toEqual([]);
      },
    );
  });
}
