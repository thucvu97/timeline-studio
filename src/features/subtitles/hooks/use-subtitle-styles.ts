import { useCallback, useEffect, useState } from "react"

import { useTranslation } from "react-i18next"

import subtitleStylesData from "../data/subtitle-styles.json"
import { SubtitleStyle } from "../types/subtitles"
import {
  createFallbackSubtitleStyle,
  processSubtitleStyles,
  validateSubtitleStylesData,
} from "../utils/subtitle-processor"
// Импортируем JSON файл напрямую - в Tauri это работает отлично

interface UseSubtitlesReturn {
  subtitles: SubtitleStyle[]
  loading: boolean
  error: string | null
  reload: () => void
  isReady: boolean
}

/**
 * Хук для загрузки и управления субтитрами из JSON файла
 */
export function useSubtitles(): UseSubtitlesReturn {
  const { t } = useTranslation()
  const [subtitles, setSubtitles] = useState<SubtitleStyle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Загружает стили субтитров из импортированного JSON файла
   */
  const loadStyles = useCallback(() => {
    try {
      setLoading(true)
      setError(null)

      // Используем импортированные данные - в Tauri это работает мгновенно
      const data = subtitleStylesData

      // Валидируем данные
      if (!validateSubtitleStylesData(data)) {
        throw new Error(t("subtitles.errors.invalidStylesData", "Invalid subtitle styles data structure"))
      }

      // Обрабатываем стили (преобразуем в типизированные объекты)
      const processedStyles = processSubtitleStyles(data.styles)

      setSubtitles(processedStyles)

      console.log(
        `✅ ${t("subtitles.messages.stylesLoaded", "Loaded {{count}} subtitle styles from JSON", { count: processedStyles.length })}`,
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t("subtitles.errors.unknownError", "Unknown error")
      setError(
        t("subtitles.errors.failedToLoadStyles", "Failed to load subtitle styles: {{error}}", { error: errorMessage }),
      )

      // Создаем fallback стили в случае ошибки
      const fallbackStyles = [
        createFallbackSubtitleStyle("basic-white"),
        createFallbackSubtitleStyle("basic-yellow"),
        createFallbackSubtitleStyle("minimal-clean"),
      ]

      setSubtitles(fallbackStyles)

      console.error(
        `❌ ${t("subtitles.errors.fallbackStyles", "Failed to load subtitle styles, using fallback")}:`,
        err,
      )
    } finally {
      setLoading(false)
    }
  }, [t])

  // Загружаем стили при монтировании компонента
  useEffect(() => {
    loadStyles()
  }, [loadStyles])

  return {
    subtitles,
    loading,
    error,
    reload: loadStyles,
    isReady: !loading && subtitles.length > 0,
  }
}

/**
 * Хук для получения конкретного субтитра по ID
 */
export function useSubtitleById(subtitleId: string): SubtitleStyle | null {
  const { subtitles, isReady } = useSubtitles()

  if (!isReady) {
    return null
  }

  return subtitles.find((subtitle: SubtitleStyle) => subtitle.id === subtitleId) || null
}

/**
 * Хук для получения субтитров по категории
 */
export function useSubtitlesByCategory(category: string): SubtitleStyle[] {
  const { subtitles, isReady } = useSubtitles()

  if (!isReady) {
    return []
  }

  return subtitles.filter((subtitle: SubtitleStyle) => subtitle.category === category)
}

/**
 * Хук для поиска субтитров
 */
export function useSubtitlesSearch(query: string, lang: "ru" | "en" = "ru"): SubtitleStyle[] {
  const { subtitles, isReady } = useSubtitles()

  if (!isReady || !query.trim()) {
    return subtitles
  }

  const lowercaseQuery = query.toLowerCase()

  return subtitles.filter(
    (subtitle: SubtitleStyle) =>
      (subtitle.labels?.[lang] || subtitle.name || "").toLowerCase().includes(lowercaseQuery) ||
      (subtitle.description?.[lang] || "").toLowerCase().includes(lowercaseQuery) ||
      (subtitle.tags || []).some((tag: string) => tag.toLowerCase().includes(lowercaseQuery)),
  )
}
