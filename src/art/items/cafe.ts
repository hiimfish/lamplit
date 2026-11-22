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

// ---------------------------------------------------------------------------
// Coffee: an iced coffee in a clear takeaway cup with a red straw, dark
// coffee and ice cubes showing through the plastic.
// O lit outline, o shade outline, w lid and glint, g lid shade, G lid edge,
// c coffee light, k coffee, d coffee shade, i ice, j ice shade, n straw light,
// r straw, z shadow.

const COFFEE: PixelSprite = {
  rows: withShadow(
    [
      '................nr......',
      '...............nr.......',
      '..............nr........',
      '.............nr.........',
      '.....OOOOOOOnrOOOOo.....',
      '....OwwwwwwwggggggGo....',
      '....oooooooooooooooo....',
      '.....Ociijkkiijkddo.....',
      '.....Ocijjkkijjkddo.....',
      '.....Ockkiijkkkkddo.....',
      '.....Ockkijjkkkkddo.....',
      '.....Ockkkkkkkkkddo.....',
      '......Ocwkkkkkkddo......',
      '......Ocwkkkkkdddo......',
      '......Ocwkkkkkdddo......',
      '......Ockkkkkddddo......',
      '......Ockkkkkddddo......',
      '.......Ockkkkdddo.......',
      '.......Ockkkddddo.......',
      '.......Ockkdddddo.......',
      '........oooooooo........',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21, rx: 8.5, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'fog',
    o: 'stone',
    w: 'paper',
    g: 'fog',
    G: 'concrete',
    c: 'amber',
    k: 'ember',
    d: 'plum',
    i: 'paper',
    j: 'fog',
    n: 'neon',
    r: 'red',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Ice: three clear ice cubes, two on the table and one on top.
// O lit outline, o shade outline, w top face, c front face, s side face,
// h glint, z shadow.

const ICE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '.........OOOOOOo........',
      '........Owwwwwso........',
      '.......Owwwwwsso........',
      '......OOOOOOOsso........',
      '......Ohcccccsso........',
      '......Ohcccccsso........',
      '......Occcccccso........',
      '......Occcccccso........',
      '....OOOcccccccsoOOOOOo..',
      '...Owwooooooooowwwwwso..',
      '..Owwwwwsso..Owwwwwsso..',
      '.OOOOOOOsso.OOOOOOOsso..',
      '.Ohcccccsso.Ohcccccsso..',
      '.Ohcccccsso.Ohcccccsso..',
      '.Occcccccso.Occcccccso..',
      '.Occcccccso.Occcccccso..',
      '.Occcccccso.Occcccccso..',
      '.ooooooooo..ooooooooo...',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 11.5, cy: 21, rx: 11, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'sky',
    o: 'denim',
    w: 'paper',
    c: 'cyan',
    s: 'teal',
    h: 'paper',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Sugar: three grainy sugar cubes heaped in a small blue bowl.
// O lit outline, o shade outline, w cube top and grain, f cube front,
// s cube side, B bowl lit outline, r rim, b glaze, n glaze shade,
// x bowl outline, h glint, z shadow.

const SUGAR: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '..........OOOOOo........',
      '.........Owwwwso........',
      '........Owwwwwso........',
      '........Offfffso........',
      '.....OOOOOofffsOOOOOo...',
      '....OwwwwsofwfOwwwwso...',
      '...OwwwwwsoffOwwwwwso...',
      '...OfffffsoooOfffffso...',
      '...Ofwfffso..Ofwfffso...',
      '.Brrrrrrrrrrrrrrrrrrrrx.',
      '.Bbbbbbbbbbbbbbbbbbnnnx.',
      '..Bhbbbbbbbbbbbbbbbnnx..',
      '...Bhbbbbbbbbbbbbbnnx...',
      '....Bbbbbbbbbbbbbnnx....',
      '.....Bbbbbbbbbbbnnx.....',
      '......xnnnnnnnnnnx......',
      '.......xxxxxxxxxx.......',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21, rx: 10, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'concrete',
    o: 'stone',
    w: 'paper',
    f: 'fog',
    s: 'concrete',
    B: 'sky',
    r: 'sky',
    b: 'denim',
    n: 'indigo',
    x: 'deep',
    h: 'paper',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Cookie: a round chocolate-chip cookie with a bite out of the top right.
// O lit outline, o shade outline, h dough light, l dough, a dough shade,
// e dough deep, k chip, K chip shade, z shadow.

function chip(x: number, y: number): Point[] {
  return [
    [x, y, 'k'],
    [x + 1, y, 'K'],
    [x, y + 1, 'K'],
  ];
}

const COOKIE: PixelSprite = {
  rows: withShadow(
    stamp(
      [
        '........................',
        '........................',
        '.........OOOOO..........',
        '.......OOhhlllO.........',
        '.....OOhhhlllllO........',
        '....OhhhhllllllO........',
        '....OhhhlllllllO........',
        '...Ohhhllllllllo........',
        '...Ohhllllllllllo.......',
        '..Ohhlllllllllllao......',
        '..Ohlllllllllllaaaooo...',
        '..Olllllllllllaaaaaao...',
        '..Ollllllllllaaaaaaeo...',
        '..Olllllllllaaaaaaeeo...',
        '...Olllllllaaaaaaeeo....',
        '...Ollllllaaaaaaeeeo....',
        '....Ollllaaaaaaeeeo.....',
        '....Olllaaaaaaeeeeo.....',
        '.....ooaaaaaaeeeoo......',
        '.......ooaaaeeoo........',
        '.........ooooo..........',
        '........................',
        '........................',
        '........................',
      ],
      [
        ...chip(7, 6),
        ...chip(12, 5),
        ...chip(5, 11),
        ...chip(10, 10),
        ...chip(14, 13),
        ...chip(8, 15),
        ...chip(13, 17),
        ...chip(15, 10),
      ],
    ),
    { cx: 11.5, cy: 21, rx: 9, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'amber',
    o: 'plum',
    h: 'honey',
    l: 'lamp',
    a: 'amber',
    e: 'ember',
    k: 'plum',
    K: 'night',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Small, medium, large: the same paper takeaway cup in three sizes, side by
// side on one baseline. The size the word names is drawn in colour; the
// other two are flat silhouettes, so each icon reads as its size on its own.
// O lit outline, o shade outline, L lid light, l lid, d lid shade, w paper,
// g paper shade, G paper deep, h sleeve light, a sleeve, e sleeve shade,
// q silhouette, z shadow.

const CUP_LEGEND: PixelSprite['legend'] = {
  O: 'stone',
  o: 'slate',
  L: 'fog',
  l: 'concrete',
  d: 'stone',
  w: 'paper',
  g: 'fog',
  G: 'concrete',
  h: 'honey',
  a: 'lamp',
  e: 'amber',
  q: 'fog',
  z: 'fog',
};

const CUP_SHADOW = { cx: 11.5, cy: 21, rx: 11.5, ry: 1.6, key: 'z' };

const SMALL: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '...............qqqqqq...',
      '..............qqqqqqqq..',
      '..............qqqqqqqq..',
      '..............qqqqqqqq..',
      '..............qqqqqqqq..',
      '........qqqq..qqqqqqqq..',
      '.......qqqqqq.qqqqqqqq..',
      '.......qqqqqq.qqqqqqqq..',
      '.......qqqqqq.qqqqqqqq..',
      '.......qqqqqq.qqqqqqqq..',
      '..OOo..qqqqqq.qqqqqqqq..',
      '.OLldo.qqqqqq.qqqqqqqq..',
      '.ooooo.qqqqqq.qqqqqqqq..',
      '.OwgGo.qqqqqq.qqqqqqqq..',
      '.Ohaeo.qqqqqq.qqqqqqqq..',
      '.Ohaeo.qqqqqq.qqqqqqqq..',
      '.Ohaeo.qqqqqq.qqqqqqqq..',
      '.OwgGo.qqqqqq.qqqqqqqq..',
      '.OwgGo.qqqqqq.qqqqqqqq..',
      '..ooo...qqqq...qqqqqq...',
      '........................',
      '........................',
      '........................',
    ],
    CUP_SHADOW,
  ),
  legend: CUP_LEGEND,
};

const MEDIUM: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '...............qqqqqq...',
      '..............qqqqqqqq..',
      '..............qqqqqqqq..',
      '..............qqqqqqqq..',
      '..............qqqqqqqq..',
      '........OOOo..qqqqqqqq..',
      '.......OLLldo.qqqqqqqq..',
      '.......oooooo.qqqqqqqq..',
      '.......OwwgGo.qqqqqqqq..',
      '.......OwwgGo.qqqqqqqq..',
      '..qqq..OwwgGo.qqqqqqqq..',
      '.qqqqq.Ohaaeo.qqqqqqqq..',
      '.qqqqq.Ohaaeo.qqqqqqqq..',
      '.qqqqq.Ohaaeo.qqqqqqqq..',
      '.qqqqq.Ohaaeo.qqqqqqqq..',
      '.qqqqq.OwwgGo.qqqqqqqq..',
      '.qqqqq.OwwgGo.qqqqqqqq..',
      '.qqqqq.OwwgGo.qqqqqqqq..',
      '.qqqqq.OwwgGo.qqqqqqqq..',
      '..qqq...oooo...qqqqqq...',
      '........................',
      '........................',
      '........................',
    ],
    CUP_SHADOW,
  ),
  legend: CUP_LEGEND,
};

