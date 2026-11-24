# 第二幕「找工作」詞塊、單字、文法分配表

狀態：已做（2026-11-23）。八個地點的 t1～t8 都照這份做完，也都排進遊玩順序（`src/content/unitOrder.ts` 的 `UNIT_ORDER`）：64 個任務、112 個詞塊、342 個單字；每個地點的 t8 是角色扮演大挑戰。`node scripts/vocab-report.mjs` 列出 0 個不符合平滑規則的地方。這份記錄當初怎麼排的；做出來和表格不同的地方（只有一處中文）在最後一節（第 5 節）。這份表裡的規則來自 [curriculum.md](curriculum.md)，格式和 [第一幕分配表](act1-syllabus.md) 一樣。排名用 `src/data/wordlists/` 的字表：N 是 NGSL、T 是 TSL、S 是補充字表（數字、月份）。

怎麼排出來的：先把第一幕結束時還沒教的字（NGSL 前 2,000 名加 TSL）分類，依主題分給 8 個地點，每個地點拿到的候選字都不重複；8 個地點各自排表；再由兩位沒看過草稿的審稿者看過（一位看詞塊自不自然，一位看選字和故事有沒有接上），照意見改了一輪。每個地點都用檢查腳本確認過字數、沒有重複教、詞塊只用到當時學過的字。

## 1. 總覽

### 總數

- 8 個地點 × 8 個任務 = 64 個任務。第 8 個任務是角色扮演大挑戰，只複習，所以有新內容的任務是 56 個。
- 新詞塊：**112 個**（每個任務 2 個）。
- 新單字：**342 個**。[curriculum.md](curriculum.md) 原本估 400 個，那是用 64 個任務算的；用 56 個任務、每個任務 4～7 個字算，就是 342 個。
- 另外有 59 個字是在詞塊裡第一次出現、沒有另外列成單字（例如 account、deposit、job）。照規則，詞塊裡的字也算教過。
- 第二幕結束時，玩家學過的字（原形）從 479 個增加到 879 個。
- 要畫像素圖的單字：41 個（銀行 4、社區中心 10、圖書館 5、修車 8、就業服務站 2、履歷 5、面試 0、上班前一天 7）。其他是抽象字，或是圖會和已有的字太像，只顯示 emoji。

| 字表分級          | 單字數 |
| ----------------- | ------ |
| NGSL ≤ 500        | 127    |
| NGSL 501–1000     | 113    |
| NGSL 1001–1800    | 49     |
| NGSL 1801 以後    | 6      |
| TSL               | 29     |
| SUP（數字、月份） | 16     |
| 字表外            | 2      |

- NGSL 前 1,000 名占 70%。第一幕為了讓短劇情只有 1 個生字，先教了很多具體名詞；第二幕的劇情變長，所以先補常用的動詞、形容詞和連接用的字（tell、ask、before、understand 這一類），後面三幕才寫得出自然的對話。
- 字表外的 2 個：ATM、cover letter。

### 新項目數的曲線（照遊玩順序）

新項目數 = 新詞塊 + 新單字。R = 大挑戰（0 個新項目）。第一幕最後一個地點（公園）是 `6 7 7 7 7 7 7 R`。

```
11 銀行          6 7 7 7 7 7 7 R
12 社區中心      7 7 7 7 8 8 8 R
13 圖書館        7 8 8 8 8 8 8 R
14 修車與維修    7 8 8 8 8 8 8 R
15 就業服務站    7 8 8 8 9 9 9 R
16 履歷          8 9 9 9 9 9 9 R
17 面試          8 9 9 9 9 9 9 R
18 上班前一天    8 9 9 9 9 9 9 R
```

- 相鄰任務最多 +1。每個新地點的 t1 比前一個地點少 1 個。
- 每個任務的新單字從 4～5 個慢慢加到 7 個。
- 教文法、第一次出新題型的任務，新項目數都和前一個任務一樣（一次只轉一個旋鈕）。

### 難度分數會怎麼走

分數由新項目數、字的程度、詞塊長度、每句長度、劇情句數算出來（公式見 [curriculum.md](curriculum.md)）。前三項由這份表決定，後兩項要等寫劇情才知道。用這份表先算過：

- 第一幕最後是 29～33 分。銀行 t1 用 5 句、每句約 6.5 個字的劇情是 30 分，接得上。
- 劇情從銀行的 5 句、每句 6.5 個字，慢慢加到最後兩個地點的 7 句、每句 8 個字，分數會從 30 分走到 48 分左右，中間每換一個地點先降 2～4 分。
- 每一步都在「最多升 3 分、最多降 5 分」以內做得到。有三個地方詞塊突然變長（面試 t1→t2、上班前一天 t4→t5→t6），寫劇情時那幾個任務要少一句來抵。
- 詞塊的平均長度：銀行 5.4 個字，到上班前一天 7.2 個字（第一幕最後是 4.4 個字）。

### 故事和時間線

玩家八月搬進小鎮（第一幕）。第二幕從八月底到十一月中：

| 順序 | 地點（id）                     | 什麼時候 | 發生什麼事                                                              |
| ---- | ------------------------------ | -------- | ----------------------------------------------------------------------- |
| 11   | 銀行（`bank`）                 | 八月底   | 開戶，之後才能領薪水                                                    |
| 12   | 社區中心（`community_center`） | 九月初   | 公園的志工 Ben 介紹的。報名電腦課（九月到十二月），為辦公室工作做準備   |
| 13   | 圖書館（`library`）            | 九月中   | 辦借書證、借書、用電腦和印表機。公告欄上有十月就業博覽會的消息          |
| 14   | 修車與維修（`repair`）         | 九月底   | 前半：廚房水槽漏水，找房東 Mr. Bell。後半：為了找工作買了二手車，開去修 |
| 15   | 就業服務站（`job_center`）     | 十月     | 登記、看求職廣告、比較兩份工作，決定應徵 Harbor Trading 的辦公室助理    |
| 16   | 履歷（`resume`）               | 隔天     | 就業服務站的履歷工作坊：學歷、經歷、技能，寫完寄出                      |
| 17   | 面試（`interview`）            | 十一月初 | 到 Harbor Trading 面試                                                  |
| 18   | 上班前一天（`day_before`）     | 十一月中 | 主管打電話通知錄取，星期一開始上班；鄰居來道賀；準備第一天              |

第三幕從上班第一天的早上開始。

### 角色

| 角色 id      | 是誰                          | 出現在            | 新的還是沿用               |
| ------------ | ----------------------------- | ----------------- | -------------------------- |
| `teller`     | 銀行行員                      | 銀行              | 新                         |
| `instructor` | 電腦課老師                    | 社區中心          | 新                         |
| `volunteer`  | 社區志工 Ben                  | 社區中心          | 沿用第一幕公園             |
| `librarian`  | 圖書館員，**英國口音**        | 圖書館            | 新（第二幕唯一的英國口音） |
| `landlord`   | 房東 Mr. Bell                 | 修車與維修 t1～t3 | 沿用第一幕搬家第一天       |
| `mechanic`   | 修車師傅 Tony                 | 修車與維修 t4～t7 | 新                         |
| `counselor`  | 就業顧問 Ms. Lopez            | 就業服務站、履歷  | 新                         |
| `friend`     | 朋友 Mia                      | 履歷 t6           | 沿用第一幕餐廳             |
| `front_desk` | Harbor Trading 的前台         | 面試 t1           | 新                         |
| `manager`    | 主管 Ms. Carter，面試官也是她 | 面試、上班前一天  | 新                         |
| `neighbor`   | 鄰居                          | 上班前一天        | 沿用第一幕搬家第一天       |

新角色 7 個。每個任務只有一個 NPC；大挑戰最多兩個。

### 文法第一次出現

每個地點兩個文法點，放在 t3 和 t6。這兩個任務的新項目數都和前一個任務一樣，也不出新題型。

