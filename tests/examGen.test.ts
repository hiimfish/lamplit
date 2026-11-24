import { describe, expect, it } from 'vitest';
import { EXAM_PLAN, type ExamId } from '../src/content/exam';
import {
  COMPATIBLE,
  type AnswerType,
  type Lexicon,
  type LineTag,
  type Pattern,
  type PoolSentence,
  type RespondBankItem,
} from '../src/content/lexicon';
import type { SceneLine, Unit } from '../src/content/types';
import { questionTexts, tokenize } from '../src/content/vocab';
import {
  buildRespondBank,
  GENERATED_KINDS,
  generateForSection,
  generateForSectionDetailed,
  generatedShortfall,
  lineTagKey,
  type ExamGenData,
  type GenerateInput,
} from '../src/learning/examGen';
import type {
  ChooseReplyQuestion,
  ClozeQuestion,
  FillQuestion,
  Question,
  RespondQuestion,
  SignQuestion,
} from '../src/learning/questions';
import type { Qa } from '../src/learning/sentenceGen';

/* ---------- small fake data: nothing here is the real content ---------- */

const CONCRETE = [
  'coffee',
  'tea',
  'milk',
  'sugar',
  'bread',
  'apple',
  'orange',
  'table',
  'chair',
  'window',
  'ticket',
  'pencil',
  'basket',
  'blanket',
  'bottle',
  'carpet',
];
const ABSTRACT = ['please', 'sorry', 'welcome', 'always'];

const word = (en: string, abstract = false) => ({
  id: en,
  en,
  zh: `${en}的意思`,
  emoji: '?',
  ...(abstract ? { abstract: true } : {}),
});

const line = (id: string, en: string, speaker: 'npc' | 'player', chunkId?: string): SceneLine => ({
  id,
  role: speaker === 'npc' ? 'clerk' : 'guide',
  speaker,
  en,
  zh: `${en}（中）`,
  ...(chunkId ? { chunkId } : {}),
});

/** Eight story lines, each with two taught words, plus a line with the price words. */
const storyLines: SceneLine[] = [
  line('s1', 'I want coffee and bread please.', 'player'),
  line('s2', 'The tea is on the table.', 'npc'),
  line('s3', 'Sorry, the window is open.', 'npc'),
  line('s4', 'I need a pencil and a ticket.', 'player'),
  line('s5', 'She likes apple and orange.', 'npc'),
  line('s6', 'Put the bottle on the carpet.', 'npc'),
  line('s7', 'Welcome to the basket shop.', 'npc'),
  line('s8', 'Milk and sugar for you.', 'npc'),
  line('s9', 'Which one costs the most? Which one costs the least? How much is the tea?', 'npc'),
  line('s10', 'The blanket is on the chair.', 'npc'),
];

const chunk = (id: string, en: string, distractors?: { text: string; error: string }[]) => ({
  id,
  en,
  zh: en,
  ...(distractors ? { distractors } : {}),
});

const chunks = [
  chunk('c1', 'I would like some tea.', [
    { text: 'I would like some tea', error: 'punctuation' },
    { text: 'I like would some tea.', error: 'word-order' },
    { text: 'I would like some teas.', error: 'plural' },
    { text: 'I would liking some tea.', error: 'verb-form' },
  ]),
  chunk('c2', 'Can I have a ticket?', [
    { text: 'Can I has a ticket?', error: 'verb-form' },
    { text: 'Can have I a ticket?', error: 'word-order' },
    { text: 'Can I have ticket?', error: 'missing-word' },
  ]),
  chunk('c3', 'Two coffees, please.', [
    { text: 'Two coffee, please.', error: 'plural' },
    { text: 'Two coffees please', error: 'punctuation' },
  ]),
  chunk('c4', 'Here you are.', [{ text: 'Here you is.', error: 'verb-form' }]),
  chunk('c5', 'Thank you very much.', [
    { text: 'Thank very much you.', error: 'word-order' },
    { text: 'Thank you much very.', error: 'word-order' },
    { text: 'Thanks you very much.', error: 'word-form' },
  ]),
  chunk('c6', 'Where is the bank?', [
    { text: 'Where the bank is?', error: 'word-order' },
    { text: 'Where is bank?', error: 'missing-word' },
  ]),
  chunk('c7', 'How are you today?', [
    { text: 'How you are today?', error: 'word-order' },
    { text: 'How is you today?', error: 'verb-form' },
  ]),
];

const replyScene: SceneLine[] = chunks.flatMap((c, i) => [
  line(`n${i}`, `Customer ${i} speaks to the clerk.`, 'npc'),
  line(`p${i}`, c.en, 'player', c.id),
]);

const makeUnit = (id: string, scene: SceneLine[], extra: Partial<Unit> = {}): Unit =>
  ({
    id,
    title: id,
    titleEn: id,
    words: [...CONCRETE, ...ABSTRACT].map((w) => word(w, ABSTRACT.includes(w))),
    chunks,
    pairs: [],
    tasks: [{ id: 't1', title: 't1', newChunkIds: [], newWordIds: [], scene }],
    ...extra,
  }) as unknown as Unit;

const unit1 = makeUnit('u1', [...storyLines, ...replyScene]);
const emptyData = (): ExamGenData => ({
  lineTags: {},
  sentencePool: [],
  respondBank: [],
  lexicons: {},
  patterns: [],
  exclude: { respond: [], cloze: [] },
});

const input = (
  exam: ExamId,
  sectionId: string,
  data: Partial<ExamGenData> = {},
  over: Partial<GenerateInput> = {},
): GenerateInput => ({
  exam,
  sectionId,
  seed: 11,
  units: [unit1],
  data: { ...emptyData(), ...data },
  ...over,
});

