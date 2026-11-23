import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { BLOCK_KEYS, takeJustChecked } from '../src/ui/minigames/Arrange';
import { keyName } from '../src/ui/keys';

describe('BLOCK_KEYS (排句子 keys)', () => {
  it('runs row by row over the left hand: 1234, QWER, ASDF, ZXCV', () => {
    expect(BLOCK_KEYS.join('')).toBe('1234qwerasdfzxcv');
  });

  it('are keys the router delivers, and none is 0 (看中文)', () => {
    for (const key of BLOCK_KEYS) expect(keyName({ key, shiftKey: false })).toBe(key);
    expect(BLOCK_KEYS).not.toContain('0');
  });

  it('cover the longest line any unit asks to arrange', () => {
    let longest = 0;
    for (const file of readdirSync('src/data/units')) {
      const unit = JSON.parse(readFileSync(`src/data/units/${file}`, 'utf8'));
      const lines: string[] = [
        ...unit.chunks.map((c: { en: string }) => c.en),
        ...unit.tasks.flatMap(
          (t: { scene?: { speaker: string; chunkId?: string; en: string }[] }) =>
            (t.scene ?? []).filter((l) => l.speaker === 'player' && l.chunkId).map((l) => l.en),
        ),
      ];
      for (const line of lines) longest = Math.max(longest, line.split(/\s+/).length);
    }
    expect(longest).toBeLessThanOrEqual(BLOCK_KEYS.length);
  });
});

describe('takeJustChecked', () => {
  it('is false when no arrange check played the line', () => {
    expect(takeJustChecked('cafe.line.l1')).toBe(false);
  });
});
