import { useEffect, useState } from 'preact/hooks';
import { playMusic } from '../audio/music';
import { playSfx } from '../audio/sfx';
import { UNITS } from '../content/units';
import { appStore, currentNow } from '../core/appState';
import { currentStreak } from '../core/save';
import { useStore } from '../core/store';
import { buildDailyReview, isTaskUnlocked, taskKey } from '../learning/sessionPlan';
import './flow.css';
import { SettingsPanel } from './SettingsPanel';

const COMING_SOON = ['便利商店', '街道與公車站', '超市與市集'];

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

export function TownScreen() {
  const { save } = useStore(appStore);
  const [settingsOpen, setSettingsOpen] = useState(false);
  useEffect(() => playMusic('town'), []);

  const now = currentNow();
  const dueCount = buildDailyReview(save, now).length;
  const streak = currentStreak(save, now);

  const startTask = (unitId: string, taskId: string) => {
    playSfx('click');
    appStore.set({ screen: 'task', activeTask: { unitId, taskId }, result: undefined });
  };
  const startReview = () => {
    playSfx('click');
    appStore.set({ screen: 'review', result: undefined });
  };

  return (
    <div class="flow" data-testid="town">
      <div class="flow-card" inert={settingsOpen}>
        <h1 class="sr-only">小鎮</h1>
        <div class="flow-bar">
          <span class="coins" data-testid="coins">
            金幣 {save.coins}
          </span>
          <span data-testid="streak">連續 {streak} 天</span>
          <button class="pixel-button small" onClick={() => setSettingsOpen(true)}>
            設定
          </button>
        </div>

        <button
          class="pixel-button primary"
          disabled={dueCount === 0}
          onClick={startReview}
          data-testid="review"
        >
          今日複習（{dueCount}）
        </button>
        {dueCount === 0 && <p class="flow-note">今天沒有要複習的，去玩新任務吧。</p>}

        {UNITS.map((unit) => (
          <section class="building" key={unit.id}>
            <h2 class="building-title">
              <span class="building-name">{unit.title}</span>
              <span class="building-en" lang="en">
                {unit.titleEn}
              </span>
            </h2>
            {unit.tasks.map((task, index) => {
              const unlocked = isTaskUnlocked(save, unit, index);
              const record = save.tasks[taskKey(unit.id, task.id)];
              return (
                <button
                  key={task.id}
                  class="pixel-button task-row"
                  disabled={!unlocked}
                  onClick={() => startTask(unit.id, task.id)}
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
          </section>
        ))}

        <section class="building locked">
          <span>
            <LockMark />
            即將開幕
          </span>
          <span class="flow-note">{COMING_SOON.join('、')}</span>
        </section>
      </div>

      {settingsOpen && (
        <div class="overlay">
          <SettingsPanel onClose={() => setSettingsOpen(false)} />
        </div>
      )}
    </div>
  );
}
