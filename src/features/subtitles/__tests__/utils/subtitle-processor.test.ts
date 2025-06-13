import { describe, expect, it } from "vitest"

import {
  createFallbackSubtitleStyle,
  groupSubtitleStyles,
  processSubtitleStyles,
  searchSubtitleStyles,
  sortSubtitleStyles,
  validateSubtitleStylesData,
} from "../../utils/subtitle-processor"

import type { SubtitleStyle } from "../../types/subtitles"

describe("subtitle-processor", () => {
  const mockRawStyles = [
    {
      id: "basic-white",
      name: "Basic White",
      category: "basic",
      complexity: "basic",
      tags: ["simple", "clean"],
      description: { en: "Simple white subtitles", ru: "Простые белые субтитры" },
      labels: { en: "Basic White", ru: "Базовый белый" },
      style: {
        color: "#FFFFFF",
        fontSize: 24,
        fontFamily: "Arial",
      },
    },
    {
      id: "cinematic-elegant",
      name: "Elegant",
      category: "cinematic",
      complexity: "intermediate",
      tags: ["elegant", "professional"],
      description: { en: "Elegant cinematic style", ru: "Элегантный кинематографический стиль" },
      labels: { en: "Elegant", ru: "Элегантный" },
      style: {
        color: "#F5F5F5",
        fontSize: 28,
        fontFamily: "Georgia",
        textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
      },
    },
  ]

  const mockStyles: SubtitleStyle[] = [
    {
      id: "basic-white",
      name: "Basic White",
      category: "basic" as const,
      complexity: "basic" as const,
      tags: ["simple" as const, "clean" as const],
      description: { en: "Simple white subtitles", ru: "Простые белые субтитры" },
      labels: { en: "Basic White", ru: "Базовый белый" },
      style: {
        color: "#FFFFFF",
        fontSize: 24,
        fontFamily: "Arial",
      },
    },
    {
      id: "cinematic-elegant",
      name: "Elegant",
      category: "cinematic" as const,
      complexity: "intermediate" as const,
      tags: ["elegant" as const, "professional" as const],
      description: { en: "Elegant cinematic style", ru: "Элегантный кинематографический стиль" },
      labels: { en: "Elegant", ru: "Элегантный" },
      style: {
        color: "#F5F5F5",
        fontSize: 28,
        fontFamily: "Georgia",
        textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
      },
    },
  ]

  describe("processSubtitleStyles", () => {
    it("должен обрабатывать сырые данные стилей", () => {
      const result = processSubtitleStyles(mockRawStyles)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe("basic-white")
      expect(result[0].category).toBe("basic")
      expect(result[0].complexity).toBe("basic")
      expect(result[1].id).toBe("cinematic-elegant")
    })

    it("должен сохранять все поля стиля", () => {
      const result = processSubtitleStyles(mockRawStyles)

      expect(result[0].style.color).toBe("#FFFFFF")
      expect(result[0].style.fontSize).toBe(24)
      expect(result[0].style.fontFamily).toBe("Arial")
      expect(result[0].description.ru).toBe("Простые белые субтитры")
      expect(result[0].labels.en).toBe("Basic White")
    })
  })

  describe("validateSubtitleStylesData", () => {
    it("должен валидировать корректные данные", () => {
      const validData = {
        version: "1.0.0",
        lastUpdated: "2024-01-01",
        totalStyles: 2,
        categories: ["basic", "cinematic"],
        styles: mockRawStyles,
      }

      expect(validateSubtitleStylesData(validData)).toBe(true)
    })

    it("должен отклонять невалидные данные", () => {
      expect(validateSubtitleStylesData(null)).toBe(false)
      expect(validateSubtitleStylesData({})).toBe(false)
      expect(validateSubtitleStylesData({ version: "1.0.0" })).toBe(false)
      expect(validateSubtitleStylesData({ version: "1.0.0", styles: "not array" })).toBe(false)
    })

    it("должен проверять структуру стилей", () => {
      const invalidData = {
        version: "1.0.0",
        styles: [
          {
            id: "test",
            // отсутствуют обязательные поля
          },
        ],
      }

      expect(validateSubtitleStylesData(invalidData)).toBe(false)
    })
  })

  describe("createFallbackSubtitleStyle", () => {
    it("должен создавать базовый стиль", () => {
      const result = createFallbackSubtitleStyle("test-style")

      expect(result.id).toBe("test-style")
      expect(result.name).toBe("Test-style")
      expect(result.category).toBe("basic")
      expect(result.complexity).toBe("basic")
      expect(result.tags).toContain("fallback")
      expect(result.style.fontFamily).toBe("Arial, sans-serif")
      expect(result.style.fontSize).toBe(24)
      expect(result.style.color).toBe("#ffffff")
    })

    it("должен правильно обрабатывать имя", () => {
      const result = createFallbackSubtitleStyle("my-custom-style")

      expect(result.name).toBe("My-custom-style")
      expect(result.labels.ru).toBe("My-custom-style")
      expect(result.labels.en).toBe("My-custom-style")
    })
  })

  describe("searchSubtitleStyles", () => {
    it("должен возвращать все стили при пустом запросе", () => {
      const result = searchSubtitleStyles(mockStyles, "")

      expect(result).toEqual(mockStyles)
    })

    it("должен искать по названию", () => {
      const result = searchSubtitleStyles(mockStyles, "elegant")

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe("cinematic-elegant")
    })

    it("должен искать по тегам", () => {
      const result = searchSubtitleStyles(mockStyles, "simple")

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe("basic-white")
    })

    it("должен искать по описанию на русском", () => {
      const result = searchSubtitleStyles(mockStyles, "кинематографический", "ru")

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe("cinematic-elegant")
    })

    it("должен искать по описанию на английском", () => {
      const result = searchSubtitleStyles(mockStyles, "white", "en")

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe("basic-white")
    })

    it("должен быть регистронезависимым", () => {
      const result = searchSubtitleStyles(mockStyles, "ELEGANT")

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe("cinematic-elegant")
    })
  })

  describe("groupSubtitleStyles", () => {
    it("должен группировать по категориям", () => {
      const result = groupSubtitleStyles(mockStyles, "category")

      expect(Object.keys(result)).toContain("basic")
      expect(Object.keys(result)).toContain("cinematic")
      expect(result.basic).toHaveLength(1)
      expect(result.cinematic).toHaveLength(1)
    })

    it("должен группировать по сложности", () => {
      const result = groupSubtitleStyles(mockStyles, "complexity")

      expect(Object.keys(result)).toContain("basic")
      expect(Object.keys(result)).toContain("intermediate")
      expect(result.basic).toHaveLength(1)
      expect(result.intermediate).toHaveLength(1)
    })

    it("должен группировать по тегам", () => {
      const result = groupSubtitleStyles(mockStyles, "tags")

      expect(Object.keys(result)).toContain("simple")
      expect(Object.keys(result)).toContain("elegant")
      expect(result.simple).toHaveLength(1)
      expect(result.elegant).toHaveLength(1)
    })

    it("должен возвращать все стили при none", () => {
      const result = groupSubtitleStyles(mockStyles, "none")

      expect(Object.keys(result)).toEqual(["all"])
      expect(result.all).toEqual(mockStyles)
    })
  })

  describe("sortSubtitleStyles", () => {
    it("должен сортировать по имени по возрастанию", () => {
      const result = sortSubtitleStyles(mockStyles, "name", "asc")

      expect(result[0].name).toBe("Basic White")
      expect(result[1].name).toBe("Elegant")
    })

    it("должен сортировать по имени по убыванию", () => {
      const result = sortSubtitleStyles(mockStyles, "name", "desc")

      expect(result[0].name).toBe("Elegant")
      expect(result[1].name).toBe("Basic White")
    })

    it("должен сортировать по сложности", () => {
      const result = sortSubtitleStyles(mockStyles, "complexity", "asc")

      expect(result[0].complexity).toBe("basic")
      expect(result[1].complexity).toBe("intermediate")
    })

    it("должен сортировать по категории", () => {
      const result = sortSubtitleStyles(mockStyles, "category", "asc")

      expect(result[0].category).toBe("basic")
      expect(result[1].category).toBe("cinematic")
    })

    it("должен не изменять исходный массив", () => {
      const original = [...mockStyles]
      sortSubtitleStyles(mockStyles, "name", "desc")

      expect(mockStyles).toEqual(original)
    })
  })
})
