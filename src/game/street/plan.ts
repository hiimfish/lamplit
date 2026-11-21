import type { PaletteName } from '../palette';
import { hash2 } from '../painter';

/**
 * Pure layout of the street for a given scene size: where every building,
 * light and loop goes. No drawing here, so it can be tested in Node.
 *
 * The street is seen from the side like a stage: sky, distant buildings,
 * a row of shophouses with an arcade walkway (columns in front), the
 * pavement under the arcade, and the road at the bottom. The cafe is
 * always in the middle.
 */

type ShopKind = 'cafe' | 'noodle' | 'tea' | 'grocery' | 'stair' | 'shutter';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Point {
  x: number;
  y: number;
}

type WindowLight = 'warm' | 'cool' | 'dark';

export interface UpperWindow extends Rect {
  light: WindowLight;
  grille: boolean;
  ac: boolean;
  curtain: boolean;
}

export interface Bay {
  /** 0 for the cafe, negative to the left, positive to the right. */
  index: number;
  kind: ShopKind;
  x: number;
  w: number;
  floors: number;
  wall: PaletteName;
  wallShade: PaletteName;
  windows: UpperWindow[];
  roof: { tank: number | null; shed: Rect | null };
}

interface Lamp {
  x: number;
  headX: number;
  headY: number;
}

interface Tube extends Rect {
  flicker: boolean;
}

export interface StreetPlan {
  width: number;
  height: number;
  floorH: number;
  /** Top of the sign band over the arcade; upper floors stand on it. */
  beamTop: number;
  /** Underside of the beam: the arcade opening starts here. */
  beamBottom: number;
  pavTop: number;
  /** Feet line of people walking under the arcade. */
  groundY: number;
  curbY: number;
  roadTop: number;
  colW: number;
  /** Centre x of every arcade column. */
  columns: number[];
  bays: Bay[];
  cafe: Bay;
  cafeWindow: Rect;
  cafeDoor: Rect;
  counterY: number;
  skyline: Rect[];
  /** Highest covered pixel per column x (sky is above it). */
  skyTop: number[];
  moon: Point & { r: number };
  stars: (Point & { bright: boolean })[];
  twinkles: Point[];
  aviation: Point | null;
  lamps: Lamp[];
  poles: Point[];
  tubes: Tube[];
  neonCup: Point;
  verticalSigns: (Point & { variant: 0 | 1 })[];
  steam: Point[];
  cat: Point;
  plant: Point;
  barista: Point;
  puddle: Point;
  scooters: (Point & { colour: number })[];
  cone: Point | null;
  mailbox: Point | null;
  /** Dark upper windows that light up now and then. */
  toggles: (UpperWindow & { bayIndex: number })[];
  walk: { y: number; startX: number; endX: number; stopX: number };
  passerY: number;
  roadY: number;
}

const SEED = 20251122;

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

interface BayTemplate {
  kind: ShopKind;
  w: number;
  floors: number;
}

/** Shops to the left and right of the cafe, nearest first. */
const LEFT: readonly BayTemplate[] = [
  { kind: 'noodle', w: 72, floors: 3 },
  { kind: 'stair', w: 56, floors: 1 },
  { kind: 'shutter', w: 64, floors: 4 },
  { kind: 'grocery', w: 72, floors: 2 },
  { kind: 'stair', w: 56, floors: 3 },
];
const RIGHT: readonly BayTemplate[] = [
  { kind: 'tea', w: 68, floors: 2 },
  { kind: 'stair', w: 56, floors: 4 },
  { kind: 'grocery', w: 76, floors: 1 },
  { kind: 'shutter', w: 64, floors: 3 },
  { kind: 'noodle', w: 72, floors: 2 },
];

const WALLS: readonly (readonly [PaletteName, PaletteName])[] = [
  ['slate', 'night'],
  ['stone', 'slate'],
  ['dusk', 'indigo'],
  ['night', 'ink'],
];

