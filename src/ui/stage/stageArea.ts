import { CORE_H, CORE_W } from '../../art/stage';
import type { Layout } from '../../layout';

/** Where the stage goes on screen: a w x h area (logical pixels), drawn at `scale`. */
export interface StageArea {
  w: number;
  h: number;
  /** Whole-number size of one stage pixel, in logical pixels. */
  scale: number;
}

/**
 * The cast, bubbles and props of every stage stay inside the middle CORE_VIEW_W
 * pixels of the core (x 16 to 112), so a narrow stage may crop the core's
 * edges (a plant, half the coffee machine) without hiding anything that matters.
 */
export const CORE_VIEW_W = 96;
export const CORE_VIEW_X = (CORE_W - CORE_VIEW_W) / 2;

/** In landscape the story card keeps this much width (logical pixels) beside the stage. */
export const LANDSCAPE_CARD_W = 230;
/** On small landscape screens the card may shrink to this to keep the stage at 2x. */
export const LANDSCAPE_CARD_MIN_W = 190;
/** Landscape never draws the stage bigger than this, so the card keeps its room. */
const LANDSCAPE_MAX_SCALE = 2;

/**
 * Where the stage goes, edge to edge:
 * - portrait: the whole street area above the panel, at the largest whole
 *   scale that fits the whole 128x64 core;
 * - landscape: a full-height column on the left and the story card on the
 *   right. The column takes what the card leaves (at most two cores wide) and
 *   the scale is the largest that still shows the middle of the core.
 *
 * `reserveH` logical pixels at the bottom of the scene are left for something
 * else (the town's name plate and keys); the stage gets the height above them.
 */
export function stageArea(layout: Layout, reserveH = 0): StageArea {
  const { sceneW } = layout;
  const sceneH = layout.sceneH - reserveH;
  if (layout.orientation === 'portrait') {
    return { w: sceneW, h: sceneH, scale: fit(sceneW / CORE_W, sceneH / CORE_H) };
  }
  let w = Math.min(CORE_W * 2, Math.max(CORE_VIEW_W, sceneW - LANDSCAPE_CARD_W));
  // On a small screen, keep 2x by cropping the core to its middle, as long as
  // the card still gets LANDSCAPE_CARD_MIN_W.
  const twoX = CORE_VIEW_W * 2;
  if (w < twoX && sceneW - twoX >= LANDSCAPE_CARD_MIN_W && sceneH >= CORE_H * 2) w = twoX;
  const scale = Math.min(LANDSCAPE_MAX_SCALE, fit(w / CORE_VIEW_W, sceneH / CORE_H));
  return { w, h: sceneH, scale };
}

function fit(...ratios: number[]): number {
  return Math.max(1, Math.floor(Math.min(...ratios)));
}

/** The painted stage in stage pixels: the area rounded up, at least the core's height. */
export function stageCanvasSize(area: StageArea): { w: number; h: number } {
  return {
    w: Math.ceil(area.w / area.scale),
    h: Math.max(CORE_H, Math.ceil(area.h / area.scale)),
  };
}
