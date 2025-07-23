import { act, render, renderHook, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { BaseProviders } from "@/test/test-utils"

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
    // GPU и производительность
    gpuAccelerationEnabled: true,
    preferredGpuEncoder: "h264",
    maxConcurrentJobs: 4,
    renderQuality: "high",
    backgroundRenderingEnabled: true,
    renderDelay: 0,
    // Настройки прокси
    proxyEnabled: false,
    proxyType: "http",
    proxyHost: "",
    proxyPort: "",
    proxyUsername: "",
    proxyPassword: "",
    // Настройки автосохранения
    autoSaveEnabled: true,
    autoSaveInterval: 300,
  },
  status: "active",
}

// Создаем мок состояния для AppProvider
const mockAppState = {
  context: {
    isConnected: true,
    error: null,
    projectState: null,
  },
  matches: vi.fn(() => false),
}

const mockAppSend = vi.fn()

// Счетчик вызовов useMachine для различения машин
let useMachineCallCount = 0

// Мокаем useMachine из @xstate/react
vi.mock("@xstate/react", () => ({
  useMachine: vi.fn(() => {
    useMachineCallCount++
    // Первый вызов - это appMachine из AppProvider
    if (useMachineCallCount === 1) {
      return [mockAppState, mockAppSend]
    }
    // Последующие вызовы - это userSettingsMachine
    return [mockState, mockSend]
  }),
}))

// Мокаем userSettingsMachine
vi.mock("../../services/user-settings-machine", () => ({
  userSettingsMachine: {
    createMachine: vi.fn(),
  },
}))

// Мокаем useAppSettings
vi.mock("@/features/app-state/hooks/use-app-settings", () => ({
  useAppSettings: vi.fn(() => ({
    settings: {},
    state: {
      context: {
        isLoading: false,
        currentProject: {
          path: "/path/to/project",
        },
      },
    },
    send: vi.fn(),
    updateUserSettings: vi.fn(),
  })),
}))

// Мокаем AppSettingsProvider и useAppState
vi.mock("@/features/app-state", () => ({
  AppSettingsProvider: ({ children }: any) => children,
  useAppSettings: vi.fn(() => ({
    settings: {},
    state: {
      context: {
        isLoading: false,
        currentProject: {
          path: "/path/to/project",
        },
      },
    },
    send: vi.fn(),
    updateUserSettings: vi.fn(),
  })),
  useAppState: vi.fn(() => ({
    state: {
      context: {
        isConnected: true,
        error: null,
        projectState: null,
      },
      matches: vi.fn(() => false),
    },
    send: vi.fn(),
  })),
}))

// Мокаем сохранение настроек
vi.mock("../../utils/user-settings-storage", () => ({
  saveUserSettings: vi.fn(),
  loadUserSettings: vi.fn(() => ({})),
}))

// Мокаем console.log и console.error
vi.spyOn(console, "log").mockImplementation(() => {})
vi.spyOn(console, "error").mockImplementation(() => {})

// Компонент-обертка для тестирования хука useUserSettings
const UserSettingsWrapper = ({ children }: { children: React.ReactNode }) => (
  <BaseProviders>
    <UserSettingsProvider>{children}</UserSettingsProvider>
  </BaseProviders>
)

