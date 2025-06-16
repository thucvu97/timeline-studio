import { assign, createMachine } from "xstate"

import type { BrowserContext } from "@/features/browser/services/browser-state-machine"
import { DEFAULT_CONTENT_SIZES, type PreviewSize, type PreviewSizeKey } from "@/features/media/utils/preview-sizes"

/**
 * Допустимые значения для активного таба в браузере
 * Определяют, какой тип контента отображается в браузере
 */
export const BROWSER_TABS = [
  "media", // Медиа-файлы (видео, изображения)
  "music", // Музыкальные файлы
  "subtitles", // Субтитры
  "transitions", // Переходы между сценами
  "effects", // Эффекты для видео
  "filters", // Фильтры для видео
  "templates", // Шаблоны проектов
  "style-templates", // Стилевые шаблоны
] as const
export const DEFAULT_TAB = "media" // Таб по умолчанию

/**
 * Допустимые значения для макета интерфейса
 * Определяют, как организованы элементы интерфейса
 */
export const LAYOUTS = ["default", "options", "vertical", "chat"] as const
export const DEFAULT_LAYOUT = "default" // Макет по умолчанию

/**
 * Типы для TypeScript, основанные на константах
 */
export type BrowserTab = (typeof BROWSER_TABS)[number] // Тип таба браузера
export type LayoutMode = (typeof LAYOUTS)[number] // Тип макета интерфейса

/**
 * Интерфейс контекста пользовательских настроек
 * Содержит все настройки, которые может изменять пользователь
 *
 * @interface UserSettingsContextType
 */
export interface UserSettingsContextType {
  previewSizes: Record<PreviewSizeKey, PreviewSize> // Размеры превью для разных типов контента
  activeTab: BrowserTab // Активный таб в браузере
  layoutMode: LayoutMode // Текущий макет интерфейса
  screenshotsPath: string // Путь для сохранения скриншотов
  playerScreenshotsPath: string // Путь для сохранения скриншотов из плеера
  playerVolume: number // Громкость плеера (0-100)
  openAiApiKey: string // API ключ для OpenAI
  claudeApiKey: string // API ключ для Claude
  isBrowserVisible: boolean // Флаг видимости браузера
  isTimelineVisible: boolean // Флаг видимости временной шкалы
  isOptionsVisible: boolean // Флаг видимости опций
  isLoaded: boolean // Флаг загрузки настроек
  browserSettings?: BrowserContext // Настройки состояния браузера (опционально)
}

/**
 * Начальный контекст пользовательских настроек
 * Используется при первом запуске или если нет сохраненных настроек
 */
const initialContext: UserSettingsContextType = {
  // Размеры превью по умолчанию для разных типов контента
  previewSizes: DEFAULT_CONTENT_SIZES,
  activeTab: DEFAULT_TAB, // Активный таб по умолчанию
  layoutMode: DEFAULT_LAYOUT, // Макет по умолчанию
  screenshotsPath: "public/screenshots", // Путь для скриншотов по умолчанию
  playerScreenshotsPath: "public/media", // Путь для скриншотов плеера по умолчанию
  playerVolume: 100, // Громкость плеера по умолчанию (100%)
  openAiApiKey: "", // Пустой API ключ OpenAI
  claudeApiKey: "", // Пустой API ключ Claude
  isBrowserVisible: true, // Браузер виден по умолчанию
  isTimelineVisible: true, // Временная шкала видна по умолчанию
  isOptionsVisible: true, // Опции видны по умолчанию
  isLoaded: false, // Флаг загрузки настроек (изначально false)
}

/**
 * Интерфейс события обновления размера превью
 * @interface UpdatePreviewSizeEvent
 */
interface UpdatePreviewSizeEvent {
  type: "UPDATE_PREVIEW_SIZE" // Тип события
  key: PreviewSizeKey // Тип контента для обновления размера
  size: PreviewSize // Новый размер превью
}

/**
 * Интерфейс события обновления активного таба
 * @interface UpdateActiveTabEvent
 */
interface UpdateActiveTabEvent {
  type: "UPDATE_ACTIVE_TAB" // Тип события
  tab: BrowserTab // Новый активный таб
}

