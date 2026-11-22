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
    // Neural2 has nine US voices, so roles of different locations share one;
    // two roles of the same location never do. The librarian is the one British voice.
    passerby: 'en-US-Neural2-E',
    driver: 'en-US-Neural2-J',
    cashier: 'en-US-Neural2-G',
    vendor: 'en-US-Neural2-D',
    assistant: 'en-US-Neural2-H',
    receptionist: 'en-US-Neural2-C',
    doctor: 'en-US-Neural2-J',
    pharmacist: 'en-US-Neural2-G',
    server: 'en-US-Neural2-I',
    friend: 'en-US-Neural2-E',
    postal_clerk: 'en-US-Neural2-D',
    volunteer: 'en-US-Neural2-J',
    teller: 'en-US-Neural2-G',
    instructor: 'en-US-Neural2-D',
    librarian: 'en-GB-Neural2-C',
    mechanic: 'en-US-Neural2-I',
    counselor: 'en-US-Neural2-C',
    front_desk: 'en-US-Neural2-E',
    manager: 'en-US-Neural2-H',
    guide: 'en-US-Neural2-A',
  },
  chirp: {
    barista: 'en-US-Chirp3-HD-Achernar',
    landlord: 'en-US-Chirp3-HD-Charon',
    neighbor: 'en-US-Chirp3-HD-Aoede',
    clerk: 'en-US-Chirp3-HD-Puck',
    passerby: 'en-US-Chirp3-HD-Kore',
    driver: 'en-US-Chirp3-HD-Fenrir',
    cashier: 'en-US-Chirp3-HD-Leda',
    vendor: 'en-US-Chirp3-HD-Orus',
    assistant: 'en-US-Chirp3-HD-Zephyr',
    receptionist: 'en-US-Chirp3-HD-Callirrhoe',
    doctor: 'en-US-Chirp3-HD-Iapetus',
    pharmacist: 'en-US-Chirp3-HD-Despina',
    server: 'en-US-Chirp3-HD-Umbriel',
    friend: 'en-US-Chirp3-HD-Sulafat',
    postal_clerk: 'en-US-Chirp3-HD-Schedar',
    volunteer: 'en-US-Chirp3-HD-Sadachbia',
    teller: 'en-US-Chirp3-HD-Autonoe',
    instructor: 'en-US-Chirp3-HD-Algieba',
    librarian: 'en-GB-Chirp3-HD-Gacrux',
    mechanic: 'en-US-Chirp3-HD-Alnilam',
    counselor: 'en-US-Chirp3-HD-Laomedeia',
    front_desk: 'en-US-Chirp3-HD-Pulcherrima',
    manager: 'en-US-Chirp3-HD-Erinome',
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
