/**
 * Timeline Player Synchronization Service
 *
 * Синхронизирует выбранный клип в timeline с video player
 */

import { MediaFile } from "@/features/media/types/media"
import { PlayerContextType } from "@/features/video-player/services/player-machine"

import { TimelineClip } from "../types"
import { interpolateSpeed } from "../utils/speed-ramping-utils"

interface PlayerContext extends PlayerContextType {
  // Методы для управления видео
  setVideoSource: (source: "browser" | "timeline") => void
  setVideo: (video: MediaFile) => void
  setCurrentTime: (time: number) => void

  // Методы для управления эффектами/фильтрами/шаблонами
  clearEffects: () => void
  clearFilters: () => void
  clearTemplate: () => void
  applyEffect: (effect: { id: string; name: string; params: any }) => void
  applyFilter: (filter: { id: string; name: string; params: any }) => void
  applyTemplate: (template: { id: string; name: string }, files: MediaFile[]) => void

  // Методы для speed ramping
  setSpeedRampingEnabled: (enabled: boolean) => void
  updatePlaybackRate: (rate: number) => void
}

export class TimelinePlayerSync {
  private static instance: TimelinePlayerSync | null = null
  private playerContext: PlayerContext | null = null
  private currentSelectedClip: TimelineClip | null = null

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
   * Синхронизирует выбранный клип с плеером
   */
  syncSelectedClip(clip: TimelineClip | null) {
    // Если клип не выбран, ничего не делаем
    if (!clip || !this.playerContext) {
      return
    }

    // Если это тот же клип, не обновляем
    if (this.currentSelectedClip?.id === clip.id) {
      return
    }

    this.currentSelectedClip = clip

    // Проверяем, есть ли медиафайл у клипа
    if (!clip.mediaFile) {
      console.warn("[TimelinePlayerSync] Clip has no media file")
      return
    }

    console.log("[TimelinePlayerSync] Syncing clip to player:", clip.name)

    // Устанавливаем источник как timeline
    this.playerContext.setVideoSource("timeline")

    // Устанавливаем видео в плеер
    this.playerContext.setVideo(clip.mediaFile)

    // Устанавливаем время воспроизведения на начало клипа
    this.playerContext.setCurrentTime(clip.mediaStartTime || 0)

    // Применяем эффекты, фильтры и шаблоны клипа
    this.applyClipResources(clip)
  }

  /**
   * Применяет ресурсы (эффекты, фильтры, шаблоны) из клипа к плееру
   */
  private applyClipResources(clip: TimelineClip) {
    if (!this.playerContext) return

    // Очищаем предыдущие эффекты/фильтры/шаблоны
    this.playerContext.clearEffects()
    this.playerContext.clearFilters()
    this.playerContext.clearTemplate()

    // Применяем эффекты
    clip.effects?.forEach((effect) => {
      this.playerContext?.applyEffect({
        id: effect.id,
        name: effect.name,
        params: effect.params,
      })
    })

    // Применяем фильтры
    clip.filters?.forEach((filter) => {
      this.playerContext?.applyFilter({
        id: filter.id,
        name: filter.name,
        params: filter.params,
      })
    })

    // Применяем шаблон если есть
    if (clip.template) {
      // Для шаблона нужны дополнительные файлы,
      // пока используем только основной медиафайл
      const files: MediaFile[] = clip.mediaFile ? [clip.mediaFile] : []

      this.playerContext.applyTemplate(
        {
          id: clip.template.id,
          name: clip.template.name,
        },
        files,
      )
    }
  }

  /**
   * Обновляет время воспроизведения в плеере при изменении времени в timeline
   */
  syncPlaybackTime(timelineTime: number) {
    if (!this.playerContext || !this.currentSelectedClip) {
      return
    }

    // Вычисляем время относительно клипа
    const clipRelativeTime = timelineTime - this.currentSelectedClip.startTime

    // Проверяем, находится ли время в пределах клипа
    if (clipRelativeTime >= 0 && clipRelativeTime <= this.currentSelectedClip.duration) {
      // Конвертируем в время медиафайла
      const mediaTime = this.currentSelectedClip.mediaStartTime + clipRelativeTime
      this.playerContext.setCurrentTime(mediaTime)

      // Обновляем скорость воспроизведения если включен speed ramping
      this.updateSpeedRamping(clipRelativeTime)
    }
  }

  /**
   * Вычисляет и применяет speed ramping для текущего времени
   */
  private updateSpeedRamping(clipRelativeTime: number) {
    if (!this.playerContext || !this.currentSelectedClip) {
      return
    }

    // Проверяем, включен ли speed ramping для клипа
    const speedRampingConfig = this.currentSelectedClip.speedRamping
    if (!speedRampingConfig?.enabled || !speedRampingConfig.keyframes.length) {
      // Если speed ramping выключен, устанавливаем базовую скорость
      if (this.playerContext.speedRampingEnabled) {
        this.playerContext.setSpeedRampingEnabled(false)
        this.playerContext.updatePlaybackRate(this.playerContext.basePlaybackRate)
      }
      return
    }

    // Включаем speed ramping в плеере если он не включен
    if (!this.playerContext.speedRampingEnabled) {
      this.playerContext.setSpeedRampingEnabled(true)
    }

    // Вычисляем скорость для текущего времени
    const speed = interpolateSpeed(speedRampingConfig.keyframes, clipRelativeTime)
    const finalRate = this.playerContext.basePlaybackRate * speed

    // Обновляем скорость воспроизведения
    this.playerContext.updatePlaybackRate(finalRate)
  }

  /**
   * Очищает текущий выбранный клип
   */
  clearSelection() {
    this.currentSelectedClip = null

    if (this.playerContext) {
      // Возвращаем источник на browser
      this.playerContext.setVideoSource("browser")

      // Очищаем эффекты/фильтры/шаблоны
      this.playerContext.clearEffects()
      this.playerContext.clearFilters()
      this.playerContext.clearTemplate()
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
