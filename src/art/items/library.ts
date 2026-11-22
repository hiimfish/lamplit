/** Item icons for the library unit. */
import type { PixelSprite } from '../../game/sprites';
import { withShadow } from './draw';

// ---------------------------------------------------------------------------
// Magazine: a thin glossy magazine, pink cover with a sunny landscape picture,
// a white masthead band, page edges below and a curled lower corner.
// O lit outline, o shade outline, n cover, N cover shade, k sky, h sun, l hill,
// t far hill, w masthead, g page edge, z shadow.

const MAGAZINE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '.....OOOOOOOOOOOOOo.....',
      '.....OwwwggwwggwwwNo....',
      '.....OnnnnnnnnnnnnNo....',
      '.....OnkkkkkkkkkknNo....',
      '.....OnkkkkhhkkkknNo....',
      '.....OnkkkhhhhkkknNo....',
      '.....OnkkkhhhhkkknNo....',
      '.....OnkkkkhhkkkknNo....',
      '.....OnkllkkkkttknNo....',
      '.....OnllllkttttttNo....',
      '.....OnllllllllltnNo....',
      '.....OnnnnnnnnnnnnNo....',
      '.....OnwwwwwwwwnnnNo....',
      '.....OnwwwwwnnnnnnNo....',
      '.....OnnnnnnnnnnnnNo....',
      '.....OnhhhnnnnnnnwwNo...',
      '.....OnnnnnnnnnnnnwgNo..',
      '.....OnnnnnnnnnnnnNggo..',
      '.....ooggggggggggggoo...',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.6, rx: 8, ry: 1.4, key: 'z' },
  ),
  legend: {
    O: 'rosy',
    o: 'plum',
    n: 'neon',
    N: 'neonDeep',
    k: 'sky',
    h: 'honey',
    l: 'leaf',
    t: 'teal',
    w: 'paper',
    g: 'fog',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Print: a desktop printer, a sheet rising from the back tray and a printed
// page sliding out of the front.
// O lit outline, o shade outline, f body, c body shade, n slot, l light,
// w paper, g paper shade, d print lines, z shadow.

const PRINT: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '......OOOOOOOOOOOOO.....',
      '......Owwwwwwwwwwgo.....',
      '......Owddddddddwgo.....',
      '......Owwwwwwwwwwgo.....',
      '......Owddddddwwwgo.....',
      '..OOOOOwwwwwwwwwwgOOOOo.',
      '.Offfffffffffffffffffco.',
      '.Offfffffffffffffffffco.',
      '.Offffffffffffffflfffco.',
      '.Offfffffffffffffffffco.',
      '.Offcccccccccccccccffco.',
      '.Offcnnnnnnnnnnnnncffco.',
      '.Offcccccccccccccccffco.',
      '.Offfffffffffffffffffco.',
      '.OfffOwwwwwwwwwwwwOffco.',
      '.ooooOwwwwwwwwwwwwOoooo.',
      '.....OwddddddddddgO.....',
      '.....OwwwwwwwwwwwgO.....',
      '.....OwddddddddwwgO.....',
      '.....OwwwwwwwwwwwgO.....',
      '.....oooooooooooooo.....',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.4, rx: 10, ry: 1.4, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    f: 'fog',
    c: 'concrete',
    n: 'night',
    l: 'cyan',
    w: 'paper',
    g: 'fog',
    d: 'denim',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Paper: a small stack of blank sheets, the top corner lifted and curled.
// O lit outline, o shade outline, w sheet, g sheet edge shade, z shadow.

const PAPER: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '.....ooooooooooo........',
      '...OOOOOOOOOOOO.........',
      '...OwwwwwwwwwwwO........',
      '...OwwwwwwwwwwggO.......',
      '...OwwwwwwwwwwwggO......',
      '...OwwwwwwwwwwwwggO.....',
      '...Owwwwwwwwwwwwwwwo....',
      '...Owwwwwwwwwwwwwwwo....',
      '...Owwwwwwwwwwwwwwwo....',
      '...Ogggggggggggggggo....',
      '...Owwwwwwwwwwwwwwwo....',
      '...Ogggggggggggggggo....',
      '...Owwwwwwwwwwwwwwwo....',
      '...Ogggggggggggggggo....',
      '...ooooooooooooooooo....',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 11.5, cy: 19.6, rx: 10, ry: 1.4, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// File: a document (folded corner, text lines) sitting in a yellow folder.
// O doc lit outline, o doc shade outline, w sheet, g fold, d text lines,
// E folder outline, a folder back, A folder lit edge, h folder front,
// s folder shade, p highlight, z shadow.

const FILE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '.........OOOOOOOOO......',
      '.........OwwwwwwwgO.....',
      '.........OwwwwwwwggO....',
      '.........OwwwwwwwgggO...',
      '.........Owwwwwwwwwwo...',
      '.EEEEEEE.Owddddddddwo...',
      '.EaaaaaaEOwwwwwwwwwwo...',
      '.EEEEEEEEOwddddddddwoE..',
      '.EaaaaaaaOwwwwwwwwwwoE..',
      '.EaaaaaaaOwdddddddwwoE..',
      '.EaaaaaaaOwwwwwwwwwwoE..',
      '.AAAAAAAAAAAAAAAAAAAAAA.',
      '.AhhhhhhhhhhhhhhhhhhhhE.',
      '.AhpphhhhhhhhhhhhhhhhhE.',
      '.AhhhhhhhhhhhhhhhhhhhhE.',
      '.AhhhhhhhhhhhhhhhhhhhhE.',
      '.AhhhhhhhhhhhhhhhhhhhhE.',
      '.AssssssssssssssssssssE.',
      '.EEEEEEEEEEEEEEEEEEEEEE.',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.2, rx: 10.5, ry: 1.4, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    d: 'denim',
    E: 'ember',
    a: 'amber',
    A: 'amber',
    h: 'honey',
    s: 'amber',
    p: 'paper',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Board: a cork notice board in a wooden frame with four pinned notes.
// O frame outline, o shade outline, h frame lit, a frame, e frame shade,
// c cork, t speckle, w white note, b cyan note, n pink note, l green note,
// d/u/m/s note lines, r red pin, y gold pin, z shadow.

const BOARD: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '.OOOOOOOOOOOOOOOOOOOOOO.',
      '.Ohhhhhhhhhhhhhhhhhhhho.',
      '.Oaaaaaaaaaaaaaaaaaaaao.',
      '.Ohaeeeeeeeeeeeeeeeeaeo.',
      '.Ohaewwrwwcctccctcccaeo.',
      '.Ohaewdddwcbbrbbbctcaeo.',
      '.Ohaewwwwwtbuuuubcctaeo.',
      '.Ohaewdddwcbbbbbbtccaeo.',
      '.Ohaewwwwwcbuuubbctcaeo.',
      '.Ohaectccccbbbbbbcctaeo.',
      '.Ohaennynnnclllrlllcaeo.',
      '.Ohaenmmmmnclsssssltaeo.',
      '.Ohaenmmmnnclllllllcaeo.',
      '.Ohaennnnnntlllllllcaeo.',
      '.Ohaeccctccccctcccccaeo.',
      '.Oaaaaaaaaaaaaaaaaaaaeo.',
      '.Oeeeeeeeeeeeeeeeeeeeeo.',
      '.oooooooooooooooooooooo.',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.6, rx: 10.5, ry: 1.4, key: 'z' },
  ),
  legend: {
    O: 'ember',
    o: 'plum',
    h: 'honey',
    a: 'amber',
    e: 'ember',
    c: 'skin',
    t: 'tan',
    w: 'paper',
    d: 'denim',
    b: 'cyan',
    u: 'teal',
    n: 'neon',
    m: 'neonDeep',
    l: 'leaf',
    s: 'moss',
    r: 'red',
    y: 'lamp',
    z: 'fog',
  },
};

/** Word pictures of the library. */
export const LIBRARY_ITEMS: Readonly<Record<string, PixelSprite>> = {
  magazine: MAGAZINE,
  print: PRINT,
  paper: PAPER,
  file: FILE,
  board: BOARD,
};
