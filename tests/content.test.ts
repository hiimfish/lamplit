import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import cafe from '../src/data/units/cafe.json';
import { ACTS, TASKS_PER_UNIT, actOf, type Act } from '../src/content/acts';
import type { Task, Unit } from '../src/content/types';
import { UNITS, getItem, getUnit, speakerOf, taskItemIds } from '../src/content/units';
import { validateUnit } from '../src/content/validate';
import { createEmptySave } from '../src/core/save';
import { buildRolePlayTurns, buildTaskPractice, makeRng } from '../src/learning/questionGen';
import { finishTask, isTaskUnlocked, taskKey } from '../src/learning/sessionPlan';
import { firstNewTask, nextStop, progressOf } from '../src/learning/townPlan';

const UNIT_DIR = join(__dirname, '..', 'src', 'data', 'units');
const unitFiles = readdirSync(UNIT_DIR).filter((f) => f.endsWith('.json'));

/** A fresh deep copy of the café unit to break on purpose. */
const copy = (): typeof cafe => JSON.parse(JSON.stringify(cafe));

describe('validateUnit on shipped content', () => {
  it('finds unit files', () => {
    expect(unitFiles.length).toBeGreaterThan(0);
  });

  it.each(unitFiles)('%s has no problems', (file) => {
    const unit: unknown = JSON.parse(readFileSync(join(UNIT_DIR, file), 'utf8'));
    expect(validateUnit(unit)).toEqual([]);
  });

  it('loads every shipped unit (none skipped)', () => {
    expect(UNITS).toHaveLength(unitFiles.length);
    expect(getUnit('cafe')?.id).toBe('cafe');
  });
});

