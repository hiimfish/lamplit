/**
 * Builds the questions for a task or a review session. Pure: all randomness comes from a
 * seeded RNG so tests are deterministic.
 *
 * Item ids: `chunk:<id>`, `word:<id>` and `pair:<id>` (also used in AnswerResult.itemId);
 * NO_ITEM for a question about no single item.
 */
import type { Chunk, MinimalPair, SceneLine, Task, Unit, Word } from '../content/types';
import { normalize } from './grading';
import {
  NO_ITEM,
  type ArrangeQuestion,
  type ChooseReplyQuestion,
  type ClozeQuestion,
  type ListenPairQuestion,
  type ListenPickQuestion,
  type Question,
  type SignQuestion,
  type SpeakQuestion,
  type SpellQuestion,
} from './questions';
import { chunkItemId, pairItemId, shuffle, wordItemId, type Rng } from './gen/common';
import { fillQuestions } from './gen/fills';
import { passageQuestions } from './gen/passages';
import { pictureQuestions } from './gen/pictures';
import { respondQuestions } from './gen/responds';
import { talkQuestions } from './gen/talks';
import { textFillQuestions } from './gen/textFills';

export { makeRng, type Rng } from './gen/common';

const MAX_OPTIONS = 4;

function sameText(a: string, b: string): boolean {
  return normalize(a) === normalize(b);
}

/**
 * Hear a word, pick it among up to four. Wrong options come from `pool` (the
 * word's own place by default; 單字快練 passes words from several places).
 */
function listenPickWord(
  unit: Unit,
  word: Word,
  rng: Rng,
  pool: readonly Word[] = unit.words,
): ListenPickQuestion | null {
  const others = shuffle(
    pool.filter((w) => w.id !== word.id && !sameText(w.en, word.en)),
    rng,
  ).slice(0, MAX_OPTIONS - 1);
  if (others.length < 1) return null;
  const options = shuffle(
    [word, ...others].map((w) => ({ id: w.id, label: w.en, emoji: w.emoji })),
    rng,
  );
  return {
    kind: 'listen-pick',
    audioId: `${unit.id}.word.${word.id}`,
    options,
    correctId: word.id,
    itemId: wordItemId(word.id),
  };
}

function listenPickChunk(unit: Unit, chunk: Chunk, rng: Rng): ListenPickQuestion | null {
  const accepted = [chunk.en, ...(chunk.accept ?? [])];
  const isClash = (text: string, taken: { label: string }[]) =>
    accepted.some((a) => sameText(a, text)) || taken.some((t) => sameText(t.label, text));

  const distractorPool = (chunk.distractors ?? []).map((d, i) => ({
    id: `${chunk.id}.d${i}`,
    label: d.text,
  }));
  const otherChunks = unit.chunks
    .filter((c) => c.id !== chunk.id)
    .map((c) => ({ id: c.id, label: c.en }));
  // Own distractors first (most tempting), then other chunks.
  const pool = [...shuffle(distractorPool, rng), ...shuffle(otherChunks, rng)];
  const picked: { id: string; label: string }[] = [];
  for (const candidate of pool) {
    if (picked.length >= MAX_OPTIONS - 1) break;
    if (!isClash(candidate.label, picked)) picked.push(candidate);
  }
  if (picked.length < 1) return null;
  const options = shuffle([{ id: chunk.id, label: chunk.en }, ...picked], rng);
  return {
    kind: 'listen-pick',
    audioId: `${unit.id}.chunk.${chunk.id}`,
    options,
    correctId: chunk.id,
    itemId: chunkItemId(chunk.id),
  };
}

/** Shuffles words so the result is never already a correct order (when that is possible). */
export function shuffleBlocks(
  blocks: readonly string[],
  accepted: readonly string[],
  rng: Rng,
): string[] {
  const isCorrect = (list: string[]) => accepted.some((a) => sameText(a, list.join(' ')));
  for (let attempt = 0; attempt < 30; attempt++) {
    const candidate = shuffle(blocks, rng);
    if (!isCorrect(candidate)) return candidate;
  }
  // Deterministic fallbacks.
  const reversed = [...blocks].reverse();
  if (!isCorrect(reversed)) return reversed;
  for (let shift = 1; shift < blocks.length; shift++) {
    const rotated = [...blocks.slice(shift), ...blocks.slice(0, shift)];
    if (!isCorrect(rotated)) return rotated;
  }
  return [...blocks];
}

/**
 * Trims punctuation off the ends of a word block, so "latte," or "please?" can't give away
 * where it goes. Inner apostrophes and hyphens (I'm, take-out) and accented letters stay.
 */
function blockText(word: string): string {
  return word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
}

