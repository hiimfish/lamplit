/**
 * Runs before anything reads storage: main.tsx imports this module first, so the
 * module-level reads in appState.ts and settings.ts see the moved keys.
 */
import { browserStorage, migrateStorageKeys } from './storageKeys';

migrateStorageKeys(browserStorage());

// Ask the browser not to clear our storage under pressure. The answer does not matter.
try {
  void navigator.storage?.persist?.().catch(() => undefined);
} catch {
  // not available here
}
