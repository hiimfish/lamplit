/**
 * Renders one question of any kind. The minigame reports its result as soon as the
 * learner answers; the result is passed on to the caller only when they press 繼續,
 * so the feedback stays on screen until then.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import type { AnswerResult, Question } from '../../learning/questions';
import { focusAndReveal, focusLost, focusStatic } from '../focus';
import { Arrange } from './Arrange';
import { ChooseReply } from './ChooseReply';
import { ListenPair } from './ListenPair';
import { ListenPick } from './ListenPick';
import { Speak } from './Speak';
import './minigames.css';

export interface QuestionViewProps {
  question: Question;
  onAnswer: (result: AnswerResult) => void;
}

const ids = new WeakMap<Question, number>();
let nextId = 1;
/** Stable unique key per question object so state resets between questions. */
function keyFor(question: Question): number {
  let id = ids.get(question);
  if (id === undefined) {
    id = nextId++;
    ids.set(question, id);
  }
  return id;
}

function Body({ question, onAnswer }: QuestionViewProps) {
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [sent, setSent] = useState(false);
  const onAnswered = (r: AnswerResult) => setResult((current) => current ?? r);
  const continueRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // The previous question's 繼續 is gone: start the new question at its prompt.
  useEffect(() => {
    if (focusLost()) focusStatic(rootRef.current?.querySelector('.mg-prompt'));
  }, []);

  // The answered keys are disabled, so focus 繼續. On short screens the feedback
  // pushes it out of view, so bring it back into view too.
  useEffect(() => {
    if (result) focusAndReveal(continueRef.current);
  }, [result]);

  let view;
  switch (question.kind) {
    case 'listen-pick':
      view = <ListenPick question={question} onAnswered={onAnswered} />;
      break;
    case 'listen-pair':
      view = <ListenPair question={question} onAnswered={onAnswered} />;
      break;
    case 'arrange':
      view = <Arrange question={question} onAnswered={onAnswered} />;
      break;
    case 'choose-reply':
      view = <ChooseReply question={question} onAnswered={onAnswered} />;
      break;
    case 'speak':
      view = <Speak question={question} onAnswered={onAnswered} />;
      break;
  }

  return (
    <div class="mg-root" data-testid={`question-${question.kind}`} ref={rootRef}>
      {view}
      {result && (
        <button
          ref={continueRef}
          type="button"
          class="pixel-button primary mg-continue"
          data-testid="continue"
          disabled={sent}
          onClick={() => {
            if (sent) return;
            setSent(true);
            onAnswer(result);
          }}
        >
          繼續
        </button>
      )}
    </div>
  );
}

export function QuestionView(props: QuestionViewProps) {
  return <Body key={keyFor(props.question)} {...props} />;
}
