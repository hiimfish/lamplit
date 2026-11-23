/**
 * Keyboard shortcuts, one scheme for the whole game (listed in 設定 and docs/specs/ui-flow.md):
 *
 *   1-9          pick an answer (A-D too where the keys are lettered)
 *   Enter        the screen's main next step: 下一句, 下一張, 開始練習, 檢查, 繼續, 回小鎮, 下一關
 *   Space        再聽一次 / 聽發音 (normal speed)
 *   Shift+Space  慢速 (counted as help, the same as tapping it)
 *   0            看中文 / 中文 on or off
 *   ArrowLeft    上一張; ArrowRight is another 下一句 / 下一張
 *   Backspace    排句子: take back the last block (or the last typed letter)
 *   Escape       排句子: 重排; a dialog closes itself (useModal)
 *   a-z          排句子 and 拼字: typing
 *
 * Screens register a map with useKeys(); one document listener hands each key to the most
 * recently registered map that has it. Keys are ignored while Ctrl, Alt or Meta is held, while
 * typing in a field, inside a dialog, and while an IME is composing. Enter and Space are left
 * to the browser when a button, link or tab has focus, so a focused key still does what it says.
 */
import { useEffect, useRef } from 'preact/hooks';

export type KeyHandler = (e: KeyboardEvent) => void;
/** Key names as keyName() gives them: '1', 'a', 'Enter', 'Space', 'Shift+Space', 'Backspace', ... */
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

/** The scheme's name for a key press, or null for a key the game never uses. */
export function keyName(e: Pick<KeyboardEvent, 'key' | 'shiftKey'>): string | null {
  if (e.key === ' ' || e.key === 'Spacebar') return e.shiftKey ? 'Shift+Space' : 'Space';
  if (NAMED.has(e.key)) return e.key;
  if (/^[0-9]$/.test(e.key)) return e.key;
  if (/^[a-zA-Z]$/.test(e.key)) return e.key.toLowerCase();
  if (e.key === "'" || e.key === '-') return e.key;
  return null;
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
  for (let i = layers.length - 1; i >= 0; i--) {
    const handler = layers[i]!.map()[name];
    if (!handler) continue;
    e.preventDefault();
    // Holding a key down repeats only Backspace (deleting); a held Enter or digit acts once.
    if (e.repeat && name !== 'Backspace') return;
    handler(e);
    return;
  }
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
