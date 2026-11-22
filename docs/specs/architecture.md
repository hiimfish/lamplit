# 技術架構

技術選擇、目錄結構、存檔格式、安全、開發指令和部署。

## 技術選擇

| 項目     | 選擇                                                                         |
| -------- | ---------------------------------------------------------------------------- |
| 建置     | Vite、TypeScript                                                             |
| 街景畫布 | Phaser 4                                                                     |
| 文字介面 | Preact（對話、題目、選單、設定都是網頁元素，方便輸入、換行、無障礙和測試）   |
| 複習排程 | ts-fsrs                                                                      |
| 測試     | Vitest                                                                       |
| 程式品質 | ESLint、Prettier                                                             |
| 發音     | Google Cloud Text-to-Speech（只在產生音檔時使用，透過 REST API 和 API 金鑰） |
| 部署     | GitHub Pages（純靜態網站，沒有後端）                                         |

**混合架構**：Phaser 只負責背後的街景和動畫；所有文字和操作都是 Preact 介面，疊在畫布上（橫向）或放在畫布下方（直向）。

## 目錄

```
src/
  main.tsx          啟動 Phaser 和 Preact，計算版面
  layout.ts         整數倍縮放的版面計算
  styles.css        全域樣式和配色變數
  game/             Phaser 街景：palette、painter、street/（配置與繪製）、scenes/TitleScene
  ui/               Preact 畫面：App、TownScreen、TaskScreen、SceneStory、IntroCards、
                    ResultScreen、ReviewScreen、SettingsPanel、ItemIcon、焦點與對話框工具
  ui/stage/         劇情小劇場：SceneStage（畫面）、stageState（每一句時的舞台狀態）
  ui/minigames/     題型元件：ListenPick、ListenPair（聽辨挑戰）、ChooseReply、Arrange、
                    Speak、QuestionView，以及錄音和辨識的 hook
  learning/         出題、批改、錯誤提示、FSRS 排程、練習與複習的規則
  content/          單元型別、載入、內容檢查、音檔項目、角色的中文名稱（roles）
  core/             共用狀態、存檔、設定
  audio/            發音播放、音軌與音量、背景音樂、音效、錄音、語音辨識
  art/              單字像素圖；art/stage/ 是小劇場：共用工具（common）、咖啡廳和搬家第一天的背景與角色圖、每個單元的舞台設定
  data/units/       單元內容 JSON
scripts/            gen-audio（產生音檔）、spike-tts（聲線比較）、check-font-glyphs（字型檢查）
public/audio/       產生出來的發音 mp3 和 manifest.json
public/assets/fonts 俐方體 11 號和授權文件
tests/              Vitest 測試
```

## 狀態

- `src/core/store.ts`：很小的共用狀態，Phaser 和 Preact 都可以讀；`appStore` 存目前畫面、版面和存檔。
- 時間一律由外部傳入（`currentNow()`），排程程式自己不讀時鐘，方便測試和 `?debugDate`。

## 瀏覽器儲存

| localStorage 鍵                     | 內容                                                   |
| ----------------------------------- | ------------------------------------------------------ |
| `pixel-english-town.save.v1`        | 進度存檔                                               |
| `pixel-english-town.save.v1.debug`  | 使用 `?debugDate` 時的除錯存檔（第一次會複製正式存檔） |
| `pixel-english-town.settings.v1`    | 設定                                                   |
| `english-learn.recognitionNoteSeen` | 已同意語音辨識的隱私說明                               |

### 存檔格式（版本 1）

| 欄位             | 內容                                         |
| ---------------- | -------------------------------------------- |
| `cards`          | 學習項目 id → FSRS 卡片（日期存成 ISO 字串） |
| `tasks`          | `<單元>/<任務>` → 最佳星星數和遊玩次數       |
| `coins`          | 金幣                                         |
| `streak`         | 連續天數和最後日期                           |
| `lastPlayedDate` | 最後遊玩日期                                 |
| `daily`          | 當天的答題數和答對數                         |

