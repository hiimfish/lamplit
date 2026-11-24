import type { ComponentChildren } from 'preact';
import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import { PICTURE_H, PICTURE_W } from '../../art/pictures';
import { textFillParts } from '../../learning/gen/textFills';
import type {
  FillQuestion,
  PassageQuestion,
  PictureQuestion,
  SignQuestion,
  TextFillQuestion,
} from '../../learning/questions';
import { useKeys } from '../keys';
import { pictureUrl } from '../minigames/PictureChoose';
import { docTabs, PassageText } from '../minigames/ReadPassage';
import { KeyBadge, choiceKeyMap } from '../minigames/shared';
import { emailHeader, emailShape, wideOptions } from '../minigames/TextFill';
import type { ExamViewProps } from './types';
import './examReading.css';

/*
 * One reading question of an exam (docs/specs/ui-flow.md, 幕結業考). It draws the text the way
 * the practice screens do (a sign, a picture, a fill sentence, a passage or a set of texts
 * with its tabs, a text with a blank) but under the exam's rules: no feedback of any kind.
 * The picked key gets a neutral boxed highlight (lamp fill, thick ink rim and a ● mark, so
 * never colour alone), the pick can be changed freely, and there is no Chinese, no hint and
 * no right/wrong colour. It never touches the save and never imports a screen that does.
 *
 * Text-fill: the view is given one question and knows nothing about the player's earlier
 * picks, so the blanks before the current one show 「（第 N 題）」 and the current one
 * 「＿＿＿」; blanks after it stay empty dotted gaps. A passage with several questions shows
 * the whole text every time; a set shows its tabs, all of them, with the texts this
 * question needs marked as in practice.
 */

interface Props<Q> {
  question: Q;
  choice: string | null;
  onChoose: (optionId: string) => void;
}

/** Keys 1-9 pick the option at that place; the picked one is marked, nothing else. */
function ExamOptions({
  options,
  choice,
  onChoose,
}: {
  options: readonly { id: string; label: string }[];
  choice: string | null;
  onChoose: (id: string) => void;
}) {
  useKeys(choiceKeyMap(options, onChoose));
  return (
    <div class="mg-options er-options">
      {options.map((option, index) => (
        <button
          type="button"
          key={option.id}
          class={`pixel-button mg-option${option.id === choice ? ' er-picked' : ''}`}
          data-testid={`option-${option.id}`}
          aria-pressed={option.id === choice}
          onClick={() => onChoose(option.id)}
        >
          {index < 9 && <KeyBadge label={String(index + 1)} />}
          <span lang="en">{option.label}</span>
        </button>
      ))}
    </div>
  );
}

function Sign({ question, choice, onChoose }: Props<SignQuestion>) {
  return (
    <div class="mg er">
      <p class="mg-prompt">看招牌，回答問題</p>
      <div class="mg-sign" data-testid="sign" lang="en">
        {question.heading && <div class="mg-sign-heading">{question.heading}</div>}
        {question.rows.map((row, i) => (
          <div class="mg-sign-row" key={i}>
            <span>{row.label}</span>
            {row.value && <span class="mg-sign-value">{row.value}</span>}
          </div>
        ))}
      </div>
      <div class="mg-say">
        <p class="mg-sentence" data-testid="sign-question" lang="en">
          {question.en}
        </p>
      </div>
      <ExamOptions options={question.options} choice={choice} onChoose={onChoose} />
    </div>
  );
}

/** The gap holds the pick (or stays empty); every option shares a cell so its width never changes. */
function FillView({ question, choice, onChoose }: Props<FillQuestion>) {
  return (
    <div class="mg fill er">
      <p class="mg-prompt">
        {question.grammar ? '文法填空：選出正確的形式' : '選出最適合放進空格的字'}
      </p>
      <div class="mg-say">
        <p class="fill-sentence" data-testid="fill-sentence" lang="en">
          {question.before}
          <span class="fill-gap" data-testid="fill-gap">
            {question.options.map((option) => (
              <span
                key={option.id}
                class={`fill-word${option.id === choice ? ' shown' : ''}`}
                aria-hidden={option.id === choice ? undefined : 'true'}
              >
                {option.label}
              </span>
            ))}
            {choice === null && <span class="sr-only">（空格）</span>}
          </span>
          {question.after}
        </p>
      </div>
      <ExamOptions options={question.options} choice={choice} onChoose={onChoose} />
    </div>
  );
}

