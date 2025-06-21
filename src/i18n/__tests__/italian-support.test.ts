import { describe, expect, it } from "vitest"

import { LANGUAGE_LOCALES, SUPPORTED_LANGUAGES } from "../constants"
import translationIT from "../locales/it.json"

describe("Italian Language Support", () => {
  it("should include Italian in supported languages", () => {
    expect(SUPPORTED_LANGUAGES).toContain("it")
  })

  it("should have Italian locale mapping", () => {
    expect(LANGUAGE_LOCALES).toHaveProperty("it", "it-IT")
  })

  it("should have Italian translation file", () => {
    expect(translationIT).toBeDefined()
    expect(translationIT).toHaveProperty("common")
    expect(translationIT).toHaveProperty("language")
  })

  it("should have complete Italian translations", () => {
    // Check some key sections exist
    expect(translationIT.common).toHaveProperty("add", "Aggiungi")
    expect(translationIT.common).toHaveProperty("save", "Salva")
    expect(translationIT.common).toHaveProperty("cancel", "Annulla")
    
    // Check language native names
    expect(translationIT.language).toHaveProperty("native")
    expect(translationIT.language.native).toHaveProperty("it", "Italiano")
  })

  it("should have all 12 supported languages", () => {
    expect(SUPPORTED_LANGUAGES).toHaveLength(12)
    expect(SUPPORTED_LANGUAGES).toEqual([
      "ru", "en", "es", "fr", "de", "pt", "zh", "ja", "ko", "tr", "th", "it"
    ])
  })
})