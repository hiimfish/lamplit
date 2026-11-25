import { useState } from 'preact/hooks';
import { playSfx } from '../audio/sfx';
import { actName } from '../content/titles';
import { appStore, commitSave, currentNow } from '../core/appState';
import { t } from '../core/i18n';
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

const VERDICT_WORDS: Record<Verdict, [zh: string, en: string]> = {
  ahead: ['超前', 'ahead'],
  'on-track': ['跟上了', 'on track'],
  behind: ['落後', 'behind'],
};

/** Noon on a YYYY-MM-DD, to ask what the target was that day. */
const dayOf = (key: string): Date => {
  const [y = 0, m = 1, d = 1] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
};

/** Where the score came from: a TOEIC practice test, or a 幕結業考 (marked 重考 when sat again). */
function sourceLabel(entry: Checkpoint): string {
  if (entry.source !== 'exam' || !entry.act) return t('多益練習題', 'TOEIC practice test');
  return t(
    `${actName(entry.act)}結業考（估計）${entry.retake ? '・重考' : ''}`,
    `${actName(entry.act)} final exam (estimate)${entry.retake ? ' · retake' : ''}`,
  );
}

const shortDate = (key: string): string => `${Number(key.slice(5, 7))}/${Number(key.slice(8))}`;

/**
 * One part of the score: −50 −5 [ value ] +5 +50. The value is a number box: type a score
 * (kept within 5～495 in steps of 5 once you leave the box), or use ←→ ±5 and ↑↓ ±50.
 * The game's key map ignores keys typed in a field, so the box handles Enter and Esc itself.
 */
function ScoreField({
  label,
  value,
  onChange,
  onSubmit,
  onCancel,
  testId,
}: {
  label: string;
  value: number;
  onChange: (update: (value: number) => number) => void;
  onSubmit: () => void;
  onCancel: () => void;
  testId: string;
}) {
  /** What is being typed, until the box is left; null shows `value`. */
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    setDraft(null);
    onChange((v) => clampScore(v));
  };
  const step = (by: number) => {
    setDraft(null);
    onChange((v) => clampScore(v + by));
  };
  const onInput = (e: Event) => {
    const text = (e.currentTarget as HTMLInputElement).value;
    setDraft(text);
    const typed = Number(text);
    // Keep the raw number while typing (clamping "2" to 5 would fight the next digit).
    if (text.trim() !== '' && Number.isFinite(typed)) onChange(() => typed);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.isComposing) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
      onSubmit();
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
      return;
    }
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
        aria-label={t(`${label}減 50`, `${label} minus 50`)}
      >
        −50
      </button>
      <button
        type="button"
        class="pixel-button small"
        onClick={() => step(-5)}
        aria-label={t(`${label}減 5`, `${label} minus 5`)}
      >
        −5
      </button>
      <input
        type="number"
        inputMode="numeric"
        class="score-value"
        min={5}
        max={495}
        step={5}
        aria-label={t(`${label}分數`, `${label} score`)}
        value={draft ?? String(value)}
        onInput={onInput}
        onBlur={commit}
        onKeyDown={onKey}
      />
      <button
        type="button"
        class="pixel-button small"
        onClick={() => step(5)}
        aria-label={t(`${label}加 5`, `${label} plus 5`)}
      >
        +5
      </button>
      <button
        type="button"
        class="pixel-button small"
        onClick={() => step(50)}
        aria-label={t(`${label}加 50`, `${label} plus 50`)}
      >
        +50
      </button>
    </div>
  );
}

