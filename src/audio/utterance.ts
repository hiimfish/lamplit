/**
 * 聽力加量's 跟著說: records one spoken line and scores it on the device. The microphone
 * stays open between lines (one permission prompt), and each line's recording stops by
 * itself a little after the learner stops talking, or at the time limit. Recordings stay
 * in memory and are dropped once scored. While the microphone is open the background music
 * is off (AudioManager.micOpened).
 */
import type { SpokenScore } from '../learning/spokenScore';
import { getAudioManager } from './AudioManager';
import { getAudioContext } from './audioContext';
import { scoreRecording } from './pronModel';
import { closeMicrophone, openMicrophone, recordStream } from './recorder';
import type { RecordingHandle } from './recorder';

/** Loudness (RMS) that counts as speech, and how long it must last to start a line. */
const SPEECH_RMS = 0.02;
const SPEECH_MS = 120;
/** Quiet after speech that ends the line. */
const END_SILENCE_MS = 800;
const POLL_MS = 50;

export interface ScoredAttempt {
  /** The line's score; null when nothing was said. Rejects with a RecorderError or PronError. */
  promise: Promise<SpokenScore | null>;
  /** 說完了: stop recording now and score what was said. */
  stop(): void;
  /** Drop the line: no score, no callbacks. */
  abort(): void;
}

export interface AttemptOptions {
  target: string;
  timeoutMs: number;
  /** Recording is over and scoring has begun. */
  onScoring?: () => void;
}

export interface ShadowMic {
  attempt(options: AttemptOptions): ScoredAttempt;
  /** Releases the microphone (跟著說 off, leaving the screen). */
  close(): void;
}

class Aborted extends Error {
  readonly code = 'aborted';
}

export function createShadowMic(): ShadowMic {
  let stream: Promise<MediaStream> | null = null;
  /** The music was hushed for this microphone (undone once, on close). */
  let hushed = false;

  const open = () => {
    if (!stream) {
      // Hush at once, before the permission prompt, so no music runs into the recording.
      if (!hushed) {
        getAudioManager()?.micOpened();
        hushed = true;
      }
      stream = openMicrophone().catch((error: unknown) => {
        stream = null;
        unhush();
        throw error;
      });
    }
    return stream;
  };

  const unhush = () => {
    if (!hushed) return;
    hushed = false;
    getAudioManager()?.micClosed();
  };

  /**
   * Loudness of the stream right now, or -1 when it cannot be measured. Uses the game's
   * own audio context, unlocked by the first tap (iOS keeps a context made later, outside
   * a tap, suspended, and a suspended one would hear only silence).
   */
  const meter = (media: MediaStream): { level: () => number; release: () => void } => {
    const context = getAudioContext();
    if (!context) return { level: () => -1, release: () => undefined };
    try {
      const source = context.createMediaStreamSource(media);
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      const buffer = new Float32Array(analyser.fftSize);
      return {
        level: () => {
          if (context.state !== 'running') return -1;
          analyser.getFloatTimeDomainData(buffer);
          let sum = 0;
          for (const x of buffer) sum += x * x;
          return Math.sqrt(sum / buffer.length);
        },
        release: () => source.disconnect(),
      };
    } catch {
      return { level: () => -1, release: () => undefined };
    }
  };

  return {
    attempt({ target, timeoutMs, onScoring }) {
      let handle: RecordingHandle | null = null;
      let poll: ReturnType<typeof setInterval> | undefined;
      let limit: ReturnType<typeof setTimeout> | undefined;
      let aborted = false;
      let heardSpeech = false;
      let endRecording: () => void = () => undefined;

      const clearTimers = () => {
        clearInterval(poll);
        clearTimeout(limit);
      };

      const run = async (): Promise<SpokenScore | null> => {
        const media = await open();
        if (aborted) throw new Aborted();
        handle = recordStream(media, () => undefined);
        const { level, release } = meter(media);
        let loudFor = 0;
        let quietFor = 0;
        let metered = false;
        await new Promise<void>((resolve) => {
          endRecording = resolve;
          limit = setTimeout(resolve, timeoutMs);
          poll = setInterval(() => {
            const rms = level();
            if (rms < 0) return; // no meter: the time limit or 說完了 ends the line
            metered = true;
            if (rms >= SPEECH_RMS) {
              loudFor += POLL_MS;
              quietFor = 0;
              if (loudFor >= SPEECH_MS) heardSpeech = true;
            } else {
              loudFor = 0;
              quietFor += POLL_MS;
              if (heardSpeech && quietFor >= END_SILENCE_MS) resolve();
            }
          }, POLL_MS);
        });
        clearTimers();
        release();
        const blob = await handle.stop();
        if (aborted) throw new Aborted();
        // The meter heard no speech at all: nothing to score (and no model run).
        if (metered && !heardSpeech) return null;
        onScoring?.();
        // scoreRecording checks for silence itself, so a quiet line still scores null.
        const score = await scoreRecording(blob, target);
        if (aborted) throw new Aborted();
        return score;
      };

      return {
        promise: run(),
        stop: () => endRecording(),
        abort: () => {
          aborted = true;
          clearTimers();
          endRecording();
          handle?.stop().catch(() => undefined);
        },
      };
    },
    close() {
      const opened = stream;
      stream = null;
      unhush();
      void opened?.then(closeMicrophone, () => undefined);
    },
  };
}
