/**
 * A key hint inside a button: a small ink box with the key's name, e.g. 下一句 [Enter].
 * Shown only on a computer (fine pointer) after the player has used the keyboard, and hidden
 * again after a tap or click (trackInputMode in keys.ts, styles in styles.css). Screen readers
 * skip it; the button's own words stay its name.
 */
const LABELS: Record<string, string> = {
  Enter: 'Enter',
  Space: '空白',
  'Shift+Space': 'Shift 空白',
  Escape: 'Esc',
  ArrowLeft: '←',
  ArrowRight: '→',
  Backspace: 'Backspace',
};

/** The words on the cap for a key name from keys.ts ('Enter', 'Space', '0', 'a', ...). */
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
