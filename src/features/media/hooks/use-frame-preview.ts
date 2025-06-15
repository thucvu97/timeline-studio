import { useCallback, useState } from "react"

import { invoke } from "@tauri-apps/api/core"

import {
  ExtractionPurpose,
  FrameExtractionService,
  TimelineFrame,
} from "@/features/video-compiler/services/frame-extraction-service"

import { useMediaPreview } from "./use-media-preview"

import type { MediaPreviewData } from "../types/preview"

export interface UseFramePreviewOptions {
  onFramesExtracted?: (frames: TimelineFrame[]) => void
  onError?: (error: string) => void
}

/**
 * Хук для интеграции извлечения кадров с Preview Manager
 * Объединяет функциональность Frame Extraction Service и Preview Manager
 */
export function useFramePreview(options: UseFramePreviewOptions = {}) {
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { getPreviewData, generateThumbnail } = useMediaPreview()
  const frameExtraction = FrameExtractionService.getInstance()

  /**
   * Извлечь кадры с кэшированием через Preview Manager
   */
  const extractTimelineFrames = useCallback(
    async (
      fileId: string,
      videoPath: string,
      duration: number,
      interval = 1.0,
      maxFrames?: number,
    ): Promise<TimelineFrame[]> => {
      try {
        setIsExtracting(true)
        setError(null)

        // Сначала проверяем IndexedDB кэш
        const indexedDBCached = await frameExtraction.getCachedFrames(videoPath)
        if (indexedDBCached && indexedDBCached.length > 0) {
          console.log(`Использованы кэшированные кадры из IndexedDB для ${videoPath}`)
          options.onFramesExtracted?.(indexedDBCached)
          return indexedDBCached
        }

        // Затем проверяем кэш Preview Manager
        const cachedData = await getPreviewData(fileId)
        if (cachedData?.timeline_frames && cachedData.timeline_frames.length > 0) {
          console.log(`Использованы кэшированные кадры из Preview Manager для ${fileId}`)
          const frames = cachedData.timeline_frames.map((frame) => ({
            timestamp: frame.timestamp,
            frameData: frame.base64_data,
            isKeyframe: frame.is_keyframe || false,
          }))

          // Сохраняем в IndexedDB для быстрого доступа
          await frameExtraction.cacheFramesInIndexedDB(videoPath, frames)
          options.onFramesExtracted?.(frames)

          return frames
        }

        // Если нет в кэше, извлекаем кадры
        const frames = await frameExtraction.extractTimelineFrames(videoPath, duration, interval, maxFrames)

        // Сохраняем кадры в Preview Manager для будущего использования
        if (frames.length > 0) {
          // Сохраняем первый кадр как browser thumbnail
          await generateThumbnail(fileId, videoPath, 320, 180, frames[0].timestamp)

          // Кэшируем кадры в IndexedDB для быстрого доступа
          await frameExtraction.cacheFramesInIndexedDB(videoPath, frames)

          // Сохраняем timeline frames в Preview Manager
          await invoke("save_timeline_frames", {
            file_id: fileId,
            frames: frames.map((frame) => ({
              timestamp: frame.timestamp,
              base64_data: frame.frameData,
              is_keyframe: frame.isKeyframe,
            })),
          })
        }

        options.onFramesExtracted?.(frames)
        return frames
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to extract frames"
        setError(errorMsg)
        options.onError?.(errorMsg)
        throw err
      } finally {
        setIsExtracting(false)
      }
    },
    [getPreviewData, generateThumbnail, frameExtraction, options],
  )

  /**
   * Извлечь кадры для распознавания с кэшированием
   */
  const extractRecognitionFrames = useCallback(
    async (
      fileId: string,
      videoPath: string,
      interval = 1.0,
      purpose: ExtractionPurpose = ExtractionPurpose.ObjectDetection,
    ) => {
      try {
        setIsExtracting(true)
        setError(null)

        // Проверяем кэш для recognition frames
        const cachedData = await getPreviewData(fileId)
        if (cachedData?.recognition_frames && cachedData.recognition_frames.length > 0) {
          console.log(`Использованы кэшированные recognition кадры для ${fileId}`)
          return cachedData.recognition_frames
        }

        // Извлекаем кадры для распознавания
        const frames = await frameExtraction.extractRecognitionFrames(videoPath, purpose, interval)

        return frames
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to extract recognition frames"
        setError(errorMsg)
        options.onError?.(errorMsg)
        throw err
      } finally {
        setIsExtracting(false)
      }
    },
    [getPreviewData, frameExtraction, options],
  )

  /**
   * Получить превью для конкретного таймстампа
   */
  const getFrameAtTimestamp = useCallback(
    async (fileId: string, videoPath: string, timestamp: number): Promise<string | null> => {
      try {
        // Сначала проверяем, есть ли уже сохраненный кадр для этого timestamp
        const previewData = await getPreviewData(fileId)

        if (previewData?.timeline_frames) {
          const frame = previewData.timeline_frames.find((f) => Math.abs(f.timestamp - timestamp) < 0.1)
          if (frame) {
            return frame.base64_data
          }
        }

        // Если нет, генерируем новый thumbnail
        const base64Data = await generateThumbnail(fileId, videoPath, 320, 180, timestamp)
        return base64Data
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to get frame at timestamp"
        setError(errorMsg)
        options.onError?.(errorMsg)
        return null
      }
    },
    [getPreviewData, generateThumbnail, options],
  )

  return {
    extractTimelineFrames,
    extractRecognitionFrames,
    getFrameAtTimestamp,
    isExtracting,
    error,
  }
}
