import { test, expect } from "@playwright/test"
import { TEST_FILES, TEST_DATA_PATH } from "./test-data"
import { selectors } from "./selectors"

// Этот тест предназначен для запуска с реальным Tauri приложением
// Запустите: bun run tauri dev
// Затем: bun run playwright test e2e/tests/media-import-integration.spec.ts

test.describe("Интеграционные тесты импорта медиафайлов", () => {
  // Пропускаем тесты, если не в режиме интеграции
  test.skip(process.env.INTEGRATION_TEST !== "true", "Только для интеграционных тестов с Tauri")
  
  test("должен импортировать реальные файлы через диалог выбора", async ({ page }) => {
    // Для интеграционных тестов используем реальное Tauri приложение
    await page.goto("tauri://localhost")
    await page.waitForLoadState("networkidle")
    
    // Переходим на вкладку Media
    await page.click(selectors.browser.mediaTabs.media)
    
    // В реальном приложении нужно вручную выбрать файлы через диалог
    console.log("Выберите файлы из папки:", TEST_DATA_PATH)
    console.log("Доступные файлы:")
    TEST_FILES.videos.forEach(f => console.log(`  - ${f.name}`))
    TEST_FILES.images.forEach(f => console.log(`  - ${f.name}`))
    TEST_FILES.audio.forEach(f => console.log(`  - ${f.name}`))
    
    // Кликаем на кнопку добавления файлов
    await page.click(selectors.browser.toolbar.addMediaButton)
    
    // Ждем появления медиа-элементов
    await expect(page.locator(selectors.media.item)).toHaveCount(1, { 
      timeout: 60000,
      message: "Выберите хотя бы один файл в диалоге" 
    })
    
    console.log("Файлы успешно импортированы!")
  })
})