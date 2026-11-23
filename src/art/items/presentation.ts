/** Item icons for the presentation unit (the meeting room). */
import type { PixelSprite } from '../../game/sprites';
import { withShadow } from './draw';

// ---------------------------------------------------------------------------
// Anxious: a round worried face, its forehead gone blue, brows raised in the
// middle, wide eyes, a small open mouth and a big sweat drop at the temple.

const ANXIOUS: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '..........DDDD......T...',
      '.......DDDbbbbDDD..TcT..',
      '......wwbbbbbbbbbDTcccT.',
      '.....wbybybybybybyTwccT.',
      '....EbyyybyyybyyybTcccT.',
      '...EyyybyyybyyybyyyTTT..',
      '...EyyyyyyyyyyyyyyyaP...',
      '..EyyyykkyyyyyykkyyaaP..',
      '..EyykkyyyyyyyyyykkaaP..',
      '..EyyyywkyyyyyywkyyaaP..',
      '..EyyyykkyyyyyykkyyaaP..',
      '..EyyyykkyyyyyykkyaaaP..',
      '..EyyyyyyyyyyyyyyaaaaP..',
      '..EyyyyyyyyyyyyyyaaaaP..',
      '...EyyyyyykkkkyyaaaaP...',
      '...EyyyyykmmmmkaaaaaP...',
      '....EyyyykmmmmkaaaaP....',
      '.....PaaaakkkkaaaaP.....',
      '......PaaaaaaaaaaP......',
      '.......PPPaaaaPPP.......',
      '..........PPPP..........',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.8, rx: 9, ry: 1.6, key: 'z' },
  ),
  legend: {
    b: 'sky',
    y: 'honey',
    a: 'lamp',
    D: 'denim',
    E: 'ember',
    P: 'plum',
    w: 'paper',
    k: 'ink',
    m: 'maroon',
    T: 'teal',
    c: 'cyan',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Presenter: a man in a red jacket behind a wooden lectern, speaking into its
// gooseneck microphone, one hand raised as he talks.

const PRESENTER: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.......nnnnnn......ss...',
      '......nHJJHHHn....ssss..',
      '.....nHJHHHHHHn..sssst..',
      '.....nHssssssHn..sssst..',
      '.....nsskssksstn..sst...',
      '.....nsssssssstn.wwww...',
      '.....nssssmmsttn.ORRo...',
      '......nsssssGG..ORRo....',
      '........tsst.g.ORRo.....',
      '...ORRRRwwwwRRgRRo......',
      '..ORRRRRwDDwRRgRRo......',
      '..ORRRRRRDDRRRgRRRo.....',
      '.EWWWWWWWWWWWWWWWWWWE...',
      '.EaaaaaaaaaaaaaaaaaaP...',
      '..EyAAAAAAAAAAAAAeeP....',
      '..EyAeeeeeeeeeeyAeeP....',
      '..EyAeAAAAAAAAAyAeeP....',
      '..EyAeAAAAAAAAAyAeeP....',
      '..EyAeyyyyyyyyyyAeeP....',
      '.EyyAAAAAAAAAAAAAeeeP...',
      '.PPPPPPPPPPPPPPPPPPPP...',
      '........................',
      '........................',
    ],
    { cx: 11, cy: 22, rx: 11, ry: 1.4, key: 'z' },
  ),
  legend: {
    n: 'plum',
    H: 'ember',
    J: 'amber',
    s: 'skin',
    t: 'tan',
    k: 'ink',
    m: 'maroon',
    w: 'paper',
    O: 'neon',
    o: 'maroon',
    R: 'red',
    D: 'denim',
    E: 'ember',
    P: 'plum',
    W: 'honey',
    a: 'amber',
    A: 'amber',
    y: 'honey',
    e: 'ember',
    G: 'ink',
    g: 'slate',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Chart: a pie chart with some thickness, a big red slice, an orange one and a
// blue slice pulled out to the upper right.

const CHART: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '...........DDDD.........',
      '...........DBBBDDD......',
      '........MM.DBBBBssI.....',
      '.....MMMRM.DBBBBBBBI....',
      '....MRRRRM.DBBBBBBBBI...',
      '...MRRnnRM.IBBBBBBBBI...',
      '..MRRnRRRM.IBBBBBBbbI...',
      '..MRRRRRRRMIbbbbbIIII...',
      '.MRRRRRRRRM.IIIIIPPPP...',
      '.MRRRRRRRRQPPPPPPYYYP...',
      '.MRRRRRRRRQPYYYYhYYYP...',
      '.QRRRRRRRRRQPYYhYYYYP...',
      '.QRRRRRRRRRQPYYYYYYYP...',
      '.QrRRRRRRRRQPYYYYYYyP...',
      '..QrRRRRRRRQPYYYYYyP....',
      '..QrrRRRRRRRQPYYYyyP....',
      '...QrrrrRRRRQPyyyyP.....',
      '....QrrrrrrQPyyyyP......',
      '.....QQQrrrrQPPPP.......',
      '........QQQQQP..........',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 11.5, cy: 21, rx: 10.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    B: 'sky',
    b: 'denim',
    D: 'denim',
    I: 'indigo',
    s: 'paper',
    Y: 'lamp',
    y: 'amber',
    P: 'ember',
    h: 'honey',
    R: 'red',
    r: 'maroon',
    M: 'maroon',
    Q: 'plum',
    n: 'neon',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Curve: one thick smooth cyan line that comes in low, loops over itself and
// goes out low on the other side.

const CURVE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '.........OOOOOO.........',
      '........OccccccO........',
      '.......OcccOOcccO.......',
      '.......OccO..OccO.......',
      '.......OcO....OcO.......',
      '......OccO...OccO.......',
      '.......OccO..Occo.......',
      '.......OcccOOccTo.......',
      '........OcccOTTo........',
      '.........Occcoo.........',
      '.........OOTcco.........',
      '.......OOccoTccoo.......',
      '.....OOccTTooTTTcoo.....',
      'OOOOOcccToo..oooTccooooo',
      'OccccccOo......ooTTTccco',
      'OcccOOO..........oooTTTo',
      'OOOO................oooo',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.4, rx: 11.5, ry: 1.5, key: 'z' },
  ),
  legend: {
    c: 'cyan',
    T: 'teal',
    O: 'teal',
    o: 'moss',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Factory: a long grey factory with a teal roof, two smoking stacks with red
// bands, rows of lit windows and a big roller door.

const FACTORY: PixelSprite = {
  rows: withShadow(
    [
      '..ww...........ww.......',
      '.wwwww........wwwww.....',
      '.gwwwwg.......gwwwwg....',
      '...gg...........gg......',
      '...OSSso.......OSSso....',
      '...ORRro.......ORRro....',
      '...OSSso.......OSSso....',
      '...OSSso.......OSSso....',
      '...ORRro.......ORRro....',
      '...OSSso.......OSSso....',
      '...OSSso.......OSSso....',
      '.OTTTTTTTTTTTTTTTTTTTTo.',
      '.OtttttttttttttttttttMo.',
      '.OFFFFFFFFFFFFFFFFFFFGo.',
      '.OFYYFFYYFFYYFFYYFFYYGo.',
      '.OFyyFFyyFFyyFFyyFFyyGo.',
      '.OFFFFFFFFFFFFFFFFFFFGo.',
      '.OFDDDDDDFFFFFFFFFFFFGo.',
      '.OFDddddDFFYYFFYYFFYYGo.',
      '.OFDDDDDDFFyyFFyyFFyyGo.',
      '.OFDddddDFFFFFFFFFFFFGo.',
      '.oooooooooooooooooooooo.',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.8, rx: 11.5, ry: 1.4, key: 'z' },
  ),
  legend: {
    w: 'paper',
    g: 'fog',
    O: 'stone',
    o: 'slate',
    S: 'concrete',
    s: 'stone',
    R: 'red',
    r: 'maroon',
    T: 'teal',
    t: 'moss',
    M: 'moss',
    F: 'fog',
    G: 'concrete',
    Y: 'honey',
    y: 'lamp',
    D: 'stone',
    d: 'slate',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Graphic: an artist's wooden paint palette with a thumb hole and five dabs of
// paint, a red-handled brush lying across it.

const GRAPHIC: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........EEEEEEEE........',
      '......EEWWWbbWWWEP......',
      '....EEWWWWsbbbWWWWPP....',
      '...EWWrrWWbbbbWWllWAP...',
      '...EWnrrrWWbbWWLlllAP...',
      '..EWWrrrrWWWWWWllllAAP..',
      '..EWWWrrWWWWwwWWllWAAP..',
      '..EWWWWWWWWwwwwWWWWAAP..',
      '..EEWWWWWWWwwwwWWvvAAP..',
      '....EWWWWWkkwwWWVvvvAP..',
      '.....EEEWkkkcWWWvvvvAP..',
      '........PWkccWWWWvvAP...',
      '........PWWccHHWAAAAP...',
      '......PPWWWWWHHhhAPP....',
      '......PPWWWWAAAhhHH.....',
      '........PPPPPPPP.HHhh...',
      '...................hhH..',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.6, rx: 11, ry: 1.6, key: 'z' },
  ),
  legend: {
    W: 'honey',
    A: 'lamp',
    E: 'amber',
    P: 'ember',
    r: 'red',
    n: 'neon',
    b: 'denim',
    s: 'sky',
    l: 'leaf',
    L: 'paper',
    v: 'violet',
    V: 'mauve',
    w: 'paper',
    k: 'ink',
    c: 'concrete',
    H: 'red',
    h: 'maroon',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Colorful: a five-colour rainbow standing on two white clouds.

const COLORFUL: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........MMMMMMMM........',
      '......MMrrrrrrrrMM......',
      '.....MrroooooooorrM.....',
      '....MroooyyyyyyooorM....',
      '...MrooyyyyyyyyyyoorM...',
      '..MrooyyyggggggyyyoorM..',
      '..MooyyggggbbggggyyooM..',
      '.MrwwwwggbIIIIbggwwwwrM.',
      '.MowwwwwbI....IbwwwwwoM.',
      '.Cwwwwwwc......cwwwwwwc.',
      'Cwwwwwwwwc....cwwwwwwwwc',
      'Cwwwwwwwwc....cwwwwwwwwc',
      'CfffCccffc....cffcccfffc',
      '.CCC...cc......cc...ccc.',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.3, rx: 11.5, ry: 1.4, key: 'z' },
  ),
  legend: {
    r: 'red',
    o: 'lamp',
    y: 'honey',
    g: 'leaf',
    b: 'sky',
    w: 'paper',
    f: 'fog',
    C: 'fog',
    c: 'concrete',
    M: 'maroon',
    I: 'denim',
    z: 'fog',
  },
};

/** Word pictures of the presentation. */
export const PRESENTATION_ITEMS: Readonly<Record<string, PixelSprite>> = {
  anxious: ANXIOUS,
  presenter: PRESENTER,
  chart: CHART,
  curve: CURVE,
  factory: FACTORY,
  graphic: GRAPHIC,
  colorful: COLORFUL,
};
