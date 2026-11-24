import { describe, expect, it } from 'vitest';
import { ACTS, type Act } from '../src/content/acts';
import { UNITS } from '../src/content/units';
import { createEmptySave, mergeSaves, sanitizeSave, type SaveData } from '../src/core/save';
import { buildSprintQuestions, makeRng } from '../src/learning/questionGen';
import { newStoredCard } from '../src/learning/scheduler';
import { taskKey } from '../src/learning/sessionPlan';
import {
  chooseRoute,
  dailyNewWordGoal,
  declineExtend,
  extendSprint,
  finishReview,
  finishSprint,
  reviewLimit,
  sprintCandidates,
  sprintEndDate,
  sprintPlan,
  sprintWeek,
  sprintWeeks,
  sprintWindow,
  townWordIds,
} from '../src/learning/sprint';
import { buildTown } from '../src/learning/townPlan';

const now = new Date(2026, 10, 24, 10, 0, 0);
const day = (offset: number) => new Date(2026, 10, 24 + offset, 10, 0, 0);

/** A unit whose task i teaches words `${id}${i}a` and `${id}${i}b`. */
const unit = (id: string, tasks = 2) => ({
  id,
  title: id,
  tasks: Array.from({ length: tasks }, (_, i) => ({
    id: `t${i + 1}`,
    newWordIds: [`${id}${i + 1}a`, `${id}${i + 1}b`],
  })),
});

const acts: Act[] = [
  {
    no: '一',
    title: 'first',
    places: [
      { unitId: 'a', title: 'A' },
      { unitId: 'b', title: 'B' },
    ],
  },
  { no: '二', title: 'second', places: [{ unitId: 'c', title: 'C' }] },
];
const town = buildTown(acts, [unit('a'), unit('b'), unit('c')]);

function saveWith(tasks: string[], cards: string[] = []): SaveData {
  const save = createEmptySave(now);
  for (const key of tasks) {
    const [u = '', t = ''] = key.split('/');
    save.tasks[taskKey(u, t)] = { stars: 2, plays: 1 };
  }
  for (const id of cards) save.cards[id] = newStoredCard(now);
  return save;
}

describe('routes', () => {
  it('starts every save on the normal route', () => {
    expect(createEmptySave(now).route).toEqual({ kind: 'normal', start: null });
  });

  it('starts the sprint today and keeps the start when going back to normal', () => {
    const sprint = chooseRoute(createEmptySave(now), 'sprint', now);
    expect(sprint.route).toEqual({ kind: 'sprint', start: '2026-11-24' });
    expect(chooseRoute(sprint, 'sprint', day(3))).toBe(sprint);
    expect(chooseRoute(sprint, 'normal', day(3)).route).toEqual({
      kind: 'normal',
      start: '2026-11-24',
    });
  });

  it('counts sprint weeks from the start day and ends after 12 weeks', () => {
    const route = { kind: 'sprint', start: '2026-11-24' } as const;
    expect(sprintWeek(route, now)).toBe(1);
    expect(sprintWeek(route, day(6))).toBe(1);
    expect(sprintWeek(route, day(7))).toBe(2);
    expect(sprintWeek(route, day(-3))).toBe(1);
    expect(sprintWeek({ kind: 'normal', start: null }, now)).toBe(0);
    expect(sprintEndDate('2026-11-24')).toBe('2027-02-15');
  });

  it('sets new words a day by route and week', () => {
    const route = { kind: 'sprint', start: '2026-11-24' } as const;
    expect(dailyNewWordGoal({ kind: 'normal', start: null }, now, 2501)).toBe(10);
    expect(dailyNewWordGoal({ kind: 'normal', start: null }, now, 4)).toBe(4);
    expect(dailyNewWordGoal(route, now, 2501)).toBe(15);
    expect(dailyNewWordGoal(route, day(7), 2501)).toBe(25);
    expect(dailyNewWordGoal(route, day(77), 2501)).toBe(0);
  });

  it('spreads the words left over the days up to the next-to-last week from week 3', () => {
    const route = { kind: 'sprint', start: '2026-11-24' } as const;
    // Week 3 starts on day 14; 63 days are left before week 12.
    expect(dailyNewWordGoal(route, day(14), 2221)).toBe(36);
    expect(dailyNewWordGoal(route, day(14), 100)).toBe(10);
    expect(dailyNewWordGoal(route, day(14), 5000)).toBe(50);
    expect(dailyNewWordGoal(route, day(76), 30)).toBe(30);
    expect(dailyNewWordGoal(route, day(14), 6)).toBe(6);
  });

  it('extends the sprint by 4 weeks: a later end, fewer words a day', () => {
    const start = chooseRoute(createEmptySave(now), 'sprint', now);
    const longer = extendSprint(start, day(20));
    expect(longer.route).toEqual({
      kind: 'sprint',
      start: '2026-11-24',
      weeks: 16,
      askedOn: '2026-12-14',
    });
    expect(sprintWeeks(longer.route)).toBe(16);
    expect(sprintEndDate('2026-11-24', 16)).toBe('2027-03-15');
    // Week 12 still teaches on a 16-week sprint: 28 days are left before week 16.
    expect(dailyNewWordGoal(longer.route, day(77), 560)).toBe(20);
    expect(declineExtend(start, day(20)).route).toEqual({
      kind: 'sprint',
      start: '2026-11-24',
      askedOn: '2026-12-14',
    });
  });

  it('keeps an extension when going back to normal; a new sprint starts at 12 weeks', () => {
    const longer = extendSprint(chooseRoute(createEmptySave(now), 'sprint', now), day(20));
    const normal = chooseRoute(longer, 'normal', day(21));
    expect(normal.route).toMatchObject({ kind: 'normal', weeks: 16 });
    expect(chooseRoute(normal, 'sprint', day(22)).route).toEqual({
      kind: 'sprint',
      start: '2026-12-16',
    });
  });

  it('gives the sprint route a larger review cap', () => {
    expect(reviewLimit({ kind: 'normal', start: null })).toBe(20);
    expect(reviewLimit({ kind: 'sprint', start: '2026-11-24' })).toBe(200);
  });
});