function upperWindows(bay: Omit<Bay, 'windows' | 'roof'>, beamTop: number, floorH: number) {
  const windows: UpperWindow[] = [];
  const perFloor = bay.w >= 66 ? 2 : 1;
  const winW = perFloor === 2 ? Math.round(bay.w * 0.3) : Math.round(bay.w * 0.46);
  const winH = Math.max(8, Math.round(floorH * 0.5));
  for (let f = 0; f < bay.floors; f++) {
    // The cafe's first floor holds its neon sign instead of windows.
    if (bay.kind === 'cafe' && f === 0) continue;
    const top = beamTop - (f + 1) * floorH + Math.round(floorH * 0.22);
    for (let i = 0; i < perFloor; i++) {
      const slot = bay.w / perFloor;
      const x = Math.round(bay.x + slot * i + (slot - winW) / 2);
      const h = hash2(bay.index * 7 + i, f, SEED);
      const light: WindowLight = h < 0.45 ? 'warm' : h < 0.58 ? 'cool' : 'dark';
      windows.push({
        x,
        y: top,
        w: winW,
        h: winH,
        light,
        grille: hash2(bay.index, f * 3 + i, SEED + 1) < 0.6,
        ac: hash2(bay.index, f * 5 + i, SEED + 2) < 0.5,
        curtain: hash2(bay.index, f * 11 + i, SEED + 3) < 0.5,
      });
    }
  }
  return windows;
}

function layoutBays(width: number, beamTop: number, floorH: number, colW: number): Bay[] {
  const cafeW = width < 320 ? 104 : 120;
  const cafeX = Math.round(width / 2 - cafeW / 2);
  const maxFloors = Math.max(1, Math.floor((beamTop - 2) / floorH));
  const make = (index: number, t: BayTemplate, x: number): Bay => {
    const [wall, wallShade] = WALLS[Math.abs(index * 3 + (index < 0 ? 1 : 0)) % WALLS.length] ?? [
      'stone',
      'slate',
    ];
    const base = {
      index,
      kind: t.kind,
      x,
      w: t.w,
      floors: clamp(t.floors, 1, maxFloors),
      wall,
      wallShade,
    };
    const tankRoll = hash2(index, 1, SEED + 4);
    const shedRoll = hash2(index, 2, SEED + 4);
    return {
      ...base,
      windows: upperWindows(base, beamTop, floorH),
      roof: {
        tank: tankRoll < 0.55 ? x + colW + Math.round(tankRoll * (t.w - colW * 2 - 10)) : null,
        shed:
          shedRoll > 0.55
            ? {
                x: x + Math.round(t.w * 0.45),
                y: beamTop - base.floors * floorH - 7,
                w: Math.round(t.w * 0.45),
                h: 7,
              }
            : null,
      },
    };
  };
  const cafe = make(0, { kind: 'cafe', w: cafeW, floors: 2 }, cafeX);
  cafe.wall = 'plum';
  cafe.wallShade = 'night';
  const bays: Bay[] = [cafe];
  let left = cafeX;
  for (let i = 0; left > 0; i++) {
    const t = LEFT[i % LEFT.length] ?? LEFT[0];
    if (!t) break;
    left -= t.w;
    bays.unshift(make(-(i + 1), t, left));
  }
  let right = cafeX + cafeW;
  for (let i = 0; right < width; i++) {
    const t = RIGHT[i % RIGHT.length] ?? RIGHT[0];
    if (!t) break;
    bays.push(make(i + 1, t, right));
    right += t.w;
  }
  return bays;
}

function layoutSkyline(width: number, beamTop: number, floorH: number): Rect[] {
  const blocks: Rect[] = [];
  const cx = Math.round(width / 2);
  for (const dir of [-1, 1] as const) {
    let x = cx;
    for (let i = 0; dir < 0 ? x > -40 : x < width + 40; i++) {
      const w = 16 + Math.floor(hash2(i, dir, SEED + 10) * 28);
      const tall = 1.6 + hash2(i, dir, SEED + 11) * 2.6;
      const top = Math.max(4, Math.round(beamTop - floorH * tall));
      blocks.push({ x: dir < 0 ? x - w : x, y: top, w, h: beamTop - top });
      x += dir * (w + (hash2(i, dir, SEED + 12) < 0.3 ? 6 : 0));
    }
  }
  return blocks;
}

