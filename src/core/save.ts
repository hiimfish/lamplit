import { EXAM_CONTENT_VERSION, EXAM_IDS, isExamId, type ExamId } from '../content/exam';
import { newStoredCard, type StoredCard } from '../learning/scheduler';
import { STORAGE_KEYS } from './storageKeys';

/**
 * Versioned progress save. Every function is pure and takes `now`, so tests
 * (and ?debugDate) can simulate any day. Loading never throws.
 */
export const SAVE_KEY = STORAGE_KEYS.save;
/** Used while `?debugDate` is set, so time-travel testing never touches the real save. */
export const DEBUG_SAVE_KEY = STORAGE_KEYS.debugSave;
/** The save format version; a save code from a later version is refused. */
export const SAVE_VERSION = 1;

/** The best 跟著說 round of a task's story in 聽力加量: score 0-100 over `lines` scored lines. */
export interface SpokenRecord {
  score: number;
  lines: number;
}

interface TaskRecord {
  /** Best stars so far, 1 to 3. */
  stars: number;
  plays: number;
  /** Times its story was heard to the end in 聽力加量; unset means never. */
  heard?: number;
  /** The best 跟著說 round of its story; unset means none. */
  spoken?: SpokenRecord;
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
  /** Story scenes heard to the end in 聽力加量 today. */
  listened: number;
  /** Questions answered in 文法快練 today. */
  grammar: number;
}

/** One past (or the current) day in `history`: its counters and whether every goal was met. */
export interface DayRecord {
  tasks: number;
  sprintNew: number;
  reviewed: number;
  listened: number;
  grammar: number;
  answered: number;
  correct: number;
  met: boolean;
}

/** A score from an official ETS practice test (檢查點), each part 5 to 495 in steps of 5. */
export interface Checkpoint {
  date: string;
  listening: number;
  reading: number;
  /** `exam`: estimated by a 幕結業考, not entered from an ETS test (unset). */
  source?: 'exam';
  /** The Act whose exam it was; set exactly when `source` is `exam`. */
  act?: 1 | 2 | 3 | 4;
  /** Sat again with questions seen before, so the score may read high. */
  retake?: true;
}

/** ETS scores kept; the oldest go first. */
export const CHECKPOINTS_KEPT = 50;

/** Days of history kept; older ones are dropped. */
export const HISTORY_DAYS = 120;

/** `[missed, asked]`: how often a question carrying a tag was answered wrong, and asked. */
export type MistakeCount = [missed: number, asked: number];

/** One day of the 最常錯 log, keyed by tag (`p:<pairId>`, `k:<kind>`, `e:<error>`, `g:<grammarId>`). */
export type MistakeDay = Record<string, MistakeCount>;

/** Tags kept per day; the ones answered wrong most often stay. */
export const MISTAKE_TAGS_PER_DAY = 60;

/** What a tag looks like: a one-letter kind, a colon and a short id. */
export const MISTAKE_TAG = /^[a-z]:[a-z0-9_-]{1,48}$/;

/** Per exam: sittings, the last one's date and estimated scores, and the questions seen. */
export interface ExamRecord {
  attempts: number;
  lastDate: string;
  listening: number;
  reading: number;
  /** Hand-written question id to the times it was shown (decides the next form). */
  seen: Record<string, number>;
  /** EXAM_CONTENT_VERSION of the questions that `seen` and `sittings` count. */
  version: number;
  /** Sittings on this version of the questions: 0 sits form A next, 1 form B, then mixed. */
  sittings: number;
}

/** Offsets that bring the exam estimate toward the player's ETS scores. */
export interface ExamCalibration {
  /** Points added to the listening estimate (within +-50). */
  listening: number;
  reading: number;
  /** ETS scores paired with an exam estimate so far. */
  pairs: number;
}

/** Every exam's record by id, and the calibration shared by all of them. */
export interface ExamsSave extends Partial<Record<ExamId, ExamRecord>> {
  calibration?: ExamCalibration;
}

/** A sitting in progress: finished sections are kept, a section left halfway is dropped. */
export interface ExamRun {
  exam: ExamId;
  seed: number;
  startedOn: string;
  /** Ids of the finished sections (`s1`, ...). */
  done: string[];
  /** Answers of the finished sections: question id to option id (`o2`). */
  answers: Record<string, string>;
}

/** A run older than this many days is dropped. */
export const EXAM_RUN_DAYS = 7;

