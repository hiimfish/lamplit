import { describe, expect, it } from 'vitest';
import {
  canSpeakLanguage,
  isBrowserSpeechAvailable,
  pickVoice,
  speakWithBrowser,
} from '../src/audio/browserSpeech';

const voices = [
  { name: 'Mei', lang: 'zh-TW' },
  { name: 'Daniel', lang: 'en-GB' },
  { name: 'Samantha', lang: 'en-US' },
];

describe('pickVoice', () => {
  it('prefers an exact language match', () => {
    expect(pickVoice(voices, 'en-US')?.name).toBe('Samantha');
    expect(pickVoice(voices, 'en-GB')?.name).toBe('Daniel');
  });

  it('accepts underscore language codes (some Android voices use en_US)', () => {
    expect(pickVoice([{ name: 'A', lang: 'en_US' }], 'en-US')?.name).toBe('A');
  });

  it('falls back to another voice of the same language', () => {
    expect(pickVoice(voices, 'en-AU')?.name).toBe('Daniel');
  });

  it('returns undefined when no voice speaks the language', () => {
    expect(pickVoice(voices, 'fr-FR')).toBeUndefined();
    expect(pickVoice([], 'en-US')).toBeUndefined();
  });
});

describe('canSpeakLanguage', () => {
  it('refuses when the device only has voices for other languages', () => {
    expect(canSpeakLanguage([{ lang: 'zh-TW' }, { lang: 'ja-JP' }], 'en-US')).toBe(false);
  });

  it('accepts any voice of the same language', () => {
    expect(canSpeakLanguage([{ lang: 'zh-TW' }, { lang: 'en-GB' }], 'en-US')).toBe(true);
  });

  it('allows speech while the voice list has not loaded yet', () => {
    expect(canSpeakLanguage([], 'en-US')).toBe(true);
  });
});

describe('outside a browser', () => {
  it('reports speech as unavailable instead of throwing', () => {
    expect(isBrowserSpeechAvailable()).toBe(false);
    expect(speakWithBrowser('hello')).toBe(false);
  });
});
