import { useEffect, useRef, useState } from 'preact/hooks';
import { playAudio } from '../audio/pronounce';
import { getItem, taskItemIds } from '../content/units';
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

/** The task's new chunks and words, one card at a time. */
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
  if (!item) return null;
  const play = (slow: boolean) =>
    void playAudio(item.audioId, { speed: slow ? 'slow' : 'normal', text: item.text });
  const last = index >= items.length - 1;
  const iconId = iconIdOf(item.itemId);

  return (
    <div class="intro" data-testid="intro">
      <p class="flow-heading" ref={headingRef}>
        新的{item.kind === 'chunk' ? '句子' : '單字'}（{index + 1}/{items.length}）
      </p>
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
          <button class="pixel-button" onClick={() => play(false)}>
            聽發音
          </button>
          <button class="pixel-button" onClick={() => play(true)}>
            慢速
          </button>
        </div>
      </div>
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
