import { useEffect, useState } from 'preact/hooks';
import { sentenceFrom } from '../../learning/questionGen';
import { gradeAnswer } from '../../learning/grading';
import type { GradeResult } from '../../learning/grading';
import type { ArrangeQuestion } from '../../learning/questions';
import { settingsStore } from '../../core/settings';
import { useStore } from '../../core/store';
import { useKeys } from '../keys';
import { KeyCap } from '../KeyCap';
import type { KeyMap } from '../keys';
import './Arrange.css';
import {
  Feedback,
  FeedbackSlot,
  KeyBadge,
  ReplayBar,
  hintFor,
  play,
  useAnswerClock,
} from './shared';
import type { MinigameProps } from './shared';

/**
 * The key for each block, by its place in the pool: the left hand's 4 x 4 block of keys,
 * row by row (1 2 3 4, Q W E R, A S D F, Z X C V). A block keeps its key while others are
 * placed. Lines have at most 14 blocks; a 17th block would have no key (tap only).
 */
export const BLOCK_KEYS = [
  '1',
  '2',
  '3',
  '4',
  'q',
  'w',
  'e',
  'r',
  'a',
  's',
  'd',
  'f',
  'z',
  'x',
  'c',
  'v',
];

/**
 * The clip of the line an arrange question just played on 檢查. A 跟我說 step for the same
 * line right after it skips its autoplay, since the learner has just heard it.
 */
let justChecked: string | null = null;

/** True (once) when `audioId` is the line the last arrange check played. */
export function takeJustChecked(audioId: string): boolean {
  const hit = justChecked === audioId;
  justChecked = null;
  return hit;
}

/** The Chinese meaning, or a 看中文 key that reveals it (counts as help). */
function ZhHint({ zh, visible, onReveal }: { zh: string; visible: boolean; onReveal: () => void }) {
  if (visible) {
    return (
      <p class="mg-zh mg-zh-target" data-testid="zh">
        {zh}
      </p>
    );
  }
  return (
    <button type="button" class="pixel-button" data-testid="show-zh" onClick={onReveal}>
      看中文
      <KeyCap k="0" />
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
      {placed.length === 0 && (
        <span class="mg-placeholder">
          點下面的單字放到這裡<span class="mg-type-tip">，也可以按字塊上的鍵</span>
        </span>
      )}
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
  // The ghost keeps its cap (hidden) so the pool does not shift when a block is placed.
  const cap = (index: number) =>
    !locked && BLOCK_KEYS[index] ? <KeyBadge label={BLOCK_KEYS[index]!.toUpperCase()} /> : null;
  return (
    <div class="mg-pool">
      {blocks.map((block, index) =>
        placed.includes(index) ? (
          <span key={index} class="mg-block ghost" aria-hidden="true">
            {cap(index)}
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
            {cap(index)}
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
    <div class="mg-row mg-check-row">
      <button
        type="button"
        class="pixel-button primary mg-check"
        data-testid="check"
        disabled={empty}
        onClick={onCheck}
      >
        檢查
        <KeyCap k="Enter" />
      </button>
      <button
        type="button"
        class="pixel-button"
        data-testid="reset"
        disabled={empty}
        onClick={onReset}
      >
        重排
        <KeyCap k="Shift+Escape" />
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
    justChecked = question.audioId;
    play(question.audioId, answer);
  };
  const reset = () => setPlaced([]);
  return { clock, placed, grade, answer, locked, add, remove, check, reset };
}

/**
 * Keys while building: each block's own key (BLOCK_KEYS) places it, Backspace takes back
 * the last block, Escape is 重排, Enter is 檢查 and 0 is 看中文. These are action names
 * (keys.ts): on the keyboard take back is Esc, 重排 Shift+Esc, 檢查 Space and 看中文 T.
 * All off once checked.
 */
function useArrangeKeys(
  question: ArrangeQuestion,
  state: ReturnType<typeof useArrange>,
  revealZh: (() => void) | null,
) {
  const { placed, locked, add, remove, check, reset } = state;
  const keys: KeyMap = {
    Backspace: () => {
      if (placed.length > 0) remove(placed[placed.length - 1]!);
    },
    Escape: reset,
    Enter: check,
  };
  question.blocks.forEach((_, index) => {
    const key = BLOCK_KEYS[index];
    if (key) keys[key] = () => !placed.includes(index) && add(index);
  });
  if (revealZh) keys['0'] = revealZh;
  useKeys(keys, !locked);
}

export function Arrange({ question, onAnswered }: MinigameProps<ArrangeQuestion>) {
  const { showZh } = useStore(settingsStore);
  const [zhRevealed, setZhRevealed] = useState(false);
  const state = useArrange(question, onAnswered);
  const { clock, placed, grade, answer, locked, add, remove, check, reset } = state;
  const revealZh = () => {
    clock.markHelp();
    setZhRevealed(true);
  };
  const zhVisible = (showZh && !question.zhOnRequest) || zhRevealed;
  useArrangeKeys(question, state, zhVisible ? null : revealZh);
  // A new question forgets the line an earlier check played.
  useEffect(() => {
    justChecked = null;
  }, []);

  return (
    <div class="mg">
      <p class="mg-prompt">{question.prompt ?? '把單字排成句子'}</p>
      {/* A role-play turn's line joins the chat once answered; its 看中文 key would only take room. */}
      {!(locked && question.zhOnRequest && !zhRevealed) && (
        <ZhHint zh={question.zh} visible={zhVisible} onReveal={revealZh} />
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
