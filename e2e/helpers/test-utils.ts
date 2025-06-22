import { Page } from "@playwright/test"

/**
 * Утилиты для e2e тестов
 */

/**
 * Ждет загрузки приложения Timeline Studio
 */
export async function waitForApp(page: Page) {
  // Ждем загрузки страницы
  await page.waitForLoadState("networkidle")

  // Ждем появления основных элементов
  await page.waitForSelector("body", { state: "visible" })

  // Даем время на инициализацию React
  await page.waitForTimeout(1000)
}

/**
 * Получает элемент по data-testid или fallback селектору
 */
export async function getElement(page: Page, testId: string, fallbackSelector?: string) {
  const testIdSelector = `[data-testid="${testId}"]`

  // Сначала пробуем найти по data-testid
  const hasTestId = (await page.locator(testIdSelector).count()) > 0
  if (hasTestId) {
    return page.locator(testIdSelector).first()
  }

  // Если нет data-testid и есть fallback, используем его
  if (fallbackSelector) {
    return page.locator(fallbackSelector).first()
  }

  // Возвращаем локатор по testid даже если элемент не найден
  return page.locator(testIdSelector).first()
}

/**
 * Кликает на вкладку в браузере
 */
export async function clickBrowserTab(page: Page, tabName: string) {
  // Множественные селекторы для поиска табов
  const selectors = [
    `[role="tab"]:has-text("${tabName}")`,
    `button:has-text("${tabName}")`,
    `[data-testid="${tabName.toLowerCase()}-tab"]`,
    `[data-tab="${tabName.toLowerCase()}"]`,
  ]

  let tab = null
  for (const selector of selectors) {
    const count = await page.locator(selector).count()
    if (count > 0) {
      tab = page.locator(selector).first()
      break
    }
  }

  if (!tab) {
    throw new Error(`Tab "${tabName}" not found with any selector`)
  }

  // Убеждаемся что таб видимый и кликабельный
  await tab.waitFor({ state: "visible", timeout: 5000 })
  await tab.click()

  // Даем время на обновление контента
  await page.waitForTimeout(300)

  // Опционально проверяем активное состояние (может не быть на всех табах)
  try {
    await page.waitForFunction(
      (name) => {
        const tabs = document.querySelectorAll('[role="tab"], button')
        for (const tab of tabs) {
          if (tab.textContent?.includes(name)) {
            return (
              tab.getAttribute("aria-selected") === "true" ||
              tab.getAttribute("data-state") === "active" ||
              tab.classList.contains("active") ||
              tab.classList.contains("selected")
            )
          }
        }
        return true // Если не можем проверить, считаем что ОК
      },
      tabName,
      { timeout: 2000 },
    )
  } catch (error) {
    // Игнорируем ошибки проверки активного состояния
    console.log(`Could not verify active state for tab "${tabName}", continuing...`)
  }
}

/**
 * Мокает Tauri API для тестов
 */
export async function mockTauriAPI(page: Page) {
  await page.addInitScript(() => {
    // Базовый мок Tauri API
    window.__TAURI__ = {
      core: {
        invoke: async (cmd: string, args?: any) => {
          console.log("Mock Tauri invoke:", cmd, args)

          switch (cmd) {
            case "get_app_info":
              return { version: "0.23.0", name: "Timeline Studio" }

            case "get_media_files":
              return []

            case "get_project_settings":
              return {
                frameRate: 30,
                resolution: { width: 1920, height: 1080 },
                aspectRatio: "16:9",
              }

            case "import_media_files":
              return {
                success: true,
                files: args?.paths?.map((path: string) => ({
                  path,
                  name: path.split("/").pop(),
                  type: path.endsWith(".mp4") ? "video" : "image",
                })),
              }

            default:
              return null
          }
        },
      },

      dialog: {
        open: async (options?: any) => {
          // Эмулируем выбор файлов
          if (options?.multiple) {
            return ["/test/video1.mp4", "/test/video2.mp4"]
          }
          return "/test/video.mp4"
        },
        save: async () => "/test/project.json",
      },

      fs: {
        readTextFile: async () => "{}",
        writeTextFile: async () => {},
        exists: async () => true,
      },

      path: {
        homeDir: async () => "/home/user",
        appDataDir: async () => "/home/user/.timeline-studio",
      },

      notification: {
        sendNotification: async () => {},
      },
    }
  })
}

/**
 * Ждет появления элемента с несколькими возможными селекторами
 */
export async function waitForAnySelector(page: Page, selectors: string[], timeout = 5000) {
  const selector = selectors.join(", ")
  await page.waitForSelector(selector, { timeout })
  return page.locator(selector).first()
}

/**
 * Проверяет что хотя бы один из селекторов видим
 */
export async function isAnyVisible(page: Page, selectors: string[]) {
  for (const selector of selectors) {
    try {
      const count = await page.locator(selector).count()
      if (count > 0) {
        const isVisible = await page.locator(selector).first().isVisible()
        if (isVisible) return true
      }
    } catch (e) {}
  }
  return false
}

/**
 * Делает скриншот с именем теста
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `test-results/screenshots/${name}.png`,
    fullPage: true,
  })
}

/**
 * Эмулирует drag and drop файлов
 */
export async function dragAndDropFiles(page: Page, files: string[], dropSelector: string) {
  await page.evaluate(
    ({ files, selector }) => {
      const dropZone = document.querySelector(selector) as HTMLElement
      if (!dropZone) return

      // Создаем файлы
      const dataTransfer = new DataTransfer()
      files.forEach((filePath) => {
        const fileName = filePath.split("/").pop() || "file"
        const file = new File([""], fileName, {
          type: fileName.endsWith(".mp4") ? "video/mp4" : "image/jpeg",
        })
        dataTransfer.items.add(file)
      })

      // Эмулируем события
      const dragEnter = new DragEvent("dragenter", { dataTransfer, bubbles: true })
      const dragOver = new DragEvent("dragover", { dataTransfer, bubbles: true })
      const drop = new DragEvent("drop", { dataTransfer, bubbles: true })

      dropZone.dispatchEvent(dragEnter)
      dropZone.dispatchEvent(dragOver)
      dropZone.dispatchEvent(drop)
    },
    { files, selector: dropSelector },
  )
}
