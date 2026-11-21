import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import cafe from '../src/data/units/cafe.json';
import { UNITS, getItem, getUnit, taskItemIds } from '../src/content/units';
import { validateUnit } from '../src/content/validate';

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
    expect(problemsFor((u) => u.tasks[0]!.newChunkIds.push('nope'))).not.toEqual([]);
    expect(problemsFor((u) => u.tasks[0]!.newWordIds.push('nope'))).not.toEqual([]);
    const player = (u: ReturnType<typeof copy>) =>
      u.tasks[0]!.scene.find((l) => l.speaker === 'player') as { chunkId?: string };
    expect(problemsFor((u) => (player(u).chunkId = 'nope'))).not.toEqual([]);
    expect(problemsFor((u) => delete player(u).chunkId)).not.toEqual([]);
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
