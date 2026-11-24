/**
 * The sentence generator (docs/specs/content.md): builds new sentences from a lexicon,
 * a pattern and the words taught so far, and turns them into questions whose answers
 * the structure decides. Pure and seeded; no import of the units, the data comes in as
 * arguments, so tests and scripts use it too.
 *
 * Data the engine reads beyond the types of content/lexicon.ts (all optional):
 * - `LexEntry.en`: the written form when it differs from the word id (id `ice_cream` is
 *   "ice cream" by default).
 * - `LexForms.comp`: the comparative of an adjective (the engine knows the regular rule
 *   and a few irregular ones).
 * - `VerbFrame.prepRequired`: the preposition phrase is not optional (put it on the desk).
 * - Adjectives (`pos: 'adj'`) use `frames[].subj` for what they can describe; prepositions
 *   (`pos: 'prep'`) use `frames[].subj` for what can stand there and `frames[].obj` for the
 *   landmark (There is a file on the desk).
 */
import {
  COMPATIBLE,
  type AnswerType,
  type BlankKind,
  type LexClass,
  type LexEntry,
  type Lexicon,
  type Pattern,
  type PoolSentence,
  type QuestionType,
  type VerbFrame,
} from '../content/lexicon';
import { makeRng, shuffle, shuffledOptions, type Rng } from './gen/common';
import { NO_ITEM, type FillQuestion } from './questions';

/** `taught` is the set of word ids taught up to a location; only their entries are used. */
export type Taught = ReadonlySet<string>;

/** Which sentence slot a part fills. */
export type PartRole = 'subj' | 'obj' | 'pobj' | 'verb' | 'aux' | 'prep' | 'adj' | 'cue' | 'other';

/** Singular or plural noun with its determiner (`a` means a / an by the sound of the noun). */
interface NpSpec {
  nounId: string;
  /** The noun as written (plural when `plural`). */
  noun: string;
  singular: string;
  pluralForm?: string;
  plural: boolean;
  /** `''` for none, `a` for a / an, else the word (the, my, two, some...). */
  det: string;
  mass: boolean;
  an: boolean;
}

interface NpInfo {
  spec?: NpSpec;
  /** Noun phrases of a class the slot cannot take, ready to put in the slot. */
  wrong: string[];
}

interface VerbInfo {
  correct: string;
  /** Forms that are wrong in this very sentence (never a form that would also fit). */
  wrong: string[];
}

interface PrepInfo {
  correct: string;
  wrong: string[];
}

/** One piece of a sentence; `text` is what is written (a noun phrase is one part). */
export interface Part {
  role: PartRole;
  text: string;
  wordId?: string;
  np?: NpInfo;
  verb?: VerbInfo;
  prep?: PrepInfo;
}

/** A sentence built from a pattern, with the choices that made it. */
export interface Sentence {
  en: string;
  pattern: Pattern;
  /** Slot name to the word id (or text) placed in it. */
  slots: Record<string, string>;
  /** The pieces in order: a fill blanks one of them. */
  parts: Part[];
}

/** A question and answer pair built from one slot of a frame. */
export interface Qa {
  question: string;
  answer: string;
  /** Replies of other types: wrong by structure, never type-compatible with the question. */
  wrong: string[];
  /** The answer type of each wrong reply, in the same order as `wrong`. */
  wrongTypes: AnswerType[];
  grammarId: string;
  questionType: QuestionType;
  answerType: AnswerType;
}

// ---------------------------------------------------------------- small helpers

const BLANK = '___';
const NONE_LABEL = '—';

const cap = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const unique = <T>(xs: readonly T[]): T[] => [...new Set(xs)];

function pick<T>(xs: readonly T[], rng: Rng): T | undefined {
  return xs.length === 0 ? undefined : xs[Math.floor(rng() * xs.length)];
}

const PROPER =
  /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december)$/;

type EntryX = LexEntry & { en?: string };

function wordText(id: string, entry: LexEntry): string {
  const raw = (entry as EntryX).en ?? id.replace(/_/g, ' ');
  return PROPER.test(raw) ? cap(raw) : raw;
}

function vowelSound(text: string, entry: LexEntry): boolean {
  if (entry.an === true) return true;
  const t = text.toLowerCase();
  if (/^(hour|honest|honou?r|heir)/.test(t)) return true;
  if (/^(uni|use|usu|eu|one|once|ubiq)/.test(t)) return false;
  return /^[aeiou]/.test(t);
}

// ---------------------------------------------------------------- tenses and cues

type Family =
  | 'present'
  | 'past'
  | 'future'
  | 'progressive'
  | 'past-progressive'
  | 'perfect'
  | 'past-perfect'
  | 'modal';

interface Tense {
  family: Family;
  modal?: string;
}

const MODALS = ['can', 'could', 'should', 'must', 'may', 'might', 'would'];

function parseTense(raw: string): Tense | null {
  const t = raw.trim().toLowerCase();
  if (t === 'present' || t === 'present-simple') return { family: 'present' };
  if (t === 'past' || t === 'past-simple') return { family: 'past' };
  if (t === 'future' || t === 'will') return { family: 'future' };
  if (['progressive', 'continuous', 'present-continuous', 'present-progressive'].includes(t)) {
    return { family: 'progressive' };
  }
  if (t === 'past-continuous' || t === 'past-progressive') return { family: 'past-progressive' };
  if (t === 'perfect' || t === 'present-perfect') return { family: 'perfect' };
  if (t === 'past-perfect') return { family: 'past-perfect' };
  if (MODALS.includes(t)) return { family: 'modal', modal: t };
  return null;
}

type CueClass = 'past' | 'freq' | 'habit' | 'now' | 'future' | 'perfect' | 'neutral';

const FREQ_WORDS = [
  'always',
  'usually',
  'often',
  'sometimes',
  'never',
  'rarely',
  'seldom',
  'generally',
  'normally',
  'ever',
];
/** Cues that sit before the main verb (after the subject, or after the first auxiliary). */
const MID_CUES = [...FREQ_WORDS, 'already', 'just'];

function cueClass(cue: string): CueClass {
  const c = cue.trim().toLowerCase();
  if (/^(yesterday|last |the day before|\d{4}$|in \d{4}$)/.test(c) || /( ago|just now)$/.test(c)) {
    return 'past';
  }
  if (FREQ_WORDS.includes(c)) return 'freq';
  if (/^(every |once |twice |on \w+s$)/.test(c) || /times a /.test(c)) return 'habit';
  if (['now', 'right now', 'at the moment', 'currently', 'at present', 'these days'].includes(c)) {
    return 'now';
  }
  if (/^(tomorrow|next |tonight|soon|later|in the future|in \d+ )/.test(c)) return 'future';
  if (['already', 'yet', 'just', 'recently', 'lately', 'so far'].includes(c)) return 'perfect';
  if (/^(since|for) /.test(c)) return 'perfect';
  return 'neutral';
}

