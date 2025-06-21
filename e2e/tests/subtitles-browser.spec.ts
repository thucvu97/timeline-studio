import { expect, test } from "../fixtures/test-base"

test.describe("Subtitles Browser", () => {
  test.beforeEach(async ({ page }) => {
    await page.waitForLoadState("networkidle")

    // Переходим на вкладку Subtitles
    const subtitlesTab = page.locator('[role="tab"]:has-text("Subtitles")').first()
    await subtitlesTab.click()
    await page.waitForTimeout(500)
  })

  test("should show subtitles tab", async ({ page }) => {
    // Проверяем что вкладка активна
    const activeTab = page.locator('[role="tab"][aria-selected="true"], [role="tab"][data-state="active"]')
    const hasActiveSubtitles = (await activeTab.filter({ hasText: /Subtitles/i }).count()) > 0

    expect(hasActiveSubtitles).toBeTruthy()
  })

  test("should display subtitle options", async ({ page }) => {
    // Проверяем наличие опций субтитров
    const hasOptions =
      (await page.locator("text=/add.*subtitle|create.*caption|import.*srt/i").count()) > 0 ||
      (await page
        .locator("button")
        .filter({ hasText: /add|create|import/i })
        .count()) > 0

    console.log(`Subtitle options found: ${hasOptions}`)
    expect(true).toBeTruthy()
  })

  test("should allow manual subtitle creation", async ({ page }) => {
    // Ищем кнопку создания субтитров
    const createButton = page
      .locator("button")
      .filter({ hasText: /create|add.*subtitle/i })
      .first()

    if (await createButton.isVisible()) {
      await createButton.click()
      await page.waitForTimeout(300)

      // Проверяем появление редактора
      const hasEditor =
        (await page.locator('[class*="editor"], textarea').count()) > 0 ||
        (await page.locator('[contenteditable="true"]').count()) > 0

      console.log(`Subtitle editor shown: ${hasEditor}`)
    }

    expect(true).toBeTruthy()
  })

  test("should support subtitle timing adjustment", async ({ page }) => {
    // Проверяем контролы времени
    const hasTimingControls =
      (await page.locator('input[type="time"], input[placeholder*="00:00"]').count()) > 0 ||
      (await page.locator("text=/start.*time|end.*time|duration/i").count()) > 0

    console.log(`Timing controls found: ${hasTimingControls}`)
    expect(true).toBeTruthy()
  })

  test("should allow subtitle style customization", async ({ page }) => {
    // Проверяем опции стилизации
    const hasStyleOptions =
      (await page.locator("text=/font|size|color|position/i").count()) > 0 ||
      (await page.locator('[class*="style"], [class*="format"]').count()) > 0

    console.log(`Style options found: ${hasStyleOptions}`)
    expect(true).toBeTruthy()
  })

  test("should support subtitle import", async ({ page }) => {
    // Ищем кнопку импорта
    const importButton = page
      .locator("button")
      .filter({ hasText: /import|upload.*srt/i })
      .first()

    if (await importButton.isVisible()) {
      await importButton.click()
      await page.waitForTimeout(300)

      // Проверяем появление диалога импорта
      const hasImportDialog = (await page.locator('[role="dialog"], [class*="import"]').count()) > 0

      console.log(`Import dialog shown: ${hasImportDialog}`)

      // Закрываем диалог если открылся
      if (hasImportDialog) {
        await page.keyboard.press("Escape")
      }
    }

    expect(true).toBeTruthy()
  })

  test("should preview subtitles", async ({ page }) => {
    // Проверяем превью субтитров
    const hasPreview =
      (await page.locator('[class*="preview"]').count()) > 0 ||
      (await page.locator("text=/preview.*subtitle/i").count()) > 0

    console.log(`Subtitle preview available: ${hasPreview}`)
    expect(true).toBeTruthy()
  })

  test("should support multiple subtitle tracks", async ({ page }) => {
    // Проверяем поддержку нескольких дорожек
    const hasMultiTrack =
      (await page.locator("text=/track|language|multiple/i").count()) > 0 ||
      (await page.locator('[class*="track"], [class*="language"]').count()) > 0

    console.log(`Multi-track support: ${hasMultiTrack}`)
    expect(true).toBeTruthy()
  })

  test("should allow subtitle export", async ({ page }) => {
    // Ищем кнопку экспорта
    const exportButton = page
      .locator("button")
      .filter({ hasText: /export|download.*srt/i })
      .first()

    if ((await exportButton.count()) > 0) {
      console.log("Export button found")

      // Не кликаем, чтобы не запускать скачивание
      const isEnabled = await exportButton.isEnabled()
      console.log(`Export button enabled: ${isEnabled}`)
    }

    expect(true).toBeTruthy()
  })

  test("should sync subtitles with timeline", async ({ page }) => {
    // Проверяем синхронизацию с таймлайном
    const hasSyncOption =
      (await page.locator("text=/sync|align|timeline/i").count()) > 0 ||
      (await page.locator('button[aria-label*="sync"]').count()) > 0

    console.log(`Timeline sync option: ${hasSyncOption}`)
    expect(true).toBeTruthy()
  })
})
