/** Item icons for the street and bus stop unit. */
import type { PixelSprite } from '../../game/sprites';
import { withShadow } from './draw';

// ---------------------------------------------------------------------------
// Street: a town street seen from the side: a tall orange house and a small blue
// shop with an awning, a street lamp on the pavement, the road in front.
// E lit outline, P shade outline, a wall, e wall shade, h lit window and knob,
// d door, O shop lit outline, o shop shade outline, b shop wall, B shop wall shade,
// k shop glass, r awning, R awning shade, w awning stripe and road marks,
// S lantern frame, s lantern shade, Y lantern glow, y lantern, l post, L post shade,
// g pavement, G pavement shade, c kerb, q road, z shadow.

const STREET: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '..EEEEEEEEEP............',
      '..EaaaaaaaeP......SSSs..',
      '..EahhahhaeP......SYys..',
      '..EahhahhaeP......SYys..',
      '..EaaaaaaaePOOOOo.SSSs..',
      '..EaaaaaaaePbbbBo..lL...',
      '..EahhahhaePbkkBo..lL...',
      '..EahhahhaePbkkBo..lL...',
      '..EaaaaaaaePbbbBo..lL...',
      '..EaaaaaaaePrrrrRo.lL...',
      '..EaaaaaaaePrwrwRo.lL...',
      '..EaaddddaePbkkBo..lL...',
      '..EaaddddaePbkkBo..lL...',
      '..EaadddhaePbkkBo..lL...',
      '..EaaddddaePbbbBo..lL...',
      '..EaaddddaePbbbBo..lL...',
      '.gggggggggggggggggllLLg.',
      '.GGGGGGGGGGGGGGGGGGGGGG.',
      '.cccccccccccccccccccccc.',
      '.qqqwwwqqqqwwwqqqqwwwqq.',
      '.qqqqqqqqqqqqqqqqqqqqqq.',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 22.2, rx: 11, ry: 1.4, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    a: 'amber',
    e: 'ember',
    h: 'honey',
    d: 'maroon',
    O: 'denim',
    o: 'indigo',
    b: 'sky',
    B: 'denim',
    k: 'cyan',
    r: 'red',
    R: 'maroon',
    w: 'paper',
    S: 'stone',
    s: 'slate',
    Y: 'paper',
    y: 'honey',
    l: 'concrete',
    L: 'stone',
    g: 'fog',
    G: 'concrete',
    c: 'stone',
    q: 'slate',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Bus: a long red city bus seen from the side, white roof and band, a row of
// windows, the windscreen and headlight at the right.
// O lit outline, o shade outline, w roof and band, g band shade, r body, R body shade,
// M underside, k glass, t glass shade, K windscreen edge, y headlight,
// S tyre outline, s tyre, h hub, z shadow.

const BUS: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '..OOOOOOOOOOOOOOOOOOO...',
      '.OwwwwwwwwwwwwwwwwwwwO..',
      '.OrrrrrrrrrrrrrrrrrrrRo.',
      '.OrkkkrkkkrkkkrkkkrkkKo.',
      '.OrkkkrkkkrkkkrkkkrkkKo.',
      '.OrtttrtttrtttrtttrkkKo.',
      '.OrrrrrrrrrrrrrrrrrttKo.',
      '.Owwwwwwwwwwwwwwwwwwwgo.',
      '.OrrrrrrrrrrrrrrrrrrrRo.',
      '.Orrrrrrrrrrrrrrrrrrryo.',
      '.OrrrSSSSrrrrrrrSSSSrRo.',
      '.oMMSssssSMMMMMSssssSMo.',
      '....SshhsS.....SshhsS...',
      '....SshhsS.....SshhsS...',
      '.....SSSS.......SSSS....',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 18.8, rx: 11.5, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'maroon',
    o: 'plum',
    w: 'paper',
    g: 'fog',
    r: 'red',
    R: 'maroon',
    M: 'maroon',
    k: 'cyan',
    t: 'sky',
    K: 'teal',
    y: 'honey',
    S: 'ink',
    s: 'slate',
    h: 'fog',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Bank: a white temple front, a gold coin in the pediment and a big gold dollar
