import { describe, expect, it } from 'vitest';
import { digitIndex, keyName, letterIndex } from '../src/ui/keys';

const press = (key: string, shiftKey = false) => keyName({ key, shiftKey });

describe('keyName', () => {
  it('names the keys of the scheme', () => {
    expect(press('3')).toBe('3');
    expect(press('A')).toBe('a');
    expect(press('Enter')).toBe('Enter');
    expect(press(' ')).toBe('Space');
    expect(press(' ', true)).toBe('Shift+Space');
    expect(press('Backspace')).toBe('Backspace');
    expect(press("'")).toBe("'");
  });

  it('ignores keys the game never uses', () => {
    expect(press('Tab')).toBeNull();
    expect(press('F5')).toBeNull();
    expect(press('!')).toBeNull();
  });
});

describe('answer keys', () => {
  it('maps 1-9 to the keys shown', () => {
    expect(digitIndex('1', 3)).toBe(0);
    expect(digitIndex('3', 3)).toBe(2);
    expect(digitIndex('4', 3)).toBeNull();
    expect(digitIndex('0', 3)).toBeNull();
    expect(digitIndex('Enter', 3)).toBeNull();
  });

  it('maps a-d to lettered keys', () => {
    expect(letterIndex('a', 4)).toBe(0);
    expect(letterIndex('d', 4)).toBe(3);
    expect(letterIndex('e', 4)).toBeNull();
    expect(letterIndex(null, 4)).toBeNull();
  });
});
