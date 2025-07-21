/**
 * Timeline Player Synchronization Service
 *
 * Синхронизирует выбранный клип в timeline с video player
 */

import { MediaFile } from "@/features/media/types/media"
import { AppCommands } from "@/features/app-state/services/app-machine"
import { getBackendSync } from "@/features/app-state/services/backend-sync"

import { TimelineClip } from "../types"
import { interpolateSpeed } from "../utils/speed-ramping-utils"

interface PlayerContext {
  // Backend команды для управления плеером
  playerSetMedia: (mediaId: string, startTime?: number) => Promise<void>
  playerSelectClip: (clipId: string) => Promise<void>
  playerClearSelection: () => Promise<void>
  playerSetSource: (source: "browser" | "timeline") => Promise<void>
  playerApplyEffect: (effectId: string, params: Record<string, any>) => Promise<void>
  playerApplyFilter: (filterId: string, params: Record<string, any>) => Promise<void>
  playerApplyTemplate: (templateId: string, mediaIds: string[]) => Promise<void>
  playerClearEffects: () => Promise<void>
  playerClearFilters: () => Promise<void>
  playerClearTemplate: () => Promise<void>
  seek: (time: number) => Promise<void>
  setPlaybackRate: (rate: number) => Promise<void>
  
  // Локальные состояния для совместимости
  speedRampingEnabled?: boolean
  basePlaybackRate?: number
  setSpeedRampingEnabled?: (enabled: boolean) => void
  updatePlaybackRate?: (rate: number) => void
}

export class TimelinePlayerSync {
  private static instance: TimelinePlayerSync | null = null
  private playerContext: PlayerContext | null = null
  private currentSelectedClip: TimelineClip | null = null
  private backendSync = getBackendSync()

  private constructor() {}

  static getInstance(): TimelinePlayerSync {
    if (!TimelinePlayerSync.instance) {
      TimelinePlayerSync.instance = new TimelinePlayerSync()
    }
    return TimelinePlayerSync.instance
  }

  /**
   * Устанавливает контекст плеера для синхронизации
   */
  setPlayerContext(context: PlayerContext) {
    this.playerContext = context
    console.log("[TimelinePlayerSync] Player context set")
  }

  /**
   * Синхронизирует выбранный клип с плеером через backend команды
   */
  async syncSelectedClip(clip: TimelineClip | null) {
    // Если клип не выбран, очищаем выбор
    if (!clip) {
      await this.clearSelection()
      return
    }

    // Если нет контекста плеера, пропускаем
    if (!this.playerContext) {
      console.warn("[TimelinePlayerSync] No player context")
      return
    }

    // Если это тот же клип, не обновляем
    if (this.currentSelectedClip?.id === clip.id) {
      return
    }

    // ИСПРАВЛЕНИЕ: Проверяем наличие медиафайла ДО установки currentSelectedClip
    if (!clip.mediaFile) {
      console.warn("[TimelinePlayerSync] Clip has no media file")
      return
    }

    try {
      this.currentSelectedClip = clip

      console.log("[TimelinePlayerSync] Syncing clip to player:", clip.name)

      // Устанавливаем источник как timeline через backend
      await this.playerContext.playerSetSource("timeline")

      // Выбираем клип в плеере через backend
      await this.playerContext.playerSelectClip(clip.id)

      // Устанавливаем медиа в плеер (если есть mediaId)
      if (clip.mediaId) {
        await this.playerContext.playerSetMedia(clip.mediaId, clip.mediaStartTime || 0)
      }

      // Применяем эффекты, фильтры и шаблоны клипа
      await this.applyClipResources(clip)
    } catch (error) {
      console.error("[TimelinePlayerSync] Failed to sync clip:", error)
    }
  }

