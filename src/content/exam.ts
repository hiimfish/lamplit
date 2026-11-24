/**
 * 幕結業考 (docs/specs/curriculum.md): the plan of the four exams, their settings
 * and how a section file becomes a unit (so its audio ids come out as
 * `exam1.respond.<id>`). scripts/gen-audio.mjs runs this file in plain Node, so it
 * has type imports only: no run-time import.
 */
import type {
  FillItem,
  PassageItem,
  PictureItem,
  RespondItem,
  TalkItem,
  TextFillItem,
  Task,
  Unit,
} from './types';

export type ExamId = 'exam1' | 'exam2' | 'exam3' | 'exam4';

export const EXAM_IDS: readonly ExamId[] = ['exam1', 'exam2', 'exam3', 'exam4'];

export const isExamId = (value: unknown): value is ExamId =>
  typeof value === 'string' && (EXAM_IDS as readonly string[]).includes(value);

/** Which Act (1 to 4) an exam closes. */
export const examAct = (exam: ExamId): 1 | 2 | 3 | 4 =>
  exam === 'exam1' ? 1 : exam === 'exam2' ? 2 : exam === 'exam3' ? 3 : 4;

/** The two hand-written forms of a section: the first sitting uses A, the second B. */
export type ExamForm = 'A' | 'B';

export type SectionKind = 'listening' | 'reading';

/**
 * Left from the generated questions: every count is now empty (all questions are
 * hand-written). Kept only while src/learning/examGen.ts still reads it; goes with it.
 */
export interface GeneratedCounts {
  respond?: number;
  listenCloze?: number;
  grammarPick?: number;
  priceList?: number;
  sentenceFill?: number;
  grammarFill?: number;
}

/**
 * Hand-written questions per section and form, as the number of questions in each
 * item: `talks: [3, 3, 2, 2]` is four conversations with 3, 3, 2 and 2 questions.
 */
export interface WrittenCounts {
  /** 看圖 questions (one per picture). */
  pictures?: number;
  /** 應答題 (one question each). */
  responds?: number;
  talks?: number[];
  /** 看告示 questions (one per sign). */
  signs?: number;
  /** 句子填空 and 文法填空 (one blank each). */
  fills?: number;
  passages?: number[];
  /** 段落填空: blanks in each text. */
  textFills?: number[];
}

export interface SectionPlan {
  /** `s1`, `s2`, ...; prefixes every question and line id of the section. */
  id: string;
  kind: SectionKind;
  title: string;
  /** Always empty (see GeneratedCounts). */
  generated: GeneratedCounts;
  written: WrittenCounts;
  /** Questions in the section (one form). */
  total: number;
}

export interface ExamPlan {
  act: 1 | 2 | 3 | 4;
  title: string;
  sections: SectionPlan[];
}

const section = (
  id: string,
  kind: SectionKind,
  title: string,
  total: number,
  written: WrittenCounts,
): SectionPlan => ({ id, kind, title, generated: {}, written, total });

/**
 * Every question is hand-written (src/data/exams/<exam>.<section>.json). Bump
 * EXAM_CONTENT_VERSION when the questions are rewritten: an old save then forgets
 * which questions it saw and starts again at form A (its scores stay).
 */
export const EXAM_CONTENT_VERSION = 2;

export const EXAM_PLAN: Record<ExamId, ExamPlan> = {
  exam1: {
    act: 1,
    title: '第一幕結業考',
    sections: [
      section('s1', 'listening', '聽力', 16, { responds: 10, talks: [2, 2, 2] }),
      section('s2', 'reading', '閱讀', 20, {
        pictures: 6,
        fills: 6,
        signs: 4,
        passages: [2, 2],
      }),
    ],
  },
  exam2: {
    act: 2,
    title: '第二幕結業考',
    sections: [
      section('s1', 'listening', '聽力', 18, { responds: 8, talks: [2, 2, 2, 2, 2] }),
      section('s2', 'reading', '閱讀', 20, {
        pictures: 2,
        fills: 8,
        signs: 2,
        passages: [2, 2, 2, 2],
      }),
    ],
  },
  exam3: {
    act: 3,
    title: '第三幕結業考',
    sections: [
      section('s1', 'listening', '聽力一', 16, { responds: 8, talks: [2, 2, 2, 2] }),
      section('s2', 'listening', '聽力二', 12, { talks: [3, 3, 2, 2, 2] }),
      section('s3', 'reading', '閱讀一', 18, { fills: 12, textFills: [3, 3] }),
      section('s4', 'reading', '閱讀二', 10, { passages: [3, 3, 2, 2] }),
    ],
  },
  exam4: {
    act: 4,
    title: '第四幕結業考',
    sections: [
      // The pictures of Act 4 are heard (`listen: true`), as in TOEIC Part 1.
      section('s1', 'listening', '聽力一', 19, { pictures: 4, responds: 9, talks: [3, 3] }),
      section('s2', 'listening', '聽力二', 21, { talks: [3, 3, 3, 3, 3, 3, 3] }),
      section('s3', 'reading', '閱讀一', 22, { fills: 14, textFills: [4, 4] }),
      section('s4', 'reading', '閱讀二', 9, { passages: [3, 3, 3] }),
      // One double-passage set (4 questions) and one triple-passage set (5).
      section('s5', 'reading', '閱讀三', 9, { passages: [4, 5] }),
    ],
  },
};

