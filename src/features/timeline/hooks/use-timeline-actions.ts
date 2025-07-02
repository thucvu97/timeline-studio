/**
 * Hook for Timeline actions - добавление медиафайлов на таймлайн
 */

import { useCallback } from "react"

import { MediaFile } from "@/features/media/types/media"

import { useTimeline } from "../hooks/use-timeline"
import { TrackType } from "../types"
import { useClips } from "./use-clips"
import { useTracks } from "./use-tracks"

export interface UseTimelineActionsReturn {
  // Добавление медиафайлов
  addMediaToTimeline: (files: MediaFile[]) => void
  addSingleMediaToTimeline: (file: MediaFile, targetTrackId?: string, startTime?: number) => void

  // Утилиты
  getTrackTypeForMedia: (file: MediaFile) => TrackType
  findBestTrackForMedia: (file: MediaFile) => string | null
  calculateClipStartTime: (trackId: string) => number
}

/**
 * Определяет тип трека для медиафайла
 */
function getTrackTypeForMediaFile(file: MediaFile): TrackType {
  // Проверяем по расширению файла
  if (file.isImage) {
    return "image"
  }

  if (file.isVideo) {
    return "video"
  }

  if (file.isAudio) {
    return "audio"
  }

  // Проверяем по метаданным, если они доступны
  if (file.probeData?.streams) {
    const hasVideo = file.probeData.streams.some((stream) => stream.codec_type === "video")
    const hasAudio = file.probeData.streams.some((stream) => stream.codec_type === "audio")

    if (hasVideo) {
      return "video"
    }
    if (hasAudio) {
      return "audio"
    }
  }

  // По умолчанию считаем видео
  return "video"
}

export function useTimelineActions(): UseTimelineActionsReturn {
  const { project, addTrack, addClip, createProject } = useTimeline()
  const { tracks, getTracksByType } = useTracks()
  const { getClipsByTrack } = useClips()

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const getTrackTypeForMedia = useCallback((file: MediaFile): TrackType => {
    return getTrackTypeForMediaFile(file)
  }, [])

  const findBestTrackForMedia = useCallback(
    (file: MediaFile): string | null => {
      const trackType = getTrackTypeForMedia(file)
      const tracksOfType = getTracksByType(trackType)

      if (tracksOfType.length === 0) {
        return null // Нет подходящих треков
      }

      // Возвращаем первый трек подходящего типа
      // В будущем можно добавить более сложную логику выбора
      return tracksOfType[0].id
    },
    [getTrackTypeForMedia, getTracksByType],
  )

  const calculateClipStartTime = useCallback(
    (trackId: string): number => {
      const clipsOnTrack = getClipsByTrack(trackId)

      if (clipsOnTrack.length === 0) {
        return 0 // Начинаем с начала трека
      }

      // Находим последний клип и добавляем новый после него
      const lastClip = clipsOnTrack.reduce((latest, clip) => {
        const clipEndTime = clip.startTime + clip.duration
        const latestEndTime = latest.startTime + latest.duration
        return clipEndTime > latestEndTime ? clip : latest
      })

      return lastClip.startTime + lastClip.duration
    },
    [getClipsByTrack],
  )

  // ============================================================================
  // MAIN ACTIONS
  // ============================================================================

  const addSingleMediaToTimeline = useCallback(
    (file: MediaFile, customTrackId?: string, customStartTime?: number) => {
      // Если нет проекта, создаем новый
      if (!project) {
        console.log("No timeline project found, creating new project...")
        createProject("Untitled Project")

        // Откладываем добавление медиафайла до создания проекта
        setTimeout(() => {
          addSingleMediaToTimeline(file, customTrackId, customStartTime)
        }, 100)
        return
      }

      const trackType = getTrackTypeForMedia(file)
      const targetTrackId = customTrackId || findBestTrackForMedia(file)

      // Если нет подходящего трека, создаем новый
      if (!targetTrackId) {
        const trackName = `${trackType.charAt(0).toUpperCase() + trackType.slice(1)} Track`

        console.log(`Creating new ${trackType} track for file: ${file.name}`)

        // Создаем трек
        addTrack(trackType, undefined, trackName)

        // Для синхронной обработки используем рекурсивный вызов с задержкой
        // Это позволит state machine обработать создание трека
        let retryCount = 0
        const maxRetries = 10
        const retryDelay = 100 // Увеличиваем задержку

        const checkForTrack = () => {
          retryCount++
          
          // Пытаемся найти созданный трек
          const newTargetTrackId = findBestTrackForMedia(file)

          if (newTargetTrackId) {
            // Рекурсивно вызываем функцию с найденным треком
            addSingleMediaToTimeline(file, newTargetTrackId, customStartTime)
          } else if (retryCount < maxRetries) {
            // Пробуем еще раз
            setTimeout(checkForTrack, retryDelay)
          } else {
            console.error(`Failed to create ${trackType} track for media file: ${file.name} after ${maxRetries} attempts`)
          }
        }

        setTimeout(checkForTrack, retryDelay)
        return
      }

      // Если трек уже существует, добавляем клип сразу
      const startTime = customStartTime !== undefined ? customStartTime : calculateClipStartTime(targetTrackId)
      const duration = file.duration || (file.isImage ? 5 : 10) // 5 секунд для изображений, 10 для видео/аудио без duration

      addClip(targetTrackId, file, startTime, duration)
      console.log(`Added ${file.name} to track ${targetTrackId} at time ${startTime} with duration ${duration}`)
    },
    [project, getTrackTypeForMedia, findBestTrackForMedia, addTrack, calculateClipStartTime, addClip, createProject],
  )

  const addMediaToTimeline = useCallback(
    (files: MediaFile[]) => {
      if (!files || files.length === 0) {
        return
      }

      console.log(`Adding ${files.length} files to timeline`)

      // Добавляем файлы по одному
      files.forEach((file, index) => {
        // Небольшая задержка между добавлениями для лучшего UX
        setTimeout(() => {
          addSingleMediaToTimeline(file)
        }, index * 50)
      })
    },
    [addSingleMediaToTimeline],
  )

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Основные действия
    addMediaToTimeline,
    addSingleMediaToTimeline,

    // Утилиты
    getTrackTypeForMedia,
    findBestTrackForMedia,
    calculateClipStartTime,
  }
}
