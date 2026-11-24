import { useState } from 'preact/hooks';
import { playSfx } from '../audio/sfx';
import { appStore, commitSave, currentNow } from '../core/appState';
import type { Checkpoint } from '../core/save';
import { useStore } from '../core/store';
import {
  addCheckpoint,
  checkpointTarget,
  checkpointVerdict,
  clampScore,
  type Verdict,
} from '../learning/checkpoint';
import { EXTEND_WEEKS, extendSprint, sprintWeek, sprintWeeks } from '../learning/sprint';
import { useKeys } from './keys';
import { KeyCap } from './KeyCap';
import './goal.css';
import './progress.css';

/** Entries listed under the form. */
const LISTED = 5;

const VERDICT_WORDS: Record<Verdict, string> = {
  ahead: '超前',
  'on-track': '跟上了',
  behind: '落後',
};

/** Noon on a YYYY-MM-DD, to ask what the target was that day. */
const dayOf = (key: string): Date => {
  const [y = 0, m = 1, d = 1] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
};

const ACT_NAMES = ['一', '二', '三', '四'] as const;

/** Where the score came from: an ETS practice test, or a 幕結業考 (marked 重考 when sat again). */
function sourceLabel(entry: Checkpoint): string {
  if (entry.source !== 'exam' || !entry.act) return 'ETS 練習題';
  return `第${ACT_NAMES[entry.act - 1]}幕結業考（估計）${entry.retake ? '・重考' : ''}`;
}

const shortDate = (key: string): string => `${Number(key.slice(5, 7))}/${Number(key.slice(8))}`;

/** One part of the score: −50 −5 [ value ] +5 +50; the value is a spinbutton (←→ ±5, ↑↓ ±50). */
function ScoreField({
  label,
  value,
  onChange,
  testId,
}: {
  label: string;
  value: number;
  onChange: (update: (value: number) => number) => void;
  testId: string;
}) {
  const step = (by: number) => onChange((v) => clampScore(v + by));
  const onKey = (e: KeyboardEvent) => {
    const by = { ArrowRight: 5, ArrowLeft: -5, ArrowUp: 50, ArrowDown: -50 }[e.key];
    if (!by) return;
    e.preventDefault();
    step(by);
  };
  return (
    <div class="score-field" data-testid={testId}>
      <span class="score-label">{label}</span>
      <button
        type="button"
        class="pixel-button small"
        onClick={() => step(-50)}
        aria-label={`${label}減 50`}
      >
        −50
      </button>
      <button
        type="button"
        class="pixel-button small"
        onClick={() => step(-5)}
        aria-label={`${label}減 5`}
      >
        −5
      </button>
      <span
        class="score-value"
        role="spinbutton"
        tabIndex={0}
        aria-label={`${label}分數`}
        aria-valuemin={5}
        aria-valuemax={495}
        aria-valuenow={value}
        onKeyDown={onKey}
      >
        {value}
      </span>
      <button
        type="button"
        class="pixel-button small"
        onClick={() => step(5)}
        aria-label={`${label}加 5`}
      >
        +5
      </button>
      <button
        type="button"
        class="pixel-button small"
        onClick={() => step(50)}
        aria-label={`${label}加 50`}
      >
        +50
      </button>
    </div>
  );
}

/** 「總分 520，第 6 週的目標是 425：超前」, or just the total when there is no target. */
function entryWords(entry: Checkpoint, target: number | undefined, week: number): string {
  const total = entry.listening + entry.reading;
  const scores = `聽力 ${entry.listening}、閱讀 ${entry.reading}，總分 ${total}`;
  if (target === undefined) return scores;
  return `${scores}；第 ${week} 週的目標是 ${target}：${VERDICT_WORDS[checkpointVerdict(total, target)]}`;
}

/**
 * 檢查點 on the 進度 screen: the scores entered so far and, behind a key, a form to
 * add one. `onEditing` tells the screen to leave Enter and Esc to the form.
 */
