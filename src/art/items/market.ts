/** Item icons for the supermarket and market unit. */
import type { PixelSprite } from '../../game/sprites';
import { withShadow } from './draw';

// ---------------------------------------------------------------------------
// Fruit: a green pear, a bunch of purple grapes and a strawberry together.
// A pear lit outline, B pear shade outline, h pear light, l pear and leaves,
// L pear shade and leaf shade, e stem, E stem shade,
// V grape lit outline, N grape shade outline, u grape light, v grape, d grape shade,
// O berry lit outline, o berry shade outline, n berry light, r berry, m berry shade,
// s seed, z shadow.

const FRUIT: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '......e.................',
      '.....eE..........e......',
      '....AAAA........eE......',
      '...AhllLB.....VVVEVV....',
      '...AhllLB....VuvvuvvN...',
      '...AhlllB....VvvdvvdN...',
      '..AhhlllLB...VvddvddVV..',
      '..AhllllLB..VuvvuvvuvvN.',
      '.AhhlllllLB.VvvdvvdvvdN.',
      '.AhllllllLBlLvddvddvddN.',
      '.AhlllllLlllLluvvuvvNN..',
      '.AhlllOOLlLlLOovdvvdN...',
      '.AllllOnrrsrrmoddvddN...',
      '.AllllOnsrrrsmoNuvvN....',
      '..BllLOrrrsrrmoVvvdN....',
      '...BBBBOrsrrmo.NvddN....',
      '.......Orrrsmo..NNN.....',
      '........Ormmo...........',
      '.........ooo............',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.4, rx: 10.5, ry: 2, key: 'z' },
  ),
  legend: {
    A: 'moss',
    B: 'ink',
    h: 'honey',
    l: 'leaf',
    L: 'moss',
    e: 'ember',
    E: 'plum',
    V: 'indigo',
    N: 'night',
    u: 'mauve',
    v: 'violet',
    d: 'dusk',
    O: 'maroon',
    o: 'plum',
    n: 'neon',
    r: 'red',
    m: 'maroon',
    s: 'honey',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Apple: one red apple with the dip at the top, a brown stem and a green leaf.
// O lit outline, o shade outline, w glint, n skin light, r skin, m skin shade,
// s stem, S stem shade, l leaf, L leaf outline, z shadow.

const APPLE: PixelSprite = {
  rows: withShadow(
    [
      '...............LLL......',
      '.............LLlllL.....',
      '............sLllllL.....',
      '...........sSLLLLL......',
      '......OOOO.sS.OOOO......',
      '.....OnnnnOsSOrrrro.....',
      '....OnnnnnrSSrrrrrmo....',
      '...Onnwwnrrmmrrrrrrmo...',
      '...Onwwnnrrrrrrrrrrmo...',
      '...Onnnnrrrrrrrrrrmmo...',
      '...Onnnrrrrrrrrrrrmmo...',
      '...Onnrrrrrrrrrrrrmmo...',
      '...Onnrrrrrrrrrrrmmmo...',
      '...Onrrrrrrrrrrrrmmmo...',
      '...Onrrrrrrrrrrrmmmmo...',
      '....Orrrrrrrrrrmmmmo....',
      '....Orrrrrrrrrmmmmmo....',
      '.....Orrrrrrrmmmmmo.....',
      '......orrrrmmmmmmo......',
      '.......oommmmmmoo.......',
      '.........oooooo.........',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.6, rx: 9.5, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'maroon',
    o: 'plum',
    w: 'paper',
    n: 'neon',
    r: 'red',
    m: 'maroon',
    s: 'ember',
    S: 'plum',
    l: 'leaf',
    L: 'moss',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Orange: a whole orange with a dimpled skin and a navel, and a cut half in front
// showing the white pith and the segments.
// E lit outline, P shade outline, w glint and pith, h skin light and segment lines,
// y skin and flesh, a dimples and skin shade, e navel and deep dimples, z shadow.

const ORANGE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '.....EEEEEE.............',
      '...EEyyyyyyEE...........',
      '..EyhhhyyyeyyE..........',
      '.EyhhwhyyayyyyE.........',
      '.EyhhhyyyyyyayP.........',
      '.EyhyyayyyyyyyEEEEE.....',
      '.EyyayyyyyyyEEwwwwwEE...',
      '.EyyyyyyayyEwwyyhyywwP..',
      '.EyyyayyyyaEwyyyhyyywP..',
      '.EyayyyayaEwyhyyhyyhywP.',
      '.EyyyyayaaEwyyhyhyhyywP.',
      '..EyyyaaeaEwhhhhwhhhhwP.',
      '...PPaeaaaEwyyhyhyhyywP.',
      '.....PPPPPEwyhyyhyyhywP.',
      '...........PwyyyhyyywP..',
      '...........PwwyyhyywwP..',
      '............PPwwwwwPP...',
      '..............PPPPP.....',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.2, rx: 11, ry: 2, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    w: 'paper',
    h: 'honey',
    y: 'lamp',
    a: 'amber',
    e: 'ember',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Banana: a hand of two yellow bananas joined at the stem, brown at the tips.
// E lit outline, P shade outline, w peel glint, h peel, y peel shade and ridge,
// a stem shade, e stem and tips, z shadow.

const BANANA: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '...................EE...',
      '..................EeeP..',
      '..................EeaP..',
      '................EEEhyP..',
      '.............EEEwwEhhyP.',
      '...........EEwwhhyEhhyP.',
      '.........EEwwhhhyEwhhyP.',
      '.......EEwwhhhhyEwhhhyP.',
      '......EwwhhhhhyEwhhhhyP.',
      '.....EwhhhhhhyEwwhhhhyP.',
      '....EwhhhhhyyEwwhhyhyP..',
      '...EwhhhhyyyEwwhhyhhyP..',
      '..EehhhyyyEEwwhhyhhyyP..',
      '..EeyyyEEEwwhhyyhhhyP...',
      '...PPPEwwhhyyhhhhyyP....',
      '....EEwhhhhhhhhhyyP.....',
      '...EehhhhhhhhhyyyP......',
      '...EehhhhhhyyyyPP.......',
      '....PPyyyyyyPPP.........',
      '......PPPPPP............',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 11.5, cy: 20.6, rx: 10, ry: 2, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    w: 'paper',
    h: 'honey',
    y: 'lamp',
    a: 'amber',
    e: 'ember',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Vegetable: a head of broccoli, a purple eggplant and a carrot lying in front.
// A green lit outline, B green shade outline, h stalk light, l green, L green shade,
// V eggplant lit outline, N eggplant shade outline, u glint, v skin light, p skin,
// n skin shade, E carrot lit outline, P carrot shade outline, y carrot, a carrot shade,
// z shadow.

const VEGETABLE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '....AAAA..........lL....',
      '..AAllllAAA......lL.....',
      '.AlhllLlllhA....lllL....',
      'AlhllLAlhllLB..lLlLLl...',
      'AlllLLlllLLLB..VvLppN...',
      'AlLllhlLlhlLB..VuvppN...',
      '.BLlllLLlllLB.VvuvpppN..',
      '.ALlLLBBLlLLB.Vvuvpppn..',
      '..BBLLLLLLBB..VvvppppN..',
      '....BllLLB....VvvppppN..',
      '....AlllLB....VvpplLpn..',
      '....AlllLBEEEEEEElLlnN..',
      '....AllEEEhhhyyyyEllL...',
      '....BEEhhyyyayyyayELl...',
      '....EhyyyayyyyayyyaP....',
      '.....PPaaayyaaaaaaP.....',
      '.......PPPPaaaaPPP......',
      '...........PPPP.........',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20, rx: 10.5, ry: 2, key: 'z' },
  ),
  legend: {
    A: 'moss',
    B: 'ink',
    h: 'honey',
    l: 'leaf',
    L: 'moss',
    V: 'violet',
    N: 'ink',
    u: 'mauve',
    v: 'violet',
    p: 'plum',
    n: 'night',
    E: 'ember',
    P: 'plum',
    y: 'lamp',
    a: 'amber',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Tomato: a wide, flat red tomato with a green star-shaped calyx and a short stem.
// O lit outline, o shade outline, w glint, n skin light, r skin, m skin shade,
// l calyx, L calyx shade, z shadow.

const TOMATO: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '...........lL...........',
      '...........lL...........',
      '.......OOOOlLOOOO.......',
      '.....OOnnnlllLrrrOO.....',
      '....OnnnlllllLLLrrrO....',
      '...OnllLnlLrrlLrlLLrO...',
      '..OnlLwwlLrrrrlLrrlLro..',
      '..OnnwnnLrrrrrrLrrrrro..',
      '..Onnnrrrrrrrrrrrrrmmo..',
      '..Onnrrrrrrrrrrrrrmmmo..',
      '..Onrrrrrrrrrrrrrrmmmo..',
      '..Orrrrrrrrrrrrrrmmmmo..',
      '...Orrrrrrrrrrrmmmmmo...',
      '....Orrrrrrrmmmmmmmo....',
      '.....oormmmmmmmmmoo.....',
      '.......oooooooooo.......',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 19.6, rx: 10.5, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'maroon',
    o: 'plum',
    w: 'paper',
    n: 'neon',
    r: 'red',
    m: 'maroon',
    l: 'leaf',
    L: 'moss',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Potato: a lumpy brown potato with eyes, and a cut half in front showing the
// pale flesh.
// E lit outline, P shade outline and eyes, k skin light, t skin, e skin shade,
// w flesh light, h flesh, z shadow.

const POTATO: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '.....EEEEEE.............',
      '...EEkkkkkkEEE..........',
      '..EkkkkkttttttEEE.......',
      '.EkkkttPtttttttttE......',
      '.EkkttttttttPttttteP....',
      'EkkttttttttttttttteP....',
      'EktttPttttttttEEEEEE....',
      'EkttttttttttEEwwwwwwEE..',
      'EttttttttttEtwwwwwwwhtP.',
      'EtttttttPttEtwwwwwwhhtP.',
      '.PtttttttttEtwwwwwhhhtP.',
      '.PtttteeettEtwwwhhhhhtP.',
      '..PPeeeeeeeEthhhhhhhhtP.',
      '....PPPPPPPPPtthhhhttP..',
      '.............PPttttPP...',
      '...............PPPP.....',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 19.4, rx: 11, ry: 2, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    k: 'skin',
    t: 'tan',
    e: 'ember',
    w: 'paper',
    h: 'honey',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Oil: a clear jug of golden cooking oil with a grip hole, a red cap and a white
// label with an oil drop on it.
// O lit outline, P shade outline, w glint and label, g label shade, h oil light,
// y oil, a oil shade, R cap lit outline, n cap light, r cap, m cap shade, z shadow.

const OIL: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.........RRRR...........',
      '........RnrrmP..........',
      '........RnrrmP..........',
      '.........OhyP...........',
      '........OhhyyOOOOO......',
      '.......OhhyyyyyyyyaP....',
      '......OhhyyyyyPPPyyaP...',
      '......OhwyyyyP...OaP....',
      '......OhwyyyyP...OaP....',
      '......OhwyyyyP...OaP....',
      '......OhyyyyyyOOOyyaP...',
      '......OwwwwwwwwwwwwgP...',
      '......OwwwwwywwwwwwgP...',
      '......OwwwwwywwwwwwgP...',
      '......OwwwwyyywwwwwgP...',
      '......OwwwwyyawwwwwgP...',
      '......OwwwwwawwwwwwgP...',
      '......OwwwwwwwwwwwwgP...',
      '......OhyyyyyyyyyyaaP...',
      '......PPPPPPPPPPPPPP....',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 13, cy: 20.6, rx: 9.5, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'ember',
    P: 'plum',
    w: 'paper',
    g: 'fog',
    h: 'honey',
    y: 'lamp',
    a: 'amber',
    R: 'maroon',
    n: 'neon',
    r: 'red',
    m: 'maroon',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Meat: a raw red steak lying flat, white fat round the edge, pink marbling and
// a round bone.
// O lit outline, o shade outline, w fat and bone, p marbling and marrow,
// P fat in shade, r meat, m meat shade and side, z shadow.

const MEAT: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........OOOOOOOO........',
      '.....OOOwwwwwwwwOOO.....',
      '...OOwwwwrrrrrrwwwwOO...',
      '..OwwwrrrrrrrprrrrwwwO..',
      '.OwwrrrrrrrrprrrrrrrwwO.',
      '.OwrrwwrrrrprrrrrprrrwO.',
      '.OwrwppwrrprrrrrprrrrwO.',
      '.Owrwppwrprrrrrprrrrrwo.',
      '.OwrrwwrrrrrrrprrrrrmPo.',
      '..OwrrrrrrrrrprrrrrmmPo.',
      '..OwwrrrrrrrrrrrrmmPPo..',
      '..omPPPrrrrrrrrmPPPPmo..',
      '...ommmPPPPPPPPPmmmo....',
      '....oommmmmmmmmmmoo.....',
      '......ooooooooooo.......',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 17.6, rx: 11, ry: 2, key: 'z' },
  ),
  legend: {
    O: 'maroon',
    o: 'plum',
    w: 'paper',
    p: 'rosy',
    P: 'rosy',
    r: 'red',
    m: 'maroon',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Salt: a glass salt shaker with a steel cap full of holes, and a little heap of
// spilled salt beside it.
// O lit outline, o shade outline, w salt and steel light, g salt shade and steel,
// c steel shade, G steel dark, s holes, x glass glint, k glass, K glass shade, z shadow.

const SALT: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '......OOOOOOO...........',
      '.....Owgsgsgco..........',
      '.....Owsgsgsco..........',
      '....OwwggggccGo.........',
      '....OwgggggccGo.........',
      '....OGGGGGGGGGo.........',
      '.....OkkkkkkKo..........',
      '....OkxkkkkkkKo.........',
      '....OkxkkkkkkKo.........',
      '....OkwwwwwwwKo.........',
      '....OkwwwwgwwKo.........',
      '....OkwgwwwwgKo.........',
      '....OkwwwwwwgKo.........',
      '....OkwwwgwwgKo.........',
      '....OkwwwwwggKo.........',
      '....OkwgwwwggKo.........',
      '....OkwwwwgggKo...OO....',
      '....OkwwwggggKo.OOwwOo..',
      '....OkgggggggKoOwwwwggo.',
      '.....ooooooooo.oooooooo.',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 11, cy: 20.8, rx: 10, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    c: 'concrete',
    G: 'concrete',
    s: 'slate',
    x: 'paper',
    k: 'sky',
    K: 'denim',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Rice: a teal bowl with a foot, heaped high with steamed white rice.
// O rice lit outline, o rice shade outline, w rice, g grain shade, G rice shade,
// B bowl lit outline, b bowl shade outline, c rim glint, t glaze, d glaze shade,
// z shadow.

const RICE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '.........OOOOOO.........',
      '.......OOwwwwwwOO.......',
      '......OwwwwgwwwwwO......',
      '.....OwwgwwwwwwgwwO.....',
      '....OwwwwwwgwwwwwwgO....',
      '...OwwgwwwwwwwwgwwwGo...',
      '..OwwwwwwgwwwwwwwgwGGo..',
      '..OwgwwwwwwwgwwwwwwGGo..',
      '.BBBBBBBBBBBBBBBBBBBBBb.',
      '.Bccccccccccccccccttddb.',
      '.Btctttttttttttttttdddb.',
      '..Btctttttttttttttdddb..',
      '..Btcttttttttttttddddb..',
      '...Btttttttttttttdddb...',
      '....Btttttttttttdddb....',
      '.....bbttttttttddbb.....',
      '........Bttttddb........',
      '........bbbbbbbb........',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 19.8, rx: 9, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'concrete',
    o: 'stone',
    w: 'paper',
    g: 'fog',
    G: 'fog',
    B: 'indigo',
    b: 'deep',
    c: 'cyan',
    t: 'teal',
    d: 'indigo',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Fish: a whole fresh fish facing left, blue back and silver belly, teal fins
// and a forked tail.
// O lit outline, o shade outline, d back, k side, g belly shade, w belly and eye,
// K pupil, D mouth, c fin light, t fin, z shadow.

const FISH: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '..........OOOO..........',
      '........OOctttO.........',
      '.......OctcttttO........',
      '.....OOOctcttttOO....Oo.',
      '...OOddddddddddddO..Oto.',
      '..OdddddddddddddddOOcto.',
      '.OdkKwkkdkkkkkkkdddctto.',
      '.Okkwwkkdkkdkkdkkkkcto..',
      'ODkkkkkkdkcttkkkkkkto...',
      '.Ogggggkdkkttkkkkkkcto..',
      '..Owwwwggggggggkkkdctto.',
      '...oowwwwwgggggooo.Octo.',
      '.....ooowwggoooo....oto.',
      '........octoo........oo.',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 11.5, cy: 18.6, rx: 10.5, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'denim',
    o: 'deep',
    d: 'denim',
    k: 'sky',
    g: 'fog',
    w: 'paper',
    K: 'ink',
    D: 'indigo',
    c: 'cyan',
    t: 'teal',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Chicken: a golden roast drumstick, the white bone sticking up at the upper right.
// E lit outline, P shade outline, w glint and bone, h skin light, y skin, a skin shade,
// e skin dark, S bone lit outline, s bone shade outline, g bone shade, z shadow.

const CHICKEN: PixelSprite = {
  rows: withShadow(
    [
      '..................SS....',
      '.................SwwS...',
      '.................SwwS...',
      '.................SwwwSS.',
      '.................SwwwwwS',
      '................SwwwgggS',
      '...............SwwgSsss.',
      '......EEEEEEE.SwwgS.....',
      '....EEhhhhyyyewwgs......',
      '...EhhwhyyyyyaeeeP......',
      '..EhhwhyyyyyyyyaaaP.....',
      '.EhhhyyyyyyyyyyyaaP.....',
      '.EhhyyyyyyyyayyyaaaP....',
      'EhhyyyyyayyyyyyyaaaP....',
      'EhyyyyyyyyyyyyyaaaaP....',
      'EhyyyyyyyyyyyyaaaaeP....',
      'EyyyyyyyyyyyaaaaaeeP....',
      '.EyyyyyyyyaaaaaaeeP.....',
      '..PyyyyaaaaaaaeeeP......',
      '...PPaaaaaaeeeePP.......',
      '.....PPPPPPPPPP.........',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 10, cy: 20.6, rx: 10, ry: 1.8, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    w: 'paper',
    h: 'honey',
    y: 'lamp',
    a: 'amber',
    e: 'ember',
    S: 'stone',
    s: 'slate',
    g: 'fog',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Price: a yellow price tag with a "$" on it, a red string looped through the hole.
// E lit outline, P shade outline, h card, y card shade, K the "$", e hole rim,
// M string in the hole, r string, z shadow.

const PRICE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '....rr..................',
      '...r..r.................',
      '..r...r.................',
      '..r...r..EEEEEEEEEEEEEP.',
      '..r...r.EhhhhhhhhhhhhhP.',
      '...r...rhhhhhhhKhhhhhyP.',
      '....r.ErhhhhhhKKKKhhhyP.',
      '.....rhhrhhhhKhKhhhhhyP.',
      '....EhrerhhhhKhKhhhhhyP.',
      '...EhheMMehhhhKKKhhhhyP.',
      '....PhheehhhhhhKhKhhhyP.',
      '.....PhhhhhhhhhKhKhhyyP.',
      '......PhhhhhhKKKKhhyyyP.',
      '.......PhhhhhhhKhhyyyyP.',
      '........PyyyyyyyyyyyyyP.',
      '.........PPPPPPPPPPPPPP.',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 13, cy: 17.6, rx: 10, ry: 1.8, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    h: 'honey',
    y: 'lamp',
    K: 'ink',
    e: 'ember',
    M: 'maroon',
    r: 'red',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Cheese: a wedge of yellow cheese, tip to the left, round holes in the cut face.
// E lit outline, P shade outline, h top, y cut face, a rind and hole light,
// e hole dark, z shadow.

const CHEESE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '....................EEE.',
      '..............EEEEEEhaP.',
      '.......EEEEEEEhhhhhhaaP.',
      '.EEEEEEhhhhhaayhhhhaaaP.',
      '.EyyyyyhhhhhhhhhhhaaaaP.',
      '.EyeeyyyyyyyyyhhhaaaaaP.',
      '.EyeayyyyyeeyyyyyaaaaaP.',
      '.EyyyyyyyeeaayyyyaaaaP..',
      '.EyyyyeeyyaayyyeeaaaP...',
      '.EyyyyeayyyyyyyeaaaP....',
      '.PPPPPPyyyyyyyyyyaP.....',
      '.......PPPPPPPyyyP......',
      '..............PPP.......',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 11, cy: 19.4, rx: 10.5, ry: 2, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    h: 'honey',
    y: 'lamp',
    a: 'amber',
    e: 'ember',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Butter: a pale block of butter on a white dish, one slice cut off and lying
// beside it.
// A butter lit outline, E butter shade outline, w butter top, h butter front,
// y butter side, O dish lit rim, o dish shade rim, p dish, g dish shade, z shadow.

const BUTTER: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '.......AAAAAAAAAAAA.....',
      '......AwwwwwwwwwwyE.....',
      '.....AwwwwwwwwwwyyE.....',
      '....AwwwwwwwwwwyyyE.....',
      '...AhhhhhhhhhhhyyyE.....',
      '...AhhhhhhhhhhhyyyE.....',
      '...AhhhhhhhhhhhyyyE.....',
      '...AhhhhhhhhhhhyyE......',
      '..OAhhhhhhhhhhhyEOOOO...',
      'OOpAhhhhhhhhhhhEpAAAAAOO',
      'OppEEEEEEEEEEEEgAwwwwEpo',
      'OppgggggggggggggAhhhhEgo',
      '.opppppppppppppgEEEEEEo.',
      '..ooggggggggggggggggoo..',
      '....oooooooooooooooo....',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.8, rx: 10.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    A: 'amber',
    E: 'ember',
    w: 'paper',
    h: 'honey',
    y: 'lamp',
    O: 'concrete',
    o: 'slate',
    p: 'paper',
    g: 'fog',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Pizza: a whole pizza seen from above, pepperoni and basil on melted cheese,
// one slice pulled away to the lower right.
// E lit outline, P shade outline, y crust light, a crust, h cheese, r pepperoni,
// m pepperoni shade, l basil, L basil shade, z shadow.

const PIZZA: PixelSprite = {
  rows: withShadow(
    [
      '..........EE............',
      '.......EEEyyEEE.........',
      '.....EEyyhhhhaaEE.......',
      '....EyyrrhhhhhhaaE......',
      '...EyarrrmhhlLhhaaE.....',
      '...EahrrmmhhhrrhhaP.....',
      '..EyhhhmmhhhrrrmhhaE....',
      '..EahyyhhhhhrrmmhhaP....',
      '..EahhhhlLhhhmmhhhaP....',
      '.EahhrrhhhhPPhhhhhhaE...',
      '.EahrrrmhhP..EPPPhhaP...',
      '..EarrmmhhP......EPP....',
      '..EahmmhhhhP............',
      '..EahhhhrrhP..E.........',
      '...EahhrrrmP..EEEEE.....',
      '...EaahrrmmP..EhhhhEEEE.',
      '....EaahmmhhP.EhrrrhhaP.',
      '.....EPaahhhP..ErrmhaP..',
      '.......EPPaaP..EhmhaaP..',
      '..........EP...EhhaaP...',
      '...............EaaPP....',
      '................EP......',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.6, rx: 11, ry: 2.2, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    y: 'lamp',
    a: 'amber',
    h: 'honey',
    r: 'red',
    m: 'maroon',
    l: 'leaf',
    L: 'moss',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Juice: a glass of orange juice with a green straw and a slice of orange on the rim.
// O lit outline, o shade outline, w glass and pith, g glass shade, h juice top and
// segment lines, y juice and flesh, a juice shade and peel, e peel shade,
// l straw, L straw shade, z shadow.

const JUICE: PixelSprite = {
  rows: withShadow(
    [
      '.....lL.................',
      '.....lL.........aaa.....',
      '......lL......aawwwaa...',
      '......lL......awyhywa...',
      '.......lL....awyyhyywa..',
      '.......lL....awhhhhhwa..',
      '....OOOOlLOOOawyyhyywe..',
      '....OwwwlLwwwgawyhywe...',
      '....OhhhhlLhhhaawwwee...',
      '....OwyyylLyyyyaeee.....',
      '....OwyyyylLyyyao.......',
      '.....OwyyylLyyao........',
      '.....OwyyyylLyao........',
      '.....OwyyyylLyao........',
      '.....OwyyyyyLyao........',
      '......Owyyyyyao.........',
      '......Owyyyyyao.........',
      '......Oyyyyyaao.........',
      '......Oyyyyaaao.........',
      '......Ogggggggo.........',
      '.......ooooooo..........',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 11, cy: 20.6, rx: 8.5, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'concrete',
    o: 'stone',
    w: 'paper',
    g: 'fog',
    h: 'honey',
    y: 'lamp',
    a: 'amber',
    e: 'ember',
    l: 'leaf',
    L: 'moss',
    z: 'fog',
  },
};

export const MARKET_ITEMS: Readonly<Record<string, PixelSprite>> = {
  fruit: FRUIT,
  apple: APPLE,
  orange: ORANGE,
  banana: BANANA,
  vegetable: VEGETABLE,
  tomato: TOMATO,
  potato: POTATO,
  oil: OIL,
  meat: MEAT,
  salt: SALT,
  rice: RICE,
  fish: FISH,
  chicken: CHICKEN,
  price: PRICE,
  cheese: CHEESE,
  butter: BUTTER,
  pizza: PIZZA,
  juice: JUICE,
};
