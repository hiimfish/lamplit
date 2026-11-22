# 內容規格

學習內容和程式分開：每個地點是 `src/data/units/` 下的一個 JSON 檔，程式不寫死任何課程內容。

## 單元格式

型別定義在 `src/content/types.ts`。

```json
{
  "id": "cafe",
  "title": "咖啡廳",
  "titleEn": "The Café",
  "chunks": [
    {
      "id": "can_i_get",
      "en": "Can I get a latte, please?",
      "zh": "可以給我一杯拿鐵嗎？",
      "accept": ["Can I get a latte?"],
      "note": "Can I get…? 是點餐最常用的說法，比 I want… 有禮貌。",
      "distractors": [{ "text": "Can I get latte, please?", "error": "article" }]
    }
  ],
  "words": [{ "id": "latte", "en": "latte", "zh": "拿鐵", "emoji": "☕" }],
  "tasks": [
    {
      "id": "t1",
      "title": "點一杯拿鐵",
      "newChunkIds": ["can_i_get"],
      "newWordIds": ["latte"],
      "scene": [
        {
          "id": "t1_1",
          "role": "barista",
          "speaker": "npc",
          "en": "Hi! What can I get for you?",
          "zh": "嗨！要點什麼？"
        },
        {
          "id": "t1_2",
          "role": "guide",
          "speaker": "player",
          "en": "Can I get a latte, please?",
          "zh": "可以給我一杯拿鐵嗎？",
          "chunkId": "can_i_get"
        }
      ]
    }
  ]
}
```

| 欄位                   | 說明                                                                                                                              |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `chunks[].accept`      | 其他可接受的寫法，用於排句子等題型                                                                                                |
| `chunks[].note`        | 一行中文文法小抄（選填）                                                                                                          |
| `chunks[].distractors` | 似是而非的錯誤說法，各自標上錯誤類型，用來給具體回饋                                                                              |
| `words[].emoji`        | 備用圖。正式圖示是 `src/art/items/` 裡的像素圖，沒有像素圖時才顯示 emoji                                                          |
| `words[].abstract`     | 選填。抽象或不好畫的字（welcome、okay、數字、動詞）標 `true`，不畫像素圖，一律顯示 emoji。具體名詞不要標                          |
| `scene[].role`         | 誰的聲音：`barista`（店員）、`landlord`（房東）或 `guide`（你和詞塊、單字、對比詞的發音）                                         |
| `scene[].speaker`      | `npc` 是角色說的，`player` 是學習者要說的                                                                                         |
| `scene[].chunkId`      | `player` 台詞一定要有，指向它練習的詞塊                                                                                           |
| `scene[].stage`        | 小劇場的道具動作（選填）：`want`／`give` 加單字 id，或 `ask`；見 [scene-stage.md](scene-stage.md)                                 |
| `pairs[]`              | 最小對比詞（選填），給聽辨挑戰用：`id`、`focus`（例如「f／v」）、`note`（一行發音提示）、`a`／`b` 兩個字（各有 `id`、`en`、`zh`） |
| `tasks[].kind`         | 任務種類（選填）：不寫是一般任務；`roleplay` 是角色扮演大挑戰，只複習，不教新內容                                                 |
| `tasks[].newPairIds`   | 這個任務新教的對比詞（選填）                                                                                                      |

對比詞的例子（`move_in.json`）：

```json
{
  "id": "fan_van",
  "focus": "f／v",
  "note": "兩個都是上排牙齒輕碰下唇。f 只吹氣；v 喉嚨要震動。",
  "a": { "id": "fan", "en": "fan", "zh": "電風扇" },
  "b": { "id": "van", "en": "van", "zh": "廂型車" }
}
```

## id 規則

- 單元、詞塊、單字、對比詞（和它的兩個字）、台詞、任務的 id 只能用小寫英文、數字和底線：`^[a-z0-9_]+$`。
- 學習項目 id：`chunk:<詞塊 id>`、`word:<單字 id>`、`pair:<對比詞 id>`，用於存檔和複習。一組對比詞是一個學習項目。
- 學習項目 id 不含單元，所以**不同單元不能用同一個詞塊、單字或對比詞 id**，否則會共用複習卡片、查到別的單元。`tests/content.test.ts` 會檢查。
- 音檔 id：`<單元>.<類型>.<id>`，例如 `cafe.chunk.can_i_get`、`cafe.word.latte`、`cafe.line.t1_1`、`move_in.pair.fan`。音檔腳本和播放程式都會拒絕不符合格式的 id。

## 內容檢查

`src/content/validate.ts` 的 `validateUnit` 會檢查：

