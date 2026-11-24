import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GRAMMAR_GROUPS, GRAMMAR_POINTS, grammarPointOf } from '../src/content/grammar';
import { UNIT_ORDER } from '../src/content/unitOrder';

interface UnitFile {
  tasks: { id: string }[];
}

const loadUnit = (unitId: string): UnitFile =>
  JSON.parse(readFileSync(join(__dirname, '..', 'src', 'data', 'units', `${unitId}.json`), 'utf8'));

const CJK = /[一-鿿]/;

describe('GRAMMAR_POINTS', () => {
  it('has 70 to 80 points', () => {
    expect(GRAMMAR_POINTS.length).toBeGreaterThanOrEqual(70);
    expect(GRAMMAR_POINTS.length).toBeLessThanOrEqual(80);
  });

  it('has unique kebab-case ids and kebab-case groups', () => {
    const ids = GRAMMAR_POINTS.map((point) => point.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const point of GRAMMAR_POINTS) {
      expect(point.id).toMatch(/^[a-z]+(-[a-z]+)*$/);
      expect(point.group).toMatch(/^[a-z]+(-[a-z]+)*$/);
    }
  });

  it('points at tasks that exist in the unit files', () => {
    for (const point of GRAMMAR_POINTS) {
      const unit = loadUnit(point.unitId);
      expect(
        unit.tasks.map((task) => task.id),
        point.id,
      ).toContain(point.taskId);
    }
  });

  it('is in play order', () => {
    const position = (unitId: string, taskId: string): number => {
      const unitIndex = UNIT_ORDER.indexOf(unitId);
      expect(unitIndex, unitId).toBeGreaterThanOrEqual(0);
      return unitIndex * 100 + Number(taskId.slice(1));
    };
    const positions = GRAMMAR_POINTS.map((point) => position(point.unitId, point.taskId));
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]!, GRAMMAR_POINTS[i]!.id).toBeGreaterThanOrEqual(positions[i - 1]!);
    }
  });

  it('has a Chinese name and a non-empty Chinese note on every point', () => {
    for (const point of GRAMMAR_POINTS) {
      expect(point.zh.trim(), point.id).not.toBe('');
      expect(point.note.trim(), point.id).not.toBe('');
      expect(CJK.test(point.note), point.id).toBe(true);
    }
  });

  it('looks points up by id and lists every group once', () => {
    expect(grammarPointOf('present-simple')?.unitId).toBe('move_in');
    expect(grammarPointOf('nope')).toBeUndefined();
    expect(new Set(GRAMMAR_GROUPS).size).toBe(GRAMMAR_GROUPS.length);
  });
});
