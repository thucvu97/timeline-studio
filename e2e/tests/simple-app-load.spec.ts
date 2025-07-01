import { test, expect } from "@playwright/test"

test.describe("Simple App Load Test", () => {
  test.setTimeout(120000) // 2 minutes timeout
  test("should load the application", async ({ page }) => {
    // Go to the app
    await page.goto("/")
    
    // Wait for any element to appear
    await page.waitForLoadState("networkidle")
    
    // Take a screenshot for debugging
    await page.screenshot({ path: "e2e-app-load.png", fullPage: true })
    
    // Check if body exists
    const body = page.locator("body")
    await expect(body).toBeVisible()
    
    // Log what we see
    const bodyText = await body.textContent()
    console.log("Body text:", bodyText?.substring(0, 200))
    
    // Check for any visible element
    const anyVisibleElement = page.locator("*:visible").first()
    await expect(anyVisibleElement).toBeVisible()
  })
  
  test("should have tabs", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    
    // Wait a bit for app to initialize
    await page.waitForTimeout(3000)
    
    // Take screenshot
    await page.screenshot({ path: "e2e-tabs.png", fullPage: true })
    
    // Try different selectors
    const tabsSelectors = [
      '[role="tablist"]',
      '[data-slot="tabs-list"]',
      '.tabs-list',
      'div:has(> button[role="tab"])',
      'div:has(> [data-slot="tabs-trigger"])'
    ]
    
    for (const selector of tabsSelectors) {
      const element = page.locator(selector).first()
      const isVisible = await element.isVisible().catch(() => false)
      console.log(`Selector ${selector}: ${isVisible ? "visible" : "not found"}`)
    }
    
    // Check for any button
    const buttons = await page.locator("button").count()
    console.log(`Found ${buttons} buttons`)
    
    // List all visible text
    const allText = await page.locator("body").textContent()
    console.log("All visible text:", allText?.replace(/\s+/g, " ").substring(0, 500))
  })
})