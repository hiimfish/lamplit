/** Item icons for the email unit: four signs seen in a mailbox. */
import type { PixelSprite } from '../../game/sprites';
import { withShadow } from './draw';

// ---------------------------------------------------------------------------
// Link: two blue chain links joined on a diagonal, the upper one passing over
// the lower one on the left and under it on the right.
// O lit outline, o shade outline, h link, b link shade, z shadow.

const LINK: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '............OOOOOo......',
      '...........Ohhhhhbo.....',
      '..........Owhbbbhhbo....',
      '.........Owhbooohhbo....',
      '........Owhbo...Ohbo....',
      '.......Ohhbo....Ohbo....',
      '......Ohhbo.....Ohbo....',
      '......OhbOOOOOoOhhbo....',
      '......Ohbohhhhbohbo.....',
      '......Ohbobbbhhboo......',
      '......obhhOOohhbo.......',
      '.....OhobhhhhOhbo.......',
      '....Owhbobbbbbhbo.......',
      '...Owhbo.ooooohbo.......',
      '...Ohbo.....Ohhbo.......',
      '...Ohbo....Ohhbo........',
      '...Ohbo...Ohhbo.........',
      '...obhhOOOhhbo..........',
      '....obhhhhhbo...........',
      '.....obbbbbo............',
      '......ooooo.............',
      '........................',
      '........................',
    ],
    { cx: 10.5, cy: 21.8, rx: 8, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'denim',
    o: 'indigo',
    h: 'sky',
    b: 'denim',
    w: 'paper',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Error: a yellow warning triangle with a black exclamation mark.
// E lit outline, P shade outline, Y sign, y sign shade, K mark, z shadow.

const ERROR: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '..........EEEP..........',
      '..........EYyP..........',
      '.........EYYyyP.........',
      '.........EYYYyP.........',
      '........EYYKKYyP........',
      '.......EYYYKKYYyP.......',
      '.......EYYYKKYYyP.......',
      '......EYYYYKKYYYyP......',
      '......EYYYYKKYYYyP......',
      '.....EYYYYYKKYYYYyP.....',
      '.....EYYYYYKKYYYYyP.....',
      '....EYYYYYYKKYYYYYyP....',
      '....EYYYYYYYYYYYYYyP....',
      '...EYYYYYYYKKYYYYYYyP...',
      '..EYYYYYYYYKKYYYYYYYyP..',
      '..EYYYYYYYYYYYYYYYYyyP..',
      '..PyyyyyyyyyyyyyyyyyyP..',
      '...PPPPPPPPPPPPPPPPPP...',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.4, rx: 11, ry: 1.8, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    Y: 'honey',
    y: 'lamp',
    K: 'ink',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Correct: a round green badge with a white check mark.
// O lit outline, o shade outline, l badge, d badge shade, h glint, w check, z shadow.

const CORRECT: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.........OOOOOO.........',
      '.......OOllllllOO.......',
      '.....OOllllllllllOo.....',
      '....Ollhhllllllllldo....',
      '....Olhllllllllllllo....',
      '...Olhllllllllllwwwdo...',
      '...Olllllllllllwwwwdo...',
      '..Olllllllllllwwwwdldo..',
      '..Ollllllllllwwwwdlldo..',
      '..Ollwwwllllwwwwdllldo..',
      '..Ollwwwwllwwwwdlllddo..',
      '..Olllwwwwwwwwdllllddo..',
      '..Ollllwwwwwwdlllllddo..',
      '...Ollllwwwwdlllllddo...',
      '...Olllllwwdllllldddo...',
      '....Ollllddllllldddo....',
      '....Odlllllllllddddo....',
      '.....ooddllldddddoo.....',
      '.......ooddddddoo.......',
      '.........oooooo.........',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.2, rx: 8, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'moss',
    o: 'night',
    l: 'leaf',
    d: 'moss',
    h: 'honey',
    w: 'paper',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Reply: a bold arrow that comes up from the lower right and turns back to
// point left.
// O lit outline, o shade outline, c arrow, t arrow shade, w glint, z shadow.

const REPLY: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........O...............',
      '.......Oo...............',
      '......Oco...............',
      '.....Owco...............',
      '....Owcco...............',
      '...OwccccOOOOOOOOO......',
      '..OwccccccwwwwwwccOo....',
      '.Occcccccccccccccccco...',
      '.otcccccccccccccccccto..',
      '..otcccccttttttcccccto..',
      '...otccccooooootccccto..',
      '....otcco......occccto..',
      '.....otco.......Occcto..',
      '......oto.......Occcto..',
      '.......oo.......Occcto..',
      '........o.......Occcto..',
      '................Otttto..',
      '................oooooo..',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 13, cy: 20.6, rx: 9.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'teal',
    o: 'deep',
    c: 'cyan',
    t: 'teal',
    w: 'paper',
    z: 'fog',
  },
};

export const EMAIL_ITEMS: Readonly<Record<string, PixelSprite>> = {
  link: LINK,
  error: ERROR,
  correct: CORRECT,
  reply: REPLY,
};
