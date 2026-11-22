import { useState } from 'preact/hooks';
import { sentenceFrom } from '../../learning/questionGen';
import { gradeAnswer } from '../../learning/grading';
import type { GradeResult } from '../../learning/grading';
import type { ArrangeQuestion } from '../../learning/questions';
import { settingsStore } from '../../core/settings';
import { useStore } from '../../core/store';
import { Feedback, FeedbackSlot, ReplayBar, hintFor, play, useAnswerClock } from './shared';
import type { MinigameProps } from './shared';

/** The Chinese meaning, or a 看中文 key that reveals it (counts as help). */
function ZhHint({ zh, visible, onReveal }: { zh: string; visible: boolean; onReveal: () => void }) {
  if (visible) {
    return (
      <p class="mg-zh" data-testid="zh">
        {zh}
      </p>
    );
  }
  return (
    <button type="button" class="pixel-button" data-testid="show-zh" onClick={onReveal}>
      看中文
    </button>
  );
}

interface LineProps {
  blocks: string[];
  placed: number[];
  grade: GradeResult | null;
  onRemove: (index: number) => void;
}

/** The sentence being built; tapping a placed block puts it back. */
function AnswerLine({ blocks, placed, grade, onRemove }: LineProps) {
  const state = grade ? (grade.correct ? 'right' : 'wrong') : '';
  return (
    <div class="mg-line" data-testid="answer-line">
      {placed.length === 0 && <span class="mg-placeholder">點下面的單字放到這裡</span>}
      {placed.map((index) => (
        <button
          type="button"
          key={index}
          lang="en"
          class={`pixel-button mg-block placed ${state}`}
          data-testid={`placed-${index}`}
          disabled={grade !== null}
          onClick={() => onRemove(index)}
        >
          {blocks[index]}
        </button>
      ))}
    </div>
  );
}

interface PoolProps {
  blocks: string[];
  placed: number[];
  locked: boolean;
  onAdd: (index: number) => void;
}

/** The words still to place; a used word leaves a ghost of the same size. */
function WordPool({ blocks, placed, locked, onAdd }: PoolProps) {
  return (
    <div class="mg-pool">
      {blocks.map((block, index) =>
        placed.includes(index) ? (
          <span key={index} class="mg-block ghost" aria-hidden="true">
            {block}
          </span>
        ) : (
          <button
            type="button"
            key={index}
            lang="en"
            class="pixel-button mg-block"
            data-testid={`block-${index}`}
            disabled={locked}
            onClick={() => onAdd(index)}
          >
            {block}
          </button>
        ),
      )}
    </div>
  );
}

function CheckRow({
  empty,
  onCheck,
  onReset,
}: {
  empty: boolean;
  onCheck: () => void;
  onReset: () => void;
}) {
  return (
    <div class="mg-row">
      <button
        type="button"
        class="pixel-button primary"
        data-testid="check"
        disabled={empty}
        onClick={onCheck}
      >
        檢查
      </button>
      <button
        type="button"
        class="pixel-button"
        data-testid="reset"
        disabled={empty}
        onClick={onReset}
      >
        重排
      </button>
    </div>
  );
}

/** Placement and grading state for one arrange question. */
function useArrange(
  question: ArrangeQuestion,
  onAnswered: MinigameProps<ArrangeQuestion>['onAnswered'],
) {
  const clock = useAnswerClock();
  const [placed, setPlaced] = useState<number[]>([]);
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const answer = question.accepted[0] ?? '';
  const locked = grade !== null;

  const add = (index: number) => {
    if (locked || placed.includes(index)) return;
    setPlaced([...placed, index]);
  };
  const remove = (index: number) => {
    if (locked) return;
    setPlaced(placed.filter((i) => i !== index));
  };
  const check = () => {
    if (locked || placed.length === 0) return;
    const result = gradeAnswer(sentenceFrom(question.blocks, placed), question.accepted);
    setGrade(result);
    const done = clock.finish(question.itemId, result.correct, result.error);
    if (done) onAnswered(done);
    play(question.audioId, answer);
  };
  const reset = () => setPlaced([]);
  return { clock, placed, grade, answer, locked, add, remove, check, reset };
}

export function Arrange({ question, onAnswered }: MinigameProps<ArrangeQuestion>) {
  const { showZh } = useStore(settingsStore);
  const [zhRevealed, setZhRevealed] = useState(false);
  const { clock, placed, grade, answer, locked, add, remove, check, reset } = useArrange(
    question,
    onAnswered,
  );
  const revealZh = () => {
    clock.markHelp();
    setZhRevealed(true);
  };

  return (
    <div class="mg">
      <p class="mg-prompt">{question.prompt ?? '把單字排成句子'}</p>
      {/* A role-play turn's line joins the chat once answered; its 看中文 key would only take room. */}
      {!(locked && question.zhOnRequest && !zhRevealed) && (
        <ZhHint
          zh={question.zh}
          visible={(showZh && !question.zhOnRequest) || zhRevealed}
          onReveal={revealZh}
        />
      )}
      <AnswerLine blocks={question.blocks} placed={placed} grade={grade} onRemove={remove} />
      <WordPool blocks={question.blocks} placed={placed} locked={locked} onAdd={add} />
      {!locked && <CheckRow empty={placed.length === 0} onCheck={check} onReset={reset} />}
      <FeedbackSlot>
        {grade && (
          <Feedback
            correct={grade.correct}
            hint={grade.correct ? undefined : hintFor(grade.error)}
            answer={answer}
          />
        )}
      </FeedbackSlot>
      {locked && <ReplayBar audioId={question.audioId} text={answer} onHelp={clock.markHelp} />}
    </div>
  );
}
