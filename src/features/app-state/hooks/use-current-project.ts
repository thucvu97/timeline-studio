import { useAppSettings } from "./use-app-settings"

/**
 * Хук для доступа к текущему проекту
 * Предоставляет методы для управления текущим проектом
 *
 * @returns Объект с данными и методами для работы с текущим проектом
 */
export function useCurrentProject() {
  const { getCurrentProject, createNewProject, openProject, saveProject, setProjectDirty } = useAppSettings()

  return {
    currentProject: getCurrentProject(),
    createNewProject,
    openProject,
    saveProject,
    setProjectDirty,
  }
}
