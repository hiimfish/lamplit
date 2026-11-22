/** Item icons for the company event unit. */
import type { PixelSprite } from '../../game/sprites';
import { withShadow } from './draw';

// ---------------------------------------------------------------------------
// Stage: a wooden stage seen from the front, red curtains tied back under a
// pleated valance, a spotlight falling on the boards.
// E lit wood outline, P shade outline, h wood light, y wood, a wood front,
// e wood shade, O curtain lit outline, o curtain shade outline, n curtain light,
// r curtain, m fold, M curtain shade, B backdrop, l light beam, w light pool,
// z shadow.

const STAGE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.EhhhhhhhhhhhhhhhhhhyyP.',
      '.Onrrmnrrmnrrmnrrmnrrmo.',
      '.Onrrmnrrmnrrmnrrmnrrmo.',
      '.Onrrmnrrmnrrmnrrmnrrmo.',
      '.Ohyyyyyyyyyyyyyyyyyyao.',
      '.OnrmrrmBBBllBBBnrrmrMo.',
      '.OnrmrrmBBBllBBBnrrmrMo.',
      '.OnrmrmBBBBllBBBBnrmrMo.',
      '.OnrmrmBBBllllBBBnrmrMo.',
      '.OnrmrmBBBllllBBBnrmrMo.',
      '.OhyyaBBBllllllBBBhyyao.',
      '.OnrrmBBBllllllBBBnrrMo.',
      '.OnrrmBBllllllllBBnrrMo.',
      '.OnrrmBBllllllllBBnrrMo.',
      '.OnrrmBllllllllllBnrrMo.',
      'EhhhhhhhwwwwwwwwhhhhhhhP',
      'EyyyyyyyyyhhhhyyyyyyyyyP',
      'EaaaaaaaaaaaaaaaaaaaaaaP',
      'EaaaaaaaaaaaaaaaaaaaaeeP',
      '.PPPPPPPPPPPPPPPPPPPPPP.',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21, rx: 11.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    h: 'honey',
    y: 'lamp',
    a: 'amber',
    e: 'ember',
    O: 'maroon',
    o: 'plum',
    n: 'neon',
    r: 'red',
    m: 'maroon',
    M: 'maroon',
    B: 'deep',
    l: 'dusk',
    w: 'paper',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Location: a big red map pin standing on a small piece of map.
// O lit outline, o shade outline, n pin light, r pin, M pin shade, w hole and
// map paper and roads, g hole shade, pin shadow and a city block, S map lit edge,
// s map shade edge, l park, k water, a city block, z shadow.

