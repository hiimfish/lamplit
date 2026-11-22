/** Item icons for the office unit. */
import type { PixelSprite } from '../../game/sprites';
import { withShadow } from './draw';

// ---------------------------------------------------------------------------
// Drawer: a wooden drawer unit, its top drawer pulled open with papers and a
// yellow folder standing in it.
// E lit outline, P shade outline, h wood light, a wood, e wood shade, n inside,
// w paper, g paper shade and handle, y folder, s handle shade, z shadow.

const DRAWER: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '....EEEEEEEEEEEEEEEP....',
      '....EhhhhhhhhhhhhhaP....',
      '....EannnnnnnnnnnneP....',
      '....EanwwwnyyynwwweP....',
      '....EanwwgnyyanwwgeP....',
      '..EEEEEEEEEEEEEEEEEEEP..',
      '..EhhhhhhhhhhhhhhhhhaP..',
      '..EhaaaaaaaaaaaaaaaaeP..',
      '..EhaaaaaaggggaaaaaaeP..',
      '..EhaaaaaasssseaaaaaeP..',
      '..EaaaaaaaaaaaaaaaaeeP..',
      '..PPPPPPPPPPPPPPPPPPPP..',
      '....EeeeeeeeeeeeeeeP....',
      '....EhaaaaaaaaaaaaeP....',
      '....EhaaaaggggaaaaeP....',
      '....EhaaaasssseaaaeP....',
      '....EeeeeeeeeeeeeeeP....',
      '....EhaaaaaaaaaaaaeP....',
      '....EhaaaaggggaaaaeP....',
      '....EhaaaasssseaaaeP....',
      '....PPPPPPPPPPPPPPPP....',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.8, rx: 10.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    h: 'honey',
    a: 'amber',
    e: 'ember',
    n: 'night',
    w: 'paper',
    g: 'fog',
    y: 'lamp',
    s: 'stone',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Pen: a teal ballpoint pen with a rubber grip, a steel point, a clip and a push
// button, and the line of ink it has just drawn.
// T barrel lit edge, x barrel light, b barrel, B barrel shade, N barrel shade edge,
// q grip lit edge, Q grip light, d grip, D grip shade, m steel edge, w steel light,
// f steel, S steel shade, K ball point, i ink line, z shadow.

