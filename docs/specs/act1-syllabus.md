# 第一幕「新生活」詞塊、單字、文法分配表

狀態：規劃中（2026-11-22 使用者審過，內容還沒照這份做）。規則來自 [curriculum.md](curriculum.md)。排名用 `src/data/wordlists/` 的字表和 `src/content/vocab.ts` 的查法（和 `scripts/vocab-report.mjs` 一樣）。

使用者 2026-11-22 決定：

- 地點順序：咖啡廳在便利商店前面。
- 平滑規則 3：短劇情最多 1 個沒教過的字。所以常用口語字、數字、星期、時間字排到前面教。
- 新項目數**把對比詞也算進去**。所以搬家第一天 t1～t3 是 6 個（2 詞塊 + 2 單字 + 2 對比詞）。
- 數字 two～nine 在搬家第一天正式教（聽數字是多益聽力的重點，咖啡廳一開始就要說價錢）。
- 便利商店 t7 教 else（No, nothing else. Thanks.）。
- 接受既有劇情改寫時刪掉的內容（第 3 節）。

## 1. 總覽

### 總數

- 10 個地點 × 8 個任務 = 80 個任務。第 8 個任務是角色扮演大挑戰，只複習，所以有新內容的任務是 70 個。
- 新詞塊：**140 個**（每個任務 2 個；咖啡廳 t1 只有 1 個、t3 有 3 個，是既有內容）。
- 新單字：**301 個**。
- 搬家第一天另有 6 組對比詞（既有）。
- 新項目共 447 個（詞塊 + 單字 + 對比詞）。

| 字表分級          | 單字數 |
| ----------------- | ------ |
| NGSL ≤ 500        | 75     |
| NGSL 501–1000     | 65     |
| NGSL 1001+        | 98     |
| TSL               | 35     |
| SUP（數字、星期） | 23     |
| 字表外            | 5      |

- NGSL ≤ 1000 占 47%；加上數字和星期是 54%。
- 字表外的 5 個：latte、muffin（既有）、banana、fever、scissors。
- 人已經同意：大挑戰不教新內容，所以約 140 個詞塊、約 300 個單字就可以。

### 新項目數的曲線（照遊玩順序）

新項目數 = 新詞塊 + 新單字 + 新對比詞。R = 大挑戰（0 個新項目）。

```
1 搬家第一天    6 6 6 6 6 6 6 R
2 咖啡廳        4 4 4 5 6 6 6 R
3 便利商店      5 5 5 6 6 6 6 R
4 街道與公車站  5 6 6 7 7 7 7 R
5 超市與市集    6 6 6 7 7 7 7 R
6 服飾店        6 7 7 7 7 7 7 R
7 診所與藥局    6 7 7 7 7 7 7 R
8 餐廳與聚會    6 7 7 7 7 7 7 R
9 郵局          6 7 7 7 7 7 7 R
10 公園與社區   6 7 7 7 7 7 7 R
```

- 搬家 t4～t7 用 4 個單字代替原本 t1～t3 的「2 單字 + 2 對比詞」，所以整個地點都是 6 個。
- 相鄰任務最多 +1。往下降只出現在新地點的 t1：搬家 → 咖啡廳降 2（既有內容只有 4 個），其他降 1。
- 每個任務的新單字：搬家 4 個（其中一半是數字），咖啡廳和便利商店 3～4 個，第 4 個地點 t4 起 5 個，之後新地點的 t1 降到 4 個。
- 「一次只轉一個旋鈕」：教文法、出新題型的任務，新項目數都和前一個任務一樣。

### 常用口語字什麼時候教

這些字在劇情裡一直出現，不在 NGSL 前 100 名，所以要正式教。表裡的「詞塊」表示這個字在那個任務的詞塊裡，算教過。

| 字                              | 哪裡教            | 怎麼教                                                     |
| ------------------------------- | ----------------- | ---------------------------------------------------------- |
| yes、nice                       | 搬家 t1（既有）   | 詞塊                                                       |
| please、thanks                  | 搬家 t3（既有）   | 詞塊                                                       |
| welcome                         | 搬家 t4           | 單字                                                       |
| help、sure、problem             | 搬家 t4           | 詞塊 Can you help me with this box? / Sure, no problem.    |
| home                            | 搬家 t5           | 單字                                                       |
| hi、sorry、name                 | 搬家 t6           | 詞塊 Hi, I'm your new neighbor. / Sorry, what's your name? |
| okay                            | 搬家 t6           | 單字                                                       |
| call、anything                  | 搬家 t7           | 詞塊 Call me if you need anything.                         |
| again                           | 咖啡廳 t3（既有） | 詞塊                                                       |
| excuse                          | 便利商店 t1       | 詞塊 Excuse me, do you have milk?                          |
| last                            | 便利商店 t3       | 詞塊 Is this the last one?                                 |
| too                             | 便利商店 t4       | 詞塊 Can I get a fork, too?                                |
| bye                             | 便利商店 t7       | 詞塊 Bye, see you tomorrow!                                |
| today、tomorrow、morning、night | 便利商店 t7       | 單字                                                       |
| wait、minute、hour              | 街道 t5           | 單字                                                       |

數字和星期：

| 字                                        | 哪裡教                                                     |
| ----------------------------------------- | ---------------------------------------------------------- |
| two～nine                                 | 搬家 t4～t7，每個任務 2 個（劇情裡可以用在電話號碼、門牌） |
| ten、twenty、fifty、dollar                | 便利商店 t5（付錢）                                        |
| thirteen、thirty、fifteen、forty、hundred | 超市 t5（聽 -teen 和 -ty 的差別）                          |
| Monday～Friday                            | 街道 t6（公車時刻表）                                      |
| Saturday、Sunday、week、weekend、evening  | 餐廳 t5（約時間）                                          |

