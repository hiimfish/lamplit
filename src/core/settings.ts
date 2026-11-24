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
  /** Dev mode: every task in the town is open (see devUnlockAll). */
  unlockAll: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  voiceMode: 'chirp',
  musicVolume: 0.25,
  voiceVolume: 1,
  sfxVolume: 0.7,
  showZh: true,
  unlockAll: false,
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
    unlockAll: typeof r.unlockAll === 'boolean' ? r.unlockAll : DEFAULT_SETTINGS.unlockAll,
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
