/**
 * Hook для preview эффектов в real-time
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { useEffects } from "@/features/effects/hooks/use-effects"
import type { TimelineClip } from "../types"
import { 
  getEffectsPlayerIntegration, 
  disposeEffectsPlayerIntegration,
  type EffectsPlayerConfig 
} from "../services/effects-player-integration"

export interface UseEffectsPreviewOptions extends EffectsPlayerConfig {
  enabled?: boolean
  autoStart?: boolean
}

export interface UseEffectsPreviewReturn {
  // Canvas с обработанным видео
  processedCanvas: HTMLCanvasElement | null
  
  // Состояние
  isProcessing: boolean
  isInitialized: boolean
  error: string | null
  
  // Управление
  startProcessing: (videoElement: HTMLVideoElement) => void
  stopProcessing: () => void
  processFrame: (videoElement: HTMLVideoElement, time: number) => Promise<void>
  setClip: (clip: TimelineClip | null) => void
  
  // Утилиты
  getFFmpegCommands: () => string[]
}

export function useEffectsPreview(
  options: UseEffectsPreviewOptions = {}
): UseEffectsPreviewReturn {
  const { enabled = true, autoStart = true, ...config } = options
  const { effects: availableEffects } = useEffects()
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processedCanvas, setProcessedCanvas] = useState<HTMLCanvasElement | null>(null)
  
  const integrationRef = useRef(getEffectsPlayerIntegration(config))
  const currentClipRef = useRef<TimelineClip | null>(null)
  const videoElementRef = useRef<HTMLVideoElement | null>(null)

  // Инициализация
  useEffect(() => {
    if (!enabled) return

    const initialize = async () => {
      try {
        await integrationRef.current.initialize(availableEffects)
        setIsInitialized(true)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize effects")
        console.error("Effects preview initialization error:", err)
      }
    }

    initialize()

    return () => {
      // Очистка при размонтировании
      if (isProcessing) {
        integrationRef.current.stopRealtimeProcessing()
      }
    }
  }, [enabled, availableEffects])

  // Установка текущего клипа
  const setClip = useCallback((clip: TimelineClip | null) => {
    currentClipRef.current = clip
    integrationRef.current.setCurrentClip(clip)
    
    // Если обработка идет и клип изменился, перезапускаем
    if (isProcessing && videoElementRef.current && autoStart) {
      integrationRef.current.stopRealtimeProcessing()
      integrationRef.current.startRealtimeProcessing(
        videoElementRef.current,
        (canvas) => setProcessedCanvas(canvas)
      )
    }
  }, [isProcessing, autoStart])

  // Начать обработку
  const startProcessing = useCallback((videoElement: HTMLVideoElement) => {
    if (!isInitialized || !enabled) return
    
    videoElementRef.current = videoElement
    setIsProcessing(true)
    setError(null)

    integrationRef.current.startRealtimeProcessing(
      videoElement,
      (canvas) => setProcessedCanvas(canvas)
    )
  }, [isInitialized, enabled])

  // Остановить обработку
  const stopProcessing = useCallback(() => {
    integrationRef.current.stopRealtimeProcessing()
    setIsProcessing(false)
    videoElementRef.current = null
  }, [])

  // Обработать один кадр
  const processFrame = useCallback(async (
    videoElement: HTMLVideoElement, 
    time: number
  ) => {
    if (!isInitialized || !enabled) return
    
    try {
      const canvas = await integrationRef.current.processVideoFrame(videoElement, time)
      if (canvas) {
        setProcessedCanvas(canvas)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process frame")
    }
  }, [isInitialized, enabled])

  // Получить FFmpeg команды
  const getFFmpegCommands = useCallback(() => {
    if (!currentClipRef.current) return []
    return integrationRef.current.getFFmpegCommands(currentClipRef.current)
  }, [])

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (isProcessing) {
        integrationRef.current.stopRealtimeProcessing()
      }
    }
  }, [isProcessing])

  return {
    processedCanvas,
    isProcessing,
    isInitialized,
    error,
    startProcessing,
    stopProcessing,
    processFrame,
    setClip,
    getFFmpegCommands,
  }
}