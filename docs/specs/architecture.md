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
  ui/               Preact 畫面：App、TownScreen、TaskScreen、SceneStory、ChatLines（對話紀錄）、RolePlay（角色扮演大挑戰）、IntroCards、
                    ResultScreen、ReviewScreen、SettingsPanel、ItemIcon、焦點與對話框工具；
                    ListenScreen（聽力加量）和 listenLoop（它的播放節奏）、GrammarDrillScreen（文法快練）、
                    MistakePanel（進度畫面的最常錯）、exam/（幕結業考：ExamScreen、ExamRunner、ExamListening、
                    ExamReading、ExamResult、ExamReview、ExamTile）
  ui/stage/         劇情小劇場：SceneStage（畫面；TaskStage 讓整個任務都顯示）、stageState（每一句和劇情結束後的舞台狀態）；
                    整個任務都由 audio/pronounce 的 nowPlaying 和 content/units 的 speakerOf 決定誰在跳動
  ui/minigames/     題型元件：ListenPick、ListenPair（聽辨挑戰）、ChooseReply、Arrange、
                    Spell（打字拼字，畫面上的字母鍵盤）、Cloze（聽力填空）、ReadSign（讀招牌／價目）、
                    PictureChoose（看圖選句）、Fill（句子填空）、ReadPassage（讀短文）、Talk（聽對話答題）、
                    Speak、QuestionView，共用的小元件（shared），以及說說看的 hook（usePronScore：一鍵聽你說、自動停、評分）
  learning/         出題（questionGen）、題目的型別和 NO_ITEM（questions）、批改、錯誤提示、FSRS 排程、
                    練習與複習的規則（sessionPlan）、小鎮畫面的進度和「下一關」要去哪一關（townPlan）；
                    幕結業考（exam 規則、examScore 估分）、最常錯（mistakes）、
                    文法快練（grammarDrill、grammarOn）、發音評分（pronScore 算分，spokenScore 是分級和文字）、
                    衝刺的 12 週表（sprintSchedule）、聽力加量的中文顯示（zhMode）
  learning/gen/     句子填空、讀短文、聽對話答題各自的出題檔（fills、passages、talks），加上共用的亂數和打亂選項（common）
  content/          單元型別、載入、內容檢查、音檔項目、角色的中文名稱（roles）、
                    單元順序（unitOrder）、四幕和各幕的地點（acts）、用字分析和平滑度規則（vocab）、
                    幕結業考的型別和計畫（exam）、讀進 src/data/exams 的題目檔（exams）、74 個文法點（grammar）、
                    文法快練的手寫題庫和它的檢查（grammarBank）、結業考檔案的檢查（validateExam）
  content/checks/   三種新題型各自的內容檢查（fills、passages、talks），加上共用的小工具（common）
  core/             共用狀態、存檔、設定
  audio/            發音播放、音軌與音量、背景音樂、音效、錄音（recorder；跟著說的自動停止錄音 utterance）、
                    發音評分（pronModel 給畫面用、pronWorker 在 Web Worker 跑模型、pronFiles 模型檔、pcm 轉成 16 kHz）、
                    每個角色的聲線（voices）
  art/items/        單字像素圖：每個單元一個檔（cafe、moveIn、store、street、market、clothes、clinic、
                    restaurant、postOffice、park），第一幕共 153 個；共用繪圖工具（draw）、對照表和檢查（index）
                    第二幕的 8 個檔（bank、communityCenter、library、repair、jobCenter、resume、interview、dayBefore），共 41 個
  art/stage/        小劇場：共用工具（common）、舞台設定的型別和「你」（config）、每個地點一個檔的背景與角色圖
                    （cafe、moveIn、store、street、market、clothes、clinic、restaurant、postOffice、park；
                    後 7 個檔也匯出自己的整份舞台設定）、依單元 id 列出舞台設定（index）
                    第二幕的 8 個檔（bank、communityCenter、library、repair、jobCenter、resume、interview、dayBefore）也各匯出整份舞台設定；
                    修車與維修、上班前一天各有兩張背景（`backdrops`）
  art/pictures/     看圖選句的圖（96×64）：對照表、尺寸和型別 PictureFn（index）、第一幕的 10 張（act1）、第二幕的 4 張（act2）
  data/units/       單元內容 JSON（第一到四幕共 42 個地點）
  data/grammar/     文法快練的手寫題庫（act1、act2、act3.a、act3.b、act4.a、act4.b；每個文法點約 10 題）
  data/exams/       幕結業考的手寫題，`<exam>.<section>.json`（2026-11-24：12 個檔；沒有手寫題的段落沒有檔）
  data/wordlists/   NGSL、TSL 和補充字表（CC BY-SA 4.0，出處見那裡的 README）
