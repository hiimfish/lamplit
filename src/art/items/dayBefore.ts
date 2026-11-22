/** Item icons for the day-before unit. */
import type { PixelSprite } from '../../game/sprites';
import { withShadow } from './draw';

// ---------------------------------------------------------------------------
// Elevator: closed steel doors in a frame, a lit up and down arrow panel above
// and a call button plate at the side.
// O lit outline, o shade outline, n panel, y arrow, k door light, g door, w brush
// highlight, S seam, c door shade, z shadow.

const ELEVATOR: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '..OOOOOOOOOOOOOOOo......',
      '..Onnnnynnnyyynnno......',
      '..OnnnyyynnnynnnnO......',
      '..OOOOOOOOOOOOOOOo......',
      '..OkgwgggSSgggwgco......',
      '..OkgwgggSSgggwgco......',
      '..OkgwgggSSgggwgco......',
      '..OkgwgggSSgggwgco.OOOo.',
      '..OkgwgggSSgggwgco.Oyyo.',
      '..OkgwgggSSgggwgco.Oyyo.',
      '..OkgwgggSSgggwgco.OSSo.',
      '..OkgwgggSSgggwgco.Occo.',
      '..OkgwgggSSgggwgco.Occo.',
      '..OkgwgggSSgggwgco.oooo.',
      '..OkgwgggSSgggwgco......',
      '..OkgwgggSSgggwgco......',
      '..OkgwgggSSgggwgco......',
      '..OkgwgggSSgggwgco......',
      '..OkgwgggSSgggwgco......',
      '..oooooooooooooooo......',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 10, cy: 21.4, rx: 9, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'fog',
    o: 'stone',
    n: 'night',
    y: 'honey',
    k: 'paper',
    g: 'fog',
    w: 'paper',
    S: 'stone',
    c: 'concrete',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Suit: a navy jacket with lapels over a white shirt and a red tie, a matching
// pair of trousers below.
// O lit outline, o shade outline, h jacket light, j jacket, s seam, w shirt,
// r tie, k button, z shadow.

const SUIT: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '......OOOwwwwwwooo......',
      '....OOhhOwwwwwwojjoo....',
      '...OhhhhhOwrrwojjjjjo...',
      '..OhhhhhhOOrroojjjjjjo..',
      '..OhhhhhhhOrrojjjjjjjo..',
      '..OhhhhhhhhOojjjjjjjjo..',
      '.OhhshhhhhhOojjjjjjsjjo.',
      '.OhhshhhhhkOokjjjjjsjjo.',
      '.OhhshwwhhhOojjjjjjsjjo.',
      '.OhhshhhhhhOojjjjjjsjjo.',
      '.OhhshhhhhkOokjjjjjsjjo.',
      '.OhhshhhhhhOojjjjjjsjjo.',
      '.Ohhsooooooooooooooosjjo',
      '.Owwo.Ohhhhhsjjjjo.Owwo.',
      '......OhhhhoOjjjjo......',
      '......OhhhhoOjjjjo......',
      '......OhhhhoOjjjjo......',
      '......OhhhhoOjjjjo......',
      '......OhhhhoOjjjjo......',
      '......oooooooooooo......',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 11.5, cy: 21.2, rx: 9.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'sky',
    o: 'night',
    h: 'denim',
    j: 'indigo',
    s: 'deep',
    w: 'paper',
    r: 'red',
    k: 'sky',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Tie: a red necktie with gold stripes, knotted at the top and hanging straight.
// O lit outline, o shade outline, h light, r tie, m shade, y stripe, z shadow.

