import type { ExamItem } from './types';

/** 重做錯題: the wrong questions again with feedback and Chinese (QuestionView); writes no save. */
export function ExamReview({ items, onDone }: { items: ExamItem[]; onDone: () => void }) {
  void items;
  void onDone;
  return null;
}
