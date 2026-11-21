import * as Phaser from 'phaser';
import { buildKey, needsRebuild, type BuildKey } from '../buildKey';
import { PALETTE } from '../palette';
import { makeRng } from '../painter';
import {
  LAYERS,
  registerPixelSprites,
  registerStreetLayers,
  registerToggleWindows,
  toggleKey,
} from '../pixelArt';
import { idleKey, RIPPLE_FRAMES, STEAM_FRAMES, walkKey, WALK_FRAMES } from '../sprites';
import { buildStreet, type StreetPlan } from '../street/plan';

type Img = Phaser.GameObjects.Image;

const DEPTH = {
  back: 0,
  interior: 1,
  floor: 2,
  people: 4,
  signs: 5,
  front: 6,
  road: 7,
  glow: 8,
} as const;

/** Walking speeds in px/s and how far the feet travel per walk frame. */
const WALKER = { speed: 13, stride: 3 };
const PASSERS = [
  { id: 'worker', speed: 24, stride: 4 },
  { id: 'auntie', speed: 9, stride: 2.5 },
] as const;
const RIDER_SPEED = 70;

/**
 * A rare light flicker: `pattern` alternates off/on durations in ms,
 * starting with "off", then waits `min`..`max` ms before the next one.
 */
interface Flicker {
  nextAt: number;
  pattern: readonly number[];
  min: number;
  max: number;
}

interface Mover {
  img: Img;
  x: number;
  dist: number;
  active: boolean;
  nextAt: number;
}

function reducedMotion(): boolean {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}

function setKey(img: Img | undefined, key: string): void {
  if (img?.active && img.texture.key !== key) img.setTexture(key);
}

function show(img: Img | undefined, visible: boolean): void {
  if (img?.active && img.visible !== visible) img.setVisible(visible);
}

/**
 * Decorative street at blue hour, shown behind every screen. Static layers
 * are painted once per size; only small sprites change, each on its own
 * period (none a multiple of another) so the loops are hard to notice.
 */
export class TitleScene extends Phaser.Scene {
  private built: Phaser.GameObjects.GameObject[] = [];
  private animated = true;
  private ready = false;
  private motionQuery?: MediaQueryList;
  private plan?: StreetPlan;
  private rng: () => number = Math.random;
  private t0 = 0;

  private walker?: Mover & { phase: 'wait' | 'in' | 'look' | 'out'; until: number; lookAt: number };
  private passer?: Mover & { which: number; speed: number; stride: number; id: string };
  private rider?: Mover & { dir: 1 | -1; light: Img };
  private cat?: Img;
  private plant?: Img;
  private barista?: Img;
  private steam: Img[] = [];
  private ripple?: Img;
  private rippleNext = 0;
  private rippleStart = -1e9;
  private neonCup?: Img;
  private brokenSign?: Img;
  private tubeGlow?: Img;
  private tubeOff?: Img;
  private aviation?: Img;
  private twinkles: Img[] = [];
  private toggles: Img[] = [];
  private flickers: { neon: Flicker; sign: Flicker; tube: Flicker } | null = null;
  private lastBuild: BuildKey | null = null;

  constructor() {
    super('Title');
  }

