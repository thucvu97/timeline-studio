import { useCallback, useState } from "react"

import { invoke } from "@tauri-apps/api/core"

export interface PreviewRequest {
  video_path: string
  timestamp: number
  resolution?: [number, number]
  quality?: number
}

export interface PreviewResult {
  timestamp: number
  image_data?: string // base64 encoded image
  error?: string
}

interface UseBatchPreviewReturn {
  generateBatch: (requests: PreviewRequest[]) => Promise<PreviewResult[]>
  isGenerating: boolean
  error: string | null
  progress: number // 0 to 100
}

export function useBatchPreview(): UseBatchPreviewReturn {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const generateBatch = useCallback(async (requests: PreviewRequest[]): Promise<PreviewResult[]> => {
    try {
      setIsGenerating(true)
      setError(null)
      setProgress(0)

      // Симулируем прогресс (так как нет события прогресса от бэкенда)
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const results = await invoke<PreviewResult[]>("generate_preview_batch", { requests })

      clearInterval(progressInterval)
      setProgress(100)

      return results
    } catch (err) {
      console.error("Failed to generate preview batch:", err)
      setError(err instanceof Error ? err.message : "Не удалось сгенерировать превью")
      return []
    } finally {
      setIsGenerating(false)
      // Сбрасываем прогресс через небольшую задержку
      setTimeout(() => setProgress(0), 500)
    }
  }, [])

  return {
    generateBatch,
    isGenerating,
    error,
    progress,
  }
}
