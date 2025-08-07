/**
 * Effects Player Integration Service
 * Интеграция WebGL эффектов с video player для real-time preview
 */

import { WebGL2UnifiedRenderer } from "@/features/effects/services/webgl2-unified-renderer"
import type { BaseEffect } from "@/features/effects/types"
import { PreviewCache } from "@/features/preview/services/preview-cache"
import type { AppliedEffect, TimelineClip } from "../types"

export interface EffectsPlayerConfig {
  targetCanvas?: HTMLCanvasElement
  quality?: "draft" | "preview" | "full"
  gpuTier?: "low" | "medium" | "high"
  cacheSize?: number // размер кеша в MB
  enableCache?: boolean // включить/выключить кеширование
}

export class EffectsPlayerIntegration {
  private renderer: WebGL2UnifiedRenderer
  private cache: PreviewCache | null = null
  private isInitialized = false
  private currentClip: TimelineClip | null = null
  private baseEffects = new Map<string, BaseEffect>()
  private targetCanvas: HTMLCanvasElement | null = null
  private offscreenCanvas: OffscreenCanvas | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private animationFrameId: number | null = null

  constructor(private config: EffectsPlayerConfig = {}) {
    this.renderer = new WebGL2UnifiedRenderer()
    
    // Инициализируем кеш если включен
    if (config.enableCache !== false) {
      this.cache = new PreviewCache(config.cacheSize || 100)
    }
  }

  // ============================================================================
  // ИНИЦИАЛИЗАЦИЯ
  // ============================================================================

  async initialize(availableEffects: BaseEffect[]): Promise<void> {
    if (this.isInitialized) return

    // Инициализируем WebGL рендерер
    await this.renderer.initialize()

    // Сохраняем доступные эффекты
    for (const effect of availableEffects) {
      this.baseEffects.set(effect.id, effect)
    }

    // Создаем canvas для рендеринга если не предоставлен
    if (!this.config.targetCanvas) {
      this.targetCanvas = document.createElement("canvas")
      this.targetCanvas.style.display = "none"
      document.body.appendChild(this.targetCanvas)
    } else {
      this.targetCanvas = this.config.targetCanvas
    }

    this.ctx = this.targetCanvas.getContext("2d")

    // Создаем offscreen canvas для производительности
    if ("OffscreenCanvas" in window) {
      this.offscreenCanvas = new OffscreenCanvas(1920, 1080)
    }

    this.isInitialized = true
  }

  // ============================================================================
  // УПРАВЛЕНИЕ ЭФФЕКТАМИ
  // ============================================================================

  /**
   * Установить текущий клип для обработки
   */
  setCurrentClip(clip: TimelineClip | null): void {
    const clipChanged = this.currentClip?.id !== clip?.id
    this.currentClip = clip

    // Останавливаем анимацию если клип изменился
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
    
    // Очищаем кеш при смене клипа
    if (clipChanged && this.cache) {
      this.invalidateCache()
    }
  }