規則：

- 讀檔時驗證每個欄位；JSON 壞掉時用新存檔，卡片數值不合法時換成新卡，**永遠不會因為存檔而讓遊戲出錯**。
- 每答一題就存檔。
- 開兩個分頁時：另一個分頁寫入會讓這個分頁重新讀取；寫入前若發現被別的分頁改過，會合併（卡片取較新的、星星取較高的、金幣取較多的）。
- 匯出／匯入存檔代碼的函式已寫好，還沒有介面。

## 安全

- Google 金鑰只放在本機 `.env`（已被 git 忽略），只有 `scripts/` 的腳本會讀，不會進入打包後的網站。
- 金鑰只放在請求的 header，不會出現在網址或 log。
- 介面不使用 `innerHTML`；所有文字經由 Preact 輸出。
- `.tmp/`（暫存）和 `docs/art-image/`（他人作品）都被 git 忽略。

## 開發環境

- Node.js 24（`scripts/gen-audio.mjs` 直接匯入 `.ts` 檔，需要支援 type stripping 的 Node 版本；專案在 Node 24 上開發和測試）。
- 第一次執行 `npm install`。
- 只有要產生發音音檔時才需要 `.env`：把 `.env.example` 複製成 `.env`，填入金鑰。

## 開發指令

<!-- AUTO-GENERATED: package.json scripts -->

| 指令                 | 實際執行                     | 作用                                 |
| -------------------- | ---------------------------- | ------------------------------------ |
| `npm run dev`        | `vite`                       | 開發伺服器（http://localhost:5173/） |
| `npm run build`      | `tsc --noEmit && vite build` | 型別檢查加正式建置，輸出到 `dist/`   |
| `npm run preview`    | `vite preview`               | 在本機預覽 `dist/` 的正式建置        |
| `npm test`           | `vitest run`                 | 執行所有測試一次                     |
| `npm run test:watch` | `vitest`                     | 監看模式，存檔時自動重跑測試         |
| `npm run typecheck`  | `tsc --noEmit`               | 型別檢查                             |
| `npm run lint`       | `eslint .`                   | ESLint                               |
| `npm run format`     | `prettier --write .`         | Prettier 排版（會直接改檔案）        |

<!-- END AUTO-GENERATED -->

`scripts/` 裡的工具：

| 指令                                          | 作用                                                                   |
| --------------------------------------------- | ---------------------------------------------------------------------- |
| `node --env-file=.env scripts/gen-audio.mjs`  | 產生發音音檔；加 `--dry-run` 只預演、不花錢（見 [audio.md](audio.md)） |
| `node --env-file=.env scripts/spike-tts.mjs`  | 聲線比較實驗；加 `--dry-run` 只列出計畫                                |
| `node scripts/check-font-glyphs.mjs <字型檔>` | 檢查字型缺哪些字（見 [visual-style.md](visual-style.md)）              |

## 環境變數

<!-- AUTO-GENERATED: .env.example, vite.config.ts -->

| 變數                 | 必要               | 用途                                                       | 設定方式                                                                            |
| -------------------- | ------------------ | ---------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `GOOGLE_TTS_API_KEY` | 只有產生音檔時需要 | Google Cloud API 金鑰，限制只能用 Cloud Text-to-Speech API | 寫在 `.env`（不進版控），腳本用 `--env-file` 讀取                                   |
| `VITE_BASE`          | 否                 | 網站部署路徑，預設 `/english-learn/`                       | 建置時在 shell 設定，例如 `VITE_BASE=/my-repo/ npm run build`；寫在 `.env` 沒有作用 |

<!-- END AUTO-GENERATED -->

## 開發流程

### 測試

