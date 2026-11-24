import { computeLayout, type Layout } from '../layout';
import type { TaskOutcome } from '../learning/sessionPlan';
import {
  createEmptySave,
  loadSave,
  mergeSaves,
  resolveNow,
  saveKeyFor,
  writeSave,
  type SaveData,
} from './save';
import { importedSave, type ImportMode } from './saveCode';
import { settingsStore, type Settings } from './settings';
import { STORAGE_KEYS } from './storageKeys';
import { createStore } from './store';

type Screen =
  | 'title'
  | 'town'
  | 'task'
  | 'review'
  | 'sprint'
  | 'listen'
  | 'progress'
  | 'exam'
  | 'skip'
  | 'grammar'
  | 'result';

/** What the result screen shows after a task, a daily review, a 單字快練 round or a 文法快練 round. */
interface ResultData {
  kind: 'task' | 'review' | 'sprint' | 'grammar';
  unitId?: string;
  taskId?: string;
  outcome: TaskOutcome;
  /** Coins earned this round (already added to the save). */
  coins: number;
}

export interface AppState {
  screen: Screen;
  layout: Layout;
  save: SaveData;
  /** The task being played, as `${unitId}/${taskId}` parts. */
  activeTask?: { unitId: string; taskId: string };
  /** The Act (1 to 4) whose 結業考 is open on the exam screen. */
  activeExam?: number;
  /** The Act (1 to 3) whose 跳級考 is open on the skip screen. */
  activeSkip?: number;
  /**
   * What the town shows: an act (index into ACTS) and, when a location is open,
   * its unit. Unset until the player picks one; the town then opens on the act
   * with the task to continue.
   */
  town?: { act: number; unitId?: string; picking?: boolean };
  result?: ResultData;
  /** The last write to localStorage failed; cleared by the next one that works. */
  saveError?: boolean;
}

/**
 * The stage box (the window less the notch and rounded sides, styles.css), else the window.
 * Until styles.css is in, #stage is a plain block inside the body's margin: use the window.
 */
function measure(): Layout {
  const stage = typeof document === 'undefined' ? null : document.getElementById('stage');
  const placed = stage !== null && getComputedStyle(stage).position === 'fixed';
  const w = placed ? stage.clientWidth : window.innerWidth;
  const h = placed ? stage.clientHeight : window.innerHeight;
  return computeLayout(w, h, window.devicePixelRatio || 1);
}

/** The app's clock. `?debugDate=YYYY-MM-DD` shifts the date for testing reviews. */
export function currentNow(): Date {
  return resolveNow(window.location.search, new Date());
}

function readStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** `?debugDate` plays on a separate save so the real one (and its streak) stays untouched. */
const saveKey = saveKeyFor(window.location.search);

/** The save text this tab last read or wrote; anything else in storage came from another tab. */
let lastSynced: string | null = null;

function readStored(storage: Storage): string | null {
  try {
    return storage.getItem(saveKey);
  } catch {
    return null;
  }
}

function initialSave(): SaveData {
  const storage = readStorage();
  const now = currentNow();
  if (!storage) return createEmptySave(now);
  lastSynced = readStored(storage);
  return loadSave(storage, now, saveKey);
}

export const appStore = createStore<AppState>({
  screen: 'title',
  layout: measure(),
  save: initialSave(),
});

type DayStamp = (save: SaveData, now: Date) => SaveData;

/** Writes today's line of `history` into each save (set by the UI, which knows the town). */
let stampDay: DayStamp = (save) => save;

export function setDayStamp(stamp: DayStamp): void {
  stampDay = stamp;
}

/**
 * Stores the new save in memory and in localStorage. Call after every answer.
 * If another tab wrote since we last synced, the two saves are merged per item
 * instead of one overwriting the other. Today's history line is brought up to date.
 */
export function commitSave(save: SaveData): void {
  const storage = readStorage();
  const now = currentNow();
  let next = save;
  if (storage) {
    const stored = readStored(storage);
    if (stored !== null && stored !== lastSynced) {
      next = mergeSaves(save, loadSave(storage, now, saveKey));
    }
  }
  next = stampDay(next, now);
  appStore.set({ save: next });
  persist(storage, next);
}

