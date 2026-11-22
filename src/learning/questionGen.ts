/**
 * Builds the questions for a task or a review session. Pure: all randomness comes from a
 * seeded RNG so tests are deterministic.
 *
 * Item ids: `chunk:<id>`, `word:<id>` and `pair:<id>` (also used in AnswerResult.itemId).
 */
import type { Chunk, MinimalPair, Task, Unit, Word } from '../content/types';
import { normalize } from './grading';
import type {
  ArrangeQuestion,
  ChooseReplyQuestion,
  ListenPairQuestion,
  ListenPickQuestion,
  Question,
  SpeakQuestion,
} from './questions';

/** Returns numbers in [0, 1). */
export type Rng = () => number;

/** Small seeded generator (mulberry32). */
export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = out[i] as T;
    out[i] = out[j] as T;
    out[j] = a;
  }
  return out;
}

const chunkItemId = (id: string) => `chunk:${id}`;
const wordItemId = (id: string) => `word:${id}`;
const pairItemId = (id: string) => `pair:${id}`;

const MAX_OPTIONS = 4;

function sameText(a: string, b: string): boolean {
  return normalize(a) === normalize(b);
}

function listenPickWord(unit: Unit, word: Word, rng: Rng): ListenPickQuestion | null {
  const others = shuffle(
    unit.words.filter((w) => w.id !== word.id && !sameText(w.en, word.en)),
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

function arrangeChunk(unit: Unit, chunk: Chunk, rng: Rng): ArrangeQuestion | null {
  const words = chunk.en.split(/\s+/).filter(Boolean);
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

/** Ordered practice for one task, easy to hard. */
export function buildTaskPractice(unit: Unit, task: Task, rng: Rng): Question[] {
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
    ...chooseReplies(unit, task, rng),
    ...compact(chunks.map((c) => arrangeChunk(unit, c, rng))),
    ...chunks.map((c) => speakChunk(unit, c)),
  ];
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

/** Joins the chosen blocks (indices into `blocks`) into a sentence. */
export function sentenceFrom(blocks: readonly string[], placed: readonly number[]): string {
  return placed.map((i) => blocks[i] ?? '').join(' ');
}
