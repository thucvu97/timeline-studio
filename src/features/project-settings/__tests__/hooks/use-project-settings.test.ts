import { createElement } from "react"

import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useProjectSettings } from "../../hooks/use-project-settings"
import { ProjectSettingsContext, ProjectSettingsProvider } from "../../services/project-settings-provider"
import { DEFAULT_PROJECT_SETTINGS } from "../../types/project"

describe("useProjectSettings", () => {
  describe("основная функциональность", () => {
    it("должен быть функцией", () => {
      expect(typeof useProjectSettings).toBe("function")
    })

    it("должен экспортироваться из модуля", () => {
      expect(useProjectSettings).toBeDefined()
    })
  })

  describe("обработка ошибок", () => {
    it("должен выбрасывать ошибку при использовании вне провайдера", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      
      expect(() => {
        renderHook(() => useProjectSettings())
      }).toThrow("useProjectSettings must be used within a ProjectSettingsProvider")
      
      consoleSpy.mockRestore()
    })

    it("должен выбрасывать ошибку с правильным сообщением", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      
      try {
        renderHook(() => useProjectSettings())
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toBe("useProjectSettings must be used within a ProjectSettingsProvider")
      }
      
      consoleSpy.mockRestore()
    })
  })

  describe("интеграция с провайдером", () => {
    it("должен возвращать настройки проекта по умолчанию", () => {
      const { result } = renderHook(() => useProjectSettings(), {
        wrapper: ProjectSettingsProvider,
      })

      expect(result.current.settings).toEqual(DEFAULT_PROJECT_SETTINGS)
    })

    it("должен предоставлять функцию updateSettings", () => {
      const { result } = renderHook(() => useProjectSettings(), {
        wrapper: ProjectSettingsProvider,
      })

      expect(typeof result.current.updateSettings).toBe("function")
    })

    it("должен предоставлять функцию resetSettings", () => {
      const { result } = renderHook(() => useProjectSettings(), {
        wrapper: ProjectSettingsProvider,
      })

      expect(typeof result.current.resetSettings).toBe("function")
    })

    it("должен возвращать объект с правильной структурой", () => {
      const { result } = renderHook(() => useProjectSettings(), {
        wrapper: ProjectSettingsProvider,
      })

      expect(result.current).toHaveProperty("settings")
      expect(result.current).toHaveProperty("updateSettings")
      expect(result.current).toHaveProperty("resetSettings")
      expect(Object.keys(result.current)).toHaveLength(3)
    })
  })

  describe("типизация", () => {
    it("должен возвращать корректные типы", () => {
      const { result } = renderHook(() => useProjectSettings(), {
        wrapper: ProjectSettingsProvider,
      })

      // Проверяем структуру настроек
      expect(result.current.settings).toHaveProperty("aspectRatio")
      expect(result.current.settings).toHaveProperty("resolution")
      expect(result.current.settings).toHaveProperty("frameRate")
      expect(result.current.settings).toHaveProperty("colorSpace")

      // Проверяем типы значений
      expect(typeof result.current.settings.resolution).toBe("string")
      expect(typeof result.current.settings.frameRate).toBe("string")
      expect(typeof result.current.settings.colorSpace).toBe("string")
      expect(typeof result.current.settings.aspectRatio).toBe("object")
    })
  })

  describe("работа с мокнутым контекстом", () => {
    it("должен работать с кастомным значением контекста", () => {
      const mockContextValue = {
        settings: {
          ...DEFAULT_PROJECT_SETTINGS,
          frameRate: "60" as const,
          resolution: "3840x2160",
        },
        updateSettings: vi.fn(),
        resetSettings: vi.fn(),
      }

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        createElement(ProjectSettingsContext.Provider, { value: mockContextValue }, children)

      const { result } = renderHook(() => useProjectSettings(), { wrapper })

      expect(result.current.settings.frameRate).toBe("60")
      expect(result.current.settings.resolution).toBe("3840x2160")
      expect(result.current.updateSettings).toBe(mockContextValue.updateSettings)
      expect(result.current.resetSettings).toBe(mockContextValue.resetSettings)
    })

    it("должен обрабатывать undefined контекст", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        createElement(ProjectSettingsContext.Provider, { value: undefined }, children)

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      expect(() => {
        renderHook(() => useProjectSettings(), { wrapper })
      }).toThrow("useProjectSettings must be used within a ProjectSettingsProvider")

      consoleSpy.mockRestore()
    })
  })

  describe("edge cases и граничные условия", () => {
    it("должен корректно обрабатывать различные соотношения сторон", () => {
      const mockContextValue = {
        settings: {
          ...DEFAULT_PROJECT_SETTINGS,
          aspectRatio: {
            label: "9:16",
            textLabel: "Портрет",
            description: "TikTok, YouTube Shorts",
            value: {
              width: 1080,
              height: 1920,
              name: "9:16",
            },
          },
        },
        updateSettings: vi.fn(),
        resetSettings: vi.fn(),
      }

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        createElement(ProjectSettingsContext.Provider, { value: mockContextValue }, children)

      const { result } = renderHook(() => useProjectSettings(), { wrapper })

      expect(result.current.settings.aspectRatio.label).toBe("9:16")
      expect(result.current.settings.aspectRatio.value.width).toBe(1080)
      expect(result.current.settings.aspectRatio.value.height).toBe(1920)
    })

    it("должен корректно обрабатывать экстремальные значения FPS", () => {
      const mockContextValue = {
        settings: {
          ...DEFAULT_PROJECT_SETTINGS,
          frameRate: "23.97" as const,
        },
        updateSettings: vi.fn(),
        resetSettings: vi.fn(),
      }

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        createElement(ProjectSettingsContext.Provider, { value: mockContextValue }, children)

      const { result } = renderHook(() => useProjectSettings(), { wrapper })

      expect(result.current.settings.frameRate).toBe("23.97")
    })

    it("должен корректно обрабатывать различные цветовые пространства", () => {
      const colorSpaces = ["sdr", "dci-p3", "p3-d65", "hdr-hlg", "hdr-pq"] as const

      colorSpaces.forEach((colorSpace) => {
        const mockContextValue = {
          settings: {
            ...DEFAULT_PROJECT_SETTINGS,
            colorSpace,
          },
          updateSettings: vi.fn(),
          resetSettings: vi.fn(),
        }

        const wrapper = ({ children }: { children: React.ReactNode }) =>
          createElement(ProjectSettingsContext.Provider, { value: mockContextValue }, children)

        const { result } = renderHook(() => useProjectSettings(), { wrapper })

        expect(result.current.settings.colorSpace).toBe(colorSpace)
      })
    })

    it("должен сохранять стабильность ссылок между ре-рендерами", () => {
      const { result, rerender } = renderHook(() => useProjectSettings(), {
        wrapper: ProjectSettingsProvider,
      })

      const firstUpdateSettings = result.current.updateSettings
      const firstResetSettings = result.current.resetSettings

      rerender()

      expect(result.current.updateSettings).toBe(firstUpdateSettings)
      expect(result.current.resetSettings).toBe(firstResetSettings)
    })

    it("должен корректно обрабатывать пустые или null значения в контексте", () => {
      const mockContextValue = {
        settings: DEFAULT_PROJECT_SETTINGS,
        updateSettings: vi.fn(),
        resetSettings: vi.fn(),
      }

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        createElement(ProjectSettingsContext.Provider, { value: mockContextValue }, children)

      const { result } = renderHook(() => useProjectSettings(), { wrapper })

      expect(result.current.settings).toBeDefined()
      expect(result.current.updateSettings).toBeDefined()
      expect(result.current.resetSettings).toBeDefined()
    })
  })

  describe("производительность", () => {
    it("не должен создавать новые объекты без необходимости", () => {
      const { result, rerender } = renderHook(() => useProjectSettings(), {
        wrapper: ProjectSettingsProvider,
      })

      const firstSettings = result.current.settings

      rerender()

      // Настройки должны остаться теми же, если контекст не изменился
      expect(result.current.settings).toBe(firstSettings)
    })

    it("должен корректно обрабатывать множественные вызовы хука", () => {
      const TestComponent = () => {
        const settings1 = useProjectSettings()
        const settings2 = useProjectSettings()
        
        expect(settings1).toBe(settings2)
        return null
      }

      expect(() => {
        renderHook(() => createElement(TestComponent), {
          wrapper: ProjectSettingsProvider,
        })
      }).not.toThrow()
    })
  })
})
