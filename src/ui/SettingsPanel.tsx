import { useRef } from 'preact/hooks';
import { playAudio } from '../audio/pronounce';
import { playSfx } from '../audio/sfx';
import type { VoiceMode } from '../audio/voices';
import { settingsStore, type Settings, DEV_TOOLS } from '../core/settings';
import { useStore } from '../core/store';
import './settings.css';
import { useModal } from './useModal';
import { KeyCap } from './KeyCap';

const TEST_CLIP = 'cafe.chunk.can_i_get';
const TEST_TEXT = 'Can I get';

const VOICES: { mode: VoiceMode; label: string }[] = [
  { mode: 'neural2', label: '聲線 A（Neural2）' },
  { mode: 'chirp', label: '聲線 B（Chirp 3 HD，預設）' },
];

type VolumeKey = 'musicVolume' | 'voiceVolume' | 'sfxVolume';

const SLIDERS: { key: VolumeKey; label: string }[] = [
  { key: 'musicVolume', label: '音樂' },
  { key: 'voiceVolume', label: '發音' },
  { key: 'sfxVolume', label: '音效' },
];

function VolumeSlider({
  id,
  volumeKey,
  label,
  value,
}: {
  id: string;
  volumeKey: VolumeKey;
  label: string;
  value: number;
}) {
  const percent = Math.round(value * 100);
  return (
    <div class="settings-row">
      <label class="settings-label" for={id}>
        {label}
      </label>
      <input
        id={id}
        class="settings-slider"
        type="range"
        min="0"
        max="100"
        step="5"
        value={percent}
        aria-valuetext={`${percent}%`}
        style={{ '--fill': `${percent}%` }}
        onInput={(e) => {
          settingsStore.set({
            [volumeKey]: Number((e.currentTarget as HTMLInputElement).value) / 100,
          } as Partial<Settings>);
        }}
        onChange={() => playSfx('click')}
      />
      <span class="settings-value" aria-hidden="true">
        {percent}%
      </span>
    </div>
  );
}
function VoiceChoice({ voiceMode }: { voiceMode: VoiceMode }) {
  // A radio group: ←/→ (or ↑/↓) move the choice and the focus.
  const onKey = (e: KeyboardEvent) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const at = VOICES.findIndex((v) => v.mode === voiceMode);
    const to = (at + step + VOICES.length) % VOICES.length;
    settingsStore.set({ voiceMode: VOICES[to]!.mode });
    const group = e.currentTarget instanceof HTMLElement ? e.currentTarget : null;
    requestAnimationFrame(() =>
      group?.querySelectorAll<HTMLElement>('[role="radio"]')[to]?.focus(),
    );
  };
  return (
    <div class="settings-group" role="radiogroup" aria-label="發音聲線" onKeyDown={onKey}>
      {VOICES.map(({ mode, label }) => (
        <button
          key={mode}
          type="button"
          role="radio"
          aria-checked={voiceMode === mode}
          tabIndex={voiceMode === mode ? 0 : -1}
          class={`pixel-button settings-choice${voiceMode === mode ? ' primary' : ''}`}
          onClick={() => settingsStore.set({ voiceMode: mode })}
        >
          {label}
        </button>
      ))}
      <p class="settings-note">慢速重播一律使用聲線 A（Neural2）。</p>
    </div>
  );
}

function VolumeGroup({ settings }: { settings: Settings }) {
  return (
    <div class="settings-group">
      {SLIDERS.map(({ key, label }) => (
        <VolumeSlider
          key={key}
          id={`vol-${key}`}
          volumeKey={key}
          label={label}
          value={settings[key]}
        />
      ))}
    </div>
  );
}

function TestButtons() {
  const test = (speed: 'normal' | 'slow') => void playAudio(TEST_CLIP, { speed, text: TEST_TEXT });
  return (
    <div class="settings-group settings-actions">
      <button type="button" class="pixel-button" onClick={() => test('normal')}>
        試聽
      </button>
      <button type="button" class="pixel-button" onClick={() => test('slow')}>
        試聽（慢速）
      </button>
    </div>
  );
}

function ZhSwitch({ showZh }: { showZh: boolean }) {
  return (
    <div class="settings-group">
      <button
        type="button"
        role="switch"
        aria-checked={showZh}
        class={`pixel-button settings-choice${showZh ? ' primary' : ''}`}
        onClick={() => settingsStore.set({ showZh: !showZh })}
      >
        顯示中文：{showZh ? '開' : '關'}
      </button>
    </div>
  );
}

/** The keyboard scheme (src/ui/keys.ts), shown only on computers with a mouse. */
export const KEY_LIST: [keys: string, what: string][] = [
  ['1～9', '選答案（A～D 的題目也可以按字母）'],
  ['Enter', '下一句、下一張、檢查、繼續、下一關'],
  ['空白鍵', '再聽一次'],
  ['Shift＋空白鍵', '慢速（算用了幫助）'],
  ['0', '看中文／中文開關'],
  ['← →', '上一張／下一張'],
  ['打字', '排句子、拼字：打出單字'],
  ['Backspace', '排句子：拿掉最後一個字'],
  ['Esc', '排句子：重排；關閉設定'],
];

function KeyList() {
  return (
    <div class="settings-group settings-keys">
      <p class="settings-label">鍵盤</p>
      <dl class="settings-key-list">
        {KEY_LIST.map(([keys, what]) => (
          <div key={keys} class="settings-key-row">
            <dt>
              <kbd>{keys}</kbd>
            </dt>
            <dd>{what}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Dev server only: open every task, to try any of them without clearing the ones before. */
function DevSwitch({ unlockAll }: { unlockAll: boolean }) {
  return (
    <div class="settings-group">
      <button
        type="button"
        role="switch"
        aria-checked={unlockAll}
        class={`pixel-button settings-choice${unlockAll ? ' primary' : ''}`}
        onClick={() => settingsStore.set({ unlockAll: !unlockAll })}
        data-testid="dev-unlock-all"
      >
        開發模式（所有關卡都能玩）：{unlockAll ? '開' : '關'}
      </button>
      <p class="flow-note">只在開發伺服器出現，正式版不會有。</p>
    </div>
  );
}

const TITLE_ID = 'settings-title';

/** Modal settings dialog. The caller dims and inerts the screen behind it. */
export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const settings = useStore(settingsStore);
  const panelRef = useRef<HTMLDivElement>(null);
  useModal(panelRef, onClose);

  return (
    <div
      ref={panelRef}
      class="pixel-panel settings-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby={TITLE_ID}
      tabIndex={-1}
    >
      <h2 class="settings-title" id={TITLE_ID}>
        設定
      </h2>
      <VoiceChoice voiceMode={settings.voiceMode} />
      <VolumeGroup settings={settings} />
      <TestButtons />
      <ZhSwitch showZh={settings.showZh} />
      <KeyList />
      {DEV_TOOLS && <DevSwitch unlockAll={settings.unlockAll} />}
      <button type="button" class="pixel-button settings-close" onClick={onClose}>
        關閉
        <KeyCap k="Escape" />
      </button>
    </div>
  );
}
