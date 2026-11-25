import { useEffect, useMemo, useState } from 'preact/hooks';
import { playMusic } from '../../audio/music';
import { playSfx } from '../../audio/sfx';
import {
  EXAM_PLAN,
  EXAM_PLAYS,
  READING_TIMER,
  RESPONSE_MODE,
  examAct,
  sectionHasFile,
  sectionTitleEn,
  type ExamId,
  type SectionPlan,
} from '../../content/exam';
import { examFile } from '../../content/exams';
import { appStore, commitSave, currentNow } from '../../core/appState';
import { t } from '../../core/i18n';
import type { ExamRun, SaveData } from '../../core/save';
import { devUnlockAll, settingsStore } from '../../core/settings';
import { useStore } from '../../core/store';
import { addExamCheckpoint } from '../../learning/checkpoint';
import {
  abandonRun,
  chooseForm,
  commitSection,
  finishRun,
  gradeSection,
  isExamUnlocked,
  resumeRun,
  reviewQuestions,
  sectionQuestions,
  startRun,
  type ExamOutcome,
  type ExamSummary,
} from '../../learning/exam';
import { examScore, updateCalibration } from '../../learning/examScore';
import '../flow.css';
import { useKeys } from '../keys';
import { KeyCap } from '../KeyCap';
import { ExamResult } from './ExamResult';
import { ExamReview } from './ExamReview';
import { ExamRunner } from './ExamRunner';
import { EXAM_TOWN, examIdOf, examMinutes, tasksLeft } from './ExamTile';
import type { ExamAnswer, ExamSectionRun } from './types';
import { devFallback } from '../dev/devPlay';
import './exam.css';
type Phase =
  | { kind: 'hub' }
  | { kind: 'run'; section: ExamSectionRun }
  | { kind: 'result'; summary: ExamSummary; outcomes: ExamOutcome[] }
  | { kind: 'review'; summary: ExamSummary; outcomes: ExamOutcome[] };

/** The section ready to sit, built the same way every time for one seed. */
function buildSection(
  save: SaveData,
  exam: ExamId,
  plan: SectionPlan,
  seed: number,
): ExamSectionRun {
  const file = sectionHasFile(plan) ? examFile(exam, plan.id) : undefined;
  const written = !sectionHasFile(plan) || file !== undefined;
  const items = written
    ? sectionQuestions(file, seed, {
        section: plan.id,
        form: chooseForm(save, exam),
        seen: save.exams[exam]?.seen,
      })
    : [];
  return {
    exam,
    id: plan.id,
    kind: plan.kind,
    title: plan.title,
    items,
    plays: EXAM_PLAYS[exam],
    ...(plan.kind === 'reading' ? { timer: READING_TIMER[exam] } : {}),
  };
}

const goTown = () => appStore.set({ screen: 'town' });

/** Grades every section of the run and closes the sitting. */
function finishAll(exam: ExamId): { summary: ExamSummary; outcomes: ExamOutcome[] } | undefined {
  const save = appStore.get().save;
  const run = save.examRun;
  if (!run || run.exam !== exam) return undefined;
  const outcomes = EXAM_PLAN[exam].sections.map((plan) =>
    gradeSection(buildSection(save, exam, plan, run.seed), run.answers),
  );
  const done = finishRun(save, exam, outcomes, currentNow(), {
    score: examScore,
    addCheckpoint: addExamCheckpoint,
    updateCalibration,
  });
  commitSave(done.save);
  return { summary: done.summary, outcomes };
}

