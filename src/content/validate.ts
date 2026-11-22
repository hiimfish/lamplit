/**
 * Checks a unit loaded from JSON before the game trusts it. Returns a list of
 * human-readable problems; an empty list means the unit is safe to use.
 */

import {
  ID_PATTERN,
  allDifferent,
  isIndex,
  isObject,
  isText,
  list,
  sameText,
  textList,
  wordCount,
  type TaskCheckContext,
} from './checks/common';
import { checkFillChunks, checkFills } from './checks/fills';
import { checkPassages } from './checks/passages';
import { checkTalks } from './checks/talks';

const ROLES = [
  'barista',
  'landlord',
  'neighbor',
  'clerk',
  'passerby',
  'driver',
  'cashier',
  'vendor',
  'assistant',
  'receptionist',
  'doctor',
  'pharmacist',
  'server',
  'friend',
  'postal_clerk',
  'volunteer',
  'teller',
  'instructor',
  'librarian',
  'mechanic',
  'counselor',
  'front_desk',
  'manager',
  'hr',
  'coworker',
  'client',
  'supplier',
  'warehouse_lead',
  'customer',
  'airline_agent',
  'hotel_clerk',
  'director',
  'announcer',
  'guide',
];
const SPEAKERS = ['npc', 'player'];

export function validateUnit(unit: unknown): string[] {
  const problems: string[] = [];
  if (!isObject(unit)) return ['unit is not an object'];
  const unitId = typeof unit.id === 'string' ? unit.id : '';
  const where = (path: string) => `${unitId || '?'}: ${path}`;
  if (!ID_PATTERN.test(unitId)) problems.push(where(`bad unit id "${String(unit.id)}"`));
  if (!isText(unit.title)) problems.push(where('missing title'));

  /** Checks ids in one list: pattern and uniqueness. Returns the valid ids. */
  const ids = (items: Record<string, unknown>[], label: string, seen = new Set<string>()) => {
    items.forEach((item, i) => {
      const id = item.id;
      if (typeof id !== 'string' || !ID_PATTERN.test(id)) {
        problems.push(where(`${label}[${i}] has bad id "${String(id)}"`));
      } else if (seen.has(id)) {
        problems.push(where(`duplicate ${label} id "${id}"`));
      } else {
        seen.add(id);
      }
      if (label !== 'task' && (!isText(item.en) || !isText(item.zh))) {
        problems.push(where(`${label} "${String(id)}" needs en and zh`));
      }
    });
    return seen;
  };

  const chunks = list(unit.chunks);
  const words = list(unit.words);
  const tasks = list(unit.tasks);
  if (!chunks) problems.push(where('chunks must be a list'));
  if (!words) problems.push(where('words must be a list'));
  if (!tasks) problems.push(where('tasks must be a list'));
  const chunkIds = ids(chunks ?? [], 'chunk');
  const wordIds = ids(words ?? [], 'word');
  ids(tasks ?? [], 'task');
  const pairIds = checkPairs(unit.pairs, problems, where);

  // Line audio ids are `${unitId}.line.${id}`, so line ids are unique across the unit.
  const lineIds = new Set<string>();
  // Sign and picture ids are unique across the unit too (picture audio is `${unitId}.picture.${id}`).
  const signIds = new Set<string>();
  const pictureIds = new Set<string>();
  /** Chunks introduced by the tasks before the current one. */
  const taughtChunks = new Set<string>();
  // Fill, passage and talk ids (and talk line ids) are unique across the unit too.
  const idSpaces = new Map<string, Set<string>>();
  const seen = (kind: string) => {
    let ids = idSpaces.get(kind);
    if (!ids) idSpaces.set(kind, (ids = new Set()));
    return ids;
  };
  const isRole = (value: unknown) => typeof value === 'string' && ROLES.includes(value);
  for (const task of tasks ?? []) {
    const taskId = String(task.id);
    if (task.kind !== undefined && task.kind !== 'roleplay') {
      problems.push(where(`task "${taskId}" has bad kind "${String(task.kind)}"`));
    }
    const refs = (
      key: 'newChunkIds' | 'newWordIds' | 'newPairIds',
      known: Set<string>,
      kind: string,
    ) => {
      const value = task[key];
      if (value === undefined && key === 'newPairIds') return;
      if (!Array.isArray(value)) {
        problems.push(where(`task "${taskId}" ${key} must be a list`));
        return;
      }
      for (const id of value) {
        if (typeof id !== 'string' || !known.has(id)) {
          problems.push(where(`task "${taskId}" uses unknown ${kind} "${String(id)}"`));
        }
      }
    };
    refs('newChunkIds', chunkIds, 'chunk');
    refs('newWordIds', wordIds, 'word');
    refs('newPairIds', pairIds, 'pair');
    // Spelling words may come from earlier units, so only their shape is checked here
    // (tests/content.test.ts checks that each one was taught before the task).
    if (task.spellWordIds !== undefined) {
      const spell = task.spellWordIds;
      if (!Array.isArray(spell) || spell.length === 0) {
        problems.push(where(`task "${taskId}" spellWordIds must be a non-empty list`));
      } else {
        for (const id of spell) {
          if (typeof id !== 'string' || !ID_PATTERN.test(id)) {
            problems.push(where(`task "${taskId}" has bad spell word "${String(id)}"`));
          }
        }
        if (new Set(spell).size !== spell.length) {
          problems.push(where(`task "${taskId}" spellWordIds has duplicates`));
        }
      }
    }

    const scene = list(task.scene);
    if (!scene) {
      problems.push(where(`task "${taskId}" scene must be a list`));
      continue;
    }
    ids(scene, 'line', lineIds);
    for (const line of scene) {
      const lineId = String(line.id);
      if (!isRole(line.role)) {
        problems.push(where(`line "${lineId}" has bad role "${String(line.role)}"`));
      }
      if (typeof line.speaker !== 'string' || !SPEAKERS.includes(line.speaker)) {
        problems.push(where(`line "${lineId}" has bad speaker "${String(line.speaker)}"`));
      }
      if (line.chunkId !== undefined) {
        if (typeof line.chunkId !== 'string' || !chunkIds.has(line.chunkId)) {
          problems.push(where(`line "${lineId}" uses unknown chunk "${String(line.chunkId)}"`));
        }
      } else if (line.speaker === 'player') {
        problems.push(where(`player line "${lineId}" has no chunkId`));
      }
      if (line.stage !== undefined)
        checkStage(line.stage, wordIds, (p) => problems.push(where(`line "${lineId}" ${p}`)));
    }
    const report = (p: string) => problems.push(where(`task "${taskId}" ${p}`));
    if (task.cloze !== undefined) checkCloze(task.cloze, scene, report);
    if (task.signs !== undefined) checkSigns(task.signs, signIds, report);
    if (task.pictures !== undefined) checkPictures(task.pictures, pictureIds, report);
    const newChunks = Array.isArray(task.newChunkIds) ? task.newChunkIds.filter(isText) : [];
    const ctx: TaskCheckContext = {
      seen,
      taughtChunks: new Set([...taughtChunks, ...newChunks]),
      isRole,
    };
    for (const check of [checkFills, checkPassages, checkTalks]) check(task, ctx).forEach(report);
    if (task.kind === 'roleplay') checkRolePlay(task, scene, taughtChunks, report);
    if (Array.isArray(task.newChunkIds)) {
      for (const id of task.newChunkIds) if (typeof id === 'string') taughtChunks.add(id);
    }
  }
  // A fill that names a chunk must be that chunk; this needs the whole unit, and a unit in shape.
  if (problems.length === 0) problems.push(...checkFillChunks(unit));
  return problems;
}

