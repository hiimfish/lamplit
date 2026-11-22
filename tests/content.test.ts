import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import cafe from '../src/data/units/cafe.json';
import { UNITS, getItem, getUnit, speakerOf, taskItemIds } from '../src/content/units';
import { validateUnit } from '../src/content/validate';
import { buildRolePlayTurns, makeRng } from '../src/learning/questionGen';

const UNIT_DIR = join(__dirname, '..', 'src', 'data', 'units');
const unitFiles = readdirSync(UNIT_DIR).filter((f) => f.endsWith('.json'));

/** A fresh deep copy of the café unit to break on purpose. */
const copy = (): typeof cafe => JSON.parse(JSON.stringify(cafe));

describe('validateUnit on shipped content', () => {
  it('finds unit files', () => {
    expect(unitFiles.length).toBeGreaterThan(0);
  });

  it.each(unitFiles)('%s has no problems', (file) => {
    const unit: unknown = JSON.parse(readFileSync(join(UNIT_DIR, file), 'utf8'));
    expect(validateUnit(unit)).toEqual([]);
  });

  it('loads every shipped unit (none skipped)', () => {
    expect(UNITS).toHaveLength(unitFiles.length);
    expect(getUnit('cafe')?.id).toBe('cafe');
  });
});

describe('validateUnit catches broken content', () => {
  const problemsFor = (edit: (unit: ReturnType<typeof copy>) => void) => {
    const unit = copy();
    edit(unit);
    return validateUnit(unit);
  };

  it('rejects non-objects', () => {
    expect(validateUnit(null)).not.toEqual([]);
    expect(validateUnit([])).not.toEqual([]);
  });

  it('rejects ids that do not match [a-z0-9_]+', () => {
    expect(problemsFor((u) => (u.id = 'Cafe'))).not.toEqual([]);
    expect(problemsFor((u) => (u.chunks[0]!.id = 'can-i-get'))).not.toEqual([]);
    expect(problemsFor((u) => (u.words[0]!.id = 'Latte'))).not.toEqual([]);
    expect(problemsFor((u) => (u.tasks[0]!.id = 't 1'))).not.toEqual([]);
    expect(problemsFor((u) => (u.tasks[0]!.scene[0]!.id = 't1.1'))).not.toEqual([]);
  });

  it('rejects duplicate ids', () => {
    expect(problemsFor((u) => (u.chunks[1]!.id = u.chunks[0]!.id))).not.toEqual([]);
    expect(problemsFor((u) => (u.words[1]!.id = u.words[0]!.id))).not.toEqual([]);
    expect(problemsFor((u) => (u.tasks[1]!.id = u.tasks[0]!.id))).not.toEqual([]);
    expect(problemsFor((u) => (u.tasks[1]!.scene[0]!.id = u.tasks[0]!.scene[0]!.id))).not.toEqual(
      [],
    );
  });

  it('rejects unknown references and player lines with no chunk', () => {
    expect(problemsFor((u) => (u.tasks[0]!.newChunkIds as string[]).push('nope'))).not.toEqual([]);
    expect(problemsFor((u) => (u.tasks[0]!.newWordIds as string[]).push('nope'))).not.toEqual([]);
    const player = (u: ReturnType<typeof copy>) =>
      u.tasks[0]!.scene.find((l) => l.speaker === 'player') as { chunkId?: string };
    expect(problemsFor((u) => (player(u).chunkId = 'nope'))).not.toEqual([]);
    expect(problemsFor((u) => delete player(u).chunkId)).not.toEqual([]);
  });

  describe('stage cues', () => {
    const withStage = (stage: unknown) =>
      problemsFor((u) => {
        (u.tasks[0]!.scene[0] as { stage?: unknown }).stage = stage;
      });

    it('accepts want / give with a word of the unit, and ask with no item', () => {
      expect(withStage({ act: 'want', item: 'latte' })).toEqual([]);
      expect(withStage({ act: 'give', item: 'muffin' })).toEqual([]);
      expect(withStage({ act: 'ask' })).toEqual([]);
    });

    it('rejects a bad act, a missing or unknown item, and ask with an item', () => {
      expect(withStage({ act: 'wave' })).not.toEqual([]);
      expect(withStage({ act: 'want' })).not.toEqual([]);
      expect(withStage({ act: 'give', item: 'key' })).not.toEqual([]);
      expect(withStage({ act: 'give', item: 3 })).not.toEqual([]);
      expect(withStage({ act: 'ask', item: 'latte' })).not.toEqual([]);
      expect(withStage('want')).not.toEqual([]);
    });
  });
});

describe('ids across units', () => {
  // Save cards and getItem use `chunk:<id>` / `word:<id>` / `pair:<id>` with no unit prefix,
  // so the same id in two units would share one review card and resolve to the wrong unit.
  it('never reuses a chunk, word, pair or pair-side id in two units', () => {
    const seen = new Map<string, string>();
    const clashes: string[] = [];
    for (const unit of UNITS) {
      const ids = [
        ...unit.chunks.map((c) => `chunk:${c.id}`),
        ...unit.words.map((w) => `word:${w.id}`),
        ...(unit.pairs ?? []).map((p) => `pair:${p.id}`),
        ...(unit.pairs ?? []).flatMap((p) => [`side:${p.a.id}`, `side:${p.b.id}`]),
      ];
      for (const id of ids) {
        const owner = seen.get(id);
        if (owner && owner !== unit.id) clashes.push(`${id} in ${owner} and ${unit.id}`);
        seen.set(id, unit.id);
      }
    }
    expect(clashes).toEqual([]);
  });

  it('plays the moving-in unit before the café', () => {
    expect(UNITS.map((u) => u.id).slice(0, 2)).toEqual(['move_in', 'cafe']);
  });
});

