import { useEffect, useMemo, useState } from 'preact/hooks';
import { playMusic } from '../../audio/music';
import { playSfx } from '../../audio/sfx';
import { ACTS } from '../../content/acts';
import { appStore, commitSave, currentNow } from '../../core/appState';
import { useStore } from '../../core/store';
import { gradeSection, newSeed, reviewQuestions, type ExamOutcome } from '../../learning/exam';
import {
  finishSkip,
  isSkipAct,
  SKIP_PASS,
  skipNeeded,
  skipSections,
  type SkipAct,
  type SkipSummary,
} from '../../learning/skipExam';
import '../flow.css';
import { useKeys } from '../keys';
import { KeyCap } from '../KeyCap';
import { correctText } from './ExamResult';
import { ExamReview } from './ExamReview';
import { ExamRunner } from './ExamRunner';
import type { ExamAnswer } from './types';
import './exam.css';

type Phase =
  | { kind: 'intro' }
  | { kind: 'run'; index: number; outcomes: ExamOutcome[] }
  | { kind: 'result'; summary: SkipSummary; outcomes: ExamOutcome[] }
  | { kind: 'review'; summary: SkipSummary; outcomes: ExamOutcome[] };

const goTown = (act?: number) =>
  appStore.set({ screen: 'town', ...(act !== undefined ? { town: { act } } : {}) });

const actNo = (act: number): string => ACTS[act - 1]?.no ?? String(act);

/** 跳級考 (`screen === 'skip'`, the Act in `activeSkip`): intro, the sections, the result. */
export function SkipScreen() {
  const { activeSkip } = useStore(appStore);
  const act = activeSkip !== undefined && isSkipAct(activeSkip) ? activeSkip : undefined;
  useEffect(() => playMusic('town'), []);
  useEffect(() => {
    if (act === undefined) goTown();
  }, [act]);
  if (act === undefined) return null;
  return <SkipExam key={act} act={act} />;
}

function SkipExam({ act }: { act: SkipAct }) {
  const [seed, setSeed] = useState(() => newSeed(currentNow()));
  const sections = useMemo(() => skipSections(act, seed), [act, seed]);
  const [phase, setPhase] = useState<Phase>({ kind: 'intro' });
  const total = sections.reduce((n, s) => n + s.items.length, 0);

  if (phase.kind === 'run') {
    const section = sections[phase.index];
    if (!section) return null;
    const onFinish = (answers: ExamAnswer[]) => {
      const outcomes = [...phase.outcomes, gradeSection(section, answers)];
      if (phase.index + 1 < sections.length) {
        setPhase({ kind: 'run', index: phase.index + 1, outcomes });
        return;
      }
      const done = finishSkip(appStore.get().save, act, outcomes, currentNow());
      commitSave(done.save);
      setPhase({ kind: 'result', summary: done.summary, outcomes });
    };
    return (
      <ExamRunner
        key={section.id}
        section={section}
        onFinish={onFinish}
        onQuit={() => setPhase({ kind: 'intro' })}
      />
    );
  }
  if (phase.kind === 'review') {
    return (
      <ExamReview
        items={reviewQuestions(phase.outcomes)}
        onDone={() => setPhase({ ...phase, kind: 'result' })}
      />
    );
  }
  if (phase.kind === 'result') {
    return (
      <SkipResult
        act={act}
        summary={phase.summary}
        onReview={() => setPhase({ ...phase, kind: 'review' })}
        onAgain={() => {
          setSeed(newSeed(currentNow()));
          setPhase({ kind: 'intro' });
        }}
      />
    );
  }
  return (
    <SkipIntro
      act={act}
      total={total}
      sections={sections.map((s) => ({ id: s.id, title: s.title, count: s.items.length }))}
      onStart={() => {
        playSfx('click');
        setPhase({ kind: 'run', index: 0, outcomes: [] });
      }}
    />
  );
}

function SkipIntro({
  act,
  total,
  sections,
  onStart,
}: {
  act: SkipAct;
  total: number;
  sections: { id: string; title: string; count: number }[];
  onStart: () => void;
}) {
  const start = () => {
    if (total > 0) onStart();
  };
  useKeys({ Enter: start, Back: () => goTown() });
  return (
    <div class="flow" data-testid="skip-screen">
      <div class="flow-card exam">
        <h1 class="flow-title">第{actNo(act)}幕跳級考</h1>
        <p class="flow-note">
          已經有一定基礎嗎？這份是第{actNo(act)}幕結業考的精簡版，共 {total} 題。答對{' '}
          {skipNeeded(total)} 題（{Math.round(SKIP_PASS * 100)}%）以上，就直接打開第
          {actNo(act + 1)}幕。
        </p>
        <p class="flow-note" data-testid="skip-real">
          聽力照真的多益考：每題只播一次，應答題的三個回應只聽不看。
        </p>
        <p class="flow-note">
          沒考過也沒關係，可以再考。中途離開要從頭來。跳過的幕還是開著，隨時可以回去玩。
        </p>
        <ol class="exam-sections" data-testid="skip-sections">
          {sections.map((s) => (
            <li key={s.id} class="exam-section">
              <span class="exam-section-name">{s.title}</span>
              <span class="exam-section-state">{s.count} 題</span>
            </li>
          ))}
        </ol>
        <div class="flow-actions">
          <button
            type="button"
            class="pixel-button primary"
            disabled={total === 0}
            onClick={start}
            data-testid="skip-start"
          >
            開始
            <KeyCap k="Enter" />
          </button>
          <button
            type="button"
            class="pixel-button"
            onClick={() => goTown()}
            data-testid="skip-back"
          >
            回小鎮
            <KeyCap k="Back" />
          </button>
        </div>
      </div>
    </div>
  );
}

function SkipResult({
  act,
  summary,
  onReview,
  onAgain,
}: {
  act: SkipAct;
  summary: SkipSummary;
  onReview: () => void;
  onAgain: () => void;
}) {
  const { correct, total, passed } = summary;
  const wrong = total - correct;
  const short = skipNeeded(total) - correct;
  // Passed: the town opens on the next act (index `act`); else on this act (index act - 1).
  const go = () => {
    playSfx('click');
    goTown(passed ? act : act - 1);
  };
  const again = () => {
    playSfx('click');
    onAgain();
  };
  useKeys({ Enter: passed ? go : again, Back: go });
  return (
    <div class="flow" data-testid="skip-result">
      <div class="flow-card progress-card exam-result">
        <div class="progress-hero">
          <p class="flow-heading">第{actNo(act)}幕跳級考</p>
          <p class="progress-big" data-testid="skip-total">
            {correctText(correct, total)}
          </p>
        </div>
        <p class="flow-note" data-testid="skip-verdict">
          {passed
            ? `及格了！第${actNo(act + 1)}幕打開了，可以直接從那裡開始。`
            : `還差 ${short} 題才及格（要答對 ${skipNeeded(total)} 題）。可以先玩第${actNo(act)}幕，或再考一次。`}
        </p>
        <div class="flow-actions">
          {wrong > 0 && (
            <button class="pixel-button" onClick={onReview} data-testid="skip-review">
              重做錯題（{wrong}）
            </button>
          )}
          {passed ? (
            <button class="pixel-button primary" onClick={go} data-testid="skip-go">
              去第{actNo(act + 1)}幕
              <KeyCap k="Enter" />
            </button>
          ) : (
            <>
              <button class="pixel-button primary" onClick={again} data-testid="skip-again">
                再考一次
                <KeyCap k="Enter" />
              </button>
              <button class="pixel-button" onClick={go} data-testid="skip-town">
                回小鎮
                <KeyCap k="Back" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
