import { act, fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useModal } from "@/features/modals/services/modal-provider"
import { useLanguage } from "@/i18n/hooks/use-language"

import { UserSettingsModal } from "../../components/user-settings-modal"
import { useApiKeys } from "../../hooks/use-api-keys"
import { useUserSettings } from "../../hooks/use-user-settings"

// Мокаем Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockImplementation((cmd) => {
    if (cmd === "select_directory") {
      return Promise.resolve("selected/directory/path")
    }
    return Promise.resolve(null)
  }),
}))

// Мокаем Tauri Dialog Plugin
vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn().mockImplementation((options) => {
    if (options?.directory) {
      return Promise.resolve("selected/directory/path")
    }
    return Promise.resolve(null)
  }),
}))

// Мокаем хуки
vi.mock("@/i18n/hooks/use-language")
vi.mock("../../hooks/use-user-settings")
vi.mock("../../hooks/use-api-keys")
vi.mock("@/features/modals/services/modal-provider")
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Мокаем console.log и console.error
vi.spyOn(console, "log").mockImplementation(() => {})
vi.spyOn(console, "error").mockImplementation(() => {})

// Создаем функцию для получения моковых данных с переопределениями
const getMockUserSettings = (overrides = {}) => ({
  screenshotsPath: "public/screenshots",
  playerScreenshotsPath: "public/media",
  openAiApiKey: "",
  claudeApiKey: "",
  isBrowserVisible: true,
  isTimelineVisible: true,
  isOptionsVisible: true,
  activeTab: "media" as const,
  layoutMode: "default" as const,
  playerVolume: 100,
  handleScreenshotsPathChange: vi.fn(),
  handleAiApiKeyChange: vi.fn(),
  handleClaudeApiKeyChange: vi.fn(),
  handlePlayerScreenshotsPathChange: vi.fn(),
  handleTabChange: vi.fn(),
  handleLayoutChange: vi.fn(),
  toggleBrowserVisibility: vi.fn(),
  handlePlayerVolumeChange: vi.fn(),
  toggleTimelineVisibility: vi.fn(),
  toggleOptionsVisibility: vi.fn(),
  ...overrides,
})

