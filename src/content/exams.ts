import { isExamId, type ExamId, type ExamSectionFile } from './exam';

/**
 * Every exam section file (`src/data/exams/<exam>.<section>.json`). Not in
 * src/data/units: buildTown would read an exam as a location.
 */
const modules = import.meta.glob<unknown>('../data/exams/*.json', {
  eager: true,
  import: 'default',
});

/** A file that names its exam and section; whether the questions are right is validateExam's job. */
function isSectionFile(value: unknown): value is ExamSectionFile {
  if (typeof value !== 'object' || value === null) return false;
  const file = value as Partial<ExamSectionFile>;
  return isExamId(file.exam) && typeof file.section === 'string' && /^s\d$/.test(file.section);
}

/** Keeps the finished, well-formed files: drafts and broken ones are skipped. */
function readyFiles(raw: Record<string, unknown>): ExamSectionFile[] {
  const files: ExamSectionFile[] = [];
  for (const [path, value] of Object.entries(raw)) {
    if (!isSectionFile(value)) {
      if (import.meta.env.DEV) console.warn(`Skipping exam file ${path}: not an exam section`);
      continue;
    }
    if (value.draft) continue;
    files.push(value);
  }
  return files.sort((a, b) =>
    a.exam === b.exam ? a.section.localeCompare(b.section) : a.exam.localeCompare(b.exam),
  );
}

export const EXAM_FILES: ExamSectionFile[] = readyFiles(modules);

/** The finished files of one exam, in section order. */
export const examFilesOf = (exam: ExamId): ExamSectionFile[] =>
  EXAM_FILES.filter((file) => file.exam === exam);

/** One section's file, or undefined while it is a draft (or an all-generated section). */
export const examFile = (exam: ExamId, section: string): ExamSectionFile | undefined =>
  EXAM_FILES.find((file) => file.exam === exam && file.section === section);
