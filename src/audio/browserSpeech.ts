/**
 * Built-in browser speech. This is only the fallback: real pronunciation comes
 * from pre-generated audio files. Quality and available voices differ by device.
 */
export interface SpeakOptions {
  slow?: boolean;
  lang?: string;
}

export function isBrowserSpeechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Picks the best voice for a language from a list (exact match, then same language). */
export function pickVoice<V extends { lang: string; localService?: boolean }>(
  voices: readonly V[],
  lang: string,
): V | undefined {
  const wanted = lang.toLowerCase().replace('_', '-');
  const base = wanted.split('-')[0] ?? wanted;
  const normalise = (v: V) => v.lang.toLowerCase().replace('_', '-');
  return (
    voices.find((v) => normalise(v) === wanted) ??
    voices.find((v) => normalise(v).split('-')[0] === base)
  );
}

/**
 * Whether the device can speak a language. Without a matching voice the browser
 * reads English with (for example) a Chinese voice, which teaches the wrong sounds.
 * An empty list means the voices have not loaded yet, so the answer is unknown: allow it.
 */
export function canSpeakLanguage(voices: readonly { lang: string }[], lang: string): boolean {
  return voices.length === 0 || pickVoice(voices, lang) !== undefined;
}

/**
 * Speaks text with the browser voice. Returns false when speech is unavailable
 * or the device has no voice for the language.
 */
export function speakWithBrowser(text: string, options: SpeakOptions = {}): boolean {
  if (!isBrowserSpeechAvailable()) return false;
  const lang = options.lang ?? 'en-US';
  const voices = window.speechSynthesis.getVoices();
  if (!canSpeakLanguage(voices, lang)) return false;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = options.slow ? 0.6 : 0.95;
  const voice = pickVoice(voices, lang);
  if (voice) utterance.voice = voice;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  return true;
}
