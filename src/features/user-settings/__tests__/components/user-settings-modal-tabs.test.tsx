import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useModal } from "@/features/modals/services/modal-provider"
import { useLanguage } from "@/i18n/hooks/use-language"

import { UserSettingsModalTabs } from "../../components/user-settings-modal-tabs"
import { useApiKeys } from "../../hooks/use-api-keys"
import { useUserSettings } from "../../hooks/use-user-settings"

// Мокаем хуки
vi.mock("../../hooks/use-user-settings")
vi.mock("../../hooks/use-api-keys")
vi.mock("@/i18n/hooks/use-language")
vi.mock("@/features/modals/services/modal-provider")
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Мокаем Tauri Dialog Plugin
vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn().mockResolvedValue("selected/path"),
}))

describe("UserSettingsModalTabs", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Мок для useUserSettings
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
    }))

    // Мок для useApiKeys
    vi.mocked(useApiKeys).mockImplementation(() => ({
      getApiKeyStatus: vi.fn().mockReturnValue("not_set"),
      updateApiKeyStatus: vi.fn(),
      testApiKey: vi.fn(),
      initiateOAuth: vi.fn(),
      youtubeCredentials: { clientId: "", clientSecret: "" },
      updateYoutubeCredentials: vi.fn(),
      tiktokCredentials: { clientId: "", clientSecret: "" },
      updateTiktokCredentials: vi.fn(),
      vimeoCredentials: { clientId: "", clientSecret: "", accessToken: "" },
      updateVimeoCredentials: vi.fn(),
      telegramCredentials: { botToken: "", chatId: "" },
      updateTelegramCredentials: vi.fn(),
      codecovToken: "",
      updateCodecovToken: vi.fn(),
      tauriAnalyticsKey: "",
      updateTauriAnalyticsKey: vi.fn(),
    }))

    // Мок для useLanguage
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    vi.mocked(useLanguage).mockImplementation(() => ({
      currentLanguage: "ru",
      changeLanguage: vi.fn(),
      systemLanguage: "ru",
      isLoading: false,
      error: null,
      refreshLanguage: vi.fn(),
    }))

    // Мок для useModal
    vi.mocked(useModal).mockImplementation(() => ({
      openModal: vi.fn(),
      closeModal: vi.fn(),
      modalType: null,
      modalData: null,
      isOpen: false,
      submitModal: vi.fn(),
    }))
  })

  it("should render main tabs correctly", () => {
    render(<UserSettingsModalTabs />)

    // Проверяем, что основные вкладки отображаются
    expect(screen.getByText("dialogs.userSettings.tabs.general")).toBeInTheDocument()
    expect(screen.getByText("dialogs.userSettings.tabs.aiServices")).toBeInTheDocument()
    expect(screen.getByText("dialogs.userSettings.tabs.socialNetworks")).toBeInTheDocument()
    // Development вкладка показывается только в dev режиме
  })

  it("should show General tab content by default", () => {
    render(<UserSettingsModalTabs />)

    // Проверяем, что общие настройки отображаются по умолчанию
    expect(screen.getByText("dialogs.userSettings.interfaceLanguage")).toBeInTheDocument()
    expect(screen.getByText("dialogs.userSettings.screenshotsPath")).toBeInTheDocument()
  })

  it("should have clickable tabs", () => {
    render(<UserSettingsModalTabs />)

    // Проверяем, что табы кликабельны
    const aiServicesTab = screen.getByText("dialogs.userSettings.tabs.aiServices")
    const socialNetworksTab = screen.getByText("dialogs.userSettings.tabs.socialNetworks")

    expect(aiServicesTab).toBeInTheDocument()
    expect(socialNetworksTab).toBeInTheDocument()

    // Проверяем, что это кнопки
    expect(aiServicesTab.closest("button")).toBeInTheDocument()
    expect(socialNetworksTab.closest("button")).toBeInTheDocument()
  })
})
