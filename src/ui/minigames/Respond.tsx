import { useEffect, useRef, useState } from 'preact/hooks';
import { playAudio, preloadAudio, stopAudio } from '../../audio/pronounce';
import { ROLE_LABEL } from '../../content/roles';
import { settingsStore } from '../../core/settings';
import { useStore } from '../../core/store';
import type { RespondQuestion } from '../../learning/questions';
import './respond.css';
import { Feedback, FeedbackSlot, play, useAnswerClock } from './shared';
import type { MinigameProps } from './shared';

/** Letters of the responses, in the order heard. */
export const RESPONSE_LETTERS = ['A', 'B', 'C'];

/** Quiet after the prompt and between two responses. */
export const GAP_MS = 500;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 應答題 (TOEIC Part 2, sound only): the prompt plays, then the three responses as A, B, C,
 * with no text. 再聽一次 plays them all again (counted as help); each letter has a boxed ♪ key
 * that plays its response again and a boxed key that picks it. After answering, the prompt
 * and the responses show with their Chinese, the right one and a wrong pick marked.
 *
 * Minimal version: it works (play, pick, right or wrong, continue); the look is to be refined.
 */
export function Respond({ question, onAnswered }: MinigameProps<RespondQuestion>) {
  const clock = useAnswerClock();
  const { showZh } = useStore(settingsStore);
  const [picked, setPicked] = useState<string | null>(null);
  /** -1 nothing, 0 the prompt, 1.. a response. */
  const [playing, setPlaying] = useState(-1);
  const token = useRef(0);
  const answered = picked !== null;
  const isRight = picked === question.correctId;
  const clips = [
    { audioId: question.prompt.audioId, en: question.prompt.en },
    ...question.options.map((o) => ({ audioId: o.audioId, en: o.en })),
  ];

  const playAll = async () => {
    const mine = ++token.current;
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i]!;
      if (token.current !== mine) return;
      setPlaying(i);
      await playAudio(clip.audioId, { text: clip.en });
      if (token.current !== mine) return;
      await sleep(GAP_MS);
    }
    if (token.current === mine) setPlaying(-1);
  };

  const playOne = (index: number) => {
    const clip = clips[index];
    if (!clip) return;
    token.current++;
    setPlaying(-1);
    if (!answered) clock.markHelp();
    play(clip.audioId, clip.en);
  };

  useEffect(() => {
    preloadAudio(clips.map((c) => c.audioId));
    void playAll();
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
  };

  return (
    <div class="mg respond">
      <p class="mg-prompt">
        聽一句話和三個回答，選出最合適的回答
        {question.total > 1 && `（${question.index + 1}／${question.total}）`}
      </p>
      <div class="mg-row">
        <button
          type="button"
          class="pixel-button"
          data-testid="respond-replay"
          onClick={() => {
            if (!answered) clock.markHelp();
            void playAll();
          }}
        >
          ♪ 再聽一次
        </button>
      </div>
      <div class={`rs-prompt${playing === 0 ? ' on' : ''}`} data-testid="respond-prompt">
        <span class="rs-who">{ROLE_LABEL[question.prompt.role]}</span>
        {answered ? (
          <span class="mg-say">
            <span lang="en">{question.prompt.en}</span>
            {showZh && <span class="mg-pair-zh">{question.prompt.zh}</span>}
          </span>
        ) : (
          <span>{playing === 0 ? '▶ 正在說…' : '說了一句話'}</span>
        )}
      </div>
      <div class="rs-options">
        {question.options.map((option, i) => {
          const letter = RESPONSE_LETTERS[i] ?? String(i + 1);
          const state = !answered
            ? ''
            : option.id === question.correctId
              ? 'right'
              : option.id === picked
                ? 'wrong'
                : '';
          return (
            <div class="rs-row" key={option.id}>
              <button
                type="button"
                class={`pixel-button rs-play${playing === i + 1 ? ' on' : ''}`}
                data-testid={`play-${option.id}`}
                aria-label={`再聽 ${letter}`}
                onClick={() => playOne(i + 1)}
              >
                ♪ {letter}
              </button>
              <button
                type="button"
                class={`pixel-button mg-option rs-pick ${state}`}
                data-testid={`option-${option.id}`}
                disabled={answered}
                onClick={() => choose(option.id)}
              >
                {answered ? (
                  <span class="mg-say">
                    <span lang="en">{option.en}</span>
                    {showZh && <span class="mg-pair-zh">{option.zh}</span>}
                  </span>
                ) : (
                  `選 ${letter}`
                )}
              </button>
            </div>
          );
        })}
      </div>
      <FeedbackSlot>
        {answered && (
          <Feedback
            correct={isRight}
            hint={isRight ? undefined : '再聽一次問題，想想哪個回答接得上。'}
          />
        )}
      </FeedbackSlot>
    </div>
  );
}
