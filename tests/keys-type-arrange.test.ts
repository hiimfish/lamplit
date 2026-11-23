import { describe, expect, it } from 'vitest';
import { exactBlock, matchTyped, remainingBlocks, takeJustChecked } from '../src/ui/minigames/Arrange';

describe('matchTyped (排句子 typing)', () => {
  const blocks = ['our', 'you', 'see', 'are', 'customers', 'As', 'can', 'stores'];

  it('places a block as soon as only one word starts with the typed letters', () => {
    expect(matchTyped(blocks, [], 'y')).toEqual({ place: 1, any: true });
    expect(matchTyped(blocks, [], 'ca')).toEqual({ place: 6, any: true });
  });

  it('waits while different words share the start', () => {
    expect(matchTyped(blocks, [], 'c')).toEqual({ place: null, any: true });
    expect(matchTyped(blocks, [], 's')).toEqual({ place: null, any: true });
  });

  it('ignores case and placed blocks', () => {
    expect(matchTyped(blocks, [], 'as')).toEqual({ place: 5, any: true });
    // With "can" placed, "c" can only be customers.
    expect(matchTyped(blocks, [6], 'c')).toEqual({ place: 4, any: true });
  });

  it('places the first of identical words', () => {
    expect(matchTyped(['the', 'box', 'the'], [], 't')).toEqual({ place: 0, any: true });
    expect(matchTyped(['the', 'box', 'the'], [0], 't')).toEqual({ place: 2, any: true });
  });

  it('reports a letter no block starts with', () => {
    expect(matchTyped(blocks, [], 'x')).toEqual({ place: null, any: false });
    expect(matchTyped(blocks, [], '')).toEqual({ place: null, any: false });
  });

  it('keeps "I" and "in" apart until Space picks the exact word', () => {
    const io = ['in', 'I', 'live', 'Taipei'];
    expect(matchTyped(io, [], 'i')).toEqual({ place: null, any: true });
    expect(exactBlock(io, [], 'i')).toBe(1);
    expect(matchTyped(io, [], 'in')).toEqual({ place: 0, any: true });
  });

  it("matches apostrophes (straight or curly) and hyphens", () => {
    const words = ['I’m', 'It', 'take-out', 'to'];
    expect(matchTyped(words, [], "i'")).toEqual({ place: 0, any: true });
    expect(matchTyped(words, [], 'ta')).toEqual({ place: 2, any: true });
    expect(exactBlock(words, [], 'take-out')).toBe(2);
    expect(exactBlock(words, [], 'tak')).toBeNull();
  });
});

describe('takeJustChecked', () => {
  it('is false when no arrange check played the line', () => {
    expect(takeJustChecked('cafe.line.l1')).toBe(false);
  });
});

describe('remainingBlocks (number keys)', () => {
  it('numbers the blocks still in the pool, in pool order', () => {
    expect(remainingBlocks(5, [])).toEqual([0, 1, 2, 3, 4]);
    expect(remainingBlocks(5, [1, 3])).toEqual([0, 2, 4]);
  });

  it('gives the 10th and later blocks a number once earlier ones are placed', () => {
    const left = remainingBlocks(12, [0, 1, 2]);
    expect(left.slice(0, 9)).toContain(11);
  });
});
