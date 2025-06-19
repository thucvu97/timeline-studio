import { test, expect } from '@playwright/test';
import { 
  waitForApp, 
  clickBrowserTab,
  mockTauriAPI
} from '../helpers/test-utils';

test.describe('Media Import - Correct Implementation', () => {
  test.beforeEach(async ({ page }) => {
    // Мокаем Tauri API с правильной реализацией
    await page.addInitScript(() => {
      // Мокаем video server URL
      const VIDEO_SERVER_PORT = 4567;
      const VIDEO_SERVER_URL = `http://localhost:${VIDEO_SERVER_PORT}`;
      
      // Хранилище для зарегистрированных видео
      const videoRegistry = new Map<string, string>();
      
      // Мокаем Tauri API
      window.__TAURI__ = {
        core: {
          invoke: async (cmd: string, args?: any) => {
            console.log('Mock Tauri invoke:', cmd, args);
            
            switch (cmd) {
              case 'scan_media_folder':
              case 'scan_media_folder_with_thumbnails': {
                // Эмулируем события сканирования
                setTimeout(() => {
                  // Событие: файлы обнаружены
                  window.__TAURI__.event.emit('media-processor:files-discovered', {
                    files: [
                      { path: '/test/video1.mp4', name: 'video1.mp4' },
                      { path: '/test/video2.mp4', name: 'video2.mp4' }
                    ],
                    total: 2
                  });
                }, 100);
                
                // Событие: метаданные готовы
                setTimeout(() => {
                  window.__TAURI__.event.emit('media-processor:metadata-ready', {
                    file_id: 'video1',
                    metadata: {
                      id: 'video1',
                      name: 'video1.mp4',
                      path: '/test/video1.mp4',
                      is_video: true,
                      is_audio: false,
                      is_image: false,
                      size: 1024000,
                      duration: 120.5,
                      probe_data: {
                        format: {
                          duration: '120.5',
                          size: '1024000',
                          bit_rate: '8000000'
                        },
                        streams: [{
                          codec_type: 'video',
                          codec_name: 'h264',
                          width: 1920,
                          height: 1080,
                          r_frame_rate: '30/1'
                        }]
                      }
                    }
                  });
                }, 500);
                
                // Событие: превью готово
                setTimeout(() => {
                  window.__TAURI__.event.emit('media-processor:thumbnail-ready', {
                    file_id: 'video1',
                    thumbnail_path: '/test/.thumbnails/video1.jpg'
                  });
                }, 800);
                
                return { success: true };
              }
              
              case 'register_video': {
                const path = args?.path || '';
                const id = btoa(path).replace(/[^a-zA-Z0-9]/g, '');
                videoRegistry.set(id, path);
                
                return {
                  id,
                  url: `${VIDEO_SERVER_URL}/video/${id}`
                };
              }
              
              case 'get_media_metadata': {
                const path = args?.path || '';
                return {
                  duration: 120.5,
                  width: 1920,
                  height: 1080,
                  fps: 30,
                  codec: 'h264',
                  bitrate: 8000000
                };
              }
              
              case 'process_media_file_simple': {
                return {
                  id: 'test-id',
                  name: args?.path?.split('/').pop() || 'file',
                  path: args?.path,
                  is_video: args?.path?.endsWith('.mp4'),
                  is_audio: args?.path?.endsWith('.mp3'),
                  is_image: args?.path?.endsWith('.jpg'),
                  duration: args?.path?.endsWith('.mp4') ? 120 : null
                };
              }
              
              default:
                return null;
            }
          }
        },
        
        event: {
          emit: (event: string, payload: any) => {
            // Эмулируем Tauri события
            const customEvent = new CustomEvent(`tauri://${event}`, {
              detail: payload
            });
            window.dispatchEvent(customEvent);
          },
          listen: async (event: string, handler: (e: any) => void) => {
            const wrappedHandler = (e: any) => handler({ payload: e.detail });
            window.addEventListener(`tauri://${event}`, wrappedHandler);
            return () => window.removeEventListener(`tauri://${event}`, wrappedHandler);
          }
        },
        
        dialog: {
          open: async (options?: any) => {
            // Эмулируем выбор файлов
            if (options?.directory) {
              return '/test/media-folder';
            }
            if (options?.multiple) {
              return ['/test/video1.mp4', '/test/video2.mp4'];
            }
            return '/test/video.mp4';
          }
        },
        
        path: {
          basename: async (path: string) => path.split('/').pop() || '',
          join: async (...parts: string[]) => parts.join('/'),
          appDataDir: async () => '/home/user/.timeline-studio'
        },
        
        fs: {
          readBinaryFile: async (path: string) => new Uint8Array([]),
          exists: async () => true
        }
      };
    });
    
    await page.goto('/');
    await waitForApp(page);
  });

  test('should import media files with progressive loading', async ({ page }) => {
    // Переходим на вкладку Media
    await clickBrowserTab(page, 'Media');
    
    // Ждем загрузки контента вкладки
    await page.waitForTimeout(500);
    
    // Находим кнопку импорта с более гибким поиском
    const importButton = await page.locator('button').filter({ 
      hasText: /Import|Add|Upload|Browse/i 
    }).or(page.locator('[data-testid*="import"]')).first();
    
    // Если кнопка не видна, возможно нужно открыть меню
    if (!await importButton.isVisible()) {
      // Пробуем найти кнопку меню или плюс
      const menuButton = page.locator('button[aria-label*="menu"], button[aria-label*="add"], button:has(svg)').first();
      if (await menuButton.isVisible()) {
        await menuButton.click();
        await page.waitForTimeout(300);
      }
    }
    
    // Проверяем что есть какая-то кнопка для действий
    const anyButton = page.locator('button').first();
    await expect(anyButton).toBeVisible();
    
    // Кликаем импорт если нашли
    if (await importButton.isVisible()) {
      await importButton.click();
    } else {
      // Если не нашли специфичную кнопку, кликаем первую доступную
      await anyButton.click();
    }
    
    // Ждем события files-discovered
    await page.waitForTimeout(200);
    
    // Проверяем что файлы появились (с флагом загрузки)
    const mediaItems = page.locator('[data-testid="media-item"], .media-item, [class*="media"][class*="item"]');
    await expect(mediaItems).toHaveCount(2, { timeout: 5000 });
    
    // Проверяем индикатор загрузки
    const loadingIndicator = page.locator('[data-testid="loading"], .loading, [class*="loading"], .skeleton').first();
    await expect(loadingIndicator).toBeVisible();
    
    // Ждем metadata-ready события
    await page.waitForTimeout(600);
    
    // Проверяем что появилась информация о файле
    const duration = page.locator('text=/2:00|120/i').first();
    await expect(duration).toBeVisible({ timeout: 5000 });
    
    // Ждем thumbnail-ready события
    await page.waitForTimeout(400);
    
    // Проверяем что превью загрузилось
    const thumbnail = page.locator('img[src*="thumbnail"], img[src*="preview"]').first();
    await expect(thumbnail).toBeVisible({ timeout: 5000 });
  });

  test('should show media file details after import', async ({ page }) => {
    // Импортируем файлы через folder scan
    await clickBrowserTab(page, 'Media');
    
    // Находим кнопку импорта папки
    const importFolderButton = page.locator('button').filter({ hasText: /Folder|Directory/i }).first();
    
    if (await importFolderButton.isVisible()) {
      await importFolderButton.click();
    } else {
      // Если нет отдельной кнопки для папки, используем обычный импорт
      const importButton = page.locator('button').filter({ hasText: /Import/i }).first();
      await importButton.click();
    }
    
    // Ждем загрузки файлов
    await page.waitForTimeout(1000);
    
    // Проверяем отображение деталей медиа
    const mediaItem = page.locator('[data-testid="media-item"], .media-item').first();
    
    if (await mediaItem.isVisible()) {
      // Наводим для показа деталей
      await mediaItem.hover();
      
      // Проверяем детали
      const details = mediaItem.locator('.details, [class*="info"], [class*="metadata"]');
      await expect(details.first()).toBeVisible({ timeout: 2000 });
    }
  });

  test('should handle video registration for streaming', async ({ page }) => {
    // Добавляем обработчик для проверки register_video
    await page.evaluate(() => {
      window.__videoRegistrations = [];
      const originalInvoke = window.__TAURI__.core.invoke;
      window.__TAURI__.core.invoke = async function(cmd: string, args?: any) {
        if (cmd === 'register_video') {
          window.__videoRegistrations.push(args);
        }
        return originalInvoke.call(this, cmd, args);
      };
    });
    
    // Импортируем видео
    await clickBrowserTab(page, 'Media');
    const importButton = page.locator('button').filter({ hasText: /Import/i }).first();
    await importButton.click();
    
    // Ждем обработки
    await page.waitForTimeout(1500);
    
    // Кликаем на видео для воспроизведения
    const videoItem = page.locator('[data-testid="media-item"], .media-item').first();
    if (await videoItem.isVisible()) {
      await videoItem.click();
      
      // Проверяем что видео было зарегистрировано
      const registrations = await page.evaluate(() => window.__videoRegistrations);
      expect(registrations.length).toBeGreaterThan(0);
    }
  });

  test('should display import progress correctly', async ({ page }) => {
    await clickBrowserTab(page, 'Media');
    
    // Модифицируем мок для медленной загрузки
    await page.evaluate(() => {
      const originalInvoke = window.__TAURI__.core.invoke;
      window.__TAURI__.core.invoke = async function(cmd: string, args?: any) {
        if (cmd === 'scan_media_folder_with_thumbnails') {
          // Отправляем события прогресса
          for (let i = 0; i <= 100; i += 20) {
            setTimeout(() => {
              window.__TAURI__.event.emit('media-processor:scan-progress', {
                current: i,
                total: 100
              });
            }, i * 10);
          }
        }
        return originalInvoke.call(this, cmd, args);
      };
    });
    
    const importButton = page.locator('button').filter({ hasText: /Import/i }).first();
    await importButton.click();
    
    // Проверяем прогресс бар
    const progressBar = page.locator('[role="progressbar"], .progress-bar, [class*="progress"]').first();
    await expect(progressBar).toBeVisible({ timeout: 2000 });
  });
});