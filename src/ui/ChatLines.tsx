import { useEffect, useRef } from 'preact/hooks';
import { ROLE_LABEL } from '../content/roles';
import type { SceneLine } from '../content/types';
import { settingsStore } from '../core/settings';
import { useStore } from '../core/store';
import './flow.css';

interface Props {
  /** The lines on screen, in order. */
  lines: readonly SceneLine[];
  /** Index of the newest line, drawn as current (typed out); -1 for none. */
  current: number;
  onPlay: (index: number, slow: boolean) => void;
}

/** The 中文 key: shows or hides the Chinese under every line (a saved setting). */
export function ZhToggle() {
  const { showZh } = useStore(settingsStore);
  return (
    <button
      class="pixel-button small"
      onClick={() => settingsStore.set({ showZh: !showZh })}
      aria-pressed={showZh}
    >
      中文：{showZh ? '開' : '關'}
    </button>
  );
}

/**
 * A chat log of boxed scene lines: each line is a key that plays it again, with a
 * 慢速 key beside it. Scrolls to the newest line whenever one is added.
 */
export function ChatLines({ lines, current, onPlay }: Props) {
  const { showZh } = useStore(settingsStore);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [lines.length]);

  return (
    <div class="chat" ref={listRef}>
      {lines.map((line, index) => (
        <div key={line.id} class={`bubble-row ${line.speaker}`}>
          <button
            type="button"
            class={`bubble${index === current ? ' current' : ''}`}
            onClick={() => onPlay(index, false)}
          >
            <span class="bubble-who">
              {line.speaker === 'npc' ? ROLE_LABEL[line.role] : ROLE_LABEL.guide}
            </span>
            <span class="bubble-en" lang="en">
              {line.en}
            </span>
            {showZh && <span class="bubble-zh">{line.zh}</span>}
          </button>
          <button
            type="button"
            class="pixel-button small bubble-slow"
            onClick={() => onPlay(index, true)}
          >
            慢速
          </button>
        </div>
      ))}
    </div>
  );
}
