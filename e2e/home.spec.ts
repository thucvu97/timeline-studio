import { expect, test } from "@playwright/test"

test("home page loads correctly", async ({ page }) => {
  // Слушаем логи консоли браузера
  page.on("console", (msg) => {
    console.log(`Browser console [${msg.type()}]:`, msg.text())
  })

  page.on("pageerror", (error) => {
    console.error("Page error:", error)
  })

  await page.goto("/")

  // Проверяем, что страница загрузилась
  await page.waitForLoadState("networkidle")

  // Делаем скриншот для отладки
  await page.screenshot({ path: "test-results/debug-screenshot.png" })

  // Проверяем наличие основного контейнера
  await expect(page.locator("div.min-h-screen")).toBeVisible({ timeout: 10000 })

  // Проверяем, что MediaStudio загрузилась
  await expect(page.locator("div.h-screen")).toBeVisible()
})

test("html element has light class", async ({ page }) => {
  await page.goto("/")

  // Ждем, пока страница полностью загрузится
  await page.waitForLoadState("networkidle")

  // Проверяем, что html элемент имеет класс light
  await expect(page.locator("html")).toHaveClass(/light/)
})
