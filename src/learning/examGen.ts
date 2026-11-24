/**
 * Generators of the exam's questions (docs/specs/curriculum.md): 應答題, 聽力填空,
 * 文法選句, 價目表 and the sentence generator's 句子填空 and 文法填空. Pure: the same seed
 * gives the same questions, and nothing here reads the real data except `generatedForSection`
 * at the bottom (the one entry the exam screen calls). No new audio is made here: every
 * sentence already has a clip, and the ids below are the ones scripts/gen-audio.mjs writes.
 *
 * Audio ids:
 *   story line          `<unit>.line.<lineId>`
 *   verified bank item  prompt `bank<N>.respond.<id>`, reply i `bank<N>.response.<id>_<i>`
 *                       (i = place in [answer, ...wrong], so the right reply is always `_0`)
 *   sentence pool item  prompt `pool<N>.respond.<id>`, reply i `pool<N>.response.<id>_<i>`
 *                       (i = place in `responses`)
 * A question never holds more than 3 replies, but keeps the content index in each id.
 *
 * When the data cannot supply a kind's full count the generator returns what exists and
 * `generatedShortfall` says how many are missing, so the hub can show 準備中. It never throws.
 */
import { ACTS, actOf as actOfAct } from '../content/acts';
import { examAct, EXAM_PLAN, type ExamId, type GeneratedCounts } from '../content/exam';
import { grammarPointOf } from '../content/grammar';
import {
  COMPATIBLE,
  type AnswerType,
  type BlankKind,
  splitLexiconFile,
  type LexClass,
  type Lexicon,
  type LexiconFile,
  type LineTag,
  type Pattern,
  type PoolSentence,
  type QuestionType,
  type RespondBankItem,
} from '../content/lexicon';
import { LEXICONS, PATTERNS, RESPOND_BANK, SENTENCE_POOL } from '../content/lexicons';
import type { Role, SceneLine, Unit, Word } from '../content/types';
import { UNITS } from '../content/units';
import { tokenize } from '../content/vocab';
import examExcludeFile from '../data/examExclude.json';
import { makeRng, shuffle, shuffledOptions, type Rng } from './gen/common';
import {
  NO_ITEM,
  type ChooseReplyQuestion,
  type ClozeQuestion,
  type FillQuestion,
  type Question,
  type RespondQuestion,
  type SignQuestion,
} from './questions';
import { buildSentence, sentenceFill, type Qa } from './sentenceGen';

/** Sentence ids that must not become questions (src/data/examExclude.json). */
export interface ExamExclude {
  respond: string[];
  cloze: string[];
}

/** The kinds a section can have generated, in the order they are built and dealt. */
export const GENERATED_KINDS = [
  'respond',
  'listenCloze',
  'grammarPick',
  'priceList',
  'sentenceFill',
  'grammarFill',
] as const satisfies readonly (keyof GeneratedCounts)[];

export type GeneratedKind = (typeof GENERATED_KINDS)[number];

/** One kind the data could not fill. */
export interface KindShortfall {
  kind: GeneratedKind;
  wanted: number;
  got: number;
}

/** Everything the generators read, already narrowed to the exam's Act. */
export interface ExamGenData {
  /** Tagged story lines by line id (LINE_TAGS). */
  lineTags: Record<string, LineTag>;
  /** `src/data/sentences/act<N>.json`. */
  sentencePool: readonly PoolSentence[];
  /** `src/data/responds/act<N>.json`. */
  respondBank: readonly RespondBankItem[];
  /** Lexicons by unit id (LEXICONS). */
  lexicons: Record<string, Lexicon>;
  /** `src/data/patterns/act<N>.json`. */
  patterns: readonly Pattern[];
  exclude: ExamExclude;
  /** The one-line Chinese note of a grammar point, shown after a fill. */
  grammarNoteOf?: (grammarId: string) => string | undefined;
}

export interface GenerateInput {
  exam: ExamId;
  sectionId: string;
  seed: number;
  /** Units of this exam's Act and the earlier Acts, in play order. */
  units: readonly Unit[];
  data: ExamGenData;
  /** The Act number of a unit id; lets the current Act's lines come before earlier ones. */
  actOf?: (unitId: string) => number;
}

export interface GenerateResult {
  questions: Question[];
  /** Only the kinds that came up short (empty when the section is complete). */
  shortfall: KindShortfall[];
}

/* ---------- small helpers ---------- */

const norm = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** A seed for one part of one section, so adding a kind never changes another. */
function seedFor(seed: number, ...parts: string[]): number {
  let h = (seed >>> 0) ^ 0x9e3779b9;
  for (const part of parts) {
    for (let i = 0; i < part.length; i++) h = Math.imul(h ^ part.charCodeAt(i), 16777619) >>> 0;
    h = Math.imul(h ^ 0xff, 16777619) >>> 0;
  }
  return h;
}

