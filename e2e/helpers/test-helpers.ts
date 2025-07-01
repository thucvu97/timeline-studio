import { Page } from "@playwright/test"

/**
 * Clear all browser storage before test
 */
export async function clearBrowserStorage(page: Page) {
  await page.goto("/")
  await page.evaluate(() => {
    // Clear localStorage
    localStorage.clear()
    // Clear sessionStorage
    sessionStorage.clear()
    // Clear IndexedDB if needed
    if (window.indexedDB) {
      indexedDB.databases().then(databases => {
        databases.forEach(db => {
          if (db.name) {
            indexedDB.deleteDatabase(db.name)
          }
        })
      })
    }
  })
}

/**
 * Wait for app to initialize
 */
export async function waitForAppInit(page: Page) {
  // Wait for React to render
  await page.waitForLoadState("networkidle")
  // Additional wait for XState machines to initialize
  await page.waitForTimeout(2000)
}

/**
 * Check if error page is displayed
 */
export async function isErrorPageDisplayed(page: Page): Promise<boolean> {
  const errorHeading = page.locator('h3:text("An error occurred")')
  return await errorHeading.isVisible().catch(() => false)
}