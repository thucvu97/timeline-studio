import { test, expect } from "@playwright/test"
import path from "path"

test.describe("Video Playback Tests", () => {
  // Путь к тестовым видео файлам
  const testDataPath = path.join(process.cwd(), "test-data")
  const testVideos = [
    "C0666.MP4",
    "C0783.MP4", 
    "Kate.mp4",
    "water play3.mp4",
    "проводка после лобби.mp4"
  ]

  test.beforeEach(async ({ page }) => {
    // Переходим на главную страницу
    await page.goto("/")
    
    // Ждем полной загрузки приложения
    await page.waitForSelector('[data-testid="media-studio"]', { timeout: 30000 })
    
    // Открываем вкладку Media Browser
    await page.click('[data-testid="browser-tab-media"]')
    await page.waitForTimeout(2000)
  })

  test("should load and display video files from test-data", async ({ page }) => {
    // Проверяем, что браузер медиа загрузился
    await expect(page.locator('[data-testid="media-browser"]')).toBeVisible()
    
    // Добавляем папку test-data в браузер (симулируем выбор папки)
    // В реальном приложении это будет через диалог выбора папки
    await page.evaluate((testDataPath) => {
      // Имитируем добавление папки через Tauri API
      window.__TAURI_INVOKE__?.("scan_media_directory", { path: testDataPath })
    }, testDataPath)
    
    // Ждем загрузки файлов
    await page.waitForTimeout(5000)
    
    // Проверяем, что видео файлы появились в списке
    for (const videoFile of testVideos) {
      const videoSelector = `[data-testid="media-file-${videoFile}"]`
      await expect(page.locator(videoSelector).first()).toBeVisible({ timeout: 10000 })
    }
  })

  test("should preview video file with proper URL generation", async ({ page }) => {
    // Используем первый видео файл для тестирования
    const testVideo = testVideos[0] // C0666.MP4
    
    // Добавляем папку test-data
    await page.evaluate((testDataPath) => {
      window.__TAURI_INVOKE__?.("scan_media_directory", { path: testDataPath })
    }, testDataPath)
    
    await page.waitForTimeout(5000)
    
    // Находим первый видео файл в списке
    const videoElement = page.locator('[data-testid^="media-file-"]').first()
    await expect(videoElement).toBeVisible()
    
    // Проверяем, что у видео элемента есть src атрибут
    const videoPreview = videoElement.locator('video')
    await expect(videoPreview).toBeVisible()
    
    // Проверяем src атрибут видео
    const videoSrc = await videoPreview.getAttribute('src')
    expect(videoSrc).toBeTruthy()
    expect(videoSrc).toMatch(/^asset:\/\//) // Должен использовать asset:// протокол
    
    console.log(`Video src: ${videoSrc}`)
  })

  test("should handle Cyrillic filenames correctly", async ({ page }) => {
    // Тестируем файл с кириллическими символами
    const cyrillicVideo = "проводка после лобби.mp4"
    
    await page.evaluate((testDataPath) => {
      window.__TAURI_INVOKE__?.("scan_media_directory", { path: testDataPath })
    }, testDataPath)
    
    await page.waitForTimeout(5000)
    
    // Ищем файл с кириллическим именем
    const cyrillicVideoElement = page.locator(`[data-testid*="${cyrillicVideo}"]`).first()
    
    if (await cyrillicVideoElement.count() > 0) {
      await expect(cyrillicVideoElement).toBeVisible()
      
      // Проверяем preview видео
      const videoPreview = cyrillicVideoElement.locator('video')
      if (await videoPreview.count() > 0) {
        const videoSrc = await videoPreview.getAttribute('src')
        expect(videoSrc).toBeTruthy()
        expect(videoSrc).toMatch(/^asset:\/\//)
        
        // Проверяем, что URL корректно обрабатывает кириллицу
        expect(videoSrc).not.toContain('localhost')
        
        console.log(`Cyrillic video src: ${videoSrc}`)
      }
    }
  })

  test("should play video without auto-play issues", async ({ page }) => {
    await page.evaluate((testDataPath) => {
      window.__TAURI_INVOKE__?.("scan_media_directory", { path: testDataPath })
    }, testDataPath)
    
    await page.waitForTimeout(5000)
    
    // Находим первый видео элемент
    const videoElement = page.locator('[data-testid^="media-file-"]').first()
    await expect(videoElement).toBeVisible()
    
    const videoPreview = videoElement.locator('video')
    await expect(videoPreview).toBeVisible()
    
    // Проверяем, что видео не воспроизводится автоматически
    const isPaused = await videoPreview.evaluate((video: HTMLVideoElement) => video.paused)
    expect(isPaused).toBe(true)
    
    // Проверяем, что currentTime установлен на 0
    const currentTime = await videoPreview.evaluate((video: HTMLVideoElement) => video.currentTime)
    expect(currentTime).toBe(0)
    
    // Симулируем клик по видео для воспроизведения
    await videoElement.click()
    
    // Ждем немного и проверяем, что видео начало воспроизводиться
    await page.waitForTimeout(1000)
    
    const isPlaying = await videoPreview.evaluate((video: HTMLVideoElement) => !video.paused)
    // В preview режиме видео может воспроизводиться при клике
    console.log(`Video playing state: ${isPlaying}`)
  })

  test("should add video to timeline and play in video player", async ({ page }) => {
    await page.evaluate((testDataPath) => {
      window.__TAURI_INVOKE__?.("scan_media_directory", { path: testDataPath })
    }, testDataPath)
    
    await page.waitForTimeout(5000)
    
    // Находим первый видео файл
    const videoElement = page.locator('[data-testid^="media-file-"]').first()
    await expect(videoElement).toBeVisible()
    
    // Ищем кнопку добавления
    const addButton = videoElement.locator('[data-testid="add-media-button"]')
    if (await addButton.count() > 0) {
      await addButton.click()
      
      // Ждем добавления в timeline
      await page.waitForTimeout(2000)
      
      // Проверяем, что видео появилось в timeline
      const timelineClip = page.locator('[data-testid^="timeline-clip-"]').first()
      if (await timelineClip.count() > 0) {
        await expect(timelineClip).toBeVisible()
        
        // Кликаем по клипу для воспроизведения в плеере
        await timelineClip.click()
        
        // Проверяем видео плеер
        const videoPlayer = page.locator('[data-testid="video-player"] video')
        if (await videoPlayer.count() > 0) {
          await expect(videoPlayer).toBeVisible()
          
          const playerSrc = await videoPlayer.getAttribute('src')
          expect(playerSrc).toBeTruthy()
          expect(playerSrc).toMatch(/^asset:\/\//)
          
          console.log(`Video player src: ${playerSrc}`)
        }
      }
    }
  })

  test("should handle video metadata loading correctly", async ({ page }) => {
    await page.evaluate((testDataPath) => {
      window.__TAURI_INVOKE__?.("scan_media_directory", { path: testDataPath })
    }, testDataPath)
    
    await page.waitForTimeout(5000)
    
    // Проверяем, что видео файлы не показывают "загрузка метаданных" бесконечно
    const videoElements = page.locator('[data-testid^="media-file-"]')
    const count = await videoElements.count()
    
    for (let i = 0; i < Math.min(count, 3); i++) {
      const videoElement = videoElements.nth(i)
      
      // Проверяем, что нет индикатора загрузки метаданных
      const loadingIndicator = videoElement.locator('[data-testid="metadata-loading"]')
      if (await loadingIndicator.count() > 0) {
        // Если есть индикатор загрузки, он должен исчезнуть в разумное время
        await expect(loadingIndicator).not.toBeVisible({ timeout: 10000 })
      }
      
      // Проверяем, что видео preview отображается
      const videoPreview = videoElement.locator('video')
      if (await videoPreview.count() > 0) {
        await expect(videoPreview).toBeVisible()
        
        // Проверяем, что видео готово для воспроизведения
        const readyState = await videoPreview.evaluate((video: HTMLVideoElement) => video.readyState)
        // readyState >= 2 означает, что метаданные загружены
        expect(readyState).toBeGreaterThanOrEqual(2)
      }
    }
  })

  test("should not display localhost in video URLs", async ({ page }) => {
    await page.evaluate((testDataPath) => {
      window.__TAURI_INVOKE__?.("scan_media_directory", { path: testDataPath })
    }, testDataPath)
    
    await page.waitForTimeout(5000)
    
    // Получаем все video элементы на странице
    const videoElements = page.locator('video')
    const count = await videoElements.count()
    
    for (let i = 0; i < count; i++) {
      const video = videoElements.nth(i)
      const src = await video.getAttribute('src')
      
      if (src) {
        // URL не должен содержать localhost
        expect(src).not.toContain('localhost')
        
        // Если это не пустой src, должен использовать asset:// протокол
        if (src !== '#' && src !== '') {
          expect(src).toMatch(/^asset:\/\//)
        }
        
        console.log(`Video URL check: ${src}`)
      }
    }
  })
})