scripts/            gen-audio（產生音檔）、spike-tts（聲線比較）、check-font-glyphs（字型檢查）、
                    vocab-report（用字和難度報表）、sprint-table（產生 sprint.md 的 12 週表）；
                    gen-audio 也讀 src/data/exams
public/audio/       產生出來的發音 mp3 和 manifest.json
public/assets/fonts 俐方體 11 號和授權文件
public/models/w2v2/ 發音評分的模型（wav2vec2-base-960h，8 位元 ONNX，約 95MB，Apache-2.0），分成兩個 50MB 以下的檔
tests/              Vitest 測試
```

### 結業考與文法題庫

| 資料                      | 誰讀                                                                 | 哪裡檢查                                                                             |
| ------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `src/data/exams/*.json`   | `content/exams.ts` → `learning/exam.ts`；`gen-audio.mjs`             | `content/validateExam.ts`；`tests/validateExam.test.ts`、`tests/examContent.test.ts` |
| `src/data/grammar/*.json` | `content/grammarBank.ts`（GRAMMAR_BANK）→ `learning/grammarDrill.ts` | `validateGrammarBank`（grammarBank.ts）；`tests/grammarBank.test.ts`                 |

- 結業考的段落定義在 `content/exam.ts`（`EXAM_PLAN`）。題目全部手寫；沒有手寫檔的段落畫面顯示「準備中」。
- 2026-11-24 拿掉了句子產生器（sentenceGen、examGen、詞庫、句型、句子池、應答題庫）：自動造的句子不夠自然。文法快練改用手寫題庫，結業考改成每段都手寫。
- `tests/examContent.test.ts` 檢查真的題目檔（環境變數 `EXAM_FILE` 只檢查一個檔，`EXAM_REQUIRE_COMPLETE=1` 要求每一段都完成）；`tests/grammarBank.test.ts` 檢查文法題庫（每題一個空格、四個不重複的選項、答案在範圍內、有中文和說明；每個教過的文法點至少 5 題）；`tests/sprintSchedule.test.ts` 檢查 12 週表的數字（`scripts/sprint-table.mjs` 會執行它）。
- 只印出來的開關：`SPRINT_TABLE=print`。

## 狀態

- `src/core/store.ts`：很小的共用狀態，Phaser 和 Preact 都可以讀；`appStore` 存目前畫面、版面和存檔。
- 時間一律由外部傳入（`currentNow()`），排程程式自己不讀時鐘，方便測試和 `?debugDate`。

## 瀏覽器儲存

所有鍵都集中在 `src/core/storageKeys.ts`，前綴一律是 `lamplit.`。

| localStorage 鍵               | 內容                                                      |
| ----------------------------- | --------------------------------------------------------- |
| `lamplit.save.v1`             | 進度存檔                                                  |
| `lamplit.save.v1.debug`       | 使用 `?debugDate` 時的除錯存檔（第一次會複製正式存檔）    |
| `lamplit.settings.v1`         | 設定                                                      |
| `lamplit.recognitionNoteSeen` | 已不再使用（2026-11-25 拿掉語音辨識；舊瀏覽器裡留著無害） |
| `lamplit.save.v1.corrupt`     | 讀不懂的存檔原文（只留第一份，不會覆蓋）                  |
| `lamplit.save.v1.pre-import`  | 匯入存檔代碼之前的存檔原文                                |
| `lamplit.lastExport`          | 上次複製或下載存檔代碼的時間（ISO）                       |
| `lamplit.migrated`            | 舊鍵都搬完了                                              |

**舊鍵搬家**：`src/core/boot.ts` 是 `main.tsx` 第一個載入的模組，在讀存檔和設定之前執行 `migrateStorageKeys`。舊鍵（`pixel-english-town.save.v1`、`.debug`、`pixel-english-town.settings.v1`、`english-learn.recognitionNoteSeen`）如果新鍵還沒有，就複製過去、讀回比對一樣才刪舊鍵；新鍵已經有就保留新鍵、刪舊鍵。任何一步失敗就留著舊鍵，下次啟動再試；全部搬完才寫 `lamplit.migrated`。

**存檔代碼**（`src/core/saveCode.ts`，設定裡的「存檔」）：格式是 `header.payload.check`，三段都是不補 `=` 的 base64url。header 是 `{"typ":"lamplit-save","v":1,"z":"deflate-raw"}`（瀏覽器沒有 `CompressionStream` 時 `z` 是 `"none"`）；payload 是壓縮過的 UTF-8 JSON `{ saveVersion, exportedAt, save, settings }`；check 是 `header.payload` 的 FNV-1a 32 位元雜湊。check 只用來發現代碼沒複製完整，不是簽章，擋不了修改（區網 http 沒有 `crypto.subtle`）。匯入時會去掉 `__proto__`、`constructor`、`prototype` 鍵，把未來的日期拉回今天（未來的 `history`、`mistakes` 日子直接丟掉），再交給 `sanitizeSave`；比目前 `SAVE_VERSION` 新的存檔會拒收。匯入有「合併」（預設，`mergeSaves`，保留這台的設定）和「完全取代」（連設定一起換）兩種，寫入前先把原本的存檔存到 `lamplit.save.v1.pre-import`。

**保護**：存檔寫不進去時 `appStore.saveError` 會亮起，畫面上方出現提示，直到下一次寫入成功；啟動時會呼叫一次 `navigator.storage.persist()`。另一個分頁存檔時，兩邊用 `mergeSaves` 合併而不是互相覆蓋；整個 localStorage 被清掉時保留記憶體裡的進度並寫回去。

**發音模型**（2026-11-25）：跟我說的「評分」和聽力加量的跟著說用裝置上的發音模型。模型放在自己的網站 `public/models/w2v2/`（`model.q8.part0`、`model.q8.part1`，見 `src/audio/pronFiles.ts`），第一次要評分、使用者按「下載並評分」才下載，存進瀏覽器的 Cache API（`lamplit-models-v1`），之後不再下載。模型換了就改檔名和快取名稱，舊的不會被拿來用。模型用 onnxruntime-web（WebAssembly）在 Web Worker 裡跑；錄音只在這台裝置上評分，不會上傳。

### 存檔格式（版本 1）

| 欄位             | 內容                                                                                                                                                                                                                                                                                                     |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cards`          | 學習項目 id → FSRS 卡片（日期存成 ISO 字串）                                                                                                                                                                                                                                                             |
| `tasks`          | `<單元>/<任務>` → 最佳星星數、遊玩次數、聽力加量聽完的次數（`heard`，沒聽過就沒有這欄），和跟著說的最佳成績（`spoken`：`{ score, lines }`，分數是 0～100 的整數、至少 1 句；沒有就沒有這欄）                                                                                                             |
| `coins`          | 金幣                                                                                                                                                                                                                                                                                                     |
| `streak`         | 連續天數和最後日期                                                                                                                                                                                                                                                                                       |
| `lastPlayedDate` | 最後遊玩日期                                                                                                                                                                                                                                                                                             |
| `daily`          | 當天的答題數、答對數、完成任務數、單字快練學的新字數（`sprintNew`）、今日複習答的題數（`reviewed`）、聽力加量聽完的場景數（`listened`）、文法快練答的題數（`grammar`）                                                                                                                                   |
| `history`        | 最近 120 天，每天一筆（key 是 YYYY-MM-DD）：當天的各項數字（含 `grammar`）和 `met`（每日目標是否全部達成，達成過就一直算達成）。每次存檔（`commitSave`）都更新今天那一筆；舊存檔沒有這欄，讀成空的                                                                                                       |
| `route`          | 路線：`kind` 是 `normal` 或 `sprint`，`start` 是最近一次選衝刺的日期（YYYY-MM-DD，沒選過是 null）；`weeks` 是延長後的週數（沒有就是 12），`askedOn` 是最近一次問要不要延長的日期；舊存檔沒有這欄，讀成一般路線                                                                                           |
| `checkpoints`    | 依日期排序的分數：`{ date, listening, reading }`，分數 5～495、5 的倍數；最多留 50 筆；舊存檔沒有這欄，讀成空的。來自結業考的分數多了 `source: "exam"` 和 `act`（1～4），重考時多了 `retake: true`（看過題目，分數可能偏高）；沒有這些欄位的就是玩家輸入的 ETS 練習題分數                                |
| `mistakes`       | 最常錯：日期（YYYY-MM-DD）→ 標籤 → `[答錯次數, 作答次數]`。標籤是 `p:`（相似音組）、`e:`（錯誤類型）、`k:`（題型）、`g:`（文法點）開頭；只留最近 120 天，每天最多 60 個標籤（答錯多的留下）；舊存檔沒有這欄，讀成空的                                                                                    |
| `exams`          | 每場結業考（`exam1`～`exam4`）：`attempts`（考過幾次）、`lastDate`、`listening`、`reading`（估計分數，5～495、5 的倍數）、`seen`（題目 id → 看過幾次，最多 1000 題）。另有 `calibration`：`listening`、`reading`（依 ETS 分數校正的數字，各在 ±50 之內）和 `pairs`（配對過幾次，至少 1）；沒有就沒有這欄 |
| `examRun`        | 進行中的一場結業考：`exam`、`seed`、`startedOn`、`done`（已完成的段，例如 `s1`）、`answers`（題號 → 選項，例如 `o2`）。超過 7 天就丟掉；沒有進行中的就沒有這欄                                                                                                                                           |
| `grammarSeen`    | 文法快練答過的題：題庫 id → `{ at, wrong }`（`at` 是最後一次作答的時間，毫秒；`wrong` 是那次答錯）。最多留 2,000 題（留最新的）；未來的時間讀成現在；沒答過就沒有這欄                                                                                                                                    |

規則：

- 讀檔時驗證每個欄位；JSON 壞掉時用新存檔，卡片數值不合法時換成新卡，**永遠不會因為存檔而讓遊戲出錯**。
- 每答一題就存檔。
- 讀檔時，不合法的新欄位（跟著說的成績、最常錯的標籤、結業考的分數、`examRun` 和 `grammarSeen`）會被丟掉，其餘照常讀。
- 開兩個分頁時：另一個分頁寫入會讓這個分頁重新讀取；寫入前若發現被別的分頁改過，會合併（卡片取較新的、星星取較高的、金幣取較多的）。新欄位的合併規則：跟著說取分數較高的一次（同分取句數較多的）；最常錯的次數取較大的，每天仍最多 60 個標籤；結業考取 `attempts` 較多的、分數取日期較晚的那一次、`seen` 取較大的次數；校正取配對次數較多的那份；進行中的一場取完成段數較多的那份（同一場才比）；`grammarSeen` 每題取時間較晚的那筆；每日和 `history` 的數字（含 `grammar`）取較大的。
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

| 指令                 | 實際執行                     | 作用                                                                          |
| -------------------- | ---------------------------- | ----------------------------------------------------------------------------- |
| `npm run dev`        | `vite`                       | 開發伺服器（http://localhost:5173/）                                          |
| `npm run dev:https`  | `vite --mode https`          | 用自簽憑證的 https 開發伺服器，讓區網的手機能測錄音（見下方「手機上測錄音」） |
| `npm run build`      | `tsc --noEmit && vite build` | 型別檢查加正式建置，輸出到 `dist/`                                            |
| `npm run preview`    | `vite preview`               | 在本機預覽 `dist/` 的正式建置                                                 |
| `npm test`           | `vitest run`                 | 執行所有測試一次                                                              |
| `npm run test:watch` | `vitest`                     | 監看模式，存檔時自動重跑測試                                                  |
| `npm run typecheck`  | `tsc --noEmit`               | 型別檢查                                                                      |
| `npm run lint`       | `eslint .`                   | ESLint                                                                        |
| `npm run format`     | `prettier --write .`         | Prettier 排版（會直接改檔案）                                                 |

<!-- END AUTO-GENERATED -->

`scripts/` 裡的工具：

| 指令                                          | 作用                                                                                                                                                                                                                             |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node --env-file=.env scripts/gen-audio.mjs`  | 產生發音音檔，包括各單元和結業考（`src/data/exams`）；加 `--dry-run` 只預演、不花錢（見 [audio.md](audio.md)）                                                                                                                   |
| `node --env-file=.env scripts/spike-tts.mjs`  | 聲線比較實驗；加 `--dry-run` 只列出計畫                                                                                                                                                                                          |
| `node scripts/check-font-glyphs.mjs <字型檔>` | 檢查字型缺哪些字（見 [visual-style.md](visual-style.md)）                                                                                                                                                                        |
| `npx knip`                                    | 找沒用到的檔案、export 和套件（設定在 `knip.json`：`scripts/*.mjs` 是入口，只在同一個檔案用到的 export 不算）；knip 沒裝進專案，npx 會臨時下載                                                                                   |
| `node scripts/sprint-table.mjs`               | 產生 sprint.md 的 12 週表（實際是執行 `tests/sprintSchedule.test.ts`，設定 `SPRINT_TABLE=print`）；結果放在 sprint.md 的 `<!-- sprint-table:start -->` 和 `<!-- sprint-table:end -->` 之間（2026-11-24 已做）                    |
| `node scripts/vocab-report.mjs`               | 依遊玩順序列出每個任務的用字、難度分數和違反平滑規則的地方；加 `--json` 輸出 JSON、`--starter=N` 把 NGSL 前 N 名當成玩家一開始就認得的字（預設 100）。只是報表，結束碼一律 0（見 [curriculum.md](curriculum.md) 的「用字分析」） |

## 環境變數

<!-- AUTO-GENERATED: .env.example, vite.config.ts -->

| 變數                 | 必要               | 用途                                                       | 設定方式                                                                            |
| -------------------- | ------------------ | ---------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `GOOGLE_TTS_API_KEY` | 只有產生音檔時需要 | Google Cloud API 金鑰，限制只能用 Cloud Text-to-Speech API | 寫在 `.env`（不進版控），腳本用 `--env-file` 讀取                                   |
| `VITE_BASE`          | 否                 | 網站部署路徑，預設 `/lamplit/`                             | 建置時在 shell 設定，例如 `VITE_BASE=/my-repo/ npm run build`；寫在 `.env` 沒有作用 |

<!-- END AUTO-GENERATED -->

## 開發流程

### 測試

- 測試放在 `tests/`，檔名是 `*.test.ts`，用 Vitest。
- 邏輯盡量寫成純函式，時間和儲存空間由外部傳入（例如 `now: Date`、假的 storage），測試才能重現。
- 需要 Web Audio 的測試使用 `tests/fakeAudio.ts` 的假 AudioContext。
- 專案沒有安裝模擬瀏覽器的測試環境（jsdom 或 happy-dom），所以畫面元件本身沒有自動化測試；畫面改動要在瀏覽器裡實際操作確認。
- 場景有快照測試（`tests/streetSnapshot.test.ts`）：繪製結果的雜湊改變就會失敗。刻意改畫面時要更新雜湊，並在說明中寫明原因。
- 內容的平滑度規則由 `tests/smoothness.test.ts` 檢查，和 `scripts/vocab-report.mjs` 共用 `src/content/vocab.ts` 的 `smoothnessBreaks`。改了單元內容後測試失敗時，先跑報表看是哪個任務違反了規則。同一個檔也檢查聽力填空、讀招牌、看圖選句、句子填空、讀短文、聽對話答題的題目只用教過的字。
- 看圖選句的圖由 `tests/pictures.test.ts` 檢查：只用調色盤顏色、整數像素、不超出 96×64、每次畫出來都一樣，而且內容裡用到的每個圖片 id 都有圖。
- 句子填空、讀短文、聽對話答題各有自己的測試檔（`tests/fills.test.ts`、`passages.test.ts`、`talks.test.ts`），測內容檢查和出題；聽對話的播放節奏（`playConversation`）用假的播放和時鐘測，不需要瀏覽器。
- 小劇場由 `tests/stageArt.test.ts`、`tests/stageState.test.ts` 檢查每一個有舞台的單元（見 [scene-stage.md](scene-stage.md) 的「測試」）。
- 2026-11-22 第一幕做完時：34 個測試檔、1,186 個測試，全部通過（`npm test`）。
- 2026-11-23 第二幕做完時：1,588 個測試全部通過；型別檢查、ESLint、Prettier 和正式建置也都沒有錯誤。當時 `knip` 沒有跑（下載不到）；2026-11-25 起可以用 `npx knip` 跑。
- 2026-11-24（已做）新增的測試：結業考的題目檔和計分、最常錯、跟著說、文法快練、聽力加量的播放節奏。每一類的對應檔案：
  - 結業考：`tests/validateExam.test.ts`（手寫題檔的格式、草稿、答案位置不超過 40%）、`tests/examContent.test.ts`（真的題目檔：只用教過的字、圖存在、不抄 5 字以上的句子）、`tests/exam.test.ts`、`tests/examRunner.test.ts`、`tests/examResult.test.ts`、`tests/examScore.test.ts`
  - 文法快練的題庫：`tests/grammarBank.test.ts`、`tests/grammarOn.test.ts`
  - 其他：`tests/mistakes.test.ts`、`tests/saveMistakes.test.ts`、`tests/grammarDrill.test.ts`、`tests/grammar.test.ts`、`tests/pronScore.test.ts`（2026-11-25 取代 `spokenScore.test.ts`）、`tests/listenLoop.test.ts`、`tests/zhMode.test.ts`、`tests/sprintSchedule.test.ts`
  - 測試數這次沒有重新統計，以 `npm test` 的結果為準。

### 手機上測錄音

瀏覽器只在安全連線（https 或 localhost）下開放麥克風。手機用 `http://192.168.x.x` 連開發伺服器時不能錄音，畫面會顯示「錄音需要安全連線（https）」。

1. 電腦執行 `npm run dev:https`，終端機的 `Network:` 那行會顯示 `https://<電腦IP>:5173/`。
2. 手機（和電腦同一個網路）開這個網址。憑證是自己產生的，Safari 會顯示「此連線不是私人連線」：點「顯示詳細資訊」→「瀏覽此網站」。Chrome 則是「進階」→「繼續前往」。
3. 之後就能錄音。也可以改用部署後的 GitHub Pages 網址測試。

### 程式風格

- ESLint 和 Prettier（設定在 `eslint.config.js`、`.prettierrc.json`）。專案沒有 pre-commit hook，提交前要自己執行。
- 程式碼和註解用英文；介面文字和文件用繁體中文（台灣）。

### 提交前檢查清單

- [ ] `npm run typecheck`、`npm run lint`、`npm test`、`npm run build` 都通過
- [ ] `npx prettier --check .` 通過
- [ ] 改了單元內容時：`node scripts/vocab-report.mjs` 確認沒有不符合平滑規則的地方；`node scripts/gen-audio.mjs --dry-run` 確認要產生的音檔，產生後把 `public/audio/` 一起提交
- [ ] 改了畫面或操作時：在手機直向和電腦橫向的瀏覽器畫面都實際操作過
- [ ] 同步更新 `docs/specs/` 裡相關的規格
- [ ] 沒有提交 `.env`、`.tmp/`、`docs/art-image/`

## 部署與維運

### 部署

- 目標是 GitHub Pages，網址路徑預設是 `/lamplit/`（見上方的 `VITE_BASE`）。GitHub Pages 免費方案需要公開的 repo。
- 自動部署：`.github/workflows/pages.yml` 在推上 `main`（或手動執行）時跑測試、用 repo 名稱當 `VITE_BASE` 建置，用 `scripts/check-dist.mjs` 檢查建置結果（`version.json` 是這個 commit、程式裡有同一個版本號、有 `sw.js`、viewport 禁止縮放），刪掉 `dist/audio/manifest.json` 後發布到 GitHub Pages。repo 的 Settings → Pages 要把來源設成「GitHub Actions」。還沒有離線遊玩（PWA）。
- 新版本（2026-11-26）：每次建置把版本號寫進程式和 `version.json`。打開頁面或切回來時（至少隔 30 秒）比對：在標題或小鎮直接重新載入，其他畫面在上方顯示「有新版本，點這裡更新」（`src/core/update.ts`）。`public/sw.js` 讓頁面本身和 `version.json` 永遠跟網路拿、不用快取（GitHub Pages 會讓瀏覽器快取 10 分鐘）；其他檔案檔名有雜湊，不經過它。加到主畫面的 iPhone 網站不會自己重新載入，靠的就是這個。
- 不能縮放（2026-11-26）：viewport `maximum-scale=1, user-scalable=no`，每個元素 `touch-action: pan-x pan-y`（不能雙擊放大也不能雙指縮放），iPhone Safari 另外由 `src/core/noZoom.ts` 擋掉縮放手勢。`tests/mobileGuards.test.ts` 檢查這些設定、確定離開的大小和 `sw.js` 的行為。
- 發布前可以先在本機確認：`npm run build` → `npm run preview`（preview 也用 `/lamplit/` 路徑，和 GitHub Pages 一樣）。
- 生成的音檔隨網站一起發布，但不開放授權（見 [audio.md](audio.md) 和根目錄的 `LICENSE`）。

### 上線後檢查

這是純靜態網站，沒有伺服器端的健康檢查。上線後手動確認：

- 網站能打開，標題畫面顯示正常，console 沒有錯誤。
- 玩完一個任務：發音有聲音、慢速有聲音、結算後重新整理進度還在。
- 手機上用 HTTPS 網址測試錄音（區網 http 不能錄音；開發時用 `npm run dev:https`）。

### 還原

靜態網站，重新發布上一個版本的 `dist/` 即可。玩家的進度存在各自的瀏覽器裡，部署不會影響存檔；存檔格式有版本號，讀檔時會驗證並修正不合法的資料。

### 常見問題

| 狀況                                              | 原因與處理                                                                                                                                               |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 開發時突然白屏，console 說某個模組沒有某個 export | 開發伺服器在大量改檔時讀到寫到一半的檔案。重啟 `npm run dev`                                                                                             |
| 打開網頁後沒有聲音                                | 瀏覽器要求使用者先點一下才能播放；按標題畫面的「點一下開始」                                                                                             |
| 某些句子用機器人聲音念                            | 那個音檔讀取失敗，改用瀏覽器內建語音；檢查 `public/audio/` 有沒有那個檔案，必要時重跑音檔腳本                                                            |
| 手機上不能錄音                                    | 看畫面上的訊息：提到 https 就改用 `npm run dev:https`（見「手機上測錄音」）；提到 App 就改用 Safari 或 Chrome 開啟；提到 iOS 14.5 就要更新系統           |
| 音檔腳本失敗                                      | 確認 `.env` 有 `GOOGLE_TTS_API_KEY`、金鑰有開 Text-to-Speech API；遇到 429 或 5xx 會自動重試一次，仍失敗時結束碼不是 0，重跑即可（已成功的檔案不會重做） |
| 想測試隔天的複習                                  | 網址加 `?debugDate=YYYY-MM-DD`，會使用獨立的除錯存檔                                                                                                     |
