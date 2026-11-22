import type { CSSProperties } from 'preact';
import { spriteRuns, type PixelRun } from '../../art/items';
import { coreOrigin, stageFor, type StageConfig, type StageSide } from '../../art/stage';
import type { Role, SceneLine, Unit } from '../../content/types';
import { canvasPainter } from '../../game/painter';
import type { PixelSprite } from '../../game/sprites';
import { ItemIcon } from '../ItemIcon';
import { stageCanvasSize, type StageArea } from './stageArea';
import { stageAt } from './stageState';
import './stage.css';

export function hasStage(unitId: string): boolean {
  return stageFor(unitId) !== undefined;
}

interface Props {
  unit: Unit;
  lines: readonly SceneLine[];
  /** How many lines of the story are on screen. */
  shown: number;
  /** The role whose line is being heard right now (bobs while it plays). */
  talking: Role | undefined;
  area: StageArea;
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

/**
 * The picture above the story: who is talking to whom, and the props of the
 * scene. Purely decorative (aria-hidden, nothing to press); every piece of
 * information is also in the chat bubbles.
 *
 * The background is painted to cover the area (rounded up to whole stage
 * pixels and anchored at the bottom left, so every pixel lands on the device
 * grid); characters, bubbles and props are placed relative to the core.
 */
export function SceneStage({ unit, lines, shown, talking, area }: Props) {
  const config = stageFor(unit.id);
  if (!config) return null;
  const { w: W, h: H } = stageCanvasSize(area);
  const { ox, oy } = coreOrigin(W, H);
  const view = stageAt(lines, shown);
  const bg = backgroundUrl(unit.id, config, W, H);
  const sideOf = (role: Role): StageSide => config.cast[role]?.side ?? 'right';
  const emoji = (item: string) => unit.words.find((w) => w.id === item)?.emoji;
  const at = (p: { x: number; y: number }) => ({ left: u(ox + p.x), top: u(oy + p.y) });

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
        {(Object.entries(config.cast) as [Role, NonNullable<StageConfig['cast'][Role]>][]).map(
          ([role, actor]) => {
            const bob = talking === role ? ' talking' : '';
            if (actor.clipBottom !== undefined) {
              return (
                <div
                  key={role}
                  class="stage-clip"
                  data-role={role}
                  style={{
                    left: u(ox + actor.x),
                    top: 0,
                    width: u(16),
                    height: u(oy + actor.clipBottom),
                  }}
                >
                  <SpriteSvg
                    sprite={actor.sprite}
                    class={`stage-actor${bob}`}
                    style={{ left: 0, top: u(oy + actor.y) }}
                  />
                </div>
              );
            }
            return (
              <SpriteSvg
                key={role}
                sprite={actor.sprite}
                class={`stage-actor${bob}`}
                style={at(actor)}
              />
            );
          },
        )}
        {view.props.map((prop) => {
          const from = sideOf(prop.giver);
          const end = config.rest[other(from)];
          const dx = config.rest[from].x - end.x;
          return (
            <div
              key={prop.lineId}
              class={`stage-prop${prop.sliding ? ' sliding' : ''}`}
              data-item={prop.item}
              style={{
                ...at(end),
                '--dx': String(dx),
                ...(prop.sliding ? { animationTimingFunction: `steps(${Math.abs(dx) || 1})` } : {}),
              }}
            >
              <ItemIcon id={prop.item} fallback={emoji(prop.item)} />
            </div>
          );
        })}
        {view.bubble &&
          (() => {
            const { bubble } = view;
            const side = sideOf(bubble.role);
            return (
              <div
                key={`${shown}-${bubble.act}`}
                class={`stage-bubble ${bubble.act} ${side}`}
                data-act={bubble.act}
                style={at(config[bubble.act][side])}
              >
                {bubble.act === 'want' && bubble.item ? (
                  <ItemIcon id={bubble.item} fallback={emoji(bubble.item)} />
                ) : (
                  '?'
                )}
              </div>
            );
          })()}
      </div>
    </div>
  );
}
