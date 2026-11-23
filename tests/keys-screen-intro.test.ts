import { describe, expect, it } from 'vitest';
import type { ItemInfo } from '../src/content/units';
import { clipsOf } from '../src/ui/IntroCards';

describe('clipsOf (what a new card says as it appears)', () => {
  it('says a word or chunk once', () => {
    const item = { kind: 'chunk', audioId: 'cafe.chunk.can_i_get', text: 'Can I get' } as ItemInfo;
    expect(clipsOf(item)).toEqual([['cafe.chunk.can_i_get', 'Can I get']]);
  });

  it('says both sides of a pair in order', () => {
    const item = {
      kind: 'pair',
      audioId: '',
      text: 'ship / sheep',
      sides: [
        { id: 'a', en: 'ship', zh: '船', audioId: 'p.ship' },
        { id: 'b', en: 'sheep', zh: '羊', audioId: 'p.sheep' },
      ],
    } as unknown as ItemInfo;
    expect(clipsOf(item)).toEqual([
      ['p.ship', 'ship'],
      ['p.sheep', 'sheep'],
    ]);
  });
});
