/**
 * The estimated TOEIC part score of an exam (docs/specs/curriculum.md): answers
 * weighted by difficulty, mapped through the Act's curve, with a range from the number
 * of questions and a personal offset from the player's ETS scores. Pure.
 *
 * Difficulty weighting is a one-parameter Rasch fit (the "simplified Rasch" of the plan).
 * A question of difficulty d in [0, 1] sits at b = (d - 0.5) * DIFFICULTY_SPAN on the
 * logit scale; the chance of a right answer for ability t is
 *   P = g + (1 - g) * sigmoid(t - b),  g = 1 / options.
 * The ability t is the one whose expected number right equals the number actually right,
 * so a right answer on a hard question lifts it more than one on an easy question, and
 * the same player reads about the same on an easy set as on a hard one. The
 * guess-corrected proportion for a question of middle difficulty, adj = sigmoid(t),
 * then goes through the curve: adj 0.7 is the target T, adj 1 the cap C.
 */
import type { SectionKind } from '../content/exam';
import { dateKey, type Checkpoint, type SaveData } from '../core/save';

/** An estimate with its range, each rounded to 5. */
export interface ExamEstimate {
  score: number;
  low: number;
  high: number;
}

/** One answered question as the estimate needs it. */
export interface ScoredAnswer {
  correct: boolean;
  /** Options on the question (the chance of a guess is 1 / options). */
  options: number;
  /** 0 (easy) to 1 (hard). */
  difficulty: number;
}

type Act = 1 | 2 | 3 | 4;

/** Target (T: about 78% of four-option questions) and cap (C: all right) of each part. */
const CURVE: Record<Act, Record<SectionKind, readonly [target: number, cap: number]>> = {
  1: { listening: [110, 150], reading: [115, 150] },
  2: { listening: [190, 215], reading: [185, 210] },
  3: { listening: [240, 275], reading: [235, 265] },
  4: { listening: [310, 360], reading: [290, 340] },
};

/** Logit distance between the easiest (0) and the hardest (1) question. */
const DIFFICULTY_SPAN = 4;
/** Ability is kept within +-ABILITY_LIMIT; the range is read at +-RANGE_LIMIT at most. */
const ABILITY_LIMIT = 6;
const RANGE_LIMIT = 2.5;
/** Where on the adj scale the curve passes the target. */
const KNEE = 0.7;
/** The most the personal calibration moves a score. */
export const OFFSET_LIMIT = 50;

const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x));
const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const guessChance = (answer: ScoredAnswer): number => 1 / Math.max(2, answer.options);
const level = (answer: ScoredAnswer): number =>
  (clamp(answer.difficulty, 0, 1) - 0.5) * DIFFICULTY_SPAN;

/** The chance of a right answer for ability `t`. */
function chance(answer: ScoredAnswer, t: number): number {
  const g = guessChance(answer);
  return g + (1 - g) * sigmoid(t - level(answer));
}