| 文法                                 | 地點與任務       | 詞塊                                                                               |
| ------------------------------------ | ---------------- | ---------------------------------------------------------------------------------- |
| Could / Would 請求                   | 11 銀行 t3       | Could you check my form?（I'd like to… 在 t5）                                     |
| have to / must                       | 11 銀行 t6       | Do I have to pay a fee?（must 是這個任務的單字）                                   |
| be going to（計畫）                  | 12 社區中心 t3   | I'm going to start in September.                                                   |
| 頻率副詞                             | 12 社區中心 t6   | How often do you practice? / I usually study a few nights a week.                  |
| 完整的過去式（Did…? / didn't）       | 13 圖書館 t3     | I didn't have time to read them.                                                   |
| 受詞代名詞                           | 13 圖書館 t6     | Could you show me how to print? / Can I print them in color?                       |
| should                               | 14 修車 t3       | Should I take all these things out?                                                |
| too / enough                         | 14 修車 t6       | That's a bit too expensive for me.（enough 是這個任務的單字）                      |
| 比較級                               | 15 就業服務站 t3 | I'd prefer a smaller company. / Weekends off would be better for me.               |
| 動名詞和不定詞                       | 15 就業服務站 t6 | I enjoy working with people. / I decided to apply for the office job.              |
| 現在完成式（ever / never）           | 16 履歷 t3       | I've never written one in English. / I've had several jobs in Taiwan.              |
| 現在完成式（just / already / yet）   | 16 履歷 t6       | I've just finished my first draft. / I haven't sent it yet.                        |
| 現在完成式（for / since）            | 17 面試 t3       | I've been in this town since August. / I've studied English for many years.        |
| 最高級                               | 17 面試 t6       | I'm not the fastest, but I'm very careful.                                         |
| will / won't（承諾、預測）           | 18 上班前一天 t3 | Sure, I'll be there by eight thirty. / Don't worry, I won't be late.               |
| （混合複習 going to、will、have to） | 18 上班前一天 t6 | I'm going to leave early to miss the traffic. / So I have to go across the bridge? |

- [curriculum.md](curriculum.md) 列的第二幕文法都排進去了。順序照場景排，和 curriculum.md 列的順序不完全一樣（例如 Could / Would 最早，因為銀行最需要客氣地請求）。
- will 到上班前一天 t3 才正式教。之前的詞塊都不用 will，只有第一幕當固定說法教過的 I'll take it. 這類例外。
- 第三幕的文法（被動式、關係子句、第一條件句、might / may）都沒有提早用。

### 新題型和新旋鈕第一次出現

第二幕有三種新題型和一個新口音，一次只出一種，第一次出現時只用學過的內容。三種題型都已做（見 [vocab-quiz.md](vocab-quiz.md)）。

| 新東西                        | 地點與任務     | 為什麼放這裡                                                                                     |
| ----------------------------- | -------------- | ------------------------------------------------------------------------------------------------ |
| 句子填空（多益第 5 大題）     | 11 銀行 t5     | 最接近已有的聽力填空，只是改成用看的。第一次只用第一幕的詞塊出題。這個任務沒有文法，項目數持平   |
| 讀簡訊、傳單（多益第 7 大題） | 12 社區中心 t4 | 第一幕只讀 15 個字以內的招牌。課程表傳單是 30～60 個字的短文，第一次只用學過的字，一篇一題       |
| 英國口音                      | 13 圖書館      | 整個地點只有圖書館員一個 NPC，場景安靜、句子不趕，適合第一次聽不同口音。玩家自己說的詞塊還是美式 |
| 聽對話答題（多益第 3 大題）   | 14 修車 t5     | 先聽一段兩個人的對話再回答。第一次只用學過的字、只問 1 題；履歷開始問 2 題                       |

之後每個地點固定再出現：

| 任務 | 題型                                                                                                           |
| ---- | -------------------------------------------------------------------------------------------------------------- |
| t2   | 句子填空（社區中心開始）                                                                                       |
| t4   | 閱讀：銀行是招牌（營業時間、提款機畫面），之後是課程表、公告、估價簡訊、求職廣告、履歷範例、職務說明、報到須知 |
| t5   | 社區中心和圖書館是看圖選句（各 2 張圖）；修車開始是聽對話答題                                                  |
| t6   | 聽力填空                                                                                                       |
| t7   | 打字拼字（考上一個地點教過的字）                                                                               |

## 2. 各地點分配

地點編號接著第一幕（第一幕是 1～10）。每個地點表格下面的幾行是給之後寫劇情的人看的：題型怎麼排、t4 讀什麼、t5 聽什麼，以及還要請人確認的地方。

### 11 銀行（`bank`）

- NPC：`teller` 銀行行員（新角色，七個任務都是同一位行員）
- 場景：八月底，為了之後能領薪水，去銀行開戶：說明來意、拿證件和地址證明、填表、領提款卡學用提款機、第一次存錢、問手續費、網路銀行和付房租。

| 任務 | 標題             | 新詞塊（英文／中文）                                                                                   | 新單字（英文／中文／排名）                                                                                                             | 文法                                           | 新題型             | 新項目數    |
| ---- | ---------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ------------------ | ----------- |
| t1   | 走進銀行         | I need to open a bank account.／我想開個戶。<br>Where do I wait?／我要在哪裡等？                       | before／以前；在……之前／N106<br>ask／問／N134<br>another／另一個／N140<br>question／問題／N181                                         | —                                              | —                  | 6           |
| t2   | 證件和地址       | Is my passport okay?／用護照可以嗎？<br>This bill has my new address.／這張帳單上有我的新地址。        | tell／告訴／N103<br>same／一樣的／N122<br>different／不一樣的／N149<br>information／資料／N213<br>passport／護照／T84                  | —                                              | —                  | 7           |
| t3   | 填開戶申請表     | Could you check my form?／可以幫我看一下表格嗎？<br>Sorry, I don't understand.／不好意思，我看不太懂。 | why／為什麼／N154<br>important／重要的／N190<br>answer／答案；回答／N355<br>easy／簡單的／N408<br>income／收入／N920                   | Could / Would 請求（Could you…? I'd like to…） | —                  | 7           |
| t4   | 提款卡和提款機   | How does the ATM work?／提款機怎麼用？<br>Can I take out sixty dollars?／我可以領六十塊嗎？            | put／放進；插入／N139<br>without／沒有（……就不行）／N212<br>eighty／八十／S<br>thousand／一千／S<br>ATM／提款機／字表外                | —                                              | —                  | 7           |
| t5   | 第一次存錢       | I'd like to deposit some cash.／我想存一些現金。<br>When can I use the money?／這筆錢什麼時候可以用？  | seventy／七十／S<br>ninety／九十／S<br>amount／金額／N507<br>save／存（錢）／N566<br>cent／分（一美元的百分之一）／N749                | —                                              | 句子填空（第一次） | 7           |
| t6   | 問手續費         | Do I have to pay a fee?／我要付手續費嗎？<br>Is that every month?／是每個月都要付嗎？                  | must／必須／N160<br>charge／收（費用）／N498<br>statement／對帳單／N769<br>balance／餘額／N907<br>fee／手續費／N1479                   | have to / must                                 | —                  | 7           |
| t7   | 網路銀行和付房租 | Can I pay my rent online?／房租可以在網路上付嗎？<br>How do I send money home?／我要怎麼匯錢回家？     | spend／花（錢）／N258<br>rate／匯率／N312<br>credit／信用（credit card 信用卡）／N944<br>transfer／轉帳／N1110<br>payment／付款／N1268 | —                                              | —                  | 7           |
| t8   | 角色扮演大挑戰   | —                                                                                                      | —                                                                                                                                      | —                                              | —                  | 0（只複習） |

小計：14 個詞塊、34 個單字。

- 之後再出現的題型：t4 讀招牌（銀行營業時間、提款機畫面），t5 句子填空（第一次出現，只用第一幕的內容），t6 聽力填空，t7 打字拼字（考公園教過、有像素圖的字）。
- 閱讀素材（t4）：銀行門口的營業時間牌（Mon–Fri 9:00–4:00, Sat 9:00–12:00, ATM open 24 hours）和提款機畫面（Put in your card. / Take out: $20 $40 $60 $80 $100 / Another? Yes / No / Up to $1,000 a day）；題目問幾點以前要來、一天最多能領多少、要按哪個鍵。畫面只用 t4 以前學過的字（cash 到 t5、balance 到 t6 才教，所以不出現）。
- 請人確認：
  - 有 3 個字是另外加的，不在原本的候選字表裡：passport（剛搬來的台灣人最常用的證件）、rent（t7 付房租，接回第一幕房東 Mr. Bell）、ATM（不在字表內，決定正式教）。
  - deposit（N2313）在 t5 詞塊裡教；withdraw（N2163）沒有教，t4 用口語的 take out，行員台詞也用 take out。machine 留給修車與維修教，所以銀行不教 cash machine。
  - bill 和 cash 改成在詞塊裡教（t2、t5），空出的單字位子給 different 和 ATM。原本排的 secure 換成 credit，因為信用卡只有銀行能教。
  - 補充數字分在兩個任務：t4 有 sixty（詞塊）、eighty、thousand；t5 有 seventy、ninety（存 $90.70 這類金額）。
  - 請英文好的人看：t6「Is that every month?」（接在行員說有手續費之後）是否自然。

