import { isEnglish, t } from '../../core/i18n';
import { useState } from 'preact/hooks';
import { gradeAnswer, type GradeResult } from '../../learning/grading';
import { spellMarks } from '../../learning/questionGen';
import type { SpellQuestion } from '../../learning/questions';
import { ItemIcon } from '../ItemIcon';
import { useKeys } from '../keys';
import type { KeyMap } from '../keys';
import { Feedback, FeedbackSlot, ReplayBar, hintFor, play, useAnswerClock } from './shared';
import type { MinigameProps } from './shared';

/** On-screen letter keys: no system keyboard, so no autocorrect and no page resize. */
const KEY_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
const LETTERS = [...KEY_ROWS.join('')];

/** A mouse click leaves focus where it was, so a later Enter checks instead of re-pressing a letter. */
const keepFocus = (e: MouseEvent) => e.preventDefault();

/** One box per letter of the answer; after checking, each typed letter shows right or wrong. */
function LetterSlots({
  typed,
  answer,
  graded,
}: {
  typed: string;
  answer: string;
  graded: boolean;
}) {
  const marks = graded ? spellMarks(typed, answer) : [];
  return (
    <div
      class="mg-spell-slots"
      lang="en"
      data-testid="spell-slots"
      aria-label={typed || t('空白', 'Empty')}
    >
      {[...answer].map((_, i) => {
        const state = marks[i] ?? (graded ? 'wrong' : i === typed.length ? 'next' : '');
        return (
          <span key={i} class={`mg-spell-slot ${state}`} aria-hidden="true">
            {typed[i] ?? ''}
          </span>
        );
      })}
    </div>
  );
}

interface KeyboardProps {
  full: boolean;
  empty: boolean;
  onLetter: (letter: string) => void;
  onBack: () => void;
  onCheck: () => void;
}

/** Letter keys; the bottom row ends with ⌫ and 檢查, so the whole pad is three rows. */
function LetterKeys({ full, empty, onLetter, onBack, onCheck }: KeyboardProps) {
  return (
    <div class="mg-keys" lang="en">
      {KEY_ROWS.map((row, r) => (
        <div class="mg-keys-row" key={row}>
          {[...row].map((letter) => (
            <button
              type="button"
              key={letter}
              class="pixel-button mg-key"
              data-testid={`key-${letter}`}
              disabled={full}
              onMouseDown={keepFocus}
              onClick={() => onLetter(letter)}
            >
              {letter}
            </button>
          ))}
          {r === KEY_ROWS.length - 1 && (
            <button
              type="button"
              class="pixel-button mg-key wide"
              data-testid="key-back"
              aria-label={t('刪掉一個字母', 'Delete a letter')}
              disabled={empty}
              onMouseDown={keepFocus}
              onClick={onBack}
            >
              ⌫
            </button>
          )}
          {r === KEY_ROWS.length - 1 && (
            <button
              type="button"
              class="pixel-button primary mg-key wide"
              lang={isEnglish() ? undefined : 'zh-Hant'}
              data-testid="check"
              disabled={empty}
              onClick={onCheck}
            >
              {t('檢查', 'Check')}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

/** Typing state and grading for one spelling question. */
function useSpell(question: SpellQuestion, onAnswered: MinigameProps<SpellQuestion>['onAnswered']) {
  const clock = useAnswerClock();
  const [typed, setTyped] = useState('');
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const locked = grade !== null;
  const max = question.answer.length;

  const letter = (l: string) => {
    if (!locked) setTyped((s) => (s.length < max ? s + l : s));
  };
  const back = () => {
    if (!locked) setTyped((s) => s.slice(0, -1));
  };
  const check = () => {
    if (locked || typed === '') return;
    const result = gradeAnswer(typed, [question.answer]);
    setGrade(result);
    const done = clock.finish(question.itemId, result.correct, result.error);
    if (done) onAnswered(done);
    play(question.audioId, question.answer);
  };
  return { clock, typed, grade, locked, max, letter, back, check };
}

export function Spell({ question, onAnswered }: MinigameProps<SpellQuestion>) {
  const { clock, typed, grade, locked, max, letter, back, check } = useSpell(question, onAnswered);

  // A physical keyboard types too: letters, Backspace and Enter (檢查). Space and Shift+Space
  // are left to the ReplayBar. Once answered the keys are off and Enter goes to 繼續.
  const keys: KeyMap = { Backspace: back, Enter: check };
  for (const l of LETTERS) keys[l] = () => letter(l);
  useKeys(keys, !locked);

  return (
    <div class="mg">
      <p class="mg-prompt">{t('聽聽看，拼出這個字', 'Listen and spell the word')}</p>
      <div class="mg-spell-cue">
        <span class="mg-emoji">
          <ItemIcon id={question.wordId} fallback={question.emoji} />
        </span>
        <span class="mg-zh">{question.zh}</span>
      </div>
      <ReplayBar
        audioId={question.audioId}
        text={question.answer}
        onHelp={clock.markHelp}
        autoplay
      />
      <LetterSlots typed={typed} answer={question.answer} graded={locked} />
      {!locked && (
        <LetterKeys
          full={typed.length >= max}
          empty={typed === ''}
          onLetter={letter}
          onBack={back}
          onCheck={check}
        />
      )}
      <FeedbackSlot>
        {grade && (
          <Feedback
            correct={grade.correct}
            hint={grade.correct ? undefined : hintFor(grade.error)}
            answer={question.answer}
          />
        )}
      </FeedbackSlot>
    </div>
  );
}
