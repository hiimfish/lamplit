import { ditherGradient, ditherRect, hash2, px, type Painter } from '../../game/painter';
import type { PaletteName } from '../../game/palette';
import type { PixelSprite } from '../../game/sprites';
import { clipped, coreOrigin, CORE_H, CORE_W } from './common';

/**
 * The convenience-store stage: the little shop downstairs from your flat, in
 * the evening. From the left: the glass front door with an umbrella stand,
 * a lit drinks fridge (you stand in front of it), a shelf of snacks, then the
 * counter on the right with the clerk behind it, a microwave on the back
 * counter and the register. Painted through the Painter interface, palette
 * colours only, whole pixels.
 *
 * Like the café it fills any size: the 128x64 core sits centred near the
 * bottom; extra wall goes above (ceiling lights, a security mirror, a "24"
 * sign, a poster), shop windows onto the night street to the left and more
 * shelves to the right of the counter.
 */

/** The counter's left edge and the y of its top surface, in core pixels (props rest on it). */
export const STORE_COUNTER = { x: 54, top: 40 } as const;

const FLOOR_TOP = 58;
/** The back counter behind the clerk: the y of its top. */
const BACK_TOP = 30;
/** Counter length past the core's right edge before it ends. */
const COUNTER_TAIL = 24;
/** Width of one window or shelf bay beside the core. */
const BAY_W = 44;

/** Colours of packets and bottles on the shelves. */
const GOODS: readonly PaletteName[] = ['red', 'lamp', 'leaf', 'sky', 'neon', 'honey', 'teal'];

/** Paints the store to fill a w x h stage (at least the 128x64 core). */
export function paintStore(target: Painter, w: number, h: number): void {
  const p = clipped(target, w, h);
  const { ox, oy } = coreOrigin(w, h);
  const floorTop = oy + FLOOR_TOP;
  const counterEnd = Math.min(w, ox + CORE_W + COUNTER_TAIL);

  // Pale wall under bright tube lights, a strip of store colours near the top.
  p.rect(0, 0, w, floorTop, 'fog');
  ditherRect(p, 0, 0, w, 2, 'concrete', 8);
  p.rect(0, oy + 1, w, 2, 'teal');
  p.rect(0, oy + 3, w, 1, 'lamp');
  p.rect(0, oy + 4, w, 1, 'red');
  p.rect(0, floorTop - 2, w, 2, 'stone');

  if (oy >= 8) paintTubeLights(p, w);
  // Signs hung from the ceiling over the fridge and the counter, "24h" over the door.
  if (oy >= 20) {
    paintHangingSign(p, ox + 20, oy - 14, 'red');
    paintHangingSign(p, ox + 86, oy - 14, 'teal');
  }
  if (oy >= 14 && ox + 1 >= 0) paint24Sign(p, ox + 1, oy - 12);
  if (oy >= 30) paintMirror(p, ox + 50, oy - 12);
  if (oy >= 36) paintPoster(p, ox + 64, oy - 30);

  // Shop windows onto the evening street to the left, more shelves past the counter.
  for (let x = ox - BAY_W; x + 6 >= 0; x -= BAY_W) paintShopWindow(p, x + 4, oy + 8, floorTop);
  for (let x = counterEnd + 4; x + BAY_W - 8 <= w; x += BAY_W) {
    paintShelf(p, x + 2, 34, oy + 12, floorTop);
  }

  paintFloor(p, w, floorTop, h);
  paintDoor(p, ox, oy + 8, floorTop);
  paintUmbrellaStand(p, ox + 8, floorTop);
  paintFridge(p, ox + 18, oy + 7, floorTop);
  paintShelf(p, ox + 39, 14, oy + 12, floorTop);

  // Behind the counter: a lit menu, the back counter with the microwave, goods shelf.
  paintMenuBox(p, ox + 58, oy + 8);
  paintBackCounter(p, ox + STORE_COUNTER.x, counterEnd, oy + BACK_TOP, oy + STORE_COUNTER.top);
  paintMicrowave(p, ox + 60, oy + BACK_TOP);
  paintBackShelf(p, ox + 114, oy + 9);

  paintCounter(
    p,
    ox + STORE_COUNTER.x,
    counterEnd,
    oy + STORE_COUNTER.top,
    oy + CORE_H,
    counterEnd < w,
  );
  paintRegister(p, ox + 113, oy + STORE_COUNTER.top);
}

