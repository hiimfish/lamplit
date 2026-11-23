/** Item icons for the contract meeting unit. */
import type { PixelSprite } from '../../game/sprites';
import { withShadow } from './draw';

// ---------------------------------------------------------------------------
// Contract: a signed page with lines of terms, an ink signature and a red
// seal, a burgundy fountain pen resting on it with its gold nib on the name.
// O lit outline, o shade outline, w page, g page shade, c terms, k signature,
// s signature line, r seal, R seal shade, q pen light, p pen, P pen shade,
// y gold band and nib, a nib shade, E nib tip, z shadow.

const CONTRACT: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '...OOOOOOOOOOOOo......pP',
      '...Owwwwwwwwwwgo.....qpP',
      '...Owwwwwwwwwwgo....qpP.',
      '...Owccccccccwgo...qpP..',
      '...Owwwwwwwwwwgo..yya...',
      '...Owcccccccwwgo.qpP....',
      '...OwwwwwwwwwwgoqpP.....',
      '...OwccccccccwgqpP......',
      '...Owwwwwwwwwwyya.......',
      '...Owccccwwwwyao........',
      '...Owwwwwwwwyago........',
      '...Owwwwwwwwawgo........',
      '...OwwkwkkkEwwgo........',
      '...Owkwkwwkwwwgo........',
      '...Owsssssswrrgo........',
      '...OwwwwwwwrqrRo........',
      '...OwwwwwwwrrrRo........',
      '...OwwwwwwwwRRgo........',
      '...ooooooooooooo........',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 10, cy: 20.6, rx: 9.5, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    c: 'concrete',
    k: 'ink',
    s: 'fog',
    r: 'red',
    R: 'maroon',
    q: 'rosy',
    p: 'red',
    P: 'maroon',
    y: 'honey',
    a: 'amber',
    E: 'ember',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Trademark: a brand badge, a teal shield in a gold rim with a desk lamp
// emblem on it.
// L lit outline, P shade outline, Y rim light, y rim, a rim shade, t field,
// T field shade, h lamp light, l lamp, z shadow.

