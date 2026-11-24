/**
 * 最常錯的音和文法 (docs/specs/ui-flow.md): every answer is tagged and counted per
 * day in `save.mistakes`. Tags: `p:<pairId>` (a sound pair), `k:<question kind>`,
 * `e:<error type>` and `g:<grammar point id>`. Pure.
 *
 * Imports only types (and the pure date helpers) so it never reaches `import.meta.glob`.
 */
import { dateKey, MISTAKE_TAG, MISTAKE_TAGS_PER_DAY, shiftDay } from '../core/save';
import type { MistakeCount, MistakeDay, SaveData } from '../core/save';
import type { ErrorType } from './grading';
import type { AnswerResult, Question } from './questions';

/**
 * The dashboard blocks. Where a tag shows:
 * - `p:` -> 'sound' (聽不清楚的音)
 * - `k:listen-*`, `k:cloze`, `k:talk`, `k:respond`, `k:picture-listen` -> 'listening' (聽力題型)
 * - `e:*` (except `e:other`), `k:arrange`, `k:spell`, `k:choose-reply`, `k:fill-grammar`,
 *   `k:text-fill` -> 'writing' (文法和拼字)
 * - `g:` -> 'grammar' (文法點)
 * Everything else (`e:other`, `k:fill`, `k:read-sign`...) is stored but not shown.
 */
export type MistakeBlock = 'sound' | 'writing' | 'listening' | 'grammar';

export interface MistakeRow {
  tag: string;
  missed: number;
  asked: number;
}

/** Display names of the tags shown (zh-TW); `p:` and `g:` names come from the UI (labelOf). */
export const MISTAKE_LABELS: Record<string, string> = {
  'e:article': '冠詞 a／an／the',
  'e:plural': '單複數',
  'e:word-order': '字的順序',
  'e:spelling': '拼字',
  'e:missing-word': '少了字',
  'e:extra-word': '多了字',
  'k:listen-pair': '聽音選字',
  'k:listen-pick': '聽音選字',
  'k:cloze': '聽力填空',
  'k:talk': '聽對話答題',
  'k:respond': '應答題',
  'k:picture-listen': '看圖選句（聽）',
  'k:fill-grammar': '文法填空',
  'k:text-fill': '段落填空',
  'k:arrange': '排句子',
  'k:spell': '打字拼單字',
  'k:choose-reply': '選回答',
};

/** The label of a tag: the table above, else `lookup` (for `p:` and `g:`), else undefined. */
export function labelOf(
  tag: string,
  lookup?: (tag: string) => string | undefined,
): string | undefined {
  return MISTAKE_LABELS[tag] ?? lookup?.(tag);
}

const ERROR_TYPES: readonly string[] = [
  'article',
  'plural',
  'spelling',
  'word-order',
  'missing-word',
  'extra-word',
  'other',
] satisfies ErrorType[];

const ERROR_KINDS: readonly string[] = ['arrange', 'spell', 'choose-reply'];

