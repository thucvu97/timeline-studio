import { expect, Page } from "@playwright/test"
import path from "path"

/**
 * Утилиты для тестирования медиа-импорта
 */

/**
 * Ожидание появления элемента с повторными попытками
 */
export async function waitForElement(
  page: Page,
  selector: string,
  options: { timeout?: number; state?: "visible" | "hidden" | "attached" | "detached" } = {},
) {
  const { timeout = 30000, state = "visible" } = options
  await page.waitForSelector(selector, { timeout, state })
}

/**
 * Имитация выбора файлов через диалог
 */
export async function selectFiles(page: Page, filePaths: string[]) {
  // В реальном Tauri приложении диалог выбора файлов обрабатывается нативно
  // Для тестов используем обходной путь через file input

  // Создаем скрытый input для файлов если его нет
  await page.evaluate(() => {
    if (!document.querySelector('input[type="file"][data-testid="file-input-mock"]')) {
      const input = document.createElement("input")
      input.type = "file"
      input.multiple = true
      input.setAttribute("data-testid", "file-input-mock")
      input.style.display = "none"
      document.body.appendChild(input)
    }
  })

  // Устанавливаем обработчик для кнопки добавления медиа
  await page.evaluate(() => {
    const addButton = document.querySelector('[data-testid="add-media-button"]')
    const fileInput = document.querySelector('input[type="file"][data-testid="file-input-mock"]') as HTMLInputElement

    if (addButton && fileInput) {
      addButton.addEventListener(
        "click",
        (e) => {
          e.preventDefault()
          fileInput.click()
        },
        { once: true },
      )
    }
  })

  // Устанавливаем файлы
  const fileInput = page.locator('input[type="file"][data-testid="file-input-mock"]')
  await fileInput.setInputFiles(filePaths)

  // Кликаем на кнопку добавления
  await page.click('[data-testid="add-media-button"]')
}

/**
 * Создание тестовых файлов
 */
export function getTestFilePaths(count: number, type: "video" | "image" | "audio" = "video") {
  const extension = type === "video" ? "mp4" : type === "audio" ? "mp3" : "jpg"
  // Путь от e2e/tests к корню проекта и затем к test-data
  const testDataPath = path.join(process.cwd(), "test-data")
  return Array(count)
    .fill(null)
    .map((_, i) => path.join(testDataPath, `test-${type}-${i}.${extension}`))
}

/**
 * Проверка соотношения сторон элемента
 */
export async function checkAspectRatio(page: Page, selector: string, expectedRatio: number, tolerance = 0.1) {
  const element = page.locator(selector).first()
  const boundingBox = await element.boundingBox()

  if (!boundingBox) {
    throw new Error(`Element ${selector} not found or not visible`)
  }

  const actualRatio = boundingBox.width / boundingBox.height
  expect(actualRatio).toBeCloseTo(expectedRatio, tolerance)
}

/**
 * Ожидание завершения импорта
 */
export async function waitForImportComplete(page: Page, timeout = 30000) {
  // Ждем исчезновения прогресс-бара
  await page.waitForSelector('[data-testid="import-progress"]', {
    state: "hidden",
    timeout,
  })

  // Ждем появления уведомления о завершении
  const notification = page.locator('[data-testid="import-complete-notification"]')
  await expect(notification).toBeVisible({ timeout: 5000 })
}

/**
 * Проверка метаданных медиафайла
 */
export async function verifyMediaMetadata(
  page: Page,
  itemIndex: number,
  expectedMetadata: {
    duration?: RegExp
    size?: RegExp
    resolution?: RegExp
    format?: string
  },
) {
  const mediaItem = page.locator('[data-testid="media-item"]').nth(itemIndex)

  if (expectedMetadata.duration) {
    const duration = mediaItem.locator('[data-testid="media-duration"]')
    await expect(duration).toHaveText(expectedMetadata.duration)
  }

  if (expectedMetadata.size) {
    const size = mediaItem.locator('[data-testid="media-size"]')
    await expect(size).toHaveText(expectedMetadata.size)
  }

  if (expectedMetadata.resolution) {
    const resolution = mediaItem.locator('[data-testid="media-resolution"]')
    await expect(resolution).toHaveText(expectedMetadata.resolution)
  }

  if (expectedMetadata.format) {
    const format = mediaItem.locator('[data-testid="media-format"]')
    await expect(format).toContainText(expectedMetadata.format)
  }
}

