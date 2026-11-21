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

| 欄位                   | 說明                                                                       |
| ---------------------- | -------------------------------------------------------------------------- |
| `chunks[].accept`      | 其他可接受的寫法，用於排句子等題型                                         |
| `chunks[].note`        | 一行中文文法小抄（選填）                                                   |
| `chunks[].distractors` | 似是而非的錯誤說法，各自標上錯誤類型，用來給具體回饋                       |
| `words[].emoji`        | 備用圖。正式圖示是 `src/art/items.ts` 裡的像素圖，沒有像素圖時才顯示 emoji |
| `scene[].role`         | 誰的聲音：`barista`（店員）或 `guide`（你和詞塊、單字的發音）              |
| `scene[].speaker`      | `npc` 是角色說的，`player` 是學習者要說的                                  |
| `scene[].chunkId`      | `player` 台詞一定要有，指向它練習的詞塊                                    |

## id 規則

- 單元、詞塊、單字、台詞、任務的 id 只能用小寫英文、數字和底線：`^[a-z0-9_]+$`。
- 學習項目 id：`chunk:<詞塊 id>`、`word:<單字 id>`，用於存檔和複習。
- 音檔 id：`<單元>.<類型>.<id>`，例如 `cafe.chunk.can_i_get`、`cafe.word.latte`、`cafe.line.t1_1`。音檔腳本和播放程式都會拒絕不符合格式的 id。

## 內容檢查

`src/content/validate.ts` 的 `validateUnit` 會檢查：

- 所有 id 符合格式，而且不重複（台詞 id 在整個單元內不重複）。
- 任務引用的詞塊、單字和台詞的 `chunkId` 都存在。
- 每句 `player` 台詞都有 `chunkId`。
- `role` 和 `speaker` 是合法值。

不合格的單元不會被載入，開發模式下會在 console 顯示警告。`tests/content.test.ts` 會檢查 `src/data/units/` 裡的每個單元。

## 咖啡廳的現況

- 6 個詞塊、6 個單字、3 個任務、10 句劇情台詞。
- 單字像素圖：拿鐵、茶、瑪芬、水、蛋糕、三明治都有。

## 新增一個單元

1. 在 `src/data/units/` 新增 JSON 檔，照上面的格式寫。
2. 執行 `npx vitest run tests/content.test.ts`，確認內容檢查通過。
3. 為新單字在 `src/art/items.ts` 畫 24×24 像素圖（規格見 [visual-style.md](visual-style.md)）；`tests/items.test.ts` 會檢查每個單字都有圖。
4. 產生發音音檔，步驟見 [audio.md](audio.md) 的「產生音檔」。
5. 上線前請英文好的人看過句子，確認自然道地。

## 尚未做到

- 用 NGSL 高頻字表自動檢查用字。
- KK 音標：計畫用開源發音字典 CMUdict 轉換。像素字型缺大部分音標符號，見 [visual-style.md](visual-style.md) 的「字型」。
