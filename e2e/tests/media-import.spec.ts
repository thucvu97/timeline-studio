import { test, expect, Page } from "@playwright/test"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Утилитная функция для ожидания элемента
async function waitForElement(page: Page, selector: string, timeout = 30000) {
  await page.waitForSelector(selector, { timeout, state: "visible" })
}

// Утилитная функция для имитации выбора файла
async function selectFiles(page: Page, filePaths: string[]) {
  // В реальном Tauri приложении нужно будет мокировать диалог выбора файлов
  // Для тестов используем input type="file"
  const fileChooserPromise = page.waitForEvent("filechooser")
  
  // Кликаем на кнопку добавления медиа
  await page.click('[data-testid="add-media-button"]')
  
  const fileChooser = await fileChooserPromise
  await fileChooser.setFiles(filePaths)
}

test.describe("Media Import Process", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    
    // Ждем загрузки MediaStudio
    await waitForElement(page, "div.min-h-screen")
  })

  test("should display placeholders when adding files", async ({ page }) => {
    // Проверяем наличие вкладки Media
    await waitForElement(page, '[data-testid="media-tab"]')
    await page.click('[data-testid="media-tab"]')
    
    // Проверяем, что отображается сообщение об отсутствии файлов
    await expect(page.locator('[data-testid="no-files-message"]')).toBeVisible()
    
    // Имитируем добавление файлов
    const testVideoPath = join(__dirname, "..", "fixtures", "test-video.mp4")
    const testImagePath = join(__dirname, "..", "fixtures", "test-image.jpg")
    
    // Начинаем процесс добавления файлов
    await selectFiles(page, [testVideoPath, testImagePath])
    
    // Проверяем, что появились плейсхолдеры
    await expect(page.locator('[data-testid="media-placeholder"]')).toHaveCount(2)
    
    // Проверяем типы плейсхолдеров
    const videoPlaceholder = page.locator('[data-testid="media-placeholder"][data-type="video"]').first()
    const imagePlaceholder = page.locator('[data-testid="media-placeholder"][data-type="image"]').first()
    
    await expect(videoPlaceholder).toBeVisible()
    await expect(imagePlaceholder).toBeVisible()
    
    // Проверяем иконки
    await expect(videoPlaceholder.locator("svg")).toBeVisible()
    await expect(imagePlaceholder.locator("svg")).toBeVisible()
  })

  test("should maintain 16:9 aspect ratio for video/image placeholders", async ({ page }) => {
    await page.click('[data-testid="media-tab"]')
    
    const testVideoPath = join(__dirname, "..", "fixtures", "test-video.mp4")
    await selectFiles(page, [testVideoPath])
    
    // Ждем появления плейсхолдера
    const placeholder = page.locator('[data-testid="media-placeholder"]').first()
    await expect(placeholder).toBeVisible()
    
    // Проверяем соотношение сторон через CSS классы
    await expect(placeholder).toHaveClass(/aspect-video/)
    
    // Проверяем фактические размеры
    const boundingBox = await placeholder.boundingBox()
    if (boundingBox) {
      const aspectRatio = boundingBox.width / boundingBox.height
      // Проверяем, что соотношение близко к 16:9 (1.777...)
      expect(aspectRatio).toBeCloseTo(16 / 9, 1)
    }
  })

  test("should show progress bar during import", async ({ page }) => {
    await page.click('[data-testid="media-tab"]')
    
    const testVideoPath = join(__dirname, "..", "fixtures", "test-video.mp4")
    
    // Начинаем импорт
    const fileChooserPromise = page.waitForEvent("filechooser")
    await page.click('[data-testid="add-media-button"]')
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles([testVideoPath])
    
    // Проверяем появление прогресс-бара
    const progressBar = page.locator('[data-testid="import-progress"]')
    await expect(progressBar).toBeVisible({ timeout: 5000 })
    
    // Проверяем, что прогресс-бар имеет значение
    const progressValue = await progressBar.getAttribute("aria-valuenow")
    expect(progressValue).toBeTruthy()
    
    // Ждем завершения импорта
    await expect(progressBar).toBeHidden({ timeout: 30000 })
  })

  test("should update placeholders with real thumbnails", async ({ page }) => {
    await page.click('[data-testid="media-tab"]')
    
    const testVideoPath = join(__dirname, "..", "fixtures", "test-video.mp4")
    await selectFiles(page, [testVideoPath])
    
    // Сначала проверяем плейсхолдер
    const placeholder = page.locator('[data-testid="media-placeholder"]').first()
    await expect(placeholder).toBeVisible()
    
    // Ждем замены плейсхолдера на реальное превью
    const thumbnail = page.locator('[data-testid="media-thumbnail"]').first()
    await expect(thumbnail).toBeVisible({ timeout: 15000 })
    
    // Проверяем, что плейсхолдер скрылся
    await expect(placeholder).toBeHidden()
    
    // Проверяем, что превью содержит изображение
    const thumbnailImage = thumbnail.locator("img")
    await expect(thumbnailImage).toBeVisible()
    await expect(thumbnailImage).toHaveAttribute("src", /^(data:image|blob:|http)/)
  })

  test("should allow canceling import operation", async ({ page }) => {
    await page.click('[data-testid="media-tab"]')
    
    // Создаем массив из нескольких файлов для длительного импорта
    const testFiles = Array(5).fill(null).map((_, i) => 
      join(__dirname, "..", "fixtures", `test-video-${i}.mp4`)
    )
    
    // Начинаем импорт
    await selectFiles(page, testFiles)
    
    // Ждем появления прогресс-бара
    await expect(page.locator('[data-testid="import-progress"]')).toBeVisible()
    
    // Проверяем наличие кнопки отмены
    const cancelButton = page.locator('[data-testid="cancel-import"]')
    await expect(cancelButton).toBeVisible()
    
    // Кликаем отмену
    await cancelButton.click()
    
    // Проверяем, что импорт остановлен
    await expect(page.locator('[data-testid="import-progress"]')).toBeHidden()
    
    // Проверяем, что появилось сообщение об отмене
    await expect(page.locator('[data-testid="import-cancelled-message"]')).toBeVisible()
  })

  test("should add files to timeline", async ({ page }) => {
    await page.click('[data-testid="media-tab"]')
    
    const testVideoPath = join(__dirname, "..", "fixtures", "test-video.mp4")
    await selectFiles(page, [testVideoPath])
    
    // Ждем завершения импорта
    await expect(page.locator('[data-testid="media-thumbnail"]')).toBeVisible({ timeout: 15000 })
    
    // Наводим на медиа-элемент
    const mediaItem = page.locator('[data-testid="media-item"]').first()
    await mediaItem.hover()
    
    // Проверяем появление кнопки добавления
    const addButton = mediaItem.locator('[data-testid="add-to-timeline-button"]')
    await expect(addButton).toBeVisible()
    
    // Кликаем на кнопку добавления
    await addButton.click()
    
    // Проверяем, что кнопка изменилась на галочку
    const checkIcon = mediaItem.locator('[data-testid="added-check-icon"]')
    await expect(checkIcon).toBeVisible()
    
    // Проверяем, что файл появился на таймлайне
    const timelineClip = page.locator('[data-testid="timeline-clip"]').first()
    await expect(timelineClip).toBeVisible()
    
    // Проверяем, что название клипа соответствует файлу
    await expect(timelineClip).toContainText("test-video")
  })

  test("should handle multiple file types correctly", async ({ page }) => {
    await page.click('[data-testid="media-tab"]')
    
    const testFiles = [
      join(__dirname, "..", "fixtures", "test-video.mp4"),
      join(__dirname, "..", "fixtures", "test-audio.mp3"),
      join(__dirname, "..", "fixtures", "test-image.jpg"),
    ]
    
    await selectFiles(page, testFiles)
    
    // Проверяем правильные типы плейсхолдеров
    await expect(page.locator('[data-testid="media-placeholder"][data-type="video"]')).toHaveCount(1)
    await expect(page.locator('[data-testid="media-placeholder"][data-type="audio"]')).toHaveCount(1)
    await expect(page.locator('[data-testid="media-placeholder"][data-type="image"]')).toHaveCount(1)
    
    // Для аудио проверяем квадратное соотношение сторон
    const audioPlaceholder = page.locator('[data-testid="media-placeholder"][data-type="audio"]').first()
    await expect(audioPlaceholder).toHaveClass(/aspect-square/)
  })

  test("should update file metadata after processing", async ({ page }) => {
    await page.click('[data-testid="media-tab"]')
    
    const testVideoPath = join(__dirname, "..", "fixtures", "test-video.mp4")
    await selectFiles(page, [testVideoPath])
    
    // Ждем появления метаданных
    const mediaItem = page.locator('[data-testid="media-item"]').first()
    
    // Сначала проверяем, что метаданные еще загружаются
    const loadingIndicator = mediaItem.locator('[data-testid="metadata-loading"]')
    await expect(loadingIndicator).toBeVisible()
    
    // Ждем появления реальных метаданных
    const duration = mediaItem.locator('[data-testid="media-duration"]')
    await expect(duration).toBeVisible({ timeout: 15000 })
    await expect(duration).toHaveText(/\d{1,2}:\d{2}/)
    
    // Проверяем размер файла
    const fileSize = mediaItem.locator('[data-testid="media-size"]')
    await expect(fileSize).toBeVisible()
    await expect(fileSize).toHaveText(/\d+(\.\d+)?\s*(B|KB|MB|GB)/)
    
    // Проверяем разрешение для видео
    const resolution = mediaItem.locator('[data-testid="media-resolution"]')
    await expect(resolution).toBeVisible()
    await expect(resolution).toHaveText(/\d+x\d+/)
  })

  test("should show error state for corrupted files", async ({ page }) => {
    await page.click('[data-testid="media-tab"]')
    
    const corruptedFilePath = join(__dirname, "..", "fixtures", "corrupted-file.mp4")
    await selectFiles(page, [corruptedFilePath])
    
    // Ждем появления ошибки
    const errorItem = page.locator('[data-testid="media-item-error"]').first()
    await expect(errorItem).toBeVisible({ timeout: 10000 })
    
    // Проверяем сообщение об ошибке
    const errorMessage = errorItem.locator('[data-testid="error-message"]')
    await expect(errorMessage).toBeVisible()
    await expect(errorMessage).toContainText(/error|failed|corrupt/i)
    
    // Проверяем, что плейсхолдер остался
    const placeholder = errorItem.locator('[data-testid="media-placeholder"]')
    await expect(placeholder).toBeVisible()
  })

  test("should support batch operations", async ({ page }) => {
    await page.click('[data-testid="media-tab"]')
    
    // Добавляем несколько файлов
    const testFiles = Array(3).fill(null).map((_, i) => 
      join(__dirname, "..", "fixtures", `test-video-${i}.mp4`)
    )
    await selectFiles(page, testFiles)
    
    // Ждем загрузки всех файлов
    await expect(page.locator('[data-testid="media-thumbnail"]')).toHaveCount(3, { timeout: 20000 })
    
    // Выбираем все файлы (Ctrl+A или Cmd+A)
    await page.keyboard.press("Control+A")
    
    // Проверяем, что все файлы выделены
    await expect(page.locator('[data-testid="media-item"][data-selected="true"]')).toHaveCount(3)
    
    // Проверяем появление кнопки массового добавления
    const batchAddButton = page.locator('[data-testid="batch-add-button"]')
    await expect(batchAddButton).toBeVisible()
    
    // Добавляем все файлы на таймлайн
    await batchAddButton.click()
    
    // Проверяем, что все файлы добавлены
    await expect(page.locator('[data-testid="timeline-clip"]')).toHaveCount(3)
  })
})

