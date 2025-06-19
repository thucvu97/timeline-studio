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
    
    // Элементы медиа браузера
    this.emptyState = page.locator('text="No media files imported"');
    this.importButton = page.locator('button:has-text("Import Files")');
    this.importFolderButton = page.locator('button:has-text("Import Folder")');
    this.mediaGrid = page.locator('[data-testid="media-grid"]');
    this.viewToggle = page.locator('[data-testid="view-toggle"]');
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
    await this.page.waitForSelector('[data-testid="media-grid"] > *, text="No media files imported"', {
      timeout: 5000
    });
  }

  async getMediaItems() {
    return this.mediaGrid.locator('[data-testid="media-item"]');
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