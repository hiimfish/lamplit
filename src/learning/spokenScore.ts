/**
 * 聽力加量 跟著說 scoring (docs/specs/learning.md): how many words of the target the
 * recognizer heard, in order, from up to three alternatives. Pure. Not a
 * pronunciation score: it shows how many words the browser understood.
 *
 * Both sides are first put into one canonical form (numbers as digits, contractions
 * spelled out, titles unified), then aligned with a weighted longest common
 * subsequence: an exact word is worth 1, a near word 0.5. Names are "free": heard
 * they count, missed they are left out of the score.
 */
import { editDistance, normalize } from './grading';

export type SpokenLevel = 'clear' | 'mostly' | 'partly' | 'unclear';

/** One heard word of the target: matched exactly, nearly, or missed. */
export interface SpokenMark {
  word: string;
  status: 'hit' | 'near' | 'missed';
  /** A name: counted when matched, left out of the score when not. */
  free?: boolean;
}

export interface SpokenScore {
  /** 0 to 100. */
  score: number;
  level: SpokenLevel;
  /** One entry per word of the target, in order. */
  marks: SpokenMark[];
}

/** zh-TW wording of a level (很清楚／大致聽得出來／聽到一部分／這次沒聽清楚). */
export const SPOKEN_LEVEL_LABEL: Record<SpokenLevel, string> = {
  clear: '很清楚',
  mostly: '大致聽得出來',
  partly: '聽到一部分',
  unclear: '這次沒聽清楚',
};

/** 90 and up clear, 70 to 89 mostly, 40 to 69 partly, under 40 unclear. */
export function spokenLevel(score: number): SpokenLevel {
  if (score >= 90) return 'clear';
  if (score >= 70) return 'mostly';
  if (score >= 40) return 'partly';
  return 'unclear';
}

/**
 * 辨識到 N／M 個字: N counts the target's words heard exactly or nearly (a near word is
 * drawn with a thin underline); M counts all words except names that were missed, which
 * the score leaves out as well.
 */
export function heardCount(marks: readonly SpokenMark[]): { heard: number; total: number } {
  let heard = 0;
  let total = 0;
  for (const mark of marks) {
    if (mark.status === 'missed' && mark.free) continue;
    total += 1;
    if (mark.status !== 'missed') heard += 1;
  }
  return { heard, total };
}

/** 「辨識到 5／6 個字・83 分・大致聽得出來」: 聽力加量's 跟著說 and the practice's 大聲說說看. */
export function spokenScoreText(score: SpokenScore): string {
  const { heard, total } = heardCount(score.marks);
  return `辨識到 ${heard}／${total} 個字・${score.score} 分・${SPOKEN_LEVEL_LABEL[score.level]}`;
}

const NEAR_WEIGHT = 0.5;

