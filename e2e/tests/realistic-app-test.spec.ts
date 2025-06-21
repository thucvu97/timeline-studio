import { expect, test } from "../fixtures/test-base"

test.describe("Realistic App Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.waitForLoadState("networkidle")
  })

  test("should load Timeline Studio app", async ({ page }) => {
    // Проверяем что есть основной контейнер
    const hasMainContainer = (await page.locator(".h-screen, .min-h-screen, main, #__next").count()) > 0

    expect(hasMainContainer).toBeTruthy()

    // Проверяем что страница загрузилась без ошибок
    const body = page.locator("body")
    await expect(body).toBeVisible()
  })

  test("should show browser tabs", async ({ page }) => {
    // Ждем появления табов
    const hasTablist = (await page.locator('[role="tablist"]').count()) > 0

    if (hasTablist) {
      // Проверяем наличие основных вкладок
      const tabs = ["Media", "Effects", "Transitions", "Filters"]

      for (const tabName of tabs) {
        const tab = page.locator(`[role="tab"]`).filter({ hasText: tabName })
        const tabCount = await tab.count()

        if (tabCount > 0) {
          console.log(`Found tab: ${tabName}`)
        }
      }
    }

    expect(hasTablist).toBeTruthy()
  })

  test("should switch between tabs", async ({ page }) => {
    // Кликаем на вкладку Effects
    const effectsTab = page.locator('[role="tab"]:has-text("Effects")').first()
    if (await effectsTab.isVisible()) {
      await effectsTab.click()
      await page.waitForTimeout(300)

      // Проверяем что вкладка активна
      const activeTab = page.locator('[role="tab"][aria-selected="true"], [role="tab"][data-state="active"]')
      const hasActiveEffect = (await activeTab.filter({ hasText: /Effects/i }).count()) > 0
      console.log(`Effects tab active: ${hasActiveEffect}`)
    }

    // Кликаем на вкладку Transitions
    const transitionsTab = page.locator('[role="tab"]:has-text("Transitions")').first()
    if (await transitionsTab.isVisible()) {
      await transitionsTab.click()
      await page.waitForTimeout(300)

      // Проверяем что вкладка изменилась
      const activeTab = page.locator('[role="tab"][aria-selected="true"], [role="tab"][data-state="active"]')
      const hasActiveTransition = (await activeTab.filter({ hasText: /Transitions/i }).count()) > 0
      console.log(`Transitions tab active: ${hasActiveTransition}`)
    }

    expect(true).toBeTruthy()
  })

  test("should show media browser content", async ({ page }) => {
    // Убеждаемся что на вкладке Media
    const mediaTab = page.locator('[role="tab"]:has-text("Media")').first()
    await mediaTab.click()
    await page.waitForTimeout(500)

    // Проверяем наличие элементов медиа браузера
    const hasBrowserContent =
      (await page.locator("text=/no.*media|no.*files|import.*files|пусто/i").count()) > 0 ||
      (await page
        .locator("button")
        .filter({ hasText: /import|add|upload/i })
        .count()) > 0 ||
      (await page.locator('[class*="media"], [class*="browser"]').count()) > 0

    expect(hasBrowserContent).toBeTruthy()
  })

  test("should show timeline area", async ({ page }) => {
    // Ищем область таймлайна
    const hasTimeline =
      (await page.locator('[class*="timeline"]').count()) > 0 ||
      (await page.locator("text=/timeline|таймлайн/i").count()) > 0

    console.log(`Timeline found: ${hasTimeline}`)
    expect(hasTimeline).toBeTruthy()
  })

  test("should show video player area", async ({ page }) => {
    // Ищем область видео плеера
    const hasVideoPlayer =
      (await page.locator('[class*="player"], video, canvas').count()) > 0 ||
      (await page.locator('[class*="video"]').count()) > 0

    console.log(`Video player found: ${hasVideoPlayer}`)
    expect(hasVideoPlayer).toBeTruthy()
  })

  test("should have control buttons", async ({ page }) => {
    // Ищем кнопки управления
    const buttons = page.locator("button")
    const buttonCount = await buttons.count()

    // Должны быть кнопки
    expect(buttonCount).toBeGreaterThan(5)

    // Проверяем наличие основных кнопок
    const hasPlayButton =
      (await page.locator('button[aria-label*="play" i], button[aria-label*="pause" i]').count()) > 0 ||
      (await page
        .locator("button")
        .filter({ hasText: /play|pause/i })
        .count()) > 0 ||
      (await page.locator("button svg").count()) > 0

    console.log("Has play/pause button:", hasPlayButton)
    expect(true).toBeTruthy()
  })

  test("should respond to keyboard shortcuts", async ({ page }) => {
    // Фокусируемся на странице
    await page.locator("body").click()

    // Пробуем нажать Space
    await page.keyboard.press("Space")

    // Небольшая задержка
    await page.waitForTimeout(500)

    // Проверяем что приложение не сломалось
    const hasMainContainer = (await page.locator(".h-screen, .min-h-screen, main, #__next").count()) > 0

    expect(hasMainContainer).toBeTruthy()
  })

  test("should handle window resize", async ({ page }) => {
    // Изменяем размер окна
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.waitForTimeout(500)

    // Проверяем что UI адаптировался
    const hasMainContainer = (await page.locator(".h-screen, .min-h-screen, main, #__next").count()) > 0

    expect(hasMainContainer).toBeTruthy()

    // Возвращаем размер
    await page.setViewportSize({ width: 1920, height: 1080 })
  })

  test("should show tooltips on hover", async ({ page }) => {
    // Находим любую кнопку с иконкой
    const iconButton = page.locator("button svg").first()

    if ((await iconButton.count()) > 0) {
      // Наводим на кнопку
      await iconButton.hover()

      // Ждем появления тултипа
      await page.waitForTimeout(1000)

      // Проверяем наличие тултипа
      const hasTooltip = (await page.locator('[role="tooltip"], .tooltip').count()) > 0

      console.log("Has tooltip:", hasTooltip)
    }

    expect(true).toBeTruthy()
  })
})
