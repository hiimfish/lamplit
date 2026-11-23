/** Word pictures of the interview with the reporter. */
import type { PixelSprite } from '../../game/sprites';
import { withShadow } from './draw';

// ---------------------------------------------------------------------------
// Radio: a red portable radio with a carrying handle, a pulled-out antenna,
// a slatted speaker grille, a tuning window with its needle and two knobs.
// O lit outline, o shade outline, h body light, r body, e body shade,
// w grille light, g grille slat, d window frame, y window, a tick, R needle,
// K knob light, c knob, S knob shade, n handle, k handle shade, s antenna,
// t antenna tip, z shadow.

const RADIO: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '....................tt..',
      '...................s....',
      '..................s.....',
      '.....nnnnnnnn....s......',
      '....nk......kn..s.......',
      '....nk......kn.s........',
      '..OOOOOOOOOOOOOOOOOOOo..',
      '..Ohhhhhhhhhhhhhhhhhro..',
      '..Orrwwwwwwrrdddddddeo..',
      '..OrwwwwwwwwrdyayRydeo..',
      '..OrggggggggrdyyyRydeo..',
      '..Orwwwwwwwwrdddddddeo..',
      '..Orggggggggrrrrrrrreo..',
      '..OrwwwwwwwwrKKcrKKceo..',
      '..OrggggggggrKccrKcceo..',
      '..OrwwwwwwwwrcSSrcSSeo..',
      '..Orrwwwwwwrrrrrrrrreo..',
      '..Oeeeeeeeeeeeeeeeeeeo..',
      '..oooooooooooooooooooo..',
      '...nn..............nn...',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.6, rx: 11, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'maroon',
    o: 'plum',
    h: 'rosy',
    r: 'red',
    e: 'maroon',
    w: 'paper',
    g: 'fog',
    d: 'maroon',
    y: 'honey',
    a: 'amber',
    R: 'red',
    K: 'fog',
    c: 'concrete',
    S: 'stone',
    n: 'slate',
    k: 'stone',
    s: 'concrete',
    t: 'fog',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Reporter: a man in a blue jacket and red tie holding up a hand microphone
// with a red station cube on it, mouth open as he speaks.
// n hair outline, H hair, h hair shine, s skin, t skin shade, k eye, q mouth,
// O lit outline, o shade outline, J jacket, j jacket shade, w shirt, R tie,
// S mic outline, w mic light, g mic mesh, c mic shade, M cube, m cube shade,
// z shadow.

