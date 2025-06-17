import { convertFileSrc, invoke } from "@tauri-apps/api/core"
import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"


import { useSimpleMediaProcessor } from "../../hooks/use-simple-media-processor"

import type { MediaFile } from "../../types/media"

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
  convertFileSrc: vi.fn((path: string) => path),
}))

const mockInvoke = vi.mocked(invoke)
const mockConvertFileSrc = vi.mocked(convertFileSrc)

describe("useSimpleMediaProcessor", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useSimpleMediaProcessor())

    expect(result.current.isProcessing).toBe(false)
    expect(result.current.progress).toEqual({ current: 0, total: 0 })
    expect(typeof result.current.processFiles).toBe("function")
    expect(typeof result.current.getFileUrl).toBe("function")
  })

  it("should process files successfully", async () => {
    const mockProcessedFile = {
      id: "file-123",
      path: "/path/to/video.mp4",
      name: "video.mp4",
      size: 1024000,
      metadata: {
        duration: 120,
        width: 1920,
        height: 1080,
        fps: 30,
        has_video: true,
        has_audio: true,
      },
    }

    mockInvoke.mockResolvedValueOnce(mockProcessedFile)

    const { result } = renderHook(() => useSimpleMediaProcessor())

    let processedFiles: MediaFile[] = []
    await act(async () => {
      processedFiles = await result.current.processFiles(["/path/to/video.mp4"])
    })

    expect(processedFiles).toHaveLength(1)
    expect(processedFiles[0]).toMatchObject({
      id: "file-123",
      name: "video.mp4",
      path: "/path/to/video.mp4",
      size: 1024000,
      duration: 120,
      isVideo: true,
      isAudio: false,
      isImage: false,
    })
  })

  it("should handle processing errors gracefully", async () => {
    mockInvoke.mockRejectedValueOnce(new Error("Failed to process"))

    const { result } = renderHook(() => useSimpleMediaProcessor())

    let processedFiles: MediaFile[] = []
    await act(async () => {
      processedFiles = await result.current.processFiles(["/path/to/invalid.mp4"])
    })

    expect(processedFiles).toHaveLength(1)
    expect(processedFiles[0]).toMatchObject({
      name: "invalid.mp4",
      path: "/path/to/invalid.mp4",
      size: 0,
      isVideo: true,
      isAudio: false,
      isImage: false,
    })
  })

  it("should update progress during processing", async () => {
    const onProgress = vi.fn()
    const { result } = renderHook(() => useSimpleMediaProcessor({ onProgress }))

    mockInvoke
      .mockResolvedValueOnce({
        id: "file-1",
        path: "/path/to/video1.mp4",
        name: "video1.mp4",
        size: 1024000,
      })
      .mockResolvedValueOnce({
        id: "file-2",
        path: "/path/to/video2.mp4",
        name: "video2.mp4",
        size: 2048000,
      })

    await act(async () => {
      await result.current.processFiles(["/path/to/video1.mp4", "/path/to/video2.mp4"])
    })

    expect(onProgress).toHaveBeenCalledWith(0, 2)
    expect(onProgress).toHaveBeenCalledWith(1, 2)
    expect(onProgress).toHaveBeenCalledWith(2, 2)
  })

  it("should identify file types correctly", async () => {
    const testFiles = [
      { path: "/video.mp4", isVideo: true, isAudio: false, isImage: false },
      { path: "/audio.mp3", isVideo: false, isAudio: true, isImage: false },
      { path: "/image.jpg", isVideo: false, isAudio: false, isImage: true },
    ]

    for (const testFile of testFiles) {
      mockInvoke.mockResolvedValueOnce({
        id: `file-${Date.now()}`,
        path: testFile.path,
        name: testFile.path.split("/").pop(),
        size: 1024,
        metadata: {
          has_video: testFile.isVideo,
          has_audio: testFile.isAudio,
        },
      })

      const { result } = renderHook(() => useSimpleMediaProcessor())

      let processedFiles: MediaFile[] = []
      await act(async () => {
        processedFiles = await result.current.processFiles([testFile.path])
      })

      expect(processedFiles[0].isVideo).toBe(testFile.isVideo)
      expect(processedFiles[0].isAudio).toBe(testFile.isAudio)
      expect(processedFiles[0].isImage).toBe(testFile.isImage)
    }
  })

  it("should generate thumbnail when requested", async () => {
    const mockProcessedFile = {
      id: "file-123",
      path: "/path/to/video.mp4",
      name: "video.mp4",
      size: 1024000,
      thumbnail_path: "/path/to/thumbnail.jpg",
      metadata: {
        has_video: true,
      },
    }

    mockInvoke.mockResolvedValueOnce(mockProcessedFile)

    const { result } = renderHook(() => useSimpleMediaProcessor({ generateThumbnails: true }))

    let processedFiles: MediaFile[] = []
    await act(async () => {
      processedFiles = await result.current.processFiles(["/path/to/video.mp4"])
    })

    expect(processedFiles[0].thumbnailPath).toBe("/path/to/thumbnail.jpg")
  })

  it("should process multiple files in sequence", async () => {
    const files = ["/video1.mp4", "/video2.mp4", "/video3.mp4"]

    files.forEach((file, index) => {
      mockInvoke.mockResolvedValueOnce({
        id: `file-${index}`,
        path: file,
        name: file.split("/").pop(),
        size: 1024 * (index + 1),
      })
    })

    const { result } = renderHook(() => useSimpleMediaProcessor())

    let processedFiles: MediaFile[] = []
    await act(async () => {
      processedFiles = await result.current.processFiles(files)
    })

    expect(processedFiles).toHaveLength(3)
    expect(processedFiles[0].name).toBe("video1.mp4")
    expect(processedFiles[1].name).toBe("video2.mp4")
    expect(processedFiles[2].name).toBe("video3.mp4")
  })

  it("should convert file path to URL using convertFileSrc", () => {
    const { result } = renderHook(() => useSimpleMediaProcessor())

    const url = result.current.getFileUrl("/path/to/video.mp4")

    // The mock returns the path as-is since we mocked it to return the path directly
    expect(url).toBe("/path/to/video.mp4")
  })
})
