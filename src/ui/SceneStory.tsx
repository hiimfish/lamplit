import { useEffect, useState } from 'preact/hooks';
import { playAudio, stopAudio } from '../audio/pronounce';
import type { Task, Unit } from '../content/types';
import { lineAudioId } from '../content/units';
import { ChatLines, ZhToggle } from './ChatLines';
import './flow.css';

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
  return (
    <div class={`story${last ? '' : ' more'}`} data-testid="story">
      <p class="flow-heading">先看看發生什麼事</p>
      <ChatLines lines={lines.slice(0, shown)} current={shown - 1} onPlay={play} />
      <div class="flow-actions">
        <ZhToggle />
        {last ? (
          <button class="pixel-button primary" onClick={onDone} data-testid="story-next">
            認識新詞塊
          </button>
        ) : (
          <button
            class="pixel-button primary"
            onClick={() => setShown(shown + 1)}
            data-testid="story-next"
          >
            下一句
          </button>
        )}
      </div>
    </div>
  );
}
