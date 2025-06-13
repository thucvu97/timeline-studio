import { test, expect, Page } from "@playwright/test"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Утилитные функции
async function waitForElement(page: Page, selector: string, timeout = 30000) {
  await page.waitForSelector(selector, { timeout, state: "visible" })
}

async function selectFolder(page: Page) {
  // В реальном Tauri приложении нужно будет мокировать диалог выбора папки
  const folderChooserPromise = page.waitForEvent("filechooser")
  await page.click('[data-testid="add-folder-button"]')
  const folderChooser = await folderChooserPromise
  return folderChooser
}

test.describe("Advanced Media Import Features", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    await waitForElement(page, "div.min-h-screen")
    await page.click('[data-testid="media-tab"]')
  })

  test("should handle folder import with progress tracking", async ({ page }) => {
    // Мокаем выбор папки с множеством файлов
    const testFolderPath = join(__dirname, "..", "fixtures", "media-folder")
    
    // Начинаем импорт папки
    const folderChooser = await selectFolder(page)
    await folderChooser.setFiles([
      join(testFolderPath, "video1.mp4"),
      join(testFolderPath, "video2.mp4"),
      join(testFolderPath, "image1.jpg"),
      join(testFolderPath, "audio1.mp3"),
    ])
    
    // Проверяем появление прогресс-бара с процентами
    const progressBar = page.locator('[data-testid="import-progress"]')
    await expect(progressBar).toBeVisible()
    
    // Проверяем текст прогресса
    const progressText = page.locator('[data-testid="progress-text"]')
    await expect(progressText).toBeVisible()
    await expect(progressText).toContainText(/\d+%/)
    
    // Проверяем счетчик файлов
    const fileCounter = page.locator('[data-testid="file-counter"]')
    await expect(fileCounter).toBeVisible()
    await expect(fileCounter).toContainText(/\d+\s*\/\s*\d+/)
    
    // Ждем завершения
    await expect(progressBar).toBeHidden({ timeout: 30000 })
    
    // Проверяем, что все файлы добавлены
    await expect(page.locator('[data-testid="media-item"]')).toHaveCount(4)
  })

  test("should update placeholders progressively", async ({ page }) => {
    // Добавляем несколько файлов
    const testFiles = Array(5).fill(null).map((_, i) => 
      join(__dirname, "..", "fixtures", `test-video-${i}.mp4`)
    )
    
    const fileChooserPromise = page.waitForEvent("filechooser")
    await page.click('[data-testid="add-media-button"]')
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles(testFiles)
    
    // Проверяем, что сразу появились все плейсхолдеры
    await expect(page.locator('[data-testid="media-placeholder"]')).toHaveCount(5)
    
    // Проверяем, что плейсхолдеры заменяются на превью постепенно
    for (let i = 0; i < 5; i++) {
      // Ждем появления i+1 превью
      await expect(page.locator('[data-testid="media-thumbnail"]')).toHaveCount(i + 1, { 
        timeout: 10000 
      })
      
      // Проверяем, что остальные все еще плейсхолдеры
      const remainingPlaceholders = 5 - (i + 1)
      if (remainingPlaceholders > 0) {
        await expect(page.locator('[data-testid="media-placeholder"]')).toHaveCount(remainingPlaceholders)
      }
    }
  })

  test("should handle mixed content with different aspect ratios", async ({ page }) => {
    const testFiles = [
      join(__dirname, "..", "fixtures", "video-16-9.mp4"),    // 16:9
      join(__dirname, "..", "fixtures", "video-4-3.mp4"),     // 4:3
      join(__dirname, "..", "fixtures", "video-vertical.mp4"), // 9:16
      join(__dirname, "..", "fixtures", "image-square.jpg"),   // 1:1
    ]
    
    const fileChooserPromise = page.waitForEvent("filechooser")
    await page.click('[data-testid="add-media-button"]')
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles(testFiles)
    
    // Ждем загрузки всех превью
    await expect(page.locator('[data-testid="media-thumbnail"]')).toHaveCount(4, { timeout: 20000 })
    
    // В режиме grid все должны быть приведены к 16:9
    const gridItems = page.locator('[data-testid="media-grid-view"] [data-testid="media-preview"]')
    const itemCount = await gridItems.count()
    
    for (let i = 0; i < itemCount; i++) {
      const item = gridItems.nth(i)
      const box = await item.boundingBox()
      if (box) {
        const aspectRatio = box.width / box.height
        expect(aspectRatio).toBeCloseTo(16 / 9, 1)
      }
    }
    
    // Переключаемся на режим thumbnails для проверки оригинальных пропорций
    await page.click('[data-testid="view-mode-thumbnails"]')
    
    // В режиме thumbnails должны сохраняться оригинальные пропорции
    const thumbnailItems = page.locator('[data-testid="media-thumbnails-view"] [data-testid="media-preview"]')
    
    // Проверяем первое видео (16:9)
    const video16_9 = thumbnailItems.nth(0)
    const box16_9 = await video16_9.boundingBox()
    if (box16_9) {
      expect(box16_9.width / box16_9.height).toBeCloseTo(16 / 9, 1)
    }
    
    // Проверяем второе видео (4:3)
    const video4_3 = thumbnailItems.nth(1)
    const box4_3 = await video4_3.boundingBox()
    if (box4_3) {
      expect(box4_3.width / box4_3.height).toBeCloseTo(4 / 3, 1)
    }
  })

  test("should handle import errors gracefully", async ({ page }) => {
    // Имитируем сбой при импорте
    const testFiles = [
      join(__dirname, "..", "fixtures", "valid-video.mp4"),
      join(__dirname, "..", "fixtures", "corrupted-file.mp4"),
      join(__dirname, "..", "fixtures", "valid-image.jpg"),
    ]
    
    const fileChooserPromise = page.waitForEvent("filechooser")
    await page.click('[data-testid="add-media-button"]')
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles(testFiles)
    
    // Ждем обработки файлов
    await page.waitForTimeout(5000)
    
    // Проверяем, что валидные файлы загружены
    await expect(page.locator('[data-testid="media-thumbnail"]')).toHaveCount(2)
    
    // Проверяем, что поврежденный файл показан с ошибкой
    const errorItem = page.locator('[data-testid="media-item-error"]')
    await expect(errorItem).toHaveCount(1)
    
    // Проверяем уведомление об ошибке
    const errorNotification = page.locator('[data-testid="error-notification"]')
    await expect(errorNotification).toBeVisible()
    await expect(errorNotification).toContainText(/1 file.*failed/i)
  })

  test("should support drag and drop import", async ({ page }) => {
    // Получаем зону для перетаскивания
    const dropZone = page.locator('[data-testid="media-drop-zone"]')
    await expect(dropZone).toBeVisible()
    
    // Создаем DataTransfer для drag and drop
    await page.evaluate(() => {
      const dataTransfer = new DataTransfer()
      const file = new File(["test content"], "test-video.mp4", { type: "video/mp4" })
      dataTransfer.items.add(file)
      
      // Создаем события drag and drop
      const dragEnterEvent = new DragEvent("dragenter", {
        dataTransfer,
        bubbles: true,
        cancelable: true,
      })
      
      const dropEvent = new DragEvent("drop", {
        dataTransfer,
        bubbles: true,
        cancelable: true,
      })
      
      const dropZone = document.querySelector('[data-testid="media-drop-zone"]')
      if (dropZone) {
        dropZone.dispatchEvent(dragEnterEvent)
        dropZone.dispatchEvent(dropEvent)
      }
    })
    
    // Проверяем, что появился плейсхолдер
    await expect(page.locator('[data-testid="media-placeholder"]')).toHaveCount(1)
  })

  test("should remember import settings", async ({ page }) => {
    // Изменяем настройки импорта
    await page.click('[data-testid="import-settings-button"]')
    
    const settingsDialog = page.locator('[data-testid="import-settings-dialog"]')
    await expect(settingsDialog).toBeVisible()
    
    // Включаем автоматическое добавление на таймлайн
    await page.click('[data-testid="auto-add-to-timeline-checkbox"]')
    
    // Изменяем качество превью
    await page.selectOption('[data-testid="thumbnail-quality-select"]', "high")
    
    // Сохраняем настройки
    await page.click('[data-testid="save-settings-button"]')
    await expect(settingsDialog).toBeHidden()
    
    // Импортируем файл
    const testVideoPath = join(__dirname, "..", "fixtures", "test-video.mp4")
    const fileChooserPromise = page.waitForEvent("filechooser")
    await page.click('[data-testid="add-media-button"]')
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles([testVideoPath])
    
    // Ждем импорта
    await expect(page.locator('[data-testid="media-thumbnail"]')).toBeVisible({ timeout: 15000 })
    
    // Проверяем, что файл автоматически добавлен на таймлайн
    await expect(page.locator('[data-testid="timeline-clip"]')).toHaveCount(1)
    
    // Перезагружаем страницу
    await page.reload()
    await waitForElement(page, "div.min-h-screen")
    await page.click('[data-testid="media-tab"]')
    
    // Проверяем, что настройки сохранились
    await page.click('[data-testid="import-settings-button"]')
    await expect(settingsDialog).toBeVisible()
    
    const autoAddCheckbox = page.locator('[data-testid="auto-add-to-timeline-checkbox"]')
    await expect(autoAddCheckbox).toBeChecked()
    
    const qualitySelect = page.locator('[data-testid="thumbnail-quality-select"]')
    await expect(qualitySelect).toHaveValue("high")
  })

  test("should support keyboard navigation during import", async ({ page }) => {
    // Добавляем несколько файлов
    const testFiles = Array(3).fill(null).map((_, i) => 
      join(__dirname, "..", "fixtures", `test-video-${i}.mp4`)
    )
    
    const fileChooserPromise = page.waitForEvent("filechooser")
    await page.click('[data-testid="add-media-button"]')
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles(testFiles)
    
    // Ждем загрузки
    await expect(page.locator('[data-testid="media-thumbnail"]')).toHaveCount(3, { timeout: 20000 })
    
    // Фокусируемся на первом элементе
    const firstItem = page.locator('[data-testid="media-item"]').first()
    await firstItem.focus()
    
    // Проверяем навигацию стрелками
    await page.keyboard.press("ArrowRight")
    const secondItem = page.locator('[data-testid="media-item"]').nth(1)
    await expect(secondItem).toBeFocused()
    
    await page.keyboard.press("ArrowRight")
    const thirdItem = page.locator('[data-testid="media-item"]').nth(2)
    await expect(thirdItem).toBeFocused()
    
    // Проверяем добавление через Enter
    await page.keyboard.press("Enter")
    await expect(page.locator('[data-testid="timeline-clip"]')).toHaveCount(1)
    
    // Проверяем множественный выбор через Shift
    await firstItem.focus()
    await page.keyboard.down("Shift")
    await page.keyboard.press("ArrowRight")
    await page.keyboard.press("ArrowRight")
    await page.keyboard.up("Shift")
    
    // Проверяем, что выбрано 3 элемента
    await expect(page.locator('[data-testid="media-item"][data-selected="true"]')).toHaveCount(3)
  })

  test("should show import statistics", async ({ page }) => {
    // Импортируем папку с файлами
    const testFiles = [
      join(__dirname, "..", "fixtures", "video1.mp4"),
      join(__dirname, "..", "fixtures", "video2.mp4"),
      join(__dirname, "..", "fixtures", "image1.jpg"),
      join(__dirname, "..", "fixtures", "audio1.mp3"),
      join(__dirname, "..", "fixtures", "corrupted.mp4"),
    ]
    
    const fileChooserPromise = page.waitForEvent("filechooser")
    await page.click('[data-testid="add-media-button"]')
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles(testFiles)
    
    // Ждем завершения импорта
    await page.waitForTimeout(10000)
    
    // Проверяем статистику импорта
    const importStats = page.locator('[data-testid="import-stats"]')
    await expect(importStats).toBeVisible()
    
    // Проверяем детали статистики
    await expect(importStats).toContainText(/4.*imported successfully/i)
    await expect(importStats).toContainText(/1.*failed/i)
    await expect(importStats).toContainText(/2.*video/i)
    await expect(importStats).toContainText(/1.*image/i)
    await expect(importStats).toContainText(/1.*audio/i)
    
    // Проверяем общий размер
    await expect(importStats).toContainText(/Total size:.*MB/i)
  })
})