import { useState } from 'preact/hooks';
import { settingsStore } from '../../core/settings';
import { useStore } from '../../core/store';
import type { ClozeQuestion } from '../../learning/questions';
import {
  ChoiceKeys,
  Feedback,
  FeedbackSlot,
  ReplayBar,
  hintFor,
  play,
  useAnswerClock,
} from './shared';
import type { MinigameProps } from './shared';

/**
 * Listening cloze (聽力填空): the line plays, its text shows with one word missing, and the
 * learner picks the word. After answering, the gap fills in with the right word, marked
 * as right whatever was picked (the wrong pick is marked on its own key).
 */
export function Cloze({ question, onAnswered }: MinigameProps<ClozeQuestion>) {
  const clock = useAnswerClock();
  const { showZh } = useStore(settingsStore);
  const [picked, setPicked] = useState<string | null>(null);
  const full = `${question.before}${question.answer}${question.after}`;
  const isRight = picked === question.correctId;

  const choose = (id: string) => {
    if (picked !== null) return;
    setPicked(id);
    const right = id === question.correctId;
    const result = clock.finish(question.itemId, right, right ? undefined : 'wrong-choice');
    if (result) onAnswered(result);
    play(question.audioId, full);
  };

  return (
    <div class="mg">
      <p class="mg-prompt">聽聽看，空格裡是哪個字？</p>
      <div class="mg-npc-row">
        <div class="mg-say">
          <p class="mg-cloze" data-testid="cloze-line" lang="en">
            {question.before}
            <span class={`mg-blank ${picked === null ? '' : 'filled'}`}>
              {picked === null ? '' : question.answer}
            </span>
            {question.after}
          </p>
          {showZh && <p class="mg-zh">{question.zh}</p>}
        </div>
        <ReplayBar audioId={question.audioId} text={full} onHelp={clock.markHelp} autoplay />
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
            hint={isRight ? undefined : hintFor(undefined)}
            answer={full}
          />
        )}
      </FeedbackSlot>
    </div>
  );
}