const REPORTER: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '......nnnnnn............',
      '.....nHHHhhHn......SSS..',
      '....nHHHHHHHHn....SwggS.',
      '....nHHHHHHHHn....SwgcS.',
      '....nHssssssHn....SgccS.',
      '....nssksskssn.....SSS..',
      '....nssssssssn.....MMm..',
      '....nsssqqsssn.....MMm..',
      '.....nssssssn......mmm..',
      '......ntttn.........S...',
      '...OOOOwwwwwOOOo....S...',
      '..OJJJJwwRwwJJJJo..sss..',
      '..OJJJJJwRwJJJJjo..sss..',
      '..OJJJJJJRJJJJjjo..tst..',
      '..OJJJJJJRJJJJjjjJJJJj..',
      '..OJJJJJJRJJJJjjjjjjjo..',
      '..OJJJJJJJJJJJJjo.......',
      '..OJJJJJJJJJJJJjo.......',
      '..ooooooooooooooo.......',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 11, cy: 20, rx: 10, ry: 1.5, key: 'z' },
  ),
  legend: {
    n: 'plum',
    H: 'ember',
    h: 'amber',
    s: 'skin',
    t: 'tan',
    k: 'ink',
    q: 'maroon',
    O: 'indigo',
    o: 'deep',
    J: 'denim',
    j: 'indigo',
    w: 'paper',
    R: 'red',
    S: 'stone',
    g: 'fog',
    c: 'concrete',
    M: 'red',
    m: 'maroon',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Memorize: a head in profile with the brain showing, a note card going in at
// the top.
// O lit outline, o shade outline, d head, w eye and card, P brain, r brain
// light, p brain fold, S card outline, c card line, z shadow.

const MEMORIZE: PixelSprite = {
  rows: withShadow(
    [
      '.................SSSSSSS',
      '.................SwwwwwS',
      '.......OOOOOO....SwcccwS',
      '.....OOddddddoo..SwwwwwS',
      '....OddPPPPPdddo.SwcccwS',
      '...OddPrrPpPPdddoSSSSSSS',
      '...OdPrPPpPPpPddo.Y.....',
      '..OddPPpPPPpPPPdoY......',
      '..OdPPPPpPPPPpYdY.......',
      '..OddpPPPPpPPPYYo.......',
      '..OdwdddpppppdYYY.......',
      '.Oddddddddddddddo.......',
      '..Odddddddddddddo.......',
      '...Oddddddddddddo.......',
      '..Oddddddddddddo........',
      '...OOddddddddddo........',
      '.....OOOdddddddo........',
      '........Oddddddo........',
      '........Oddddddo........',
      '.......Oddddddddo.......',
      '.....OOddddddddddoo.....',
      '....oooooooooooooooo....',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.6, rx: 9.5, ry: 1.4, key: 'z' },
  ),
  legend: {
    O: 'sky',
    o: 'indigo',
    d: 'denim',
    w: 'paper',
    P: 'neon',
    r: 'rosy',
    p: 'neonDeep',
    S: 'stone',
    c: 'concrete',
    Y: 'lamp',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Pollution: dirty air. The top of a lone smokestack belches a thick, dark
// grey-brown cloud that fills the sky; below it a potted plant hangs wilted.
// L smoke light, S smoke, D smoke shade, C stack light, c stack, x stack shade,
// R band, m band shade, O base light, o base shade, g stem, l dry leaf,
// E pot rim, a pot, e pot shade, z shadow.

const POLLUTION: PixelSprite = {
  rows: withShadow(
    [
      '.....DDDD...DDDDD.......',
      '...DDSLLSD.DSLLLSDDDD...',
      '..DSLLLLSSDSLLLLSSSLLD..',
      '.DSLLSSSSSSSLLSSSSSLLSD.',
      '.DSSSSSSSSSSSSSSSSSSSSD.',
      '.DSSSDSSSSSSSSSSDSSSSSD.',
      '..DSSSSSSDDSSSSSSSSSSD..',
      '...DSSSDD..DDSSSSSSDD...',
      '...DSSSD...DSSSSSSSSD...',
      '...DSSD.....DDSSSSDD....',
      '..DSSSD.......DDDD......',
      '..CCCCc.................',
      '...Ccx.........gg.......',
      '...Ccx........g..g......',
      '...RRm.......lg...ll....',
      '...Ccx......llg....ll...',
      '...Ccx.......lgl...l....',
      '...RRm......EEEEEEe.....',
      '...Ccx.......aaaae......',
      '...Ccx.......aaaae......',
      '..OCcxo......eeeee......',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 11, cy: 21, rx: 10, ry: 1.4, key: 'z' },
  ),
  legend: {
    L: 'concrete',
    S: 'stone',
    D: 'plum',
    C: 'fog',
    c: 'concrete',
    x: 'stone',
    R: 'red',
    m: 'maroon',
    O: 'concrete',
    o: 'slate',
    g: 'leaf',
    l: 'tan',
    E: 'amber',
    a: 'ember',
    e: 'maroon',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Studio: a mixing desk of a recording studio, five channel strips with knobs
// and sliding faders, a level meter, and a red recording light on top.
// M light frame, N light glow, R light, S light stand, O lit outline,
// o shade outline, L desk top light, P desk, f desk front, k slot, w fader cap,
// g fader shade, Y C G N R knob caps, m meter off, Y G meter on, z shadow.

const STUDIO: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.........MMMMMM.........',
      '.........MNRRRM.........',
      '...........SS...........',
      '..OOOOOOOOOOOOOOOOOOOo..',
      '..OLLLLLLLLLLLLLLLLLLo..',
      '..OPPPPPPPPPPPPPPPPkko..',
      '..OPRPPYPPCPPGPPNPPmmo..',
      '..OPPPPPPPPPPPPPPPPYYo..',
      '..OPwPPwPPwPPwPPwPPYYo..',
      '..OPPPPPPPPPPPPPPPPGGo..',
      '..OPkPPkPwwwPkPPkPPGGo..',
      '..OwwwPkPgggPkPPkPPGGo..',
      '..OgggPkPPkPwwwPkPPkko..',
      '..OPkPwwwPkPgggPkPPPPo..',
      '..OPkPgggPkPPkPwwwPRRo..',
      '..OPkPPkPPkPPkPgggPPPo..',
      '..Offffffffffffffffffo..',
      '..oooooooooooooooooooo..',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 19.2, rx: 11, ry: 1.4, key: 'z' },
  ),
  legend: {
    M: 'maroon',
    N: 'neon',
    R: 'red',
    S: 'stone',
    O: 'slate',
    o: 'night',
    L: 'fog',
    P: 'concrete',
    f: 'stone',
    k: 'ink',
    w: 'paper',
    g: 'fog',
    Y: 'lamp',
    C: 'cyan',
    G: 'leaf',
    m: 'maroon',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Youth: a lanky teenager with messy hair, an orange hoodie, jeans and red
// sneakers, riding a skateboard.
// n hair outline, H hair, h hair shine, s skin, t neck, k eye, p blush,
// m mouth, O lit outline, o shade outline, T hoodie, c hoodie shade, w string,
// J jeans, j jeans shade, R sneaker, D deck, W wheel, z shadow.

const YOUTH: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........nn.nnn..........',
      '.......nHHnHHHn.........',
      '......nHHhHHHhHn........',
      '......nHsHHsHHHn........',
      '......nskssskssn........',
      '......nspsssspsn........',
      '......nsssmmsssn........',
      '.......nssssssn.........',
      '......OTTTtttTTo........',
      '.....OTTTTwtwTTTo.......',
      '....OTTTTTwTwTTTTo......',
      '....OTTcTTwTwTTcTo......',
      '....OTTcTTTTTTTcTo......',
      '....OTTcTTTTTTTcTo......',
      '....sscccccccccccss.....',
      '.......JJJJJJJJ.........',
      '.......JJJjJJJj.........',
      '......JJJj..JJJj........',
      '......JJJj..JJJj........',
      '..DD.RRRR...RRRR....DD..',
      '...DDDDDDDDDDDDDDDDDD...',
      '.....WW........WW.......',
      '........................',
    ],
    { cx: 12, cy: 22.6, rx: 10, ry: 1.1, key: 'z' },
  ),
  legend: {
    n: 'plum',
    H: 'ember',
    h: 'amber',
    s: 'skin',
    t: 'tan',
    k: 'ink',
    p: 'rosy',
    m: 'red',
    O: 'amber',
    o: 'ember',
    T: 'lamp',
    c: 'amber',
    w: 'paper',
    J: 'denim',
    j: 'indigo',
    R: 'red',
    D: 'teal',
    W: 'honey',
    z: 'fog',
  },
};

export const MEDIA_ITEMS: Readonly<Record<string, PixelSprite>> = {
  radio: RADIO,
  reporter: REPORTER,
  memorize: MEMORIZE,
  pollution: POLLUTION,
  studio: STUDIO,
  youth: YOUTH,
};
