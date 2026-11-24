import { describe, expect, it } from 'vitest';
import type { ExamSectionFile } from '../src/content/exam';
import { createEmptySave, EXAM_RUN_DAYS, type SaveData } from '../src/core/save';
import {
  abandonRun,
  chooseForm,
  correctOf,
  commitSection,
  EXAM_COINS,
  finishRun,
  gradeSection,
  isExamUnlocked,
  pickWritten,
  questionDifficulty,
  resumeRun,
  reviewQuestions,
  sectionQuestions,
  startRun,
  type ExamDeps,
  type ExamOutcome,
} from '../src/learning/exam';
import type { ScoredAnswer } from '../src/learning/examScore';
import type { Question } from '../src/learning/questions';

const NOW = new Date(2026, 10, 24, 12, 0, 0);

const talk = (id: string, form: 'A' | 'B', n = 2) => ({
  id,
  form,
  lines: [
    { id: `${id}_1`, role: 'guide' as const, en: 'Hello there.', zh: '你好。' },
    { id: `${id}_2`, role: 'announcer' as const, en: 'Hi. Where to?', zh: '嗨。去哪？' },
  ],
  questions: Array.from({ length: n }, (_, i) => ({
    en: `Q${i}?`,
    zh: `問${i}？`,
    options: ['alpha', 'beta', 'gamma'],
    answer: i % 3,
  })),
});

const picture = (id: string, form: 'A' | 'B') => ({
  id,
  form,
  pictureId: 'cat',
  options: [
    { en: 'A cat sits.', zh: '貓坐著。' },
    { en: 'A dog runs.', zh: '狗在跑。' },
    { en: 'A bird flies.', zh: '鳥在飛。' },
  ],
  answer: 1,
});

const FILE: ExamSectionFile = {
  exam: 'exam2',
  section: 's1',
  pictures: [
    picture('s1_p1', 'A'),
    picture('s1_p2', 'A'),
    picture('s1_p3', 'B'),
    picture('s1_p4', 'B'),
  ],
  talks: [talk('s1_t1', 'A'), talk('s1_t2', 'A', 3), talk('s1_t3', 'B'), talk('s1_t4', 'B', 3)],
};

const generated = (n: number): Question[] =>
  Array.from({ length: n }, (_, i) => ({
    kind: 'cloze',
    audioId: `x.line.${i}`,
    before: 'I like',
    after: 'a lot.',
    answer: 'tea',
    zh: '我很愛喝茶。',
    options: [
      { id: 'o0', label: 'tea' },
      { id: 'o1', label: 'rice' },
      { id: 'o2', label: 'milk' },
    ],
    correctId: 'o0',
    itemId: 'word:tea',
  }));

const questions = (form: 'A' | 'B' | 'mixed', seed: number, seen = {}) =>
  sectionQuestions(FILE, seed, { section: 's1', form, seen, generated: generated(2) });

describe('chooseForm', () => {
  it('A first, B second, mixed from the third', () => {
    const at = (attempts: number): SaveData => ({
      ...createEmptySave(NOW),
      exams: { exam2: { attempts, lastDate: '2026-11-01', listening: 1, reading: 1, seen: {} } },
    });
    expect(chooseForm(createEmptySave(NOW), 'exam2')).toBe('A');
    expect(chooseForm(at(1), 'exam2')).toBe('B');
    expect(chooseForm(at(2), 'exam2')).toBe('mixed');
    expect(chooseForm(at(9), 'exam2')).toBe('mixed');
    expect(chooseForm(at(2), 'exam1')).toBe('A');
  });
});

describe('isExamUnlocked', () => {
  const town = [
    {
      no: '1',
      title: 'a',
      places: [{ title: 'p', unit: { id: 'u1', tasks: [{ id: 't1' }, { id: 't2' }] } }],
    },
    { no: '2', title: 'b', places: [] },
  ];
  it('needs every task of the act played; the dev flag opens it', () => {
    const save = createEmptySave(NOW);
    expect(isExamUnlocked(save, town, 1)).toBe(false);
    const half = { ...save, tasks: { 'u1/t1': { stars: 1, plays: 1 } } };
    expect(isExamUnlocked(half, town, 1)).toBe(false);
    const all = { ...half, tasks: { ...half.tasks, 'u1/t2': { stars: 3, plays: 1 } } };
    expect(isExamUnlocked(all, town, 1)).toBe(true);
    expect(isExamUnlocked(save, town, 1, true)).toBe(true);
  });
  it('an act with no tasks or no entry stays shut', () => {
    expect(isExamUnlocked(createEmptySave(NOW), town, 2)).toBe(false);
    expect(isExamUnlocked(createEmptySave(NOW), town, 4)).toBe(false);
  });
});

