/** Word pictures of the London branch. */
import type { PixelSprite } from '../../game/sprites';
import { withShadow } from './draw';

// ---------------------------------------------------------------------------
// Briefcase: a flat brown leather business case seen from the front, a handle
// on top and two gold clasps on the lid seam.
// T lit outline, P shade outline, w glint, a lid light, e leather, m leather
// shade, s seam, h clasp, y clasp shade, z shadow.

const BRIEFCASE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '.........TTTTTP.........',
      '........TaaaaaeP........',
      '........Ta....eP........',
      '..TTTTTTTTTTTTTTTTTTTP..',
      '..TwwaaaaaaaaaaaaaaeeP..',
      '..TeehheeeeeeeeeehhmmP..',
      '..TsshysssssssssshysmP..',
      '..TeeyyeeeeeeeeeeyymmP..',
      '..TaeeeeeeeeeeeeeeemmP..',
      '..TaeeeeeeeeeeeeeeemmP..',
      '..TaeeeeeeeeeeeeeeemmP..',
      '..TaeeeeeeeeeeeeeeemmP..',
      '..TaeeeeeeeeeeeeeeemmP..',
      '..TeeeeeeeeeeeeeeeemmP..',
      '..TeeeeeeeeeeeeeemmmmP..',
      '..PPPPPPPPPPPPPPPPPPPP..',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.6, rx: 11, ry: 1.8, key: 'z' },
  ),
  legend: {
    T: 'tan',
    P: 'plum',
    w: 'honey',
    a: 'amber',
    e: 'ember',
    m: 'maroon',
    s: 'plum',
    h: 'honey',
    y: 'lamp',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Restroom: the white toilet sign, a blue man and a red woman in a dress with
// a grey line between them.
// O lit outline, o shade outline, w plate, g plate shade, s divider,
// b man light, B man, d man shade, p woman light, r woman, R woman shade, z shadow.

const RESTROOM: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '...OOOOOOOOOOOOOOOOOo...',
      '..OwwwwwwwwwwwwwwwwwgO..',
      '..OwwwbBBwwswwwprrwwgo..',
      '..OwwwBBdwwswwwrrRwwgo..',
      '..OwwwBBdwwswwwrrRwwgo..',
      '..Owwwwwwwwswwwwwwwwgo..',
      '..OwwbBBBdwswwwrrRwwgo..',
      '..OwwbBBBdwswwrrrrRwgo..',
      '..OwwbBBBdwswwrrrrRwgo..',
      '..OwwbBBBdwswwrrrrRwgo..',
      '..OwwbBBBdwswrrrrrRRgo..',
      '..OwwbBwBdwswrrrrrRRgo..',
      '..OwwbBwBdwswrrrrrRRgo..',
      '..OwwbBwBdwswwrrwrRwgo..',
      '..OwwbBwBdwswwrrwrRwgo..',
      '..OwwbBwBdwswwrrwrRwgo..',
      '..OwwbBwBdwswwrrwrRwgo..',
      '..Oggggggggggggggggggo..',
      '...oooooooooooooooooo...',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.2, rx: 10.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'concrete',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    s: 'concrete',
    b: 'sky',
    B: 'denim',
    d: 'indigo',
    p: 'neon',
    r: 'red',
    R: 'maroon',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Subway: the front of a red metro train coming out of a dark stone tunnel
// mouth, two headlights on and a white stripe under the windscreen.
// A arch light, S arch stone, s arch shade, k tunnel dark, n train light,
// r train, R train shade, t windscreen, c glint, y headlight, w stripe,
// g stripe shade, G bumper, K bumper shade, o ground, z shadow.

const SUBWAY: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.......AAAAAAAASS.......',
      '.....ASSSSSSSSSSSSs.....',
      '....ASSSkkkkkkkkSSSs....',
      '...ASSkkkkkkkkkkkkSSs...',
      '..ASSkkkkkkkkkkkkkkSSs..',
      '..ASSkkknrrrrrrRkkkSSs..',
      '.ASSkkknrrrrrrrrRkkkSSs.',
      '.ASSkknrrrrrrrrrRRkkSSs.',
      '.ASSkkrrctttttttRRkkSSs.',
      '.ASSkkrrtctttttttRkkSSs.',
      '.ASSkkrrttttttttRRkkSSs.',
      '.ASSkkrrttttttttRRkkSSs.',
      '.ASSkkrrrrrrrrrrRRkkSSs.',
      '.ASSkkryyrrrrrryyRkkSSs.',
      '.ASSkkrrrrrrrrrrRRkkSSs.',
      '.ASSkkwwwwwwwwwwggkkSSs.',
      '.ASSkkrrrrrrrrrrRRkkSSs.',
      '.ASSkkGGGGGGGGGGKKkkSSs.',
      '.ASSkkkkGGkkkkGGkkkkSSs.',
      '.oooooooooooooooooooooo.',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.2, rx: 11.5, ry: 1.5, key: 'z' },
  ),
  legend: {
    A: 'concrete',
    S: 'stone',
    s: 'slate',
    k: 'ink',
    n: 'neon',
    r: 'red',
    R: 'maroon',
    t: 'indigo',
    c: 'sky',
    y: 'honey',
    w: 'paper',
    g: 'fog',
    G: 'concrete',
    K: 'stone',
    o: 'slate',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Construction: a red and white striped road barrier in front, a yellow tower
// crane behind it with a hook on its cable and a warning lamp on the barrier.
// Y crane light, y crane, a crane shade, G steel, g steel shade, S cable,
// c cab window, O barrier light, o barrier shade, r stripe, R stripe shade,
// w stripe white, h white shade, z shadow.

const CONSTRUCTION: PixelSprite = {
  rows: withShadow(
    [
      '.....Y..................',
      '....YYa.................',
      '....Y.a.................',
      '.YYYYYYYYYYYYYYYYYYYYY..',
      '.yyyYyaa.a.a.a.a.a.a.a..',
      '.aaaaaaaaaaaaaaaaaaaaa..',
      '.GGgY.aycc.....S........',
      '.GGgYaayaa.....S........',
      '....Y.a........S........',
      '....Yaa.......GGg.......',
      '....Y.a........G..Yy....',
      '....Yaa.......gG..ya....',
      '.OOOOOOOOOOOOOOOOOOOOOo.',
      '.OrrrwwwrrrwwwrrrwwwrRo.',
      '.OrrwwwrrrwwwrrrwwwrrRo.',
      '.ORhhhRRRhhhRRRhhhRRRho.',
      '.oooooooooooooooooooooo.',
      '....Oo............Oo....',
      '....Oo............Oo....',
      '..OOOOoo........OOOOoo..',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.2, rx: 11, ry: 1.6, key: 'z' },
  ),
  legend: {
    Y: 'honey',
    y: 'lamp',
    a: 'amber',
    G: 'concrete',
    g: 'stone',
    S: 'stone',
    c: 'cyan',
    O: 'concrete',
    o: 'slate',
    r: 'red',
    R: 'maroon',
    w: 'paper',
    h: 'fog',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Courier: a rider in a blue helmet and red jacket on a teal scooter going to
// the right, a cardboard parcel box strapped on the rack behind him.
// H helmet, h helmet shade, v visor, s skin, r jacket, R jacket shade,
// p trousers, P shoes, Y box top, a box, e box shade, w box label, n rack and
// tyres, T scooter, c scooter light, U scooter shade, L headlight, G hub, z shadow.

const COURIER: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '..........HHh...........',
      '.........HHHHh..........',
      '.........HHHvv..........',
      '.........Hhss...........',
      '.YYYYYe.rrrrR...........',
      '.aaaaae.rrrrrrRs........',
      '.aaaaae.rrrrR..TT.......',
      '.aawaae.rrrrR..TTL......',
      '.aaaaae.pppppp.TTU......',
      '.nnnnnnnpppppp.TTTU.....',
      '..cTTTTTTTT..ppTTTU.....',
      '.cTTTTTTTTTU.ppTTTU.....',
      '.TTTTTTTTTTU.PPTTTTU....',
      '.TTTTTTTTTTTUUUUTTTTU...',
      '..UUUUUUUUU......nnn....',
      '...nnnnn........nnnnn...',
      '...nnGnn........nnGnn...',
      '...nnnnn........nnnnn...',
      '....nnn..........nnn....',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 22, rx: 11, ry: 1.5, key: 'z' },
  ),
  legend: {
    H: 'denim',
    h: 'indigo',
    v: 'cyan',
    s: 'skin',
    r: 'red',
    R: 'maroon',
    p: 'stone',
    P: 'slate',
    Y: 'honey',
    a: 'amber',
    e: 'ember',
    w: 'paper',
    n: 'slate',
    T: 'teal',
    c: 'cyan',
    U: 'indigo',
    L: 'honey',
    G: 'fog',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Videoconference: an open laptop seen from the front, its screen split into
// four call tiles, each with a different person on a coloured background, and
// the small webcam in the top bezel.
// O lit outline, o shade outline, S bezel, k screen gap, c webcam, b/l/y/q tile
// backgrounds, H/K/a hair, s/t skin, r/d/T/P shirts, g deck, G deck shade, z shadow.

const VIDEOCONFERENCE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '..OOOOOOOOOOOOOOOOOOOo..',
      '..OSSSSSSSSckSSSSSSSSo..',
      '..OSbbbbbbbkklllllllSo..',
      '..OSbbHHHbbkkllKKKllSo..',
      '..OSbbsssbbkklltttllSo..',
      '..OSbbsssbbkklltttllSo..',
      '..OSbrrrrrbkkldddddlSo..',
      '..OSrrrrrrrkkdddddddSo..',
      '..OSkkkkkkkkkkkkkkkkSo..',
      '..OSyyyyyyykkqqqqqqqSo..',
      '..OSyyaaayykkqqKKKqqSo..',
      '..OSyysssyykkqqtttqqSo..',
      '..OSyysssyykkqqtttqqSo..',
      '..OSyTTTTTykkqPPPPPqSo..',
      '..OSTTTTTTTkkPPPPPPPSo..',
      '..OSSSSSSSSSSSSSSSSSSo..',
      '..oooooooooooooooooooo..',
      '.gggggggggggggggggggggg.',
      '.GGGGGGGGGGGGGGGGGGGGGG.',
      '..oooooooooooooooooooo..',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.2, rx: 11.5, ry: 1.4, key: 'z' },
  ),
  legend: {
    O: 'concrete',
    o: 'slate',
    S: 'stone',
    k: 'ink',
    c: 'cyan',
    b: 'sky',
    l: 'leaf',
    y: 'honey',
    q: 'rosy',
    H: 'ember',
    K: 'ink',
    a: 'amber',
    s: 'skin',
    t: 'tan',
    r: 'red',
    d: 'denim',
    T: 'teal',
    P: 'plum',
    g: 'fog',
    G: 'concrete',
    z: 'fog',
  },
};

export const BRANCH_ITEMS: Readonly<Record<string, PixelSprite>> = {
  briefcase: BRIEFCASE,
  restroom: RESTROOM,
  subway: SUBWAY,
  construction: CONSTRUCTION,
  courier: COURIER,
  videoconference: VIDEOCONFERENCE,
};
