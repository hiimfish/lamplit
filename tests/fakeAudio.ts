/** A minimal fake Web Audio graph for Node tests (not a test file itself). */

interface ParamCall {
  fn: string;
  value?: number;
  time: number;
}

function fakeParam(initial = 1) {
  const calls: ParamCall[] = [];
  return {
    value: initial,
    calls,
    setValueAtTime: (value: number, time: number) => calls.push({ fn: 'set', value, time }),
    linearRampToValueAtTime: (value: number, time: number) =>
      calls.push({ fn: 'linear', value, time }),
    exponentialRampToValueAtTime: (value: number, time: number) =>
      calls.push({ fn: 'exp', value, time }),
    setTargetAtTime: (value: number, time: number) => calls.push({ fn: 'target', value, time }),
    cancelScheduledValues: (time: number) => calls.push({ fn: 'cancel', time }),
  };
}

type FakeParam = ReturnType<typeof fakeParam>;

export interface FakeNode {
  kind: string;
  connected: unknown[];
  disconnected: boolean;
  gain: FakeParam;
  frequency: FakeParam;
  detune: FakeParam;
  delayTime: FakeParam;
  type: string;
  buffer: unknown;
  onended: (() => void) | null;
  started: number[];
  stopped: number;
  connect(dest: unknown): unknown;
  disconnect(): void;
  start(when?: number): void;
  stop(): void;
}

function fakeNode(kind: string): FakeNode {
  const node: FakeNode = {
    kind,
    connected: [],
    disconnected: false,
    gain: fakeParam(),
    frequency: fakeParam(),
    detune: fakeParam(0),
    delayTime: fakeParam(0),
    type: '',
    buffer: null,
    onended: null,
    started: [],
    stopped: 0,
    connect(dest) {
      node.connected.push(dest);
      return dest;
    },
    disconnect() {
      node.disconnected = true;
    },
    start(when = 0) {
      node.started.push(when);
    },
    stop() {
      node.stopped += 1;
    },
  };
  return node;
}

export class FakeAudioContext {
  currentTime = 0;
  state: string = 'running';
  readonly destination = fakeNode('destination');
  readonly created: FakeNode[] = [];
  readonly listeners = new Map<string, (() => void)[]>();
  resumeCalls = 0;
  resumeResult: 'resolve' | 'reject' = 'resolve';
  decodeAudioData: (bytes: ArrayBuffer) => Promise<unknown> = async (bytes) => ({ bytes });

  private make(kind: string): FakeNode {
    const node = fakeNode(kind);
    this.created.push(node);
    return node;
  }

  createGain() {
    return this.make('gain');
  }
  createBiquadFilter() {
    return this.make('filter');
  }
  createDelay() {
    return this.make('delay');
  }
  createOscillator() {
    return this.make('osc');
  }
  createBufferSource() {
    return this.make('source');
  }

  resume(): Promise<void> {
    this.resumeCalls += 1;
    if (this.resumeResult === 'reject') return Promise.reject(new Error('not allowed'));
    this.state = 'running';
    return Promise.resolve();
  }

  addEventListener(type: string, fn: () => void): void {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), fn]);
  }

  /** Changes state and fires 'statechange' like a real context. */
  setState(state: string): void {
    this.state = state;
    for (const fn of this.listeners.get('statechange') ?? []) fn();
  }

  nodes(kind: string): FakeNode[] {
    return this.created.filter((n) => n.kind === kind);
  }

  asContext(): AudioContext {
    return this as unknown as AudioContext;
  }
}
