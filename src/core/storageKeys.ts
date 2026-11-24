/**
 * Every localStorage key the game uses, in one place, under the `lamplit.` prefix.
 * Keys from before the rename are moved over once by migrateStorageKeys (run from boot.ts).
 */
export const STORAGE_KEYS = {
  save: 'lamplit.save.v1',
  /** Used while `?debugDate` is set, so time-travel testing never touches the real save. */
  debugSave: 'lamplit.save.v1.debug',
  settings: 'lamplit.settings.v1',
  recognitionNoteSeen: 'lamplit.recognitionNoteSeen',
  /** The raw text of a save that could not be parsed, kept once so it is not lost. */
  corruptSave: 'lamplit.save.v1.corrupt',
  /** The raw save as it was just before the last import. */
  preImportSave: 'lamplit.save.v1.pre-import',
  /** ISO time of the last copy or download of the save code. */
  lastExport: 'lamplit.lastExport',
  /** Set once every old key has been moved. */
  migrated: 'lamplit.migrated',
} as const;

/** Old key to new key, for the move from the names used before Lamplit. */
export const LEGACY_KEYS: readonly (readonly [oldKey: string, newKey: string])[] = [
  ['pixel-english-town.save.v1', STORAGE_KEYS.save],
  ['pixel-english-town.save.v1.debug', STORAGE_KEYS.debugSave],
  ['pixel-english-town.settings.v1', STORAGE_KEYS.settings],
  ['english-learn.recognitionNoteSeen', STORAGE_KEYS.recognitionNoteSeen],
];

/** The slice of the Storage API the migration needs, so tests can pass a fake. */
export interface MigrationStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Moves one old key; true when nothing is left to do for it. Never throws. */
function migrateKey(storage: MigrationStorage, oldKey: string, newKey: string): boolean {
  try {
    const old = storage.getItem(oldKey);
    if (old === null) return true;
    if (storage.getItem(newKey) === null) {
      storage.setItem(newKey, old);
      // Only drop the old copy once the new one reads back the same.
      if (storage.getItem(newKey) !== old) return false;
    }
    storage.removeItem(oldKey);
    return storage.getItem(oldKey) === null;
  } catch {
    return false; // keep the old key; the next launch tries again
  }
}

/**
 * Moves every old key to its new name. A key already under the new name wins and
 * the old one is removed. Any failure keeps the old key for the next launch.
 * `lamplit.migrated` is set only when every pair is done. Returns whether it was.
 */
export function migrateStorageKeys(storage: MigrationStorage | null): boolean {
  if (!storage) return false;
  try {
    if (storage.getItem(STORAGE_KEYS.migrated) !== null) return true;
  } catch {
    return false;
  }
  let done = true;
  for (const [oldKey, newKey] of LEGACY_KEYS) {
    if (!migrateKey(storage, oldKey, newKey)) done = false;
  }
  if (!done) return false;
  try {
    storage.setItem(STORAGE_KEYS.migrated, '1');
    return true;
  } catch {
    return false;
  }
}

/** window.localStorage, or null where it is missing or blocked (access can throw). */
export function browserStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}
