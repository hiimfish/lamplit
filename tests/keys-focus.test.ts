import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { handleKey, noteFocus, notePointer } from '../src/ui/keys';

/** A stand-in for a focused element: a control (button) or not. */
class FakeElement {
  constructor(private control: boolean) {}
  /** Matches the controls selector only (not a field or a dialog). */
  closest(selector: string): FakeElement | null {
    return this.control && selector.startsWith('button') ? this : null;
  }
}

const space = (target: FakeElement) => {
  const preventDefault = vi.fn();
  handleKey({
    key: ' ',
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    isComposing: false,
    repeat: false,
    defaultPrevented: false,
    target,
    preventDefault,
  } as unknown as KeyboardEvent);
  return preventDefault;
};

describe('Space and a focused key (computer: keyboard and mouse together)', () => {
  const saved = (globalThis as { Element?: unknown }).Element;
  beforeAll(() => {
    (globalThis as { Element?: unknown }).Element = FakeElement;
  });
  afterAll(() => {
    (globalThis as { Element?: unknown }).Element = saved;
  });

  it('leaves Space to a key the player moved to with the keyboard', () => {
    const key = new FakeElement(true);
    noteFocus(key as unknown as EventTarget, 10_000);
    expect(space(key)).not.toHaveBeenCalled();
  });

  it('does not press again a key that only kept the focus after a click', () => {
    const key = new FakeElement(true);
    notePointer(20_000);
    noteFocus(key as unknown as EventTarget, 20_010);
    expect(space(key)).toHaveBeenCalled();
  });

  it('counts focus moved by code long after a click as the keyboard', () => {
    const key = new FakeElement(true);
    notePointer(30_000);
    noteFocus(key as unknown as EventTarget, 32_000);
    expect(space(key)).not.toHaveBeenCalled();
  });
});
