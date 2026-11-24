# 第三幕「上班第一年」詞塊、單字、文法分配表

狀態：**內容已做完（2026-11-23）**：12 個地點的單元檔、劇情台詞和四種新題型的程式都做好了，30 個地點都排進遊玩順序；音檔也產生了（6,249 個，2026-11-23）；沒有人試玩過，台詞沒有真人讀過。使用者同意照這份開始做（2026-11-23），第 3 節的做法先照表裡寫的進行。像素圖已經照這份畫完（2026-11-23：9 個新角色、12 個場景、93 張單字圖，見 [scene-stage.md](scene-stage.md) 和 [visual-style.md](visual-style.md)）。做出來和這份表不同的地方，列在第 5 節。這份定每個任務教哪些詞塊、哪幾個單字、哪個文法、出哪種新題型。規則來自 [curriculum.md](curriculum.md)，格式和 [第二幕分配表](act2-syllabus.md) 一樣。排名用 `src/data/wordlists/` 的字表：N 是 NGSL、T 是 TSL、S 是補充字表（數字）。

怎麼排出來的：先算出第二幕結束時還沒教的字，把其中 2,595 個（NGSL 全部加 TSL 前 600 名）分類，1,332 個適合第三幕的字依主題分給 12 個地點，每個地點拿到的候選字都不重複；12 個地點各自排表；再由兩位沒看過草稿的審稿者看過全部（一位看詞塊自不自然，一位看選字、故事和順序），照意見改了一輪。每個地點都用檢查腳本確認過字數、沒有重複教、詞塊只用到當時學過的字。排表用的工具和中間檔在 `.tmp/act3/`（不在 git）。

這份表對過第二幕實際做出來的內容（`src/data/units/` 的 18 個單元檔）：第三幕沒有重複教第一、二幕教過的字，詞塊也沒有用到還沒教的字。

## 1. 總覽

### 總數

- 12 個地點 × 9 個任務 = 108 個任務。第 9 個任務是角色扮演大挑戰，只複習，所以有新內容的任務是 96 個。
- 新詞塊：**168 個**。每個地點 14 個：t4（閱讀）和 t7（聽力）各教 1 個，其他任務各教 2 個。
- 新單字：**832 個**。[curriculum.md](curriculum.md) 原本估 950 個，那是用 108 個任務算的；用 96 個任務、每個任務 6～10 個字算，就是 832 個。
- 第三幕結束時，玩家學過的字（原形）從 879 個增加到約 1,710 個。
- 要畫像素圖的單字：93 個，清單在第 6 節。其他是抽象字，或是圖會和已有的字太像，只顯示 emoji。

| 字表分級         | 單字數 |
| ---------------- | ------ |
| NGSL ≤ 500       | 91     |
| NGSL 501–1000    | 172    |
| NGSL 1001–2000   | 252    |
| NGSL 2001 以後   | 119    |
| TSL（前 600 名） | 190    |
| SUP（數字）      | 6      |
| 字表外           | 2      |

- 字表外的 2 個：voicemail（電話那一站整站都在講語音留言）、fragile（倉庫的貨是玻璃桌燈）。
- TSL 只用前 600 名；後 635 個留給第四幕。
- 分類時有 213 個字判定比較適合第四幕（簡報、預算、行銷、招募、合約這些主題），1,050 個判定不適合職場英文（學術、政治、醫療，或是和職場無關的日常字）。這兩批第三幕都沒有教。

### 新項目數的曲線（照遊玩順序）

新項目數 = 新詞塊 + 新單字。R = 大挑戰（0 個新項目）。第二幕最後一個地點（上班前一天）是 `8 9 9 9 9 9 9 R`。

```
19 報到與人事    8  9  9  9  9  9  9  9 R
20 辦公室日常    8  9  9  9  9 10 10 10 R
21 電話與留言    9 10 10 10 10 10 10 10 R
22 Email         9 10 10 10 10 10 10 10 R
23 會議          9 10 10 10 10 10 10 10 R
24 採購與廠商    9 10 10 10 10 11 11 11 R
25 倉庫與出貨   10 11 11 11 11 11 11 11 R
26 客戶服務     10 11 11 11 11 11 11 11 R
27 機場         10 11 11 11 11 11 11 11 R
28 飯店         10 11 11 11 11 12 11 12 R
29 商展         11 12 12 11 12 12 11 12 R
30 公司活動     11 12 12 11 12 12 11 12 R
```

- 相鄰任務最多 +1。每個新地點的 t1 比前一個地點少 1 個。
- 每個任務的新單字從 6 個慢慢加到 10 個，最多 10 個。最後三個地點的 t4、t7 只有 1 個詞塊，所以是 11 個新項目。
- 詞塊的平均長度：報到 7.5 個字，到商展和公司活動 9.3 個字（第二幕最後是 7.2 個字）。機場和飯店先降一點（8.1、8.3），因為櫃台對話本來就短。
- 難度分數還沒算：分數有兩項要等寫了劇情才知道（每句長度、劇情句數）。

### 故事和時間線

第二幕結束在上班前一天（十一月中）。第三幕從上班第一天的早上開始，到隔年十一月：

| 順序 | 地點（id）                     | 什麼時候           | 發生什麼事                                                                                                      |
| ---- | ------------------------------ | ------------------ | --------------------------------------------------------------------------------------------------------------- |
| 19   | 報到與人事（`onboarding`）     | 十一月中，週一     | 第一天。人資 Ms. Reed：識別證、表格、員工手冊、福利、認識環境；Ms. Carter 交代第一批小工作                      |
| 20   | 辦公室日常（`office`）         | 十一月底           | 隔壁座位的同事 Dan 帶著熟悉：文具、影印機、茶水間、午餐、歸檔、請人幫忙                                         |
| 21   | 電話與留言（`phone`）          | 十二月             | 接電話、轉接、留言、收訊不好、語音信箱、回電。來電的是英國客戶 Mr. Hughes                                       |
| 22   | Email（`email`）               | 一月               | 主旨、附件、回覆和轉寄、客氣地請人幫忙、寄錯檔案後更正、截止日、不在辦公室                                      |
| 23   | 會議（`meeting`）              | 二月               | 每週一的週會：約時間、訂會議室、議程、記錄、簡短報告進度、客氣地表達意見、待辦事項                              |
| 24   | 採購與廠商（`purchasing`）     | 三月               | 向新廠商 Brightway 的業務 Jack 詢價：報價、數量、折扣、交期、發票、付款                                         |
| 25   | 倉庫與出貨（`warehouse`）      | 四月               | 到公司倉庫幫忙（Luis 負責）：盤點、包裝、標籤、裝車、追蹤出貨、少一箱、安全規定                                 |
| 26   | 客戶服務（`customer_service`） | 五月               | 顧客 Mr. Grant 的訂單先是晚到、後來有破損：聽他說、道歉、查清楚、換貨或退款、追蹤                               |
| 27   | 機場（`airport`）              | 六月，週三         | 第一次出差，和 Dan 飛去芝加哥的商展：報到、行李、安檢、換登機門、延誤、登機                                     |
| 28   | 飯店（`hotel`）                | 同一趟             | 用訂位入住、房間有問題、網路和早餐、送洗、報帳用的收據、退房                                                    |
| 29   | 商展（`trade_fair`）           | 同一趟，週四到週六 | 顧攤位：招呼訪客、介紹產品、樣品和簡介、名片、和 Mr. Hughes 第一次見面、接訂單                                  |
| 30   | 公司活動（`company_event`）    | 十一月             | 一年後，公司二十週年派對：籌備（場地、餐點、邀請）、派對、總經理致詞、玩家得獎；Ms. Carter 暗示之後有更大的角色 |

貫穿整幕的設定（各地點表格下面的說明都照這些寫）：

- **公司賣什麼**：Harbor Trading 賣家用和辦公室的燈具與桌上用品給店家，主力是桌燈。Brightway 是基本款玻璃桌燈的新廠商；新系列是台灣設計製造。
- **Mr. Hughes**：James Hughes，英國的 Hughes Home and Garden。十二月下訂單並改過交期（電話），一月問價目表和交貨（Email），四月貨走海運（倉庫），六月到商展見面並下新訂單。
- **出差**：商展在芝加哥，國內線。週三飛，訂三晚；Ms. Carter 留言說 Mr. Hughes 想在週六展覽結束後請兩人吃飯，所以多住一晚，週日回家。
- **辦公室六個人**：總經理 Mr. Ellis、主管 Ms. Carter、人資 Ms. Reed、同事 Dan、前台 Kate、玩家。倉庫另外有 Luis 和他的組員。

第四幕從升遷之後開始。

### 角色

| 角色 id          | 是誰                          | 出現在                                                            | 新的還是沿用                 |
| ---------------- | ----------------------------- | ----------------------------------------------------------------- | ---------------------------- |
| `manager`        | 主管 Ms. Carter               | 報到、Email、會議、採購、客戶服務、公司活動；飯店只有她的語音留言 | 沿用第二幕                   |
| `front_desk`     | 前台 Kate                     | 只在台詞裡提到                                                    | 沿用第二幕（這一幕才有名字） |
| `hr`             | 人資 Ms. Reed                 | 報到                                                              | 新                           |
| `coworker`       | 同事 Dan                      | 辦公室、電話、Email、會議、機場、飯店、商展、公司活動             | 新                           |
| `client`         | 客戶 Mr. Hughes，**英國口音** | 電話（在電話裡）、商展（本人）                                    | 新                           |
| `supplier`       | 廠商業務 Jack，**澳洲口音**   | 採購                                                              | 新（遊戲第一個澳洲口音）     |
| `warehouse_lead` | 倉管 Luis                     | 倉庫                                                              | 新                           |
| `customer`       | 顧客 Mr. Grant                | 客戶服務                                                          | 新                           |
| `airline_agent`  | 航空公司地勤                  | 機場                                                              | 新                           |
| `hotel_clerk`    | 飯店櫃台                      | 飯店                                                              | 新                           |
| `director`       | 總經理 Mr. Ellis              | 公司活動（致詞）                                                  | 新                           |
| `announcer`      | 只有聲音：廣播、語音信箱系統  | 電話、倉庫、機場、商展                                            | 新（不用畫角色圖）           |

新角色 10 個，其中 9 個要畫角色圖。每個對話任務只有一個 NPC；一個地點的對話最多用兩個角色。

### 文法第一次出現

每個地點兩個文法點，放在 t3 和 t6。

| 地點          | t3                                              | t6                                                        |
| ------------- | ----------------------------------------------- | --------------------------------------------------------- |
| 19 報到與人事 | 被動式（現在）：Is lunch provided…?             | 數量詞：a few、plenty of                                  |
| 20 辦公室日常 | 關係子句 who：someone who can fix my monitor    | 動詞＋人＋to：Do you want me to…? / asked me to…          |
| 21 電話與留言 | might / may：She might be in a meeting.         | 時間子句 as soon as：I'll tell her as soon as she's back. |
| 22 Email      | 被動式（過去）：the wrong file was attached     | 詞性：形容詞和副詞（quick / carefully）                   |
| 23 會議       | 第一條件句：If we start on time, we'll finish…  | 關係子句 that：the one that's easier to use               |
| 24 採購與廠商 | 商務介系詞 by / within / until                  | 詞性：名詞和動詞（confirm、delivery）                     |
| 25 倉庫與出貨 | 被動式的問句和 by：Were these boxes packed by…? | 數量詞：most of、none of                                  |
| 26 客戶服務   | 條件句 unless / if not                          | may / might 的客氣說法：You may want to…                  |
| 27 機場       | 過去進行式：I was looking for my boarding pass. | 時間子句 before / until                                   |
| 28 飯店       | 關係子句省略 that：the room I booked            | while＋過去進行式：while I was using it                   |
| 29 商展       | 詞性：名詞和形容詞（difference、quality）       | 期間的介系詞 during / over                                |
| 30 公司活動   | 混合複習：被動式＋關係子句                      | 混合複習：條件句＋時間子句                                |

- [curriculum.md](curriculum.md) 列的第三幕文法都排進去了。另外加了兩個規格沒列的：過去進行式（機場、飯店）和「動詞＋人＋to」（辦公室）。
- 第四幕的文法都沒有提早用：第二條件句、助動詞加被動（will be shipped）、間接引述、間接問句（Do you know where…）、使役動詞、although / despite / however。審稿者逐句查過，沒有發現。

### 新題型和新旋鈕第一次出現

一次只出一種，第一次出現時只用學過的內容。四種題型的程式都做好了（2026-11-23），見 [vocab-quiz.md](vocab-quiz.md)。

| 新東西                        | 地點與任務   | 說明                                                 |
| ----------------------------- | ------------ | ---------------------------------------------------- |
| 文法填空（多益第 5 大題）     | 20 辦公室 t5 | 選正確的形式（時態、詞性）。第一次只用第一、二幕的字 |
| 聽獨白答題（多益第 4 大題）   | 21 電話 t5   | 只有一個人說話（語音留言），1 題。第一次只用學過的字 |
| 段落填空（多益第 6 大題）     | 22 Email t5  | 一封短信有 3 個空格。第一次只用學過的字              |
| 澳洲口音                      | 24 採購 t1   | 廠商 Jack 的聲音；t1 的內容和平常的 t1 一樣簡單      |
| 聽對話答題加圖表（第 3 大題） | 25 倉庫 t5   | 一段對話加一張小表格（出貨時間表）。只用學過的字     |

之後每個地點固定再出現：

| 任務 | 題型                                                                                           |
| ---- | ---------------------------------------------------------------------------------------------- |
| t2   | 句子填空（辦公室 t5 之後混入文法填空）                                                         |
| t4   | 閱讀一封 Email 或一則公告：報到和辦公室 60～80 字，電話到採購 80～110 字，倉庫之後 110～150 字 |
| t5   | 聽對話答題（2 題；客戶服務開始 3 題），除非上表那一格                                          |
| t6   | 聽力填空；會議開始加段落填空                                                                   |
| t7   | 報到和辦公室是聽對話答題；電話開始是聽獨白答題（留言、廣播、會議開場、致詞）                   |
| t8   | 打字拼字（考上一個地點教過的字）和聽力填空                                                     |

## 2. 各地點分配

地點編號接著第二幕（第二幕是 11～18）。每個地點表格下面的幾行是給之後寫劇情的人看的：題型怎麼排、t4 讀什麼、t5 和 t7 聽什麼，以及還要請人確認的地方。

### 19 報到與人事（`onboarding`）

- NPC：`hr` 人資 Ms. Reed（新角色，t1～t5：報到、識別證、表格、帶看辦公室、員工手冊、福利）、`manager` 辦公室主管 Ms. Carter（第二幕面試和打電話的同一位，聲線和角色圖沿用；t6～t8：交代第一批小工作、介紹公司和同事、下班前聊幾句）
- 場景：十一月中的星期一，到 Harbor Trading 上班的第一天。早上跟人資 Ms. Reed 報到：領識別證、填報稅、薪資入帳和緊急聯絡人的表格、參觀辦公室、讀員工手冊第一頁、問特休和發薪日；下午 Ms. Carter 交代第一批小工作、介紹公司賣什麼和同事是誰，下班前聊今天過得怎麼樣。辦公室六個人：Mr. Ellis、Ms. Carter、Ms. Reed、Dan、櫃台的 Kate 和玩家。

| 任務 | 標題           | 新詞塊（英文／中文）                                                                                                                              | 新單字（英文／中文／排名）                                                                                                                                                                                                                                          | 文法                                              | 新題型 | 新項目數    |
| ---- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------ | ----------- |
| t1   | 第一天報到     | Good morning, I'm the new office assistant.／早安，我是新來的辦公室助理。<br>Does this badge open the front door?／這張識別證可以開大門嗎？       | human／人的；人力的／N428<br>staff／員工（全體）／N431<br>access／進出的權限／N802<br>resource／資源（human resources 人資）／N904<br>orientation／新人訓練（到職說明）／T356<br>badge／識別證／T457                                                                | —                                                 | —      | 8           |
| t2   | 填報到表格     | Who should I put as my supervisor?／主管這一欄我要填誰？<br>When do you need these forms back?／這些表格什麼時候要交回來？                        | supervisor／直屬主管／T13<br>contact／聯絡人；聯絡／N600<br>official／正式的／N643<br>daughter／女兒／N927<br>identification／身分證明／T74<br>emergency／緊急狀況／N1891<br>payroll／薪資作業；發薪名單／T581                                                      | —                                                 | —      | 9           |
| t3   | 參觀辦公室     | Is lunch provided, or should I bring my own?／公司有供應午餐嗎？還是要自己帶？<br>Are we allowed to eat at our desks?／我們可以在座位上吃東西嗎？ | provide／提供／N205<br>department／部門／N736<br>facility／設施／N953<br>tour／參觀；導覽／N1089<br>receptionist／櫃台接待人員／T72<br>locate／位於（be located）／N1450<br>entrance／入口／N2225                                                                   | 被動式（現在）：is provided, are kept, is located | —      | 9           |
| t4   | 讀員工手冊     | So I should call Ms. Carter before nine, right?／所以我要在九點前打給 Ms. Carter，對嗎？                                                          | policy／規定；政策／N399<br>organization／組織；機構／N512<br>identify／辨識；確認身分／N805<br>professional／專業的／N936<br>workplace／工作場所；職場／T147<br>confidential／保密的；機密的／T381<br>absent／沒來上班；缺席／T562<br>handbook／（員工）手冊／T986 | —                                                 | —      | 9           |
| t5   | 特休和發薪日   | How many vacation days do I get?／我有幾天特休？<br>Are we paid every two weeks?／我們是每兩個禮拜發一次薪水嗎？                                  | vacation／休假；假期／T2<br>health／健康／N475<br>worker／工作人員；員工／N673<br>earn／賺得；累積（假）／N926<br>eligible／符合資格的／T150<br>paycheck／（每次發的）薪水／T320<br>enroll／加保；報名加入／T353                                                    | —                                                 | —      | 9           |
| t6   | 第一批小工作   | I just need a few more minutes.／我再幾分鐘就好。<br>Sure, I have plenty of time this afternoon.／沒問題，我今天下午時間很充裕。                  | role／職務；角色／N468<br>knowledge／知識；了解／N619<br>responsibility／職責；責任／N962<br>assignment／交辦的工作；任務／T100<br>familiar／熟悉的／N1445<br>plenty／很多；充足（plenty of）／N1542<br>routine／例行工作；固定流程／N2104                          | 數量詞：a few, a little, several, plenty of       | —      | 9           |
| t7   | 認識公司和同事 | I'm excited to be part of the team.／很高興能加入這個團隊。                                                                                       | product／產品／N304<br>sell／賣；銷售／N418<br>culture／（公司）文化／N568<br>director／總經理（公司負責人）／N727<br>ability／能力／N779<br>introduction／介紹／N1203<br>senior／資深的／N1207<br>overview／概況；簡介／T396                                       | —                                                 | —      | 9           |
| t8   | 第一天下班前   | I'll finish the rest first thing tomorrow.／剩下的我明天一早就做完。<br>I think I'm going to like it here.／我覺得我會喜歡這裡。                  | smile／微笑／N990<br>procedure／流程；程序／N1168<br>permanent／正式的；長期的／N1782<br>temporary／暫時的；臨時的／N1820<br>paperwork／要填的文件；文書作業／T222<br>submit／繳交；送出／N2070<br>flexible／有彈性的／N2720                                        | —                                                 | —      | 9           |
| t9   | 角色扮演大挑戰 | —                                                                                                                                                 | —                                                                                                                                                                                                                                                                   | —                                                 | —      | 0（只複習） |

小計：14 個詞塊、57 個單字。

