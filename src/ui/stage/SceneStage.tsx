import type { CSSProperties } from 'preact';
import { createPortal } from 'preact/compat';
import { useEffect } from 'preact/hooks';
import { spriteRuns, type PixelRun } from '../../art/items';
import { actorSpot, coreOrigin, stageFor, type StageConfig, type StageSide } from '../../art/stage';
import type { Role, SceneLine, Unit } from '../../content/types';
import { appStore } from '../../core/appState';
import { useStore } from '../../core/store';
import { canvasPainter } from '../../game/painter';
import type { PixelSprite } from '../../game/sprites';
import { ItemIcon } from '../ItemIcon';
import { stageArea, stageCanvasSize, type StageArea } from './stageArea';
import { rolesOnStage, type StageView } from './stageState';
import './stage.css';

function hasStage(unitId: string): boolean {
  return stageFor(unitId) !== undefined;
}

/** The element the stage is drawn into (the scene, #frame), or null when this unit has no stage. */
export function stageFrame(unitId: string): HTMLElement | null {
  if (!hasStage(unitId) || typeof document === 'undefined') return null;
  return document.getElementById('frame');
}

interface Props {
  unit: Unit;
  /** The current task's story: only the NPCs who speak in it are drawn. */
  scene: readonly SceneLine[];
  view: StageView;
  /**
   * How many scene lines are on screen (all of them once the story is over). An
   * NPC who joins mid-scene appears at their first line; it also changes with
   * every new line, so a new bubble pops again.
   */
  beat: number;
  /** The role whose line is being heard right now (bobs while it plays). */
  talking: Role | undefined;
  area: StageArea;
}

/**
 * The stage for a whole task (story, intro cards and practice), drawn over the
 * top of the scene, edge to edge. In landscape the task card sits to its right;
 * --stage-w on #frame tells the card how much room the stage takes.
 */
export function TaskStage({ frame, ...props }: Omit<Props, 'area'> & { frame: HTMLElement }) {
  const { layout } = useStore(appStore);
  const area = stageArea(layout);
  const columnW = layout.orientation === 'landscape' ? area.w : 0;
  useEffect(() => {
    if (columnW === 0) return;
    frame.style.setProperty('--stage-w', `calc(${columnW} * var(--px))`);
    return () => frame.style.removeProperty('--stage-w');
  }, [frame, columnW]);
  return createPortal(<SceneStage {...props} area={area} />, frame);
}

/** Stage pixels to CSS: --sp is one stage pixel on screen. */
const u = (n: number): string => `calc(${n} * var(--sp))`;

const backgrounds = new Map<string, string>();

/** Paints a stage background of w x h stage pixels once and keeps it as an image URL. */
function backgroundUrl(
  unitId: string,
  config: StageConfig,
  w: number,
  h: number,
): string | undefined {
  const key = `${unitId}:${w}x${h}`;
  const cached = backgrounds.get(key);
  if (cached) return cached;
  if (typeof document === 'undefined') return undefined;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return undefined;
  config.paint(canvasPainter(ctx), w, h);
  const url = canvas.toDataURL('image/png');
  if (backgrounds.size >= 8) backgrounds.clear(); // only a few screen sizes are ever live
  backgrounds.set(key, url);
  return url;
}

const runCache = new WeakMap<PixelSprite, PixelRun[]>();

function SpriteSvg({
  sprite,
  class: className,
  style,
}: {
  sprite: PixelSprite;
  class?: string;
  style?: CSSProperties;
}) {
  let runs = runCache.get(sprite);
  if (!runs) {
    runs = spriteRuns(sprite);
    runCache.set(sprite, runs);
  }
  const w = sprite.rows[0]?.length ?? 0;
  const h = sprite.rows.length;
  return (
    <svg
      class={className}
      style={{ width: u(w), height: u(h), ...style }}
      viewBox={`0 0 ${w} ${h}`}
      shape-rendering="crispEdges"
      focusable="false"
    >
      {runs.map((r) => (
        <rect key={`${r.x},${r.y}`} x={r.x} y={r.y} width={r.w} height={1} fill={r.color} />
      ))}
    </svg>
  );
}

const other = (side: StageSide): StageSide => (side === 'left' ? 'right' : 'left');

/** Where everything is placed: the unit's stage and the core's top left on the canvas. */
interface Placing {
  config: StageConfig;
  ox: number;
  oy: number;
}

/** CSS position of a point given in core pixels. */
const placeAt = ({ ox, oy }: Placing, p: { x: number; y: number }) => ({
  left: u(ox + p.x),
  top: u(oy + p.y),
});

const sideOf = (config: StageConfig, role: Role): StageSide => config.cast[role]?.side ?? 'right';

type EmojiOf = (item: string) => string | undefined;

