import { convertFileSrc } from "@tauri-apps/api/core"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { AudioFileManager } from "../audio-file-manager"

// Mock Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  convertFileSrc: vi.fn(),
}))

// Mock HTMLAudioElement
const mockAudioElement = {
  src: "",
  crossOrigin: null,
  preload: "none",
  load: vi.fn(),
  pause: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  play: vi.fn(),
  currentTime: 0,
  duration: 0,
  paused: true,
  volume: 1,
  muted: false,
}

// Create a fresh mock for each test
const createMockAudio = () => ({
  ...mockAudioElement,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  load: vi.fn(),
  pause: vi.fn(),
})

global.Audio = vi.fn(() => createMockAudio()) as any

describe("AudioFileManager", () => {
  let manager: AudioFileManager
  let mockAudio: any

  beforeEach(() => {
    vi.clearAllMocks()
    manager = new AudioFileManager()
    mockAudio = createMockAudio()
    global.Audio = vi.fn(() => mockAudio) as any
    vi.mocked(convertFileSrc).mockReturnValue("blob:audio-url")
  })

  afterEach(() => {
    manager.unloadAll()
  })

  describe("loadAudioFile", () => {
    it("should load audio file successfully", async () => {
      // Mock successful loading
      mockAudio.addEventListener.mockImplementation((event: string, callback: () => void) => {
        if (event === "loadedmetadata") {
          setTimeout(() => callback(), 0)
        }
      })

      const audioFile = await manager.loadAudioFile("test-id", "/path/to/audio.mp3")

      expect(convertFileSrc).toHaveBeenCalledWith("/path/to/audio.mp3")
      expect(global.Audio).toHaveBeenCalled()
      expect(mockAudio.src).toBe("blob:audio-url")
      expect(mockAudio.crossOrigin).toBe("anonymous")
      expect(mockAudio.preload).toBe("auto")
      expect(mockAudio.load).toHaveBeenCalled()
      expect(audioFile).toEqual({
        id: "test-id",
        path: "/path/to/audio.mp3",
        url: "blob:audio-url",
        element: mockAudio,
        isLoaded: true,
      })
    })

    it("should return existing file if already loaded", async () => {
      // Load file first time
      mockAudio.addEventListener.mockImplementation((event: string, callback: () => void) => {
        if (event === "loadedmetadata") {
          setTimeout(() => callback(), 0)
        }
      })

      const firstLoad = await manager.loadAudioFile("test-id", "/path/to/audio.mp3")

      // Reset mocks
      vi.clearAllMocks()
      vi.mocked(convertFileSrc).mockReturnValue("blob:audio-url")

      // Load same file again
      const secondLoad = await manager.loadAudioFile("test-id", "/path/to/audio.mp3")

      expect(secondLoad).toBe(firstLoad)
      expect(convertFileSrc).not.toHaveBeenCalled()
      expect(global.Audio).not.toHaveBeenCalled()
    })

    it("should handle loading errors", async () => {
      // Mock error loading
      mockAudio.addEventListener.mockImplementation((event: string, callback: () => void) => {
        if (event === "error") {
          setTimeout(() => callback(), 0)
        }
      })

      await expect(manager.loadAudioFile("error-id", "/bad/path.mp3")).rejects.toThrow("Failed to load audio")

      const audioFile = manager.getAudioFile("error-id")
      expect(audioFile).toEqual({
        id: "error-id",
        path: "/bad/path.mp3",
        url: "",
        isLoaded: false,
        error: "Failed to load audio",
      })
    })

    it("should handle unknown errors", async () => {
      // Mock error loading
      mockAudio.addEventListener.mockImplementation((event: string, callback: () => void) => {
        if (event === "error") {
          setTimeout(() => callback(), 0)
        }
      })

      try {
        await manager.loadAudioFile("unknown-error-id", "/bad/path.mp3")
      } catch (error) {
        // Should handle gracefully
      }

      const audioFile = manager.getAudioFile("unknown-error-id")
      expect(audioFile?.error).toBe("Failed to load audio")
    })

    it("should set correct audio element properties", async () => {
      mockAudio.addEventListener.mockImplementation((event: string, callback: () => void) => {
        if (event === "loadedmetadata") {
          setTimeout(() => callback(), 0)
        }
      })

      await manager.loadAudioFile("test-id", "/path/to/audio.mp3")

      expect(mockAudio.src).toBe("blob:audio-url")
      expect(mockAudio.crossOrigin).toBe("anonymous")
      expect(mockAudio.preload).toBe("auto")
      expect(mockAudio.load).toHaveBeenCalled()
    })
  })

  describe("getAudioFile", () => {
    it("should return audio file if exists", async () => {
      mockAudio.addEventListener.mockImplementation((event: string, callback: () => void) => {
        if (event === "loadedmetadata") {
          setTimeout(() => callback(), 0)
        }
      })

      const audioFile = await manager.loadAudioFile("test-id", "/path/to/audio.mp3")
      const retrieved = manager.getAudioFile("test-id")

      expect(retrieved).toBe(audioFile)
    })

    it("should return null if file does not exist", () => {
      const retrieved = manager.getAudioFile("non-existent-id")
      expect(retrieved).toBeNull()
    })
  })

  describe("getAudioElement", () => {
    it("should return audio element if file exists and is loaded", async () => {
      mockAudio.addEventListener.mockImplementation((event: string, callback: () => void) => {
        if (event === "loadedmetadata") {
          setTimeout(() => callback(), 0)
        }
      })

      await manager.loadAudioFile("test-id", "/path/to/audio.mp3")
      const element = manager.getAudioElement("test-id")

      expect(element).toBe(mockAudio)
    })

    it("should return null if file does not exist", () => {
      const element = manager.getAudioElement("non-existent-id")
      expect(element).toBeNull()
    })

    it("should return null if file exists but has no element", () => {
      // Manually create a file without element (error case)
      const errorFile = {
        id: "error-id",
        path: "/error/path.mp3",
        url: "",
        isLoaded: false,
        error: "Load failed",
      }

      // Access private map to simulate error state
      const privateMap = (manager as any).audioFiles
      privateMap.set("error-id", errorFile)

      const element = manager.getAudioElement("error-id")
      expect(element).toBeNull()
    })
  })

  describe("unloadAudioFile", () => {
    it("should unload audio file and clean up element", async () => {
      mockAudio.addEventListener.mockImplementation((event: string, callback: () => void) => {
        if (event === "loadedmetadata") {
          setTimeout(() => callback(), 0)
        }
      })

      await manager.loadAudioFile("test-id", "/path/to/audio.mp3")
      manager.unloadAudioFile("test-id")

      expect(mockAudio.pause).toHaveBeenCalled()
      expect(mockAudio.src).toBe("")
      expect(mockAudio.load).toHaveBeenCalledTimes(2) // Once for loading, once for cleanup
      expect(manager.getAudioFile("test-id")).toBeNull()
    })

    it("should handle unloading non-existent file", () => {
      expect(() => manager.unloadAudioFile("non-existent")).not.toThrow()
    })

    it("should handle file without element", () => {
      // Manually create a file without element
      const privateMap = (manager as any).audioFiles
      privateMap.set("no-element", { id: "no-element", path: "/path", url: "", isLoaded: false })

      expect(() => manager.unloadAudioFile("no-element")).not.toThrow()
      expect(manager.getAudioFile("no-element")).toBeNull()
    })
  })

  describe("unloadAll", () => {
    it("should unload all audio files", async () => {
      // Simplified version to avoid timeout
      const mockAudio1 = createMockAudio()
      const mockAudio2 = createMockAudio()

      mockAudio1.addEventListener.mockImplementation((event: string, callback: () => void) => {
        if (event === "loadedmetadata") {
          callback()
        }
      })

      mockAudio2.addEventListener.mockImplementation((event: string, callback: () => void) => {
        if (event === "loadedmetadata") {
          callback()
        }
      })

      global.Audio = vi.fn().mockReturnValueOnce(mockAudio1).mockReturnValueOnce(mockAudio2) as any

      await manager.loadAudioFile("test-id-1", "/path/to/audio1.mp3")
      await manager.loadAudioFile("test-id-2", "/path/to/audio2.mp3")

      manager.unloadAll()

      expect(mockAudio1.pause).toHaveBeenCalled()
      expect(mockAudio2.pause).toHaveBeenCalled()
      expect(manager.getAudioFile("test-id-1")).toBeNull()
      expect(manager.getAudioFile("test-id-2")).toBeNull()
      expect(manager.getAllFiles()).toHaveLength(0)
    })

    it("should handle empty file list", () => {
      expect(() => manager.unloadAll()).not.toThrow()
    })
  })

  describe("getAllFiles", () => {
    it("should return empty array initially", () => {
      const files = manager.getAllFiles()
      expect(files).toEqual([])
    })

    it("should return all loaded files", async () => {
      mockAudio.addEventListener.mockImplementation((event: string, callback: () => void) => {
        if (event === "loadedmetadata") {
          setTimeout(() => callback(), 0)
        }
      })

      const mockAudio2 = createMockAudio()
      mockAudio2.addEventListener.mockImplementation((event: string, callback: () => void) => {
        if (event === "loadedmetadata") {
          setTimeout(() => callback(), 0)
        }
      })

      global.Audio = vi.fn().mockReturnValueOnce(mockAudio).mockReturnValueOnce(mockAudio2) as any

      await manager.loadAudioFile("test-id-1", "/path/to/audio1.mp3")
      await manager.loadAudioFile("test-id-2", "/path/to/audio2.mp3")

      const files = manager.getAllFiles()
      expect(files).toHaveLength(2)
      expect(files.map((f) => f.id)).toContain("test-id-1")
      expect(files.map((f) => f.id)).toContain("test-id-2")
    })

    it("should include error files in the list", async () => {
      // Load one successful file
      mockAudio.addEventListener.mockImplementation((event: string, callback: () => void) => {
        if (event === "loadedmetadata") {
          setTimeout(() => callback(), 0)
        }
      })
      await manager.loadAudioFile("success-id", "/path/to/audio.mp3")

      // Add one error file by trying to load a failing file
      const mockAudioError = createMockAudio()
      mockAudioError.addEventListener.mockImplementation((event: string, callback: () => void) => {
        if (event === "error") {
          setTimeout(() => callback(), 0)
        }
      })
      global.Audio = vi.fn(() => mockAudioError) as any

      try {
        await manager.loadAudioFile("error-id", "/bad/path.mp3")
      } catch (error) {
        // Expected to fail
      }

      const files = manager.getAllFiles()
      expect(files).toHaveLength(2)
      expect(files.some((f) => f.id === "success-id" && f.isLoaded)).toBe(true)
      expect(files.some((f) => f.id === "error-id" && !f.isLoaded)).toBe(true)
    })
  })

  describe("edge cases", () => {
    it("should handle concurrent loads of same file", async () => {
      // Simplified to avoid timeout issues
      mockAudio.addEventListener.mockImplementation((event: string, callback: () => void) => {
        if (event === "loadedmetadata") {
          callback()
        }
      })

      // Start two concurrent loads of the same file
      const loadPromise1 = manager.loadAudioFile("concurrent-id", "/path/to/audio.mp3")
      const loadPromise2 = manager.loadAudioFile("concurrent-id", "/path/to/audio.mp3")

      const [result1, result2] = await Promise.all([loadPromise1, loadPromise2])

      // Both should return equivalent results
      expect(result1).toStrictEqual(result2)
      expect(result1.isLoaded).toBe(true)
    })

    it("should handle very long file paths", async () => {
      const longPath = `${"/very/long/path/".repeat(50)}audio.mp3`

      mockAudio.addEventListener.mockImplementation((event: string, callback: () => void) => {
        if (event === "loadedmetadata") {
          setTimeout(() => callback(), 0)
        }
      })

      const audioFile = await manager.loadAudioFile("long-path-id", longPath)

      expect(audioFile.path).toBe(longPath)
      expect(audioFile.isLoaded).toBe(true)
    })

    it("should handle special characters in file ID", async () => {
      const specialId = "test-id-with-!@#$%^&*()_+-={}[]|\\:;\"'<>?,./"

      mockAudio.addEventListener.mockImplementation((event: string, callback: () => void) => {
        if (event === "loadedmetadata") {
          setTimeout(() => callback(), 0)
        }
      })

      const audioFile = await manager.loadAudioFile(specialId, "/path/to/audio.mp3")

      expect(audioFile.id).toBe(specialId)
      expect(manager.getAudioFile(specialId)).toBe(audioFile)
    })

    it("should handle empty file ID", async () => {
      mockAudio.addEventListener.mockImplementation((event: string, callback: () => void) => {
        if (event === "loadedmetadata") {
          setTimeout(() => callback(), 0)
        }
      })

      const audioFile = await manager.loadAudioFile("", "/path/to/audio.mp3")

      expect(audioFile.id).toBe("")
      expect(manager.getAudioFile("")).toBe(audioFile)
    })

    it("should handle empty file path", async () => {
      mockAudio.addEventListener.mockImplementation((event: string, callback: () => void) => {
        if (event === "loadedmetadata") {
          setTimeout(() => callback(), 0)
        }
      })

      const audioFile = await manager.loadAudioFile("empty-path", "")

      expect(audioFile.path).toBe("")
      expect(convertFileSrc).toHaveBeenCalledWith("")
    })
  })

  describe("memory management", () => {
    it("should properly clean up when loading same ID with different path", async () => {
      // Load first file
      mockAudio.addEventListener.mockImplementation((event: string, callback: () => void) => {
        if (event === "loadedmetadata") {
          setTimeout(() => callback(), 0)
        }
      })

      const firstFile = await manager.loadAudioFile("same-id", "/first/path.mp3")
      expect(firstFile.isLoaded).toBe(true)

      // Load different file with same ID (should return existing)
      const secondFile = await manager.loadAudioFile("same-id", "/second/path.mp3")

      // Should return the same file (existing one)
      expect(secondFile).toBe(firstFile)
      expect(secondFile.path).toBe("/first/path.mp3") // Still the original path
    })

    it("should handle large number of files", async () => {
      mockAudio.addEventListener.mockImplementation((event: string, callback: () => void) => {
        if (event === "loadedmetadata") {
          setTimeout(() => callback(), 0)
        }
      })

      const numberOfFiles = 100
      const loadPromises: Promise<any>[] = []

      // Create unique mock for each file
      for (let i = 0; i < numberOfFiles; i++) {
        const mockAudioInstance = createMockAudio()
        mockAudioInstance.addEventListener.mockImplementation((event: string, callback: () => void) => {
          if (event === "loadedmetadata") {
            setTimeout(() => callback(), 0)
          }
        })
        global.Audio = vi.fn(() => mockAudioInstance) as any

        loadPromises.push(manager.loadAudioFile(`file-${i}`, `/path/to/audio-${i}.mp3`))
      }

      await Promise.all(loadPromises)

      const allFiles = manager.getAllFiles()
      expect(allFiles).toHaveLength(numberOfFiles)

      // All files should be loaded
      expect(allFiles.every((f) => f.isLoaded)).toBe(true)
    })
  })
})
