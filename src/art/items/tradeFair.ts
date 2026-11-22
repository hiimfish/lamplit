/** Item icons for the trade fair unit. */
import type { PixelSprite } from '../../game/sprites';
import { withShadow } from './draw';

// ---------------------------------------------------------------------------
// Brochure: a three-fold leaflet standing open in a zigzag, a teal cover with a
// desk lamp on the first panel, print and a photo on the other two.
// O lit outline, o shade outline, w page, g shaded panel, G fold and print on
// the shaded panel, S heading, T cover, h lamp shade, a lamp stand, c print,
// k photo sky, d photo hills, z shadow.

const BROCHURE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '.......OOo...........OO.',
      '....OOOTTGooo.....OOOwo.',
      '..OOTTTTTGgggoo.OOwwwko.',
      '.OTThhhTTGgSSggowwkkkko.',
      '.OThhhhhTGgggSSGwkkkkko.',
      '.OTTTaTTTGgggggGwkkkkdo.',
      '.OTTTaTTTGgGGggGwkddddo.',
      '.OTTaaaTTGgggGGGwddddwo.',
      '.OTTTTTTTGgGGggGwdwwwco.',
      '.OTTTTTwwGgggGGGwwcccwo.',
      '.OTTwwwcwGgggggGwcwwwco.',
      '.OwwcccwwGgGGggGwwcccwo.',
      '.OwcwwwcwGgggGGGwcwwwco.',
      '.OwwcccwwGgGGggGwwcccwo.',
      '.OwcwwwwwGgggGGGwcwwwwo.',
      '.OwwccwooogggggGwwccwoo.',
      '.Owcooo...oooggGwcooo...',
      '.Ooo.........ooGoo......',
      '.o.............o........',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.4, rx: 11, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    G: 'concrete',
    S: 'stone',
    T: 'teal',
    h: 'honey',
    a: 'amber',
    c: 'concrete',
    k: 'sky',
    d: 'denim',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Booth: a fair stand seen from the front: a red header board with a name
// plate, white back wall with a poster, and a table with a blue cloth and a
// desk lamp on it.
// O lit outline, o shade outline, n header light, r header, M header shade,
// w plate and wall, h lamp shade light, y lamp shade, a lamp stand, S post and
// plate print, s post shade, G wall in shadow, g wall seam, k poster and cloth
// light, d poster hills and cloth shade, E table edge, P table shade, b cloth,
// B cloth outline, C carpet, z shadow.

