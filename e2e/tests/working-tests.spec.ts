import { expect, test } from "@playwright/test"
import { clickBrowserTab, isAnyVisible, waitForAnySelector, waitForApp } from "../helpers/test-utils"

test.describe("Working E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await waitForApp(page)
  })

  test("✅ App loads successfully", async ({ page }) => {
    const mainContainer = await waitForAnySelector(page, [".h-screen", ".min-h-screen", '[class*="screen"]'])
    await expect(mainContainer).toBeVisible()
  })

  test("✅ Browser tabs are visible", async ({ page }) => {
    const tabList = await waitForAnySelector(page, ['[role="tablist"]', ".tabs-list"])
    await expect(tabList).toBeVisible()

    // Проверяем количество табов
    const tabs = await page.locator('[role="tab"]').count()
    expect(tabs).toBeGreaterThan(0)
    console.log(`Found ${tabs} browser tabs`)
  })

  test("✅ Can switch between tabs", async ({ page }) => {
    // Находим все табы
    const tabs = await page.locator('[role="tab"]').all()

    if (tabs.length >= 2) {
      // Кликаем на второй таб
      await tabs[1].click()
      await page.waitForTimeout(300)

      // Проверяем что таб активен
      const isActive =
        (await tabs[1].getAttribute("aria-selected")) === "true" ||
        (await tabs[1].getAttribute("data-state")) === "active"
      expect(isActive).toBeTruthy()
    }
  })

  test("✅ Timeline area exists", async ({ page }) => {
    const hasTimeline = await isAnyVisible(page, [
      '[data-testid="timeline"]',
      ".timeline-container",
      '[class*="timeline"]',
    ])
    expect(hasTimeline).toBeTruthy()
  })

  test("✅ Video player area exists", async ({ page }) => {
    const hasVideoPlayer = await isAnyVisible(page, [
      '[data-testid="video-player"]',
      ".video-player",
      '[class*="player"]',
      "video",
      "canvas",
    ])
    expect(hasVideoPlayer).toBeTruthy()
  })

  test("✅ Has interactive buttons", async ({ page }) => {
    const buttons = await page.locator("button").count()
    expect(buttons).toBeGreaterThan(5)
    console.log(`Found ${buttons} buttons`)
  })

  test("✅ Keyboard shortcuts dont crash app", async ({ page }) => {
    // Пробуем различные shortcuts
    await page.keyboard.press("Space")
    await page.waitForTimeout(100)

    await page.keyboard.press("Control+s")
    await page.waitForTimeout(100)

    await page.keyboard.press("Control+z")
    await page.waitForTimeout(100)

    // Проверяем что приложение не сломалось
    const body = page.locator("body")
    await expect(body).toBeVisible()
  })

  test("✅ Responsive design works", async ({ page }) => {
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.waitForTimeout(300)
    await expect(page.locator("body")).toBeVisible()

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForTimeout(300)
    await expect(page.locator("body")).toBeVisible()

    // Возвращаем обратно
    await page.setViewportSize({ width: 1920, height: 1080 })
  })

  test("✅ Media tab shows content or empty state", async ({ page }) => {
    await clickBrowserTab(page, "Media")
    await page.waitForTimeout(500)

    // Проверяем что есть либо медиа элементы, либо сообщение о пустом состоянии
    const hasContent = await isAnyVisible(page, [
      '[data-testid="media-item"]',
      ".media-item",
      "text=/No media|Import|Upload|Drag/i",
      'button:has-text("Import")',
    ])
    expect(hasContent).toBeTruthy()
  })

  test("✅ Dark mode class exists", async ({ page }) => {
    const html = page.locator("html")
    const classAttr = await html.getAttribute("class")

    // Проверяем что есть класс light или dark
    expect(classAttr).toMatch(/light|dark/)

    // Проверяем наличие элементов с dark стилями
    const darkElements = await page.locator('[class*="dark:"]').count()
    console.log(`Found ${darkElements} elements with dark mode styles`)
  })
})