- 之後再出現的題型：t2 句子填空、t4 讀員工手冊第一頁（2 題）、t5 聽對話答題（2 題）、t6 聽力填空、t7 聽對話答題（2 題）、t8 打字拼字（上班前一天的單字）和聽力填空。
- 閱讀素材（t4）：Ms. Reed 給的員工手冊第一頁「Your First Week」，約 65 字，條列式：「Welcome to Harbor Trading! We are a small organization, and we want a friendly, professional workplace.／Badge: Wear your badge every day. It identifies you as staff.／Sick days: Call your supervisor before 9:00 on any day you are absent.／Your information: All your forms are kept in the HR office. They are confidential.／Questions about a policy? Ask Ms. Reed.」只用到 t4 為止教過的字。2 題：生病不能來要怎麼做（九點前打給主管）、對規定有問題要問誰。玩家讀完用詞塊跟 Ms. Reed 確認（手冊寫 supervisor，玩家說得出是 Ms. Carter，接 t2 的詞塊）。
- 聽對話答題（t5）：玩家問特休和薪水，Ms. Reed 說明，只帶三個數字：第一年有 10 天特休（「You earn them from your first month.」）；每隔一個星期五發薪（「Payday is every other Friday.」「Your first paycheck comes next week.」）；全職員工都符合資格保健康保險（「All full time workers are eligible for health insurance.」，full time 照第二幕寫成兩個字），但要在這個星期五以前自己上網加保（enroll）。2 題：第一年有幾天特休、這個星期五以前要做什麼。
- 聽對話答題（t7）：Ms. Carter 在玩家座位旁做公司的簡介，全幕只在這裡說一次公司賣什麼：「Here's a short overview.」「We sell desk lamps and other products for the home and office. We sell to stores.」「Mr. Ellis is our director. He started the company almost twenty years ago.」（不說 founded，也不說確切年數）；辦公室只有六個人；「Time for a few introductions.」Dan 最資深（「Dan is our senior sales person. He sits next to you. Ask him first.」）；公司的 culture 是有問題就問、互相幫忙；玩家會說中文的能力（ability）很重要，因為新的產品是在台灣做的。2 題：公司賣什麼、有問題先問誰。玩家聽完用詞塊回應。
- 請人確認：
  - 第二輪進來的字：resource（t1）、emergency、contact（t2）、product、sell（t7）。拿掉的字：found（改說 started）、belong（Dan 坐玩家旁邊，不是窗邊）、boss（和 supervisor、manager 太近）、capable（和 ability 太近）、pleasant。另外加的字仍是 handbook 和 health 兩個。
  - 為了放進新字而換任務的字：orientation t8 → t1、receptionist t1 → t3、director t3 → t7、smile t1 → t8、paperwork 和 submit t2 → t8。
  - 每個字的用法（台詞照這個寫）：
    - t1：「I'm Ms. Reed from Human Resources. HR for short.」「I'll do your orientation this morning.」「All staff wear a badge.」「This badge gives you access to the office.」拍識別證照片時不要說 Smile!（smile 到 t8 才教），說「Look at the camera, please.」。
    - t2：「This form is for payroll. I need your bank details.」「Write your official name, the one on your passport.」「I need two forms of identification.」「Who is your emergency contact?」「Most people put a family member. I put my daughter.」（不假設玩家的家庭）。交表格的期限說「By Friday is fine.」，不用 submit。
    - t3：「This is the front desk. Kate is our receptionist.」「This is the staff entrance.」「The shipping department is in the warehouse.」「Coffee and tea are provided, but lunch isn't.」「The meeting room is located next to the kitchen.」「Cups are kept in this cabinet.」「Yes, you're allowed to eat at your desk.」不要提 cafeteria（辦公室那一站才教，而且它是園區的，不是公司的）。
    - t6：「Let me explain your role.」「Your main responsibility is to help the team: filing, mail, orders. You'll start on the phones next month.」（電話十二月才開始接，Dan 會教）「Here's your first assignment.」「Are you familiar with Excel?」「Your knowledge of Chinese will help a lot.」「This will be part of your routine.」
    - t8：「You're still smiling. That's a good sign.」「Did you submit all your paperwork to Ms. Reed?」「That badge is temporary. Your permanent one will be ready on Friday.」「Tomorrow I'll show you the procedure for new orders.」「We're flexible about lunch.」不說職位是 temporary（第二幕徵才寫的是 full time），也不說上班時間有彈性（週一到週五 9 到 5）。
  - t5「我有幾天特休？」把 vacation days 譯成台灣辦公室的說法「特休」；vacation 單字的中文仍寫「休假；假期」，和第二幕的 holiday（年底假期）區分。
  - t8 的 the rest 是「剩下的」，第一幕教的 rest 是「休息」，同字不同義，由詞塊的中文帶出。
  - 文法順序：沒有用 Would you like me to…／Do you want me to…（辦公室 t6、電話 t6 才教）、沒有 if 條件句和 when 時間子句；被動式只出現在 t3 以後（t3 兩句、t5 的 Are we paid…），三句都是問句，直述句（are provided、is located、are kept）在 Ms. Reed 的台詞和手冊裡。t6 的數量詞出現在 a few more minutes 和 plenty of time，a little、several 留給台詞（「I have several small jobs for you.」「Do you need a little help?」）。
  - t3 兩個詞塊都在茶水間那一段（午餐、在座位吃東西），是同一個小場景；整體平均詞塊長度剛好 7.50，在範圍上限，之後如果加長任何一句要同時縮短另一句。
  - 圖示：5 個字要畫像素圖：badge、receptionist（畫櫃台和桌上的牌子，不要畫成一般人像，以免和第二幕的 assistant、counselor 撞）、daughter、vacation、health（愛心加十字）。其餘都是抽象字。
  - 沒用到的主題字：secretary、identity、headquarter、employment、intern、personnel、guideline、registration、uniform（和這家六個人的小公司對不上，或和已選的字意思太近）。

### 20 辦公室日常（`office`）

- NPC：`coworker` 同事 Dan（坐在玩家隔壁，進公司幾年了，人很好相處；t1～t8 的對話和 t7 的聽力都是他）。其他人只在台詞裡被提到：Ms. Carter、寫公告的 Ms. Reed、櫃台的 Kate（辦公用品和信件也歸她管）。辦公室就這六個人（加上總經理 Mr. Ellis 和玩家）；修電腦的技術人員是外面的廠商，每週來一次，不是公司的人。
- 場景：十一月下旬，上班頭幾週。玩家把座位整理好、找文具，第一次用影印機，問清楚哪件事要找誰，讀茶水間的公告，午餐時間和 Dan 閒聊、問大家都去哪裡吃（員工餐廳是園區的，不是公司自己的），幫 Dan 歸檔，系統登不進去請 Dan 幫忙，最後 Dan 把每個月訂辦公用品的工作交給玩家：第一件自己負責的小事。

| 任務 | 標題           | 新詞塊（英文／中文）                                                                                                                          | 新單字（英文／中文／排名）                                                                                                                                                                                                               | 文法                                                                       | 新題型              | 新項目數    |
| ---- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------- | ----------- |
| t1   | 整理新座位     | I'm still setting up my desk.／我還在整理座位。<br>Where do you keep the pens and folders?／筆和資料夾都放在哪裡？                            | set／擺好；設定（set up）／N185<br>top／最上面的／N375<br>space／空間；位子／N552<br>folder／資料夾／T122<br>drawer／抽屜／T155<br>pen／筆／N2320                                                                                        | —                                                                          | —                   | 8           |
| t2   | 第一次用影印機 | It's my first time using this machine.／我第一次用這台機器。<br>Can I watch you do it once?／我可以先看你做一次嗎？                           | power／電源／N331<br>fax／傳真／T9<br>function／功能／N702<br>machine／機器／N745<br>manual／使用手冊／T55<br>copier／影印機／T132<br>sheet／（一）張（紙）／N1616                                                                       | —                                                                          | —                   | 9           |
| t3   | 這件事要找誰   | Is there someone who can fix my monitor?／有沒有人可以幫我修螢幕？<br>Is she the woman who works at the front desk?／她是櫃台的那位小姐嗎？   | manage／管理；負責／N625<br>guy／（口語）男生；人／N701<br>technician／技術人員／T30<br>coworker／同事／T85<br>monitor／螢幕（顯示器）／N1377<br>cable／線；連接線／N2076<br>printer／印表機／N2664                                      | 關係子句 who（the person who handles…）                                    | —                   | 9           |
| t4   | 讀茶水間公告   | Which bin do paper cups go in?／紙杯要丟哪一個桶子？                                                                                          | memo／內部公告；備忘錄／T6<br>general／一般的；整體的／N404<br>perhaps／也許；或許／N413<br>throw／丟／N853<br>appliance／電器／T88<br>recycle／回收／T109<br>refrigerator／冰箱／T374<br>bin／（回收）桶／N2556                         | —                                                                          | —                   | 9           |
| t5   | 午餐時間       | So, how was your weekend?／對了，你週末過得怎麼樣？<br>Do you guys usually eat in the cafeteria?／你們平常都在員工餐廳吃嗎？                  | cafeteria／（園區的）員工餐廳／T43<br>mine／我的（東西）／N937<br>nobody／沒有人／N1103<br>somewhere／某個地方／N1320<br>plate／盤子／N1705<br>pot／壺（咖啡壺）／N2550<br>microwave／微波爐／T995                                       | —                                                                          | **文法填空 第一次** | 9           |
| t6   | 幫忙歸檔       | Do you want me to sort these by date?／要我把這些照日期排好嗎？<br>Ms. Carter asked me to scan all of these.／Ms. Carter 要我把這些全部掃描。 | sort／分類；整理／N316<br>record／紀錄／N344<br>project／專案／N518<br>section／區；部分／N668<br>remind／提醒／N1459<br>pile／一疊；一堆／N2518<br>scan／掃描／N2611<br>clip／夾子；迴紋針／T594                                        | 動詞＋人＋to：want / ask / tell / remind someone to（Do you want me to…?） | —                   | 10          |
| t7   | 系統登不進去   | I followed the steps, but nothing happened.／我照著步驟做了，可是沒反應。                                                                     | system／系統／N179<br>individual／個人的；各自的／N409<br>technology／科技／N563<br>enter／輸入／N717<br>software／軟體／N1091<br>user／使用者／N1115<br>outlet／插座／T357<br>login／登入帳號／T525<br>internet／網際網路（上網）／T577 | —                                                                          | —                   | 10          |
| t8   | 接手訂辦公用品 | Sure, I'd be happy to help with that.／好啊，我很樂意幫忙。<br>I'm not sure, but I'll find out.／我不確定，我去問清楚。                       | supply／用品（office supplies 辦公用品）／N814<br>pressure／壓力／N809<br>advice／建議／N1040<br>waste／浪費／N1246<br>essential／必要的；不可少的／N1290<br>normally／通常；平常／N1424<br>cartridge／墨水匣／T180<br>ink／墨水／T198   | —                                                                          | —                   | 10          |
| t9   | 角色扮演大挑戰 | —                                                                                                                                             | —                                                                                                                                                                                                                                        | —                                                                          | —                   | 0（只複習） |

小計：14 個詞塊、60 個單字。

- 之後再出現的題型：t2 句子填空、t4 讀茶水間公告（2 題）、t5 文法填空（第一次，取代這一站的聽對話答題）、t6 聽力填空、t7 聽對話答題（2 題）、t8 打字拼字（報到與人事的單字）和聽力填空。
- 閱讀素材（t4）：Ms. Reed 貼在茶水間的公告（memo），約 78 字，只用 t4 以前教過的字，也不用 before / after 子句（那是機場的文法）：「MEMO. To: All staff. From: Ms. Reed. General rules for the kitchen. The kitchen is a shared space. Please follow these rules: 1. The refrigerator is small. Put your name on your food. Perhaps you forgot something in there? We throw away old food every Friday afternoon. 2. Clean your cups and forks right away. 3. Turn off all appliances at the end of the day. 4. Please recycle. Bottles go in the blue bin. Paper goes in the green bin. Thank you!」2 題問「舊的食物什麼時候會被丟掉」（星期五下午）和「下班時要做什麼」（把電器都關掉）。公告沒寫紙杯丟哪裡，所以玩家讀完問 Dan：Which bin do paper cups go in?
- 文法填空（t5）：第一次出現的多益 Part 5 題型，句子和選項只用第一、二幕的字。情境接著午餐：2 題選出正確的動詞形式，例如「Dan usually ___ lunch at noon.」（eat / eats / eating / ate，答 eats）和「I ___ a sandwich from home yesterday.」（bring / brings / brought / bringing，答 brought）。題目考的是第一、二幕學過的現在式和過去式，不考這一站的新文法。
- 聽對話答題（t7）：玩家登不進訂單系統，Dan 過來幫忙：先看電源線有沒有插在插座（outlet）上、網路（internet）通不通，都沒問題；每個使用者（user）有自己的（individual）login，要輸入（enter）帳號和密碼；Dan 自己也試不出來，說「I'm not good with technology either.」，最後想起技術人員昨天換了新的軟體（software），大家都要換新密碼，他打電話請技術人員兩點過來。2 題問「問題出在哪裡」（換了新軟體，舊的 login 不能用）和「Dan 接下來要做什麼」（打電話給技術人員）。
- 請人確認：
  - 另外加了 1 個字：microwave（T995）。辦公室茶水間少不了微波爐，而發給這一站的只有 oven（烤箱），所以沒教 oven。
  - 第二輪依審閱意見換掉 2 個字：stationery 換成 supply（美國辦公室說 office supplies），tray 換成 manual（第一次用影印機，Dan 說手冊在抽屜裡）。perhaps 移到 t4 的公告裡，plate 移到 t5（紙盤在最上面的抽屜）。
  - 第二輪換了 3 句詞塊：t3 窗邊的同事改成櫃台的 Kate（Is she the woman who works at the front desk?，全公司只有六個人）；t5 加一句閒聊 So, how was your weekend?（取代 I brought my own lunch today.，報到那一站已經有 bring my own）；t8 加 I'm not sure, but I'll find out.（Dan 問墨水還夠不夠，取代 How many cartridges do we normally order?）。t8 的台詞可以讓 Dan 說 We normally order…，把 normally 和 cartridge 帶出來。
  - woman、watch、step 這 3 個必教字只放在詞塊裡（Is she the woman who…、Can I watch you…、I followed the steps…），沒有另外占單字的位子。
  - coworker 和第二幕教過的 colleague 意思一樣；因為美式口語多半說 coworker，Dan 的角色代號也是 coworker，所以還是教。
  - fax 現在辦公室比較少用，但它在多益字表排第 9，所以留在 t2（影印機有傳真功能）。
  - t5 的 cafeteria 是商業園區的員工餐廳（the cafeteria next door），台詞要交代清楚，公司自己沒有餐廳。
  - 圖示：15 個要畫的字。folder、fax 改成抽象（和 file 📁、print 🖨️ 的圖太像）；新增 recycle（♻️）、internet（🌐）、power（電源鍵符號，代號 ⚡）。printer、monitor、sheet、technician、pile、cafeteria、manual 維持抽象。畫的時候：bin 畫成藍色、有回收標誌的桶子（和 trash can 分開）；plate 畫成空盤的俯視圖（和 table 分開）；microwave 要有門和按鍵面板（和 screen 分開）；cable 畫成捲起來的線，outlet 畫成牆上的插座；refrigerator、copier 沒有專用的 emoji，用 ❄️、📑 代表，圖要畫成機器本身。

### 21 電話與留言（`phone`）

- NPC：`coworker` 同事 Dan（t1、t4、t5，在座位旁邊教玩家接電話）、`client` 客戶 Mr. Hughes（James Hughes，英國 Hughes Home and Garden 的老闆，人在英國，英國口音；t2、t3、t6、t8，全程只在電話裡出現）；獨白任務：t5 的語音留言是 Mr. Hughes 的聲音，t7 是 `announcer` 語音系統（Hughes Home and Garden 的總機錄音）。
- 場景：十二月。櫃檯的 Kate 不在位子上時，電話會響到每個人桌上，大家要自己接，玩家開始幫忙。Dan 先教怎麼接；英國客戶 Mr. Hughes 打來找 Ms. Carter，玩家幫忙轉接、說明她可能在開會；讀 Ms. Carter 寫的接電話須知；早上聽到 Mr. Hughes 一早（英國時間）留的語音留言，他想改十二月那筆訂單的交貨日；他再打來時幫他留言給 Ms. Carter；下午回電時英國已經下班，接起來的是對方公司的語音系統，玩家留了言；最後 Mr. Hughes 在下班通勤的火車上回電，訊號斷斷續續，還是把新的交貨日講定，他順口提到六月的商展他會到。

| 任務 | 標題           | 新詞塊（英文／中文）                                                                                                                                                                 | 新單字（英文／中文／排名）                                                                                                                                                                                                                                                                | 文法                                                               | 新題型                | 新項目數    |
| ---- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------- | ----------- |
| t1   | 電話響了       | Hello, thank you for calling Harbor Trading.／Harbor Trading 您好，感謝您的來電。<br>There's somebody on the phone for you.／有人打電話找你。                                        | man／男人；先生／N112<br>customer／顧客；客人／N487<br>ring／（電話）響／N945<br>conversation／對話；交談／N982<br>somebody／有人；某個人／N983<br>ourselves／我們自己／N1615<br>hello／喂；你好／N2803                                                                                   | —                                                                  | —                     | 9           |
| t2   | 幫客戶轉接     | One moment, please, I'll transfer you.／請稍等，我幫您轉接。<br>Would you like to hold or call back later?／您要在線上稍等，還是晚點再打來？                                         | reach／聯絡上；找到（人）／N380<br>o'clock／……點（整點）／T10<br>direct／直接的；直撥的／N724<br>hang／掛（電話）（hang up）／N1085<br>anybody／任何人；有人（問句、否定句）／N1431<br>dial／撥（號）／T153<br>bother／打擾；麻煩／N1844<br>extension／分機／N2186                        | —                                                                  | —                     | 10          |
| t3   | 她可能在開會   | May I ask who's calling, please?／請問您是哪一位？<br>She might be in a meeting right now.／她現在可能在開會。                                                                       | might／可能；也許／N159<br>client／（公司往來的）客戶／T3<br>afraid／恐怕（I'm afraid…）／N1353<br>personally／親自；本人／N1899<br>lately／最近；這陣子／T248<br>typically／通常；一般來說／N2006<br>sir／先生（對男士的尊稱）／N2138<br>anytime／隨時；任何時候／T456                   | might / may（She might be in a meeting. May I ask who's calling?） | —                     | 10          |
| t4   | 讀接電話須知   | Should I text her or call her cellphone?／我要傳訊息給她，還是打她的手機？                                                                                                           | caller／來電的人／T35<br>telephone／電話（機）／N1036<br>text／傳訊息；簡訊／N1048<br>cellphone／手機／T69<br>unknown／不認識的；不明的／N2043<br>urgent／緊急的／T296<br>accurately／正確地；準確地／T303<br>behalf／代替；代表（on behalf of）／T317<br>permission／同意；許可／N2414   | —                                                                  | —                     | 10          |
| t5   | 聽語音留言     | Sorry to interrupt, but Mr. Hughes left a voicemail.／不好意思打斷你一下，Mr. Hughes 留了語音留言。<br>He wants her to call him back sometime today.／他希望她今天找個時間回電給他。 | sometime／找個時間；某個時候／T12<br>voice／（說話的）聲音／N607<br>pause／暫停；停頓／N649<br>voicemail／語音留言；語音信箱／字表外<br>mobile／手機（英式說法）；行動的／N1738<br>rarely／很少；難得／N2149<br>interrupt／打斷／T370<br>summarize／講重點；摘要／N2729                   | —                                                                  | **聽獨白答題 第一次** | 10          |
| t6   | 幫忙留言       | Would you like me to take a message?／需要我幫您留言嗎？<br>I'll tell her as soon as she's back.／她一回來我就馬上轉告她。                                                           | repeat／重複；再說一次／N1253<br>definitely／一定；肯定／N1557<br>inquire／詢問／T173<br>whenever／什麼時候都可以；每當／N2127<br>briefly／簡短地／N2270<br>chat／聊一下；聊天／N2534<br>hesitate／猶豫（Don't hesitate to… 儘管…）／N2631<br>meantime／這段時間（in the meantime）／T468 | 時間子句 when / as soon as（I'll tell her as soon as she's back.） | —                     | 10          |
| t7   | 換我留言       | I'm calling from Harbor Trading about your December order.／這裡是 Harbor Trading，打來是要跟您說十二月那筆訂單的事。                                                                | press／按（按鍵）／N674<br>twice／兩次／N1308<br>shortly／很快；不久／T129<br>tone／（電話的）嗶聲；提示音／N1693<br>weekday／平日；工作日／T194<br>operator／總機；接線人員／N2329<br>directory／通訊錄；分機表／T342<br>successfully／成功地／N2433<br>inquiry／詢問；查詢／N2565       | —                                                                  | —                     | 10          |
| t8   | 訊號不好的回電 | Thanks for getting back to me so quickly.／謝謝您這麼快就回電給我。<br>Sorry, you're breaking up a little.／不好意思，您的聲音有點斷斷續續。                                         | connection／連線；通話品質／N1066<br>hardly／幾乎不／N1340<br>signal／訊號／N1502<br>concentrate／專心／N1541<br>commute／通勤／T220<br>loud／大聲的；吵的／N2249<br>silent／沒聲音的；靜音的／N2474<br>temporarily／暫時／T429                                                           | —                                                                  | —                     | 10          |
| t9   | 角色扮演大挑戰 | —                                                                                                                                                                                    | —                                                                                                                                                                                                                                                                                         | —                                                                  | —                     | 0（只複習） |

小計：14 個詞塊、65 個單字。

