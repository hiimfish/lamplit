import { createPortal } from 'preact/compat';
import { useEffect, useRef, useState } from 'preact/hooks';
import { playMusic } from '../audio/music';
import { playSfx } from '../audio/sfx';
import { ACTS } from '../content/acts';
import type { Task, Unit } from '../content/types';
import { UNITS } from '../content/units';
import { appStore, currentNow } from '../core/appState';
import { currentStreak, type SaveData } from '../core/save';
import { devUnlockAll, settingsStore } from '../core/settings';
import { useStore } from '../core/store';
import { goalStatus } from '../learning/dailyGoal';
import { isExamUnlocked } from '../learning/exam';
import { grammarOn } from '../learning/grammarOn';
import { isSkipAct } from '../learning/skipExam';
import { buildDailyReview, isTaskUnlocked, taskKey } from '../learning/sessionPlan';
import { reviewLimit } from '../learning/sprint';
import {
  actUnits,
  buildTown,
  defaultAct,
  firstNewTask,
  isActUnlocked,
  isPlaceUnlocked,
  nextStep,
  progressOf,
  type Progress,
  type TownAct,
} from '../learning/townPlan';
import { examIdOf, ExamTile } from './exam/ExamTile';
import { GoalRows, type StoryStep } from './GoalRows';
import './flow.css';
import { useRefocus } from './focus';
import { useKeys } from './keys';
import { KeyCap } from './KeyCap';
import { HowToPlay, shouldShowIntro } from './HowToPlay';
import { SettingsPanel } from './SettingsPanel';
import { SceneStage } from './stage/SceneStage';
import { stageArea } from './stage/stageArea';
import type { StageView } from './stage/stageState';
import './town.css';

export const TOWN: TownAct<Unit>[] = buildTown(ACTS, UNITS);

/** Height of the name plate under the scene, in logical pixels (two lines of text). */
const PLATE_H = 32;
/** The scene shows who is there, with nothing handed over yet. */
const STILL: StageView = { speaker: undefined, bubble: undefined, props: [] };

const lp = (n: number): string => `calc(${n} * var(--px))`;

/** Earned stars as ★ and the rest as ☆, in separate spans so they can be styled apart. */
export function StarMarks({ n }: { n: number }) {
  return (
    <>
      <span class="star-on">{'★'.repeat(n)}</span>
      <span class="star-off">{'☆'.repeat(3 - n)}</span>
    </>
  );
}

/** A small padlock drawn in CSS: the locked state is shown by shape, not by dim text. */
function LockMark() {
  return <span class="lock-mark" aria-hidden="true" />;
}

/** Stars earned out of all that can be earned, e.g. ★ 9/24. */
function StarCount({ progress }: { progress: Progress }) {
  return (
    <span aria-label={`星星 ${progress.stars}，最多 ${progress.maxStars}`}>
      <span class="star-on">★</span> {progress.stars}/{progress.maxStars}
    </span>
  );
}

/** The two lines under the scene: where you are, and what comes next. */
function NamePlate({
  act,
  place,
  next,
  examDue,
  locked,
  save,
}: {
  act: TownAct<Unit>;
  place: Unit | undefined;
  next: { unit: Unit; task: Task } | undefined;
  /** Every task is done and the act's 幕結業考 is the next step. */
  examDue: boolean;
  /** The act before this one, while this one is locked. */
  locked: TownAct<Unit> | undefined;
  save: SaveData;
}) {
  if (place) {
    const progress = progressOf(save, [place]);
    return (
      <div class="town-plate" style={{ height: lp(PLATE_H) }} data-testid="plate">
        <div class="town-plate-row">
          <span>
            <span class="town-chip">第{act.no}幕</span>
            {place.title}
          </span>
          <StarCount progress={progress} />
        </div>
        <div class="town-plate-row">
          <span lang="en">{place.titleEn}</span>
          <span>
            完成 {progress.done}/{progress.total}
          </span>
        </div>
      </div>
    );
  }
  const units = actUnits(act);
  return (
    <div class="town-plate" style={{ height: lp(PLATE_H) }} data-testid="plate">
      <div class="town-plate-row">
        <span>
          <span class="town-chip">第{act.no}幕</span>
          {act.title}
        </span>
        {units.length > 0 && <StarCount progress={progressOf(save, units)} />}
      </div>
      <div class="town-plate-row">
        <span>
          {units.length === 0
            ? '即將開幕'
            : locked
              ? `玩完第${locked.no}幕或考過跳級考就會打開`
              : next
                ? `下一關：${next.unit.title}・${next.task.title}`
                : examDue
                  ? `下一步：第${act.no}幕結業考`
                  : '這一幕全部完成了！'}
        </span>
      </div>
    </div>
  );
}

