// Usage: node scripts/check-font-glyphs.mjs <path-to-font>
// Reports which characters the game needs are missing from a font file.
import { readFileSync } from 'node:fs';
import * as fontkit from 'fontkit';

const fontPath = process.argv[2];
if (!fontPath) {
  console.error('Usage: node scripts/check-font-glyphs.mjs <font-file>');
  process.exit(1);
}

const font = fontkit.create(readFileSync(fontPath));

const groups = {
  'KK 母音': 'i ɪ e ɛ æ ɑ ɔ o ʊ u ʌ ə ɚ ɝ',
  'KK 子音': 'p b t d k g f v θ ð s z ʃ ʒ h m n ŋ l r j w',
  'KK 重音與符號': 'ˋ ˏ [ ] ḷ ṃ ṇ',
  'IPA 補充': 'ɡ ː ˈ ˌ ɹ ɒ ɜ',
  英文標點: '. , ! ? \' " ’ “ ” … — - : ; ( ) /',
  中文標點: '， 。 ！ ？ 、 ： ； 「 」 （ ） … ～',
  介面符號: '★ ☆ ♪ ♥ ▶ ◀ ▲ ▼ ● ○ ✓ ✗ → ← ↑ ↓ × ÷ ® © ·',
  中文抽樣: '英語學習點一下開始咖啡廳拿鐵複習發音慢速錄音設定繼續',
  標題頁聲明: '多益註冊商標本遊戲與無關未經認可或贊助',
};

console.log(`font: ${font.fullName}  glyphs: ${font.numGlyphs}  unitsPerEm: ${font.unitsPerEm}`);
let missingTotal = 0;
for (const [name, chars] of Object.entries(groups)) {
  const list = [...chars].filter((c) => c !== ' ');
  const missing = list.filter((c) => !font.hasGlyphForCodePoint(c.codePointAt(0)));
  missingTotal += missing.length;
  const status = missing.length === 0 ? 'OK' : `缺 ${missing.length}: ${missing.join(' ')}`;
  console.log(`${name.padEnd(12)} ${list.length} 字  ${status}`);
}
console.log(missingTotal === 0 ? '\n全部都有' : `\n總共缺 ${missingTotal} 個字`);
