/**
 * DEPRECATED: Используйте useLanguage из @/features/language вместо этого хука
 * Этот хук оставлен для обратной совместимости
 */

import { useCallback, useEffect, useState } from "react"

import { invoke } from "@tauri-apps/api/core"
import { useTranslation } from "react-i18next"

import { DEFAULT_LANGUAGE, LanguageCode, isSupportedLanguage } from "@/i18n/constants"

interface LanguageResponse {
  language: string
  system_language: string
}

/**
 * @deprecated Используйте useLanguage из @/features/language
 * Хук для управления языком приложения (устаревший)
 * Синхронизирует язык между фронтендом и бэкендом Tauri
 */
export function useLanguage() {
  const { i18n } = useTranslation()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [systemLanguage, setSystemLanguage] = useState<LanguageCode>(DEFAULT_LANGUAGE)

  // Получение языка из бэкенда Tauri
  const fetchLanguage = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Получаем язык из бэкенда Tauri (используем новую безопасную команду)
      const response = await invoke<LanguageResponse>("get_app_language_tauri")

      // Проверяем, поддерживается ли язык
      const appLang = isSupportedLanguage(response.language) ? (response.language as LanguageCode) : DEFAULT_LANGUAGE

      const sysLang = isSupportedLanguage(response.system_language)
        ? (response.system_language as LanguageCode)
        : DEFAULT_LANGUAGE

      // Устанавливаем системный язык
      setSystemLanguage(sysLang)

      // Если язык приложения отличается от текущего, меняем его
      if (i18n.language !== appLang) {
        await i18n.changeLanguage(appLang)
      }

      // Сохраняем в localStorage для совместимости
      localStorage.setItem("app-language", appLang)
    } catch (err) {
      console.error("Error fetching language:", err)
      setError(err instanceof Error ? err.message : String(err))

      // Пытаемся получить язык из localStorage
      try {
        const storedLanguage = localStorage.getItem("app-language")
        if (storedLanguage && isSupportedLanguage(storedLanguage)) {
          await i18n.changeLanguage(storedLanguage as LanguageCode)
        }
      } catch (e) {
        console.error("Error reading language from localStorage:", e)
      }
    } finally {
      setIsLoading(false)
    }
  }, [i18n])

  // Изменение языка
  const changeLanguage = useCallback(
    async (lang: LanguageCode) => {
      try {
        setIsLoading(true)
        setError(null)

        // Меняем язык в i18next
        await i18n.changeLanguage(lang)

        // Сохраняем в localStorage
        localStorage.setItem("app-language", lang)

        // Синхронизируем с бэкендом Tauri (используем новую безопасную команду)
        await invoke<LanguageResponse>("set_app_language_tauri", { lang })
      } catch (err) {
        console.error("Error changing language:", err)
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setIsLoading(false)
      }
    },
    [i18n],
  )

  useEffect(() => {
    void fetchLanguage()
  }, [])

  return {
    currentLanguage: i18n.language as LanguageCode,
    systemLanguage,
    isLoading,
    error,
    changeLanguage,
    refreshLanguage: fetchLanguage,
  }
}
