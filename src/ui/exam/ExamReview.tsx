import { useState } from 'preact/hooks';
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
  if (picked === null) return '沒作答';
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
export function ExamReview({ items, onDone }: { items: ExamReviewItem[]; onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const item = items[index];
  const next = () => setIndex((i) => i + 1);

  // The end screen's own keys; while a question shows, QuestionView and QuitKey bind theirs.
  useKeys({ Enter: onDone, Back: onDone }, !item);

  if (!item) {
    return (
      <div class="flow" data-testid="exam-review-end">
        <div class="flow-card">
          <h1 class="flow-title">錯題看完了</h1>
          <p>這次重做不會記進進度和金幣。</p>
          <button type="button" class="pixel-button primary" onClick={onDone}>
            回成績
            <KeyCap k="Enter" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div class="flow" data-testid="exam-review">
      <div class="flow-card">
        <h1 class="flow-title">重做錯題</h1>
        <QuitKey label="回成績" onLeave={onDone} testId="exam-review-quit" />
        <div class="flow-bar">
          <span data-testid="exam-review-progress">
            第 {index + 1}／{items.length} 題
          </span>
          <button
            type="button"
            class="pixel-button small"
            data-testid="exam-review-skip"
            onClick={next}
          >
            跳過
          </button>
        </div>
        <p class="exam-review-picked" data-testid="exam-review-picked">
          你上次選的：{pickedText(item.question, item.picked)}
        </p>
        <QuestionView key={item.qid} question={item.question} onAnswer={next} />
      </div>
    </div>
  );
}