describe('validateUnit catches broken content', () => {
  const problemsFor = (edit: (unit: ReturnType<typeof copy>) => void) => {
    const unit = copy();
    edit(unit);
    return validateUnit(unit);
  };

  it('rejects non-objects', () => {
    expect(validateUnit(null)).not.toEqual([]);
    expect(validateUnit([])).not.toEqual([]);
  });

  it('rejects ids that do not match [a-z0-9_]+', () => {
    expect(problemsFor((u) => (u.id = 'Cafe'))).not.toEqual([]);
    expect(problemsFor((u) => (u.chunks[0]!.id = 'can-i-get'))).not.toEqual([]);
    expect(problemsFor((u) => (u.words[0]!.id = 'Latte'))).not.toEqual([]);
    expect(problemsFor((u) => (u.tasks[0]!.id = 't 1'))).not.toEqual([]);
    expect(problemsFor((u) => (u.tasks[0]!.scene[0]!.id = 't1.1'))).not.toEqual([]);
  });

  it('rejects duplicate ids', () => {
    expect(problemsFor((u) => (u.chunks[1]!.id = u.chunks[0]!.id))).not.toEqual([]);
    expect(problemsFor((u) => (u.words[1]!.id = u.words[0]!.id))).not.toEqual([]);
    expect(problemsFor((u) => (u.tasks[1]!.id = u.tasks[0]!.id))).not.toEqual([]);
    expect(problemsFor((u) => (u.tasks[1]!.scene[0]!.id = u.tasks[0]!.scene[0]!.id))).not.toEqual(
      [],
    );
  });

  it('checks the shape of spellWordIds (words from earlier units are allowed)', () => {
    const spell = (ids: unknown) =>
      problemsFor((u) => Object.assign(u.tasks[6]!, { spellWordIds: ids }));
    expect(spell(['key', 'tea'])).toEqual([]);
    expect(spell([])).not.toEqual([]);
    expect(spell('key')).not.toEqual([]);
    expect(spell(['Key'])).not.toEqual([]);
    expect(spell(['key', 'key'])).not.toEqual([]);
  });

  describe('listening cloze (聽力填空)', () => {
    // café t1_1 is "Hi! What can I get for you?"
    const cloze = (value: unknown) =>
      problemsFor((u) => Object.assign(u.tasks[0]!, { cloze: value }));
    const item = (over: object = {}) => ({
      lineId: 't1_1',
      word: 'get',
      distractors: ['sit', 'read'],
      ...over,
    });

    it('accepts a word of a line of the task with 2 or 3 wrong words', () => {
      expect(cloze([item()])).toEqual([]);
      expect(cloze([item({ word: 'Hi', distractors: ['yes', 'no', 'okay'] })])).toEqual([]);
    });

    it('rejects a line of another task, a word not in the line, and bad wrong words', () => {
      expect(cloze([])).not.toEqual([]);
      expect(cloze('t1_1')).not.toEqual([]);
      expect(cloze([item({ lineId: 't2_1' })])).not.toEqual([]);
      expect(cloze([item({ word: 'latte' })])).not.toEqual([]);
      expect(cloze([item({ word: 'can I' })])).not.toEqual([]);
      expect(cloze([item({ distractors: ['sit'] })])).not.toEqual([]);
      expect(cloze([item({ distractors: ['sit', 'read', 'go', 'eat'] })])).not.toEqual([]);
      expect(cloze([item({ distractors: ['sit', 'Sit'] })])).not.toEqual([]);
      expect(cloze([item({ distractors: ['sit', 'Get'] })])).not.toEqual([]);
      expect(cloze([item(), item()])).not.toEqual([]);
    });
  });

  describe('signs to read (讀招牌／價目)', () => {
    const signs = (value: unknown) =>
      problemsFor((u) => Object.assign(u.tasks[0]!, { signs: value }));
    const sign = (over: object = {}) => ({
      id: 'menu',
      heading: 'Drinks',
      rows: [
        { label: 'Tea', value: '$2' },
        { label: 'Latte', value: '$4' },
      ],
      question: { en: 'How much is a latte?', zh: '拿鐵多少錢？' },
      options: ['$2', '$4', '$6'],
      answer: 1,
      ...over,
    });

    it('accepts a short sign with one question', () => {
      expect(signs([sign()])).toEqual([]);
      expect(signs([sign({ heading: undefined, rows: [{ label: 'Fitting Room' }] })])).toEqual([]);
    });

    it('rejects bad ids, empty or long signs, and bad questions or answers', () => {
      expect(signs([])).not.toEqual([]);
      expect(signs([sign({ id: 'Menu' })])).not.toEqual([]);
      expect(signs([sign(), sign()])).not.toEqual([]);
      expect(signs([sign({ rows: [] })])).not.toEqual([]);
      expect(signs([sign({ rows: [{ value: '$2' }] })])).not.toEqual([]);
      const long = Array.from({ length: 8 }, (_, i) => ({ label: `Tea ${i}`, value: '$2' }));
      expect(signs([sign({ rows: long })])).not.toEqual([]);
      expect(signs([sign({ question: { en: 'How much?' } })])).not.toEqual([]);
      expect(signs([sign({ options: ['$2'] })])).not.toEqual([]);
      expect(signs([sign({ options: ['$2', '$2', '$4'] })])).not.toEqual([]);
      expect(signs([sign({ answer: 3 })])).not.toEqual([]);
      expect(signs([sign({ answer: '1' })])).not.toEqual([]);
    });
  });

  describe('pictures to describe (看圖選句)', () => {
    const pictures = (value: unknown) =>
      problemsFor((u) => Object.assign(u.tasks[0]!, { pictures: value }));
    const picture = (over: object = {}) => ({
      id: 'p1',
      pictureId: 'reading',
      options: [
        { en: 'She is reading a book.', zh: '她在看書。' },
        { en: 'She is drinking tea.', zh: '她在喝茶。' },
      ],
      answer: 0,
      ...over,
    });

    it('accepts a picture with 2 to 4 sentences', () => {
      expect(pictures([picture()])).toEqual([]);
    });

    it('rejects bad ids, too few or repeated sentences, and a bad answer', () => {
      expect(pictures([])).not.toEqual([]);
      expect(pictures([picture({ id: 'P 1' })])).not.toEqual([]);
      expect(pictures([picture(), picture()])).not.toEqual([]);
      expect(pictures([picture({ pictureId: 'Reading!' })])).not.toEqual([]);
      const same = { en: 'She is reading a book.', zh: '她在看書。' };
      expect(pictures([picture({ options: [same] })])).not.toEqual([]);
      expect(pictures([picture({ options: [same, same] })])).not.toEqual([]);
      expect(pictures([picture({ options: [same, { en: 'She is sitting.' }] })])).not.toEqual([]);
      expect(pictures([picture({ answer: 2 })])).not.toEqual([]);
    });
  });

  it('keeps cloze, signs and pictures out of a role-play task', () => {
    const sign = {
      id: 's',
      rows: [{ label: 'Open' }],
      question: { en: 'Is it open?', zh: '有開嗎？' },
      options: ['Yes', 'No'],
      answer: 0,
    };
    expect(problemsFor((u) => Object.assign(u.tasks[0]!, { signs: [sign] }))).toEqual([]);
    expect(
      problemsFor((u) => Object.assign(u.tasks[u.tasks.length - 1]!, { signs: [sign] })),
    ).not.toEqual([]);
  });

  it('rejects unknown references and player lines with no chunk', () => {
    expect(problemsFor((u) => (u.tasks[0]!.newChunkIds as string[]).push('nope'))).not.toEqual([]);
    expect(problemsFor((u) => (u.tasks[0]!.newWordIds as string[]).push('nope'))).not.toEqual([]);
    const player = (u: ReturnType<typeof copy>) =>
      u.tasks[0]!.scene.find((l) => l.speaker === 'player') as { chunkId?: string };
    expect(problemsFor((u) => (player(u).chunkId = 'nope'))).not.toEqual([]);
    expect(problemsFor((u) => delete player(u).chunkId)).not.toEqual([]);
  });

  describe('stage cues', () => {
    const withStage = (stage: unknown) =>
      problemsFor((u) => {
        (u.tasks[0]!.scene[0] as { stage?: unknown }).stage = stage;
      });

    it('accepts want / give with a word of the unit, and ask with no item', () => {
      expect(withStage({ act: 'want', item: 'latte' })).toEqual([]);
      expect(withStage({ act: 'give', item: 'muffin' })).toEqual([]);
      expect(withStage({ act: 'ask' })).toEqual([]);
    });

    it('rejects a bad act, a missing or unknown item, and ask with an item', () => {
      expect(withStage({ act: 'wave' })).not.toEqual([]);
      expect(withStage({ act: 'want' })).not.toEqual([]);
      expect(withStage({ act: 'give', item: 'key' })).not.toEqual([]);
      expect(withStage({ act: 'give', item: 3 })).not.toEqual([]);
      expect(withStage({ act: 'ask', item: 'latte' })).not.toEqual([]);
      expect(withStage('want')).not.toEqual([]);
    });
  });
});