/** The characters in this task (the player and the NPCs who speak); the one heard right now bobs. */
function StageCast({
  place,
  roles,
  talking,
}: {
  place: Placing;
  roles: readonly Role[];
  talking: Role | undefined;
}) {
  const { config, ox, oy } = place;
  const actors = roles.flatMap((role) => {
    const actor = config.cast[role];
    const spot = actorSpot(config, role, roles);
    return actor && spot ? [[role, actor, spot] as const] : [];
  });
  return (
    <>
      {actors.map(([role, actor, spot]) => {
        const actorClass = `stage-actor${talking === role ? ' talking' : ''}`;
        if (actor.clipBottom === undefined) {
          return (
            <SpriteSvg
              key={role}
              sprite={actor.sprite}
              class={actorClass}
              style={placeAt(place, spot)}
            />
          );
        }
        // Standing behind a counter: everything below clipBottom is hidden.
        return (
          <div
            key={role}
            class="stage-clip"
            data-role={role}
            style={{
              left: u(ox + spot.x),
              top: 0,
              width: u(16),
              height: u(oy + actor.clipBottom),
            }}
          >
            <SpriteSvg
              sprite={actor.sprite}
              class={actorClass}
              style={{ left: 0, top: u(oy + spot.y) }}
            />
          </div>
        );
      })}
    </>
  );
}

/** How far a later prop on the same side rests from the one before it (stage pixels). */
const PROP_STEP = 14;

/**
 * Things handed over: each rests on the receiver's side, sliding there when
 * just given. A second prop on the same side rests one step further in, so a
 * box and a key do not cover each other.
 */
function StageProps({
  place,
  props,
  emoji,
}: {
  place: Placing;
  props: StageView['props'];
  emoji: EmojiOf;
}) {
  const { config } = place;
  const onSide: Record<StageSide, number> = { left: 0, right: 0 };
  return (
    <>
      {props.map((prop) => {
        const from = sideOf(config, prop.giver);
        const to = other(from);
        const inward = to === 'left' ? 1 : -1;
        const rest = config.rest[to];
        const end = { x: rest.x + inward * PROP_STEP * onSide[to]++, y: rest.y };
        const dx = config.rest[from].x - end.x;
        return (
          <div
            key={prop.lineId}
            class={`stage-prop${prop.sliding ? ' sliding' : ''}`}
            data-item={prop.item}
            style={{
              ...placeAt(place, end),
              '--dx': String(dx),
              ...(prop.sliding ? { animationTimingFunction: `steps(${Math.abs(dx) || 1})` } : {}),
            }}
          >
            <ItemIcon id={prop.item} fallback={emoji(prop.item)} />
          </div>
        );
      })}
    </>
  );
}

/** A thought bubble (want: the item's picture) or a question bubble (ask: "?") over the speaker. */
function StageBubbleView({
  place,
  bubble,
  emoji,
}: {
  place: Placing;
  bubble: NonNullable<StageView['bubble']>;
  emoji: EmojiOf;
}) {
  const side = sideOf(place.config, bubble.role);
  return (
    <div
      class={`stage-bubble ${bubble.act} ${side}`}
      data-act={bubble.act}
      style={placeAt(place, place.config[bubble.act][side])}
    >
      {bubble.act === 'want' && bubble.item ? (
        <ItemIcon id={bubble.item} fallback={emoji(bubble.item)} />
      ) : (
        '?'
      )}
    </div>
  );
}

/**
 * The picture above the story: who is talking to whom, and the props of the
 * scene. Purely decorative (aria-hidden, nothing to press); every piece of
 * information is also in the chat bubbles.
 *
 * The background is painted to cover the area (rounded up to whole stage
 * pixels and anchored at the bottom left, so every pixel lands on the device
 * grid); characters, bubbles and props are placed relative to the core.
 */
function SceneStage({ unit, scene, view, beat, talking, area }: Props) {
  const config = stageFor(unit.id);
  if (!config) return null;
  const { w: W, h: H } = stageCanvasSize(area);
  const place: Placing = { config, ...coreOrigin(W, H) };
  const bg = backgroundUrl(unit.id, config, W, H);
  const roles = rolesOnStage(Object.keys(config.cast) as Role[], scene, beat);
  const emoji: EmojiOf = (item) => unit.words.find((w) => w.id === item)?.emoji;

  return (
    <div
      class="stage"
      style={{
        '--stage-scale': String(area.scale),
        width: `calc(${area.w} * var(--px))`,
        height: `calc(${area.h} * var(--px))`,
      }}
      aria-hidden="true"
      data-testid="stage"
    >
      <div class="stage-canvas" style={{ width: u(W), height: u(H) }}>
        {bg && <img class="stage-bg" src={bg} alt="" draggable={false} />}
        <StageCast place={place} roles={roles} talking={talking} />
        <StageProps place={place} props={view.props} emoji={emoji} />
        {view.bubble && (
          // A new key on every story line, so the bubble pops again.
          <StageBubbleView
            key={`${beat}-${view.bubble.act}`}
            place={place}
            bubble={view.bubble}
            emoji={emoji}
          />
        )}
      </div>
    </div>
  );
}
