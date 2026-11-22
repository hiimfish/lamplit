import type { Painter } from '../../game/painter';
import { ACT1_PICTURES } from './act1';
import { ACT2_PICTURES } from './act2';

/**
 * Small scenes for the 看圖選句 question (look at the picture, pick the sentence that
 * describes it): one or two people doing something, so the present continuous can be
 * read off the picture. Each picture paints a fixed PICTURE_W x PICTURE_H frame with
 * palette colours and whole pixels, the same every time. Keyed by picture id (the
 * `pictureId` of a task's `pictures` entry).
 */

export const PICTURE_W = 96;
export const PICTURE_H = 64;

/** Paints one picture into a PICTURE_W x PICTURE_H frame whose top left is (0, 0). */
export type PictureFn = (p: Painter) => void;

const PICTURES: Readonly<Record<string, PictureFn>> = { ...ACT1_PICTURES, ...ACT2_PICTURES };

export function getPicture(id: string): PictureFn | undefined {
  return Object.prototype.hasOwnProperty.call(PICTURES, id) ? PICTURES[id] : undefined;
}

/** Every picture id (for tests). */
export const PICTURE_IDS = Object.keys(PICTURES);
