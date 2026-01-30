# learnJapanese (monorepo)

此 repo 目前包含：

- `apps/web`：現有的 Vite/React Web App
- `apps/ios`：SwiftUI 版本（預留）
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
