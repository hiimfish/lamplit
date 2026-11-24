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

| 欄位                   | 說明                                                                                                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `chunks[].accept`      | 其他可接受的寫法，用於排句子等題型                                                                                                                          |
| `chunks[].note`        | 一行中文文法小抄（選填）                                                                                                                                    |
| `chunks[].distractors` | 似是而非的錯誤說法，各自標上錯誤類型，用來給具體回饋                                                                                                        |
| `words[].emoji`        | 備用圖。正式圖示是 `src/art/items/` 裡的像素圖，沒有像素圖時才顯示 emoji                                                                                    |
| `words[].abstract`     | 選填。抽象或不好畫的字（welcome、okay、數字、動詞）標 `true`，不畫像素圖，一律顯示 emoji。具體名詞不要標                                                    |
| `scene[].role`         | 誰的聲音：`guide`（你，以及詞塊、單字、對比詞的發音）和 NPC，第一到三幕共 34 個值，見下方「角色」                                                           |
| `scene[].speaker`      | `npc` 是角色說的，`player` 是學習者要說的                                                                                                                   |
| `scene[].chunkId`      | `player` 台詞一定要有，指向它練習的詞塊                                                                                                                     |
| `scene[].stage`        | 小劇場的道具動作（選填）：`want`／`give` 加單字 id，或 `ask`；見 [scene-stage.md](scene-stage.md)                                                           |
| `pairs[]`              | 最小對比詞（選填），給聽辨挑戰用：`id`、`focus`（例如「f／v」）、`note`（一行發音提示）、`a`／`b` 兩個字（各有 `id`、`en`、`zh`）                           |
| `tasks[].kind`         | 任務種類（選填）：不寫是一般任務；`roleplay` 是角色扮演大挑戰，只複習，不教新內容                                                                           |
| `tasks[].newPairIds`   | 這個任務新教的對比詞（選填）                                                                                                                                |
| `tasks[].spellWordIds` | 這個任務要考「打字拼字」的單字 id（選填）。必須是這個任務之前教過的字，可以來自更早的單元，例如便利商店 t7 考 key、box、door、tea、cake                     |
| `tasks[].cloze`        | 聽力填空的題目（選填），見下方「聽力填空、讀招牌、看圖選句」                                                                                                |
| `tasks[].signs`        | 讀招牌／價目的題目（選填），同上                                                                                                                            |
| `tasks[].pictures`     | 看圖選句的題目（選填），同上                                                                                                                                |
| `tasks[].fills`        | 句子填空的題目（選填），見下方「句子填空、讀短文、聽對話答題」；第二幕起使用                                                                                |
| `tasks[].passages`     | 讀短文的題目（選填），同上                                                                                                                                  |
| `tasks[].talks`        | 聽對話答題的題目（選填），同上；第三幕起也可以是聽獨白（`kind: "monologue"`）或加一張表格（`table`），見下方「第三幕的新題型」                              |
| `tasks[].textFills`    | 段落填空的題目（選填），見下方「第三幕的新題型」                                                                                                            |
| `tasks[].responds`     | 應答題的題目（選填），第四幕才能用，見下方「第四幕的新題型和限制」                                                                                          |
| `tasks[].backdrop`     | 這個任務的小劇場用哪張背景（選填）：小劇場 `backdrops` 裡的角色 key，或 `main`（一般的那張）；不寫就照第一個說話的 NPC，見 [scene-stage.md](scene-stage.md) |

任務數：第一、二幕每個單元 8 個任務，第三幕起 9 個（第四幕也是 9 個）；最後一個（只有最後一個）是角色扮演大挑戰（`kind: "roleplay"`）。幕別照 `src/content/acts.ts` 找單元 id，任務數寫在同一個檔案的 `TASKS_PER_UNIT`；不在任何一幕裡的單元（測試用的小單元）不限任務數。

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

### 角色

`role` 的合法值寫在 `src/content/types.ts` 的 `Role`，`validate.ts` 也有一份同樣的清單；下表和這份清單一樣長。中文名稱在 `src/content/roles.ts`（劇情泡泡和選回應題的提示會用到），聲線在 `src/audio/voices.ts`（見 [audio.md](audio.md)）。第一幕共 17 個值（`guide` 加 16 個 NPC，2026-11-22 新增 12 個）；第二幕（2026-11-23）又新增 7 個，第三幕（2026-11-23）再新增 10 個，所以到第三幕共 34 個：

| `role`           | 中文名稱 | 出現的地點                                                                              |
| ---------------- | -------- | --------------------------------------------------------------------------------------- |
| `guide`          | 你       | 每個地點（也念詞塊、單字、對比詞）                                                      |
| `landlord`       | 房東     | 搬家第一天、修車與維修                                                                  |
| `neighbor`       | 鄰居     | 搬家第一天、公園與社區、上班前一天                                                      |
| `barista`        | 店員     | 咖啡廳                                                                                  |
| `clerk`          | 店員     | 便利商店                                                                                |
| `passerby`       | 路人     | 街道與公車站                                                                            |
| `driver`         | 司機     | 街道與公車站                                                                            |
| `cashier`        | 收銀員   | 超市與市集                                                                              |
| `vendor`         | 攤販     | 超市與市集                                                                              |
| `assistant`      | 店員     | 服飾店                                                                                  |
| `receptionist`   | 櫃台     | 診所與藥局                                                                              |
| `doctor`         | 醫生     | 診所與藥局                                                                              |
| `pharmacist`     | 藥師     | 診所與藥局                                                                              |
| `server`         | 服務生   | 餐廳與聚會                                                                              |
| `friend`         | 朋友     | 餐廳與聚會、履歷                                                                        |
| `postal_clerk`   | 郵局人員 | 郵局                                                                                    |
| `volunteer`      | 志工     | 公園與社區、社區中心                                                                    |
| `teller`         | 銀行行員 | 銀行                                                                                    |
| `instructor`     | 課程老師 | 社區中心                                                                                |
| `librarian`      | 圖書館員 | 圖書館（英式口音）                                                                      |
| `mechanic`       | 修車師傅 | 修車與維修                                                                              |
| `counselor`      | 就業顧問 | 就業服務站、履歷                                                                        |
| `front_desk`     | 前台人員 | 面試                                                                                    |
| `manager`        | 主管     | 面試、上班前一天；第三幕的報到與人事、Email、會議、採購與廠商、客戶服務、飯店、公司活動 |
| `hr`             | 人資     | 報到與人事（Ms. Reed）                                                                  |
| `coworker`       | 同事     | 辦公室日常、電話與留言、Email、會議、機場、飯店、商展、公司活動（Dan）                  |
| `client`         | 客戶     | 電話與留言、商展（Mr. Hughes，英式口音）                                                |
| `supplier`       | 廠商業務 | 採購與廠商（Jack，澳洲口音）                                                            |
| `warehouse_lead` | 倉管     | 倉庫與出貨（Luis）                                                                      |
| `customer`       | 顧客     | 客戶服務（Mr. Grant）                                                                   |
| `airline_agent`  | 地勤人員 | 機場                                                                                    |
| `hotel_clerk`    | 飯店櫃台 | 飯店                                                                                    |
| `director`       | 總經理   | 公司活動（Mr. Ellis）                                                                   |
| `announcer`      | 廣播     | 電話與留言、倉庫與出貨、機場、商展（只有聲音，不畫在小劇場上）                          |

### 聽力填空、讀招牌、看圖選句

2026-11-22 新增的三個任務欄位，都是選填。型別是 `types.ts` 的 `ClozeItem`、`SignItem`、`PictureItem`。題目怎麼問、怎麼批改，見 [vocab-quiz.md](vocab-quiz.md)。

```json
{
  "cloze": [{ "lineId": "t6_2", "word": "nine", "distractors": ["five", "two"] }],
  "signs": [
    {
      "id": "price_list",
      "heading": "Today's Prices",
      "rows": [
        { "label": "Shirts", "value": "$15" },
        { "label": "Pants", "value": "$30" },
        { "label": "Coats", "value": "$50" }
      ],
      "question": { "en": "How much is a coat?", "zh": "一件大衣多少錢？" },
      "options": ["$15", "$30", "$50"],
      "answer": 2
    }
  ],
  "pictures": [
    {
      "id": "pic1",
      "pictureId": "reading_book",
      "options": [
        { "en": "She is eating a sandwich.", "zh": "她正在吃三明治。" },
        { "en": "She is reading a book.", "zh": "她正在看書。" }
      ],
      "answer": 1
    }
  ]
}
```

| 欄位                   | 說明                                                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `cloze[].lineId`       | 要挖空的台詞，必須是**這個任務**劇情裡的一句；播的是那句台詞自己的音檔                                                               |
| `cloze[].word`         | 要挖掉的字：一個字（字母，中間可以有撇號或連字號），而且台詞裡真的有這個字。同一句可以出兩題，但不能挖同一個字                       |
| `cloze[].distractors`  | 2 或 3 個錯的字，各不相同，也不能和答案一樣                                                                                          |
| `signs[].id`           | 招牌的 id，整個單元內不重複                                                                                                          |
| `signs[].heading`      | 招牌的標題（選填）                                                                                                                   |
| `signs[].rows`         | 招牌的每一行：`label` 一定要有；`value` 選填，會靠右顯示（價錢、時間）。標題加每一行合計最多 15 個字（用空白分開來數，`$15` 算一個） |
| `signs[].question`     | 一個問題，`en` 和 `zh` 都要有                                                                                                        |
| `signs[].options`      | 2 到 4 個答案，各不相同                                                                                                              |
| `signs[].answer`       | 正確答案是第幾個（從 0 算）                                                                                                          |
| `pictures[].id`        | 題目的 id，整個單元內不重複。正確句子的音檔 id 是 `<單元>.picture.<id>`                                                              |
| `pictures[].pictureId` | 用哪一張圖：`src/art/pictures/` 裡的圖片 id（例如 `reading_book`）                                                                   |
| `pictures[].options`   | 2 到 4 個句子，每個都有 `en` 和 `zh`，英文各不相同                                                                                   |
| `pictures[].answer`    | 正確句子是第幾個（從 0 算）                                                                                                          |

