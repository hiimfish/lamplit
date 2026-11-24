import {
  SAVE_VERSION,
  dateKey,
  mergeSaves,
  sanitizeSave,
  daysBetween,
  type SaveData,
  type StorageLike,
} from './save';
import { sanitizeSettings, type Settings } from './settings';
import { STORAGE_KEYS } from './storageKeys';

/*
 * The save code moves progress between devices: `header.payload.check`, each part
 * base64url without padding.
 *   header  JSON {"typ":"lamplit-save","v":1,"z":"deflate-raw" | "none"}
 *   payload (deflate-raw compressed) UTF-8 JSON { saveVersion, exportedAt, save, settings }
 *   check   FNV-1a 32-bit of `header.payload`, big-endian, as base64url
 * The check only catches a code that was cut short or mistyped; it is not a signature
 * (crypto.subtle is missing on plain http, as on the LAN dev server).
 */

const CODE_TYPE = 'lamplit-save';
const CODE_VERSION = 1;

/** Longest pasted text accepted (characters). */
export const MAX_CODE_CHARS = 8 * 1024 * 1024;
/** Largest payload accepted once decompressed (bytes). */
export const MAX_PAYLOAD_BYTES = 16 * 1024 * 1024;

export const CODE_ERRORS = {
  notCode: '這不是點燈英語的存檔代碼，請確認複製的是整段代碼。',
  damaged: '存檔代碼不完整或被改過，請重新複製整段代碼再試一次。',
  tooNew: '這個存檔來自較新的版本，請先更新遊戲。',
  tooLarge: '存檔代碼太大，無法匯入。',
  unsupported: '這個瀏覽器解不開壓縮過的存檔代碼，請換新版瀏覽器再試。',
} as const;

export type DecodeResult =
  | { ok: true; save: SaveData; settings?: Settings; exportedAt: string }
  | { ok: false; error: string };

/* ---------- bytes ---------- */

const utf8 = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Throws on characters outside base64url. */
function fromBase64Url(text: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) throw new Error('not base64url');
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

