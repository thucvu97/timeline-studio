import { useEffect, useState } from "react"

export type Language = "en" | "ru"

const SUPPORTED_LANGUAGES: Language[] = ["en", "ru"]

function detectLanguage(): Language {
  // Сначала проверяем localStorage
  const savedLanguage = localStorage.getItem("language")
  if (savedLanguage && SUPPORTED_LANGUAGES.includes(savedLanguage as Language)) {
    return savedLanguage as Language
  }

  // Затем определяем язык браузера
  const browserLanguage = navigator.language.split("-")[0]
  if (browserLanguage === "ru") {
    return "ru"
  }

  // По умолчанию английский
  return "en"
}

export function useLanguage() {
  const [language, setLanguage] = useState<Language>("en")

  useEffect(() => {
    setLanguage(detectLanguage())
  }, [])

  const changeLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage)
    localStorage.setItem("language", newLanguage)
  }

  return { language, changeLanguage }
}
