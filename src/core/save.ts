import { newStoredCard, type StoredCard } from '../learning/scheduler';

/**
 * Versioned progress save. Every function is pure and takes `now`, so tests
 * (and ?debugDate) can simulate any day. Loading never throws.
 */
export const SAVE_KEY = 'pixel-english-town.save.v1';
/** Used while `?debugDate` is set, so time-travel testing never touches the real save. */
export const DEBUG_SAVE_KEY = `${SAVE_KEY}.debug`;
const SAVE_VERSION = 1;

interface TaskRecord {
  /** Best stars so far, 1 to 3. */
  stars: number;
  plays: number;
}

export interface DailyCounters {
  /** Local date, YYYY-MM-DD. */
  date: string;
  answered: number;
  correct: number;
  tasksDone: number;
  /** New words taught by 單字快練 today. */
  sprintNew: number;
  /** Answers given in 今日複習 today. */
  reviewed: number;
}

/**
 * 一般 or 衝刺 (docs/specs/sprint.md). `start` is the day 衝刺 was last chosen
 * (YYYY-MM-DD), kept when switching back to 一般; null if it never was.
 */
export interface Route {
  kind: 'normal' | 'sprint';
  start: string | null;
}

export interface SaveData {
  version: number;
  cards: Record<string, StoredCard>;
  /** Keyed by `${unitId}/${taskId}`. */
  tasks: Record<string, TaskRecord>;
  coins: number;
  streak: { count: number; lastDate: string | null };
  lastPlayedDate: string | null;
  daily: DailyCounters;
  route: Route;
}

/** The tiny part of localStorage we use, so tests can pass a fake. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar date as YYYY-MM-DD. */
export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function dayNumber(key: string): number {
  const [y = 0, m = 1, d = 1] = key.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
}

function daysBetween(fromKey: string, toKey: string): number {
  return dayNumber(toKey) - dayNumber(fromKey);
}

/**
 * The app's idea of "now". `?debugDate=YYYY-MM-DD` keeps the real time of day
 * but moves the calendar date, so tomorrow's review can be tested.
 */
export function resolveNow(search: string, real: Date): Date {
  const value = new URLSearchParams(search).get('debugDate');
  const match = value ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null;
  if (!match) return real;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    real.getHours(),
    real.getMinutes(),
    real.getSeconds(),
  );
  return Number.isNaN(date.getTime()) ? real : date;
}

function emptyDaily(now: Date): DailyCounters {
  return { date: dateKey(now), answered: 0, correct: 0, tasksDone: 0, sprintNew: 0, reviewed: 0 };
}

export function createEmptySave(now: Date): SaveData {
  return {
    version: SAVE_VERSION,
    cards: {},
    tasks: {},
    coins: 0,
    streak: { count: 0, lastDate: null },
    lastPlayedDate: null,
    daily: emptyDaily(now),
    route: { kind: 'normal', start: null },
  };
}

/** Today's counters; zeros if the saved ones are from another day. */
export function dailyFor(save: SaveData, now: Date): DailyCounters {
  return save.daily.date === dateKey(now) ? save.daily : emptyDaily(now);
}

/**
 * Streak to show: forgiving, so a missed day just reads as 0, nothing else is lost.
 * Only a gap of 0 or 1 days counts; a negative gap (clock moved back) does not.
 */
export function currentStreak(save: SaveData, now: Date): number {
  const last = save.streak.lastDate;
  if (!last) return 0;
  const gap = daysBetween(last, dateKey(now));
  return gap === 0 || gap === 1 ? save.streak.count : 0;
}

/**
 * Marks today as played and updates the streak. Safe to call many times a day.
 * Only a gap of exactly 1 day continues the streak; any other gap starts again at 1.
 */
export function touchPlayed(save: SaveData, now: Date): SaveData {
  const today = dateKey(now);
  const last = save.streak.lastDate;
  if (last === today) {
    return save.lastPlayedDate === today ? save : { ...save, lastPlayedDate: today };
  }
  const count = last && daysBetween(last, today) === 1 ? save.streak.count + 1 : 1;
  return {
    ...save,
    streak: { count, lastDate: today },
    lastPlayedDate: today,
    daily: dailyFor(save, now),
  };
}

/* ---------- validation / migration ---------- */

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const num = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const whole = (value: unknown): number => Math.max(0, Math.floor(num(value)));

