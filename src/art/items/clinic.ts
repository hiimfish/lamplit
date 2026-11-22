/** Item icons for the clinic and pharmacy unit. */
import type { PixelSprite } from '../../game/sprites';
import { withShadow } from './draw';

// ---------------------------------------------------------------------------
// Form: a clipboard with a form on it, three tick boxes and lines to fill in.
// O clip lit outline, o clip shade outline, c clip, s clip shade,
// E board lit outline, P board shade outline, h board light, a board, e board shade,
// w paper, g paper shade, l ticked box, K empty box, G writing, z shadow.

const FORM: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.........OOOOOO.........',
      '........OgwwwwcO........',
      '....EEEEOgccccsoEEEE....',
      '....EhhhOosssssohaaP....',
      '....EhwwwwwwwwwwwwaP....',
      '....EawwwwwwwwwwwgaP....',
      '....EawllwGGGGGGwgaP....',
      '....EawllwwwwwwwwgaP....',
      '....EawwwwGGGGwwwgaP....',
      '....EawwwwwwwwwwwgaP....',
      '....EawllwGGGGGGwgaP....',
      '....EawllwwwwwwwwgaP....',
      '....EawwwwGGGGGwwgaP....',
      '....EawwwwwwwwwwwgaP....',
      '....EawKKwGGGGGGwgaP....',
      '....EawKKwwwwwwwwgaP....',
      '....EawwwwGGGwwwwgaP....',
      '....EawwwwwwwwwwwgaP....',
      '....EaggggggggggggaP....',
      '....EaaaaaaaaaaaaeeP....',
      '....PPPPPPPPPPPPPPPP....',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.6, rx: 10, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    c: 'concrete',
    s: 'stone',
    E: 'ember',
    P: 'plum',
    h: 'honey',
    a: 'amber',
    e: 'ember',
    w: 'paper',
    g: 'fog',
    l: 'leaf',
    K: 'fog',
    G: 'concrete',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Head: a whole head seen from the front, short brown hair, two eyes, pink
// cheeks, a smile and a short neck.
// P hair outline, h hair light, e hair, E face lit outline, s skin, t skin shade,
// w eye glint, k eye, r cheek, m mouth, z shadow.