/** Whether a cue can stand in a sentence of this tense (a cue of another tense is a mistake). */
function cueFits(cue: string, family: Family): boolean {
  switch (cueClass(cue)) {
    case 'past':
      return family === 'past' || family === 'past-progressive' || family === 'past-perfect';
    case 'freq':
      return family === 'present' || family === 'modal' || family === 'perfect';
    case 'habit':
      return family === 'present' || family === 'modal';
    case 'now':
      return family === 'progressive' || family === 'present' || family === 'modal';
    case 'future':
      return family === 'future' || family === 'modal';
    case 'perfect':
      return family === 'perfect';
    case 'neutral':
      return true;
  }
}

/** A cue that decides between the simple present and the simple past. */
const decides = (cue: string | undefined): boolean => !!cue && cueClass(cue) !== 'neutral';

// ---------------------------------------------------------------- the lexicon, sorted into word kinds

interface Noun {
  id: string;
  text: string;
  plural?: string;
  mass: boolean;
  cls: LexClass;
  an: boolean;
}

interface VerbWord {
  id: string;
  base: string;
  s3: string;
  past: string;
  pp: string;
  ing: string;
  frames: VerbFrame[];
}

interface AdjWord {
  id: string;
  text: string;
  comp: string;
  frames: VerbFrame[];
}

interface PrepWord {
  id: string;
  text: string;
  frames: VerbFrame[];
}

interface Env {
  nouns: Noun[];
  verbs: VerbWord[];
  adjs: AdjWord[];
  preps: PrepWord[];
  /** Cardinal numbers above one, as written. */
  numbers: string[];
}

const IRREGULAR_COMP: Record<string, string> = {
  good: 'better',
  bad: 'worse',
  far: 'farther',
  little: 'less',
  many: 'more',
  much: 'more',
};

function syllables(word: string): number {
  const w = word.toLowerCase().replace(/e$/, (m) => (/[^aeiouy]le$/.test(word) ? m : ''));
  return Math.max(1, (w.match(/[aeiouy]+/g) ?? []).length);
}

/** The comparative: written in `forms.comp`, else the regular rule, else "more ...". */
function comparative(word: string, entry: LexEntry): string {
  const given = (entry.forms as { comp?: string } | undefined)?.comp;
  if (given) return given;
  const irregular = IRREGULAR_COMP[word];
  if (irregular) return irregular;
  if (/(ed|ing|ful|less|ous|ive|al|ic)$/.test(word) || /\s/.test(word)) return `more ${word}`;
  const n = syllables(word);
  if (n === 1) {
    if (word.endsWith('e')) return `${word}r`;
    if (/[^aeiou][aeiou][^aeiouwxy]$/.test(word)) return `${word}${word.slice(-1)}er`;
    return `${word}er`;
  }
  if (n === 2 && word.endsWith('y')) return `${word.slice(0, -1)}ier`;
  if (n === 2 && /[^aeiou]le$/.test(word)) return `${word}r`;
  return `more ${word}`;
}

const CARDINALS =
  /^(two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)$/;

function sortLexicon(lexicon: Lexicon, taught: Taught): Env {
  const env: Env = { nouns: [], verbs: [], adjs: [], preps: [], numbers: [] };
  for (const id of Object.keys(lexicon).sort()) {
    const entry = lexicon[id];
    if (!entry || entry.skip || !taught.has(id)) continue;
    const text = wordText(id, entry);
    if (entry.pos === 'n' && entry.cls) {
      if (entry.cls === 'number') {
        if (CARDINALS.test(text)) env.numbers.push(text);
        continue;
      }
      const mass = entry.countable === false;
      const noun: Noun = {
        id,
        text,
        mass,
        cls: entry.cls,
        an: vowelSound(text, entry),
      };
      if (!mass && entry.forms?.pl) {
        noun.plural = /^[A-Z]/.test(text) ? cap(entry.forms.pl) : entry.forms.pl;
      }
      env.nouns.push(noun);
    } else if (entry.pos === 'n' && !entry.cls) {
      continue;
    } else if (entry.pos === 'v' && entry.frames?.length) {
      const f = entry.forms;
      if (f?.s3 && f.past && f.pp && f.ing) {
        env.verbs.push({
          id,
          base: text,
          s3: f.s3,
          past: f.past,
          pp: f.pp,
          ing: f.ing,
          frames: entry.frames,
        });
      }
    } else if (entry.pos === 'adj' && entry.frames?.length) {
      env.adjs.push({ id, text, comp: comparative(text, entry), frames: entry.frames });
    } else if (entry.pos === 'prep' && entry.frames?.length) {
      env.preps.push({ id, text, frames: entry.frames });
    } else if (entry.cls === 'number' && CARDINALS.test(text)) {
      env.numbers.push(text);
    }
  }
  return env;
}

// ---------------------------------------------------------------- noun phrases

function npText(spec: NpSpec): string {
  const noun = spec.noun;
  if (spec.det === '') return noun;
  const det = spec.det === 'a' ? (spec.an ? 'an' : 'a') : spec.det;
  return `${det} ${noun}`;
}

const POSSESSIVES = ['my', 'your', 'our', 'his', 'her', 'their'];

function makeSpec(
  noun: Noun,
  role: 'subj' | 'obj' | 'pobj',
  env: Env,
  rng: Rng,
  how: { plural?: boolean; definite?: boolean } = {},
): NpSpec | null {
  const canPlural = !noun.mass && noun.plural !== undefined;
  if (how.plural && !canPlural) return null;
  // A landmark ("to the office") is singular unless asked for.
  const plural = how.plural ?? (role !== 'pobj' && canPlural && rng() < 0.4);
  const possessive = () => pick(POSSESSIVES, rng) ?? 'my';
  const r = rng();
  let det: string;
  if (how.definite) {
    det = plural && r < 0.15 ? '' : r < 0.7 ? 'the' : possessive();
  } else if (noun.mass) {
    det = r < 0.4 ? '' : r < 0.7 ? 'the' : r < 0.85 ? 'some' : possessive();
  } else if (plural) {
    if (r < 0.2) det = '';
    else if (r < 0.45) det = 'the';
    else if (r < 0.9) det = pick([...env.numbers, 'some', 'many'], rng) ?? 'some';
    else det = possessive();
  } else if (role === 'subj') {
    det = r < 0.6 ? 'the' : r < 0.8 ? 'a' : possessive();
  } else if (role === 'obj') {
    det = r < 0.5 ? 'a' : r < 0.8 ? 'the' : possessive();
  } else {
    det = r < 0.7 ? 'the' : r < 0.85 ? 'a' : possessive();
  }
  return specOf(noun, plural, det);
}

/** Classes that look different but would still make a fine sentence: never offered as wrong. */
const FAMILIES: LexClass[][] = [
  ['person', 'role'],
  ['food', 'drink'],
  ['place', 'room'],
  ['object', 'document', 'device', 'vehicle', 'clothing', 'money'],
];
const FAR_CLASSES: LexClass[] = ['time', 'day', 'number', 'quality'];

function bannedClasses(accepted: readonly LexClass[]): Set<LexClass> {
  const banned = new Set<LexClass>(accepted);
  for (const family of FAMILIES) {
    if (family.some((c) => banned.has(c))) family.forEach((c) => banned.add(c));
  }
  banned.add('person');
  banned.add('role');
  return banned;
}

