/**
 * How the Chinese shows in the story and the role-play chat (docs/specs/curriculum.md):
 * 'shown' follows the saved 中文 setting (Acts 1, 2 and 4); 'peek' (Act 3) hides it until
 * the learner opens a line, or turns all of it on for the screen.
 */
export type ZhMode = 'shown' | 'peek';

/** `act` is the number from actOf(); 0 (a unit in no act) is 'shown'. */
export function zhMode(act: number): ZhMode {
  return act === 3 ? 'peek' : 'shown';
}
