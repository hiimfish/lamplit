import { useEffect, useRef, useState } from 'preact/hooks';
import { playAudio, stopAudio } from '../audio/pronounce';
import { getItem, taskItemIds, type ItemInfo } from '../content/units';
import type { Task } from '../content/types';
import { settingsStore } from '../core/settings';
import { useStore } from '../core/store';
import { hasItemIcon, iconIdOf, ItemIcon } from './ItemIcon';
import './flow.css';
import { useRefocus } from './focus';

interface Props {
  task: Task;
  onDone: () => void;
}

const play = (audioId: string, text: string, slow: boolean) =>
  void playAudio(audioId, { speed: slow ? 'slow' : 'normal', text });

/** A minimal pair: both words side by side, each with its own 聽發音 / 慢速 keys. */
function PairCard({ item, showZh }: { item: ItemInfo; showZh: boolean }) {
  return (
    <div class="intro-card" data-testid="intro-pair">
      {item.focus && <div class="intro-note">聽差別：{item.focus}</div>}
      <div class="intro-pair">
        {(item.sides ?? []).map((side) => (
          <div class="intro-pair-side" key={side.id}>
            <div class="intro-en" lang="en">
              {side.en}
            </div>
            {showZh && <div class="intro-zh">{side.zh}</div>}
            <div class="flow-actions">
              <button class="pixel-button" onClick={() => play(side.audioId, side.en, false)}>
                聽發音
              </button>
              <button class="pixel-button" onClick={() => play(side.audioId, side.en, true)}>
                慢速
              </button>
            </div>
          </div>
        ))}
      </div>
      {item.note && <div class="intro-note">{item.note}</div>}
    </div>
  );
}

/** The task's new chunks, words and minimal pairs, one card at a time. */
export function IntroCards({ task, onDone }: Props) {
  const { showZh } = useStore(settingsStore);
  const items = taskItemIds(task).flatMap((id) => getItem(id) ?? []);
  const [index, setIndex] = useState(0);
  const headingRef = useRef<HTMLParagraphElement>(null);
  const item = items[index];
  // Coming from the story, or 上一張 disappearing on the first card, drops focus.
  useRefocus(headingRef, [index]);
  useEffect(() => {
    if (!item) onDone();
  }, [item]);
  // 開始練習 or 先回小鎮 while a card is speaking: don't let it run on.
  useEffect(() => () => stopAudio(), []);
  if (!item) return null;
  const last = index >= items.length - 1;
  const iconId = iconIdOf(item.itemId);
  const kindLabel = item.kind === 'chunk' ? '句子' : item.kind === 'pair' ? '發音' : '單字';

  return (
    <div class="intro" data-testid="intro">
      <p class="flow-heading" ref={headingRef}>
        新的{kindLabel}（{index + 1}/{items.length}）
      </p>
      {item.kind === 'pair' ? (
        <PairCard key={item.itemId} item={item} showZh={showZh} />
      ) : (
        <div class="intro-card" key={item.itemId}>
          {(hasItemIcon(iconId) || item.emoji) && (
            <div class="intro-emoji">
              <ItemIcon id={iconId} fallback={item.emoji} />
            </div>
          )}
          <div class="intro-en" lang="en">
            {item.text}
          </div>
          {showZh && <div class="intro-zh">{item.zh}</div>}
          {item.note && <div class="intro-note">{item.note}</div>}
          <div class="flow-actions">
            <button class="pixel-button" onClick={() => play(item.audioId, item.text, false)}>
              聽發音
            </button>
            <button class="pixel-button" onClick={() => play(item.audioId, item.text, true)}>
              慢速
            </button>
          </div>
        </div>
      )}
      <div class="flow-actions">
        {index > 0 && (
          <button class="pixel-button small" onClick={() => setIndex(index - 1)}>
            上一張
          </button>
        )}
        <button
          class="pixel-button primary"
          onClick={() => (last ? onDone() : setIndex(index + 1))}
          data-testid="intro-next"
        >
          {last ? '開始練習' : '下一張'}
        </button>
      </div>
    </div>
  );
}
