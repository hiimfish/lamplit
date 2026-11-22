import { isPaletteName, PALETTE } from '../../game/palette';
import { validateSprite, type PixelSprite } from '../../game/sprites';
import { BANK_ITEMS } from './bank';
import { COMMUNITY_CENTER_ITEMS } from './communityCenter';
import { LIBRARY_ITEMS } from './library';
import { REPAIR_ITEMS } from './repair';
import { JOB_CENTER_ITEMS } from './jobCenter';
import { RESUME_ITEMS } from './resume';
import { INTERVIEW_ITEMS } from './interview';
import { DAY_BEFORE_ITEMS } from './dayBefore';
import { ONBOARDING_ITEMS } from './onboarding';
import { OFFICE_ITEMS } from './office';
import { PHONE_ITEMS } from './phone';
import { EMAIL_ITEMS } from './email';
import { MEETING_ITEMS } from './meeting';
import { PURCHASING_ITEMS } from './purchasing';
import { WAREHOUSE_ITEMS } from './warehouse';
import { CUSTOMER_SERVICE_ITEMS } from './customerService';
import { AIRPORT_ITEMS } from './airport';
import { HOTEL_ITEMS } from './hotel';
import { TRADE_FAIR_ITEMS } from './tradeFair';
import { COMPANY_EVENT_ITEMS } from './companyEvent';
import { CAFE_ITEMS } from './cafe';
import { CLINIC_ITEMS } from './clinic';
import { CLOTHES_ITEMS } from './clothes';
import { ITEM_SIZE } from './draw';
import { MARKET_ITEMS } from './market';
import { MOVE_IN_ITEMS } from './moveIn';
import { PARK_ITEMS } from './park';
import { POST_OFFICE_ITEMS } from './postOffice';
import { RESTAURANT_ITEMS } from './restaurant';
import { STORE_ITEMS } from './store';
import { STREET_ITEMS } from './street';

/**
 * Item icons for word pictures in the HTML UI, drawn like a specimen sheet:
 * one small object on the paper, lit from the upper left like a still life
 * on a table, with a selective coloured outline (lighter on the lit side),
 * a tiny highlight and a soft dithered contact shadow.
 *
 * Each sprite is a string grid ('.' is transparent) plus a legend of palette
 * names, the same format as the street sprites. Keyed by word id.
 *
 * The pictures live in one file per unit (cafe.ts, moveIn.ts, store.ts, ...); the shared
 * drawing helpers are in draw.ts.
 */

export { ITEM_SIZE };

export const ITEM_SPRITES: Readonly<Record<string, PixelSprite>> = {
  ...CAFE_ITEMS,
  ...MOVE_IN_ITEMS,
  ...STORE_ITEMS,
  ...STREET_ITEMS,
  ...MARKET_ITEMS,
  ...CLOTHES_ITEMS,
  ...CLINIC_ITEMS,
  ...RESTAURANT_ITEMS,
  ...POST_OFFICE_ITEMS,
  ...PARK_ITEMS,
  ...BANK_ITEMS,
  ...COMMUNITY_CENTER_ITEMS,
  ...LIBRARY_ITEMS,
  ...REPAIR_ITEMS,
  ...JOB_CENTER_ITEMS,
  ...RESUME_ITEMS,
  ...INTERVIEW_ITEMS,
  ...DAY_BEFORE_ITEMS,
  ...ONBOARDING_ITEMS,
  ...OFFICE_ITEMS,
  ...PHONE_ITEMS,
  ...EMAIL_ITEMS,
  ...MEETING_ITEMS,
  ...PURCHASING_ITEMS,
  ...WAREHOUSE_ITEMS,
  ...CUSTOMER_SERVICE_ITEMS,
  ...AIRPORT_ITEMS,
  ...HOTEL_ITEMS,
  ...TRADE_FAIR_ITEMS,
  ...COMPANY_EVENT_ITEMS,
};

export function getItemSprite(id: string): PixelSprite | undefined {
  return Object.prototype.hasOwnProperty.call(ITEM_SPRITES, id) ? ITEM_SPRITES[id] : undefined;
}

/**
 * Returns a list of problems with an item sprite (empty when it is valid):
 * the street sprite checks plus the fixed size and palette-only legend.
 */
export function validateItemSprite(sprite: PixelSprite): string[] {
  const problems = validateSprite(sprite);
  if (sprite.rows.length !== ITEM_SIZE) {
    problems.push(`sprite is ${sprite.rows.length} tall, expected ${ITEM_SIZE}`);
  }
  const width = sprite.rows[0]?.length ?? 0;
  if (width !== ITEM_SIZE) problems.push(`sprite is ${width} wide, expected ${ITEM_SIZE}`);
  for (const [key, colour] of Object.entries(sprite.legend)) {
    if (key.length !== 1 || key === '.') problems.push(`legend key "${key}" must be one character`);
    if (!isPaletteName(colour))
      problems.push(`legend "${key}" uses "${colour}", not a palette colour`);
  }
  return problems;
}

/** One horizontal run of same-coloured pixels. */
export interface PixelRun {
  x: number;
  y: number;
  w: number;
  color: string;
}

/**
 * Merges each row of a sprite into runs of one colour, so an icon needs far
 * fewer SVG nodes than it has pixels. Neighbouring keys that map to the same
 * colour merge too. Deterministic: rows top to bottom, runs left to right.
 */
export function spriteRuns(sprite: PixelSprite): PixelRun[] {
  const runs: PixelRun[] = [];
  sprite.rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const name = sprite.legend[row[x] ?? '.'];
      if (!name) {
        x++;
        continue;
      }
      let end = x + 1;
      while (end < row.length && sprite.legend[row[end] ?? '.'] === name) end++;
      runs.push({ x, y, w: end - x, color: PALETTE[name] });
      x = end;
    }
  });
  return runs;
}

/** Standalone SVG markup for a sprite (used by tests and handy for previews). */
export function spriteSvg(sprite: PixelSprite): string {
  const w = sprite.rows[0]?.length ?? 0;
  const h = sprite.rows.length;
  const rects = spriteRuns(sprite)
    .map((r) => `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="1" fill="${r.color}"/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${rects}</svg>`;
}
