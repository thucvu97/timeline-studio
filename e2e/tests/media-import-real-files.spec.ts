import { test, expect, Page } from "@playwright/test"
import { TEST_FILES, TEST_DATA_PATH, getAllMediaFiles } from "./test-data"
import { selectors } from "./selectors"

// Утилитная функция для ожидания элемента
async function waitForElement(page: Page, selector: string, timeout = 30000) {
  await page.waitForSelector(selector, { timeout, state: "visible" })
}

// Утилитная функция для имитации выбора файлов
async function selectFiles(page: Page, filePaths: string[]) {
  // В реальном Tauri приложении используется нативный диалог
  // Для тестов мокаем результат команды
  await page.evaluate((paths) => {
    // Мокаем ответ от Tauri для команды open_file_dialog
    (window as any).__TAURI_INTERNALS__ = {
      ...(window as any).__TAURI_INTERNALS__,
      invoke: async (cmd: string, args?: any) => {
        if (cmd === "plugin:dialog|open_file") {
          return { paths }
        }
        // Вызываем оригинальный обработчик для других команд
        const original = (window as any).__TAURI_INTERNALS__.invoke
        return original(cmd, args)
      },
    }
  }, filePaths)
  
  // Кликаем на кнопку добавления медиа
  await page.click(selectors.browser.toolbar.addMediaButton)
}

// Утилитная функция для имитации выбора папки
async function selectFolder(page: Page, folderPath: string) {
  // Мокаем ответ от Tauri для команды open_folder_dialog
  await page.evaluate((path) => {
    (window as any).__TAURI_INTERNALS__ = {
      ...(window as any).__TAURI_INTERNALS__,
      invoke: async (cmd: string, args?: any) => {
        if (cmd === "plugin:dialog|open_folder") {
          return { path }
        }
        // Вызываем оригинальный обработчик для других команд
        const original = (window as any).__TAURI_INTERNALS__.invoke
        return original(cmd, args)
      },
    }
  }, folderPath)
  
  // Кликаем на кнопку добавления папки
  await page.click(selectors.browser.toolbar.addFolderButton)
}