/** An id made safe for a tag body (lowercase, `[a-z0-9_-]`, at most 48 characters). */
function cleanId(id: string): string {
  return id
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function tagOf(prefix: string, id: string): string | undefined {
  const tag = `${prefix}:${cleanId(id)}`;
  return MISTAKE_TAG.test(tag) ? tag : undefined;
}

function kindTag(question: Question): string | undefined {
  switch (question.kind) {
    case 'picture':
      return question.listen ? 'k:picture-listen' : 'k:picture';
    case 'fill':
      if (question.grammarIds && question.grammarIds.length > 0) return undefined;
      return question.grammar ? 'k:fill-grammar' : 'k:fill';
    default:
      return tagOf('k', question.kind);
  }
}

/** The tags one answer counts under; every tag is asked, a wrong answer also counts missed. */
export function mistakeTags(question: Question, result: AnswerResult): string[] {
  if (question.kind === 'speak') return [];
  const tags: string[] = [];
  const add = (tag: string | undefined) => {
    if (tag && !tags.includes(tag)) tags.push(tag);
  };
  if (question.kind === 'listen-pair') {
    add(tagOf('p', question.itemId.replace(/^pair:/, '')));
  }
  add(kindTag(question));
  if ('grammarIds' in question && Array.isArray(question.grammarIds)) {
    for (const id of question.grammarIds) add(tagOf('g', String(id)));
  }
  if (
    !result.correct &&
    ERROR_KINDS.includes(question.kind) &&
    result.error !== undefined &&
    ERROR_TYPES.includes(result.error)
  ) {
    add(tagOf('e', result.error));
  }
  return tags;
}

/** Drops the entries with the fewest misses until the day fits, never one in `keep`. */
function capDay(day: MistakeDay, keep: ReadonlySet<string>): MistakeDay {
  const out = { ...day };
  while (Object.keys(out).length > MISTAKE_TAGS_PER_DAY) {
    const victims = Object.entries(out)
      .filter(([tag]) => !keep.has(tag))
      .sort((a, b) => a[1][0] - b[1][0] || a[1][1] - b[1][1] || (a[0] < b[0] ? -1 : 1));
    const first = victims[0];
    if (!first) break;
    delete out[first[0]];
  }
  return out;
}

/** The save with this answer counted in today's tags. */
export function logAnswer(
  save: SaveData,
  question: Question,
  result: AnswerResult,
  now: Date,
): SaveData {
  const tags = mistakeTags(question, result);
  if (tags.length === 0) return save;
  const today = dateKey(now);
  const day: MistakeDay = { ...(save.mistakes[today] ?? {}) };
  for (const tag of tags) {
    const [missed, asked] = day[tag] ?? [0, 0];
    day[tag] = [missed + (result.correct ? 0 : 1), asked + 1];
  }
  return { ...save, mistakes: { ...save.mistakes, [today]: capDay(day, new Set(tags)) } };
}

/** Counts per tag over the last `days` days up to `now`. */
export function mistakeTotals(
  save: SaveData,
  now: Date,
  days: number,
): Record<string, MistakeCount> {
  const totals: Record<string, MistakeCount> = {};
  const today = dateKey(now);
  for (let i = 0; i < days; i++) {
    const day = save.mistakes[shiftDay(today, -i)];
    if (!day) continue;
    for (const [tag, [missed, asked]] of Object.entries(day)) {
      const sum = totals[tag] ?? [0, 0];
      totals[tag] = [sum[0] + missed, sum[1] + asked];
    }
  }
  return totals;
}

const LISTENING_KINDS = ['cloze', 'talk', 'respond', 'picture-listen'];
const WRITING_KINDS = ['arrange', 'spell', 'choose-reply', 'fill-grammar', 'text-fill'];

/** The block a tag shows in; undefined for tags that are stored but not shown. */
export function blockOf(tag: string): MistakeBlock | undefined {
  if (tag.startsWith('p:')) return 'sound';
  if (tag.startsWith('g:')) return 'grammar';
  if (tag.startsWith('e:')) return tag === 'e:other' ? undefined : 'writing';
  if (!tag.startsWith('k:')) return undefined;
  const kind = tag.slice(2);
  if (kind.startsWith('listen-') || LISTENING_KINDS.includes(kind)) return 'listening';
  if (WRITING_KINDS.includes(kind)) return 'writing';
  return undefined;
}

/** The most-missed rows of a block over the last `days` days, at most `limit`. */
export function topMistakes(
  save: SaveData,
  now: Date,
  days: number,
  block: MistakeBlock,
  limit = 5,
): MistakeRow[] {
  const rows: MistakeRow[] = [];
  for (const [tag, [missed, asked]] of Object.entries(mistakeTotals(save, now, days))) {
    if (missed >= 1 && blockOf(tag) === block) rows.push({ tag, missed, asked });
  }
  rows.sort(
    (a, b) =>
      b.missed - a.missed ||
      b.missed / Math.max(b.asked, 1) - a.missed / Math.max(a.asked, 1) ||
      (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0),
  );
  return rows.slice(0, Math.max(0, limit));
}
