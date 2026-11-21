import * as Phaser from 'phaser';
import type { Layout } from '../layout';
import { PALETTE } from './palette';
import { TitleScene } from './scenes/TitleScene';

export function createGame(parent: HTMLElement, layout: Layout): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: layout.sceneW,
    height: layout.sceneH,
    backgroundColor: PALETTE.ink,
    pixelArt: true,
    // The street is mostly still; 30 fps keeps phones cool.
    fps: { limit: 30 },
    scale: { mode: Phaser.Scale.NONE, zoom: layout.px },
    scene: [TitleScene],
  });
  game.events.once(Phaser.Core.Events.READY, () => applyGameLayout(game, layout));
  return game;
}

/** Resizes the canvas to a new layout: logical size first, then on-screen size. */
export function applyGameLayout(game: Phaser.Game, layout: Layout): void {
  game.scale.setZoom(layout.px);
  game.scale.resize(layout.sceneW, layout.sceneH);
  // Phaser rounds the CSS size; set it exactly so each logical pixel
  // covers a whole number of device pixels.
  game.canvas.style.width = `${layout.cssW}px`;
  game.canvas.style.height = `${layout.cssH}px`;
  game.scale.updateBounds();
}
