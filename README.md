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
3. 輸入答案後按 Enter 或點「批改」。
4. 可用「略過」快速看答案（視為答錯）。
5. 依據簡易 SRS 記錄到 `localStorage`，答對延後出現、答錯兩分鐘內再出現。

## 題庫 JSON 格式

匯入的 JSON 必須是陣列。支援以下格式：

```json
{
  "dict": "行く",
  "nai": "行かない",
  "ta": "行った",
  "nakatta": "行かなかった",
  "te": "行って",
  "group": "godan"
}
```

- 也可只提供辭書形（字串陣列或物件僅含 `dict`），系統會自動推導其餘變化
- 若未提供 `group`，會以基本規則推測（可覆寫以避免不規則誤判）
- `group` 只能是 `godan` / `ichidan` / `irregular`（分別代表 五段 / 二段 / 不規則）
- 匯入會合併題庫（同 dict 以新匯入覆蓋舊資料），並清空學習紀錄（SRS 與統計）

## localStorage Keys

- `jlpt-n4-verb-bank`：題庫資料
- `jlpt-n4-verb-srs`：SRS 狀態
- `jlpt-n4-verb-stats`：今日答題數／連續答對
- `jlpt-n4-verb-settings`：題型與範圍