const HEAD: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........PPPPPPPP........',
      '......PPhhheeeeePP......',
      '.....PhhheeeeeeeeeP.....',
      '....PhheeeeeeeeeeeeP....',
      '....PheeeeeeeeeeeeeP....',
      '....PeeeeesssseeeeeP....',
      '....PeeesssssssseeeP....',
      '....PeesssssssssseeP....',
      '....PesssssssssssseP....',
      '...EEessssssssssssePP...',
      '..EstsswksssssswksttsP..',
      '..EstsskksssssskkstttP..',
      '..EttssssssssssssstttP..',
      '...EEsrrssssssssrrtPP...',
      '....EssssmssssmssstP....',
      '....EsssssmmmmsssstP....',
      '.....EssssssssssstP.....',
      '......EssssssssstP......',
      '.......EEssssstPP.......',
      '.........EttttP.........',
      '.........EssttP.........',
      '.........PPPPPP.........',
      '........................',
    ],
    { cx: 12, cy: 22.6, rx: 8, ry: 1.3, key: 'z' },
  ),
  legend: {
    P: 'plum',
    h: 'amber',
    e: 'ember',
    E: 'ember',
    s: 'skin',
    t: 'tan',
    w: 'paper',
    k: 'ink',
    r: 'rosy',
    m: 'maroon',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Eye: one large open eye on a patch of skin, a brown brow above it, dark
// lashes on the upper lid.
// E lit outline, P shade outline, s skin, t skin shade, B brow, K lid and lashes,
// w white of the eye, g white shade, i iris, I iris shade, k pupil, W glint,
// T lower lid, z shadow.

const EYE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '....EEEEEEEEEEEEEEEE....',
      '..EEssssssssssssssssPP..',
      '.EssssssssssssssssssstP.',
      '.EsssssBBBBBBBBBssssttP.',
      '.EssBBBBBBBBBBBBBBssttP.',
      '.EsBBssssssssssssBBsttP.',
      '.EsssssKssKssKssKsssttP.',
      '.EssKssKKKKKKKKKKssKstP.',
      '.EsssKKwwiiiiiiwwKKsstP.',
      '.EssKwwwwiWkkiiwwwwKstP.',
      '.EssKwwwwiikkIIwwwgKstP.',
      '.EsssTwwwiiIIIIwwgTsstP.',
      '.EssssTTTwwIIIIwwTTTstP.',
      '.EsssssssTTTTTTTTsssstP.',
      '.EssssssssssssssssssstP.',
      '.EssssssssssssssssssttP.',
      '..EEssssssssssssssttPP..',
      '....PPPPPPPPPPPPPPPP....',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20, rx: 10, ry: 1.6, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    s: 'skin',
    t: 'tan',
    B: 'ember',
    K: 'ink',
    w: 'paper',
    g: 'fog',
    i: 'amber',
    I: 'ember',
    k: 'ink',
    W: 'paper',
    T: 'tan',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Ear: one ear seen from the side, its folds and the dark hollow, brown hair
// above and behind it.
// P hair outline, h hair light, e hair, E ear lit outline, s skin, t fold,
// d hollow, z shadow.

const EAR: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.......PPPPPPPPPPPP.....',
      '.....PhhEEEEEEEeeeeP....',
      '.....PEEsssssssEEeeeP...',
      '.....EsssssssssssPeeeP..',
      '....EsssttttttttssPeeP..',
      '....EssttsssssssttsPeP..',
      '....EsstssssssssstsPeP..',
      '....EsstsstttttsstsPeP..',
      '....EsstsstddddtstsPeP..',
      '....EsssstddddtsstsPP...',
      '.....EssstdddtssstsP....',
      '.....EsssstttsssttsP....',
      '.....EsssssssssttssP....',
      '......EsssssssttssP.....',
      '......EssssttttsssP.....',
      '.......EsssssssstP......',
      '.......EsssssssstP......',
      '........EsssssstP.......',
      '.........EsssstP........',
      '..........PPPPP.........',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.6, rx: 8, ry: 1.6, key: 'z' },
  ),
  legend: {
    P: 'plum',
    h: 'amber',
    e: 'ember',
    E: 'ember',
    s: 'skin',
    t: 'tan',
    d: 'ember',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Hand: an open hand, palm forward, four fingers up and the thumb out to the
// side, two creases on the palm.
// E lit outline, P shade outline, s skin, t skin shade and creases, z shadow.

const HAND: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '...........EEE..........',
      '..........EsssEEEE......',
      '.......EEEEsssEsstE.....',
      '......EsssEsssEsstE.....',
      '......EsssEsssEsstEEE...',
      '......EsssEsssEsstEsstP.',
      '......EsssEsssEsstEsstP.',
      '......EsssEsssEsstEsstP.',
      '.EE...EsssEsssEsstEsstP.',
      'EssE..EsssEsssEsstEsstP.',
      'EsssE.EssstssstssttsstP.',
      'EsssstssssssssssssssstP.',
      '.EssssstssssssssssssstP.',
      '..EsssssstssttttttssstP.',
      '...EsssstsssssssssssttP.',
      '....EssstsssssssssssttP.',
      '....EssstsssssssssttP...',
      '.....EsssssssssssttP....',
      '......EssssssssssttP....',
      '......EssssssssssttP....',
      '......PPPPPPPPPPPPP.....',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.6, rx: 9, ry: 1.5, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    s: 'skin',
    t: 'tan',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Arm: a bent arm from the shoulder to the hand, the blue sleeve of a T-shirt
// at the shoulder, the forearm raised and the hand open with its fingers up.
// D sleeve outline, b sleeve, d sleeve shade, E lit outline and finger gaps,
// P shade outline, s skin, t skin shade and creases, z shadow.

const ARM: PixelSprite = {
  rows: withShadow(
    [
      '...............E.E......',
      '.............EEsEsEE....',
      '............EsEsEsEsP...',
      '............EsEsEsEsP...',
      '............EsEsEsEsP...',
      '.........EEEEsssssstP...',
      '.........EssssssssstP...',
      '..........EEEsssssstP...',
      '.............EsssstP....',
      '.............EssssstP...',
      '............EsssssstP...',
      '............EssssssstP..',
      '..DDDD.EEEE.EssssssstP..',
      '.DbbbbDssssstssssssstP..',
      'DbbbbbbdssssstssssssstP.',
      'DbbbbbbdsssssssssssssstP',
      'DbbbbbbdssssssssssssttP.',
      'DbbbbbddsssssssssssttP..',
      'DbbbbbddssssssssstttP...',
      '.DddddddttttttttttPP....',
      '..DDDDDDPPPPPPPPPP......',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 11, cy: 20.8, rx: 10.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    D: 'indigo',
    b: 'sky',
    d: 'denim',
    E: 'ember',
    P: 'plum',
    s: 'skin',
    t: 'tan',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Leg: a leg from the thigh to the foot, bent a little at the knee, the hem of
// blue shorts at the top, a white sock and a red shoe.
// D shorts outline, b shorts, d shorts shade, E lit outline, P shade outline,
// s skin, t skin shade, O sock outline, w sock and sole, g sock shade,
// R shoe outline, n shoe light, r shoe, m shoe shade, o sole shade, z shadow.

const LEG: PixelSprite = {
  rows: withShadow(
    [
      '....DDDDDDDDDD..........',
      '....DbbbbbbbbD..........',
      '....DbbbbbbbbbD.........',
      '....DddddddddddD........',
      '.....EsssssssstP........',
      '......EssssssstP........',
      '......EsssssssstP.......',
      '.......EssssssstP.......',
      '........EsssssstP.......',
      '........EsssssstP.......',
      '........EssssstP........',
      '.......EtssssstP........',
      '.......EssssstP.........',
      '......EssssstP..........',
      '......EsssstP...........',
      '......OwwwwgO...........',
      '......OwwwwgO...........',
      '.....RRrrrrrRRRR........',
      '.....RnrrrrrrrrrRR......',
      '.....RrrrrrrrrrrrmR.....',
      '.....OwwwwwwwwwwwwO.....',
      '......oooooooooooo......',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.8, rx: 9, ry: 1.5, key: 'z' },
  ),
  legend: {
    D: 'indigo',
    b: 'sky',
    d: 'denim',
    E: 'ember',
    P: 'plum',
    s: 'skin',
    t: 'tan',
    O: 'concrete',
    w: 'paper',
    g: 'fog',
    R: 'maroon',
    n: 'neon',
    r: 'red',
    m: 'maroon',
    o: 'slate',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Shot: a syringe pointing down to the left, orange plunger, marks on the
// barrel, medicine inside and a drop at the needle.
// b plunger, B plunger shade, O lit outline and marks, o shade outline,
// w empty barrel, g barrel shade, K plunger seal, x medicine, d medicine shade,
// c needle, s needle shade, k drop, z shadow.

const SHOT: PixelSprite = {
  rows: withShadow(
    [
      '.................bbB....',
      '..................bbB...',
      '...................bbB..',
      '..................bBbbB.',
      '...........Oo....bB..bbB',
      '............Oo..bB......',
      '............OOobB.......',
      '...........OwwOo........',
      '..........OwwwwOo.......',
      '.........OKKwOggOo......',
      '........OxKKKgOo.Oo.....',
      '.......OxxxKKKo.........',
      '......OxxxxdKo..........',
      '.....OxxxOddo...........',
      '....oxxxxdOo............',
      '....ooxOddo.............',
      '....coodOo..............',
      '....ccooo...............',
      '...ccs..................',
      '..cs....................',
      '........................',
      '.k......................',
      'kkd.....................',
      '........................',
    ],
    { cx: 9, cy: 21.4, rx: 9, ry: 1.8, key: 'z' },
  ),
  legend: {
    b: 'lamp',
    B: 'amber',
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    K: 'ink',
    x: 'cyan',
    d: 'teal',
    c: 'concrete',
    s: 'stone',
    k: 'cyan',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Nose: a big nose in profile on a small patch of face, pointing left, its tip
// a little pink, the curve of the nostril behind it; an eye above and the line
// of the mouth below show which way the face looks.
// E lit outline, P shade outline, s skin, t skin shade, r pink tip, k nostril
// and mouth, B brow, K eye, z shadow.

const NOSE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.........EEEEEEEEEEEE...',
      '........EssssssssssstP..',
      '........EsssBBBBsssstP..',
      '.........EsssssssssstP..',
      '.........EssKKsssssstP..',
      '........EsssKKsssssstP..',
      '.......EsssssssssssstP..',
      '......EssssssssssssstP..',
      '.....EsssssssssssssstP..',
      '....EssssssssssssssstP..',
      '...ErrsssssssttssssstP..',
      '..ErrrsssssstsstsssstP..',
      '..ErrssskkstsssstssstP..',
      '...EttttkktssssttssstP..',
      '....PPPPPEtttssssssstP..',
      '.........EsssssssssstP..',
      '........EssssssssssstP..',
      '.........EkksssssssstP..',
      '........EssssssssssstP..',
      '.........EsssssssttP....',
      '.........PPPPPPPPPPP....',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.6, rx: 10, ry: 1.5, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    s: 'skin',
    t: 'tan',
    B: 'ember',
    K: 'ink',
    k: 'maroon',
    r: 'rosy',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Medicine: a brown glass bottle of medicine with a white screw cap and a red
// cross on its label.
// O cap lit outline, o cap shade outline, w cap and label, g shade, G cap dark,
// E glass lit outline, P glass shade outline, h glass light, a glass,
// e glass shade, r cross, z shadow.

const MEDICINE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........OOOOOOOOOO......',
      '........OwwwwwwgGo......',
      '........OwgwgwggGo......',
      '........OwgwgwggGo......',
      '........oooooooooo......',
      '.........EhaaaaaeP......',
      '.......EEhaaaaaaaePP....',
      '......EhhaaaaaaaaaeP....',
      '......EhaaaaaaaaaaeP....',
      '......EwwwwwwwwwwwgP....',
      '......EwwwwwrrwwwwgP....',
      '......EwwwwwrrwwwwgP....',
      '......EwwwrrrrrrwwgP....',
      '......EwwwrrrrrrwwgP....',
      '......EwwwwwrrwwwwgP....',
      '......EwwwwwrrwwwwgP....',
      '......EwwwwwwwwwwwgP....',
      '......EhaaaaaaaaaaeP....',
      '......EaaaaaaaaaaeeP....',
      '......PPPPPPPPPPPPPP....',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 13, cy: 20.8, rx: 9, ry: 1.7, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    G: 'concrete',
    E: 'ember',
    P: 'plum',
    h: 'honey',
    a: 'amber',
    e: 'ember',
    r: 'red',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Pill: three loose pills: a red and white capsule, a round white tablet with
// a score line and a small yellow tablet.
// R red lit outline, M red shade outline, x glint, n red light, r red, m red shade,
// O white lit outline, o white shade outline, w white, g white shade, G score line,
// E yellow lit outline, P yellow shade outline, h yellow light, y yellow,
// a yellow shade, z shadow.

const PILL: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '....RRRRRROOOOOO........',
      '..RRnnnnnnwwwwwwOO......',
      '.RnxxnnnnrwwwwwwwwO.....',
      '.RnnnnrrrrwwwwwwwgO.....',
      '.RrrrrrrrmwwwwwwggO.....',
      '.Rrrrrrmmmwwwwggggo.....',
      '..MMmmmmmmggggggoo......',
      '....MMMMMMoooooo........',
      '........................',
      '.............OOOOOO.....',
      '...EEEE....OOwwwwwwOO...',
      '..EhhyyP..OwwwwwwwwwwO..',
      '.EhhyyyyP.OwwwwwwwwwgO..',
      '.EhyyyyaP.OwGGGGGGGGgo..',
      '.EyyyyaaP.Owwwwwwwwggo..',
      '..PyyaaP..Owwwwwwwgggo..',
      '...PPPP....oowwggggoo...',
      '.............oooooo.....',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 19.8, rx: 11, ry: 1.8, key: 'z' },
  ),
  legend: {
    R: 'maroon',
    M: 'plum',
    x: 'paper',
    n: 'neon',
    r: 'red',
    m: 'maroon',
    O: 'concrete',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    G: 'concrete',
    E: 'ember',
    P: 'plum',
    h: 'honey',
    y: 'lamp',
    a: 'amber',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Tissue: a blue box of tissues with white dots, one tissue pulled up out of
// the slot on top.
// O tissue outline, w tissue, g tissue fold, B box outline, k box top, i slot,
// b box front, d box shade, z shadow.

const TISSUE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '..........OO............',
      '.........OwwO..OO.......',
      '........OwwwwOOwwO......',
      '........OwwwwwwwwgO.....',
      '.......OwwwgwwwwwgO.....',
      '.......OwwwgwwwwggO.....',
      '........OwwwgwwwgO......',
      '........OwwwgwwggO......',
      '....BBBBBOwwgwwgOBBB....',
      '...BkkkkkkOwggwgOkkkB...',
      '..BkkkkkiiiiiiiiiikkkB..',
      '.BkkkkkkkkkkkkkkkkkkkkB.',
      '.BbbbbbbbbbbbbbbbbbbbdB.',
      '.BbbwbbbbbwbbbbbwbbbbdB.',
      '.BbbbbbbbbbbbbbbbbbbbdB.',
      '.BbbbbbwbbbbbwbbbbbwbdB.',
      '.BbbbbbbbbbbbbbbbbbbbdB.',
      '.BbbwbbbbbwbbbbbwbbbbdB.',
      '.BbbbbbbbbbbbbbbbbbbddB.',
      '.BBBBBBBBBBBBBBBBBBBBBB.',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21, rx: 11.5, ry: 1.7, key: 'z' },
  ),
  legend: {
    O: 'concrete',
    w: 'paper',
    g: 'fog',
    B: 'indigo',
    k: 'sky',
    i: 'night',
    b: 'denim',
    d: 'indigo',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Cream: a white tube of ointment lying on its side with the cap off, a teal
// band with a cross on it, white cream squeezed out of the nozzle into a small
// blob, the cap standing beside the tube.
// O lit outline, o shade outline, g tube and cream shade, c crimp and nozzle,
// s nozzle shade, w tube and cream, k band, C cream outline, T cap outline,
// L cap light, K cap, d cap shade, z shadow.

const CREAM: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '.OOOOOOOOOOO............',
      '.OgcwwwwwwwwOOO.........',
      '.OgcwwkkkkkkkwwOO.......',
      '.OgcwwkkkwkkkwwwwOOO.CC.',
      '.OgcwwkkwwwkkwwwwOccOwwC',
      '.OgcwwkkkwkkkwwwgOcsogwC',
      '.Ogcwwkkkkkkkwgggooo.CwC',
      '.Ogcwwwwwwgggggoo....CwC',
      '.Ogcggggggggooo....CCwwC',
      '.ooooooooooo.....CCwwwwC',
      '................CwwwwwgC',
      '...TTTTT........CwwwwggC',
      '..TLKKKdT.......CwggggC.',
      '..TLKdKdT........CCCCC..',
      '..TLKdKdT...............',
      '..TTTTTTT...............',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20, rx: 11, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    g: 'fog',
    c: 'concrete',
    s: 'stone',
    w: 'paper',
    k: 'teal',
    C: 'concrete',
    T: 'indigo',
    L: 'cyan',
    K: 'teal',
    d: 'denim',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Pharmacy: a small shop front with a green cross sign on the roof, a green
// and white awning, bottles in the window and a glass door.
// O lit outline, o ground line, w wall and sign, g wall shade, l cross and stripe,
// L awning outline, M awning shadow, K frames, k glass, r a l bottles,
// h door handle, z shadow.

const PHARMACY: PixelSprite = {
  rows: withShadow(
    [
      '........OOOOOOOO........',
      '........OwwllwwO........',
      '........OwwllwwO........',
      '........OllllllO........',
      '........OllllllO........',
      '........OwwllwwO........',
      '........OwwllwwO........',
      '..OOOOOOOOOOOOOOOOOOOO..',
      '..OwwwwwwwwwwwwwwwwwgO..',
      '.LLLLLLLLLLLLLLLLLLLLLL.',
      '.LllwwllwwllwwllwwllwwL.',
      '.LllwwllwwllwwllwwllwwL.',
      '.LllwwllwwllwwllwwllwwL.',
      '..OMMMMMMMMMMMMMMMMMMO..',
      '..OwKKKKKKKKKwKKKKKKgO..',
      '..OwKkkkkkkkKwKkkkkKgO..',
      '..OwKkrkaklkKwKkkkkKgO..',
      '..OwKkrkaklkKwKkkkkKgO..',
      '..OwKKKKKKKKKwKkkkhKgO..',
      '..OwwwwwwwwwwwKkkkkKgO..',
      '..OwgggggggggwKkkkkKgO..',
      '..oooooooooooooooooooo..',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 22, rx: 11, ry: 1.4, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    l: 'leaf',
    L: 'moss',
    M: 'moss',
    K: 'slate',
    k: 'sky',
    r: 'red',
    a: 'lamp',
    h: 'honey',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Mask: a light blue face mask seen flat, a white nose strip along the top,
// three pleats and an ear loop at each side.
// O lit outline, o shade outline, w nose strip, k cloth, d pleat, b cloth shade,
// c ear loop, z shadow.

const MASK: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '....OOOOOOOOOOOOOOOO....',
      '.cc.OwwwwwwwwwwwwwwO.cc.',
      'c..cOkkkkkkkkkkkkkkOc..c',
      'c...OkkkkkkkkkkkkkkO...c',
      'c...OkddddddddddddkO...c',
      'c...OkkkkkkkkkkkkkkO...c',
      'c...OkkkkkkkkkkkkkkO...c',
      'c...OkddddddddddddkO...c',
      'c...OkkkkkkkkkkkkkkO...c',
      'c...OkkkkkkkkkkkkkbO...c',
      'c...OkddddddddddddbO...c',
      'c..cOkkkkkkkkkkkkbbOc..c',
      '.cc.OkkkkkkkkkkkbbbO.cc.',
      '....oooooooooooooooo....',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 19.6, rx: 10, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'denim',
    o: 'indigo',
    w: 'paper',
    k: 'sky',
    d: 'denim',
    b: 'denim',
    c: 'concrete',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Food: a white plate piled with different foods: broccoli, a tomato, a fried
// chicken leg and a wedge of cheese.
// L broccoli outline and shade, l green, R tomato outline, n tomato light,
// r tomato, M tomato shade, E chicken lit outline, h chicken light, a chicken,
// e chicken shade, O plate and bone outline, o plate shade outline, w plate and
// bone, g plate shade, Y cheese outline, H cheese top, y cheese side, A cheese hole,
// z shadow.

const FOOD: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '......LLLL..............',
      '....LLlllLLL............',
      '...LlllLlllLL....RRRR...',
      '...LllLlllLlLL..RrlLrR..',
      '...LlLlllLllLL.RnrllrrR.',
      '....LLlLlLLLL..RnnrrrMR.',
      '......LlLLL....RnrrrrMR.',
      '......LlLLL....RrrrrMMR.',
      '..EEEELlLLL.....RrrMMR..',
      '.EhhaaEELLL......RRRR...',
      'EhhaaaaaE...OO.....YYY..',
      'EhaaaaaaaEOOwO..YYYHHHY.',
      'EaaaaaaaeEwwwOYYHHHHHHY.',
      'EaaaaaaeeEwwgOYyyyAyyyY.',
      'OEaaaeeeEEOOgOYyAyyyyAYO',
      'OwEEEEEEwwwwOOYYYYYYYYYO',
      'OwwgggggggwwwwgggggggggO',
      '.OgwwwwwwwwwwwwwwwwwwgO.',
      '..ooggggggggggggggggoo..',
      '....oooooooooooooooo....',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.6, rx: 11, ry: 1.5, key: 'z' },
  ),
  legend: {
    L: 'moss',
    l: 'leaf',
    R: 'maroon',
    n: 'neon',
    r: 'red',
    M: 'maroon',
    E: 'ember',
    h: 'honey',
    a: 'amber',
    e: 'ember',
    O: 'concrete',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    Y: 'amber',
    H: 'honey',
    y: 'lamp',
    A: 'amber',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Glass: an empty drinking glass, wider at the top, a thick base, a shine down
// its side and a sparkle beside it.
// O lit outline, o shade outline, w shine, g glass, G glass shade, k base,
// d base shade, x sparkle, z shadow.

const GLASS: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '......OOOOOOOOOOOO......',
      '....OOwggggggggggGoo....',
      '....OwggggggggggggGo....',
      '....OwOOOOOOOOOOOOGo....',
      '....Oww..........gGo....',
      '....Oww.w........gGo.x..',
      '....Oww.w........gGoxxx.',
      '....Oww.w........gGo.x..',
      '.....Oww.w......gGo.....',
      '.....Oww........gGo.....',
      '.....Oww........gGo.....',
      '.....Oww........gGo.....',
      '.....Oww........gGo.....',
      '......Oww......gGo......',
      '......Oww......gGo......',
      '......OwggggggggGo......',
      '......OwkkkkkkkkGo......',
      '......OgkkkkkkkdGo......',
      '.......oooooooooo.......',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20, rx: 8, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'sky',
    o: 'denim',
    w: 'paper',
    g: 'fog',
    G: 'concrete',
    k: 'fog',
    d: 'concrete',
    x: 'cyan',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Dinner: an evening table seen from above: a steak with greens and carrots on
// a white plate, a fork and a knife beside it on a dark placemat, a lit red
// candle at the corner.
// M mat outline, m mat, O plate lit outline, o plate shade outline, w plate and
// blade, g plate shade, E steak outline, t steak light, e steak, p grill marks,
// l L greens, y a carrots, f fork, A knife handle, r candle, R candle shade,
// k wick, Y flame, h flame core, z shadow.

const DINNER: PixelSprite = {
  rows: withShadow(
    [
      '....................Y...',
      '...................YhY..',
      '...................YhY..',
      '....................k...',
      '...................rrR..',
      '...................rrR..',
      '.MMMMMMMMMMMMMMMMMMrrRM.',
      'MmmmmmmmmOOOOOOmmmmrrRmM',
      'MmmmmmmOOwwwwwwOOmmrrRmM',
      'MfmfmmOwwwwwwwwwwOmMMMmM',
      'MfmfmOwwEEEEEwlLlwOmmmmM',
      'MfmfmOwEteeeeELllwOmwmmM',
      'MfffmOwEepeepElLlwOmwgmM',
      'MmfmmOwEeepeeEyyawOmwgmM',
      'MmfmmOwEpeepeEyaywOmwgmM',
      'MmfmmOwwEEEEEwayywOmwgmM',
      'MmfmmOwggggggggggwOmaAmM',
      'MmfmmmOwwwwwwwwggommaAmM',
      'MmfmmmmoowwwgggoommmaAmM',
      'MmfmmmmmmoooooommmmmaAmM',
      'MmfmmmmmmmmmmmmmmmmmaAmM',
      'MmmmmmmmmmmmmmmmmmmmmmmM',
      '.MMMMMMMMMMMMMMMMMMMMMM.',
      '........................',
    ],
    { cx: 12, cy: 23, rx: 11, ry: 1.2, key: 'z' },
  ),
  legend: {
    M: 'deep',
    m: 'indigo',
    O: 'fog',
    o: 'concrete',
    w: 'paper',
    g: 'fog',
    E: 'plum',
    t: 'tan',
    e: 'ember',
    p: 'plum',
    l: 'leaf',
    L: 'moss',
    y: 'lamp',
    a: 'amber',
    f: 'fog',
    A: 'ember',
    r: 'red',
    R: 'maroon',
    k: 'ink',
    Y: 'lamp',
    h: 'honey',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Breakfast: a fried egg and a slice of buttered toast on a blue plate seen
// from above, a cup of coffee beside it.
// B plate outline, k plate rim, b plate well, w egg white, butter and cup,
// y yolk, Y yolk glint, a yolk shade, A crust, h toast, O cup lit outline,
// o cup shade outline, C coffee, c coffee glint, z shadow.

const BREAKFAST: PixelSprite = {
  rows: withShadow(
    [
      '................OOOO....',
      '..............OOwwwwOO..',
      '..............OwCCCCwOO.',
      '..............OwCcCCwOwO',
      '..............OwCCCCwOwO',
      '..............OwCCCCwOO.',
      '.....BBBBBBBB.OOwwwwOO..',
      '...BBkkkkkkkkBB.oooo....',
      '..BkkkkkkkkkkkkB........',
      '.BkkkbbbbAAAAAAAB.......',
      '.BkkbbbbbAhhhhhAB.......',
      'BkkbbbbbbAhwwhhAkB......',
      'BkkbwwwbbAhwwhhAkB......',
      'BkwwwwwwwAhhhhhAkB......',
      'BkwwwyywwAhhhhhAkB......',
      'BkwwyYyywwAAAAAbkB......',
      'BkwwyyyawwbbbbbbkB......',
      '.BwwwyawwwbbbbkkB.......',
      '.BkwwwwwwbbbbkkkB.......',
      '..BkkwwwkkkkkkkB........',
      '...BBkkkkkkkkBB.........',
      '.....BBBBBBBB...........',
      '........................',
      '........................',
    ],
    { cx: 10, cy: 21.8, rx: 10, ry: 1.5, key: 'z' },
  ),
  legend: {
    B: 'indigo',
    k: 'sky',
    b: 'denim',
    w: 'paper',
    y: 'lamp',
    Y: 'honey',
    a: 'amber',
    A: 'amber',
    h: 'honey',
    O: 'stone',
    o: 'slate',
    C: 'ember',
    c: 'tan',
    z: 'fog',
  },
};

export const CLINIC_ITEMS: Readonly<Record<string, PixelSprite>> = {
  form: FORM,
  head: HEAD,
  eye: EYE,
  ear: EAR,
  hand: HAND,
  arm: ARM,
  leg: LEG,
  shot: SHOT,
  nose: NOSE,
  medicine: MEDICINE,
  pill: PILL,
  tissue: TISSUE,
  cream: CREAM,
  pharmacy: PHARMACY,
  mask: MASK,
  food: FOOD,
  glass: GLASS,
  dinner: DINNER,
  breakfast: BREAKFAST,
};
