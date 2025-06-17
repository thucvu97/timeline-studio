import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { MediaProviders } from "@/test/test-utils"

import { useMediaPreview } from "../use-media-preview"

// Мокаем Tauri API
const mockInvoke = vi.fn()
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (cmd: string, args?: unknown) => mockInvoke(cmd, args),
}))

describe("useMediaPreview", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getPreviewData", () => {
    it("должен получать данные превью для файла", async () => {
      const mockPreviewData = {
        file_id: "test-file-123",
        file_path: "/path/to/video.mp4",
        browser_thumbnail: {
          path: "/cache/thumb.jpg",
          base64_data: "base64string",
          timestamp: 0,
          width: 320,
          height: 180,
        },
        timeline_previews: [],
        recognition_frames: [],
        recognition_results: null,
        last_updated: new Date().toISOString(),
      }

      mockInvoke.mockResolvedValueOnce(mockPreviewData)

      const { result } = renderHook(() => useMediaPreview(), {
        wrapper: MediaProviders,
      })

      let previewData
      await act(async () => {
        previewData = await result.current.getPreviewData("test-file-123")
      })

      expect(mockInvoke).toHaveBeenCalledWith("get_media_preview_data", {
        fileId: "test-file-123",
      })
      expect(previewData).toEqual(mockPreviewData)
    })

    it("должен возвращать null если данных нет", async () => {
      mockInvoke.mockResolvedValueOnce(null)

      const { result } = renderHook(() => useMediaPreview(), {
        wrapper: MediaProviders,
      })

      let previewData
      await act(async () => {
        previewData = await result.current.getPreviewData("non-existent")
      })

      expect(previewData).toBeNull()
    })

    it("должен обрабатывать ошибки", async () => {
      const error = new Error("Failed to get preview data")
      mockInvoke.mockRejectedValueOnce(error)

      const { result } = renderHook(() => useMediaPreview(), {
        wrapper: MediaProviders,
      })

      let previewData
      await act(async () => {
        previewData = await result.current.getPreviewData("test-file-123")
      })

      // Ошибки обрабатываются внутри хука и возвращается null
      expect(previewData).toBeNull()
      expect(result.current.error).toBe("Failed to get preview data")
    })
  })

  describe("generateThumbnail", () => {
    it("должен генерировать thumbnail для файла", async () => {
      const mockThumbnail = {
        path: "/cache/generated-thumb.jpg",
        base64_data: "newbase64string",
        timestamp: 2.5,
        width: 640,
        height: 360,
      }

      mockInvoke.mockResolvedValueOnce(mockThumbnail)

      const { result } = renderHook(() => useMediaPreview(), {
        wrapper: MediaProviders,
      })

      let thumbnail
      await act(async () => {
        thumbnail = await result.current.generateThumbnail(
          "test-file-123",
          "/path/to/video.mp4",
          640,
          360,
          2.5
        )
      })

      expect(mockInvoke).toHaveBeenCalledWith("generate_media_thumbnail", {
        fileId: "test-file-123",
        filePath: "/path/to/video.mp4",
        width: 640,
        height: 360,
        timestamp: 2.5,
      })
      expect(thumbnail).toEqual(mockThumbnail)
    })

    it("должен требовать обязательные параметры", async () => {
      mockInvoke.mockResolvedValueOnce("base64data")

      const { result } = renderHook(() => useMediaPreview(), {
        wrapper: MediaProviders,
      })

      await act(async () => {
        await result.current.generateThumbnail(
          "test-file-123",
          "/path/to/video.mp4",
          640,
          360
        )
      })

      expect(mockInvoke).toHaveBeenCalledWith("generate_media_thumbnail", {
        fileId: "test-file-123",
        filePath: "/path/to/video.mp4",
        width: 640,
        height: 360,
        timestamp: 0,
      })
    })
  })

  describe("clearPreviewData", () => {
    it("должен очищать данные превью для файла", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)

      const { result } = renderHook(() => useMediaPreview(), {
        wrapper: MediaProviders,
      })

      await act(async () => {
        await result.current.clearPreviewData("test-file-123")
      })

      expect(mockInvoke).toHaveBeenCalledWith("clear_media_preview_data", {
        fileId: "test-file-123",
      })
    })

    it("должен возвращать false при ошибке", async () => {
      mockInvoke.mockRejectedValueOnce(new Error("Clear failed"))

      const { result } = renderHook(() => useMediaPreview(), {
        wrapper: MediaProviders,
      })

      let success
      await act(async () => {
        success = await result.current.clearPreviewData("test-file-123")
      })

      expect(success).toBe(false)
      expect(result.current.error).toBe("Clear failed")
    })
  })

  describe("getFilesWithPreviews", () => {
    it("должен получать список файлов с превью", async () => {
      const mockFileIds = ["file1", "file2", "file3"]
      mockInvoke.mockResolvedValueOnce(mockFileIds)

      const { result } = renderHook(() => useMediaPreview(), {
        wrapper: MediaProviders,
      })

      let fileIds
      await act(async () => {
        fileIds = await result.current.getFilesWithPreviews()
      })

      expect(mockInvoke).toHaveBeenCalledWith("get_files_with_previews", undefined)
      expect(fileIds).toEqual(mockFileIds)
    })
  })

  describe("savePreviewData", () => {
    it("должен сохранять данные превью", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)

      const { result } = renderHook(() => useMediaPreview(), {
        wrapper: MediaProviders,
      })

      let success
      await act(async () => {
        success = await result.current.savePreviewData("/path/to/save")
      })

      expect(mockInvoke).toHaveBeenCalledWith("save_preview_data", {
        path: "/path/to/save",
      })
      expect(success).toBe(true)
    })
  })

  describe("loadPreviewData", () => {
    it("должен загружать данные превью", async () => {
      mockInvoke.mockResolvedValueOnce(undefined)

      const { result } = renderHook(() => useMediaPreview(), {
        wrapper: MediaProviders,
      })

      let success
      await act(async () => {
        success = await result.current.loadPreviewData("/path/to/load")
      })

      expect(mockInvoke).toHaveBeenCalledWith("load_preview_data", {
        path: "/path/to/load",
      })
      expect(success).toBe(true)
    })
  })
})