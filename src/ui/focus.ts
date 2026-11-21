/**
 * Focus helpers. When a screen, phase or question changes, the focused key is
 * often removed from the page and focus falls back to <body>; these move it to
 * a sensible place so keyboard and screen reader users are not lost.
 */
import { useEffect } from 'preact/hooks';
import type { RefObject } from 'preact';
import type { Inputs } from 'preact/hooks';

function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/** True when nothing useful has focus (the focused element was removed or never set). */
export function focusLost(): boolean {
  const active = document.activeElement;
  return !active || active === document.body || !active.isConnected;
}

/** Focuses an element that is not a control (a heading), without scrolling. */
export function focusStatic(element: Element | null | undefined): void {
  if (!(element instanceof HTMLElement)) return;
  if (!element.hasAttribute('tabindex')) element.tabIndex = -1;
  element.focus({ preventScroll: true });
}

/** Brings a control into view and focuses it; smooth only when motion is welcome. */
export function focusAndReveal(element: HTMLElement | null): void {
  if (!element) return;
  element.focus({ preventScroll: true });
  element.scrollIntoView({
    block: 'nearest',
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  });
}

/** After each change of `inputs`, moves focus to `ref` if focus was lost. */
export function useRefocus(ref: RefObject<Element | null>, inputs: Inputs): void {
  useEffect(() => {
    if (focusLost()) focusStatic(ref.current);
  }, inputs);
}
