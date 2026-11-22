/** Item icons for the convenience store unit. */
import type { PixelSprite } from '../../game/sprites';
import { withShadow } from './draw';

// ---------------------------------------------------------------------------
// Milk: a gable-top milk carton in three-quarter view, blue roof and a blue
// band with a white milk drop.
// O lit outline, o shade outline, w carton, g carton shade, G side, S crease,
// b roof light, B roof and band, d side band, z shadow.

const MILK: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........OOOOOOo.........',
      '........Owwwwgo.........',
      '.......OwbBBBBBo........',
      '......OwbbbBBBBBo.......',
      '.....OwbbbbbBBBBBo......',
      '....OwbbbbbbbBBBBBo.....',
      '....OgggggggggSSSSSo....',
      '....OwwwwwwwggGGGGGo....',
      '....OwwwwwwwggGGGGGo....',
      '....ObBBBBBBBBdddddo....',
      '....ObBBBwBBBBdddddo....',
      '....ObBBwwwBBBdddddo....',
      '....ObBwwwwgBBdddddo....',
      '....ObBwwwwgBBdddddo....',
      '....ObBBwggBBBdddddo....',
      '....ObBBBBBBBBdddddo....',
      '....OwwwwwwwggGGGGGo....',
      '....OwwwwwwwggGGGGGo....',
      '....OwwwwwwwggGGGGGo....',
      '....oooooooooooooooo....',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.6, rx: 10.5, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    G: 'concrete',
    S: 'stone',
    b: 'sky',
    B: 'denim',
    d: 'indigo',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Egg: a brown egg standing behind a white one.
// E lit outline, P shade outline, k shell light, t shell, e shell shade (brown egg);
// O lit outline, o shade outline, w shell light, g shell, G shell shade (white egg);
// z shadow.

const EGG: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '......EEEP..............',
      '.....EkkktP.............',
      '....EkwktttP............',
      '....EkwttttP..OOOo......',
      '...EkktttttePOwwwgo.....',
      '...EktttttteOwwwgggo....',
      '...EktttttteOwwggggo....',
      '...EtttttteOwwgggggGo...',
      '...EtttttteOwggggggGo...',
      '...EttttteeOwggggggGo...',
      '...PtttteeeOggggggGGo...',
      '....PtteeeeOggggggGGo...',
      '.....PeeeePOgggggGGGo...',
      '......PPPP.oggggGGGGo...',
      '............oggGGGGo....',
      '.............oGGGGo.....',
      '..............oooo......',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.4, rx: 10, ry: 2, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    k: 'skin',
    t: 'tan',
    e: 'ember',
    O: 'concrete',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    G: 'concrete',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Bread: a sandwich loaf going back to the right, its cut end facing us.
// E lit outline, P shade outline, Y crust light, y crust lit, a crust, e crust shade,
// w crumb, h crumb shade, z shadow.

const BREAD: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '...........EEEEEEEEE....',
      '........EEEYYYYYYYYYE...',
      '.....EEEYYYyyyyyyyyyYE..',
      '....EYYYyyyyyyyyyyyyyYP.',
      '...EEEEEEEEaaaaaaaaayyP.',
      '..EaaaaaaaaPaaaaaaaaayP.',
      '.EawwwwwwwwaPaaaaaaaaP..',
      '.EawwhwwwwhaPaaaaaaaaP..',
      '.EawwwwwwwhaPaaaaaaaaP..',
      '..EawwwwwhaPaaaaaaaaaP..',
      '..EawwhwwhaPaaaaaaaaaP..',
      '..EawwwwwhaPaaaaaaaeeP..',
      '..EawwwwwhaPaaaaeeeeeP..',
      '..EawwwhwhaPaeeeeeePP...',
      '..EawhhhhhaPeeeePPP.....',
      '..EaaaaaaaaPePPP........',
      '..PPPPPPPPPPP...........',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.6, rx: 11, ry: 2, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    Y: 'honey',
    y: 'lamp',
    a: 'amber',
    e: 'ember',
    w: 'paper',
    h: 'honey',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Money: two green banknotes, one behind the other, and a gold coin.
// O lit outline, o shade outline, l note, m note print, w portrait oval,
// K back note outline, M back note, L back note print,
// E coin lit outline, P coin shade outline, h coin light, y gold, a gold shade,
// e coin stamp, z shadow.

