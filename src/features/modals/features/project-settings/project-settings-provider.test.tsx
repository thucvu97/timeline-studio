import { act, render, renderHook, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { DEFAULT_PROJECT_SETTINGS } from "@/types/project"

import { ProjectSettingsProvider, useProjectSettings } from "./project-settings-provider"

// Мокаем машину состояний
vi.mock("./project-settings-machine", () => {
  const mockContext = {
    settings: DEFAULT_PROJECT_SETTINGS,
  }

  return {
    projectSettingsMachine: {
      withConfig: () => ({
        context: mockContext,
      }),
    },
  }
})

// Мокаем useMachine из @xstate/react
const mockSend = vi.fn()
let mockState = {
  context: {
    settings: DEFAULT_PROJECT_SETTINGS,
  },
}

vi.mock("@xstate/react", () => ({
  useMachine: vi.fn(() => [mockState, mockSend]),
}))

// Мокаем console.log и console.error
vi.spyOn(console, "log").mockImplementation(() => {})
vi.spyOn(console, "error").mockImplementation(() => {})

// Компонент-обертка для тестирования хука useProjectSettings
const TestComponent = () => {
  const { settings } = useProjectSettings()
  return (
    <div>
      <div data-testid="aspect-ratio">{settings.aspectRatio.label}</div>
      <div data-testid="resolution">{settings.resolution}</div>
      <div data-testid="frame-rate">{settings.frameRate}</div>
      <div data-testid="color-space">{settings.colorSpace}</div>
    </div>
  )
}

describe("ProjectSettingsProvider", () => {
  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    vi.clearAllMocks()
  })

  it("should provide project settings context", () => {
    render(
      <ProjectSettingsProvider>
        <TestComponent />
      </ProjectSettingsProvider>,
    )

    // Проверяем, что контекст предоставляет правильные значения
    expect(screen.getByTestId("aspect-ratio").textContent).toBe("16:9")
    expect(screen.getByTestId("resolution").textContent).toBe("1920x1080")
    expect(screen.getByTestId("frame-rate").textContent).toBe("30")
    expect(screen.getByTestId("color-space").textContent).toBe("sdr")
  })

  it("should throw error when useProjectSettings is used outside of provider", () => {
    // Мокаем console.error, чтобы подавить ошибки в консоли
    const originalConsoleError = console.error
    console.error = vi.fn()

    // Проверяем, что хук выбрасывает ошибку вне провайдера
    expect(() => {
      renderHook(() => useProjectSettings())
    }).toThrow("useProjectSettingsContext must be used within a ProjectProvider")

    // Восстанавливаем console.error
    console.error = originalConsoleError
  })

  it("should handle settings update", () => {
    // Получаем доступ к send из мока useMachine
    const { result } = renderHook(() => useProjectSettings(), {
      wrapper: ProjectSettingsProvider,
    })

    // Создаем новые настройки
    const newSettings = {
      ...DEFAULT_PROJECT_SETTINGS,
      frameRate: "60" as const,
      colorSpace: "hdr-pq" as const,
    }

    // Обновляем настройки
    act(() => {
      result.current.updateSettings(newSettings)
    })

    // Проверяем, что mockSend был вызван с правильными параметрами
    expect(mockSend).toHaveBeenCalledWith({
      type: "UPDATE_SETTINGS",
      settings: newSettings,
    })
  })

  it("should handle settings reset", () => {
    // Получаем доступ к send из мока useMachine
    const { result } = renderHook(() => useProjectSettings(), {
      wrapper: ProjectSettingsProvider,
    })

    // Сбрасываем настройки
    act(() => {
      result.current.resetSettings()
    })

    // Проверяем, что mockSend был вызван с правильными параметрами
    expect(mockSend).toHaveBeenCalledWith({
      type: "RESET_SETTINGS",
    })
  })

  it("should update context when state changes", () => {
    // Изменяем состояние в моке useMachine
    mockState = {
      context: {
        settings: {
          ...DEFAULT_PROJECT_SETTINGS,
          frameRate: "24" as const,
          colorSpace: "dci-p3" as const,
        },
      },
    }

    render(
      <ProjectSettingsProvider>
        <TestComponent />
      </ProjectSettingsProvider>,
    )

    // Проверяем, что контекст обновился
    expect(screen.getByTestId("frame-rate").textContent).toBe("24")
    expect(screen.getByTestId("color-space").textContent).toBe("dci-p3")
  })
})
