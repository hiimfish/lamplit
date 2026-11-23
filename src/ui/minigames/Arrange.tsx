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
import { Feedback, FeedbackSlot, ReplayBar, hintFor, play, useAnswerClock } from './shared';
import type { MinigameProps } from './shared';

/** Case and curly apostrophes folded, so typed "im" style keys compare with a block. */
function fold(text: string): string {
  return text.toLowerCase().replace(/[‘’]/g, "'");
}

/** What typing `typed` means for the blocks still in the pool. */
export interface TypedMatch {
  /** The block to place now: every remaining block starting with the text says the same word. */
  place: number | null;
  /** Some remaining block starts with the typed text. */
  any: boolean;
}

/**
 * Typing to place a block: the remaining blocks that start with the typed text (ignoring
 * case). When they all say the same word, the first of them is placed at once; when they
 * differ ("i" for I and in), the learner types on or presses Space for an exact match.
 */
export function matchTyped(
  blocks: readonly string[],
  placed: readonly number[],
  typed: string,
): TypedMatch {
  const text = fold(typed);
  if (!text) return { place: null, any: false };
  const hits = blocks
    .map((_, index) => index)
    .filter((index) => !placed.includes(index) && fold(blocks[index]!).startsWith(text));
  if (hits.length === 0) return { place: null, any: false };
  const first = fold(blocks[hits[0]!]!);
  const same = hits.every((index) => fold(blocks[index]!) === first);
  return { place: same ? hits[0]! : null, any: true };
}

/** The first remaining block that is exactly the typed word (Space places it), or null. */
export function exactBlock(
  blocks: readonly string[],
  placed: readonly number[],
  typed: string,
): number | null {
  const text = fold(typed);
  if (!text) return null;
  const index = blocks.findIndex((block, i) => !placed.includes(i) && fold(block) === text);
  return index < 0 ? null : index;
}

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
      <p class="mg-zh" data-testid="zh">
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
          點下面的單字放到這裡<span class="mg-type-tip">，也可以直接打字</span>
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

/** The letters typed so far, and a quiet note when no block starts with the last try. */
function TypedLine({ typed, miss }: { typed: string; miss: boolean }) {
  if (!typed && !miss) return null;
  return (
    <p class={`mg-typed${miss ? ' miss' : ''}`} data-testid="typed">
      打字：
      <span class="mg-typed-text" lang="en">
        {typed}
      </span>
      {miss && <span class="mg-typed-note">沒有這樣開頭的字</span>}
    </p>
  );
}

interface PoolProps {
  blocks: string[];
  placed: number[];
  locked: boolean;
  typed: string;
  onAdd: (index: number) => void;
}

/** The words still to place; a used word leaves a ghost of the same size. */
function WordPool({ blocks, placed, locked, typed, onAdd }: PoolProps) {
  const prefix = fold(typed);
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
            class={`pixel-button mg-block${prefix && fold(block).startsWith(prefix) ? ' typed' : ''}`}
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
        <KeyCap k="Escape" />
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
 * Keys while building: letters (and ' -) type a word and place it, Space places an exact
 * match, Backspace takes back a letter or the last block, Escape is 重排, Enter is 檢查 and
 * 0 is 看中文. All off once checked.
 */
function useArrangeKeys(
  question: ArrangeQuestion,
  state: ReturnType<typeof useArrange>,
  revealZh: (() => void) | null,
) {
  const { placed, locked, add, remove, check, reset } = state;
  const [typed, setTyped] = useState('');
  const [miss, setMiss] = useState(false);

  const type = (ch: string) => {
    const next = typed + ch;
    const match = matchTyped(question.blocks, placed, next);
    if (!match.any) {
      setMiss(true);
      return;
    }
    setMiss(false);
    if (match.place === null) {
      setTyped(next);
      return;
    }
    add(match.place);
    setTyped('');
  };
  const keys: KeyMap = {
    Backspace: () => {
      setMiss(false);
      if (typed) setTyped(typed.slice(0, -1));
      else if (placed.length > 0) remove(placed[placed.length - 1]!);
    },
    Escape: () => {
      setTyped('');
      setMiss(false);
      reset();
    },
    Enter: check,
    "'": () => type("'"),
    '-': () => type('-'),
  };
  for (const letter of 'abcdefghijklmnopqrstuvwxyz') keys[letter] = () => type(letter);
  if (revealZh) keys['0'] = revealZh;
  // Space only means something while a word is half typed; otherwise it is left to others.
  if (typed) {
    keys.Space = () => {
      const index = exactBlock(question.blocks, placed, typed);
      if (index === null) {
        setMiss(true);
        return;
      }
      add(index);
      setTyped('');
      setMiss(false);
    };
  }
  useKeys(keys, !locked);
  return { typed: locked ? '' : typed, miss: !locked && miss };
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
  const { typed, miss } = useArrangeKeys(question, state, zhVisible ? null : revealZh);
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
      <TypedLine typed={typed} miss={miss} />
      <WordPool
        blocks={question.blocks}
        placed={placed}
        locked={locked}
        typed={typed}
        onAdd={add}
      />
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