const MONEY: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '....KKKKKKKKKKKKKKKKKK..',
      '....KMMMMMMMMMMMMMMMMK..',
      '....KMLLLLLLLLLLLLLLMK..',
      '.OOOOOOOOOOOOOOOOOoLMK..',
      '.OlllllllllllllllloLMK..',
      '.OlmmmmmmmmmmmmmmloLMK..',
      '.OlmllllwwwwllllmloLMK..',
      '.OlmmlllwmmwllllmloLMK..',
      '.OlmlllwmmmmwllmmloMMK..',
      '.OlmllllwwwwllllEEEEPK..',
      '.OlmmmmmmmmmmmmEhhhyyP..',
      '.OllllllllllllEhhaaaayP.',
      '.oooooooooooooEhayyyyaP.',
      '..............EhayeyyaP.',
      '..............EyayeyyaP.',
      '..............EyyaaaaaP.',
      '...............PyyyaaP..',
      '................PPPPP...',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20, rx: 11, ry: 2, key: 'z' },
  ),
  legend: {
    O: 'moss',
    o: 'ink',
    l: 'leaf',
    m: 'moss',
    w: 'paper',
    K: 'ink',
    M: 'moss',
    L: 'leaf',
    E: 'ember',
    P: 'plum',
    h: 'honey',
    y: 'lamp',
    a: 'amber',
    e: 'ember',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Drink: an orange juice box with a bendy straw, an orange on its label.
// O lit outline, o shade outline, t top, h front light, y front, s side light,
// S side, n straw, N straw shade, K straw hole, w label, f fruit, F fruit shade,
// l leaf, z shadow.

const DRINK: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '............nnnnN.......',
      '............nN..........',
      '............nN..........',
      '............nN..........',
      '........OOOOnNOOOo......',
      '.......OtttttKKtttso....',
      '......OttttttttttsSo....',
      '.....OhyyyyyyyyysSSo....',
      '.....OhyyyyyyyyysSSo....',
      '.....OhywwwwwyyysSSo....',
      '.....OhwwwwwlwyysSSo....',
      '.....OhwwfffwwyysSSo....',
      '.....OhwfyfffwyysSSo....',
      '.....OhwfffffwyysSSo....',
      '.....OhwwfFFwwyysSSo....',
      '.....OhywwwwwyyysSSo....',
      '.....OhyyyyyyyyysSSo....',
      '.....OhyyyyyyyyysSo.....',
      '.....OhyyyyyyyyysSo.....',
      '.....ooooooooooooo......',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12.5, cy: 20.6, rx: 9, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'ember',
    o: 'plum',
    t: 'honey',
    h: 'honey',
    y: 'lamp',
    s: 'amber',
    S: 'amber',
    n: 'neon',
    N: 'neonDeep',
    K: 'ember',
    w: 'paper',
    f: 'amber',
    F: 'ember',
    l: 'leaf',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Bag: a white plastic shopping bag with two loop handles and the store stripes,
// a green bottle peeking out of the top.
// O lit outline, o shade outline, w plastic, g crease, G plastic shade,
// r stripe and cap, R stripe shade, y stripe, a stripe shade, l bottle, L bottle shade,
// z shadow.

const BAG: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '....OOOo........OOOo....',
      '...Owwwgo..Oo..OwwgGo...',
      '...Ow..Go.OrRo.Ow..Go...',
      '...Ow..Go.OlLo.Ow..Go...',
      '...Ow..Go.OlLo.Ow..Go...',
      '...OwwgGoOllLLoOwwgGo...',
      '...OwwwwwggggggwwwgGo...',
      '...OwwwwwwwwwwwwwwgGo...',
      '..OwwgwwwwwwwwwwwwgGGo..',
      '..OwwwgwwwwwwwwwwwgGGo..',
      '..OrrrrrrrrrrrrrrrrRRo..',
      '..OrrrrrrrrrrrrrrrrRRo..',
      '..Oyyyyyyyyyyyyyyyyaao..',
      '..OwwwwwwwwwwwwwwwgGGo..',
      '..OwwgwwwwwwwwwwwwgGGo..',
      '..OwwwgwwwwwwwgwwwgGGo..',
      '..OwwwwwwwwwwwwgwwgGGo..',
      '..OwwwwwwwwwwwwwwggGGo..',
      '...OgwwwwwwwwwwwwgGGo...',
      '....oooooooooooooooo....',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21, rx: 10.5, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    G: 'concrete',
    r: 'red',
    R: 'maroon',
    y: 'lamp',
    a: 'amber',
    l: 'leaf',
    L: 'moss',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Rain: a grey rain cloud with blue drops falling from it.
// O lit outline, o shade outline, w cloud light, g cloud lit, c cloud, s cloud shade,
// x drop light, k drop, d drop shade, z shadow.

const RAIN: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '..........OOOO..........',
      '.........OwwwwO.........',
      '........OwggggwO........',
      '......OOwgccccgwOOO.....',
      '....OOwwgccccccgwwwO....',
      '...Owwggccccccccgggwo...',
      '...OggcccccccccccccgO...',
      '..Owccccccccccccccccwo..',
      '..Ogcccccccccccccccco...',
      '...Occcccccccccccccco...',
      '...Ossccsssssssssssso...',
      '....oOssoooooooooooo....',
      '.....koo.........k......',
      '.....kd....k.....kd.....',
      '....kxkd...kd...kxkd....',
      '....kkdd..kxkd..kkdd....',
      '.....dd...kkdd...dd.....',
      '........k..dd.k.........',
      '........kd....kd........',
      '.......kxkd..kxkd.......',
      '.......kkdd..kkdd.......',
      '........dd....dd........',
      '........................',
    ],
    { cx: 12, cy: 23, rx: 8, ry: 1.2, key: 'z' },
  ),
  legend: {
    O: 'concrete',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    c: 'concrete',
    s: 'stone',
    k: 'sky',
    x: 'cyan',
    d: 'denim',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Umbrella: an open red umbrella with a scalloped rim and a wooden hook handle.
// O lit outline, o shade outline, n lit panel, r panel, m rib, M shade panel,
// s shaft light, c shaft, E handle lit outline, P handle shade outline,
// h wood light, a wood, e wood shade, z shadow.

const UMBRELLA: PixelSprite = {
  rows: withShadow(
    [
      '...........Oo...........',
      '.........OOOooo.........',
      '.......OOnmrrmMoo.......',
      '.....OOnnnmrrmMMMoo.....',
      '....OnnnnmrrrrmMMMMo....',
      '...OnnnnnmrrrrmMMMMMo...',
      '..OnnnnnnmrrrrmMMMMMMo..',
      '..OnnnnnmrrrrrrmMMMMMo..',
      '.OnnnnnnmrrrrrrmMMMMMMo.',
      '.OnnnnnmrrrrrrrrmMMMMMo.',
      '.OnoooomooorrooomooooMo.',
      '..o....o...sc...o....o..',
      '...........sc...........',
      '..........EEEP..........',
      '..........EhaP..........',
      '..........EhaP..........',
      '..........EhaP..........',
      '.......EP.EhaP..........',
      '......EhaPEhaP..........',
      '......EhaPEhaP..........',
      '.......EaaaaeP..........',
      '........PPPPP...........',
      '........................',
      '........................',
    ],
    { cx: 11.5, cy: 22.4, rx: 9, ry: 1.4, key: 'z' },
  ),
  legend: {
    O: 'maroon',
    o: 'plum',
    n: 'neon',
    r: 'red',
    m: 'maroon',
    M: 'maroon',
    s: 'fog',
    c: 'stone',
    E: 'ember',
    P: 'plum',
    h: 'honey',
    a: 'amber',
    e: 'ember',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Battery: an AA battery lying on its side, black body, copper top with a plus.
// K body outline, s body, t body light, w glint, n body shade, E copper lit outline,
// P copper shade outline, h copper light, y copper, a copper shade, e plus and
// copper dark, S cap outline, g cap light, c cap, z shadow.

const BATTERY: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '..KKKKKKKKKKEEEEEE......',
      '.KssssssssssaaaaaaP.....',
      '.KtwwttttttthhhhhhP.....',
      '.KssssssssssyyyyyyPSS...',
      '.KssssssssssyyyeyyPgcS..',
      '.KssssssssssyyeeeyPgcS..',
      '.KnnnnnnnnnnaaaeaaPccS..',
      '.KnnnnnnnnnnaaaaaaPSS...',
      '.KnnnnnnnnnnaaaaaaP.....',
      '.KnnnnnnnnnneeeeeeP.....',
      '..KKKKKKKKKKPPPPPP......',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 11.5, cy: 18.4, rx: 11, ry: 2, key: 'z' },
  ),
  legend: {
    K: 'ink',
    s: 'slate',
    t: 'stone',
    w: 'fog',
    n: 'night',
    E: 'ember',
    P: 'plum',
    h: 'honey',
    y: 'lamp',
    a: 'amber',
    e: 'ember',
    S: 'stone',
    g: 'fog',
    c: 'concrete',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Lunch: a convenience-store bento in a black tray, seen from above: rice with
// a pickled plum, fried chicken on lettuce, rolled egg and broccoli.
// K outline, S rim light, s rim, n tray side, w rice, g rice shade, r plum,
// M plum shade, x plum glint, h chicken light, a chicken, e chicken shade,
// l leaf, L leaf shade, y egg, Y egg light, b egg fold, z shadow.

const LUNCH: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '..KKKKKKKKKKKKKKKKKKKK..',
      '.KSSSSSSSSSSSSSSSSSSSsK.',
      '.KSgggggggggSllllllllsK.',
      '.KSgwwwwwwwwShhalhaaesK.',
      '.KSgwwwwwwwwShaaehaeesK.',
      '.KSgwwwxrwwwSlaeelaeLsK.',
      '.KSgwwrrrMwwSlLeLLeLLsK.',
      '.KSgwwwMMwwwSSSSSSSSssK.',
      '.KSgwgwwwwwwSYYyySlLlsK.',
      '.KSgwwwwwgwwSyyybSLlLsK.',
      '.KSgwwwwwwwwSbbbbSlLLsK.',
      '.KSgwwgwwwwwSyyybSLLLsK.',
      '.KSssssssssssssssssssK..',
      '.KnnnnnnnnnnnnnnnnnnnnK.',
      '.KnnnnnnnnnnnnnnnnnnnnK.',
      '..KKKKKKKKKKKKKKKKKKKK..',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21, rx: 11.5, ry: 1.8, key: 'z' },
  ),
  legend: {
    K: 'ink',
    S: 'stone',
    s: 'slate',
    n: 'night',
    w: 'paper',
    g: 'fog',
    r: 'red',
    M: 'maroon',
    x: 'neon',
    h: 'honey',
    a: 'amber',
    e: 'ember',
    l: 'leaf',
    L: 'moss',
    y: 'lamp',
    Y: 'honey',
    b: 'amber',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Fork: a steel fork lying flat, handle to the left and four tines to the right.
// O lit outline, o shade outline, w glint, g steel light, c steel, s steel shade,
// z shadow.

const FORK: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '.............OOOOOOOOO..',
      '............Owwwwwwwwwo.',
      '.OOOOOOOO...Ogggoooooo..',
      'OwwwwwwwwOOOOgggggggggo.',
      'Oggggggggggggcccoooooo..',
      'Occccccccccccccccccccco.',
      'OssssssssoooOcccoooooo..',
      '.oooooooo...Ossssssssso.',
      '.............ooooooooo..',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 11.5, cy: 18.6, rx: 11.5, ry: 2, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    c: 'concrete',
    s: 'stone',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Snack: a puffy blue bag of potato chips with crimped ends, a red band and
// two chips on the front.
// O lit outline, o shade outline, c crimp light, C crimp, k bag light, b bag,
// d bag shade, r band, R band shade, h chip light, y chip, a chip shade, z shadow.

const SNACK: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '....O.O.O.O.O.O.O.o.....',
      '....OcCcCcCcCcCcCcCo....',
      '....oooooooooooooooo....',
      '...OkkkkkkkkkkkkkkbdO...',
      '..OkkbbbbbbbbbbbbbbbdO..',
      '..OkrrrrrrrrrrrrrrrRdo..',
      '..OkrrrrrrrrrrrrrrRRdo..',
      '..Okbbbbbbbbbbbbbbbbdo..',
      '..Okbbbbbhhybbbbbbbbdo..',
      '..Okbbbbhhyyabbbbbbbdo..',
      '..Okbbbbhyyyaahhybbbdo..',
      '..Okbbbbyyyaahyyyabbdo..',
      '..Okbbbbbaaabhyyyaabdo..',
      '..Okbbbbbbbbbyyyaaabdo..',
      '..Okbbbbbbbbbbaaabbbdo..',
      '..Okbbbbbbbbbbbbbbbddo..',
      '...Obbbbbbbbbbbbbbddo...',
      '....OOOOOOOOOOOOOOoo....',
      '....OcCcCcCcCcCcCcCo....',
      '....O.O.O.O.O.O.O.o.....',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.6, rx: 10, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'denim',
    o: 'indigo',
    c: 'sky',
    C: 'denim',
    k: 'sky',
    b: 'denim',
    d: 'indigo',
    r: 'red',
    R: 'maroon',
    h: 'honey',
    y: 'lamp',
    a: 'amber',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Candy: a round striped sweet in a pink wrapper twisted shut at both ends.
// O lit outline, o shade outline, n wrapper, N wrapper shade, m wrapper dark,
// w stripe, g stripe shade, z shadow.

const CANDY: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '..O..................O..',
      '.OnO......OOOO......ONo.',
      '.OnnO....OnnwwO....ONNo.',
      '.OnnnO..OwwnnwwO..ONNNo.',
      '.ONNNnOOnwwnnnwwOONmmmo.',
      '.OnnnnNnnnwwnnnwNmNNNNo.',
      '.ONNNNnnnnnwwnnnNNmmmmo.',
      '.OnnnnnNwnnnwwnNmNNNNNo.',
      '.ONNNNnnwwnnnwgNNNmmmmo.',
      '.OnnnnooOwwnnNgooONNNNo.',
      '.ONNNo...OwwNNo...Ommmo.',
      '.Onno.....oooo.....ONNo.',
      '.ONo................Omo.',
      '..o..................o..',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 19.6, rx: 10.5, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'neonDeep',
    o: 'maroon',
    n: 'neon',
    N: 'neonDeep',
    m: 'maroon',
    w: 'paper',
    g: 'rosy',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Chocolate: a bar of chocolate half out of its purple wrapper, silver foil torn
// at the edge.
// O lit outline, o shade outline, t square bevel, e chocolate, p groove,
// f foil, F foil shade, V wrapper outline, v wrapper light, u wrapper, U wrapper shade,
// w label, y label stripe, z shadow.

const CHOCOLATE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.......OOOOOOOOOO.......',
      '......Ottttpttttpo......',
      '......Oteeepteeepo......',
      '......Oteeepteeepo......',
      '......Oteeepteeepo......',
      '......Oppppppppppo......',
      '......Ottttpttttpo......',
      '......Oteeepteeepo......',
      '......Oteeepteeepo......',
      '.....VfOteFfpteFfV......',
      '.....VffFfffFffFfV......',
      '.....VFFFFFFFFFFFFV.....',
      '.....VvuuuuuuuuuuUV.....',
      '.....VvuuuuuuuuuuUV.....',
      '.....VwwwwwwwwwwwwV.....',
      '.....VyyyyyyyyyyyyV.....',
      '.....VwwwwwwwwwwwwV.....',
      '.....VvuuuuuuuuuuUV.....',
      '.....VvuuuuuuuuuUUV.....',
      '.....VvuuuuuuuuuUUV.....',
      '......VVVVVVVVVVVV......',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.6, rx: 9, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'ember',
    o: 'plum',
    t: 'tan',
    e: 'ember',
    p: 'plum',
    f: 'paper',
    F: 'fog',
    V: 'indigo',
    v: 'mauve',
    u: 'violet',
    U: 'dusk',
    w: 'paper',
    y: 'lamp',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Newspaper: a folded newspaper, masthead, headline, a photo and columns of text,
// more pages showing at the edge.
// O lit outline, o shade outline, w page, g page shade, K print, G text,
// k photo sky, h sun, d hills, P pages behind, p pages behind shade, z shadow.

const NEWSPAPER: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '...OOOOOOOOOOOOOOOOo....',
      '...OwwwwwwwwwwwwwwgoP...',
      '...OwKKKKKKKKKKKKKgoP...',
      '...OwKKKKKKKKKKKKKgoP...',
      '...OwwwwwwwwwwwwwwgoP...',
      '...OwGGGGGGGGGGGGGgoP...',
      '...OwwwwwwwwwwwwwwgoP...',
      '...OwKKKKKKKKKwwwwgoP...',
      '...OwwwwwwwwwwwwwwgoP...',
      '...OwkkkkkwGGGGGGwgoP...',
      '...OwkkhkkwwwwwwwwgoP...',
      '...OwkkkdkwGGGGGGwgoP...',
      '...OwkddddwwwwwwwwgoP...',
      '...OwdddddwGGGGGGwgoP...',
      '...OwwwwwwwwwwwwwwgoP...',
      '...OwGGGGGGGGGGGGwgoP...',
      '...OwwwwwwwwwwwwwwgoP...',
      '...OwGGGGGGGGGwwwwgoP...',
      '...OggggggggggggggggoP..',
      '...ooooooooooooooooopp..',
      '....PPPPPPPPPPPPPPPPpp..',
      '........................',
    ],
    { cx: 12, cy: 22, rx: 11, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    K: 'ink',
    G: 'concrete',
    k: 'sky',
    h: 'honey',
    d: 'denim',
    P: 'fog',
    p: 'concrete',
    z: 'fog',
  },
};

export const STORE_ITEMS: Readonly<Record<string, PixelSprite>> = {
  milk: MILK,
  egg: EGG,
  bread: BREAD,
  money: MONEY,
  drink: DRINK,
  bag: BAG,
  rain: RAIN,
  umbrella: UMBRELLA,
  battery: BATTERY,
  lunch: LUNCH,
  fork: FORK,
  snack: SNACK,
  candy: CANDY,
  chocolate: CHOCOLATE,
  newspaper: NEWSPAPER,
};
