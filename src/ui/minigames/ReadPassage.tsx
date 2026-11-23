import type { ComponentChildren } from 'preact';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { settingsStore } from '../../core/settings';
import { useStore } from '../../core/store';
import type { PassageQuestionText } from '../../learning/gen/passages';
import type { PassageQuestion } from '../../learning/questions';
import './ReadPassage.css';
import { ChoiceKeys, Feedback, FeedbackSlot, useAnswerClock } from './shared';
import type { MinigameProps } from './shared';

/*
 * 讀短文 (TOEIC Part 7): a message, flyer, notice, ad, form or email of up to 80 words, and
 * one question about it with text answers. No audio.
 *
 * Layout. The text sits in a paper box that keeps the story's type size (11 logical px)
 * with a roomier line height. On a phone held upright an 80-word text, the question and
 * four options do not all fit, so the box gives way: the question, the keys and later the
 * feedback take the height they need and the box takes what is left (never less than
 * about four lines), scrolling inside itself; see ReadPassage.css. When more text is
 * hidden below, a small "▼ 還有" tag sits on the box's bottom edge; it is a label, not a
 * key, and disappears at the end of the text. A ResizeObserver keeps it right as the box
 * shrinks or grows. In landscape the text and the question stand side by side, and the
 * question column scrolls on its own only when it must.
 *
 * Several questions on one passage. QuestionView remounts this component for every
 * question, so the box's scroll position is remembered here (module state, keyed by the
 * passage) and put back before the first paint of the next question on the same passage:
 * the text does not jump back to the top. "第 1／2 題" says where the learner is.
 *
 * After the answer: the right key and a wrong pick are marked (ChoiceKeys), and the line
 * holding the answer (answerLine, found by the generator; absent when unsure) is
 * highlighted and scrolled into the box's view without animation.
 */

/** Where the last passage box was scrolled to; read back by the next question on it. */
const remembered = { passageId: '', lines: [] as readonly string[], top: 0 };

/** A form line "Label: value" (colon then a space, so 9:00 is not split), or null. */
export function formRow(line: string): { label: string; value: string } | null {
  const match = /^([^:]{1,30}):\s+(\S.*)$/.exec(line);
  return match ? { label: match[1]!.trim(), value: match[2]!.trim() } : null;
}

/** Number keys 1-4 pick an option; ignored while typing in a field or a dialog. */
function optionKey(e: KeyboardEvent, count: number): number | null {
  if (e.ctrlKey || e.metaKey || e.altKey) return null;
  const target = e.target instanceof Element ? e.target : null;
  if (target?.closest('[role="dialog"], input, textarea, select')) return null;
  const n = Number(e.key);
  return Number.isInteger(n) && n >= 1 && n <= count ? n - 1 : null;
}

function Line({ hit, children }: { hit: boolean; children: ComponentChildren }) {
  return (
    <p class={`rp-line ${hit ? 'rp-hit' : ''}`} data-hit={hit ? 'true' : undefined}>
      {children}
    </p>
  );
}

/** One text, laid out the way its kind looks in real life. */
function PassageText({ text, hit }: { text: PassageQuestionText; hit: number }) {
  const { passageKind: kind, title, lines } = text;
  const body = lines.map((line, i) => (
    <Line key={i} hit={i === hit}>
      {line}
    </Line>
  ));
  switch (kind) {
    case 'message':
      return (
        <>
          {title && <div class="rp-sender">{title}</div>}
          <div class="rp-bubble">{body}</div>
        </>
      );
    case 'email':
      return (
        <>
          {title && (
            <div class="rp-subject">
              <span class="rp-subject-label">Subject:</span> {title}
            </div>
          )}
          {body}
        </>
      );
    case 'form':
      return (
        <>
          {title && <div class="rp-heading">{title}</div>}
          {lines.map((line, i) => {
            const row = formRow(line);
            const cls = `rp-line ${row ? 'rp-row' : ''} ${i === hit ? 'rp-hit' : ''}`;
            return (
              <p key={i} class={cls} data-hit={i === hit ? 'true' : undefined}>
                {row ? (
                  <>
                    <span class="rp-label">{row.label}</span>
                    <span class="rp-value">{row.value}</span>
                  </>
                ) : (
                  line
                )}
              </p>
            );
          })}
        </>
      );
    default:
      // flyer, ad, notice: a heading (a bar for a notice) over the lines.
      return (
        <>
          {title && <div class="rp-heading">{title}</div>}
          {body}
        </>
      );
  }
}

