import { useEffect, useRef, useState } from 'preact/hooks';
import { playMusic } from '../audio/music';
import { nowPlaying, playAudio, stopAudio } from '../audio/pronounce';
import {
  hasSeenRecognitionNote,
  isRecognitionSupported,
  listenAlternatives,
  markRecognitionNoteSeen,
  RECOGNITION_NOTE,
} from '../audio/recognize';
import { playSfx } from '../audio/sfx';
import type { Task, Unit } from '../content/types';
import { lineAudioId, speakerOf } from '../content/units';
import { appStore, commitSave, currentNow } from '../core/appState';
import { dailyFor } from '../core/save';
import { useStore } from '../core/store';
import { finishListen, listenGoal, pickListenTask } from '../learning/listen';
import { taskKey } from '../learning/sessionPlan';
import { SPOKEN_LEVEL_LABEL, scoreSpoken } from '../learning/spokenScore';
import type { SpokenMark, SpokenScore } from '../learning/spokenScore';
import { ChatLines } from './ChatLines';
import { useKeys } from './keys';
import { KeyCap } from './KeyCap';
import { ListenLoop } from './listenLoop';
import type { ListenLoopSnapshot, ListenSummary } from './listenLoop';
import { QuitKey } from './QuitKey';
import { stageFrame, TaskStage } from './stage/SceneStage';
import { stageAt } from './stage/stageState';
import { TOWN } from './TownScreen';
import './flow.css';
import './listen.css';

type Pick = { unit: Unit; task: Task };

const START: ListenLoopSnapshot = {
  phase: 'idle',
  index: -1,
  auto: true,
  shadow: false,
  micOn: false,
  tapToSpeak: false,
  note: undefined,
  score: null,
  scoredLines: 0,
};

/** Shown with the first score of a visit. */
const SCORE_DISCLAIMER = '分數是瀏覽器聽出幾個字，不是發音評分。';

/**
 * 辨識到 N／M 個字: N counts the target's words heard exactly or nearly (a near word is
 * drawn with a thin underline); M counts all words except names that were missed, which
 * the score leaves out as well.
 */
export function heardCount(marks: readonly SpokenMark[]): { heard: number; total: number } {
  let heard = 0;
  let total = 0;
  for (const mark of marks) {
    if (mark.status === 'missed' && mark.free) continue;
    total += 1;
    if (mark.status !== 'missed') heard += 1;
  }
  return { heard, total };
}

function scoreText(score: SpokenScore): string {
  const { heard, total } = heardCount(score.marks);
  return `辨識到 ${heard}／${total} 個字・${score.score} 分・${SPOKEN_LEVEL_LABEL[score.level]}`;
}

/**
 * 聽力加量: a story already played, heard again in English only. ListenLoop plays the
 * lines one after another by itself (自動); 跟著說 asks you to say each line after it and
 * scores what the browser recognised. 中文 is off here unless turned on for this screen
 * (all lines) or opened with 「中」 for one line.
 */