/**
 * Интерфейс события обновления макета интерфейса
 * @interface UpdateLayoutEvent
 */
interface UpdateLayoutEvent {
  type: "UPDATE_LAYOUT" // Тип события
  layoutMode: LayoutMode // Новый макет интерфейса
}

/**
 * Интерфейс события обновления пути для скриншотов
 * @interface UpdateScreenshotsPathEvent
 */
interface UpdateScreenshotsPathEvent {
  type: "UPDATE_SCREENSHOTS_PATH" // Тип события
  path: string // Новый путь для скриншотов
}

/**
 * Интерфейс события обновления всех настроек сразу
 * Используется для массового обновления нескольких настроек
 * @interface UpdateAllSettingsEvent
 */
interface UpdateAllSettingsEvent {
  type: "UPDATE_ALL" // Тип события
  settings: Partial<UserSettingsContextType> // Частичные настройки для обновления
}

/**
 * Интерфейс события обновления пути для скриншотов плеера
 * @interface UpdatePlayerScreenshotsPathEvent
 */
interface UpdatePlayerScreenshotsPathEvent {
  type: "UPDATE_PLAYER_SCREENSHOTS_PATH" // Тип события
  path: string // Новый путь для скриншотов плеера
}

/**
 * Интерфейс события обновления API ключа OpenAI
 * @interface UpdateOpenAiApiKeyEvent
 */
interface UpdateOpenAiApiKeyEvent {
  type: "UPDATE_OPENAI_API_KEY" // Тип события
  apiKey: string // Новый API ключ
}

/**
 * Интерфейс события обновления API ключа Claude
 * @interface UpdateClaudeApiKeyEvent
 */
interface UpdateClaudeApiKeyEvent {
  type: "UPDATE_CLAUDE_API_KEY" // Тип события
  apiKey: string // Новый API ключ
}

/**
 * Интерфейс события переключения видимости браузера
 * @interface ToggleBrowserVisibilityEvent
 */
interface ToggleBrowserVisibilityEvent {
  type: "TOGGLE_BROWSER_VISIBILITY" // Тип события
}

/**
 * Интерфейс события переключения видимости временной шкалы
 * @interface ToggleTimelineVisibilityEvent
 */
interface ToggleTimelineVisibilityEvent {
  type: "TOGGLE_TIMELINE_VISIBILITY" // Тип события
}

// ToggleOptionsVisibilityEvent
/**
 * Интерфейс события переключения видимости опций
 * @interface ToggleOptionsVisibilityEvent
 */
interface ToggleOptionsVisibilityEvent {
  type: "TOGGLE_OPTIONS_VISIBILITY" // Тип события
}

/**
 * Интерфейс события обновления громкости плеера
 * @interface UpdatePlayerVolumeEvent
 */
interface UpdatePlayerVolumeEvent {
  type: "UPDATE_PLAYER_VOLUME" // Тип события
  volume: number // Новое значение громкости (0-100)
}

/**
 * Интерфейс события загрузки пользовательских настроек
 * @interface LoadUserSettingsEvent
 */
interface LoadUserSettingsEvent {
  type: "LOAD_SETTINGS" // Тип события
  settings: Partial<UserSettingsContextType> // Загруженные настройки
}

/**
 * Объединенный тип всех событий пользовательских настроек
 * Используется для типизации событий машины состояний
 */
export type UserSettingsEvent =
  | LoadUserSettingsEvent
  | UpdatePreviewSizeEvent
  | UpdateActiveTabEvent
  | UpdateLayoutEvent
  | UpdateScreenshotsPathEvent
  | UpdatePlayerScreenshotsPathEvent
  | UpdateOpenAiApiKeyEvent
  | UpdateClaudeApiKeyEvent
  | ToggleBrowserVisibilityEvent
  | UpdatePlayerVolumeEvent
  | UpdateAllSettingsEvent
  | ToggleTimelineVisibilityEvent
  | ToggleOptionsVisibilityEvent

/**
 * Машина состояний для управления пользовательскими настройками
 * Обрабатывает события обновления настроек
 */
