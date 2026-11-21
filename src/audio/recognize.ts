/**
 * Optional speech recognition feedback. Feature-detected (Chrome/Edge/Safari expose it,
 * Firefox does not). Chrome sends the audio to Google for recognition.
 */
import { normalize } from '../learning/grading';

export interface SpokenComparison {
  /** Target words the learner appears to have said. */
  matched: string[];
  /** Target words not heard. */
  missing: string[];
  /** Share of target words heard, 0 to 1. */
  score: number;
}

function toWords(text: string): string[] {
  const n = normalize(text);
  return n === '' ? [] : n.split(' ');
}

/** Compares what was heard with the target sentence, word by word (order-insensitive). */
export function compareSpoken(target: string, heard: string): SpokenComparison {
  const pool = toWords(heard);
  const matched: string[] = [];
  const missing: string[] = [];
  for (const word of toWords(target)) {
    const at = pool.indexOf(word);
    if (at >= 0) {
      pool.splice(at, 1);
      matched.push(word);
    } else {
      missing.push(word);
    }
  }
  const total = matched.length + missing.length;
  return { matched, missing, score: total === 0 ? 0 : matched.length / total };
}

interface RecognitionResultLike {
  0: { transcript: string };
}
interface RecognitionEventLike {
  results: ArrayLike<RecognitionResultLike>;
}
interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: RecognitionEventLike) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => RecognitionLike;

function getCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isRecognitionSupported(): boolean {
  return getCtor() !== null;
}

/** Failure of one listening attempt. `code` is the SpeechRecognition error name or our own. */
export class RecognitionError extends Error {
  readonly code: string;
  constructor(code: string) {
    super(code);
    this.name = 'RecognitionError';
    this.code = code;
  }
}

/** A running listen: settles exactly once; abort() stops the microphone right away. */
export interface Listening {
  /** Transcript ('' if nothing was heard). Rejects with RecognitionError. */
  promise: Promise<string>;
  /** Stops listening; the promise rejects with code 'aborted' (if not yet settled). */
  abort(): void;
}

export interface ListenOptions {
  lang?: string;
  /** Gives up (and stops the microphone) after this long. Default 8 s. */
  timeoutMs?: number;
}

const LISTEN_TIMEOUT_MS = 8000;

/**
 * Listens once. Always settles: on result/end, on error, on abort(), or after the timeout
 * even if the browser never fires onend/onerror.
 */
export function listenOnce(options: ListenOptions = {}): Listening {
  const lang = options.lang ?? 'en-US';
  const timeoutMs = options.timeoutMs ?? LISTEN_TIMEOUT_MS;
  const Ctor = getCtor();
  if (!Ctor) {
    return { promise: Promise.reject(new RecognitionError('unsupported')), abort: () => undefined };
  }
  const recognition = new Ctor();
  let settled = false;
  let heard = '';
  let timer: ReturnType<typeof setTimeout> | null = null;
  let resolveFn: (text: string) => void = () => undefined;
  let rejectFn: (error: RecognitionError) => void = () => undefined;
  const promise = new Promise<string>((resolve, reject) => {
    resolveFn = resolve;
    rejectFn = reject;
  });

  const settle = (outcome: { text: string } | { error: RecognitionError }) => {
    if (settled) return;
    settled = true;
    if (timer !== null) clearTimeout(timer);
    timer = null;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    if ('text' in outcome) resolveFn(outcome.text);
    else rejectFn(outcome.error);
  };
  const stopMic = () => {
    try {
      recognition.abort();
    } catch {
      // already stopped
    }
  };

  recognition.lang = lang;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = (e) => {
    heard = Array.from(e.results)
      .map((r) => r[0].transcript)
      .join(' ');
  };
  recognition.onerror = (e) => {
    // 'no-speech' just means silence.
    if (e.error === 'no-speech') settle({ text: '' });
    else settle({ error: new RecognitionError(e.error ?? 'failed') });
  };
  recognition.onend = () => settle({ text: heard });

  try {
    recognition.start();
  } catch (error) {
    settle({ error: new RecognitionError(error instanceof Error ? error.name : 'failed') });
    return { promise, abort: () => undefined };
  }
  timer = setTimeout(() => {
    if (settled) return;
    settle({ error: new RecognitionError('timeout') });
    stopMic();
  }, timeoutMs);

  return {
    promise,
    abort() {
      if (settled) return;
      settle({ error: new RecognitionError('aborted') });
      stopMic();
    },
  };
}

/** Friendly zh-TW message for a failed listen. Recognition is practice only, never graded. */
export function recognitionMessage(error: unknown): string {
  const code = error instanceof RecognitionError ? error.code : 'failed';
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return '沒有麥克風或語音辨識的權限。可以在瀏覽器網址列允許，或直接說說看就好。';
    case 'audio-capture':
      return '找不到麥克風，請確認麥克風有接好。';
    case 'network':
      return '語音辨識需要網路，現在連不上。沒關係，繼續練習就好。';
    case 'timeout':
      return '等太久沒有聽到結果，再試一次看看。';
    case 'unsupported':
      return '這個瀏覽器不支援語音辨識。';
    default:
      return '這次辨識沒成功，沒關係，繼續練習就好。';
  }
}

const NOTE_KEY = 'english-learn.recognitionNoteSeen';

/** True once the learner has confirmed the privacy note in this browser. */
export function hasSeenRecognitionNote(): boolean {
  try {
    return !!localStorage.getItem(NOTE_KEY);
  } catch {
    return false;
  }
}

/** Call only after the learner confirmed the note (繼續辨識). */
export function markRecognitionNoteSeen(): void {
  try {
    localStorage.setItem(NOTE_KEY, '1');
  } catch {
    // storage unavailable: the note simply shows again next time
  }
}

export const RECOGNITION_NOTE =
  '提醒：語音辨識由瀏覽器完成，Chrome 會把錄到的聲音傳送給 Google 處理。要繼續辨識嗎？';