const LARGE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '...............OOOOOo...',
      '..............OLLllldo..',
      '..............oooooooo..',
      '..............OwwwwgGo..',
      '..............OwwwwgGo..',
      '........qqqq..OwwwwgGo..',
      '.......qqqqqq.OwwwwgGo..',
      '.......qqqqqq.OwwwwgGo..',
      '.......qqqqqq.Ohaaaeeo..',
      '.......qqqqqq.Ohaaaeeo..',
      '..qqq..qqqqqq.Ohaaaeeo..',
      '.qqqqq.qqqqqq.Ohaaaeeo..',
      '.qqqqq.qqqqqq.Ohaaaeeo..',
      '.qqqqq.qqqqqq.Ohaaaeeo..',
      '.qqqqq.qqqqqq.OwwwwgGo..',
      '.qqqqq.qqqqqq.OwwwwgGo..',
      '.qqqqq.qqqqqq.OwwwwgGo..',
      '.qqqqq.qqqqqq.OwwwwgGo..',
      '.qqqqq.qqqqqq.OwwwwgGo..',
      '..qqq...qqqq...oooooo...',
      '........................',
      '........................',
      '........................',
    ],
    CUP_SHADOW,
  ),
  legend: CUP_LEGEND,
};

// ---------------------------------------------------------------------------
// Table: a round wooden cafe table on one dark metal pedestal and foot.
// E lit outline, P shade outline, w glint, h wood light, a wood, e edge,
// f metal light, S metal, s metal shade, n metal outline, z shadow.