/** A noun phrase of the noun in the style (number, determiner) of the right answer. */
function renderLike(noun: Noun, like: { plural: boolean; det: string }): string | null {
  if (like.plural) {
    if (noun.mass || noun.plural === undefined) return null;
    return like.det === '' ? noun.plural : `${like.det} ${noun.plural}`;
  }
  const article = noun.an ? 'an' : 'a';
  if (like.det === 'a') return noun.mass ? `the ${noun.text}` : `${article} ${noun.text}`;
  if (like.det === '' || like.det === 'some') {
    if (noun.mass) return like.det === '' ? noun.text : `some ${noun.text}`;
    return `the ${noun.text}`;
  }
  return `${like.det} ${noun.text}`;
}

function wrongNps(
  env: Env,
  accepted: readonly LexClass[],
  like: { plural: boolean; det: string },
  rightNounId: string,
  rng: Rng,
): string[] {
  const banned = bannedClasses(accepted);
  const open = env.nouns.filter((n) => !banned.has(n.cls) && n.id !== rightNounId);
  const far = open.filter((n) => FAR_CLASSES.includes(n.cls));
  const rest = open.filter((n) => !FAR_CLASSES.includes(n.cls));
  const ordered =
    far.length >= 3 ? shuffle(far, rng) : [...shuffle(far, rng), ...shuffle(rest, rng)];
  const out: string[] = [];
  for (const noun of ordered) {
    const text = renderLike(noun, like);
    if (text && !out.includes(text)) out.push(text);
    if (out.length >= 6) break;
  }
  return out;
}

function nounOf(
  env: Env,
  classes: readonly LexClass[],
  taken: ReadonlySet<string>,
  rng: Rng,
): Noun | null {
  const options = env.nouns.filter((n) => classes.includes(n.cls) && !taken.has(n.id));
  return pick(options, rng) ?? null;
}

const unionOf = (frames: readonly VerbFrame[], pickClasses: (f: VerbFrame) => LexClass[]) =>
  unique(frames.flatMap(pickClasses));

function npPart(
  role: 'subj' | 'obj' | 'pobj',
  spec: NpSpec,
  accepted: readonly LexClass[],
  env: Env,
  rng: Rng,
): Part {
  return {
    role,
    text: npText(spec),
    wordId: spec.nounId,
    np: { spec, wrong: wrongNps(env, accepted, spec, spec.nounId, rng) },
  };
}

// ---------------------------------------------------------------- subjects and agreement

interface Agr {
  person: 1 | 2 | 3;
  plural: boolean;
}

const PRONOUNS: { text: string; object: string; agr: Agr }[] = [
  { text: 'I', object: 'me', agr: { person: 1, plural: false } },
  { text: 'you', object: 'you', agr: { person: 2, plural: false } },
  { text: 'he', object: 'him', agr: { person: 3, plural: false } },
  { text: 'she', object: 'her', agr: { person: 3, plural: false } },
  { text: 'we', object: 'us', agr: { person: 1, plural: true } },
  { text: 'they', object: 'them', agr: { person: 3, plural: true } },
];

const isSg3 = (a: Agr): boolean => a.person === 3 && !a.plural;
const bePresent = (a: Agr): string =>
  a.person === 1 && !a.plural ? 'am' : isSg3(a) ? 'is' : 'are';
const bePast = (a: Agr): string => (!a.plural && a.person !== 2 ? 'was' : 'were');

interface SubjPick {
  part: Part;
  agr: Agr;
  /** The word ids used (so no other slot repeats the noun). */
  ids: string[];
  /** The form after "by". */
  object: string;
}

function pickSubject(
  accepted: readonly LexClass[],
  env: Env,
  rng: Rng,
  taken: ReadonlySet<string>,
  opts: {
    nounOnly?: boolean;
    noFirstPerson?: boolean;
    wrongFrom?: readonly LexClass[];
    definite?: boolean;
  } = {},
): SubjPick | null {
  const wrongFrom = opts.wrongFrom ?? accepted;
  const persons = accepted.includes('person') || accepted.includes('role');
  const nouns = env.nouns.filter((n) => accepted.includes(n.cls) && !taken.has(n.id));
  const usePronoun = !opts.nounOnly && persons && (nouns.length === 0 || rng() < 0.35);
  if (usePronoun) {
    const list = PRONOUNS.filter((p) => !(opts.noFirstPerson && p.text === 'I'));
    const p = pick(list, rng);
    if (!p) return null;
    const like = { plural: !isSg3(p.agr), det: 'the' };
    return {
      part: {
        role: 'subj',
        text: p.text,
        np: { wrong: wrongNps(env, wrongFrom, like, '', rng) },
      },
      agr: p.agr,
      ids: [],
      object: p.object,
    };
  }
  const noun = pick(nouns, rng);
  if (!noun) return null;
  const spec = makeSpec(noun, 'subj', env, rng, { definite: opts.definite });
  if (!spec) return null;
  const part = npPart('subj', spec, wrongFrom, env, rng);
  return {
    part,
    agr: { person: 3, plural: spec.plural },
    ids: [noun.id],
    object: part.text,
  };
}

// ---------------------------------------------------------------- verb groups

const BE_FORMS = ['am', 'is', 'are', 'was', 'were', 'be', 'been', 'being'];

interface Group {
  aux: string[];
  main: string;
  info: VerbInfo;
}

interface GroupOpts {
  question: boolean;
  hasObj: boolean;
  cue?: string;
}

function hasHave(a: Agr): string {
  return isSg3(a) ? 'has' : 'have';
}

/** The auxiliaries and the main verb of a lexical verb. */
function lexGroup(t: Tense, agr: Agr, v: VerbWord, o: GroupOpts): Group {
  const present = isSg3(agr) ? v.s3 : v.base;
  const to = `to ${v.base}`;
  const all = [v.base, v.s3, v.past, v.pp, v.ing, to];
  let aux: string[] = [];
  let main = present;
  const valid = new Set<string>();
  switch (t.family) {
    case 'present':
      main = present;
      if (o.question) {
        aux = [isSg3(agr) ? 'does' : 'do'];
        main = v.base;
      } else if (!decides(o.cue)) valid.add(v.past);
      break;
    case 'past':
      main = v.past;
      if (o.question) {
        aux = ['did'];
        main = v.base;
      } else if (!decides(o.cue)) valid.add(present);
      break;
    case 'future':
      aux = ['will'];
      main = v.base;
      break;
    case 'modal':
      aux = [t.modal ?? 'can'];
      main = v.base;
      break;
    case 'progressive':
    case 'past-progressive':
      aux = [t.family === 'progressive' ? bePresent(agr) : bePast(agr)];
      main = v.ing;
      valid.add(to);
      if (!o.hasObj) {
        valid.add(v.pp);
        valid.add(v.past);
      }
      break;
    case 'perfect':
    case 'past-perfect':
      aux = [t.family === 'perfect' ? hasHave(agr) : 'had'];
      main = v.pp;
      valid.add(to);
      break;
  }
  valid.add(main);
  const wrong = unique(all.filter((f) => !valid.has(f)));
  return { aux, main, info: { correct: main, wrong } };
}