/** Pale floor tiles with darker grout, a little shine. */
function paintFloor(p: Painter, w: number, floorTop: number, h: number): void {
  p.rect(0, floorTop, w, h - floorTop, 'concrete');
  p.rect(0, floorTop, w, 1, 'stone');
  for (let row = 0; floorTop + 3 + row * 4 < h; row++) {
    const y = floorTop + 3 + row * 4;
    p.rect(0, y, w, 1, 'stone');
  }
  for (let x = 3; x < w; x += 12) {
    for (let y = floorTop + 1; y < h; y++) {
      if ((y - floorTop) % 4 !== 3) px(p, x + Math.floor((y - floorTop) / 4) * 2, y, 'stone');
    }
  }
}

/** Fluorescent tubes along the ceiling. */
function paintTubeLights(p: Painter, w: number): void {
  for (let x = 6; x < w; x += 32) {
    p.rect(x, 2, 16, 2, 'stone');
    p.rect(x + 1, 3, 14, 1, 'paper');
  }
}

/** A sale card hanging from the ceiling (y 0) on two strings, its top left at (x, y). */
function paintHangingSign(p: Painter, x: number, y: number, color: PaletteName): void {
  const w = 15;
  p.rect(x + 2, 0, 1, y, 'stone');
  p.rect(x + w - 3, 0, 1, y, 'stone');
  p.rect(x, y, w, 8, color);
  p.rect(x + 1, y + 1, w - 2, 6, 'paper');
  p.rect(x + 1, y + 1, w - 2, 2, color);
  p.rect(x + 3, y + 4, 6, 1, 'ink');
  p.rect(x + 3, y + 5, 4, 1, 'stone');
  p.rect(x + 10, y + 4, 2, 2, color);
  p.rect(x + 1, y + 8, w - 1, 1, 'concrete');
}

/** A round security mirror up in the corner. */
function paintMirror(p: Painter, cx: number, cy: number): void {
  p.rect(cx + 4, cy - 1, 4, 1, 'stone');
  p.rect(cx - 2, cy - 4, 5, 9, 'ink');
  p.rect(cx - 4, cy - 2, 9, 5, 'ink');
  p.rect(cx - 3, cy - 3, 7, 7, 'ink');
  p.rect(cx - 2, cy - 3, 5, 7, 'sky');
  p.rect(cx - 3, cy - 2, 7, 5, 'sky');
  p.rect(cx - 1, cy - 2, 2, 1, 'paper');
  px(p, cx - 2, cy - 1, 'paper');
  p.rect(cx - 1, cy + 1, 4, 2, 'dusk');
}

/** A lit "24" sign: open all night. */
function paint24Sign(p: Painter, x: number, y: number): void {
  p.rect(x, y, 15, 9, 'ink');
  // "2"
  p.rect(x + 2, y + 2, 3, 1, 'lamp');
  px(p, x + 4, y + 3, 'lamp');
  p.rect(x + 2, y + 4, 3, 1, 'lamp');
  px(p, x + 2, y + 5, 'lamp');
  p.rect(x + 2, y + 6, 3, 1, 'lamp');
  // "4"
  p.rect(x + 6, y + 2, 1, 3, 'lamp');
  p.rect(x + 8, y + 2, 1, 5, 'lamp');
  px(p, x + 7, y + 4, 'lamp');
  // "h"
  p.rect(x + 10, y + 2, 1, 5, 'honey');
  p.rect(x + 11, y + 4, 1, 1, 'honey');
  p.rect(x + 12, y + 5, 1, 2, 'honey');
  p.rect(x + 1, y + 9, 13, 1, 'stone');
}

/** A poster for a cold drink. */
function paintPoster(p: Painter, x: number, y: number): void {
  p.rect(x, y, 16, 20, 'paper');
  p.rect(x, y, 16, 4, 'red');
  p.rect(x + 2, y + 1, 8, 1, 'paper');
  p.rect(x + 6, y + 6, 4, 1, 'stone');
  p.rect(x + 5, y + 7, 6, 9, 'teal');
  p.rect(x + 6, y + 10, 4, 3, 'paper');
  px(p, x + 6, y + 8, 'cyan');
  p.rect(x + 2, y + 17, 12, 1, 'concrete');
  p.rect(x + 1, y + 20, 15, 1, 'concrete');
}

