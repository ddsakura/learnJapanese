# learnJapanese Monorepo

這個 repo 包含三個 App（Web / iOS / Android）與一份跨平台核心規格（Core）。

## Repo 結構

- `apps/web`：Vite + React Web App
- `apps/ios`：SwiftUI App
- `apps/android`：Jetpack Compose App
- `packages/core`：跨平台規格文件與 fixtures

## 文件入口

- Monorepo apps 導覽：`apps/README.md`
- Core 規格總覽：`packages/core/docs/overview.md`
- Web 操作：`apps/web/README.md`
- iOS 操作：`apps/ios/README.md`
- Android 操作：`apps/android/README.md`

## 快速開始

### Web

```bash
cd apps/web
npm install
npm run dev
```

### iOS

```bash
cd apps/ios
xcodegen generate
```

然後打開 `apps/ios/LearnJapanese.xcodeproj` 執行。

### Android

```bash
cd apps/android
./gradlew assembleDebug
```

## 測試

### Web

```bash
cd apps/web
npm test
npm run test:e2e
```

### iOS

請用 Xcode Test（`LearnJapaneseTests` target）。

### Android

```bash
cd apps/android
./gradlew :app:testDebugUnitTest
```

## 跨平台題庫與 fixtures

`packages/core/fixtures/bank.json` 是預設題庫 source of truth（不含學習進度）。

常用操作請看：`packages/core/docs/overview.md`

- 推送 root 題庫到各平台：`node scripts/fixtures-push.mjs --to all`
- 將平台題庫回寫 root：`node scripts/fixtures-pull.mjs --from web|ios|android`
- 生成規則測試 fixtures：`node scripts/generate-conjugation.mjs`
- 檢查 fixtures 同步：`node scripts/check-conjugation.mjs`

## 其他

- 共用 App Icon 來源：`icon-source.png`
