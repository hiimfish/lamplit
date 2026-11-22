/**
 * 聽對話答題 (TOEIC Part 3) and 聽獨白答題 (TOEIC Part 4): one question per ChoiceQuestion
 * of each TalkItem of a task, each carrying the whole conversation (and its table, if any);
 * the questions on one talk come one after another, in the content's order. Only the
 * options are shuffled. Rendering: src/ui/minigames/Talk.tsx.
 */
import type { Role, TalkTable, Task, Unit } from '../../content/types';
import { NO_ITEM } from '../questions';
import { shuffledOptions, type Rng } from './common';

/** Hear a short conversation or monologue, then answer one question about it. */
export interface TalkQuestion {
  kind: 'talk';
  /** The talk's id, the same for every question on it. */
  talkId: string;
  /** The conversation in order; each line's clip is `${unitId}.talk.${lineId}`. */
  lines: { audioId: string; role: Role; en: string; zh: string }[];
  /** The speakers in the order they first speak (two for a checked conversation, one for a monologue). */
  speakers: Role[];
  /** 聽獨白: one speaker (a voicemail, an announcement, a speech). */
  monologue?: true;
  /** A table shown while listening and answering (Part 3 with a graphic); not spoken. */
  table?: TalkTable;
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
    const speakers = [...new Set(lines.map((line) => line.role))];
    return talk.questions.map((q, index) => {
      const question: TalkQuestion = {
        kind: 'talk',
        talkId: talk.id,
        lines,
        speakers,
        en: q.en,
        zh: q.zh,
        options: shuffledOptions(q.options, rng),
        correctId: `o${q.answer}`,
        index,
        total: talk.questions.length,
        itemId: NO_ITEM,
      };
      if (talk.kind === 'monologue') question.monologue = true;
      if (talk.table) question.table = talk.table;
      return question;
    });
  });
}
