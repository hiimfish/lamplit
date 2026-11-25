/**
 * The 聽力加量 line loop (docs/specs/ui-flow.md): plays a line, then waits, records the
 * learner for 跟著說, scores the pronunciation on the device and moves on. A plain class with injected dependencies, so tests
 * drive it with fake timers. No Preact or DOM imports.
 *
 * Wiring (ListenScreen): build `new ListenLoop(onChange, deps)` once per mount; call
 * `setLines(lines)` when the story changes; call `play(index)` whenever a line becomes
 * the current one (and for replays, `play(index, slow)`); `onChange(snapshot)` carries
 * everything the screen shows; `deps.onAdvance(index)` asks the screen to move to the
 * next line (or finish when `index` is the last). Skipping by hand: call `halt()` first.
 * Leaving the screen: `dispose()`.
 */
import type { ScoredAttempt } from '../audio/utterance';
import type { SpokenScore } from '../learning/spokenScore';

/** What the loop is doing right now. */
export type ListenLoopState =
  'idle' | 'playing' | 'gap' | 'confirm' | 'downloading' | 'ready' | 'listening' | 'scored';

/** The fixed gap after a line when 跟著說 is off. */
export const GAP_MS = 900;
/** 跟著說 without a usable microphone: the line's length plus this. */
export const SHADOW_EXTRA_MS = 1200;
/** Browser speech resolves at once; every word gets at least this long. */
export const MS_PER_WORD = 320;
/** Hold after a passing score before moving on. */
export const HOLD_MS = 1800;
/** 跟著說 moves on only from this score up; below it the line is heard and said again. */
export const PASS_SCORE = 90;
/** How long a score under PASS_SCORE stays on screen (its words marked) before the retry. */
export const RETRY_MS = 3500;
/** Silent lines in a row that turn 跟著說 off. */
export const SILENT_LIMIT = 3;
/** Model failures (download, scoring) in a row that turn the microphone off. */
export const NETWORK_LIMIT = 2;
/** Scored lines needed for a summary: max(MIN_SCORED, ceil(sceneLines / 2)). */
export const MIN_SCORED = 3;

export const NOTE_UNSUPPORTED = '這個瀏覽器不能錄音評分，跟著說只會每句停一下。';
export const NOTE_INSECURE = '錄音需要 https，跟著說只會每句停一下。';
export const NOTE_DENIED = '沒有麥克風權限，跟著說只會每句停一下。';
export const NOTE_NO_MIC = '找不到麥克風，跟著說只會每句停一下。';
export const NOTE_NETWORK = '這句沒有評分成功。';
export const NOTE_NETWORK_OFF = '發音模型一直不能用，跟著說只會每句停一下。';
export const NOTE_DOWNLOAD_FAILED = '發音模型下載失敗，跟著說只會每句停一下。';
export const NOTE_SILENT = '沒有聽到聲音，再聽一次、再說一次。';
export const NOTE_RETRY = `還沒到 ${PASS_SCORE} 分，再聽一次、再說一次。`;
export const NOTE_AGAIN = '再聽一次，聽完換你說。';
export const NOTE_END = '這段的最後一句了，按「聽完了」結束。';
export const NOTE_SILENT_OFF = '一直沒聽到聲音，先關掉跟著說。';
export const NOTE_DECLINED = '不評分也可以，每句後面會停一下讓你唸。';

export type ListenErrorKind =
  'denied' | 'gesture' | 'no-mic' | 'insecure' | 'unsupported' | 'network' | 'aborted' | 'other';

