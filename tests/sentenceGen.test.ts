import { describe, expect, it } from 'vitest';
import {
  COMPATIBLE,
  type BlankKind,
  type LexClass,
  type LexEntry,
  type VerbFrame,
  type Lexicon,
  type Pattern,
  type PatternShape,
} from '../src/content/lexicon';
import { makeRng } from '../src/learning/gen/common';
import { NO_ITEM } from '../src/learning/questions';
import {
  blankWords,
  buildPool,
  buildQa,
  buildSentence,
  sentenceFill,
  type Sentence,
} from '../src/learning/sentenceGen';

/** A preposition the verb always takes (listen to): the data marks it `fixed`. */
const fixedPrep = (word: string, cls: LexClass[]) =>
  ({ word, cls, fixed: true }) as unknown as VerbFrame['prep'];

// A small fake lexicon: the engine is data-driven, so nothing here is the real data.
const lexicon: Lexicon = {
  manager: { pos: 'n', cls: 'role', forms: { pl: 'managers' } },
  customer: { pos: 'n', cls: 'person', forms: { pl: 'customers' } },
  report: { pos: 'n', cls: 'document', forms: { pl: 'reports' } },
  file: { pos: 'n', cls: 'document', forms: { pl: 'files' } },
  umbrella: { pos: 'n', cls: 'object', forms: { pl: 'umbrellas' } },
  phone: { pos: 'n', cls: 'device', forms: { pl: 'phones' } },
  apple: { pos: 'n', cls: 'food', forms: { pl: 'apples' } },
  water: { pos: 'n', cls: 'drink', countable: false },
  office: { pos: 'n', cls: 'place', forms: { pl: 'offices' } },
  bank: { pos: 'n', cls: 'place', forms: { pl: 'banks' } },
  room: { pos: 'n', cls: 'room', forms: { pl: 'rooms' } },
  table: { pos: 'n', cls: 'object', forms: { pl: 'tables' } },
  monday: { pos: 'n', cls: 'day', forms: { pl: 'mondays' } },
  morning: { pos: 'n', cls: 'time', forms: { pl: 'mornings' } },
  week: { pos: 'n', cls: 'time', forms: { pl: 'weeks' } },
  hour: { pos: 'n', cls: 'time', forms: { pl: 'hours' } },
  weather: { pos: 'n', cls: 'quality', countable: false },
  two: { pos: 'n', cls: 'number' },
  three: { pos: 'n', cls: 'number' },
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
  go: {
    pos: 'v',
    forms: { s3: 'goes', past: 'went', pp: 'gone', ing: 'going' },
    frames: [{ subj: ['person', 'role'], prep: fixedPrep('to', ['place']) }],
  },
  eat: {
    pos: 'v',
    forms: { s3: 'eats', past: 'ate', pp: 'eaten', ing: 'eating' },
    frames: [{ subj: ['person', 'role'], obj: ['food', 'drink'] }],
  },
  work: {
    pos: 'v',
    forms: { s3: 'works', past: 'worked', pp: 'worked', ing: 'working' },
    frames: [{ subj: ['person', 'role'], prep: fixedPrep('at', ['place']) }],
  },
  busy: { pos: 'adj', frames: [{ subj: ['person', 'role'] }] },
  long: { pos: 'adj', frames: [{ subj: ['document'] }] },
  big: { pos: 'adj', frames: [{ subj: ['object', 'device', 'place', 'room'] }] },
  expensive: { pos: 'adj', frames: [{ subj: ['object', 'device'] }] },
  good: { pos: 'adj', frames: [{ subj: ['document', 'object'] }] },
  on: { pos: 'prep', frames: [{ subj: ['document', 'object', 'device'], obj: ['object'] }] },
  in: { pos: 'prep', frames: [{ subj: ['document', 'object', 'device'], obj: ['room'] }] },
};

const taught = new Set(Object.keys(lexicon));

function pattern(
  shape: PatternShape,
  tense: string,
  cues?: string[],
  blanks: BlankKind[] = [],
): Pattern {
  const p: Pattern = {
    id: `${shape}-${tense}`,
    grammarId: `g-${shape}-${tense}`,
    shape,
    tense,
    blanks,
  };
  if (cues) p.cues = cues;
  return p;
}

function many(p: Pattern, lex: Lexicon = lexicon, n = 120): Sentence[] {
  const out: Sentence[] = [];
  for (let seed = 1; seed <= n; seed++) {
    const s = buildSentence(p, lex, new Set(Object.keys(lex)), makeRng(seed));
    if (s) out.push(s);
  }
  return out;
}

const mainVerb = (s: Sentence) => s.parts.find((p) => p.role === 'verb');