describe('ids across units', () => {
  // Save cards and getItem use `chunk:<id>` / `word:<id>` / `pair:<id>` with no unit prefix,
  // so the same id in two units would share one review card and resolve to the wrong unit.
  it('never reuses a chunk, word, pair or pair-side id in two units', () => {
    const seen = new Map<string, string>();
    const clashes: string[] = [];
    for (const unit of UNITS) {
      const ids = [
        ...unit.chunks.map((c) => `chunk:${c.id}`),
        ...unit.words.map((w) => `word:${w.id}`),
        ...(unit.pairs ?? []).map((p) => `pair:${p.id}`),
        ...(unit.pairs ?? []).flatMap((p) => [`side:${p.a.id}`, `side:${p.b.id}`]),
      ];
      for (const id of ids) {
        const owner = seen.get(id);
        if (owner && owner !== unit.id) clashes.push(`${id} in ${owner} and ${unit.id}`);
        seen.set(id, unit.id);
      }
    }
    expect(clashes).toEqual([]);
  });

  it('only spells words taught before the task (this unit or an earlier one)', () => {
    const taught = new Set<string>();
    const early: string[] = [];
    for (const unit of UNITS) {
      for (const task of unit.tasks) {
        for (const id of task.spellWordIds ?? []) {
          if (!taught.has(id)) early.push(`${unit.id}/${task.id} spells "${id}"`);
        }
        for (const id of task.newWordIds) taught.add(id);
      }
    }
    expect(early).toEqual([]);
  });

  it('plays the moving-in unit before the café', () => {
    expect(UNITS.map((u) => u.id).slice(0, 2)).toEqual(['move_in', 'cafe']);
  });
});

