import { showZhNow, t } from '../../core/i18n';
import { useState } from 'preact/hooks';
import { settingsStore } from '../../core/settings';
import { useStore } from '../../core/store';
import type { SignQuestion } from '../../learning/questions';
import { ChoiceKeys, Feedback, FeedbackSlot, useAnswerClock } from './shared';
import type { MinigameProps } from './shared';

/** Reading (讀招牌／價目): a sign or price list, a question about it, and text answers. No audio. */
export function ReadSign({ question, onAnswered }: MinigameProps<SignQuestion>) {
  const clock = useAnswerClock();
  const { showZh } = useStore(settingsStore);
  const [picked, setPicked] = useState<string | null>(null);
  const isRight = picked === question.correctId;
  const answer = question.options.find((o) => o.id === question.correctId)?.label ?? '';

  const choose = (id: string) => {
    if (picked !== null) return;
    setPicked(id);
    const right = id === question.correctId;
    const result = clock.finish(question.itemId, right, right ? undefined : 'wrong-choice');
    if (result) onAnswered(result);
  };

  return (
    <div class="mg">
      <p class="mg-prompt">{t('看招牌，回答問題', 'Read the sign and answer')}</p>
      <div class="mg-sign" data-testid="sign" lang="en">
        {question.heading && <div class="mg-sign-heading">{question.heading}</div>}
        {question.rows.map((row, i) => (
          <div class="mg-sign-row" key={i}>
            <span>{row.label}</span>
            {row.value && <span class="mg-sign-value">{row.value}</span>}
          </div>
        ))}
      </div>
      <div class="mg-say">
        <p class="mg-sentence" data-testid="sign-question" lang="en">
          {question.en}
        </p>
        {showZhNow(showZh) && <p class="mg-zh">{question.zh}</p>}
      </div>
      <ChoiceKeys
        options={question.options}
        correctId={question.correctId}
        picked={picked}
        onPick={choose}
      />
      <FeedbackSlot>
        {picked !== null && (
          <Feedback
            correct={isRight}
            hint={isRight ? undefined : t('再看一次招牌上寫的字。', 'Read the sign again.')}
            answer={answer}
            answerLabel={t('正確答案', 'Answer')}
          />
        )}
      </FeedbackSlot>
    </div>
  );
}
