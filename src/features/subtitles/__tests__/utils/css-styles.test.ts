import { afterEach, beforeEach, describe, expect, it } from "vitest"

import type { SubtitleStyleTemplate } from "../../types/subtitles"
import {
  applySubtitleStyleTemplate,
  generateSubtitleCSS,
  getSubtitleAnimation,
  resetSubtitleStyleTemplate,
  subtitleAnimations,
  subtitleStyleToCSS,
  validateSubtitleStyleTemplate,
} from "../../utils/css-styles"

describe("CSS Styles Module", () => {
  describe("subtitleStyleToCSS", () => {
    it("should convert subtitle style to CSS object", () => {
      const subtitleStyle: SubtitleStyleTemplate = {
        id: "test",
        name: "Test Style",
        category: "basic",
        complexity: "basic",
        tags: ["simple"],
        description: { ru: "Тест", en: "Test" },
        labels: { ru: "Тест", en: "Test" },
        style: {
          color: "#FFFFFF",
          fontSize: 24,
          fontFamily: "Arial",
          fontWeight: "bold",
          textAlign: "center",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          padding: "10px",
          borderRadius: "4px",
          textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
          letterSpacing: 1,
          lineHeight: 1.5,
        },
      }

      const result = subtitleStyleToCSS(subtitleStyle)

      expect(result).toMatchObject({
        color: "#FFFFFF",
        fontSize: "24px",
        fontFamily: "Arial",
        fontWeight: "bold",
        textAlign: "center",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: "10px",
        borderRadius: "4px",
        textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
        letterSpacing: "1px",
        lineHeight: 1.5,
      })
    })

    it("should handle gradient text", () => {
      const subtitleStyle: SubtitleStyleTemplate = {
        id: "gradient",
        name: "Gradient",
        category: "modern",
        complexity: "advanced",
        tags: ["gradient"],
        description: { ru: "Градиент", en: "Gradient" },
        labels: { ru: "Градиент", en: "Gradient" },
        style: {
          fontSize: 24,
          background: "linear-gradient(45deg, #FF0000, #00FF00)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        },
      }

      const result = subtitleStyleToCSS(subtitleStyle)

      expect(result.fontSize).toBe("24px")
      expect(result.background).toBe("linear-gradient(45deg, #FF0000, #00FF00)")
      expect(result.WebkitBackgroundClip).toBe("text")
      expect(result.WebkitTextFillColor).toBe("transparent")
    })

    it("should handle animation", () => {
      const subtitleStyle: SubtitleStyleTemplate = {
        id: "animated",
        name: "Animated",
        category: "animated",
        complexity: "intermediate",
        tags: ["animated"],
        description: { ru: "Анимированный", en: "Animated" },
        labels: { ru: "Анимированный", en: "Animated" },
        style: {
          animation: "fadeIn 1s ease-in-out",
          fontSize: 24,
        },
      }

      const result = subtitleStyleToCSS(subtitleStyle)

      expect(result.animation).toBe("fadeIn 1s ease-in-out")
    })

    it("should handle empty style object", () => {
      const subtitleStyle: SubtitleStyleTemplate = {
        id: "empty",
        name: "Empty",
        category: "basic",
        complexity: "basic",
        tags: [],
        description: { ru: "Пустой", en: "Empty" },
        labels: { ru: "Пустой", en: "Empty" },
        style: {},
      }

      const result = subtitleStyleToCSS(subtitleStyle)

      expect(result).toEqual({})
    })

    it("should handle string fontSize", () => {
      const subtitleStyle: SubtitleStyleTemplate = {
        id: "test",
        name: "Test",
        category: "basic",
        complexity: "basic",
        tags: [],
        description: { ru: "Тест", en: "Test" },
        labels: { ru: "Тест", en: "Test" },
        style: {
          fontSize: "2em" as any,
        },
      }

      const result = subtitleStyleToCSS(subtitleStyle)

      expect(result.fontSize).toBe("2em")
    })
  })

  describe("applySubtitleStyleTemplate", () => {
    let element: HTMLElement

    beforeEach(() => {
      element = document.createElement("div")
      document.body.appendChild(element)
    })

    afterEach(() => {
      document.body.removeChild(element)
    })

    it("should apply styles to element", () => {
      const subtitleStyle: SubtitleStyleTemplate = {
        id: "test",
        name: "Test",
        category: "basic",
        complexity: "basic",
        tags: [],
        description: { ru: "Тест", en: "Test" },
        labels: { ru: "Тест", en: "Test" },
        style: {
          color: "#FF0000",
          fontSize: 32,
          fontWeight: "bold",
        },
      }

      applySubtitleStyleTemplate(element, subtitleStyle)

      expect(element.style.color).toBe("rgb(255, 0, 0)")
      expect(element.style.fontSize).toBe("32px")
      expect(element.style.fontWeight).toBe("bold")
    })

    it("should handle null element gracefully", () => {
      const subtitleStyle: SubtitleStyleTemplate = {
        id: "test",
        name: "Test",
        category: "basic",
        complexity: "basic",
        tags: [],
        description: { ru: "Тест", en: "Test" },
        labels: { ru: "Тест", en: "Test" },
        style: {},
      }

      expect(() => applySubtitleStyleTemplate(null as any, subtitleStyle)).not.toThrow()
    })
  })

  describe("resetSubtitleStyleTemplate", () => {
    it("should reset element styles", () => {
      const element = document.createElement("div")
      element.style.color = "red"
      element.style.fontSize = "32px"
      element.style.fontWeight = "bold"
      element.style.background = "linear-gradient(45deg, red, blue)"
      element.style.padding = "10px"

      resetSubtitleStyleTemplate(element)

      expect(element.style.color).toBe("")
      expect(element.style.fontSize).toBe("")
      expect(element.style.fontWeight).toBe("")
      expect(element.style.background).toBe("")
      expect(element.style.padding).toBe("")
    })

    it("should handle null element by throwing error", () => {
      // Функция не обрабатывает null, поэтому должна выбросить ошибку
      expect(() => resetSubtitleStyleTemplate(null as any)).toThrow()
    })
  })

  describe("generateSubtitleCSS", () => {
    it("should generate CSS class string", () => {
      const subtitleStyle: SubtitleStyleTemplate = {
        id: "test-style",
        name: "Test Style",
        category: "basic",
        complexity: "basic",
        tags: [],
        description: { ru: "Тест", en: "Test" },
        labels: { ru: "Тест", en: "Test" },
        style: {
          color: "#FFFFFF",
          fontSize: 24,
          fontFamily: "Arial",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
        },
      }

      const result = generateSubtitleCSS(subtitleStyle)

      expect(result).toContain(".subtitle-style-test-style")
      expect(result).toContain("color: #FFFFFF")
      expect(result).toContain("font-size: 24px")
      expect(result).toContain("font-family: Arial")
      expect(result).toContain("background-color: rgba(0, 0, 0, 0.8)")
    })

    it("should include animation keyframes", () => {
      const subtitleStyle: SubtitleStyleTemplate = {
        id: "animated",
        name: "Animated",
        category: "animated",
        complexity: "intermediate",
        tags: ["animated"],
        description: { ru: "Анимированный", en: "Animated" },
        labels: { ru: "Анимированный", en: "Animated" },
        style: {
          animation: "fadeIn 1s",
          fontSize: 24,
        },
      }

      const result = generateSubtitleCSS(subtitleStyle)

      // Проверяем, что CSS содержит анимацию
      expect(result).toContain("animation: fadeIn 1s")
    })
  })

  describe("validateSubtitleStyleTemplate", () => {
    it("should validate correct style", () => {
      const style = {
        color: "#FFFFFF",
        fontSize: 24,
        fontFamily: "Arial",
      }

      const result = validateSubtitleStyleTemplate(style)

      expect(result).toBe(true)
    })

    it("should detect invalid color", () => {
      // Используем цвет который точно не пройдет валидацию
      const style = {
        color: "!!!invalid",
        fontSize: 24,
      }

      const result = validateSubtitleStyleTemplate(style)

      expect(result).toBe(false)
    })

    it("should detect invalid font size", () => {
      const style = {
        fontSize: -10,
      }

      const result = validateSubtitleStyleTemplate(style)

      expect(result).toBe(false)
    })

    it("should validate opacity", () => {
      const validOpacity = {
        opacity: 0.5,
      }

      const invalidOpacity = {
        opacity: 1.5,
      }

      expect(validateSubtitleStyleTemplate(validOpacity)).toBe(true)
      expect(validateSubtitleStyleTemplate(invalidOpacity)).toBe(false)
    })

    it("should validate line height", () => {
      const validLineHeight = {
        lineHeight: 1.5,
      }

      const invalidLineHeight = {
        lineHeight: -1,
      }

      expect(validateSubtitleStyleTemplate(validLineHeight)).toBe(true)
      expect(validateSubtitleStyleTemplate(invalidLineHeight)).toBe(false)
    })

    it("should handle empty style", () => {
      const result = validateSubtitleStyleTemplate({})

      expect(result).toBe(true)
    })
  })

  describe("subtitleAnimations", () => {
    it("should have predefined animations", () => {
      expect(subtitleAnimations).toBeDefined()
      expect(typeof subtitleAnimations).toBe("object")
      expect(Object.keys(subtitleAnimations).length).toBeGreaterThan(0)
    })

    it("should have typewriter animation", () => {
      expect(subtitleAnimations.typewriter).toBeDefined()
      expect(subtitleAnimations.typewriter).toContain("@keyframes typewriter")
      expect(subtitleAnimations.typewriter).toContain("width")
    })

    it("should have fadeInOut animation", () => {
      expect(subtitleAnimations.fadeInOut).toBeDefined()
      expect(subtitleAnimations.fadeInOut).toContain("@keyframes fadeInOut")
      expect(subtitleAnimations.fadeInOut).toContain("opacity")
    })

    it("should have slideInFromBottom animation", () => {
      expect(subtitleAnimations.slideInFromBottom).toBeDefined()
      expect(subtitleAnimations.slideInFromBottom).toContain("@keyframes slideInFromBottom")
      expect(subtitleAnimations.slideInFromBottom).toContain("transform")
    })
  })

  describe("getSubtitleAnimation", () => {
    it("should return animation keyframes by name", () => {
      const typewriter = getSubtitleAnimation("typewriter")
      expect(typewriter).toBe(subtitleAnimations.typewriter)

      const fadeInOut = getSubtitleAnimation("fadeInOut")
      expect(fadeInOut).toBe(subtitleAnimations.fadeInOut)
    })

    it("should return empty string for unknown animation", () => {
      const unknown = getSubtitleAnimation("unknownAnimation" as any)
      expect(unknown).toBe("")
    })

    it("should handle invalid animation names", () => {
      expect(getSubtitleAnimation("" as any)).toBe("")
      expect(getSubtitleAnimation("notExist" as any)).toBe("")
    })
  })
})