const TOPICS = [
  'bank',
  'post',
  'shop',
  'park',
  'bus',
  'cafe',
  'gym',
  'hotel',
  'clinic',
  'office',
  'school',
  'market',
];
const WRONG_PAIRS: { en: string; atype: AnswerType }[] = [
  { en: 'At nine o clock.', atype: 'time' },
  { en: 'Ms Lee did it.', atype: 'person' },
  { en: 'It costs ten dollars.', atype: 'price' },
  { en: 'Because it is late.', atype: 'reason' },
];

/** A verified bank item asking where something is: every wrong reply is of another type. */
const bankItem = (n: number): RespondBankItem => ({
  id: `a1_r${String(n).padStart(2, '0')}`,
  question: {
    en: `Where is the ${TOPICS[n % TOPICS.length]} ${n}?`,
    qtype: 'where',
    role: 'clerk',
  },
  answer: { en: `It is next to the ${TOPICS[(n + 1) % TOPICS.length]} ${n}.`, atype: 'place' },
  wrong: [0, 1, 2].map((k) => {
    const w = WRONG_PAIRS[(n + k) % WRONG_PAIRS.length] as { en: string; atype: AnswerType };
    return { en: `${w.en} ${n}`, atype: w.atype };
  }),
  verified: 2,
});

const bank = (count: number): RespondBankItem[] =>
  Array.from({ length: count }, (_, i) => bankItem(i + 1));

const poolStatements = (count: number): PoolSentence[] =>
  Array.from({ length: count }, (_, i) => {
    const [a, b] = [CONCRETE[i % CONCRETE.length], CONCRETE[(i + 5) % CONCRETE.length]];
    return {
      id: `p${i + 1}`,
      kind: 'statement' as const,
      en: `The ${a} and the ${b} are ready ${i}.`,
      grammarId: 'g',
      blankWord: a as string,
    };
  });

const poolQa = (count: number): PoolSentence[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `q${i + 1}`,
    kind: 'qa' as const,
    en: `Where did you put the ${CONCRETE[i % CONCRETE.length]} ${i}?`,
    grammarId: 'g',
    responses: [`On the table ${i}.`, `Yesterday morning ${i}.`, `The manager ${i}.`, `Two ${i}.`],
    answer: 0,
  }));

const lexicon: Lexicon = {
  manager: { pos: 'n', cls: 'role', forms: { pl: 'managers' } },
  customer: { pos: 'n', cls: 'person', forms: { pl: 'customers' } },
  report: { pos: 'n', cls: 'document', forms: { pl: 'reports' } },
  file: { pos: 'n', cls: 'document', forms: { pl: 'files' } },
  office: { pos: 'n', cls: 'place', forms: { pl: 'offices' } },
  bank: { pos: 'n', cls: 'place', forms: { pl: 'banks' } },
  room: { pos: 'n', cls: 'room', forms: { pl: 'rooms' } },
  table: { pos: 'n', cls: 'object', forms: { pl: 'tables' } },
  apple: { pos: 'n', cls: 'food', forms: { pl: 'apples' } },
  send: {
    pos: 'v',
    forms: { s3: 'sends', past: 'sent', pp: 'sent', ing: 'sending' },
    frames: [
      {
        subj: ['person', 'role'],
        obj: ['document'],
        prep: { word: 'to', cls: ['place', 'person', 'role'] },
      },
    ],
  },
  write: {
    pos: 'v',
    forms: { s3: 'writes', past: 'wrote', pp: 'written', ing: 'writing' },
    frames: [{ subj: ['person', 'role'], obj: ['document'] }],
  },
};

const fillPatterns: Pattern[] = [
  {
    id: 'p-past',
    grammarId: 'past-simple',
    shape: 'svo',
    tense: 'past',
    cues: ['yesterday'],
    blanks: ['verb-form', 'article'],
  },
  {
    id: 'p-prep',
    grammarId: 'prepositions',
    shape: 'svo-prep',
    tense: 'present',
    cues: ['every day'],
    blanks: ['verb-form', 'object'],
  },
  {
    id: 'p-sense',
    grammarId: 'word-sense',
    shape: 'svo',
    tense: 'present',
    cues: ['every day'],
    blanks: ['object', 'subject'],
  },
];

const fillData = (): Partial<ExamGenData> => ({
  lexicons: { u1: lexicon },
  patterns: fillPatterns,
  grammarNoteOf: (id) => `note of ${id}`,
});

const of = <K extends Question['kind']>(questions: Question[], kind: K) =>
  questions.filter((q): q is Extract<Question, { kind: K }> => q.kind === kind);

/* ---------- tests ---------- */

describe('with no data', () => {
  it('returns nothing and reports every kind as missing, without throwing', () => {
    for (const exam of ['exam1', 'exam2', 'exam3', 'exam4'] as const) {
      for (const section of EXAM_PLAN[exam].sections) {
        const empty = input(exam, section.id, {}, { units: [] });
        expect(generateForSection(empty)).toEqual([]);
        const wanted = GENERATED_KINDS.map((kind) => [kind, section.generated[kind] ?? 0]).filter(
          ([, n]) => (n as number) > 0,
        );
        expect(generatedShortfall(empty).map((s) => [s.kind, s.wanted, s.got])).toEqual(
          wanted.map(([kind, n]) => [kind, n, 0]),
        );
      }
    }
  });

  it('knows nothing of an unknown section', () => {
    expect(generateForSectionDetailed(input('exam1', 's9'))).toEqual({
      questions: [],
      shortfall: [],
    });
  });

  it('makes a section with no generated kinds empty (exam3 s2)', () => {
    expect(generateForSection(input('exam3', 's2', { respondBank: bank(20) }))).toEqual([]);
  });
});

