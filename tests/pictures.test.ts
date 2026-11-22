import { describe, expect, it } from 'vitest';
import { getPicture, PICTURE_H, PICTURE_IDS, PICTURE_W } from '../src/art/pictures';
import { UNITS } from '../src/content/units';
import { recordingPainter, type Painter } from '../src/game/painter';
import { isPaletteName } from '../src/game/palette';

/** Paints a picture, counting rectangles that leave its PICTURE_W x PICTURE_H frame. */
function paint(id: string) {
  const picture = getPicture(id);
  if (!picture) throw new Error(`no picture ${id}`);
  const recorder = recordingPainter();
  let outside = 0;
  const p: Painter = {
    rect(x, y, w, h, color, alpha) {
      if (w > 0 && h > 0 && (x < 0 || y < 0 || x + w > PICTURE_W || y + h > PICTURE_H)) outside++;
      recorder.rect(x, y, w, h, color, alpha);
    },
  };
  picture(p);
  return { record: recorder.record, outside };
}

describe('pictures to describe (看圖選句)', () => {
  it('has no picture for unknown or inherited ids', () => {
    expect(getPicture('nope')).toBeUndefined();
    expect(getPicture('toString')).toBeUndefined();
  });

  it.each(PICTURE_IDS)('%s: palette colours, whole pixels, inside the frame, every time', (id) => {
    const { record, outside } = paint(id);
    expect(record.ops).toBeGreaterThan(0);
    expect([...record.colors].every(isPaletteName)).toBe(true);
    expect(record.fractional).toBe(0);
    expect(outside).toBe(0);
    expect(paint(id).record.hash).toBe(record.hash);
  });

  it('exists for every picture question in the units', () => {
    const missing = UNITS.flatMap((unit) =>
      unit.tasks.flatMap((task) =>
        (task.pictures ?? [])
          .filter((p) => !getPicture(p.pictureId))
          .map((p) => `${unit.id}/${task.id} ${p.pictureId}`),
      ),
    );
    expect(missing).toEqual([]);
  });
});
