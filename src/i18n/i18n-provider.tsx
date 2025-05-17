"use client"

import { ReactNode, useEffect, useState } from "react"
import { I18nextProvider } from "react-i18next"
import i18n from "./index"

interface I18nProviderProps {
  children: ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [isI18nInitialized, setIsI18nInitialized] = useState(false)

  useEffect(() => {
    // Проверяем, инициализирован ли i18n
    if (i18n.isInitialized) {
      setIsI18nInitialized(true)
    } else {
      // Если не инициализирован, подписываемся на событие initialized
      const handleInitialized = () => {
        setIsI18nInitialized(true)
      }

      i18n.on("initialized", handleInitialized)

      // Очистка подписки при размонтировании
      return () => {
        i18n.off("initialized", handleInitialized)
      }
    }
  }, [])

  // Показываем загрузку, пока i18n не инициализирован
  if (!isI18nInitialized) {
    return null // или можно показать индикатор загрузки
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
