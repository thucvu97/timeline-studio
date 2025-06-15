import { test } from "@playwright/test"
import { selectors } from "./selectors"
import path from "path"

test.describe("Загрузка проекта с медиафайлами", () => {
  test("создаем и загружаем тестовый проект", async ({ page }) => {
    // Базовый путь к тестовым данным
    const testDataPath = path.join(process.cwd(), "test-data")
    
    // Подготавливаем проект с медиафайлами
    const testProject = {
      settings: {
        aspectRatio: { label: "16:9", value: { width: 16, height: 9 } },
        resolution: { label: "1080p", value: { width: 1920, height: 1080 } },
        fps: { label: "30 fps", value: 30 },
        backgroundColor: "#000000",
        duration: 600,
        enableAudioNormalization: true,
        audioNormalizationTarget: -14,
        enableMotionBlur: false,
        motionBlurSamples: 3,
        exportQuality: "high"
      },
      mediaLibrary: {
        mediaFiles: [
          {
            id: "media-001",
            originalPath: path.join(testDataPath, "C0666.MP4"),
            name: "C0666.MP4",
            size: 268715286,
            lastModified: Date.now() - 86400000, // 1 день назад
            isVideo: true,
            isAudio: false,
            isImage: false,
            metadata: {
              duration: 8.16,
              startTime: 0,
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
                  },
                  {
                    codec_type: "audio",
                    codec_name: "pcm_s16be",
                    sample_rate: "48000",
                    channels: 2
                  }
                ]
              }
            },
            status: "available",
            lastChecked: Date.now()
          },
          {
            id: "media-002",
            originalPath: path.join(testDataPath, "Kate.mp4"),
            name: "Kate.mp4",
            size: 74604623,
            lastModified: Date.now() - 86400000,
            isVideo: true,
            isAudio: false,
            isImage: false,
            metadata: {
              duration: 7.679,
              startTime: 0
            },
            status: "available",
            lastChecked: Date.now()
          },
          {
            id: "media-003",
            originalPath: path.join(testDataPath, "DSC07845.png"),
            name: "DSC07845.png",
            size: 6020511,
            lastModified: Date.now() - 86400000,
            isVideo: false,
            isAudio: false,
            isImage: true,
            metadata: {},
            status: "available",
            lastChecked: Date.now()
          }
        ],
        musicFiles: [
          {
            id: "audio-001",
            originalPath: path.join(testDataPath, "DJI_02_20250402_104352.WAV"),
            name: "DJI_02_20250402_104352.WAV",
            size: 268448300,
            lastModified: Date.now() - 86400000,
            isVideo: false,
            isAudio: true,
            isImage: false,
            metadata: {
              duration: 1864.224,
              startTime: 0,
              title: "DJI Recording",
              artist: "Unknown",
              album: "Field Recording"
            },
            status: "available",
            lastChecked: Date.now()
          }
        ],
        lastUpdated: Date.now(),
        version: "1.0.0"
      },
      browserState: {
        media: {
          searchQuery: "",
          showFavoritesOnly: false,
          viewMode: "list",
          sortBy: "name",
          filterType: "all",
          groupBy: "none",
          sortOrder: "asc",
          previewSizeIndex: 2
        },
        music: {
          searchQuery: "",
          showFavoritesOnly: false,
          viewMode: "list",
          sortBy: "name",
          filterType: "all",
          groupBy: "none",
          sortOrder: "asc",
          previewSizeIndex: 2
        }
      },
      projectFavorites: {
        media: [],
        music: [],
        effects: [],
        filters: [],
        transitions: [],
        templates: [],
        styleTemplates: [],
        subtitles: []
      },
      meta: {
        version: "1.0.0",
        createdAt: Date.now() - 86400000,
        lastModified: Date.now(),
        originalPlatform: process.platform
      },
      timeline: {
        duration: 600,
        currentTime: 0,
        tracks: [
          {
            id: "track-v1",
            type: "video",
            name: "Video 1",
            height: 100,
            order: 0,
            isLocked: false,
            isHidden: false,
            isMuted: false,
            clips: []
          },
          {
            id: "track-a1",
            type: "audio",
            name: "Audio 1",
            height: 60,
            order: 1,
            isLocked: false,
            isHidden: false,
            isMuted: false,
            clips: []
          }
        ]
      }
    };
    
    // Создаем функцию для загрузки проекта
    await page.addInitScript((project) => {
      (window as any).__loadTestProject = () => {
        // Сохраняем проект в localStorage как последний открытый
        localStorage.setItem('test-project-data', JSON.stringify(project));
        
        // Эмулируем событие загрузки проекта
        const event = new CustomEvent('project-loaded', { 
          detail: project,
          bubbles: true 
        });
        window.dispatchEvent(event);
        
        // Пытаемся найти и вызвать функцию загрузки проекта
        if ((window as any).loadProjectData) {
          (window as any).loadProjectData(project);
        }
        
        return true;
      };
    }, testProject);
    
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    console.log("✅ Приложение загружено");
    
    // Пытаемся загрузить проект
    const loaded = await page.evaluate(() => {
      return (window as any).__loadTestProject();
    });
    
    console.log("📦 Попытка загрузить проект:", loaded ? "успешно" : "неудачно");
    
    // Ждем немного для обновления UI
    await page.waitForTimeout(2000);
    
    // Делаем скриншот
    await page.screenshot({ 
      path: 'test-results/project-loaded-state.png',
      fullPage: true 
    });
    
    // Проверяем, появились ли медиафайлы
    const mediaItems = await page.locator(selectors.media.item).count();
    console.log(`📊 Найдено медиа элементов: ${mediaItems}`);
    
    if (mediaItems === 0) {
      // Если файлы не загрузились, пробуем альтернативный подход
      console.log("❌ Файлы не загрузились автоматически");
      console.log("💡 Пробуем альтернативные методы...");
      
      // Проверяем, есть ли кнопка открытия проекта
      const openButtons = [
        'button:has-text("Open Project")',
        'button:has-text("Открыть проект")',
        '[aria-label*="open"]',
        '[data-testid="open-project"]'
      ];
      
      for (const selector of openButtons) {
        const button = page.locator(selector);
        if (await button.count() > 0) {
          console.log(`✅ Найдена кнопка: ${selector}`);
          await button.first().click();
          break;
        }
      }
      
      // Проверяем меню File
      const fileMenu = page.locator('button:has-text("File")').or(page.locator('[aria-label="File menu"]'));
      if (await fileMenu.count() > 0) {
        console.log("✅ Найдено меню File");
        await fileMenu.first().click();
        
        const openMenuItem = page.locator('[role="menuitem"]:has-text("Open")');
        if (await openMenuItem.count() > 0) {
          console.log("✅ Найден пункт Open в меню");
        }
      }
    } else {
      console.log("✅ Медиафайлы загружены!");
      
      // Проверяем отображение конкретных файлов
      const expectedFiles = ["C0666.MP4", "Kate.mp4", "DSC07845.png"];
      for (const fileName of expectedFiles) {
        const fileVisible = await page.locator(`text=${fileName}`).isVisible();
        console.log(`${fileVisible ? '✅' : '❌'} ${fileName}`);
      }
    }
  });

  test("использование Tauri команд для загрузки проекта", async ({ page }) => {
    // Мокаем Tauri команды для загрузки проекта
    await page.addInitScript(() => {
      const originalInvoke = (window as any).__TAURI_INTERNALS__?.invoke;
      
      if (originalInvoke) {
        (window as any).__TAURI_INTERNALS__.invoke = async (cmd: string, args?: any) => {
          console.log("Tauri command:", cmd, args);
          
          if (cmd === "load_project") {
            // Возвращаем тестовый проект
            return {
              success: true,
              data: localStorage.getItem('test-project-data') 
                ? JSON.parse(localStorage.getItem('test-project-data')!)
                : null
            };
          }
          
          // Для остальных команд используем оригинальный обработчик
          return originalInvoke(cmd, args);
        };
      }
    });
    
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    // Проверяем доступные Tauri команды
    const tauriInfo = await page.evaluate(() => {
      const tauri = (window as any).__TAURI_INTERNALS__;
      return {
        available: !!tauri,
        hasInvoke: !!tauri?.invoke,
        commands: tauri ? Object.keys(tauri) : []
      };
    });
    
    console.log("Tauri info:", tauriInfo);
    
    // Переходим на вкладку Music чтобы проверить загрузку аудио
    const musicTab = page.locator('[data-testid="music-tab"]');
    if (await musicTab.count() > 0) {
      await musicTab.click();
      await page.waitForTimeout(500);
      
      // Проверяем наличие аудиофайла
      const audioVisible = await page.locator('text=DJI_02_20250402_104352.WAV').isVisible();
      console.log(`${audioVisible ? '✅' : '❌'} Аудиофайл на вкладке Music`);
    }
  });

  test("прямое обновление состояния через провайдеры", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    // Исследуем структуру провайдеров
    const providers = await page.evaluate(() => {
      // Ищем React Fiber
      const root = document.getElementById('__next') || document.querySelector('[data-reactroot]');
      if (!root) return { error: "No React root" };
      
      // Пытаемся найти fiber node
      const fiberKey = Object.keys(root).find(key => 
        key.startsWith('__reactContainer') || 
        key.startsWith('_reactRootContainer') ||
        key.includes('Fiber')
      );
      
      if (!fiberKey) return { error: "No fiber key found", keys: Object.keys(root) };
      
      const fiber = (root as any)[fiberKey];
      return {
        hasFiber: !!fiber,
        fiberType: typeof fiber,
        fiberKeys: fiber ? Object.keys(fiber).slice(0, 10) : []
      };
    });
    
    console.log("React structure:", providers);
    
    // Финальный скриншот
    await page.screenshot({ 
      path: 'test-results/providers-investigation.png',
      fullPage: true 
    });
  });
})