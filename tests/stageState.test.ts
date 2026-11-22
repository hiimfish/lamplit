import { describe, expect, it } from 'vitest';
import type { SceneLine } from '../src/content/types';
import { getUnit } from '../src/content/units';
import { stageAfter, stageAt } from '../src/ui/stage/stageState';

const line = (id: string, role: SceneLine['role'], stage?: SceneLine['stage']): SceneLine => ({
  id,
  role,
  speaker: role === 'guide' ? 'player' : 'npc',
  en: 'x',
  zh: 'x',
  ...(role === 'guide' ? { chunkId: 'c' } : {}),
  ...(stage ? { stage } : {}),
});

const scene: SceneLine[] = [
  line('a', 'barista'),
  line('b', 'guide', { act: 'want', item: 'latte' }),
  line('c', 'barista', { act: 'give', item: 'latte' }),
  line('d', 'guide', { act: 'ask' }),
  line('e', 'barista'),
];

describe('stageAt', () => {
  it('is empty before any line is shown', () => {
    expect(stageAt(scene, 0)).toEqual({ speaker: undefined, bubble: undefined, props: [] });
  });

  it('names the speaker of the newest line', () => {
    expect(stageAt(scene, 1).speaker).toBe('barista');
    expect(stageAt(scene, 2).speaker).toBe('guide');
  });

  it('shows a want bubble only while its line is the newest', () => {
    expect(stageAt(scene, 2).bubble).toEqual({ role: 'guide', act: 'want', item: 'latte' });
    expect(stageAt(scene, 3).bubble).toBeUndefined();
  });

  it('shows an ask bubble with no item', () => {
    expect(stageAt(scene, 4).bubble).toEqual({ role: 'guide', act: 'ask' });
    expect(stageAt(scene, 5).bubble).toBeUndefined();
  });

  it('slides a given prop once, then keeps it on the counter', () => {
    expect(stageAt(scene, 2).props).toEqual([]);
    expect(stageAt(scene, 3).props).toEqual([
      { lineId: 'c', item: 'latte', giver: 'barista', sliding: true },
    ]);
    for (const shown of [4, 5]) {
      expect(stageAt(scene, shown).props).toEqual([
        { lineId: 'c', item: 'latte', giver: 'barista', sliding: false },
      ]);
    }
  });

  it('clamps shown beyond the scene and below zero', () => {
    expect(stageAt(scene, 99).speaker).toBe('barista');
    expect(stageAt(scene, -1).props).toEqual([]);
  });

  it('starts every café task from an empty stage', () => {
    const cafe = getUnit('cafe');
    expect(cafe).toBeDefined();
    for (const task of cafe?.tasks ?? []) {
      expect(stageAt(task.scene, 1).props).toEqual([]);
    }
  });

  it('follows the café cues: want latte, ask, and a sandwich handed over', () => {
    const tasks = getUnit('cafe')?.tasks ?? [];
    const [t1, , t3] = tasks;
    expect(stageAt(t1!.scene, 2).bubble).toEqual({ role: 'guide', act: 'want', item: 'latte' });
    expect(stageAt(t3!.scene, 1).bubble).toEqual({ role: 'guide', act: 'ask' });
    expect(stageAt(t3!.scene, 3).bubble).toEqual({ role: 'guide', act: 'ask' });
    expect(stageAt(t3!.scene, 4).props).toEqual([
      { lineId: 't3_4', item: 'sandwich', giver: 'barista', sliding: true },
    ]);
  });

  it('follows the moving-in cues: the key handed over, a question, the trash can', () => {
    const [t1, t2, t3] = getUnit('move_in')?.tasks ?? [];
    expect(stageAt(t1!.scene, 5).props).toEqual([
      { lineId: 't1_5', item: 'key', giver: 'landlord', sliding: true },
    ]);
    expect(stageAt(t1!.scene, 4).props).toEqual([]);
    expect(stageAt(t2!.scene, 4).bubble).toEqual({ role: 'guide', act: 'ask' });
    expect(stageAt(t3!.scene, 1).bubble).toEqual({
      role: 'landlord',
      act: 'want',
      item: 'trash_can',
    });
    expect(stageAt(t3!.scene, 2).bubble).toEqual({ role: 'guide', act: 'ask' });
    expect(stageAt(t3!.scene, 1).props).toEqual([]);
  });
});

describe('stageAfter', () => {
  it('keeps every given prop at rest, with no bubble and no speaker', () => {
    const ending = [...scene, line('f', 'guide', { act: 'want', item: 'latte' })];
    expect(stageAfter(ending)).toEqual({
      speaker: undefined,
      bubble: undefined,
      props: [{ lineId: 'c', item: 'latte', giver: 'barista', sliding: false }],
    });
  });

  it('does not slide a prop given on the last line', () => {
    const lastGive = scene.slice(0, 3);
    expect(stageAfter(lastGive).props).toEqual([
      { lineId: 'c', item: 'latte', giver: 'barista', sliding: false },
    ]);
  });

  it('is empty for an empty scene', () => {
    expect(stageAfter([])).toEqual({ speaker: undefined, bubble: undefined, props: [] });
  });
});
