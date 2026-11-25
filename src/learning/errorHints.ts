import { t } from '../core/i18n';
import type { ErrorType } from './grading';

/** Explanations shown to the player, keyed by error type (getters: read in the current 介面語言). */
export const ERROR_HINTS: Record<ErrorType, string> = {
  get article() {
    return t('注意冠詞：a / an / the 有沒有放對？', 'Check the article: is a / an / the right?');
  },
  get plural() {
    return t('注意單複數：名詞要不要加 s？', 'Singular or plural: does the noun need an s?');
  },
  get spelling() {
    return t('差一點！有個字拼錯了。', 'So close! One word is misspelled.');
  },
  get 'word-order'() {
    return t('字都對了，但順序不太對。', 'The words are right, but the order is off.');
  },
  get 'missing-word'() {
    return t('少了一個字。', 'A word is missing.');
  },
  get 'extra-word'() {
    return t('多了一個字。', 'There is an extra word.');
  },
  get other() {
    return t('再試一次，聽聽看標準說法。', 'Try again, and listen to the model answer.');
  },
};
