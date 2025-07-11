import { Locator, Page } from "@playwright/test"

export class BrowserPage {
  readonly page: Page
  readonly tabList: Locator
  readonly mediaTab: Locator
  readonly effectsTab: Locator
  readonly transitionsTab: Locator
  readonly templatesTab: Locator
  readonly emptyState: Locator
  readonly importButton: Locator
  readonly importFolderButton: Locator
  readonly mediaGrid: Locator
  readonly viewToggle: Locator

  constructor(page: Page) {
    this.page = page

    // Вкладки браузера - используем data-testid
    this.tabList = page.locator('[role="tablist"]').first()
    this.mediaTab = page.locator('[data-testid="media-tab"]')
    this.effectsTab = page.locator('[data-testid="effects-tab"]')
    this.transitionsTab = page.locator('[data-testid="transitions-tab"]')
    this.templatesTab = page.locator('[data-testid="templates-tab"]')

    // Элементы медиа браузера - используем гибкие селекторы
    this.emptyState = page.locator("text=/no media|empty|drag.*drop|import.*files/i").first()
    this.importButton = page
      .locator("button")
      .filter({ hasText: /import|add|upload/i })
      .first()
    this.importFolderButton = page
      .locator("button")
      .filter({ hasText: /folder|directory/i })
      .first()
    this.mediaGrid = page.locator('[data-testid="media-grid"], [class*="grid"], .grid').first()
    this.viewToggle = page
      .locator('[data-testid="view-toggle"], button[aria-label*="view"], button[title*="view"]')
      .first()
  }

  async goto() {
    await this.page.goto("/")
    await this.page.waitForLoadState("networkidle")
    
    // Wait for tabs to be visible and i18n to initialize
    await this.page.waitForSelector('[role="tablist"]', { timeout: 30000 })
    
    // Wait for at least one tab to be visible
    await this.page.waitForSelector('[data-testid="media-tab"]', { timeout: 30000 })
    
    // Wait for translations to load
    await this.page.waitForFunction(() => {
      const tabs = document.querySelectorAll('[role="tab"]')
      return tabs.length > 0 && Array.from(tabs).some(tab => tab.textContent && tab.textContent.trim().length > 0)
    }, { timeout: 30000 })
  }

  async selectTab(tabName: "Media" | "Effects" | "Transitions" | "Templates") {
    // Используем data-testid для всех вкладок
    const tabTestId = `${tabName.toLowerCase()}-tab`
    const tab = this.page.locator(`[data-testid="${tabTestId}"]`)
    
    // Ждем, пока вкладка станет видимой
    await tab.waitFor({ state: 'visible', timeout: 10000 })
    
    // Кликаем по вкладке
    await tab.click()
    
    // Ждем, пока вкладка станет активной
    await this.page.waitForFunction(
      (testId) => {
        const element = document.querySelector(`[data-testid="${testId}"]`)
        return element && element.getAttribute('data-state') === 'active'
      },
      tabTestId,
      { timeout: 5000 }
    )
  }

  async waitForMediaLoaded() {
    // Ждем пока либо появятся медиа файлы, либо сообщение о пустом состоянии
    try {
      await this.page.waitForSelector(
        'text=/no media|empty|drag.*drop|import.*files|[class*="grid"]|[class*="media"]/i',
        {
          timeout: 5000,
        },
      )
    } catch (e) {
      // Если ничего не нашли, значит страница еще загружается
      await this.page.waitForTimeout(1000)
    }
  }

  async getMediaItems() {
    return this.page.locator('[data-testid="media-item"], [class*="media-item"], [class*="thumbnail"], img, video')
  }

  async importFiles(filePaths: string[]) {
    // Эмулируем выбор файлов
    const fileChooserPromise = this.page.waitForEvent("filechooser")
    await this.importButton.click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles(filePaths)
  }

  async toggleView() {
    await this.viewToggle.click()
  }
}
