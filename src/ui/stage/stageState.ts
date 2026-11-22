import type { Role, SceneLine } from '../../content/types';

/** A thought or question bubble over the speaker of the newest line. */
interface StageBubble {
  role: Role;
  act: 'want' | 'ask';
  /** Word id shown in a `want` bubble. */
  item?: string;
}

/** Something handed across the counter; it stays there until the scene ends. */
interface StageProp {
  /** The line that gave it (a stable key: the same word may be given twice). */
  lineId: string;
  item: string;
  /** Who gave it: the prop slides from their side to the other side. */
  giver: Role;
  /** True only while its line is the newest one, so it slides once. */
  sliding: boolean;
}

export interface StageView {
  /** Role of the newest line, or undefined before any line is shown. */
  speaker: Role | undefined;
  bubble: StageBubble | undefined;
  props: StageProp[];
}

/**
 * What the stage shows when the first `shown` lines of a task's scene are on
 * screen. Pure: every task starts from an empty stage, and bubbles only belong
 * to the newest line.
 */
export function stageAt(lines: readonly SceneLine[], shown: number): StageView {
  const visible = lines.slice(0, Math.max(0, shown));
  const newest = visible.at(-1);
  const cue = newest?.stage;
  const bubble: StageBubble | undefined =
    newest && cue && (cue.act === 'want' || cue.act === 'ask')
      ? { role: newest.role, act: cue.act, ...(cue.item ? { item: cue.item } : {}) }
      : undefined;
  const props: StageProp[] = [];
  visible.forEach((line, index) => {
    if (line.stage?.act === 'give' && line.stage.item) {
      props.push({
        lineId: line.id,
        item: line.stage.item,
        giver: line.role,
        sliding: index === visible.length - 1,
      });
    }
  });
  return { speaker: newest?.role, bubble, props };
}

/**
 * The stage once the story is over (during the intro cards and practice): the
 * cast standing still, everything handed over resting on the counter, no
 * bubble. It never hints at an answer.
 */
export function stageAfter(lines: readonly SceneLine[]): StageView {
  const props = stageAt(lines, lines.length).props.map((p) => ({ ...p, sliding: false }));
  return { speaker: undefined, bubble: undefined, props };
}

/** The player is on every stage, whether or not they speak in the task. */
const PLAYER: Role = 'guide';

/**
 * Which of a stage's cast stand on the stage while the first `shown` lines of a
 * task's scene are on screen: the player always; the first NPC who speaks in
 * the scene from the start; any other NPC from their first line on (they walk
 * in mid-scene, like a neighbor at the door). An NPC with no line in the task
 * is never drawn: NPCs of a unit can share a spot when alone (the landlord and
 * the neighbor both stand on the right). Keeps the order of `cast`.
 */
export function rolesOnStage(
  cast: readonly Role[],
  lines: readonly SceneLine[],
  shown: number = lines.length,
): Role[] {
  const firstNpc = lines.find((line) => line.role !== PLAYER)?.role;
  const joined = new Set(lines.slice(0, Math.max(0, shown)).map((line) => line.role));
  return cast.filter((role) => role === PLAYER || role === firstNpc || joined.has(role));
}