- 之後再出現的題型：t2 句子填空（混文法填空）、t4 讀接電話須知（2 題）、t5 聽獨白答題（第一次，1 題）、t6 聽力填空、t7 聽獨白答題（2 題）、t8 打字拼字（辦公室日常的單字）和聽力填空。
- 閱讀素材（t4）：Ms. Carter 寄給全辦公室的 email，主旨「Answering the telephone」，約 95 字，只用到 t4 為止教過的字。內容大意：When Kate is away from the front desk, the telephone rings at every desk, so please answer it before it rings three times. Say hello and the company name, and always ask for the caller's name. If the person is out, take a message on his or her behalf: write down the name, company and number accurately, and ask the reason for the call. Never give a colleague's cellphone number to an unknown caller without permission. If a call is urgent, let me know right away by text or by phone. 2 題：「不能給不認識的來電者什麼」（同事的手機號碼）、「遇到緊急電話要怎麼做」（馬上讓 Ms. Carter 知道）。須知沒寫哪一種比較好，所以玩家讀完問 Dan 詞塊那一句；Dan 回答先傳訊息，她開會時不接手機。
- 聽獨白答題（t5）：第一次出現（TOEIC Part 4），獨白只用 t4 為止教過的字。玩家早上進辦公室，聽到 Mr. Hughes 一早（英國已經是上午）留在公司電話裡的語音留言，約 45 字：Hello, this is James Hughes from Hughes Home and Garden, calling for Ms. Carter. It's about my December order. I need to change the delivery date, and it's quite urgent. Could she call me back today? I'm in the office until five o'clock. Thank you. 1 題問「來電的人希望 Ms. Carter 做什麼」（回電給他）。聽完後玩家去找 Dan（Ms. Carter 早上不在），用兩個詞塊轉述；Dan 的台詞帶出這個任務的單字：認得他的聲音（voice）、可以先暫停（pause）把號碼抄下來、請玩家講重點（summarize）、他很少留言（rarely）、英國人把手機叫 mobile。
- 聽獨白答題（t7）：玩家照 Ms. Carter 的交代下午回電，英國那邊已經下班，接起來的是 Hughes Home and Garden 的語音系統（`announcer`），約 70 字：Thank you for calling Hughes Home and Garden. Our office is now closed. We are open on weekdays from nine o'clock to five thirty. If you know the extension, dial it now. For the staff directory, press one. For inquiries about an order, press two. During office hours, press nine to speak to an operator. After the tone, please leave your message, and we will call you back shortly. 2 題：「辦公室什麼時候有人」（平日九點到五點半）、「想問訂單的事要按幾」（二）。嗶聲後玩家說出詞塊留言，接著的台詞可以示範 Please call me back when you get this message. 和 I'll say my number twice.，系統最後回 Message sent successfully.
- 請人確認：
  - 另外加的字只有 1 個：voicemail（兩份字表都沒有，排名寫「字表外」）。必教字全部教了，沒有略過。
  - 第二輪搬進來的字：customer（t1）、hang（t2）、client（t3）、press（t7）、connection（t8）。contact 改由報到那一站教，這裡直接當已學字用。依審閱意見拿掉 gradually、afterward、vital、eager 四個字。
  - customer 和 client 都是必教字、中文都叫客戶：t1 的 customer 是一般的顧客（Dan 說大部分電話是 customers 打來的），t3 的 client 專指 Mr. Hughes 這種長期往來的公司客戶，中文註解分開寫。reach（t2，找得到人）也是這樣和已學的 contact 分開。
  - cellphone（美式）和 mobile（英式）是故意一起教的：Mr. Hughes 會說 my mobile，玩家自己的詞塊只說美式。同樣的對照：玩家說 I'll transfer you，Mr. Hughes 的台詞說 Could you put me through?
  - inquire（t6）和 inquiry（t7）是同一個字的動詞和名詞，這一站只有這一組同家族的字。anytime 這一站寫成一個字，商展那一站如果用到請統一。
  - 還沒教、台詞要避開的字：catch（I didn't catch that，機場）、note（會議）、polite（Email）。
  - t6 的時間子句只有 as soon as 進了詞塊；when 由 t7 的台詞示範（Please call me back when you get this message.），原本那句詞塊讓給了規定要教的 I'm calling about…。Let me repeat that back to you. 也改成 t6 台詞示範，repeat 仍是 t6 的單字。
  - t1 沒有用 How can I help you? 當詞塊，因為第一幕公園已經教過 How can I help?；t8 沒有用 I can hardly hear you 當詞塊，因為第二幕社區中心有 Sorry, I can't hear you.，hardly 只教單字。
  - t4 詞塊裡的 her 指 Ms. Carter。
  - t5、t7、t8 的單字平均排名比前一個任務低：t5 放了 voice、pause、sometime（聽留言時最用得到，也讓第一次的聽獨白輕一點），t7、t8 是因為搬進來的必教字 press、connection 和 twice 都是常用字。
  - 故事：Mr. Hughes 在 t8 掛電話前說一次六月的商展他會到（I'll be at the fair in June.）；十二月訂單改交貨日這條線會接到 Email 和倉庫那兩站。時差的安排：t5 的留言是英國的早上留的，t7 玩家下午回電時英國剛下班，t8 他在回家的火車上看到留言馬上回電。
  - 圖示：要畫像素圖的有 3 個：telephone（☎️ 桌上電話）、signal（📶 訊號格）、operator（🎧 耳機麥克風）。signal 要和飯店那一站的 wireless 畫得不一樣（這裡畫手機訊號格，不要畫 Wi-Fi 扇形）。cellphone 標成抽象，因為第一幕的 phone 已經畫成 📱 手機。

### 22 Email（`email`）

- NPC：`coworker` 同事 Dan（t1～t3、t5、t6，坐隔壁桌，教玩家怎麼寫工作信）、`manager` 主管 Ms. Carter（t4、t7、t8；t4 的信是她寫的，t7 的語音留言也是她的聲音）。客戶 Mr. Hughes（英國 Hughes Home and Garden 的 James Hughes）只在信件和對話裡被提到，不出場。
- 場景：一月，上班滿兩個月，Ms. Carter 開始讓玩家自己寫信給客戶。Dan 教主旨、開頭和結尾，玩家寫信問 Mr. Hughes 十二月那張訂單的事；附件打不開改傳連結；把去年的價目表寄給了 Mr. Hughes，補寄一封更正信；讀 Ms. Carter 交辦的信，趕在期限前把價目表改好；等 Mr. Hughes 回信、把信轉寄給主管；請 Dan 看草稿，把語氣改得客氣；聽 Ms. Carter 的語音留言，回信給 Mr. Hughes 說明交貨日期；星期五請假前寫好最後一封信。

| 任務 | 標題               | 新詞塊（英文／中文）                                                                                                                                | 新單字（英文／中文／排名）                                                                                                                                                                                                                                                                     | 文法                                                                        | 新題型              | 新項目數    |
| ---- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------- | ----------- |
| t1   | 寫第一封工作信     | What should I put in the subject line?／主旨要寫什麼比較好？<br>I'm writing to ask about your order.／來信是想請問您訂單的事。                      | subject／（信件的）主旨／N361<br>create／建立；新增／N386<br>simple／簡單的／N688<br>purpose／目的／N735<br>dear／（信件開頭的稱呼）……您好／N1401<br>sincerely／（信尾）敬上；誠摯地／T11<br>regards／（信尾）祝好；問候／N511                                                                 | —                                                                           | —                   | 9           |
| t2   | 附件和連結         | Sorry, I can't open the attachment.／不好意思，附件我打不開。<br>Could you send me the link instead?／可以改傳連結給我嗎？                          | attachment／附件／N2794<br>link／連結／N770<br>site／網站／N494<br>data／資料；數據／N556<br>article／文章／N630<br>newsletter／（業界的）電子報／T178<br>appear／出現；顯示／N405<br>enclose／（紙本信件）隨信附上／T27                                                                       | —                                                                           | —                   | 10          |
| t3   | 寄錯檔案           | I think I attached the wrong file.／我好像附錯檔案了。<br>Sorry, the wrong file was attached to my last email.／抱歉，上一封信附錯檔案了。          | error／錯誤／N1497<br>correct／正確的／N1032<br>ignore／不用理會；忽略／N1446<br>delete／刪除／T299<br>sender／寄件人／T408<br>recipient／收件人／T137<br>attempt／試圖；嘗試／N686<br>notify／通知／T50                                                                                       | 被動式（過去）：was sent, wasn't attached                                   | —                   | 10          |
| t4   | 讀主管交辦的信     | No problem, I'll finish it before the deadline.／沒問題，我會在期限前完成。                                                                         | request／要求；請求／N1011<br>recent／最近的／N641<br>current／目前的；現行的／N590<br>revise／修訂；修改／N2688<br>necessary／必要的／N676<br>ensure／確保／N1153<br>approve／核准；同意／N1575<br>deadline／截止期限／T18<br>priority／優先要做的事／N1793                                   | —                                                                           | —                   | 10          |
| t5   | 等回信、轉寄       | I'm still waiting for a response from Mr. Hughes.／我還在等 Mr. Hughes 回覆。<br>Should I forward it to Ms. Carter?／要轉寄給 Ms. Carter 嗎？       | reply／回覆（動詞）／N1108<br>response／回覆；回應（名詞）／N606<br>final／最後的；定案的／N698<br>comment／意見；評語／N716<br>refer／提到；參考（refer to）／N866<br>discussion／討論／N764<br>content／內容／N1025<br>meanwhile／在這段時間；同時／N1753                                    | —                                                                           | **段落填空 第一次** | 10          |
| t6   | 把信寫得客氣       | Could you take a quick look at this?／可以幫我很快看一下這個嗎？<br>I'll read it more carefully next time.／下次我會看得更仔細。                    | quick／快速的；簡短的／N1195<br>carefully／仔細地／N1386<br>clearly／清楚地／N728<br>polite／有禮貌的；客氣的／T321<br>simply／只要；簡單地／N626<br>express／表達／N818<br>appreciate／感謝；感激／N1274<br>possibly／（Could you possibly…）方不方便；也許／N1347                            | 詞性：形容詞和副詞（quick / quickly, clear / clearly, careful / carefully） | —                   | 10          |
| t7   | 主管的語音留言     | I'll take care of it right away.／我馬上處理。                                                                                                      | raise／提出（問題）／N486<br>gain／得到；累積（經驗）／N737<br>unable／無法；不能／N1718<br>outline／大綱；重點摘要／N1931<br>highlight／標出來；強調／N1904<br>addition／（in addition）另外；附加／N707<br>verify／核對；查證／T240<br>certain／確定的／N451<br>otherwise／否則；不然／N1056 | —                                                                           | —                   | 10          |
| t8   | 請假前的最後一封信 | I'll be out of the office on Friday.／我星期五不在公司。<br>Please let me know if you have any further questions.／如果您還有其他問題，請再跟我說。 | absence／不在（的期間）；缺席／N1758<br>further／更多的；進一步的／N400<br>inform／告知；通知（書信用語）／N1070<br>prior／（prior to）在……之前／N1792<br>proofread／校對／T532<br>communicate／溝通；聯絡／N1800<br>glad／高興的；樂意的／N1370<br>particularly／尤其；特別／N601             | —                                                                           | —                   | 10          |
| t9   | 角色扮演大挑戰     | —                                                                                                                                                   | —                                                                                                                                                                                                                                                                                              | —                                                                           | —                   | 0（只複習） |

小計：14 個詞塊、65 個單字。

- 之後再出現的題型：t2 句子填空（混文法填空）、t4 閱讀（讀 Ms. Carter 交辦的信，2 題）、t5 段落填空（第一次）、t6 聽力填空、t7 聽獨白答題（Ms. Carter 的語音留言，2 題）、t8 打字拼字（電話那一站的單字）和聽力填空。
- 給寫台詞的人：這一站有三個詞塊是「寫在信裡的句子」，不是對人說的話：t1 的 I'm writing to ask about your order.、t3 的 Sorry, the wrong file was attached to my last email.、t8 的 Please let me know if you have any further questions.。台詞一定要安排成玩家一邊打字一邊唸出來給 Dan（t1、t3）或 Ms. Carter（t8）聽，不要改成對人說的話，也不要再加第四句。其餘 11 個詞塊都是對 Dan 或 Ms. Carter 說的。
- 各任務的用字（台詞照這個寫）：
  - t2：Dan 把一份業界電子報（newsletter）轉寄給玩家，裡面有一篇講桌燈的文章（article）；公司只有六個人，沒有自己的電子報。銷售資料（data）在附件裡，玩家點了之後畫面上什麼都沒出現（Nothing appears），Dan 改傳公司網站（site）上的連結。enclose 由 Dan 說明：紙本信用 enclosed，email 用 attached。
  - t3：玩家先對 Dan 說 I think I attached the wrong file.（寄給 Mr. Hughes 的是去年的價目表）；Dan 說寄出去的信沒辦法從收件人（recipient）那邊刪除（delete），不要試圖（attempt）裝作沒事，馬上通知（notify）Mr. Hughes，請他不用理會（ignore）上一封，再附上正確的（correct）檔案；Dan 口述 Please ignore my last email.，玩家邊打邊唸第二個詞塊。wasn't attached 也放在台詞裡（The new list wasn't attached.）。
  - t8：Ms. Carter 說 Please inform Mr. Hughes prior to Friday.；Dan will be glad to help in your absence.；He'll communicate with our clients on Friday, particularly Mr. Hughes, who is waiting for the delivery date.（who 子句辦公室那一站教過）；Proofread it once more, then send it. 玩家的信開頭可以用 I'm writing to inform you…，接回 t1 的 I'm writing to…。
- 閱讀素材（t4）：Ms. Carter 寄給玩家的工作信，約 90 字，主旨「Price list for Mr. Hughes」。大意：Thanks for fixing this morning's error so quickly. Now I have a request. In his recent email, Mr. Hughes asked for our current price list, but the list on file is from last year. Could you revise it? The new data is in the attachment. Please make the necessary changes and ensure that every price is correct. I have to approve the list first, so send your draft to me, not to Mr. Hughes. The deadline is Thursday at noon. This is your top priority this week. 只用到 t1～t4 教過的字（error、data、attachment、correct 是 t2、t3 的字）。2 題問「Ms. Carter 要玩家做什麼」（修訂價目表）和「草稿要先寄給誰」（Ms. Carter，不是 Mr. Hughes）。
- 段落填空（t5）：第一次出現 TOEIC Part 6，重點是認識題型，所以只放一個文法空格，另外兩個考用字，全部只用已經會的字。一封玩家寫給 Mr. Hughes 的短信，約 45 字，3 個空格：Dear Mr. Hughes, Thank you ___ your email.（for、to、of、at）I have ___ the new price list to this email.（attached、attach、attaching、attaches，唯一的文法空格）Please ___ me know if you have any questions.（let、tell、make、give）Sincerely, … 這一題放在對話之後：Dan 說 Mr. Hughes 把回信寄到他那裡了，玩家把信轉寄給 Ms. Carter，再回一封信給 Mr. Hughes。
- 聽獨白答題（t7）：Ms. Carter 整個下午在客戶那裡開會，留語音訊息給玩家，約 90 字：她無法（unable）收信，所以用留言的；Mr. Hughes 對交貨日期提出（raise）一個問題，請玩家今天寫信回他：先用兩三行寫出時程的大綱（outline），把新的日期標出來（highlight）；另外（in addition）跟 Dan 核對（verify）地址；她確定（certain）玩家可以自己寫，這是累積經驗（gain experience）的好機會；四點前要寄出，否則（otherwise）Mr. Hughes 明天開會會來不及用。2 題問「Ms. Carter 為什麼用留言的」（她沒辦法收信）和「玩家要跟 Dan 核對什麼」（地址）。聽完留言，Ms. Carter 打電話回來確認，玩家說 I'll take care of it right away.
- 請人確認：
  - 第二輪改了 t3 的兩個詞塊：被動式的那一句照審閱意見改成 Sorry, the wrong file was attached to my last email.（更正信真的會這樣寫）；審閱建議的另一句 Please ignore my last email. 也是寫在信裡的句子，加上去就有四句，超過「最多三句」的上限，所以改放一句對 Dan 說的 I think I attached the wrong file.（口語用主動、信裡用被動，剛好對照），Please ignore my last email. 留在台詞裡由 Dan 口述。
  - t8 的 Please let me know if you have any further questions. 是 if 加祈使句，照第一幕 Call me if you need anything. 的先例當固定說法用，不算提早用了第一條件句（會議 t3 才教）。
  - forward 在第二幕只教過 look forward to，這裡的詞塊用的是「轉寄」的意思，沒有另外占一個單字的位子，台詞要讓 Dan 先說一次 forward the email。
  - 第二輪換字：inform 進來（t8，I'm writing to inform you…），frequently 拿掉。however 依決定不在第三幕教，所以 particularly 留著，t8 的用法寫在上面。notify（t3，口語、內部通知）和 inform（t8，書信用語）分在兩個任務。
  - reply（動詞）和 response（名詞）故意放在同一個任務對照；regards 和 sincerely 也是對照（熟人和正式）。同一個字族只有 simple 和 simply 一組，simply 在 t6 的詞性文法任務裡。
  - 沒有教的主題字：website（已經教 site）、edit（和 revise 太像）、faithfully（英式信尾 Yours faithfully）、favor（英美拼法不同）。
  - 檔案的中文一律叫「價目表」（price list）；「報價單」（quote）是採購那一站的字。
  - t3 的單字平均排名比前後任務高，因為 sender、recipient、delete 都是寄錯信時少不了的字。
  - 圖示：link（🔗 鎖鏈）、error（⚠️ 警告三角形）、correct（✅ 綠色打勾）、reply（↩️ 回覆箭頭）4 個要畫像素圖，都是信箱裡看得到的符號；attachment 改成抽象（📎 的圖給辦公室那一站的 clip）；其餘都是抽象字。

### 23 會議（`meeting`）

- NPC：`manager` 主管 Ms. Carter（t1、t3、t5、t8 的對話；t7 的獨白也是她，在會議結束前做總結）、`coworker` 同事 Dan（t2、t4、t6）
- 場景：二月。每週小組會議（the weekly team meeting）固定在星期一，這週 Ms. Carter 星期一要出差，第一次把會議交給玩家安排：不取消、改到星期四，再問 Dan 怎麼訂二樓的會議室（和同棟其他公司共用，要在門口的行事曆登記），和主管排議程，讀主管寄給大家的會議通知。星期四開會：玩家報告新歸檔系統的進度；Dan 提案報告改用新程式、不再印紙本，玩家客氣地說出保留和偏好；主管總結決議和待辦事項（action items），玩家做記錄；會後主管給回饋，玩家問先做哪一件，並表示同意。