還沒教的常用字：hello、fine、else、ready、soon。great 到超市 t7、friend 到餐廳 t1 才教。這些都在 NGSL 前 1000 名內（hello 除外），劇情可以拿來當「唯一一個沒教過的字」，但同一段只能用一個。見第 4 節。

### 文法第一次出現

| 文法                 | 地點與任務        | 詞塊                                                              |
| -------------------- | ----------------- | ----------------------------------------------------------------- |
| be 動詞              | 1 搬家 t2（既有） | I'm from Taiwan.                                                  |
| can                  | 1 搬家 t3（既有） | Can you speak more slowly, please?                                |
| 現在簡單式           | 1 搬家 t5         | Yes, I live alone. / No, I don't have a car.                      |
| 祈使句               | 1 搬家 t7         | Please come in. / Call me if you need anything.                   |
| there is/are         | 2 咖啡廳 t6       | Is there Wi-Fi here? / Is there a table outside?                  |
| 冠詞 a / an / the    | 3 便利商店 t3     | I need an umbrella. / Is this the last one?                       |
| 單複數               | 3 便利商店 t6     | Can I get two of these? / Where are the batteries?                |
| some / any           | 4 街道 t3         | I need some coins for the bus. / Do you have any change?          |
| 可數與不可數         | 5 超市 t3         | I need some rice and some eggs. / Two bottles of water, please.   |
| How much / How many  | 5 超市 t6         | How much are the tomatoes? / How many are in a bag?               |
| 現在進行式           | 6 服飾店 t3       | I'm looking for a warm coat. / Yes, someone is helping me.        |
| want to              | 7 診所 t3         | I want to get a flu shot.                                         |
| like + -ing          | 8 餐廳 t3         | I really like cooking.                                            |
| 地點和時間介系詞     | 8 餐廳 t5         | See you on Friday at seven! / Let's meet in front of the station. |
| 過去式（be）         | 8 餐廳 t7         | It was great, thanks. / The food was really good.                 |
| 過去式（規則動詞）   | 9 郵局 t3         | I mailed it last week. / I missed the delivery.                   |
| 過去式（不規則動詞） | 10 公園 t3        | I saw your poster. / I had a great time.                          |

- 換順序後重新檢查過：每個任務最多一個文法點；不放在地點的 t1；不和新題型或項目數增加放在同一個任務。
- 換順序後，there is/are 從便利商店移到咖啡廳 t6，冠詞和單複數都放在便利商店。順序又和 curriculum.md 一樣了。
- 唯一和 curriculum.md 順序不同的地方：can（搬家 t3，既有）比現在簡單式（搬家 t5）早。

### 新題型第一次出現

| 題型                          | 地點與任務    | 為什麼放這裡                                                                                                                                                   |
| ----------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 打字拼字                      | 3 便利商店 t7 | 要自己拼出來，是最難的基礎題型。等學過兩個地點的短字再開始，第一次只考搬家和咖啡廳的字（key、box、door、tea、cake）。這個任務沒有文法，項目數持平。            |
| 聽力填空                      | 4 街道 t6     | 和打字拼字隔開一個地點。公車對話很適合挖空。第一次只挖前面學過的字（bus、stop、left、minute），不挖這個任務新教的星期。                                        |
| 讀招牌／價目（多益第 7 大題） | 6 服飾店 t5   | curriculum.md 說第一幕後段，第 6 個地點是後半的開頭。數字和 price、each、cheap 已經學過，服飾店有很多價目牌和招牌（Shirts $15、Fitting Room）。                |
| 看圖選句（多益第 1 大題）     | 7 診所 t5     | 照片描述幾乎都用現在進行式，要等服飾店 t3 教過、練了一整個地點。動作字已經學過：sit、stand、wait、walk、read、eat、drink、wear、buy。第一次只用 2 個文字選項。 |

## 2. 各地點分配

排名欄：`N123` = NGSL 第 123 名，`T45` = TSL 第 45 名，`S` = 補充字表，`外` = 字表外。兩個字的詞（trash can）取比較少見的那個字。變化形對回原形查（pants → pant）。

### 1 搬家第一天（`move_in`）

- NPC：`landlord` 房東 Mr. Bell、`neighbor` 鄰居
- 場景：搬進小鎮的公寓，房東交鑰匙、介紹房子，再認識隔壁鄰居。

