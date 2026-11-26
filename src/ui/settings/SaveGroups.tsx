/**
 * 設定 → 存檔 and 設定 → 重置: the save code (copy, download, import) and clearing or
 * swapping back this device's progress.
 */
import { useRef, useState } from 'preact/hooks';
import { playSfx } from '../../audio/sfx';
import {
  appStore,
  applyImport,
  currentNow,
  hasBackup,
  resetProgress,
  restoreBackup,
} from '../../core/appState';
import {
  CODE_ERRORS,
  MAX_CODE_CHARS,
  daysSinceExport,
  decodeSaveCode,
  encodeSaveCode,
  markExported,
  saveFileName,
  saveSummary,
  type ImportMode,
} from '../../core/saveCode';
import { t } from '../../core/i18n';
import { settingsStore } from '../../core/settings';
import { browserStorage } from '../../core/storageKeys';
import { useStore } from '../../core/store';

const MODES: { mode: ImportMode; label: [zh: string, en: string] }[] = [
  { mode: 'merge', label: ['合併（預設）', 'Merge (default)'] },
  { mode: 'replace', label: ['完全取代', 'Replace all'] },
];

/**
 * A status line, worded when it is shown: switching 介面語言 while one is up
 * switches it too.
 */
type Message = () => string;
const NO_MESSAGE: Message = () => '';

/** 「上次匯出：3 天前」 */
function lastExportText(days: number | null): string {
  if (days === null) return t('上次匯出：還沒匯出過', 'Last export: never');
  if (days === 0) return t('上次匯出：今天', 'Last export: today');
  return t(`上次匯出：${days} 天前`, `Last export: ${days} days ago`);
}

/**
 * 存檔: copy or download the save code, and import one (pasted or from a .txt file).
 * 合併 keeps both devices' progress; 完全取代 asks once before it overwrites.
 */
