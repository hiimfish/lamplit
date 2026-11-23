import { describe, expect, it } from 'vitest';
import { digitIndex, ignoreKey, keyName, letterIndex } from '../src/ui/keys';
import { choiceKeyMap } from '../src/ui/minigames/shared';

const event = (key: string, over: Partial<KeyboardEvent> = {}) =>
  ({
    key,
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    isComposing: false,
    repeat: false,
    target: null,
    ...over,
  }) as KeyboardEvent;

describe('choice keys (ChoiceKeys, ListenPick, ListenPair, ChooseReply, PictureChoose)', () => {
  const options = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  it('maps 1 to the first option shown, up to the number of options', () => {
    const picked: string[] = [];
    const map = choiceKeyMap(options, (id) => picked.push(id));
    expect(Object.keys(map)).toEqual(['1', '2', '3']);
    map['1']!();
    map['3']!();
    expect(picked).toEqual(['a', 'c']);
  });

  it('stops at 9 keys', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ id: `o${i}` }));
    expect(Object.keys(choiceKeyMap(many, () => undefined))).toHaveLength(9);
  });

  it('ignores held modifiers and IME input, as the old per-screen filters did', () => {
    expect(ignoreKey(event('1', { ctrlKey: true }))).toBe(true);
    expect(ignoreKey(event('1', { altKey: true }))).toBe(true);
    expect(ignoreKey(event('1', { isComposing: true }))).toBe(true);
    expect(ignoreKey(event('1'))).toBe(false);
  });
});

describe('lettered keys (ListenPicture A-D, Respond A-C)', () => {
  it('accepts the digit or the letter of a key', () => {
    expect(digitIndex(keyName(event('2')), 4)).toBe(1);
    expect(letterIndex(keyName(event('B')), 4)).toBe(1);
    expect(letterIndex(keyName(event('d')), 3)).toBeNull();
  });
});
