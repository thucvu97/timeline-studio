import i18next from "i18next"
import { assign, createMachine } from "xstate"

import { DEFAULT_PROJECT_SETTINGS, ProjectSettings } from "@/types/project"

/**
 * Ключ для хранения настроек проекта в localStorage
 * Используется для сохранения и загрузки настроек между сессиями
 */
const PROJECT_SETTINGS_STORAGE_KEY = "timeline-studio-project-settings"

/**
 * Функция для загрузки настроек из localStorage
 * Загружает сохраненные настройки проекта или возвращает null, если настройки не найдены
 *
 * @returns {ProjectSettings | null} Загруженные настройки или null
 */
const loadSavedSettings = (): ProjectSettings | null => {
  // Проверяем, что код выполняется в браузере
  if (typeof window === "undefined") return null

  try {
    // Получаем сохраненные настройки из localStorage
    const savedSettings = localStorage.getItem(PROJECT_SETTINGS_STORAGE_KEY)
    if (savedSettings) {
      // Парсим JSON и возвращаем объект настроек
      return JSON.parse(savedSettings)
    }
  } catch (error) {
    // Логируем ошибку, если не удалось загрузить настройки
    console.error(
      "[projectSettingsMachine] Error loading settings from localStorage:",
      error,
    )
  }

  // Если настройки не найдены или произошла ошибка, возвращаем null
  return null
}

/**
 * Функция для сохранения настроек в localStorage
 * Сохраняет настройки проекта для использования в будущих сессиях
 *
 * @param {ProjectSettings} settings - Настройки проекта для сохранения
 */
const saveSettings = (settings: ProjectSettings): void => {
  // Проверяем, что код выполняется в браузере
  if (typeof window === "undefined") return

  try {
    // Сохраняем настройки в localStorage в формате JSON
    localStorage.setItem(PROJECT_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    // Логируем ошибку, если не удалось сохранить настройки
    console.error(
      "[projectSettingsMachine] Error saving settings to localStorage:",
      error,
    )
  }
}

/**
 * Интерфейс контекста машины состояний настроек проекта
 * Содержит текущие настройки проекта
 *
 * @interface ProjectSettingsContext
 * @property {ProjectSettings} settings - Текущие настройки проекта
 */
export interface ProjectSettingsContext {
  settings: ProjectSettings
}

/**
 * Интерфейс событий контекста настроек проекта
 * Определяет методы для взаимодействия с настройками
 *
 * @interface ProjectSettingsContextEvents
 * @property {Function} updateSettings - Метод для обновления настроек
 * @property {Function} resetSettings - Метод для сброса настроек к значениям по умолчанию
 */
export interface ProjectSettingsContextEvents {
  updateSettings: (settings: ProjectSettings) => void
  resetSettings: () => void
}

// Загружаем сохраненные настройки при инициализации
const savedSettings = loadSavedSettings()

/**
 * Начальный контекст машины состояний настроек проекта
 * Использует сохраненные настройки или значения по умолчанию
 */
export const initialProjectContext: ProjectSettingsContext = {
  settings: savedSettings ?? DEFAULT_PROJECT_SETTINGS,
}

/**
 * Интерфейс события обновления настроек
 *
 * @interface UpdateSettingsEvent
 * @property {string} type - Тип события ("UPDATE_SETTINGS")
 * @property {Partial<ProjectSettings>} settings - Частичные настройки для обновления
 */
interface UpdateSettingsEvent {
  type: "UPDATE_SETTINGS"
  settings: Partial<ProjectSettings>
}

/**
 * Интерфейс события сброса настроек
 *
 * @interface ResetSettingsEvent
 * @property {string} type - Тип события ("RESET_SETTINGS")
 */
interface ResetSettingsEvent {
  type: "RESET_SETTINGS"
}

/**
 * Объединенный тип событий машины состояний настроек проекта
 */
type ProjectSettingsEvent = UpdateSettingsEvent | ResetSettingsEvent

/**
 * Машина состояний для управления настройками проекта
 * Обрабатывает события обновления и сброса настроек
 * Сохраняет настройки в localStorage для персистентности между сессиями
 */
export const projectSettingsMachine = createMachine({
  id: "project", // Идентификатор машины состояний
  initial: "idle", // Начальное состояние
  context: initialProjectContext, // Начальный контекст с настройками

  // Типы для TypeScript
  types: {
    context: {} as ProjectSettingsContext,
    events: {} as ProjectSettingsEvent,
  },

  // Определение состояний машины
  states: {
    // Состояние ожидания (основное состояние машины)
    idle: {
      // Обработчики событий
      on: {
        // Обработка события обновления настроек
        UPDATE_SETTINGS: {
          actions: [
            // Обновляем контекст машины с новыми настройками
            assign(({ context, event }) => {
              // Создаем новый объект настроек, объединяя текущие настройки
              // с переданными в событии (частичное обновление)
              const newSettings = {
                ...context.settings,
                ...(event as any).settings,
              }

              // Сохраняем обновленные настройки в localStorage
              saveSettings(newSettings)

              // Возвращаем обновленный контекст
              return {
                settings: newSettings,
              }
            }),
          ],
        },

        // Обработка события сброса настроек
        RESET_SETTINGS: {
          actions: [
            // Сбрасываем настройки к значениям по умолчанию
            assign({
              settings: DEFAULT_PROJECT_SETTINGS,
            }),
            // Удаляем сохраненные настройки из localStorage
            () => {
              if (typeof window !== "undefined") {
                localStorage.removeItem(PROJECT_SETTINGS_STORAGE_KEY)
              }
            },
          ],
        },
      },
    },
  },
})
