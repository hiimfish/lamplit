# Lamplit｜英語學習

給台灣成人玩的像素風劇情遊戲。你搬到一個小鎮，跟著四幕故事一路從生活英語走到職場英語：點咖啡、搬家、看醫生，到接電話、出差、跑商展。每個地點都有對話、聽力、發音和閱讀練習，也有依多益題型設計的結業考。

在瀏覽器裡玩，手機和電腦都可以。

## 執行

需要 Node.js 24 以上。

```sh
npm install
npm run dev         # 開發伺服器
npm run dev:https   # 用 https 開，手機在同一個網路上才能用麥克風
npm test            # 跑測試
npm run build       # 建置正式版到 dist/
```

## 文件

設計和規格寫在 [`docs/specs/`](docs/specs/README.md)。

## 商標

TOEIC®（多益）是 ETS 的註冊商標。本遊戲與 ETS 無關，未經 ETS 認可或贊助。

## 授權

- 程式碼和原創內容（故事、對話、題目、用程式畫的像素圖、合成的音樂和音效）採用 MIT 授權，見 [`LICENSE`](LICENSE)。
- 例外：字型（SIL OFL 1.1）、字表（CC BY-SA 4.0），以及 `public/audio/` 的發音音檔（不開放授權）。詳細見 [`LICENSE`](LICENSE) 和 [`CREDITS.md`](CREDITS.md)。