describe('pickWritten', () => {
  const ids = (file: ExamSectionFile) => [
    ...(file.pictures ?? []).map((p) => p.id),
    ...(file.talks ?? []).map((t) => t.id),
  ];
  it('A and B take their own items', () => {
    expect(ids(pickWritten(FILE, 'A', {}, 1))).toEqual(['s1_p1', 's1_p2', 's1_t1', 's1_t2']);
    expect(ids(pickWritten(FILE, 'B', {}, 1))).toEqual(['s1_p3', 's1_p4', 's1_t3', 's1_t4']);
  });
  it('an item without a form is in both forms', () => {
    const file = { ...FILE, pictures: [{ ...picture('s1_px', 'A'), form: undefined }] };
    expect(pickWritten(file, 'B', {}, 1).pictures?.map((p) => p.id)).toEqual(['s1_px']);
  });
  it('mixed keeps the shape of form A and takes the least seen first', () => {
    const seen = { s1_p1: 3, s1_p2: 3, s1_t1: 2, s1_t2: 2 };
    const mixed = pickWritten(FILE, 'mixed', seen, 7);
    expect(mixed.pictures?.map((p) => p.id).sort()).toEqual(['s1_p3', 's1_p4']);
    expect(mixed.talks?.map((t) => t.id).sort()).toEqual(['s1_t3', 's1_t4']);
    expect(mixed.talks?.map((t) => t.questions.length).sort()).toEqual([2, 3]);
  });
  it('mixed with nothing seen is deterministic per seed', () => {
    const a = ids(pickWritten(FILE, 'mixed', {}, 5));
    expect(ids(pickWritten(FILE, 'mixed', {}, 5))).toEqual(a);
    expect(a).toHaveLength(4);
    expect(new Set(a).size).toBe(4);
  });
  it('mixed prefers the item with fewer sightings across forms', () => {
    const seen = { s1_p1: 1, s1_p2: 5, s1_p3: 4, s1_p4: 4 };
    const picked = pickWritten(FILE, 'mixed', seen, 3).pictures?.map((p) => p.id) ?? [];
    expect(picked).toHaveLength(2);
    expect(picked).toContain('s1_p1');
    expect(picked).not.toContain('s1_p2');
  });
  it('leaves a section without a kind alone', () => {
    const picked = pickWritten({ ...FILE, talks: undefined }, 'A', {}, 1);
    expect(picked.talks).toBeUndefined();
  });
});

