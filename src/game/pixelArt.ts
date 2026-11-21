import type * as Phaser from 'phaser';
import { canvasPainter, paintSprite, type Painter } from './painter';
import { SPRITES, validateSprite } from './sprites';
import { paintForeground, paintGlow, smallArt } from './street/paintFront';
import { paintStreet } from './street/paintStreet';
import { paintSky, paintSkyline, paintUpperFloors, paintUpperWindow } from './street/paintUpper';
import type { StreetPlan } from './street/plan';

/** The three static layers of the street, each painted once per scene size. */
export const LAYERS = {
  back: 'street-back',
  front: 'street-front',
  glow: 'street-glow',
} as const;

export function paintBack(p: Painter, plan: StreetPlan): void {
  paintSky(p, plan);
  paintSkyline(p, plan);
  paintUpperFloors(p, plan);
  paintStreet(p, plan);
}

function paintTexture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  paint: (p: Painter) => void,
): void {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const texture = scene.textures.createCanvas(key, width, height);
  if (!texture) throw new Error(`Could not create texture "${key}"`);
  paint(canvasPainter(texture.getContext()));
  texture.refresh();
}

/** Registers every code-defined sprite and small light texture (once per game). */
export function registerPixelSprites(scene: Phaser.Scene): void {
  for (const [name, sprite] of Object.entries(SPRITES)) {
    if (scene.textures.exists(name)) continue;
    const problems = validateSprite(sprite);
    if (problems.length > 0) throw new Error(`Sprite "${name}": ${problems.join('; ')}`);
    const width = sprite.rows[0]?.length ?? 1;
    paintTexture(scene, name, width, sprite.rows.length, (p) => paintSprite(p, sprite, 0, 0));
  }
  for (const art of smallArt()) {
    if (!scene.textures.exists(art.key)) paintTexture(scene, art.key, art.w, art.h, art.paint);
  }
}

/**
 * Paints the static street layers for the current size. Call only after every
 * image using the old textures has been destroyed.
 */
export function registerStreetLayers(scene: Phaser.Scene, plan: StreetPlan): void {
  const { width, height } = plan;
  paintTexture(scene, LAYERS.back, width, height, (p) => paintBack(p, plan));
  paintTexture(scene, LAYERS.front, width, height, (p) => paintForeground(p, plan));
  paintTexture(scene, LAYERS.glow, width, height, (p) => paintGlow(p, plan));
}

export function toggleKey(index: number): string {
  return `street-toggle-${index}`;
}

/**
 * Paints the lit version of each dark window that switches on now and then.
 * Each texture covers the window plus a 2 px border, placed at (x - 2, y - 2).
 */
export function registerToggleWindows(scene: Phaser.Scene, plan: StreetPlan): void {
  plan.toggles.forEach((win, i) => {
    const bay = plan.bays.find((b) => b.index === win.bayIndex);
    if (!bay) return;
    const ox = win.x - 2;
    const oy = win.y - 2;
    paintTexture(scene, toggleKey(i), win.w + 4, win.h + 4, (p) => {
      const shifted: Painter = {
        rect: (x, y, w, h, color, alpha) => p.rect(x - ox, y - oy, w, h, color, alpha),
      };
      paintUpperWindow(shifted, { ...win, light: 'warm' }, bay);
    });
  });
}
