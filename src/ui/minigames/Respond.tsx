import { useEffect, useRef, useState } from 'preact/hooks';
import { nowPlaying, playAudio, preloadAudio, stopAudio } from '../../audio/pronounce';
import { ROLE_LABEL } from '../../content/roles';
import { settingsStore } from '../../core/settings';
import { useStore } from '../../core/store';
import type { RespondQuestion } from '../../learning/questions';
import '../flow.css';
import './respond.css';
import { digitIndex, letterIndex, useKeys } from '../keys';
import { Feedback, FeedbackSlot, useAnswerClock } from './shared';
import type { MinigameProps } from './shared';
import { playConversation, type ConversationDeps } from './Talk';

/** Letters of the responses, in the order heard. */
export const RESPONSE_LETTERS = ['A', 'B', 'C'];

/**
 * Quiet added before a clip when the whole set plays, on top of the lead-in every clip gets
 * from playConversation (LEAD_IN_MS): a longer one after the prompt, so the learner can take
 * in the question before A, and a shorter one between two responses.
 */
export const AFTER_PROMPT_MS = 700;
export const BETWEEN_RESPONSES_MS = 400;

/** One clip of the set: index 0 is the prompt, 1.. the responses in the order heard. */
export type RespondClip = Parameters<ConversationDeps['play']>[0];

/** The clips of a question: the prompt, then the responses as A, B, C. */
export function respondClips(question: RespondQuestion): RespondClip[] {
  return [
    question.prompt,
    ...question.options.map((o) => ({
      audioId: o.audioId,
      role: 'guide' as const,
      en: o.en,
      zh: o.zh,
    })),
  ];
}

/** Extra quiet before clip `index` when it follows another one in the same run. */
export function gapBeforeMs(index: number): number {
  return index === 1 ? AFTER_PROMPT_MS : BETWEEN_RESPONSES_MS;
}

/**
 * Plays the clips at `order` one after another with the quiet of gapBeforeMs between them,
 * calling `onClip` as each one starts. Each clip goes through playConversation (as Talk plays
 * a line), so it waits for the clip or the browser speech to end and never hangs. Resolves
 * true when all were played, false once `cancelled()`.
 */
export async function playClips(
  clips: readonly RespondClip[],
  order: readonly number[],
  onClip: (index: number) => void,
  cancelled: () => boolean,
  deps: ConversationDeps,
): Promise<boolean> {
  for (let k = 0; k < order.length; k++) {
    const index = order[k]!;
    const clip = clips[index];
    if (!clip) continue;
    if (k > 0) {
      await deps.sleep(gapBeforeMs(index));
      if (cancelled()) return false;
    }
    onClip(index);
    if (!(await playConversation([clip], () => undefined, cancelled, deps))) return false;
  }
  return true;
}

/** The status line under the keys. */
export function respondStatus(playing: number, answered: boolean): string {
  if (playing === 0) return '仔細聽問句…';
  if (playing > 0) return `仔細聽回應 ${RESPONSE_LETTERS[playing - 1] ?? ''}…`;
  return answered ? '點一句再聽一次，或按慢速' : '點 A、B、C 選回應；按 ♪ 再聽一次';
}

function browserSpeechBusy(): boolean {
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
    return window.speechSynthesis.speaking || window.speechSynthesis.pending;
  } catch {
    return false;
  }
}

/** The real audio, at normal or slow speed (the same as Talk's, which keeps its own private). */
function liveDeps(slow: boolean): ConversationDeps {
  return {
    play: async (clip) => {
      let heard = false;
      const unsubscribe = nowPlaying.subscribe((state) => {
        if (state.audioId === clip.audioId) heard = true;
      });
      try {
        await playAudio(clip.audioId, { text: clip.en, speed: slow ? 'slow' : 'normal' });
      } finally {
        unsubscribe();
      }
      return heard;
    },
    speechBusy: browserSpeechBusy,
    stop: stopAudio,
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    now: () => Date.now(),
  };
}