| 任務 | 標題           | 新詞塊（英文／中文）                                                                                                                                         | 新單字（英文／中文／排名）                                                                                                                                                                                                                                                                                   | 文法                                                     | 新題型 | 新項目數    |
| ---- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- | ------ | ----------- |
| t1   | 改會議時間     | Would you rather meet in the morning or the afternoon?／您比較想早上開，還是下午開？<br>Does Thursday at ten work for you?／星期四早上十點您方便嗎？         | between／在……之間／N116<br>business／商務；公事；生意／N211<br>rather／寧願；比較想／N292<br>either／兩個都可以（任一個）／N371<br>reschedule／改時間；改期／T77<br>cancel／取消／N2390<br>weekly／每週的／N2661                                                                                             | —                                                        | —      | 9           |
| t2   | 訂會議室       | How do I book the conference room?／會議室要怎麼訂？<br>Is the room free between ten and eleven?／那間十點到十一點有空嗎？                                   | group／一群人；團體／N167<br>second／第二的／N226<br>side／邊；側／N276<br>conference／會議（conference room 會議室）／N812<br>attend／出席；參加／N820<br>attendee／出席的人；與會者／T102<br>calendar／行事曆／T126<br>projector／投影機／T397                                                             | —                                                        | —      | 10          |
| t3   | 排議程         | Should I add anything else to the agenda?／議程還需要加什麼嗎？<br>If we start on time, we'll finish by eleven.／準時開始的話，十一點前就能結束。            | point／重點；要點／N131<br>report／報告／N166<br>lead／主持；帶領／N241<br>present／（在會議上）報告；發表／N275<br>item／項目（agenda item 議程項目）／N747<br>proposal／提案／N980<br>update／最新進度；更新／N1933<br>agenda／議程／N2030                                                                 | 第一條件句（If we start at nine, we'll finish by noon.） | —      | 10          |
| t4   | 讀會議通知     | Would you mind sending me your slides today?／可以麻煩你今天把投影片傳給我嗎？                                                                               | result／結果；成果／N233<br>program／程式；軟體／N240<br>figure／數字；數據／N357<br>involve／牽涉到；需要……參與／N379<br>entire／整個的；全部的／N1185<br>suggestion／建議／N1284<br>topic／主題；議題／N1296<br>refreshment／茶點／T211<br>slide／投影片／N1897                                            | —                                                        | —      | 10          |
| t5   | 報告進度       | Here's a quick update on the new filing system.／我簡單報告一下新歸檔系統的進度。<br>So far, everything is on schedule.／到目前為止都照進度在走。            | fact／事實（in fact 其實）／N202<br>build／建立；一步一步做起來／N221<br>base／以……為根據（based on 根據）／N327<br>progress／進度；進展／N1101<br>overall／整體來說；整體的／N1113<br>arrange／整理；安排／N1266<br>brief／簡短的／N1270<br>currently／目前／N1293                                          | —                                                        | —      | 10          |
| t6   | 討論提案       | I'm not against the idea, but it's a big change.／我不是反對這個想法，只是變動滿大的。<br>I prefer the one that's easier to use.／我比較喜歡好上手的那一個。 | against／反對／N224<br>view／看法；觀點／N293<br>consider／考慮／N295<br>sense／道理（make sense 有道理）／N412<br>absolutely／當然；完全同意／N1078<br>convince／說服／N1358<br>switch／換成；改用／N1463<br>disagree／不同意／N2503                                                                        | 關係子句 that / which（the room that has a projector）   | —      | 10          |
| t7   | 聽主管總結     | Could you go over the second point again?／第二點可以請您再說一次嗎？                                                                                        | effect／效果（take effect 開始實施）／N315<br>note／筆記；記錄（take notes 做記錄）／N384<br>decision／決定；決議／N449<br>action／行動（action item 待辦事項）／N474<br>majority／大多數／N1009<br>postpone／延後／T65<br>intend／打算／N1114<br>upcoming／即將到來的／T86<br>conclude／結束；做結論／N1355 | —                                                        | —      | 10          |
| t8   | 會後跟進       | Which of these should I work on first?／這幾件事我應該先做哪一件？<br>That makes sense to me.／我覺得很合理。                                                | assume／（我）想應該是；假定／N870<br>effective／有效的；有成效的／N1031<br>neither／兩個都不／N1216<br>improvement／進步；改善／N1226<br>contribute／貢獻；出力／N1238<br>participate／參與；參加／N1468<br>confidence／信心／N1493<br>feedback／回饋意見／T128                                             | —                                                        | —      | 10          |
| t9   | 角色扮演大挑戰 | —                                                                                                                                                            | —                                                                                                                                                                                                                                                                                                            | —                                                        | —      | 0（只複習） |

小計：14 個詞塊、65 個單字。

- 之後再出現的題型：t2 句子填空（混文法填空）、t4 讀會議通知（2 題）、t5 聽對話答題（2 題）、t6 聽力填空和段落填空、t7 聽獨白答題（2 題）、t8 打字拼字（Email 那一站的單字）和聽力填空。
- 閱讀素材（t4）：Ms. Carter 寄給全組的會議通知 email，大約 100 字。內容：她星期一出差（away on business），這週的 weekly team meeting 不取消，改期（rescheduled）到星期四 10:00～11:00，在二樓的 conference room，請大家都出席（attend）；議程（Agenda）四個 items：1. January sales report（Dan will present the results and the main figures）、2. Update on the new filing system、3. Dan's proposal: a new program for our reports、4. The June fair（This topic involves the entire team.）；請大家開會前先讀附檔的報告，有別的議題建議（a suggestion for another topic）星期三中午前寄給她；會議室有投影機，請 Dan 帶投影片（slides）；會提供咖啡和茶點（Coffee and refreshments are provided.）。2 題：「會議為什麼改時間」和「開會前大家要先做什麼」。讀完後 Dan 來問有沒有看到信，玩家請他今天先把投影片傳過來。
- 聽對話答題（t5）：星期四會議上，Ms. Carter 請玩家報告，要他簡短說（Keep it brief.）。玩家說新歸檔系統目前（currently）搬了大約一半，檔案照年份整理好了（arranged by year），剩下的是去年的訂單，月底前會做完；build 用在「這套系統是一步一步建起來的」（We're building the new filing system step by step.），不要寫成 I built a list。Ms. Carter 說進度（progress）很好，其實（in fact）還超前，根據（based on）現在的速度月底沒問題，整體（overall）她很滿意。2 題問「玩家報告的是哪件事」和「什麼時候會做完」。
- 聽獨白答題（t7）：Ms. Carter 在會議結束前（before we conclude）總結今天的決議（decisions）：一月業績比十二月好；Dan 的提案大多數人（the majority）贊成，新程式先試用一個月，三月一日開始實施（takes effect），她打算（intend）四月做最後決定；六月展覽（the upcoming fair）的價錢還沒齊，這個議題延後（postpone）到下週；最後唸 action items：Dan 做什麼、玩家把會議記錄（notes）寄給大家。2 題問「新程式什麼時候開始用」和「哪個議題延到下週」。玩家邊聽邊做記錄，沒記到的那一點用詞塊請主管再說一次。
- 請人確認：
  - 第二輪搬進來的 4 個字：weekly、cancel（t1，主管說這週的例會不要取消、改期就好）、attend（t2，排在 attendee 前面）、item（t3，agenda item；t7 的 action items）。搬出去的 4 個字：nearly、fairly、mainly、gather（審閱建議，這一站不再教）。
  - 單字在任務間的調整：calendar 移到 t2（會議室門口的預約行事曆）、note 移到 t7（做會議記錄）、brief 和 arrange 移到 t5、improvement 移到 t8（主管的回饋）。
  - 「同意」的詞塊 That makes sense to me. 放在 t8（會後主管說明為什麼先寄會議記錄，玩家表示同意），換掉原本的 I'll send the notes to everyone this afternoon.（同樣的 I'll send… 句型公司活動那一站也有）。t6 維持一句客氣的保留、一句用關係子句說偏好，標題改成「討論提案」；Dan 的台詞可以先說 That makes sense.（sense 是 t6 的單字）。
  - t4 的詞塊改成 Would you mind sending me your slides today?（Could you send me… 在 Email 和採購已經各有一句）。t7 的詞塊拿掉開頭的 Sorry，長度才接得上 t8。
  - 會議記錄的多益用字是 minutes（minute 已教）：t8 的台詞說一次「the notes, or minutes」，不另外佔單字。
  - 沒教的主題字：boardroom（六個人的公司用 conference room 就夠，兩個字太像）；propose 也沒排（已經教 proposal）。同字族只有兩組：attend／attendee、effect／effective。
  - 意思接近但刻意對比的字：cancel、reschedule（t1）和 postpone（t7）；proposal（正式提案，t3）和 suggestion（隨口的建議，t4）；either（t1）和 neither（t8）。
  - t3 的 by eleven 用了 by（採購 t3 才正式教），因為規格給的文法例句就是 finish by noon；第二幕也教過 by eight thirty。
  - 單字平均排名：t1 因為搬進來的 weekly、cancel 排名數字大（字本身不難）而偏高；t3、t5、t7 因為必教的常用字多而比前後任務低；最難的字集中在 t8。
  - t5 的報告主題用「新歸檔系統」（接辦公室那一站的歸檔工作）；如果辦公室那一站最後沒有這段，主題可以換，句型 Here's a quick update on… 不變。
  - 圖示：calendar（📅）、projector（📽️）、slide（📊，螢幕上的一張圖表）三個要畫，其他都是抽象字。

### 24 採購與廠商（`purchasing`）

- NPC：`supplier` 廠商業務 Jack（新角色，Brightway 公司的業務，澳洲口音，全遊戲第一個澳洲聲線；t1～t3 到公司拜訪，t5、t6、t8 在電話裡，t7 的語音留言也是他）、`manager` 主管 Ms. Carter（聲線和角色圖沿用；t4 和 t7 聽玩家回報）
- 場景：三月，Ms. Carter 要玩家替公司的基本款玻璃桌燈找新的供應商。Brightway 的 Jack 帶樣品來公司拜訪：玩家請他報價、問最低訂購量和折扣、談交期；讀他寄來的報價 email 後跟 Ms. Carter 回報；打電話談價錢，說要先問 Ms. Carter 再回覆；Ms. Carter 同意後下訂單、確認交貨日期；後來 Jack 留言說貨會延誤；最後發票金額算錯，講好怎麼付款。要不要買、付不付款都由 Ms. Carter 決定，玩家負責問、回報和跟進。

| 任務 | 標題                   | 新詞塊（英文／中文）                                                                                                                                  | 新單字（英文／中文／排名）                                                                                                                                                                                                                                                                             | 文法                                                                                     | 新題型              | 新項目數    |
| ---- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- | ------------------- | ----------- |
| t1   | 廠商來拜訪             | We're looking for a new supplier.／我們在找新的供應商。<br>Could you send us a quote for these items?／這幾個品項可以請你報價給我們嗎？               | supplier／供應商；廠商／N2004<br>visit／拜訪／N333<br>sample／樣品／N1062<br>quote／報價；報價單／N1433<br>purchase／採購；購買／N1002<br>firm／公司；行號／N628<br>particular／特別的；特定的／N467                                                                                                   | —                                                                                        | **澳洲口音 第一次** | 9           |
| t2   | 單價、最低訂購量和折扣 | What's the minimum order for that price?／這個價格最少要訂多少？<br>Is there a discount if we order five hundred?／如果我們訂五百個，有折扣嗎？       | unit／（計價的）一件；單位／N780<br>per／每／N373<br>minimum／最低的；最少的／N1769<br>discount／折扣／N1660<br>average／平均的／N690<br>standard／標準；標準款／N547<br>sixteen／十六／S<br>nineteen／十九／S                                                                                         | —                                                                                        | —                   | 10          |
| t3   | 什麼時候到貨           | We need them by the middle of April.／我們四月中以前要拿到貨。<br>Can you get them to us within fourteen days?／十四天內可以送到我們這裡嗎？          | within／在……之內／N285<br>fourteen／十四／S<br>eighteen／十八／S<br>period／期間；一段時間／N382<br>likely／很可能的／N535<br>process／流程；過程／N286<br>exact／確切的／N2327<br>availability／有沒有貨（供貨狀況）／T229                                                                            | 商務介系詞 by / until / within（by Friday, until the end of the month, within ten days） | —                   | 10          |
| t4   | 讀報價單               | This price is good until the end of March.／這個價格到三月底都有效。                                                                                  | quantity／數量／N2267<br>term／（付款）條件；條款／N280<br>condition／條件；規定／N445<br>additional／額外的／N1081<br>approximately／大約／N1902<br>value／價值；（訂單）金額／N342<br>specific／明確的；具體的／N791<br>material／材質；材料／N571<br>guarantee／保證／N1570                         | —                                                                                        | —                   | 10          |
| t5   | 跟廠商談價錢           | Could you do any better on the price?／價格可以再優惠一點嗎？<br>Let me check with Ms. Carter and get back to you.／我先問一下 Ms. Carter，再回覆你。 | deal／（划算的）交易；價錢／N321<br>reasonable／合理的／N1569<br>seventeen／十七／S<br>cut／降（價）；削減／N456<br>rise／上漲／N462<br>afford／負擔得起／N1488<br>negotiate／談（價錢、條件）；協商／N2002<br>worth／值得；值……錢／N816                                                               | —                                                                                        | —                   | 10          |
| t6   | 下訂單                 | We'd like to go ahead with the order.／我們決定下這張訂單了。<br>When can you confirm the delivery date?／交貨日期什麼時候可以確認？                  | deliver／交貨；送貨／N1064<br>confirmation／確認；確認書／T309<br>agreement／協議；約定／N785<br>reduce／降低；減少／N584<br>reduction／降幅；減少／N1687<br>produce／生產／N417<br>production／生產；產量／N713<br>manufacturer／製造商／N1896<br>select／挑選；選擇／N1173                           | 詞性：名詞和動詞（deliver / delivery, pay / payment, confirm / confirmation）            | —                   | 11          |
| t7   | 交貨要延後             | They can only deliver half the order on time.／他們只有一半的貨能準時交。                                                                             | delay／延誤；延後／N1310<br>demand／需求／N570<br>increase／增加／N230<br>significantly／大幅地；明顯地／N1669<br>import／進口／N1613<br>export／出口／N1543<br>alternative／替代方案；另一個選擇／N1090<br>source／來源；貨源／N623<br>partly／部分地；有一部分／N1916<br>volume／（訂單的）量／N1364 | —                                                                                        | —                   | 11          |
| t8   | 發票和付款             | I think there's a mistake on the invoice.／這張發票好像有地方寫錯了。<br>We'll send the payment by the end of the week.／我們這禮拜內會付款。         | invoice／發票；請款單／T19<br>method／方式；方法／N755<br>owe／欠（錢）／N2053<br>overdue／逾期未付的／T348<br>transaction／（一筆）交易／T238<br>proof／證明／N2021<br>calculate／計算／N1925<br>authorize／核准；授權／T213<br>directly／直接地／N1051                                               | —                                                                                        | —                   | 11          |
| t9   | 角色扮演大挑戰         | —                                                                                                                                                     | —                                                                                                                                                                                                                                                                                                      | —                                                                                        | —                   | 0（只複習） |

小計：14 個詞塊、68 個單字。

- 之後再出現的題型：t2 句子填空（混文法填空）、t4 讀報價 email（2 題）、t5 聽對話答題（2 題）、t6 聽力填空和段落填空、t7 聽獨白答題（2 題）、t8 打字拼字（考會議那一站的單字）和聽力填空。t1 的「澳洲口音 第一次」只是聲線新，內容和一般的 t1 一樣簡單。
- 閱讀素材（t4）：Brightway 的 Jack 寄來的報價 email，條列式，約 90～100 字，只用到 t4 為止教過的字。大意：It was good to visit your office. Here is our quote. Item: glass desk lamp, large. Quantity: 500 units. Unit price: $19 ($16 for the standard size). Minimum order: 200 units. Discount: 5% on orders of 1,000 units or more. Material: glass. Delivery: approximately 14 days; we guarantee delivery within 18 days. There is an additional charge if you need a specific delivery date. Payment terms: within 30 days of delivery. Total value: $9,500. This quote is good until March 31. Our terms and conditions are attached. glass 之前只教過「玻璃杯」，這裡要加註「玻璃」。讀完後 Ms. Carter 問要不要今天決定，玩家用詞塊回答。2 題問「報價到什麼時候有效」和「什麼情況要加收費用」。
- 聽對話答題（t5）：玩家打電話給 Jack 談大款的價錢，先問價格能不能再優惠。Jack 說今年材料成本上漲（rise），十九塊已經是合理的（reasonable）價格，但他願意談（negotiate）；折扣本來一千個才有，不過訂五百個的話，他可以把單價降（cut）到十七塊，說這是很划算的價錢（a good deal）、值得（worth it）。玩家說要先問 Ms. Carter 再回覆（第二句詞塊）。2 題問「Jack 說價格為什麼不低」和「訂五百個的單價是多少」。
- 聽獨白答題（t7）：Brightway 的 Jack 留的語音留言：很抱歉，這批貨會延誤（a delay）。製造商現在也出口（export）到好幾個國家，這個月需求（demand）大幅增加（increased significantly），訂單量（volume）很大；有一部分（partly）也是因為進口（imported）的玻璃晚到。他們找到了替代的貨源（an alternative source）。十四日前只能先交一半，另一半十九日前到；請玩家回電。2 題問「貨為什麼會延誤」和「十四日前會到多少」。聽完後玩家跟 Ms. Carter 回報，用這個任務的詞塊。
- 請人確認：
  - 商品和數字照第二輪的決定：Brightway 供應基本款玻璃桌燈，標準款十六塊、大款十九塊；殺價後大款十七塊、訂五百個，總價 8,500 美元，四月中交貨；t8 的發票錯用舊單價算成 9,500（Jack 說是用舊單價 calculate 的，玩家只欠 owe 8,500）。14 句詞塊本身都沒有提到商品。
  - 第二輪換掉的詞塊：t2 的 So that's sixteen dollars per unit, right? 拿掉（「So…, right?」句型全劇出現太多次），t5 的 Is there a discount if we order five hundred? 移到 t2，discount 跟著移到 t2、quantity 改到 t4 的報價單（Quantity: 500 units）；t5 新增指定句型 Let me check with Ms. Carter and get back to you.（玩家是助理，價錢要主管決定）；t6 的 Could you email me the order confirmation today? 改成 When can you confirm the delivery date?（動詞 confirm 加名詞 delivery，文法點看得到；confirmation 和 deliver 留在單字裡）。
  - t3 的文法是 by / until / within：t3 的兩句詞塊帶 by 和 within，until 放在 t4 的詞塊，by 在 t8 再出現一次（by the end of the week）。
  - t6 的 reduce / reduction 要有台詞：Jack 下單時確認「the price reduction that we agreed on」（寫成 that we agreed on，省略 that 的關係子句要到飯店才教）；produce / production / manufacturer 是 Jack 說「今天就通知製造商，下星期開始生產」。
  - 必教字裡有兩組近義字，分在不同任務：cut（t5，口語的降價）和 reduce（t6）；rise（t5，價格自己上漲）和 increase（t7，需求增加）。particular（t1，anything in particular）和 specific（t4，a specific date）中文特意分開。
  - t1 的 We're looking for a new supplier. 沿用前兩幕的 I'm looking for… 句型，句子不同；t1 的新東西是澳洲口音，所以句型特意選熟的。t1 的 sample、visit 是 Jack 的台詞（I visit a lot of firms around here. I brought a sample for you.）。
  - t8 的 directly 是 Jack 說「把付款證明直接寄給我」（Email the proof of payment directly to me.）；authorize 是「等 Ms. Carter 核准付款」。
  - guarantee 在 t4 的 email 裡當動詞（We guarantee delivery within 18 days.），和第二幕修車那一站的 warranty（保固）意思不同。invoice 中文寫「發票；請款單」，和台灣的統一發票不完全一樣。
  - 圖示：6 個字要畫：purchase（購物車）、discount（百分比符號）、calculate（計算機）、increase（往上的折線圖）、reduce（往下的折線圖）、manufacturer（有煙囪的工廠，要和倉庫那一站的 warehouse 畫得不一樣；鍵用 🧑‍🏭，避開 warehouse 的 🏭）。其他都是抽象字，sample 也維持抽象。
  - 拿掉的字：contract（和 agreement 重複，合約留給第四幕）、rapidly（Jack 的留言用不上）；item、supply 改由會議和辦公室那兩站教，這裡當已知字用。
  - 候選字裡沒用到的主題字：bargain、bid、wire、currency、vendor、buyer、seller、negotiation、specification、contract 等，可以留給第四幕。

### 25 倉庫與出貨（`warehouse`）

- NPC：`warehouse_lead` 倉庫主管 Luis（新角色，帶著幾個人管公司的小倉庫；t1～t6、t8 的對話和 t9 都是他，t7 聽完廣播後也是跟他說話）、`announcer` 廣播聲音（只有聲音，t7 倉庫喇叭的廣播）
- 場景：四月，Ms. Carter 請玩家到公司倉庫支援一個月。倉庫不大，只有一個裝卸區（dock），貨車都是貨運公司的。貨是玻璃檯燈，所以包裝特別小心。Luis 帶玩家認識倉庫；盤點庫存，數字對不起來；學怎麼包玻璃檯燈、封箱、貼標籤；看牆上的安全須知；照出貨時刻表把貨裝上車；裝車前發現少了一箱；聽到儲藏室要裝新暖氣系統的廣播；最後幫英國客戶 Mr. Hughes（Hughes Home and Garden）追蹤走海運的那批貨，回報 Ms. Carter。

