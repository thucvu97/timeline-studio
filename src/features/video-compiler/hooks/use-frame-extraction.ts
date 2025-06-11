import { useCallback, useEffect, useRef, useState } from "react"

import { toast } from "sonner"

import type { Subtitle } from "@/types/video-compiler"

import {
  ExtractionPurpose,
  type RecognitionFrame,
  type SubtitleFrame,
  type TimelineFrame,
  frameExtractionService,
} from "../services/frame-extraction-service"

export interface UseFrameExtractionOptions {
  /** Кэшировать ли результаты в IndexedDB */
  cacheResults?: boolean
  /** Автоматически загружать кадры при монтировании */
  autoLoad?: boolean
  /** Интервал между кадрами (секунды) */
  interval?: number
  /** Максимальное количество кадров */
  maxFrames?: number
}

export interface UseFrameExtractionResult {
  /** Кадры для timeline */
  timelineFrames: TimelineFrame[]
  /** Кадры для распознавания */
  recognitionFrames: RecognitionFrame[]
  /** Кадры субтитров */
  subtitleFrames: SubtitleFrame[]
  /** Загружаются ли кадры */
  isLoading: boolean
  /** Ошибка загрузки */
  error: Error | null
  /** Прогресс загрузки (0-100) */
  progress: number
  /** Извлечь кадры для timeline */
  extractTimelineFrames: (videoPath: string, duration: number) => Promise<void>
  /** Извлечь кадры для распознавания */
  extractRecognitionFrames: (videoPath: string, purpose: ExtractionPurpose) => Promise<void>
  /** Извлечь кадры для субтитров */
  extractSubtitleFrames: (videoPath: string, subtitles: Subtitle[]) => Promise<void>
  /** Очистить кэш */
  clearCache: () => Promise<void>
  /** Очистить состояние */
  reset: () => void
}

export function useFrameExtraction(options: UseFrameExtractionOptions = {}): UseFrameExtractionResult {
  const { cacheResults = true, interval = 1.0, maxFrames } = options

  const [timelineFrames, setTimelineFrames] = useState<TimelineFrame[]>([])
  const [recognitionFrames, setRecognitionFrames] = useState<RecognitionFrame[]>([])
  const [subtitleFrames, setSubtitleFrames] = useState<SubtitleFrame[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [progress, setProgress] = useState(0)

  const abortControllerRef = useRef<AbortController | null>(null)

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  /**
   * Извлечь кадры для timeline
   */
  const extractTimelineFrames = useCallback(
    async (videoPath: string, duration: number) => {
      try {
        setIsLoading(true)
        setError(null)
        setProgress(0)

        // Проверяем кэш
        if (cacheResults) {
          const cached = await frameExtractionService.getCachedFrames(videoPath)
          if (cached) {
            setTimelineFrames(cached)
            setProgress(100)
            return
          }
        }

        // Создаем новый контроллер для отмены
        abortControllerRef.current = new AbortController()

        // Извлекаем кадры
        const frames = await frameExtractionService.extractTimelineFrames(videoPath, duration, interval, maxFrames)

        // Проверяем, не была ли операция отменена
        if (abortControllerRef.current?.signal.aborted) {
          return
        }

        setTimelineFrames(frames)
        setProgress(100)

        // Кэшируем результаты
        if (cacheResults && frames.length > 0) {
          await frameExtractionService.cacheFramesInIndexedDB(videoPath, frames)
        }
      } catch (err) {
        const error = err as Error
        console.error("Failed to extract timeline frames:", error)
        setError(error)
        toast.error("Не удалось извлечь кадры для timeline")
      } finally {
        setIsLoading(false)
      }
    },
    [cacheResults, interval, maxFrames],
  )

  /**
   * Извлечь кадры для распознавания
   */
  const extractRecognitionFrames = useCallback(
    async (videoPath: string, purpose: ExtractionPurpose) => {
      try {
        setIsLoading(true)
        setError(null)
        setProgress(0)

        const frames = await frameExtractionService.extractRecognitionFrames(videoPath, purpose, interval)

        setRecognitionFrames(frames)
        setProgress(100)
      } catch (err) {
        const error = err as Error
        console.error("Failed to extract recognition frames:", error)
        setError(error)
        toast.error("Не удалось извлечь кадры для распознавания")
      } finally {
        setIsLoading(false)
      }
    },
    [interval],
  )

  /**
   * Извлечь кадры для субтитров
   */
  const extractSubtitleFrames = useCallback(async (videoPath: string, subtitles: Subtitle[]) => {
    try {
      setIsLoading(true)
      setError(null)
      setProgress(0)

      const frames = await frameExtractionService.extractSubtitleFrames(videoPath, subtitles)

      setSubtitleFrames(frames)
      setProgress(100)
    } catch (err) {
      const error = err as Error
      console.error("Failed to extract subtitle frames:", error)
      setError(error)
      toast.error("Не удалось извлечь кадры для субтитров")
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Очистить кэш
   */
  const clearCache = useCallback(async () => {
    try {
      await frameExtractionService.clearFrameCache()
      toast.success("Кэш кадров очищен")
    } catch (err) {
      console.error("Failed to clear cache:", err)
      toast.error("Не удалось очистить кэш")
    }
  }, [])

  /**
   * Сбросить состояние
   */
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setTimelineFrames([])
    setRecognitionFrames([])
    setSubtitleFrames([])
    setIsLoading(false)
    setError(null)
    setProgress(0)
  }, [])

  return {
    timelineFrames,
    recognitionFrames,
    subtitleFrames,
    isLoading,
    error,
    progress,
    extractTimelineFrames,
    extractRecognitionFrames,
    extractSubtitleFrames,
    clearCache,
    reset,
  }
}

/**
 * Hook для умной генерации превью timeline
 */
export function useSmartTimelinePreviews(
  videoPath: string | null,
  duration: number,
  containerWidth: number,
  options: UseFrameExtractionOptions = {},
) {
  const { extractTimelineFrames, timelineFrames, isLoading, error, progress } = useFrameExtraction(options)

  const frameWidth = 160 // Стандартная ширина кадра превью

  useEffect(() => {
    if (!videoPath || duration <= 0 || containerWidth <= 0) {
      return
    }

    // Вычисляем оптимальное количество кадров
    const maxFrames = Math.floor(containerWidth / frameWidth)
    const interval = duration / maxFrames

    // Извлекаем кадры
    void extractTimelineFrames(videoPath, duration)
  }, [videoPath, duration, containerWidth, extractTimelineFrames])

  return {
    frames: timelineFrames,
    isLoading,
    error,
    progress,
    frameWidth,
  }
}