describe('sectionQuestions', () => {
  it('is deterministic per seed and differs between seeds', () => {
    const a = questions('A', 11).map((i) => i.qid);
    expect(questions('A', 11).map((i) => i.qid)).toEqual(a);
    const seeds = [12, 13, 14, 15].map((s) =>
      questions('A', s)
        .map((i) => i.qid)
        .join(),
    );
    expect(seeds.some((s) => s !== a.join())).toBe(true);
  });
  it('form A has only A items, B only B; the counts match', () => {
    const a = questions('A', 1);
    const b = questions('B', 1);
    expect(a.filter((i) => i.seenId).map((i) => i.seenId)).not.toContain('s1_p3');
    expect(b.filter((i) => i.seenId).map((i) => i.seenId)).not.toContain('s1_p1');
    expect(a).toHaveLength(2 + 2 + 2 + 3);
    expect(b).toHaveLength(2 + 2 + 2 + 3);
  });
  it('builds stable qids section/kind/itemId/index and unique ones', () => {
    const items = questions('A', 1);
    const qids = items.map((i) => i.qid);
    expect(new Set(qids).size).toBe(qids.length);
    expect(qids).toContain('s1/cloze/g0/0');
    expect(qids).toContain('s1/picture/s1_p1/0');
    expect(qids).toContain('s1/talk/s1_t2/2');
  });
  it('generated questions come first and carry no seenId; written ones do', () => {
    const items = questions('A', 1);
    expect(items.slice(0, 2).every((i) => i.seenId === undefined)).toBe(true);
    expect(items[0]?.question.kind).toBe('cloze');
    expect(items.slice(2).every((i) => i.seenId !== undefined)).toBe(true);
  });
  it('keeps the questions of a talk together, in order, in a shared group', () => {
    const items = questions('A', 4);
    const t2 = items.filter((i) => i.group === 's1/s1_t2');
    expect(t2.map((i) => i.qid)).toEqual(['s1/talk/s1_t2/0', 's1/talk/s1_t2/1', 's1/talk/s1_t2/2']);
    const at = items.findIndex((i) => i.group === 's1/s1_t2');
    expect(items.slice(at, at + 3).map((i) => i.group)).toEqual([
      's1/s1_t2',
      's1/s1_t2',
      's1/s1_t2',
    ]);
    expect(items.filter((i) => i.question.kind === 'picture').every((i) => !i.group)).toBe(true);
  });
  it('shuffles options by seed but the id stays the content index', () => {
    const orders = new Set<string>();
    for (let seed = 1; seed < 20; seed++) {
      const pic = questions('A', seed).find((i) => i.qid === 's1/picture/s1_p1/0');
      const q = pic?.question;
      if (q?.kind !== 'picture') throw new Error('no picture');
      orders.add(q.options.map((o) => o.id).join());
      expect(q.correctId).toBe('o1');
      expect(q.options.find((o) => o.id === 'o1')?.en).toBe('A dog runs.');
    }
    expect(orders.size).toBeGreaterThan(1);
  });
  it('a section without a file holds just the generated questions', () => {
    const items = sectionQuestions(undefined, 3, {
      section: 's2',
      form: 'A',
      generated: generated(3),
    });
    expect(items.map((i) => i.qid)).toEqual(['s2/cloze/g0/0', 's2/cloze/g1/0', 's2/cloze/g2/0']);
    expect(sectionQuestions(undefined, 3, { section: 's2', form: 'A' })).toEqual([]);
  });
  it('gives each question a difficulty between 0 and 1, harder when longer', () => {
    const items = questions('A', 1);
    for (const item of items) {
      expect(item.difficulty).toBeGreaterThanOrEqual(0);
      expect(item.difficulty).toBeLessThanOrEqual(1);
    }
    const long = generated(1)[0] as Question;
    const harder = {
      ...long,
      before: Array(60).fill('word').join(' '),
      options: [{ id: 'o0', label: 'one two three four five six seven eight nine' }],
    } as Question;
    expect(questionDifficulty(harder)).toBeGreaterThan(questionDifficulty(long));
    expect(questionDifficulty(harder)).toBeLessThanOrEqual(1);
  });
});

describe('run in the save', () => {
  it('startRun writes an empty run and restarts an old one', () => {
    const started = startRun(createEmptySave(NOW), 'exam2', NOW, 99);
    expect(started.examRun).toEqual({
      exam: 'exam2',
      seed: 99,
      startedOn: '2026-11-24',
      done: [],
      answers: {},
    });
    const mid = commitSection(started, 's1', [{ qid: 'a', choice: 'o1' }]);
    const again = startRun(mid, 'exam2', NOW, 5);
    expect(again.examRun?.done).toEqual([]);
    expect(again.examRun?.answers).toEqual({});
    expect(again.examRun?.seed).toBe(5);
  });
  it('commitSection keeps chosen answers, skips blanks and does not repeat a section', () => {
    let save = startRun(createEmptySave(NOW), 'exam1', NOW, 1);
    save = commitSection(save, 's1', [
      { qid: 'a', choice: 'o2' },
      { qid: 'b', choice: null },
    ]);
    save = commitSection(save, 's1', [{ qid: 'c', choice: 'o0' }]);
    expect(save.examRun?.done).toEqual(['s1']);
    expect(save.examRun?.answers).toEqual({ a: 'o2', c: 'o0' });
    expect(commitSection(createEmptySave(NOW), 's1', [])).toEqual(createEmptySave(NOW));
  });
  it('resumeRun finds the run of that exam until it is a week old', () => {
    const save = startRun(createEmptySave(NOW), 'exam2', NOW, 1);
    expect(resumeRun(save, 'exam2', NOW)?.seed).toBe(1);
    expect(resumeRun(save, 'exam1', NOW)).toBeUndefined();
    const edge = new Date(2026, 10, 24 + EXAM_RUN_DAYS, 9, 0, 0);
    expect(resumeRun(save, 'exam2', edge)).toBeDefined();
    const late = new Date(2026, 10, 24 + EXAM_RUN_DAYS + 1, 9, 0, 0);
    expect(resumeRun(save, 'exam2', late)).toBeUndefined();
    expect(resumeRun(createEmptySave(NOW), 'exam2', NOW)).toBeUndefined();
  });
  it('abandonRun drops the run and nothing else', () => {
    const save = startRun({ ...createEmptySave(NOW), coins: 7 }, 'exam2', NOW, 1);
    const gone = abandonRun(save);
    expect(gone.examRun).toBeUndefined();
    expect(gone.coins).toBe(7);
    expect(abandonRun(gone)).toBe(gone);
  });
});