### 12 社區中心（`community_center`）

- NPC：`volunteer` 社區志工 Ben（第一幕公園的同一個角色，聲線和角色圖沿用；t1、t7）、`instructor` 課程老師（新角色；t2～t6）
- 場景：九月初，Ben 介紹社區中心，玩家報名電腦課（9 月到 12 月）為找工作做準備：問有哪些課、填報名表、問什麼時候開課、看課程表、第一堂課、和同學聊天、回家練習後跟 Ben 說進度。

| 任務 | 標題           | 新詞塊（英文／中文）                                                                                                   | 新單字（英文／中文／排名）                                                                                                                 | 文法                                                              | 新題型                                          | 新項目數    |
| ---- | -------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- | ----------------------------------------------- | ----------- |
| t1   | 有哪些課       | What kind of classes do you have?／你們有開哪些課？<br>I'm hoping to find an office job.／我希望能找到辦公室的工作。   | community／社區／N465<br>course／課程／N164<br>learn／學習／N261<br>student／學生／N248<br>computer／電腦／N429                            | —                                                                 | —                                               | 7           |
| t2   | 填報名表       | Do I have to be a member?／一定要是會員嗎？<br>Can I just write my email?／只寫電子郵件可以嗎？                        | member／會員／N266<br>join／加入／N469<br>adult／成人／N880<br>basic／基礎的／N911<br>register／登記報名／N1500                            | —                                                                 | —                                               | 7           |
| t3   | 什麼時候開課   | I'm going to start in September.／我打算九月開始上。<br>When do classes begin?／什麼時候開課？                         | plan／計畫／N232<br>July／七月／S<br>August／八月／S<br>September／九月／S<br>summer／夏天／N654                                           | be going to（計畫）                                               | —                                               | 7           |
| t4   | 看課程表       | So it ends in December?／所以是十二月結束？<br>Are there classes during the day?／白天有課嗎？                         | October／十月／S<br>November／十一月／S<br>December／十二月／S<br>workshop／工作坊／T16<br>available／有空位的／N459                       | —                                                                 | **讀簡訊／傳單 第一次**（課程表；只用學過的字） | 7           |
| t5   | 第一堂課       | Sorry, I can't hear you.／不好意思，我聽不到。<br>Can you show me again?／可以再示範一次給我看嗎？                     | teacher／老師／N496<br>listen／聽／N573<br>screen／螢幕／N957<br>keyboard／鍵盤／T91<br>mouse／滑鼠／N1926<br>instruction／操作說明／N1672 | —                                                                 | —                                               | 8           |
| t6   | 認識同學       | How often do you practice?／你多久練習一次？<br>I usually study a few nights a week.／我通常一個禮拜有幾個晚上會唸書。 | always／總是／N183<br>sometimes／有時候／N444<br>never／從不／N162<br>both／兩個都／N128<br>interest／興趣／N142<br>classmate／同學／T704  | 頻率副詞（always, usually, often, sometimes, never; How often…?） | —                                               | 8           |
| t7   | 在家練習       | It's hard, but I'm learning a lot.／很難，但我學到很多。<br>Maybe we can practice together.／也許我們可以一起練習。    | talk／聊；說話／N137<br>teach／教／N539<br>idea／主意／N251<br>homework／作業／T258<br>exercise／練習題／N917<br>test／測驗／N332          | —                                                                 | —                                               | 8           |
| t8   | 角色扮演大挑戰 | —                                                                                                                      | —                                                                                                                                          | —                                                                 | —                                               | 0（只複習） |

小計：14 個詞塊、38 個單字。

- 之後再出現的題型：t2 句子填空、t5 看圖選句、t6 聽力填空、t7 打字拼字。
- 閱讀素材（t4）：社區中心的課程表傳單，例如「Computer Basics for Adults／Monday and Thursday evening／September to December／A few seats available／Free for members／Free resume workshop on Saturday」，玩家看完回答開課和結業的月份、上課時間、是否還有空位。
- 請人確認：
  - classmate、homework 是另外加的字，其他地點原本的候選字表都沒有排到這兩個字。
  - 原本排的 program、lesson、progress、repeat 拿掉了：program、lesson 和 class、course 是近義字；progress 和「I'm learning a lot」重疊；repeat 跟著詞塊「Could you repeat that, please?」一起拿掉。之後的地點目前都沒有用到這四個字。
  - 月份一律算第 300 名，t3、t4 的平均排名因此比前後任務低。
  - t4 的 workshop 出現在傳單上的「週六免費履歷工作坊」，為之後的履歷工作坊鋪路；t3 的 summer 用在「夏天沒開課，九月才開」。

### 13 圖書館（`library`）

- NPC：`librarian` 圖書館員（第二幕唯一的英國口音角色；玩家的台詞仍用美式英文，也避開英美拼法或意思不同的字）
- 場景：辦借書證、借電腦和找工作的書、還書續借、看布告欄上的就業博覽會公告、用電腦、列印、遵守安靜規定。公告指向就業服務站。

| 任務 | 標題           | 新詞塊（英文／中文）                                                                                      | 新單字（英文／中文／排名）                                                                                                                   | 文法                                 | 新題型 | 新項目數    |
| ---- | -------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ------ | ----------- |
| t1   | 辦借書證       | I'd like to get a library card.／我想辦一張借書證。<br>I live near here.／我住在這附近。                  | librarian／圖書館員／T467<br>place／地方／N114<br>until／到（幾點）為止／N255<br>eleven／十一／S<br>twelve／十二／S                          | —                                    | —      | 7           |
| t2   | 找書、借書     | Where are the computer books?／電腦的書在哪裡？<br>How many books can I borrow?／我一次可以借幾本？       | magazine／雜誌／N985<br>through／穿過／N108<br>under／在…下面／N193<br>behind／在…後面／N492<br>author／作者／N910<br>title／書名／N1057     | —                                    | —      | 8           |
| t3   | 續借           | Can I renew these books?／這些書可以續借嗎？<br>I didn't have time to read them.／我還沒時間看。          | renew／續借／T110<br>due／到期的／N574<br>ago／…以前／N372<br>still／還（在）／N119<br>remember／記得／N351<br>forget／忘記／N651            | 完整的過去式（Did you…? I didn't…）  | —      | 8           |
| t4   | 看布告欄       | What does this word mean?／這個字是什麼意思？<br>Is the job fair free?／就業博覽會要錢嗎？                | January／一月／S<br>February／二月／S<br>March／三月／S<br>April／四月／S<br>May／五月／S<br>June／六月／S                                   | —                                    | —      | 8           |
| t5   | 用圖書館的電腦 | Can I use my laptop here?／我可以在這裡用自己的筆電嗎？<br>Let me write that down.／我記一下。            | connect／連線／N1264<br>download／下載／N1751<br>password／密碼／T190<br>search／搜尋／N889<br>limit／限制／N572<br>e-book／電子書／T4       | —                                    | —      | 8           |
| t6   | 列印和影印     | Could you show me how to print?／可以教我怎麼列印嗎？<br>Can I print them in color?／這些可以印彩色的嗎？ | print／列印／N1100<br>paper／紙／N425<br>page／頁／N652<br>copy／影印；一份／N1037<br>file／檔案／N835<br>around／大約／N170                 | 受詞代名詞（me, him, her, us, them） | —      | 8           |
| t7   | 安靜的規定     | Sorry, let me turn it off.／抱歉，我馬上關掉。<br>Where can I take a call?／我可以去哪裡講電話？          | board／布告欄／N741<br>rule／規定／N415<br>follow／遵守／N188<br>allow／允許／N324<br>quiet／安靜的／N1313<br>away／收起來（put away）／N234 | —                                    | —      | 8           |
| t8   | 角色扮演大挑戰 | —                                                                                                         | —                                                                                                                                            | —                                    | —      | 0（只複習） |

