# Android (Jetpack Compose)

已建立 Compose 專案（UI/功能比照 iOS）。主要功能：
- 題庫練習（動詞/形容詞、題型、作答模式）
- SRS 計算與錯題複習
- 題庫匯入/匯出/快速匯入
- TTS 朗讀
- AI 介面（Android 目前為尚未實作，會回報 AI 不可用）

## 專案結構
```
apps/android/
  settings.gradle.kts
  build.gradle.kts
  gradle.properties
  gradle/wrapper/
  app/
    src/main/
      AndroidManifest.xml
      assets/fixtures/
      java/com/learnjapanese/app/
```

## 開發環境
- Android Studio (Hedgehog+)
- JDK 17

## 啟動
1. 開啟 `apps/android` 專案
2. Android Studio 進行 Gradle Sync

CLI build：
```bash
cd apps/android
勿 assembleDebug
```

## Fixtures
Android 會從 `app/src/main/assets/fixtures` 讀取，來源為 `packages/core/fixtures`。

## 核心規格
請參考：
- `packages/core/docs`
- `packages/core/fixtures`
