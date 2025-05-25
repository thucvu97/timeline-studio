import { useContext } from "react";

import { MusicContext, MusicContextValue } from "../services/music-provider";

/**
 * Хук для использования музыкального контекста
 * Предоставляет доступ к состоянию и методам для управления музыкальными файлами
 *
 * @returns {MusicContextValue} Значение контекста с состояниями и методами
 * @throws {Error} Если хук используется вне MusicProvider
 */
export function useMusic(): MusicContextValue {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error("useMusic must be used within a MusicProvider");
  }
  return context;
}
