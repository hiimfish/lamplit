/** Item icons for the warehouse unit. */
import type { PixelSprite } from '../../game/sprites';
import { withShadow } from './draw';

// ---------------------------------------------------------------------------
// Warehouse: a wide shed with a low blue gable roof and one big roll-up door,
// half open, cartons stacked inside.
// U roof lit outline, u roof shade outline, b roof, B roof shade, d eave,
// O lit outline, o shade outline, w wall, g wall shade, K door frame,
// S shutter slat, s slat shade, k shutter bar, n dark inside,
// h carton top, t carton, a carton shade, e carton gap, z shadow.

const WAREHOUSE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '...........UU...........',
      '........UUUbBuuu........',
      '.....UUUbbbbBBBBuuu.....',
      '..UUUbbbbbbbBBBBBBBuuu..',
      '.UbbbbbbbbbbBBBBBBBBBBu.',
      '.uddddddddddddddddddddu.',
      '..Owwwwwwwwwwwwwwwwggo..',
      '..OwwKKKKKKKKKKKKKKggo..',
      '..OwwKSSSSSSSSSSSSKggo..',
      '..OwwKssssssssssssKggo..',
      '..OwwKSSSSSSSSSSSSKggo..',
      '..OwwKkkkkkkkkkkkkKggo..',
      '..OwwKnhhhhhnnnnnnKggo..',
      '..OwwKnttttannnnnnKggo..',
      '..OwwKneeeeenhhhhnKggo..',
      '..OwwKnttttantttanKggo..',
      '..OwwKnttttantttanKggo..',
      '..oooooooooooooooooooo..',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.6, rx: 11.5, ry: 1.8, key: 'z' },
  ),
  legend: {
    U: 'sky',
    u: 'deep',
    b: 'denim',
    B: 'indigo',
    d: 'deep',
    O: 'stone',
    o: 'slate',
    w: 'fog',
    g: 'concrete',
    K: 'slate',
    S: 'paper',
    s: 'fog',
    k: 'stone',
    n: 'night',
    h: 'honey',
    t: 'tan',
    a: 'amber',
    e: 'ember',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Truck: a long container truck seen from the side, a red ribbed container on a
// trailer and a blue cab at the front.
// O container lit outline, o container shade outline, n container top, r container,
// M rib, B cab lit outline, b cab, D cab shade, x window glint, c window,
// y headlight, S chassis, K tyre, f hub, s tank, z shadow.

const TRUCK: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      'OOOOOOOOOOOOOOOOo.......',
      'OnnnnnnnnnnnnnnMo.......',
      'OrrMrrMrrMrrMrrMo.BBBBB.',
      'OrrMrrMrrMrrMrrMo.BbbbbD',
      'OrrMrrMrrMrrMrrMo.BbxccD',
      'OrrMrrMrrMrrMrrMo.BbcccD',
      'OrrMrrMrrMrrMrrMo.BbbbbD',
      'OrrMrrMrrMrrMrrMo.BbbbbD',
      'OrrMrrMrrMrrMrrMoSBbbbyD',
      'oooooooooooooooooSBDDDDD',
      '.SSKKKSSSKKKSSSSSSSKKKSS',
      '..KKKKK.KKKKK.sss.KKKKK.',
      '..KKfKK.KKfKK.....KKfKK.',
      '..KKKKK.KKKKK.....KKKKK.',
      '...KKK...KKK.......KKK..',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 19.6, rx: 11.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'maroon',
    o: 'plum',
    n: 'neon',
    r: 'red',
    M: 'maroon',
    B: 'sky',
    b: 'denim',
    D: 'indigo',
    x: 'paper',
    c: 'cyan',
    y: 'honey',
    S: 'stone',
    K: 'slate',
    f: 'fog',
    s: 'slate',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Shelf: an open warehouse rack, blue uprights and orange beams, cartons on
// three levels.
// B upright light, b upright, d upright shade, y beam, a beam shade and carton
// shade, h carton top, t carton, e carton base, w white carton, g its shade,
// G its base, z shadow.

const SHELF: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '..Bb................bd..',
      '..Bb.hhhhha.........bd..',
      '..Bb.ttttta.hhhhhhhabd..',
      '..Bb.ttttta.tttttttabd..',
      '..Bb.eeeeee.eeeeeeeebd..',
      '..Bbyyyyyyyyyyyyyyyybd..',
      '..Bbaaaaaaaaaaaaaaaabd..',
      '..Bb................bd..',
      '..Bbhhhhhhhha.wwwwg.bd..',
      '..Bbtttttttta.wwwwg.bd..',
      '..Bbtttttttta.wwwwg.bd..',
      '..Bbeeeeeeeee.GGGGG.bd..',
      '..Bbyyyyyyyyyyyyyyyybd..',
      '..Bbaaaaaaaaaaaaaaaabd..',
      '..Bb................bd..',
      '..Bb.hhha.hhhha.hhhabd..',
      '..Bb.ttta.tttta.tttabd..',
      '..Bb.ttta.tttta.tttabd..',
      '..Bb.eeee.eeeee.eeeebd..',
      '..Bbyyyyyyyyyyyyyyyybd..',
      '..Bbaaaaaaaaaaaaaaaabd..',
      '..Bb................bd..',
      '........................',
    ],
    { cx: 12, cy: 22.6, rx: 11, ry: 1.3, key: 'z' },
  ),
  legend: {
    B: 'sky',
    b: 'denim',
    d: 'indigo',
    y: 'lamp',
    a: 'amber',
    h: 'honey',
    t: 'tan',
    e: 'ember',
    w: 'paper',
    g: 'fog',
    G: 'concrete',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Measure: a yellow tape measure with a red lock button, its white blade pulled
// out to the right with tick marks and a metal hook at the end.
// E lit outline, P shade outline, h case light, y case, a case shade, K hub rim,
// s hub, g hub centre and blade shade, O blade lit outline, o blade shade outline,
// w blade, T tick, S end hook, R lock button, z shadow.

const MEASURE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '......RRR...............',
      '..EEEEEEEE..............',
      '.EhhhhhhhyP.............',
      'EhhyKKKKyyaP............',
      'EhyKssssKyaP............',
      'EhyKsggsKyaP............',
      'EhyKsggsKyaP............',
      'EhyKssssKyaPOOOOOOOOOOS.',
      'EhyyKKKKyyaPwTwTwTwTwwS.',
      'EhyyyyyyyyaPwTwwwTwwwwS.',
      'EhyyyyyyyyaPwwwwwwwwwwS.',
      'EyyyyyyyyaaPwwwwwwwwwgS.',
      'EyaaaaaaaaaPooooooooooS.',
      '.PaaaaaaaaP...........S.',
      '..PPPPPPPP..............',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 11.5, cy: 20.4, rx: 11, ry: 1.8, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    h: 'honey',
    y: 'lamp',
    a: 'amber',
    K: 'slate',
    s: 'stone',
    g: 'fog',
    O: 'stone',
    o: 'slate',
    w: 'paper',
    T: 'ink',
    S: 'slate',
    R: 'red',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Label: a white shipping sticker with address lines, a red mark and a big
// barcode, one corner peeling up.
// O lit outline, o shade outline, w sticker, g sticker shade, K print and bars,
// G small print, r red mark, F peeled corner, z shadow.

const LABEL: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '..OOOOOOOOOOOOOOOOOOOo..',
      '..Owwwwwwwwwwwwwwwwwgo..',
      '..OwKKKKKKKwwwwwrrrwgo..',
      '..Owwwwwwwwwwwwwrrrwgo..',
      '..OwGGGGGGGGGGwwrrrwgo..',
      '..Owwwwwwwwwwwwwwwwwgo..',
      '..OwGGGGGGGwwwwwwwwwgo..',
      '..Owwwwwwwwwwwwwwwwwgo..',
      '..OwGGGGGGGGGGGGGGGGgo..',
      '..Owwwwwwwwwwwwwwwwwgo..',
      '..OwKKwKwKKKwKwKKwKKgo..',
      '..OwKKwKwKKKwKwKKwKKgo..',
      '..OwKKwKwKKKwKwKKwKKgo..',
      '..OwKKwKwKKKwKwKKwKKgo..',
      '..OwKKwKwKKKwKwKKwKKgo..',
      '..OwKKwKwKKKwKwKKwKKgo..',
      '..OwwwwwwwwwwwwwwwFFFo..',
      '..OwwGGGwGGGGwGGwwFFo...',
      '..OgggggggggggggggFo....',
      '..ooooooooooooooooo.....',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.6, rx: 10.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    K: 'ink',
    G: 'concrete',
    r: 'red',
    F: 'concrete',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Fire: a flame with a second smaller tongue, red outside, orange and yellow
// inside, a white-hot core.
// M outline, r outer flame, a orange, y yellow, h core, w hottest point, z shadow.

const FIRE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '...........M............',
      '..........MrM...........',
      '..........MrrM..........',
      '.........MrrrM..........',
      '.........MrrrrM.........',
      '........MrrarrM....M....',
      '.......MrraarrrM..MrM...',
      '......MrraaarrrM.MrrM...',
      '.....MrraayarrrrMrrrM...',
      '.....MrraayyarrrrrrrM...',
      '....MrraayyyaarrrarrrM..',
      '....MrraayyyyaaraaarrM..',
      '...MrraayyhhyyaaaayarrM.',
      '...MrraayyhhhyyyaayyarM.',
      '...MrraayhhhhhyyyyyyarM.',
      '...MrraayyhhwhhhyyyaarM.',
      '....MrraayhhwwhhyyaarM..',
      '....MrraayyhhhhyyaarM...',
      '.....MrraayyyyyyaarM....',
      '......MMrraaaaaarrMM....',
      '........MMMMMMMMMM......',
      '........................',
      '........................',
    ],
    { cx: 12.5, cy: 21.8, rx: 8.5, ry: 1.4, key: 'z' },
  ),
  legend: {
    M: 'maroon',
    r: 'red',
    a: 'amber',
    y: 'lamp',
    h: 'honey',
    w: 'paper',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Ladder: a wooden ladder standing upright, two thick rails, five rungs and
// rubber feet.
// E lit outline, P shade outline, h rail light, a rail, y rung, e rung shade,
// K foot, z shadow.

const LADDER: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.....EEEE......EEEP.....',
      '.....EhaP......EhaP.....',
      '.....EhaPyyyyyyEhaP.....',
      '.....EhaPeeeeeeEhaP.....',
      '.....EhaP......EhaP.....',
      '.....EhaP......EhaP.....',
      '.....EhaPyyyyyyEhaP.....',
      '.....EhaPeeeeeeEhaP.....',
      '.....EhaP......EhaP.....',
      '.....EhaP......EhaP.....',
      '.....EhaPyyyyyyEhaP.....',
      '.....EhaPeeeeeeEhaP.....',
      '.....EhaP......EhaP.....',
      '.....EhaP......EhaP.....',
      '.....EhaPyyyyyyEhaP.....',
      '.....EhaPeeeeeeEhaP.....',
      '.....EhaP......EhaP.....',
      '.....EhaP......EhaP.....',
      '.....EhaPyyyyyyEhaP.....',
      '.....EhaPeeeeeeEhaP.....',
      '.....KKKK......KKKK.....',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.8, rx: 8.5, ry: 1.4, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    h: 'honey',
    a: 'amber',
    y: 'lamp',
    e: 'ember',
    K: 'slate',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Alarm: a red warning beacon flashing on a grey base, short rays of light
// around it.
// O lit outline, o shade outline, n dome light, w glint, r dome, M dome shade,
// h bulb glow, y bulb and rays, S base lit outline, s base shade outline,
// g base light, c base, d base shade, z shadow.

const ALARM: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '...........yy...........',
      '....y......yy......y....',
      '.....y............y.....',
      '......y..OOOOOo..y......',
      '.......OnnnrrrrMo.......',
      '......OnnrrrrrrrMo......',
      '......OnwrrrrrrrMo......',
      '.yyy..OnwrrhhrrrMo..yyy.',
      '......OnrrhyyhrrMo......',
      '......OnrrhyyhrrMo......',
      '......OnrrrhhrrrMo......',
      '......OrrrrrrrrMMo......',
      '......OrrrrrrrrMMo......',
      '......OrrrrrrrMMMo......',
      '....SSSSSSSSSSSSSSSs....',
      '....Sggggggggggggccs....',
      '....Sccccccccccccccs....',
      '....Sccccccccccccdds....',
      '....ssssssssssssssss....',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 19.8, rx: 10, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'neonDeep',
    o: 'maroon',
    n: 'neon',
    w: 'paper',
    r: 'red',
    M: 'maroon',
    h: 'honey',
    y: 'lamp',
    S: 'stone',
    s: 'slate',
    g: 'fog',
    c: 'concrete',
    d: 'stone',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Glove: one yellow leather work glove, fingers up, with a blue knitted cuff.
// E lit outline, P shade outline, h leather light, y leather, a leather shade,
// B cuff outline, k cuff light, b cuff, d cuff shade, D cuff shade outline,
// z shadow.

const GLOVE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '..........EEE...........',
      '......EEEEhyyEEEE.......',
      '.....EhyyEhyyEhyyP......',
      '.....EhyyEhyyEhyyEEEE...',
      '.....EhyyEhyyEhyyEhyaP..',
      '.....EhyyEhyyEhyyEhyaP..',
      '.....EhyyEhyyEhyyEhyaP..',
      '.....EhyyEhyyEhyyEhyaP..',
      '.EEE.EhyyEhyyEhyyEhyaP..',
      'EhyyEEhyyEhyyEhyyEhyaP..',
      'EhyyyEhyyyyyyyyyyyyyaP..',
      '.EhyyyEyyyyyyyyyyyyyaP..',
      '..EhyyyyyyyyyyyyyyyyaP..',
      '...EhyyyyyyyyyyyyyyyaP..',
      '....EhyyyyyyyyyyyyyaaP..',
      '.....EyyyyyyyyyyyyaaP...',
      '.....BBBBBBBBBBBBBBBD...',
      '.....BkkbbbbbbbbbbbdD...',
      '.....BkbbbbbbbbbbbddD...',
      '.....BkbbbbbbbbbbbddD...',
      '.....DDDDDDDDDDDDDDDD...',
      '........................',
      '........................',
    ],
    { cx: 12.5, cy: 21.8, rx: 9, ry: 1.4, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    h: 'honey',
    y: 'lamp',
    a: 'amber',
    B: 'indigo',
    k: 'sky',
    b: 'denim',
    d: 'indigo',
    D: 'deep',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Inspect: a magnifying glass with a green check mark in its lens.
// O ring lit outline, o ring shade outline, S ring, w glass, g glass shade,
// l check mark, E handle lit outline, P handle shade outline, h handle light,
// a handle, z shadow.

const INSPECT: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '......OOOOOO............',
      '....OOSSSSSSoo..........',
      '...OSSwwwwwwSSo.........',
      '..OSSwwwwwwwwSSo........',
      '..OSwwwwwwwllwSo........',
      '..OSwwwwwwllwwSo........',
      '..OSwllwwllwwwSo........',
      '..OSwwllllwwwwSo........',
      '..OSwwwllwwwwgSo........',
      '..OSwwwwwwwwggSo........',
      '..OSSwwwwwwggSSo........',
      '...OSSwwwwggSSo.........',
      '....ooSSSSSSoEEE........',
      '......oooooo.EhhaP......',
      '..............EhhaP.....',
      '...............EhhaP....',
      '................EhhaP...',
      '.................EhhaP..',
      '..................EhhaP.',
      '...................EhaaP',
      '....................PPPP',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.4, rx: 10, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'concrete',
    o: 'slate',
    S: 'stone',
    w: 'paper',
    g: 'fog',
    l: 'leaf',
    E: 'ember',
    P: 'plum',
    h: 'honey',
    a: 'amber',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Temperature: a glass thermometer standing upright, red liquid in the tube
// and the bulb, a scale of ticks beside it.
// O lit outline, o shade outline, w glass, g glass shade, n liquid light,
// r liquid, M liquid shade, c tick, z shadow.

const TEMPERATURE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '..........OOOo..........',
      '.........Owwwgo.........',
      '.........Owwwgo.ccc.....',
      '.........Owwwgo.........',
      '.........Owwwgo.cc......',
      '.........Owrrgo.........',
      '.........Ownrgo.ccc.....',
      '.........Ownrgo.........',
      '.........Ownrgo.cc......',
      '.........Ownrgo.........',
      '.........Ownrgo.ccc.....',
      '.........Ownrgo.........',
      '.........Ownrgo.cc......',
      '........OOnnrroo........',
      '.......OnnrrrrrMo.......',
      '......OnwnrrrrrrMo......',
      '......OnnrrrrrrrMo......',
      '......OnrrrrrrrMMo......',
      '......OrrrrrrrMMMo......',
      '.......orrrrrMMMo.......',
      '........oooooooo........',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.6, rx: 8, ry: 1.5, key: 'z' },
  ),
  legend: {
    O: 'concrete',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    n: 'neon',
    r: 'red',
    M: 'maroon',
    c: 'concrete',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Sea: a big sea wave curling over to the left, white foam along its crest
// and on the water in front of it.
// O lit outline, o shade outline, w foam, g foam shade, k wave face, b water,
// d water shade, z shadow.

const SEA: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '.......OOOOOO...........',
      '.....OOwwwwwwOOO........',
      '...OOwwwwwwwwwwwOO......',
      '..Owwwgkkkkkggwwwwo.....',
      '.OwwgOkkkkkkbbbggwwo....',
      '.OwgO.Okkkkkbbbbbgwwo...',
      '.OwO...Okkkkbbbbbbbgwo..',
      '.OwgO..Okkkbbbbbbbbbgwo.',
      '..OO...Okkkbbbbbbbbbbgo.',
      '.......Okkkbbbbbbbbbbbdo',
      '......Okkkkbbbbbbbbbbddo',
      '......Okkkbbbbbbbbbbbddo',
      '.....Okkkkbbbbbbbbbbdddo',
      '.OO.Okkkkkbbbbbbbbbddddo',
      'OwwOkkkkkbbbbbbbbbdddddo',
      'Okwwwwkkbbbbbbbbbddddddo',
      'Okkkkwwwwbbbbwwwbddddddo',
      'Obbbbbbbbwwwwbbbwwwddddo',
      'Obbbbbbbbbbbddddddddddo.',
      '.oooooooooooooooooooooo.',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.8, rx: 11.5, ry: 1.4, key: 'z' },
  ),
  legend: {
    O: 'denim',
    o: 'deep',
    w: 'paper',
    g: 'fog',
    k: 'sky',
    b: 'denim',
    d: 'indigo',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Port: a yellow dock crane on a quay lowering a container onto a container
// ship, water below.
// y crane, a crane shade, K trolley and cable, c container top, t teal container,
// T its ribs, n red container top, r red container and waterline, R its ribs,
// m mauve container, V its ribs, W ship bridge, G bridge shade, k water,
// b hull, i hull shade and bridge windows, g quay top, q quay, s quay shade,
// w foam, z shadow.

const PORT: PixelSprite = {
  rows: withShadow(
    [
      '...yy...................',
      '...ya...................',
      'yyyyyyyyyyyyyyyyyyyyyy..',
      'aaaaaaaaaaaaaaaaaaaaaa..',
      '.ya..ya.........KKK.....',
      '.ya..ya..........K......',
      '.ya..ya........ccccc....',
      '.ya..ya........tTtTt....',
      '.ya..ya........tTtTt....',
      '.yyyyya.WWG.............',
      '.ya..ya.WiG.nnn.........',
      '.ya..ya.WWG.rRr.........',
      '.ya..ya.WiG.mmmcccnnn...',
      '.ya..ya.WWG.mVmtTtrRr...',
      '.ya..ya.bbbbbbbbbbbbbbbb',
      '.ya..ya.bbbbbbbbbbbbbbb.',
      'ggggggggbbbbbbbbbbbbbbb.',
      'qqqqqqqqiiiiiiiiiiiiii..',
      'qqqqqqqqrrrrrrrrrrrrr...',
      'sssssssskkkkkkkkkkkkkkkk',
      'sssssssskkwwkkkkkwwkkkkk',
      '.kkwwkkkkkkkkwwkkkkkkkk.',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 22, rx: 11.5, ry: 1.2, key: 'z' },
  ),
  legend: {
    y: 'lamp',
    a: 'amber',
    K: 'slate',
    c: 'cyan',
    t: 'teal',
    T: 'moss',
    n: 'neon',
    r: 'red',
    R: 'maroon',
    m: 'mauve',
    V: 'violet',
    W: 'fog',
    G: 'concrete',
    k: 'sky',
    b: 'denim',
    i: 'indigo',
    g: 'fog',
    q: 'concrete',
    s: 'stone',
    w: 'paper',
    z: 'fog',
  },
};

export const WAREHOUSE_ITEMS: Readonly<Record<string, PixelSprite>> = {
  warehouse: WAREHOUSE,
  truck: TRUCK,
  shelf: SHELF,
  measure: MEASURE,
  label: LABEL,
  fire: FIRE,
  ladder: LADDER,
  alarm: ALARM,
  glove: GLOVE,
  inspect: INSPECT,
  temperature: TEMPERATURE,
  sea: SEA,
  port: PORT,
};