describe('save fields', () => {
  it('loads an old save (no route, no new counters) on the normal route', () => {
    const old = { version: 1, cards: {}, daily: { date: '2026-11-24', answered: 3 } };
    const save = sanitizeSave(old, now);
    expect(save.route).toEqual({ kind: 'normal', start: null });
    expect(save.daily).toMatchObject({ answered: 3, sprintNew: 0, reviewed: 0 });
  });

  it('keeps a sprint route and drops one without a start day', () => {
    const kept = sanitizeSave({ route: { kind: 'sprint', start: '2026-11-20' } }, now);
    expect(kept.route).toEqual({ kind: 'sprint', start: '2026-11-20' });
    const broken = sanitizeSave({ route: { kind: 'sprint', start: 'soon' } }, now);
    expect(broken.route).toEqual({ kind: 'normal', start: null });
  });

  it('keeps a sane extension and ask day, drops bad ones', () => {
    const route = { kind: 'sprint', start: '2026-11-20', weeks: 16, askedOn: '2026-12-01' };
    expect(sanitizeSave({ route }, now).route).toEqual(route);
    for (const weeks of [12, 11, 16.5, 99, '16']) {
      expect(sanitizeSave({ route: { ...route, weeks } }, now).route.weeks).toBeUndefined();
    }
    expect(
      sanitizeSave({ route: { ...route, askedOn: 'soon' } }, now).route.askedOn,
    ).toBeUndefined();
  });

  it('merges two tabs on one sprint: the longer length and the later ask', () => {
    const sprint = chooseRoute(createEmptySave(now), 'sprint', now);
    const ours = declineExtend(sprint, day(30));
    const theirs = extendSprint(sprint, day(20));
    expect(mergeSaves(ours, theirs).route).toEqual({
      kind: 'sprint',
      start: '2026-11-24',
      weeks: 16,
      askedOn: '2026-12-24',
    });
    // A different sprint in the other tab: ours wins whole.
    const other = extendSprint(chooseRoute(createEmptySave(day(1)), 'sprint', day(1)), day(2));
    expect(mergeSaves(ours, other).route).toEqual(ours.route);
  });

  it('merges two tabs: our route, the larger counters', () => {
    const ours = finishSprint(chooseRoute(createEmptySave(now), 'sprint', now), 5, now);
    const theirs = finishReview(finishSprint(createEmptySave(now), 10, now), 7, now);
    const merged = mergeSaves(ours, theirs);
    expect(merged.route.kind).toBe('sprint');
    expect(merged.daily).toMatchObject({ sprintNew: 10, reviewed: 7 });
  });

  it('counts finished rounds for today only', () => {
    const save = finishSprint(finishSprint(createEmptySave(now), 10, now), 5, now);
    expect(save.daily.sprintNew).toBe(15);
    expect(finishSprint(save, 3, day(1)).daily).toMatchObject({
      sprintNew: 3,
      date: '2026-11-25',
    });
  });
});

