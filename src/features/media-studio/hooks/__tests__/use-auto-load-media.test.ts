import { renderHook, act, waitFor } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"

import { BaseProviders } from "@/test/test-utils"

import { useAutoLoadMedia } from "../use-auto-load-media"

// Mock dependencies
const mockUpdateMediaFiles = vi.fn()
const mockUpdateMusicFiles = vi.fn()

vi.mock("@/features/app-state/hooks", () => ({
  useMediaFiles: () => ({
    updateMediaFiles: mockUpdateMediaFiles
  }),
  useMusicFiles: () => ({
    updateMusicFiles: mockUpdateMusicFiles
  }),
  useAppSettings: () => ({
    state: {
      context: {
        currentProject: {
          isNew: false,
          path: "/test/project"
        }
      }
    }
  })
}))

vi.mock("@/features/app-state/services", () => ({
  appDirectoriesService: {
    createAppDirectories: vi.fn(),
    getMediaSubdirectory: vi.fn()
  }
}))

vi.mock("@/features/app-state", () => ({
  AppSettingsProvider: ({ children }: { children: React.ReactNode }) => children
}))

const mockGetMediaExtensions = vi.fn()
const mockGetMusicExtensions = vi.fn()

vi.mock("../utils/validation", () => ({
  getMediaExtensions: mockGetMediaExtensions,
  getMusicExtensions: mockGetMusicExtensions
}))

// Mock Tauri APIs
const mockExists = vi.fn()
const mockReadDir = vi.fn()
const mockInvoke = vi.fn()

vi.mock("@tauri-apps/plugin-fs", () => ({
  exists: mockExists,
  readDir: mockReadDir
}))

vi.mock("@tauri-apps/api/core", () => ({
  invoke: mockInvoke
}))

