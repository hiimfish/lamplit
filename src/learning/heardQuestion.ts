import type { Question } from './questions';

/**
 * True when the question is heard first (a clip is its cue), so 再聽一次 makes sense after a
 * miss. Questions read on screen (signs, passages, fill-ins, 排句子, 文法快練) are not:
 * their clip, if any, plays only after answering.
 */
export function isHeard(question: Question): boolean {
  switch (question.kind) {
    case 'listen-pick':
    case 'listen-pair':
    case 'choose-reply':
    case 'speak':
    case 'spell':
    case 'cloze':
    case 'respond':
    case 'talk':
      return true;
    case 'picture':
      return question.listen === true;
    default:
      return false;
  }
}
