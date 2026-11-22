import { useState } from 'preact/hooks';
import { settingsStore } from '../../core/settings';
import { useStore } from '../../core/store';
import type { FillQuestion } from '../../learning/questions';
import './Fill.css';
import { ChoiceKeys, Feedback, FeedbackSlot, useAnswerClock } from './shared';
import type { MinigameProps } from './shared';

/**
 * 句子填空 (TOEIC Part 5): a sentence with one blank and 3 or 4 words or phrases; pick
 * the one that fits. No audio. After answering, the blank fills in with the right option
 * and the Chinese and the note show. Minimal version.
 */
export function Fill({ question, onAnswered }: MinigameProps<FillQuestion>) {
  const clock = useAnswerClock();
  const { showZh } = useStore(settingsStore);
  const [picked, setPicked] = useState<string | null>(null);
  const isRight = picked === question.correctId;
  const answered = picked !== null;

  const choose = (id: string) => {
    if (picked !== null) return;
    setPicked(id);
    const right = id === question.correctId;
    const result = clock.finish(question.itemId, right, right ? undefined : 'wrong-choice');
    if (result) onAnswered(result);
  };

  return (
    <div class="mg">
      <p class="mg-prompt">哪一個放進空格最合適？</p>
      <div class="mg-say">
        <p class="fill-sentence" data-testid="fill-sentence" lang="en">
          {question.before}
          <span class={`fill-blank${answered ? ' filled' : ''}`}>
            {answered ? question.answer : ''}
          </span>
          {question.after}
        </p>
        {answered && showZh && <p class="mg-zh">{question.zh}</p>}
      </div>
      <ChoiceKeys
        options={question.options}
        correctId={question.correctId}
        picked={picked}
        onPick={choose}
      />
      <FeedbackSlot>
        {answered && (
          <Feedback
            correct={isRight}
            answer={question.answer}
            answerLabel="正確答案"
            note={question.note}
          />
        )}
      </FeedbackSlot>
    </div>
  );
}