/** A score that counts the right answers so the tests see what was passed in. */
const deps = (
  calls: { retake?: boolean; offsets: (number | undefined)[]; n: number[] } = {
    offsets: [],
    n: [],
  },
): ExamDeps => ({
  score: (_act, kind, answers: readonly ScoredAnswer[], offset) => {
    calls.offsets.push(offset);
    calls.n.push(answers.length);
    const right = answers.filter((a) => a.correct).length;
    const base = (kind === 'listening' ? 100 : 200) + right * 5;
    return { score: base, low: base - 10, high: base + 10 };
  },
  addCheckpoint: (save, _now, act, listening, reading, retake) => {
    calls.retake = retake;
    return {
      ...save,
      checkpoints: [
        ...save.checkpoints,
        {
          date: '2026-11-24',
          listening,
          reading,
          source: 'exam' as const,
          act,
          ...(retake ? { retake: true as const } : {}),
        },
      ],
    };
  },
});

const sections = (form: 'A' | 'B', seed: number, pick: (q: Question) => string | null) => {
  const items = questions(form, seed);
  const listening = gradeSection(
    { id: 's1', kind: 'listening', items },
    items.map((i) => ({ qid: i.qid, choice: pick(i.question) })),
  );
  const reading = gradeSection({ id: 's2', kind: 'reading', items: items.slice(0, 2) }, {});
  return [listening, reading];
};

describe('gradeSection', () => {
  it('counts the right content options whatever their place', () => {
    const [listening] = sections('A', 2, (q) => ('correctId' in q ? q.correctId : null));
    expect(listening?.correct).toBe(listening?.total);
    const [none] = sections('A', 2, () => null);
    expect(none?.correct).toBe(0);
    expect(none?.answers.every((a) => a.choice === null)).toBe(true);
  });
  it('grades from the saved qid to option map too', () => {
    const items = questions('A', 2);
    const map = Object.fromEntries(items.map((i) => [i.qid, correctOf(i.question) ?? '']));
    const graded = gradeSection({ id: 's1', kind: 'listening', items }, map);
    expect(graded.correct).toBe(items.length);
    expect(gradeSection({ id: 's1', kind: 'listening', items }, {}).correct).toBe(0);
  });
});

