import { describe, expect, it } from "vitest"

import {
  DEFAULT_LANGUAGE,
  LANGUAGE_LOCALES,
  SUPPORTED_LANGUAGES,
  formatDateByLanguage,
  getLocaleByLanguage,
  isSupportedLanguage,
} from "../constants"

describe("i18n constants", () => {
  describe("SUPPORTED_LANGUAGES", () => {
    it("should contain all supported languages", () => {
      expect(SUPPORTED_LANGUAGES).toEqual(["ru", "en", "es", "fr", "de", "pt", "zh", "ja", "ko", "tr", "th"])
    })
  })

  describe("DEFAULT_LANGUAGE", () => {
    it("should be a supported language", () => {
      expect(SUPPORTED_LANGUAGES).toContain(DEFAULT_LANGUAGE)
    })
  })

  describe("LANGUAGE_LOCALES", () => {
    it("should have correct locale for each language", () => {
      expect(LANGUAGE_LOCALES).toEqual({
        ru: "ru-RU",
        en: "en-US",
        es: "es-ES",
        fr: "fr-FR",
        de: "de-DE",
        pt: "pt-PT",
        zh: "zh-CN",
        ja: "ja-JP",
        ko: "ko-KR",
        tr: "tr-TR",
        th: "th-TH",
      })
    })
  })

  describe("getLocaleByLanguage", () => {
    it("should return correct locale for supported language", () => {
      expect(getLocaleByLanguage("ru")).toBe("ru-RU")
      expect(getLocaleByLanguage("en")).toBe("en-US")
      expect(getLocaleByLanguage("es")).toBe("es-ES")
      expect(getLocaleByLanguage("fr")).toBe("fr-FR")
      expect(getLocaleByLanguage("de")).toBe("de-DE")
      expect(getLocaleByLanguage("pt")).toBe("pt-PT")
      expect(getLocaleByLanguage("zh")).toBe("zh-CN")
      expect(getLocaleByLanguage("ja")).toBe("ja-JP")
      expect(getLocaleByLanguage("ko")).toBe("ko-KR")
      expect(getLocaleByLanguage("tr")).toBe("tr-TR")
      expect(getLocaleByLanguage("th")).toBe("th-TH")
    })

    it("should return default locale for unsupported language", () => {
      expect(getLocaleByLanguage("unsupported")).toBe(LANGUAGE_LOCALES[DEFAULT_LANGUAGE])
    })
  })

  describe("isSupportedLanguage", () => {
    it("should return true for supported languages", () => {
      expect(isSupportedLanguage("ru")).toBe(true)
      expect(isSupportedLanguage("en")).toBe(true)
      expect(isSupportedLanguage("es")).toBe(true)
      expect(isSupportedLanguage("fr")).toBe(true)
      expect(isSupportedLanguage("de")).toBe(true)
      expect(isSupportedLanguage("pt")).toBe(true)
      expect(isSupportedLanguage("zh")).toBe(true)
      expect(isSupportedLanguage("ja")).toBe(true)
      expect(isSupportedLanguage("ko")).toBe(true)
      expect(isSupportedLanguage("tr")).toBe(true)
      expect(isSupportedLanguage("th")).toBe(true)
    })

    it("should return false for unsupported languages", () => {
      expect(isSupportedLanguage("unsupported")).toBe(false)
      expect(isSupportedLanguage("")).toBe(false)
      expect(isSupportedLanguage("123")).toBe(false)
    })
  })

  describe("formatDateByLanguage", () => {
    const testDate = new Date(2023, 0, 15) // 15 января 2023

    it("should format date with default options", () => {
      const result = formatDateByLanguage(testDate)
      expect(result).toBeTruthy()
      // Проверяем, что результат содержит год и месяц
      expect(result).toContain("23")
      expect(result).toContain("January 15")
    })

    it("should format date for English language", () => {
      const result = formatDateByLanguage(testDate, "en")
      expect(result).toBeTruthy()
      // Проверяем, что результат содержит месяц на английском
      expect(result).toContain("January")
    })

    it("should format date without year", () => {
      const result = formatDateByLanguage(testDate, "ru", {
        includeYear: false,
      })
      expect(result).toBeTruthy()
      // Проверяем, что результат не содержит год
      expect(result).not.toContain("2023")
    })

    it("should format date with short format", () => {
      const result = formatDateByLanguage(testDate, "ru", { longFormat: false })
      expect(result).toBeTruthy()
      // В коротком формате месяц представлен числом
      expect(result).toMatch(/\d{2}.\d{2}.\d{4}/)
    })

    it("should format date without year suffix for Russian", () => {
      const result = formatDateByLanguage(testDate, "ru", {
        addYearSuffix: false,
      })
      expect(result).toBeTruthy()
      // Проверяем, что результат не содержит "г."
      expect(result).not.toContain("г.")
    })

    it("should format date for Spanish language", () => {
      const result = formatDateByLanguage(testDate, "es")
      expect(result).toBeTruthy()
      // Проверяем, что результат содержит месяц на испанском
      expect(result).toContain("enero")
    })

    it("should format date for French language", () => {
      const result = formatDateByLanguage(testDate, "fr")
      expect(result).toBeTruthy()
      // Проверяем, что результат содержит месяц на французском
      expect(result).toContain("janvier")
    })

    it("should format date for German language", () => {
      const result = formatDateByLanguage(testDate, "de")
      expect(result).toBeTruthy()
      // Проверяем, что результат содержит месяц на немецком
      expect(result).toContain("Januar")
    })

    it("should use default locale for unsupported language", () => {
      const resultUnsupported = formatDateByLanguage(testDate, "unsupported")
      expect(resultUnsupported).toContain("January")
    })
  })
})
