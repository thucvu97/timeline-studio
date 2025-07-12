import React from "react"

import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { useProjectSettings } from "../../hooks/use-project-settings"
import { ProjectSettingsProvider } from "../../services/project-settings-provider"
import { DEFAULT_PROJECT_SETTINGS } from "../../types/project"

describe("useProjectSettings - интеграционные тесты", () => {
  describe("интеграция с ProjectSettingsProvider", () => {
    it("должен корректно инициализироваться с настройками по умолчанию", () => {
      const { result } = renderHook(() => useProjectSettings(), {
        wrapper: ProjectSettingsProvider,
      })

      expect(result.current.settings).toEqual(DEFAULT_PROJECT_SETTINGS)
      expect(result.current.settings.aspectRatio.label).toBe("16:9")
      expect(result.current.settings.resolution).toBe("1920x1080")
      expect(result.current.settings.frameRate).toBe("30")
      expect(result.current.settings.colorSpace).toBe("sdr")
    })

    it("должен предоставлять функции для изменения настроек", () => {
      const { result } = renderHook(() => useProjectSettings(), {
        wrapper: ProjectSettingsProvider,
      })

      expect(typeof result.current.updateSettings).toBe("function")
      expect(typeof result.current.resetSettings).toBe("function")
    })

    it("должен работать с несколькими экземплярами хука", () => {
      const TestComponent = () => {
        const settings1 = useProjectSettings()
        const settings2 = useProjectSettings()

        // Оба хука должны возвращать одинаковые данные
        expect(settings1.settings).toEqual(settings2.settings)
        expect(settings1.updateSettings).toBe(settings2.updateSettings)
        expect(settings1.resetSettings).toBe(settings2.resetSettings)

        return null
      }

      expect(() => {
        renderHook(() => React.createElement(TestComponent), {
          wrapper: ProjectSettingsProvider,
        })
      }).not.toThrow()
    })
  })

  describe("совместимость с различными провайдерами", () => {
    it("должен работать в вложенных провайдерах", () => {
      const NestedWrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(ProjectSettingsProvider, {}, React.createElement(ProjectSettingsProvider, {}, children))

      const { result } = renderHook(() => useProjectSettings(), {
        wrapper: NestedWrapper,
      })

      expect(result.current.settings).toEqual(DEFAULT_PROJECT_SETTINGS)
      expect(typeof result.current.updateSettings).toBe("function")
      expect(typeof result.current.resetSettings).toBe("function")
    })

    it("должен предоставлять стабильный API", () => {
      const { result } = renderHook(() => useProjectSettings(), {
        wrapper: ProjectSettingsProvider,
      })

      // Проверяем что API содержит все необходимые методы
      expect(result.current).toHaveProperty("settings")
      expect(result.current).toHaveProperty("updateSettings")
      expect(result.current).toHaveProperty("resetSettings")

      // Проверяем что настройки имеют правильную структуру
      expect(result.current.settings).toHaveProperty("aspectRatio")
      expect(result.current.settings).toHaveProperty("resolution")
      expect(result.current.settings).toHaveProperty("frameRate")
      expect(result.current.settings).toHaveProperty("colorSpace")
    })
  })
})