function PictureView({ question, choice, onChoose }: Props<PictureQuestion>) {
  const url = pictureUrl(question.pictureId);
  const labelled = question.options.map((o, i) => ({
    id: o.id,
    // A listen picture's sentences are heard, not read (the listening view's job): never show them.
    label: question.listen ? `第 ${i + 1} 句` : o.en,
  }));
  useKeys(choiceKeyMap(labelled, onChoose));
  return (
    <div class="mg er">
      <p class="mg-prompt">看圖，哪一句說得對？</p>
      {url && (
        <img
          class="mg-picture"
          data-testid="picture"
          data-picture={question.pictureId}
          src={url}
          width={PICTURE_W}
          height={PICTURE_H}
          alt=""
        />
      )}
      <div class="mg-sentences">
        {labelled.map((option, index) => (
          <button
            type="button"
            key={option.id}
            class={`pixel-button mg-option${option.id === choice ? ' er-picked' : ''}`}
            data-testid={`option-${option.id}`}
            aria-pressed={option.id === choice}
            onClick={() => onChoose(option.id)}
          >
            {index < 9 && <KeyBadge label={String(index + 1)} />}
            <span class="mg-say">
              <span lang="en">{option.label}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Open text and scroll positions of the last passage, kept for the next question on it. */
const remembered = { id: '', lines: [] as readonly string[], tab: 0, tops: [] as number[] };

function PassageView({ question, choice, onChoose }: Props<PassageQuestion>) {
  const texts = question.texts;
  const [same] = useState(
    () =>
      question.index > 0 &&
      remembered.id === question.passageId &&
      remembered.lines === question.lines,
  );
  const [tab, setTab] = useState(() =>
    texts && same ? Math.min(Math.max(remembered.tab, 0), texts.length - 1) : 0,
  );
  const [more, setMore] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const shown = texts?.[tab] ?? question;
  const tabs = docTabs(question);
  const needs = texts ? (question.needs ?? []) : [];

  const measure = () => {
    const box = boxRef.current;
    if (box) setMore(box.scrollTop + box.clientHeight < box.scrollHeight - 2);
  };
  const selectTab = (t: number) => {
    remembered.tab = t;
    setTab(t);
  };
  const onScroll = () => {
    const box = boxRef.current;
    if (box) {
      remembered.id = question.passageId;
      remembered.lines = question.lines;
      remembered.tops[tab] = box.scrollTop;
    }
    measure();
  };
  useLayoutEffect(() => {
    if (same) return;
    remembered.id = question.passageId;
    remembered.lines = question.lines;
    remembered.tab = 0;
    remembered.tops = [];
  }, []);
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    box.scrollTop = remembered.tops[tab] ?? 0;
    measure();
  }, [tab]);

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

  return (
    <div class="mg rp er">
      <div class="rp-head">
        <p class="mg-prompt">{texts ? '讀文件，回答問題' : '讀短文，回答問題'}</p>
        {needs.length > 0 && (
          <span class="rp-need-note" aria-hidden="true">
            這題要看
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
                onClick={() => selectTab(t)}
              >
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
            class={`rp-paper er-box rp-${shown.passageKind}${texts ? ' rp-set' : ''}`}
            data-testid="passage"
            role={texts ? 'tabpanel' : 'region'}
            aria-label={texts ? undefined : '短文'}
            aria-labelledby={texts ? `rp-tab-${tab}` : undefined}
            tabIndex={0}
            onScroll={onScroll}
          >
            <div class="rp-text" lang="en">
              <PassageText text={shown} hit={-1} />
            </div>
          </div>
          {more && (
            <span class="rp-more" aria-hidden="true">
              ▼ 還有
            </span>
          )}
        </div>
        <div class="rp-ask">
          <div class="mg-say">
            <p class="mg-sentence" data-testid="passage-question" lang="en">
              {question.en}
            </p>
          </div>
          <ExamOptions options={question.options} choice={choice} onChoose={onChoose} />
        </div>
      </div>
    </div>
  );
}

/**
 * A blank of the text. The current one is 「＿＿＿」; earlier ones are 「（第 N 題）」 because
 * the view does not know the player's earlier picks; later ones stay empty.
 */
function Gap({ blank, current }: { blank: number; current: number }) {
  const n = blank + 1;
  const now = blank === current;
  const earlier = blank < current;
  return (
    <span
      class={`tf-gap ${now ? 'now' : 'later'}${earlier ? ' er-earlier' : ''}`}
      data-testid={`text-fill-blank-${blank}`}
      aria-current={now ? 'true' : undefined}
    >
      <span class="tf-num" aria-hidden="true">
        {n}
      </span>
      {now ? (
        <span class="er-blank">＿＿＿</span>
      ) : earlier ? (
        <span class="er-blank">（第 {n} 題）</span>
      ) : (
        <span class="tf-space" aria-hidden="true" />
      )}
      <span class="sr-only">
        {now ? `（第 ${n} 格，現在要填）` : earlier ? `（第 ${n} 題）` : `（第 ${n} 格，空格）`}
      </span>
    </span>
  );
}

function TextFillView({ question, choice, onChoose }: Props<TextFillQuestion>) {
  const { passageKind: kind, title, lines } = question;
  const [more, setMore] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const parts = textFillParts(lines);
  const n = question.index + 1;

  const measure = () => {
    const box = boxRef.current;
    if (box) setMore(box.scrollTop + box.clientHeight < box.scrollHeight - 2);
  };
  // Bring the blank being asked into the box's view (only the box, at once).
  useLayoutEffect(() => {
    const box = boxRef.current;
    const gap = box?.querySelector<HTMLElement>(
      `[data-testid="text-fill-blank-${question.index}"]`,
    );
    if (box && gap) {
      const top = gap.offsetTop;
      if (top < box.scrollTop || top + gap.offsetHeight > box.scrollTop + box.clientHeight) {
        box.scrollTop = Math.max(0, top - Math.floor(box.clientHeight / 3));
      }
    }
    measure();
  }, []);

  const line = (i: number, cls = '') => (
    <div class={`tf-line ${cls}`} key={i}>
      <p class="tf-en">
        {parts[i]!.map((part, j) =>
          'text' in part ? (
            <span key={j}>{part.text}</span>
          ) : (
            <Gap key={j} blank={part.blank} current={question.index} />
          ),
        )}
      </p>
    </div>
  );
  const all = (cls: (i: number) => string = () => ''): ComponentChildren =>
    lines.map((_, i) => line(i, cls(i)));

  let body: ComponentChildren;
  if (kind === 'email') {
    const head = title ? emailHeader(title) : null;
    const { greeting, signOff } = emailShape(lines);
    body = (
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
  } else if (kind === 'message') {
    body = (
      <>
        {title && <div class="tf-sender">{title}</div>}
        <div class="tf-bubble">{all()}</div>
      </>
    );
  } else {
    body = (
      <>
        {title && <div class="tf-heading">{title}</div>}
        {all()}
      </>
    );
  }

  return (
    <div class="mg text-fill tf er">
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
            class={`tf-paper er-box tf-${kind}`}
            data-testid="text-fill-text"
            role="region"
            aria-label="短文"
            tabIndex={0}
            onScroll={measure}
          >
            <div class="tf-text" lang="en">
              {body}
            </div>
          </div>
          {more && (
            <span class="tf-more" aria-hidden="true">
              ▼ 還有
            </span>
          )}
        </div>
        <div class="tf-ask">
          <div class={`tf-options${wideOptions(question.options) ? ' wide' : ''}`}>
            <ExamOptions options={question.options} choice={choice} onChoose={onChoose} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** One reading question of an exam: the text (sign, passage, fill) and the options. */
export function ExamReading({ item, choice, onChoose }: ExamViewProps) {
  const q = item.question;
  // Keyed by the question so every state (open tab, scroll) starts fresh with a new one.
  const key = item.qid;
  switch (q.kind) {
    case 'read-sign':
      return <Sign key={key} question={q} choice={choice} onChoose={onChoose} />;
    case 'fill':
      return <FillView key={key} question={q} choice={choice} onChoose={onChoose} />;
    case 'picture':
      return <PictureView key={key} question={q} choice={choice} onChoose={onChoose} />;
    case 'read-passage':
      return <PassageView key={key} question={q} choice={choice} onChoose={onChoose} />;
    case 'text-fill':
      return <TextFillView key={key} question={q} choice={choice} onChoose={onChoose} />;
    default:
      return null;
  }
}
