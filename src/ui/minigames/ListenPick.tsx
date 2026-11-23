import { useState } from 'preact/hooks';
import type { ListenPickQuestion } from '../../learning/questions';
import { hasItemIcon, ItemIcon } from '../ItemIcon';
import { useKeys } from '../keys';
import {
  Feedback,
  FeedbackSlot,
  KeyBadge,
  ReplayBar,
  choiceKeyMap,
  hintFor,
  play,
  useAnswerClock,
} from './shared';
import type { MinigameProps } from './shared';

export function ListenPick({ question, onAnswered }: MinigameProps<ListenPickQuestion>) {
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
    play(question.audioId, correctLabel);
  };
  useKeys(choiceKeyMap(question.options, choose), picked === null);

  return (
    <div class="mg">
      <p class="mg-prompt">聽聽看，選出你聽到的</p>
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
              class={`pixel-button mg-option ${state}`}
              data-testid={`option-${option.id}`}
              disabled={picked !== null}
              onClick={() => choose(option.id)}
            >
              {index < 9 && <KeyBadge label={String(index + 1)} />}
              {(hasItemIcon(option.id) || option.emoji) && (
                <span class="mg-emoji">
                  <ItemIcon id={option.id} fallback={option.emoji} />
                </span>
              )}
              <span lang="en">{option.label}</span>
            </button>
          );
        })}
      </div>
      <FeedbackSlot>
        {picked !== null && (
          <Feedback
            correct={picked === question.correctId}
            hint={picked === question.correctId ? undefined : hintFor(undefined)}
            answer={correctLabel}
          />
        )}
      </FeedbackSlot>
    </div>
  );
}