| 任務       | 標題           | 新詞塊（英文／中文）                                                                                   | 新單字（英文／中文／排名）                                                  | 文法                        | 新題型 | 新項目數           |
| ---------- | -------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- | --------------------------- | ------ | ------------------ |
| t1（既有） | 見到房東       | Yes, I just moved in.／對，我剛搬進來。<br>Nice to meet you.／很高興認識你。                           | key／鑰匙／N659<br>box／箱子／N861                                          | —                           | —      | 6（含 2 組對比詞） |
| t2（既有） | 名字怎麼拼     | I'm from Taiwan.／我來自台灣。<br>How do you spell that?／那個怎麼拼？                                 | door／門／N490<br>chair／椅子／N1060                                        | be 動詞（既有，I'm = I am） | —      | 6（含 2 組對比詞） |
| t3（既有） | 垃圾怎麼丟     | Can you speak more slowly, please?／可以請你說慢一點嗎？<br>Got it. Thanks!／了解，謝謝！              | lamp／檯燈／T247<br>trash can／垃圾桶／T385                                 | can（既有，Can you…? 請求） | —      | 6（含 2 組對比詞） |
| t4         | 搬箱子         | Can you help me with this box?／可以幫我搬這個箱子嗎？<br>Sure, no problem.／好啊，沒問題。            | welcome／歡迎／N989<br>room／房間／N254<br>two／二／S<br>three／三／S       | —                           | —      | 6                  |
| t5         | 聊聊自己       | Yes, I live alone.／對，我一個人住。<br>No, I don't have a car.／沒有，我沒有車。                      | home／家／N161<br>car／汽車／N260<br>four／四／S<br>five／五／S             | 現在簡單式                  | —      | 6                  |
| t6         | 認識鄰居       | Hi, I'm your new neighbor.／嗨，我是你的新鄰居。<br>Sorry, what's your name?／不好意思，你叫什麼名字？ | okay／好；可以／N925<br>neighbor／鄰居／N1222<br>six／六／S<br>seven／七／S | —                           | —      | 6                  |
| t7         | 請鄰居進來坐   | Please come in.／請進。<br>Call me if you need anything.／需要什麼就打給我。                           | phone／電話；手機／N479<br>sofa／沙發／T216<br>eight／八／S<br>nine／九／S  | 祈使句                      | —      | 6                  |
| t8         | 角色扮演大挑戰 | —                                                                                                      | —                                                                           | —                           | —      | 0（只複習）        |

小計：14 個詞塊、22 個單字。

### 2 咖啡廳（`cafe`）

- NPC：`barista` 店員
- 場景：小鎮的咖啡廳：點飲料、選大小、找位子。

| 任務       | 標題               | 新詞塊（英文／中文）                                                                                              | 新單字（英文／中文／排名）                                                                 | 文法         | 新題型 | 新項目數    |
| ---------- | ------------------ | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------ | ------ | ----------- |
| t1（既有） | 點一杯拿鐵         | Can I get a latte, please?／可以給我一杯拿鐵嗎？                                                                  | latte／拿鐵／外<br>tea／茶／N1599<br>muffin／瑪芬／外                                      | —            | —      | 4           |
| t2（既有） | 內用還是外帶       | For here or to go?／內用還是外帶？<br>To go, please.／外帶，謝謝。                                                | water／水／N322<br>cake／蛋糕／N2173                                                       | —            | —      | 4           |
| t3（既有） | 付錢，還有聽不懂時 | How much is it?／這多少錢？<br>Sorry, can you say that again?／不好意思，可以再說一次嗎？<br>Here you go.／給你。 | sandwich／三明治／T112                                                                     | —            | —      | 4           |
| t4         | 冰的，不加糖       | Can I get an iced coffee?／可以給我一杯冰咖啡嗎？<br>No sugar, please.／不加糖，謝謝。                            | coffee／咖啡／N1395<br>ice／冰塊／N1554<br>sugar／糖／N2234                                | —            | —      | 5           |
| t5         | 大杯小杯           | What sizes do you have?／有哪幾種大小？<br>A small one, please.／小杯的，謝謝。                                   | small／小的／N186<br>large／大的／N210<br>medium／中的（中杯）／N689<br>cookie／餅乾／T671 | —            | —      | 6           |
| t6         | 外面有位子嗎       | Is there Wi-Fi here?／這裡有 Wi-Fi 嗎？<br>Is there a table outside?／外面有桌子嗎？                              | table／桌子／N450<br>window／窗戶／N734<br>outside／外面／N491<br>inside／裡面／N660       | there is/are | —      | 6           |
| t7         | 這裡有人坐嗎       | Is this seat taken?／這個位子有人坐嗎？<br>No, go ahead.／沒有，請坐。                                            | sit／坐／N356<br>seat／座位／N852<br>read／讀／N207<br>book／書／N171                      | —            | —      | 6           |
| t8         | 角色扮演大挑戰     | —                                                                                                                 | —                                                                                          | —            | —      | 0（只複習） |

小計：14 個詞塊、21 個單字。

### 3 便利商店（`store`）

- NPC：`clerk` 店員
- 場景：樓下的便利商店：找東西、微波午餐、付錢。

| 任務 | 標題           | 新詞塊（英文／中文）                                                                            | 新單字（英文／中文／排名）                                                                  | 文法              | 新題型   | 新項目數    |
| ---- | -------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------- | -------- | ----------- |
| t1   | 找東西         | Excuse me, do you have milk?／不好意思，有賣牛奶嗎？<br>Where can I find it?／在哪裡可以找到？  | milk／牛奶／N1789<br>egg／蛋／N1381<br>bread／麵包／N2262                                   | —                 | —        | 5           |
| t2   | 只買這個       | Just this, please.／就這個，謝謝。<br>No bag, thanks.／不用袋子，謝謝。                         | money／錢／N201<br>drink／飲料；喝／N655<br>bag／袋子／N1252                                | —                 | —        | 5           |
| t3   | 下雨了         | I need an umbrella.／我需要一把傘。<br>Is this the last one?／這是最後一個嗎？                  | rain／雨；下雨／N1232<br>umbrella／雨傘／T67<br>battery／電池／T165                         | 冠詞 a / an / the | —        | 5           |
| t4   | 幫我加熱       | Can you heat it up, please?／可以幫我加熱嗎？<br>Can I get a fork, too?／也可以給我一支叉子嗎？ | eat／吃／N476<br>hot／熱的／N885<br>lunch／午餐／N1334<br>fork／叉子／T1134                 | —                 | —        | 6           |
| t5   | 付錢           | Can I pay by card?／可以刷卡嗎？<br>Can I get a receipt?／可以給我收據嗎？                      | dollar／元（美元）／N971<br>ten／十／S<br>twenty／二十／S<br>fifty／五十／S                 | —                 | —        | 6           |
| t6   | 買兩個         | Can I get two of these?／這個可以給我兩個嗎？<br>Where are the batteries?／電池在哪裡？         | snack／零食／T130<br>candy／糖果／T663<br>chocolate／巧克力／N2620<br>newspaper／報紙／N929 | 單複數            | —        | 6           |
| t7   | 明天見         | No, nothing else. Thanks.／不用了，沒有別的了，謝謝。<br>Bye, see you tomorrow!／掰掰，明天見！ | today／今天／N246<br>tomorrow／明天／N726<br>morning／早上／N434<br>night／晚上／N270       | —                 | 打字拼字 | 6           |
| t8   | 角色扮演大挑戰 | —                                                                                               | —                                                                                           | —                 | —        | 0（只複習） |

