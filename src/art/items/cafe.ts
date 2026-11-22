/** Item icons for the cafe unit. */
import type { PixelSprite } from '../../game/sprites';
import { stamp, withShadow, type Point } from './draw';

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

export const CAFE_ITEMS: Readonly<Record<string, PixelSprite>> = {
  latte: LATTE,
  tea: TEA,
  muffin: MUFFIN,
  water: WATER,
  cake: CAKE,
  sandwich: SANDWICH,
};
