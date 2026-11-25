import { showZhNow, t } from '../../core/i18n';
import { useEffect, useRef, useState } from 'preact/hooks';
import { PICTURE_H, PICTURE_W } from '../../art/pictures';
import { nowPlaying, playAudio, preloadAudio, stopAudio } from '../../audio/pronounce';
import { LISTEN_PICTURE_ROLE } from '../../content/checks/pictures';
import { settingsStore } from '../../core/settings';
import { useStore } from '../../core/store';
import type { PictureQuestion, TalkQuestion } from '../../learning/questions';
import { digitIndex, letterIndex, useKeys } from '../keys';
import './listenPicture.css';
import { pictureUrl } from './PictureChoose';
import { Feedback, FeedbackSlot, play, useAnswerClock } from './shared';
import type { MinigameProps } from './shared';
import { playConversation, type ConversationDeps } from './Talk';

type Line = TalkQuestion['lines'][number];

/** Letters of the options, in the order shown. */
export const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

/**
 * Extra quiet between two sentences when all four play in turn, on top of the lead-in
 * playConversation keeps before every line: the learner has a moment to judge one
 * sentence before the next key lights.
 */
export const GAP_MS = 400;

/** What one sound option looks like on its key: before answering, its mark once answered. */
export type KeyState = '' | 'right' | 'wrong';

export function keyState(optionId: string, correctId: string, picked: string | null): KeyState {
  if (picked === null) return '';
  if (optionId === correctId) return 'right';
  return optionId === picked ? 'wrong' : '';
}

/** The line under the picture: which sentence is playing, or how to use the keys. */
export function statusText(playing: number, count: number): string {
  if (playing >= 0) {
    const letter = OPTION_LETTERS[playing] ?? playing + 1;
    return t(
      `正在播 ${letter}（${playing + 1}／${count}）`,
      `Playing ${letter} (${playing + 1}/${count})`,
    );
  }
  return t('按 ♪ 再聽一句，按字母選答案', 'Tap ♪ to hear one again, a letter to answer');
}

/** The options as lines for playConversation, all in the announcer's voice. */
export function optionLines(question: PictureQuestion): Line[] {
  return question.options.map((option) => ({
    audioId: option.audioId ?? '',
    role: LISTEN_PICTURE_ROLE,
    en: option.en,
    zh: option.zh,
  }));
}

/**
 * Plays the sentences one after another, A first, with the clip and browser-speech waiting
 * of the conversation player. `onPlaying(i)` is called as sentence i starts and
 * `onPlaying(-1)` as it ends, so a key is lit exactly while its sentence is heard.
 * Resolves true when all were played, false once `cancelled()`.
 */
export async function playInTurn(
  lines: readonly Line[],
  onPlaying: (index: number) => void,
  cancelled: () => boolean,
  deps: ConversationDeps,
): Promise<boolean> {
  for (let i = 0; i < lines.length; i++) {
    if (i > 0) await deps.sleep(GAP_MS);
    if (cancelled()) return false;
    const done = await playConversation([lines[i]!], () => onPlaying(i), cancelled, deps);
    if (!done || cancelled()) return false;
    onPlaying(-1);
  }
  return true;
}

/** Plays a sentence's clip; true if the clip itself was heard (it then resolves at its end). */
async function playClip(line: Line): Promise<boolean> {
  let heard = false;
  const unsubscribe = nowPlaying.subscribe((state) => {
    if (state.audioId === line.audioId) heard = true;
  });
  try {
    await playAudio(line.audioId, { text: line.en });
  } finally {
    unsubscribe();
  }
  return heard;
}

function browserSpeechBusy(): boolean {
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
    return window.speechSynthesis.speaking || window.speechSynthesis.pending;
  } catch {
    return false;
  }
}

const liveDeps: ConversationDeps = {
  play: playClip,
  speechBusy: browserSpeechBusy,
  stop: stopAudio,
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now: () => Date.now(),
};

/**
 * 看圖聽句, 看圖選句聲音選項 (TOEIC Part 1, `listen`): the picture, then four sentences
 * heard one after another, A to D, with no text. Under the picture sit four boxed letter
 * keys (two by two); each lights while its sentence plays. Tapping a letter chooses it;
 * the small ♪ key beside it (a separate key, so a replay never chooses) plays that sentence
 * again and counts as help. After answering, the keys stack one per row and each shows its
 * sentence in English and Chinese, the right one (and a wrong pick) marked, with ♪ and 慢速
 * beside it; the right sentence is spoken once.
 */
