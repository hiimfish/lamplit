import { useEffect, useRef, useState } from 'preact/hooks';
import { playAudio, stopAudio } from '../../audio/pronounce';
import { ROLE_LABEL } from '../../content/roles';
import { settingsStore } from '../../core/settings';
import { useStore } from '../../core/store';
import type { TalkQuestion } from '../../learning/questions';
import './Talk.css';
import { ChoiceKeys, Feedback, FeedbackSlot, useAnswerClock } from './shared';
import type { MinigameProps } from './shared';

/**
 * 聽對話答題 (TOEIC Part 3): the conversation plays line by line with no text, then the
 * question and its answers show. The first question on a talk plays it; later questions
 * on the same talk start at the question (再聽一次 plays it again, counted as help).
 * After answering, the conversation shows as text. Minimal version.
 */
export function Talk({ question, onAnswered }: MinigameProps<TalkQuestion>) {
  const clock = useAnswerClock();
  const { showZh } = useStore(settingsStore);
  const [listening, setListening] = useState(question.index === 0);
  const [picked, setPicked] = useState<string | null>(null);
  /** Bumped on every play and on unmount, so an old queue of lines stops. */
  const token = useRef(0);
  const isRight = picked === question.correctId;
  const answer = question.options.find((o) => o.id === question.correctId)?.label ?? '';

  const playAll = async () => {
    const mine = ++token.current;
    setListening(true);
    for (const line of question.lines) {
      await playAudio(line.audioId, { text: line.en });
      if (token.current !== mine) return;
    }
    setListening(false);
  };

  useEffect(() => {
    if (question.index === 0) void playAll();
    return () => {
      token.current++;
      stopAudio();
    };
  }, []);

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
        聽對話，回答問題
        {question.total > 1 && `（${question.index + 1}／${question.total}）`}
      </p>
      <div class="mg-row">
        <button
          type="button"
          class="pixel-button"
          data-testid="replay"
          disabled={listening}
          onClick={() => {
            clock.markHelp();
            void playAll();
          }}
        >
          ♪ 再聽一次
        </button>
      </div>
      {listening ? (
        <p class="talk-listening" data-testid="talk-listening">
          仔細聽……
        </p>
      ) : (
        <>
          <div class="mg-say">
            <p class="mg-sentence" data-testid="talk-question" lang="en">
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
        </>
      )}
      {picked !== null && (
        <div class="talk-script" data-testid="talk-script">
          {question.lines.map((line) => (
            <p class="talk-line" key={line.audioId}>
              <span class="talk-who">{ROLE_LABEL[line.role]}</span>
              <span lang="en">{line.en}</span>
              {showZh && <span class="talk-zh">{line.zh}</span>}
            </p>
          ))}
        </div>
      )}
      <FeedbackSlot>
        {picked !== null && (
          <Feedback
            correct={isRight}
            hint={isRight ? undefined : '再聽一次對話裡說的。'}
            answer={answer}
            answerLabel="正確答案"
          />
        )}
      </FeedbackSlot>
    </div>
  );
}