小計：14 個詞塊、25 個單字。

### 4 街道與公車站（`street`）

- NPC：`passerby` 路人、`driver` 公車司機
- 場景：第一次自己出門：問路、等公車、上車、下車。

| 任務 | 標題             | 新詞塊（英文／中文）                                                                                                         | 新單字（英文／中文／排名）                                                                                             | 文法       | 新題型   | 新項目數    |
| ---- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------- | -------- | ----------- |
| t1   | 公車站在哪       | Excuse me, where's the bus stop?／不好意思，公車站在哪裡？<br>Is it far from here?／離這裡遠嗎？                             | street／街道／N598<br>bus／公車／N810<br>corner／轉角／N1188                                                           | —          | —        | 5           |
| t2   | 往哪邊走         | Which way is the station?／車站往哪邊走？<br>Left or right?／左邊還是右邊？                                                  | bank／銀行／N627<br>station／車站／N709<br>map／地圖／N1212<br>left／左邊／N126                                        | —          | —        | 6           |
| t3   | 要準備零錢       | I need some coins for the bus.／我需要一些零錢搭公車。<br>Do you have any change?／你有零錢嗎？                              | driver／司機／N1200<br>ticket／車票／N1249<br>coin／硬幣／N2609<br>fare／車資／T32                                     | some / any | —        | 6           |
| t4   | 這班車有到嗎     | Does this bus go downtown?／這班公車有到市中心嗎？<br>How much is the fare?／車資多少錢？                                    | school／學校／N146<br>hospital／醫院／N782<br>library／圖書館／N1162<br>museum／博物館／N1397<br>downtown／市中心／T17 | —          | —        | 7           |
| t5   | 坐多久、在哪下車 | How long does it take?／要多久？<br>Is this my stop?／這是我要下的站嗎？                                                     | stand／站／N309<br>minute／分鐘／N366<br>hour／小時／N247<br>wait／等／N403<br>front／前面／N488                       | —          | —        | 7           |
| t6   | 下一班車         | When is the next bus?／下一班公車幾點？<br>Is the bus late today?／公車今天誤點了嗎？                                        | Monday／星期一／S<br>Tuesday／星期二／S<br>Wednesday／星期三／S<br>Thursday／星期四／S<br>Friday／星期五／S            | —          | 聽力填空 | 7           |
| t7   | 迷路了           | Sorry, I'm lost. Can you help me?／不好意思，我迷路了。可以幫我嗎？<br>Can you show me on the map?／可以在地圖上指給我看嗎？ | walk／走路／N339<br>sign／招牌；標誌／N500<br>road／馬路／N521<br>taxi／計程車／N1148<br>bridge／橋／N1546             | —          | —        | 7           |
| t8   | 角色扮演大挑戰   | —                                                                                                                            | —                                                                                                                      | —          | —        | 0（只複習） |

小計：14 個詞塊、31 個單字。

### 5 超市與市集（`market`）

- NPC：`cashier` 收銀員、`vendor` 市集攤販
- 場景：週末去市集和超市採買：找東西、試吃、秤重、看價錢、結帳。

| 任務 | 標題             | 新詞塊（英文／中文）                                                                                     | 新單字（英文／中文／排名）                                                                                 | 文法                | 新題型 | 新項目數    |
| ---- | ---------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------- | ------ | ----------- |
| t1   | 蘋果在哪         | Excuse me, where are the apples?／不好意思，蘋果在哪裡？<br>Thanks, I see them.／謝謝，我看到了。        | fruit／水果／N1640<br>apple／蘋果／T623<br>orange／柳橙／N2499<br>banana／香蕉／外                         | —                   | —      | 6           |
| t2   | 市集試吃         | Can I try one?／我可以試吃一個嗎？<br>This looks really good.／這看起來很好吃。                          | fresh／新鮮的／N1309<br>vegetable／蔬菜／N2216<br>tomato／番茄／T452<br>potato／馬鈴薯／N2623              | —                   | —      | 6           |
| t3   | 一些米、兩瓶水   | I need some rice and some eggs.／我需要一些米和一些蛋。<br>Two bottles of water, please.／兩瓶水，謝謝。 | oil／油／N898<br>meat／肉／N1869<br>salt／鹽／N2459<br>rice／米；飯／N2695                                 | 可數與不可數        | —      | 6           |
| t4   | 肉攤秤重         | One pound of chicken, please.／一磅雞肉，謝謝。<br>A little more, please.／再多一點，謝謝。              | half／一半／N365<br>piece／一塊；一片／N608<br>fish／魚／N828<br>pound／磅／N984<br>chicken／雞肉／N2339   | —                   | —      | 7           |
| t5   | 排隊結帳         | Are you in line?／你在排隊嗎？<br>Can I use my own bag?／可以用我自己的袋子嗎？                          | thirteen／十三／S<br>thirty／三十／S<br>fifteen／十五／S<br>forty／四十／S<br>hundred／一百／S             | —                   | —      | 7           |
| t6   | 怎麼賣、一袋幾個 | How much are the tomatoes?／番茄怎麼賣？<br>How many are in a bag?／一袋有幾個？                         | buy／買／N242<br>price／價錢／N296<br>each／每個／N145<br>cheap／便宜的／N1095<br>expensive／貴的／N1061   | How much / How many | —      | 7           |
| t7   | 買一送一         | Is it buy one, get one free?／這是買一送一嗎？<br>Great, I'll take two.／太好了，我拿兩個。              | free／免費的／N395<br>cheese／起司／N2585<br>butter／奶油／T1033<br>pizza／披薩／T472<br>juice／果汁／T333 | —                   | —      | 7           |
| t8   | 角色扮演大挑戰   | —                                                                                                        | —                                                                                                          | —                   | —      | 0（只複習） |

