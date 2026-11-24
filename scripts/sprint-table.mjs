// Prints the 12-week table of docs/specs/sprint.md, worked out from the real rules.
//
//   node scripts/sprint-table.mjs
//
// The rules reach import.meta.glob (through the content loaders), which plain Node cannot
// load, so this runs tests/sprintSchedule.test.ts under Vitest with SPRINT_TABLE=print and
// passes through what the test prints between the sprint-table markers, plus the numbers
// the docs quote.
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const START = '<!-- sprint-table:start -->';
const END = '<!-- sprint-table:end -->';

const run = spawnSync(
  process.execPath,
  [join(ROOT, 'node_modules', 'vitest', 'vitest.mjs'), 'run', 'tests/sprintSchedule.test.ts'],
  { cwd: ROOT, env: { ...process.env, SPRINT_TABLE: 'print' }, encoding: 'utf8' },
);
const output = `${run.stdout ?? ''}${run.stderr ?? ''}`;
const from = output.indexOf(START);
const to = output.indexOf(END);
if (from < 0 || to < from) {
  process.stderr.write(output);
  console.error('sprint-table: the test printed no table.');
  process.exit(run.status || 1);
}
const notes = output
  .slice(to + END.length)
  .split('\n')
  .filter((line) => /^(words left|per-day goal|week \d+:)/.test(line));
console.log(output.slice(from, to + END.length));
console.log(notes.join('\n'));
process.exit(run.status ?? 0);
