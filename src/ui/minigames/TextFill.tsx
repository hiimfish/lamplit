import type { ComponentChildren } from 'preact';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { textFillParts, type TextFillPart } from '../../learning/gen/textFills';
import type { TextFillQuestion } from '../../learning/questions';
import './textFill.css';
import { ChoiceKeys, Feedback, FeedbackSlot, useAnswerClock } from './shared';
import type { MinigameProps } from './shared';

/*
 * 段落填空 (TOEIC Part 6): a short email or notice with 2 to 4 numbered blanks, asked one at
 * a time in order (one question per blank; QuestionView remounts this component for each).
 * No audio.
 *
 * The text. It sits in a paper box laid out like its kind (an email's subject or sender
 * line over a rule, the greeting, the paragraphs and the sign-off set apart; a notice's
 * heading as an ink bar; a message as a bubble), as ReadPassage does. Every blank is a
 * numbered gap: earlier blanks hold their right answer on a green rim, the blank being
 * asked is a lamp-lit gap with an ink rim and a neon underline, later blanks are empty
 * dotted gaps. Gaps are inline boxes, so a whole-sentence answer wraps like the text.
 *
 * Layout. The same flexible chain as ReadPassage (see textFill.css): the heading, the keys
 * and later the feedback take the height they need, the box takes what is left and
 * scrolls inside itself, with a "▼ 還有" tag while more text is hidden below. The box's
 * scroll position is kept from one blank to the next of the same text, and the gap being
 * asked is scrolled into the box's view (never the page, never animated). In landscape the
 * text and the keys stand side by side. Keys holding a whole sentence go one per row.
 *
 * After the answer: the right key and a wrong pick are marked (ChoiceKeys), the gap fills
 * with the right answer, and the feedback shows the right answer when wrong and the
 * blank's note. After the last blank, each line's Chinese appears under it in the box.
 *
 * Number keys 1-4 pick the option at that place, as on the Fill and Talk screens.
 */

/** Where the last text box was scrolled to; read back by the next blank of the same text. */
const remembered = { id: '', lines: [] as readonly string[], top: 0 };

/** Options longer than this (in characters) do not fit half a row: the keys go one per row. */
export const WIDE_OPTION_CHARS = 16;

/** Whether the keys should stand one per row (some option is a phrase or a sentence). */
export function wideOptions(options: readonly { label: string }[]): boolean {
  return options.some((o) => o.label.length > WIDE_OPTION_CHARS);
}

/** The option a number key (1 = first shown) picks, or null for any other key. */
export function textFillKey(e: KeyboardEvent, count: number): number | null {
  if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return null;
  // Typing in the settings dialog (or any field) is not an answer.
  const target = typeof Element !== 'undefined' && e.target instanceof Element ? e.target : null;
  if (target?.closest('[role="dialog"], input, textarea, select')) return null;
  if (!/^[1-9]$/.test(e.key)) return null;
  const index = Number(e.key) - 1;
  return index < count ? index : null;
}

/**
 * An email's header line from its title: a title that names its own field ("From: Dan",
 * "Re: Price list") keeps it; any other title is the subject, as on the ReadPassage screen.
 */
export function emailHeader(title: string): { label: string; value: string } {
  const match = /^(From|To|Cc|Subject|Re|Date)\s*:\s*(\S.*)$/i.exec(title.trim());
  return match ? { label: match[1]!, value: match[2]! } : { label: 'Subject', value: title.trim() };
}

const GREETING = /^(dear|hi|hello|good (morning|afternoon|evening)|to)\b.*,$/i;
const CLOSING =
  /^(sincerely|regards|best|best regards|kind regards|warm regards|best wishes|thanks|thank you|many thanks|cheers|yours|yours truly|all the best|see you soon)[,!.]?$/i;

/** Which lines of an email are the greeting and from which line on it is the sign-off. */
export function emailShape(lines: readonly string[]): { greeting: boolean; signOff: number } {
  const greeting = lines.length > 1 && GREETING.test(lines[0]!.trim());
  let signOff = -1;
  for (let i = lines.length - 1; i > 0; i--) {
    if (CLOSING.test(lines[i]!.trim())) {
      signOff = i;
      break;
    }
  }
  return { greeting, signOff };
}