/** Sum of the numbers in a count list (0 for none). */
const sum = (list: readonly number[] | undefined): number =>
  (list ?? []).reduce((total, n) => total + n, 0);

/** Hand-written questions in one form of a section (what validateExam checks). */
export function writtenQuestionCount(written: WrittenCounts): number {
  return (
    (written.pictures ?? 0) +
    (written.responds ?? 0) +
    (written.signs ?? 0) +
    (written.fills ?? 0) +
    sum(written.talks) +
    sum(written.passages) +
    sum(written.textFills)
  );
}

/** Whether a section has a data file: every section does now (all its questions are written). */
export const sectionHasFile = (plan: SectionPlan): boolean =>
  writtenQuestionCount(plan.written) > 0;

/** How many times a question may be played: Act 1 and 2 without limit, Act 3 twice, Act 4 once. */
export const EXAM_PLAYS: Record<ExamId, number> = {
  exam1: Infinity,
  exam2: Infinity,
  exam3: 2,
  exam4: 1,
};

/**
 * How a 應答題 shows: the question is heard in every exam; the options are read
 * (`text`), read and heard (`text-audio`) or only heard (`audio`).
 */
export type ResponseMode = 'text' | 'text-audio' | 'audio';

export const RESPONSE_MODE: Record<ExamId, ResponseMode> = {
  exam1: 'text',
  exam2: 'text',
  exam3: 'text-audio',
  exam4: 'audio',
};

/** The reading countdown: Act 4 gets 12 minutes; in Acts 1 to 3 the time only reminds. */
export const READING_TIMER: Record<ExamId, { seconds: number; hard: boolean }> = {
  exam1: { seconds: 600, hard: false },
  exam2: { seconds: 600, hard: false },
  exam3: { seconds: 600, hard: false },
  exam4: { seconds: 720, hard: true },
};

type SignItem = NonNullable<Task['signs']>[number];

/** A hand-written item; `form` says which of the two forms (A or B) it belongs to. */
type Formed<T> = T & { form?: ExamForm };

/**
 * One data file, `src/data/exams/<exam>.<section>.json`: the hand-written questions of
 * one section. Every id starts with `<section>_`. A file with `draft: true` is a
 * placeholder the game and the audio script skip.
 */
export interface ExamSectionFile {
  exam: ExamId;
  /** `s1`, `s2`, ... */
  section: string;
  draft?: boolean;
  pictures?: Formed<PictureItem>[];
  responds?: Formed<RespondItem>[];
  talks?: Formed<TalkItem>[];
  signs?: Formed<SignItem>[];
  fills?: Formed<FillItem>[];
  textFills?: Formed<TextFillItem>[];
  passages?: Formed<PassageItem>[];
}

/**
 * The section as a one-task unit named after its exam, so the existing audio and
 * check code reads it: ids become `exam1.respond.s1_q3`, `exam3.talk.s2_t1_1`.
 */
export function sectionAsUnit(file: ExamSectionFile): Unit {
  const task: Unit['tasks'][number] = {
    id: file.section,
    title: file.section,
    newChunkIds: [],
    newWordIds: [],
    scene: [],
  };
  if (file.pictures) task.pictures = file.pictures;
  if (file.responds) task.responds = file.responds;
  if (file.talks) task.talks = file.talks;
  if (file.signs) task.signs = file.signs;
  if (file.fills) task.fills = file.fills;
  if (file.textFills) task.textFills = file.textFills;
  if (file.passages) task.passages = file.passages;
  return {
    id: file.exam,
    title: file.exam,
    titleEn: file.exam,
    chunks: [],
    words: [],
    tasks: [task],
  };
}
