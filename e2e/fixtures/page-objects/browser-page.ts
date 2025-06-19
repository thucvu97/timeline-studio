import { Page, Locator } from '@playwright/test';

export class BrowserPage {
  readonly page: Page;
  readonly tabList: Locator;
  readonly mediaTab: Locator;
  readonly effectsTab: Locator;
  readonly transitionsTab: Locator;
  readonly templatesTab: Locator;
  readonly emptyState: Locator;
  readonly importButton: Locator;
  readonly importFolderButton: Locator;
  readonly mediaGrid: Locator;
  readonly viewToggle: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Вкладки браузера
    this.tabList = page.locator('[role="tablist"]').first();
    this.mediaTab = this.tabList.locator('[role="tab"]:has-text("Media")');
    this.effectsTab = this.tabList.locator('[role="tab"]:has-text("Effects")');
    this.transitionsTab = this.tabList.locator('[role="tab"]:has-text("Transitions")');
    this.templatesTab = this.tabList.locator('[role="tab"]:has-text("Templates")');
    
    // Элементы медиа браузера - используем гибкие селекторы
    this.emptyState = page.locator('text=/no media|empty|drag.*drop|import.*files/i').first();
    this.importButton = page.locator('button').filter({ hasText: /import|add|upload/i }).first();
    this.importFolderButton = page.locator('button').filter({ hasText: /folder|directory/i }).first();
    this.mediaGrid = page.locator('[data-testid="media-grid"], [class*="grid"], .grid').first();
    this.viewToggle = page.locator('[data-testid="view-toggle"], button[aria-label*="view"], button[title*="view"]').first();
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async selectTab(tabName: 'Media' | 'Effects' | 'Transitions' | 'Templates') {
    const tab = this.tabList.locator(`[role="tab"]:has-text("${tabName}")`);
    await tab.click();
    await this.page.waitForTimeout(300); // Ждем анимацию
  }

  async waitForMediaLoaded() {
    // Ждем пока либо появятся медиа файлы, либо сообщение о пустом состоянии
    try {
      await this.page.waitForSelector('text=/no media|empty|drag.*drop|import.*files|[class*="grid"]|[class*="media"]/i', {
        timeout: 5000
      });
    } catch (e) {
      // Если ничего не нашли, значит страница еще загружается
      await this.page.waitForTimeout(1000);
    }
  }

  async getMediaItems() {
    return this.page.locator('[data-testid="media-item"], [class*="media-item"], [class*="thumbnail"], img, video');
  }

  async importFiles(filePaths: string[]) {
    // Эмулируем выбор файлов
    const fileChooserPromise = this.page.waitForEvent('filechooser');
    await this.importButton.click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePaths);
  }

  async toggleView() {
    await this.viewToggle.click();
  }
}