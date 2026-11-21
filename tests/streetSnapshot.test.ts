import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { recordingPainter, type Painter } from '../src/game/painter';
import { paintBack } from '../src/game/pixelArt';
import { paintForeground, paintGlow } from '../src/game/street/paintFront';
import { buildStreet, type StreetPlan } from '../src/game/street/plan';

/**
 * Guards the dusk street against accidental visual change. The hashes below were
 * recorded from the code before buildStreet / paintCafeFront were split into
 * helpers; any change to the plan or to a single painted rectangle changes them.
 * Update them only for an intended change to the art.
 */
const SNAPSHOTS: { w: number; h: number; plan: string; layers: string[] }[] = [
  {
    w: 560,
    h: 315,
    plan: '911969cce8cb5c01',
    layers: ['1830450524:76267', '1360859556:3426', '1305993088:632'],
  },
  {
    w: 480,
    h: 270,
    plan: 'f394e39666ca79e7',
    layers: ['1283540382:56641', '3388850026:2930', '4148766258:588'],
  },
  {
    w: 400,
    h: 180,
    plan: '08c846ef0cd08876',
    layers: ['1733277465:33262', '52783294:2422', '438426579:562'],
  },
  {
    w: 240,
    h: 120,
    plan: '45a61aa152153eaa',
    layers: ['927788571:12040', '1674708226:977', '3532900766:264'],
  },
];

function layerHash(paint: (p: Painter, plan: StreetPlan) => void, plan: StreetPlan): string {
  const p = recordingPainter();
  paint(p, plan);
  return `${p.record.hash}:${p.record.ops}`;
}

describe('street snapshot', () => {
  it.each(SNAPSHOTS)(
    'plan and painted layers are unchanged at $w x $h',
    ({ w, h, plan, layers }) => {
      const street = buildStreet(w, h);
      const planHash = createHash('sha256')
        .update(JSON.stringify(street))
        .digest('hex')
        .slice(0, 16);
      expect(planHash).toBe(plan);
      expect([paintBack, paintForeground, paintGlow].map((f) => layerHash(f, street))).toEqual(
        layers,
      );
    },
  );
});
