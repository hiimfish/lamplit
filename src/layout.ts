/**
 * Pixel-perfect layout.
 *
 * The game is drawn at a small "logical" resolution and scaled up by a whole
 * number of *device* pixels, so every logical pixel is the same size on screen.
 * The logical size flexes a little so the scene fills the screen instead of
 * leaving wide margins.
 */

const LANDSCAPE_MIN_W = 400;
const LANDSCAPE_MIN_H = 225;
const LANDSCAPE_MAX_W = 560;
const LANDSCAPE_MAX_H = 315;

const PORTRAIT_MIN_W = 240;
const PORTRAIT_MAX_W = 400;
const PORTRAIT_SCENE_H = 180;
const PORTRAIT_MIN_SCENE_H = 120;
/** In portrait the scene sits on top and may use at most this share of the height. */
const PORTRAIT_MAX_SCENE_SHARE = 0.45;

type Orientation = 'landscape' | 'portrait';

export interface Layout {
  orientation: Orientation;
  /** Device pixels per logical pixel. Always a whole number, at least 1. */
  zoom: number;
  /** CSS pixels per logical pixel (zoom / devicePixelRatio). */
  px: number;
  /** Logical size of the game canvas. */
  sceneW: number;
  sceneH: number;
  /** On-screen size of the game canvas in CSS pixels. */
  cssW: number;
  cssH: number;
  /**
   * Where the canvas sits in the viewport, in CSS pixels. Snapped to whole
   * device pixels: a half-pixel offset would make the browser blur the canvas.
   */
  offsetX: number;
  offsetY: number;
}

export function computeLayout(viewportW: number, viewportH: number, dpr: number): Layout {
  const ratio = dpr > 0 ? dpr : 1;
  const physW = Math.max(1, Math.floor(viewportW * ratio));
  const physH = Math.max(1, Math.floor(viewportH * ratio));
  const orientation: Orientation = viewportH > viewportW ? 'portrait' : 'landscape';

  let zoom: number;
  let sceneW: number;
  let sceneH: number;

  if (orientation === 'landscape') {
    zoom = Math.max(1, Math.floor(Math.min(physW / LANDSCAPE_MIN_W, physH / LANDSCAPE_MIN_H)));
    sceneW = Math.min(LANDSCAPE_MAX_W, Math.floor(physW / zoom));
    sceneH = Math.min(LANDSCAPE_MAX_H, Math.floor(physH / zoom));
  } else {
    zoom = Math.max(1, Math.floor(physW / PORTRAIT_MIN_W));
    sceneW = Math.min(PORTRAIT_MAX_W, Math.floor(physW / zoom));
    const maxByShare = Math.floor((physH * PORTRAIT_MAX_SCENE_SHARE) / zoom);
    sceneH = Math.min(PORTRAIT_SCENE_H, Math.max(PORTRAIT_MIN_SCENE_H, maxByShare));
  }

  const px = zoom / ratio;
  const physOffsetX = Math.max(0, Math.floor((physW - sceneW * zoom) / 2));
  const physOffsetY =
    orientation === 'landscape' ? Math.max(0, Math.floor((physH - sceneH * zoom) / 2)) : 0;
  return {
    orientation,
    zoom,
    px,
    sceneW,
    sceneH,
    cssW: sceneW * px,
    cssH: sceneH * px,
    offsetX: physOffsetX / ratio,
    offsetY: physOffsetY / ratio,
  };
}

export function sameLayout(a: Layout, b: Layout): boolean {
  return (
    a.orientation === b.orientation &&
    a.zoom === b.zoom &&
    a.px === b.px &&
    a.sceneW === b.sceneW &&
    a.sceneH === b.sceneH &&
    a.offsetX === b.offsetX &&
    a.offsetY === b.offsetY
  );
}
