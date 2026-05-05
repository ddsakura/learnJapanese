# Android App 功能說明

## App 概覽

JLPT N4 日語活用練習 Android 應用，以 Jetpack Compose（Material 3）開發，提供動詞與形容詞的普通形活用練習（ない形／た形／なかった形／て形／可能形），以及自他動詞配對與判斷練習。內建 SRS 間隔複習機制，支援文字輸入與 AI 四選一兩種作答模式，AI 功能由 Ollama 驅動（支援離線 fallback）。

---

## 畫面清單

### 主練習畫面

- **對應檔案**：`apps/android/app/src/main/java/com/learnjapanese/app/ui/ContentScreen.kt`、`apps/android/app/src/main/java/com/learnjapanese/app/ui/AppViewModel.kt`
- **功能說明**：應用的核心畫面，以 Column（可捲動）呈現題目卡片、答題區、批改結果、統計、AI 翻譯例句，所有練習功能都在此單一畫面完成。無傳統路由導航，改以 ViewModel 狀態驅動 UI 切換。
- **主要 UI 元素**：
  - TopAppBar：標題「LearnJapanese」＋右上角「題庫管理」TextButton
  - 設定摘要列（SettingsSummaryRow）：顯示目前設定摘要，點擊開啟設定 BottomSheet
  - 題目卡片（QuestionCard）：辭書形大字＋題型標籤＋朗讀 IconButton
  - 答題區（AnswerSection）：OutlinedTextField（Input 模式）或選項按鈕組（Choice 模式）
  - 批改／略過按鈕（Button／OutlinedButton）
  - 批改結果面板（ResultSection）：顏色編碼的 Surface（綠色正確／紅色錯誤）
  - 統計區（StatsSection）：今日答題數、連續答對、今日答錯（三欄橫排）
  - 複習控制區（ReviewSection）：複習今日答錯 ／ 回到正常題庫按鈕
  - AI 翻譯例句區（AiSection）：進度指示器、翻譯卡片、例句卡片
  - 下一題按鈕（Button，底部）
- **使用者操作流程**：
  1. 查看設定摘要列確認目前設定
  2. 閱讀題目卡片（辭書形 → 目標活用形）
  3. 點擊朗讀 IconButton 聆聽發音（選填）
  4. 在輸入框輸入答案，或從選項按鈕組選取答案
  5. 點「批改」（Input 模式）或點選選項後自動批改
  6. 查看批改結果、AI 翻譯與例句
  7. 點「下一題」進入下一題
- **導航關係**：
  - 從：應用啟動後直接進入
  - 到：點「題庫管理」開啟題庫管理 BottomSheet；點設定摘要列開啟設定 BottomSheet
- **特殊狀態**：
  - Empty（正常模式）：題庫無可用題目時顯示「目前題庫沒有可用題目」
  - Empty（複習模式）：今日無答錯時顯示「目前沒有可複習錯題」
  - Loading（AI）：Ollama 生成中顯示 CircularProgressIndicator ＋「翻譯與例句產生中…」
  - Error（AI）：Ollama 連線失敗時顯示紅色錯誤訊息

---

### 題目卡片（QuestionCard）

- **對應檔案**：`apps/android/app/src/main/java/com/learnjapanese/app/ui/ContentScreen.kt`（QuestionCard Composable）
- **功能說明**：以 ElevatedCard 樣式呈現單一題目，包含辭書形、目標活用形標籤與朗讀按鈕。
- **主要 UI 元素**：
  - 辭書形：大號字體
  - 目標活用形標籤：綠色（`#2E7D32`），如「た形」、「可能形」
  - 朗讀 IconButton：點擊使用 TTS 播放日文
- **使用者操作流程**：
  1. 閱讀辭書形
  2. 確認目標活用形標籤
  3. （可選）點擊朗讀按鈕聆聽發音
- **導航關係**：嵌入於主練習畫面，無獨立路由

---

### 答題區（AnswerSection）

- **對應檔案**：`apps/android/app/src/main/java/com/learnjapanese/app/ui/ContentScreen.kt`（AnswerSection Composable）
- **功能說明**：根據目前作答方式（文字輸入或四選一）動態切換 UI，讓使用者提交答案。
- **主要 UI 元素**：
  - **Input 模式**：
    - OutlinedTextField（輸入日文答案）
    - 「批改」Button
    - 「略過」OutlinedButton
  - **Choice 模式**：
    - 選項按鈕組（ChoiceButton × 4）：動態著色（正確綠色 `#2E7D32`／錯誤紅色 `#C62828`）
    - 「重新產生選項」OutlinedButton：強制重新向 Ollama 請求新選項
    - 「略過」OutlinedButton
