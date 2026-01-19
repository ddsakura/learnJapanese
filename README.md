# JLPT N4 普通形動詞變化練習

本專案是可在本機執行的 Web App，用於練習 JLPT N4 等級的普通形（辞書形）動詞變化：ない形／た形／なかった形／て形。支援立即批改、簡易 SRS、統計與題庫管理（匯入／匯出）。

## 安裝與啟動

```bash
npm install
npm run dev
```

建置：

```bash
npm run build
```


## 使用方式

1. 打開頁面即可開始刷題。
2. 選擇題型（混合／單一）與出題範圍（全部／五段／二段／不規則）。
3. 輸入答案後按 Enter 或點「批改」，答案區會列出該動詞的所有形方便複習。
4. 可用「略過」快速看答案（視為答錯）。
5. 依據簡易 SRS 記錄到 `localStorage`，答對延後出現、答錯兩分鐘內再出現。
6. 題庫管理可貼上 JSON 或直接輸入動詞（空白／逗號分隔）匯入；匯入時會自動查詢中文翻譯並在答案區顯示。

## 題庫 JSON 格式

匯入的 JSON 必須是陣列。支援以下格式：

```json
{
  "dict": "行く",
  "nai": "行かない",
  "ta": "行った",
  "nakatta": "行かなかった",
  "te": "行って",
  "group": "godan",
  "zh": "去"
}
```

- 也可只提供辭書形（字串陣列、物件僅含 `dict`，或在題庫管理的動詞輸入欄位直接輸入），系統會自動推導其餘變化
- 若未提供 `group`，會以基本規則推測（可覆寫以避免不規則誤判）
- `group` 只能是 `godan` / `ichidan` / `irregular`（分別代表 五段 / 二段 / 不規則）
- 可選 `zh` 欄位存放中文翻譯；若匯入資料沒有 `zh`，會在匯入時自動查詢
- 匯入會合併題庫（同 dict 以新匯入覆蓋舊資料），並清空學習紀錄（SRS 與統計）

## 中文翻譯查詢

匯入動詞時會用 MyMemory Translated API 查詢中文翻譯（`ja` → `zh-TW`），API 端點：`https://api.mymemory.translated.net/get`，說明頁：`https://mymemory.translated.net/doc/spec.php`，流程如下：

1. 匯入資料若缺 `zh`，會逐筆呼叫翻譯 API。
2. 成功取得翻譯後寫入題庫（下次顯示答案會帶中文）。
3. 若查不到或 API 回傳失敗，該筆保留空白（答案區會顯示「未取得」）。

費用：MyMemory 有免費使用額度與速率限制，日後若大量使用或需要更高配額，可能需要付費方案。詳細限制以官方說明為準。

## localStorage Keys

- `jlpt-n4-verb-bank`：題庫資料
- `jlpt-n4-verb-srs`：SRS 狀態
- `jlpt-n4-verb-stats`：今日答題數／連續答對
- `jlpt-n4-verb-settings`：題型與範圍
