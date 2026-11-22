/**
 * 段落填空 (TOEIC Part 6): one question per blank of each TextFillItem of a task, each
 * carrying the whole text; the questions on one text come one after another, in blank
 * order. Only the options are shuffled. No audio. Rendering: src/ui/minigames/TextFill.tsx.
 */
import type { PassageKind, Task } from '../../content/types';
import { NO_ITEM } from '../questions';
import { shuffledOptions, type Rng } from './common';

/** How a blank is written in the lines. */
export const TEXT_BLANK = '___';

/** A short text with blanks; pick what fits blank `index`. */
export interface TextFillQuestion {
  kind: 'text-fill';
  /** The text's id, the same for every question on it. */
  textFillId: string;
  passageKind: PassageKind;
  /** Sender or heading. */
  title?: string;
  /** The text with every blank written "___", as in the content. */
  lines: string[];
  /** Chinese of each line with the answers in, shown after the last blank. */
  zh: string[];
  /** The right answer of every blank, in order: earlier blanks show theirs filled in. */
  answers: string[];
  /** Which blank this question asks (0-based), and how many blanks the text has. */
  index: number;
  total: number;
  options: { id: string; label: string }[];
  correctId: string;
  /** Why, in Chinese, shown after answering. */
  note?: string;
  /** Always NO_ITEM: filling a text is not one item to review. */
  itemId: string;
}

/** One piece of a text-fill line: plain text, or blank number `blank` (counted across all lines). */
export type TextFillPart = { text: string } | { blank: number };

/** The lines cut into text and blanks, blanks numbered across the whole text in reading order. */
export function textFillParts(lines: readonly string[]): TextFillPart[][] {
  let blank = 0;
  return lines.map((line) =>
    line.split(TEXT_BLANK).flatMap((text, i): TextFillPart[] => {
      const parts: TextFillPart[] = i > 0 ? [{ blank: blank++ }] : [];
      if (text !== '') parts.push({ text });
      return parts;
    }),
  );
}

/** Text-fill questions for the task's `textFills`, in order, options in a shuffled order. */
export function textFillQuestions(task: Task, rng: Rng): TextFillQuestion[] {
  return (task.textFills ?? []).flatMap((item) => {
    const answers = item.blanks.map((b) => b.options[b.answer] ?? '');
    return item.blanks.map((blank, index) => {
      const question: TextFillQuestion = {
        kind: 'text-fill',
        textFillId: item.id,
        passageKind: item.kind,
        lines: item.lines,
        zh: item.zh,
        answers,
        index,
        total: item.blanks.length,
        options: shuffledOptions(blank.options, rng),
        correctId: `o${blank.answer}`,
        itemId: NO_ITEM,
      };
      if (item.title) question.title = item.title;
      if (blank.note) question.note = blank.note;
      return question;
    });
  });
}
