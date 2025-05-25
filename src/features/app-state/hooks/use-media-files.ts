import { useAppSettings } from "./use-app-settings";

/**
 * Хук для доступа к медиа-файлам
 * Предоставляет методы для управления медиа-файлами в состоянии приложения
 *
 * @returns Объект с данными и методами для работы с медиа-файлами
 */
export function useMediaFiles() {
  const { getMediaFiles, updateMediaFiles } = useAppSettings();

  return {
    mediaFiles: getMediaFiles(),
    updateMediaFiles,
  };
}
