import { useApp } from "../services/app-provider"

/**
 * Хук для доступа к текущему проекту
 * Предоставляет методы для управления текущим проектом
 *
 * @returns Объект с данными и методами для работы с текущим проектом
 */
export function useCurrentProject() {
  const { projectState, executeCommand } = useApp()

  // Получение текущего проекта
  const currentProject = projectState?.project || null

  // Создание нового проекта
  const createNewProject = async (name: string) => {
    return executeCommand({
      type: "CreateProject",
      params: { name, template: "default" }
    })
  }

  // Создание временного проекта
  const createTempProject = async () => {
    return executeCommand({
      type: "CreateProject", 
      params: { name: "Temp Project", template: "temp", temporary: true }
    })
  }

  // Загрузка или создание временного проекта
  const loadOrCreateTempProject = async () => {
    return executeCommand({
      type: "LoadOrCreateTempProject",
      params: {}
    })
  }

  // Открытие проекта
  const openProject = async (projectPath: string) => {
    return executeCommand({
      type: "LoadProject",
      params: { path: projectPath }
    })
  }

  // Сохранение проекта
  const saveProject = async (projectPath?: string) => {
    return executeCommand({
      type: "SaveProject",
      params: { path: projectPath }
    })
  }

  // Пометка проекта как измененного
  const setProjectDirty = (dirty: boolean) => {
    executeCommand({
      type: "SetProjectDirty",
      params: { dirty }
    })
  }

  // Проверка, является ли проект временным
  const isTempProject = currentProject?.metadata?.temporary || false

  return {
    currentProject,
    createNewProject,
    createTempProject,
    loadOrCreateTempProject,
    openProject,
    saveProject,
    setProjectDirty,
    isTempProject,
  }
}
