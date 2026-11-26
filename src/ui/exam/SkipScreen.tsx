import { useEffect, useMemo, useState } from 'preact/hooks';
import { playMusic } from '../../audio/music';
import { playSfx } from '../../audio/sfx';
import { ACTS } from '../../content/acts';
import { sectionTitleEn } from '../../content/exam';
import { actName } from '../../content/titles';
import { track } from '../../core/analytics';
import { appStore, commitSave, currentNow } from '../../core/appState';
import { t } from '../../core/i18n';
import { devUnlockAll, settingsStore } from '../../core/settings';
import { useStore } from '../../core/store';
import { easierSkip } from '../../learning/onboarding';
import { isActUnlocked } from '../../learning/townPlan';
import { TOWN } from '../TownScreen';
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

/** 「第一幕」 / "Act 1". */
const actLabel = (act: number): string => t(`第${actNo(act)}幕`, actName(act));

/** 「第一幕跳級考」 / "Act 1 skip test". */
const skipTitle = (act: number): string =>
  t(`第${actNo(act)}幕跳級考`, `${actName(act)} skip test`);

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
      track('skip_exam_done', { act, ...done.summary });
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
        responseMode="audio"
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
        <h1 class="flow-title">{skipTitle(act)}</h1>
        <p class="flow-note">
          {t(
            `已經有一定基礎嗎？這份是第${actNo(act)}幕結業考的精簡版，共 ${total} 題。答對 ${skipNeeded(total)} 題（${Math.round(SKIP_PASS * 100)}%）以上，就直接打開第${actNo(act + 1)}幕。`,
            `Already know some English? This is a short ${actName(act)} final exam, ${total} questions. Get ${skipNeeded(total)} (${Math.round(SKIP_PASS * 100)}%) or more right and ${actName(act + 1)} opens.`,
          )}
        </p>
        <p class="flow-note" data-testid="skip-real">
          {t(
            '聽力照真的多益考：每題只播一次，看圖題的句子和應答題的回應都只聽不看。',
            'Listening works like the real TOEIC: each question plays once, and the picture statements and responses are heard, not shown.',
          )}
        </p>
        <p class="flow-note">
          {t(
            '沒考過也沒關係，可以再考。中途離開要從頭來。跳過的幕還是開著，隨時可以回去玩。',
            "If you don't pass, you can try again. Leaving midway means starting over. Skipped acts stay open to play anytime.",
          )}
        </p>
        <ol class="exam-sections" data-testid="skip-sections">
          {sections.map((s) => (
            <li key={s.id} class="exam-section">
              <span class="exam-section-name">{t(s.title, sectionTitleEn(s.title))}</span>
              <span class="exam-section-state">
                {t(`${s.count} 題`, `${s.count} ${s.count === 1 ? 'question' : 'questions'}`)}
              </span>
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
            {t('開始', 'Start')}
            <KeyCap k="Enter" />
          </button>
          <button
            type="button"
            class="pixel-button"
            onClick={() => goTown()}
            data-testid="skip-back"
          >
            {t('回小鎮', 'Back to town')}
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
  // Not passed while this act is itself still locked (a level picked on the first visit):
  // 「先玩這一幕」 is not possible, so the test of the act before is offered instead.
  const { save } = useStore(appStore);
  const openAll = devUnlockAll(useStore(settingsStore));
  const easier = passed
    ? undefined
    : easierSkip(act, (no) => isActUnlocked(TOWN, save, no - 1, openAll));
  const tryEasier = () => {
    playSfx('click');
    appStore.set({ screen: 'skip', activeSkip: easier, result: undefined });
  };
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
          <p class="flow-heading">{skipTitle(act)}</p>
          <p class="progress-big" data-testid="skip-total">
            {correctText(correct, total)}
          </p>
        </div>
        <p class="flow-note" data-testid="skip-verdict">
          {passed
            ? t(
                `及格了！第${actNo(act + 1)}幕打開了，可以直接從那裡開始。`,
                `You passed! ${actName(act + 1)} is open; you can start there.`,
              )
            : easier
              ? t(
                  `還差 ${short} 題才及格（要答對 ${skipNeeded(total)} 題）。第${actNo(act)}幕還沒打開，可以改考簡單一級的第${actNo(easier)}幕跳級考，或再考一次。`,
                  `${short} more right to pass (${skipNeeded(total)} needed). ${actName(act)} is still locked: try the easier ${actName(easier)} skip test, or try again.`,
                )
              : t(
                  `還差 ${short} 題才及格（要答對 ${skipNeeded(total)} 題）。可以先玩第${actNo(act)}幕，或再考一次。`,
                  `${short} more right to pass (${skipNeeded(total)} needed). Play ${actName(act)} first, or try again.`,
                )}
        </p>
        <div class="flow-actions">
          {wrong > 0 && (
            <button class="pixel-button" onClick={onReview} data-testid="skip-review">
              {t(`重做錯題（${wrong}）`, `Retry mistakes (${wrong})`)}
            </button>
          )}
          {passed ? (
            <button class="pixel-button primary" onClick={go} data-testid="skip-go">
              {t(`去${actLabel(act + 1)}`, `Go to ${actLabel(act + 1)}`)}
              <KeyCap k="Enter" />
            </button>
          ) : (
            <>
              <button class="pixel-button primary" onClick={again} data-testid="skip-again">
                {t('再考一次', 'Try again')}
                <KeyCap k="Enter" />
              </button>
              {easier && (
                <button class="pixel-button" onClick={tryEasier} data-testid="skip-easier">
                  {t(`改考${actLabel(easier)}`, `Try ${actLabel(easier)}`)}
                </button>
              )}
              <button class="pixel-button" onClick={go} data-testid="skip-town">
                {t('回小鎮', 'Back to town')}
                <KeyCap k="Back" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
