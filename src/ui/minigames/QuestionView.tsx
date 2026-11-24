/**
 * Renders one question of any kind. The minigame reports its result as soon as the
 * learner answers; the result is passed on to the caller only when they press 繼續,
 * so the feedback stays on screen until then.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { stopAudio } from '../../audio/pronounce';
import type { AnswerResult, Question } from '../../learning/questions';
import { focusAndReveal, focusLost, focusStatic } from '../focus';
import { useKeys } from '../keys';
import { KeyCap } from '../KeyCap';
import { Arrange } from './Arrange';
import { ChooseReply } from './ChooseReply';
import { Cloze } from './Cloze';
import { Fill } from './Fill';
import { ListenPair } from './ListenPair';
import { ListenPick } from './ListenPick';
import { ListenPicture } from './ListenPicture';
import { MeaningPick } from './MeaningPick';
import { PictureChoose } from './PictureChoose';
import { ReadPassage } from './ReadPassage';
import { ReadSign } from './ReadSign';
import { Respond } from './Respond';
import { Speak } from './Speak';
import { Spell } from './Spell';
import { Talk } from './Talk';
import { TextFill } from './TextFill';
import './minigames.css';

export interface QuestionViewProps {
  question: Question;
  onAnswer: (result: AnswerResult) => void;
  /** Told the result as soon as the learner answers, while its feedback is on screen. */
  onGraded?: (result: AnswerResult) => void;
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

function Body({ question, onAnswer, onGraded }: QuestionViewProps) {
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [sent, setSent] = useState(false);
  const onAnswered = (r: AnswerResult) => setResult((current) => current ?? r);
  const continueRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // The previous question's 繼續 is gone: start the new question at its prompt.
  // Leaving the question (繼續 or 先回小鎮) silences whatever it was playing; the
  // cleanup runs on unmount, before the next question's autoplay effect.
  useEffect(() => {
    if (focusLost()) focusStatic(rootRef.current?.querySelector('.mg-prompt'));
    return () => stopAudio();
  }, []);

  // The answered keys are disabled, so focus 繼續. On short screens the feedback
  // pushes it out of view, so bring it back into view too.
  useEffect(() => {
    if (!result) return;
    focusAndReveal(continueRef.current);
    onGraded?.(result);
  }, [result]);
  // Enter presses 繼續 even when focus wandered off it (a focused 繼續 takes Enter itself).
  useKeys({ Enter: () => continueRef.current?.click() }, result !== null);

  let view;
  switch (question.kind) {
    case 'listen-pick':
      view = <ListenPick question={question} onAnswered={onAnswered} />;
      break;
    case 'read-meaning':
    case 'listen-meaning':
      view = <MeaningPick question={question} onAnswered={onAnswered} />;
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
    case 'spell':
      view = <Spell question={question} onAnswered={onAnswered} />;
      break;
    case 'cloze':
      view = <Cloze question={question} onAnswered={onAnswered} />;
      break;
    case 'read-sign':
      view = <ReadSign question={question} onAnswered={onAnswered} />;
      break;
    case 'picture':
      // 看圖選句聲音選項 (Act 4): the sentences are heard, not read.
      view = question.listen ? (
        <ListenPicture question={question} onAnswered={onAnswered} />
      ) : (
        <PictureChoose question={question} onAnswered={onAnswered} />
      );
      break;
    case 'fill':
      view = <Fill question={question} onAnswered={onAnswered} />;
      break;
    case 'read-passage':
      view = <ReadPassage question={question} onAnswered={onAnswered} />;
      break;
    case 'talk':
      view = <Talk question={question} onAnswered={onAnswered} />;
      break;
    case 'respond':
      view = <Respond question={question} onAnswered={onAnswered} />;
      break;
    case 'text-fill':
      view = <TextFill question={question} onAnswered={onAnswered} />;
      break;
    default: {
      // Every kind has a case: a new kind fails to compile here until it gets one.
      const missing: never = question;
      view = missing;
    }
  }

  return (
    <div class="mg-root" data-testid={`question-${question.kind}`} ref={rootRef}>
      {view}
      {/*
        Before the answer, a grey 繼續 holds its place. CSS shows it only on an upright phone
        under a scene, where 繼續 is the full-width key along the bottom (flow.css).
      */}
      {!result && (
        <button type="button" class="pixel-button primary mg-continue waiting" disabled>
          繼續
          <KeyCap k="Enter" />
        </button>
      )}
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
          <KeyCap k="Enter" />
        </button>
      )}
    </div>
  );
}

export function QuestionView(props: QuestionViewProps) {
  return <Body key={keyFor(props.question)} {...props} />;
}