| 任務 | 標題           | 新詞塊（英文／中文）                                                                                                                                                    | 新單字（英文／中文／排名）                                                                                                                                                                                                                                                          | 文法                                                                   | 新題型                      | 新項目數    |
| ---- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------- | ----------- |
| t1   | 到倉庫幫忙     | Ms. Carter asked me to help out here this month.／Ms. Carter 請我這個月來這邊幫忙。<br>This place is huge, so where do I start?／這裡好大，我要從哪裡開始？             | goods／貨物；商品／T15<br>stock／庫存；存貨／N691<br>operation／作業；營運／N849<br>huge／超大的；巨大的／N862<br>shipment／一批貨；出貨／T38<br>warehouse／倉庫／T131<br>dock／裝卸區（貨車停靠的地方）／T246<br>truck／貨車；卡車／N2113                                          | —                                                                      | —                           | 10          |
| t2   | 盤點庫存       | I counted again, but the numbers still don't match.／我又數了一次，數字還是對不起來。<br>Should I mark it on the inventory list?／我要在庫存清單上註記一下嗎？          | mark／做記號；註記／N743<br>match／相符；對得上／N850<br>count／數；清點／N1022<br>inventory／庫存清單；盤點／T60<br>category／類別／N1192<br>empty／空的／N1592<br>dozen／一打（十二個）／N1765<br>shelf／層架；架子／N2538<br>rack／貨架（整座）／T508                            | —                                                                      | —                           | 11          |
| t3   | 包裝與貼標籤   | How are small orders like this usually packed?／像這種小訂單通常怎麼包？<br>Were these boxes packed by the same person?／這幾箱是同一個人包的嗎？                       | measure／量（尺寸）／N532<br>store／存放；儲存／N617<br>protect／保護／N903<br>pack／包裝；裝箱／N1387<br>label／標籤（貼紙）／N1528<br>plastic／塑膠／N1850<br>seal／封（箱）；密封／N2322<br>wrap／包；裹／N2334<br>fragile／易碎的／字表外                                       | 被動式的問句和 by（When was it shipped? It was signed by Luis.）       | —                           | 11          |
| t4   | 讀安全須知     | Sorry, I wasn't aware of the rule about gloves.／不好意思，我不知道有戴手套的規定。                                                                                     | fire／火；火災／N613<br>prevent／預防；防止／N1026<br>safe／安全的／N1027<br>aware／知道；留意到／N1039<br>equipment／設備；裝備／N1055<br>warn／警告；提醒／N1132<br>wet／濕的／N2084<br>ladder／梯子／T285<br>alarm／警報；警鈴／N2271<br>glove／手套／T443                       | —                                                                      | —                           | 11          |
| t5   | 照時刻表裝車   | Do you want me to load the rush order first?／要我先裝那張急單嗎？<br>Which truck does this order go on?／這張訂單要上哪一台車？                                        | lift／抬；舉起／N1167<br>vehicle／車輛／N1408<br>load／裝（貨）；裝載／N1455<br>capacity／容量；載重量／N1472<br>yard／（倉庫外的）場地；院子／N1667<br>rush／趕；急件／N1699<br>multiple／多個的；多筆的／N1732<br>maximum／最大的；上限／N1841<br>stack／一疊；疊起來／T273       | —                                                                      | **聽對話答題加圖表 第一次** | 11          |
| t6   | 少了一箱       | Most of the order is here, but one box is missing.／這張訂單的貨大部分都在，但是少了一箱。<br>None of these boxes have a yellow tag.／這幾箱都沒有黃色吊牌。            | none／沒有任何一個／N1014<br>handle／處理；經手／N1041<br>inspect／檢查；檢驗／T139<br>disappear／消失；不見／N1665<br>tag／吊牌；標籤牌／T184<br>yellow／黃色（的）／N1827<br>thorough／徹底的；仔細的／T262<br>accurate／準確的／N2283<br>shortage／短少；不足／T398              | 數量詞：each, every, all, most, none（None of the boxes are missing.） | —                           | 11          |
| t7   | 倉庫廣播       | So the storage room is closed until three?／所以儲藏室要關到三點？                                                                                                      | control／控制／N301<br>remain／保持；仍然／N374<br>operate／操作／N915<br>maintain／維持；保養／N943<br>electrical／電的；用電的／T98<br>temperature／溫度／N1452<br>shut／關閉；關掉／N1775<br>install／安裝／N1924<br>machinery／機械（總稱）／T249<br>storage／儲藏；倉儲／N2707 | —                                                                      | —                           | 11          |
| t8   | 追蹤出貨       | What's the status of the shipment for Mr. Hughes?／Mr. Hughes 那批貨現在狀況怎麼樣？<br>I'll let Ms. Carter know it's on its way.／我會跟 Ms. Carter 說貨已經在路上了。 | contain／裝有；包含／N663<br>track／追蹤／N958<br>sea／海／N987<br>collect／收（貨）；收取／N1069<br>status／狀態；進度／N1127<br>transport／運送；運輸／N1210<br>carrier／貨運公司；運送業者／T254<br>port／港口／N2056<br>weigh／秤重；重量是／N2481                              | —                                                                      | —                           | 11          |
| t9   | 角色扮演大挑戰 | —                                                                                                                                                                       | —                                                                                                                                                                                                                                                                                   | —                                                                      | —                           | 0（只複習） |

小計：14 個詞塊、73 個單字。

- 之後再出現的題型：t2 句子填空（混文法填空）、t4 讀安全須知（3 題）、t5 聽對話答題加圖表（第一次，2 題）、t6 聽力填空＋段落填空、t7 聽獨白答題（倉庫廣播，2 題）、t8 打字拼字（採購與廠商的單字）＋聽力填空。
- 閱讀素材（t4）：Luis 貼在倉庫門口的「Warehouse Safety Rules」公告，約 120～130 字，開頭一句寫目的「To prevent accidents and keep everyone safe, please follow these rules.」，接著五條編號規則：(1) Safety equipment：包裝、搬貨要戴手套（玻璃會割手），手套放在門邊的櫃子裡；(2) Be aware of trucks：貨車整天進出裝卸區（dock），走過去之前先看；(3) 拿最上層的貨要用梯子（ladder），不可以踩在箱子或貨架上；(4) 地板濕了（a wet floor）不安全，看到水或油要馬上擦乾，並且放上牌子提醒別人（put out the sign to warn other people）；(5) Emergencies：聽到火災警報（fire alarm）就停下工作、從最近的門出去、在辦公室前面集合，不要回去拿東西。只用 t1～t4 和前面地點教過的字（emergency 在報到那一站教過；不用 vehicle、lift、yard、exit）。3 題：手套放在哪裡；看到地板有水要怎麼做；警報響的時候「不可以」做什麼。
- 聽對話答題加圖表（t5）：畫面上有一張小小的出貨時刻表，倉庫只有一個裝卸區，所以表上是三台貨運公司的車和時間（三列：Truck A／arrives 9:30／leaves 10:30／Lake Street；Truck B／arrives 12:00／leaves 1:00／Downtown；Truck C／arrives 2:30／leaves 3:30／Station Road）。Luis 跟玩家說有一張急單要送到市中心、兩點前一定要出發，請玩家先看時刻表，再把箱子搬到裝卸區。對話只用學過的字，答案要對照表格才找得到。2 題：「這張訂單要上哪一台車」（看表：往 Downtown 的 Truck B）和「Luis 請玩家先做什麼」。這一課的對話另外會用到：車還沒到就在外面的場地（yard）等、一台車一趟送多張訂單（multiple orders）、箱子最多疊三層（stack）、車子的載重上限（maximum capacity）。
- 聽獨白答題（t7）：倉庫喇叭的廣播（`announcer`），約 60～70 字：今天下午一點到三點要在儲藏室裝新的暖氣系統（We are installing a new heating system in the storage room），新系統會控制裡面的溫度（control the temperature）；施工的時候門會關著來維持溫度（the doors will remain shut to maintain the temperature），請不要在儲藏室附近操作機械或用電的設備（do not operate any machinery or electrical equipment）；裝卸區照常出貨，三點重新開放。2 題：「儲藏室什麼時候重新開放」和「廣播請大家不要做什麼」。聽完後玩家跟 Luis 確認：So the storage room is closed until three?
- 請人確認：
  - 第二輪的變動：emergency 移到報到那一站（這裡當已學過的字用）；safe 移進 t4（安全須知終於可以寫 safe）。依審閱意見拿掉 cargo（「貨」已經有 goods、stock、shipment、inventory 四個字），改教 collect。同一個字的不同詞性只留兩組（store／storage、operation／operate），所以拿掉 protective、maintenance、container；空出來的位子教 warn（t4）、electrical（t7），weigh 從 t3 移到 t8（這批貨多重）。
  - 多加 1 個字表外的字：fragile（t3）。貨是玻璃檯燈，箱子上一定會印 Fragile，這是包裝那一課少不了的字。
  - t8 沒有 container 了，台詞說 shipment、by sea、port 就夠；需要講貨櫃的話留給第四幕。
  - 沒有跳過任何 MUST 字。control、remain、operate、maintain 這幾個常用字最適合放在廣播裡，所以 t7 的單字平均排名比 t6 低；t8 的追蹤用字（track、sea、status、collect）也偏常用。
  - 近義字都是因為倉庫裡真的要分清楚才一起教：stock（現有的庫存）和 inventory（庫存清單、盤點）；shelf（一層架子）和 rack（整座貨架）；label（貼在箱子上的標籤）和 tag（掛的吊牌）；equipment（設備、裝備）和 machinery（會動的機械；辦公室那一站的 machine 是單一台機器）。
  - collect 在美式英語比較常說 pick up；台詞可以兩種都出現（The carrier collects from us every afternoon. / They picked it up on Monday.）。
  - 文法順序：t6 以前的詞塊都沒有用 each、most of、none of；t3 以後才用被動問句。t7 的 until three 用的是採購那一站教過的 until。
  - 圖示：要畫像素圖的有 13 個字：warehouse 🏬（🏭 留給採購的 manufacturer）、truck 🚛（要畫成側面的長型貨櫃車，跟第一幕 delivery 的小貨車 🚚 區分）、shelf 🗂️、label 📛（有條碼的出貨貼紙，跟 price 的 🏷️ 區分）、fire 🔥、ladder 🪜、alarm 🚨、glove 🧤、measure 📐（畫成捲尺）、temperature 🌡️、sea 🌊、port ⚓、inspect 🔍。rack、tag、yellow、stack、vehicle 跟現有圖示太像，都標成抽象。

### 26 客戶服務（`customer_service`）

- NPC：`customer` 客戶 Mr. Grant（開燈具店的老客戶，不高興但講道理；t1～t3、t5、t6、t8，全部在電話裡）、`manager` 主管 Ms. Carter（t4 的對話；t7 的獨白也是她在星期一週會上說的話）
- 場景：五月。Mr. Grant 訂的 24 盞檯燈星期一該到，星期三還沒到，他打電話來抱怨；玩家先聽、道歉、查訂單，回電保證到貨日期。星期四貨到了，卻有 8 盞有問題，他寫了一封客訴信；玩家讀完信問 Ms. Carter 怎麼補救，再打電話道歉、讓他選換貨或退款、說明後續。星期一週會上 Ms. Carter 檢討這次事件，那個星期稍後玩家打電話追蹤，確認補寄的貨平安送到。

| 任務 | 標題           | 新詞塊（英文／中文）                                                                                                                                                                          | 新單字（英文／中文／排名）                                                                                                                                                                                                                                                                                 | 文法                                                                            | 新題型 | 新項目數    |
| ---- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------ | ----------- |
| t1   | 訂單還沒到     | I completely understand, and I'd like to help.／我完全理解，我來幫您處理。<br>Could I have your order number, please?／可以給我您的訂單編號嗎？                                               | issue／問題（要處理的狀況）／N218<br>service／服務／N223<br>concern／顧慮；擔心／N303<br>situation／狀況；情況／N430<br>major／重大的／N438<br>completely／完全地／N960<br>angry／生氣的／N1813<br>upset／不高興的；心煩的／N2025                                                                          | —                                                                               | —      | 10          |
| t2   | 道歉並查訂單   | I'm very sorry for the inconvenience, Mr. Grant.／Mr. Grant，造成您的不便，真的很抱歉。<br>Let me look into it and call you right back.／我查一下，馬上回電給您。                             | case／情況（in that case 那樣的話）／N168<br>cause／造成；導致／N319<br>realize／意識到；了解到／N554<br>unfortunately／很遺憾；不巧／N1269<br>actual／實際的／N1335<br>inconvenience／不便／T116<br>explanation／解釋；說明／N1628<br>apologize／道歉／N2301<br>frustrating／讓人很煩的；令人挫折的／T354 | —                                                                               | —      | 11          |
| t3   | 保證到貨日期   | You'll have it Thursday unless you hear from me.／除非我再跟您聯絡，不然您星期四就會收到。<br>If it doesn't arrive by Friday, we'll send a new one.／如果星期五還沒到，我們會重新寄一批給您。 | solution／解決辦法／N788<br>doubt／懷疑；疑慮／N874<br>difficulty／困難／N1001<br>unless／除非／N1005<br>trust／信任；相信／N1075<br>resolve／解決（問題、糾紛）／N1777<br>honest／老實的；誠實的／N2035<br>unlikely／不太可能的／N2039<br>assure／向……保證／N2064                                         | 條件句 if not / unless（If it doesn't arrive by Friday, we'll send a new one.） | —      | 11          |
| t4   | 讀客訴信       | What can we do to make this right?／我們可以怎麼補救？                                                                                                                                        | refund／退款／T14<br>loss／損失／N806<br>discover／發現／N946<br>slightly／稍微；輕微地／N1112<br>eventually／最後；終於／N1140<br>replacement／換貨；替換品／T82<br>complain／抱怨；投訴／N1495<br>complaint／抱怨；客訴／N1689<br>disappointed／失望的／N1853<br>badly／嚴重地／N2157                    | —                                                                               | —      | 11          |
| t5   | 道歉與補救     | I'm so sorry your order arrived in that condition.／貨送到的時候是那個樣子，真的很抱歉。<br>Would you prefer a replacement or a full refund?／您想要換貨，還是全額退款？                      | poor／差的；品質不好的／N618<br>original／原本的；原來的／N963<br>admit／承認／N1034<br>coupon／折價券／T75<br>insist／堅持／N1551<br>blame／責怪；怪罪／N1627<br>terrible／很糟的／N1644<br>fault／過錯；責任／N1995<br>defective／有瑕疵的；故障的／T290                                                 | —                                                                               | —      | 11          |
| t6   | 說明後續安排   | It might take two or three days to get there.／可能要兩三天才會送到。<br>You may want to check everything when it arrives.／建議您貨到的時候全部檢查一遍。                                    | claim／索賠；理賠申請／N501<br>avoid／避免／N851<br>refuse／拒絕；拒收／N1209<br>properly／妥當地；正確地／N1726<br>advise／建議；勸告／N1745<br>minor／輕微的；小的／N1997<br>assist／協助／N2099<br>promptly／迅速地；馬上／T337<br>confusion／混亂；誤會／N2682                                         | may / might 的客氣說法（It might take a few days. You may want to…）            | —      | 11          |
| t7   | 週會上的檢討   | I'll follow up with him again later this week.／我這禮拜會再跟他聯絡，確認後續。                                                                                                              | occur／發生／N718<br>lack／缺乏；不足／N729<br>investigate／調查／N1533<br>seriously／認真地；嚴肅地／N1590<br>expectation／期望／N1606<br>outcome／結果／N1626<br>incident／事件（意外狀況）／N1807<br>calm／冷靜的／N1964<br>satisfaction／滿意；滿意度／N2133<br>react／反應；應對／N2377               | —                                                                               | —      | 11          |
| t8   | 追蹤回電       | I'm just calling to make sure everything arrived okay.／我只是打來確認東西都順利送到了。<br>Thank you again for your patience, Mr. Grant.／Mr. Grant，再次謝謝您的耐心等候。                  | support／支持／N272<br>satisfied／滿意的／N1154<br>recommendation／推薦；建議／N1534<br>relief／鬆一口氣；安心／N1623<br>helpful／幫了大忙的；有幫助的／N1713<br>perfectly／完美地；完全地／N1888<br>anymore／（不）再／N2107<br>loyal／忠實的／T393<br>patience／耐心／T447                               | —                                                                               | —      | 11          |
| t9   | 角色扮演大挑戰 | —                                                                                                                                                                                             | —                                                                                                                                                                                                                                                                                                          | —                                                                               | —      | 0（只複習） |

小計：14 個詞塊、73 個單字。

- 之後再出現的題型：t2 句子填空（混文法填空）、t4 讀客訴信（3 題）、t5 聽對話答題（3 題）、t6 聽力填空和段落填空、t7 聽獨白答題（2 題）、t8 打字拼字（倉庫與出貨的單字）和聽力填空。
- 閱讀素材（t4）：Mr. Grant 星期四寄給 Harbor Trading 的客訴 email，約 135 字，主旨「Complaint about my order」。內文：Dear Harbor Trading, I am writing to complain about my last order. I ordered 24 desk lamps on May 4, and they were due last Monday. I called your office on Wednesday, and the order eventually arrived on Thursday, three days late. When we opened the boxes, we discovered that six lamps were badly damaged and two more do not turn on. Some of the other boxes were slightly damaged too. I took pictures of everything and attached them to this email. I have been your customer for five years, and I am very disappointed. I have a big sale next weekend, so this is a real loss for my store. Please send a replacement by next Wednesday, or give me a refund for the eight lamps. 3 題問「他為什麼寫這封信」「總共有幾盞燈有問題」（6＋2，要自己加）「他希望公司怎麼做」。讀完後玩家問 Ms. Carter 怎麼補救，她決定讓客戶自己選換貨或全額退款，另外再送 a small gift（折價券這個字到 t5 才教）。
- 聽對話答題（t5）：星期五玩家打電話給 Mr. Grant 道歉。他說情況很糟（terrible）：六盞破掉，兩盞是 defective，根本不會亮，這是 poor service；玩家承認是公司的 fault，他說不怪玩家（I don't blame you），至少你們 admit 了。他 insist 要換貨，不要退款，而且要跟 original order 一樣的型號，因為下個週末的特賣要用；玩家再送他一張下次訂單九折的 coupon。3 題問「那兩盞燈是什麼問題」「Mr. Grant 選了什麼」「玩家另外給了他什麼」。condition 在採購那一站教的是「條件」，這裡是「狀態」，台詞要帶出新的意思（例如 Mr. Grant 先說 They arrived in terrible condition.）。
- 聽獨白答題（t7）：星期一週會開場，Ms. Carter 對全辦公室說的一段話（約 90 字）：上星期的 incident，Mr. Grant 的訂單晚了三天、八盞燈有問題；公司 investigated，發現事情是這樣 occurred 的：貨車拋錨，箱子裡又 a lack of 保護材料；我們 take this seriously，因為 customer satisfaction 最重要，這次沒有達到他的 expectations；她謝謝玩家 stayed calm、reacted quickly，outcome 是好的；以後玻璃製品的訂單，出貨前 Luis 會一箱一箱檢查。2 題問「燈為什麼會壞」「以後出貨會多做什麼」。聽完玩家說這禮拜會再追蹤（本任務的詞塊）。
- 請人確認：
  - 時間軸：星期一該到貨、星期三來電（t1～t3）、星期四到貨並寄客訴信（t4）、星期五回電補救（t5、t6）、補寄的貨兩三天到、下星期一週會（t7）、同一週追蹤回電（t8）；Mr. Grant 的特賣在「下個週末」，所以要求下星期三前補到。
  - customer 和 client 改在電話那一站教，這裡當已知字用。照審閱意見補進 angry（t1，和 upset 一起教，基本字先出現）、resolve（t3，resolve the issue）、assist（t6），另外補 advise（t6）、insist（t5）、recommendation（t8，Mr. Grant 問下一張訂單有沒有推薦的款式）。release 移到商展。
  - 同字根的字只留兩組：complain／complaint（t4）、satisfied（t8）／satisfaction（t7）。拿掉 defect（留 defective）、solve（留 solution 和 resolve）、apology（留 apologize）。沒排的近義字：faulty、settle、awful、totally、unhappy。
  - t7 的獨白是 Ms. Carter 在週會上的檢討，不是語音留言：lack、occur、incident、investigate、satisfaction 這些字放在主管講話裡最自然。
  - t2 的 call you right back 沒有改成 get back to you：那個說法這次指定由採購那一站教。apologize 只當單字教，台詞可以由玩家在後面補一句 I apologize for the delay.。
  - t3 的 assure 和第二幕教過的 promise 意思接近，assure 是客服、商業書信常見的說法（I assure you…），所以還是排了。
  - 圖示：要畫 2 個。coupon 畫成有虛線剪裁邊和剪刀記號的折價券（% 留給採購的 discount），不要和第一幕的 ticket（🎫）撞圖；apologize 畫成鞠躬道歉的人（🙇）。其餘 71 個字都是抽象字。

### 27 機場（`airport`）

- NPC：`coworker` 同事 Dan（t1、t3、t4、t6、t8；一起出差，他出差過很多次）、`airline_agent` 航空公司地勤（新角色；t2 報到櫃台、t5 登機門櫃台，同一個人）。t7 的獨白是 `announcer` 機場廣播（只有聲音）。
- 場景：六月的星期三，玩家第一次出差，和 Dan 搭國內線 482 班機（下午 1:10 起飛、3:05 抵達）去 Chicago 參加商展。兩人搭機場電車到航廈；在櫃台報到、託運行李、要兩個坐在一起的位子；過安檢時排錯隊、又找不到登機證；在登機門前讀 Ms. Carter 寄來的新版行程表；班機因為暴風雨延誤，去問地勤；邊等邊找東西吃；廣播說換登機門；最後登機入座，落地後要打給 Ms. Carter。