小計：14 個詞塊、41 個單字。

- 之後再出現的題型：t2 句子填空、t4 讀公告、t5 看圖選句、t6 聽力填空、t7 打字拼字。
- 閱讀素材（t4）：九月中，布告欄上的三張公告：「JOB FAIR — Saturday, October 3, 11:00–3:00, at the Job Center」；「English Conversation Group — every Tuesday, January to June. Sign up at the desk by December.」；「Spring Book Sale — March 14; Story Time for Kids — April and May; Summer hours start in June」。玩家看不懂一個字就問圖書館員，再問博覽會要不要錢；館員說免費、不用報名，順便說明就業服務站在哪。
- 請人確認：
  - t4 的單字欄只放一月到六月：fair 改在詞塊裡教，board 移到 t7（規定貼在布告欄上，「The rules are on the board.」）。一月到六月在九月的布告欄上只能放「明年的活動」，請確認這樣的公告可以接受。
  - t3 的 ago 從詞塊改成單字欄，由館員說「You borrowed them three weeks ago.」；renew 同時在詞塊和單字欄。
  - t5 的 laptop 在詞塊裡教；limit 從 t7 移到 t5（電腦使用一次一小時）。
  - around 教的是「大約」（around ten cents a page），away 只在 put it away 這個片語裡用；請英文好的人確認兩者在 t6、t7 對話裡自然。

### 14 修車與維修（`repair`）

- NPC：`landlord` 房東 Mr. Bell（第一幕搬家的同一個角色，聲線和角色圖沿用；t1～t3）、`mechanic` 修車師傅 Tony（新角色；t4～t7）
- 場景：九月底，東西壞了。先是公寓廚房的水槽漏水，打給房東 Mr. Bell 報修、約時間；水電師傅沒空，Mr. Bell 自己帶工具來修。接著主角剛買了一台便宜的二手車（找工作、去面試都要開車，公車到不了商業園區），開去修車廠：說明怪聲、看估價簡訊、聽師傅解釋、決定先修哪些、取車付款。

| 任務 | 標題                     | 新詞塊（英文／中文）                                                                                                     | 新單字（英文／中文／排名）                                                                                                                               | 文法         | 新題型                                      | 新項目數    |
| ---- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------- | ----------- |
| t1   | 打電話報修：廚房漏水     | My kitchen sink is leaking.／我廚房的水槽在漏水。<br>There's water all over the floor.／地上都是水。                     | happen／發生／N236<br>wall／牆壁／N722<br>floor／地板／N751<br>apartment／公寓／N2168<br>leak／漏水／T292                                                | —            | —                                           | 7           |
| t2   | 約時間來修               | Can someone come and fix it today?／今天可以找人來修嗎？<br>I'm home all afternoon.／我整個下午都在家。                  | house／房子（Mr. Bell 自己的家）／N165<br>worry／擔心／N653<br>quickly／很快地／N783<br>fix／修理／N973<br>tool／工具／N1227<br>plumber／水電師傅／T359  | —            | —                                           | 8           |
| t3   | 房東上門修水槽           | Should I take all these things out?／要我先把這些東西都拿出來嗎？<br>It seems okay now.／現在看起來好了。                | fall／掉下去／N320<br>drop／（不小心）弄掉／N640<br>pull／拉／N799<br>push／推／N868<br>dark／暗的／N923<br>cabinet／（水槽下的）櫃子／T87               | should       | —                                           | 8           |
| t4   | 把剛買的二手車開去修車廠 | I just bought this used car.／我剛買了這台二手車。<br>It makes a strange noise when I drive.／我開車的時候它會發出怪聲。 | shop／修車廠；店／N437<br>sound／聲音／N390<br>trouble／問題；毛病／N832<br>estimate／估價／N999<br>engine／引擎／N1617<br>mechanic／修車師傅／T140      | —            | —                                           | 8           |
| t5   | 師傅說明估價             | So I don't need a whole new engine?／所以我不用換一整顆新引擎？<br>Do I really need new tires?／輪胎真的要換新的嗎？     | probably／大概；可能／N328<br>damage／損壞／N908<br>replace／更換／N994<br>tire／輪胎／N1331<br>repair／修理／N1878<br>brake／煞車／T458                 | —            | **聽對話答題 第一次**（只用學過的字，1 題） | 8           |
| t6   | 決定先修哪些             | That's a bit too expensive for me.／這對我來說有點太貴了。<br>Let's just fix the brakes for now.／那先修煞車就好。       | enough／足夠的／N267<br>finish／完成；修好／N609<br>speed／速度／N1106<br>safety／安全／N1311<br>accident／意外；車禍／N1349<br>dangerous／危險的／N1419 | too / enough | —                                           | 8           |
| t7   | 取車付款                 | Hi, I'm here for my car.／你好，我來牽車。<br>It sounds really good now.／現在聲音聽起來很正常了。                       | almost／幾乎；快要／N307<br>full／滿的／N410<br>fill／加滿；裝滿／N845<br>gas／汽油／N1189<br>inspection／檢查／T136<br>warranty／保固／T42              | —            | —                                           | 8           |
| t8   | 角色扮演大挑戰           | —                                                                                                                        | —                                                                                                                                                        | —            | —                                           | 0（只複習） |

小計：14 個詞塊、41 個單字。

- 之後再出現的題型：t2 句子填空、t4 讀估價單／簡訊、t6 聽力填空、t7 打字拼字。
- 閱讀素材（t4）：修車廠師傅傳來的估價簡訊，例如「Hi, this is Tony at the shop. I checked your car. The engine is OK. The trouble is the brakes. Estimate: brakes $280, two new tires $240. Total $520. Please call me.」玩家讀完回答「問題出在哪裡？」「全部修要多少錢？」之類的題目。
- 聽對話答題（t5）：主角在修車廠等的時候，聽到師傅和另一位客人的短對話（客人的車燈不亮，師傅說今天下午四點可以來拿，費用 60 元），回答一題「客人什麼時候可以來拿車？」；只用第一幕和本地點 t1～t4 學過的字。
- 請人確認：
  - leak、strange、brake 是另外加的字，不在原本的候選字表裡；plumber、apartment、shop 是審稿後加進來的。
  - 原本排的 technician、garage、wheel 拿掉了：technician 改成 plumber（房東自己來修，不再矛盾）；garage 改成美式的 shop；wheel 和 tire 重疊，改成地點本身的 repair。kitchen 不再列在單字欄，但仍在 t1 詞塊裡教到。
  - t2 的 house 指 Mr. Bell 自己的家（「I'm at my house now. I can come at three.」），不是玩家住的公寓（apartment）。
  - t3 的六個字（fall、drop、pull、push、dark、cabinet）都在修水槽的場景裡：水槽下的櫃子很暗、把東西拉出來、推回去；fall（東西自己掉下去）和 drop（不小心弄掉）請放在對比的兩句裡。寫劇情時如果放不自然，再調整這幾個字。
  - t5 的「So I don't need a whole new engine?」是讀完簡訊（引擎沒問題）後鬆一口氣的確認句。
  - 第一幕主角說過「No, I don't have a car.」；t4 的標題和第一句詞塊都點明這台車是剛買的二手車。
  - 圖示：cabinet 要畫成水槽下的櫥櫃（不是檔案櫃）、engine 要畫引擎本體（不是齒輪）；floor、brake、shop、apartment、plumber 改成抽象，避免和其他字撞圖或畫不出來。

### 15 就業服務站（`job_center`）

- NPC：`counselor` 就業顧問 Ms. Lopez（新角色；隔天的履歷工作坊也是她帶）
- 場景：十月，看到圖書館的就業博覽會公告之後，到就業服務站登記求職：聊以前做過什麼、想找什麼樣的工作，看求職廣告，比較兩份工作（全職辦公室助理對兼職餐廳晚班），最後決定應徵 Harbor Trading 的辦公室助理，顧問約好明天的履歷工作坊。

