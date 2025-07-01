import { test, expect } from "@playwright/test"

test.describe("Debug App State", () => {
  test("should check app initialization", async ({ page }) => {
    // Enable console logging
    page.on("console", msg => {
      if (msg.type() === "error") {
        console.log("Browser error:", msg.text())
      }
    })
    
    page.on("pageerror", error => {
      console.log("Page error:", error.message)
    })
    
    // Go to app
    await page.goto("/")
    
    // Wait for React to mount
    await page.waitForFunction(() => {
      return document.querySelector("#__next") !== null
    }, { timeout: 30000 })
    
    // Check if __TAURI_INTERNALS__ is defined
    const tauriDefined = await page.evaluate(() => {
      return typeof (window as any).__TAURI_INTERNALS__ !== "undefined"
    })
    console.log("Tauri internals defined:", tauriDefined)
    
    // Check if __TAURI_EVENT_PLUGIN_INTERNALS__ is defined
    const tauriEventDefined = await page.evaluate(() => {
      return typeof (window as any).__TAURI_EVENT_PLUGIN_INTERNALS__ !== "undefined"
    })
    console.log("Tauri event internals defined:", tauriEventDefined)
    
    // Wait for i18n
    await page.waitForFunction(() => {
      return typeof (window as any).i18next !== "undefined" && (window as any).i18next.isInitialized
    }, { timeout: 30000 })
    console.log("i18n initialized")
    
    // Check for any error boundaries
    const errorBoundaryVisible = await page.locator("text=/error occurred|an error occurred/i").isVisible().catch(() => false)
    if (errorBoundaryVisible) {
      const errorText = await page.locator("text=/error occurred|an error occurred/i").textContent()
      console.log("Error boundary triggered:", errorText)
      
      // Get the specific error message
      const errorMessage = await page.locator(".text-muted-foreground").textContent().catch(() => "")
      console.log("Error message:", errorMessage)
    }
    
    // Wait a bit more
    await page.waitForTimeout(5000)
    
    // Check for main layout elements
    const selectors = {
      "Top bar": '[data-testid="top-bar"], header, nav',
      "Browser": '[data-testid="browser"], [role="tablist"]',
      "Timeline": '[data-testid="timeline"], .timeline',
      "Any button": 'button',
      "Any text": 'p, span, div'
    }
    
    for (const [name, selector] of Object.entries(selectors)) {
      const count = await page.locator(selector).count()
      console.log(`${name}: ${count} elements found`)
    }
    
    // Get page HTML structure
    const bodyHTML = await page.evaluate(() => {
      const body = document.body
      return body.innerHTML.substring(0, 1000)
    })
    console.log("Body HTML preview:", bodyHTML)
    
    // Screenshot
    await page.screenshot({ path: "e2e-debug-state.png", fullPage: true })
  })
})