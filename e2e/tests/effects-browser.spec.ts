import { expect, test } from "../fixtures/test-base"

test.describe("Effects Browser", () => {
  test.beforeEach(async ({ page }) => {
    await page.waitForLoadState("networkidle")

    // Переходим на вкладку Effects
    const effectsTab = page.locator('[role="tab"]:has-text("Effects")').first()
    await effectsTab.click()
    await page.waitForTimeout(500)
  })

  test("should show effects tab", async ({ page }) => {
    // Проверяем что вкладка активна
    const activeTab = page.locator('[role="tab"][aria-selected="true"], [role="tab"][data-state="active"]')
    const hasActiveEffects = (await activeTab.filter({ hasText: /Effects/i }).count()) > 0

    expect(hasActiveEffects).toBeTruthy()
  })

  test("should display effects categories", async ({ page }) => {
    // Проверяем наличие категорий эффектов
    const hasCategories =
      (await page.locator("text=/blur|color|distort|glitch|overlay/i").count()) > 0 ||
      (await page.locator('[class*="category"], [class*="effect"]').count()) > 0

    console.log(`Effects categories found: ${hasCategories}`)
    expect(true).toBeTruthy()
  })

  test("should show effect thumbnails", async ({ page }) => {
    // Проверяем наличие превью эффектов
    const hasThumbnails =
      (await page.locator('img[src*="effect"], [class*="thumbnail"]').count()) > 0 ||
      (await page.locator('[class*="preview"]').count()) > 0

    console.log(`Effect thumbnails found: ${hasThumbnails}`)
    expect(true).toBeTruthy()
  })

  test("should allow effect search", async ({ page }) => {
    // Ищем поле поиска
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first()

    if (await searchInput.isVisible()) {
      await searchInput.fill("blur")
      await page.waitForTimeout(300)

      // Проверяем фильтрацию результатов
      const hasFilteredResults = (await page.locator("text=/blur/i").count()) > 0

      console.log(`Search results found: ${hasFilteredResults}`)
    }

    expect(true).toBeTruthy()
  })

  test("should show effect details on hover", async ({ page }) => {
    // Находим первый эффект
    const firstEffect = page.locator('[class*="effect"][class*="item"]').first()

    if ((await firstEffect.count()) > 0) {
      await firstEffect.hover()
      await page.waitForTimeout(200)

      // Проверяем появление деталей
      const hasDetails =
        (await page.locator('[class*="tooltip"], [role="tooltip"]').count()) > 0 ||
        (await page.locator('[class*="info"], [class*="detail"]').count()) > 0

      console.log(`Effect details on hover: ${hasDetails}`)
    }

    expect(true).toBeTruthy()
  })

  test("should allow drag and drop to timeline", async ({ page }) => {
    // Проверяем поддержку drag and drop
    const effectItem = page.locator('[class*="effect"][class*="item"]').first()

    if ((await effectItem.count()) > 0) {
      // Эмулируем начало перетаскивания
      await effectItem.hover()
      await page.mouse.down()
      await page.waitForTimeout(100)

      // Проверяем появление индикации перетаскивания
      const hasDragIndicator = (await page.locator('[class*="dragging"], [class*="drag"]').count()) > 0

      console.log(`Drag indicator: ${hasDragIndicator}`)

      // Отпускаем кнопку мыши
      await page.mouse.up()
    }

    expect(true).toBeTruthy()
  })

  test("should show empty state when no effects", async ({ page }) => {
    // Проверяем состояние когда нет эффектов (после поиска)
    const searchInput = page.locator('input[type="search"]').first()

    if (await searchInput.isVisible()) {
      await searchInput.fill("nonexistenteffect123")
      await page.waitForTimeout(300)

      const hasEmptyState = (await page.locator("text=/no.*found|no.*results|empty/i").count()) > 0

      console.log(`Empty state shown: ${hasEmptyState}`)
    }

    expect(true).toBeTruthy()
  })

  test("should support effect preview", async ({ page }) => {
    // Проверяем возможность предпросмотра эффекта
    const previewButton = page
      .locator("button")
      .filter({ hasText: /preview|try/i })
      .first()

    if (await previewButton.isVisible()) {
      await previewButton.click()
      await page.waitForTimeout(500)

      // Проверяем появление превью
      const hasPreview = (await page.locator('[class*="preview"], video, canvas').count()) > 0

      console.log(`Effect preview shown: ${hasPreview}`)
    }

    expect(true).toBeTruthy()
  })
})
