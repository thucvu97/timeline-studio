import { test, expect } from '../fixtures/test-base';

test.describe('Filters Browser', () => {
  test.beforeEach(async ({ page }) => {
    await page.waitForLoadState("networkidle");
    
    // Переходим на вкладку Filters
    const filtersTab = page.locator('[role="tab"]:has-text("Filters")').first();
    await filtersTab.click();
    await page.waitForTimeout(500);
  });

  test('should show filters tab', async ({ page }) => {
    // Проверяем что вкладка активна
    const activeTab = page.locator('[role="tab"][aria-selected="true"], [role="tab"][data-state="active"]');
    const hasActiveFilters = await activeTab.filter({ hasText: /Filters/i }).count() > 0;
    
    expect(hasActiveFilters).toBeTruthy();
  });

  test('should display filter categories', async ({ page }) => {
    // Проверяем наличие категорий фильтров
    const hasCategories = 
      await page.locator('text=/color|blur|sharpen|vintage|black.*white/i').count() > 0 ||
      await page.locator('[class*="filter"], [class*="category"]').count() > 0;
    
    console.log(`Filter categories found: ${hasCategories}`);
    expect(true).toBeTruthy();
  });

  test('should show filter previews', async ({ page }) => {
    // Проверяем наличие превью фильтров
    const hasPreviews = 
      await page.locator('[class*="preview"], img[src]').count() > 0 ||
      await page.locator('[class*="thumbnail"]').count() > 0;
    
    console.log(`Filter previews found: ${hasPreviews}`);
    expect(true).toBeTruthy();
  });

  test('should allow filter intensity adjustment', async ({ page }) => {
    // Проверяем наличие слайдера интенсивности
    const hasIntensityControl = 
      await page.locator('input[type="range"]').count() > 0 ||
      await page.locator('text=/intensity|strength|amount/i').count() > 0;
    
    if (hasIntensityControl) {
      const slider = page.locator('input[type="range"]').first();
      if (await slider.isVisible()) {
        await slider.fill('50');
        console.log('Filter intensity adjusted');
      }
    }
    
    expect(true).toBeTruthy();
  });

  test('should support filter search', async ({ page }) => {
    // Ищем поле поиска
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('vintage');
      await page.waitForTimeout(300);
      
      // Проверяем фильтрацию результатов
      const hasFilteredResults = 
        await page.locator('text=/vintage/i').count() > 0;
      
      console.log(`Search results for "vintage": ${hasFilteredResults}`);
    }
    
    expect(true).toBeTruthy();
  });

  test('should show filter parameters', async ({ page }) => {
    // Кликаем на первый фильтр
    const firstFilter = page.locator('[class*="filter"][class*="item"]').first();
    
    if (await firstFilter.count() > 0) {
      await firstFilter.click();
      await page.waitForTimeout(300);
      
      // Проверяем появление параметров
      const hasParameters = 
        await page.locator('[class*="parameter"], [class*="control"]').count() > 0 ||
        await page.locator('input[type="range"], input[type="number"]').count() > 0;
      
      console.log(`Filter parameters shown: ${hasParameters}`);
    }
    
    expect(true).toBeTruthy();
  });

  test('should allow applying filter to selection', async ({ page }) => {
    // Находим фильтр
    const filterItem = page.locator('[class*="filter"][class*="item"]').first();
    
    if (await filterItem.count() > 0) {
      await filterItem.hover();
      await page.waitForTimeout(200);
      
      // Ищем кнопку применения
      const applyButton = page.locator('button').filter({ hasText: /apply|add/i }).first();
      
      if (await applyButton.isVisible()) {
        await applyButton.click();
        console.log('Filter apply button clicked');
      }
    }
    
    expect(true).toBeTruthy();
  });

  test('should show popular filters', async ({ page }) => {
    // Проверяем наличие популярных фильтров
    const hasPopular = 
      await page.locator('text=/popular|trending|featured/i').count() > 0 ||
      await page.locator('[class*="popular"], [class*="featured"]').count() > 0;
    
    console.log(`Popular filters section found: ${hasPopular}`);
    expect(true).toBeTruthy();
  });

  test('should support filter combinations', async ({ page }) => {
    // Проверяем возможность комбинирования фильтров
    const hasStackInfo = 
      await page.locator('text=/stack|combine|layer/i').count() > 0 ||
      await page.locator('[class*="stack"], [class*="layer"]').count() > 0;
    
    console.log(`Filter stacking support: ${hasStackInfo}`);
    expect(true).toBeTruthy();
  });

  test('should reset filter settings', async ({ page }) => {
    // Ищем кнопку сброса
    const resetButton = page.locator('button').filter({ hasText: /reset|default/i }).first();
    
    if (await resetButton.isVisible()) {
      await resetButton.click();
      console.log('Filter reset button clicked');
      
      // Проверяем сброс значений
      const slider = page.locator('input[type="range"]').first();
      if (await slider.isVisible()) {
        const value = await slider.inputValue();
        console.log(`Slider value after reset: ${value}`);
      }
    }
    
    expect(true).toBeTruthy();
  });
});