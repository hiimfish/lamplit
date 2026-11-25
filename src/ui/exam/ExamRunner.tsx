import { useEffect, useRef, useState } from 'preact/hooks';
import { sectionTitleEn } from '../../content/exam';
import { t } from '../../core/i18n';
import { KeyCap } from '../KeyCap';
import { QuitKey } from '../QuitKey';
import { useKeys } from '../keys';
import { ExamListening } from './ExamListening';
import { ExamReading } from './ExamReading';
import type { ExamAnswer, ExamItem, ExamSectionRun } from './types';
import './examRunner.css';

/** Plays used so far, by the key `playKey` gives. */
export type PlayCounts = Record<string, number>;

/** Questions of one conversation, talk or passage share their plays; a lone one has its own. */
export function playKey(item: ExamItem): string {
  return item.group ?? item.qid;
}

/** Plays still allowed for `item` (Infinity when the section has no limit). */
export function playsLeftFor(
  section: Pick<ExamSectionRun, 'plays'>,
  counts: PlayCounts,
  item: ExamItem,
): number {
  if (section.plays === Infinity) return Infinity;
  return Math.max(0, section.plays - (counts[playKey(item)] ?? 0));
}

/** The counts after one more play of `item`. */
export function withPlay(counts: PlayCounts, item: ExamItem): PlayCounts {
  const key = playKey(item);
  return { ...counts, [key]: (counts[key] ?? 0) + 1 };
}

/** One answer per item, in item order; an item not answered has choice null. */
export function collectAnswers(
  items: readonly ExamItem[],
  picks: Readonly<Record<string, string | null>>,
): ExamAnswer[] {
  return items.map((item) => ({ qid: item.qid, choice: picks[item.qid] ?? null }));
}

/** Seconds left on a countdown that started at `startedAt`, never below 0. */
export function secondsLeft(total: number, startedAt: number, now: number): number {
  return Math.max(0, total - Math.floor((now - startedAt) / 1000));
}

/** mm:ss */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

interface Props {
  section: ExamSectionRun;
  /** The answers in item order, one per item (choice null when left blank). */
  onFinish: (answers: ExamAnswer[]) => void;
  /** Leaves the section; its answers are dropped. */
  onQuit: () => void;
}

/** Runs one section: question by question, no feedback, no going back, the countdown for reading. */
export function ExamRunner({ section, onFinish, onQuit }: Props) {
  const { items, timer } = section;
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<Record<string, string | null>>({});
  const [counts, setCounts] = useState<PlayCounts>({});
  const [now, setNow] = useState(() => Date.now());
  const startedAt = useRef(Date.now());
  const done = useRef(false);
  const latest = useRef({ picks, onFinish });
  latest.current = { picks, onFinish };

  const sectionKey = `${section.exam}/${section.id}`;
  const lastKey = useRef(sectionKey);
  useEffect(() => {
    if (lastKey.current === sectionKey) return;
    lastKey.current = sectionKey;
    setIndex(0);
    setPicks({});
    setCounts({});
    startedAt.current = Date.now();
    done.current = false;
  }, [sectionKey]);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    latest.current.onFinish(collectAnswers(items, latest.current.picks));
  };

  const useTimer = section.kind === 'reading' && timer !== undefined;
  const left = useTimer ? secondsLeft(timer.seconds, startedAt.current, now) : null;
  useEffect(() => {
    if (!useTimer) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [useTimer, sectionKey]);
  const expired = left === 0;
  useEffect(() => {
    if (expired && timer?.hard) finish();
  }, [expired]);

  const item = items[index];
  const last = index >= items.length - 1;
  // Moving on without a pick asks once first: the first press only says so.
  const [warned, setWarned] = useState<string | null>(null);
  const unanswered = !!item && (picks[item.qid] ?? null) === null;
  const next = () => {
    if (!item) return;
    if (unanswered && warned !== item.qid) {
      setWarned(item.qid);
      return;
    }
    if (last) finish();
    else setIndex(index + 1);
  };
  // Enter (空白) is the only action here besides Back; digits, letters and the replay key
  // belong to the question's own layer, which is registered under this one.
  useKeys({ Enter: next });

  if (!item) return null;
  const view = {
    exam: section.exam,
    ...(section.responseMode ? { responseMode: section.responseMode } : {}),
    item,
    choice: picks[item.qid] ?? null,
    onChoose: (optionId: string) => setPicks((p) => ({ ...p, [item.qid]: optionId })),
    playsLeft: playsLeftFor(section, counts, item),
    onPlayed: () => setCounts((c) => withPlay(c, item)),
  };
  return (
    <div class="flow">
      <div class="flow-card exam-runner" data-testid="exam-runner">
        <div class="flow-bar exam-runner-bar">
          <span class="exam-runner-title">{t(section.title, sectionTitleEn(section.title))}</span>
          <span data-testid="exam-progress">
            {t(`第 ${index + 1}／${items.length} 題`, `Question ${index + 1}/${items.length}`)}
          </span>
          {left !== null && (
            <span class={`exam-clock${left <= 60 ? ' low' : ''}`} data-testid="exam-clock">
              {formatClock(left)}
            </span>
          )}
        </div>
        <div class="progress" aria-hidden="true">
          <div class="progress-fill" style={{ width: `${(index / items.length) * 100}%` }} />
        </div>
        {expired && !timer?.hard && (
          <p class="exam-runner-note" data-testid="exam-timeup">
            {t('時間到了，可以繼續作答', "Time's up, but you can keep answering.")}
          </p>
        )}
        <div class="exam-runner-body" key={item.qid}>
          {section.kind === 'listening' ? <ExamListening {...view} /> : <ExamReading {...view} />}
        </div>
        {unanswered && warned === item.qid && (
          <p class="exam-runner-note" role="status" data-testid="exam-skip-note">
            {t('這題還沒選答案，再按一次跳過', 'No answer yet. Press again to skip.')}
          </p>
        )}
        <div class="flow-actions exam-runner-actions">
          <QuitKey label={t('先離開', 'Leave')} onLeave={onQuit} testId="exam-quit" />
          <button type="button" class="pixel-button primary" onClick={next} data-testid="exam-next">
            {last ? t('交卷', 'Submit') : t('下一題', 'Next')}
            <KeyCap k="Enter" />
          </button>
        </div>
      </div>
    </div>
  );
}
