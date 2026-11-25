# 素材與授權來源

## 字型

- **俐方體 11 號（Cubic 11）**，作者 ACh-K，SIL Open Font License 1.1
  - 來源：https://github.com/ACh-K/Cubic-11
  - 檔案：`public/assets/fonts/Cubic_11.woff2`（原檔，未修改）
  - 授權全文：`public/assets/fonts/Cubic_11-OFL.txt`
  - 「Cubic」「俐方體」是保留名稱：如果修改字型（包含裁字），不能沿用這個名稱。

## 圖像

- 街景、小劇場和具體名詞的單字圖示，都是本專案用程式畫的原創像素圖：街景在 `src/game/`，單字圖示在 `src/art/items/`。
- **Twemoji**（© Twitter, Inc. 和其他貢獻者，圖像採創用 CC 姓名標示 4.0，CC BY 4.0）：抽象字的單字圖示（`src/art/emoji/sprites.ts`）由 Twemoji 的 emoji 圖改作而成
  - 來源：https://github.com/jdecked/twemoji （透過 npm 套件 `@twemoji/svg` 15.0.0 取得）
  - 授權：https://creativecommons.org/licenses/by/4.0/
  - 修改方式：縮小成 24×24 像素、顏色換成遊戲調色盤、加上墨色外框（`scripts/emoji-pixels.mjs`）。≈ ≠ ∴ ◐ 和霧（🌫）是本專案自己畫的。
- 美術方向參考了幾位畫家的作品（只參考方向，不複製任何作品）；參考圖只在本機使用，不隨專案發布。

## 聲音

- 發音音檔（`public/audio/`）：由本專案用 Google Cloud Text-to-Speech 產生（Chirp 3 HD、Neural2 聲線）。作者把這些音檔當作服務產出的內容使用，隨網站一起發布；音檔不開放授權，不能拿去其他地方使用，也不能用來訓練或改進語音合成或其他機器學習模型（見 `LICENSE`）。
- 背景音樂和音效：本專案用 Web Audio 即時合成的原創內容，沒有音檔。

## 資料

- **NGSL 1.2 和 TSL 1.2 字表**（`src/data/wordlists/`，原始檔未修改）：創用 CC 姓名標示－相同方式分享 4.0（CC BY-SA 4.0）。只用在用字分析，遊戲執行時不會載入。
  - New General Service List：Browne, C., Culligan, B. & Phillips, J. (2013)，https://www.newgeneralservicelist.com
  - TOEIC Service List：Browne, C. & Culligan, B. (2016)，https://www.newgeneralservicelist.com
  - 完整的出處和授權說明：`src/data/wordlists/README.md`
- CMUdict 發音字典：還沒加入，使用前要先確認授權條款。

## 發音評分模型

- **wav2vec2-base-960h**（Meta AI，Apache License 2.0），8 位元量化的 ONNX 版本取自 Xenova/wav2vec2-base-960h
  - 來源：https://huggingface.co/facebook/wav2vec2-base-960h 、https://huggingface.co/Xenova/wav2vec2-base-960h
  - 檔案：`public/models/w2v2/model.q8.part0`、`model.q8.part1`（`model_quantized.onnx` 原檔切成兩半，接起來就是原檔，未修改）
  - 授權全文：`public/models/w2v2/LICENSE-Apache-2.0.txt`
  - 只在玩家的裝置上執行，用來替「大聲說說看」和聽力加量「跟著說」的錄音評分；錄音不會上傳。

## 程式套件

- Phaser（MIT）、Preact（MIT）、ts-fsrs（MIT）、onnxruntime-web（MIT，執行發音評分模型）。其餘開發工具見 `package.json`。
