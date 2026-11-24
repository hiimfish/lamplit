import { describe, expect, it } from 'vitest';
import type { Lexicon, Pattern } from '../src/content/lexicon';
import type { Unit } from '../src/content/types';
import {
  missingLexiconWords,
  patternWordProblems,
  validateLexicon,
  validatePatterns,
  validatePool,
} from '../src/content/validateLexicon';

const unit = {
  id: 'office',
  words: [{ id: 'report' }, { id: 'send' }, { id: 'water' }, { id: 'good_morning' }, { id: 'big' }],
  tasks: [{ id: 't1', scene: [{ id: 'l1' }, { id: 'l2' }, { id: 'l3' }] }],
} as unknown as Unit;

const noun = { pos: 'n', cls: 'document', forms: { pl: 'reports' } };
const verb = {
  pos: 'v',
  forms: { s3: 'sends', past: 'sent', pp: 'sent', ing: 'sending' },
  frames: [{ subj: ['person'], obj: ['document'], prep: { word: 'to', cls: ['person'] } }],
};

type Edit = (file: Record<string, unknown>) => void;

const GOOD: [string, Record<string, unknown>][] = [
  ['empty file', {}],
  ['noun, verb, skip', { report: noun, send: verb, good_morning: { pos: 'other', skip: true } }],
  ['uncountable noun without pl', { water: { pos: 'n', cls: 'drink', countable: false } }],
  ['adjective with nothing else', { big: { pos: 'adj' } }],
  ['noun with an', { report: { ...noun, an: true } }],
  ['plural-only noun', { report: { ...noun, pluralOnly: true } }],
  [
    'tagged lines',
    {
      lines: {
        l1: { side: 'question', qtype: 'where' },
        l2: { side: 'answer', atype: 'place' },
        l3: { side: 'answer', atype: 'universal' },
      },
    },
  ],
];

const BAD: [string, Record<string, unknown>, RegExp][] = [
  ['word not in the unit', { nope: noun }, /not a word of office/],
  ['pluralOnly false', { report: { ...noun, pluralOnly: false } }, /pluralOnly must be true/],
  ['pluralOnly on a verb', { send: { ...verb, pluralOnly: true } }, /pluralOnly is for nouns/],
  [
    'pluralOnly without pl',
    { report: { pos: 'n', cls: 'document', pluralOnly: true, countable: false } },
    /needs forms\.pl/,
  ],
  ['bad pos', { big: { pos: 'x' } }, /bad pos/],
  ['class outside the list', { report: { ...noun, cls: 'thing' } }, /outside LEX_CLASSES/],
  ['noun without cls', { report: { pos: 'n', forms: { pl: 'reports' } } }, /needs cls/],
  ['noun without plural', { report: { pos: 'n', cls: 'document' } }, /needs forms\.pl/],
  ['verb missing a form', { send: { ...verb, forms: { s3: 'sends' } } }, /needs forms\.past/],
  ['verb without frames', { send: { ...verb, frames: [] } }, /at least one frame/],
  [
    'frame class outside the list',
    { send: { ...verb, frames: [{ subj: ['cat'] }] } },
    /LEX_CLASSES/,
  ],
  ['frame without subj', { send: { ...verb, frames: [{}] } }, /subj/],
  [
    'prep word with capital',
    { send: { ...verb, frames: [{ subj: ['person'], prep: { word: 'To', cls: ['place'] } }] } },
    /lowercase word/,
  ],
  [
    'prep class outside the list',
    { send: { ...verb, frames: [{ subj: ['person'], prep: { word: 'to', cls: ['x'] } }] } },
    /LEX_CLASSES/,
  ],
  ['skip with another field', { big: { pos: 'adj', skip: true, cls: 'quality' } }, /other fields/],
  ['unknown entry key', { big: { pos: 'adj', colour: 'red' } }, /unknown key "colour"/],
  [
    'unknown form key',
    { report: { ...noun, forms: { pl: 'reports', x: 'y' } } },
    /unknown key "x"/,
  ],
  ['entry not an object', { big: 'adj' }, /not an object/],
  [
    'line that is not in the scene',
    { lines: { zz: { side: 'answer', atype: 'place' } } },
    /not a scene line/,
  ],
  ['universal as qtype', { lines: { l1: { side: 'question', qtype: 'universal' } } }, /bad qtype/],
  ['bad atype', { lines: { l1: { side: 'answer', atype: 'nowhere' } } }, /bad atype/],
  ['question without qtype', { lines: { l1: { side: 'question' } } }, /needs qtype/],
  ['answer without atype', { lines: { l1: { side: 'answer' } } }, /needs atype/],
  ['bad side', { lines: { l1: { side: 'both' } } }, /bad side/],
  ['unknown tag key', { lines: { l1: { side: 'answer', atype: 'place', x: 1 } } }, /unknown key/],
];

