import { useEffect, useRef, useState } from 'preact/hooks';
import { playMusic } from '../audio/music';
import { nowPlaying, playAudio, stopAudio } from '../audio/pronounce';
import { loadModel, modelCached, pronNote, pronSupported } from '../audio/pronModel';
import { playSfx } from '../audio/sfx';
import { createShadowMic } from '../audio/utterance';
import type { Task, Unit } from '../content/types';
import { taskTitle, unitTitle } from '../content/titles';
import { lineAudioId, speakerOf } from '../content/units';
import { appStore, commitSave, currentNow } from '../core/appState';
import { isEnglish, showZhNow, t } from '../core/i18n';
import { dailyFor } from '../core/save';
import { useStore } from '../core/store';
import { finishListen, listenGoal, pickListenTask } from '../learning/listen';
import { taskKey } from '../learning/sessionPlan';
import { spokenScoreText } from '../learning/spokenScore';
import type { SpokenMark } from '../learning/spokenScore';
import { ChatLines } from './ChatLines';
import { useKeys } from './keys';
import { KeyCap } from './KeyCap';
import { ListenLoop, noteInEnglish } from './listenLoop';
import type { ListenLoopSnapshot, ListenSummary } from './listenLoop';
import { QuitKey } from './QuitKey';
import { stageFrame, TaskStage } from './stage/SceneStage';
import { stageAt } from './stage/stageState';
import { TOWN } from './TownScreen';
import { devFallback, devListenPick } from './dev/devPlay';
import './flow.css';
import './listen.css';

type Pick = { unit: Unit; task: Task };

/** The English interface opens no line's Chinese. */
const NO_PEEKS: ReadonlySet<string> = new Set();

const START: ListenLoopSnapshot = {
  phase: 'idle',
  index: -1,
  auto: true,
  shadow: false,
  micOn: false,
  tapToSpeak: false,
  note: undefined,
  progress: 0,
  scoring: false,
  score: null,
  scoredLines: 0,
};

/**
 * 聽力加量: a story already played, heard again in English only. ListenLoop plays the
 * lines one after another by itself (自動); 跟著說 asks you to say each line after it and
 * scores your pronunciation on this device. 中文 is off here unless turned on for this screen
 * (all lines) or opened with 「中」 for one line.
 */
