import type { ComponentChildren } from 'preact';
import { useEffect } from 'preact/hooks';
import { playMusic } from '../audio/music';
import { playSfx } from '../audio/sfx';
import { appStore, commitSave, currentNow } from '../core/appState';
import { dailyFor, type Route } from '../core/save';
import { devUnlockAll, settingsStore } from '../core/settings';
import { useStore } from '../core/store';
import { buildDailyReview } from '../learning/sessionPlan';
import {
  chooseRoute,
  reviewLimit,
  SPRINT_WEEKS,
  sprintEndDate,
  sprintPlan,
  sprintWeek,
  taskGoal,
  type SprintStatus,
} from '../learning/sprint';
import './flow.css';
import './goal.css';
import { nextStop, openUnits } from '../learning/townPlan';
import { useKeys } from './keys';
import { KeyCap } from './KeyCap';
import { TOWN } from './TownScreen';

/** Why 單字快練 cannot start, or '' when it can. */
export const SPRINT_NOTE: Record<SprintStatus, string> = {
  'review-first': '先做完今日複習，再學新字。',
  'goal-met': '今天的新字學完了，明天再來。',
  'caught-up': '目前和下一個地點的字都學過了，先玩劇情任務往前走。',
  ready: '',
};

const ROUTES: { kind: Route['kind']; label: string }[] = [
  { kind: 'normal', label: '一般' },
  { kind: 'sprint', label: '衝刺 3 個月' },
];

/** One block of the day: name, how far, a done mark (shape, not colour) and its key. */
function GoalRow({
  name,
  done,
  total,
  note,
  children,
  testId,
}: {
  name: string;
  done?: number;
  total?: number;
  note?: string;
  children?: ComponentChildren;
  testId: string;
}) {
  const met = done !== undefined && total !== undefined && total > 0 && done >= total;
  return (
    <div class={`goal-row${met ? ' met' : ''}`} data-testid={testId}>
      <span class="goal-name">
        {met && <span class="goal-mark">✓</span>}
        {name}
        {done !== undefined && total !== undefined && (
          <span class="goal-count">
            {done} / {total}
          </span>
        )}
      </span>
      {note && <p class="flow-note goal-note">{note}</p>}
      {children}
    </div>
  );
}

/** 每日目標: the route (一般／衝刺) and today's blocks, each with the key that starts it. */
export function GoalScreen() {
  const { save, activeTask } = useStore(appStore);
  const openAll = devUnlockAll(useStore(settingsStore));
  useEffect(() => playMusic('town'), []);
  const toTown = () => appStore.set({ screen: 'town' });
  useKeys({ Enter: toTown });

  const now = currentNow();
  const daily = dailyFor(save, now);
  const due = buildDailyReview(save, now, reviewLimit(save.route)).length;
  const plan = sprintPlan(TOWN, save, now, due);
  const week = sprintWeek(save.route, now);
  // The story task 下一關 would open: the next new task among the open acts.
  const stop = nextStop(save, openUnits(TOWN, save, openAll), activeTask?.unitId);
  const stopTask = stop?.unit.tasks[stop.index];
  const playStory = () => {
    if (!stop || !stopTask) return;
    playSfx('click');
    appStore.set({
      screen: 'task',
      activeTask: { unitId: stop.unit.id, taskId: stopTask.id },
      result: undefined,
    });
  };
  const go = (screen: 'sprint' | 'review') => {
    playSfx('click');
    appStore.set({ screen, result: undefined });
  };
  const pick = (kind: Route['kind']) => {
    playSfx('click');
    commitSave(chooseRoute(appStore.get().save, kind, currentNow()));
  };
  const onRouteKey = (e: KeyboardEvent) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const at = ROUTES.findIndex((r) => r.kind === save.route.kind);
    const to = ROUTES[(at + step + ROUTES.length) % ROUTES.length];
    if (!to) return;
    pick(to.kind);
    const group = e.currentTarget instanceof HTMLElement ? e.currentTarget : null;
    requestAnimationFrame(() =>
      group?.querySelector<HTMLElement>(`[data-testid="route-${to.kind}"]`)?.focus(),
    );
  };

  return (
    <div class="flow" data-testid="goal-screen">
      <div class="flow-card goal">
        <h1 class="flow-title">每日目標</h1>
        <div class="route-tabs" role="radiogroup" aria-label="選路線" onKeyDown={onRouteKey}>
          {ROUTES.map((route) => {
            const on = save.route.kind === route.kind;
            return (
              <button
                key={route.kind}
                type="button"
                role="radio"
                aria-checked={on}
                tabIndex={on ? 0 : -1}
                class="pixel-button route-tab"
                onClick={() => pick(route.kind)}
                data-testid={`route-${route.kind}`}
              >
                {route.label}
              </button>
            );
          })}
        </div>
        <p class="flow-note" data-testid="route-note">
          {save.route.kind === 'sprint' && save.route.start
            ? week > SPRINT_WEEKS
              ? `衝刺的 ${SPRINT_WEEKS} 週已經過了（${save.route.start} 開始），可以繼續或改回一般。`
              : `衝刺第 ${week}／${SPRINT_WEEKS} 週，預計 ${sprintEndDate(save.route.start)} 結束。`
            : '照自己的步調玩，每天一點點。'}
        </p>

        <div class="goal-rows">
          <GoalRow
            name="劇情任務"
            done={daily.tasksDone}
            total={taskGoal(save.route)}
            note={
              stop && stopTask ? `下一關：${stop.unit.title}・${stopTask.title}` : '劇情都玩過了。'
            }
            testId="goal-tasks"
          >
            <button
              class="pixel-button primary"
              disabled={!stopTask}
              onClick={playStory}
              data-testid="goal-story"
            >
              {Object.keys(save.tasks).length > 0 ? '下一關' : '開始第一關'}
            </button>
          </GoalRow>
          <GoalRow
            name="單字快練"
            done={plan.today}
            total={plan.goal}
            note={SPRINT_NOTE[plan.status]}
            testId="goal-sprint"
          >
            <button
              class="pixel-button primary"
              disabled={plan.status !== 'ready'}
              onClick={() => go('sprint')}
              data-testid="start-sprint"
            >
              {plan.words.length > 0 ? `開始（${plan.words.length} 字）` : '開始'}
            </button>
          </GoalRow>
          <GoalRow
            name="今日複習"
            note={
              due > 0
                ? `今天已答 ${daily.reviewed} 題，還有 ${due} 題到期。`
                : `今天已答 ${daily.reviewed} 題。`
            }
            testId="goal-review"
          >
            <button
              class="pixel-button primary"
              disabled={due === 0}
              onClick={() => go('review')}
              data-testid="goal-start-review"
            >
              複習（{due}）
            </button>
          </GoalRow>
        </div>
        <p class="flow-note" data-testid="goal-later">
          之後會加入：聽力加量（重聽玩過的劇情）、多益題型。
        </p>

        <div class="flow-actions">
          <button class="pixel-button" onClick={toTown} data-testid="goal-back">
            回小鎮
            <KeyCap k="Enter" />
          </button>
        </div>
      </div>
    </div>
  );
}