/**
 * A role-play task reviews only: nothing new, and every player line is a chunk taught
 * earlier in the unit. Each player line follows an NPC line (the conversation so far is
 * the learner's only cue), so the scene starts with the NPC, and there are 2+ turns.
 */
function checkRolePlay(
  task: Record<string, unknown>,
  scene: Record<string, unknown>[],
  taughtChunks: Set<string>,
  report: (problem: string) => void,
): void {
  const hasItems = (key: string) => Array.isArray(task[key]) && (task[key] as unknown[]).length > 0;
  if (hasItems('newChunkIds') || hasItems('newWordIds') || task.newPairIds !== undefined) {
    report('is a role-play and must not teach new items');
  }
  // A role-play has no practice round, so these questions would never be asked.
  for (const key of ['cloze', 'signs', 'pictures', 'fills', 'passages', 'talks']) {
    if (task[key] !== undefined) report(`is a role-play and must not have ${key}`);
  }
  if (scene[0]?.speaker !== 'npc') report('role-play must start with an NPC line');
  let turns = 0;
  scene.forEach((line, i) => {
    if (line.speaker !== 'player') return;
    turns += 1;
    if (i > 0 && scene[i - 1]?.speaker !== 'npc') {
      report(`role-play line "${String(line.id)}" must follow an NPC line`);
    }
    if (typeof line.chunkId === 'string' && !taughtChunks.has(line.chunkId)) {
      report(`role-play line "${String(line.id)}" uses chunk "${line.chunkId}" not taught before`);
    }
  });
  if (turns < 2) report('role-play needs at least 2 player lines');
}

