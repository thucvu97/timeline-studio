import { useCallback, useEffect, useState } from "react"

import { useTranslation } from "react-i18next"

import { Transition } from "@/types/transitions"

import transitionsData from "../data/transitions.json"
import { createFallbackTransition, processTransitions, validateTransitionsData } from "../utils/transition-processor"
// Импортируем JSON файл напрямую - в Tauri это работает отлично

interface UseTransitionsReturn {
  transitions: Transition[]
  loading: boolean
  error: string | null
  reload: () => void
  isReady: boolean
}

/**
 * Хук для загрузки и управления переходами из JSON файла
 */
export function useTransitions(): UseTransitionsReturn {
  const { t } = useTranslation()
  const [transitions, setTransitions] = useState<Transition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Загружает переходы из импортированного JSON файла
   */
  const loadTransitions = useCallback(() => {
    try {
      setLoading(true)
      setError(null)

      // Используем импортированные данные - в Tauri это работает мгновенно
      const data = transitionsData

      // Валидируем данные
      if (!validateTransitionsData(data)) {
        throw new Error(t("transitions.errors.invalidTransitionsData", "Invalid transitions data structure"))
      }

      // Обрабатываем переходы (преобразуем в типизированные объекты)
      const processedTransitions = processTransitions(data.transitions)

      setTransitions(processedTransitions)

      console.log(
        `✅ ${t("transitions.messages.transitionsLoaded", "Loaded {{count}} transitions from JSON", { count: processedTransitions.length })}`,
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t("transitions.errors.unknownError", "Unknown error")
      setError(
        t("transitions.errors.failedToLoadTransitions", "Failed to load transitions: {{error}}", {
          error: errorMessage,
        }),
      )

      // Создаем fallback переходы в случае ошибки
      const fallbackTransitions = [
        createFallbackTransition("fade"),
        createFallbackTransition("zoom"),
        createFallbackTransition("slide"),
      ]

      setTransitions(fallbackTransitions)

      console.error(
        `❌ ${t("transitions.errors.fallbackTransitions", "Failed to load transitions, using fallback")}:`,
        err,
      )
    } finally {
      setLoading(false)
    }
  }, [t])

  // Загружаем переходы при монтировании компонента
  useEffect(() => {
    loadTransitions()
  }, [loadTransitions])

  return {
    transitions,
    loading,
    error,
    reload: loadTransitions,
    isReady: !loading && transitions.length > 0,
  }
}

/**
 * Хук для получения конкретного перехода по ID
 */
export function useTransitionById(transitionId: string): Transition | null {
  const { transitions, isReady } = useTransitions()

  if (!isReady) {
    return null
  }

  return transitions.find((transition: Transition) => transition.id === transitionId) || null
}

/**
 * Хук для получения переходов по категории
 */
export function useTransitionsByCategory(category: string): Transition[] {
  const { transitions, isReady } = useTransitions()

  if (!isReady) {
    return []
  }

  return transitions.filter((transition: Transition) => transition.category === category)
}

/**
 * Хук для поиска переходов
 */
export function useTransitionsSearch(query: string, lang: "ru" | "en" = "ru"): Transition[] {
  const { transitions, isReady } = useTransitions()

  if (!isReady || !query.trim()) {
    return transitions
  }

  const lowercaseQuery = query.toLowerCase()

  return transitions.filter(
    (transition: Transition) =>
      (transition.labels?.[lang] || transition.id || "").toLowerCase().includes(lowercaseQuery) ||
      (transition.description?.[lang] || "").toLowerCase().includes(lowercaseQuery) ||
      (transition.tags || []).some((tag: string) => tag.toLowerCase().includes(lowercaseQuery)),
  )
}
