/**
 * The page never zooms: no double-tap zoom and no pinch (2026-11-26, the player's call; 設定 →
 * 文字大小 and 英文大小 make the words bigger instead). The viewport says user-scalable=no and
 * every element touch-action: pan-x pan-y (styles.css), but Safari on an iPhone ignores the
 * first and still lets a pinch through on some pages, so its gesture events and two-finger
 * moves are stopped here as well. One finger still scrolls and taps as before.
 */

/** Stops Safari's pinch on `target` (the document). Call once at start-up. */
export function lockZoom(target: Pick<EventTarget, 'addEventListener'> = document): void {
  const stop = (e: Event) => {
    if (e.cancelable) e.preventDefault();
  };
  // Safari's own pinch events (iOS); other browsers never send them.
  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
    target.addEventListener(type, stop, { passive: false });
  }
  // A second finger on the screen: no pinch, in any browser that would still try.
  target.addEventListener(
    'touchmove',
    (e) => {
      if ((e as TouchEvent).touches.length > 1) stop(e);
    },
    { passive: false },
  );
}
