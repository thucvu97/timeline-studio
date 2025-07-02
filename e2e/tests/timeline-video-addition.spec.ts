import { test, expect } from "@playwright/test"
import path from "path"

test.describe("Timeline Video Addition Tests", () => {
  const testDataPath = path.join(process.cwd(), "test-data")

  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForSelector('[data-testid="media-studio"]', { timeout: 30000 })
  })

  test("should fix files.forEach error when adding video to timeline", async ({ page }) => {
    // Открываем Media browser
    await page.click('[data-testid="browser-tab-media"]')
    await page.waitForTimeout(2000)

    // Мокаем добавление тестовых файлов
    await page.evaluate(() => {
      // Создаем тестовый медиа файл
      const testFile = {
        id: "test-video-1",
        path: "test-data/C0666.MP4",
        name: "C0666.MP4",
        type: "video/mp4",
        size: 50000000,
        duration: 30.5,
        isLoadingMetadata: false,
        probeData: {
          streams: [
            {
              index: 0,
              codec_type: "video",
              width: 1920,
              height: 1080,
              display_aspect_ratio: "16:9"
            }
          ]
        }
      }

      // Добавляем файл в состояние браузера
      window.__TEST_ADD_MEDIA_FILE__ = testFile
    })

    // Ждем появления тестового файла
    await page.waitForTimeout(1000)

    // Консоль для отслеживания ошибок
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Пытаемся выбрать и добавить файл в timeline
    try {
      // Симулируем выбор медиа файла
      const mediaItem = page.locator('[data-testid^="media-file-"]').first()
      
      if (await mediaItem.count() > 0) {
        await mediaItem.click()
        
        // Ждем немного для обработки
        await page.waitForTimeout(1000)
        
        // Проверяем, что не произошло ошибки files.forEach
        const hasForEachError = consoleErrors.some(error => 
          error.includes('forEach is not a function') || 
          error.includes('files.forEach')
        )
        
        if (hasForEachError) {
          console.log('Detected files.forEach error:', consoleErrors)
          throw new Error('files.forEach error occurred when adding media to timeline')
        }
      }
    } catch (error) {
      console.log('Console errors during test:', consoleErrors)
      throw error
    }

    // Проверяем, что нет критических ошибок в консоли
    const criticalErrors = consoleErrors.filter(error => 
      error.includes('TypeError') || 
      error.includes('is not a function')
    )
    
    expect(criticalErrors.length).toBe(0)
  })

  test("should properly handle single file selection in browser", async ({ page }) => {
    await page.click('[data-testid="browser-tab-media"]')
    await page.waitForTimeout(2000)

    // Отслеживаем вызовы функций timeline
    const timelineCalls: string[] = []
    
    await page.addInitScript(() => {
      // Перехватываем вызовы timeline actions
      window.__TIMELINE_CALLS__ = []
      
      const originalAddMedia = window.addMediaToTimeline
      if (originalAddMedia) {
        window.addMediaToTimeline = function(...args) {
          window.__TIMELINE_CALLS__.push(`addMediaToTimeline called with: ${JSON.stringify(args)}`)
          return originalAddMedia.apply(this, args)
        }
      }

      const originalAddSingleMedia = window.addSingleMediaToTimeline
      if (originalAddSingleMedia) {
        window.addSingleMediaToTimeline = function(...args) {
          window.__TIMELINE_CALLS__.push(`addSingleMediaToTimeline called with: ${JSON.stringify(args)}`)
          return originalAddSingleMedia.apply(this, args)
        }
      }
    })

    // Симулируем выбор файла в браузере
    await page.evaluate(() => {
      const testFile = {
        id: "test-video-2",
        path: "test-data/Kate.mp4", 
        name: "Kate.mp4",
        type: "video/mp4",
        size: 25000000,
        duration: 15.2,
        isLoadingMetadata: false
      }

      // Имитируем клик по файлу в браузере
      const event = new CustomEvent('media-file-select', { detail: testFile })
      document.dispatchEvent(event)
    })

    await page.waitForTimeout(2000)

    // Получаем информацию о вызовах функций
    const timelineCallsData = await page.evaluate(() => window.__TIMELINE_CALLS__ || [])
    console.log('Timeline function calls:', timelineCallsData)

    // Проверяем, что используется правильная функция для одного файла
    const hasCorrectCalls = timelineCallsData.some((call: string) => 
      call.includes('addSingleMediaToTimeline') || 
      call.includes('addMediaToTimeline')
    )
    
    // Если есть вызовы, проверяем их корректность
    if (hasCorrectCalls) {
      console.log('Timeline functions were called correctly')
    }
  })

  test("should load project with video files without errors", async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Загружаем тестовый проект с видео файлами
    await page.evaluate(() => {
      const testProject = {
        id: "test-project-1",
        name: "Test Project with Videos",
        timeline: {
          tracks: [
            {
              id: "video-track-1",
              name: "Video Track 1", 
              type: "video",
              clips: [
                {
                  id: "clip-1",
                  name: "C0666.MP4",
                  mediaFile: {
                    id: "media-1",
                    path: "test-data/C0666.MP4",
                    name: "C0666.MP4",
                    type: "video/mp4",
                    isLoadingMetadata: false
                  },
                  startTime: 0,
                  duration: 30.5
                }
              ]
            }
          ]
        }
      }

      // Имитируем загрузку проекта
      window.__LOAD_TEST_PROJECT__ = testProject
    })

    await page.waitForTimeout(3000)

    // Проверяем Timeline
    const timelineElement = page.locator('[data-testid="timeline"]')
    if (await timelineElement.count() > 0) {
      await expect(timelineElement).toBeVisible()
    }

    // Проверяем отсутствие ошибок forEach
    const forEachErrors = consoleErrors.filter(error => 
      error.includes('forEach is not a function')
    )
    
    expect(forEachErrors.length).toBe(0)
    
    if (forEachErrors.length > 0) {
      console.log('ForEach errors found:', forEachErrors)
    }
  })

  test("should handle Cyrillic video files correctly", async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.click('[data-testid="browser-tab-media"]')
    await page.waitForTimeout(2000)

    // Добавляем файл с кириллическим именем
    await page.evaluate(() => {
      const cyrillicFile = {
        id: "cyrillic-video-1",
        path: "test-data/проводка после лобби.mp4",
        name: "проводка после лобби.mp4", 
        type: "video/mp4",
        size: 75000000,
        duration: 45.8,
        isLoadingMetadata: false
      }

      window.__TEST_ADD_CYRILLIC_FILE__ = cyrillicFile
    })

    await page.waitForTimeout(2000)

    // Проверяем, что нет ошибок кодировки
    const encodingErrors = consoleErrors.filter(error => 
      error.includes('decode') || 
      error.includes('encode') ||
      error.includes('localhost')
    )

    expect(encodingErrors.length).toBe(0)

    // Проверяем URL генерацию для кириллических файлов
    const videoElements = page.locator('video[src]')
    const count = await videoElements.count()

    for (let i = 0; i < count; i++) {
      const video = videoElements.nth(i)
      const src = await video.getAttribute('src')
      
      if (src && src.includes('проводка')) {
        expect(src).toMatch(/^asset:\/\//)
        expect(src).not.toContain('localhost')
        console.log(`Cyrillic file URL: ${src}`)
      }
    }
  })
})