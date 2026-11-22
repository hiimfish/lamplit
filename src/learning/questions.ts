/** Question shapes produced by questionGen and rendered by the minigame components. */
import type { Role } from '../content/types';

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

export type Question =
  | ListenPickQuestion
  | ListenPairQuestion
  | ArrangeQuestion
  | ChooseReplyQuestion
  | SpeakQuestion
  | SpellQuestion;

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