const BOOTH: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.OOOOOOOOOOOOOOOOOOOOOo.',
      '.OnrrrrrrrrrrrrrrrrrrMo.',
      '.OnrrwwwwwwwwwwwwwwrrMo.',
      '.OnrrwhhwSSSSwSSSSwrrMo.',
      '.OnrrwwwwwwwwwwwwwwrrMo.',
      '.OrrrrrrrrrrrrrrrrrrMMo.',
      '.oooooooooooooooooooooo.',
      '..SsGGGGGGGGGGGGGGGGSs..',
      '..SswwwwwwwgwwwwwwwwSs..',
      '..SswkkkkkwgwwwhhhwwSs..',
      '..SswkkhkkwgwwhhhhhwSs..',
      '..SswkkkdkwgwwyyyyywSs..',
      '..SswkddddwgwwwwawwwSs..',
      '..SswwwwwwwgwwwwawwwSs..',
      '..SEEEEEEEEEEEEaaaEEEs..',
      '..SEhhhhhhhhhhhhhhhhPs..',
      '..SsBkbbbbbbbbbbbbdBSs..',
      '..SsBkbbbbbbbbbbbbdBSs..',
      '..SsBkbbbbbbbbbbbbdBSs..',
      '..SsBkbbbbbbbbbbbbdBSs..',
      '.CCCCCCCCCCCCCCCCCCCCCC.',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 22.2, rx: 11.5, ry: 1.4, key: 'z' },
  ),
  legend: {
    O: 'maroon',
    o: 'plum',
    n: 'neon',
    r: 'red',
    M: 'maroon',
    w: 'paper',
    h: 'honey',
    y: 'lamp',
    a: 'amber',
    S: 'stone',
    s: 'slate',
    G: 'concrete',
    g: 'fog',
    k: 'sky',
    d: 'denim',
    E: 'ember',
    P: 'plum',
    b: 'denim',
    B: 'indigo',
    C: 'violet',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Greet: an open hand waving hello, leaning to one side, a white cuff and a
// blue sleeve at the wrist and motion marks beside the fingers.
// E lit outline, P shade outline, s skin, t skin shade and creases, C cuff lit
// outline, c cuff shade outline, w cuff, G cuff shade, O sleeve lit outline,
// o sleeve shade outline, b sleeve, D sleeve shade, k motion marks, z shadow.

const GREET: PixelSprite = {
  rows: withShadow(
    [
      '..k..................k..',
      '.k..k..EE...EEE.......k.',
      'kk.k..EssP.EsssP.EE...kk',
      'kk.k..EssP.EsssPEssP..kk',
      'kk.k..EssP.EsssEsssP..k.',
      '.k..k.EsssEsssstsstP.k..',
      '..k...EsstsssstsstP.EE..',
      '......EsstssstssstPEssP.',
      '..EE..EsstssstssstsstP..',
      '.EssEEssstssstssstsstP..',
      '.EsssssssssssssssssstP..',
      '..EsssssssssssssssstP...',
      '..PssssstssssssssttP....',
      '...PPsssstttsssssttP....',
      '.....PsssssssssstttP....',
      '.....EssssssssssttP.....',
      '......EsssssssstttP.....',
      '......EssssssssttP......',
      '.....CCCCCCCCCCCc.......',
      '.....CwwwwwwwwwGc.......',
      '....ObbbbbbbbbbDo.......',
      '...ObbbbbbbbbbDDo.......',
      '...oooooooooooooo.......',
      '........................',
    ],
    { cx: 9.5, cy: 23, rx: 7, ry: 1, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    s: 'skin',
    t: 'tan',
    C: 'concrete',
    c: 'stone',
    w: 'paper',
    G: 'fog',
    O: 'denim',
    o: 'indigo',
    b: 'sky',
    D: 'denim',
    k: 'sky',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Shake: two hands clasped in a handshake, a blue sleeve from the left and a
// red one from the right, white cuffs. The near hand has its thumb up and its
// fingers wrapped down over the darker far hand, whose thumb shows behind.
// E lit outline, P shade outline, s near hand, t finger creases, F far hand
// lit outline, T far hand, e far hand shade, W cuff outline, w cuff, g cuff
// shade, O blue sleeve lit outline, o blue sleeve shade outline, k blue sleeve
// light, b blue sleeve, d blue sleeve shade, Q red sleeve outline, r red
// sleeve, R red sleeve shade, z shadow.

const SHAKE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '...........EE.FF........',
      '..........EssPTTF.......',
      '.........EsssPTTTFFF....',
      '...WW.EEssssPTTTTTTTWW..',
      'OOOwgEsssssssPTTTTTTwgQQ',
      'kkkwgEssssssssPTTTTTwgrr',
      'bbbwgEsssssssssPTTTTwgrr',
      'bbbwgEssssssssssPTTTwgrr',
      'bbbwgEssssstsssssPTewgrr',
      'dddwgEssstsstssssPeewgRR',
      'dddwgEstsstsstssPeeewgRR',
      'ooowgPsstsstssPPPPPPwgQQ',
      '...WW.PssPssPsP.....WW..',
      '.......PP.PP.P..........',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 11.5, cy: 19.4, rx: 10.5, ry: 1.8, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    s: 'skin',
    t: 'tan',
    F: 'ember',
    T: 'tan',
    e: 'ember',
    W: 'stone',
    w: 'paper',
    g: 'fog',
    O: 'denim',
    k: 'sky',
    b: 'denim',
    d: 'indigo',
    o: 'indigo',
    Q: 'maroon',
    r: 'red',
    R: 'maroon',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// World: the globe, blue sea and green land, lit from the upper left.
// O lit outline, o shade outline, x glint, k sea, b sea shade, l land,
// L land shade, z shadow.

const WORLD: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.........OOOOOo.........',
      '.......OOkkkkkkOo.......',
      '.....OOxxklllllkkOo.....',
      '....OxxkklllllllklLo....',
      '....Olkkkklllllklllo....',
      '...OlllkkkkkkkkklllLo...',
      '...OlllkkkkllllklllLo...',
      '..OllllkkkllllllklllLo..',
      '..Olllkkkklllllllkkkbo..',
      '..Oklkkkkklllllllkkbbo..',
      '..Okkkkkkklllllllkkbbo..',
      '..Okkllkkkklllllkkkbbo..',
      '..oklllkkkkkllllkkbbbo..',
      '...Ollllkkkkllllkkbbo...',
      '...olllkkkkkllllkbbbo...',
      '....Ollkkkkkklllbbbo....',
      '....obkkkkkkkkbbbbbo....',
      '.....oobbkkbbbbbboo.....',
      '.......oobbbbbboo.......',
      '.........oooooo.........',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21, rx: 9, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'denim',
    o: 'indigo',
    x: 'cyan',
    k: 'sky',
    b: 'denim',
    l: 'leaf',
    L: 'moss',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Attract: a red horseshoe magnet, poles down, with steel tips, pulling a
// steel nail up towards it.
// O lit outline, o shade outline, n magnet light, r magnet, M magnet shade,
// S steel outline, s steel shade outline, w steel light, g steel, G steel
// shade, y pull marks, z shadow.

const ATTRACT: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.........OOOOOO.........',
      '.......OOnnrrrrOo.......',
      '......OnnrrrrrrrMo......',
      '.....OnrrrrrrrrrrMo.....',
      '....OnrrrrrrrrrrrrMo....',
      '....OnrrrroooorrrrMo....',
      '...Onrrrro....OrrrrMo...',
      '...OnrrMo......OnrrMo...',
      '...OnrrMo......OnrrMo...',
      '...OnrrMo......OnrrMo...',
      '...OnrrMo......OnrrMo...',
      '...SSSSSs......SSSSSs...',
      '...SwwgGs......SwwgGs...',
      '...SwwgGs......SwwgGs...',
      '...ssssss......ssssss...',
      '....y.y..........y.y....',
      '....y.y...y..y...y.y....',
      '.....SS.................',
      '.....SwSSSSSSSSSS.......',
      '.....SwwwwwggggggGs.....',
      '.....Sgssssssssss.......',
      '.....ss.................',
      '........................',
    ],
    { cx: 12, cy: 22.8, rx: 8, ry: 1, key: 'z' },
  ),
  legend: {
    O: 'maroon',
    o: 'plum',
    n: 'neon',
    r: 'red',
    M: 'maroon',
    S: 'stone',
    s: 'slate',
    w: 'paper',
    g: 'fog',
    G: 'concrete',
    y: 'lamp',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Video: a flat screen showing a paused film, a big white play triangle over
// the picture and a red progress bar along the bottom.
// O lit outline, o shade outline, S bezel, n bezel shade, D picture light,
// d picture, i picture dark, w play triangle, g triangle shade, r bar played,
// c bar left to play, z shadow.

const VIDEO: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '..OOOOOOOOOOOOOOOOOOOO..',
      '.OSSSSSSSSSSSSSSSSSSSSo.',
      '.OSDDDDDDDDDDddddddddSo.',
      '.OSDDDDDDwwddddddddddSo.',
      '.OSDDDDDDwwwdddddddddSo.',
      '.OSDDDDddwwwwwdddddddSo.',
      '.OSDDddddwwwwwwddddddSo.',
      '.OSddddddwwwwwwwwddddSo.',
      '.OSddddddwwwwwwgdddddSo.',
      '.OSddddddwwwwwgddddiiSo.',
      '.OSddddddwwwgddddiiiiSo.',
      '.OSddddddwggddiiiiiiiSo.',
      '.OSiiiiiiiiiiiiiiiiiiSo.',
      '.OSirrrrrrrwwccccccciSo.',
      '.OSiiiiiiiiiiiiiiiiiiSo.',
      '.OSnnnnnnnnnnnnnnnnnnno.',
      '..oooooooooooooooooooo..',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 19.6, rx: 11, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'concrete',
    o: 'slate',
    S: 'stone',
    n: 'slate',
    D: 'dusk',
    d: 'indigo',
    i: 'deep',
    w: 'paper',
    g: 'fog',
    r: 'red',
    c: 'concrete',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Target: a round red and white target with an arrow stuck in the bullseye.
// O lit outline, o shade outline, r red ring, M red ring shade, w white ring,
// g white ring shade, a arrow shaft, e shaft shade, x feather light,
// t feather, z shadow.

const TARGET: PixelSprite = {
  rows: withShadow(
    [
      '....................tt..',
      '...................txxt.',
      '........OOOOOo.....taxxt',
      '......OOrrrrrrOo..aettt.',
      '....OOrrwwwwwwrrOaet....',
      '...OrrwwwwwwwwwwaeMo....',
      '...Orwwwwrrrrwwaero.....',
      '..OrwwwrrrrrrraewwMo....',
      '..OrwwrrrwwwwaerwwMo....',
      '.OrwwwrrwwwwaerrwwwMo...',
      '.OrwwrrwwwraewwrrwwMo...',
      '.OrwwrrwwraerwwrrwwMo...',
      '.OrwwrrwwrrrrwwrrwgMo...',
      '.OrwwrrwwwrrwwwrrwgMo...',
      '.orwwwrrwwwwwwrrwwgMo...',
      '..OrwwrrrwwwwrrrwgMo....',
      '..orwwwrrrrrrrrwggMo....',
      '...OrwwwwrrrrwwggMo.....',
      '...oMrwwwwwwwwggMMo.....',
      '....ooMMwwwgggMMoo......',
      '......ooMMMMMMoo........',
      '........oooooo..........',
      '........................',
      '........................',
    ],
    { cx: 11, cy: 22, rx: 9, ry: 1.4, key: 'z' },
  ),
  legend: {
    O: 'maroon',
    o: 'plum',
    r: 'red',
    M: 'maroon',
    w: 'paper',
    g: 'fog',
    a: 'amber',
    e: 'ember',
    x: 'cyan',
    t: 'teal',
    z: 'fog',
  },
};

export const TRADE_FAIR_ITEMS: Readonly<Record<string, PixelSprite>> = {
  brochure: BROCHURE,
  booth: BOOTH,
  greet: GREET,
  shake: SHAKE,
  world: WORLD,
  attract: ATTRACT,
  video: VIDEO,
  target: TARGET,
};