describe('getItem / taskItemIds', () => {
  it('looks up chunks and words with their audio ids', () => {
    expect(getItem('chunk:can_i_get')).toMatchObject({
      itemId: 'chunk:can_i_get',
      kind: 'chunk',
      unitId: 'cafe',
      audioId: 'cafe.chunk.can_i_get',
      role: 'guide',
    });
    expect(getItem('word:tea')).toMatchObject({
      kind: 'word',
      unitId: 'cafe',
      audioId: 'cafe.word.tea',
      emoji: expect.any(String),
    });
  });

  it('returns undefined for unknown or malformed ids', () => {
    for (const id of ['chunk:t1_2', 'word:can_i_get', 'chunk:', 'tea', 'line:t1_1', '']) {
      expect(getItem(id), id).toBeUndefined();
    }
  });

  it('lists a task’s items, chunks first, and every one resolves', () => {
    expect(taskItemIds({ newChunkIds: ['a', 'b'], newWordIds: ['c'] })).toEqual([
      'chunk:a',
      'chunk:b',
      'word:c',
    ]);
    for (const unit of UNITS) {
      for (const task of unit.tasks) {
        for (const id of taskItemIds(task)) expect(getItem(id), id).toBeDefined();
      }
    }
  });
});

describe('speakerOf', () => {
  it('a scene line is said by its role', () => {
    expect(speakerOf('cafe.line.t1_1')).toBe('barista');
    expect(speakerOf('cafe.line.t1_2')).toBe('guide');
    expect(speakerOf('move_in.line.t1_1')).toBe('landlord');
  });

  it('chunks, words and minimal pairs are said by the guide', () => {
    expect(speakerOf('cafe.chunk.can_i_get')).toBe('guide');
    expect(speakerOf('cafe.word.latte')).toBe('guide');
    expect(speakerOf('move_in.pair.fan')).toBe('guide');
  });

  it('unknown ids have no speaker', () => {
    for (const id of ['cafe.line.nope', 'nope.word.latte', 'latte', '']) {
      expect(speakerOf(id), id).toBeUndefined();
    }
  });
});

describe('role-play tasks', () => {
  interface RolePlayTask {
    id: string;
    title: string;
    kind: string;
    newChunkIds: string[];
    newWordIds: string[];
    newPairIds?: string[];
    scene: {
      id: string;
      role: string;
      speaker: string;
      en: string;
      zh: string;
      chunkId?: string;
    }[];
  }
  const rolePlay = (): RolePlayTask => ({
    id: 'rp',
    title: '角色扮演大挑戰',
    kind: 'roleplay',
    newChunkIds: [],
    newWordIds: [],
    scene: [
      { id: 'rp_1', role: 'barista', speaker: 'npc', en: 'Hi!', zh: '嗨！' },
      {
        id: 'rp_2',
        role: 'guide',
        speaker: 'player',
        en: 'Can I get a latte, please?',
        zh: '一杯拿鐵',
        chunkId: 'can_i_get',
      },
      {
        id: 'rp_3',
        role: 'barista',
        speaker: 'npc',
        en: 'For here or to go?',
        zh: '內用還是外帶？',
      },
      {
        id: 'rp_4',
        role: 'guide',
        speaker: 'player',
        en: 'To go, please.',
        zh: '外帶',
        chunkId: 'to_go',
      },
    ],
  });
  /** The café unit with a role-play task added last (or first) after `edit`. */
  const problems = (edit: (task: RolePlayTask) => void = () => {}, first = false) => {
    const unit = copy();
    const task = rolePlay();
    edit(task);
    const tasks = unit.tasks as unknown[];
    if (first) tasks.unshift(task);
    else tasks.push(task);
    return validateUnit(unit);
  };

  it('accepts a review of chunks taught earlier', () => {
    expect(problems()).toEqual([]);
  });

  it('rejects an unknown task kind', () => {
    expect(problems((t) => (t.kind = 'boss'))).not.toEqual([]);
  });

  it('rejects new items', () => {
    expect(problems((t) => t.newChunkIds.push('can_i_get'))).not.toEqual([]);
    expect(problems((t) => t.newWordIds.push('latte'))).not.toEqual([]);
    expect(problems((t) => (t.newPairIds = []))).not.toEqual([]);
  });

  it('needs an NPC line before every player line', () => {
    expect(problems((t) => t.scene.shift())).not.toEqual([]);
    expect(problems((t) => t.scene.splice(2, 1))).not.toEqual([]);
  });

  it('needs at least two turns', () => {
    expect(problems((t) => t.scene.splice(2))).not.toEqual([]);
  });

  it('rejects chunks not taught before it', () => {
    expect(problems(() => {}, true)).not.toEqual([]);
  });

  it.each(UNITS.map((u) => u.id))('%s ends with a role-play, one turn per player line', (id) => {
    const unit = getUnit(id)!;
    const last = unit.tasks.at(-1)!;
    expect(last.kind).toBe('roleplay');
    expect(unit.tasks.filter((t) => t.kind === 'roleplay')).toHaveLength(1);
    const players = last.scene.filter((l) => l.speaker === 'player');
    expect(buildRolePlayTurns(unit, last, makeRng(1))).toHaveLength(players.length);
  });
});
