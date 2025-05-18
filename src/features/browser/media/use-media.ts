import { useContext } from "react"

import { MediaContext } from "./media-provider"

/**
 * Хук для доступа к контексту медиафайлов
 * @returns Контекст медиафайлов
 * @throws Ошибку, если хук используется вне MediaProvider
 */
export function useMedia() {
  const context = useContext(MediaContext)

  if (!context) {
    throw new Error("useMedia must be used within a MediaProvider")
  }

  return context
}