/**
 * One location of the act: a key that opens its tasks, or a locked note when it is not
 * built yet, its act is still locked, or the place before it is not finished.
 */
function PlaceTile({
  no,
  title,
  unit,
  locked,
  isNext,
  save,
  onOpen,
}: {
  no: number;
  title: string;
  unit: Unit | undefined;
  locked: boolean;
  isNext: boolean;
  save: SaveData;
  onOpen: (unitId: string) => void;
}) {
  if (!unit || locked) {
    return (
      <div
        class={`place-tile soon${unit ? ' locked' : ''}`}
        data-testid={unit ? `place-${unit.id}` : undefined}
      >
        <LockMark />
        {title}
      </div>
    );
  }
  const progress = progressOf(save, [unit]);
  return (
    <button
      class={`pixel-button place-tile${isNext ? ' next' : ''}`}
      onClick={() => onOpen(unit.id)}
      data-testid={`place-${unit.id}`}
    >
      <span class="place-name">
        <span class="place-no">{no}</span>
        {title}
      </span>
      {progress.done === 0 ? (
        <span class="place-state new">新地點</span>
      ) : (
        <span class="place-state">
          <StarCount progress={progress} />
        </span>
      )}
    </button>
  );
}

/** The tasks of one location: done ones show their stars, the next one 新任務, the rest a padlock. */
function TaskList({
  unit,
  save,
  openAll,
  onStart,
}: {
  unit: Unit;
  save: SaveData;
  openAll: boolean;
  onStart: (unitId: string, taskId: string) => void;
}) {
  return (
    <div class="task-list">
      {unit.tasks.map((task, index) => {
        const unlocked = openAll || isTaskUnlocked(save, unit, index);
        const record = save.tasks[taskKey(unit.id, task.id)];
        return (
          <button
            key={task.id}
            class="pixel-button task-row"
            disabled={!unlocked}
            onClick={() => onStart(unit.id, task.id)}
            data-testid={`task-${unit.id}-${task.id}`}
          >
            <span class="task-name">{task.title}</span>
            <span class={`task-state${!unlocked ? '' : record ? ' stars' : ' new'}`}>
              {!unlocked ? (
                <>
                  <LockMark />
                  先完成上一關
                </>
              ) : record ? (
                <StarMarks n={record.stars} />
              ) : (
                '新任務'
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function TownScreen() {
  const { save, layout, town, activeTask } = useStore(appStore);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settings = useStore(settingsStore);
  const openAll = devUnlockAll(settings);
  // 怎麼玩: on the first visit, and again from 設定. Players who already played a task count
  // as having seen it.
  const played = Object.keys(save.tasks).length;
  const [howOpen, setHowOpen] = useState(() => shouldShowIntro(settings.seenIntro, played));
  useEffect(() => {
    if (!settings.seenIntro && played > 0) settingsStore.set({ seenIntro: true });
  }, [settings.seenIntro, played]);
  const closeHow = () => {
    setHowOpen(false);
    if (!settingsStore.get().seenIntro) settingsStore.set({ seenIntro: true });
  };
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => playMusic('town'), []);

  const lastUnitId = activeTask?.unitId;
  const actIndex = town && TOWN[town.act] ? town.act : defaultAct(TOWN, save, lastUnitId, openAll);
  const act = TOWN[actIndex];
  const actOpen = isActUnlocked(TOWN, save, actIndex, openAll);
  const units = act ? actUnits(act) : [];
  /** The location whose tasks are listed; undefined while the act's locations are shown. */
  const place = units.find((unit) => unit.id === town?.unitId);
  /** 選關 is open: the act tabs and the places (always, while a place's tasks show). */
  const picking = !!place || town?.picking === true;

  // After a tile or the back key is gone, focus moves to the heading of the new view.
  useRefocus(headingRef, [actIndex, place?.id]);

  // The scene column in landscape: the panel starts where it ends (see .flow.has-stage).
  const landscape = layout.orientation === 'landscape';
  const area = stageArea(layout, PLATE_H);
  const frame = typeof document === 'undefined' ? null : document.getElementById('frame');
  useEffect(() => {
    if (!frame || !landscape) return;
    frame.style.setProperty('--stage-w', lp(area.w));
    return () => frame.style.removeProperty('--stage-w');
  }, [frame, landscape, area.w]);

  // Enter starts 下一關 (開始第一關) from the act view, unless another key has focus. The
  // handler is set further down, once 下一關 is known (hooks stay above the early return).
  const enterRef = useRef<(() => void) | undefined>(undefined);
  // Esc (返回) goes from a location's tasks back to its act.
  const backRef = useRef<(() => void) | undefined>(undefined);
  useKeys({
    get Enter() {
      return enterRef.current;
    },
    get Back() {
      return backRef.current;
    },
  });

  if (!act) return null;

  const now = currentNow();
  const dueCount = buildDailyReview(save, now, reviewLimit(save.route)).length;
  const streak = currentStreak(save, now);
  const goal = goalStatus(TOWN, save, now, dueCount, grammarOn(save, TOWN));

  // What 下一關 opens: the next new task of this act (the name plate names it), then the act's
  // 幕結業考 until it is first sat; none while the act is locked.
  const actNo = actIndex + 1;
  const hasExam = actNo >= 1 && actNo <= 4;
  const exam = {
    open: hasExam && isExamUnlocked(save, TOWN, actNo as 1 | 2 | 3 | 4, openAll),
    taken: hasExam && (save.exams[examIdOf(actNo)]?.attempts ?? 0) > 0,
  };
  const step = actOpen ? nextStep(save, units, exam, lastUnitId) : undefined;
  const stop = step?.kind === 'task' ? step : undefined;
  const examDue = step?.kind === 'exam';
  // The act before a locked one: the name plate says to finish it, the card offers its 跳級考.
  const before = actOpen ? undefined : TOWN[actIndex - 1];
  const stopTask = stop?.unit.tasks[stop.index];
  const next = stop && stopTask ? { unit: stop.unit, task: stopTask } : undefined;

  // The scene: the open location, else the one 下一關 leads to, else the act's last one (its
  // first one while the act is locked).
  const sceneUnit = place ?? next?.unit ?? (actOpen ? units.at(-1) : units[0]);
  const sceneTask =
    sceneUnit &&
    (sceneUnit === next?.unit && !place
      ? next.task
      : (sceneUnit.tasks[firstNewTask(save, sceneUnit)] ?? sceneUnit.tasks.at(-1)));

  /** Opens an act (and a place) in 選關. */
  const show = (index: number, unitId?: string) => {
    playSfx('click');
    appStore.set({
      town: unitId ? { act: index, unitId, picking: true } : { act: index, picking: true },
    });
  };
  /**
   * Folds 選關 away, back to the act to go on in (defaultAct), whichever act was browsed: a
   * locked or finished one has no 開始.
   */
  const fold = () => {
    playSfx('click');
    appStore.set({ town: undefined });
  };
  const startTask = (unitId: string, taskId: string) => {
    playSfx('click');
    appStore.set({ screen: 'task', activeTask: { unitId, taskId }, result: undefined });
  };
  const startExam = () => {
    playSfx('click');
    appStore.set({ screen: 'exam', activeExam: actNo, result: undefined });
  };
  const startSkip = (act: number) => {
    playSfx('click');
    appStore.set({ screen: 'skip', activeSkip: act, result: undefined });
  };

  const idle = !place && !settingsOpen && !howOpen;
  enterRef.current =
    idle && next
      ? () => startTask(next.unit.id, next.task.id)
      : idle && examDue
        ? startExam
        : undefined;
  // Esc: from a place's tasks back to its act, then 選關 folds away.
  backRef.current =
    settingsOpen || howOpen ? undefined : place ? () => show(actIndex) : picking ? fold : undefined;
  // The act tabs are one radio group: ←/→ (or ↑/↓) move the choice and the focus.
  const onActKey = (e: KeyboardEvent) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const to = (actIndex + step + TOWN.length) % TOWN.length;
    show(to);
    const group = e.currentTarget instanceof HTMLElement ? e.currentTarget : null;
    requestAnimationFrame(() =>
      group?.querySelector<HTMLElement>(`[data-testid="act-${to + 1}"]`)?.focus(),
    );
  };

  // The key above the list: 回第N幕 over a place's tasks, 收起 over the act tabs.
  const actions = place ? (
    <div class="town-actions">
      <button class="pixel-button back-key" onClick={() => show(actIndex)} data-testid="back">
        回第{act.no}幕
        <KeyCap k="Back" />
      </button>
    </div>
  ) : (
    <div class="town-actions">
      <button class="pixel-button back-key" onClick={fold} data-testid="pick-fold">
        收起選關
        <KeyCap k="Back" />
      </button>
    </div>
  );

  // Folded (2026-11-25, the user's calls): 今天的目標, the story row first with 選關 and 開始
  // (this act's next step, 結業考 once every task is done); the name plate
  // under the scene names the act and task. Enter still opens that step.
  const pickKey = (
    <button class="pixel-button town-pick" onClick={() => show(actIndex)} data-testid="town-pick">
      選關
    </button>
  );
  const storyStep: StoryStep = next
    ? {
        label: '開始',
        note: `下一關：${next.unit.title}・${next.task.title}`,
        onStart: () => startTask(next.unit.id, next.task.id),
        extra: pickKey,
      }
    : examDue
      ? { label: '結業考', note: `下一步：第${act.no}幕結業考`, onStart: startExam, extra: pickKey }
      : {
          label: '開始',
          note: before ? `玩完第${before.no}幕才會打開` : '這一幕全部完成了！',
          extra: pickKey,
        };
  const nextCard = (
    <section class="town-goals" aria-labelledby="town-goals-title" data-testid="town-goals">
      <h2 class="town-goals-title" id="town-goals-title">
        今天的目標
        <span class="goal-tally">{goal.all ? '✓ 都完成了' : `${goal.met}/${goal.total}`}</span>
      </h2>
      <GoalRows story={storyStep} />
    </section>
  );

  const top = (
    <div
      class="town-top"
      inert={settingsOpen || howOpen}
      style={{ width: lp(area.w), height: lp(layout.sceneH) }}
      data-testid="town-top"
    >
      <div class="town-scene" style={{ height: lp(area.h) }}>
        {sceneUnit && sceneTask && (
          <SceneStage
            unit={sceneUnit}
            scene={sceneTask.scene}
            backdrop={sceneTask.backdrop}
            view={STILL}
            beat={sceneTask.scene.length}
            talking={undefined}
            area={area}
          />
        )}
        <div class="town-hud">
          <span class="town-status">
            <span class="coins" data-testid="coins">
              金幣 {save.coins}
            </span>
            <span data-testid="streak">連續 {streak} 天</span>
          </span>
          <span class="town-hud-keys">
            <button
              class="pixel-button small"
              onClick={() => {
                playSfx('click');
                appStore.set({ screen: 'goal' });
              }}
              data-testid="goal"
              aria-label={
                goal.all ? '每日目標，今天都完成了' : `每日目標，完成 ${goal.met}／${goal.total}`
              }
            >
              {/* Only the blocks that count today (今天不用 ones are left out of both numbers). */}
              每日目標
              <span class="goal-tally" data-testid="goal-tally">
                {goal.all ? '✓' : `${goal.met}/${goal.total}`}
              </span>
            </button>
            <button
              class="pixel-button small"
              onClick={() => {
                playSfx('click');
                appStore.set({ screen: 'progress' });
              }}
              data-testid="town-progress"
            >
              進度
            </button>
            <button class="pixel-button small" onClick={() => setSettingsOpen(true)}>
              設定
            </button>
          </span>
        </div>
      </div>
      <NamePlate
        act={act}
        place={place}
        next={next}
        examDue={examDue}
        locked={before}
        save={save}
      />
    </div>
  );

  return (
    <div class="flow has-stage" data-testid="town">
      {frame && createPortal(top, frame)}
      <div class="flow-card" inert={settingsOpen || howOpen}>
        <h1 class="sr-only" ref={headingRef}>
          {place ? place.title : `小鎮：第${act.no}幕 ${act.title}`}
        </h1>
        {place ? (
          <>
            {actions}
            <TaskList unit={place} save={save} openAll={openAll} onStart={startTask} />
          </>
        ) : !picking ? (
          nextCard
        ) : (
          <>
            {actions}
            <div class="act-tabs" role="radiogroup" aria-label="選一幕" onKeyDown={onActKey}>
              {TOWN.map((item, index) => (
                <button
                  key={item.no}
                  type="button"
                  role="radio"
                  aria-checked={index === actIndex}
                  tabIndex={index === actIndex ? 0 : -1}
                  aria-label={`第${item.no}幕 ${item.title}${isActUnlocked(TOWN, save, index, openAll) ? '' : '（未解鎖）'}`}
                  class={`pixel-button act-tab${actUnits(item).length > 0 ? '' : ' soon'}`}
                  onClick={() => show(index)}
                  data-testid={`act-${index + 1}`}
                >
                  第{item.no}幕
                </button>
              ))}
            </div>
            {openAll && (
              <p class="flow-note" data-testid="dev-note">
                開發模式：所有關卡都開放（在設定裡關掉）。
              </p>
            )}
            {units.length === 0 && (
              <p class="flow-note">這一幕還在準備中，下面是之後會開的地點。</p>
            )}
            {units.length > 0 && before && isSkipAct(actIndex) && (
              <div class="act-locked" data-testid="act-locked">
                <p class="flow-note">已經有基礎？考過第{before.no}幕跳級考就能直接進來。</p>
                <button
                  class="pixel-button"
                  onClick={() => startSkip(actIndex)}
                  data-testid="skip-challenge"
                >
                  挑戰第{before.no}幕跳級考
                </button>
              </div>
            )}
            <div class="place-grid">
              {act.places.map((item, index) => (
                <PlaceTile
                  key={item.title}
                  no={index + 1}
                  title={item.title}
                  unit={item.unit}
                  locked={
                    !actOpen ||
                    (item.unit !== undefined &&
                      !isPlaceUnlocked(TOWN, save, actIndex, item.unit, openAll))
                  }
                  isNext={item.unit !== undefined && item.unit === next?.unit}
                  save={save}
                  onOpen={(unitId) => show(actIndex, unitId)}
                />
              ))}
              <ExamTile act={actIndex + 1} no={act.no} />
            </div>
          </>
        )}
      </div>

      {settingsOpen && (
        <div class="overlay">
          <SettingsPanel
            onClose={() => setSettingsOpen(false)}
            onHowTo={() => {
              setSettingsOpen(false);
              setHowOpen(true);
            }}
          />
        </div>
      )}
      {howOpen && (
        <div class="overlay">
          <HowToPlay onClose={closeHow} />
        </div>
      )}
    </div>
  );
}
