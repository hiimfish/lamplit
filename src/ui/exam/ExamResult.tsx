import type { ExamId } from '../../content/exam';
import type { ExamSectionResult } from './types';
import './examResult.css';

interface Props {
  exam: ExamId;
  results: ExamSectionResult[];
  onReview: () => void;
  onDone: () => void;
}

/** The score screen: estimates with their range, the wrong answers, the checkpoint comparison. */
export function ExamResult(props: Props) {
  void props;
  return null;
}
