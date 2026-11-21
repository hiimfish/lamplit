/**
 * Background music, synthesised with Web Audio (original, no audio files).
 * Two very quiet, slow tracks of sparse bell/celesta notes over a soft pad, with
 * a generated feedback-delay tail. Note data and level maths are pure and exported
 * for tests; playback uses a look-ahead scheduler driven by the audio clock.
 */
import { getAudioContext } from './audioContext';
import { getAudioManager } from './AudioManager';

export type Track = 'town' | 'cafe';

/** Eighth notes, 4/4: one bar = 8 steps. */
export const STEPS_PER_BAR = 8;
export const FADE_SECONDS = 1.5;
export const LOOKAHEAD_SECONDS = 0.25;
export const TICK_MS = 50;

export type VoiceKind = 'bell' | 'pad';

export interface NoteEvent {
  /** Step within the loop (0-based, eighth notes). */
  step: number;
  midi: number;
  /** Length in steps (bells ring on past this; pads are held this long). */
  length: number;
  voice: VoiceKind;
}

export interface BarSpec {
  /** Pad tones, e.g. 'C3 G3 E4'. */
  chord: string;
  /** Bell notes as 'NOTE:steps' tokens; '-' is a rest. */
  melody: string;
}

export interface TrackSpec {
  bpm: number;
  /** Pentatonic pitch classes (0-11) every note must belong to. */
  scale: readonly number[];
  bars: BarSpec[];
}

const NOTE_OFFSETS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** 'C4' = 60, 'F#3', 'Bb3'. Throws on bad input (data is static, tests catch typos). */
export function noteToMidi(name: string): number {
  const match = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!match) throw new Error(`bad note name: ${name}`);
  const [, letter = '', accidental = '', octave = '0'] = match;
  const base = NOTE_OFFSETS[letter] ?? 0;
  const shift = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0;
  return (Number(octave) + 1) * 12 + base + shift;
}

