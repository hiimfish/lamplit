import { describe, expect, it } from 'vitest';
import { BUILD_ID, isNewBuild } from '../src/core/update';

describe('isNewBuild', () => {
  it('is dev outside a build', () => {
    expect(BUILD_ID).toBe('dev');
  });

  it('sees a different id as a new build', () => {
    expect(isNewBuild('abc123', 'def456')).toBe(true);
  });

  it('ignores the same id, an empty one and a bad file', () => {
    expect(isNewBuild('abc123', 'abc123')).toBe(false);
    expect(isNewBuild('', 'abc123')).toBe(false);
    expect(isNewBuild(null, 'abc123')).toBe(false);
    expect(isNewBuild(42, 'abc123')).toBe(false);
  });
});