| 任務 | 標題           | 新詞塊（英文／中文）                                                                                                                                       | 新單字（英文／中文／排名）                                                                                                                                                                                                                                                                                                                                 | 文法                                                                   | 新題型 | 新項目數    |
| ---- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------ | ----------- |
| t1   | 第一次出差     | Do you travel for work a lot?／你常出差嗎？<br>Which terminal does our flight leave from?／我們的班機是從第幾航廈出發？                                    | train／列車；火車／N289<br>airport／機場／T5<br>travel／旅行；出遠門／N503<br>trip／（一趟）旅程（business trip 出差）／N825<br>fly／搭飛機；飛／N881<br>easily／輕鬆地；很容易／N969<br>flight／班機／N1219<br>terminal／航廈／T193                                                                                                                       | —                                                                      | —      | 10          |
| t2   | 櫃台報到       | Could we get two seats together, please?／可以幫我們排兩個坐在一起的位子嗎？<br>Is my suitcase over the weight limit?／我的行李箱有超重嗎？                | boarding pass／登機證／N741<br>luggage／行李／T37<br>agent／（航空公司的）地勤人員；櫃台人員／N992<br>suitcase／行李箱／T62<br>destination／目的地／T63<br>valid／有效的／T94<br>domestic／國內的／N1454<br>expire／到期；過期／T121<br>aisle／走道／T138                                                                                                  | —                                                                      | —      | 11          |
| t3   | 過安檢         | Sorry, I was looking for my boarding pass.／抱歉，我剛剛在找登機證。<br>We were standing in the wrong line the whole time.／我們從頭到尾都排錯隊了。       | security／安檢；安全檢查／N541<br>straight／直直地；直接／N1072<br>tourist／觀光客／N1486<br>anywhere／任何地方；到處（都找不到）／N1648<br>guard／警衛；安檢人員／N1677<br>pocket／口袋／N1865<br>crew／機組人員／N2095<br>wallet／皮夾／T328<br>belt／皮帶／N2622                                                                                        | 過去進行式（I was waiting in line. We were looking for gate 12.）      | —      | 11          |
| t4   | 讀新版行程表   | Is this the latest version of our itinerary?／這是我們最新版的行程表嗎？                                                                                   | rental／租用的（rental car 租車）／T41<br>possibility／可能性／N951<br>version／版本／N981<br>departure／出發；起飛／T113<br>itinerary／行程表／T146<br>shuttle／接駁車／T204<br>storm／暴風雨／N1999<br>arrival／抵達／N2058<br>airline／航空公司／N2602<br>unexpected／突發的；意想不到的／T589                                                          | —                                                                      | —      | 11          |
| t5   | 班機延誤       | Do you have a new departure time yet?／請問新的起飛時間出來了嗎？<br>Is it possible to catch an earlier flight?／有沒有可能改搭早一點的班機？              | ground／地面／N586<br>catch／趕上；搭上／N683<br>unclear／不清楚；還不確定／N887<br>weather／天氣／N1068<br>depart／出發；起飛／T76<br>plane／飛機／N1259<br>passenger／乘客／N1695<br>lounge／（機場）貴賓室；休息室／T267<br>gate／登機門／N2060                                                                                                         | —                                                                      | —      | 11          |
| t6   | 等登機         | Do we have time to eat before we board?／登機前我們還來得及吃點東西嗎？<br>Let's wait here until they post the new gate.／我們在這裡等到新的登機門公布吧。 | mile／英里／N777<br>except／除了……以外／N841<br>post／公布；張貼／N928<br>suddenly／突然／N997<br>announce／廣播；宣布／N1004<br>stretch／伸展（stretch my legs 起來走一走）／N1633<br>cloudy／多雲的；陰陰的／T181<br>abroad／在國外；到國外／N1883<br>frequent／頻繁的；常常的／N2409                                                                    | 時間子句 before / after / until（Wait here until they call your row.） | —      | 11          |
| t7   | 聽機場廣播     | Did they say gate thirteen or gate thirty?／他們剛剛是說 13 號還是 30 號登機門？                                                                           | attendant／服務員（flight attendant 空服員）／T52<br>opposite／對面的；另一邊的／N1373<br>baggage／行李（航空公司的說法）／T152<br>prohibit／禁止／T191<br>valuable／貴重的（valuables 貴重物品）／N1898<br>cabin／機艙／T304<br>announcement／廣播；公告／N2458<br>cooperation／合作；配合／N2606<br>unattended／沒人看管的／T431<br>safely／安全地／T585 | —                                                                      | —      | 11          |
| t8   | 登機入座       | Do you want the window seat or the aisle?／你想坐靠窗還是靠走道？<br>I'll call Ms. Carter as soon as we land.／我們一落地，我就打給 Ms. Carter。           | land／降落；落地／N497<br>distance／距離／N1145<br>exit／出口／T101<br>onto／到……上面／N1404<br>row／（座位的）排／N1602<br>pilot／機長；飛行員／N1796<br>smooth／平穩的；順利的／N2241<br>hurry／趕快；趕時間／N2683<br>overhead／頭頂上方的（座位上方的置物櫃）／T506                                                                                    | —                                                                      | —      | 11          |
| t9   | 角色扮演大挑戰 | —                                                                                                                                                          | —                                                                                                                                                                                                                                                                                                                                                          | —                                                                      | —      | 0（只複習） |

小計：14 個詞塊、73 個單字。

- 之後再出現的題型：t2 句子填空（混文法填空）、t4 閱讀（Ms. Carter 的行程更新 email，3 題）、t5 聽對話答題（3 題）、t6 聽力填空＋段落填空、t7 聽獨白答題（機場廣播，3 題）、t8 打字拼字（客戶服務那一站的單字）＋聽力填空。
- 閱讀素材（t4）：Ms. Carter 星期三早上寄給玩家和 Dan 的 email，主旨「New version of your itinerary」，110～130 字。大意：航空公司（airline）改了星期六晚上回程班機的時間，所以她寄新版行程表（itinerary），請兩人用這一版（version）；今天的出發（departure）時間不變，482 班機下午 1:10 起飛，3:05 抵達（arrival）Chicago；下午 Chicago 附近有暴風雨（storm），班機有延誤（delay，採購那一站教過）的可能（possibility），有突發（unexpected）狀況就打給她；到了以後不用租車（rental car），飯店的接駁車（shuttle）每 30 分鐘一班，可以很輕鬆（easily）地到飯店；最後祝兩人一路順利。3 題問「Ms. Carter 為什麼寫這封信」（寄新版行程表）、「什麼可能造成延誤」（暴風雨）、「兩人要怎麼去飯店」（搭飯店接駁車）。
- 聽對話答題（t5）：登機門櫃台，螢幕上寫著 DELAYED。地勤說飛機（plane）因為天氣（weather）還停在 Chicago 機場的地面（on the ground）上，確切時間還不確定（unclear），希望 2:30 可以起飛（depart）；更早的那一班已經客滿，沒辦法再加乘客（passengers）；Dan 問能不能去貴賓室（lounge）等，地勤說貴賓室只開放給會員，建議兩人到登機門（gate）旁邊的咖啡店坐，不要走太遠。3 題問「班機為什麼延誤」、「新的起飛時間大約幾點」、「地勤建議他們去哪裡等」。
- 聽獨白答題（t7）：機場廣播（announcer）：往 Chicago 的 482 班機改到 30 號登機門（不是 13 號），在航廈的另一邊（opposite side）；2:00 開始登機，從第一組開始（這裡用 group，row 到 t8 才教）；機艙（cabin）空間有限，每人只能帶一件隨身行李，空服員（flight attendants）會協助；貴重物品（valuables）請隨身帶著，不要把行李（baggage）放著沒人看管（unattended）；航廈內禁止（prohibited）吸菸；最後謝謝大家的配合（cooperation），讓班機可以安全（safely）準時起飛。3 題問「班機改到哪一個登機門」（考 thirteen / thirty）、「幾點開始登機」、「廣播請乘客不要做什麼」。
- 請人確認：
  - 行程照第二輪的決定：星期三搭國內線 482 班機（1:10 起飛、3:05 抵達）到 Chicago，所以不教 customs、immigration、visa、declare、transit。
  - 第二輪的字：agent（地勤的職稱）和 expire（和 valid 一起，看證件時用）加到 t2，row 加到 t8（找座位）；resource、delay 移到前面的地點，這裡當學過的字用；altogether 依審閱意見拿掉。為了讓每個任務的字數不變，airline、rental 移到 t4（email 裡本來就有 the airline 和 rental car），passenger 移到 t5。
  - 另外加的字只有 land（從備用字表拿的，N497）：講搭飛機一定要有「落地」，t8 的詞塊也靠它。
  - boarding pass 是兩個字的詞條，board 和 pass 都是學過的字，但「登機證」是新的意思；排名先寫 board 的 N741。
  - luggage（t2，自己平常說的）和 baggage（t7，航空公司廣播和標示用的）、travel 和 trip 都是刻意放在一起對照的。同一個字的動詞和名詞只有 depart／departure、announce／announcement 兩組。
  - weather 到這一站 t5 才教，前面地點的閒聊台詞不能用這個字。
  - t5、t6 的單字平均排名比 t3、t4 低（比較簡單），因為必教的常用字（ground、catch、unclear、except、post）劇情上只能放在延誤和等登機這兩段；t6 的 mile、cloudy、abroad 是等登機時和 Dan 閒聊用的（Chicago 多遠、外面還陰陰的、Dan 以前出國參展）。
  - overhead 教的是 overhead bin 的 overhead；前面的地點沒有教 bin，台詞就說「the overhead」。
  - t8 的 I'll call Ms. Carter as soon as we land. 用了電話那一站 t6 教過的 as soon as，算複習（審閱也說保留）。
  - 圖示：要畫的有 10 個字：train（一節電車的車頭，不要畫月台，和第一幕的 station 分開）、suitcase、wallet、belt（皮帶）、plane、storm（烏雲加閃電，和第一幕的 rain 分開）、prohibit（紅色禁止標誌）、announcement（擴音器）、exit（綠底跑步小人的出口標誌）、pilot（戴機長帽的人）。pocket、shuttle 依審閱意見改成抽象；luggage、boarding pass、gate、airport 也是抽象，因為小圖會和 suitcase、ticket、door 撞圖。

### 28 飯店（`hotel`）

- NPC：`hotel_clerk` 飯店櫃台人員（新角色；t1～t3、t6～t8）、`coworker` 同事 Dan（t4、t5；一起出差）。t7 的獨白是 `manager` Ms. Carter 留在房間電話裡的語音留言（只有聲音，沿用她的聲線）。
- 場景：六月，和 Dan 一起到芝加哥（Chicago）參加商展。星期三下午下飛機後到飯店，用公司名字辦入住（訂了星期三到星期五三個晚上）、問早餐和設施；房卡刷不開、房間也給錯；看房間裡的住房須知；晚上和 Dan 出去吃東西；回來後熨斗壞了、把襯衫送洗；櫃台說外出時有人來電，是 Ms. Carter 的留言，要兩人多住一晚；星期日早上退房、拿收據回去報帳、寄放行李。商展在星期四到星期六，這一站的台詞不交代商展的經過（商展是下一站）。

| 任務 | 標題               | 新詞塊（英文／中文）                                                                                                                                                               | 新單字（英文／中文／排名）                                                                                                                                                                                                                                                                                                            | 文法                                                        | 新題型 | 新項目數    |
| ---- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------ | ----------- |
| t1   | 辦理入住           | Hi, I have a reservation under Harbor Trading.／你好，我有訂房，是用 Harbor Trading 的名字訂的。<br>We booked two single rooms for three nights.／我們訂了兩間單人房，住三個晚上。 | reservation／訂房；預約／T7<br>single／單人的／N557<br>hotel／飯店／N759<br>advance／事先（in advance）／N844<br>reception／櫃台；接待處／T46<br>agency／代理機構（travel agency 旅行社）／N970<br>double／雙人的／N1096<br>reserve／預訂；保留／N1688                                                                                | —                                                           | —      | 10          |
| t2   | 早餐和設施         | Is breakfast included in the room rate?／房價有含早餐嗎？<br>How late is the pool open?／游泳池開到幾點？                                                                          | private／私人的；專用的／N648<br>television／電視／N795<br>bar／酒吧／N837<br>central／市中心的；中央的／N891<br>daily／每天的／N955<br>convenient／方便的／T54<br>pool／游泳池／N1336<br>gym／健身房／T160<br>bathroom／浴室；廁所／T282                                                                                             | —                                                           | —      | 11          |
| t3   | 房間有問題         | Sorry, but this isn't the room I booked.／不好意思，這跟我訂的房間不一樣。<br>The key card you gave me doesn't work.／你給我的房卡刷不開。                                         | extra／多的；額外的／N1058<br>upgrade／升等／T80<br>lock／鎖／N1604<br>suite／套房／T261<br>dirty／髒的／N2255<br>shower／淋浴；蓮蓬頭／N2352<br>air conditioner／冷氣機／T352<br>spacious／寬敞的／T399<br>towel／毛巾／T430                                                                                                         | 關係子句省略 that（the room I booked, the card I used）     | —      | 11          |
| t4   | 讀住房須知         | Breakfast is downstairs from six thirty to ten.／早餐在樓下，六點半到十點。                                                                                                        | network／網路／N847<br>dine／用餐／T83<br>closet／衣櫃／T118<br>complimentary／免費附贈的／T231<br>midnight／半夜十二點／T233<br>wireless／無線的／T410<br>laundry／送洗的衣物；洗衣／T420<br>unlimited／不限量的／T512<br>downstairs／在樓下／T545<br>upstairs／在樓上／T557                                                         | —                                                           | —      | 11          |
| t5   | 和 Dan 碰面        | The internet connection in my room is really slow.／我房間的網路超慢。<br>Do you want to get a bite to eat?／要不要去吃點東西？                                                    | ride／搭車；便車／N1050<br>comfortable／舒服的／N1384<br>relax／放鬆／N1485<br>wake／醒來／N1508<br>hungry／餓的／T135<br>nearby／附近的／N1895<br>mess／一團亂／N2382<br>hopefully／希望；但願／N2615<br>bite／一口；簡單吃點東西／N2663                                                                                             | —                                                           | —      | 11          |
| t6   | 熨斗壞了、送洗襯衫 | The iron stopped working while I was using it.／熨斗用到一半就壞了。<br>Could I get this shirt back by tomorrow morning?／這件襯衫明天早上以前可以拿回來嗎？                       | dry／乾的；弄乾／N1135<br>wash／洗／N1368<br>knock／敲（門）／N1814<br>spare／備用的／N2126<br>iron／熨斗／N2259<br>button／按鈕（the power button 電源鍵）／N2285<br>housekeeper／房務人員／T344<br>electric／用電的；電的／N2420<br>automatically／自動地／N2521<br>basket／籃子／T541                                              | while / when＋過去進行式（Someone called while I was out.） | —      | 12          |
| t7   | 主管的留言         | Could we extend our stay by one more night?／我們可以多住一晚嗎？                                                                                                                  | extend／延長／N950<br>fully／完全地（fully booked 客滿）／N1178<br>expense／費用；開銷／N1531<br>accommodation／住宿；住的地方／N1903<br>approval／批准；同意／N2302<br>roughly／大約／N2450<br>reimburse／（公司）歸還代墊的錢；核銷／T375<br>cancellation／取消（的訂房）／T380<br>exceed／超過／N2508<br>inexpensive／不貴的／T483 | —                                                           | —      | 11          |
| t8   | 退房和收據         | I need a receipt for my expense report.／我需要收據報帳。<br>Can we leave our bags here for a few hours?／我們的行李可以先寄放幾個小時嗎？                                         | overnight／過夜的；住一晚的／T174<br>accommodate／配合（需求）；容納／T217<br>beside／在……旁邊／N2115<br>voucher／兌換券；優惠券／T315<br>summary／明細；摘要／N2318<br>vacancy／空房／T339<br>preference／偏好；喜好／N2383<br>hourly／每小時一次的／T419<br>bell／鈴／N2691<br>checkout／退房（時間）／T665                         | —                                                           | —      | 12          |
| t9   | 角色扮演大挑戰     | —                                                                                                                                                                                  | —                                                                                                                                                                                                                                                                                                                                     | —                                                           | —      | 0（只複習） |

小計：14 個詞塊、75 個單字。

- 之後再出現的題型：t2 句子填空（混文法填空）、t4 讀住房須知（3 題）、t5 聽對話答題（3 題）、t6 聽力填空和段落填空、t7 聽獨白答題（語音留言，3 題）、t8 打字拼字（考機場教過的字）和聽力填空。
- 閱讀素材（t4）：房間桌上的住房須知卡（飯店寫給房客），110～130 字，分四小段。Wi-Fi：complimentary、unlimited，選 wireless network「Central-Guest」，密碼是房號加姓氏。Breakfast：complimentary，每天 6:30～10:00 在樓下（downstairs）的餐廳；晚上也可以在那裡用餐（dine）到 9:30，酒吧開到 midnight。Laundry：把要洗的衣服裝進衣櫃（closet）裡的洗衣袋，早上 9 點前拿到 reception，當天晚上送回。Pool and gym：在樓上（upstairs）八樓，每天 6:00 到晚上 10:00，多的毛巾（extra towels）在衣櫃裡。只用到 t4 為止教過的字。3 題問「Wi-Fi 密碼是什麼」、「送洗的衣服最晚幾點要拿到櫃台」、「哪一個地方開到最晚」。讀完後 Dan 打房間電話來問早餐，玩家用詞塊回答。
- 聽對話答題（t5）：星期三傍晚，玩家和 Dan 在大廳碰面。Dan 說他的房間很舒服（comfortable），只是行李一打開就一團亂（a mess），而且他餓了（hungry）；兩人決定不去飯店的酒吧，改去附近（nearby）一家小店吃點東西（a bite），吃完早點回來放鬆（relax）；明天七點起床（wake up），八點四十五分在大廳集合，搭飯店的接駁車（get a ride）去會場（商展十點開始），Dan 說 Hopefully the traffic is okay。3 題問「他們要去哪裡吃」、「明天幾點在大廳集合」、「他們怎麼去會場」。
- 聽獨白答題（t7）：星期三晚上兩人吃完回來，櫃台說外出時有人來電（Someone called while you were out.），玩家聽房間電話裡 Ms. Carter 的語音留言，約 90～110 字：Mr. Hughes 會飛來看商展，想在星期六商展結束後請兩人吃晚餐，所以請他們多住一晚（extend your stay）、星期日再飛回來；多出來的費用（the extra expense）她已經批准（approval）；飯店網站上星期六顯示客滿（fully booked），請到櫃台問有沒有人取消（a cancellation），沒有的話就在附近找不貴的住宿（inexpensive accommodation）；收據都要留著，回來後 Ms. Reed 會把代墊的錢還給他們（reimburse）；餐費一天大約（roughly）不要超過（exceed）六十元。3 題問「Ms. Carter 為什麼要他們多住一晚」、「飯店星期六沒有房間的話要怎麼做」、「餐費一天的上限大約是多少」。聽完後玩家到櫃台用詞塊問能不能多住一晚。
- 請人確認：
  - t7 的獨白用 Ms. Carter 的語音留言（不是 `announcer`），所以這一站會多用到她的聲線。留言內容照第二輪定案：Mr. Hughes 星期六的晚餐、多住一晚、星期日飛回；報帳找 Ms. Reed（公司沒有會計）。
  - reception：美國人口語說 front desk，櫃台人員的台詞請說 front desk；Reception 是櫃台上方牌子的字，住房須知卡上也用這個字。
  - agency、private、central、daily、advance 這幾個必教字沒有放進詞塊，只當單字教（櫃台台詞：booked through a travel agency、paid in advance、a private bathroom、a central location、open daily），因為客人自己不太會說這幾句。
  - t3 的四個狀況請寫成一段：房卡刷不開（lock）→ 進去發現是別人住過還沒整理的雙人房（dirty towels in the shower）、冷氣也不動（air conditioner）→ 櫃台道歉，免費（no extra charge）升等到比較寬敞的套房（upgrade、suite、spacious）。
  - t6 的 button 指熨斗的電源鍵，台詞請說 the power button，不要和襯衫的鈕扣混在一起。文法例句 Someone called while I was out. 放在櫃台的台詞（Someone called while you were out.），接到 t7 的留言；玩家的詞塊是 The iron stopped working while I was using it.。
  - t8 是星期日早上退房，在商展之後，但玩家會先玩這一站再玩商展，台詞不要說商展的結果。櫃台沒人，玩家按鈴（bell）；櫃台說 checkout 到中午、給一張費用明細（a summary of the charges）、問收據要紙本還是 email（Do you have a preference?）、因為第一天的房間問題送一張免費住一晚的兌換券（a voucher for a free overnight stay）、行李可以放在櫃台旁邊（beside the desk；We can accommodate that.）、機場接駁車每小時一班（hourly）、明年商展那一週通常沒有空房（vacancy），要早點訂。
  - 第二輪拿掉的字：subsequent、occupancy、regularly（審稿意見：退房時不會說）、clothing（和學過的 clothes 重複）。cancel、connection 已改到前面的地點教，這裡當學過的字用。
  - 同一字族留兩組：reserve／reservation、accommodate／accommodation（上限兩組）；cancellation 的 cancel 在會議那一站教。
  - 圖示：要畫的有 13 個（hotel、bar、pool、gym、bathroom、lock、shower、towel、air conditioner、wireless、laundry、iron、bell）。hotel 要畫出床或 H 招牌，和 office、bank、hospital 的建築分開；wireless 畫成 Wi-Fi 的扇形符號（代號 📡），要和電話那一站的 signal 分開；bell 畫成櫃台上的按鈴，但造型要和第一幕 counter 的 🛎️ 分開（代號 🔔）；air conditioner 畫成牆上的冷氣機（代號 🌬️）；towel、iron、laundry 沒有完全對應的 emoji，用 🧖、👕、🫧 代替，圖要畫成毛巾、熨斗、洗衣機。button、housekeeper 改成抽象；television（和 screen 撞圖）、basket（和 picnic 撞圖）、voucher（和 ticket 撞圖）、closet（沒有合適的 emoji）維持抽象。
  - 單字的平均排名在 t5（和 Dan 聊天）比 t4 低一點，因為聊天的字本來就比較常用；t6 之後又往上。

