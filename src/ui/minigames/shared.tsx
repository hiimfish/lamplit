/** Small pieces shared by the minigame components. */
import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { playAudio } from '../../audio/pronounce';
import { ERROR_HINTS } from '../../learning/errorHints';
import type { ErrorType } from '../../learning/grading';
import type { AnswerResult } from '../../learning/questions';

/** Every minigame reports its result once; QuestionView then shows 繼續. */
export interface MinigameProps<Q> {
  question: Q;
  onAnswered: (result: AnswerResult) => void;
}

/** Tracks time since mount and whether the learner used any help. */
export function useAnswerClock() {
  const start = useRef(Date.now());
  const helped = useRef(false);
  const done = useRef(false);
  return {
    markHelp: () => {
      helped.current = true;
    },
    /** Builds the result once; later calls return null. */
    finish(
      itemId: string,
      correct: boolean,
      error?: string,
      forceHelp = false,
    ): AnswerResult | null {
      if (done.current) return null;
      done.current = true;
      const result: AnswerResult = {
        itemId,
        correct,
        usedHelp: helped.current || forceHelp,
        ms: Date.now() - start.current,
      };
      if (error) result.error = error;
      return result;
    },
  };
}

export function hintFor(error: string | undefined): string {
  if (error && error in ERROR_HINTS) return ERROR_HINTS[error as ErrorType];
  return '再聽聽看標準說法。';
}

/** Plays a clip, ignoring failures so audio problems never block learning. */
export function play(audioId: string, text: string, slow = false): void {
  playAudio(audioId, { speed: slow ? 'slow' : 'normal', text }).catch(() => undefined);
}

export interface ReplayBarProps {
  audioId: string;
  text: string;
  onHelp: () => void;
  replayLabel?: string;
  /** Play normal speed once on mount. */
  autoplay?: boolean;
}

/** 再聽一次 / 慢速 buttons. Slow replay counts as help. */
export function ReplayBar({
  audioId,
  text,
  onHelp,
  replayLabel = '再聽一次',
  autoplay = false,
}: ReplayBarProps) {
  useEffect(() => {
    if (autoplay) play(audioId, text);
    // Only on mount: the parent remounts this component for each question.
  }, []);
  return (
    <div class="mg-row">
      <button
        type="button"
        class="pixel-button"
        data-testid="replay"
        onClick={() => play(audioId, text)}
      >
        ♪ {replayLabel}
      </button>
      <button
        type="button"
        class="pixel-button"
        data-testid="slow"
        onClick={() => {
          onHelp();
          play(audioId, text, true);
        }}
      >
        慢速
      </button>
    </div>
  );
}

export interface FeedbackProps {
  correct: boolean;
  /** Specific zh-TW explanation for a mistake. */
  hint?: string;
  /** Shown after `answerLabel` when wrong. */
  answer?: string;
  /** What the answer is called: a way to say it by default, 正確答案 for a fact read off a sign. */
  answerLabel?: string;
  note?: string;
}

/** Shown inside a FeedbackSlot, which announces it. */
export function Feedback({ correct, hint, answer, answerLabel = '正確說法', note }: FeedbackProps) {
  return (
    <div class={`mg-feedback ${correct ? 'good' : 'bad'}`} data-testid="feedback">
      <strong>{correct ? '答對了！' : '不太對喔'}</strong>
      {!correct && hint && <span>{hint}</span>}
      {answer && (
        <span>
          {correct ? '' : `${answerLabel}：`}
          <em lang="en">{answer}</em>
        </span>
      )}
      {note && <span>{note}</span>}
    </div>
  );
}

/**
 * A live region that exists from the start of the question and stays empty
 * until the answer comes in. Screen readers announce what is then put into it;
 * a region inserted already filled is often not announced.
 */
export function FeedbackSlot({ children }: { children?: ComponentChildren }) {
  return (
    <div class="mg-live" aria-live="polite" aria-atomic="true">
      {children}
    </div>
  );
}

export interface ChoiceKeysProps {
  options: readonly { id: string; label: string }[];
  correctId: string;
  /** The option the learner picked, or null while the question is open. */
  picked: string | null;
  onPick: (id: string) => void;
}

/** One boxed key per text choice; once picked, the right one and a wrong pick are marked. */
export function ChoiceKeys({ options, correctId, picked, onPick }: ChoiceKeysProps) {
  return (
    <div class="mg-options">
      {options.map((option) => {
        const state =
          picked === null
            ? ''
            : option.id === correctId
              ? 'right'
              : option.id === picked
                ? 'wrong'
                : '';
        return (
          <button
            type="button"
            key={option.id}
            class={`pixel-button mg-option ${state}`}
            data-testid={`option-${option.id}`}
            disabled={picked !== null}
            onClick={() => onPick(option.id)}
          >
            <span lang="en">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
