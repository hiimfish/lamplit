import { useState } from 'preact/hooks';
import { playSfx } from '../../audio/sfx';
import { EXAM_PLAN, type ExamId } from '../../content/exam';
import { appStore, commitSave, currentNow } from '../../core/appState';
import { useStore } from '../../core/store';
import {
  checkpointTarget,
  examCapNote,
  examComparable,
  examVerdict,
  type Verdict,
} from '../../learning/checkpoint';
import type { ExamOutcome, ExamSummary } from '../../learning/exam';
import type { ExamEstimate } from '../../learning/examScore';
import { EXTEND_WEEKS, extendSprint, sprintWeek, sprintWeeks } from '../../learning/sprint';
import '../flow.css';
import '../goal.css';
import { useKeys } from '../keys';
import { KeyCap } from '../KeyCap';
import '../progress.css';
import './examResult.css';

/** The most total score an exam of each Act can estimate (mirrors checkpoint.ts). */
const EXAM_CAPS: Record<1 | 2 | 3 | 4, number> = { 1: 300, 2: 425, 3: 540, 4: 700 };

const ACT_NAMES = ['一', '二', '三', '四'] as const;

const VERDICT_WORDS: Record<Verdict, string> = {
  ahead: '領先',
  'on-track': '差不多',
  behind: '落後',
};

/** 「答對 12／16（75%）」. */
export const correctText = (correct: number, total: number): string =>
  `答對 ${correct}／${total}（${total > 0 ? Math.round((correct / total) * 100) : 0}%）`;

/** 「估計約 205 分（180～230），只能參考」. */
export const estimateText = (est: ExamEstimate): string =>
  `估計約 ${est.score} 分（${est.low}～${est.high}），只能參考`;

/** 「聽力約 105、閱讀約 100」. */
export const partsText = (listening: ExamEstimate, reading: ExamEstimate): string =>
  `聽力約 ${listening.score}、閱讀約 ${reading.score}`;

/** 「和第 5 週的目標 375 比：差不多」. */
export const verdictText = (verdict: Verdict, target: number, week: number): string =>
  `和第 ${week} 週的目標 ${target} 比：${VERDICT_WORDS[verdict]}`;

/** 「第一幕結業考最高只能估到 300 分」. */
export const capText = (act: 1 | 2 | 3 | 4): string =>
  `第${ACT_NAMES[act - 1]}幕結業考最高只能估到 ${EXAM_CAPS[act]} 分`;

/** The calibration line: how many TOEIC practice-test scores the estimates were adjusted by, or how to start. */
export const calibrationText = (pairs: number): string =>
  pairs > 0
    ? `已依你 ${pairs} 次多益練習題分數校正`
    : '還沒校正：輸入一次多益（TOEIC）練習題分數後會更準';

/** 「有 3 題你看過，分數可能偏高。」 */
export const retakeText = (reused: number): string => `有 ${reused} 題你看過，分數可能偏高。`;

interface Props {
  exam: ExamId;
  summary: ExamSummary;
  outcomes: ExamOutcome[];
  onReview: () => void;
  onDone: () => void;
}

/**
 * The score screen: 答對 per section and in total (big), the estimated TOEIC score with
 * its range (small, only a guide), the wrong answers, the checkpoint comparison.
 */
export function ExamResult({ exam, summary, outcomes, onReview, onDone }: Props) {
  const { save } = useStore(appStore);
  const [extended, setExtended] = useState(false);
  const plan = EXAM_PLAN[exam];
  const act = plan.act;
  const { listening, reading } = summary.shown;
  const pairs = save.exams.calibration?.pairs ?? 0;
  const total = listening.score + reading.score;
  const low = listening.low + reading.low;
  const high = listening.high + reading.high;

  const now = currentNow();
  const target = checkpointTarget(save.route, now);
  const comparable = target !== undefined && examComparable(act, target);
  const week = Math.min(sprintWeek(save.route, now), sprintWeeks(save.route));
  const verdict = comparable ? examVerdict(total, low, high, target) : undefined;
  const capNote = examCapNote(act, target, week);
  const offerExtend =
    verdict === 'behind' && !summary.retake && save.route.kind === 'sprint' && !extended;

  const wrong = outcomes.reduce((n, o) => n + (o.total - o.correct), 0);
  const titleOf = (id: string): string => plan.sections.find((s) => s.id === id)?.title ?? id;

  const extend = () => {
    playSfx('click');
    commitSave(extendSprint(appStore.get().save, currentNow()));
    setExtended(true);
  };
  const review = () => {
    playSfx('click');
    onReview();
  };
  const done = () => {
    playSfx('click');
    onDone();
  };
  useKeys({ Enter: done, Back: done });

  return (
    <div class="flow" data-testid="exam-result">
      <div class="flow-card progress-card exam-result">
        <div class="progress-hero">
          <p class="flow-heading">{plan.title}成績</p>
          <p class="progress-big" data-testid="exam-total">
            總共{correctText(summary.correct, summary.total)}
          </p>
        </div>

        <dl class="progress-stats exam-stats" data-testid="exam-sections">
          {outcomes.map((o) => (
            <div key={o.id}>
              <dt>{titleOf(o.id)}</dt>
              <dd data-testid={`exam-section-score-${o.id}`}>{correctText(o.correct, o.total)}</dd>
            </div>
          ))}
        </dl>

        <p class="flow-note exam-fine" data-testid="exam-estimate">
          {estimateText({ score: total, low, high })}
          <br />
          {partsText(listening, reading)}
        </p>
        <p class="flow-note">{calibrationText(pairs)}</p>
        <p class="flow-note" data-testid="exam-cap">
          {capText(act)}
        </p>

        {verdict && target !== undefined && (
          <p class="flow-note exam-verdict" data-testid="exam-verdict">
            {verdictText(verdict, target, week)}
          </p>
        )}
        {capNote && (
          <p class="flow-note" data-testid="exam-cap-note">
            {capNote}
          </p>
        )}

        {offerExtend && (
          <div class="goal-extend" role="group" aria-label="延長衝刺" data-testid="exam-extend">
            <p class="flow-note">
              比目標低了一些。要把衝刺延長 {EXTEND_WEEKS} 週嗎？每天的量會變少。
            </p>
            <div class="goal-extend-keys">
              <button class="pixel-button primary" onClick={extend}>
                延長 {EXTEND_WEEKS} 週
              </button>
              <button class="pixel-button" onClick={() => setExtended(true)}>
                先不用
              </button>
            </div>
          </div>
        )}

        {summary.retake && (
          <p class="flow-note" data-testid="exam-retake">
            {retakeText(summary.reused)}
          </p>
        )}
        {summary.coins > 0 && (
          <p class="flow-note" data-testid="exam-coins">
            第一次完成，獲得 {summary.coins} 金幣
          </p>
        )}

        <p class="flow-note exam-fine">遊戲不能保證官方分數；請用 ETS 官方練習題確認。</p>

        <div class="flow-actions">
          {wrong > 0 && (
            <button class="pixel-button" onClick={review} data-testid="exam-review">
              重做錯題（{wrong}）
            </button>
          )}
          <button class="pixel-button primary" onClick={done} data-testid="exam-done">
            回小鎮
            <KeyCap k="Enter" />
          </button>
        </div>
      </div>
    </div>
  );
}