### 29 商展（`trade_fair`）

- NPC：`coworker` 同事 Dan（t1、t4、t7；開展前一起佈置攤位、交代重點，之後一起顧攤）、`client` 客戶 Mr. Hughes（t2、t3、t5、t6、t8；James Hughes，英國 Hughes Home and Garden 的人，英國口音；電話那一站只聽過聲音，這裡第一次見到本人）；t7 的展場廣播用 `announcer`。
- 場景：六月，同一趟出差的重頭戲：芝加哥的國際居家與辦公用品展，星期四到星期六三天。星期四開展前，玩家和 Dan 佈置 Harbor Trading 的攤位（檯燈和桌上配件）；第一位走過來的訪客玩家不認識，照 Dan 教的招呼他，他看了看就先離開；過一會他回來遞名片，原來就是 Mr. Hughes，兩人第一次見到本人，他問新款和別家差在哪；讀展覽簡介；介紹五月剛上市的新系列、給樣品和目錄、交換名片；約他展覽期間來看示範；聽閉館前的廣播（最佳攤位比賽）；星期六 Mr. Hughes 回來下單，玩家記下訂單、答應星期一一早寄確認信（星期六晚上他請兩人吃飯，接飯店那一站的留言）。

| 任務 | 標題                 | 新詞塊（英文／中文）                                                                                                                                                                      | 新單字（英文／中文／排名）                                                                                                                                                                                                                                                                                                               | 文法                                                                              | 新題型 | 新項目數    |
| ---- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------ | ----------- |
| t1   | 佈置攤位             | Where should I put the brochures and samples?／簡介和樣品要放哪裡？<br>Does the display look okay from the front?／從正面看，這樣擺還可以嗎？                                             | model／型號；款／N485<br>trade／貿易／N544<br>aim／目的；想達成的事／N794<br>brochure／簡介手冊／T20<br>display／陳列；展示／N1109<br>merchandise／商品（總稱）／T71<br>logo／商標；標誌／T177<br>booth／攤位／T702<br>greet／打招呼；迎接／N2614                                                                                        | —                                                                                 | —      | 11          |
| t2   | 招呼第一位訪客       | Hi, are you looking for anything in particular today?／您好，今天有特別想找什麼嗎？<br>Thanks for stopping by, and enjoy the rest of the fair!／謝謝您來參觀，祝您逛展愉快！              | market／市場／N219<br>represent／代表／N658<br>image／圖片；影像／N704<br>visitor／訪客；來參觀的人／N1398<br>representative／（業務）代表／N1471<br>shake／握（手）／N1474<br>brand／品牌／N1549<br>retail／零售／N2037<br>nervous／緊張的／N2078<br>confident／有自信的／N2218                                                         | —                                                                                 | —      | 12          |
| t3   | 見到 Mr. Hughes 本人 | It's so nice to finally meet you in person.／終於見到您本人了，真高興。<br>The main difference is the quality of the material.／主要差在用料的品質。                                      | difference／差別／N473<br>quality／品質／N517<br>feature／特色；功能／N635<br>popular／受歡迎的／N790<br>modern／現代的；新式的／N808<br>successful／成功的／N872<br>competition／競爭；比賽／N875<br>outdated／過時的／T446<br>competitive／有競爭力的／N1824<br>competitor／競爭對手／N2213                                            | 詞性：名詞和形容詞（safe / safety, success / successful, different / difference） | —      | 12          |
| t4   | 讀展覽簡介           | There are companies here from all over the world.／這裡有來自世界各地的公司。                                                                                                             | world／世界／N156<br>industry／產業；業界／N530<br>international／國際的／N662<br>region／地區／N677<br>wide／廣的；範圍大的／N753<br>variety／各式各樣；多樣／N954<br>million／百萬／S<br>guide／指南；導覽手冊／N1146<br>attract／吸引／N1298<br>exhibition／展覽／N1803                                                               | —                                                                                 | —      | 11          |
| t5   | 介紹新系列、交換名片 | We have a wide range of styles and sizes.／我們的款式和尺寸選擇很多。<br>Let me give you one of my business cards.／我給您一張我的名片。                                                  | design／設計／N441<br>draw／畫／N481<br>range／（產品）系列；範圍／N516<br>release／推出；上市／N786<br>style／風格；樣式／N865<br>pattern／圖案；花樣／N883<br>shape／形狀／N986<br>designer／設計師／N2178<br>catalog／產品目錄／N2651<br>accessory／配件／T539                                                                        | —                                                                                 | —      | 12          |
| t6   | 約他來看示範         | We're giving a demonstration every afternoon during the fair.／展覽期間我們每天下午都有示範。<br>Feel free to come back anytime over the next three days.／接下來這三天，歡迎隨時再過來。 | develop／開發；研發／N350<br>preview／搶先看；預覽／T51<br>video／影片／N1065<br>powerful／強的；很有力的／N1300<br>engineer／工程師／N1312<br>unique／獨一無二的；獨特的／N1594<br>demonstration／示範／N2169<br>digital／數位的／N2309<br>translate／翻譯／N2310<br>efficiently／有效率地／T366                                        | 期間的介系詞 for / during / over（during the fair, over the next three days）     | —      | 12          |
| t7   | 展場廣播             | I think our display is the most creative one here.／我覺得我們的陳列是全場最有創意的。                                                                                                    | photograph／照片／N1182<br>participant／參加的人／N1650<br>enormous／非常大的；非常多的／N1780<br>worldwide／在全世界／T253<br>convention／大型會議；會展／N1957<br>creative／有創意的／N2209<br>impress／讓人印象深刻／N2243<br>yearly／一年一次的／T411<br>excitement／興奮；熱鬧的氣氛／N2741<br>enthusiastic／熱情的；很投入的／T521 | —                                                                                 | —      | 11          |
| t8   | 接下訂單             | Just to confirm, that's two hundred of the new model?／跟您確認一下，是新款兩百個嗎？<br>I'll email you the confirmation first thing Monday morning.／我星期一一早就把確認信寄給您。      | advantage／優勢；優點／N773<br>target／目標（要達到的數字）／N797<br>potential／有潛力的；可能的／N830<br>partner／合作夥伴／N1136<br>typical／一般的；典型的／N1536<br>ideal／理想的；最適合的／N1674<br>persuade／說服／N2091<br>showroom／展示間／T376<br>reliable／可靠的／N2512<br>costly／花費很高的／T461                         | —                                                                                 | —      | 12          |
| t9   | 角色扮演大挑戰       | —                                                                                                                                                                                         | —                                                                                                                                                                                                                                                                                                                                        | —                                                                                 | —      | 0（只複習） |

小計：14 個詞塊、79 個單字。

- 之後再出現的題型：t2 句子填空（混文法填空）、t4 讀展覽簡介（3 題）、t5 聽對話答題（3 題）、t6 聽力填空＋段落填空、t7 聽獨白答題（展場廣播，3 題）、t8 打字拼字（飯店那一站的單字）＋聽力填空。
- 閱讀素材（t4）：主辦單位發的展覽簡介（Dan 在攤位上遞給玩家的那一張），約 130 字。大意：Welcome to the International Home and Office Fair at the Chicago Convention Center. Every year this exhibition attracts more than 20,000 visitors, and it is one of the biggest in the industry. This year 320 companies from 28 countries are here with a wide variety of products for the home and the office. Area A: companies from North America（Harbor Trading 在 A14）. Area B: companies from the Asia region. Area C: companies from Europe. Thursday is for business visitors only (10 to 6); Friday and Saturday are open to everyone (9 to 5). The information desk in Area A opens one hour before the fair each day; ask there for a free guide with a map of every booth. Every afternoon at two, companies show their newest products in Area C. Last year visitors ordered products worth more than twelve million dollars. 3 題：星期四誰可以進場（只有業界訪客）、亞洲地區的公司在哪一區（Area B）、哪裡可以拿到免費的導覽手冊（Area A 的服務台）。只用到 t4 為止教過的字：Convention Center 只出現在場館名稱裡（convention 到 t7 才教），示範那一行寫成 show their newest products（demonstration 到 t6 才教），場地一律說 area。
- 聽對話答題（t5）：星期四下午，Mr. Hughes 看新系列：玩家說這個系列五月才推出（We released this range in May），是台灣設計、台灣製造；他很喜歡這個設計（design），問設計師（designer）是誰；玩家說是台灣的設計師，每個圖案（pattern）都是她親手畫的（draws every pattern by hand）；新系列的檯燈有三種形狀（shape），還有同系列的桌上配件（accessory）；Mr. Hughes 拿了兩個樣品，說想帶一本目錄（catalog）回去給英國的同事看，最後兩人交換名片。3 題：新系列是什麼時候推出的（五月）、圖案是誰畫的（台灣的設計師）、Mr. Hughes 要帶什麼回去給同事看（目錄）。
- 聽獨白答題（t7）：`announcer` 星期四閉館前的展場廣播，約 80 字：謝謝大家這麼熱情（such enthusiastic visitors），第一天人非常多（an enormous first day），現場的氣氛（excitement）很棒；今年的參展品牌有很多是全世界都買得到的（sold worldwide）；有四十家公司參加（forty participants）一年一次（yearly）的「最有創意攤位」比賽（competition，t3 教過）；訪客只要幫最讓自己印象深刻的攤位（the booth that impressed you most）拍一張照片（take a photograph），拿到服務台給工作人員看，就算選了那個攤位；結果明天中午會出現在大螢幕上；會展中心（the convention center）今天六點關門，明天九點開門。3 題：比賽比的是什麼（最有創意的攤位）、訪客要怎麼選（拍照拿到服務台）、今天幾點關門（六點）。廣播不用 vote、win、prize、hall（都是公司活動那一站才教的字），改說 choose、the best booth、area。
- 請人確認：
  - 故事照第二輪的決定：展覽在芝加哥，星期四（10 到 6，只開放業界）到星期六（9 到 5）；Mr. Hughes 星期四來攤位（t2、t3、t5、t6）、星期六下單（t8），他的貨照舊走海運（t8 的 costly：空運太貴）。產品是檯燈和桌上配件，新系列是台灣設計製造。Mr. Hughes 可以說一次 your stand（英式說法，不佔單字）。
  - t2 改成 Mr. Hughes 第一次走過來：玩家不認得他，把他當陌生訪客招呼；他只說自己在英國做零售（retail）、先四處看看，玩家說 Thanks for stopping by…；t3 他回來遞名片，It's so nice to finally meet you in person. 才有力道。台詞要讓他在 t2 結尾先離開攤位。
  - t3 的文法是名詞和形容詞：詞塊只有名詞（difference、quality），台詞要把 different、safe / safety（safe 現在是倉庫那一站的字）、success / successful、competition / competitive 成對放在旁邊。competition、competitive、competitor 三個字因此集中在 t3（Mr. Hughes 問和別家差在哪）；t7 的「比賽」是同一個字的第二個意思，廣播裡要讓人聽得出來。
  - 第二輪拿掉 3 個第一輪的字：compete、demonstrate、exhibit（同一家族的第二個字，每站最多兩組；留下 represent / representative、design / designer）。product、sell、sample、visit、safe 移到前面的地點，這裡當已知字用。
  - 多加 1 個字：booth（T702，哪一份候選字表都沒有，但整個場景就在攤位上）。
  - t6 的 engineer、develop、translate 要有一句交代：Our engineer in Taiwan developed it, and I translated the manual.（manual 是辦公室那一站的字）。
  - catalog 是美式拼法（英式是 catalogue），只當單字教、不放進玩家的詞塊；t5 的詞塊也因此用 styles and sizes，不用 colors（color／colour）。
  - aim 和 target 都是必教字、意思相近，所以分開放：aim 在 t1（Dan 說這次參展的目的），target 在 t8（Mr. Hughes 說他們明年要達到的數字），中文也分開寫。merchandise 是 product 的總稱說法（不可數），台詞要用成 our merchandise。
  - 單字難度：t3、t4 的平均排名比 t1、t2 低，因為文法字（difference、quality、popular、successful）和 t4 的必教字（world、industry、international、region）都是常用字；t1 被 booth、greet 兩個場景少不了的字拉高。
  - draw 教的是「畫」（設計師親手畫圖案）；「吸引」用 attract（t4）。
  - 圖示：8 個字要畫像素圖：booth 🎪（攤位）、brochure 📃（一定要畫成三折的簡介，和第一幕的 notice 📄 分開）、greet 👋、shake 🤝（握手）、world 🌍（地球）、attract 🧲（磁鐵）、video ▶️（播放鍵的螢幕）、target 🎯（靶心）。catalog 改成抽象（會是第三個像書的圖示）。
  - 請英文好的人確認：Does the display look okay from the front?、We're giving a demonstration every afternoon during the fair.、Just to confirm, that's two hundred of the new model? 是否像真的展場對話。

### 30 公司活動（`company_event`）

- NPC：`manager` 主管 Ms. Carter（t1、t4、t8）、`coworker` 同事 Dan（t2、t3、t5、t6）；t7 的獨白是 `director` 總經理 Mr. Ellis 的致詞（只有他一個人說話，不算對話角色）。
- 場景：十一月，玩家進公司滿一年，Harbor Trading 也剛好滿二十年，要辦二十週年派對。Ms. Carter 把籌辦工作交給玩家，Dan 幫忙：找場地、訂外燴、看邀請函草稿並寄出；派對當天下午佈置會場、測麥克風和喇叭，晚上顧餐點和流程；Mr. Ellis 上台致詞，把年度最佳員工獎頒給玩家；最後 Ms. Carter 恭喜玩家，暗示明年想讓玩家多負責一些事（接第四幕）。來賓約八十人（辦公室六個人和倉庫同事、家人、幾位客戶和廠商）。當晚流程固定為：5:00 外燴送到、6:00 開場、6:30 自助式餐點、8:00 致詞和頒獎、8:30 樂團和抽獎。

| 任務 | 標題           | 新詞塊（英文／中文）                                                                                                                                                             | 新單字（英文／中文／排名）                                                                                                                                                                                                                                                                                           | 文法                       | 新題型 | 新項目數    |
| ---- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ------ | ----------- |
| t1   | 週年派對交給你 | Do you have a date in mind for the party?／派對的日期您有想法了嗎？<br>How many people do you expect to attend?／您估計會有多少人參加？                                          | social／社交的；聯誼的／N381<br>activity／活動／N432<br>leader／負責人；領導者／N596<br>surprise／驚喜／N634<br>organize／籌辦；安排／N824<br>occasion／（特別的）場合／N1444<br>theme／主題／N1572<br>anniversary／週年（紀念）／T288<br>celebration／慶祝活動；慶祝會／N2477                                       | —                          | —      | 11          |
| t2   | 找場地         | We need a venue that holds about eighty people.／我們要找一個能容納八十人左右的場地。<br>Does the hall have a stage for the speeches?／那個宴會廳有可以致詞的舞台嗎？            | round／圓的／N519<br>stage／舞台／N551<br>speech／致詞；演講／N894<br>outdoor／戶外的／T61<br>perfect／完美的；最合適的／N1111<br>location／位置；地點／N1365<br>banquet／宴會／T117<br>hall／禮堂；宴會廳／N1480<br>venue／（活動）場地／T175<br>fancy／高級的；花俏的／N2532                                       | —                          | —      | 12          |
| t3   | 訂外燴         | The food is delivered at five and served at six thirty.／餐點五點送到，六點半開始供應。<br>Are there any dishes for guests who don't eat meat?／有沒有不吃肉的來賓也能吃的菜？   | serve／供應（餐點）；上菜／N534<br>chef／主廚；廚師／T44<br>traditional／傳統的／N993<br>taste／試吃；味道／N1413<br>beverage／飲料／T134<br>ingredient／食材／T144<br>dish／（一道）菜／N1882<br>buffet／自助式餐點（Buffet）／T289<br>vegetarian／素食的；吃素的人／T377<br>caterer／外燴業者／T439                | 混合複習：被動式＋關係子句 | —      | 12          |
| t4   | 讀邀請函       | I'll send out the invitations before I leave today.／我今天下班前會把邀請函寄出去。                                                                                              | win／贏得；抽中／N377<br>recognize／表揚；肯定／N733<br>band／樂團／N1087<br>host／主持；主持人／N1327<br>award／獎；獎項／N1341<br>lucky／幸運的／N1866<br>prize／獎品／N2005<br>entertainment／餘興節目；表演／N2034<br>invitation／邀請函／N2194<br>ceremony／典禮／N2517                                         | —                          | —      | 11          |
| t5   | 派對前的佈置   | Could you help me decorate the stage this afternoon?／今天下午可以幫我佈置一下舞台嗎？<br>Let me make sure the microphone is working.／我確認一下麥克風有沒有聲音。              | story／故事／N306<br>memory／回憶／N939<br>excellent／非常好的；很棒的／N1163<br>crowd／人群／N1187<br>speaker／喇叭；音響／N1241<br>tonight／今晚／N1414<br>photographer／攝影師／T182<br>bowl／碗／N2291<br>decorate／佈置；裝飾／T362<br>microphone／麥克風／T395                                                 | —                          | —      | 12          |
| t6   | 派對開始       | If we run out of food, I'll let the caterer know.／如果菜不夠了，我會跟外燴業者說。<br>Let's take a group photo before everyone goes home.／趁大家還沒回家，我們來拍張大合照吧。 | laugh／笑／N620<br>treat／請客；招待／N804<br>wonderful／美好的；令人開心的／N1076<br>funny／好笑的／N1237<br>pleasure／愉快；樂意／N1283<br>joke／笑話／N1719<br>pour／倒（飲料）／N2135<br>musician／樂手；音樂家／N2350<br>generous／大方的；慷慨的／T369<br>guitar／吉他／N2589                                  | 混合複習：條件句＋時間子句 | —      | 12          |
| t7   | 總經理致詞     | I really wasn't expecting this, but thank you so much!／我真的完全沒想到，非常謝謝大家！                                                                                         | relationship／（合作）關係／N502<br>imagine／想像／N924<br>dream／夢想／N966<br>contribution／貢獻／N1273<br>succeed／成功／N1586<br>honor／榮幸；榮譽／N1625<br>outstanding／傑出的／T167<br>truly／真的；由衷地／N1825<br>impressive／令人佩服的；出色的／N2421<br>dedicated／盡心盡力的；投入的／N2449            | —                          | —      | 11          |
| t8   | 得獎與新的開始 | Thank you for encouraging me all year.／謝謝您這一整年一直鼓勵我。<br>I'd love to take on more responsibility next year.／明年我很樂意多負責一些事情。                           | achieve／達成；做到／N746<br>throughout／整個（期間）；從頭到尾／N897<br>encourage／鼓勵／N912<br>deserve／應得；值得／N1872<br>winner／得獎者；贏家／N1911<br>congratulations／恭喜／T310<br>admire／佩服；欣賞／N2347<br>embarrassed／不好意思的；尷尬的／N2464<br>praise／稱讚／N2473<br>pride／驕傲；自豪／N2563 | —                          | —      | 12          |
| t9   | 角色扮演大挑戰 | —                                                                                                                                                                                | —                                                                                                                                                                                                                                                                                                                    | —                          | —      | 0（只複習） |

小計：14 個詞塊、79 個單字。

