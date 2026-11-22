/**
 * 聽對話答題 (TOEIC Part 3) and 聽獨白答題 (TOEIC Part 4): checks a task's `talks`
 * (TalkItem in types.ts). A conversation has two speakers and may carry a table (Part 3
 * with a graphic); a monologue (`kind: 'monologue'`) has one.
 * Line audio ids are `${unitId}.talk.${lineId}`, so line ids are unique across the unit
 * and use only what an audio id accepts (lower-case letters, digits, underscore).
 * (tests/smoothness.test.ts checks that the lines, table, questions and options use taught words.)
 */
import { ROLE_LABEL } from '../roles';
import type { Role } from '../types';
import {
  checkChoiceQuestion,
  ID_PATTERN,
  isLateAct,
  isObject,
  sameText,
  wordCount,
  type TaskCheckContext,
} from './common';

export const TALK_MIN_LINES = 3;
export const TALK_MAX_LINES = 6;
/** A conversation may be longer from Act 3 on. */
export const TALK_MAX_LINES_LATE = 8;
export const TALK_MAX_QUESTIONS = 3;
/** One conversation per task: each one is heard in full, so more would make the round long. */
export const TALK_MAX_PER_TASK = 1;
/** The same speaker may say at most this many lines in a row (in a conversation). */
export const TALK_MAX_RUN = 2;

/** A monologue: one speaker, this many lines and words in all. */
export const MONOLOGUE_MIN_LINES = 3;
export const MONOLOGUE_MAX_LINES = 10;
export const MONOLOGUE_MIN_WORDS = 30;
export const MONOLOGUE_MAX_WORDS = 120;

/** A talk's table: rows (header included), cells per row, words per cell. */
export const TABLE_MIN_ROWS = 2;
export const TABLE_MAX_ROWS = 5;
export const TABLE_MIN_COLUMNS = 2;
export const TABLE_MAX_COLUMNS = 4;
export const TABLE_MAX_CELL_WORDS = 3;

const TALK_KEYS = ['id', 'kind', 'lines', 'questions', 'table'];
const LINE_KEYS = ['id', 'role', 'en', 'zh'];
const TABLE_KEYS = ['title', 'rows'];
const ID_HINT = 'use lower-case letters, digits and _ only, like "t5_talk_1"';

const hasText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== '';

/** Fields a writer may have misspelled or invented ("question", "speaker", "text"...). */
function unknownKeys(value: Record<string, unknown>, known: string[]): string[] {
  return Object.keys(value).filter((key) => !known.includes(key));
}

/** Problems with the task's `talks`, or none when it has no such field. */
export function checkTalks(task: Record<string, unknown>, ctx: TaskCheckContext): string[] {
  if (task.talks === undefined) return [];
  if (!Array.isArray(task.talks) || task.talks.length === 0) {
    return ['talks must be a non-empty list of conversations'];
  }
  const problems: string[] = [];
  if (task.talks.length > TALK_MAX_PER_TASK) {
    problems.push(
      `has ${task.talks.length} talks; a task has at most ${TALK_MAX_PER_TASK} (move the others to another task)`,
    );
  }
  task.talks.forEach((talk, i) => {
    if (!isObject(talk)) problems.push(`talk ${i + 1} must be an object { id, lines, questions }`);
    else problems.push(...checkTalk(talk, ctx));
  });
  return problems;
}

function checkTalk(talk: Record<string, unknown>, ctx: TaskCheckContext): string[] {
  const problems: string[] = [];
  const label = `talk "${String(talk.id)}"`;
  const seen = ctx.seen('talk');
  if (typeof talk.id !== 'string' || !ID_PATTERN.test(talk.id)) {
    problems.push(`${label} has a bad id: ${ID_HINT}`);
  } else if (seen.has(talk.id)) {
    problems.push(`${label} has an id already used by another talk in this unit`);
  } else {
    seen.add(talk.id);
  }
  for (const key of unknownKeys(talk, TALK_KEYS)) {
    problems.push(`${label} has unknown field "${key}" (a talk has only ${TALK_KEYS.join(', ')})`);
  }
  if (talk.kind !== undefined && talk.kind !== 'monologue') {
    problems.push(
      `${label} has bad kind "${String(talk.kind)}" (use "monologue", or leave it out for a conversation)`,
    );
  }
  const monologue = talk.kind === 'monologue';
  problems.push(...checkLines(talk.lines, label, ctx, monologue));
  if (talk.table !== undefined) {
    if (monologue) problems.push(`${label} is a monologue; only a conversation may have a table`);
    else problems.push(...checkTable(talk.table, label));
  }

  const questions = talk.questions;
  if (!Array.isArray(questions) || questions.length < 1 || questions.length > TALK_MAX_QUESTIONS) {
    problems.push(`${label} needs 1 to ${TALK_MAX_QUESTIONS} questions`);
  } else {
    const asked: string[] = [];
    questions.forEach((q: unknown, i) => {
      const qLabel = `${label} question ${i + 1}`;
      problems.push(...checkChoiceQuestion(q, qLabel));
      if (!isObject(q) || !hasText(q.en)) return;
      if (asked.some((en) => sameText(en, q.en as string))) {
        problems.push(`${qLabel} asks the same as an earlier question`);
      }
      asked.push(q.en);
    });
  }
  return problems;
}

