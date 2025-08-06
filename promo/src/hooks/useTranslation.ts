import { type Language, translations } from "../constants/translations"
import { useLanguage } from "./useLanguage"

export function useTranslation() {
  const { language } = useLanguage()

  const t = (key: string) => {
    const keys = key.split(".")
    let value: any = translations[language as Language]

    for (const k of keys) {
      value = value?.[k]
    }

    return value || key
  }

  return { t, language }
}