describe("UserSettingsProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Сбрасываем счетчик вызовов useMachine
    useMachineCallCount = 0

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
      // GPU и производительность
      gpuAccelerationEnabled: true,
      preferredGpuEncoder: "h264",
      maxConcurrentJobs: 4,
      renderQuality: "high",
      backgroundRenderingEnabled: true,
      renderDelay: 0,
      // Настройки прокси
      proxyEnabled: false,
      proxyType: "http",
      proxyHost: "",
      proxyPort: "",
      proxyUsername: "",
      proxyPassword: "",
      // Настройки автосохранения
      autoSaveEnabled: true,
      autoSaveInterval: 300,
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

  it("should handle layout change", () => {
    mockSend.mockClear()
    const { result } = renderHook(() => useUserSettings(), {
      wrapper: UserSettingsWrapper,
    })

    // Изменяем макет
    act(() => {
      result.current.handleLayoutChange("vertical")
    })

    // Проверяем, что send был вызван с правильными параметрами
    expect(mockSend).toHaveBeenCalledWith({
      type: "UPDATE_LAYOUT",
      layoutMode: "vertical",
    })
  })

  it("should handle screenshots path change", () => {
    mockSend.mockClear()
    const { result } = renderHook(() => useUserSettings(), {
      wrapper: UserSettingsWrapper,
    })

    // Изменяем путь скриншотов
    act(() => {
      result.current.handleScreenshotsPathChange("new/path")
    })

    // Проверяем, что send был вызван с правильными параметрами
    expect(mockSend).toHaveBeenCalledWith({
      type: "UPDATE_SCREENSHOTS_PATH",
      path: "new/path",
    })
  })

  it("should handle player volume change", () => {
    mockSend.mockClear()
    const { result } = renderHook(() => useUserSettings(), {
      wrapper: UserSettingsWrapper,
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
    mockSend.mockClear()
    const { result } = renderHook(() => useUserSettings(), {
      wrapper: UserSettingsWrapper,
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
    mockSend.mockClear()
    const { result } = renderHook(() => useUserSettings(), {
      wrapper: UserSettingsWrapper,
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
    mockSend.mockClear()
    const { result } = renderHook(() => useUserSettings(), {
      wrapper: UserSettingsWrapper,
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

  it("should handle AI API key change", () => {
    mockSend.mockClear()
    const { result } = renderHook(() => useUserSettings(), {
      wrapper: UserSettingsWrapper,
    })

    // Изменяем API ключ
    act(() => {
      result.current.handleAiApiKeyChange("test-api-key")
    })

    // Проверяем, что send был вызван с правильными параметрами
    expect(mockSend).toHaveBeenCalledWith({
      type: "UPDATE_OPENAI_API_KEY",
      apiKey: "test-api-key",
    })
  })

  it("should handle player screenshots path change", () => {
    mockSend.mockClear()
    const { result } = renderHook(() => useUserSettings(), {
      wrapper: UserSettingsWrapper,
    })

    // Изменяем путь скриншотов плеера
    act(() => {
      result.current.handlePlayerScreenshotsPathChange("new/player/path")
    })

    // Проверяем, что send был вызван с правильными параметрами
    expect(mockSend).toHaveBeenCalledWith({
      type: "UPDATE_PLAYER_SCREENSHOTS_PATH",
      path: "new/player/path",
    })
  })

  describe("handleTabChange", () => {
    it("should handle invalid tab values", () => {
      mockSend.mockClear()
      const { result } = renderHook(() => useUserSettings(), {
        wrapper: UserSettingsWrapper,
      })

      // Вызываем с недопустимым значением
      act(() => {
        result.current.handleTabChange("invalid-tab")
      })

      // Проверяем, что send не был вызван
      expect(mockSend).not.toHaveBeenCalled()
      expect(console.error).toHaveBeenCalledWith("Invalid tab value:", "invalid-tab")
    })

    it("should update tab and save settings for valid values", async () => {
      mockSend.mockClear()
      const mockUpdateUserSettings = vi.fn()

      // Обновляем мок через импортированную функцию
      const { useAppSettings } = await import("@/features/app-state/hooks/use-app-settings")
      vi.mocked(useAppSettings).mockReturnValue({
        settings: {},
        state: { context: { isLoading: false, currentProject: { path: "/path" } } },
        send: vi.fn(),
        updateUserSettings: mockUpdateUserSettings,
      })

      const { result } = renderHook(() => useUserSettings(), {
        wrapper: UserSettingsWrapper,
      })

      act(() => {
        result.current.handleTabChange("effects")
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "UPDATE_ACTIVE_TAB",
        tab: "effects",
      })
      expect(mockUpdateUserSettings).toHaveBeenCalledWith({ activeTab: "effects" })
    })
  })

  describe("handleLayoutChange", () => {
    it("should handle invalid layout values", () => {
      mockSend.mockClear()
      const { result } = renderHook(() => useUserSettings(), {
        wrapper: UserSettingsWrapper,
      })

      act(() => {
        result.current.handleLayoutChange("invalid-layout" as any)
      })

      expect(mockSend).not.toHaveBeenCalled()
      expect(console.error).toHaveBeenCalledWith("Invalid layout value:", "invalid-layout")
    })

    it("should update layout and save settings for valid values", async () => {
      mockSend.mockClear()
      const mockUpdateUserSettings = vi.fn()

      // Обновляем мок через импортированную функцию
      const { useAppSettings } = await import("@/features/app-state/hooks/use-app-settings")
      vi.mocked(useAppSettings).mockReturnValue({
        settings: {},
        state: { context: { isLoading: false, currentProject: { path: "/path" } } },
        send: vi.fn(),
        updateUserSettings: mockUpdateUserSettings,
      })

      const { result } = renderHook(() => useUserSettings(), {
        wrapper: UserSettingsWrapper,
      })

      act(() => {
        result.current.handleLayoutChange("chat")
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "UPDATE_LAYOUT",
        layoutMode: "chat",
      })
      expect(mockUpdateUserSettings).toHaveBeenCalledWith({ layoutMode: "chat" })
    })
  })

  describe("GPU and Performance Settings", () => {
    it("should handle GPU acceleration change", () => {
      mockSend.mockClear()
      const { result } = renderHook(() => useUserSettings(), {
        wrapper: UserSettingsWrapper,
      })

      act(() => {
        result.current.handleGpuAccelerationChange(false)
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "UPDATE_GPU_ACCELERATION",
        enabled: false,
      })
    })

    it("should handle preferred GPU encoder change", () => {
      mockSend.mockClear()
      const { result } = renderHook(() => useUserSettings(), {
        wrapper: UserSettingsWrapper,
      })

      act(() => {
        result.current.handlePreferredGpuEncoderChange("h265")
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "UPDATE_PREFERRED_GPU_ENCODER",
        encoder: "h265",
      })
    })

    it("should handle max concurrent jobs change", () => {
      mockSend.mockClear()
      const { result } = renderHook(() => useUserSettings(), {
        wrapper: UserSettingsWrapper,
      })

      act(() => {
        result.current.handleMaxConcurrentJobsChange(8)
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "UPDATE_MAX_CONCURRENT_JOBS",
        jobs: 8,
      })
    })

    it("should handle render quality change", () => {
      mockSend.mockClear()
      const { result } = renderHook(() => useUserSettings(), {
        wrapper: UserSettingsWrapper,
      })

      act(() => {
        result.current.handleRenderQualityChange("medium")
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "UPDATE_RENDER_QUALITY",
        quality: "medium",
      })
    })

    it("should handle background rendering change", () => {
      mockSend.mockClear()
      const { result } = renderHook(() => useUserSettings(), {
        wrapper: UserSettingsWrapper,
      })

      act(() => {
        result.current.handleBackgroundRenderingChange(false)
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "UPDATE_BACKGROUND_RENDERING",
        enabled: false,
      })
    })

    it("should handle render delay change", () => {
      mockSend.mockClear()
      const { result } = renderHook(() => useUserSettings(), {
        wrapper: UserSettingsWrapper,
      })

      act(() => {
        result.current.handleRenderDelayChange(500)
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "UPDATE_RENDER_DELAY",
        delay: 500,
      })
    })
  })

  describe("Proxy Settings", () => {
    it("should handle proxy enabled change", () => {
      mockSend.mockClear()
      const { result } = renderHook(() => useUserSettings(), {
        wrapper: UserSettingsWrapper,
      })

      act(() => {
        result.current.handleProxyEnabledChange(true)
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "UPDATE_PROXY_ENABLED",
        enabled: true,
      })
    })

    it("should handle proxy type change", () => {
      mockSend.mockClear()
      const { result } = renderHook(() => useUserSettings(), {
        wrapper: UserSettingsWrapper,
      })

      act(() => {
        result.current.handleProxyTypeChange("socks5")
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "UPDATE_PROXY_TYPE",
        proxyType: "socks5",
      })
    })

    it("should handle proxy host change", () => {
      mockSend.mockClear()
      const { result } = renderHook(() => useUserSettings(), {
        wrapper: UserSettingsWrapper,
      })

      act(() => {
        result.current.handleProxyHostChange("proxy.example.com")
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "UPDATE_PROXY_HOST",
        host: "proxy.example.com",
      })
    })

    it("should handle proxy port change", () => {
      mockSend.mockClear()
      const { result } = renderHook(() => useUserSettings(), {
        wrapper: UserSettingsWrapper,
      })

      act(() => {
        result.current.handleProxyPortChange("8080")
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "UPDATE_PROXY_PORT",
        port: "8080",
      })
    })

    it("should handle proxy username change", () => {
      mockSend.mockClear()
      const { result } = renderHook(() => useUserSettings(), {
        wrapper: UserSettingsWrapper,
      })

      act(() => {
        result.current.handleProxyUsernameChange("user123")
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "UPDATE_PROXY_USERNAME",
        username: "user123",
      })
    })

    it("should handle proxy password change", () => {
      mockSend.mockClear()
      const { result } = renderHook(() => useUserSettings(), {
        wrapper: UserSettingsWrapper,
      })

      act(() => {
        result.current.handleProxyPasswordChange("password123")
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "UPDATE_PROXY_PASSWORD",
        password: "password123",
      })
    })
  })

  describe("AutoSave Settings", () => {
    it("should handle auto save enabled change", () => {
      mockSend.mockClear()
      const { result } = renderHook(() => useUserSettings(), {
        wrapper: UserSettingsWrapper,
      })

      act(() => {
        result.current.handleAutoSaveEnabledChange(false)
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "UPDATE_AUTO_SAVE_ENABLED",
        enabled: false,
      })
    })

    it("should handle auto save interval change", () => {
      mockSend.mockClear()
      const { result } = renderHook(() => useUserSettings(), {
        wrapper: UserSettingsWrapper,
      })

      act(() => {
        result.current.handleAutoSaveIntervalChange(600)
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "UPDATE_AUTO_SAVE_INTERVAL",
        interval: 600,
      })
    })
  })

  describe("toggleBrowserVisibility", () => {
    it("should toggle browser visibility", () => {
      mockSend.mockClear()
      const { result } = renderHook(() => useUserSettings(), {
        wrapper: UserSettingsWrapper,
      })

      act(() => {
        result.current.toggleBrowserVisibility()
      })

      expect(mockSend).toHaveBeenCalledWith({
        type: "TOGGLE_BROWSER_VISIBILITY",
      })
    })
  })

  describe("Additional GPU and Performance properties in context", () => {
    it("should provide all GPU and performance properties", () => {
      const { result } = renderHook(() => useUserSettings(), {
        wrapper: UserSettingsWrapper,
      })

      expect(result.current.gpuAccelerationEnabled).toBe(true)
      expect(result.current.preferredGpuEncoder).toBe("h264")
      expect(result.current.maxConcurrentJobs).toBe(4)
      expect(result.current.renderQuality).toBe("high")
      expect(result.current.backgroundRenderingEnabled).toBe(true)
      expect(result.current.renderDelay).toBe(0)
    })
  })

  describe("Additional proxy properties in context", () => {
    it("should provide all proxy properties", () => {
      const { result } = renderHook(() => useUserSettings(), {
        wrapper: UserSettingsWrapper,
      })

      expect(result.current.proxyEnabled).toBe(false)
      expect(result.current.proxyType).toBe("http")
      expect(result.current.proxyHost).toBe("")
      expect(result.current.proxyPort).toBe("")
      expect(result.current.proxyUsername).toBe("")
      expect(result.current.proxyPassword).toBe("")
    })
  })

  describe("Additional autosave properties in context", () => {
    it("should provide all autosave properties", () => {
      const { result } = renderHook(() => useUserSettings(), {
        wrapper: UserSettingsWrapper,
      })

      expect(result.current.autoSaveEnabled).toBe(true)
      expect(result.current.autoSaveInterval).toBe(300)
    })
  })

  describe("All handler methods should be defined", () => {
    it("should provide all GPU handler methods", () => {
      const { result } = renderHook(() => useUserSettings(), {
        wrapper: UserSettingsWrapper,
      })

      expect(result.current.handleGpuAccelerationChange).toBeDefined()
      expect(typeof result.current.handleGpuAccelerationChange).toBe("function")
      expect(result.current.handlePreferredGpuEncoderChange).toBeDefined()
      expect(typeof result.current.handlePreferredGpuEncoderChange).toBe("function")
      expect(result.current.handleMaxConcurrentJobsChange).toBeDefined()
      expect(typeof result.current.handleMaxConcurrentJobsChange).toBe("function")
      expect(result.current.handleRenderQualityChange).toBeDefined()
      expect(typeof result.current.handleRenderQualityChange).toBe("function")
      expect(result.current.handleBackgroundRenderingChange).toBeDefined()
      expect(typeof result.current.handleBackgroundRenderingChange).toBe("function")
      expect(result.current.handleRenderDelayChange).toBeDefined()
      expect(typeof result.current.handleRenderDelayChange).toBe("function")
    })

    it("should provide all proxy handler methods", () => {
      const { result } = renderHook(() => useUserSettings(), {
        wrapper: UserSettingsWrapper,
      })

      expect(result.current.handleProxyEnabledChange).toBeDefined()
      expect(typeof result.current.handleProxyEnabledChange).toBe("function")
      expect(result.current.handleProxyTypeChange).toBeDefined()
      expect(typeof result.current.handleProxyTypeChange).toBe("function")
      expect(result.current.handleProxyHostChange).toBeDefined()
      expect(typeof result.current.handleProxyHostChange).toBe("function")
      expect(result.current.handleProxyPortChange).toBeDefined()
      expect(typeof result.current.handleProxyPortChange).toBe("function")
      expect(result.current.handleProxyUsernameChange).toBeDefined()
      expect(typeof result.current.handleProxyUsernameChange).toBe("function")
      expect(result.current.handleProxyPasswordChange).toBeDefined()
      expect(typeof result.current.handleProxyPasswordChange).toBe("function")
    })

    it("should provide all autosave handler methods", () => {
      const { result } = renderHook(() => useUserSettings(), {
        wrapper: UserSettingsWrapper,
      })

      expect(result.current.handleAutoSaveEnabledChange).toBeDefined()
      expect(typeof result.current.handleAutoSaveEnabledChange).toBe("function")
      expect(result.current.handleAutoSaveIntervalChange).toBeDefined()
      expect(typeof result.current.handleAutoSaveIntervalChange).toBe("function")
    })
  })
})
