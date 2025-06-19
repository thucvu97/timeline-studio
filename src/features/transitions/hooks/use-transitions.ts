import { useCallback, useEffect, useMemo, useState } from "react"

import { useTranslation } from "react-i18next"

import { Transition } from "@/features/transitions/types/transitions"

import transitionsData from "../data/transitions.json"
import { createFallbackTransition, processTransitions, validateTransitionsData } from "../utils/transition-processor"

// Импортируем JSON файл напрямую - в Tauri это работает отлично

// Глобальное состояние для переходов чтобы избежать рекурсивных вызовов
let globalTransitions: Transition[] = []
let globalLoading = true
let globalError: string | null = null
let globalInitialized = false

interface UseTransitionsReturn {
  transitions: Transition[]
  loading: boolean
  error: string | null
  reload: () => void
  isReady: boolean
}

/**
 * Инициализация переходов при первом использовании
 */
function initializeTransitions(t: (key: string, fallback?: string, options?: any) => string) {
  if (globalInitialized) return

  try {
    // Используем импортированные данные - в Tauri это работает мгновенно
    const data = transitionsData

    // Валидируем данные
    if (!validateTransitionsData(data)) {
      throw new Error(t("transitions.errors.invalidTransitionsData", "Invalid transitions data structure"))
    }

    // Обрабатываем переходы (преобразуем в типизированные объекты)
    globalTransitions = processTransitions(data.transitions)
    globalError = null

    console.log(
      `✅ ${t("transitions.messages.transitionsLoaded", "Loaded {{count}} transitions from JSON", { count: globalTransitions.length })}`,
    )
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : t("transitions.errors.unknownError", "Unknown error")
    globalError = t("transitions.errors.failedToLoadTransitions", "Failed to load transitions: {{error}}", {
      error: errorMessage,
    })

    // Создаем fallback переходы в случае ошибки
    globalTransitions = [
      createFallbackTransition("fade"),
      createFallbackTransition("zoom"),
      createFallbackTransition("slide"),
    ]

    console.error(
      `❌ ${t("transitions.errors.fallbackTransitions", "Failed to load transitions, using fallback")}:`,
      err,
    )
  } finally {
    globalLoading = false
    globalInitialized = true
  }
}

/**
 * Хук для загрузки и управления переходами из JSON файла
 */
export function useTransitions(): UseTransitionsReturn {
  const { t } = useTranslation()
  const [transitions, setTransitions] = useState<Transition[]>(globalTransitions)
  const [loading, setLoading] = useState(globalLoading)
  const [error, setError] = useState<string | null>(globalError)

  /**
   * Загружает переходы из импортированного JSON файла
   */
  const loadTransitions = useCallback(() => {
    // Создаем обертку для функции t, чтобы она соответствовала ожидаемой сигнатуре
    const translateWrapper = (key: string, fallback?: string, options?: Record<string, any>) => {
      const result = t(key, fallback || key, options)
      return typeof result === "string" ? result : JSON.stringify(result)
    }

    initializeTransitions(translateWrapper)
    setTransitions(globalTransitions)
    setLoading(globalLoading)
    setError(globalError)
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
  const { t } = useTranslation()

  // Инициализируем переходы если еще не инициализированы
  useMemo(() => {
    const translateWrapper = (key: string, fallback?: string, options?: Record<string, any>) => {
      const result = t(key, fallback || key, options)
      return typeof result === "string" ? result : JSON.stringify(result)
    }
    initializeTransitions(translateWrapper)
  }, [t])

  const transition = useMemo(() => {
    if (globalLoading || !globalTransitions.length) {
      return null
    }
    return globalTransitions.find((transition: Transition) => transition.id === transitionId) || null
  }, [transitionId])

  return transition
}

/**
 * Хук для получения переходов по категории
 */
export function useTransitionsByCategory(category: string): Transition[] {
  const { t } = useTranslation()

  // Инициализируем переходы если еще не инициализированы
  useMemo(() => {
    const translateWrapper = (key: string, fallback?: string, options?: Record<string, any>) => {
      const result = t(key, fallback || key, options)
      return typeof result === "string" ? result : JSON.stringify(result)
    }
    initializeTransitions(translateWrapper)
  }, [t])

  const filteredTransitions = useMemo(() => {
    if (globalLoading || !globalTransitions.length) {
      return []
    }
    return globalTransitions.filter((transition: Transition) => transition.category === category)
  }, [category])

  return filteredTransitions
}

/**
 * Хук для поиска переходов
 */
export function useTransitionsSearch(query: string, lang: "ru" | "en" = "ru"): Transition[] {
  const { t } = useTranslation()

  // Инициализируем переходы если еще не инициализированы
  useMemo(() => {
    const translateWrapper = (key: string, fallback?: string, options?: Record<string, any>) => {
      const result = t(key, fallback || key, options)
      return typeof result === "string" ? result : JSON.stringify(result)
    }
    initializeTransitions(translateWrapper)
  }, [t])

  const searchResults = useMemo(() => {
    if (globalLoading || !globalTransitions.length || !query.trim()) {
      return globalTransitions
    }

    const lowercaseQuery = query.toLowerCase()

    return globalTransitions.filter(
      (transition: Transition) =>
        (transition.labels?.[lang] || transition.id || "").toLowerCase().includes(lowercaseQuery) ||
        (transition.description?.[lang] || "").toLowerCase().includes(lowercaseQuery) ||
        (transition.tags || []).some((tag: string) => tag.toLowerCase().includes(lowercaseQuery)),
    )
  }, [query, lang])

  return searchResults
}
