/**
 * 說說看 for the Speak minigame: one key records the learner (stopping by itself a little
 * after they stop talking, utterance.ts) and scores the pronunciation on this device
 * (pronModel.ts). The model normally loads on the title screen (pronPreload.ts); if it is not
 * here yet, 說說看 downloads it (sharing a load already running) with progress, then records.
 * One try at a time; a late result after unmount or abort() is dropped.
 */
import { t } from '../../core/i18n';
import { useEffect, useRef, useState } from 'preact/hooks';
import { stopAudio } from '../../audio/pronounce';
import { loadModel, modelCached, pronMessage } from '../../audio/pronModel';
import { RecorderError, recorderMessage } from '../../audio/recorder';
import { createShadowMic } from '../../audio/utterance';
import type { ScoredAttempt } from '../../audio/utterance';
import type { SpokenScore } from '../../learning/spokenScore';

type PronStatus = 'idle' | 'downloading' | 'recording' | 'scoring';

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
  /** Records the learner saying `target` and scores it. */
  attempt: (target: string, onScoring: () => void) => ScoredAttempt;
  /** Silences the model clip before the microphone opens. */
  beforeRecord: () => void;
  /** Frees the microphone (question finished, unmount). */
  release: () => void;
}

export function nothingHeard(): string {
  return t('沒有聽到聲音，再說一次試試。', "Didn't hear anything. Try saying it again.");
}

const INITIAL_PRON_STATE: PronState = {
  status: 'idle',
  progress: 0,
  score: null,
  message: null,
};

function errorMessage(error: unknown): string {
  return error instanceof RecorderError ? recorderMessage(error) : pronMessage(error);
}

export class PronController {
  private state: PronState = INITIAL_PRON_STATE;
  private target = '';
  private generation = 0;
  private current: ScoredAttempt | null = null;
  private disposed = false;

  constructor(
    private readonly onChange: (state: PronState) => void,
    private readonly deps: PronDeps,
  ) {}

  getState(): PronState {
    return this.state;
  }

  /**
   * 說說看: records and scores at once when the model is here, otherwise loads it first.
   * While recording, a second press ends the recording early.
   */
  async press(target: string): Promise<void> {
    if (this.disposed) return;
    if (this.state.status === 'recording') {
      this.current?.stop();
      return;
    }
    if (this.state.status !== 'idle') return;
    this.target = target;
    const mine = ++this.generation;
    this.set({ status: 'scoring', score: null, message: null });
    const cached = await this.deps.cached().catch(() => false);
    if (this.stale(mine)) return;
    if (cached) await this.record(mine);
    else await this.download(mine);
  }

  /** Loads the model with progress (a load already running is shared), then records. */
  private async download(mine: number): Promise<void> {
    this.set({ status: 'downloading', progress: 0 });
    try {
      await this.deps.load((progress) => {
        if (!this.stale(mine)) this.set({ progress });
      });
    } catch (error) {
      if (!this.stale(mine)) this.set({ status: 'idle', message: errorMessage(error) });
      return;
    }
    if (!this.stale(mine)) await this.record(mine);
  }

  /** Drops any try in progress and frees the microphone (the question is finished). */
  abort(): void {
    this.generation += 1;
    this.current?.abort();
    this.current = null;
    this.deps.release();
    if (this.state.status !== 'idle') this.set({ status: 'idle' });
  }

  dispose(): void {
    if (this.disposed) return;
    this.abort();
    this.disposed = true;
  }

  private async record(mine: number): Promise<void> {
    this.deps.beforeRecord();
    this.set({ status: 'recording', score: null, message: null });
    const attempt = this.deps.attempt(this.target, () => {
      if (!this.stale(mine)) this.set({ status: 'scoring' });
    });
    this.current = attempt;
    try {
      const score = await attempt.promise;
      if (this.stale(mine)) return;
      this.set(score ? { status: 'idle', score } : { status: 'idle', message: nothingHeard() });
    } catch (error) {
      if (!this.stale(mine)) this.set({ status: 'idle', message: errorMessage(error) });
    } finally {
      if (this.current === attempt) this.current = null;
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
  press: (target: string) => void;
  abort: () => void;
}

/** Longest a single try records: a little more than the sentence needs. */
function timeoutFor(target: string): number {
  const words = target.split(/\s+/).filter(Boolean).length;
  return Math.min(15000, Math.max(5000, 3000 + words * 600));
}

export function usePronScore(): UsePronScore {
  const [state, setState] = useState<PronState>(INITIAL_PRON_STATE);
  const ref = useRef<PronController | null>(null);
  if (!ref.current) {
    const mic = createShadowMic();
    ref.current = new PronController(setState, {
      cached: modelCached,
      load: loadModel,
      attempt: (target, onScoring) =>
        mic.attempt({ target, timeoutMs: timeoutFor(target), onScoring }),
      beforeRecord: stopAudio,
      release: () => mic.close(),
    });
  }
  const controller = ref.current;
  useEffect(() => () => controller.dispose(), [controller]);
  return {
    ...state,
    press: (target) => void controller.press(target),
    abort: () => controller.abort(),
  };
}
