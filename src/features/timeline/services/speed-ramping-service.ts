/**
 * Сервис для интеграции Speed Ramping с плеером
 */

import { TimelineClip } from "../types"
import { SpeedRampingConfig, getSpeedAtTime } from "../types/speed-ramping"

export interface SpeedRampingService {
  /**
   * Получить скорость воспроизведения для конкретного времени в клипе
   */
  getPlaybackRateForTime(clipId: string, time: number): number

  /**
   * Проверить, активен ли speed ramping для клипа
   */
  isSpeedRampingEnabled(clipId: string): boolean

  /**
   * Получить конфигурацию speed ramping для клипа
   */
  getSpeedRampingConfig(clipId: string): SpeedRampingConfig | null

  /**
   * Рассчитать длительность клипа с учетом speed ramping
   */
  calculateClipDuration(clip: TimelineClip): number

  /**
   * Конвертировать время в клипе с учетом speed ramping
   */
  convertTimeWithSpeedRamping(clipId: string, originalTime: number): number

  /**
   * Получить все активные speed ramping конфигурации
   */
  getAllActiveConfigs(): Record<string, SpeedRampingConfig>

  /**
   * Обновить конфигурацию speed ramping
   */
  updateSpeedRampingConfig(clipId: string, config: SpeedRampingConfig): void

  /**
   * Сбросить все конфигурации speed ramping
   */
  resetAllConfigs(): void
}

export class SpeedRampingServiceImpl implements SpeedRampingService {
  private speedRampingConfigs: Record<string, SpeedRampingConfig> = {}

  constructor(initialConfigs?: Record<string, SpeedRampingConfig>) {
    if (initialConfigs) {
      this.speedRampingConfigs = { ...initialConfigs }
    }
  }

  getPlaybackRateForTime(clipId: string, time: number): number {
    const config = this.speedRampingConfigs[clipId]
    if (!config || !config.enabled || config.keyframes.length === 0) {
      return 1.0
    }

    return getSpeedAtTime(config.keyframes, time, 0)
  }

  isSpeedRampingEnabled(clipId: string): boolean {
    const config = this.speedRampingConfigs[clipId]
    return config ? config.enabled : false
  }

  getSpeedRampingConfig(clipId: string): SpeedRampingConfig | null {
    return this.speedRampingConfigs[clipId] || null
  }

  calculateClipDuration(clip: TimelineClip): number {
    const config = this.speedRampingConfigs[clip.id]
    if (!config || !config.enabled || config.keyframes.length === 0) {
      return clip.duration
    }

    // Простое приближение - более точная реализация потребует интеграции
    // с функцией calculateNewDuration из speed-ramping.ts
    let totalDuration = 0
    const sampleRate = 100 // Частота дискретизации
    const step = clip.duration / sampleRate

    for (let i = 0; i < sampleRate; i++) {
      const time = i * step
      const speed = getSpeedAtTime(config.keyframes, time, clip.duration)

      if (speed > 0) {
        totalDuration += step / speed
      }
    }

    return totalDuration
  }

  convertTimeWithSpeedRamping(clipId: string, originalTime: number): number {
    const config = this.speedRampingConfigs[clipId]
    if (!config || !config.enabled || config.keyframes.length === 0) {
      return originalTime
    }

    // Простое приближение - для точного mapping потребуется
    // более сложная реализация с интеграцией
    let convertedTime = 0
    const sampleRate = 100
    const step = originalTime / sampleRate

    for (let i = 0; i < sampleRate; i++) {
      const time = i * step
      const speed = getSpeedAtTime(config.keyframes, time, originalTime)

      if (speed > 0) {
        convertedTime += step / speed
      }
    }

    return convertedTime
  }

  getAllActiveConfigs(): Record<string, SpeedRampingConfig> {
    return Object.fromEntries(Object.entries(this.speedRampingConfigs).filter(([_, config]) => config.enabled))
  }

  updateSpeedRampingConfig(clipId: string, config: SpeedRampingConfig): void {
    this.speedRampingConfigs[clipId] = { ...config }
  }

  resetAllConfigs(): void {
    this.speedRampingConfigs = {}
  }

  /**
   * Обновить конфигурации из timeline машины
   */
  updateFromTimelineConfigs(configs: Record<string, SpeedRampingConfig>): void {
    this.speedRampingConfigs = { ...configs }
  }

  /**
   * Получить конфигурации для timeline машины
   */
  getConfigsForTimeline(): Record<string, SpeedRampingConfig> {
    return { ...this.speedRampingConfigs }
  }
}
