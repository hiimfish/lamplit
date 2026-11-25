/**
 * 開發測試 (development only, DEV_TOOLS): what the dev list in the town plays. Every
 * question kind gets a few real questions from the content; the daily screens get the
 * first place's content when today has nothing for them, so each one can be opened and
 * tried at any time.
 */
import { GRAMMAR_POINTS } from '../../content/grammar';
import type { GrammarPoint } from '../../content/grammar';
import { GRAMMAR_BANK } from '../../content/grammarBank';
import type { Task, Unit, Word } from '../../content/types';
import { UNITS } from '../../content/units';
import { appStore } from '../../core/appState';
import { DEV_TOOLS } from '../../core/settings';
import { buildSprintQuestions, buildTaskPractice, makeRng } from '../../learning/questionGen';
import type { Question } from '../../learning/questions';

/** Opened from the dev list (and still in development): fall back instead of an empty screen. */
export function devFallback(): boolean {
  return DEV_TOOLS && appStore.get().devPlay === true;
}

export interface DevKind {
  key: string;
  label: string;
  matches: (q: Question) => boolean;
}

const kind =
  (k: Question['kind']) =>
  (q: Question): boolean =>
    q.kind === k;

/** Every minigame, in the order a task plays them (docs/specs/ui-flow.md). */
export const DEV_KINDS: readonly DevKind[] = [
  { key: 'listen-pick', label: '聽音選字', matches: kind('listen-pick') },
  { key: 'listen-pair', label: '聽辨挑戰', matches: kind('listen-pair') },
  { key: 'read-meaning', label: '看字選意思', matches: kind('read-meaning') },
  { key: 'listen-meaning', label: '聽字選意思', matches: kind('listen-meaning') },
  { key: 'cloze', label: '聽力填空', matches: kind('cloze') },
  { key: 'choose-reply', label: '選回應', matches: kind('choose-reply') },
  { key: 'read-sign', label: '讀招牌', matches: kind('read-sign') },
  { key: 'picture', label: '看圖選句', matches: (q) => q.kind === 'picture' && !q.listen },
  {
    key: 'picture-listen',
    label: '看圖選句（聽）',
    matches: (q) => q.kind === 'picture' && q.listen === true,
  },
  { key: 'fill', label: '句子填空', matches: kind('fill') },
  { key: 'text-fill', label: '短文填空', matches: kind('text-fill') },
  { key: 'read-passage', label: '讀短文', matches: kind('read-passage') },
  { key: 'talk', label: '聽對話答題', matches: kind('talk') },
  { key: 'respond', label: '應答題', matches: kind('respond') },
  { key: 'arrange', label: '排句子', matches: kind('arrange') },
  { key: 'spell', label: '打字拼字', matches: kind('spell') },
  { key: 'speak', label: '大聲說說看', matches: kind('speak') },
];

const SAMPLES = 3;

/** Up to three real questions of one kind, from the first places that have it. */
export function devSamples(key: string | undefined): Question[] {
  const wanted = DEV_KINDS.find((k) => k.key === key);
  if (!wanted) return [];
  const rng = makeRng(Date.now());
  const found: Question[] = [];
  if (key === 'read-meaning' || key === 'listen-meaning') {
    for (const unit of UNITS) {
      const entries = unit.words.map((word) => ({ unit, word }));
      for (const q of buildSprintQuestions(entries, unit.words, rng)) {
        if (wanted.matches(q)) found.push(q);
        if (found.length >= SAMPLES) return found;
      }
    }
    return found;
  }
  for (const unit of UNITS) {
    for (const task of unit.tasks) {
      if (task.kind === 'roleplay') continue;
      for (const q of buildTaskPractice(unit, task, rng, UNITS)) {
        if (wanted.matches(q)) found.push(q);
        if (found.length >= SAMPLES) return found;
      }
    }
  }
  return found;
}

const firstUnit = (): Unit | undefined => UNITS[0];

/** 今日複習 with nothing due: the first place's words and chunks. */
export function devReviewIds(): string[] {
  const unit = firstUnit();
  if (!unit) return [];
  return [
    ...unit.words.slice(0, 6).map((w) => `word:${w.id}`),
    ...unit.chunks.slice(0, 4).map((c) => `chunk:${c.id}`),
  ];
}

/** 單字快練 with no new words left today: five of the first place's words. */
export function devSprintEntries(): { unit: Unit; word: Word }[] {
  const unit = firstUnit();
  return unit ? unit.words.slice(0, 5).map((word) => ({ unit, word })) : [];
}

/** 聽力加量 before any story was played: the first place's first scene. */
export function devListenPick(): { unit: Unit; task: Task } | undefined {
  const unit = firstUnit();
  const task = unit?.tasks.find((t) => t.scene.length > 0);
  return unit && task ? { unit, task } : undefined;
}

/** 文法快練 with no grammar point open yet: the first three points that have questions. */
export function devGrammarPoints(): GrammarPoint[] {
  return GRAMMAR_POINTS.filter((p) => (GRAMMAR_BANK[p.id]?.length ?? 0) > 0).slice(0, 3);
}

type Place = { unit: Unit; task: Task };

/** The first story task and the first 角色扮演 task. */
export function devTasks(): { story?: Place; rolePlay?: Place } {
  let story: Place | undefined;
  let rolePlay: Place | undefined;
  for (const unit of UNITS) {
    for (const task of unit.tasks) {
      if (!story && task.kind !== 'roleplay') story = { unit, task };
      if (!rolePlay && task.kind === 'roleplay') rolePlay = { unit, task };
    }
    if (story && rolePlay) break;
  }
  return { story, rolePlay };
}