export function midiToFreq(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

export interface MelodyNote {
  start: number;
  length: number;
  /** null = rest. */
  midi: number | null;
}

export function parseMelody(text: string): MelodyNote[] {
  const notes: MelodyNote[] = [];
  let start = 0;
  for (const token of text.trim().split(/\s+/)) {
    if (!token) continue;
    const [name = '', len = ''] = token.split(':');
    const length = Number(len);
    if (!Number.isInteger(length) || length <= 0) throw new Error(`bad token: ${token}`);
    notes.push({ start, length, midi: name === '-' ? null : noteToMidi(name) });
    start += length;
  }
  return notes;
}

/** Total steps used by a melody string. */
export function melodySteps(text: string): number {
  return parseMelody(text).reduce((sum, n) => sum + n.length, 0);
}

/* ---------- track data ---------- */

const C_PENTATONIC = [0, 2, 4, 7, 9] as const;
const G_PENTATONIC = [7, 9, 11, 2, 4] as const;

const TC = 'C3 G3 E4';
const TAM = 'A2 E3 C4';
const TG = 'G2 D3 A3';
const TEM = 'E3 G3 D4';
const townChords = [TC, TC, TAM, TAM, TG, TG, TEM, TC];

const townMelody = [
  'E5:2 -:1 G5:1 C6:3 -:1',
  '-:2 D6:1 A5:2 G5:3',
  'E5:1 G5:1 A5:3 -:1 E5:2',
  'D5:3 -:2 G5:1 E5:2',
  'C5:1 E5:1 G5:2 -:1 C6:3',
  'A5:2 G5:1 -:1 E5:4',
  '-:3 G5:1 A5:1 D6:3',
  'C6:4 -:2 G5:2',
  'G4:1 C5:1 E5:3 -:1 G5:2',
  'A5:3 E5:1 -:2 D5:2',
  'E6:2 D6:1 C6:1 -:2 A5:2',
  'G5:5 -:3',
  'C5:2 -:1 D5:1 E5:2 G5:2',
  '-:2 A5:2 C6:1 -:1 E6:2',
  'D6:3 C6:1 A5:2 -:2',
  'G5:2 E5:2 -:2 C5:2',
  'E5:1 -:1 G5:1 A5:1 C6:4',
  '-:4 D6:2 A5:2',
  'G5:3 E5:1 D5:2 -:2',
  'A4:2 C5:2 -:1 E5:3',
  'G5:1 A5:1 C6:2 -:2 D6:2',
  'E6:3 -:1 C6:2 A5:2',
  'G5:2 -:2 E5:2 D5:2',
  'C5:6 -:2',
];

const CG = 'G2 D3 B3';
const CEM = 'E3 B3 G4';
const CA = 'A2 E3 B3';
const CD = 'D3 A3 E4';
const cafeChords = [CG, CG, CEM, CEM, CA, CA, CD, CG];

const cafeMelody = [
  'B4:3 -:5',
  '-:2 D5:2 G5:4',
  'E5:2 -:3 D5:1 B4:2',
  'A4:4 -:4',
  'G4:1 B4:2 -:2 E5:3',
  '-:3 D5:2 A5:3',
  'G5:3 -:1 E5:2 -:2',
  'D5:5 -:3',
  'B4:2 D5:1 E5:3 -:2',
  '-:4 G5:2 E5:2',
  'A5:3 -:2 B5:1 -:2',
  'G5:2 -:2 D5:4',
  'E5:1 G5:2 -:3 B4:2',
  '-:2 A4:3 -:3',
  'D5:2 B4:2 G4:4',
  'G4:6 -:2',
];

function makeBars(chords: string[], melodies: string[]): BarSpec[] {
  return melodies.map((melody, i) => ({ chord: chords[i % chords.length] ?? TC, melody }));
}

/** Town: C major pentatonic, 66 bpm, 24 bars (about 87 s). Brighter, a bit more sparkle. */
export const TOWN: TrackSpec = {
  bpm: 66,
  scale: C_PENTATONIC,
  bars: makeBars(townChords, townMelody),
};

/** Cafe: G major pentatonic, 60 bpm, 16 bars (64 s). Lower, softer, fewer notes. */
export const CAFE: TrackSpec = {
  bpm: 60,
  scale: G_PENTATONIC,
  bars: makeBars(cafeChords, cafeMelody),
};

export const TRACKS: Record<Track, TrackSpec> = { town: TOWN, cafe: CAFE };

export function loopSteps(spec: TrackSpec): number {
  return spec.bars.length * STEPS_PER_BAR;
}

export function stepSeconds(bpm: number): number {
  return 60 / bpm / 2;
}

export function loopSeconds(spec: TrackSpec): number {
  return loopSteps(spec) * stepSeconds(spec.bpm);
}

/** Expands a track into note events for one loop (bells from the melody, pad from the chord). */
export function buildEvents(track: Track): NoteEvent[] {
  const events: NoteEvent[] = [];
  TRACKS[track].bars.forEach((bar, barIndex) => {
    const base = barIndex * STEPS_PER_BAR;
    for (const note of parseMelody(bar.melody)) {
      if (note.midi !== null) {
        events.push({
          step: base + note.start,
          midi: note.midi,
          length: note.length,
          voice: 'bell',
        });
      }
    }
    for (const name of bar.chord.split(/\s+/)) {
      events.push({ step: base, midi: noteToMidi(name), length: STEPS_PER_BAR, voice: 'pad' });
    }
  });
  return events.sort((a, b) => a.step - b.step);
}

/** Events grouped by step, so the scheduler can look them up in O(1). */
export function eventsByStep(track: Track): NoteEvent[][] {
  const table: NoteEvent[][] = Array.from({ length: loopSteps(TRACKS[track]) }, () => []);
  for (const event of buildEvents(track)) table[event.step]?.push(event);
  return table;
}

/** Deterministic per-note loudness in [0.7, 1] so repeated notes are not identical. */
export function velocity(step: number, midi: number): number {
  const h = Math.sin(step * 12.9898 + midi * 78.233) * 43758.5453;
  return 0.7 + 0.3 * (h - Math.floor(h));
}

/* ---------- levels (pure, tested) ---------- */

export interface VoiceLevels {
  /** Peak gain of the fundamental, before velocity. */
  gain: number;
  /** Frequency ratio of the quiet glassy partial. */
  partialRatio: number;
  /** Partial gain relative to the fundamental. */
  partialGain: number;
  attack: number;
  /** Seconds for the bell to fall exponentially from peak to the floor. */
  decay: number;
}

export const GAIN_FLOOR = 0.0001;
/** Pad: gain of each of its two detuned sines, swell and release in seconds. */
export const PAD_GAIN = 0.0045;
export const PAD_ATTACK = 1.4;
export const PAD_RELEASE = 1.6;
/** Make-up gain of the music mix. Voices are kept tiny and sparse; measured offline this lands about 12 dB (RMS) below the previous tracks. */
export const MIX_LEVEL = 2;
/** No sum of simultaneous voices may exceed this (linear, before MIX_LEVEL). */
export const HEADROOM_CAP = 0.1;
/** Per-note ceiling, including the partial. */
export const NOTE_CAP = 0.04;
export const MASTER_LOWPASS_HZ = 7000;

export const BELL: Record<Track, VoiceLevels> = {
  town: { gain: 0.026, partialRatio: 2.76, partialGain: 0.22, attack: 0.004, decay: 2.2 },
  cafe: { gain: 0.02, partialRatio: 2, partialGain: 0.12, attack: 0.008, decay: 2.8 },
};

/** Amplitude of one bell (fundamental plus partial) t seconds after its onset at velocity 1. */
export function bellAmplitude(track: Track, t: number): number {
  const b = BELL[track];
  if (t < 0 || t >= b.decay) return 0;
  return b.gain * (1 + b.partialGain) * (GAIN_FLOOR / b.gain) ** (t / b.decay);
}

/**
 * Worst-case summed amplitude of all voices at any note onset, including tails that
 * wrap around the loop seam. Conservative: pads count at full level for their whole
 * length plus release, bells follow their decay curve at velocity 1.
 */
export function worstCasePeak(track: Track): number {
  const spec = TRACKS[track];
  const stepSec = stepSeconds(spec.bpm);
  const loop = loopSeconds(spec);
  const events = buildEvents(track);
  let worst = 0;
  for (const probe of events) {
    const t = probe.step * stepSec;
    let sum = 0;
    for (const e of events) {
      for (const shift of [-loop, 0]) {
        const start = e.step * stepSec + shift;
        if (start > t) continue;
        if (e.voice === 'bell') sum += bellAmplitude(track, t - start);
        else if (t - start < e.length * stepSec + PAD_RELEASE) sum += PAD_GAIN * 2;
      }
    }
    worst = Math.max(worst, sum);
  }
  return worst;
}

/* ---------- playback ---------- */

interface Running {
  track: Track;
  fade: GainNode;
  nodes: AudioNode[];
  timer: ReturnType<typeof setInterval>;
}

interface Bus {
  dry: AudioNode;
  pad: AudioNode;
}

let running: Running | null = null;
let wanted: Track | null = null;
let unlockListenerAttached = false;

export function playBell(
  ctx: AudioContext,
  bus: Bus,
  track: Track,
  event: NoteEvent,
  when: number,
): void {
  const b = BELL[track];
  const peak = Math.min(b.gain * velocity(event.step, event.midi), NOTE_CAP);
  const freq = midiToFreq(event.midi);
  const end = when + b.decay;
  const env = ctx.createGain();
  env.gain.setValueAtTime(GAIN_FLOOR, when);
  env.gain.linearRampToValueAtTime(peak, when + b.attack);
  env.gain.exponentialRampToValueAtTime(GAIN_FLOOR, end);
  env.connect(bus.dry);
  const partials: [number, number][] = [
    [1, 1],
    [b.partialRatio, b.partialGain],
  ];
  for (const [ratio, level] of partials) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq * ratio;
    const g = ctx.createGain();
    g.gain.value = level;
    osc.connect(g).connect(env);
    osc.start(when);
    osc.stop(end + 0.05);
  }
}

