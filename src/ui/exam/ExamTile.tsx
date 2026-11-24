import './exam.css';

/**
 * The last tile of an Act's place grid: its 幕結業考. A placeholder until the exam
 * is built (ExamScreen); then it opens the exam, or shows the lock.
 */
export function ExamTile({ act, no }: { act: number; no: string }) {
  return (
    <div class="place-tile soon exam-tile" data-testid={`exam-tile-${act}`}>
      第{no}幕結業考
      <span class="place-state">準備中</span>
    </div>
  );
}
