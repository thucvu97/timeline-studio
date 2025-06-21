import { act, render, renderHook, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useUserSettings } from "../../hooks/use-user-settings"
import { UserSettingsProvider } from "../../services/user-settings-provider"

// Создаем моковый объект для send
const mockSend = vi.fn()

// Создаем моковый объект для состояния
const mockState = {
  context: {
    activeTab: "media",
    layoutMode: "default",
    screenshotsPath: "public/screenshots",
    playerScreenshotsPath: "public/media",
    playerVolume: 100,
    openAiApiKey: "",
    claudeApiKey: "",
    isBrowserVisible: true,
    isTimelineVisible: true,
    isOptionsVisible: true,
    isLoaded: true,
    previewSizes: {
      MEDIA: 100,
      TRANSITIONS: 100,
      TEMPLATES: 100,
    },
  },
  status: "active",
}

// Мокаем useMachine из @xstate/react
vi.mock("@xstate/react", () => ({
  useMachine: vi.fn(() => [mockState, mockSend]),
}))

// Мокаем userSettingsMachine
vi.mock("../../services/user-settings-machine", () => ({
  userSettingsMachine: {
    createMachine: vi.fn(),
  },
}))

// Мокаем console.log и console.error
vi.spyOn(console, "log").mockImplementation(() => {})
vi.spyOn(console, "error").mockImplementation(() => {})

// Компонент-обертка для тестирования хука useUserSettings
const UserSettingsWrapper = ({ children }: { children: React.ReactNode }) => (
  <UserSettingsProvider>{children}</UserSettingsProvider>
)

