/** Item icons for the factory visit (Brightway's lamp plant in Taoyuan). */
import type { PixelSprite } from '../../game/sprites';
import { withShadow } from './draw';

// ---------------------------------------------------------------------------
// Uniform: an orange work vest with two reflective bands and a name badge,
// worn over a blue work shirt.
// O lit outline, o shade outline, h vest light, L vest, a vest shade and seam,
// s band light, S band shade, b shirt light, B shirt, d shirt shade, w collar and badge,
// g collar shade, z shadow.

const UNIFORM: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '......OOOOOOOOOOOO......',
      '.....OhLLwwbBggLaaO.....',
      '....OhLLLbwbBgBLLaaO....',
      '...OhLLLLbbddBBLLLaao...',
      '...OhLLLLLbddBLLLLaao...',
      '...OhLLLLLbddBLLLLaaO...',
      '..OhLwwwLLLbBLLLLLLaao..',
      '..OhLBBBLLLbBLLLLLLaao..',
      '..OhLLLLLLLaLLLLLLLaaO..',
      '.OhLLLLLLLLaLLLLLLLLaao.',
      '.OhLLLLLLLLaLLLLLLLLaao.',
      '.OsssssssssSssssssssSSo.',
      '.OSSSSSSSSSSSSSSSSSSSSo.',
      '.OhLLLLLLLLaLLLLLLLLaao.',
      '.OhLLLLLLLLaLLLLLLLLaao.',
      '.OsssssssssSssssssssSSo.',
      '.OSSSSSSSSSSSSSSSSSSSSo.',
      '.OhLLLLLLLLaLLLLLLLLaao.',
      '.Oaaaaaaaaaaaaaaaaaaaao.',
      '..oooooooooooooooooooo..',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.2, rx: 11, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'ember',
    o: 'plum',
    h: 'honey',
    L: 'lamp',
    a: 'amber',
    s: 'paper',
    S: 'fog',
    b: 'sky',
    B: 'denim',
    d: 'indigo',
    w: 'paper',
    g: 'fog',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Extinguisher: a red fire extinguisher with a white label band, a grey
// valve and squeeze lever on top and a black hose down its left side.
// O lit outline, o shade outline, w highlight, h body light, r body, m body shade,
// p label, g label shade, G metal light, S metal, K metal shade, k hose, z shadow.

