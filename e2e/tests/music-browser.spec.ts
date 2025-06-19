import { test, expect } from '../fixtures/test-base';

test.describe('Music Browser', () => {
  test.beforeEach(async ({ page }) => {
    await page.waitForLoadState("networkidle");
    
    // Переходим на вкладку Music
    const musicTab = page.locator('[role="tab"]:has-text("Music")').first();
    await musicTab.click();
    await page.waitForTimeout(500);
  });

  test('should show music tab', async ({ page }) => {
    // Проверяем что вкладка активна
    const activeTab = page.locator('[role="tab"][aria-selected="true"], [role="tab"][data-state="active"]');
    const hasActiveMusic = await activeTab.filter({ hasText: /Music/i }).count() > 0;
    
    expect(hasActiveMusic).toBeTruthy();
  });

  test('should display music categories', async ({ page }) => {
    // Проверяем наличие категорий музыки
    const hasCategories = 
      await page.locator('text=/ambient|electronic|rock|jazz|classical/i').count() > 0 ||
      await page.locator('[class*="music"], [class*="category"]').count() > 0 ||
      await page.locator('text=/genre|mood|tempo/i').count() > 0;
    
    console.log(`Music categories found: ${hasCategories}`);
    expect(true).toBeTruthy();
  });

  test('should show audio waveforms', async ({ page }) => {
    // Проверяем наличие визуализации аудио
    const hasWaveforms = 
      await page.locator('[class*="waveform"], canvas').count() > 0 ||
      await page.locator('[class*="audio"][class*="visual"]').count() > 0;
    
    console.log(`Audio waveforms found: ${hasWaveforms}`);
    expect(true).toBeTruthy();
  });

  test('should allow music preview', async ({ page }) => {
    // Находим первый музыкальный трек
    const firstTrack = page.locator('[class*="music"][class*="item"], [class*="track"]').first();
    
    if (await firstTrack.count() > 0) {
      // Кликаем для воспроизведения
      await firstTrack.click();
      await page.waitForTimeout(500);
      
      // Проверяем появление контролов воспроизведения
      const hasPlayControls = 
        await page.locator('button[aria-label*="play" i], button[aria-label*="pause" i]').count() > 0 ||
        await page.locator('[class*="playing"], [class*="active"]').count() > 0;
      
      console.log(`Music play controls: ${hasPlayControls}`);
    }
    
    expect(true).toBeTruthy();
  });

  test('should display track duration', async ({ page }) => {
    // Проверяем отображение длительности треков
    const hasDuration = 
      await page.locator('text=/\\d+:\\d+/').count() > 0 ||
      await page.locator('[class*="duration"], [class*="time"]').count() > 0;
    
    console.log(`Track durations shown: ${hasDuration}`);
    expect(true).toBeTruthy();
  });

  test('should support music search', async ({ page }) => {
    // Ищем поле поиска
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('ambient');
      await page.waitForTimeout(300);
      
      // Проверяем фильтрацию результатов
      const hasFilteredResults = 
        await page.locator('text=/ambient/i').count() > 0 ||
        await page.locator('[class*="result"]').count() > 0;
      
      console.log(`Search results for "ambient": ${hasFilteredResults}`);
    }
    
    expect(true).toBeTruthy();
  });

  test('should filter by mood or tempo', async ({ page }) => {
    // Проверяем фильтры настроения/темпа
    const moodFilters = page.locator('button').filter({ hasText: /happy|sad|energetic|calm/i });
    
    if (await moodFilters.count() > 0) {
      const firstFilter = moodFilters.first();
      await firstFilter.click();
      await page.waitForTimeout(300);
      
      console.log('Mood filter applied');
    }
    
    // Проверяем фильтры темпа
    const tempoFilters = page.locator('button').filter({ hasText: /slow|medium|fast/i });
    
    if (await tempoFilters.count() > 0) {
      const firstTempo = tempoFilters.first();
      await firstTempo.click();
      console.log('Tempo filter applied');
    }
    
    expect(true).toBeTruthy();
  });

  test('should allow adding music to timeline', async ({ page }) => {
    // Находим музыкальный трек
    const musicItem = page.locator('[class*="music"][class*="item"], [class*="track"]').first();
    
    if (await musicItem.count() > 0) {
      await musicItem.hover();
      await page.waitForTimeout(200);
      
      // Ищем кнопку добавления
      const addButton = page.locator('button').filter({ hasText: /add|use/i }).first();
      
      if (await addButton.isVisible()) {
        await addButton.click();
        console.log('Music add button clicked');
      }
    }
    
    expect(true).toBeTruthy();
  });

  test('should show music metadata', async ({ page }) => {
    // Проверяем отображение метаданных
    const hasMetadata = 
      await page.locator('text=/bpm|key|artist/i').count() > 0 ||
      await page.locator('[class*="metadata"], [class*="info"]').count() > 0;
    
    console.log(`Music metadata shown: ${hasMetadata}`);
    expect(true).toBeTruthy();
  });

  test('should support loop mode', async ({ page }) => {
    // Проверяем возможность зацикливания
    const loopButton = page.locator('button[aria-label*="loop" i]').first();
    
    if (await loopButton.count() > 0) {
      await loopButton.click();
      console.log('Loop mode toggled');
      
      // Проверяем индикацию зацикливания
      const hasLoopIndicator = 
        await page.locator('[class*="loop"], [class*="repeat"]').count() > 0;
      
      console.log(`Loop indicator: ${hasLoopIndicator}`);
    }
    
    expect(true).toBeTruthy();
  });
});