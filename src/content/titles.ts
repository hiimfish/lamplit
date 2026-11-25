/**
 * Titles in the current 介面語言 (src/core/i18n.ts): places, tasks and acts carry an English
 * title next to the Chinese one; a missing English title falls back to the Chinese.
 */
import { isEnglish } from '../core/i18n';
import type { Act, ActPlace } from './acts';
import type { Task, Unit } from './types';

export function unitTitle(unit: Pick<Unit, 'title' | 'titleEn'>): string {
  return isEnglish() ? unit.titleEn || unit.title : unit.title;
}

export function taskTitle(task: Pick<Task, 'title' | 'titleEn'>): string {
  return isEnglish() ? (task.titleEn ?? task.title) : task.title;
}

export function placeTitle(place: Pick<ActPlace, 'title' | 'titleEn'>): string {
  return isEnglish() ? (place.titleEn ?? place.title) : place.title;
}

export function actTitle(act: Pick<Act, 'title' | 'titleEn'>): string {
  return isEnglish() ? (act.titleEn ?? act.title) : act.title;
}

const ACT_DIGITS: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4 };

/** 第一幕 / Act 1, from the act's Chinese numeral (Act.no) or its number. */
export function actName(no: string | number): string {
  const n = typeof no === 'number' ? no : (ACT_DIGITS[no] ?? 0);
  const zh = typeof no === 'number' ? (['一', '二', '三', '四'][no - 1] ?? String(no)) : no;
  return isEnglish() ? `Act ${n}` : `第${zh}幕`;
}
