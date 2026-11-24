import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ACTS } from '../src/content/acts';
import { UNITS } from '../src/content/units';
import { simulateSprint, sprintTableMarkdown } from '../src/learning/sprintSchedule';
import { actUnits, buildTown } from '../src/learning/townPlan';

const town = buildTown(ACTS, UNITS);
const rows = simulateSprint(town, 12);

const START = '<!-- sprint-table:start -->';
const END = '<!-- sprint-table:end -->';
const doc = readFileSync(new URL('../docs/specs/sprint.md', import.meta.url), 'utf8');
const hasMarkers = doc.includes(START) && doc.includes(END);

type Unit = (typeof UNITS)[number];
const perAct = (pick: (units: Unit[]) => number): number[] =>
  town.map((act) => pick(actUnits(act)));

describe('the content the plan is built on', () => {
  it('teaches 301 / 342 / 832 / 1,026 words (2,501 in all)', () => {
    const words = perAct(
      (units) => new Set(units.flatMap((u) => u.tasks.flatMap((t) => t.newWordIds))).size,
    );
    expect(words).toEqual([301, 342, 832, 1026]);
    expect(words.reduce((a, b) => a + b, 0)).toBe(2501);
  });

  it('has 80 / 64 / 108 / 108 tasks', () => {
    expect(perAct((units) => units.reduce((n, u) => n + u.tasks.length, 0))).toEqual([
      80, 64, 108, 108,
    ]);
  });

  it('has 140 / 112 / 168 / 168 chunks', () => {
    expect(perAct((units) => units.reduce((n, u) => n + u.chunks.length, 0))).toEqual([
      140, 112, 168, 168,
    ]);
  });
});

describe('simulateSprint', () => {
  it('returns one row per week', () => {
    expect(rows.map((r) => r.week)).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
  });

  it('plays every task and reaches every word by the end of week 11', () => {
    expect(rows[10]?.tasks).toBe(360);
    expect(rows[10]?.act).toBe('done');
    expect(rows[10]?.words).toBe(2501);
    expect(rows[11]?.words).toBe(2501);
  });

  it('teaches nothing and plays no tasks in week 12', () => {
    expect(rows[11]?.newPerDay).toBe(0);
    expect(rows[11]?.tasksPerDay).toBe(0);
  });

  it('never goes backwards and starts in act 1', () => {
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i]?.tasks).toBeGreaterThanOrEqual(rows[i - 1]?.tasks ?? 0);
      expect(rows[i]?.words).toBeGreaterThanOrEqual(rows[i - 1]?.words ?? 0);
    }
    expect(rows[0]?.act).toBe(1);
  });

  it('keeps each week from 3 on within the 10 to 50 a day band while words are left', () => {
    for (const row of rows.slice(2, 11)) {
      if (row.words === 2501 && row.newPerDay < 10) continue; // the words ran out mid-week
      expect(row.newPerDay).toBeGreaterThanOrEqual(10);
      expect(row.newPerDay).toBeLessThanOrEqual(50);
    }
  });

  it('learns at least 15 a day in week 1 (the story hands out words too)', () => {
    expect(rows[0]?.newPerDay).toBeGreaterThanOrEqual(15);
  });
});

describe('sprintTableMarkdown', () => {
  const lines = sprintTableMarkdown(rows).split('\n');

  it('has a header, a rule and the rows of weeks 3, 5, 8, 11 and 12', () => {
    expect(lines).toHaveLength(7);
    expect(lines[0]).toBe(
      '| 到第幾週結束 | 累積任務 | 所在的幕 | 每天任務 | 每天新字 | 累積單字 | 檢查點 |',
    );
    expect(lines.slice(2).map((l) => l.split('|')[1]?.trim())).toEqual([
      '第 3 週',
      '第 5 週',
      '第 8 週',
      '第 11 週',
      '第 12 週',
    ]);
  });

  it('marks the checkpoints 225 / 375 / 475 / none / 600', () => {
    const last = lines.slice(2).map((l) => l.split('|').at(-2)?.trim());
    expect(last).toEqual(['目標 225', '目標 375', '目標 475', '—', '目標 600']);
  });

  it('renders only a header and a rule for no rows', () => {
    expect(sprintTableMarkdown([]).split('\n')).toHaveLength(2);
  });
});

const cells = (line: string): string[] =>
  line
    .split('|')
    .slice(1, -1)
    .map((c) => c.trim());

describe('docs/specs/sprint.md', () => {
  it.skipIf(!hasMarkers)('holds the generated table between the markers', () => {
    const inDoc = doc
      .slice(doc.indexOf(START) + START.length, doc.indexOf(END))
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith('|'))
      .map(cells);
    const wanted = sprintTableMarkdown(rows).split('\n').map(cells);
    // Row 1 is the rule line (Prettier pads it with dashes), so compare the rest.
    expect(inDoc.filter((_, i) => i !== 1)).toEqual(wanted.filter((_, i) => i !== 1));
    expect(inDoc).toHaveLength(wanted.length);
  });
});

describe('print for scripts/sprint-table.mjs', () => {
  it.skipIf(process.env.SPRINT_TABLE !== 'print')('prints the table and the doc numbers', () => {
    const atWeek2 = rows[1]?.words ?? 0;
    const left = 2501 - atWeek2;
    const out = [
      START,
      sprintTableMarkdown(rows),
      END,
      `words left at the start of week 3: ${left}`,
      `per-day goal then: ${Math.ceil(left / 63)} (63 days)`,
      ...rows.map(
        (r) =>
          `week ${r.week}: tasks ${r.tasks} act ${r.act} words ${r.words} new/day ${r.newPerDay.toFixed(1)} tasks/day ${r.tasksPerDay.toFixed(1)}`,
      ),
    ];
    console.log(out.join('\n'));
  });
});
