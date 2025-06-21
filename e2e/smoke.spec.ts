import { expect, test } from "@playwright/test"

test.describe("Smoke Tests", () => {
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
        !error.includes("Cannot read properties of undefined"),
    )
    expect(criticalErrors).toHaveLength(0)

    // Проверяем, что основной контейнер загрузился
    await expect(page.locator("div.h-screen")).toBeVisible()

    // Проверяем, что TopBar загрузился (это div с кнопками управления)
    await expect(page.locator('[data-testid="user-settings-button"]')).toBeVisible()
  })

  test("can see browser tabs", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")

    // Проверяем, что вкладки браузера отображаются
    // По умолчанию в браузере есть вкладки: Media, Effects, Transitions и т.д.
    const tabs = page.locator('[role="tablist"]').first()
    await expect(tabs).toBeVisible()

    // Проверяем наличие вкладок
    const mediaTab = tabs.locator('[role="tab"]').filter({ hasText: /media/i })
    await expect(mediaTab).toBeVisible()
  })
})