/** One numbered gap, in the state its place in the order gives it. */
function Gap({
  question,
  blank,
  answered,
}: {
  question: TextFillQuestion;
  blank: number;
  answered: boolean;
}) {
  const n = blank + 1;
  const testId = `text-fill-blank-${blank}`;
  if (blank < question.index || (blank === question.index && answered)) {
    return (
      <span class="tf-gap filled" data-testid={testId} data-state="filled">
        <span class="tf-num" aria-hidden="true">
          {n}
        </span>
        <span class="sr-only">（第 {n} 格）</span>
        {question.answers[blank]}
      </span>
    );
  }
  const now = blank === question.index;
  return (
    <span
      class={`tf-gap ${now ? 'now' : 'later'}`}
      data-testid={testId}
      data-state={now ? 'now' : 'later'}
      aria-current={now ? 'true' : undefined}
    >
      <span class="tf-num" aria-hidden="true">
        {n}
      </span>
      <span class="tf-space" aria-hidden="true" />
      <span class="sr-only">{now ? `（第 ${n} 格，現在要填）` : `（第 ${n} 格，空格）`}</span>
    </span>
  );
}

/** One line of the text with its gaps, and its Chinese under it once the text is done. */
function Line({
  question,
  parts,
  zh,
  answered,
  cls = '',
}: {
  question: TextFillQuestion;
  parts: TextFillPart[];
  zh: string | null;
  answered: boolean;
  cls?: string;
}) {
  return (
    <div class={`tf-line ${cls}`}>
      <p class="tf-en">
        {parts.map((part, j) =>
          'text' in part ? (
            <span key={j}>{part.text}</span>
          ) : (
            <Gap key={j} question={question} blank={part.blank} answered={answered} />
          ),
        )}
      </p>
      {zh !== null && (
        <p class="tf-zh" lang="zh-Hant-TW" data-testid="text-fill-zh">
          {zh}
        </p>
      )}
    </div>
  );
}

/** The text, laid out the way its kind looks in real life. */
function TextBody({ question, answered }: { question: TextFillQuestion; answered: boolean }) {
  const { passageKind: kind, title, lines } = question;
  const showZh = answered && question.index === question.total - 1;
  const parts = textFillParts(lines);
  const line = (i: number, cls = '') => (
    <Line
      key={i}
      question={question}
      parts={parts[i]!}
      zh={showZh ? (question.zh[i] ?? null) : null}
      answered={answered}
      cls={cls}
    />
  );
  const all = (cls: (i: number) => string = () => ''): ComponentChildren =>
    lines.map((_, i) => line(i, cls(i)));

  switch (kind) {
    case 'email': {
      const head = title ? emailHeader(title) : null;
      const { greeting, signOff } = emailShape(lines);
      return (
        <>
          {head && (
            <div class="tf-mailhead">
              <span class="tf-mailhead-label">{head.label}:</span> {head.value}
            </div>
          )}
          {all((i) =>
            i === 0 && greeting
              ? 'tf-greeting'
              : i === signOff
                ? 'tf-closing'
                : signOff > 0 && i > signOff
                  ? 'tf-signature'
                  : '',
          )}
        </>
      );
    }
    case 'message':
      return (
        <>
          {title && <div class="tf-sender">{title}</div>}
          <div class="tf-bubble">{all()}</div>
        </>
      );
    default:
      // notice, flyer, ad, form: a heading (an ink bar for a notice) over the lines.
      return (
        <>
          {title && <div class="tf-heading">{title}</div>}
          {all()}
        </>
      );
  }
}

