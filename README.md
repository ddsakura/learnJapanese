# JLPT N4 普通形變化練習（動詞／形容詞）

本專案是可在本機執行的 Web App，用於練習 JLPT N4 等級的普通形（辞書形）動詞與形容詞變化：ない形／た形／なかった形／て形（動詞另含可能形）。支援立即批改、簡易 SRS、統計與題庫管理（匯入／匯出）。

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
2. 選擇類型（動詞／形容詞）、題型（混合／單一）與出題範圍（動詞：全部／五段／二段／不規則；形容詞：全部／い形／な形）。
3. 輸入答案後按 Enter 或點「批改」，答案區會列出該單字的所有形方便複習（動詞包含可能形）。
4. 可用「略過」快速看答案（視為答錯）。
5. 依據簡易 SRS 記錄到 `localStorage`，答對延後出現、答錯兩分鐘內再出現（動詞與形容詞各自獨立）。
6. 題庫管理可貼上 JSON 或直接輸入字詞（空白／逗號分隔）匯入；匯入時會自動查詢中文翻譯並在答案區顯示。

## 題庫 JSON 格式

匯入的 JSON 必須是陣列。支援以下格式：

動詞：

```json
{
  "dict": "行く",
  "nai": "行かない",
  "ta": "行った",
  "nakatta": "行かなかった",
  "te": "行って",
  "potential": "行ける",
  "group": "godan",
  "zh": "去"
}
```

形容詞：

```json
{
  "dict": "新しい",
  "nai": "新しくない",
  "ta": "新しかった",
  "nakatta": "新しくなかった",
  "te": "新しくて",
  "group": "i",
  "zh": "新"
}
```

- 也可只提供辭書形（字串陣列、物件僅含 `dict`，或在題庫管理的輸入欄位直接輸入），系統會自動推導其餘變化
- 動詞可提供 `potential`（可能形）；未提供會自動推導
- 若未提供 `group`，會以基本規則推測（可覆寫以避免不規則誤判）
- 動詞 `group` 只能是 `godan` / `ichidan` / `irregular`（分別代表 五段 / 二段 / 不規則）
- 形容詞 `group` 只能是 `i` / `na`（分別代表 い形 / な形）
- 可選 `zh` 欄位存放中文翻譯；若匯入資料沒有 `zh`，會在匯入時自動查詢
- 匯入會合併題庫（同 dict 以新匯入覆蓋舊資料），並保留既有的學習紀錄；若題庫移除某單字，會同步移除其對應的 SRS 紀錄

## 中文翻譯查詢

匯入資料時會用 MyMemory Translated API 查詢中文翻譯（`ja` → `zh-TW`），API 端點：`https://api.mymemory.translated.net/get`，說明頁：`https://mymemory.translated.net/doc/spec.php`，流程如下：

1. 匯入資料若缺 `zh`，會逐筆呼叫翻譯 API。
2. 成功取得翻譯後寫入題庫（下次顯示答案會帶中文）。
3. 若查不到或 API 回傳失敗，該筆保留空白（答案區會顯示「未取得」）。

費用：MyMemory 有免費使用額度與速率限制，日後若大量使用或需要更高配額，可能需要付費方案。詳細限制以官方說明為準。

## localStorage Keys

- `jlpt-n4-verb-bank`：動詞題庫資料
- `jlpt-n4-adjective-bank`：形容詞題庫資料
- `jlpt-n4-verb-srs`：動詞 SRS 狀態
- `jlpt-n4-adjective-srs`：形容詞 SRS 狀態
- `jlpt-n4-verb-stats`：動詞今日答題數／連續答對
- `jlpt-n4-adjective-stats`：形容詞今日答題數／連續答對
- `jlpt-n4-practice-settings`：練習類型、題型與範圍
- `jlpt-n4-verb-wrong-today`：動詞今日答錯
- `jlpt-n4-adjective-wrong-today`：形容詞今日答錯
