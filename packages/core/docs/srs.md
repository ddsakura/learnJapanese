# SRS 規則

此專案使用簡化 SRS：

- 若答對：
  - intervalDays = max(1, (prev.intervalDays * 2) 或 1)
  - due = now + intervalDays * DAY_MS
- 若答錯（或略過）：
  - intervalDays = 0
  - due = now + INCORRECT_DELAY_MS

常數
- DAY_MS = 86,400,000 (24 小時)
- INCORRECT_DELAY_MS = 120,000 (2 分鐘)

備註
- 每個題目以 dict 為 key
- 動詞/形容詞各自獨立 SRS