function arrangeChunk(unit: Unit, chunk: Chunk, rng: Rng): ArrangeQuestion | null {
  const words = chunk.en.split(/\s+/).map(blockText).filter(Boolean);
  if (words.length < 2) return null;
  const accepted = [chunk.en, ...(chunk.accept ?? [])];
  return {
    kind: 'arrange',
    zh: chunk.zh,
    audioId: `${unit.id}.chunk.${chunk.id}`,
    blocks: shuffleBlocks(words, accepted, rng),
    accepted,
    itemId: chunkItemId(chunk.id),
  };
}

function speakChunk(unit: Unit, chunk: Chunk): SpeakQuestion {
  return {
    kind: 'speak',
    audioId: `${unit.id}.chunk.${chunk.id}`,
    en: chunk.en,
    zh: chunk.zh,
    itemId: chunkItemId(chunk.id),
  };
}

function chooseReplies(unit: Unit, task: Task, rng: Rng): ChooseReplyQuestion[] {
  const result: ChooseReplyQuestion[] = [];
  task.scene.forEach((line, index) => {
    const previous = task.scene[index - 1];
    if (line.speaker !== 'player' || !previous || previous.speaker !== 'npc') return;
    // A reply is practice for a chunk; a player line without one has nothing to schedule.
    const chunk = line.chunkId ? unit.chunks.find((c) => c.id === line.chunkId) : undefined;
    if (!chunk) return;
    const correctText = chunk.en;
    const taken = [correctText];
    const wrong: { id: string; text: string; error?: string }[] = [];
    const consider = (id: string, text: string, error: string) => {
      if (wrong.length >= 2 || taken.some((t) => sameText(t, text))) return;
      taken.push(text);
      wrong.push({ id, text, error });
    };
    (chunk.distractors ?? []).forEach((d, i) => consider(`${chunk.id}.d${i}`, d.text, d.error));
    for (const other of shuffle(unit.chunks, rng)) {
      if (other.id !== chunk.id) consider(other.id, other.en, 'other');
    }
    if (wrong.length < 1) return;
    const correctId = chunk.id;
    result.push({
      kind: 'choose-reply',
      npcRole: previous.role,
      npcAudioId: `${unit.id}.line.${previous.id}`,
      npcText: previous.en,
      options: shuffle([{ id: correctId, text: correctText }, ...wrong], rng),
      correctId,
      itemId: chunkItemId(correctId),
    });
  });
  return result;
}

/** Plays one side of a minimal pair; the two options are both sides in random order. */
function listenPair(unit: Unit, pair: MinimalPair, side: 'a' | 'b', rng: Rng): ListenPairQuestion {
  const target = pair[side];
  const options = shuffle([pair.a, pair.b], rng).map((s) => ({
    id: s.id,
    label: s.en,
    zh: s.zh,
    audioId: `${unit.id}.pair.${s.id}`,
  }));
  return {
    kind: 'listen-pair',
    audioId: `${unit.id}.pair.${target.id}`,
    focus: pair.focus,
    options,
    correctId: target.id,
    itemId: pairItemId(pair.id),
  };
}

/** Both sides of each pair, once each; the side order is random so it can't be guessed. */
function pairQuestions(unit: Unit, pairs: MinimalPair[], rng: Rng): ListenPairQuestion[] {
  return pairs.flatMap((pair) => {
    const sides: ('a' | 'b')[] = rng() < 0.5 ? ['a', 'b'] : ['b', 'a'];
    return sides.map((side) => listenPair(unit, pair, side, rng));
  });
}

function compact(questions: (Question | null)[]): Question[] {
  return questions.filter((q): q is Question => q !== null);
}

/** Only one plain word of letters can be typed on the letter keys (not "trash can"). */
const SPELLABLE = /^[a-z]+$/i;

/** A typing question for word `id`, found in whichever of `units` taught it. */
function spellWord(units: readonly Unit[], id: string): SpellQuestion | null {
  for (const owner of units) {
    const word = owner.words.find((w) => w.id === id);
    if (!word) continue;
    if (!SPELLABLE.test(word.en)) return null;
    return {
      kind: 'spell',
      audioId: `${owner.id}.word.${word.id}`,
      answer: word.en,
      zh: word.zh,
      wordId: word.id,
      emoji: word.emoji,
      itemId: wordItemId(word.id),
    };
  }
  return null;
}

