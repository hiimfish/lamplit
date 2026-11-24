/**
 * Types of the sentence generator's data (docs/specs/content.md): the lexicon of one
 * location, the patterns of one Act, the checked sentence pool and the question
 * types of the exam's 應答題. Types and constants only: scripts can load this file.
 */

/** Part of speech of a lexicon entry. */
export type Pos = 'n' | 'v' | 'adj' | 'adv' | 'prep' | 'other';

/**
 * What kind of thing a noun is, and what a verb frame accepts. A fixed list: the
 * lexicon check (validateLexicon) refuses any other value. Extend it only together
 * with the lexicon files that use the new class.
 */
export const LEX_CLASSES = [
  'person',
  'role',
  'place',
  'room',
  'food',
  'drink',
  'object',
  'document',
  'device',
  'money',
  'time',
  'day',
  'event',
  'vehicle',
  'clothing',
  'body',
  'quality',
  'number',
] as const;

export type LexClass = (typeof LEX_CLASSES)[number];

/** What a verb can take: who does it, what it acts on, and an optional preposition phrase. */
export interface VerbFrame {
  subj: LexClass[];
  obj?: LexClass[];
  prep?: { word: string; cls: LexClass[] };
}

/** The inflected forms, written out (the engine never guesses irregular ones). */
export interface LexForms {
  /** Plural noun. */
  pl?: string;
  /** Third person singular, present. */
  s3?: string;
  past?: string;
  /** Past participle. */
  pp?: string;
  ing?: string;
}

export interface LexEntry {
  pos: Pos;
  cls?: LexClass;
  forms?: LexForms;
  /** Nouns: can be counted (a report) or not (some water). */
  countable?: boolean;
  /** The word takes "an" rather than "a" (an hour). */
  an?: true;
  /** Verbs: what they combine with. A verb with no frame is never used in a sentence. */
  frames?: VerbFrame[];
  /** Not for sentences (phrases, odd words). An entry with `skip` has no other field. */
  skip?: true;
}

/** Lexicon entries of one location, by word id. */
export type Lexicon = Record<string, LexEntry>;

/** What a 應答題 question asks for. */
export type QuestionType =
  | 'where'
  | 'when'
  | 'who'
  | 'why'
  | 'how-much'
  | 'how-many'
  | 'how'
  | 'which'
  | 'what'
  | 'yes-no'
  | 'choice'
  | 'offer'
  | 'request'
  | 'statement';

/** What an answer gives. */
export type AnswerType =
  | 'place'
  | 'time'
  | 'person'
  | 'reason'
  | 'quantity'
  | 'price'
  | 'manner'
  | 'thing'
  | 'yes-no'
  | 'choice'
  | 'accept-offer'
  | 'decline'
  | 'agree'
  | 'thanks'
  | 'greeting'
  | 'statement'
  /** Fits any question (Sure. / Let me check.): never a wrong option, never the answer. */
  | 'universal';

/** The answer types that can answer each question type. A wrong option must be outside this list. */
export const COMPATIBLE: Record<QuestionType, AnswerType[]> = {
  where: ['place', 'statement'],
  when: ['time', 'statement'],
  who: ['person', 'statement'],
  why: ['reason', 'statement'],
  'how-much': ['price', 'statement'],
  'how-many': ['quantity', 'statement'],
  how: ['manner', 'statement'],
  which: ['thing', 'choice', 'statement'],
  what: ['thing', 'statement'],
  'yes-no': ['yes-no', 'statement'],
  choice: ['choice', 'statement'],
  offer: ['accept-offer', 'decline', 'thanks', 'statement'],
  request: ['agree', 'decline', 'statement'],
  statement: ['agree', 'thanks', 'greeting', 'statement', 'yes-no'],
};

/** A story line tagged for the 應答題 bank (the `lines` field of a lexicon file). */
export interface LineTag {
  /** `question` is an NPC question or remark, `answer` the player's reply. */
  side: 'question' | 'answer';
  qtype?: QuestionType;
  atype?: AnswerType;
}

/**
 * One location's file `src/data/lexicon/<unitId>.json`: entries by word id, plus the
 * reserved key `lines` with the tagged story lines by line id.
 */
export interface LexiconFile {
  [wordId: string]: LexEntry | Record<string, LineTag> | undefined;
  lines?: Record<string, LineTag>;
}

/** Splits a lexicon file into its word entries and its tagged lines. */
export function splitLexiconFile(file: LexiconFile): {
  entries: Lexicon;
  lines: Record<string, LineTag>;
} {
  const entries: Lexicon = {};
  for (const [id, value] of Object.entries(file)) {
    if (id !== 'lines' && value) entries[id] = value as LexEntry;
  }
  return { entries, lines: file.lines ?? {} };
}

/** The blank a drill question can take. */
export type BlankKind = 'verb-form' | 'prep' | 'article' | 'number' | 'object' | 'subject';

/** The sentence shapes the engine builds. */
export type PatternShape =
  | 'svo'
  | 'svo-prep'
  | 'svo-time'
  | 'be-adj'
  | 'there-be'
  | 'passive'
  | 'wh-question'
  | 'yes-no-question'
  | 'comparative';

/** An entry of `src/data/patterns/act<N>.json`. */
export interface Pattern {
  id: string;
  /** A GRAMMAR_POINTS id (src/content/grammar.ts). */
  grammarId: string;
  shape: PatternShape;
  /** Tense or form the sentence takes: `present`, `past`, `future`, `perfect`... */
  tense: string;
  /** Words that decide the answer (yesterday, every day, tomorrow...); only words the Act taught. */
  cues?: string[];
  blanks: BlankKind[];
}

/** An entry of `src/data/sentences/act<N>.json`: reviewed, fixed, spoken by the audio script. */
export interface PoolSentence {
  id: string;
  kind: 'statement' | 'qa';
  /** The sentence, or the question of a `qa`. */
  en: string;
  grammarId: string;
  /** `statement`: the word a 聽力填空 blanks out. */
  blankWord?: string;
  /** `qa`: the right reply and the wrong ones in one list; `answer` is the index of the right one. */
  responses?: string[];
  answer?: number;
}

/** A verified 應答題 of `src/data/responds/act<N>.json`. */
export interface RespondBankItem {
  id: string;
  question: { en: string; zh?: string; qtype: QuestionType; role: string };
  answer: { en: string; zh?: string; atype: AnswerType };
  wrong: { en: string; zh?: string; atype: AnswerType }[];
  /** Blind reviewers who answered it right and found every wrong option wrong. */
  verified: number;
}
