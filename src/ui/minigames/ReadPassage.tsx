import type { ComponentChildren } from 'preact';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { settingsStore } from '../../core/settings';
import { useStore } from '../../core/store';
import type { PassageKind } from '../../content/types';
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
 *
 * 兩篇／三篇一組 (TOEIC Part 7 sets). The texts do not fit a phone at once, so a row of
 * boxed tab keys (文件 1 公告, 文件 2 郵件, ...) sits above the same paper box, which shows one
 * text at a time looking like its kind. The tabs of the texts this question needs (`needs`)
 * carry a small ink square, explained by "■ 這題要看" in the heading. Each text keeps its own
 * scroll position, and the open tab and the positions carry over to the next question on
 * the set. After the answer the box switches to the text holding the answer (`answerText`)
 * and highlights its line. In landscape the tabs sit above the text on the left; the card
 * is not wide enough for the texts side by side next to the question.
 */

/**
 * Where the last passage box was scrolled to, read back by the next question on it: the
 * open text of a set, and each text's scroll position (a single passage uses tops[0]).
 */
const remembered = { passageId: '', lines: [] as readonly string[], tab: 0, tops: [] as number[] };

/** The Chinese name of each kind of text, as the tabs of a set show it. */
export const PASSAGE_KIND_ZH: Record<PassageKind, string> = {
  message: '訊息',
  flyer: '傳單',
  notice: '公告',
  ad: '廣告',
  form: '表格',
  email: '郵件',
};

/** The tabs of a passage set: "文件 n", the kind's Chinese name, and whether this question needs it. */
export function docTabs(
  question: Pick<PassageQuestion, 'texts' | 'needs'>,
): { name: string; kindZh: string; needed: boolean }[] {
  return (question.texts ?? []).map((text, t) => ({
    name: `文件 ${t + 1}`,
    kindZh: PASSAGE_KIND_ZH[text.passageKind],
    needed: question.needs?.includes(t) ?? false,
  }));
}

