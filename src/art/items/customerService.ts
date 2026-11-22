/** Item icons for the customer service unit. */
import type { PixelSprite } from '../../game/sprites';
import { withShadow } from './draw';

// ---------------------------------------------------------------------------
// Apologize: a person in a blue jacket seen from the side, bowing deeply to the
// left with the hands on the knees, two sweat drops flying off the head.
// c drop, C drop shade, n hair outline, H hair, J hair shine, s skin, t skin
// shade, k closed eye, E face lit outline, P shade outline, w collar,
// O lit outline, o shade outline, b jacket light, B jacket, d jacket shade,
// L trouser lit outline, D trousers, N trouser shade, a shoe light, e shoe,
// z shadow.

const APOLOGIZE: PixelSprite = {
  rows: withShadow(
    [
      '......c.................',
      '.c...ccC................',
      'ccC..ccC................',
      'ccC...C.......OOOOOO....',
      '.C.........OOObbbbbbOo..',
      '...nnnnn.OObbbBBBBBBBBo.',
      '..nHJJHHnObbBBBBBBBBBBo.',
      '.nHJHHHHHnwBBBBBBBBBBBo.',
      '.nHHHHHHHHwwBBBBBBBBBBo.',
      '.nHHHHsHHssObBBdddddddo.',
      '.nHHHsstsst.ObBBoLDDDNo.',
      '..EsskssssP..ObBsLDDDNo.',
      '...EsssstP.....otsDDDNo.',
      '....EtttP........LDDDNo.',
      '.................LDDDNo.',
      '.................LDDDNo.',
      '.................LDDDNo.',
      '.................LDDDNo.',
      '.................LDDDNo.',
      '.................LDDDNo.',
      '...............aeeeeeeP.',
      '..............aeeeeeeeP.',
      '..............PPPPPPPPP.',
      '........................',
    ],
    { cx: 14, cy: 22.4, rx: 9.5, ry: 1.5, key: 'z' },
  ),
  legend: {
    c: 'cyan',
    C: 'teal',
    n: 'night',
    H: 'slate',
    J: 'stone',
    s: 'skin',
    t: 'tan',
    k: 'ink',
    E: 'ember',
    P: 'plum',
    w: 'paper',
    O: 'sky',
    o: 'indigo',
    b: 'sky',
    B: 'denim',
    d: 'indigo',
    L: 'stone',
    D: 'slate',
    N: 'night',
    a: 'amber',
    e: 'ember',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Coupon: a red voucher with a gold star, a dotted cut line near its right end
// and a pair of scissors standing on that line, about to cut the stub off.
// E lit outline, P shade outline, n top light, r card, m card shade, y star,
// w print and cut line, T scissor handle, c handle glint, U handle shade,
// g blade, G blade shade, S pivot, z shadow.

const COUPON: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '...........TTTT...TTTT..',
      '..........TcTTTT.TcTTTT.',
      '..........TT..TT.TT..TT.',
      '..........TT..TT.TT..TT.',
      '..........TTTTTU.TTTTTU.',
      '...........TTTTU.TTTTU..',
      '..............TU.TU.....',
      '...............gSG......',
      '..............gG.gG.....',
      '..EEEEEEEEEEEEgGEgGEEP..',
      '.EnnnnnnnnnnngGnwngGnnP.',
      '.ErrrryrrrrrrgrrrrrGrrP.',
      '.ErrryyyrrrrrrrrwrrrrrP.',
      '.EryyyyyyyrwwwwrrrwwwrP.',
      '.ErryyyyyrrrrrrrwrrrrrP.',
      '.ErryyryyrrwwwwrrrwwwrP.',
      '.ErryrrryrrrrrrrwrrrrrP.',
      '.ErrrrrrrrrwwwrrrrrrrrP.',
      '.EmmmmmmmmmmmmmmwmmmmmP.',
      '..PPPPPPPPPPPPPPPPPPPP..',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.8, rx: 11.5, ry: 1.8, key: 'z' },
  ),
  legend: {
    E: 'maroon',
    P: 'plum',
    n: 'neon',
    r: 'red',
    m: 'maroon',
    y: 'honey',
    w: 'paper',
    T: 'teal',
    c: 'cyan',
    U: 'deep',
    g: 'fog',
    G: 'concrete',
    S: 'stone',
    z: 'fog',
  },
};

export const CUSTOMER_SERVICE_ITEMS: Readonly<Record<string, PixelSprite>> = {
  apologize: APOLOGIZE,
  coupon: COUPON,
};
