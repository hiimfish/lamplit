import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeAudioContext } from './fakeAudio';

type Module = typeof import('../src/audio/audioContext');

let created: FakeAudioContext[];
let win: EventTarget & { AudioContext?: unknown };
let doc: EventTarget & { visibilityState: string };
let mod: Module;

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(async () => {
  vi.resetModules();
  created = [];
  win = new EventTarget();
  win.AudioContext = function Ctor() {
    const ctx = new FakeAudioContext();
    ctx.state = 'suspended';
    created.push(ctx);
    return ctx;
  };
  doc = Object.assign(new EventTarget(), { visibilityState: 'visible' });
  vi.stubGlobal('window', win);
  vi.stubGlobal('document', doc);
  mod = await import('../src/audio/audioContext');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function unlocked(): FakeAudioContext {
  mod.unlockAudio();
  const ctx = created[0];
  if (!ctx) throw new Error('no context');
  return ctx;
}

describe('audio context resume', () => {
  it('unlockAudio creates one context and resumes it', () => {
    const ctx = unlocked();
    expect(ctx.resumeCalls).toBe(1);
    expect(mod.unlockAudio()).toBe(ctx);
    expect(created).toHaveLength(1);
  });

  it('resumes after an iOS interruption on the next tap or key press', () => {
    const ctx = unlocked();
    ctx.state = 'interrupted';
    const before = ctx.resumeCalls;
    win.dispatchEvent(new Event('pointerup'));
    expect(ctx.resumeCalls).toBe(before + 1);
    ctx.state = 'suspended';
    win.dispatchEvent(new Event('keydown'));
    expect(ctx.resumeCalls).toBe(before + 2);
  });

  it('does nothing on taps while the context is running', () => {
    const ctx = unlocked();
    ctx.state = 'running';
    const before = ctx.resumeCalls;
    win.dispatchEvent(new Event('pointerup'));
    win.dispatchEvent(new Event('keydown'));
    expect(ctx.resumeCalls).toBe(before);
  });

  it('tries to resume when the context changes state to suspended or interrupted', () => {
    const ctx = unlocked();
    const before = ctx.resumeCalls;
    ctx.setState('interrupted');
    expect(ctx.resumeCalls).toBe(before + 1);
    ctx.setState('running');
    expect(ctx.resumeCalls).toBe(before + 1);
  });

  it('resumes when the page becomes visible again', () => {
    const ctx = unlocked();
    ctx.state = 'suspended';
    const before = ctx.resumeCalls;
    doc.visibilityState = 'hidden';
    doc.dispatchEvent(new Event('visibilitychange'));
    expect(ctx.resumeCalls).toBe(before);
    doc.visibilityState = 'visible';
    doc.dispatchEvent(new Event('visibilitychange'));
    expect(ctx.resumeCalls).toBe(before + 1);
  });

  it('swallows resume() rejections and retries later', async () => {
    const ctx = unlocked();
    ctx.resumeResult = 'reject';
    ctx.state = 'interrupted';
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);
    win.dispatchEvent(new Event('pointerup'));
    await flush();
    process.off('unhandledRejection', unhandled);
    expect(unhandled).not.toHaveBeenCalled();
    ctx.resumeResult = 'resolve';
    win.dispatchEvent(new Event('pointerup'));
    expect(ctx.state).toBe('running');
  });

  it('never resumes a closed context', () => {
    const ctx = unlocked();
    ctx.state = 'closed';
    const before = ctx.resumeCalls;
    mod.resumeIfNeeded(ctx.asContext());
    expect(ctx.resumeCalls).toBe(before);
  });
});