const TRADEMARK: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '....LLLLLLLLLLLLLLLP....',
      '....LYYYYYYYYYYYYYaP....',
      '....LYttttttttttttaP....',
      '....LYtttthlllttTTaP....',
      '....LYttthllllltTTaP....',
      '....LYtthlllllllTTaP....',
      '....LYthllllllllaTaP....',
      '....LYtttttllttTTTaP....',
      '....LYtttttllttTTTaP....',
      '....LYttthlllllTTTaP....',
      '....LYtthllllllaTTaP....',
      '....LYttttttttTTTTaP....',
      '.....LYttttttTTTTaP.....',
      '.....LYttttttTTTTaP.....',
      '......LYtttttTTTaP......',
      '.......LYttTTTTaP.......',
      '........LYtTTTaP........',
      '.........LYTTaP.........',
      '..........LaaP..........',
      '...........PP...........',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.8, rx: 7, ry: 1.6, key: 'z' },
  ),
  legend: {
    L: 'amber',
    P: 'plum',
    Y: 'honey',
    y: 'lamp',
    a: 'amber',
    t: 'teal',
    T: 'moss',
    h: 'paper',
    l: 'honey',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Judge: a grey-haired judge in a black robe with a white collar, and a
// wooden gavel raised beside him.
// O hair lit outline, o hair shade outline, w hair, g hair shade, b brows,
// s skin, t skin shade, K eyes, m mouth, D robe lit outline, d robe shade
// outline, n robe light, k robe, c collar, E wood lit outline, P wood shade
// outline, y wood light, a wood, e wood shade, z shadow.

const JUDGE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '......OOOOOOOo..........',
      '.....Owwwwwwggo.........',
      '....Owwwwwwwgggo........',
      '....Owssssssssgo........',
      '....Owsbbssbbtgo........',
      '....OwssKssKstgo........',
      '....Owssstssstgo.EEEEEP.',
      '....OwssmmmmstgoEyyyyyaP',
      '.....OsssssssttoEaaaaaeP',
      '......ottttttto.EeeeeeeP',
      '...DDncccccccckddPPPPPP.',
      '..Dnnkkcccccckkkd..ae...',
      '.Dnkkkkkkcckkkkkd..ae...',
      '.Dnkkkkkkkkkkkkkd..ae...',
      '.Dnkkkkkkkkkkkkkd..ae...',
      '.Dnkkkkkkkkkkkkkd..ae...',
      '.Dnkkkkkkkkkkkkkd..ae...',
      '.Dnkkkkkkkkkkkkkd..ae...',
      '.dddddddddddddddd..PP...',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.6, rx: 11, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'concrete',
    o: 'stone',
    w: 'paper',
    g: 'fog',
    b: 'concrete',
    s: 'skin',
    t: 'tan',
    K: 'ink',
    m: 'ember',
    D: 'stone',
    d: 'slate',
    n: 'night',
    k: 'ink',
    c: 'paper',
    E: 'ember',
    P: 'plum',
    y: 'honey',
    a: 'amber',
    e: 'ember',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Penalty: a hand holding up a red card.
// L card lit outline, M card shade outline, q card light, r card, R card
// shade, E hand lit outline, P hand shade outline, s skin, t skin shade and
// finger creases, z shadow.

const PENALTY: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.......LLLLLLLLLM.......',
      '.......LqqqqqqqrM.......',
      '.......LqrrrrrrRM.......',
      '.......LqrrrrrrRM.......',
      '.......LqrrrrrrRM.......',
      '.......LqrrrrrrRM.......',
      '.......LqrrrrrrRM.......',
      '.......LrrrrrrrRM.......',
      '.......LrrrrrrrRM.......',
      '.......LrrrrrrrRM.......',
      '.....EEEErrrrrrRM.......',
      '....EsssstrrrrrRM.......',
      '....EssssstEEEEEEP......',
      '.....EtttsssssssstP.....',
      '.....EssssttttttttP.....',
      '.....EsssssssssssstP....',
      '.....EsttttttttttttP....',
      '.....EsssssssssssstP....',
      '......EtttttttttttP.....',
      '......EsssssssssstP.....',
      '.......PPPPPPPPPPP......',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.6, rx: 8, ry: 1.4, key: 'z' },
  ),
  legend: {
    L: 'neonDeep',
    M: 'maroon',
    q: 'neon',
    r: 'red',
    R: 'maroon',
    E: 'ember',
    P: 'plum',
    s: 'skin',
    t: 'tan',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Copyright: a round paper seal with a thick blue copyright sign.
// O lit outline, o shade outline, b ring light, B ring, d ring shade,
// w paper, g paper shade, z shadow.

const COPYRIGHT: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........OOOOOOOO........',
      '......OObbbbbbbbOo......',
      '.....OObBBBBBBBBBoo.....',
      '....ObbBwwwwwwwwBBBo....',
      '...OObBwwbbbbbBwwBBoo...',
      '...ObBwwbBBBBBBBwwBBo...',
      '..ObBwwbBBBBBBBwwwwBdo..',
      '..ObBwbBBBBwwwwwwwwBdo..',
      '..ObBwbBBBwwwwwwwwwBdo..',
      '..ObBwbBBwwwwwwwwwwBdo..',
      '..ObBwbBBwwwwwwwwwwBdo..',
      '..ObBwbBBBwwwwwwwwwBdo..',
      '..ObBwBBBBBwwwwwwwgBdo..',
      '..ObBwwBBBBBBBBwwggBdo..',
      '...OBBwwBBBBBBBdwgBdo...',
      '...ooBBwwBBddddggBdoo...',
      '....oBBBwwggggggBddo....',
      '.....ooBBBBBBBBBdoo.....',
      '......ooddddddddoo......',
      '........oooooooo........',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.6, rx: 10, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'sky',
    o: 'indigo',
    b: 'sky',
    B: 'denim',
    d: 'indigo',
    w: 'paper',
    g: 'fog',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Secret: a face with closed eyes and one finger held up to the lips, "shh".
// P shade outline, h hair light, e hair, E lit outline, s skin, t skin shade,
// k closed eyes, r cheeks, m lips, f finger, F finger shade, z shadow.

const SECRET: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........PPPPPPPP........',
      '......PPhhheeeeePP......',
      '.....PhhheeeeeeeeeP.....',
      '....PhheeeeeeeeeeeeP....',
      '....PheeeeeeeeeeeeeP....',
      '....PeeeeesssseeeeeP....',
      '....PeeesssssssseeeP....',
      '....PeesssssssssseeP....',
      '....PesssssssssssseP....',
      '...EEessssssssssssePP...',
      '..EstskkksssssskkksttP..',
      '..EstssssssssssssstttP..',
      '..EttssssssEPssssstttP..',
      '...EEsrrssEfFPssrrtPP...',
      '....EssssmEfFPmsssstP...',
      '....EsssssEfFPssssstP...',
      '.....EssssEfFPssstP.....',
      '......EEEEEfFPPPPP......',
      '......EsstsssstssP......',
      '......EsstsssstssP......',
      '.......EttttttttP.......',
      '........PPPPPPPP........',
      '........................',
    ],
    { cx: 12, cy: 22.6, rx: 9, ry: 1.3, key: 'z' },
  ),
  legend: {
    P: 'plum',
    h: 'amber',
    e: 'ember',
    E: 'ember',
    s: 'skin',
    t: 'tan',
    k: 'ink',
    r: 'rosy',
    m: 'maroon',
    f: 'skin',
    F: 'tan',
    z: 'fog',
  },
};

export const LEGAL_ITEMS: Readonly<Record<string, PixelSprite>> = {
  contract: CONTRACT,
  trademark: TRADEMARK,
  judge: JUDGE,
  penalty: PENALTY,
  copyright: COPYRIGHT,
  secret: SECRET,
};