export function SaveGroup() {
  const [status, setStatusBox] = useState<{ say: Message }>({ say: NO_MESSAGE });
  const setStatus = (say: Message) => setStatusBox({ say });
  /** The code, shown for selecting by hand when the clipboard is not allowed. */
  const [shown, setShown] = useState<string | null>(null);
  const [pasted, setPasted] = useState('');
  const [mode, setMode] = useState<ImportMode>('merge');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [days, setDays] = useState(() => daysSinceExport(browserStorage(), currentNow()));
  const fileRef = useRef<HTMLInputElement>(null);

  const makeCode = () => encodeSaveCode(appStore.get().save, settingsStore.get(), new Date());
  const exported = () => {
    markExported(browserStorage(), new Date());
    setDays(daysSinceExport(browserStorage(), currentNow()));
  };

  /** Runs one action at a time; a failure says so instead of leaving the buttons off. */
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } catch {
      setStatus(() => t('這次沒有成功，請再試一次。', "That didn't work. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const copy = () =>
    run(async () => {
      const code = await makeCode();
      try {
        await navigator.clipboard.writeText(code);
        setShown(null);
        setStatus(() =>
          t(
            '已複製存檔代碼，貼到另一台裝置的「匯入」就可以。',
            'Save code copied. Paste it into "Import" on the other device.',
          ),
        );
      } catch {
        setShown(code);
        setStatus(() =>
          t(
            '沒辦法自動複製，請全選下面的代碼再複製。',
            "Couldn't copy automatically. Select all of the code below and copy it.",
          ),
        );
      }
      exported();
    });

  const download = () =>
    run(async () => {
      const code = await makeCode();
      const url = URL.createObjectURL(new Blob([code], { type: 'text/plain' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = saveFileName(currentNow());
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      exported();
      setStatus(() => t('已下載存檔檔案。', 'Save file downloaded.'));
    });

  const pickFile = async (input: HTMLInputElement) => {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.size > MAX_CODE_CHARS) {
      setStatus(() => CODE_ERRORS.tooLarge);
      return;
    }
    await run(async () => {
      setPasted(await file.text());
      setConfirming(false);
      setStatus(() =>
        t(
          `已讀入「${file.name}」，按「匯入」完成。`,
          `Loaded "${file.name}". Press "Import" to finish.`,
        ),
      );
    });
  };

  const runImport = async () => {
    if (!pasted.trim()) {
      setStatus(() =>
        t('先貼上存檔代碼，或選擇存檔檔案。', 'Paste a save code or choose a save file first.'),
      );
      return;
    }
    if (mode === 'replace' && !confirming) {
      setConfirming(true);
      setStatus(() =>
        t(
          '完全取代會蓋掉這台裝置現在的進度。確定的話，再按一次「確定取代」。',
          'Replace all overwrites the progress on this device. If you\'re sure, press "Confirm replace".',
        ),
      );
      return;
    }
    setConfirming(false);
    await run(async () => {
      const result = await decodeSaveCode(pasted, currentNow());
      if (!result.ok) {
        const { reason } = result;
        setStatus(() => CODE_ERRORS[reason]);
        return;
      }
      const { coins, cards } = saveSummary(applyImport(result.save, result.settings, mode));
      setPasted('');
      setStatus(() =>
        t(
          `匯入完成：金幣 ${coins}、學過的卡片 ${cards} 張。`,
          `Imported: ${coins} coins, ${cards} cards learned.`,
        ),
      );
    });
  };

  const chooseMode = (next: ImportMode) => {
    setMode(next);
    setConfirming(false);
  };
  // A radio group: ←/→ (or ↑/↓) move the choice and the focus.
  const onModeKey = (e: KeyboardEvent) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const at = MODES.findIndex((m) => m.mode === mode);
    const to = (at + step + MODES.length) % MODES.length;
    chooseMode(MODES[to]!.mode);
    const group = e.currentTarget instanceof HTMLElement ? e.currentTarget : null;
    requestAnimationFrame(() =>
      group?.querySelectorAll<HTMLElement>('[role="radio"]')[to]?.focus(),
    );
  };

  return (
    <div class="settings-group settings-save" data-testid="save-group">
      <p class="settings-note">{lastExportText(days)}</p>
      <div class="settings-actions">
        <button type="button" class="pixel-button" disabled={busy} onClick={() => void copy()}>
          {t('複製存檔代碼', 'Copy save code')}
        </button>
        <button type="button" class="pixel-button" disabled={busy} onClick={() => void download()}>
          {t('下載存檔檔案', 'Download save file')}
        </button>
      </div>
      {shown !== null && (
        <textarea
          class="settings-code"
          readOnly
          rows={3}
          aria-label={t('存檔代碼', 'Save code')}
          value={shown}
          onFocus={(e) => e.currentTarget.select()}
        />
      )}
      <textarea
        class="settings-code"
        rows={3}
        aria-label={t('貼上存檔代碼', 'Paste save code')}
        placeholder={t('在這裡貼上存檔代碼', 'Paste a save code here')}
        value={pasted}
        onInput={(e) => {
          setPasted(e.currentTarget.value);
          setConfirming(false);
        }}
      />
      <div
        class="settings-actions"
        role="radiogroup"
        aria-label={t('匯入方式', 'Import mode')}
        onKeyDown={onModeKey}
      >
        {MODES.map(({ mode: m, label }) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            tabIndex={mode === m ? 0 : -1}
            class={`pixel-button settings-choice${mode === m ? ' primary' : ''}`}
            onClick={() => chooseMode(m)}
          >
            {t(...label)}
          </button>
        ))}
      </div>
      <div class="settings-actions">
        <button
          type="button"
          class="pixel-button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          {t('選擇檔案', 'Choose file')}
        </button>
        <button
          type="button"
          class={`pixel-button${confirming ? ' primary' : ''}`}
          disabled={busy}
          onClick={() => void runImport()}
        >
          {confirming ? t('確定取代', 'Confirm replace') : t('匯入', 'Import')}
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".txt,text/plain"
        hidden
        onChange={(e) => void pickFile(e.currentTarget)}
      />
      <p class="settings-note" role="status" aria-live="polite">
        {status.say()}
      </p>
      <p class="settings-note">
        {t(
          '代碼只檢查有沒有複製完整，不能防止修改。',
          'The code only checks that it was copied whole; it does not stop edits.',
        )}
      </p>
    </div>
  );
}

/**
 * 重置進度: clears this device's progress (tasks, words, coins, exams, history) after a second
 * press; settings stay. Copying the save code first is suggested. 還原上一次的進度 (shown
 * while a backup is kept) swaps back the save from before the last reset or 完全取代 import.
 */
export function ResetGroup() {
  const [armed, setArmed] = useState<'reset' | 'restore' | null>(null);
  const [status, setStatusBox] = useState<{ say: Message }>({ say: NO_MESSAGE });
  const setStatus = (say: Message) => setStatusBox({ say });
  // Re-read on every save change: a 完全取代 import in 存檔 also leaves a backup.
  useStore(appStore);
  const backup = hasBackup();
  const press = (what: 'reset' | 'restore') => {
    playSfx('click');
    if (armed !== what) {
      setArmed(what);
      setStatus(NO_MESSAGE);
      return;
    }
    if (what === 'reset') resetProgress();
    else restoreBackup();
    setArmed(null);
    const coins = appStore.get().save.coins;
    setStatus(() =>
      what === 'reset'
        ? t(
            '進度已重置。按「還原上一次的進度」可以換回來。',
            'Progress reset. Press "Restore last progress" to switch back.',
          )
        : t(
            `已還原：金幣 ${coins}。剛才的進度留作備份，可以再換回來。`,
            `Restored: ${coins} coins. The progress you had is kept as a backup.`,
          ),
    );
  };
  const reset = () => press('reset');
  return (
    <div class="settings-group" data-testid="reset-group">
      <p class="settings-note">
        {armed === 'reset'
          ? t(
              '這台裝置的任務、單字、金幣、考試和每天的紀錄都會清掉，回到第一次玩的樣子（設定不變）。確定的話再按一次。',
              "This device's tasks, words, coins, exams and daily records will be cleared, as on the first play (settings stay). Press again to confirm.",
            )
          : armed === 'restore'
            ? t(
                '換回上一次重置或「完全取代」匯入之前的進度；現在的進度會留作備份。確定的話再按一次。',
                'Switch back to the progress from before the last reset or "Replace all" import; the current progress is kept as a backup. Press again to confirm.',
              )
            : t(
                '從頭開始玩。想留著現在的進度，先在「存檔」複製或下載存檔。',
                'Start over from the beginning. To keep your progress, copy or download it in "Save" first.',
              )}
      </p>
      <div class="settings-actions">
        <button
          type="button"
          class={`pixel-button${armed === 'reset' ? ' primary' : ''}`}
          onClick={reset}
          data-testid="reset-progress"
        >
          {armed === 'reset' ? t('確定重置', 'Confirm reset') : t('重置進度', 'Reset progress')}
        </button>
        {backup && (
          <button
            type="button"
            class={`pixel-button${armed === 'restore' ? ' primary' : ''}`}
            onClick={() => press('restore')}
            data-testid="restore-backup"
          >
            {armed === 'restore'
              ? t('確定還原', 'Confirm restore')
              : t('還原上一次的進度', 'Restore last progress')}
          </button>
        )}
        {armed && (
          <button
            type="button"
            class="pixel-button"
            onClick={() => setArmed(null)}
            data-testid="reset-cancel"
          >
            {t('取消', 'Cancel')}
          </button>
        )}
      </div>
      <p class="settings-note" role="status" aria-live="polite">
        {status.say()}
      </p>
    </div>
  );
}