const isDateKey = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

/** An ISO date-time as written by Date.toISOString (date, 'T', time), and a real date. */
const isIso = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value) &&
  !Number.isNaN(new Date(value).getTime());

const isFiniteNum = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isCount = (value: unknown): value is number =>
  isFiniteNum(value) && Number.isInteger(value) && value >= 0;

/**
 * A stored card whose fields are all in the ranges FSRS accepts, or null.
 * State is an integer 0-3 (new, learning, review, relearning); a studied card
 * (state > 0) needs difficulty 1-10 and stability > 0.
 */
function validCard(raw: unknown): StoredCard | null {
  if (!isObject(raw)) return null;
  const { state, stability, difficulty } = raw;
  if (!isCount(state) || state > 3) return null;
  if (!isFiniteNum(stability) || !isFiniteNum(difficulty)) return null;
  if (state > 0 && (stability <= 0 || difficulty < 1 || difficulty > 10)) return null;
  if (state === 0 && (stability < 0 || difficulty < 0 || difficulty > 10)) return null;
  if (!isCount(raw.reps) || !isCount(raw.lapses)) return null;
  if (!isIso(raw.due)) return null;
  if (raw.last_review !== undefined && !isIso(raw.last_review)) return null;
  const card: StoredCard = {
    due: raw.due,
    stability,
    difficulty,
    scheduled_days: Math.max(0, num(raw.scheduled_days)),
    learning_steps: whole(raw.learning_steps),
    reps: raw.reps,
    lapses: raw.lapses,
    state,
  };
  if (isFiniteNum(raw.elapsed_days)) card.elapsed_days = raw.elapsed_days;
  if (isIso(raw.last_review)) card.last_review = raw.last_review;
  return card;
}

/** A valid card as is; any other object becomes a fresh card (the item stays known). */
function sanitizeCard(raw: unknown, now: Date): StoredCard | null {
  if (!isObject(raw)) return null;
  return validCard(raw) ?? newStoredCard(now);
}

/** Turns anything (old version, hand-edited, corrupt) into a valid save. Never throws. */
export function sanitizeSave(raw: unknown, now: Date): SaveData {
  const save = createEmptySave(now);
  if (!isObject(raw)) return save;

  if (isObject(raw.cards)) {
    for (const [id, card] of Object.entries(raw.cards)) {
      const clean = sanitizeCard(card, now);
      if (clean) save.cards[id] = clean;
    }
  }
  if (isObject(raw.tasks)) {
    for (const [id, record] of Object.entries(raw.tasks)) {
      if (!isObject(record)) continue;
      const stars = Math.min(3, Math.max(1, Math.floor(num(record.stars, 1))));
      save.tasks[id] = { stars, plays: Math.max(1, whole(record.plays)) };
    }
  }
  save.coins = whole(raw.coins);
  if (isObject(raw.streak) && isDateKey(raw.streak.lastDate)) {
    save.streak = { count: whole(raw.streak.count), lastDate: raw.streak.lastDate };
  }
  save.lastPlayedDate = isDateKey(raw.lastPlayedDate) ? raw.lastPlayedDate : null;
  if (isObject(raw.daily) && isDateKey(raw.daily.date)) {
    save.daily = {
      date: raw.daily.date,
      answered: whole(raw.daily.answered),
      correct: whole(raw.daily.correct),
      tasksDone: whole(raw.daily.tasksDone),
      sprintNew: whole(raw.daily.sprintNew),
      reviewed: whole(raw.daily.reviewed),
    };
  }
  // Older saves have no route: they play the normal one.
  if (isObject(raw.route)) {
    save.route = {
      kind: raw.route.kind === 'sprint' ? 'sprint' : 'normal',
      start: isDateKey(raw.route.start) ? raw.route.start : null,
    };
    if (save.route.kind === 'sprint' && !save.route.start)
      save.route = { kind: 'normal', start: null };
  }
  return save;
}

/** The storage key for this page: `?debugDate` gets its own save. */
export function saveKeyFor(search: string): string {
  return new URLSearchParams(search).has('debugDate') ? DEBUG_SAVE_KEY : SAVE_KEY;
}

/**
 * Loads the save under `key`. The debug save starts as a copy of the real one
 * (read only), so ?debugDate can show tomorrow's real review.
 */