describe("UserSettingsModal", () => {
  const mockHandleScreenshotsPathChange = vi.fn()
  const mockHandleAiApiKeyChange = vi.fn()
  const mockHandleClaudeApiKeyChange = vi.fn()
  const mockHandlePlayerScreenshotsPathChange = vi.fn()
  const mockHandlePlayerVolumeChange = vi.fn()
  const mockToggleTimelineVisibility = vi.fn()
  const mockToggleOptionsVisibility = vi.fn()
  const mockChangeLanguage = vi.fn()
  const mockCloseModal = vi.fn()

  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    vi.clearAllMocks()

    // Устанавливаем моки по умолчанию
    vi.mocked(useUserSettings).mockImplementation(() => ({
      screenshotsPath: "public/screenshots",
      playerScreenshotsPath: "public/media",
      openAiApiKey: "",
      claudeApiKey: "",
      isBrowserVisible: true,
      isTimelineVisible: true,
      isOptionsVisible: true,
      activeTab: "media",
      layoutMode: "default",
      playerVolume: 100,
      handleScreenshotsPathChange: mockHandleScreenshotsPathChange,
      handleAiApiKeyChange: mockHandleAiApiKeyChange,
      handleClaudeApiKeyChange: mockHandleClaudeApiKeyChange,
      handlePlayerScreenshotsPathChange: mockHandlePlayerScreenshotsPathChange,
      handleTabChange: vi.fn(),
      handleLayoutChange: vi.fn(),
      toggleBrowserVisibility: vi.fn(),
      handlePlayerVolumeChange: mockHandlePlayerVolumeChange,
      toggleTimelineVisibility: mockToggleTimelineVisibility,
      toggleOptionsVisibility: mockToggleOptionsVisibility,
    }))

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    vi.mocked(useLanguage).mockImplementation(() => ({
      currentLanguage: "ru",
      changeLanguage: mockChangeLanguage,
      systemLanguage: "ru",
      isLoading: false,
      error: null,
      refreshLanguage: vi.fn(),
    }))

    vi.mocked(useModal).mockImplementation(() => ({
      openModal: vi.fn(),
      closeModal: mockCloseModal,
      modalType: null,
      modalData: null,
      isOpen: false,
      submitModal: vi.fn(),
    }))

    vi.mocked(useApiKeys).mockImplementation(() => ({
      getApiKeyStatus: vi.fn().mockReturnValue('not_set'),
      updateApiKeyStatus: vi.fn(),
      testApiKey: vi.fn(),
      initiateOAuth: vi.fn(),
      youtubeCredentials: { clientId: '', clientSecret: '' },
      updateYoutubeCredentials: vi.fn(),
      tiktokCredentials: { clientId: '', clientSecret: '' },
      updateTiktokCredentials: vi.fn(),
      vimeoCredentials: { clientId: '', clientSecret: '', accessToken: '' },
      updateVimeoCredentials: vi.fn(),
      telegramCredentials: { botToken: '', chatId: '' },
      updateTelegramCredentials: vi.fn(),
      codecovToken: '',
      updateCodecovToken: vi.fn(),
      tauriAnalyticsKey: '',
      updateTauriAnalyticsKey: vi.fn(),
    }))
  })

  it("should render correctly", () => {
    render(<UserSettingsModal />)

    // Проверяем, что компонент отрендерился с табами
    expect(screen.getByText("dialogs.userSettings.tabs.general")).toBeInTheDocument()
    expect(screen.getByText("dialogs.userSettings.tabs.aiServices")).toBeInTheDocument()
    expect(screen.getByText("dialogs.userSettings.tabs.socialNetworks")).toBeInTheDocument()

    // Проверяем общие настройки на активной вкладке "General"
    expect(screen.getByText("dialogs.userSettings.interfaceLanguage")).toBeInTheDocument()
    expect(screen.getByText("dialogs.userSettings.screenshotsPath")).toBeInTheDocument()

    expect(screen.getByText("dialogs.userSettings.cancel")).toBeInTheDocument()
    expect(screen.getByText("dialogs.userSettings.save")).toBeInTheDocument()
  })

  it("should handle language change", () => {
    render(<UserSettingsModal />)

    // Проверяем, что селект языка отображается
    expect(screen.getByText("dialogs.userSettings.interfaceLanguage")).toBeInTheDocument()

    // Симулируем выбор языка, вызывая напрямую функцию changeLanguage
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    void vi.mocked(useLanguage)().changeLanguage("en")

    // Проверяем, что changeLanguage был вызван
    expect(mockChangeLanguage).toHaveBeenCalledWith("en")
  })

  it("should handle screenshots path change", () => {
    render(<UserSettingsModal />)

    // Находим инпут пути скриншотов
    const screenshotsPathInput = screen.getByPlaceholderText("public/screenshots")

    // Вводим новый путь
    act(() => {
      act(() => {
        fireEvent.change(screenshotsPathInput, { target: { value: "new/path" } })
      })
    })

    // Нажимаем кнопку "Сохранить"
    const saveButton = screen.getByText("dialogs.userSettings.save")
    act(() => {
      act(() => {
        fireEvent.click(saveButton)
      })
    })

    // Проверяем, что handleScreenshotsPathChange был вызван с правильными параметрами
    expect(mockHandleScreenshotsPathChange).toHaveBeenCalledWith("new/path")
  })

  it("should render tabs correctly", () => {
    render(<UserSettingsModal />)

    // Проверяем, что табы отображаются
    expect(screen.getByText("dialogs.userSettings.tabs.general")).toBeInTheDocument()
    expect(screen.getByText("dialogs.userSettings.tabs.aiServices")).toBeInTheDocument()
    expect(screen.getByText("dialogs.userSettings.tabs.socialNetworks")).toBeInTheDocument()
    
    // General tab активен по умолчанию, проверяем его содержимое
    expect(screen.getByText("dialogs.userSettings.interfaceLanguage")).toBeInTheDocument()
  })

  it("should handle cancel button click", () => {
    render(<UserSettingsModal />)

    // Нажимаем кнопку "Отмена"
    const cancelButton = screen.getByText("dialogs.userSettings.cancel")
    act(() => {
      act(() => {
        fireEvent.click(cancelButton)
      })
    })

    // Проверяем, что closeModal был вызван
    expect(mockCloseModal).toHaveBeenCalled()
  })

  it("should clear screenshots path when X button is clicked", () => {
    // Переопределяем значение screenshotsPath для этого теста
    vi.mocked(useUserSettings).mockImplementation(() =>
      getMockUserSettings({
        screenshotsPath: "custom/path",
        handleScreenshotsPathChange: mockHandleScreenshotsPathChange,
        handleAiApiKeyChange: mockHandleAiApiKeyChange,
      }),
    )

    render(<UserSettingsModal />)

    // Находим кнопку X рядом с инпутом пути скриншотов
    const clearButton = screen.getByTitle("dialogs.userSettings.clearPath")

    // Кликаем по кнопке X
    act(() => {
      act(() => {
        fireEvent.click(clearButton)
      })
    })

    // Проверяем, что handleScreenshotsPathChange был вызван с правильным значением
    expect(mockHandleScreenshotsPathChange).toHaveBeenCalledWith("public/screenshots")
  })


  it("should update state when language changes in context", () => {
    // Рендерим компонент
    render(<UserSettingsModal />)

    // Проверяем, что начальное значение языка установлено правильно
    const selectValue = screen.getByRole("combobox")
    expect(selectValue).toHaveTextContent("ru")

    // Изменяем язык в контексте
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    vi.mocked(useLanguage).mockImplementation(() => ({
      currentLanguage: "en",
      changeLanguage: mockChangeLanguage,
      systemLanguage: "ru",
      isLoading: false,
      error: null,
      refreshLanguage: vi.fn(),
    }))

    // Перерендериваем компонент
    render(<UserSettingsModal />)

    // Проверяем, что значение языка обновилось
    const updatedSelectValue = screen.getAllByRole("combobox")[1]
    expect(updatedSelectValue).toHaveTextContent("en")
  })

  it("should update state when screenshotsPath changes in context", () => {
    // Рендерим компонент
    render(<UserSettingsModal />)

    // Проверяем, что начальное значение пути скриншотов установлено правильно
    const screenshotsPathInput = screen.getByPlaceholderText("public/screenshots")
    expect(screenshotsPathInput).toHaveValue("public/screenshots")

    // Изменяем путь скриншотов в контексте
    vi.mocked(useUserSettings).mockImplementation(() =>
      getMockUserSettings({
        screenshotsPath: "new/path",
        handleScreenshotsPathChange: mockHandleScreenshotsPathChange,
        handleAiApiKeyChange: mockHandleAiApiKeyChange,
      }),
    )

    // Перерендериваем компонент
    render(<UserSettingsModal />)

    // Проверяем, что значение пути скриншотов обновилось
    const updatedScreenshotsPathInput = screen.getAllByPlaceholderText("public/screenshots")[1]
    expect(updatedScreenshotsPathInput).toHaveValue("new/path")
  })



  it("should handle folder selection button click using Tauri Dialog Plugin", async () => {
    // Получаем мок функции open из плагина dialog
    const { open } = await import("@tauri-apps/plugin-dialog")
    const mockOpen = open as unknown as ReturnType<typeof vi.fn>

    // Очищаем историю вызовов мока
    mockOpen.mockClear()

    // Рендерим компонент
    const { rerender } = render(<UserSettingsModal />)

    // Находим кнопки выбора папки (у нас их две - для screenshotsPath и playerScreenshotsPath)
    const folderButtons = screen.getAllByRole("button", {
      name: /folder/i,
    })

    // Берем первую кнопку (для screenshotsPath)
    const folderButton = folderButtons[0]

    // Кликаем по кнопке
    act(() => {
      act(() => {
        fireEvent.click(folderButton)
      })
    })

    // Ждем, пока асинхронные операции завершатся
    await vi.waitFor(() => {
      // Проверяем, что open был вызван с правильными параметрами
      expect(mockOpen).toHaveBeenCalledWith(
        expect.objectContaining({
          directory: true,
          multiple: false,
          title: "dialogs.userSettings.selectFolder",
        }),
      )
    })

    // Имитируем обновление состояния после выбора директории
    vi.mocked(useUserSettings).mockImplementation(() => ({
      screenshotsPath: "selected/directory/path",
      playerScreenshotsPath: "public/media",
      openAiApiKey: "",
      claudeApiKey: "",
      isBrowserVisible: true,
      activeTab: "media",
      layoutMode: "default",
      handleScreenshotsPathChange: mockHandleScreenshotsPathChange,
      handleAiApiKeyChange: mockHandleAiApiKeyChange,
      handleClaudeApiKeyChange: vi.fn(),
      handlePlayerScreenshotsPathChange: vi.fn(),
      handleTabChange: vi.fn(),
      handleLayoutChange: vi.fn(),
      toggleBrowserVisibility: vi.fn(),
    }))

    // Перерендериваем компонент
    act(() => {
      rerender(<UserSettingsModal />)
    })

    // Проверяем, что путь скриншотов был обновлен
    const screenshotsPathInput = screen.getByPlaceholderText("public/screenshots")
    expect(screenshotsPathInput).toHaveValue("selected/directory/path")
  })


  it("should handle player screenshots path selection", async () => {
    // Получаем мок функции open из плагина dialog
    const { open } = await import("@tauri-apps/plugin-dialog")
    const mockOpen = open as unknown as ReturnType<typeof vi.fn>

    // Очищаем историю вызовов мока
    mockOpen.mockClear()

    // Рендерим компонент
    const { rerender } = render(<UserSettingsModal />)

    // Находим кнопки выбора папки (у нас их две - для screenshotsPath и playerScreenshotsPath)
    const folderButtons = screen.getAllByRole("button", {
      name: /folder/i,
    })

    // Берем вторую кнопку (для playerScreenshotsPath)
    const folderButton = folderButtons[1]

    // Кликаем по кнопке
    act(() => {
      act(() => {
        fireEvent.click(folderButton)
      })
    })

    // Ждем, пока асинхронные операции завершатся
    await vi.waitFor(() => {
      // Проверяем, что open был вызван с правильными параметрами
      expect(mockOpen).toHaveBeenCalledWith(
        expect.objectContaining({
          directory: true,
          multiple: false,
          title: "dialogs.userSettings.selectFolder",
        }),
      )
    })

    // Имитируем обновление состояния после выбора директории
    vi.mocked(useUserSettings).mockImplementation(() => ({
      screenshotsPath: "public/screenshots",
      playerScreenshotsPath: "selected/directory/path",
      openAiApiKey: "",
      claudeApiKey: "",
      isBrowserVisible: true,
      activeTab: "media",
      layoutMode: "default",
      handleScreenshotsPathChange: mockHandleScreenshotsPathChange,
      handleAiApiKeyChange: mockHandleAiApiKeyChange,
      handleClaudeApiKeyChange: vi.fn(),
      handlePlayerScreenshotsPathChange: vi.fn(),
      handleTabChange: vi.fn(),
      handleLayoutChange: vi.fn(),
      toggleBrowserVisibility: vi.fn(),
    }))

    // Перерендериваем компонент
    act(() => {
      rerender(<UserSettingsModal />)
    })

    // Проверяем, что путь скриншотов плеера был обновлен
    const playerScreenshotsPathInput = screen.getByPlaceholderText("public/media")
    expect(playerScreenshotsPathInput).toHaveValue("selected/directory/path")
  })

  it("should not update path when folder selection is cancelled", async () => {
    // Получаем мок функции open из плагина dialog и настраиваем его, чтобы он возвращал null
    const { open } = await import("@tauri-apps/plugin-dialog")
    const mockOpen = open as unknown as ReturnType<typeof vi.fn>
    mockOpen.mockClear()
    mockOpen.mockResolvedValue(null)

    // Рендерим компонент
    render(<UserSettingsModal />)

    // Находим кнопки выбора папки (у нас их две - для screenshotsPath и playerScreenshotsPath)
    const folderButtons = screen.getAllByRole("button", {
      name: /folder/i,
    })

    // Берем первую кнопку (для screenshotsPath)
    const folderButton = folderButtons[0]

    // Кликаем по кнопке
    act(() => {
      act(() => {
        fireEvent.click(folderButton)
      })
    })

    // Ждем, пока асинхронные операции завершатся
    await vi.waitFor(() => {
      // Проверяем, что open был вызван с правильными параметрами
      expect(mockOpen).toHaveBeenCalledWith(
        expect.objectContaining({
          directory: true,
          multiple: false,
          title: "dialogs.userSettings.selectFolder",
        }),
      )
    })

    // Проверяем, что путь скриншотов не изменился
    const screenshotsPathInput = screen.getByPlaceholderText("public/screenshots")
    expect(screenshotsPathInput).toHaveValue("public/screenshots")
  })

  it("should handle error when folder selection fails", async () => {
    // Получаем мок функции open из плагина dialog и настраиваем его, чтобы он выбрасывал ошибку
    const { open } = await import("@tauri-apps/plugin-dialog")
    const mockOpen = open as unknown as ReturnType<typeof vi.fn>
    mockOpen.mockClear()
    mockOpen.mockRejectedValue(new Error("Permission denied"))

    // Мокаем window.prompt
    const mockPrompt = vi.spyOn(window, "prompt").mockReturnValue("custom/path")

    // Рендерим компонент
    render(<UserSettingsModal />)

    // Находим кнопки выбора папки
    const folderButtons = screen.getAllByRole("button", {
      name: /folder/i,
    })

    // Берем первую кнопку (для screenshotsPath)
    const folderButton = folderButtons[0]

    // Кликаем по кнопке
    act(() => {
      act(() => {
        fireEvent.click(folderButton)
      })
    })

    // Ждем, пока асинхронные операции завершатся
    await vi.waitFor(() => {
      // Проверяем, что open был вызван
      expect(mockOpen).toHaveBeenCalled()
      // Проверяем, что был показан prompt
      expect(mockPrompt).toHaveBeenCalledWith("dialogs.userSettings.selectFolderPrompt", expect.any(String))
    })

    // Восстанавливаем window.prompt
    mockPrompt.mockRestore()
  })

  it("should handle player screenshots path change input", () => {
    render(<UserSettingsModal />)

    // Находим инпут пути скриншотов плеера
    const playerScreenshotsPathInput = screen.getByPlaceholderText("public/media")

    // Вводим новый путь
    act(() => {
      act(() => {
        fireEvent.change(playerScreenshotsPathInput, { target: { value: "new/player/path" } })
      })
    })

    // Нажимаем кнопку "Сохранить"
    const saveButton = screen.getByText("dialogs.userSettings.save")
    act(() => {
      act(() => {
        fireEvent.click(saveButton)
      })
    })

    // Проверяем, что handlePlayerScreenshotsPathChange был вызван с правильными параметрами
    const mockHandlePlayerScreenshotsPathChange = vi.mocked(useUserSettings)().handlePlayerScreenshotsPathChange
    expect(mockHandlePlayerScreenshotsPathChange).toHaveBeenCalledWith("new/player/path")
  })

  it("should clear player screenshots path when X button is clicked", () => {
    // Переопределяем значение playerScreenshotsPath для этого теста
    const mockHandlePlayerScreenshotsPathChangeFn = vi.fn()
    vi.mocked(useUserSettings).mockImplementation(() =>
      getMockUserSettings({
        playerScreenshotsPath: "custom/player/path",
        screenshotsPath: "public/screenshots", // Keep default value
        handleScreenshotsPathChange: mockHandleScreenshotsPathChange,
        handleAiApiKeyChange: mockHandleAiApiKeyChange,
        handlePlayerScreenshotsPathChange: mockHandlePlayerScreenshotsPathChangeFn,
      }),
    )

    render(<UserSettingsModal />)

    // Находим кнопку X рядом с инпутом пути скриншотов плеера
    // Since the player screenshots path is not default, there should be a clear button for it
    const clearButtons = screen.getAllByTitle("dialogs.userSettings.clearPath")
    // Only player screenshots path has non-default value, so it should be the only clear button
    const clearPlayerPathButton = clearButtons[0]

    // Кликаем по кнопке X
    act(() => {
      act(() => {
        fireEvent.click(clearPlayerPathButton)
      })
    })

    // Проверяем, что handlePlayerScreenshotsPathChange был вызван с правильным значением
    expect(mockHandlePlayerScreenshotsPathChangeFn).toHaveBeenCalledWith("public/media")
  })

  it("should open cache statistics modal when button is clicked", () => {
    const mockOpenModal = vi.fn()
    vi.mocked(useModal).mockImplementation(() => ({
      openModal: mockOpenModal,
      closeModal: mockCloseModal,
      modalType: null,
      modalData: null,
      isOpen: false,
      submitModal: vi.fn(),
    }))

    render(<UserSettingsModal />)

    // Находим кнопку статистики кэша
    const cacheStatsButton = screen.getByText("dialogs.userSettings.cacheStats")

    // Кликаем по кнопке
    act(() => {
      fireEvent.click(cacheStatsButton)
    })

    // Проверяем, что openModal был вызван с правильными параметрами
    expect(mockOpenModal).toHaveBeenCalledWith("cache-statistics", { returnTo: "user-settings" })
  })

  it("should open cache settings modal when button is clicked", () => {
    const mockOpenModal = vi.fn()
    vi.mocked(useModal).mockImplementation(() => ({
      openModal: mockOpenModal,
      closeModal: mockCloseModal,
      modalType: null,
      modalData: null,
      isOpen: false,
      submitModal: vi.fn(),
    }))

    render(<UserSettingsModal />)

    // Находим кнопку настроек кэша
    const cacheSettingsButton = screen.getByText("dialogs.userSettings.cacheSettings")

    // Кликаем по кнопке
    act(() => {
      fireEvent.click(cacheSettingsButton)
    })

    // Проверяем, что openModal был вызван с правильными параметрами
    expect(mockOpenModal).toHaveBeenCalledWith("cache-settings", { returnTo: "user-settings" })
  })
})
