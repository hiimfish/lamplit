import type { Role } from '../content/types';

/**
 * Two voice families are generated so the learner can compare them in settings.
 * 'neural2' = Google Neural2. 'chirp' = Google Chirp 3 HD.
 * Normal-speed playback uses the selected family. Slow playback always uses the Neural2
 * clip of the same role: Chirp 3 HD does not honour speakingRate reliably, and slow
 * Chirp clips sounded unnatural to the learner, so Chirp has no slow clips.
 */
export type VoiceMode = 'neural2' | 'chirp';
export type Speed = 'normal' | 'slow';

export const VOICE_NAMES: Record<VoiceMode, Record<Role, string>> = {
  neural2: {
    barista: 'en-US-Neural2-C',
    landlord: 'en-US-Neural2-D',
    neighbor: 'en-US-Neural2-F',
    clerk: 'en-US-Neural2-I',
    guide: 'en-US-Neural2-A',
  },
  chirp: {
    barista: 'en-US-Chirp3-HD-Achernar',
    landlord: 'en-US-Chirp3-HD-Charon',
    neighbor: 'en-US-Chirp3-HD-Aoede',
    clerk: 'en-US-Chirp3-HD-Puck',
    guide: 'en-US-Chirp3-HD-Achird',
  },
};

/** Neural2 slow rate (it honours speakingRate, a steady ~1.32x longer). */
export const SLOW_RATE = 0.75;

/** Voice family that actually provides a clip: slow is always Neural2. */
export function familyFor(mode: VoiceMode, speed: Speed): VoiceMode {
  return speed === 'slow' ? 'neural2' : mode;
}

/**
 * `<unit>.<kind>.<id>` (or a bare id): lower-case letters, digits and underscores only.
 * Ids become file paths and URLs, so anything else ('../', '#', '?') is refused.
 * Shared by the player (src/audio/pronounce.ts) and the generator (scripts/gen-audio.mjs).
 */
const AUDIO_ID_PATTERN = /^[a-z0-9_]+(\.[a-z]+\.[a-z0-9_]+)?$/;

export function isValidAudioId(audioId: string): boolean {
  return AUDIO_ID_PATTERN.test(audioId);
}

/** Path of a clip relative to the site root, e.g. "audio/neural2/cafe.word.latte.slow.mp3". */
export function audioPath(mode: VoiceMode, audioId: string, speed: Speed): string {
  return `audio/${familyFor(mode, speed)}/${audioId}.${speed}.mp3`;
}