  /**
   * Обработать видео кадр с применением эффектов
   */
  async processVideoFrame(videoElement: HTMLVideoElement, currentTime: number): Promise<HTMLCanvasElement | null> {
    if (!this.isInitialized || !this.currentClip || !this.targetCanvas || !this.ctx) {
      return null
    }

    // Получаем активные эффекты клипа
    const activeEffects = this.currentClip.effects.filter((e) => e.enabled)

    if (activeEffects.length === 0) {
      // Нет эффектов - просто копируем видео
      this.targetCanvas.width = videoElement.videoWidth
      this.targetCanvas.height = videoElement.videoHeight
      this.ctx.drawImage(videoElement, 0, 0)
      return this.targetCanvas
    }

    // Проверяем кеш если включен
    if (this.cache) {
      const cacheKey = this.generateCacheKey(currentTime, activeEffects)
      const cached = await this.getCachedFrame(cacheKey)
      
      if (cached) {
        // Возвращаем закешированный кадр
        this.targetCanvas.width = cached.width
        this.targetCanvas.height = cached.height
        this.ctx.drawImage(cached, 0, 0)
        return this.targetCanvas
      }
    }

    try {
      // Рендерим эффекты через WebGL
      const result = await this.renderer.renderEffectStack(activeEffects, this.baseEffects, {
        source: videoElement,
        target: this.targetCanvas,
        width: videoElement.videoWidth,
        height: videoElement.videoHeight,
        currentTime,
        quality: this.config.quality || "preview",
        gpuTier: this.config.gpuTier || "medium",
      })

      if (result.success && result.output instanceof HTMLCanvasElement) {
        // Кешируем результат если кеш включен
        if (this.cache) {
          const cacheKey = this.generateCacheKey(currentTime, activeEffects)
          await this.cacheFrame(cacheKey, result.output)
        }
        return result.output
      }
      if (result.success && result.output instanceof ImageBitmap) {
        // Рисуем ImageBitmap на canvas
        this.targetCanvas.width = result.output.width
        this.targetCanvas.height = result.output.height
        this.ctx.drawImage(result.output, 0, 0)
        
        // Кешируем результат
        if (this.cache) {
          const cacheKey = this.generateCacheKey(currentTime, activeEffects)
          await this.cacheFrame(cacheKey, this.targetCanvas)
        }
        
        return this.targetCanvas
      }

      // При ошибке возвращаем оригинальное видео
      console.warn("Effect rendering failed:", result.error)
      this.targetCanvas.width = videoElement.videoWidth
      this.targetCanvas.height = videoElement.videoHeight
      this.ctx.drawImage(videoElement, 0, 0)
      return this.targetCanvas
    } catch (error) {
      console.error("Error processing video frame:", error)
      return null
    }
  }

  // ============================================================================
  // КЕШИРОВАНИЕ
  // ============================================================================

  /**
   * Генерирует ключ кеша на основе времени и эффектов
   */
  private generateCacheKey(currentTime: number, effects: AppliedEffect[]): string {
    const enabledEffects = effects
      .filter((e) => e.enabled)
      .map((e) => ({
        id: e.effectId,
        params: e.parameters,
        keyframes: e.keyframes,
      }))
    
    // Простой хеш на основе JSON
    const effectsHash = this.simpleHash(JSON.stringify(enabledEffects))
    return `${currentTime.toFixed(3)}_${effectsHash}`
  }

