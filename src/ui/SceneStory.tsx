import { createPortal } from 'preact/compat';
import { useEffect, useRef, useState } from 'preact/hooks';
import { playAudio, stopAudio } from '../audio/pronounce';
import { ROLE_LABEL } from '../content/roles';
import type { Role, Task, Unit } from '../content/types';
import { lineAudioId } from '../content/units';
import { settingsStore } from '../core/settings';
import { appStore } from '../core/appState';
import { useStore } from '../core/store';
import { hasStage, SceneStage } from './stage/SceneStage';
import { stageArea } from './stage/stageArea';
import './flow.css';

interface Props {
  unit: Unit;
  task: Task;
  onDone: () => void;
}

/** The short story that opens a task: lines appear one by one like a chat. */
export function SceneStory({ unit, task, onDone }: Props) {
  const { showZh } = useStore(settingsStore);
  const { layout } = useStore(appStore);
  const [shown, setShown] = useState(1);
  const [talking, setTalking] = useState<Role | undefined>(undefined);
  const listRef = useRef<HTMLDivElement>(null);
  /** Bumped on every play so an older clip ending does not stop a newer one's bobbing. */
  const playToken = useRef(0);
  const lines = task.scene;
  const withStage = hasStage(unit.id);

  const play = (index: number, slow: boolean) => {
    const line = lines[index];
    if (!line) return;
    const token = ++playToken.current;
    setTalking(line.role);
    void playAudio(lineAudioId(unit.id, line.id), {
      speed: slow ? 'slow' : 'normal',
      text: line.en,
    }).then(() => {
      if (playToken.current === token) setTalking(undefined);
    });
  };

  // Auto-play each line as it appears.
  useEffect(() => {
    play(shown - 1, false);
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [shown]);
  useEffect(
    () => () => {
      playToken.current++;
      stopAudio();
    },
    [],
  );

  // The stage is drawn over the top of the scene (#frame), edge to edge. In
  // landscape the story card sits to its right; --stage-w tells the card how much
  // room the stage takes.
  const area = stageArea(layout);
  const frame =
    withStage && typeof document !== 'undefined' ? document.getElementById('frame') : null;
  const columnW = frame && layout.orientation === 'landscape' ? area.w : 0;
  useEffect(() => {
    if (!frame || columnW === 0) return;
    frame.style.setProperty('--stage-w', `calc(${columnW} * var(--px))`);
    return () => frame.style.removeProperty('--stage-w');
  }, [frame, columnW]);

  const last = shown >= lines.length;
  return (
    <div class={`story${last ? '' : ' more'}${frame ? ' has-stage' : ''}`} data-testid="story">
      {frame &&
        createPortal(
          <SceneStage unit={unit} lines={lines} shown={shown} talking={talking} area={area} />,
          frame,
        )}
      <p class="flow-heading">先看看發生什麼事</p>
      <div class="chat" ref={listRef}>
        {lines.slice(0, shown).map((line, index) => (
          <div key={line.id} class={`bubble-row ${line.speaker}`}>
            <button
              type="button"
              class={`bubble${index === shown - 1 ? ' current' : ''}`}
              onClick={() => play(index, false)}
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
              onClick={() => play(index, true)}
            >
              慢速
            </button>
          </div>
        ))}
      </div>
      <div class="flow-actions">
        <button
          class="pixel-button small"
          onClick={() => settingsStore.set({ showZh: !showZh })}
          aria-pressed={showZh}
        >
          中文：{showZh ? '開' : '關'}
        </button>
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
