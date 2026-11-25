import { showZhNow, t } from '../../core/i18n';
import { useState } from 'preact/hooks';
import { getPicture, PICTURE_H, PICTURE_W } from '../../art/pictures';
import { settingsStore } from '../../core/settings';
import { useStore } from '../../core/store';
import { canvasPainter } from '../../game/painter';
import type { PictureQuestion } from '../../learning/questions';
import { useKeys } from '../keys';
import { Feedback, FeedbackSlot, KeyBadge, choiceKeyMap, play, useAnswerClock } from './shared';
import type { MinigameProps } from './shared';

const urls = new Map<string, string>();

/** Paints a picture once and keeps it as an image URL (undefined when it cannot be drawn). */
export function pictureUrl(id: string): string | undefined {
  const cached = urls.get(id);
  if (cached) return cached;
  const paint = getPicture(id);
  if (!paint || typeof document === 'undefined') return undefined;
  const canvas = document.createElement('canvas');
  canvas.width = PICTURE_W;
  canvas.height = PICTURE_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return undefined;
  paint(canvasPainter(ctx));
  const url = canvas.toDataURL('image/png');
  urls.set(id, url);
  return url;
}

/**
 * 看圖選句: a picture and a few sentences; pick the one that describes it. The right
 * sentence is spoken once answered. The Chinese shows only after answering (before that
 * it would let the learner match the picture without reading the English), and only on the
 * right sentence and the one picked, so the answered question still fits a phone screen.
 * For the same reason the feedback does not repeat the right sentence: its key is marked.
 */
export function PictureChoose({ question, onAnswered }: MinigameProps<PictureQuestion>) {
  const clock = useAnswerClock();
  const { showZh } = useStore(settingsStore);
  const [picked, setPicked] = useState<string | null>(null);
  const right = question.options.find((o) => o.id === question.correctId);
  const isRight = picked === question.correctId;
  const url = pictureUrl(question.pictureId);

  const choose = (id: string) => {
    if (picked !== null) return;
    setPicked(id);
    const ok = id === question.correctId;
    const result = clock.finish(question.itemId, ok, ok ? undefined : 'wrong-choice');
    if (result) onAnswered(result);
    play(question.audioId, right?.en ?? '');
  };
  useKeys(choiceKeyMap(question.options, choose), picked === null);

  return (
    <div class="mg">
      <p class="mg-prompt">
        {t('看圖，哪一句說得對？', 'Look at the picture. Which sentence fits?')}
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
      <div class="mg-sentences">
        {question.options.map((option, index) => {
          const state =
            picked === null
              ? ''
              : option.id === question.correctId
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
              onClick={() => choose(option.id)}
            >
              {index < 9 && <KeyBadge label={String(index + 1)} />}
              <span class="mg-say">
                <span lang="en">{option.en}</span>
                {showZhNow(showZh) && state !== '' && <span class="mg-pair-zh">{option.zh}</span>}
              </span>
            </button>
          );
        })}
      </div>
      <FeedbackSlot>
        {picked !== null && (
          <Feedback
            correct={isRight}
            hint={
              isRight
                ? undefined
                : t('再看一次圖裡的人在做什麼。', 'Look again at what the people are doing.')
            }
          />
        )}
      </FeedbackSlot>
    </div>
  );
}
