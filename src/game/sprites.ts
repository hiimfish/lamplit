import type { PaletteName } from './palette';

/**
 * Tiny sprites defined in code: each character in a row is one pixel,
 * looked up in the legend of the sprite ('.' is transparent).
 */
export interface PixelSprite {
  rows: readonly string[];
  legend: Readonly<Record<string, PaletteName>>;
}

type Legend = Record<string, PaletteName>;
type Point = readonly [x: number, y: number, ch: string];

/** Returns a copy of `rows` with single pixels replaced. */
function stamp(rows: readonly string[], points: readonly Point[]): string[] {
  const grid = rows.map((row) => [...row]);
  for (const [x, y, ch] of points) {
    const row = grid[y];
    if (row && x >= 0 && x < row.length) row[x] = ch;
  }
  return grid.map((row) => row.join(''));
}

function blank(width: number, height: number): string[] {
  return Array.from({ length: height }, () => '.'.repeat(width));
}

// ---------------------------------------------------------------------------
// People: 16x24, side view facing right (flip the image to walk left).
// Rows 0-8 head and neck, 9-16 body, 17-23 legs.
//
// Legend roles: h hair, H hair light, s skin, e eye, w scarf or collar,
// c clothes, d clothes shade, r pattern, a arm, p near leg, q far leg,
// k shoes, b carried bag, B bag shade.

export const PERSON_W = 16;
export const PERSON_H = 24;

const LEGS = {
  // near leg forward
  contactFront: [
    '......qqpp......',
    '.....qq.pp......',
    '.....qq..pp.....',
    '....qq...pp.....',
    '....qq....pp....',
    '...qq.....pp....',
    '...kk.....kkk...',
  ],
  // near leg straight under the body, far leg swinging back
  passNear: [
    '......qqpp......',
    '......qqpp......',
    '.....qq.pp......',
    '....qq..pp......',
    '....kk..pp......',
    '........pp......',
    '........kkk.....',
  ],
  // near leg back
  contactBack: [
    '......ppqq......',
    '.....pp.qq......',
    '.....pp..qq.....',
    '....pp...qq.....',
    '....pp....qq....',
    '...pp.....qq....',
    '...kk.....kkk...',
  ],
  // far leg straight, near leg swinging back
  passFar: [
    '......ppqq......',
    '......ppqq......',
    '.....pp.qq......',
    '....pp..qq......',
    '....kk..qq......',
    '........qq......',
    '........kkk.....',
  ],
  stand: [
    '......qqpp......',
    '......qqpp......',
    '......qqpp......',
    '......qqpp......',
    '......qqpp......',
    '......qqpp......',
    '......kkkkk.....',
  ],
} as const;

type ArmPose = 'back' | 'neutral' | 'forward';

const ARMS: Record<ArmPose, { points: Point[]; hand: readonly [number, number] }> = {
  back: {
    points: [
      [7, 10, 'a'],
      [6, 11, 'a'],
      [5, 12, 'a'],
      [4, 13, 'a'],
      [4, 14, 's'],
    ],
    hand: [4, 14],
  },
  neutral: {
    points: [
      [7, 10, 'a'],
      [7, 11, 'a'],
      [7, 12, 'a'],
      [7, 13, 'a'],
      [8, 14, 'a'],
      [8, 15, 's'],
    ],
    hand: [8, 15],
  },
  forward: {
    points: [
      [8, 10, 'a'],
      [9, 11, 'a'],
      [10, 12, 'a'],
      [11, 13, 'a'],
      [11, 14, 's'],
    ],
    hand: [11, 14],
  },
};

/** The four walk frames: legs and the opposite arm swing. */
const WALK_POSES: readonly { legs: readonly string[]; arm: ArmPose }[] = [
  { legs: LEGS.contactFront, arm: 'back' },
  { legs: LEGS.passNear, arm: 'neutral' },
  { legs: LEGS.contactBack, arm: 'forward' },
  { legs: LEGS.passFar, arm: 'neutral' },
];

interface PersonDef {
  head: readonly string[];
  body: readonly string[];
  legend: Legend;
  /** Something hanging from the hand, drawn relative to the hand. */
  carry?: readonly Point[];
}