describe("UserSettingsProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Сбрасываем состояние мока перед каждым тестом
    Object.assign(mockState.context, {
      activeTab: "media",
      layoutMode: "default",
      screenshotsPath: "public/screenshots",
      playerScreenshotsPath: "public/media",
      playerVolume: 100,
      openAiApiKey: "",
      claudeApiKey: "",
      isBrowserVisible: true,
      isTimelineVisible: true,
      isOptionsVisible: true,
      isLoaded: true,
      previewSizes: {
        MEDIA: 100,
        TRANSITIONS: 100,
        TEMPLATES: 100,
      },
    })
  })

  it("should render children", () => {
    render(
      <UserSettingsProvider>
        <div data-testid="test-child">Test Child</div>
      </UserSettingsProvider>,
    )

    expect(screen.getByTestId("test-child")).toBeInTheDocument()
  })

  it("should provide UserSettingsContext", () => {
    const { result } = renderHook(() => useUserSettings(), {
      wrapper: UserSettingsWrapper,
    })

    // Проверяем, что контекст содержит ожидаемые свойства
    expect(result.current).toBeDefined()
    expect(result.current.activeTab).toBe("media")
    expect(result.current.layoutMode).toBe("default")
    expect(result.current.screenshotsPath).toBe("public/screenshots")
    expect(result.current.playerScreenshotsPath).toBe("public/media")
    expect(result.current.playerVolume).toBe(100)
    expect(result.current.openAiApiKey).toBe("")
    expect(result.current.claudeApiKey).toBe("")
    expect(result.current.isBrowserVisible).toBe(true)
    expect(result.current.isTimelineVisible).toBe(true)
    expect(result.current.isOptionsVisible).toBe(true)
  })

  it("should provide methods for interacting with user settings", () => {
    const { result } = renderHook(() => useUserSettings(), {
      wrapper: UserSettingsWrapper,
    })

    // Проверяем наличие всех методов
    expect(result.current.handleTabChange).toBeDefined()
    expect(typeof result.current.handleTabChange).toBe("function")

    expect(result.current.handleLayoutChange).toBeDefined()
    expect(typeof result.current.handleLayoutChange).toBe("function")

    expect(result.current.handleScreenshotsPathChange).toBeDefined()
    expect(typeof result.current.handleScreenshotsPathChange).toBe("function")

    expect(result.current.handlePlayerScreenshotsPathChange).toBeDefined()
    expect(typeof result.current.handlePlayerScreenshotsPathChange).toBe("function")

    expect(result.current.handlePlayerVolumeChange).toBeDefined()
    expect(typeof result.current.handlePlayerVolumeChange).toBe("function")

    expect(result.current.handleAiApiKeyChange).toBeDefined()
    expect(typeof result.current.handleAiApiKeyChange).toBe("function")

    expect(result.current.handleClaudeApiKeyChange).toBeDefined()
    expect(typeof result.current.handleClaudeApiKeyChange).toBe("function")

    expect(result.current.toggleBrowserVisibility).toBeDefined()
    expect(typeof result.current.toggleBrowserVisibility).toBe("function")

    expect(result.current.toggleTimelineVisibility).toBeDefined()
    expect(typeof result.current.toggleTimelineVisibility).toBe("function")

    expect(result.current.toggleOptionsVisibility).toBeDefined()
    expect(typeof result.current.toggleOptionsVisibility).toBe("function")
  })

  it("should throw error when useUserSettings is used outside of provider", () => {
    // Проверяем, что хук выбрасывает ошибку, если используется вне провайдера
    const consoleError = console.error
    console.error = vi.fn() // Подавляем ошибки в консоли во время теста

    expect(() => renderHook(() => useUserSettings())).toThrow(
      "useUserSettings must be used within a UserSettingsProvider",
    )

    console.error = consoleError // Восстанавливаем console.error
  })

  it("should call send with UPDATE_ACTIVE_TAB event when handleTabChange is called", () => {
    // Очищаем моковый объект перед тестом
    mockSend.mockClear()

    // Используем renderHook для тестирования хука useUserSettings
    const { result } = renderHook(() => useUserSettings(), {
      wrapper: UserSettingsWrapper,
    })

    // Вызываем метод изменения вкладки
    act(() => {
      result.current.handleTabChange("music")
    })

    // Проверяем, что send был вызван с правильными параметрами
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
    const mockSend = vi.mocked(useMachine as any)()[1]
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "UPDATE_LAYOUT",
        layoutMode: "vertical",
      }),
    )
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
    const mockSend = vi.mocked(useMachine as any)()[1]
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "UPDATE_SCREENSHOTS_PATH",
        path: "new/path",
      }),
    )
  })

  it("should handle player volume change", () => {
    // Получаем доступ к send из мока useMachine
    const { result } = renderHook(() => useUserSettings(), {
      wrapper: UserSettingsProvider,
    })

    // Изменяем громкость плеера
    act(() => {
      result.current.handlePlayerVolumeChange(75)
    })

    // Проверяем, что send был вызван с правильными параметрами
    expect(mockSend).toHaveBeenCalledWith({
      type: "UPDATE_PLAYER_VOLUME",
      volume: 75,
    })
  })

  it("should handle timeline visibility toggle", () => {
    // Получаем доступ к send из мока useMachine
    const { result } = renderHook(() => useUserSettings(), {
      wrapper: UserSettingsProvider,
    })

    // Переключаем видимость временной шкалы
    act(() => {
      result.current.toggleTimelineVisibility()
    })

    // Проверяем, что send был вызван с правильными параметрами
    expect(mockSend).toHaveBeenCalledWith({
      type: "TOGGLE_TIMELINE_VISIBILITY",
    })
  })

  it("should handle options visibility toggle", () => {
    // Получаем доступ к send из мока useMachine
    const { result } = renderHook(() => useUserSettings(), {
      wrapper: UserSettingsProvider,
    })

    // Переключаем видимость опций
    act(() => {
      result.current.toggleOptionsVisibility()
    })

    // Проверяем, что send был вызван с правильными параметрами
    expect(mockSend).toHaveBeenCalledWith({
      type: "TOGGLE_OPTIONS_VISIBILITY",
    })
  })

  it("should handle Claude API key change", () => {
    // Получаем доступ к send из мока useMachine
    const { result } = renderHook(() => useUserSettings(), {
      wrapper: UserSettingsProvider,
    })

    // Изменяем Claude API ключ
    act(() => {
      result.current.handleClaudeApiKeyChange("claude-test-key")
    })

    // Проверяем, что send был вызван с правильными параметрами
    expect(mockSend).toHaveBeenCalledWith({
      type: "UPDATE_CLAUDE_API_KEY",
      apiKey: "claude-test-key",
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
    const mockSend = vi.mocked(useMachine as any)()[1]
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "UPDATE_OPENAI_API_KEY",
        apiKey: "test-api-key",
      }),
    )
  })

  it("should handle player screenshots path change", async () => {
    // Получаем доступ к send из мока useMachine
    const { result } = renderHook(() => useUserSettings(), {
      wrapper: UserSettingsProvider,
    })

    // Изменяем путь скриншотов плеера
    act(() => {
      result.current.handlePlayerScreenshotsPathChange("new/player/path")
    })

    // Проверяем, что send был вызван с правильными параметрами
    const { useMachine } = await import("@xstate/react")
    const mockSend = vi.mocked(useMachine as any)()[1]
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "UPDATE_PLAYER_SCREENSHOTS_PATH",
        path: "new/player/path",
      }),
    )
  })
})
