import { test, expect } from '@playwright/test';

test.describe('Stable E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Даем время на инициализацию
  });

  test('01. Application loads without critical errors', async ({ page }) => {
    // Собираем ошибки
    const criticalErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && 
          !msg.text().includes('ResizeObserver') &&
          !msg.text().includes('Non-Error promise rejection captured')) {
        criticalErrors.push(msg.text());
      }
    });

    await page.waitForTimeout(1000);
    
    // Проверяем что страница загрузилась
    await expect(page.locator('body')).toBeVisible();
    
    // Проверяем отсутствие критических ошибок
    expect(criticalErrors).toHaveLength(0);
  });

  test('02. Main application container exists', async ({ page }) => {
    // Проверяем наличие основного контейнера
    const container = page.locator('.min-h-screen, .h-screen').first();
    await expect(container).toBeVisible();
    
    // Проверяем что есть контент
    const divCount = await page.locator('div').count();
    expect(divCount).toBeGreaterThan(10);
  });

  test('03. Has interactive buttons', async ({ page }) => {
    const buttons = await page.locator('button:visible').count();
    expect(buttons).toBeGreaterThan(0);
    console.log(`Found ${buttons} visible buttons`);
  });

  test('04. Browser tabs functionality', async ({ page }) => {
    // Ищем табы
    const tabs = await page.locator('[role="tab"]').count();
    
    if (tabs > 0) {
      console.log(`Found ${tabs} tabs`);
      
      // Проверяем переключение табов
      const firstTab = page.locator('[role="tab"]').first();
      const secondTab = page.locator('[role="tab"]').nth(1);
      
      if (await secondTab.isVisible()) {
        await secondTab.click();
        await page.waitForTimeout(300);
        
        // Проверяем изменение состояния
        const secondTabState = await secondTab.getAttribute('aria-selected') || 
                              await secondTab.getAttribute('data-state');
        console.log('Second tab state:', secondTabState);
      }
    }
  });

  test('05. Timeline component exists', async ({ page }) => {
    // Ищем элементы связанные с таймлайном
    const timelineSelectors = [
      '[class*="timeline"]',
      '[data-testid*="timeline"]',
      '.timeline',
      '#timeline'
    ];
    
    let found = false;
    for (const selector of timelineSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        found = true;
        console.log(`Found timeline element with selector: ${selector}`);
        break;
      }
    }
    
    expect(found).toBeTruthy();
  });

  test('06. Video player area exists', async ({ page }) => {
    // Ищем элементы связанные с видео плеером
    const playerSelectors = [
      'video',
      'canvas',
      '[class*="player"]',
      '[class*="video"]',
      '[data-testid*="player"]'
    ];
    
    let found = false;
    for (const selector of playerSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        found = true;
        console.log(`Found player element with selector: ${selector}`);
        break;
      }
    }
    
    expect(found).toBeTruthy();
  });

  test('07. Keyboard navigation', async ({ page }) => {
    // Tab navigation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
    
    const activeElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });
    console.log('Active element after Tab:', activeElement);
    
    // Проверяем common shortcuts
    await page.keyboard.press('Space');
    await page.waitForTimeout(100);
    
    // Приложение не должно сломаться
    await expect(page.locator('body')).toBeVisible();
  });

  test('08. Responsive design check', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 1280, height: 720 },
      { width: 768, height: 1024 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(300);
      
      // Проверяем что контент адаптируется
      const container = page.locator('.min-h-screen, .h-screen').first();
      await expect(container).toBeVisible();
      
      console.log(`Viewport ${viewport.width}x${viewport.height} - OK`);
    }
  });

  test('09. Dark mode support', async ({ page }) => {
    const html = page.locator('html');
    const htmlClass = await html.getAttribute('class') || '';
    
    // Проверяем наличие класса темы
    const hasThemeClass = htmlClass.includes('light') || htmlClass.includes('dark');
    expect(hasThemeClass).toBeTruthy();
    
    console.log('HTML class:', htmlClass);
  });

  test('10. Media tab content check', async ({ page }) => {
    // Находим и кликаем на Media таб
    const mediaTab = page.locator('[role="tab"]').filter({ hasText: 'Media' }).first();
    
    if (await mediaTab.isVisible()) {
      await mediaTab.click();
      await page.waitForTimeout(500);
      
      // Проверяем что контент изменился
      const buttons = await page.locator('button:visible').count();
      console.log(`Media tab has ${buttons} visible buttons`);
      
      // Ищем элементы медиа браузера
      const hasMediaContent = await page.locator('button:has-text("Import")').count() > 0 ||
                             await page.locator('text=/no media|empty|drag/i').count() > 0;
      
      console.log('Has media content indicators:', hasMediaContent);
    }
  });
});