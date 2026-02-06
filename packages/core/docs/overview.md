# Core 規格總覽

`packages/core` 是三個平台共用的規格來源。目標是讓 Web、iOS、Android 在資料格式與行為上保持一致。

## 這裡放什麼

- `data-model.md`：跨平台資料模型
- `rules.md`：動詞/形容詞變化規則摘要
- `importing.md`：題庫匯入與正規化規則
- `srs.md`：SRS 規則
- `fixtures/`：跨平台共用 JSON

## fixtures 分工

- `fixtures/bank.json`
  - 用途：App 預設題庫（不含學習進度）
  - 性質：source of truth
- `fixtures/conjugation.json`
  - 用途：規則測試 fixtures（輸入 + 預期輸出）
  - 性質：由 `bank.json` 推導出的測試資料
- `fixtures/importing.json` / `fixtures/parsing.json` / `fixtures/srs.json`
  - 用途：對應模組測試案例

## 同步流程

### 1. root -> 平台

將 root 題庫同步到各平台預設檔：

```bash
node scripts/fixtures-push.mjs --to all
```

也可指定單一平台：

```bash
node scripts/fixtures-push.mjs --to web
node scripts/fixtures-push.mjs --to ios
node scripts/fixtures-push.mjs --to android
```

### 2. 平台 -> root

將平台題庫回寫成 root source：

```bash
node scripts/fixtures-pull.mjs --from web
node scripts/fixtures-pull.mjs --from ios
node scripts/fixtures-pull.mjs --from android
```

若從 Web 匯出檔回寫：

```bash
node scripts/fixtures-pull.mjs --from file --path /path/to/bank-export.json
```

## 規則 fixtures 維護

由 `bank.json` 生成 `conjugation.json` 並同步 iOS/Android：

```bash
node scripts/generate-conjugation.mjs
```

檢查三份 `conjugation.json` 是否與 `bank.json` 同步：

```bash
node scripts/check-conjugation.mjs
```
