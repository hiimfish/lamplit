import { t } from '../../core/i18n';
import { useState } from 'preact/hooks';
import type { MeaningQuestion } from '../../learning/questions';
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
 * 選意思: read a word (read-meaning) or hear it (listen-meaning) and pick its Chinese
 * meaning, with ListenPick's keys (1-4, Space to replay) and feedback. A heard word's
 * English shows only after answering; the word is played once answered either way.
 */
export function MeaningPick({ question, onAnswered }: MinigameProps<MeaningQuestion>) {
  const clock = useAnswerClock();
  const [picked, setPicked] = useState<string | null>(null);
  const listen = question.kind === 'listen-meaning';
  const meaning = question.options.find((o) => o.id === question.correctId)?.label ?? '';

  const choose = (id: string) => {
    if (picked !== null) return;
    setPicked(id);
    const isRight = id === question.correctId;
    const result = clock.finish(question.itemId, isRight, isRight ? undefined : 'wrong-choice');
    if (result) onAnswered(result);
    play(question.audioId, question.en);
  };
  useKeys(choiceKeyMap(question.options, choose), picked === null);

  return (
    <div class="mg">
      <p class="mg-prompt">
        {listen
          ? t('聽聽看，選出意思', 'Listen. What does this word mean?')
          : t('這個字是什麼意思？', 'What does this word mean?')}
      </p>
      {listen ? (
        <ReplayBar audioId={question.audioId} text={question.en} onHelp={clock.markHelp} autoplay />
      ) : (
        <p class="mg-sentence" lang="en" data-testid="meaning-word">
          {question.en}
        </p>
      )}
      {listen && picked !== null && (
        <p class="mg-sentence" lang="en" data-testid="meaning-word">
          {question.en}
        </p>
      )}
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
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
      <FeedbackSlot>
        {picked !== null && (
          <Feedback
            correct={picked === question.correctId}
            answer={question.en}
            answerLabel={t('這個字是', 'The word is')}
            note={t(`意思：${meaning}`, `Meaning: ${meaning}`)}
          />
        )}
      </FeedbackSlot>
    </div>
  );
}
