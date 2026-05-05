const { chromium } = require('/Users/ericc/Programming/ai/learnJapanese/apps/web/node_modules/playwright');
const path = require('path');

const OUT_DIR = path.resolve(__dirname, '../docs/screenshots/web');
const BASE = 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  async function shot(name) {
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage: true });
    console.log(`截圖完成：${name}.png`);
  }

  // 1. Main conjugation view (default: verb + input mode)
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await shot('conjugation-verb-input');

  // 2. Choice mode — switch 作答方式 to 四選一 (last select on page)
  const selects = page.locator('select');
  const count = await selects.count();
  // 作答方式 is the last select
  await selects.nth(count - 1).selectOption({ label: '四選一' });
  await shot('conjugation-verb-choice');

  // 3. Adjective conjugation — switch 類型 select (second select: 動詞/形容詞)
  await selects.nth(1).selectOption({ label: '形容詞' });
  await shot('conjugation-adjective');

  // 4. Transitivity mode — switch 主題 select (first select)
  await selects.nth(0).selectOption({ label: '自他動詞' });
  await shot('transitivity');

  // 5. Stats panel — reload and scroll to bottom
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await shot('stats-panel');

  await browser.close();
  console.log('Web 截圖全部完成。');
})();
