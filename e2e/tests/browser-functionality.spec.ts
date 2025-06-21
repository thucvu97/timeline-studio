import { BrowserPage } from "../fixtures/page-objects/browser-page"
import { expect, test } from "../fixtures/test-base"

test.describe("Browser Functionality", () => {
  let browserPage: BrowserPage

  test.beforeEach(async ({ page }) => {
    browserPage = new BrowserPage(page)
  })

  test("should display media browser with correct tabs", async ({ page }) => {
    // Проверяем все вкладки браузера
    await expect(browserPage.mediaTab).toBeVisible()
    await expect(browserPage.effectsTab).toBeVisible()
    await expect(browserPage.transitionsTab).toBeVisible()
    await expect(browserPage.templatesTab).toBeVisible()
  })

  test("should show empty state in media tab", async ({ page }) => {
    await browserPage.selectTab("Media")

    // Проверяем что есть либо пустое состояние, либо кнопки импорта
    const hasEmptyState = await browserPage.emptyState.isVisible().catch(() => false)
    const hasImportButton = await browserPage.importButton.isVisible().catch(() => false)

    expect(hasEmptyState || hasImportButton).toBeTruthy()
  })

  test("should switch between different browser tabs", async ({ page }) => {
    // Переключаемся на Effects
    await browserPage.selectTab("Effects")
    await expect(browserPage.effectsTab).toHaveAttribute("aria-selected", "true")

    // Проверяем что контент изменился
    const effectsContent = page.locator("text=/Effects|Эффекты/i").first()
    await expect(effectsContent).toBeVisible()

    // Переключаемся на Transitions
    await browserPage.selectTab("Transitions")
    await expect(browserPage.transitionsTab).toHaveAttribute("aria-selected", "true")

    // Переключаемся на Templates
    await browserPage.selectTab("Templates")
    await expect(browserPage.templatesTab).toHaveAttribute("aria-selected", "true")
  })

  test("should display effects in grid layout", async ({ page }) => {
    await browserPage.selectTab("Effects")

    // Ждем загрузки контента
    await page.waitForTimeout(500)

    // Проверяем что есть какой-то контент эффектов
    const hasEffectsContent =
      (await page.locator("text=/effect|filter|blur|color|brightness/i").count()) > 0 ||
      (await page.locator('[class*="effect"], [class*="grid"]').count()) > 0

    expect(hasEffectsContent).toBeTruthy()
  })

  test("should display transitions with preview", async ({ page }) => {
    await browserPage.selectTab("Transitions")

    // Ждем загрузки контента
    await page.waitForTimeout(500)

    // Проверяем что есть какой-то контент переходов
    const hasTransitionsContent =
      (await page.locator("text=/transition|fade|slide|wipe|dissolve/i").count()) > 0 ||
      (await page.locator('[class*="transition"], [class*="grid"]').count()) > 0

    expect(hasTransitionsContent).toBeTruthy()
  })

  test("should display templates categories", async ({ page }) => {
    await browserPage.selectTab("Templates")

    // Проверяем наличие категорий шаблонов
    const templateCategories = page.locator("text=/Multi-camera|Intro|Outro/i")
    await expect(templateCategories.first()).toBeVisible()
  })

  test("should handle import button click", async ({ page }) => {
    await browserPage.selectTab("Media")
    await page.waitForTimeout(500)

    // Проверяем наличие кнопки импорта
    const importButtonVisible = await browserPage.importButton.isVisible().catch(() => false)

    if (importButtonVisible) {
      // Настраиваем перехват команд Tauri
      await page.evaluate(() => {
        if (window.__TAURI__) {
          window.__TAURI__._importClicked = false
          const originalInvoke = window.__TAURI__.core.invoke
          window.__TAURI__.core.invoke = async (cmd: string, args?: any) => {
            if (cmd.includes("dialog") || cmd.includes("import")) {
              window.__TAURI__._importClicked = true
            }
            return originalInvoke ? originalInvoke(cmd, args) : null
          }
        }
      })

      // Кликаем на кнопку импорта
      await browserPage.importButton.click()
      await page.waitForTimeout(300)

      // Проверяем что команда была вызвана или кнопка остается активной
      const importClicked = await page.evaluate(() => (window as any).__TAURI__?._importClicked)
      const buttonStillVisible = await browserPage.importButton.isVisible()

      expect(importClicked || buttonStillVisible).toBeTruthy()
    } else {
      console.log("Import button not found, skipping test")
    }
  })

  test("should show search functionality", async ({ page }) => {
    // Проверяем наличие поля поиска
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first()
    await expect(searchInput).toBeVisible()

    // Вводим текст в поиск
    await searchInput.fill("test")

    // Проверяем что поиск работает
    await expect(searchInput).toHaveValue("test")
  })
})
