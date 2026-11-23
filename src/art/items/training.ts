/** Item icons for the training unit. */
import type { PixelSprite } from '../../game/sprites';
import { withShadow } from './draw';

// ---------------------------------------------------------------------------
// Stationery: a yellow pencil lying across a flat ruler with tick marks.
// O lit outline, o shade outline, w ruler edge light, g ruler, G ruler shade, S ticks;
// E pencil lit outline, P pencil shade outline, h body light, y body, a body shade,
// f ferrule light, F ferrule, r eraser light, R eraser, k wood light, t wood, i lead, z shadow.

const STATIONERY: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '..................E.....',
      '.................ErP....',
      '................ErrRP...',
      '...............EfrRRRP..',
      '..............EffFRRP...',
      '.............EhyFFFP....',
      '............EhyyyFP.....',
      '...........EhyyyaP......',
      '..........EhyyyaP.......',
      '.........EhyyyaP........',
      '..OOOOOOEhyyyaPOOOOOOO..',
      '.OwwwwwEhyyyaPwwwwwwwwo.',
      '.OgSgSEhyyyaPSgSgSgSggo.',
      '.OgSgEhyyyaPgggSgggSggo.',
      '.OggEhyyyaPgggggggggggo.',
      '.OgEkkyyaPggggggggggggo.',
      '.OGEkttaPGGGGGGGGGGGGGo.',
      '..oEittPoooooooooooooo..',
      '..EiPPP.................',
      '...P....................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20, rx: 11, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'concrete',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    G: 'concrete',
    S: 'slate',
    E: 'amber',
    P: 'ember',
    h: 'honey',
    y: 'lamp',
    a: 'amber',
    f: 'fog',
    F: 'concrete',
    r: 'rosy',
    R: 'neonDeep',
    k: 'skin',
    t: 'tan',
    i: 'ink',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Server: a rack cabinet with five stacked units, each with a vent and two lights.
// O lit outline, o shade outline, f bezel light, C unit face, S side, n slot gap,
// s vent and side seam, L green light, c cyan light, Y orange light, z shadow.

const SERVER: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.....OOOOOOOOOOOOOO.....',
      '....OffffffffffffSSo....',
      '....Onnnnnnnnnnnnsso....',
      '....OfCsssssCLCcCSSo....',
      '....OCCCCCCCCCCCCSSo....',
      '....Onnnnnnnnnnnnsso....',
      '....OfCsssssCcCLCSSo....',
      '....OCCCCCCCCCCCCSSo....',
      '....Onnnnnnnnnnnnsso....',
      '....OfCsssssCLCYCSSo....',
      '....OCCCCCCCCCCCCSSo....',
      '....Onnnnnnnnnnnnsso....',
      '....OfCsssssCYCLCSSo....',
      '....OCCCCCCCCCCCCSSo....',
      '....Onnnnnnnnnnnnsso....',
      '....OfCsssssCcCLCSSo....',
      '....OCCCCCCCCCCCCSSo....',
      '....Onnnnnnnnnnnnsso....',
      '....OSSSSSSSSSSSSSSo....',
      '.....oooooooooooooo.....',
      '.....oo..........oo.....',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21, rx: 10, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'night',
    f: 'fog',
    C: 'concrete',
    S: 'stone',
    n: 'slate',
    s: 'slate',
    L: 'leaf',
    c: 'cyan',
    Y: 'lamp',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Toner: a long printer toner cartridge with a carry grip on top, a teal drum along
// the front and a drive gear on the end.
// O lit outline, o shade outline, f top edge light, C top face and end cap, S front,
// s side, y grip light, a grip, c drum light, T drum, z shadow.

const TONER: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '.....OOOOOOOOOOOOOOOOOO.',
      '....Offffffffffffffffffo',
      '...OCCCCCyyyyyyCCCCCCCso',
      '..OCCCCCaaaaaaCCCCCCCsso',
      '.OCCCCCCCCCCCCCCCCCCssso',
      'OCCSSSSSSSSSSSSSSSSssfso',
      'OCCSSSSSSSSSSSSSSSSsfCso',
      'OCCSSSSSSSSSSSSSSSSsCsso',
      'OCCScccccccccccccSSsssso',
      'OCCSTTTTTTTTTTTTTSSssso.',
      'OCCSSSSSSSSSSSSSSSSsso..',
      'OCCSSSSSSSSSSSSSSSSso...',
      '.ooooooooooooooooooo....',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 18.6, rx: 11.5, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'concrete',
    o: 'night',
    f: 'fog',
    C: 'concrete',
    S: 'stone',
    s: 'slate',
    y: 'lamp',
    a: 'amber',
    c: 'cyan',
    T: 'teal',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Stapler: a red stapler seen from the side, hinge at the back, nose to the right.
// E arm lit outline, P arm shade outline, h arm light, r arm, m arm shade, s staple strip,
// O base lit outline, o base shade outline, f base light, C base, S base shade, z shadow.

