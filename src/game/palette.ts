/**
 * The one limited palette of the street scene (at most 32 colours).
 *
 * Every pixel of every sprite and painted layer uses one of these colours.
 * The only exception is light: glow layers (lamp pools, neon halos, window
 * spill) paint palette colours at partial alpha, in a few hard-edged steps,
 * so light can blend over what is behind it. Shapes themselves are never
 * anti-aliased.
 *
 * ink, paper, lamp and neon are shared with the HTML UI so the windows and
 * the world feel like one place.
 */
export const PALETTE = {
  // shared with the UI
  ink: '#1d1a2b',
  paper: '#f3e9d2',
  lamp: '#f2a541',
  neon: '#ff5c8a',
  // dusk sky, top to horizon
  deep: '#232a52',
  indigo: '#2f3a6e',
  dusk: '#4a4a8a',
  violet: '#6b5596',
  mauve: '#9a6a9e',
  rosy: '#c98a9a',
  // walls, concrete and road
  night: '#2b2747',
  slate: '#3b3a5c',
  stone: '#555472',
  concrete: '#77708a',
  fog: '#a59cb0',
  plum: '#4b2c4f',
  // warm light and wood
  honey: '#ffd27a',
  amber: '#c86f2f',
  ember: '#8a4630',
  // neon and signs
  neonDeep: '#a8306a',
  cyan: '#5ce1e6',
  teal: '#2a7f8f',
  red: '#c8343c',
  maroon: '#6e1f33',
  // plants
  leaf: '#5f8f4e',
  moss: '#2f5040',
  // people and cool highlights
  skin: '#e0a77f',
  tan: '#b07a5c',
  denim: '#3d5a8a',
  sky: '#7f8fc4',
} as const;

export type PaletteName = keyof typeof PALETTE;

export const PALETTE_NAMES = Object.keys(PALETTE) as PaletteName[];

/** Hard limit on the number of colours in the palette. */
export const MAX_COLOURS = 32;

export function isPaletteName(name: string): name is PaletteName {
  return Object.prototype.hasOwnProperty.call(PALETTE, name);
}
