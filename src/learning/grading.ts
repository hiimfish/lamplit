/**
 * Checking typed or arranged answers, and working out what kind of mistake was made
 * so the feedback can be specific. Only compares against a list of accepted answers;
 * it does not try to judge free-form English.
 */

export type ErrorType =
  'article' | 'plural' | 'spelling' | 'word-order' | 'missing-word' | 'extra-word' | 'other';

export interface GradeResult {
  correct: boolean;
  /** The accepted answer the player's text matched, or came closest to. */
  closest: string;
  /** Present only when the answer is wrong. */
  error?: ErrorType;
}

/**
 * Strip accents (café -> cafe), lowercase, straighten quotes, drop punctuation (keeping
 * apostrophes inside words), squash spaces.
 */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[\u2018\u2019\u02bc]/g, "'")
    .replace(/[^a-z0-9'\s]/g, ' ')
    .replace(/(^|\s)'+|'+(?=\s|$)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function words(text: string): string[] {
  const normalized = normalize(text);
  return normalized === '' ? [] : normalized.split(' ');
}

export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const deletion = (previous[j] ?? 0) + 1;
      const insertion = (current[j - 1] ?? 0) + 1;
      const substitution = (previous[j - 1] ?? 0) + cost;
      current[j] = Math.min(deletion, insertion, substitution);
    }
    previous = current;
  }
  return previous[b.length] ?? 0;
}

const ARTICLES = new Set(['a', 'an', 'the']);

function sameWordsAnyOrder(a: string[], b: string[]): boolean {
  return a.length === b.length && [...a].sort().join(' ') === [...b].sort().join(' ');
}

function isPluralPair(a: string, b: string): boolean {
  return a === `${b}s` || b === `${a}s` || a === `${b}es` || b === `${a}es`;
}

/** Describes how `answer` differs from one specific accepted sentence. */
function diagnose(answer: string[], target: string[]): ErrorType {
  if (sameWordsAnyOrder(answer, target)) return 'word-order';

  const withoutArticles = (list: string[]) => list.filter((w) => !ARTICLES.has(w)).join(' ');
  if (withoutArticles(answer) === withoutArticles(target)) return 'article';

  if (answer.length === target.length) {
    const differing = answer
      .map((w, i) => [w, target[i] ?? ''] as const)
      .filter(([w, t]) => w !== t);
    const [only] = differing;
    if (differing.length === 1 && only) {
      const [w, t] = only;
      if (isPluralPair(w, t)) return 'plural';
      if (editDistance(w, t) <= 2 && w.length >= 3) return 'spelling';
    }
    return 'other';
  }
  return answer.length < target.length ? 'missing-word' : 'extra-word';
}

/** Grades an answer against every accepted answer; the nearest one explains a mistake. */
export function gradeAnswer(answer: string, accepted: readonly string[]): GradeResult {
  const normalizedAnswer = normalize(answer);

  for (const candidate of accepted) {
    if (normalizedAnswer !== '' && normalize(candidate) === normalizedAnswer) {
      return { correct: true, closest: candidate };
    }
  }

  let best: { candidate: string; distance: number } | null = null;
  for (const candidate of accepted) {
    const distance = editDistance(normalizedAnswer, normalize(candidate));
    if (!best || distance < best.distance) best = { candidate, distance };
  }
  const closest = best?.candidate ?? accepted[0] ?? '';
  if (normalizedAnswer === '') return { correct: false, closest, error: 'missing-word' };
  return { correct: false, closest, error: diagnose(words(answer), words(closest)) };
}
