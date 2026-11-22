import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  jobHash,
  jobsToRun,
  languageCodeOf,
  planJobs,
  runJobs,
  serializeManifest,
  writeFileAtomic,
  writeManifest,
} from '../scripts/gen-audio.mjs';
import { SLOW_RATE, VOICE_NAMES, audioPath, familyFor } from '../src/audio/voices';

const items = [
  { id: 'u.word.latte', text: 'latte', role: 'guide' as const },
  { id: 'u.line.hi', text: 'Hi!', role: 'barista' as const },
];

describe('voice paths', () => {
  it('normal playback uses the selected family', () => {
    expect(familyFor('chirp', 'normal')).toBe('chirp');
    expect(familyFor('neural2', 'normal')).toBe('neural2');
    expect(audioPath('chirp', 'a.b', 'normal')).toBe('audio/chirp/a.b.normal.mp3');
    expect(audioPath('neural2', 'a.b', 'normal')).toBe('audio/neural2/a.b.normal.mp3');
  });

  it('slow playback always uses the neural2 clip', () => {
    expect(familyFor('chirp', 'slow')).toBe('neural2');
    expect(familyFor('neural2', 'slow')).toBe('neural2');
    expect(audioPath('chirp', 'a.b', 'slow')).toBe('audio/neural2/a.b.slow.mp3');
    expect(audioPath('neural2', 'a.b', 'slow')).toBe('audio/neural2/a.b.slow.mp3');
  });
});

describe('gen-audio planning', () => {
  const jobs = planJobs(items);

  it('plans normal for both families and slow for neural2 only, with unique paths', () => {
    expect(jobs).toHaveLength(6);
    expect(new Set(jobs.map((j) => j.path)).size).toBe(jobs.length);
    for (const family of ['neural2', 'chirp']) {
      expect(
        jobs.filter((j) => j.path.startsWith(`audio/${family}/`) && j.speed === 'normal'),
      ).toHaveLength(2);
    }
    expect(jobs.filter((j) => j.speed === 'slow').map((j) => j.family)).toEqual([
      'neural2',
      'neural2',
    ]);
    expect(jobs.some((j) => j.path.startsWith('audio/chirp/') && j.path.includes('.slow.'))).toBe(
      false,
    );
  });

  it('uses the slow rate for neural2 slow clips and 1 otherwise', () => {
    const slow = jobs.find((j) => j.path === 'audio/neural2/u.word.latte.slow.mp3');
    expect(slow?.rate).toBe(SLOW_RATE);
    expect(jobs.filter((j) => j.speed === 'normal').every((j) => j.rate === 1)).toBe(true);
  });

  it('uses the role voice of each family', () => {
    const job = jobs.find((j) => j.path === 'audio/chirp/u.line.hi.normal.mp3');
    expect(job?.voiceName).toBe(VOICE_NAMES.chirp.barista);
    const slow = jobs.find((j) => j.path === 'audio/neural2/u.line.hi.slow.mp3');
    expect(slow?.voiceName).toBe(VOICE_NAMES.neural2.barista);
  });

  it('changes the hash when text, voice or rate changes', () => {
    const base = jobHash('a', 'v', 1);
    expect(jobHash('b', 'v', 1)).not.toBe(base);
    expect(jobHash('a', 'w', 1)).not.toBe(base);
    expect(jobHash('a', 'v', 0.75)).not.toBe(base);
    expect(jobHash('a', 'v', 1)).toBe(base);
  });

  it('skips unchanged jobs unless forced, and reruns missing or changed ones', () => {
    const manifest = Object.fromEntries(jobs.map((j) => [j.path, { hash: j.hash }]));
    expect(jobsToRun(jobs, manifest, () => true)).toEqual([]);
    expect(jobsToRun(jobs, manifest, () => true, { force: true })).toHaveLength(6);
    expect(jobsToRun(jobs, manifest, (p: string) => p !== jobs[0]?.path)).toEqual([jobs[0]]);
    const changed = planJobs([{ ...items[0], text: 'mocha' }]);
    expect(jobsToRun(changed, manifest, () => true)).toHaveLength(3);
  });

  it('still understands plain-string manifest entries', () => {
    const manifest = Object.fromEntries(jobs.map((j) => [j.path, j.hash]));
    expect(jobsToRun(jobs, manifest, () => true)).toEqual([]);
  });

  it('dry run writes nothing', async () => {
    const { execFileSync } = await import('node:child_process');
    const before = existsSync('public/audio') ? readdirSync('public/audio').join() : '';
    const out = execFileSync(process.execPath, ['scripts/gen-audio.mjs', '--dry-run', '--force'], {
      encoding: 'utf8',
      env: { PATH: process.env.PATH ?? '', TMP: mkdtempSync(tmpdir() + '/ga-') },
    });
    expect(out).toContain('files planned');
    const after = existsSync('public/audio') ? readdirSync('public/audio').join() : '';
    expect(after).toBe(before);
  });
});

