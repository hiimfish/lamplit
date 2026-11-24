// First: moves the old storage keys before any module reads the save or settings.
import './core/boot';
import { render } from 'preact';
import { remeasureLayout } from './core/appState';
import { applyGameLayout, createGame } from './game/createGame';
import { sameLayout, type Layout } from './layout';
import './styles.css';
import { App } from './ui/App';
import { trackInputMode } from './ui/keys';

function applyCssLayout(layout: Layout): void {
  const root = document.documentElement;
  root.dataset.orientation = layout.orientation;
  root.style.setProperty('--px', `${layout.px}px`);
  root.style.setProperty('--scene-w', `${layout.cssW}px`);
  root.style.setProperty('--scene-h', `${layout.cssH}px`);
  root.style.setProperty('--frame-x', `${layout.offsetX}px`);
  root.style.setProperty('--frame-y', `${layout.offsetY}px`);
}

const gameElement = document.getElementById('game');
const uiElement = document.getElementById('ui');
if (!gameElement || !uiElement) throw new Error('index.html is missing #game or #ui');

// The store's first layout was measured before styles.css placed #stage clear of the notch
// and home bar; measure again now that it is, before the game takes its size.
let currentLayout = remeasureLayout();
applyCssLayout(currentLayout);
const game = createGame(gameElement, currentLayout);
render(<App />, uiElement);
trackInputMode();
if (import.meta.env.DEV) {
  // Handy for poking at the game from the browser console while developing.
  (window as unknown as { __game?: unknown }).__game = game;
}

let resizeQueued = false;
function onViewportChange(): void {
  if (resizeQueued) return;
  resizeQueued = true;
  requestAnimationFrame(() => {
    resizeQueued = false;
    const next = remeasureLayout();
    if (sameLayout(next, currentLayout)) return;
    currentLayout = next;
    applyCssLayout(next);
    applyGameLayout(game, next);
  });
}
window.addEventListener('resize', onViewportChange);
window.addEventListener('orientationchange', onViewportChange);
