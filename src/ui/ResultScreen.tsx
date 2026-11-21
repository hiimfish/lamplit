import { useEffect } from 'preact/hooks';
import { playMusic } from '../audio/music';
import { playSfx } from '../audio/sfx';
import { getItem } from '../content/units';
import { appStore } from '../core/appState';
import { useStore } from '../core/store';
import { En } from './En';
import './flow.css';
import { hasItemIcon, iconIdOf, ItemIcon } from './ItemIcon';
import { StarMarks } from './TownScreen';

export function ResultScreen() {
  const { result, save } = useStore(appStore);
  useEffect(() => playMusic('town'), []);
  if (!result) {
    return (
      <div class="flow">
        <div class="flow-card">
          <button class="pixel-button" onClick={() => appStore.set({ screen: 'town' })}>
            回小鎮
          </button>
        </div>
      </div>
    );
  }

  const { outcome } = result;
  const isTask = result.kind === 'task';
  const newItems = outcome.newItemIds.flatMap((id) => getItem(id) ?? []);
  const replay = () => {
    if (!result.unitId || !result.taskId) return;
    playSfx('click');
    appStore.set({
      screen: 'task',
      activeTask: { unitId: result.unitId, taskId: result.taskId },
      result: undefined,
    });
  };

  return (
    <div class="flow" data-testid="result">
      <div class="flow-card result">
        <h1 class="flow-title">{isTask ? '任務完成！' : '複習完成！'}</h1>
        {isTask && (
          <div class="result-stars" data-testid="result-stars">
            <StarMarks n={outcome.stars} />
          </div>
        )}
        <p>
          答對 {outcome.correct} / {outcome.total}
        </p>
        <p class="result-coins">
          金幣 +{result.coins}（共 {save.coins}）
        </p>
        {newItems.length > 0 && (
          <div class="result-new">
            <p class="flow-heading">學到的新內容</p>
            <ul>
              {newItems.map((item) => (
                <li key={item.itemId}>
                  {(hasItemIcon(iconIdOf(item.itemId)) || item.emoji) && (
                    <span class="mg-emoji">
                      <ItemIcon id={iconIdOf(item.itemId)} fallback={item.emoji} />
                    </span>
                  )}
                  <En>{item.text}</En> <span class="flow-note">{item.zh}</span>
                </li>
              ))}
            </ul>
            <p class="flow-note">這些之後會排進今日複習。</p>
          </div>
        )}
        {!isTask && <p class="flow-note">明天再來，會有新的複習。</p>}
        <div class="flow-actions">
          <button
            class="pixel-button primary"
            onClick={() => appStore.set({ screen: 'town' })}
            data-testid="to-town"
          >
            回小鎮
          </button>
          {isTask && (
            <button class="pixel-button" onClick={replay} data-testid="replay">
              再玩一次
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