describe('getItem / taskItemIds', () => {
  it('looks up chunks and words with their audio ids', () => {
    expect(getItem('chunk:can_i_get')).toMatchObject({
      itemId: 'chunk:can_i_get',
      kind: 'chunk',
      unitId: 'cafe',
      audioId: 'cafe.chunk.can_i_get',
      role: 'guide',
    });
    expect(getItem('word:tea')).toMatchObject({
      kind: 'word',
      unitId: 'cafe',
      audioId: 'cafe.word.tea',
      emoji: expect.any(String),
    });
  });

  it('returns undefined for unknown or malformed ids', () => {
    for (const id of ['chunk:t1_2', 'word:can_i_get', 'chunk:', 'tea', 'line:t1_1', '']) {
      expect(getItem(id), id).toBeUndefined();
    }
  });

  it('lists a task’s items, chunks first, and every one resolves', () => {
    expect(taskItemIds({ newChunkIds: ['a', 'b'], newWordIds: ['c'] })).toEqual([
      'chunk:a',
      'chunk:b',
      'word:c',
    ]);
    for (const unit of UNITS) {
      for (const task of unit.tasks) {
        for (const id of taskItemIds(task)) expect(getItem(id), id).toBeDefined();
      }
    }
  });
});

describe('speakerOf', () => {
  it('a scene line is said by its role', () => {
    expect(speakerOf('cafe.line.t1_1')).toBe('barista');
    expect(speakerOf('cafe.line.t1_2')).toBe('guide');
    expect(speakerOf('move_in.line.t1_1')).toBe('landlord');
  });

  it('chunks, words and minimal pairs are said by the guide', () => {
    expect(speakerOf('cafe.chunk.can_i_get')).toBe('guide');
    expect(speakerOf('cafe.word.latte')).toBe('guide');
    expect(speakerOf('move_in.pair.fan')).toBe('guide');
  });

  it('unknown ids have no speaker', () => {
    for (const id of ['cafe.line.nope', 'nope.word.latte', 'latte', '']) {
      expect(speakerOf(id), id).toBeUndefined();
    }
  });
});

describe('role-play tasks', () => {
  interface RolePlayTask {
    id: string;
    title: string;
    kind: string;
    newChunkIds: string[];
    newWordIds: string[];
    newPairIds?: string[];
    scene: {
      id: string;
      role: string;
      speaker: string;
      en: string;
      zh: string;
      chunkId?: string;
    }[];
  }
  const rolePlay = (): RolePlayTask => ({
    id: 'rp',
    title: '角色扮演大挑戰',
    kind: 'roleplay',
    newChunkIds: [],
    newWordIds: [],
    scene: [
      { id: 'rp_1', role: 'barista', speaker: 'npc', en: 'Hi!', zh: '嗨！' },
      {
        id: 'rp_2',
        role: 'guide',
        speaker: 'player',
        en: 'Can I get a latte, please?',
        zh: '一杯拿鐵',
        chunkId: 'can_i_get',
      },
      {
        id: 'rp_3',
        role: 'barista',
        speaker: 'npc',
        en: 'For here or to go?',
        zh: '內用還是外帶？',
      },
      {
        id: 'rp_4',
        role: 'guide',
        speaker: 'player',
        en: 'To go, please.',
        zh: '外帶',
        chunkId: 'to_go',
      },
    ],
  });
  /** The café unit with its role-play replaced by this one after `edit` (put last, or first). */
  const problems = (edit: (task: RolePlayTask) => void = () => {}, first = false) => {
    const unit = copy();
    const task = rolePlay();
    edit(task);
    const tasks = unit.tasks as unknown[];
    tasks.pop();
    if (first) tasks.unshift(task);
    else tasks.push(task);
    return validateUnit(unit);
  };

  it('accepts a review of chunks taught earlier', () => {
    expect(problems()).toEqual([]);
  });

  it('rejects an unknown task kind', () => {
    expect(problems((t) => (t.kind = 'boss'))).not.toEqual([]);
  });

  it('rejects new items', () => {
    expect(problems((t) => t.newChunkIds.push('can_i_get'))).not.toEqual([]);
    expect(problems((t) => t.newWordIds.push('latte'))).not.toEqual([]);
    expect(problems((t) => (t.newPairIds = []))).not.toEqual([]);
  });

  it('needs an NPC line before every player line', () => {
    expect(problems((t) => t.scene.shift())).not.toEqual([]);
    expect(problems((t) => t.scene.splice(2, 1))).not.toEqual([]);
  });

  it('needs at least two turns', () => {
    expect(problems((t) => t.scene.splice(2))).not.toEqual([]);
  });

  it('rejects chunks not taught before it', () => {
    expect(problems(() => {}, true)).toContainEqual(expect.stringContaining('not taught before'));
  });

  it.each(UNITS.map((u) => u.id))('%s ends with a role-play, one turn per player line', (id) => {
    const unit = getUnit(id)!;
    const last = unit.tasks.at(-1)!;
    expect(last.kind).toBe('roleplay');
    expect(unit.tasks.filter((t) => t.kind === 'roleplay')).toHaveLength(1);
    const players = last.scene.filter((l) => l.speaker === 'player');
    expect(buildRolePlayTurns(unit, last, makeRng(1))).toHaveLength(players.length);
  });
});

