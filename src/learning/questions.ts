/** Question shapes produced by questionGen and rendered by the minigame components. */
import type { Role } from '../content/types';
import type { FillQuestion } from './gen/fills';
import type { PassageQuestion } from './gen/passages';
import type { TalkQuestion } from './gen/talks';

/**
 * The Act 2 kinds are defined next to their generators in ./gen (one folder of files
 * per question type) and re-exported here.
 */
export type { FillQuestion, PassageQuestion, TalkQuestion };

export interface ListenPickQuestion {
  kind: 'listen-pick';
  /** Audio id to play. */
  audioId: string;
  options: { id: string; label: string; emoji?: string }[];
  correctId: string;
  /** Item the question is about (chunk or word id), used for review scheduling. */
  itemId: string;
}

/** Put shuffled word blocks in order to build a sentence. */
export interface ArrangeQuestion {
  kind: 'arrange';
  zh: string;
  /** Audio id of the finished sentence, played after answering. */
  audioId: string;
  blocks: string[];
  accepted: string[];
  itemId: string;
  /** Replaces the default prompt (把單字排成句子), e.g. for a role-play turn. */
  prompt?: string;
  /**
   * The Chinese shows only on 看中文 (counted as help), even with 顯示中文 on: in a
   * role-play the conversation is the cue, and the Chinese would give the line away.
   */
  zhOnRequest?: boolean;
}

/**
 * Listening discrimination: hear one word of a minimal pair (ship / sheep) and pick it.
 * After answering, both words can be played to compare.
 */
export interface ListenPairQuestion {
  kind: 'listen-pair';
  /** Audio id of the word being tested. */
  audioId: string;
  /** The contrast, e.g. "f／v". */
  focus: string;
  /** Exactly the two sides of the pair, in display order (also used for comparing). */
  options: { id: string; label: string; zh: string; audioId: string }[];
  correctId: string;
  /** `pair:<id>`. */
  itemId: string;
}

/** The NPC says something; pick the most natural reply. */
export interface ChooseReplyQuestion {
  kind: 'choose-reply';
  /** Who said the NPC line, for the prompt (店員說了這句…). */
  npcRole: Role;
  npcAudioId: string;
  npcText: string;
  options: { id: string; text: string; error?: string }[];
  correctId: string;
  itemId: string;
}

/** Listen, say it, record, compare with the model voice. Never graded wrong. */
export interface SpeakQuestion {
  kind: 'speak';
  audioId: string;
  en: string;
  zh: string;
  itemId: string;
}

/**
 * Typing (打字拼字): hear a word already taught (maybe in an earlier unit), see its
 * picture and meaning, and type it letter by letter.
 */
export interface SpellQuestion {
  kind: 'spell';
  /** The word's own clip, from the unit that taught it (`move_in.word.key`). */
  audioId: string;
  /** The spelling to type: one plain word of letters. */
  answer: string;
  zh: string;
  /** For the pixel icon. */
  wordId: string;
  emoji?: string;
  /** `word:<id>`. */
  itemId: string;
}

/**
 * Item id of a question that is about no single chunk or word (a sign or a passage to
 * read, a conversation to hear): it counts for the round and the day, but no review
 * card is made for it.
 */
export const NO_ITEM = '';

/**
 * Listening cloze (聽力填空): hear a story line, read it with one word missing, and
 * pick the missing word.
 */
export interface ClozeQuestion {
  kind: 'cloze';
  /** The line's own clip (`street.line.t6_1`). */
  audioId: string;
  /** The line's text before and after the missing word. */
  before: string;
  after: string;
  /** The missing word as it is written in the line. */
  answer: string;
  /** The whole line in Chinese. */
  zh: string;
  options: { id: string; label: string }[];
  correctId: string;
  /** The taught word's `word:<id>`, else the line's `chunk:<id>`, else NO_ITEM. */
  itemId: string;
}

/** Reading (讀招牌／價目): a short sign or price list and one question about it. */
export interface SignQuestion {
  kind: 'read-sign';
  heading?: string;
  rows: { label: string; value?: string }[];
  /** The question, in English and Chinese. */
  en: string;
  zh: string;
  options: { id: string; label: string }[];
  correctId: string;
  /** Always NO_ITEM: reading a sign is not one item to review. */
  itemId: string;
}

/**
 * 看圖選句: a picture and 2 to 4 sentences, one of which describes it (the first TOEIC
 * listening part, read instead of heard for now).
 */
export interface PictureQuestion {
  kind: 'picture';
  /** Key of the picture in src/art/pictures. */
  pictureId: string;
  /** Clip of the right sentence, played after answering. */
  audioId: string;
  options: { id: string; en: string; zh: string }[];
  correctId: string;
  /** Always NO_ITEM: describing a picture is not one item to review. */
  itemId: string;
}

export type Question =
  | ListenPickQuestion
  | ListenPairQuestion
  | ArrangeQuestion
  | ChooseReplyQuestion
  | SpeakQuestion
  | SpellQuestion
  | ClozeQuestion
  | SignQuestion
  | PictureQuestion
  | FillQuestion
  | PassageQuestion
  | TalkQuestion;

export interface AnswerResult {
  itemId: string;
  correct: boolean;
  /** Used slow replay, a hint, or showed the translation. */
  usedHelp: boolean;
  /** Milliseconds from the question appearing to answering. */
  ms: number;
  /** Mistake type for feedback (see grading.ts ErrorType, or a distractor tag). */
  error?: string;
}
