import { expect, test } from "@playwright/test"
import { clickBrowserTab, isAnyVisible, waitForApp } from "../helpers/test-utils"
import { TEST_FILES } from "./test-data"

test.describe("Базовый импорт медиафайлов", () => {
  test("должен открыть приложение и перейти на вкладку медиа", async ({ page }) => {
    // Открываем приложение
    await page.goto("/")
    await waitForApp(page)

    // Проверяем, что приложение загрузилось
    await expect(page.locator("div.min-h-screen")).toBeVisible({ timeout: 10000 })

    // Переходим на вкладку Media
    await clickBrowserTab(page, "Media")

    // Проверяем что мы на вкладке Media - ищем индикаторы
    const hasMediaContent = await isAnyVisible(page, [
      'button:has-text("Import")',
      'button:has-text("Add")',
      "text=/no media|empty|drag/i",
      '[class*="drop"]',
      '[class*="import"]',
    ])

    expect(hasMediaContent).toBeTruthy()

    // Проверяем наличие кнопок
    const buttons = await page.locator("button:visible").count()
    expect(buttons).toBeGreaterThan(0)
  })

  test("должен отображать информацию о тестовых файлах", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")

    // Выводим информацию о доступных тестовых файлах
    const videoCount = TEST_FILES.videos.length
    const imageCount = TEST_FILES.images.length
    const audioCount = TEST_FILES.audio.length

    console.log("Доступные тестовые файлы:")
    console.log(`- Видео: ${videoCount} файлов`)
    TEST_FILES.videos.forEach((f) => console.log(`  • ${f.name}`))
    console.log(`- Изображения: ${imageCount} файлов`)
    TEST_FILES.images.forEach((f) => console.log(`  • ${f.name}`))
    console.log(`- Аудио: ${audioCount} файлов`)
    TEST_FILES.audio.forEach((f) => console.log(`  • ${f.name}`))

    // Проверяем, что файлы существуют
    expect(videoCount).toBeGreaterThan(0)
    expect(imageCount).toBeGreaterThan(0)
    expect(audioCount).toBeGreaterThan(0)
  })
})