/** The auxiliaries and the main word of "be" (null where the tense has no such form). */
function beGroup(t: Tense, agr: Agr, cue?: string): Group | null {
  let aux: string[] = [];
  let main: string;
  const valid = new Set<string>();
  switch (t.family) {
    case 'present':
      main = bePresent(agr);
      if (!decides(cue)) valid.add(bePast(agr));
      break;
    case 'past':
      main = bePast(agr);
      if (!decides(cue)) valid.add(bePresent(agr));
      break;
    case 'future':
      aux = ['will'];
      main = 'be';
      break;
    case 'modal':
      aux = [t.modal ?? 'can'];
      main = 'be';
      break;
    case 'perfect':
      aux = [hasHave(agr)];
      main = 'been';
      break;
    case 'past-perfect':
      aux = ['had'];
      main = 'been';
      break;
    default:
      return null;
  }
  valid.add(main);
  return { aux, main, info: { correct: main, wrong: BE_FORMS.filter((f) => !valid.has(f)) } };
}

/** The auxiliaries and past participle of a passive. */
function passiveGroup(t: Tense, agr: Agr, v: VerbWord): Group | null {
  let aux: string[];
  switch (t.family) {
    case 'present':
      aux = [bePresent(agr)];
      break;
    case 'past':
      aux = [bePast(agr)];
      break;
    case 'future':
      aux = ['will', 'be'];
      break;
    case 'modal':
      aux = [t.modal ?? 'can', 'be'];
      break;
    case 'perfect':
      aux = [hasHave(agr), 'been'];
      break;
    case 'past-perfect':
      aux = ['had', 'been'];
      break;
    default:
      return null;
  }
  const wrong = unique([v.base, v.s3, v.past, v.ing, `to ${v.base}`].filter((f) => f !== v.pp));
  return { aux, main: v.pp, info: { correct: v.pp, wrong } };
}

// ---------------------------------------------------------------- assembling

interface Built {
  parts: Part[];
  terminal: '.' | '?';
  slots: Record<string, string>;
  wh?: WhMeta;
}

function auxPart(text: string): Part {
  return { role: 'aux', text };
}

/** Puts the middle cue (already, always...) after the first auxiliary, or before the main verb. */
function clausePieces(
  subj: Part,
  group: Group,
  mainPart: Part,
  cue: string | undefined,
  question: boolean,
  wh?: Part,
): Part[] {
  const mid = cue && MID_CUES.includes(cue.toLowerCase()) ? cue : undefined;
  const midPart: Part[] = mid ? [{ role: 'cue', text: mid }] : [];
  const aux = group.aux.map(auxPart);
  const head = wh ? [wh] : [];
  if (question) {
    const [first, ...rest] = aux;
    return [...head, ...(first ? [first] : []), subj, ...midPart, ...rest, mainPart];
  }
  if (aux.length > 0) {
    const [first, ...rest] = aux;
    return [subj, ...(first ? [first] : []), ...midPart, ...rest, mainPart];
  }
  return [subj, ...midPart, mainPart];
}

function endCue(cue: string | undefined): Part[] {
  return cue && !MID_CUES.includes(cue.toLowerCase()) ? [{ role: 'cue', text: cue }] : [];
}

function verbPart(group: Group, wordId?: string): Part {
  const part: Part = { role: 'verb', text: group.main, verb: group.info };
  if (wordId) part.wordId = wordId;
  return part;
}

/** Prepositions that could also fit where the key one does (never offered as wrong). */
const PREP_RIVALS: Record<string, string[]> = {
  to: ['into', 'toward', 'at', 'for', 'onto'],
  at: ['in', 'on', 'by', 'near', 'to'],
  in: ['at', 'on', 'inside', 'into', 'within'],
  on: ['in', 'at', 'upon', 'onto'],
  for: ['to', 'about', 'after'],
  from: ['of', 'out'],
  with: ['by', 'to', 'and'],
  about: ['on', 'of', 'over'],
  of: ['about', 'from'],
  by: ['with', 'at'],
  into: ['in', 'to'],
};
const PREP_POOL = [
  'of',
  'with',
  'by',
  'under',
  'over',
  'about',
  'for',
  'in',
  'at',
  'on',
  'from',
  'to',
];

/**
 * A preposition part. Only a fixed one (a verb that always takes it: listen to, wait for)
 * has wrong options: after any other verb or object several prepositions would also fit.
 */
function prepPart(word: string, fixed: boolean): Part {
  const key = word.toLowerCase();
  const rivals = PREP_RIVALS[key] ?? [];
  const wrong = fixed ? PREP_POOL.filter((w) => w !== key && !rivals.includes(w)) : [];
  return { role: 'prep', text: word, prep: { correct: word, wrong } };
}

const isFixedPrep = (frame: VerbFrame): boolean =>
  (frame.prep as { fixed?: boolean } | undefined)?.fixed === true;

const needsPrep = (frame: VerbFrame): boolean =>
  !!frame.prep &&
  (frame.obj === undefined || (frame as { prepRequired?: boolean }).prepRequired === true);

const PLACE_CLASSES: LexClass[] = ['place', 'room'];
const PERSON_CLASSES: LexClass[] = ['person', 'role'];

// ---------------------------------------------------------------- wh questions

type WhTarget = 'obj' | 'howmany' | 'place' | 'person-prep' | 'time';

interface WhMeta {
  target: WhTarget;
  questionType: QuestionType;
  answerType: AnswerType;
  /** The right answer as a phrase, not yet capitalised and without the full stop. */
  answer: string;
  /** Classes of the slot the question asks about: wrong replies must avoid them. */
  excluded: LexClass[];
  family: Family;
}

const TIME_CLASSES: CueClass[] = ['past', 'habit', 'now', 'future'];

/** Time phrases that fit the tense: from the pattern's cues and from the day and time words. */
function timePhrases(env: Env, family: Family, cues: readonly string[]): string[] {
  const kind =
    family === 'past' || family === 'past-progressive'
      ? 'past'
      : family === 'future'
        ? 'future'
        : 'present';
  const out = cues.filter((c) => TIME_CLASSES.includes(cueClass(c)) && cueFits(c, family));
  const lead = { past: 'last', future: 'next', present: 'every' }[kind];
  const partLead = { past: 'yesterday', future: 'tomorrow', present: 'every' }[kind];
  for (const noun of env.nouns) {
    const word = noun.text.toLowerCase();
    if (noun.cls === 'day' && PROPER.test(word)) out.push(`${lead} ${noun.text}`);
    else if (noun.cls === 'time') {
      if (/^(week|month|year|weekend)$/.test(word)) out.push(`${lead} ${word}`);
      else if (/^(morning|afternoon|evening)$/.test(word)) out.push(`${partLead} ${word}`);
      else if (word === 'night') {
        out.push(
          kind === 'past' ? 'last night' : kind === 'future' ? 'tomorrow night' : 'every night',
        );
      }
    }
  }
  return unique(out);
}

function whPart(text: string): Part {
  return { role: 'other', text };
}

