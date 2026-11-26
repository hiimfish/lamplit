/**
 * 發音評分 (docs/specs/learning.md): how clearly a recording says the target sentence, scored
 * on the device by a letter model (wav2vec2-base-960h: CTC over A to Z and the apostrophe).
 * Pure: the model's per-frame log-probabilities come in (src/audio/pronModel.ts), a
 * SpokenScore comes out.
 *
 * The sentence's letters are force-aligned to the frames (Viterbi over CTC, word gaps
 * optional). A letter's goodness is how close it came to being the model's first choice:
 * on its own frames and two frames either side, its probability over the likeliest
 * letter's at that frame (1 when it was the top letter; the likeliest counts as at least
 * TOP_FLOOR), at best. Measured against the
 * other letters rather than as a plain probability, an accent or a phone microphone that
 * makes the model less sure of every letter costs little, while a different word still
 * scores low (calibrated on native and Mandarin-voiced TTS, the latter also band-limited
 * with noise: docs/specs/learning.md). A word's goodness is the mean over its letters,
 * mapped to 0..100. The sentence score weights each word by its letter count. Names and
 * words with symbols (prices, times) are aligned but "free": they show, and are not counted.
 */
import { normalize } from './grading';
import { spokenLevel } from './spokenScore';
import type { SpokenMark, SpokenScore } from './spokenScore';

/** The model's output columns, in order (vocab.json of wav2vec2-base-960h). */
export const CTC_VOCAB = [
  '<pad>', '<s>', '</s>', '<unk>', '|', 'E', 'T', 'A', 'O', 'N', 'I', 'H', 'S', 'R', 'D', 'L',
  'U', 'M', 'W', 'C', 'F', 'G', 'Y', 'P', 'B', 'V', 'K', "'", 'X', 'J', 'Q', 'Z',
] as const; // prettier-ignore

const BLANK = 0;
const WORD_GAP = 4;
/** The letter columns (E to Z and the apostrophe): every column after the word gap. */
const FIRST_LETTER = WORD_GAP + 1;
/** A letter may peak this many frames outside the frames the alignment gave it. */
const SLACK = 2;
/**
 * The likeliest letter counts as at least this probable, so a frame where the model hears
 * no letter at all (all near 0, the blank on top) cannot make a letter look first.
 */
const TOP_FLOOR = 0.02;
const LETTER_ID = new Map<string, number>(CTC_VOCAB.map((token, id) => [token, id]));

/** A word's mean letter goodness at or under FLOOR scores 0; at or over CEILING, 100. */
const FLOOR = 0.1;
const CEILING = 0.7;
/** Word scores from these up are 'hit'; from NEAR_FROM up 'near'; below, 'missed'. */
const HIT_FROM = 70;
const NEAR_FROM = 40;

export interface TargetWord {
  /** As written, without the punctuation around it. */
  word: string;
  /** What the model should hear: A to Z and ', spoken words separated by a space. */
  letters: string;
  /** A name or a symbol-read word: shown, not counted. */
  free: boolean;
}

const UNITS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen',
  'nineteen',
]; // prettier-ignore
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

/** 0 to 9999 in words (482 is "four hundred eighty two"). */
export function numberWords(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 9999) return '';
  if (n < 20) return UNITS[n] ?? '';
  if (n < 100) {
    const unit = n % 10;
    return `${TENS[Math.floor(n / 10)] ?? ''}${unit ? ` ${UNITS[unit]}` : ''}`;
  }
  if (n < 1000) {
    const rest = n % 100;
    return `${UNITS[Math.floor(n / 100)]} hundred${rest ? ` ${numberWords(rest)}` : ''}`;
  }
  const rest = n % 1000;
  return `${UNITS[Math.floor(n / 1000)]} thousand${rest ? ` ${numberWords(rest)}` : ''}`;
}

const ORDINAL_OF: Record<string, string> = {
  one: 'first', two: 'second', three: 'third', five: 'fifth', eight: 'eighth', nine: 'ninth',
  twelve: 'twelfth',
}; // prettier-ignore

function ordinalWords(n: number): string {
  const words = numberWords(n).split(' ');
  const last = words.pop() ?? '';
  const ordinal =
    ORDINAL_OF[last] ?? (last.endsWith('y') ? `${last.slice(0, -1)}ieth` : `${last}th`);
  return [...words, ordinal].join(' ');
}

const TITLES = new Set(['mr', 'mrs', 'ms', 'dr', 'miss', 'mister', 'doctor']);
const MONTHS_AND_DAYS = new Set([
  'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september',
  'october', 'november', 'december', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday',
  'saturday', 'sunday',
]); // prettier-ignore
const SPOKEN_TITLE: Record<string, string> = {
  mr: 'mister',
  mrs: 'missus',
  ms: 'miz',
  dr: 'doctor',
};

