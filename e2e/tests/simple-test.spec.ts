import { expect, test } from "@playwright/test"

test.describe("Simple Tests", () => {
  test("should load the app", async ({ page }) => {
    // Просто открываем страницу
    await page.goto("/")

    // Ждем загрузки
    await page.waitForLoadState("networkidle")

    // Проверяем что страница загрузилась
    await expect(page).toHaveURL("http://localhost:3001/")

    // Проверяем что есть какой-то контент
    const body = page.locator("body")
    await expect(body).toBeVisible()
  })

  test("should have correct page structure", async ({ page }) => {
    await page.goto("/")

    // Проверяем что страница загрузилась правильно
    const html = page.locator("html")
    await expect(html).toHaveAttribute("lang", "en")

    // Проверяем основной контейнер приложения
    const appContainer = page.locator(".min-h-screen")
    await expect(appContainer).toBeVisible()
  })

  test("should show some UI elements", async ({ page }) => {
    await page.goto("/")

    // Ищем любые кнопки
    const buttons = page.locator("button")
    const buttonCount = await buttons.count()

    // Должна быть хотя бы одна кнопка
    expect(buttonCount).toBeGreaterThan(0)

    // Ищем вкладки
    const tabs = page.locator('[role="tab"]')
    const tabCount = await tabs.count()

    // Должны быть вкладки
    expect(tabCount).toBeGreaterThan(0)
  })
})
