import { test, expect } from "@playwright/test"

test.describe("App Loading Without Errors", () => {
  test("should load without console errors", async ({ page }) => {
    const errors: string[] = []
    
    // Capture console errors
    page.on("console", msg => {
      if (msg.type() === "error") {
        errors.push(msg.text())
      }
    })
    
    page.on("pageerror", error => {
      errors.push(error.message)
    })
    
    // Clear localStorage before navigating
    await page.goto("/")
    await page.evaluate(() => {
      localStorage.clear()
    })
    
    // Navigate to the app
    await page.goto("/", { waitUntil: "networkidle" })
    
    // Wait for app to initialize
    await page.waitForTimeout(3000)
    
    // Check for critical errors
    const criticalErrors = errors.filter(error => 
      !error.includes("GET /favicon.ico") && // Ignore favicon errors
      !error.includes("Failed to load resource") && // Ignore resource loading
      !error.includes("[TauriMock]") && // Ignore mock warnings
      !error.includes("Failed to open project") // Ignore initial project load error - it creates a new one
    )
    
    // Log any errors found
    if (criticalErrors.length > 0) {
      console.log("Console errors found:")
      criticalErrors.forEach(error => console.log("  -", error))
    }
    
    // Check page loaded
    await expect(page).toHaveTitle("Timeline Studio")
    
    // Check for buttons (indicates React rendered)
    const buttonCount = await page.locator("button").count()
    expect(buttonCount).toBeGreaterThan(0)
    
    // No critical errors should be present
    expect(criticalErrors).toHaveLength(0)
  })
  
  test("should have proper directory structure", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" })
    
    // Wait for app initialization
    await page.waitForTimeout(2000)
    
    // Check console logs for directory paths
    const consoleLogs: string[] = []
    page.on("console", msg => {
      if (msg.type() === "log") {
        consoleLogs.push(msg.text())
      }
    })
    
    // Trigger a re-render to capture logs
    await page.reload()
    await page.waitForTimeout(2000)
    
    // Check that no "undefined" paths are logged
    const undefinedPaths = consoleLogs.filter(log => 
      log.includes("undefined/") || log.includes("null/")
    )
    
    if (undefinedPaths.length > 0) {
      console.log("Undefined paths found:")
      undefinedPaths.forEach(path => console.log("  -", path))
    }
    
    expect(undefinedPaths).toHaveLength(0)
  })
})