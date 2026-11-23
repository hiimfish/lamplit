/** Word pictures of the annual meeting. */
import type { PixelSprite } from '../../game/sprites';
import { withShadow } from './draw';

// ---------------------------------------------------------------------------
// Bright: a glowing light bulb with short rays all round, a filament inside
// and a metal screw base.
// O lit outline, o shade outline, h glass, y glass shade, w glint, a filament,
// l rays, S base light, s base, d base dark, k base outline, z shadow.

const BRIGHT: PixelSprite = {
  rows: withShadow(
    [
      '...........ll...........',
      '...l.......ll.......l...',
      '....l..............l....',
      '.........OOOOOO.........',
      '.......OOhhhhhhoo.......',
      '......OhhwwhhhhhyO......',
      '.....OhwwhhhhhhhhyO.....',
      '.....Ohwhhhhhhhhhyo.....',
      '.....Ohhhhahhahhhyo.....',
      '.ll..Ohhhhahhahhhyo..ll.',
      '.....Ohhhhaaaahhyyo.....',
      '.....Ohhhhhaahhhyyo.....',
      '.....Ohhhhhaahhhyyo.....',
      '....l.Ohhhhaahyyo.l.....',
      '...l...Ohhhaahyo...l....',
      '........ohhaahyo........',
      '........kSSSssdk........',
      '........kssssddk........',
      '........kSSSssdk........',
      '........kssssddk........',
      '.........kSssdk.........',
      '..........kkkk..........',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 22.6, rx: 6, ry: 1.2, key: 'z' },
  ),
  legend: {
    O: 'amber',
    o: 'ember',
    h: 'honey',
    y: 'lamp',
    w: 'paper',
    a: 'amber',
    l: 'lamp',
    S: 'fog',
    s: 'concrete',
    d: 'stone',
    k: 'slate',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Clap: two hands in side view meeting palm to palm, thumbs out, the right
// one in shade, sleeve cuffs below and short motion marks round the fingertips.
// O lit outline, o shade outline, k skin, t skin shade, e back hand crease,
// w glint, b cuff light, B cuff, d cuff shade, N cuff outline, l motion marks,
// z shadow.

const CLAP: PixelSprite = {
  rows: withShadow(
    [
      '....l......ll......l....',
      '.....l.....ll.....l.....',
      '..........OOoo..........',
      '.........Okooto.........',
      '.......Okwkoottto.......',
      '.ll...Okktkootetto...ll.',
      '......Okktkootetto......',
      '.....Okktkkoottetto.....',
      '.....Okktkkoottetto.....',
      '...OOOktkkkootttetooo...',
      '..Okktkkkkkootttttetto..',
      '...okkkkkto..oettttto...',
      '....Okkkkto..oetttto....',
      '....Okkkto....oettto....',
      '....Okkkto....oettto....',
      '...Okkkto......oettto...',
      '...Okkkto......oettto...',
      '..NbbbbBN......NdBBBBN..',
      '..NbbbbBN......NdBBBBN..',
      '..NBBBBdN......NdddddN..',
      '..NNNNNNN......NNNNNNN..',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.6, rx: 9, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'ember',
    o: 'plum',
    k: 'skin',
    t: 'tan',
    e: 'ember',
    w: 'paper',
    b: 'sky',
    B: 'denim',
    d: 'indigo',
    N: 'slate',
    l: 'lamp',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Vote: a ticked ballot paper going into the slot of a blue ballot box with
// a blank paper label on the front.
// O paper lit outline, o paper shade outline, w paper, g paper shade, c tick,
// K box lit outline, k box shade outline, s lid, n slot, d lid edge and side,
// D box front, z shadow.

const VOTE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........OOOOOOOo........',
      '........Owwwwwgo........',
      '........Owwwwcgo........',
      '........Owwwcwgo........',
      '........Ocwcwwgo........',
      '........Owcwwwgo........',
      '........Owwwwwgo........',
      '...KKKKKOwwwwwgoKKKKk...',
      '...KwwssOwwwwwgossssk...',
      '...KssssOwwwwwgossssk...',
      '...Ksssnnnnnnnnnnsssk...',
      '...Kssssssssssssssssk...',
      '...Kddddddddddddddddk...',
      '...KDDDDDDDDDDDDDDDdk...',
      '...KDDDDwwwwwwwgDDDdk...',
      '...KDDDDwwwwwwwgDDDdk...',
      '...KDDDDggggggggDDDdk...',
      '...KDDDDDDDDDDDDDDDdk...',
      '...KDDDDDDDDDDDDDDDdk...',
      '...kkkkkkkkkkkkkkkkkk...',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.8, rx: 11, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    c: 'red',
    K: 'denim',
    k: 'indigo',
    s: 'sky',
    n: 'ink',
    d: 'indigo',
    D: 'denim',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Reward: a blue prize rosette, pleated all round, with a gold centre and two
// ribbon tails with notched ends.
// K lit outline, k shade outline, s pleat light, b pleat, D pleat shade,
// a gold rim lit, e gold rim shade, y gold light, h gold, w glint, z shadow.

const REWARD: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '............KK..........',
      '........KK.KssK.........',
      '.......KssKbssbKKK......',
      '.......Kssbbssbbsk......',
      '.....KKbbsaaaabsbk......',
      '....KsssbayyyyabDk......',
      '.....KssaywyyhheDDkk....',
      '.....Kbbayyyhhhebbbk....',
      '....KbbayyyhhhaaeDDk....',
      '....KsssayhhhaaeDDk.....',
      '....KKbbahhhaaaebbk.....',
      '......KbsehaaaeDbbbk....',
      '......KsbDeeeebDDkk.....',
      '......KbDDbbDDbbk.......',
      '......kkkDbbDkbbk.......',
      '......KbbkbbkkkkDk......',
      '......Kbbkkk..kDDk......',
      '.....Kbbbk....kDDDk.....',
      '.....Kbbk......kDDk.....',
      '....Kk.kk......kk.kk....',
      '....K..k........k..k....',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 22.2, rx: 8, ry: 1.3, key: 'z' },
  ),
  legend: {
    K: 'denim',
    k: 'indigo',
    s: 'paper',
    b: 'sky',
    D: 'denim',
    a: 'amber',
    e: 'ember',
    y: 'honey',
    h: 'lamp',
    w: 'paper',
    z: 'fog',
  },
};

export const ANNUAL_MEETING_ITEMS: Readonly<Record<string, PixelSprite>> = {
  bright: BRIGHT,
  clap: CLAP,
  vote: VOTE,
  reward: REWARD,
};
