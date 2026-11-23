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
import { buildDailyReview, isTaskUnlocked, taskKey } from '../learning/sessionPlan';
import {
  actUnits,
  buildTown,
  defaultAct,
  firstNewTask,
  nextStop,
  progressOf,
  type Progress,
  type TownAct,
} from '../learning/townPlan';
import './flow.css';
import { useRefocus } from './focus';
import { useKeys } from './keys';
import { SettingsPanel } from './SettingsPanel';
import { SceneStage } from './stage/SceneStage';
import { stageArea } from './stage/stageArea';
import type { StageView } from './stage/stageState';
import './town.css';

const TOWN: TownAct<Unit>[] = buildTown(ACTS, UNITS);

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
  save,
}: {
  act: TownAct<Unit>;
  place: Unit | undefined;
  next: { unit: Unit; task: Task } | undefined;
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
            : next
              ? `下一關：${next.unit.title}・${next.task.title}`
              : '這一幕全部完成了！'}
        </span>
      </div>
    </div>
  );
}

/** One location of the act: a key that opens its tasks, or a locked note when not built yet. */
function PlaceTile({
  no,
  title,
  unit,
  isNext,
  save,
  onOpen,
}: {
  no: number;
  title: string;
  unit: Unit | undefined;
  isNext: boolean;
  save: SaveData;
  onOpen: (unitId: string) => void;
}) {
  if (!unit) {
    return (
      <div class="place-tile soon">
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
  const openAll = devUnlockAll(useStore(settingsStore));
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => playMusic('town'), []);

  const lastUnitId = activeTask?.unitId;
  const actIndex = town && TOWN[town.act] ? town.act : defaultAct(TOWN, save, lastUnitId);
  const act = TOWN[actIndex];
  const units = act ? actUnits(act) : [];
  /** The location whose tasks are listed; undefined while the act's locations are shown. */
  const place = units.find((unit) => unit.id === town?.unitId);

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
  useKeys({
    get Enter() {
      return enterRef.current;
    },
  });

  if (!act) return null;

  const now = currentNow();
  const dueCount = buildDailyReview(save, now).length;
  const streak = currentStreak(save, now);

  // What 下一關 opens: the next new task of this act (the name plate names it).
  const stop = nextStop(save, units, lastUnitId);
  const stopTask = stop?.unit.tasks[stop.index];
  const next = stop && stopTask ? { unit: stop.unit, task: stopTask } : undefined;

  // The scene: the open location, else the one 下一關 leads to, else the act's last one.
  const sceneUnit = place ?? next?.unit ?? units.at(-1);
  const sceneTask =
    sceneUnit &&
    (sceneUnit === next?.unit && !place
      ? next.task
      : (sceneUnit.tasks[firstNewTask(save, sceneUnit)] ?? sceneUnit.tasks.at(-1)));

  const show = (index: number, unitId?: string) => {
    playSfx('click');
    appStore.set({ town: unitId ? { act: index, unitId } : { act: index } });
  };
  const startTask = (unitId: string, taskId: string) => {
    playSfx('click');
    appStore.set({ screen: 'task', activeTask: { unitId, taskId }, result: undefined });
  };
  const startReview = () => {
    playSfx('click');
    appStore.set({ screen: 'review', result: undefined });
  };

  enterRef.current =
    !place && !settingsOpen && next ? () => startTask(next.unit.id, next.task.id) : undefined;
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

  const actions = place ? (
    <div class="town-actions">
      <button class="pixel-button back-key" onClick={() => show(actIndex)} data-testid="back">
        回第{act.no}幕
      </button>
    </div>
  ) : (
    <div class="town-actions">
      <button
        class="pixel-button primary"
        disabled={dueCount === 0}
        onClick={startReview}
        data-testid="review"
      >
        今日複習（{dueCount}）
      </button>
      <button
        class="pixel-button primary"
        disabled={!next}
        onClick={() => next && startTask(next.unit.id, next.task.id)}
        data-testid="continue"
      >
        {Object.keys(save.tasks).length > 0 ? '下一關' : '開始第一關'}
      </button>
    </div>
  );

  const top = (
    <div
      class="town-top"
      inert={settingsOpen}
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
          <button class="pixel-button small" onClick={() => setSettingsOpen(true)}>
            設定
          </button>
        </div>
      </div>
      <NamePlate act={act} place={place} next={next} save={save} />
    </div>
  );

  return (
    <div class="flow has-stage" data-testid="town">
      {frame && createPortal(top, frame)}
      <div class="flow-card" inert={settingsOpen}>
        <h1 class="sr-only" ref={headingRef}>
          {place ? place.title : `小鎮：第${act.no}幕 ${act.title}`}
        </h1>
        {place ? (
          <>
            {actions}
            <TaskList unit={place} save={save} openAll={openAll} onStart={startTask} />
          </>
        ) : (
          <>
            <div class="act-tabs" role="radiogroup" aria-label="選一幕" onKeyDown={onActKey}>
              {TOWN.map((item, index) => (
                <button
                  key={item.no}
                  type="button"
                  role="radio"
                  aria-checked={index === actIndex}
                  tabIndex={index === actIndex ? 0 : -1}
                  aria-label={`第${item.no}幕 ${item.title}`}
                  class={`pixel-button act-tab${actUnits(item).length > 0 ? '' : ' soon'}`}
                  onClick={() => show(index)}
                  data-testid={`act-${index + 1}`}
                >
                  第{item.no}幕
                </button>
              ))}
            </div>
            {actions}
            {openAll && (
              <p class="flow-note" data-testid="dev-note">
                開發模式：所有關卡都開放（在設定裡關掉）。
              </p>
            )}
            {units.length === 0 && (
              <p class="flow-note">這一幕還在準備中，下面是之後會開的地點。</p>
            )}
            <div class="place-grid">
              {act.places.map((item, index) => (
                <PlaceTile
                  key={item.title}
                  no={index + 1}
                  title={item.title}
                  unit={item.unit}
                  isNext={item.unit !== undefined && item.unit === next?.unit}
                  save={save}
                  onOpen={(unitId) => show(actIndex, unitId)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {settingsOpen && (
        <div class="overlay">
          <SettingsPanel onClose={() => setSettingsOpen(false)} />
        </div>
      )}
    </div>
  );
}
