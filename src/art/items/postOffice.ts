/** Item icons for the post office unit. */
import type { PixelSprite } from '../../game/sprites';
import { withShadow } from './draw';

// ---------------------------------------------------------------------------
// Mail: a blue mailbox on a wooden post, its red flag up and a letter sticking
// out of the open front.
// O lit outline, o shade outline, k box light, b box, d box shade, n opening,
// M flag pole, r flag, R flag shade, W letter outline, w letter, g letter shade,
// E post lit outline, P post shade outline, a wood, e wood shade, z shadow.

const MAIL: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '...............Mrrrr....',
      '...............MrrrR....',
      '...............MrrRR....',
      '......OOOOOOOOOMOOo.....',
      '....OOkkkkkkkkkMkkbo....',
      '...OnnOkbbbbbbbMbbbdo...',
      '..OnnnnObbbbbbbMbbbdo...',
      '..OnnnnObbbbbbbbbbbdo...',
      '.WWWWWWWWbbbbbbbbbbdo...',
      '.WwwwwwwgWbbbbbbbbbdo...',
      '.WwggggwgWbbbbbbbbbdo...',
      '.WwwwwwrgWbbbbbbbbddo...',
      '.WWWWWWWWWddddddddddo...',
      '...oooooooooooooooo.....',
      '.........EaaeP..........',
      '.........EaaeP..........',
      '.........EaaeP..........',
      '.........EaaeP..........',
      '.........EaaeP..........',
      '.........EaaeP..........',
      '........EEaaePP.........',
      '........................',
      '........................',
    ],
    { cx: 11.5, cy: 21.8, rx: 8, ry: 1.5, key: 'z' },
  ),
  legend: {
    O: 'denim',
    o: 'indigo',
    k: 'sky',
    b: 'denim',
    d: 'indigo',
    n: 'night',
    M: 'maroon',
    r: 'red',
    R: 'maroon',
    W: 'stone',
    w: 'paper',
    g: 'fog',
    E: 'ember',
    P: 'plum',
    a: 'tan',
    e: 'ember',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Letter: an opened envelope, its flap up, with a written sheet coming out.
// O lit outline, o shade outline, w paper, g paper shade, G inside of the flap,
// d handwriting, z shadow.

const LETTER: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '...........Oo...........',
      '..........OGGo..........',
      '.........OGGGGo.........',
      '......OOOOOOOOOOOo......',
      '......Owwwwwwwwwwo......',
      '.....OOwddddddddwoo.....',
      '....OGOwwwwwwwwwwoGo....',
      '...OGGOwdddddddwwoGGo...',
      '..OGGGOwwwwwwwwwwoGGGo..',
      '.OGGGGOwddddddddwoGGGGo.',
      '.OwGGGOwwwwwwwwwwoGGGwo.',
      '.OwwwGOwdddddwwwwoGwwgo.',
      '.OwwwwwGwwwwwwwwGwwwwgo.',
      '.OwwwwwwwGwwwwGwwwwwwgo.',
      '.OwwwwwwwwwGGwwwwwwwwgo.',
      '.Owwwwwwwwwwwwwwwwwwwgo.',
      '.Owwwwwwwwwwwwwwwwwwwgo.',
      '.Owwwwwwwwwwwwwwwwwwggo.',
      '.Oggggggggggggggggggggo.',
      '.oooooooooooooooooooooo.',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21, rx: 11, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    G: 'concrete',
    d: 'denim',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Package: a brown paper parcel tied with string in a cross and a bow, a red
// stamp and an address label on the front.
// E lit outline, P shade outline, s top, u front edge, t paper, e paper shade,
// w string and label, g string shade, c address lines, r stamp, z shadow.

const PACKAGE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '..EEEEEEEEEEEEEEEEEEP...',
      '..EssswwssswssswwsssP...',
      '..EssswwwsswsswwwsssP...',
      '..EsssswwwwwwwwwssssP...',
      '..EssswwwsswsswwwsssP...',
      '..EuuuuuuwuwuwuuuuuuP...',
      '..EttttttttwttttttteP...',
      '..EttttttttwtttrrrteP...',
      '..EttttttttwtttrrrteP...',
      '..EttttttttwttttttteP...',
      '..EwwwwwwwwwwwwwwwwgP...',
      '..EttttttttwttttttteP...',
      '..EtwwwwwwtwttttttteP...',
      '..EtwccccwtwttttttteP...',
      '..EtwcccwwtwttttttteP...',
      '..EtwwwwwwtwttttttteP...',
      '..EeeeeeeeeweeeeeeeeP...',
      '..PPPPPPPPPPPPPPPPPPP...',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 11.5, cy: 20.8, rx: 10.5, ry: 1.8, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    s: 'skin',
    u: 'amber',
    t: 'tan',
    e: 'ember',
    w: 'paper',
    g: 'fog',
    c: 'concrete',
    r: 'red',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Stamp: one large postage stamp with a perforated edge, a red tulip on teal
// and a value bar below the picture.
// O lit outline and teeth, o shade outline and teeth, w paper, T picture ground,
// n petal light, r petal, R petal shade, l leaf, C value bar, z shadow.

const STAMP: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.....O.O.O.O.O.O.O......',
      '....OwOwOwOwOwOwOwO.....',
      '...Owwwwwwwwwwwwwwwo....',
      '....OwTTTTTTTTTTTwo.....',
      '...OwwTTTnTrTrTTTwwo....',
      '....OwTTTnrrrRTTTwo.....',
      '...OwwTTTnrrrRTTTwwo....',
      '....OwTTTTrrRTTTTwo.....',
      '...OwwTTTTTlTTTTTwwo....',
      '....OwTTlTTlTTlTTwo.....',
      '...OwwTTllTlTllTTwwo....',
      '....OwTTTlllllTTTwo.....',
      '...OwwTTTTTlTTTTTwwo....',
      '....Owwwwwwwwwwwwwo.....',
      '...OwwwCCCCCCwwrrwwo....',
      '....Owwwwwwwwwwwwwo.....',
      '...Owwwwwwwwwwwwwwwo....',
      '....owowowowowowowo.....',
      '.....o.o.o.o.o.o.o......',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 11.5, cy: 20.4, rx: 9, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'concrete',
    o: 'stone',
    w: 'paper',
    T: 'teal',
    n: 'neon',
    r: 'red',
    R: 'maroon',
    l: 'leaf',
    C: 'concrete',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// City: a skyline of five tall buildings at night with lit windows, a moon and
// an antenna on the tallest tower.
// a, b, c, d, e building walls, A, B, C, D, E their roofs and lit edges,
// h lit window and moon, y moon shade, K antenna, n ground, z shadow.

const CITY: PixelSprite = {
  rows: withShadow(
    [
      '................K.......',
      '................K.......',
      '..hh...........DDDD.....',
      '.hhhh..........Dhhd.....',
      '.hhhy.BBBBB....Dddd.....',
      '..yy..Bhbhb....Dhhd.....',
      '......Bbbbb....Dddd.....',
      '......Bhbbb....Dhhd.....',
      '......BbbbbCCCCdddd.....',
      '......Bhbhbchccdhhd.....',
      '.AAAAAbbbbbccccdddd.....',
      '.AhahabhbhbcchcdhhdEEEE.',
      '.Aaaaabbbbbccccddddeeee.',
      '.Aaahabhbhbchccdhhdehhe.',
      '.Aaaaabbbbbccccddddeeee.',
      '.Ahahabbbhbcchcdhhdeeee.',
      '.Aaaaabbbbbccccddddeeee.',
      '.Ahahabhbhbchccddddehhe.',
      '.Aaaaabbbbbccccddddeeee.',
      '.Aaaaabbbbbccccddddeeee.',
      '.nnnnnnnnnnnnnnnnnnnnnn.',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21, rx: 11.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    a: 'violet',
    A: 'mauve',
    b: 'denim',
    B: 'sky',
    c: 'stone',
    C: 'fog',
    d: 'dusk',
    D: 'sky',
    e: 'teal',
    E: 'cyan',
    h: 'honey',
    y: 'lamp',
    K: 'concrete',
    n: 'night',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Notice: a yellow delivery slip taped up by its top edge, a bold red "!" and
// two lines of print.
// E lit outline, P shade outline, T tape, h paper light, y paper, a paper shade,
// r exclamation mark, e print, z shadow.

const NOTICE: PixelSprite = {
  rows: withShadow(
    [
      '.........TTTTTT.........',
      '....EEEEETTTTTTEEEEP....',
      '....EhyyyTTTTTTyyyaP....',
      '....EhyyyyyyyyyyyyaP....',
      '....EhyyyyrrrryyyyaP....',
      '....EhyyyyrrrryyyyaP....',
      '....EhyyyyrrrryyyyaP....',
      '....EhyyyyrrrryyyyaP....',
      '....EhyyyyrrrryyyyaP....',
      '....EhyyyyyrryyyyyaP....',
      '....EhyyyyyrryyyyyaP....',
      '....EhyyyyyrryyyyyaP....',
      '....EhyyyyyyyyyyyyaP....',
      '....EhyyyyyrryyyyyaP....',
      '....EhyyyyyrryyyyyaP....',
      '....EhyyyyyyyyyyyyaP....',
      '....EhyeeeeeeeeeeyaP....',
      '....EhyyyyyyyyyyyyaP....',
      '....EhyeeeeeeeyyyaaP....',
      '....EaaaaaaaaaaaaaaP....',
      '....PPPPPPPPPPPPPPPP....',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.2, rx: 9.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    E: 'amber',
    P: 'ember',
    T: 'fog',
    h: 'honey',
    y: 'lamp',
    a: 'amber',
    r: 'red',
    e: 'ember',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Delivery: a delivery van seen from the side, a green cab and stripe and a
// parcel emblem on its white cargo box.
// O lit outline, o shade outline and chassis, w cargo box, g box shade,
// E emblem lit outline, P emblem shade outline, t parcel, L cab lit outline,
// l cab and stripe, D cab shade, M cab shade outline, k window, y headlight,
// K tyre, f hub, z shadow.

const DELIVERY: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '.OOOOOOOOOOOOOOo........',
      '.Owwwwwwwwwwwwgo........',
      '.Owwwwwwwwwwwwgo........',
      '.OwwEEEEEEEwwwgo........',
      '.OwwEttwttPwwwgoLLLLL...',
      '.OwwEttwttPwwwgoLkkkM...',
      '.OwwEwwwwwPwwwgoLkkkkM..',
      '.OwwEttwttPwwwgoLkkkkM..',
      '.OwwPPPPPPPwwwgoLlllllM.',
      '.OwwwwwwwwwwwwgoLlllllM.',
      '.OllllllllllllDoLllllyM.',
      '.OwwwwwwwwwwwwgoLlllllM.',
      '.OwwKKKwwwwwwwgoLKKKDDM.',
      '.ooKKKKKooooooooKKKKKoo.',
      '...KKfKK........KKfKK...',
      '...KKKKK........KKKKK...',
      '....KKK..........KKK....',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 19.6, rx: 11.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    E: 'ember',
    P: 'plum',
    t: 'tan',
    L: 'leaf',
    l: 'leaf',
    D: 'moss',
    M: 'moss',
    k: 'sky',
    y: 'honey',
    K: 'slate',
    f: 'fog',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Office: one pale office block with rows of blue windows, a glass door under
// a canopy and a machine room on the roof.
// O lit outline, o shade outline, S roof and step slabs, w wall light, g wall,
// c wall shade, x glass glint, k glass, d glass shade, D canopy, N door frame,
// z shadow.

const OFFICE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '......OOOOOo............',
      '......Ogggco............',
      '..OOOOOOOOOOOOOOOOOOOo..',
      '..OSSSSSSSSSSSSSSSSSSo..',
      '...Owggggggggggggggco...',
      '...Owxkkkgxkkkgxkkkco...',
      '...Owkkkdgkkkdgkkkdco...',
      '...Owggggggggggggggco...',
      '...Owxkkkgxkkkgxkkkco...',
      '...Owkkkdgkkkdgkkkdco...',
      '...Owggggggggggggggco...',
      '...Owxkkkgxkkkgxkkkco...',
      '...Owkkkdgkkkdgkkkdco...',
      '...Owggggggggggggggco...',
      '...OwgggDDDDDDDDgggco...',
      '...OwxkkgNxkkkNgxkkco...',
      '...OwkkdgNkkkkNgkkdco...',
      '...OwggggNkkkdNggggco...',
      '...OwggggNkkddNggggco...',
      '..OSSSSSSSSSSSSSSSSSSo..',
      '..oooooooooooooooooooo..',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.8, rx: 11.5, ry: 1.5, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    S: 'concrete',
    w: 'paper',
    g: 'fog',
    c: 'concrete',
    x: 'cyan',
    k: 'sky',
    d: 'denim',
    D: 'denim',
    N: 'slate',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Desk: a wooden office desk with a drawer unit, a computer screen and a small
// green desk lamp on top.
// E lit outline, P shade outline, h wood light, a wood, e wood shade, f drawer
// handle, N screen frame, x screen glint, k screen, d screen shade, S stand,
// l lamp shade, L lamp rim, y bulb, z shadow.

const DESK: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '..NNNNNNNNNNNN..........',
      '..NxxkkkkkkkkN..........',
      '..NxkkkkkkkkkN...lll....',
      '..NkkkkkkkkkkN..lllll...',
      '..NkkkkkkkkkkN.LLLLLLL..',
      '..NkkkkkkkkkdN...yyy....',
      '..NkkkkkkkkddN....S.....',
      '..NNNNNNNNNNNN....S.....',
      '.......SS.........S.....',
      '.....SSSSSS.....SSSSS...',
      '.EEEEEEEEEEEEEEEEEEEEEP.',
      '.EhhhhhhhhaaaaaaaaaaaaP.',
      '.EeeeeeeeeeeeeeeeeeeeeP.',
      '..EaPeeeeeeeEaaaffaaaP..',
      '..EaPeeeeeeeEeeeeeeeeP..',
      '..EaPeeeeeeeEaaaffaaaP..',
      '..EaP.......EeeeeeeeeP..',
      '..EaP.......EaaaaaaaaP..',
      '..EaP.......EaaaffaaaP..',
      '..EaP.......EaaaaaaaaP..',
      '..PPP.......PPPPPPPPPP..',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.8, rx: 11.5, ry: 1.5, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    h: 'lamp',
    a: 'amber',
    e: 'ember',
    f: 'fog',
    N: 'slate',
    x: 'cyan',
    k: 'sky',
    d: 'denim',
    S: 'stone',
    l: 'leaf',
    L: 'moss',
    y: 'honey',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Counter: a service counter seen from the customer side, a brass bell on its
// top and a green sign with an envelope hanging above it.
// E lit outline, P shade outline, h top light, a wood, e wood shade, S chain,
// L sign lit outline, M sign shade outline, l sign, w envelope, T envelope flap,
// B bell button and base, H bell light, y bell, z shadow.

const COUNTER: PixelSprite = {
  rows: withShadow(
    [
      '.......S........S.......',
      '....LLLLLLLLLLLLLLLM....',
      '....LllllllllllllllM....',
      '....LlllwTwwwwTwlllM....',
      '....LlllwwTwwTwwlllM....',
      '....LlllwwwTTwwwlllM....',
      '....LlllwwwwwwwwlllM....',
      '....LllllllllllllllM....',
      '....MMMMMMMMMMMMMMMM....',
      '...........BB...........',
      '.........EHHyaP.........',
      '........EHyyyyaP........',
      '.......BBBBBBBBBP.......',
      'EEEEEEEEEEEEEEEEEEEEEEEP',
      'EhhhhhhhhhhhhaaaaaaaaaaP',
      '.PeeeeeeeeeeeeeeeeeeeeP.',
      '..EaaaaaaaaaaaaaaaaaaP..',
      '..EaeeeeeeeaaeeeeeeeaP..',
      '..EaeaaaaaeaaeaaaaaeaP..',
      '..EaeaaaaaeaaeaaaaaeaP..',
      '..EaeeeeeeeaaeeeeeeeaP..',
      '..PPPPPPPPPPPPPPPPPPPP..',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.8, rx: 11.5, ry: 1.5, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    h: 'lamp',
    a: 'amber',
    e: 'ember',
    S: 'concrete',
    L: 'moss',
    M: 'night',
    l: 'leaf',
    w: 'paper',
    T: 'moss',
    B: 'ember',
    H: 'honey',
    y: 'lamp',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Toy: a sitting teddy bear with a red bow tie beside two stacked blocks.
// E lit outline, P shade outline, t fur, s muzzle, belly and pads, e fur shade,
// K eyes, nose and mouth, n bow knot and block light, r bow and block,
// R block lit outline, M block shade outline, m block shade, h block mark,
// T top block outline, x top block glint, k top block, D top block shade outline,
// z shadow.

const TOY: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '..EEE.....EEP...........',
      '.EtstEEEEEtseP..........',
      '.EtttttttttteP..........',
      '.EtttttttttteP..........',
      '.EttKtttttKteP..........',
      '.EttKtssstKteP..........',
      '.EtttsKKKstteP...TTTTD..',
      '.EtttssKsstteP...TxkkD..',
      '..EttsKsKsteP....TkkkD..',
      '...EEtsssteP.....TkkkD..',
      '..EttrrnrrtteP...TkttD..',
      '.EttttssstttteP..DDDDD..',
      '.EtttsssssttteP.RRRRRRM.',
      '..EttssssstteP..RnnrrrM.',
      '..EttssssstteP..RnrrrrM.',
      '.EtttsssssttteP.RrrhrrM.',
      '.EsstttttttsseP.RrrrrrM.',
      '.EsstttttttsseP.RrrrrmM.',
      '.PPPPPPPPPPPPPP.MMMMMMM.',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20, rx: 11.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    t: 'tan',
    s: 'skin',
    e: 'ember',
    K: 'ink',
    n: 'neon',
    r: 'red',
    R: 'maroon',
    M: 'plum',
    m: 'maroon',
    h: 'honey',
    T: 'teal',
    x: 'paper',
    k: 'cyan',
    D: 'deep',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Scale: a teal parcel scale, a steel platform on top and a round white dial
// with a red needle on the front.
// O lit outline, o shade outline, w steel and dial light, g steel and dial shade,
// c steel shade, B body lit outline, N body shade outline, k body light, t body,
// d body shade, K ticks and hub, r needle, z shadow.

const SCALE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '..OOOOOOOOOOOOOOOOOOOo..',
      '..Owwwggggggggggggggco..',
      '..oooooooooooooooooooo..',
      '.........Ogccco.........',
      '.....BBBBBBBBBBBBBB.....',
      '....BkkkkkkkkkkkkttN....',
      '....BtttttttttttttdN....',
      '...BttttttOOOOtttttdN...',
      '...BttttOwwKKwwotttdN...',
      '...BttttOwwwwwrotttdN...',
      '...BtttOKwwwwrwKottdN...',
      '...BtttOwwwKrwwwottdN...',
      '...BtttOwwwKKwwgottdN...',
      '...BtttOwwwwwwggottdN...',
      '...BttttOwwwgggotttdN...',
      '...BttttoggggggotttdN...',
      '..BtttttttoooottttttdN..',
      '..BddddddddddddddddddN..',
      '..NNNNNNNNNNNNNNNNNNNN..',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.8, rx: 11.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    c: 'concrete',
    B: 'teal',
    N: 'deep',
    k: 'cyan',
    t: 'teal',
    d: 'indigo',
    K: 'ink',
    r: 'red',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Kilogram: a dark iron weight with a ring handle, marked "kg".
// O lit outline, N shade outline, c iron light, s iron, n iron shade, w letters,
// z shadow.

const KILOGRAM: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.........OOOOOO.........',
      '........OccccccN........',
      '........Oc....sN........',
      '........Oc....sN........',
      '........Oc....sN........',
      '......OOOcOOOOsOOO......',
      '......OcccccccccsN......',
      '......OcssssssssnN......',
      '......OcssssssssnN......',
      '......OcwsssssssnN......',
      '.....OcswssssssssnN.....',
      '.....OcswswsswwwsnN.....',
      '.....OcswwssswswsnN.....',
      '.....OcswswsswwwsnN.....',
      '....OcssssssssswssnN....',
      '....OcssssssswwsssnN....',
      '....OcssssssssssssnN....',
      '...OcssssssssssssssnN...',
      '...OnnnnnnnnnnnnnnnnN...',
      '...NNNNNNNNNNNNNNNNNN...',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.8, rx: 10.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'concrete',
    N: 'night',
    c: 'stone',
    s: 'slate',
    n: 'night',
    w: 'paper',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Tape: a roll of brown packing tape standing on its edge, a cardboard core
// and a loose end pulled out along the ground.
// E lit outline, P shade outline, s side light, t wound side, e shade,
// h gloss, a tape face, w core light, g core shade, G inner wall, z shadow.

const TAPE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '.......EEEEEEEEE........',
      '.....EEssssstthhaP......',
      '....EsssstttttthaaP.....',
      '...EsstwwwwwtttthaaP....',
      '...EstwGGG..wtttaaaP....',
      '..EstwGGG....gtttaaaP...',
      '..EstwGGG....gtttaaaP...',
      '..EstwGGG....gtttaaeP...',
      '..EttwGGG....gtteaeeP...',
      '..EttwGGG....gteeeeeP...',
      '...EttgGGG..gteeeeeP....',
      '...PtttgggggteeeeeeP....',
      '....PttttttteeeeeeEEEEE.',
      '.....PPttttteeeeeahhaaP.',
      '.......PPPPPPPPPaaaaaeP.',
      '................PPPPPP..',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 19.6, rx: 11, ry: 1.7, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    s: 'skin',
    t: 'tan',
    e: 'ember',
    h: 'honey',
    a: 'amber',
    w: 'paper',
    g: 'fog',
    G: 'concrete',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Envelope: one closed, empty envelope seen from the back, the V of its flap
// and the two lower folds showing.
// O lit outline, o shade outline, w paper, g fold and paper shade, G flap edge,
// z shadow.

const ENVELOPE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '.OOOOOOOOOOOOOOOOOOOOOo.',
      '.OGwwwwwwwwwwwwwwwwwwGo.',
      '.OwGGwwwwwwwwwwwwwwGGgo.',
      '.OwwwGwwwwwwwwwwwwGwwgo.',
      '.OwwwwGGwwwwwwwwGGwwwgo.',
      '.OwwwwwwGwwwwwwGwwwwwgo.',
      '.OwwwwwwwGGwwGGwwwwwwgo.',
      '.OwwwwwwggGGGGggwwwwwgo.',
      '.Owwwwwggwwwwwwggwwwwgo.',
      '.Owwwwggwwwwwwwwggwwwgo.',
      '.Owwwggwwwwwwwwwwggwwgo.',
      '.Owwggwwwwwwwwwwwwggwgo.',
      '.Owggwwwwwwwwwwwwwwgggo.',
      '.Oggwwwwwwwwwwwwwwwwggo.',
      '.Oggggggggggggggggggggo.',
      '.oooooooooooooooooooooo.',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20, rx: 11.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    G: 'concrete',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Postcard: a picture postcard, a small landscape on the left half, address
// lines and a red stamp on the right.
// O lit outline, o shade outline, w card, g card shade, G dividing line,
// k sky, h sun, l hills, L field, r stamp, n stamp mark, C address lines, z shadow.

const POSTCARD: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '.OOOOOOOOOOOOOOOOOOOOOo.',
      '.Owwwwwwwwwwwwwwwwwwwwo.',
      '.OwkkkkkkkkkwGwwwwrrrwo.',
      '.OwkkkkkhhkkwGwwwwrnrwo.',
      '.OwkkkkkhhkkwGwwwwrrrwo.',
      '.OwkkkkkkkkkwGwwwwwwwwo.',
      '.OwkklkkkkkkwGwCCCCCCwo.',
      '.OwklllkkllkwGwwwwwwwwo.',
      '.OwlllllllllwGwCCCCCCwo.',
      '.OwLLLLLLLLLwGwwwwwwwwo.',
      '.OwLLLLLLLLLwGwCCCCwwwo.',
      '.Owwwwwwwwwwwwwwwwwwwgo.',
      '.Oggggggggggggggggggggo.',
      '.oooooooooooooooooooooo.',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 19, rx: 11.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    G: 'fog',
    k: 'sky',
    h: 'honey',
    l: 'leaf',
    L: 'moss',
    r: 'red',
    n: 'neon',
    C: 'concrete',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Sticker: a yellow smiley sticker on its backing sheet, the lower right edge
// peeling up to show the white underside.
// O lit outline, o shade outline, w backing and underside, g backing shade,
// underside shade and the shadow of the flap, E sticker lit outline, P sticker
// shade outline and flap edge, h sticker light, y sticker, a sticker shade,
// K face, z shadow.

const STICKER: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.OOOOOOOOOOOOOOOOOOOOOo.',
      '.Owwwwwwwwwwwwwwwwwwwgo.',
      '.OwwwwwwwEEEEEEwwwwwwgo.',
      '.OwwwwwEEhhhhhhEPwwwwgo.',
      '.OwwwwEhhhyyyyyyyPwwwgo.',
      '.OwwwEhhyyyyyyyyyyPwwgo.',
      '.OwwwEhyyyyyyyyyyyPwwgo.',
      '.OwwEhyyKKyyyyKKyyyPwgo.',
      '.OwwEhyyKKyyyyKKyyyPwgo.',
      '.OwwEhyyKKyyyyKKyyyPwgo.',
      '.OwwEyyyyyyyyyyyaPPPwgo.',
      '.OwwEyyKyyyyyyaPwwwPwgo.',
      '.OwwEyyyKKyyyaPwwgPggwo.',
      '.OwwwEyyyyKKaPwwgPgggwo.',
      '.OwwwEyyyyyyaPwgPgggwwo.',
      '.OwwwwEayyyaPwgPgggwwwo.',
      '.OwwwwwPPaaaPgPgggwwwwo.',
      '.OwwwwwwwPPPPPgggwwwwgo.',
      '.Oggggggggggggggggggggo.',
      '.oooooooooooooooooooooo.',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21, rx: 11.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    E: 'amber',
    P: 'ember',
    h: 'honey',
    y: 'lamp',
    a: 'amber',
    K: 'ink',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Scissors: open scissors, two steel blades crossed at a screw, red plastic
// handles with finger rings.
// O lit outline, o shade outline, w blade light, g blade, K screw,
// R handle lit outline, M handle shade outline, n handle light, r handle,
// z shadow.

const SCISSORS: PixelSprite = {
  rows: withShadow(
    [
      '...Ogo............Ogo...',
      '...Oggo..........Oggo...',
      '....Owggo......Ogggo....',
      '....Owggo......Ogggo....',
      '.....Owggo....Ogggo.....',
      '......Ogggo..Ogggo......',
      '......Ogggo..Ogggo......',
      '.......OgggoOgggo.......',
      '........OggOgggo........',
      '.........OgKKgo.........',
      '.........OgKKgo.........',
      '........RrrMRrrM........',
      '.......RrrM..RrrM.......',
      '....RRRRRrM..RrRRRRM....',
      '...RnnrrrrM..RRnnrrrM...',
      '..RnrrrrrrM..RnrrrrrrM..',
      '..Rrr...rrM..Rrr...rrM..',
      '..Rrr...rrM..Rrr...rrM..',
      '..Rrr...rrM..Rrr...rrM..',
      '..RrrrrrrrM..RrrrrrrrM..',
      '...MrrrrrM....MrrrrrM...',
      '....MMMMM......MMMMM....',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 22.2, rx: 10, ry: 1.4, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    K: 'ink',
    R: 'maroon',
    M: 'plum',
    n: 'neon',
    r: 'red',
    z: 'fog',
  },
};

export const POST_OFFICE_ITEMS: Readonly<Record<string, PixelSprite>> = {
  mail: MAIL,
  letter: LETTER,
  package: PACKAGE,
  stamp: STAMP,
  city: CITY,
  notice: NOTICE,
  delivery: DELIVERY,
  office: OFFICE,
  desk: DESK,
  counter: COUNTER,
  toy: TOY,
  scale: SCALE,
  kilogram: KILOGRAM,
  tape: TAPE,
  envelope: ENVELOPE,
  postcard: POSTCARD,
  sticker: STICKER,
  scissors: SCISSORS,
};
