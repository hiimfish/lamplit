import { describe, expect, it } from 'vitest';
import { actionsFor, digitIndex, fallbackFor, keyName, letterIndex } from '../src/ui/keys';
import { keyCapLabel } from '../src/ui/KeyCap';

const press = (key: string, shiftKey = false, code?: string) => keyName({ key, shiftKey, code });

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

  it('names the left-hand keys: the one under Esc, and Esc with Shift', () => {
    expect(press('`')).toBe('Backquote');
    expect(press('~', true)).toBe('Shift+Backquote');
    // Another layout may give another character; the key's position still counts.
    expect(press('ˋ', false, 'Backquote')).toBe('Backquote');
    expect(press('Escape')).toBe('Escape');
    expect(press('Escape', true)).toBe('Shift+Escape');
  });

  it('ignores keys the game never uses', () => {
    expect(press('Tab')).toBeNull();
    expect(press('F5')).toBeNull();
    expect(press('!')).toBeNull();
  });
});

describe('left-hand actions', () => {
  it('Space is the next step and the key under Esc replays', () => {
    expect(actionsFor('Space')).toEqual(['Enter']);
    expect(actionsFor('Backquote')).toEqual(['Space']);
    expect(actionsFor('Shift+Backquote')).toEqual(['Shift+Space']);
  });

  it('Esc takes back first, then cancels; Shift+Esc is 重排', () => {
    expect(actionsFor('Escape')).toEqual(['Backspace', 'Escape']);
    expect(actionsFor('Shift+Escape')).toEqual(['Escape']);
  });

  it('Esc is 返回 only when nothing on the screen takes it back or cancels', () => {
    expect(actionsFor('Escape')).not.toContain('Back');
    expect(fallbackFor('Escape')).toEqual(['Back']);
    expect(fallbackFor('Shift+Escape')).toEqual([]);
    expect(fallbackFor('Backspace')).toEqual([]);
    expect(keyCapLabel('Back')).toBe('Esc');
  });

  it('T types or places a block first, then shows 中文', () => {
    expect(actionsFor('t')).toEqual(['t', '0']);
  });

  it('the old keys still stand for themselves', () => {
    expect(actionsFor('Enter')).toEqual(['Enter']);
    expect(actionsFor('Backspace')).toEqual(['Backspace']);
    expect(actionsFor('0')).toEqual(['0']);
    expect(actionsFor('q')).toEqual(['q']);
  });

  it('caps show the left-hand key of each action', () => {
    expect(keyCapLabel('Enter')).toBe('空白');
    expect(keyCapLabel('Space')).toBe('`');
    expect(keyCapLabel('Shift+Space')).toBe('Shift `');
    expect(keyCapLabel('Backspace')).toBe('Esc');
    expect(keyCapLabel('Shift+Escape')).toBe('Shift Esc');
    expect(keyCapLabel('0')).toBe('T');
    expect(keyCapLabel('q')).toBe('Q');
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