- 角色扮演大挑戰的任務不能有這三個欄位（大挑戰沒有練習題，寫了也不會出題）。
- 這些題目的英文只能用那個任務之前教過的字（包含這個任務教的），見下方「內容檢查」。
- 畫面上選項的順序每次打亂，所以 `answer` 寫的是 JSON 裡的位置。

### 句子填空、讀短文、聽對話答題

狀態：已做（2026-11-22 做出程式，2026-11-23 第二幕的 8 個地點用上）。第二幕要用的三個任務欄位，都是選填。型別是 `types.ts` 的 `FillItem`、`PassageItem`、`TalkItem`，題目共用 `ChoiceQuestion`。題目怎麼問、怎麼批改，見 [vocab-quiz.md](vocab-quiz.md) 的「句子填空、讀短文、聽對話答題（第二幕）」，那裡也列出每種題型各自的檔案。

```json
{
  "fills": [
    {
      "id": "fill1",
      "en": "I ___ a new job.",
      "zh": "我需要一份新工作。",
      "options": ["need", "needs", "needing"],
      "answer": 0,
      "note": "主詞是 I，動詞用原形。",
      "chunkId": "need_job"
    }
  ],
  "passages": [
    {
      "id": "fair",
      "kind": "notice",
      "title": "Job Fair",
      "lines": ["Come to the job fair on Monday.", "It starts at 10 a.m."],
      "questions": [
        {
          "en": "When does it start?",
          "zh": "幾點開始？",
          "options": ["9 a.m.", "10 a.m."],
          "answer": 1
        }
      ]
    }
  ],
  "talks": [
    {
      "id": "talk1",
      "lines": [
        { "id": "k1_1", "role": "clerk", "en": "Can I help you?", "zh": "需要幫忙嗎？" },
        { "id": "k1_2", "role": "friend", "en": "I want to open an account.", "zh": "我想開戶。" },
        { "id": "k1_3", "role": "clerk", "en": "Sure. Please sit down.", "zh": "好的，請坐。" }
      ],
      "questions": [
        {
          "en": "Where are they?",
          "zh": "他們在哪裡？",
          "options": ["At a bank", "At a park"],
          "answer": 0
        }
      ]
    }
  ]
}
```

