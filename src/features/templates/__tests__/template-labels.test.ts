import { describe, expect, it } from "vitest"

import { getTemplateDescription, getTemplateLabels } from "../lib/template-labels"

describe("Template Labels", () => {
  describe("getTemplateLabels", () => {
    it("should return template label for valid id", () => {
      const label = getTemplateLabels("split-vertical-landscape")
      expect(typeof label).toBe("string")
      expect(label.length).toBeGreaterThan(0)
    })

    it("should return template label for different template ids", () => {
      const templateIds = [
        "split-vertical-landscape",
        "split-horizontal-landscape",
        "split-grid-2x2-landscape",
        "split-diagonal-landscape",
      ]

      templateIds.forEach((id) => {
        const label = getTemplateLabels(id)
        expect(typeof label).toBe("string")
        expect(label.length).toBeGreaterThan(0)
      })
    })

    it("should handle unknown template ids", () => {
      const label = getTemplateLabels("unknown-template-id")
      expect(typeof label).toBe("string")
      // Может вернуть ключ или пустую строку для неизвестных ID
    })
  })

  describe("getTemplateDescription", () => {
    it("should return template description for valid id", () => {
      const description = getTemplateDescription("split-vertical-landscape")
      expect(typeof description).toBe("string")
      expect(description.length).toBeGreaterThan(0)
    })

    it("should return template description for different template ids", () => {
      const templateIds = [
        "split-vertical-landscape",
        "split-horizontal-landscape",
        "split-grid-2x2-landscape",
        "split-diagonal-landscape",
      ]

      templateIds.forEach((id) => {
        const description = getTemplateDescription(id)
        expect(typeof description).toBe("string")
        expect(description.length).toBeGreaterThan(0)
      })
    })

    it("should handle unknown template ids", () => {
      const description = getTemplateDescription("unknown-template-id")
      expect(typeof description).toBe("string")
      // Может вернуть ключ или пустую строку для неизвестных ID
    })
  })

  describe("Template Label Functions", () => {
    it("should validate function exports", () => {
      // Проверяем, что функции экспортируются корректно
      expect(typeof getTemplateLabels).toBe("function")
      expect(typeof getTemplateDescription).toBe("function")
    })

    it("should handle function parameters", () => {
      // Проверяем, что функции принимают строковые параметры
      expect(() => getTemplateLabels("test")).not.toThrow()
      expect(() => getTemplateDescription("test")).not.toThrow()
    })

    it("should return consistent types", () => {
      // Проверяем, что функции всегда возвращают строки
      const testIds = ["test1", "test2", "unknown"]

      testIds.forEach((id) => {
        const label = getTemplateLabels(id)
        const description = getTemplateDescription(id)

        expect(typeof label).toBe("string")
        expect(typeof description).toBe("string")
      })
    })
  })
})
