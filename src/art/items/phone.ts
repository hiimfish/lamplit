/** Item icons for the phone and messages unit. */
import type { PixelSprite } from '../../game/sprites';
import { withShadow } from './draw';

// ---------------------------------------------------------------------------
// Telephone: a red desk telephone seen from the front, the handset lying
// across the top and a round dial on the body.
// O lit outline, o shade outline, h shine, r body, R body shade,
// w dial, g dial shade, G dial hub, k finger holes, z shadow.

const TELEPHONE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '....OOOOOOOOOOOOOOOO....',
      '..OOhhhhhhhhhhhhrrrroo..',
      '.OhhrrrrrrrrrrrrrrrrRRo.',
      '.OhrrrrrrrrrrrrrrrrrrRo.',
      '.OrrrrRoooooooooorrrRRo.',
      '.OrrrrRo.OrrrRo.OrrrRRo.',
      '..ooooo..OrrrRo..ooooo..',
      '......OOOOOOOOOOOo......',
      '.....OhhrrrrrrrrrRo.....',
      '....OhrrrrwwwwrrrrRo....',
      '...OrrrrrwkwwkwrrrrRo...',
      '..OrrrrrwwwggwwgrrrrRo..',
      '..OrrrrrwkgGGgkgrrrrRo..',
      '..OrrrrrwkgGGgkgrrrRRo..',
      '..OrrrrrwwwggwggrrrRRo..',
      '..OrrrrrRgkwgkgRrrRRRo..',
      '..OrrrrRRRggggRRRRRRRo..',
      '.OrrrrrrrRRRRRRRRRRRRRo.',
      '.oooooooooooooooooooooo.',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.8, rx: 11.5, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'maroon',
    o: 'plum',
    h: 'neon',
    r: 'red',
    R: 'maroon',
    w: 'paper',
    g: 'fog',
    G: 'concrete',
    k: 'maroon',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Operator: the headset an operator wears, seen from the front: a headband,
// two ear cups with teal cushions and a boom microphone with a pink foam tip.
// O lit outline, o shade outline, f shine, S shell, s shell shade,
// c cushion light, T cushion, P mic outline, n mic light, N mic, M mic shade,
// z shadow.

const OPERATOR: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........OOOOOOOO........',
      '.....OOOffffffffSoo.....',
      '....OfffSSSSSSSSSSso....',
      '...OffSSooooooooSSSso...',
      '..OffSSo........oSSsso..',
      '..OfSSo..........oSSso..',
      '.OfSSo............oSSso.',
      '.OfSSo............oSSso.',
      '.OOOOOOo........OOOOOOo.',
      '.OffScTo........OcTSSso.',
      '.OfSScTo........OcTSSso.',
      '.OfSSTTo........OTTSSso.',
      '.OfSSTTo........OTTSSso.',
      '.OfSSTTo........OTTSSso.',
      '.OfSSTTo........OTTSSso.',
      '.OSSsTTo........OTTSsso.',
      '.ooooooo..PPP...ooooooo.',
      '...OS....PnNNP..........',
      '...OSSSSSPNNNP..........',
      '....oooooPNNMP..........',
      '..........PPP...........',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 22, rx: 11, ry: 1.5, key: 'z' },
  ),
  legend: {
    O: 'concrete',
    o: 'night',
    f: 'fog',
    S: 'stone',
    s: 'slate',
    c: 'cyan',
    T: 'teal',
    P: 'maroon',
    n: 'rosy',
    N: 'neon',
    M: 'neonDeep',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Signal: the signal sign of a mobile phone, a blue tile with a small antenna
// and four rising bars, three lit and the tallest one dim.
// O lit outline, o shade outline, i tile, a antenna, c bar, T bar shade,
// d dim bar, z shadow.

const SIGNAL: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '...OOOOOOOOOOOOOOOOOo...',
      '..Oiiiiiiiiiiiiiiiiiio..',
      '..Oiaiiaiiaiiiiiiiiiio..',
      '..Oiiaiaiaiiiiiiidddio..',
      '..Oiiiaaaiiiiiiiidddio..',
      '..Oiiiiaiiiiiiiiidddio..',
      '..Oiiiiaiiiiiiiiidddio..',
      '..OiiiiaiiiiiccTidddio..',
      '..OiiiiaiiiiiccTidddio..',
      '..OiiiiaiiiiiccTidddio..',
      '..OiiiiiiiiiiccTidddio..',
      '..OiiiiiiccTiccTidddio..',
      '..OiiiiiiccTiccTidddio..',
      '..OiiiiiiccTiccTidddio..',
      '..OiiccTiccTiccTidddio..',
      '..OiiccTiccTiccTidddio..',
      '..OiiccTiccTiccTidddio..',
      '..OiiccTiccTiccTidddio..',
      '..Oiiiiiiiiiiiiiiiiiio..',
      '...oooooooooooooooooo...',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.2, rx: 10.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'sky',
    o: 'indigo',
    i: 'denim',
    a: 'paper',
    c: 'cyan',
    T: 'teal',
    d: 'indigo',
    z: 'fog',
  },
};

export const PHONE_ITEMS: Readonly<Record<string, PixelSprite>> = {
  telephone: TELEPHONE,
  operator: OPERATOR,
  signal: SIGNAL,
};
