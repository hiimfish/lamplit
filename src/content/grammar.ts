/**
 * The grammar points the four Acts teach, in play order (from the syllabus tables of
 * docs/specs/act1-syllabus.md to act4-syllabus.md). Plain data: it imports nothing, so
 * scripts and the sentence generator can load it.
 */
export interface GrammarPoint {
  /** kebab-case, e.g. `present-simple`, `comparative`, `passive-past`. */
  id: string;
  /** Short Chinese name. */
  zh: string;
  /** Groups points of one kind (`passive`, `relative-clause`...). */
  group: string;
  /** The location and task where it is first taught. */
  unitId: string;
  taskId: string;
  /** One line of Chinese shown after an answer. */
  note: string;
}

export const GRAMMAR_POINTS: readonly GrammarPoint[] = [];
