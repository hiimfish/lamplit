/**
 * Keyboard shortcuts, one scheme for the whole game (listed in 設定 and docs/specs/ui-flow.md).
 * Everything can be played with the left hand alone:
 *
 *   1-9            pick an answer (A-D too where the keys are lettered)
 *   Space          the screen's main next step: 下一句, 下一張, 開始練習, 檢查, 繼續, 回小鎮, 下一關
 *   `              再聽一次 / 聽發音 (normal speed); the key under Esc
 *   Shift+`        慢速 (counted as help, the same as tapping it)
 *   Esc            排句子 and 拼字: take back the last block or letter; 跟我說: 取消;
 *                  elsewhere 返回 (先回小鎮 asks again first, 回第N幕, 回小鎮, 回每日目標)
 *   Shift+Esc      排句子: 重排
 *   T              看中文 / 中文 on or off (when T is not a typed letter or a block)
 *   ArrowLeft      上一張; ArrowRight is another 下一句 / 下一張
 *   a-z            排句子 and 拼字: typing
 *   Enter, Backspace and 0 still work as before (next step, take back, 中文).
 *
 * Screens register a map with useKeys() under action names that predate the left-hand layout:
 * 'Enter' = next step, 'Space' = replay, 'Shift+Space' = slow, 'Backspace' = take back,
 * 'Escape' = 重排 / 取消, 'Back' = 返回, '0' = 中文. keyName() names the physical key, and ACTIONS turns it
 * into the actions it may stand for, tried in order; one document listener hands the key to
 * the most recently registered map that has one of them. Keys are ignored while Ctrl, Alt or
 * Meta is held, while typing in a field, inside a dialog, and while an IME is composing. Space
 * and Enter are left to the browser when a button, link or tab has focus, so a focused key
 * still does what it says. A dialog closes itself on Esc (useModal).
 */
import { useEffect, useRef } from 'preact/hooks';

export type KeyHandler = (e: KeyboardEvent) => void;
/**
 * Action names: 'Enter' (next step), 'Space' (replay), 'Shift+Space' (slow), 'Backspace'
 * (take back), 'Escape' (重排 / 取消), 'Back' (返回: leave the screen), '0' (中文), and digits
 * and letters for themselves.
 */
export type KeyMap = Partial<Record<string, KeyHandler>>;

const NAMED = new Set([
  'Enter',
  'Backspace',
  'Escape',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
]);

/** The physical key's name, or null for a key the game never uses. */
export function keyName(
  e: Pick<KeyboardEvent, 'key' | 'shiftKey'> & { code?: string },
): string | null {
  if (e.key === ' ' || e.key === 'Spacebar') return e.shiftKey ? 'Shift+Space' : 'Space';
  // The key under Esc: ` or, with Shift, ~ (code keeps it right under other layouts).
  if (e.code === 'Backquote' || e.key === '`' || e.key === '~')
    return e.shiftKey ? 'Shift+Backquote' : 'Backquote';
  if (e.key === 'Escape') return e.shiftKey ? 'Shift+Escape' : 'Escape';
  if (NAMED.has(e.key)) return e.key;
  if (/^[0-9]$/.test(e.key)) return e.key;
  if (/^[a-zA-Z]$/.test(e.key)) return e.key.toLowerCase();
  if (e.key === "'" || e.key === '-') return e.key;
  return null;
}

/**
 * The actions a physical key stands for, tried in order (see the top of this file). A key
 * missing here stands for itself: digits, letters, Enter, Backspace, arrows.
 */
const ACTIONS: Record<string, readonly string[]> = {
  Space: ['Enter'],
  'Shift+Space': ['Enter'],
  Backquote: ['Space'],
  'Shift+Backquote': ['Shift+Space'],
  // Take back where there is something to take back, otherwise 取消.
  Escape: ['Backspace', 'Escape'],
  'Shift+Escape': ['Escape'],
  // T types a t or places a T block where it is one; otherwise it is 中文.
  t: ['t', '0'],
};

/**
 * Actions a key stands for only when no screen has any of its ACTIONS: Esc leaves the screen
 * (返回) only when nothing on it can be taken back or cancelled, even when the 返回 key was
 * registered after the question it sits over.
 */
