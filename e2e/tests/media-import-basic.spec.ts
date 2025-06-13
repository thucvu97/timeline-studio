import { test, expect } from "@playwright/test"
import { TEST_FILES } from "./test-data"

test.describe("Базовый импорт медиафайлов", () => {
  test("должен открыть приложение и перейти на вкладку медиа", async ({ page }) => {
    // Открываем приложение
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    
    // Проверяем, что приложение загрузилось
    await expect(page.locator("div.min-h-screen")).toBeVisible({ timeout: 10000 })
    
    // Проверяем наличие вкладки Media
    const mediaTab = page.locator('[data-testid="media-tab"]')
    await expect(mediaTab).toBeVisible()
    
    // Кликаем на вкладку Media
    await mediaTab.click()
    
    // Проверяем, что отображается сообщение об отсутствии файлов
    await expect(page.locator('[data-testid="no-files-message"]')).toBeVisible()
    
    // Проверяем наличие кнопок импорта
    await expect(page.locator('[data-testid="add-media-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="add-folder-button"]')).toBeVisible()
  })

  test("должен отображать информацию о тестовых файлах", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    
    // Выводим информацию о доступных тестовых файлах
    const videoCount = TEST_FILES.videos.length
    const imageCount = TEST_FILES.images.length
    const audioCount = TEST_FILES.audio.length
    
    console.log(`Доступные тестовые файлы:`)
    console.log(`- Видео: ${videoCount} файлов`)
    TEST_FILES.videos.forEach(f => console.log(`  • ${f.name}`))
    console.log(`- Изображения: ${imageCount} файлов`)
    TEST_FILES.images.forEach(f => console.log(`  • ${f.name}`))
    console.log(`- Аудио: ${audioCount} файлов`)
    TEST_FILES.audio.forEach(f => console.log(`  • ${f.name}`))
    
    // Проверяем, что файлы существуют
    expect(videoCount).toBeGreaterThan(0)
    expect(imageCount).toBeGreaterThan(0)
    expect(audioCount).toBeGreaterThan(0)
  })
})