/**
 * 一般 or 衝刺 (docs/specs/sprint.md). `start` is the day 衝刺 was last chosen
 * (YYYY-MM-DD), kept when switching back to 一般; null if it never was.
 */
export interface Route {
  kind: 'normal' | 'sprint';
  start: string | null;
  /** Length of the sprint in weeks; unset means 12. Grows by 4 when the player extends it. */
  weeks?: number;
  /** The last day the player was asked to extend (and extended or said no): misses count after it. */
  askedOn?: string;
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
  /** The last HISTORY_DAYS days, keyed YYYY-MM-DD; written on every save (recordToday). */
  history: Record<string, DayRecord>;
  /** ETS practice scores entered by the player, oldest first. */
  checkpoints: Checkpoint[];
  route: Route;
  /** The last HISTORY_DAYS days of answered-wrong counts by tag, keyed YYYY-MM-DD. */
  mistakes: Record<string, MistakeDay>;
  /** 幕結業考 results and the calibration. */
  exams: ExamsSave;
  /** The exam sitting in progress, if any. */
  examRun?: ExamRun;
  /** 文法快練: each bank item answered, by item id (unset until the first answer). */
  grammarSeen?: Record<string, GrammarSeen>;
}

/** One 文法快練 item: when it was last answered (ms) and whether that answer was wrong. */
export interface GrammarSeen {
  at: number;
  wrong?: true;
}

/** At most this many items are remembered in `grammarSeen` (the newest are kept). */
export const GRAMMAR_SEEN_KEPT = 2000;

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

/** Calendar days from one YYYY-MM-DD to another (negative if `toKey` is earlier). */
export function daysBetween(fromKey: string, toKey: string): number {
  return dayNumber(toKey) - dayNumber(fromKey);
}

/** The local date `offset` days from `key`, as YYYY-MM-DD. */
export function shiftDay(key: string, offset: number): string {
  const [y = 0, m = 1, d = 1] = key.split('-').map(Number);
  return dateKey(new Date(y, m - 1, d + offset));
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
  return {
    date: dateKey(now),
    answered: 0,
    correct: 0,
    tasksDone: 0,
    sprintNew: 0,
    reviewed: 0,
    listened: 0,
    grammar: 0,
  };
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
    history: {},
    checkpoints: [],
    route: { kind: 'normal', start: null },
    mistakes: {},
    exams: {},
  };
}

/** Today's counters; zeros if the saved ones are from another day. */
export function dailyFor(save: SaveData, now: Date): DailyCounters {
  return save.daily.date === dateKey(now) ? save.daily : emptyDaily(now);
}

/** Keeps only the last HISTORY_DAYS days up to `today` (for `history` and `mistakes`). */
function pruneDays<T>(days: Record<string, T>, today: string): Record<string, T> {
  const kept: Record<string, T> = {};
  for (const [key, record] of Object.entries(days)) {
    const age = daysBetween(key, today);
    if (age < HISTORY_DAYS) kept[key] = record;
  }
  return kept;
}

/**
 * Copies today's counters into `history[today]`. `met` says whether every goal is
 * met right now; once a day is met it stays met (a review falling due later does
 * not take it back).
 */
