import { describe, expect, it, vi } from 'vitest';
import { createStore } from '../src/core/store';

describe('createStore', () => {
  it('merges patches and notifies subscribers', () => {
    const store = createStore({ a: 1, b: 'x' });
    const listener = vi.fn();
    store.subscribe(listener);
    store.set({ a: 2 });
    expect(store.get()).toEqual({ a: 2, b: 'x' });
    expect(listener).toHaveBeenCalledWith({ a: 2, b: 'x' });
  });

  it('stops notifying after unsubscribe', () => {
    const store = createStore({ a: 1 });
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    store.set({ a: 2 });
    expect(listener).not.toHaveBeenCalled();
  });
});
