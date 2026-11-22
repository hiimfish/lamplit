/** Item icons for the park and neighbourhood unit. */
import type { PixelSprite } from '../../game/sprites';
import { withShadow } from './draw';

// ---------------------------------------------------------------------------
// Park: a small park scene, a bench under a tree, a lamp post and a sandy path
// across the lawn.
// O lit leaf outline, o shade outline, l leaf, L leaf shade, m leaf cluster,
// h sunlit leaves and lamp glass, E wood lit outline, P wood shade outline,
// a wood, y bench slat and lamp light, K iron, s iron light, M lawn outline,
// p path, e trunk foot, z shadow.

const PARK: PixelSprite = {
  rows: withShadow(
    [
      '....OOOOO...............',
      '..OOlllllOO........KKK..',
      '.OllhllllllO......KhhyK.',
      'OllhllllmllLo.....KhyyK.',
      'OlllllllllLLo......KKK..',
      'OllmllllllLLo.......Ks..',
      'OlllllmlLLLLo.......Ks..',
      '.OllLllLLLLo........Ks..',
      '..ooLLLLLoo.........Ks..',
      '....oEaPo...........Ks..',
      '.....EaP.EEEEEEEEEP.Ks..',
      '.....EaP.EyyyyyyyaP.Ks..',
      '.....EaP.PPPPPPPPPP.Ks..',
      '.....EaP.EyyyyyyyaP.Ks..',
      '.....EaP.PPPPPPPPPP.Ks..',
      '.....EaPEEEEEEEEEEEPKs..',
      '..MMMEaPEyyyyyyyyyaPKsM.',
      '.MlllEaPPKPPPPPPPPKPKslM',
      'MllllEePlKllllllllKlKslM',
      'MlllpppppppppppplllllllM',
      '.MppppppppppppppplllllM.',
      '..MMMMMMMMMMMMMMMMMMMM..',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.6, rx: 11.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'moss',
    o: 'ink',
    l: 'leaf',
    L: 'moss',
    m: 'moss',
    h: 'honey',
    E: 'ember',
    P: 'plum',
    a: 'amber',
    y: 'lamp',
    K: 'slate',
    s: 'stone',
    M: 'moss',
    p: 'skin',
    e: 'ember',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Tree: one big tree, a round crown on a short brown trunk.
// O lit outline, o shade outline, l leaf, L leaf shade, m leaf cluster,
// h sunlit leaves, E trunk lit outline, P trunk shade outline, t bark light,
// a bark, e bark shade, z shadow.

const TREE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.........OOOOOO.........',
      '......OOOllllllOOo......',
      '....OOllhlllllllllOo....',
      '...OllhlhllllllllllLo...',
      '..OllhlllllllllmlllLLo..',
      '..OlhllllllllllllllLLo..',
      '.OllllllmlllllllllLLLLo.',
      '.OlllllllllllllmllLLLLo.',
      '.OlllmllllllllllllLLLLo.',
      '.OllllllllmllllLlLLLLLo.',
      '..OllLlllllllLLlLLLLLo..',
      '..oLllLLlLLLLLLLLLLLLo..',
      '...ooLLLLLLLLLLLLLLoo...',
      '.....ooooEtaePoooo......',
      '.........EtaeP..........',
      '.........EtaeP..........',
      '.........EtaeP..........',
      '........EttaeeP.........',
      '.......EttaaeeeP........',
      '.......PPPPPPPPP........',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.4, rx: 9, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'moss',
    o: 'ink',
    l: 'leaf',
    L: 'moss',
    m: 'moss',
    h: 'honey',
    E: 'ember',
    P: 'plum',
    t: 'tan',
    a: 'amber',
    e: 'ember',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Dog: a friendly orange dog standing in side view, white muzzle and paws,
// a red collar and its tail up.
// E lit outline, P shade outline, H coat light, h coat, a coat shade, e far legs,
// w white fur, K eye and nose, r collar, n tongue, z shadow.

const DOG: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '...EE..EE...........EE..',
      '..EhhEEhaE.........EhaP.',
      '..EHHhhhaE.........EhaP.',
      '.EHhhhhhaaE........EhaP.',
      '.EhhKhhhhaE.......EhaaP.',
      'EEwwhhhhhaEEEEEEEEEhaaP.',
      'KKwwwhhhaarHHHHHhhhhaP..',
      'EwwwwwhaaarhhhhhhhhaaP..',
      '.PPnwwwaaarhhhhhhhhaaP..',
      '...PPwwwaaaaaaaaaaaaaP..',
      '.....EwwaaaaaaaaaaaaeP..',
      '.....EwwwaaaaaaaaaaeeP..',
      '.....EawwwwwwwwwaaeeeP..',
      '.....EaaPPPPPPPEaaPeeP..',
      '.....EaP.EeP...EaP.EeP..',
      '.....EaP.EeP...EaP.EeP..',
      '....EwwP.EwP..EwwP.EwP..',
      '....PPPP.PPP..PPPP.PPP..',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12.5, cy: 20.6, rx: 10.5, ry: 1.8, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    H: 'honey',
    h: 'lamp',
    a: 'amber',
    e: 'ember',
    w: 'paper',
    K: 'ink',
    r: 'red',
    n: 'neon',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Flower: one big pink flower with five petals and a yellow heart, on a stem
// with two leaves.
// O lit outline, o shade outline, n petal, N petal shade, k petal glint,
// h heart light, y heart, a heart shade, M leaf lit outline, K leaf shade outline,
// l leaf, L leaf shade, z shadow.

const FLOWER: PixelSprite = {
  rows: withShadow(
    [
      '.........OOOOOO.........',
      '........OnknnnNo........',
      '......OOOknnnnNOOO......',
      '.....OnnNNnnnnNnnnNo....',
      '.....OknnNNnnNnnnnNo....',
      '....OnnnnnhhyynnnnNo....',
      '....OnnnnhhyyyannNNo....',
      '.....ONNNhyyyaaNNNo.....',
      '.....OnnnNyyaaNnnNo.....',
      '......OnnnNaaNnnnNo.....',
      '......OnnnnNNnnnnNo.....',
      '......OnnnNNoOnnNNo.....',
      '.......ooooolLooooo.....',
      '............lL..........',
      '............lL....MMM...',
      '..MMMM......lL..MMlllK..',
      '.MllllMM....lL.MlllLLK..',
      '.MlllllLMM..lLMllLLLK...',
      '..KLlllLLLMKlLlLLLKK....',
      '...KKLLLLLLKlLLKKK......',
      '.....KKKKKKKlLK.........',
      '............lL..........',
      '........................',
      '........................',
    ],
    { cx: 12.5, cy: 21.4, rx: 8, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'neonDeep',
    o: 'maroon',
    n: 'neon',
    N: 'neonDeep',
    k: 'paper',
    h: 'honey',
    y: 'lamp',
    a: 'amber',
    M: 'moss',
    K: 'ink',
    l: 'leaf',
    L: 'moss',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Poster: an event poster pinned to a cork board, a big star on a pink field
// and two lines of print.
// E frame lit outline, P frame shade outline, t cork, a cork speck, s poster shadow,
// w poster paper, r pin, R pin shade, n colour field, y star, K headline,
// c small print, z shadow.

const POSTER: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.EEEEEEEEEEEEEEEEEEEEEP.',
      '.EtttttattttttttttttttP.',
      '.EtttwrrwwwwwwwwrrwtttP.',
      '.EtttwrRwwwwwwwwrRwsttP.',
      '.EtttwnnnnnnnnnnnnwsttP.',
      '.EtttwnnnnnyynnnnnwsttP.',
      '.EtatwnnnnnyynnnnnwsttP.',
      '.EtttwnyyyyyyyyyynwstaP.',
      '.EtttwnnyyyyyyyynnwsttP.',
      '.EtttwnnnyyyyyynnnwsttP.',
      '.EtttwnnnyyyyyynnnwsttP.',
      '.EtttwnnyyynnyyynnwsttP.',
      '.EtttwnnyynnnnyynnwsttP.',
      '.EtttwnnnnnnnnnnnnwsttP.',
      '.EtttwwwwwwwwwwwwwwsttP.',
      '.EattwwKKKKKKKKKKwwsttP.',
      '.EtttwwccccccwcccwwsttP.',
      '.EtttwwwwwwwwwwwwwwsttP.',
      '.EttttssssssssssssssttP.',
      '.EtttttttttttttattttttP.',
      '.PPPPPPPPPPPPPPPPPPPPPP.',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 22, rx: 11, ry: 1.4, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    t: 'tan',
    a: 'amber',
    s: 'ember',
    w: 'paper',
    r: 'red',
    R: 'maroon',
    n: 'neon',
    y: 'honey',
    K: 'ink',
    c: 'concrete',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Sun: a round yellow sun with eight short rays.
// E lit outline, P shade outline, h light, w glint, y gold, a gold shade, z shadow.

const SUN: PixelSprite = {
  rows: withShadow(
    [
      '...........ya...........',
      '...........ya...........',
      '...ya......ya......ya...',
      '....ya............ya....',
      '.....ya..EEEEEE..ya.....',
      '........EhhhhhyP........',
      '.......EhhwwhyyyP.......',
      '......EhhwhhyyyyyP......',
      '......EhhhhyyyyyyP......',
      '......EhhhyyyyyyyP......',
      '.yyy..EhhyyyyyyyaP..yyy.',
      '.aaa..EhyyyyyyyyaP..aaa.',
      '......EyyyyyyyyaaP......',
      '......EyyyyyyyaaaP......',
      '......EyyyyyyaaaaP......',
      '.......PyyyaaaaaP.......',
      '........PaaaaaaP........',
      '.....ya..PPPPPP..ya.....',
      '....ya............ya....',
      '...ya......ya......ya...',
      '...........ya...........',
      '...........ya...........',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 23, rx: 7, ry: 1.2, key: 'z' },
  ),
  legend: {
    E: 'amber',
    P: 'ember',
    h: 'honey',
    w: 'paper',
    y: 'lamp',
    a: 'amber',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Cloud: a white fair-weather cloud with a flat blue-grey underside.
// O lit outline, o shade outline, w cloud, g cloud shade, s underside, z shadow.

const CLOUD: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '..........OOOOO.........',
      '........OOwwwwwOO.......',
      '.......OwwwwwwwwwO......',
      '......OwwwwwwwwwwgOOO...',
      '...OOOwwwwwwwwwwwgwwwO..',
      '..OwwwwwwwwwwwwwgwwwwgO.',
      '.OwwwwwgwwwwwwwwwwwwwgO.',
      '.OwwwwwwgwwwwwwwwwwwwgO.',
      '.OwwwwwwwwwwwwwwwwwwggO.',
      '.OwwwwwwwwwwwwwwwwwgggO.',
      '.OwgggwwwwwgggwwwwggggO.',
      '.ogssssggggsssssggggsso.',
      '..osssssssssssssssssso..',
      '...oooooooooooooooooo...',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21, rx: 8, ry: 1.4, key: 'z' },
  ),
  legend: {
    O: 'concrete',
    o: 'denim',
    w: 'paper',
    g: 'fog',
    s: 'sky',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Grass: a cut patch of lawn, tall blades and a daisy on top, brown soil below.
// O lit outline, o shade outline, l blade, L blade shade, M stem, g petal lit edge,
// c petal shade edge, w petal, y daisy heart, E soil lit outline, P soil shade outline,
// s soil, t pebble, d soil shade, z shadow.

const GRASS: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '...............ggg......',
      '..............gwwwc.....',
      '....O........gwwywwc....',
      '....Ol.......gwyyywc....',
      '....Ol...O...gwwywwc....',
      '.O..OlL..Ol...cwwwc..O..',
      '.Ol.OlL..Ol.O..cMc...Ol.',
      '.Ol.OlL.OllLOl..Ml.O.Ol.',
      '.OlLOlL.OllLOlL.MlOlOlL.',
      'OOlLOlLOOllLOlLOMlOlOlLo',
      'OllLllLllllLllLlllLlllLo',
      'OlLLlLLllLLlLLllLLlLLlLo',
      'ELLsLLLssLLsLLLLssLLLsLP',
      'EssstssssssssstsssssstsP',
      'EsssssstssssssssstsssddP',
      'EsstssssssstsssssdddsddP',
      '.PddddddddddddddddddddP.',
      '..PPPPPPPPPPPPPPPPPPPP..',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 19.6, rx: 11.5, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'moss',
    o: 'ink',
    l: 'leaf',
    L: 'moss',
    M: 'moss',
    g: 'fog',
    c: 'concrete',
    w: 'paper',
    y: 'lamp',
    E: 'plum',
    P: 'ink',
    s: 'ember',
    t: 'tan',
    d: 'plum',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Plant: a young plant with three pointed leaves in a terracotta pot.
// O lit outline, o shade outline, l leaf, L leaf shade, m midrib, h leaf glint,
// E pot lit outline, P pot shade outline, y pot light, a pot, e pot shade, z shadow.

const PLANT: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '...........OO...........',
      '..........OllO..........',
      '..........OllLo.........',
      '....OO....OllLo...OO....',
      '...OllO...OllLo..OllO...',
      '...OlllO..OlmLo.OlllLo..',
      '...OllllO.OlmLo.OllLLo..',
      '....OlmllOOlmLoOllmLo...',
      '.....OlmllOlmLOllmLo....',
      '......OlmlllmLllmLo.....',
      '.......OllmlmLlmLo......',
      '.....EEEEEEEEEEEEEP.....',
      '.....EyyyaaaaaaaaeP.....',
      '.....EyaaaaaaaaaeeP.....',
      '.....PPPPPPPPPPPPPP.....',
      '......EyaaaaaaaeeP......',
      '......EyaaaaaaaeeP......',
      '......EyaaaaaaeeeP......',
      '.......EaaaaaeeeP.......',
      '.......PPPPPPPPPP.......',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.6, rx: 8, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'moss',
    o: 'ink',
    l: 'leaf',
    L: 'moss',
    m: 'moss',
    E: 'ember',
    P: 'plum',
    y: 'lamp',
    a: 'amber',
    e: 'ember',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Ball: a football, white with black patches.
// O lit outline, o shade outline, w leather, g leather shade, G leather dark,
// c seam, S patch lit, K patch, z shadow.

const BALL: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........OOOOOOOO........',
      '......OOwSKKKKKwOO......',
      '.....OwwcwKKKKwcwwO.....',
      '....OwwcwwwKKwwwcwwo....',
      '....Owcwwwwccwwwwcwo....',
      '...OKwwwwwwccwwwwwwKo...',
      '...OKKwwwwwccwwwwwKKo...',
      '..OSKKKwwwwKKwwwwKKKKo..',
      '..OKKKwcwwKKKKwwcgKKKo..',
      '..OKKwwwcKKKKKKcwggKKo..',
      '..OwcwwwwwKKKKwwgggGgo..',
      '..OwcwwwwwKKKKwggggGGo..',
      '...OwcwwwcwwggGgggGgo...',
      '...OwcwwcwwggggGggGGo...',
      '....OwKKKwgggggKKKGo....',
      '....OKKKKwggggGKKKKo....',
      '.....OKKKKGGGGKKKKo.....',
      '......ooKKggGGKKoo......',
      '........oooooooo........',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.4, rx: 8.5, ry: 2, key: 'z' },
  ),
  legend: {
    O: 'concrete',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    G: 'concrete',
    c: 'fog',
    S: 'slate',
    K: 'ink',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Picnic: a wicker basket on a red checked blanket, a baguette, a napkin and
// a green bottle sticking out.
// E lit outline, P shade outline, b bread light, y wicker and crust, a wicker dark,
// e wicker shade, g napkin edge, w white, r red, R blanket edge and cap shade,
// M bottle lit outline, K bottle shade outline, l glass, L glass shade, z shadow.

const PICNIC: PixelSprite = {
  rows: withShadow(
    [
      '...................rR...',
      '.........EEEEE.....rR...',
      '.EEE...EEyyyyyEP..MlLK..',
      'EbbyP.EyaPPPPPaaP.MlLK..',
      'EbyabPEyP.....EaPMllLLK.',
      '.EbbyaPyP.ggg.EaPMlwlLK.',
      '..EbabyPPgwrwgEaPMlwlLK.',
      '...EbbyaPgrwrgEaPMllLLK.',
      '..EEEEEEEEEEEEEEEEEEEEP.',
      '..EyyyyyyyyyyyyyyyyyyaP.',
      '..PPPPPPPPPPPPPPPPPPPPP.',
      '...EyyayyayyayyayyaeeP..',
      '...EayyayyayyayyayaeeP..',
      '...EyyayyayyayyayyaeeP..',
      '...EayyayyayyayyayaeeP..',
      '.RrEyyayyayyayyayyaeePR.',
      'RrwEayyayyayyayyayaeePrR',
      'RwwrPPPPPPPPPPPPPPPPPrwR',
      'RrrwwrrwwrrwwrrwwrrwwrrR',
      'RwwrrwwrrwwrrwwrrwwrrwwR',
      '.RRRRRRRRRRRRRRRRRRRRRR.',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21, rx: 11.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    b: 'honey',
    y: 'lamp',
    a: 'amber',
    e: 'ember',
    g: 'fog',
    w: 'paper',
    r: 'red',
    R: 'maroon',
    M: 'moss',
    K: 'ink',
    l: 'leaf',
    L: 'moss',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Lake: a blue lake seen from slightly above, a green shore with two far trees,
// reeds in front and a small sailing boat.
// M shore lit outline and reed stalk, K shore shade outline, l shore grass and
// tree leaves, O tree lit outline, o tree shade outline, L tree shade, E trunk,
// b water, B deep water, c ripple, w sail and glint, g sail shade, r hull,
// R hull shade, e reed head, z shadow.

const LAKE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '...............OOO......',
      '..............OllLo.OO..',
      '..............OlLLoOlLo.',
      '........MMMMMMMoEo.OLLo.',
      '.....MMMllllllllElMoEo..',
      '...MMllBBBBBBBBBBlllK...',
      '..MllBbbbbbwbbbbbbBllK..',
      '.MllbbbbbbwwgbbcccbbllK.',
      '.MlbbbbbbwwwggbbbbbbblK.',
      'MlbcccbbwwwwgggbbbbbbblK',
      'MlbebbbwwwwwggggbbbwbblK',
      'MlbebbbRrrrrrrrrRbbbbblK',
      'MlbebebbRRRRRRRRbbccbblK',
      '.MlMbebbBBbBBBbBbbbbblK.',
      '.MlMbebbcccbbbbbbBBBllK.',
      '..MMlMBbbbbbbbBBBBlllK..',
      '...KlMllBBBBBBBBllllK...',
      '.....KllllllllllllK.....',
      '........KKKKKKKK........',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20, rx: 10, ry: 1.4, key: 'z' },
  ),
  legend: {
    M: 'moss',
    K: 'ink',
    l: 'leaf',
    O: 'moss',
    o: 'ink',
    L: 'moss',
    E: 'ember',
    b: 'sky',
    B: 'denim',
    c: 'cyan',
    w: 'paper',
    g: 'fog',
    r: 'red',
    R: 'maroon',
    e: 'ember',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Tennis: a blue tennis racket lying at an angle and a small yellow ball.
// O frame lit outline, o frame shade outline, n frame light, r frame, M frame shade,
// g strings, K grip outline, s grip, t grip light, E ball lit outline,
// P ball shade outline, y ball, w glint, l seam, a ball shade, z shadow.

const TENNIS: PixelSprite = {
  rows: withShadow(
    [
      '.......OOOOOO...........',
      '......OnnnnnnO..........',
      '.....OnnggggrrO.........',
      '....Ong.g.g.g.ro........',
      '...Onggggggggggro.......',
      '...On.g.g.g.g.gro.......',
      '...Onggggggggggro.......',
      '...On.g.g.g.g.gro.......',
      '...OrggggggggggMo.......',
      '...Or.g.g.g.g.gMo.......',
      '....OrggggggggMo........',
      '.....Orrg.g.MMrO........',
      '......oMMMMMMMrrO.......',
      '.......oooooooMrrO......',
      '...EEEE.......oMrrO.....',
      '..EwylyP.......KsstK....',
      '.EyylyyaP.......KsstK...',
      '.EylyyyaP........KsstK..',
      '.EylyyaaP.........KsstK.',
      '.EyylyaaP..........KssK.',
      '..PyylaP............KK..',
      '...PPPP.................',
      '........................',
      '........................',
    ],
    { cx: 11, cy: 21.6, rx: 10, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'indigo',
    o: 'deep',
    n: 'sky',
    r: 'denim',
    M: 'indigo',
    g: 'fog',
    K: 'slate',
    s: 'stone',
    t: 'concrete',
    E: 'leaf',
    P: 'moss',
    y: 'honey',
    w: 'paper',
    l: 'leaf',
    a: 'lamp',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Picture: two photo prints with white borders, a landscape on top of a portrait.
// O lit outline, o shade outline, w border, g border shade, k sky, h sun and
// portrait backdrop, m mountain, l meadow, K hair, s face, d shirt, z shadow.

const PICTURE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.........OOOOOOOOOOOOOo.',
      '.........Owwwwwwwwwwwwo.',
      '.........Owhhhhhhhhhhwo.',
      '.........OwhhhhhKKKhhwo.',
      '.........OwhhhhKKKKKhwo.',
      '.OOOOOOOOOOOOOoKsssKhwo.',
      '.Owwwwwwwwwwwwohssshhwo.',
      '.Owkkkkkkkkkkwodddddhwo.',
      '.Owkkkkkkhhkkwoddddddwo.',
      '.Owkwwkkkhhkkwoddddddwo.',
      '.Owkkkkkkkkkkwowwwwwwwo.',
      '.Owkkkmkkkkkkwogggggggo.',
      '.Owkkmmmkkmkkwooooooooo.',
      '.Owkmmmmmmmmkwo.........',
      '.Owllllllllllwo.........',
      '.Owllllllllllwo.........',
      '.Owwwwwwwwwwwwo.........',
      '.Owwwwwwwwwwwwo.........',
      '.Owwgggggggwwwo.........',
      '.Oggggggggggggo.........',
      '.oooooooooooooo.........',
      '........................',
      '........................',
    ],
    { cx: 11, cy: 22, rx: 10.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    k: 'sky',
    h: 'honey',
    m: 'moss',
    l: 'leaf',
    K: 'ink',
    s: 'skin',
    d: 'denim',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Message: two chat bubbles, a white one with three dots and a blue reply with
// two lines.
// O lit outline, o shade outline, w bubble, g bubble shade, K dots,
// D reply lit outline, d reply shade outline, k reply light, b reply, B reply shade,
// z shadow.

const MESSAGE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '...OOOOOOOOOOOOO........',
      '..OwwwwwwwwwwwwwO.......',
      '.OwwwwwwwwwwwwwwwO......',
      '.OwwwwwwwwwwwwwwwO......',
      '.OwwwKKwwKKwwKKwwo......',
      '.OwwwKKwwKKwwKKwwo......',
      '.Owwwwwwwwwwwwwwgo......',
      '.Owwwwwwwwwwwwwggo......',
      '..Owwwggggggggggo.......',
      '...Owwoooooooooo........',
      '...Owo....DDDDDDDDDDD...',
      '...Oo....Dkkkkkkkkkbbd..',
      '........Dkbbbbbbbbbbbbd.',
      '........Dkbwwwwwwwwbbbd.',
      '........Dbbbbbbbbbbbbbd.',
      '........DbbwwwwwbbbbbBd.',
      '........DbbbbbbbbbBBBBd.',
      '.........DBBBBBBBBBBBd..',
      '..........dddddddDBBd...',
      '..................DBd...',
      '...................dd...',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 22, rx: 9, ry: 1.4, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    K: 'ink',
    D: 'indigo',
    d: 'deep',
    k: 'sky',
    b: 'denim',
    B: 'indigo',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Camera: a compact camera seen from the front, silver top, black body, a big
// lens, a flash and a red shutter button.
// O lit outline, o shade outline, w top light, g silver, c silver shade, G hump shade,
// K ink, k viewfinder, y flash rim, h flash, S body lit outline, t body light,
// s body, n body shade, D lens barrel, x glint, b glass light, d glass, i glass deep,
// r button, R button shade, z shadow.

const CAMERA: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '.........OOOOOO.........',
      '...rrR..OggggggGo.......',
      '..OOOOOOOgcccccGOOOOOOo.',
      '.Owwwwwwwwwwwwwwwwwwgco.',
      '.OgKkkKgggggggggyhwhyco.',
      '.OgKkkKgggKKKKKgyhhhyco.',
      '.OcccccccKggggcKcccccco.',
      '.StsssssKggDDDgcKssrsnK.',
      '.StssssKggDxxbDccKsssnK.',
      '.StssssKgDxwbddDcKsssnK.',
      '.StssssKgDbbddiDcKsssnK.',
      '.StssssKgDbddiiDcKsssnK.',
      '.StssssKgcDdiiDccKsssnK.',
      '.StsssssKccDDDccKssssnK.',
      '.StssssssKcccccKsssssnK.',
      '.SnnnnnnnnKKKKKnnnnnnnK.',
      '..KKKKKKKKKKKKKKKKKKKK..',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20, rx: 11, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'concrete',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    c: 'concrete',
    G: 'concrete',
    K: 'ink',
    k: 'sky',
    y: 'lamp',
    h: 'honey',
    S: 'stone',
    t: 'stone',
    s: 'slate',
    n: 'night',
    D: 'ink',
    x: 'cyan',
    b: 'sky',
    d: 'denim',
    i: 'indigo',
    r: 'red',
    R: 'maroon',
    z: 'fog',
  },
};

export const PARK_ITEMS: Readonly<Record<string, PixelSprite>> = {
  park: PARK,
  tree: TREE,
  dog: DOG,
  flower: FLOWER,
  poster: POSTER,
  sun: SUN,
  cloud: CLOUD,
  grass: GRASS,
  plant: PLANT,
  ball: BALL,
  picnic: PICNIC,
  lake: LAKE,
  tennis: TENNIS,
  picture: PICTURE,
  message: MESSAGE,
  camera: CAMERA,
};
