# Skill: capture-screenshots

## 觸發關鍵字

當使用者說「幫我截圖」、「capture screenshots」、「產出畫面素材」、「截取各平台畫面」時使用。

## 用途

在 mono repo 環境下，自動啟動各平台模擬器／瀏覽器，逐一截取每個主要畫面的截圖，並整理至指定輸出目錄。適用於產出功能文件所需的畫面素材。

---

## 前置需求確認

執行截圖前，先確認以下工具已安裝，若未安裝則提示使用者：

| 平台 | 必要工具 | 確認指令 |
|------|----------|----------|
| iOS | Xcode + Simulator | `xcrun simctl list devices` |
| Android | Android Studio + adb | `adb devices` |
| Web | Node.js + Playwright | `npx playwright --version` |

---

## 輸出目錄

所有截圖統一輸出至：

```
docs/screenshots/
├── ios/
├── android/
└── web/
```

若目錄不存在，自動建立。

---

## iOS 截圖流程

### 步驟

1. **選擇模擬器**
   ```bash
   xcrun simctl list devices available
   ```
   優先選 iPhone 17 Pro (iOS 26.2)，若不存在則選最新可用的 iPhone。

2. **啟動模擬器**
   ```bash
   xcrun simctl boot "{DEVICE_NAME}"
   open -a Simulator
   ```

3. **Build & Launch App**
   ```bash
   cd apps/ios
   xcodebuild \
     -scheme "{SCHEME_NAME}" \
     -destination "platform=iOS Simulator,name={DEVICE_NAME}" \
     -configuration Debug \
     build
   xcrun simctl launch booted "{BUNDLE_ID}"
   ```
   > SCHEME_NAME 和 BUNDLE_ID 請從 `apps/ios/project.yml` 推導（此專案使用 xcodegen，不從 .xcodeproj 讀取）。

4. **等待 App 啟動**
   ```bash
   # 輪詢等待 App 出現在前景，最多等 30 秒
   for i in $(seq 1 30); do
     STATUS=$(xcrun simctl listapps booted | grep "{BUNDLE_ID}" || true)
     [ -n "$STATUS" ] && break
     sleep 1
   done
   sleep 2  # 額外等待 UI 渲染完成
   ```

5. **截圖**
   ```bash
   xcrun simctl io booted screenshot docs/screenshots/ios/{screen_name}.png
   ```

6. **導航到下一個畫面後重複步驟 5**
   - 使用 `xcrun simctl io booted` 或 AppleScript 操作 UI
   - 若無法自動導航，記錄需要手動截圖的畫面清單，輸出至 `docs/screenshots/ios/manual-required.txt`

### 注意事項

- 若 build 失敗，先嘗試 `xcodebuild clean`，再重新 build
- 若有 CocoaPods，先執行 `cd apps/ios && pod install`
- 若有 Swift Package Manager，Xcode 會自動處理
- 模擬器截圖預設為 PNG，解析度依裝置而定（Retina = 2x）

---

## Android 截圖流程

### 步驟

1. **確認模擬器或裝置已連線**
   ```bash
   adb devices
   ```
   若無裝置，嘗試啟動 AVD：
   ```bash
   # 列出可用 AVD
   $ANDROID_HOME/emulator/emulator -list-avds
   # 啟動第一個
   $ANDROID_HOME/emulator/emulator -avd "{AVD_NAME}" &
   sleep 10
   ```

2. **Build & Install APK**
   ```bash
   cd apps/android
   ./gradlew assembleDebug
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   ```

3. **Launch App**
   ```bash
   adb shell monkey -p "{PACKAGE_NAME}" -c android.intent.category.LAUNCHER 1
   sleep 2
   ```
   > PACKAGE_NAME 請從 `apps/android/app/build.gradle` 的 `applicationId` 推導。

4. **截圖**
   ```bash
   adb shell screencap -p /sdcard/screenshot.png
   adb pull /sdcard/screenshot.png docs/screenshots/android/{screen_name}.png
   adb shell rm /sdcard/screenshot.png
   ```

5. **導航到下一個畫面後重複步驟 4**
   - 使用 `adb shell input tap {x} {y}` 模擬點擊
   - 若無法自動導航，記錄需要手動截圖的畫面清單，輸出至 `docs/screenshots/android/manual-required.txt`

### 注意事項

- 若 gradlew 無執行權限：`chmod +x apps/android/gradlew`
- 若有多個裝置連線，加上 `-s {DEVICE_ID}` 指定目標
- 截圖解析度依模擬器設定而定，建議使用 Pixel 7 (1080x2400)

---

## Web 截圖流程

### 步驟

1. **安裝 Playwright**
   ```bash
   cd apps/web
   npm install --save-dev @playwright/test
   npx playwright install chromium
   ```

2. **啟動 Dev Server**
   ```bash
   cd apps/web
   npm run dev &
   sleep 5
   ```
   > 預設 port 為 3000，若不同請從 `package.json` 的 scripts 推導。

3. **推導路由並產生截圖 script**

   執行前先讀取 `apps/web` 的 router 設定檔，自動推導 ROUTES：
   - Next.js：掃描 `app/` 或 `pages/` 目錄結構
   - React Router：讀取 `routes.tsx` 或 `router/index.ts`
   - Vue Router：讀取 `router/index.ts`

   推導完成後建立 `scripts/capture-web-screenshots.js`（若已存在則覆蓋）：
   ```javascript
   const { chromium } = require('@playwright/test');

   // 由上方 router 推導自動填入，勿留空陣列
   const ROUTES = [
     { name: 'home', path: '/' },
     // ... 其他推導出的路由
   ];

   (async () => {
     const browser = await chromium.launch();
     const page = await browser.newPage();
     await page.setViewportSize({ width: 1280, height: 800 });

     for (const route of ROUTES) {
       await page.goto(`http://localhost:3000${route.path}`);
       await page.waitForLoadState('networkidle');
       await page.screenshot({
         path: `docs/screenshots/web/${route.name}.png`,
         fullPage: true
       });
       console.log(`截圖完成：${route.name}`);
     }

     await browser.close();
   })();
   ```

4. **執行截圖**
   ```bash
   node ../../scripts/capture-web-screenshots.js
   ```

### 注意事項

- 若 dev server 啟動時間較長，增加 `sleep` 秒數
- 若有需要登入才能看到的頁面，在 script 中加入登入步驟
- Mobile viewport 截圖可加：`await page.setViewportSize({ width: 390, height: 844 })` 模擬 iPhone 15

---

## 執行完成後

截圖完成後，輸出一份摘要至 `docs/screenshots/summary.md`，格式如下：

```markdown
# 截圖摘要

## iOS
- [x] home.png
- [x] profile.png
- [ ] settings.png（需手動截圖，原因：需登入）

## Android
...

## Web
...

## 需要手動補充的畫面
| 平台 | 畫面 | 原因 |
|------|------|------|
| iOS | settings | 需要登入帳號 |
```

完成後告知使用者：
1. 截圖已儲存至 `docs/screenshots/`
2. 列出需要手動補充的畫面（若有）
3. 下一步建議：將截圖與 `docs/features/*.md` 一起提供給 Claude.ai 產出 Word 文件