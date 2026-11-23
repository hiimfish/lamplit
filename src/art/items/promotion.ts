/** Word pictures of the director's office (promotion). */
import type { PixelSprite } from '../../game/sprites';
import { withShadow } from './draw';

// ---------------------------------------------------------------------------
// Seasonal: one autumn maple leaf, orange turning red, with pale veins and
// a short stem.
// E lit outline, P shade outline, y leaf light, a leaf, r leaf shade,
// v vein, V vein in shade, h glint, S stem, z shadow.

const SEASONAL: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '............E...........',
      '...........EaP..........',
      '...........EvP..........',
      '...E......EavaP......E..',
      '...EP....EhavaaP....EP..',
      '...PyP...EaavaaP...ErP..',
      '....EyEP.EaavaaP.EErP...',
      '.E..PyyaEaaavaaaErrrP..E',
      '.PEP.EvaaaaavaarrrVP.EEP',
      '..PyEyyvaaaaVarrrVrrErP.',
      '...PyvyavaaaVrrrVrrVrP..',
      '....PavvavaaVrrVrVVrP...',
      '.....EaavvvaVrVVVrrP....',
      '....EaaPPavvVVVrPPrrP...',
      '...EaPP..PaaVrrP..PPrP..',
      '...PP.....PaVrP.....PP..',
      '...........PSP..........',
      '............S...........',
      '.............S..........',
      '.............S..........',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.2, rx: 9, ry: 1.6, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'maroon',
    y: 'lamp',
    a: 'amber',
    r: 'red',
    v: 'honey',
    V: 'amber',
    h: 'honey',
    S: 'ember',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Incoming: a white envelope tilted as it flies in from the left, speed
// lines trailing behind it, a red seal on the flap.
// O lit outline, o shade outline, w paper, g paper shade, G flap fold,
// R seal, r seal light, k speed line, z shadow.

const INCOMING: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '...................OOo..',
      '...............OOOOwGo..',
      '...........OOOOwwwwGwo..',
      '.......OOOOwwwwwwwGwwo..',
      'kkkk.OOGwwwwwwwwwGwwwwo.',
      '.....OwwGGwwwwwwGwwwwwo.',
      '.....owwwwGGGwwGwwwwwwo.',
      'kkkkk.OwwwwwwrRwwwwwwwo.',
      '......OwwwwwwRRwwwwwwggo',
      '......Owwwwwwwwwwggggggo',
      '.kkk..owwwwwwgggggggggoo',
      '.......Owgggggggggoooo..',
      '.......Oggggggoooo......',
      '...kkk.Oggoooo..........',
      '.......ooo..............',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 14, cy: 21, rx: 7, ry: 1.4, key: 'z' },
  ),
  legend: {
    O: 'concrete',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    G: 'stone',
    R: 'red',
    r: 'neon',
    k: 'sky',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Chapter: a book lying open at the start of a chapter, a red drop cap and
// heading on the left page, a red ribbon down the fold.
// O lit outline, o shade outline, w page, g page shade, G fold shade,
// f page edges, t text line, R ribbon and drop cap, r drop cap light,
// C cover, c cover shade, D cover fold, z shadow.

const CHAPTER: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '......OOOo....OOOo......',
      '....OOwwwwo..OwwwwOo....',
      '...OwwwwwwwgRwwwwwwwo...',
      '..OwwwwwwwwgRttttttwwo..',
      '..OrRRttttwgrwwwwwwwwo..',
      '..ORRRwwwwwgRtttttttgo..',
      '..ORRRttttwgRwwwwwwggo..',
      '..OwwwwwwwwgRtttttttgo..',
      '..Otttttttwgrwwwwwwggo..',
      '..OwwwwwwwwgRtttttwggo..',
      '..OttttttwwgRwwwwwwggo..',
      '..OfffffffffRfffffffffo.',
      '..OGGGGGGGGgrGGGGGGGGo..',
      '.OCCCCCCCCCCRCCCCCCCCCo.',
      '.oCCCCCCCCCDRCCCCCCCCCo.',
      '..oooooooooDRooooooooo..',
      '............R...........',
      '...........R.R..........',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.6, rx: 11, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'concrete',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    G: 'concrete',
    f: 'paper',
    t: 'stone',
    R: 'red',
    r: 'neon',
    C: 'denim',
    c: 'indigo',
    D: 'indigo',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Milestone: a black and white chequered finish flag waving on a pole
// that stands in a small grassy mound.
// O lit outline, o shade outline, K dark check, w light check,
// g light check in a fold, p pole light, q pole shade, h knob light,
// H knob glint, a knob shade, m grass light, l grass, M grass shade, z shadow.

const MILESTONE: PixelSprite = {
  rows: withShadow(
    [
      '....Hh..................',
      '...hhaa.................',
      '....pqOo.......OOo......',
      '....pqOwOOo..OOKKKOOo...',
      '....pqOwwKKOOwwKKKwwo...',
      '....pqOKwKKKgwwwwwwwo...',
      '....pqOKKggKgKKwwwKKo...',
      '....pqOKKgggKKKwwwKKo...',
      '....pqOwKgggKKKKKKKKo...',
      '....pqOwwKKgKwwKKKwwo...',
      '....pqOwwKKKgwwKKKwwo...',
      '....pqOKwKKKgwwwwwwwo...',
      '....pqOKKggKgKKwwwKKo...',
      '....pqooKgggKKKoooKKo...',
      '....pq..ooogKoo...ooo...',
      '....pq.....oo...........',
      '....pq..................',
      '....pq..................',
      '....pq..................',
      '...mpqmmm...............',
      '.mllpqllll..............',
      'MMMMMMMMMMM.............',
      '........................',
      '........................',
    ],
    { cx: 7, cy: 22, rx: 8, ry: 1.4, key: 'z' },
  ),
  legend: {
    O: 'concrete',
    o: 'slate',
    K: 'ink',
    w: 'paper',
    g: 'fog',
    p: 'fog',
    q: 'concrete',
    h: 'honey',
    H: 'paper',
    a: 'amber',
    m: 'leaf',
    l: 'leaf',
    M: 'moss',
    z: 'fog',
  },
};

export const PROMOTION_ITEMS: Readonly<Record<string, PixelSprite>> = {
  seasonal: SEASONAL,
  incoming: INCOMING,
  chapter: CHAPTER,
  milestone: MILESTONE,
};