/** A big shop window: the dark evening street, a few lights and a lit sign across the road. */
function paintShopWindow(p: Painter, x: number, top: number, floorTop: number): void {
  const w = 36;
  const h = floorTop - 6 - top;
  p.rect(x, top, w, h, 'stone');
  ditherGradient(p, x + 1, top + 1, w - 2, h - 2, ['deep', 'indigo', 'slate']);
  for (let i = 0; i < 5; i++) {
    const lx = x + 2 + Math.floor(hash2(x, i, 5) * (w - 4));
    const ly = top + 3 + Math.floor(hash2(x, i, 9) * Math.max(1, h - 12));
    px(p, lx, ly, hash2(x, i, 13) > 0.5 ? 'honey' : 'lamp');
  }
  p.rect(x + 1, top + h - 6, w - 2, 1, 'night'); // the far kerb
  p.rect(x + 18, top + 1, 1, h - 2, 'stone');
  p.rect(x + 3, top + h - 12, 10, 3, 'neonDeep'); // a sticker on the glass
  p.rect(x + 4, top + h - 11, 8, 1, 'paper');
  p.rect(x - 1, top + h, w + 2, 1, 'concrete');
  p.rect(x - 1, top + h + 1, w + 2, 1, 'stone');
}

/** The glass front door, the street dark behind it, with a push bar. */
function paintDoor(p: Painter, x: number, top: number, floorTop: number): void {
  const w = 17;
  const h = floorTop - top;
  p.rect(x, top, w, h, 'stone');
  ditherGradient(p, x + 2, top + 2, w - 4, h - 3, ['deep', 'indigo', 'slate']);
  px(p, x + 5, top + 9, 'honey');
  px(p, x + 11, top + 14, 'lamp');
  p.rect(x + 2, top + h - 10, w - 4, 1, 'night');
  // rain on the glass
  for (let i = 0; i < 6; i++) {
    const rx = x + 3 + Math.floor(hash2(i, 3, 21) * (w - 6));
    const ry = top + 4 + Math.floor(hash2(i, 7, 21) * (h - 14));
    p.rect(rx, ry, 1, 2, 'sky');
  }
  p.rect(x + 3, top + 22, w - 6, 1, 'fog'); // push bar
  p.rect(x + 4, top + 5, 6, 3, 'paper'); // "open" card
  p.rect(x + 5, top + 6, 4, 1, 'red');
}

/** An umbrella stand by the door with two wet umbrellas in it. */
function paintUmbrellaStand(p: Painter, x: number, floorTop: number): void {
  // umbrellas: shaft, canopy, crook handle
  p.rect(x + 2, floorTop - 15, 1, 4, 'ink');
  px(p, x + 1, floorTop - 15, 'ink');
  p.rect(x + 1, floorTop - 11, 3, 4, 'red');
  px(p, x + 3, floorTop - 11, 'maroon');
  p.rect(x + 6, floorTop - 13, 1, 3, 'ink');
  px(p, x + 7, floorTop - 13, 'ink');
  p.rect(x + 5, floorTop - 10, 3, 3, 'denim');
  px(p, x + 5, floorTop - 10, 'sky');
  // the stand: a metal tub
  p.rect(x, floorTop - 7, 9, 7, 'concrete');
  p.rect(x, floorTop - 7, 9, 1, 'paper');
  p.rect(x + 1, floorTop - 6, 1, 5, 'fog');
  p.rect(x + 7, floorTop - 6, 2, 6, 'stone');
  p.rect(x, floorTop - 1, 9, 1, 'stone');
}

