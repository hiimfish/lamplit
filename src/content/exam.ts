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

/** Questions the generators build (src/learning/examGen.ts), counted per section. */
export interface GeneratedCounts {
  /** 應答題 from the story lines and the verified bank (src/data/responds). */
  respond?: number;
  /** 聽力填空 on a story line or a sentence of the pool. */
  listenCloze?: number;
  /** 文法選句: which sentence is correct. */
  grammarPick?: number;
  /** 價目表 (Act 1 only). */
  priceList?: number;
  /** 句子填空 built by the sentence generator. */
  sentenceFill?: number;
  /** 文法填空 built by the sentence generator. */
  grammarFill?: number;
}

/**
 * Hand-written questions per section and form, as the number of questions in each
 * item: `talks: [3, 3, 2, 2]` is four conversations with 3, 3, 2 and 2 questions.
 */
export interface WrittenCounts {
  /** 看圖 questions (one per picture). */
  pictures?: number;
  talks?: number[];
  passages?: number[];
  /** 段落填空: blanks in each text. */
  textFills?: number[];
}

export interface SectionPlan {
  /** `s1`, `s2`, ...; prefixes every question and line id of the section. */
  id: string;
  kind: SectionKind;
  title: string;
  generated: GeneratedCounts;
  written: WrittenCounts;
  /** Questions in the section, generated plus written (one form). */
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
  generated: GeneratedCounts,
  written: WrittenCounts = {},
): SectionPlan => ({ id, kind, title, generated, written, total });

export const EXAM_PLAN: Record<ExamId, ExamPlan> = {
  exam1: {
    act: 1,
    title: '第一幕結業考',
    sections: [
      section('s1', 'listening', '聽力', 16, { respond: 10, listenCloze: 6 }),
      section('s2', 'reading', '閱讀', 20, { priceList: 6, grammarPick: 6 }, { pictures: 8 }),
    ],
  },
  exam2: {
    act: 2,
    title: '第二幕結業考',
    sections: [
      section(
        's1',
        'listening',
        '聽力',
        18,
        { respond: 6, listenCloze: 4 },
        { talks: [2, 2, 2, 2] },
      ),
      section(
        's2',
        'reading',
        '閱讀',
        20,
        { grammarPick: 4, sentenceFill: 4 },
        { pictures: 4, passages: [2, 2, 2, 2] },
      ),
    ],
  },
  exam3: {
    act: 3,
    title: '第三幕結業考',
    sections: [
      section('s1', 'listening', '聽力一', 16, { respond: 6 }, { talks: [3, 3, 2, 2] }),
      section('s2', 'listening', '聽力二', 12, {}, { talks: [3, 3, 2, 2, 2] }),
      section(
        's3',
        'reading',
        '閱讀一',
        18,
        { grammarPick: 6, grammarFill: 6 },
        { textFills: [3, 3] },
      ),
      section('s4', 'reading', '閱讀二', 10, {}, { passages: [3, 3, 2, 2] }),
    ],
  },
  exam4: {
    act: 4,
    title: '第四幕結業考',
    sections: [
      section('s1', 'listening', '聽力一', 19, { respond: 9 }, { pictures: 4, talks: [3, 3] }),
      section('s2', 'listening', '聽力二', 21, {}, { talks: [3, 3, 3, 3, 3, 3, 3] }),
      section(
        's3',
        'reading',
        '閱讀一',
        22,
        { grammarPick: 7, grammarFill: 7 },
        { textFills: [4, 4] },
      ),
      section('s4', 'reading', '閱讀二', 9, {}, { passages: [3, 3, 3] }),
      // One double-passage set (4 questions) and one triple-passage set (5).
      section('s5', 'reading', '閱讀三', 9, {}, { passages: [4, 5] }),
    ],
  },
};

/** Sum of the numbers in a count list (0 for none). */
const sum = (list: readonly number[] | undefined): number =>
  (list ?? []).reduce((total, n) => total + n, 0);

/** Hand-written questions in one form of a section (what validateExam checks). */
export function writtenQuestionCount(written: WrittenCounts): number {
  return (
    (written.pictures ?? 0) + sum(written.talks) + sum(written.passages) + sum(written.textFills)
  );
}

/** Whether a section has a data file: only a section with hand-written questions does. */
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
