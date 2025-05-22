import { createContext, useContext, useMemo } from "react"

import { useMachine } from "@xstate/react"

import type { ProjectSettings } from "@/types/project"

import { projectSettingsMachine } from "./project-settings-machine"

/**
 * Интерфейс пропсов для компонента ProjectSettingsProvider
 * @interface ProjectProviderProps
 * @property {React.ReactNode} children - Дочерние компоненты, которые будут иметь доступ к контексту
 */
interface ProjectProviderProps {
  children: React.ReactNode
}

/**
 * Интерфейс контекста настроек проекта
 * Определяет данные и методы, доступные через хук useProjectSettings
 *
 * @interface ProjectSettingsContextType
 * @property {ProjectSettings} settings - Текущие настройки проекта
 * @property {Function} updateSettings - Функция для обновления настроек проекта
 * @property {Function} resetSettings - Функция для сброса настроек проекта к значениям по умолчанию
 */
interface ProjectSettingsContextType {
  settings: ProjectSettings
  updateSettings: (settings: ProjectSettings) => void
  resetSettings: () => void
}

/**
 * Контекст для хранения и предоставления доступа к настройкам проекта
 * Изначально не имеет значения (undefined)
 */
const ProjectSettingsContext = createContext<ProjectSettingsContextType | undefined>(undefined)

/**
 * Провайдер настроек проекта
 * Компонент, который предоставляет доступ к настройкам проекта через контекст
 * Использует XState машину состояний для управления настройками
 *
 * @param {ProjectProviderProps} props - Пропсы компонента
 * @returns {JSX.Element} Провайдер контекста с настройками проекта
 */
export function ProjectSettingsProvider({ children }: ProjectProviderProps) {
  // Инициализируем машину состояний для управления настройками проекта
  const [state, send] = useMachine(projectSettingsMachine)

  // Создаем значение контекста, которое будет доступно через хук useProjectSettings
  // Используем useMemo для оптимизации производительности
  const value = useMemo(
    () => ({
      ...state.context, // Передаем текущий контекст машины состояний (настройки)
      // Метод для обновления настроек проекта
      updateSettings: (settings: ProjectSettings) => send({ type: "UPDATE_SETTINGS", settings }),
      // Метод для сброса настроек проекта к значениям по умолчанию
      resetSettings: () => send({ type: "RESET_SETTINGS" }),
    }),
    [state.context, send], // Пересоздаем значение только при изменении контекста или функции send
  )

  // Возвращаем провайдер контекста с созданным значением
  return <ProjectSettingsContext.Provider value={value}>{children}</ProjectSettingsContext.Provider>
}

/**
 * Хук для доступа к настройкам проекта
 * Предоставляет доступ к текущим настройкам проекта и методам для их изменения
 *
 * @returns {ProjectSettingsContextType} Объект с настройками проекта и методами для их изменения
 * @throws {Error} Если хук используется вне компонента ProjectSettingsProvider
 */
export function useProjectSettings(): ProjectSettingsContextType {
  // Получаем значение контекста
  const context = useContext(ProjectSettingsContext)

  // Проверяем, что хук используется внутри провайдера
  if (!context) {
    throw new Error("useProjectSettingsContext must be used within a ProjectProvider")
  }

  // Возвращаем значение контекста
  return context
}
