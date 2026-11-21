import type { ErrorType } from './grading';

/** Chinese explanations shown to the player, keyed by error type. */
export const ERROR_HINTS: Record<ErrorType, string> = {
  article: '注意冠詞：a / an / the 有沒有放對？',
  plural: '注意單複數：名詞要不要加 s？',
  spelling: '差一點！有個字拼錯了。',
  'word-order': '字都對了，但順序不太對。',
  'missing-word': '少了一個字。',
  'extra-word': '多了一個字。',
  other: '再試一次，聽聽看標準說法。',
};