const UNIT_WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen',
  'nineteen',
]; // prettier-ignore
const TENS_WORDS = ['twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

const NUMBER_VALUE = new Map<string, number>([
  ...UNIT_WORDS.map((w, i) => [w, i] as const),
  ...TENS_WORDS.map((w, i) => [w, (i + 2) * 10] as const),
]);

/** Ordinal words, spelled as the cardinal the number parser understands. */
const ORDINAL_WORDS: Record<string, string> = {
  first: 'one', second: 'two', third: 'three', fourth: 'four', fifth: 'five', sixth: 'six',
  seventh: 'seven', eighth: 'eight', ninth: 'nine', tenth: 'ten', eleventh: 'eleven',
  twelfth: 'twelve', thirteenth: 'thirteen', fourteenth: 'fourteen', fifteenth: 'fifteen',
  sixteenth: 'sixteen', seventeenth: 'seventeen', eighteenth: 'eighteen', nineteenth: 'nineteen',
  twentieth: 'twenty', thirtieth: 'thirty', fortieth: 'forty', fiftieth: 'fifty',
  hundredth: 'hundred', thousandth: 'thousand',
}; // prettier-ignore

const TITLES: Record<string, string> = {
  mr: 'mr', mister: 'mr', ms: 'ms', miss: 'ms', mrs: 'ms', missus: 'ms', dr: 'dr', doctor: 'dr',
}; // prettier-ignore

const FIXED_CONTRACTIONS: Record<string, readonly string[]> = {
  "can't": ['can', 'not'],
  cannot: ['can', 'not'],
  "won't": ['will', 'not'],
  "shan't": ['shall', 'not'],
  "ain't": ['is', 'not'],
  "let's": ['let', 'us'],
};

const IS_BASES = new Set([
  'he', 'she', 'it', 'that', 'there', 'what', 'who', 'where', 'here', 'how', 'when', 'why',
]); // prettier-ignore

const ENDING_OF: Record<string, string> = {
  re: 'are', ve: 'have', ll: 'will', d: 'would', m: 'am',
}; // prettier-ignore

const MONTHS_AND_DAYS = new Set([
  'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september',
  'october', 'november', 'december', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday',
  'saturday', 'sunday',
]); // prettier-ignore

/** Words a speech recognizer often writes as another word of the same sound. */
const HOMOPHONES = [
  ['to', 'too', 'two', '2'],
  ['for', 'four', '4'],
  ['one', 'won', '1'],
  ['no', 'know'],
  ['right', 'write'],
  ['hear', 'here'],
  ['by', 'buy', 'bye'],
  ['would', 'wood'],
  ['see', 'sea'],
  ['sun', 'son'],
  ['be', 'bee'],
  ['there', 'their'],
  ['weather', 'whether'],
  ['meet', 'meat'],
  ['week', 'weak'],
  ['wait', 'weight'],
  ['sale', 'sail'],
  ['plane', 'plain'],
  ['mail', 'male'],
  ['piece', 'peace'],
  ['whole', 'hole'],
  ['flower', 'flour'],
  ['board', 'bored'],
  ['pair', 'pear'],
  ['break', 'brake'],
  ['tail', 'tale'],
] as const;

const HOMOPHONE_GROUP = new Map<string, number>();
HOMOPHONES.forEach((group, index) => {
  for (const word of group) HOMOPHONE_GROUP.set(word, index);
});

interface Token {
  text: string;
  /** The first and last word of the original text this token came from. */
  from: number;
  to: number;
  free: boolean;
}

/** The words a spelled-out word stands for: contractions open up, titles unify. */
function expandWord(word: string): string[] {
  const title = TITLES[word];
  if (title) return [title];
  const ordinal = ORDINAL_WORDS[word];
  if (ordinal) return [ordinal];
  const fixed = FIXED_CONTRACTIONS[word];
  if (fixed) return [...fixed];
  if (word.endsWith("n't") && word.length > 3) return [word.slice(0, -3), 'not'];
  const match = /^(.+)'(re|ve|ll|d|m|s)$/.exec(word);
  if (match) {
    const base = match[1] ?? word;
    const ending = match[2] ?? '';
    if (ending === 's') return IS_BASES.has(base) ? [base, 'is'] : [base];
    return [base, ENDING_OF[ending] ?? ending];
  }
  return [word];
}

/** Writes the symbols of one whitespace-separated word as plain words. */
function spellOut(raw: string): string {
  let text = raw;
  for (let previous = ''; previous !== text;) {
    previous = text;
    text = text.replace(/(\d),(\d{3})/g, '$1$2');
  }
  return text
    .replace(/\$\s?(\d+(?:\.\d+)?)/g, ' $1 dollars ')
    .replace(/(\d)\s?%/g, '$1 percent ')
    .replace(/%/g, ' percent ')
    .replace(/\b(\d+)(?:st|nd|rd|th)\b/gi, '$1');
}

const stripEdges = (raw: string): string =>
  raw.replace(/^[^\p{L}\p{N}$]+/u, '').replace(/[^\p{L}\p{N}%]+$/u, '');

/** Whether the word is a name: a capital in the middle of a sentence, or after a title. */
function isName(raws: readonly string[], index: number): boolean {
  const raw = stripEdges(raws[index] ?? '');
  const lower = normalize(raw);
  if (lower === '' || TITLES[lower]) return false;
  const previous = normalize(raws[index - 1] ?? '');
  if (index > 0 && TITLES[previous]) return true;
  if (!/^\p{Lu}/u.test(raw) || index === 0) return false;
  if (/[.!?]["')\]]*$/.test(raws[index - 1] ?? '')) return false;
  if (/^i(?:'|$)/.test(lower) || MONTHS_AND_DAYS.has(lower)) return false;
  return true;
}

/** Joins runs of number words into digits: "two hundred five" becomes 205. */
function mergeNumbers(tokens: readonly Token[]): Token[] {
  const out: Token[] = [];
  let i = 0;
  while (i < tokens.length) {
    const first = tokens[i];
    if (!first) break;
    if (!NUMBER_VALUE.has(first.text) && first.text !== 'hundred' && first.text !== 'thousand') {
      out.push(first);
      i++;
      continue;
    }
    let total = 0;
    let current = 0;
    let j = i;
    for (; j < tokens.length; j++) {
      const word = tokens[j]?.text ?? '';
      if (word === 'hundred') {
        if (current === 0) current = 100;
        else if (current < 10) current *= 100;
        else break;
      } else if (word === 'thousand') {
        if (current > 0) {
          total += current * 1000;
          current = 0;
        } else if (total === 0) total = 1000;
        else break;
      } else {
        const value = NUMBER_VALUE.get(word);
        if (value === undefined) break;
        if (value === 0) {
          if (j > i) break;
          j++;
          break;
        }
        const room =
          value < 10
            ? current % 100 === 0 || (current % 100 >= 20 && current % 10 === 0)
            : current % 100 === 0;
        if (!room) break;
        current += value;
      }
    }
    const last = tokens[j - 1] ?? first;
    out.push({
      text: String(total + current),
      from: first.from,
      to: last.to,
      free: tokens.slice(i, j).every((t) => t.free),
    });
    i = j;
  }
  return out;
}

interface Tokenised {
  tokens: Token[];
  raws: string[];
}

function tokenise(text: string, findNames: boolean): Tokenised {
  const raws = text.split(/\s+/).filter((w) => w !== '');
  const spelled: Token[] = [];
  raws.forEach((raw, index) => {
    const free = findNames && isName(raws, index);
    const normalized = normalize(spellOut(raw));
    if (normalized === '') return;
    for (const word of normalized.split(' ')) {
      for (const part of expandWord(word))
        spelled.push({ text: part, from: index, to: index, free });
    }
  });
  return { tokens: mergeNumbers(spelled), raws };
}

function stems(word: string): string[] {
  const out = [word];
  for (const ending of ['es', 'ed', 'ing', 's']) {
    if (word.length > ending.length + 1 && word.endsWith(ending)) {
      out.push(word.slice(0, -ending.length));
    }
  }
  return out;
}

function isNear(a: string, b: string): boolean {
  const groupA = HOMOPHONE_GROUP.get(a);
  if (groupA !== undefined && groupA === HOMOPHONE_GROUP.get(b)) return true;
  if (/\d/.test(a) || /\d/.test(b)) return false;
  const shortest = Math.min(a.length, b.length);
  const longest = Math.max(a.length, b.length);
  if (shortest >= 4 && editDistance(a, b) <= (longest >= 8 ? 2 : 1)) return true;
  if (longest < 4) return false;
  const stemsB = stems(b);
  return stems(a).some((stem) => stem.length >= 2 && stemsB.includes(stem));
}

type Status = SpokenMark['status'];

/** The heard word each target word is paired with, from the best in-order alignment. */
function align(target: readonly Token[], heard: readonly Token[]): Status[] {
  const n = target.length;
  const m = heard.length;
  const width = m + 1;
  const weights: number[] = [];
  const statuses: Status[] = [];
  for (const t of target) {
    for (const h of heard) {
      const exact = t.text === h.text;
      const near = !exact && isNear(t.text, h.text);
      statuses.push(exact ? 'hit' : near ? 'near' : 'missed');
      weights.push(exact ? 1 : near ? (t.free ? 1 : NEAR_WEIGHT) : 0);
    }
  }
  const best = new Array<number>((n + 1) * width).fill(0);
  const at = (i: number, j: number) => best[i * width + j] ?? 0;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const pair = at(i - 1, j - 1) + (weights[(i - 1) * m + (j - 1)] ?? 0);
      best[i * width + j] = Math.max(at(i - 1, j), at(i, j - 1), pair);
    }
  }
  const result = new Array<Status>(n).fill('missed');
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    const weight = weights[(i - 1) * m + (j - 1)] ?? 0;
    if (weight > 0 && at(i, j) === at(i - 1, j - 1) + weight) {
      result[i - 1] = statuses[(i - 1) * m + (j - 1)] ?? 'missed';
      i--;
      j--;
    } else if (at(i - 1, j) === at(i, j)) i--;
    else j--;
  }
  return result;
}

function scoreOne(target: Tokenised, heard: readonly Token[]): SpokenScore {
  const statuses = align(target.tokens, heard);
  let sum = 0;
  let counted = 0;
  target.tokens.forEach((token, index) => {
    const status = statuses[index] ?? 'missed';
    if (status === 'missed') {
      if (!token.free) counted++;
      return;
    }
    counted++;
    sum += status === 'hit' || token.free ? 1 : NEAR_WEIGHT;
  });
  const score = counted === 0 ? 0 : Math.min(100, Math.round((100 * sum) / counted));

  const marks: SpokenMark[] = [];
  target.raws.forEach((raw, index) => {
    const covering = target.tokens
      .map((token, k) => ({ token, status: statuses[k] ?? 'missed' }))
      .filter(({ token }) => token.from <= index && index <= token.to);
    const word = stripEdges(raw);
    if (covering.length === 0 || word === '') return;
    const all = (status: Status) => covering.every((c) => c.status === status);
    const status: Status = all('hit') ? 'hit' : all('missed') ? 'missed' : 'near';
    const mark: SpokenMark = { word, status };
    if (covering.every((c) => c.token.free)) mark.free = true;
    marks.push(mark);
  });
  return { score, level: spokenLevel(score), marks };
}

/** The score of the best alternative; null when nothing was heard. */
export function scoreSpoken(target: string, alternatives: readonly string[]): SpokenScore | null {
  const wanted = tokenise(target, true);
  if (wanted.tokens.length === 0) return null;
  let best: SpokenScore | null = null;
  for (const alternative of alternatives) {
    const heard = tokenise(alternative, false).tokens;
    if (heard.length === 0) continue;
    const scored = scoreOne(wanted, heard);
    if (!best || scored.score > best.score) best = scored;
  }
  return best;
}
