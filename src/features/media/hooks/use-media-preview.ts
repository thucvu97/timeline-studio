import { useCallback, useState } from "react"

import { invoke } from "@tauri-apps/api/core"

import { indexedDBCacheService } from "../services/indexeddb-cache-service"

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
        // Сначала проверяем IndexedDB кэш
        const cachedThumbnail = await indexedDBCacheService.getCachedPreview(fileId)
        if (cachedThumbnail) {
          console.log(`[useMediaPreview] Preview found in IndexedDB cache for file: ${fileId}`)
          // Возвращаем в формате MediaPreviewData
          return {
            file_id: fileId,
            file_path: "", // Путь не сохраняется в кэше
            browser_thumbnail: {
              path: "", // Путь не сохраняется в кэше
              base64_data: cachedThumbnail,
              timestamp: 0,
              width: 0,
              height: 0,
            },
            last_updated: new Date().toISOString(),
            timeline_previews: [],
            recognition_frames: [],
          } as unknown as MediaPreviewData
        }

        // Если нет в кэше, запрашиваем с бэкенда
        const data = await invoke<MediaPreviewData | null>("get_media_preview_data", { fileId })

        // Сохраняем в кэш, если есть данные превью
        if (data?.browser_thumbnail?.base64_data) {
          await indexedDBCacheService.cachePreview(fileId, data.browser_thumbnail.base64_data)
          console.log(`[useMediaPreview] Preview cached in IndexedDB for file: ${fileId}`)
        }

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
    async (
      fileId: string,
      filePath: string,
      width: number,
      height: number,
      timestamp = 0,
    ): Promise<ThumbnailData | null> => {
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

        // Сохраняем в кэш, если есть base64 данные
        if (thumbnail?.base64_data) {
          await indexedDBCacheService.cachePreview(fileId, thumbnail.base64_data)
          console.log(`[useMediaPreview] Generated thumbnail cached in IndexedDB for file: ${fileId}`)
        }

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
        // Очищаем данные на бэкенде
        await invoke("clear_media_preview_data", { fileId })

        // Очищаем конкретное превью из IndexedDB кэша
        await indexedDBCacheService.deletePreview(fileId)

        console.log(`[useMediaPreview] Preview data cleared for file: ${fileId}`)
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
    async (
      fileId: string,
      frames: Array<{ timestamp: number; base64_data: string; is_keyframe: boolean }>,
    ): Promise<boolean> => {
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
        const frames = await invoke<Array<{ timestamp: number; base64_data: string; is_keyframe: boolean }>>(
          "get_timeline_frames",
          { fileId },
        )
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