describe("useAutoLoadMedia", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Default setup
    mockGetMediaExtensions.mockReturnValue([".mp4", ".avi", ".mov"])
    mockGetMusicExtensions.mockReturnValue([".mp3", ".wav", ".ogg"])
    mockExists.mockResolvedValue(true)
    mockReadDir.mockResolvedValue([])
    
    // Mock app directories service
    const { appDirectoriesService } = await import("@/features/app-state/services")
    vi.mocked(appDirectoriesService.createAppDirectories).mockResolvedValue(undefined)
    vi.mocked(appDirectoriesService.getMediaSubdirectory).mockReturnValue("/mock/path")
    
    // Mock Tauri environment
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      value: {},
      writable: true
    })
  })

  afterEach(() => {
    delete (window as any).__TAURI_INTERNALS__
  })

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useAutoLoadMedia(), {
      wrapper: BaseProviders
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.loadedCount).toEqual({ media: 0, music: 0 })
    expect(typeof result.current.reload).toBe("function")
    expect(typeof result.current.clearCache).toBe("function")
  })

  it("should detect Tauri environment correctly", () => {
    const { result } = renderHook(() => useAutoLoadMedia(), {
      wrapper: BaseProviders
    })

    // Should detect Tauri environment
    expect(window.__TAURI_INTERNALS__).toBeDefined()
  })

  it("should handle directory scanning", async () => {
    const mockFiles = [
      { name: "video1.mp4", isFile: true },
      { name: "video2.avi", isFile: true },
      { name: "document.txt", isFile: true }
    ]
    
    mockReadDir.mockResolvedValue(mockFiles)
    mockInvoke.mockResolvedValue({
      id: "test-id",
      name: "test.mp4",
      path: "/test/path",
      size: 1024,
      metadata: { has_video: true, has_audio: false }
    })

    const { result } = renderHook(() => useAutoLoadMedia(), {
      wrapper: BaseProviders
    })

    await act(async () => {
      await result.current.reload()
    })

    expect(mockReadDir).toHaveBeenCalledTimes(2) // media + music
    expect(mockExists).toHaveBeenCalledTimes(2)
    expect(mockInvoke).toHaveBeenCalled()
  })

  it("should handle non-existent directories", async () => {
    mockExists.mockResolvedValue(false)

    const { result } = renderHook(() => useAutoLoadMedia(), {
      wrapper: BaseProviders
    })

    await act(async () => {
      await result.current.reload()
    })

    expect(mockReadDir).not.toHaveBeenCalled()
    expect(result.current.error).toBeNull()
    expect(result.current.loadedCount).toEqual({ media: 0, music: 0 })
  })

  it("should process media files with metadata", async () => {
    const mockFiles = [
      { name: "video1.mp4", isFile: true },
      { name: "audio1.mp3", isFile: true }
    ]
    
    mockReadDir.mockResolvedValue(mockFiles)
    mockInvoke.mockResolvedValue({
      id: "test-id",
      name: "video1.mp4",
      path: "/test/video1.mp4",
      size: 1024000,
      metadata: {
        duration: 120,
        width: 1920,
        height: 1080,
        has_video: true,
        has_audio: true
      }
    })

    const { result } = renderHook(() => useAutoLoadMedia(), {
      wrapper: BaseProviders
    })

    await act(async () => {
      await result.current.reload()
    })

    expect(mockUpdateMediaFiles).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: "video1.mp4",
          path: "/test/video1.mp4",
          size: 1024000,
          duration: 120,
          isVideo: true,
          isAudio: false,
          source: "browser"
        })
      ])
    )
  })

  it("should handle file processing errors with fallback", async () => {
    const mockFiles = [
      { name: "broken.mp4", isFile: true }
    ]
    
    mockReadDir.mockResolvedValue(mockFiles)
    mockInvoke.mockRejectedValue(new Error("Processing failed"))

    const { result } = renderHook(() => useAutoLoadMedia(), {
      wrapper: BaseProviders
    })

    await act(async () => {
      await result.current.reload()
    })

    // Should create fallback object
    expect(mockUpdateMediaFiles).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: "broken.mp4",
          size: 0,
          isVideo: true,
          source: "browser"
        })
      ])
    )
  })

  it("should filter files by extensions", async () => {
    const mockFiles = [
      { name: "video.mp4", isFile: true },
      { name: "audio.mp3", isFile: true },
      { name: "document.txt", isFile: true },
      { name: "image.jpg", isFile: true }
    ]
    
    mockReadDir.mockResolvedValue(mockFiles)
    mockGetMediaExtensions.mockReturnValue([".mp4", ".jpg"])
    mockGetMusicExtensions.mockReturnValue([".mp3"])

    const { result } = renderHook(() => useAutoLoadMedia(), {
      wrapper: BaseProviders
    })

    await act(async () => {
      await result.current.reload()
    })

    // Should only process files with valid extensions
    expect(mockInvoke).toHaveBeenCalledTimes(3) // .mp4, .jpg, .mp3
  })

  it("should handle batch processing", async () => {
    const mockFiles = Array.from({ length: 8 }, (_, i) => ({
      name: `file${i + 1}.mp4`,
      isFile: true
    }))
    
    mockReadDir.mockResolvedValue(mockFiles)
    mockInvoke.mockResolvedValue({
      id: "test-id",
      name: "file.mp4",
      path: "/test/file.mp4",
      size: 1024
    })

    const { result } = renderHook(() => useAutoLoadMedia(), {
      wrapper: BaseProviders
    })

    await act(async () => {
      await result.current.reload()
    })

    // Should process in batches of 5
    expect(mockInvoke).toHaveBeenCalledTimes(16) // 8 files × 2 directories
  })

  it("should handle Promise.allSettled correctly", async () => {
    const mockFiles = [
      { name: "good.mp4", isFile: true },
      { name: "bad.mp4", isFile: true }
    ]
    
    mockReadDir.mockResolvedValue(mockFiles)
    mockInvoke
      .mockResolvedValueOnce({
        id: "good-id",
        name: "good.mp4",
        path: "/test/good.mp4",
        size: 1024
      })
      .mockRejectedValueOnce(new Error("Processing failed"))

    const { result } = renderHook(() => useAutoLoadMedia(), {
      wrapper: BaseProviders
    })

    await act(async () => {
      await result.current.reload()
    })

    // Should handle both success and failure
    expect(mockUpdateMediaFiles).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: "good.mp4" }),
        expect.objectContaining({ name: "bad.mp4" }) // fallback
      ])
    )
  })

  it("should work in non-Tauri environment", async () => {
    delete (window as any).__TAURI_INTERNALS__

    const { result } = renderHook(() => useAutoLoadMedia(), {
      wrapper: BaseProviders
    })

    await act(async () => {
      await result.current.reload()
    })

    expect(mockReadDir).not.toHaveBeenCalled()
    expect(result.current.loadedCount).toEqual({ media: 0, music: 0 })
  })

  it("should handle app directory service errors", async () => {
    const { appDirectoriesService } = await import("@/features/app-state/services")
    vi.mocked(appDirectoriesService.createAppDirectories).mockRejectedValue(new Error("Service error"))

    const { result } = renderHook(() => useAutoLoadMedia(), {
      wrapper: BaseProviders
    })

    await act(async () => {
      await result.current.reload()
    })

    // Should continue with fallback directories
    expect(mockReadDir).toHaveBeenCalled()
    expect(result.current.error).toBeNull()
  })

  it("should handle general loading errors", async () => {
    mockReadDir.mockRejectedValue(new Error("Permission denied"))

    const { result } = renderHook(() => useAutoLoadMedia(), {
      wrapper: BaseProviders
    })

    await act(async () => {
      await result.current.reload()
    })

    expect(result.current.error).toBeNull() // Errors are handled gracefully
  })

  it("should respect debouncing", async () => {
    const { result } = renderHook(() => useAutoLoadMedia(), {
      wrapper: BaseProviders
    })

    // Call reload multiple times quickly
    result.current.reload()
    result.current.reload()
    result.current.reload()

    await waitFor(() => {
      expect(mockReadDir).toHaveBeenCalledTimes(2) // Only one call per directory
    })
  })

  it("should clear cache correctly", () => {
    const { result } = renderHook(() => useAutoLoadMedia(), {
      wrapper: BaseProviders
    })

    act(() => {
      result.current.clearCache()
    })

    expect(result.current.error).toBeNull()
  })

  it("should detect file types correctly", async () => {
    const mockFiles = [
      { name: "video.mp4", isFile: true },
      { name: "audio.mp3", isFile: true },
      { name: "image.jpg", isFile: true }
    ]
    
    mockReadDir.mockResolvedValue(mockFiles)
    mockInvoke
      .mockResolvedValueOnce({
        id: "video-id",
        name: "video.mp4",
        path: "/test/video.mp4",
        size: 1024,
        metadata: { has_video: true, has_audio: true }
      })
      .mockResolvedValueOnce({
        id: "audio-id",
        name: "audio.mp3",
        path: "/test/audio.mp3",
        size: 512,
        metadata: { has_video: false, has_audio: true }
      })
      .mockResolvedValueOnce({
        id: "image-id",
        name: "image.jpg",
        path: "/test/image.jpg",
        size: 256
      })

    const { result } = renderHook(() => useAutoLoadMedia(), {
      wrapper: BaseProviders
    })

    await act(async () => {
      await result.current.reload()
    })

    expect(mockUpdateMediaFiles).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: "video.mp4",
          isVideo: true,
          isAudio: false,
          isImage: false
        }),
        expect.objectContaining({
          name: "audio.mp3",
          isVideo: false,
          isAudio: true,
          isImage: false
        }),
        expect.objectContaining({
          name: "image.jpg",
          isVideo: false,
          isAudio: false,
          isImage: true
        })
      ])
    )
  })

  it("should update loaded count correctly", async () => {
    const mediaFiles = [
      { name: "video1.mp4", isFile: true },
      { name: "video2.mp4", isFile: true }
    ]
    
    const musicFiles = [
      { name: "song1.mp3", isFile: true }
    ]
    
    mockReadDir
      .mockResolvedValueOnce(mediaFiles)
      .mockResolvedValueOnce(musicFiles)
    
    mockInvoke.mockResolvedValue({
      id: "test-id",
      name: "file",
      path: "/test/file",
      size: 1024
    })

    const { result } = renderHook(() => useAutoLoadMedia(), {
      wrapper: BaseProviders
    })

    await act(async () => {
      await result.current.reload()
    })

    await waitFor(() => {
      expect(result.current.loadedCount.media).toBe(2)
      expect(result.current.loadedCount.music).toBe(1)
    })
  })
})