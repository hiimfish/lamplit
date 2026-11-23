/** Item icons for the budget and reports unit (the accountant's office). */
import type { PixelSprite } from '../../game/sprites';
import { withShadow } from './draw';

// ---------------------------------------------------------------------------
// Accountant: a head-and-shoulders portrait in a green eyeshade visor and
// round glasses, white shirt, red tie, a pencil in the shirt pocket.
// n hair, M visor band and underside, L visor brim, K glasses, w glint,
// k eyes, s skin, t skin shade, m mouth, C shirt lit outline, c shirt shade
// outline, W shirt, G shirt shade, R tie, P tie shade, g pocket, y pencil, z shadow.

const ACCOUNTANT: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '.........nnnnnn.........',
      '.......nnnnnnnnnn.......',
      '......MMMMMMMMMMMM......',
      '...LLLLLLLLLLLLLLLLLL...',
      '....MMMMMMMMMMMMMMMM....',
      '.....nttttttttttttn.....',
      '.....nssKKssssKKssn.....',
      '.....nsKwkKKKKwkKsn.....',
      '.....nssKKssssKKssn.....',
      '.....tsssssttssssst.....',
      '......tssssmmsssst......',
      '.......tssssssssst......',
      '.........tsssst.........',
      '....CCCWWWttttWWWCCc....',
      '...CWWWWWWWRRWWWWWWWc...',
      '..CWWWWWWWWRPWWWWyWWGc..',
      '..CWWWWWWWWRPWWggyggGc..',
      '..CWWWWWWWWRPWWgWWWgGc..',
      '..CWWWWWWWWRPWWgggggGc..',
      '..cccccccccccccccccccc..',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 22.2, rx: 11, ry: 1.3, key: 'z' },
  ),
  legend: {
    n: 'ember',
    M: 'moss',
    L: 'leaf',
    K: 'ink',
    w: 'paper',
    k: 'ink',
    s: 'skin',
    t: 'tan',
    m: 'ember',
    C: 'concrete',
    c: 'slate',
    W: 'paper',
    G: 'fog',
    R: 'red',
    P: 'maroon',
    g: 'fog',
    y: 'lamp',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Budget: a pie chart split into shares, the gold "$" share pulled out.
// L green lit outline, m green shade outline, l green share, D blue lit edge,
// d blue shade outline, s blue share, A gold lit outline, e gold shade
// outline and "$", y gold share, h glint, z shadow.

const BUDGET: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........LLLLAAAA........',
      '......LLlllmyhyyee......',
      '.....Llllllmyyyyyye.....',
      '....Lllllllmyyyyeyye....',
      '...Llllllllmyyyeeeyye...',
      '...Llllllllmyyyeyyyye...',
      '..Lllllllllmyyyeeeyyye..',
      '..Lllllllllmyyyyyeyyye..',
      '..Llllllllmmeeyeeeyyye..',
      '..Lllllllmsssdeyeyyyye..',
      '..Lllllmmsssssdeeyyyye..',
      '..Lllmmsssssssssdeeyye..',
      '..mmssssssssssssssdeee..',
      '...dssssssssssssssssd...',
      '...dssssssssssssssssd...',
      '....dssssssssssssssd....',
      '.....dssssssssssssd.....',
      '......ddssssssssdd......',
      '........dddddddd........',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.8, rx: 10.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    L: 'moss',
    m: 'ink',
    l: 'leaf',
    D: 'denim',
    d: 'indigo',
    s: 'sky',
    A: 'amber',
    e: 'ember',
    y: 'lamp',
    h: 'honey',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Spreadsheet: a wide sheet with a green title bar, a grey header row and
// row column, a grid of cells holding grey figures, one cell picked out in a
// green frame.
// O lit outline, o shade outline, L title bar, h headers, g header lines,
// l grid lines, w cell, d figures, M selected-cell frame, z shadow.

const SPREADSHEET: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '..OOOOOOOOOOOOOOOOOOOo..',
      '..OLLLLLLLLLLLLLLLLLLo..',
      '..OLLLLLLLLLLLLLLLLLLo..',
      '..Ohhghhhghhhghhhghhho..',
      '..Oggggggggggggggggggo..',
      '..Ohhgwwwlwwwlwwwlwwwo..',
      '..Ohhgwddlwddlwdwlwddo..',
      '..OggglllMMMMMlllllllo..',
      '..OhhgwwwMwwwMwwwlwwwo..',
      '..OhhgwddMdddMwddlwddo..',
      '..OggglllMMMMMlllllllo..',
      '..Ohhgwwwlwwwlwwwlwwwo..',
      '..Ohhgwdwlwddlwddlwdwo..',
      '..Oggglllllllllllllllo..',
      '..Ohhgwwwlwwwlwwwlwwwo..',
      '..Ohhgwddlwddlwdwlwddo..',
      '..oooooooooooooooooooo..',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 19.8, rx: 11, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    L: 'leaf',
    h: 'fog',
    g: 'concrete',
    l: 'fog',
    w: 'paper',
    d: 'stone',
    M: 'moss',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Calculator: a pale desk adding machine seen from the front and above, a
// paper tape of figures rising from its back, a green number window, rows of
// keys and a long gold key.
// O lit outline, o shade outline, T tape, k printed figures, K tape slot,
// h top light, s top, M window, L window figures, w key, g key shade,
// r red key, x red key shade, y gold key, a gold key shade, G front, z shadow.

const CALCULATOR: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.........OOOOOo.........',
      '.........OTTTTo.........',
      '.........OkkTko.........',
      '.........OTTTTo.........',
      '.........OkTkko.........',
      '.........OTTTTo.........',
      '.........OkkTko.........',
      '..OOOOOOKKKKKKKKOOOOOo..',
      '..Ohhhhhhhhhhhhhhhhhho..',
      '..OsMMMMMMMMMMMMMMMMso..',
      '..OsMMMMMMLLMLLMLLMMso..',
      '..OsMMMMMMMMMMMMMMMMso..',
      '..Osssssssssssssssssso..',
      '..Osrrswwswwswwsyyyyso..',
      '..Osxxsggsggsggsyyyyso..',
      '..Osssssssssssssyyyyso..',
      '..Oswwswwswwswwsyyyyso..',
      '..Osggsggsggsggsaaaaso..',
      '..Osssssssssssssssssso..',
      '..OGGGGGGGGGGGGGGGGGGo..',
      '..oooooooooooooooooooo..',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.8, rx: 11, ry: 1.4, key: 'z' },
  ),
  legend: {
    O: 'concrete',
    o: 'slate',
    T: 'paper',
    k: 'concrete',
    K: 'ink',
    h: 'paper',
    s: 'fog',
    M: 'moss',
    L: 'leaf',
    w: 'paper',
    g: 'concrete',
    r: 'red',
    x: 'maroon',
    y: 'lamp',
    a: 'amber',
    G: 'concrete',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Utility: a steel tap on a wall plate, a red handle on top, a blue drop of
// water falling from the spout.
// R handle, m handle shade, O lit outline, o shade outline, w steel light,
// g steel, G steel shade, c drop light, b drop, B drop outline, z shadow.

const UTILITY: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '....mRRRRRRRRRm.........',
      '....mmmmmmmmmmm.........',
      '........OwGo............',
      '.Oo.....OwGo............',
      '.Og..OOOOwGOOOo.........',
      '.Og..OwwwwwwwwwOOOOOo...',
      '.OgwwOwggggggggwwwwwgo..',
      '.OgggOgggggggggggggggGo.',
      '.OgGGOgggggggggGGGgggGo.',
      '.Og..OGGGGGGGGGoooOggGo.',
      '.Og..oooooooooo...OggGo.',
      '.oo...............OggGo.',
      '..................oooo..',
      '...................BB...',
      '..................BcbB..',
      '..................Bcbd..',
      '..................Bbbd..',
      '...................dd...',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21, rx: 10, ry: 1.6, key: 'z' },
  ),
  legend: {
    R: 'red',
    m: 'maroon',
    O: 'concrete',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    G: 'concrete',
    c: 'cyan',
    b: 'sky',
    B: 'denim',
    d: 'indigo',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Currency: a gold dollar coin and a silver yen coin with two arrows turning
// one into the other.
// A gold lit outline, e gold shade outline and "$", y gold, G silver lit
// outline, o silver shade outline, g silver, S yen sign, b arrow, B arrow
// shade, z shadow.

const CURRENCY: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '.......AA.....bbbbb.....',
      '.....AAyyAA...BBBBbb....',
      '....Ayyyeyye......bB....',
      '...AyyyeeeyAe.....bB....',
      '...Ayyyeyyyye...bbbbBB..',
      '..Ayyyyeeeyyye...bbBB...',
      '..Ayyyyyyeyyye....bB....',
      '...Ayyyeeeyye..GG.......',
      '...Ayyyyeyyye.GGggGG....',
      '....eyyyyyyeGggggggo....',
      '.....eeyyeeGggSgggSgo...',
      '.......ee..GgggSgSggo...',
      '....bB....GgggSSSSSggo..',
      '...bbBB...GggggSggggo...',
      '..bbbBBB...GgSSSSSggo...',
      '....bB.....GggggSggo....',
      '....bB......oggggggo....',
      '....bbbbbb...ooggoo.....',
      '.....BBBBB.....oo.......',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21, rx: 10.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    A: 'amber',
    e: 'ember',
    y: 'lamp',
    G: 'concrete',
    o: 'slate',
    g: 'fog',
    S: 'stone',
    b: 'sky',
    B: 'denim',
    z: 'fog',
  },
};

/** Word pictures of the accountant's office. */
export const BUDGET_ITEMS: Readonly<Record<string, PixelSprite>> = {
  accountant: ACCOUNTANT,
  budget: BUDGET,
  spreadsheet: SPREADSHEET,
  calculator: CALCULATOR,
  utility: UTILITY,
  currency: CURRENCY,
};
