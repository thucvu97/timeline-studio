/**
 * Настройка XState Inspector для отладки state машин
 */

import { createBrowserInspector } from "@statelyai/inspect"

// Глобальная переменная для инспектора
let inspector: ReturnType<typeof createBrowserInspector> | null = null

/**
 * Инициализирует XState Inspector в режиме разработки
 */
export function setupXStateInspector() {
  // Включаем инспектор только в режиме разработки
  if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    inspector = createBrowserInspector()
    console.log("[XState Inspector] Initialized. Stately Inspector will open in a new tab when actors are created.")
    return inspector
  }
  return null
}

/**
 * Получить инспектор для использования с акторами
 */
export function getInspector() {
  return inspector
}

/**
 * Опции для актора с включенным инспектором
 */
export const getInspectOptions = () => {
  if (process.env.NODE_ENV === "development" && inspector) {
    return { inspect: inspector.inspect }
  }
  return {}
}
