/** Item icons for the meeting unit. */
import type { PixelSprite } from '../../game/sprites';
import { withShadow } from './draw';

// ---------------------------------------------------------------------------
// Calendar: a month page with a red header on two binder rings, a grid of days
// and today marked in red.
// M header lit outline, m header shade outline, n header light, r header and today,
// d header shade, S ring light, s ring shade, K ring hole, O lit outline,
// o shade outline, w page, g page shade, G page edge, c day, z shadow.

const CALENDAR: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '......Ss........Ss......',
      '..MMMMSsMMMMMMMMSsMMMm..',
      '..MnnnSsnnnnnnnnSsnnrm..',
      '..MrrrKKrrrrrrrrKKrrrm..',
      '..Mrrrrrrrrrrrrrrrrrrm..',
      '..Mddddddddddddddddddm..',
      '..OwwwwwwwwwwwwwwwwwGo..',
      '..OwwwwwwwccwccwccwwGo..',
      '..OwwwwwwwccwccwccwwGo..',
      '..OwwwwwwwwwwwwwwwwwGo..',
      '..OwccwccwccwccwccwwGo..',
      '..OwccwccwccwccwccwwGo..',
      '..OwwwwwwwwwwwwwwwwwGo..',
      '..OwccwccwrrwccwccwwGo..',
      '..OwccwccwrrwccwccwwGo..',
      '..OwwwwwwwwwwwwwwwwwGo..',
      '..OwccwccwccwwwwwwwwGo..',
      '..OwccwccwccwwwwwwwwGo..',
      '..OgggggggggggggggggGo..',
      '..oooooooooooooooooooo..',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 21, rx: 10.5, ry: 1.8, key: 'z' },
  ),
  legend: {
    M: 'maroon',
    m: 'plum',
    n: 'neon',
    r: 'red',
    d: 'maroon',
    S: 'fog',
    s: 'stone',
    K: 'ink',
    O: 'stone',
    o: 'slate',
    w: 'paper',
    g: 'fog',
    G: 'fog',
    c: 'concrete',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Projector: a white office projector seen from the side, its lens at the left
// throwing a cone of light up and away.
// O lit outline, o shade outline, w body, G top shade, g side shade, c side dark,
// K lens barrel and dial, k barrel light, x lens glass, v vent, r button, l power light,
// h beam, W beam core, f foot, z shadow.

const PROJECTOR: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      'h.......................',
      '.h......................',
      'h.h.....................',
      '.hhh....................',
      'h.hh.......OOOOOOOOOOo..',
      '.hhhh.....OwwwwwwwwwwGo.',
      'h.hhhh....OwKKwwwwrwwGo.',
      '.hhhhhhKKKOggggggggggco.',
      'h.hhhhhWkkKwlwwvwvwvwco.',
      '.hhhhhhxkkKwwwwvwvwvwco.',
      'h.hhhhhxkkKwwwwvwvwvwco.',
      '.hhhhhhxkkKggggvgvgvgco.',
      'h.hhhhhKKKOggggggggggco.',
      '.hhh......Occccccccccco.',
      '...........ooooooooooo..',
      '...........ff......ff...',
      '........................',
      '........................',
      '........................',
    ],
    { cx: 16, cy: 20.8, rx: 8, ry: 1.6, key: 'z' },
  ),
  legend: {
    O: 'stone',
    o: 'slate',
    w: 'paper',
    G: 'fog',
    g: 'fog',
    c: 'concrete',
    K: 'ink',
    k: 'slate',
    x: 'cyan',
    v: 'stone',
    r: 'red',
    l: 'leaf',
    W: 'paper',
    h: 'honey',
    f: 'slate',
    z: 'fog',
  },
};

// ---------------------------------------------------------------------------
// Slide: one slide on a tripod projection screen, a blue title bar over a
// coloured bar chart.
// O lit frame, o shade frame, w screen, G screen shade, t title, c axis,
// b d blue bar, l m green bar, y a yellow bar, r M red bar, s stand light,
// S stand shade, z shadow.

const SLIDE: PixelSprite = {
  rows: withShadow(
    [
      '........................',
      '.OOOOOOOOOOOOOOOOOOOOOo.',
      '.OwwwwwwwwwwwwwwwwwwwGo.',
      '.OwtttttttttwwwwwwwwwGo.',
      '.OwtttttttttwwwwwwwwwGo.',
      '.OwwwwwwwwwwwwwwwwwwwGo.',
      '.OwwwwwwwwwwwwwwrrMwwGo.',
      '.OwwwwwwwwwwwwwwrrMwwGo.',
      '.OwwwwwwllmwwwwwrrMwwGo.',
      '.OwwwwwwllmwwwwwrrMwwGo.',
      '.OwwbbdwllmwwwwwrrMwwGo.',
      '.OwwbbdwllmwyyawrrMwwGo.',
      '.OwwbbdwllmwyyawrrMwwGo.',
      '.OwwbbdwllmwyyawrrMwwGo.',
      '.OwcccccccccccccccccwGo.',
      '.OwwwwwwwwwwwwwwwwwwwGo.',
      '.oooooooooooooooooooooo.',
      '...........sS...........',
      '...........sS...........',
      '.........sssSSS.........',
      '.......sss.sS.SSS.......',
      '.....sss...sS...SSS.....',
      '........................',
      '........................',
    ],
    { cx: 12, cy: 22.5, rx: 8.5, ry: 0.9, key: 'z' },
  ),
  legend: {
    O: 'slate',
    o: 'night',
    w: 'paper',
    G: 'fog',
    t: 'denim',
    c: 'stone',
    b: 'sky',
    d: 'denim',
    l: 'leaf',
    m: 'moss',
    y: 'lamp',
    a: 'amber',
    r: 'red',
    M: 'maroon',
    s: 'concrete',
    S: 'stone',
    z: 'fog',
  },
};

export const MEETING_ITEMS: Readonly<Record<string, PixelSprite>> = {
  calendar: CALENDAR,
  projector: PROJECTOR,
  slide: SLIDE,
};
