import { isPaletteName, PALETTE } from '../game/palette';
import { ditherOn } from '../game/painter';
import { validateSprite, type PixelSprite } from '../game/sprites';

/**
 * Item icons for word pictures in the HTML UI, drawn like a specimen sheet:
 * one small object on the paper, lit from the upper left like a still life
 * on a table, with a selective coloured outline (lighter on the lit side),
 * a tiny highlight and a soft dithered contact shadow.
 *
 * Each sprite is a string grid ('.' is transparent) plus a legend of palette
 * names, the same format as the street sprites. Keyed by word id.
 */

export const ITEM_SIZE = 24;

type Point = readonly [x: number, y: number, ch: string];

interface Shadow {
  /** Centre and radii of the shadow ellipse, in pixels. */
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** Legend key the shadow is painted with. */
  key: string;
}

/** Returns a copy of `rows` with single pixels replaced. */
function stamp(rows: readonly string[], points: readonly Point[]): string[] {
  const grid = rows.map((row) => [...row]);
  for (const [x, y, ch] of points) {
    const row = grid[y];
    if (row && x >= 0 && x < row.length) row[x] = ch;
  }
  return grid.map((row) => row.join(''));
}

/**
 * Adds a soft contact shadow on the empty pixels of an ellipse: solid near
 * the centre, then two ordered-dither steps that fade out towards the rim.
 */
function withShadow(rows: readonly string[], s: Shadow): string[] {
  const points: Point[] = [];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] !== '.') continue;
      const d = ((x + 0.5 - s.cx) / s.rx) ** 2 + ((y + 0.5 - s.cy) / s.ry) ** 2;
      const level = d < 0.3 ? 16 : d < 0.65 ? 8 : d < 1 ? 3 : 0;
      if (level > 0 && ditherOn(x, y, level)) points.push([x, y, s.key]);
    }
  });
  return stamp(rows, points);
}

// ---------------------------------------------------------------------------
// Latte: a cream cup of latte with a heart on top, on a saucer, steaming.
// O lit outline, o shade outline, w glaze, g glaze shade, G deep shade,
// C crema rim, c crema, h crema light, z shadow.

