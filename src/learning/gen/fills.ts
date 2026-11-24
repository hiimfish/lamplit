/**
 * 句子填空 and 文法填空 (TOEIC Part 5): one question per FillItem of a task. No audio.
 * Deterministic for a given rng; the rendering is src/ui/minigames/Fill.tsx.
 */
import type { Task } from '../../content/types';
import { NO_ITEM } from '../questions';
import { chunkItemId, shuffledOptions, type Rng } from './common';

/** Read a sentence with one blank and pick the word or phrase that fits. */
export interface FillQuestion {
  kind: 'fill';
  /** The sentence before and after the blank. */
  before: string;
  after: string;
  /** The right option, as it is written in the content. */
  answer: string;
  /** The whole sentence in Chinese, shown after answering. */
  zh: string;
  /** Why, in Chinese, shown after answering. */
  note?: string;
  options: { id: string; label: string }[];
  correctId: string;
  /** The sentence's `chunk:<id>` when it has one, else NO_ITEM. */
  itemId: string;
  /** 文法填空: the options are forms of one word (the screen says so). */
  grammar?: true;
  /** GRAMMAR_POINTS ids of a sentence built by the generator (logged as `g:<id>`). */
  grammarIds?: string[];
}

const BLANK = '___';

/** Fill questions for the task's `fills`, options in a shuffled order. */
export function fillQuestions(task: Task, rng: Rng): FillQuestion[] {
  return (task.fills ?? []).flatMap((fill) => {
    const at = fill.en.indexOf(BLANK);
    const answer = fill.options[fill.answer];
    if (at < 0 || answer === undefined) return [];
    const question: FillQuestion = {
      kind: 'fill',
      before: fill.en.slice(0, at),
      after: fill.en.slice(at + BLANK.length),
      answer,
      zh: fill.zh,
      options: shuffledOptions(fill.options, rng),
      correctId: `o${fill.answer}`,
      itemId: fill.chunkId ? chunkItemId(fill.chunkId) : NO_ITEM,
    };
    if (fill.note) question.note = fill.note;
    if (fill.grammar) question.grammar = true;
    return [question];
  });
}