function buildLex(
  pattern: Pattern,
  env: Env,
  rng: Rng,
  mode: 'statement' | 'yesno' | 'wh',
  allowed?: ReadonlySet<WhTarget>,
): Built | null {
  const tense = parseTense(pattern.tense);
  if (!tense) return null;
  const question = mode !== 'statement';
  const allCues = pattern.cues ?? [];
  const cues = allCues.filter((c) => cueFits(c, tense.family) && !(question && /^never$/i.test(c)));
  if (allCues.length > 0 && cues.length === 0) return null;
  if (pattern.shape === 'svo-time' && mode === 'statement' && cues.length === 0) return null;
  const cue = pick(cues, rng);
  for (const verb of shuffle(env.verbs, rng)) {
    for (const frame of shuffle(verb.frames, rng)) {
      const built = tryLex(pattern, env, rng, mode, tense, verb, frame, cue, cues, allowed);
      if (built) return built;
    }
  }
  return null;
}

function tryLex(
  pattern: Pattern,
  env: Env,
  rng: Rng,
  mode: 'statement' | 'yesno' | 'wh',
  tense: Tense,
  verb: VerbWord,
  frame: VerbFrame,
  cue: string | undefined,
  cues: readonly string[],
  allowed?: ReadonlySet<WhTarget>,
): Built | null {
  const shape = pattern.shape;
  if (shape === 'svo-prep' && !frame.prep) return null;
  const taken = new Set<string>();
  const subj = pickSubject(frame.subj, env, rng, taken, {
    wrongFrom: unionOf(verb.frames, (f) => f.subj),
    noFirstPerson: tense.family === 'progressive' || tense.family === 'past-progressive',
  });
  if (!subj) return null;
  subj.ids.forEach((id) => taken.add(id));
  const objNoun = frame.obj ? nounOf(env, frame.obj, taken, rng) : null;
  if (frame.obj && !objNoun) return null;
  if (objNoun) taken.add(objNoun.id);
  const pobjNoun = frame.prep ? nounOf(env, frame.prep.cls, taken, rng) : null;
  if (needsPrep(frame) && !pobjNoun) return null;
  if (shape === 'svo-prep' && !pobjNoun) return null;

  // The targets of a wh question.
  const targets: WhTarget[] = [];
  if (mode === 'wh') {
    if (objNoun) {
      targets.push('obj');
      if (!objNoun.mass && objNoun.plural && env.numbers.length > 0) targets.push('howmany');
    }
    if (frame.prep && pobjNoun) {
      if (PLACE_CLASSES.includes(pobjNoun.cls)) targets.push('place');
      else if (PERSON_CLASSES.includes(pobjNoun.cls)) targets.push('person-prep');
    }
    if (tense.family !== 'perfect' && tense.family !== 'past-perfect') targets.push('time');
  }
  const usable = targets.filter((t) => !allowed || allowed.has(t));
  const target = mode === 'wh' ? pick(usable, rng) : undefined;
  if (mode === 'wh' && !target) return null;

  let timeAnswer: string | undefined;
  if (target === 'time') {
    timeAnswer = pick(timePhrases(env, tense.family, cues), rng);
    if (!timeAnswer) return null;
  }
  const includePrep =
    !!frame.prep &&
    !!pobjNoun &&
    (shape === 'svo-prep' ||
      needsPrep(frame) ||
      target === 'place' ||
      target === 'person-prep' ||
      (shape !== 'svo' && shape !== 'svo-time' && rng() < 0.5));
  const question = mode !== 'statement';
  const usedCue = target === 'time' ? undefined : cue;
  const group = lexGroup(tense, subj.agr, verb, { question, hasObj: !!objNoun, cue: usedCue });

  const allFrames = verb.frames;
  const objAccepted = unionOf(allFrames, (f) => f.obj ?? []);
  const prepAccepted = unionOf(allFrames, (f) => f.prep?.cls ?? []);

  // The slots, in the order they stand after the verb.
  const slots: Record<string, string> = { subj: subj.part.wordId ?? subj.part.text, verb: verb.id };
  const after: Part[] = [];
  let whText = '';
  let meta: WhMeta | undefined;
  const askingObj = target === 'obj' || target === 'howmany';
  if (objNoun) {
    const spec = makeSpec(objNoun, 'obj', env, rng, target === 'howmany' ? { plural: true } : {});
    if (!spec) return null;
    slots.obj = objNoun.id;
    if (askingObj) {
      const isPerson = PERSON_CLASSES.includes(objNoun.cls);
      if (target === 'howmany') {
        whText = `how many ${spec.noun}`;
        const number = pick(env.numbers, rng) ?? 'two';
        meta = {
          target,
          questionType: 'how-many',
          answerType: 'quantity',
          answer: rng() < 0.5 ? number : `${number} ${spec.noun}`,
          excluded: objAccepted,
          family: tense.family,
        };
      } else {
        whText = isPerson ? 'who' : 'what';
        meta = {
          target: 'obj',
          questionType: isPerson ? 'who' : 'what',
          answerType: isPerson ? 'person' : 'thing',
          answer: npText(spec),
          excluded: objAccepted,
          family: tense.family,
        };
      }
    } else {
      after.push(npPart('obj', spec, objAccepted, env, rng));
    }
  }
  if (includePrep && frame.prep && pobjNoun) {
    const spec = makeSpec(pobjNoun, 'pobj', env, rng);
    if (!spec) return null;
    slots.prep = frame.prep.word;
    slots.pobj = pobjNoun.id;
    if (target === 'place') {
      whText = 'where';
      meta = {
        target,
        questionType: 'where',
        answerType: 'place',
        answer: `${frame.prep.word} ${npText(spec)}`,
        excluded: prepAccepted,
        family: tense.family,
      };
      if (frame.prep.word === 'from') after.push(prepPart(frame.prep.word, isFixedPrep(frame)));
    } else if (target === 'person-prep') {
      whText = 'who';
      meta = {
        target,
        questionType: 'who',
        answerType: 'person',
        answer: `${frame.prep.word} ${npText(spec)}`,
        excluded: prepAccepted,
        family: tense.family,
      };
      after.push(prepPart(frame.prep.word, isFixedPrep(frame)));
    } else {
      after.push(prepPart(frame.prep.word, isFixedPrep(frame)));
      after.push(npPart('pobj', spec, prepAccepted, env, rng));
    }
  }
  if (target === 'time' && timeAnswer) {
    whText = 'when';
    meta = {
      target,
      questionType: 'when',
      answerType: 'time',
      answer: timeAnswer,
      excluded: [],
      family: tense.family,
    };
  }
  if (usedCue) slots.cue = usedCue;
  const mainPart = verbPart(group, verb.id);
  const wh = mode === 'wh' ? whPart(whText) : undefined;
  const pieces = clausePieces(subj.part, group, mainPart, usedCue, question, wh);
  const built: Built = {
    parts: [...pieces, ...after, ...endCue(usedCue)],
    terminal: question ? '?' : '.',
    slots,
  };
  if (meta) built.wh = meta;
  return built;
}

// ---------------------------------------------------------------- the other shapes