- **使用者操作流程**：
  - Input 模式：輸入答案後點「批改」或按鍵盤確認鍵
  - Choice 模式：等待 Ollama 生成選項後點選其中一個，點選即自動批改
- **導航關係**：嵌入於主練習畫面，無獨立路由
- **特殊狀態**：
  - Loading（Choice 模式）：Ollama 尚未回傳選項時，按鈕組不顯示
  - Error（Choice 模式）：Ollama 失敗時顯示錯誤訊息並出現「重新產生選項」按鈕

---

### 批改結果面板（ResultSection）

- **對應檔案**：`apps/android/app/src/main/java/com/learnjapanese/app/ui/ContentScreen.kt`（ResultSection Composable）
- **功能說明**：提交答案後顯示對錯結果，以顏色編碼的 Surface 呈現，方便一眼判斷。
- **主要 UI 元素**：
  - 正確／錯誤標示（✅ 正確 或 ❌ 錯誤／略過）
  - 題型說明（如「題型：た形」）
  - 使用者答案
  - 正確答案
- **使用者操作流程**：
  1. 提交答案後自動展開
  2. 查看對錯與正確答案
  3. 繼續查看下方 AI 翻譯例句後點「下一題」
- **導航關係**：嵌入於主練習畫面答題區下方，無獨立路由

---

### AI 翻譯與例句區（AiSection）

- **對應檔案**：`apps/android/app/src/main/java/com/learnjapanese/app/ui/ContentScreen.kt`（AiSection Composable）、`apps/android/app/src/main/java/com/learnjapanese/app/data/AIService.kt`
- **功能說明**：批改後自動呼叫 Ollama 生成中文翻譯與日文例句（Ollama 關閉時 fallback 至離線模式）。使用者可手動重新生成。
- **主要 UI 元素**：
  - 進度指示器（CircularProgressIndicator 18dp）＋「翻譯與例句產生中…」（生成中）
  - 紅色錯誤訊息文字（失敗時）
  - 中文翻譯 Surface 卡片
  - 例句 Surface 卡片：日文例句、假名讀音、中文翻譯、文法解說
  - 「朗讀例句」OutlinedButton
  - 「重新產生翻譯／例句」OutlinedButton
  - AI 來源備注（Ollama 或離線模式）
- **使用者操作流程**：
  1. 批改後本區自動出現並開始生成
  2. 生成完成後查看翻譯與例句
  3. 可點「朗讀例句」聆聽發音
  4. 可點「重新產生翻譯／例句」獲取不同版本
- **導航關係**：嵌入於主練習畫面批改結果下方，無獨立路由
- **特殊狀態**：
  - Loading：CircularProgressIndicator ＋「翻譯與例句產生中…」
  - Error：`status.message` 以紅色文字顯示
  - Idle（無結果）：不顯示任何內容

---

### 自他動詞練習區（TransitivitySection）

- **對應檔案**：`apps/android/app/src/main/java/com/learnjapanese/app/ui/ContentScreen.kt`（TransitivitySection Composable）
- **功能說明**：當學習主題切換為「自他動詞」時，主畫面以此區塊取代一般活用練習，支援「找配對」與「判斷自他」兩種題型。
- **主要 UI 元素**：
  - ElevatedCard：題目詞彙（大字）、讀音、中文翻譯、題型提示（綠色）
  - 批改結果 Surface（顏色編碼）：對錯標示、正確答案、自他配對顯示
  - 選項按鈕組（Choice 模式，ChoiceButton）
  - OutlinedTextField（Input 模式）
  - 「批改」Button、「略過」OutlinedButton
- **使用者操作流程**：
  1. 在設定 BottomSheet 將主題切換為「自他動詞」並套用
  2. 閱讀題目詞彙與題型提示
  3. 輸入答案或點選選項
  4. 查看批改結果與配對說明
  5. 點「下一題」繼續
- **導航關係**：切換學習主題後在主畫面內條件渲染，無獨立路由
- **特殊狀態**：
  - Empty：自他動詞題庫為空時顯示「題庫沒有自他動詞資料」

---

### 統計與複習控制區（StatsSection／ReviewSection）