export function ReadPassage({ question, onAnswered }: MinigameProps<PassageQuestion>) {
  const clock = useAnswerClock();
  const { showZh } = useStore(settingsStore);
  const [picked, setPicked] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const askRef = useRef<HTMLDivElement>(null);
  const isRight = picked === question.correctId;
  const answer = question.options.find((o) => o.id === question.correctId)?.label ?? '';
  const hit = picked !== null && question.answerLine !== undefined ? question.answerLine : -1;

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

  const onScroll = () => {
    const box = boxRef.current;
    if (box) {
      remembered.passageId = question.passageId;
      remembered.lines = question.lines;
      remembered.top = box.scrollTop;
    }
    measure();
  };

  // Before the first paint: the second and third questions on a passage keep its scroll.
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const same =
      question.index > 0 &&
      remembered.passageId === question.passageId &&
      remembered.lines === question.lines;
    box.scrollTop = same ? remembered.top : 0;
    if (!same) {
      remembered.passageId = question.passageId;
      remembered.lines = question.lines;
      remembered.top = 0;
    }
    measure();
  }, []);

  // The "more" tag follows size changes too (the font arriving, a rotation, 顯示中文).
  useEffect(() => {
    const box = boxRef.current;
    if (!box || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    if (box.firstElementChild) observer.observe(box.firstElementChild);
    return () => observer.disconnect();
  }, []);

  // After the answer, bring the feedback and the highlighted line into view, scrolling only
  // the question column and the box (never the page) and never animated.
  useLayoutEffect(() => {
    // In landscape the question column may scroll: show the feedback at its end.
    const ask = askRef.current;
    if (picked !== null && ask && ask.scrollHeight > ask.clientHeight) {
      ask.scrollTop = ask.scrollHeight;
    }
    const box = boxRef.current;
    const line = box?.querySelector<HTMLElement>('[data-hit="true"]');
    if (!box || !line) return;
    const top = line.offsetTop;
    const bottom = top + line.offsetHeight;
    if (top < box.scrollTop || bottom > box.scrollTop + box.clientHeight) {
      box.scrollTop = Math.max(0, top - Math.floor(box.clientHeight / 3));
      onScroll();
    }
  }, [picked, hit]);

  // Number keys pick an option; once answered, Enter is left to the focused 繼續.
  useEffect(() => {
    if (picked !== null) return undefined;
    const onKey = (e: KeyboardEvent) => {
      const n = optionKey(e, question.options.length);
      const option = n === null ? undefined : question.options[n];
      if (!option) return;
      e.preventDefault();
      choose(option.id);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [picked]);

  return (
    <div class="mg rp">
      <div class="rp-head">
        <p class="mg-prompt">讀短文，回答問題</p>
        {question.total > 1 && (
          <span class="rp-count" data-testid="passage-count">
            第 {question.index + 1}／{question.total} 題
          </span>
        )}
      </div>
      <div class="rp-layout">
        <div class="rp-frame">
          <div
            ref={boxRef}
            class={`rp-paper ${question.texts ? 'rp-set' : `rp-${question.passageKind}`}`}
            data-testid="passage"
            role="region"
            aria-label="短文"
            tabIndex={0}
            onScroll={onScroll}
          >
            <div class="rp-text" lang="en">
              {question.texts ? (
                // 兩篇／三篇一組: every text in turn, each under its number.
                question.texts.map((text, t) => (
                  <div key={t} class="rp-set-text" data-testid={`passage-text-${t}`}>
                    <p class="rp-set-label" lang="zh-Hant">
                      第 {t + 1} 篇
                    </p>
                    <PassageText text={text} hit={t === question.answerText ? hit : -1} />
                  </div>
                ))
              ) : (
                <PassageText text={question} hit={hit} />
              )}
            </div>
          </div>
          {more && (
            <span class="rp-more" aria-hidden="true">
              ▼ 還有
            </span>
          )}
        </div>
        <div class="rp-ask" ref={askRef}>
          <div class="mg-say">
            <p class="mg-sentence" data-testid="passage-question" lang="en">
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
          <FeedbackSlot>
            {picked !== null && (
              <Feedback
                correct={isRight}
                hint={hit >= 0 ? '看短文裡標出來的那一行。' : '再讀一次短文裡寫的。'}
                answer={answer}
                answerLabel="正確答案"
                note={isRight && hit >= 0 ? '答案就在短文裡標出來的那一行。' : undefined}
              />
            )}
          </FeedbackSlot>
        </div>
      </div>
    </div>
  );
}
