import { expect, test } from "@playwright/test"

test.describe("Debug Browser Tabs", () => {
  test("check browser tabs presence", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    
    // Ждем загрузки приложения
    await page.waitForTimeout(3000)
    
    // Проверяем наличие tablist
    const tablist = page.locator('[role="tablist"]')
    console.log("Tablist count:", await tablist.count())
    
    // Проверяем все табы
    const tabs = page.locator('[role="tab"]')
    const tabCount = await tabs.count()
    console.log("Total tabs found:", tabCount)
    
    // Выводим информацию о каждой вкладке
    for (let i = 0; i < tabCount; i++) {
      const tab = tabs.nth(i)
      const value = await tab.getAttribute("value")
      const dataState = await tab.getAttribute("data-state")
      const testId = await tab.getAttribute("data-testid")
      const text = await tab.textContent()
      console.log(`Tab ${i}: value="${value}", data-state="${dataState}", data-testid="${testId}", text="${text}"`)
    }
    
    // Проверяем наличие конкретных вкладок по data-testid
    const mediaTab = page.locator('[data-testid="media-tab"]')
    const effectsTab = page.locator('[data-testid="effects-tab"]')
    const transitionsTab = page.locator('[data-testid="transitions-tab"]')
    const templatesTab = page.locator('[data-testid="templates-tab"]')
    
    console.log("\nChecking tabs by data-testid:")
    console.log("Media tab present:", await mediaTab.count() > 0)
    console.log("Effects tab present:", await effectsTab.count() > 0)
    console.log("Transitions tab present:", await transitionsTab.count() > 0)
    console.log("Templates tab present:", await templatesTab.count() > 0)
    
    // Делаем скриншот для визуальной проверки
    await page.screenshot({ path: "browser-tabs-debug.png", fullPage: true })
    
    // Проверяем, что хотя бы одна вкладка существует
    expect(tabCount).toBeGreaterThan(0)
  })
})