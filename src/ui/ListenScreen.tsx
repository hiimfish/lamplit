import { useEffect, useRef, useState } from 'preact/hooks';
import { playMusic } from '../audio/music';
import { nowPlaying, playAudio, stopAudio } from '../audio/pronounce';
import { playSfx } from '../audio/sfx';
import type { Task, Unit } from '../content/types';
import { lineAudioId, speakerOf } from '../content/units';
import { appStore, commitSave, currentNow } from '../core/appState';
import { dailyFor } from '../core/save';
import { useStore } from '../core/store';
import { finishListen, listenGoal, pickListenTask } from '../learning/listen';
import { taskKey } from '../learning/sessionPlan';
import { ChatLines } from './ChatLines';
import { useKeys } from './keys';
import { KeyCap } from './KeyCap';
import { QuitKey } from './QuitKey';
import { stageFrame, TaskStage } from './stage/SceneStage';
import { stageAt } from './stage/stageState';
import { TOWN } from './TownScreen';
import './flow.css';
import './listen.css';

/** Pause after a line before the next one plays by itself. */
const GAP_MS = 900;
/** 跟著說: after a line, wait as long as it took plus this, to say it aloud. */
const SHADOW_EXTRA_MS = 1200;
/** Browser speech resolves at once; give each word this long so auto-play does not rush. */
const MS_PER_WORD = 320;

type Pick = { unit: Unit; task: Task };

/**
 * 聽力加量: a story already played, heard again in English only. Lines play one
 * after another by themselves (自動); 跟著說 leaves room after each line to say it
 * aloud. 中文 is off here unless turned on for this screen.
 */