describe('tasks per act', () => {
  /** Acts like ACTS but small: Act 1 holds "first", Act 3 holds "third" (Act 2 is empty). */
  const acts: Act[] = [
    { no: '一', title: 'a', places: [{ title: 'first', unitId: 'first' }] },
    { no: '二', title: 'b', places: [] },
    { no: '三', title: 'c', places: [{ title: 'third', unitId: 'third' }] },
  ];

  /** A unit with `count` tasks: t1..t(count-1) teach one chunk each, the last is the role-play. */
  const unitOf = (id: string, count: number): Unit => {
    const chunks = Array.from({ length: count - 1 }, (_, i) => ({
      id: `${id}_c${i + 1}`,
      en: `I can help you ${i + 1}.`,
      zh: '我可以幫你。',
    }));
    const tasks: Task[] = chunks.map((chunk, i) => ({
      id: `t${i + 1}`,
      title: `任務 ${i + 1}`,
      newChunkIds: [chunk.id],
      newWordIds: [],
      scene: [
        {
          id: `t${i + 1}_1`,
          role: 'manager',
          speaker: 'npc',
          en: 'Can you help?',
          zh: '可以幫忙嗎？',
        },
        {
          id: `t${i + 1}_2`,
          role: 'guide',
          speaker: 'player',
          en: chunk.en,
          zh: chunk.zh,
          chunkId: chunk.id,
        },
      ],
    }));
    tasks.push({
      id: `t${count}`,
      title: '角色扮演大挑戰',
      kind: 'roleplay',
      newChunkIds: [],
      newWordIds: [],
      scene: [chunks[0]!, chunks[1]!].flatMap((chunk, i) => [
        {
          id: `rp_${i}_1`,
          role: 'manager' as const,
          speaker: 'npc' as const,
          en: 'Hi!',
          zh: '嗨！',
        },
        {
          id: `rp_${i}_2`,
          role: 'guide' as const,
          speaker: 'player' as const,
          en: chunk.en,
          zh: chunk.zh,
          chunkId: chunk.id,
        },
      ]),
    });
    return { id, title: id, titleEn: id, chunks, words: [], tasks };
  };

  it('keeps 8 tasks in Acts 1 and 2, 9 in Act 3, the last one the role-play', () => {
    expect(TASKS_PER_UNIT.slice(0, 3)).toEqual([8, 8, 9]);
    expect(actOf('first', acts)).toBe(1);
    expect(actOf('third', acts)).toBe(3);
    expect(actOf('nowhere', acts)).toBe(0);
    expect(validateUnit(unitOf('first', 8), acts)).toEqual([]);
    expect(validateUnit(unitOf('third', 9), acts)).toEqual([]);
    expect(validateUnit(unitOf('first', 9), acts)).toEqual([
      expect.stringContaining('has 9 tasks; a unit of Act 1 has 8'),
    ]);
    expect(validateUnit(unitOf('third', 8), acts)).toEqual([
      expect.stringContaining('has 8 tasks; a unit of Act 3 has 9'),
    ]);
    // A unit in no act (a test unit) may have any number of tasks.
    expect(validateUnit(unitOf('nowhere', 5), acts)).toEqual([]);
  });

  it('needs the role-play last and only last', () => {
    const swapped = unitOf('third', 9);
    swapped.tasks.reverse();
    expect(validateUnit(swapped, acts)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('last task "t1" must be the role-play'),
        expect.stringContaining('task "t9" is a role-play; only the last'),
      ]),
    );
  });

  it('uses the real acts by default', () => {
    expect(actOf('airport', ACTS)).toBe(3);
    expect(actOf('cafe', ACTS)).toBe(1);
    expect(validateUnit(unitOf('airport', 9))).toEqual([]);
    expect(validateUnit(unitOf('airport', 8))).not.toEqual([]);
  });

  it('plays a 9-task unit: practice for every task, and finished when all 9 are done', () => {
    const unit = unitOf('third', 9);
    expect(unit.tasks).toHaveLength(9);
    for (const task of unit.tasks.slice(0, 8)) {
      expect(buildTaskPractice(unit, task, makeRng(1)).length, task.id).toBeGreaterThan(0);
    }
    expect(buildRolePlayTurns(unit, unit.tasks[8]!, makeRng(1))).toHaveLength(2);

    const now = new Date('2026-11-23T10:00:00');
    let save = createEmptySave(now);
    unit.tasks.forEach((task, i) => {
      expect(isTaskUnlocked(save, unit, i), task.id).toBe(true);
      expect(firstNewTask(save, unit)).toBe(i);
      save = finishTask(save, taskKey(unit.id, task.id), [], now).save;
    });
    expect(firstNewTask(save, unit)).toBe(-1);
    expect(nextStop(save, [unit])).toBeUndefined();
    expect(progressOf(save, [unit])).toMatchObject({ done: 9, total: 9, maxStars: 27 });
  });

  it('accepts a task backdrop that is a role or "main", nothing else', () => {
    const withBackdrop = (backdrop: unknown) => {
      const unit = unitOf('third', 9) as unknown as { tasks: Record<string, unknown>[] };
      unit.tasks[0]!.backdrop = backdrop;
      return validateUnit(unit, acts);
    };
    expect(withBackdrop('coworker')).toEqual([]);
    expect(withBackdrop('main')).toEqual([]);
    expect(withBackdrop('gate')).toEqual([expect.stringContaining('bad backdrop "gate"')]);
    expect(withBackdrop(3)).not.toEqual([]);
  });
});

