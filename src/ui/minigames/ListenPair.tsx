import { useState } from 'preact/hooks';
import { settingsStore } from '../../core/settings';
import { useStore } from '../../core/store';
import type { ListenPairQuestion } from '../../learning/questions';
import { useKeys } from '../keys';
import {
  Feedback,
  FeedbackSlot,
  KeyBadge,
  ReplayBar,
  choiceKeyMap,
  play,
  useAnswerClock,
} from './shared';
import type { MinigameProps } from './shared';

/**
 * Listening discrimination: hear one word of a minimal pair and pick it. No pictures, so
 * the answer comes from the sound alone. After answering, both words can be replayed to
 * hear the difference, which is the point of the exercise.
 */
export function ListenPair({ question, onAnswered }: MinigameProps<ListenPairQuestion>) {
  const { showZh } = useStore(settingsStore);
  const clock = useAnswerClock();
  const [picked, setPicked] = useState<string | null>(null);
  const correct = question.options.find((o) => o.id === question.correctId);
  const correctLabel = correct?.label ?? '';

  const choose = (id: string) => {
    if (picked !== null) return;
    setPicked(id);
    const isRight = id === question.correctId;
    const result = clock.finish(question.itemId, isRight, isRight ? undefined : 'wrong-choice');
    if (result) onAnswered(result);
    // The word heard plays once more with its answer, as on ListenPick.
    play(question.audioId, correctLabel);
  };
  useKeys(choiceKeyMap(question.options, choose), picked === null);

  return (
    <div class="mg">
      <p class="mg-prompt">仔細聽，是哪一個？</p>
      <p class="mg-focus" data-testid="pair-focus">
        聽差別：{question.focus}
      </p>
      <ReplayBar audioId={question.audioId} text={correctLabel} onHelp={clock.markHelp} autoplay />
      <div class="mg-options">
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
              class={`pixel-button mg-option mg-pair-option ${state}`}
              data-testid={`option-${option.id}`}
              disabled={picked !== null}
              onClick={() => choose(option.id)}
            >
              {index < 9 && <KeyBadge label={String(index + 1)} />}
              <span class="mg-pair-en" lang="en">
                {option.label}
              </span>
              {showZh && <span class="mg-pair-zh">{option.zh}</span>}
            </button>
          );
        })}
      </div>
      <FeedbackSlot>
        {picked !== null && (
          <Feedback
            correct={picked === question.correctId}
            hint={picked === question.correctId ? undefined : '兩個都聽聽看，比較一下差在哪裡。'}
            answer={correctLabel}
          />
        )}
      </FeedbackSlot>
      {picked !== null && (
        <div class="mg-row" data-testid="pair-compare">
          {question.options.map((option) => (
            <button
              type="button"
              key={option.id}
              class="pixel-button"
              data-testid={`compare-${option.id}`}
              onClick={() => play(option.audioId, option.label)}
            >
              ♪ 聽 <span lang="en">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
