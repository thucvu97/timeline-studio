import { test, expect } from "@playwright/test"

test.describe("Debug Effect Error", () => {
  test("capture effect error details", async ({ page }) => {
    const errors: string[] = []
    const consoleLogs: string[] = []
    
    // Capture all console errors
    page.on("console", msg => {
      if (msg.type() === "error") {
        errors.push(msg.text())
      } else if (msg.type() === "log") {
        consoleLogs.push(msg.text())
      }
    })
    
    page.on("pageerror", error => {
      errors.push(error.message)
    })
    
    // Navigate to the app
    await page.goto("/", { waitUntil: "domcontentloaded" })
    
    // Wait a bit to capture any errors
    await page.waitForTimeout(3000)
    
    // Log all errors found
    console.log("=== ALL ERRORS ===")
    errors.forEach((error, index) => {
      console.log(`Error ${index + 1}: ${error}`)
    })
    
    // Log relevant console logs
    console.log("\n=== RELEVANT LOGS ===")
    consoleLogs.filter(log => 
      log.includes("ResourcesMachine") || 
      log.includes("effect") ||
      log.includes("ADD_EFFECT")
    ).forEach((log, index) => {
      console.log(`Log ${index + 1}: ${log}`)
    })
    
    // Check page content
    const pageContent = await page.content()
    if (pageContent.includes("Cannot read properties of undefined")) {
      console.log("\n=== ERROR PAGE CONTENT ===")
      const errorText = await page.locator("p").textContent()
      console.log("Error message:", errorText)
    }
    
    // Take screenshot for debugging
    await page.screenshot({ path: "debug-effect-error.png", fullPage: true })
    
    // This test is just for debugging, so we don't assert anything
    expect(true).toBe(true)
  })
})