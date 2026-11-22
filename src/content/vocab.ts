/**
 * Vocabulary profiling for the difficulty curve (see docs/specs/curriculum.md):
 * how much of each task's story the player already knows, which words are new,
 * and a 1–100 difficulty score. Pure functions over the word list files in
 * src/data/wordlists (passed in as text, so both tests and node scripts can use it).
 */
import type { Unit } from './types';

export interface WordListSources {
  ngslStats: string;
  ngslForms: string;
  supForms: string;
  tslStats: string;
  tslForms: string;
}

export interface WordLists {
  /** Word form (lowercase) -> lemma, NGSL first, then the supplementary list, then TSL. */
  lemmas: Map<string, string>;
  ngslRank: Map<string, number>;
  tslRank: Map<string, number>;
  supLemmas: Set<string>;
  /** Standard Frequency Index of each list word (both lists use the same scale). */
  sfi: Map<string, number>;
  /** NGSL SFI by rank (index 0 = rank 1), falling. */
  ngslSfiByRank: number[];
  ngslCount: number;
  tslCount: number;
}

export type Rank = { list: 'ngsl' | 'tsl'; rank: number } | { list: 'sup'; rank: 0 };

/** Drops a leading byte order mark (SUP_lemmatized.csv starts with one). */
const stripBom = (text: string) => (text.charCodeAt(0) === 0xfeff ? text.slice(1) : text);
const lines = (text: string) =>
  stripBom(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'));

/** "lemma,form,form…" rows. */
function addForms(lemmas: Map<string, string>, text: string): Set<string> {
  const heads = new Set<string>();
  for (const line of lines(text)) {
    const forms = line
      .split(',')
      .map((f) => f.trim().toLowerCase())
      .filter(Boolean);
    const lemma = forms[0];
    if (!lemma) continue;
    heads.add(lemma);
    for (const form of forms) if (!lemmas.has(form)) lemmas.set(form, lemma);
  }
  return heads;
}

/** "Lemma,Rank,SFI,…" rows after a header line; SFI goes into `sfi`. */
function ranks(text: string, sfi: Map<string, number>): Map<string, number> {
  const out = new Map<string, number>();
  for (const line of lines(text).slice(1)) {
    const [lemma, rank, index] = line.split(',');
    const n = Number(rank);
    if (!lemma || !Number.isFinite(n)) continue;
    const key = lemma.trim().toLowerCase();
    out.set(key, n);
    if (Number.isFinite(Number(index))) sfi.set(key, Number(index));
  }
  return out;
}

export function parseWordLists(src: WordListSources): WordLists {
  const lemmas = new Map<string, string>();
  addForms(lemmas, src.ngslForms);
  const supLemmas = addForms(lemmas, src.supForms);
  addForms(lemmas, src.tslForms);
  const sfi = new Map<string, number>();
  const ngslRank = ranks(src.ngslStats, sfi);
  const tslRank = ranks(src.tslStats, sfi);
  const ngslSfiByRank = [...ngslRank]
    .sort((a, b) => a[1] - b[1])
    .map(([lemma]) => sfi.get(lemma) ?? 0);
  return {
    lemmas,
    ngslRank,
    tslRank,
    supLemmas,
    sfi,
    ngslSfiByRank,
    ngslCount: ngslRank.size,
    tslCount: tslRank.size,
  };
}

export function lemmaOf(lists: WordLists, word: string): string {
  const w = word.toLowerCase();
  return lists.lemmas.get(w) ?? w;
}

/** Where a word's lemma sits in the lists, or undefined when it is in none of them. */
export function rankOf(lists: WordLists, word: string): Rank | undefined {
  const lemma = lemmaOf(lists, word);
  const ngsl = lists.ngslRank.get(lemma);
  if (ngsl !== undefined) return { list: 'ngsl', rank: ngsl };
  const tsl = lists.tslRank.get(lemma);
  if (tsl !== undefined) return { list: 'tsl', rank: tsl };
  if (lists.supLemmas.has(lemma)) return { list: 'sup', rank: 0 };
  return undefined;
}

/** Rank given to supplementary words (days, months, numbers) and to off-list words. */
const SUP_RANK = 300;
const OFF_LIST_RANK = 1000; // mostly concrete nouns with a picture (latte, muffin)

/**
 * A word's frequency on the NGSL rank scale. A TSL word gets the rank of the first
 * NGSL word that is no more frequent (by SFI): sandwich (SFI 57.7) lands near N1100,
 * not after the whole NGSL.
 */
export function equivalentRank(lists: WordLists, word: string): number {
  const r = rankOf(lists, word);
  if (!r) return OFF_LIST_RANK;
  if (r.list === 'sup') return SUP_RANK;
  if (r.list === 'ngsl') return r.rank;
  const index = lists.sfi.get(lemmaOf(lists, word));
  if (index === undefined) return lists.ngslCount + r.rank;
  const at = lists.ngslSfiByRank.findIndex((s) => s <= index);
  return at < 0 ? lists.ngslCount + r.rank : at + 1;
}

/** Band label used in reports and the syllabus: N123 (NGSL), T45 (TSL), S (supplementary), 外 (off-list). */
export function bandOf(lists: WordLists, word: string): string {
  const r = rankOf(lists, word);
  if (!r) return '外';
  if (r.list === 'sup') return 'S';
  return `${r.list === 'ngsl' ? 'N' : 'T'}${r.rank}`;
}

export interface Token {
  /** Lowercase, without clitics ('s, n't, 're…). */
  word: string;
  /** Capitalised but not at the start of a sentence (names, "I"). */
  midCapital: boolean;
}

const CONTRACTIONS: Record<string, string> = { "won't": 'will', "can't": 'can', "shan't": 'shall' };
/** A full stop after these does not end the sentence. */
const ABBREVIATIONS = new Set(['mr', 'mrs', 'ms', 'dr', 'st']);
const SPELLED = /^[a-z](-[a-z])+$/;

export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  const re = /[A-Za-z][A-Za-z'’-]*/g;
  let last = 0;
  let prev: string | undefined;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    const raw = m[0].replace(/[’]/g, "'").replace(/['-]+$/, '');
    const gap = text.slice(last, m.index);
    last = m.index + m[0].length;
    const startsSentence =
      prev === undefined || (/[.!?]/.test(gap) && !(gap.trim() === '.' && ABBREVIATIONS.has(prev)));
    const lower = raw.toLowerCase();
    const word = CONTRACTIONS[lower] ?? lower.split("'")[0] ?? lower;
    prev = word;
    // Titles belong to a name; spelled-out letters (B-E-L-L) and lone letters are not words.
    if (!word || ABBREVIATIONS.has(word) || SPELLED.test(word)) continue;
    if (word.length === 1 && word !== 'a' && word !== 'i') continue;
    tokens.push({ word, midCapital: !startsSentence && /^[A-Z]/.test(raw) });
  }
  return tokens;
}

export interface TaskProfile {
  unitId: string;
  taskId: string;
  /** New chunks + words + minimal pairs. */
  newItems: number;
  /** Lemmas of this task's items that were not known before, with their band. */
  newLemmas: { lemma: string; band: string }[];
  /** Bands of the words and minimal-pair words this task teaches (for reading). */
  wordBands: string[];
  /** The same words on the NGSL rank scale (see equivalentRank). */
  wordRanks: number[];
  /**
   * The words this task teaches (not the minimal pairs, whose difficulty is the sound
   * contrast) on the NGSL rank scale, with pictured words capped at PICTURED_RANK_CAP.
   */
  levelRanks: number[];
  /** Mean of levelRanks over this task and the LEVEL_WINDOW - 1 tasks before it. */
  freqLevel: number;
  /** Mean words per new chunk: what the learner has to arrange and say. */
  chunkWords: number;
  lines: number;
  /** Mean words per story line (names left out). */
  avgLineWords: number;
  /** Words in the story (names left out). */
  tokens: number;
  /** Share of story words that are known or taught in this task. */
  coverage: number;
  /** Story lemmas that are neither known nor taught here, sorted. */
  unplanned: string[];
  score: number;
  /**
   * A review-only task (role-play): it teaches nothing, so it stays out of the score
   * curve. Its story is still checked for untaught words.
   */
  review: boolean;
}

/**
 * A concrete word with a pixel icon (not marked abstract) counts as at most this rank:
 * frequency lists underrate picturable nouns (lamp, sugar, sheep), which the picture
 * makes easy to learn.
 */
export const PICTURED_RANK_CAP = 1000;
/** Tasks the word level is averaged over: one task teaches only 2-5 words, too few to rate alone. */
export const LEVEL_WINDOW = 3;

export interface ProfileOptions {
  /** NGSL words up to this rank count as known from the start (default 100). */
  starterRank?: number;
}

/**
 * Walks the units in play order. Known = NGSL top `starterRank` + every lemma of
 * the items taught in earlier tasks; a task's own items count as taught for its story.
 */
export function profileUnits(
  units: readonly Unit[],
  lists: WordLists,
  { starterRank = 100 }: ProfileOptions = {},
): TaskProfile[] {
  const known = new Set<string>();
  for (const [lemma, rank] of lists.ngslRank) if (rank <= starterRank) known.add(lemma);
  const profiles: TaskProfile[] = [];
  const mean = (xs: readonly number[]) =>
    xs.length ? xs.reduce((sum, x) => sum + x, 0) / xs.length : 0;

  for (const unit of units) {
    for (const task of unit.tasks) {
      const pairs = (task.newPairIds ?? []).flatMap((id) => {
        const pair = unit.pairs?.find((p) => p.id === id);
        return pair ? [pair.a.en, pair.b.en] : [];
      });
      const taught = task.newWordIds.flatMap((id) => unit.words.find((w) => w.id === id) ?? []);
      const words = [...taught.map((w) => w.en), ...pairs];
      const levelRanks = taught.map((w) => {
        const rank = equivalentRank(lists, rarest(lists, w.en));
        return w.abstract ? rank : Math.min(rank, PICTURED_RANK_CAP);
      });
      const chunkTexts = task.newChunkIds.flatMap(
        (id) => unit.chunks.find((c) => c.id === id)?.en ?? [],
      );
      const itemTexts = [...chunkTexts, ...words];
      const target = new Set(
        itemTexts.flatMap((t) => tokenize(t).map((tok) => lemmaOf(lists, tok.word))),
      );
      const covered = (lemma: string) => known.has(lemma) || target.has(lemma);

      let tokens = 0;
      let hits = 0;
      const unplanned = new Set<string>();
      for (const line of task.scene) {
        for (const tok of tokenize(line.en)) {
          const lemma = lemmaOf(lists, tok.word);
          // A capital mid-sentence on a word not taught yet is a name (Bell, Mei), even when
          // the word exists (a bell); days and months are words.
          const isName = tok.midCapital && !covered(lemma) && !lists.supLemmas.has(lemma);
          if (isName) continue;
          tokens += 1;
          if (covered(lemma)) hits += 1;
          else unplanned.add(lemma);
        }
      }

      const profile: TaskProfile = {
        unitId: unit.id,
        taskId: task.id,
        newItems: task.newChunkIds.length + task.newWordIds.length + (task.newPairIds?.length ?? 0),
        newLemmas: [...target]
          .filter((lemma) => !known.has(lemma))
          .map((lemma) => ({ lemma, band: bandOf(lists, lemma) })),
        // A multi-word item ("trash can") is rated by its rarest word.
        wordBands: words.map((w) => bandOf(lists, rarest(lists, w))),
        wordRanks: words.map((w) => equivalentRank(lists, rarest(lists, w))),
        levelRanks,
        freqLevel: mean([
          ...profiles
            .filter((p) => !p.review)
            .slice(-(LEVEL_WINDOW - 1))
            .flatMap((p) => p.levelRanks),
          ...levelRanks,
        ]),
        chunkWords: mean(chunkTexts.map((text) => tokenize(text).length)),
        lines: task.scene.length,
        avgLineWords: task.scene.length ? tokens / task.scene.length : 0,
        tokens,
        coverage: tokens ? hits / tokens : 1,
        unplanned: [...unplanned].sort(),
        score: 0,
        review: task.kind === 'roleplay',
      };
      profile.score = difficultyScore(profile);
      profiles.push(profile);
      for (const lemma of target) known.add(lemma);
    }
  }
  return profiles;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** The least frequent word of an item ("trash can" -> "trash"). */
function rarest(lists: WordLists, text: string): string {
  const words = tokenize(text).map((t) => t.word);
  return words.reduce(
    (a, b) => (equivalentRank(lists, b) > equivalentRank(lists, a) ? b : a),
    words[0] ?? text,
  );
}

/**
 * Difficulty 1–100 (version 1, to be calibrated with play data). Each knob is
 * scaled to 0–1 against the end of Act 4, then weighted: new items 25%, word level 20%,
 * chunk length 20%, line length 20%, story length 15%.
 *
 * Untaught story words are not a knob: the story rule caps them (curriculum.md, rule 3),
 * and scoring them would reward adding more.
 */
export function difficultyScore(
  p: Pick<TaskProfile, 'newItems' | 'freqLevel' | 'chunkWords' | 'avgLineWords' | 'lines'>,
): number {
  const items = clamp01(p.newItems / 14);
  // 0 at the most frequent words, 1 at the end of the NGSL (TSL words sit inside it by SFI).
  const level = clamp01(p.freqLevel / 2809);
  const chunk = clamp01((p.chunkWords - 2) / 10);
  const length = clamp01((p.avgLineWords - 3) / 17);
  const story = clamp01((p.lines - 3) / 9);
  const raw = 0.25 * items + 0.2 * level + 0.2 * chunk + 0.2 * length + 0.15 * story;
  return Math.min(100, Math.max(1, Math.round(1 + 99 * raw)));
}

/** Smoothness rules (docs/specs/curriculum.md, 平滑規則), Act 1 values. */
export const SMOOTHNESS = {
  /** Stories this many words long are judged by coverage; shorter ones by a count. */
  longText: 50,
  minCoverage: 0.98,
  /** Untaught words allowed in a short story... */
  maxUnplanned: 1,
  /** ...each at least this frequent (NGSL rank scale). */
  maxUnplannedRank: 1000,
  /** The score may rise at most this much from one task to the next... */
  maxRise: 3,
  /** ...and drop at most this much (an easier task is a breather; a new place may start lower). */
  maxDrop: 5,
  maxItemGrowth: 1,
} as const;

/** The last profile before index `i` that is not review-only, if any. */
export function previousTeaching(
  profiles: readonly TaskProfile[],
  i: number,
): TaskProfile | undefined {
  for (let j = i - 1; j >= 0; j--) {
    const p = profiles[j];
    if (p && !p.review) return p;
  }
  return undefined;
}

/** Every break of the smoothness rules, in play order, as one Chinese line each. */
export function smoothnessBreaks(profiles: readonly TaskProfile[], lists: WordLists): string[] {
  const S = SMOOTHNESS;
  const pct = (n: number) => `${(n * 100).toFixed(0)}%`;
  const breaks: string[] = [];
  profiles.forEach((p, i) => {
    // Review-only tasks are left out of the curve: compare with the last task that teaches.
    const prev = p.review ? undefined : previousTeaching(profiles, i);
    const where = `${p.unitId}/${p.taskId}`;
    if (p.tokens >= S.longText) {
      if (p.coverage < S.minCoverage) {
        breaks.push(`${where}：學過的字 ${pct(p.coverage)}，低於 ${pct(S.minCoverage)}`);
      }
    } else {
      if (p.unplanned.length > S.maxUnplanned) {
        breaks.push(
          `${where}：劇情有 ${p.unplanned.length} 個沒教過的字，最多 ${S.maxUnplanned} 個（${p.unplanned.join('、')}）`,
        );
      }
      const rare = p.unplanned.filter((w) => equivalentRank(lists, w) > S.maxUnplannedRank);
      if (rare.length) {
        breaks.push(
          `${where}：沒教過的字不在 NGSL 前 ${S.maxUnplannedRank} 名：${rare.join('、')}`,
        );
      }
    }
    if (!prev) return;
    const delta = p.score - prev.score;
    if (delta > S.maxRise || delta < -S.maxDrop) {
      breaks.push(`${where}：分數變化 ${delta}，可以 -${S.maxDrop} 到 +${S.maxRise}`);
    }
    if (p.newItems - prev.newItems > S.maxItemGrowth) {
      breaks.push(
        `${where}：新項目從 ${prev.newItems} 增加到 ${p.newItems}，一次最多多 ${S.maxItemGrowth} 個`,
      );
    }
  });
  return breaks;
}
