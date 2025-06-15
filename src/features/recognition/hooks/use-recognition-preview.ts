import { useCallback, useState } from "react"

import { invoke } from "@tauri-apps/api/core"

import { useMediaPreview } from "@/features/media/hooks/use-media-preview"

import type { YoloDetection, YoloVideoData } from "../types/yolo"

export interface UseRecognitionPreviewOptions {
  onRecognitionComplete?: (fileId: string, data: YoloVideoData) => void
  onError?: (error: string) => void
}

/**
 * Хук для интеграции распознавания с Preview Manager
 * Объединяет функциональность распознавания и кэширования превью
 */
export function useRecognitionPreview(options: UseRecognitionPreviewOptions = {}) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { getPreviewData } = useMediaPreview()

  /**
   * Запустить распознавание видео с кэшированием результатов
   */
  const processVideoRecognition = useCallback(
    async (
      fileId: string,
      videoPath: string,
      modelPath?: string,
      targetClasses?: string[],
    ): Promise<YoloVideoData | null> => {
      try {
        setIsProcessing(true)
        setError(null)

        // Проверяем кэш Preview Manager
        const cachedData = await getPreviewData(fileId)
        if (cachedData?.recognition_results) {
          console.log(`Использованы кэшированные результаты распознавания для ${fileId}`)
          const yoloData = cachedData.recognition_results as YoloVideoData
          options.onRecognitionComplete?.(fileId, yoloData)
          return yoloData
        }

        // Запускаем распознавание
        const result = await invoke<YoloVideoData>("process_video_recognition", {
          videoPath,
          modelPath,
          targetClasses,
        })

        options.onRecognitionComplete?.(fileId, result)
        return result
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to process video recognition"
        setError(errorMsg)
        options.onError?.(errorMsg)
        return null
      } finally {
        setIsProcessing(false)
      }
    },
    [getPreviewData, options],
  )

  /**
   * Получить результаты распознавания для конкретного времени
   */
  const getRecognitionAtTimestamp = useCallback(
    async (fileId: string, timestamp: number): Promise<YoloDetection[]> => {
      try {
        // Сначала проверяем кэш
        const previewData = await getPreviewData(fileId)

        if (previewData?.recognition_results) {
          const yoloData = previewData.recognition_results as YoloVideoData

          // Находим ближайший кадр к запрошенному timestamp
          const closestFrame = yoloData.frames.reduce((prev, curr) => {
            return Math.abs(curr.timestamp - timestamp) < Math.abs(prev.timestamp - timestamp) ? curr : prev
          })

          return closestFrame.detections
        }

        return []
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to get recognition at timestamp"
        console.error(errorMsg)
        return []
      }
    },
    [getPreviewData],
  )

  /**
   * Получить превью с наложенными результатами распознавания
   */
  const getPreviewWithRecognition = useCallback(
    async (fileId: string): Promise<string | null> => {
      try {
        const data = await invoke<{ preview_with_boxes?: string } | null>("get_preview_data_with_recognition", {
          fileId,
        })

        return data?.preview_with_boxes || null
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to get preview with recognition"
        setError(errorMsg)
        options.onError?.(errorMsg)
        return null
      }
    },
    [options],
  )

  /**
   * Обработать batch видео для распознавания
   */
  const processBatchRecognition = useCallback(
    async (
      files: Array<{ id: string; path: string }>,
      modelPath?: string,
      targetClasses?: string[],
    ): Promise<Map<string, YoloVideoData>> => {
      try {
        setIsProcessing(true)
        setError(null)

        const results = new Map<string, YoloVideoData>()

        // Обрабатываем файлы параллельно, но с ограничением
        const batchSize = 3
        for (let i = 0; i < files.length; i += batchSize) {
          const batch = files.slice(i, i + batchSize)

          const batchResults = await Promise.all(
            batch.map((file) =>
              processVideoRecognition(file.id, file.path, modelPath, targetClasses).then((data) => ({
                id: file.id,
                data,
              })),
            ),
          )

          batchResults.forEach(({ id, data }) => {
            if (data) {
              results.set(id, data)
            }
          })
        }

        return results
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to process batch recognition"
        setError(errorMsg)
        options.onError?.(errorMsg)
        return new Map()
      } finally {
        setIsProcessing(false)
      }
    },
    [processVideoRecognition, options],
  )

  /**
   * Очистить результаты распознавания
   */
  const clearRecognitionResults = useCallback(
    async (fileId: string): Promise<boolean> => {
      try {
        await invoke("clear_recognition_results", { fileId })
        return true
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to clear recognition results"
        setError(errorMsg)
        options.onError?.(errorMsg)
        return false
      }
    },
    [options],
  )

  return {
    processVideoRecognition,
    getRecognitionAtTimestamp,
    getPreviewWithRecognition,
    processBatchRecognition,
    clearRecognitionResults,
    isProcessing,
    error,
  }
}