const EXTINGUISHER: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '............OOOOOOOO....',
      '........OOOOGGGGGGGGo...',
      '......OOkkGGKKSKKKKKo...',
      '.....OkkoOGGKKSooooo....',
      '....OSko..OKSSO.........',
      '....OSko.OrrrrrO........',
      '....OSkoOhrrrrrmO.......',
      '....OSkOhwrrrrrmmo......',
      '....OSkOhwrrrrrmmo......',
      '....OSkOhwrrrrrmmo......',
      '....OSkOhhrrrrrmmo......',
      '....OSkOpppppppggo......',
      '....OSkOpppppppggo......',
      '....OSkOpppppppggo......',
      '....OSkOpppppppggo......',
      '...OSkkOhhrrrrrmmo......',
      '...OSkkOhhrrrrrmmo......',
      '...OSkkOhhrrrrrmmo......',
      '....oooOhhrrrrrmmo......',
      '.......Ohhrrrrrmmo......',
      '........ooooooooo.......',
      '........................',
      '........................',
    ],
    { cx: 11.5, cy: 21.6, rx: 9, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'maroon',
    o: 'plum',
    w: 'paper',
    h: 'rosy',
    r: 'red',
    m: 'maroon',
    p: 'paper',
    g: 'fog',
    G: 'fog',
    S: 'concrete',
    K: 'stone',
    k: 'slate',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Footwear: a tall brown work boot, toe to the left, with a padded collar,
// laces down the front and a thick lugged grey sole.
// O lit outline, o shade outline, x collar and welt, Y leather light, a leather,
// e leather shade, w laces, S sole, K sole shade and lugs, z shadow.

const FOOTWEAR: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '.............OOOOOOO....',
      '............Oxxxxxxxo...',
      '............Oxxxxxxxo...',
      '............OYaaaaeeo...',
      '............OYwwaaeeo...',
      '...........OOYaaaaeeo...',
      '.........OOYawwaaaeeo...',
      '.......OOYaaaaaaaaeeo...',
      '.....OOYaawwaaaaaaeeo...',
      '....OYaaaaaaaaaaaaeeo...',
      '...OYaewwaaaaaaaaaeeO...',
      '..OYaaaeaaaaaaaaaaaeeo..',
      '..OYaaaeaaaaaaaaaaaeeo..',
      '..OYaaaeaaaaaaaaaaaeeO..',
      '.OxxxxxxxxxxxxxxxxxxxxO.',
      'OSSSSSSSSSSSSSSSSSSSSSSo',
      'OSSKSSKSSKSSKSSKSSKSSKSo',
      'OKKOKKOKKOKKOKKOKKOKKOKo',
      '.oo.oo.oo.oo.oo.oo.oo.o.',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.5, rx: 11.5, ry: 1.5, key: 'z' },
  ),
  legend: {
    O: 'ember',
    o: 'plum',
    x: 'tan',
    Y: 'lamp',
    a: 'amber',
    e: 'ember',
    w: 'honey',
    S: 'concrete',
    K: 'stone',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Hard hat: a yellow safety helmet seen from the front, a raised ridge down
// its middle and a short brim all round.
// O lit outline, o shade outline, w highlight, Y helmet light, y helmet,
// a helmet shade, e brim underside, z shadow.

const HARD_HAT: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '...........OO...........',
      '.........OOYyOO.........',
      '........OYaYyayO........',
      '......OOYYaYyayyOO......',
      '.....OYwYYaYyayyyao.....',
      '.....OwYYYaYyayyyaO.....',
      '....OYwYYYaYyayyyaaO....',
      '...OYYYYYYaYyayyyaaao...',
      '...OYYYYYYaYyayyyaaao...',
      '...OYYYYYYaYyayyyaaao...',
      '...OYYYYYYaYyayyyaaao...',
      '.OOOyyyyyyyyyaaaaaaaOOO.',
      'OYYYYYYYYYYYyyyyyyaaaaao',
      'Oyyyyyyyyyyyyyyyyaaaaaao',
      '.oOeeeeeeeeeeeeeeeeeeoo.',
      '...oooooooooooooooooo...',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 18.2, rx: 11, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'ember',
    o: 'plum',
    w: 'paper',
    Y: 'honey',
    y: 'lamp',
    a: 'amber',
    e: 'ember',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Lab: a glass flask of bubbling blue-green liquid next to a test tube of
// pink liquid.
// O lit outline, o shade outline, w glass, g glass shade, C liquid light and
// bubbles, t liquid, d liquid shade, n tube liquid, N tube liquid shade, z shadow.

const LAB: PixelSprite = {
  rows: withShadow(
    [
      '.........OOCo...........',
      '........OCoo............',
      '........OOOOO...........',
      '.......Owwwwwo..........',
      '........Owwgo......OOOOO',
      '........Owwgo.....Owwwww',
      '........Owwgo......Owwgo',
      '........Owwgo......Owwgo',
      '........OwwgO......Owwgo',
      '.......OwwwggO.....Owwgo',
      '......OwwwwwggO....Owwgo',
      '.....OCCCCCCCCCo...Owwgo',
      '.....OCttwttttdO...OnnNo',
      '....OCttttCttttdo..OnnNo',
      '....OCtttttttCtdO..OnnNo',
      '...OCtttCtttttttdo.OnnNo',
      '...OCttttttCttttdO.OnnNo',
      '..OCttttttttttCttdoOnnNo',
      '..Odddddddddddddddo.ONo.',
      '...ooooooooooooooo...o..',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.4, rx: 11, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    C: 'cyan',
    t: 'teal',
    d: 'moss',
    n: 'neon',
    N: 'neonDeep',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Cloth: a bolt of red check fabric, the roll on top and a length of the
// cloth hanging down in a soft fold.
// O lit outline, o shade outline, w r R check light, f m M check shade,
// x card tube, k tube hole, z shadow.

const CLOTH: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '..OOOOOOOOOOOOOOOOOOOO..',
      '.OMRMRrrrRRRrrrRRRrrmMo.',
      'OMrxxMrrrRRRrrrRRRrrmMo.',
      'ORkkkRrrrRRRrrrRRRrrmMo.',
      'ORkkkRrrrRRRrrrRRRrrmMo.',
      'OMxxxMmmmMMMmmmMMMmmmMo.',
      '.OMRMMmmmMMMmmmMMMmmmMo.',
      '..oORRrrrRRMmrrRRRmmoo..',
      '...ORRrrrRRMmrrRRRmmo...',
      '...Orrwwwrrmfwwrrrffo...',
      '...Orrwwwrrmfwwrrrffo...',
      '...Orrwwwrrmfwwrrrffo...',
      '...ORRrrrRRMmrrRRRmmo...',
      '...ORRrrrRRMmrrRRRmmo...',
      '...ORRrrrRRMmrrRRRmmo...',
      '...Orrwwwrrmfwwrrrffo...',
      '...Ormffwrrmffwrrmffo...',
      '...OmooOfmmooOfmmooo....',
      '....o...ooo...ooo.......',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.4, rx: 10.5, ry: 1.5, key: 'z' },
  ),
  legend: {
    O: 'maroon',
    o: 'plum',
    w: 'paper',
    r: 'rosy',
    R: 'red',
    f: 'fog',
    m: 'mauve',
    M: 'maroon',
    x: 'tan',
    k: 'ember',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Wood: a cut log lying on its side, the pale ringed end facing us, brown
// bark and a twig stub with one leaf.
// O lit outline, o shade outline, w highlight, Y wood light, y wood, a bark light
// and heart, e bark, P bark shade, L leaf, l leaf shade, z shadow.

const WOOD: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '..................O.....',
      '.................OLo....',
      '...............OOLLo....',
      '..............Oaelo.....',
      '.....OOOOOOOOOOaeOOO....',
      '...OOeeeeaaaaaaaaaaaO...',
      '..Oeeyyyyeeaaaaaaaaaao..',
      '..OeyYYYYyeeeeeaePeeeO..',
      '.OeyYwyyYYyeaeePeeeeeeo.',
      '.OeywyYYyYyeePeeeeeeeeo.',
      'OeyYyYYYYyYyeeeeeeeaeeo.',
      'OeyYyYaaYyYaeeeeaeeePeo.',
      'OeyYyYYYYyyaeaeeeePeeeo.',
      '.OeyYyYYyyaeeeeePeeeeeo.',
      '.OeyYYyyyyaeeePeeeeeeeo.',
      '..OeyYYyyaePPPPPPPPPPo..',
      '..OeeyaaaeePPPPPPPPPPo..',
      '...oOeeeePPPPPPPPPPPo...',
      '.....ooooooooooooooo....',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 19.8, rx: 11, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'ember',
    o: 'plum',
    w: 'paper',
    Y: 'honey',
    y: 'lamp',
    a: 'amber',
    e: 'ember',
    P: 'plum',
    L: 'leaf',
    l: 'moss',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Metal: a steel bolt with a hex head and a threaded shank, and a hex nut
// lying beside it.
// O lit outline, o shade outline, w steel highlight, g steel light, G steel,
// S steel shade, k nut hole, z shadow.

const METAL: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '....OOOOOOOO............',
      '...OggggggggO...........',
      '..OwwwgggggggO..........',
      '.Owwggggggggggo.........',
      '.OgwgGGGGGSSSSo.........',
      '.OgggGGGGGSSSSo.........',
      '.OgggGGGGGSSSSo.........',
      '..oooOwggGoooo..........',
      '.....OgGGSo.............',
      '.....OwggGo.............',
      '.....OgGGSo....OOOOOO...',
      '.....OwggGo...OggggggO..',
      '.....OgGGSo..OwwgkkgggO.',
      '.....OwggGo.OgggkkSSgggo',
      '.....OgGGSo.OgggSSGGgggo',
      '.....OwggGo..OggggggggO.',
      '.....OgGGSo.OgwgGGGGGSSo',
      '.....OwggGo.OgggGGGGGSSo',
      '.....OgGGSo.OgggGGGGGSSo',
      '.....OwggGo..oooooooooo.',
      '......OGGo..............',
      '.......oo...............',
      '........................',
    ],
    { cx: 12, cy: 21.8, rx: 11, ry: 1.4, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    G: 'concrete',
    S: 'stone',
    k: 'slate',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Cargo: a cargo ship stacked high with coloured shipping containers, its
// white bridge at the stern, riding on small waves.
// O lit outline, o shade outline, B hull, d hull shade, r waterline, m keel,
// w bridge, g bridge shade, c windows, t window shade, k funnel top;
// containers R r m red,
// c t T teal, h L a orange, b B d blue; s wave light, S wave.

const CARGO: PixelSprite = {
  rows: [
    '........................',
    '........................',
    '........................',
    '..OO....................',
    '.Okko......OOOOOOOO.....',
    '.Ormo.....ObbbdcccTo....',
    'OOrmOOO...OBdBdtTtTo....',
    'wwwwwggOOOOBdBdtTtTo....',
    'wcccctgcccTRRRmhhhao....',
    'OcccctOtTtTrmrmLaLao....',
    'OwwwwgOtTtTrmrmLaLao....',
    'OwwwwgORRRmhhhabbbdo....',
    'OcccctOrmrmLaLaBdBdoOOO.',
    'OwwwwgOrmrmLaLaBdBdOBBBo',
    'OwwwwgOOOOOOOOOOOOOBBBBo',
    'OBBBBBBBBBBBBBBBBBBBBBBo',
    'OBBBBBBBBBBBBBBBBBBBdddo',
    '.Orrrrrrrrrrrrrrrrrrrro.',
    '..Ommmmmmmmmmmmmmmmmmo..',
    'ssssSSssssSSssssSSssssSS',
    '..SssSSSSssSSSSssSSSSs..',
    '........................',
    '........................',
    '........................',
  ],
  legend: {
    O: 'slate',
    o: 'ink',
    B: 'denim',
    d: 'indigo',
    r: 'red',
    m: 'maroon',
    w: 'paper',
    g: 'fog',
    c: 'cyan',
    t: 'teal',
    R: 'rosy',
    T: 'moss',
    h: 'honey',
    L: 'lamp',
    a: 'amber',
    b: 'sky',
    s: 'sky',
    S: 'denim',
    k: 'stone',
  },
};

/** Word pictures of the plant in Taoyuan. */
export const FACTORY_ITEMS: Readonly<Record<string, PixelSprite>> = {
  uniform: UNIFORM,
  extinguisher: EXTINGUISHER,
  footwear: FOOTWEAR,
  hard_hat: HARD_HAT,
  lab: LAB,
  cloth: CLOTH,
  wood: WOOD,
  metal: METAL,
  cargo: CARGO,
};
