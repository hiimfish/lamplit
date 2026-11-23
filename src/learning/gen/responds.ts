/**
 * 應答題 (TOEIC Part 2, sound only): one question per RespondItem of a task, in order. The
 * prompt is heard in its role's voice, then the three responses (shuffled into A, B, C) in
 * yours. Rendering: src/ui/minigames/Respond.tsx.
 */
import type { Role, Task, Unit } from '../../content/types';
import { respondAudioId, responseAudioId } from '../../content/checks/responds';
import { NO_ITEM } from '../questions';
import { shuffle, type Rng } from './common';

/** Hear a question or remark and three responses; pick the response that fits. */
export interface RespondQuestion {
  kind: 'respond';
  /** The item's id. */
  respondId: string;
  /** The prompt: who says it, its clip, and its text (shown only after answering). */
  prompt: { role: Role; audioId: string; en: string; zh: string };
  /** The responses in the order heard (A, B, C); ids `o0`.. by their place in the content. */
  options: { id: string; audioId: string; en: string; zh: string }[];
  correctId: string;
  /** Which item of the task it is (0-based), and how many there are. */
  index: number;
  total: number;
  /** Always NO_ITEM: answering by ear is not one item to review. */
  itemId: string;
}

/** 應答題 questions for the task's `responds`, in order, responses in a shuffled order. */
export function respondQuestions(unit: Unit, task: Task, rng: Rng): RespondQuestion[] {
  const items = task.responds ?? [];
  return items.map((item, index) => ({
    kind: 'respond',
    respondId: item.id,
    prompt: {
      role: item.prompt.role,
      audioId: respondAudioId(unit.id, item.id),
      en: item.prompt.en,
      zh: item.prompt.zh,
    },
    options: shuffle(
      item.responses.map((response, i) => ({
        id: `o${i}`,
        audioId: responseAudioId(unit.id, item.id, i),
        en: response.en,
        zh: response.zh,
      })),
      rng,
    ),
    correctId: `o${item.answer}`,
    index,
    total: items.length,
    itemId: NO_ITEM,
  }));
}
