/**
 * Small helpers shared by validateUnit (src/content/validate.ts) and the per-question-type
 * checks in this folder. Content arrives as untyped JSON, so everything takes `unknown`.
 */

/** Ids end up in audio file names and save keys, so keep them plain. */
export const ID_PATTERN = /^[a-z0-9_]+$/;

export const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isText = (value: unknown): value is string =>
  typeof value === 'string' && value !== '';

/** A list of objects (anything else in it becomes an empty object), or null when not a list. */
export function list(value: unknown): Record<string, unknown>[] | null {
  return Array.isArray(value) ? value.map((v) => (isObject(v) ? v : {})) : null;
}

export const sameText = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** True when every text differs from the others, ignoring case. */
export const allDifferent = (texts: string[]) =>
  new Set(texts.map((t) => t.trim().toLowerCase())).size === texts.length;

/** A list of `min` to `max` different non-empty texts, or null. */
export function textList(value: unknown, min: number, max: number): string[] | null {
  if (!Array.isArray(value) || value.length < min || value.length > max) return null;
  const texts = value.filter(isText);
  return texts.length === value.length && allDifferent(texts) ? texts : null;
}

export const isIndex = (value: unknown, length: number): boolean =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < length;

/** Words in a text, split on white space ("$15" counts as one). */
export const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;

/**
 * What a per-type check gets besides the task. One context is shared by every task of a
 * unit, so ids can be kept unique across the unit.
 */
export interface TaskCheckContext {
  /**
   * The ids used so far in the unit for one kind of thing (`fill`, `passage`, `talk`,
   * `talk line`, ...): a check adds the ids it accepts. A check may use any key of its own.
   */
  seen: (kind: string) => Set<string>;
  /** Chunks taught before this task or by it. */
  taughtChunks: ReadonlySet<string>;
  /** True for a role name the game knows (see ROLES in validate.ts). */
  isRole: (value: unknown) => boolean;
}

/**
 * Checks an id: pattern, then unique among `seen` (added when it is new). Returns a
 * problem or undefined.
 */
export function checkId(id: unknown, seen: Set<string>, label: string): string | undefined {
  if (typeof id !== 'string' || !ID_PATTERN.test(id)) return `${label} has a bad id`;
  if (seen.has(id)) return `${label} has a duplicate id`;
  seen.add(id);
  return undefined;
}

/**
 * One multiple-choice question (ChoiceQuestion in types.ts): `en` and `zh`, 2 to 4
 * different options and an answer index. Returns its problems.
 */
export function checkChoiceQuestion(value: unknown, label: string): string[] {
  if (!isObject(value)) return [`${label} must be an object`];
  const problems: string[] = [];
  if (!isText(value.en) || !isText(value.zh)) problems.push(`${label} needs en and zh`);
  const options = textList(value.options, 2, 4);
  if (!options) problems.push(`${label} needs 2 to 4 different options`);
  else if (!isIndex(value.answer, options.length)) problems.push(`${label} has a bad answer`);
  return problems;
}
