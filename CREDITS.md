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

- 發音音檔（`public/audio/`）：由本專案用 Google Cloud Text-to-Speech 產生（Chirp 3 HD、Neural2 聲線）。作者把這些音檔當作服務產出的內容使用，隨網站一起發布；音檔不開放授權，不能拿去其他地方使用，也不能用來訓練或改進語音合成或其他機器學習模型（見 `LICENSE`）。
- 背景音樂和音效：本專案用 Web Audio 即時合成的原創內容，沒有音檔。

## 資料

- **NGSL 1.2 和 TSL 1.2 字表**（`src/data/wordlists/`，原始檔未修改）：創用 CC 姓名標示－相同方式分享 4.0（CC BY-SA 4.0）。只用在用字分析，遊戲執行時不會載入。
  - New General Service List：Browne, C., Culligan, B. & Phillips, J. (2013)，https://www.newgeneralservicelist.com
  - TOEIC Service List：Browne, C. & Culligan, B. (2016)，https://www.newgeneralservicelist.com
  - 完整的出處和授權說明：`src/data/wordlists/README.md`
- CMUdict 發音字典：還沒加入，使用前要先確認授權條款。

## 程式套件

- Phaser（MIT）、Preact（MIT）、ts-fsrs（MIT）。其餘開發工具見 `package.json`。
