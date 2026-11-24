/**
 * 設定 → 路線 (2026-11-25, moved here from the 每日目標 screen): 一般 or 衝刺 3 個月, how long a
 * day takes, asking once before 衝刺, and the offer to extend a sprint that fell behind.
 */
import type { RefObject } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { playSfx } from '../../audio/sfx';
import { appStore, commitSave, currentNow } from '../../core/appState';
import type { Route } from '../../core/save';
import { useStore } from '../../core/store';
import { MISS_LIMIT, shouldOfferExtend } from '../../learning/dailyGoal';
import {
  chooseRoute,
  declineExtend,
  EXTEND_WEEKS,
  extendSprint,
  sprintEndDate,
  sprintWeek,
  SPRINT_WEEKS,
  sprintWeeks,
  TASK_GOAL,
} from '../../learning/sprint';
import '../goal.css';

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

/**
 * `escRef` is set while the 衝刺 question is open: Esc then says 先不要 instead of leaving
 * the page (the panel's Esc asks it first).
 */
export function RouteGroup({ escRef }: { escRef: RefObject<(() => void) | null> }) {
  const { save } = useStore(appStore);
  const [confirmSprint, setConfirmSprint] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const focusRoute = (kind: Route['kind']) =>
    requestAnimationFrame(() =>
      groupRef.current?.querySelector<HTMLElement>(`[data-testid="route-${kind}"]`)?.focus(),
    );
  const cancelSprint = () => {
    playSfx('click');
    setConfirmSprint(false);
    focusRoute('normal');
  };
  useEffect(() => {
    if (confirmSprint) confirmRef.current?.focus();
  }, [confirmSprint]);
  useEffect(() => {
    escRef.current = confirmSprint ? cancelSprint : null;
    return () => {
      escRef.current = null;
    };
  });

  const now = currentNow();
  const week = sprintWeek(save.route, now);
  const weeks = sprintWeeks(save.route);
  const offerExtend = shouldOfferExtend(save, now);
  const answerExtend = (extend: boolean) => {
    playSfx('click');
    const latest = appStore.get().save;
    commitSave(extend ? extendSprint(latest, currentNow()) : declineExtend(latest, currentNow()));
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
    focusRoute('sprint');
  };
  // A radio group: ←/→ (or ↑/↓) move the choice and the focus.
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
    focusRoute(to.kind);
  };

  return (
    <>
      <div class="settings-row">
        <span class="settings-label" id="route-label">
          路線
        </span>
        <div
          ref={groupRef}
          class="settings-control"
          role="radiogroup"
          aria-labelledby="route-label"
          onKeyDown={onRouteKey}
        >
          {ROUTES.map((route) => {
            const on = save.route.kind === route.kind;
            return (
              <button
                key={route.kind}
                type="button"
                role="radio"
                aria-checked={on}
                tabIndex={on ? 0 : -1}
                class={`pixel-button settings-choice${on ? ' primary' : ''}`}
                onClick={() => pick(route.kind)}
                data-testid={`route-${route.kind}`}
              >
                {route.label}
              </button>
            );
          })}
        </div>
      </div>
      <p class="settings-note" data-testid="route-note">
        {save.route.kind === 'sprint' && save.route.start
          ? week > weeks
            ? `衝刺的 ${weeks} 週已經過了（${save.route.start} 開始），可以繼續或改回一般。`
            : `衝刺第 ${week}／${weeks} 週，預計 ${sprintEndDate(save.route.start, weeks)} 結束。`
          : '照自己的步調玩，每天一點點。'}
      </p>
      <p class="settings-note" data-testid="route-time">
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
              type="button"
              class="pixel-button primary"
              onClick={startSprint}
              data-testid="sprint-confirm-yes"
            >
              改成衝刺
            </button>
            <button
              type="button"
              class="pixel-button"
              onClick={cancelSprint}
              data-testid="sprint-confirm-no"
            >
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
              type="button"
              class="pixel-button primary"
              onClick={() => answerExtend(true)}
              data-testid="extend-yes"
            >
              延長 {EXTEND_WEEKS} 週
            </button>
            <button
              type="button"
              class="pixel-button"
              onClick={() => answerExtend(false)}
              data-testid="extend-no"
            >
              先不用
            </button>
          </div>
        </div>
      )}
    </>
  );
}
