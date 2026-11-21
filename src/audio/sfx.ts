/** Short synthesised sound effects, played through the sfx bus. */
import { getAudioManager } from './AudioManager';

export type SfxName = 'click' | 'correct' | 'wrong' | 'coin' | 'complete';

/** Major-scale semitone offsets; a streak climbs these, then stays at the top. */
const COMBO_STEPS = [0, 2, 4, 5, 7, 9, 11, 12];

/** Semitones above the base pitch for a combo count (0, 1, 2, ...), capped at one octave. */
export function comboSemitones(combo: number): number {
  const index = Math.min(Math.max(0, Math.floor(combo || 0)), COMBO_STEPS.length - 1);
  return COMBO_STEPS[index] ?? 0;
}

export function pitchFor(baseHz: number, semitones: number): number {
  return baseHz * 2 ** (semitones / 12);
}

interface Tone {
  freq: number;
  /** Seconds after the sound starts. */
  at: number;
  length: number;
  type?: OscillatorType;
  gain?: number;
  /** Optional pitch glide target. */
  glideTo?: number;
}

function schedule(tones: Tone[]): void {
  const manager = getAudioManager();
  if (!manager) return;
  const { ctx, sfx } = manager;
  const t0 = ctx.currentTime + 0.01;
  for (const tone of tones) {
    const start = t0 + tone.at;
    const end = start + tone.length;
    const peak = tone.gain ?? 0.12;
    const osc = ctx.createOscillator();
    osc.type = tone.type ?? 'square';
    osc.frequency.setValueAtTime(tone.freq, start);
    if (tone.glideTo) osc.frequency.exponentialRampToValueAtTime(tone.glideTo, end);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(peak, start + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(g).connect(sfx);
    osc.start(start);
    osc.stop(end + 0.02);
  }
}

function sfxTones(name: SfxName, combo = 0): Tone[] {
  switch (name) {
    case 'click':
      return [{ freq: 660, at: 0, length: 0.05, type: 'square', gain: 0.07 }];
    case 'correct': {
      const base = pitchFor(523.25, comboSemitones(combo)); // C5 and up
      return [
        { freq: base, at: 0, length: 0.09, type: 'square', gain: 0.09 },
        { freq: base * 1.5, at: 0.08, length: 0.16, type: 'square', gain: 0.09 },
      ];
    }
    case 'wrong':
      // Soft, low and short: a gentle downward blip, not a buzzer.
      return [{ freq: 300, at: 0, length: 0.2, type: 'triangle', gain: 0.1, glideTo: 220 }];
    case 'coin':
      return [
        { freq: 987.77, at: 0, length: 0.06, type: 'square', gain: 0.07 },
        { freq: 1318.51, at: 0.06, length: 0.18, type: 'square', gain: 0.07 },
      ];
    case 'complete':
      return [523.25, 659.25, 783.99, 1046.5].map((freq, i) => ({
        freq,
        at: i * 0.11,
        length: i === 3 ? 0.4 : 0.14,
        type: 'square' as const,
        gain: 0.08,
      }));
  }
}

/** `combo` (0, 1, 2, ...) raises the pitch of 'correct' as the streak grows. */
export function playSfx(name: SfxName, combo = 0): void {
  try {
    schedule(sfxTones(name, combo));
  } catch {
    // sound effects must never break the game
  }
}
