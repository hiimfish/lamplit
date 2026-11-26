/**
 * The first-visit questions (WelcomeScreen, 2026-11-26): the player's level, then 一般 or
 * 衝刺, then a last page with the 介面語言 that fits the level and what happens next. The
 * level only decides which 跳級考 is offered and the language suggested; nothing opens
 * without passing the exam.
 *
 * The game's four acts run A1 to B1 (多益 600). So A1 starts at Act 1, A2 is offered the
 * Act 1 跳級考 (it opens Act 2), B1 the Act 2 one, and B2 the Act 3 one. B2 is told the
 * game may be easy; C1 and above is told plainly that it is below their level, and may
 * still go in the same way as B2.
 */
import type { SaveData } from '../core/save';
import type { Level, Settings, UiLang } from '../core/settings';
import type { SkipAct } from './skipExam';

export interface LevelPlan {
  /** The 跳級考 offered; undefined starts at Act 1 without one. */
  skip?: SkipAct;
  /** The 介面語言 suggested. */
  uiLang: UiLang;
  /** How well the game fits: `easy` (B2) and `beyond` (C1 and above) show a note. */
  fit: 'good' | 'easy' | 'beyond';
}

export const LEVEL_PLAN: Record<Level, LevelPlan> = {
  a1: { uiLang: 'zh', fit: 'good' },
  a2: { skip: 1, uiLang: 'zh', fit: 'good' },
  b1: { skip: 2, uiLang: 'en', fit: 'good' },
  b2: { skip: 3, uiLang: 'en', fit: 'easy' },
  c1: { skip: 3, uiLang: 'en', fit: 'beyond' },
};

/**
 * Whether the first-visit questions show: never answered, and nothing played or opened yet
 * (a player from before the questions existed is not asked).
 */
export function shouldOnboard(
  settings: Pick<Settings, 'onboarded'>,
  save: Pick<SaveData, 'tasks' | 'skipTo'>,
): boolean {
  return !settings.onboarded && Object.keys(save.tasks).length === 0 && (save.skipTo ?? 0) === 0;
}

/**
 * After a failed 跳級考 of Act `act`: the easier one to offer instead, when the act it
 * was for is still locked (so 「先玩這一幕」 is not possible). `actOpen` tells whether an
 * act (1-based) is open.
 */
export function easierSkip(act: SkipAct, actOpen: (act: number) => boolean): SkipAct | undefined {
  if (act === 1 || actOpen(act)) return undefined;
  return (act - 1) as SkipAct;
}