const TIE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.........OOOOoo.........',
      '........Ohhrrrmo........',
      '........Ohrrrrmo........',
      '.........Ohrrmo.........',
      '..........Ormo..........',
      '.........Ohrrmo.........',
      '........Ohhrrrmo........',
      '........Ohrrrrmo........',
      '.......Ohyyrrrrmo.......',
      '.......Ohrryyrrmo.......',
      '.......Ohrrrryymo.......',
      '.......Ohyyrrrrmo.......',
      '.......Ohrryyrrmo.......',
      '.......Ohrrrryymo.......',
      '.......Ohyyrrrrmo.......',
      '........Ohrryrmo........',
      '.........Ohrrmo.........',
      '..........Ohmo..........',
      '...........oo...........',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 11.5, cy: 21.6, rx: 5, ry: 1.4, key: 'z' },
  ),
  legend: {
    O: 'rosy',
    o: 'plum',
    h: 'neon',
    r: 'red',
    m: 'maroon',
    y: 'honey',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Sweater: a mauve knitted pullover, ribbed collar, cuffs and hem, a paper and
// gold band across the chest.
// O lit outline, o shade outline, h light, g knit, v shade, R rib light,
// V rib dark, n neck hole, w band, y band dots, z shadow.

const SWEATER: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........OOOOOOOO........',
      '.......OVRVRVRVRo.......',
      '....OOhhOnnnnnnogggoo...',
      '...OhhhhVRVRVRVRggggo...',
      '..Ohhhhhhggggggggvvvvo..',
      '..Ohhhhvhggggggvvggggo..',
      '..Ohhhhvhggggggvvggggo..',
      '..Ohhhhvwwwwwwwwvggggo..',
      '..Ohhhhvgygygygyvggggo..',
      '.Ohhhhv.wwwwwwww.vggggo.',
      '.Ohhhhv.hggggggv.vggggo.',
      'Ohhhhv..hggggggv..vggggo',
      'Ohhhhv..hggggggv..vggggo',
      'Ohhhhv..hggggggv..vggggo',
      'Ohhhhv..hggggggv..vggggo',
      'OVRVRv..VRVRVRVR..vVRVRo',
      'ORVRVv..RVRVRVRV..vRVRVo',
      'oooooo..oooooooo..oooooo',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 11.5, cy: 19.7, rx: 10, ry: 1.5, key: 'z' },
  ),
  legend: {
    O: 'violet',
    o: 'plum',
    h: 'rosy',
    g: 'mauve',
    v: 'violet',
    R: 'rosy',
    V: 'violet',
    n: 'plum',
    w: 'paper',
    y: 'honey',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Husband: a man in a navy jacket in front, larger, and his wife behind him on
// the right; a small gold ring with a gem beside his hand.
// N man's hair, P wife's hair, E hair light, k skin, n eyes, r mouth or tie,
// w shirt, O lit outline, o shade outline, h jacket light, j jacket, s seam,
// q dress, Q dress shade, H ring light, L ring, A ring shade, c gem, z shadow.

const HUSBAND: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '...............PPPPP....',
      '..............PEEEEEP...',
      '..............PEkkkEP...',
      '.......NNNNN..PEnknEP...',
      '......NNNNNNN.PEkkkEP...',
      '......NkkkkkN.PEkrkEP...',
      '......kknknkk..PEkEP....',
      '......kkkkkkk..PPkPP....',
      '......kkkrkkkPqqqqqqqqqP',
      '.......kkkkk.PqqqqqqqqqP',
      '........wkw..PqqqqqqqqqP',
      '..OhhhhwwrwwjjjjoqqqqqqQ',
      '..OhhhhhwrwjjjjjoqqqqqqQ',
      '..OhhhhhhrjjjjjjoqqqqqqQ',
      '..OhhhhhhsjjjjjjoqqqcqqQ',
      '..OhhhhhhsjjjjjjoqqHHLqQ',
      '..OhhhhhhsjjjjjjoqHqqqLQ',
      '..OhhhhhhsjjjjjjoqLqqqAQ',
      '..OhhhhhhsjjjjjjoqqLAAqQ',
      '..oooooooooooooooqqqqqqQ',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.5, rx: 11, ry: 1.5, key: 'z' },
  ),
  legend: {
    N: 'night',
    P: 'plum',
    E: 'ember',
    k: 'skin',
    n: 'ink',
    r: 'red',
    w: 'paper',
    O: 'sky',
    o: 'night',
    h: 'denim',
    j: 'indigo',
    s: 'deep',
    q: 'rosy',
    Q: 'mauve',
    H: 'honey',
    L: 'lamp',
    A: 'amber',
    c: 'cyan',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Traffic: a red sedan, a blue van and a yellow taxi nose to tail on a road.
// A/a sedan outline, r sedan, m shade, B/b van outline, d van, i van shade,
// C/c taxi outline, y taxi, e taxi shade, W window, t pillar, q tail light,
// h headlight, n tyre, f hub, S kerb, s road, l lane mark, T road edge, z shadow.

const TRAFFIC: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '.........BBBBBBb........',
      '..AAAA..BWWtWWWb..CwwC..',
      '.AWWtWa.BddddddB.CWWtWc.',
      'ArrrrrrYqdddddh.CyyyyyyH',
      'qrrmmmraBddiiddbqynynyye',
      'annaannabnnbbnnbcnnccnnc',
      '.nfn.nfn.nfn.nfn.nfn.nfn',
      '.nn..nn..nn..nn..nn..nn.',
      'SSSSSSSSSSSSSSSSSSSSSSSS',
      'ssssssssssssssssssssssss',
      'ssssssssssssssssssssssss',
      'sllllssssllllssssllllsss',
      'ssssssssssssssssssssssss',
      'TTTTTTTTTTTTTTTTTTTTTTTT',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.8, rx: 11, ry: 1.2, key: 'z' },
  ),
  legend: {
    A: 'rosy',
    a: 'maroon',
    r: 'red',
    m: 'maroon',
    B: 'sky',
    b: 'indigo',
    d: 'denim',
    i: 'indigo',
    C: 'honey',
    c: 'amber',
    y: 'lamp',
    e: 'amber',
    W: 'cyan',
    t: 'teal',
    q: 'neon',
    Y: 'honey',
    h: 'honey',
    H: 'honey',
    w: 'paper',
    n: 'night',
    f: 'fog',
    S: 'concrete',
    s: 'slate',
    l: 'honey',
    T: 'night',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Clock: a round wall clock with a red rim, a paper face, hour marks and two
// hands at ten past ten.
// N rim highlight, r rim, M rim shade, w face, g face shade, k marks, K hands.

const CLOCK: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........NNNrrrr.........',
      '......Nrrrrrrrrrr.......',
      '.....Nrrwwwkwwwrrr......',
      '....NrwwwwwkwwwwwrM.....',
      '...NrwwkwwwwwwwkwwMM....',
      '..NrwwwwwwwwwwwwwwwMM...',
      '..NrwwwwwwwwwwwwKwwMM...',
      '.NrwwkwwwwwwwwwKwkwwMM..',
      '.NrwwwwwKwwwwKKwwwwwMM..',
      '.NrwwwwwwKKrKwwwwwwwMM..',
      '.rrkkwwwwwrrwwwwwwkkMM..',
      '.rrwwwwwwwwwwwwwwwwgMM..',
      '.rrwwwwwwwwwwwwwwwwgMM..',
      '.rrwwkwwwwwwwwwwwkwgMM..',
      '..rrwwwwwwwwwwwwwwgMM...',
      '..rrwwwwwwwwwwwwwwgMM...',
      '...rrwwkwwwwwwwkwgMM....',
      '....MMwwwwwkwwwwgMM.....',
      '.....MMMwggkgggMMM......',
      '......MMMMMMMMMMM.......',
      '........MMMMMMM.........',
      '........................',
      '........................',
    ],
    { cx: 11.5, cy: 22.4, rx: 7, ry: 1.2, key: 'z' },
  ),
  legend: {
    N: 'neon',
    r: 'red',
    M: 'maroon',
    w: 'paper',
    g: 'fog',
    k: 'night',
    K: 'ink',
    z: 'fog',
  },
};

export const DAY_BEFORE_ITEMS: Readonly<Record<string, PixelSprite>> = {
  elevator: ELEVATOR,
  suit: SUIT,
  tie: TIE,
  sweater: SWEATER,
  husband: HUSBAND,
  traffic: TRAFFIC,
  clock: CLOCK,
};