/**
 * Sorts a failed listen by its `code` (RecorderError, PronError) or, failing that, its message.
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
    case 'denied':
    case 'NotAllowedError':
      return /gesture|activation/i.test(message) ? 'gesture' : 'denied';
    case 'gesture':
    case 'user-gesture':
      return 'gesture';
    case 'audio-capture':
    case 'no-mic':
    case 'mic-busy':
      return 'no-mic';
    case 'insecure':
      return 'insecure';
    case 'unsupported':
    case 'language-not-supported':
    case 'no-mic-api':
    case 'no-recorder':
      return 'unsupported';
    case 'network':
    case 'download-failed':
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
  /**
   * Records the learner saying `target` and scores it (utterance.ts); `timeoutMs` is the
   * clamped recording limit, `onScoring` marks the end of recording.
   */
  listen(options: { target: string; timeoutMs: number; onScoring: () => void }): ScoredAttempt;
  /** Releases the microphone (跟著說 off, or no longer usable). */
  releaseMic(): void;
  /** Clock in ms (performance.now). */
  now(): number;
  /** Is the pronunciation model on this device (no download note needed)? */
  modelReady(): boolean;
  /** Downloads and opens the model, reporting progress from 0 to 1. */
  loadModel(onProgress: (fraction: number) => void): Promise<void>;
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
  /** 跟著說 is on and the microphone and model are usable (otherwise it only pauses). */
  micOn: boolean;
  /** Listening must start with a tap on 說 (automatic start was refused). */
  tapToSpeak: boolean;
  /** One-line zh-TW message, if any. */
  note: string | undefined;
  /** Model download progress, 0 to 1 (phase `downloading`). */
  progress: number;
  /** The line is recorded and its score is being worked out (phase `listening`). */
  scoring: boolean;
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
  private handle: ScoredAttempt | undefined;
  private progress = 0;
  private scoring = false;
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
      progress: this.progress,
      scoring: this.scoring,
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
   * The 跟著說 switch. Turning it on before the pronunciation model is on this device shows
   * the download note (phase `confirm`); answer with confirm() or decline(). Otherwise it
   * applies to the line on hand right away.
   */
  setShadow(on: boolean): void {
    if (this.disposed || on === this.shadow) return;
    if (on && this.micAvailable && !this.deps.modelReady()) {
      this.begin();
      this.deps.stopAudio();
      this.enter('confirm');
      return;
    }
    this.shadow = on;
    if (!on) this.deps.releaseMic();
    this.reevaluate();
  }

  /**
   * 下載並評分 on the note: downloads the model (phase `downloading`, with progress), then
   * turns 跟著說 on and plays the current line again. A failed download leaves 跟著說 as a
   * pause after each line.
   */
  confirm(): void {
    if (this.disposed || this.state !== 'confirm') return;
    this.begin();
    this.progress = 0;
    this.enter('downloading');
    const settle = (ok: boolean) => {
      if (this.disposed || this.state !== 'downloading') return;
      this.shadow = true;
      if (!ok) {
        this.micAvailable = false;
        this.micNote = NOTE_DOWNLOAD_FAILED;
      }
      this.replayCurrent();
    };
    this.deps
      .loadModel((fraction) => {
        if (this.disposed || this.state !== 'downloading') return;
        this.progress = fraction;
        this.emit();
      })
      .then(
        () => settle(true),
        () => settle(false),
      );
  }

  /** Declined: 跟著說 stays a pause after each line (no scoring). */
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
    this.deps.releaseMic();
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
    this.scoring = false;
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

  /**
   * Waits a while, then moves on if 自動 is on (otherwise it stays until 自動 comes back).
   * Never past the last line: the scene ends only with 聽完了, pressed by the learner.
   */
  private hold(gen: number, ms: number, state: ListenLoopState): void {
    if (this.frontier >= this.lines.length - 1) {
      this.transientNote = this.transientNote ? `${this.transientNote} ${NOTE_END}` : NOTE_END;
      this.enter(state);
      return;
    }
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
    let handle: ScoredAttempt;
    const onScoring = () => {
      if (gen !== this.gen || this.disposed) return;
      this.scoring = true;
      this.emit();
    };
    try {
      handle = this.deps.listen({ target: line.text, timeoutMs, onScoring });
    } catch (error) {
      this.failed(gen, error, automatic);
      return;
    }
    this.handle = handle;
    this.enter('listening');
    handle.promise.then(
      (score) => {
        if (gen === this.gen && !this.disposed) this.heard(gen, score);
      },
      (error: unknown) => {
        if (gen === this.gen && !this.disposed) this.failed(gen, error, automatic);
      },
    );
  }

  private heard(gen: number, result: SpokenScore | null): void {
    this.handle = undefined;
    this.scoring = false;
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
        this.retry(gen, HOLD_MS);
      }
      return;
    }
    this.silentRun = 0;
    this.score = result;
    this.scores.set(this.index, Math.max(result.score, this.scores.get(this.index) ?? 0));
    if (result.score >= PASS_SCORE) {
      this.hold(gen, HOLD_MS, 'scored');
    } else {
      this.transientNote = NOTE_RETRY;
      this.retry(gen, RETRY_MS);
    }
  }

  /**
   * Not passed yet: the score (or the silence note) stays on screen for `ms`, then the same
   * line plays again and the learner says it again. This repeats until it passes; 下一句
   * moves on by hand at any time.
   */
  private retry(gen: number, ms: number): void {
    this.enter('scored');
    const index = this.index;
    this.after(gen, ms, () => {
      this.play(index);
      this.transientNote = NOTE_AGAIN;
      this.emit();
    });
  }

  private failed(gen: number, error: unknown, automatic: boolean): void {
    this.handle = undefined;
    this.scoring = false;
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

  /** No scoring for the rest of this mount: a note and the timed pause. */
  private micOff(gen: number, note: string): void {
    this.micAvailable = false;
    this.deps.releaseMic();
    this.micNote = note;
    this.transientNote = undefined;
    this.hold(gen, SHADOW_EXTRA_MS, 'gap');
  }
}