describe('buildSentence: basics', () => {
  it('starts with a capital, ends with a full stop, and is the parts joined', () => {
    const list = many(pattern('svo', 'present', ['every day']));
    expect(list.length).toBeGreaterThan(100);
    for (const s of list) {
      expect(s.en).toMatch(/^[A-Z]/);
      expect(s.en).toMatch(/\.$/);
      expect(s.en).not.toMatch(/ {2}|\s\.|\s\?/);
      expect(s.en.slice(0, -1).toLowerCase()).toBe(
        s.parts
          .map((p) => p.text)
          .join(' ')
          .toLowerCase(),
      );
    }
  });

  it('is deterministic for a seed and varies across seeds', () => {
    const p = pattern('svo', 'past', ['yesterday']);
    const a = buildSentence(p, lexicon, taught, makeRng(7));
    const b = buildSentence(p, lexicon, taught, makeRng(7));
    expect(a?.en).toBe(b?.en);
    expect(new Set(many(p).map((s) => s.en)).size).toBeGreaterThan(20);
  });

  it('only uses words that are taught', () => {
    const some = new Set(['manager', 'report', 'write']);
    for (let seed = 1; seed < 40; seed++) {
      const s = buildSentence(
        pattern('svo', 'present', ['every day']),
        lexicon,
        some,
        makeRng(seed),
      );
      expect(s).not.toBeNull();
      expect(s?.en.toLowerCase()).toMatch(/manager|report|\b(i|you|he|she|we|they)\b/);
      expect(s?.en).not.toMatch(/customer|file|send|eat|office/i);
    }
  });

  it('returns null when a slot cannot be filled', () => {
    const svo = pattern('svo', 'present', ['every day']);
    expect(buildSentence(svo, {}, new Set(), makeRng(1))).toBeNull();
    expect(buildSentence(svo, lexicon, new Set(['send']), makeRng(1))).toBeNull();
    // the verb wants a document and none is taught
    expect(buildSentence(svo, lexicon, new Set(['write', 'manager']), makeRng(1))).toBeNull();
    expect(buildSentence(pattern('passive', 'past'), {}, new Set(), makeRng(1))).toBeNull();
    expect(
      buildSentence(
        pattern('there-be', 'present'),
        { ...lexicon, on: { pos: 'prep' }, in: { pos: 'prep' } },
        taught,
        makeRng(1),
      ),
    ).toBeNull();
    expect(buildSentence(pattern('svo', 'wibble'), lexicon, taught, makeRng(1))).toBeNull();
  });

  it('refuses a cue that does not fit the tense, and svo-time without a cue', () => {
    expect(many(pattern('svo', 'present', ['yesterday']))).toHaveLength(0);
    expect(many(pattern('svo', 'past', ['tomorrow']))).toHaveLength(0);
    expect(many(pattern('svo-time', 'past'))).toHaveLength(0);
    expect(many(pattern('svo-time', 'past', ['yesterday'])).length).toBeGreaterThan(100);
  });

  it('puts a cue only from the pattern, and in the right place', () => {
    for (const s of many(pattern('svo-time', 'past', ['yesterday', 'last week']))) {
      expect(s.en).toMatch(/ (yesterday|last week)\.$/);
    }
    for (const s of many(pattern('svo', 'present', ['always']))) {
      expect(s.en).toMatch(/ always (send|sends|write|writes|eat|eats|go|goes|work|works)\b/);
    }
    for (const s of many(pattern('svo', 'present'))) {
      expect(s.en).not.toMatch(/every day|yesterday|tomorrow|always|often/);
    }
  });
});

describe('buildSentence: agreement, tense, articles', () => {
  it('agrees the verb with the subject', () => {
    const base = ['send', 'write', 'eat', 'go', 'work'];
    const third = ['sends', 'writes', 'eats', 'goes', 'works'];
    let sawPronoun = false;
    for (const s of many(pattern('svo', 'present', ['every day']))) {
      const verb = mainVerb(s)?.text ?? '';
      const subject = s.parts[0];
      const text = subject?.text.toLowerCase() ?? '';
      const singular = /^(he|she)$/.test(text) || (!!subject?.np?.spec && !subject.np.spec.plural);
      if (/^(i|you|we|they)$/.test(text)) sawPronoun = true;
      expect(singular ? third : base).toContain(verb);
    }
    expect(sawPronoun).toBe(true);
  });

  it('writes irregular verbs from the forms, never by rule', () => {
    const only = new Set(['write', 'manager', 'report', 'customer']);
    const past = many(pattern('svo', 'past', ['yesterday']), lexicon).filter(
      (s) => s.slots.verb === 'write',
    );
    expect(past.length).toBeGreaterThan(10);
    for (const s of past) expect(s.en).toMatch(/ wrote /);
    const perfect = many(pattern('svo', 'perfect', ['already'])).filter(
      (s) => s.slots.verb === 'write',
    );
    for (const s of perfect) expect(s.en).toMatch(/ (has|have) already written /);
    const go = many(pattern('svo', 'progressive', ['now'])).filter((s) => s.slots.verb === 'go');
    for (const s of go) expect(s.en).toMatch(/\b(is|are|am) going to /);
    void only;
  });

  it('builds the other tenses and modals', () => {
    for (const s of many(pattern('svo', 'future', ['tomorrow'])))
      expect(s.en).toMatch(/ will (send|write|eat|go|work)\b/);
    for (const s of many(pattern('svo', 'can')))
      expect(s.en).toMatch(/ can (send|write|eat|go|work)\b/);
    for (const s of many(pattern('svo', 'past-progressive', ['yesterday'])))
      expect(s.en).toMatch(/ (was|were) (sending|writing|eating|going|working)\b/);
    for (const s of many(pattern('svo', 'past-perfect')))
      expect(s.en).toMatch(/ had (sent|written|eaten|gone|worked)\b/);
  });

  it('uses a / an by the sound, the entry flag, and never a with an uncountable noun', () => {
    const lex: Lexicon = {
      ...lexicon,
      umbrella: { pos: 'n', cls: 'document', forms: { pl: 'umbrellas' } },
      hour: { pos: 'n', cls: 'document', forms: { pl: 'hours' } },
      university: { pos: 'n', cls: 'document', forms: { pl: 'universities' } },
      heir: { pos: 'n', cls: 'document', forms: { pl: 'heirs' }, an: true },
      water: { pos: 'n', cls: 'document', countable: false },
    };
    const text = many(pattern('svo', 'present', ['every day']), lex, 600)
      .map((s) => s.en)
      .join(' | ');
    expect(text).toMatch(/\ban umbrella\b/);
    expect(text).toMatch(/\ban hour\b/);
    expect(text).toMatch(/\ba university\b/);
    expect(text).toMatch(/\ban heir\b/);
    expect(text).not.toMatch(
      /\ba umbrella|\ba hour|\ban university|\ba heir|\ban report|\ba apple/,
    );
    expect(text).not.toMatch(/\b(a|an|one|two|three|many) water\b|\bwaters\b/);
  });

  it('pluralises with the written form', () => {
    const lex: Lexicon = {
      ...lexicon,
      report: { pos: 'n', cls: 'document', forms: { pl: 'reportz' } },
    };
    const list = many(pattern('svo', 'present', ['every day']), lex, 300).map((s) => s.en);
    expect(list.some((e) => /reportz/.test(e))).toBe(true);
    expect(list.some((e) => /\breports\b/.test(e))).toBe(false);
  });
});

