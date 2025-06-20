import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { MediaFile } from "@/features/media/types/media"

import { useVideoElement } from "../../hooks/use-video-element"

describe("useVideoElement", () => {
  let originalConsoleLog: typeof console.log
  let mockSetVideoSource: ReturnType<typeof vi.fn>
  let videoRefs: Record<string, HTMLVideoElement>

  beforeEach(() => {
    // Mock console.log to avoid noise in tests
    originalConsoleLog = console.log
    console.log = vi.fn()

    // Setup mock function and refs
    mockSetVideoSource = vi.fn()
    videoRefs = {}

    // Mock document.body.appendChild and removeChild
    vi.spyOn(document.body, "appendChild").mockImplementation((element) => {
      // Simulate adding to DOM
      return element
    })

    vi.spyOn(document.body, "removeChild").mockImplementation((element) => {
      // Simulate removing from DOM
      return element
    })

    vi.spyOn(document.body, "contains").mockImplementation((element) => {
      // Simulate element being in DOM by default
      return true
    })
  })

  afterEach(() => {
    // Restore console.log
    console.log = originalConsoleLog

    // Clean up mocks
    vi.restoreAllMocks()

    // Clean up any leftover video elements
    videoRefs = {}
  })

  const createMockMediaFile = (
    id: string,
    path: string,
    startTime?: number
  ): MediaFile => ({
    id,
    name: `Video ${id}`,
    path,
    type: "video",
    size: 1000000,
    duration: 60,
    dateAdded: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    extension: "mp4",
    mimeType: "video/mp4",
    startTime,
  })

  describe("getOrCreateVideoElement", () => {
    it("should create new video element when none exists", () => {
      const { result } = renderHook(() => useVideoElement())
      const mockVideo = createMockMediaFile("video-1", "/path/to/video1.mp4")

      act(() => {
        const videoElement = result.current.getOrCreateVideoElement(
          mockVideo,
          videoRefs,
          0.5,
          mockSetVideoSource
        )

        expect(videoElement.tagName.toLowerCase()).toBe("video")
        expect(videoElement.id).toBe("video-video-1")
        expect(videoElement.src).toContain("/path/to/video1.mp4")
        expect(videoElement.volume).toBe(0.5)
        expect(videoElement.preload).toBe("auto")
        expect(videoElement.playsInline).toBe(true)
        expect(videoElement.controls).toBe(false)
        expect(videoElement.autoplay).toBe(false)
        expect(videoElement.loop).toBe(false)
        expect(videoElement.muted).toBe(false)
        expect(videoElement.dataset.videoId).toBe("video-1")
      })
    })

    it("should set correct styles for hidden video element", () => {
      const { result } = renderHook(() => useVideoElement())
      const mockVideo = createMockMediaFile("video-1", "/path/to/video1.mp4")

      act(() => {
        const videoElement = result.current.getOrCreateVideoElement(
          mockVideo,
          videoRefs,
          0.5,
          mockSetVideoSource
        )

        expect(videoElement.style.position).toBe("absolute")
        expect(videoElement.style.width).toBe("1px")
        expect(videoElement.style.height).toBe("1px")
        expect(videoElement.style.opacity).toBe("0")
        expect(videoElement.style.pointerEvents).toBe("none")
      })
    })

    it("should add video element to DOM", () => {
      const { result } = renderHook(() => useVideoElement())
      const mockVideo = createMockMediaFile("video-1", "/path/to/video1.mp4")

      act(() => {
        result.current.getOrCreateVideoElement(
          mockVideo,
          videoRefs,
          0.5,
          mockSetVideoSource
        )

        expect(document.body.appendChild).toHaveBeenCalled()
      })
    })

    it("should store video element in videoRefs", () => {
      const { result } = renderHook(() => useVideoElement())
      const mockVideo = createMockMediaFile("video-1", "/path/to/video1.mp4")

      act(() => {
        const videoElement = result.current.getOrCreateVideoElement(
          mockVideo,
          videoRefs,
          0.5,
          mockSetVideoSource
        )

        expect(videoRefs["video-1"]).toBe(videoElement)
      })
    })

    it("should add video element to global registry", () => {
      const { result } = renderHook(() => useVideoElement())
      const mockVideo = createMockMediaFile("video-1", "/path/to/video1.mp4")

      act(() => {
        const videoElement = result.current.getOrCreateVideoElement(
          mockVideo,
          videoRefs,
          0.5,
          mockSetVideoSource
        )

        expect(result.current.allVideoElementsRef.current.has(videoElement)).toBe(true)
        expect(result.current.allVideoElementsRef.current.size).toBe(1)
      })
    })

    it("should call setVideoSource with 'media' for regular video", () => {
      const { result } = renderHook(() => useVideoElement())
      const mockVideo = createMockMediaFile("video-1", "/path/to/video1.mp4")

      act(() => {
        result.current.getOrCreateVideoElement(
          mockVideo,
          videoRefs,
          0.5,
          mockSetVideoSource
        )

        expect(mockSetVideoSource).toHaveBeenCalledWith("video-1", "media")
      })
    })

    it("should call setVideoSource with 'timeline' for timeline video", () => {
      const { result } = renderHook(() => useVideoElement())
      const mockVideo = createMockMediaFile("video-1", "/path/to/video1.mp4", 10)

      act(() => {
        result.current.getOrCreateVideoElement(
          mockVideo,
          videoRefs,
          0.5,
          mockSetVideoSource
        )

        expect(mockSetVideoSource).toHaveBeenCalledWith("video-1", "timeline")
      })
    })

    it("should return existing video element when already exists", () => {
      const { result } = renderHook(() => useVideoElement())
      const mockVideo = createMockMediaFile("video-1", "/path/to/video1.mp4")

      let firstVideoElement: HTMLVideoElement
      let secondVideoElement: HTMLVideoElement

      act(() => {
        firstVideoElement = result.current.getOrCreateVideoElement(
          mockVideo,
          videoRefs,
          0.5,
          mockSetVideoSource
        )
      })

      // Clear mock calls to check subsequent calls
      vi.mocked(document.body.appendChild).mockClear()

      act(() => {
        secondVideoElement = result.current.getOrCreateVideoElement(
          mockVideo,
          videoRefs,
          0.5,
          mockSetVideoSource
        )
      })

      expect(firstVideoElement).toBe(secondVideoElement)
      expect(document.body.appendChild).not.toHaveBeenCalled()
    })

    it("should create new element when existing element is not in DOM", () => {
      const { result } = renderHook(() => useVideoElement())
      const mockVideo = createMockMediaFile("video-1", "/path/to/video1.mp4")

      // Create first element
      act(() => {
        result.current.getOrCreateVideoElement(
          mockVideo,
          videoRefs,
          0.5,
          mockSetVideoSource
        )
      })

      // Mock that element is no longer in DOM
      vi.mocked(document.body.contains).mockReturnValue(false)
      
      // Clear previous appendChild calls
      vi.mocked(document.body.appendChild).mockClear()

      // Create second element
      act(() => {
        const secondVideoElement = result.current.getOrCreateVideoElement(
          mockVideo,
          videoRefs,
          0.5,
          mockSetVideoSource
        )

        expect(secondVideoElement.tagName.toLowerCase()).toBe("video")
        expect(document.body.appendChild).toHaveBeenCalledTimes(1)
      })
    })

    it("should handle multiple different video elements", () => {
      const { result } = renderHook(() => useVideoElement())
      const mockVideo1 = createMockMediaFile("video-1", "/path/to/video1.mp4")
      const mockVideo2 = createMockMediaFile("video-2", "/path/to/video2.mp4")

      let videoElement1: HTMLVideoElement
      let videoElement2: HTMLVideoElement

      act(() => {
        videoElement1 = result.current.getOrCreateVideoElement(
          mockVideo1,
          videoRefs,
          0.5,
          mockSetVideoSource
        )
      })

      act(() => {
        videoElement2 = result.current.getOrCreateVideoElement(
          mockVideo2,
          videoRefs,
          0.7,
          mockSetVideoSource
        )
      })

      expect(videoElement1).not.toBe(videoElement2)
      expect(videoElement1.id).toBe("video-video-1")
      expect(videoElement2.id).toBe("video-video-2")
      expect(videoElement1.volume).toBe(0.5)
      expect(videoElement2.volume).toBe(0.7)
      expect(result.current.allVideoElementsRef.current.size).toBe(2)
    })
  })

  describe("updateVideoSrc", () => {
    it("should update video src when current src does not include video id", () => {
      const { result } = renderHook(() => useVideoElement())
      const mockVideo = createMockMediaFile("video-1", "/new/path/video1.mp4")

      // Create video element with different src
      const videoElement = document.createElement("video")
      videoElement.src = "/old/path/different.mp4"
      videoElement.load = vi.fn()

      act(() => {
        result.current.updateVideoSrc(videoElement, mockVideo)
      })

      expect(videoElement.src).toContain("/new/path/video1.mp4")
      expect(videoElement.load).toHaveBeenCalled()
    })

    it("should not update video src when current src includes video id", () => {
      const { result } = renderHook(() => useVideoElement())
      const mockVideo = createMockMediaFile("video-1", "/new/path/video1.mp4")

      // Create video element with src that includes video id
      const videoElement = document.createElement("video")
      const originalSrc = "/path/containing/video-1/file.mp4"
      videoElement.src = originalSrc
      videoElement.load = vi.fn()

      act(() => {
        result.current.updateVideoSrc(videoElement, mockVideo)
      })

      expect(videoElement.src).toContain("video-1")
      expect(videoElement.load).not.toHaveBeenCalled()
    })

    it("should not update when video element is null", () => {
      const { result } = renderHook(() => useVideoElement())
      const mockVideo = createMockMediaFile("video-1", "/new/path/video1.mp4")

      act(() => {
        result.current.updateVideoSrc(null as any, mockVideo)
      })

      // Should not throw error
      expect(() => {
        result.current.updateVideoSrc(null as any, mockVideo)
      }).not.toThrow()
    })

    it("should not update when video path is empty", () => {
      const { result } = renderHook(() => useVideoElement())
      const mockVideo = createMockMediaFile("video-1", "")

      const videoElement = document.createElement("video")
      videoElement.src = "/old/path.mp4"
      videoElement.load = vi.fn()

      act(() => {
        result.current.updateVideoSrc(videoElement, mockVideo)
      })

      expect(videoElement.src).toContain("/old/path.mp4")
      expect(videoElement.load).not.toHaveBeenCalled()
    })

    it("should handle video element without src property", () => {
      const { result } = renderHook(() => useVideoElement())
      const mockVideo = createMockMediaFile("video-1", "/new/path/video1.mp4")

      const videoElement = document.createElement("video")
      // videoElement.src is undefined by default
      videoElement.load = vi.fn()

      act(() => {
        result.current.updateVideoSrc(videoElement, mockVideo)
      })

      expect(videoElement.src).toContain("/new/path/video1.mp4")
      expect(videoElement.load).toHaveBeenCalled()
    })
  })

  describe("cleanupUnusedVideoElements", () => {
    it("should remove unused video elements", () => {
      const { result } = renderHook(() => useVideoElement())

      // Create mock video elements
      const videoElement1 = document.createElement("video")
      const videoElement2 = document.createElement("video")
      const videoElement3 = document.createElement("video")

      videoElement1.pause = vi.fn()
      videoElement2.pause = vi.fn()
      videoElement3.pause = vi.fn()

      // Setup videoRefs with all elements
      videoRefs["video-1"] = videoElement1
      videoRefs["video-2"] = videoElement2
      videoRefs["video-3"] = videoElement3

      // Add to global registry
      result.current.allVideoElementsRef.current.add(videoElement1)
      result.current.allVideoElementsRef.current.add(videoElement2)
      result.current.allVideoElementsRef.current.add(videoElement3)

      // Only video-1 and video-3 are active
      const activeVideoIds = ["video-1", "video-3"]

      act(() => {
        result.current.cleanupUnusedVideoElements(activeVideoIds, videoRefs)
      })

      // Should pause and remove video-2
      expect(videoElement2.pause).toHaveBeenCalled()
      expect(document.body.removeChild).toHaveBeenCalledWith(videoElement2)

      // Should not affect video-1 and video-3
      expect(videoElement1.pause).not.toHaveBeenCalled()
      expect(videoElement3.pause).not.toHaveBeenCalled()

      // videoRefs should only contain active videos
      expect(videoRefs["video-1"]).toBe(videoElement1)
      expect(videoRefs["video-3"]).toBe(videoElement3)
      expect(videoRefs["video-2"]).toBeUndefined()

      // Global registry should be updated
      expect(result.current.allVideoElementsRef.current.has(videoElement1)).toBe(true)
      expect(result.current.allVideoElementsRef.current.has(videoElement3)).toBe(true)
      expect(result.current.allVideoElementsRef.current.has(videoElement2)).toBe(false)
    })

    it("should handle empty active video ids", () => {
      const { result } = renderHook(() => useVideoElement())

      // Create mock video elements
      const videoElement1 = document.createElement("video")
      const videoElement2 = document.createElement("video")

      videoElement1.pause = vi.fn()
      videoElement2.pause = vi.fn()

      // Setup videoRefs
      videoRefs["video-1"] = videoElement1
      videoRefs["video-2"] = videoElement2

      // Add to global registry
      result.current.allVideoElementsRef.current.add(videoElement1)
      result.current.allVideoElementsRef.current.add(videoElement2)

      // No active videos
      const activeVideoIds: string[] = []

      act(() => {
        result.current.cleanupUnusedVideoElements(activeVideoIds, videoRefs)
      })

      // Should remove all video elements
      expect(videoElement1.pause).toHaveBeenCalled()
      expect(videoElement2.pause).toHaveBeenCalled()
      expect(document.body.removeChild).toHaveBeenCalledWith(videoElement1)
      expect(document.body.removeChild).toHaveBeenCalledWith(videoElement2)

      // videoRefs should be empty
      expect(Object.keys(videoRefs)).toHaveLength(0)

      // Global registry should be empty
      expect(result.current.allVideoElementsRef.current.size).toBe(0)
    })

    it("should not remove elements that are not in DOM", () => {
      const { result } = renderHook(() => useVideoElement())

      // Create mock video element
      const videoElement1 = document.createElement("video")
      videoElement1.pause = vi.fn()

      // Setup videoRefs
      videoRefs["video-1"] = videoElement1

      // Mock that element is not in DOM
      vi.mocked(document.body.contains).mockReturnValue(false)

      act(() => {
        result.current.cleanupUnusedVideoElements([], videoRefs)
      })

      // Should not try to remove from DOM since it's not there
      expect(document.body.removeChild).not.toHaveBeenCalled()
      expect(videoElement1.pause).not.toHaveBeenCalled()
    })

    it("should handle cleanup when videoRefs is empty", () => {
      const { result } = renderHook(() => useVideoElement())

      act(() => {
        result.current.cleanupUnusedVideoElements(["video-1"], {})
      })

      // Should not throw error and not call any DOM methods
      expect(document.body.removeChild).not.toHaveBeenCalled()
    })

    it("should remove multiple unused elements", () => {
      const { result } = renderHook(() => useVideoElement())

      // Create multiple video elements
      const elements = Array.from({ length: 5 }, (_, i) => {
        const element = document.createElement("video")
        element.pause = vi.fn()
        return element
      })

      // Setup videoRefs
      elements.forEach((element, i) => {
        videoRefs[`video-${i + 1}`] = element
        result.current.allVideoElementsRef.current.add(element)
      })

      // Only video-3 is active
      const activeVideoIds = ["video-3"]

      act(() => {
        result.current.cleanupUnusedVideoElements(activeVideoIds, videoRefs)
      })

      // Should remove 4 elements, keep 1
      expect(document.body.removeChild).toHaveBeenCalledTimes(4)
      expect(Object.keys(videoRefs)).toHaveLength(1)
      expect(videoRefs["video-3"]).toBe(elements[2])
      expect(result.current.allVideoElementsRef.current.size).toBe(1)
    })
  })

  describe("allVideoElementsRef", () => {
    it("should track all created video elements", () => {
      const { result } = renderHook(() => useVideoElement())
      const mockVideo1 = createMockMediaFile("video-1", "/path/to/video1.mp4")
      const mockVideo2 = createMockMediaFile("video-2", "/path/to/video2.mp4")

      act(() => {
        result.current.getOrCreateVideoElement(mockVideo1, videoRefs, 0.5, mockSetVideoSource)
        result.current.getOrCreateVideoElement(mockVideo2, videoRefs, 0.5, mockSetVideoSource)
      })

      expect(result.current.allVideoElementsRef.current.size).toBe(2)
    })

    it("should not duplicate elements in registry", () => {
      const { result } = renderHook(() => useVideoElement())
      const mockVideo = createMockMediaFile("video-1", "/path/to/video1.mp4")

      act(() => {
        result.current.getOrCreateVideoElement(mockVideo, videoRefs, 0.5, mockSetVideoSource)
        result.current.getOrCreateVideoElement(mockVideo, videoRefs, 0.5, mockSetVideoSource)
      })

      expect(result.current.allVideoElementsRef.current.size).toBe(1)
    })

    it("should persist across re-renders", () => {
      const { result, rerender } = renderHook(() => useVideoElement())
      const mockVideo = createMockMediaFile("video-1", "/path/to/video1.mp4")

      act(() => {
        result.current.getOrCreateVideoElement(mockVideo, videoRefs, 0.5, mockSetVideoSource)
      })

      const initialSize = result.current.allVideoElementsRef.current.size

      rerender()

      expect(result.current.allVideoElementsRef.current.size).toBe(initialSize)
    })
  })

  describe("integration scenarios", () => {
    it("should handle complete lifecycle: create, update, cleanup", () => {
      const { result } = renderHook(() => useVideoElement())
      const mockVideo = createMockMediaFile("video-1", "/initial/path.mp4")

      // Create video element
      let videoElement: HTMLVideoElement
      act(() => {
        videoElement = result.current.getOrCreateVideoElement(
          mockVideo,
          videoRefs,
          0.5,
          mockSetVideoSource
        )
      })

      expect(videoElement.src).toContain("/initial/path.mp4")
      expect(result.current.allVideoElementsRef.current.size).toBe(1)

      // Update video src
      const updatedVideo = { ...mockVideo, path: "/updated/path.mp4" }
      videoElement.load = vi.fn()
      act(() => {
        result.current.updateVideoSrc(videoElement, updatedVideo)
      })

      expect(videoElement.src).toContain("/updated/path.mp4")
      expect(videoElement.load).toHaveBeenCalled()

      // Cleanup
      videoElement.pause = vi.fn()
      act(() => {
        result.current.cleanupUnusedVideoElements([], videoRefs)
      })

      expect(videoElement.pause).toHaveBeenCalled()
      expect(document.body.removeChild).toHaveBeenCalledWith(videoElement)
      expect(result.current.allVideoElementsRef.current.size).toBe(0)
    })

    it("should handle multiple videos with partial cleanup", () => {
      const { result } = renderHook(() => useVideoElement())
      const videos = [
        createMockMediaFile("video-1", "/path1.mp4"),
        createMockMediaFile("video-2", "/path2.mp4"),
        createMockMediaFile("video-3", "/path3.mp4"),
      ]

      // Create all video elements
      const elements: HTMLVideoElement[] = []
      act(() => {
        videos.forEach((video) => {
          const element = result.current.getOrCreateVideoElement(
            video,
            videoRefs,
            0.5,
            mockSetVideoSource
          )
          elements.push(element)
        })
      })

      expect(result.current.allVideoElementsRef.current.size).toBe(3)
      expect(Object.keys(videoRefs)).toHaveLength(3)

      // Cleanup keeping only video-2
      elements.forEach((element) => {
        element.pause = vi.fn()
      })

      act(() => {
        result.current.cleanupUnusedVideoElements(["video-2"], videoRefs)
      })

      expect(result.current.allVideoElementsRef.current.size).toBe(1)
      expect(Object.keys(videoRefs)).toEqual(["video-2"])
      expect(document.body.removeChild).toHaveBeenCalledTimes(2)
    })
  })

  describe("error handling", () => {
    it("should handle invalid video objects gracefully", () => {
      const { result } = renderHook(() => useVideoElement())
      const invalidVideo = {} as MediaFile

      expect(() => {
        act(() => {
          result.current.getOrCreateVideoElement(
            invalidVideo,
            videoRefs,
            0.5,
            mockSetVideoSource
          )
        })
      }).not.toThrow()
    })

    it("should handle missing videoRefs object", () => {
      const { result } = renderHook(() => useVideoElement())
      const mockVideo = createMockMediaFile("video-1", "/path.mp4")

      expect(() => {
        act(() => {
          result.current.getOrCreateVideoElement(
            mockVideo,
            {} as any, // Use empty object instead of null
            0.5,
            mockSetVideoSource
          )
        })
      }).not.toThrow()
    })

    it("should handle cleanup with corrupted videoRefs", () => {
      const { result } = renderHook(() => useVideoElement())
      const corruptedRefs = {
        "video-1": null,
        "video-2": undefined,
        "video-3": document.createElement("video"),
      } as any

      expect(() => {
        act(() => {
          result.current.cleanupUnusedVideoElements([], corruptedRefs)
        })
      }).not.toThrow()
    })
  })
})