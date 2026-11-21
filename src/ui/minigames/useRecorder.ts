/**
 * Recording lifecycle for the Speak minigame. The logic lives in a plain class so it can be
 * tested without a DOM; useRecorder() only binds it to component state and unmount.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { recorderMessage, startRecording } from '../../audio/recorder';
import type { RecordingHandle } from '../../audio/recorder';

type RecorderPhase = 'idle' | 'starting' | 'recording' | 'recorded';

export interface RecorderState {
  phase: RecorderPhase;
  /** Object URL of the last recording (in memory only). */
  url: string | null;
  message: string | null;
}

interface PlayerLike {
  play(): Promise<void>;
  pause(): void;
}

export interface RecorderDeps {
  start: () => Promise<RecordingHandle>;
  createUrl: (blob: Blob) => string;
  revokeUrl: (url: string) => void;
  createPlayer: (url: string) => PlayerLike;
}

const browserDeps: RecorderDeps = {
  start: startRecording,
  createUrl: (blob) => URL.createObjectURL(blob),
  revokeUrl: (url) => URL.revokeObjectURL(url),
  createPlayer: (url) => new Audio(url),
};

const INITIAL_RECORDER_STATE: RecorderState = { phase: 'idle', url: null, message: null };

/**
 * Owns at most one live recording. Every await is followed by a staleness check: a handle
 * that arrives after dispose() or after a newer request is stopped at once, and no object
 * URL is created once disposed.
 */
export class RecorderController {
  private state: RecorderState = INITIAL_RECORDER_STATE;
  private handle: RecordingHandle | null = null;
  private player: PlayerLike | null = null;
  /** Bumped by every start/stop/dispose so late async results can tell they are stale. */
  private request = 0;
  private disposed = false;

  constructor(
    private readonly onChange: (state: RecorderState) => void,
    private readonly deps: RecorderDeps = browserDeps,
  ) {}

  getState(): RecorderState {
    return this.state;
  }

  async start(): Promise<void> {
    const { phase } = this.state;
    if (this.disposed || phase === 'starting' || phase === 'recording') return;
    const mine = ++this.request;
    this.dropRecording();
    this.set({ phase: 'starting', url: null, message: null });
    let handle: RecordingHandle;
    try {
      handle = await this.deps.start();
    } catch (error) {
      if (this.isStale(mine)) return;
      this.set({ phase: 'idle', message: recorderMessage(error) });
      return;
    }
    if (this.isStale(mine)) {
      discard(handle);
      return;
    }
    this.handle = handle;
    this.set({ phase: 'recording' });
  }

  async stop(): Promise<void> {
    const current = this.handle;
    this.handle = null;
    if (!current || this.disposed) return;
    const mine = ++this.request;
    let blob: Blob;
    try {
      blob = await current.stop();
    } catch (error) {
      if (this.isStale(mine)) return;
      this.set({ phase: 'idle', message: recorderMessage(error) });
      return;
    }
    if (this.isStale(mine)) return; // never create a URL nobody will revoke
    const url = this.deps.createUrl(blob);
    this.set({ phase: 'recorded', url });
  }

  playMine(): void {
    const { url } = this.state;
    if (!url || this.disposed) return;
    this.pausePlayback();
    this.player = this.deps.createPlayer(url);
    this.player.play().catch(() => undefined);
  }

  clearMessage(): void {
    if (this.state.message) this.set({ message: null });
  }

  pausePlayback(): void {
    this.player?.pause();
    this.player = null;
  }

  /** Stops the microphone and frees the recording. Safe to call more than once. */
  dispose(): void {
    if (this.disposed) return;
    this.request += 1;
    if (this.handle) discard(this.handle);
    this.handle = null;
    this.dropRecording();
    this.disposed = true;
  }

  private isStale(mine: number): boolean {
    return this.disposed || mine !== this.request;
  }

  private dropRecording(): void {
    this.pausePlayback();
    if (this.state.url) this.deps.revokeUrl(this.state.url);
    this.state = { ...this.state, url: null };
  }

  private set(patch: Partial<RecorderState>): void {
    if (this.disposed) return;
    this.state = { ...this.state, ...patch };
    this.onChange(this.state);
  }
}

function discard(handle: RecordingHandle): void {
  handle.stop().catch(() => undefined);
}

export interface UseRecorder extends RecorderState {
  start: () => void;
  stop: () => void;
  playMine: () => void;
  pausePlayback: () => void;
  clearMessage: () => void;
  /** Releases the microphone early (e.g. when the question is finished). */
  release: () => void;
}

export function useRecorder(): UseRecorder {
  const [state, setState] = useState<RecorderState>(INITIAL_RECORDER_STATE);
  const ref = useRef<RecorderController | null>(null);
  ref.current ??= new RecorderController(setState);
  const controller = ref.current;
  useEffect(() => () => controller.dispose(), [controller]);
  return {
    ...state,
    start: () => void controller.start(),
    stop: () => void controller.stop(),
    playMine: () => controller.playMine(),
    pausePlayback: () => controller.pausePlayback(),
    clearMessage: () => controller.clearMessage(),
    release: () => controller.dispose(),
  };
}
