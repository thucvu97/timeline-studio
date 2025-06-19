import { test as base, Page } from '@playwright/test';

type TestFixtures = {
  autoGoto: void;
  mockTauriAPI: void;
};

// Расширяем базовый тест с полезными фикстурами
export const test = base.extend<TestFixtures>({
  // Автоматическая навигация на главную страницу
  autoGoto: [async ({ page }, use) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await use();
  }, { auto: true }],
  
  // Моки для Tauri API если приложение запущено в браузере
  mockTauriAPI: async ({ page }, use) => {
    await page.addInitScript(() => {
      if (!window.__TAURI__) {
        window.__TAURI__ = {
          core: {
            invoke: async (cmd: string, args?: any) => {
              console.log('Mock Tauri invoke:', cmd, args);
              // Базовые моки для команд
              switch (cmd) {
                case 'get_app_info':
                  return { version: '0.19.0', name: 'Timeline Studio' };
                case 'get_media_files':
                  return [];
                case 'get_project_settings':
                  return { 
                    frameRate: 30,
                    resolution: { width: 1920, height: 1080 },
                    aspectRatio: '16:9'
                  };
                default:
                  return null;
              }
            }
          },
          path: {
            homeDir: async () => '/home/user',
            appDataDir: async () => '/home/user/.timeline-studio'
          },
          fs: {
            readTextFile: async () => '{}',
            writeTextFile: async () => {},
            exists: async () => true
          },
          dialog: {
            open: async () => null,
            save: async () => null
          },
          notification: {
            sendNotification: async () => {}
          }
        };
      }
    });
    await use();
  }
});

export { expect } from '@playwright/test';