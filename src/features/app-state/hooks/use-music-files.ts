import { useAppSettings } from "./use-app-settings"

/**
 * Хук для доступа к музыкальным файлам
 * Предоставляет методы для управления музыкальными файлами в состоянии приложения
 *
 * @returns Объект с данными и методами для работы с музыкальными файлами
 */
export function useMusicFiles() {
  const { getMusicFiles, updateMusicFiles } = useAppSettings()

  return {
    musicFiles: getMusicFiles(),
    updateMusicFiles,
  }
}