describe('gen-audio id validation', () => {
  it.each(['../../src', 'u/word/x', 'u.word.a#b', 'u.word.a?b', 'U.word.x', 'u.word.x y', ''])(
    'refuses the id %j, which would escape public/audio or break the URL',
    (id) => {
      expect(() => planJobs([{ id, text: 'x', role: 'guide' }])).toThrow(/invalid audio id/);
    },
  );

  it('accepts real content ids', () => {
    expect(planJobs([{ id: 'cafe.chunk.can_i_get', text: 'x', role: 'guide' }])).toHaveLength(3);
  });
});

type Job = { path: string; hash: string };
const todo: Job[] = [1, 2, 3, 4].map((n) => ({ path: `audio/x/${n}.mp3`, hash: `h${n}` }));

describe('gen-audio atomic writes', () => {
  it('writes a file through <file>.tmp and a rename, replacing an old file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ga-atomic-'));
    const file = join(dir, 'sub', 'a.mp3');
    writeFileAtomic(file, 'old');
    writeFileAtomic(file, 'new');
    expect(readFileSync(file, 'utf8')).toBe('new');
    expect(readdirSync(join(dir, 'sub'))).toEqual(['a.mp3']);

    const calls: string[] = [];
    const fs = {
      mkdirSync: () => calls.push('mkdir'),
      writeFileSync: (f: string) => calls.push(`write ${f}`),
      renameSync: (from: string, to: string) => calls.push(`rename ${from} -> ${to}`),
    };
    writeFileAtomic('/p/a.mp3', 'x', fs);
    expect(calls).toEqual(['mkdir', 'write /p/a.mp3.tmp', 'rename /p/a.mp3.tmp -> /p/a.mp3']);
  });

  it('a crash mid-write leaves the old file intact (only the .tmp is partial)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ga-crash-'));
    const file = join(dir, 'a.mp3');
    writeFileSync(file, 'good');
    const fs = {
      mkdirSync: () => undefined,
      writeFileSync: (f: string) => {
        writeFileSync(f, 'trunc');
        throw new Error('killed');
      },
      renameSync: () => {
        throw new Error('not reached');
      },
    };
    expect(() => writeFileAtomic(file, 'new', fs)).toThrow('killed');
    expect(readFileSync(file, 'utf8')).toBe('good');
  });

  /** A rename that fails with `code` for the first `failures` calls. */
  const flakyFs = (failures: number, code: string) => {
    const calls: string[] = [];
    let left = failures;
    return {
      calls,
      fs: {
        mkdirSync: () => undefined,
        writeFileSync: () => undefined,
        renameSync: () => {
          calls.push('rename');
          if (left-- > 0) throw Object.assign(new Error(code), { code });
        },
        waitSync: (ms: number) => calls.push(`wait ${ms}`),
      },
    };
  };

  it('retries a rename that Windows briefly locks (EPERM, EBUSY, EACCES)', () => {
    for (const code of ['EPERM', 'EBUSY', 'EACCES']) {
      const { fs, calls } = flakyFs(2, code);
      writeFileAtomic('/p/manifest.json', '{}', fs);
      expect(calls.filter((c) => c === 'rename')).toHaveLength(3);
      expect(calls.filter((c) => c.startsWith('wait'))).toHaveLength(2);
    }
  });

  it('gives up after a few locked renames, and never retries other errors', () => {
    const locked = flakyFs(100, 'EPERM');
    expect(() => writeFileAtomic('/p/a', 'x', locked.fs)).toThrow('EPERM');
    expect(locked.calls.filter((c) => c === 'rename')).toHaveLength(6);

    const missing = flakyFs(1, 'ENOENT');
    expect(() => writeFileAtomic('/p/a', 'x', missing.fs)).toThrow('ENOENT');
    expect(missing.calls).toEqual(['rename']);
  });

  it('writes the manifest atomically with sorted keys', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ga-manifest-'));
    const file = join(dir, 'manifest.json');
    writeManifest({ b: { hash: '2' }, a: { hash: '1' } }, file);
    const text = readFileSync(file, 'utf8');
    expect(text).toBe(serializeManifest({ a: { hash: '1' }, b: { hash: '2' } }));
    expect(Object.keys(JSON.parse(text))).toEqual(['a', 'b']);
    expect(readdirSync(dir)).toEqual(['manifest.json']);
  });
});

