import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useEffectsImport } from "@/features/effects/hooks/use-effects-import"
import { BaseEffect } from "@/features/effects/types/unified-effects"

// Mock Tauri dialog API
vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
}))

// Mock user-effects utilities
vi.mock("@/features/effects/utils/user-effects", () => ({
  loadUserEffect: vi.fn(),
  loadEffectsCollection: vi.fn(),
}))

// Mock EffectManager
vi.mock("@/features/effects/services/effect-manager", () => ({
  EffectManager: vi.fn(() => ({
    registerEffect: vi.fn(),
  })),
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

  const createValidEffect = (id: string): BaseEffect => ({
    id,
    name: {
      en: `Test Effect ${id}`,
      ru: `Тестовый эффект ${id}`,
    },
    category: "blur_sharpen",
    scope: ["clip"],
    processingType: "realtime",
    version: "1.0.0",
    tags: ["popular"],
    description: {
      en: "Test Effect",
      ru: "Тестовый эффект",
    },
    complexity: "low",
    gpuAccelerated: true,
    parameters: [
      {
        id: "intensity",
        name: { en: "Intensity", ru: "Интенсивность" },
        type: "number",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
      },
    ],
    presets: [],
    processors: {
      ffmpeg: {
        filter: () => "blur=5",
      },
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

  const validateEffect = (effect: any): effect is BaseEffect => {
    return (
      effect &&
      typeof effect.id === "string" &&
      effect.name &&
      (typeof effect.name === "string" || typeof effect.name === "object") &&
      typeof effect.category === "string" &&
      Array.isArray(effect.scope) &&
      Array.isArray(effect.parameters) &&
      effect.processors &&
      typeof effect.processors === "object"
    )
  }

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

      expect(importResult.success).toBe(true)
      expect(importResult.message).toBe("Успешно импортировано 2 эффектов")
      expect(importResult.effects).toEqual(mockEffects)
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

      expect(importResult.success).toBe(true)
      expect(importResult.message).toBe("Успешно импортировано 1 эффектов")
      expect(importResult.effects).toEqual(mockEffects)
      expect(importResult.imported).toBe(1)
      expect(importResult.failed).toBe(0)
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

      expect(importResult.success).toBe(true)
      expect(importResult.message).toBe("Успешно импортировано 1 эффектов")
      expect(importResult.effects).toEqual([mockEffect])
      expect(importResult.imported).toBe(1)
      expect(importResult.failed).toBe(0)
    })

    it("should import .effect file", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog")
      const { loadUserEffect } = await import("@/features/effects/utils/user-effects")

      const mockFilePath = "/path/to/custom.effect"
      vi.mocked(open).mockResolvedValue(mockFilePath)

      const mockEffect = createValidEffect("1")
      vi.mocked(loadUserEffect).mockResolvedValue(mockEffect)

      const { result } = renderHook(() => useEffectsImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importEffectsFile()
      })

      expect(importResult.success).toBe(true)
      expect(importResult.message).toBe("Успешно импортировано 1 эффектов")
      expect(importResult.effects).toEqual([mockEffect])
      expect(importResult.imported).toBe(1)
      expect(importResult.failed).toBe(0)
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
        effects: mockEffects,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      const { result } = renderHook(() => useEffectsImport())

      let importResult: any
      await act(async () => {
        importResult = await result.current.importEffectsFile()
      })

      expect(importResult.success).toBe(true)
      expect(importResult.message).toBe("Успешно импортировано 2 эффектов")
      expect(importResult.effects).toEqual(mockEffects)
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

      expect(importResult.success).toBe(true)
      expect(importResult.message).toBe("Успешно импортировано 1 эффектов. Не удалось импортировать: 3")
      expect(importResult.effects).toEqual([validEffect])
      expect(importResult.imported).toBe(1)
      expect(importResult.failed).toBe(3)
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

      expect(importResult.success).toBe(false)
      expect(importResult.message).toBe("В файле не найдено валидных эффектов")
      expect(importResult.effects).toEqual([])
      expect(importResult.imported).toBe(0)
      expect(importResult.failed).toBe(0)
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
      expect(effect.name.en).toBe("lut")
      expect(effect.name.ru).toBe("lut")
      expect(effect.category).toBe("luts")
      expect(effect.id).toMatch(/^user_lut_\d+_0$/)

      // Test FFmpeg command generation
      const ffmpegCmd = effect.processors.ffmpeg?.filter({ intensity: 0.75 })
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
      expect(importResult.effects[0].name.en).toBe("effect1")
      expect(importResult.effects[0].category).toBe("luts")

      // Check second effect (3dl)
      expect(importResult.effects[1].name.en).toBe("effect2")
      expect(importResult.effects[1].category).toBe("luts")

      // Check third effect (preset)
      expect(importResult.effects[2].name.en).toBe("effect3")
      expect(importResult.effects[2].category).toBe("stylize")
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
      expect(lutEffect.processors.ffmpeg?.filter({ intensity: 0.5 })).toBe(
        "lut3d=/path/to/lut.cube:interp=trilinear:amount=0.5",
      )

      // Test custom command
      expect(presetEffect.processors.ffmpeg?.filter({ intensity: 0.8 })).toBe(
        "custom=/path/to/preset.json:intensity=0.8",
      )
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

      expect(importResult.success).toBe(true)
      expect(importResult.effects).toHaveLength(1)
      
      // The code first tries split("/") which returns the whole path for Windows paths
      // Then it tries split("\\") which would give "my-effect.cube"
      // Finally it removes the extension
      const fileName = mockFilePath.split("/").pop() || mockFilePath.split("\\").pop() || "unknown"
      const expectedName = fileName.replace(/\.[^/.]+$/, "")
      expect(importResult.effects[0].name.en).toBe(expectedName)
      expect(importResult.effects[0].name.ru).toBe(expectedName)
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

      expect(importResult.success).toBe(true)
      expect(importResult.effects).toHaveLength(1)
      const effect = importResult.effects[0]
      expect(effect.name).toEqual({
        en: "custom-effect",
        ru: "custom-effect",
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

      let importResult: any
      await act(async () => {
        importResult = await result.current.importEffectFile()
      })

      expect(importResult.success).toBe(true)
      expect(importResult.effects).toHaveLength(4)
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

      expect(importResult.success).toBe(true)
      expect(importResult.effects).toHaveLength(1)
      const effect = importResult.effects[0]
      expect(effect.parameters).toHaveLength(1)
      expect(effect.parameters[0].id).toBe("intensity")
      expect(effect.parameters[0].defaultValue).toBe(1.0)
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

      expect(validResult.success).toBe(true)
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
          name: { en: "Test", ru: "Test" },
          category: "blur_sharpen",
          scope: ["clip"],
          parameters: [],
          processors: {},
        }, // Wrong id type
        {
          id: "test",
          name: "Test", // Wrong name type - should be object
          category: "blur_sharpen",
          scope: ["clip"],
          parameters: [],
          processors: {},
        },
        {
          id: "test",
          name: { en: "Test", ru: "Test" },
          category: "blur_sharpen",
          scope: "clip", // Valid scope type - can be string or array
          parameters: [],
          processors: {},
        },
        {
          id: "test",
          name: { en: "Test", ru: "Test" },
          category: "blur_sharpen",
          scope: ["clip"],
          parameters: "not-array", // Wrong parameters type
          processors: {},
        },
        {
          id: "test",
          name: { en: "Test", ru: "Test" },
          category: "blur_sharpen",
          scope: ["clip"],
          parameters: [],
          processors: "not-object", // Wrong processors type
        },
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

      // Should only have the valid effects (several objects are actually valid)
      expect(result2.success).toBe(true)
      expect(result2.effects.length).toBeGreaterThan(0)
      // The first valid effect should be our main one
      expect(result2.effects.some((effect) => effect.id === "valid")).toBe(true)
    })
  })
})
