// Phase 0 experiment: compare Google Cloud TTS voice families before choosing one.
//
//   node --env-file=.env scripts/spike-tts.mjs            (needs GOOGLE_TTS_API_KEY)
//   node scripts/spike-tts.mjs --dry-run                  (no key, no network: list the plan)
//
// Writes mp3 files and an index.html to .tmp/tts-spike/ (not committed).
// Open the index.html, listen, and note which voices sound natural at both speeds.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const API = 'https://texttospeech.googleapis.com/v1';
const OUT_DIR = join('.tmp', 'tts-spike');
const dryRun = process.argv.includes('--dry-run');
const apiKey = process.env.GOOGLE_TTS_API_KEY;

export const SAMPLES = [
  { id: 'chunk-order', kind: 'text', text: 'Can I get a latte, please?' },
  { id: 'chunk-here', kind: 'text', text: 'For here or to go?' },
  { id: 'chunk-repeat', kind: 'text', text: 'Sorry, can you say that again?' },
  { id: 'word-short', kind: 'text', text: 'latte' },
  { id: 'word-pair-ship', kind: 'text', text: 'ship' },
  { id: 'word-pair-sheep', kind: 'text', text: 'sheep' },
  { id: 'word-th', kind: 'text', text: 'think' },
  { id: 'sentence-long', kind: 'text', text: 'Hi, I just moved in next door. Nice to meet you!' },
  { id: 'letter-example', kind: 'text', text: 'B. buh, buh, ball.' },
  {
    id: 'letter-phoneme',
    kind: 'ssml',
    text: '<speak><phoneme alphabet="ipa" ph="b">b</phoneme></speak>',
  },
];
export const RATES = [
  { id: 'normal', value: 1.0 },
  { id: 'slow', value: 0.75 },
];
const FAMILIES = ['Chirp3-HD', 'Neural2'];

/** One female and one male en-US voice per family, from the live voice list. */
export function chooseVoices(allVoices) {
  const chosen = [];
  for (const family of FAMILIES) {
    const inFamily = allVoices.filter(
      (v) => v.name.includes(family) && v.languageCodes?.includes('en-US'),
    );
    for (const gender of ['FEMALE', 'MALE']) {
      const voice = inFamily.find((v) => v.ssmlGender === gender);
      if (voice) chosen.push({ family, gender, name: voice.name });
    }
  }
  return chosen;
}

export function buildRequests(voices) {
  const requests = [];
  for (const voice of voices) {
    for (const sample of SAMPLES) {
      for (const rate of RATES) {
        requests.push({
          file: `${sample.id}.${voice.name}.${rate.id}.mp3`,
          voice,
          sample,
          rate,
          body: {
            input: sample.kind === 'ssml' ? { ssml: sample.text } : { text: sample.text },
            voice: { languageCode: 'en-US', name: voice.name },
            audioConfig: { audioEncoding: 'MP3', speakingRate: rate.value },
          },
        });
      }
    }
  }
  return requests;
}

async function callApi(path, init) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey },
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error?.message ?? `HTTP ${response.status}`);
  return json;
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderReport(results) {
  const rows = results
    .map((r) => {
      const cell = r.error
        ? `<td class="error">${escapeHtml(r.error)}</td>`
        : `<td><audio controls preload="none" src="${r.file}"></audio></td>`;
      return `<tr><td>${escapeHtml(r.sample.text)}</td><td>${r.voice.family}</td><td>${r.voice.name}</td><td>${r.rate.id}</td>${cell}</tr>`;
    })
    .join('\n');
  return `<!doctype html><meta charset="utf-8"><title>TTS spike</title>
<style>body{font-family:sans-serif}td{padding:4px 8px;border-bottom:1px solid #ddd}.error{color:#b00}</style>
<h1>Google TTS voice comparison</h1>
<p>Listen for: natural slow speed, short words, the single letter sound. Errors show features a voice family does not support.</p>
<table><tr><th>Text</th><th>Family</th><th>Voice</th><th>Speed</th><th>Audio</th></tr>
${rows}</table>`;
}

async function main() {
  if (dryRun) {
    const fake = FAMILIES.flatMap((family) => [
      { family, gender: 'FEMALE', name: `en-US-${family}-EXAMPLE-F` },
      { family, gender: 'MALE', name: `en-US-${family}-EXAMPLE-M` },
    ]);
    const requests = buildRequests(fake);
    const characters = requests.reduce((sum, r) => sum + r.sample.text.length, 0);
    console.log(`dry run: ${requests.length} requests, about ${characters} characters billed`);
    console.log(
      requests
        .slice(0, 3)
        .map((r) => r.file)
        .join('\n'),
    );
    return;
  }
  if (!apiKey) {
    console.error('GOOGLE_TTS_API_KEY is not set. Copy .env.example to .env and fill it in.');
    process.exit(1);
  }

  const { voices: allVoices } = await callApi('/voices?languageCode=en-US', { method: 'GET' });
  const voices = chooseVoices(allVoices ?? []);
  if (voices.length === 0) throw new Error('No Chirp3-HD or Neural2 en-US voices were returned');
  console.log('voices:', voices.map((v) => v.name).join(', '));

  mkdirSync(OUT_DIR, { recursive: true });
  const results = [];
  for (const request of buildRequests(voices)) {
    const result = { ...request, body: undefined, error: null };
    try {
      const { audioContent } = await callApi('/text:synthesize', {
        method: 'POST',
        body: JSON.stringify(request.body),
      });
      writeFileSync(join(OUT_DIR, request.file), Buffer.from(audioContent, 'base64'));
      console.log('ok   ', request.file);
    } catch (error) {
      result.error = error.message;
      console.log('FAIL ', request.file, '-', error.message);
    }
    results.push(result);
  }

  writeFileSync(join(OUT_DIR, 'index.html'), renderReport(results));
  const failed = results.filter((r) => r.error).length;
  console.log(
    `\n${results.length - failed} ok, ${failed} failed. Open ${join(OUT_DIR, 'index.html')}`,
  );
}

if (process.argv[1]?.endsWith('spike-tts.mjs')) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
