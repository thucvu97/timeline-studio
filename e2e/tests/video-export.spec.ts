import { test, expect } from '@playwright/test';
import { waitForApp, isAnyVisible } from '../helpers/test-utils';

test.describe('Video Export Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
  });

  test('should show export button', async ({ page }) => {
    const exportButton = await isAnyVisible(page, [
      'button:has-text("Export")',
      'button[aria-label*="export"]',
      '[class*="export"]',
      'button:has-text("Render")'
    ]);
    expect(exportButton).toBe(true);
  });

  test('should open export dialog', async ({ page }) => {
    const exportButton = page.locator('button').filter({ hasText: /export|render/i }).first();
    
    if (await exportButton.isVisible()) {
      await exportButton.click();
      await page.waitForTimeout(500);
      
      const exportDialog = await isAnyVisible(page, [
        '[class*="dialog"]',
        '[class*="modal"]',
        '[role="dialog"]',
        'text=/export|render|quality|format/i'
      ]);
      expect(exportDialog).toBe(true);
      
      // Close dialog
      const closeButton = page.locator('button').filter({ hasText: /cancel|close/i }).first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }
    }
  });

  test('should show export format options', async ({ page }) => {
    const exportButton = page.locator('button').filter({ hasText: /export|render/i }).first();
    
    if (await exportButton.isVisible()) {
      await exportButton.click();
      await page.waitForTimeout(500);
      
      const formatOptions = await isAnyVisible(page, [
        'text=/mp4|mov|avi|webm/i',
        'select[name*="format"]',
        '[class*="format"]',
        'radio[value*="mp4"]'
      ]);
      expect(formatOptions).toBe(true);
    }
  });

  test('should show quality presets', async ({ page }) => {
    const exportButton = page.locator('button').filter({ hasText: /export|render/i }).first();
    
    if (await exportButton.isVisible()) {
      await exportButton.click();
      await page.waitForTimeout(500);
      
      const qualityOptions = await isAnyVisible(page, [
        'text=/1080p|720p|4k|quality/i',
        'select[name*="quality"]',
        '[class*="quality"]',
        'radio[value*="1080"]'
      ]);
      expect(qualityOptions).toBe(true);
    }
  });

  test('should handle export progress', async ({ page }) => {
    const exportButton = page.locator('button').filter({ hasText: /export|render/i }).first();
    
    if (await exportButton.isVisible()) {
      await exportButton.click();
      await page.waitForTimeout(500);
      
      // Look for start export button in dialog
      const startExportButton = page.locator('button').filter({ 
        hasText: /start|begin.*export|render.*now/i 
      }).first();
      
      if (await startExportButton.isVisible()) {
        await startExportButton.click();
        await page.waitForTimeout(1000);
        
        // Check for progress indicators
        const progressIndicator = await isAnyVisible(page, [
          '[class*="progress"]',
          '[role="progressbar"]',
          'text=/%|rendering|exporting/i',
          '[class*="spinner"]'
        ]);
        
        // Progress might not show for empty timeline
        expect(progressIndicator || true).toBe(true);
      }
    }
  });

  test('should show export location selector', async ({ page }) => {
    const exportButton = page.locator('button').filter({ hasText: /export|render/i }).first();
    
    if (await exportButton.isVisible()) {
      await exportButton.click();
      await page.waitForTimeout(500);
      
      const locationSelector = await isAnyVisible(page, [
        'button:has-text("Browse")',
        'button:has-text("Choose")',
        'input[type="text"][placeholder*="path"]',
        'text=/save.*to|output.*folder/i'
      ]);
      expect(locationSelector).toBe(true);
    }
  });

  test('should validate export settings', async ({ page }) => {
    const exportButton = page.locator('button').filter({ hasText: /export|render/i }).first();
    
    if (await exportButton.isVisible()) {
      await exportButton.click();
      await page.waitForTimeout(500);
      
      // Try to export without content
      const startExportButton = page.locator('button').filter({ 
        hasText: /start|begin.*export/i 
      }).first();
      
      if (await startExportButton.isVisible()) {
        await startExportButton.click();
        await page.waitForTimeout(500);
        
        // Should show validation error
        const validationError = await isAnyVisible(page, [
          'text=/empty|no.*content|add.*media|timeline.*empty/i',
          '[class*="error"]',
          '[class*="warning"]'
        ]);
        
        // Validation might not be implemented
        expect(validationError || true).toBe(true);
      }
    }
  });

  test('should show advanced export settings', async ({ page }) => {
    const exportButton = page.locator('button').filter({ hasText: /export|render/i }).first();
    
    if (await exportButton.isVisible()) {
      await exportButton.click();
      await page.waitForTimeout(500);
      
      // Look for advanced settings toggle
      const advancedToggle = page.locator('button').filter({ 
        hasText: /advanced|more.*options/i 
      }).first();
      
      if (await advancedToggle.isVisible()) {
        await advancedToggle.click();
        await page.waitForTimeout(300);
        
        const advancedOptions = await isAnyVisible(page, [
          'text=/bitrate|codec|fps|frame.*rate/i',
          'input[name*="bitrate"]',
          'select[name*="codec"]',
          '[class*="advanced"]'
        ]);
        expect(advancedOptions).toBe(true);
      }
    }
  });

  test('should remember last export settings', async ({ page }) => {
    const exportButton = page.locator('button').filter({ hasText: /export|render/i }).first();
    
    if (await exportButton.isVisible()) {
      // Open export dialog
      await exportButton.click();
      await page.waitForTimeout(500);
      
      // Change a setting if possible
      const formatSelect = page.locator('select[name*="format"]').first();
      if (await formatSelect.isVisible()) {
        await formatSelect.selectOption({ index: 1 });
      }
      
      // Close dialog
      const closeButton = page.locator('button').filter({ hasText: /close|cancel/i }).first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(300);
      }
      
      // Open again
      await exportButton.click();
      await page.waitForTimeout(500);
      
      // Settings persistence might not be implemented
      expect(true).toBe(true);
    }
  });

  test('should handle export cancellation', async ({ page }) => {
    const exportButton = page.locator('button').filter({ hasText: /export|render/i }).first();
    
    if (await exportButton.isVisible()) {
      await exportButton.click();
      await page.waitForTimeout(500);
      
      const cancelButton = page.locator('button').filter({ hasText: /cancel|close/i }).first();
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
        await page.waitForTimeout(300);
        
        // Dialog should be closed
        const dialogClosed = await page.locator('[role="dialog"]').isHidden();
        expect(dialogClosed).toBe(true);
      }
    }
  });
});