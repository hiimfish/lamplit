/**
 * 看圖選句 and 看圖選句聲音選項 (TOEIC Part 1): checks a task's `pictures` (PictureItem in
 * types.ts). A picture item has 2 to 4 sentences; a `listen` item (Act 4 on) exactly 4, which
 * are heard in the announcer's voice instead of read.
 * (tests/pictures.test.ts checks that every pictureId has a picture in src/art/pictures;
 * tests/smoothness.test.ts that the sentences use taught words.)
 */
import type { Role } from '../types';
import {
  allDifferent,
  ID_PATTERN,
  isAct4,
  isIndex,
  isText,
  list,
  type TaskCheckContext,
} from './common';

/** A sound-option picture item has exactly this many sentences (A to D). */
export const LISTEN_PICTURE_OPTIONS = 4;

/** Who says the sentences of a sound-option picture item. */
export const LISTEN_PICTURE_ROLE: Role = 'announcer';

/** Audio id of option `index` (0-based, content order) of a sound-option picture item. */
export const pictureOptionAudioId = (unitId: string, itemId: string, index: number) =>
  `${unitId}.pictureopt.${itemId}_${index}`;

/** Problems with the task's `pictures`, or none when it has no such field. */
export function checkPictures(task: Record<string, unknown>, ctx: TaskCheckContext): string[] {
  if (task.pictures === undefined) return [];
  const pictures = list(task.pictures);
  if (!pictures || pictures.length === 0) return ['pictures must be a non-empty list'];
  const problems: string[] = [];
  const seen = ctx.seen('picture');
  for (const picture of pictures) {
    const label = `picture "${String(picture.id)}"`;
    if (typeof picture.id !== 'string' || !ID_PATTERN.test(picture.id)) {
      problems.push(`${label} has a bad id`);
    } else if (seen.has(picture.id)) {
      problems.push(`duplicate picture id "${picture.id}"`);
    } else {
      seen.add(picture.id);
    }
    if (typeof picture.pictureId !== 'string' || !ID_PATTERN.test(picture.pictureId)) {
      problems.push(`${label} has a bad pictureId`);
    }
    const listen = picture.listen;
    if (listen !== undefined && listen !== true) {
      problems.push(`${label} has bad listen "${String(listen)}" (true, or leave it out)`);
    } else if (listen === true && !isAct4(ctx)) {
      problems.push(`${label} hears its sentences (listen), which is for Act 4 units only`);
    }
    const options = list(picture.options);
    const optionsOk =
      options !== null &&
      options.length >= 2 &&
      options.length <= 4 &&
      options.every((o) => isText(o.en) && isText(o.zh)) &&
      allDifferent(options.map((o) => String(o.en)));
    if (!optionsOk) {
      problems.push(`${label} needs 2 to 4 different sentences with en and zh`);
    } else if (listen === true && options.length !== LISTEN_PICTURE_OPTIONS) {
      problems.push(
        `${label} hears its sentences (listen) and needs exactly ${LISTEN_PICTURE_OPTIONS} (has ${options.length})`,
      );
    } else if (!isIndex(picture.answer, options.length)) {
      problems.push(`${label} has a bad answer`);
    }
  }
  return problems;
}