小計：14 個詞塊、32 個單字。

### 6 服飾店（`clothes`）

- NPC：`assistant` 店員
- 場景：換季了，去服飾店買外套：看顏色、問尺寸、試穿、退換貨。

| 任務 | 標題           | 新詞塊（英文／中文）                                                                                        | 新單字（英文／中文／排名）                                                                                         | 文法       | 新題型       | 新項目數    |
| ---- | -------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------- | ------------ | ----------- |
| t1   | 隨便看看       | I'm just looking, thanks.／我只是看看，謝謝。<br>Where are the jackets?／外套在哪裡？                       | clothes／衣服／N956<br>shirt／襯衫／N1907<br>dress／洋裝／N899<br>jacket／夾克；外套／N2253                        | —          | —            | 6           |
| t2   | 有黑色的嗎     | Do you have this in black?／這件有黑色的嗎？<br>What size is this?／這是什麼尺寸？                          | color／顏色／N378<br>black／黑色／N411<br>white／白色／N482<br>red／紅色／N800<br>blue／藍色／N858                 | —          | —            | 7           |
| t3   | 在找一件外套   | I'm looking for a warm coat.／我在找一件保暖的外套。<br>Yes, someone is helping me.／有，已經有人在幫我了。 | wear／穿；戴／N526<br>warm／溫暖的／N1021<br>coat／大衣／N1863<br>hat／帽子／N1750<br>shoe／鞋子／N1476            | 現在進行式 | —            | 7           |
| t4   | 試穿           | Can I try it on?／我可以試穿嗎？<br>Where's the fitting room?／試衣間在哪裡？                               | size／尺寸／N705<br>green／綠色／N940<br>mirror／鏡子／N2205<br>skirt／裙子／N2451<br>pants／褲子／T372            | —          | —            | 7           |
| t5   | 合不合身       | This one fits well.／這件很合身。<br>It's a little big.／有點大。                                           | long／長的／N115<br>short／短的／N419<br>fit／合身／N700<br>tight／緊的／N2083<br>loose／鬆的／N2185               | —          | 讀招牌／價目 | 7           |
| t6   | 有打折嗎       | Is this on sale?／這件有打折嗎？<br>I'll take it.／我買這件。                                               | new／新的／N79<br>old／舊的／N144<br>sale／特價／N398<br>percent／百分比（% off）／N549<br>pair／一雙；一對／N1092 | —          | —            | 7           |
| t7   | 退換貨         | Can I return this?／我可以退這個嗎？<br>Here's my receipt.／這是我的收據。                                  | return／退回／N337<br>wrong／錯的／N575<br>exchange／換貨／N1015<br>gift／禮物／N1427<br>scarf／圍巾／T739         | —          | —            | 7           |
| t8   | 角色扮演大挑戰 | —                                                                                                           | —                                                                                                                  | —          | —            | 0（只複習） |

小計：14 個詞塊、34 個單字。

### 7 診所與藥局（`clinic`）

- NPC：`receptionist` 櫃台、`doctor` 醫生、`pharmacist` 藥師
- 場景：感冒了：掛號、說症狀、看醫生、去藥局拿藥。

| 任務 | 標題           | 新詞塊（英文／中文）                                                                             | 新單字（英文／中文／排名）                                                                                         | 文法    | 新題型   | 新項目數    |
| ---- | -------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ------- | -------- | ----------- |
| t1   | 掛號           | Do I need an appointment?／需要預約嗎？<br>Here's my insurance card.／這是我的保險卡。           | form／表格／N257<br>doctor／醫生／N763<br>nurse／護理師／N1315<br>insurance／保險／N1314                           | —       | —        | 6           |
| t2   | 哪裡不舒服     | I don't feel well.／我不太舒服。<br>My head hurts.／我頭痛。                                     | back／背／N94<br>head／頭／N259<br>eye／眼睛／N391<br>hurt／痛／N1421<br>ear／耳朵／N1664                          | —       | —        | 7           |
| t3   | 打流感疫苗     | I want to get a flu shot.／我想打流感疫苗。<br>Does it hurt?／會痛嗎？                           | hand／手／N198<br>arm／手臂／N621<br>leg／腿／N1097<br>shot／打針／N1567<br>flu／流感／T225                        | want to | —        | 7           |
| t4   | 看醫生         | I have a fever and a cough.／我發燒又咳嗽。<br>Is it serious?／嚴重嗎？                          | cold／感冒；冷的／N867<br>throat／喉嚨／N2504<br>nose／鼻子／N2114<br>cough／咳嗽／N2774<br>fever／發燒／外        | —       | —        | 7           |
| t5   | 醫生的交代     | How many pills do I take?／我要吃幾顆藥？<br>Can I go to work tomorrow?／我明天可以去上班嗎？    | sleep／睡覺／N827<br>rest／休息／N528<br>body／身體／N401<br>medicine／藥／N1761<br>pill／藥丸／T732               | —       | 看圖選句 | 7           |
| t6   | 到藥局         | Do you have something for a cough?／有治咳嗽的藥嗎？<br>Does it make you sleepy?／吃了會想睡嗎？ | sick／生病的／N1716<br>tissue／面紙／N2625<br>cream／藥膏；乳霜／N2388<br>pharmacy／藥局／T423<br>mask／口罩／T484 | —       | —        | 7           |
| t7   | 藥怎麼吃       | Do I take it with food?／要跟食物一起吃嗎？<br>Thanks for your help.／謝謝你的幫忙。             | food／食物／N367<br>glass／玻璃杯／N1042<br>meal／一餐／N1250<br>dinner／晚餐／N1117<br>breakfast／早餐／N1819     | —       | —        | 7           |
| t8   | 角色扮演大挑戰 | —                                                                                                | —                                                                                                                  | —       | —        | 0（只複習） |

