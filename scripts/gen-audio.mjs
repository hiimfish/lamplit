// Pre-generate pronunciation mp3 files for every unit.
//
//   node --env-file=.env scripts/gen-audio.mjs [--dry-run] [--force] [--only=<substring>]
//
// Output goes to public/audio/<family>/<audioId>.<speed>.mp3 plus public/audio/manifest.json.
// Normal clips are generated for both voice families; slow clips for 'neural2' only
// (Chirp 3 HD does not honour speakingRate reliably; slow playback always uses Neural2).
import { createHash } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';
import * as nodeFs from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { unitToAudioItems } from '../src/content/audioItems.ts';
import { SLOW_RATE, VOICE_NAMES, audioPath, isValidAudioId } from '../src/audio/voices.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const UNITS_DIR = join(ROOT, 'src', 'data', 'units');
const PUBLIC_DIR = join(ROOT, 'public');
const MANIFEST = join(PUBLIC_DIR, 'audio', 'manifest.json');
const API = 'https://texttospeech.googleapis.com/v1/text:synthesize';
const CONCURRENCY = 3;
const { existsSync, readdirSync, readFileSync } = nodeFs;

/** Language code of a voice name: its first two parts ("en-GB-Neural2-C" gives "en-GB"). */
export function languageCodeOf(voiceName) {
  return voiceName.split('-').slice(0, 2).join('-');
}

export function jobHash(text, voiceName, rate) {
  return createHash('sha256')
    .update(JSON.stringify([text, voiceName, rate]))
    .digest('hex')
    .slice(0, 16);
}

/** All files to produce: normal for both families, slow for neural2 only. */
export function planJobs(items) {
  const jobs = [];
  for (const item of items) {
    if (typeof item.id !== 'string' || !isValidAudioId(item.id)) {
      throw new Error(
        `invalid audio id ${JSON.stringify(item.id)}: expected <unit>.<kind>.<id> using only a-z, 0-9 and _ (it becomes a file path)`,
      );
    }
    for (const family of ['neural2', 'chirp']) {
      for (const speed of ['normal', 'slow']) {
        if (speed === 'slow' && family !== 'neural2') continue;
        const voiceName = VOICE_NAMES[family][item.role];
        const rate = speed === 'slow' ? SLOW_RATE : 1;
        jobs.push({
          path: audioPath(family, item.id, speed),
          text: item.text,
          voiceName,
          family,
          speed,
          rate,
          hash: jobHash(item.text, voiceName, rate),
        });
      }
    }
  }
  return jobs;
}

/** Manifest entries are { hash, ... }; older plain-string entries are still understood. */
function entryHash(entry) {
  return typeof entry === 'string' ? entry : entry?.hash;
}

/** Jobs whose file is missing or whose hash differs from the manifest. */
export function jobsToRun(jobs, manifest, fileExists, { force = false } = {}) {
  return jobs.filter(
    (job) => force || entryHash(manifest[job.path]) !== job.hash || !fileExists(job.path),
  );
}

function loadItems(unitsDir = UNITS_DIR) {
  return readdirSync(unitsDir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .flatMap((f) => unitToAudioItems(JSON.parse(readFileSync(join(unitsDir, f), 'utf8'))));
}

function readManifest() {
  return existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
}

/**
 * The file-system calls used for writing (injectable for tests).
 * @typedef {{
 *   mkdirSync(path: string, options: { recursive: boolean }): unknown;
 *   writeFileSync(path: string, data: string | Uint8Array): unknown;
 *   renameSync(from: string, to: string): unknown;
 *   waitSync?(ms: number): unknown;
 * }} WriteFs
 */

/** Errors Windows gives while another process (Vite's watcher, antivirus) holds the target. */
const LOCKED = new Set(['EPERM', 'EBUSY', 'EACCES']);
const RENAME_TRIES = 6;

/** Blocks for `ms` milliseconds (the writes are synchronous, so this is too). */
function waitSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/**
 * Writes to `<file>.tmp` and renames it over the target, so a kill mid-write never
 * leaves a truncated file that a later run would count as up to date. A rename that
 * fails because the target is briefly locked is retried a few times.
 * @param {string} file
 * @param {string | Uint8Array} data
 * @param {WriteFs} [fs]
 */
export function writeFileAtomic(file, data, fs = nodeFs) {
  fs.mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, data);
  for (let attempt = 1; ; attempt++) {
    try {
      fs.renameSync(tmp, file);
      return;
    } catch (error) {
      if (attempt >= RENAME_TRIES || !LOCKED.has(error?.code)) throw error;
      (fs.waitSync ?? waitSync)(25 * attempt);
    }
  }
}

