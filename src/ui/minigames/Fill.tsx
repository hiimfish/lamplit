import { useEffect, useState } from 'preact/hooks';
import type { FillQuestion } from '../../learning/questions';
import './Fill.css';
import { ChoiceKeys, Feedback, FeedbackSlot, useAnswerClock } from './shared';
import type { MinigameProps } from './shared';

/** The option a number key (1 to 4) picks, or null when the game should ignore the key. */
function optionForKey(e: KeyboardEvent, count: number): number | null {
  if (e.ctrlKey || e.metaKey || e.altKey) return null;
  // Typing in the settings dialog (or any field) is not an answer.
  const target = e.target instanceof Element ? e.target : null;
  if (target?.closest('[role="dialog"], input, textarea, select')) return null;
  const n = Number(e.key);
  return Number.isInteger(n) && n >= 1 && n <= count ? n - 1 : null;
}

/**
 * The boxed gap in the sentence. Every option sits in the same grid cell, all but the
 * shown one invisible, so the gap is exactly as wide as the longest option and does not
 * change size (or reflow the sentence) when it fills in.
 */
function Gap({ question, shown }: { question: FillQuestion; shown: string | null }) {
  return (
    <span class={`fill-gap${shown === null ? '' : ' right'}`} data-testid="fill-gap">
      {question.options.map((option) => (
        <span
          key={option.id}
          class={`fill-word${option.id === shown ? ' shown' : ''}`}
          aria-hidden={option.id === shown ? undefined : 'true'}
        >
          {option.label}
        </span>
      ))}
      {shown === null && <span class="sr-only">（空格）</span>}
    </span>
  );
}

/**
 * 句子填空 (TOEIC Part 5): one sentence with a blank and 3 or 4 words or phrases; pick
 * the one that fits. No audio. The pick goes into the gap at once, so the learner sees
 * the whole sentence: a right pick turns the gap green; a wrong one stays in the sentence
 * struck through, with the right answer in the gap beside it. Then the Chinese of the
 * sentence and the note show. Nothing animates, so there is nothing to turn off for
 * "reduce motion".
 */
export function Fill({ question, onAnswered }: MinigameProps<FillQuestion>) {
  const clock = useAnswerClock();
  const [picked, setPicked] = useState<string | null>(null);
  const answered = picked !== null;
  const isRight = picked === question.correctId;
  const wrongLabel = question.options.find((o) => o.id === picked && !isRight)?.label;

  const choose = (id: string) => {
    if (picked !== null) return;
    setPicked(id);
    const right = id === question.correctId;
    const result = clock.finish(question.itemId, right, right ? undefined : 'wrong-choice');
    if (result) onAnswered(result);
  };

  // Number keys 1-4 pick the option at that place. Once answered, keys are left alone
  // (Enter goes to the focused 繼續).
  useEffect(() => {
    if (answered) return undefined;
    const onKey = (e: KeyboardEvent) => {
      const index = optionForKey(e, question.options.length);
      const option = index === null ? undefined : question.options[index];
      if (!option) return;
      e.preventDefault();
      choose(option.id);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [answered]);

  return (
    <div class="mg fill">
      <p class="mg-prompt">選出最適合放進空格的字</p>
      <div class="mg-say">
        <p class="fill-sentence" data-testid="fill-sentence" lang="en">
          {question.before}
          {wrongLabel !== undefined && (
            <>
              <del class="fill-wrong" data-testid="fill-wrong" aria-hidden="true">
                {wrongLabel}
              </del>{' '}
            </>
          )}
          <Gap question={question} shown={answered ? question.correctId : null} />
          {question.after}
        </p>
        {/*
         * The Chinese shows only after answering, whatever the 顯示中文 setting says:
         * reading the Chinese first would give the answer away.
         */}
        {answered && (
          <p class="mg-zh" data-testid="fill-zh">
            {question.zh}
          </p>
        )}
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
            hint={wrongLabel === undefined ? undefined : `你選的「${wrongLabel}」放進去不對。`}
            answer={isRight ? undefined : question.answer}
            answerLabel="正確答案"
            note={question.note}
          />
        )}
      </FeedbackSlot>
    </div>
  );
}
