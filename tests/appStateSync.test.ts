import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmptySave, type SaveData } from '../src/core/save';

type AppState = typeof import('../src/core/appState');
let app: AppState;
let onStorage: (event: { key: string | null }) => void;
const data = new Map<string, string>();
let failWrites = false;

const SAVE_KEY = 'lamplit.save.v1';
const now = new Date();

// appState reads window (storage, size, listeners) when it loads: give it a small fake.
beforeAll(async () => {
  vi.stubGlobal('window', {
    location: { search: '' },
    innerWidth: 800,
    innerHeight: 600,
    devicePixelRatio: 1,
    localStorage: {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => {
        if (failWrites) throw new Error('quota');
        data.set(key, value);
      },
      removeItem: (key: string) => data.delete(key),
    },
    addEventListener: (type: string, listener: typeof onStorage) => {
      if (type === 'storage') onStorage = listener;
    },
  });
  app = await import('../src/core/appState');
});

beforeEach(() => {
  data.clear();
  failWrites = false;
});

const withCoins = (coins: number, cards: string[] = []): SaveData => {
  const save = { ...createEmptySave(now), coins };
  for (const id of cards) {
    save.cards[id] = {
      due: now.toISOString(),
      stability: 1,
      difficulty: 5,
      scheduled_days: 0,
      learning_steps: 0,
      reps: 1,
      lapses: 0,
      state: 1,
      last_review: now.toISOString(),
    };
  }
  return save;
};

describe('appState and other tabs', () => {
  it('merges another tab’s save into memory instead of replacing it', () => {
    app.appStore.set({ save: withCoins(10, ['mine']) });
    data.set(SAVE_KEY, JSON.stringify(withCoins(5, ['theirs'])));
    onStorage({ key: SAVE_KEY });
    const save = app.appStore.get().save;
    expect(Object.keys(save.cards).sort()).toEqual(['mine', 'theirs']);
    expect(save.coins).toBe(10);
  });

  it('keeps memory and writes it back when storage is cleared', () => {
    app.appStore.set({ save: withCoins(42, ['kept']) });
    onStorage({ key: null });
    expect(app.appStore.get().save.coins).toBe(42);
    expect(JSON.parse(data.get(SAVE_KEY)!).coins).toBe(42);
  });

  it('raises saveError when a write fails and clears it on the next one', () => {
    failWrites = true;
    app.commitSave(withCoins(1));
    expect(app.appStore.get().saveError).toBe(true);
    failWrites = false;
    app.commitSave(withCoins(2));
    expect(app.appStore.get().saveError).toBe(false);
  });

  it('keeps the old save before an import, and merges or replaces', () => {
    app.appStore.set({ save: withCoins(0) });
    app.commitSave(withCoins(30, ['here']));
    const before = data.get(SAVE_KEY);
    const merged = app.applyImport(withCoins(5, ['there']), undefined, 'merge');
    expect(data.get('lamplit.save.v1.pre-import')).toBe(before);
    expect(Object.keys(merged.cards).sort()).toEqual(['here', 'there']);
    expect(merged.coins).toBe(30);

    const replaced = app.applyImport(withCoins(5, ['there']), undefined, 'replace');
    expect(Object.keys(replaced.cards)).toEqual(['there']);
    expect(replaced.coins).toBe(5);
    expect(JSON.parse(data.get(SAVE_KEY)!).coins).toBe(5);
  });
});

describe('resetProgress (設定 → 重置進度)', () => {
  it('empties the save, keeps the old one as a backup, and does not merge it back', () => {
    app.commitSave(withCoins(30, ['here']));
    // Another tab wrote meanwhile: a plain commit would merge this progress back in.
    data.set(SAVE_KEY, JSON.stringify(withCoins(50, ['there'])));
    const before = data.get(SAVE_KEY);
    app.appStore.set({ town: { act: 2, picking: true } });
    app.resetProgress();
    const save = app.appStore.get().save;
    expect(save.coins).toBe(0);
    expect(save.cards).toEqual({});
    expect(save.tasks).toEqual({});
    expect(JSON.parse(data.get(SAVE_KEY)!).coins).toBe(0);
    expect(data.get('lamplit.save.v1.pre-import')).toBe(before);
    expect(app.appStore.get().town).toBeUndefined();
  });
});

describe('restoreBackup (設定 → 還原上一次的進度)', () => {
  it('has nothing to restore on a fresh device', () => {
    expect(app.hasBackup()).toBe(false);
    expect(app.restoreBackup()).toBe(false);
  });

  it('brings back the progress from before a reset, and can swap back again', () => {
    app.commitSave(withCoins(30, ['here']));
    app.resetProgress();
    expect(app.appStore.get().save.coins).toBe(0);
    expect(app.hasBackup()).toBe(true);

    expect(app.restoreBackup()).toBe(true);
    expect(app.appStore.get().save.coins).toBe(30);
    expect(Object.keys(app.appStore.get().save.cards)).toEqual(['here']);
    expect(JSON.parse(data.get(SAVE_KEY)!).coins).toBe(30);

    // The reset save is now the backup: a wrong press can be undone.
    expect(app.restoreBackup()).toBe(true);
    expect(app.appStore.get().save.coins).toBe(0);
  });
});