/** Manifest JSON with keys sorted, so diffs stay small. */
export function serializeManifest(manifest) {
  const sorted = Object.fromEntries(
    Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)),
  );
  return JSON.stringify(sorted, null, 2) + '\n';
}

/**
 * @param {Record<string, unknown>} manifest
 * @param {string} [file]
 * @param {WriteFs} [fs]
 */
export function writeManifest(manifest, file = MANIFEST, fs = nodeFs) {
  writeFileAtomic(file, serializeManifest(manifest), fs);
}

/**
 * Runs the jobs `concurrency` at a time. Each finished clip is saved (atomically,
 * by `saveClip`), then its hash is recorded and the manifest saved straight away,
 * so an interrupted run keeps everything it already paid for.
 */
export async function runJobs(
  todo,
  { manifest, synthesize, saveClip, saveManifest, concurrency = CONCURRENCY, log = console.log },
) {
  let failed = 0;
  let next = 0;
  const worker = async () => {
    while (next < todo.length) {
      const job = todo[next++];
      try {
        const audio = await synthesize(job);
        saveClip(job, audio);
        manifest[job.path] = { hash: job.hash };
        saveManifest(manifest);
        log('ok  ', job.path);
      } catch (error) {
        failed++;
        log('FAIL', job.path, '-', error.message);
      }
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  return { generated: todo.length - failed, failed };
}

async function synthesize(text, voiceName, rate, apiKey) {
  const body = JSON.stringify({
    input: { text },
    voice: { languageCode: languageCodeOf(voiceName), name: voiceName },
    audioConfig: { audioEncoding: 'MP3', speakingRate: rate },
  });
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey },
      body,
    });
    if (response.ok) {
      const json = await response.json();
      return Buffer.from(json.audioContent, 'base64');
    }
    const retryable = response.status === 429 || response.status >= 500;
    let message = `HTTP ${response.status}`;
    try {
      message = (await response.json()).error?.message ?? message;
    } catch {
      // keep the status-only message
    }
    if (!retryable || attempt === 1) throw new Error(message);
    await sleep(1500);
  }
  throw new Error('unreachable');
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  const only = args.find((a) => a.startsWith('--only='))?.slice('--only='.length);

  const manifest = readManifest();
  let jobs = planJobs(loadItems());
  if (only) jobs = jobs.filter((j) => j.path.includes(only));
  const todo = jobsToRun(jobs, manifest, (p) => existsSync(join(PUBLIC_DIR, p)), { force });
  const characters = todo.reduce((sum, j) => sum + j.text.length, 0);
  console.log(
    `${jobs.length} files planned, ${jobs.length - todo.length} up to date, ${todo.length} to generate (${characters} characters billed)`,
  );
  if (dryRun || todo.length === 0) return;

  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    console.error(
      'GOOGLE_TTS_API_KEY is not set. Run with: node --env-file=.env scripts/gen-audio.mjs',
    );
    process.exit(1);
  }

  // The manifest is saved after every clip; this also covers a Ctrl+C between saves.
  process.once('SIGINT', () => {
    writeManifest(manifest);
    console.log('\ninterrupted: manifest saved, finished clips will not be generated again');
    process.exit(130);
  });
  const { generated, failed } = await runJobs(todo, {
    manifest,
    synthesize: (job) => synthesize(job.text, job.voiceName, job.rate, apiKey),
    saveClip: (job, audio) => writeFileAtomic(join(PUBLIC_DIR, job.path), audio),
    saveManifest: (m) => writeManifest(m),
  });
  writeManifest(manifest);
  console.log(`${generated} generated, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

if (process.argv[1]?.endsWith('gen-audio.mjs')) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