| 任務 | 標題             | 新詞塊（英文／中文）                                                                                                        | 新單字（英文／中文／排名）                                                                                                                                                                                                              | 文法                                                         | 新題型 | 新項目數    |
| ---- | ---------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------ | ----------- |
| t1   | 登記求職         | I moved to town in August.／我八月搬來這裡的。<br>I'd like to find a job here.／我想在這裡找工作。                          | myself／我自己（about myself 關於我自己）／N669<br>counselor／就業顧問／T900<br>age／年齡／N282<br>area／地區／N204<br>level／程度；等級／N262                                                                                          | —                                                            | —      | 7           |
| t2   | 以前的工作       | I worked in an office in Taiwan.／我在台灣是坐辦公室的。<br>I'm looking for something similar.／我想找差不多的工作。        | company／公司／N107<br>example／例子（for example 例如）／N235<br>experience／經驗／N264<br>actually／其實／N291<br>clerk／職員；辦事員／T23<br>assistant／助理／N1739                                                                  | —                                                            | —      | 8           |
| t3   | 想要的條件       | I'd prefer a smaller company.／我比較想去小一點的公司。<br>Weekends off would be better for me.／週末能休假對我來說比較好。 | high／高的／N148<br>less／比較少／N253<br>quite／相當／N277<br>least／最少（at least 至少）／N281<br>low／低的／N283<br>salary／薪水（月薪）／N1816                                                                                     | 比較級（cheaper, better, more … than）                       | —      | 8           |
| t4   | 看求職廣告       | Is this job full time or part time?／這份是全職還是兼職？<br>How do I apply for it?／要怎麼應徵？                           | require／需要；要求／N402<br>position／職位／N426<br>benefit／福利／N543<br>apply／應徵；申請／N611<br>ad／廣告／N1478<br>wage／工資（時薪）／N1757                                                                                     | —                                                            | —      | 8           |
| t5   | 比較兩份工作     | Which one would you choose?／如果是你，你會選哪一個？<br>Does the office job pay overtime?／辦公室那份有加班費嗎？          | common／常見的／N567<br>compare／比較／N614<br>employee／員工／N624<br>task／工作項目／N854<br>shift／班（早班、晚班）／N1190<br>hire／僱用；錄取／N1514<br>overtime／加班／T164                                                        | —                                                            | —      | 9           |
| t6   | 決定應徵         | I enjoy working with people.／我喜歡跟人打交道。<br>I decided to apply for the office job.／我決定應徵辦公室那份工作。      | become／成為／N141<br>person／人（people person 喜歡跟人相處的人）／N263<br>able／能夠（be able to）／N271<br>decide／決定／N359<br>enjoy／喜歡；享受／N504<br>choice／選擇／N565<br>career／職涯；事業／N892                           | 動名詞和不定詞（enjoy working, want to apply, good at …ing） | —      | 9           |
| t7   | 下一步：準備申請 | What do I need for the application?／申請要準備哪些東西？<br>Should I bring anything tomorrow?／我明天要帶什麼東西嗎？      | offer／提供；給（offer you an interview）／N237<br>possible／可能的（as soon as possible 盡快）／N290<br>local／本地的／N300<br>chance／機會／N560<br>application／申請（書）／N884<br>candidate／應徵者／N977<br>employer／雇主／N1702 | —                                                            | —      | 9           |
| t8   | 角色扮演大挑戰   | —                                                                                                                           | —                                                                                                                                                                                                                                       | —                                                            | —      | 0（只複習） |

小計：14 個詞塊、44 個單字。

- 之後再出現的題型：t2 句子填空、t4 讀求職廣告、t5 聽對話答題（1 題）、t6 聽力填空、t7 打字拼字。
- 閱讀素材（t4）：佈告欄上的兩則求職廣告，各約 30 字。A：Harbor Trading 徵 office assistant，position: full time，週一到週五 9 點到 5 點，salary $3,200 a month，benefits: insurance，requires: English and one year of office experience，How to apply：找 counselor Ms. Lopez。B：鎮上的餐廳 Rosa's 徵 waiter，part time，evenings and weekends，wage $17 an hour，no experience required。題目問哪一份要經驗、哪一份有福利、怎麼應徵。
- 聽對話答題（t5）：Ms. Lopez 把兩份工作並排比較：餐廳時薪比較高，但都是晚班、週末也要上，加班很常見；Harbor Trading 月薪固定、有福利、週末休假，公司正要 hire 一位助理，在商業園區（公車到不了，剛好接上修車與維修那一站買的車）。題目（1 題）：Which job has evening shifts?（答：the restaurant job）。
- 請人確認：
  - full time、part time 寫成不加連字號的兩個字（放在句尾當補語時，美式可以不加），因為 full-time、part-time 不在任何字表裡。
  - counselor 是另外加的字，因為 NPC 的職稱不在任何候選字表裡。
  - 原本排的 professional 拿掉了：t7 換成 offer，後面也沒有地點用到 professional。
  - quite 的中文改成「相當」；美式口語少用 quite 當「蠻」，請對話作者用 quite a few、not quite 這類說法。
  - t6 的 people person 只是單字中文說明裡的例子，不是詞塊；寫劇情時可以讓顧問說 You're a people person.
  - 圖示：只有 counselor（NPC 頭像）和 assistant 畫圖，其他人像字和撞圖的字（company、salary、wage、application、ad）都改成抽象。

### 16 履歷（`resume`）

- NPC：`counselor` 就業顧問 Ms. Lopez（和就業服務站同一個角色，聲線和角色圖都沿用）、`friend` 朋友 Mia（第一幕的朋友，t6 來電腦教室幫忙看草稿）
- 場景：十月，就業服務站登記完的隔天，電腦教室的履歷工作坊：個人資料、學歷、在台灣的工作經歷、讀履歷範例、技能和語言、請 Mia 看草稿、加上推薦人後寄出 Harbor Trading 辦公室助理的應徵資料。

| 任務 | 標題                 | 新詞塊（英文／中文）                                                                                                                   | 新單字（英文／中文／排名）                                                                                                                                                                                | 文法                               | 新題型 | 新項目數    |
| ---- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ------ | ----------- |
| t1   | 履歷工作坊：個人資料 | I'd like some help with my resume.／我想請你幫我看一下履歷。<br>Should I include my parents' names?／要寫我爸媽的名字嗎？              | resume／履歷／T1007<br>mother／母親／N338<br>father／父親／N448<br>child／小孩／N102<br>add／加上／N414<br>detail／（個人）資料；細節／N472                                                               | —                                  | —      | 8           |
| t2   | 寫學歷               | Where do I put my education?／學歷要寫在哪裡？<br>Do I list my high school too?／高中也要寫進去嗎？                                    | education／學歷／N531<br>date／日期／N483<br>continue／繼續（念）／N308<br>college／大學（口語通稱，也指學院）／N739<br>degree／學位／N798<br>university／大學（正式名稱）／N968<br>graduate／畢業／N1548 | —                                  | —      | 9           |
| t3   | 在台灣的工作經歷     | I've never written one in English.／我從來沒用英文寫過履歷。<br>I've had several jobs in Taiwan.／我在台灣做過好幾份工作。             | ever／曾經／N317<br>once／一次／N265<br>past／過去的／N330<br>history／（工作）經歷／N385<br>mention／提到／N564<br>recently／最近／N638<br>description／（工作內容）說明／N1492                          | 現在完成式（ever / never）         | —      | 9           |
| t4   | 讀履歷範例           | Could I see an example first?／可以先看一份範例嗎？<br>This one looks pretty clear.／這份看起來蠻清楚的。                              | main／主要的／N453<br>true／真實的／N478<br>describe／描述／N457<br>document／文件／N882<br>sentence／句子／N1099<br>background／背景／N1223<br>relevant／相關的／N1504                                   | —                                  | —      | 9           |
| t5   | 技能和語言           | I grew up speaking Chinese.／我從小就說中文。<br>Is Chinese a useful skill for this job?／中文對這份工作有幫助嗎？                     | language／語言／N360<br>type／打字／N389<br>special／特別的／N443<br>explain／解釋／N489<br>foreign／外國的／N633<br>skill／技能／N685<br>certificate／證照；證書／T159                                   | —                                  | —      | 9           |
| t6   | 請 Mia 看草稿        | I've just finished my first draft.／我剛寫完第一版草稿。<br>I haven't sent it yet.／我還沒寄出去。                                     | already／已經／N302<br>while／在……的時候／N155<br>stay／留下來／N345<br>prepare／準備／N604<br>review／仔細看過；檢查／N730<br>mistake／錯誤／N1152<br>rewrite／重寫／T145                                | 現在完成式（just / already / yet） | —      | 9           |
| t7   | 加上推薦人，寄出應徵 | Sorry, what's a reference?／不好意思，推薦人是什麼？<br>I'm going to send it to Harbor Trading today.／我今天就要寄給 Harbor Trading。 | complete／完整的／N581<br>option／選擇；方式／N860<br>separate／分開的；另外的／N890<br>previous／之前的／N922<br>attach／附上（檔案）／N1742<br>signature／簽名／T252<br>cover letter／求職信／N424      | —                                  | —      | 9           |
| t8   | 角色扮演大挑戰       | —                                                                                                                                      | —                                                                                                                                                                                                         | —                                  | —      | 0（只複習） |

