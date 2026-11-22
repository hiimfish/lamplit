/**
 * 聽對話答題 (TOEIC Part 3): one question per ChoiceQuestion of each TalkItem of a task,
 * each carrying the whole conversation; the questions on one talk come one after another.
 * Minimal version; the rendering is src/ui/minigames/Talk.tsx.
 */
import type { Role, Task, Unit } from '../../content/types';
import { NO_ITEM } from '../questions';
import { shuffledOptions, type Rng } from './common';

/** Hear a short conversation, then answer one question about it. */
export interface TalkQuestion {
  kind: 'talk';
  /** The talk's id, the same for every question on it. */
  talkId: string;
  /** The conversation in order; each line's clip is `${unitId}.talk.${lineId}`. */
  lines: { audioId: string; role: Role; en: string; zh: string }[];
  /** The question, in English and Chinese. */
  en: string;
  zh: string;
  options: { id: string; label: string }[];
  correctId: string;
  /** Which question on this talk it is (0-based), and how many there are. */
  index: number;
  total: number;
  /** Always NO_ITEM: understanding a conversation is not one item to review. */
  itemId: string;
}

/** Audio id of a talk line. */
export const talkAudioId = (unitId: string, lineId: string) => `${unitId}.talk.${lineId}`;

/** Talk questions for the task's `talks`, in order, options in a shuffled order. */
export function talkQuestions(unit: Unit, task: Task, rng: Rng): TalkQuestion[] {
  return (task.talks ?? []).flatMap((talk) => {
    const lines = talk.lines.map((line) => ({
      audioId: talkAudioId(unit.id, line.id),
      role: line.role,
      en: line.en,
      zh: line.zh,
    }));
    return talk.questions.map((q, index) => ({
      kind: 'talk' as const,
      talkId: talk.id,
      lines,
      en: q.en,
      zh: q.zh,
      options: shuffledOptions(q.options, rng),
      correctId: `o${q.answer}`,
      index,
      total: talk.questions.length,
      itemId: NO_ITEM,
    }));
  });
}
