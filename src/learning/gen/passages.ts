/**
 * 讀短文 (TOEIC Part 7): one question per ChoiceQuestion of each PassageItem of a task,
 * each carrying the whole passage; the questions on one passage come one after another.
 * Minimal version; the rendering is src/ui/minigames/ReadPassage.tsx.
 */
import type { PassageKind, Task } from '../../content/types';
import { NO_ITEM } from '../questions';
import { shuffledOptions, type Rng } from './common';

/** A short text (message, flyer, notice, ad, form, email) and one question about it. */
export interface PassageQuestion {
  kind: 'read-passage';
  /** The passage's id, the same for every question on it. */
  passageId: string;
  passageKind: PassageKind;
  title?: string;
  lines: string[];
  /** The question, in English and Chinese. */
  en: string;
  zh: string;
  options: { id: string; label: string }[];
  correctId: string;
  /** Which question on this passage it is (0-based), and how many there are. */
  index: number;
  total: number;
  /** Always NO_ITEM: reading a passage is not one item to review. */
  itemId: string;
}

/** Passage questions for the task's `passages`, in order, options in a shuffled order. */
export function passageQuestions(task: Task, rng: Rng): PassageQuestion[] {
  return (task.passages ?? []).flatMap((passage) =>
    passage.questions.map((q, index) => {
      const question: PassageQuestion = {
        kind: 'read-passage',
        passageId: passage.id,
        passageKind: passage.kind,
        lines: passage.lines,
        en: q.en,
        zh: q.zh,
        options: shuffledOptions(q.options, rng),
        correctId: `o${q.answer}`,
        index,
        total: passage.questions.length,
        itemId: NO_ITEM,
      };
      if (passage.title) question.title = passage.title;
      return question;
    }),
  );
}
