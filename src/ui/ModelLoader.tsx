import { useEffect, useState } from 'preact/hooks';
import { pronSupported } from '../audio/pronModel';
import { preloadModel, preloadStore, type PreloadState } from '../audio/pronPreload';
import { t } from '../core/i18n';
import { useStore } from '../core/store';
import './modelLoader.css';

/** The words over the bar for each phase. */
function label({ phase, cached, progress }: PreloadState): string {
  const percent = `${Math.round(progress * 100)}%`;
  switch (phase) {
    case 'checking':
      return t('檢查發音模型…', 'Checking the pronunciation model…');
    case 'loading':
      return cached
        ? t(`載入發音模型 ${percent}`, `Loading the pronunciation model ${percent}`)
        : t(`下載發音模型 ${percent}`, `Downloading the pronunciation model ${percent}`);
    case 'starting':
      return t('準備發音模型…', 'Setting up the pronunciation model…');
    case 'ready':
      return t('完成', 'Done');
    case 'failed':
      return t(
        '發音模型沒有載入成功，練說話時會再試一次。',
        "The pronunciation model didn't load. It will try again when you speak.",
      );
    default:
      return '';
  }
}

/** How long 完成 stays on the full bar before the start key takes its place. */
const DONE_SHOW_MS = 500;

/**
 * Starts loading the pronunciation model as the title screen opens and says when 點一下開始
 * may show: once it is loaded (after 完成 has been seen for a moment), or at once when it
 * failed or this browser cannot run it, so the game never stays shut (2026-11-26, the
 * player's call: the start waits for the load).
 */
export function useStartOpen(): boolean {
  const { phase } = useStore(preloadStore);
  // Already settled when the screen opens (back on the title later): no 完成 to show.
  const [open, setOpen] = useState(
    () => !pronSupported() || phase === 'ready' || phase === 'failed',
  );
  useEffect(() => {
    void preloadModel();
  }, []);
  useEffect(() => {
    if (open) return;
    if (phase === 'failed') setOpen(true);
    if (phase !== 'ready') return;
    const timer = setTimeout(() => setOpen(true), DONE_SHOW_MS);
    return () => clearTimeout(timer);
  }, [phase, open]);
  return open;
}

/**
 * The title screen's loading bar for the pronunciation model (pronPreload.ts): shown in
 * place of 點一下開始 until the load ends (useStartOpen); after a failed load only its line
 * stays, above the key.
 */
export function ModelLoader() {
  const state = useStore(preloadStore);
  if (state.phase === 'off') return null;
  const firstTime = !state.cached && state.phase !== 'ready' && state.phase !== 'failed';
  return (
    <div class="model-loader" data-testid="model-loader" data-phase={state.phase}>
      <p class="model-loader-label" aria-live="polite">
        {label(state)}
      </p>
      {state.phase !== 'failed' && (
        <div
          class="model-loader-bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(state.progress * 100)}
        >
          <div class="model-loader-fill" style={{ width: `${state.progress * 100}%` }} />
        </div>
      )}
      {firstTime && (
        <p class="model-loader-note">
          {t(
            '第一次要下載約 95MB（建議用 Wi-Fi），之後就不用了。錄音只在這台裝置上評分，不會上傳。',
            'The first time downloads about 95 MB (Wi-Fi is best), just once. Recordings are scored on this device and never uploaded.',
          )}
        </p>
      )}
    </div>
  );
}