/** The ability whose expected right answers equal the right answers given (bisection). */
function ability(answers: readonly ScoredAnswer[]): number {
  const right = answers.filter((a) => a.correct).length;
  const expected = (t: number) => answers.reduce((sum, a) => sum + chance(a, t), 0);
  let lo = -ABILITY_LIMIT;
  let hi = ABILITY_LIMIT;
  if (expected(lo) >= right) return lo;
  if (expected(hi) <= right) return hi;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (expected(mid) < right) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * One standard error of the ability, from the information of the questions
 * (the inverse root of the summed P'^2 / (P (1 - P))); read at an ability held within
 * +-RANGE_LIMIT so that a perfect run on a short exam still shows a range.
 */
function abilityError(answers: readonly ScoredAnswer[], t: number): number {
  const at = clamp(t, -RANGE_LIMIT, RANGE_LIMIT);
  let info = 0;
  for (const a of answers) {
    const g = guessChance(a);
    const s = sigmoid(at - level(a));
    const p = g + (1 - g) * s;
    const slope = (1 - g) * s * (1 - s);
    info += (slope * slope) / (p * (1 - p));
  }
  return 1 / Math.sqrt(info);
}

/** The curve: ability to score before the offset and rounding. */
function curve(t: number, target: number, cap: number): number {
  const adj = sigmoid(t);
  return adj <= KNEE
    ? 5 + ((target - 5) * adj) / KNEE
    : target + ((cap - target) * (adj - KNEE)) / (1 - KNEE);
}

/**
 * The estimate for one part (聽力 or 閱讀); `offset` is the calibration for that part.
 * The range is the score at ability +-1 standard error (about two in three sittings of
 * the same player land inside; wider would swallow every short exam). With few
 * questions it widens; with none the score is 5 and so is the range.
 */
export function examScore(
  act: Act,
  kind: SectionKind,
  answers: readonly ScoredAnswer[],
  offset = 0,
): ExamEstimate {
  if (answers.length === 0) return { score: 5, low: 5, high: 5 };
  const [target, cap] = CURVE[act][kind];
  const shift = clamp(Number.isFinite(offset) ? offset : 0, -OFFSET_LIMIT, OFFSET_LIMIT);
  const t = ability(answers);
  const se = abilityError(answers, t);
  /** A perfect or all-wrong run is read at the edge of what the range can say. */
  const centre = clamp(t, -RANGE_LIMIT, RANGE_LIMIT);
  const round = (value: number): number => clamp(Math.round((value + shift) / 5) * 5, 5, cap);
  return {
    score: round(curve(t, target, cap)),
    low: round(curve(Math.max(-ABILITY_LIMIT, Math.min(t, centre - se)), target, cap)),
    high: round(curve(Math.min(ABILITY_LIMIT, Math.max(t, centre + se)), target, cap)),
  };
}

/** The window in which an exam estimate and an ETS score count as a pair. */
export const PAIR_DAYS = 14;

const dayNumber = (key: string): number => {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1) / 86_400_000;
};

/**
 * The offset to add to an exam estimate of `kind`: each exam entry is paired with the
 * nearest ETS entry (`checkpoints` without `source`) within PAIR_DAYS; the offset is half
 * the mean of (ETS - estimate), rounded to 5 and within +-50. Entries after `now` are
 * ignored, and so are retakes (`retake`: questions seen before, so the estimate reads
 * high); addExamCheckpoint keeps only the first sitting of a day per Act. The exam
 * entries should hold the estimate without any offset, or the correction is counted
 * twice.
 */
export function calibrationOffset(
  checkpoints: readonly Checkpoint[],
  exams: readonly Checkpoint[],
  kind: SectionKind,
  now: Date,
): { offset: number; pairs: number } {
  const today = dayNumber(dateKey(now));
  const ets = checkpoints
    .filter((c) => c.source === undefined && dayNumber(c.date) <= today)
    .map((c) => ({ day: dayNumber(c.date), score: c[kind] }));
  const gaps: number[] = [];
  for (const exam of exams) {
    if (exam.source !== 'exam' || exam.retake || dayNumber(exam.date) > today) continue;
    const day = dayNumber(exam.date);
    let best: { distance: number; score: number } | undefined;
    for (const entry of ets) {
      const distance = Math.abs(entry.day - day);
      if (distance <= PAIR_DAYS && (!best || distance < best.distance)) {
        best = { distance, score: entry.score };
      }
    }
    if (best) gaps.push(best.score - exam[kind]);
  }
  if (gaps.length === 0) return { offset: 0, pairs: 0 };
  const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const offset = clamp(Math.round(mean / 2 / 5) * 5, -OFFSET_LIMIT, OFFSET_LIMIT);
  return { offset: offset === 0 ? 0 : offset, pairs: gaps.length };
}

/** The save with `exams.calibration` worked out from its checkpoints (unchanged with no pair). */
export function updateCalibration(save: SaveData, now: Date): SaveData {
  const listening = calibrationOffset(save.checkpoints, save.checkpoints, 'listening', now);
  const reading = calibrationOffset(save.checkpoints, save.checkpoints, 'reading', now);
  const pairs = Math.max(listening.pairs, reading.pairs);
  if (pairs === 0) return save;
  return {
    ...save,
    exams: {
      ...save.exams,
      calibration: { listening: listening.offset, reading: reading.offset, pairs },
    },
  };
}
