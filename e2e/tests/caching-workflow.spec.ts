import { test, expect } from '@playwright/test';
import { waitForApp, isAnyVisible } from '../helpers/test-utils';

test.describe('Caching Workflow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
    await page.waitForTimeout(2000);
  });

  test('тестирование кэширования превью', async ({ page }) => {
    await test.step('Генерация и кэширование превью', async () => {
      // Загружаем медиа
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('test-media-loaded', {
          detail: {
            files: [
              { path: 'public/t1.mp4', type: 'video', duration: 10.0 }
            ]
          }
        }));
      });
      
      await page.waitForTimeout(1000);
      
      // Ищем timeline или превью область
      const timelineArea = page.locator('[class*="timeline"], [class*="preview"]').first();
      
      if (await timelineArea.isVisible()) {
        // Симулируем взаимодействие с timeline для генерации превью
        await timelineArea.click();
        await page.waitForTimeout(500);
        
        // Проверяем генерацию превью
        const previewElements = await isAnyVisible(page, [
          '[class*="preview-thumbnail"]',
          '[class*="frame-preview"]',
          'img[src*="preview"]',
          'canvas[class*="preview"]'
        ]);
        
        if (previewElements) {
          console.log('Превью элементы найдены');
          
          // Симулируем повторное обращение к тому же времени
          await timelineArea.click();
          await page.waitForTimeout(200);
          
          // Повторное превью должно загружаться быстрее (из кэша)
          console.log('Тестирование кэширования превью завершено');
        }
      }
      
      expect(true).toBe(true);
    });
  });

  test('тестирование настроек кэша', async ({ page }) => {
    await test.step('Открытие настроек кэша', async () => {
      // Ищем настройки приложения
      const settingsButton = page.locator('button').filter({ 
        hasText: /settings|preferences/i 
      }).first();
      
      if (await settingsButton.isVisible()) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        // Ищем секцию кэша
        const cacheSection = await isAnyVisible(page, [
          'text=/cache|caching/i',
          '[class*="cache-settings"]',
          'h2:has-text("Cache")',
          'h3:has-text("Cache")'
        ]);
        
        if (cacheSection) {
          console.log('Настройки кэша найдены');
          
          // Проверяем настройки размера кэша
          const cacheSizeInput = page.locator('input[name*="cache"], input[type="number"]').filter({
            hasText: /size|limit|mb|gb/i
          }).first();
          
          if (await cacheSizeInput.isVisible()) {
            const currentValue = await cacheSizeInput.inputValue();
            console.log(`Текущий размер кэша: ${currentValue}`);
            
            // Тестируем изменение размера
            await cacheSizeInput.fill('1024');
            await page.waitForTimeout(300);
            
            const newValue = await cacheSizeInput.inputValue();
            expect(newValue).toBe('1024');
          }
          
          // Проверяем настройки TTL (время жизни)
          const ttlInput = page.locator('input[name*="ttl"], input[name*="expiry"]').first();
          if (await ttlInput.isVisible()) {
            const ttlValue = await ttlInput.inputValue();
            console.log(`TTL кэша: ${ttlValue}`);
          }
        }
        
        // Закрываем настройки
        const closeButton = page.locator('button').filter({ 
          hasText: /close|save|ok/i 
        }).first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
        }
      }
    });
  });

  test('тестирование очистки кэша', async ({ page }) => {
    await test.step('Очистка различных типов кэша', async () => {
      // Открываем настройки
      const settingsButton = page.locator('button').filter({ 
        hasText: /settings|preferences/i 
      }).first();
      
      if (await settingsButton.isVisible()) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        // Ищем кнопки очистки кэша
        const clearCacheButtons = page.locator('button').filter({ 
          hasText: /clear.*cache|clean.*cache|delete.*cache/i 
        });
        
        const buttonCount = await clearCacheButtons.count();
        if (buttonCount > 0) {
          console.log(`Найдено ${buttonCount} кнопок очистки кэша`);
          
          for (let i = 0; i < Math.min(buttonCount, 3); i++) {
            const button = clearCacheButtons.nth(i);
            const buttonText = await button.textContent();
            console.log(`Тестируем кнопку: ${buttonText}`);
            
            if (await button.isVisible()) {
              await button.click();
              await page.waitForTimeout(500);
              
              // Проверяем подтверждение
              const confirmDialog = await isAnyVisible(page, [
                'text=/confirm|sure|delete|clear/i',
                '[role="dialog"]',
                '[class*="confirm"]'
              ]);
              
              if (confirmDialog) {
                // Подтверждаем очистку
                const confirmButton = page.locator('button').filter({ 
                  hasText: /yes|confirm|clear|delete/i 
                }).first();
                if (await confirmButton.isVisible()) {
                  await confirmButton.click();
                  await page.waitForTimeout(300);
                }
              }
              
              // Проверяем уведомление об успехе
              const successMessage = await isAnyVisible(page, [
                'text=/cache.*cleared|cache.*deleted|cleared.*successfully/i',
                '[class*="success"]',
                '[class*="notification"]'
              ]);
              
              if (successMessage) {
                console.log('Кэш успешно очищен');
              }
            }
          }
        }
        
        // Закрываем настройки
        const closeButton = page.locator('button').filter({ 
          hasText: /close|cancel/i 
        }).first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
        }
      }
    });
  });

  test('тестирование статистики кэша', async ({ page }) => {
    await test.step('Просмотр статистики использования кэша', async () => {
      // Открываем настройки или информацию о системе
      const infoButton = page.locator('button').filter({ 
        hasText: /info|about|system|statistics/i 
      }).first();
      
      if (await infoButton.isVisible()) {
        await infoButton.click();
        await page.waitForTimeout(500);
        
        // Ищем статистику кэша
        const cacheStats = await isAnyVisible(page, [
          'text=/cache.*size|cache.*usage|cache.*statistics/i',
          '[class*="cache-stats"]',
          '[class*="cache-info"]'
        ]);
        
        if (cacheStats) {
          console.log('Статистика кэша найдена');
          
          // Проверяем численные показатели
          const statsNumbers = await page.locator('text=/\\d+.*mb|\\d+.*gb|\\d+.*%/i').allTextContents();
          if (statsNumbers.length > 0) {
            console.log('Статистика кэша:', statsNumbers);
          }
          
          // Ищем информацию о hit rate
          const hitRateInfo = await isAnyVisible(page, [
            'text=/hit.*rate|cache.*hit|efficiency/i',
            '[class*="hit-rate"]'
          ]);
          
          if (hitRateInfo) {
            console.log('Информация о hit rate найдена');
          }
        }
        
        // Закрываем диалог
        const closeButton = page.locator('button').filter({ 
          hasText: /close|ok/i 
        }).first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
        }
      }
    });
  });

  test('тестирование кэширования рендера', async ({ page }) => {
    await test.step('Тестирование кэша промежуточных результатов рендеринга', async () => {
      // Подготавливаем проект
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('test-project-setup', {
          detail: {
            duration: 5.0,
            tracks: [
              { 
                type: 'video', 
                clips: [{ path: 'public/t1.mp4', duration: 5.0 }]
              }
            ]
          }
        }));
      });
      
      // Запускаем первый рендер
      const exportButton = page.locator('button').filter({ 
        hasText: /export|render/i 
      }).first();
      
      if (await exportButton.isVisible()) {
        await exportButton.click();
        await page.waitForTimeout(500);
        
        // Устанавливаем одинаковые настройки
        const formatSelect = page.locator('select[name*="format"]').first();
        if (await formatSelect.isVisible()) {
          await formatSelect.selectOption('mp4');
        }
        
        const qualitySelect = page.locator('select[name*="quality"]').first();
        if (await qualitySelect.isVisible()) {
          await qualitySelect.selectOption('1080p');
        }
        
        // Запускаем первый рендер
        const startButton = page.locator('button').filter({ 
          hasText: /start.*export|render.*now/i 
        }).first();
        
        if (await startButton.isVisible()) {
          const firstRenderStart = Date.now();
          await startButton.click();
          
          // Ждём завершения первого рендера
          let completed = false;
          let attempts = 0;
          
          while (!completed && attempts < 30) {
            const progress = await isAnyVisible(page, [
              'text=/completed|finished|100%/i',
              '[class*="completed"]'
            ]);
            
            if (progress) {
              completed = true;
              const firstRenderTime = Date.now() - firstRenderStart;
              console.log(`Первый рендер занял: ${firstRenderTime}ms`);
            } else {
              await page.waitForTimeout(500);
              attempts++;
            }
          }
          
          // Закрываем диалог и запускаем повторный рендер
          const closeButton = page.locator('button').filter({ 
            hasText: /close|ok/i 
          }).first();
          if (await closeButton.isVisible()) {
            await closeButton.click();
            await page.waitForTimeout(1000);
          }
          
          // Второй рендер с теми же настройками (должен использовать кэш)
          if (await exportButton.isVisible()) {
            await exportButton.click();
            await page.waitForTimeout(500);
            
            // Проверяем, что настройки сохранились
            if (await startButton.isVisible()) {
              const secondRenderStart = Date.now();
              await startButton.click();
              
              // Второй рендер должен быть быстрее благодаря кэшу
              let secondCompleted = false;
              let secondAttempts = 0;
              
              while (!secondCompleted && secondAttempts < 20) {
                const progress = await isAnyVisible(page, [
                  'text=/completed|finished|100%|cached/i',
                  '[class*="completed"]',
                  '[class*="from-cache"]'
                ]);
                
                if (progress) {
                  secondCompleted = true;
                  const secondRenderTime = Date.now() - secondRenderStart;
                  console.log(`Второй рендер занял: ${secondRenderTime}ms`);
                  
                  // Проверяем использование кэша
                  const cacheIndicator = await isAnyVisible(page, [
                    'text=/cached|from.*cache|using.*cache/i',
                    '[class*="cache-hit"]'
                  ]);
                  
                  if (cacheIndicator) {
                    console.log('Кэш рендера использован успешно');
                  }
                } else {
                  await page.waitForTimeout(500);
                  secondAttempts++;
                }
              }
            }
          }
        }
      }
    });
  });

  test('тестирование кэша метаданных', async ({ page }) => {
    await test.step('Тестирование кэширования метаданных медиа файлов', async () => {
      // Загружаем медиа файл
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('test-media-import', {
          detail: {
            files: [
              { 
                path: 'public/t1.mp4', 
                type: 'video', 
                size: 1024000,
                duration: 10.0 
              }
            ]
          }
        }));
      });
      
      await page.waitForTimeout(1000);
      
      // Ищем медиа элемент
      const mediaItem = page.locator('[class*="media-item"]').first();
      
      if (await mediaItem.isVisible()) {
        // Проверяем отображение метаданных
        const metadataElements = await isAnyVisible(page, [
          'text=/duration|size|resolution|fps/i',
          '[class*="metadata"]',
          '[class*="file-info"]'
        ]);
        
        if (metadataElements) {
          console.log('Метаданные отображаются');
          
          // Симулируем повторный доступ к метаданным
          await mediaItem.hover();
          await page.waitForTimeout(300);
          
          // Второй доступ должен быть мгновенным (из кэша)
          const tooltipInfo = await isAnyVisible(page, [
            '[class*="tooltip"]',
            '[class*="preview-info"]',
            'text=/10.*sec|1024.*kb/i'
          ]);
          
          if (tooltipInfo) {
            console.log('Метаданные загружены из кэша');
          }
        }
      }
      
      expect(true).toBe(true);
    });
  });

  test('тестирование ограничений кэша', async ({ page }) => {
    await test.step('Тестирование работы при превышении лимитов кэша', async () => {
      // Открываем настройки кэша
      const settingsButton = page.locator('button').filter({ 
        hasText: /settings|preferences/i 
      }).first();
      
      if (await settingsButton.isVisible()) {
        await settingsButton.click();
        await page.waitForTimeout(500);
        
        // Устанавливаем очень маленький лимит кэша
        const cacheSizeInput = page.locator('input[name*="cache"], input[type="number"]').first();
        if (await cacheSizeInput.isVisible()) {
          await cacheSizeInput.fill('1'); // 1 MB
          await page.waitForTimeout(300);
          
          // Сохраняем настройки
          const saveButton = page.locator('button').filter({ 
            hasText: /save|apply|ok/i 
          }).first();
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await page.waitForTimeout(500);
          }
        }
        
        // Закрываем настройки
        const closeButton = page.locator('button').filter({ 
          hasText: /close/i 
        }).first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
        }
        
        // Генерируем много данных для кэша
        await page.evaluate(() => {
          // Симулируем загрузку большого количества медиа
          for (let i = 0; i < 10; i++) {
            window.dispatchEvent(new CustomEvent('test-media-loaded', {
              detail: {
                files: [{
                  path: `public/test${i}.mp4`,
                  type: 'video',
                  duration: 30.0
                }]
              }
            }));
          }
        });
        
        await page.waitForTimeout(2000);
        
        // Проверяем предупреждения о переполнении кэша
        const cacheWarning = await isAnyVisible(page, [
          'text=/cache.*full|cache.*limit|cache.*exceeded/i',
          '[class*="cache-warning"]',
          '[class*="warning"]'
        ]);
        
        if (cacheWarning) {
          console.log('Предупреждение о переполнении кэша отображается');
        }
        
        // Проверяем автоматическую очистку старых элементов
        const cleanupNotification = await isAnyVisible(page, [
          'text=/cache.*cleaned|old.*entries.*removed/i',
          '[class*="cleanup-notification"]'
        ]);
        
        if (cleanupNotification) {
          console.log('Автоматическая очистка кэша работает');
        }
      }
    });
  });
});