function indefiniteSpec(noun: Noun, env: Env, rng: Rng): NpSpec | null {
  const canPlural = !noun.mass && noun.plural !== undefined;
  const plural = canPlural && rng() < 0.4;
  let det: string;
  if (noun.mass) det = rng() < 0.5 ? '' : 'some';
  else if (plural) det = pick(['', 'some', 'many', ...env.numbers], rng) ?? 'some';
  else det = 'a';
  return specOf(noun, plural, det);
}

function specOf(noun: Noun, plural: boolean, det: string): NpSpec {
  const spec: NpSpec = {
    nounId: noun.id,
    noun: plural ? (noun.plural ?? noun.text) : noun.text,
    singular: noun.text,
    plural,
    det,
    mass: noun.mass,
    an: noun.an,
  };
  if (noun.plural) spec.pluralForm = noun.plural;
  return spec;
}

function pickTense(pattern: Pattern): { tense: Tense; cue?: string; cues: string[] } | null {
  const tense = parseTense(pattern.tense);
  if (!tense) return null;
  const all = pattern.cues ?? [];
  const cues = all.filter((c) => cueFits(c, tense.family));
  if (all.length > 0 && cues.length === 0) return null;
  return { tense, cues };
}

function buildBeAdj(pattern: Pattern, env: Env, rng: Rng): Built | null {
  const t = pickTense(pattern);
  if (!t) return null;
  const cue = pick(t.cues, rng);
  for (const adj of shuffle(env.adjs, rng)) {
    for (const frame of shuffle(adj.frames, rng)) {
      const wrongFrom = unionOf(adj.frames, (f) => f.subj);
      const subj = pickSubject(frame.subj, env, rng, new Set(), { noFirstPerson: true, wrongFrom });
      if (!subj) continue;
      const group = beGroup(t.tense, subj.agr, cue);
      if (!group) return null;
      const main = verbPart(group);
      const parts = [
        ...clausePieces(subj.part, group, main, cue, false),
        { role: 'adj' as const, text: adj.text, wordId: adj.id },
        ...endCue(cue),
      ];
      const slots: Record<string, string> = {
        subj: subj.part.wordId ?? subj.part.text,
        adj: adj.id,
      };
      if (cue) slots.cue = cue;
      return { parts, terminal: '.', slots };
    }
  }
  return null;
}

function buildComparative(pattern: Pattern, env: Env, rng: Rng): Built | null {
  const t = pickTense(pattern);
  if (!t) return null;
  const cue = pick(t.cues, rng);
  for (const adj of shuffle(env.adjs, rng)) {
    for (const frame of shuffle(adj.frames, rng)) {
      const wrongFrom = unionOf(adj.frames, (f) => f.subj);
      const subj = pickSubject(frame.subj, env, rng, new Set(), {
        nounOnly: true,
        wrongFrom,
        definite: true,
      });
      if (!subj) continue;
      const other = nounOf(env, frame.subj, new Set(subj.ids), rng);
      const spec = other
        ? makeSpec(other, 'obj', env, rng, { definite: true, plural: subj.agr.plural })
        : null;
      if (!other || !spec) continue;
      const group = beGroup(t.tense, subj.agr, cue);
      if (!group) return null;
      const parts = [
        ...clausePieces(subj.part, group, verbPart(group), cue, false),
        { role: 'adj' as const, text: adj.comp, wordId: adj.id },
        { role: 'other' as const, text: 'than' },
        npPart('obj', spec, wrongFrom, env, rng),
        ...endCue(cue),
      ];
      const slots: Record<string, string> = {
        subj: subj.part.wordId ?? subj.part.text,
        adj: adj.id,
        obj: other.id,
      };
      if (cue) slots.cue = cue;
      return { parts, terminal: '.', slots };
    }
  }
  return null;
}

function buildThereBe(pattern: Pattern, env: Env, rng: Rng): Built | null {
  const t = pickTense(pattern);
  if (!t) return null;
  const cue = pick(t.cues, rng);
  for (const prep of shuffle(env.preps, rng)) {
    const subjAccepted = unionOf(prep.frames, (f) => f.subj);
    const objAccepted = unionOf(prep.frames, (f) => f.obj ?? []);
    for (const frame of shuffle(prep.frames, rng)) {
      const located = nounOf(env, frame.subj, new Set(), rng);
      const ground = nounOf(env, frame.obj ?? [], new Set(located ? [located.id] : []), rng);
      if (!located || !ground) continue;
      const spec = indefiniteSpec(located, env, rng);
      const groundSpec = makeSpec(ground, 'pobj', env, rng);
      if (!spec || !groundSpec) continue;
      const group = beGroup(t.tense, { person: 3, plural: spec.plural }, cue);
      if (!group) return null;
      const there: Part = { role: 'other', text: 'there' };
      const parts = [
        ...clausePieces(there, group, verbPart(group), cue, false),
        npPart('subj', spec, subjAccepted, env, rng),
        { role: 'prep' as const, text: prep.text, wordId: prep.id },
        npPart('pobj', groundSpec, objAccepted, env, rng),
        ...endCue(cue),
      ];
      const slots: Record<string, string> = { subj: located.id, prep: prep.id, pobj: ground.id };
      if (cue) slots.cue = cue;
      return { parts, terminal: '.', slots };
    }
  }
  return null;
}

function buildPassive(pattern: Pattern, env: Env, rng: Rng): Built | null {
  const t = pickTense(pattern);
  if (!t) return null;
  const cue = pick(t.cues, rng);
  for (const verb of shuffle(env.verbs, rng)) {
    for (const frame of shuffle(verb.frames, rng)) {
      if (!frame.obj) continue;
      const patient = nounOf(env, frame.obj, new Set(), rng);
      const spec = patient ? makeSpec(patient, 'subj', env, rng) : null;
      if (!patient || !spec) continue;
      const taken = new Set([patient.id]);
      const wrongFrom = unionOf(verb.frames, (f) => f.subj);
      const agent = pickSubject(frame.subj, env, rng, taken, { wrongFrom });
      if (!agent) continue;
      agent.ids.forEach((id) => taken.add(id));
      const group = passiveGroup(t.tense, { person: 3, plural: spec.plural }, verb);
      if (!group) return null;
      const pobj = frame.prep ? nounOf(env, frame.prep.cls, taken, rng) : null;
      if (needsPrep(frame) && !pobj) continue;
      const objAccepted = unionOf(verb.frames, (f) => f.obj ?? []);
      const prepAccepted = unionOf(verb.frames, (f) => f.prep?.cls ?? []);
      const subject = npPart('obj', spec, objAccepted, env, rng);
      const agentPart: Part = { ...agent.part, text: agent.object };
      const after: Part[] = [];
      const slots: Record<string, string> = { obj: patient.id, verb: verb.id };
      if (frame.prep && pobj && (needsPrep(frame) || rng() < 0.5)) {
        const pspec = makeSpec(pobj, 'pobj', env, rng);
        if (!pspec) continue;
        after.push(
          prepPart(frame.prep.word, isFixedPrep(frame)),
          npPart('pobj', pspec, prepAccepted, env, rng),
        );
        slots.prep = frame.prep.word;
        slots.pobj = pobj.id;
      }
      slots.subj = agent.part.wordId ?? agent.object;
      const parts = [
        ...clausePieces(subject, group, verbPart(group, verb.id), cue, false),
        ...after,
        { role: 'other' as const, text: 'by' },
        agentPart,
        ...endCue(cue),
      ];
      if (cue) slots.cue = cue;
      return { parts, terminal: '.', slots };
    }
  }
  return null;
}

