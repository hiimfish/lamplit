import { useEffect, useRef, useState } from 'preact/hooks';
import { PICTURE_H, PICTURE_W } from '../../art/pictures';
import { playAudio, preloadAudio, stopAudio } from '../../audio/pronounce';
import { settingsStore } from '../../core/settings';
import { useStore } from '../../core/store';
import type { PictureQuestion } from '../../learning/questions';
import './listenPicture.css';
import { pictureUrl } from './PictureChoose';
import { Feedback, FeedbackSlot, play, useAnswerClock } from './shared';
import type { MinigameProps } from './shared';

/** Letters of the options, in the order shown. */
export const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

/** Quiet between two sentences when all four play in turn. */
export const GAP_MS = 400;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 看圖選句聲音選項 (TOEIC Part 1, `listen`): the picture, then four sentences heard one
 * after another, A to D, with no text. Each letter has a boxed ♪ key that plays its sentence
 * again and a boxed key that picks it. After answering, the sentences show with their
 * Chinese, the right one and a wrong pick marked.
 *
 * Minimal version: it works (play, pick, right or wrong, continue); the look is to be refined.
 */
export function ListenPicture({ question, onAnswered }: MinigameProps<PictureQuestion>) {
  const clock = useAnswerClock();
  const { showZh } = useStore(settingsStore);
  const [picked, setPicked] = useState<string | null>(null);
  const [playing, setPlaying] = useState(-1);
  /** Bumped on every play and on unmount, so an older run of sentences stops. */
  const token = useRef(0);
  const answered = picked !== null;
  const isRight = picked === question.correctId;
  const url = pictureUrl(question.pictureId);

  const playAll = async () => {
    const mine = ++token.current;
    for (let i = 0; i < question.options.length; i++) {
      const option = question.options[i]!;
      if (token.current !== mine) return;
      setPlaying(i);
      await playAudio(option.audioId ?? '', { text: option.en });
      if (token.current !== mine) return;
      await sleep(GAP_MS);
    }
    if (token.current === mine) setPlaying(-1);
  };

  const playOne = (index: number) => {
    const option = question.options[index];
    if (!option) return;
    token.current++;
    setPlaying(-1);
    if (!answered) clock.markHelp();
    play(option.audioId ?? '', option.en);
  };

  useEffect(() => {
    preloadAudio(question.options.flatMap((o) => (o.audioId ? [o.audioId] : [])));
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
    <div class="mg listen-picture">
      <p class="mg-prompt">看圖，聽四個句子，選出說得對的那一句</p>
      {url && (
        <img
          class="mg-picture"
          data-testid="picture"
          data-picture={question.pictureId}
          src={url}
          width={PICTURE_W}
          height={PICTURE_H}
          alt=""
        />
      )}
      <div class="lp-options">
        {question.options.map((option, i) => {
          const letter = OPTION_LETTERS[i] ?? String(i + 1);
          const state = !answered
            ? ''
            : option.id === question.correctId
              ? 'right'
              : option.id === picked
                ? 'wrong'
                : '';
          return (
            <div class="lp-row" key={option.id}>
              <button
                type="button"
                class={`pixel-button lp-play${playing === i ? ' on' : ''}`}
                data-testid={`play-${option.id}`}
                aria-label={`再聽 ${letter}`}
                onClick={() => playOne(i)}
              >
                ♪ {letter}
              </button>
              <button
                type="button"
                class={`pixel-button mg-option lp-pick ${state}`}
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
            hint={isRight ? undefined : '再聽一次，看圖裡的人在做什麼。'}
          />
        )}
      </FeedbackSlot>
    </div>
  );
}