test.describe("Media Browser Views", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    await waitForElement(page, "div.min-h-screen")
    await page.click('[data-testid="media-tab"]')
    
    // Добавляем тестовые файлы
    const testFiles = [
      join(__dirname, "..", "fixtures", "test-video.mp4"),
      join(__dirname, "..", "fixtures", "test-image.jpg"),
    ]
    await selectFiles(page, testFiles)
    await expect(page.locator('[data-testid="media-thumbnail"]')).toHaveCount(2, { timeout: 15000 })
  })

  test("should switch between view modes", async ({ page }) => {
    // Проверяем режим сетки (по умолчанию)
    await expect(page.locator('[data-testid="view-mode-grid"]')).toHaveAttribute("aria-pressed", "true")
    await expect(page.locator('[data-testid="media-grid-view"]')).toBeVisible()
    
    // Переключаемся на режим списка
    await page.click('[data-testid="view-mode-list"]')
    await expect(page.locator('[data-testid="view-mode-list"]')).toHaveAttribute("aria-pressed", "true")
    await expect(page.locator('[data-testid="media-list-view"]')).toBeVisible()
    
    // Переключаемся на режим миниатюр
    await page.click('[data-testid="view-mode-thumbnails"]')
    await expect(page.locator('[data-testid="view-mode-thumbnails"]')).toHaveAttribute("aria-pressed", "true")
    await expect(page.locator('[data-testid="media-thumbnails-view"]')).toBeVisible()
  })

  test("should maintain aspect ratio in different view modes", async ({ page }) => {
    // Проверяем в режиме сетки
    const gridItem = page.locator('[data-testid="media-grid-view"] [data-testid="media-item"]').first()
    const gridBox = await gridItem.boundingBox()
    if (gridBox) {
      const gridAspectRatio = gridBox.width / gridBox.height
      expect(gridAspectRatio).toBeCloseTo(16 / 9, 1)
    }
    
    // Переключаемся на режим списка
    await page.click('[data-testid="view-mode-list"]')
    const listItem = page.locator('[data-testid="media-list-view"] [data-testid="media-preview"]').first()
    const listBox = await listItem.boundingBox()
    if (listBox) {
      const listAspectRatio = listBox.width / listBox.height
      expect(listAspectRatio).toBeCloseTo(16 / 9, 1)
    }
  })
})