describe('counts, order and determinism', () => {
  const data = { respondBank: bank(14), sentencePool: [...poolStatements(8), ...poolQa(4)] };

  it('builds exactly the planned count of each kind, in the fixed order', () => {
    const { questions, shortfall } = generateForSectionDetailed(input('exam1', 's1', data));
    expect(shortfall).toEqual([]);
    expect(questions.map((q) => q.kind)).toEqual([
      ...Array<string>(10).fill('respond'),
      ...Array<string>(6).fill('cloze'),
    ]);
  });

  it('gives the same questions for the same seed and other ones for another seed', () => {
    const a = generateForSection(input('exam1', 's1', data, { seed: 5 }));
    const b = generateForSection(input('exam1', 's1', data, { seed: 5 }));
    const c = generateForSection(input('exam1', 's1', data, { seed: 6 }));
    expect(b).toEqual(a);
    expect(c).not.toEqual(a);
  });

  it('numbers the respond questions of a section', () => {
    const qs = of(generateForSection(input('exam1', 's1', data)), 'respond');
    expect(qs.map((q) => q.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(new Set(qs.map((q) => q.total))).toEqual(new Set([10]));
  });

  it('never repeats a prompt or a line in one section', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const qs = generateForSection(input('exam1', 's1', data, { seed }));
      const prompts = of(qs, 'respond').map((q) => q.prompt.en);
      expect(new Set(prompts).size).toBe(prompts.length);
      const lines = of(qs, 'cloze').map((q) => q.audioId);
      expect(new Set(lines).size).toBe(lines.length);
    }
  });
});

describe('応答 (respond) questions', () => {
  const data = { respondBank: bank(14) };
  const byId = new Map(bank(14).map((b) => [b.id, b]));

  it('has three distinct replies, the right one among them and remapped after shuffling', () => {
    for (let seed = 1; seed <= 15; seed++) {
      for (const q of of(generateForSection(input('exam1', 's1', data, { seed })), 'respond')) {
        expect(q.options).toHaveLength(3);
        expect(new Set(q.options.map((o) => o.en.toLowerCase())).size).toBe(3);
        const right = q.options.find((o) => o.id === q.correctId);
        const item = byId.get(q.respondId) as RespondBankItem;
        expect(right?.en).toBe(item.answer.en);
        expect(q.options.filter((o) => o.id === q.correctId)).toHaveLength(1);
      }
    }
  });

  it('shuffles the options by seed (the right one is not always first)', () => {
    const places = new Set<number>();
    for (let seed = 1; seed <= 30; seed++) {
      for (const q of of(generateForSection(input('exam1', 's1', data, { seed })), 'respond')) {
        places.add(q.options.findIndex((o) => o.id === q.correctId));
      }
    }
    expect(places).toEqual(new Set([0, 1, 2]));
  });

  it('names the audio like scripts/gen-audio.mjs does (bank<N>.respond / bank<N>.response)', () => {
    const q = of(generateForSection(input('exam1', 's1', data)), 'respond')[0] as RespondQuestion;
    expect(q.prompt.audioId).toBe(`bank1.respond.${q.respondId}`);
    const right = q.options.find((o) => o.id === q.correctId);
    expect(right?.audioId).toBe(`bank1.response.${q.respondId}_0`);
    for (const o of q.options) {
      expect(o.audioId).toBe(`bank1.response.${q.respondId}_${o.id.slice(1)}`);
    }
    const act2 = of(
      generateForSection(input('exam2', 's1', data)),
      'respond',
    )[0] as RespondQuestion;
    expect(act2.prompt.audioId.startsWith('bank2.respond.')).toBe(true);
  });

  it('never offers a wrong reply that the question type accepts, nor a universal one', () => {
    for (let seed = 1; seed <= 25; seed++) {
      for (const q of of(generateForSection(input('exam1', 's1', data, { seed })), 'respond')) {
        const item = byId.get(q.respondId) as RespondBankItem;
        for (const o of q.options.filter((x) => x.id !== q.correctId)) {
          const type = item.wrong.find((w) => w.en === o.en)?.atype as AnswerType;
          expect(type).not.toBe('universal');
          expect(COMPATIBLE[item.question.qtype]).not.toContain(type);
        }
      }
    }
  });

  it('skips items that break a rule instead of throwing', () => {
    const good = bankItem(1);
    const broken: RespondBankItem[] = [
      { ...bankItem(2), verified: 1 },
      {
        ...bankItem(3),
        wrong: [{ en: 'At nine.', atype: 'place' }, ...bankItem(3).wrong.slice(1)],
      },
      {
        ...bankItem(4),
        wrong: [{ en: 'Sure.', atype: 'universal' }, ...bankItem(4).wrong.slice(1)],
      },
      { ...bankItem(5), answer: { en: 'Sure.', atype: 'universal' } },
      { ...bankItem(6), wrong: bankItem(6).wrong.slice(0, 1) },
      { ...bankItem(7), wrong: [bankItem(7).wrong[0], bankItem(7).wrong[0]] as never },
      { ...bankItem(8), question: undefined } as unknown as RespondBankItem,
      { ...bankItem(9), wrong: undefined } as unknown as RespondBankItem,
    ];
    const qs = of(
      generateForSection(input('exam1', 's1', { respondBank: [...broken, good] })),
      'respond',
    );
    expect(qs.map((q) => q.respondId)).toEqual([good.id]);
  });

  it('honours the exclude list and reports the shortfall', () => {
    const skip = bank(14)
      .slice(0, 5)
      .map((b) => b.id);
    const result = generateForSectionDetailed(
      input('exam1', 's1', { ...data, exclude: { respond: skip, cloze: [] } }),
    );
    const ids = of(result.questions, 'respond').map((q) => q.respondId);
    expect(ids).toHaveLength(9);
    for (const id of skip) expect(ids).not.toContain(id);
    expect(result.shortfall).toContainEqual({ kind: 'respond', wanted: 10, got: 9 });
  });

  it('uses the sentence pool question and answer pairs after the bank, with pool ids', () => {
    const qs = of(
      generateForSection(input('exam1', 's1', { respondBank: bank(8), sentencePool: poolQa(5) })),
      'respond',
    );
    expect(qs).toHaveLength(10);
    const fromPool = qs.filter((q) => q.prompt.audioId.startsWith('pool1.respond.'));
    expect(fromPool).toHaveLength(2);
    for (const q of fromPool) {
      expect(q.prompt.role).toBe('announcer');
      expect(q.options).toHaveLength(3);
      const right = q.options.find((o) => o.id === q.correctId);
      expect(right?.audioId).toBe(`pool1.response.${q.respondId}_0`);
      expect(right?.en).toMatch(/^On the table/);
    }
  });

  it('keeps the original reply index in the id when a pool pair has more than three replies', () => {
    const ids = new Set<string>();
    for (let seed = 1; seed <= 20; seed++) {
      for (const q of of(
        generateForSection(input('exam1', 's1', { sentencePool: poolQa(10) }, { seed })),
        'respond',
      )) {
        for (const o of q.options) ids.add(o.id);
      }
    }
    expect(ids).toEqual(new Set(['o0', 'o1', 'o2', 'o3']));
  });
});

