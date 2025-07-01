import { expect, test } from "@playwright/test"

test.describe("Debug Tab Switching", () => {
  test("check tab switching mechanism", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    
    // Ждем загрузки приложения
    await page.waitForTimeout(3000)
    
    // Находим вкладку Effects по data-testid в первом tablist (browser tabs)
    const browserTablist = page.locator('[role="tablist"]').first()
    const effectsTab = browserTablist.locator('[data-testid="effects-tab"]')
    
    console.log("Effects tab visible:", await effectsTab.isVisible())
    console.log("Effects tab enabled:", await effectsTab.isEnabled())
    
    // Получаем начальное состояние
    const initialState = await effectsTab.getAttribute("data-state")
    console.log("Initial state of Effects tab:", initialState)
    
    // Кликаем по вкладке
    console.log("Clicking on Effects tab...")
    await effectsTab.click()
    
    // Ждем немного
    await page.waitForTimeout(1000)
    
    // Проверяем новое состояние
    const newState = await effectsTab.getAttribute("data-state")
    console.log("New state of Effects tab:", newState)
    
    // Проверяем, что Media tab стала неактивной
    const mediaTab = browserTablist.locator('[data-testid="media-tab"]')
    const mediaState = await mediaTab.getAttribute("data-state")
    console.log("Media tab state after clicking Effects:", mediaState)
    
    // Проверяем содержимое вкладки
    const tabContent = page.locator('[role="tabpanel"]')
    const contentCount = await tabContent.count()
    console.log("Tab panel count:", contentCount)
    
    // Делаем скриншот для визуальной проверки
    await page.screenshot({ path: "tab-switching-debug.png", fullPage: true })
    
    // Проверяем, что состояние изменилось
    expect(newState).toBe("active")
  })
})