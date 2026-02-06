# Android App (Jetpack Compose)

## 開發環境

- Android Studio
- JDK 17

## Build / Run

Android Studio 開啟 `apps/android` 後同步即可執行。

CLI：

```bash
cd apps/android
./gradlew assembleDebug
```

## 測試

```bash
cd apps/android
./gradlew :app:assembleUnitTest
```

## Ollama 設定（可選）

可在 `apps/android/local.properties` 設定：

```properties
ollama.enabled=true
ollama.baseUrl=http://10.0.2.2:11434
ollama.model=translategemma:12b
```

- Emulator 連本機請用 `10.0.2.2`
- 實機請改成電腦區網 IP

## fixtures

- Android 讀取：`app/src/main/assets/fixtures/`
- 來源：`packages/core/fixtures/`

同步與生成流程請看：`packages/core/docs/overview.md`

## App Icon

- 來源圖：repo root `icon-source.png`
