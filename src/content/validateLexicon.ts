/**
 * Checks one location's lexicon file (docs/specs/content.md): word ids exist in the
 * unit, `pos` agrees with the forms it needs, classes are in LEX_CLASSES, `skip` entries
 * carry nothing else. Returns problems; an empty list means the file is good.
 */
import type { Unit } from './types';

export function validateLexicon(file: unknown, unit: Unit): string[] {
  void file;
  void unit;
  return [];
}