// ---------------------------------------------------------------- the public builders

function renderTokens(
  parts: readonly Part[],
  blank?: { index: number; mode: 'whole' | 'det' | 'noun' },
): string {
  return parts
    .map((p, i) => {
      if (!blank || blank.index !== i) return p.text;
      const spec = p.np?.spec;
      if (blank.mode === 'det' && spec) return `${BLANK} ${spec.noun}`;
      if (blank.mode === 'noun' && spec) {
        const det = spec.det === 'a' ? (spec.an ? 'an' : 'a') : spec.det;
        return det ? `${det} ${BLANK}` : BLANK;
      }
      return BLANK;
    })
    .filter((s) => s !== '')
    .join(' ');
}

const finish = (
  parts: readonly Part[],
  terminal: string,
  blank?: Parameters<typeof renderTokens>[1],
) => `${cap(renderTokens(parts, blank))}${terminal}`;

function buildParts(pattern: Pattern, env: Env, rng: Rng): Built | null {
  switch (pattern.shape) {
    case 'svo':
    case 'svo-prep':
    case 'svo-time':
      return buildLex(pattern, env, rng, 'statement');
    case 'yes-no-question':
      return buildLex(pattern, env, rng, 'yesno');
    case 'wh-question':
      return buildLex(pattern, env, rng, 'wh');
    case 'be-adj':
      return buildBeAdj(pattern, env, rng);
    case 'comparative':
      return buildComparative(pattern, env, rng);
    case 'there-be':
      return buildThereBe(pattern, env, rng);
    case 'passive':
      return buildPassive(pattern, env, rng);
    default:
      return null;
  }
}

function toSentence(pattern: Pattern, built: Built): Sentence {
  return {
    en: finish(built.parts, built.terminal),
    pattern,
    slots: built.slots,
    parts: built.parts,
  };
}

/** One sentence of the pattern, or null when the lexicon cannot fill it. */
export function buildSentence(
  pattern: Pattern,
  lexicon: Lexicon,
  taught: Taught,
  rng: Rng,
): Sentence | null {
  const built = buildParts(pattern, sortLexicon(lexicon, taught), rng);
  return built ? toSentence(pattern, built) : null;
}

// ---------------------------------------------------------------- fills

interface Candidate {
  index: number;
  mode: 'whole' | 'det' | 'noun';
  answer: string;
  wrong: string[];
  /** The first `keep` wrong options are always offered (the real trap); the rest are drawn. */
  keep?: number;
}

function articleCandidate(index: number, part: Part): Candidate | null {
  const spec = part.np?.spec;
  if (!spec) return null;
  if (!spec.plural && !spec.mass && spec.det === 'a') {
    const answer = spec.an ? 'an' : 'a';
    return {
      index,
      mode: 'det',
      answer,
      wrong: [spec.an ? 'a' : 'an', NONE_LABEL, 'some', 'many'],
      keep: 1,
    };
  }
  if (spec.plural && spec.det === '') {
    return { index, mode: 'det', answer: NONE_LABEL, wrong: ['a', 'an', 'one', 'each'] };
  }
  if (spec.mass && spec.det === '') {
    return { index, mode: 'det', answer: NONE_LABEL, wrong: ['a', 'an', 'many', 'several'] };
  }
  return null;
}

const FORCES_PLURAL = (det: string): boolean =>
  det === '' || det === 'some' || det === 'many' || CARDINALS.test(det);

function numberCandidate(index: number, part: Part): Candidate | null {
  const spec = part.np?.spec;
  if (!spec || spec.mass || !spec.pluralForm) return null;
  const sg = spec.singular;
  const pl = spec.pluralForm;
  if (!spec.plural && spec.det === 'a') {
    return {
      index,
      mode: 'noun',
      answer: sg,
      wrong: [pl, `${sg}s`, `${sg}es`, `${pl}s`],
      keep: 1,
    };
  }
  if (spec.plural && FORCES_PLURAL(spec.det)) {
    return {
      index,
      mode: 'noun',
      answer: pl,
      wrong: [sg, `${pl}s`, `${pl}es`, `${sg}s`, `${sg}es`],
      keep: 1,
    };
  }
  return null;
}

function candidates(sentence: Sentence, blank: BlankKind): Candidate[] {
  const out: Candidate[] = [];
  sentence.parts.forEach((part, index) => {
    let c: Candidate | null = null;
    if (blank === 'verb-form' && part.verb) {
      c = { index, mode: 'whole', answer: part.verb.correct, wrong: part.verb.wrong };
    } else if (blank === 'prep' && part.prep) {
      c = { index, mode: 'whole', answer: part.prep.correct, wrong: part.prep.wrong };
    } else if (blank === 'article') c = articleCandidate(index, part);
    else if (blank === 'number') c = numberCandidate(index, part);
    else if (
      (blank === 'object' && (part.role === 'obj' || part.role === 'pobj') && part.np) ||
      (blank === 'subject' && part.role === 'subj' && part.np)
    ) {
      c = { index, mode: 'whole', answer: part.text, wrong: part.np?.wrong ?? [] };
    }
    if (c) out.push(c);
  });
  return out;
}

/** A 填空 question on one blank of the sentence, with `grammarIds` and `itemId = NO_ITEM`. */
export function sentenceFill(
  sentence: Sentence,
  blank: BlankKind,
  rng: Rng,
  noteOf?: (grammarId: string) => string | undefined,
): FillQuestion | null {
  for (const c of shuffle(candidates(sentence, blank), rng)) {
    const taken = new Set([c.answer.toLowerCase()]);
    const wrong: string[] = [];
    const kept = c.wrong.slice(0, c.keep ?? 0);
    for (const w of [...kept, ...shuffle(c.wrong.slice(c.keep ?? 0), rng)]) {
      if (taken.has(w.toLowerCase())) continue;
      taken.add(w.toLowerCase());
      wrong.push(w);
      if (wrong.length === 3) break;
    }
    if (wrong.length < 3) continue;
    const text = finish(sentence.parts, sentence.en.slice(-1), { index: c.index, mode: c.mode });
    const at = text.indexOf(BLANK);
    const before = text.slice(0, at);
    const label = (s: string) => (before === '' ? cap(s) : s);
    const question: FillQuestion = {
      kind: 'fill',
      before,
      after: text.slice(at + BLANK.length),
      answer: label(c.answer),
      zh: '',
      options: shuffledOptions([c.answer, ...wrong].map(label), rng),
      correctId: 'o0',
      itemId: NO_ITEM,
      grammarIds: [sentence.pattern.grammarId],
    };
    const note = noteOf?.(sentence.pattern.grammarId);
    if (note) question.note = note;
    return question;
  }
  return null;
}

// ---------------------------------------------------------------- questions and answers

