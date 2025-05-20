import { useMusic } from "./music-provider"

/**
 * @deprecated Используйте useMusic вместо этого хука
 * Этот хук оставлен для обратной совместимости
 */
export function useMusicMachine() {
  return useMusic()
}