小計：14 個詞塊、34 個單字。

### 8 餐廳與聚會（`restaurant`）

- NPC：`server` 服務生、`friend` 新朋友 Mia
- 場景：和鄰居、新朋友吃飯聊天：帶位、點餐、聊興趣、約時間、聊週末。

| 任務 | 標題           | 新詞塊（英文／中文）                                                                                     | 新單字（英文／中文／排名）                                                                                      | 文法                                      | 新題型 | 新項目數    |
| ---- | -------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ------ | ----------- |
| t1   | 兩位           | A table for two, please.／兩位，謝謝。<br>How long is the wait?／要等多久？                              | people／人們／N57<br>friend／朋友／N208<br>restaurant／餐廳／N919<br>waiter／服務生／T40                        | —                                         | —      | 6           |
| t2   | 點餐           | What do you recommend?／你推薦什麼？<br>I'll have the soup, please.／我要湯，謝謝。                      | menu／菜單／N2597<br>soup／湯／T326<br>salad／沙拉／T272<br>steak／牛排／T840<br>dessert／甜點／T170            | —                                         | —      | 7           |
| t3   | 聊興趣         | I really like cooking.／我很喜歡做菜。<br>What do you do for fun?／你平常喜歡做什麼？                    | music／音樂／N392<br>movie／電影／N762<br>sing／唱歌／N873<br>dance／跳舞／N959<br>cook／做菜／N1196            | like + -ing                               | —      | 7           |
| t4   | 朋友的派對     | Thanks for inviting me.／謝謝你邀請我。<br>Can I bring anything?／要我帶什麼嗎？                         | party／派對／N299<br>game／遊戲／N393<br>wine／葡萄酒／N1389<br>guest／客人／N1430<br>birthday／生日／T104      | —                                         | —      | 7           |
| t5   | 約時間地點     | See you on Friday at seven!／星期五七點見！<br>Let's meet in front of the station.／我們在車站前面見吧。 | week／一週／N157<br>weekend／週末／N934<br>evening／傍晚／N679<br>Saturday／星期六／S<br>Sunday／星期日／S      | 地點和時間介系詞（at / on / in front of） | —      | 7           |
| t6   | 結帳           | Can we get the check, please?／可以結帳嗎？<br>Can we split it?／可以分開付嗎？                          | check／帳單／N580<br>total／總共／N569<br>together／一起／N294<br>tax／稅／N787<br>tip／小費／N1659             | —                                         | —      | 7           |
| t7   | 週末過得如何   | It was great, thanks.／很棒，謝謝。<br>The food was really good.／東西很好吃。                           | great／很棒的／N124<br>happy／開心的／N513<br>fun／好玩的／N902<br>busy／忙的／N1233<br>delicious／好吃的／T197 | 過去式（be：was / were）                  | —      | 7           |
| t8   | 角色扮演大挑戰 | —                                                                                                        | —                                                                                                               | —                                         | —      | 0（只複習） |

小計：14 個詞塊、34 個單字。

### 9 郵局（`post_office`）

- NPC：`postal_clerk` 郵局櫃台
- 場景：寄東西回台灣、填地址、處理沒收到的包裹。