describe('finishRun', () => {
  const right = (q: Question) => ('correctId' in q ? q.correctId : null);

  it('scores each kind over its sections, with the calibration offset', () => {
    const calls = { offsets: [] as (number | undefined)[], n: [] as number[] };
    const base = createEmptySave(NOW);
    const save = {
      ...base,
      exams: { calibration: { listening: 15, reading: -5, pairs: 2 } },
    };
    const { summary } = finishRun(save, 'exam2', sections('A', 1, right), NOW, deps(calls));
    expect(calls.offsets).toEqual([15, -5]);
    expect(calls.n).toEqual([9, 2]);
    expect(summary.listening.score).toBe(100 + 9 * 5);
    expect(summary.reading.score).toBe(200 + 0 * 5);
  });

  it('writes the record, checkpoint and 50 coins the first time only', () => {
    const first = finishRun(
      startRun(createEmptySave(NOW), 'exam2', NOW, 1),
      'exam2',
      sections('A', 1, right),
      NOW,
      deps(),
    );
    expect(first.summary).toMatchObject({
      first: true,
      coins: EXAM_COINS,
      attempts: 1,
      retake: false,
    });
    expect(first.save.coins).toBe(EXAM_COINS);
    expect(first.save.examRun).toBeUndefined();
    expect(first.save.exams.exam2).toMatchObject({
      attempts: 1,
      lastDate: '2026-11-24',
      listening: 145,
      reading: 200,
    });
    expect(first.save.checkpoints).toHaveLength(1);
    expect(first.save.checkpoints[0]).toMatchObject({
      source: 'exam',
      act: 2,
      listening: 145,
      reading: 200,
    });

    const second = finishRun(first.save, 'exam2', sections('B', 2, right), NOW, deps());
    expect(second.summary).toMatchObject({ first: false, coins: 0, attempts: 2, retake: false });
    expect(second.save.coins).toBe(EXAM_COINS);
  });

  it('counts the seen written items once per sitting', () => {
    const { save } = finishRun(createEmptySave(NOW), 'exam2', sections('A', 1, right), NOW, deps());
    const seen = save.exams.exam2?.seen ?? {};
    expect(seen).toMatchObject({ s1_p1: 1, s1_p2: 1, s1_t1: 1, s1_t2: 1 });
    expect(seen.s1_t2).toBe(1);
    expect(seen.s1_p3).toBeUndefined();
  });

  it('flags a retake when a seen item comes again, with how many questions', () => {
    const calls = { offsets: [], n: [] } as {
      retake?: boolean;
      offsets: (number | undefined)[];
      n: number[];
    };
    const one = finishRun(createEmptySave(NOW), 'exam2', sections('A', 1, right), NOW, deps());
    const again = finishRun(one.save, 'exam2', sections('A', 3, right), NOW, deps(calls));
    expect(again.summary.retake).toBe(true);
    expect(again.summary.reused).toBe(7);
    expect(calls.retake).toBe(true);
    expect(again.save.checkpoints.at(-1)).toMatchObject({ retake: true });
    expect(again.save.exams.exam2?.seen.s1_p1).toBe(2);
  });

  it('does not flag a retake for form B after form A', () => {
    const one = finishRun(createEmptySave(NOW), 'exam2', sections('A', 1, right), NOW, deps());
    const calls = { offsets: [], n: [] } as {
      retake?: boolean;
      offsets: (number | undefined)[];
      n: number[];
    };
    const two = finishRun(one.save, 'exam2', sections('B', 1, right), NOW, deps(calls));
    expect(two.summary.retake).toBe(false);
    expect(calls.retake).toBe(false);
  });

  it('leaves daily.answered and correct alone but counts the streak and logs mistakes', () => {
    const wrong = sections('A', 1, () => null);
    const { save } = finishRun(createEmptySave(NOW), 'exam2', wrong, NOW, deps());
    expect(save.daily.answered).toBe(0);
    expect(save.daily.correct).toBe(0);
    expect(save.streak.count).toBe(1);
    expect(save.lastPlayedDate).toBe('2026-11-24');
    const logged = Object.values(save.mistakes['2026-11-24'] ?? {});
    expect(logged.length).toBeGreaterThan(0);
    expect(logged.every(([missed, asked]) => missed === asked)).toBe(true);
  });

  it('works for a sitting with no sections at all', () => {
    const { save, summary } = finishRun(createEmptySave(NOW), 'exam1', [], NOW, deps());
    expect(summary.total).toBe(0);
    expect(save.exams.exam1?.attempts).toBe(1);
  });
});

describe('reviewQuestions', () => {
  it('lists the wrong and blank questions with the pick, without touching a save', () => {
    const items = questions('A', 1);
    const answers = items.map((item, i) => ({
      qid: item.qid,
      choice: i === 0 ? (correctOf(item.question) ?? null) : i === 1 ? null : 'o9',
    }));
    const outcome: ExamOutcome = gradeSection({ id: 's1', kind: 'listening', items }, answers);
    const review = reviewQuestions([outcome]);
    expect(review).toHaveLength(items.length - 1);
    expect(review[0]?.qid).toBe(items[1]?.qid);
    expect(review[0]?.picked).toBeNull();
    expect(review[1]?.picked).toBe('o9');
    expect(review.map((r) => r.question)).not.toContain(items[0]?.question);
    expect(reviewQuestions([])).toEqual([]);
  });
});