const stripEdges = (raw: string): string =>
  raw.replace(/^[^\p{L}\p{N}$]+/u, '').replace(/[^\p{L}\p{N}%]+$/u, '');

/** A capital in the middle of a sentence, or a word after a title. */
function isName(raws: readonly string[], index: number): boolean {
  const raw = stripEdges(raws[index] ?? '');
  const lower = normalize(raw);
  if (lower === '' || TITLES.has(lower)) return false;
  if (index > 0 && TITLES.has(normalize(raws[index - 1] ?? ''))) return true;
  if (!/^\p{Lu}/u.test(raw) || index === 0) return false;
  if (/[.!?]["')\]]*$/.test(raws[index - 1] ?? '')) return false;
  if (/^i(?:'|$)/.test(lower) || MONTHS_AND_DAYS.has(lower)) return false;
  return true;
}

const num = (digits: string): string => numberWords(Number(digits));

/** How one written word is said, in lower-case words, and whether that reading is a guess. */
function spoken(word: string): { said: string; guessed: boolean } {
  const plain = word.toLowerCase().replace(/[’‘]/g, "'");
  const title = SPOKEN_TITLE[plain.replace(/\.$/, '')];
  // A title's reading varies (Ms: "miz", "miss") and the model spells it either way.
  if (title) return { said: title, guessed: true };
  if (/^\d+$/.test(plain)) return { said: num(plain), guessed: false };
  const ordinal = /^(\d+)(?:st|nd|rd|th)$/.exec(plain);
  if (ordinal) return { said: ordinalWords(Number(ordinal[1])), guessed: false };
  if (!/\d|[$%&@]/.test(plain)) return { said: plain, guessed: false };
  const said = plain
    .replace(/\$(\d+)\.(\d\d)/g, (_, a: string, b: string) => `${num(a)} ${num(b)}`)
    .replace(/\$(\d+)/g, (_, a: string) => `${num(a)} dollars`)
    .replace(/(\d+):(\d\d)/g, (_, a: string, b: string) => `${num(a)} ${num(b)}`)
    .replace(/(\d+)\.(\d+)/g, (_, a: string, b: string) => {
      const decimals = b.split('').map(num).join(' ');
      return `${num(a)} point ${decimals}`;
    })
    .replace(/\d+/g, num)
    .replace(/%/g, ' percent')
    .replace(/&/g, ' and ')
    .replace(/@/g, ' at ');
  return { said, guessed: true };
}

/** The target's words, each with the letters the model should hear. */
export function targetWords(text: string): TargetWord[] {
  const raws = text.split(/\s+/).filter((w) => w !== '');
  const out: TargetWord[] = [];
  raws.forEach((raw, index) => {
    const word = stripEdges(raw);
    if (word === '') return;
    const { said, guessed } = spoken(word);
    const letters = said
      .toUpperCase()
      .replace(/-/g, ' ')
      .replace(/[^A-Z' ]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (letters.replace(/[ ']/g, '') === '') return;
    out.push({ word, letters, free: guessed || isName(raws, index) });
  });
  return out;
}

/** Rows of log-probabilities from raw logits (frames x vocab, row-major). */
export function logSoftmaxRows(
  logits: ArrayLike<number>,
  frames: number,
  vocab: number,
): Float32Array[] {
  const rows: Float32Array[] = [];
  for (let t = 0; t < frames; t++) {
    const row = new Float32Array(vocab);
    let max = -Infinity;
    for (let j = 0; j < vocab; j++) max = Math.max(max, logits[t * vocab + j] ?? -Infinity);
    let sum = 0;
    for (let j = 0; j < vocab; j++) sum += Math.exp((logits[t * vocab + j] ?? -Infinity) - max);
    const log = max + Math.log(sum);
    for (let j = 0; j < vocab; j++) row[j] = (logits[t * vocab + j] ?? -Infinity) - log;
    rows.push(row);
  }
  return rows;
}

/**
 * Viterbi CTC alignment of `tokens` (letter ids) to the frames. A gap state takes the blank
 * or the word-gap column, whichever is likelier, so word gaps are optional. Returns, per
 * token, its goodness (0..1, see the top of the file) around its aligned frames; null when
 * the recording is too short for the letters.
 */
export function letterGoodness(
  lp: readonly ArrayLike<number>[],
  tokens: readonly number[],
): number[] | null {
  const frames = lp.length;
  const states = 2 * tokens.length + 1;
  if (tokens.length === 0 || frames < tokens.length) return null;
  const label = (s: number) => (s % 2 === 0 ? -1 : (tokens[(s - 1) >> 1] ?? BLANK));
  const emit = (t: number, s: number): number => {
    const row = lp[t];
    if (!row) return -Infinity;
    const id = label(s);
    if (id >= 0) return row[id] ?? -Infinity;
    return Math.max(row[BLANK] ?? -Infinity, row[WORD_GAP] ?? -Infinity);
  };
  const back: Int32Array[] = [new Int32Array(states)];
  let prev = new Float64Array(states).fill(-Infinity);
  prev[0] = emit(0, 0);
  prev[1] = emit(0, 1);
  for (let t = 1; t < frames; t++) {
    const cur = new Float64Array(states).fill(-Infinity);
    const from = new Int32Array(states);
    for (let s = 0; s < states; s++) {
      let best = prev[s] ?? -Infinity;
      let arg = s;
      const step = s > 0 ? (prev[s - 1] ?? -Infinity) : -Infinity;
      if (step > best) {
        best = step;
        arg = s - 1;
      }
      const skip = s > 1 && s % 2 === 1 ? (prev[s - 2] ?? -Infinity) : -Infinity;
      if (skip > best && label(s) !== label(s - 2)) {
        best = skip;
        arg = s - 2;
      }
      cur[s] = best + emit(t, s);
      from[s] = arg;
    }
    back.push(from);
    prev = cur;
  }
  const last = prev[states - 1] ?? -Infinity;
  const beforeLast = prev[states - 2] ?? -Infinity;
  if (!Number.isFinite(Math.max(last, beforeLast))) return null;
  let s = last >= beforeLast ? states - 1 : states - 2;
  const first = new Array<number>(tokens.length).fill(frames);
  const lastFrame = new Array<number>(tokens.length).fill(-1);
  for (let t = frames - 1; t >= 0; t--) {
    if (s % 2 === 1) {
      const k = (s - 1) >> 1;
      first[k] = t;
      if ((lastFrame[k] ?? -1) < 0) lastFrame[k] = t;
    }
    s = back[t]?.[s] ?? 0;
  }
  return tokens.map((id, k) => {
    let best = 0;
    const from = Math.max(0, (first[k] ?? frames) - SLACK);
    const to = Math.min(frames - 1, (lastFrame[k] ?? -1) + SLACK);
    for (let t = from; t <= to; t++) {
      const row = lp[t];
      if (!row) continue;
      let top = -Infinity;
      for (let j = FIRST_LETTER; j < CTC_VOCAB.length; j++)
        top = Math.max(top, row[j] ?? -Infinity);
      const p = Math.exp(row[id] ?? -Infinity);
      best = Math.max(best, Math.min(1, p / Math.max(Math.exp(top), TOP_FLOOR)));
    }
    return best;
  });
}

/** A word's 0..100 from the mean goodness of its letters. */
export function wordScore(meanGoodness: number): number {
  const scaled = (meanGoodness - FLOOR) / (CEILING - FLOOR);
  return Math.round(100 * Math.min(1, Math.max(0, scaled)));
}

function statusOf(score: number): SpokenMark['status'] {
  if (score >= HIT_FROM) return 'hit';
  if (score >= NEAR_FROM) return 'near';
  return 'missed';
}

/** The pronunciation score of a recording, from its log-probabilities; null if unusable. */
export function scorePronunciation(
  text: string,
  lp: readonly ArrayLike<number>[],
): SpokenScore | null {
  const words = targetWords(text);
  const tokens: number[] = [];
  const owner: number[] = [];
  words.forEach((w, index) => {
    for (const ch of w.letters.replace(/ /g, '')) {
      const id = LETTER_ID.get(ch);
      if (id === undefined) continue;
      tokens.push(id);
      owner.push(index);
    }
  });
  const goodness = letterGoodness(lp, tokens);
  if (!goodness) return null;
  let sum = 0;
  let weight = 0;
  const marks = words.map((w, index): SpokenMark => {
    const own = goodness.filter((_, k) => owner[k] === index);
    const mean = own.reduce((a, p) => a + p, 0) / Math.max(1, own.length);
    const score = wordScore(mean);
    if (!w.free) {
      sum += score * own.length;
      weight += own.length;
    }
    return w.free
      ? { word: w.word, status: statusOf(score), free: true }
      : { word: w.word, status: statusOf(score) };
  });
  const score = weight === 0 ? 0 : Math.round(sum / weight);
  return { score, level: spokenLevel(score), marks };
}