export function TextFill({ question, onAnswered }: MinigameProps<TextFillQuestion>) {
  const clock = useAnswerClock();
  const [picked, setPicked] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const askRef = useRef<HTMLDivElement>(null);
  const answered = picked !== null;
  const isRight = picked === question.correctId;
  const answer = question.answers[question.index] ?? '';
  const wrongLabel = question.options.find((o) => o.id === picked && !isRight)?.label;
  const n = question.index + 1;

  const choose = (id: string) => {
    if (picked !== null) return;
    setPicked(id);
    const right = id === question.correctId;
    const result = clock.finish(question.itemId, right, right ? undefined : 'wrong-choice');
    if (result) onAnswered(result);
  };

  const measure = () => {
    const box = boxRef.current;
    if (!box) return;
    setMore(box.scrollTop + box.clientHeight < box.scrollHeight - 2);
  };

  const remember = () => {
    const box = boxRef.current;
    if (!box) return;
    remembered.id = question.textFillId;
    remembered.lines = question.lines;
    remembered.top = box.scrollTop;
  };

  const onScroll = () => {
    remember();
    measure();
  };

  /** Scrolls the box (only the box, at once) so the gap being asked is in view. */
  const showGap = () => {
    const box = boxRef.current;
    const gap = box?.querySelector<HTMLElement>(
      `[data-testid="text-fill-blank-${question.index}"]`,
    );
    if (!box || !gap) return;
    const top = gap.offsetTop;
    const bottom = top + gap.offsetHeight;
    if (top < box.scrollTop || bottom > box.scrollTop + box.clientHeight) {
      box.scrollTop = Math.max(0, top - Math.floor(box.clientHeight / 3));
    }
    remember();
    measure();
  };

  // Before the first paint: the next blank of the same text keeps the box's scroll, then
  // the gap being asked is brought into view.
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const same =
      question.index > 0 &&
      remembered.id === question.textFillId &&
      remembered.lines === question.lines;
    box.scrollTop = same ? remembered.top : 0;
    showGap();
  }, []);

  // The "more" tag follows size changes too (the font arriving, a rotation).
  useEffect(() => {
    const box = boxRef.current;
    if (!box || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    if (box.firstElementChild) observer.observe(box.firstElementChild);
    return () => observer.disconnect();
  }, []);

  // After the answer the gap holds the answer (maybe longer) and the box may have shrunk
  // for the feedback: keep the gap in view; in landscape show the feedback at the column's end.
  useLayoutEffect(() => {
    if (picked === null) return;
    const ask = askRef.current;
    if (ask && ask.scrollHeight > ask.clientHeight) ask.scrollTop = ask.scrollHeight;
    showGap();
  }, [picked]);

  // Number keys pick an option; once answered, Enter is left to the focused 繼續.
  useEffect(() => {
    if (answered) return undefined;
    const onKey = (e: KeyboardEvent) => {
      const index = textFillKey(e, question.options.length);
      const option = index === null ? undefined : question.options[index];
      if (!option) return;
      e.preventDefault();
      choose(option.id);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [answered]);

  return (
    <div class="mg text-fill tf">
      <div class="tf-head">
        <p class="mg-prompt">段落填空：選出空格 {n} 的答案</p>
        <span class="tf-count" data-testid="text-fill-count">
          {n}／{question.total}
        </span>
      </div>
      <div class="tf-layout">
        <div class="tf-frame">
          <div
            ref={boxRef}
            class={`tf-paper tf-${question.passageKind}`}
            data-testid="text-fill-text"
            role="region"
            aria-label="短文"
            tabIndex={0}
            onScroll={onScroll}
          >
            <div class="tf-text" lang="en">
              <TextBody question={question} answered={answered} />
            </div>
          </div>
          {more && (
            <span class="tf-more" aria-hidden="true">
              ▼ 還有
            </span>
          )}
        </div>
        <div class="tf-ask" ref={askRef}>
          <div class={`tf-options${wideOptions(question.options) ? ' wide' : ''}`}>
            <ChoiceKeys
              options={question.options}
              correctId={question.correctId}
              picked={picked}
              onPick={choose}
            />
          </div>
          <FeedbackSlot>
            {answered && (
              <Feedback
                correct={isRight}
                hint={wrongLabel === undefined ? undefined : `你選的「${wrongLabel}」放進去不對。`}
                answer={isRight ? undefined : answer}
                answerLabel="正確答案"
                note={question.note}
              />
            )}
          </FeedbackSlot>
        </div>
      </div>
    </div>
  );
}
