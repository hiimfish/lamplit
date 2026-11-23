/**
 * 讀短文 (TOEIC Part 7): one question per ChoiceQuestion of each PassageItem of a task,
 * each carrying the whole passage (every text of a 兩篇／三篇一組 set); the questions on one
 * passage come one after another, in the order the content gives them. The rendering is
 * src/ui/minigames/ReadPassage.tsx.
 */
import { isPassageSet, type PassageKind, type PassageText, type Task } from '../../content/types';
import { NO_ITEM } from '../questions';
import { shuffledOptions, type Rng } from './common';

/** One text of a passage set, as the screen shows it. */
export interface PassageQuestionText {
  passageKind: PassageKind;
  title?: string;
  lines: string[];
}

/**
 * A short text (message, flyer, notice, ad, form, email), or a set of 2 or 3 of them, and
 * one question about it.
 */
export interface PassageQuestion {
  kind: 'read-passage';
  /** The passage's id, the same for every question on it. */
  passageId: string;
  /** A single passage's text; for a set, its first text (all of them are in `texts`). */
  passageKind: PassageKind;
  title?: string;
  lines: string[];
  /** 兩篇／三篇一組: every text of the set, in reading order. Absent for a single passage. */
  texts?: PassageQuestionText[];
  /** For a set, the texts this question needs (indexes in `texts`), when the content marks them. */
  needs?: number[];
  /** For a set, the text that holds `answerLine` (an index in `texts`). */
  answerText?: number;
  /** The question, in English and Chinese. */
  en: string;
  zh: string;
  options: { id: string; label: string }[];
  correctId: string;
  /**
   * Index in `lines` of the line that holds the answer, highlighted after answering:
   * the first line containing the right option's text as whole words, ignoring case.
   * Absent when no line does (then nothing is highlighted rather than a guess). For a set,
   * an index in the lines of `texts[answerText]`.
   */
  answerLine?: number;
  /** Which question on this passage it is (0-based), and how many there are. */
  index: number;
  total: number;
  /** Always NO_ITEM: reading a passage is not one item to review. */
  itemId: string;
}

const isWordChar = (ch: string | undefined) => ch !== undefined && /[a-z0-9]/i.test(ch);

/**
 * Index of the first line that contains `answer` (ignoring case and surrounding space),
 * not as part of a longer word: "May" is found in "April and May." but not in "Mayor".
 * Returns -1 when no line does.
 */
export function findAnswerLine(lines: readonly string[], answer: string): number {
  const needle = answer.trim().toLowerCase().replace(/\s+/g, ' ');
  if (needle === '') return -1;
  return lines.findIndex((line) => {
    const hay = line.toLowerCase().replace(/\s+/g, ' ');
    for (let at = hay.indexOf(needle); at >= 0; at = hay.indexOf(needle, at + 1)) {
      const before = hay[at - 1];
      const after = hay[at + needle.length];
      // Only a letter or digit glued to the match makes it part of another word.
      const gluedBefore = isWordChar(before) && isWordChar(needle[0]);
      const gluedAfter = isWordChar(after) && isWordChar(needle[needle.length - 1]);
      if (!gluedBefore && !gluedAfter) return true;
    }
    return false;
  });
}

const viewOf = (text: PassageText): PassageQuestionText => {
  const view: PassageQuestionText = { passageKind: text.kind, lines: text.lines };
  if (text.title) view.title = text.title;
  return view;
};

/** Passage questions for the task's `passages`, in order, options in a shuffled order. */
export function passageQuestions(task: Task, rng: Rng): PassageQuestion[] {
  return (task.passages ?? []).flatMap((passage) => {
    const set = isPassageSet(passage);
    const texts = set ? passage.texts : [passage];
    const first = texts[0];
    if (!first) return [];
    return passage.questions.map((q, index) => {
      const question: PassageQuestion = {
        kind: 'read-passage',
        passageId: passage.id,
        passageKind: first.kind,
        lines: first.lines,
        en: q.en,
        zh: q.zh,
        options: shuffledOptions(q.options, rng),
        correctId: `o${q.answer}`,
        index,
        total: passage.questions.length,
        itemId: NO_ITEM,
      };
      if (first.title) question.title = first.title;
      const answer = q.options[q.answer] ?? '';
      if (set) {
        question.texts = texts.map(viewOf);
        if ('needs' in q && q.needs) question.needs = q.needs;
        // The first text (in the needed ones first, when marked) with a line holding the answer.
        const order = [...(question.needs ?? []), ...texts.keys()];
        for (const t of order) {
          const line = findAnswerLine(texts[t]?.lines ?? [], answer);
          if (line >= 0) {
            question.answerText = t;
            question.answerLine = line;
            break;
          }
        }
      } else {
        const line = findAnswerLine(first.lines, answer);
        if (line >= 0) question.answerLine = line;
      }
      return question;
    });
  });
}