const PEOPLE: Record<string, PersonDef> = {
  // The protagonist: a bob haircut, a long amber coat, a paper-white scarf
  // and a tote bag on the shoulder.
  walker: {
    head: [
      '................',
      '......hhhh......',
      '.....hHhhhh.....',
      '....hhhhhhhh....',
      '....hhhhhhss....',
      '....hhhhhsess...',
      '....hhhhssss....',
      '.....hhhsss.....',
      '.....wwwww......',
    ],
    body: [
      '....wdccccc.....',
      '....wdccccc.....',
      '.....dccccc.....',
      '...bbdccccc.....',
      '...bbbccccc.....',
      '...bBbccccc.....',
      '...bbbccccc.....',
      '.....dddddd.....',
    ],
    legend: {
      h: 'ink',
      H: 'stone',
      s: 'skin',
      e: 'ink',
      w: 'paper',
      c: 'amber',
      d: 'ember',
      a: 'ember',
      b: 'fog',
      B: 'concrete',
      p: 'denim',
      q: 'indigo',
      k: 'ink',
    },
  },
  // A quick office worker in a navy suit with a briefcase.
  worker: {
    head: [
      '................',
      '................',
      '......hhhh......',
      '.....hhhhhh.....',
      '.....hhhhhss....',
      '.....hhhssess...',
      '.....hhsssss....',
      '......sssss.....',
      '......wwww......',
    ],
    body: [
      '.....dccccw.....',
      '.....dccccw.....',
      '.....dccccc.....',
      '.....dccccc.....',
      '.....dccccc.....',
      '.....dccccc.....',
      '.....dddddd.....',
      '.....pppppp.....',
    ],
    legend: {
      h: 'ink',
      s: 'tan',
      e: 'ink',
      w: 'paper',
      c: 'denim',
      d: 'indigo',
      a: 'indigo',
      p: 'slate',
      q: 'night',
      k: 'ink',
      b: 'ember',
      B: 'amber',
    },
    carry: [
      [0, 1, 'B'],
      [-1, 2, 'b'],
      [0, 2, 'b'],
      [1, 2, 'b'],
      [2, 2, 'b'],
      [-1, 3, 'b'],
      [0, 3, 'b'],
      [1, 3, 'b'],
      [2, 3, 'b'],
    ],
  },
  // A neighbourhood auntie with a grey perm, a flowery blouse and a red
  // plastic bag from the market.
  auntie: {
    head: [
      '................',
      '................',
      '.....hhhhh......',
      '....hHhhhhh.....',
      '...hhhhhhhhh....',
      '...hhhhhhsess...',
      '...hhhhhssss....',
      '....hhhssss.....',
      '......wwww......',
    ],
    body: [
      '.....dccccc.....',
      '....dccrcccc....',
      '....dcccccrc....',
      '....dcrccccc....',
      '....dccccrcc....',
      '....dccccccc....',
      '....dcrccccc....',
      '.....pppppp.....',
    ],
    legend: {
      h: 'fog',
      H: 'paper',
      s: 'skin',
      e: 'ink',
      w: 'rosy',
      c: 'mauve',
      d: 'violet',
      r: 'rosy',
      a: 'violet',
      p: 'dusk',
      q: 'indigo',
      k: 'ink',
      b: 'red',
      B: 'maroon',
    },
    carry: [
      [-1, 1, 'B'],
      [1, 1, 'B'],
      [-1, 2, 'b'],
      [0, 2, 'b'],
      [1, 2, 'b'],
      [-1, 3, 'b'],
      [0, 3, 'b'],
      [1, 3, 'b'],
      [0, 4, 'B'],
    ],
  },
};

export const PERSON_IDS = Object.keys(PEOPLE);

function personFrame(def: PersonDef, legs: readonly string[], arm: ArmPose): PixelSprite {
  const pose = ARMS[arm];
  let rows = stamp([...def.head, ...def.body, ...legs], pose.points);
  if (def.carry) {
    const [hx, hy] = pose.hand;
    rows = stamp(
      rows,
      def.carry.map(([dx, dy, ch]) => [hx + dx, hy + dy, ch] as const),
    );
  }
  return { rows, legend: def.legend };
}

export const WALK_FRAMES = WALK_POSES.length;

export function walkKey(id: string, frame: number): string {
  return `${id}_walk_${frame}`;
}

export function idleKey(id: string): string {
  return `${id}_idle`;
}

function peopleSprites(): Record<string, PixelSprite> {
  const result: Record<string, PixelSprite> = {};
  for (const [id, def] of Object.entries(PEOPLE)) {
    WALK_POSES.forEach((pose, i) => {
      result[walkKey(id, i)] = personFrame(def, pose.legs, pose.arm);
    });
    result[idleKey(id)] = personFrame(def, LEGS.stand, 'neutral');
  }
  return result;
}

