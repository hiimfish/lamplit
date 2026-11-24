import type { ComponentChildren } from 'preact';
import { playSfx } from '../audio/sfx';
import { appStore, currentNow } from '../core/appState';
import { dailyFor } from '../core/save';
import { devUnlockAll, settingsStore } from '../core/settings';
import { useStore } from '../core/store';
import { goalStatus } from '../learning/dailyGoal';
import { drillRemaining, grammarGoal } from '../learning/grammarDrill';
import { grammarOn } from '../learning/grammarOn';
import { listenGoal, pickListenTask } from '../learning/listen';
import { buildDailyReview } from '../learning/sessionPlan';
import { reviewLimit, sprintPlan, taskGoal, type SprintStatus } from '../learning/sprint';
import { nextStop, playOrder } from '../learning/townPlan';
import './goal.css';
import { TOWN } from './TownScreen';

/** Why 單字快練 cannot start, or '' when it can. */
export const SPRINT_NOTE: Record<SprintStatus, string> = {
  'review-first': '今天還沒複習：先做一輪今日複習，再學新字。',
  'goal-met': '今天的新字學完了，明天再來。',
  'caught-up': '目前和下一個地點的字都學過了，先玩劇情任務往前走。',
  ready: '',
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

/** The story row's key and note when the screen knows better (the town: its act's 結業考). */
export interface StoryStep {
  label: string;
  note: string;
  /** Unset: nothing to start (the key is disabled). */
  onStart?: () => void;
  /** Another key before it (the town's 選關). */
  extra?: ComponentChildren;
}

/**
 * Today's blocks of 每日目標, each with the key that starts it: on the 每日目標 screen and in
 * the town (2026-11-25), where `story` gives the story row the town's own next step.
 */
export function GoalRows({ story }: { story?: StoryStep }) {
  const { save, activeTask } = useStore(appStore);
  const openAll = devUnlockAll(useStore(settingsStore));
  const now = currentNow();
  const daily = dailyFor(save, now);
  const due = buildDailyReview(save, now, reviewLimit(save.route)).length;
  const plan = sprintPlan(TOWN, save, now, due);
  const status = goalStatus(TOWN, save, now, due, grammarOn(save, TOWN));
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
  const grammarLeft = drillRemaining(save, save.route, now);
  const storyStep: StoryStep = story ?? {
    label: Object.keys(save.tasks).length > 0 || (save.skipTo ?? 0) > 0 ? '下一關' : '開始第一關',
    note: stop && stopTask ? `下一關：${stop.unit.title}・${stopTask.title}` : '劇情都玩過了。',
    ...(stopTask ? { onStart: playStory } : {}),
  };

  return (
    <div class="goal-rows">
      <GoalRow
        name="劇情任務"
        met={status.tasks}
        skip={!status.applies.tasks}
        done={daily.tasksDone}
        total={taskGoal(save.route)}
        note={storyStep.note}
        testId="goal-tasks"
      >
        <span class="goal-keys">
          {storyStep.extra}
          <button
            class="pixel-button primary"
            disabled={!storyStep.onStart}
            onClick={storyStep.onStart}
            data-testid="goal-story"
          >
            {storyStep.label}
          </button>
        </span>
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
          note={grammarLeft > 0 ? `還有 ${grammarLeft} 題。` : '今天的文法題答完了。'}
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
  );
}