  /**
   * Простая хеш-функция
   */
  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash &= hash
    }
    return hash.toString(36)
  }

  /**
   * Получить закешированный кадр
   */
  private async getCachedFrame(key: string): Promise<ImageBitmap | null> {
    if (!this.cache) return null
    
    // PreviewCache работает с ImageBitmap, но нам нужно адаптировать
    // использование, т.к. у нас другие типы эффектов
    // TODO: адаптировать PreviewCache для наших типов
    return null
  }

  /**
   * Сохранить кадр в кеш
   */
  private async cacheFrame(key: string, canvas: HTMLCanvasElement): Promise<void> {
    if (!this.cache) return
    
    try {
      // Создаем ImageBitmap для эффективного хранения
      const bitmap = await createImageBitmap(canvas)
      // TODO: сохранить в кеш
      // Нужно расширить PreviewCache API для прямого доступа
    } catch (error) {
      console.warn("Не удалось закешировать кадр:", error)
    }
  }

  /**
   * Очистить кеш при изменении эффектов
   */
  invalidateCache(): void {
    if (this.cache) {
      this.cache.invalidate()
    }
  }

  /**
   * Получить статистику кеша
   */
  getCacheStats() {
    if (!this.cache) {
      return {
        entries: 0,
        sizeMB: 0,
        hitRate: 0,
      }
    }
    
    const stats = this.cache.getStats()
    return {
      entries: stats.entries,
      sizeMB: stats.sizeMB,
      hitRate: stats.fillPercentage / 100, // конвертируем в долю
    }
  }

  /**
   * Начать real-time обработку видео
   */
  startRealtimeProcessing(videoElement: HTMLVideoElement, onFrameProcessed: (canvas: HTMLCanvasElement) => void): void {
    if (!this.isInitialized || this.animationFrameId !== null) return

    const processFrame = async () => {
      if (!videoElement.paused && !videoElement.ended) {
        const processedCanvas = await this.processVideoFrame(videoElement, videoElement.currentTime)

        if (processedCanvas) {
          onFrameProcessed(processedCanvas)
        }
      }

      this.animationFrameId = requestAnimationFrame(processFrame)
    }

    processFrame()
  }

  /**
   * Остановить real-time обработку
   */
  stopRealtimeProcessing(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  // ============================================================================
  // ПРЕДПРОСМОТР ЭФФЕКТОВ
  // ============================================================================

  /**
   * Создать preview эффекта для UI
   */
  async createEffectPreview(
    effect: BaseEffect,
    sourceImage: HTMLImageElement | HTMLCanvasElement,
    size = 200,
  ): Promise<HTMLCanvasElement | null> {
    if (!this.isInitialized) return null

    const previewCanvas = document.createElement("canvas")
    previewCanvas.width = size
    previewCanvas.height = size

    try {
      // Создаем временный applied effect с дефолтными параметрами
      const appliedEffect: AppliedEffect = {
        id: `preview_${effect.id}`,
        effectId: effect.id,
        enabled: true,
        order: 0,
        parameters: effect.defaultParams || {},
        keyframes: {},
      }

      const result = await this.renderer.renderEffectStack([appliedEffect], this.baseEffects, {
        source: sourceImage,
        target: previewCanvas,
        width: size,
        height: size,
        currentTime: 0,
        quality: "draft",
      })

      if (result.success && result.output instanceof HTMLCanvasElement) {
        return result.output
      }

      // Fallback: просто копируем изображение
      const ctx = previewCanvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(sourceImage, 0, 0, size, size)
      }
      return previewCanvas
    } catch (error) {
      console.error("Error creating effect preview:", error)
      return null
    }
  }

  // ============================================================================
  // ЭКСПОРТ
  // ============================================================================

  /**
   * Получить FFmpeg команды для эффектов клипа
   */
  getFFmpegCommands(clip: TimelineClip): string[] {
    const commands: string[] = []
    const activeEffects = clip.effects.filter((e) => e.enabled)

    for (const appliedEffect of activeEffects) {
      const baseEffect = this.baseEffects.get(appliedEffect.effectId)
      if (!baseEffect?.processors.ffmpeg) continue

      const params = {
        ...baseEffect.defaultParams,
        ...appliedEffect.parameters,
      }

      const filter = baseEffect.processors.ffmpeg.filter(params)
      if (filter) {
        commands.push(filter)
      }
    }

    return commands
  }

  // ============================================================================
  // ОЧИСТКА
  // ============================================================================

  dispose(): void {
    this.stopRealtimeProcessing()

    if (this.renderer) {
      this.renderer.dispose()
    }
    
    if (this.cache) {
      this.cache.dispose()
      this.cache = null
    }

    if (this.targetCanvas && !this.config.targetCanvas) {
      this.targetCanvas.remove()
    }

    this.targetCanvas = null
    this.offscreenCanvas = null
    this.ctx = null
    this.baseEffects.clear()
    this.isInitialized = false
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let instance: EffectsPlayerIntegration | null = null

export function getEffectsPlayerIntegration(config?: EffectsPlayerConfig): EffectsPlayerIntegration {
  if (!instance) {
    instance = new EffectsPlayerIntegration(config)
  }
  return instance
}

export function disposeEffectsPlayerIntegration(): void {
  if (instance) {
    instance.dispose()
    instance = null
  }
}