// sign between the columns.
// O lit outline, o shade outline, w stone, g stone shade, d dark hall,
// h gold light, y gold, a gold shade, z shadow.

const BANK: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '...........OO...........',
      '.........OOwwoo.........',
      '.......OOwwhywwoo.......',
      '.....OOwwwhyyawwwoo.....',
      '...OOwwwwwwyawwwwwwoo...',
      '.OOwwwwwwwwwwwwwwwwwwoo.',
      '.Oggggggggggggggggggggo.',
      '..Owwwwwwwwwwwwwwwwwgo..',
      '..Owgddwgddddddwgddwgo..',
      '..Owgddwgddyyddwgddwgo..',
      '..Owgddwgdyyyyywgddwgo..',
      '..Owgddwgyyddddwgddwgo..',
      '..Owgddwgdyyyydwgddwgo..',
      '..Owgddwgddddyywgddwgo..',
      '..Owgddwgyyyyydwgddwgo..',
      '..Owgddwgddyyddwgddwgo..',
      '..Owgddwgddddddwgddwgo..',
      '..Owwwwwwwwwwwwwwwwwgo..',
      '.Owwwwwwwwwwwwwwwwwwwgo.',
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
    d: 'indigo',
    h: 'honey',
    y: 'lamp',
    a: 'amber',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Station: a station hall with an arched green-blue roof and a fan of glass in
// the gable, a green train standing between two platforms on its tracks.
// O lit outline, o shade outline, c roof light, t roof, pillars and glazing bars,
// T roof shade, k lit glass and windscreen, b glass, w train stripe, glint and rails,
// d dark hall, L train outline, l train, m train shade, h headlights and platform
// edge, p platform, P platform shade, s undercarriage, e sleepers, z shadow.

const STATION: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........OOOOOOOO........',
      '......OOccccccccoo......',
      '....OOctkktkktkktToo....',
      '...OctktkktkktkktktTo...',
      '..OctbbtbbtbbtbbtbbtTo..',
      '..OttbbtbbtbbtbbtbbtTo..',
      '.OtttttttttttttttttttTo.',
      '.OtttddddddddddddddttTo.',
      '.OtttdddLLLLLLLLdddttTo.',
      '.OtttddLllllllllLddttTo.',
      '.OtttddLlkkkkkklLddttTo.',
      '.OtttddLlwkkkkklLddttTo.',
      '.OtttddLllllllllLddttTo.',
      '.OtttddLwwwwwwwwLddttTo.',
      '.OttthhLlhhllhhlLhhttTo.',
      '.OtttppLmmmmmmmmLpPttTo.',
      '.OtttppdssssssssdpPttTo.',
      '.OtttppwddddddddwpPttTo.',
      '.OtttppweeeeeeeewpPttTo.',
      '.oooooooooooooooooooooo.',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.2, rx: 11.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'indigo',
    o: 'deep',
    c: 'cyan',
    t: 'teal',
    T: 'denim',
    b: 'sky',
    w: 'paper',
    d: 'night',
    L: 'moss',
    l: 'leaf',
    m: 'moss',
    k: 'cyan',
    h: 'honey',
    p: 'concrete',
    P: 'stone',
    s: 'slate',
    e: 'ember',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Map: a paper map folded in three, sea and a river, two parks, a red dashed
// route and a red pin at the end of it.
// O lit outline, o shade outline, w paper, g fold, k water, l park, L park shade,
// r route and pin, n pin light, M pin outline, z shadow.

