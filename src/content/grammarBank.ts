import { grammarPointOf } from './grammar';

/**
 * 文法快練's hand-written questions (docs/specs/sprint.md): `src/data/grammar/*.json`,
 * one file per Act (or per half of one), each `{ act, items }`. An item is a sentence
 * with one `___`, four options, the right one's index, its Chinese and a note on why.
 */
export interface GrammarItem {
  /** Unique across the bank, e.g. `g_be-verb_01`. */
  id: string;
  /** The GRAMMAR_POINTS id it practises. */
  grammarId: string;
  /** The sentence with exactly one `___`. */
  en: string;
  zh: string;
  options: string[];
  /** Index of the right option. */
  answer: number;
  /** Why the right option is right (and the others are not), in Chinese. */
  note: string;
}

export interface GrammarBankFile {
  act: number;
  items: GrammarItem[];
}

const BLANK = '___';

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const filled = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== '';

/**
 * Problems in the bank files (path to parsed JSON), as readable lines; empty when fine.
 * Checks each item's grammarId is known, ids are unique across files, the sentence has
 * exactly one `___`, four different options, an answer in range and a zh and a note.
 */
export function validateGrammarBank(files: Record<string, unknown>): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const [path, file] of Object.entries(files)) {
    if (!isObject(file) || !Array.isArray(file.items)) {
      problems.push(`${path}: not { act, items: [...] }`);
      continue;
    }
    file.items.forEach((raw: unknown, i) => {
      if (!isObject(raw)) {
        problems.push(`${path} #${i}: not an object`);
        return;
      }
      const where = `${path} ${typeof raw.id === 'string' ? raw.id : `#${i}`}`;
      const add = (problem: string) => problems.push(`${where}: ${problem}`);
      if (!filled(raw.id)) add('no id');
      else if (ids.has(raw.id)) add('id not unique');
      else ids.add(raw.id);
      if (typeof raw.grammarId !== 'string' || !grammarPointOf(raw.grammarId)) {
        add(`unknown grammarId ${String(raw.grammarId)}`);
      }
      if (typeof raw.en !== 'string' || raw.en.split(BLANK).length !== 2) {
        add(`en needs exactly one ${BLANK}`);
      }
      const options = Array.isArray(raw.options) ? raw.options : [];
      if (options.length !== 4 || !options.every(filled)) add('needs exactly 4 options');
      else if (new Set(options.map((o) => o.trim().toLowerCase())).size !== 4) {
        add('options repeat');
      }
      if (
        typeof raw.answer !== 'number' ||
        !Number.isInteger(raw.answer) ||
        raw.answer < 0 ||
        raw.answer >= options.length
      ) {
        add('answer out of range');
      }
      if (!filled(raw.zh)) add('empty zh');
      if (!filled(raw.note)) add('empty note');
    });
  }
  return problems;
}

const files = import.meta.glob<GrammarBankFile>('../data/grammar/*.json', {
  eager: true,
  import: 'default',
});

/** The raw files, by path (for the validator in tests). */
export const GRAMMAR_BANK_FILES: Record<string, unknown> = files;

/** Every item by grammarId, in file order. */
export const GRAMMAR_BANK: Record<string, GrammarItem[]> = {};
for (const file of Object.values(files)) {
  for (const item of file.items ?? []) (GRAMMAR_BANK[item.grammarId] ??= []).push(item);
}
