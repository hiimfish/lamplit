import type { PixelSprite } from '../../game/sprites';
import { withShadow } from './draw';

// ---------------------------------------------------------------------------
// Counselor: a woman with dark shoulder-length hair, a blue blazer and a red
// lanyard badge, holding a clipboard.
// n hair outline, H hair, J hair shine, s skin, t skin shade, k ink, m mouth,
// O lit outline, o shade outline, B blazer, b blazer light, d lapel shade,
// w paper, R lanyard, g clip, f text line, e board edge, A board, c clip, z shadow.

const COUNSELOR: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.....nnnnnnnn...........',
      '....nHJJHHHHHn..........',
      '...nHJHHHHHHHHn.........',
      '...nHHHHHHHHHHn.........',
      '...nHHHssssHHHn.........',
      '...nHHskssksHHn.........',
      '...nHHssssssHHn.........',
      '...nHHssmmssHHn.........',
      '...nHHHtsstHHHn.........',
      '...nHHntsstnHHn..eccce..',
      '..ObBBdwwwwdBBBeAAAAAAAe',
      '.ObbBBRwwwwRBBBeAwwwwwAe',
      '.ObbBBBRwwRBBBBeAwfffwAe',
      '.ObbBBBBRRBBBBBeAwwwwwAe',
      '.ObbBBBggggBBBBeAwfffwAe',
      '.ObbBBBwkkwBBBssswwwwwAe',
      '.ObbBBBwwwwBBBstswfffwAe',
      '.OBBBBBwffwBBBBeAwwwwwAe',
      '.OBBBBBBBBBBBBBeAwfwwwAe',
      '.OBBBBBBBBBBBBBeAAAAAAAe',
      '.ooooooooooooooeeeeeeeee',
      '........................',
      '........................',
    ],
    { cx: 11, cy: 22.2, rx: 11, ry: 1.3, key: 'z' },
  ),
  legend: {
    n: 'night',
    H: 'ink',
    J: 'stone',
    s: 'skin',
    t: 'tan',
    k: 'ink',
    m: 'ember',
    O: 'sky',
    o: 'indigo',
    B: 'denim',
    b: 'sky',
    d: 'indigo',
    w: 'paper',
    R: 'red',
    g: 'fog',
    f: 'fog',
    e: 'ember',
    A: 'amber',
    c: 'concrete',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Assistant: a younger person in a teal top with a phone headset and mic,
// hugging a folder with papers.
// n hair outline, E hair, a hair shine, S/C headset, N mic tip, s skin, t shade,
// O lit outline, o shade outline, y light, T top, Z shade, g paper edge, w paper,
// e folder edge, h folder, A folder shade, f label line, z shadow.

const ASSISTANT: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........nnnnnnnn........',
      '......SSCCCCCCCCSS......',
      '.....SnEaEEEEEEEEnS.....',
      '.....SnEEEEEEEEEEnS.....',
      '....SCnEEEssssEEEnCS....',
      '....SCnEssksskssEnCS....',
      '....SCnEssssssssEnCS....',
      '....SCnENssmmsssEnCS....',
      '.....k..Ntsssst.........',
      '......kkk.tsst..........',
      '.....OyyTTssssTTTZo.....',
      '....OyyTTTTTTTTTTZZo....',
      '....OyTTTggggggggggo....',
      '....OyTTgwwwwwwwwwgo....',
      '....OyTehhhhhhhhhhhe....',
      '....OyTehhhhhhhhhhhAe...',
      '....Ossehwwwwhhhhhhss...',
      '....Ostehwffwhhhhhhts...',
      '....OyTehhhhhhhhhhhAe...',
      '....OyTeAAAAAAAAAAAAe...',
      '....oooeeeeeeeeeeeee....',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 22.2, rx: 11, ry: 1.3, key: 'z' },
  ),
  legend: {
    n: 'ember',
    E: 'amber',
    a: 'honey',
    S: 'slate',
    C: 'concrete',
    N: 'neon',
    s: 'skin',
    t: 'tan',
    k: 'ink',
    m: 'ember',
    O: 'cyan',
    o: 'moss',
    y: 'cyan',
    T: 'teal',
    Z: 'moss',
    g: 'fog',
    w: 'paper',
    e: 'ember',
    h: 'honey',
    A: 'amber',
    f: 'fog',
    z: 'fog',
  },
};

/** Word pictures of the job center. */
export const JOB_CENTER_ITEMS: Readonly<Record<string, PixelSprite>> = {
  counselor: COUNSELOR,
  assistant: ASSISTANT,
};