- **對應檔案**：`apps/android/app/src/main/java/com/learnjapanese/app/ui/ContentScreen.kt`（StatsSection、ReviewSection Composable）
- **功能說明**：顯示即時學習統計並提供進入複習模式的入口。
- **主要 UI 元素**：
  - 統計三欄（StatItem）：今日答題數、連續答對、今日答錯
  - 「複習今日答錯」OutlinedButton（有答錯時啟用）
  - 「回到正常題庫」按鈕（複習模式時顯示）
- **使用者操作流程**：
  1. 練習中隨時查看三欄統計
  2. 今日有答錯時點「複習今日答錯」切換複習模式
  3. 想退出複習模式時點「回到正常題庫」
- **導航關係**：嵌入於主練習畫面中段，無獨立路由
- **特殊狀態**：
  - 無答錯：「複習今日答錯」按鈕呈 `enabled = false` 灰色禁用

---

### 設定 BottomSheet（SettingsSheet）

- **對應檔案**：`apps/android/app/src/main/java/com/learnjapanese/app/ui/ContentScreen.kt`（SettingsSheet Composable）
- **功能說明**：以 ModalBottomSheet 呈現所有學習偏好設定，以及 Ollama AI 服務設定，套用後重新生成題目。
- **主要 UI 元素**：
  - 學習主題（SegmentedRow）：「活用練習」／「自他動詞」
  - 學習對象（SegmentedRow，活用練習時）：「動詞」／「形容詞」
  - 題型清單（SelectableRow，活用練習時）：ない形／た形／なかった形／て形／可能形／混合（動詞）；前四項＋混合（形容詞）
  - 詞彙類型清單（SelectableRow）：全部／五段／二段／不規則（動詞）；全部／い形／な形（形容詞）
  - 自他動詞題型清單（SelectableRow，自他動詞時）：找配對／判斷自他
  - 作答方式（SegmentedRow）：「文字輸入」／「四選一」
  - Ollama 設定區：啟用 Switch、Base URL 輸入框、Model 名稱輸入框
  - 「取消」Button、「套用」Button
- **使用者操作流程**：
  1. 點擊設定摘要列，BottomSheet 從下方滑出
  2. 依序調整學習主題、練習對象、題型、詞彙範圍、作答方式
  3. 若需要 AI 功能，在 Ollama 設定區輸入 Base URL 與模型名稱並啟用
  4. 點「套用」儲存所有設定並重新產生題目
  5. 或點「取消」不儲存直接關閉
- **導航關係**：
  - 從：主練習畫面點擊設定摘要列呼出
  - 到：點「套用」或「取消」後回到主練習畫面
- **特殊狀態**：無

---

### 題庫管理 BottomSheet（BankSheet）

- **對應檔案**：`apps/android/app/src/main/java/com/learnjapanese/app/ui/ContentScreen.kt`（BankSheet Composable）
- **功能說明**：以 ModalBottomSheet 提供題庫的匯入、匯出、快速新增與重置功能，JSON 格式，含多行 OutlinedTextField 可直接編輯。
- **主要 UI 元素**：
  - 目前題庫數量 Text
  - JSON 多行輸入區（OutlinedTextField multiline）：可貼上或直接編輯題庫 JSON
  - 「匯出題庫」OutlinedButton：將題庫輸出至編輯區
  - 「匯入題庫」Button：解析編輯區 JSON 並合併
  - 「重置題庫」OutlinedButton：恢復預設題庫
  - 快速輸入欄位標籤 Text
  - 快速輸入 OutlinedTextField：輸入辭書形（空白或逗號分隔）
  - 「快速匯入」Button：快速新增詞彙
  - 操作訊息 Text：顯示成功或失敗訊息
  - 「完成」TextButton（關閉 Sheet）
- **使用者操作流程**：
  1. 點擊頂部導覽列「題庫管理」開啟 BottomSheet
  2. 選擇操作：
     - 快速新增：在快速輸入欄位輸入辭書形 → 點「快速匯入」
     - JSON 匯入：貼上 JSON 至編輯區 → 點「匯入題庫」
     - 備份：點「匯出題庫」取得 JSON
     - 重置：點「重置題庫」恢復預設
  3. 查看操作結果訊息
  4. 點「完成」關閉 BottomSheet
- **導航關係**：
  - 從：主練習畫面點「題庫管理」呼出
  - 到：點「完成」回到主練習畫面
- **特殊狀態**：
  - Loading：匯入處理中「匯入題庫」按鈕以 `enabled = !isImporting` 禁用
  - Error：JSON 解析失敗時訊息區顯示錯誤說明
  - Success：匯入成功顯示「匯入成功，已合併題庫。」
