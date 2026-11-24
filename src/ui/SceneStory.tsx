import { useEffect, useState } from 'preact/hooks';
import { playAudio, stopAudio } from '../audio/pronounce';
import type { Task, Unit } from '../content/types';
import { ACTS, actOf } from '../content/acts';
import { lineAudioId } from '../content/units';
import { settingsStore } from '../core/settings';
import { zhMode } from '../learning/zhMode';
import { ChatLines, ZhToggle } from './ChatLines';
import { useKeys } from './keys';
import { KeyCap } from './KeyCap';
import './flow.css';

/** The Act 3 中文 key: shows or hides all the Chinese on this screen only (not saved). */
export function LocalZhToggle({
  on,
  onToggle,
  hint = false,
}: {
  on: boolean;
  onToggle: () => void;
  hint?: boolean;
}) {
  return (
    <button class="pixel-button small" onClick={onToggle} aria-pressed={on}>
      中文：{on ? '開' : '關'}
      {hint && <KeyCap k="0" />}
    </button>
  );
}

interface Props {
  unit: Unit;
  task: Task;
  onDone: () => void;
  /** Told how many lines are on screen (for the stage). Who bobs comes from `nowPlaying`. */
  onShown?: (shown: number) => void;
}

/** The short story that opens a task: lines appear one by one like a chat. */
export function SceneStory({ unit, task, onDone, onShown }: Props) {
  const [shown, setShown] = useState(1);
  const lines = task.scene;
  const peekMode = zhMode(actOf(unit.id, ACTS)) === 'peek';
  const [allZh, setAllZh] = useState(false);
  const [peeked, setPeeked] = useState<ReadonlySet<string>>(new Set());
  useEffect(() => setPeeked(new Set()), [task.id]);
  const peek = (lineId: string) =>
    setPeeked((now) => {
      const next = new Set(now);
      if (!next.delete(lineId)) next.add(lineId);
      return next;
    });

  useEffect(() => onShown?.(shown), [shown]);

  const play = (index: number, slow: boolean) => {
    const line = lines[index];
    if (!line) return;
    void playAudio(lineAudioId(unit.id, line.id), {
      speed: slow ? 'slow' : 'normal',
      text: line.en,
    });
  };

  // Auto-play each line as it appears.
  useEffect(() => play(shown - 1, false), [shown]);
  useEffect(() => () => stopAudio(), []);

  const last = shown >= lines.length;
  const next = () => (last ? onDone() : setShown(shown + 1));
  // Enter or → for the next line, Space / Shift+Space to hear the newest line, 0 for 中文.
  useKeys({
    Enter: next,
    ArrowRight: next,
    Space: () => play(shown - 1, false),
    'Shift+Space': () => play(shown - 1, true),
    '0': () =>
      peekMode ? setAllZh(!allZh) : settingsStore.set({ showZh: !settingsStore.get().showZh }),
    g: () => {
      const line = lines[shown - 1];
      if (peekMode && line) peek(line.id);
    },
  });
  return (
    <div class={`story${last ? '' : ' more'}`} data-testid="story">
      <p class="flow-heading">先看看發生什麼事</p>
      {peekMode ? (
        <ChatLines
          lines={lines.slice(0, shown)}
          current={shown - 1}
          onPlay={play}
          keyHints
          zh={allZh}
          peeked={peeked}
          onPeek={peek}
        />
      ) : (
        <ChatLines lines={lines.slice(0, shown)} current={shown - 1} onPlay={play} keyHints />
      )}
      <div class="flow-actions">
        {peekMode ? (
          <LocalZhToggle on={allZh} onToggle={() => setAllZh(!allZh)} hint />
        ) : (
          <ZhToggle hint />
        )}
        {last ? (
          <button class="pixel-button primary" onClick={onDone} data-testid="story-next">
            認識新詞塊
            <KeyCap k="Enter" />
          </button>
        ) : (
          <button
            class="pixel-button primary"
            onClick={() => setShown(shown + 1)}
            data-testid="story-next"
          >
            下一句
            <KeyCap k="Enter" />
          </button>
        )}
      </div>
    </div>
  );
}