function checkLines(
  value: unknown,
  label: string,
  ctx: TaskCheckContext,
  monologue: boolean,
): string[] {
  const min = monologue ? MONOLOGUE_MIN_LINES : TALK_MIN_LINES;
  const max = monologue
    ? MONOLOGUE_MAX_LINES
    : isLateAct(ctx)
      ? TALK_MAX_LINES_LATE
      : TALK_MAX_LINES;
  const what = monologue ? 'a monologue' : 'it';
  if (!Array.isArray(value)) return [`${label} needs "lines", a list of ${min} to ${max} lines`];
  if (value.length < min || value.length > max) {
    return [`${label} has ${value.length} lines; ${what} needs ${min} to ${max}`];
  }
  const problems: string[] = [];
  const lineIds = ctx.seen('talk line');
  const roles: Role[] = [];
  let run = 0;
  let previous: unknown;
  let words = 0;
  value.forEach((raw, i) => {
    if (!isObject(raw)) {
      problems.push(`${label} line ${i + 1} must be an object { id, role, en, zh }`);
      previous = undefined;
      return;
    }
    const line = raw;
    const lineLabel = `${label} line "${String(line.id)}"`;
    if (typeof line.id !== 'string' || !ID_PATTERN.test(line.id)) {
      problems.push(`${label} line ${i + 1} has a bad id "${String(line.id)}": ${ID_HINT}`);
    } else if (lineIds.has(line.id)) {
      problems.push(`${lineLabel} has an id already used by another talk line in this unit`);
    } else {
      lineIds.add(line.id);
    }
    for (const key of unknownKeys(line, LINE_KEYS)) {
      problems.push(
        `${lineLabel} has unknown field "${key}" (a line has only ${LINE_KEYS.join(', ')})`,
      );
    }
    if (!ctx.isRole(line.role)) {
      problems.push(`${lineLabel} has bad role "${String(line.role)}" (use a role with a voice)`);
    } else if (!roles.includes(line.role as Role)) {
      roles.push(line.role as Role);
    }
    if (!hasText(line.en)) problems.push(`${lineLabel} needs its English in "en"`);
    else words += wordCount(line.en);
    if (!hasText(line.zh)) problems.push(`${lineLabel} needs its Chinese in "zh"`);

    run = line.role !== undefined && line.role === previous ? run + 1 : 1;
    previous = line.role;
    if (!monologue && run === TALK_MAX_RUN + 1) {
      problems.push(
        `${lineLabel} makes ${run} lines in a row by "${String(line.role)}"; one speaker says at most ${TALK_MAX_RUN} in a row`,
      );
    }
  });
  if (monologue) {
    if (roles.length !== 1) {
      problems.push(
        `${label} is a monologue and needs exactly one speaker (has ${roles.length}: ${roles.join(', ') || 'none'})`,
      );
    }
    if (words < MONOLOGUE_MIN_WORDS || words > MONOLOGUE_MAX_WORDS) {
      problems.push(
        `${label} has ${words} words; a monologue has ${MONOLOGUE_MIN_WORDS} to ${MONOLOGUE_MAX_WORDS}`,
      );
    }
  } else if (roles.length !== 2) {
    problems.push(
      `${label} needs exactly two speakers (has ${roles.length}: ${roles.join(', ') || 'none'})`,
    );
  } else if (ROLE_LABEL[roles[0]!] === ROLE_LABEL[roles[1]!]) {
    problems.push(
      `${label} speakers "${roles[0]}" and "${roles[1]}" are both shown as 「${ROLE_LABEL[roles[0]!]}」; pick roles with different labels`,
    );
  }
  return problems;
}

/** A table: an optional title, 2-5 rows (the first the header) of 2-4 short cells, all as long. */
function checkTable(value: unknown, label: string): string[] {
  const where = `${label} table`;
  if (!isObject(value)) return [`${where} must be an object { title?, rows }`];
  const problems: string[] = [];
  for (const key of unknownKeys(value, TABLE_KEYS)) {
    problems.push(
      `${where} has unknown field "${key}" (a table has only ${TABLE_KEYS.join(', ')})`,
    );
  }
  if (value.title !== undefined && !hasText(value.title)) {
    problems.push(`${where} has an empty title: write one or leave the field out`);
  }
  const rows = value.rows;
  if (!Array.isArray(rows) || rows.length < TABLE_MIN_ROWS || rows.length > TABLE_MAX_ROWS) {
    problems.push(
      `${where} needs "rows", a list of ${TABLE_MIN_ROWS} to ${TABLE_MAX_ROWS} rows (the first is the header)`,
    );
    return problems;
  }
  let width: number | undefined;
  rows.forEach((row: unknown, r) => {
    const rowLabel = `${where} row ${r + 1}`;
    if (!Array.isArray(row) || row.length < TABLE_MIN_COLUMNS || row.length > TABLE_MAX_COLUMNS) {
      problems.push(
        `${rowLabel} needs a list of ${TABLE_MIN_COLUMNS} to ${TABLE_MAX_COLUMNS} cells`,
      );
      return;
    }
    if (width === undefined) width = row.length;
    else if (row.length !== width) {
      problems.push(
        `${rowLabel} has ${row.length} cells; every row needs ${width}, like the first`,
      );
    }
    row.forEach((cell: unknown, c) => {
      if (!hasText(cell)) problems.push(`${rowLabel} cell ${c + 1} is empty or not text`);
      else if (wordCount(cell) > TABLE_MAX_CELL_WORDS) {
        problems.push(
          `${rowLabel} cell ${c + 1} "${cell}" is longer than ${TABLE_MAX_CELL_WORDS} words`,
        );
      }
    });
  });
  return problems;
}