const MAP: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '.OOO.........OOOO.......',
      '.OkkOOO....OOkgwwOOO....',
      '.OkkkwwOOOOwkkgwwwwwOOo.',
      '.OkkkwwwwgwwkkgwMMMwwwo.',
      '.OkkwwwwwgwkkwgMnrrMwwo.',
      '.OkwwwwwwgwkkwMnrrrrMwo.',
      '.OwwwwwwwgkkwwMrrwwrMwo.',
      '.OwwllllwgkkwwMrrwwrMwo.',
      '.OwlllllwkkwwwgMrrrMwwo.',
      '.OwllllLwkkwwwgwMrMwwwo.',
      '.OwwlLLLkkwwwwgwwMwwwwo.',
      '.OwwwwwkkgwwwwgrrwwwwwO.',
      '.OwrrwwkkgrrwwgwwwllllO.',
      '.OwwwwkkwgwwwwgwwllllLo.',
      '.OwwwwkkwgwwwwgwwlLLLLo.',
      '.ooowkkwwgwwwoooowwwwwo.',
      '....ooowwgwoo....ooowwo.',
      '.......oooo.........ooo.',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20, rx: 11, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    k: 'sky',
    l: 'leaf',
    L: 'moss',
    r: 'red',
    n: 'neon',
    M: 'maroon',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Ticket: a yellow ticket with a bite out of each side, a red band, lines of
// print, and a tear-off stub with a bar code after the dotted line.
// E lit outline, P shade outline, h paper light, y paper, a paper shade,
// r band and serial, e print and perforation, K bar code, z shadow.

const TICKET: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '.EEEEEEEEEEEEEEEEEEEEEP.',
      '.EhhhhhhhhhhhhhhehhhhhP.',
      '.EhrrrrrrrrrrrryyyKyKyP.',
      '.EhrrrrrrrrrrrryeyKyKyP.',
      '.EhyyyyyyyyyyyyyyyKyKyP.',
      '..EyyeeeeeeeeyyyeyKyKP..',
      '...EyyyyyyyyyyyyyyKyP...',
      '..EyyeeeeeyyeeeyeyyyyP..',
      '.EyyyyyyyyyyyyyyyyyyyaP.',
      '.EyyyeeeeeeyyyyyeyrrraP.',
      '.EyyyyyyyyyyyyyyyyyyyaP.',
      '.EaaaaaaaaaaaaaaeaaaaaP.',
      '.PPPPPPPPPPPPPPPPPPPPPP.',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 18.4, rx: 11.5, ry: 1.8, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    h: 'paper',
    y: 'honey',
    a: 'lamp',
    r: 'red',
    e: 'ember',
    K: 'ink',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Coin: one big gold coin seen from the front, a dollar sign stamped on it.
// E lit outline, P shade outline, w glint, h rim light, y gold, a gold shade,
// e stamp, z shadow.

const COIN: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '.........EEEEEE.........',
      '.......EEhhhhhhEP.......',
      '......EhwhyyyyyhaP......',
      '.....EhwhyyyyyyyyaP.....',
      '.....EhyyyyyeyyyyaP.....',
      '....EhyyyyyeeeeyyyaP....',
      '....EhyyyyeyeyyyyyaP....',
      '....EhyyyyyeeeyyyyaP....',
      '....EhyyyyyyeyeyyyaP....',
      '....EhyyyyeeeeyyyyaP....',
      '....EhyyyyyyeyyyyyaP....',
      '.....EhyyyyyyyyyyaP.....',
      '.....EhyyyyyyyyyaaP.....',
      '......EayyyyyyaaaP......',
      '.......PPaaaaaaPP.......',
      '.........PPPPPP.........',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12.5, cy: 18.2, rx: 8, ry: 1.8, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    w: 'paper',
    h: 'honey',
    y: 'lamp',
    a: 'amber',
    e: 'ember',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// School: an orange brick school with blue roofs, a clock tower in the middle
// and a red flag on top.
// S flagpole, r flag, R flag shade, B roof outline, n roof light, b roof,
// E lit outline, P shade outline, a brick, e brick shade, C clock rim, w clock face,
// K clock hands, k glass, d door, y door knob, z shadow.

