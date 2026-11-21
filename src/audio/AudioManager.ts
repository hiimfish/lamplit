/**
 * Shared Web Audio graph: three gain buses (music, voice, sfx) into the destination.
 * Bus volumes follow settingsStore live. While a voice clip plays the music bus is ducked.
 */
import { settingsStore, type Settings } from '../core/settings';
import type { Store } from '../core/store';
import { getAudioContext } from './audioContext';

export const DUCK_FACTOR = 0.15;
/** Seconds the music stays low after a clip ends before it rises again. */
export const DUCK_RELEASE_DELAY = 0.3;
/** Seconds for music to fall/rise when ducking. */
const DUCK_RAMP = 0.12;
/** Seconds for volume slider changes to settle (avoids clicks). */
const VOLUME_RAMP = 0.03;

export type BusName = 'music' | 'voice' | 'sfx';

export function clampVolume(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/** Gain a bus should have: its volume, times the duck factor while ducked. */
export function duckTarget(volume: number, ducked: boolean): number {
  const v = clampVolume(volume);
  return ducked ? v * DUCK_FACTOR : v;
}

/** setTargetAtTime reaches ~95% after 3 time constants; this converts "settles in N s". */
export function timeConstantFor(seconds: number): number {
  return Math.max(seconds, 0.001) / 3;
}

/** Volume from settings for a bus. */
export function busVolume(settings: Settings, bus: BusName): number {
  const value =
    bus === 'music'
      ? settings.musicVolume
      : bus === 'voice'
        ? settings.voiceVolume
        : settings.sfxVolume;
  return clampVolume(value);
}

export class AudioManager {
  readonly ctx: AudioContext;
  readonly music: GainNode;
  readonly voice: GainNode;
  readonly sfx: GainNode;
  private voiceClips = 0;
  private unsubscribe: () => void;

  constructor(
    ctx: AudioContext,
    private readonly store: Store<Settings> = settingsStore,
  ) {
    this.ctx = ctx;
    this.music = ctx.createGain();
    this.voice = ctx.createGain();
    this.sfx = ctx.createGain();
    for (const bus of [this.music, this.voice, this.sfx]) bus.connect(ctx.destination);
    const s = store.get();
    this.music.gain.value = duckTarget(s.musicVolume, false);
    this.voice.gain.value = busVolume(s, 'voice');
    this.sfx.gain.value = busVolume(s, 'sfx');
    this.unsubscribe = store.subscribe(() => this.applySettings());
  }

  get ducked(): boolean {
    return this.voiceClips > 0;
  }

  private applySettings(): void {
    const s = this.store.get();
    this.ramp(this.music, duckTarget(s.musicVolume, this.ducked), VOLUME_RAMP);
    this.ramp(this.voice, busVolume(s, 'voice'), VOLUME_RAMP);
    this.ramp(this.sfx, busVolume(s, 'sfx'), VOLUME_RAMP);
  }

  private ramp(node: GainNode, target: number, seconds: number, delay = 0): void {
    const now = this.ctx.currentTime;
    if (delay === 0) node.gain.cancelScheduledValues(now);
    node.gain.setTargetAtTime(target, now + delay, timeConstantFor(seconds));
  }

  /** Call when a voice clip starts. Calls may nest; music stays low until all end. */
  voiceStarted(): void {
    this.voiceClips += 1;
    this.ramp(this.music, duckTarget(this.store.get().musicVolume, true), DUCK_RAMP);
  }

  /** Call when a voice clip ends (or is cancelled). */
  voiceEnded(): void {
    this.voiceClips = Math.max(0, this.voiceClips - 1);
    if (this.voiceClips > 0) return;
    this.ramp(
      this.music,
      duckTarget(this.store.get().musicVolume, false),
      DUCK_RAMP,
      DUCK_RELEASE_DELAY,
    );
  }

  dispose(): void {
    this.unsubscribe();
  }
}

let manager: AudioManager | null = null;
let managerContext: AudioContext | null = null;

/** The shared manager, or null until unlockAudio() has created the context. */
export function getAudioManager(): AudioManager | null {
  const ctx = getAudioContext();
  if (!ctx) return null;
  if (!manager || managerContext !== ctx) {
    manager?.dispose();
    manager = new AudioManager(ctx);
    managerContext = ctx;
  }
  return manager;
}