describe('聽力填空 (listen cloze)', () => {
  it('blanks one taught word of a story line and keeps the line clip', () => {
    const qs = of(generateForSection(input('exam1', 's1', {})), 'cloze');
    expect(qs).toHaveLength(6);
    const lines = new Map(unit1.tasks.flatMap((t) => t.scene).map((l) => [l.id, l]));
    for (const q of qs) {
      expect(q.audioId).toMatch(/^u1\.line\./);
      const source = lines.get(q.audioId.replace('u1.line.', '')) as SceneLine;
      expect(q.before + q.answer + q.after).toBe(source.en);
      expect(q.zh).toBe(source.zh);
      expect(q.itemId).toBe('');
    }
  });

  it('offers four different taught words, none of them in the line or a form of the answer', () => {
    const taught = new Set([...CONCRETE, ...ABSTRACT]);
    for (let seed = 1; seed <= 30; seed++) {
      for (const q of of(generateForSection(input('exam1', 's1', {}, { seed })), 'cloze')) {
        const labels = q.options.map((o) => o.label);
        expect(new Set(labels.map((l) => l.toLowerCase())).size).toBe(4);
        const right = q.options.find((o) => o.id === q.correctId);
        expect(right?.label).toBe(q.answer);
        const inLine = new Set(tokenize(q.before + q.answer + q.after).map((t) => t.word));
        for (const o of q.options.filter((x) => x.id !== q.correctId)) {
          expect(taught.has(o.label.toLowerCase())).toBe(true);
          expect(inLine.has(o.label.toLowerCase())).toBe(false);
        }
        expect(taught.has(q.answer.toLowerCase())).toBe(true);
      }
    }
  });

  it('prefers distractors with the same abstract flag and a similar length', () => {
    const withAbstract = (en: string) => ({ ...word(en, true) });
    const unit = makeUnit('u2', [line('x1', 'Please sit here.', 'npc')], {
      words: [
        ...['please', 'sorry', 'welcome', 'always', 'never', 'maybe'].map(withAbstract),
        ...['coffee', 'tea', 'table', 'chair', 'window'].map((w) => word(w)),
        word('sit', true),
        word('here', true),
      ],
    });
    for (let seed = 1; seed <= 20; seed++) {
      const qs = of(
        generateForSection(input('exam1', 's1', {}, { units: [unit], seed })),
        'cloze',
      ) as ClozeQuestion[];
      for (const q of qs) {
        const abstractWords = [
          'please',
          'sorry',
          'welcome',
          'always',
          'never',
          'maybe',
          'sit',
          'here',
        ];
        expect(abstractWords).toContain(q.answer.toLowerCase());
        const wrong = q.options
          .filter((o) => o.id !== q.correctId)
          .map((o) => o.label.toLowerCase());
        for (const w of wrong) expect(abstractWords).toContain(w);
      }
    }
  });

  it('keeps wrong words of the same part of speech and not the same meaning class', () => {
    const unit = makeUnit('u3', [line('y1', 'Give me the report now.', 'npc')], {
      words: ['report', 'file', 'office', 'send', 'write', 'bank', 'manager'].map((w) => word(w)),
    });
    const lex: Lexicon = {
      report: { pos: 'n', cls: 'document' },
      file: { pos: 'n', cls: 'document' },
      office: { pos: 'n', cls: 'place' },
      bank: { pos: 'n', cls: 'place' },
      manager: { pos: 'n', cls: 'role' },
      send: { pos: 'v' },
      write: { pos: 'v' },
    };
    for (let seed = 1; seed <= 20; seed++) {
      const qs = of(
        generateForSection(
          input('exam1', 's1', { lexicons: { u3: lex } }, { units: [unit], seed }),
        ),
        'cloze',
      );
      for (const q of qs) {
        if (q.answer !== 'report') continue;
        const wrong = q.options.filter((o) => o.id !== q.correctId).map((o) => o.label);
        expect(wrong).not.toContain('file');
        expect(wrong).not.toContain('send');
        expect(wrong).not.toContain('write');
      }
    }
  });

  it('never gives a form of the answer as a wrong word', () => {
    const unit = makeUnit('u4', [line('z1', 'I like tea today.', 'npc')], {
      words: ['tea', 'teas', 'teacher', 'coffee', 'milk', 'bread', 'sugar', 'like', 'liked'].map(
        (w) => word(w),
      ),
    });
    for (let seed = 1; seed <= 20; seed++) {
      for (const q of of(
        generateForSection(input('exam1', 's1', {}, { units: [unit], seed })),
        'cloze',
      )) {
        const wrong = q.options.filter((o) => o.id !== q.correctId).map((o) => o.label);
        if (q.answer.toLowerCase() === 'tea') {
          expect(wrong).not.toContain('teas');
          expect(wrong).not.toContain('teacher');
        }
        if (q.answer.toLowerCase() === 'like') expect(wrong).not.toContain('liked');
      }
    }
  });

  it('takes half from the sentence pool when there is one, with the pool clip', () => {
    const qs = of(
      generateForSection(input('exam1', 's1', { sentencePool: poolStatements(10) })),
      'cloze',
    );
    expect(qs).toHaveLength(6);
    const fromPool = qs.filter((q) => q.audioId.startsWith('pool1.respond.'));
    expect(fromPool).toHaveLength(3);
    for (const q of fromPool) {
      expect(q.before + q.answer + q.after).toMatch(/^The \w+ and the \w+ are ready \d+\.$/);
    }
  });

  it('honours the cloze exclude list for story lines (by line id or clip id) and pool ids', () => {
    const everyLine = unit1.tasks.flatMap((t) => t.scene.map((l) => l.id));
    const keep = ['s1', 's2', 's3'];
    const skip = everyLine.filter((id) => !keep.includes(id));
    const result = generateForSectionDetailed(
      input('exam1', 's1', { exclude: { respond: [], cloze: skip.map((id) => `u1.line.${id}`) } }),
    );
    const qs = of(result.questions, 'cloze');
    expect(qs.length).toBeLessThanOrEqual(3);
    for (const q of qs) expect(keep.map((id) => `u1.line.${id}`)).toContain(q.audioId);
    expect(result.shortfall).toContainEqual({ kind: 'listenCloze', wanted: 6, got: qs.length });
    const pool = poolStatements(6);
    const noPool = of(
      generateForSection(
        input('exam1', 's1', {
          sentencePool: pool,
          exclude: { respond: [], cloze: [...skip, ...pool.map((p) => p.id)] },
        }),
      ),
      'cloze',
    );
    expect(noPool.every((q) => !q.audioId.startsWith('pool1'))).toBe(true);
  });

  it('skips story lines that are tagged as universal answers', () => {
    const tags: Record<string, LineTag> = {};
    for (const l of storyLines)
      tags[lineTagKey('u1', l.id)] = { side: 'answer', atype: 'universal' };
    const qs = of(generateForSection(input('exam1', 's1', { lineTags: tags })), 'cloze');
    const clips = qs.map((q) => q.audioId);
    for (const l of storyLines) expect(clips).not.toContain(`u1.line.${l.id}`);
  });

  it('gives line clips of the current Act first when it knows the Acts', () => {
    const earlier = makeUnit('old', [line('o1', 'Coffee is hot today.', 'npc')]);
    const qs = of(
      generateForSection(
        input(
          'exam2',
          's1',
          {},
          { units: [earlier, unit1], actOf: (id) => (id === 'old' ? 1 : 2) },
        ),
      ),
      'cloze',
    );
    expect(qs.length).toBeGreaterThan(0);
    expect(qs[0]?.audioId.startsWith('old.')).toBe(false);
  });
});

