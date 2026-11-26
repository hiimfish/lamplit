import { t } from '../core/i18n';
import { useStore } from '../core/store';
import { reloadToUpdate, updateStore } from '../core/update';
import './update.css';

/**
 * 有新版本: a newer build is out while the player is in the middle of something (core/update.ts
 * reloads by itself on the title and in the town). One tap loads it; until then it waits at
 * the top of the screen.
 */
export function UpdateBanner() {
  const { ready } = useStore(updateStore);
  if (!ready) return null;
  return (
    <button
      type="button"
      class="update-banner"
      onClick={() => reloadToUpdate(ready)}
      data-testid="update-banner"
    >
      {t('有新版本，點這裡更新', 'New version: tap to update')}
    </button>
  );
}
