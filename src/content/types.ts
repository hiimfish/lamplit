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
  | 'accountant'
  | 'agency'
  | 'new_hire'
  | 'lawyer'
  | 'plant_manager'
  | 'branch_manager'
  | 'reporter'
  | 'officer'
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
  /** Spoken prompts to answer by ear (應答題, TOEIC Part 2), 3 or 4 per task, from Act 4 on. */
  responds?: RespondItem[];
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

/**
 * 看圖選句: one picture and 2 to 4 sentences, one of which describes it.
 * With `listen` (看圖選句聲音選項, TOEIC Part 1, from Act 4 on): exactly 4 sentences that are
 * heard, not shown, each in the announcer's voice; their text and Chinese show after answering.
 */
export interface PictureItem {
  /**
   * Unique in the unit. Audio id of the right sentence is `${unitId}.picture.${id}` (said by
   * the guide); for a `listen` item each option has its own, `${unitId}.pictureopt.${id}_${index}`
   * (index 0 to 3 in content order, said by the announcer), and there is no right-sentence clip.
   */
  id: string;
  /** Key of the picture in src/art/pictures. */
  pictureId: string;
  options: { en: string; zh: string }[];
  /** Index of the right option. */
  answer: number;
  /** 看圖選句聲音選項: the 4 sentences are heard (keys A to D replay them), not read. */
  listen?: true;
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

/** One text to read: of a single passage, or one of the texts of a passage set. */
export interface PassageText {
  kind: PassageKind;
  /** Heading or sender, e.g. "Job Fair" or "Tony (repair shop)". */
  title?: string;
  /** The text, one entry per line or paragraph. */
  lines: string[];
}

/**
 * 讀短文 (TOEIC Part 7): a message, flyer, notice, ad, form or email of up to 80 words
 * (160 in Act 3; 150 to 300 in Act 4, with exactly 3 questions), 1-3 questions.
 */
export interface SinglePassage extends PassageText {
  /** Unique in the unit (across single passages and sets). */
  id: string;
  questions: ChoiceQuestion[];
}

/** A question on a passage set: which texts it needs may be marked. */
export interface PassageSetQuestion extends ChoiceQuestion {
  /**
   * Indexes in the set's `texts` (0-based, each different) of the texts the answer needs.
   * Two or more marks a question that needs more than one text; leave out for one text.
   */
  needs?: number[];
}

/**
 * 兩篇／三篇一組閱讀 (TOEIC Part 7 double and triple passages, Act 4 only): 2 or 3 related
 * texts read together, with one list of questions for the set. A double set: 180 to 260
 * words in all (titles included), exactly 4 questions, at least 1 needing both texts. A
 * triple set: 180 to 320 words in all, 4 or 5 questions, at least 2 needing more than one.
 */
export interface PassageSet {
  /** Unique in the unit (across single passages and sets). */
  id: string;
  /** 2 or 3 texts, in reading order; each follows the rules of a passage's kind and title. */
  texts: PassageText[];
  questions: PassageSetQuestion[];
}

/** A task's passage: a single text, or (Act 4) a set of 2 or 3 texts. */
export type PassageItem = SinglePassage | PassageSet;

/** True for a passage set (兩篇／三篇一組). */
export const isPassageSet = (passage: PassageItem): passage is PassageSet => 'texts' in passage;

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
  /** Leave out for a conversation (two speakers; two or three in Act 4). */
  kind?: 'monologue';
  /**
   * A conversation: 3 to 6 lines by two speakers (3 to 8 in Act 3; in Act 4 8 to 12 lines
   * by two or three speakers, 三人對話, the guide may be one). A monologue: 3 to 10 lines all
   * by one speaker, 30 to 120 words in all (Act 4: 3 to 12 lines, 30 to 160 words).
   */
  lines: TalkLine[];
  /** 1 to 3 questions; exactly 3 in Act 4. */
  questions: ChoiceQuestion[];
  /** A table to look at while listening (conversations only). */
  table?: TalkTable;
  /**
   * 只播一次: it plays once by itself; replay and slow stay off until every question on it
   * is answered. Required on every talk of the 5th and 7th task from wellness t7 on
   * (wellness t7, then media, annual_meeting, promotion), allowed nowhere else.
   */
  once?: true;
}

/** One spoken response of a 應答題 item. Audio id is `${unitId}.response.${itemId}_${index}`. */
export interface RespondResponse {
  en: string;
  zh: string;
}

/**
 * 應答題 (TOEIC Part 2, sound only, from Act 4 on): hear a question or remark, then three
 * responses (A, B, C), and pick the one that fits. Nothing shows before answering; then the
 * prompt and responses show with their Chinese. The responses are said by the guide (your
 * voice), so the prompt is said by another role.
 */
export interface RespondItem {
  /** Unique in the unit. The prompt's audio id is `${unitId}.respond.${id}`. */
  id: string;
  /** The question or remark, said by `role` (any role with a voice but the guide). */
  prompt: { role: Role; en: string; zh: string };
  /** Exactly 3 responses, each different; the game shuffles them into A, B, C. */
  responses: RespondResponse[];
  /** Index of the right response. */
  answer: number;
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