/** Writes the save; a failure (or no storage at all) raises `saveError` until a write works. */
function persist(storage: Storage | null, save: SaveData): void {
  const ok = storage !== null && writeSave(storage, save, saveKey);
  if (ok) lastSynced = readStored(storage);
  if (ok === !!appStore.get().saveError) appStore.set({ saveError: !ok });
}

/**
 * Another tab saved: merge its progress into ours so neither undoes the other.
 * The other tab is the one just played, so its save leads (its route, its exam run).
 * A cleared storage (key null, or our key gone) keeps what we have and writes it back.
 */
function onStorage(event: StorageEvent): void {
  if (event.key !== saveKey && event.key !== null) return;
  const storage = readStorage();
  if (!storage) return;
  const stored = readStored(storage);
  const memory = appStore.get().save;
  if (event.key === null || stored === null) {
    persist(storage, memory);
    return;
  }
  lastSynced = stored;
  appStore.set({ save: mergeSaves(loadSave(storage, currentNow(), saveKey), memory) });
}

/**
 * Writes a save read from a save code. 合併 merges it into the current progress;
 * 完全取代 replaces it, and only then are the code's settings applied too. The raw
 * save as it was is kept under STORAGE_KEYS.preImportSave first. Returns the new save.
 */
export function applyImport(
  imported: SaveData,
  settings: Settings | undefined,
  mode: ImportMode,
): SaveData {
  const storage = readStorage();
  if (storage) {
    const before = readStored(storage);
    try {
      if (before !== null) storage.setItem(STORAGE_KEYS.preImportSave, before);
    } catch {
      // no room for the backup; the import still goes ahead
    }
    // 完全取代 must not be merged with what another tab wrote meanwhile.
    if (mode === 'replace') lastSynced = before;
  }
  commitSave(importedSave(appStore.get().save, imported, mode));
  if (mode === 'replace' && settings) settingsStore.set(settings);
  return appStore.get().save;
}

/**
 * 重置進度 (設定): an empty save in place of this device's progress. The old save is kept
 * under STORAGE_KEYS.preImportSave first (as before a 完全取代 import), and it is not merged
 * with what is stored. Settings (voices, 中文, ...) stay as they are.
 */
export function resetProgress(): void {
  const storage = readStorage();
  if (storage) {
    const before = readStored(storage);
    try {
      if (before !== null) storage.setItem(STORAGE_KEYS.preImportSave, before);
    } catch {
      // no room for the backup; the reset still goes ahead
    }
    lastSynced = before;
  }
  appStore.set({
    town: undefined,
    activeTask: undefined,
    activeExam: undefined,
    activeSkip: undefined,
    result: undefined,
  });
  commitSave(createEmptySave(currentNow()));
}

window.addEventListener('storage', onStorage);

export function remeasureLayout(): Layout {
  const layout = measure();
  appStore.set({ layout });
  return layout;
}

/** Whether a save is kept from before the last 完全取代 import or 重置進度. */
export function hasBackup(): boolean {
  const storage = readStorage();
  try {
    return !!storage?.getItem(STORAGE_KEYS.preImportSave);
  } catch {
    return false;
  }
}

/**
 * 還原上一次的進度 (設定): the save kept before the last 完全取代 import or 重置進度 comes back,
 * and the progress it replaces becomes the backup, so a wrong press can be swapped back. Not
 * merged with what is stored. False when there is no backup or no storage.
 */
export function restoreBackup(): boolean {
  const storage = readStorage();
  if (!storage || !hasBackup()) return false;
  const restored = loadSave(storage, currentNow(), STORAGE_KEYS.preImportSave);
  const current = readStored(storage);
  try {
    if (current !== null) storage.setItem(STORAGE_KEYS.preImportSave, current);
    else storage.removeItem(STORAGE_KEYS.preImportSave);
  } catch {
    // the swap could not keep the current save; the restore still goes ahead
  }
  lastSynced = current;
  appStore.set({
    town: undefined,
    activeTask: undefined,
    activeExam: undefined,
    activeSkip: undefined,
    result: undefined,
  });
  commitSave(restored);
  return true;
}