export const userSettingsMachine = createMachine(
  {
    id: "user-settings-v3", // Изменяем ID, чтобы сбросить кэш
    initial: "idle", // Начальное состояние - ожидание (без загрузки из IndexedDB)
    context: {
      ...initialContext,
      isLoaded: true, // Устанавливаем флаг загрузки в true, так как загрузка происходит в app-settings-provider
    }, // Начальный контекст с настройками по умолчанию

    // Определение состояний машины
    states: {
      /**
       * Состояние ожидания (основное состояние машины)
       * Обрабатывает события обновления настроек
       */
      idle: {
        // Действие при входе в состояние
        entry: () => {
          console.log("UserSettingsMachine entered idle state")
        },

        // Используем вложенные состояния, чтобы машина не останавливалась
        initial: "ready",
        states: {
          ready: {}, // Пустое состояние готовности
        },

        // Обработчики событий
        on: {
          // Обновление всех настроек сразу
          UPDATE_ALL: {
            actions: ["updateAllSettings"],
            // Не указываем target, чтобы это был внутренний переход
          },

          // Обновление размера превью
          UPDATE_PREVIEW_SIZE: {
            actions: ["updatePreviewSize"],
          },

          // Обновление активной вкладки
          UPDATE_ACTIVE_TAB: {
            actions: ["updateActiveTab"],
          },

          // Обновление макета интерфейса
          UPDATE_LAYOUT: {
            actions: ["updateLayout"],
          },

          // Обновление пути для скриншотов
          UPDATE_SCREENSHOTS_PATH: {
            actions: ["updateScreenshotsPath"],
          },

          // Обновление пути для скриншотов плеера
          UPDATE_PLAYER_SCREENSHOTS_PATH: {
            actions: ["updatePlayerScreenshotsPath"],
          },

          // Обновление API ключа OpenAI
          UPDATE_OPENAI_API_KEY: {
            actions: ["updateOpenAiApiKey"],
          },

          // Обновление API ключа Claude
          UPDATE_CLAUDE_API_KEY: {
            actions: ["updateClaudeApiKey"],
          },

          // Переключение видимости браузера
          TOGGLE_BROWSER_VISIBILITY: {
            actions: ["toggleBrowserVisibility"],
          },

          // Переключение видимости временной шкалы
          TOGGLE_TIMELINE_VISIBILITY: {
            actions: ["toggleTimelineVisibility"],
          },

          // Переключение видимости опций
          TOGGLE_OPTIONS_VISIBILITY: {
            actions: ["toggleOptionsVisibility"],
          },

          // Обновление громкости плеера
          UPDATE_PLAYER_VOLUME: {
            actions: ["updatePlayerVolume"],
          },
        },
      },
    },
  },
  {
    // Определение действий машины состояний
    actions: {
      /**
       * Действие для обновления всех настроек сразу
       * Объединяет текущий контекст с новыми настройками
       */
      updateAllSettings: assign(({ context, event }) => {
        const typedEvent = event as UpdateAllSettingsEvent
        console.log("Updating all settings:", typedEvent.settings)

        // Возвращаем обновленный контекст
        return {
          ...context, // Текущие настройки
          ...typedEvent.settings, // Новые настройки
        }
      }),

      /**
       * Действие для обновления размера превью
       * Обновляет размер превью для указанного типа контента
       */
      updatePreviewSize: assign(({ context, event }) => {
        const typedEvent = event as UpdatePreviewSizeEvent
        console.log("Updating preview size:", typedEvent.key, typedEvent.size)

        // Создаем копию объекта previewSizes
        const newPreviewSizes = {
          ...context.previewSizes,
        }
        // Обновляем размер для указанного типа контента
        newPreviewSizes[typedEvent.key] = typedEvent.size

        // Возвращаем обновленный контекст
        return {
          ...context,
          previewSizes: newPreviewSizes,
        }
      }),

      /**
       * Действие для обновления активной вкладки
       * Устанавливает новую активную вкладку в браузере
       */
      updateActiveTab: assign(({ context, event }) => {
        const typedEvent = event as UpdateActiveTabEvent
        console.log("Updating active tab:", typedEvent.tab)

        // Возвращаем обновленный контекст
        return {
          ...context,
          activeTab: typedEvent.tab, // Новая активная вкладка
        }
      }),

      /**
       * Действие для обновления макета интерфейса
       * Устанавливает новый макет интерфейса
       */
      updateLayout: assign(({ context, event }) => {
        const typedEvent = event as UpdateLayoutEvent
        console.log("Updating layout mode:", typedEvent.layoutMode)

        // Возвращаем обновленный контекст
        return {
          ...context,
          layoutMode: typedEvent.layoutMode, // Новый макет интерфейса
        }
      }),

      /**
       * Действие для обновления пути для скриншотов плеера
       * Устанавливает новый путь для сохранения скриншотов из плеера
       */
      updatePlayerScreenshotsPath: assign(({ context, event }) => {
        const typedEvent = event as UpdatePlayerScreenshotsPathEvent
        console.log("Updating player screenshots path:", typedEvent.path)

        // Возвращаем обновленный контекст
        return {
          ...context,
          playerScreenshotsPath: typedEvent.path, // Новый путь для скриншотов плеера
        }
      }),

      /**
       * Действие для обновления пути для скриншотов
       * Устанавливает новый путь для сохранения скриншотов
       */
      updateScreenshotsPath: assign(({ context, event }) => {
        const typedEvent = event as UpdateScreenshotsPathEvent
        console.log("Updating screenshots path:", typedEvent.path)

        // Возвращаем обновленный контекст
        return {
          ...context,
          screenshotsPath: typedEvent.path, // Новый путь для скриншотов
        }
      }),

      /**
       * Действие для обновления API ключа OpenAI
       * Устанавливает новый API ключ для OpenAI
       */
      updateOpenAiApiKey: assign(({ context, event }) => {
        const typedEvent = event as UpdateOpenAiApiKeyEvent
        // Скрываем API ключ в логах для безопасности
        console.log("Updating OpenAI API key:", typedEvent.apiKey ? "***" : "(empty)")

        // Возвращаем обновленный контекст
        return {
          ...context,
          openAiApiKey: typedEvent.apiKey, // Новый API ключ OpenAI
        }
      }),

      /**
       * Действие для обновления API ключа Claude
       * Устанавливает новый API ключ для Claude
       */
      updateClaudeApiKey: assign(({ context, event }) => {
        const typedEvent = event as UpdateClaudeApiKeyEvent
        // Скрываем API ключ в логах для безопасности
        console.log("Updating Claude API key:", typedEvent.apiKey ? "***" : "(empty)")

        // Возвращаем обновленный контекст
        return {
          ...context,
          claudeApiKey: typedEvent.apiKey, // Новый API ключ Claude
        }
      }),

      /**
       * Действие для переключения видимости браузера
       */
      toggleBrowserVisibility: assign(({ context }) => {
        console.log("Toggling browser visibility:", !context.isBrowserVisible)

        // Возвращаем обновленный контекст
        return {
          ...context,
          isBrowserVisible: !context.isBrowserVisible, // Инвертируем текущее значение
        }
      }),

      /**
       * Действие для переключения видимости временной шкалы
       */
      toggleTimelineVisibility: assign(({ context }) => {
        console.log("Toggling timeline visibility:", !context.isTimelineVisible)
        return {
          ...context,
          isTimelineVisible: !context.isTimelineVisible,
        }
      }),

      /**
       * Действие для переключения видимости опций
       */
      toggleOptionsVisibility: assign(({ context }) => {
        console.log("Toggling options visibility:", !context.isOptionsVisible)
        return {
          ...context,
          isOptionsVisible: !context.isOptionsVisible,
        }
      }),

      /**
       * Действие для обновления громкости плеера
       * Устанавливает новое значение громкости
       */
      updatePlayerVolume: assign(({ context, event }) => {
        const typedEvent = event as UpdatePlayerVolumeEvent
        console.log("Updating player volume:", typedEvent.volume)

        // Возвращаем обновленный контекст
        return {
          ...context,
          playerVolume: typedEvent.volume, // Новое значение громкости
        }
      }),
    },
  },
)
