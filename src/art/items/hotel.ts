/** Item icons for the hotel unit. */
import type { PixelSprite } from '../../game/sprites';
import { withShadow } from './draw';

// ---------------------------------------------------------------------------
// Hotel: a pink hotel at night, every window lit, a striped awning over the
// glass doors and a lit "H" sign on the roof.
// K sign plate, h window and sign light, y window and sign, O lit outline,
// o shade outline, w cornice, g cornice shade, p wall, m wall shade, R awning top,
// r awning stripe, d door frame, z shadow.

const HOTEL: PixelSprite = {
  rows: withShadow(
    [
      '........KKKKKKKK........',
      '........KhyKKhyK........',
      '........KhyKKhyK........',
      '........KhyyyyyK........',
      '........KhyKKhyK........',
      '........KhyKKhyK........',
      '...OOOOOKKKKKKKKOOOOo...',
      '...Owwwwwwwwwwwwwwwgo...',
      '...Opppppppppppppppmo...',
      '...Ophypphypphypphymo...',
      '...Ophypphypphypphymo...',
      '...Opppppppppppppppmo...',
      '...Ophypphypphypphymo...',
      '...Ophypphypphypphymo...',
      '...Opppppppppppppppmo...',
      '...OpppRRRRRRRRRRppmo...',
      '...Oppprrwwrrwwrrppmo...',
      '...Ophypdhyddhydphymo...',
      '...Ophypdhyddhydphymo...',
      '...Oppppdhyddhydpppmo...',
      '...oooooooooooooooooo...',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.2, rx: 11, ry: 1.6, key: 'z' },
  ),
  legend: {
    K: 'indigo',
    h: 'honey',
    y: 'lamp',
    O: 'mauve',
    o: 'plum',
    w: 'paper',
    g: 'fog',
    p: 'rosy',
    m: 'mauve',
    R: 'maroon',
    r: 'red',
    d: 'maroon',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Bar: a mug of beer with a head of foam and a cocktail glass with a pink drink
// and an olive on a pick.
// O lit outline, o shade outline, w foam and glass light, g foam and glass shade,
// E mug lit outline, P mug shade outline, h beer light, y beer, a beer shade,
// e beer dark, S pick, n drink, N drink shade, l olive, L olive shade,
// r olive filling, G foot shade, z shadow.

const BAR: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '......................S.',
      '....OOOOo............S..',
      '...Owwwwwo..........S...',
      '..Owwwwwwo.OOOOOOOOSOOOo',
      '..Owwgwwgo.OwwwwwwSwwwwo',
      '..oEwhyyaP..OnnllSnnnno.',
      'EEEEhhyyaP...OllrLnnNo..',
      'E..EhyyyaP....OLLnNNo...',
      'E..EhyyyaP.....OnNNo....',
      'E..EhyyyaP......ONo.....',
      'E..EhyyyaP......Ogo.....',
      'PPPEhyyyaP......Ogo.....',
      '...EhyyyaP......Ogo.....',
      '...EhyyyaP......Ogo.....',
      '...EhyyyaP......Ogo.....',
      '...EhyyaaP......Ogo.....',
      '...EyyaaaP...OOOOgoooo..',
      '...EaaaaeP..OwwwwgggGGo.',
      '...PPPPPPP...ooooooooo..',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 11.5, cy: 20.8, rx: 11, ry: 1.7, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    E: 'ember',
    P: 'plum',
    h: 'honey',
    y: 'lamp',
    a: 'amber',
    e: 'ember',
    S: 'stone',
    n: 'neon',
    N: 'neonDeep',
    l: 'leaf',
    L: 'moss',
    r: 'red',
    G: 'concrete',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Pool: a swimming pool seen from above, a tiled edge, a steel ladder, a lane
// rope of red and white floats and a life ring on the water.
// O lit outline, o shade outline, w tile light and floats, g tile, G tile shade,
// D pool wall, d wall shade and ring hole, k water, x ripple, S ladder,
// r floats and ring, z shadow.

const POOL: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '.OOOOOOOOOOOOOOOOOOOOOo.',
      '.OwwwwwwwwwwwSwwwwSwwgo.',
      '.OwggggggggggSggggSggGo.',
      '.OwgDDDDDDDDDSSSSSSDgGo.',
      '.OwgdkkkkkkkkSkkkkSkgGo.',
      '.OwgdkxxxkkkkSSSSSSkgGo.',
      '.OwgdkkkkkkkkSkkkkSkgGo.',
      '.OwgdrrwwrrwwrrwwrrwgGo.',
      '.OwgdkkkkkkkkkkxxxkkgGo.',
      '.OwgdkkwrrwkkkkkkkkkgGo.',
      '.OwgdkwwrrwwkkkkkkkkgGo.',
      '.OwgdkrrddrrkkxxxkkkgGo.',
      '.OwgdkrrddrrkkkkkkkkgGo.',
      '.OwgdkwwrrwwkkkkkxxkgGo.',
      '.OwgdkkwrrwkkkkkkkkkgGo.',
      '.OwggggggggggggggggggGo.',
      '.OgGGGGGGGGGGGGGGGGGGGo.',
      '.oooooooooooooooooooooo.',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.2, rx: 11.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    G: 'concrete',
    D: 'indigo',
    d: 'denim',
    k: 'sky',
    x: 'cyan',
    S: 'slate',
    r: 'red',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Gym: a dumbbell lying on its side, red weight plates, small dark end plates
// and a steel grip.
// M plate lit outline, P plate shade outline, n plate light, r plate, R plate shade,
// K end plate outline, t end plate light, s end plate, O grip lit outline,
// o grip shade outline, w grip light, g grip, c grip shade, z shadow.

const GYM: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '.....MMM........MMM.....',
      '....MnnnP......MnnnP....',
      '.KKKMnrrP......MnrrPKKK.',
      '.KttMnrrP......MnrrPttK.',
      '.KssMnrrPOOOOOOMnrrPssK.',
      'OKssMnrrPwwwwwwMnrrPssKO',
      'cKssMnrrPggggggMnrrPssKc',
      'oKssMnrrPccccccMnrrPssKo',
      '.KssMnrrPooooooMnrrPssK.',
      '.KssMnrrP......MnrrPssK.',
      '.KKKMrrRP......MrrRPKKK.',
      '....MRRRP......MRRRP....',
      '.....PPP........PPP.....',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 18.6, rx: 11, ry: 1.8, key: 'z' },
  ),
  legend: {
    M: 'maroon',
    P: 'plum',
    n: 'neon',
    r: 'red',
    R: 'maroon',
    K: 'ink',
    t: 'stone',
    s: 'slate',
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    c: 'concrete',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Bathroom: a white bathtub on brass feet, full of foam, a brass tap over it
// and a soap bubble floating up.
// b foam outline and bubble, x foam glint, E brass lit outline, P brass shade
// outline, y brass, a brass shade, O lit outline, o shade outline, w tub and foam,
// g tub shade, G tub deep shade, z shadow.

const BATHROOM: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.......b................',
      '......b.b..b..EEEEE.....',
      '.......b.....EyyyyaP....',
      '....bbb..bb..EyPPEaP....',
      '...bwwwbbwwb.EP..EaP....',
      '..bwwxwwwwwwb....EaP....',
      '..bwwwwwwxwwwb...EaP....',
      '.OOOOOOOOOOOOOOOOOOOOOo.',
      '.OwwwwwwwwwwwwwwwwwwwGo.',
      '.ooOwwwwwwwwwwwwwgggooo.',
      '...Owwwwwwwwwwwwwgggo...',
      '...OwwwwwwwwwwwwwggGo...',
      '...OwwwwwwwwwwwwgggGo...',
      '...OwwwwwwwwwwwwggGGo...',
      '....OwwwwwwwwwwgggGo....',
      '.....OggggggggggGGo.....',
      '....EyPooooooooooEyP....',
      '...EyaP..........EyaP...',
      '...PPPP..........PPPP...',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.2, rx: 11, ry: 1.8, key: 'z' },
  ),
  legend: {
    b: 'sky',
    x: 'cyan',
    E: 'ember',
    P: 'plum',
    y: 'lamp',
    a: 'amber',
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    G: 'concrete',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Lock: a closed padlock, a brass body with a keyhole and a steel shackle.
// O shackle lit outline, o shackle shade outline, w steel light, g steel,
// c steel shade, E body lit outline, P body shade outline, h brass light, y brass,
// a brass shade, e brass dark, K keyhole, z shadow.

const LOCK: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.........OOOOOO.........',
      '.......OOwwwwwwOo.......',
      '......Owwggggggcco......',
      '......OwgoooooOgco......',
      '......Owgo....Ogco......',
      '......Owgo....Ogco......',
      '......Owgo....Ogco......',
      '......Owgo....Ogco......',
      '......Owgo....Ogco......',
      '....EEEEEEEEEEEEEEEP....',
      '...EhhhhhhhhhhhhhhyaP...',
      '...EhyyyyyyyyyyyyyyaP...',
      '...EhyyyyyyKKyyyyyaaP...',
      '...EhyyyyyKKKKyyyyaaP...',
      '...EhyyyyyKKKKyyyyaaP...',
      '...EhyyyyyyKKyyyyyaaP...',
      '...EhyyyyyyKKyyyyyaaP...',
      '...EhyyyyyyyyyyyyaaaP...',
      '...EyaaaaaaaaaaaaaaeP...',
      '....PPPPPPPPPPPPPPPP....',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21, rx: 10, ry: 1.7, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    c: 'concrete',
    E: 'ember',
    P: 'plum',
    h: 'honey',
    y: 'lamp',
    a: 'amber',
    e: 'ember',
    K: 'plum',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Shower: a steel shower on its pipe, a round head spraying water, a tap with
// a red and a blue mark on the riser.
// O lit outline, o shade outline, w steel light, g steel, c steel shade, s steel
// dark, K nozzles, x water light, k water and cold mark, d water shade,
// r hot mark, z shadow.

const SHOWER: PixelSprite = {
  rows: withShadow(
    [
      '........OOOOOOOOOOOOOo..',
      '.......Owwwwwwwwwwwwgco.',
      '.......Ogccccccccccccco.',
      '.......OgcoooooooooOgco.',
      '.......Ogco........Ogco.',
      '.....OOwggccoo.....Ogco.',
      '...OOwwgggggcccoo..Ogco.',
      '..Owwggggggggcccso.Ogco.',
      '..ocKcKcKcKcKcKcKo.Ogco.',
      '...oooooooooooooo..Ogco.',
      '...xk......xk......Ogco.',
      '...kd..xk..kd..xk..Ogco.',
      '...kd..kd..kd..kd.OOOOOo',
      '.......kd......kd.Owrrco',
      '...xk......xk.....Owkkco',
      '...kd..xk..kd..xk.oooooo',
      '...kd..kd..kd..kd..Ogco.',
      '.......kd......kd..Ogco.',
      '...xk......xk......Ogco.',
      '...kd..xk..kd..xk..Ogco.',
      '...kd..kd..kd..kd..oooo.',
      '.......kd......kd.......',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 22.6, rx: 10.5, ry: 1.2, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    c: 'concrete',
    s: 'stone',
    K: 'slate',
    x: 'cyan',
    k: 'sky',
    d: 'denim',
    r: 'red',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Air conditioner: a white unit high on the wall, a green light, an open vent,
// cold air curling down and a snowflake.
// O lit outline, o shade outline, w case, g case shade, G case deep shade, S vent,
// l light, k cold air, T snowflake, x snowflake heart, z shadow on the wall.

const AIR_CONDITIONER: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '..OOOOOOOOOOOOOOOOOOOo..',
      '.Owwwwwwwwwwwwwwwwwwwgo.',
      '.Owwwwwwwwwwwwwwwwwwwgo.',
      '.Owwwwwwwwwwwwwwwwlwwgo.',
      '.Owwwwwwwwwwwwwwwwwwwgo.',
      '.Oggggggggggggggggggggo.',
      '.OwSSSSSSSSSSSSSSSSSSgo.',
      '.OwggggggggggggggggggGo.',
      '..oooooooooooooooooooo..',
      '........................',
      '....kk.....T......kk....',
      '...kk....T.T.T...kk.....',
      '...kk.....TTT....kk.....',
      '....kk..TTTxTTT...kk....',
      '.....kk...TTT......kk...',
      '.....kk..T.T.T.....kk...',
      '....kk.....T......kk....',
      '...kk............kk.....',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 10.6, rx: 10.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    G: 'concrete',
    S: 'slate',
    l: 'leaf',
    k: 'sky',
    T: 'teal',
    x: 'cyan',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Towel: a yellow towel with two white stripes and a fringe, hanging over a
// steel rail, its shorter back half showing on the right.
// O lit outline, o shade outline, h towel light, y towel, a towel shade, back
// half and fringe, e back half shade, w stripe, g stripe shade, K rail end,
// S rail light, s rail shade, z shadow.

const TOWEL: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '....OOOOOOOOOOOOOOOo....',
      'K..Ohhhhhhhhhhhhaoaao..K',
      'KSSOhyyyyyyyyyyyaoaeoSSK',
      'KssOhyyyyyyyyyyyaoaeossK',
      'K..Ohyyyyyyyyyyyaoaeo..K',
      '...Ohyyyyyyyyyyyaoaeo...',
      '...Ohyyyyyyyyyyyaoaeo...',
      '...Ohyyyyyyyyyyyaoaeo...',
      '...Ohyyyyyyyyyyyaoaeo...',
      '...Ohyyyyyyyyyyyaoaeo...',
      '...Ohyyyyyyyyyyyaoaeo...',
      '...Ohyyyyyyyyyyyaoaeo...',
      '...Ohyyyyyyyyyyyaoooo...',
      '...Owwwwwwwwwwwwgo......',
      '...Ohyyyyyyyyyyyao......',
      '...Owwwwwwwwwwwwgo......',
      '...Ohyyyyyyyyyyyao......',
      '...Ohyyyyyyyyyyaao......',
      '...ooooooooooooooo......',
      '...a.a.a.a.a.a.a.a......',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 22, rx: 9, ry: 1.4, key: 'z' },
  ),
  legend: {
    O: 'ember',
    o: 'plum',
    h: 'honey',
    y: 'lamp',
    a: 'amber',
    e: 'ember',
    w: 'paper',
    g: 'fog',
    K: 'slate',
    S: 'fog',
    s: 'stone',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Wireless: the Wi-Fi sign, three blue arcs fanning up from a dot.
// O lit outline, o shade outline, x arc light, k arc, z shadow.

const WIRELESS: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '.......OOOOOOOOOO.......',
      '....OOOxxxxxxxxxxOOO....',
      '..OOxxxkkkkkkkkkkxxxOO..',
      '.OxxkkkooooooooookkkxxO.',
      'Oxkkkoo..........ookkkxo',
      'okkoo....OOOOOO....ookko',
      '.oo...OOOxxxxxxOOO...oo.',
      '....OOxxxkkkkkkxxxOO....',
      '...OxxkkkooooookkkxxO...',
      '...okkkoo......ookkko...',
      '....ooo..........ooo....',
      '.........OOOOOO.........',
      '.......OOxxxxxxOO.......',
      '......OxxkkkkkkxxO......',
      '......okkkooookkko......',
      '.......ooo....ooo.......',
      '........................',
      '..........OOOO..........',
      '.........Oxxkko.........',
      '.........Oxkkko.........',
      '..........oooo..........',
      '........................',
    ],
    { cx: 12, cy: 23, rx: 7, ry: 1.2, key: 'z' },
  ),
  legend: {
    O: 'denim',
    o: 'indigo',
    x: 'cyan',
    k: 'sky',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Laundry: a white front-loading washing machine, clothes turning in soapy
// water behind the round door, a display and two buttons on top.
// O lit outline, o shade outline, w case and glint, g case shade, c case deep
// shade, D display, r button and red shirt, l button, S door ring, d drum,
// x foam, k water, y yellow shirt, z shadow.

const LAUNDRY: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '...OOOOOOOOOOOOOOOOOo...',
      '...Owwwwwwwwwwwwwwwgo...',
      '...OwDDDDDwwwwwrwlwgo...',
      '...OwDDDDDwwwwwwwwwgo...',
      '...Ogggggggggggggggco...',
      '...Owwwwwwwwwwwwwwwgo...',
      '...OwwwwwwSSSSwwwwwgo...',
      '...OwwwwSSddddSSwwwgo...',
      '...OwwwSdwwdddddSwwgo...',
      '...OwwwSdwddddddSwwgo...',
      '...OwwSdddddrrrddSwgo...',
      '...OwwSxxkkxxrrrrSwgo...',
      '...OwwSkkkkkkkkkkSwgo...',
      '...OwwSkkyykkkkkkSwgo...',
      '...OwwwSyyykkkkkSwwgo...',
      '...OwwwSkkkkkkxkSwwgo...',
      '...OwwwwSSkkkkSSwwwgo...',
      '...OwwwwwwSSSSwwwwwgo...',
      '...Ogggggggggggggggco...',
      '...oooooooooooooooooo...',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.2, rx: 11, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    c: 'concrete',
    D: 'denim',
    r: 'red',
    l: 'leaf',
    S: 'stone',
    d: 'indigo',
    x: 'cyan',
    k: 'sky',
    y: 'lamp',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Iron: a purple clothes iron seen from the side, its point to the left, a
// steel soleplate, a yellow dial and the cord at the back.
// V lit and shade outline, v body light, u body, U body shade, y dial, a dial
// shade, O plate lit outline, o plate shade outline, w plate light, g plate,
// c plate shade, K cord, z shadow.

const IRON: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '.........VVVVVVVVVV.....',
      '.......VVvvvvvvvvvvVV...',
      '......VvuuuuuuuuuuuuUV..',
      '......VvuuVVVVVVVVuuUVK.',
      '.....VvuuV.......VuuUV.K',
      '....VvuuuV.......VuuUV.K',
      '...VvuuuuuVVVVVVVVuuUV.K',
      '...VvuuuuuuuuuuuuuuuUV.K',
      '..VvuuuuuuuuyyuuuuuuUV.K',
      '..VvuuuuuuuuyauuuuuuUV.K',
      '.VvuuuuuuuuuuuuuuuuuUV.K',
      '.VvuuuuuuuuuuuuuuuuUUV.K',
      'VvuuuuuuuuuuuuuuuuuUUV..',
      'VUUUUUUUUUUUUUUUUUUUUV..',
      'Owwgggggggggggggggggco..',
      'Occcccccccccccccccccco..',
      '.oooooooooooooooooooo...',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 11.5, cy: 20.2, rx: 11.5, ry: 1.7, key: 'z' },
  ),
  legend: {
    V: 'indigo',
    v: 'mauve',
    u: 'violet',
    U: 'dusk',
    y: 'lamp',
    a: 'amber',
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    c: 'concrete',
    K: 'slate',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Bell: a brass call bell on a dark base, the button on top, ringing.
// E lit outline, P shade outline, h brass light, y brass, a brass shade, e brass
// dark, w glint, K base outline, t base light, s base, n base shade, A ring marks,
// z shadow.

const BELL: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '.......A..EEEE..A.......',
      '...A...A.EhhyaP.A...A...',
      '....A....EhyyaP....A....',
      '.....A....EyaP....A.....',
      '........EEEEEEEP........',
      '......EEhhhhyyyaPP......',
      '.AA..EhhwwhhyyyyyaP..AA.',
      '....EhhwwhhyyyyyyyaP....',
      '....EhhwhhyyyyyyyyaP....',
      '...EhhhhhyyyyyyyyyaaP...',
      '...EhhhhyyyyyyyyyyaaP...',
      '...EhhhyyyyyyyyyyaaaP...',
      '...EhhyyyyyyyyyyyaaeP...',
      '...EyyyyyyyyyyyaaaeeP...',
      '..KKKKKKKKKKKKKKKKKKKK..',
      '.KttssssssssssssssssnnK.',
      '.KsssssssssssssssssnnnK.',
      '..KKKKKKKKKKKKKKKKKKKK..',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.4, rx: 11.5, ry: 1.7, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    h: 'honey',
    y: 'lamp',
    a: 'amber',
    e: 'ember',
    w: 'paper',
    K: 'ink',
    t: 'stone',
    s: 'slate',
    n: 'night',
    A: 'amber',
    z: 'fog',
  },
};

export const HOTEL_ITEMS: Readonly<Record<string, PixelSprite>> = {
  hotel: HOTEL,
  bar: BAR,
  pool: POOL,
  gym: GYM,
  bathroom: BATHROOM,
  lock: LOCK,
  shower: SHOWER,
  air_conditioner: AIR_CONDITIONER,
  towel: TOWEL,
  wireless: WIRELESS,
  laundry: LAUNDRY,
  iron: IRON,
  bell: BELL,
};
