# JLPT N4 普通形變化練習（動詞／形容詞）

本專案是可在本機執行的 Web App，用於練習 JLPT N4 等級的普通形（辞書形）動詞與形容詞變化：ない形／た形／なかった形／て形（動詞另含可能形）。支援立即批改、簡易 SRS、統計與題庫管理（匯入／匯出）。

## 安裝與啟動

```bash
npm install
npm run dev
```

macOS：`npm run dev` 會在背景自動啟動 `ollama serve`（若未啟動），log 會寫到 `/tmp/ollama.log`。

建置：

```bash
npm run build
```


## 使用方式

1. 打開頁面即可開始刷題。
2. 選擇類型（動詞／形容詞）、題型（混合／單一）、出題範圍（動詞：全部／五段／二段／不規則；形容詞：全部／い形／な形）與作答方式（文字輸入／四選一）。
3. 文字輸入：輸入答案後按 Enter 或點「批改」，答案區會列出該單字的所有形方便複習（動詞包含可能形）。
4. 四選一：選項由本機 Ollama 產生三個錯誤答案 + 正確答案。
5. 答案區會顯示由本機 Ollama 產生的例句（以當題正確答案生成），內容包含：日文句子、平假名拼音、繁體中文翻譯、文法說明。
6. 可用「略過」快速看答案（視為答錯）。
7. 依據簡易 SRS 記錄到 `localStorage`，答對延後出現、答錯兩分鐘內再出現（動詞與形容詞各自獨立）。
8. 題庫管理可貼上 JSON 或直接輸入字詞（空白／逗號分隔）匯入；匯入時會自動查詢中文翻譯並在答案區顯示。

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

答案區的中文翻譯一律即時呼叫本機 Ollama 產生（`ja` → `zh-TW`），不讀取或寫回題庫的 `zh` 欄位。翻譯流程如下：

1. 顯示正確答案後，直接用該答案向本機 Ollama 取得繁體中文翻譯。
2. 翻譯完成後即時顯示；若失敗，答案區顯示「未取得」。

## 例句（本機 Ollama）

答案區會透過本機 Ollama 產生簡短 N4 程度例句（以當題正確答案生成），不使用外部 API。輸出欄位包含：日文句子、平假名拼音、繁體中文翻譯、文法說明。預設模型為 `translategemma:12b`，請先確認：

```bash
ollama serve
ollama pull translategemma:12b
```

Vite 開發模式已設定本機代理（`/ollama` → `127.0.0.1:11434`）避免 CORS 問題，因此 **`npm run dev` 不需要設定** `OLLAMA_ORIGINS`。

若使用建置後的靜態頁面（`npm run preview` 預設 `http://localhost:4173`，或其他自架網域），需要讓 Ollama 允許該來源。步驟如下：

1. 設定環境變數 `OLLAMA_ORIGINS`（可用逗號分隔多個來源）。
2. 重新啟動 Ollama。

例如：

```bash
OLLAMA_ORIGINS="http://localhost:4173,http://localhost:5173" ollama serve
```

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
- `jlpt-n4-example-cache`：本機例句快取
- `jlpt-n4-answer-mode`：作答方式（文字輸入／四選一）
