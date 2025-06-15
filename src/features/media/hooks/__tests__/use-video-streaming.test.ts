import { renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { videoStreamingService } from "../../services/video-streaming-service"
import { useVideoServerStatus, useVideoStreaming } from "../use-video-streaming"

// Mock the video streaming service
vi.mock("../../services/video-streaming-service", () => ({
  videoStreamingService: {
    getVideoUrl: vi.fn(),
    isServerRunning: vi.fn(),
  },
}))

const mockVideoStreamingService = vi.mocked(videoStreamingService)

describe("useVideoStreaming", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe("Hook Initialization", () => {
    it("should initialize with default values when no filePath provided", () => {
      const { result } = renderHook(() => useVideoStreaming(undefined))

      expect(result.current.videoUrl).toBe(null)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
      expect(typeof result.current.retry).toBe("function")
    })

    it("should initialize with default values when empty filePath provided", () => {
      const { result } = renderHook(() => useVideoStreaming(""))

      expect(result.current.videoUrl).toBe(null)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
    })
  })

  describe("Video URL Loading", () => {
    it("should successfully load video URL", async () => {
      const mockUrl = "http://localhost:4567/video/test123"
      const filePath = "/path/to/video.mp4"

      mockVideoStreamingService.getVideoUrl.mockResolvedValue(mockUrl)

      const { result } = renderHook(() => useVideoStreaming(filePath))

      // Initially should be loading
      expect(result.current.isLoading).toBe(true)
      expect(result.current.videoUrl).toBe(null)
      expect(result.current.error).toBe(null)

      // Wait for the async operation to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.videoUrl).toBe(mockUrl)
      expect(result.current.error).toBe(null)
      expect(mockVideoStreamingService.getVideoUrl).toHaveBeenCalledWith(filePath)
    })

    it("should handle error when video URL loading fails", async () => {
      const filePath = "/path/to/video.mp4"
      const mockError = new Error("Failed to get video URL")

      mockVideoStreamingService.getVideoUrl.mockRejectedValue(mockError)

      const { result } = renderHook(() => useVideoStreaming(filePath))

      // Initially should be loading
      expect(result.current.isLoading).toBe(true)

      // Wait for the async operation to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.videoUrl).toBe(null)
      expect(result.current.error).toEqual(mockError)
    })

    it("should handle generic error when video URL loading fails with non-Error object", async () => {
      const filePath = "/path/to/video.mp4"
      const mockError = "Something went wrong"

      mockVideoStreamingService.getVideoUrl.mockRejectedValue(mockError)

      const { result } = renderHook(() => useVideoStreaming(filePath))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.videoUrl).toBe(null)
      expect(result.current.error).toEqual(new Error("Failed to get video URL"))
    })
  })

  describe("File Path Changes", () => {
    it("should reset state when filePath changes to undefined", async () => {
      const mockUrl = "http://localhost:4567/video/test123"
      const filePath = "/path/to/video.mp4"

      mockVideoStreamingService.getVideoUrl.mockResolvedValue(mockUrl)

      const { result, rerender } = renderHook(({ filePath }) => useVideoStreaming(filePath), {
        initialProps: { filePath },
      })

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.videoUrl).toBe(mockUrl)

      // Change filePath to undefined
      rerender({ filePath: undefined })

      expect(result.current.videoUrl).toBe(null)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe(null)
    })

    it("should load new video URL when filePath changes", async () => {
      const mockUrl1 = "http://localhost:4567/video/test123"
      const mockUrl2 = "http://localhost:4567/video/test456"
      const filePath1 = "/path/to/video1.mp4"
      const filePath2 = "/path/to/video2.mp4"

      mockVideoStreamingService.getVideoUrl.mockResolvedValueOnce(mockUrl1).mockResolvedValueOnce(mockUrl2)

      const { result, rerender } = renderHook(({ filePath }) => useVideoStreaming(filePath), {
        initialProps: { filePath: filePath1 },
      })

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.videoUrl).toBe(mockUrl1)

      // Change filePath
      rerender({ filePath: filePath2 })

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.videoUrl).toBe(mockUrl2)
      expect(mockVideoStreamingService.getVideoUrl).toHaveBeenCalledWith(filePath2)
    })
  })

  describe("Retry Functionality", () => {
    it("should retry loading video URL when retry is called", async () => {
      const mockUrl = "http://localhost:4567/video/test123"
      const filePath = "/path/to/video.mp4"

      // First call fails, second succeeds
      mockVideoStreamingService.getVideoUrl
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce(mockUrl)

      const { result } = renderHook(() => useVideoStreaming(filePath))

      // Wait for initial error
      await waitFor(() => {
        expect(result.current.error).toBeTruthy()
      })

      expect(result.current.videoUrl).toBe(null)

      // Retry
      result.current.retry()

      // Wait for retry to complete
      await waitFor(() => {
        expect(result.current.videoUrl).toBe(mockUrl)
      })

      expect(result.current.error).toBe(null)
      expect(mockVideoStreamingService.getVideoUrl).toHaveBeenCalledTimes(2)
    })
  })

  describe("Cleanup", () => {
    it("should not update state if component unmounts before async operation completes", async () => {
      const filePath = "/path/to/video.mp4"
      let resolvePromise: (value: string) => void

      // Create a promise that we can control
      const controllablePromise = new Promise<string>((resolve) => {
        resolvePromise = resolve
      })

      mockVideoStreamingService.getVideoUrl.mockReturnValue(controllablePromise)

      const { result, unmount } = renderHook(() => useVideoStreaming(filePath))

      expect(result.current.isLoading).toBe(true)

      // Unmount before promise resolves
      unmount()

      // Resolve the promise after unmount
      resolvePromise!("http://localhost:4567/video/test123")

      // Wait a bit to ensure no state updates occur
      await new Promise((resolve) => setTimeout(resolve, 10))

      // State should remain as it was before unmount
      expect(result.current.isLoading).toBe(true)
    })
  })
})

describe("useVideoServerStatus", () => {
  it("should initialize with null status", () => {
    const { result } = renderHook(() => useVideoServerStatus())
    expect(result.current).toBe(null)
  })

  it("should verify hook exists and can be called", () => {
    expect(typeof useVideoServerStatus).toBe("function")
  })
})
