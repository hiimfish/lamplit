import { describe, expect, it } from 'vitest';
import { createEmptySave, type SaveData } from '../src/core/save';
import {
  CODE_ERRORS,
  backupReminder,
  codeChecksum,
  daysSinceExport,
  decodeSaveCode,
  encodeSaveCode,
  importedSave,
  markExported,
  saveFileName,
  saveSummary,
} from '../src/core/saveCode';
import { DEFAULT_SETTINGS, type Settings } from '../src/core/settings';
import { newStoredCard } from '../src/learning/scheduler';

const now = new Date('2026-11-24T10:00:00');
const b64url = (text: string) => Buffer.from(text, 'utf8').toString('base64url');
const unb64url = (text: string) => Buffer.from(text, 'base64url').toString('utf8');

function sampleSave(): SaveData {
  const save = { ...createEmptySave(now), coins: 77 };
  save.cards['chunk:to_go'] = {
    ...newStoredCard(now),
    reps: 2,
    state: 2,
    stability: 3,
    difficulty: 5,
  };
  save.cards['chunk:new'] = newStoredCard(now);
  save.tasks['cafe/t1'] = { stars: 2, plays: 3 };
  return save;
}

/** A signed, uncompressed code around any payload text (to hand-craft bad ones). */
function forge(payloadText: string, header: object = { typ: 'lamplit-save', v: 1, z: 'none' }) {
  const signed = `${b64url(JSON.stringify(header))}.${b64url(payloadText)}`;
  return `${signed}.${codeChecksum(signed)}`;
}

const payloadOf = (save: unknown, extra: object = {}) =>
  JSON.stringify({ saveVersion: 1, exportedAt: now.toISOString(), save, ...extra });

