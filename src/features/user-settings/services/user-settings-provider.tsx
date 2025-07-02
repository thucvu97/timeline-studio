import { createContext } from "react"

import { useMachine } from "@xstate/react"

import { useAppSettings } from "@/features/app-state"

import { BrowserTab, LayoutMode, userSettingsMachine } from "./user-settings-machine"

/**
 * Интерфейс значения контекста пользовательских настроек
 * Определяет данные и методы, доступные через хук useUserSettings
 *
 * @interface UserSettingsContextValue
 */
export interface UserSettingsContextValue {
  // Данные настроек
  activeTab: BrowserTab // Активная вкладка в браузере
  layoutMode: LayoutMode // Текущий макет интерфейса
  playerScreenshotsPath: string // Путь для сохранения скриншотов плеера
  screenshotsPath: string // Путь для сохранения скриншотов
  playerVolume: number // Громкость плеера (0-100)
  openAiApiKey: string // API ключ OpenAI
  claudeApiKey: string // API ключ Claude
  isBrowserVisible: boolean // Флаг видимости браузера
  isTimelineVisible: boolean // Флаг видимости временной шкалы
  isOptionsVisible: boolean // Флаг видимости опций

  // GPU и производительность
  gpuAccelerationEnabled: boolean
  preferredGpuEncoder: string
  maxConcurrentJobs: number
  renderQuality: string
  backgroundRenderingEnabled: boolean
  renderDelay: number

  // Настройки прокси
  proxyEnabled: boolean
  proxyType: string
  proxyHost: string
  proxyPort: string
  proxyUsername: string
  proxyPassword: string

  // Настройки автосохранения
  autoSaveEnabled: boolean
  autoSaveInterval: number

  // Методы для изменения настроек
  handleTabChange: (value: string) => void // Изменение активной вкладки
  handleLayoutChange: (value: LayoutMode) => void // Изменение макета интерфейса
  handleScreenshotsPathChange: (value: string) => void // Изменение пути для скриншотов
  handlePlayerScreenshotsPathChange: (value: string) => void // Изменение пути для скриншотов плеера
  handlePlayerVolumeChange: (value: number) => void // Изменение громкости плеера
  handleAiApiKeyChange: (value: string) => void // Изменение API ключа OpenAI
  handleClaudeApiKeyChange: (value: string) => void // Изменение API ключа Claude
  toggleBrowserVisibility: () => void // Переключение видимости браузера
  toggleTimelineVisibility: () => void // Переключение видимости временной шкалы
  toggleOptionsVisibility: () => void // Переключение видимости опций

  // Методы для GPU и производительности
  handleGpuAccelerationChange: (value: boolean) => void
  handlePreferredGpuEncoderChange: (value: string) => void
  handleMaxConcurrentJobsChange: (value: number) => void
  handleRenderQualityChange: (value: string) => void
  handleBackgroundRenderingChange: (value: boolean) => void
  handleRenderDelayChange: (value: number) => void

  // Методы для прокси
  handleProxyEnabledChange: (value: boolean) => void
  handleProxyTypeChange: (value: string) => void
  handleProxyHostChange: (value: string) => void
  handleProxyPortChange: (value: string) => void
  handleProxyUsernameChange: (value: string) => void
  handleProxyPasswordChange: (value: string) => void

  // Методы для автосохранения
  handleAutoSaveEnabledChange: (value: boolean) => void
  handleAutoSaveIntervalChange: (value: number) => void
}

/**
 * Контекст для хранения и предоставления доступа к пользовательским настройкам
 * Изначально не имеет значения (undefined)
 */

export const UserSettingsContext = createContext<UserSettingsContextValue | undefined>(undefined)

/**
 * Провайдер пользовательских настроек
 * Компонент, который предоставляет доступ к пользовательским настройкам через контекст
 * Использует XState машину состояний для управления настройками
 *
 * @param {Object} props - Пропсы компонента
 * @param {React.ReactNode} props.children - Дочерние компоненты
 * @returns {JSX.Element} Провайдер контекста с пользовательскими настройками
 */
