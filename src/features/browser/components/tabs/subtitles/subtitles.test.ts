import { describe, expect, it } from "vitest"

import {
  SUBTITLE_CATEGORIES,
  SUBTITLE_PREVIEW_TEXT,
  SubtitleStyle,
  subtitleStyleToCss,
} from "./subtitles"

describe("subtitles", () => {
  describe("SUBTITLE_CATEGORIES", () => {
    it("should have at least one category", () => {
      expect(SUBTITLE_CATEGORIES.length).toBeGreaterThan(0)
    })

    it("each category should have an id, name and styles array", () => {
      SUBTITLE_CATEGORIES.forEach((category) => {
        expect(category).toHaveProperty("id")
        expect(category).toHaveProperty("name")
        expect(category).toHaveProperty("styles")
        expect(Array.isArray(category.styles)).toBe(true)
      })
    })

    it("each style should have required properties", () => {
      SUBTITLE_CATEGORIES.forEach((category) => {
        category.styles.forEach((style) => {
          expect(style).toHaveProperty("id")
          expect(style).toHaveProperty("name")
          expect(style).toHaveProperty("category")
          expect(style).toHaveProperty("fontFamily")
          expect(style).toHaveProperty("fontSize")
          expect(style).toHaveProperty("fontWeight")
          expect(style).toHaveProperty("fontStyle")
          expect(style).toHaveProperty("color")
          // Не все стили имеют backgroundColor, поэтому не проверяем его
        })
      })
    })

    it("each style should have a unique id", () => {
      const ids = new Set<string>()
      let duplicateFound = false

      SUBTITLE_CATEGORIES.forEach((category) => {
        category.styles.forEach((style) => {
          if (ids.has(style.id)) {
            duplicateFound = true
          }
          ids.add(style.id)
        })
      })

      expect(duplicateFound).toBe(false)
    })
  })

  describe("SUBTITLE_PREVIEW_TEXT", () => {
    it("should be a non-empty string", () => {
      expect(typeof SUBTITLE_PREVIEW_TEXT).toBe("string")
      expect(SUBTITLE_PREVIEW_TEXT.length).toBeGreaterThan(0)
    })
  })

  describe("subtitleStyleToCss", () => {
    it("should convert subtitle style to CSS object", () => {
      const style: SubtitleStyle = {
        id: "test",
        name: "Test Style",
        category: "test",
        fontFamily: "Arial",
        fontSize: 24,
        fontWeight: "bold",
        fontStyle: "italic",
        textAlign: "center",
        color: "#FFFFFF",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        textShadow: "2px 2px 2px rgba(0, 0, 0, 0.8)",
        padding: 8,
        borderRadius: 4,
      }

      const css = subtitleStyleToCss(style)

      // Проверяем только основные свойства, так как функция может возвращать дополнительные свойства
      expect(css.fontFamily).toBe("Arial")
      expect(css.fontSize).toBe("24px")
      expect(css.fontWeight).toBe("bold")
      expect(css.fontStyle).toBe("italic")
      expect(css.textAlign).toBe("center")
      expect(css.color).toBe("#FFFFFF")
      expect(css.backgroundColor).toBe("rgba(0, 0, 0, 0.5)")
      expect(css.textShadow).toBe("2px 2px 2px rgba(0, 0, 0, 0.8)")
      expect(css.padding).toBe(8)
      expect(css.borderRadius).toBe(4)
    })

    it("should handle missing optional properties", () => {
      const style: SubtitleStyle = {
        id: "minimal",
        name: "Minimal Style",
        category: "minimal",
        fontFamily: "Arial",
        fontSize: 24,
        fontWeight: "normal",
        fontStyle: "normal",
        color: "#FFFFFF",
      }

      const css = subtitleStyleToCss(style)

      // Проверяем только основные свойства
      expect(css.fontFamily).toBe("Arial")
      expect(css.fontSize).toBe("24px")
      expect(css.fontWeight).toBe("normal")
      expect(css.fontStyle).toBe("normal")
      expect(css.color).toBe("#FFFFFF")
      expect(css.backgroundColor).toBeUndefined()
      expect(css.textShadow).toBeUndefined()
    })
  })
})