/** The protagonist seen from behind, looking into the cafe window. */
const WALKER_BACK: PixelSprite = {
  rows: [
    '................',
    '......hhhh......',
    '.....hhHhhh.....',
    '.....hhhhhh.....',
    '.....hhhhhh.....',
    '.....hhhhhh.....',
    '.....hhhhhh.....',
    '......hhhh......',
    '.....wwwwww.....',
    '....awwccccab...',
    '....acwccccab...',
    '....accccccab...',
    '....accccccabb..',
    '....acccdcca.bb.',
    '....acccdccaBb..',
    '....acccdcca.b..',
    '....sddddddds...',
    '......pp.pp.....',
    '......pp.pp.....',
    '......pp.pp.....',
    '......pp.pp.....',
    '......pp.pp.....',
    '......pp.pp.....',
    '.....kkk.kkk....',
  ],
  legend: {
    h: 'ink',
    H: 'stone',
    s: 'skin',
    w: 'paper',
    c: 'amber',
    d: 'ember',
    a: 'ember',
    b: 'fog',
    B: 'concrete',
    p: 'denim',
    k: 'ink',
  },
};

// ---------------------------------------------------------------------------
// The cafe cat: a small calico sitting by the door, facing right.

const CAT_BODY = [
  '..........a..a',
  '..........aaaa',
  '..........aaka',
  '..........pppp',
  '.........ppp..',
  '.......kkppp..',
  '......kkkppp..',
  '.....aakkpppp.',
  '.....aaaapppp.',
  '.....aaaapppp.',
  '.....ppppppppp',
];
const CAT_LEGEND: Legend = { a: 'amber', k: 'ink', p: 'paper' };
const CAT_TAILS: readonly Point[][] = [
  [
    [4, 10, 'k'],
    [3, 10, 'k'],
    [2, 10, 'k'],
    [1, 9, 'k'],
    [1, 8, 'k'],
  ],
  [
    [4, 10, 'k'],
    [3, 9, 'k'],
    [2, 8, 'k'],
    [2, 7, 'k'],
    [3, 6, 'k'],
  ],
  [
    [4, 10, 'k'],
    [3, 10, 'k'],
    [2, 9, 'k'],
    [1, 8, 'k'],
    [0, 7, 'k'],
  ],
];

function catSprites(): Record<string, PixelSprite> {
  const result: Record<string, PixelSprite> = {};
  CAT_TAILS.forEach((tail, i) => {
    result[`cat_${i}`] = { rows: stamp(CAT_BODY, tail), legend: CAT_LEGEND };
  });
  const tail = CAT_TAILS[0] ?? [];
  result.cat_blink = { rows: stamp(CAT_BODY, [...tail, [12, 2, 'a']]), legend: CAT_LEGEND };
  return result;
}

// ---------------------------------------------------------------------------
// Small loops: steam, puddle ripples, a swaying plant, the barista.

export const STEAM_FRAMES = 4;

function steamSprite(frame: number): PixelSprite {
  const rows = blank(5, 9).map((row, r) => {
    const u = r + frame * 2;
    if (r === 0 || u % 7 > 4) return row;
    const x = 2 + Math.round(Math.sin(u * 0.9) * 1.2);
    const ch = r < 4 ? 't' : 'f';
    return row.slice(0, x) + ch + row.slice(x + 1);
  });
  return { rows, legend: { f: 'fog', t: 'concrete' } };
}

const RIPPLES: readonly string[][] = [
  ['...........', '.....f.....', '...........'],
  ['....fff....', '...f...f...', '....fff....'],
  ['..sssssss..', '.s.......s.', '..sssssss..'],
  ['.tt.....tt.', 't.........t', '.tt.....tt.'],
  ['...........', '...........', '...........'],
];
export const RIPPLE_FRAMES = RIPPLES.length;

const PLANT = [
  '....l....',
  '...ll.l..',
  '..lml.ll.',
  '.llmlll..',
  '..lmmll.l',
  'l.lmlmll.',
  '.llmmmll.',
  '..llmml..',
  '...lml...',
  '....m....',
  '.ooooooo.',
  '..odddd..',
  '..odddd..',
  '...ddd...',
];

/** Shifts the top `count` rows of a sprite one pixel to the right. */
function swayTop(rows: readonly string[], count: number): string[] {
  return rows.map((row, i) => (i < count ? `.${row.slice(0, -1)}` : row));
}

const BARISTA = [
  '...hhhh...',
  '..hhhhhh..',
  '..hssssh..',
  '..hssssh..',
  '...ssss...',
  '....ss....',
  '.bbbbbbbb.',
  'bbbwbbwbbb',
  'bbbwwwwbbb',
  'bbbwwwwbbb',
  'bbbwwwwbbb',
  'bbbwwwwbbb',
];
const BARISTA_LEGEND: Legend = { h: 'ink', s: 'tan', b: 'plum', w: 'paper' };

// ---------------------------------------------------------------------------
// Scooters: parked ones in four colours and one rider crossing the road.

