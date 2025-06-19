import { test, expect } from '../fixtures/test-base';
import { BrowserPage } from '../fixtures/page-objects/browser-page';

test.describe('Browser Functionality', () => {
  let browserPage: BrowserPage;

  test.beforeEach(async ({ page }) => {
    browserPage = new BrowserPage(page);
  });

  test('should display media browser with correct tabs', async ({ page }) => {
    // Проверяем все вкладки браузера
    await expect(browserPage.mediaTab).toBeVisible();
    await expect(browserPage.effectsTab).toBeVisible();
    await expect(browserPage.transitionsTab).toBeVisible();
    await expect(browserPage.templatesTab).toBeVisible();
  });

  test('should show empty state in media tab', async ({ page }) => {
    await browserPage.selectTab('Media');
    await expect(browserPage.emptyState).toBeVisible();
    await expect(browserPage.importButton).toBeVisible();
    await expect(browserPage.importFolderButton).toBeVisible();
  });

  test('should switch between different browser tabs', async ({ page }) => {
    // Переключаемся на Effects
    await browserPage.selectTab('Effects');
    await expect(browserPage.effectsTab).toHaveAttribute('aria-selected', 'true');
    
    // Проверяем что контент изменился
    const effectsContent = page.locator('text=/Effects|Эффекты/i').first();
    await expect(effectsContent).toBeVisible();
    
    // Переключаемся на Transitions
    await browserPage.selectTab('Transitions');
    await expect(browserPage.transitionsTab).toHaveAttribute('aria-selected', 'true');
    
    // Переключаемся на Templates
    await browserPage.selectTab('Templates');
    await expect(browserPage.templatesTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should display effects in grid layout', async ({ page }) => {
    await browserPage.selectTab('Effects');
    
    // Ждем загрузки эффектов
    const effectsGrid = page.locator('[data-testid="effects-grid"], .grid').first();
    await expect(effectsGrid).toBeVisible();
    
    // Проверяем наличие эффектов
    const effectItems = effectsGrid.locator('[data-testid="effect-item"], .effect-item');
    await expect(effectItems.first()).toBeVisible();
  });

  test('should display transitions with preview', async ({ page }) => {
    await browserPage.selectTab('Transitions');
    
    // Ждем загрузки переходов
    const transitionsGrid = page.locator('[data-testid="transitions-grid"], .grid').first();
    await expect(transitionsGrid).toBeVisible();
    
    // Проверяем наличие переходов
    const transitionItems = transitionsGrid.locator('[data-testid="transition-item"], .transition-item');
    await expect(transitionItems.first()).toBeVisible();
  });

  test('should display templates categories', async ({ page }) => {
    await browserPage.selectTab('Templates');
    
    // Проверяем наличие категорий шаблонов
    const templateCategories = page.locator('text=/Multi-camera|Intro|Outro/i');
    await expect(templateCategories.first()).toBeVisible();
  });

  test('should handle import button click', async ({ page }) => {
    await browserPage.selectTab('Media');
    
    // Мокаем диалог выбора файлов
    await page.route('**/dialog/open', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ canceled: true })
      });
    });
    
    // Кликаем на кнопку импорта
    await browserPage.importButton.click();
    
    // Проверяем что кнопка остается активной
    await expect(browserPage.importButton).toBeEnabled();
  });

  test('should show search functionality', async ({ page }) => {
    // Проверяем наличие поля поиска
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    await expect(searchInput).toBeVisible();
    
    // Вводим текст в поиск
    await searchInput.fill('test');
    
    // Проверяем что поиск работает
    await expect(searchInput).toHaveValue('test');
  });
});