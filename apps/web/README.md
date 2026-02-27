# Web App (Vite + React)

Web 版練習 JLPT N4 動詞/形容詞變化，支援題庫匯入/匯出、SRS、例句與翻譯（本機 Ollama）。

## 開發環境

- Node.js + npm
- （可選）Ollama

## 啟動

```bash
cd apps/web
npm install
npm run dev
```

macOS 下，`npm run dev` 會嘗試自動啟動 `ollama serve`（若未啟動）。

### macOS 快速啟動

若雙擊或 Raycast 執行時出現權限問題，先執行：

```bash
chmod +x apps/web/start-web-dev.command apps/web/start-web-dev-raycast.sh
```

- `start-web-dev.command`
  - 在 Finder 雙擊即可開啟 Terminal 並執行 `npm run dev`
  - 檔案位置：`apps/web/start-web-dev.command`
- `start-web-dev-raycast.sh`
  - 給 Raycast 的 Script Command
  - 檔案位置：`apps/web/start-web-dev-raycast.sh`
  - 在 Raycast 設定 `Extensions` -> `Script Commands`，把 Script Commands folder 指到 `apps/web`（或包含此檔案的目錄）
  - 之後可在 Raycast 搜尋 `Start Web Dev` 執行

## Build

```bash
cd apps/web
npm run build
npm run preview
```

## 測試

```bash
cd apps/web
npm test
npm run test:e2e
npm run test:e2e:ui
npm run test:all
```

## 題庫管理

- UI 匯出全部題庫會下載 `bank-export.json`
- 預設題庫檔是 `src/data/bank.json`
- 跨平台題庫同步與 source of truth 請看 `packages/core/docs/overview.md`

## Ollama 說明

預設端點使用本機 Ollama。若要在非 Vite dev server 的來源使用，請設定 Ollama CORS（`OLLAMA_ORIGINS`）。