test.describe("Импорт реальных медиафайлов", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    
    // Ждем загрузки MediaStudio
    await waitForElement(page, "div.min-h-screen")
    
    // Переходим на вкладку Media
    await waitForElement(page, selectors.browser.mediaTabs.media)
    await page.click(selectors.browser.mediaTabs.media)
  })

  test("должен загрузить отдельные файлы разных типов", async ({ page }) => {
    // Проверяем начальное состояние
    await expect(page.locator(selectors.browser.noFilesMessage)).toBeVisible()
    
    // Выбираем файлы разных типов
    const testFiles = [
      TEST_FILES.videos[0].path,  // C0666.MP4
      TEST_FILES.images[0].path,  // DSC07845.png
      TEST_FILES.audio[0].path,   // DJI_02_20250402_104352.WAV
    ]
    
    await selectFiles(page, testFiles)
    
    // Ждем появления плейсхолдеров
    await expect(page.locator(selectors.media.placeholder)).toHaveCount(3, { timeout: 10000 })
    
    // Проверяем типы плейсхолдеров
    const videoPlaceholder = page.locator(`${selectors.media.placeholder}[data-type="video"]`)
    const imagePlaceholder = page.locator(`${selectors.media.placeholder}[data-type="image"]`)
    const audioPlaceholder = page.locator(`${selectors.media.placeholder}[data-type="audio"]`)
    
    await expect(videoPlaceholder).toHaveCount(1)
    await expect(imagePlaceholder).toHaveCount(1)
    await expect(audioPlaceholder).toHaveCount(1)
    
    // Ждем появления прогресс-бара
    await expect(page.locator(selectors.import.progress)).toBeVisible({ timeout: 5000 })
    
    // Ждем обработки файлов (замена плейсхолдеров на реальные элементы)
    await expect(page.locator(selectors.media.item)).toHaveCount(3, { timeout: 30000 })
    
    // Проверяем, что прогресс-бар исчез
    await expect(page.locator(selectors.import.progress)).toBeHidden({ timeout: 10000 })
  })

  test("должен загрузить все файлы из папки test-data", async ({ page }) => {
    // Проверяем начальное состояние
    await expect(page.locator(selectors.browser.noFilesMessage)).toBeVisible()
    
    // Выбираем папку с тестовыми данными
    await selectFolder(page, TEST_DATA_PATH)
    
    // Ждем появления плейсхолдеров для всех файлов
    const totalFiles = getAllMediaFiles().length
    await expect(page.locator(selectors.media.placeholder)).toHaveCount(totalFiles, { timeout: 10000 })
    
    // Ждем появления прогресс-бара
    await expect(page.locator(selectors.import.progress)).toBeVisible({ timeout: 5000 })
    
    // Проверяем счетчик файлов
    const fileCounter = page.locator(selectors.import.fileCounter)
    await expect(fileCounter).toContainText(`из ${totalFiles}`)
    
    // Ждем обработки всех файлов
    await expect(page.locator(selectors.media.item)).toHaveCount(totalFiles, { timeout: 60000 })
    
    // Проверяем, что прогресс-бар исчез
    await expect(page.locator(selectors.import.progress)).toBeHidden({ timeout: 10000 })
    
    // Проверяем, что все файлы отображаются корректно
    for (const file of getAllMediaFiles()) {
      await expect(page.locator(`text=${file.name}`)).toBeVisible()
    }
  })

  test("должен правильно отображать метаданные загруженных файлов", async ({ page }) => {
    // Загружаем видеофайл
    await selectFiles(page, [TEST_FILES.videos[3].path]) // water play3.mp4
    
    // Ждем обработки файла
    await expect(page.locator(selectors.media.item)).toHaveCount(1, { timeout: 30000 })
    
    // Проверяем отображение метаданных
    const mediaItem = page.locator(selectors.media.item).first()
    
    // Проверяем название файла
    await expect(mediaItem).toContainText("water play3.mp4")
    
    // Проверяем наличие длительности для видео
    const duration = mediaItem.locator(selectors.media.metadata.duration)
    await expect(duration).toBeVisible()
    
    // Проверяем наличие размера файла
    const size = mediaItem.locator(selectors.media.metadata.size)
    await expect(size).toBeVisible()
  })

  test("должен корректно обрабатывать файлы с кириллицей в названии", async ({ page }) => {
    // Загружаем файл с русским названием
    await selectFiles(page, [TEST_FILES.videos[4].path]) // проводка после лобби.mp4
    
    // Ждем обработки файла
    await expect(page.locator(selectors.media.item)).toHaveCount(1, { timeout: 30000 })
    
    // Проверяем, что файл отображается корректно
    await expect(page.locator("text=проводка после лобби.mp4")).toBeVisible()
  })

  test("должен поддерживать отмену импорта", async ({ page }) => {
    // Начинаем импорт всех файлов из папки
    await selectFolder(page, TEST_DATA_PATH)
    
    // Ждем появления прогресс-бара
    await expect(page.locator(selectors.import.progress)).toBeVisible({ timeout: 5000 })
    
    // Кликаем на кнопку отмены
    await page.click(selectors.import.cancelButton)
    
    // Проверяем, что импорт был отменен
    // Количество обработанных файлов должно быть меньше общего количества
    const totalFiles = getAllMediaFiles().length
    const processedFiles = await page.locator(selectors.media.item).count()
    
    expect(processedFiles).toBeLessThan(totalFiles)
  })

  test("должен добавлять файлы на таймлайн", async ({ page }) => {
    // Загружаем видеофайл
    await selectFiles(page, [TEST_FILES.videos[2].path]) // Kate.mp4
    
    // Ждем обработки файла
    await expect(page.locator(selectors.media.item)).toHaveCount(1, { timeout: 30000 })
    
    // Наводим на медиа-элемент, чтобы появилась кнопка добавления
    const mediaItem = page.locator(selectors.media.item).first()
    await mediaItem.hover()
    
    // Кликаем на кнопку добавления на таймлайн
    const addButton = mediaItem.locator(selectors.media.addToTimelineButton)
    await addButton.click()
    
    // Проверяем, что файл добавлен на таймлайн
    await expect(page.locator(selectors.timeline.clip)).toHaveCount(1)
    
    // Проверяем, что появилась галочка на медиа-элементе
    await expect(mediaItem.locator(selectors.media.addedCheckIcon)).toBeVisible()
  })

  test("должен корректно переключать режимы отображения", async ({ page }) => {
    // Загружаем несколько файлов
    const testFiles = getMixedFiles(3)
    await selectFiles(page, testFiles.map(f => f.path))
    
    // Ждем обработки файлов
    await expect(page.locator(selectors.media.item)).toHaveCount(3, { timeout: 30000 })
    
    // Проверяем режим списка (по умолчанию)
    await expect(page.locator(selectors.views.list)).toBeVisible()
    
    // Переключаемся на режим сетки
    await page.click(selectors.browser.toolbar.viewModeButtons.grid)
    await expect(page.locator(selectors.views.grid)).toBeVisible()
    
    // Переключаемся на режим миниатюр
    await page.click(selectors.browser.toolbar.viewModeButtons.thumbnails)
    await expect(page.locator(selectors.views.thumbnails)).toBeVisible()
    
    // Проверяем, что количество элементов не изменилось
    await expect(page.locator(selectors.media.item)).toHaveCount(3)
  })
})

test.describe("Проверка производительности при большом количестве файлов", () => {
  test("должен эффективно обрабатывать все файлы из папки без зависаний UI", async ({ page }) => {
    // Увеличиваем таймаут для этого теста
    test.setTimeout(120000)
    
    // Загружаем папку
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    await waitForElement(page, selectors.browser.mediaTabs.media)
    await page.click(selectors.browser.mediaTabs.media)
    
    // Начинаем измерение времени
    const startTime = Date.now()
    
    // Выбираем папку с тестовыми данными
    await selectFolder(page, TEST_DATA_PATH)
    
    // Проверяем, что UI остается отзывчивым
    // Пытаемся взаимодействовать с другими элементами во время загрузки
    const searchInput = page.locator('input[type="search"]')
    await searchInput.fill("test")
    await searchInput.clear()
    
    // Ждем завершения обработки всех файлов
    const totalFiles = getAllMediaFiles().length
    await expect(page.locator(selectors.media.item)).toHaveCount(totalFiles, { timeout: 90000 })
    
    // Проверяем время обработки
    const endTime = Date.now()
    const processingTime = (endTime - startTime) / 1000
    
    console.log(`Обработка ${totalFiles} файлов заняла ${processingTime} секунд`)
    
    // Проверяем, что все файлы отображаются корректно
    for (const file of getAllMediaFiles()) {
      await expect(page.locator(`text=${file.name}`)).toBeVisible()
    }
  })
})