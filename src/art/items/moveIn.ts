/** Item icons for the move-in unit. */
import type { PixelSprite } from '../../game/sprites';
import { withShadow } from './draw';

// ---------------------------------------------------------------------------
// Key: a brass key lying flat, round bow with a hole, two teeth at the tip.
// E lit outline, P shade outline, h light, y brass, a brass shade, w glint, z shadow.

const KEY: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '....EEEEP...............',
      '...EhhhhyP..............',
      '..EwhhPyyyP.............',
      '.EhhhP.PyyyP............',
      '.EhhP...PyyaEEEEEEEEEEP.',
      '.EhP.....EaaaawaaaaaaaP.',
      '.EhyP...EaaaaaaaaaaaaaP.',
      '.PyyyP.EaaaPPPPaaaPaaaP.',
      '..PyyyEaaaP....EaP.EaP..',
      '...PyyaaaP.....EaP.EaP..',
      '....PPPPP......PPP.EaP..',
      '...................PPP..',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12.5, cy: 18.6, rx: 11, ry: 2.2, key: 'z' },
  ),
  legend: {
    y: 'lamp',
    h: 'honey',
    a: 'amber',
    E: 'ember',
    P: 'plum',
    w: 'paper',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Box: a taped cardboard moving box in three-quarter view with a paper label.
// E lit outline, P shade outline, s top, t front, e side, u fold shade, w tape/label,
// g tape shade and label writing, z shadow.

const BOX: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........EEEEEEEEEEEEEP..',
      '.......EsssswwwssssssP..',
      '......EsssswwwsssssseP..',
      '.....EsssswwwsssssseeP..',
      '....EsssswwwsssssseeeP..',
      '...EsssswwwsssssseeeeP..',
      '..EuuuuuwwguuuuueeeeeP..',
      '..EtttttwwgttttteeeeeP..',
      '..EtttttwwgttttteeeeeP..',
      '..EtttttwwgttttteeeeeP..',
      '..EtttttwwgttttteeeeeP..',
      '..EttttttttttttteeeeeP..',
      '..EtwwwwwwwttttteeeeeP..',
      '..EtwggggwwttttteeeeP...',
      '..EtwgggwwwttttteeeP....',
      '..EtwwwwwwwttttteeP.....',
      '..EttttttttttttteP......',
      '..PPPPPPPPPPPPPPP.......',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12.5, cy: 21, rx: 11.5, ry: 2, key: 'z' },
  ),
  legend: {
    t: 'tan',
    s: 'skin',
    e: 'ember',
    u: 'amber',
    w: 'paper',
    g: 'fog',
    E: 'ember',
    P: 'plum',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Door: a wooden front door in a stone frame, two sunken panels, brass knob.
// O lit outline, o shade outline, f frame light, c frame, S frame shade, h wood light,
// a wood, e wood shade, y knob, w glint, z shadow.

const DOOR: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '....OOOOOOOOOOOOOOOo....',
      '....OfccccccccccccSo....',
      '....OfhaaaaaaaaaaeSo....',
      '....OfhaaaaaaaaaaeSo....',
      '....OfhaeeeeeeehaeSo....',
      '....OfhaeaaaaaahaeSo....',
      '....OfhaeaaaaaahaeSo....',
      '....OfhaeaaaaaahaeSo....',
      '....OfhaeaaaaaahaeSo....',
      '....OfhaeaaaaaahaeSo....',
      '....OfhahhhhhhhwaeSo....',
      '....OfhaaaaaaaayyeSo....',
      '....OfhaaaaaaaaaEeSo....',
      '....OfhaeeeeeeehaeSo....',
      '....OfhaeaaaaaahaeSo....',
      '....OfhaeaaaaaahaeSo....',
      '....OfhaeaaaaaahaeSo....',
      '....OfhaeaaaaaahaeSo....',
      '....OfhahhhhhhhhaeSo....',
      '....OfhaaaaaaaaaaeSo....',
      '...oooooooooooooooooo...',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 22.3, rx: 11.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    c: 'concrete',
    S: 'stone',
    f: 'fog',
    a: 'amber',
    h: 'honey',
    e: 'ember',
    E: 'ember',
    y: 'lamp',
    w: 'paper',
    O: 'stone',
    o: 'slate',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Chair: a wooden chair with a red seat cushion, seen from the front.
// E lit outline, P shade outline, h wood light, a wood, e back legs, r cushion,
// m cushion shade, n cushion glint, z shadow.

const CHAIR: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.....EEEEEEEEEEEEEP.....',
      '.....EhhhhhhhhhhhhP.....',
      '.....EhaPPPPPPPPaaP.....',
      '.....EhP........EaP.....',
      '.....EhP........EaP.....',
      '.....EhaEEEEEEEEaaP.....',
      '.....EhaPPPPPPPPaaP.....',
      '.....EhP........EaP.....',
      '.....EhP........EaP.....',
      '....ErnnEEEEEEEErrrP....',
      '....ErrrrrrrrmmmmmmP....',
      '...EaahaaaaaaaaaaaaaP...',
      '...EhhhhhhhhhhhhhhhhP...',
      '...PaahPaaPPPPaaPaaaP...',
      '....EaP.EP....EP.EaP....',
      '....EaP.EP....EP.EaP....',
      '....EaP.EP....EP.EaP....',
      '....EaP.EP....EP.EaP....',
      '....EaP.PP....PP.EaP....',
      '....EaP..........EaP....',
      '....PPP..........PPP....',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 22, rx: 11, ry: 1.8, key: 'z' },
  ),
  legend: {
    a: 'amber',
    h: 'honey',
    e: 'ember',
    r: 'red',
    m: 'maroon',
    n: 'neon',
    E: 'ember',
    P: 'plum',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Lamp: a teal desk lamp with a warm bulb under the shade, on a round foot.
// o lit outline, N shade outline, c shade light, t shade, d shade dark, h bulb,
// y bulb core, w glint, f stem light, S stem and foot, z shadow.

const LAMP: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '.......ooooooooN........',
      '......occcttttttN.......',
      '......wcccttttttN.......',
      '.....occcctttttttN......',
      '.....occcccttttttN......',
      '....occcccctttttttN.....',
      '....occcccctttttttN.....',
      '...occcccccctttttttN....',
      '...NNNNNNcccttNNNNNN....',
      '.........hhhhh..........',
      '.........hhwyh..........',
      '..........oSN...........',
      '..........oSN...........',
      '..........oSN...........',
      '..........oSN...........',
      '..........oSN...........',
      '......oooofSSoooN.......',
      '.....oSSSSSSSSSSSN......',
      '.....NSSSSSSSSSSSN......',
      '......NNNNNNNNNNN.......',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.4, rx: 11, ry: 1.8, key: 'z' },
  ),
  legend: {
    t: 'teal',
    c: 'cyan',
    d: 'denim',
    S: 'stone',
    f: 'fog',
    h: 'honey',
    y: 'lamp',
    w: 'paper',
    o: 'slate',
    N: 'night',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Trash can: a green ribbed bin with a domed lid and a handle.
// m lit outline and ribs, N shade outline, l body, S handle, w glint, p glint shade,
// z shadow.

const TRASH_CAN: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '..........mNNN..........',
      '..........N..N..........',
      '......mmmmlmmlmmmN......',
      '....mmlpwlllllllllmN....',
      '...mllllllllllllllllN...',
      '...mllllllllllllllllN...',
      '...NNllllllllmmmmmmNN...',
      '.....mlllllllllllmN.....',
      '.....mllmllmllmllmN.....',
      '.....mwlmllmllmllmN.....',
      '.....mwlmllmllmllmN.....',
      '.....mplmllmllmllmN.....',
      '.....mllmllmllmllmN.....',
      '.....mllmllmllmllmN.....',
      '.....mllmllmllmllmN.....',
      '.....mllmllmllmllmN.....',
      '.....mllmllmllmllmN.....',
      '.....mllmllmllmllmN.....',
      '.....NNNNNNNNNNNNNN.....',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.4, rx: 11, ry: 1.9, key: 'z' },
  ),
  legend: {
    l: 'leaf',
    m: 'moss',
    S: 'stone',
    w: 'paper',
    p: 'fog',
    N: 'night',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Room: an empty room seen from the front, the back wall with a window, side
// walls and ceiling in perspective, and a wooden floor with a patch of light.
// O lit outline, o shade outline, f ceiling, g lit wall, G shade wall,
// w back wall, k corner lines, n window frame, c glass, h glint, a floor,
// e floor shadow, y light patch.

const ROOM: PixelSprite = {
  rows: [
    '........................',
    '........................',
    '.OOOOOOOOOOOOOOOOOOOOOo.',
    '.OgffffffffffffffffffGo.',
    '.OggffffffffffffffffGGo.',
    '.OggggffffffffffffGGGGo.',
    '.OgggggkkkkkkkkkkGGGGGo.',
    '.OgggggkwwwwwwwwkGGGGGo.',
    '.OgggggkwnnnnnnwkGGGGGo.',
    '.OgggggkwnhccnnwkGGGGGo.',
    '.OgggggkwncccnnwkGGGGGo.',
    '.OgggggkwnnnnnnwkGGGGGo.',
    '.OgggggkwwwwwwwwkGGGGGo.',
    '.OgggggkkkkkkkkkkGGGGGo.',
    '.OgggggeeeeeeeeeeGGGGGo.',
    '.OggggaaaaayyyyaaaGGGGo.',
    '.OgggaaaaayyyyaaaaaGGGo.',
    '.OggaaaaayyyyaaaaaaaGGo.',
    '.OgaaaaaaaaaaaaaaaaaaGo.',
    '.Oaaaaaaaaaaaaaaaaaaaao.',
    '.oooooooooooooooooooooo.',
    '........................',
    '........................',
    '........................',
  ],
  legend: {
    O: 'concrete',
    o: 'stone',
    f: 'fog',
    g: 'skin',
    G: 'tan',
    w: 'paper',
    k: 'fog',
    n: 'stone',
    c: 'cyan',
    h: 'paper',
    a: 'amber',
    e: 'ember',
    y: 'honey',
  },
};

// ---------------------------------------------------------------------------
// Home: a small house with a red roof, a chimney, a lit window and a door.
// O roof lit edge, M roof outline, r roof, R roof shade, S chimney cap,
// b brick, B brick shade, T wall lit outline, E wall outline, w wall,
// k wall shade, Y window light, y window, D door outline, d door, z shadow.
// The door knob reuses y.

const HOME: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '...............SSS......',
      '...........OM..bBB......',
      '..........OrRM.bBB......',
      '.........OrrRRMbBB......',
      '........OrrrRRRMBB......',
      '.......OrrrrRRRRM.......',
      '......OrrrrrRRRRRM......',
      '.....OrrrrrrRRRRRRM.....',
      '....OrrrrrrrRRRRRRRM....',
      '...OrrrrrrrrRRRRRRRRM...',
      '..MMMMMMMMMMMMMMMMMMMM..',
      '....TkkkkkkkkkkkkkkE....',
      '....TwEEEEwwwwwwwkkE....',
      '....TwEYyEwwDDDDwkkE....',
      '....TwEyyEwwDddDwkkE....',
      '....TwEEEEwwDddDwkkE....',
      '....TwwwwwwwDdyDwkkE....',
      '....TwwwwwwwDddDwkkE....',
      '....TwwwwwwwDddDwkkE....',
      '...EEEEEEEEEEEEEEEEEE...',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21, rx: 11, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'rosy',
    M: 'maroon',
    r: 'red',
    R: 'maroon',
    S: 'stone',
    b: 'tan',
    B: 'ember',
    T: 'tan',
    E: 'ember',
    w: 'paper',
    k: 'skin',
    Y: 'honey',
    y: 'lamp',
    D: 'ember',
    d: 'amber',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Car: a blue car in side view facing right, with windows, a headlight, a
// tail light and two wheels.
// O lit outline, o shade outline, h body light, b body, d body shade,
// c glass, w glint, k glass shade, y headlight, r tail light, n tyre,
// s rim, f hub, z shadow.

const CAR: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '.......OOOOOOOOo........',
      '......Ohhhhhhhhbo.......',
      '.....ObcwccbcwcccO......',
      '....ObbwcccbwcccccO.....',
      '...ObbbkkkkbkkkkkkkO....',
      '.Ohhhhhhhhhhhhhhhhhhbo..',
      '.rbbbbbbbbbbbbbbbbbbbby.',
      '.Obbbbbbbbdbbbbbbbbbbbo.',
      '.Obbbbbbbbdbbbbbbbbbbbo.',
      '.Odnnnnnnddddddnnnnnndo.',
      '.Odnssssnddddddnssssndo.',
      '.oonsffsnoooooonsffsnoo.',
      '...nsffsn......nsffsn...',
      '...nssssn......nssssn...',
      '....nnnn........nnnn....',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20, rx: 11.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'denim',
    o: 'deep',
    h: 'sky',
    b: 'denim',
    d: 'indigo',
    c: 'cyan',
    w: 'paper',
    k: 'sky',
    y: 'honey',
    r: 'red',
    n: 'night',
    s: 'stone',
    f: 'fog',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Phone: a smartphone standing upright, its screen showing app icons and a
// dock.
// O lit outline, o shade outline, b bezel, x speaker and home bar,
// d screen dark, k screen, y n l c w a m app icons, z shadow.

const PHONE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.......OOOOOOOOOo.......',
      '......Obbbbxxbbbbo......',
      '......Obddddddddbo......',
      '......Obkkkkkkkkbo......',
      '......Obyyknnkllbo......',
      '......Obyyknnkllbo......',
      '......Obkkkkkkkkbo......',
      '......Obcckwwkaabo......',
      '......Obcckwwkaabo......',
      '......Obkkkkkkkkbo......',
      '......Obkkkkkkkkbo......',
      '......Obkkkkkkkkbo......',
      '......Obkkkkkkkkbo......',
      '......Obkkkkkkkkbo......',
      '......Obddddddddbo......',
      '......Obmmdccdnnbo......',
      '......Obmmdccdnnbo......',
      '......Obddddddddbo......',
      '......Obbbxxxxbbbo......',
      '......Obbbbbbbbbbo......',
      '.......oooooooooo.......',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 22, rx: 9, ry: 1.5, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'night',
    b: 'slate',
    x: 'night',
    d: 'denim',
    k: 'sky',
    y: 'lamp',
    n: 'neon',
    l: 'leaf',
    c: 'cyan',
    w: 'paper',
    a: 'amber',
    m: 'leaf',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Sofa: a brown leather two-seat sofa from the front, with tufted back
// cushions, rolled arms and short legs.
// E lit outline, P shade outline, h leather light, t leather, e leather
// shade, z shadow.

const SOFA: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '....EEEEEEE..EEEEEEE....',
      '...EhhhhhhhPEhhhhhhhP...',
      '...EhtttttePEhttttteP...',
      '...EhtttttePEhttttteP...',
      '..EEEtttttePEhtttttEEE..',
      '.EhhhPttttePEhttttEhhhP.',
      '.EhtePttttePEhttttEhteP.',
      '.EhtePEEEEEEEEEEEEEhteP.',
      '.EhtePhhhhhEhhhhhhEhteP.',
      '.EhtePtttttEhtttttEhteP.',
      '.EhtePtttttEhtttttEhteP.',
      '.EhtePeeeeeEheeeeeEhteP.',
      '.EheePPPPPPPPPPPPPEheeP.',
      '..PPPPPPPPPPPPPPPPPPPP..',
      '...PP..............PP...',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 19, rx: 11.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    E: 'moss',
    P: 'night',
    h: 'cyan',
    t: 'teal',
    e: 'moss',
    z: 'fog',
  },
};

export const MOVE_IN_ITEMS: Readonly<Record<string, PixelSprite>> = {
  key: KEY,
  box: BOX,
  door: DOOR,
  chair: CHAIR,
  lamp: LAMP,
  trash_can: TRASH_CAN,
  room: ROOM,
  home: HOME,
  car: CAR,
  phone: PHONE,
  sofa: SOFA,
};