const QA_SHAPES = ['svo', 'svo-prep', 'svo-time', 'wh-question'];

const WRONG_TYPES: Record<string, AnswerType[]> = {
  where: ['time', 'person', 'thing', 'quantity'],
  when: ['place', 'person', 'thing', 'quantity'],
  who: ['place', 'time', 'thing'],
  what: ['place', 'time', 'person'],
  'how-many': ['place', 'time', 'person'],
};

const THING_CLASSES: LexClass[] = [
  'object',
  'document',
  'device',
  'vehicle',
  'clothing',
  'food',
  'drink',
  'money',
];

function phrasesOf(
  type: AnswerType,
  env: Env,
  meta: WhMeta,
  used: ReadonlySet<string>,
  rng: Rng,
): string[] {
  const blocked = new Set<LexClass>(meta.excluded);
  const nouns = (classes: readonly LexClass[]) =>
    env.nouns.filter((n) => classes.includes(n.cls) && !blocked.has(n.cls) && !used.has(n.id));
  switch (type) {
    case 'place':
      return nouns(PLACE_CLASSES).map((n) => `${n.cls === 'room' ? 'in' : 'at'} the ${n.text}`);
    case 'person':
      return nouns(PERSON_CLASSES).map((n) => `${rng() < 0.7 ? 'the' : 'my'} ${n.text}`);
    case 'thing':
      return nouns(THING_CLASSES).map((n) =>
        n.mass ? `some ${n.text}` : `${rng() < 0.5 ? (n.an ? 'an' : 'a') : 'the'} ${n.text}`,
      );
    case 'time': {
      const own = timePhrases(env, meta.family, []);
      return own.length > 0 ? own : timePhrases(env, 'present', []);
    }
    case 'quantity':
      return env.numbers;
    default:
      return [];
  }
}

/** A wh-question about one position of a frame, with its right answer and wrong replies. */
export function buildQa(pattern: Pattern, lexicon: Lexicon, taught: Taught, rng: Rng): Qa | null {
  if (!QA_SHAPES.includes(pattern.shape)) return null;
  const allowed: Record<string, WhTarget[]> = {
    svo: ['obj', 'howmany'],
    'svo-prep': ['obj', 'howmany', 'place', 'person-prep'],
    'svo-time': ['time'],
    'wh-question': ['obj', 'howmany', 'place', 'person-prep', 'time'],
  };
  const env = sortLexicon(lexicon, taught);
  const built = buildLex(pattern, env, rng, 'wh', new Set(allowed[pattern.shape]));
  const meta = built?.wh;
  if (!built || !meta) return null;
  const types = (WRONG_TYPES[meta.questionType] ?? []).filter(
    (t) => !COMPATIBLE[meta.questionType].includes(t),
  );
  const answer = `${cap(meta.answer)}.`;
  const used = new Set(Object.values(built.slots));
  const pools = shuffle(types, rng).map((type) => ({
    type,
    texts: shuffle(unique(phrasesOf(type, env, meta, used, rng)), rng).map((p) => `${cap(p)}.`),
  }));
  const wrong: string[] = [];
  const wrongTypes: AnswerType[] = [];
  for (let round = 0; round < 3 && wrong.length < 3; round++) {
    for (const pool of pools) {
      const text = pool.texts.find((t) => t !== answer && !wrong.includes(t));
      if (text && wrong.length < 3) {
        wrong.push(text);
        wrongTypes.push(pool.type);
      }
    }
  }
  if (wrong.length < 3) return null;
  return {
    question: finish(built.parts, built.terminal),
    answer,
    wrong,
    wrongTypes,
    grammarId: pattern.grammarId,
    questionType: meta.questionType,
    answerType: meta.answerType,
  };
}

// ---------------------------------------------------------------- the checked pool

export interface PoolOptions {
  seed?: number;
  /** Statements wanted (default 60). */
  statements?: number;
  /** Question and answer pairs wanted (default 15). */
  qa?: number;
}

const STATEMENT_SHAPES = [
  'svo',
  'svo-prep',
  'svo-time',
  'be-adj',
  'there-be',
  'passive',
  'comparative',
];
const BE_WORDS = ['am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'will', 'there'];

/** Single words of a sentence that a listening blank can take (content words only). */
export function blankWords(sentence: Sentence): string[] {
  const words: string[] = [];
  for (const part of sentence.parts) {
    const text = part.np?.spec ? part.np.spec.noun : part.text;
    const content = part.role === 'verb' || part.role === 'adj' || part.np?.spec;
    if (content && /^[a-z]{3,}$/i.test(text) && !BE_WORDS.includes(text.toLowerCase())) {
      words.push(text);
    }
  }
  return words;
}

const two = (n: number): string => String(n).padStart(2, '0');

/**
 * The draft of `src/data/sentences/act<N>.json`: statements and question and answer pairs
 * with a fixed seed, sorted by id. The caller passes the patterns of the Act and the
 * lexicon and taught words up to the end of it.
 */
export function buildPool(
  act: number,
  patterns: readonly Pattern[],
  lexicon: Lexicon,
  taught: Taught,
  options: PoolOptions = {},
): PoolSentence[] {
  const rng = makeRng((options.seed ?? 1) * 1000 + act);
  const wantStatements = options.statements ?? 60;
  const wantQa = options.qa ?? 15;
  const out: PoolSentence[] = [];

  const statementPatterns = patterns.filter((p) => STATEMENT_SHAPES.includes(p.shape));
  const seen = new Set<string>();
  let count = 0;
  for (
    let i = 0;
    statementPatterns.length > 0 && count < wantStatements && i < wantStatements * 40;
    i++
  ) {
    const pattern = statementPatterns[i % statementPatterns.length];
    const sentence = pattern ? buildSentence(pattern, lexicon, taught, rng) : null;
    if (!pattern || !sentence || seen.has(sentence.en)) continue;
    seen.add(sentence.en);
    count++;
    const item: PoolSentence = {
      id: `a${act}_s${two(count)}`,
      kind: 'statement',
      en: sentence.en,
      grammarId: pattern.grammarId,
    };
    const blankWord = pick(blankWords(sentence), rng);
    if (blankWord) item.blankWord = blankWord;
    out.push(item);
  }

  const qaPatterns = patterns.filter((p) => QA_SHAPES.includes(p.shape));
  const seenQa = new Set<string>();
  let qaCount = 0;
  for (let i = 0; qaPatterns.length > 0 && qaCount < wantQa && i < wantQa * 60; i++) {
    const pattern = qaPatterns[i % qaPatterns.length];
    const qa = pattern ? buildQa(pattern, lexicon, taught, rng) : null;
    if (!pattern || !qa || seenQa.has(`${qa.question} ${qa.answer}`) || seenQa.has(qa.question))
      continue;
    seenQa.add(qa.question);
    qaCount++;
    const responses = shuffle([qa.answer, ...qa.wrong], rng);
    out.push({
      id: `a${act}_q${two(qaCount)}`,
      kind: 'qa',
      en: qa.question,
      grammarId: qa.grammarId,
      responses,
      answer: responses.indexOf(qa.answer),
    });
  }
  return out.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