export function loadSave(storage: StorageLike, now: Date, key: string = SAVE_KEY): SaveData {
  try {
    let text = storage.getItem(key);
    if (!text && key === DEBUG_SAVE_KEY) text = storage.getItem(SAVE_KEY);
    if (!text) return createEmptySave(now);
    return sanitizeSave(JSON.parse(text), now);
  } catch {
    return createEmptySave(now);
  }
}

/** Returns false if the browser refused (private mode, quota); the game keeps going. */
export function writeSave(storage: StorageLike, save: SaveData, key: string = SAVE_KEY): boolean {
  try {
    storage.setItem(key, JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}

const reviewTime = (card: StoredCard): number => {
  const time = card.last_review ? new Date(card.last_review).getTime() : Number.NaN;
  return Number.isFinite(time) ? time : -Infinity;
};

/** The newer of two cards: the later review wins, then more reps; ties keep `ours`. */
function newerCard(ours: StoredCard, theirs: StoredCard): StoredCard {
  const a = reviewTime(ours);
  const b = reviewTime(theirs);
  if (a !== b) return a > b ? ours : theirs;
  return theirs.reps > ours.reps ? theirs : ours;
}

const laterDate = (a: string | null, b: string | null): string | null =>
  a === null ? b : b === null ? a : a >= b ? a : b;

/**
 * Combines two saves that both moved on from the same starting point (two tabs).
 * Per item the newer data wins: newer card, best stars, most plays, later streak
 * day, today's larger counters. Coins take the larger total. The route is ours
 * (the tab that is saving is the one the player just used).
 */
export function mergeSaves(ours: SaveData, theirs: SaveData): SaveData {
  const cards: Record<string, StoredCard> = { ...theirs.cards };
  for (const [id, card] of Object.entries(ours.cards)) {
    const other = cards[id];
    cards[id] = other ? newerCard(card, other) : card;
  }
  const tasks: Record<string, TaskRecord> = { ...theirs.tasks };
  for (const [id, record] of Object.entries(ours.tasks)) {
    const other = tasks[id];
    tasks[id] = other
      ? { stars: Math.max(record.stars, other.stars), plays: Math.max(record.plays, other.plays) }
      : record;
  }
  const streakLast = laterDate(ours.streak.lastDate, theirs.streak.lastDate);
  const streak =
    ours.streak.lastDate === theirs.streak.lastDate
      ? { lastDate: streakLast, count: Math.max(ours.streak.count, theirs.streak.count) }
      : streakLast === ours.streak.lastDate
        ? ours.streak
        : theirs.streak;
  let daily: DailyCounters;
  if (ours.daily.date === theirs.daily.date) {
    daily = {
      date: ours.daily.date,
      answered: Math.max(ours.daily.answered, theirs.daily.answered),
      correct: Math.max(ours.daily.correct, theirs.daily.correct),
      tasksDone: Math.max(ours.daily.tasksDone, theirs.daily.tasksDone),
      sprintNew: Math.max(ours.daily.sprintNew, theirs.daily.sprintNew),
      reviewed: Math.max(ours.daily.reviewed, theirs.daily.reviewed),
    };
  } else {
    daily = ours.daily.date > theirs.daily.date ? ours.daily : theirs.daily;
  }
  return {
    ...ours,
    cards,
    tasks,
    coins: Math.max(ours.coins, theirs.coins),
    streak,
    lastPlayedDate: laterDate(ours.lastPlayedDate, theirs.lastPlayedDate),
    daily,
  };
}

/* ---------- export / import ---------- */

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function fromBase64(code: string): string {
  const binary = atob(code);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

export function exportSave(save: SaveData): string {
  return toBase64(JSON.stringify(save));
}

export type ImportResult = { ok: true; save: SaveData } | { ok: false; error: string };

const BAD_CODE = '這不是有效的存檔代碼。';

export function importSave(code: string, now: Date): ImportResult {
  try {
    const parsed: unknown = JSON.parse(fromBase64(code.replace(/\s+/g, '')));
    if (!isObject(parsed) || typeof parsed.version !== 'number' || !isObject(parsed.cards)) {
      return { ok: false, error: BAD_CODE };
    }
    return { ok: true, save: sanitizeSave(parsed, now) };
  } catch {
    return { ok: false, error: BAD_CODE };
  }
}