/** The drinks fridge: two lit glass doors full of bottles. */
function paintFridge(p: Painter, x: number, top: number, floorTop: number): void {
  const w = 20;
  p.rect(x, top, w, floorTop - top, 'stone');
  p.rect(x, top, w, 4, 'teal');
  p.rect(x + 3, top + 1, 6, 2, 'paper');
  p.rect(x + 14, top + 1, 3, 2, 'cyan');
  const doorTop = top + 5;
  const doorBottom = floorTop - 4;
  for (const dx of [1, 11]) {
    const dw = 8;
    p.rect(x + dx, doorTop, dw, doorBottom - doorTop, 'sky');
    for (let sy = doorTop + 8; sy < doorBottom; sy += 8) {
      p.rect(x + dx, sy, dw, 1, 'fog');
      for (let bx = 0; bx + 2 <= dw; bx += 3) {
        const c = GOODS[Math.floor(hash2(x + dx + bx, sy, 3) * GOODS.length)] ?? 'red';
        p.rect(x + dx + bx, sy - 5, 2, 5, c);
        px(p, x + dx + bx, sy - 6, 'paper');
      }
    }
    px(p, x + dx, doorTop, 'paper'); // a glint on the glass
  }
  // the handles, on the frame between the doors
  p.rect(x + 9, doorTop + 12, 1, 7, 'paper');
  p.rect(x + 10, doorTop + 12, 1, 7, 'fog');
  p.rect(x + 1, floorTop - 3, w - 2, 2, 'ink');
  for (let gx = x + 2; gx < x + w - 2; gx += 2) px(p, gx, floorTop - 3, 'slate');
}

/** A shelf unit of snacks: w wide, from top down to the floor. */
function paintShelf(p: Painter, x: number, w: number, top: number, floorTop: number): void {
  p.rect(x, top, w, floorTop - top, 'concrete');
  p.rect(x, top, w, 2, 'red');
  p.rect(x, top + 2, w, 1, 'stone');
  for (let sy = top + 10; sy < floorTop - 4; sy += 9) {
    for (let bx = x + 1; bx + 3 <= x + w - 1; bx += 4) {
      const c = GOODS[Math.floor(hash2(bx, sy, 17) * GOODS.length)] ?? 'red';
      const ph = 4 + Math.floor(hash2(bx, sy, 19) * 3);
      p.rect(bx, sy - ph, 3, ph, c);
      px(p, bx, sy - ph, 'paper');
    }
    p.rect(x, sy, w, 1, 'paper');
    p.rect(x, sy + 1, w, 1, 'stone');
  }
  p.rect(x, floorTop - 3, w, 3, 'slate');
}

/** A lit menu above the back counter: rice ball, tea egg and a cup of coffee. */
function paintMenuBox(p: Painter, x: number, y: number): void {
  const w = 32;
  const h = 11;
  p.rect(x, y, w, h, 'ink');
  p.rect(x + 1, y + 1, w - 2, h - 2, 'honey');
  // rice ball: a white triangle with a strip of seaweed
  p.rect(x + 5, y + 2, 2, 1, 'paper');
  p.rect(x + 4, y + 3, 4, 1, 'paper');
  p.rect(x + 3, y + 4, 6, 3, 'paper');
  p.rect(x + 5, y + 5, 2, 3, 'ink');
  // tea egg
  p.rect(x + 14, y + 3, 4, 5, 'ember');
  p.rect(x + 13, y + 4, 6, 3, 'ember');
  px(p, x + 14, y + 4, 'amber');
  // coffee cup
  p.rect(x + 24, y + 3, 5, 1, 'stone');
  p.rect(x + 24, y + 4, 5, 4, 'paper');
  p.rect(x + 24, y + 5, 5, 2, 'ember');
  p.rect(x + 1, y + h, w - 2, 1, 'concrete');
}

/** The back counter behind the clerk, from x0 to x1, its top at `top`, down to `bottom`. */
function paintBackCounter(p: Painter, x0: number, x1: number, top: number, bottom: number): void {
  p.rect(x0, top, x1 - x0, 1, 'paper');
  p.rect(x0, top + 1, x1 - x0, bottom - top - 1, 'concrete');
  p.rect(x0, top + 2, x1 - x0, 1, 'stone');
}

/** A white microwave on the back counter, its window dark. */
function paintMicrowave(p: Painter, x: number, bottom: number): void {
  const w = 17;
  const h = 10;
  const y = bottom - h;
  p.rect(x, y, w, h, 'paper');
  p.rect(x, y + h - 1, w, 1, 'fog');
  p.rect(x + w - 1, y, 1, h, 'fog');
  p.rect(x + 2, y + 2, 9, 6, 'ink');
  p.rect(x + 3, y + 3, 2, 1, 'slate');
  p.rect(x + 12, y + 2, 3, 1, 'cyan');
  p.rect(x + 12, y + 4, 1, 1, 'stone');
  p.rect(x + 14, y + 4, 1, 1, 'stone');
  p.rect(x + 12, y + 6, 1, 1, 'stone');
  p.rect(x + 14, y + 6, 1, 1, 'stone');
}

