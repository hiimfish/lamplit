/** Item icons for the purchasing unit. */
import type { PixelSprite } from '../../game/sprites';
import { withShadow } from './draw';

// ---------------------------------------------------------------------------
// Purchase: a steel shopping cart seen from the side, red grip on the left,
// a teal box and a cardboard box riding in the basket.
// O lit outline, o shade outline, w wire light, g wire, G wire shade,
// r grip, R grip shade, V box outline, k box light, t box,
// E carton lit outline, P carton shade outline, h carton light, a carton,
// m tape, e carton shade, K wheel, s hub, z shadow.

const PURCHASE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.............EEEEEEP....',
      '.............EhhmhhP....',
      '......VVVVVVVEaamaaP....',
      '.rrrR.VkkkktVEaaaaaP....',
      '.rRRRoVtttttVEaaaaeP....',
      '....OOOOOOOOOOOOOOOOOOo.',
      '....OwwwgwwgwwgwwgwwwGo.',
      '.....OggggggggggggggGo..',
      '.....OwwgwwgwwgwwgwwGo..',
      '.....OwwgwwgwwgwwgwwGo..',
      '.....OggggggggggggggGo..',
      '......OwgwwgwwgwwgwGo...',
      '......OwgwwgwwgwwgwGo...',
      '......OggggggggggggGo...',
      '.......ooooooooooooo....',
      '.......Oo.........Oo....',
      '.......Ooooooooooooo....',
      '......KKK........KKK....',
      '.....KKsKK......KKsKK...',
      '......KKK........KKK....',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12.5, cy: 21, rx: 10, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    G: 'concrete',
    r: 'red',
    R: 'maroon',
    V: 'indigo',
    k: 'cyan',
    t: 'teal',
    E: 'ember',
    P: 'plum',
    h: 'skin',
    a: 'tan',
    m: 'ember',
    e: 'ember',
    K: 'slate',
    s: 'fog',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Discount: a red sale tag hanging on a string, a big white percent sign on it.
// O lit outline, o shade outline, n lit edge, r tag, R tag shade, M shade edge,
// w percent sign, K hole, t string, z shadow.

