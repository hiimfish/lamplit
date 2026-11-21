import { describe, expect, it } from 'vitest';
import { isPaletteName, MAX_COLOURS, PALETTE, PALETTE_NAMES } from '../src/game/palette';
import {
  idleKey,
  PERSON_H,
  PERSON_IDS,
  PERSON_W,
  SPRITES,
  validateSprite,
  walkKey,
  WALK_FRAMES,
} from '../src/game/sprites';

describe('palette', () => {
  it(`has at most ${MAX_COLOURS} distinct colours`, () => {
    const values = Object.values(PALETTE).map((v) => v.toLowerCase());
    expect(values.length).toBeLessThanOrEqual(MAX_COLOURS);
    expect(new Set(values).size).toBe(values.length);
    for (const v of values) expect(v).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('shares the four UI tones with the HTML windows', () => {
    expect(PALETTE.ink).toBe('#1d1a2b');
    expect(PALETTE.paper).toBe('#f3e9d2');
    expect(PALETTE.lamp).toBe('#f2a541');
    expect(PALETTE.neon).toBe('#ff5c8a');
  });

  it('lists every name', () => {
    expect(PALETTE_NAMES).toHaveLength(Object.keys(PALETTE).length);
    expect(isPaletteName('ink')).toBe(true);
    expect(isPaletteName('toString')).toBe(false);
  });
});

describe('code-defined sprites', () => {
  it.each(Object.entries(SPRITES))('%s is well formed and only uses palette colours', (_n, s) => {
    expect(validateSprite(s)).toEqual([]);
    for (const color of Object.values(s.legend)) expect(isPaletteName(color)).toBe(true);
  });

  it('every person has a four-frame walk and an idle pose, all the same size', () => {
    expect(PERSON_IDS).toEqual(expect.arrayContaining(['walker', 'worker', 'auntie']));
    for (const id of PERSON_IDS) {
      for (const key of [
        ...Array.from({ length: WALK_FRAMES }, (_, i) => walkKey(id, i)),
        idleKey(id),
      ]) {
        const sprite = SPRITES[key];
        expect(sprite, key).toBeDefined();
        expect(sprite?.rows).toHaveLength(PERSON_H);
        expect(sprite?.rows[0]).toHaveLength(PERSON_W);
      }
    }
    expect(WALK_FRAMES).toBe(4);
    expect(SPRITES.walker_back?.rows).toHaveLength(PERSON_H);
  });

  it('walk frames actually differ from each other', () => {
    const frames = Array.from({ length: WALK_FRAMES }, (_, i) =>
      SPRITES[walkKey('walker', i)]?.rows.join('|'),
    );
    expect(new Set(frames).size).toBe(WALK_FRAMES);
  });

  it('has the small loop sprites', () => {
    for (const key of [
      'cat_0',
      'cat_1',
      'cat_2',
      'cat_blink',
      'steam_0',
      'ripple_0',
      'plant_0',
      'plant_1',
      'barista_0',
      'rider',
      'tube_off',
    ]) {
      expect(SPRITES).toHaveProperty(key);
    }
  });

  it('reports uneven rows and unknown colour keys', () => {
    const problems = validateSprite({ rows: ['ab', 'a'], legend: { a: 'ink' } });
    expect(problems).toContain('row 0 uses unknown key "b"');
    expect(problems).toContain('row 1 is 1 wide, expected 2');
  });
});
