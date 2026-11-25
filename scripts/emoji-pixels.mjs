#!/usr/bin/env node
/**
 * Turns the emoji of every abstract word (the words with no hand-drawn icon) into
 * 24x24 pixel icons in the game's palette, so no word shows a system emoji.
 *
 * Source pictures: Twemoji (jdecked/twemoji, graphics CC-BY 4.0) from the
 * @twemoji/svg dev dependency. Each SVG is rendered at 10 subpixels per icon pixel
 * into the middle 22x22 of the icon; every subpixel is matched to the nearest palette
 * colour (OKLab), and an icon pixel takes the most common colour of its subpixels
 * (or stays empty when less than half of it is covered). Then the empty pixels that
 * touch the shape get an ink rim, like the hand-drawn icons.
 *
 * Writes src/art/emoji/sprites.ts and .tmp/emoji/preview.html (all icons, with and
 * without the rim, on paper and on ink). Exits 1 if an emoji has no Twemoji picture.
 *
 *   node scripts/emoji-pixels.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import * as prettier from 'prettier';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const UNITS = path.join(ROOT, 'src/data/units');
const SVG_DIR = path.dirname(require.resolve('@twemoji/svg/package.json'));
const OUT = path.join(ROOT, 'src/art/emoji/sprites.ts');
const PREVIEW = path.join(ROOT, '.tmp/emoji/preview.html');

const SIZE = 24;
const INNER = 22;
const SUB = 10;

// ---------------------------------------------------------------------------
// Palette (read from the source so it never drifts)

const paletteSrc = fs.readFileSync(path.join(ROOT, 'src/game/palette.ts'), 'utf8');
const PALETTE = [...paletteSrc.matchAll(/^\s+(\w+): '#([0-9a-f]{6})',/gim)].map(
  ([, name, hex]) => ({
    name,
    rgb: [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)),
  }),
);
if (PALETTE.length < 20) throw new Error(`read only ${PALETTE.length} palette colours`);
const KEYS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const INK = PALETTE.findIndex((c) => c.name === 'ink');

function toLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}
function oklab([r8, g8, b8]) {
  const [r, g, b] = [r8, g8, b8].map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}
const PAL_LAB = PALETTE.map((c) => oklab(c.rgb));
const nearestCache = new Map();
function nearest(r, g, b) {
  const key = (r << 16) | (g << 8) | b;
  const hit = nearestCache.get(key);
  if (hit !== undefined) return hit;
  const [L, A, B] = oklab([r, g, b]);
  let best = 0;
  let bestD = Infinity;
  PAL_LAB.forEach(([l, a, bb], i) => {
    const d = (L - l) ** 2 + (A - a) ** 2 + (B - bb) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  nearestCache.set(key, best);
  return best;
}

// ---------------------------------------------------------------------------
// Which emoji

/** The lookup key: the emoji without variation selectors (U+FE0F). */
const emojiKey = (emoji) => emoji.replace(/️/g, '');

const emojiWords = new Map(); // key -> { emoji, word } (first word, for the preview)
for (const file of fs
  .readdirSync(UNITS)
  .filter((f) => f.endsWith('.json'))
  .sort()) {
  const unit = JSON.parse(fs.readFileSync(path.join(UNITS, file), 'utf8'));
  for (const w of unit.words ?? []) {
    if (!w.abstract || !w.emoji) continue;
    const key = emojiKey(w.emoji);
    if (!emojiWords.has(key)) emojiWords.set(key, { emoji: w.emoji, word: w.en });
  }
}

function svgFile(emoji) {
  const cps = [...emoji].map((ch) => ch.codePointAt(0).toString(16));
  const tries = [
    cps.includes('200d') ? cps : cps.filter((c) => c !== 'fe0f'),
    cps,
    cps.filter((c) => c !== 'fe0f'),
  ];
  for (const t of tries) {
    const file = path.join(SVG_DIR, `${t.join('-')}.svg`);
    if (fs.existsSync(file)) return file;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Rendering

/** SIZE*SIZE palette indexes (-1 empty): each pixel's most common subpixel colour. */
function pixelate(file) {
  const img = new Resvg(fs.readFileSync(file), {
    fitTo: { mode: 'width', value: INNER * SUB },
  }).render();
  const data = img.pixels; // straight RGBA
  const mode = new Array(SIZE * SIZE).fill(-1);
  for (let cy = 0; cy < INNER; cy++) {
    for (let cx = 0; cx < INNER; cx++) {
      const counts = new Map();
      let alpha = 0;
      let solid = 0;
      for (let sy = 0; sy < SUB; sy++) {
        for (let sx = 0; sx < SUB; sx++) {
          const y = cy * SUB + sy;
          if (y >= img.height) continue;
          const i = (y * img.width + cx * SUB + sx) * 4;
          const a = data[i + 3];
          alpha += a;
          if (a < 128) continue;
          solid++;
          const k = nearest(data[i], data[i + 1], data[i + 2]);
          counts.set(k, (counts.get(k) ?? 0) + 1);
        }
      }
      if (alpha / (SUB * SUB) < 127.5 || solid === 0) continue;
      const at = (cy + 1) * SIZE + cx + 1;
      let best = -1;
      let bestN = -1;
      for (const [k, n] of counts) {
        if (n > bestN || (n === bestN && k < best)) {
          best = k;
          bestN = n;
        }
      }
      mode[at] = best;
    }
  }
  return mode;
}

const NEAR = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/** The empty pixels reachable from the edge of the icon (the outside of the shape). */
function outside(cells) {
  const seen = new Array(SIZE * SIZE).fill(false);
  const stack = [];
  for (let i = 0; i < SIZE; i++) stack.push([i, 0], [i, SIZE - 1], [0, i], [SIZE - 1, i]);
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) continue;
    const at = y * SIZE + x;
    if (seen[at] || cells[at] !== -1) continue;
    seen[at] = true;
    for (const [dx, dy] of NEAR) stack.push([x + dx, y + dy]);
  }
  return seen;
}