const STAPLER: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '...EEEEEEEEEEEEEEE......',
      '..EhhhhhhhhhhhhhhhPE....',
      '.EhhhhhhhhhhhhhhhrrrP...',
      '.ErrrrrrrrrrrrrrrrrrrP..',
      '.ErrrrrrrrrrrrrrrrrrrP..',
      '.EmmmmmmmmmmmmmmmmmmmP..',
      '.OPmmmmmmmmmmmmmmmmmmP..',
      '.OCPPssssssssssssssPP...',
      '.OCCCCo........OOOOOO...',
      '.OCCCCoOOOOOOOOffffffo..',
      '.Offffffffffffffffffffo.',
      '.OCCCCCCCCCCCCCCCCCCCCo.',
      '..oSSSSSSSSSSSSSSSSSSo..',
      '...oooooooooooooooooo...',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 19, rx: 11, ry: 1.6, key: 'z' },
  ),
  legend: {
    E: 'red',
    P: 'maroon',
    h: 'neon',
    r: 'red',
    m: 'maroon',
    s: 'stone',
    O: 'concrete',
    o: 'slate',
    f: 'fog',
    C: 'concrete',
    S: 'stone',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Instructor: a trainer with a staff badge points a marker at a whiteboard showing a
// desk lamp and rising bars.
// F board frame light, C frame and stand, S tray and feet, w board, a lamp sketch,
// y lamp light, e lamp stem, d blue bars, r red bar and lanyard, H hair, x skin,
// k skin shade, i eyes, marker and shoes, T jacket, M jacket shade, w shirt and badge,
// h badge stripe, D trousers, z shadow.

const INSTRUCTOR: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      'FFFFFFFFFFFFFF..........',
      'FwwwwwwwwwwwwC.HHHHH....',
      'FwaaawwwwwwwwCHHHHHHH...',
      'FaaaaawwwwrwwCHxxxxxH...',
      'FwwywwwwwwiwwCHxixixH...',
      'FwwewwwwdwxxwCHxxxxxH...',
      'FwwewwwwdwrTTCHxxkxxH...',
      'FwwewwdwdwrwTT..kkk.....',
      'FweeewdwdwrwwTTTwwwTM...',
      'FwwwwwwwwwwwwTTTwwwTMM..',
      'FwwwwwwwwwwwwCTTrTrTMM..',
      'FCCCCCCCCCCCCCTTwwwTMM..',
      '.SSrSdSSSSSSS.TThhhTMM..',
      '..C........C..TTTTTTMM..',
      '..C........C..TTTTTTMx..',
      '..C........C...DDDDD....',
      '..C........C...DD.DD....',
      '..C........C...DD.DD....',
      '..C........C...DD.DD....',
      '..C........C...DD.DD....',
      '.SSS......SSS.iii.iii...',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 22.4, rx: 11.5, ry: 1.2, key: 'z' },
  ),
  legend: {
    F: 'fog',
    C: 'concrete',
    S: 'stone',
    w: 'paper',
    a: 'amber',
    y: 'lamp',
    e: 'ember',
    d: 'denim',
    r: 'red',
    H: 'ember',
    x: 'skin',
    k: 'tan',
    i: 'ink',
    T: 'teal',
    M: 'moss',
    h: 'lamp',
    D: 'slate',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Workbook: a green spiral-bound workbook with a ruled label, its pages showing at
// the right and bottom, metal coils down the left edge.
// E cover lit outline, P cover shade outline, l cover light, L cover, M cover shade,
// w label and pages, g page edge, s ruled lines, O page lit outline, o page shade outline,
// f coil light, C coil, i punched hole, z shadow.

const WORKBOOK: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '......EEEEEEEEEEEEE.....',
      '.....ElllllllllllllPO...',
      '...fffiLLLLLLLLLLLMPgo..',
      '...CCClLLLLLLLLLLLMPwo..',
      '.....ElLLwwwwwwwwLMPgo..',
      '...fffiLLwwwwwwwgLMPwo..',
      '...CCClLLwssssssgLMPgo..',
      '.....ElLLwwwwwwwgLMPwo..',
      '...fffiLLwsssswwgLMPgo..',
      '...CCClLLggggggggLMPwo..',
      '.....ElLLLLLLLLLLLMPgo..',
      '...fffiLLLLLLLLLLLMPwo..',
      '...CCClLLLLLLLLLLLMPgo..',
      '.....ElLLLLLLLLLLLMPwo..',
      '...fffiLLLLLLLLLLLMPgo..',
      '...CCClLLLLLLLLLLLMPwo..',
      '.....ElLLLLLLLLLLLMPgo..',
      '...fffiMMMMMMMMMMMMPwo..',
      '...CCCPPPPPPPPPPPPPwgo..',
      '......Ogwgwgwgwgwgwgwo..',
      '.......oooooooooooooo...',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.5, rx: 10, ry: 1.4, key: 'z' },
  ),
  legend: {
    E: 'leaf',
    P: 'moss',
    l: 'leaf',
    L: 'leaf',
    M: 'moss',
    w: 'paper',
    g: 'fog',
    s: 'stone',
    O: 'fog',
    o: 'stone',
    f: 'fog',
    C: 'concrete',
    i: 'ink',
    z: 'fog',
  },
};

export const TRAINING_ITEMS: Readonly<Record<string, PixelSprite>> = {
  stationery: STATIONERY,
  server: SERVER,
  toner: TONER,
  stapler: STAPLER,
  instructor: INSTRUCTOR,
  workbook: WORKBOOK,
};
