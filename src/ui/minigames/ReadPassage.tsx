import { useState } from 'preact/hooks';
import { settingsStore } from '../../core/settings';
import { useStore } from '../../core/store';
import type { PassageQuestion } from '../../learning/questions';
import './ReadPassage.css';
import { ChoiceKeys, Feedback, FeedbackSlot, useAnswerClock } from './shared';
import type { MinigameProps } from './shared';

/**
 * 讀短文 (TOEIC Part 7): a short message, flyer, notice, ad, form or email, one question
 * about it and text answers. No audio. Minimal version.
 */
export function ReadPassage({ question, onAnswered }: MinigameProps<PassageQuestion>) {
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
      <p class="mg-prompt">
        讀短文，回答問題
        {question.total > 1 && `（${question.index + 1}／${question.total}）`}
      </p>
      <div class={`passage passage-${question.passageKind}`} data-testid="passage" lang="en">
        {question.title && <div class="passage-title">{question.title}</div>}
        {question.lines.map((line, i) => (
          <p class="passage-line" key={i}>
            {line}
          </p>
        ))}
      </div>
      <div class="mg-say">
        <p class="mg-sentence" data-testid="passage-question" lang="en">
          {question.en}
        </p>
        {showZh && <p class="mg-zh">{question.zh}</p>}
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
            hint={isRight ? undefined : '再讀一次短文裡寫的。'}
            answer={answer}
            answerLabel="正確答案"
          />
        )}
      </FeedbackSlot>
    </div>
  );
}
