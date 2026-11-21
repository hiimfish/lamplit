/** Shared content shapes. Content lives in src/data/units/*.json; code never hard-codes lessons. */

/** Who speaks a line. Each role has one fixed voice per voice family (see src/audio/voices.ts). */
export type Role = 'barista' | 'guide';

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
}

interface SceneLine {
  /** Audio id is `${unitId}.line.${id}`. */
  id: string;
  role: Role;
  /** 'npc' lines are said by the character; 'player' lines are the learner's reply. */
  speaker: 'npc' | 'player';
  en: string;
  zh: string;
  /** For a player line: the chunk it practises (links to Chunk.id). */
  chunkId?: string;
}

export interface Task {
  id: string;
  title: string;
  /** Chunk ids introduced here (2-4). */
  newChunkIds: string[];
  /** Word ids introduced here. */
  newWordIds: string[];
  /** The short story played first, in order. */
  scene: SceneLine[];
}

export interface Unit {
  id: string;
  title: string;
  titleEn: string;
  chunks: Chunk[];
  words: Word[];
  tasks: Task[];
}

/** One thing that has audio: the text to speak and who speaks it. */
export interface AudioItem {
  id: string;
  text: string;
  role: Role;
}
