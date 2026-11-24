/**
 * Types the exam's screens and its learning code share (docs/specs/ui-flow.md,
 * 幕結業考). Types only, so src/learning/exam*.ts may import them too.
 */
import type { ExamId, ResponseMode, SectionKind } from '../../content/exam';
import type { Question } from '../../learning/questions';

/** One question of a section, as the runner shows it. */
export interface ExamItem {
  /** Unique in the exam; the key of the answers in `save.examRun`. */
  qid: string;
  /** A choice question (options with ids `o0`, `o1`, ...). */
  question: Question;
  /** Hand-written questions: the id counted in `save.exams[id].seen`. Generated ones have none. */
  seenId?: string;
  /** Difficulty, 0 (easy) to 1 (hard), for the weighted estimate (examScore). */
  difficulty: number;
  /** Questions of one conversation, talk or passage share a group; shown together. */
  group?: string;
}

/** A section ready to sit: its questions in order and how often a sound may be replayed. */
export interface ExamSectionRun {
  exam: ExamId;
  /** `s1`, `s2`, ... */
  id: string;
  kind: SectionKind;
  title: string;
  items: ExamItem[];
  /** Plays allowed per question (Infinity: no limit). */
  plays: number;
  /** How a 應答題 shows its options, when not the exam's own RESPONSE_MODE (跳級考: `audio`). */
  responseMode?: ResponseMode;
  /** Reading only: seconds on the countdown; `hard` ends the section when it runs out. */
  timer?: { seconds: number; hard: boolean };
}

/** The player's answer to one question; `null` choice means it was left blank. */
export interface ExamAnswer {
  qid: string;
  /** The chosen option id, e.g. `o2`. */
  choice: string | null;
}

/** A finished section: what was answered and how many were right. */
export interface ExamSectionResult {
  id: string;
  kind: SectionKind;
  answers: ExamAnswer[];
  total: number;
  correct: number;
}

/** What the runner passes to the listening and reading views. */
export interface ExamViewProps {
  /** The exam being sat: its RESPONSE_MODE decides how a 應答題 shows its options. */
  exam: ExamId;
  /** Overrides the exam's RESPONSE_MODE (the section's `responseMode`). */
  responseMode?: ResponseMode;
  item: ExamItem;
  /** The option id picked so far, or null. */
  choice: string | null;
  onChoose: (optionId: string) => void;
  /** Plays still allowed for this question (Infinity: no limit). */
  playsLeft: number;
  onPlayed: () => void;
}
