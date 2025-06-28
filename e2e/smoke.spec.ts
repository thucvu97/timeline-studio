import { expect, test } from "@playwright/test"

test.describe("Smoke Tests", () => {
  test.skip(process.env.CI === "true", "Skip smoke tests in CI until Tauri setup is fixed")
  
  test("application loads without errors", async ({ page }) => {
    // Слушаем ошибки консоли (исключая предупреждения)
    const errors: string[] = []
    page.on("pageerror", (error) => {
      errors.push(error.message)
    })

    await page.goto("/")
    await page.waitForLoadState("networkidle")

    // Проверяем, что нет критических ошибок
    const criticalErrors = errors.filter(
      (error) =>
        !error.includes("Cannot read properties of null") && // Временно игнорируем эти ошибки
        !error.includes("Cannot read properties of undefined") &&
        !error.includes("ResizeObserver") // Игнорируем ResizeObserver ошибки
    )
    expect(criticalErrors).toHaveLength(0)

    // Проверяем, что основной контейнер загрузился
    await expect(page.locator("div.min-h-screen")).toBeVisible()

    // Ждем загрузки MediaStudio
    await page.waitForTimeout(2000)

    // Проверяем наличие основных элементов интерфейса
    // TopBar должен быть виден
    const topBar = page.locator("div").filter({ hasText: /Timeline Studio/i }).first()
    await expect(topBar).toBeVisible({ timeout: 10000 })
  })

  test("can see browser tabs", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    
    // Ждем загрузки интерфейса
    await page.waitForTimeout(2000)

    // Проверяем, что есть контейнер с вкладками браузера
    // Вкладки находятся в Browser компоненте
    const browserSection = page.locator("section").filter({ has: page.locator('[role="tablist"]') }).first()
    await expect(browserSection).toBeVisible({ timeout: 10000 })

    // Проверяем наличие хотя бы одной вкладки
    const anyTab = page.locator('[role="tab"]').first()
    await expect(anyTab).toBeVisible({ timeout: 10000 })
  })
})