/** Heights of the horizontal bands (road, pavement, arcade, beam, floors) for a scene size. */
interface Bands {
  small: boolean;
  roadH: number;
  roadTop: number;
  curbY: number;
  pavTop: number;
  groundY: number;
  beamBottom: number;
  beamTop: number;
  floorH: number;
  colW: number;
}

function layoutBands(H: number): Bands {
  const small = H < 150;
  const roadH = clamp(Math.round(H * 0.11), 12, 28);
  const roadTop = H - roadH;
  const curbY = roadTop - 2;
  const pavH = clamp(Math.round(H * 0.075), 9, 18);
  const pavTop = curbY - pavH;
  const groundY = pavTop + Math.round(pavH * 0.5);
  const arcadeH = small ? 36 : H < 230 ? 40 : 46;
  const beamBottom = pavTop - arcadeH;
  const beamTop = beamBottom - (small ? 8 : 10);
  const floorH = small ? 20 : H < 230 ? 28 : 32;
  const colW = small ? 6 : 8;
  return { small, roadH, roadTop, curbY, pavTop, groundY, beamBottom, beamTop, floorH, colW };
}

/** Column centres: the left edge of every bay plus the right edge of the last. */
function layoutColumns(bays: Bay[]): number[] {
  const columns = bays.slice(1).map((b) => b.x);
  columns.unshift(bays[0]?.x ?? 0);
  const lastBay = bays[bays.length - 1];
  if (lastBay) columns.push(lastBay.x + lastBay.w);
  return columns;
}

/** Cafe front: [column][plant][window][door][column]. */
function layoutCafeFront(cafe: Bay, bands: Bands) {
  const { small, beamBottom, pavTop, colW } = bands;
  const inner = beamBottom + 6;
  const doorW = small ? 12 : 14;
  const cafeDoor = {
    x: cafe.x + cafe.w - colW / 2 - 4 - doorW,
    y: inner,
    w: doorW,
    h: pavTop - inner,
  };
  const winX = cafe.x + colW / 2 + 12;
  const cafeWindow = { x: winX, y: inner, w: cafeDoor.x - 4 - winX, h: pavTop - 5 - inner };
  const counterY = cafeWindow.y + Math.round(cafeWindow.h * 0.62);
  return { cafeDoor, cafeWindow, counterY };
}

/** Highest covered pixel per column, from the distant skyline and the shophouse roofs. */
function layoutSkyTop(W: number, bands: Bands, skyline: Rect[], bays: Bay[]): number[] {
  const { beamTop, floorH } = bands;
  const skyTop = Array.from({ length: W }, () => beamTop);
  const cover = (x0: number, x1: number, top: number): void => {
    for (let x = Math.max(0, x0); x < Math.min(W, x1); x++) {
      skyTop[x] = Math.min(skyTop[x] ?? beamTop, top);
    }
  };
  for (const b of skyline) cover(b.x, b.x + b.w, b.y);
  for (const bay of bays) {
    const top = beamTop - bay.floors * floorH;
    cover(bay.x, bay.x + bay.w, top - 2);
    if (bay.roof.tank !== null) cover(bay.roof.tank, bay.roof.tank + 10, top - 10);
    if (bay.roof.shed) cover(bay.roof.shed.x, bay.roof.shed.x + bay.roof.shed.w, bay.roof.shed.y);
  }
  return skyTop;
}

/** The tallest distant block carries a blinking red aviation light. */
function layoutAviation(W: number, skyline: Rect[], skyTop: number[]): Point | null {
  const tallest = skyline
    .filter((b) => b.x + b.w / 2 > 4 && b.x + b.w / 2 < W - 4)
    .reduce<Rect | null>((best, b) => (!best || b.y < best.y ? b : best), null);
  return tallest && tallest.y <= (skyTop[Math.round(tallest.x + tallest.w / 2)] ?? 0)
    ? { x: Math.round(tallest.x + tallest.w / 2), y: tallest.y - 2 }
    : null;
}

