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
    async (fileId: string, filePath: string, width: number, height: number, timestamp = 0): Promise<ThumbnailData | null> => {
      try {
        setIsGenerating(true)
        setError(null)

        const thumbnail = await invoke<ThumbnailData>("generate_media_thumbnail", {
          fileId,
          filePath,
          width,
          height,
          timestamp,
        })

        // Notify callback if provided
        if (options.onThumbnailGenerated) {
          options.onThumbnailGenerated(fileId, thumbnail)
        }

        return thumbnail
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

  const getAllFilesWithPreviews = useCallback(async (): Promise<string[]> => {
    return getFilesWithPreviews()
  }, [getFilesWithPreviews])

  const saveTimelineFrames = useCallback(
    async (fileId: string, frames: Array<{ timestamp: number; base64_data: string; is_keyframe: boolean }>): Promise<boolean> => {
      try {
        await invoke("save_timeline_frames", { fileId, frames })
        return true
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to save timeline frames"
        setError(errorMsg)
        options.onError?.(errorMsg)
        return false
      }
    },
    [options],
  )

  const getTimelineFrames = useCallback(
    async (fileId: string): Promise<Array<{ timestamp: number; base64_data: string; is_keyframe: boolean }>> => {
      try {
        const frames = await invoke<Array<{ timestamp: number; base64_data: string; is_keyframe: boolean }>>("get_timeline_frames", { fileId })
        return frames
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to get timeline frames"
        setError(errorMsg)
        options.onError?.(errorMsg)
        return []
      }
    },
    [options],
  )

  return {
    // Data operations
    getPreviewData,
    generateThumbnail,
    clearPreviewData,
    getAllFilesWithPreviews,
    getFilesWithPreviews,
    savePreviewData,
    loadPreviewData,
    saveTimelineFrames,
    getTimelineFrames,

    // State
    isGenerating,
    error,
  }
}
