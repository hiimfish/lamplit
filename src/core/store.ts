import { useEffect, useState } from 'preact/hooks';

export interface Store<T> {
  get(): T;
  set(patch: Partial<T>): void;
  subscribe(listener: (state: T) => void): () => void;
}

/** Minimal shared state that both Phaser scenes and Preact components can read. */
export function createStore<T extends object>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<(state: T) => void>();
  return {
    get: () => state,
    set(patch) {
      state = { ...state, ...patch };
      listeners.forEach((listener) => listener(state));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export function useStore<T extends object>(store: Store<T>): T {
  const [state, setState] = useState(store.get());
  useEffect(() => {
    setState(store.get());
    return store.subscribe(setState);
  }, [store]);
  return state;
}
