# Android (Jetpack Compose)

已建立 Compose 專案（UI/功能比照 iOS）。主要功能：
- 題庫練習（動詞/形容詞、題型、作答模式）
- SRS 計算與錯題複習
- 題庫匯入/匯出/快速匯入
- TTS 朗讀
- AI 介面（可選連接本機 Ollama，失敗時 fallback 離線模板）

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
./gradlew assembleDebug
```

## Ollama（零成本）

Android 支援連接本機 Ollama（HTTP），連線失敗時會自動改用離線模板。

在 `apps/android/local.properties` 設定：
```properties
ollama.enabled=true
ollama.baseUrl=http://10.0.2.2:11434
ollama.model=qwen2.5:3b
```

- Emulator 請用 `10.0.2.2` 連回同台 Mac
- 實機請改成 Mac 區網 IP（例如 `http://192.168.x.x:11434`）
- Debug 已允許 cleartext HTTP（`app/src/debug/AndroidManifest.xml`）
- 若不想連 Ollama：`ollama.enabled=false`

## Fixtures
Android 會從 `app/src/main/assets/fixtures` 讀取，來源為 `packages/core/fixtures`。

## 核心規格
請參考：
- `packages/core/docs`
- `packages/core/fixtures`