describe('buildSentence: shapes', () => {
  it('svo-prep puts the frame preposition and a landmark of its class', () => {
    const list = many(pattern('svo-prep', 'past', ['yesterday']));
    expect(list.length).toBeGreaterThan(50);
    for (const s of list) {
      expect(s.slots.prep).toMatch(/^(to|at)$/);
      expect(s.en).toMatch(/ (to|at) /);
    }
    // "go" and "work" take only places
    for (const s of list.filter((x) => x.slots.verb === 'go' || x.slots.verb === 'work')) {
      expect(s.en).toMatch(/(office|bank|room)/);
    }
  });

  it('be-adj agrees the be form and only describes what the adjective can', () => {
    const list = many(pattern('be-adj', 'present', ['every day']));
    expect(list.length).toBeGreaterThan(50);
    for (const s of list) {
      const be = mainVerb(s)?.text;
      const plural = s.parts[0]?.np?.spec?.plural || /^(you|we|they)$/.test(s.parts[0]?.text ?? '');
      expect(be).toBe(plural ? 'are' : 'is');
      if (s.slots.adj === 'busy')
        expect(s.slots.subj).toMatch(/manager|customer|^(you|he|she|we|they)$/);
      if (s.slots.adj === 'long') expect(s.slots.subj).toMatch(/report|file/);
    }
    const past = many(pattern('be-adj', 'past', ['yesterday']));
    for (const s of past) expect(mainVerb(s)?.text).toMatch(/^(was|were)$/);
    const future = many(pattern('be-adj', 'future', ['tomorrow']));
    for (const s of future) expect(s.en).toMatch(/ will be /);
    expect(many(pattern('be-adj', 'progressive'))).toHaveLength(0);
  });

  it('there-be agrees with the noun that follows and uses a landmark of the frame', () => {
    const list = many(pattern('there-be', 'present'));
    expect(list.length).toBeGreaterThan(50);
    for (const s of list) {
      expect(s.en).toMatch(/^There (is|are) /);
      const spec = s.parts.find((p) => p.role === 'subj')?.np?.spec;
      expect(mainVerb(s)?.text).toBe(spec?.plural ? 'are' : 'is');
      expect(s.en).toMatch(/ (on|in) /);
    }
    for (const s of many(pattern('there-be', 'past'))) expect(s.en).toMatch(/^There (was|were) /);
    for (const s of many(pattern('there-be', 'perfect')))
      expect(s.en).toMatch(/^There (has|have) been /);
  });

  it('passive uses the participle, agrees with the patient and names the agent', () => {
    const list = many(pattern('passive', 'past', ['yesterday']));
    expect(list.length).toBeGreaterThan(50);
    for (const s of list) {
      expect(s.en).toMatch(/ (was|were) (sent|written|eaten) /);
      expect(s.en).toMatch(/ by (\w+ )?\w+ yesterday\.$/);
      expect(s.en).toMatch(/yesterday\.$/);
      const plural = s.parts[0]?.np?.spec?.plural;
      expect(s.en).toMatch(plural ? / were / : / was /);
    }
    for (const s of many(pattern('passive', 'future')))
      expect(s.en).toMatch(/ will be (sent|written|eaten).* by /);
    for (const s of many(pattern('passive', 'perfect')))
      expect(s.en).toMatch(/ (has|have) been (sent|written|eaten).* by /);
    expect(many(pattern('passive', 'progressive'))).toHaveLength(0);
  });

  it('comparative uses the regular, doubled, -y and irregular rules and "more"', () => {
    const list = many(pattern('comparative', 'present', ['today']), lexicon, 400);
    const text = list.map((s) => s.en).join(' | ');
    for (const s of list) expect(s.en).toMatch(/ than /);
    expect(text).toMatch(/\blonger than\b/);
    expect(text).toMatch(/\bbigger than\b/);
    expect(text).toMatch(/\bmore expensive than\b/);
    expect(text).toMatch(/\bbetter than\b/);
    const busier = many(pattern('comparative', 'present'), {
      ...lexicon,
      busy: { pos: 'adj', frames: [{ subj: ['document'] }] },
    });
    expect(busier.map((s) => s.en).join(' ')).toMatch(/busier than/);
    // the forms.comp of the data wins
    const own = many(pattern('comparative', 'present'), {
      ...lexicon,
      long: {
        pos: 'adj',
        forms: { comp: 'lengthier' } as unknown as LexEntry['forms'],
        frames: [{ subj: ['document'] }],
      },
    });
    expect(own.map((s) => s.en).join(' ')).toMatch(/lengthier than/);
  });

  it('yes-no and wh questions use do-support and the right auxiliary', () => {
    for (const s of many(pattern('yes-no-question', 'present', ['every day']))) {
      expect(s.en).toMatch(/^(Do|Does) /);
      expect(s.en).toMatch(/\?$/);
      expect(s.en).toMatch(/ (send|write|eat|go|work)\b/);
    }
    for (const s of many(pattern('yes-no-question', 'past', ['yesterday']))) {
      expect(s.en).toMatch(/^Did /);
    }
    for (const s of many(pattern('yes-no-question', 'perfect'))) {
      expect(s.en).toMatch(/^(Has|Have) .* (sent|written|eaten|gone|worked)\b/);
    }
    for (const s of many(pattern('yes-no-question', 'future'))) expect(s.en).toMatch(/^Will /);
    const wh = many(pattern('wh-question', 'past'));
    expect(wh.length).toBeGreaterThan(50);
    for (const s of wh) {
      expect(s.en).toMatch(/^(What|Who|Where|When|How many) .*\?$/);
      expect(s.en).toMatch(/^[A-Za-z ]+? did /);
    }
  });
});

