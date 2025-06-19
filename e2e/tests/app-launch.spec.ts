import { test, expect } from '../fixtures/test-base';

test.describe('App Launch Tests', () => {
  // Используем mock Tauri API для всех тестов

  test('should launch application without errors', async ({ page }) => {
    const errors: string[] = [];
    
    // Собираем ошибки консоли
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Проверяем что приложение загрузилось
    await expect(page).toHaveTitle(/Timeline Studio/);
    
    // Проверяем основные контейнеры
    await expect(page.locator('.h-screen')).toBeVisible();
    
    // Проверяем что нет критических ошибок
    const criticalErrors = errors.filter(err => 
      !err.includes('ResizeObserver') && // Игнорируем предупреждения ResizeObserver
      !err.includes('Warning:') // Игнорируем React warnings
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('should show main UI components', async ({ page }) => {
    // Проверяем TopBar
    const topBar = page.locator('header').first();
    await expect(topBar).toBeVisible();
    
    // Проверяем наличие кнопок в TopBar
    const settingsButton = topBar.locator('button[aria-label*="Settings"], button:has-text("Settings")').first();
    await expect(settingsButton).toBeVisible();
    
    // Проверяем Browser секцию
    const browserSection = page.locator('[role="tablist"]').first();
    await expect(browserSection).toBeVisible();
    
    // Проверяем Timeline секцию
    const timelineSection = page.locator('.timeline-container, [data-testid="timeline"]').first();
    await expect(timelineSection).toBeVisible();
  });

  test('should have correct initial state', async ({ page }) => {
    // Проверяем что по умолчанию открыта вкладка Media
    const mediaTab = page.locator('[role="tab"][aria-selected="true"]:has-text("Media")');
    await expect(mediaTab).toBeVisible();
    
    // Проверяем сообщение о пустом состоянии
    const emptyMessage = page.locator('text=/No media files imported|Import files to start editing/i');
    await expect(emptyMessage).toBeVisible();
    
    // Проверяем наличие кнопок импорта
    const importButton = page.locator('button:has-text("Import")').first();
    await expect(importButton).toBeVisible();
  });

  test('should switch between browser tabs', async ({ page }) => {
    const tabList = page.locator('[role="tablist"]').first();
    
    // Переключаемся на вкладку Effects
    const effectsTab = tabList.locator('[role="tab"]:has-text("Effects")');
    await effectsTab.click();
    await expect(effectsTab).toHaveAttribute('aria-selected', 'true');
    
    // Переключаемся на вкладку Transitions
    const transitionsTab = tabList.locator('[role="tab"]:has-text("Transitions")');
    await transitionsTab.click();
    await expect(transitionsTab).toHaveAttribute('aria-selected', 'true');
    
    // Возвращаемся на Media
    const mediaTab = tabList.locator('[role="tab"]:has-text("Media")');
    await mediaTab.click();
    await expect(mediaTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should open settings modal', async ({ page }) => {
    // Находим кнопку настроек
    const settingsButton = page.locator('button[aria-label*="Settings"], button:has-text("Settings")').first();
    await settingsButton.click();
    
    // Проверяем что модальное окно открылось
    const modal = page.locator('[role="dialog"], .modal').first();
    await expect(modal).toBeVisible();
    
    // Проверяем заголовок модального окна
    const modalTitle = modal.locator('h2, [role="heading"]').first();
    await expect(modalTitle).toContainText(/Settings|Настройки/i);
    
    // Закрываем модальное окно
    const closeButton = modal.locator('button[aria-label*="Close"], button:has-text("Close"), button:has-text("×")').first();
    await closeButton.click();
    await expect(modal).not.toBeVisible();
  });
});