小計：14 個詞塊、48 個單字。

- 之後再出現的題型：t2 句子填空、t4 讀履歷範例、t5 聽對話答題（2 題）、t6 聽力填空、t7 打字拼字。
- 閱讀素材（t4）：Ms. Lopez 給的一份辦公室助理履歷範例，只有 Education、Work Experience、Skills、Languages 四段，每段幾行短句，例如 "Office assistant, 2019-2023. Main work: answering the phone, writing emails."、"Languages: Chinese, English (good)"；題目問主要工作、會的語言、哪一段寫學歷。推薦人留到 t7 才出現。
- 聽對話答題（t5）：Ms. Lopez 問玩家會哪些語言、打字快不快、有沒有證照，再說明 Harbor Trading 常跟台灣的公司往來，所以中文是加分；兩題分別問「顧問建議把語言寫在哪一段」和「為什麼中文對這份工作有用」。
- 請人確認：
  - t1「要寫我爸媽的名字嗎？」是刻意的文化對比：台灣履歷常寫家庭、年齡、照片，美式履歷不寫；Ms. Lopez 的回答帶出 mother、father、child（"No, don't add your mother, father or children."）。
  - t2 college 和 university 刻意一起教，中文已分開；請英文好的人確認這樣的對比對 A2 是否值得。
  - t3 "I've had several jobs in Taiwan." 假設玩家在台灣做過不只一份工作（辦公室或店裡），仍不指定公司或學校。
  - 原本排的 ability、expert、recommendation、paperwork 依審閱意見拿掉了，後面的地點沒有用到這四個字。
  - t7 cover letter 是兩個字的單字條目，排名以 cover 計。

### 17 面試（`interview`）

- NPC：`front_desk` 前台人員（新角色，Harbor Trading 的櫃台，只在 t1；不是第一幕診所的櫃台）、`manager` 辦公室主管 Ms. Carter（t2～t7 的面試官，也是下一站打電話通知錄取的同一個人）
- 場景：十一月初到 Harbor Trading 面試辦公室助理：前台報到、寒暄、自我介紹、上一份工作、為什麼想來、優點和缺點、輪到自己發問。不談薪水、不給結果（錄取的電話在下一個地點）。

| 任務 | 標題           | 新詞塊（英文／中文）                                                                                                                           | 新單字（英文／中文／排名）                                                                                                                                                                                   | 文法                             | 新題型 | 新項目數    |
| ---- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------- | ------ | ----------- |
| t1   | 前台報到       | Hi, I have an interview at ten.／你好，我十點有面試。<br>Should I fill anything out first?／我需要先填什麼嗎？                                 | interview／面試／N784<br>mind／介意／N341<br>fine／沒問題；好／N597<br>certainly／當然／N536<br>wish／祝（你…）／N524<br>manager／主管；經理／N661                                                           | —                                | —      | 8           |
| t2   | 見面寒暄       | Thanks for meeting with me today.／謝謝您今天撥空見我。<br>I love it here, and people are so friendly.／我很喜歡這裡，大家都好友善。           | love／很喜歡／N229<br>especially／尤其／N460<br>couple／幾個（a couple of）／N514<br>season／季節／N750<br>introduce／介紹／N772<br>positive／正面的；好的／N859<br>impression／印象／N1717                  | —                                | —      | 9           |
| t3   | 自我介紹       | I've been in this town since August.／我從八月就住在這個鎮上了。<br>I've studied English for many years.／我學英文學了很多年。                 | since／自從／N191<br>expect／預料；預期／N314<br>suggest／建議／N329<br>difficult／困難的／N470<br>personal／個人的／N585<br>challenge／挑戰／N766<br>independent／獨立的／N1006                             | 現在完成式（for / since）        | —      | 9           |
| t4   | 上一份工作     | I answered the phone and wrote emails.／我接電話、寫 email。<br>I also took care of orders and planned meetings.／我也負責處理訂單和安排會議。 | share／共用；分享／N353<br>focus／專心；專注／N550<br>effort／努力／N577<br>attention／注意力／N578<br>communication／溝通／N991<br>responsible／負責的／N1082<br>respond／回覆／N1116                       | —                                | —      | 9           |
| t5   | 為什麼想來這裡 | I heard it's a great place to work.／我聽說這裡是很棒的工作環境。<br>I'm looking for a chance to grow.／我在找一個可以成長的機會。             | believe／相信／N225<br>reason／理由／N256<br>future／未來／N370<br>opportunity／機會／N520<br>respect／尊重／N681<br>success／成功／N725<br>goal／目標／N856                                                 | —                                | —      | 9           |
| t6   | 優點和缺點     | I'm not the fastest, but I'm very careful.／我不是最快的，但我很細心。<br>My English isn't very strong yet.／我的英文還不是很好。              | strong／強的；好的／N461<br>improve／進步；改善／N508<br>patient／有耐心的／N589<br>fail／失敗／N711<br>stress／壓力／N1044<br>strength／優點；長處／N1263<br>weak／弱的；不擅長的／N1685                    | 最高級（the most…, my biggest…） | —      | 9           |
| t7   | 輪到你發問     | Could I ask about the working hours?／可以問一下上班時間嗎？<br>When would you need me to start?／您希望我什麼時候開始上班？                   | matter／要緊（doesn't matter）／N340<br>agree／同意／N420<br>discuss／討論／N605<br>opinion／意見；看法／N656<br>depend／看情況（depend on）／N731<br>immediately／馬上；立刻／N988<br>attitude／態度／N1094 | —                                | —      | 9           |
| t8   | 角色扮演大挑戰 | —                                                                                                                                              | —                                                                                                                                                                                                            | —                                | —      | 0（只複習） |

小計：14 個詞塊、48 個單字。

- 之後再出現的題型：t2 句子填空、t4 讀職務說明、t5 聽對話答題（2 題）、t6 聽力填空、t7 打字拼字。
- 閱讀素材（t4）：Ms. Carter 遞來的職務說明（約 25 字）：「Office Assistant／Answer phones, write emails／Take care of orders／Plan meetings／Mon–Fri, 9–5」。題目問這份工作要做什麼、上班時間；玩家再對照自己以前做過的事回答。
- 聽對話答題（t5）：Ms. Carter 介紹辦公室：小團隊六個人，辦公室助理大多在接電話、處理訂單、安排會議；兩題分別問團隊有幾個人、助理最常做什麼。
- 請人確認：
  - 每個字的用法（台詞照這個寫）：t1 前台說「Ms. Carter, the office manager, will be right out. Do you mind waiting a few minutes?」（mind 由前台說，不用 Do you mind if…）；t2 season 配十一月的秋天，positive、impression 用固定說法 make a positive impression，由主管說；t4 attention 用 I pay attention to details.；t6 主管問 What's your biggest strength?，patient 用 I'm very patient.；t7 immediately 用 I can start immediately.，其餘用主管一句收尾（It depends. In my opinion, attitude matters most.），不要一行塞太多。
  - 前面地點教過的字（job、company、experience、skill、learn、apply…）台詞都可以用。年資在台詞裡統一說三年（I worked in an office in Taiwan for three years 只在就業服務站教，這裡不再當詞塊）。
  - 中文對 Ms. Carter 一律用「您」，上班前一天的電話也要一致。
  - weakness 不在任何字表裡，所以只教 weak；最高級只出現在 I'm not the fastest，面試官台詞可以補 biggest。
  - 請英文好的人確認：I'm not the fastest, but I'm very careful. 是否像真的面試回答。
  - 本地點單字都是抽象字，沒有需要像素圖示的字（interview 的 🤝 和第一幕撞圖、manager 只是一般人像，都改成抽象）。