const DISCOUNT: PixelSprite = {
  rows: withShadow(
    [
      '..........tttt..........',
      '.........t....t.........',
      '.........t....t.........',
      '........OOtOOtOOo.......',
      '.......OnnnttrrrMo......',
      '......OnrrrKKrrrrMo.....',
      '.....OnrrrrKKrrrrrMo....',
      '....OnrrrrrrrrrrrrrMo...',
      '....OnrwwwrrrrrrwwrMo...',
      '....OnwwrwwrrrrwwrrMo...',
      '....OnwwrwwrrrwwrrrMo...',
      '....OnrwwwrrwwrrrrrMo...',
      '....OnrrrrrwwrrrrrrMo...',
      '....OnrrrrwwrrrwwwrMo...',
      '....OnrrrwwrrrwwrwwMo...',
      '....OnrwwrrrrrwwrwwMo...',
      '....OnwwrrrrrrrwwwrMo...',
      '....OnrrrrrrrrrrrrrMo...',
      '....OnRRRRRRRRRRRRRMo...',
      '....ooooooooooooooooo...',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12.5, cy: 20, rx: 10, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'maroon',
    o: 'plum',
    n: 'neon',
    r: 'red',
    R: 'maroon',
    M: 'maroon',
    w: 'paper',
    K: 'ink',
    t: 'concrete',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Reduce: a line chart on a sheet of paper, the blue line falling to the lower
// right and ending in an arrowhead.
// O lit outline, o shade outline, w paper, g paper shade, K axes, G grid lines,
// b line and arrowhead, z shadow.

const REDUCE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '.OOOOOOOOOOOOOOOOOOOOOo.',
      '.Owwwwwwwwwwwwwwwwwwwgo.',
      '.OwwKbwwwwwwwwwwwwwwwgo.',
      '.OwwKbbwwwwwwwwwwwwwwgo.',
      '.OwwKbbbwwwwwbwwwwwwwgo.',
      '.OwwKGbbbGGGbbbGGGGGGgo.',
      '.OwwKwwbbbwbbbbbwwwwwgo.',
      '.OwwKwwwbbbbbwbbbwwwbgo.',
      '.OwwKGGGGbbbGGGbbbGbbgo.',
      '.OwwKwwwwwbwwwwwbbbbbgo.',
      '.OwwKwwwwwwwwwwwwbbbbgo.',
      '.OwwKGGGGGGGGGGGbbbbbgo.',
      '.OwwKwwwwwwwwwwbbbbbbgo.',
      '.OwwKwwwwwwwwwwwwwwwwgo.',
      '.OwwKKKKKKKKKKKKKKKKKgo.',
      '.Owwwwwwwwwwwwwwwwwwwgo.',
      '.Oggggggggggggggggggggo.',
      '.oooooooooooooooooooooo.',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20, rx: 11, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    K: 'slate',
    b: 'denim',
    G: 'fog',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Manufacturer: a brick factory with a saw-tooth roof and lit windows, a tall
// striped chimney beside it sending smoke up to the left.
// O smoke lit outline, o smoke shade outline, w smoke light, g smoke,
// c smoke shade, S roof slope, E wall lit outline, P shade outline,
// a brick, e brick shade, h window light, y window, D door, d door shade,
// M chimney lit outline, r chimney, R chimney shade, z shadow.

const MANUFACTURER: PixelSprite = {
  rows: withShadow(
    [
      '..........OOOO..........',
      '........OOwwggOO........',
      '.......OwwgggggO.OOO....',
      '.......OggggccccOwggo...',
      '........ooooooooOgcco...',
      '................MMMMM...',
      '................MwwgP...',
      '................MrrRP...',
      '................MwwgP...',
      '.ES...ES...ES...MrrRP...',
      '.EaS..EaS..EaS..MrrRP...',
      '.EaaS.EaaS.EaaS.MrrRP...',
      '.EaaaSEaaaSEaaaSMrrRP...',
      '.EaaaaaaaaaaaaaeMrrRP...',
      '.EahhaahhaahhaaeMrrRP...',
      '.EayyaayyaayyaaeMrrRP...',
      '.EaaaaaaaaaaaaaeMrrRP...',
      '.EaaaaDDDDaaaaaeMrrRP...',
      '.EaaaaDddDaaaaaeMrrRP...',
      '.EeeeeDddDeeeeeeMRRRP...',
      '.PPPPPPPPPPPPPPPPPPPP...',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 11, cy: 21, rx: 11, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    c: 'concrete',
    S: 'slate',
    E: 'ember',
    P: 'plum',
    a: 'amber',
    e: 'ember',
    h: 'honey',
    y: 'lamp',
    D: 'night',
    d: 'slate',
    M: 'maroon',
    r: 'red',
    R: 'maroon',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Increase: a line chart on a sheet of paper, the red line climbing to the
// upper right and ending in an arrowhead.
// O lit outline, o shade outline, w paper, g paper shade, K axes, G grid lines,
// r line and arrowhead, z shadow.

const INCREASE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '.OOOOOOOOOOOOOOOOOOOOOo.',
      '.Owwwwwwwwwwwwwwwwwwwgo.',
      '.OwwKwwwwwwwwwwrrrrrrgo.',
      '.OwwKwwwwwwwwwwwrrrrrgo.',
      '.OwwKwwwwwwwwwwwwrrrrgo.',
      '.OwwKGGGGGGGGGGGrrrrrgo.',
      '.OwwKwwwwwrwwwwwrrwrrgo.',
      '.OwwKwwwwrrrwwwrrwwwrgo.',
      '.OwwKGGGrrrrrGrrGGGGGgo.',
      '.OwwKwwrrrwrrrrrwwwwwgo.',
      '.OwwKwrrrwwwrrrwwwwwwgo.',
      '.OwwKrrrGGGGGrGGGGGGGgo.',
      '.OwwKrrwwwwwwwwwwwwwwgo.',
      '.OwwKrwwwwwwwwwwwwwwwgo.',
      '.OwwKKKKKKKKKKKKKKKKKgo.',
      '.Owwwwwwwwwwwwwwwwwwwgo.',
      '.Oggggggggggggggggggggo.',
      '.oooooooooooooooooooooo.',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20, rx: 11, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    K: 'slate',
    r: 'red',
    G: 'fog',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Calculate: a pocket calculator, dark body, pale display showing a number,
// a red clear key, blue function keys, pale number keys, an orange column of
// operator keys and a pink equals key.
// O lit outline, K shade outline, t body light, s body, n body shade,
// G display inset, w display, D digit, r clear key, R clear key shade,
// k function key, d function key shade, f key, c key shade, y operator key,
// a operator key shade, p equals key, P equals key shade, z shadow.

const CALCULATE: PixelSprite = {
  rows: withShadow(
    [
      '.....OOOOOOOOOOOOO......',
      '....OtttttttttttttK.....',
      '....OtGGGGGGGGGGGnK.....',
      '....OtwDwDDDwDDDwnK.....',
      '....OtwDwDwDwDwDwnK.....',
      '....OtwDwDwDwDwDwnK.....',
      '....OtwDwDDDwDDDwnK.....',
      '....OtwwwwwwwwwwwnK.....',
      '....OtsssssssssssnK.....',
      '....OtrrskkskksyynK.....',
      '....OtRRsddsddsaanK.....',
      '....OtsssssssssssnK.....',
      '....OtffsffsffsyynK.....',
      '....OtccsccsccsaanK.....',
      '....OtsssssssssssnK.....',
      '....OtffsffsffsyynK.....',
      '....OtccsccsccsaanK.....',
      '....OtsssssssssssnK.....',
      '....OtffsffsffsppnK.....',
      '....OtccsccsccsPPnK.....',
      '....OsnnnnnnnnnnnnK.....',
      '.....KKKKKKKKKKKKK......',
      '........................',
      '........................',
    ],
    { cx: 11.5, cy: 21.6, rx: 9.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'stone',
    K: 'ink',
    t: 'stone',
    s: 'slate',
    n: 'night',
    G: 'night',
    w: 'paper',
    D: 'ink',
    r: 'red',
    R: 'maroon',
    k: 'sky',
    d: 'denim',
    f: 'paper',
    c: 'fog',
    y: 'lamp',
    a: 'amber',
    p: 'neon',
    P: 'neonDeep',
    z: 'fog',
  },
};

export const PURCHASING_ITEMS: Readonly<Record<string, PixelSprite>> = {
  purchase: PURCHASE,
  discount: DISCOUNT,
  reduce: REDUCE,
  manufacturer: MANUFACTURER,
  increase: INCREASE,
  calculate: CALCULATE,
};