/**
 * Добавление файлов на таймлайн
 */
export async function addToTimeline(page: Page, itemIndices: number[]) {
  for (const index of itemIndices) {
    const mediaItem = page.locator('[data-testid="media-item"]').nth(index)
    await mediaItem.hover()

    const addButton = mediaItem.locator('[data-testid="add-to-timeline-button"]')
    await expect(addButton).toBeVisible()
    await addButton.click()

    // Проверяем, что кнопка изменилась
    const checkIcon = mediaItem.locator('[data-testid="added-check-icon"]')
    await expect(checkIcon).toBeVisible()
  }

  // Проверяем, что файлы появились на таймлайне
  await expect(page.locator('[data-testid="timeline-clip"]')).toHaveCount(itemIndices.length)
}

/**
 * Имитация drag and drop файлов
 */
export async function dragAndDropFiles(page: Page, filePaths: string[]) {
  await page.evaluate((paths) => {
    const dataTransfer = new DataTransfer()

    // Создаем File объекты для каждого пути
    paths.forEach((path) => {
      const fileName = path.split("/").pop() || "file"
      const file = new File(["test content"], fileName, {
        type: fileName.endsWith(".mp4")
          ? "video/mp4"
          : fileName.endsWith(".jpg")
            ? "image/jpeg"
            : fileName.endsWith(".mp3")
              ? "audio/mp3"
              : "application/octet-stream",
      })
      dataTransfer.items.add(file)
    })

    // Находим drop zone
    const dropZone = document.querySelector('[data-testid="media-drop-zone"]')
    if (!dropZone) return

    // Создаем события
    const dragEnterEvent = new DragEvent("dragenter", {
      dataTransfer,
      bubbles: true,
      cancelable: true,
    })

    const dragOverEvent = new DragEvent("dragover", {
      dataTransfer,
      bubbles: true,
      cancelable: true,
    })

    const dropEvent = new DragEvent("drop", {
      dataTransfer,
      bubbles: true,
      cancelable: true,
    })

    // Отправляем события
    dropZone.dispatchEvent(dragEnterEvent)
    dropZone.dispatchEvent(dragOverEvent)
    dropZone.dispatchEvent(dropEvent)
  }, filePaths)
}

/**
 * Проверка прогресса импорта
 */
export async function verifyImportProgress(page: Page) {
  const progressBar = page.locator('[data-testid="import-progress"]')
  const progressText = page.locator('[data-testid="progress-text"]')
  const fileCounter = page.locator('[data-testid="file-counter"]')

  // Проверяем видимость элементов
  await expect(progressBar).toBeVisible()
  await expect(progressText).toBeVisible()
  await expect(fileCounter).toBeVisible()

  // Проверяем, что прогресс обновляется
  const initialProgress = await progressBar.getAttribute("aria-valuenow")
  await page.waitForTimeout(1000)
  const updatedProgress = await progressBar.getAttribute("aria-valuenow")

  expect(Number(updatedProgress)).toBeGreaterThan(Number(initialProgress))
}

/**
 * Выбор нескольких файлов с клавишей Shift/Ctrl
 */
export async function selectMultipleItems(page: Page, startIndex: number, endIndex: number, useShift = true) {
  const modifier = useShift ? "Shift" : "Control"

  // Кликаем на первый элемент
  await page.locator('[data-testid="media-item"]').nth(startIndex).click()

  // Зажимаем модификатор и кликаем на последний элемент
  await page.keyboard.down(modifier)
  await page.locator('[data-testid="media-item"]').nth(endIndex).click()
  await page.keyboard.up(modifier)

  // Проверяем количество выбранных элементов
  const expectedCount = useShift ? Math.abs(endIndex - startIndex) + 1 : 2
  await expect(page.locator('[data-testid="media-item"][data-selected="true"]')).toHaveCount(expectedCount)
}