/** The hub: the sections of the exam, where to start or go on, and the way back. */
function ExamHub({
  exam,
  onRun,
  onFinished,
}: {
  exam: ExamId;
  onRun: (section: ExamSectionRun) => void;
  onFinished: (done: { summary: ExamSummary; outcomes: ExamOutcome[] }) => void;
}) {
  const { save } = useStore(appStore);
  const openAll = devUnlockAll(useStore(settingsStore));
  const [armed, setArmed] = useState(false);
  const act = examAct(exam);
  const plan = EXAM_PLAN[exam];
  const run: ExamRun | undefined = resumeRun(save, exam, currentNow());
  // 開發測試 opens any act's 結業考, played or not.
  const unlocked = isExamUnlocked(save, EXAM_TOWN, act, openAll) || devFallback();
  const seed = run?.seed ?? 1;
  const attempts = save.exams[exam]?.attempts ?? 0;
  const sections = useMemo(
    () => plan.sections.map((p) => buildSection(save, exam, p, seed)),
    // The questions depend on the seed and the form, which only change with these.
    [exam, seed, attempts],
  );
  const ready = (s: ExamSectionRun) => s.items.length > 0;
  const doneIds = run?.done ?? [];
  const next = sections.find((s) => !doneIds.includes(s.id));
  const allDone = run !== undefined && next === undefined;
  const canStart = unlocked && (allDone || (next !== undefined && ready(next)));

  const start = () => {
    if (!canStart) return;
    playSfx('click');
    if (allDone) {
      const done = finishAll(exam);
      if (done) onFinished(done);
      return;
    }
    if (!next) return;
    if (!run) commitSave(startRun(appStore.get().save, exam, currentNow()));
    const latest = appStore.get().save.examRun;
    // A new run has its own seed: build the section again from it.
    const built =
      latest && !run
        ? buildSection(
            appStore.get().save,
            exam,
            plan.sections.find((p) => p.id === next.id) ?? plan.sections[0]!,
            latest.seed,
          )
        : next;
    onRun(built);
  };
  const restart = () => {
    playSfx('click');
    if (!armed) {
      setArmed(true);
      return;
    }
    setArmed(false);
    commitSave(abandonRun(appStore.get().save));
  };
  useKeys({
    Enter: start,
    Back: () => (armed ? setArmed(false) : goTown()),
  });

  const record = save.exams[exam];
  const mixed = chooseForm(save, exam) === 'mixed';
  const left = tasksLeft(save, act);
  const label = allDone
    ? t('看成績', 'See results')
    : run && doneIds.length > 0
      ? t('繼續', 'Continue')
      : t('開始', 'Start');

  return (
    <div class="flow" data-testid="exam-screen">
      <div class="flow-card exam">
        <h1 class="flow-title">{t(plan.title, plan.titleEn)}</h1>
        {!unlocked ? (
          <p class="flow-note" data-testid="exam-locked">
            {t(
              `這一幕的任務都玩過以後才能考。還有 ${left} 個任務。`,
              `Play every task in this act first. ${left} ${left === 1 ? 'task' : 'tasks'} left.`,
            )}
          </p>
        ) : (
          <>
            <p class="flow-note">
              {t(
                `多益題型練習，約 ${examMinutes(exam)} 分鐘，分成 ${plan.sections.length} 段。每段考完才算數，中途離開只會丟掉那一段。`,
                `TOEIC-style practice, about ${examMinutes(exam)} minutes in ${plan.sections.length} parts. A part counts once it's finished; leaving midway only loses that part.`,
              )}
            </p>
            {record && (
              <p class="flow-note" data-testid="exam-record">
                {t(
                  `已考過 ${record.attempts} 次，最近一次估計 聽力 ${record.listening}／閱讀 ${record.reading}`,
                  `Taken ${record.attempts} ${record.attempts === 1 ? 'time' : 'times'}. Last estimate: listening ${record.listening}, reading ${record.reading}`,
                )}
              </p>
            )}
            {mixed && (
              <p class="flow-note" data-testid="exam-retake-note">
                {t(
                  '有一部分題目和上次相同，分數可能偏高。',
                  'Some questions are the same as last time, so the score may be high.',
                )}
              </p>
            )}
            <ol class="exam-sections" data-testid="exam-sections">
              {sections.map((s) => {
                const finished = doneIds.includes(s.id);
                const isNext = !finished && next?.id === s.id;
                const state = finished
                  ? t('已完成', 'Done')
                  : ready(s)
                    ? t('未考', 'Not taken')
                    : t('準備中', 'Coming soon');
                return (
                  <li
                    key={s.id}
                    class={`exam-section${finished ? ' done' : ''}${isNext ? ' next' : ''}`}
                    data-testid={`exam-section-${s.id}`}
                  >
                    <span class="exam-section-name">{t(s.title, sectionTitleEn(s.title))}</span>
                    <span class="exam-section-info">
                      {ready(s)
                        ? t(
                            `${s.items.length} 題・約 10 分鐘`,
                            `${s.items.length} questions・about 10 min`,
                          )
                        : t('題目還沒備好', 'Questions not ready yet')}
                    </span>
                    <span class="exam-section-state">
                      {finished && <span aria-hidden="true">✓ </span>}
                      {state}
                    </span>
                  </li>
                );
              })}
            </ol>
          </>
        )}
        <div class="flow-actions">
          {unlocked && (
            <button
              type="button"
              class="pixel-button primary"
              disabled={!canStart}
              onClick={start}
              data-testid="exam-start"
            >
              {label}
              <KeyCap k="Enter" />
            </button>
          )}
          {unlocked && run && doneIds.length > 0 && (
            <button
              type="button"
              class={`pixel-button${armed ? ' primary' : ''}`}
              onClick={restart}
              data-testid="exam-restart"
            >
              {armed ? t('確定重新開始？', 'Really start over?') : t('重新開始', 'Start over')}
            </button>
          )}
          <button type="button" class="pixel-button" onClick={goTown} data-testid="exam-back">
            {t('回小鎮', 'Back to town')}
            <KeyCap k="Back" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** 幕結業考 (`screen === 'exam'`, the Act in `activeExam`): hub, the sections, the result. */
export function ExamScreen() {
  const { activeExam } = useStore(appStore);
  const [phase, setPhase] = useState<Phase>({ kind: 'hub' });
  useEffect(() => playMusic('town'), []);
  const valid = activeExam !== undefined && activeExam >= 1 && activeExam <= 4;
  useEffect(() => {
    if (!valid) goTown();
  }, [valid]);
  if (!valid || activeExam === undefined) return null;
  const exam = examIdOf(activeExam);
  const hub = () => setPhase({ kind: 'hub' });

  if (phase.kind === 'run') {
    const section = phase.section;
    const onFinish = (answers: ExamAnswer[]) => {
      commitSave(commitSection(appStore.get().save, section.id, answers));
      const run = appStore.get().save.examRun;
      const all = EXAM_PLAN[exam].sections.every((p) => run?.done.includes(p.id));
      if (!all) return hub();
      const done = finishAll(exam);
      setPhase(done ? { kind: 'result', ...done } : { kind: 'hub' });
    };
    return <ExamRunner key={section.id} section={section} onFinish={onFinish} onQuit={hub} />;
  }
  if (phase.kind === 'result') {
    return (
      <ExamResult
        exam={exam}
        summary={phase.summary}
        outcomes={phase.outcomes}
        onReview={() => setPhase({ ...phase, kind: 'review' })}
        onDone={() => {
          hub();
          goTown();
        }}
      />
    );
  }
  if (phase.kind === 'review') {
    return (
      <ExamReview
        items={reviewQuestions(phase.outcomes)}
        onDone={() => setPhase({ ...phase, kind: 'result' })}
        responseMode={RESPONSE_MODE[exam]}
      />
    );
  }
  return (
    <ExamHub
      exam={exam}
      onRun={(section) => setPhase({ kind: 'run', section })}
      onFinished={(done) => setPhase({ kind: 'result', ...done })}
    />
  );
}
