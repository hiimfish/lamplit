import { appStore } from '../core/appState';
import { useStore } from '../core/store';
import './saveError.css';

/** Shown while the last write to localStorage failed (appStore.saveError). */
export function SaveErrorBanner() {
  const { saveError } = useStore(appStore);
  if (!saveError) return null;
  return (
    <div class="save-error" role="alert" data-testid="save-error">
      進度沒有存到這台裝置，請先匯出存檔
    </div>
  );
}
