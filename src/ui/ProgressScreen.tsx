import { useEffect, useState } from 'preact/hooks';
import { playMusic } from '../audio/music';
import { playSfx } from '../audio/sfx';
import { actName } from '../content/titles';
import { appStore, currentNow } from '../core/appState';
import { t } from '../core/i18n';
import { dateKey, type DayRecord } from '../core/save';
import { backupReminder, daysSinceExport } from '../core/saveCode';
import { browserStorage } from '../core/storageKeys';
import { useStore } from '../core/store';
import {
  accuracy,
  learnedCounts,
  planDelta,
  recentDays,
  taskProgress,
  type PlanDelta,
} from '../learning/progress';
import { CheckpointPanel } from './CheckpointPanel';
import { useKeys } from './keys';
import { KeyCap } from './KeyCap';
import { MistakePanel } from './MistakePanel';
import { TOWN } from './TownScreen';
import './flow.css';
import './progress.css';

/** Days in the bar chart. */
const CHART_DAYS = 14;

const percent = (rate: number | null): string =>
  rate === null ? '—' : `${Math.round(rate * 100)}%`;

/** 「比計畫超前 3 天」, 「落後 2 天」 or 「剛好跟上」. */
function planLine(delta: PlanDelta): string {
  if (delta.days > 0) return t(`比計畫超前 ${delta.days} 天`, `${delta.days} days ahead of plan`);
  if (delta.days < 0) return t(`比計畫落後 ${-delta.days} 天`, `${-delta.days} days behind plan`);
  return t('剛好跟上計畫', 'Right on plan');
}

/** 11/28 from 2026-11-28. */
const shortDate = (key: string): string => `${Number(key.slice(5, 7))}/${Number(key.slice(8))}`;

/** One day in words, for the line under the chart and each bar's label. */
function dayWords(date: string, record: DayRecord, today: string): string {
  const name = `${shortDate(date)}${date === today ? t('（今天）', ' (today)') : ''}`;
  if (record.answered === 0 && record.tasks + record.listened + record.sprintNew === 0)
    return t(`${name}：沒有玩`, `${name}: not played`);
  const parts = [
    t(`劇情任務 ${record.tasks} 個`, `${record.tasks} story tasks`),
    t(`新字 ${record.sprintNew} 個`, `${record.sprintNew} new words`),
    t(`複習 ${record.reviewed} 題`, `${record.reviewed} reviewed`),
    t(`聽力 ${record.listened} 段`, `${record.listened} listened`),
  ];
  return t(
    `${name}：${parts.join('、')}${record.met ? '・✓ 目標全部完成' : ''}`,
    `${name}: ${parts.join(', ')}${record.met ? ' · ✓ all goals met' : ''}`,
  );
}

/**
 * 進度: on the sprint, how far ahead of or behind the plan the story is; then what
 * has been learned, recent accuracy, each act's tasks and the last 14 days.
 */
