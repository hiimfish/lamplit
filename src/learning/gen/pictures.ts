/**
 * 看圖選句 (TOEIC Part 1): one question per PictureItem of a task. A plain item shows its
 * sentences to read (src/ui/minigames/PictureChoose.tsx); a `listen` item
 * (看圖選句聲音選項) has its 4 sentences heard instead, each with its own clip in the
 * announcer's voice (src/ui/minigames/ListenPicture.tsx). Options are shuffled.
 */
import type { Task, Unit } from '../../content/types';
import { pictureOptionAudioId } from '../../content/checks/pictures';
import { NO_ITEM } from '../questions';
import { shuffle, type Rng } from './common';

/**
 * 看圖選句: a picture and 2 to 4 sentences, one of which describes it. With `listen`, the
 * 4 sentences are heard (each option has its `audioId`) and their text shows only after
 * answering.
 */
export interface PictureQuestion {
  kind: 'picture';
  /** Key of the picture in src/art/pictures. */
  pictureId: string;
  /**
   * Clip of the right sentence, played after answering (`${unitId}.picture.${id}`); for a
   * `listen` item, the right option's own clip.
   */
  audioId: string;
  /** In a shuffled order; ids `o0`.. by their place in the content. */
  options: { id: string; en: string; zh: string; audioId?: string }[];
  correctId: string;
  /** 看圖選句聲音選項: the sentences are heard, not shown, until answered. */
  listen?: true;
  /** Always NO_ITEM: describing a picture is not one item to review. */
  itemId: string;
}

/** Picture questions (看圖選句) for the task's `pictures`, sentences in a shuffled order. */
export function pictureQuestions(unit: Unit, task: Task, rng: Rng): PictureQuestion[] {
  return (task.pictures ?? []).map((picture) => {
    const listen = picture.listen === true;
    const options = picture.options.map((option, i) => ({
      id: `o${i}`,
      en: option.en,
      zh: option.zh,
      ...(listen ? { audioId: pictureOptionAudioId(unit.id, picture.id, i) } : {}),
    }));
    const question: PictureQuestion = {
      kind: 'picture',
      pictureId: picture.pictureId,
      audioId: listen
        ? pictureOptionAudioId(unit.id, picture.id, picture.answer)
        : `${unit.id}.picture.${picture.id}`,
      options: shuffle(options, rng),
      correctId: `o${picture.answer}`,
      itemId: NO_ITEM,
    };
    if (listen) question.listen = true;
    return question;
  });
}
