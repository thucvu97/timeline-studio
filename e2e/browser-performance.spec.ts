import { test, expect } from '@playwright/test'

test.describe('Browser Performance Tests', () => {
  test('проверяем что браузер не моргает при переключении вкладок', async ({ page }) => {
    // Открываем страницу
    await page.goto('http://localhost:3000')
    
    // Ждем загрузки приложения
    await page.waitForSelector('[data-testid="media-tab"]', { timeout: 10000 })
    
    // Проверяем что вкладка медиа активна по умолчанию
    const mediaTab = page.locator('[data-testid="media-tab"]')
    await expect(mediaTab).toHaveAttribute('data-state', 'active')
    
    // Переключаемся на музыку
    const musicTab = page.locator('[data-testid="music-tab"]')
    await musicTab.click()
    
    // Проверяем что переключение произошло
    await expect(musicTab).toHaveAttribute('data-state', 'active')
    await expect(mediaTab).toHaveAttribute('data-state', 'inactive')
    
    // Переключаемся на эффекты
    const effectsTab = page.locator('[data-testid="effects-tab"]')
    await effectsTab.click()
    
    // Проверяем что переключение произошло
    await expect(effectsTab).toHaveAttribute('data-state', 'active')
    await expect(musicTab).toHaveAttribute('data-state', 'inactive')
    
    // Возвращаемся на медиа
    await mediaTab.click()
    await expect(mediaTab).toHaveAttribute('data-state', 'active')
  })

  test('проверяем что нет избыточных ререндеров', async ({ page }) => {
    // Мониторим консольные логи
    const consoleLogs: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text())
      }
    })

    await page.goto('http://localhost:3000')
    await page.waitForSelector('[data-testid="media-tab"]', { timeout: 10000 })
    
    // Очищаем логи после начальной загрузки
    consoleLogs.length = 0
    
    // Переключаемся между вкладками
    await page.locator('[data-testid="music-tab"]').click()
    await page.waitForTimeout(100)
    
    await page.locator('[data-testid="effects-tab"]').click()
    await page.waitForTimeout(100)
    
    await page.locator('[data-testid="media-tab"]').click()
    await page.waitForTimeout(100)
    
    // Проверяем что нет избыточных логов рендеринга
    const renderLogs = consoleLogs.filter(log => 
      log.includes('rendered') || 
      log.includes('BrowserTabs') || 
      log.includes('BrowserContent')
    )
    
    console.log('Console logs during tab switching:', renderLogs)
    
    // Логи рендеринга должны быть минимальными
    expect(renderLogs.length).toBeLessThan(10)
  })
})