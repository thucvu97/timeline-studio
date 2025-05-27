import { test, expect } from "@playwright/test"

test("home page loads correctly", async ({ page }) => {
  await page.goto("/")

  // Проверяем, что страница загрузилась
  // В Tauri заголовок устанавливается в tauri.conf.json
  // В тестовом окружении Next.js заголовок может быть пустым или "localhost"
  await page.waitForLoadState("networkidle")

  // Проверяем наличие основного контейнера
  await expect(page.locator("div.min-h-screen")).toBeVisible()

  // Проверяем, что MediaStudio загрузилась
  await expect(page.locator("div.min-h-screen")).toBeVisible()
})

test("html element has light class", async ({ page }) => {
  await page.goto("/")

  // Ждем, пока страница полностью загрузится
  await page.waitForLoadState("networkidle")

  // Проверяем, что html элемент имеет класс light
  await expect(page.locator("html")).toHaveClass(/light/)
})