describe('validateLexicon', () => {
  it.each(GOOD)('accepts %s', (_name, file) => {
    expect(validateLexicon(file, unit)).toEqual([]);
  });

  it.each(BAD)('rejects %s', (_name, file, pattern) => {
    const problems = validateLexicon(file, unit);
    expect(problems.length).toBeGreaterThan(0);
    expect(problems.join('\n')).toMatch(pattern);
  });

  it.each([null, undefined, [], 'x', 3])('rejects a file that is %j', (file) => {
    expect(validateLexicon(file, unit)).not.toEqual([]);
  });

  it('rejects "lines" that is not an object', () => {
    expect(validateLexicon({ lines: [] }, unit)).not.toEqual([]);
  });

  it('lists the words with no entry for strict mode', () => {
    expect(missingLexiconWords({ report: noun }, unit)).toEqual([
      'send',
      'water',
      'good_morning',
      'big',
    ]);
    expect(missingLexiconWords({}, unit)).toHaveLength(5);
    expect(missingLexiconWords(null, unit)).toHaveLength(5);
  });
});

const grammar = new Set(['present-simple', 'past-simple']);
const pattern = {
  id: 'p1',
  grammarId: 'past-simple',
  shape: 'svo-time',
  tense: 'past',
  cues: ['yesterday', 'last week'],
  blanks: ['verb-form'],
};

describe('validatePatterns', () => {
  const edit = (change: Edit): unknown[] => {
    const copy = JSON.parse(JSON.stringify(pattern)) as Record<string, unknown>;
    change(copy);
    return [copy];
  };

  it('accepts an empty list and a good pattern', () => {
    expect(validatePatterns([], 1, grammar)).toEqual([]);
    expect(validatePatterns([pattern], 1, grammar)).toEqual([]);
    expect(
      validatePatterns(
        edit((p) => delete p.cues),
        1,
        grammar,
      ),
    ).toEqual([]);
  });

  it.each<[string, Edit]>([
    ['unknown grammarId', (p) => (p.grammarId = 'nope')],
    ['bad shape', (p) => (p.shape = 'sov')],
    ['no tense', (p) => (p.tense = '')],
    ['capital cue', (p) => (p.cues = ['Yesterday'])],
    ['cue that is not a string', (p) => (p.cues = [3])],
    ['cues not a list', (p) => (p.cues = 'yesterday')],
    ['bad blank', (p) => (p.blanks = ['tense'])],
    ['no blanks', (p) => (p.blanks = [])],
    ['bad id', (p) => (p.id = 'P-1')],
    ['unknown key', (p) => (p.extra = 1)],
    ['empty verbs list', (p) => (p.verbs = [])],
    ['verbs not a list', (p) => (p.verbs = 'send')],
    ['capital word id', (p) => (p.subjects = ['Manager'])],
    ['repeated word id', (p) => (p.objects = ['report', 'report'])],
    ['non-string word id', (p) => (p.pobjects = [3])],
    ['bad pronoun', (p) => (p.pronoun = ['me'])],
    ['empty pronoun list', (p) => (p.pronoun = [])],
    ['repeated pronoun', (p) => (p.pronoun = ['i', 'i'])],
  ])('rejects %s', (_name, change) => {
    expect(validatePatterns(edit(change), 1, grammar)).not.toEqual([]);
  });

  it('accepts the word lists and the pronoun list', () => {
    const fields = {
      verbs: ['send', 'open'],
      subjects: ['manager'],
      objects: ['report'],
      pobjects: ['office'],
      adjectives: ['big'],
      preps: ['to', 'on'],
      pronoun: ['i', 'you', 'we', 'they', 'he', 'she', 'it'],
    };
    expect(validatePatterns([{ ...pattern, ...fields }], 1, grammar)).toEqual([]);
  });

  it('rejects duplicate ids and non-lists', () => {
    expect(validatePatterns([pattern, pattern], 1, grammar).join()).toMatch(/duplicate/);
    expect(validatePatterns({}, 1, grammar)).not.toEqual([]);
    expect(validatePatterns([null], 1, grammar)).not.toEqual([]);
  });
});

