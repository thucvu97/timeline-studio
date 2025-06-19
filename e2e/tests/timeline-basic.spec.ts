import { test, expect } from '../fixtures/test-base';
import { TimelinePage } from '../fixtures/page-objects/timeline-page';

test.describe('Timeline Basic Functionality', () => {
  let timelinePage: TimelinePage;

  test.beforeEach(async ({ page }) => {
    timelinePage = new TimelinePage(page);
  });

  test('should display timeline with default tracks', async ({ page }) => {
    // Проверяем что таймлайн отображается
    const timeline = page.locator('.timeline-container, [data-testid="timeline"]').first();
    await expect(timeline).toBeVisible();
    
    // Проверяем наличие треков
    const tracks = page.locator('[data-testid="timeline-track"], .timeline-track');
    const trackCount = await tracks.count();
    expect(trackCount).toBeGreaterThan(0);
  });

  test('should show playback controls', async ({ page }) => {
    // Проверяем кнопки управления воспроизведением
    const playButton = page.locator('[data-testid="play-button"], button[aria-label*="Play"]').first();
    await expect(playButton).toBeVisible();
    
    // Проверяем индикатор времени
    const timeDisplay = page.locator('[data-testid="time-indicator"], .time-display').first();
    await expect(timeDisplay).toBeVisible();
    await expect(timeDisplay).toContainText(/00:00/);
  });

  test('should show zoom controls', async ({ page }) => {
    // Проверяем наличие контролов масштабирования
    const zoomControls = page.locator('[data-testid="zoom-controls"], .zoom-controls').first();
    await expect(zoomControls).toBeVisible();
    
    // Проверяем кнопки zoom in/out
    const zoomIn = page.locator('button[aria-label*="Zoom in"], button:has-text("+")').first();
    const zoomOut = page.locator('button[aria-label*="Zoom out"], button:has-text("-")').first();
    
    await expect(zoomIn).toBeVisible();
    await expect(zoomOut).toBeVisible();
  });

  test('should display timeline ruler', async ({ page }) => {
    // Проверяем линейку времени
    const ruler = page.locator('[data-testid="timeline-ruler"], .timeline-ruler').first();
    await expect(ruler).toBeVisible();
    
    // Проверяем наличие временных меток
    const timeMarks = ruler.locator('.time-mark, [data-testid="time-mark"]');
    const markCount = await timeMarks.count();
    expect(markCount).toBeGreaterThan(0);
  });

  test('should handle play/pause toggle', async ({ page }) => {
    const playButton = page.locator('[data-testid="play-button"], button[aria-label*="Play"]').first();
    
    // Кликаем play
    await playButton.click();
    
    // Проверяем что кнопка изменилась на pause
    const pauseButton = page.locator('[data-testid="pause-button"], button[aria-label*="Pause"]').first();
    await expect(pauseButton).toBeVisible();
    
    // Кликаем pause
    await pauseButton.click();
    
    // Проверяем что вернулась кнопка play
    await expect(playButton).toBeVisible();
  });

  test('should handle zoom in/out', async ({ page }) => {
    const zoomIn = page.locator('button[aria-label*="Zoom in"], button:has-text("+")').first();
    const zoomOut = page.locator('button[aria-label*="Zoom out"], button:has-text("-")').first();
    
    // Получаем начальную ширину таймлайна
    const timeline = page.locator('.timeline-content, [data-testid="timeline-content"]').first();
    const initialBox = await timeline.boundingBox();
    
    // Zoom in
    await zoomIn.click();
    await page.waitForTimeout(300); // Ждем анимацию
    
    // Проверяем что масштаб изменился
    const zoomedInBox = await timeline.boundingBox();
    expect(zoomedInBox?.width).toBeGreaterThan(initialBox?.width || 0);
    
    // Zoom out
    await zoomOut.click();
    await zoomOut.click(); // Дважды для большего эффекта
    await page.waitForTimeout(300);
    
    // Проверяем что масштаб уменьшился
    const zoomedOutBox = await timeline.boundingBox();
    expect(zoomedOutBox?.width).toBeLessThan(zoomedInBox?.width || 0);
  });

  test('should show context menu on right click', async ({ page }) => {
    const timeline = page.locator('.timeline-content, [data-testid="timeline-content"]').first();
    
    // Правый клик на таймлайне
    await timeline.click({ button: 'right' });
    
    // Проверяем появление контекстного меню
    const contextMenu = page.locator('[role="menu"], .context-menu').first();
    await expect(contextMenu).toBeVisible();
    
    // Проверяем пункты меню
    const menuItems = contextMenu.locator('[role="menuitem"], .menu-item');
    const itemCount = await menuItems.count();
    expect(itemCount).toBeGreaterThan(0);
    
    // Закрываем меню кликом вне его
    await page.mouse.click(10, 10);
    await expect(contextMenu).not.toBeVisible();
  });

  test('should display correct project info', async ({ page }) => {
    // Проверяем отображение информации о проекте
    const projectInfo = page.locator('[data-testid="project-info"], .project-info').first();
    
    // Проверяем FPS
    const fpsDisplay = page.locator('text=/30.*fps|25.*fps|24.*fps/i').first();
    await expect(fpsDisplay).toBeVisible();
    
    // Проверяем разрешение
    const resolutionDisplay = page.locator('text=/1920.*1080|1280.*720|3840.*2160/i').first();
    await expect(resolutionDisplay).toBeVisible();
  });
});