/**
 * A key hint inside a button: a small ink box with the key's name, e.g. 下一句 [Enter].
 * Shown only on a computer (fine pointer) after the player has used the keyboard, and hidden
 * again after a tap or click (trackInputMode in keys.ts, styles in styles.css). Screen readers
 * skip it; the button's own words stay its name.
 */
// Caps show the left-hand key for each action (keys.ts): next step is Space, replay is the
// key under Esc, take back is Esc, 中文 is T. 'Shift+Escape' is 重排 in 排句子.
const LABELS: Record<string, string> = {
  Enter: '空白',
  Space: '`',
  'Shift+Space': 'Shift `',
  Escape: 'Esc',
  'Shift+Escape': 'Shift Esc',
  ArrowLeft: '←',
  ArrowRight: '→',
  Backspace: 'Esc',
  '0': 'T',
};

/** The words on the cap for an action name from keys.ts ('Enter', 'Space', '0', 'a', ...). */
export function keyCapLabel(key: string): string {
  return LABELS[key] ?? key.toUpperCase();
}

export function KeyCap({ k }: { k: string }) {
  return (
    <span class="kc" aria-hidden="true">
      {keyCapLabel(k)}
    </span>
  );
}
