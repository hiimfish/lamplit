# 素材與授權來源

## 字型

- **俐方體 11 號（Cubic 11）**，作者 ACh-K，SIL Open Font License 1.1
  - 來源：https://github.com/ACh-K/Cubic-11
  - 檔案：`public/assets/fonts/Cubic_11.woff2`（原檔，未修改）
  - 授權全文：`public/assets/fonts/Cubic_11-OFL.txt`
  - 「Cubic」「俐方體」是保留名稱：如果修改字型（包含裁字），不能沿用這個名稱。

## 圖像

- 所有圖像都是本專案用程式畫的原創像素圖：街景在 `src/game/`，單字圖示在 `src/art/items/`。沒有使用外部素材包。
- 美術方向參考了幾位畫家的作品（只參考方向，不複製任何作品）；參考圖只在本機使用，不隨專案發布。

## 聲音

- 發音音檔（`public/audio/`）：由本專案用 Google Cloud Text-to-Speech 產生（Chirp 3 HD、Neural2 聲線）。公開發布前需確認 Google Cloud 服務條款，見 `docs/specs/audio.md`。
- 背景音樂和音效：本專案用 Web Audio 即時合成的原創內容，沒有音檔。

## 資料

- 還沒加入。預計使用 NGSL 高頻字表和 CMUdict 發音字典，使用前要先確認授權條款。

## 程式套件

- Phaser（MIT）、Preact（MIT）、ts-fsrs（MIT）。其餘開發工具見 `package.json`。
