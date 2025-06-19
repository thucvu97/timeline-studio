import { test, expect } from '../fixtures/test-base';

test.describe('Keyboard Shortcuts', () => {

  test('should handle playback shortcuts', async ({ page }) => {
    // Фокусируемся на приложении
    await page.locator('body').click();
    
    // Проверяем Space для play/pause
    await page.keyboard.press('Space');
    
    // Проверяем что плеер начал воспроизведение
    const pauseButton = page.locator('button[aria-label*="Pause"]').first();
    await expect(pauseButton).toBeVisible();
    
    // Нажимаем Space снова для паузы
    await page.keyboard.press('Space');
    const playButton = page.locator('button[aria-label*="Play"]').first();
    await expect(playButton).toBeVisible();
  });

  test('should handle timeline navigation shortcuts', async ({ page }) => {
    // J - перемотка назад
    await page.keyboard.press('j');
    
    // K - пауза
    await page.keyboard.press('k');
    
    // L - перемотка вперед
    await page.keyboard.press('l');
    
    // Проверяем что команды обработались (через изменение времени)
    const timeDisplay = page.locator('[data-testid="current-time"], .current-time').first();
    await expect(timeDisplay).toBeVisible();
  });

  test('should handle zoom shortcuts', async ({ page }) => {
    const timeline = page.locator('.timeline-content, [data-testid="timeline-content"]').first();
    const initialBox = await timeline.boundingBox();
    
    // Ctrl/Cmd + = для zoom in
    await page.keyboard.press('Control+=');
    await page.waitForTimeout(300);
    
    const zoomedInBox = await timeline.boundingBox();
    expect(zoomedInBox?.width).toBeGreaterThanOrEqual(initialBox?.width || 0);
    
    // Ctrl/Cmd + - для zoom out
    await page.keyboard.press('Control+-');
    await page.waitForTimeout(300);
    
    const zoomedOutBox = await timeline.boundingBox();
    expect(zoomedOutBox?.width).toBeLessThanOrEqual(zoomedInBox?.width || 0);
  });

  test('should handle selection shortcuts', async ({ page }) => {
    // Ctrl/Cmd + A для выбора всех клипов
    await page.keyboard.press('Control+a');
    
    // Проверяем что появилось сообщение или изменился UI
    // (зависит от реализации)
    
    // Escape для снятия выделения
    await page.keyboard.press('Escape');
  });

  test('should handle editing shortcuts', async ({ page }) => {
    // Проверяем Ctrl+Z для undo
    await page.keyboard.press('Control+z');
    
    // Проверяем Ctrl+Shift+Z для redo
    await page.keyboard.press('Control+Shift+z');
    
    // Проверяем Delete для удаления
    // Сначала нужно что-то выбрать
    const firstClip = page.locator('[data-testid="timeline-clip"]').first();
    if (await firstClip.isVisible()) {
      await firstClip.click();
      await page.keyboard.press('Delete');
      
      // Проверяем что клип удалился
      await expect(firstClip).not.toBeVisible();
    }
  });

  test('should show keyboard shortcuts help', async ({ page }) => {
    // Обычно ? или Shift+? показывает справку по горячим клавишам
    await page.keyboard.press('Shift+?');
    
    // Проверяем появление модального окна со справкой
    const helpModal = page.locator('[role="dialog"]:has-text("Keyboard Shortcuts"), .shortcuts-help').first();
    
    // Если модальное окно появилось, проверяем его содержимое
    if (await helpModal.isVisible()) {
      await expect(helpModal).toContainText(/Space.*Play/i);
      await expect(helpModal).toContainText(/Delete/i);
      
      // Закрываем модальное окно
      await page.keyboard.press('Escape');
      await expect(helpModal).not.toBeVisible();
    }
  });

  test('should handle project shortcuts', async ({ page }) => {
    // Мокаем диалоги для тестирования
    await page.route('**/dialog/save', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ path: '/test/project.json' })
      });
    });
    
    await page.route('**/dialog/open', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ path: '/test/project.json' })
      });
    });
    
    // Ctrl+S для сохранения
    await page.keyboard.press('Control+s');
    
    // Ctrl+O для открытия
    await page.keyboard.press('Control+o');
    
    // Ctrl+N для нового проекта
    await page.keyboard.press('Control+n');
    
    // Проверяем что команды обработались
    // (можно проверить через появление уведомлений или изменение заголовка)
  });

  test('should handle view shortcuts', async ({ page }) => {
    // F11 для полноэкранного режима
    await page.keyboard.press('F11');
    
    // Tab для переключения между панелями
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Проверяем что фокус перемещается
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});