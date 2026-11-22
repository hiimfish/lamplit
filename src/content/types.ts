/** Shared content shapes. Content lives in src/data/units/*.json; code never hard-codes lessons. */

/** Who speaks a line. Each role has one fixed voice per voice family (see src/audio/voices.ts). */
export type Role = 'barista' | 'landlord' | 'neighbor' | 'guide';

export interface Chunk {
  /** e.g. "can_i_get". Audio id is `${unitId}.chunk.${id}`. */
  id: string;
  en: string;
  zh: string;
  /** Other accepted spellings/punctuation for typed or arranged answers. */
  accept?: string[];
  /** One-line grammar note in Chinese. */
  note?: string;
  /** Wrong-but-tempting versions, tagged with the mistake, for feedback. */
  distractors?: { text: string; error: string }[];
}

export interface Word {
  /** Audio id is `${unitId}.word.${id}`. */
  id: string;
  en: string;
  zh: string;
  /** Placeholder picture until real pixel art exists. */
  emoji: string;
  /**
   * An abstract or hard-to-draw word (welcome, okay, numbers, verbs): it needs no
   * pixel icon and always shows its emoji. Concrete nouns leave this out.
   */
  abstract?: boolean;
}

export interface SceneLine {
  /** Audio id is `${unitId}.line.${id}`. */
  id: string;
  role: Role;
  /** 'npc' lines are said by the character; 'player' lines are the learner's reply. */
  speaker: 'npc' | 'player';
  en: string;
  zh: string;
  /** For a player line: the chunk it practises (links to Chunk.id). */
  chunkId?: string;
  /** Optional prop action for the little stage above the story (see scene-stage.md). */
  stage?: StageCue;
}

export type StageAct = 'want' | 'ask' | 'give';

/** `want` and `give` show a word's picture (`item` is a word id of the same unit); `ask` has no item. */
export interface StageCue {
  act: StageAct;
  item?: string;
}

/**
 * `roleplay` is a location's last task (角色扮演大挑戰): review only, no new items; the
 * learner builds each of their own lines in a fresh conversation, with no script first.
 */
export type TaskKind = 'roleplay';

export interface Task {
  id: string;
  title: string;
  /** Leave out for a normal task (story, new items, practice). */
  kind?: TaskKind;
  /** Chunk ids introduced here (2-4). */
  newChunkIds: string[];
  /** Word ids introduced here. */
  newWordIds: string[];
  /** Minimal pair ids introduced here (optional; most units have none). */
  newPairIds?: string[];
  /** The short story played first, in order. */
  scene: SceneLine[];
}

/** One word of a minimal pair. Audio id is `${unitId}.pair.${id}`; ids are unique across the unit's pairs. */
export interface PairSide {
  id: string;
  en: string;
  zh: string;
}

/** Two words that differ by one sound (ship / sheep), for listening discrimination. */
export interface MinimalPair {
  id: string;
  /** The contrast, e.g. "f／v". */
  focus: string;
  /** One-line pronunciation tip in Chinese. */
  note?: string;
  a: PairSide;
  b: PairSide;
}

export interface Unit {
  id: string;
  title: string;
  titleEn: string;
  chunks: Chunk[];
  words: Word[];
  /** Minimal pairs for the listening-discrimination question (optional). */
  pairs?: MinimalPair[];
  tasks: Task[];
}

/** One thing that has audio: the text to speak and who speaks it. */
export interface AudioItem {
  id: string;
  text: string;
  role: Role;
}