/** FNV-1a 32-bit over the UTF-16 code units of `text` (the code is ASCII). */
function fnv1a(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** The check part for `header.payload`. */
export function codeChecksum(signed: string): string {
  const hash = fnv1a(signed);
  return toBase64Url(
    new Uint8Array([hash >>> 24, (hash >>> 16) & 0xff, (hash >>> 8) & 0xff, hash & 0xff]),
  );
}

async function pipeBytes(bytes: Uint8Array, transform: TransformStream, limit: number) {
  const reader = new Blob([bytes as BlobPart])
    .stream()
    .pipeThrough(transform)
    .getReader() as ReadableStreamDefaultReader<Uint8Array>;
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const out = new Uint8Array(size);
  let at = 0;
  for (const chunk of chunks) {
    out.set(chunk, at);
    at += chunk.length;
  }
  return out;
}

const canCompress = (): boolean =>
  typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';

/** JSON.parse that drops keys which could reach an object's prototype. */
function safeParse(text: string): unknown {
  return JSON.parse(text, (key, value: unknown) =>
    key === '__proto__' || key === 'constructor' || key === 'prototype' ? undefined : value,
  );
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/* ---------- encode ---------- */

/** Turns the save (and settings) into a code to copy or download. */
export async function encodeSaveCode(
  save: SaveData,
  settings: Settings,
  now: Date,
  options: { compress?: boolean } = {},
): Promise<string> {
  const compress = (options.compress ?? true) && canCompress();
  const header = { typ: CODE_TYPE, v: CODE_VERSION, z: compress ? 'deflate-raw' : 'none' };
  const body = utf8.encode(
    JSON.stringify({ saveVersion: SAVE_VERSION, exportedAt: now.toISOString(), save, settings }),
  );
  const payload = compress
    ? await pipeBytes(body, new CompressionStream('deflate-raw'), Infinity)
    : body;
  const signed = `${toBase64Url(utf8.encode(JSON.stringify(header)))}.${toBase64Url(payload!)}`;
  return `${signed}.${codeChecksum(signed)}`;
}

/* ---------- decode ---------- */

/**
 * Pulls dates after `now` back to now (a code from a device whose clock ran ahead
 * would otherwise hold the streak or the history hostage). Days after today in
 * `history` and `mistakes` are dropped. Works on the freshly parsed JSON in place.
 */
export function clampFutureDates(raw: Record<string, unknown>, now: Date): void {
  const today = dateKey(now);
  const nowMs = now.getTime();
  const clampDay = (obj: Record<string, unknown>, field: string) => {
    const value = obj[field];
    if (typeof value === 'string' && value > today) obj[field] = today;
  };
  if (isObject(raw.cards)) {
    for (const card of Object.values(raw.cards)) {
      if (!isObject(card)) continue;
      const last = typeof card.last_review === 'string' ? Date.parse(card.last_review) : NaN;
      if (last > nowMs) card.last_review = now.toISOString();
      // A card is due at most its interval (plus a day) from now.
      const days = typeof card.scheduled_days === 'number' ? card.scheduled_days : 0;
      const limit = nowMs + (Math.max(0, Number.isFinite(days) ? days : 0) + 1) * 86_400_000;
      const due = typeof card.due === 'string' ? Date.parse(card.due) : NaN;
      if (due > limit) card.due = new Date(limit).toISOString();
    }
  }
  clampDay(raw, 'lastPlayedDate');
  if (isObject(raw.streak)) clampDay(raw.streak, 'lastDate');
  if (isObject(raw.daily)) clampDay(raw.daily, 'date');
  if (isObject(raw.route)) {
    clampDay(raw.route, 'start');
    clampDay(raw.route, 'askedOn');
  }
  if (isObject(raw.examRun)) clampDay(raw.examRun, 'startedOn');
  if (isObject(raw.exams)) {
    for (const record of Object.values(raw.exams))
      if (isObject(record)) clampDay(record, 'lastDate');
  }
  if (Array.isArray(raw.checkpoints)) {
    for (const entry of raw.checkpoints) if (isObject(entry)) clampDay(entry, 'date');
  }
  for (const field of ['history', 'mistakes'] as const) {
    const days = raw[field];
    if (!isObject(days)) continue;
    for (const key of Object.keys(days)) if (key > today) delete days[key];
  }
}

const fail = (error: string): DecodeResult => ({ ok: false, error });

/** Reads a pasted or loaded code. Never throws; errors are in words for the player. */
export async function decodeSaveCode(text: string, now: Date): Promise<DecodeResult> {
  if (text.length > MAX_CODE_CHARS) return fail(CODE_ERRORS.tooLarge);
  const code = text.replace(/\s+/g, '');
  const parts = code.split('.');
  if (parts.length !== 3 || parts.some((part) => part === '')) return fail(CODE_ERRORS.notCode);
  const [headerPart, payloadPart, checkPart] = parts as [string, string, string];

  let header: unknown;
  try {
    header = safeParse(new TextDecoder('utf-8', { fatal: true }).decode(fromBase64Url(headerPart)));
  } catch {
    return fail(CODE_ERRORS.notCode);
  }
  if (!isObject(header) || header.typ !== CODE_TYPE || typeof header.v !== 'number') {
    return fail(CODE_ERRORS.notCode);
  }
  if (header.v > CODE_VERSION) return fail(CODE_ERRORS.tooNew);
  if (header.v !== CODE_VERSION) return fail(CODE_ERRORS.notCode);
  if (codeChecksum(`${headerPart}.${payloadPart}`) !== checkPart) return fail(CODE_ERRORS.damaged);

  let bytes: Uint8Array | null;
  try {
    bytes = fromBase64Url(payloadPart);
  } catch {
    return fail(CODE_ERRORS.damaged);
  }
  if (header.z === 'deflate-raw') {
    if (typeof DecompressionStream === 'undefined') return fail(CODE_ERRORS.unsupported);
    try {
      bytes = await pipeBytes(bytes, new DecompressionStream('deflate-raw'), MAX_PAYLOAD_BYTES);
    } catch {
      return fail(CODE_ERRORS.damaged);
    }
    if (!bytes) return fail(CODE_ERRORS.tooLarge);
  } else if (header.z !== 'none') {
    return fail(CODE_ERRORS.notCode);
  }
  if (bytes.length > MAX_PAYLOAD_BYTES) return fail(CODE_ERRORS.tooLarge);

  let payload: unknown;
  try {
    payload = safeParse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    return fail(CODE_ERRORS.damaged);
  }
  if (!isObject(payload) || !isObject(payload.save) || typeof payload.saveVersion !== 'number') {
    return fail(CODE_ERRORS.notCode);
  }
  if (payload.saveVersion > SAVE_VERSION) return fail(CODE_ERRORS.tooNew);
  const exportedAt =
    typeof payload.exportedAt === 'string' && !Number.isNaN(Date.parse(payload.exportedAt))
      ? payload.exportedAt
      : now.toISOString();

  clampFutureDates(payload.save, now);
  const save = sanitizeSave(payload.save, now);
  return isObject(payload.settings)
    ? { ok: true, save, settings: sanitizeSettings(payload.settings), exportedAt }
    : { ok: true, save, exportedAt };
}

/* ---------- import ---------- */

/** 合併 keeps both devices' progress; 完全取代 takes the code's save as it is. */
export type ImportMode = 'merge' | 'replace';

/** The save to write after an import. */
export function importedSave(current: SaveData, imported: SaveData, mode: ImportMode): SaveData {
  return mode === 'merge' ? mergeSaves(current, imported) : imported;
}

/** What the confirmation says: coins and the number of cards studied at least once. */
export function saveSummary(save: SaveData): { coins: number; cards: number } {
  const cards = Object.values(save.cards).filter((card) => card.reps > 0 || card.state > 0).length;
  return { coins: save.coins, cards };
}

/* ---------- last export ---------- */

/** Remembers when the code was last copied or downloaded. */
export function markExported(storage: StorageLike | null, now: Date): void {
  try {
    storage?.setItem(STORAGE_KEYS.lastExport, now.toISOString());
  } catch {
    // storage refused: the reminder just shows again
  }
}

/** Calendar days since the last export, or null if there never was one. */
export function daysSinceExport(storage: StorageLike | null, now: Date): number | null {
  let text: string | null;
  try {
    text = storage?.getItem(STORAGE_KEYS.lastExport) ?? null;
  } catch {
    return null;
  }
  const time = text === null ? NaN : Date.parse(text);
  if (Number.isNaN(time)) return null;
  return Math.max(0, daysBetween(dateKey(new Date(time)), dateKey(now)));
}

/** Days without an export after which the 進度 screen reminds the player. */
export const BACKUP_REMINDER_DAYS = 7;

/**
 * The 進度 screen's reminder: when there is progress to lose and the last export is
 * over BACKUP_REMINDER_DAYS old (or there never was one); else null.
 */
export function backupReminder(save: SaveData, days: number | null): string | null {
  const progress = Object.keys(save.tasks).length > 0 || saveSummary(save).cards > 0;
  if (!progress) return null;
  if (days === null) return '還沒有備份過存檔，可以在設定裡匯出。';
  return days > BACKUP_REMINDER_DAYS ? `已經 ${days} 天沒有備份存檔了，可以在設定裡匯出。` : null;
}

/** File name for a download: lamplit-save-YYYY-MM-DD.txt. */
export const saveFileName = (now: Date): string => `lamplit-save-${dateKey(now)}.txt`;
