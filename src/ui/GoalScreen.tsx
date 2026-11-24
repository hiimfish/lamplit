import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { playMusic } from '../audio/music';
import { playSfx } from '../audio/sfx';
import { appStore, commitSave, currentNow } from '../core/appState';
import { dailyFor, type Route } from '../core/save';
import { devUnlockAll, settingsStore } from '../core/settings';
import { useStore } from '../core/store';
import { goalStatus, MISS_LIMIT, shouldOfferExtend } from '../learning/dailyGoal';
import { drillRemaining, grammarGoal } from '../learning/grammarDrill';
import { grammarOn } from '../learning/grammarOn';
import { listenGoal, pickListenTask } from '../learning/listen';
import { buildDailyReview } from '../learning/sessionPlan';
import {
  chooseRoute,
  declineExtend,
  EXTEND_WEEKS,
  extendSprint,
  reviewLimit,
  sprintEndDate,
  sprintPlan,
  sprintWeek,
  SPRINT_WEEKS,
  sprintWeeks,
  TASK_GOAL,
  taskGoal,
  type SprintStatus,
} from '../learning/sprint';
import './flow.css';
import './goal.css';
import { nextStop, playOrder } from '../learning/townPlan';
import { useKeys } from './keys';
import { KeyCap } from './KeyCap';
import { TOWN } from './TownScreen';

/** Why 單字快練 cannot start, or '' when it can. */
export const SPRINT_NOTE: Record<SprintStatus, string> = {
  'review-first': '今天還沒複習：先做一輪今日複習，再學新字。',
  'goal-met': '今天的新字學完了，明天再來。',
  'caught-up': '目前和下一個地點的字都學過了，先玩劇情任務往前走。',
  ready: '',
};

const ROUTES: { kind: Route['kind']; label: string }[] = [
  { kind: 'normal', label: '一般' },
  { kind: 'sprint', label: '衝刺 3 個月' },
];

/**
 * Roughly how long a day of each route takes when every block is done, from the
 * estimates in docs/specs/sprint.md (a story task is about 15 minutes). 一般:
 * TASK_GOAL.normal (1) task, 10 new words (about 5 minutes), up to 20 reviews (about 3)
 * and one scene heard again: 20–30 minutes. 衝刺: TASK_GOAL.sprint (5) tasks alone are
 * about 75 minutes, plus 15–50 new words, up to 200 reviews, 3 scenes and 15 grammar
 * questions: 2–3 hours.
 */
export const ROUTE_TIME: Record<Route['kind'], string> = {
  normal: '約 20–30 分鐘',
  sprint: '約 2–3 小時',
};

