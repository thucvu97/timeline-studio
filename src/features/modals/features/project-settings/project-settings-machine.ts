import { assign, createMachine } from "xstate"

import { DEFAULT_PROJECT_SETTINGS, ProjectSettings } from "@/types/project"

/**
 * Примечание: Функции для работы с localStorage удалены, так как теперь используется
 * централизованное хранилище с Tauri Store через app-settings-provider
 */

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

/**
 * Начальный контекст машины состояний настроек проекта
 * Использует значения по умолчанию
 */
export const initialProjectContext: ProjectSettingsContext = {
  settings: DEFAULT_PROJECT_SETTINGS,
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
 * Настройки проекта сохраняются в файле проекта через app-settings-provider
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

              // Примечание: Сохранение в localStorage удалено, так как теперь настройки проекта
              // сохраняются в файле проекта через app-settings-provider

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
            // Примечание: Удаление из localStorage удалено, так как теперь настройки проекта
            // сохраняются в файле проекта через app-settings-provider
          ],
        },
      },
    },
  },
})
