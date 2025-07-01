import { test, expect } from "@playwright/test"
import { clearBrowserStorage, isErrorPageDisplayed } from "../helpers/test-helpers"

test.describe("Comprehensive Debug", () => {
  test("debug app initialization", async ({ page }) => {
    const errors: string[] = []
    const warnings: string[] = []
    const logs: string[] = []
    
    // Capture all console messages
    page.on("console", msg => {
      const text = msg.text()
      if (msg.type() === "error") {
        errors.push(text)
      } else if (msg.type() === "warning") {
        warnings.push(text)
      } else if (msg.type() === "log") {
        logs.push(text)
      }
    })
    
    page.on("pageerror", error => {
      errors.push(`PAGE ERROR: ${error.message}`)
    })
    
    // Clear storage and navigate
    await clearBrowserStorage(page)
    await page.goto("/", { waitUntil: "domcontentloaded" })
    
    // Wait a bit
    await page.waitForTimeout(5000)
    
    // Check if error page is displayed
    const hasErrorPage = await isErrorPageDisplayed(page)
    
    console.log("=== APP STATE ===")
    console.log("Has error page:", hasErrorPage)
    
    if (hasErrorPage) {
      const errorText = await page.locator("p").textContent()
      console.log("Error message:", errorText)
    }
    
    // Check page title
    const title = await page.title()
    console.log("Page title:", title)
    
    // Check for main containers
    const hasMinHScreen = await page.locator("div.min-h-screen").isVisible().catch(() => false)
    console.log("Has min-h-screen container:", hasMinHScreen)
    
    const hasTopBar = await page.locator("div").filter({ hasText: /Timeline Studio/i }).first().isVisible().catch(() => false)
    console.log("Has TopBar with Timeline Studio:", hasTopBar)
    
    const hasBrowserTabs = await page.locator('[role="tablist"]').isVisible().catch(() => false)
    console.log("Has browser tabs:", hasBrowserTabs)
    
    // Log all errors
    console.log("\n=== ERRORS ===")
    errors.forEach((error, index) => {
      console.log(`Error ${index + 1}: ${error}`)
    })
    
    // Log relevant warnings
    console.log("\n=== WARNINGS ===")
    warnings.forEach((warning, index) => {
      console.log(`Warning ${index + 1}: ${warning}`)
    })
    
    // Log ResourcesMachine related logs
    console.log("\n=== RESOURCES LOGS ===")
    logs.filter(log => 
      log.includes("ResourcesMachine") || 
      log.includes("resources") ||
      log.includes("effect") ||
      log.includes("localStorage")
    ).forEach((log, index) => {
      console.log(`Log ${index + 1}: ${log}`)
    })
    
    // Check localStorage
    const localStorageData = await page.evaluate(() => {
      const data: Record<string, any> = {}
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          try {
            data[key] = JSON.parse(localStorage.getItem(key) || "{}")
          } catch {
            data[key] = localStorage.getItem(key)
          }
        }
      }
      return data
    })
    
    console.log("\n=== LOCALSTORAGE ===")
    console.log("Keys:", Object.keys(localStorageData))
    
    // Take screenshot
    await page.screenshot({ path: "debug-comprehensive.png", fullPage: true })
    
    // Get page HTML snippet
    const bodyHTML = await page.locator("body").innerHTML()
    console.log("\n=== PAGE HTML (first 500 chars) ===")
    console.log(bodyHTML.substring(0, 500))
    
    // Check for specific elements
    console.log("\n=== ELEMENT CHECKS ===")
    const elementsToCheck = [
      { selector: "div.min-h-screen", name: "Min-h-screen container" },
      { selector: "div.flex.flex-col.h-screen", name: "MediaStudio container" },
      { selector: "[data-testid='theme-toggle']", name: "Theme toggle" },
      { selector: "button", name: "Any button" },
      { selector: "input", name: "Any input" },
      { selector: ".error-boundary", name: "Error boundary" },
      { selector: "[role='tablist']", name: "Tab list" },
      { selector: "[role='tab']", name: "Tab" }
    ]
    
    for (const { selector, name } of elementsToCheck) {
      const count = await page.locator(selector).count()
      console.log(`${name} (${selector}): ${count}`)
    }
    
    // Check for text content
    console.log("\n=== TEXT CONTENT ===")
    const allText = await page.locator("body").textContent()
    console.log("Body text length:", allText?.length || 0)
    console.log("First 200 chars:", allText?.substring(0, 200))
    
    expect(true).toBe(true)
  })
})