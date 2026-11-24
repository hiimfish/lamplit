/**
 * The 聽力加量 line loop (docs/specs/ui-flow.md): plays a line, then waits, listens
 * for 跟著說 and moves on. A plain class with injected dependencies, so tests drive
 * it with fake timers. The state names below are final; A3 fills in the rest.
 */
export type ListenLoopState =
  'idle' | 'playing' | 'gap' | 'confirm' | 'ready' | 'listening' | 'scored';

export class ListenLoop {
  state: ListenLoopState = 'idle';

  /** Listen again (ready, scored or gap), or finish speaking (listening). */
  speak(): void {}

  /** Stop everything for good without scoring (skipping to the next line, leaving the screen). */
  halt(): void {}
}
