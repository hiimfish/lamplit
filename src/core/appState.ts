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

type Screen = 'title' | 'town' | 'task' | 'review' | 'result';

/** What the result screen shows after a task or a daily review. */
interface ResultData {
  kind: 'task' | 'review';
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
  result?: ResultData;
}

function measure(): Layout {
  return computeLayout(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1);
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

/**
 * Stores the new save in memory and in localStorage. Call after every answer.
 * If another tab wrote since we last synced, the two saves are merged per item
 * instead of one overwriting the other.
 */
export function commitSave(save: SaveData): void {
  const storage = readStorage();
  let next = save;
  if (storage) {
    const stored = readStored(storage);
    if (stored !== null && stored !== lastSynced) {
      next = mergeSaves(save, loadSave(storage, currentNow(), saveKey));
    }
  }
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
