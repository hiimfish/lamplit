import type { VoiceMode } from '../audio/voices';
import { STORAGE_KEYS } from './storageKeys';
import { createStore, type Store } from './store';

export interface Settings {
  voiceMode: VoiceMode;
  /** 0 to 1 each. */
  musicVolume: number;
  voiceVolume: number;
  sfxVolume: number;
  /** Show Chinese translations next to English. */
  showZh: boolean;
  /** 文字大小: 中 (as designed), 大, 特大. Scales every text size (--text-scale). */
  textSize: TextSize;
  /**
   * 英文大小: the English being learned (lines, questions, words; marked lang="en") on top
   * of 文字大小 (--en-scale). The pixel font's Latin letters look smaller than its Chinese,
   * so English starts at 大.
   */
  enSize: TextSize;
  /** 介面語言: the game's own words in Chinese or English (src/core/i18n.ts). */
  uiLang: UiLang;
  /** Dev mode: every task in the town is open (see devUnlockAll). */
  unlockAll: boolean;
  /** The 怎麼玩 cards were shown once (or skipped); they open again only from 設定. */
  seenIntro: boolean;
}

export type TextSize = 'medium' | 'large' | 'xlarge';
export type UiLang = 'zh' | 'en';

/** How much each 文字大小 enlarges the text. */
export const TEXT_SCALE: Record<TextSize, number> = { medium: 1, large: 1.15, xlarge: 1.3 };

/** How much each 英文大小 enlarges the English, on top of 文字大小. */
export const EN_SCALE: Record<TextSize, number> = { medium: 1, large: 1.2, xlarge: 1.4 };

export const DEFAULT_SETTINGS: Settings = {
  voiceMode: 'chirp',
  musicVolume: 0.25,
  voiceVolume: 1,
  sfxVolume: 0.7,
  showZh: true,
  textSize: 'medium',
  enSize: 'large',
  uiLang: 'zh',
  unlockAll: false,
  seenIntro: false,
};

export const SETTINGS_KEY = STORAGE_KEYS.settings;

/** The slice of the Storage API we use, so tests can pass a fake. */
export interface SettingsStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const VOICE_MODES: readonly VoiceMode[] = ['neural2', 'chirp'];

function volumeOr(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(1, Math.max(0, value));
}

/** Turns any parsed JSON into valid settings: bad fields fall back to defaults. */
export function sanitizeSettings(raw: unknown): Settings {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { ...DEFAULT_SETTINGS };
  const r = raw as Record<string, unknown>;
  const voiceMode = VOICE_MODES.find((mode) => mode === r.voiceMode);
  return {
    voiceMode: voiceMode ?? DEFAULT_SETTINGS.voiceMode,
    musicVolume: volumeOr(r.musicVolume, DEFAULT_SETTINGS.musicVolume),
    voiceVolume: volumeOr(r.voiceVolume, DEFAULT_SETTINGS.voiceVolume),
    sfxVolume: volumeOr(r.sfxVolume, DEFAULT_SETTINGS.sfxVolume),
    showZh: typeof r.showZh === 'boolean' ? r.showZh : DEFAULT_SETTINGS.showZh,
    textSize:
      typeof r.textSize === 'string' && r.textSize in TEXT_SCALE
        ? (r.textSize as TextSize)
        : DEFAULT_SETTINGS.textSize,
    enSize:
      typeof r.enSize === 'string' && r.enSize in EN_SCALE
        ? (r.enSize as TextSize)
        : DEFAULT_SETTINGS.enSize,
    uiLang: r.uiLang === 'en' ? 'en' : 'zh',
    unlockAll: typeof r.unlockAll === 'boolean' ? r.unlockAll : DEFAULT_SETTINGS.unlockAll,
    seenIntro: typeof r.seenIntro === 'boolean' ? r.seenIntro : DEFAULT_SETTINGS.seenIntro,
  };
}

/**
 * Dev tools (the unlock-all switch) exist only on the dev server (npm run dev,
 * dev:https); a build ignores the saved setting, so players never see it.
 */
export const DEV_TOOLS = import.meta.env.DEV;

/** True when every task should be open: dev mode is on, on the dev server. */
export function devUnlockAll(settings: Pick<Settings, 'unlockAll'>, devTools = DEV_TOOLS): boolean {
  return devTools && settings.unlockAll;
}

/** Never throws: missing storage, missing key or corrupt JSON all give defaults. */
export function loadSettings(storage: SettingsStorage | null): Settings {
  if (!storage) return { ...DEFAULT_SETTINGS };
  try {
    const text = storage.getItem(SETTINGS_KEY);
    if (text === null) return { ...DEFAULT_SETTINGS };
    return sanitizeSettings(JSON.parse(text));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/** Returns false when the write failed (private mode, quota). */
export function saveSettings(storage: SettingsStorage | null, settings: Settings): boolean {
  if (!storage) return false;
  try {
    storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

/** Saves the store to storage on every change. Returns an unsubscribe function. */
export function attachPersistence(
  store: Store<Settings>,
  storage: SettingsStorage | null,
): () => void {
  return store.subscribe((settings) => {
    saveSettings(storage, settings);
  });
}

function browserStorage(): SettingsStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null; // access can throw when storage is blocked
  }
}

/**
 * The dev server always starts with the music at 0, so it doesn't play on every
 * reload while developing. The slider still works for the rest of the session.
 * Builds (npm run build) keep the saved volume.
 */
function initialSettings(): Settings {
  const loaded = loadSettings(browserStorage());
  return import.meta.env.DEV ? { ...loaded, musicVolume: 0 } : loaded;
}

export const settingsStore = createStore<Settings>(initialSettings());
attachPersistence(settingsStore, browserStorage());
