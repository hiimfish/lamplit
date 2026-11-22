/** Item icons for the clothes shop unit. */
import type { PixelSprite } from '../../game/sprites';
import { withShadow } from './draw';

// ---------------------------------------------------------------------------
// Clothes: a yellow T-shirt on a hanger behind a stack of three folded garments
// (red, green, blue), so it reads as "clothes" and not as one shirt.
// S hanger hook, E lit outline, P shade outline, h tee light, y tee, a tee shade,
// n red light, r red, m red shade, l green, L green shade, k blue light, b blue,
// d blue shade, z shadow.

const CLOTHES: PixelSprite = {
  rows: withShadow(
    [
      '........SS..............',
      '.......S..S.............',
      '.........S..............',
      '...EEEEESSEEEEE.........',
      '..EhhhyaaaayyyyP........',
      '.EhhyyyyaayyyyyyP.......',
      'EhyyyyyyyyyyyyyyaP......',
      'EyyyPyyyyyyyyPyyaP......',
      '.PPPEhyyyyyyPPPPPPPPPP..',
      '....EhyyyyyPnnnrrrrrrrP.',
      '....EhyyyyyPrrmmmmmmmmP.',
      '....EhyyyyyPrrrrrrrrmmP.',
      '....EhyyyyyPPPPPPPPPPPP.',
      '....EhyyyyyPllllllllllP.',
      '....PPPPPPPPllLLLLLLLLP.',
      '...........PlllllllLLLP.',
      '...........PPPPPPPPPPPP.',
      '...........PkkkbbbbbbbP.',
      '...........PbbddddddddP.',
      '...........PbbbbbbbbddP.',
      '............PPPPPPPPPP..',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 14, cy: 20.6, rx: 9.5, ry: 1.8, key: 'z' },
  ),
  legend: {
    S: 'stone',
    E: 'ember',
    P: 'plum',
    h: 'honey',
    y: 'lamp',
    a: 'amber',
    n: 'neon',
    r: 'red',
    m: 'maroon',
    l: 'leaf',
    L: 'moss',
    k: 'sky',
    b: 'denim',
    d: 'indigo',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Shirt: a white dress shirt laid flat, pointed collar, a row of blue buttons,
// long sleeves with cuffs.
// O lit outline, o shade outline, w cloth, g crease, G cloth shade and collar edge,
// k button, z shadow.

const SHIRT: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.........OOOOOO.........',
      '........OwwGGwwo........',
      '....OOOOwwwwwwwwOOOo....',
      '...OwwwgwwwGGwwwgwwGo...',
      '..OwwwwgwwGwgGwwgwwwGo..',
      '..OwwwwwGGwwgwGGwwwwGo..',
      '.OwwwwwwwwwkgwwwwwwwwGo.',
      '.OwwwgGwwwwwgwwwGGwwwGo.',
      '.OwwwgGwwwwwgwwwGGwwwGo.',
      'Owwgo.OwwwwkgwwwGo.OwgGo',
      'Owwgo.OwwwwwgwwwGo.OwgGo',
      'Owwgo.OwwwwwgwwwGo.OwgGo',
      'OGGGo.OwwwwkgwwwGo.OGGGo',
      'Owwgo.OwwwwwgwwwGo.OwgGo',
      '.ooo..OwwwwwgwwwGo..ooo.',
      '......OwwwwkgwwwGo......',
      '......OwwwwwgwwwGo......',
      '......OwwwwwgwwgGo......',
      '......OgwwwwgwggGo......',
      '.......oooooooooo.......',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.6, rx: 9, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    G: 'concrete',
    k: 'denim',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Dress: a pink sleeveless dress, shoulder straps, a white belt at the waist
// and a wide flared skirt.
// O lit outline, o shade outline, n cloth, N fold and shade, w highlight and belt,
// g belt shade, z shadow.

const DRESS: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........OO....OO........',
      '........OnO..ONo........',
      '........OnO..ONo........',
      '.......OnnO..ONNo.......',
      '.......OnnnOOnnNo.......',
      '.......OwnnnnnnNo.......',
      '.......OnnnnnnnNo.......',
      '........OnnnnnNo........',
      '........Owwwwwgo........',
      '.......OnnnNnnnNo.......',
      '......OnnnnNnNnnNo......',
      '......OnnnNnnNnnNo......',
      '.....OnnnnNnnnNnnNo.....',
      '.....OnnnNnnnnNnnNo.....',
      '....OnnnnNnnnnNnnNNo....',
      '....OnnnNnnnnnnNnNNo....',
      '...OnnnnNnnnnnnNnnNNo...',
      '...OnnnNnnnnnnnnNnNNo...',
      '..OnnnnNnnnnnnnnNnnNNo..',
      '..oooooooooooooooooooo..',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.6, rx: 11, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'neonDeep',
    o: 'maroon',
    n: 'neon',
    N: 'neonDeep',
    w: 'paper',
    g: 'fog',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Jacket: a teal sports jacket, hip length, a zip down the front, a white and
// cyan chest stripe, ribbed collar, cuffs and hem.
// O lit outline, o shade outline, t cloth, c cloth light and stripe, D seam and
// shade, w stripe, g stripe shade, f zip, F zip shade, r rib light, R rib, z shadow.

const JACKET: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........OOOOOOOo........',
      '.......OrRrRrRrRo.......',
      '....OOOODDDfFDDDOOOo....',
      '...OcccttttfFttttttDo...',
      '..OctttttttfFtttttttDo..',
      '.OwwwwwwwwwfFwwwwwwwwgo.',
      '.OcccccccccfFccccccccDo.',
      '.OctttDttttfFttttDtttDo.',
      '.OctttDttttfFttttDtttDo.',
      '.OttttDttttfFttttDtttDo.',
      '.OttttDtDttfFttDtDtttDo.',
      '.OttttDttDtfFtDttDtttDo.',
      '.OttttDttttfFttttDtttDo.',
      '.OrRrRDttttfFttttDrRrRo.',
      '.OrRrRDttttfFttttDrRrRo.',
      '..ooooOttttfFttttooooo..',
      '......OrRrRfFrRrRo......',
      '......OrRrRfFrRrRo......',
      '.......oooooooooo.......',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 19.6, rx: 10, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'moss',
    o: 'night',
    t: 'teal',
    c: 'cyan',
    D: 'moss',
    w: 'paper',
    g: 'fog',
    f: 'fog',
    F: 'concrete',
    r: 'sky',
    R: 'denim',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Coat: a long wine-red coat down to the knee, wide lapels, gold buttons and a
// dark belt with a buckle.
// O lit outline, o shade outline, r lapel and cloth light, m cloth, p seam and shade,
// N lining, K belt, y button and buckle, z shadow.

const COAT: PixelSprite = {
  rows: withShadow(
    [
      '.........OOOOOO.........',
      '........OrrNNrmo........',
      '.....OOOrrrNNrrmOOo.....',
      '....OrmmrrrNNrrrmmpo....',
      '...OrmmpprrNNrrppmmpo...',
      '...Ormmpmrrrprrmpmmpo...',
      '...Ormmpmmrrprmmpmmpo...',
      '...Ormmpmmympmympmmpo...',
      '...Ormmpmmmmpmmmpmmpo...',
      '...OrmmpKKKyyKKKpmmpo...',
      '...OrmmpKKKyyKKKpmmpo...',
      '...Ormmpmmympmympmmpo...',
      '...Ormmpmmmmpmmmpmmpo...',
      '...Orrrpmmmmpmmmprrpo...',
      '....oooOmmmmpmmmoooo....',
      '.....Ormmmmmpmmmmpo.....',
      '.....Ormmmmmpmmmmpo.....',
      '....Ormmmmmmpmmmmmpo....',
      '....Ormmmmmmpmmmmmpo....',
      '...Ormmmmmmmpmmmmmmpo...',
      '...Ormmmmmmmpmmmmmppo...',
      '...oooooooooooooooooo...',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.6, rx: 10, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'plum',
    o: 'ink',
    r: 'red',
    m: 'maroon',
    p: 'plum',
    N: 'ink',
    K: 'ink',
    y: 'honey',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Hat: a straw sun hat with a wide brim and a red band round the crown.
// E lit outline, P shade outline, h straw light, y straw, a straw shade,
// r band, R band shade, z shadow.

const HAT: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '.........EEEEEE.........',
      '.......EEhhhhhyEP.......',
      '......EhhhhhyyyyaP......',
      '......EhhhyyyyyyaP......',
      '.....EhhyyyyyyyyaaP.....',
      '.....EhyyyyyyyyyaaP.....',
      '.....ErryyyyyyyaRRP.....',
      '..EEEErrrrrrrrrrRRPEEP..',
      '.EhhhhharrrrrrrRayyyyaP.',
      'EhhhhhhhhaaaaaaayyyyyyaP',
      'EhhhhhhhhhhyyyyyyyyyyyaP',
      'EhhhhhyyyyyyyyyyyyyyyaaP',
      '.EyyyyyyyyyyyyyyyyyaaaP.',
      '..PPyyyyyyyyyyyyaaaaPP..',
      '....PPPPaaaaaaaaPPPP....',
      '........PPPPPPPP........',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 18.6, rx: 11, ry: 2, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    h: 'honey',
    y: 'lamp',
    a: 'amber',
    r: 'red',
    R: 'maroon',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Shoe: one green sneaker seen from the side, toe to the right, white laces,
// a white toe cap and a thick white sole.
// O lit outline, o shade outline, l upper, L upper shade, K opening, w lace, cap
// and sole, g sole shade, S sole lit outline, s sole shade outline, z shadow.

const SHOE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '.......OOO..............',
      '..OOOOOlllO.............',
      '.OlllKKlllOO............',
      '.OllllKlllwwOO..........',
      '.OlllllllwwlllOO........',
      '.OllllllllllllwwOO......',
      '.OlllllllllllwwlllOO....',
      '.OllllllllllllllllwwOO..',
      '.OlllllllllllllllwwlllO.',
      '.OlllllllllllllllllLwwwo',
      '.OLLLLLLLLLLLLLLLLLLwggo',
      'SwwwwwwwwwwwwwwwwwwwwwwS',
      'SggggggggggggggggggggggS',
      '.ssssssssssssssssssssss.',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 17.8, rx: 11.5, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'moss',
    o: 'night',
    l: 'leaf',
    L: 'moss',
    K: 'night',
    w: 'paper',
    g: 'fog',
    S: 'stone',
    s: 'slate',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Mirror: a standing mirror in a wooden frame with an arched top and two feet,
// a diagonal shine across the glass.
// E lit outline, P shade outline, h wood light, a wood, e wood shade, s glass,
// w shine, c thin shine, d glass shade, z shadow.

const MIRROR: PixelSprite = {
  rows: withShadow(
    [
      '........EEEEEEEE........',
      '......EEhhhhhhhaEP......',
      '.....EhaasssswwaaeP.....',
      '.....EhasssswwssaeP.....',
      '.....EhassswwsssaeP.....',
      '.....EhasswwssscaeP.....',
      '.....EhaswwssscsaeP.....',
      '.....EhawwssscssaeP.....',
      '.....EhawssscsssaeP.....',
      '.....EhassscssssaeP.....',
      '.....EhasscsssssaeP.....',
      '.....EhascssssssaeP.....',
      '.....EhacsssssssaeP.....',
      '.....EhasssssssdaeP.....',
      '.....EhassssssddaeP.....',
      '.....EhasssssdddaeP.....',
      '.....EhassssddddaeP.....',
      '.....EhasssdddddaeP.....',
      '.....EhaaaaaaaaaaeP.....',
      '....EaPPPPPPPPPPPPaP....',
      '...EaP............EaP...',
      '..EaaP............EaaP..',
      '..PPPP............PPPP..',
      '........................',
    ],
    { cx: 12, cy: 22.4, rx: 10.5, ry: 1.4, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    h: 'honey',
    a: 'amber',
    e: 'ember',
    s: 'sky',
    w: 'paper',
    c: 'cyan',
    d: 'denim',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Skirt: a blue pleated skirt, only the lower half of an outfit: a waistband
// with a button on top, pleats fanning out to a stepped hem.
// O lit outline, o shade outline, k pleat light, b pleat, d fold and waistband
// shade, y button, z shadow.

const SKIRT: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '.......OOOOOOOOOo.......',
      '......Obbbbybbbbdo......',
      '......Oddddddddddo......',
      '.....Okkdbbbdkkdbbo.....',
      '.....Okkdbbbdkkdbbo.....',
      '....Okkkdbbbdkkdbbbo....',
      '....Okkkdbbbdkkdbbbo....',
      '....Okkkdbbbdkkdbbbo....',
      '...Okkkkdbbbdkkdbbbbo...',
      '...Okkkdbbbbdkkkdbbbo...',
      '...Okkkdbbbbdkkkdbbbo...',
      '...Okkkdbbbbdkkkdbbbo...',
      '..Okkkkdbbbbdkkkdbbbbo..',
      '..Okkkkdbbbbdkkkdbbbdo..',
      '..Okkkkdbbbbdkkkdbbbdo..',
      '..Okkkkdbbbbdkkkdbbbdo..',
      '..Okkkkooooookkkoooooo..',
      '...oooo......ooo........',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.4, rx: 11, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'indigo',
    o: 'night',
    k: 'sky',
    b: 'denim',
    d: 'indigo',
    y: 'honey',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Pants: khaki trousers seen from the front, a waistband with belt loops and a
// button, a fly, two slanted pockets and two legs.
// O lit outline, o shade outline, s cloth light, t cloth, e seam and shade,
// p button, z shadow.

const PANTS: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.......OOOOOOOOOo.......',
      '......Osettpttteeo......',
      '......Oeeeeeeeeeeo......',
      '.....Osttettetetteo.....',
      '.....Oseetttetteeeo.....',
      '.....Ostttttetttteo.....',
      '.....Ostttttetttteo.....',
      '.....Ostttteetttteo.....',
      '.....OsttttoOsttteo.....',
      '.....OsttttoOsttteo.....',
      '.....OsttttoOsttteo.....',
      '.....OsttttoOsttteo.....',
      '....Ostttto..Osttteo....',
      '....Ostttto..Osttteo....',
      '....Ostttto..Osttteo....',
      '....Ostttto..Osttteo....',
      '....Ostttto..Osttteo....',
      '....Ostttto..Osttteo....',
      '....Ostttto..Osttteo....',
      '....Oeeeeeo..Oeeeeeo....',
      '....ooooooo..ooooooo....',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.6, rx: 9, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'ember',
    o: 'plum',
    s: 'skin',
    t: 'tan',
    e: 'ember',
    p: 'plum',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Gift: a purple box with a lid, tied with a gold ribbon and a big bow on top.
// O lit outline, o shade outline, v lid, u box, U box shade, E bow lit outline,
// P bow shade outline, h ribbon light, y ribbon, a ribbon shade, z shadow.

const GIFT: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '......EEE......EEE......',
      '.....EhhyE....EhyyP.....',
      '.....EhyyyE..EyyyaP.....',
      '......EyyaaEEyyaaP......',
      '.......PPPhyyaPPP.......',
      '..OOOOOOOOhyyaOOOOOOOo..',
      '..OvvvvvvvhyyavvvvvvUo..',
      '..OvvvvvvvhyyavvvvvvUo..',
      '..oooooooohyyaoooooooo..',
      '...OUUUUUUhyyaUUUUUUo...',
      '...OuuuuuuhyyauuuuuUo...',
      '...OuuuuuuhyyauuuuuUo...',
      '...OuuuuuuhyyauuuuuUo...',
      '...Ohhhhhhhhhhhhhhhyo...',
      '...Oyyyyyyyyyyyyyyyao...',
      '...OuuuuuuhyyauuuuuUo...',
      '...OuuuuuuhyyauuuuuUo...',
      '...OuuuuuuhyyauuuuuUo...',
      '...OuuuuuuhyyauuuuUUo...',
      '...oooooooooooooooooo...',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.6, rx: 10.5, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'indigo',
    o: 'night',
    v: 'mauve',
    u: 'violet',
    U: 'dusk',
    E: 'ember',
    P: 'plum',
    h: 'honey',
    y: 'lamp',
    a: 'amber',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Scarf: a long knitted scarf, orange with blue stripes, looped once with the two
// ends hanging down, a fringe on each end.
// O lit outline, o shade outline, h wool light, y wool, a wool shade, b stripe,
// d stripe shade, z shadow.

const SCARF: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.......OOOOOOOOOO.......',
      '.....OOyybbyybbyyOo.....',
      '....Obbyybbyybbyybbo....',
      '...Oyyyyooooooooaaaao...',
      '...Obbbbo......Oddddo...',
      '...Oyyyyo......Oaaaao...',
      '...ObbbbOOOOOOOOddddo...',
      '....Obbyybbyybbaaddo....',
      '.....ooyybbyybbaaoo.....',
      '.....Oooooooooooooo.....',
      '.....ObbbbboOdddddo.....',
      '.....OhyyyyoOaaaaao.....',
      '.....OhyyyyoOaaaaao.....',
      '.....Obbbbbo.Odddddo....',
      '....Ohyyyyo..Oaaaaao....',
      '....Ohyyyyo..Oaaaaao....',
      '....Obbbbbo...a.a.a.....',
      '....Ohyyyyo...a.a.a.....',
      '....Ohyyyyo.............',
      '.....y.y.y..............',
      '.....y.y.y..............',
      '........................',
      '........................',
    ],
    { cx: 11, cy: 21.6, rx: 9, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'ember',
    o: 'plum',
    h: 'honey',
    y: 'lamp',
    a: 'amber',
    b: 'denim',
    d: 'indigo',
    z: 'fog',
  },
};

export const CLOTHES_ITEMS: Readonly<Record<string, PixelSprite>> = {
  clothes: CLOTHES,
  shirt: SHIRT,
  dress: DRESS,
  jacket: JACKET,
  coat: COAT,
  hat: HAT,
  shoe: SHOE,
  mirror: MIRROR,
  skirt: SKIRT,
  pants: PANTS,
  gift: GIFT,
  scarf: SCARF,
};
