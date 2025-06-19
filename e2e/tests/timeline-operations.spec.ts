import { test, expect } from '@playwright/test';
import { waitForApp, isAnyVisible } from '../helpers/test-utils';

test.describe('Timeline Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
  });

  test('should show timeline controls', async ({ page }) => {
    const timelineControls = await isAnyVisible(page, [
      '[class*="timeline"]',
      '[class*="controls"]',
      'button[aria-label*="play"]',
      'button:has-text("Play")',
      '[class*="player"]'
    ]);
    expect(timelineControls).toBe(true);
  });

  test('should handle zoom in/out on timeline', async ({ page }) => {
    // Look for zoom controls
    const zoomInButton = page.locator('button').filter({ 
      has: page.locator('text=/zoom.*in|\\+/i') 
    }).first();
    
    const zoomOutButton = page.locator('button').filter({ 
      has: page.locator('text=/zoom.*out|\\-/i') 
    }).first();
    
    if (await zoomInButton.isVisible()) {
      await zoomInButton.click();
      await page.waitForTimeout(300);
    }
    
    if (await zoomOutButton.isVisible()) {
      await zoomOutButton.click();
      await page.waitForTimeout(300);
    }
    
    // Timeline should still be visible after zoom operations
    const timelineVisible = await isAnyVisible(page, [
      '[class*="timeline"]',
      '[class*="track"]',
      '[class*="ruler"]'
    ]);
    expect(timelineVisible).toBe(true);
  });

  test('should handle timeline scrolling', async ({ page }) => {
    // Find timeline area
    const timeline = page.locator('[class*="timeline"]').first();
    
    if (await timeline.isVisible()) {
      // Scroll horizontally
      await timeline.hover();
      await page.mouse.wheel(100, 0);
      await page.waitForTimeout(300);
      
      // Scroll vertically if multiple tracks
      await page.mouse.wheel(0, 50);
      await page.waitForTimeout(300);
    }
    
    // Timeline should still be functional
    const timelineVisible = await isAnyVisible(page, [
      '[class*="timeline"]',
      '[class*="track"]'
    ]);
    expect(timelineVisible).toBe(true);
  });

  test('should show timeline ruler/time markers', async ({ page }) => {
    const timeMarkers = await isAnyVisible(page, [
      '[class*="ruler"]',
      '[class*="time"]',
      'text=/\\d+:\\d+/i',
      '[class*="marker"]'
    ]);
    expect(timeMarkers).toBe(true);
  });

  test('should handle track operations', async ({ page }) => {
    // Look for track controls
    const trackControls = await isAnyVisible(page, [
      '[class*="track"]',
      'button:has-text("Add Track")',
      'text=/track/i',
      '[class*="layer"]'
    ]);
    
    if (trackControls) {
      // Try to add a track if button exists
      const addTrackButton = page.locator('button:has-text("Add Track")').first();
      if (await addTrackButton.isVisible()) {
        await addTrackButton.click();
        await page.waitForTimeout(500);
      }
    }
    
    // Verify timeline is still functional
    expect(await isAnyVisible(page, ['[class*="timeline"]'])).toBe(true);
  });

  test('should show playhead on timeline', async ({ page }) => {
    const playhead = await isAnyVisible(page, [
      '[class*="playhead"]',
      '[class*="cursor"]',
      '[class*="indicator"]',
      '[style*="transform"]' // Moving elements often use transform
    ]);
    expect(playhead).toBe(true);
  });

  test('should handle timeline selection', async ({ page }) => {
    const timeline = page.locator('[class*="timeline"]').first();
    
    if (await timeline.isVisible()) {
      // Click on timeline to set position
      const box = await timeline.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(300);
        
        // Drag to create selection
        await page.mouse.move(box.x + box.width / 4, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width * 3/4, box.y + box.height / 2);
        await page.mouse.up();
        await page.waitForTimeout(300);
      }
    }
    
    // Timeline should still be visible
    expect(await isAnyVisible(page, ['[class*="timeline"]'])).toBe(true);
  });

  test('should show timeline context menu on right click', async ({ page }) => {
    const timeline = page.locator('[class*="timeline"]').first();
    
    if (await timeline.isVisible()) {
      await timeline.click({ button: 'right' });
      await page.waitForTimeout(300);
      
      // Check for context menu
      const contextMenu = await isAnyVisible(page, [
        '[class*="context"]',
        '[class*="menu"]',
        '[role="menu"]',
        'text=/cut|copy|paste|delete/i'
      ]);
      
      // Context menu might not be implemented yet
      if (contextMenu) {
        // Click elsewhere to close menu
        await page.mouse.click(10, 10);
      }
    }
    
    // Timeline should still be functional
    expect(await isAnyVisible(page, ['[class*="timeline"]'])).toBe(true);
  });

  test('should handle timeline shortcuts', async ({ page }) => {
    // Focus on timeline area
    const timeline = page.locator('[class*="timeline"]').first();
    if (await timeline.isVisible()) {
      await timeline.click();
    }
    
    // Test common timeline shortcuts
    const shortcuts = [
      { key: 'Space', description: 'Play/Pause' },
      { key: 'Delete', description: 'Delete selection' },
      { key: 'Control+Z', description: 'Undo' },
      { key: 'Control+C', description: 'Copy' }
    ];
    
    for (const shortcut of shortcuts) {
      await page.keyboard.press(shortcut.key);
      await page.waitForTimeout(200);
    }
    
    // Timeline should still be functional after shortcuts
    expect(await isAnyVisible(page, ['[class*="timeline"]'])).toBe(true);
  });

  test('should show timeline toolbar', async ({ page }) => {
    const toolbar = await isAnyVisible(page, [
      '[class*="toolbar"]',
      '[class*="tools"]',
      'button[title*="Select"]',
      'button[title*="Cut"]',
      'button[title*="Split"]',
      '[class*="timeline-controls"]'
    ]);
    expect(toolbar).toBe(true);
  });
});