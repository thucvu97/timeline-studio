import { test, expect } from "@playwright/test"

test.describe("Minimal App Test", () => {
  test("should load something", async ({ page }) => {
    // Don't use the auto fixtures - go directly
    await page.goto("http://localhost:3001", { waitUntil: "domcontentloaded" })
    
    // Wait just a bit
    await page.waitForTimeout(2000)
    
    // Check if page loaded at all
    const title = await page.title()
    console.log("Page title:", title)
    
    // Check if body exists
    await expect(page.locator("body")).toBeVisible()
    
    // Look for any React root
    const reactRoot = await page.locator("#__next, #root, [data-reactroot]").first()
    const hasReactRoot = await reactRoot.count() > 0
    console.log("Has React root:", hasReactRoot)
    
    // Try to find any visible element
    const anyButton = page.locator("button").first()
    const hasButtons = await anyButton.count() > 0
    console.log("Has buttons:", hasButtons)
    
    // Get screenshot
    await page.screenshot({ path: "e2e-minimal.png" })
    
    // At least the page should load
    expect(title).toBeTruthy()
  })
})