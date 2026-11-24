import { useEffect } from 'preact/hooks';
import { playMusic } from '../audio/music';
import { playSfx } from '../audio/sfx';
import { playAudio, stopAudio } from '../audio/pronounce';
import { getItem, type ItemInfo } from '../content/units';
import { appStore } from '../core/appState';
import { useStore } from '../core/store';
import { En } from './En';
import './flow.css';
import { clipsOf } from './IntroCards';
import { hasItemIcon, iconIdOf, ItemIcon } from './ItemIcon';
import { useKeys } from './keys';
import { KeyCap } from './KeyCap';
import { StarMarks } from './TownScreen';

/** Says a learned item once (a pair: one side, then the other); a new tap cuts it off. */
let hearing = 0;
async function hearItem(item: ItemInfo): Promise<void> {
  const mine = ++hearing;
  for (const [audioId, text] of clipsOf(item)) {
    if (mine !== hearing) return;
    await playAudio(audioId, { text });
  }
}

export function ResultScreen() {
  const { result, save } = useStore(appStore);
  useEffect(() => playMusic('town'), []);
  useEffect(() => () => stopAudio(), []);
  const toTown = () => appStore.set({ screen: 'town' });
  useKeys({ Enter: toTown, Back: toTown });
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
  const isSprint = result.kind === 'sprint';
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
        <h1 class="flow-title">
          {isTask
            ? '任務完成！'
            : isSprint
              ? '快練完成！'
              : result.kind === 'grammar'
                ? '文法快練完成！'
                : '複習完成！'}
        </h1>
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
                  <button
                    type="button"
                    class="pixel-button small result-play"
                    aria-label={`聽 ${item.text}`}
                    onClick={() => void hearItem(item)}
                  >
                    ♪
                  </button>
                </li>
              ))}
            </ul>
            <p class="flow-note">
              {isSprint
                ? '這些字很快會在劇情裡遇到，也會排進今日複習。'
                : '這些之後會排進今日複習。'}
            </p>
          </div>
        )}
        {result.kind === 'review' && <p class="flow-note">明天再來，會有新的複習。</p>}
        <div class="flow-actions">
          <button
            class="pixel-button primary"
            onClick={() => appStore.set({ screen: 'town' })}
            data-testid="to-town"
          >
            回小鎮
            <KeyCap k="Enter" />
          </button>
          {isTask && (
            <button class="pixel-button" onClick={replay} data-testid="replay">
              再玩一次
            </button>
          )}
          {isSprint && (
            <button
              class="pixel-button"
              onClick={() => appStore.set({ screen: 'goal', result: undefined })}
              data-testid="to-goal"
            >
              每日目標
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
