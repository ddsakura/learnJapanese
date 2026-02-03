# learnJapanese (monorepo)

此 repo 目前包含：

- `apps/web`：現有的 Vite/React Web App
- `apps/ios`：SwiftUI 版本（開發中）
- `apps/android`：Jetpack Compose 版本（預留）
- `packages/core`：跨平台共用規格與 fixtures

## Web 開發

```bash
cd apps/web
npm install
npm run dev
```

## Web 測試

```bash
cd apps/web
npm test
```

```bash
cd apps/web
npm run test:e2e
```

```bash
cd apps/web
npm run test:e2e:ui
```

```bash
cd apps/web
npm run test:all
```

## Core 規格與 fixtures

請參考：
- `packages/core/docs`
- `packages/core/fixtures`

## iOS 開發

需求：
- Xcode（目前專案 iOS Deployment Target 為 26.0）
- XcodeGen（已用來產生專案）

產生 Xcode 專案：

```bash
cd apps/ios
xcodegen generate
```

使用方式：
1. 打開 `apps/ios/LearnJapanese.xcodeproj`
2. 選擇 iOS Simulator 或實機執行

## iOS Fixtures

iOS 會從 `apps/ios/Resources/fixtures` 讀取題庫（與 `packages/core/fixtures` 同結構）。

## 題庫匯入/匯出（Web ↔ iOS）

Web 介面匯出的是 `CardFixture[]` 格式（扁平化題庫），可直接貼到 iOS 的「題庫管理 → 匯入題庫」。

注意：`conjugation.json` 是原始規格資料，格式不同，不能直接用 UI 匯入。