### 18 上班前一天（`day_before`）

- NPC：`manager` 主管 Ms. Carter（就是面試玩家的那位辦公室主管，聲線和角色圖沿用面試那一站；t1～t4 在電話裡出現）、`neighbor` 鄰居（第一幕的鄰居，聲線和角色圖都沿用；這一站出現她的先生，只在對話裡提到）
- 場景：十一月中，Ms. Carter 打電話來通知錄取，星期一開始上班；問辦公室在哪、答應會準時、看報到須知問穿著；鄰居來道賀、一起規劃開車上班的路線；星期日晚上把東西準備好，迎接新的開始。

| 任務 | 標題           | 新詞塊（英文／中文）                                                                                                                                  | 新單字（英文／中文／排名）                                                                                                                                                                                 | 文法                                    | 新題型 | 新項目數    |
| ---- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------ | ----------- |
| t1   | 錄取通知       | I'm so happy to hear that!／聽到這個消息我好開心！<br>I'm looking forward to working with you.／很期待跟您一起工作。                                  | moment／一下（片刻）／N397<br>finally／終於／N499<br>news／消息／N546<br>accept／接受／N561<br>everyone／大家；每個人／N650<br>excited／很興奮；很期待／N1142                                              | —                                       | —      | 8           |
| t2   | 辦公室在哪裡   | Which floor is your office on?／請問辦公室在幾樓？<br>Should I wait for you in the lobby?／我要在大廳等您嗎？                                         | above／在……上面／N440<br>arrive／抵達；到／N588<br>noon／中午／T21<br>exactly／確切地；剛好／N670<br>lobby／大廳／T24<br>below／在……下面／N761<br>elevator／電梯／T45                                      | —                                       | —      | 9           |
| t3   | 答應會準時     | Sure, I'll be there by eight thirty.／好，我八點半前會到。<br>Don't worry, I won't be late.／別擔心，我不會遲到的。                                   | early／早的；提早／N197<br>soon／很快；不久／N325<br>receive／收到／N396<br>ready／準備好的／N774<br>promise／保證；答應／N829<br>confirm／確認／N1206<br>schedule／行程表；時間表／N1240                  | will / won't（承諾、預測）              | —      | 9           |
| t4   | 讀報到須知     | Thanks, I just got your email.／謝謝，我剛收到您的信。<br>Do I need to wear a suit?／我需要穿西裝嗎？                                                 | instead／改成；取而代之／N553<br>normal／平常的；一般的／N855<br>casual／休閒的（便服）／T330<br>suit／西裝／N1122<br>tie／領帶／N1516<br>sweater／毛衣／N1567<br>formal／正式的／N1700                    | —                                       | —      | 9           |
| t5   | 鄰居來道賀     | Guess what, I start work on Monday!／你猜怎麼樣，我星期一就要開始上班了！<br>My family in Taiwan will be so happy.／我在台灣的家人一定會很開心。      | real／真正的／N354<br>holiday／（年底）假期／N742<br>beautiful／漂亮的；美麗的／N792<br>husband／先生（丈夫）／N801<br>favorite／最喜歡的／N1000<br>celebrate／慶祝／N1608<br>proud／驕傲；以……為榮／N1890 | —                                       | —      | 9           |
| t6   | 規劃上班路線   | I'm going to leave early to miss the traffic.／我要早點出門，避開塞車。<br>So I have to go across the bridge?／所以我要過那座橋？                     | along／沿著／N388<br>toward／朝著；往／N406<br>pass／經過／N416<br>middle／中間／N836<br>direction／方向／N952<br>traffic／交通；車流／N1225<br>route／路線／N1410                                         | —（混合複習 going to / will / have to） | —      | 9           |
| t7   | 新生活的前一晚 | Everything is ready for my first day.／第一天要用的東西都準備好了。<br>Thanks for all your help since I moved here.／謝謝你從我搬來以後幫了我這麼多。 | life／生活／N111<br>wonder／想知道；好奇／N665<br>stuff／東西／N752<br>anyone／任何人／N754<br>anyway／反正；總之／N893<br>clock／時鐘；鬧鐘／N932<br>colleague／同事／N1251                               | —                                       | —      | 9           |
| t8   | 角色扮演大挑戰 | —                                                                                                                                                     | —                                                                                                                                                                                                          | —                                       | —      | 0（只複習） |

小計：14 個詞塊、48 個單字。

- 之後再出現的題型：t2 句子填空、t4 讀報到須知、t5 聽對話答題（2 題）、t6 聽力填空、t7 打字拼字。
- 閱讀素材（t4）：Ms. Carter 寄來的報到須知 email，60 字以內：星期一 8:30 到一樓大廳（lobby），搭電梯（elevator）上三樓；要帶 ID 和銀行卡（薪水入帳用，接回銀行那一站）；服裝寫「Dress: casual. No suit or tie.」，平常的襯衫或毛衣（sweater）就可以。
- 聽對話答題（t5）：鄰居帶了一束很漂亮的花來道賀，說「Let's celebrate!」，邀玩家星期六晚上六點來她家吃飯，她先生會煮玩家最喜歡的菜，還問玩家年底放假（the holidays，感恩節到聖誕節）會不會回台灣；2 題問「晚餐是什麼時候」和「誰會下廚」。
- 請人確認：
  - 有 2 個字是另外加的：excited（接到錄取電話最自然的反應）和 casual（報到須知寫「Dress: casual.」少不了它）。
  - t3 的「by eight thirty」裡的 by，在整體課程規劃裡算第三幕的商務介系詞，但說法很自然，所以保留。
  - t4 的單字平均排名比前後任務高，因為 formal、tie、sweater、casual 都是講穿著時少不了的字。
  - 圖示：lobby、stuff 改成抽象；tie 改用 🪢（👔 在第一幕已經是 shirt）；traffic 要畫成一排車，不要畫紅綠燈；這一站現在只有 7 個要畫的字。
  - 原本排的 supervisor、calendar、sister、briefcase 依審閱意見拿掉了：supervisor、calendar 留給第三幕；sister 會假設玩家的家庭背景；briefcase 已經過時。

## 3. 請你決定的事

這些是排表時我先選了一個做法的地方。你不同意的話，改起來的範圍寫在後面。

| #   | 我先選的做法                                                                                                                                       | 如果要改                                                                |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 1   | 第二幕教 342 個單字、112 個詞塊（規格原本估 400 個單字）                                                                                           | 要到 400 個，每個任務得多 1 個字，8 個地點都要重排                      |
| 2   | 玩家八月搬來；在台灣做過辦公室工作；說中文長大。詞塊裡有 I moved to town in August.、I worked in an office in Taiwan.、I grew up speaking Chinese. | 只影響就業服務站、履歷、面試的幾個詞塊                                  |
| 3   | 修車地點：前半是廚房水槽漏水找房東，後半是玩家買了二手車送修（第一幕玩家說過沒有車，所以台詞會交代是剛買的）                                       | 改成腳踏車或只做居家維修的話，只重排這一個地點                          |
| 4   | 應徵的是貿易公司 Harbor Trading 的辦公室助理；面試官就是之後的主管 Ms. Carter。第三幕會在這家公司上班（採購、出貨、客服、出差都說得通）            | 換公司或職位：影響最後四個地點的台詞，詞塊只有 1 句提到公司名           |
| 5   | 英國口音給圖書館員                                                                                                                                 | 換給別的角色不影響這份表，只影響聲線                                    |
| 6   | 三種新題型都做，位置如第 1 節                                                                                                                      | 少做一種：那幾個任務改用已有的題型，不用重排                            |
| 7   | 只有 41 個單字畫像素圖，其餘顯示 emoji。面試一個都沒有（全是抽象字）                                                                               | 想多畫：把標成抽象的具體字改回來即可（例如 floor、lobby、page、laptop） |
| 8   | 圖書館 t4 一次教一月到六月 6 個月份（第一幕也是一個任務教 5 個星期）                                                                               | 想分散：和社區中心的月份對調幾個                                        |
| 9   | 沒教 withdraw（提款用口語的 take out）、weakness（只教 weak）；part time、full time 寫成兩個字                                                     | 要教的話各占一個單字的位子                                              |
| 10  | 上班前一天 t3 的 I'll be there by eight thirty. 用了 by（規格把 by 排在第三幕的商務介系詞）                                                        | 可以改成 at eight thirty                                                |

