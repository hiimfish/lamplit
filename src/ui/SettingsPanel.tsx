import { useRef, useState } from 'preact/hooks';
import { playAudio } from '../audio/pronounce';
import { playSfx } from '../audio/sfx';
import type { VoiceMode } from '../audio/voices';
import { appStore } from '../core/appState';
import { settingsStore, type Settings, type TextSize, DEV_TOOLS } from '../core/settings';
import { t } from '../core/i18n';
import { useStore } from '../core/store';
import { KeyCap } from './KeyCap';
import { RouteGroup } from './settings/RouteGroup';
import { ResetGroup, SaveGroup } from './settings/SaveGroups';
import './settings.css';
import { useFullScreen } from './useFullScreen';
import { useModal } from './useModal';

const TEST_CLIP = 'cafe.chunk.can_i_get';
const TEST_TEXT = 'Can I get';

const VOICES: { mode: VoiceMode; label: string }[] = [
  { mode: 'neural2', label: 'A（Neural2）' },
  { mode: 'chirp', label: 'B（Chirp 3 HD）' },
];

type VolumeKey = 'musicVolume' | 'voiceVolume' | 'sfxVolume';

const SLIDERS: { key: VolumeKey; label: string }[] = [
  { key: 'musicVolume', label: '音樂' },
  { key: 'voiceVolume', label: '發音' },
  { key: 'sfxVolume', label: '音效' },
];

