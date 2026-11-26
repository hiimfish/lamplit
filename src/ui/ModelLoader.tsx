import { useEffect } from 'preact/hooks';
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
      return t('發音模型準備好了', 'Pronunciation model ready');
    case 'failed':
      return t(
        '發音模型沒有載入成功，練說話時會再試一次。',
        "The pronunciation model didn't load. It will try again when you speak.",
      );
    default:
      return '';
  }
}

/**
 * The title screen's loading bar: starts loading the pronunciation model as the game opens
 * (pronPreload.ts) and shows how far it is. 點一下開始 never waits for it.
 */
export function ModelLoader() {
  const state = useStore(preloadStore);
  useEffect(() => {
    void preloadModel();
  }, []);
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
            '第一次要下載約 95MB（建議用 Wi-Fi），之後就不用了。可以先開始玩。錄音只在這台裝置上評分，不會上傳。',
            'The first time downloads about 95 MB (Wi-Fi is best), just once. You can start playing meanwhile. Recordings are scored on this device and never uploaded.',
          )}
        </p>
      )}
    </div>
  );
}
