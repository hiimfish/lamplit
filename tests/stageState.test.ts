import { describe, expect, it } from 'vitest';
import type { SceneLine } from '../src/content/types';
import { actorSpot, STAGE_UNIT_IDS, stageFor } from '../src/art/stage';
import { getUnit } from '../src/content/units';
import { rolesOnStage, stageAfter, stageAt } from '../src/ui/stage/stageState';

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

describe('rolesOnStage', () => {
  // A unit whose two NPCs share the right side, like moving-in day.
  const cast: SceneLine['role'][] = ['guide', 'landlord', 'neighbor'];
  const landlordTask = [line('a', 'landlord'), line('b', 'guide'), line('c', 'landlord')];
  const neighborTask = [line('a', 'neighbor'), line('b', 'guide')];

  it('shows the landlord, not the neighbor, in a task with only the landlord', () => {
    expect(rolesOnStage(cast, landlordTask)).toEqual(['guide', 'landlord']);
  });

  it('shows the neighbor, not the landlord, in a task with only the neighbor', () => {
    expect(rolesOnStage(cast, neighborTask)).toEqual(['guide', 'neighbor']);
  });

  it('always shows the player, even when the player has no line', () => {
    expect(rolesOnStage(cast, [line('a', 'neighbor')])).toEqual(['guide', 'neighbor']);
    expect(rolesOnStage(cast, [])).toEqual(['guide']);
  });

  it('shows every NPC who speaks, in cast order', () => {
    const both = [line('a', 'neighbor'), line('b', 'landlord')];
    expect(rolesOnStage(cast, both)).toEqual(['guide', 'landlord', 'neighbor']);
  });

  it('ignores speakers who are not in the cast', () => {
    expect(rolesOnStage(['guide', 'barista'], landlordTask)).toEqual(['guide']);
  });

  it('leaves the neighbor out of the moving-in tasks with the landlord', () => {
    const roles = Object.keys(stageFor('move_in')!.cast) as SceneLine['role'][];
    expect(roles).toEqual(expect.arrayContaining(['guide', 'landlord', 'neighbor']));
    const withLandlord = (getUnit('move_in')?.tasks ?? []).filter((t) =>
      t.scene.every((l) => l.role === 'guide' || l.role === 'landlord'),
    );
    expect(withLandlord.length).toBeGreaterThan(0);
    for (const task of withLandlord) {
      expect(rolesOnStage(roles, task.scene)).toEqual(['guide', 'landlord']);
    }
  });

  it('brings a second NPC on only at their first line', () => {
    const visit = [line('a', 'landlord'), line('b', 'guide'), line('c', 'neighbor')];
    expect(rolesOnStage(cast, visit, 0)).toEqual(['guide', 'landlord']);
    expect(rolesOnStage(cast, visit, 2)).toEqual(['guide', 'landlord']);
    expect(rolesOnStage(cast, visit, 3)).toEqual(['guide', 'landlord', 'neighbor']);
    expect(rolesOnStage(cast, visit)).toEqual(['guide', 'landlord', 'neighbor']);
  });

  it('shows the first NPC from the start, even when the player speaks first', () => {
    const playerFirst = [line('a', 'guide'), line('b', 'landlord')];
    expect(rolesOnStage(cast, playerFirst, 0)).toEqual(['guide', 'landlord']);
    expect(rolesOnStage(cast, playerFirst, 1)).toEqual(['guide', 'landlord']);
  });
});

describe('actorSpot', () => {
  const moveIn = stageFor('move_in')!;

  it('keeps each NPC at its own spot when alone', () => {
    expect(actorSpot(moveIn, 'neighbor', ['guide', 'neighbor'])).toEqual({ x: 88, y: 39 });
    expect(actorSpot(moveIn, 'landlord', ['guide', 'landlord'])).toEqual({ x: 88, y: 39 });
  });

  it('moves the neighbor to the door when the landlord is there too', () => {
    const both: SceneLine['role'][] = ['guide', 'landlord', 'neighbor'];
    expect(actorSpot(moveIn, 'landlord', both)).toEqual({ x: 88, y: 39 });
    expect(actorSpot(moveIn, 'neighbor', both)).toEqual({ x: 107, y: 39 });
  });

  it('is undefined for a role not in the cast', () => {
    expect(actorSpot(moveIn, 'barista', ['guide'])).toBeUndefined();
  });

  it('never puts two NPCs on one spot, and gives no bubble cue from a beside spot', () => {
    for (const unitId of STAGE_UNIT_IDS) {
      const config = stageFor(unitId)!;
      const castRoles = Object.keys(config.cast) as SceneLine['role'][];
      for (const task of getUnit(unitId)?.tasks ?? []) {
        task.scene.forEach((sceneLine, index) => {
          const roles = rolesOnStage(castRoles, task.scene, index + 1);
          const spots = roles
            .filter((r) => r !== 'guide')
            .map((r) => JSON.stringify(actorSpot(config, r, roles)));
          expect(new Set(spots).size, `${unitId}/${task.id}`).toBe(spots.length);
          const spot = actorSpot(config, sceneLine.role, roles);
          const actor = config.cast[sceneLine.role];
          const fromBeside = actor?.beside !== undefined && spot === actor.beside;
          const bubble = sceneLine.stage?.act === 'want' || sceneLine.stage?.act === 'ask';
          expect(fromBeside && bubble, `${unitId}/${sceneLine.id}`).toBe(false);
        });
      }
    }
  });

  it('has Lena walk in mid-way through the moving-in role-play', () => {
    const t8 = getUnit('move_in')!.tasks.find((t) => t.kind === 'roleplay')!;
    const castRoles = Object.keys(moveIn.cast) as SceneLine['role'][];
    const first = t8.scene.findIndex((l) => l.role === 'neighbor');
    expect(first).toBeGreaterThan(0);
    expect(rolesOnStage(castRoles, t8.scene, first)).toEqual(['guide', 'landlord']);
    expect(rolesOnStage(castRoles, t8.scene, first + 1)).toEqual(['guide', 'landlord', 'neighbor']);
  });
});