export function ListenScreen() {
  const [pick, setPick] = useState<Pick | undefined>(() =>
    pickListenTask(TOWN, appStore.get().save),
  );
  const [shown, setShown] = useState(1);
  const [done, setDone] = useState(false);
  const [zh, setZh] = useState(false);
  const [auto, setAuto] = useState(true);
  const [shadow, setShadow] = useState(false);
  const { save } = useStore(appStore);
  const { audioId: heard } = useStore(nowPlaying);
  useEffect(() => playMusic('cafe'), []);

  // Settings and the newest play, read by timers that outlive a render.
  const autoRef = useRef(auto);
  autoRef.current = auto;
  const shadowRef = useRef(shadow);
  shadowRef.current = shadow;
  const token = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const cancel = () => {
    token.current += 1;
    clearTimeout(timer.current);
  };
  useEffect(
    () => () => {
      cancel();
      stopAudio();
    },
    [],
  );

  const lines = pick?.task.scene ?? [];
  const last = shown >= lines.length;

  const finish = () => {
    if (!pick || done) return;
    cancel();
    commitSave(
      finishListen(appStore.get().save, taskKey(pick.unit.id, pick.task.id), currentNow()),
    );
    playSfx('complete');
    setDone(true);
  };

  const advance = () => {
    cancel();
    if (last) finish();
    else setShown(shown + 1);
  };
  const advanceRef = useRef(advance);
  advanceRef.current = advance;

  /** Plays a line; when it ends and 自動 is on, the next one follows after a gap. */
  const play = async (index: number, slow = false) => {
    const line = lines[index];
    if (!pick || !line) return;
    cancel();
    const mine = token.current;
    const started = performance.now();
    await playAudio(lineAudioId(pick.unit.id, line.id), {
      speed: slow ? 'slow' : 'normal',
      text: line.en,
    });
    if (mine !== token.current) return;
    const took = Math.max(performance.now() - started, line.en.split(/\s+/).length * MS_PER_WORD);
    const wait = shadowRef.current ? took + SHADOW_EXTRA_MS : GAP_MS;
    timer.current = setTimeout(() => {
      if (mine === token.current && autoRef.current) advanceRef.current();
    }, wait);
  };

  useEffect(() => {
    if (!done) void play(shown - 1);
  }, [shown, pick, done]);

  const toggleAuto = () => {
    const next = !auto;
    setAuto(next);
    // Turning it back on goes on from the line on screen.
    if (next && !done) void play(shown - 1);
  };

  const again = () => {
    playSfx('click');
    setPick(pickListenTask(TOWN, appStore.get().save));
    setShown(1);
    setDone(false);
  };
  const toGoal = () => {
    playSfx('click');
    appStore.set({ screen: 'goal' });
  };

  useKeys(
    done
      ? { Enter: toGoal }
      : {
          Enter: advance,
          ArrowRight: advance,
          Space: () => void play(shown - 1),
          'Shift+Space': () => void play(shown - 1, true),
          '0': () => setZh(!zh),
        },
  );

  if (!pick) {
    return (
      <div class="flow" data-testid="listen">
        <div class="flow-card">
          <h1 class="flow-title">聽力加量</h1>
          <p class="flow-note">先玩一關劇情，才有可以重聽的故事。</p>
          <div class="flow-actions">
            <button class="pixel-button primary" onClick={toGoal} data-testid="listen-back">
              回每日目標
              <KeyCap k="Enter" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { unit, task } = pick;
  const frame = stageFrame(unit.id);
  const beat = done ? lines.length : shown;
  const today = dailyFor(save, currentNow()).listened;
  const goal = listenGoal(save.route);
  return (
    <div class={`flow${frame ? ' has-stage' : ''}`} data-testid="listen">
      {frame && (
        <TaskStage
          frame={frame}
          unit={unit}
          scene={task.scene}
          backdrop={task.backdrop}
          view={stageAt(task.scene, beat)}
          beat={beat}
          talking={heard ? speakerOf(heard) : undefined}
        />
      )}
      <div class="flow-card">
        <div class="flow-title">聽力加量</div>
        {done ? (
          <div class="listen-done" data-testid="listen-done">
            <p class="flow-heading">聽完了！</p>
            <p class="flow-note">
              {unit.title}・{task.title}。今天聽了 {today}／{goal} 段。
            </p>
            <div class="flow-actions">
              <button class="pixel-button" onClick={again} data-testid="listen-again">
                再聽一段
              </button>
              <button class="pixel-button primary" onClick={toGoal} data-testid="listen-goal">
                回每日目標
                <KeyCap k="Enter" />
              </button>
            </div>
          </div>
        ) : (
          <div class={`story${last ? '' : ' more'}`}>
            <p class="flow-heading">
              {unit.title}・{task.title}
            </p>
            <ChatLines
              lines={lines.slice(0, shown)}
              current={shown - 1}
              onPlay={(index, slow) => void play(index, slow)}
              keyHints
              zh={zh}
            />
            <div class="listen-options" role="group" aria-label="聽的方式">
              <button
                class="pixel-button small"
                aria-pressed={zh}
                onClick={() => setZh(!zh)}
                data-testid="listen-zh"
              >
                中文：{zh ? '開' : '關'}
                <KeyCap k="0" />
              </button>
              <button
                class="pixel-button small"
                aria-pressed={auto}
                onClick={toggleAuto}
                data-testid="listen-auto"
              >
                自動：{auto ? '開' : '關'}
              </button>
              <button
                class="pixel-button small"
                aria-pressed={shadow}
                onClick={() => setShadow(!shadow)}
                data-testid="listen-shadow"
              >
                跟著說：{shadow ? '開' : '關'}
              </button>
            </div>
            <div class="flow-actions">
              <button class="pixel-button primary" onClick={advance} data-testid="listen-next">
                {last ? '聽完了' : '下一句'}
                <KeyCap k="Enter" />
              </button>
            </div>
          </div>
        )}
        <QuitKey
          label="先回小鎮"
          confirm={false}
          onLeave={() => appStore.set({ screen: 'town' })}
          testId="quit"
        />
      </div>
    </div>
  );
}