const LOCATION: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.........OOOOOO.........',
      '.......OOnnnnrroo.......',
      '......OnnnnrrrrrMo......',
      '.....OnnnrrrrrrrrMo.....',
      '.....OnnrrwwwwrrrMo.....',
      '.....OnnrwwwwwwrrMo.....',
      '.....OnrrwwwwwwrrMo.....',
      '.....OnrrgwwwwwrMMo.....',
      '.....OrrrrgwwwrrMMo.....',
      '......OrrrrrrrrMMo......',
      '......OrrrrrrrMMMo......',
      '.......OrrrrrMMMo.......',
      '........OrrrrMMo........',
      '.........OrrMMo.........',
      '....SSSSSSOrMoSSSSSs....',
      '...SllllwwgOogwwkkkks...',
      '..SlllllwggooggwkkkkkS..',
      '..SllllwwwwggggwwwkkkS..',
      '.Swwwwwwwwwwwwwwwwwwwws.',
      '.Saaaaawwggggggwwllllls.',
      '.ssssssssssssssssssssss.',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.8, rx: 11, ry: 1.4, key: 'z' },
  ),
  legend: {
    O: 'maroon',
    o: 'plum',
    n: 'neon',
    r: 'red',
    M: 'maroon',
    w: 'paper',
    g: 'fog',
    S: 'stone',
    s: 'slate',
    l: 'leaf',
    k: 'sky',
    a: 'amber',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Chef: a cook with a tall white hat, a moustache, a white jacket with two rows
// of buttons and a red neckerchief.
// O lit outline, o shade outline, w white, g white shade, G deep shade,
// E skin lit outline, P skin shade outline, k skin, t skin shade, K eye,
// M moustache and hair, n scarf light, r scarf, R scarf shade, S button, z shadow.

const CHEF: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '......OOO.OOOO.OOo......',
      '.....OwwwOwwwwOwwgo.....',
      '....OwwwwwwwwwwwwgGo....',
      '....OwwwwwwwwwwwwgGo....',
      '.....OwwgwwwwgwwgGo.....',
      '.....OwwgwwwwgwwgGo.....',
      '.....OggggggggggGGo.....',
      '.....OwwwwwwwwwwgGo.....',
      '......EMkkkkkkkkMP......',
      '......EkkKkkkkKktP......',
      '......EkMkkkkkkMtP......',
      '......EkkMMMMMMktP......',
      '.......EkkkttkktP.......',
      '.....OOOnrrrrrrROOo.....',
      '...OOwwwwwnrrRwwwwgGo...',
      '..OwwwwwwwwrRwwwwwwgGo..',
      '..OwwwwwSwwwwwwSwwwgGo..',
      '..OwwwwwwwwgwwwwwwwgGo..',
      '..OwwwwwSwwgwwwSwwwgGo..',
      '..oooooooooooooooooooo..',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.8, rx: 10.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    G: 'concrete',
    E: 'ember',
    P: 'plum',
    k: 'skin',
    t: 'tan',
    K: 'ink',
    M: 'plum',
    n: 'neon',
    r: 'red',
    R: 'maroon',
    S: 'stone',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Award: a gold trophy cup with two handles on a dark base with a gold plate.
// E lit outline, P shade outline, h gold light, w glint, y gold, a gold shade,
// K base outline, t base top, s base, n base shade, z shadow.

const AWARD: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '......EEEEEEEEEEEP......',
      '..EEEEEhhhhhhhhyaPPPPP..',
      '.EyyyyEhwyyyyyyaaPyyyaP.',
      '.EyPPPEhwyyyyyyaaPPPPaP.',
      '.EyP..EhwyyyyyyaaP..PaP.',
      '.EyP..EhyyyyyyyaaP..PaP.',
      '.EyyP..EhyyyyyaaP..PaaP.',
      '..EyyyyEhyyyyaaaPaaaaP..',
      '...EEEEEEhyyyaaPPPPPP...',
      '.........EhyyaP.........',
      '..........EhaP..........',
      '..........EhaP..........',
      '........EhhyyaaP........',
      '......KttttttttttK......',
      '......KssssssssnnK......',
      '......KsshhhhyysnK......',
      '......KsshyyyyasnK......',
      '.....KssssssssssnnK.....',
      '.....KKKKKKKKKKKKKK.....',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 19.8, rx: 9.5, ry: 1.8, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    h: 'honey',
    w: 'paper',
    y: 'lamp',
    a: 'amber',
    K: 'ink',
    t: 'stone',
    s: 'slate',
    n: 'night',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Lucky: a four-leaf clover, four heart-shaped leaves and a short stem.
// O lit outline, o shade outline, l leaf, h leaf glint, m leaf shade and veins,
// z shadow.

const LUCKY: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '......OOOO....OOOO......',
      '.....Ollllo..Ollllo.....',
      '.....Ollllo..Ollllo.....',
      '...OOmllllo..OllllmOO...',
      '..Olllmlllo..Olllmlllo..',
      '..Ollllmllo..Ollmllllo..',
      '..Olllllmlo..Olmlllllo..',
      '..Ollllllmo..Omllllllo..',
      '...ooooooom..mooooooo...',
      '..........mmmm..........',
      '...OOOOOOOmlmmOOOOOOO...',
      '..OllllllmolmOmllllllo..',
      '..OlllllmlolmOlmlllllo..',
      '..OllllmllolmOllmllllo..',
      '..OlllmlllolmOlllmlllo..',
      '...oomllllolmOllllmoo...',
      '.....OllllolmOllllo.....',
      '.....OllllolmOllllo.....',
      '......oooo.lm.oooo......',
      '............lm..........',
      '.............llm........',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.8, rx: 9, ry: 1.4, key: 'z' },
  ),
  legend: {
    O: 'moss',
    o: 'ink',
    l: 'leaf',
    m: 'moss',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Speaker: a wooden loudspeaker cabinet seen from the front, a small tweeter
// over a big woofer and a bass port, sound waves going out to the right.
// O lit outline, P shade outline, a wood, e wood shade, n baffle, g ring light,
// c ring, S ring shade, s cone, w glint, K port, x wave light, t wave, z shadow.

const SPEAKER: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.OOOOOOOOOOOOOP.........',
      '.OaaaaaaaaaaaeP.........',
      '.OannnnnnnnnneP.........',
      '.OannnnccnnnneP.........',
      '.OannncwgSnnneP...xx....',
      '.OannncgSSnnneP....xx...',
      '.OannnnSSnnnneP.....xt..',
      '.OannnnnnnnnneP.xx...xt.',
      '.OannnggccnnneP..xt..xt.',
      '.OanngcsscSnneP..xt..xt.',
      '.OangssssssSneP..xt..xt.',
      '.OangssgcssSneP..xt..xt.',
      '.OancsscSssSneP.xt...xt.',
      '.OancssssssSneP.....xt..',
      '.OanncsssSSnneP....tt...',
      '.OannnSSSSnnneP...tt....',
      '.OannnnnnnnnneP.........',
      '.OannnKKKKnnneP.........',
      '.OaeeeeeeeeeeeP.........',
      '.PPPPPPPPPPPPPP.........',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 8, cy: 21, rx: 8, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'ember',
    P: 'plum',
    a: 'amber',
    e: 'ember',
    n: 'night',
    g: 'fog',
    c: 'concrete',
    S: 'stone',
    s: 'slate',
    w: 'paper',
    K: 'ink',
    x: 'cyan',
    t: 'teal',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Bowl: an empty white bowl with a red band and a red foot, seen a little
// from above so the empty inside shows.
// O lit outline, o shade outline, w porcelain, g porcelain shade and inside,
// G deep shade, r red band, R band shade, z shadow.

const BOWL: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '.......OOOOOOOOOO.......',
      '....OOOwwwwwwwwwwOOo....',
      '..OOwwwGGGGggggggwwwOo..',
      '.OwwGGGGGggwwwwwwwwgwwo.',
      '.OwGGGGGggwwwwwwwwwwgwo.',
      '.OwwgGGGggwwwwwwwgggwwo.',
      '.Owwwwwggggggggggwwwwwo.',
      '.OwwwwwwwwwwwwwwwwwwgGo.',
      '.OrrrrrrrrrrrrrrrrrrRRo.',
      '..OwwwwwwwwwwwwwwwwgGo..',
      '..OwwwwwwwwwwwwwwwggGo..',
      '...OwwwwwwwwwwwwwggGo...',
      '....OwwwwwwwwwwwggGo....',
      '.....OgwwwwwwwggGGo.....',
      '......oorrrrrrRRoo......',
      '........oooooooo........',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 19.8, rx: 9, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    G: 'concrete',
    r: 'red',
    R: 'maroon',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Decorate: three party balloons, pink, yellow and blue, their strings tied
// together at the bottom.
// O pink lit outline, o pink shade outline, n pink, N pink shade,
// A yellow lit outline, E yellow shade outline, h yellow light, y yellow, a shade,
// U blue lit outline, u blue shade outline, k blue, d blue shade, w glint,
// S string, z shadow.

const DECORATE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '...OOOOO........UUUUU...',
      '..OnnnnnO......UkkkkkU..',
      '.OnwnnnnNo....Ukwkkkkdu.',
      '.OnwnnnnNAAAAAUkwkkkkdu.',
      '.OnnnnnnAyyyyyAkkkkkkdu.',
      '.OnnnnnAyhyyyyaEkkkkkdu.',
      '..OnnnnAyhyyyyaEkkkkdu..',
      '...OnnNAyyyyyyaEUkkdu...',
      '....ONoAyyyyyyaE.Udu....',
      '.....o..AyyyyaE...u.....',
      '......S..AyyaE...S......',
      '......S...AaE....S......',
      '.......S...E....S.......',
      '.......S...S....S.......',
      '........S..S...S........',
      '........S..S...S........',
      '.........S.S..S.........',
      '..........SS.S..........',
      '...........SS...........',
      '...........S............',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 11.5, cy: 21.4, rx: 7, ry: 1.4, key: 'z' },
  ),
  legend: {
    O: 'neonDeep',
    o: 'maroon',
    n: 'neon',
    N: 'neonDeep',
    A: 'amber',
    E: 'ember',
    h: 'honey',
    y: 'lamp',
    a: 'amber',
    U: 'denim',
    u: 'indigo',
    k: 'sky',
    d: 'denim',
    w: 'paper',
    S: 'stone',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Microphone: a hand microphone lying at a slant, a round steel mesh head at
// the upper right, a silver collar and a black handle with a red switch.
// O lit outline, o shade outline, w glint, g mesh light, c mesh, S mesh shade,
// f collar light, q collar, K handle outline, t handle light, s handle,
// n handle shade, k handle shade outline, r switch, z shadow.

const MICROPHONE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '...............OOOOO....',
      '..............OwwgggO...',
      '.............Owwggggco..',
      '.............Owggcgcco..',
      '............OwggggcccSo.',
      '............OggcgccScSo.',
      '............OgggccccSSo.',
      '.............OgcgcScSo..',
      '............fOccccSSSo..',
      '...........KffoccSSSo...',
      '..........Kttfqooooo....',
      '.........Kttssqq........',
      '........Kttssnk.........',
      '.......Kttrsnk..........',
      '......Kttrsnk...........',
      '.....Kttssnk............',
      '....Kttssnk.............',
      '...Kttssnk..............',
      '...Ktsnk................',
      '....kkk.................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 10, cy: 21, rx: 9.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'concrete',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    c: 'concrete',
    S: 'stone',
    f: 'paper',
    q: 'fog',
    K: 'ink',
    t: 'stone',
    s: 'slate',
    n: 'night',
    k: 'ink',
    r: 'red',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Guitar: an acoustic guitar standing upright, a dark neck with frets, tuning
// pegs on the head, a round sound hole and a bridge on the golden body.
// E lit outline, P shade outline, e head and bridge, f pegs, p fretboard,
// g fret, w nut, h body light, y body, a body shade, D sound hole, z shadow.

const GUITAR: PixelSprite = {
  rows: withShadow(
    [
      '.........EEEEEE.........',
      '........fEeeeePf........',
      '.........EeeeeP.........',
      '........fEeeeePf........',
      '..........EwwP..........',
      '..........EppP..........',
      '..........EggP..........',
      '..........EppP..........',
      '..........EggP..........',
      '........EEEppPPP........',
      '.......EhhyppyyaP.......',
      '......EhhyyppyyyaP......',
      '......EhyyyDDyyyaP......',
      '.......EyyDDDDyaP.......',
      '.......EyyDDDDyaP.......',
      '......EhyyyDDyyyaP......',
      '.....EhyyyyyyyyyyaP.....',
      '....EhhyyyyyyyyyyyaP....',
      '....EhyyyeeeeeeyyyaP....',
      '....EyyyyyyyyyyyyaaP....',
      '.....PyyyyyyyyyaaaP.....',
      '......PPPPPPPPPPPP......',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.8, rx: 8.5, ry: 1.4, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    e: 'ember',
    f: 'fog',
    p: 'plum',
    g: 'fog',
    w: 'paper',
    h: 'honey',
    y: 'lamp',
    a: 'amber',
    D: 'night',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Winner: a gold medal with a white star, hanging on a red and white ribbon.
// O ribbon lit outline, o ribbon shade outline, r ribbon, w stripe and star,
// R ribbon shade, E medal lit outline, P medal shade outline, h gold light,
// y gold, a gold shade, z shadow.

const WINNER: PixelSprite = {
  rows: withShadow(
    [
      '...OrwwRo......OrwwRo...',
      '...OrwwRo......OrwwRo...',
      '....OrwwRo....OrwwRo....',
      '....OrwwRo....OrwwRo....',
      '.....OrwwRo..OrwwRo.....',
      '.....OrwwRo..OrwwRo.....',
      '......OrwwRoOrwwRo......',
      '......OrwEEEEEEwRo......',
      '.......oEhhhhhyPo.......',
      '.......EhhaaaayyP.......',
      '......EhhaawwaayyP......',
      '......EhaaawwaaayP......',
      '.....EhawwwwwwwwayP.....',
      '.....EhaawwwwwwaayP.....',
      '.....EyaaawwwwaaayP.....',
      '.....EyaawwwwwwaayP.....',
      '......EyawwaawwayP......',
      '......EyyaaaaaayyP......',
      '.......EyyaaaayyP.......',
      '........PyyyyyyP........',
      '.........PPPPPP.........',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.8, rx: 8, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'maroon',
    o: 'plum',
    r: 'red',
    w: 'paper',
    R: 'maroon',
    E: 'ember',
    P: 'plum',
    h: 'honey',
    y: 'lamp',
    a: 'amber',
    z: 'fog',
  },
};

export const COMPANY_EVENT_ITEMS: Readonly<Record<string, PixelSprite>> = {
  stage: STAGE,
  location: LOCATION,
  chef: CHEF,
  award: AWARD,
  lucky: LUCKY,
  speaker: SPEAKER,
  bowl: BOWL,
  decorate: DECORATE,
  microphone: MICROPHONE,
  guitar: GUITAR,
  winner: WINNER,
};
