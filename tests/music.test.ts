import { describe, expect, it } from 'vitest';
import {
  BELL,
  HEADROOM_CAP,
  MASTER_LOWPASS_HZ,
  MIX_LEVEL,
  NOTE_CAP,
  STEPS_PER_BAR,
  TRACKS,
  bellAmplitude,
  buildEvents,
  eventsByStep,
  loopSeconds,
  loopSteps,
  melodySteps,
  midiToFreq,
  noteToMidi,
  parseMelody,
  stepSeconds,
  velocity,
  worstCasePeak,
  type Track,
} from '../src/audio/music';

const names: Track[] = ['town', 'cafe'];

describe('note maths', () => {
  it('converts names to midi and frequency', () => {
    expect(noteToMidi('C4')).toBe(60);
    expect(noteToMidi('A4')).toBe(69);
    expect(noteToMidi('F#3')).toBe(54);
    expect(noteToMidi('Bb3')).toBe(58);
    expect(midiToFreq(69)).toBeCloseTo(440);
    expect(midiToFreq(81)).toBeCloseTo(880);
    expect(() => noteToMidi('H9')).toThrow();
  });

  it('parses melodies with rests', () => {
    expect(parseMelody('C4:2 -:2 E4:4')).toEqual([
      { start: 0, length: 2, midi: 60 },
      { start: 2, length: 2, midi: null },
      { start: 4, length: 4, midi: 64 },
    ]);
    expect(() => parseMelody('C4:0')).toThrow();
  });

  it('velocity is deterministic and gentle', () => {
    expect(velocity(5, 72)).toBe(velocity(5, 72));
    for (let s = 0; s < 200; s++) {
      const v = velocity(s, 60 + (s % 24));
      expect(v).toBeGreaterThanOrEqual(0.7);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

describe.each(names)('track %s', (name) => {
  const spec = TRACKS[name];

  it('every bar melody fills exactly one bar', () => {
    for (const bar of spec.bars) expect(melodySteps(bar.melody)).toBe(STEPS_PER_BAR);
  });

  it('loop is long (16-32 bars) and its length adds up', () => {
    expect(spec.bars.length).toBeGreaterThanOrEqual(16);
    expect(spec.bars.length).toBeLessThanOrEqual(32);
    expect(loopSteps(spec)).toBe(spec.bars.length * STEPS_PER_BAR);
    expect(loopSeconds(spec)).toBeCloseTo(spec.bars.length * 4 * (60 / spec.bpm));
    expect(loopSeconds(spec)).toBeGreaterThan(55);
  });

  it('is slow', () => {
    expect(spec.bpm).toBeGreaterThanOrEqual(60);
    expect(spec.bpm).toBeLessThanOrEqual(72);
  });

  it('every note and pad tone is in the pentatonic scale and a soft range', () => {
    const events = buildEvents(name);
    expect(events.length).toBeGreaterThan(0);
    for (const e of events) {
      expect(spec.scale).toContain(e.midi % 12);
      expect(e.midi).toBeGreaterThanOrEqual(36);
      expect(e.midi).toBeLessThanOrEqual(96);
    }
  });

  it('events stay inside the loop, so nothing is cut or doubled at the seam', () => {
    for (const e of buildEvents(name)) {
      expect(e.step).toBeGreaterThanOrEqual(0);
      expect(e.step + e.length).toBeLessThanOrEqual(loopSteps(spec));
    }
  });

  it('has only bells and pads (no drums, bass or noise voices)', () => {
    const voices = new Set(buildEvents(name).map((e) => e.voice));
    expect([...voices].sort()).toEqual(['bell', 'pad']);
  });

  it('bells sit above the pad and notes are irregularly spaced', () => {
    const events = buildEvents(name);
    const bells = events.filter((e) => e.voice === 'bell');
    const pads = events.filter((e) => e.voice === 'pad');
    expect(Math.min(...bells.map((e) => e.midi))).toBeGreaterThan(
      Math.min(...pads.map((e) => e.midi)),
    );
    const gaps = new Set<number>();
    for (let i = 1; i < bells.length; i++)
      gaps.add((bells[i]?.step ?? 0) - (bells[i - 1]?.step ?? 0));
    expect(gaps.size).toBeGreaterThanOrEqual(4);
  });

  it('step table covers every event once', () => {
    const table = eventsByStep(name);
    expect(table).toHaveLength(loopSteps(spec));
    expect(table.reduce((n, list) => n + list.length, 0)).toBe(buildEvents(name).length);
  });

  it('worst-case simultaneous voices (incl. loop seam tails) stay under the headroom cap', () => {
    expect(worstCasePeak(name)).toBeLessThanOrEqual(HEADROOM_CAP);
    expect(worstCasePeak(name) * MIX_LEVEL).toBeLessThan(0.25);
  });

  it('a single bell never exceeds the per-note cap and decays 1.5-3 s', () => {
    const b = BELL[name];
    expect(b.gain * (1 + b.partialGain)).toBeLessThanOrEqual(NOTE_CAP);
    expect(b.decay).toBeGreaterThanOrEqual(1.5);
    expect(b.decay).toBeLessThanOrEqual(3);
    expect(bellAmplitude(name, 0)).toBeGreaterThan(bellAmplitude(name, 1));
    expect(bellAmplitude(name, b.decay + 0.1)).toBe(0);
  });
});

describe('mix', () => {
  it('town is brighter and busier than cafe, cafe is slower', () => {
    const count = (t: Track) => buildEvents(t).filter((e) => e.voice === 'bell').length;
    const density = (t: Track) => count(t) / loopSeconds(TRACKS[t]);
    expect(density('town')).toBeGreaterThan(density('cafe'));
    expect(TRACKS.cafe.bpm).toBeLessThan(TRACKS.town.bpm);
    expect(BELL.town.partialGain).toBeGreaterThan(BELL.cafe.partialGain);
  });

  it('mix is quiet by design, with a master low-pass at 6-8 kHz', () => {
    expect(MIX_LEVEL).toBeLessThanOrEqual(2);
    expect(MASTER_LOWPASS_HZ).toBeGreaterThanOrEqual(6000);
    expect(MASTER_LOWPASS_HZ).toBeLessThanOrEqual(8000);
  });

  it('step length is an eighth note', () => {
    expect(stepSeconds(120)).toBeCloseTo(0.25);
  });
});
