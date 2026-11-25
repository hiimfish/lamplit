/**
 * 評分 for the Speak minigame: scores the learner's last recording on this device
 * (pronModel.ts). The first time, before the model is on the device, a note asks before the
 * download. One scoring at a time; a late result after unmount or a new recording is dropped.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { loadModel, modelCached, pronMessage, scoreRecording } from '../../audio/pronModel';
import type { SpokenScore } from '../../learning/spokenScore';

/** 'confirm' = the download note is on screen; nothing is downloading yet. */
type PronStatus = 'idle' | 'confirm' | 'downloading' | 'scoring';

export interface PronState {
  status: PronStatus;
  /** Download progress, 0 to 1, while downloading. */
  progress: number;
  score: SpokenScore | null;
  message: string | null;
}

export interface PronDeps {
  cached: () => Promise<boolean>;
  load: (onProgress: (fraction: number) => void) => Promise<void>;
  score: (blob: Blob, text: string) => Promise<SpokenScore | null>;
}

export const NOTHING_HEARD = '沒有錄到聲音，再錄一次試試。';

const INITIAL_PRON_STATE: PronState = {
  status: 'idle',
  progress: 0,
  score: null,
  message: null,
};

export class PronController {
  private state: PronState = INITIAL_PRON_STATE;
  private blob: Blob | null = null;
  private target = '';
  private generation = 0;
  private disposed = false;

  constructor(
    private readonly onChange: (state: PronState) => void,
    private readonly deps: PronDeps,
  ) {}

  getState(): PronState {
    return this.state;
  }

  /** 評分 tapped: scores at once when the model is here, otherwise asks first. */
  async request(blob: Blob, target: string): Promise<void> {
    if (this.disposed || this.state.status !== 'idle') return;
    this.blob = blob;
    this.target = target;
    const mine = ++this.generation;
    this.set({ status: 'scoring', score: null, message: null });
    const cached = await this.deps.cached().catch(() => false);
    if (this.stale(mine)) return;
    if (cached) await this.run(mine);
    else this.set({ status: 'confirm' });
  }

  /** 下載並評分 on the note. */
  async confirm(): Promise<void> {
    if (this.disposed || this.state.status !== 'confirm') return;
    const mine = ++this.generation;
    this.set({ status: 'downloading', progress: 0 });
    try {
      await this.deps.load((progress) => {
        if (!this.stale(mine)) this.set({ progress });
      });
    } catch (error) {
      if (!this.stale(mine)) this.set({ status: 'idle', message: pronMessage(error) });
      return;
    }
    if (!this.stale(mine)) await this.run(mine);
  }

  /** 取消 on the note: nothing is downloaded; the note shows again next time. */
  cancel(): void {
    if (this.state.status === 'confirm') this.set({ status: 'idle' });
  }

  /** Clears the last result (a new recording is starting). */
  clear(): void {
    if (this.state.score || this.state.message) this.set({ score: null, message: null });
  }

  /** Drops any scoring in progress (the question is finished). */
  abort(): void {
    this.generation += 1;
    if (this.state.status !== 'idle') this.set({ status: 'idle' });
  }

  dispose(): void {
    if (this.disposed) return;
    this.abort();
    this.disposed = true;
  }

  private async run(mine: number): Promise<void> {
    const blob = this.blob;
    if (!blob) return;
    this.set({ status: 'scoring' });
    try {
      const score = await this.deps.score(blob, this.target);
      if (this.stale(mine)) return;
      this.set(score ? { status: 'idle', score } : { status: 'idle', message: NOTHING_HEARD });
    } catch (error) {
      if (!this.stale(mine)) this.set({ status: 'idle', message: pronMessage(error) });
    }
  }

  private stale(mine: number): boolean {
    return this.disposed || mine !== this.generation;
  }

  private set(patch: Partial<PronState>): void {
    if (this.disposed) return;
    this.state = { ...this.state, ...patch };
    this.onChange(this.state);
  }
}

export interface UsePronScore extends PronState {
  request: (blob: Blob, target: string) => void;
  confirm: () => void;
  cancel: () => void;
  clear: () => void;
  abort: () => void;
}

const browserDeps: PronDeps = { cached: modelCached, load: loadModel, score: scoreRecording };

export function usePronScore(): UsePronScore {
  const [state, setState] = useState<PronState>(INITIAL_PRON_STATE);
  const ref = useRef<PronController | null>(null);
  ref.current ??= new PronController(setState, browserDeps);
  const controller = ref.current;
  useEffect(() => () => controller.dispose(), [controller]);
  return {
    ...state,
    request: (blob, target) => void controller.request(blob, target),
    confirm: () => void controller.confirm(),
    cancel: () => controller.cancel(),
    clear: () => controller.clear(),
    abort: () => controller.abort(),
  };
}