const TABLE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '......EEEEEEEEEEEP......',
      '...EEEhhhhhhaaaaaaPPP...',
      '.EhhhhhwhhhaaaaaaaaaaaP.',
      '.EhhhhaaaaaaaaaaaaaaaaP.',
      '..EEaaaaaaaaaaaaaaaaPP..',
      '...EeeeeeeeeeeeeeeeeP...',
      '......PPPPPPPPPPPP......',
      '..........fSsn..........',
      '..........fSsn..........',
      '..........fSsn..........',
      '..........fSsn..........',
      '..........fSsn..........',
      '..........fSsn..........',
      '..........fSsn..........',
      '..........fSsn..........',
      '.........fSSssn.........',
      '.....fSSSSSSssssssn.....',
      '......nnnnnnnnnnnn......',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21, rx: 10, ry: 1.6, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    w: 'honey',
    h: 'lamp',
    a: 'amber',
    e: 'ember',
    f: 'fog',
    S: 'stone',
    s: 'slate',
    n: 'night',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Window: a white four-pane window on a daytime sky, with a cloud, a glint
// and a deep sill.
// O lit outline, o shade outline, F frame light, f frame shade, G sill shade,
// d sky top, k sky, c sky low, w cloud and glint, g cloud shade, z shadow.

const WINDOW: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '...OOOOOOOOOOOOOOOOOo...',
      '...OFFFFFFFFFFFFFFffo...',
      '...OFddddddFfddddddfo...',
      '...OFkkkkwkFfkkwwkkfo...',
      '...OFkkkwkkFfkwwwwkfo...',
      '...OFkkwkkkFfkggggkfo...',
      '...OFkwkkkkFfkkkkkkfo...',
      '...OFkkkkkkFfkkkkkkfo...',
      '...OFFFFFFFFFFFFFFFfo...',
      '...OFfffffffffffffffo...',
      '...OFkkkkkkFfkkkkkkfo...',
      '...OFccccwcFfccccccfo...',
      '...OFcccwccFfccccccfo...',
      '...OFccwcccFfccccccfo...',
      '...OFccccccFfccccccfo...',
      '...OFccccccFfccccccfo...',
      '...OFfffffffffffffffo...',
      '.OFFFFFFFFFFFFFFFFFFFfo.',
      '.oGGGGGGGGGGGGGGGGGGGGo.',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.4, rx: 11.5, ry: 1.4, key: 'z' },
  ),
  legend: {
    O: 'concrete',
    o: 'stone',
    F: 'paper',
    f: 'fog',
    G: 'concrete',
    d: 'denim',
    k: 'sky',
    c: 'cyan',
    w: 'paper',
    g: 'fog',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Seat: a cafe bar stool with a round red cushion, four splayed metal legs
// and a footrest ring.
// O lit outline, N shade outline, h glint, c cushion light, t cushion,
// m cushion shade, n metal outline, S metal, s metal shade, z shadow.

const SEAT: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '.......OOOOOOOOOO.......',
      '.....OcchhccccctttN.....',
      '....OccccccccctttttN....',
      '....OcccccccttttttttN...',
      '....OttttttttttttmmN....',
      '.....NNNNNNNNNNNNNN.....',
      '.......nSSSSSSSSn.......',
      '.......SS.s..s.ss.......',
      '.......SS.s..s.ss.......',
      '......SS..s..s..ss......',
      '......SS..s..s..ss......',
      '......SS..s..s..ss......',
      '.....SSSSSSSSSSSSss.....',
      '.....SSnnnnnnnnnnss.....',
      '.....SS..s....s..ss.....',
      '....SS...s....s...ss....',
      '....SS...s....s...ss....',
      '....nn...n....n...nn....',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21, rx: 10, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'red',
    N: 'plum',
    h: 'paper',
    c: 'neon',
    t: 'red',
    m: 'maroon',
    n: 'night',
    S: 'stone',
    s: 'slate',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Book: a closed purple hardback with a gold title label, the page block
// showing at the side and bottom, and a red ribbon bookmark.
// O lit outline, o shade outline, h cover light, v cover, p cover shade,
// Y label light, y label, a label text, w pages, g page shade, r ribbon,
// z shadow.

const BOOK: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '...OOOOOOOOOOOOOOOo.....',
      '...Ohphhhhhhhhhhhho.....',
      '...Ohphvvvvvvvvvvvoo....',
      '...Ohphvvvvvvvvvvpowo...',
      '...OhphvYyyyyyyyvpowgo..',
      '...Ohphvyaaaaaayvpowgo..',
      '...Ohphvyaaayyyyvpowgo..',
      '...Ohphvyyyyyyyavpowgo..',
      '...Ohphvvvvvvvvvvpowgo..',
      '...Ohphvvvvvvvvvvpowgo..',
      '...Ohphvvvvvvvvvvpowgo..',
      '...Ohphvvvvvvvvvvpowgo..',
      '...Ohphvvvvvvvvvvpowgo..',
      '...Ohphvvvvvvvvvvpowgo..',
      '...Ohphvvvvvvvvvvpowgo..',
      '...Ohpppppppppppppowgo..',
      '...Oooooooooooooooowgo..',
      '....owwwwwwwwwrwwwwwgo..',
      '.....oooooooooroooooo...',
      '..............r.........',
      '........................',
      '........................',
    ],
    { cx: 12.5, cy: 21, rx: 10.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'plum',
    o: 'night',
    h: 'mauve',
    v: 'violet',
    p: 'plum',
    Y: 'honey',
    y: 'lamp',
    a: 'amber',
    w: 'paper',
    g: 'fog',
    r: 'red',
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
  coffee: COFFEE,
  ice: ICE,
  sugar: SUGAR,
  cookie: COOKIE,
  small: SMALL,
  medium: MEDIUM,
  large: LARGE,
  table: TABLE,
  window: WINDOW,
  seat: SEAT,
  book: BOOK,
};