const PEN: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '...............m...m....',
      '..............mwm.mwf...',
      '.............mwTwwwfmS..',
      '............mwTxxffmS...',
      '...........mwTxxbbff....',
      '...........wTxxbbbbmS...',
      '...........TxxbbbbBN....',
      '..........TxxbbbbBN.....',
      '.........mxxbbbbBN......',
      '........qwwbbbbBN.......',
      '.......qQdffbbBN........',
      '......qQdddffBN.........',
      '.....mwdddddmS..........',
      '.....mwwdddDD...........',
      '.....wwffdDD............',
      '....mwffffD.............',
      '....mfffSS..............',
      '....fSS.................',
      '...K...ii...ii...ii.....',
      '.....ii..iii..iii..ii...',
      '........................',
      '........................',
    ],
    { cx: 9, cy: 22.6, rx: 8, ry: 1.2, key: 'z' },
  ),
  legend: {
    T: 'teal',
    x: 'cyan',
    b: 'teal',
    B: 'indigo',
    N: 'deep',
    q: 'stone',
    Q: 'concrete',
    d: 'slate',
    D: 'night',
    m: 'concrete',
    w: 'paper',
    f: 'fog',
    S: 'stone',
    K: 'ink',
    i: 'denim',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Power: a round power button, the power sign (a ring broken by a bar) lit up
// in cyan on its dark face.
// O lit outline, o shade outline, w bezel light, g bezel, s bezel shade,
// n button face, K face rim shade, S face rim light, x the lit sign, z shadow.

const POWER: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........OOOOOOOO........',
      '......OOwwwwwwwwOO......',
      '.....OwwwKKKKKKgggO.....',
      '....OwwKKnnxxnnnnggo....',
      '...OwwKnnnnxxnnnnnggo...',
      '...OwKnnxxnxxnxxnnngo...',
      '..OwwKnxxxnxxnxxxnngso..',
      '..OwKnnxxnnxxnnxxnnSso..',
      '..OwKnxxxnnxxnnxxxnSso..',
      '..OwKnxxnnnxxnnnxxnSso..',
      '..OwKnxxnnnnnnnnxxnSso..',
      '..OwKnxxxnnnnnnxxxnSso..',
      '..OwKnnxxnnnnnnxxnnSso..',
      '..OwgnnxxxxnnxxxxnSsso..',
      '...OgnnnxxxxxxxxnnSso...',
      '...OggnnnnxxxxnnnSsso...',
      '....OggnnnnnnnnSSsso....',
      '.....ogggSSSSSSssso.....',
      '......oossssssssoo......',
      '........oooooooo........',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 13, cy: 21.4, rx: 9, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'concrete',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    s: 'stone',
    n: 'night',
    K: 'ink',
    S: 'slate',
    x: 'cyan',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Copier: a floor-standing office copier, the scanner light glowing under its
// dark lid, a control panel, a copy coming out onto the side tray and two paper
// drawers.
// O lit outline, o shade outline, s lid and handles, S lid shade, x scanner light,
// w body, g body shade, G side shade, k panel screen, l start button, r stop button,
// n slot and feet, z shadow.

const COPIER: PixelSprite = {
  rows: withShadow(
    [
      '...OOOOOOOOOOOOOo.......',
      '...OsssssssssssSo.......',
      '...OSSSSSSSSSSSSo.......',
      '...oxxxxxxxxxxxxo.......',
      '..OOOOOOOOOOOOOOOo......',
      '..OwwwwwwwwwwwwwGo......',
      '..OwkkkkkwlwrwnnGo......',
      '..OwkkkkkwwwwwnnGo......',
      '..OwwwwwwwwwwwwwGo......',
      '..OgnnnnnnnnnnnnOOOOOO..',
      '..OgggggggggggggwwwwwO..',
      '..OwwwwwwwwwwwwwGoGGGGo.',
      '..OwwwwwwwwwwwwwGo.ooo..',
      '..OOOOOOOOOOOOOOOo......',
      '..OwwwwwwwwwwwwwGo......',
      '..OwwwwsssssswwwGo......',
      '..OgggggggggggggGo......',
      '..OwwwwwwwwwwwwwGo......',
      '..OwwwwsssssswwwGo......',
      '..OgggggggggggggGo......',
      '..oSSSSSSSSSSSSSSo......',
      '...nn..........nn.......',
      '........................',
      '........................',
    ],
    { cx: 11, cy: 22, rx: 10.5, ry: 1.5, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    s: 'stone',
    S: 'slate',
    x: 'cyan',
    w: 'paper',
    g: 'fog',
    G: 'concrete',
    k: 'sky',
    l: 'leaf',
    r: 'red',
    n: 'night',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Cable: a grey cable wound into a flat coil of three turns and held by a red
// tie, its loose end running off to a plug with two pins.
// t cable light, S cable, d cable shade, n gap between turns, R tie light, r tie,
// M tie shade, O plug lit outline, o plug shade outline, g plug, G plug shade,
// y pins, z shadow.

const CABLE: PixelSprite = {
  rows: withShadow(
    [
      '.......tttt.............',
      '.....tttttttt...........',
      '...ttttnnnnttSS.........',
      '...ttnnttttnnSS.........',
      '..ttnnttttttnnSS........',
      '.tttnttnnnnSSnSSS.......',
      '.ttnttntttSnSSnSS.......',
      '.RRRRRRt..SnSSndd.......',
      '.rrrrrrt..ddddndd.......',
      '.MMMMMMS..dnddndd.......',
      '.ttnttnSSddnddndd.......',
      '.tttnSSnnnnddnddd.......',
      '..tSnnSSddddnndd........',
      '...SSnnSdddnndd.........',
      '...SSSSnnnnddddOOOOOo...',
      '.....SSSddddd..OgggGo...',
      '.......Sddd..OOOgggGoyyy',
      '........tttttOggggGGo...',
      '........dddddOGgggGGo...',
      '.............ooOgggGoyyy',
      '...............OGGGGo...',
      '...............oooooo...',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 22.2, rx: 10.5, ry: 1.5, key: 'z' },
  ),
  legend: {
    t: 'fog',
    S: 'concrete',
    d: 'stone',
    n: 'slate',
    R: 'neon',
    r: 'red',
    M: 'maroon',
    O: 'stone',
    o: 'slate',
    g: 'paper',
    G: 'fog',
    y: 'lamp',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Recycle: the recycling sign, three green arrows that chase each other round
// a triangle.
// l arrow, M shade edge, z shadow.

const RECYCLE: PixelSprite = {
  rows: withShadow(
    [
      '...........lM...........',
      '..........lllM..........',
      '.........lllllM.........',
      '.........lllllM.........',
      '........lllllllM........',
      '........MMlllllM........',
      '..........MllllllllM....',
      '........lM.MlllllllM....',
      '.......llM..MllllllM....',
      '......llllM..MMllllM....',
      '....llllllM....MlllM....',
      '...lllllllM.....MlM.....',
      '..llllllllM......MM.....',
      '.MMllllMMMM...M.........',
      '...lllM.....llM..lllM...',
      '...lllM....lllM..lllM...',
      '..lllllM..lllllllllllM..',
      '..lllllM.llllllllllllM..',
      '.MlllllM.MllllllllllllM.',
      '..MMMMMM..MllllMMMMMMM..',
      '...........MllM.........',
      '............MMM.........',
      '..............M.........',
      '........................',
    ],
    { cx: 12, cy: 23, rx: 9, ry: 1.2, key: 'z' },
  ),
  legend: {
    l: 'leaf',
    M: 'moss',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Refrigerator: a white two-door fridge in three-quarter view, the freezer door
// on top with a snowflake on it, a handle on each door.
// O lit outline, o shade outline, w door, g door shade, G side, c door gap,
// S side gap, k snowflake, x snowflake heart, s handle, d handle shade, n feet,
// z shadow.

const REFRIGERATOR: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.....OOOOOOOOOOOOOo.....',
      '....OwwwwwwwwwwgGGGo....',
      '....OwkwkwkwwwwgGGGo....',
      '....OwwkkkwwwsdgGGGo....',
      '....OwkkxkkwwsdgGGGo....',
      '....OwwkkkwwwsdgGGGo....',
      '....OwkwkwkwwsdgGGGo....',
      '....OwwwwwwwwwwgGGGo....',
      '....OccccccccccccSSo....',
      '....OwwwwwwwwwwgGGGo....',
      '....OwwwwwwwwsdgGGGo....',
      '....OwwwwwwwwsdgGGGo....',
      '....OwwwwwwwwsdgGGGo....',
      '....OwwwwwwwwsdgGGGo....',
      '....OwwwwwwwwsdgGGGo....',
      '....OwwwwwwwwwwgGGGo....',
      '....OwwwwwwwwwwgGGGo....',
      '....OwwwwwwwwwwgGGGo....',
      '....OggggggggggcGGGo....',
      '....oooooooooooooooo....',
      '.....nn........nn.......',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.8, rx: 9.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    G: 'concrete',
    c: 'concrete',
    S: 'stone',
    k: 'sky',
    x: 'cyan',
    s: 'stone',
    d: 'slate',
    n: 'night',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Bin: a blue recycling bin with an open top, the white recycling arrows on its
// front, a plastic bottle and a ball of paper showing over the rim.
// O lit outline, o shade outline, k plastic light, b plastic, B plastic shade,
// w arrows and paper, g paper shade, T bottle outline, x bottle, r cap, z shadow.

const BIN: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.........Trr............',
      '.........Txx............',
      '........TxwxT..OOOo.....',
      '........TxwxxTOwwgGo....',
      '..OOOOOOOOOOOOOOOOOOOo..',
      '..OkkkkkkkkkkkkkkkkkBo..',
      '..obbbbbbbbbbbbbbbbbBo..',
      '...oooooooooooooooooo...',
      '...OkbbbbbbbbbbbbbBBo...',
      '...OkbbbbbbwbbbbbbBBo...',
      '...OkbbbbbwwwbbbbbBBo...',
      '...OkbbbbwwbwwbbbbBBo...',
      '....OkbbwwbbbwwbbBBo....',
      '....OkbbbbbbbbbbbBBo....',
      '....OkwwbbbbbbbwwBBo....',
      '....OkwwwbbbbbwwwBBo....',
      '.....OkwwwwbwwwwBBo.....',
      '.....OkbbbbbbbbbBBo.....',
      '.....OkbbbbbbbbBBBo.....',
      '.....ObbbbbbbbBBBBo.....',
      '......oooooooooooo......',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.8, rx: 9.5, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'denim',
    o: 'indigo',
    k: 'sky',
    b: 'denim',
    B: 'indigo',
    w: 'paper',
    g: 'fog',
    G: 'concrete',
    T: 'teal',
    x: 'cyan',
    r: 'red',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Plate: an empty white plate seen from above, a blue line around its rim and
// a shallow well in the middle.
// O lit outline, o shade outline, w china, g china shade, c well shade,
// k rim line, d rim line shade, z shadow.

const PLATE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........OOOOOOOO........',
      '......OOwkkkkkkwOO......',
      '.....OwkkwwwwwwkkwO.....',
      '....Owkwwwccccwwwkgo....',
      '...Owkwwccggggccwwdgo...',
      '...Okwwcggwwwwwwgwwdo...',
      '..Owkwcggwwwwwwwwgwdgo..',
      '..Okwwcgwwwwwwwwwgwwdo..',
      '..Okwcgwwwwwwwwwwwgwdo..',
      '..Okwcgwwwwwwwwwwwgwdo..',
      '..Okwcgwwwwwwwwwwwgwdo..',
      '..Okwcgwwwwwwwwwwwgwdo..',
      '..Okwwcwwwwwwwwwwgwwdo..',
      '..Owkwcwwwwwwwwwwgwdgo..',
      '...Okwwgwwwwwwwwgwwdo...',
      '...Owkwwggwwwwggwwdgo...',
      '....Ogdwwwggggwwwdgo....',
      '.....ogddwwwwwwddgo.....',
      '......oogddddddgoo......',
      '........oooooooo........',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 13, cy: 21.4, rx: 9, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'concrete',
    o: 'stone',
    w: 'paper',
    g: 'fog',
    c: 'concrete',
    k: 'sky',
    d: 'denim',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Pot: a glass coffee pot two thirds full, a black collar, a pouring lip and a
// black handle.
// O lit outline, o shade outline, g glass, w glint, T coffee surface, e coffee,
// a coffee light, p coffee shade, t collar and handle light, d collar and handle,
// D their shade, z shadow.

const POT: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '.....ttttttttttD........',
      '.....tddddddddDDtttttt..',
      '...OOtddddddddDDddddddD.',
      '...OwOgggggggggO.....dD.',
      '....OgwwggggggggO....dD.',
      '...OgwwggggggggggO...dD.',
      '...OgwgggggggggggO...dD.',
      '..OTTTTTTTTTTTTTTTo..dD.',
      '..Oeaaeeeeeeeeeeepo..dD.',
      '..Oeaaeeeeeeeeeeppo..dD.',
      '..Oeaaeeeeeeeeeeppo..dD.',
      '..Oeaeeeeeeeeeeeppo..dD.',
      '..OeaeeeeeeeeeepppotddD.',
      '..OeeeeeeeeeeeepppoDDD..',
      '..Oeeeeeeeeeeeppppo.....',
      '...Oeeeeeeeeeppppo......',
      '...Oeeeeeeeepppppo......',
      '....Oppppppppppppo......',
      '.....ooooooooooo........',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 11, cy: 20.6, rx: 10, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'concrete',
    o: 'slate',
    g: 'fog',
    w: 'paper',
    T: 'tan',
    e: 'ember',
    a: 'amber',
    p: 'plum',
    t: 'concrete',
    d: 'stone',
    D: 'slate',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Microwave: a microwave oven from the front, a bowl on the turntable behind the
// lit door window, a door handle and a panel with a display, buttons and a dial.
// O lit outline, o shade outline, w body, g body shade, G side shade, K window
// frame, h light, y lit inside, a inside shade, p turntable, s handle and buttons,
// t display, x display light, l start button, r stop button, c dial, n feet,
// z shadow.

const MICROWAVE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '.OOOOOOOOOOOOOOOOOOOOOo.',
      '.OwwwwwwwwwwwwwwwwwwwGo.',
      '.OwKKKKKKKKKKKwswttttGo.',
      '.OwKhhhhhhhhhKwswtxxtGo.',
      '.OwKyyyyyyyyyKwswttttGo.',
      '.OwKyayyyyyayKwswwwwwGo.',
      '.OwKyywwwwwyyKwswswswGo.',
      '.OwKyygwwwgyyKwswwwwwGo.',
      '.OwKyyygwgyyyKwswlwrwGo.',
      '.OwKypppppppyKwswwwwwGo.',
      '.OwKaaaaaaaaaKwswwsswGo.',
      '.OwKKKKKKKKKKKwswscssGo.',
      '.OwwwwwwwwwwwwwwwwsswGo.',
      '.OgggggggggggggggggggGo.',
      '.oooooooooooooooooooooo.',
      '..nnn..............nnn..',
      '........................',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 20, rx: 11.5, ry: 1.8, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    G: 'concrete',
    K: 'ink',
    h: 'honey',
    y: 'lamp',
    a: 'amber',
    p: 'concrete',
    s: 'stone',
    t: 'teal',
    x: 'cyan',
    l: 'leaf',
    r: 'red',
    c: 'fog',
    n: 'night',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Clip: a steel paper clip, its wire bent into two loops, one inside the other.
// g wire light, c wire, s wire shade, z shadow.

const CLIP: PixelSprite = {
  rows: withShadow(
    [
      '.........ggggs..........',
      '.......ggcccccgs........',
      '......gccsssssccs.......',
      '.....gccs.....sccs......',
      '.....ccs..ggs..scs......',
      '....gcs..gcccs..ccs.....',
      '....ccs.gccsccs.ccs.....',
      '....ccs.ccs.ccs.ccs.....',
      '....ccs.ccs.ccs.ccs.....',
      '....ccs.ccs.ccs.ccs.....',
      '....ccs.ccs.ccs.ccs.....',
      '....ccs.ccs.ccs.ccs.....',
      '....ccs.ccs.ccs.ccs.....',
      '....ccs.ccs.ccs.ccs.....',
      '....ccs.sss.ccs.sss.....',
      '....ccs.....ccs.........',
      '....ccs.....ccs.........',
      '....sccs...gccs.........',
      '.....sccgggccs..........',
      '......scccccs...........',
      '.......sssss............',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 22, rx: 8.5, ry: 1.4, key: 'z' },
  ),
  legend: {
    g: 'fog',
    c: 'concrete',
    s: 'slate',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Outlet: a white wall plate with two sockets, each with two slots and a ground
// hole, and a screw in the middle.
// O lit outline, o shade outline, w plate, g socket face and plate shade,
// G plate side, c socket rim, K slots, s screw, z shadow.

const OUTLET: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '......OOOOOOOOOOOo......',
      '.....OwwwwwwwwwwwGo.....',
      '.....OwcccccccccwGo.....',
      '.....OwcgggggggcwGo.....',
      '.....OwcgKKgKKgcwGo.....',
      '.....OwcgKKgKKgcwGo.....',
      '.....OwcgKKgKKgcwGo.....',
      '.....OwcggKKKggcwGo.....',
      '.....OwcgggKgggcwGo.....',
      '.....OwcccccccccwGo.....',
      '.....OwwwwwswwwwwGo.....',
      '.....OwcccccccccwGo.....',
      '.....OwcgggggggcwGo.....',
      '.....OwcgKKgKKgcwGo.....',
      '.....OwcgKKgKKgcwGo.....',
      '.....OwcgKKgKKgcwGo.....',
      '.....OwcggKKKggcwGo.....',
      '.....OwcgggKgggcwGo.....',
      '.....OwcccccccccwGo.....',
      '.....OgggggggggggGo.....',
      '......oooooooooooo......',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21.8, rx: 8.5, ry: 1.4, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    G: 'concrete',
    c: 'concrete',
    K: 'ink',
    s: 'stone',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Internet: a blue globe with its lines of latitude and longitude, and the
// pointer of a mouse over it.
// O lit outline, o shade outline, b globe, B globe shade, k grid lines,
// x grid lines in the light, K pointer outline, w pointer, z shadow.

const INTERNET: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........OOOOOOO.........',
      '......OOwbbxbbxOO.......',
      '.....ObbwbbxbbxbbO......',
      '....Obbbwbbwbbxbbbo.....',
      '...Owwwwwwwwxxxxxxko....',
      '...ObbbwbbbwbbbxbbBo....',
      '..ObbbbwbbbwbbbxbbBBo...',
      '..ObbbbwbbbwbbbxbbBBo...',
      '..ObbbbwbbbxbbbxbbBBo...',
      '..OxxwwwwwxxxKxxxxkko...',
      '..ObbbbxbbbxbKKxbBBBo...',
      '..ObbbbxbbbxbKwKbBBBo...',
      '..ObbbbxbbbxbKwwKBBBo...',
      '...ObbbxbbbxbKwwwKBo....',
      '...OxxxxxxxxxKwwwwKo....',
      '....ObbbxbbxBKwwwwwK....',
      '.....oBBkBBkBKwwwwwwK...',
      '......ookBBkBKwwwwKKKK..',
      '........oooooKwKKwwK....',
      '.............KK..KwwK...',
      '..................KKK...',
      '........................',
    ],
    { cx: 11.5, cy: 21.6, rx: 8.5, ry: 1.5, key: 'z' },
  ),
  legend: {
    O: 'sky',
    o: 'deep',
    b: 'denim',
    B: 'indigo',
    k: 'sky',
    x: 'cyan',
    K: 'ink',
    w: 'paper',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Ink: a squat glass bottle of dark blue ink with a brass cap and a white label
// that shows an ink drop.
// E cap lit outline, P cap shade outline, h cap light, y cap, a cap shade,
// O lit outline, o shade outline, k ink light, b ink, B ink shade, w label,
// g label shade, z shadow.

const INK: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '.......EEEEEEEEP........',
      '.......EhhyyyyaP........',
      '.......EhyyyyaaP........',
      '.......EyyyyaaaP........',
      '........OkbbbBo.........',
      '......OOkbbbbbBoo.......',
      '....OOkkbbbbbbbbBoo.....',
      '...OkkbbbbbbbbbbbBBo....',
      '...OkbbbbbbbbbbbbBBo....',
      '...OkwwwwwwwwwwwgBBo....',
      '...OkwwwwwbwwwwwgBBo....',
      '...OkwwwwbbbwwwwgBBo....',
      '...OkwwwbkbbbwwwgBBo....',
      '...OkwwwbbbbbwwwgBBo....',
      '...OkwwwwbbbwwwwgBBo....',
      '...OkwwwwwwwwwwwgBBo....',
      '...OkbbbbbbbbbbbbBBo....',
      '...ObbbbbbbbbbbbBBBo....',
      '....ooooooooooooooo.....',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 11.5, cy: 20.8, rx: 10, ry: 1.8, key: 'z' },
  ),
  legend: {
    E: 'ember',
    P: 'plum',
    h: 'honey',
    y: 'lamp',
    a: 'amber',
    O: 'sky',
    o: 'dusk',
    k: 'denim',
    b: 'indigo',
    B: 'deep',
    w: 'paper',
    g: 'fog',
    z: 'fog',
  },
};

export const OFFICE_ITEMS: Readonly<Record<string, PixelSprite>> = {
  drawer: DRAWER,
  pen: PEN,
  power: POWER,
  copier: COPIER,
  cable: CABLE,
  recycle: RECYCLE,
  refrigerator: REFRIGERATOR,
  bin: BIN,
  plate: PLATE,
  pot: POT,
  microwave: MICROWAVE,
  clip: CLIP,
  outlet: OUTLET,
  internet: INTERNET,
  ink: INK,
};
