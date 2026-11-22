import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  getItemSprite,
  ITEM_SIZE,
  ITEM_SPRITES,
  spriteRuns,
  spriteSvg,
  validateItemSprite,
} from '../src/art/items';
import { isPaletteName, PALETTE } from '../src/game/palette';

const UNITS_DIR = join(__dirname, '../src/data/units');

/** Word ids that need a pixel icon: every word not marked `abstract`. */
function concreteWordIds(): string[] {
  return readdirSync(UNITS_DIR)
    .filter((f) => f.endsWith('.json'))
    .flatMap((f) => {
      const unit = JSON.parse(readFileSync(join(UNITS_DIR, f), 'utf8')) as {
        words: { id: string; abstract?: boolean }[];
      };
      return unit.words.filter((w) => !w.abstract).map((w) => w.id);
    });
}

const paletteHexes = new Set<string>(Object.values(PALETTE));

describe('item icons', () => {
  it.each(Object.entries(ITEM_SPRITES))('%s is a valid 24x24 palette sprite', (_id, sprite) => {
    expect(validateItemSprite(sprite)).toEqual([]);
    expect(sprite.rows).toHaveLength(ITEM_SIZE);
    for (const row of sprite.rows) expect(row).toHaveLength(ITEM_SIZE);
    for (const colour of Object.values(sprite.legend)) expect(isPaletteName(colour)).toBe(true);
  });

  it.each(Object.entries(ITEM_SPRITES))('%s only paints palette colours', (_id, sprite) => {
    for (const run of spriteRuns(sprite)) expect(paletteHexes.has(run.color)).toBe(true);
  });

  it.each(Object.keys(ITEM_SPRITES))('%s draws a real object, not a blank', (id) => {
    const sprite = ITEM_SPRITES[id]!;
    const painted = sprite.rows.join('').replace(/\./g, '').length;
    expect(painted).toBeGreaterThan(ITEM_SIZE * ITEM_SIZE * 0.25);
  });

  it('has an icon for every concrete word in every unit', () => {
    const ids = concreteWordIds();
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.filter((id) => !getItemSprite(id))).toEqual([]);
  });

  it('returns nothing for unknown or inherited ids', () => {
    expect(getItemSprite('dragonfruit')).toBeUndefined();
    expect(getItemSprite('toString')).toBeUndefined();
  });

  it('rejects malformed sprites', () => {
    const bad = {
      rows: ['ab', 'a'],
      legend: { a: 'ink', b: 'notAColour' },
    } as unknown as Parameters<typeof validateItemSprite>[0];
    const problems = validateItemSprite(bad);
    expect(problems.some((p) => p.includes('row 1'))).toBe(true);
    expect(problems.some((p) => p.includes('notAColour'))).toBe(true);
    expect(problems.some((p) => p.includes('tall'))).toBe(true);
  });
});

describe('SVG builder', () => {
  it('merges horizontal runs so the icon needs fewer nodes than pixels', () => {
    for (const sprite of Object.values(ITEM_SPRITES)) {
      const pixels = sprite.rows.join('').replace(/\./g, '').length;
      const runs = spriteRuns(sprite);
      expect(runs.length).toBeLessThan(pixels * 0.7);
      expect(runs.reduce((n, r) => n + r.w, 0)).toBe(pixels);
    }
  });

  it('merges neighbouring keys that share a colour', () => {
    const runs = spriteRuns({ rows: ['.ab.'], legend: { a: 'ink', b: 'ink' } });
    expect(runs).toEqual([{ x: 1, y: 0, w: 2, color: PALETTE.ink }]);
  });

  it('is deterministic and crisp', () => {
    const sprite = ITEM_SPRITES.latte!;
    expect(spriteSvg(sprite)).toBe(spriteSvg(sprite));
    expect(spriteRuns(sprite)).toEqual(spriteRuns(sprite));
    const svg = spriteSvg(sprite);
    expect(svg).toContain('shape-rendering="crispEdges"');
    expect(svg).toContain(`viewBox="0 0 ${ITEM_SIZE} ${ITEM_SIZE}"`);
    expect(svg.match(/<rect /g)).toHaveLength(spriteRuns(sprite).length);
  });
});