/**
 * 聽問句選回應 (應答題, TOEIC Part 2, sound only). Nothing to read before answering: the
 * speaker's tab (the role's Chinese name) lights while the prompt plays, then the keys A, B, C
 * light in turn while their responses play. Each line has a small boxed ♪ key on its right
 * that plays it again (help before answering), apart from the wide key that picks it, so
 * playing never picks; ♪ 全部再聽 plays the whole set again (help). Number keys 1 to 3 pick
 * on a computer. After answering, the prompt and the three responses show as boxed lines
 * with their Chinese (tap a line to hear it again, 慢速 beside it), the right one marked ○
 * and a wrong pick ×.
 */
export function Respond({ question, onAnswered }: MinigameProps<RespondQuestion>) {
  const clock = useAnswerClock();
  const { showZh } = useStore(settingsStore);
  const [picked, setPicked] = useState<string | null>(null);
  /** The clip being heard: -1 nothing, 0 the prompt, 1.. a response (A, B, C). */
  const [playing, setPlaying] = useState(-1);
  /** Bumped on every play, on answering and on unmount, so an older run stops. */
  const token = useRef(0);
  const answered = picked !== null;
  const isRight = picked === question.correctId;
  const clips = respondClips(question);
  const correct = question.options.find((o) => o.id === question.correctId);

  const run = async (order: readonly number[], slow = false) => {
    const mine = ++token.current;
    const cancelled = () => token.current !== mine;
    stopAudio();
    const onClip = (i: number) => {
      if (!cancelled()) setPlaying(i);
    };
    await playClips(clips, order, onClip, cancelled, liveDeps(slow));
    if (!cancelled()) setPlaying(-1);
  };

  /** ♪ 全部再聽 and the ♪ of one line: help while the question is open. */
  const replay = (order: readonly number[], slow = false) => {
    if (!answered) clock.markHelp();
    void run(order, slow);
  };

  useEffect(() => {
    preloadAudio(clips.map((c) => c.audioId));
    void run(clips.map((_, i) => i));
    return () => {
      token.current++;
      stopAudio();
    };
  }, []);

  const choose = (id: string) => {
    if (picked !== null) return;
    setPicked(id);
    const ok = id === question.correctId;
    const result = clock.finish(question.itemId, ok, ok ? undefined : 'wrong-choice');
    if (result) onAnswered(result);
    // Answering stops the set and plays the right response once (marked in the transcript).
    const right = question.options.findIndex((o) => o.id === question.correctId);
    if (right >= 0) void run([right + 1]);
    else {
      token.current++;
      stopAudio();
      setPlaying(-1);
    }
  };

  // Keys 1-3 or A-C pick a response; Space is ♪ 全部再聽; once answered, Enter goes to 繼續.
  const pickKeys: Record<string, () => void> = {};
  question.options.forEach((option, i) => {
    const pick = () => {
      if (!answered) choose(option.id);
    };
    if (digitIndex(String(i + 1), question.options.length) !== null) pickKeys[String(i + 1)] = pick;
    const letter = RESPONSE_LETTERS[i]?.toLowerCase();
    if (letter && letterIndex(letter, question.options.length) !== null) pickKeys[letter] = pick;
  });
  useKeys(pickKeys, !answered);
  useKeys({ Space: () => replay(clips.map((_, i) => i)) });

  const speaker = ROLE_LABEL[question.prompt.role];

  return (
    <div class={`mg respond${answered ? ' answered' : ''}`}>
      <p class="mg-prompt">
        聽問句選回應
        {question.total > 1 && `（${question.index + 1}／${question.total}）`}
      </p>
      <div class="mg-row">
        <button
          type="button"
          class="pixel-button"
          data-testid="respond-replay"
          onClick={() => replay(clips.map((_, i) => i))}
        >
          ♪ 全部再聽
        </button>
      </div>
      {answered ? (
        <div class="rs-transcript" data-testid="respond-transcript">
          <div class="bubble-row rs-line">
            <button
              type="button"
              class={`bubble rs-bubble${playing === 0 ? ' rs-now' : ''}`}
              data-testid="respond-prompt"
              aria-current={playing === 0 ? 'true' : undefined}
              onClick={() => replay([0])}
            >
              <span class="bubble-who">{speaker}</span>
              <span class="bubble-en" lang="en">
                {question.prompt.en}
              </span>
              {showZh && <span class="bubble-zh">{question.prompt.zh}</span>}
            </button>
            <button
              type="button"
              class="pixel-button small rs-slow"
              data-testid="respond-slow-prompt"
              onClick={() => replay([0], true)}
            >
              慢速
            </button>
          </div>
          {question.options.map((option, i) => {
            const letter = RESPONSE_LETTERS[i] ?? String(i + 1);
            const mark =
              option.id === question.correctId ? ' right' : option.id === picked ? ' wrong' : '';
            const now = playing === i + 1;
            return (
              <div class="bubble-row rs-line rs-answer" key={option.id}>
                <button
                  type="button"
                  class={`bubble rs-bubble${mark}${now ? ' rs-now' : ''}`}
                  data-testid={`option-${option.id}`}
                  aria-current={now ? 'true' : undefined}
                  onClick={() => replay([i + 1])}
                >
                  <span class="bubble-who">
                    {letter}
                    {option.id === picked && '（你選的）'}
                  </span>
                  <span class="bubble-en" lang="en">
                    {option.en}
                  </span>
                  {showZh && <span class="bubble-zh">{option.zh}</span>}
                </button>
                <button
                  type="button"
                  class="pixel-button small rs-slow"
                  data-testid={`slow-${option.id}`}
                  onClick={() => replay([i + 1], true)}
                >
                  慢速
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div class="rs-stage" data-testid="respond-listening">
          <div class="rs-line">
            <div
              class={`rs-ask${playing === 0 ? ' on' : ''}`}
              data-testid="respond-prompt"
              aria-current={playing === 0 ? 'true' : undefined}
            >
              <span class="rs-tab">
                <span class="rs-mark" aria-hidden="true">
                  {playing === 0 ? '▶' : ''}
                </span>
                {speaker}
              </span>
              <span class="rs-what">{playing === 0 ? '正在說…' : '說了一句話'}</span>
            </div>
            <button
              type="button"
              class="pixel-button rs-play"
              data-testid="play-prompt"
              aria-label="再聽問句"
              onClick={() => replay([0])}
            >
              ♪
            </button>
          </div>
          {question.options.map((option, i) => {
            const letter = RESPONSE_LETTERS[i] ?? String(i + 1);
            const now = playing === i + 1;
            return (
              <div class="rs-line" key={option.id}>
                <button
                  type="button"
                  class={`pixel-button rs-pick${now ? ' on' : ''}`}
                  data-testid={`option-${option.id}`}
                  aria-current={now ? 'true' : undefined}
                  aria-label={`選 ${letter}`}
                  onClick={() => choose(option.id)}
                >
                  <span class="rs-tab" aria-hidden="true">
                    <span class="rs-mark">{now ? '▶' : ''}</span>
                    {letter}
                  </span>
                  <span class="rs-what" aria-hidden="true">
                    {now ? '正在說…' : `選 ${letter}`}
                  </span>
                </button>
                <button
                  type="button"
                  class="pixel-button rs-play"
                  data-testid={`play-${option.id}`}
                  aria-label={`再聽 ${letter}`}
                  onClick={() => replay([i + 1])}
                >
                  ♪
                </button>
              </div>
            );
          })}
        </div>
      )}
      <p class="rs-status" role="status">
        {respondStatus(playing, answered)}
      </p>
      <FeedbackSlot>
        {answered && (
          <Feedback
            correct={isRight}
            hint={isRight ? undefined : '再聽一次問句，想想哪個回應接得上。'}
            answer={isRight ? undefined : correct?.en}
            answerLabel="正確回應"
          />
        )}
      </FeedbackSlot>
    </div>
  );
}