describe('文法選句 (grammar pick)', () => {
  const picks = (seed: number, exam: ExamId = 'exam1') =>
    of(
      generateForSection(input(exam, exam === 'exam1' ? 's2' : 's3', {}, { seed })),
      'choose-reply',
    );

  it('asks which sentence is right: one chunk, wrong versions, the NPC line before it', () => {
    const qs = picks(3);
    expect(qs).toHaveLength(6);
    for (const q of qs as ChooseReplyQuestion[]) {
      const c = chunks.find((x) => x.id === q.correctId);
      expect(c).toBeDefined();
      expect(q.options.find((o) => o.id === q.correctId)?.text).toBe(c?.en);
      expect(q.options.length).toBeGreaterThanOrEqual(3);
      expect(q.options.length).toBeLessThanOrEqual(4);
      expect(new Set(q.options.map((o) => o.text)).size).toBe(q.options.length);
      for (const o of q.options.filter((x) => x.id !== q.correctId)) {
        expect(o.error).toBeTruthy();
        expect(c?.distractors?.some((d) => d.text === o.text && d.error === o.error)).toBe(true);
      }
      expect(q.npcAudioId).toMatch(/^u1\.line\.n\d$/);
      expect(q.itemId).toBe('');
    }
  });

  it('uses each chunk at most once and shows different error types first', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const qs = picks(seed);
      expect(new Set(qs.map((q) => q.correctId)).size).toBe(qs.length);
      for (const q of qs) {
        const errors = q.options.filter((o) => o.id !== q.correctId).map((o) => o.error);
        const distinctPossible = new Set(
          chunks.find((c) => c.id === q.correctId)?.distractors?.map((d) => d.error),
        ).size;
        expect(new Set(errors).size).toBe(Math.min(errors.length, distinctPossible));
      }
    }
  });

  it('skips chunks with fewer than two wrong versions', () => {
    for (let seed = 1; seed <= 20; seed++) {
      expect(picks(seed).map((q) => q.correctId)).not.toContain('c4');
    }
  });
});