describe('sprintWindow', () => {
  it('starts at the first place and the next one on a new save', () => {
    expect(sprintWindow(town, createEmptySave(now)).map((u) => u.id)).toEqual(['a', 'b']);
  });

  it('follows the furthest place played', () => {
    expect(sprintWindow(town, saveWith(['b/t1'])).map((u) => u.id)).toEqual(['b']);
  });

  it('never crosses into the next act, even once it is open', () => {
    const act1 = ['a/t1', 'a/t2', 'b/t1', 'b/t2'];
    expect(sprintWindow(town, saveWith(act1)).map((u) => u.id)).toEqual(['b']);
    expect(sprintWindow(town, saveWith([...act1, 'c/t1'])).map((u) => u.id)).toEqual(['c']);
  });
});

describe('sprintCandidates and sprintPlan', () => {
  it('lists the window words in play order, skipping ones with a card', () => {
    expect(sprintCandidates(town, createEmptySave(now))).toEqual([
      'word:a1a',
      'word:a1b',
      'word:a2a',
      'word:a2b',
      'word:b1a',
      'word:b1b',
      'word:b2a',
      'word:b2b',
    ]);
    expect(sprintCandidates(town, saveWith([], ['word:a1a', 'word:b2b']))).toHaveLength(6);
  });

  it('says the goal is met before asking for reviews', () => {
    const done = finishSprint(createEmptySave(now), 10, now);
    expect(sprintPlan(town, done, now, 3).status).toBe('goal-met');
  });

  it('asks for reviews first', () => {
    expect(sprintPlan(town, createEmptySave(now), now, 3)).toMatchObject({
      status: 'review-first',
      words: [],
    });
  });

  it('gives at most 10 words and no more than the goal leaves', () => {
    const big = buildTown(acts, [unit('a', 8), unit('b', 8), unit('c')]);
    const fresh = createEmptySave(now);
    expect(sprintPlan(big, fresh, now, 0).words).toHaveLength(10);
    const almost = finishSprint(fresh, 7, now);
    expect(sprintPlan(big, almost, now, 0)).toMatchObject({ status: 'ready', today: 7, goal: 10 });
    expect(sprintPlan(big, almost, now, 0).words).toHaveLength(3);
    expect(sprintPlan(big, finishSprint(fresh, 10, now), now, 0).status).toBe('goal-met');
  });

  it('waits for the story once the window is taught', () => {
    const cards = sprintCandidates(town, createEmptySave(now));
    expect(sprintPlan(town, saveWith([], cards), now, 0).status).toBe('caught-up');
  });
});

describe('buildSprintQuestions', () => {
  const cafe = UNITS.find((u) => u.id === 'cafe');
  const store = UNITS.find((u) => u.id === 'store');
  if (!cafe || !store) throw new Error('missing units');

  it('makes one listen-pick per word with its own audio and options from the pool', () => {
    const entries = [
      { unit: cafe, word: cafe.words[0]! },
      { unit: store, word: store.words[0]! },
    ];
    const questions = buildSprintQuestions(entries, [...cafe.words, ...store.words], makeRng(1));
    expect(questions).toHaveLength(2);
    for (const q of questions) {
      if (q.kind !== 'listen-pick') throw new Error('not listen-pick');
      expect(q.options).toHaveLength(4);
      expect(q.options.map((o) => o.id)).toContain(q.correctId);
      expect(q.itemId).toBe(`word:${q.correctId}`);
      const home = cafe.words.some((w) => w.id === q.correctId) ? 'cafe' : 'store';
      expect(q.audioId).toBe(`${home}.word.${q.correctId}`);
    }
  });

  it('takes wrong options from another place when the pool has no others', () => {
    const word = cafe.words[0]!;
    const [q] = buildSprintQuestions([{ unit: cafe, word }], store.words, makeRng(2));
    if (q?.kind !== 'listen-pick') throw new Error('not listen-pick');
    expect(q.options).toHaveLength(4);
  });
});

describe('the real town', () => {
  it('counts every word of the four acts once', () => {
    const ids = townWordIds(buildTown(ACTS, UNITS));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThan(2400);
  });

  it('teaches from 搬家第一天 and 咖啡廳 on a new save', () => {
    const real = buildTown(ACTS, UNITS);
    expect(sprintWindow(real, createEmptySave(now)).map((u) => u.id)).toEqual(['move_in', 'cafe']);
    const plan = sprintPlan(real, createEmptySave(now), now, 0);
    expect(plan.status).toBe('ready');
    expect(plan.words).toHaveLength(10);
  });
});
