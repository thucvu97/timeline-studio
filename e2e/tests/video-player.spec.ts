import { test, expect } from '../fixtures/test-base';

test.describe('Video Player Functionality', () => {

  test('should display video player controls', async ({ page }) => {
    // Проверяем наличие видео плеера
    const videoPlayer = page.locator('[data-testid="video-player"], .video-player').first();
    await expect(videoPlayer).toBeVisible();
    
    // Проверяем контролы плеера
    const playerControls = page.locator('[data-testid="player-controls"], .player-controls').first();
    await expect(playerControls).toBeVisible();
    
    // Проверяем основные кнопки
    const playButton = playerControls.locator('button[aria-label*="Play"]').first();
    const volumeButton = playerControls.locator('button[aria-label*="Volume"], button[aria-label*="Mute"]').first();
    const fullscreenButton = playerControls.locator('button[aria-label*="Fullscreen"]').first();
    
    await expect(playButton).toBeVisible();
    await expect(volumeButton).toBeVisible();
    await expect(fullscreenButton).toBeVisible();
  });

  test('should show empty player state', async ({ page }) => {
    // Проверяем сообщение о пустом плеере
    const emptyState = page.locator('text=/No video loaded|Import media to preview/i').first();
    await expect(emptyState).toBeVisible();
  });

  test('should display time indicators', async ({ page }) => {
    // Проверяем отображение времени
    const currentTime = page.locator('[data-testid="current-time"], .current-time').first();
    const duration = page.locator('[data-testid="duration"], .duration').first();
    
    await expect(currentTime).toBeVisible();
    await expect(duration).toBeVisible();
    
    // Проверяем формат времени
    await expect(currentTime).toContainText(/\d{1,2}:\d{2}/);
    await expect(duration).toContainText(/\d{1,2}:\d{2}/);
  });

  test('should have working volume control', async ({ page }) => {
    const volumeButton = page.locator('button[aria-label*="Volume"], button[aria-label*="Mute"]').first();
    
    // Кликаем на кнопку громкости
    await volumeButton.click();
    
    // Проверяем появление слайдера громкости
    const volumeSlider = page.locator('[data-testid="volume-slider"], input[type="range"]').first();
    await expect(volumeSlider).toBeVisible();
    
    // Изменяем громкость
    await volumeSlider.fill('50');
    await expect(volumeSlider).toHaveValue('50');
  });

  test('should toggle fullscreen mode', async ({ page }) => {
    const fullscreenButton = page.locator('button[aria-label*="Fullscreen"]').first();
    
    // Мокаем fullscreen API
    await page.addInitScript(() => {
      document.documentElement.requestFullscreen = async () => {};
      document.exitFullscreen = async () => {};
      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: null
      });
    });
    
    // Кликаем fullscreen
    await fullscreenButton.click();
    
    // Проверяем что кнопка изменилась
    const exitFullscreenButton = page.locator('button[aria-label*="Exit fullscreen"]').first();
    await expect(exitFullscreenButton).toBeVisible();
  });

  test('should show frame navigation controls', async ({ page }) => {
    // Проверяем кнопки покадровой навигации
    const prevFrameButton = page.locator('button[aria-label*="Previous frame"]').first();
    const nextFrameButton = page.locator('button[aria-label*="Next frame"]').first();
    
    await expect(prevFrameButton).toBeVisible();
    await expect(nextFrameButton).toBeVisible();
  });

  test('should display playback speed control', async ({ page }) => {
    // Проверяем контроль скорости воспроизведения
    const speedControl = page.locator('[data-testid="speed-control"], button:has-text("1x")').first();
    await expect(speedControl).toBeVisible();
    
    // Кликаем для открытия меню скорости
    await speedControl.click();
    
    // Проверяем опции скорости
    const speedOptions = page.locator('[role="menu"] button, .speed-option');
    await expect(speedOptions).toHaveCount(5); // 0.5x, 0.75x, 1x, 1.5x, 2x
    
    // Выбираем скорость 1.5x
    const speed15x = speedOptions.filter({ hasText: '1.5x' });
    await speed15x.click();
    
    // Проверяем что скорость изменилась
    await expect(speedControl).toContainText('1.5x');
  });

  test('should show quality settings', async ({ page }) => {
    // Находим кнопку настроек качества
    const qualityButton = page.locator('button[aria-label*="Quality"], button[aria-label*="Settings"]').first();
    
    // Если кнопка есть, проверяем её функциональность
    if (await qualityButton.isVisible()) {
      await qualityButton.click();
      
      // Проверяем меню качества
      const qualityMenu = page.locator('[role="menu"], .quality-menu').first();
      await expect(qualityMenu).toBeVisible();
      
      // Проверяем опции качества
      const qualityOptions = qualityMenu.locator('[role="menuitem"], .quality-option');
      const optionCount = await qualityOptions.count();
      expect(optionCount).toBeGreaterThan(0);
    }
  });
});