describe('價目表 (price list)', () => {
  const lists = (seed: number, units = [unit1]) =>
    of(
      generateForSection(input('exam1', 's2', {}, { seed, units })),
      'read-sign',
    ) as SignQuestion[];

  const prices = (q: SignQuestion) => q.rows.map((r) => Number((r.value ?? '').slice(1)));

  it('builds six lists with four items, different prices and one right option', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const qs = lists(seed);
      expect(qs).toHaveLength(6);
      for (const q of qs) {
        expect(q.rows).toHaveLength(4);
        expect(new Set(prices(q)).size).toBe(4);
        expect(new Set(q.rows.map((r) => r.label)).size).toBe(4);
        expect(new Set(q.options.map((o) => o.label)).size).toBe(q.options.length);
        expect(q.options.filter((o) => o.id === q.correctId)).toHaveLength(1);
        expect(q.itemId).toBe('');
      }
    }
  });

  it('answers the question the text asks', () => {
    for (let seed = 1; seed <= 20; seed++) {
      for (const q of lists(seed)) {
        const right = q.options.find((o) => o.id === q.correctId)?.label as string;
        const rowOf = (label: string) => q.rows.find((r) => r.label === label);
        const all = prices(q);
        if (q.en === 'Which one costs the most?') {
          expect(rowOf(right)?.value).toBe(`$${Math.max(...all)}`);
        } else if (q.en === 'Which one costs the least?') {
          expect(rowOf(right)?.value).toBe(`$${Math.min(...all)}`);
        } else if (/^Which one is \$\d+\?$/.test(q.en)) {
          expect(`Which one is ${rowOf(right)?.value}?`).toBe(q.en);
        } else {
          const item = /^How much is the (\w+)\?$/.exec(q.en)?.[1] as string;
          expect(q.rows.find((r) => r.label.toLowerCase() === item)?.value).toBe(right);
        }
      }
    }
  });

  it('uses only concrete nouns, never abstract words', () => {
    for (let seed = 1; seed <= 20; seed++) {
      for (const q of lists(seed)) {
        for (const r of q.rows) expect(CONCRETE).toContain(r.label.toLowerCase());
      }
    }
  });

  it('writes question texts from taught words only, switching templates when one is not taught', () => {
    const narrow = makeUnit('u5', [line('w1', 'Which one is the tea? How much is it?', 'npc')]);
    const taught = new Set([
      ...[...CONCRETE, ...ABSTRACT],
      ...tokenize('Which one is the tea? How much is it?').map((t) => t.word),
    ]);
    for (let seed = 1; seed <= 20; seed++) {
      const qs = lists(seed, [narrow]);
      expect(qs.length).toBeGreaterThan(0);
      for (const q of qs) {
        expect(q.en).not.toMatch(/costs|most|least/);
        const texts = questionTexts({
          id: 't',
          title: 't',
          newChunkIds: [],
          newWordIds: [],
          scene: [],
          signs: [
            {
              id: 's',
              rows: q.rows,
              question: { en: q.en, zh: q.zh },
              options: q.options.map((o) => o.label),
              answer: 0,
            },
          ],
        });
        for (const t of texts) {
          for (const tok of tokenize(t.en)) expect(taught.has(tok.word)).toBe(true);
        }
      }
    }
  });

  it('is short when nothing can be asked: too few concrete nouns, or no question word taught', () => {
    const few = makeUnit('u6', [line('v1', 'Which one costs the most?', 'npc')], {
      words: ['tea', 'milk', 'bread'].map((w) => word(w)),
    });
    expect(lists(1, [few])).toHaveLength(0);
    const none = makeUnit('u7', [line('v2', 'Hello there.', 'npc')], {
      chunks: [],
    });
    expect(lists(1, [none])).toHaveLength(0);
    const result = generateForSectionDetailed(input('exam1', 's2', {}, { units: [few] }));
    expect(result.shortfall.find((s) => s.kind === 'priceList')).toEqual({
      kind: 'priceList',
      wanted: 6,
      got: 0,
    });
  });

  it('leaves out nouns of a class nobody buys (place, time, number) when the lexicon says so', () => {
    const lex: Lexicon = Object.fromEntries(
      CONCRETE.slice(0, 11).map((w) => [w, { pos: 'n' as const, cls: 'place' as const }]),
    );
    const qs = of(generateForSection(input('exam1', 's2', { lexicons: { u1: lex } })), 'read-sign');
    expect(qs.length).toBeGreaterThan(0);
    for (const q of qs) {
      for (const r of q.rows) expect(CONCRETE.slice(11)).toContain(r.label.toLowerCase());
    }
  });

  it('respects the lexicon: a word it calls a verb is no item', () => {
    const lex: Lexicon = Object.fromEntries(
      CONCRETE.slice(0, 13).map((w) => [w, { pos: 'v' as const }]),
    );
    const qs = of(generateForSection(input('exam1', 's2', { lexicons: { u1: lex } })), 'read-sign');
    for (const q of qs)
      for (const r of q.rows) expect(CONCRETE.slice(13)).toContain(r.label.toLowerCase());
  });
});

