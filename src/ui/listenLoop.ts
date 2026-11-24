/**
 * The 聽力加量 line loop (docs/specs/ui-flow.md): plays a line, then waits, listens
 * for 跟著說, scores it and moves on. A plain class with injected dependencies, so tests
 * drive it with fake timers. No Preact or DOM imports.
 *
 * Wiring (ListenScreen): build `new ListenLoop(onChange, deps)` once per mount; call
 * `setLines(lines)` when the story changes; call `play(index)` whenever a line becomes
 * the current one (and for replays, `play(index, slow)`); `onChange(snapshot)` carries
 * everything the screen shows; `deps.onAdvance(index)` asks the screen to move to the
 * next line (or finish when `index` is the last). Skipping by hand: call `halt()` first.
 * Leaving the screen: `dispose()`.
 */
import type { ScoredListening } from '../audio/recognize';
import type { SpokenScore } from '../learning/spokenScore';

/** What the loop is doing right now. */
export type ListenLoopState =
  'idle' | 'playing' | 'gap' | 'confirm' | 'ready' | 'listening' | 'scored';

/** The fixed gap after a line when 跟著說 is off. */
export const GAP_MS = 900;
/** 跟著說 without a usable microphone: the line's length plus this. */
export const SHADOW_EXTRA_MS = 1200;
/** Browser speech resolves at once; every word gets at least this long. */
export const MS_PER_WORD = 320;
/** Hold after a score before moving on, and when the score is below LOW_SCORE. */
export const HOLD_MS = 1800;
export const HOLD_LOW_MS = 3500;
export const LOW_SCORE = 70;
/** Silent lines in a row that turn 跟著說 off. */
export const SILENT_LIMIT = 3;
/** Network failures in a row that turn the microphone off. */
export const NETWORK_LIMIT = 2;
/** Scored lines needed for a summary: max(MIN_SCORED, ceil(sceneLines / 2)). */
export const MIN_SCORED = 3;

export const NOTE_UNSUPPORTED = '這個瀏覽器不能辨識，跟著說只會每句停一下。';
export const NOTE_INSECURE = '辨識需要 https，跟著說只會每句停一下。';
export const NOTE_DENIED = '沒有麥克風權限，跟著說只會每句停一下。';
export const NOTE_NO_MIC = '找不到麥克風，跟著說只會每句停一下。';
export const NOTE_NETWORK = '網路不通，這句沒有辨識。';
export const NOTE_NETWORK_OFF = '網路一直不通，跟著說只會每句停一下。';
export const NOTE_SILENT = '沒有聽到聲音。';
export const NOTE_SILENT_OFF = '一直沒聽到聲音，先關掉跟著說。';
export const NOTE_DECLINED = '不辨識也可以，每句後面會停一下讓你唸。';

export type ListenErrorKind =
  'denied' | 'gesture' | 'no-mic' | 'insecure' | 'unsupported' | 'network' | 'aborted' | 'other';

/**
 * Sorts a failed listen by its `code` (RecognitionError) or, failing that, its message.
 * `denied` is a refused permission; `gesture` is a browser that wants a tap first. The loop
 * treats both alike: automatic start falls back to `ready`, a tap start turns the mic off.
 */
export function classifyListenError(err: unknown): ListenErrorKind {
  const raw = (err as { code?: unknown } | null | undefined)?.code;
  const message = err instanceof Error ? err.message : '';
  const code = typeof raw === 'string' && raw !== '' ? raw : message;
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
    case 'NotAllowedError':
      return /gesture|activation/i.test(message) ? 'gesture' : 'denied';
    case 'gesture':
    case 'user-gesture':
      return 'gesture';
    case 'audio-capture':
    case 'no-mic':
      return 'no-mic';
    case 'insecure':
      return 'insecure';
    case 'unsupported':
    case 'language-not-supported':
      return 'unsupported';
    case 'network':
      return 'network';
    case 'aborted':
    case 'AbortError':
      return 'aborted';
    default:
      return 'other';
  }
}