export function ListenScreen() {
  const [pick, setPick] = useState<Pick | undefined>(() =>
    pickListenTask(TOWN, appStore.get().save),
  );
  const [shown, setShown] = useState(1);
  const [done, setDone] = useState(false);
  const [zh, setZh] = useState(false);
  const [peeked, setPeeked] = useState<ReadonlySet<string>>(() => new Set());
  const [marks, setMarks] = useState<Record<string, SpokenMark[]>>({});
  const [firstScored, setFirstScored] = useState<number | undefined>(undefined);
  const [spoken, setSpoken] = useState<ListenSummary | undefined>(undefined);
  const [snap, setSnap] = useState<ListenLoopSnapshot>(START);
  const { save } = useStore(appStore);
  const { audioId: heard } = useStore(nowPlaying);

  const lines = pick?.task.scene ?? [];
  const last = shown >= lines.length;

  // What the loop's callbacks read when they run, long after the render that made them.
  const advanceFrom = useRef<(index: number) => void>(() => undefined);
  const loopRef = useRef<ListenLoop | undefined>(undefined);
  if (!loopRef.current) {
    loopRef.current = new ListenLoop(setSnap, {
      play: (audioId, options) => playAudio(audioId, options),
      stopAudio,
      listen: ({ timeoutMs }) => listenAlternatives({ timeoutMs }),
      scoreSpoken,
      now: () => performance.now(),
      noteSeen: hasSeenRecognitionNote,
      markNoteSeen: markRecognitionNoteSeen,
      onAdvance: (index) => advanceFrom.current(index),
    });
  }
  const loop = loopRef.current;

  useEffect(
    () => () => {
      loop.dispose();
      stopAudio();
    },
    [],
  );
  useEffect(() => {
    const onHide = () => {
      if (document.hidden) loop.halt();
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  // The cafe music stops while 跟著說 has the microphone, so it is not picked up.
  useEffect(() => playMusic(snap.micOn ? null : 'cafe'), [snap.micOn]);

  // A new scene: the loop's lines, and no peeks, marks or scores left over.
  useEffect(() => {
    loop.setLines(
      lines.map((line) => ({
        audioId: lineAudioId(pick?.unit.id ?? '', line.id),
        text: line.en,
      })),
    );
    setPeeked(new Set());
    setMarks({});
    setFirstScored(undefined);
    setSpoken(undefined);
  }, [pick]);

  // A score arrives: keep its marks for the line it belongs to.
  useEffect(() => {
    const line = lines[snap.index];
    if (snap.phase !== 'scored' || !snap.score || !line) return;
    const wordMarks = snap.score.marks;
    setMarks((all) => ({ ...all, [line.id]: wordMarks }));
    setFirstScored((first) => first ?? snap.index);
  }, [snap.phase, snap.score]);

  const finish = () => {
    if (!pick || done) return;
    loop.halt();
    const summary = loop.summary();
    commitSave(
      finishListen(
        appStore.get().save,
        taskKey(pick.unit.id, pick.task.id),
        currentNow(),
        summary && { ...summary, sceneLines: lines.length },
      ),
    );
    playSfx('complete');
    setSpoken(summary);
    setDone(true);
  };

  /** The loop asks for the line after `index` (its newest played line). */
  advanceFrom.current = (index) => {
    if (index + 1 >= lines.length) finish();
    else setShown(index + 2);
  };

  const advance = () => {
    loop.halt();
    if (last) finish();
    else setShown(shown + 1);
  };

  useEffect(() => {
    if (!done && pick) loop.play(shown - 1);
  }, [shown, pick, done]);

  const toggleAuto = () => loop.setAuto(!snap.auto);
  const toggleShadow = () => loop.setShadow(!snap.shadow);
  const peek = (lineId: string) =>
    setPeeked((open) => {
      const next = new Set(open);
      if (!next.delete(lineId)) next.add(lineId);
      return next;
    });
  const peekCurrent = () => {
    const line = lines[shown - 1];
    if (line && !zh) peek(line.id);
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

  const confirming = snap.phase === 'confirm';
  useKeys(
    !pick || done
      ? { Enter: toGoal }
      : confirming
        ? { Enter: () => loop.confirm(), Escape: () => loop.decline() }
        : {
            Enter: advance,
            ArrowRight: advance,
            Space: () => loop.play(shown - 1),
            'Shift+Space': () => loop.play(shown - 1, true),
            '0': () => setZh(!zh),
            g: peekCurrent,
            a: toggleAuto,
            s: toggleShadow,
            r: () => loop.speak(),
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

  const { unit, task } = pick;
  const frame = stageFrame(unit.id);
  const beat = done ? lines.length : shown;
  const today = dailyFor(save, currentNow()).listened;
  const goal = listenGoal(save.route);

  const canSpeak = snap.micOn && isRecognitionSupported();
  const speakLabel =
    snap.phase === 'listening' ? '說完了' : snap.phase === 'scored' ? '再說一次' : '● 說';
  const speakIdle = snap.phase === 'playing' || snap.phase === 'idle';
  let status = '';
  if (snap.phase === 'listening') status = '● 換你說…';
  else if (snap.phase === 'ready') status = '按「說」再唸這一句。';
  else if (snap.phase === 'scored' && snap.score) {
    status = scoreText(snap.score);
    if (snap.index === firstScored) status += ` ${SCORE_DISCLAIMER}`;
  }
  if (snap.note) status = status ? `${status} ${snap.note}` : snap.note;

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
            {spoken && (
              <p class="flow-note" data-testid="listen-spoken">
                跟著說 {spoken.lines} 句，平均 {spoken.score} 分（辨識到的字）。
              </p>
            )}
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
          <div class={`story listen-story${last ? '' : ' more'}`}>
            <p class="flow-heading">
              {unit.title}・{task.title}
            </p>
            <ChatLines
              lines={lines.slice(0, shown)}
              current={shown - 1}
              onPlay={(index, slow) => loop.play(index, slow)}
              keyHints
              zh={zh}
              peeked={peeked}
              onPeek={peek}
              marks={marks}
            />
            {!confirming && (
              <p class="listen-status" aria-live="polite" data-testid="listen-status">
                {status}
              </p>
            )}
            <div class="listen-options" role="group" aria-label="聽的方式" hidden={confirming}>
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
                aria-pressed={snap.auto}
                onClick={toggleAuto}
                data-testid="listen-auto"
              >
                自動：{snap.auto ? '開' : '關'}
                <KeyCap k="a" />
              </button>
              <button
                class="pixel-button small"
                aria-pressed={snap.shadow}
                onClick={toggleShadow}
                data-testid="listen-shadow"
              >
                跟著說：{snap.shadow ? '開' : '關'}
                <KeyCap k="s" />
              </button>
            </div>
            {confirming ? (
              <div class="listen-confirm" data-testid="recognize-note">
                <p class="flow-note">{RECOGNITION_NOTE}</p>
                <div class="flow-actions">
                  <button
                    class="pixel-button primary"
                    onClick={() => loop.confirm()}
                    data-testid="recognize-confirm"
                  >
                    繼續辨識
                    <KeyCap k="Enter" />
                  </button>
                  <button
                    class="pixel-button"
                    onClick={() => loop.decline()}
                    data-testid="recognize-cancel"
                  >
                    不用辨識
                    <KeyCap k="Escape" />
                  </button>
                </div>
              </div>
            ) : (
              <div class="flow-actions">
                {canSpeak && (
                  <button
                    class="pixel-button"
                    disabled={speakIdle}
                    onClick={() => loop.speak()}
                    data-testid="listen-speak"
                  >
                    {speakLabel}
                    <KeyCap k="r" />
                  </button>
                )}
                <button class="pixel-button primary" onClick={advance} data-testid="listen-next">
                  {last ? '聽完了' : '下一句'}
                  <KeyCap k="Enter" />
                </button>
              </div>
            )}
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
