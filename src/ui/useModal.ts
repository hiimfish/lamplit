/**
 * Modal dialog behaviour for a panel shown over the screen: focus moves into
 * the panel when it opens, Tab and Shift+Tab stay inside it, Escape closes it,
 * and focus returns to the key that opened it. The caller makes the content
 * behind the panel inert.
 */
import { useEffect } from 'preact/hooks';
import type { RefObject } from 'preact';

const FOCUSABLE =
  'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [href], [tabindex]:not([tabindex="-1"])';

function focusables(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
}

/** Keeps Tab inside the panel by wrapping from the last key to the first and back. */
function trapTab(event: KeyboardEvent, panel: HTMLElement): void {
  const keys = focusables(panel);
  const first = keys[0];
  const last = keys[keys.length - 1];
  if (!first || !last) {
    event.preventDefault();
    return;
  }
  const active = document.activeElement;
  const outside = !panel.contains(active);
  if (event.shiftKey && (active === first || active === panel || outside)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (active === last || outside)) {
    event.preventDefault();
    first.focus();
  }
}

export function useModal(panelRef: RefObject<HTMLElement | null>, onClose: () => void): void {
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panel.focus({ preventScroll: true });

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      } else if (event.key === 'Tab') {
        trapTab(event, panel);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      // Wait until the screen behind is no longer inert, then return focus.
      setTimeout(() => {
        if (opener?.isConnected) opener.focus({ preventScroll: true });
      }, 0);
    };
    // Only on open/close: the panel element and onClose do not change while open.
  }, []);
}
