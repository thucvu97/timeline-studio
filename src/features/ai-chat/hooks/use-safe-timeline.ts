/**
 * Безопасный хук для получения контекста Timeline
 * Работает даже если Timeline Provider недоступен (например, в тестах)
 */

import { useMemo } from "react"

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
  const timelineContext = useMemo(() => {
    if (!timelineHook) {
      return null
    }
    
    try {
      return timelineHook()
    } catch {
      // Timeline Provider может быть недоступен
      return null
    }
  }, [])
  
  return timelineContext
}