const statement = {
  id: 's1',
  kind: 'statement',
  en: 'I sent the report yesterday.',
  grammarId: 'past-simple',
  blankWord: 'sent',
};
const qa = {
  id: 'q1',
  kind: 'qa',
  en: 'Where did you send the report?',
  grammarId: 'past-simple',
  responses: ['To the head office.', 'Yesterday morning.', 'The manager.'],
  answer: 0,
};

describe('validatePool sentences', () => {
  const edit = (base: object, change: Edit): unknown[] => {
    const copy = JSON.parse(JSON.stringify(base)) as Record<string, unknown>;
    change(copy);
    return [copy];
  };

  it('accepts statements and qa', () => {
    expect(validatePool([], 'sentences')).toEqual([]);
    expect(validatePool([statement, qa], 'sentences')).toEqual([]);
  });

  it.each<[string, object, Edit]>([
    ['blankWord not in the sentence', statement, (s) => (s.blankWord = 'gave')],
    ['statement with responses', statement, (s) => (s.responses = ['a', 'b'])],
    ['bad kind', statement, (s) => (s.kind = 'riddle')],
    ['empty en', statement, (s) => (s.en = ' ')],
    ['qa without responses', qa, (s) => delete s.responses],
    ['qa with one response', qa, (s) => (s.responses = ['Only.'])],
    ['qa without answer', qa, (s) => delete s.answer],
    ['answer out of range', qa, (s) => (s.answer = 3)],
    ['answer not an integer', qa, (s) => (s.answer = 0.5)],
    ['duplicate responses', qa, (s) => (s.responses = ['Yes.', 'yes.', 'No.'])],
    ['qa with blankWord', qa, (s) => (s.blankWord = 'send')],
    ['bad id', qa, (s) => (s.id = 'Q 1')],
  ])('rejects %s', (_name, base, change) => {
    expect(validatePool(edit(base, change), 'sentences')).not.toEqual([]);
  });

  it('rejects duplicate ids and non-lists', () => {
    expect(validatePool([statement, statement], 'sentences').join()).toMatch(/duplicate/);
    expect(validatePool(null, 'sentences')).not.toEqual([]);
    expect(validatePool(['x'], 'sentences')).not.toEqual([]);
  });
});

const respond = {
  id: 'r1',
  question: { en: 'Where is the report?', qtype: 'where', role: 'manager' },
  answer: { en: 'On your desk.', atype: 'place' },
  wrong: [
    { en: 'At three o’clock.', atype: 'time' },
    { en: 'It costs ten dollars.', atype: 'price' },
  ],
  verified: 2,
};

