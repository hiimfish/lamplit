import { describe, expect, it } from 'vitest';
import { coreOrigin, CORE_H, CORE_W, STAGE_UNIT_IDS, stageFor } from '../src/art/stage';
import { BARISTA_SPRITE, CAFE_COUNTER } from '../src/art/stage/cafe';
import { NEIGHBOR_SPRITE } from '../src/art/stage/moveIn';
import { CLERK_SPRITE, STORE_COUNTER } from '../src/art/stage/store';
import { getUnit } from '../src/content/units';
import { recordingPainter, type Painter } from '../src/game/painter';
import { isPaletteName } from '../src/game/palette';
import { PERSON_H, PERSON_W, validateSprite } from '../src/game/sprites';
import { computeLayout } from '../src/layout';
import {
  CORE_VIEW_W,
  CORE_VIEW_X,
  LANDSCAPE_CARD_MIN_W,
  LANDSCAPE_CARD_W,
  stageArea,
  stageCanvasSize,
} from '../src/ui/stage/stageArea';

/** Stage sizes in stage pixels: the bare core, phone portrait, landscape columns, wide and tall. */
const SIZES: readonly [number, number][] = [
  [CORE_W, CORE_H],
  [146, 90],
  [113, 128],
  [CORE_VIEW_W, 120],
  [455, 81],
  [249, 240],
];

/** Records every rect and notes any that fall outside the w x h stage. */
function paintStage(unitId: string, w: number, h: number) {
  const config = stageFor(unitId);
  if (!config) throw new Error(`no stage for ${unitId}`);
  const recorder = recordingPainter();
  let outside = 0;
  const p: Painter = {
    rect(x, y, rw, rh, color, alpha) {
      if (rw > 0 && rh > 0 && (x < 0 || y < 0 || x + rw > w || y + rh > h)) outside++;
      recorder.rect(x, y, rw, rh, color, alpha);
    },
  };
  config.paint(p, w, h);
  return { record: recorder.record, outside };
}

const cases = STAGE_UNIT_IDS.flatMap((id) => SIZES.map(([w, h]) => [id, w, h] as const));

