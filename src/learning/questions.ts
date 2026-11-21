/** Question shapes produced by questionGen and rendered by the minigame components. */

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

/** The NPC says something; pick the most natural reply. */
export interface ChooseReplyQuestion {
  kind: 'choose-reply';
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

export type Question = ListenPickQuestion | ArrangeQuestion | ChooseReplyQuestion | SpeakQuestion;

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
