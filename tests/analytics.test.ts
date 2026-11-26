import { describe, expect, it } from 'vitest';
import { analyticsOn, cleanParams, GA_ID } from '../src/core/analytics';

describe('analyticsOn', () => {
  const env = { id: 'G-ABC123XYZ', dev: false, search: '', allowed: true };

  it('is on with an id, in a build, when allowed', () => {
    expect(analyticsOn(env)).toBe(true);
  });

  it('is off without a real measurement id', () => {
    expect(analyticsOn({ ...env, id: '' })).toBe(false);
    expect(analyticsOn({ ...env, id: 'UA-1234-5' })).toBe(false);
  });

  it('is off on the dev server, in a debugDate session, and when the player turned it off', () => {
    expect(analyticsOn({ ...env, dev: true })).toBe(false);
    expect(analyticsOn({ ...env, search: '?debugDate=2026-12-01' })).toBe(false);
    expect(analyticsOn({ ...env, allowed: false })).toBe(false);
  });
});

describe('GA_ID', () => {
  it('is empty or a GA4 measurement id', () => {
    expect(GA_ID).toMatch(/^(G-[A-Z0-9]+)?$/);
  });
});

describe('cleanParams', () => {
  it('drops unset values and cuts long strings', () => {
    expect(cleanParams({ a: 1, b: undefined, c: false, d: 'x'.repeat(150) })).toEqual({
      a: 1,
      c: false,
      d: 'x'.repeat(100),
    });
  });
});
