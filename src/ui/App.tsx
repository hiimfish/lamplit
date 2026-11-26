import { useEffect, useRef } from 'preact/hooks';
import { playChime, unlockAudio } from '../audio/audioContext';
import { appStore, setDayStamp } from '../core/appState';
import { isEnglish, t } from '../core/i18n';
import { recordToday } from '../core/save';
import { DEV_TOOLS, devUnlockAll, EN_SCALE, settingsStore, TEXT_SCALE } from '../core/settings';
import { useStore } from '../core/store';
import { goalStatus } from '../learning/dailyGoal';
import { grammarOn } from '../learning/grammarOn';
import { shouldOnboard } from '../learning/onboarding';
import { continueTarget } from '../learning/townPlan';
import { ExamScreen } from './exam/ExamScreen';
import { SkipScreen } from './exam/SkipScreen';
import { focusStatic } from './focus';
import { GrammarDrillScreen } from './GrammarDrillScreen';
import { useKeys } from './keys';
import { KeyCap } from './KeyCap';
import { ListenScreen } from './ListenScreen';
import { ModelLoader, useStartOpen } from './ModelLoader';
import { preloadStore } from '../audio/pronPreload';
import { ProgressScreen } from './ProgressScreen';
import { ResultScreen } from './ResultScreen';
import { SaveErrorBanner } from './SaveErrorBanner';
import { UpdateBanner } from './UpdateBanner';
import { ReviewScreen } from './ReviewScreen';
import { SprintScreen } from './SprintScreen';
import { TaskScreen } from './TaskScreen';
import { TOWN, TownScreen } from './TownScreen';
import { useFullScreen } from './useFullScreen';
import { WelcomeScreen } from './WelcomeScreen';
import { DevQuizScreen } from './dev/DevQuizScreen';

/** Menu-type screens: on a phone held upright they take the whole screen (useFullScreen). */
const FULL_SCREENS = new Set([
  'welcome',
  'review',
  'sprint',
  'progress',
  'exam',
  'skip',
  'grammar',
  'result',
  'devquiz',
]);

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
    // A first visit goes through the questions (level, route, language) before the town.
    if (shouldOnboard(settingsStore.get(), appStore.get().save)) {
      appStore.set({ screen: 'welcome' });
      return;
    }
    appStore.set({ screen: 'town', ...(into ? { town: { act: into.act } } : {}) });
  };
  // The start key waits for the pronunciation model (ModelLoader shows the bar meanwhile).
  const open = useStartOpen();
  // A key press is a user gesture too, so Enter or Space can unlock sound and start.
  useKeys(open ? { Enter: start, Space: start } : {});
  return (
    <div class="screen title-screen">
      <div class="title-block">
        <h1 class="title" lang="en">
          Lamplit
        </h1>
        <p class="subtitle">{t('英語學習', 'Learn English')}</p>
      </div>
      {/*
       * The start key keeps its place while the model loads (hidden, the bar laid over it),
       * so nothing on the screen moves when the bar turns into the key.
       */}
      <div class="title-start">
        <button
          class="pixel-button primary blink"
          onClick={start}
          disabled={!open}
          aria-hidden={!open}
          tabIndex={open ? undefined : -1}
          data-testid="start"
        >
          {resume ? t('點一下繼續', 'Tap to continue') : t('點一下開始', 'Tap to start')}
          <KeyCap k="Enter" />
        </button>
        {!open && <ModelLoader />}
      </div>
      {open && preloadStore.get().phase === 'failed' && <ModelLoader />}
      <footer class="title-notice" data-testid="title-notice">
        {!isEnglish() && (
          <p>TOEIC®（多益）是 ETS 的註冊商標。本遊戲與 ETS 無關，未經 ETS 認可或贊助。</p>
        )}
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
  // 文字大小, 英文大小 and 介面語言 (設定 → 顯示). Every setting change re-renders the whole tree from
  // here (no component is memoized), so t() calls pick up a new language in place.
  const { textSize, enSize, uiLang } = useStore(settingsStore);
  useEffect(() => {
    document.documentElement.style.setProperty('--text-scale', String(TEXT_SCALE[textSize]));
  }, [textSize]);
  useEffect(() => {
    document.documentElement.style.setProperty('--en-scale', String(EN_SCALE[enSize]));
  }, [enSize]);
  useEffect(() => {
    document.documentElement.lang = uiLang === 'en' ? 'en' : 'zh-Hant';
  }, [uiLang]);
  useScreenFocus(screen);
  useFullScreen(FULL_SCREENS.has(screen));
  return (
    <>
      {screen === 'title' && <TitleScreen />}
      {screen === 'welcome' && <WelcomeScreen />}
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
      {screen === 'devquiz' && DEV_TOOLS && <DevQuizScreen />}
      <SaveErrorBanner />
      <UpdateBanner />
      {showDebug && (
        <div class="debug" data-testid="debug">
          {layout.orientation} · zoom {layout.zoom} · {layout.sceneW}×{layout.sceneH} · px{' '}
          {layout.px.toFixed(3)}
        </div>
      )}
    </>
  );
}