describe('sentence fills', () => {
  it('builds the planned sentenceFill questions (exam2 s2)', () => {
    const { questions, shortfall } = generateForSectionDetailed(input('exam2', 's2', fillData()));
    const fills = of(questions, 'fill');
    expect(shortfall.filter((s) => s.kind === 'sentenceFill')).toEqual([]);
    expect(fills).toHaveLength(4);
    expect(questions.slice(0, 4).every((q) => q.kind === 'choose-reply')).toBe(true);
    for (const q of fills as FillQuestion[]) {
      expect(q.options).toHaveLength(4);
      expect(q.options.filter((o) => o.id === q.correctId)).toHaveLength(1);
      expect(q.options.find((o) => o.id === q.correctId)?.label).toBe(q.answer);
      expect(new Set(q.options.map((o) => o.label.toLowerCase())).size).toBe(4);
      expect(q.grammarIds).toBeTruthy();
      expect(q.note).toBe(`note of ${q.grammarIds?.[0]}`);
      expect(q.itemId).toBe('');
      expect(q.grammar).toBeUndefined();
    }
  });

  it('builds grammarFill questions of grammar blanks (exam3 s3) and flags verb-form blanks', () => {
    const { questions, shortfall } = generateForSectionDetailed(input('exam3', 's3', fillData()));
    expect(shortfall.filter((s) => s.kind === 'grammarFill')).toEqual([]);
    const fills = of(questions, 'fill');
    expect(fills).toHaveLength(6);
    for (const q of fills) {
      expect(q.options.filter((o) => o.id === q.correctId)).toHaveLength(1);
      expect(new Set(q.options.map((o) => o.label.toLowerCase())).size).toBe(q.options.length);
    }
    expect(fills.some((q) => q.grammar === true)).toBe(true);
  });

  it('only uses patterns of the right blank kind', () => {
    const onlySense = fillPatterns.filter((p) => p.id === 'p-sense');
    const grammar = generateForSectionDetailed(
      input('exam3', 's3', { ...fillData(), patterns: onlySense }),
    );
    expect(of(grammar.questions, 'fill')).toHaveLength(0);
    expect(grammar.shortfall.find((s) => s.kind === 'grammarFill')?.got).toBe(0);
    const onlyGrammar = fillPatterns.filter((p) => p.id === 'p-past');
    const sense = generateForSectionDetailed(
      input('exam2', 's2', { ...fillData(), patterns: onlyGrammar }),
    );
    expect(sense.shortfall.find((s) => s.kind === 'sentenceFill')?.got).toBe(0);
  });

  it('makes no two fills of one sentence, and the same ones for a seed', () => {
    for (let seed = 1; seed <= 15; seed++) {
      const a = of(generateForSection(input('exam3', 's3', fillData(), { seed })), 'fill');
      const texts = a.map((q) => q.before + q.answer + q.after);
      expect(new Set(texts).size).toBe(texts.length);
      expect(of(generateForSection(input('exam3', 's3', fillData(), { seed })), 'fill')).toEqual(a);
    }
  });

  it('uses only the lexicon of the given units and skips `skip` entries', () => {
    const none = generateForSectionDetailed(
      input('exam3', 's3', { ...fillData(), lexicons: { elsewhere: lexicon } }),
    );
    expect(of(none.questions, 'fill')).toHaveLength(0);
    const skipped: Lexicon = Object.fromEntries(
      Object.keys(lexicon).map((k) => [k, { pos: 'n' as const, skip: true as const }]),
    );
    const gone = generateForSection(
      input('exam3', 's3', { ...fillData(), lexicons: { u1: skipped } }),
    );
    expect(of(gone, 'fill')).toHaveLength(0);
  });

  it('does not throw on patterns the engine does not know', () => {
    const odd = {
      id: 'x',
      grammarId: 'g',
      shape: 'nonsense',
      tense: 'present',
      blanks: ['article'],
    };
    expect(() =>
      generateForSection(
        input('exam3', 's3', { ...fillData(), patterns: [odd as unknown as Pattern] }),
      ),
    ).not.toThrow();
  });
});

describe('questions only use what the section may use', () => {
  it('lets no question of exam1 s2 hold an untaught word', () => {
    const taught = new Set([
      ...[...CONCRETE, ...ABSTRACT],
      ...unit1.tasks.flatMap((t) => t.scene.flatMap((l) => tokenize(l.en).map((x) => x.word))),
      ...chunks.flatMap((c) => tokenize(c.en).map((x) => x.word)),
      ...chunks.flatMap(
        (c) => c.distractors?.flatMap((d) => tokenize(d.text).map((x) => x.word)) ?? [],
      ),
    ]);
    for (let seed = 1; seed <= 10; seed++) {
      for (const q of generateForSection(input('exam1', 's2', {}, { seed }))) {
        const texts: string[] =
          q.kind === 'read-sign'
            ? [q.en, ...q.options.map((o) => o.label), ...q.rows.map((r) => r.label)]
            : q.kind === 'choose-reply'
              ? q.options.map((o) => o.text)
              : [];
        for (const text of texts) {
          for (const tok of tokenize(text)) expect(taught.has(tok.word)).toBe(true);
        }
      }
    }
  });
});

describe('shortfall', () => {
  it('reports what is missing per kind and still returns what exists', () => {
    const result = generateForSectionDetailed(input('exam1', 's1', { respondBank: bank(4) }));
    expect(of(result.questions, 'respond')).toHaveLength(4);
    expect(of(result.questions, 'cloze')).toHaveLength(6);
    expect(result.shortfall).toEqual([{ kind: 'respond', wanted: 10, got: 4 }]);
    expect(generatedShortfall(input('exam1', 's1', { respondBank: bank(4) }))).toEqual(
      result.shortfall,
    );
  });

  it('is empty for a section that is complete', () => {
    expect(generatedShortfall(input('exam1', 's1', { respondBank: bank(10) }))).toEqual([]);
  });
});

