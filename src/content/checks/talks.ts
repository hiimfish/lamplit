/**
 * 聽對話答題 (TOEIC Part 3): checks a task's `talks` (TalkItem in types.ts).
 * Line audio ids are `${unitId}.talk.${lineId}`, so line ids are unique across the unit
 * and use only what an audio id accepts (lower-case letters, digits, underscore).
 * (tests/smoothness.test.ts checks that the lines, questions and options use taught words.)
 */
import { ROLE_LABEL } from '../roles';
import type { Role } from '../types';
import {
  checkChoiceQuestion,
  ID_PATTERN,
  isObject,
  sameText,
  type TaskCheckContext,
} from './common';

export const TALK_MIN_LINES = 3;
export const TALK_MAX_LINES = 6;
export const TALK_MAX_QUESTIONS = 3;
/** One conversation per task: each one is heard in full, so more would make the round long. */
export const TALK_MAX_PER_TASK = 1;
/** The same speaker may say at most this many lines in a row. */
export const TALK_MAX_RUN = 2;

const TALK_KEYS = ['id', 'lines', 'questions'];
const LINE_KEYS = ['id', 'role', 'en', 'zh'];
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
  problems.push(...checkLines(talk.lines, label, ctx));

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

function checkLines(value: unknown, label: string, ctx: TaskCheckContext): string[] {
  if (!Array.isArray(value))
    return [`${label} needs "lines", a list of ${TALK_MIN_LINES} to ${TALK_MAX_LINES} lines`];
  if (value.length < TALK_MIN_LINES || value.length > TALK_MAX_LINES) {
    return [`${label} has ${value.length} lines; it needs ${TALK_MIN_LINES} to ${TALK_MAX_LINES}`];
  }
  const problems: string[] = [];
  const lineIds = ctx.seen('talk line');
  const roles: Role[] = [];
  let run = 0;
  let previous: unknown;
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
    if (!hasText(line.zh)) problems.push(`${lineLabel} needs its Chinese in "zh"`);

    run = line.role !== undefined && line.role === previous ? run + 1 : 1;
    previous = line.role;
    if (run === TALK_MAX_RUN + 1) {
      problems.push(
        `${lineLabel} makes ${run} lines in a row by "${String(line.role)}"; one speaker says at most ${TALK_MAX_RUN} in a row`,
      );
    }
  });
  if (roles.length !== 2) {
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
