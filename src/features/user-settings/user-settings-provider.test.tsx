import { act, render, renderHook, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { UserSettingsProvider, useUserSettings } from "./user-settings-provider"

// Мокаем машину состояний
vi.mock("./user-settings-machine", () => {
  const mockContext = {
    activeTab: "media",
    layoutMode: "default",
    screenshotsPath: "public/screenshots",
    aiApiKey: "",
    isLoaded: true,
    previewSizes: {
      MEDIA: 100,
      TRANSITIONS: 100,
      TEMPLATES: 100,
    },
  }

  return {
    userSettingsMachine: {
      withConfig: () => ({
        context: mockContext,
      }),
    },
  }
})

// Мокаем useMachine из @xstate/react
vi.mock("@xstate/react", () => {
  const mockSend = vi.fn()
  const mockState = {
    context: {
      activeTab: "media",
      layoutMode: "default",
      screenshotsPath: "public/screenshots",
      aiApiKey: "",
      isLoaded: true,
      previewSizes: {
        MEDIA: 100,
        TRANSITIONS: 100,
        TEMPLATES: 100,
      },
    },
  }

  return {
    useMachine: vi.fn(() => [mockState, mockSend]),
  }
})

// Мокаем console.log и console.error
vi.spyOn(console, "log").mockImplementation(() => {})
vi.spyOn(console, "error").mockImplementation(() => {})

// Компонент-обертка для тестирования хука useUserSettings
const TestComponent = () => {
  const { activeTab, layoutMode, screenshotsPath, aiApiKey } = useUserSettings()
  return (
    <div>
      <div data-testid="active-tab">{activeTab}</div>
      <div data-testid="layout-mode">{layoutMode}</div>
      <div data-testid="screenshots-path">{screenshotsPath}</div>
      <div data-testid="ai-api-key">{aiApiKey}</div>
    </div>
  )
}

describe("UserSettingsProvider", () => {
  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    vi.clearAllMocks()
  })

  it("should provide user settings context", () => {
    render(
      <UserSettingsProvider>
        <TestComponent />
      </UserSettingsProvider>,
    )

    // Проверяем, что контекст предоставляет правильные значения
    expect(screen.getByTestId("active-tab").textContent).toBe("media")
    expect(screen.getByTestId("layout-mode").textContent).toBe("default")
    expect(screen.getByTestId("screenshots-path").textContent).toBe(
      "public/screenshots",
    )
    expect(screen.getByTestId("ai-api-key").textContent).toBe("")
  })

  it("should throw error when useUserSettings is used outside of provider", () => {
    // Мокаем console.error, чтобы подавить ошибки в консоли
    const originalConsoleError = console.error
    console.error = vi.fn()

    // Проверяем, что хук выбрасывает ошибку вне провайдера
    expect(() => {
      renderHook(() => useUserSettings())
    }).toThrow("useUserSettings must be used within a UserSettingsProvider")

    // Восстанавливаем console.error
    console.error = originalConsoleError
  })

  it("should log state updates", async () => {
    render(
      <UserSettingsProvider>
        <TestComponent />
      </UserSettingsProvider>,
    )

    // Проверяем, что состояние логируется
    expect(console.log).toHaveBeenCalledWith(
      "UserSettingsProvider: state updated",
      expect.objectContaining({
        activeTab: "media",
        layoutMode: "default",
        screenshotsPath: "public/screenshots",
        aiApiKey: "",
      }),
    )
  })

  it("should handle tab change", async () => {
    // Получаем доступ к send из мока useMachine
    const { result } = renderHook(() => useUserSettings(), {
      wrapper: UserSettingsProvider,
    })

    // Изменяем активную вкладку
    act(() => {
      result.current.handleTabChange("music")
    })

    // Проверяем, что send был вызван с правильными параметрами
    const { useMachine } = await import("@xstate/react")
    const mockSend = vi.mocked(useMachine)()[1]
    expect(mockSend).toHaveBeenCalledWith({
      type: "UPDATE_ACTIVE_TAB",
      tab: "music",
    })
  })

  it("should handle layout change", async () => {
    // Получаем доступ к send из мока useMachine
    const { result } = renderHook(() => useUserSettings(), {
      wrapper: UserSettingsProvider,
    })

    // Изменяем макет
    act(() => {
      result.current.handleLayoutChange("vertical")
    })

    // Проверяем, что send был вызван с правильными параметрами
    const { useMachine } = await import("@xstate/react")
    const mockSend = vi.mocked(useMachine)()[1]
    expect(mockSend).toHaveBeenCalledWith({
      type: "UPDATE_LAYOUT",
      layoutMode: "vertical",
    })
  })

  it("should handle screenshots path change", async () => {
    // Получаем доступ к send из мока useMachine
    const { result } = renderHook(() => useUserSettings(), {
      wrapper: UserSettingsProvider,
    })

    // Изменяем путь скриншотов
    act(() => {
      result.current.handleScreenshotsPathChange("new/path")
    })

    // Проверяем, что send был вызван с правильными параметрами
    const { useMachine } = await import("@xstate/react")
    const mockSend = vi.mocked(useMachine)()[1]
    expect(mockSend).toHaveBeenCalledWith({
      type: "UPDATE_SCREENSHOTS_PATH",
      path: "new/path",
    })
  })

  it("should handle AI API key change", async () => {
    // Получаем доступ к send из мока useMachine
    const { result } = renderHook(() => useUserSettings(), {
      wrapper: UserSettingsProvider,
    })

    // Изменяем API ключ
    act(() => {
      result.current.handleAiApiKeyChange("test-api-key")
    })

    // Проверяем, что send был вызван с правильными параметрами
    const { useMachine } = await import("@xstate/react")
    const mockSend = vi.mocked(useMachine)()[1]
    expect(mockSend).toHaveBeenCalledWith({
      type: "UPDATE_AI_API_KEY",
      apiKey: "test-api-key",
    })
  })
})
