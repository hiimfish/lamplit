import { describe, expect, it } from 'vitest';
import {
  LEGACY_KEYS,
  STORAGE_KEYS,
  migrateStorageKeys,
  type MigrationStorage,
} from '../src/core/storageKeys';

const OLD_SAVE = 'pixel-english-town.save.v1';
const OLD_SETTINGS = 'pixel-english-town.settings.v1';

/** In-memory storage; `failSet` / `failRemove` make those calls throw for the listed keys. */
function fakeStorage(
  initial: Record<string, string> = {},
  fail: { set?: string[]; remove?: string[]; garble?: string[] } = {},
): MigrationStorage & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      if (fail.set?.includes(key)) throw new Error('quota');
      data.set(key, fail.garble?.includes(key) ? value.slice(1) : value);
    },
    removeItem: (key) => {
      if (fail.remove?.includes(key)) throw new Error('nope');
      data.delete(key);
    },
  };
}

describe('migrateStorageKeys', () => {
  it('moves an old key to its new name and removes the old one', () => {
    const storage = fakeStorage({ [OLD_SAVE]: '{"coins":5}', [OLD_SETTINGS]: '{}' });
    expect(migrateStorageKeys(storage)).toBe(true);
    expect(storage.data.get(STORAGE_KEYS.save)).toBe('{"coins":5}');
    expect(storage.data.get(STORAGE_KEYS.settings)).toBe('{}');
    expect(storage.data.has(OLD_SAVE)).toBe(false);
    expect(storage.data.has(OLD_SETTINGS)).toBe(false);
    expect(storage.data.get(STORAGE_KEYS.migrated)).toBe('1');
  });

  it('keeps the new key when both exist, and removes the old one', () => {
    const storage = fakeStorage({ [OLD_SAVE]: 'old', [STORAGE_KEYS.save]: 'new' });
    expect(migrateStorageKeys(storage)).toBe(true);
    expect(storage.data.get(STORAGE_KEYS.save)).toBe('new');
    expect(storage.data.has(OLD_SAVE)).toBe(false);
  });

  it('keeps the old key when the write throws, and does not set the flag', () => {
    const storage = fakeStorage({ [OLD_SAVE]: 'old' }, { set: [STORAGE_KEYS.save] });
    expect(migrateStorageKeys(storage)).toBe(false);
    expect(storage.data.get(OLD_SAVE)).toBe('old');
    expect(storage.data.has(STORAGE_KEYS.migrated)).toBe(false);
  });

  it('keeps the old key when the copy does not read back the same', () => {
    const storage = fakeStorage({ [OLD_SAVE]: 'old' }, { garble: [STORAGE_KEYS.save] });
    expect(migrateStorageKeys(storage)).toBe(false);
    expect(storage.data.get(OLD_SAVE)).toBe('old');
  });

  it('moves the other keys when one fails, and retries the failed one next time', () => {
    const initial = { [OLD_SAVE]: 'save', [OLD_SETTINGS]: 'settings' };
    const broken = fakeStorage(initial, { remove: [OLD_SAVE] });
    expect(migrateStorageKeys(broken)).toBe(false);
    expect(broken.data.get(STORAGE_KEYS.settings)).toBe('settings');
    expect(broken.data.has(OLD_SETTINGS)).toBe(false);
    expect(broken.data.has(STORAGE_KEYS.migrated)).toBe(false);

    // Next launch, storage works again: the copy is already there, the old key goes.
    const next = fakeStorage(Object.fromEntries(broken.data));
    expect(migrateStorageKeys(next)).toBe(true);
    expect(next.data.get(STORAGE_KEYS.save)).toBe('save');
    expect(next.data.has(OLD_SAVE)).toBe(false);
  });

  it('is idempotent', () => {
    const storage = fakeStorage({ [OLD_SAVE]: 'a' });
    migrateStorageKeys(storage);
    const after = new Map(storage.data);
    expect(migrateStorageKeys(storage)).toBe(true);
    expect(storage.data).toEqual(after);
  });

  it('sets the flag on a fresh browser and handles no storage', () => {
    const storage = fakeStorage();
    expect(migrateStorageKeys(storage)).toBe(true);
    expect([...storage.data.keys()]).toEqual([STORAGE_KEYS.migrated]);
    expect(migrateStorageKeys(null)).toBe(false);
  });

  it('puts every key under lamplit.', () => {
    for (const key of Object.values(STORAGE_KEYS)) expect(key.startsWith('lamplit.')).toBe(true);
    for (const [, key] of LEGACY_KEYS) expect(Object.values(STORAGE_KEYS)).toContain(key);
  });
});
