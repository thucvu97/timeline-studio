import { test, expect } from "@playwright/test"
import { TEST_FILES } from "./test-data"
import { selectors } from "./selectors"

test.describe("Прямое обновление состояния медиафайлов", () => {
  test("загружаем медиафайлы через состояние приложения", async ({ page }) => {
    // Добавляем функцию для обновления состояния
    await page.addInitScript(() => {
      (window as any).__updateMediaFiles = (files: any[]) => {
        // Ищем актор машины состояний
        const appSettingsActor = (window as any).__APP_SETTINGS_ACTOR__;
        if (appSettingsActor) {
          appSettingsActor.send({
            type: "UPDATE_MEDIA_FILES",
            files: files
          });
          return true;
        }
        return false;
      };
    });
    
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    
    // Переходим на вкладку Media
    await page.click(selectors.browser.mediaTabs.media)
    
    // Проверяем начальное состояние
    await expect(page.locator(selectors.browser.noFilesMessage)).toBeVisible()
    console.log("✅ Начальное состояние: нет файлов")
    
    // Подготавливаем тестовые данные медиафайлов
    const testMediaFiles = [
      {
        id: "test-1",
        path: TEST_FILES.videos[0].path,
        name: TEST_FILES.videos[0].name,
        isVideo: true,
        isAudio: false,
        isImage: false,
        extension: "mp4",
        size: 268715286,
        sizeFormatted: "256.3 MB",
        duration: 8.16,
        durationFormatted: "00:08",
        isLoadingMetadata: false,
        probeData: {
          format: {
            duration: "8.16",
            size: 268715286,
            bit_rate: 263446358,
            format_name: "mov,mp4,m4a,3gp,3g2,mj2"
          },
          streams: [
            {
              codec_type: "video",
              codec_name: "hevc",
              width: 3840,
              height: 2160,
              r_frame_rate: "50/1"
            }
          ]
        }
      },
      {
        id: "test-2",
        path: TEST_FILES.images[0].path,
        name: TEST_FILES.images[0].name,
        isVideo: false,
        isAudio: false,
        isImage: true,
        extension: "png",
        size: 6020511,
        sizeFormatted: "5.7 MB",
        isLoadingMetadata: false,
        probeData: {
          format: {
            format_name: "png_pipe",
            size: 6020511
          },
          streams: [
            {
              codec_type: "video",
              codec_name: "png",
              width: 4240,
              height: 2832
            }
          ]
        }
      },
      {
        id: "test-3",
        path: TEST_FILES.audio[0].path,
        name: TEST_FILES.audio[0].name,
        isVideo: false,
        isAudio: true,
        isImage: false,
        extension: "wav",
        size: 268448300,
        sizeFormatted: "256.0 MB",
        duration: 1864.224,
        durationFormatted: "31:04",
        isLoadingMetadata: false,
        probeData: {
          format: {
            duration: "1864.224",
            size: 268448300,
            bit_rate: 1152000,
            format_name: "wav"
          },
          streams: [
            {
              codec_type: "audio",
              codec_name: "pcm_s24le",
              sample_rate: "48000",
              channels: 1
            }
          ]
        }
      }
    ];
    
    // Пытаемся обновить состояние
    const updated = await page.evaluate((files) => {
      // Сначала пытаемся найти актор
      let actor = (window as any).__APP_SETTINGS_ACTOR__;
      
      // Если нет, пробуем найти через React DevTools
      if (!actor && (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        // Это более сложный путь, нужно найти компонент провайдера
        console.log("Trying to find actor through React DevTools...");
      }
      
      // Пробуем найти через контекст
      if (!actor) {
        // Ищем в window все возможные места хранения
        const possibleKeys = Object.keys(window).filter(key => 
          key.includes('actor') || 
          key.includes('machine') || 
          key.includes('state') ||
          key.includes('xstate')
        );
        console.log("Possible state keys:", possibleKeys);
      }
      
      if (actor) {
        actor.send({
          type: "UPDATE_MEDIA_FILES",
          files: files
        });
        return { success: true, message: "State updated" };
      }
      
      return { success: false, message: "Actor not found" };
    }, testMediaFiles);
    
    console.log("Update result:", updated);
    
    if (!updated.success) {
      // Альтернативный подход - эмулируем загрузку через событие
      await page.evaluate((files) => {
        // Создаем кастомное событие
        const event = new CustomEvent('media-files-loaded', { 
          detail: { files },
          bubbles: true 
        });
        document.dispatchEvent(event);
      }, testMediaFiles);
      
      console.log("Sent custom event instead");
    }
    
    // Ждем обновления UI
    await page.waitForTimeout(1000);
    
    // Делаем скриншот результата
    await page.screenshot({ 
      path: 'test-results/direct-state-update.png',
      fullPage: true 
    });
    
    // Проверяем, появились ли медиафайлы
    const mediaItems = await page.locator(selectors.media.item).count();
    console.log(`Найдено медиа элементов: ${mediaItems}`);
    
    if (mediaItems > 0) {
      console.log("✅ Медиафайлы успешно загружены!");
      
      // Проверяем отображение файлов
      for (const file of testMediaFiles) {
        const fileVisible = await page.locator(`text=${file.name}`).isVisible();
        console.log(`${fileVisible ? '✅' : '❌'} ${file.name}`);
      }
    } else {
      console.log("❌ Медиафайлы не отображаются");
      
      // Проверяем консоль на ошибки
      const logs = await page.evaluate(() => {
        return (window as any).__consoleLogs || [];
      });
      
      if (logs.length > 0) {
        console.log("Console logs:", logs);
      }
    }
  });

  test("проверяем доступ к провайдеру состояния", async ({ page }) => {
    // Мониторим консоль
    page.on('console', msg => {
      console.log(`Browser: ${msg.type()}: ${msg.text()}`);
    });
    
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    
    // Исследуем структуру приложения
    const appState = await page.evaluate(() => {
      const result: any = {
        hasReactDevTools: !!(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__,
        windowKeys: Object.keys(window).filter(k => 
          k.includes('APP') || 
          k.includes('STATE') || 
          k.includes('STORE') ||
          k.includes('SETTINGS')
        ),
        localStorage: Object.keys(localStorage),
        hasXState: !!(window as any).xstate,
      };
      
      // Проверяем React Fiber
      if (result.hasReactDevTools) {
        try {
          const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
          const renderers = hook.renderers;
          result.reactVersion = renderers && renderers.size > 0 ? "Found" : "Not found";
        } catch (e) {
          result.reactVersion = "Error accessing";
        }
      }
      
      return result;
    });
    
    console.log("App state investigation:", JSON.stringify(appState, null, 2));
    
    // Попробуем найти провайдер через DOM
    const hasProvider = await page.evaluate(() => {
      // Ищем в React компонентах
      const root = document.getElementById('root') || document.querySelector('[data-reactroot]');
      if (!root) return { found: false, message: "No React root found" };
      
      // Проверяем _reactRootContainer
      const reactRoot = (root as any)._reactRootContainer;
      if (reactRoot) {
        return { found: true, message: "Found React root container" };
      }
      
      return { found: false, message: "React root exists but no container" };
    });
    
    console.log("Provider search:", hasProvider);
  });
})