/** `word` as a whole word in `text`, any case: the text around it and the word as written there. */
function cutAtWord(
  text: string,
  word: string,
): { before: string; found: string; after: string } | null {
  // Content is validated to one word of letters; anything else never matches.
  if (!/^[a-z]+(['-][a-z]+)*$/i.test(word)) return null;
  const match = new RegExp(`(?<![a-z'-])${word}(?![a-z'-])`, 'i').exec(text);
  if (!match) return null;
  return {
    before: text.slice(0, match.index),
    found: match[0],
    after: text.slice(match.index + match[0].length),
  };
}

const capitalized = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * The taught word that `text` is: the word itself, or its plain plural (minutes, boxes),
 * so that a blanked plural still counts for that word's review card.
 */
function taughtWord(units: readonly Unit[], text: string): Word | undefined {
  const words = units.flatMap((u) => u.words);
  return (
    words.find((w) => sameText(w.en, text)) ??
    words.find((w) => sameText(`${w.en}s`, text) || sameText(`${w.en}es`, text))
  );
}

/**
 * Listening cloze questions (聽力填空) for the task's `cloze` items. When the missing word
 * starts with a capital in the line, every option gets one, so the capital gives nothing away.
 * The answer is scheduled as the taught word when it is one or its plural (looked up in
 * `units`), else as
 * the line's chunk, else not at all.
 */
function clozeQuestions(unit: Unit, task: Task, rng: Rng, units: readonly Unit[]): ClozeQuestion[] {
  return (task.cloze ?? []).flatMap((item) => {
    const line = task.scene.find((l) => l.id === item.lineId);
    const cut = line ? cutAtWord(line.en, item.word) : null;
    if (!line || !cut) return [];
    const label = /^[A-Z]/.test(cut.found) ? capitalized : (text: string) => text;
    const word = taughtWord(units, cut.found);
    const itemId = word ? wordItemId(word.id) : line.chunkId ? chunkItemId(line.chunkId) : NO_ITEM;
    const options = [cut.found, ...item.distractors.map(label)].map((text, i) => ({
      id: `o${i}`,
      label: text,
    }));
    return [
      {
        kind: 'cloze' as const,
        audioId: `${unit.id}.line.${line.id}`,
        before: cut.before,
        after: cut.after,
        answer: cut.found,
        zh: line.zh,
        options: shuffle(options, rng),
        correctId: 'o0',
        itemId,
      },
    ];
  });
}

/** Reading questions (讀招牌／價目) for the task's `signs`, options in a shuffled order. */
function signQuestions(task: Task, rng: Rng): SignQuestion[] {
  return (task.signs ?? []).map((sign) => {
    const question: SignQuestion = {
      kind: 'read-sign',
      rows: sign.rows,
      en: sign.question.en,
      zh: sign.question.zh,
      options: shuffle(
        sign.options.map((label, i) => ({ id: `o${i}`, label })),
        rng,
      ),
      correctId: `o${sign.answer}`,
      itemId: NO_ITEM,
    };
    if (sign.heading) question.heading = sign.heading;
    return question;
  });
}

/**
 * Each typed letter against the answer at the same place (case ignored); letters past
 * the end of the answer are wrong.
 */
export function spellMarks(typed: string, answer: string): ('right' | 'wrong')[] {
  const target = answer.toLowerCase();
  return [...typed.toLowerCase()].map((letter, i) => (letter === target[i] ? 'right' : 'wrong'));
}

/**
 * Ordered practice for one task, easy to hard. Listening cloze comes after the
 * listen-and-pick questions, signs to read and pictures after choosing replies, then
 * sentence fills, text fills (one blank at a time), passages to read and conversations or
 * monologues to hear (one sentence, then a short text, then a conversation heard only
 * once), then 應答題 heard by ear, all before arranging; typing questions
 * (`spellWordIds`) after arranging and before speaking. Typed and blanked words are looked
 * up in `units` (pass every unit, since they may come from an earlier one).
 */
export function buildTaskPractice(
  unit: Unit,
  task: Task,
  rng: Rng,
  units: readonly Unit[] = [unit],
): Question[] {
  const words = task.newWordIds
    .map((id) => unit.words.find((w) => w.id === id))
    .filter((w): w is Word => w !== undefined);
  const chunks = task.newChunkIds
    .map((id) => unit.chunks.find((c) => c.id === id))
    .filter((c): c is Chunk => c !== undefined);
  const pairs = (task.newPairIds ?? [])
    .map((id) => unit.pairs?.find((p) => p.id === id))
    .filter((p): p is MinimalPair => p !== undefined);

  return [
    ...compact(words.map((w) => listenPickWord(unit, w, rng))),
    ...pairQuestions(unit, pairs, rng),
    ...compact(chunks.map((c) => listenPickChunk(unit, c, rng))),
    ...clozeQuestions(unit, task, rng, units),
    ...chooseReplies(unit, task, rng),
    ...signQuestions(task, rng),
    ...pictureQuestions(unit, task, rng),
    ...fillQuestions(task, rng),
    ...textFillQuestions(task, rng),
    ...passageQuestions(task, rng),
    ...talkQuestions(unit, task, rng),
    ...respondQuestions(unit, task, rng),
    ...compact(chunks.map((c) => arrangeChunk(unit, c, rng))),
    ...compact((task.spellWordIds ?? []).map((id) => spellWord(units, id))),
    ...chunks.map((c) => speakChunk(unit, c)),
  ];
}

export const ROLE_PLAY_PROMPT = '換你說：把單字排成你要說的話';

/**
 * One arrange question per player line of a role-play task, in order. The learner
 * builds the whole line (it may say more than its chunk); it is scheduled as its chunk.
 */
export function buildRolePlayTurns(unit: Unit, task: Task, rng: Rng): ArrangeQuestion[] {
  return task.scene.flatMap((line) => {
    if (line.speaker !== 'player' || !line.chunkId) return [];
    const chunk = unit.chunks.find((c) => c.id === line.chunkId);
    const words = line.en.split(/\s+/).map(blockText).filter(Boolean);
    if (!chunk || words.length < 1) return [];
    const accepted = [line.en, ...(sameText(line.en, chunk.en) ? (chunk.accept ?? []) : [])];
    const question: ArrangeQuestion = {
      kind: 'arrange',
      zh: line.zh,
      audioId: `${unit.id}.line.${line.id}`,
      blocks: shuffleBlocks(words, accepted, rng),
      accepted,
      itemId: chunkItemId(chunk.id),
      prompt: ROLE_PLAY_PROMPT,
      zhOnRequest: true,
    };
    return [question];
  });
}

/**
 * How many scene lines are in the chat during role-play turn `turn` (0-based): every
 * line before that turn's player line. Past the last turn, the whole scene.
 */
export function rolePlayShown(scene: readonly SceneLine[], turn: number): number {
  let seen = 0;
  for (let i = 0; i < scene.length; i++) {
    const line = scene[i];
    if (line?.speaker !== 'player' || !line.chunkId) continue;
    if (seen === turn) return i;
    seen += 1;
  }
  return scene.length;
}

/** One step of a role-play: a question, and how many scene lines the chat shows meanwhile. */
export interface RolePlayStep {
  question: ArrangeQuestion | SpeakQuestion;
  shown: number;
}

/**
 * The role-play in order. Each turn is an arrange question with the conversation
 * so far in the chat. With `speak`, a 跟我說 step follows it: the built line has
 * joined the chat and the learner says it aloud (never graded).
 */
export function rolePlaySteps(
  scene: readonly SceneLine[],
  turns: readonly ArrangeQuestion[],
  speak: boolean,
): RolePlayStep[] {
  return turns.flatMap((turn, index) => {
    const before = rolePlayShown(scene, index);
    const arrange: RolePlayStep = { question: turn, shown: before };
    if (!speak) return [arrange];
    const say: SpeakQuestion = {
      kind: 'speak',
      audioId: turn.audioId,
      en: turn.accepted[0] ?? '',
      zh: turn.zh,
      itemId: turn.itemId,
    };
    return [arrange, { question: say, shown: Math.min(before + 1, scene.length) }];
  });
}

/** Mixed listen-pick / arrange questions for due review items. Unknown ids are ignored. */
export function buildReviewQuestions(unit: Unit, itemIds: string[], rng: Rng): Question[] {
  const questions: Question[] = [];
  for (const itemId of itemIds) {
    const [kind, id] = itemId.split(':');
    if (kind === 'word') {
      const word = unit.words.find((w) => w.id === id);
      const q = word ? listenPickWord(unit, word, rng) : null;
      if (q) questions.push(q);
    } else if (kind === 'chunk') {
      const chunk = unit.chunks.find((c) => c.id === id);
      if (!chunk) continue;
      const preferArrange = rng() < 0.5;
      const q = preferArrange
        ? (arrangeChunk(unit, chunk, rng) ?? listenPickChunk(unit, chunk, rng))
        : (listenPickChunk(unit, chunk, rng) ?? arrangeChunk(unit, chunk, rng));
      if (q) questions.push(q);
    } else if (kind === 'pair') {
      const pair = unit.pairs?.find((p) => p.id === id);
      if (pair) questions.push(listenPair(unit, pair, rng() < 0.5 ? 'a' : 'b', rng));
    }
  }
  return questions;
}

/**
 * 單字快練: one listen-pick per word, in a shuffled order. Wrong options come from
 * `pool` (words of the places being taught and words already learned), so a round
 * that mixes two places still has four options.
 */
export function buildSprintQuestions(
  entries: readonly { unit: Unit; word: Word }[],
  pool: readonly Word[],
  rng: Rng,
): Question[] {
  const unique = [...new Map(pool.map((w) => [w.id, w])).values()];
  return shuffle(
    entries.flatMap(({ unit, word }) => listenPickWord(unit, word, rng, unique) ?? []),
    rng,
  );
}

/** Joins the chosen blocks (indices into `blocks`) into a sentence. */
export function sentenceFrom(blocks: readonly string[], placed: readonly number[]): string {
  return placed.map((i) => blocks[i] ?? '').join(' ');
}