/** One line of the story: its audio id and English text (the target of 跟著說). */
export interface LoopLine {
  audioId: string;
  text: string;
}

export interface LoopDeps {
  /** Plays a line; resolves when it ends (browser speech may resolve at once). */
  play(audioId: string, options: { speed: 'normal' | 'slow'; text: string }): Promise<void>;
  stopAudio(): void;
  /** Starts listening (listenAlternatives); `timeoutMs` is the clamped listening limit. */
  listen(options: { timeoutMs: number }): ScoredListening;
  scoreSpoken(target: string, alternatives: readonly string[]): SpokenScore | null;
  /** Clock in ms (performance.now). */
  now(): number;
  /** Has the learner confirmed the privacy note in this browser? */
  noteSeen(): boolean;
  markNoteSeen(): void;
  /** The loop wants the next line after `index` (the newest line played); finish if last. */
  onAdvance(index: number): void;
}

/** Everything the screen needs, handed to onChange after every change. */
export interface ListenLoopSnapshot {
  phase: ListenLoopState;
  /** The line being played, waited on or scored; -1 before the first play. */
  index: number;
  auto: boolean;
  /** The 跟著說 switch. */
  shadow: boolean;
  /** 跟著說 is on and recognition is usable (otherwise it only pauses). */
  micOn: boolean;
  /** Listening must start with a tap on 說 (automatic start was refused). */
  tapToSpeak: boolean;
  /** One-line zh-TW message, if any. */
  note: string | undefined;
  /** Result of the last listen on this line: null while none or when nothing was heard. */
  score: SpokenScore | null;
  /** Lines with a score so far. */
  scoredLines: number;
}

export interface ListenSummary {
  lines: number;
  score: number;
}