export function ListenPicture({ question, onAnswered }: MinigameProps<PictureQuestion>) {
  const clock = useAnswerClock();
  const { showZh } = useStore(settingsStore);
  const [picked, setPicked] = useState<string | null>(null);
  /** Index of the sentence being heard during the play in turn, or -1. */
  const [playing, setPlaying] = useState(-1);
  /** Bumped on every play and on unmount, so an older run of sentences stops. */
  const token = useRef(0);
  const answered = picked !== null;
  const isRight = picked === question.correctId;
  const url = pictureUrl(question.pictureId);
  const count = question.options.length;

  const playAll = async () => {
    const mine = ++token.current;
    const cancelled = () => token.current !== mine;
    await playInTurn(
      optionLines(question),
      (i) => {
        if (!cancelled()) setPlaying(i);
      },
      cancelled,
      liveDeps,
    );
    if (!cancelled()) setPlaying(-1);
  };

  /** Stops the play in turn (if any) and plays one sentence. */
  const playOne = (index: number, slow = false) => {
    const option = question.options[index];
    if (!option) return;
    token.current++;
    setPlaying(-1);
    if (!answered) clock.markHelp();
    play(option.audioId ?? '', option.en, slow);
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
    token.current++;
    setPlaying(-1);
    setPicked(id);
    const ok = id === question.correctId;
    const result = clock.finish(question.itemId, ok, ok ? undefined : 'wrong-choice');
    if (result) onAnswered(result);
    const right = question.options.find((o) => o.id === question.correctId);
    play(question.audioId, right?.en ?? '');
  };

  // Keys 1-4 or A-D pick while the question is open. Space plays all four again (help, like
  // ♪); once answered, Space / Shift+Space play the right sentence at normal / slow speed.
  const pickKeys: Record<string, () => void> = {};
  question.options.forEach((option, i) => {
    const pick = () => choose(option.id);
    if (digitIndex(String(i + 1), count) !== null) pickKeys[String(i + 1)] = pick;
    const letter = OPTION_LETTERS[i]?.toLowerCase();
    if (letter && letterIndex(letter, count) !== null) pickKeys[letter] = pick;
  });
  useKeys(pickKeys, !answered);
  const rightIndex = question.options.findIndex((o) => o.id === question.correctId);
  useKeys({
    Space: () => {
      if (answered) {
        playOne(rightIndex);
        return;
      }
      clock.markHelp();
      stopAudio();
      void playAll();
    },
    'Shift+Space': () => {
      if (answered) playOne(rightIndex, true);
    },
  });

  return (
    <div class={`mg listen-picture${answered ? ' answered' : ''}`}>
      <p class="mg-prompt">
        {t('看圖聽句：選出說得對的那一句', 'Look and listen: pick the sentence that fits')}
      </p>
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
      {!answered && (
        <p class="lp-status" role="status" data-testid="lp-status">
          {statusText(playing, count)}
        </p>
      )}
      <div class="lp-keys">
        {question.options.map((option, i) => {
          const letter = OPTION_LETTERS[i] ?? String(i + 1);
          const state = keyState(option.id, question.correctId, picked);
          const on = playing === i;
          return (
            <div class="lp-cell" key={option.id}>
              <button
                type="button"
                class={`pixel-button mg-option lp-pick ${state}${on ? ' on' : ''}`}
                data-testid={`option-${option.id}`}
                aria-label={answered ? undefined : t(`選 ${letter}`, `Pick ${letter}`)}
                aria-current={on ? 'true' : undefined}
                disabled={answered}
                onClick={() => choose(option.id)}
              >
                {!answered && (
                  <span class="lp-mark" aria-hidden="true">
                    {on ? '▶' : ''}
                  </span>
                )}
                <span class="lp-letter">{letter}</span>
                {answered && (
                  <span class="mg-say">
                    <span lang="en">{option.en}</span>
                    {showZhNow(showZh) && <span class="mg-pair-zh">{option.zh}</span>}
                  </span>
                )}
              </button>
              <div class="lp-plays">
                <button
                  type="button"
                  class="pixel-button small lp-play"
                  data-testid={`play-${option.id}`}
                  aria-label={t(`再聽 ${letter}`, `Play ${letter} again`)}
                  onClick={() => playOne(i)}
                >
                  ♪
                </button>
                {answered && (
                  <button
                    type="button"
                    class="pixel-button small lp-play"
                    data-testid={`slow-${option.id}`}
                    aria-label={t(`慢速再聽 ${letter}`, `Play ${letter} slowly`)}
                    onClick={() => playOne(i, true)}
                  >
                    {t('慢速', 'Slow')}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <FeedbackSlot>
        {answered && (
          <Feedback
            correct={isRight}
            hint={
              isRight
                ? undefined
                : t(
                    '再聽一次，看圖裡的人在做什麼。',
                    'Listen again and look at what the people are doing.',
                  )
            }
          />
        )}
      </FeedbackSlot>
    </div>
  );
}