function plug(q: { before: string; after: string; answer: string }): string {
  const none = '—';
  const word = q.answer === none ? '' : q.answer;
  const text = `${q.before}${word}${q.after}`.replace(/ {2,}/g, ' ').replace(/^ /, '');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const ALL_BLANKS: BlankKind[] = ['verb-form', 'prep', 'article', 'number', 'object', 'subject'];

describe('sentenceFill', () => {
  const patterns = [
    pattern('svo', 'present', ['every day']),
    pattern('svo', 'past', ['yesterday']),
    pattern('svo-prep', 'past', ['yesterday']),
    pattern('svo-prep', 'present', ['every day']),
    pattern('svo', 'progressive', ['now']),
    pattern('svo', 'perfect', ['already']),
    pattern('svo', 'future', ['tomorrow']),
    pattern('yes-no-question', 'past', ['yesterday']),
    pattern('wh-question', 'present', ['every day']),
    pattern('be-adj', 'present', ['now']),
    pattern('there-be', 'past'),
    pattern('passive', 'past', ['yesterday']),
    pattern('comparative', 'present', ['now']),
  ];

  it('builds a clean 4-option question for every blank, with the answer in the sentence', () => {
    const seen = new Set<BlankKind>();
    for (const p of patterns) {
      for (const s of many(p, lexicon, 60)) {
        for (const blank of ALL_BLANKS) {
          const q = sentenceFill(s, blank, makeRng(3));
          if (!q) continue;
          seen.add(blank);
          expect(q.kind).toBe('fill');
          expect(q.options).toHaveLength(4);
          const labels = q.options.map((o) => o.label.toLowerCase());
          expect(new Set(labels).size).toBe(4);
          expect(q.options.filter((o) => o.id === q.correctId)).toHaveLength(1);
          expect(q.options.find((o) => o.id === q.correctId)?.label).toBe(q.answer);
          expect(q.itemId).toBe(NO_ITEM);
          expect(q.grammarIds).toEqual([p.grammarId]);
          expect(q.before + q.after).toContain('');
          expect(plug(q)).toBe(s.en.replace(/ {2,}/g, ' '));
          expect(`${q.before}___${q.after}`).not.toMatch(/___.*___/);
        }
      }
    }
    expect([...seen].sort()).toEqual([...ALL_BLANKS].sort());
  });

  it('is deterministic and puts the note from noteOf', () => {
    const s = buildSentence(pattern('svo', 'past', ['yesterday']), lexicon, taught, makeRng(5));
    if (!s) throw new Error('no sentence');
    const a = sentenceFill(s, 'verb-form', makeRng(9), () => '過去式。');
    const b = sentenceFill(s, 'verb-form', makeRng(9));
    expect(a?.options).toEqual(b?.options);
    expect(a?.note).toBe('過去式。');
    expect(b?.note).toBeUndefined();
  });

  it('verb-form: the cue decides, and every wrong form is wrong here', () => {
    const lex: Lexicon = { ...lexicon, send: lexicon.send as Lexicon[string] };
    const only = new Set(['send', 'report', 'manager', 'customer', 'office']);
    const past = pattern('svo', 'past', ['yesterday']);
    let checked = 0;
    for (let seed = 1; seed < 80; seed++) {
      const s = buildSentence(past, lex, only, makeRng(seed));
      if (!s || s.slots.verb !== 'send') continue;
      const q = sentenceFill(s, 'verb-form', makeRng(seed), undefined);
      if (!q) continue;
      checked++;
      expect(q.answer).toBe('sent');
      const wrong = q.options.filter((o) => o.id !== q.correctId).map((o) => o.label);
      for (const w of wrong) expect(['send', 'sends', 'sending', 'to send']).toContain(w);
    }
    expect(checked).toBeGreaterThan(10);
    // present with "every day": the past form is a wrong option, for he / she the base form too
    const present = pattern('svo', 'present', ['every day']);
    let sawPast = false;
    for (let seed = 1; seed < 200; seed++) {
      const s = buildSentence(present, lex, only, makeRng(seed));
      if (!s || s.slots.verb !== 'send') continue;
      const q = sentenceFill(s, 'verb-form', makeRng(seed));
      if (!q) continue;
      const wrong = q.options.filter((o) => o.id !== q.correctId).map((o) => o.label);
      const sg3 = q.answer === 'sends';
      expect(['send', 'sends']).toContain(q.answer);
      expect(wrong).not.toContain(q.answer);
      if (sg3 && wrong.includes('send')) sawPast = true;
      for (const w of wrong) expect(['send', 'sends', 'sent', 'sending', 'to send']).toContain(w);
    }
    expect(sawPast).toBe(true);
  });

  it('verb-form without a deciding cue never offers the other simple tense as a wrong option', () => {
    const p = pattern('svo', 'present');
    for (let seed = 1; seed < 100; seed++) {
      const s = buildSentence(p, lexicon, taught, makeRng(seed));
      const q = s ? sentenceFill(s, 'verb-form', makeRng(seed)) : null;
      if (!q || s?.slots.verb !== 'send') continue;
      expect(q.options.map((o) => o.label)).not.toContain('sent');
    }
  });

  it('verb-form works on be and offers only wrong be forms', () => {
    const p = pattern('be-adj', 'present', ['now']);
    for (const s of many(p, lexicon, 40)) {
      const q = sentenceFill(s, 'verb-form', makeRng(2));
      expect(q).not.toBeNull();
      const right = mainVerb(s)?.text;
      expect(q?.answer).toBe(right);
      const wrong = q?.options.filter((o) => o.id !== q.correctId).map((o) => o.label) ?? [];
      // "now" decides: the past form is a wrong option here
      for (const w of wrong)
        expect(['am', 'is', 'are', 'was', 'were', 'be', 'been', 'being']).toContain(w);
      expect(wrong).not.toContain(right);
    }
  });

  it('verb-form in a passive and in a perfect never offers a form that would also fit', () => {
    for (const s of many(pattern('passive', 'past', ['yesterday']), lexicon, 40)) {
      const q = sentenceFill(s, 'verb-form', makeRng(2));
      const wrong = q?.options.filter((o) => o.id !== q.correctId).map((o) => o.label) ?? [];
      expect(wrong).not.toContain(q?.answer);
      expect(wrong).not.toContain(mainVerb(s)?.text);
    }
    for (const s of many(pattern('svo', 'perfect', ['already']), lexicon, 40)) {
      const q = sentenceFill(s, 'verb-form', makeRng(2));
      expect(q).not.toBeNull();
      const wrong = q?.options.filter((o) => o.id !== q.correctId).map((o) => o.label) ?? [];
      expect(wrong).not.toContain('to ' + (s.slots.verb ?? ''));
      expect(q?.before).toMatch(/\b(has|have) already $/);
    }
  });

  it('prep: only for a fixed frame preposition, with wrong ones that cannot fit', () => {
    let found = 0;
    let none = 0;
    for (const s of many(pattern('svo-prep', 'past', ['yesterday']), lexicon, 120)) {
      const q = sentenceFill(s, 'prep', makeRng(1));
      if (s.slots.verb === 'send') {
        // "to" after send + object is not fixed: other prepositions would fit too
        expect(q).toBeNull();
        none++;
        continue;
      }
      expect(q).not.toBeNull();
      found++;
      expect(q?.answer).toBe(s.slots.prep);
      const wrong = q?.options.filter((o) => o.id !== q.correctId).map((o) => o.label) ?? [];
      const rivals =
        s.slots.prep === 'to'
          ? ['into', 'toward', 'at', 'for', 'onto']
          : ['in', 'on', 'by', 'near', 'to'];
      for (const w of wrong) expect(rivals).not.toContain(w);
    }
    expect(found).toBeGreaterThan(10);
    expect(none).toBeGreaterThan(5);
    for (const s of many(pattern('svo', 'present', ['every day']), lexicon, 40)) {
      if (!s.parts.some((p) => p.role === 'prep'))
        expect(sentenceFill(s, 'prep', makeRng(1))).toBeNull();
    }
    // a preposition of there-be is a choice of meaning, not a rule: no question
    for (const s of many(pattern('there-be', 'present'), lexicon, 30)) {
      expect(sentenceFill(s, 'prep', makeRng(1))).toBeNull();
    }
  });

  it('article: a / an by sound, other articles that cannot be right, bare nouns', () => {
    const answers = new Set<string>();
    for (const s of many(pattern('svo', 'present', ['every day']), lexicon, 300)) {
      const q = sentenceFill(s, 'article', makeRng(4));
      if (!q) continue;
      answers.add(q.answer.toLowerCase());
      const labels = q.options.map((o) => o.label.toLowerCase());
      // the is never offered: it would also be right
      expect(labels).not.toContain('the');
      expect(labels).not.toContain('his');
      if (q.answer.toLowerCase() === 'a') {
        expect(q.after).not.toMatch(/^ [aeiou]/);
        expect(labels).toContain('an');
      }
      if (q.answer.toLowerCase() === 'an') expect(q.after).toMatch(/^ [aeiou]/);
    }
    expect(answers).toContain('a');
    expect(answers).toContain('an');
    expect(answers).toContain('—');
  });

  it('number: singular and plural of the noun with the forms the data gives', () => {
    const seen = new Set<string>();
    for (const s of many(pattern('svo', 'present', ['every day']), lexicon, 300)) {
      const q = sentenceFill(s, 'number', makeRng(4));
      if (!q) continue;
      const spec = s.parts.find((p) => p.np?.spec?.noun.toLowerCase() === q.answer.toLowerCase())
        ?.np?.spec;
      expect(spec).toBeDefined();
      seen.add(spec?.plural ? 'pl' : 'sg');
      const wrong = q.options.filter((o) => o.id !== q.correctId).map((o) => o.label.toLowerCase());
      if (spec?.plural) expect(wrong).toContain(spec.singular);
      else expect(wrong).toContain(spec?.pluralForm);
      expect(wrong).not.toContain(q.answer.toLowerCase());
      // an uncountable noun has no number question
      expect(q.answer).not.toBe('water');
    }
    expect([...seen].sort()).toEqual(['pl', 'sg']);
  });

  it('object and subject: wrong nouns are of a class the frame cannot take', () => {
    const classOf = (phrase: string) => {
      const words = Object.keys(lexicon).filter((w) => new RegExp(`\\b${w}s?\\b`).test(phrase));
      return words.map((w) => lexicon[w]?.cls);
    };
    let objects = 0;
    let subjects = 0;
    for (const s of many(pattern('svo', 'present', ['every day']), lexicon, 200)) {
      const o = sentenceFill(s, 'object', makeRng(1));
      if (o) {
        objects++;
        const verb = s.slots.verb;
        const frames = lexicon[verb ?? '']?.frames ?? [];
        const accepted = frames.flatMap((f) => [...(f.obj ?? []), ...(f.prep?.cls ?? [])]);
        for (const opt of o.options.filter((x) => x.id !== o.correctId)) {
          for (const c of classOf(opt.label)) expect(accepted).not.toContain(c);
        }
      }
      const q = sentenceFill(s, 'subject', makeRng(1));
      if (q) {
        subjects++;
        for (const opt of q.options.filter((x) => x.id !== q.correctId)) {
          for (const c of classOf(opt.label)) expect(['person', 'role']).not.toContain(c);
        }
      }
    }
    expect(objects).toBeGreaterThan(20);
    expect(subjects).toBeGreaterThan(20);
  });

  it('subject wrong nouns keep the verb agreement of the sentence', () => {
    for (const s of many(pattern('svo', 'present', ['every day']), lexicon, 100)) {
      const q = sentenceFill(s, 'subject', makeRng(1));
      if (!q) continue;
      const plural = /^(I|you|we|they)$/i.test(q.answer) || s.parts[0]?.np?.spec?.plural === true;
      for (const o of q.options) {
        const looksPlural = /s$/.test(o.label) || /^(I|you|we|they)$/i.test(o.label);
        if (o.id !== q.correctId) expect(looksPlural).toBe(plural);
      }
    }
  });

  it('returns null when the sentence cannot take the blank', () => {
    const s = buildSentence(pattern('be-adj', 'present', ['now']), lexicon, taught, makeRng(1));
    if (!s) throw new Error('no sentence');
    expect(sentenceFill(s, 'prep', makeRng(1))).toBeNull();
    expect(sentenceFill(s, 'object', makeRng(1))).toBeNull();
    const tiny = buildSentence(
      pattern('svo', 'present', ['every day']),
      {
        write: lexicon.write as Lexicon[string],
        report: lexicon.report as Lexicon[string],
        manager: lexicon.manager as Lexicon[string],
      },
      new Set(['write', 'report', 'manager']),
      makeRng(1),
    );
    // only three nouns of the right kinds: not enough wrong options of another class
    expect(tiny).not.toBeNull();
    if (tiny) expect(sentenceFill(tiny, 'object', makeRng(1))).toBeNull();
  });
});

describe('buildQa', () => {
  const qaPatterns = [
    pattern('svo-prep', 'past'),
    pattern('svo-prep', 'present'),
    pattern('svo-time', 'past', ['yesterday', 'last week']),
    pattern('svo-time', 'future', ['tomorrow', 'next week']),
    pattern('wh-question', 'past', ['yesterday']),
    pattern('wh-question', 'present', ['every day']),
    pattern('wh-question', 'progressive', ['now']),
    pattern('wh-question', 'future'),
    pattern('svo', 'past'),
  ];

  function qas(p: Pattern, n = 150) {
    const out = [];
    for (let seed = 1; seed <= n; seed++) {
      const qa = buildQa(p, lexicon, taught, makeRng(seed));
      if (qa) out.push(qa);
    }
    return out;
  }

  it('asks about a slot and gives the answer phrase', () => {
    const texts = qaPatterns.flatMap((p) => qas(p)).map((q) => `${q.question} ${q.answer}`);
    expect(texts.some((t) => /^Where (did|does|will) \w+ .*\? (To|At) the \w+\.$/.test(t))).toBe(
      true,
    );
    expect(texts.some((t) => /^When /.test(t))).toBe(true);
    expect(texts.some((t) => /^What /.test(t))).toBe(true);
    expect(texts.some((t) => /^Who /.test(t))).toBe(true);
    expect(texts.some((t) => /^How many /.test(t))).toBe(true);
    for (const q of qaPatterns.flatMap((p) => qas(p))) {
      expect(q.question).toMatch(/^[A-Z].*\?$/);
      expect(q.answer).toMatch(/^[A-Z].*\.$/);
    }
  });

  it('time answers come from the cues and the time words, in the tense of the question', () => {
    for (const q of qas(pattern('svo-time', 'past', ['yesterday', 'last week']))) {
      expect(q.questionType).toBe('when');
      expect(q.answer).toMatch(
        /^(Yesterday|Last week|Last monday|Last Monday|Yesterday morning|Last night)\.$/,
      );
    }
    for (const q of qas(pattern('svo-time', 'future', ['tomorrow']))) {
      expect(q.answer).toMatch(/^(Tomorrow|Next .*|Tomorrow .*)\.$/);
    }
  });

  it('wrong replies are never type-compatible with the question, never universal, unique', () => {
    let count = 0;
    for (const p of qaPatterns) {
      for (const q of qas(p)) {
        count++;
        expect(q.wrong).toHaveLength(3);
        expect(q.wrongTypes).toHaveLength(3);
        expect(new Set([q.answer, ...q.wrong]).size).toBe(4);
        expect(COMPATIBLE[q.questionType]).toContain(q.answerType);
        for (const t of q.wrongTypes) {
          expect(COMPATIBLE[q.questionType]).not.toContain(t);
          expect(t).not.toBe('universal');
        }
        expect(q.grammarId).toBe(p.grammarId);
        for (const w of q.wrong) expect(w).toMatch(/^[A-Z].*\.$/);
      }
    }
    expect(count).toBeGreaterThan(300);
  });

  it('wrong replies really are of the type they claim', () => {
    for (const q of qaPatterns.flatMap((p) => qas(p))) {
      q.wrong.forEach((w, i) => {
        const type = q.wrongTypes[i];
        if (type === 'place') expect(w).toMatch(/^(At|In) the (office|bank|room)\.$/);
        if (type === 'person') expect(w).toMatch(/^(The|My) (manager|customer)\.$/);
        if (type === 'quantity') expect(w).toMatch(/^(Two|Three)\.$/);
        if (type === 'time') expect(w).toMatch(/^(Yesterday|Tomorrow|Last|Next|Every)\b|^Every /i);
        if (type === 'thing') expect(w).toMatch(/^(An?|The|Some) \w+\.$/);
      });
    }
  });

  it('a "what" question never gets a person reply when the verb takes people', () => {
    const lex: Lexicon = {
      ...lexicon,
      meet: {
        pos: 'v',
        forms: { s3: 'meets', past: 'met', pp: 'met', ing: 'meeting' },
        frames: [{ subj: ['person', 'role'], obj: ['person', 'role', 'document'] }],
      },
    };
    for (let seed = 1; seed < 150; seed++) {
      const qa = buildQa(pattern('svo', 'past'), lex, new Set(Object.keys(lex)), makeRng(seed));
      if (qa?.questionType === 'what' && /meet/.test(qa.question))
        expect(qa.wrongTypes).not.toContain('person');
    }
  });

  it('is deterministic, and null for shapes that have no slot to ask about', () => {
    const p = pattern('wh-question', 'past');
    expect(buildQa(p, lexicon, taught, makeRng(3))).toEqual(
      buildQa(p, lexicon, taught, makeRng(3)),
    );
    expect(buildQa(pattern('be-adj', 'present'), lexicon, taught, makeRng(1))).toBeNull();
    expect(buildQa(pattern('passive', 'past'), lexicon, taught, makeRng(1))).toBeNull();
    expect(buildQa(p, {}, new Set(), makeRng(1))).toBeNull();
    // not enough kinds of words for three wrong replies
    const bare: Lexicon = {
      write: lexicon.write as Lexicon[string],
      report: lexicon.report as Lexicon[string],
      manager: lexicon.manager as Lexicon[string],
    };
    expect(
      buildQa(pattern('svo', 'past'), bare, new Set(Object.keys(bare)), makeRng(1)),
    ).toBeNull();
  });
});

describe('naturalness rules', () => {
  it('a landmark after a preposition is singular', () => {
    for (const s of many(pattern('svo-prep', 'present', ['every day']), lexicon, 200)) {
      const pobj = s.parts.find((p) => p.role === 'pobj');
      expect(pobj?.np?.spec?.plural).toBe(false);
    }
    for (const s of many(pattern('there-be', 'present'), lexicon, 200)) {
      expect(s.parts.find((p) => p.role === 'pobj')?.np?.spec?.plural).toBe(false);
    }
  });

  it('a comparison sets two nouns of the same number side by side', () => {
    for (const s of many(pattern('comparative', 'present'), lexicon, 200)) {
      const subj = s.parts.find((p) => p.role === 'subj')?.np?.spec;
      const other = s.parts.find((p) => p.role === 'obj')?.np?.spec;
      expect(other?.plural).toBe(subj?.plural);
      expect(subj?.nounId).not.toBe(other?.nounId);
    }
  });

  it('a number question always offers the other number of the same noun', () => {
    let count = 0;
    for (const s of many(pattern('svo', 'present', ['every day']), lexicon, 300)) {
      const q = sentenceFill(s, 'number', makeRng(2));
      if (!q) continue;
      count++;
      const labels = q.options.map((o) => o.label.toLowerCase());
      const spec = s.parts.find((p) => p.np?.spec?.noun.toLowerCase() === q.answer.toLowerCase())
        ?.np?.spec;
      const other = spec?.plural ? spec.singular : spec?.pluralForm;
      expect(labels, s.en).toContain(other?.toLowerCase());
    }
    expect(count).toBeGreaterThan(20);
  });

  it('a wrong reply never repeats a noun of the question', () => {
    for (let seed = 1; seed < 200; seed++) {
      const qa = buildQa(pattern('svo-prep', 'past'), lexicon, taught, makeRng(seed));
      if (!qa) continue;
      const q = qa.question.toLowerCase();
      for (const w of qa.wrong) {
        const noun = /^(?:the|my|an?|some) (\w+)\.$/i.exec(w)?.[1]?.toLowerCase();
        if (noun) expect(q).not.toContain(noun);
      }
    }
  });
});

describe('buildPool', () => {
  const patterns = [
    pattern('svo', 'present', ['every day']),
    pattern('svo-prep', 'past', ['yesterday']),
    pattern('be-adj', 'present', ['now']),
    pattern('passive', 'past', ['yesterday']),
    pattern('there-be', 'present'),
    pattern('wh-question', 'past'),
    pattern('svo-time', 'past', ['yesterday', 'last week']),
  ];

  it('writes the requested count, sorted, unique, fixed by the seed', () => {
    const pool = buildPool(1, patterns, lexicon, taught, { statements: 30, qa: 8 });
    expect(pool.filter((s) => s.kind === 'statement')).toHaveLength(30);
    expect(pool.filter((s) => s.kind === 'qa')).toHaveLength(8);
    expect(pool.map((s) => s.id)).toEqual([...pool.map((s) => s.id)].sort());
    expect(new Set(pool.map((s) => s.id)).size).toBe(pool.length);
    expect(new Set(pool.map((s) => s.en)).size).toBe(pool.length);
    expect(buildPool(1, patterns, lexicon, taught, { statements: 30, qa: 8 })).toEqual(pool);
    expect(buildPool(2, patterns, lexicon, taught, { statements: 30, qa: 8 })).not.toEqual(pool);
    for (const s of pool) expect(s.id).toMatch(/^[a-z0-9_]+$/);
  });

  it('statements carry a blank word that is in the sentence; qa carries the answer index', () => {
    const pool = buildPool(1, patterns, lexicon, taught, { statements: 30, qa: 8 });
    for (const s of pool) {
      if (s.kind === 'statement') {
        expect(s.en).not.toMatch(/\?$/);
        if (s.blankWord) expect(s.en.toLowerCase()).toContain(s.blankWord.toLowerCase());
      } else {
        expect(s.responses).toHaveLength(4);
        expect(s.responses?.[s.answer ?? -1]).toBeDefined();
        expect(new Set(s.responses).size).toBe(4);
        expect(s.en).toMatch(/\?$/);
      }
    }
    expect(pool.filter((s) => s.kind === 'statement' && s.blankWord).length).toBeGreaterThan(25);
  });

  it('gives less when the patterns cannot make more, and nothing for no patterns', () => {
    expect(buildPool(1, [], lexicon, taught)).toEqual([]);
    const few = buildPool(
      1,
      [pattern('svo-time', 'past', ['yesterday'])],
      { ...lexicon },
      new Set(['send', 'manager', 'report']),
      { statements: 500, qa: 0 },
    );
    expect(few.length).toBeLessThan(500);
    expect(few.length).toBeGreaterThan(0);
  });

  it('blankWords lists single content words only', () => {
    const s = buildSentence(pattern('be-adj', 'present', ['now']), lexicon, taught, makeRng(3));
    if (!s) throw new Error('no sentence');
    for (const w of blankWords(s)) expect(w).toMatch(/^[a-z]+$/i);
    expect(blankWords(s)).not.toContain('is');
  });
});
