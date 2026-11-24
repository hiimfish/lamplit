import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GRAMMAR_POINTS } from '../src/content/grammar';
import { getUnit } from '../src/content/units';
import {
  missingLexiconWords,
  validateLexicon,
  validatePatterns,
  validatePool,
} from '../src/content/validateLexicon';

/**
 * Real data files of the sentence generator.
 *   LEXICON_FILE=<unitId>  only that location's lexicon
 *   LEXICON_ALLOW_EMPTY=1  a lexicon that is not filled yet is fine (a file of exactly `{}` always is)
 *   LEXICON_STRICT=1       every word of the unit needs an entry or a `skip`; no empty files
 */
const DATA = join(__dirname, '..', 'src', 'data');
const only = process.env.LEXICON_FILE;
const allowEmpty = process.env.LEXICON_ALLOW_EMPTY === '1';
const strict = process.env.LEXICON_STRICT === '1';

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8'));
const jsonFiles = (dir: string): string[] =>
  existsSync(join(DATA, dir))
    ? readdirSync(join(DATA, dir))
        .filter((f) => f.endsWith('.json'))
        .sort()
    : [];

const lexiconFiles = jsonFiles('lexicon').filter((f) => !only || f === `${only}.json`);

describe('lexicon files', () => {
  it('finds files (or the filter matches none on purpose)', () => {
    if (only) expect(lexiconFiles).toHaveLength(1);
    else expect(lexiconFiles.length).toBeGreaterThan(0);
  });

  it.each(lexiconFiles)('%s is valid', (name) => {
    const file = readJson(join(DATA, 'lexicon', name));
    const unit = getUnit(name.slice(0, -'.json'.length));
    expect(unit, `${name} has no unit`).toBeDefined();
    if (!unit) return;
    expect(validateLexicon(file, unit)).toEqual([]);
    const empty = typeof file === 'object' && file !== null && Object.keys(file).length === 0;
    if (strict) {
      expect(missingLexiconWords(file, unit), 'words with no entry or skip').toEqual([]);
    } else if (empty) {
      // Exactly `{}`: not filled yet, tolerated.
    } else if (!allowEmpty) {
      // A started file must be complete.
      expect(missingLexiconWords(file, unit), 'words with no entry or skip').toEqual([]);
    }
  });

  it('has a file for every unit', () => {
    if (only) return;
    const names = new Set(lexiconFiles.map((f) => f.slice(0, -'.json'.length)));
    const unitFiles = jsonFiles('units').map((f) => f.slice(0, -'.json'.length));
    expect([...names].sort()).toEqual(unitFiles.sort());
  });
});

const actFiles = (dir: string): { name: string; act: number }[] =>
  jsonFiles(dir)
    .map((name) => ({ name, act: Number(/^act(\d)\.json$/.exec(name)?.[1] ?? 0) }))
    .filter((f) => f.act > 0);

describe('pattern files', () => {
  const grammarIds = new Set(GRAMMAR_POINTS.map((g) => g.id));

  it.each(actFiles('patterns'))('$name is valid', ({ name, act }) => {
    const file = readJson(join(DATA, 'patterns', name));
    expect(validatePatterns(file, act, grammarIds)).toEqual([]);
    if (strict) expect((file as unknown[]).length).toBeGreaterThan(0);
  });
});

describe.each(['sentences', 'responds'] as const)('%s pool files', (kind) => {
  it.each(actFiles(kind))('$name is valid', ({ name }) => {
    const file = readJson(join(DATA, kind, name));
    expect(validatePool(file, kind)).toEqual([]);
    if (strict) expect((file as unknown[]).length).toBeGreaterThan(0);
  });
});
