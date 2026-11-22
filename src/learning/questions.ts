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

export type Question =
  ListenPickQuestion | ListenPairQuestion | ArrangeQuestion | ChooseReplyQuestion | SpeakQuestion;

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
