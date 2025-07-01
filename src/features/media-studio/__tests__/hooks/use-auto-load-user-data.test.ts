import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  getMediaExtensions,
  getMusicExtensions,
  processBatch,
  useAutoLoadUserData,
  validateEffect,
  validateFilter,
  validateStyleTemplate,
  validateSubtitleStyle,
  validateTransition,
} from "../../hooks"

// Mock dependencies
const mockUpdateMediaFiles = vi.fn()
const mockUpdateMusicFiles = vi.fn()
const mockAddEffect = vi.fn()
const mockAddFilter = vi.fn()
const mockAddTransition = vi.fn()
const mockAddSubtitle = vi.fn()
const mockAddStyleTemplate = vi.fn()

vi.mock("@/features/app-state/hooks", () => ({
  useMediaFiles: () => ({
    updateMediaFiles: mockUpdateMediaFiles,
  }),
  useMusicFiles: () => ({
    updateMusicFiles: mockUpdateMusicFiles,
  }),
}))

vi.mock("@/features/resources", () => ({
  useResources: () => ({
    addEffect: mockAddEffect,
    addFilter: mockAddFilter,
    addTransition: mockAddTransition,
    addSubtitle: mockAddSubtitle,
    addStyleTemplate: mockAddStyleTemplate,
  }),
}))

vi.mock("@/features/app-state/services", () => ({
  appDirectoriesService: {
    createAppDirectories: vi.fn().mockResolvedValue({
      media_dir: "/app/media",
      projects_dir: "/app/projects",
    }),
    getAppDirectories: vi.fn().mockResolvedValue({
      media_dir: "/app/media",
      projects_dir: "/app/projects",
    }),
    getMediaSubdirectory: vi.fn((type: string) => `/app/media/${type}`),
  },
}))

// Create mocked Tauri modules
const createTauriMocks = () => {
  const mockExists = vi.fn()
  const mockReadDir = vi.fn()
  const mockInvoke = vi.fn()

  return {
    mockExists,
    mockReadDir,
    mockInvoke,
  }
}

// Setup global mocks
const { mockExists, mockReadDir, mockInvoke } = createTauriMocks()

// Mock Tauri FS API
vi.mock("@tauri-apps/api/fs", () => ({
  exists: mockExists,
  readDir: mockReadDir,
}))

// Mock Tauri API core
vi.mock("@tauri-apps/api/core", () => ({
  invoke: mockInvoke,
}))

// Mock fetch for loading JSON files
global.fetch = vi.fn()

