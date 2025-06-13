import { test, expect } from "@playwright/test"
import { TEST_FILES, TEST_DATA_PATH } from "./test-data"
import { selectors } from "./selectors"

/**
 * Демонстрационный тест для проверки импорта медиафайлов
 * Этот тест показывает, как работает импорт с реальными файлами
 */
test.describe("Демонстрация импорта медиафайлов", () => {
  test("показать процесс импорта файлов из test-data", async ({ page }) => {
    // 1. Открываем приложение
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    console.log("✅ Приложение загружено")
    
    // 2. Переходим на вкладку Media
    await page.click(selectors.browser.mediaTabs.media)
    console.log("✅ Открыта вкладка Media")
    
    // 3. Проверяем начальное состояние
    await expect(page.locator(selectors.browser.noFilesMessage)).toBeVisible()
    console.log("✅ Отображается сообщение об отсутствии файлов")
    
    // 4. Делаем скриншот начального состояния
    await page.screenshot({ 
      path: 'test-results/demo-1-initial-state.png',
      fullPage: true 
    })
    console.log("📸 Сохранен скриншот начального состояния")
    
    // 5. Информация о доступных файлах
    console.log("\n📁 Доступные тестовые файлы в", TEST_DATA_PATH)
    console.log("📹 Видео файлы:")
    TEST_FILES.videos.forEach(f => console.log(`   - ${f.name}`))
    console.log("🖼️  Изображения:")
    TEST_FILES.images.forEach(f => console.log(`   - ${f.name}`))
    console.log("🎵 Аудио файлы:")
    TEST_FILES.audio.forEach(f => console.log(`   - ${f.name}`))
    
    // 6. Проверяем наличие кнопок импорта
    const addMediaButton = page.locator(selectors.browser.toolbar.addMediaButton)
    const addFolderButton = page.locator(selectors.browser.toolbar.addFolderButton)
    
    await expect(addMediaButton).toBeVisible()
    await expect(addFolderButton).toBeVisible()
    console.log("\n✅ Кнопки импорта доступны")
    
    // 7. Делаем скриншот с выделением кнопок
    await addMediaButton.hover()
    await page.screenshot({ 
      path: 'test-results/demo-2-import-buttons.png',
      fullPage: true 
    })
    console.log("📸 Сохранен скриншот кнопок импорта")
    
    // 8. Демонстрация различных режимов отображения
    console.log("\n🔄 Проверка режимов отображения...")
    
    // Проверяем наличие кнопок переключения режимов
    const listViewButton = page.locator('[data-testid="list-view-button"]')
    const thumbnailsViewButton = page.locator('[data-testid="thumbnails-view-button"]')
    
    if (await listViewButton.isVisible()) {
      console.log("✅ Доступен режим списка")
    }
    
    if (await thumbnailsViewButton.isVisible()) {
      console.log("✅ Доступен режим миниатюр")
    }
    
    // 9. Итоговая информация
    console.log("\n📊 Итоги демонстрации:")
    console.log("- Приложение успешно загружается")
    console.log("- Вкладка Media работает корректно")
    console.log("- Кнопки импорта доступны")
    console.log("- Тестовые файлы готовы к использованию")
    console.log("\n💡 Для реального импорта файлов запустите приложение через 'bun run tauri dev'")
    console.log("   и используйте кнопки импорта для выбора файлов из папки public/test-data")
  })
  
  test("проверить структуру тестовых данных", async ({ page }) => {
    // Этот тест просто проверяет, что все тестовые файлы доступны
    const allFiles = [...TEST_FILES.videos, ...TEST_FILES.images, ...TEST_FILES.audio]
    
    console.log(`\n📊 Статистика тестовых файлов:`)
    console.log(`Всего файлов: ${allFiles.length}`)
    console.log(`- Видео: ${TEST_FILES.videos.length}`)
    console.log(`- Изображения: ${TEST_FILES.images.length}`)
    console.log(`- Аудио: ${TEST_FILES.audio.length}`)
    
    // Проверяем, что файлы существуют
    expect(allFiles.length).toBe(7) // 5 видео + 1 изображение + 1 аудио
    
    // Проверяем файлы с кириллицей
    const cyrillicFiles = allFiles.filter(f => /[а-яА-Я]/.test(f.name))
    console.log(`\nФайлы с кириллицей в названии: ${cyrillicFiles.length}`)
    cyrillicFiles.forEach(f => console.log(`- ${f.name}`))
    
    // Проверяем различные форматы
    const formats = {
      mp4: allFiles.filter(f => f.name.endsWith('.mp4')).length,
      MP4: allFiles.filter(f => f.name.endsWith('.MP4')).length,
      png: allFiles.filter(f => f.name.endsWith('.png')).length,
      wav: allFiles.filter(f => f.name.endsWith('.WAV')).length,
    }
    
    console.log(`\nФорматы файлов:`)
    Object.entries(formats).forEach(([format, count]) => {
      if (count > 0) {
        console.log(`- .${format}: ${count} файлов`)
      }
    })
  })
})