import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  attachPersistence,
  loadSettings,
  sanitizeSettings,
  saveSettings,
  type Settings,
  type SettingsStorage,
  devUnlockAll,
} from '../src/core/settings';
import { createStore } from '../src/core/store';

function fakeStorage(initial: Record<string, string> = {}): SettingsStorage & {
  data: Record<string, string>;
} {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value;
    },
  };
}

describe('sanitizeSettings', () => {
  it('keeps valid values', () => {
    const s: Settings = {
      voiceMode: 'chirp',
      musicVolume: 0.1,
      voiceVolume: 0.2,
      sfxVolume: 0.3,
      showZh: false,
      textSize: 'xlarge',
      enSize: 'medium',
      uiLang: 'en',
      unlockAll: true,
      seenIntro: true,
    };
    expect(sanitizeSettings(s)).toEqual(s);
  });

  it('falls back for an unknown 文字大小, 英文大小 or 介面語言', () => {
    const s = sanitizeSettings({ textSize: 'huge', enSize: 'tiny', uiLang: 'fr' });
    expect(s.textSize).toBe('medium');
    expect(s.enSize).toBe('large');
    expect(s.uiLang).toBe('zh');
  });

  it('gives settings saved before 英文大小 existed the larger English', () => {
    expect(sanitizeSettings({ textSize: 'large' }).enSize).toBe('large');
  });

  it('clamps volumes to 0-1', () => {
    const s = sanitizeSettings({ musicVolume: 5, voiceVolume: -2, sfxVolume: 0.5 });
    expect(s.musicVolume).toBe(1);
    expect(s.voiceVolume).toBe(0);
    expect(s.sfxVolume).toBe(0.5);
  });

  it('rejects unknown voice modes and bad types', () => {
    const s = sanitizeSettings({
      voiceMode: 'robot',
      musicVolume: 'loud',
      sfxVolume: NaN,
      showZh: 'yes',
      unlockAll: 1,
      seenIntro: 'no',
    });
    expect(s).toEqual(DEFAULT_SETTINGS);
  });

  it('seenIntro: false by default (older saves have none), kept when it is a boolean', () => {
    expect(DEFAULT_SETTINGS.seenIntro).toBe(false);
    expect(sanitizeSettings({ showZh: true }).seenIntro).toBe(false);
    expect(sanitizeSettings({ seenIntro: true }).seenIntro).toBe(true);
    expect(sanitizeSettings({ seenIntro: 1 }).seenIntro).toBe(false);
  });

  it('falls back to defaults for non-objects', () => {
    for (const bad of [null, 7, 'x', [], undefined]) {
      expect(sanitizeSettings(bad)).toEqual(DEFAULT_SETTINGS);
    }
  });
});

describe('loadSettings / saveSettings', () => {
  it('returns defaults with no storage or empty storage', () => {
    expect(loadSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(loadSettings(fakeStorage())).toEqual(DEFAULT_SETTINGS);
  });

  it('does not throw on corrupt JSON', () => {
    expect(loadSettings(fakeStorage({ [SETTINGS_KEY]: '{not json' }))).toEqual(DEFAULT_SETTINGS);
  });

  it('does not throw when storage throws', () => {
    const throwing: SettingsStorage = {
      getItem() {
        throw new Error('blocked');
      },
      setItem() {
        throw new Error('blocked');
      },
    };
    expect(loadSettings(throwing)).toEqual(DEFAULT_SETTINGS);
    expect(saveSettings(throwing, DEFAULT_SETTINGS)).toBe(false);
  });

  it('round-trips', () => {
    const storage = fakeStorage();
    const s = { ...DEFAULT_SETTINGS, voiceMode: 'chirp' as const, musicVolume: 0.9 };
    expect(saveSettings(storage, s)).toBe(true);
    expect(loadSettings(storage)).toEqual(s);
  });

  it('uses the documented key', () => {
    expect(SETTINGS_KEY).toBe('lamplit.settings.v1');
  });
});

describe('attachPersistence', () => {
  it('saves on every change and stops after unsubscribe', () => {
    const storage = fakeStorage();
    const store = createStore<Settings>({ ...DEFAULT_SETTINGS });
    const stop = attachPersistence(store, storage);
    store.set({ sfxVolume: 0.25 });
    expect(loadSettings(storage).sfxVolume).toBe(0.25);
    store.set({ showZh: false });
    expect(loadSettings(storage).showZh).toBe(false);
    stop();
    store.set({ sfxVolume: 0.9 });
    expect(loadSettings(storage).sfxVolume).toBe(0.25);
  });
});

describe('DEFAULT_SETTINGS', () => {
  it('defaults to the Chirp voice and a lower music level', () => {
    expect(DEFAULT_SETTINGS.voiceMode).toBe('chirp');
    expect(DEFAULT_SETTINGS.musicVolume).toBe(0.25);
  });
});

describe('devUnlockAll', () => {
  it('opens every task only when dev mode is on, on the dev server', () => {
    expect(devUnlockAll({ unlockAll: true }, true)).toBe(true);
    expect(devUnlockAll({ unlockAll: false }, true)).toBe(false);
    // A build ignores a saved unlockAll.
    expect(devUnlockAll({ unlockAll: true }, false)).toBe(false);
  });

  it('is off by default', () => {
    expect(DEFAULT_SETTINGS.unlockAll).toBe(false);
  });
});