/** Small goods (batteries, cards) on a shelf behind the register. */
function paintBackShelf(p: Painter, x: number, y: number): void {
  const w = 14;
  for (const sy of [y + 7, y + 15]) {
    for (let bx = x + 1; bx + 2 <= x + w; bx += 3) {
      const c = GOODS[Math.floor(hash2(bx, sy, 23) * GOODS.length)] ?? 'red';
      p.rect(bx, sy - 5, 2, 5, c);
      px(p, bx, sy - 5, 'paper');
    }
    p.rect(x, sy, w, 1, 'paper');
    p.rect(x, sy + 1, w, 1, 'stone');
  }
}

/** The serving counter from x0 to x1: a pale top and a front in the store's colours. */
function paintCounter(
  p: Painter,
  x0: number,
  x1: number,
  top: number,
  bottom: number,
  endsInView: boolean,
): void {
  const w = x1 - x0;
  p.rect(x0, top, w, 2, 'paper');
  p.rect(x0, top + 2, w, 1, 'fog');
  p.rect(x0, top + 3, w, bottom - top - 3, 'paper');
  p.rect(x0, top + 3, w, 1, 'concrete');
  p.rect(x0, top + 6, w, 3, 'teal');
  p.rect(x0, top + 9, w, 1, 'lamp');
  p.rect(x0, top + 10, w, 1, 'red');
  p.rect(x0, top + 3, 1, bottom - top - 3, 'fog');
  if (endsInView) p.rect(x1 - 1, top + 3, 1, bottom - top - 3, 'fog');
  p.rect(x0, bottom - 3, w, 3, 'stone');
  p.rect(x0, bottom, w, 1, 'ink'); // its shadow on a deeper floor
}

/** The register on the counter (its base at `base`), screen facing you. */
function paintRegister(p: Painter, x: number, base: number): void {
  p.rect(x, base - 4, 13, 4, 'stone');
  p.rect(x, base - 4, 13, 1, 'concrete');
  p.rect(x + 1, base - 2, 11, 1, 'ink');
  p.rect(x + 7, base - 7, 1, 3, 'stone');
  p.rect(x + 3, base - 12, 8, 6, 'ink');
  p.rect(x + 4, base - 11, 6, 4, 'teal');
  p.rect(x + 5, base - 10, 3, 1, 'cyan');
  p.rect(x + 5, base - 8, 4, 1, 'cyan');
  px(p, x + 1, base - 5, 'red'); // the scanner's light
  p.rect(x, base - 6, 3, 2, 'ink');
}

// ---------------------------------------------------------------------------
// The clerk: 16x24, facing left. A friendly young man in the store uniform:
// a teal cap, a red vest with a name tag over a white polo, dark trousers.
// Only the top part shows above the counter; the legs are there so the sprite
// can bob without a gap at the counter line.

export const CLERK_SPRITE: PixelSprite = {
  rows: [
    '................',
    '......cccccc....',
    '.....cclccccc...',
    '...bbbcccccccc..',
    '....sssshhhhh...',
    '...ssesssthhh...',
    '....ssssssh.....',
    '.....sssss......',
    '......sss.......',
    '.....wwwww......',
    '....vwwwvvvvm...',
    '...wwvwvvvvvmm..',
    '...wwvvvvvvvvm..',
    '...ssvnnvvvvvm..',
    '...ssvvvvvvvvm..',
    '...ssvvvvvvvvm..',
    '...ssvvvvvvvvm..',
    '..sssvvvvvvvvm..',
    '..sssvvvvvvvvm..',
    '....vvvvvvvvvm..',
    '....vvvvvvvvvm..',
    '.....dddddddd...',
    '......ddd.ddd...',
    '.....kkkk.kkk...',
  ],
  legend: {
    c: 'teal',
    l: 'lamp',
    b: 'moss',
    h: 'ink',
    s: 'skin',
    e: 'ink',
    t: 'tan',
    w: 'paper',
    v: 'red',
    m: 'maroon',
    n: 'paper',
    d: 'slate',
    k: 'ink',
  },
};