/** One word: letters, with an apostrophe or hyphen inside (don't, T-shirt). */
const ONE_WORD = /^[a-z]+(['-][a-z]+)*$/i;

/**
 * 聽力填空: each item blanks one word of a line of this task and offers 2 or 3 wrong words.
 * (tests/smoothness.test.ts checks that the blanked word was taught by then.)
 */
function checkCloze(
  value: unknown,
  scene: Record<string, unknown>[],
  report: (problem: string) => void,
): void {
  const items = list(value);
  if (!items || items.length === 0) {
    report('cloze must be a non-empty list');
    return;
  }
  const seen = new Set<string>();
  for (const item of items) {
    const line = scene.find((l) => l.id === item.lineId);
    const label = `cloze on line "${String(item.lineId)}"`;
    if (!line) {
      report(`${label} is not a line of this task`);
      continue;
    }
    const word = item.word;
    if (!isText(word) || !ONE_WORD.test(word)) {
      report(`${label} needs one word to blank`);
      continue;
    }
    const lineWords = isText(line.en) ? line.en.toLowerCase().split(/[^a-z0-9'-]+/) : [];
    if (!lineWords.includes(word.toLowerCase()))
      report(`${label} blanks "${word}", not in the line`);
    const key = `${String(item.lineId)}/${word.toLowerCase()}`;
    if (seen.has(key)) report(`${label} blanks "${word}" twice`);
    seen.add(key);
    const wrong = textList(item.distractors, 2, 3);
    if (!wrong || !wrong.every((w) => ONE_WORD.test(w)) || wrong.some((w) => sameText(w, word))) {
      report(`${label} needs 2 or 3 different wrong words`);
    }
  }
}

/** Longest sign a learner reads in Act 1 (docs/specs/curriculum.md). */
const SIGN_MAX_WORDS = 15;

/** 讀招牌／價目: a short sign and one question with 2 to 4 answers. */
function checkSigns(value: unknown, seen: Set<string>, report: (problem: string) => void): void {
  const signs = list(value);
  if (!signs || signs.length === 0) {
    report('signs must be a non-empty list');
    return;
  }
  for (const sign of signs) {
    const label = `sign "${String(sign.id)}"`;
    if (typeof sign.id !== 'string' || !ID_PATTERN.test(sign.id)) report(`${label} has a bad id`);
    else if (seen.has(sign.id)) report(`duplicate sign id "${sign.id}"`);
    else seen.add(sign.id);
    if (sign.heading !== undefined && !isText(sign.heading)) report(`${label} has a bad heading`);
    const rows = list(sign.rows);
    const rowsOk =
      rows !== null &&
      rows.length > 0 &&
      rows.every((r) => isText(r.label) && (r.value === undefined || isText(r.value)));
    if (!rowsOk) {
      report(`${label} needs rows, each with a label`);
    } else {
      const text = [sign.heading, ...rows.flatMap((r) => [r.label, r.value])].filter(isText);
      const words = wordCount(text.join(' '));
      if (words > SIGN_MAX_WORDS) report(`${label} has ${words} words (max ${SIGN_MAX_WORDS})`);
    }
    const question = sign.question;
    if (!isObject(question) || !isText(question.en) || !isText(question.zh)) {
      report(`${label} question needs en and zh`);
    }
    const options = textList(sign.options, 2, 4);
    if (!options) report(`${label} needs 2 to 4 different options`);
    else if (!isIndex(sign.answer, options.length)) report(`${label} has a bad answer`);
  }
}

/** 看圖選句: a picture and 2 to 4 different sentences with a translation each. */
function checkPictures(value: unknown, seen: Set<string>, report: (problem: string) => void): void {
  const pictures = list(value);
  if (!pictures || pictures.length === 0) {
    report('pictures must be a non-empty list');
    return;
  }
  for (const picture of pictures) {
    const label = `picture "${String(picture.id)}"`;
    if (typeof picture.id !== 'string' || !ID_PATTERN.test(picture.id)) {
      report(`${label} has a bad id`);
    } else if (seen.has(picture.id)) {
      report(`duplicate picture id "${picture.id}"`);
    } else {
      seen.add(picture.id);
    }
    if (typeof picture.pictureId !== 'string' || !ID_PATTERN.test(picture.pictureId)) {
      report(`${label} has a bad pictureId`);
    }
    const options = list(picture.options);
    const optionsOk =
      options !== null &&
      options.length >= 2 &&
      options.length <= 4 &&
      options.every((o) => isText(o.en) && isText(o.zh)) &&
      allDifferent(options.map((o) => String(o.en)));
    if (!optionsOk) report(`${label} needs 2 to 4 different sentences with en and zh`);
    else if (!isIndex(picture.answer, options.length)) report(`${label} has a bad answer`);
  }
}

const STAGE_ACTS = ['want', 'ask', 'give'];

/** A stage cue: `want` / `give` need an item that is a word of the unit; `ask` has none. */
function checkStage(value: unknown, wordIds: Set<string>, report: (problem: string) => void): void {
  if (!isObject(value)) {
    report('stage must be an object');
    return;
  }
  const { act, item } = value;
  if (typeof act !== 'string' || !STAGE_ACTS.includes(act)) {
    report(`stage has bad act "${String(act)}"`);
    return;
  }
  if (act === 'ask') {
    if (item !== undefined) report('stage "ask" must not have an item');
  } else if (item === undefined) {
    report(`stage "${act}" needs an item`);
  } else if (typeof item !== 'string' || !wordIds.has(item)) {
    report(`stage uses unknown word "${String(item)}"`);
  }
}

/**
 * Minimal pairs are optional. Pair ids are unique; side ids are unique across every side of
 * every pair (their audio id is `${unitId}.pair.${sideId}`); the two sides must sound different.
 * Returns the valid pair ids.
 */
function checkPairs(
  value: unknown,
  problems: string[],
  where: (path: string) => string,
): Set<string> {
  const pairIds = new Set<string>();
  if (value === undefined) return pairIds;
  const pairs = list(value);
  if (!pairs) {
    problems.push(where('pairs must be a list'));
    return pairIds;
  }
  const sideIds = new Set<string>();
  pairs.forEach((pair, i) => {
    const id = pair.id;
    if (typeof id !== 'string' || !ID_PATTERN.test(id)) {
      problems.push(where(`pair[${i}] has bad id "${String(id)}"`));
    } else if (pairIds.has(id)) {
      problems.push(where(`duplicate pair id "${id}"`));
    } else {
      pairIds.add(id);
    }
    if (!isText(pair.focus)) problems.push(where(`pair "${String(id)}" needs focus`));
    const sides = [pair.a, pair.b];
    sides.forEach((side, s) => {
      const label = `pair "${String(id)}" side ${s === 0 ? 'a' : 'b'}`;
      if (!isObject(side)) {
        problems.push(where(`${label} is missing`));
        return;
      }
      if (typeof side.id !== 'string' || !ID_PATTERN.test(side.id)) {
        problems.push(where(`${label} has bad id "${String(side.id)}"`));
      } else if (sideIds.has(side.id)) {
        problems.push(where(`duplicate pair side id "${side.id}"`));
      } else {
        sideIds.add(side.id);
      }
      if (!isText(side.en) || !isText(side.zh)) problems.push(where(`${label} needs en and zh`));
    });
    const [a, b] = sides;
    if (isObject(a) && isObject(b) && isText(a.en) && isText(b.en)) {
      if (a.en.trim().toLowerCase() === b.en.trim().toLowerCase()) {
        problems.push(where(`pair "${String(id)}" has the same word on both sides`));
      }
    }
  });
  return pairIds;
}
