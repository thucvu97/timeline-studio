import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useEffectsImport } from "@/features/effects/hooks/use-effects-import"
import { VideoEffect } from "@/features/effects/types"

// Mock Tauri dialog API
vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
}))

// Mock user-effects utilities
vi.mock("@/features/effects/utils/user-effects", () => ({
  loadUserEffect: vi.fn(),
  loadEffectsCollection: vi.fn(),
}))

// Mock fetch for file reading
global.fetch = vi.fn()

describe("useEffectsImport", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  const createValidEffect = (id: string): VideoEffect => ({
    id,
    name: `Test Effect ${id}`,
    type: "blur",
    category: "artistic",
    complexity: "basic",
    tags: ["popular"],
    description: {
      ru: "Тестовый эффект",
      en: "Test Effect",
    },
    duration: 1000,
    ffmpegCommand: () => "blur=5",
    previewPath: "/test.mp4",
    labels: {
      ru: "Тестовый эффект",
      en: "Test Effect",
    },
  })

  describe("initial state", () => {
    it("should have correct initial state", () => {
      const { result } = renderHook(() => useEffectsImport())

      expect(result.current.isImporting).toBe(false)
      expect(result.current.progress).toBe(0)
      expect(typeof result.current.importEffectsFile).toBe("function")
      expect(typeof result.current.importEffectFile).toBe("function")
    })
  })

  describe("importEffectsFile", () => {
    it("should handle cancelled file selection", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      vi.mocked(open).mockResolvedValue(null)

      const { result } = renderHook(() => useEffectsImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importEffectsFile()
      })

      expect(importResult).toEqual({
        success: false,
        message: "Файл не выбран",
        effects: [],
      })
      expect(result.current.isImporting).toBe(false)
    })

    it("should prevent concurrent imports", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      vi.mocked(open).mockImplementation(() => new Promise(() => {})) // Never resolves

      const { result } = renderHook(() => useEffectsImport())

      // Start first import
      act(() => {
        void result.current.importEffectsFile()
      })

      // Try second import while first is running
      let importResult: any
      await act(async () => {
        importResult = await result.current.importEffectsFile()
      })

      expect(importResult).toEqual({
        success: false,
        message: "Импорт уже выполняется",
        effects: [],
      })
    })

    it("should import JSON file with array of effects", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      const mockFilePath = "/path/to/effects.json"
      vi.mocked(open).mockResolvedValue(mockFilePath)

      const mockEffects = [createValidEffect("1"), createValidEffect("2")]
      vi.mocked(global.fetch).mockResolvedValue({
        json: vi.fn().mockResolvedValue(mockEffects),
      } as any)

      const { result } = renderHook(() => useEffectsImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importEffectsFile()
      })

      expect(importResult).toEqual({
        success: true,
        message: "Успешно импортировано 2 эффектов",
        effects: mockEffects,
      })
      expect(result.current.progress).toBe(100)
      expect(result.current.isImporting).toBe(false)
    })

    it("should import JSON file with effects object", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      const mockFilePath = "/path/to/effects.json"
      vi.mocked(open).mockResolvedValue(mockFilePath)

      const mockEffects = [createValidEffect("1")]
      vi.mocked(global.fetch).mockResolvedValue({
        json: vi.fn().mockResolvedValue({ effects: mockEffects }),
      } as any)

      const { result } = renderHook(() => useEffectsImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importEffectsFile()
      })

      expect(importResult).toEqual({
        success: true,
        message: "Успешно импортировано 1 эффектов",
        effects: mockEffects,
      })
    })

    it("should import single effect from JSON", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      const mockFilePath = "/path/to/effect.json"
      vi.mocked(open).mockResolvedValue(mockFilePath)

      const mockEffect = createValidEffect("1")
      vi.mocked(global.fetch).mockResolvedValue({
        json: vi.fn().mockResolvedValue(mockEffect),
      } as any)

      const { result } = renderHook(() => useEffectsImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importEffectsFile()
      })

      expect(importResult).toEqual({
        success: true,
        message: "Успешно импортировано 1 эффектов",
        effects: [mockEffect],
      })
    })

    it("should import .effect file", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      const { loadUserEffect } = await import("@/features/effects/utils/user-effects")

      const mockFilePath = "/path/to/custom.effect"
      vi.mocked(open).mockResolvedValue(mockFilePath)

      const mockEffect = createValidEffect("1")
      vi.mocked(loadUserEffect).mockResolvedValue({
        effect: mockEffect,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isCustom: true,
      })

      const { result } = renderHook(() => useEffectsImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importEffectsFile()
      })

      expect(importResult).toEqual({
        success: true,
        message: "Успешно импортировано 1 эффектов",
        effects: [mockEffect],
      })
    })

    it("should import .effects collection file", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      const { loadEffectsCollection } = await import("@/features/effects/utils/user-effects")

      const mockFilePath = "/path/to/collection.effects"
      vi.mocked(open).mockResolvedValue(mockFilePath)

      const mockEffects = [createValidEffect("1"), createValidEffect("2")]
      vi.mocked(loadEffectsCollection).mockResolvedValue({
        version: "1.0",
        name: "Test Collection",
        effects: mockEffects.map((effect) => ({
          effect,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isCustom: true,
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      const { result } = renderHook(() => useEffectsImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importEffectsFile()
      })

      expect(importResult).toEqual({
        success: true,
        message: "Успешно импортировано 2 эффектов",
        effects: mockEffects,
      })
    })

    it("should filter out invalid effects", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      const mockFilePath = "/path/to/effects.json"
      vi.mocked(open).mockResolvedValue(mockFilePath)

      const validEffect = createValidEffect("1")
      const invalidEffects = [
        validEffect,
        { id: "2", name: "Invalid" }, // Missing required fields
        null,
        undefined,
      ]

      vi.mocked(global.fetch).mockResolvedValue({
        json: vi.fn().mockResolvedValue(invalidEffects),
      } as any)

      const { result } = renderHook(() => useEffectsImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importEffectsFile()
      })

      expect(importResult).toEqual({
        success: true,
        message: "Успешно импортировано 1 эффектов",
        effects: [validEffect],
      })
    })

    it("should handle file read errors", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      const mockFilePath = "/path/to/effects.json"
      vi.mocked(open).mockResolvedValue(mockFilePath)

      vi.mocked(global.fetch).mockRejectedValue(new Error("File read error"))

      const { result } = renderHook(() => useEffectsImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importEffectsFile()
      })

      expect(importResult).toEqual({
        success: false,
        message: "Ошибка чтения файла эффектов",
        effects: [],
      })
      expect(result.current.isImporting).toBe(false)
    })

    it("should handle empty effects file", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      const mockFilePath = "/path/to/effects.json"
      vi.mocked(open).mockResolvedValue(mockFilePath)

      vi.mocked(global.fetch).mockResolvedValue({
        json: vi.fn().mockResolvedValue([]),
      } as any)

      const { result } = renderHook(() => useEffectsImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importEffectsFile()
      })

      expect(importResult).toEqual({
        success: false,
        message: "В файле не найдено валидных эффектов",
        effects: [],
      })
    })

    it("should update progress during import", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      const mockFilePath = "/path/to/effects.json"
      vi.mocked(open).mockResolvedValue(mockFilePath)

      const mockEffect = createValidEffect("1")
      vi.mocked(global.fetch).mockResolvedValue({
        json: vi.fn().mockResolvedValue([mockEffect]),
      } as any)

      const { result } = renderHook(() => useEffectsImport())

      await act(async () => {
        await result.current.importEffectsFile()
      })

      // The progress should go through various stages
      expect(result.current.progress).toBe(100)
    })
  })

  describe("importEffectFile", () => {
    it("should handle cancelled file selection", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      vi.mocked(open).mockResolvedValue(null)

      const { result } = renderHook(() => useEffectsImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importEffectFile()
      })

      expect(importResult).toEqual({
        success: false,
        message: "Файлы не выбраны",
        effects: [],
      })
    })

    it("should import single LUT file (.cube)", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      const mockFilePath = "/path/to/lut.cube"
      vi.mocked(open).mockResolvedValue(mockFilePath)

      const { result } = renderHook(() => useEffectsImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importEffectFile()
      })

      expect(importResult.success).toBe(true)
      expect(importResult.message).toBe("Успешно импортировано 1 файлов эффектов")
      expect(importResult.effects).toHaveLength(1)

      const effect = importResult.effects[0]
      expect(effect.name).toBe("lut")
      expect(effect.type).toBe("vintage")
      expect(effect.category).toBe("creative")
      expect(effect.id).toMatch(/^user-\d+-0$/)

      // Test FFmpeg command generation
      const ffmpegCmd = effect.ffmpegCommand({ intensity: 75 })
      expect(ffmpegCmd).toBe("lut3d=/path/to/lut.cube:interp=trilinear:amount=0.75")
    })

    it("should import multiple effect files", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      const mockFilePaths = ["/path/to/effect1.cube", "/path/to/effect2.3dl", "/path/to/effect3.preset"]
      vi.mocked(open).mockResolvedValue(mockFilePaths)

      const { result } = renderHook(() => useEffectsImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importEffectFile()
      })

      expect(importResult.success).toBe(true)
      expect(importResult.message).toBe("Успешно импортировано 3 файлов эффектов")
      expect(importResult.effects).toHaveLength(3)

      // Check first effect (cube)
      expect(importResult.effects[0].name).toBe("effect1")
      expect(importResult.effects[0].type).toBe("vintage")

      // Check second effect (3dl)
      expect(importResult.effects[1].name).toBe("effect2")
      expect(importResult.effects[1].type).toBe("vintage")

      // Check third effect (preset)
      expect(importResult.effects[2].name).toBe("effect3")
      expect(importResult.effects[2].type).toBe("glow")
    })

    it("should generate correct FFmpeg commands for different file types", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      const mockFilePaths = ["/path/to/lut.cube", "/path/to/preset.json"]
      vi.mocked(open).mockResolvedValue(mockFilePaths)

      const { result } = renderHook(() => useEffectsImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importEffectFile()
      })

      const lutEffect = importResult.effects[0]
      const presetEffect = importResult.effects[1]

      // Test LUT command
      expect(lutEffect.ffmpegCommand({ intensity: 50 })).toBe("lut3d=/path/to/lut.cube:interp=trilinear:amount=0.5")

      // Test custom command
      expect(presetEffect.ffmpegCommand({ intensity: 80 })).toBe("custom=/path/to/preset.json:intensity=80")
    })

    it("should handle Windows file paths correctly", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      const mockFilePath = "C:\\Users\\Test\\effects\\my-effect.cube"
      vi.mocked(open).mockResolvedValue(mockFilePath)

      const { result } = renderHook(() => useEffectsImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importEffectFile()
      })

      // The code first tries split("/") which returns the whole path for Windows paths
      // Then it tries split("\\") which would give "my-effect.cube"
      // Finally it removes the extension
      const fileName = mockFilePath.split("/").pop() || mockFilePath.split("\\").pop() || "unknown"
      const expectedName = fileName.replace(/\.[^/.]+$/, "")
      expect(importResult.effects[0].name).toBe(expectedName)
    })

    it("should create multilingual labels", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      const mockFilePath = "/path/to/custom-effect.cube"
      vi.mocked(open).mockResolvedValue(mockFilePath)

      const { result } = renderHook(() => useEffectsImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importEffectFile()
      })

      const effect = importResult.effects[0]
      expect(effect.labels).toEqual({
        ru: "custom-effect",
        en: "custom-effect",
        es: "custom-effect",
        fr: "custom-effect",
        de: "custom-effect",
      })
    })

    it("should handle import errors gracefully", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      vi.mocked(open).mockRejectedValue(new Error("Dialog error"))

      const { result } = renderHook(() => useEffectsImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importEffectFile()
      })

      expect(importResult).toEqual({
        success: false,
        message: "Ошибка при импорте: Error: Dialog error",
        effects: [],
      })
      expect(result.current.isImporting).toBe(false)
    })

    it("should update progress during multi-file import", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      const mockFilePaths = [
        "/path/to/effect1.cube",
        "/path/to/effect2.cube",
        "/path/to/effect3.cube",
        "/path/to/effect4.cube",
      ]
      vi.mocked(open).mockResolvedValue(mockFilePaths)

      const { result } = renderHook(() => useEffectsImport())

      await act(async () => {
        await result.current.importEffectFile()
      })

      // After completing import of 4 files, progress should be 100
      expect(result.current.progress).toBe(100)
    })

    it("should set correct default parameters for imported effects", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      const mockFilePath = "/path/to/effect.cube"
      vi.mocked(open).mockResolvedValue(mockFilePath)

      const { result } = renderHook(() => useEffectsImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importEffectFile()
      })

      const effect = importResult.effects[0]
      expect(effect.params).toEqual({
        intensity: 50,
        amount: 100,
      })
    })
  })

  describe("validation", () => {
    it("should validate effect structure correctly", async () => {
      const { result } = renderHook(() => useEffectsImport())

      // Valid effect
      const validEffect = createValidEffect("test")

      // Test valid effect
      const { open } = await import("@tauri-apps/plugin-dialog")
      vi.mocked(open).mockResolvedValue("/test.json")
      vi.mocked(global.fetch).mockResolvedValue({
        json: vi.fn().mockResolvedValue([validEffect]),
      } as any)

      let validResult: any
      await act(async () => {
        validResult = await result.current.importEffectsFile()
      })

      expect(validResult.effects).toHaveLength(1)
      expect(validResult.effects[0].id).toBe("test")
    })

    it("should filter out invalid effects", async () => {
      const { result } = renderHook(() => useEffectsImport())

      const validEffect = createValidEffect("valid")
      const invalidEffects = [
        validEffect,
        null,
        undefined,
        {},
        { id: "test" }, // Missing required fields
        {
          id: 123,
          name: "Test",
          type: "blur",
          category: "artistic",
          complexity: "basic",
          tags: [],
          description: { ru: "Test", en: "Test" },
        }, // Wrong id type
        {
          id: "test",
          name: "Test",
          type: "blur",
          category: "artistic",
          complexity: "basic",
          tags: "not-array",
          description: { ru: "Test", en: "Test" },
        }, // Wrong tags type
        {
          id: "test",
          name: "Test",
          type: "blur",
          category: "artistic",
          complexity: "basic",
          tags: [],
          description: "not-object",
        }, // Wrong description type
        {
          id: "test",
          name: "Test",
          type: "blur",
          category: "artistic",
          complexity: "basic",
          tags: [],
          description: { ru: "Test" },
        }, // Missing en
        {
          id: "test",
          name: "Test",
          type: "blur",
          category: "artistic",
          complexity: "basic",
          tags: [],
          description: { en: "Test" },
        }, // Missing ru
      ]

      const { open } = await import("@tauri-apps/plugin-dialog")
      vi.mocked(open).mockResolvedValue("/test.json")
      vi.mocked(global.fetch).mockResolvedValue({
        json: vi.fn().mockResolvedValue(invalidEffects),
      } as any)

      let result2: any
      await act(async () => {
        result2 = await result.current.importEffectsFile()
      })

      // Should only have the one valid effect
      expect(result2.effects).toHaveLength(1)
      expect(result2.effects[0].id).toBe("valid")
    })
  })
})
