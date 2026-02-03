# iOS (SwiftUI)

## 開發環境

- Xcode（目前 Deployment Target：iOS 26.0）
- XcodeGen（用於產生專案）

## 產生專案

```bash
cd apps/ios
xcodegen generate
```

打開 `LearnJapanese.xcodeproj` 後即可執行。

## 專案結構

```
apps/ios/
  LearnJapanese.xcodeproj
    project.pbxproj              # Xcode 專案設定（由 XcodeGen 產生）
  Sources/
    LearnJapaneseApp.swift       # App 入口
    ContentView.swift            # 主畫面 UI
    AppState.swift               # 狀態管理（題目流程、設定、AI）
    QuestionCardView.swift       # 題目卡片 UI
    CoreModels.swift             # 共用資料模型
    FixtureLoader.swift          # 讀取 fixtures
    Conjugation.swift            # 動詞/形容詞變化規則
    Parsing.swift                # 句子解析邏輯
    Importing.swift              # 題庫匯入解析/正規化
    Srs.swift                    # SRS 計算邏輯
    BankStore.swift              # 題庫儲存（UserDefaults）
    SrsStore.swift               # SRS/Stats/錯題儲存
    AppleIntelligenceService.swift # Apple Intelligence 生成服務
    SpeechService.swift          # TTS 朗讀
  Resources/
    fixtures/
      conjugation.json           # 變化題庫
      parsing.json               # 解析 fixtures
      importing.json             # 匯入 fixtures
      srs.json                   # SRS fixtures
    Assets.xcassets/
      AppIcon.appiconset         # App Icon 資源
    icon-1024.png                # App Icon 來源圖（裁切後）
  Tests/
    ConjugationTests.swift       # 變化規則測試
    ParsingTests.swift           # 解析測試
    ImportingTests.swift         # 匯入測試
    SrsTests.swift               # SRS 測試
    FixtureLoaderTests.swift     # fixtures 讀取測試
    AppStatePersistenceTests.swift # 設定持久化測試
    AppStateReviewModeTests.swift  # 錯題複習模式測試
  project.yml
    # XcodeGen 設定檔
```

## Fixtures

iOS 會從 `Resources/fixtures` 讀取題庫資料，與 `packages/core/fixtures` 結構一致。

## 題庫匯入 / 匯出

iOS 介面匯入/匯出使用 `CardFixture[]` 格式（扁平化題庫）。
`conjugation.json` 為原始規格資料，格式不同，不能直接匯入。