/** One block of the day: name, how far, a done mark (shape, not colour) and its key. */
function GoalRow({
  name,
  met,
  skip = false,
  done,
  total,
  note,
  children,
  testId,
}: {
  name: string;
  met: boolean;
  /** Nothing to do in this block today: 今天不用, and it is not counted. */
  skip?: boolean;
  done?: number;
  total?: number;
  note?: string;
  children?: ComponentChildren;
  testId: string;
}) {
  return (
    <div class={`goal-row${met ? ' met' : ''}`} data-testid={testId} data-skip={skip || undefined}>
      <span class="goal-name">
        {met && !skip && <span class="goal-mark">✓</span>}
        {name}
        {skip ? (
          <span class="goal-count" data-testid={`${testId}-skip`}>
            今天不用
          </span>
        ) : (
          done !== undefined &&
          total !== undefined && (
            <span class="goal-count">
              {done} / {total}
            </span>
          )
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
  useKeys({ Enter: toTown, Back: toTown });
  // Switching to 衝刺 asks once first: it is a much longer day.
  const [confirmSprint, setConfirmSprint] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (confirmSprint) confirmRef.current?.focus();
  }, [confirmSprint]);
  const cancelSprint = () => {
    playSfx('click');
    setConfirmSprint(false);
    requestAnimationFrame(() =>
      document.querySelector<HTMLElement>('[data-testid="route-normal"]')?.focus(),
    );
  };
  // While asking, 返回 (Esc) says no instead of leaving the screen.
  useKeys({ Back: cancelSprint }, confirmSprint);

  const now = currentNow();
  const daily = dailyFor(save, now);
  const due = buildDailyReview(save, now, reviewLimit(save.route)).length;
  const plan = sprintPlan(TOWN, save, now, due);
  const week = sprintWeek(save.route, now);
  const weeks = sprintWeeks(save.route);
  const grammarOnToday = grammarOn(save, TOWN);
  const status = goalStatus(TOWN, save, now, due, grammarOnToday);
  const offerExtend = shouldOfferExtend(save, now);
  const answerExtend = (extend: boolean) => {
    playSfx('click');
    const latest = appStore.get().save;
    commitSave(extend ? extendSprint(latest, currentNow()) : declineExtend(latest, currentNow()));
  };
  // The story task 下一關 would open: the next new task among the open acts.
  const stop = nextStop(save, playOrder(TOWN, save, openAll), activeTask?.unitId);
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
  const listenNext = pickListenTask(TOWN, save);
  const go = (screen: 'sprint' | 'review' | 'listen' | 'grammar') => {
    playSfx('click');
    appStore.set({ screen, result: undefined });
  };
  const pick = (kind: Route['kind']) => {
    playSfx('click');
    if (kind === 'sprint' && appStore.get().save.route.kind !== 'sprint') {
      setConfirmSprint(true);
      return;
    }
    setConfirmSprint(false);
    commitSave(chooseRoute(appStore.get().save, kind, currentNow()));
  };
  const startSprint = () => {
    playSfx('click');
    setConfirmSprint(false);
    commitSave(chooseRoute(appStore.get().save, 'sprint', currentNow()));
    requestAnimationFrame(() =>
      document.querySelector<HTMLElement>('[data-testid="route-sprint"]')?.focus(),
    );
  };
  const onRouteKey = (e: KeyboardEvent) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const at = ROUTES.findIndex((r) => r.kind === save.route.kind);
    const to = ROUTES[(at + step + ROUTES.length) % ROUTES.length];
    if (!to) return;
    pick(to.kind);
    // Asking before 衝刺: the focus goes to the question instead.
    if (to.kind === 'sprint' && save.route.kind !== 'sprint') return;
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
            ? week > weeks
              ? `衝刺的 ${weeks} 週已經過了（${save.route.start} 開始），可以繼續或改回一般。`
              : `衝刺第 ${week}／${weeks} 週，預計 ${sprintEndDate(save.route.start, weeks)} 結束。`
            : '照自己的步調玩，每天一點點。'}
        </p>
        <p class="flow-note" data-testid="route-time">
          做完每天的目標：一般{ROUTE_TIME.normal}（{TASK_GOAL.normal} 關劇情）；衝刺
          {ROUTE_TIME.sprint}（{TASK_GOAL.sprint} 關劇情，加上更多新字和複習）。可以分好幾次玩。
        </p>
        {confirmSprint && (
          <div class="goal-extend" role="group" aria-label="改成衝刺" data-testid="sprint-confirm">
            <p class="flow-note">
              衝刺從今天開始算 {SPRINT_WEEKS} 週，每天{ROUTE_TIME.sprint}。確定要改成衝刺嗎？
            </p>
            <div class="goal-extend-keys">
              <button
                ref={confirmRef}
                class="pixel-button primary"
                onClick={startSprint}
                data-testid="sprint-confirm-yes"
              >
                改成衝刺
              </button>
              <button class="pixel-button" onClick={cancelSprint} data-testid="sprint-confirm-no">
                先不要
              </button>
            </div>
          </div>
        )}
        {offerExtend && (
          <div class="goal-extend" role="group" aria-label="延長衝刺" data-testid="goal-extend">
            <p class="flow-note">
              最近 {MISS_LIMIT} 天沒完成目標，要把衝刺延長 {EXTEND_WEEKS} 週嗎？每天的量會變少。
            </p>
            <div class="goal-extend-keys">
              <button
                class="pixel-button primary"
                onClick={() => answerExtend(true)}
                data-testid="extend-yes"
              >
                延長 {EXTEND_WEEKS} 週
              </button>
              <button
                class="pixel-button"
                onClick={() => answerExtend(false)}
                data-testid="extend-no"
              >
                先不用
              </button>
            </div>
          </div>
        )}
        {status.all && (
          <p class="flow-note goal-all" data-testid="goal-all">
            <span class="goal-mark">✓</span>今天的目標都完成了！
          </p>
        )}

        <div class="goal-rows">
          <GoalRow
            name="劇情任務"
            met={status.tasks}
            skip={!status.applies.tasks}
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
              {Object.keys(save.tasks).length > 0 || (save.skipTo ?? 0) > 0
                ? '下一關'
                : '開始第一關'}
            </button>
          </GoalRow>
          <GoalRow
            name="單字快練"
            met={status.sprint}
            skip={!status.applies.sprint}
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
            met={status.review}
            skip={!status.applies.review}
            note={
              due === 0
                ? daily.reviewed > 0
                  ? `今天已答 ${daily.reviewed} 題，都複習完了。`
                  : '今天沒有到期的字。'
                : status.review
                  ? `今天已答 ${daily.reviewed} 題，目標達成；還有 ${due} 題可以多練。`
                  : `今天已答 ${daily.reviewed} 題，還有 ${due} 題到期（答滿 ${reviewLimit(save.route)} 題就算完成）。`
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
          <GoalRow
            name="聽力加量"
            met={status.listen}
            skip={!status.applies.listen}
            done={daily.listened}
            total={listenGoal(save.route)}
            note={
              listenNext
                ? `重聽：${listenNext.unit.title}・${listenNext.task.title}`
                : '先玩一關劇情，才有可以重聽的故事。'
            }
            testId="goal-listen"
          >
            <button
              class="pixel-button primary"
              disabled={!listenNext}
              onClick={() => go('listen')}
              data-testid="start-listen"
            >
              開始
            </button>
          </GoalRow>
          {status.hasGrammar && (
            <GoalRow
              name="文法快練"
              met={status.grammar}
              skip={!status.applies.grammar}
              done={daily.grammar}
              total={grammarGoal(save.route)}
              note={
                drillRemaining(save, save.route, now) > 0
                  ? `還有 ${drillRemaining(save, save.route, now)} 題。`
                  : '今天的文法題答完了。'
              }
              testId="goal-grammar"
            >
              <button
                class="pixel-button primary"
                onClick={() => go('grammar')}
                data-testid="start-grammar"
              >
                開始
              </button>
            </GoalRow>
          )}
        </div>
        <p class="flow-note" data-testid="goal-later">
          結業考在小鎮：每一幕地點的最後一格。
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
