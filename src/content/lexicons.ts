import {
  splitLexiconFile,
  type Lexicon,
  type LexiconFile,
  type LineTag,
  type Pattern,
  type PoolSentence,
  type RespondBankItem,
} from './lexicon';

/**
 * The sentence generator's data, loaded like the units: lexicons by location id,
 * patterns, the reviewed sentence pool and the verified 應答題 bank by Act number
 * (1 to 4). Empty files are fine: a location with no entries teaches no sentences.
 */
const lexiconFiles = import.meta.glob<LexiconFile>('../data/lexicon/*.json', {
  eager: true,
  import: 'default',
});
const patternFiles = import.meta.glob<Pattern[]>('../data/patterns/*.json', {
  eager: true,
  import: 'default',
});
const sentenceFiles = import.meta.glob<PoolSentence[]>('../data/sentences/*.json', {
  eager: true,
  import: 'default',
});
const respondFiles = import.meta.glob<RespondBankItem[]>('../data/responds/*.json', {
  eager: true,
  import: 'default',
});

/** `../data/lexicon/cafe.json` gives `cafe`; `../data/patterns/act2.json` gives 2. */
const fileName = (path: string): string => path.slice(path.lastIndexOf('/') + 1, -'.json'.length);
const actNumber = (path: string): number => Number(/^act(\d)$/.exec(fileName(path))?.[1] ?? 0);

function byAct<T>(files: Record<string, T[]>): Record<number, T[]> {
  const result: Record<number, T[]> = {};
  for (const [path, list] of Object.entries(files)) {
    const act = actNumber(path);
    if (act > 0 && Array.isArray(list)) result[act] = list;
  }
  return result;
}

export const LEXICONS: Record<string, Lexicon> = {};
/** Tagged story lines (the `lines` of the lexicon files) by line id, over all locations. */
export const LINE_TAGS: Record<string, LineTag> = {};
for (const [path, file] of Object.entries(lexiconFiles)) {
  const { entries, lines } = splitLexiconFile(file);
  LEXICONS[fileName(path)] = entries;
  Object.assign(LINE_TAGS, lines);
}

export const PATTERNS: Record<number, Pattern[]> = byAct(patternFiles);
export const SENTENCE_POOL: Record<number, PoolSentence[]> = byAct(sentenceFiles);
export const RESPOND_BANK: Record<number, RespondBankItem[]> = byAct(respondFiles);