export function ListenScreen() {
  const [pick, setPick] = useState<Pick | undefined>(
    () =>
      pickListenTask(TOWN, appStore.get().save) ?? (devFallback() ? devListenPick() : undefined),
  );
  const [shown, setShown] = useState(1);
  const [done, setDone] = useState(false);
  const [zh, setZh] = useState(false);
  const [peeked, setPeeked] = useState<ReadonlySet<string>>(() => new Set());
  const [marks, setMarks] = useState<Record<string, SpokenMark[]>>({});
  const [spoken, setSpoken] = useState<ListenSummary | undefined>(undefined);
  const [snap, setSnap] = useState<ListenLoopSnapshot>(START);
  const { save } = useStore(appStore);
  const { audioId: heard } = useStore(nowPlaying);

  const lines = pick?.task.scene ?? [];
  const last = shown >= lines.length;

  // What the loop's callbacks read when they run, long after the render that made them.
  const advanceFrom = useRef<(index: number) => void>(() => undefined);
  const loopRef = useRef<ListenLoop | undefined>(undefined);
  // The model is already on this device (checked on arrival): 跟著說 needs no download note.
  // Without WebAssembly there is nothing to download; the first line then says why.
  const modelHere = useRef(!pronSupported());
  if (!loopRef.current) {
    const mic = createShadowMic();
    loopRef.current = new ListenLoop(setSnap, {
      play: (audioId, options) => playAudio(audioId, options),
      stopAudio,
      listen: (options) => mic.attempt(options),
      releaseMic: () => mic.close(),
      now: () => performance.now(),
      modelReady: () => modelHere.current,
      loadModel: async (onProgress) => {
        await loadModel(onProgress);
        modelHere.current = true;
      },
      onAdvance: (index) => advanceFrom.current(index),
    });
  }
  const loop = loopRef.current;

  useEffect(() => {
    void modelCached().then((here) => {
      if (here) modelHere.current = true;
    });
  }, []);
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
    setSpoken(undefined);
  }, [pick]);

  // A score arrives: keep its marks for the line it belongs to.
  useEffect(() => {
    const line = lines[snap.index];
    if (snap.phase !== 'scored' || !snap.score || !line) return;
    const wordMarks = snap.score.marks;
    setMarks((all) => ({ ...all, [line.id]: wordMarks }));
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
  // Never finishes by itself: the last line waits for 聽完了 (the loop does not ask past it).
  advanceFrom.current = (index) => {
    if (index + 1 < lines.length) setShown(index + 2);
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
    if (line && !zh && !isEnglish()) peek(line.id);
  };

  const again = () => {
    playSfx('click');
    setPick(pickListenTask(TOWN, appStore.get().save));
    setShown(1);
    setDone(false);
  };
  const toGoal = () => {
    playSfx('click');
    appStore.set({ screen: 'town' });
  };

  const downloading = snap.phase === 'downloading';
  useKeys(
    !pick || done
      ? { Enter: toGoal }
      : downloading
        ? {}
        : {
            Enter: advance,
            ArrowRight: advance,
            Space: () => loop.play(shown - 1),
            'Shift+Space': () => loop.play(shown - 1, true),
            ...(isEnglish() ? {} : { '0': () => setZh(!zh) }),
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
          <h1 class="flow-title">{t('聽力加量', 'Extra listening')}</h1>
          <p class="flow-note">
            {t(
              '先玩一關劇情，才有可以重聽的故事。',
              'Play a story first, then you can hear it again here.',
            )}
          </p>
          <div class="flow-actions">
            <button class="pixel-button primary" onClick={toGoal} data-testid="listen-back">
              {t('回小鎮', 'Back to town')}
              <KeyCap k="Enter" />
            </button>
          </div>
          <QuitKey
            label={t('先回小鎮', 'Back to town')}
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

  const canSpeak = snap.micOn && pronSupported();
  const speakLabel =
    snap.phase === 'listening'
      ? t('說完了', 'Done speaking')
      : snap.phase === 'scored'
        ? t('再說一次', 'Say it again')
        : t('● 說', '● Speak');
  const speakIdle = snap.phase === 'playing' || snap.phase === 'idle';
  let status = '';
  if (snap.phase === 'listening')
    status = snap.scoring ? t('評分中…', 'Scoring…') : t('● 換你說…', '● Your turn…');
  else if (snap.phase === 'ready')
    status = t('按「說」再唸這一句。', 'Press "Speak" to say this line.');
  else if (snap.phase === 'scored' && snap.score) status = spokenScoreText(snap.score);
  const note = snap.note && (isEnglish() ? noteInEnglish(snap.note) : snap.note);
  if (note) status = status ? `${status} ${note}` : note;
  const unitName = unitTitle(unit);
  const taskName = taskTitle(task);

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
        <div class="flow-title">{t('聽力加量', 'Extra listening')}</div>
        {done ? (
          <div class="listen-done" data-testid="listen-done">
            <p class="flow-heading">{t('聽完了！', 'All done!')}</p>
            <p class="flow-note">
              {t(
                `${unitName}・${taskName}。今天聽了 ${today}／${goal} 段。`,
                `${unitName}: ${taskName}. Today: ${today}/${goal} stories.`,
              )}
            </p>
            {spoken && (
              <p class="flow-note" data-testid="listen-spoken">
                {t(
                  `跟著說 ${spoken.lines} 句，平均 ${spoken.score} 分（發音）。`,
                  `Shadowed ${spoken.lines} lines, average pronunciation score ${spoken.score}.`,
                )}
              </p>
            )}
            <div class="flow-actions">
              <button class="pixel-button" onClick={again} data-testid="listen-again">
                {t('再聽一段', 'Another story')}
              </button>
              <button class="pixel-button primary" onClick={toGoal} data-testid="listen-goal">
                {t('回小鎮', 'Back to town')}
                <KeyCap k="Enter" />
              </button>
            </div>
          </div>
        ) : (
          <div class={`story listen-story${last ? '' : ' more'}`}>
            <p class="flow-heading">{t(`${unitName}・${taskName}`, `${unitName}: ${taskName}`)}</p>
            <ChatLines
              lines={lines.slice(0, shown)}
              current={shown - 1}
              onPlay={(index, slow) => loop.play(index, slow)}
              keyHints
              zh={showZhNow(zh)}
              peeked={isEnglish() ? NO_PEEKS : peeked}
              {...(isEnglish() ? {} : { onPeek: peek })}
              marks={marks}
            />
            {!downloading && (
              <p class="listen-status" aria-live="polite" data-testid="listen-status">
                {status}
              </p>
            )}
            <div
              class="listen-options"
              role="group"
              aria-label={t('聽的方式', 'Listening options')}
              hidden={downloading}
            >
              {!isEnglish() && (
                <button
                  class="pixel-button small"
                  aria-pressed={zh}
                  onClick={() => setZh(!zh)}
                  data-testid="listen-zh"
                >
                  中文：{zh ? '開' : '關'}
                  <KeyCap k="0" />
                </button>
              )}
              <button
                class="pixel-button small"
                aria-pressed={snap.auto}
                onClick={toggleAuto}
                data-testid="listen-auto"
              >
                {t('自動：', 'Auto: ')}
                {snap.auto ? t('開', 'on') : t('關', 'off')}
                <KeyCap k="a" />
              </button>
              <button
                class="pixel-button small"
                aria-pressed={snap.shadow}
                onClick={toggleShadow}
                data-testid="listen-shadow"
              >
                {t('跟著說：', 'Shadowing: ')}
                {snap.shadow ? t('開', 'on') : t('關', 'off')}
                <KeyCap k="s" />
              </button>
            </div>
            {downloading ? (
              <div class="listen-confirm" data-testid="pron-note">
                <p class="flow-note">{pronNote()}</p>
                <p class="flow-note" aria-live="polite" data-testid="pron-progress">
                  {t('下載發音模型', 'Downloading the pronunciation model')}{' '}
                  {Math.round(snap.progress * 100)}%
                </p>
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
                  {last ? t('聽完了', 'Done') : t('下一句', 'Next line')}
                  <KeyCap k="Enter" />
                </button>
              </div>
            )}
          </div>
        )}
        <QuitKey
          label={t('先回小鎮', 'Back to town')}
          confirm={false}
          onLeave={() => appStore.set({ screen: 'town' })}
          testId="quit"
        />
      </div>
    </div>
  );
}