| 欄位                   | 說明                                                                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fills[].id`           | 題目的 id，整個單元內不重複                                                                                                                                                |
| `fills[].en`           | 有一個空格的句子，空格寫成 `___`，剛好一個                                                                                                                                 |
| `fills[].zh`           | 整句的中文，答完才顯示（不管「顯示中文」開或關），不能含空格 `___`                                                                                                         |
| `fills[].options`      | 3 或 4 個字或短語，各不相同（不分大小寫）；每個最多 3 個字、18 個字元                                                                                                      |
| `fills[].answer`       | 正確答案是第幾個（從 0 算）                                                                                                                                                |
| `fills[].note`         | 一行中文說明為什麼（選填，最多 30 字），答完顯示                                                                                                                           |
| `fills[].chunkId`      | 句子是這個單元到這個任務為止教過的詞塊時填（選填）：答這題算那個詞塊的一次複習                                                                                             |
| `passages[].id`        | 短文的 id，整個單元內不重複                                                                                                                                                |
| `passages[].kind`      | `message`（簡訊）、`flyer`（傳單）、`notice`（公告）、`ad`（廣告）、`form`（表格）、`email` 其中一個，決定短文在畫面上的樣子                                               |
| `passages[].title`     | 標題或寄件人，例如 `Job Fair`、`Tony (repair shop)`；`message`（寄件人）和 `email`（主旨）一定要有，其他選填；有寫就不能是空的                                             |
| `passages[].lines`     | 內文，一行或一段一個，至少 2 行；標題加內文 15 到 80 個字（用空白分開來數）。`form` 的行寫成「項目: 內容」（冒號後有空格），畫面會排成兩欄；其他行就是一般的字             |
| `passages[].questions` | 1 到 3 個問題，每個有 `en`、`zh`、2 到 4 個不同的 `options` 和 `answer`；同一篇裡兩個問題的英文不能一樣                                                                    |
| `talks[].id`           | 對話的 id，整個單元內不重複                                                                                                                                                |
| `talks[].lines`        | 3 到 6 句，剛好兩個人說（中文名稱不能一樣），同一個人最多連說 2 句：每句有 `id`、`role`、`en`、`zh`，沒有別的欄位。音檔 id 是 `<單元>.talk.<id>`，句子 id 整個單元內不重複 |
| `talks[].questions`    | 1 到 3 個問題，格式和短文的一樣；兩個問題的英文不能一樣                                                                                                                    |

- 角色扮演大挑戰的任務也不能有這三個欄位。
- 一個任務最多 4 題句子填空、2 篇短文、1 段對話（每段對話要完整聽一遍，多了一輪會太長）。
- 英文（填空句子放進每個選項、短文的標題、內文、問題和選項、對話的台詞、問題和選項）只能用那個任務之前教過的字，和上面三種題型同一個檢查。
- 填空句子放進答案後最多 14 個字。空格不能貼在字上（前後要有空格或標點）；空格在句首時，所有選項都要大寫開頭（只有一個大寫會洩漏答案）。
- 填空有 `chunkId` 時，把答案放進去的句子必須剛好等於那個詞塊的 `en` 或 `accept` 其中一個（不分大小寫，忽略句尾標點和空白），否則不合格：有 `chunkId` 的題目要算那個詞塊的複習，所以句子不能和詞塊不一樣。
- 對話的角色不用出現在那個地點的小劇場上。
- 第三幕起（單元在 `acts.ts` 的第三幕或之後）：短文的標題加內文最多 160 個字；兩個人的對話最多 8 句。第一、二幕不變。

### 第三幕的新題型：文法填空、聽獨白、對話加圖表、段落填空

狀態：已做（2026-11-23）。資料格式、內容檢查、出題、用字檢查和四種畫面都做好了，第三幕的內容也用上了（見下方「第三幕：上班第一年」）。型別在 `types.ts`：`FillItem.grammar`、`TalkItem.kind`、`TalkItem.table`（`TalkTable`）、`TextFillItem`（`TextFillBlank`）。

- **文法填空**（多益第 5 大題）：一般的 `fills` 題目加 `"grammar": true`，選項是同一個字或同一個文法的不同形式（eat／eats／eating／ate）。**剛好 4 個選項**；其他規則和句子填空一樣。`grammar` 只能寫 `true` 或不寫。畫面的提示是「文法填空」。
- **聽獨白答題**（多益第 4 大題）：`talks` 的一段加 `"kind": "monologue"`。**只有一個人說話**（每句的 `role` 都一樣：語音留言、廣播、致詞），3 到 10 句，全部加起來 30 到 120 個字（用空白分開來數）；不限連說幾句，不能有 `table`。問題 1 到 3 個。音檔 id 一樣是 `<單元>.talk.<句子 id>`，用那個角色的聲線（`announcer` 有聲線，不用畫角色圖）。畫面的提示是「聽獨白」。
- **聽對話答題加圖表**（多益第 3 大題）：兩個人的對話加 `"table": { "title": "…", "rows": [[…], …] }`。`title` 選填，有寫就不能是空的；`rows` 2 到 5 列，第一列是表頭；每列 2 到 4 格，每列格數一樣；每格不能是空的，最多 3 個字。聽的時候和答題的時候都顯示在畫面上；表格不唸出來。只有兩個人的對話可以有。
- **段落填空**（多益第 6 大題）：新的任務欄位 `textFills`。一個任務最多 1 篇。

```json
{
  "textFills": [
    {
      "id": "t6_email",
      "kind": "email",
      "title": "From: Dan",
      "lines": ["Hi team,", "The meeting is ___ Monday.", "Please ___ your notes."],
      "zh": ["大家好，", "會議在星期一。", "請帶你的筆記。"],
      "blanks": [
        { "options": ["on", "in", "at", "by"], "answer": 0, "note": "星期幾前面用 on。" },
        { "options": ["bring", "brings", "brought", "bringing"], "answer": 0 }
      ]
    }
  ]
}
```

| 欄位                 | 說明                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------ |
| `textFills[].id`     | 題目的 id，整個單元內不重複                                                                |
| `textFills[].kind`   | 和短文的 `kind` 一樣（通常是 `email` 或 `notice`）                                         |
| `textFills[].title`  | 寄件人或標題（選填），有寫就不能是空的                                                     |
| `textFills[].lines`  | 內文，一行或一段一個，每行不是空的；空格照閱讀順序寫成 `___`（剛好三個底線，不能貼在字上） |
| `textFills[].zh`     | 每行一個，把答案放進去的中文，最後一個空格答完才顯示；數量和 `lines` 一樣，不能含 `___`    |
| `textFills[].blanks` | 2 到 4 個空格，照 `___` 的順序，數量要和全部 `lines` 裡的 `___` 一樣多                     |
| `blanks[].options`   | **剛好 4 個**，各不相同（不分大小寫），可以是字、短語或整句；頭尾沒有空白，沒有底線        |
| `blanks[].answer`    | 正確答案是第幾個（從 0 算）                                                                |
| `blanks[].note`      | 一行中文說明為什麼（選填，最多 30 字），答完顯示                                           |

- 每個空格出一題，同一篇的題目照空格順序連著出；問到後面的空格時，前面的空格已經填上正確答案。沒有複習卡片（`NO_ITEM`），沒有音檔。
- 標題加內文、每個空格放進正確答案後，最多 90 個字。
- 用字：標題、放進答案的內文、每個空格的每個選項，都只能用那個任務之前教過的字（`questionTexts`）；對話表格的標題和每一格、聽獨白的每句也一樣。
- 練習順序：段落填空接在句子填空後面、讀短文前面。快答門檻用比較長的那個（12 秒）。
- 角色扮演大挑戰的任務不能有 `textFills`。

### 第四幕的新題型和限制

狀態：**內容已做完**（2026-11-23，第四幕 12 個地點、108 個任務都寫好了，音檔也已產生）。資料格式、內容檢查、出題、音檔項目、用字檢查都做好了；五種畫面目前是能用的最小版本（能播、能選、對錯、繼續），之後會再做好。型別在 `types.ts`：`PictureItem.listen`、`PassageText`、`SinglePassage`、`PassageSet`（`PassageSetQuestion.needs`）、`RespondItem`（`RespondResponse`）、`TalkItem.once`。下面的新題型都只能用在第四幕的單元（照 `acts.ts`），用在別的幕會被擋下來；只播一次另有自己的位置規則。

- **看圖選句聲音選項**（多益第 1 大題）：`pictures` 的一題加 `"listen": true`。**剛好 4 個句子**（`options`，各有 `en`、`zh`），答題前只聽不看：畫面有圖和 A 到 D 四個鍵，每個可以重聽；答完才顯示英文和中文。4 句都有自己的音檔 `<單元>.pictureopt.<題目 id>_<0 到 3>`（照內容裡的順序），用 `announcer` 的聲線；這種題目沒有 `<單元>.picture.<id>` 的音檔。`listen` 只能寫 `true` 或不寫。圖片 id 照舊要在 `src/art/pictures` 裡（第四幕的三張：`presenter_chart`、`meeting_table`、`speaker_microphone`）。
- **兩篇／三篇一組閱讀**（多益第 7 大題）：`passages` 的一篇改寫成 `{ "id", "texts": [...], "questions": [...] }`。`texts` 是 2 或 3 篇文字，每篇有自己的 `kind`、`title`（選填，規則和單篇一樣：`message`、`email` 一定要有）、`lines`（至少 2 行，每篇至少 15 個字）。整組只有一份問題；問題可以加 `"needs": [0, 1]`，寫答案要看哪幾篇（從 0 算，不重複），兩篇以上就算「要看不只一篇」。
  - 兩篇一組：全部文字（含標題）180 到 260 個字，**剛好 4 題**，至少 1 題要兩篇一起看。
  - 三篇一組：全部文字 180 到 320 個字，**4 或 5 題**，至少 2 題要看不只一篇。
  - 一組算一篇（一個任務最多 2 篇）；id 和單篇共用，整個單元內不重複。組的欄位只能是 `id`、`texts`、`questions`，每篇只能是 `kind`、`title`、`lines`。單篇的問題不能有 `needs`。
- **應答題**（多益第 2 大題，只有聲音）：新的任務欄位 `responds`，一個任務 3 或 4 題。

```json
{
  "responds": [
    {
      "id": "t6_r1",
      "prompt": {
        "role": "agency",
        "en": "Should we try a blog too?",
        "zh": "我們也要試試部落格嗎？"
      },
      "responses": [
        { "en": "Sure, if it doesn't cost too much.", "zh": "好啊，如果不會太貴的話。" },
        { "en": "It's on the second floor.", "zh": "在二樓。" },
        { "en": "I wrote it last week.", "zh": "我上週寫的。" }
      ],
      "answer": 0
    }
  ]
}
```

| 欄位                   | 說明                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------- |
| `responds[].id`        | 題目的 id，整個單元內不重複                                                            |
| `responds[].prompt`    | 問話或說明：`role`（有聲線的角色，**不能是 `guide`**）、`en`、`zh`；同一個任務裡不重複 |
| `responds[].responses` | **剛好 3 個**回答，各有 `en`、`zh`，英文不重複；全部用「你」（`guide`）的聲線說        |
| `responds[].answer`    | 正確的回答是第幾個（從 0 算）；出題時 3 個回答會打亂順序，變成 A、B、C                 |

- 應答題答題前什麼字都不顯示：先播問話，再播 A、B、C 三個回答；答完才顯示問話和回答的英文、中文。音檔 id：問話 `<單元>.respond.<題目 id>`（用 `prompt.role` 的聲線），回答 `<單元>.response.<題目 id>_<0 到 2>`（照內容順序，用 `guide` 的聲線）。沒有複習卡片（`NO_ITEM`）。
- **三人對話**（多益第 3 大題）：第四幕的對話（不是獨白）可以有兩個或三個說話者，「你」（`guide`）可以是其中一個；三個人的中文名稱都不能一樣。不用另外標記。
- **只播一次**：`talks` 的一段加 `"once": true`：自動播一次，所有問題答完之前「再聽一次」和慢速都不能按；答完最後一題才能重聽。從健康與福利（`wellness`）t7 起，**每個第 5 和第 7 個任務的每段對話或獨白都一定要有**（健康與福利 t7、媒體採訪、年度大會、結業挑戰的 t5 和 t7）；其他地方都不能有。規則寫在 `checks/talks.ts` 的 `playOnceRequired`（照 `acts.ts` 的遊玩順序）。

第四幕的長度和數量限制（第一到三幕都不變）：

- 每個單元 9 個任務，t9 是角色扮演（和第三幕一樣）。
- 詞塊：每個 5 到 14 個字（用空白分開來數，it's 算一個字）。
- 每個教新東西的任務（t1 到 t8）：新單字 9 到 12 個；新項目（詞塊、單字、對比詞）合計最多 14 個。
- 單篇短文：標題加內文 150 到 300 個字，**剛好 3 題**。兩篇／三篇一組見上面。
- 對話：8 到 12 句，兩或三個說話者，**剛好 3 題**。獨白：3 到 12 句，30 到 160 個字，也是剛好 3 題。
- 用字：聲音選項的 4 個句子、應答題的問話和每個回答、一組閱讀的每一篇（標題和內文）都只能用那個任務之前教過的字（`questionTexts`），和其他題目一樣。
- 練習順序：應答題接在聽對話答題後面、排句子前面。快答門檻用比較長的那個（12 秒）。
- 角色扮演大挑戰的任務不能有 `responds`。

## id 規則

- 單元、詞塊、單字、對比詞（和它的兩個字）、台詞、任務、招牌、看圖選句題目、填空題、短文、對話（和對話的每一句）的 id 只能用小寫英文、數字和底線：`^[a-z0-9_]+$`。圖片的 `pictureId` 也是。
- 學習項目 id：`chunk:<詞塊 id>`、`word:<單字 id>`、`pair:<對比詞 id>`，用於存檔和複習。一組對比詞是一個學習項目。
- 學習項目 id 不含單元，所以**不同單元不能用同一個詞塊、單字或對比詞 id**，否則會共用複習卡片、查到別的單元。`tests/content.test.ts` 會檢查。
- 音檔 id：`<單元>.<類型>.<id>`，例如 `cafe.chunk.can_i_get`、`cafe.word.latte`、`cafe.line.t1_1`、`move_in.pair.fan`、`clinic.picture.pic1`（看圖選句的正確句子，2026-11-22 新增）、`bank.talk.k1_1`（聽對話答題的一句，用那句的角色聲線，2026-11-22 新增）；第四幕再加 `presentation.pictureopt.p1_0`（看圖選句聲音選項的一句）、`marketing.respond.t6_r1`（應答題的問話）、`marketing.response.t6_r1_0`（應答題的一個回答）。音檔腳本和播放程式都會拒絕不符合格式的 id。
- 聽力填空和讀招牌沒有自己的音檔：填空播的是那句台詞的音檔，招牌題沒有聲音。
- 讀招牌和看圖選句不是某一個詞塊或單字，所以沒有學習項目 id，也不會有複習卡片（程式裡的 `NO_ITEM`）。讀短文、聽對話答題也一樣；句子填空有 `chunkId` 時算那個詞塊，沒有時是 `NO_ITEM`。聽力填空挖的字如果是教過的單字，就用那個單字的 `word:<id>`。

## 內容檢查

`src/content/validate.ts` 的 `validateUnit` 會檢查：

- 所有 id 符合格式，而且不重複（台詞 id 在整個單元內不重複）。
- 任務引用的詞塊、單字和台詞的 `chunkId` 都存在。
- 每句 `player` 台詞都有 `chunkId`。
- `role` 和 `speaker` 是合法值。
- 對比詞：id 和兩個字的 id 符合格式、不重複；有 `focus`；兩個字都有 `en`、`zh` 而且不一樣；任務的 `newPairIds` 都存在。
- `stage` 的 `act` 合法；`want`／`give` 的 `item` 是同單元的單字，`ask` 不帶 `item`。
- `spellWordIds` 有寫的話，是不重複、格式正確的單字 id 清單，不能是空的。`tests/content.test.ts` 再檢查每個字都在這個任務之前教過（照遊玩順序，可以是更早的單元）。
- 任務數（2026-11-23）：第一、二幕的單元剛好 8 個任務、第三幕起 9 個，最後一個是角色扮演，其他任務都不是；不在任何一幕的單元不檢查。`validateUnit(unit, acts)` 的第二個參數預設是 `ACTS`，測試可以傳自己的幕。
- `backdrop` 有寫的話是合法角色或 `main`；`tests/stageArt.test.ts` 再檢查角色 key 真的在那個單元小劇場的 `backdrops` 裡。
- `kind` 只能是 `roleplay`。角色扮演任務：`newChunkIds`、`newWordIds` 是空的，沒有 `newPairIds`，也沒有 `cloze`、`signs`、`pictures`、`fills`、`passages`、`talks`、`responds`、`textFills`；第一句是 NPC 說的，每句 `player` 台詞前面都是 NPC 的台詞；至少 2 句 `player` 台詞；台詞用的詞塊都在同一個單元更早的任務教過。
- `cloze`（2026-11-22）：不能是空清單；`lineId` 是這個任務的台詞；`word` 是一個字，而且在那句台詞裡；同一句不能挖同一個字兩次；`distractors` 是 2 或 3 個不同的字，不能和答案一樣。
- `signs`（2026-11-22）：不能是空清單；id 符合格式，整個單元內不重複；`heading` 有寫就不能是空的；至少一行，每行有 `label`；全部加起來最多 15 個字；問題有 `en` 和 `zh`；2 到 4 個不同的答案；`answer` 指到其中一個。
- `pictures`（2026-11-22）：不能是空清單；id 和 `pictureId` 符合格式，id 在整個單元內不重複；2 到 4 個句子，都有 `en` 和 `zh`，英文不重複；`answer` 指到其中一個。
- `fills`、`passages`、`talks`（2026-11-22 做出，2026-11-23 第二幕用上）：檢查各在 `src/content/checks/fills.ts`、`passages.ts`、`talks.ts`，共用的小工具在 `common.ts`。三種題型的選擇題（短文和對話的問題）一律要有 `en`、`zh`、2 到 4 個各不相同的選項（不分大小寫）和指到其中一個的 `answer`。訊息都指出是哪個題目、要改什麼。
  - `fills`：不能是空清單；一個任務最多 4 題；id 符合格式、整個單元內不重複。`en` 剛好一個 `___`（三個底線，不能有別的底線），前後沒有多餘的空白、沒有連續兩個空白、標點前沒有空白，空格不能貼在字上。`zh` 一定要有，不能含空格。選項 3 或 4 個，每個最多 3 個字、18 個字元、頭尾沒有空白、沒有底線；空格在句首時每個選項都要大寫開頭（或數字開頭）。`answer` 指到其中一個。`note` 有寫就不能是空的、最多 30 字。`chunkId` 有寫的話，必須是這個單元在這個任務或更早教的詞塊。答案放進去的整句最多 14 個字。
  - `fills` 和詞塊的關係（`checkFillChunks`，在整個單元層級檢查，因為要看單元的詞塊）：有 `chunkId` 的題目，把答案放進去的句子必須等於那個詞塊的 `en` 或 `accept`（不分大小寫，忽略句尾標點和空白）。
  - `passages`：不能是空清單；一個任務最多 2 篇；`kind` 是 `message`、`flyer`、`notice`、`ad`、`form`、`email` 其中一個；`message` 和 `email` 一定要有 `title`，其他種類有寫就不能是空的；`lines` 至少 2 行，每行都不是空的；標題加內文 15 到 80 個字（第三幕起 160 個字）；每篇 1 到 3 個問題，同一篇裡不能有兩個一樣的問題。
  - `talks`：不能是空清單；一個任務最多 1 段；id 符合格式、整個單元內不重複，欄位只能是 `id`、`kind`、`lines`、`questions`、`table`；3 到 6 句（第三幕起 8 句；聽獨白的規則見上方「第三幕的新題型」），每句只有 `id`、`role`、`en`、`zh`，句子 id 符合格式、整個單元內不重複，`role` 是有聲線的合法角色，`en` 和 `zh` 都要有；剛好兩位說話者，他們的中文名稱不能一樣（例如兩個都顯示「店員」不行）；同一個人最多連說 2 句；1 到 3 個問題，同一段裡不能有兩個一樣的問題。`table` 和 `kind` 的檢查見上方「第三幕的新題型」。
  - 文法填空（`grammar`）也在 `fills.ts` 檢查；`textFills`（2026-11-23）在 `src/content/checks/textFills.ts`。限制依幕別的地方用 `TaskCheckContext.act`（`isLateAct`、第四幕用 `isAct4`）。
  - 第四幕（2026-11-23）：看圖選句（含聲音選項）的檢查搬到 `src/content/checks/pictures.ts`；應答題在 `checks/responds.ts`；一組閱讀在 `checks/passages.ts`；三人對話和只播一次在 `checks/talks.ts`（`TaskCheckContext` 多了 `unitId`、`taskIndex`、`acts`，給只播一次的位置規則用）；詞塊長度和每個任務的新單字數在 `validate.ts`。規則見上方「第四幕的新題型和限制」。

不合格的單元不會被載入，開發模式下會在 console 顯示警告。`tests/content.test.ts` 會檢查 `src/data/units/` 裡的每個單元。

`validateUnit` 以外，還有這些測試在擋內容：

- `tests/content.test.ts`：不同單元不重複用 id；打字拼字的字都在那個任務之前教過；每個單元最後一個任務是角色扮演，每句「你」的台詞出一題。
- `tests/smoothness.test.ts`：平滑規則 3、4、6（限制依單元所在的幕）；聽力填空、讀招牌、看圖選句、句子填空、讀短文、聽對話答題用的英文（挖掉的字、干擾選項、招牌、問題、答案、句子、短文、對話）都只用那個任務之前教過的字（`vocab.ts` 的 `questionTexts`）。
- `tests/pictures.test.ts`：每個 `pictureId` 都真的有圖。
- `tests/items.test.ts`：每個沒標 `abstract` 的單字都有像素圖。
- `tests/stageArt.test.ts`：每個單元裡有台詞的角色，都在那個單元的小劇場設定裡。
- `tests/stageState.test.ts`：兩個 NPC 不會站在同一點；站在 `beside` 位置說的台詞沒有 `want`、`ask`。
- `tests/audioItems.test.ts`：看圖選句只有正確的那一句會變成音檔項目，用「你」的聲線；聽對話答題每句一個音檔項目，用那句的角色聲線（用小的測試單元檢查）。
- `tests/fills.test.ts`、`tests/passages.test.ts`、`tests/talks.test.ts`：三種新題型的內容檢查和出題（用小的測試資料）；也測文法填空、聽獨白、對話加圖表和第三幕的長度。
- `tests/textFills.test.ts`：段落填空的檢查、出題、練習順序和快答門檻。
- `tests/content.test.ts` 的「tasks per act」：8／9 個任務的規則，和一個 9 個任務的測試單元（每個任務都能出題，9 個都做完才算完成）。
- `tests/stageArt.test.ts`：每個有 `backdrop` 的任務（`main` 除外），寫的 key 都在那個單元小劇場的 `backdrops` 裡。
- `tests/audioItems.test.ts`：`announcer` 說的聽獨白，每句一個音檔項目、id 合法、每個聲線家族都有 `announcer`。
- 第四幕（2026-11-23）：`tests/listenPicture.test.ts`（看圖選句聲音選項）、`tests/passages.test.ts`（第四幕的單篇長度和一組閱讀）、`tests/responds.test.ts`（應答題）、`tests/talks.test.ts`（三人對話、第四幕的長度、只播一次）各測內容檢查、出題、音檔項目和用字；`tests/content.test.ts` 的「Act 4 units」測 9 個任務、詞塊長度和每個任務的新單字數；`tests/smoothness.test.ts` 測第四幕的平滑規則能通過 syllabus 的新項目曲線；`tests/stageState.test.ts` 測第四幕每個小劇場的任兩到四個 NPC 都站在不同的位置。

## 結業考、詞庫與產生器的資料（2026-11-24）

結業考的題目一部分手寫、一部分由產生器出（規則見 [curriculum.md](curriculum.md)）。這一節說明手寫的檔案、產生器用的資料，以及怎麼檢查。

### 結業考的題目檔

- 路徑：`src/data/exams/<考試>.<段>.json`，例如 `exam3.s2.json`。只有段裡有手寫題目才有檔；全部由產生器出的段（例如 `exam1.s1`）沒有檔。
- 頂層欄位：`exam`、`section`，再加上有題目的種類陣列：`pictures`、`responds`、`talks`、`signs`、`fills`、`textFills`、`passages`（只寫用到的）。
- `draft: true` 表示還沒寫完：一般檢查會跳過，`EXAM_REQUIRE_COMPLETE=1` 時草稿和缺少的檔都會失敗。
- 每題有 `form`：`A` 或 `B`。第一次考用 A 卷，第二次考用 B 卷；**每一卷各自**要有 `EXAM_PLAN`（`src/content/exam.ts`）規定的題數。
- 題目 id 以段 id 開頭（例如 `s2_p1`），整個段內不重複。
- 選項：每題至少 3 個；第三、四幕剛好 4 個。答案位置：同一卷裡，任一個位置的答案不能超過 40%（答案不到 5 題時不檢查）。
- 同一場考試裡，句子和題幹（5 個字以上）不能重複出現（`examCopyKeys`）。
- 檢查：

```bash
EXAM_FILE=exam3.s2 npx vitest run tests/examContent.test.ts tests/validateExam.test.ts
EXAM_REQUIRE_COMPLETE=1 npx vitest run tests/examContent.test.ts
```

`EXAM_FILE` 只檢查一個檔（不加 `.json`）。

### 詞庫（`src/data/lexicon/<地點 id>.json`）

- 42 個地點各一個檔，都已填好（2026-11-24）：2,558 個條目，其中 880 個是 `skip`。
- 每個條目的 key 是單字 id。欄位（`src/content/lexicon.ts`）：
  - `pos`：詞性（n、v、adj、adv、prep、other）；`en`：寫出來的字，和 id 不同時才寫；`cls`：類別（person、role、place、room、food、drink、object、document、device、money、time、day、event、vehicle、clothing、body、quality、number）。
  - `forms`：變化形，`pl`（複數）、`s3`、`past`、`pp`、`ing`、`comp`（比較級）。
  - `countable`（名詞能不能數）；`pluralOnly`（只有複數的名詞，例如 clothes、pants、people）；`an`（用 an，例如 hour）。
  - `frames`（動詞）：誰做（`subj`）、做什麼（`obj`）、介系詞（`prep`，`fixed` 表示一定接這個介系詞）、`prepRequired`。動詞沒有 `frames` 就不會用在句子裡。
  - `skip`：不拿來造句（片語或怪字）。有 `skip` 的條目不能有其他欄位。
- 保留的 key `lines`：標好的故事台詞，`{ "<台詞 id>": { "side": "question" 或 "answer", "qtype"?, "atype"? } }`，給應答題用。
- 檢查（只看一個地點）：

```bash
LEXICON_FILE=<地點 id> LEXICON_STRICT=1 npx vitest run tests/lexiconContent.test.ts
```

`LEXICON_STRICT=1` 要求地點裡每個字都有條目或 `skip`，不能是空檔。`LEXICON_ALLOW_EMPTY=1` 允許還沒填的檔（內容剛好是 `{}` 的檔一律允許）。

### 句型（`src/data/patterns/act<N>.json`）

- 每個句型是一個「食譜」：`id`、`grammarId`（`src/content/grammar.ts` 的文法點）、`shape`（句型形狀：`svo`、`svo-prep`、`svo-time`、`be-adj`、`there-be`、`passive`、`wh-question`、`yes-no-question`、`comparative`）、`tense`、`cues`（提示字，例如 yesterday）、`blanks`（可以挖的空格種類）。
- 可選的清單：`verbs`、`subjects`、`objects`、`pobjects`、`adjectives`、`preps`、`pronoun`。有寫的話，引擎只從清單裡選，再和玩家學過的字取交集。
- 通過條件：每個句型至少能造出 6 句不同的句子。
- 審閱：`SENTENCE_SAMPLE=print npx vitest run tests/sentencePool.test.ts` 印出樣本，人看過後再改食譜。
- 目前 4 個檔都是空的（`[]`，2026-11-24）。

### 句子池（`src/data/sentences/act<N>.json`）

- 每句：`id`、`kind`（`statement` 陳述句，或 `qa` 問答）、`en`、`grammarId`。陳述句有 `blankWord`（聽力填空挖掉的字）；問答有 `responses`（正確和錯的回答放在同一個清單）和 `answer`（正確的是第幾個，從 0 算）。
- 草稿：`SENTENCE_POOL=write npx vitest run tests/sentencePool.test.ts` 寫出草稿（每幕 60 句陳述、15 句問答）。草稿要人看過，才是正式的句子池。
- 目前 4 個檔都是空的（`[]`，2026-11-24）。

### 驗證過的應答題題庫（`src/data/responds/act<N>.json`）

- 每題：`id`、`question`（`en`、`zh`（選填）、`qtype`、`role`）、`answer`（`en`、`zh`、`atype`）、`wrong`（至少 2 個錯的回答，各有 `en`、`zh`、`atype`）、`verified`。
- `verified` 是盲測的人數：**2 表示兩位盲測者都答對，而且每個錯的選項都答錯**。`atype` 不能是 `universal`；錯的選項類型必須和問題的題型不相容（`COMPATIBLE`）。
- 流程：`RESPOND_BANK=write npx vitest run tests/examPool.test.ts` 把候選寫到 `.tmp/respond-candidates/act<N>.json`（不是正式檔）；`EXAM_POOL=print` 印出候選和樣本段給人看；盲測通過的題目才寫進 `src/data/responds/act<N>.json`，並加上 `verified: 2`。
- 目前 4 個檔都是空的（`[]`，2026-11-24）。所以依賴這些資料的產生題還出不出來，資料不夠的那一段會顯示「準備中」。

### 不出成題的句子（`src/data/examExclude.json`）

- `{ "respond": [], "cloze": [] }`：列出句子 id，這些句子不會變成應答題（`respond`）或聽力填空題（`cloze`）。目前都是空的。

### 最小對比詞（2026-11-24 新增 14 組）

- 原本只有搬家第一天的 6 組；現在共 20 組。新增的 14 組分在 13 個地點：`airport`、`annual_meeting`、`community_center`、`company_event`、`day_before`、`factory`、`hotel`、`library`、`market`、`park`（2 組）、`store`、`warehouse`、`wellness`。
- 每組的格式見上方「單元格式」的 `pairs[]`，`focus` 寫出發音的對比（例如 f／v），兩個字各有 `id`、`en`、`zh`。對比詞也算新項目，第四幕的任務仍然最多 14 個。
- id 規則：同一單元內，對比詞 id 和兩個字的 id 不能重複（`validateUnit`）。跨單元：`pair:<id>` 和 `side:<字 id>` 在所有單元之間都不能重複（`tests/content.test.ts` 的「never reuses a chunk, word, pair or pair-side id in two units」）。音檔 id 是 `<單元>.pair.<字 id>`，所以字 id 只要在單元內不重複。
- 相關測試：`tests/pairs.test.ts`（內容檢查、音檔、聽辨題出題）。

## 現有單元

第一幕的十個地點都已做（2026-11-22）：80 個任務、140 個詞塊、301 個單字（148 個標 `abstract`，153 個有像素圖）、6 組對比詞、495 句劇情台詞。街道到公園這 7 個地點是 2026-11-22 新做的。

小鎮畫面依 `src/content/unitOrder.ts` 的 `UNIT_ORDER` 排列（用字分析腳本也照這個順序）：先是第一幕的十個地點：搬家第一天、咖啡廳、便利商店、街道與公車站、超市與市集、服飾店、診所與藥局、餐廳與聚會、郵局、公園與社區（`move_in`、`cafe`、`store`、`street`、`market`、`clothes`、`clinic`、`restaurant`、`post_office`、`park`）；接著是第二幕的八個地點：銀行、社區中心、圖書館、修車與維修、就業服務站、履歷、面試、上班前一天（`bank`、`community_center`、`library`、`repair`、`job_center`、`resume`、`interview`、`day_before`）。地點照這個順序一個一個打開：前一個地點的每個任務都玩過才打開下一個，前一幕每個任務都玩過才打開下一幕（2026-11-24，見 [ui-flow.md](ui-flow.md)）。因為後面的地點假設前面教過的字已經學過（平滑規則 3），不能跳著玩。

每個地點都是 14 個詞塊、8 個任務，第 8 個是角色扮演大挑戰（第二幕也是）。第一幕的新題型在哪些任務出現（第二幕見下方「第二幕」一節）：

| 題型         | 欄位           | 出現的任務                                                                  |
| ------------ | -------------- | --------------------------------------------------------------------------- |
| 打字拼字     | `spellWordIds` | 便利商店到公園每個地點的 t7，各 5 個字                                      |
| 聽力填空     | `cloze`        | 街道到公園每個地點的 t6，各 3 題                                            |
| 讀招牌／價目 | `signs`        | 服飾店 t5（3 題）；診所、餐廳、郵局、公園的 t4（各 2 題）                   |
| 看圖選句     | `pictures`     | 診所 t5（4 題，各 2 個句子）；餐廳、郵局、公園的 t5（各 2 題，各 3 個句子） |

### 搬家第一天（`move_in`）

- 14 個詞塊、22 個單字（11 個標 `abstract`：welcome、okay、neighbor、two～nine）、6 組對比詞、8 個任務、52 句劇情台詞。NPC 是房東 Mr. Bell（`landlord`，t1～t5、t8）和鄰居 Lena（`neighbor`，t6～t8）。
- 任務：見到房東（自我介紹）、名字怎麼拼（How do you spell that?）、垃圾怎麼丟（Can you speak more slowly, please?）、搬箱子、聊聊自己、認識鄰居、請鄰居進來坐，最後是角色扮演大挑戰（和房東重演第一天：自我介紹、從哪裡來、一個人住、請他幫忙搬箱子、聽不懂請他說慢一點；接著鄰居 Lena 來到門口，你自我介紹、請她進來。你說 8 句，t1～t7 每個任務至少複習一句）。
- 對比詞：fan/van、light/right、bed/bad、sink/think、ship/sheep、cap/cup，t1～t3 每個任務兩組；t4～t7 沒有對比詞。
- 單字像素圖：鑰匙、箱子、門、椅子、檯燈、垃圾桶、房間、家、汽車、手機、沙發。對比詞不用圖（聽辨題只靠聲音）。
- 小劇場：新家玄關，房東或鄰居（只畫這個任務有說話的角色；t8 兩個都有，鄰居站在門口）；18 句台詞有道具提示，見 [scene-stage.md](scene-stage.md)。
- 英文句子還沒請人審閱，發音還沒請使用者試聽。

### 咖啡廳（`cafe`）

- 14 個詞塊、21 個單字（4 個標 `abstract`：outside、inside、sit、read）、8 個任務、41 句劇情台詞。
- 任務：點一杯拿鐵、內用還是外帶、付錢、冰的不加糖、大杯小杯、外面有位子嗎、這裡有人坐嗎，最後是角色扮演大挑戰（從點冰咖啡到付錢拿飲料，中間聽不懂請店員再說一次，你說 6 句）。
- 單字像素圖：拿鐵、茶、瑪芬、水、蛋糕、三明治、冰咖啡、冰塊、糖、餅乾、小中大杯（三個杯子排一排，標出那一個）、桌子、窗戶、座位（高腳椅）、書。

### 便利商店（`store`）

- 14 個詞塊、25 個單字（10 個標 `abstract`：eat、hot、dollar、ten、twenty、fifty、today、tomorrow、morning、night）、8 個任務、50 句劇情台詞。沒有對比詞。NPC 是櫃檯後面的店員（`clerk`，中文名稱「店員」）。
- 任務：找東西（問牛奶在哪裡）、只買這個（不用袋子）、下雨了（買最後一把傘，第一次教冠詞 a／an／the）、幫我加熱（微波午餐、要叉子）、付錢（刷卡、要收據）、買兩個（第一次教單複數）、明天見（沒有別的了，掰掰；第一次出現打字拼字，考 key、box、door、tea、cake），最後是角色扮演大挑戰（從找牛奶、電池、雨傘，到加熱午餐、刷卡、不要袋子、道別。17 句台詞，你說 8 句，t1～t7 每個任務至少複習一句）。
- 單字像素圖（`src/art/items/store.ts`）：牛奶、蛋、麵包、錢、飲料、袋子、雨、雨傘、電池、午餐、叉子、零食、糖果、巧克力、報紙。
- 小劇場：傍晚的便利商店，店員在櫃檯後面；26 句台詞有道具提示，見 [scene-stage.md](scene-stage.md)。
- 用字報表：0 個違反平滑規則，分數依序 25、22、25、28、27、29、25；t2、t3、t6 各有一個沒教過的字（today、oh、really），其他任務學過的字都是 100%，t8 是 99%。

下面 7 個地點是 2026-11-22 做的。每個地點寫完後做過一輪編修；英文句子還沒請人審閱，台詞、發音、小劇場都還沒請使用者看過。小劇場的規格見 [scene-stage.md](scene-stage.md)。

### 街道與公車站（`street`）

- 14 個詞塊、31 個單字（16 個標 `abstract`：corner、left、driver、fare、downtown、stand、minute、hour、wait、front、Monday～Friday、walk）、8 個任務、49 句劇情台詞。NPC 是路人（`passerby`，t1～t3、t6～t8）和公車司機（`driver`，t4、t5、t8）。
- 任務：公車站在哪、往哪邊走、要準備零錢（第一次教 some／any）、這班車有到嗎、坐多久在哪下車、下一班車（第一次出現聽力填空，挖 nine、minutes、bus）、迷路了（打字拼字考便利商店的 milk、egg、bread、bag、fork），最後是角色扮演大挑戰（迷路問路、借零錢、等公車，公車來了再問司機有沒有到市中心、要坐多久。17 句台詞，你說 7 句，t1～t7 每個任務複習一句）。
- 單字像素圖（`src/art/items/street.ts`，15 個）：街道、公車、銀行、車站、地圖、車票、硬幣、學校、醫院、圖書館、博物館、招牌、馬路、計程車、橋。
- 小劇場：傍晚的公車站，你和路人或司機隔著候車亭的長椅；28 句台詞有道具提示。
- 用字報表：分數依序 27、27、30、29、30、29、32；t2、t5、t6 各有一個沒教過的字（turn、half、always），其他任務和 t8 學過的字都是 100%。

### 超市與市集（`market`）

- 14 個詞塊、32 個單字（14 個標 `abstract`：fresh、half、piece、pound、thirteen、thirty、fifteen、forty、hundred、buy、each、cheap、expensive、free）、8 個任務、48 句劇情台詞。NPC 是市集攤販（`vendor`，t2～t4、t6、t8）和超市收銀員（`cashier`，t1、t5、t7、t8）。
- 任務：蘋果在哪、市集試吃、一些米兩瓶水（第一次教可數與不可數）、肉攤秤重、排隊結帳（聽 thirteen 和 thirty 的差別）、怎麼賣一袋幾個（第一次教 How much／How many；聽力填空 3 題）、買一送一（打字拼字考街道的 bus、map、bank、coin、taxi），最後是角色扮演大挑戰（在攤子找蘋果、試吃、買米和蛋、問番茄價錢、請老闆多給一點，再到收銀台問買一送一、用自己的袋子。16 句台詞，你說 7 句，t1～t7 每個任務複習一句）。
- 單字像素圖（`src/art/items/market.ts`，18 個）：水果、蘋果、柳橙、香蕉、蔬菜、番茄、馬鈴薯、油、肉、鹽、米、魚、雞肉、價錢、起司、奶油、披薩、果汁。
- 小劇場：傍晚市集的蔬果攤，攤販或收銀員在攤子後面；25 句台詞有道具提示。
- 用字報表：分數依序 27、29、32、31、29、31、30；t1、t5 各有一個沒教過的字（bananas、oh），其他任務和 t8 都是 100%。

### 服飾店（`clothes`）

- 14 個詞塊、34 個單字（22 個標 `abstract`：顏色 color、black、white、red、blue、green，以及 wear、warm、size、long、short、fit、tight、loose、new、old、sale、percent、pair、return、wrong、exchange）、8 個任務、51 句劇情台詞。NPC 是店員（`assistant`）。
- 任務：隨便看看、有黑色的嗎、在找一件外套（第一次教現在進行式）、試穿、合不合身（第一次出現讀招牌／價目，3 題：價目表、店內指引、買二送一）、有打折嗎（聽力填空 3 題）、退換貨（打字拼字考超市的 apple、fish、rice、salt、meat），最後是角色扮演大挑戰（退圍巾、找保暖的外套、問有沒有黑色、試穿、合身就買。16 句台詞，你說 7 句，t1～t7 每個任務複習一句）。
- 單字像素圖（`src/art/items/clothes.ts`，12 個）：衣服、襯衫、洋裝、夾克、大衣、帽子、鞋子、鏡子、裙子、褲子、禮物、圍巾。
- 小劇場：傍晚的小服飾店，店員站在試衣間的簾子前；22 句台詞有道具提示。
- 用字報表：分數依序 27、30、33、30、31、29、28；t6、t7 各有一個沒教過的字（off、something），其他任務和 t8 都是 100%。

### 診所與藥局（`clinic`）

- 14 個詞塊、34 個單字（15 個標 `abstract`：doctor、nurse、insurance、back、hurt、flu、cold、throat、cough、fever、sleep、rest、body、sick、meal）、8 個任務、51 句劇情台詞。NPC 是櫃台人員（`receptionist`，只有 t1）、醫生 Dr. Lee（`doctor`，t2～t5、t8）和藥師（`pharmacist`，t6～t8）。
- 任務：掛號、哪裡不舒服、打流感疫苗（第一次教 want to）、看醫生（讀招牌 2 題：看診時間、流感疫苗價目）、醫生的交代（第一次出現看圖選句，4 張圖，每張 2 個句子）、到藥局（聽力填空 3 題）、藥怎麼吃（打字拼字考服飾店的 shirt、dress、coat、hat、shoe），最後是角色扮演大挑戰（跟醫生說症狀、問能不能上班、想打流感疫苗，再到藥局買咳嗽藥、問怎麼吃。17 句台詞，你說 8 句，t1～t7 每個任務至少複習一句）。
- 單字像素圖（`src/art/items/clinic.ts`，19 個）：表格、頭、眼睛、耳朵、手、手臂、腿、打針、鼻子、藥、藥丸、面紙、藥膏、藥局、口罩、食物、玻璃杯、晚餐、早餐。
- 小劇場：傍晚的社區診所，角落是藥櫃；27 句台詞有道具提示。
- 用字報表：分數依序 28、28、31、33、35、36、32（t6 的 36 是第一幕最高）；t3、t4 各有一個沒教過的字（put、let），其他任務和 t8 都是 100%。

### 餐廳與聚會（`restaurant`）

- 14 個詞塊、34 個單字（22 個標 `abstract`：people、friend、restaurant、waiter、sing、dance、cook、guest、week、weekend、evening、Saturday、Sunday、total、together、tax、tip、great、happy、fun、busy、delicious）、8 個任務、51 句劇情台詞。NPC 是服務生（`server`，t1、t2、t6、t8）和新朋友（`friend`，t3～t5、t7、t8）。
- 任務：兩位、點餐、聊興趣（第一次教 like + -ing）、朋友的派對（讀招牌 2 題：菜單價目、生日派對卡）、約時間地點（第一次教地點和時間介系詞；看圖選句 2 張圖，每張 3 個句子）、結帳（聽力填空 3 題）、週末過得如何（第一次教 be 動詞過去式；打字拼字考診所的 head、hand、nose、mask、pill），最後是角色扮演大挑戰（帶位、請服務生推薦、和朋友聊做菜、被邀請去生日派對、約星期五七點、結帳。16 句台詞，你說 7 句，t1～t7 每個任務複習一句）。
- 單字像素圖（`src/art/items/restaurant.ts`，12 個）：菜單、湯、沙拉、牛排、甜點、音樂、電影、派對、遊戲、葡萄酒、生日、帳單。
- 小劇場：傍晚的小餐廳，一張兩人桌，服務生站在酒櫃前，朋友站在桌子那一頭；24 句台詞有道具提示。
- 用字報表：分數依序 30、31、32、31、34、31、30；t1、t7 各有一個沒教過的字（full、sound），其他任務和 t8 都是 100%。

### 郵局（`post_office`）

- 14 個詞塊、34 個單字（16 個標 `abstract`：write、number、country、address、order、yesterday、online、open、close、carry、break、heavy、careful、fast、slow、weight）、8 個任務、50 句劇情台詞。NPC 是郵局人員（`postal_clerk`）。
- 任務：寄回台灣、地址寫哪裡、包裹沒收到（第一次教規則動詞過去式）、領包裹（讀招牌 2 題：營業時間、櫃台指引）、裡面是什麼（看圖選句 2 張圖）、多久會到（聽力填空 3 題）、買包裝用品（打字拼字考餐廳的 menu、soup、salad、wine、game），最後是角色扮演大挑戰（拿通知單領包裹、買箱子和膠帶、把書和禮物寄到台灣、寫地址、問價錢和多久會到。17 句台詞，你說 8 句，t1～t7 每個任務至少複習一句）。
- 單字像素圖（`src/art/items/postOffice.ts`，18 個）：郵件、信、包裹、郵票、城市、通知單、送貨、辦公室、辦公桌、櫃台、玩具、秤、公斤、膠帶、信封、明信片、貼紙、剪刀。
- 小劇場：傍晚的小鎮郵局，郵局人員在綠色櫃台後面；23 句台詞有道具提示。
- 用字報表：分數依序 31、29、30、30、31、33、33；t3 有一個沒教過的字（oh），其他任務和 t8 都是 100%。

### 公園與社區（`park`）

- 14 個詞塊、34 個單字（18 個標 `abstract`：class、event、center、afternoon、sky、wind、team、clean、garden、volunteer、play、hold、kid、run、sport、swim、family、email）、8 個任務、52 句劇情台詞。NPC 是鄰居（`neighbor`，t1、t5～t8；和搬家第一天同一個角色、聲線和角色圖，帶著狗 Coco）和社區志工 Ben（`volunteer`，t2～t4、t8）。
- 任務：公園散步、看活動公告、上次的活動（第一次教不規則動詞過去式）、當志工（讀招牌 2 題：志工招募、週末活動）、野餐（看圖選句 2 張圖）、一起運動（聽力填空 3 題）、保持聯絡（打字拼字考郵局的 mail、stamp、city、desk、tape），最後是角色扮演大挑戰（和鄰居聊天氣、請她喝東西，志工來了之後說看到海報、問怎麼幫忙、活動幾點開始、留電話。17 句台詞，你說 7 句，t1～t7 每個任務複習一句）。
- 單字像素圖（`src/art/items/park.ts`，16 個）：公園、樹、狗、花、海報、太陽、雲、草地、植物、球、野餐、湖、網球、照片、訊息、相機。
- 小劇場：黃昏的公園，你和鄰居或志工隔著一張長椅，後面是草地和池塘；24 句台詞有道具提示。
- 用字報表：分數依序 29、30、32、32、32、33、29；t2、t7 各有一個沒教過的字（community、month），其他任務和 t8 都是 100%。

## 第二幕：找工作

第二幕的八個地點都已做（2026-11-23）：64 個任務（56 個教新內容，8 個是角色扮演大挑戰）、112 個詞塊、342 個單字（301 個標 `abstract`，41 個有像素圖）、490 句劇情台詞。加上第一幕，整個遊戲現在是 18 個地點、144 個任務、252 個詞塊、643 個單字。每個地點都是 14 個詞塊、8 個任務，第 8 個是角色扮演大挑戰。分配表和做出來的差異見 [act2-syllabus.md](act2-syllabus.md)。

每個地點的台詞寫完後都做過一輪編修；沒有真人讀過，也沒有英文流利的人檢查過，所以句子是否自然道地還不確定。台詞、發音、小劇場和看圖選句的圖，使用者都還沒看過或聽過。

| 地點       | 單元 id            | 詞塊 | 單字 | 其中 `abstract` | 單字像素圖 | 劇情台詞 | 有道具提示的台詞 | NPC                                           |
| ---------- | ------------------ | ---- | ---- | --------------- | ---------- | -------- | ---------------- | --------------------------------------------- |
| 銀行       | `bank`             | 14   | 34   | 30              | 4          | 53       | 10               | 銀行行員（`teller`）                          |
| 社區中心   | `community_center` | 14   | 38   | 28              | 10         | 60       | 10               | 志工（`volunteer`）、課程老師（`instructor`） |
| 圖書館     | `library`          | 14   | 41   | 36              | 5          | 62       | 8                | 圖書館員（`librarian`，英式口音）             |
| 修車與維修 | `repair`           | 14   | 41   | 33              | 8          | 66       | 11               | 房東（`landlord`）、修車師傅（`mechanic`）    |
| 就業服務站 | `job_center`       | 14   | 44   | 42              | 2          | 62       | 9                | 就業顧問（`counselor`）                       |
| 履歷       | `resume`           | 14   | 48   | 43              | 5          | 60       | 9                | 就業顧問、朋友（`friend`）                    |
| 面試       | `interview`        | 14   | 48   | 48              | 0          | 65       | 13               | 前台人員（`front_desk`）、主管（`manager`）   |
| 上班前一天 | `day_before`       | 14   | 48   | 41              | 7          | 62       | 3                | 主管（電話裡）、鄰居（`neighbor`）            |

數字是 2026-11-23 用腳本從 `src/data/units/*.json` 數出來的。沒有對比詞（第二幕沒有聽辨挑戰）。單字像素圖在 `src/art/items/`，每個地點一個檔（面試沒有圖，因為單字全是抽象字）。

第二幕每個任務都有一個 NPC，大挑戰最多兩個：

- **銀行**：八月底去開戶，七個任務都是同一位行員。任務：走進銀行、證件和地址、填開戶申請表、提款卡和提款機、第一次存錢、問手續費、網路銀行和付房租，最後是大挑戰（17 句，你說 8 句）。
- **社區中心**：九月初，Ben（志工）介紹並報名電腦課，課程老師教課。任務：有哪些課、填報名表、什麼時候開課、看課程表、第一堂課、認識同學、在家練習，最後是大挑戰（19 句，你說 8 句；兩位 NPC 同台）。Ben 只在 t1、t7 和 t8 出現。
- **圖書館**：只有圖書館員一位 NPC，說英式口音的英文；玩家自己的詞塊仍是美式。任務：辦借書證、找書和借書、續借、看布告欄、用圖書館的電腦、列印和影印、安靜的規定，最後是大挑戰（19 句，你說 7 句）。
- **修車與維修**：前半（t1～t3）在自己家的廚房，水槽漏水，找房東 Mr. Bell；後半（t4～t7）把剛買的二手車開去修車廠，找師傅 Tony。任務：打電話報修、約時間來修、房東上門修水槽、把二手車開去修車廠、師傅說明估價、決定先修哪些、取車付款，最後是大挑戰（19 句，你說 8 句；房東和師傅同台）。這個地點的小劇場用兩張背景（見 [scene-stage.md](scene-stage.md)）。
- **就業服務站**：十月，顧問 Ms. Lopez。任務：登記求職、以前的工作、想要的條件、看求職廣告、比較兩份工作、決定應徵、下一步（準備申請），最後是大挑戰（19 句，你說 8 句）。應徵的是 Harbor Trading 的辦公室助理。
- **履歷**：隔天的履歷工作坊，同一位顧問，朋友 Mia 在 t6 來看草稿。任務：個人資料、寫學歷、在台灣的工作經歷、讀履歷範例、技能和語言、請 Mia 看草稿、加上推薦人並寄出，最後是大挑戰（18 句，你說 8 句；顧問和 Mia 同台）。
- **面試**：十一月初到 Harbor Trading。前台人員只在 t1 出現，主管 Ms. Carter 是 t2～t7 的面試官。任務：前台報到、見面寒暄、自我介紹、上一份工作、為什麼想來這裡、優點和缺點、輪到你發問，最後是大挑戰（18 句，你說 7 句；兩位同台）。
- **上班前一天**：十一月中。Ms. Carter 在電話裡通知錄取（t1～t4，用電話畫面當背景），鄰居來道賀（t5～t7）。任務：錄取通知、辦公室在哪裡、答應會準時、讀報到須知、鄰居來道賀、規劃上班路線、新生活的前一晚，最後是大挑戰（16 句，你說 7 句；主管和鄰居同台）。

第二幕的新題型出現在這些任務（數字是題數，用腳本從單元檔數出來）：

| 題型         | 欄位           | 出現的任務                                                                                                                                                   |
| ------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 句子填空     | `fills`        | 銀行 t5（3 題）；社區中心到上班前一天每個地點的 t2（各 2 題）；共 17 題                                                                                      |
| 讀短文       | `passages`     | 社區中心到上班前一天每個地點的 t4：傳單（1 題）、公告（1 題）、簡訊（2 題）、廣告 2 篇（各 1 題）、表格（2 題）、公告（2 題）、email（2 題）；共 8 篇、12 題 |
| 聽對話答題   | `talks`        | 修車與維修到上班前一天每個地點的 t5，各一段（5 或 6 句）：修車 1 題、就業服務站 1 題、履歷 2 題、面試 2 題、上班前一天 2 題；共 5 段、8 題、26 句            |
| 讀招牌／價目 | `signs`        | 銀行 t4（2 題：營業時間牌、提款機畫面）                                                                                                                      |
| 看圖選句     | `pictures`     | 社區中心 t5、圖書館 t5（各 2 題，4 張新的圖）                                                                                                                |
| 聽力填空     | `cloze`        | 每個地點的 t6，各 3 題；共 24 題                                                                                                                             |
| 打字拼字     | `spellWordIds` | 每個地點的 t7，各 5 個字；共 40 個字                                                                                                                         |

- 用字報表（`node scripts/vocab-report.mjs`）：第一、二幕共 18 個地點，違反平滑規則的有 0 個。第二幕 t1～t7 的難度分數是 29（銀行 t3）到 48（上班前一天 t6、t7）；各地點的範圍見 [curriculum.md](curriculum.md)。
- 劇情裡有沒教過的字的任務有 3 個，各 1 個字：圖書館 t4（company）、面試 t1（luck）、上班前一天 t7（alarm）；其他任務和 8 個 t8 學過的字都是 100%。
- 有 6 個字教了、但沒有出現在任何劇情或題目裡：社區中心的 `interest`、履歷的 `option`、面試的 `fail`、上班前一天的 `middle`、`direction`、`anyone`。只有介紹卡和單字題用到它們。

## 第三幕：上班第一年

第三幕的十二個地點都已做（2026-11-23）：108 個任務（96 個教新內容，12 個是角色扮演大挑戰）、168 個詞塊、832 個單字（739 個標 `abstract`，93 個有像素圖）、924 句劇情台詞（含大挑戰）。加上第一、二幕，整個遊戲現在是 30 個地點、252 個任務、420 個詞塊、1,475 個單字，都已排進 `UNIT_ORDER`。每個地點都是 14 個詞塊、9 個任務，第 9 個是角色扮演大挑戰。分配表見 [act3-syllabus.md](act3-syllabus.md)，做出來和表格不同的地方在第 5 節。

台詞由 12 位 AI 各寫一個地點，再由 2 位 AI 審稿編修；沒有真人讀過，也沒有英文流利的人檢查過，所以句子是否自然道地還不確定。台詞、發音、小劇場，使用者都還沒看過或聽過。第三幕的音檔已產生（2026-11-23）。

| 地點       | 單元 id            | 詞塊 | 單字 | 其中 `abstract` | 單字像素圖 | 劇情台詞 | 有道具提示的台詞 |
| ---------- | ------------------ | ---- | ---- | --------------- | ---------- | -------- | ---------------- |
| 報到與人事 | `onboarding`       | 14   | 57   | 52              | 5          | 78       | 6                |
| 辦公室日常 | `office`           | 14   | 60   | 45              | 15         | 78       | 8                |
| 電話與留言 | `phone`            | 14   | 65   | 62              | 3          | 77       | 2                |
| Email      | `email`            | 14   | 65   | 61              | 4          | 76       | 8                |
| 會議       | `meeting`          | 14   | 65   | 62              | 3          | 78       | 6                |
| 採購與廠商 | `purchasing`       | 14   | 68   | 62              | 6          | 79       | 5                |
| 倉庫與出貨 | `warehouse`        | 14   | 73   | 60              | 13         | 74       | 13               |
| 客戶服務   | `customer_service` | 14   | 73   | 71              | 2          | 70       | 2                |
| 機場       | `airport`          | 14   | 73   | 63              | 10         | 80       | 9                |
| 飯店       | `hotel`            | 14   | 75   | 62              | 13         | 77       | 5                |
| 商展       | `trade_fair`       | 14   | 79   | 71              | 8          | 77       | 4                |
| 公司活動   | `company_event`    | 14   | 79   | 68              | 11         | 80       | 8                |

數字是 2026-11-23 用腳本從 `src/data/units/*.json` 數出來的（台詞數包含大挑戰）。

第三幕的新題型出現在這些任務：

| 題型       | 欄位                       | 出現的任務                                                                                                                                                |
| ---------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 文法填空   | `fills` 加 `grammar: true` | 辦公室日常 t5（2 題）；電話與留言到公司活動每個地點的 t2（各 1 題）；共 12 題。另有一般的句子填空 14 題                                                   |
| 讀短文     | `passages`                 | 每個地點的 t4，各 1 篇；共 12 篇、30 題                                                                                                                   |
| 聽對話答題 | `talks`                    | 報到與人事 t5 和 t7、辦公室日常 t7、會議到公司活動的 t5（Email 的 t5 是段落填空，沒有對話）；共 11 段、27 題；倉庫與出貨 t5 加了一張出貨時間表（`table`） |
| 聽獨白答題 | `talks` 加 `kind`          | 電話與留言 t5 和 t7、Email 到公司活動的 t7；共 11 段、25 題                                                                                               |
| 段落填空   | `textFills`                | Email t5、會議到公司活動的 t6；共 9 篇、27 個空格                                                                                                         |
| 聽力填空   | `cloze`                    | 共 72 題                                                                                                                                                  |
| 打字拼字   | `spellWordIds`             | 共 60 個字                                                                                                                                                |

- `backdrop`（指定任務的小劇場背景）：機場 9 個任務（t1、t3 用 `main`，t4～t9 用 `coworker`）和飯店 t4（`manager`）。
- 用字報表（`node scripts/vocab-report.mjs`）：30 個地點，違反平滑規則的有 0 個。第三幕 t1～t8 的難度分數是 45（報到與人事 t1）到 63（商展 t7、t8，公司活動 t3）；公司活動 t8 是 60 分。各地點的範圍見 [curriculum.md](curriculum.md)。
- 劇情裡有沒教過的字的任務：報到與人事 t1（hr）、t3（kate）、t5（payday）；辦公室日常 t2（button）、t4（plastic）、t9（button）；Email t3（hide）；飯店 t1、t3、t4、t5、t6、t9 的 oh、hey、hmm。其他任務學過的字都是 100%。
- 教了、但沒有出現在任何劇情或題目裡的單字（16 個）：報到與人事的 `knowledge`、電話與留言的 `sir`、`temporarily`、會議的 `contribute`、`participate`、採購與廠商的 `method`、`overdue`、機場的 `mile`、`suddenly`、`onto`、飯店的 `electric`、`hourly`、商展的 `image`、公司活動的 `activity`、`throughout`、`praise`。只有介紹卡和單字題用到它們。

## 新增一個單元

1. 在 `src/data/units/` 新增 JSON 檔，照上面的格式寫，並把單元 id 加進 `src/content/unitOrder.ts` 的 `UNIT_ORDER`（沒列的單元會排在最後）。
2. 有新角色時：在 `src/content/types.ts` 的 `Role`、`src/content/validate.ts` 的 `ROLES`、`src/content/roles.ts`（中文名稱）、`src/audio/voices.ts`（兩個聲線家族各一個聲線）都加上。
3. 執行 `npx vitest run tests/content.test.ts tests/smoothness.test.ts`，確認內容檢查和平滑規則通過；`node scripts/vocab-report.mjs` 可以看每個任務的分數和用字。
4. 為新的具體名詞在 `src/art/items/<單元>.ts` 畫 24×24 像素圖，並登記到該檔的對照表（規格見 [visual-style.md](visual-style.md)）；`tests/items.test.ts` 會檢查每個沒標 `abstract` 的單字都有圖。
5. 有看圖選句時：在 `src/art/pictures/` 畫 96×64 的圖並登記圖片 id；`tests/pictures.test.ts` 會檢查。
6. 畫小劇場並加上舞台設定，步驟見 [scene-stage.md](scene-stage.md) 的「新增地點時要做的事」。
7. 產生發音音檔，步驟見 [audio.md](audio.md) 的「產生音檔」。
8. 上線前請英文好的人看過句子，確認自然道地。

## 尚未做到

- 用 NGSL 高頻字表自動檢查用字：部分做到。`node scripts/vocab-report.mjs` 會列出每個任務的用字和難度，平滑規則 3、4、6 由 `tests/smoothness.test.ts` 擋下（見 [curriculum.md](curriculum.md) 的「用字分析」）；「用字有沒有超出這一幕的頻率範圍」還沒檢查。
- KK 音標：計畫用開源發音字典 CMUdict 轉換。像素字型缺大部分音標符號，見 [visual-style.md](visual-style.md) 的「字型」。
- 第四幕的內容：2026-11-23 已做完（12 個地點、108 個任務），首頁不再顯示「即將開幕」。
- 2026-11-22 新做的 7 個地點：英文句子還沒請人審閱；台詞、發音、小劇場和看圖選句的圖都還沒請使用者看過。
- 第二幕的 8 個地點（2026-11-23）：英文句子沒有真人或英文流利的人看過；台詞、發音（包含新角色的聲線和圖書館員的英式口音）、小劇場和看圖選句的圖都還沒請使用者看過或聽過；也沒有人在真的手機上玩過。
- 第三幕的 12 個地點（2026-11-23）：英文句子沒有真人或英文流利的人看過，台詞只有 AI 寫和 AI 審稿；沒有人試玩過；音檔已產生（6,249 個）；台詞、發音（包含新角色的聲線和英式、澳洲口音）、小劇場都還沒請使用者看過或聽過。
- 聽力填空、讀招牌、看圖選句、打字拼字，以及第二、三幕的句子填空、讀短文、聽對話答題、聽獨白答題、段落填空，都只在任務練習出題，還沒進今日複習（見 [vocab-quiz.md](vocab-quiz.md)）。
- 有空白的單字（trash can）還不能考打字拼字。
- 看圖選句的聲音選項只在第四幕（`listen`，2026-11-23 做好）；第一到三幕的看圖選句選項還是只有文字。
- 聽力填空挖的字如果是不規則複數、過去式或 -ing，對不到教過的單字，那一題不會排複習（加 -s／-es 的複數對得到）。第一幕 21 題都對得到。
