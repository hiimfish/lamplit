/**
 * Checks a unit loaded from JSON before the game trusts it. Returns a list of
 * human-readable problems; an empty list means the unit is safe to use.
 */

/** Ids end up in audio file names and save keys, so keep them plain. */
const ID_PATTERN = /^[a-z0-9_]+$/;

const ROLES = ['barista', 'landlord', 'guide'];
const SPEAKERS = ['npc', 'player'];

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isText = (value: unknown): value is string => typeof value === 'string' && value !== '';

function list(value: unknown): Record<string, unknown>[] | null {
  return Array.isArray(value) ? value.map((v) => (isObject(v) ? v : {})) : null;
}

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
  for (const task of tasks ?? []) {
    const taskId = String(task.id);
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

    const scene = list(task.scene);
    if (!scene) {
      problems.push(where(`task "${taskId}" scene must be a list`));
      continue;
    }
    ids(scene, 'line', lineIds);
    for (const line of scene) {
      const lineId = String(line.id);
      if (typeof line.role !== 'string' || !ROLES.includes(line.role)) {
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
  }
  return problems;
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