| 任務 | 標題           | 新詞塊（英文／中文）                                                                                  | 新單字（英文／中文／排名）                                                                                                     | 文法                   | 新題型 | 新項目數    |
| ---- | -------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------- | ------ | ----------- |
| t1   | 寄回台灣       | I want to send this to Taiwan.／我想把這個寄到台灣。<br>Can I send it by air?／可以寄航空嗎？         | mail／郵件；寄／N1643<br>letter／信／N358<br>package／包裹／N1319<br>stamp／郵票／N2654                                        | —                      | —      | 6           |
| t2   | 地址寫哪裡     | Where do I write the address?／地址要寫在哪裡？<br>Is this okay?／這樣可以嗎？                        | write／寫／N121<br>number／號碼／N127<br>city／城市／N269<br>country／國家／N143<br>address／地址／N558                        | —                      | —      | 7           |
| t3   | 包裹沒收到     | I mailed it last week.／我上星期寄的。<br>I missed the delivery.／我錯過了送貨。                      | order／訂購；訂單／N215<br>yesterday／昨天／N703<br>notice／通知單／N664<br>delivery／送貨／N1428<br>online／網路上／N1794     | 過去式（規則動詞 -ed） | —      | 7           |
| t4   | 領包裹         | I'm here to pick up a package.／我來領包裹。<br>Here's my ID.／這是我的證件。                         | office／辦公室／N343<br>open／開；營業中／N214<br>close／關；打烊／N239<br>desk／桌子（櫃台桌）／N1588<br>counter／櫃台／N2412 | —                      | —      | 7           |
| t5   | 裡面是什麼     | Just some books and gifts.／只是一些書和禮物。<br>Please be careful with it.／請小心處理。            | carry／搬；提／N446<br>break／打破；摔壞／N368<br>heavy／重的／N1052<br>toy／玩具／N1994<br>careful／小心的／N1637             | —                      | —      | 7           |
| t6   | 多久會到       | How much does it cost?／要多少錢？<br>When will it get there?／什麼時候會到？                         | fast／快的／N631<br>slow／慢的／N1118<br>weight／重量／N978<br>scale／秤／N1199<br>kilogram／公斤／T1059                       | —                      | —      | 7           |
| t7   | 買包裝用品     | I need a box and some tape.／我需要一個箱子和一些膠帶。<br>Can I buy stamps here?／這裡可以買郵票嗎？ | tape／膠帶／N1371<br>envelope／信封／N2656<br>postcard／明信片／T448<br>sticker／貼紙／T841<br>scissors／剪刀／外              | —                      | —      | 7           |
| t8   | 角色扮演大挑戰 | —                                                                                                     | —                                                                                                                              | —                      | —      | 0（只複習） |

小計：14 個詞塊、34 個單字。

### 10 公園與社區（`park`）

- NPC：`neighbor` 鄰居、`volunteer` 社區志工
- 場景：週末去公園：聊天、看活動公告、當志工、野餐、交朋友。

| 任務 | 標題           | 新詞塊（英文／中文）                                                                                | 新單字（英文／中文／排名）                                                                                                 | 文法                     | 新題型 | 新項目數    |
| ---- | -------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ------ | ----------- |
| t1   | 公園散步       | Nice day, isn't it?／天氣真好，對吧？<br>Is your dog friendly?／你的狗會咬人嗎？（友善嗎）          | park／公園／N657<br>tree／樹／N738<br>dog／狗／N895<br>flower／花／N1301                                                   | —                        | —      | 6           |
| t2   | 看活動公告     | What time does it start?／幾點開始？<br>Is it free?／免費嗎？                                       | class／課程／N362<br>event／活動／N442<br>center／中心／N334<br>afternoon／下午／N948<br>poster／海報／T336                | —                        | —      | 7           |
| t3   | 上次的活動     | I saw your poster.／我看到你的海報。<br>I had a great time.／我玩得很開心。                         | sun／太陽／N1361<br>sky／天空／N1720<br>wind／風／N1013<br>cloud／雲／N2090<br>grass／草地／N2193                          | 過去式（常見不規則動詞） | —      | 7           |
| t4   | 當志工         | How can I help?／我可以幫什麼忙？<br>Can I sign up here?／可以在這裡報名嗎？                        | team／隊；小組／N407<br>plant／植物；種／N671<br>clean／打掃；乾淨的／N842<br>garden／花園／N972<br>volunteer／志工／N1962 | —                        | —      | 7           |
| t5   | 野餐           | Do you want something to drink?／你要喝點什麼嗎？<br>Please help yourself.／請自己拿，別客氣。      | play／玩／N158<br>hold／拿著／N222<br>kid／小孩／N529<br>ball／球／N1201<br>picnic／野餐／T209                             | —                        | —      | 7           |
| t6   | 一起運動       | Do you want to run together?／要不要一起跑步？<br>I run here every morning.／我每天早上在這裡跑步。 | run／跑步／N192<br>sport／運動／N603<br>lake／湖／N1822<br>swim／游泳／N1391<br>tennis／網球／N1917                        | —                        | —      | 7           |
| t7   | 保持聯絡       | Let's keep in touch.／保持聯絡喔。<br>Here's my number.／這是我的電話號碼。                         | family／家人／N172<br>picture／照片／N509<br>message／訊息／N863<br>email／電子郵件／N1169<br>camera／相機／N1390          | —                        | —      | 7           |
| t8   | 角色扮演大挑戰 | —                                                                                                   | —                                                                                                                          | —                        | —      | 0（只複習） |

小計：14 個詞塊、34 個單字。

## 3. 既有劇情要改寫的地方

- 搬家第一天 t1～t3 是第一個地點的前三個任務，前面沒有任務可以先教這些字，只能改寫劇情。
- 改寫後，每段最多剩 1 個沒教過的字，而且都在 NGSL 前 1000 名內（星期、數字算第 300 名）。
- 用 `src/content/vocab.ts` 的 `profileUnits` 照新順序算過；改寫後要用 `node scripts/vocab-report.mjs` 確認。
- 只改劇情台詞，不改任務的詞塊、單字、對比詞。中文翻譯要跟著改。