describe('buildRespondBank', () => {
  const tagged = (qtype: LineTag['qtype'], atype: AnswerType): [LineTag, LineTag] => [
    { side: 'question', qtype },
    { side: 'answer', atype },
  ];
  const scenes: { q: string; a: string; qtype: LineTag['qtype']; atype: AnswerType }[] = [
    { q: 'Where is the bank?', a: 'It is on Main Street.', qtype: 'where', atype: 'place' },
    { q: 'When does it open?', a: 'At nine o clock.', qtype: 'when', atype: 'time' },
    { q: 'Who is your manager?', a: 'Ms Lee is my manager.', qtype: 'who', atype: 'person' },
    { q: 'How much is it?', a: 'It is five dollars.', qtype: 'how-much', atype: 'price' },
    { q: 'Why are you late?', a: 'Because the bus was late.', qtype: 'why', atype: 'reason' },
  ];
  const lineTags: Record<string, LineTag> = {};
  const units: Unit[] = scenes.map((s, i) => {
    const [qt, at] = tagged(s.qtype, s.atype);
    lineTags[lineTagKey(`b${i}`, 'q')] = qt;
    lineTags[lineTagKey(`b${i}`, 'filler')] = { side: 'answer', atype: 'universal' };
    lineTags[lineTagKey(`b${i}`, 'a')] = at;
    return makeUnit(`b${i}`, [
      line('q', s.q, 'npc'),
      line('filler', 'Sure.', 'player'),
      line('a', s.a, 'player'),
    ]);
  });

  it('pairs a tagged question with the answer after it and picks wrong replies of other types', () => {
    const items = buildRespondBank(1, units, {}, lineTags, 3);
    expect(items).toHaveLength(5);
    for (const item of items) {
      const scene = scenes.find((s) => s.q === item.question.en);
      expect(scene).toBeDefined();
      expect(item.answer.en).toBe(scene?.a);
      expect(item.wrong).toHaveLength(2);
      for (const w of item.wrong) {
        expect(w.atype).not.toBe('universal');
        expect(COMPATIBLE[item.question.qtype]).not.toContain(w.atype);
        expect(w.en).not.toBe(item.answer.en);
      }
      expect(new Set(item.wrong.map((w) => w.en)).size).toBe(2);
      expect('verified' in item).toBe(false);
    }
  });

  it('numbers the candidates a<N>_r01.. and is stable for a seed', () => {
    const a = buildRespondBank(2, units, {}, lineTags, 9);
    const b = buildRespondBank(2, units, {}, lineTags, 9);
    expect(b).toEqual(a);
    expect(a.map((i) => i.id)).toEqual(['a2_r01', 'a2_r02', 'a2_r03', 'a2_r04', 'a2_r05']);
    const c = buildRespondBank(2, units, {}, lineTags, 10);
    expect(c.map((i) => i.question.en)).not.toEqual(a.map((i) => i.question.en));
  });

  it('skips a question whose answer is too far away, universal, or has no wrong reply', () => {
    const far = makeUnit('far', [
      line('q', 'Where is the bank?', 'npc'),
      line('x1', 'Hmm.', 'npc'),
      line('x2', 'Hmm hmm.', 'npc'),
      line('a', 'It is on Main Street.', 'player'),
    ]);
    const tags = {
      ...lineTags,
      [lineTagKey('far', 'q')]: { side: 'question', qtype: 'where' } as LineTag,
      [lineTagKey('far', 'a')]: { side: 'answer', atype: 'place' } as LineTag,
    };
    const items = buildRespondBank(1, [far, ...units], {}, tags, 1);
    expect(items).toHaveLength(5);
    expect(
      items.every(
        (i) => i.answer.en !== 'It is on Main Street.' || i.question.en === 'Where is the bank?',
      ),
    ).toBe(true);
    expect(buildRespondBank(1, [far], {}, tags, 1)).toEqual([]);
    expect(buildRespondBank(1, [units[0] as Unit], {}, lineTags, 1)).toEqual([]);
  });

  it('adds the sentence generator question and answer pairs with their wrong types', () => {
    const qa: Qa = {
      question: 'Where did you send the report?',
      answer: 'To the head office.',
      wrong: ['Yesterday morning.', 'The manager.', 'Two.'],
      wrongTypes: ['time', 'person', 'quantity'],
      grammarId: 'past-simple',
      questionType: 'where',
      answerType: 'place',
    };
    const items = buildRespondBank(1, [], {}, {}, 1, [qa]);
    expect(items).toHaveLength(1);
    expect(items[0]?.question).toEqual({ en: qa.question, qtype: 'where', role: 'announcer' });
    expect(items[0]?.wrong.map((w) => w.en)).toEqual(['Yesterday morning.', 'The manager.']);
    const wrongTypes = items[0]?.wrong.map((w) => w.atype);
    expect(wrongTypes).toEqual(['time', 'person']);
    const bad = { ...qa, wrongTypes: ['place', 'place', 'time'] as AnswerType[] };
    expect(buildRespondBank(1, [], {}, {}, 1, [bad])).toEqual([]);
  });

  it('caps the number of candidates', () => {
    expect(buildRespondBank(1, units, {}, lineTags, 3, [], 2)).toHaveLength(2);
  });

  it('returns nothing for no data', () => {
    expect(buildRespondBank(1, [], {}, {}, 1)).toEqual([]);
  });
});
