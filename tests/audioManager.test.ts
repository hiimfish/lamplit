import { describe, expect, it } from 'vitest';
import {
  AudioManager,
  DUCK_FACTOR,
  DUCK_RELEASE_DELAY,
  busVolume,
  clampVolume,
  duckTarget,
  timeConstantFor,
} from '../src/audio/AudioManager';
import { DEFAULT_SETTINGS, type Settings } from '../src/core/settings';
import { createStore } from '../src/core/store';
import { comboSemitones, pitchFor } from '../src/audio/sfx';

describe('pure helpers', () => {
  it('clamps volume', () => {
    expect(clampVolume(-1)).toBe(0);
    expect(clampVolume(2)).toBe(1);
    expect(clampVolume(0.4)).toBe(0.4);
    expect(clampVolume(NaN)).toBe(0);
  });

  it('ducks to 15%', () => {
    expect(DUCK_FACTOR).toBe(0.15);
    expect(duckTarget(0.8, true)).toBeCloseTo(0.12);
    expect(duckTarget(0.8, false)).toBe(0.8);
    expect(duckTarget(5, false)).toBe(1);
  });

  it('time constant reaches ~95% after the requested time', () => {
    const tc = timeConstantFor(0.3);
    expect(1 - Math.exp(-0.3 / tc)).toBeGreaterThan(0.94);
    expect(timeConstantFor(0)).toBeGreaterThan(0);
  });

  it('reads bus volumes from settings', () => {
    const s: Settings = { ...DEFAULT_SETTINGS, musicVolume: 0.1, voiceVolume: 0.2, sfxVolume: 3 };
    expect(busVolume(s, 'music')).toBe(0.1);
    expect(busVolume(s, 'voice')).toBe(0.2);
    expect(busVolume(s, 'sfx')).toBe(1);
  });

  it('combo pitch rises then caps at an octave', () => {
    expect(comboSemitones(0)).toBe(0);
    expect(comboSemitones(3)).toBeGreaterThan(comboSemitones(1));
    expect(comboSemitones(100)).toBe(12);
    expect(comboSemitones(-4)).toBe(0);
    expect(pitchFor(440, 12)).toBeCloseTo(880);
  });
});

interface Call {
  fn: string;
  value?: number;
  time: number;
}

function fakeContext() {
  const created: { gain: { value: number; calls: Call[] }; connected: unknown[] }[] = [];
  const ctx = {
    currentTime: 10,
    destination: {},
    createGain() {
      const calls: Call[] = [];
      const node = {
        gain: {
          value: 1,
          calls,
          cancelScheduledValues: (time: number) => calls.push({ fn: 'cancel', time }),
          setTargetAtTime: (value: number, time: number) =>
            calls.push({ fn: 'target', value, time }),
        },
        connected: [] as unknown[],
        connect(dest: unknown) {
          node.connected.push(dest);
        },
      };
      created.push(node);
      return node;
    },
  };
  return { ctx: ctx as unknown as AudioContext, created };
}

describe('AudioManager', () => {
  function setup() {
    const { ctx, created } = fakeContext();
    const store = createStore<Settings>({ ...DEFAULT_SETTINGS });
    const manager = new AudioManager(ctx, store);
    const [music, voice, sfx] = created;
    return { manager, store, music: music!, voice: voice!, sfx: sfx! };
  }

  it('creates three buses with initial volumes', () => {
    const { music, voice, sfx } = setup();
    expect(music.gain.value).toBe(DEFAULT_SETTINGS.musicVolume);
    expect(voice.gain.value).toBe(DEFAULT_SETTINGS.voiceVolume);
    expect(sfx.gain.value).toBe(DEFAULT_SETTINGS.sfxVolume);
    expect(music.connected).toHaveLength(1);
  });

  it('follows settings live', () => {
    const { store, music, sfx } = setup();
    store.set({ musicVolume: 0.2, sfxVolume: 0.9 });
    expect(music.gain.calls.at(-1)).toMatchObject({ fn: 'target', value: 0.2 });
    expect(sfx.gain.calls.at(-1)).toMatchObject({ fn: 'target', value: 0.9 });
  });

  it('ducks music while a clip plays and releases after the delay', () => {
    const { manager, music } = setup();
    manager.voiceStarted();
    expect(manager.ducked).toBe(true);
    expect(music.gain.calls.at(-1)).toMatchObject({
      fn: 'target',
      value: DEFAULT_SETTINGS.musicVolume * DUCK_FACTOR,
      time: 10,
    });
    manager.voiceEnded();
    expect(manager.ducked).toBe(false);
    expect(music.gain.calls.at(-1)).toMatchObject({
      fn: 'target',
      value: DEFAULT_SETTINGS.musicVolume,
      time: 10 + DUCK_RELEASE_DELAY,
    });
  });

  it('stays ducked until nested clips all end', () => {
    const { manager, music } = setup();
    manager.voiceStarted();
    manager.voiceStarted();
    const before = music.gain.calls.length;
    manager.voiceEnded();
    expect(manager.ducked).toBe(true);
    expect(music.gain.calls.length).toBe(before);
    manager.voiceEnded();
    expect(manager.ducked).toBe(false);
  });

  it('keeps ducking when volume changes mid-clip', () => {
    const { manager, store, music } = setup();
    manager.voiceStarted();
    store.set({ musicVolume: 0.8 });
    expect(music.gain.calls.at(-1)?.value).toBeCloseTo(0.12);
  });
});
