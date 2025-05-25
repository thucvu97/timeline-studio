import { useAppSettings } from "./use-app-settings";

/**
 * Хук для доступа к списку последних открытых проектов
 * Предоставляет методы для управления списком недавних проектов
 *
 * @returns Объект с данными и методами для работы с недавними проектами
 */
export function useRecentProjects() {
  const {
    getRecentProjects,
    addRecentProject,
    removeRecentProject,
    clearRecentProjects,
  } = useAppSettings();

  return {
    recentProjects: getRecentProjects(),
    addRecentProject,
    removeRecentProject,
    clearRecentProjects,
  };
}
