import { describe, expect, it } from 'vitest';
import { buildRequests, chooseVoices, RATES, SAMPLES } from '../scripts/spike-tts.mjs';

const liveList = [
  { name: 'en-US-Standard-A', languageCodes: ['en-US'], ssmlGender: 'MALE' },
  { name: 'en-US-Neural2-C', languageCodes: ['en-US'], ssmlGender: 'FEMALE' },
  { name: 'en-US-Neural2-D', languageCodes: ['en-US'], ssmlGender: 'MALE' },
  { name: 'en-US-Neural2-F', languageCodes: ['en-US'], ssmlGender: 'FEMALE' },
  { name: 'en-GB-Chirp3-HD-Aoede', languageCodes: ['en-GB'], ssmlGender: 'FEMALE' },
  { name: 'en-US-Chirp3-HD-Aoede', languageCodes: ['en-US'], ssmlGender: 'FEMALE' },
  { name: 'en-US-Chirp3-HD-Charon', languageCodes: ['en-US'], ssmlGender: 'MALE' },
];

describe('TTS spike planning', () => {
  it('picks one female and one male en-US voice per family', () => {
    expect(chooseVoices(liveList).map((v) => v.name)).toEqual([
      'en-US-Chirp3-HD-Aoede',
      'en-US-Chirp3-HD-Charon',
      'en-US-Neural2-C',
      'en-US-Neural2-D',
    ]);
  });

  it('skips a family the account does not offer', () => {
    const onlyNeural = liveList.filter((v) => v.name.includes('Neural2'));
    expect(chooseVoices(onlyNeural)).toHaveLength(2);
    expect(chooseVoices([])).toEqual([]);
  });

  it('requests every sample at every speed with a unique file name', () => {
    const requests = buildRequests(chooseVoices(liveList));
    expect(requests).toHaveLength(4 * SAMPLES.length * RATES.length);
    expect(new Set(requests.map((r) => r.file)).size).toBe(requests.length);
  });

  it('sends SSML samples as ssml and plain samples as text', () => {
    const requests = buildRequests(chooseVoices(liveList));
    const ssml = requests.find((r) => r.sample.kind === 'ssml');
    const text = requests.find((r) => r.sample.kind === 'text');
    expect(ssml?.body.input).toHaveProperty('ssml');
    expect(text?.body.input).toHaveProperty('text');
    expect(text?.body.audioConfig.speakingRate).toBe(1);
  });
});
