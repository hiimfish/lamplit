import type { ExamSectionResult, ExamSectionRun } from './types';
import './examRunner.css';

interface Props {
  section: ExamSectionRun;
  /** Answers already given (a section is resumed whole, so usually empty). */
  onFinish: (result: ExamSectionResult) => void;
  /** Leaves the section; its answers are dropped. */
  onQuit: () => void;
}

/** Runs one section: question by question, no feedback, the countdown for reading. */
export function ExamRunner(props: Props) {
  void props;
  return null;
}