const FALLBACK: Record<string, readonly string[]> = {
  Escape: ['Back'],
};

/** The fallback actions of the physical key `name` (see FALLBACK). */
export function fallbackFor(name: string): readonly string[] {
  return FALLBACK[name] ?? [];
}

/** The actions, in order, that the physical key `name` stands for. */
export function actionsFor(name: string): readonly string[] {
  return ACTIONS[name] ?? [name];
}

function targetOf(e: Event): Element | null {
  return typeof Element !== 'undefined' && e.target instanceof Element ? e.target : null;
}

/** True when the game should leave this key alone: a held modifier, a field, a dialog or an IME. */
export function ignoreKey(e: KeyboardEvent): boolean {
  if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return true;
  return !!targetOf(e)?.closest(
    '[role="dialog"], input, textarea, select, [contenteditable="true"]',
  );
}

/** True when Enter or Space should reach the focused control instead of the screen. */
function controlHasFocus(e: KeyboardEvent): boolean {
  return !!targetOf(e)?.closest(
    'button, a[href], [role="button"], [role="tab"], [role="radio"], summary',
  );
}

/** The number key's answer index (1 = the first key shown), or null. */
export function digitIndex(name: string | null, count: number): number | null {
  if (!name || !/^[1-9]$/.test(name)) return null;
  const index = Number(name) - 1;
  return index < count ? index : null;
}

/** A letter key's answer index (a = the first key shown), or null. */
export function letterIndex(name: string | null, count: number): number | null {
  if (!name || !/^[a-i]$/.test(name)) return null;
  const index = name.charCodeAt(0) - 97;
  return index < count ? index : null;
}

interface Layer {
  map: () => KeyMap;
}

const layers: Layer[] = [];
let listening = false;

/** The shared listener; exported for tests. */
export function handleKey(e: KeyboardEvent): void {
  if (e.defaultPrevented || ignoreKey(e)) return;
  const name = keyName(e);
  if (!name) return;
  if ((name === 'Enter' || name === 'Space' || name === 'Shift+Space') && controlHasFocus(e))
    return;
  if (!runFirst(actionsFor(name), e)) runFirst(fallbackFor(name), e);
}

/** Runs the newest layer's handler for the first of `actions` it has; false if none has one. */
function runFirst(actions: readonly string[], e: KeyboardEvent): boolean {
  for (let i = layers.length - 1; i >= 0; i--) {
    const map = layers[i]!.map();
    const action = actions.find((a) => map[a]);
    if (!action) continue;
    e.preventDefault();
    // Holding a key down repeats only taking back; a held next step or digit acts once.
    if (e.repeat && action !== 'Backspace') return true;
    map[action]!(e);
    return true;
  }
  return false;
}

/** Registers `map` while the component is mounted and `enabled` is true. The newest map wins a key. */
export function useKeys(map: KeyMap, enabled = true): void {
  const current = useRef(map);
  current.current = map;
  useEffect(() => {
    if (!enabled) return;
    const layer: Layer = { map: () => current.current };
    layers.push(layer);
    if (!listening) {
      document.addEventListener('keydown', handleKey);
      listening = true;
    }
    return () => {
      const at = layers.indexOf(layer);
      if (at >= 0) layers.splice(at, 1);
    };
  }, [enabled]);
}

/**
 * Key hints (KeyCap) show once the player uses the keyboard and hide again on a tap or
 * click: sets data-input="keys" or "pointer" on <html>. Call once at start-up.
 */
export function trackInputMode(): void {
  const root = document.documentElement;
  document.addEventListener(
    'keydown',
    (e) => {
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) return;
      if (ignoreKey(e) && !targetOf(e)?.closest('[role="dialog"]')) return;
      root.dataset.input = 'keys';
    },
    true,
  );
  document.addEventListener('pointerdown', () => (root.dataset.input = 'pointer'), true);
}

/** Clicks the first visible, enabled element matching `selector`; true if it found one. */
export function clickVisible(selector: string): boolean {
  for (const el of document.querySelectorAll<HTMLElement>(selector)) {
    if (el instanceof HTMLButtonElement && el.disabled) continue;
    if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') continue;
    el.click();
    return true;
  }
  return false;
}
