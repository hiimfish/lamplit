import type { ComponentChildren } from 'preact';
import { playSfx } from '../audio/sfx';
import { taskTitle, unitTitle } from '../content/titles';
import { appStore, currentNow } from '../core/appState';
import { dailyFor } from '../core/save';
import { devUnlockAll, settingsStore } from '../core/settings';
import { t } from '../core/i18n';
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

/** Why 單字快練 cannot start, or '' when it can (getters: read in the current 介面語言). */
export const SPRINT_NOTE: Record<SprintStatus, string> = {
  get 'review-first'() {
    return t(
      '今天還沒複習：先做一輪今日複習，再學新字。',
      'No review yet today: do a daily review first, then learn new words.',
    );
  },
  get 'goal-met'() {
    return t('今天的新字學完了，明天再來。', "Today's new words are done. Come back tomorrow.");
  },
  get 'caught-up'() {
    return t(
      '目前和下一個地點的字都學過了，先玩劇情任務往前走。',
      "You've learned the words up to the next place. Play the story to move on.",
    );
  },
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
            {t('今天不用', 'Not today')}
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
 * Today's blocks of 今天的目標 in the town, each with the key that starts it; `story` gives the
 * story row the town's own next step. Every block comes back to the town.
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
    label: t('開始', 'Start'),
    note:
      stop && stopTask
        ? t(
            `下一關：${stop.unit.title}・${stopTask.title}`,
            `Next: ${unitTitle(stop.unit)} · ${taskTitle(stopTask)}`,
          )
        : t('劇情都玩過了。', "You've played the whole story."),
    ...(stopTask ? { onStart: playStory } : {}),
  };

  return (
    <div class="goal-rows">
      <GoalRow
        name={t('劇情任務', 'Story')}
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
        name={t('單字快練', 'Word sprint')}
        met={status.sprint}
        skip={!status.applies.sprint}
        done={plan.today}
        total={plan.goal}
        note={
          plan.status === 'ready' && plan.words.length > 0
            ? t(
                `這一輪 ${plan.words.length} 個新字。`,
                `${plan.words.length} new words this round.`,
              )
            : SPRINT_NOTE[plan.status]
        }
        testId="goal-sprint"
      >
        <button
          class="pixel-button primary"
          disabled={plan.status !== 'ready'}
          onClick={() => go('sprint')}
          data-testid="start-sprint"
        >
          {t('開始', 'Start')}
        </button>
      </GoalRow>
      <GoalRow
        name={t('今日複習', 'Daily review')}
        met={status.review}
        skip={!status.applies.review}
        note={
          due === 0
            ? daily.reviewed > 0
              ? t(
                  `今天已答 ${daily.reviewed} 題，都複習完了。`,
                  `${daily.reviewed} answered today. All reviewed.`,
                )
              : t('今天沒有到期的字。', 'No words due today.')
            : status.review
              ? t(
                  `今天已答 ${daily.reviewed} 題，目標達成；還有 ${due} 題可以多練。`,
                  `${daily.reviewed} answered today, goal met. ${due} more to practice.`,
                )
              : t(
                  `今天已答 ${daily.reviewed} 題，還有 ${due} 題到期（答滿 ${reviewLimit(save.route)} 題就算完成）。`,
                  `${daily.reviewed} answered today, ${due} due (${reviewLimit(save.route)} answers meets the goal).`,
                )
        }
        testId="goal-review"
      >
        <button
          class="pixel-button primary"
          disabled={due === 0}
          onClick={() => go('review')}
          data-testid="goal-start-review"
        >
          {t('開始', 'Start')}
        </button>
      </GoalRow>
      <GoalRow
        name={t('聽力加量', 'Extra listening')}
        met={status.listen}
        skip={!status.applies.listen}
        done={daily.listened}
        total={listenGoal(save.route)}
        note={
          listenNext
            ? t(
                `重聽：${listenNext.unit.title}・${listenNext.task.title}`,
                `Listen again: ${unitTitle(listenNext.unit)} · ${taskTitle(listenNext.task)}`,
              )
            : t(
                '先玩一關劇情，才有可以重聽的故事。',
                'Play a story task first to have one to replay.',
              )
        }
        testId="goal-listen"
      >
        <button
          class="pixel-button primary"
          disabled={!listenNext}
          onClick={() => go('listen')}
          data-testid="start-listen"
        >
          {t('開始', 'Start')}
        </button>
      </GoalRow>
      {status.hasGrammar && (
        <GoalRow
          name={t('文法快練', 'Grammar drill')}
          met={status.grammar}
          skip={!status.applies.grammar}
          done={daily.grammar}
          total={grammarGoal(save.route)}
          note={
            grammarLeft > 0
              ? t(`還有 ${grammarLeft} 題。`, `${grammarLeft} left.`)
              : t('今天的文法題答完了。', "Today's grammar is done.")
          }
          testId="goal-grammar"
        >
          <button
            class="pixel-button primary"
            onClick={() => go('grammar')}
            data-testid="start-grammar"
          >
            {t('開始', 'Start')}
          </button>
        </GoalRow>
      )}
    </div>
  );
}