export function UserSettingsProvider({ children }: { children: React.ReactNode }) {
  console.log("UserSettingsProvider rendering")

  // Получаем доступ к app settings для сохранения пользовательских настроек
  const { updateUserSettings: saveUserSettings } = useAppSettings()

  // Инициализируем машину состояний для управления пользовательскими настройками
  const [state, send] = useMachine(userSettingsMachine)

  // Отладочные логи
  console.log("UserSettingsProvider state:", state.context)
  console.log("UserSettingsProvider state status:", state.status)

  // Хелпер для обновления настроек с сохранением
  const updateSettingAndSave = (event: any, partialSettings: any) => {
    // Обновляем локальное состояние
    send(event)
    // Сохраняем в persistent storage
    saveUserSettings(partialSettings)
  }

  // Создаем значение контекста, которое будет доступно через хук useUserSettings
  const value = {
    // Данные настроек из контекста машины состояний
    activeTab: state.context.activeTab,
    layoutMode: state.context.layoutMode,
    screenshotsPath: state.context.screenshotsPath,
    playerScreenshotsPath: state.context.playerScreenshotsPath,
    playerVolume: state.context.playerVolume,
    openAiApiKey: state.context.openAiApiKey,
    claudeApiKey: state.context.claudeApiKey,
    isBrowserVisible: state.context.isBrowserVisible,
    isTimelineVisible: state.context.isTimelineVisible,
    isOptionsVisible: state.context.isOptionsVisible,

    // GPU и производительность
    gpuAccelerationEnabled: state.context.gpuAccelerationEnabled,
    preferredGpuEncoder: state.context.preferredGpuEncoder,
    maxConcurrentJobs: state.context.maxConcurrentJobs,
    renderQuality: state.context.renderQuality,
    backgroundRenderingEnabled: state.context.backgroundRenderingEnabled,
    renderDelay: state.context.renderDelay,

    // Настройки прокси
    proxyEnabled: state.context.proxyEnabled,
    proxyType: state.context.proxyType,
    proxyHost: state.context.proxyHost,
    proxyPort: state.context.proxyPort,
    proxyUsername: state.context.proxyUsername,
    proxyPassword: state.context.proxyPassword,

    // Настройки автосохранения
    autoSaveEnabled: state.context.autoSaveEnabled,
    autoSaveInterval: state.context.autoSaveInterval,

    /**
     * Обработчик изменения активной вкладки
     * @param {string} value - Новое значение активной вкладки
     */
    handleTabChange: (value: string) => {
      console.log("Tab change requested:", value)
      // Проверяем, что значение является допустимым BrowserTab
      if (["media", "music", "transitions", "effects", "filters", "templates"].includes(value)) {
        // Обновляем состояние и сохраняем
        updateSettingAndSave(
          {
            type: "UPDATE_ACTIVE_TAB",
            tab: value as BrowserTab,
          },
          { activeTab: value as BrowserTab }
        )
        console.log("Active tab updated:", value)
      } else {
        console.error("Invalid tab value:", value)
      }
    },

    /**
     * Обработчик изменения макета интерфейса
     * @param {LayoutMode} value - Новый макет интерфейса
     */
    handleLayoutChange: (value: LayoutMode) => {
      console.log("Layout change requested:", value)
      console.log("Current layoutMode before update:", state.context.layoutMode)

      // Проверяем, что значение является допустимым LayoutMode
      if (["default", "options", "vertical", "chat"].includes(value)) {
        console.log("Updating layoutMode:", value)
        // Обновляем состояние и сохраняем
        updateSettingAndSave(
          {
            type: "UPDATE_LAYOUT",
            layoutMode: value,
          },
          { layoutMode: value }
        )
      } else {
        console.error("Invalid layout value:", value)
      }
    },

    /**
     * Обработчик изменения пути для скриншотов плеера
     * @param {string} value - Новый путь для скриншотов плеера
     */
    handlePlayerScreenshotsPathChange: (value: string) => {
      console.log("Player screenshots path change requested:", value)
      // Отправляем событие в машину состояний
      send({
        type: "UPDATE_PLAYER_SCREENSHOTS_PATH",
        path: value,
      })
      console.log("Player screenshots path updated:", value)
    },

    /**
     * Обработчик изменения пути для скриншотов
     * @param {string} value - Новый путь для скриншотов
     */
    handleScreenshotsPathChange: (value: string) => {
      console.log("Screenshots path change requested:", value)
      // Отправляем событие в машину состояний
      send({
        type: "UPDATE_SCREENSHOTS_PATH",
        path: value,
      })
      console.log("Screenshots path updated:", value)
    },

    /**
     * Обработчик изменения API ключа OpenAI
     * @param {string} value - Новый API ключ OpenAI
     */
    handleAiApiKeyChange: (value: string) => {
      // Скрываем API ключ в логах для безопасности
      console.log("AI API key change requested:", value ? "***" : "(empty)")
      // Отправляем событие в машину состояний
      send({
        type: "UPDATE_OPENAI_API_KEY",
        apiKey: value,
      })
      console.log("AI API key updated")
    },

    /**
     * Обработчик изменения API ключа Claude
     * @param {string} value - Новый API ключ Claude
     */
    handleClaudeApiKeyChange: (value: string) => {
      // Скрываем API ключ в логах для безопасности
      console.log("Claude API key change requested:", value ? "***" : "(empty)")
      // Отправляем событие в машину состояний
      send({
        type: "UPDATE_CLAUDE_API_KEY",
        apiKey: value,
      })
      console.log("Claude API key updated")
    },

    /**
     * Обработчик изменения громкости плеера
     * @param {number} value - Новое значение громкости (0-100)
     */
    handlePlayerVolumeChange: (value: number) => {
      console.log("Player volume change requested:", value)
      // Обновляем состояние и сохраняем
      updateSettingAndSave(
        {
          type: "UPDATE_PLAYER_VOLUME",
          volume: value,
        },
        { playerVolume: value }
      )
      console.log("Player volume updated")
    },

    /**
     * Обработчик переключения видимости браузера
     * Инвертирует текущее значение флага видимости
     */
    toggleBrowserVisibility: () => {
      console.log("Browser visibility toggle requested")
      // Отправляем событие в машину состояний
      send({
        type: "TOGGLE_BROWSER_VISIBILITY",
      })
      console.log("Browser visibility toggled")
    },

    toggleTimelineVisibility: () => {
      console.log("Timeline visibility toggle requested")
      // Отправляем событие в машину состояний
      send({
        type: "TOGGLE_TIMELINE_VISIBILITY",
      })
      console.log("Timeline visibility toggled")
    },

    toggleOptionsVisibility: () => {
      console.log("Options visibility toggle requested")
      // Отправляем событие в машину состояний
      send({
        type: "TOGGLE_OPTIONS_VISIBILITY",
      })
      console.log("Options visibility toggled")
    },

    // Методы для GPU и производительности
    handleGpuAccelerationChange: (value: boolean) => {
      send({
        type: "UPDATE_GPU_ACCELERATION",
        enabled: value,
      })
    },

    handlePreferredGpuEncoderChange: (value: string) => {
      send({
        type: "UPDATE_PREFERRED_GPU_ENCODER",
        encoder: value,
      })
    },

    handleMaxConcurrentJobsChange: (value: number) => {
      send({
        type: "UPDATE_MAX_CONCURRENT_JOBS",
        jobs: value,
      })
    },

    handleRenderQualityChange: (value: string) => {
      send({
        type: "UPDATE_RENDER_QUALITY",
        quality: value,
      })
    },

    handleBackgroundRenderingChange: (value: boolean) => {
      send({
        type: "UPDATE_BACKGROUND_RENDERING",
        enabled: value,
      })
    },

    handleRenderDelayChange: (value: number) => {
      send({
        type: "UPDATE_RENDER_DELAY",
        delay: value,
      })
    },

    // Методы для прокси
    handleProxyEnabledChange: (value: boolean) => {
      send({
        type: "UPDATE_PROXY_ENABLED",
        enabled: value,
      })
    },

    handleProxyTypeChange: (value: string) => {
      send({
        type: "UPDATE_PROXY_TYPE",
        proxyType: value,
      })
    },

    handleProxyHostChange: (value: string) => {
      send({
        type: "UPDATE_PROXY_HOST",
        host: value,
      })
    },

    handleProxyPortChange: (value: string) => {
      send({
        type: "UPDATE_PROXY_PORT",
        port: value,
      })
    },

    handleProxyUsernameChange: (value: string) => {
      send({
        type: "UPDATE_PROXY_USERNAME",
        username: value,
      })
    },

    handleProxyPasswordChange: (value: string) => {
      send({
        type: "UPDATE_PROXY_PASSWORD",
        password: value,
      })
    },

    // Методы для автосохранения
    handleAutoSaveEnabledChange: (value: boolean) => {
      send({
        type: "UPDATE_AUTO_SAVE_ENABLED",
        enabled: value,
      })
    },

    handleAutoSaveIntervalChange: (value: number) => {
      send({
        type: "UPDATE_AUTO_SAVE_INTERVAL",
        interval: value,
      })
    },
  }

  // Возвращаем провайдер контекста с созданным значением
  return <UserSettingsContext.Provider value={value}>{children}</UserSettingsContext.Provider>
}
