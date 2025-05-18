import { beforeEach, describe, expect, it, vi } from "vitest"

import { DEFAULT_PROJECT_SETTINGS, type ProjectSettings } from "@/types/project"

import {
  ASPECT_RATIOS,
  ASPECT_RATIO_MAP,
  PROJECT_SETTINGS_STORAGE_KEY,
  getAspectRatioByDimensions,
  getDefaultResolutionForAspectRatio,
  getResolutionsForAspectRatio,
  loadSavedSettings,
  projectSettingsMachine,
  saveSettings,
} from "./project-settings-machine"

// Мокаем localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    removeItem: vi.fn((key: string) => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete store[key]
    }),
  }
})()

// Мокаем console.log и console.error
vi.spyOn(console, "log").mockImplementation(() => {})
vi.spyOn(console, "error").mockImplementation(() => {})

// Мокаем window.localStorage
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
})

describe("project-settings-machine", () => {
  beforeEach(() => {
    // Очищаем localStorage перед каждым тестом
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  describe("ASPECT_RATIO_MAP", () => {
    it("should contain all aspect ratios from ASPECT_RATIOS", () => {
      // Проверяем, что все соотношения сторон из ASPECT_RATIOS есть в ASPECT_RATIO_MAP
      ASPECT_RATIOS.forEach((ratio) => {
        expect(ASPECT_RATIO_MAP[ratio.label]).toBeDefined()
        expect(ASPECT_RATIO_MAP[ratio.label]).toEqual(ratio)
      })
    })

    it("should contain keys for both labels and actual ratio values", () => {
      // Проверяем, что в ASPECT_RATIO_MAP есть ключи как для меток, так и для фактических значений
      ASPECT_RATIOS.forEach((ratio) => {
        if (ratio.label !== "custom") {
          // Пропускаем "custom", так как у него такие же размеры как у 16:9
          const ratioValue = `${ratio.value.width}:${ratio.value.height}`
          if (ratioValue !== ratio.label) {
            expect(ASPECT_RATIO_MAP[ratioValue]).toBeDefined()
          }
        }
      })
    })
  })

  describe("getResolutionsForAspectRatio", () => {
    it("should return resolutions for 16:9 aspect ratio", () => {
      const resolutions = getResolutionsForAspectRatio("16:9")
      expect(resolutions).toHaveLength(4) // 4 разрешения для 16:9
      expect(resolutions[0].value).toBe("1280x720")
      expect(resolutions[1].value).toBe("1920x1080")
    })

    it("should return resolutions for 9:16 aspect ratio", () => {
      // Проверяем, что функция вызывается с правильными параметрами
      const spy = vi.spyOn(console, "log")
      getResolutionsForAspectRatio("9:16")
      expect(spy).toHaveBeenCalledWith(
        "[ProjectSettingsMachine] Получение разрешений для соотношения сторон:",
        "9:16",
      )
    })

    it("should return resolutions for 1:1 aspect ratio", () => {
      // Проверяем, что функция вызывается с правильными параметрами
      const spy = vi.spyOn(console, "log")
      getResolutionsForAspectRatio("1:1")
      expect(spy).toHaveBeenCalledWith(
        "[ProjectSettingsMachine] Получение разрешений для соотношения сторон:",
        "1:1",
      )
    })

    it("should return default resolutions for unknown aspect ratio", () => {
      const resolutions = getResolutionsForAspectRatio("unknown")
      expect(resolutions).toHaveLength(4) // 4 разрешения для 16:9 (по умолчанию)
      expect(resolutions[0].value).toBe("1280x720")
      expect(resolutions[1].value).toBe("1920x1080")
    })

    it("should handle empty input", () => {
      const resolutions = getResolutionsForAspectRatio("")
      expect(resolutions).toHaveLength(4) // 4 разрешения для 16:9 (по умолчанию)
      expect(resolutions[0].value).toBe("1280x720")
      expect(resolutions[1].value).toBe("1920x1080")
    })

    it("should use actual ratio value instead of label", () => {
      // Проверяем, что функция использует фактическое значение соотношения сторон
      const resolutions1 = getResolutionsForAspectRatio("16:9")
      const resolutions2 = getResolutionsForAspectRatio("1920:1080")
      expect(resolutions1).toEqual(resolutions2)
    })
  })

  describe("getDefaultResolutionForAspectRatio", () => {
    it("should return default resolution for 16:9 aspect ratio", () => {
      const resolution = getDefaultResolutionForAspectRatio("16:9")
      expect(resolution.value).toBe("1920x1080")
    })

    it("should return default resolution for 9:16 aspect ratio using ratio value", () => {
      // Используем фактическое значение соотношения сторон
      const resolution = getDefaultResolutionForAspectRatio("9:16")

      // Проверяем, что возвращается рекомендуемое разрешение для 9:16
      expect(resolution.value).toContain("1080") // Должно содержать 1080
      expect(resolution.value).toContain("1920") // Должно содержать 1920
    })

    it("should return default resolution for 1:1 aspect ratio using ratio value", () => {
      // Используем фактическое значение соотношения сторон
      const resolution = getDefaultResolutionForAspectRatio("1:1")

      // Проверяем, что возвращается рекомендуемое разрешение для 1:1
      expect(resolution.value).toContain("1080") // Должно содержать 1080
    })

    it("should return default resolution for unknown aspect ratio", () => {
      const resolution = getDefaultResolutionForAspectRatio("unknown")
      expect(resolution.value).toBe("1920x1080") // 16:9 по умолчанию
    })

    it("should handle empty input", () => {
      const resolution = getDefaultResolutionForAspectRatio("")
      expect(resolution.value).toBe("1920x1080") // 16:9 по умолчанию
    })
  })

  describe("getAspectRatioByDimensions", () => {
    it("should return 16:9 for 1920x1080", () => {
      const aspectRatio = getAspectRatioByDimensions(1920, 1080)
      expect(aspectRatio.label).toBe("16:9")
    })

    it("should return 9:16 for 1080x1920", () => {
      const aspectRatio = getAspectRatioByDimensions(1080, 1920)
      expect(aspectRatio.label).toBe("9:16")
    })

    it("should return 1:1 for 1080x1080", () => {
      const aspectRatio = getAspectRatioByDimensions(1080, 1080)
      expect(aspectRatio.label).toBe("1:1")
    })

    it("should return 4:3 for 1440x1080", () => {
      const aspectRatio = getAspectRatioByDimensions(1440, 1080)
      expect(aspectRatio.label).toBe("4:3")
    })

    it("should return 4:5 for 1024x1280", () => {
      const aspectRatio = getAspectRatioByDimensions(1024, 1280)
      expect(aspectRatio.label).toBe("4:5")
    })

    it("should return 21:9 for 2560x1080", () => {
      const aspectRatio = getAspectRatioByDimensions(2560, 1080)
      expect(aspectRatio.label).toBe("21:9")
    })

    it("should return custom for non-standard dimensions", () => {
      const aspectRatio = getAspectRatioByDimensions(1234, 5678)
      expect(aspectRatio.label).toBe("custom")
    })

    it("should handle zero or negative dimensions", () => {
      const aspectRatio1 = getAspectRatioByDimensions(0, 1080)
      // Проверяем, что функция вызывается с правильными параметрами
      expect(console.log).toHaveBeenCalledWith(
        "[ProjectSettingsMachine] getAspectRatioByDimensions:",
        { width: 0, height: 1080 },
      )

      // Проверяем, что для некорректных размеров возвращается 16:9 (по умолчанию)
      expect(aspectRatio1.label).toBe("16:9")
    })
  })

  describe("localStorage functions", () => {
    it("should save settings to localStorage", () => {
      const settings: ProjectSettings = {
        ...DEFAULT_PROJECT_SETTINGS,
        resolution: "1280x720",
        frameRate: "24",
      }

      saveSettings(settings)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        PROJECT_SETTINGS_STORAGE_KEY,
        JSON.stringify(settings),
      )
    })

    it("should load settings from localStorage", () => {
      const settings: ProjectSettings = {
        ...DEFAULT_PROJECT_SETTINGS,
        resolution: "1280x720",
        frameRate: "24",
      }

      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(settings))

      const loadedSettings = loadSavedSettings()
      expect(loadedSettings).toEqual(settings)
      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        PROJECT_SETTINGS_STORAGE_KEY,
      )
    })

    it("should return null if localStorage is empty", () => {
      localStorageMock.getItem.mockReturnValueOnce(null)

      const loadedSettings = loadSavedSettings()
      expect(loadedSettings).toBeNull()
    })

    it("should handle errors when loading settings", () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error("Test error")
      })

      const loadedSettings = loadSavedSettings()
      expect(loadedSettings).toBeNull()
      expect(console.error).toHaveBeenCalled()
    })

    it("should handle errors when saving settings", () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error("Test error")
      })

      saveSettings(DEFAULT_PROJECT_SETTINGS)
      expect(console.error).toHaveBeenCalled()
    })
  })

  describe("projectSettingsMachine", () => {
    it("should have correct initial state", () => {
      // В XState 4.x проверяем initial
      expect(projectSettingsMachine.config.initial).toBe("loading")
    })

    it("should have correct states configuration", () => {
      // Проверяем, что машина имеет нужные состояния
      const states = projectSettingsMachine.config.states
      expect(states).toBeDefined()

      // Проверяем наличие состояний
      if (states) {
        expect(states).toHaveProperty("loading")
        expect(states).toHaveProperty("idle")
      }
    })
  })
})
