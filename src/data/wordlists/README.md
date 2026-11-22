# 字表

用字分析（`src/content/vocab.ts`、`scripts/vocab-report.mjs`）用的高頻字表。檔案是從官網下載的原始檔，沒有修改。遊戲執行時不會載入。

| 檔案                                  | 內容                                                   |
| ------------------------------------- | ------------------------------------------------------ |
| `NGSL_12_stats.csv`                   | NGSL 1.2：2,809 個最常用的英文字，依頻率排名           |
| `NGSL_12_lemmatized_for_research.csv` | NGSL 1.2：每個字的所有變化形（一行是「原形,變化形…」） |
| `SUP_lemmatized.csv`                  | NGSL 補充字：星期、月份、數字等 52 個字和變化形        |
| `TSL_12_stats.csv`                    | TSL 1.2：1,250 個多益常見、NGSL 沒有的字，依頻率排名   |
| `TSL_12_lemmatized_for_research.csv`  | TSL 1.2：每個字的所有變化形                            |

- 兩個 TSL 檔案是 ISO-8859-1 編碼（例如 `café`、`résumé`），其他是 UTF-8。
- 下載日期：2026-11-22，來源：https://www.newgeneralservicelist.com/

## 授權

兩份字表都採用 [創用 CC 姓名標示－相同方式分享 4.0 國際授權條款（CC BY-SA 4.0）](https://creativecommons.org/licenses/by-sa/4.0/)。這個資料夾裡的字表檔案依同樣的授權提供；遊戲的程式和內容不在此限。

- New General Service List by Browne, C., Culligan, B., and Phillips, J. is licensed under a Creative Commons Attribution-ShareAlike 4.0 International License.
  - Browne, C., Culligan, B. & Phillips, J. (2013). The New General Service List. Retrieved from https://www.newgeneralservicelist.com
- TOEIC Service List by Browne, C. and Culligan, B., is licensed under a Creative Commons Attribution-ShareAlike 4.0 International License.
  - Browne, C., Culligan, B. (2016). The TOEIC Service List. Retrieved from https://www.newgeneralservicelist.com
