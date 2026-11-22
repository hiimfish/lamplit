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

export const MOVE_IN_ITEMS: Readonly<Record<string, PixelSprite>> = {
  key: KEY,
  box: BOX,
  door: DOOR,
  chair: CHAIR,
  lamp: LAMP,
  trash_can: TRASH_CAN,
};
