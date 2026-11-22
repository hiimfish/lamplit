/** Item icons for the airport unit. */
import type { PixelSprite } from '../../game/sprites';
import { withShadow } from './draw';

// ---------------------------------------------------------------------------
// Train: the front of a white electric train coming along its track, an orange
// band under the dark windscreen, a pantograph on the roof.
// O lit outline, o shade outline, w body, G body shade, g body underside,
// K windscreen frame, k glass, x glint, t glass shade, y band, A band shade,
// h headlights, S pantograph, s skirt, c coupler, R rails, e sleepers, p ballast,
// z shadow.

const TRAIN: PixelSprite = {
  rows: withShadow(
    [
      '......SSSSSSSSSSSS......',
      '.........S....S.........',
      '..........S..S..........',
      '.......OOOOOOOOOO.......',
      '.....OOwwwwwwwwwwoo.....',
      '....OwwwwwwwwwwwwwGo....',
      '....OwKKKKKKKKKKKKGo....',
      '....OwKkxxkkkkkkkKGo....',
      '....OwKkxkkkkkkkkKGo....',
      '....OwKkkkkkkkkttKGo....',
      '....OwKkkkkkkktttKGo....',
      '....OwKKKKKKKKKKKKGo....',
      '....OyyyyyyyyyyyyyAo....',
      '....OyyyyyyyyyyyyyAo....',
      '....OwwwwwwwwwwwwwGo....',
      '....OwhhhwwwwwwhhhGo....',
      '....OwhhhwwwwwwhhhGo....',
      '....OgggggggggggggGo....',
      '.....osssssssssssso.....',
      '......sssssccsssss......',
      '......ReeeeeeeeeeR......',
      '.....RppppppppppppR.....',
      '....ReeeeeeeeeeeeeeR....',
      '........................',
    ],
    { cx: 12, cy: 23, rx: 10, ry: 1.2, key: 'z' },
  ),
  legend: {
    O: 'concrete',
    o: 'slate',
    w: 'paper',
    G: 'fog',
    g: 'fog',
    K: 'night',
    k: 'denim',
    x: 'cyan',
    t: 'indigo',
    y: 'lamp',
    A: 'amber',
    h: 'honey',
    S: 'stone',
    s: 'slate',
    c: 'fog',
    R: 'stone',
    e: 'ember',
    p: 'concrete',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Suitcase: an upright teal hard-shell suitcase with ribs, a pull-out handle
// and two wheels.
// H handle outline, g handle light, c handle, O lit outline, o shade outline,
// k shell light, b shell, d rib groove, D shell shade, K wheel, n wheel hub,
// z shadow.

const SUITCASE: PixelSprite = {
  rows: withShadow(
    [
      '........HHHHHHHH........',
      '........HgggcccH........',
      '........HcHHHHcH........',
      '........HcH..HcH........',
      '.....OOOHcHOOHcHOOo.....',
      '....OkkkkkkkkkkkkkDo....',
      '....OkbbdkbbdkbbdbDo....',
      '....OkbbdkbbdkbbdbDo....',
      '....OkbbdkbbdkbbdbDo....',
      '....OkbbdkbbdkbbdbDo....',
      '....OkbbdkbbdkbbdbDo....',
      '....OkbbdkbbdkbbdbDo....',
      '....OkbbdkbbdkbbdbDo....',
      '....OkbbdkbbdkbbdbDo....',
      '....OkbbdkbbdkbbdbDo....',
      '....OkbbdkbbdkbbdbDo....',
      '....OkbbdkbbdkbbdbDo....',
      '....OkbbdkbbdkbbdbDo....',
      '....ODDDDDDDDDDDDDDo....',
      '.....oooooooooooooo.....',
      '......KKK......KKK......',
      '......KnK......KnK......',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.8, rx: 10, ry: 1.5, key: 'z' },
  ),
  legend: {
    H: 'slate',
    g: 'fog',
    c: 'concrete',
    O: 'indigo',
    o: 'deep',
    k: 'cyan',
    b: 'teal',
    d: 'indigo',
    D: 'denim',
    K: 'ink',
    n: 'stone',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Wallet: a brown leather wallet with a snap strap, two banknotes sticking out
// of the top.
// E lit outline, P shade outline, h leather light, a leather, e leather shade,
// s stitching, y snap, Y snap shade, O note outline, o note shade outline,
// l note, m note print, w note oval, K back note outline, M back note, z shadow.

const WALLET: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '........KKKKKKKKKKKK....',
      '.....OOOOOOOOOOOOMMK....',
      '.....OlllllllllloMMK....',
      '.....OlmmwwwwmmloMMK....',
      '..EEEEEEEEEEEEEEEEEEEE..',
      '.EhhhhhhhhhhhhhhhhhhhhP.',
      '.EasasasasasasasasasaeP.',
      '.EaaaaaaaaaaaaaaaaaaaeP.',
      '.EaaaaaaaaaaaaEEEEEEEEP.',
      '.EaaaaaaaaaaaEhhhhhhhhP.',
      '.EaaaaaaaaaaaEaayyaaaaP.',
      '.EaaaaaaaaaaaEaayYaaaeP.',
      '.EaaaaaaaaaaaEeeeeeeeeP.',
      '.EaaaaaaaaaaaaPPPPPPPPP.',
      '.EasasasasasasasasasaeP.',
      '.EeeeeeeeeeeeeeeeeeeeeP.',
      '..PPPPPPPPPPPPPPPPPPPP..',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.8, rx: 11.5, ry: 1.8, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    h: 'tan',
    a: 'amber',
    e: 'ember',
    s: 'honey',
    y: 'honey',
    Y: 'lamp',
    O: 'moss',
    o: 'ink',
    l: 'leaf',
    m: 'moss',
    w: 'paper',
    K: 'ink',
    M: 'moss',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Belt: a brown leather belt done up, a big steel buckle with its prong and
// the pointed end with its holes.
// O lit outline, o shade outline, t leather light, e leather, d leather shade,
// K holes, E buckle lit outline, P buckle shade outline, h steel light, y steel,
// a steel shade, z shadow.

const BELT: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '......EEEEEEEE..........',
      '.....EhhhhhhhhP.........',
      '.....EhyyyyyyaP.........',
      '.....EhyPPPPyaP.........',
      'OOOOOEhyPOOEyaPOOOOOOo..',
      'OttttEhyPttEyaPttttttto.',
      'OeeeeEhyPeeEyaPeeeeeeeeo',
      'OeeeeEhhhhhhhhPeeKeeKeeo',
      'OeeeeEhyPeeEyaPeeeeeeeeo',
      'OddddEhyPddEyaPdddddddo.',
      'oooooEhyPooEyaPooooooo..',
      '.....EhyEEEEyaP.........',
      '.....EhyyyyyyaP.........',
      '.....EaaaaaaaaP.........',
      '......PPPPPPPP..........',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 11.5, cy: 19.2, rx: 11.5, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'plum',
    o: 'ink',
    t: 'tan',
    e: 'ember',
    d: 'maroon',
    K: 'ink',
    E: 'stone',
    P: 'slate',
    h: 'paper',
    y: 'fog',
    a: 'concrete',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Storm: a dark storm cloud with a yellow lightning bolt and slanting rain.
// O lit outline, o shade outline, g cloud light, c cloud, s cloud shade,
// E bolt outline, y bolt, Y bolt shade, k rain, d rain shade, z shadow.

const STORM: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '..........OOOOO.........',
      '........OOgggccOO.......',
      '.....OOOOgcccccccOo.....',
      '....OggcccccccccccOOOo..',
      '...Ogccccccccccccccccso.',
      '..Ogcccccccccccccccccso.',
      '.Ogcccccccccccccccccsso.',
      '.Occcccccccccccccccssso.',
      '.Occsssssssssssssssssso.',
      '..osssssssEyyyyEssssso..',
      '...ooooooEyyyyEoooooo...',
      '........EyyyyE..........',
      '....kd.EyyyyEEEE..kd....',
      '...kd.EyyyyyyyYE.kd.....',
      '..kd..EEEEEyyYE.kd......',
      '..........EyYE..........',
      '.....kd..EyYE.......kd..',
      '....kd..EyYE.......kd...',
      '...kd...EyE.......kd....',
      '.......EyE....kd........',
      '.......EE....kd.........',
      '............kd..........',
      '........................',
    ],
    { cx: 12, cy: 23, rx: 8, ry: 1.2, key: 'z' },
  ),
  legend: {
    O: 'slate',
    o: 'night',
    g: 'concrete',
    c: 'stone',
    s: 'slate',
    E: 'amber',
    y: 'honey',
    Y: 'lamp',
    k: 'sky',
    d: 'denim',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Plane: a white airliner seen from the side, flying to the right, a blue tail
// fin and stripe, a row of windows, swept wings and an engine.
// O lit outline, o shade outline, w fuselage, g belly, b stripe and engine,
// d windows, k fin light, B fin, S wing outline, f wing, c wing shade,
// E engine outline, K engine intake, z shadow.

const PLANE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '..OOOO..................',
      '..OkBBO.................',
      '...OkBBO................',
      '...OkBBBO..SSS..........',
      '....OkBBBO.SccS.........',
      '....OkBBBBOOSccccSOO....',
      '.OOOOwwwwwwwwwwwwwwwOO..',
      '.OwwwwwdwdwdwdwdwwwddwO.',
      '.OwwwwwwwwwwwwwwwwwwwwwO',
      '..ObbbbbbbbbbbbbbbbbbbO.',
      '...ogggggSSSSSSSgggggo..',
      '....ooooSffffffSooooo...',
      '.......SffffEEEEEE......',
      '......SffffEbbbbbKo.....',
      '.....SffffcSooooooo.....',
      '....SfffccS.............',
      '....SfccS...............',
      '.....SSS................',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.8, rx: 9, ry: 1.3, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    b: 'denim',
    d: 'indigo',
    k: 'sky',
    B: 'denim',
    S: 'stone',
    f: 'fog',
    c: 'concrete',
    E: 'indigo',
    K: 'night',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Prohibit: the round "not allowed" sign, a red ring with a red bar across it.
// O lit outline, o shade outline, n ring light, r red, M ring shade, w plate,
// g plate shade, z shadow.

const PROHIBIT: PixelSprite = {
  rows: withShadow(
    [
      '..........OOOO..........',
      '.......OOOnnnnOOO.......',
      '......OnnnrrrrrrrO......',
      '.....OnnrrrrrrrrrrO.....',
      '....OnrrrrrrrrrrrrMo....',
      '...OnrrrrggggggrrrrMo...',
      '...OnrrrrrwwwwwwrrrMo...',
      '..OnrrrrrrrgwwwwwrrrMo..',
      '..OrrrgrrrrrgwwwwwrrMo..',
      '..OrrrgwrrrrrgwwwwrrMo..',
      '..OrrrgwwrrrrrgwwwrrMo..',
      '..OrrrgwwwrrrrrgwwrrMo..',
      '..OrrrgwwwwrrrrrgwrrMo..',
      '..OrrrrgwwwwrrrrrrrrMo..',
      '...OrrrrgwwwwrrrrrrMo...',
      '...OrrrrrwwwwwrrrrrMo...',
      '....OrrrrrrrrrrrrMMo....',
      '.....OrrrrrrrrrMMMo.....',
      '......orrrMMMMMMMo......',
      '.......oooMMMMooo.......',
      '..........oooo..........',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.6, rx: 9, ry: 1.5, key: 'z' },
  ),
  legend: {
    O: 'maroon',
    o: 'plum',
    n: 'neon',
    r: 'red',
    M: 'maroon',
    w: 'paper',
    g: 'fog',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Announcement: a white hand megaphone with a red bell and mouthpiece, sound
// coming out of it to the right.
// O lit outline, o shade outline, w horn, g horn shade, r red, R red shade,
// s grip, S grip shade, y sound, z shadow.

const ANNOUNCEMENT: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '..............OOOo......',
      '............OOrrRo...yy.',
      '..........OOwwrrRo..yy..',
      '........OOwwwwrrRo.yy...',
      '......OOwwwwwwrrRo......',
      '.OOOOOwwwwwwwwrrRo......',
      '.OrrOwwwwwwwwwrrRo......',
      '.OrrOwwwwwwwwwrrRo.yyyy.',
      '.OrROwwwwwwwwwrrRo.yyyy.',
      '.OrROggggggggwrrRo......',
      '.oRRogggggggggrrRo......',
      '.oooooggggggggrrRo......',
      '...OsSooggggggrrRo......',
      '...OsSo.ooggggrrRo.yy...',
      '...OsSo...ooggrrRo..yy..',
      '...OsSo.....oorrRo...yy.',
      '...OsSo.......oooo......',
      '...oooo.................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 10, cy: 19.6, rx: 9.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    r: 'red',
    R: 'maroon',
    s: 'concrete',
    S: 'stone',
    y: 'lamp',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Exit: a green emergency exit sign hanging from two mounts, a white figure
// running to the left towards a white doorway.
// S mounts, O lit outline, o shade outline, l sign, m sign shade, w figure and
// doorway, z shadow.

const EXIT: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.....SS..........SS.....',
      '.....SS..........SS.....',
      '.OOOOOOOOOOOOOOOOOOOOOo.',
      '.Olllllllllllllllllllmo.',
      '.Olwwwwwllllwwlllllllmo.',
      '.Olwwwwwllllwwlllllllmo.',
      '.Olwwwwwlllwwwwwlllllmo.',
      '.Olwwwwwllwwlwwwlwwllmo.',
      '.Olwwwwwllllllwwwllwlmo.',
      '.Olwwwwwllllllwwwllllmo.',
      '.Olwwwwwlllwwwwwwllllmo.',
      '.Olwwwwwlllwwlllwwlllmo.',
      '.Olwwwwwlllwwllllwwllmo.',
      '.Olwwwwwllwwwlllllwwlmo.',
      '.Olwwwwwlllllllllllwwmo.',
      '.Olwwwwwlllllllllllllmo.',
      '.Ommmmmmmmmmmmmmmmmmmmo.',
      '.oooooooooooooooooooooo.',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 19.8, rx: 11, ry: 1.6, key: 'z' },
  ),
  legend: {
    S: 'stone',
    O: 'moss',
    o: 'ink',
    l: 'leaf',
    m: 'moss',
    w: 'paper',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Pilot: an airline captain in a navy peaked cap with a gold badge, a white
// shirt with striped shoulder boards, a dark tie and gold wings on the chest.
// O cap lit outline, o cap shade outline, b cap light, B cap, h badge light,
// y gold, K visor and tie, S visor glint, n hair, s skin, t skin shade, k eyes,
// m mouth, C shirt lit outline, c shirt shade outline, w shirt, G shirt shade,
// E shoulder board, z shadow.

const PILOT: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........OOOOOOOO........',
      '......OObbbbbbbbOo......',
      '.....ObbbBBBBBBBBBo.....',
      '.....ObBBBBhhBBBBBo.....',
      '.....ObBBBhyyhBBBBo.....',
      '......OBBBBhhBBBBo......',
      '......Oyyyyyyyyyyo......',
      '.....KSSKKKKKKKKKKK.....',
      '......nttttttttttn......',
      '......nssksssskssn......',
      '......tsssssssssst......',
      '.......ssssmmssst.......',
      '........tsssssst........',
      '....CCCCwwttttwwCCCc....',
      '...CEyEywwwKKwwwyEyEc...',
      '..CwEyEywwwKKwwwyEyEGc..',
      '..CwwwwwwwwKKwwwwwwwGc..',
      '..CwwwwwwwwKKwwhyhwwGc..',
      '..CwwwwwwwwKKwwwwwwwGc..',
      '..CwwwwwwwwKKwwwwwwwGc..',
      '..cccccccccccccccccccc..',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 22.2, rx: 11, ry: 1.3, key: 'z' },
  ),
  legend: {
    O: 'denim',
    o: 'deep',
    b: 'denim',
    B: 'indigo',
    h: 'honey',
    y: 'lamp',
    K: 'ink',
    S: 'stone',
    n: 'night',
    s: 'skin',
    t: 'tan',
    k: 'ink',
    m: 'ember',
    C: 'concrete',
    c: 'slate',
    w: 'paper',
    G: 'fog',
    E: 'indigo',
    z: 'fog',
  },
};

/** Word pictures of the airport. */
export const AIRPORT_ITEMS: Readonly<Record<string, PixelSprite>> = {
  train: TRAIN,
  suitcase: SUITCASE,
  wallet: WALLET,
  belt: BELT,
  storm: STORM,
  plane: PLANE,
  prohibit: PROHIBIT,
  announcement: ANNOUNCEMENT,
  exit: EXIT,
  pilot: PILOT,
};