export function recordToday(save: SaveData, now: Date, met: boolean): SaveData {
  const today = dateKey(now);
  const daily = dailyFor(save, now);
  const before = save.history[today];
  const record: DayRecord = {
    tasks: daily.tasksDone,
    sprintNew: daily.sprintNew,
    reviewed: daily.reviewed,
    listened: daily.listened,
    grammar: daily.grammar,
    answered: daily.answered,
    correct: daily.correct,
    met: met || (before?.met ?? false),
  };
  if (
    before &&
    (Object.keys(record) as (keyof DayRecord)[]).every((key) => record[key] === before[key])
  )
    return save;
  return { ...save, history: pruneDays({ ...save.history, [today]: record }, today) };
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
      const heard = whole(record.heard);
      if (heard > 0) save.tasks[id].heard = heard;
      const spoken = sanitizeSpoken(record.spoken);
      if (spoken) save.tasks[id].spoken = spoken;
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
      listened: whole(raw.daily.listened),
      grammar: whole(raw.daily.grammar),
    };
  }
  if (isObject(raw.history)) {
    const history: Record<string, DayRecord> = {};
    for (const [key, record] of Object.entries(raw.history)) {
      if (!isDateKey(key) || !isObject(record)) continue;
      history[key] = {
        tasks: whole(record.tasks),
        sprintNew: whole(record.sprintNew),
        reviewed: whole(record.reviewed),
        listened: whole(record.listened),
        grammar: whole(record.grammar),
        answered: whole(record.answered),
        correct: whole(record.correct),
        met: record.met === true,
      };
    }
    save.history = pruneDays(history, dateKey(now));
  }
  save.mistakes = sanitizeMistakes(raw.mistakes, dateKey(now));
  save.exams = sanitizeExams(raw.exams);
  const examRun = sanitizeExamRun(raw.examRun, dateKey(now));
  if (examRun) save.examRun = examRun;
  const grammarSeen = sanitizeGrammarSeen(raw.grammarSeen, now);
  if (grammarSeen) save.grammarSeen = grammarSeen;
  if (Array.isArray(raw.checkpoints)) {
    save.checkpoints = sortCheckpoints(raw.checkpoints.filter(isCheckpoint));
  }
  // Older saves have no route: they play the normal one.
  if (isObject(raw.route)) {
    save.route = {
      kind: raw.route.kind === 'sprint' ? 'sprint' : 'normal',
      start: isDateKey(raw.route.start) ? raw.route.start : null,
    };
    if (save.route.kind === 'sprint' && !save.route.start)
      save.route = { kind: 'normal', start: null };
    const weeks = raw.route.weeks;
    if (isCount(weeks) && weeks > 12 && weeks <= 52 && save.route.start) save.route.weeks = weeks;
    if (isDateKey(raw.route.askedOn) && save.route.start) save.route.askedOn = raw.route.askedOn;
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
  let text: string | null;
  try {
    text = storage.getItem(key);
    if (!text && key === DEBUG_SAVE_KEY) text = storage.getItem(SAVE_KEY);
  } catch {
    return createEmptySave(now);
  }
  if (!text) return createEmptySave(now);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    if (key === SAVE_KEY) keepCorrupt(storage, text);
    return createEmptySave(now);
  }
  return sanitizeSave(parsed, now);
}

/**
 * The real save could not be read: keep its text under STORAGE_KEYS.corruptSave before the
 * next write replaces it. An earlier copy there is never overwritten.
 */
function keepCorrupt(storage: StorageLike, text: string): void {
  try {
    if (storage.getItem(STORAGE_KEYS.corruptSave) === null) {
      storage.setItem(STORAGE_KEYS.corruptSave, text);
    }
  } catch {
    // storage refused: nothing more we can do
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
    if (!other) {
      tasks[id] = record;
      continue;
    }
    const merged: TaskRecord = {
      stars: Math.max(record.stars, other.stars),
      plays: Math.max(record.plays, other.plays),
    };
    const heard = Math.max(record.heard ?? 0, other.heard ?? 0);
    if (heard > 0) merged.heard = heard;
    const spoken = betterSpoken(record.spoken, other.spoken);
    if (spoken) merged.spoken = spoken;
    tasks[id] = merged;
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
      listened: Math.max(ours.daily.listened, theirs.daily.listened),
      grammar: Math.max(ours.daily.grammar, theirs.daily.grammar),
    };
  } else {
    daily = ours.daily.date > theirs.daily.date ? ours.daily : theirs.daily;
  }
  const history: Record<string, DayRecord> = { ...theirs.history };
  for (const [key, record] of Object.entries(ours.history)) {
    const other = history[key];
    history[key] = other
      ? {
          tasks: Math.max(record.tasks, other.tasks),
          sprintNew: Math.max(record.sprintNew, other.sprintNew),
          reviewed: Math.max(record.reviewed, other.reviewed),
          listened: Math.max(record.listened, other.listened),
          grammar: Math.max(record.grammar, other.grammar),
          answered: Math.max(record.answered, other.answered),
          correct: Math.max(record.correct, other.correct),
          met: record.met || other.met,
        }
      : record;
  }
  const merged: SaveData = {
    ...ours,
    cards,
    tasks,
    coins: Math.max(ours.coins, theirs.coins),
    streak,
    lastPlayedDate: laterDate(ours.lastPlayedDate, theirs.lastPlayedDate),
    daily,
    history,
    checkpoints: sortCheckpoints([...theirs.checkpoints, ...ours.checkpoints]),
    route: mergeRoute(ours.route, theirs.route),
    mistakes: mergeMistakes(ours.mistakes, theirs.mistakes),
    exams: mergeExams(ours.exams, theirs.exams),
  };
  const examRun = mergeExamRun(ours, theirs);
  if (examRun) merged.examRun = examRun;
  else delete merged.examRun;
  const grammarSeen = mergeGrammarSeen(ours.grammarSeen, theirs.grammarSeen);
  if (grammarSeen) merged.grammarSeen = grammarSeen;
  else delete merged.grammarSeen;
  return merged;
}