/** Moon: over the lowest part of the right half of the sky. */
function layoutMoon(W: number, H: number, small: boolean, skyTop: number[]) {
  const moonR = small ? 3 : 4;
  let moonX = Math.round(W * 0.8);
  for (let x = Math.round(W * 0.58); x < W - 8; x++) {
    if ((skyTop[x] ?? 0) > (skyTop[moonX] ?? 0) + 2) moonX = x;
  }
  const moonY = clamp(
    Math.round(H * 0.08),
    moonR + 2,
    Math.max(moonR + 2, (skyTop[moonX] ?? 0) - moonR - 4),
  );
  return { x: moonX, y: moonY, r: moonR };
}

function layoutStars(
  W: number,
  beamTop: number,
  skyTop: number[],
  moon: Point & { r: number },
): (Point & { bright: boolean })[] {
  const stars: (Point & { bright: boolean })[] = [];
  const starCount = Math.round((W * beamTop) / 900);
  for (let i = 0; i < starCount * 3 && stars.length < starCount; i++) {
    const x = Math.floor(hash2(i, 1, SEED + 20) * W);
    const y = Math.floor(hash2(i, 2, SEED + 20) ** 1.6 * beamTop * 0.7);
    if (y >= (skyTop[x] ?? 0) - 3) continue;
    if (Math.abs(x - moon.x) < moon.r + 4 && Math.abs(y - moon.y) < moon.r + 4) continue;
    stars.push({ x, y, bright: hash2(i, 3, SEED + 20) < 0.25 });
  }
  return stars;
}

/** Street lamp beside the cafe, and another two bays to the right if it fits. */
function layoutLamps(W: number, bands: Bands, bays: Bay[], cafe: Bay): Lamp[] {
  const lamps: Lamp[] = [];
  const lampHeadY = bands.beamTop - Math.round(bands.floorH * 0.7);
  lamps.push({ x: cafe.x, headX: cafe.x + 7, headY: lampHeadY });
  const far = bays.find((b) => b.index === 2);
  if (far && far.x + 12 < W) lamps.push({ x: far.x, headX: far.x + 7, headY: lampHeadY });
  return lamps;
}

function layoutPoles(bands: Bands, cafe: Bay): Point[] {
  const poleTop = Math.max(2, bands.beamTop - Math.round(bands.floorH * 2.2));
  return [
    { x: cafe.x - 40, y: poleTop },
    { x: cafe.x + cafe.w + 100, y: poleTop + 3 },
  ];
}

function layoutTubes(bays: Bay[], beamBottom: number): Tube[] {
  return bays
    .filter((b) => b.kind !== 'cafe')
    .map((b) => ({
      x: Math.round(b.x + b.w / 2 - 5),
      y: beamBottom + 1,
      w: 10,
      h: 1,
      flicker: b.index === 1,
    }));
}

function layoutVerticalSigns(bays: Bay[], bands: Bands): (Point & { variant: 0 | 1 })[] {
  const { beamTop, floorH } = bands;
  const tea = bays.find((b) => b.index === 1);
  const leftShop = bays.find((b) => b.index === -2);
  const signH = 40;
  const verticalSigns: (Point & { variant: 0 | 1 })[] = [];
  if (tea && tea.floors * floorH >= signH - 4) {
    verticalSigns.push({ x: tea.x + tea.w - 4, y: beamTop - signH + 2, variant: 0 });
  }
  if (leftShop && leftShop.floors * floorH >= signH - 4 && leftShop.x - 4 > 0) {
    verticalSigns.push({ x: leftShop.x - 4, y: beamTop - signH + 2, variant: 1 });
  }
  return verticalSigns;
}

function layoutScooters(W: number, bays: Bay[], bands: Bands): (Point & { colour: number })[] {
  const { colW, curbY } = bands;
  const scooters: (Point & { colour: number })[] = [];
  for (const bay of bays) {
    if (bay.kind !== 'stair' && bay.kind !== 'shutter' && bay.kind !== 'grocery') continue;
    const count = Math.min(2, Math.floor((bay.w - 12) / 24));
    for (let k = 0; k < count; k++) {
      const x = bay.x + colW / 2 + 3 + k * 24;
      if (x + 22 < 0 || x > W) continue;
      scooters.push({ x, y: curbY, colour: Math.floor(hash2(bay.index, k, SEED + 30) * 4) });
    }
  }
  return scooters;
}

