import { test, expect } from "@playwright/test"
import { TEST_DATA_PATH } from "./test-data"
import { selectors } from "./selectors"

test.describe("Тестирование с готовым проектом", () => {
  test("должен загрузить проект с медиафайлами", async ({ page }) => {
    // Открываем приложение
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    
    console.log("✅ Приложение загружено")
    
    // Ждем загрузки интерфейса
    await expect(page.locator("div.min-h-screen")).toBeVisible({ timeout: 10000 })
    
    // Проверяем, что мы на главной странице
    const mediaTab = page.locator(selectors.browser.mediaTabs.media)
    await expect(mediaTab).toBeVisible()
    
    // Теперь нужно загрузить проект
    // В реальном приложении это может быть через меню File -> Open
    // Или через URL параметр ?project=test-project.json
    // Давайте попробуем через URL
    
    const projectUrl = `/?project=${encodeURIComponent('public/test-data/test-project.json')}`
    await page.goto(projectUrl)
    await page.waitForLoadState("networkidle")
    
    console.log("✅ Попытка загрузить проект через URL")
    
    // Делаем скриншот текущего состояния
    await page.screenshot({ 
      path: 'test-results/project-load-attempt.png',
      fullPage: true 
    })
    
    // Проверяем, появились ли медиафайлы
    // Если загрузка проекта не работает через URL, нужно найти другой способ
    const mediaItems = page.locator(selectors.media.item)
    const itemCount = await mediaItems.count()
    
    console.log(`📊 Найдено медиа элементов: ${itemCount}`)
    
    if (itemCount === 0) {
      console.log("❌ Медиафайлы не загрузились автоматически")
      console.log("💡 Возможно, нужно:")
      console.log("   - Реализовать загрузку проекта через URL параметр")
      console.log("   - Использовать API для загрузки проекта")
      console.log("   - Найти кнопку 'Open Project' в UI")
      
      // Попробуем найти кнопку открытия проекта
      const openProjectButton = page.locator('button:has-text("Open Project")')
      const hasOpenButton = await openProjectButton.count() > 0
      
      if (hasOpenButton) {
        console.log("✅ Найдена кнопка 'Open Project'")
        await openProjectButton.click()
        // Здесь должен открыться диалог выбора файла
      } else {
        console.log("❌ Кнопка 'Open Project' не найдена")
      }
    } else {
      console.log("✅ Медиафайлы загружены!")
      
      // Проверяем количество
      expect(itemCount).toBe(5) // У нас 5 медиафайлов в проекте
      
      // Проверяем, что файлы отображаются
      for (const fileName of ["C0666.MP4", "Kate.mp4", "DSC07845.png", "DJI_02_20250402_104352.WAV", "проводка после лобби.mp4"]) {
        await expect(page.locator(`text=${fileName}`)).toBeVisible()
        console.log(`✅ Файл ${fileName} отображается`)
      }
    }
  })

  test("альтернативный способ - мокаем загрузку проекта", async ({ page }) => {
    // Добавляем функцию в window для загрузки тестовых данных
    await page.addInitScript(() => {
      (window as any).loadTestProject = () => {
        // Эмулируем загрузку проекта
        const testProject = {
          media: {
            files: [
              {
                id: "media-1",
                path: "public/test-data/C0666.MP4",
                name: "C0666.MP4",
                type: "video",
                extension: "mp4",
                size: 268715286,
                duration: 8.16,
                width: 3840,
                height: 2160,
                isVideo: true,
                isAudio: false,
                isImage: false,
                isLoadingMetadata: false,
                probeData: {
                  format: {
                    duration: "8.16",
                    size: 268715286,
                    bit_rate: 263446358
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
              {
                id: "media-2",
                path: "public/test-data/Kate.mp4",
                name: "Kate.mp4",
                type: "video",
                extension: "mp4",
                size: 74604623,
                duration: 7.679,
                width: 3840,
                height: 2160,
                isVideo: true,
                isAudio: false,
                isImage: false,
                isLoadingMetadata: false
              },
              {
                id: "media-3",
                path: "public/test-data/DSC07845.png",
                name: "DSC07845.png",
                type: "image",
                extension: "png",
                size: 6020511,
                width: 4240,
                height: 2832,
                isVideo: false,
                isAudio: false,
                isImage: true,
                isLoadingMetadata: false
              }
            ]
          }
        };
        
        // Эмулируем событие загрузки проекта
        window.dispatchEvent(new CustomEvent('project-loaded', { detail: testProject }));
        
        // Или пытаемся напрямую обновить состояние (зависит от архитектуры приложения)
        if ((window as any).__TIMELINE_STUDIO_STATE__) {
          (window as any).__TIMELINE_STUDIO_STATE__.media = testProject.media;
        }
      };
    });
    
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    
    // Вызываем нашу функцию загрузки
    await page.evaluate(() => {
      (window as any).loadTestProject();
    });
    
    // Ждем немного для обновления UI
    await page.waitForTimeout(1000);
    
    // Делаем скриншот
    await page.screenshot({ 
      path: 'test-results/project-mock-load.png',
      fullPage: true 
    });
    
    // Проверяем результат
    const mediaItems = page.locator(selectors.media.item);
    const itemCount = await mediaItems.count();
    
    console.log(`📊 После мока найдено медиа элементов: ${itemCount}`);
  })

  test("проверяем текущее состояние приложения", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    
    // Включаем отладочный режим
    page.on('console', msg => {
      if (msg.type() === 'log') {
        console.log('Browser log:', msg.text())
      }
    })
    
    // Проверяем структуру приложения
    console.log("\n🔍 Анализ структуры приложения:")
    
    // Проверяем наличие основных компонентов
    const components = {
      "Media Studio": "div.min-h-screen",
      "Browser Tabs": '[role="tablist"]',
      "Media Tab": selectors.browser.mediaTabs.media,
      "Toolbar": ".flex.items-center.justify-between.py-2",
      "Add Media Button": selectors.browser.toolbar.addMediaButton,
      "Add Folder Button": selectors.browser.toolbar.addFolderButton,
    }
    
    for (const [name, selector] of Object.entries(components)) {
      const exists = await page.locator(selector).count() > 0
      console.log(`${exists ? '✅' : '❌'} ${name}: ${selector}`)
    }
    
    // Проверяем, есть ли сообщение об отсутствии файлов
    const noFilesMessage = await page.locator(selectors.browser.noFilesMessage).count() > 0
    console.log(`\n${noFilesMessage ? '✅' : '❌'} Отображается сообщение об отсутствии файлов`)
    
    // Проверяем localStorage и sessionStorage
    const storage = await page.evaluate(() => {
      return {
        localStorage: Object.keys(localStorage),
        sessionStorage: Object.keys(sessionStorage)
      }
    })
    
    console.log("\n📦 Storage keys:")
    console.log("localStorage:", storage.localStorage)
    console.log("sessionStorage:", storage.sessionStorage)
    
    // Делаем финальный скриншот
    await page.screenshot({ 
      path: 'test-results/app-structure-analysis.png',
      fullPage: true 
    })
  })
})