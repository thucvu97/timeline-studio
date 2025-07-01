import { chromium, FullConfig } from "@playwright/test"

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  // Navigate to the app and clear all storage
  await page.goto(baseURL!)
  await page.evaluate(() => {
    // Clear all storage
    localStorage.clear()
    sessionStorage.clear()
    
    // Clear IndexedDB
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
  
  await browser.close()
  
  console.log("Global setup: Cleared all browser storage")
}

export default globalSetup