export function ProgressScreen() {
  const { save } = useStore(appStore);
  useEffect(() => playMusic('town'), []);
  const now = currentNow();
  const today = dateKey(now);
  const [picked, setPicked] = useState(today);
  const [editing, setEditing] = useState(false);

  // 進度 opens from the town's top bar only, so it goes back there.
  const toTown = () => {
    playSfx('click');
    appStore.set({ screen: 'town' });
  };
  useKeys({ Enter: toTown, Back: toTown }, !editing);

  const delta = planDelta(TOWN, save, now);
  const tasks = taskProgress(TOWN, save);
  const learned = learnedCounts(save);
  const week = accuracy(save, now, 7);
  const month = accuracy(save, now, 30);
  const days = recentDays(save, now, CHART_DAYS);
  const top = Math.max(1, ...days.map((d) => d.record.tasks));
  const shown = days.find((d) => d.date === picked) ?? days[days.length - 1];
  const reminder = backupReminder(save, daysSinceExport(browserStorage(), now));

  return (
    <div class="flow" data-testid="progress">
      <div class="flow-card progress-card">
        <h1 class="flow-title">{t('進度', 'Progress')}</h1>
        {reminder && (
          <p class="flow-note" data-testid="backup-reminder">
            {reminder}
          </p>
        )}

        {delta ? (
          <div class="progress-hero" data-testid="progress-plan">
            <p class="progress-big">{planLine(delta)}</p>
            <p class="flow-note">
              {t(
                `衝刺第 ${Math.min(delta.week, delta.weeks)}／${delta.weeks} 週。劇情任務玩了 ${delta.actual} 個，計畫到今天是 ${delta.planned} 個（共 ${delta.total} 個）。`,
                `Sprint week ${Math.min(delta.week, delta.weeks)}/${delta.weeks}. ${delta.actual} story tasks played; the plan has ${delta.planned} by today (${delta.total} in all).`,
              )}
            </p>
          </div>
        ) : (
          <div class="progress-hero" data-testid="progress-plan">
            <p class="progress-big">
              {t(
                `劇情任務 ${tasks.done}／${tasks.total}`,
                `Story tasks ${tasks.done}/${tasks.total}`,
              )}
            </p>
            <p class="flow-note">
              {t(
                '一般路線：照自己的步調玩。選衝刺路線會和 12 週計畫比較。',
                'Standard route: play at your own pace. The Sprint route compares you with a 12-week plan.',
              )}
            </p>
          </div>
        )}

        <dl class="progress-stats" data-testid="progress-stats">
          <div>
            <dt>{t('已學單字', 'Words learned')}</dt>
            <dd>{learned.words}</dd>
          </div>
          <div>
            <dt>{t('已學詞塊', 'Phrases learned')}</dt>
            <dd>{learned.chunks}</dd>
          </div>
          <div>
            <dt>{t('7 天答對率', '7-day accuracy')}</dt>
            <dd>{percent(week.rate)}</dd>
          </div>
          <div>
            <dt>{t('30 天答對率', '30-day accuracy')}</dt>
            <dd>{percent(month.rate)}</dd>
          </div>
        </dl>

        <p class="flow-heading">{t('各幕的劇情任務', 'Story tasks by act')}</p>
        <ul class="progress-acts" data-testid="progress-acts">
          {TOWN.map((act, i) => {
            const { done, total } = tasks.acts[i] ?? { done: 0, total: 0 };
            return (
              <li key={act.no}>
                <span class="progress-act-name">{actName(act.no)}</span>
                <span class="progress-meter" aria-hidden="true">
                  <span style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }} />
                </span>
                <span class="progress-act-count">
                  {done}/{total}
                </span>
              </li>
            );
          })}
        </ul>

        <p class="flow-heading" id="progress-days-title">
          {t(
            `最近 ${CHART_DAYS} 天完成的劇情任務`,
            `Story tasks done in the last ${CHART_DAYS} days`,
          )}
        </p>
        <div
          class="progress-chart"
          role="group"
          aria-labelledby="progress-days-title"
          data-testid="progress-chart"
        >
          {days.map(({ date, record }) => (
            <button
              key={date}
              type="button"
              class={`progress-day${date === shown?.date ? ' picked' : ''}`}
              aria-pressed={date === shown?.date}
              aria-label={dayWords(date, record, today)}
              onClick={() => setPicked(date)}
              onFocus={() => setPicked(date)}
            >
              <span class="progress-day-mark" aria-hidden="true">
                {record.met ? '✓' : ''}
              </span>
              <span class="progress-day-track" aria-hidden="true">
                <span
                  class="progress-day-bar"
                  style={{ height: `${(record.tasks / top) * 100}%` }}
                />
              </span>
              <span class="progress-day-date" aria-hidden="true">
                {Number(date.slice(8))}
              </span>
            </button>
          ))}
        </div>
        {shown && (
          <p class="flow-note progress-readout" aria-live="polite" data-testid="progress-day">
            {dayWords(shown.date, shown.record, today)}
          </p>
        )}

        <MistakePanel />
        <CheckpointPanel onEditing={setEditing} />

        <div class="flow-actions">
          <button class="pixel-button primary" onClick={toTown} data-testid="progress-back">
            {t('回小鎮', 'Back to town')}
            <KeyCap k="Enter" />
          </button>
        </div>
      </div>
    </div>
  );
}