describe('validatePool responds', () => {
  const edit = (change: Edit): unknown[] => {
    const copy = JSON.parse(JSON.stringify(respond)) as Record<string, unknown>;
    change(copy);
    return [copy];
  };
  const wrongList = (p: Record<string, unknown>) => p.wrong as Record<string, unknown>[];

  it('accepts a good item', () => {
    expect(validatePool([respond], 'responds')).toEqual([]);
    expect(validatePool([], 'responds')).toEqual([]);
  });

  it.each<[string, Edit]>([
    ['verified 1', (p) => (p.verified = 1)],
    ['verified missing', (p) => delete p.verified],
    ['wrong option that fits the question', (p) => (wrongList(p)[0]!.atype = 'place')],
    ['wrong option that is a statement', (p) => (wrongList(p)[0]!.atype = 'statement')],
    ['universal wrong option', (p) => (wrongList(p)[0]!.atype = 'universal')],
    ['universal answer', (p) => ((p.answer as Record<string, unknown>).atype = 'universal')],
    ['answer that does not fit', (p) => ((p.answer as Record<string, unknown>).atype = 'time')],
    ['only one wrong option', (p) => (p.wrong = wrongList(p).slice(0, 1))],
    ['duplicate responses', (p) => (wrongList(p)[1]!.en = 'on your desk')],
    ['bad qtype', (p) => ((p.question as Record<string, unknown>).qtype = 'universal')],
    ['bad wrong atype', (p) => (wrongList(p)[0]!.atype = 'moon')],
    ['no question text', (p) => ((p.question as Record<string, unknown>).en = '')],
    ['no answer', (p) => delete p.answer],
  ])('rejects %s', (_name, change) => {
    expect(validatePool(edit(change), 'responds')).not.toEqual([]);
  });

  it('rejects duplicate ids', () => {
    expect(validatePool([respond, respond], 'responds').join()).toMatch(/duplicate/);
  });
});

describe('validateLexicon: a preposition taught in a chunk', () => {
  const streetUnit = {
    id: 'street',
    words: [{ id: 'bank' }],
    chunks: [
      { id: 'c1', en: "It's next to the bank." },
      { id: 'c2', en: 'Go straight.' },
    ],
    tasks: [{ id: 't1', scene: [{ id: 'l1', en: 'The park is in front of the school.' }] }],
  } as unknown as Unit;
  const prep = { pos: 'prep', frames: [{ subj: ['object'], obj: ['place'] }] };

  it('accepts a prep entry whose phrase is in a chunk or a story line', () => {
    expect(validateLexicon({ next_to: prep }, streetUnit)).toEqual([]);
    expect(validateLexicon({ in_front_of: prep }, streetUnit)).toEqual([]);
  });

  it('still rejects a prep phrase the unit never says', () => {
    expect(validateLexicon({ behind: prep }, streetUnit).join()).toMatch(/not a word of street/);
  });

  it('only prepositions may leave the word list', () => {
    const noun = { pos: 'n', cls: 'place', forms: { pl: 'banks' } };
    expect(validateLexicon({ next_to: noun }, streetUnit).join()).toMatch(/not a word of street/);
  });
});

describe('patternWordProblems', () => {
  const union: Lexicon = {
    send: { pos: 'v' },
    report: { pos: 'n' },
    on: { pos: 'prep' },
    old: { pos: 'adj', skip: true },
  };
  const base: Pattern = { id: 'p', grammarId: 'g', shape: 'svo', tense: 'past', blanks: [] };

  it('reports ids that are not in the lexicon, or are skipped', () => {
    const problems = patternWordProblems(
      [
        { ...base, verbs: ['send', 'fly'], objects: ['report', 'cake'], adjectives: ['old'] },
        { ...base, id: 'q', subjects: ['report'], preps: ['on', 'to'] },
      ],
      union,
    );
    expect(problems).toHaveLength(3);
    expect(problems.join('\n')).toMatch(/verbs names "fly"/);
    expect(problems.join('\n')).toMatch(/objects names "cake"/);
    expect(problems.join('\n')).toMatch(/adjectives names "old"/);
  });

  it('reports nothing for no patterns or no lists', () => {
    expect(patternWordProblems([], union)).toEqual([]);
    expect(patternWordProblems([base], union)).toEqual([]);
  });
});