const SCHOOL: PixelSprite = {
  rows: withShadow(
    [
      '...........Srrrr........',
      '...........SrrrR........',
      '..........BnbB..........',
      '.........BnnbbB.........',
      '........BnnbbbbB........',
      '.......BnnbbbbbbB.......',
      '......BBBBBBBBBBBB......',
      '.......EaaCCCCaaP.......',
      '.......EaCwKwwCaP.......',
      '.......EaCwKwwCaP.......',
      '.......EaCwKKwCaP.......',
      '.BBBBBBEaCwwwwCaPBBBBBB.',
      '.BnnbbbEaaCCCCaaPnbbbbB.',
      '.BBBBBBEaaaaaaaaPBBBBBB.',
      '..EaaaaaaaaaaaaaaaaaeP..',
      '..EakkaakaaddaakaakkeP..',
      '..EakkaakaddddakaakkeP..',
      '..EaaaaaaaddddaaaaaaeP..',
      '..EakkaaaaddydaaaakkeP..',
      '..EakkaaaaddddaaaakkeP..',
      '..PPPPPPPPPPPPPPPPPPPP..',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.2, rx: 11, ry: 1.6, key: 'z' },
  ),
  legend: {
    S: 'stone',
    r: 'red',
    R: 'maroon',
    B: 'indigo',
    n: 'sky',
    b: 'denim',
    E: 'ember',
    P: 'plum',
    a: 'amber',
    e: 'ember',
    C: 'ember',
    w: 'paper',
    K: 'ink',
    k: 'cyan',
    d: 'maroon',
    y: 'honey',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Hospital: a white hospital, a tall middle block with a big red cross, two
// lower wings, blue windows and a red canopy over the glass doors.
// O lit outline, o shade outline, w wall, g wall shade, G deep shade, r cross and
// canopy, k glass, b glass in shade, d door frame, z shadow.

const HOSPITAL: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.......OOOOOOOOOO.......',
      '.......Owwwrrwwgo.......',
      '.......Owwwrrwwgo.......',
      '.......Owrrrrrrgo.......',
      '.......Owrrrrrrgo.......',
      '.......Owwwrrwwgo.......',
      '.......Owwwrrwwgo.......',
      '..OOOOOOwwwwwwwgoOOOOo..',
      '..OwwwwgwwwwwwwgGggggo..',
      '..OwkkwgwkkwwkkgGgbbgo..',
      '..OwkkwgwkkwwkkgGgbbgo..',
      '..OwwwwgwwwwwwwgGggggo..',
      '..OwkkwgwkkwwkkgGgbbgo..',
      '..OwkkwgwkkwwkkgGgbbgo..',
      '..OwwwwgwwwwwwwgGggggo..',
      '..OwwwwgwrrrrrrgGggggo..',
      '..OwkkwgwwdkkdwgGgbbgo..',
      '..OwkkwgwwdkkdwgGgbbgo..',
      '..OwwwwgwwdkkdwgGggggo..',
      '..oooooooooooooooooooo..',
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
    G: 'concrete',
    r: 'red',
    k: 'cyan',
    b: 'sky',
    d: 'slate',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Library: a purple library with a big open book on its front, shelves of
// coloured books in the windows either side of the door.
// V outline, m trim, u wall, U wall shade, w page, G print, g gutter, r book cover
// and red spines, y, l, k spines, d shelf and door, h door glass, z shadow.

const LIBRARY: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.VVVVVVVVVVVVVVVVVVVVVV.',
      '.VmmmmmmmmmmmmmmmmmmmUV.',
      '..VuuwwwwuuuuuuwwwwuUV..',
      '..VuuwwwwwwuuwwwwwwuUV..',
      '..VuuwGGwwwwwwwwGGwuUV..',
      '..VuuwwwGGwggwGGwwwuUV..',
      '..VuurwwwwGggGwwwwruUV..',
      '..VuurrrwwwggwwwrrruUV..',
      '..VuuuurrrwggwrrruuuUV..',
      '..VuuuuuuurrrruuuuuuUV..',
      '..VmmmmmmmmmmmmmmmmmUV..',
      '..VurylkruuuuuulkrylUV..',
      '..VurylkruddddulkrylUV..',
      '..VudddddudhhdudddddUV..',
      '..VuklyrkudhhduyrlkyUV..',
      '..VuklyrkudddduyrlkyUV..',
      '..VuddddduddhdudddddUV..',
      '..VuuuuuuuddddduuuuuUV..',
      '..VuuuuuuuddddduuuuuUV..',
      '..VVVVVVVVVVVVVVVVVVVV..',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.2, rx: 11, ry: 1.6, key: 'z' },
  ),
  legend: {
    V: 'indigo',
    m: 'mauve',
    u: 'violet',
    U: 'dusk',
    w: 'paper',
    G: 'concrete',
    g: 'fog',
    r: 'red',
    y: 'lamp',
    l: 'leaf',
    k: 'cyan',
    d: 'night',
    h: 'honey',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Museum: a sandstone museum up two wide steps, a green copper dome on top,
// a red and a blue banner hanging between its columns and a dark doorway.
// D dome outline, n dome light, c dome, C dome shade, E lit outline, P shade outline,
// k stone, t stone shade, r banner, R banner shade, b banner, B banner shade,
// w banner mark, d dark doorway, e door, z shadow.

const MUSEUM: PixelSprite = {
  rows: withShadow(
    [
      '...........DD...........',
      '.........DDnnDD.........',
      '.......DDnnccccDD.......',
      '......DnnccccccccD......',
      '......DncccccccCCD......',
      '..EEEEEEEEEEEEEEEEEEEP..',
      '..EkkkkkkkkkkkkkkkkktP..',
      '..EttttttttttttttttttP..',
      '..EktrrRktttttktbbBktP..',
      '..EktrrRktddddktbbBktP..',
      '..EktrwRktddddktbwBktP..',
      '..EktrrRktdeedktbbBktP..',
      '..EktrrRktdeedktbbBktP..',
      '..EktrdRktdeedktbdBktP..',
      '..EktdddktdeedktdddktP..',
      '..EkkkkkkkkkkkkkkkkktP..',
      '..EttttttttttttttttttP..',
      '.EkkkkkkkkkkkkkkkkkkktP.',
      '.EttttttttttttttttttttP.',
      '.PPPPPPPPPPPPPPPPPPPPPP.',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.2, rx: 11.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    D: 'moss',
    n: 'cyan',
    c: 'teal',
    C: 'moss',
    E: 'ember',
    P: 'plum',
    k: 'skin',
    t: 'tan',
    r: 'red',
    R: 'maroon',
    b: 'sky',
    B: 'denim',
    w: 'paper',
    d: 'plum',
    e: 'ember',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Sign: a blue sign board on a pole, a white border and a big white arrow
// pointing right.
// O lit outline, o shade outline, w border and arrow, b board, S pole lit outline,
// g pole light, c pole, z shadow.

const SIGN: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '...OOOOOOOOOOOOOOOOOO...',
      '..OwwwwwwwwwwwwwwwwwwO..',
      '..OwbbbbbbbbbbbbbbbbwO..',
      '..OwbbbbbbbbbbwbbbbbwO..',
      '..OwbbbbbbbbbbwwbbbbwO..',
      '..OwbbwwwwwwwwwwwbbbwO..',
      '..OwbbwwwwwwwwwwwwbbwO..',
      '..OwbbwwwwwwwwwwwbbbwO..',
      '..OwbbbbbbbbbbwwbbbbwO..',
      '..OwbbbbbbbbbbwbbbbbwO..',
      '..OwbbbbbbbbbbbbbbbbwO..',
      '..OwwwwwwwwwwwwwwwwwwO..',
      '...oooooooSgcoooooooo...',
      '..........Sgco..........',
      '..........Sgco..........',
      '..........Sgco..........',
      '..........Sgco..........',
      '..........Sgco..........',
      '..........Sgco..........',
      '.......Sgggggccco.......',
      '.......oooooooooo.......',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.6, rx: 8, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    b: 'denim',
    S: 'stone',
    g: 'fog',
    c: 'concrete',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Road: an open country road running away to the setting sun, a dashed white
// centre line, grass on both sides and far hills.
// O lit outline, o shade outline, k sky, w cloud and centre line, h sun, m hills,
// l grass, L grass shade, S road edge, s road, z shadow.

const ROAD: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '..OOOOOOOOOOOOOOOOOOOO..',
      '.Okkkkkkkkkkkkkkkkkkkko.',
      '.Okkwwwkkkkkkkkkkkkkkko.',
      '.Okwwwwwwkkkkkkkwwwkkko.',
      '.Okkkkkkkkhhhhkkkkkkkko.',
      '.Okmmmkkkhhwwhhkkkkmmko.',
      '.Ommmmmkhhhwwhhhkmmmmmo.',
      '.Ollllllllssssllllllllo.',
      '.OllllllllswwsllllllLlo.',
      '.OlllllllSswwsSlllllllo.',
      '.OlllllllSssssSlllllllo.',
      '.OllLlllSsswwssSllllllo.',
      '.OlllllSssswwsssSlllllo.',
      '.OlllllSssswwsssSlllLlo.',
      '.OllllSssssssssssSllllo.',
      '.OlllSssssswwsssssSLLLo.',
      '.OllSsssssswwssssssSLLo.',
      '.OlSssssssswwsssssssSLo.',
      '..oooooooooooooooooooo..',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.2, rx: 11, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'indigo',
    o: 'night',
    k: 'sky',
    w: 'paper',
    h: 'honey',
    m: 'teal',
    l: 'leaf',
    L: 'moss',
    S: 'concrete',
    s: 'slate',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Taxi: a small yellow taxi seen from the side, a white light on the roof and
// a black-and-white checker band along the doors.
// E lit outline, P shade outline, h body light, y body, a body shade, k glass,
// b glass shade, K roof light frame, checker and tyre outline, w roof light,
// checker and headlight, r tail light, s tyre, g hub, z shadow.

const TAXI: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '.........KKKKKK.........',
      '.........KwwwwK.........',
      '.......EEEEEEEEEEE......',
      '......EhhhhhhhhhhhP.....',
      '.....EhkkkkkykkkkkyP....',
      '....EhkkkkkkykkkkkkyP...',
      '.EEEhbbbbbbbybbbbbbbyEE.',
      '.EhhhhhhhhhhhhhhhhhhhhP.',
      '.EyKwKwKwKwKwKwKwKwKwyP.',
      '.EryyyyyyyyyyyyyyyyyywP.',
      '.EyyKKKKyyyyyyyyKKKKyyP.',
      '.EaKssssKaaaaaaKssssKaP.',
      '..PKsggsKPPPPPPKsggsKP..',
      '...KsggsK......KsggsK...',
      '....KKKK........KKKK....',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 18.8, rx: 11.5, ry: 1.8, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    h: 'honey',
    y: 'lamp',
    a: 'amber',
    k: 'cyan',
    b: 'sky',
    K: 'ink',
    w: 'paper',
    r: 'red',
    s: 'slate',
    g: 'fog',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Bridge: a grey stone bridge seen from the side, a railing along the deck and
// two open arches, standing in blue water.
// O lit outline, o shade outline, w deck light, g stone light, c stone and railing,
// s arch rim, S stone shade, d reflection, k water, x ripple, z shadow.

const BRIDGE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '.cccccccccccccccccccccc.',
      '.c..c..c..c..c..c..c..c.',
      '.OOOOOOOOOOOOOOOOOOOOOo.',
      '.Owwwwwwwwwwwwwwwwwwwgo.',
      '.Oggggggggggggggggggggo.',
      '.OcccccccccccccccccccSo.',
      '.Occcs...sccccs...sccSo.',
      '.Occs.....sccs.....scSo.',
      '.Occ.......cS.......cSo.',
      '.Occ.......cS.......cSo.',
      '.Occ.......cS.......cSo.',
      '.kddkkkkxxkddkkxxkkkddk.',
      '.kkdkkkkkkkkdkkkkkkkkdk.',
      '..kkkxxxkkkkkkkkxxxkkk..',
      '....kkkkkkxxxkkkkkkk....',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20.2, rx: 9, ry: 1.2, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    c: 'concrete',
    s: 'stone',
    S: 'stone',
    d: 'denim',
    k: 'sky',
    x: 'cyan',
    z: 'fog',
  },
};

export const STREET_ITEMS: Readonly<Record<string, PixelSprite>> = {
  street: STREET,
  bus: BUS,
  bank: BANK,
  station: STATION,
  map: MAP,
  ticket: TICKET,
  coin: COIN,
  school: SCHOOL,
  hospital: HOSPITAL,
  library: LIBRARY,
  museum: MUSEUM,
  sign: SIGN,
  road: ROAD,
  taxi: TAXI,
  bridge: BRIDGE,
};