describe('save code', () => {
  it('Node has CompressionStream, so codes are compressed here', async () => {
    expect(typeof CompressionStream).toBe('function');
    const code = await encodeSaveCode(sampleSave(), DEFAULT_SETTINGS, now);
    expect(JSON.parse(unb64url(code.split('.')[0]!))).toEqual({
      typ: 'lamplit-save',
      v: 1,
      z: 'deflate-raw',
    });
    expect(code).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  });

  it('round-trips the save and the settings', async () => {
    const save = sampleSave();
    const settings: Settings = { ...DEFAULT_SETTINGS, showZh: false, voiceVolume: 0.5 };
    const result = await decodeSaveCode(await encodeSaveCode(save, settings, now), now);
    expect(result).toEqual({ ok: true, save, settings, exportedAt: now.toISOString() });
  });

  it('round-trips without compression (z: none)', async () => {
    const save = sampleSave();
    const code = await encodeSaveCode(save, DEFAULT_SETTINGS, now, { compress: false });
    expect(JSON.parse(unb64url(code.split('.')[0]!)).z).toBe('none');
    const result = await decodeSaveCode(code, now);
    expect(result.ok && result.save).toEqual(save);
  });

  it('accepts a code broken over lines and padded with spaces', async () => {
    const code = await encodeSaveCode(sampleSave(), DEFAULT_SETTINGS, now);
    const messy = `  \n${code.replace(/(.{20})/g, '$1\n  ')}\r\n\t`;
    expect((await decodeSaveCode(messy, now)).ok).toBe(true);
  });

  it('calls a changed payload damaged', async () => {
    const code = await encodeSaveCode(sampleSave(), DEFAULT_SETTINGS, now, { compress: false });
    const [header, payload, check] = code.split('.') as [string, string, string];
    const changed = b64url(unb64url(payload).replace('"coins":77', '"coins":99'));
    expect(await decodeSaveCode(`${header}.${changed}.${check}`, now)).toEqual({
      ok: false,
      error: CODE_ERRORS.damaged,
      reason: 'damaged',
    });
    // A code cut short is damaged too.
    expect(await decodeSaveCode(code.slice(0, -10), now)).toMatchObject({ ok: false });
  });

  it('says when text is not a code at all', async () => {
    for (const text of ['', 'hello world', 'a.b', 'a.b.c', btoa('{"a":1}')]) {
      expect(await decodeSaveCode(text, now)).toEqual({
        ok: false,
        error: CODE_ERRORS.notCode,
        reason: 'notCode',
      });
    }
    const wrongType = forge(payloadOf({}), { typ: 'other', v: 1, z: 'none' });
    expect(await decodeSaveCode(wrongType, now)).toEqual({
      ok: false,
      error: CODE_ERRORS.notCode,
      reason: 'notCode',
    });
  });

  it('refuses a code from a newer version', async () => {
    const newerSave = forge(JSON.stringify({ saveVersion: 2, exportedAt: '', save: {} }));
    expect(await decodeSaveCode(newerSave, now)).toEqual({
      ok: false,
      error: CODE_ERRORS.tooNew,
      reason: 'tooNew',
    });
    const newerCode = forge(payloadOf({}), { typ: 'lamplit-save', v: 2, z: 'none' });
    expect(await decodeSaveCode(newerCode, now)).toEqual({
      ok: false,
      error: CODE_ERRORS.tooNew,
      reason: 'tooNew',
    });
    expect(CODE_ERRORS.tooNew).toContain('這個存檔來自較新的版本，請先更新遊戲');
  });

  it('refuses a code that is too large', async () => {
    const huge = 'a'.repeat(8 * 1024 * 1024 + 1);
    expect(await decodeSaveCode(huge, now)).toEqual({
      ok: false,
      error: CODE_ERRORS.tooLarge,
      reason: 'tooLarge',
    });
  });

  it('drops __proto__, constructor and prototype keys', async () => {
    const text =
      '{"saveVersion":1,"exportedAt":"2026-11-24T02:00:00.000Z","save":{"coins":5,' +
      '"__proto__":{"polluted":true},"cards":{"constructor":{"x":1},"prototype":{}}},' +
      '"settings":{"__proto__":{"polluted":true},"showZh":false}}';
    const result = await decodeSaveCode(forge(text), now);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.save.coins).toBe(5);
    expect(Object.keys(result.save.cards)).toEqual([]);
    expect(result.settings?.showZh).toBe(false);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(Object.getPrototypeOf(result.save)).toBe(Object.prototype);
  });

  it('pulls dates after today back to now and drops future history days', async () => {
    const save = {
      ...createEmptySave(now),
      lastPlayedDate: '2027-01-01',
      streak: { count: 9, lastDate: '2027-01-01' },
      daily: { ...createEmptySave(now).daily, date: '2026-12-30', answered: 4 },
      route: { kind: 'sprint', start: '2026-12-01' },
      history: {
        '2026-11-23': { tasks: 1 },
        '2026-12-25': { tasks: 3 },
      },
      mistakes: { '2026-12-25': { 'k:a': [1, 1] } },
      checkpoints: [{ date: '2027-02-01', listening: 200, reading: 200 }],
      cards: {
        far: {
          ...newStoredCard(now),
          state: 2,
          reps: 3,
          stability: 4,
          difficulty: 5,
          scheduled_days: 4,
          last_review: '2027-01-01T00:00:00.000Z',
          due: '2027-01-05T00:00:00.000Z',
        },
        normal: {
          ...newStoredCard(now),
          state: 2,
          reps: 3,
          stability: 4,
          difficulty: 5,
          scheduled_days: 4,
          last_review: '2026-11-22T00:00:00.000Z',
          due: '2026-11-26T00:00:00.000Z',
        },
      },
    };
    const result = await decodeSaveCode(forge(payloadOf(save)), now);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const s = result.save;
    expect(s.lastPlayedDate).toBe('2026-11-24');
    expect(s.streak).toEqual({ count: 9, lastDate: '2026-11-24' });
    expect(s.daily.date).toBe('2026-11-24');
    expect(s.route.start).toBe('2026-11-24');
    expect(Object.keys(s.history)).toEqual(['2026-11-23']);
    expect(s.mistakes).toEqual({});
    expect(s.checkpoints[0]?.date).toBe('2026-11-24');
    expect(s.cards.far?.last_review).toBe(now.toISOString());
    expect(Date.parse(s.cards.far!.due)).toBe(now.getTime() + 5 * 86_400_000);
    // A card due inside its interval is left alone.
    expect(s.cards.normal?.due).toBe('2026-11-26T00:00:00.000Z');
    expect(s.cards.normal?.last_review).toBe('2026-11-22T00:00:00.000Z');
  });

  it('works without settings in the code', async () => {
    const result = await decodeSaveCode(forge(payloadOf({ coins: 3 })), now);
    expect(result).toMatchObject({ ok: true });
    if (result.ok) expect(result.settings).toBeUndefined();
  });
});

describe('import helpers', () => {
  it('merges or replaces', () => {
    const current = { ...createEmptySave(now), coins: 100 };
    const imported = sampleSave();
    expect(importedSave(current, imported, 'replace')).toBe(imported);
    const merged = importedSave(current, imported, 'merge');
    expect(merged.coins).toBe(100);
    expect(Object.keys(merged.cards).sort()).toEqual(['chunk:new', 'chunk:to_go']);
  });

  it('counts coins and the cards studied', () => {
    expect(saveSummary(sampleSave())).toEqual({ coins: 77, cards: 1 });
  });

  it('remembers the last export in days', () => {
    const data: Record<string, string> = {};
    const storage = {
      getItem: (key: string) => data[key] ?? null,
      setItem: (key: string, value: string) => void (data[key] = value),
    };
    expect(daysSinceExport(storage, now)).toBeNull();
    markExported(storage, new Date('2026-11-14T23:00:00'));
    expect(data['lamplit.lastExport']).toBeDefined();
    expect(daysSinceExport(storage, now)).toBe(10);
    expect(daysSinceExport(null, now)).toBeNull();
  });

  it('reminds to back up only with progress and an old (or no) export', () => {
    expect(backupReminder(createEmptySave(now), null)).toBeNull();
    expect(backupReminder(sampleSave(), null)).toContain('還沒有備份過');
    expect(backupReminder(sampleSave(), 7)).toBeNull();
    expect(backupReminder(sampleSave(), 8)).toBe('已經 8 天沒有備份存檔了，可以在設定裡匯出。');
  });

  it('names the download by date', () => {
    expect(saveFileName(now)).toBe('lamplit-save-2026-11-24.txt');
  });
});
