import { useState } from 'preact/hooks';
import type { ResponseMode } from '../../content/exam';
import { t } from '../../core/i18n';
import type { Question } from '../../learning/questions';
import { KeyCap } from '../KeyCap';
import { useKeys } from '../keys';
import { QuestionView } from '../minigames/QuestionView';
import { QuitKey } from '../QuitKey';
import '../flow.css';

export interface ExamReviewItem {
  qid: string;
  question: Question;
  /** The option id the player picked, or null when it was left blank. */
  picked: string | null;
}

/** The text of the picked option; falls back to the raw id for a question without options. */
export function pickedText(question: Question, picked: string | null): string {
  if (picked === null) return t('沒作答', 'No answer');
  const options = (question as { options?: readonly unknown[] }).options ?? [];
  for (const option of options) {
    const o = option as { id?: string; label?: string; text?: string; en?: string };
    if (o.id === picked) return o.label ?? o.text ?? o.en ?? picked;
  }
  return picked;
}

/**
 * 重做錯題: the wrong questions again with feedback and Chinese (QuestionView), one by one.
 * Nothing is saved: the AnswerResult is ignored (no applySessionAnswer, commitSave, coins,
 * streak or mistake log), and this file imports no save or store code.
 */
export function ExamReview({
  items,
  onDone,
  responseMode,
}: {
  items: ExamReviewItem[];
  onDone: () => void;
  /** How the exam showed its 應答題, so 重做錯題 shows them the same way. */
  responseMode: ResponseMode;
}) {
  const [index, setIndex] = useState(0);
  const item = items[index];
  const next = () => setIndex((i) => i + 1);

  // The end screen's own keys; while a question shows, QuestionView and QuitKey bind theirs.
  useKeys({ Enter: onDone, Back: onDone }, !item);

  if (!item) {
    return (
      <div class="flow" data-testid="exam-review-end">
        <div class="flow-card">
          <h1 class="flow-title">{t('錯題看完了', 'All mistakes reviewed')}</h1>
          <p>
            {t(
              '這次重做不會記進進度和金幣。',
              "This retry doesn't count toward progress or coins.",
            )}
          </p>
          <button type="button" class="pixel-button primary" onClick={onDone}>
            {t('回成績', 'Back to results')}
            <KeyCap k="Enter" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div class="flow" data-testid="exam-review">
      <div class="flow-card">
        <h1 class="flow-title">{t('重做錯題', 'Retry mistakes')}</h1>
        <QuitKey
          label={t('回成績', 'Back to results')}
          onLeave={onDone}
          testId="exam-review-quit"
        />
        <div class="flow-bar">
          <span data-testid="exam-review-progress">
            {t(`第 ${index + 1}／${items.length} 題`, `Question ${index + 1}/${items.length}`)}
          </span>
          <button
            type="button"
            class="pixel-button small"
            data-testid="exam-review-skip"
            onClick={next}
          >
            {t('跳過', 'Skip')}
          </button>
        </div>
        <p class="exam-review-picked" data-testid="exam-review-picked">
          {t('你上次選的：', 'Your answer: ')}
          {pickedText(item.question, item.picked)}
        </p>
        {/* .practice, as in a task: a passage box gives way to the feedback and 繼續, so the card does not jump. */}
        <div class="practice">
          <QuestionView
            key={item.qid}
            question={item.question}
            onAnswer={next}
            responseMode={responseMode}
          />
        </div>
      </div>
    </div>
  );
}