- 之後再出現的題型：t2 句子填空（混文法填空）、t4 讀邀請函（3 題）、t5 聽對話答題（3 題）、t6 聽力填空＋段落填空、t7 聽獨白答題（3 題）、t8 打字拼字（商展的單字）＋聽力填空。
- 閱讀素材（t4）：Ms. Carter 寫好、請玩家寄出前先看一遍的派對邀請函 email，110～150 字。內容大意：Harbor Trading is twenty years old this month, and you are invited to our anniversary celebration. 星期六晚上六點到十點，地點 Lakeside Hall（venue）。流程表：6:00 Doors open, beverages are served／6:30 Buffet dinner (vegetarian dishes are available)／8:00 Award ceremony, hosted by Ms. Carter: Mr. Ellis will recognize the people who made this a great year／8:30 Entertainment: a live band and a prize drawing. If you are lucky, you could win a new laptop! 最後寫 Each employee may bring one guest. Please reply to this invitation by Friday so we can give the caterer the final number. 只用到 t1～t4 教過的字。3 題問「最晚什麼時候要回覆」、「八點有什麼活動」、「每位員工可以帶幾個人」。
- 聽對話答題（t5）：派對當天下午四點，Dan 和玩家在會場佈置。Dan 說攝影師（photographer）剛來電，會晚半小時、五點半才到；門口的板子貼了公司二十年來的舊照片（這裡說 pictures；twenty years of memories, and every picture tells a story）；每張圓桌要放一碗（bowl）點心；左邊的喇叭（speaker）沒聲音，換一條線之後聲音很好（The sound is excellent now.）；來賓今晚（tonight）六點到，Dan 擔心人一多（a big crowd）門口會塞住。3 題問「攝影師幾點到」、「門口的板子上是什麼」、「每張桌子上要放什麼」。
- 聽獨白答題（t7）：總經理 Mr. Ellis 在台上致詞，約 120～140 字。大意：Thank you all for coming tonight. Twenty years ago, Harbor Trading was two people in one small room. I had a dream, but I couldn't imagine a night like this. We succeeded because of the strong relationships we built with our clients, and because everyone in this room made a contribution. 接著說今晚要表揚一位一年前才加入、第一年就做得非常出色（an outstanding first year, truly impressive）、最投入（dedicated）的同事，It is my honor to give the Employee of the Year award to…，叫到玩家的名字。3 題問「公司剛開始是什麼樣子」、「他說公司成功的原因是什麼」、「這個獎頒給什麼樣的人」。玩家的詞塊是上台領獎時說的那一句。
- 請人確認：
  - 必教字全部排進去了，沒有略過的字，也沒有另外加字表外的字。attend（改到會議）和 row（改到機場）移走後，補上 celebration（t1）和 speaker（t5）；photo 不再佔 t5 的單字位置，改由 t6 的詞塊 Let's take a group photo 帶出來，空出來的位置給 excellent。所以 t5 的聽力裡舊照片要說 pictures，不說 photos。
  - 獎名依審閱意見改成 Employee of the Year（年度最佳員工）；派對在星期六晚上的 Lakeside Hall、約八十人，這兩個細節是我選的，改掉只影響 t2 第一句詞塊的 eighty 和閱讀內容。
  - t1 的 leader 用在「這次派對由你當負責人」，是活動負責人的意思，不是主管職。
  - 意思相近但刻意都教的字：venue（活動場地）和 location（位置）、award（公司頒的獎）和 prize（抽獎的獎品）、beverage（菜單和邀請函上的寫法）和已學過的 drink、pleasure（My pleasure.）和 honor（It is my honor…）。稱讚的形容詞有 perfect、excellent、wonderful、outstanding、impressive 五個，分散在 t2、t5、t6、t7，台詞要各用在不同的東西上（場地、音響、夜晚、表現）。
  - honor 的英式拼法是 honour；它只出現在 Mr. Ellis 的致詞，不在玩家的詞塊裡。
  - 抽獎在美式英文說 prize drawing（或 raffle），不說 lucky draw；閱讀裡用 prize drawing，lucky 用在 If you are lucky。
  - 三個字用句子裡實際出現的形式來教：dedicated（字表原形 dedicate）、embarrassed（embarrass）、congratulations（congratulation）。
  - t7 的詞塊沒有帶新單字（上台領獎的一句話）；t7 的 10 個單字都在致詞裡出現。t5～t7 有 story、laugh、funny、dream 這些常見字，平均排名比 t3、t4 低一點。
  - t8 第一句沒有照審閱建議改成 Thank you for all your support this past year.，因為和第二幕的 Thanks for all your help since I moved here. 是同一個句型；改成更口語的 Thank you for encouraging me all year.，throughout 只當 t8 的單字教。
  - 圖示：要畫像素圖的有 11 個字：chef、stage（有布幕的舞台）、location（地圖圖釘）、award（獎盃）、lucky（四葉草）、speaker（喇叭音響）、bowl（要畫空碗，避免和 soup 撞圖）、decorate（氣球）、microphone、guitar、winner（金牌，要和 award 的獎盃分清楚）。beverage、dish、prize、invitation、buffet、photo 都是抽象。

## 3. 請你決定的事

這些是排表時我先選了一個做法的地方。你不同意的話，改起來的範圍寫在後面。

| #   | 我先選的做法                                                                                                                                  | 如果要改                                                                                         |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 1   | 第三幕教 832 個單字、168 個詞塊（規格原本估 950 個單字、160 個詞塊）                                                                          | 要到 950 個，每個任務得多 1～2 個字，12 個地點都要重排                                           |
| 2   | 每個地點 9 個任務；t4（閱讀）和 t7（聽力）只教 1 個詞塊、多教 1 個單字                                                                        | 改成每個任務都 2 個詞塊：多 24 個詞塊，t4、t7 要補句子                                           |
| 3   | 公司賣桌燈和桌上用品；新廠商叫 Brightway；新系列是台灣設計製造                                                                                | 換產品只影響表格下面的說明和之後的台詞，詞塊都沒有提到產品                                       |
| 4   | 人名：人資 Ms. Reed、同事 Dan、前台 Kate、總經理 Mr. Ellis、倉管 Luis、廠商 Jack、顧客 Mr. Grant、客戶 James Hughes（Hughes Home and Garden） | 詞塊裡只出現 Ms. Carter（7 個）、Mr. Hughes（3 個）、Mr. Grant（2 個）；其他名字只影響說明和台詞 |
| 5   | 英國口音給客戶 Mr. Hughes（人在英國，貨走海運）；澳洲口音給廠商 Jack                                                                          | 換給別的角色不影響這份表，只影響聲線；Mr. Hughes 改成在美國的話倉庫 t8 要重排                    |
| 6   | 商展在芝加哥，國內線，所以沒教海關、入境、簽證                                                                                                | 改成出國：機場要重排，多教約 10 個字                                                             |
| 7   | 文法多加了過去進行式和「want／ask＋人＋to」（規格沒列）；however、although、despite 留到第四幕                                                | 不要多加的兩個：機場 t3、飯店 t6、辦公室 t6 換文法點，各改 1～2 個詞塊                           |
| 8   | 四種新題型都做，位置如第 1 節                                                                                                                 | 少做一種：那幾個任務改用已有的題型，不用重排                                                     |
| 9   | 93 個單字畫像素圖，9 個新角色要畫角色圖，12 個地點各一個場景（清單在第 6 節）                                                                 | 想少畫：辦公室裡的幾個地點可以共用場景；想多畫：把標成抽象的具體字改回來                         |
| 10  | TSL 只用前 600 名；字表外教了 voicemail、fragile                                                                                              | 不教這兩個的話各空出一個單字的位子                                                               |
| 11  | 日常生活的常用字（young、girl、boy、animal、film、foot 這類）因為和職場無關，第三幕沒有教                                                     | 想教：可以放進辦公室的閒聊或公司活動，每放一個要換掉一個字                                       |
| 12  | Email 那一站有 3 個詞塊是「邊打字邊唸出來」的信件句子（例如 I'm writing to ask about your order.）                                            | 不要的話換成對人說的句子，只動 Email 一個地點                                                    |

另外幾件事不在這份表裡，但做第三幕之前要定：

- **幕之間要不要鎖**：2026-11-24 已做好：前一幕每個任務都玩過一次，下一幕才打開（見 [ui-flow.md](ui-flow.md)）。
- **結業考**：2026-11-24 已做好，四幕都有，規則見 [curriculum.md](curriculum.md)。
- **第三幕的平滑規則上限**：程式目前還是讓第三、四幕沿用第二幕的數字（`src/content/vocab.ts`），沒有定第三幕自己的上限；第三幕 96 個有新內容的任務用這些數字檢查，0 個不符合。
- **規格列的其他第三幕旋鈕**（中文點了才顯示、多益題型播 2 次、干擾選項用發音相近的字、選項變成只有聲音）：這次沒排。
- **首頁**：`src/content/acts.ts` 的第三幕已補上這 12 個 id（2026-11-23），首頁會顯示。

## 4. 審稿紀錄（2026-11-23）

12 份草稿合併後，兩位審稿者各看了全部 12 個地點。

- **英文和中文**：168 個詞塊標了 38 個，其中 22 個是英文、文法或重複的問題，13 個只是中文，3 個可改可不改。沒有發現第四幕的文法，也沒有大陸用語。
- **選字、故事、順序、圖**：選字 29 項、場景 18 項、順序 16 項、故事 24 項、題型說明 20 項、圖 12 項、中文 12 項，另外建議搬動 40 個字。

照意見改掉的主要問題：

- **貿易公司天天用的字太晚教**：customer、client、product、sell、sample、visit、delay 原本排在最後幾個地點，前面的地點只好繞著說。現在 product、sell 在報到教，customer、client 在電話教，sample、visit、delay 在採購教。一共搬了 25 個字。
- **該教的句型沒人教**：Would you like me to take a message?、I'm calling about…、…get back to you、That makes sense to me.、I'm not sure, but I'll find out.、How was your weekend? 原本都不在任何詞塊裡，現在各由一個地點教。
- **同一種句型重複教**：「My first time + -ing」3 次、「as soon as」4 次、「So …, right?」4 次、「Could you send me X」4 次，各留一到兩個，其他改寫。
- **故事對不起來**：公司成立年數、週會是星期幾、辦公室有幾個人、商展的日期和「多住一晚」的理由，各地點原本說法不同，現在照第 1 節的設定統一。
- **同一個字族佔兩個位子**：約 25 個位子是同字族的第二個字（例如 depart 和 departure），現在每個地點最多留兩組，空出來的位子換成沒人教的常用字（angry、resolve、assist、collect、warn、expire 等）。
- **圖**：4 組 emoji 撞圖都解決了；要畫的字從 70 個調整成 93 個。

168 個詞塊裡，32 個換了英文句子，另外 14 個只改中文；832 個單字裡換了 52 個。審稿者提的建議沒採用的，原因都寫在各地點的「請人確認」。其中一項是我決定的：審稿者建議在 Email 教 however，但規格把它和 although、despite 一起排在第四幕的文法，所以沒有採用。

還沒做的審閱：

- 使用者同意照這份開始做，但第 3 節的 12 項沒有逐項回覆，都先照表裡寫的做法。
- 句子還沒請英文好的人看過。排表和審稿的都是 AI。

## 5. 做出來和表格不同的地方（2026-11-23）

用腳本把上面 12 個地點的表格和 `src/data/units/*.json` 逐格比對過：108 列任務；每個任務的標題、詞塊和單字的英文與中文、順序，全都一樣。

- **一樣的**：任務標題、每個任務教的詞塊和單字（英文、中文和順序）、每個地點 14 個詞塊；共 168 個詞塊、832 個單字。新題型第一次出現的任務（辦公室日常 t5 的文法填空、電話與留言 t5 的聽獨白、Email t5 的段落填空、倉庫與出貨 t5 的對話加圖表）和第 1 節的表一樣。
- **字和詞塊沒有調整**：沒有任何單字或詞塊換掉、增減或移到別的任務；中文也沒有改。
- **題數**：文法填空 12 題（辦公室日常 t5 有 2 題，電話與留言起每個地點的 t2 各 1 題）；聽獨白答題 11 段、25 題；聽對話答題 11 段、27 題（倉庫與出貨 t5 加一張出貨時間表）；段落填空 9 篇、27 個空格（Email t5，會議起每個地點的 t6）；讀短文 12 篇、30 題（每個地點的 t4）。
- **字數和表格預估不完全一樣**（空白分開來數，短文是標題加內文）：t4 短文報到與人事 76 字、辦公室日常 83 字（表格寫 60～80）；電話與留言到採購與廠商 96～108 字（表格寫 80～110，符合）；倉庫與出貨 131、客戶服務 135、機場 113、飯店 108、商展 153、公司活動 121（表格寫 110～150，飯店少 2 字、商展多 3 字）。
- **總經理 Mr. Ellis 的致詞（公司活動 t7）比表格短**：表格寫約 120～140 字，做出來是 103 字（9 句）。聽獨白答題的字數上限是 120（見 [content.md](content.md) 的「第三幕的新題型」），140 字放不進去，台詞也不想為了湊字數拉長。其他聽獨白答題是 45～93 字（飯店 t7 是 112 字）。
- **玩家的名字**：遊戲沒有玩家的名字，所以致詞裡頒獎的句子是「給籌辦這場派對的人」（`to the person who organized this party`），不是點名。
- **嘆詞沒有教**：oh、yeah、hey、hmm 這類口語嘆詞沒有教（字表裡的 perfect 是形容詞，到公司活動 t2 才教），台詞盡量不用，改用教過的說法。其他 11 個地點都避開了；**飯店例外**，t1、t3、t4、t5、t6、t9 共 10 句還是用了 oh、hey、hmm，用字報表列為沒教過的字；平滑規則沒有擋下。
- **機場說「a free shuttle」**：表格寫的是「飯店的接駁車」，但 hotel 這個字要到飯店那一站才教，所以機場的對話只說「免費接駁車」（`A free shuttle goes from the airport to where you're staying…`、`There's a free shuttle.`），沒有提到飯店。
- **採購與廠商 t5 的對話是玩家向 Ms. Carter 報告**：表格寫的是玩家和 Jack 通電話談價錢，做出來是玩家剛和 Jack 通完電話，轉述給 Ms. Carter 聽（`I just talked to Jack on the phone about the large lamp.`），兩位說話者是 `guide` 和 `manager`。t5 的劇情（小劇場）裡還是玩家和 Jack 談價錢，所以這個任務裡 Jack 還是有聲音，只有聽對話答題這一段換成向主管報告。
- **對話的另一位說話者**：報到與人事 t5 是人資，t7 是主管；辦公室日常 t7 是同事；機場 t5 是同事和地勤，沒有「你」（`guide`）；其他是「你」加表格寫的那位。
- **角色**：照第 1 節的角色表，10 個新角色（含 `announcer`）都出現了。`announcer` 出現在電話與留言、倉庫與出貨、機場、商展；客戶 Mr. Hughes 在電話與留言和商展；飯店只有主管的語音留言和飯店櫃台。
- **教了、但沒有出現在任何劇情台詞或題目裡的單字（16 個）**：報到與人事的 `knowledge`（表格寫 t6 要說「Your knowledge of Chinese will help a lot.」，做出來沒有用）、電話與留言的 `sir`、`temporarily`、會議的 `contribute`、`participate`、採購與廠商的 `method`、`overdue`、機場的 `mile`、`suddenly`、`onto`、飯店的 `electric`、`hourly`、商展的 `image`、公司活動的 `activity`、`throughout`、`praise`。它們只在介紹卡和單字題用到；規則只要求教過的字之後可以用，沒有要求一定要用。
- **沒教過的字**：報到與人事 t1 的 hr、t3 的 kate、t5 的 payday；辦公室日常 t2 和 t9 的 button、t4 的 plastic；Email t3 的 hide；加上飯店的嘆詞（見上）。其他任務和 12 個大挑戰（t9）學過的字都是 100%，只有辦公室日常和飯店的 t9 是 99%。
- **小劇場背景**：機場有 9 個任務、飯店 t4 用任務欄位 `backdrop` 指定背景（機場 t1、t3 用主要的背景，t4～t9 用登機門；飯店 t4 用語音留言的房間），表格沒有寫這個欄位，見 [content.md](content.md) 和 [scene-stage.md](scene-stage.md)。
- **看圖選句**：第三幕沒有，和第 6 節一致，沒有畫新的 96×64 的圖。

用字報表（2026-11-23）：30 個地點、不符合平滑規則的有 0 個；第三幕 t1～t8 的分數是 45（報到與人事 t1）到 63（商展 t7、t8，公司活動 t3），公司活動 t8 是 60 分（比 t7 高 2）。各地點的分數見 [curriculum.md](curriculum.md) 的「第三幕的分數」。

## 6. 要畫的像素圖

這一節是從上面的表整理出來的美術清單。開始畫之前要先有劇情（場景裡誰站哪裡、桌子或櫃台在哪一邊，要看每個任務的對話）。

### 單字圖（24×24）

| 地點                              | 張數 | 要畫的單字                                                                                                                                                                                                                                |
| --------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 19 報到與人事（`onboarding`）     | 5    | badge（識別證）、daughter（女兒）、receptionist（櫃台接待人員）、vacation（休假）、health（健康）                                                                                                                                         |
| 20 辦公室日常（`office`）         | 15   | drawer（抽屜）、pen（筆）、power（電源）、copier（影印機）、cable（線）、recycle（回收）、refrigerator（冰箱）、bin（桶）、plate（盤子）、pot（壺）、microwave（微波爐）、clip（夾子）、outlet（插座）、internet（網際網路）、ink（墨水） |
| 21 電話與留言（`phone`）          | 3    | telephone（電話）、operator（總機）、signal（訊號）                                                                                                                                                                                       |
| 22 Email（`email`）               | 4    | link（連結）、error（錯誤）、correct（正確的）、reply（回覆）                                                                                                                                                                             |
| 23 會議（`meeting`）              | 3    | calendar（行事曆）、projector（投影機）、slide（投影片）                                                                                                                                                                                  |
| 24 採購與廠商（`purchasing`）     | 6    | purchase（採購）、discount（折扣）、reduce（降低）、manufacturer（製造商）、increase（增加）、calculate（計算）                                                                                                                           |
| 25 倉庫與出貨（`warehouse`）      | 13   | warehouse（倉庫）、truck（貨車）、shelf（層架）、measure（量）、label（標籤）、fire（火）、ladder（梯子）、alarm（警報）、glove（手套）、inspect（檢查）、temperature（溫度）、sea（海）、port（港口）                                    |
| 26 客戶服務（`customer_service`） | 2    | apologize（道歉）、coupon（折價券）                                                                                                                                                                                                       |
| 27 機場（`airport`）              | 10   | train（列車）、suitcase（行李箱）、wallet（皮夾）、belt（皮帶）、storm（暴風雨）、plane（飛機）、prohibit（禁止）、announcement（廣播）、exit（出口）、pilot（機長）                                                                      |
| 28 飯店（`hotel`）                | 13   | hotel（飯店）、bar（酒吧）、pool（游泳池）、gym（健身房）、bathroom（浴室）、lock（鎖）、shower（淋浴）、air conditioner（冷氣機）、towel（毛巾）、wireless（無線的）、laundry（送洗的衣物）、iron（熨斗）、bell（鈴）                    |
| 29 商展（`trade_fair`）           | 8    | brochure（簡介手冊）、booth（攤位）、greet（打招呼）、shake（握）、world（世界）、attract（吸引）、video（影片）、target（目標）                                                                                                          |
| 30 公司活動（`company_event`）    | 11   | stage（舞台）、location（位置）、chef（主廚）、award（獎）、lucky（幸運的）、speaker（喇叭）、bowl（碗）、decorate（佈置）、microphone（麥克風）、guitar（吉他）、winner（得獎者）                                                        |

合計 93 張。

各地點表格下面的「請人確認」有寫哪些圖要特別注意（例如 truck 要和第一幕的 delivery 分得開、bin 要和 trash can 分得開）。

### 角色圖（16×24）

9 個新角色：`hr` Ms. Reed、`coworker` Dan、`client` Mr. Hughes、`supplier` Jack、`warehouse_lead` Luis、`customer` Mr. Grant、`airline_agent` 地勤、`hotel_clerk` 飯店櫃台、`director` Mr. Ellis。`manager` Ms. Carter 沿用第二幕的圖。`announcer` 只有聲音，不用畫。

### 小劇場場景

12 個地點各一個場景：人資辦公室、辦公室座位區、有電話的辦公桌、電腦前、會議室、和廠商談事情的會客桌、倉庫、客服的座位、機場櫃台和登機門、飯店櫃台、商展攤位、派對會場。

- 辦公室座位區、電話、Email、客服四個都在同一間辦公室，可以共用一個背景、換桌上的東西，這樣只要畫 9 個場景。要不要共用請你決定。
- 機場的前半（報到櫃台）和後半（登機門）是不同的地方，和第二幕的修車一樣，可能要兩個背景。

### 其他

- 看圖選句：第三幕固定出現的題型裡沒有看圖選句，所以不用畫 96×64 的圖。
- 聽對話答題加圖表的「圖表」是文字表格，不是像素圖。