describe('Act 4 units', () => {
  /**
   * A unit of Act 4 (presentation, by the real acts): t1-t8 teach one chunk of `chunkWords`
   * words and `words` new words each, t9 is the role-play.
   */
  const act4Unit = ({ chunkWords = 8, words = 10 } = {}): Unit => {
    const chunks = Array.from({ length: 8 }, (_, i) => ({
      id: `c${i + 1}`,
      en: ['Thank', 'you', ...Array.from({ length: chunkWords - 2 }, () => 'so')].join(' '),
      zh: '謝謝。',
    }));
    const allWords = Array.from({ length: 8 * words }, (_, i) => ({
      id: `w${i}`,
      en: `word${i}`,
      zh: '字',
      emoji: '🔤',
      abstract: true as const,
    }));
    const tasks: Task[] = chunks.map((chunk, i) => ({
      id: `t${i + 1}`,
      title: `任務 ${i + 1}`,
      newChunkIds: [chunk.id],
      newWordIds: allWords.slice(i * words, (i + 1) * words).map((w) => w.id),
      scene: [
        { id: `t${i + 1}_1`, role: 'manager', speaker: 'npc', en: 'Ready?', zh: '好了嗎？' },
        {
          id: `t${i + 1}_2`,
          role: 'guide',
          speaker: 'player',
          en: chunk.en,
          zh: chunk.zh,
          chunkId: chunk.id,
        },
      ],
    }));
    tasks.push({
      id: 't9',
      title: '角色扮演大挑戰',
      kind: 'roleplay',
      newChunkIds: [],
      newWordIds: [],
      scene: [chunks[0]!, chunks[1]!].flatMap((chunk, i) => [
        {
          id: `rp_${i}_1`,
          role: 'manager' as const,
          speaker: 'npc' as const,
          en: 'Hi!',
          zh: '嗨！',
        },
        {
          id: `rp_${i}_2`,
          role: 'guide' as const,
          speaker: 'player' as const,
          en: chunk.en,
          zh: chunk.zh,
          chunkId: chunk.id,
        },
      ]),
    });
    return {
      id: 'presentation',
      title: 'p',
      titleEn: 'p',
      chunks,
      words: allWords,
      tasks,
    };
  };

  it('has 9 tasks, the last the role-play, like Act 3', () => {
    expect(TASKS_PER_UNIT[3]).toBe(9);
    expect(actOf('presentation', ACTS)).toBe(4);
    expect(validateUnit(act4Unit())).toEqual([]);
    const eight = act4Unit();
    eight.tasks.splice(7, 1);
    expect(validateUnit(eight)).toContainEqual(
      expect.stringContaining('has 8 tasks; a unit of Act 4 has 9'),
    );
  });

  it('needs chunks of 5 to 14 words', () => {
    expect(validateUnit(act4Unit({ chunkWords: 5 }))).toEqual([]);
    expect(validateUnit(act4Unit({ chunkWords: 14 }))).toEqual([]);
    expect(validateUnit(act4Unit({ chunkWords: 4 }))).toContainEqual(
      expect.stringContaining('chunk "c1" has 4 words; an Act 4 chunk has 5 to 14'),
    );
    expect(validateUnit(act4Unit({ chunkWords: 15 }))).toContainEqual(
      expect.stringContaining('has 15 words'),
    );
  });

  it('needs 9 to 12 new words in every task that teaches, and 14 new items at most', () => {
    expect(validateUnit(act4Unit({ words: 9 }))).toEqual([]);
    expect(validateUnit(act4Unit({ words: 12 }))).toEqual([]);
    expect(validateUnit(act4Unit({ words: 8 }))).toContainEqual(
      expect.stringContaining('task "t1" teaches 8 new words; an Act 4 task teaches 9 to 12'),
    );
    expect(validateUnit(act4Unit({ words: 13 }))).toContainEqual(
      expect.stringContaining('teaches 13 new words'),
    );
    const crowded = act4Unit({ words: 12 });
    crowded.chunks.push(
      { id: 'x1', en: 'One more thing to say here.', zh: '再一句。' },
      { id: 'x2', en: 'And yet another thing here.', zh: '又一句。' },
    );
    crowded.tasks[0]!.newChunkIds.push('x1', 'x2');
    expect(validateUnit(crowded)).toEqual([
      expect.stringContaining(
        'task "t1" has 15 new items (chunks, words and pairs); an Act 4 task has at most 14',
      ),
    ]);
  });

  it('keeps 應答題 out of a role-play', () => {
    const unit = act4Unit() as unknown as { tasks: Record<string, unknown>[] };
    unit.tasks[8]!.responds = [];
    expect(validateUnit(unit)).toContainEqual(
      expect.stringContaining('is a role-play and must not have responds'),
    );
  });

  it('leaves the Act 1 to 3 units alone: no chunk or word-count rule there', () => {
    const short = { id: 'third', en: 'Hi.', zh: '嗨。' };
    const acts: Act[] = [
      { no: '一', title: 'a', places: [] },
      { no: '二', title: 'b', places: [] },
      { no: '三', title: 'c', places: [{ title: 'third', unitId: 'third' }] },
    ];
    const unit = { ...act4Unit({ words: 2 }), id: 'third' };
    unit.chunks = [...unit.chunks, short];
    expect(validateUnit(unit, acts)).toEqual([]);
  });
});