/** Up to two dark upper windows, fully on screen, that light up now and then. */
function layoutToggles(W: number, bays: Bay[]): (UpperWindow & { bayIndex: number })[] {
  return bays
    .flatMap((b) => b.windows.map((w) => ({ ...w, bayIndex: b.index })))
    .filter((w) => w.light === 'dark' && w.x > 0 && w.x + w.w < W && w.y > 0)
    .slice(0, 2);
}

type CafeFront = ReturnType<typeof layoutCafeFront>;

/** Small props and the paths of the people and the scooter rider. */
function layoutProps(W: number, bands: Bands, bays: Bay[], cafe: Bay, front: CafeFront) {
  const { roadH, roadTop, curbY, pavTop, groundY, colW } = bands;
  const { cafeWindow, counterY } = front;
  const tea = bays.find((b) => b.index === 1);
  const noodle = bays.find((b) => b.index === -1);
  const potX = noodle ? noodle.x + noodle.w - colW / 2 - 18 : cafe.x - 20;
  return {
    steam: [
      { x: potX, y: pavTop - 17 },
      { x: cafeWindow.x + cafeWindow.w - 12, y: counterY - 6 },
    ],
    cat: { x: cafeWindow.x + 9, y: pavTop + 2 },
    plant: { x: cafe.x + colW / 2 + 7, y: pavTop + 2 },
    barista: { x: cafeWindow.x + Math.round(cafeWindow.w * 0.45), y: counterY },
    puddle: { x: cafe.x - 22, y: roadTop + Math.round(roadH * 0.45) },
    scooters: layoutScooters(W, bays, bands),
    cone: noodle ? { x: noodle.x + colW / 2 + 4, y: curbY } : null,
    mailbox: tea && tea.x + tea.w - 14 < W ? { x: tea.x + tea.w - colW / 2 - 14, y: curbY } : null,
    toggles: layoutToggles(W, bays),
    walk: {
      y: groundY,
      startX: -12,
      endX: W + 12,
      stopX: Math.round(cafeWindow.x + cafeWindow.w / 2),
    },
    passerY: groundY + 2,
    roadY: roadTop + Math.round(roadH * 0.72),
  };
}

export function buildStreet(width: number, height: number): StreetPlan {
  const W = Math.max(1, Math.round(width));
  const H = Math.max(1, Math.round(height));
  const bands = layoutBands(H);
  const { roadTop, curbY, pavTop, groundY, beamBottom, beamTop, floorH, colW } = bands;

  const bays = layoutBays(W, beamTop, floorH, colW);
  const cafe = bays.find((b) => b.kind === 'cafe') ?? bays[0];
  if (!cafe) throw new Error('street has no cafe');
  const front = layoutCafeFront(cafe, bands);

  const skyline = layoutSkyline(W, beamTop, floorH);
  const skyTop = layoutSkyTop(W, bands, skyline, bays);
  const moon = layoutMoon(W, H, bands.small, skyTop);
  const stars = layoutStars(W, beamTop, skyTop, moon);

  return {
    width: W,
    height: H,
    floorH,
    beamTop,
    beamBottom,
    pavTop,
    groundY,
    curbY,
    roadTop,
    colW,
    columns: layoutColumns(bays),
    bays,
    cafe,
    cafeWindow: front.cafeWindow,
    cafeDoor: front.cafeDoor,
    counterY: front.counterY,
    skyline,
    skyTop,
    moon,
    stars,
    twinkles: stars.filter((s) => s.bright).slice(0, 2),
    aviation: layoutAviation(W, skyline, skyTop),
    lamps: layoutLamps(W, bands, bays, cafe),
    poles: layoutPoles(bands, cafe),
    tubes: layoutTubes(bays, beamBottom),
    neonCup: { x: Math.round(cafe.x + cafe.w / 2 - 11), y: beamTop - Math.round(floorH / 2) - 10 },
    verticalSigns: layoutVerticalSigns(bays, bands),
    ...layoutProps(W, bands, bays, cafe, front),
  };
}