/**
 * A copy with an ink rim on the empty pixels that touch the shape (4 neighbours).
 * With `holes` false only the outside gets a rim, so the gaps inside a shape (between
 * letters, in a chain link) stay open.
 */
function withRim(cells, holes = false) {
  const out = cells.slice();
  const isOutside = outside(cells);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (cells[y * SIZE + x] !== -1) continue;
      if (!holes && !isOutside[y * SIZE + x]) continue;
      const touches = NEAR.some(([dx, dy]) => {
        const nx = x + dx;
        const ny = y + dy;
        return nx >= 0 && ny >= 0 && nx < SIZE && ny < SIZE && cells[ny * SIZE + nx] !== -1;
      });
      if (touches) out[y * SIZE + x] = INK;
    }
  }
  return out;
}

const encode = (cells) => cells.map((k) => (k === -1 ? '.' : KEYS[k])).join('');

// ---------------------------------------------------------------------------
// Drawn here, 22x22: the symbols that are not emoji (Twemoji has no picture), in the
// style of the converted keycap arrows (a sky key with a paper sign) or a plain disc,
// and fog, whose pale wisps merge into one blank square when scaled down.
// B sky, D denim (key shade), P paper, K ink, F fog.

const HAND_LEGEND = { B: 'sky', D: 'denim', P: 'paper', K: 'ink', F: 'fog' };

function keycap(sign) {
  const rows = [
    `.${'B'.repeat(20)}.`,
    ...Array.from({ length: 19 }, () => `${'B'.repeat(21)}D`),
    'D'.repeat(22),
    `.${'D'.repeat(20)}.`,
  ];
  return rows.map((row, y) => {
    const s = sign[y - 2];
    if (!s) return row;
    return (
      row.slice(0, 2) +
      [...s].map((ch, i) => (ch === 'P' ? 'P' : row[2 + i])).join('') +
      row.slice(20)
    );
  });
}

const blank = '..................';
const HAND = {
  // ≈ nearly
  '≈': keycap([
    blank,
    blank,
    blank,
    blank,
    '....PPP...........',
    '...PPPPP.....PP...',
    '..PP...PPP..PPP...',
    '..PP....PPPPPP....',
    '...........PP.....',
    blank,
    '....PPP...........',
    '...PPPPP.....PP...',
    '..PP...PPP..PPP...',
    '..PP....PPPPPP....',
    '...........PP.....',
  ]),
  // ≠ unlike
  '≠': keycap([
    blank,
    '...........PP.....',
    '..........PP......',
    '..........PP......',
    '..PPPPPPPPPPPPPP..',
    '..PPPPPPPPPPPPPP..',
    '........PP........',
    '........PP........',
    '.......PP.........',
    '..PPPPPPPPPPPPPP..',
    '..PPPPPPPPPPPPPP..',
    '.....PP...........',
    '.....PP...........',
    '....PP............',
  ]),
  // ∴ therefore
  '∴': keycap([
    blank,
    blank,
    '.......PPPP.......',
    '.......PPPP.......',
    '.......PPPP.......',
    '.......PPPP.......',
    blank,
    blank,
    blank,
    '..PPPP......PPPP..',
    '..PPPP......PPPP..',
    '..PPPP......PPPP..',
    '..PPPP......PPPP..',
  ]),
  // 🌫 fog: three drifting wisps, pale on top
  '🌫': [
    '......................',
    '......................',
    '......................',
    '.....PPPPPPPP.........',
    '...PPPPPPPPPPPPPPPP...',
    '...FFFFFFFFFFFFFFFF...',
    '......................',
    '......................',
    '........PPPPPPPPPP....',
    '.PPPPPPPPPPPPPPPPPPPP.',
    '.FFFFFFFFFFFFFFFFFFFF.',
    '......................',
    '......................',
    '...PPPPPPPPPP.........',
    '..PPPPPPPPPPPPPPPPP...',
    '..FFFFFFFFFFFFFFFFF...',
    '......................',
    '......................',
    '.......PPPPPPPPPP.....',
    '.......FFFFFFFFFF.....',
    '......................',
    '......................',
  ],
  // ◐ partially: a disc, left half dark
  '◐': Array.from({ length: 22 }, (_, y) =>
    Array.from({ length: 22 }, (_, x) => {
      const d = (x - 10.5) ** 2 + (y - 10.5) ** 2;
      if (d > 10.5 ** 2) return '.';
      if (d > 9.3 ** 2) return 'K';
      return x <= 10 ? 'K' : 'P';
    }).join(''),
  ),
};

