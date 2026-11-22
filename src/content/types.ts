/** Shared content shapes. Content lives in src/data/units/*.json; code never hard-codes lessons. */

/** Who speaks a line. Each role has one fixed voice per voice family (see src/audio/voices.ts). */
export type Role =
  | 'barista'
  | 'landlord'
  | 'neighbor'
  | 'clerk'
  | 'passerby'
  | 'driver'
  | 'cashier'
  | 'vendor'
  | 'assistant'
  | 'receptionist'
  | 'doctor'
  | 'pharmacist'
  | 'server'
  | 'friend'
  | 'postal_clerk'
  | 'volunteer'
  | 'teller'
  | 'instructor'
  | 'librarian'
  | 'mechanic'
  | 'counselor'
  | 'front_desk'
  | 'manager'
  | 'hr'
  | 'coworker'
  | 'client'
  | 'supplier'
  | 'warehouse_lead'
  | 'customer'
  | 'airline_agent'
  | 'hotel_clerk'
  | 'director'
  | 'announcer'
  | 'guide';

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
  /**
   * Words to spell by typing (打字拼字), practised after the new items. Word ids of
   * this unit or an earlier one, all taught before this task; they teach nothing new.
   */
  spellWordIds?: string[];
  /** Listening cloze questions (聽力填空) on lines of this task's story. */
  cloze?: ClozeItem[];
  /** Signs and price lists to read (讀招牌／價目), one question each. */
  signs?: SignItem[];
  /** Pictures to describe (看圖選句): pick the sentence that matches. */
  pictures?: PictureItem[];
  /** Sentences to complete (句子填空): pick the word that fits the blank. */
  fills?: FillItem[];
  /** Short texts to read (讀短文), 1 to 3 questions each. */
  passages?: PassageItem[];
  /** Short conversations or monologues to hear (聽對話答題／聽獨白), 1 to 3 questions each. */
  talks?: TalkItem[];
  /** Short texts with 2 to 4 blanks to fill (段落填空), one question per blank. */
  textFills?: TextFillItem[];
  /**
   * Which stage background this task shows, whoever speaks: a key of the stage's
   * `backdrops`, or `main` for its normal picture. Leave out to pick it by the first NPC
   * who speaks in the scene (see paintFor in src/ui/stage/stageState.ts).
   */
  backdrop?: Role | 'main';
  /** The short story played first, in order. */
  scene: SceneLine[];
}

/** 聽力填空: hear one story line and pick the word that is blanked out in its text. */
interface ClozeItem {
  /** A line of this task's scene; its own clip is played. */
  lineId: string;
  /** The word to blank, one word spelled as it is in the line. Taught in this task or earlier. */
  word: string;
  /** 2 or 3 wrong words shown with the right one. */
  distractors: string[];
}

/** 讀招牌／價目: a short sign (15 words at most) and one question about it. */
interface SignItem {
  /** Unique in the unit. */
  id: string;
  heading?: string;
  /** Lines of the sign: a label, and a value on the right for a price list ("Shirts", "$15"). */
  rows: { label: string; value?: string }[];
  question: { en: string; zh: string };
  /** 2 to 4 answers, each different. */
  options: string[];
  /** Index of the right option. */
  answer: number;
}

/** 看圖選句: one picture and 2 to 4 sentences, one of which describes it. */
interface PictureItem {
  /** Unique in the unit. Audio id of the right sentence is `${unitId}.picture.${id}`. */
  id: string;
  /** Key of the picture in src/art/pictures. */
  pictureId: string;
  options: { en: string; zh: string }[];
  /** Index of the right option. */
  answer: number;
}

/** One multiple-choice question about a text or a conversation. */
export interface ChoiceQuestion {
  en: string;
  zh: string;
  /** 2 to 4 answers, each different. */
  options: string[];
  /** Index of the right option. */
  answer: number;
}

/** 句子填空 (TOEIC Part 5): read one sentence with a blank and pick what fits. No audio. */
export interface FillItem {
  /** Unique in the unit. */
  id: string;
  /** The sentence with the blank written as "___", exactly once. */
  en: string;
  /** Chinese of the whole sentence, shown after answering. */
  zh: string;
  /** 3 or 4 words or short phrases, each different. */
  options: string[];
  /** Index of the right option. */
  answer: number;
  /** One-line note in Chinese on why, shown after answering. */
  note?: string;
  /** If the sentence is a chunk of this unit taught by now: the answer counts for its review card. */
  chunkId?: string;
  /**
   * 文法填空 (TOEIC Part 5, grammar): the options are forms of one word or one grammar
   * choice (eat / eats / eating / ate). Exactly 4 options. The screen says 文法填空.
   */
  grammar?: true;
}

export type PassageKind = 'message' | 'flyer' | 'notice' | 'ad' | 'form' | 'email';

/**
 * 讀短文 (TOEIC Part 7): a message, flyer, notice, ad, form or email of up to 80 words
 * (160 from Act 3 on), 1-3 questions.
 */
export interface PassageItem {
  /** Unique in the unit. */
  id: string;
  kind: PassageKind;
  /** Heading or sender, e.g. "Job Fair" or "Tony (repair shop)". */
  title?: string;
  /** The text, one entry per line or paragraph. */
  lines: string[];
  questions: ChoiceQuestion[];
}

/** One line of a conversation to hear. Audio id is `${unitId}.talk.${id}`; ids are unique in the unit. */
export interface TalkLine {
  id: string;
  role: Role;
  en: string;
  zh: string;
}

/**
 * A small table shown with a conversation (TOEIC Part 3 with a graphic), while listening
 * and while answering. Not spoken.
 */
export interface TalkTable {
  title?: string;
  /** 2 to 5 rows, the first one the header; 2 to 4 cells in every row, each at most 3 words. */
  rows: string[][];
}

/**
 * 聽對話答題 (TOEIC Part 3): hear a short conversation, then answer 1-3 questions about it.
 * With `kind: 'monologue'`, 聽獨白答題 (TOEIC Part 4): one speaker (a voicemail, an
 * announcement, a speech). Its speakers need not be on the location's stage.
 */
export interface TalkItem {
  /** Unique in the unit. */
  id: string;
  /** Leave out for a conversation by two speakers. */
  kind?: 'monologue';
  /**
   * A conversation: 3 to 6 lines by two speakers (3 to 8 from Act 3 on). A monologue:
   * 3 to 10 lines all by one speaker, 30 to 120 words in all.
   */
  lines: TalkLine[];
  questions: ChoiceQuestion[];
  /** A table to look at while listening (conversations only). */
  table?: TalkTable;
}

/** One blank of a text fill. */
export interface TextFillBlank {
  /** 4 options (words, phrases or whole sentences), each different. */
  options: string[];
  /** Index of the right option. */
  answer: number;
  /** One line of Chinese on why, shown after answering. */
  note?: string;
}

/**
 * 段落填空 (TOEIC Part 6): a short email or notice with 2 to 4 blanks, at most 90 words
 * (title included) with each blank filled by its answer. One question per blank, in order;
 * earlier blanks show their right answer while the next one is asked. No audio.
 */
export interface TextFillItem {
  /** Unique in the unit. */
  id: string;
  /** Usually `email` or `notice`. */
  kind: PassageKind;
  /** Sender or heading. */
  title?: string;
  /** The text, one entry per line or paragraph; blanks are written "___" in reading order. */
  lines: string[];
  /** Chinese of the whole text with the answers filled in, one entry per line, shown after the last blank. */
  zh: string[];
  /** One per "___" in lines, in the same order. 2 to 4 blanks. */
  blanks: TextFillBlank[];
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
