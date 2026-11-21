/**
 * Browsers block sound until the player interacts with the page.
 * Call unlockAudio() from a click/tap handler (the "tap to start" button).
 *
 * The context can also stop later: iOS suspends it (or sets WebKit's
 * 'interrupted' state) during a phone call or an app switch. After unlocking,
 * the context is resumed whenever it changes state, the page becomes visible
 * again, or the player taps or presses a key while it is not running.
 */
let context: AudioContext | null = null;
let resumeListenersFor: AudioContext | null = null;

/**
 * Asks a context that is not running (suspended or 'interrupted') to resume.
 * resume() may reject or stay pending without a user gesture; that is ignored
 * and retried on the next state change, visibility change or tap.
 */
export function resumeIfNeeded(ctx: AudioContext | null = context): void {
  if (!ctx) return;
  const state: string = ctx.state;
  if (state === 'running' || state === 'closed') return;
  try {
    void ctx.resume().catch(() => undefined);
  } catch {
    // some old WebKit builds throw synchronously
  }
}

function attachResumeListeners(ctx: AudioContext): void {
  if (resumeListenersFor === ctx) return;
  resumeListenersFor = ctx;
  const retry = (): void => {
    if (context === ctx) resumeIfNeeded(ctx);
  };
  ctx.addEventListener?.('statechange', retry);
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') retry();
    });
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('pointerup', retry);
    window.addEventListener('keydown', retry);
  }
}

export function unlockAudio(): AudioContext | null {
  if (!context) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
    attachResumeListeners(context);
  }
  resumeIfNeeded(context);
  return context;
}

export function getAudioContext(): AudioContext | null {
  return context;
}

/** Short rising three-note chime, synthesised so it needs no audio file. */
export function playChime(volume = 0.15): void {
  const ctx = context;
  if (!ctx) return;
  const notes = [523.25, 659.25, 783.99]; // C5 E5 G5
  const noteLength = 0.11;
  notes.forEach((frequency, index) => {
    const start = ctx.currentTime + index * noteLength;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + noteLength * 1.8);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + noteLength * 2);
  });
}
