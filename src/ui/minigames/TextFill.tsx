import { useState } from 'preact/hooks';
import { textFillParts } from '../../learning/gen/textFills';
import type { TextFillQuestion } from '../../learning/questions';
import './textFill.css';
import { ChoiceKeys, Feedback, FeedbackSlot, useAnswerClock } from './shared';
import type { MinigameProps } from './shared';

/**
 * 段落填空 (TOEIC Part 6), minimal version: the text with the blank being asked marked,
 * earlier blanks filled with their right answers, later ones left as "___"; 4 boxed
 * options; right or wrong; after the last blank, the Chinese of the whole text. No audio.
 */
export function TextFill({ question, onAnswered }: MinigameProps<TextFillQuestion>) {
  const clock = useAnswerClock();
  const [picked, setPicked] = useState<string | null>(null);
  const answered = picked !== null;
  const isRight = picked === question.correctId;
  const answer = question.answers[question.index] ?? '';
  const last = question.index === question.total - 1;

  const choose = (id: string) => {
    if (picked !== null) return;
    setPicked(id);
    const right = id === question.correctId;
    const result = clock.finish(question.itemId, right, right ? undefined : 'wrong-choice');
    if (result) onAnswered(result);
  };

  return (
    <div class="mg text-fill">
      <p class="mg-prompt">
        段落填空：選出最適合第 {question.index + 1} 個空格的答案（{question.index + 1}／
        {question.total}）
      </p>
      <div class="text-fill-box" data-testid="text-fill-text" lang="en">
        {question.title && <p class="text-fill-title">{question.title}</p>}
        {textFillParts(question.lines).map((parts, i) => (
          <p key={i} class="text-fill-line">
            {parts.map((part, j) => {
              if ('text' in part) return <span key={j}>{part.text}</span>;
              const b = part.blank;
              if (b < question.index || (b === question.index && answered)) {
                return (
                  <span key={j} class="text-fill-gap filled" data-testid={`text-fill-blank-${b}`}>
                    {question.answers[b]}
                  </span>
                );
              }
              const now = b === question.index;
              return (
                <span
                  key={j}
                  class={`text-fill-gap${now ? ' now' : ''}`}
                  data-testid={`text-fill-blank-${b}`}
                  aria-current={now ? 'true' : undefined}
                >
                  {now ? `（${b + 1}）` : '___'}
                </span>
              );
            })}
          </p>
        ))}
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
            answer={isRight ? undefined : answer}
            answerLabel="正確答案"
            note={question.note}
          />
        )}
      </FeedbackSlot>
      {answered && last && (
        <div class="text-fill-zh" data-testid="text-fill-zh">
          {question.zh.map((line, i) => (
            <p key={i} class="mg-zh">
              {line}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