const SCOOTER = [
  '................kk....',
  '................k.....',
  '...............kbb....',
  '..ssssssssss...bbbh...',
  '.bbbbbbbbbbbb..bbbb...',
  '.bbbbbbbbbbbbb.bbbb...',
  '.rbbbbbbbbbbbbbbbbb...',
  '..dbbbbbbd.....bbbb...',
  '..ddddddd.......ddd...',
  '...kkkk........kkkk...',
  '..kkffkk......kkffkk..',
  '...kkkk........kkkk...',
];

const SCOOTER_COLOURS: readonly (readonly [PaletteName, PaletteName])[] = [
  ['red', 'maroon'],
  ['fog', 'stone'],
  ['sky', 'denim'],
  ['teal', 'moss'],
];

function scooterLegend(body: PaletteName, shade: PaletteName, light: PaletteName): Legend {
  return { s: 'ink', b: body, d: shade, r: 'red', h: light, k: 'ink', f: 'stone' };
}

const RIDER_TOP = [
  '........yyyy..........',
  '.......yyyyyy.........',
  '.......hhhsss.........',
  '........hssss.........',
  '........jjjj..........',
  '.......jjjjjj.........',
  '.......jjjjjjj........',
  '.......jjjjj.jj.......',
  '.......jjjjj...jj.....',
  '.......jjjjj.....s....',
];

function riderSprite(): PixelSprite {
  const legs: Point[] = [];
  for (let y = 0; y < 3; y++) for (let x = 7; x <= 13; x++) legs.push([x, y, 'p']);
  for (let y = 3; y < 6; y++) legs.push([13, y, 'p'], [14, y, 'p']);
  legs.push([13, 6, 'k'], [14, 6, 'k'], [15, 6, 'k']);
  return {
    rows: [...RIDER_TOP, ...stamp(SCOOTER, legs)],
    legend: {
      ...scooterLegend('paper', 'fog', 'honey'),
      y: 'lamp',
      h: 'ink',
      s: 'skin',
      j: 'teal',
      p: 'night',
      k: 'ink',
      H: 'honey',
    },
  };
}

// The rider legend reuses 'h' for hair, so the headlight is re-stamped as 'H'.
function riderWithLight(): PixelSprite {
  const sprite = riderSprite();
  return { ...sprite, rows: stamp(sprite.rows, [[18, RIDER_TOP.length + 3, 'H']]) };
}

/** A fluorescent tube that has blinked off. */
const TUBE_OFF: PixelSprite = { rows: ['ssssssssss'], legend: { s: 'stone' } };

export const SPRITES: Readonly<Record<string, PixelSprite>> = {
  ...peopleSprites(),
  walker_back: WALKER_BACK,
  ...catSprites(),
  ...Object.fromEntries(
    Array.from({ length: STEAM_FRAMES }, (_, i) => [`steam_${i}`, steamSprite(i)]),
  ),
  ...Object.fromEntries(
    RIPPLES.map((rows, i) => [`ripple_${i}`, { rows, legend: { f: 'fog', s: 'sky', t: 'stone' } }]),
  ),
  plant_0: { rows: PLANT, legend: { l: 'leaf', m: 'moss', o: 'amber', d: 'ember' } },
  plant_1: { rows: swayTop(PLANT, 6), legend: { l: 'leaf', m: 'moss', o: 'amber', d: 'ember' } },
  barista_0: { rows: BARISTA, legend: BARISTA_LEGEND },
  barista_1: {
    rows: stamp(BARISTA, [
      [8, 6, 'b'],
      [9, 5, 'b'],
      [9, 4, 'b'],
      [8, 3, 's'],
      [9, 3, 's'],
    ]),
    legend: BARISTA_LEGEND,
  },
  barista_2: {
    rows: stamp(BARISTA, [
      [2, 2, 'h'],
      [2, 3, 'h'],
      [3, 2, 'h'],
      [7, 2, 's'],
      [7, 3, 's'],
      [8, 3, 's'],
    ]),
    legend: BARISTA_LEGEND,
  },
  ...Object.fromEntries(
    SCOOTER_COLOURS.map(([body, shade], i) => [
      `scooter_${i}`,
      { rows: SCOOTER, legend: scooterLegend(body, shade, 'fog') },
    ]),
  ),
  rider: riderWithLight(),
  tube_off: TUBE_OFF,
};

/** Returns a list of problems with a sprite definition (empty when it is valid). */
export function validateSprite(sprite: PixelSprite): string[] {
  const problems: string[] = [];
  const width = sprite.rows[0]?.length ?? 0;
  if (width === 0) problems.push('sprite has no pixels');
  sprite.rows.forEach((row, y) => {
    if (row.length !== width) problems.push(`row ${y} is ${row.length} wide, expected ${width}`);
    for (const ch of row) {
      if (ch !== '.' && !(ch in sprite.legend)) problems.push(`row ${y} uses unknown key "${ch}"`);
    }
  });
  return problems;
}
