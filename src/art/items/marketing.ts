/** Item icons for the marketing meeting unit. */
import type { PixelSprite } from '../../game/sprites';
import { withShadow } from './draw';

// ---------------------------------------------------------------------------
// Consultant: a man in a blue suit and red tie with a briefcase, a speech
// bubble with a rising bar chart above (he gives business advice).
// P hair outline, E hair / lit face outline, k skin, t skin shade, p face shade
// outline, N eye and suit outline, M mouth, s suit light, S suit, D suit shade,
// W shirt, R tie, m tie shade, y button and clasp, O bubble lit outline,
// o bubble shade outline, w bubble, c bar light, T bar, B base line,
// a case, e case shade, Q case outline, z shadow.

const CONSULTANT: PixelSprite = {
  rows: withShadow(
    [
      '..............OOOOOOOo..',
      '.............Owwwwwwwwo.',
      '.............OwwwwwcTwo.',
      '....PEEEEP...OwwwwwcTwo.',
      '...PEEEEEEP..OwwwcTcTwo.',
      '...PEkkkkEP..OwwwcTcTwo.',
      '...EkkkkktP..OwcTcTcTwo.',
      '...EkNkkNtp..OwBBBBBBwo.',
      '...Ekkkkktp..owooooooo..',
      '...EkkMMktp.o...........',
      '....Ekkkttp.............',
      '.....Ektp...............',
      '.NsSSWRRWSDDN...........',
      'NssSSWRRWSSDDN..eeee....',
      'NssSSSRRSSSDDN..e..e....',
      'NssSSSRmSSSDDNQyaaaaaeQ.',
      'NssSSSSSSSSDDNQaaayaaeQ.',
      'NssSSSSySSSDDNQaaaaaaeQ.',
      'NssSSSSSSSSDDNQeeeeeeeQ.',
      'NNNNNNNNNNNNNNQQQQQQQQQ.',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 11.5, cy: 20.2, rx: 12, ry: 1.6, key: 'z' },
  ),
  legend: {
    P: 'plum',
    E: 'ember',
    k: 'skin',
    t: 'tan',
    p: 'plum',
    N: 'night',
    M: 'ember',
    s: 'sky',
    S: 'denim',
    D: 'indigo',
    W: 'paper',
    R: 'red',
    m: 'maroon',
    y: 'honey',
    O: 'stone',
    o: 'slate',
    w: 'paper',
    c: 'cyan',
    T: 'teal',
    B: 'concrete',
    a: 'amber',
    e: 'ember',
    Q: 'plum',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Questionnaire: a survey sheet with a big question mark at the top and three
// rows of answer boxes, one box filled in on each row.
// O lit outline, o shade outline, w paper, g paper shade, T question mark,
// b empty box, R chosen box, z shadow.

const QUESTIONNAIRE: PixelSprite = {
  rows: withShadow(
    [
      '....OOOOOOOOOOOOOOOo....',
      '....Owwwwwwwwwwwwwgo....',
      '....OwwwwwTTTTwwwwgo....',
      '....OwwwwTTwwTTwwwgo....',
      '....OwwwwwwwTTwwwwgo....',
      '....OwwwwwwTTwwwwwgo....',
      '....Owwwwwwwwwwwwwgo....',
      '....OwwwwwwTTwwwwwgo....',
      '....Owwwwwwwwwwwwwgo....',
      '....OwbbbwRRRwbbbwgo....',
      '....OwbwbwRRRwbwbwgo....',
      '....OwbbbwRRRwbbbwgo....',
      '....Owwwwwwwwwwwwwgo....',
      '....OwbbbwbbbwRRRwgo....',
      '....OwbwbwbwbwRRRwgo....',
      '....OwbbbwbbbwRRRwgo....',
      '....Owwwwwwwwwwwwwgo....',
      '....OwRRRwbbbwbbbwgo....',
      '....OwRRRwbwbwbwbwgo....',
      '....OwRRRwbbbwbbbwgo....',
      '....Owwwwwwwwwwwwwgo....',
      '....oooooooooooooooo....',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 22, rx: 10.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    T: 'teal',
    b: 'concrete',
    R: 'red',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Festival: a round red paper lantern hanging from its cord, glowing warm in
// the middle, gold caps and a red tassel, with two sparkles.
// e cord and cap outline, Y cap light, a cap shade, O lit outline, o shade
// outline, N body light, R body, r body shade, m rib, h glow, H glow core,
// q tassel shade, x sparkle, z shadow.

const FESTIVAL: PixelSprite = {
  rows: withShadow(
    [
      '...........ee...........',
      '...x.......ee...........',
      '..xxx...eYYYaaae........',
      '...x...eYYYYaaaae.......',
      '......ONNRRRRRRRro......',
      '....ONNRmRRRRRRmRrro....',
      '...ONNRmRRRRRRRRmRrro...',
      '..ONNRmRRRhhhhRRRmRrro..',
      '..ONNRmRRhhhhhhRRmRrro..',
      '..ONNRmRhhHHHHhhRmRrro..',
      '..ONNRmRhhHHHHhhRmRrro..',
      '..ONNRmRRhhhhhhRRmRrro..',
      '..ONNRmRRRhhhhRRRmRrro..',
      '...ONNRmRRRRRRRRmRrro...',
      '....ONNRmRRRRRRmRrro....',
      '......ONRRRRRRRrro......',
      '.......eYYYYaaaae.......',
      '........eYYaaaae...x....',
      '...........ee.....xxx...',
      '..........RRqq.....x....',
      '..........RRqq..........',
      '..........RqRq..........',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 22.6, rx: 7, ry: 1.3, key: 'z' },
  ),
  legend: {
    e: 'ember',
    Y: 'honey',
    a: 'amber',
    O: 'maroon',
    o: 'plum',
    N: 'neon',
    R: 'red',
    r: 'maroon',
    m: 'maroon',
    h: 'lamp',
    H: 'honey',
    q: 'maroon',
    x: 'lamp',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Supermarket: a wire shopping cart full of groceries (leafy greens, a can and
// a long loaf of bread), red handle, two wheels.
// L leaf, l leaf shade, R can, r can shade, Y can band, a band shade,
// B loaf light, b loaf, E loaf shade, h handle, O lit metal outline,
// o shade metal outline, w wire, g gap, k wheel, f hub, z shadow.

const SUPERMARKET: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '.......LL...........BE..',
      '......LLLl.........BbE..',
      '.....LLLlll.RRRr..BbE...',
      '.....LLlllm.YYYa.BbE....',
      '.hhh..Lllm..RRRr.bE.....',
      '..hOOOOOOOOOOOOOOOOOOo..',
      '...Owgwgwgwgwgwgwgwgo...',
      '....Ogwgwgwgwgwgwgwgo...',
      '....Ogwgwgwgwgwgwgwo....',
      '.....Owwwwwwwwwwwwwo....',
      '.....Owgwgwgwgwgwgwo....',
      '......Ogwgwgwgwgwgo.....',
      '......ooooooooooooo.....',
      '.......o.........o......',
      '.......o.........o......',
      '....oooooooooooooooo....',
      '.....kkk........kkk.....',
      '.....kfk........kfk.....',
      '.....kkk........kkk.....',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21, rx: 10.5, ry: 1.5, key: 'z' },
  ),
  legend: {
    L: 'leaf',
    l: 'moss',
    m: 'moss',
    R: 'red',
    r: 'maroon',
    Y: 'honey',
    a: 'amber',
    B: 'honey',
    b: 'amber',
    E: 'ember',
    h: 'red',
    O: 'fog',
    o: 'stone',
    w: 'fog',
    g: 'slate',
    k: 'night',
    f: 'concrete',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Bulb: one glowing light bulb with a glowing filament and a grey screw base,
// short rays around it.
// x ray, O lit outline, o shade outline, w highlight, Y glass light, y glass,
// a glass shade, e filament, d thread light, f thread highlight, G thread,
// n thread shade and tip, z shadow.

const BULB: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '...........x............',
      '..x........x.......x....',
      '...x.....OOOOOo...x.....',
      '.......OOYYYyyyoo.......',
      '......OYwwYyyyyyao......',
      '.....OYwwYyyyyyyyao.....',
      '.....OYwYyyyyyyyyao.....',
      '....OYYYyyeyyyeyyyao....',
      'xx..OYYyyyyeyeyyyyao..xx',
      '....OYYyyyyyeyyyyaao....',
      '.....OYyyyyyeyyyyao.....',
      '.....OYyyyyyeyyyaao.....',
      '......OYyyyyeyyaao......',
      '.......OYyyyeyaao.......',
      '........dffffGGn........',
      '........nddddddn........',
      '........dffffGGn........',
      '........nddddddn........',
      '.........nffGGn.........',
      '..........nnnn..........',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21, rx: 7, ry: 1.4, key: 'z' },
  ),
  legend: {
    x: 'lamp',
    O: 'amber',
    o: 'ember',
    w: 'paper',
    Y: 'honey',
    y: 'lamp',
    a: 'amber',
    e: 'ember',
    d: 'stone',
    f: 'fog',
    G: 'concrete',
    n: 'slate',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Celebrity: a smiling star with blond hair, dark sunglasses and a bright pink
// jacket, gold stars twinkling beside the head.
// y star, e hair and lit face outline, H hair, a hair shade, k skin, t skin
// shade, P face shade outline, N sunglasses, s lens glint, M mouth,
// J jacket light, j jacket shade, V jacket outline, W shirt, z shadow.

const CELEBRITY: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.........eeeee..........',
      '..y....eeHHHHHe.........',
      '.yyy..eHHHHHHHae........',
      'yyyyyeHHHHHHHaaae.......',
      '.yyy.eHHkkkkkkHaae......',
      '.y.y.eHkkkkkkkkaae......',
      '.....eaNsNNNNsNNae......',
      '.....ekNNNNkNNNNte...y..',
      '......ekkkkkkkkktP..yyy.',
      '......ekkMkkkMkktP.yyyyy',
      '......ekkkMMMkkktP..yyy.',
      '.......ekkkkkkttP...y.y.',
      '........eekkttPP........',
      '..........ektP..........',
      '.....VJJJJWkkWjjjV......',
      '...VJJJJJJJWWjjjjjjjV...',
      '..VJJJJJJJJJjjjjjjjjjV..',
      '..VJJJJJJJJJjjjjjjjjjV..',
      '..VJJJJJJJJJjjjjjjjjjV..',
      '..VVVVVVVVVVVVVVVVVVVV..',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21, rx: 11, ry: 1.4, key: 'z' },
  ),
  legend: {
    y: 'lamp',
    e: 'ember',
    H: 'honey',
    a: 'amber',
    k: 'skin',
    t: 'tan',
    P: 'plum',
    N: 'ink',
    s: 'sky',
    M: 'ember',
    J: 'neon',
    j: 'neonDeep',
    V: 'maroon',
    W: 'paper',
    z: 'fog',
  },
};

export const MARKETING_ITEMS: Readonly<Record<string, PixelSprite>> = {
  consultant: CONSULTANT,
  questionnaire: QUESTIONNAIRE,
  festival: FESTIVAL,
  supermarket: SUPERMARKET,
  bulb: BULB,
  celebrity: CELEBRITY,
};
