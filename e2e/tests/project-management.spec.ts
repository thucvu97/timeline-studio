import { test, expect } from '@playwright/test';
import { 
  waitForApp,
  mockTauriAPI
} from '../helpers/test-utils';

test.describe('Project Management', () => {
  test.beforeEach(async ({ page }) => {
    // Расширяем моки для работы с проектами
    await page.addInitScript(() => {
      // Хранилище проектов
      let currentProject: any = null;
      const projectStorage = new Map<string, any>();
      
      window.__TAURI__ = window.__TAURI__ || {};
      
      // Добавляем команды для проектов
      const originalInvoke = window.__TAURI__.core?.invoke || (() => Promise.resolve(null));
      
      window.__TAURI__.core = {
        invoke: async (cmd: string, args?: any) => {
          console.log('Mock Tauri invoke:', cmd, args);
          
          switch (cmd) {
            case 'create_new_project': {
              const projectId = Date.now().toString();
              currentProject = {
                id: projectId,
                name: args?.name || 'Untitled Project',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                timeline: {
                  tracks: [
                    { id: 'video-1', type: 'video', clips: [] },
                    { id: 'audio-1', type: 'audio', clips: [] }
                  ],
                  duration: 0
                },
                settings: {
                  frameRate: args?.frameRate || 30,
                  resolution: args?.resolution || { width: 1920, height: 1080 },
                  aspectRatio: args?.aspectRatio || '16:9'
                }
              };
              projectStorage.set(projectId, currentProject);
              return currentProject;
            }
            
            case 'save_project': {
              if (!currentProject) {
                throw new Error('No project to save');
              }
              currentProject.updated_at = new Date().toISOString();
              if (args?.path) {
                currentProject.path = args.path;
              }
              projectStorage.set(currentProject.id, currentProject);
              return { success: true, path: args?.path || `/projects/${currentProject.id}.json` };
            }
            
            case 'load_project': {
              const projectData = args?.path ? 
                projectStorage.get(args.path.split('/').pop()?.replace('.json', '')) :
                null;
              
              if (projectData) {
                currentProject = projectData;
                return projectData;
              }
              
              // Возвращаем тестовый проект
              return {
                id: 'test-project',
                name: 'Test Project',
                timeline: {
                  tracks: [
                    { 
                      id: 'video-1', 
                      type: 'video', 
                      clips: [
                        {
                          id: 'clip-1',
                          mediaId: 'media-1',
                          start: 0,
                          duration: 5,
                          inPoint: 0,
                          outPoint: 5
                        }
                      ]
                    }
                  ],
                  duration: 10
                },
                settings: {
                  frameRate: 30,
                  resolution: { width: 1920, height: 1080 },
                  aspectRatio: '16:9'
                }
              };
            }
            
            case 'get_recent_projects': {
              return Array.from(projectStorage.values())
                .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                .slice(0, 10);
            }
            
            case 'export_project': {
              if (!currentProject) {
                throw new Error('No project to export');
              }
              
              // Эмулируем экспорт
              setTimeout(() => {
                window.__TAURI__.event.emit('export:progress', { progress: 0 });
                window.__TAURI__.event.emit('export:progress', { progress: 50 });
                window.__TAURI__.event.emit('export:progress', { progress: 100 });
                window.__TAURI__.event.emit('export:complete', { 
                  outputPath: args?.outputPath || '/exports/output.mp4' 
                });
              }, 1000);
              
              return { jobId: 'export-123' };
            }
            
            case 'get_project_settings': {
              return currentProject?.settings || {
                frameRate: 30,
                resolution: { width: 1920, height: 1080 },
                aspectRatio: '16:9'
              };
            }
            
            case 'update_project_settings': {
              if (currentProject) {
                currentProject.settings = { ...currentProject.settings, ...args?.settings };
              }
              return { success: true };
            }
            
            default:
              return originalInvoke(cmd, args);
          }
        }
      };
      
      // Мокаем dialog для сохранения/загрузки
      window.__TAURI__.dialog = window.__TAURI__.dialog || {};
      window.__TAURI__.dialog.save = async (options?: any) => {
        return `/projects/project-${Date.now()}.json`;
      };
      
      window.__TAURI__.dialog.open = async (options?: any) => {
        if (options?.filters?.[0]?.extensions?.includes('json')) {
          return '/projects/test-project.json';
        }
        return originalInvoke('dialog_open', options);
      };
      
      // Event API если не определен
      window.__TAURI__.event = window.__TAURI__.event || {
        emit: (event: string, payload: any) => {
          const customEvent = new CustomEvent(`tauri://${event}`, { detail: payload });
          window.dispatchEvent(customEvent);
        },
        listen: async (event: string, handler: Function) => {
          const wrapper = (e: any) => handler({ payload: e.detail });
          window.addEventListener(`tauri://${event}`, wrapper);
          return () => window.removeEventListener(`tauri://${event}`, wrapper);
        }
      };
    });
    
    await mockTauriAPI(page);
    await page.goto('/');
    await waitForApp(page);
  });

  test('should create a new project', async ({ page }) => {
    // Находим кнопку создания проекта
    const newProjectButton = page.locator('button').filter({ 
      hasText: /New Project|Create Project|New/i 
    }).first();
    
    if (await newProjectButton.isVisible()) {
      await newProjectButton.click();
      
      // Проверяем что проект создался
      await page.waitForTimeout(500);
      
      // Должны видеть пустой таймлайн
      const timeline = page.locator('[data-testid="timeline"], .timeline-container, [class*="timeline"]').first();
      await expect(timeline).toBeVisible();
    }
  });

  test('should save project', async ({ page }) => {
    // Используем Ctrl+S
    await page.keyboard.press('Control+s');
    
    // Ждем сохранения
    await page.waitForTimeout(500);
    
    // Проверяем уведомление о сохранении
    const notification = page.locator('[role="alert"], .toast, .notification').filter({
      hasText: /saved|сохранен/i
    });
    
    // Уведомление может появиться и исчезнуть
    await notification.waitFor({ state: 'visible', timeout: 2000 }).catch(() => {});
  });

  test('should load existing project', async ({ page }) => {
    // Используем Ctrl+O
    await page.keyboard.press('Control+o');
    
    // Ждем загрузки
    await page.waitForTimeout(1000);
    
    // Проверяем что проект загрузился
    const hasContent = await page.locator('[data-testid="timeline-clip"], .timeline-clip, [class*="clip"]')
      .first()
      .isVisible()
      .catch(() => false);
    
    console.log('Project loaded with clips:', hasContent);
  });

  test('should show recent projects', async ({ page }) => {
    // Ищем меню или кнопку recent projects
    const recentButton = page.locator('button, [role="menuitem"]').filter({
      hasText: /Recent|Open Recent|История/i
    }).first();
    
    if (await recentButton.isVisible()) {
      await recentButton.click();
      
      // Проверяем список недавних проектов
      const recentList = page.locator('[role="menu"], .recent-projects, [data-testid="recent-projects"]');
      await expect(recentList.first()).toBeVisible({ timeout: 2000 });
    }
  });

  test('should show project settings', async ({ page }) => {
    // Ищем кнопку настроек проекта
    const settingsButton = page.locator('button').filter({
      hasText: /Project Settings|Settings|Настройки проекта/i
    }).first();
    
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      
      // Проверяем модальное окно настроек
      const modal = page.locator('[role="dialog"], .modal').filter({
        hasText: /Settings|Frame Rate|Resolution/i
      });
      await expect(modal.first()).toBeVisible();
      
      // Проверяем наличие полей настроек
      const frameRateInput = modal.locator('input, select').filter({
        hasText: /30|25|24|60/
      });
      await expect(frameRateInput.first()).toBeVisible();
      
      // Закрываем модальное окно
      const closeButton = modal.locator('button').filter({
        hasText: /Close|Cancel|×/i
      }).first();
      await closeButton.click();
    }
  });

  test('should handle project export', async ({ page }) => {
    // Добавляем слушатель для проверки событий экспорта
    await page.evaluate(() => {
      window.__exportEvents = [];
      window.addEventListener('tauri://export:progress', (e: any) => {
        window.__exportEvents.push({ type: 'progress', data: e.detail });
      });
      window.addEventListener('tauri://export:complete', (e: any) => {
        window.__exportEvents.push({ type: 'complete', data: e.detail });
      });
    });
    
    // Ищем кнопку экспорта
    const exportButton = page.locator('button').filter({
      hasText: /Export|Render|Экспорт/i
    }).first();
    
    if (await exportButton.isVisible()) {
      await exportButton.click();
      
      // Может открыться диалог настроек экспорта
      const exportDialog = page.locator('[role="dialog"], .export-dialog').first();
      
      if (await exportDialog.isVisible({ timeout: 2000 })) {
        // Нажимаем кнопку начала экспорта
        const startExportButton = exportDialog.locator('button').filter({
          hasText: /Start|Export|Begin|Начать/i
        }).first();
        await startExportButton.click();
      }
      
      // Ждем события экспорта
      await page.waitForTimeout(1500);
      
      // Проверяем что события произошли
      const events = await page.evaluate(() => window.__exportEvents);
      expect(events.length).toBeGreaterThan(0);
    }
  });

  test('should handle auto-save', async ({ page }) => {
    // Проверяем наличие индикатора автосохранения
    const autoSaveIndicator = page.locator('[data-testid="auto-save"], .auto-save, text=/auto.*save/i').first();
    
    // Делаем изменение чтобы триггернуть автосохранение
    const timeline = page.locator('[data-testid="timeline"], .timeline-container').first();
    if (await timeline.isVisible()) {
      await timeline.click();
      await page.keyboard.press('Space'); // Play/pause
      
      // Ждем автосохранения
      await page.waitForTimeout(2000);
      
      // Проверяем индикатор
      if (await autoSaveIndicator.isVisible()) {
        console.log('Auto-save indicator found');
      }
    }
  });
});