- 所有 id 符合格式，而且不重複（台詞 id 在整個單元內不重複）。
- 任務引用的詞塊、單字和台詞的 `chunkId` 都存在。
- 每句 `player` 台詞都有 `chunkId`。
- `role` 和 `speaker` 是合法值。
- 對比詞：id 和兩個字的 id 符合格式、不重複；有 `focus`；兩個字都有 `en`、`zh` 而且不一樣；任務的 `newPairIds` 都存在。
- `stage` 的 `act` 合法；`want`／`give` 的 `item` 是同單元的單字，`ask` 不帶 `item`。
- `kind` 只能是 `roleplay`。角色扮演任務：`newChunkIds`、`newWordIds` 是空的，沒有 `newPairIds`；第一句是 NPC 說的，每句 `player` 台詞前面都是 NPC 的台詞；至少 2 句 `player` 台詞；台詞用的詞塊都在同一個單元更早的任務教過。

不合格的單元不會被載入，開發模式下會在 console 顯示警告。`tests/content.test.ts` 會檢查 `src/data/units/` 裡的每個單元。

## 現有單元

小鎮畫面依 `src/content/unitOrder.ts` 的 `UNIT_ORDER` 排列（用字分析腳本也照這個順序）：搬家第一天在前，咖啡廳在後。兩個單元都一開始就能玩，單元之間沒有解鎖條件。

### 搬家第一天（`move_in`）

- 14 個詞塊、22 個單字（11 個標 `abstract`：welcome、okay、neighbor、two～nine）、6 組對比詞、8 個任務、48 句劇情台詞。NPC 是房東 Mr. Bell（`landlord`，t1～t5、t8）和鄰居 Lena（`neighbor`，t6～t7）。
- 任務：見到房東（自我介紹）、名字怎麼拼（How do you spell that?）、垃圾怎麼丟（Can you speak more slowly, please?）、搬箱子、聊聊自己、認識鄰居、請鄰居進來坐，最後是角色扮演大挑戰（和房東重演第一天：自我介紹、從哪裡來、一個人住、聽不懂請他說慢一點，你說 6 句）。
- 對比詞：fan/van、light/right、bed/bad、sink/think、ship/sheep、cap/cup，t1～t3 每個任務兩組；t4～t7 沒有對比詞。
- 單字像素圖：鑰匙、箱子、門、椅子、檯燈、垃圾桶、房間、家、汽車、手機、沙發。對比詞不用圖（聽辨題只靠聲音）。
- 小劇場：新家玄關，房東或鄰居（只畫這個任務有說話的角色）；16 句台詞有道具提示，見 [scene-stage.md](scene-stage.md)。
- 英文句子還沒請人審閱，發音還沒請使用者試聽。

### 咖啡廳（`cafe`）

- 14 個詞塊、21 個單字（4 個標 `abstract`：outside、inside、sit、read）、8 個任務、41 句劇情台詞。
- 任務：點一杯拿鐵、內用還是外帶、付錢、冰的不加糖、大杯小杯、外面有位子嗎、這裡有人坐嗎，最後是角色扮演大挑戰（從點冰咖啡到付錢拿飲料，中間聽不懂請店員再說一次，你說 6 句）。
- 單字像素圖：拿鐵、茶、瑪芬、水、蛋糕、三明治、冰咖啡、冰塊、糖、餅乾、小中大杯（三個杯子排一排，標出那一個）、桌子、窗戶、座位（高腳椅）、書。

## 新增一個單元

1. 在 `src/data/units/` 新增 JSON 檔，照上面的格式寫。
2. 執行 `npx vitest run tests/content.test.ts`，確認內容檢查通過。
3. 為新的具體名詞在 `src/art/items/<單元>.ts` 畫 24×24 像素圖，並登記到該檔的對照表（規格見 [visual-style.md](visual-style.md)）；`tests/items.test.ts` 會檢查每個沒標 `abstract` 的單字都有圖。
4. 產生發音音檔，步驟見 [audio.md](audio.md) 的「產生音檔」。
5. 上線前請英文好的人看過句子，確認自然道地。

## 尚未做到

- 用 NGSL 高頻字表自動檢查用字：部分做到。`node scripts/vocab-report.mjs` 會列出每個任務的用字和難度，平滑規則 3、4、6 由 `tests/smoothness.test.ts` 擋下（見 [curriculum.md](curriculum.md) 的「用字分析」）；「用字有沒有超出這一幕的頻率範圍」還沒檢查。
- KK 音標：計畫用開源發音字典 CMUdict 轉換。像素字型缺大部分音標符號，見 [visual-style.md](visual-style.md) 的「字型」。