/** A score part as ETS reports it: 5 to 495 in steps of 5. */
export const isEtsScore = (value: unknown): value is number =>
  isCount(value) && value >= 5 && value <= 495 && value % 5 === 0;

const isAct = (value: unknown): value is 1 | 2 | 3 | 4 =>
  value === 1 || value === 2 || value === 3 || value === 4;

/** An exam score needs its Act; any other `source` is not one we know. */
function isCheckpoint(raw: unknown): raw is Checkpoint {
  return (
    isObject(raw) &&
    isDateKey(raw.date) &&
    isEtsScore(raw.listening) &&
    isEtsScore(raw.reading) &&
    (raw.source === undefined || (raw.source === 'exam' && isAct(raw.act)))
  );
}

/** Oldest first, each score once (per source and Act), at most CHECKPOINTS_KEPT (copies only the fields kept). */
export function sortCheckpoints(list: readonly Checkpoint[]): Checkpoint[] {
  const seen = new Set<string>();
  const unique: Checkpoint[] = [];
  for (const { date, listening, reading, source, act, retake } of list) {
    const exam = source === 'exam' && isAct(act);
    const id = `${date}/${listening}/${reading}/${exam ? 'exam' : ''}/${exam ? act : ''}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const entry: Checkpoint = { date, listening, reading };
    if (exam) {
      entry.source = 'exam';
      entry.act = act;
      if (retake === true) entry.retake = true;
    }
    unique.push(entry);
  }
  unique.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return unique.slice(-CHECKPOINTS_KEPT);
}

/** Our route; on the same sprint, the longer length and the later ask from either tab. */
function mergeRoute(ours: Route, theirs: Route): Route {
  if (ours.start === null || ours.start !== theirs.start) return ours;
  const route = { ...ours };
  const weeks = Math.max(ours.weeks ?? 12, theirs.weeks ?? 12);
  if (weeks > 12) route.weeks = weeks;
  const asked = laterDate(ours.askedOn ?? null, theirs.askedOn ?? null);
  if (asked) route.askedOn = asked;
  return route;
}

/* ---------- 跟著說, 最常錯 and 結業考 ---------- */

/** A 跟著說 record: score a whole number 0-100, at least one scored line; else undefined. */
function sanitizeSpoken(raw: unknown): SpokenRecord | undefined {
  if (!isObject(raw)) return undefined;
  const { score, lines } = raw;
  if (!isCount(score) || score > 100 || !isCount(lines) || lines < 1) return undefined;
  return { score, lines };
}

/** The better 跟著說 round: the higher score, on a tie the one with more lines scored. */
export function betterSpoken(
  a: SpokenRecord | undefined,
  b: SpokenRecord | undefined,
): SpokenRecord | undefined {
  if (!a || !b) return a ?? b;
  if (a.score !== b.score) return a.score > b.score ? a : b;
  return b.lines > a.lines ? b : a;
}

/** The tags of one day: bad tags and values go, `[0, 0]` goes, at most MISTAKE_TAGS_PER_DAY stay. */
function sanitizeMistakeDay(raw: unknown): MistakeDay {
  const entries: [string, MistakeCount][] = [];
  if (isObject(raw)) {
    for (const [tag, value] of Object.entries(raw)) {
      if (!MISTAKE_TAG.test(tag) || !Array.isArray(value) || value.length !== 2) continue;
      const [missed, asked] = value as unknown[];
      if (!isCount(missed) || !isCount(asked) || (missed === 0 && asked === 0)) continue;
      entries.push([tag, [missed, asked]]);
    }
  }
  return capMistakeDay(Object.fromEntries(entries));
}

/** Keeps the MISTAKE_TAGS_PER_DAY tags missed most (ties: asked more, then by name). */
function capMistakeDay(day: MistakeDay): MistakeDay {
  const entries = Object.entries(day);
  if (entries.length <= MISTAKE_TAGS_PER_DAY) return day;
  entries.sort(
    ([ta, a], [tb, b]) => b[0] - a[0] || b[1] - a[1] || (ta < tb ? -1 : ta > tb ? 1 : 0),
  );
  return Object.fromEntries(entries.slice(0, MISTAKE_TAGS_PER_DAY));
}

/** `mistakes` from anything: only real dates, kept for HISTORY_DAYS, and days with something in them. */
function sanitizeMistakes(raw: unknown, today: string): Record<string, MistakeDay> {
  const days: Record<string, MistakeDay> = {};
  if (isObject(raw)) {
    for (const [key, value] of Object.entries(raw)) {
      if (!isDateKey(key)) continue;
      const day = sanitizeMistakeDay(value);
      if (Object.keys(day).length > 0) days[key] = day;
    }
  }
  return pruneDays(days, today);
}

/** Both tabs' days and tags together; each number is the larger of the two. */
function mergeMistakes(
  ours: Record<string, MistakeDay>,
  theirs: Record<string, MistakeDay>,
): Record<string, MistakeDay> {
  const merged: Record<string, MistakeDay> = { ...theirs };
  for (const [key, day] of Object.entries(ours)) {
    const other = merged[key];
    if (!other) {
      merged[key] = day;
      continue;
    }
    const both: MistakeDay = { ...other };
    for (const [tag, [missed, asked]] of Object.entries(day)) {
      const before = both[tag];
      both[tag] = before
        ? [Math.max(missed, before[0]), Math.max(asked, before[1])]
        : [missed, asked];
    }
    merged[key] = capMistakeDay(both);
  }
  return merged;
}

const ITEM_ID = /^[a-z0-9_.-]{1,80}$/;

/** At most this many question ids are remembered per exam in `seen`. */
const SEEN_KEPT = 1000;

/**
 * A record: kept whole when its questions are the current version; one from an older
 * version (or none: saves before versions) keeps its sittings and scores but forgets
 * what it saw, so the next sitting is form A of the new questions.
 */
function sanitizeExamRecord(raw: unknown): ExamRecord | undefined {
  if (!isObject(raw)) return undefined;
  const { attempts, lastDate, listening, reading } = raw;
  if (!isCount(attempts) || attempts < 1 || !isDateKey(lastDate)) return undefined;
  if (!isEtsScore(listening) || !isEtsScore(reading)) return undefined;
  const version = EXAM_CONTENT_VERSION;
  if (raw.version !== version) {
    return { attempts, lastDate, listening, reading, seen: {}, version, sittings: 0 };
  }
  const sittings = isCount(raw.sittings) ? Math.min(raw.sittings, attempts) : 0;
  const seen: Record<string, number> = {};
  if (isObject(raw.seen)) {
    for (const [id, times] of Object.entries(raw.seen)) {
      if (Object.keys(seen).length >= SEEN_KEPT) break;
      if (ITEM_ID.test(id) && isCount(times) && times > 0) seen[id] = times;
    }
  }
  return { attempts, lastDate, listening, reading, seen, version, sittings };
}

const CALIBRATION_LIMIT = 50;

function sanitizeCalibration(raw: unknown): ExamCalibration | undefined {
  if (!isObject(raw) || !isCount(raw.pairs) || raw.pairs < 1) return undefined;
  const offset = (value: unknown): number =>
    Math.max(-CALIBRATION_LIMIT, Math.min(CALIBRATION_LIMIT, Math.round(num(value))));
  return { listening: offset(raw.listening), reading: offset(raw.reading), pairs: raw.pairs };
}

function sanitizeExams(raw: unknown): ExamsSave {
  const exams: ExamsSave = {};
  if (!isObject(raw)) return exams;
  for (const id of EXAM_IDS) {
    const record = sanitizeExamRecord(raw[id]);
    if (record) exams[id] = record;
  }
  const calibration = sanitizeCalibration(raw.calibration);
  if (calibration) exams.calibration = calibration;
  return exams;
}

/** The run in progress, unless its exam is unknown, an id is bad or it is over EXAM_RUN_DAYS old. */
function sanitizeExamRun(raw: unknown, today: string): ExamRun | undefined {
  if (!isObject(raw) || !isExamId(raw.exam) || !isDateKey(raw.startedOn)) return undefined;
  if (!isCount(raw.seed) || daysBetween(raw.startedOn, today) > EXAM_RUN_DAYS) return undefined;
  const done = Array.isArray(raw.done)
    ? raw.done.filter((id): id is string => typeof id === 'string' && ITEM_ID.test(id))
    : [];
  const answers: Record<string, string> = {};
  if (isObject(raw.answers)) {
    for (const [qid, choice] of Object.entries(raw.answers)) {
      if (ITEM_ID.test(qid) && typeof choice === 'string' && /^o\d{1,2}$/.test(choice)) {
        answers[qid] = choice;
      }
    }
  }
  return { exam: raw.exam, seed: raw.seed, startedOn: raw.startedOn, done, answers };
}

/**
 * The same sitting seen from two tabs: the one with more sections done wins; else ours.
 * When only one side has a run it is kept, unless the other side has more sittings of
 * that exam (it finished the run, which is why it has none).
 */
function mergeExamRun(ours: SaveData, theirs: SaveData): ExamRun | undefined {
  const a = ours.examRun;
  const b = theirs.examRun;
  if (!a || !b) {
    const only = a ?? b;
    if (!only) return undefined;
    const [owner, other] = a ? [ours, theirs] : [theirs, ours];
    const finished =
      (other.exams[only.exam]?.attempts ?? 0) > (owner.exams[only.exam]?.attempts ?? 0);
    return finished ? undefined : only;
  }
  const same = a.exam === b.exam && a.seed === b.seed && a.startedOn === b.startedOn;
  return same && b.done.length > a.done.length ? b : a;
}

/**
 * Per exam the larger `attempts`; the scores of the later sitting; the newer question
 * version, and on the same version the larger `sittings` and counts of `seen`.
 */
function mergeExams(ours: ExamsSave, theirs: ExamsSave): ExamsSave {
  const merged: ExamsSave = {};
  for (const id of EXAM_IDS) {
    const a = ours[id];
    const b = theirs[id];
    if (!a || !b) {
      const only = a ?? b;
      if (only) merged[id] = only;
      continue;
    }
    const later = b.lastDate > a.lastDate ? b : a;
    const version = Math.max(a.version, b.version);
    // Only a side on the newer version says what was seen of those questions.
    const sides = [a, b].filter((r) => r.version === version);
    const seen: Record<string, number> = {};
    for (const side of sides) {
      for (const [qid, times] of Object.entries(side.seen)) {
        seen[qid] = Math.max(times, seen[qid] ?? 0);
      }
    }
    merged[id] = {
      attempts: Math.max(a.attempts, b.attempts),
      lastDate: later.lastDate,
      listening: later.listening,
      reading: later.reading,
      seen,
      version,
      sittings: Math.max(...sides.map((r) => r.sittings)),
    };
  }
  const a = ours.calibration;
  const b = theirs.calibration;
  const calibration = a && b ? (b.pairs > a.pairs ? b : a) : (a ?? b);
  if (calibration) merged.calibration = calibration;
  return merged;
}

/** The newest GRAMMAR_SEEN_KEPT entries, or undefined when there are none. */
export function keepNewestSeen(
  seen: Record<string, GrammarSeen>,
): Record<string, GrammarSeen> | undefined {
  const entries = Object.entries(seen);
  if (entries.length === 0) return undefined;
  if (entries.length <= GRAMMAR_SEEN_KEPT) return seen;
  return Object.fromEntries(entries.sort((x, y) => y[1].at - x[1].at).slice(0, GRAMMAR_SEEN_KEPT));
}

/** `grammarSeen` from anything: item ids with a time (a future one becomes now). */
function sanitizeGrammarSeen(raw: unknown, now: Date): Record<string, GrammarSeen> | undefined {
  if (!isObject(raw)) return undefined;
  const seen: Record<string, GrammarSeen> = {};
  for (const [id, entry] of Object.entries(raw)) {
    if (!ITEM_ID.test(id) || !isObject(entry) || !isCount(entry.at)) continue;
    seen[id] = { at: Math.min(entry.at, now.getTime()) };
    if (entry.wrong === true) seen[id].wrong = true;
  }
  return keepNewestSeen(seen);
}

/** Per item the later answer wins (ours on a tie). */
function mergeGrammarSeen(
  ours: Record<string, GrammarSeen> | undefined,
  theirs: Record<string, GrammarSeen> | undefined,
): Record<string, GrammarSeen> | undefined {
  const merged: Record<string, GrammarSeen> = { ...theirs };
  for (const [id, entry] of Object.entries(ours ?? {})) {
    const other = merged[id];
    if (!other || entry.at >= other.at) merged[id] = entry;
  }
  return keepNewestSeen(merged);
}