export function CheckpointPanel({ onEditing }: { onEditing: (editing: boolean) => void }) {
  const { save } = useStore(appStore);
  const list = save.checkpoints;
  const latest = list[list.length - 1];
  const [editing, setEditing] = useState(false);
  const [listening, setListening] = useState(latest?.listening ?? 200);
  const [reading, setReading] = useState(latest?.reading ?? 200);
  /** The verdict of the score just entered, shown until the screen is left. */
  const [justSaved, setJustSaved] = useState<Verdict | undefined>(undefined);

  const now = currentNow();
  const target = checkpointTarget(save.route, now);
  const weekNow = Math.min(sprintWeek(save.route, now), sprintWeeks(save.route));

  const open = (on: boolean) => {
    playSfx('click');
    setEditing(on);
    onEditing(on);
  };
  const record = () => {
    playSfx('click');
    commitSave(addCheckpoint(appStore.get().save, currentNow(), listening, reading));
    setJustSaved(target === undefined ? undefined : checkpointVerdict(listening + reading, target));
    setEditing(false);
    onEditing(false);
  };
  const extend = () => {
    playSfx('click');
    commitSave(extendSprint(appStore.get().save, currentNow()));
    setJustSaved(undefined);
  };
  useKeys({ Enter: record, Back: () => open(false) }, editing);

  return (
    <section class="checkpoint" aria-labelledby="checkpoint-title" data-testid="checkpoint">
      <p class="flow-heading" id="checkpoint-title">
        分數紀錄
      </p>
      <p class="flow-note">
        {target === undefined
          ? save.route.kind === 'sprint'
            ? '衝刺第 3 週起會和計畫的目標比較。'
            : '做完 ETS 官方練習題後記下分數，看自己的進步。'
          : `衝刺第 ${weekNow} 週的目標：總分 ${target}。`}
      </p>

      {editing ? (
        <div class="checkpoint-form" data-testid="checkpoint-form">
          <ScoreField
            label="聽力"
            value={listening}
            onChange={setListening}
            testId="score-listening"
          />
          <ScoreField label="閱讀" value={reading} onChange={setReading} testId="score-reading" />
          <p class="flow-note">總分 {listening + reading}</p>
          <div class="flow-actions">
            <button
              class="pixel-button"
              onClick={() => open(false)}
              data-testid="checkpoint-cancel"
            >
              取消
              <KeyCap k="Back" />
            </button>
            <button class="pixel-button primary" onClick={record} data-testid="checkpoint-save">
              記下分數
              <KeyCap k="Enter" />
            </button>
          </div>
        </div>
      ) : (
        <div class="flow-actions">
          <button class="pixel-button" onClick={() => open(true)} data-testid="checkpoint-open">
            輸入 ETS 分數
          </button>
        </div>
      )}

      {justSaved === 'behind' && save.route.kind === 'sprint' && (
        <div class="goal-extend" role="group" aria-label="延長衝刺" data-testid="checkpoint-extend">
          <p class="flow-note">
            比目標低了一些。要把衝刺延長 {EXTEND_WEEKS} 週嗎？每天的量會變少。
          </p>
          <div class="goal-extend-keys">
            <button class="pixel-button primary" onClick={extend}>
              延長 {EXTEND_WEEKS} 週
            </button>
            <button class="pixel-button" onClick={() => setJustSaved(undefined)}>
              先不用
            </button>
          </div>
        </div>
      )}

      {list.length > 0 && (
        <ul class="checkpoint-list" data-testid="checkpoint-list">
          {list
            .slice(-LISTED)
            .reverse()
            .map((entry) => {
              const day = dayOf(entry.date);
              const week = Math.min(sprintWeek(save.route, day), sprintWeeks(save.route));
              return (
                <li
                  key={`${entry.date}/${entry.listening}/${entry.reading}/${entry.source ?? ''}/${entry.act ?? ''}`}
                >
                  {shortDate(entry.date)}：{sourceLabel(entry)}，
                  {entryWords(entry, checkpointTarget(save.route, day), week)}
                </li>
              );
            })}
        </ul>
      )}
      <p class="flow-note checkpoint-fine">
        結業考的分數是遊戲估計的，不是官方分數；請用 ETS 官方練習題確認。
      </p>
    </section>
  );
}
