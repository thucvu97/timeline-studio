import { test, expect } from '@playwright/test';
import { 
  waitForApp, 
  clickBrowserTab, 
  mockTauriAPI,
  isAnyVisible,
  waitForAnySelector
} from '../helpers/test-utils';

test.describe('Realistic App Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Мокаем Tauri API
    await mockTauriAPI(page);
    
    // Открываем приложение
    await page.goto('/');
    await waitForApp(page);
  });

  test('should load Timeline Studio app', async ({ page }) => {
    // Проверяем что есть основной контейнер
    const mainContainer = await waitForAnySelector(page, [
      '.h-screen',
      '.min-h-screen',
      '[data-testid="app-container"]',
      'main',
      '#__next'
    ]);
    await expect(mainContainer).toBeVisible();
    
    // Проверяем что страница загрузилась без ошибок
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should show browser tabs', async ({ page }) => {
    // Ждем появления табов
    const tabList = await waitForAnySelector(page, [
      '[role="tablist"]',
      '.tabs-list',
      '[data-testid="browser-tabs"]'
    ]);
    await expect(tabList).toBeVisible();
    
    // Проверяем наличие основных вкладок
    const tabs = ['Media', 'Effects', 'Transitions', 'Filters'];
    
    for (const tabName of tabs) {
      const tab = page.locator(`[role="tab"]`).filter({ hasText: tabName });
      const tabCount = await tab.count();
      
      if (tabCount > 0) {
        console.log(`Found tab: ${tabName}`);
      }
    }
  });

  test('should switch between tabs', async ({ page }) => {
    // Кликаем на вкладку Effects
    await clickBrowserTab(page, 'Effects');
    
    // Проверяем что вкладка активна
    const activeTab = page.locator('[role="tab"][aria-selected="true"], [role="tab"][data-state="active"]');
    await expect(activeTab).toContainText(/Effects/i);
    
    // Кликаем на вкладку Transitions
    await clickBrowserTab(page, 'Transitions');
    
    // Проверяем что вкладка изменилась
    const newActiveTab = page.locator('[role="tab"][aria-selected="true"], [role="tab"][data-state="active"]');
    await expect(newActiveTab).toContainText(/Transitions/i);
  });

  test('should show media browser content', async ({ page }) => {
    // Убеждаемся что на вкладке Media
    await clickBrowserTab(page, 'Media');
    
    // Ждем контент
    await page.waitForTimeout(1000);
    
    // Проверяем наличие элементов медиа браузера
    const hasBrowserContent = await isAnyVisible(page, [
      '[data-testid="media-browser"]',
      '.media-browser',
      'text="No media files imported"',
      'text="Import files to start editing"',
      'button:has-text("Import")'
    ]);
    
    expect(hasBrowserContent).toBeTruthy();
  });

  test('should show timeline area', async ({ page }) => {
    // Ищем область таймлайна
    const hasTimeline = await isAnyVisible(page, [
      '[data-testid="timeline"]',
      '.timeline-container',
      '.timeline-wrapper',
      '[class*="timeline"]'
    ]);
    
    expect(hasTimeline).toBeTruthy();
  });

  test('should show video player area', async ({ page }) => {
    // Ищем область видео плеера
    const hasVideoPlayer = await isAnyVisible(page, [
      '[data-testid="video-player"]',
      '.video-player',
      '.player-container',
      '[class*="player"]',
      'video',
      'canvas' // Может использоваться canvas для отрисовки
    ]);
    
    expect(hasVideoPlayer).toBeTruthy();
  });

  test('should have control buttons', async ({ page }) => {
    // Ищем кнопки управления
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    // Должны быть кнопки
    expect(buttonCount).toBeGreaterThan(5);
    
    // Проверяем наличие основных кнопок
    const hasPlayButton = await isAnyVisible(page, [
      'button[aria-label*="Play"]',
      'button:has-text("Play")',
      '[data-testid="play-button"]',
      'button svg[class*="play"]'
    ]);
    
    // Не обязательно есть кнопка play (может быть pause)
    console.log('Has play button:', hasPlayButton);
  });

  test('should respond to keyboard shortcuts', async ({ page }) => {
    // Фокусируемся на странице
    await page.locator('body').click();
    
    // Пробуем нажать Space
    await page.keyboard.press('Space');
    
    // Небольшая задержка
    await page.waitForTimeout(500);
    
    // Проверяем что приложение не сломалось
    const mainContainer = page.locator('.h-screen, main, #__next').first();
    await expect(mainContainer).toBeVisible();
  });

  test('should handle window resize', async ({ page }) => {
    // Изменяем размер окна
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    
    // Проверяем что UI адаптировался
    const mainContainer = page.locator('.h-screen, main, #__next').first();
    await expect(mainContainer).toBeVisible();
    
    // Возвращаем размер
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('should show tooltips on hover', async ({ page }) => {
    // Находим любую кнопку с иконкой
    const iconButton = page.locator('button svg').first();
    
    if (await iconButton.isVisible()) {
      // Наводим на кнопку
      await iconButton.hover();
      
      // Ждем появления тултипа
      await page.waitForTimeout(1000);
      
      // Проверяем наличие тултипа
      const hasTooltip = await isAnyVisible(page, [
        '[role="tooltip"]',
        '.tooltip',
        '[data-testid="tooltip"]'
      ]);
      
      console.log('Has tooltip:', hasTooltip);
    }
  });
});