/**
 * Key of a line tag in `ExamGenData.lineTags`. Line ids (`t1_1`) repeat from one location
 * to the next, so a map of tags over all locations is keyed `<unitId>/<lineId>`; a plain
 * line id is the fallback (a map of one location's lines).
 */
export const lineTagKey = (unitId: string, lineId: string): string => `${unitId}/${lineId}`;

function tagOf(tags: Record<string, LineTag>, unitId: string, lineId: string): LineTag | undefined {
  return tags[lineTagKey(unitId, lineId)] ?? tags[lineId];
}

const capital = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

/** The generated questions share what they have used, so a section never repeats a sentence. */
interface Used {
  texts: Set<string>;
}

/** `word` as a whole word in `text`, any case: the text around it and the word as written there. */
function cutAtWord(
  text: string,
  word: string,
): { before: string; found: string; after: string } | null {
  if (!/^[a-z]+(['-][a-z]+)*$/i.test(word)) return null;
  const match = new RegExp(`(?<![a-z'-])${word}(?![a-z'-])`, 'i').exec(text);
  if (!match) return null;
  return {
    before: text.slice(0, match.index),
    found: match[0],
    after: text.slice(match.index + match[0].length),
  };
}

/* ---------- 應答題 ---------- */

/** Replies in one question. */
const REPLIES = 3;

/** A reply as the generator sees it: its place in the item's content and its text. */
interface Reply {
  index: number;
  en: string;
  zh: string;
}

interface RespondSource {
  /** Item id (`a1_r01`, a pool id). */
  id: string;
  /** The audio prefix: `bank1` or `pool1`. */
  prefix: string;
  role: Role;
  en: string;
  zh: string;
  right: Reply;
  wrong: Reply[];
}

/** Whether a wrong reply type can never answer the question (and is not universal). */
function wrongByType(qtype: QuestionType, atype: AnswerType): boolean {
  const fits = COMPATIBLE[qtype];
  return !!fits && atype !== 'universal' && !fits.includes(atype);
}

/** A verified bank item as a source, or null when it breaks a rule (never throws). */
function bankSource(item: RespondBankItem, act: number): RespondSource | null {
  const { question, answer, wrong } = item;
  if (item.verified < 2 || !question?.en || !answer?.en || !Array.isArray(wrong)) return null;
  if (question.role === 'guide' || answer.atype === 'universal') return null;
  if (wrong.length < REPLIES - 1) return null;
  const seen = new Set([norm(answer.en)]);
  for (const w of wrong) {
    if (!w?.en || seen.has(norm(w.en)) || !wrongByType(question.qtype, w.atype)) return null;
    seen.add(norm(w.en));
  }
  return {
    id: item.id,
    prefix: `bank${act}`,
    role: question.role as Role,
    en: question.en,
    zh: question.zh ?? '',
    right: { index: 0, en: answer.en, zh: answer.zh ?? '' },
    wrong: wrong.map((w, i) => ({ index: i + 1, en: w.en, zh: w.zh ?? '' })),
  };
}

/** A pool question and answer pair as a source, or null. */
function poolSource(item: PoolSentence, act: number): RespondSource | null {
  const { responses, answer } = item;
  if (item.kind !== 'qa' || !item.en || !Array.isArray(responses)) return null;
  if (answer === undefined || !Number.isInteger(answer) || !responses[answer]) return null;
  const seen = new Set<string>();
  const all: Reply[] = [];
  for (let i = 0; i < responses.length; i++) {
    const en = responses[i];
    if (!en || seen.has(norm(en))) return null;
    seen.add(norm(en));
    all.push({ index: i, en, zh: '' });
  }
  const wrong = all.filter((r) => r.index !== answer);
  if (wrong.length < REPLIES - 1) return null;
  return {
    id: item.id,
    prefix: `pool${act}`,
    role: 'announcer',
    en: item.en,
    zh: '',
    right: all[answer] as Reply,
    wrong,
  };
}

/** Keeps wrong replies of different types first (bank items carry them), then the rest. */
function pickWrong(source: RespondSource, types: (AnswerType | undefined)[], rng: Rng): Reply[] {
  const order = shuffle(source.wrong, rng);
  const seenTypes = new Set<AnswerType>();
  const first: Reply[] = [];
  const rest: Reply[] = [];
  for (const reply of order) {
    const type = types[reply.index - 1];
    if (type && !seenTypes.has(type)) {
      seenTypes.add(type);
      first.push(reply);
    } else rest.push(reply);
  }
  return [...first, ...rest].slice(0, REPLIES - 1);
}

function respondQuestion(
  source: RespondSource,
  types: (AnswerType | undefined)[],
  rng: Rng,
): RespondQuestion {
  const replies = [source.right, ...pickWrong(source, types, rng)];
  return {
    kind: 'respond',
    respondId: source.id,
    prompt: {
      role: source.role,
      audioId: `${source.prefix}.respond.${source.id}`,
      en: source.en,
      zh: source.zh,
    },
    options: shuffle(
      replies.map((r) => ({
        id: `o${r.index}`,
        audioId: `${source.prefix}.response.${source.id}_${r.index}`,
        en: r.en,
        zh: r.zh,
      })),
      rng,
    ),
    correctId: `o${source.right.index}`,
    index: 0,
    total: 0,
    itemId: NO_ITEM,
  };
}

function genRespond(input: GenerateInput, want: number, rng: Rng, used: Used): Question[] {
  const act = examAct(input.exam);
  const { respondBank, sentencePool, exclude } = input.data;
  const skipped = new Set(exclude.respond);
  const sources: { source: RespondSource; types: (AnswerType | undefined)[] }[] = [];
  for (const item of shuffle(respondBank, rng)) {
    const source = skipped.has(item.id) ? null : bankSource(item, act);
    if (source) sources.push({ source, types: item.wrong.map((w) => w.atype) });
  }
  for (const item of shuffle(sentencePool, rng)) {
    const source = skipped.has(item.id) ? null : poolSource(item, act);
    if (source) sources.push({ source, types: [] });
  }
  const out: RespondQuestion[] = [];
  for (const { source, types } of sources) {
    if (out.length >= want) break;
    const key = norm(source.en);
    if (used.texts.has(key)) continue;
    used.texts.add(key);
    out.push(respondQuestion(source, types, rng));
  }
  return out.map((q, index) => ({ ...q, index, total: out.length }));
}

/* ---------- 聽力填空 ---------- */

/** A plain taught word (one word of letters). */
interface TaughtWord {
  id: string;
  en: string;
  lower: string;
  abstract: boolean;
}

/** Words too small or too common to be worth blanking. */
const NOT_BLANKED = new Set(['the', 'and', 'you', 'are', 'for', 'not', 'but', 'its', 'too']);

function taughtWords(units: readonly Unit[]): TaughtWord[] {
  const seen = new Set<string>();
  const out: TaughtWord[] = [];
  for (const unit of units) {
    for (const word of unit.words as Word[]) {
      const lower = word.en.toLowerCase();
      if (!/^[a-z]+$/.test(lower) || seen.has(lower)) continue;
      seen.add(lower);
      out.push({ id: word.id, en: word.en, lower, abstract: !!word.abstract });
    }
  }
  return out;
}

/** A rough stem, for "never the same word in another form". */
function stemOf(word: string): string {
  let s = word.toLowerCase();
  for (const suffix of ['ing', 'ed', 'es', 's', 'ly', 'er']) {
    if (s.length - suffix.length >= 3 && s.endsWith(suffix)) {
      s = s.slice(0, -suffix.length);
      break;
    }
  }
  return s.replace(/e$/, '');
}

function related(a: string, b: string): boolean {
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  return stemOf(a) === stemOf(b) || (short.length >= 4 && long.startsWith(short));
}

/** The lexicon entry of every word id, over the units' lexicons. */
function entriesOf(lexicons: Record<string, Lexicon>, units: readonly Unit[]): Lexicon {
  const all: Lexicon = {};
  for (const unit of units) Object.assign(all, lexicons[unit.id] ?? {});
  return all;
}

/**
 * Three wrong words for a blank: taught, not in the line, never a form of the answer, the
 * same word class when the lexicon knows it and never the same meaning class (that could
 * also fit); the same `abstract` flag and a similar length first.
 */
function wrongWords(
  answer: string,
  lineWords: ReadonlySet<string>,
  words: readonly TaughtWord[],
  entries: Lexicon,
  rng: Rng,
): string[] | null {
  const lower = answer.toLowerCase();
  const own = words.find((w) => w.lower === lower);
  const ownEntry = own ? entries[own.id] : undefined;
  const fits = (d: TaughtWord): boolean => {
    if (d.lower === lower || lineWords.has(d.lower) || related(lower, d.lower)) return false;
    const entry = entries[d.id];
    if (!ownEntry || !entry || entry.skip || ownEntry.skip) return true;
    if (ownEntry.pos !== entry.pos) return false;
    return !(ownEntry.cls && entry.cls && ownEntry.cls === entry.cls);
  };
  const key = (d: TaughtWord): number =>
    (own && d.abstract !== own.abstract ? 100 : 0) + Math.abs(d.lower.length - lower.length);
  const ranked = shuffle(words.filter(fits), rng).sort((a, b) => key(a) - key(b));
  const picked: string[] = [];
  for (const d of ranked) {
    if (picked.some((p) => related(p, d.lower))) continue;
    picked.push(d.lower);
    if (picked.length === 3) return picked;
  }
  return null;
}

interface ClozeContext {
  words: readonly TaughtWord[];
  entries: Lexicon;
}

function clozeQuestion(
  audioId: string,
  text: string,
  zh: string,
  word: string,
  lineWords: ReadonlySet<string>,
  ctx: ClozeContext,
  rng: Rng,
): ClozeQuestion | null {
  const cut = cutAtWord(text, word);
  const wrong = cut ? wrongWords(cut.found, lineWords, ctx.words, ctx.entries, rng) : null;
  if (!cut || !wrong) return null;
  const label = /^[A-Z]/.test(cut.found) ? capital : (s: string) => s;
  return {
    kind: 'cloze',
    audioId,
    before: cut.before,
    after: cut.after,
    answer: cut.found,
    zh,
    options: shuffledOptions([cut.found, ...wrong.map(label)], rng),
    correctId: 'o0',
    itemId: NO_ITEM,
  };
}

/** Units of the exam's own Act first (each group in a shuffled order), then the earlier ones. */
function currentActFirst(input: GenerateInput, rng: Rng): Unit[] {
  const { actOf, units, exam } = input;
  if (!actOf) return shuffle(units, rng);
  const act = examAct(exam);
  return [
    ...shuffle(
      units.filter((u) => actOf(u.id) === act),
      rng,
    ),
    ...shuffle(
      units.filter((u) => actOf(u.id) !== act),
      rng,
    ),
  ];
}

type ClozeTry = () => ClozeQuestion | null;

function storyTries(input: GenerateInput, ctx: ClozeContext, rng: Rng): ClozeTry[] {
  const skipped = new Set(input.data.exclude.cloze);
  const taught = new Set(ctx.words.map((w) => w.lower));
  const tries: ClozeTry[] = [];
  for (const unit of currentActFirst(input, rng)) {
    const lines = unit.tasks.flatMap((t) => t.scene as SceneLine[]);
    for (const line of shuffle(lines, rng)) {
      const audioId = `${unit.id}.line.${line.id}`;
      if (skipped.has(line.id) || skipped.has(audioId)) continue;
      if (tagOf(input.data.lineTags, unit.id, line.id)?.atype === 'universal') continue;
      tries.push(() => {
        const tokens = tokenize(line.en);
        const blankable = tokens.filter(
          (t) =>
            !t.midCapital && t.word.length >= 3 && taught.has(t.word) && !NOT_BLANKED.has(t.word),
        );
        const target = blankable[Math.floor(rng() * blankable.length)];
        if (!target) return null;
        const lineWords = new Set(tokens.map((t) => t.word));
        return clozeQuestion(audioId, line.en, line.zh, target.word, lineWords, ctx, rng);
      });
    }
  }
  return tries;
}

function poolTries(input: GenerateInput, ctx: ClozeContext, rng: Rng): ClozeTry[] {
  const act = examAct(input.exam);
  const skipped = new Set(input.data.exclude.cloze);
  const tries: ClozeTry[] = [];
  for (const item of shuffle(input.data.sentencePool, rng)) {
    if (item.kind !== 'statement' || !item.blankWord || skipped.has(item.id)) continue;
    const word = item.blankWord;
    const lineWords = new Set(tokenize(item.en).map((t) => t.word));
    tries.push(() =>
      clozeQuestion(`pool${act}.respond.${item.id}`, item.en, '', word, lineWords, ctx, rng),
    );
  }
  return tries;
}

function genListenCloze(input: GenerateInput, want: number, rng: Rng, used: Used): Question[] {
  const words = taughtWords(input.units);
  const ctx = { words, entries: entriesOf(input.data.lexicons, input.units) };
  const sides = [storyTries(input, ctx, rng), poolTries(input, ctx, rng)];
  const at = [0, 0];
  const out: Question[] = [];
  const left = (side: number) => (sides[side] as ClozeTry[]).length - (at[side] as number);
  // Half from the story, half from the pool; either side fills in for the other.
  for (let turn = 0; out.length < want && left(0) + left(1) > 0; turn = out.length) {
    const side = left(turn % 2) > 0 ? turn % 2 : 1 - (turn % 2);
    const make = (sides[side] as ClozeTry[])[at[side] as number];
    at[side] = (at[side] as number) + 1;
    const q = make?.();
    if (!q) continue;
    const key = norm(q.before + q.answer + q.after);
    if (used.texts.has(key)) continue;
    used.texts.add(key);
    out.push(q);
  }
  return out;
}

/* ---------- 文法選句 ---------- */

/** Wrong sentences to show beside the right one. */
const PICK_WRONG = 3;

/** One question per chunk that has tagged wrong versions, in the story's own words. */
function genGrammarPick(input: GenerateInput, want: number, rng: Rng, used: Used): Question[] {
  const out: ChooseReplyQuestion[] = [];
  for (const unit of currentActFirst(input, rng)) {
    for (const task of shuffle(unit.tasks, rng)) {
      for (const [at, line] of shuffle([...task.scene.entries()], rng)) {
        const previous = task.scene[at - 1];
        if (out.length >= want) return out;
        if (line.speaker !== 'player' || previous?.speaker !== 'npc' || !line.chunkId) continue;
        const chunk = unit.chunks.find((c) => c.id === line.chunkId);
        if (!chunk || used.texts.has(norm(chunk.en))) continue;
        const taken = new Set([chunk.en, ...(chunk.accept ?? [])]);
        const wrong: { id: string; text: string; error: string }[] = [];
        (chunk.distractors ?? []).forEach((d, i) => {
          if (taken.has(d.text)) return;
          taken.add(d.text);
          wrong.push({ id: `${chunk.id}.d${i}`, text: d.text, error: d.error });
        });
        // Different kinds of mistake first, so the options do not all fail the same way.
        const seenErrors = new Set<string>();
        const distinct = shuffle(wrong, rng).filter(
          (w) => !seenErrors.has(w.error) && !!seenErrors.add(w.error),
        );
        const rest = shuffle(wrong, rng).filter((w) => !distinct.includes(w));
        const picked = [...distinct, ...rest].slice(0, PICK_WRONG);
        if (picked.length < 2) continue;
        used.texts.add(norm(chunk.en));
        out.push({
          kind: 'choose-reply',
          npcRole: previous.role,
          npcAudioId: `${unit.id}.line.${previous.id}`,
          npcText: previous.en,
          options: shuffle([{ id: chunk.id, text: chunk.en }, ...picked], rng),
          correctId: chunk.id,
          itemId: NO_ITEM,
        });
      }
    }
  }
  return out;
}

/* ---------- 價目表 ---------- */

interface PriceRow {
  word: Word;
  price: number;
}

interface PriceTemplate {
  id: string;
  /** Words the question needs: all must be taught. */
  needs: (rows: PriceRow[], target: PriceRow) => string[];
  question: (rows: PriceRow[], target: PriceRow) => { en: string; zh: string };
  /** The row the question is about (rows have different prices). */
  target: (rows: PriceRow[]) => PriceRow;
  /** `label`: the options are the items; `price`: the options are the prices. */
  options: 'label' | 'price';
}

const byPrice = (rows: PriceRow[]): PriceRow[] => [...rows].sort((a, b) => a.price - b.price);
const money = (n: number): string => `$${n}`;

const PRICE_TEMPLATES: PriceTemplate[] = [
  {
    id: 'most',
    needs: () => ['which', 'one', 'costs', 'the', 'most'],
    question: () => ({ en: 'Which one costs the most?', zh: '哪一個最貴？' }),
    target: (rows) => byPrice(rows).at(-1) as PriceRow,
    options: 'label',
  },
  {
    id: 'least',
    needs: () => ['which', 'one', 'costs', 'the', 'least'],
    question: () => ({ en: 'Which one costs the least?', zh: '哪一個最便宜？' }),
    target: (rows) => byPrice(rows)[0] as PriceRow,
    options: 'label',
  },
  {
    id: 'is',
    needs: () => ['which', 'one', 'is'],
    question: (_rows, t) => ({
      en: `Which one is ${money(t.price)}?`,
      zh: `哪一個是 ${money(t.price)}？`,
    }),
    target: (rows) => rows[1] as PriceRow,
    options: 'label',
  },
  {
    id: 'howmuch',
    needs: (_rows, t) => ['how', 'much', 'is', 'the', t.word.en.toLowerCase()],
    question: (_rows, t) => ({
      en: `How much is the ${t.word.en.toLowerCase()}?`,
      zh: `${t.word.zh}多少錢？`,
    }),
    target: (rows) => rows[2] as PriceRow,
    options: 'price',
  },
];

const SELLABLE: readonly LexClass[] = [
  'object',
  'food',
  'drink',
  'clothing',
  'device',
  'document',
  'vehicle',
];

/** Concrete nouns taught so far: not abstract, one word, a noun when the lexicon says. */
function priceItems(units: readonly Unit[], entries: Lexicon): Word[] {
  const seen = new Set<string>();
  const out: Word[] = [];
  for (const unit of units) {
    for (const word of unit.words as Word[]) {
      const lower = word.en.toLowerCase();
      const entry = entries[word.id];
      // When the lexicon knows the word, only things one can buy (not a lake or a number).
      const notThing = entry && (entry.pos !== 'n' || !SELLABLE.includes(entry.cls as LexClass));
      if (word.abstract || !/^[a-z]{3,}$/.test(lower) || seen.has(lower) || notThing) continue;
      seen.add(lower);
      out.push(word);
    }
  }
  return out;
}

/** Every word of the story, chunks and word lists: what the question text may use. */
function taughtTokens(units: readonly Unit[]): Set<string> {
  const texts = units.flatMap((u) => [
    ...u.words.map((w) => w.en),
    ...u.chunks.map((c) => c.en),
    ...u.tasks.flatMap((t) => t.scene.map((l) => l.en)),
  ]);
  return new Set(texts.flatMap((text) => tokenize(text).map((t) => t.word)));
}

function genPriceList(input: GenerateInput, want: number, rng: Rng, used: Used): Question[] {
  const entries = entriesOf(input.data.lexicons, input.units);
  const items = priceItems(input.units, entries);
  const taught = taughtTokens(input.units);
  const out: SignQuestion[] = [];
  const templates = shuffle(PRICE_TEMPLATES, rng);
  for (let attempt = 0; attempt < want * 20 && out.length < want && items.length >= 4; attempt++) {
    const prices = shuffle(
      Array.from({ length: 58 }, (_, i) => i + 3),
      rng,
    ).slice(0, 4);
    const rows = shuffle(items, rng)
      .slice(0, 4)
      .map((word, i) => ({ word, price: prices[i] as number }));
    const template = templates[attempt % templates.length] as PriceTemplate;
    const target = template.target(rows);
    if (!template.needs(rows, target).every((w) => taught.has(w))) continue;
    const key = `price:${template.id}:${rows
      .map((r) => r.word.id)
      .sort()
      .join(',')}`;
    if (used.texts.has(key)) continue;
    used.texts.add(key);
    const labels =
      template.options === 'label'
        ? rows.map((r) => capital(r.word.en))
        : rows.map((r) => money(r.price));
    const answer = rows.indexOf(target);
    const { en, zh } = template.question(rows, target);
    out.push({
      kind: 'read-sign',
      rows: rows.map((r) => ({ label: capital(r.word.en), value: money(r.price) })),
      en,
      zh,
      options: shuffledOptions(labels, rng),
      correctId: `o${answer}`,
      itemId: NO_ITEM,
    });
  }
  return out;
}

/* ---------- 句子填空 and 文法填空 ---------- */

const GRAMMAR_BLANKS: readonly BlankKind[] = ['verb-form', 'prep', 'article', 'number'];
const SENSE_BLANKS: readonly BlankKind[] = ['object', 'subject'];
/** Blanks whose options are forms of one word (the screen says so). */
const FORM_BLANKS: readonly BlankKind[] = ['verb-form', 'number'];

function genFills(
  input: GenerateInput,
  want: number,
  rng: Rng,
  used: Used,
  kinds: readonly BlankKind[],
): Question[] {
  const patterns = shuffle(
    input.data.patterns.filter((p) => p.blanks.some((b) => kinds.includes(b))),
    rng,
  );
  const lexicon = entriesOf(input.data.lexicons, input.units);
  const taught = new Set(Object.keys(lexicon).filter((id) => !lexicon[id]?.skip));
  const out: FillQuestion[] = [];
  if (patterns.length === 0 || taught.size === 0) return out;
  for (let attempt = 0; attempt < want * 40 && out.length < want; attempt++) {
    const pattern = patterns[attempt % patterns.length] as Pattern;
    const sentence = buildSentence(pattern, lexicon, taught, rng);
    const blank = shuffle(
      pattern.blanks.filter((b) => kinds.includes(b)),
      rng,
    )[0];
    const q =
      sentence && blank ? sentenceFill(sentence, blank, rng, input.data.grammarNoteOf) : null;
    if (!q || !blank) continue;
    const key = norm(q.before + q.answer + q.after);
    if (used.texts.has(key)) continue;
    used.texts.add(key);
    if (kinds === GRAMMAR_BLANKS && FORM_BLANKS.includes(blank)) q.grammar = true;
    out.push(q);
  }
  return out;
}

/* ---------- one section ---------- */

/**
 * The generated questions of one section: `EXAM_PLAN[exam]` says how many of each kind,
 * they come in the order of GENERATED_KINDS, and each kind has its own random stream, so
 * the same seed always gives the same section. Never throws; a kind the data cannot fill
 * comes back short (see `shortfall`).
 */
export function generateForSectionDetailed(input: GenerateInput): GenerateResult {
  const plan = EXAM_PLAN[input.exam]?.sections.find((s) => s.id === input.sectionId);
  if (!plan) return { questions: [], shortfall: [] };
  const used: Used = { texts: new Set() };
  const questions: Question[] = [];
  const shortfall: KindShortfall[] = [];
  const makers: Record<GeneratedKind, (want: number, rng: Rng) => Question[]> = {
    respond: (n, rng) => genRespond(input, n, rng, used),
    listenCloze: (n, rng) => genListenCloze(input, n, rng, used),
    grammarPick: (n, rng) => genGrammarPick(input, n, rng, used),
    priceList: (n, rng) => genPriceList(input, n, rng, used),
    sentenceFill: (n, rng) => genFills(input, n, rng, used, SENSE_BLANKS),
    grammarFill: (n, rng) => genFills(input, n, rng, used, GRAMMAR_BLANKS),
  };
  for (const kind of GENERATED_KINDS) {
    const wanted = plan.generated[kind] ?? 0;
    if (wanted <= 0) continue;
    const got = ((): Question[] => {
      try {
        const rng = makeRng(seedFor(input.seed, input.exam, input.sectionId, kind));
        return makers[kind](wanted, rng).slice(0, wanted);
      } catch {
        return [];
      }
    })();
    questions.push(...got);
    if (got.length < wanted) shortfall.push({ kind, wanted, got: got.length });
  }
  return { questions, shortfall };
}

/** The generated questions of a section (see generateForSectionDetailed). */
export const generateForSection = (input: GenerateInput): Question[] =>
  generateForSectionDetailed(input).questions;

/** Per kind: how many questions were wanted and how many the data made (kinds that came up short). */
export const generatedShortfall = (input: GenerateInput): KindShortfall[] =>
  generateForSectionDetailed(input).shortfall;

/* ---------- candidates for the verified 應答題 bank ---------- */

/** A bank item before the blind review adds `verified: 2`. */
export type RespondCandidate = Omit<RespondBankItem, 'verified'>;

interface TaggedReply {
  scene: string;
  en: string;
  zh: string;
  atype: AnswerType;
}

/** Wrong replies kept per candidate (the question shows three replies). */
const CANDIDATE_WRONG = REPLIES - 1;

/** How far after a question its answer may come. */
const ANSWER_WITHIN = 2;

const usableAnswer = (tag: LineTag | undefined): tag is LineTag & { atype: AnswerType } =>
  tag?.side === 'answer' && !!tag.atype && tag.atype !== 'universal';

/**
 * Candidates for the Act's 應答題 bank, ids `a<act>_r01`...; stable for a seed. The review
 * (two blind readers) turns the survivors into verified items. Two sources:
 *  - story lines: an NPC line tagged `question` and, within the next 2 lines of the scene, a
 *    line tagged `answer`; the wrong replies are answers of other scenes of the Act whose type
 *    is not in COMPATIBLE for the question type (never `universal`), of similar length;
 *  - `qaPairs` from sentenceGen.buildQa, whose wrong replies are of other types by structure.
 * `lexicons` is part of the signature for the callers that pass it; the tags decide here.
 */
export function buildRespondBank(
  act: number,
  units: readonly Unit[],
  lexicons: Record<string, Lexicon>,
  lineTags: Record<string, LineTag>,
  seed: number,
  qaPairs: readonly Qa[] = [],
  limit = 200,
): RespondCandidate[] {
  void lexicons;
  const rng = makeRng(seedFor(seed, 'bank', String(act)));
  const replies: TaggedReply[] = [];
  const pairs: {
    scene: string;
    role: Role;
    question: SceneLine;
    qtype: QuestionType;
    answer: SceneLine;
    atype: AnswerType;
  }[] = [];
  for (const unit of units) {
    for (const task of unit.tasks) {
      const scene = `${unit.id}/${task.id}`;
      const lines = task.scene as SceneLine[];
      lines.forEach((line, i) => {
        const tag = tagOf(lineTags, unit.id, line.id);
        if (usableAnswer(tag)) replies.push({ scene, en: line.en, zh: line.zh, atype: tag.atype });
        if (tag?.side !== 'question' || !tag.qtype || line.speaker !== 'npc') return;
        if (line.role === 'guide') return;
        for (let j = i + 1; j <= i + ANSWER_WITHIN && j < lines.length; j++) {
          const next = lines[j] as SceneLine;
          const nextTag = tagOf(lineTags, unit.id, next.id);
          if (!usableAnswer(nextTag)) continue;
          pairs.push({
            scene,
            role: line.role,
            question: line,
            qtype: tag.qtype,
            answer: next,
            atype: nextTag.atype,
          });
          break;
        }
      });
    }
  }
  const out: Omit<RespondCandidate, 'id'>[] = [];
  const seen = new Set<string>();
  for (const p of shuffle(pairs, rng)) {
    const key = `${norm(p.question.en)}|${norm(p.answer.en)}`;
    if (seen.has(key)) continue;
    const outside = replies.filter(
      (r) =>
        r.scene !== p.scene && norm(r.en) !== norm(p.answer.en) && wrongByType(p.qtype, r.atype),
    );
    const near = (r: TaggedReply) => Math.abs(r.en.length - p.answer.en.length);
    const ranked = shuffle(outside, rng).sort((a, b) => near(a) - near(b));
    const wrong: TaggedReply[] = [];
    for (const r of ranked) {
      // Different types and different texts: two wrong replies that fail the same way teach less.
      if (wrong.some((w) => norm(w.en) === norm(r.en))) continue;
      if (wrong.length > 0 && wrong.some((w) => w.atype === r.atype) && ranked.length > 4) continue;
      wrong.push(r);
      if (wrong.length === CANDIDATE_WRONG) break;
    }
    if (wrong.length < CANDIDATE_WRONG) continue;
    seen.add(key);
    out.push({
      question: { en: p.question.en, zh: p.question.zh, qtype: p.qtype, role: p.role },
      answer: { en: p.answer.en, zh: p.answer.zh, atype: p.atype },
      wrong: wrong.map((w) => ({ en: w.en, zh: w.zh, atype: w.atype })),
    });
  }
  for (const qa of shuffle(qaPairs, rng)) {
    const key = `${norm(qa.question)}|${norm(qa.answer)}`;
    if (seen.has(key) || qa.wrong.length < CANDIDATE_WRONG) continue;
    // Keep the wrong replies of different types first (buildQa already lists them that way).
    const wrong = qa.wrong
      .map((en, i) => ({ en, atype: qa.wrongTypes[i] as AnswerType }))
      .filter((w) => w.atype && wrongByType(qa.questionType, w.atype))
      .slice(0, CANDIDATE_WRONG);
    if (wrong.length < CANDIDATE_WRONG || qa.answerType === 'universal') continue;
    seen.add(key);
    out.push({
      question: { en: qa.question, qtype: qa.questionType, role: 'announcer' },
      answer: { en: qa.answer, atype: qa.answerType },
      wrong,
    });
  }
  const id = (n: number) => `a${act}_r${String(n + 1).padStart(2, '0')}`;
  return out.slice(0, limit).map((item, n) => ({ id: id(n), ...item }));
}

/* ---------- the real data ---------- */

const lexiconFiles = import.meta.glob<LexiconFile>('../data/lexicon/*.json', {
  eager: true,
  import: 'default',
});

/** Tagged story lines of every location, keyed by lineTagKey (line ids repeat across locations). */
export function realLineTags(): Record<string, LineTag> {
  const tags: Record<string, LineTag> = {};
  for (const [path, file] of Object.entries(lexiconFiles)) {
    const unitId = path.slice(path.lastIndexOf('/') + 1, -'.json'.length);
    for (const [lineId, tag] of Object.entries(splitLexiconFile(file).lines)) {
      tags[lineTagKey(unitId, lineId)] = tag;
    }
  }
  return tags;
}

let lineTagsCache: Record<string, LineTag> | undefined;

/** Everything `generateForSection` needs for an exam, from the game's real data. */
export function realInput(exam: ExamId, sectionId: string, seed: number): GenerateInput {
  const act = examAct(exam);
  const actOfUnit = (id: string) => actOfAct(id, ACTS);
  lineTagsCache ??= realLineTags();
  return {
    exam,
    sectionId,
    seed,
    units: UNITS.filter((u) => actOfUnit(u.id) >= 1 && actOfUnit(u.id) <= act),
    actOf: actOfUnit,
    data: {
      lineTags: lineTagsCache,
      sentencePool: SENTENCE_POOL[act] ?? [],
      respondBank: RESPOND_BANK[act] ?? [],
      lexicons: LEXICONS,
      patterns: PATTERNS[act] ?? [],
      exclude: examExcludeFile as ExamExclude,
      grammarNoteOf: (id) => grammarPointOf(id)?.note,
    },
  };
}

/**
 * The generated questions of one section of an exam, in the order the section shows
 * them: `EXAM_PLAN[exam].sections[...].generated` says how many of each kind. This is
 * the one entry the exam screen calls; it loads the Act's content itself. A kind the
 * data cannot fill comes back short (see `generatedShortfallForSection`).
 */
export function generatedForSection(exam: ExamId, sectionId: string, seed: number): Question[] {
  return generateForSection(realInput(exam, sectionId, seed));
}

/**
 * For the exam hub: the kinds of a section the real data cannot fill yet (show 準備中 when
 * this is not empty). Generation is cheap; the default seed keeps the answer steady.
 */
export function generatedShortfallForSection(
  exam: ExamId,
  sectionId: string,
  seed = 1,
): KindShortfall[] {
  return generatedShortfall(realInput(exam, sectionId, seed));
}

/** The generated questions of every section of the Act's exam, from the real data. */
export function generateQuestions(
  act: number,
  units: readonly Unit[],
  seed: number,
  exclude: ExamExclude,
): Question[] {
  const exam = (['exam1', 'exam2', 'exam3', 'exam4'] as const)[act - 1];
  if (!exam) return [];
  return EXAM_PLAN[exam].sections.flatMap((section) => {
    const input = realInput(exam, section.id, seed);
    return generateForSection({ ...input, units, data: { ...input.data, exclude } });
  });
}
