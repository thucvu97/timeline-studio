/**
 * Безопасный хук для получения контекста Timeline
 * Работает даже если Timeline Provider недоступен (например, в тестах)
 */

// Removed useMemo import as it's no longer needed

// Пытаемся импортировать useTimeline, если доступен
let timelineHook: (() => any) | undefined
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const timelineModule = require("@/features/timeline")
  timelineHook = timelineModule.useTimeline
} catch {
  // Timeline может быть недоступен в тестах
  timelineHook = undefined
}

/**
 * Безопасный хук для получения контекста Timeline
 * Возвращает null если Timeline Provider недоступен
 */
export function useSafeTimeline() {
  if (!timelineHook) {
    return null
  }

  try {
    // Вызываем хук напрямую, не внутри useMemo
    return timelineHook()
  } catch {
    // Timeline Provider может быть недоступен
    return null
  }
}