/** ←/→ (or ↑/↓) as a step through a list, or undefined for any other key. */
function arrowStep(e: KeyboardEvent): number | undefined {
  return { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
}

function VolumeSlider({
  volumeKey,
  label,
  value,
}: {
  volumeKey: VolumeKey;
  label: string;
  value: number;
}) {
  const percent = Math.round(value * 100);
  const id = `vol-${volumeKey}`;
  return (
    <div class="settings-row">
      <label class="settings-label" for={id}>
        {label}
      </label>
      <div class="settings-control">
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
    </div>
  );
}

function VoiceChoice({ voiceMode }: { voiceMode: VoiceMode }) {
  // A radio group: ←/→ (or ↑/↓) move the choice and the focus.
  const onKey = (e: KeyboardEvent) => {
    const step = arrowStep(e);
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
    <>
      <div class="settings-row">
        <span class="settings-label" id="voice-label">
          聲線
        </span>
        <div
          class="settings-control"
          role="radiogroup"
          aria-labelledby="voice-label"
          onKeyDown={onKey}
        >
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
        </div>
      </div>
      <p class="settings-note">預設是 B。慢速重播一律使用聲線 A。</p>
    </>
  );
}

function SoundSection({ settings }: { settings: Settings }) {
  const test = (speed: 'normal' | 'slow') => void playAudio(TEST_CLIP, { speed, text: TEST_TEXT });
  return (
    <>
      <VoiceChoice voiceMode={settings.voiceMode} />
      {SLIDERS.map(({ key, label }) => (
        <VolumeSlider key={key} volumeKey={key} label={label} value={settings[key]} />
      ))}
      <div class="settings-row">
        <span class="settings-label">試聽</span>
        <div class="settings-control">
          <button type="button" class="pixel-button" onClick={() => test('normal')}>
            一般
          </button>
          <button type="button" class="pixel-button" onClick={() => test('slow')}>
            慢速
          </button>
        </div>
      </div>
    </>
  );
}

/**
 * A row of choices as a radio group (like 聲線): ←/→ (or ↑/↓) move the choice and the
 * focus.
 */
function ChoiceRow<T extends string>({
  id,
  label,
  value,
  choices,
  onPick,
}: {
  id: string;
  label: string;
  value: T;
  choices: readonly { value: T; label: string }[];
  onPick: (value: T) => void;
}) {
  const onKey = (e: KeyboardEvent) => {
    const step = arrowStep(e);
    if (!step) return;
    e.preventDefault();
    const at = choices.findIndex((c) => c.value === value);
    const to = (at + step + choices.length) % choices.length;
    onPick(choices[to]!.value);
    const group = e.currentTarget instanceof HTMLElement ? e.currentTarget : null;
    requestAnimationFrame(() =>
      group?.querySelectorAll<HTMLElement>('[role="radio"]')[to]?.focus(),
    );
  };
  return (
    <div class="settings-row">
      <span class="settings-label" id={`${id}-label`}>
        {label}
      </span>
      <div
        class="settings-control"
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        onKeyDown={onKey}
      >
        {choices.map((c) => (
          <button
            key={c.value}
            type="button"
            role="radio"
            aria-checked={value === c.value}
            tabIndex={value === c.value ? 0 : -1}
            class={`pixel-button settings-choice${value === c.value ? ' primary' : ''}`}
            onClick={() => onPick(c.value)}
            data-testid={`${id}-${c.value}`}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const TEXT_SIZES: readonly { value: TextSize; label: string }[] = [
  { value: 'medium', label: '中' },
  { value: 'large', label: '大' },
  { value: 'xlarge', label: '特大' },
];

/** 顯示: 文字大小, 介面語言 and 顯示中文 (off, and not offered, in English). */
function DisplaySection({ settings }: { settings: Settings }) {
  const english = settings.uiLang === 'en';
  return (
    <>
      <ChoiceRow
        id="text-size"
        label={t('文字大小', 'Text size')}
        value={settings.textSize}
        choices={TEXT_SIZES.map((c) => ({
          value: c.value,
          label: english ? { medium: 'M', large: 'L', xlarge: 'XL' }[c.value] : c.label,
        }))}
        onPick={(textSize) => settingsStore.set({ textSize })}
      />
      <ChoiceRow
        id="ui-lang"
        label={t('介面語言', 'Language')}
        value={settings.uiLang}
        choices={[
          { value: 'zh', label: '中文' },
          { value: 'en', label: 'English' },
        ]}
        onPick={(uiLang) => settingsStore.set({ uiLang })}
      />
      {english ? (
        <p class="settings-note">Chinese translations are hidden in the English interface.</p>
      ) : (
        <SwitchRow
          label="顯示中文"
          on={settings.showZh}
          onToggle={() => settingsStore.set({ showZh: !settings.showZh })}
        />
      )}
    </>
  );
}

/** An 開／關 switch on the right of its row. */
function SwitchRow({
  label,
  on,
  onToggle,
  testId,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
  testId?: string;
}) {
  return (
    <div class="settings-row">
      <span class="settings-label">{label}</span>
      <div class="settings-control">
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={label}
          class={`pixel-button settings-choice${on ? ' primary' : ''}`}
          onClick={onToggle}
          data-testid={testId}
        >
          {on ? '開' : '關'}
        </button>
      </div>
    </div>
  );
}

/** The keyboard scheme (src/ui/keys.ts), shown only on computers with a mouse. */
export const KEY_LIST: [keys: string, what: string][] = [
  ['1～9', '選答案（A～D 的題目也可以按字母）'],
  ['1234 QWER ASDF ZXCV', '排句子：放上印著這個鍵的字塊'],
  ['空白鍵', '下一句、下一張、檢查、繼續、下一關（Enter 也可以）'],
  ['`（Esc 下面）', '再聽一次'],
  ['Shift＋`', '慢速（算用了幫助）'],
  ['T', '看中文／中文開關（0 也可以）'],
  ['← →', '上一張／下一張'],
  ['打字', '拼字：打出單字'],
  [
    'Esc',
    '排句子、拼字：拿掉最後一個（Backspace 也可以）；跟我說：取消辨識；關閉設定；其他畫面：返回（先回小鎮要再按一次確認）',
  ],
  ['Shift＋Esc', '排句子：重排'],
  ['R　P　C', '跟我說：錄音／停止、播放我的錄音、辨識'],
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

type SectionId = 'sound' | 'display' | 'route' | 'save' | 'reset' | 'help' | 'dev';

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'sound', label: '聲音' },
  { id: 'display', label: '顯示' },
  { id: 'route', label: '路線' },
  { id: 'save', label: '存檔' },
  { id: 'reset', label: '重置' },
  { id: 'help', label: '說明' },
  // Dev server only: open every task, to try any of them without clearing the ones before.
  ...(DEV_TOOLS ? [{ id: 'dev' as const, label: '開發' }] : []),
];

const TITLE_ID = 'settings-title';

/**
 * Modal settings dialog (2026-11-25, the user's call): the sections on the left, the chosen
 * one's settings on the right, each row its name then its control. On a phone held upright it
 * is a page of its own (useFullScreen): first the list of sections, then one section with
 * ‹ 設定 above it; Esc there goes back to the list. The caller dims and inerts the screen
 * behind it. onHowTo, when given, adds 怎麼玩 under 說明.
 */
export function SettingsPanel({ onClose, onHowTo }: { onClose: () => void; onHowTo?: () => void }) {
  const settings = useStore(settingsStore);
  const { layout } = useStore(appStore);
  const twoPane = layout.orientation === 'landscape';
  const [picked, setPicked] = useState<SectionId | null>(null);
  const section = twoPane ? (picked ?? 'sound') : picked;
  const panelRef = useRef<HTMLDivElement>(null);
  /** Set by a section with a question open (路線's 衝刺): Esc answers it first. */
  const sectionEsc = useRef<(() => void) | null>(null);

  const focus = (selector: string) =>
    requestAnimationFrame(() =>
      panelRef.current?.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true }),
    );
  const open = (id: SectionId) => {
    playSfx('click');
    setPicked(id);
    if (!twoPane) focus('[data-testid="settings-back"]');
  };
  const back = () => {
    playSfx('click');
    const from = picked;
    setPicked(null);
    if (from) focus(`[data-testid="section-${from}"]`);
  };
  // useModal keeps the handler it got on open, so it calls through a ref to the latest one.
  const escape = useRef(onClose);
  escape.current = () => {
    if (sectionEsc.current) sectionEsc.current();
    else if (!twoPane && picked) back();
    else onClose();
  };
  useModal(panelRef, () => escape.current());
  useFullScreen();

  // The section tabs: ↑/↓ (or ←/→) move the choice and the focus.
  const onTabKey = (e: KeyboardEvent) => {
    const step = arrowStep(e);
    if (!step || !section) return;
    e.preventDefault();
    const at = SECTIONS.findIndex((s) => s.id === section);
    const to = SECTIONS[(at + step + SECTIONS.length) % SECTIONS.length]!;
    open(to.id);
    focus(`[data-testid="section-${to.id}"]`);
  };

  const label = SECTIONS.find((s) => s.id === section)?.label ?? '';
  const content =
    section === 'sound' ? (
      <SoundSection settings={settings} />
    ) : section === 'display' ? (
      <DisplaySection settings={settings} />
    ) : section === 'route' ? (
      <RouteGroup escRef={sectionEsc} />
    ) : section === 'save' ? (
      <SaveGroup />
    ) : section === 'reset' ? (
      <ResetGroup />
    ) : section === 'help' ? (
      <>
        {onHowTo && (
          <div class="settings-row">
            <span class="settings-label">怎麼玩</span>
            <div class="settings-control">
              <button
                type="button"
                class="pixel-button"
                onClick={onHowTo}
                data-testid="settings-howto"
              >
                打開說明
              </button>
            </div>
          </div>
        )}
        <KeyList />
      </>
    ) : section === 'dev' ? (
      <>
        <SwitchRow
          label="所有關卡都能玩"
          on={settings.unlockAll}
          onToggle={() => settingsStore.set({ unlockAll: !settings.unlockAll })}
          testId="dev-unlock-all"
        />
        <p class="settings-note">開發模式：只在開發伺服器出現，正式版不會有。</p>
      </>
    ) : null;

  return (
    <div
      ref={panelRef}
      class="pixel-panel settings-panel"
      data-view={twoPane ? 'two' : section ? 'page' : 'list'}
      role="dialog"
      aria-modal="true"
      aria-labelledby={TITLE_ID}
      tabIndex={-1}
    >
      <h2 class="settings-title" id={TITLE_ID}>
        設定
      </h2>
      <div class="settings-body">
        {(twoPane || !section) && (
          <div class="settings-nav">
            <div
              class="settings-tabs"
              role={twoPane ? 'tablist' : undefined}
              aria-orientation={twoPane ? 'vertical' : undefined}
              aria-label="設定分類"
              onKeyDown={twoPane ? onTabKey : undefined}
            >
              {SECTIONS.map(({ id, label: name }) => {
                const on = section === id;
                return (
                  <button
                    key={id}
                    type="button"
                    id={`settings-tab-${id}`}
                    role={twoPane ? 'tab' : undefined}
                    aria-selected={twoPane ? on : undefined}
                    aria-controls={twoPane ? 'settings-pane' : undefined}
                    tabIndex={twoPane && !on ? -1 : 0}
                    class={`pixel-button settings-tab${on ? ' primary' : ''}`}
                    onClick={() => open(id)}
                    data-testid={`section-${id}`}
                  >
                    {name}
                    {!twoPane && (
                      <span class="settings-more" aria-hidden="true">
                        ›
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <button type="button" class="pixel-button settings-close" onClick={onClose}>
              關閉
              <KeyCap k="Escape" />
            </button>
          </div>
        )}
        {section && (
          <section
            id="settings-pane"
            class="settings-pane"
            role={twoPane ? 'tabpanel' : undefined}
            aria-labelledby={twoPane ? `settings-tab-${section}` : 'settings-pane-title'}
          >
            <div class="settings-pane-head">
              {!twoPane && (
                <button
                  type="button"
                  class="pixel-button small settings-back"
                  onClick={back}
                  data-testid="settings-back"
                >
                  ‹ 設定
                  <KeyCap k="Back" />
                </button>
              )}
              <h3 class="settings-pane-title" id="settings-pane-title">
                {label}
              </h3>
            </div>
            <div key={section} class="settings-pane-body" data-testid={`pane-${section}`}>
              {content}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
