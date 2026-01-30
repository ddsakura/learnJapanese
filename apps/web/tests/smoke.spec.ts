import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/ollama/api/generate", async (route) => {
    const request = route.request();
    const post = request.postDataJSON() as { prompt?: string } | undefined;
    const prompt = post?.prompt ?? "";

    let responseText = "";
    if (prompt.includes("錯誤答案")) {
      responseText = "行って\n行いた\n行った";
    } else if (prompt.startsWith("請把以下日文翻譯成繁體中文")) {
      responseText = "示例翻譯";
    } else {
      responseText =
        "JP: 行った\nReading: いった\nZH: 去了\nGrammar: た形";
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ response: responseText }),
    });
  });
});

test("loads a question", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".prompt")).toBeVisible();
});

test("choice mode allows answering", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("作答方式").selectOption("choice");
  await expect(page.locator(".choice-button").first()).toBeVisible();
  await page.locator(".choice-button").first().click();
  await expect(page.locator(".result .badge")).toBeVisible();
});
