# Core 規格（跨平台）

此目錄提供跨平台共用的「資料格式、規則、fixtures」。
iOS/Android/Web 都應該以這些規格為依據實作，並用 fixtures 驗證一致性。

內容
- data-model.md：題庫資料格式與型別定義
- rules.md：動詞/形容詞變化規則摘要
- srs.md：SRS 規則
- importing.md：題庫匯入/正規化規則
- fixtures/：可跨平台重用的測試資料與預設題庫（JSON）
  - bank.json：預設題庫（不含學習進度），作為跨平台 source of truth
  - conjugation.json：變化規則測試用 fixtures（規則輸入 + 預期輸出）

同步題庫
- 將 root source 同步到各平台（預設題庫）：
  - `node scripts/fixtures-push.mjs --to all`
  - 或指定：`node scripts/fixtures-push.mjs --to web|ios|android`
- 將平台題庫回寫成 root source：
  - `node scripts/fixtures-pull.mjs --from web|ios|android`
  - 若從 Web 匯出的檔案回寫：`node scripts/fixtures-pull.mjs --from file --path /path/to/bank-export.json`

產生變化規則 fixtures
- `conjugation.json` 可由 `bank.json` 生成（用於規則測試）：
  - `node scripts/generate-conjugation.mjs`
- 檢查 `conjugation.json` 是否與 `bank.json` 同步：
  - `node scripts/check-conjugation.mjs`