describe('language code follows the voice', () => {
  it('is the first two parts of the voice name', () => {
    expect(languageCodeOf('en-US-Neural2-C')).toBe('en-US');
    expect(languageCodeOf('en-US-Chirp3-HD-Achernar')).toBe('en-US');
    expect(languageCodeOf('en-GB-Neural2-C')).toBe('en-GB');
    expect(languageCodeOf('en-GB-Chirp3-HD-Gacrux')).toBe('en-GB');
  });

  it('does not enter the manifest hash, so existing US clips stay up to date', () => {
    const job = planJobs([{ id: 'u.word.latte', text: 'latte', role: 'barista' as const }])[0]!;
    expect(job.hash).toBe(jobHash('latte', job.voiceName, job.rate));
    expect(Object.keys(job)).not.toContain('languageCode');
  });
});

describe('role voice table', () => {
  const act2Roles = [
    'teller',
    'instructor',
    'librarian',
    'mechanic',
    'counselor',
    'front_desk',
    'manager',
  ] as const;
  const allRoles = Object.keys(VOICE_NAMES.neural2) as (keyof typeof VOICE_NAMES.neural2)[];

  it('gives every role a voice in both families', () => {
    expect(Object.keys(VOICE_NAMES.chirp).sort()).toEqual([...allRoles].sort());
  });

  it('uses US voices for every role except the British librarian', () => {
    for (const role of allRoles) {
      const expected = role === 'librarian' ? 'en-GB' : 'en-US';
      expect(languageCodeOf(VOICE_NAMES.neural2[role]), role).toBe(expected);
      expect(languageCodeOf(VOICE_NAMES.chirp[role]), role).toBe(expected);
    }
  });

  it('pins the Act 2 voices', () => {
    expect(act2Roles.map((r) => VOICE_NAMES.neural2[r])).toEqual([
      'en-US-Neural2-G',
      'en-US-Neural2-D',
      'en-GB-Neural2-C',
      'en-US-Neural2-I',
      'en-US-Neural2-C',
      'en-US-Neural2-E',
      'en-US-Neural2-H',
    ]);
    expect(act2Roles.map((r) => VOICE_NAMES.chirp[r])).toEqual([
      'en-US-Chirp3-HD-Autonoe',
      'en-US-Chirp3-HD-Algieba',
      'en-GB-Chirp3-HD-Gacrux',
      'en-US-Chirp3-HD-Alnilam',
      'en-US-Chirp3-HD-Laomedeia',
      'en-US-Chirp3-HD-Pulcherrima',
      'en-US-Chirp3-HD-Erinome',
    ]);
  });
});

describe('gen-audio incremental manifest', () => {
  const quiet = () => undefined;

  it('saves the clip, then the manifest, after every success; failures are not recorded', async () => {
    const events: string[] = [];
    const manifest: Record<string, { hash: string }> = {};
    const result = await runJobs(todo, {
      manifest,
      concurrency: 1,
      log: quiet,
      synthesize: async (job: Job) => {
        if (job.path.endsWith('/3.mp3')) throw new Error('HTTP 500');
        return Buffer.from(job.path);
      },
      saveClip: (job: Job) => events.push(`clip ${job.path}`),
      saveManifest: (m: Record<string, unknown>) =>
        events.push(`manifest ${Object.keys(m).length}`),
    });
    expect(result).toEqual({ generated: 3, failed: 1 });
    expect(events).toEqual([
      'clip audio/x/1.mp3',
      'manifest 1',
      'clip audio/x/2.mp3',
      'manifest 2',
      'clip audio/x/4.mp3',
      'manifest 3',
    ]);
    expect(manifest['audio/x/3.mp3']).toBeUndefined();
    expect(manifest['audio/x/4.mp3']).toEqual({ hash: 'h4' });
  });

  it('an interrupted run has already saved the hashes of the clips it finished', async () => {
    let saved: Record<string, unknown> = {};
    void runJobs(todo, {
      manifest: {},
      concurrency: 1,
      log: quiet,
      // the third request never returns: the user presses Ctrl+C here
      synthesize: (job: Job) =>
        job.path.endsWith('/3.mp3')
          ? new Promise(() => undefined)
          : Promise.resolve(Buffer.from('a')),
      saveClip: quiet,
      saveManifest: (m: Record<string, unknown>) => {
        saved = JSON.parse(JSON.stringify(m));
      },
    });
    await vi.waitFor(() => expect(Object.keys(saved)).toHaveLength(2));
    expect(saved).toEqual({ 'audio/x/1.mp3': { hash: 'h1' }, 'audio/x/2.mp3': { hash: 'h2' } });
  });

  it('a clip that failed to save is not recorded in the manifest', async () => {
    const manifest = {};
    const saveManifest = vi.fn();
    const result = await runJobs(todo.slice(0, 1), {
      manifest,
      log: quiet,
      synthesize: async () => Buffer.from('a'),
      saveClip: () => {
        throw new Error('disk full');
      },
      saveManifest,
    });
    expect(result.failed).toBe(1);
    expect(manifest).toEqual({});
    expect(saveManifest).not.toHaveBeenCalled();
  });
});
