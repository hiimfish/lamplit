import { useEffect, useRef } from 'preact/hooks';
import { playChime, unlockAudio } from '../audio/audioContext';
import { appStore } from '../core/appState';
import { useStore } from '../core/store';
import { focusStatic } from './focus';
import { useKeys } from './keys';
import { KeyCap } from './KeyCap';
import { ResultScreen } from './ResultScreen';
import { ReviewScreen } from './ReviewScreen';
import { TaskScreen } from './TaskScreen';
import { TownScreen } from './TownScreen';

const showDebug = new URLSearchParams(window.location.search).has('debug');

function TitleScreen() {
  const start = () => {
    // Must run inside the tap handler so the browser allows sound afterwards.
    unlockAudio();
    playChime();
    appStore.set({ screen: 'town' });
  };
  // A key press is a user gesture too, so Enter or Space can unlock sound and start.
  useKeys({ Enter: start, Space: start });
  return (
    <div class="screen title-screen">
      <div class="title-block">
        <h1 class="title">像素英語小鎮</h1>
        <p class="subtitle" lang="en">
          Pixel English Town
        </p>
      </div>
      <button class="pixel-button primary blink" onClick={start} data-testid="start">
        點一下開始
        <KeyCap k="Enter" />
      </button>
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
  return (
    <>
      {screen === 'title' && <TitleScreen />}
      {screen === 'town' && <TownScreen />}
      {screen === 'task' && <TaskScreen />}
      {screen === 'review' && <ReviewScreen />}
      {screen === 'result' && <ResultScreen />}
      {showDebug && (
        <div class="debug" data-testid="debug">
          {layout.orientation} · zoom {layout.zoom} · {layout.sceneW}×{layout.sceneH} · px{' '}
          {layout.px.toFixed(3)}
        </div>
      )}
    </>
  );
}
