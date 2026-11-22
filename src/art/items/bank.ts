import type { PixelSprite } from '../../game/sprites';
import { withShadow } from './draw';

// ---------------------------------------------------------------------------
// Passport: a closed dark booklet with a gold emblem on the cover and pages showing below.

const PASSPORT: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '.....OOOOOOOOOOOOOo.....',
      '.....Odkbbbbbbbbbbo.....',
      '.....Odbbbbbbbbbbbo.....',
      '.....Odbbbbbbbbbbbo.....',
      '.....Odbbbbbbbbbbbo.....',
      '.....Odbbbhhhhbbbbo.....',
      '.....Odbbhhaahhbbbo.....',
      '.....Odbbhaaaahbbbo.....',
      '.....Odbbhaaaahbbbo.....',
      '.....Odbbhhaahhbbbo.....',
      '.....Odbbbhhhhbbbbo.....',
      '.....Odbbbbbbbbbbbo.....',
      '.....Odbbhhhhhhbbbo.....',
      '.....Odbbbbbbbbbbbo.....',
      '.....Odbbbhhhhbbbbo.....',
      '.....Odbbbbbbbbbbbo.....',
      '.....Odbbbbbbbbbbbo.....',
      '.....Owwwwwwwwwwwwo.....',
      '.....oooooooooooooo.....',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 11.5, cy: 21.2, rx: 7.5, ry: 1.4, key: 'z' },
  ),
  legend: {
    O: 'sky',
    o: 'deep',
    d: 'deep',
    b: 'indigo',
    k: 'dusk',
    h: 'honey',
    a: 'amber',
    w: 'paper',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// ATM: a grey cash machine with a lit screen, keypad, card slot and a banknote coming out.

const ATM: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '...OOOOOOOOOOOOOOOOOo...',
      '...Okbnnnnnnnnnnnnbdo...',
      '...Okbnccccccccccnbdo...',
      '...Okbnctttttttccnbdo...',
      '...Okbnccccccccccnbdo...',
      '...Okbncttttcccccnbdo...',
      '...Obbnnnnnnnnnnnnbdo...',
      '...Obbsssssssbbhhbbdo...',
      '...Obbsfsfsfsbbbbbbdo...',
      '...Obbsssssssbnnnnbdo...',
      '...Obbsfsfsfsbbbbbbdo...',
      '...Obbsssssssbbbbbbdo...',
      '...Obbsfsfsfsbbbbbbdo...',
      '...Obbsssssssbbbbbbdo...',
      '...Obbnnnnnnnnnnnnbdo...',
      '...ObbbLLLLLLLLLLbbdo...',
      '...ObbbLLmmmmmmLLbbdo...',
      '...ooooLLLLLLLLLLoooo...',
      '.......mmmmmmmmmm.......',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 11.5, cy: 21.6, rx: 9, ry: 1.4, key: 'z' },
  ),
  legend: {
    O: 'fog',
    o: 'slate',
    b: 'concrete',
    k: 'fog',
    d: 'stone',
    n: 'night',
    c: 'cyan',
    t: 'teal',
    s: 'slate',
    f: 'fog',
    h: 'honey',
    L: 'leaf',
    m: 'moss',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Save: a pink piggy bank with a gold coin dropping into the slot on its back.

const SAVE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '..........aaa...........',
      '.........ahhha..........',
      '.........ahaha..........',
      '.........ahhha..........',
      '..........aaa...........',
      '..............Oro.......',
      '.............Orrro......',
      '......OOOnnnnOOOOo......',
      '....Okkpppppppppppppo...',
      '...Okkppppppppppppppo...',
      '..Okpppppppppppppepppo..',
      '.OpppppppppppppppppNNNo.',
      '.OpppppppppppppppppNnNo.',
      '.OpppppppppppppppppNNNo.',
      '..Ossppppppppppppppppo..',
      '...Ossssppppppppppppo...',
      '....Osssssssssssssso....',
      '......Opppo....Opppo....',
      '......Opppo....Opppo....',
      '......ooooo....ooooo....',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 11.5, cy: 20.9, rx: 9, ry: 1.4, key: 'z' },
  ),
  legend: {
    O: 'neonDeep',
    o: 'plum',
    p: 'rosy',
    s: 'mauve',
    k: 'paper',
    N: 'neon',
    n: 'night',
    e: 'night',
    r: 'neon',
    a: 'amber',
    h: 'honey',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Credit: a blue bank card at a slight angle: dark stripe, gold chip, number dashes.

const CREDIT: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '................OOOOOO..',
      '.......OOOOOOOOOkkkkdo..',
      '..OOOOOkkkkkkkkknnnnno..',
      '..Obkkknnnnnnnnnnnnnno..',
      '..Onnnnnnnnnnnnnbbbbdo..',
      '..Onnnnbbbbbbbbbbbbbdo..',
      '..Obbbbbbbbbbbbbbbbbdo..',
      '..Obbbbaabbbbbbbfbffdo..',
      '..Obaaahabbffbffbbbbdo..',
      '..Obahahabbbbbbbfbbbdo..',
      '..Obahhaabbfffffrrrrdo..',
      '..Obaaabbbbbbbbbdddddo..',
      '..Obbbbdddddddddoooooo..',
      '..Oddddooooooooo........',
      '..Ooooo.................',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21, rx: 9, ry: 1.4, key: 'z' },
  ),
  legend: {
    O: 'sky',
    o: 'deep',
    k: 'sky',
    b: 'denim',
    d: 'indigo',
    n: 'night',
    a: 'amber',
    h: 'honey',
    f: 'fog',
    r: 'neon',
    z: 'fog',
  },
};

/** Word pictures of the bank. */
export const BANK_ITEMS: Readonly<Record<string, PixelSprite>> = {
  passport: PASSPORT,
  atm: ATM,
  save: SAVE,
  credit: CREDIT,
};
