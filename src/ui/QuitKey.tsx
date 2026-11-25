import { useEffect, useState } from 'preact/hooks';
import { t } from '../core/i18n';
import { KeyCap } from './KeyCap';
import { useKeys } from './keys';

/** How long 確定離開 waits for the second press before it goes back to its label. */
export const CONFIRM_MS = 4000;

interface Props {
  label: string;
  onLeave: () => void;
  /** Ask again before leaving (a task or a round would be lost); off leaves at once. */
  confirm?: boolean;
  testId?: string;
}

/**
 * 先回小鎮: the small key at the right end of the title strip, also on Esc (the 返回 action,
 * keys.ts). The first press turns it into a lamp 確定離開 and only a second press, by tap or
 * Esc, leaves; after CONFIRM_MS untouched it goes back, so a stray tap never ends the task.
 */
export function QuitKey({ label, onLeave, confirm = true, testId }: Props) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), CONFIRM_MS);
    return () => clearTimeout(timer);
  }, [armed]);
  const press = () => (armed || !confirm ? onLeave() : setArmed(true));
  useKeys({ Back: press });
  return (
    <button
      type="button"
      class={`pixel-button small quit${armed ? ' primary armed' : ''}`}
      onClick={press}
      data-testid={testId}
    >
      {armed ? t('確定離開', 'Really leave?') : label}
      <KeyCap k="Back" />
    </button>
  );
}