  /**
   * Применяет ресурсы (эффекты, фильтры, шаблоны) из клипа к плееру через backend команды
   */
  private async applyClipResources(clip: TimelineClip) {
    if (!this.playerContext) return

    try {
      // Очищаем предыдущие эффекты/фильтры/шаблоны через backend
      await this.playerContext.playerClearEffects()
      await this.playerContext.playerClearFilters()
      await this.playerContext.playerClearTemplate()

      // Применяем эффекты через backend
      if (clip.effects) {
        for (const effect of clip.effects) {
          await this.playerContext.playerApplyEffect(effect.effectId, effect.customParams || {})
        }
      }

      // Применяем фильтры через backend
      if (clip.filters) {
        for (const filter of clip.filters) {
          await this.playerContext.playerApplyFilter(filter.filterId, filter.customParams || {})
        }
      }

      // Применяем шаблон если есть через backend
      if (clip.templateId) {
        const mediaIds = clip.mediaId ? [clip.mediaId] : []
        await this.playerContext.playerApplyTemplate(clip.templateId, mediaIds)
      }
    } catch (error) {
      console.error("[TimelinePlayerSync] Failed to apply clip resources:", error)
    }
  }

  /**
   * Обновляет время воспроизведения в плеере при изменении времени в timeline
   */
  async syncPlaybackTime(timelineTime: number) {
    if (!this.playerContext || !this.currentSelectedClip) {
      return
    }

    // Вычисляем время относительно клипа
    const clipRelativeTime = timelineTime - this.currentSelectedClip.startTime

    // Проверяем, находится ли время в пределах клипа
    if (clipRelativeTime >= 0 && clipRelativeTime <= this.currentSelectedClip.duration) {
      try {
        // Конвертируем в время медиафайла
        const mediaTime = this.currentSelectedClip.mediaStartTime + clipRelativeTime
        await this.playerContext.seek(mediaTime)

        // Обновляем скорость воспроизведения если включен speed ramping
        await this.updateSpeedRamping(clipRelativeTime)
      } catch (error) {
        console.error("[TimelinePlayerSync] Failed to sync playback time:", error)
      }
    }
  }

  /**
   * Вычисляет и применяет speed ramping для текущего времени
   */
  private async updateSpeedRamping(clipRelativeTime: number) {
    if (!this.playerContext || !this.currentSelectedClip) {
      return
    }

    // Проверяем, включен ли speed ramping для клипа
    const speedRampingConfig = this.currentSelectedClip.speedRamping
    if (!speedRampingConfig?.enabled || !speedRampingConfig.keyframes.length) {
      // Если speed ramping выключен, устанавливаем базовую скорость
      if (this.playerContext.speedRampingEnabled) {
        this.playerContext.setSpeedRampingEnabled?.(false)
        if (this.playerContext.basePlaybackRate) {
          await this.playerContext.setPlaybackRate(this.playerContext.basePlaybackRate)
        }
      }
      return
    }

    // Включаем speed ramping в плеере если он не включен
    if (!this.playerContext.speedRampingEnabled) {
      this.playerContext.setSpeedRampingEnabled?.(true)
    }

    // Вычисляем скорость для текущего времени
    const speed = interpolateSpeed(speedRampingConfig.keyframes, clipRelativeTime)
    const baseRate = this.playerContext.basePlaybackRate || 1.0
    const finalRate = baseRate * speed

    // Обновляем скорость воспроизведения через backend
    try {
      await this.playerContext.setPlaybackRate(finalRate)
    } catch (error) {
      console.error("[TimelinePlayerSync] Failed to update playback rate:", error)
    }
  }

  /**
   * Очищает текущий выбранный клип через backend команды
   */
  async clearSelection() {
    this.currentSelectedClip = null

    if (this.playerContext) {
      try {
        // Возвращаем источник на browser через backend
        await this.playerContext.playerSetSource("browser")

        // Очищаем выбор клипа через backend
        await this.playerContext.playerClearSelection()

        // Очищаем эффекты/фильтры/шаблоны через backend
        await this.playerContext.playerClearEffects()
        await this.playerContext.playerClearFilters()
        await this.playerContext.playerClearTemplate()
      } catch (error) {
        console.error("[TimelinePlayerSync] Failed to clear selection:", error)
      }
    }

    console.log("[TimelinePlayerSync] Selection cleared")
  }

  /**
   * Проверяет, синхронизирован ли данный клип с плеером
   */
  isClipSynced(clipId: string): boolean {
    return this.currentSelectedClip?.id === clipId
  }
}

// Экспортируем singleton instance
export const timelinePlayerSync = TimelinePlayerSync.getInstance()
