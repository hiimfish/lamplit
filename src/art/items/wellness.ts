/** Item icons for the wellness (health and benefits) unit. */
import type { PixelSprite } from '../../game/sprites';
import { withShadow } from './draw';

// ---------------------------------------------------------------------------
// Virus: a green germ ball with pink-tipped spikes all round it.
// O lit outline, o shade outline, g body, m body shade and spots, h highlight,
// s spike stalk, n spike tip, N tip shade, P spike outline, z shadow.

const VIRUS: PixelSprite = {
  rows: withShadow(
    [
      '.......PPP....PPP.......',
      '......PnnnP..PnnnP......',
      '......PnnNP..PnnNP......',
      '......PnNNP..PnNNP......',
      '.......PssOOOOssP.......',
      '..PPP..OOggggggoO..PPP..',
      '.PnnnPOggggggggggoPnnnP.',
      '.PnnNsOghhgggggggosnnNP.',
      '.PnNNsgghhhggmggggsnNNP.',
      '..PPPOggghgggggmggoPPP..',
      '.....Ogggggggggggmo.....',
      '.....Oggggggggggmmo.....',
      '..PPPOgggmgggggmmmoPPP..',
      '.PnnnsggggggggmmmmsnnnP.',
      '.PnnNsoggggggmmmmosnnNP.',
      '.PnNNPOggggmmmmmmoPnNNP.',
      '..PPP..ooggmmmmoo..PPP..',
      '.......PssoooossP.......',
      '......PnnnP..PnnnP......',
      '......PnnNP..PnnNP......',
      '......PnNNP..PnNNP......',
      '.......PPP....PPP.......',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 22.2, rx: 8, ry: 1.4, key: 'z' },
  ),
  legend: {
    O: 'moss',
    o: 'night',
    g: 'leaf',
    m: 'moss',
    h: 'paper',
    s: 'moss',
    n: 'neon',
    N: 'neonDeep',
    P: 'plum',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Headache: a head with a bandage round the forehead, eyes squeezed shut, a
// wobbly frown and red pain marks flashing off the top right.
// O lit outline, o shade outline, k skin, t skin shade, a hair, w bandage, f bandage shade,
// r red (bandage spot and pain marks), i eyes and mouth, q cheek, z shadow.

const HEADACHE: PixelSprite = {
  rows: withShadow(
    [
      '.................rr.....',
      '.................r...rr.',
      '.................r..rr..',
      '.................r.rr...',
      '........OOOOOO....rr....',
      '......OOaaaaaaoO........',
      '.....Oaaaaaaaaaao.....rr',
      '.....Owwwwwwaaaao..rrrrr',
      '....Owwwrrwwwwwwwo......',
      '....Offfffffwwwwwo......',
      '....Okkkkkkkfffffo......',
      '...OOkkikkkkkkkitoO.....',
      '..Okkkkkikkkkkitttto....',
      '..Okkkkikkkkkkkittto....',
      '..Okkkkkkkkkkkktttto....',
      '...ookqkkkkkkkktqoo.....',
      '....Okkkkiikiiktto......',
      '.....okkikkikkito.......',
      '......okkkkkktto........',
      '.......okkkkkto.........',
      '........oooooo..........',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 11.5, cy: 21.6, rx: 7.5, ry: 1.4, key: 'z' },
  ),
  legend: {
    O: 'tan',
    o: 'ember',
    k: 'skin',
    t: 'tan',
    a: 'ember',
    w: 'paper',
    f: 'fog',
    r: 'red',
    i: 'ink',
    q: 'rosy',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Heart: the real organ, a lopsided red lump with a groove down its front, a red
// artery arching over the top and two blue veins going up on the left.
// O lit outline, o shade outline, r muscle, R muscle shade, h highlight, M groove,
// v artery, V artery shade, b vein, B vein shade, D vein lit outline, I vein shade outline, z shadow.

const HEART: PixelSprite = {
  rows: withShadow(
    [
      '..............OOOOO.....',
      '.....DDD.....Ovvvvvo....',
      '....DbBBI...OvvvvvvVo...',
      '....DbBBBI.OvvvvvvvVVo..',
      '....DbbBBIOvvvVoooVVVo..',
      '.....IbBBBOvvvVo.OVVVo..',
      '......IbBBOvvvVo.OVVVo..',
      '......DbBBOvvvVo.OVVVo..',
      '......DbbrrrrrroO.oVo...',
      '......OrrrrrrrMMro.o....',
      '.....OrhhrrrrrMrrro.....',
      '.....OhhhhrrrrMrrro.....',
      '....OrrhhrrrrMrrrrro....',
      '....OrrrrrrrrMrrrrRo....',
      '....OrrrrrrrMrrrrRRo....',
      '....OrrrrrrMMrrrRRo.....',
      '....OrrrrrrMrrrRRRo.....',
      '....OrrrrrMrrrRRRo......',
      '.....orrrrMrrRRoo.......',
      '.....OrrrRMRooo.........',
      '......orrRRo............',
      '.......oooo.............',
      '........................',
      '........................',
    ],
    { cx: 11.5, cy: 22.4, rx: 7, ry: 1.3, key: 'z' },
  ),
  legend: {
    O: 'maroon',
    o: 'plum',
    r: 'red',
    R: 'maroon',
    h: 'neon',
    M: 'maroon',
    v: 'neon',
    V: 'red',
    b: 'sky',
    B: 'denim',
    D: 'denim',
    I: 'indigo',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Blood: a big bright red drop with a small one beside it.
// O lit outline, o shade outline, r blood, R blood shade, h shine, z shadow.

const BLOOD: PixelSprite = {
  rows: withShadow(
    [
      '.........O..............',
      '........Oro.............',
      '........Oro.............',
      '........Oro.............',
      '.......Orrro............',
      '.......Orrro............',
      '......Orrrrro...........',
      '......Ohrrrro...........',
      '.....Orhrrrrro..........',
      '....Orrhrrrrrro.........',
      '...Orrhrrrrrrrro........',
      '..Orrhhrrrrrrrrro..O....',
      '..Orrhhrrrrrrrrro.Oro...',
      '..OrrrhrrrrrrrrRo.Oro...',
      '..OrrrrrrrrrrrRRo.Oro...',
      '..OrrhrrrrrrrRRRoOrrro..',
      '...orrrrrrrrRRRoOrhrrro.',
      '....orrrrrrRRRo.OrrrrRo.',
      '.....orrrrRRRo..OrrrRRo.',
      '......orrRRRo....orRRo..',
      '.......ooooo......ooo...',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12.5, cy: 21.5, rx: 8.5, ry: 1.4, key: 'z' },
  ),
  legend: {
    O: 'maroon',
    o: 'plum',
    r: 'red',
    R: 'maroon',
    h: 'rosy',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Physician: a doctor's stethoscope, metal ear tubes in a V, a teal tube looping
// down and round to a big silver chest piece.
// O lit outline, o shade outline, m metal, M metal shade, e ear tip, t tube, T tube shade,
// L tube shine, c chest piece rim, C rim shade, f chest piece face, w shine, z shadow.

const PHYSICIAN: PixelSprite = {
  rows: withShadow(
    [
      '....Oeo.........Oeo.....',
      '...Oeeeo.......Oeeeo....',
      '...Oeeemo.....Omeeeo....',
      '....oemmo.....Ommeo.....',
      '.....ommo.....OMMo......',
      '.....Ommo.....OMMo......',
      '.....OmmoO...OOMMo......',
      '......omMmo.OMMMo.......',
      '.......ommmOMMMo........',
      '........ommmMMo.........',
      '.........ommMo..OOO.....',
      '.........OLmto.Occco....',
      '.........OLto.Occccco...',
      '........OLttoOccfffcco..',
      '........OLttoccfwwffcCo.',
      '.......OLttoOccfwfffCCo.',
      '......OLtto.OccfffffCCo.',
      '......OLtto..occfffCCo..',
      '......OLttoOOOLccCCCo...',
      '.......otttttttTCCCo....',
      '.......OTTTTTTTTooo.....',
      '........oooTTooo........',
      '...........oo...........',
      '........................',
    ],
    { cx: 12.5, cy: 22, rx: 8.5, ry: 1.4, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    m: 'fog',
    M: 'concrete',
    e: 'ink',
    t: 'teal',
    T: 'moss',
    c: 'concrete',
    C: 'stone',
    f: 'fog',
    w: 'paper',
    L: 'cyan',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Dental: a clean white molar with two roots and a little sparkle.
// O lit outline, o shade outline, w tooth, g tooth shade, G deep shade, h shine,
// s sparkle, z shadow.

const DENTAL: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.....................s..',
      '......OOOOO..OOOO....s..',
      '.....OwwwwwoOwwggo.sswss',
      '....Owwhwwwwwwwgggo..s..',
      '...Owwhwwwwwwwwggggo.s..',
      '...Owwhwwwwwwwwggggo....',
      '...Owwhwwwwwwwwggggo....',
      '...Owwhwwwwwwwwggggo....',
      '...OwwwwwwwwwwwggGGo....',
      '...OwwwwwwwwwwwggGGo....',
      '...OwwwwwwwwwwwggGGo....',
      '...OwwwwwwwwwwwggGGo....',
      '...OwwwwwwwwwwwggGGo....',
      '...OwwwwwwwoowwggGGo....',
      '....owwwgggo.owggGo.....',
      '....Owwwggo..OwggGo.....',
      '....Owwwggo..OwggGo.....',
      '.....owwggo..Owggo......',
      '.....Owwggo...oggo......',
      '......owgo....Ogo.......',
      '.......oo......o........',
      '........................',
      '........................',
    ],
    { cx: 11.5, cy: 22.1, rx: 7.5, ry: 1.4, key: 'z' },
  ),
  legend: {
    O: 'concrete',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    G: 'concrete',
    h: 'paper',
    s: 'cyan',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Yoga: a woman meditating cross-legged on a purple mat, eyes closed, hands
// resting on her knees.
// O lit outline, o shade outline, k skin, t skin shade, a hair, i closed eyes, s top, S top shade,
// p trousers, P trousers shade, v mat, V mat top, M mat outline, z shadow.

const YOGA: PixelSprite = {
  rows: withShadow(
    [
      '..........Oaao..........',
      '..........Oaao..........',
      '.........Oaaaao.........',
      '........Oaaaaaao........',
      '........Okkkkkto........',
      '........Okikkito........',
      '.........okkkko.........',
      '..........okko..........',
      '........OOOkkoOO........',
      '.......Okksssskko.......',
      '......OkksssssSkko......',
      '.....OkkksssssSkkto.....',
      '....OkkkosssssSSktto....',
      '....OkkoOsssssSSotto....',
      '...OkkoppsssssSSpotto...',
      '..OkkkpppsssssSSppttto..',
      '..OpkpppppppppppppPtPo..',
      '...oppppppppppppppPPo...',
      '.MMMoPPPPPPPPPPPPPPoMMM.',
      'MVVVVVVVVVVVVVVVVVVVVVVM',
      'MvvvvvvvvvvvvvvvvvvvvvvM',
      '.MMMMMMMMMMMMMMMMMMMMMM.',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 22, rx: 11, ry: 1.2, key: 'z' },
  ),
  legend: {
    O: 'tan',
    o: 'plum',
    k: 'skin',
    t: 'tan',
    a: 'plum',
    i: 'ink',
    s: 'cyan',
    S: 'teal',
    p: 'denim',
    P: 'indigo',
    v: 'violet',
    V: 'mauve',
    M: 'plum',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Massage: a relaxed, smiling person with eyes closed while two hands from
// behind knead both shoulders, little kneading marks beside the head.
// O lit outline, o shade outline and finger edge, a hair, k skin, t skin shade,
// i eyes and smile, q cheek, s shirt, S shirt shade, h hands, H finger gaps,
// m kneading marks, z shadow.

const MASSAGE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.........OOOOOo.........',
      '.......OOaaaaaaoo.......',
      '......Oaaaaaaaaaao......',
      '......Oaaaaaaaaaao......',
      '......Oaakkkkkkaao......',
      '......Oakkkkkkkkto......',
      '......Okkikkkkikto......',
      '...m..Okikikkikito..m...',
      '..m.m.Okqkkkkkkqto.m.m..',
      '.......Okkikkiktto......',
      '..OOOOO.okkiikto.OOOOo..',
      '.Ohhhhho.Okkkto.OhhhhHo.',
      '.OhHhHhosskkktssohHhHho.',
      '.OhHhHhossskttssohHhHho.',
      '.OhHhHhossssssssohHhHho.',
      'OsooooossssssssssoooooSo',
      'OsssssssssssssssssSSSSSo',
      'OsssssssssssssssssSSSSSo',
      'OSSSSSSSSSSSSSSSSSSSSSSo',
      '.oooooooooooooooooooooo.',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.6, rx: 10.5, ry: 1.3, key: 'z' },
  ),
  legend: {
    O: 'tan',
    o: 'plum',
    a: 'ember',
    k: 'skin',
    t: 'tan',
    i: 'ink',
    q: 'rosy',
    s: 'sky',
    S: 'denim',
    h: 'skin',
    H: 'tan',
    m: 'amber',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Timer: a squat teal kitchen timer with a turning knob on top and a dial
// whose red wedge shows the time left; no hands and no hour ring like the clock.
// O lit outline, o shade outline and feet, b body, B body shade, L body shine, n knob, N knob shade,
// w dial, g dial shade, r time wedge, i ticks and pointer, z shadow.

const TIMER: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '..........OOOO..........',
      '.........OnnnNo.........',
      '........OnnnnNNo........',
      '.........onnnNo.........',
      '....OOOOOOnnnNoOOOOO....',
      '...ObbbbbbbbbbbbbbbBo...',
      '..ObLLLbbwwiwwbbbbbBBo..',
      '..ObLbbbwwwrrrwbbbbBBo..',
      '..ObLbbwwwwrrriwbbbBBo..',
      '..ObLbbwwwwrrirrbbbBBo..',
      '..ObbbwwwwwiirrrwbbBBo..',
      '..ObbbiwwwwiirrribbBBo..',
      '..ObbbbwwwwwwwrrbbbBBo..',
      '..ObbbbwwwwwwwwgbbbBBo..',
      '..ObbbbbwwwwwwgbbbbBBo..',
      '..ObbbbbbwwiwgbbbbbBBo..',
      '..OBBBBBBBBBBBBBBBBBBo..',
      '...oBBBBBBBBBBBBBBBBo...',
      '....oooooooooooooooo....',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 22.3, rx: 10, ry: 1.3, key: 'z' },
  ),
  legend: {
    O: 'teal',
    o: 'slate',
    b: 'cyan',
    B: 'teal',
    L: 'paper',
    n: 'fog',
    N: 'concrete',
    w: 'paper',
    g: 'fog',
    r: 'red',
    i: 'ink',
    z: 'fog',
  },
};

export const WELLNESS_ITEMS: Readonly<Record<string, PixelSprite>> = {
  virus: VIRUS,
  headache: HEADACHE,
  heart: HEART,
  blood: BLOOD,
  physician: PHYSICIAN,
  dental: DENTAL,
  yoga: YOGA,
  massage: MASSAGE,
  timer: TIMER,
};
