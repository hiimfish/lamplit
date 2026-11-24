import { describe, expect, it } from 'vitest';
import { isHeard } from '../src/learning/heardQuestion';
import type { Question } from '../src/learning/questions';
import { HOW_CARDS, shouldShowIntro } from '../src/ui/HowToPlay';

describe('shouldShowIntro (怎麼玩 on the first visit to the town)', () => {
  it('shows the cards to a new player who has not seen them', () => {
    expect(shouldShowIntro(false, 0)).toBe(true);
  });

  it('does not show them again once seen or skipped', () => {
    expect(shouldShowIntro(true, 0)).toBe(false);
  });

  it('does not stop a player who already played a task', () => {
    expect(shouldShowIntro(false, 3)).toBe(false);
  });

  it('has four cards, each with a title and text', () => {
    expect(HOW_CARDS).toHaveLength(4);
    for (const card of HOW_CARDS) {
      expect(card.title).not.toBe('');
      expect(card.lines.length).toBeGreaterThan(0);
    }
  });
});

describe('isHeard (再聽一次 or 再想一次 after the hearts refill)', () => {
  it('is true for questions whose cue is a clip', () => {
    for (const kind of ['listen-pick', 'listen-pair', 'cloze', 'respond', 'talk', 'spell']) {
      expect(isHeard({ kind } as Question)).toBe(true);
    }
    expect(isHeard({ kind: 'picture', listen: true } as Question)).toBe(true);
  });

  it('is false for questions read on screen', () => {
    for (const kind of ['arrange', 'read-sign', 'read-passage', 'fill', 'text-fill', 'picture']) {
      expect(isHeard({ kind } as Question)).toBe(false);
    }
  });
});