/** 「總分 520，第 6 週的目標是 425：超前」, or just the total when there is no target. */
function entryWords(entry: Checkpoint, target: number | undefined, week: number): string {
  const total = entry.listening + entry.reading;
  const scores = t(
    `聽力 ${entry.listening}、閱讀 ${entry.reading}，總分 ${total}`,
    `listening ${entry.listening}, reading ${entry.reading}, total ${total}`,
  );
  if (target === undefined) return scores;
  const verdict = t(...VERDICT_WORDS[checkpointVerdict(total, target)]);
  return t(
    `${scores}；第 ${week} 週的目標是 ${target}：${verdict}`,
    `${scores}; week ${week} target ${target}: ${verdict}`,
  );
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
    // A score still being typed is raw; keep it within 5～495 in steps of 5.
    const l = clampScore(listening);
    const r = clampScore(reading);
    commitSave(addCheckpoint(appStore.get().save, currentNow(), l, r));
    setJustSaved(target === undefined ? undefined : checkpointVerdict(l + r, target));
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
        {t('分數紀錄', 'Score log')}
      </p>
      <p class="flow-note">
        {target === undefined
          ? save.route.kind === 'sprint'
            ? t(
                '衝刺第 3 週起會和計畫的目標比較。',
                "From sprint week 3, scores are compared with the plan's target.",
              )
            : t(
                '做完多益（TOEIC）官方練習題後記下分數，看自己的進步。',
                'After an official TOEIC practice test, log your score to track progress.',
              )
          : t(
              `衝刺第 ${weekNow} 週的目標：總分 ${target}。`,
              `Sprint week ${weekNow} target: ${target} total.`,
            )}
      </p>

      {editing ? (
        <div class="checkpoint-form" data-testid="checkpoint-form">
          <ScoreField
            label={t('聽力', 'Listening')}
            value={listening}
            onChange={setListening}
            onSubmit={record}
            onCancel={() => open(false)}
            testId="score-listening"
          />
          <ScoreField
            label={t('閱讀', 'Reading')}
            value={reading}
            onChange={setReading}
            onSubmit={record}
            onCancel={() => open(false)}
            testId="score-reading"
          />
          <p class="flow-note">
            {t('總分', 'Total')} {clampScore(listening) + clampScore(reading)}
          </p>
          <div class="flow-actions">
            <button
              class="pixel-button"
              onClick={() => open(false)}
              data-testid="checkpoint-cancel"
            >
              {t('取消', 'Cancel')}
              <KeyCap k="Back" />
            </button>
            <button class="pixel-button primary" onClick={record} data-testid="checkpoint-save">
              {t('記下分數', 'Save score')}
              <KeyCap k="Enter" />
            </button>
          </div>
        </div>
      ) : (
        <div class="flow-actions">
          <button class="pixel-button" onClick={() => open(true)} data-testid="checkpoint-open">
            {t('輸入多益練習題分數', 'Enter a TOEIC practice score')}
          </button>
        </div>
      )}

      {justSaved === 'behind' && save.route.kind === 'sprint' && (
        <div
          class="goal-extend"
          role="group"
          aria-label={t('延長衝刺', 'Extend the sprint')}
          data-testid="checkpoint-extend"
        >
          <p class="flow-note">
            {t(
              `比目標低了一些。要把衝刺延長 ${EXTEND_WEEKS} 週嗎？每天的量會變少。`,
              `A bit below target. Extend the sprint by ${EXTEND_WEEKS} weeks? Each day gets lighter.`,
            )}
          </p>
          <div class="goal-extend-keys">
            <button class="pixel-button primary" onClick={extend}>
              {t(`延長 ${EXTEND_WEEKS} 週`, `Extend ${EXTEND_WEEKS} weeks`)}
            </button>
            <button class="pixel-button" onClick={() => setJustSaved(undefined)}>
              {t('先不用', 'Not now')}
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
                  {shortDate(entry.date)}
                  {t('：', ': ')}
                  {sourceLabel(entry)}
                  {t('，', ', ')}
                  {entryWords(entry, checkpointTarget(save.route, day), week)}
                </li>
              );
            })}
        </ul>
      )}
      <p class="flow-note checkpoint-fine">
        {t(
          '結業考的分數是遊戲估計的，不是官方分數；請用多益（TOEIC）官方練習題確認。',
          'Final exam scores are game estimates, not official scores. Check with official TOEIC practice tests.',
        )}
      </p>
    </section>
  );
}