export function playPad(
  ctx: AudioContext,
  bus: Bus,
  event: NoteEvent,
  when: number,
  stepSec: number,
) {
  const hold = event.length * stepSec;
  const end = when + hold + PAD_RELEASE;
  const env = ctx.createGain();
  env.gain.setValueAtTime(GAIN_FLOOR, when);
  env.gain.linearRampToValueAtTime(PAD_GAIN, when + PAD_ATTACK);
  env.gain.setValueAtTime(PAD_GAIN, Math.max(when + PAD_ATTACK, when + hold));
  env.gain.linearRampToValueAtTime(GAIN_FLOOR, end);
  env.connect(bus.pad);
  for (const cents of [-5, 5]) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = midiToFreq(event.midi);
    osc.detune.value = cents;
    osc.connect(env);
    osc.start(when);
    osc.stop(end + 0.05);
  }
}

/**
 * Output chain: voices -> master low-pass -> fade -> music bus, plus two quiet
 * feedback delays (low-passed in the feedback path) as a cheap reverb-like tail.
 */
export function buildChain(ctx: AudioContext, track: Track, dest: AudioNode) {
  const fade = ctx.createGain();
  fade.gain.setValueAtTime(GAIN_FLOOR, ctx.currentTime);
  fade.gain.linearRampToValueAtTime(MIX_LEVEL, ctx.currentTime + FADE_SECONDS);
  fade.connect(dest);

  const master = ctx.createBiquadFilter();
  master.type = 'lowpass';
  master.frequency.value = MASTER_LOWPASS_HZ;
  master.connect(fade);

  const dry = ctx.createGain();
  dry.connect(master);
  const padLow = ctx.createBiquadFilter();
  padLow.type = 'lowpass';
  padLow.frequency.value = 1200;
  padLow.connect(master);

  const nodes: AudioNode[] = [fade, master, dry, padLow];
  const wet = track === 'town' ? 0.38 : 0.45;
  for (const [time, feedback] of [
    [0.37, 0.4],
    [0.61, 0.35],
  ] as const) {
    const delay = ctx.createDelay(1);
    delay.delayTime.value = time;
    const loop = ctx.createBiquadFilter();
    loop.type = 'lowpass';
    loop.frequency.value = 2600;
    const fb = ctx.createGain();
    fb.gain.value = feedback;
    const send = ctx.createGain();
    send.gain.value = wet;
    dry.connect(send).connect(delay);
    delay.connect(loop).connect(fb).connect(delay);
    loop.connect(master);
    nodes.push(delay, loop, fb, send);
  }
  return { bus: { dry, pad: padLow } as Bus, fade, nodes };
}