/** Texts named for the feedback, in reading order: "文件 1", "文件 1 和文件 3", "文件 1、文件 2 和文件 3". */
export function docNames(indexes: readonly number[]): string {
  const names = [...new Set(indexes)].sort((a, b) => a - b).map((t) => `文件 ${t + 1}`);
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join('、')} 和${names[names.length - 1]}`;
}

/**
 * A form line "Label: value", or null. The label ends at the first colon followed by a
 * space, so a time like "6:30 p.m." stays in the label and 9:00 is never split.
 */
export function formRow(line: string): { label: string; value: string } | null {
  const match = /^((?:[^:]|:(?!\s)){1,30}):\s+(\S.*)$/.exec(line);
  return match ? { label: match[1]!.trim(), value: match[2]!.trim() } : null;
}

function Line({ hit, children }: { hit: boolean; children: ComponentChildren }) {
  return (
    <p class={`rp-line ${hit ? 'rp-hit' : ''}`} data-hit={hit ? 'true' : undefined}>
      {children}
    </p>
  );
}

/** One text, laid out the way its kind looks in real life. */
export function PassageText({ text, hit }: { text: PassageQuestionText; hit: number }) {
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
  const texts = question.texts;
  // The second and later questions on a passage keep its open text and scroll positions.
  const [same] = useState(
    () =>
      question.index > 0 &&
      remembered.passageId === question.passageId &&
      remembered.lines === question.lines,
  );
  const [tab, setTab] = useState(() =>
    texts && same ? Math.min(Math.max(remembered.tab, 0), texts.length - 1) : 0,
  );
  const [picked, setPicked] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const askRef = useRef<HTMLDivElement>(null);
  const isRight = picked === question.correctId;
  const answer = question.options.find((o) => o.id === question.correctId)?.label ?? '';
  const answerTab = texts ? question.answerText : 0;
  const hasLine = question.answerLine !== undefined && answerTab !== undefined;
  const hit = picked !== null && hasLine && tab === answerTab ? (question.answerLine ?? -1) : -1;
  const shown: PassageQuestionText = texts?.[tab] ?? question;
  const tabs = docTabs(question);
  const needs = texts ? (question.needs ?? []) : [];

  const selectTab = (t: number) => {
    remembered.tab = t;
    setTab(t);
  };

  const choose = (id: string) => {
    if (picked !== null) return;
    setPicked(id);
    // A set opens the text that holds the answer, so its line can be shown.
    if (texts && question.answerText !== undefined) selectTab(question.answerText);
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
      remembered.tops[tab] = box.scrollTop;
    }
    measure();
  };

  // Before the first paint: a new passage starts at the top of its first text.
  useLayoutEffect(() => {
    if (same) return;
    remembered.passageId = question.passageId;
    remembered.lines = question.lines;
    remembered.tab = 0;
    remembered.tops = [];
  }, []);

  // Before the paint of a text (the first one, or another tab): its own scroll position.
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    box.scrollTop = remembered.tops[tab] ?? 0;
    measure();
  }, [tab]);

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
  }, [picked, hit, tab]);

  // Number keys 1-4 pick an option (ChoiceKeys); once answered, Enter goes to 繼續.

  // The tabs: arrow keys, Home and End move between them, as in any tab row.
  const onTabKey = (e: KeyboardEvent) => {
    if (!texts) return;
    const last = texts.length - 1;
    const keys: Record<string, number> = {
      ArrowLeft: tab > 0 ? tab - 1 : last,
      ArrowRight: tab < last ? tab + 1 : 0,
      Home: 0,
      End: last,
    };
    const next = keys[e.key];
    if (next === undefined) return;
    e.preventDefault();
    selectTab(next);
    const row = e.currentTarget instanceof Element ? e.currentTarget : null;
    row?.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus();
  };

  const where = texts ? `文件 ${(question.answerText ?? 0) + 1} ` : '短文';
  const hint = hasLine
    ? `看${where}裡標出來的那一行。`
    : !texts
      ? '再讀一次短文裡寫的。'
      : needs.length > 0
        ? `再讀一次${docNames(needs)}。`
        : '再讀一次這幾篇文件。';

  return (
    <div class="mg rp">
      <div class="rp-head">
        <p class="mg-prompt">{texts ? '讀文件，回答問題' : '讀短文，回答問題'}</p>
        {needs.length > 0 && (
          <span class="rp-need-note" aria-hidden="true">
            這題要看
          </span>
        )}
        {question.total > 1 && (
          <span class="rp-count" data-testid="passage-count">
            第 {question.index + 1}／{question.total} 題
          </span>
        )}
      </div>
      <div class={`rp-layout${texts ? ' rp-layout-set' : ''}`}>
        {texts && (
          <div class="rp-tabs" role="tablist" aria-label="文件" onKeyDown={onTabKey}>
            {tabs.map((doc, t) => (
              <button
                type="button"
                key={t}
                role="tab"
                id={`rp-tab-${t}`}
                aria-selected={t === tab}
                aria-controls="rp-doc"
                tabIndex={t === tab ? 0 : -1}
                class={`pixel-button rp-tab${t === tab ? ' primary' : ''}${doc.needed ? ' rp-need' : ''}`}
                data-testid={`passage-tab-${t}`}
                data-needed={doc.needed ? 'true' : undefined}
                onClick={() => selectTab(t)}
              >
                {/* "文件 1"; landscape hides the word so the tab reads "1 表格" on one line. */}
                <span>
                  <span class="rp-tab-word">文件 </span>
                  {t + 1}
                </span>
                <span>{doc.kindZh}</span>
                {doc.needed && <span class="sr-only">，這題要看</span>}
              </button>
            ))}
          </div>
        )}
        <div class="rp-frame">
          <div
            ref={boxRef}
            id={texts ? 'rp-doc' : undefined}
            class={`rp-paper rp-${shown.passageKind}${texts ? ' rp-set' : ''}`}
            data-testid="passage"
            data-text={texts ? tab : undefined}
            role={texts ? 'tabpanel' : 'region'}
            aria-label={texts ? undefined : '短文'}
            aria-labelledby={texts ? `rp-tab-${tab}` : undefined}
            tabIndex={0}
            onScroll={onScroll}
          >
            <div class="rp-text" lang="en">
              <PassageText text={shown} hit={hit} />
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
                hint={hint}
                answer={answer}
                answerLabel="正確答案"
                note={isRight && hasLine ? `答案就在${where}裡標出來的那一行。` : undefined}
              />
            )}
          </FeedbackSlot>
        </div>
      </div>
    </div>
  );
}
