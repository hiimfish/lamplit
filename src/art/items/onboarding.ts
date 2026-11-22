/** Item icons for the onboarding (first day and HR) unit. */
import type { PixelSprite } from '../../game/sprites';
import { withShadow } from './draw';

// ---------------------------------------------------------------------------
// Badge: a staff card hanging from a red lanyard, with a blue header, a
// centred photo and two lines.
// R lanyard, r lanyard shade, G clip edge, c clip, n slot, O lit outline,
// o shade outline, b header light, B header, d header shade, w card, g card
// shade, p photo back, H hair, s skin, T shirt, f name line, e text line, z shadow.

const BADGE: PixelSprite = {
  rows: withShadow(
    [
      '......RR........Rr......',
      '.......RR......Rr.......',
      '........RR....Rr........',
      '.........RR..Rr.........',
      '..........RRRr..........',
      '..........GccG..........',
      '.....OOOOOGccGOOOOo.....',
      '.....ObbbbnnnnbbbBo.....',
      '.....OBBBBBBBBBBBdo.....',
      '.....OBBBBBBBBBBBdo.....',
      '.....Owwwwwwwwwwwgo.....',
      '.....OwwwpHHHHpwwgo.....',
      '.....OwwwpsssspwwgO.....',
      '.....Owwwpsssspwwgo.....',
      '.....Owwwppssppwwgo.....',
      '.....OwwwpTTTTpwwgo.....',
      '.....OwwwTTTTTTwwgo.....',
      '.....Owwwwwwwwwwwgo.....',
      '.....Owwffffffffwgo.....',
      '.....Owwwwwwwwwwwgo.....',
      '.....Owwweeeeeewwgo.....',
      '.....oooooooooooooo.....',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.8, rx: 9, ry: 1.6, key: 'z' },
  ),
  legend: {
    R: 'red',
    r: 'maroon',
    G: 'concrete',
    c: 'fog',
    n: 'night',
    O: 'stone',
    o: 'slate',
    b: 'sky',
    B: 'denim',
    d: 'indigo',
    w: 'paper',
    g: 'fog',
    p: 'sky',
    H: 'ember',
    s: 'skin',
    T: 'teal',
    f: 'stone',
    e: 'fog',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Daughter: a little girl with pigtails tied in pink, a yellow dress and red
// shoes.
// n hair outline, H hair, h hair shine, R hair tie, s skin, k eye, p blush,
// m mouth, O lit outline, o shade outline, w collar, Y dress light, y dress,
// a dress shade, S shoe, z shadow.

const DAUGHTER: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........nnnnnnnn........',
      '......nnHHhhHHHHnn......',
      '.....nHHhhHHHHHHHHn.....',
      '.....nHHHHHHHHHHHHn.....',
      '..nnnRnHsssHHsssHnRnnn..',
      '.nHHHRnssssssssssnRHHHn.',
      '.nHhHnnssksssskssnnHHHn.',
      '.nHHHnnssksssskssnnHHHn.',
      '.nHHHnnspsssssspsnnHHHn.',
      '..nHn.nssssmmssssn.nHn..',
      '...n...nssssssssn...n...',
      '........OYwwwwyo........',
      '......sOYyyyyyyaos......',
      '.....ssOYyyyyyyaoss.....',
      '.....sOYYyyyyyyaaos.....',
      '.....OYYyyyyyyyyaao.....',
      '....OYYyyyyyyyyyyaao....',
      '....oooooooooooooooo....',
      '........ss....ss........',
      '........ss....ss........',
      '.......SSS....SSS.......',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 22.2, rx: 8, ry: 1.3, key: 'z' },
  ),
  legend: {
    n: 'plum',
    H: 'ember',
    h: 'amber',
    R: 'neon',
    s: 'skin',
    k: 'ink',
    p: 'rosy',
    m: 'red',
    O: 'amber',
    o: 'ember',
    w: 'paper',
    Y: 'honey',
    y: 'lamp',
    a: 'amber',
    S: 'red',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Receptionist: the front desk seen from the visitor's side, a name plate
// standing on it and the receptionist (hair in a bun, violet jacket) behind it.
// n hair outline, H hair, h hair shine, s skin, t skin shade, k eye, m mouth,
// O lit outline, o shade outline, V jacket, p scarf, w paper, S plate frame,
// f plate line, Y logo, E desk lit edge, P desk shade edge, y desk top,
// a desk wood, e desk shade, g panel shade, z shadow.

const RECEPTIONIST: PixelSprite = {
  rows: withShadow(
    [
      '............nnnn........',
      '...........nHHHHn.......',
      '..........nnHHHHnn......',
      '.........nHhHHHHHHn.....',
      '.........nHhHHHHHHn.....',
      '.........nHssssssHn.sss.',
      '.........nHskssksHn.sss.',
      '.........nHssssssHn.sst.',
      '.SSSSSS...nssmmssn..OVo.',
      'SwwwwwwS...ntsstn..OVVo.',
      'SwYfffwS.OVVVpwwpVVVVo..',
      'SwwgggwS.OVVVVppVVVVVo..',
      'SSSSSSSS.OVVVVVVVVVVVo..',
      'EyyyyyyyyyyyyyyyyyyyyyyP',
      'EaaaaaaaaaaaaaaaaaaaaaaP',
      '.PPPPPPPPPPPPPPPPPPPPPP.',
      '..EaaaaaaaaaaaaaaaaaeP..',
      '..EaaaaaaaYYYYaaaaaaeP..',
      '..EaaaaaaYwYYYYaaaaaeP..',
      '..EaaaaaaYYYYYYaaaaaeP..',
      '..EaaaaaaaYYYYaaaaaeeP..',
      '..PPPPPPPPPPPPPPPPPPPP..',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.8, rx: 11, ry: 1.5, key: 'z' },
  ),
  legend: {
    n: 'night',
    H: 'plum',
    h: 'mauve',
    s: 'skin',
    t: 'tan',
    k: 'ink',
    m: 'red',
    O: 'mauve',
    o: 'plum',
    V: 'violet',
    p: 'neon',
    w: 'paper',
    S: 'stone',
    f: 'denim',
    Y: 'lamp',
    E: 'amber',
    P: 'plum',
    y: 'honey',
    a: 'amber',
    e: 'ember',
    g: 'fog',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Vacation: a beach: a palm tree, the sun, a striped parasol, the sea and sand.
// m frond dark, l frond, e coconut, t trunk, T trunk shade, Y sun rim, h sun,
// w white, M canopy edge, r canopy stripe, P pole, c sea, k sea deep, y sand,
// s sand shade, a sand edge, z shadow.

const VACATION: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '....mmm...mmm.....YYYY..',
      '..mmlllm.mlllmm..YhhhhY.',
      '.mllllllmllllllm.YhwhhY.',
      'mllmmllllllmmllm.YhhhhY.',
      'mlm.mmllllmm.mlm.YhhhhY.',
      'mm.mllmeemllm.mm..YYYY..',
      '..mllm.tT.mllm..........',
      '..mlm..tT..mlm..MMMMM...',
      '..mm..ttT...mmMMwrrrwMM.',
      '......tT.....MrwwrrrwwrM',
      '.....ttT.....MrwwrrrwwrM',
      '.....tT...........P.....',
      '....ttT...........P.....',
      '.ccctTccccccccccccPcccc.',
      '.cwwtTcccccwwcccccPcwwc.',
      '.kkktTkkkkkkkkkkkkPkkkk.',
      '...yyyyyyyyyyyyyyyyyy...',
      '.yyyyyyyyyyyyyyyyyyyyyy.',
      '.ssyyyysssyyyyyssssyyss.',
      '..aaaaaaaaaaaaaaaaaaaa..',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.8, rx: 11, ry: 1.5, key: 'z' },
  ),
  legend: {
    m: 'moss',
    l: 'leaf',
    e: 'ember',
    t: 'tan',
    T: 'ember',
    Y: 'lamp',
    h: 'honey',
    w: 'paper',
    M: 'maroon',
    r: 'red',
    P: 'concrete',
    c: 'cyan',
    k: 'teal',
    y: 'honey',
    s: 'skin',
    a: 'amber',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Health: a red heart with a white medical cross.
// O lit outline, o shade outline, h highlight, r heart, R heart shade,
// w cross, g cross shade, z shadow.

const HEALTH: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '....OOOOO......OOOOo....',
      '...OhhrrrO....OrrrrRo...',
      '..OhhrrrrrO..OrrrrrrRo..',
      '.OhhrrrrrrrOOrrrrrrrrRo.',
      '.OhrrrrrrrwwwwrrrrrrrRo.',
      '.OhrrrrrrrwwwgrrrrrrrRo.',
      '.OrrrrrrrrwwwgrrrrrrrRo.',
      '.OrrrrrwwwwwwwwwwrrrrRo.',
      '.OrrrrrwwwwwwwwwgrrrrRo.',
      '..OrrrrwwwwwwwwwgrrrRo..',
      '...OrrrwwwwwwwwwgrrRo...',
      '....OrrrrrwwwgrrrrRo....',
      '.....OrrrrwwwgrrrRo.....',
      '......OrrrwwwgrrRo......',
      '.......orrrrrrrRo.......',
      '........orrrrrRo........',
      '.........orrrRo.........',
      '..........oRRo..........',
      '...........oo...........',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.2, rx: 7, ry: 1.5, key: 'z' },
  ),
  legend: {
    O: 'maroon',
    o: 'plum',
    h: 'neon',
    r: 'red',
    R: 'maroon',
    w: 'paper',
    g: 'fog',
    z: 'fog',
  },
};

export const ONBOARDING_ITEMS: Readonly<Record<string, PixelSprite>> = {
  badge: BADGE,
  daughter: DAUGHTER,
  receptionist: RECEPTIONIST,
  vacation: VACATION,
  health: HEALTH,
};