describe('stage art', () => {
  it('has a stage for the café, the moving-in unit and the store, none for unknown ids', () => {
    expect(STAGE_UNIT_IDS).toEqual(expect.arrayContaining(['cafe', 'move_in', 'store']));
    expect(stageFor('nope')).toBeUndefined();
    expect(stageFor('__proto__')).toBeUndefined();
  });

  // Fingerprints of the café picture at several sizes, taken when the user
  // approved it (2026-11-22). Change them only when the café art is changed on purpose.
  it.each([
    [128, 64, 1471289577],
    [146, 90, 4034505328],
    [113, 128, 3740617787],
    [96, 120, 733124743],
    [455, 81, 2737100821],
    [249, 240, 3458224739],
  ])('the café picture at %ix%i is unchanged', (w, h, hash) => {
    expect(paintStage('cafe', w, h).record.hash).toBe(hash);
  });

  it.each(cases)(
    '%s at %ix%i: palette colours only, whole pixels, inside the stage',
    (id, w, h) => {
      const { record, outside } = paintStage(id, w, h);
      expect(record.ops).toBeGreaterThan(0);
      expect([...record.colors].every(isPaletteName)).toBe(true);
      expect(record.fractional).toBe(0);
      expect(outside).toBe(0);
    },
  );

  it.each(cases)('%s at %ix%i paints the same picture every time', (id, w, h) => {
    expect(paintStage(id, w, h).record.hash).toBe(paintStage(id, w, h).record.hash);
  });

  it('centres the core across and puts a little floor under it', () => {
    expect(coreOrigin(CORE_W, CORE_H)).toEqual({ ox: 0, oy: 0 });
    expect(coreOrigin(146, 90)).toEqual({ ox: 9, oy: 20 });
    // narrower than the core: its edges are cropped evenly
    expect(coreOrigin(113, 128)).toEqual({ ox: -8, oy: 52 });
    expect(coreOrigin(CORE_VIEW_W, 64).ox).toBe(-CORE_VIEW_X);
  });

  it('draws a valid 16x24 barista in palette colours', () => {
    expect(validateSprite(BARISTA_SPRITE)).toEqual([]);
    expect(BARISTA_SPRITE.rows).toHaveLength(PERSON_H);
    expect(BARISTA_SPRITE.rows[0]).toHaveLength(PERSON_W);
    expect(Object.values(BARISTA_SPRITE.legend).every(isPaletteName)).toBe(true);
  });

  it.each(STAGE_UNIT_IDS)('%s draws every character as a valid 16x24 palette sprite', (id) => {
    for (const [role, actor] of Object.entries(stageFor(id)!.cast)) {
      const { sprite } = actor;
      expect(validateSprite(sprite), role).toEqual([]);
      expect(sprite.rows, role).toHaveLength(PERSON_H);
      expect(sprite.rows[0], role).toHaveLength(PERSON_W);
      expect(Object.values(sprite.legend).every(isPaletteName), role).toBe(true);
    }
  });

  it.each(STAGE_UNIT_IDS)('%s casts every role that speaks in its unit, you on the left', (id) => {
    const config = stageFor(id)!;
    expect(config.cast.guide).toMatchObject({ x: 20, y: 39, side: 'left' });
    const roles = new Set(getUnit(id)?.tasks.flatMap((t) => t.scene.map((l) => l.role)));
    for (const role of roles) expect(config.cast[role], role).toBeDefined();
    for (const [role, actor] of Object.entries(config.cast)) {
      if (role !== 'guide') expect(actor.side, role).toBe('right');
    }
  });

  it('puts the neighbor where the landlord stands on moving-in day', () => {
    const { cast } = stageFor('move_in')!;
    expect(cast.neighbor).toMatchObject({
      x: cast.landlord?.x,
      y: cast.landlord?.y,
      side: 'right',
    });
    expect(cast.neighbor?.sprite).toBe(NEIGHBOR_SPRITE);
  });

  it.each(STAGE_UNIT_IDS)('%s places its cast, bubbles and props inside the core', (id) => {
    const config = stageFor(id)!;
    for (const actor of Object.values(config.cast)) {
      const w = actor.sprite.rows[0]?.length ?? 0;
      expect(actor.x).toBeGreaterThanOrEqual(0);
      expect(actor.x + w).toBeLessThanOrEqual(CORE_W);
      expect(actor.y).toBeGreaterThanOrEqual(0);
      expect(
        Math.min(actor.y + actor.sprite.rows.length, actor.clipBottom ?? CORE_H),
      ).toBeLessThanOrEqual(CORE_H);
    }
    for (const side of ['left', 'right'] as const) {
      expect(config.want[side].x + 28).toBeLessThanOrEqual(CORE_W);
      expect(config.ask[side].x + 11).toBeLessThanOrEqual(CORE_W);
      expect(config.rest[side].x + 24).toBeLessThanOrEqual(CORE_W);
      for (const at of [config.want[side], config.ask[side], config.rest[side]]) {
        expect(at.x).toBeGreaterThanOrEqual(0);
        expect(at.y).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it.each(STAGE_UNIT_IDS)('%s keeps everything that matters in the middle of the core', (id) => {
    const config = stageFor(id)!;
    const inView = (x: number, w: number) => x >= CORE_VIEW_X && x + w <= CORE_VIEW_X + CORE_VIEW_W;
    for (const actor of Object.values(config.cast)) {
      expect(inView(actor.x, actor.sprite.rows[0]?.length ?? 0)).toBe(true);
    }
    for (const side of ['left', 'right'] as const) {
      expect(inView(config.want[side].x, 28)).toBe(true);
      expect(inView(config.ask[side].x, 11)).toBe(true);
      expect(inView(config.rest[side].x, 24)).toBe(true);
    }
  });

  it('casts every role that speaks in the café, on opposite sides', () => {
    const config = stageFor('cafe')!;
    const roles = new Set(getUnit('cafe')!.tasks.flatMap((t) => t.scene.map((l) => l.role)));
    for (const role of roles) expect(config.cast[role]).toBeDefined();
    expect(config.cast.guide?.side).toBe('left');
    expect(config.cast.barista?.side).toBe('right');
    expect(config.cast.barista?.clipBottom).toBe(CAFE_COUNTER.top);
  });

  it('puts the store clerk behind the counter, facing you across it', () => {
    const { cast } = stageFor('store')!;
    expect(cast.guide?.side).toBe('left');
    expect(cast.clerk).toMatchObject({ side: 'right', clipBottom: STORE_COUNTER.top });
    expect(cast.clerk?.sprite).toBe(CLERK_SPRITE);
    // the clerk's head and shoulders show above the counter
    expect(STORE_COUNTER.top - cast.clerk!.y).toBeGreaterThanOrEqual(16);
    // you stand clear of the counter, in front of it
    expect(cast.guide!.x + 16).toBeLessThanOrEqual(STORE_COUNTER.x);
  });

  it('rests store props on the counter, left of the clerk', () => {
    const { cast, rest } = stageFor('store')!;
    for (const side of ['left', 'right'] as const) {
      expect(rest[side].x).toBeGreaterThanOrEqual(STORE_COUNTER.x);
      // 24x24 pictures stand on the countertop with their shadow on it, like the café's
      expect(rest[side].y).toBe(STORE_COUNTER.top - 20);
    }
    expect(rest.left.x).toBeLessThan(rest.right.x);
    expect(rest.right.x + 24).toBeLessThanOrEqual(cast.clerk!.x + 4);
  });
});

describe('stageArea', () => {
  const area = (w: number, h: number, dpr: number) => stageArea(computeLayout(w, h, dpr));

  it('fills the whole street area in portrait at the largest whole scale', () => {
    const phone = computeLayout(390, 844, 3);
    expect(area(390, 844, 3)).toEqual({ w: phone.sceneW, h: phone.sceneH, scale: 2 });
  });

  it('is a full-height column on the left in landscape, leaving the card its width', () => {
    const desk = computeLayout(1366, 768, 1);
    const a = area(1366, 768, 1);
    expect(a.h).toBe(desk.sceneH);
    expect(a.w).toBe(desk.sceneW - LANDSCAPE_CARD_W);
    expect(a.scale).toBe(2);
  });

  it('keeps 2x on a small landscape screen by cropping the core to its middle', () => {
    const small = computeLayout(800, 450, 1);
    const a = area(800, 450, 1);
    expect(a.scale).toBe(2);
    expect(a.w).toBe(CORE_VIEW_W * 2);
    expect(small.sceneW - a.w).toBeGreaterThanOrEqual(LANDSCAPE_CARD_MIN_W);
  });

  it.each([
    [390, 844, 3],
    [360, 640, 2],
    [320, 568, 2],
    [1366, 768, 1],
    [1920, 1080, 1],
    [800, 450, 1],
    [1280, 720, 1],
    [1024, 600, 1],
  ])('at %ix%i (dpr %i) the painted canvas covers the area and shows the cast', (w, h, dpr) => {
    const a = area(w, h, dpr);
    const canvas = stageCanvasSize(a);
    expect(Number.isInteger(a.scale) && a.scale >= 1).toBe(true);
    expect(canvas.w * a.scale).toBeGreaterThanOrEqual(a.w);
    expect(canvas.h * a.scale).toBeGreaterThanOrEqual(a.h);
    expect(Math.floor(a.w / a.scale)).toBeGreaterThanOrEqual(CORE_VIEW_W);
    expect(canvas.h).toBeGreaterThanOrEqual(CORE_H);
  });
});
