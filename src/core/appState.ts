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
import { createStore } from './store';

type Screen = 'title' | 'town' | 'task' | 'review' | 'sprint' | 'goal' | 'listen' | 'result';

/** What the result screen shows after a task, a daily review or a 單字快練 round. */
interface ResultData {
  kind: 'task' | 'review' | 'sprint';
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
  /**
   * What the town shows: an act (index into ACTS) and, when a location is open,
   * its unit. Unset until the player picks one; the town then opens on the act
   * with the task to continue.
   */
  town?: { act: number; unitId?: string };
  result?: ResultData;
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
  if (storage && writeSave(storage, next, saveKey)) lastSynced = readStored(storage);
}

/** Another tab saved: pick up its progress so our next write does not undo it. */
function onStorage(event: StorageEvent): void {
  if (event.key !== saveKey && event.key !== null) return;
  const storage = readStorage();
  if (!storage) return;
  lastSynced = readStored(storage);
  appStore.set({ save: loadSave(storage, currentNow(), saveKey) });
}

window.addEventListener('storage', onStorage);

export function remeasureLayout(): Layout {
  const layout = measure();
  appStore.set({ layout });
  return layout;
}