const LATTE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.........g...g..........',
      '........g...g...........',
      '.........g...g..........',
      '......OOOOOOOOOO........',
      '....OOwgggggggggoo......',
      '...OwgCCCCCCCCCCggo.....',
      '...OwCchwwcwwcccCgo.....',
      '...OwCchwwwwwcccCgo.....',
      '...OwCcccwwwccccCgo.....',
      '...OwwCcccwccccCggo.....',
      '...OwwwCCCCCCCCgggo.....',
      '...Owwwwwwwwwwwgggoooo..',
      '...OgwwwwwwwgggGGgoggGo.',
      '....OgwwwwwwgggGGoo..Go.',
      '.....OgwwwwwggGGooogGo..',
      '......OgwwwwggGo..ooo...',
      '..OOOwwooooooooggggooo..',
      '.OwwwwwgggGGGGGgggggggo.',
      '.OwwwwwwwwwwwwggggggGGo.',
      '..oggggggggggggGGGGGGo..',
      '....oooooooooooooooo....',
      '........................',
      '........................',
    ],
    { cx: 12.5, cy: 21.5, rx: 11.5, ry: 2.4, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    G: 'concrete',
    C: 'ember',
    c: 'amber',
    h: 'honey',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Tea: a round glazed teapot with a gold band, spout left, handle right.
// O lit outline, o shade outline, L glaze, M glaze shade, w glint,
// t reflected light, y gold band, a gold shade, z shadow.

const TEA: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '...........Oo...........',
      '..........OLMo..........',
      '........OOLLMMoo........',
      '.......OwLLLLMMMo.......',
      '......Oyyyyyyyyaao......',
      'OO...OLwwLLLLLLMMMo.....',
      'OLO.OLwwwLLLLLLMMMMooo..',
      '.OLOOLwwLLLLLLLMMMMoMMo.',
      '..OLLLwLLLLLLLLMMMMo.Mo.',
      '..OLLLLLLLLLLLLMMMMo.Mo.',
      '...oOLLLLLLLLLMMMMto.Mo.',
      '....OLLLLLLLLMMMMMtoMMo.',
      '.....OLLLLLLMMMMMtoooo..',
      '......OMLLLMMMMMto......',
      '.......oMMMMMMMto.......',
      '........oooooooo........',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12.5, cy: 19.2, rx: 9.5, ry: 2, key: 'z' },
  ),
  legend: {
    O: 'moss',
    o: 'ink',
    L: 'leaf',
    M: 'moss',
    w: 'paper',
    t: 'teal',
    y: 'lamp',
    a: 'amber',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Muffin: a golden dome with blueberries over a pleated paper case.
// O lit outline, o shade outline, h crumb light, l crumb lit, a crumb,
// e crumb shade, s berry glint, b berry, B berry shade, p case, P case pleat,
// n case shade, x case outline, z shadow.

function berry(x: number, y: number): Point[] {
  return [
    [x, y, 's'],
    [x + 1, y, 'b'],
    [x, y + 1, 'b'],
    [x + 1, y + 1, 'B'],
  ];
}

const MUFFIN: PixelSprite = {
  rows: withShadow(
    stamp(
      [
        '........................',
        '........................',
        '........................',
        '.........OOOOOO.........',
        '.......OOlhhhllao.......',
        '.....OOlhhhllllaaao.....',
        '....Olhhlllllaaaaaeo....',
        '...Olhllllllaaaaaaeeo...',
        '...Ollllllaaaaaaaaeeo...',
        '..Olllllaaaaaaaaaaeeeo..',
        '..Ollllaaaaaaaaaaaeeeo..',
        '..Oallaaaaaaaaaaaeeeeo..',
        '...oeaaaeeaaaeeeeeeeo...',
        '....oooooooooooooooo....',
        '.....xpPpPpPpPpnPnx.....',
        '.....xpPpPpPpPpnPnx.....',
        '......xpPpPpPpnPnx......',
        '......xpPpPpPpnPnx......',
        '.......xPpPpPnPnx.......',
        '.......xxxxxxxxxx.......',
        '........................',
        '........................',
        '........................',
        '........................',
      ],
      [...berry(6, 8), ...berry(11, 6), ...berry(15, 8), ...berry(10, 10), ...berry(17, 11)],
    ),
    { cx: 12.5, cy: 20, rx: 9, ry: 2, key: 'z' },
  ),
  legend: {
    O: 'ember',
    o: 'plum',
    h: 'honey',
    l: 'lamp',
    a: 'amber',
    e: 'ember',
    s: 'sky',
    b: 'denim',
    B: 'deep',
    p: 'rosy',
    P: 'mauve',
    n: 'neonDeep',
    x: 'maroon',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Water: a tall tumbler two-thirds full, with a glint and two bubbles.
// O lit rim, o shade rim, g glass tint, w glint, c water light, k water,
// d water shade, i deep water, z shadow.

const WATER: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........OOOOOOOO........',
      '......OO........oo......',
      '......Oggggggggggo......',
      '......Og........go......',
      '......Og........go......',
      '......Og........go......',
      '......Ogkkkkkkkkgo......',
      '......Owcccwwcccko......',
      '......Owccckkkkkdo......',
      '......Owckkkkkkddo......',
      '.......Owckkkkkdo.......',
      '.......Owckkkwkdo.......',
      '.......Owckkkkddo.......',
      '.......Owckwkkddo.......',
      '.......Owckkkkddo.......',
      '.......Owkkkkdddo.......',
      '.......Owkkkddido.......',
      '.......Ogwwggggko.......',
      '........Oooooooo........',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12.5, cy: 20.2, rx: 7.5, ry: 2, key: 'z' },
  ),
  legend: {
    O: 'sky',
    o: 'denim',
    g: 'fog',
    w: 'paper',
    c: 'cyan',
    k: 'sky',
    d: 'denim',
    i: 'indigo',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Cake: a wedge of strawberry shortcake on a plate, tip to the left, the cut
// face showing sponge and cream layers.
// E cake outline, f cream, g cream shade, G cream deep, h sponge light,
// y sponge, a sponge shade, n berry light, r berry, M berry shade, w seed,
// v leaf, V leaf shade, O plate lit rim, o plate shade rim, z shadow.
// The plate reuses f/g/G for its glaze.

const CAKE: PixelSprite = {
  rows: withShadow(
    [
      '................V.......',
      '...............VvV......',
      '..............rnrrM.....',
      '.............rnwrrrM....',
      '.............MrrrwrM....',
      '.............EfMrrMfE...',
      '.............EffffggE...',
      '..........EEEfffffggE...',
      '.......EEEffffffffggE...',
      '....EEEfffffffffffggE...',
      '...EfffffffffffffgggE...',
      '...EfffffffffffgggggE...',
      '...EhhhhhhhhhyyyyyaaE...',
      '...EhhyhhhhhyhhyyayaE...',
      '...EfrrfffnrfffrrgGGE...',
      '...EhhhhhhhhhhyyyyaaE...',
      '.OOEyyyyyyyyyyyaaaaaEoo.',
      'OwwEEEEEEEEEEEEEEEEEEggo',
      'OwwwggGGGGGGGGGGGGGGGggo',
      'OwwwwwwwwwwwwwwggggggGGo',
      '.oggggggggggggGGGGGGGo..',
      '...oooooooooooooooooo...',
      '........................',
      '........................',
    ],
    { cx: 12.5, cy: 21.6, rx: 11.5, ry: 2, key: 'z' },
  ),
  legend: {
    E: 'ember',
    f: 'paper',
    g: 'fog',
    G: 'concrete',
    h: 'honey',
    y: 'lamp',
    a: 'amber',
    n: 'neon',
    r: 'red',
    M: 'maroon',
    w: 'paper',
    v: 'leaf',
    V: 'moss',
    O: 'stone',
    o: 'slate',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Sandwich: a triangle half standing on its crust, the cut face showing
// lettuce, tomato and cheese between two slices.
// A crust outline, a crust, w crumb, h crumb shade, L lettuce, r tomato,
// y cheese, z shadow.

const SANDWICH: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '.....L..................',
      '..AALLlAAA..............',
      '..AaaaaaaA..............',
      '..AahLLryhA.............',
      '..AahhLlryhA............',
      '..AahLhLLryhA...........',
      '..AawhhhLlryhA..........',
      '..AawwhhhLLryhA.........',
      '..AawwwhLhLlryhA........',
      '..AawwwhhhhLLryhA.......',
      '..AawwwwwhhhLlryhA......',
      '..AawwwwwwhLhLLryhA.....',
      '..AawwwwwwwhhhLlryhA....',
      '..AawwwwhwwwhhhLLryhA...',
      '..AawwwwwwwwwhLhLlryhA..',
      '..AaaaaaaaaaaaaaaLLryhA.',
      '..AAAAAAAAAAAAAAAALlAAAA',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 13, cy: 19.6, rx: 11.5, ry: 2, key: 'z' },
  ),
  legend: {
    A: 'ember',
    a: 'amber',
    w: 'paper',
    h: 'honey',
    L: 'leaf',
    l: 'moss',
    r: 'red',
    y: 'lamp',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Key: a brass key lying flat, round bow with a hole, two teeth at the tip.
// E lit outline, P shade outline, h light, y brass, a brass shade, w glint, z shadow.

const KEY: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '....EEEEP...............',
      '...EhhhhyP..............',
      '..EwhhPyyyP.............',
      '.EhhhP.PyyyP............',
      '.EhhP...PyyaEEEEEEEEEEP.',
      '.EhP.....EaaaawaaaaaaaP.',
      '.EhyP...EaaaaaaaaaaaaaP.',
      '.PyyyP.EaaaPPPPaaaPaaaP.',
      '..PyyyEaaaP....EaP.EaP..',
      '...PyyaaaP.....EaP.EaP..',
      '....PPPPP......PPP.EaP..',
      '...................PPP..',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12.5, cy: 18.6, rx: 11, ry: 2.2, key: 'z' },
  ),
  legend: {
    y: 'lamp',
    h: 'honey',
    a: 'amber',
    E: 'ember',
    P: 'plum',
    w: 'paper',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Box: a taped cardboard moving box in three-quarter view with a paper label.
// E lit outline, P shade outline, s top, t front, e side, u fold shade, w tape/label,
// g tape shade and label writing, z shadow.

const BOX: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........EEEEEEEEEEEEEP..',
      '.......EsssswwwssssssP..',
      '......EsssswwwsssssseP..',
      '.....EsssswwwsssssseeP..',
      '....EsssswwwsssssseeeP..',
      '...EsssswwwsssssseeeeP..',
      '..EuuuuuwwguuuuueeeeeP..',
      '..EtttttwwgttttteeeeeP..',
      '..EtttttwwgttttteeeeeP..',
      '..EtttttwwgttttteeeeeP..',
      '..EtttttwwgttttteeeeeP..',
      '..EttttttttttttteeeeeP..',
      '..EtwwwwwwwttttteeeeeP..',
      '..EtwggggwwttttteeeeP...',
      '..EtwgggwwwttttteeeP....',
      '..EtwwwwwwwttttteeP.....',
      '..EttttttttttttteP......',
      '..PPPPPPPPPPPPPPP.......',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12.5, cy: 21, rx: 11.5, ry: 2, key: 'z' },
  ),
  legend: {
    t: 'tan',
    s: 'skin',
    e: 'ember',
    u: 'amber',
    w: 'paper',
    g: 'fog',
    E: 'ember',
    P: 'plum',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Door: a wooden front door in a stone frame, two sunken panels, brass knob.
// O lit outline, o shade outline, f frame light, c frame, S frame shade, h wood light,
// a wood, e wood shade, y knob, w glint, z shadow.

const DOOR: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '....OOOOOOOOOOOOOOOo....',
      '....OfccccccccccccSo....',
      '....OfhaaaaaaaaaaeSo....',
      '....OfhaaaaaaaaaaeSo....',
      '....OfhaeeeeeeehaeSo....',
      '....OfhaeaaaaaahaeSo....',
      '....OfhaeaaaaaahaeSo....',
      '....OfhaeaaaaaahaeSo....',
      '....OfhaeaaaaaahaeSo....',
      '....OfhaeaaaaaahaeSo....',
      '....OfhahhhhhhhwaeSo....',
      '....OfhaaaaaaaayyeSo....',
      '....OfhaaaaaaaaaEeSo....',
      '....OfhaeeeeeeehaeSo....',
      '....OfhaeaaaaaahaeSo....',
      '....OfhaeaaaaaahaeSo....',
      '....OfhaeaaaaaahaeSo....',
      '....OfhaeaaaaaahaeSo....',
      '....OfhahhhhhhhhaeSo....',
      '....OfhaaaaaaaaaaeSo....',
      '...oooooooooooooooooo...',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 22.3, rx: 11.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    c: 'concrete',
    S: 'stone',
    f: 'fog',
    a: 'amber',
    h: 'honey',
    e: 'ember',
    E: 'ember',
    y: 'lamp',
    w: 'paper',
    O: 'stone',
    o: 'slate',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Chair: a wooden chair with a red seat cushion, seen from the front.
// E lit outline, P shade outline, h wood light, a wood, e back legs, r cushion,
// m cushion shade, n cushion glint, z shadow.

const CHAIR: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.....EEEEEEEEEEEEEP.....',
      '.....EhhhhhhhhhhhhP.....',
      '.....EhaPPPPPPPPaaP.....',
      '.....EhP........EaP.....',
      '.....EhP........EaP.....',
      '.....EhaEEEEEEEEaaP.....',
      '.....EhaPPPPPPPPaaP.....',
      '.....EhP........EaP.....',
      '.....EhP........EaP.....',
      '....ErnnEEEEEEEErrrP....',
      '....ErrrrrrrrmmmmmmP....',
      '...EaahaaaaaaaaaaaaaP...',
      '...EhhhhhhhhhhhhhhhhP...',
      '...PaahPaaPPPPaaPaaaP...',
      '....EaP.EP....EP.EaP....',
      '....EaP.EP....EP.EaP....',
      '....EaP.EP....EP.EaP....',
      '....EaP.EP....EP.EaP....',
      '....EaP.PP....PP.EaP....',
      '....EaP..........EaP....',
      '....PPP..........PPP....',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 22, rx: 11, ry: 1.8, key: 'z' },
  ),
  legend: {
    a: 'amber',
    h: 'honey',
    e: 'ember',
    r: 'red',
    m: 'maroon',
    n: 'neon',
    E: 'ember',
    P: 'plum',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Lamp: a teal desk lamp with a warm bulb under the shade, on a round foot.
// o lit outline, N shade outline, c shade light, t shade, d shade dark, h bulb,
// y bulb core, w glint, f stem light, S stem and foot, z shadow.

const LAMP: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '.......ooooooooN........',
      '......occcttttttN.......',
      '......wcccttttttN.......',
      '.....occcctttttttN......',
      '.....occcccttttttN......',
      '....occcccctttttttN.....',
      '....occcccctttttttN.....',
      '...occcccccctttttttN....',
      '...NNNNNNcccttNNNNNN....',
      '.........hhhhh..........',
      '.........hhwyh..........',
      '..........oSN...........',
      '..........oSN...........',
      '..........oSN...........',
      '..........oSN...........',
      '..........oSN...........',
      '......oooofSSoooN.......',
      '.....oSSSSSSSSSSSN......',
      '.....NSSSSSSSSSSSN......',
      '......NNNNNNNNNNN.......',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.4, rx: 11, ry: 1.8, key: 'z' },
  ),
  legend: {
    t: 'teal',
    c: 'cyan',
    d: 'denim',
    S: 'stone',
    f: 'fog',
    h: 'honey',
    y: 'lamp',
    w: 'paper',
    o: 'slate',
    N: 'night',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Trash can: a green ribbed bin with a domed lid and a handle.
// m lit outline and ribs, N shade outline, l body, S handle, w glint, p glint shade,
// z shadow.

const TRASH_CAN: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '..........mNNN..........',
      '..........N..N..........',
      '......mmmmlmmlmmmN......',
      '....mmlpwlllllllllmN....',
      '...mllllllllllllllllN...',
      '...mllllllllllllllllN...',
      '...NNllllllllmmmmmmNN...',
      '.....mlllllllllllmN.....',
      '.....mllmllmllmllmN.....',
      '.....mwlmllmllmllmN.....',
      '.....mwlmllmllmllmN.....',
      '.....mplmllmllmllmN.....',
      '.....mllmllmllmllmN.....',
      '.....mllmllmllmllmN.....',
      '.....mllmllmllmllmN.....',
      '.....mllmllmllmllmN.....',
      '.....mllmllmllmllmN.....',
      '.....mllmllmllmllmN.....',
      '.....NNNNNNNNNNNNNN.....',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.4, rx: 11, ry: 1.9, key: 'z' },
  ),
  legend: {
    l: 'leaf',
    m: 'moss',
    S: 'stone',
    w: 'paper',
    p: 'fog',
    N: 'night',
    z: 'fog',
  },
};

export const ITEM_SPRITES: Readonly<Record<string, PixelSprite>> = {
  latte: LATTE,
  tea: TEA,
  muffin: MUFFIN,
  water: WATER,
  cake: CAKE,
  sandwich: SANDWICH,
  key: KEY,
  box: BOX,
  door: DOOR,
  chair: CHAIR,
  lamp: LAMP,
  trash_can: TRASH_CAN,
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
