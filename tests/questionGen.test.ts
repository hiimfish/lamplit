import { describe, expect, it } from 'vitest';
import cafe from '../src/data/units/cafe.json';
import moveInJson from '../src/data/units/move_in.json';
import type { Task, Unit } from '../src/content/types';
import { gradeAnswer, normalize } from '../src/learning/grading';
import {
  rolePlayPrompt,
  buildReviewQuestions,
  buildRolePlayTurns,
  buildTaskPractice,
  listenPickMeaning,
  makeRng,
  readPickMeaning,
  rolePlayShown,
  rolePlaySteps,
  spellMarks,
  wordQuestionKind,
} from '../src/learning/questionGen';
import type {
  ClozeQuestion,
  PictureQuestion,
  Question,
  SignQuestion,
  SpellQuestion,
} from '../src/learning/questions';

const unit = cafe as Unit;

function optionIds(q: Question): string[] {
  if (q.kind === 'listen-pick' || q.kind === 'choose-reply') return q.options.map((o) => o.id);
  return [];
}

describe('makeRng', () => {
  it('is deterministic and in [0,1)', () => {
    const a = makeRng(7);
    const b = makeRng(7);
    for (let i = 0; i < 20; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('buildTaskPractice', () => {
  it('orders word listen-pick, chunk listen-pick, reply, arrange, speak', () => {
    const task = unit.tasks[0]!;
    const kinds = buildTaskPractice(unit, task, makeRng(1)).map((q) => q.kind);
    expect(kinds).toEqual([
      'listen-pick',
      'listen-pick',
      'listen-pick',
      'listen-pick',
      'choose-reply',
      'arrange',
      'speak',
    ]);
  });

  it('has choose-reply only for player lines after an npc line', () => {
    const t1 = buildTaskPractice(unit, unit.tasks[0]!, makeRng(2));
    expect(t1.filter((q) => q.kind === 'choose-reply')).toHaveLength(1);
    const t3 = buildTaskPractice(unit, unit.tasks[2]!, makeRng(2));
    // t3_1 has no preceding line; t3_3 follows an npc line.
    expect(t3.filter((q) => q.kind === 'choose-reply')).toHaveLength(1);
  });

  it.each([1, 2, 3, 4, 5, 6, 7, 8])('keeps options valid (seed %i)', (seed) => {
    for (const task of unit.tasks) {
      for (const q of buildTaskPractice(unit, task, makeRng(seed))) {
        if (q.kind === 'listen-pick' || q.kind === 'choose-reply') {
          const ids = optionIds(q);
          expect(ids.length).toBeGreaterThanOrEqual(2);
          expect(new Set(ids).size).toBe(ids.length);
          expect(ids.filter((id) => id === q.correctId)).toHaveLength(1);
          const labels = q.options.map((o) => ('label' in o ? o.label : o.text).toLowerCase());
          expect(new Set(labels).size).toBe(labels.length);
        }
        if (q.kind === 'arrange') {
          expect(gradeAnswer(q.blocks.join(' '), q.accepted).correct).toBe(false);
          const sortedWords = (text: string) => normalize(text).split(' ').sort();
          expect(sortedWords(q.blocks.join(' '))).toEqual(sortedWords(q.accepted[0]!));
          for (const block of q.blocks) {
            expect(block).toMatch(/^[\p{L}\p{N}](.*[\p{L}\p{N}])?$/u);
          }
        }
      }
    }
  });

  it('uses expected audio ids and item ids', () => {
    const qs = buildTaskPractice(unit, unit.tasks[0]!, makeRng(3));
    const first = qs[0]!;
    expect(first.kind === 'listen-pick' && first.audioId).toBe('cafe.word.latte');
    expect(first.itemId).toBe('word:latte');
    const speak = qs[qs.length - 1]!;
    expect(speak.kind === 'speak' && speak.audioId).toBe('cafe.chunk.can_i_get');
    expect(speak.itemId).toBe('chunk:can_i_get');
  });

  it('skips a player line with no (or an unknown) chunkId instead of inventing an item', () => {
    const task = unit.tasks[0]!;
    for (const chunkId of [undefined, 'nope']) {
      const scene = task.scene.map((line) =>
        line.speaker === 'player' ? { ...line, chunkId } : line,
      );
      const qs = buildTaskPractice(unit, { ...task, scene }, makeRng(5));
      expect(qs.filter((q) => q.kind === 'choose-reply')).toHaveLength(0);
      expect(qs.some((q) => q.itemId.startsWith('chunk:t1_') || q.itemId === 'chunk:nope')).toBe(
        false,
      );
    }
  });

  it('tags wrong replies with an error', () => {
    const reply = buildTaskPractice(unit, unit.tasks[0]!, makeRng(4)).find(
      (q) => q.kind === 'choose-reply',
    );
    expect(reply?.kind === 'choose-reply' && reply.options.filter((o) => o.error)).toHaveLength(2);
  });
});

describe('buildReviewQuestions', () => {
  it('builds for known ids and ignores unknown ones', () => {
    const qs = buildReviewQuestions(
      unit,
      ['chunk:to_go', 'word:tea', 'chunk:nope', 'word:zzz', 'junk'],
      makeRng(9),
    );
    expect(qs).toHaveLength(2);
    expect(qs.map((q) => q.itemId)).toEqual(['chunk:to_go', 'word:tea']);
    expect(qs[0]?.kind === 'listen-pick' || qs[0]?.kind === 'arrange').toBe(true);
  });

  it('asks a word a different way as its reviews go up, the same way for the same count', () => {
    const kinds = [0, 1, 2].map((reps) => wordQuestionKind('word:tea', reps));
    expect(new Set(kinds).size).toBe(3);
    expect(wordQuestionKind('word:tea', 1)).toBe(kinds[1]);
    const asked = [0, 1, 2].map(
      (reps) => buildReviewQuestions(unit, ['word:tea'], makeRng(3), () => reps)[0]?.kind,
    );
    expect(asked).toEqual(kinds);
  });
});

describe('meaning questions', () => {
  const words = unit.words;
  const tea = words.find((w) => w.id === 'tea')!;

  it.each([
    ['read-meaning', readPickMeaning],
    ['listen-meaning', listenPickMeaning],
  ] as const)('%s has four different meanings, the answer among them', (kind, make) => {
    for (let seed = 1; seed <= 30; seed++) {
      const q = make(unit, tea, makeRng(seed));
      if (!q) throw new Error('no question');
      expect(q.kind).toBe(kind);
      expect(q.en).toBe(tea.en);
      expect(q.itemId).toBe('word:tea');
      expect(q.audioId).toBe('cafe.word.tea');
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options.map((o) => o.label)).size).toBe(4);
      expect(new Set(q.options.map((o) => o.id)).size).toBe(4);
      expect(q.options.find((o) => o.id === q.correctId)?.label).toBe(tea.zh);
      expect(q.correctId).toBe('tea');
    }
  });

  it('is deterministic for a seed', () => {
    expect(readPickMeaning(unit, tea, makeRng(5))).toEqual(readPickMeaning(unit, tea, makeRng(5)));
  });

  it('never offers another word with the same meaning, and gives up below four meanings', () => {
    const twin = { ...tea, id: 'tea2', en: 'tea leaves' };
    const pool = [tea, twin, ...words.filter((w) => w.id !== 'tea')];
    for (let seed = 1; seed <= 30; seed++) {
      const q = readPickMeaning(unit, tea, makeRng(seed), pool);
      expect(q?.options.map((o) => o.id)).not.toContain('tea2');
    }
    const few = [tea, twin, ...words.filter((w) => w.zh !== tea.zh).slice(0, 2)];
    expect(listenPickMeaning(unit, tea, makeRng(1), few)).toBeNull();
    // A review then falls back to the listen-pick.
    const fallback = buildReviewQuestions(
      { ...unit, words: few },
      ['word:tea'],
      makeRng(1),
      () => [0, 1, 2].find((r) => wordQuestionKind('word:tea', r) === 'read-meaning') ?? 0,
    );
    expect(fallback[0]?.kind).toBe('listen-pick');
  });
});

describe('role-play turns', () => {
  const npc = (id: string, en: string) => ({
    id,
    role: 'barista' as const,
    speaker: 'npc' as const,
    en,
    zh: '',
  });
  const rp: Task = {
    id: 'rp',
    title: '角色扮演大挑戰',
    kind: 'roleplay',
    newChunkIds: [],
    newWordIds: [],
    scene: [
      npc('rp_1', 'Hi! What can I get for you?'),
      {
        id: 'rp_2',
        role: 'guide',
        speaker: 'player',
        en: 'Can I get a muffin, please?',
        zh: '可以給我一個瑪芬嗎？',
        chunkId: 'can_i_get',
      },
      npc('rp_3', 'For here or to go?'),
      {
        id: 'rp_4',
        role: 'guide',
        speaker: 'player',
        en: 'To go, please.',
        zh: '外帶，謝謝。',
        chunkId: 'to_go',
      },
      npc('rp_5', 'Here you go.'),
    ],
  };

  it('builds one arrange question per player line, in order', () => {
    const turns = buildRolePlayTurns(unit, rp, makeRng(1));
    expect(turns.map((q) => q.itemId)).toEqual(['chunk:can_i_get', 'chunk:to_go']);
    expect(turns.every((q) => q.kind === 'arrange' && q.prompt === rolePlayPrompt())).toBe(true);
    expect(turns.every((q) => q.zhOnRequest)).toBe(true);
    expect(turns[0]!.audioId).toBe('cafe.line.rp_2');
    expect(turns[0]!.zh).toBe('可以給我一個瑪芬嗎？');
  });

  it('accepts the line, plus the chunk variants only when the line is the chunk', () => {
    const [muffin, toGo] = buildRolePlayTurns(unit, rp, makeRng(1));
    expect(muffin!.accepted).toEqual(['Can I get a muffin, please?']);
    const chunk = unit.chunks.find((c) => c.id === 'to_go')!;
    expect(toGo!.accepted).toEqual([chunk.en, ...(chunk.accept ?? [])]);
    expect(gradeAnswer('Can I get a muffin please', muffin!.accepted).correct).toBe(true);
  });

  it.each([1, 2, 3, 4, 5, 6])('shuffles the line into blocks, never in order (seed %i)', (seed) => {
    for (const q of buildRolePlayTurns(unit, rp, makeRng(seed))) {
      const words = q.accepted[0]!.split(/\s+/).map((w) => w.replace(/[,.?!]+$/, ''));
      expect([...q.blocks].sort()).toEqual([...words].sort());
      expect(gradeAnswer(q.blocks.join(' '), q.accepted).correct).toBe(false);
    }
  });

  it('shows every line before each turn, then the whole scene', () => {
    expect([0, 1, 2].map((turn) => rolePlayShown(rp.scene, turn))).toEqual([1, 3, 5]);
  });

  it('is one arrange step per turn without 跟我說', () => {
    const turns = buildRolePlayTurns(unit, rp, makeRng(1));
    const steps = rolePlaySteps(rp.scene, turns, false);
    expect(steps.map((s) => s.question)).toEqual(turns);
    expect(steps.map((s) => s.shown)).toEqual([1, 3]);
  });

  it('adds a 跟我說 step after each turn, with the built line already in the chat', () => {
    const turns = buildRolePlayTurns(unit, rp, makeRng(1));
    const steps = rolePlaySteps(rp.scene, turns, true);
    expect(steps.map((s) => s.question.kind)).toEqual(['arrange', 'speak', 'arrange', 'speak']);
    expect(steps.map((s) => s.shown)).toEqual([1, 2, 3, 4]);
    const say = steps[1]!.question;
    expect(say).toEqual({
      kind: 'speak',
      audioId: 'cafe.line.rp_2',
      en: 'Can I get a muffin, please?',
      zh: '可以給我一個瑪芬嗎？',
      itemId: 'chunk:can_i_get',
    });
  });
});

describe('spelling questions (打字拼字)', () => {
  const moveIn = moveInJson as Unit;
  const units = [moveIn, unit];
  const t7 = unit.tasks[6]!;
  const withSpell = (ids: string[]): Task => ({ ...t7, spellWordIds: ids });

  it('spells words from this unit or an earlier one, after arrange and before speak', () => {
    const qs = buildTaskPractice(unit, withSpell(['key', 'tea']), makeRng(1), units);
    const kinds = qs.map((q) => q.kind);
    const spells = qs.filter((q): q is SpellQuestion => q.kind === 'spell');
    expect(spells.map((q) => q.answer)).toEqual(['key', 'tea']);
    expect(kinds.indexOf('spell')).toBeGreaterThan(kinds.lastIndexOf('arrange'));
    expect(kinds.lastIndexOf('spell')).toBeLessThan(kinds.indexOf('speak'));
    expect(spells[0]).toEqual({
      kind: 'spell',
      audioId: 'move_in.word.key',
      answer: 'key',
      zh: '鑰匙',
      wordId: 'key',
      emoji: expect.any(String),
      itemId: 'word:key',
    });
    expect(spells[1]?.audioId).toBe('cafe.word.tea');
  });

  it('skips unknown words and words that are not one plain word', () => {
    const qs = buildTaskPractice(unit, withSpell(['nope', 'trash_can', 'key']), makeRng(1), units);
    expect(qs.filter((q) => q.kind === 'spell').map((q) => q.itemId)).toEqual(['word:key']);
  });

  it('looks only in the task’s own unit unless other units are given', () => {
    const qs = buildTaskPractice(unit, withSpell(['key', 'tea']), makeRng(1));
    expect(qs.filter((q) => q.kind === 'spell').map((q) => q.itemId)).toEqual(['word:tea']);
  });

  it('a task without spellWordIds has no spelling questions', () => {
    const qs = buildTaskPractice(unit, t7, makeRng(1), units);
    expect(qs.some((q) => q.kind === 'spell')).toBe(false);
  });
});

describe('spellMarks', () => {
  it('marks each typed letter right or wrong by position', () => {
    expect(spellMarks('kay', 'key')).toEqual(['right', 'wrong', 'right']);
    expect(spellMarks('key', 'key')).toEqual(['right', 'right', 'right']);
  });

  it('marks letters past the answer, and ignores case', () => {
    expect(spellMarks('KEYS', 'key')).toEqual(['right', 'right', 'right', 'wrong']);
    expect(spellMarks('', 'key')).toEqual([]);
  });
});

describe('listening cloze questions (聽力填空)', () => {
  const units = [moveInJson as Unit, unit];
  // café t1: "Hi! What can I get for you?" / "Can I get a latte, please?" / "Sure! Anything else?"
  const t1 = unit.tasks[0]!;
  const clozeOf = (items: NonNullable<Task['cloze']>) =>
    buildTaskPractice(unit, { ...t1, cloze: items }, makeRng(3), units);
  const only = (qs: Question[]) => qs.filter((q): q is ClozeQuestion => q.kind === 'cloze');

  it('cuts the line at the word and offers it with the wrong words', () => {
    const [q] = only(clozeOf([{ lineId: 't1_1', word: 'get', distractors: ['sit', 'read'] }]));
    expect(q).toMatchObject({
      kind: 'cloze',
      audioId: 'cafe.line.t1_1',
      before: 'Hi! What can I ',
      answer: 'get',
      after: ' for you?',
      zh: t1.scene[0]!.zh,
    });
    expect(q!.options.map((o) => o.label).sort()).toEqual(['get', 'read', 'sit']);
    expect(q!.options.find((o) => o.id === q!.correctId)?.label).toBe('get');
    expect(new Set(q!.options.map((o) => o.id)).size).toBe(3);
  });

  it('comes after the listen-and-pick questions and before choosing a reply', () => {
    const kinds = clozeOf([{ lineId: 't1_1', word: 'get', distractors: ['sit', 'read'] }]).map(
      (q) => q.kind,
    );
    expect(kinds.indexOf('cloze')).toBeGreaterThan(kinds.lastIndexOf('listen-pick'));
    expect(kinds.indexOf('cloze')).toBeLessThan(kinds.indexOf('choose-reply'));
  });

  it('finds the word in any case and gives every option a capital at the start of a line', () => {
    const [q] = only(clozeOf([{ lineId: 't1_1', word: 'hi', distractors: ['yes', 'sure'] }]));
    expect(q).toMatchObject({ before: '', answer: 'Hi', after: '! What can I get for you?' });
    expect(q!.options.map((o) => o.label).sort()).toEqual(['Hi', 'Sure', 'Yes']);
  });

  it('matches whole words only and skips an item whose word or line is missing', () => {
    // "a" must not match inside "can" or "latte"
    const [q] = only(clozeOf([{ lineId: 't1_2', word: 'a', distractors: ['an', 'the'] }]));
    expect(q).toMatchObject({ before: 'Can I get ', answer: 'a', after: ' latte, please?' });
    expect(only(clozeOf([{ lineId: 't1_1', word: 'tea', distractors: ['a', 'b'] }]))).toEqual([]);
    expect(only(clozeOf([{ lineId: 'nope', word: 'get', distractors: ['a', 'b'] }]))).toEqual([]);
  });

  it('is scheduled as the taught word, else as the line’s chunk, else not at all', () => {
    const ids = only(
      clozeOf([
        { lineId: 't1_2', word: 'latte', distractors: ['tea', 'cake'] },
        { lineId: 't1_2', word: 'get', distractors: ['sit', 'read'] },
        { lineId: 't1_1', word: 'get', distractors: ['sit', 'read'] },
        { lineId: 't1_1', word: 'Hi', distractors: ['Key', 'Box'] },
      ]),
    ).map((q) => q.itemId);
    expect(ids).toEqual(['word:latte', 'chunk:can_i_get', '', '']);
  });
});

describe('a cloze on the plural of a taught word', () => {
  const units = [moveInJson as Unit, unit];
  const t1 = unit.tasks[0]!;
  const line = (en: string): Task['scene'][number] => ({
    id: 'x1',
    role: 'barista',
    speaker: 'npc',
    en,
    zh: en,
  });
  const itemIdOf = (en: string, word: string) =>
    buildTaskPractice(
      unit,
      {
        ...t1,
        scene: [line(en)],
        cloze: [{ lineId: 'x1', word, distractors: ['seats', 'tables'] }],
      },
      makeRng(3),
      units,
    ).find((q): q is ClozeQuestion => q.kind === 'cloze')?.itemId;

  it('is scheduled as that word (-s and -es)', () => {
    expect(itemIdOf('Two cookies, please.', 'cookies')).toBe('word:cookie');
    expect(itemIdOf('Where are the boxes?', 'boxes')).toBe('word:box');
    expect(itemIdOf('Two sandwiches, please.', 'sandwiches')).toBe('word:sandwich');
  });

  it('prefers the word itself, and leaves other words alone', () => {
    expect(itemIdOf('A cookie, please.', 'cookie')).toBe('word:cookie');
    expect(itemIdOf('Yes, it is.', 'is')).toBe('');
  });
});

describe('sign questions (讀招牌／價目)', () => {
  const t1 = unit.tasks[0]!;
  const sign = {
    id: 'menu',
    heading: 'Drinks',
    rows: [
      { label: 'Tea', value: '$2' },
      { label: 'Latte', value: '$4' },
    ],
    question: { en: 'How much is a latte?', zh: '拿鐵多少錢？' },
    options: ['$2', '$4', '$6'],
    answer: 1,
  };
  const qs = buildTaskPractice(unit, { ...t1, signs: [sign] }, makeRng(5));
  const signs = qs.filter((q): q is SignQuestion => q.kind === 'read-sign');

  it('shows the sign and its question, with the options in a shuffled order', () => {
    expect(signs).toHaveLength(1);
    const q = signs[0]!;
    expect(q).toMatchObject({
      heading: 'Drinks',
      rows: sign.rows,
      en: 'How much is a latte?',
      zh: '拿鐵多少錢？',
      itemId: '',
    });
    expect(q.options.map((o) => o.label).sort()).toEqual(['$2', '$4', '$6']);
    expect(q.options.find((o) => o.id === q.correctId)?.label).toBe('$4');
  });

  it('comes after choosing a reply and before arranging', () => {
    const kinds = qs.map((q) => q.kind);
    expect(kinds.indexOf('read-sign')).toBeGreaterThan(kinds.lastIndexOf('choose-reply'));
    expect(kinds.indexOf('read-sign')).toBeLessThan(kinds.indexOf('arrange'));
  });
});

describe('picture questions (看圖選句)', () => {
  const t1 = unit.tasks[0]!;
  const picture = {
    id: 'p1',
    pictureId: 'reading_book',
    options: [
      { en: 'She is drinking tea.', zh: '她在喝茶。' },
      { en: 'She is reading a book.', zh: '她在看書。' },
    ],
    answer: 1,
  };
  const qs = buildTaskPractice(unit, { ...t1, pictures: [picture] }, makeRng(5));
  const pictures = qs.filter((q): q is PictureQuestion => q.kind === 'picture');

  it('shows the picture with its sentences and speaks the right one', () => {
    expect(pictures).toHaveLength(1);
    const q = pictures[0]!;
    expect(q).toMatchObject({ pictureId: 'reading_book', audioId: 'cafe.picture.p1', itemId: '' });
    expect(q.options.map((o) => o.en).sort()).toEqual(picture.options.map((o) => o.en).sort());
    const right = q.options.find((o) => o.id === q.correctId);
    expect(right).toMatchObject({ en: 'She is reading a book.', zh: '她在看書。' });
  });

  it('comes after choosing a reply and before arranging', () => {
    const kinds = qs.map((q) => q.kind);
    expect(kinds.indexOf('picture')).toBeGreaterThan(kinds.lastIndexOf('choose-reply'));
    expect(kinds.indexOf('picture')).toBeLessThan(kinds.indexOf('arrange'));
  });
});
