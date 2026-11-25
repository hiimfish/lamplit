import { playSfx } from '../../audio/sfx';
import { ACTS } from '../../content/acts';
import { EXAM_PLAN, type ExamId } from '../../content/exam';
import { actName } from '../../content/titles';
import { UNITS } from '../../content/units';
import { appStore } from '../../core/appState';
import type { SaveData } from '../../core/save';
import { devUnlockAll, settingsStore } from '../../core/settings';
import { t } from '../../core/i18n';
import { useStore } from '../../core/store';
import { isExamUnlocked } from '../../learning/exam';
import { actUnits, buildTown, progressOf } from '../../learning/townPlan';
import './exam.css';

/** The town as the exam sees it (its own copy: TownScreen imports this tile). */
export const EXAM_TOWN = buildTown(ACTS, UNITS);

/** Minutes a section takes: about 10. */
export const MINUTES_PER_SECTION = 10;

export const examIdOf = (act: number): ExamId => `exam${act}` as ExamId;

export const examMinutes = (exam: ExamId): number =>
  EXAM_PLAN[exam].sections.length * MINUTES_PER_SECTION;

/** Tasks of the Act not played yet (0 when the exam is open). */
export function tasksLeft(save: SaveData, act: number): number {
  const entry = EXAM_TOWN[act - 1];
  if (!entry) return 0;
  const { done, total } = progressOf(save, actUnits(entry));
  return Math.max(0, total - done);
}

/** 「第一幕結業考」 / "Act 1 final exam", from the Act's Chinese numeral. */
const examName = (no: string): string => t(`第${no}幕結業考`, `${actName(no)} final exam`);

/**
 * The last tile of an Act's place grid: its 幕結業考. Opens the exam screen when the Act's
 * tasks were all played; until then it shows how many are left.
 */
export function ExamTile({ act, no }: { act: number; no: string }) {
  const { save } = useStore(appStore);
  const openAll = devUnlockAll(useStore(settingsStore));
  const exam = examIdOf(act);
  const unlocked =
    act >= 1 && act <= 4 && isExamUnlocked(save, EXAM_TOWN, act as 1 | 2 | 3 | 4, openAll);
  if (!unlocked) {
    const left = tasksLeft(save, act);
    return (
      <div class="place-tile soon exam-tile" data-testid={`exam-tile-${act}`}>
        <span class="exam-tile-name">
          <span class="lock-mark" aria-hidden="true" />
          {examName(no)}
        </span>
        <span class="exam-tile-sub">
          {left > 0
            ? t(`還有 ${left} 個任務`, `${left} ${left === 1 ? 'task' : 'tasks'} left`)
            : t('準備中', 'Coming soon')}
        </span>
      </div>
    );
  }
  const attempts = save.exams[exam]?.attempts ?? 0;
  const open = () => {
    playSfx('click');
    appStore.set({ screen: 'exam', activeExam: act, result: undefined });
  };
  return (
    <button
      type="button"
      class="pixel-button place-tile exam-tile"
      onClick={open}
      data-testid={`exam-tile-${act}`}
    >
      <span class="exam-tile-name">{examName(no)}</span>
      <span class="exam-tile-sub">
        {t(
          `多益題型練習・約 ${examMinutes(exam)} 分鐘${attempts > 0 ? `・已考過 ${attempts} 次` : ''}`,
          `TOEIC-style practice・about ${examMinutes(exam)} min${attempts > 0 ? `・taken ${attempts}×` : ''}`,
        )}
      </span>
    </button>
  );
}
