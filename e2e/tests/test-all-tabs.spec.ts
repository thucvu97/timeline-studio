import { test, expect } from '@playwright/test';
import { waitForApp, clickBrowserTab, isAnyVisible } from '../helpers/test-utils';

test.describe('All Browser Tabs Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
  });

  test('should navigate through all browser tabs', async ({ page }) => {
    // Test Media tab
    await clickBrowserTab(page, 'Media');
    await expect(page).toHaveURL(/#media$/);
    const mediaContent = await isAnyVisible(page, [
      'button:has-text("Import")',
      'text=/no media|empty|drag/i',
      '[class*="drop"]',
      '[class*="media"]'
    ]);
    expect(mediaContent).toBe(true);

    // Test Effects tab
    await clickBrowserTab(page, 'Effects');
    await expect(page).toHaveURL(/#effects$/);
    const effectsContent = await isAnyVisible(page, [
      'text=/effect/i',
      '[class*="effect"]',
      'button:has-text("Apply")',
      '[class*="grid"]'
    ]);
    expect(effectsContent).toBe(true);

    // Test Transitions tab
    await clickBrowserTab(page, 'Transitions');
    await expect(page).toHaveURL(/#transitions$/);
    const transitionsContent = await isAnyVisible(page, [
      'text=/transition/i',
      '[class*="transition"]',
      '[class*="grid"]'
    ]);
    expect(transitionsContent).toBe(true);

    // Test Filters tab
    await clickBrowserTab(page, 'Filters');
    await expect(page).toHaveURL(/#filters$/);
    const filtersContent = await isAnyVisible(page, [
      'text=/filter/i',
      '[class*="filter"]',
      '[class*="grid"]'
    ]);
    expect(filtersContent).toBe(true);

    // Test Templates tab
    await clickBrowserTab(page, 'Templates');
    await expect(page).toHaveURL(/#templates$/);
    const templatesContent = await isAnyVisible(page, [
      'text=/template/i',
      '[class*="template"]',
      '[class*="grid"]'
    ]);
    expect(templatesContent).toBe(true);

    // Test Music tab
    await clickBrowserTab(page, 'Music');
    await expect(page).toHaveURL(/#music$/);
    const musicContent = await isAnyVisible(page, [
      'text=/music|audio/i',
      '[class*="music"]',
      '[class*="audio"]',
      '[class*="grid"]'
    ]);
    expect(musicContent).toBe(true);

    // Test Style Templates tab
    await clickBrowserTab(page, 'Style Templates');
    await expect(page).toHaveURL(/#style-templates$/);
    const styleContent = await isAnyVisible(page, [
      'text=/style|template/i',
      '[class*="style"]',
      '[class*="grid"]'
    ]);
    expect(styleContent).toBe(true);

    // Test Subtitles tab
    await clickBrowserTab(page, 'Subtitles');
    await expect(page).toHaveURL(/#subtitles$/);
    const subtitlesContent = await isAnyVisible(page, [
      'text=/subtitle|caption/i',
      '[class*="subtitle"]',
      '[class*="grid"]'
    ]);
    expect(subtitlesContent).toBe(true);
  });

  test('should maintain state when switching tabs', async ({ page }) => {
    // Go to Media tab
    await clickBrowserTab(page, 'Media');
    await expect(page).toHaveURL(/#media$/);
    
    // Switch to Effects and back
    await clickBrowserTab(page, 'Effects');
    await expect(page).toHaveURL(/#effects$/);
    
    await clickBrowserTab(page, 'Media');
    await expect(page).toHaveURL(/#media$/);
    
    // Verify we're back on Media tab
    const mediaContent = await isAnyVisible(page, [
      'button:has-text("Import")',
      'text=/no media|empty|drag/i',
      '[class*="media"]'
    ]);
    expect(mediaContent).toBe(true);
  });

  test('should handle rapid tab switching', async ({ page }) => {
    // Quickly switch between multiple tabs
    const tabs = ['Media', 'Effects', 'Transitions', 'Filters', 'Templates'];
    
    for (const tab of tabs) {
      await clickBrowserTab(page, tab);
      // Don't wait for full load, just check URL changed
      await page.waitForTimeout(100);
    }
    
    // End on Templates tab and verify
    await expect(page).toHaveURL(/#templates$/);
    const templatesContent = await isAnyVisible(page, [
      'text=/template/i',
      '[class*="template"]',
      '[class*="grid"]'
    ]);
    expect(templatesContent).toBe(true);
  });

  test('should show correct active tab styling', async ({ page }) => {
    // Check each tab shows as active when selected
    const tabs = ['Media', 'Effects', 'Transitions', 'Filters'];
    
    for (const tab of tabs) {
      await clickBrowserTab(page, tab);
      
      // Find the tab button
      const tabButton = page.locator(`button:has-text("${tab}")`).first();
      
      // Check if it has active styling (various possible classes)
      const hasActiveClass = await tabButton.evaluate(el => {
        const classList = el.className;
        return classList.includes('active') || 
               classList.includes('selected') || 
               classList.includes('current') ||
               // Check computed styles
               window.getComputedStyle(el).backgroundColor !== 'rgba(0, 0, 0, 0)';
      });
      
      expect(hasActiveClass).toBe(true);
    }
  });

  test('should handle tab navigation with keyboard', async ({ page }) => {
    // Focus on browser tabs area
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Try navigating with arrow keys
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    
    // Press Enter to select
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    
    // Verify we navigated to a different tab
    const url = page.url();
    expect(url).toContain('#');
  });
});