- 測試放在 `tests/`，檔名是 `*.test.ts`，用 Vitest。
- 邏輯盡量寫成純函式，時間和儲存空間由外部傳入（例如 `now: Date`、假的 storage），測試才能重現。
- 需要 Web Audio 的測試使用 `tests/fakeAudio.ts` 的假 AudioContext。
- 專案沒有安裝模擬瀏覽器的測試環境（jsdom 或 happy-dom），所以畫面元件本身沒有自動化測試；畫面改動要在瀏覽器裡實際操作確認。
- 場景有快照測試（`tests/streetSnapshot.test.ts`）：繪製結果的雜湊改變就會失敗。刻意改畫面時要更新雜湊，並在說明中寫明原因。

### 程式風格

- ESLint 和 Prettier（設定在 `eslint.config.js`、`.prettierrc.json`）。專案沒有 pre-commit hook，提交前要自己執行。
- 程式碼和註解用英文；介面文字和文件用繁體中文（台灣）。

### 提交前檢查清單

- [ ] `npm run typecheck`、`npm run lint`、`npm test`、`npm run build` 都通過
- [ ] `npx prettier --check .` 通過
- [ ] 改了單元內容時：`node scripts/gen-audio.mjs --dry-run` 確認要產生的音檔，產生後把 `public/audio/` 一起提交
- [ ] 改了畫面或操作時：在手機直向和電腦橫向的瀏覽器畫面都實際操作過
- [ ] 同步更新 `docs/specs/` 裡相關的規格
- [ ] 沒有提交 `.env`、`.tmp/`、`docs/art-image/`

## 部署與維運

### 部署

- 目標是 GitHub Pages，網址路徑預設是 `/english-learn/`（見上方的 `VITE_BASE`）。GitHub Pages 免費方案需要公開的 repo。
- **目前尚未部署**，也還沒有自動部署（GitHub Actions）和離線遊玩（PWA）。
- 手動部署的步驟：`npm run build` → 把 `dist/` 的內容發布到 GitHub Pages。發布前先用 `npm run preview` 在本機確認。
- 發布前要先確認 Google Cloud 服務條款允許公開生成的音檔（見 [audio.md](audio.md)）。

### 上線後檢查

這是純靜態網站，沒有伺服器端的健康檢查。上線後手動確認：

- 網站能打開，標題畫面顯示正常，console 沒有錯誤。
- 玩完一個任務：發音有聲音、慢速有聲音、結算後重新整理進度還在。
- 手機上用 HTTPS 網址測試錄音（區網 http 不能錄音）。

### 還原

靜態網站，重新發布上一個版本的 `dist/` 即可。玩家的進度存在各自的瀏覽器裡，部署不會影響存檔；存檔格式有版本號，讀檔時會驗證並修正不合法的資料。

### 常見問題

| 狀況                                              | 原因與處理                                                                                                                                               |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 開發時突然白屏，console 說某個模組沒有某個 export | 開發伺服器在大量改檔時讀到寫到一半的檔案。重啟 `npm run dev`                                                                                             |
| 打開網頁後沒有聲音                                | 瀏覽器要求使用者先點一下才能播放；按標題畫面的「點一下開始」                                                                                             |
| 某些句子用機器人聲音念                            | 那個音檔讀取失敗，改用瀏覽器內建語音；檢查 `public/audio/` 有沒有那個檔案，必要時重跑音檔腳本                                                            |
| 手機上不能錄音                                    | 需要 HTTPS；區網 http 連線時瀏覽器不允許使用麥克風                                                                                                       |
| 音檔腳本失敗                                      | 確認 `.env` 有 `GOOGLE_TTS_API_KEY`、金鑰有開 Text-to-Speech API；遇到 429 或 5xx 會自動重試一次，仍失敗時結束碼不是 0，重跑即可（已成功的檔案不會重做） |
| 想測試隔天的複習                                  | 網址加 `?debugDate=YYYY-MM-DD`，會使用獨立的除錯存檔                                                                                                     |
