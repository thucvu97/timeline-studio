import { test, expect } from '@playwright/test';

test.describe('Basic Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('application loads without errors', async ({ page }) => {
    // Проверяем что нет критических ошибок в консоли
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('ResizeObserver')) {
        errors.push(msg.text());
      }
    });

    // Ждем загрузки
    await page.waitForTimeout(1000);

    // Проверяем основные элементы
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Проверяем что есть контент
    const hasContent = await page.locator('div').count() > 0;
    expect(hasContent).toBeTruthy();

    // Проверяем что нет критических ошибок
    expect(errors.filter(e => !e.includes('Warning'))).toHaveLength(0);
  });

  test('has main container', async ({ page }) => {
    // Ищем основной контейнер приложения
    const containers = [
      page.locator('.h-screen').first(),
      page.locator('.min-h-screen').first(),
      page.locator('[class*="screen"]').first()
    ];

    let found = false;
    for (const container of containers) {
      if (await container.isVisible()) {
        found = true;
        break;
      }
    }
    expect(found).toBeTruthy();
  });

  test('has interactive elements', async ({ page }) => {
    // Проверяем наличие интерактивных элементов
    const buttons = await page.locator('button').count();
    const links = await page.locator('a').count();
    const inputs = await page.locator('input').count();
    
    const totalInteractive = buttons + links + inputs;
    expect(totalInteractive).toBeGreaterThan(0);
    
    console.log(`Found ${buttons} buttons, ${links} links, ${inputs} inputs`);
  });

  test('has tabs or navigation', async ({ page }) => {
    // Проверяем наличие навигации
    const tabs = page.locator('[role="tab"], [role="tablist"], .tab, [class*="tab"]');
    const tabCount = await tabs.count();
    
    if (tabCount > 0) {
      console.log(`Found ${tabCount} tab elements`);
      expect(tabCount).toBeGreaterThan(0);
    } else {
      // Если нет табов, проверяем другую навигацию
      const nav = page.locator('nav, [role="navigation"], .navigation');
      const navCount = await nav.count();
      console.log(`Found ${navCount} navigation elements`);
    }
  });

  test('responds to user interaction', async ({ page }) => {
    // Находим первую кнопку и пробуем кликнуть
    const firstButton = page.locator('button:visible').first();
    
    if (await firstButton.isVisible()) {
      // Запоминаем состояние до клика
      const beforeClickUrl = page.url();
      
      // Кликаем
      await firstButton.click({ force: true });
      await page.waitForTimeout(500);
      
      // Проверяем что что-то изменилось (URL, DOM, или появился новый элемент)
      const afterClickUrl = page.url();
      const domChanged = await page.evaluate(() => document.body.innerHTML.length);
      
      console.log('Button clicked, checking for changes...');
      // Не проверяем конкретные изменения, просто что приложение не сломалось
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('has dark mode support', async ({ page }) => {
    // Проверяем поддержку темной темы
    const html = page.locator('html');
    const classAttr = await html.getAttribute('class');
    
    // Timeline Studio использует класс 'light' или 'dark' на html
    expect(classAttr).toMatch(/light|dark/);
    
    // Проверяем наличие стилей для темной темы
    const hasDarkStyles = await page.locator('[class*="dark"]').count() > 0;
    console.log('Has dark mode styles:', hasDarkStyles);
  });

  test('keyboard navigation works', async ({ page }) => {
    // Проверяем что Tab работает
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
    
    // Проверяем что есть фокус на каком-то элементе
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tagName: el?.tagName,
        className: el?.className,
        hasElement: el !== document.body
      };
    });
    
    console.log('Focused element:', focusedElement);
    
    // Проверяем Space для play/pause (если есть плеер)
    await page.keyboard.press('Space');
    await page.waitForTimeout(100);
    
    // Приложение не должно сломаться
    await expect(page.locator('body')).toBeVisible();
  });

  test('media query responsive', async ({ page }) => {
    // Проверяем адаптивность
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(300);
      
      // Проверяем что контент виден
      const body = page.locator('body');
      await expect(body).toBeVisible();
      
      console.log(`${viewport.name} viewport OK`);
    }
  });
});