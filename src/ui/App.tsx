import { useEffect, useRef } from 'preact/hooks';
import { playChime, unlockAudio } from '../audio/audioContext';
import { appStore, setDayStamp } from '../core/appState';
import { recordToday } from '../core/save';
import { devUnlockAll, settingsStore } from '../core/settings';
import { useStore } from '../core/store';
import { goalStatus } from '../learning/dailyGoal';
import { grammarOn } from '../learning/grammarOn';
import { continueTarget } from '../learning/townPlan';
import { ExamScreen } from './exam/ExamScreen';
import { SkipScreen } from './exam/SkipScreen';
import { focusStatic } from './focus';
import { GrammarDrillScreen } from './GrammarDrillScreen';
import { useKeys } from './keys';
import { KeyCap } from './KeyCap';
import { ListenScreen } from './ListenScreen';
import { ProgressScreen } from './ProgressScreen';
import { ResultScreen } from './ResultScreen';
import { SaveErrorBanner } from './SaveErrorBanner';
import { ReviewScreen } from './ReviewScreen';
import { SprintScreen } from './SprintScreen';
import { TaskScreen } from './TaskScreen';
import { TOWN, TownScreen } from './TownScreen';
import { useFullScreen } from './useFullScreen';

/** Menu-type screens: on a phone held upright they take the whole screen (useFullScreen). */
const FULL_SCREENS = new Set(['review', 'sprint', 'progress', 'exam', 'skip', 'grammar', 'result']);

const showDebug = new URLSearchParams(window.location.search).has('debug');

// Every save records today's counters and whether all of 每日目標 is met.
setDayStamp((save, now) =>
  recordToday(save, now, goalStatus(TOWN, save, now, undefined, grammarOn(save, TOWN)).all),
);

function TitleScreen() {
  const { save } = useStore(appStore);
  const settings = useStore(settingsStore);
  const played = Object.keys(save.tasks).length > 0;
  // 繼續 opens the town on the act of the next new task. It no longer goes straight into it,
  // nor names the task under the key (2026-11-25, the user's calls).
  const target = continueTarget(TOWN, save, undefined, devUnlockAll(settings));
  const resume = played || (save.skipTo ?? 0) > 0;
  const into = target && (played || settings.seenIntro) ? target : undefined;
  const start = () => {
    // Must run inside the tap handler so the browser allows sound afterwards.
    unlockAudio();
    playChime();
    appStore.set({ screen: 'town', ...(into ? { town: { act: into.act } } : {}) });
  };
  // A key press is a user gesture too, so Enter or Space can unlock sound and start.
  useKeys({ Enter: start, Space: start });
  return (
    <div class="screen title-screen">
      <div class="title-block">
        <h1 class="title" lang="en">
          Lamplit
        </h1>
        <p class="subtitle">英語學習</p>
      </div>
      <button class="pixel-button primary blink" onClick={start} data-testid="start">
        {resume ? '點一下繼續' : '點一下開始'}
        <KeyCap k="Enter" />
      </button>
      <footer class="title-notice" data-testid="title-notice">
        <p>TOEIC®（多益）是 ETS 的註冊商標。本遊戲與 ETS 無關，未經 ETS 認可或贊助。</p>
        <p lang="en">
          TOEIC is a registered trademark of ETS. This product is not endorsed or approved by ETS.
        </p>
        <p>© 2026 Fish · MIT License</p>
      </footer>
    </div>
  );
}

/**
 * On every screen change the key that was pressed is gone, so focus would fall
 * to <body>. Move it to the new screen's main heading instead.
 */
function useScreenFocus(screen: string) {
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    focusStatic(document.getElementById('ui')?.querySelector('h1, h2, .flow-title'));
  }, [screen]);
}

export function App() {
  const { screen, layout } = useStore(appStore);
  useScreenFocus(screen);
  useFullScreen(FULL_SCREENS.has(screen));
  return (
    <>
      {screen === 'title' && <TitleScreen />}
      {screen === 'town' && <TownScreen />}
      {screen === 'task' && <TaskScreen />}
      {screen === 'review' && <ReviewScreen />}
      {screen === 'sprint' && <SprintScreen />}
      {screen === 'listen' && <ListenScreen />}
      {screen === 'progress' && <ProgressScreen />}
      {screen === 'exam' && <ExamScreen />}
      {screen === 'skip' && <SkipScreen />}
      {screen === 'grammar' && <GrammarDrillScreen />}
      {screen === 'result' && <ResultScreen />}
      <SaveErrorBanner />
      {showDebug && (
        <div class="debug" data-testid="debug">
          {layout.orientation} · zoom {layout.zoom} · {layout.sceneW}×{layout.sceneH} · px{' '}
          {layout.px.toFixed(3)}
        </div>
      )}
    </>
  );
}
