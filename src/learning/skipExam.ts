/**
 * 跳級考: a short 結業考 a player with some English can sit for Acts 1 to 3 without
 * playing their tasks. Passing the one of Act N opens every Act up to N + 1
 * (`save.skipTo`). Its questions are a third or so of the hand-written exam items
 * (both forms, picked by the seed), so they need no new text or audio. It is kept apart
 * from the 幕結業考: no record in `save.exams`, no coins, no checkpoint; the answers only
 * feed the mistake tags.
 */
import { EXAM_PLAN, EXAM_PLAYS, READING_TIMER, sectionHasFile, type ExamId } from '../content/exam';
import { examFile } from '../content/exams';
import type { SaveData } from '../core/save';
import type { ExamSectionRun } from '../ui/exam/types';
import { logOutcomes, sectionQuestions, type ExamOutcome } from './exam';

/** Acts with a 跳級考: the last act opens nothing after it. */
export type SkipAct = 1 | 2 | 3;

export const isSkipAct = (act: number): act is SkipAct => act === 1 || act === 2 || act === 3;

/** Share of right answers that passes. */
export const SKIP_PASS = 0.8;

const examOf = (act: SkipAct): ExamId => `exam${act}`;

/**
 * The sections of a 跳級考, in the order of the full exam, each with about a third of its
 * items (pickWritten `short`). The reading countdown shrinks in step with the questions
 * (whole half-minutes, at least one minute). Deterministic for a seed.
 */
export function skipSections(act: SkipAct, seed: number): ExamSectionRun[] {
  const exam = examOf(act);
  return EXAM_PLAN[exam].sections.flatMap((plan) => {
    const file = sectionHasFile(plan) ? examFile(exam, plan.id) : undefined;
    const items = sectionQuestions(file, seed, { section: plan.id, form: 'short' });
    if (items.length === 0) return [];
    const timer = READING_TIMER[exam];
    const seconds = Math.max(60, Math.ceil((timer.seconds * items.length) / plan.total / 30) * 30);
    return [
      {
        exam,
        id: plan.id,
        kind: plan.kind,
        title: plan.title,
        items,
        plays: EXAM_PLAYS[exam],
        ...(plan.kind === 'reading' ? { timer: { ...timer, seconds } } : {}),
      },
    ];
  });
}

/** Right answers needed to pass out of `total`. */
export const skipNeeded = (total: number): number => Math.ceil(total * SKIP_PASS - 1e-9);

export interface SkipSummary {
  correct: number;
  total: number;
  passed: boolean;
}

/** Opens every act up to `act + 1` (skipTo only ever grows). */
export function passSkip(save: SaveData, act: SkipAct): SaveData {
  return (save.skipTo ?? 0) >= act ? save : { ...save, skipTo: act };
}

/** Closes a 跳級考: logs the answers' mistake tags, and opens the next act when it passed. */
export function finishSkip(
  save: SaveData,
  act: SkipAct,
  outcomes: readonly ExamOutcome[],
  now: Date,
): { save: SaveData; summary: SkipSummary } {
  const correct = outcomes.reduce((n, o) => n + o.correct, 0);
  const total = outcomes.reduce((n, o) => n + o.total, 0);
  const passed = total > 0 && correct >= skipNeeded(total);
  let next = logOutcomes(save, outcomes, now);
  if (passed) next = passSkip(next, act);
  return { save: next, summary: { correct, total, passed } };
}
