# iOS App (SwiftUI)

## 開發環境

- Xcode（目前 deployment target：iOS 26.0）
- XcodeGen

## 產生專案

```bash
cd apps/ios
xcodegen generate
```

打開 `apps/ios/LearnJapanese.xcodeproj` 後執行。

## 測試

使用 Xcode 執行 `LearnJapaneseTests`。

## 目錄重點

- `Sources/`：應用程式與核心邏輯
- `Resources/fixtures/`：iOS 端 fixtures（由 core 同步）
- `Tests/`：單元測試

## fixtures

- 預設題庫：`Resources/fixtures/bank.json`
- 規則測試：`Resources/fixtures/conjugation.json`
- 其他測試：`parsing.json`、`importing.json`、`srs.json`

跨平台 fixtures 的維護流程請看：`packages/core/docs/overview.md`

## App Icon

- 來源圖：repo root `icon-source.png`
- iOS 資源：`Resources/Assets.xcassets/AppIcon.appiconset`