| 台詞 id      | 原句                                                                | 沒教過的字                              | 建議改成                           |
| ------------ | ------------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| move_in t1_1 | Hi! You must be the new tenant.                                     | hi、must、tenant                        | Are you new here?                  |
| move_in t1_3 | Welcome! I'm Mr. Bell, your landlord.                               | landlord（welcome 保留）                | Welcome! I'm Mr. Bell.             |
| move_in t1_5 | Nice to meet you, too. Here's your key.                             | too                                     | Nice to meet you. Here's your key. |
| move_in t2_3 | Cool! If you need help, call me. My last name is Bell.              | cool、help、call、last（name 保留）     | Good. My name is Bell.             |
| move_in t2_5 | B, E, L, L. Bell, like a bell.                                      | bell（小寫的 bell 是一般名詞）          | It's B, E, L, L.                   |
| move_in t3_1 | Trash goes out on Monday night, and recycling goes out on Thursday. | night、recycle、Thursday（Monday 保留） | The trash goes out on Monday.      |
| move_in t3_3 | Sure. Trash, on Monday. Recycling, on Thursday.                     | sure、recycle、Thursday                 | Yes. Trash, on Monday.             |
| move_in t3_5 | You're welcome. Enjoy your new home!                                | welcome、enjoy、home                    | Have a good day!                   |
| cafe t2_3    | No problem. It will be ready soon.                                  | ready、soon                             | No problem. Just one minute.       |

改寫後每段剩下的生字：

| 任務      | 改寫前                                                       | 改寫後                                                      |
| --------- | ------------------------------------------------------------ | ----------------------------------------------------------- |
| 搬家 t1   | hi、landlord、must、tenant、too、welcome                     | welcome（搬家 t4 教）                                       |
| 搬家 t2   | bell、call、cool、help、last、name                           | name（搬家 t6 教）                                          |
| 搬家 t3   | enjoy、home、Monday、night、recycle、sure、Thursday、welcome | Monday（街道 t6 教）                                        |
| 咖啡廳 t1 | anything、else、hi、sure                                     | else（不用改：hi、sure、anything 在搬家 t4～t7 教過了）     |
| 咖啡廳 t2 | problem、ready、soon                                         | minute（problem 在搬家 t4 教過；minute 在街道 t5 教）       |
| 咖啡廳 t3 | six、fifty                                                   | fifty（不用改：six 在搬家 t6 教過；fifty 在便利商店 t5 教） |

改寫的代價：

- 搬家 t3 拿掉了「回收是星期四」，只剩垃圾日。
- 搬家 t2 拿掉了「需要幫忙就打給我」。這句的意思移到搬家 t7 的新詞塊 Call me if you need anything.。

## 4. 請人審閱的地方

### 已決定（2026-11-22）

1. **新項目數算對比詞**：搬家 t1～t3 是 6 個，搬家 t4～t7 也排 6 個（4 個單字）。
2. **搬家第一天教數字 two～nine**：讓咖啡廳 t3 的「Six fifty」只剩 1 個生字，之後的價錢、時間也能用。搬家 t4～t7 每個任務的 4 個單字裡有 2 個是數字。
3. **else 在便利商店 t7 教**（No, nothing else. Thanks.）。hello、fine、ready、soon 先不教，寫劇情時避開；great（超市 t7）和 friend（餐廳 t1）維持原位。
4. **咖啡廳比便利商店早**：便利商店把 Can I get…? 當作學過的句型（Can I get a fork, too? / Can I get a receipt? / Can I get two of these?），How much is it? 不再重教。

### 提前出現的文法（當固定說法教，不另外講文法）

這些詞塊用到還沒教、或是第二幕以後才教的文法，請確認可以接受：

- I'm just looking, thanks.（服飾店 t1，進行式比 t3 早）
- I'll take it. / Great, I'll take two. / I'll have the soup, please. / When will it get there?（will 是第二幕）
- Is this seat taken?（被動式是第三幕）
- Nice day, isn't it?（附加問句）
- Does it make you sleepy?（使役動詞 make 是第四幕；可以改成 Can I take it at night?）
- Thanks for inviting me.（動名詞是第二幕）
- Call me if you need anything.（if 子句，當固定說法）
- Is it far from here? / Can I pay by card? / Can you help me with this box?（介系詞比餐廳 t5 早）
- Yes, I just moved in.（既有，過去式）

### 用字

- **和對比詞撞 id 的字**：cup、light、right、bed 已經是對比詞的字 id，不能再當單字，但搬家之後算學過。所以咖啡廳沒有 cup，問路沒有 right。
- **這版拿掉的字**：bike、pie、donut、laptop、bottle、line、machine、cash、cent、card（card 還在詞塊 Can I pay by card? 裡）、paper、pen、bird、concert、belt、chips。都是為了讓位給常用字、數字、星期。
- **一字多義**：cold 在診所教「感冒」；back 在診所教「背」；drink、rain、check、order、close、break 名詞動詞都有。請確認中文要寫哪個意思。
- **美國用法**：pound（磅）、fare、downtown、check（帳單）、pants、flu shot。
- **比較抽象、不好畫的字**：welcome、okay、each、total、percent、notice、online、order、event、class、center、fun、busy、great。要畫圖時要想一下怎麼表示。
- **可能太難或太少用**：kilogram、fork、counter、scarf、tennis，可以換。
- **只在詞塊裡、沒當單字教的字**：receipt、appointment、Wi-Fi、fitting room、help、sure、name、call。照新規則，詞塊裡的字也算教過。

### 角色和聲音

- 新的 NPC 角色 id 有 14 個：clerk、passerby、driver、cashier、vendor、assistant、receptionist、doctor、pharmacist、server、friend、postal_clerk、neighbor、volunteer。每個都要在 `role` 加合法值、配聲線、畫角色。可以合併：例如 clerk、cashier、assistant、postal_clerk 都用「店員」聲線。

### 句子要請英文好的人看

- Do you have any change?（零錢；也可能被理解成別的意思）
- Is it buy one, get one free?（是不是太長、太像廣告詞）
- I missed the delivery.（美國比較常說 I missed my package.）
- Can you help me with this box?（搬家時很自然，但玩家要對房東說嗎？也可以改成對鄰居說）
