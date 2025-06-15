import { useCallback, useState } from "react"

import { invoke } from "@tauri-apps/api/core"

import type { MediaPreviewData, ThumbnailData } from "../types/preview"

export interface UseMediaPreviewOptions {
  onThumbnailGenerated?: (fileId: string, thumbnail: ThumbnailData) => void
  onError?: (error: string) => void
}

export function useMediaPreview(options: UseMediaPreviewOptions = {}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getPreviewData = useCallback(
    async (fileId: string): Promise<MediaPreviewData | null> => {
      try {
        const data = await invoke<MediaPreviewData | null>("get_media_preview_data", { fileId })
        return data
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to get preview data"
        setError(errorMsg)
        options.onError?.(errorMsg)
        return null
      }
    },
    [options],
  )

  const generateThumbnail = useCallback(
    async (fileId: string, filePath: string, width: number, height: number, timestamp = 0): Promise<string | null> => {
      try {
        setIsGenerating(true)
        setError(null)

        const base64Data = await invoke<string>("generate_media_thumbnail", {
          fileId,
          filePath,
          width,
          height,
          timestamp,
        })

        // Notify callback if provided
        if (options.onThumbnailGenerated) {
          const thumbnail: ThumbnailData = {
            path: "", // Path is managed by backend
            base64_data: base64Data,
            timestamp,
            width,
            height,
          }
          options.onThumbnailGenerated(fileId, thumbnail)
        }

        return base64Data
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to generate thumbnail"
        setError(errorMsg)
        options.onError?.(errorMsg)
        return null
      } finally {
        setIsGenerating(false)
      }
    },
    [options],
  )

  const clearPreviewData = useCallback(
    async (fileId: string): Promise<boolean> => {
      try {
        await invoke("clear_media_preview_data", { fileId })
        return true
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to clear preview data"
        setError(errorMsg)
        options.onError?.(errorMsg)
        return false
      }
    },
    [options],
  )

  const getFilesWithPreviews = useCallback(async (): Promise<string[]> => {
    try {
      const files = await invoke<string[]>("get_files_with_previews")
      return files
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to get files with previews"
      setError(errorMsg)
      options.onError?.(errorMsg)
      return []
    }
  }, [options])

  const savePreviewData = useCallback(
    async (path: string): Promise<boolean> => {
      try {
        await invoke("save_preview_data", { path })
        return true
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to save preview data"
        setError(errorMsg)
        options.onError?.(errorMsg)
        return false
      }
    },
    [options],
  )

  const loadPreviewData = useCallback(
    async (path: string): Promise<boolean> => {
      try {
        await invoke("load_preview_data", { path })
        return true
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to load preview data"
        setError(errorMsg)
        options.onError?.(errorMsg)
        return false
      }
    },
    [options],
  )

  return {
    // Data operations
    getPreviewData,
    generateThumbnail,
    clearPreviewData,
    getFilesWithPreviews,
    savePreviewData,
    loadPreviewData,

    // State
    isGenerating,
    error,
  }
}
