/**
 * 介面語言 (設定 → 顯示): the game's own words in Chinese (as designed) or English. Each
 * place keeps both wordings side by side: t('開始', 'Start'). The app remounts when the
 * language changes (App.tsx), so plain calls during render are enough.
 *
 * In English, Chinese translations of the English being learned are hidden too
 * (showZhNow); notes that only exist in Chinese (grammar notes, word meanings) stay.
 */
import { settingsStore } from './settings';

export function isEnglish(): boolean {
  return settingsStore.get().uiLang === 'en';
}

/** The Chinese or the English wording, by 介面語言. */
export function t(zh: string, en: string): string {
  return isEnglish() ? en : zh;
}

/** 中文 translations on: the setting, and never in the English interface. */
export function showZhNow(showZh: boolean): boolean {
  return showZh && !isEnglish();
}
