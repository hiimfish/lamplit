/**
 * Speech-recognition lifecycle for the Speak minigame: privacy confirmation, one listen at a
 * time, abort on unmount. listenOnce() itself guarantees a timeout, so 'listening' always ends.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { stopAudio } from '../../audio/pronounce';
import {
  compareSpoken,
  hasSeenRecognitionNote,
  listenOnce,
  markRecognitionNoteSeen,
  recognitionMessage,
} from '../../audio/recognize';
import type { Listening, ListenOptions, SpokenComparison } from '../../audio/recognize';
import { scoreSpoken } from '../../learning/spokenScore';
import type { SpokenScore } from '../../learning/spokenScore';

/** 'confirm' = privacy note on screen, nothing is listening yet. */
type RecognitionStatus = 'idle' | 'confirm' | 'listening';

export interface RecognitionState {
  status: RecognitionStatus;
  heard: SpokenComparison | null;
  /** The same scoring as 聽力加量's 跟著說 (spokenScore.ts): 0–100 and a level. */
  score: SpokenScore | null;
  message: string | null;
}

export interface RecognitionDeps {
  listen: (options: ListenOptions) => Listening;
  noteSeen: () => boolean;
  markNoteSeen: () => void;
  /** Silences everything the recognizer could hear (model clip, own recording). */
  beforeListen: () => void;
}

const INITIAL_RECOGNITION_STATE: RecognitionState = {
  status: 'idle',
  heard: null,
  score: null,
  message: null,
};

export const NOTHING_HEARD = '沒有聽到聲音，再試一次。';

export class RecognitionController {
  private state: RecognitionState = INITIAL_RECOGNITION_STATE;
  private session: Listening | null = null;
  private target = '';
  private generation = 0;
  private disposed = false;

  constructor(
    private readonly onChange: (state: RecognitionState) => void,
    private readonly deps: RecognitionDeps,
  ) {}

  getState(): RecognitionState {
    return this.state;
  }

  /** 辨識 tapped: shows the privacy note first time, otherwise starts listening. */
  request(target: string): void {
    if (this.disposed || this.state.status !== 'idle') return;
    this.target = target;
    if (this.deps.noteSeen()) this.begin();
    else this.set({ status: 'confirm', heard: null, score: null, message: null });
  }

  /** 繼續辨識: remember the choice, then (and only then) start listening. */
  confirm(): void {
    if (this.disposed || this.state.status !== 'confirm') return;
    this.deps.markNoteSeen();
    this.begin();
  }

  /** 取消 on the privacy note. The note will show again next time. */
  cancel(): void {
    if (this.state.status === 'confirm') this.set({ status: 'idle' });
  }

  /** Clears the last result/message (e.g. when a new recording starts). */
  clear(): void {
    if (this.state.heard || this.state.message)
      this.set({ heard: null, score: null, message: null });
  }

  /** Stops any listen and closes the note. */
  abort(): void {
    this.generation += 1;
    const session = this.session;
    this.session = null;
    session?.abort();
    if (this.state.status !== 'idle') this.set({ status: 'idle' });
  }

  dispose(): void {
    if (this.disposed) return;
    this.abort();
    this.disposed = true;
  }

  private begin(): void {
    this.deps.beforeListen();
    const mine = ++this.generation;
    const target = this.target;
    this.set({ status: 'listening', heard: null, score: null, message: null });
    const session = this.deps.listen({ lang: 'en-US' });
    this.session = session;
    session.promise.then(
      (text) =>
        this.finish(
          mine,
          text === ''
            ? { message: NOTHING_HEARD }
            : { heard: compareSpoken(target, text), score: scoreSpoken(target, [text]) },
        ),
      (error: unknown) => this.finish(mine, { message: recognitionMessage(error) }),
    );
  }

  private finish(mine: number, patch: Partial<RecognitionState>): void {
    if (this.disposed || mine !== this.generation) return;
    this.session = null;
    this.set({ status: 'idle', ...patch });
  }

  private set(patch: Partial<RecognitionState>): void {
    if (this.disposed) return;
    this.state = { ...this.state, ...patch };
    this.onChange(this.state);
  }
}

export interface UseRecognition extends RecognitionState {
  request: (target: string) => void;
  confirm: () => void;
  cancel: () => void;
  clear: () => void;
  abort: () => void;
}

/** `beforeListen` runs (after stopAudio) right before the microphone opens. */
export function useRecognition(beforeListen?: () => void): UseRecognition {
  const [state, setState] = useState<RecognitionState>(INITIAL_RECOGNITION_STATE);
  const hook = useRef(beforeListen);
  hook.current = beforeListen;
  const ref = useRef<RecognitionController | null>(null);
  ref.current ??= new RecognitionController(setState, {
    listen: listenOnce,
    noteSeen: hasSeenRecognitionNote,
    markNoteSeen: markRecognitionNoteSeen,
    beforeListen: () => {
      stopAudio();
      hook.current?.();
    },
  });
  const controller = ref.current;
  useEffect(() => () => controller.dispose(), [controller]);
  return {
    ...state,
    request: (target) => controller.request(target),
    confirm: () => controller.confirm(),
    cancel: () => controller.cancel(),
    clear: () => controller.clear(),
    abort: () => controller.abort(),
  };
}