  create(): void {
    registerPixelSprites(this);
    this.lastBuild = null; // a (re)started scene has no images yet
    this.rebuildIfChanged();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.rebuildIfChanged, this);
    if (typeof window.matchMedia === 'function') {
      this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.motionQuery.addEventListener('change', this.onMotionChange);
    }
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.rebuildIfChanged, this);
      this.motionQuery?.removeEventListener('change', this.onMotionChange);
      this.ready = false;
      this.lastBuild = null;
    });
  }

  private readonly onMotionChange = (): void => this.rebuildIfChanged();

  /**
   * One layout change emits RESIZE more than once (setZoom, then resize), and a
   * zoom-only change keeps the logical size. Repaint only when the size or the
   * reduced-motion setting actually differs from the last build.
   */
  private rebuildIfChanged(): void {
    const key = buildKey(this.scale.width, this.scale.height, !reducedMotion());
    if (!needsRebuild(this.lastBuild, key)) return;
    this.lastBuild = key;
    this.build();
  }

  private add1(x: number, y: number, key: string, depth: number, ox = 0, oy = 0): Img {
    const img = this.add.image(x, y, key).setOrigin(ox, oy).setDepth(depth);
    this.built.push(img);
    return img;
  }

  /** (Re)creates everything for the current scene size. */
  private build(): void {
    this.ready = false;
    this.clearBuilt();

    const plan = buildStreet(this.scale.width, this.scale.height);
    this.plan = plan;
    this.animated = !reducedMotion();
    this.rng = makeRng(plan.width * 1009 + plan.height);
    this.t0 = this.game.loop.time;
    registerStreetLayers(this, plan);
    registerToggleWindows(this, plan);
    this.cameras.main.setBackgroundColor(PALETTE.ink);

    this.add1(0, 0, LAYERS.back, DEPTH.back);
    this.add1(0, 0, LAYERS.front, DEPTH.front);
    this.add1(0, 0, LAYERS.glow, DEPTH.glow);
    this.addSigns(plan);
    this.addShopLife(plan);
    this.addLights(plan);
    this.ripple = this.add1(plan.puddle.x, plan.puddle.y, 'ripple_0', DEPTH.front + 0.5, 0.5, 0.5);
    this.ripple.setVisible(false);
    const walkerImg = this.addWalker(plan);
    this.addPasser(plan);
    this.addRider(plan);
    this.resetTimers();

    if (!this.animated) {
      // Still picture with every light on: the protagonist at the window.
      walkerImg.setPosition(plan.walk.stopX, plan.walk.y).setTexture('walker_back');
    }
    this.ready = true;
  }

  private clearBuilt(): void {
    // Nothing here uses timers or tweens, but clear them in case.
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.built.forEach((object) => object.destroy());
    this.built = [];
    this.steam = [];
    this.twinkles = [];
    this.toggles = [];
  }

  private addSigns(plan: StreetPlan): void {
    this.neonCup = this.add1(plan.neonCup.x, plan.neonCup.y, 'neon_cup_on', DEPTH.signs);
    this.brokenSign = undefined;
    for (const sign of plan.verticalSigns) {
      const img = this.add1(sign.x - 3, sign.y - 3, `vsign_${sign.variant}_on`, DEPTH.signs);
      if (sign.variant === 1) this.brokenSign = img;
    }
  }

  /** Barista, steam, the plant by the door and the cat. */
  private addShopLife(plan: StreetPlan): void {
    this.barista = this.add1(plan.barista.x, plan.barista.y, 'barista_0', DEPTH.interior, 0.5, 1);
    plan.steam.forEach((s, i) => {
      this.steam.push(
        this.add1(s.x, s.y, 'steam_1', i === 0 ? DEPTH.floor : DEPTH.interior, 0.5, 1),
      );
    });
    this.plant = this.add1(plan.plant.x, plan.plant.y, 'plant_0', DEPTH.floor, 0.5, 1);
    this.cat = this.add1(plan.cat.x, plan.cat.y, 'cat_0', DEPTH.floor, 0.5, 1);
  }

  /** The flickering tube, the aviation light, twinkling stars and toggling windows. */
  private addLights(plan: StreetPlan): void {
    const tube = plan.tubes.find((t) => t.flicker);
    this.tubeGlow = tube ? this.add1(tube.x - 5, tube.y - 3, 'tube_glow', DEPTH.glow) : undefined;
    this.tubeOff = tube
      ? this.add1(tube.x, tube.y, 'tube_off', DEPTH.interior).setVisible(false)
      : undefined;

    this.aviation = plan.aviation
      ? this.add1(plan.aviation.x, plan.aviation.y, 'dot_red', DEPTH.interior)
      : undefined;
    this.twinkles = plan.twinkles.map((s) => this.add1(s.x, s.y, 'dot_star', DEPTH.interior));
    this.toggles = plan.toggles.map((w, i) =>
      this.add1(w.x - 2, w.y - 2, toggleKey(i), DEPTH.interior).setVisible(false),
    );
  }

  private addWalker(plan: StreetPlan): Img {
    const walkerImg = this.add1(
      plan.walk.startX,
      plan.walk.y,
      idleKey('walker'),
      DEPTH.people,
      0.5,
      1,
    );
    this.walker = {
      img: walkerImg,
      x: plan.walk.startX,
      dist: 0,
      active: true,
      nextAt: 0,
      phase: 'wait',
      until: 600,
      lookAt: 0,
    };
    return walkerImg;
  }

  private addPasser(plan: StreetPlan): void {
    const passerImg = this.add1(0, plan.passerY, idleKey('worker'), DEPTH.people + 0.5, 0.5, 1);
    passerImg.setVisible(false).setFlipX(true);
    this.passer = {
      img: passerImg,
      x: 0,
      dist: 0,
      active: false,
      nextAt: 7000 + this.rng() * 4000,
      which: 0,
      id: 'worker',
      speed: 0,
      stride: 1,
    };
  }

  private addRider(plan: StreetPlan): void {
    const riderImg = this.add1(0, plan.roadY, 'rider', DEPTH.road, 0.5, 1).setVisible(false);
    const light = this.add1(0, plan.roadY - 9, 'headlight', DEPTH.glow, 0.5, 0.5).setVisible(false);
    this.rider = {
      img: riderImg,
      light,
      x: 0,
      dist: 0,
      active: false,
      nextAt: 4000 + this.rng() * 6000,
      dir: 1,
    };
  }

  /** Flicker and ripple schedules (uses the seeded rng after the movers). */
  private resetTimers(): void {
    const flicker = (min: number, max: number, pattern: number[]): Flicker => ({
      nextAt: min + this.rng() * (max - min),
      pattern,
      min,
      max,
    });
    this.flickers = {
      neon: flicker(7000, 17000, [70, 60, 120]),
      sign: flicker(3000, 9000, [90, 80, 90]),
      tube: flicker(4000, 13000, [50, 80, 200, 40, 60]),
    };
    this.rippleNext = 2500;
    this.rippleStart = -1e9;
  }

  /** True while the flicker is in an "off" part of its pattern. */
  private flickerOff(f: Flicker, e: number): boolean {
    let t = e - f.nextAt;
    if (t < 0) return false;
    for (let i = 0; i < f.pattern.length; i++) {
      t -= f.pattern[i] ?? 0;
      if (t < 0) return i % 2 === 0;
    }
    f.nextAt = e + f.min + this.rng() * (f.max - f.min);
    return false;
  }

  update(time: number, deltaMs: number): void {
    if (!this.ready || !this.animated || !this.plan) return;
    const e = time - this.t0;
    const dt = Math.min(deltaMs, 100) / 1000;
    this.updateWalker(e, dt);
    this.updatePasser(e, dt);
    this.updateRider(e, dt);
    this.updateLoops(e);
  }

  private updateWalker(e: number, dt: number): void {
    const w = this.walker;
    const plan = this.plan;
    if (!w || !plan || !w.img.active) return;
    const { startX, endX, stopX, y } = plan.walk;
    if (w.phase === 'wait') {
      show(w.img, false);
      if (e < w.until) return;
      w.phase = 'in';
      w.x = startX;
      show(w.img, true);
    }
    if (w.phase === 'look') {
      const sinceStop = e - w.lookAt;
      setKey(w.img, sinceStop < 350 || e > w.until - 350 ? idleKey('walker') : 'walker_back');
      if (e >= w.until) w.phase = 'out';
      return;
    }
    const step = WALKER.speed * dt;
    w.x += step;
    w.dist += step;
    if (w.phase === 'in' && w.x >= stopX) {
      w.x = stopX;
      w.phase = 'look';
      w.lookAt = e;
      w.until = e + 4800 + this.rng() * 2400;
    } else if (w.phase === 'out' && w.x >= endX) {
      w.phase = 'wait';
      w.until = e + 2500 + this.rng() * 4500;
    }
    setKey(
      w.img,
      w.phase === 'look'
        ? idleKey('walker')
        : walkKey('walker', Math.floor(w.dist / WALKER.stride) % WALK_FRAMES),
    );
    w.img.setPosition(Math.round(w.x), y);
  }

  private updatePasser(e: number, dt: number): void {
    const m = this.passer;
    const plan = this.plan;
    if (!m || !plan || !m.img.active) return;
    if (!m.active) {
      if (e < m.nextAt) return;
      const def = PASSERS[m.which % PASSERS.length] ?? PASSERS[0];
      m.which++;
      m.id = def.id;
      m.speed = def.speed;
      m.stride = def.stride;
      m.active = true;
      m.x = plan.width + 12;
      show(m.img, true);
    }
    const step = m.speed * dt;
    m.x -= step;
    m.dist += step;
    if (m.x < -12) {
      m.active = false;
      show(m.img, false);
      m.nextAt = e + 5000 + this.rng() * 8000;
      return;
    }
    setKey(m.img, walkKey(m.id, Math.floor(m.dist / m.stride) % WALK_FRAMES));
    m.img.setPosition(Math.round(m.x), plan.passerY);
  }

  private updateRider(e: number, dt: number): void {
    const r = this.rider;
    const plan = this.plan;
    if (!r || !plan || !r.img.active || !r.light.active) return;
    if (!r.active) {
      if (e < r.nextAt) return;
      r.active = true;
      r.dir = this.rng() < 0.5 ? 1 : -1;
      r.x = r.dir > 0 ? -30 : plan.width + 30;
      r.img.setFlipX(r.dir < 0);
      show(r.img, true);
      show(r.light, true);
    }
    r.x += r.dir * RIDER_SPEED * dt;
    if (r.x < -40 || r.x > plan.width + 40) {
      r.active = false;
      show(r.img, false);
      show(r.light, false);
      r.nextAt = e + 9000 + this.rng() * 12000;
      return;
    }
    const x = Math.round(r.x);
    r.img.setPosition(x, plan.roadY);
    r.light.setPosition(x + r.dir * 22, plan.roadY - 8);
  }

  private updateLoops(e: number): void {
    // Cat: a tail swish every 3.7 s, a blink every 5.3 s.
    const swish = (e + 400) % 3700;
    const tail = swish < 180 ? 1 : swish < 360 ? 2 : swish < 540 ? 1 : 0;
    const blink = tail === 0 && (e + 2100) % 5300 < 140;
    setKey(this.cat, blink ? 'cat_blink' : `cat_${tail}`);

    // Plant by the door sways for a moment every 4.3 s.
    setKey(this.plant, (e + 1100) % 4300 < 800 ? 'plant_1' : 'plant_0');

    // Steam: the noodle pot at 230 ms a frame; the cafe cup at 310 ms a
    // frame, resting now and then (7.9 s cycle).
    const [pot, cup] = this.steam;
    setKey(pot, `steam_${Math.floor(e / 230) % STEAM_FRAMES}`);
    setKey(cup, `steam_${Math.floor((e + 77) / 310) % STEAM_FRAMES}`);
    show(cup, e % 7900 < 5600);

    // Barista: pours, pauses, glances at the street (6.7 s cycle).
    const b = e % 6700;
    setKey(
      this.barista,
      b < 3000 ? 'barista_0' : b < 4800 ? 'barista_1' : b < 5700 ? 'barista_0' : 'barista_2',
    );

    // Puddle ripple every 5.9-7.5 s.
    if (e >= this.rippleNext) {
      this.rippleStart = e;
      this.rippleNext = e + 5900 + this.rng() * 1600;
    }
    const rf = Math.floor((e - this.rippleStart) / 150);
    show(this.ripple, rf >= 0 && rf < RIPPLE_FRAMES);
    if (rf >= 0 && rf < RIPPLE_FRAMES) setKey(this.ripple, `ripple_${rf}`);

    // Rare flickers of the neon cup, one broken sign letter and a tube.
    const f = this.flickers;
    if (f) {
      setKey(this.neonCup, this.flickerOff(f.neon, e) ? 'neon_cup_off' : 'neon_cup_on');
      setKey(this.brokenSign, this.flickerOff(f.sign, e) ? 'vsign_1_part' : 'vsign_1_on');
      const tubeOff = this.flickerOff(f.tube, e);
      show(this.tubeGlow, !tubeOff);
      show(this.tubeOff, tubeOff);
    }

    // Aviation light on the far tower: a short blink every 2.9 s.
    show(this.aviation, e % 2900 < 400);

    // Two stars twinkle on their own periods (3.3 s and 4.1 s).
    const [s0, s1] = this.twinkles;
    s0?.setAlpha(e % 3300 < 500 ? 0.35 : 1);
    s1?.setAlpha((e + 900) % 4100 < 600 ? 0.3 : 1);

    // Someone comes home: windows light up for a while (13.7 s, 19.3 s).
    const [w0, w1] = this.toggles;
    show(w0, e % 13700 > 4700);
    show(w1, (e + 5000) % 19300 < 6000);
  }
}