export interface StepScheduler {
  /** Schedules every step due before clock() + LOOKAHEAD_SECONDS. Call on a timer. */
  tick(): void;
  /** Next step index to schedule and its start time on the audio clock. */
  readonly step: number;
  readonly nextTime: number;
}

/**
 * Look-ahead step scheduler driven by an audio clock (injectable for tests).
 * When the clock has run past the next step (throttled timers in a hidden tab, a
 * long main-thread block), the missed steps are skipped rather than all played at
 * once in the past, which would stack many notes into one loud cluster.
 */
export function createStepScheduler(
  clock: () => number,
  stepSec: number,
  totalSteps: number,
  onStep: (step: number, when: number) => void,
  startTime = clock() + 0.1,
): StepScheduler {
  let step = 0;
  let nextTime = startTime;
  return {
    tick() {
      const now = clock();
      if (nextTime < now) {
        const missed = Math.floor((now - nextTime) / stepSec) + 1;
        step = (step + missed) % totalSteps;
        nextTime += missed * stepSec;
      }
      while (nextTime < now + LOOKAHEAD_SECONDS) {
        onStep(step, nextTime);
        step = (step + 1) % totalSteps;
        nextTime += stepSec;
      }
    },
    get step() {
      return step;
    },
    get nextTime() {
      return nextTime;
    },
  };
}

function startTrack(track: Track): boolean {
  const manager = getAudioManager();
  if (!manager) return false;
  const ctx = manager.ctx;
  const spec = TRACKS[track];
  const table = eventsByStep(track);
  const stepSec = stepSeconds(spec.bpm);
  const { bus, fade, nodes } = buildChain(ctx, track, manager.music);

  const scheduler = createStepScheduler(
    () => ctx.currentTime,
    stepSec,
    table.length,
    (step, when) => {
      for (const event of table[step] ?? []) {
        if (event.voice === 'bell') {
          // tiny random offset so the plucks feel played rather than gridded
          playBell(ctx, bus, track, event, when + Math.random() * 0.012);
        } else playPad(ctx, bus, event, when, stepSec);
      }
    },
  );
  scheduler.tick();
  running = { track, fade, nodes, timer: setInterval(() => scheduler.tick(), TICK_MS) };
  return true;
}

function stopRunning(): void {
  const old = running;
  running = null;
  if (!old) return;
  clearInterval(old.timer);
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  old.fade.gain.cancelScheduledValues(now);
  old.fade.gain.setValueAtTime(old.fade.gain.value, now);
  old.fade.gain.linearRampToValueAtTime(GAIN_FLOOR, now + FADE_SECONDS);
  setTimeout(
    () => {
      for (const node of old.nodes) node.disconnect();
    },
    (FADE_SECONDS + 0.3) * 1000,
  );
}

function apply(): void {
  if (wanted === null) {
    stopRunning();
    return;
  }
  if (running?.track === wanted) return;
  if (!getAudioManager()) {
    // Audio not unlocked yet: start on the first tap after unlockAudio() runs.
    attachUnlockListener();
    return;
  }
  stopRunning();
  startTrack(wanted);
}

function attachUnlockListener(): void {
  if (unlockListenerAttached || typeof window === 'undefined') return;
  unlockListenerAttached = true;
  const retry = () => {
    if (!getAudioContext()) return; // not unlocked yet; keep waiting
    window.removeEventListener('pointerup', retry);
    window.removeEventListener('keydown', retry);
    unlockListenerAttached = false;
    apply();
  };
  window.addEventListener('pointerup', retry);
  window.addEventListener('keydown', retry);
}

/** Starts a looping track with a fade; null fades out to silence. Safe to call repeatedly. */
export function playMusic(track: Track | null): void {
  wanted = track;
  try {
    apply();
  } catch {
    // music must never break the game
  }
}