另外三件事不在這份表裡，但做第二幕之前要定：

- **第一幕沒玩完能不能玩第二幕**：2026-11-24 已做好：前一幕每個任務都玩過一次，下一幕才打開（見 [ui-flow.md](ui-flow.md)）。
- **第二幕結業考**：2026-11-24 已做好，四幕的結業考都有，規則見 [curriculum.md](curriculum.md)。
- **規格列的其他第二幕旋鈕**（熟的句子自動隱藏中文、選項只顯示文字、干擾選項用同一類的字）：這次沒排，第二幕已經同時加長句子、加長劇情、加閱讀、加口音、加三種題型。

## 4. 審稿紀錄（2026-11-22）

8 份草稿合併後，兩位審稿者各看了全部 8 個地點。照意見改掉的主要問題：

- **經歷重複**：「我以前在辦公室工作」原本在三個地點各教一次，「剛搬來」也是。現在只在就業服務站 t2 教一次，履歷和面試改成別的句子。
- **字的順序**：job、computer 原本排在後面的地點才教，可是電腦課和找工作從社區中心就開始了。現在 job、computer、screen、keyboard、mouse 都在社區中心教，後面的地點直接用。
- **時間線**：月份原本是一到六月在社區中心、七到十二月在圖書館，和故事的季節對不上。對調後，社區中心教的七到十二月正好是課程表上的月份。
- **文法提早出現**：有 4 個詞塊在還沒教 will 的地方用了 will，1 個提早用比較級，1 個用了第四幕的名詞子句，都改掉了。
- **多句的詞塊**：最後兩個地點有 4 個詞塊其實是兩三句話，沒辦法當一題排句子，都改成一句。
- **近義字**：社區中心拿掉 program、lesson（和 class、course 太像），履歷拿掉 ability、recommendation、expert、paperwork。
- **面試官和主管**：原本是兩個角色，合成 Ms. Carter 一個人。

112 個詞塊裡改了 39 個，342 個單字裡換了 50 個。審稿者提的建議沒採用的，原因都寫在各地點的「請人確認」。

還沒做的審閱：

- 使用者同意照這份表做（見開頭的狀態）；做出來的台詞、小劇場和發音，使用者都還沒看過。
- 句子還沒請英文好的人看過。兩位審稿者都是 AI；做出來的台詞寫完後也只做過一輪編修，沒有真人讀過。

## 5. 做出來和表格不同的地方（2026-11-23）

用腳本把上面 8 個地點的表格和 `src/data/units/*.json` 逐格比對過：64 列任務；每個任務的標題、詞塊和單字的英文與中文、順序、新項目數，還有「新題型」那一欄標的任務（銀行 t5、社區中心 t4、修車與維修 t5）。

- **一樣的**：任務標題、每個任務教的詞塊和單字（英文和順序）、新項目數、文法和新題型第一次出現的任務、每個地點 14 個詞塊。342 個單字和 112 個詞塊的英文完全照表。
- **中文不一樣的**：只有一處，已經照單元 JSON 改進上面的表格。

| 地點       | 項目                           | 原本寫的           | 做出來的           |
| ---------- | ------------------------------ | ------------------ | ------------------ |
| 上班前一天 | Which floor is your office on? | 你們辦公室在幾樓？ | 請問辦公室在幾樓？ |

- **字和詞塊沒有調整**：沒有任何單字或詞塊換掉、增減或移到別的任務。
- **題型的位置照第 1 節**：句子填空、讀短文、聽對話答題第一次出現的任務和之後每個地點固定再出現的位置，都和第 1 節的兩張表一樣。題數：句子填空 17 題（銀行 t5 有 3 題，其他地點的 t2 各 2 題）；讀短文 8 篇、12 題（就業服務站 t4 有兩篇）；聽對話答題 5 段、8 題、26 句；聽力填空 24 題（每個地點的 t6 各 3 題）；讀招牌 2 題（銀行 t4）；看圖選句 4 題（社區中心 t5、圖書館 t5 各 2 題）；打字拼字 40 個字（每個地點的 t7 各 5 個字）。
- **表格留著沒定的：t4 的短文和 t5 的對話**。表格只寫了大概的題材，實際做成這樣（字數是標題加內文，用空白分開來數）：

| 地點       | t4 短文                                                                              | t5 對話                                                  |
| ---------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| 銀行       | 兩張招牌：營業時間牌、提款機畫面（各 1 題，是招牌不是短文）                          | —                                                        |
| 社區中心   | 傳單（課程表），34 字，1 題：幾月開課                                                | —                                                        |
| 圖書館     | 公告（Library Notices，幾則消息），42 字，1 題：星期二英文夜什麼時候開始             | —                                                        |
| 修車與維修 | 簡訊（師傅 Tony 的估價），44 字，2 題：噪音從哪裡來、總共多少錢                      | 5 句，路人和師傅，1 題：什麼時候可以來拿車               |
| 就業服務站 | 兩篇廣告（Harbor Trading 的辦公室助理、Rosa's 餐廳的服務生），37 字和 28 字，各 1 題 | 5 句，路人和顧問，1 題：哪份工作有晚班                   |
| 履歷       | 表格（履歷範例），41 字，2 題：主要工作是什麼、什麼時候大學畢業                      | 5 句，顧問和路人，2 題：語言要寫在哪裡、為什麼中文有用   |
| 面試       | 公告（職務說明），30 字，2 題：上班時間、一項工作內容                                | 6 句，前台人員和主管，2 題：團隊有幾個人、助理最常做什麼 |
| 上班前一天 | email（報到須知），52 字，2 題：要帶什麼、穿什麼                                     | 5 句，鄰居和「你」，2 題：晚餐什麼時候、誰要煮           |

和第 2 節各地點「閱讀素材」「聽對話答題」舉的例子不同的地方：社區中心的傳單標題是 Basic Computer Class for Adults，只有 1 題（例子裡還有結業月份、上課時間、空位）；圖書館的公告是一篇標題叫 Library Notices 的短文，把博覽會、英文夜、書展等幾則消息列在一起，不是分成三張公告；修車與維修的簡訊是引擎沒問題、噪音從後面來，估價 $340（例子是煞車和輪胎，$520）；履歷範例的題目問主要工作和畢業時間，沒有問語言寫在哪一段；上班前一天的鄰居邀的是星期六晚上六點的晚餐，沒有談年底放假。這些是做的時候定的細節，不影響哪個任務教哪些字。

- **對話的另一位說話者**：修車與維修、就業服務站、履歷這三段對話的另一位說話者是「路人」（`passerby`）的聲線，指另一位客人或求職者；上班前一天那一段的另一位是「你」（`guide`）。表格沒有寫這一點。
- **角色**：照第 1 節的角色表，7 個新角色都出現了。大挑戰（t8）有兩個 NPC 的是社區中心（老師和志工 Ben）、修車與維修（師傅和房東）、履歷（顧問和 Mia）、面試（前台和主管）、上班前一天（主管和鄰居）；銀行、圖書館、就業服務站只有一位。
- **教了、但沒有出現在任何劇情台詞或題目裡的單字**：社區中心的 `interest`、履歷的 `option`、面試的 `fail`、上班前一天的 `middle`、`direction`、`anyone`。它們只在介紹卡和單字題裡用到；規則只要求教過的字之後可以用，沒有要求一定要用。
- **沒教過的字**：8 個地點的 64 段劇情裡，3 段各用了一個沒教過的字：圖書館 t4 的 company、面試 t1 的 luck、上班前一天 t7 的 alarm，都符合「每段最多一個」的規則，其他任務和 8 個大挑戰學過的字都是 100%。每個任務的分數見 [curriculum.md](curriculum.md) 的「第二幕的分數」。
- **小劇場和單字圖**：41 個單字像素圖的分配和第 1 節的數字一樣（銀行 4、社區中心 10、圖書館 5、修車與維修 8、就業服務站 2、履歷 5、面試 0、上班前一天 7）。表格裡「想多畫」的字（floor、lobby、page）維持抽象，只顯示 emoji。