function clamp(n: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, n));
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export class ListenLoop {
  /** The phase, kept as in the scaffold. */
  state: ListenLoopState = 'idle';

  private lines: readonly LoopLine[] = [];
  private gen = 0;
  private disposed = false;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private handle: ScoredListening | undefined;
  private index = -1;
  private frontier = -1;
  private auto = true;
  private shadow = false;
  private micAvailable = true;
  private autoStartOk = true;
  private micNote: string | undefined;
  private transientNote: string | undefined;
  private score: SpokenScore | null = null;
  private scores = new Map<number, number>();
  private silentRun = 0;
  private networkRun = 0;
  private advanceDue = false;
  private took = 0;
  private elapsed = 0;

  constructor(
    private readonly onChange: (snapshot: ListenLoopSnapshot) => void,
    private readonly deps: LoopDeps,
  ) {}

  getSnapshot(): ListenLoopSnapshot {
    return {
      phase: this.state,
      index: this.index,
      auto: this.auto,
      shadow: this.shadow,
      micOn: this.micActive(),
      tapToSpeak: !this.autoStartOk,
      note: this.transientNote ?? this.micNote,
      score: this.score,
      scoredLines: this.scores.size,
    };
  }

  /** Sets the story's lines and starts over (nothing plays until play()). */
  setLines(lines: readonly LoopLine[]): void {
    this.begin();
    this.lines = lines;
    this.index = -1;
    this.frontier = -1;
    this.scores = new Map();
    this.silentRun = 0;
    this.networkRun = 0;
    this.transientNote = undefined;
    this.score = null;
    this.deps.stopAudio();
    this.enter('idle');
  }

  /** 自動: when off, the loop never moves on by itself. Turning it on resumes a due move. */
  setAuto(on: boolean): void {
    if (this.disposed) return;
    this.auto = on;
    if (on && this.advanceDue) this.advance();
    else this.emit();
  }

  /**
   * The 跟著說 switch. Turning it on the first time shows the privacy note (phase
   * `confirm`); answer with confirm() or decline(). Otherwise it applies to the line
   * on hand right away.
   */
  setShadow(on: boolean): void {
    if (this.disposed || on === this.shadow) return;
    if (on && !this.deps.noteSeen()) {
      this.begin();
      this.deps.stopAudio();
      this.enter('confirm');
      return;
    }
    this.shadow = on;
    this.reevaluate();
  }

  /** The learner accepted the privacy note: 跟著說 on, the current line plays again. */
  confirm(): void {
    if (this.disposed || this.state !== 'confirm') return;
    this.deps.markNoteSeen();
    this.shadow = true;
    this.replayCurrent();
  }

  /** Declined: 跟著說 stays a pause after each line (no recognition). */
  decline(): void {
    if (this.disposed || this.state !== 'confirm') return;
    this.shadow = true;
    this.micAvailable = false;
    this.micNote = NOTE_DECLINED;
    this.replayCurrent();
  }

  /** Plays line `index` (a new current line, or a replay of an older one). */
  play(index: number, slow = false): void {
    const line = this.lines[index];
    if (this.disposed || !line) return;
    const gen = this.begin();
    this.deps.stopAudio();
    this.index = index;
    this.frontier = Math.max(this.frontier, index);
    this.transientNote = undefined;
    this.score = null;
    this.advanceDue = false;
    this.enter('playing');
    const started = this.deps.now();
    const done = () => {
      if (gen !== this.gen) return;
      this.elapsed = Math.max(0, this.deps.now() - started);
      this.took = Math.max(this.elapsed, wordCount(line.text) * MS_PER_WORD);
      this.afterPlay(gen);
    };
    this.deps
      .play(line.audioId, { speed: slow ? 'slow' : 'normal', text: line.text })
      .then(done, done);
  }

  /** Listen again (ready, scored or gap), or finish speaking (listening). */
  speak(): void {
    if (this.disposed) return;
    if (this.state === 'listening') {
      this.handle?.stop();
      return;
    }
    if (!this.micActive() || this.index < 0) return;
    if (this.state === 'ready' || this.state === 'scored' || this.state === 'gap') {
      this.startListening(this.begin(), false);
    }
  }

  /** Stop everything for good without scoring (skipping to the next line, leaving the screen). */
  halt(): void {
    if (this.disposed) return;
    this.begin();
    this.deps.stopAudio();
    this.advanceDue = false;
    this.enter('idle');
  }

  /** Leaving the screen: halts and silences every later callback. */
  dispose(): void {
    if (this.disposed) return;
    this.begin();
    this.deps.stopAudio();
    this.disposed = true;
    this.state = 'idle';
  }

  /** Average score over the scored lines, or undefined when too few lines were scored. */
  summary(): ListenSummary | undefined {
    const n = this.scores.size;
    if (n < Math.max(MIN_SCORED, Math.ceil(this.lines.length / 2))) return undefined;
    let sum = 0;
    for (const s of this.scores.values()) sum += s;
    return { lines: n, score: Math.round(sum / n) };
  }

  private micActive(): boolean {
    return this.shadow && this.micAvailable;
  }

  /** Every entry point: a new generation, the microphone and timer stopped. */
  private begin(): number {
    this.gen += 1;
    clearTimeout(this.timer);
    this.timer = undefined;
    const handle = this.handle;
    this.handle = undefined;
    handle?.abort();
    return this.gen;
  }

  private enter(state: ListenLoopState): void {
    this.state = state;
    this.emit();
  }

  private emit(): void {
    if (!this.disposed) this.onChange(this.getSnapshot());
  }

  private after(gen: number, ms: number, fn: () => void): void {
    this.timer = setTimeout(() => {
      if (gen === this.gen && !this.disposed) fn();
    }, ms);
  }

  private replayCurrent(): void {
    if (this.index >= 0) this.play(this.index);
    else this.enter('idle');
  }

  /** The switch changed: redo the wait for the line already played. */
  private reevaluate(): void {
    const mid =
      this.state === 'gap' ||
      this.state === 'ready' ||
      this.state === 'listening' ||
      this.state === 'scored';
    if (mid) this.afterPlay(this.begin());
    else this.emit();
  }

  private advance(): void {
    this.advanceDue = false;
    this.enter('idle');
    this.deps.onAdvance(this.frontier);
  }

  /** Waits a while, then moves on if 自動 is on (otherwise it stays until 自動 comes back). */
  private hold(gen: number, ms: number, state: ListenLoopState): void {
    this.enter(state);
    this.after(gen, ms, () => {
      if (this.auto) this.advance();
      else this.advanceDue = true;
    });
  }

  private afterPlay(gen: number): void {
    const line = this.lines[this.index];
    if (!line) return;
    if (!this.shadow) {
      this.hold(gen, GAP_MS, 'gap');
    } else if (!this.micAvailable) {
      this.hold(gen, this.took + SHADOW_EXTRA_MS, 'gap');
    } else {
      this.enter('gap');
      const wait = Math.max(0, wordCount(line.text) * MS_PER_WORD - this.elapsed);
      this.after(gen, wait, () => {
        if (this.autoStartOk) this.startListening(gen, true);
        else this.enter('ready');
      });
    }
  }

  private startListening(gen: number, automatic: boolean): void {
    const line = this.lines[this.index];
    if (!line) return;
    const timeoutMs = clamp(2 * this.took + 3000, 6000, 15000);
    this.transientNote = undefined;
    let handle: ScoredListening;
    try {
      handle = this.deps.listen({ timeoutMs });
    } catch (error) {
      this.failed(gen, error, automatic);
      return;
    }
    this.handle = handle;
    this.enter('listening');
    handle.promise.then(
      (heard) => {
        if (gen === this.gen && !this.disposed) this.heard(gen, line, heard);
      },
      (error: unknown) => {
        if (gen === this.gen && !this.disposed) this.failed(gen, error, automatic);
      },
    );
  }

  private heard(gen: number, line: LoopLine, alternatives: readonly string[]): void {
    this.handle = undefined;
    const said = alternatives.filter((a) => a.trim() !== '');
    const result = said.length > 0 ? this.deps.scoreSpoken(line.text, said) : null;
    this.networkRun = 0;
    if (!result) {
      this.score = null;
      this.silentRun += 1;
      if (this.silentRun >= SILENT_LIMIT) {
        this.shadow = false;
        this.silentRun = 0;
        this.transientNote = NOTE_SILENT_OFF;
        this.hold(gen, GAP_MS, 'scored');
      } else {
        this.transientNote = NOTE_SILENT;
        this.hold(gen, HOLD_MS, 'scored');
      }
      return;
    }
    this.silentRun = 0;
    this.score = result;
    this.scores.set(this.index, result.score);
    this.hold(gen, result.score < LOW_SCORE ? HOLD_LOW_MS : HOLD_MS, 'scored');
  }

  private failed(gen: number, error: unknown, automatic: boolean): void {
    this.handle = undefined;
    const kind = classifyListenError(error);
    if (kind === 'aborted') return;
    if (kind === 'denied' || kind === 'gesture') {
      if (automatic) {
        // iOS wants a tap: from now on each line waits for 說.
        this.autoStartOk = false;
        this.enter('ready');
        return;
      }
      this.micOff(gen, NOTE_DENIED);
      return;
    }
    if (kind === 'no-mic') this.micOff(gen, NOTE_NO_MIC);
    else if (kind === 'insecure') this.micOff(gen, NOTE_INSECURE);
    else if (kind === 'unsupported') this.micOff(gen, NOTE_UNSUPPORTED);
    else if (kind === 'network') {
      this.networkRun += 1;
      if (this.networkRun >= NETWORK_LIMIT) this.micOff(gen, NOTE_NETWORK_OFF);
      else {
        this.transientNote = NOTE_NETWORK;
        this.hold(gen, GAP_MS, 'gap');
      }
    } else {
      this.hold(gen, GAP_MS, 'gap');
    }
  }

  /** No recognition for the rest of this mount: a note and the timed pause. */
  private micOff(gen: number, note: string): void {
    this.micAvailable = false;
    this.micNote = note;
    this.transientNote = undefined;
    this.hold(gen, SHADOW_EXTRA_MS, 'gap');
  }
}