describe("useAutoLoadUserData", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // By default, directories don't exist
    mockExists.mockResolvedValue(false)
    mockReadDir.mockResolvedValue([])

    // Reset fetch mock
    vi.mocked(fetch).mockReset()

    // Reset invoke mock
    mockInvoke.mockReset()
  })

  describe("Initialization", () => {
    it("should initialize with default state", () => {
      // Mock window.__TAURI_INTERNALS__ for Tauri environment
      ;(window as any).__TAURI_INTERNALS__ = {
        invoke: vi.fn(),
      }

      const { result } = renderHook(() => useAutoLoadUserData())

      expect(result.current.isLoading).toBe(true) // Starts loading immediately
      expect(result.current.error).toBe(null)
      expect(result.current.loadedData).toEqual({
        media: [],
        music: [],
        effects: [],
        transitions: [],
        filters: [],
        subtitles: [],
        templates: [],
        styleTemplates: [],
      })
    })

    it("should work in web browser without Tauri", async () => {
      // Remove Tauri from window
      ;(window as any).__TAURI_INTERNALS__ = undefined

      const { result } = renderHook(() => useAutoLoadUserData())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // In web browser, no files should be loaded
      expect(result.current.loadedData.media).toHaveLength(0)
      expect(result.current.loadedData.music).toHaveLength(0)
      expect(result.current.error).toBe(null)
    })
  })

  describe("Validation Functions", () => {
    describe("validateEffect", () => {
      it("should validate correct effect", () => {
        const validEffect = {
          id: "blur",
          name: "Blur Effect",
          type: "blur",
          duration: 1000,
          category: "artistic",
          complexity: "basic",
          ffmpegCommand: "blur command",
        }

        expect(validateEffect(validEffect)).toEqual(validEffect)
      })

      it("should reject invalid effects", () => {
        // Missing required fields
        expect(validateEffect({ id: "blur", type: "blur" })).toBeNull()

        // Wrong types
        expect(validateEffect(null)).toBeNull()
        expect(validateEffect("string")).toBeNull()
        expect(validateEffect(123)).toBeNull()
        expect(validateEffect([])).toBeNull()

        // Missing ffmpegCommand
        expect(
          validateEffect({
            id: "blur",
            name: "Blur",
            type: "blur",
            duration: 1000,
            category: "artistic",
            complexity: "basic",
          }),
        ).toBeNull()
      })
    })

    describe("validateFilter", () => {
      it("should validate correct filter", () => {
        const validFilter = {
          id: "vintage",
          name: "Vintage Filter",
          category: "artistic",
          complexity: "basic",
          params: { brightness: 0.8 },
        }

        expect(validateFilter(validFilter)).toEqual(validFilter)
      })

      it("should reject invalid filters", () => {
        // Missing params
        expect(
          validateFilter({
            id: "vintage",
            name: "Vintage Filter",
            category: "artistic",
            complexity: "basic",
          }),
        ).toBeNull()

        // Missing required fields
        expect(validateFilter({ id: "vintage" })).toBeNull()

        // Wrong types
        expect(validateFilter(undefined)).toBeNull()
        expect(validateFilter({})).toBeNull()
      })
    })

    describe("validateTransition", () => {
      it("should validate correct transition", () => {
        const validTransition = {
          id: "fade",
          type: "fade",
          name: "Fade",
          duration: { min: 500, max: 2000, default: 1000 },
          category: "basic",
          complexity: "basic",
          ffmpegCommand: "fade command",
        }

        expect(validateTransition(validTransition)).toEqual(validTransition)
      })

      it("should reject invalid transitions", () => {
        // Wrong duration format
        expect(
          validateTransition({
            id: "fade",
            type: "fade",
            name: "Fade",
            duration: 1000, // Should be object
            category: "basic",
            complexity: "basic",
            ffmpegCommand: "fade command",
          }),
        ).toBeNull()

        // Missing duration properties
        expect(
          validateTransition({
            id: "fade",
            type: "fade",
            name: "Fade",
            duration: { min: 500 }, // Missing max and default
            category: "basic",
            complexity: "basic",
            ffmpegCommand: "fade command",
          }),
        ).toBeNull()

        // Missing ffmpegCommand
        expect(
          validateTransition({
            id: "fade",
            type: "fade",
            name: "Fade",
            duration: { min: 500, max: 2000, default: 1000 },
            category: "basic",
            complexity: "basic",
          }),
        ).toBeNull()
      })
    })

    describe("validateSubtitleStyle", () => {
      it("should validate correct subtitle style", () => {
        const validStyle = {
          id: "modern",
          name: "Modern",
          category: "modern",
          complexity: "basic",
          style: { fontSize: "16px", color: "#FFFFFF" },
        }

        expect(validateSubtitleStyle(validStyle)).toEqual(validStyle)
      })

      it("should reject invalid subtitle styles", () => {
        // Missing style object
        expect(
          validateSubtitleStyle({
            id: "modern",
            name: "Modern",
            category: "modern",
            complexity: "basic",
          }),
        ).toBeNull()

        // Style is not an object
        expect(
          validateSubtitleStyle({
            id: "modern",
            name: "Modern",
            category: "modern",
            complexity: "basic",
            style: "not an object",
          }),
        ).toBeNull()
      })
    })

    describe("validateStyleTemplate", () => {
      it("should validate correct style template", () => {
        const validTemplate = {
          id: "intro",
          name: { en: "Intro", ru: "Интро" },
          category: "intro",
          style: "modern",
          aspectRatio: "16:9",
          duration: 3,
          elements: [],
        }

        expect(validateStyleTemplate(validTemplate)).toEqual(validTemplate)
      })

      it("should reject invalid style templates", () => {
        // Elements not an array
        expect(
          validateStyleTemplate({
            id: "intro",
            name: { en: "Intro", ru: "Интро" },
            category: "intro",
            style: "modern",
            aspectRatio: "16:9",
            duration: 3,
            elements: "not an array",
          }),
        ).toBeNull()

        // Missing required fields
        expect(
          validateStyleTemplate({
            id: "intro",
            name: { en: "Intro", ru: "Интро" },
            category: "intro",
          }),
        ).toBeNull()
      })
    })
  })

  describe("Utility Functions", () => {
    it("should return correct media extensions", () => {
      const mediaExt = getMediaExtensions()

      // Video formats
      expect(mediaExt).toContain(".mp4")
      expect(mediaExt).toContain(".avi")
      expect(mediaExt).toContain(".mov")
      expect(mediaExt).toContain(".mkv")
      expect(mediaExt).toContain(".webm")

      // Image formats
      expect(mediaExt).toContain(".jpg")
      expect(mediaExt).toContain(".jpeg")
      expect(mediaExt).toContain(".png")
      expect(mediaExt).toContain(".gif")
      expect(mediaExt).toContain(".svg")
    })

    it("should return correct music extensions", () => {
      const musicExt = getMusicExtensions()

      expect(musicExt).toContain(".mp3")
      expect(musicExt).toContain(".wav")
      expect(musicExt).toContain(".ogg")
      expect(musicExt).toContain(".m4a")
      expect(musicExt).toContain(".aac")
      expect(musicExt).toContain(".flac")
    })

    it("should process files in batches", async () => {
      const files = ["file1", "file2", "file3", "file4", "file5"]
      const processor = vi.fn().mockResolvedValue("processed")

      const results = await processBatch(files, 2, processor)

      expect(processor).toHaveBeenCalledTimes(5)

      // Verify each file was processed
      const calls = processor.mock.calls.map((call) => call[0])
      expect(calls).toContain("file1")
      expect(calls).toContain("file2")
      expect(calls).toContain("file3")
      expect(calls).toContain("file4")
      expect(calls).toContain("file5")

      expect(results).toHaveLength(5)
      expect(results).toEqual(["processed", "processed", "processed", "processed", "processed"])
    })

    it("should handle empty batch", async () => {
      const files: string[] = []
      const processor = vi.fn()

      const results = await processBatch(files, 2, processor)

      expect(processor).not.toHaveBeenCalled()
      expect(results).toHaveLength(0)
    })
  })

  describe("Basic Hook Loading", () => {
    it("should handle loading when no files exist", async () => {
      ;(window as any).__TAURI_INTERNALS__ = {
        invoke: vi.fn(),
      }

      const { result } = renderHook(() => useAutoLoadUserData())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBe(null)
      expect(result.current.loadedData.effects).toHaveLength(0)
    })
  })

  describe("Error Handling", () => {
    beforeEach(() => {
      ;(window as any).__TAURI_INTERNALS__ = {
        invoke: vi.fn(),
      }
    })

    it("should handle directory scan errors gracefully", async () => {
      mockExists.mockRejectedValue(new Error("Permission denied"))

      const { result } = renderHook(() => useAutoLoadUserData())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should complete without error - errors are logged but not thrown
      expect(result.current.error).toBe(null)
      expect(result.current.loadedData.effects).toHaveLength(0)
    })
  })

  describe("Cache Management", () => {
    beforeEach(() => {
      ;(window as any).__TAURI_INTERNALS__ = {
        invoke: vi.fn(),
      }
    })

    it("should provide clearCache function", async () => {
      const { result } = renderHook(() => useAutoLoadUserData())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Should have clearCache function
      expect(result.current.clearCache).toBeDefined()
      expect(typeof result.current.clearCache).toBe("function")

      // Should not throw when called
      expect(() => result.current.clearCache()).not.toThrow()
    })
  })
})
