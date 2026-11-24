import { describe, expect, it } from 'vitest';
import { ACTS, actOf } from '../src/content/acts';
import { zhMode } from '../src/learning/zhMode';

describe('zhMode', () => {
  it('shows the saved setting in Acts 1, 2 and 4 and peeks in Act 3', () => {
    expect(zhMode(1)).toBe('shown');
    expect(zhMode(2)).toBe('shown');
    expect(zhMode(3)).toBe('peek');
    expect(zhMode(4)).toBe('shown');
  });

  it('treats a unit in no act as shown', () => {
    expect(zhMode(0)).toBe('shown');
    expect(zhMode(actOf('no_such_unit', ACTS))).toBe('shown');
  });

  it('makes every Act 3 unit peek and no other unit', () => {
    for (const place of ACTS[2]?.places ?? []) {
      expect(zhMode(actOf(place.unitId ?? '', ACTS))).toBe('peek');
    }
    for (const act of [0, 1, 3]) {
      for (const place of ACTS[act]?.places ?? []) {
        expect(zhMode(actOf(place.unitId ?? '', ACTS))).toBe('shown');
      }
    }
  });
});