function handCells(rows22) {
  const cells = new Array(SIZE * SIZE).fill(-1);
  rows22.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === '.') return;
      cells[(y + 1) * SIZE + x + 1] = PALETTE.findIndex((c) => c.name === HAND_LEGEND[ch]);
    }),
  );
  return cells;
}

// ---------------------------------------------------------------------------

const missing = [];
const rows = {};
const variants = {};
for (const [key, { emoji, word }] of emojiWords) {
  if (HAND[key]) {
    const cells = handCells(HAND[key]);
    rows[key] = encode(withRim(cells));
    variants[key] = {
      word,
      rim: rows[key],
      bare: encode(cells),
      full: encode(withRim(cells, true)),
    };
    continue;
  }
  const file = svgFile(emoji);
  if (!file) {
    missing.push(`${emoji} (${word})`);
    continue;
  }
  const mode = pixelate(file);
  rows[key] = encode(withRim(mode));
  variants[key] = { word, rim: rows[key], bare: encode(mode), full: encode(withRim(mode, true)) };
}

const legend = Object.fromEntries(PALETTE.map((c, i) => [KEYS[i], c.name]));
const ts = `/**
 * GENERATED by scripts/emoji-pixels.mjs: do not edit by hand.
 *
 * Pixel icons for the emoji of the abstract words, made from Twemoji
 * (https://github.com/jdecked/twemoji, graphics CC-BY 4.0 by Twitter, Inc. and other
 * contributors; scaled down to ${SIZE}x${SIZE} and recoloured to the game's palette).
 * Each value is ${SIZE} rows of ${SIZE} legend keys, joined; '.' is empty.
 * Keyed by emoji without U+FE0F.
 */
import type { PaletteName } from '../../game/palette';

export const EMOJI_LEGEND: Readonly<Record<string, PaletteName>> = ${JSON.stringify(legend)};

export const EMOJI_ROWS: Readonly<Record<string, string>> = {
${Object.entries(rows)
  .map(([k, v]) => `  ${JSON.stringify(k)}: '${v}',`)
  .join('\n')}
};
`;
fs.mkdirSync(path.dirname(OUT), { recursive: true });
const config = (await prettier.resolveConfig(OUT)) ?? {};
fs.writeFileSync(OUT, await prettier.format(ts, { ...config, filepath: OUT }));

// Preview page
const palette = Object.fromEntries(PALETTE.map((c, i) => [KEYS[i], `rgb(${c.rgb.join(',')})`]));
const html = `<!doctype html><meta charset="utf-8"><title>emoji pixels</title>
<style>
body{font:13px sans-serif;background:#ddd;margin:16px}
.grid{display:flex;flex-wrap:wrap;gap:6px}
figure{margin:0;padding:4px;background:#fff;text-align:center;width:max-content}
figure div{display:flex;gap:3px;align-items:center}
canvas{width:48px;height:48px;image-rendering:pixelated}
.paper{background:#f3e9d2}.ink{background:#1d1a2b}
figcaption{font-size:11px}
</style>
<p>${Object.keys(rows).length} icons. 每格：原 emoji｜外框（只描外圍，採用）on paper｜同 on ink｜無外框｜外框也填內部的洞</p>
<div class="grid" id="g"></div>
<script>
const P=${JSON.stringify(palette)};const V=${JSON.stringify(variants)};
function cv(s,cls){const c=document.createElement('canvas');c.width=c.height=${SIZE};c.className=cls;const x=c.getContext('2d');
for(let i=0;i<s.length;i++){const k=s[i];if(k==='.')continue;x.fillStyle=P[k];x.fillRect(i%${SIZE},Math.floor(i/${SIZE}),1,1);}return c}
const g=document.getElementById('g');
for(const [e,v] of Object.entries(V)){const f=document.createElement('figure');const d=document.createElement('div');
const t=document.createElement('span');t.textContent=e;t.style.fontSize='36px';d.append(t,cv(v.rim,'paper'),cv(v.rim,'ink'),cv(v.bare,'paper'),cv(v.full,'paper'));
const c=document.createElement('figcaption');c.textContent=v.word;f.append(d,c);g.append(f)}
</script>`;
fs.mkdirSync(path.dirname(PREVIEW), { recursive: true });
fs.writeFileSync(PREVIEW, html);

console.log(
  `${Object.keys(rows).length} icons -> ${path.relative(ROOT, OUT)}; preview ${path.relative(ROOT, PREVIEW)}`,
);
if (missing.length) {
  console.error(`No Twemoji picture for ${missing.length}: ${missing.join(' ')}`);
  process.exit(1);
}
