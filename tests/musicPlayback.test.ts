import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeAudioContext, type FakeNode } from './fakeAudio';

const fake = vi.hoisted(() => ({
  manager: null as null | { ctx: AudioContext; music: unknown },
}));

vi.mock('../src/audio/AudioManager', () => ({ getAudioManager: () => fake.manager }));
vi.mock('../src/audio/audioContext', () => ({
  getAudioContext: () => fake.manager?.ctx ?? null,
}));

type MusicModule = typeof import('../src/audio/music');

let ctx: FakeAudioContext;
let music: MusicModule;
let bus: FakeNode;

beforeEach(async () => {
  vi.useFakeTimers();
  vi.resetModules();
  ctx = new FakeAudioContext();
  ctx.currentTime = 5;
  bus = ctx.createGain();
  fake.manager = { ctx: ctx.asContext(), music: bus };
  music = await import('../src/audio/music');
});

afterEach(() => {
  music.playMusic(null);
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  fake.manager = null;
});

/** Each started chain begins with its fade gain, connected to the music bus. */
function fades(): FakeNode[] {
  return ctx.nodes('gain').filter((g) => g.connected.includes(bus));
}

/** Advances the audio clock and the scheduler timer together. */
function play(seconds: number): void {
  for (let t = 0; t < seconds; t += 0.05) {
    ctx.currentTime += 0.05;
    vi.advanceTimersByTime(50);
  }
}

describe('playMusic', () => {
  it('starts a track with a fade-in and schedules notes', () => {
    music.playMusic('town');
    const [fade] = fades();
    expect(fade?.gain.calls).toContainEqual({
      fn: 'linear',
      value: music.MIX_LEVEL,
      time: 5 + music.FADE_SECONDS,
    });
    play(2);
    expect(ctx.nodes('osc').length).toBeGreaterThan(0);
    expect(vi.getTimerCount()).toBe(1);
  });

  it('asking for the same track again is a no-op', () => {
    music.playMusic('town');
    play(1);
    const before = ctx.created.length;
    music.playMusic('town');
    expect(fades()).toHaveLength(1);
    expect(ctx.created.length).toBe(before);
    expect(vi.getTimerCount()).toBe(1);
  });

  it('switching tracks fades the old chain out and starts the new one', () => {
    music.playMusic('town');
    play(1);
    const [oldFade] = fades();
    const now = ctx.currentTime;
    music.playMusic('cafe');
    expect(fades()).toHaveLength(2);
    expect(oldFade?.gain.calls).toContainEqual({ fn: 'cancel', time: now });
    expect(oldFade?.gain.calls.at(-1)).toEqual({
      fn: 'linear',
      value: music.GAIN_FLOOR,
      time: now + music.FADE_SECONDS,
    });
    // one scheduler interval plus the pending disconnect of the old chain
    expect(vi.getTimerCount()).toBe(2);
    vi.advanceTimersByTime((music.FADE_SECONDS + 0.3) * 1000);
    expect(oldFade?.disconnected).toBe(true);
    expect(fades()[1]?.disconnected).toBe(false);
  });

  it('null fades out and stops scheduling notes', () => {
    music.playMusic('town');
    play(1);
    const [fade] = fades();
    const now = ctx.currentTime;
    music.playMusic(null);
    expect(fade?.gain.calls.at(-1)).toEqual({
      fn: 'linear',
      value: music.GAIN_FLOOR,
      time: now + music.FADE_SECONDS,
    });
    const oscillators = ctx.nodes('osc').length;
    play(5);
    expect(ctx.nodes('osc').length).toBe(oscillators);
    expect(fade?.disconnected).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not burst missed notes after the audio clock runs ahead of the timer', () => {
    music.playMusic('town');
    play(1);
    const before = ctx.nodes('osc').length;
    // Hidden tab: the timer did not fire for 20 s, the audio clock kept going.
    ctx.currentTime += 20;
    vi.advanceTimersByTime(50);
    const burst = ctx.nodes('osc').slice(before);
    // Look-ahead is 0.25 s (< one step), so at most one step of notes: a pad chord
    // (3 tones x 2 sines) plus a bell (2 partials).
    expect(burst.length).toBeLessThanOrEqual(8);
    for (const osc of burst) expect(osc.started[0]).toBeGreaterThanOrEqual(ctx.currentTime);
  });
});
