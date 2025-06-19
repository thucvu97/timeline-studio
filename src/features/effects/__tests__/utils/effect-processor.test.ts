import { describe, expect, it } from "vitest"

import {
  createFallbackEffect,
  processEffect,
  processEffects,
  validateEffect,
  validateEffectsData,
} from "../../utils/effect-processor"

describe("effect-processor", () => {
  const mockRawEffect = {
    id: "test-blur",
    name: "Test Blur",
    type: "blur",
    duration: 1000,
    category: "artistic",
    complexity: "basic",
    tags: ["blur", "artistic"],
    description: {
      ru: "Тестовое размытие",
      en: "Test blur",
    },
    ffmpegCommand: "blur={radius}",
    cssFilter: "blur({radius}px)",
    params: {
      radius: 5,
      intensity: 50,
    },
    previewPath: "/test-blur.mp4",
    labels: {
      ru: "Размытие",
      en: "Blur",
      es: "Desenfoque",
      fr: "Flou",
      de: "Unschärfe",
    },
  }

  describe("processEffect", () => {
    it("should convert raw effect data to VideoEffect", () => {
      const result = processEffect(mockRawEffect)

      expect(result.id).toBe(mockRawEffect.id)
      expect(result.name).toBe(mockRawEffect.name)
      expect(result.type).toBe(mockRawEffect.type)
      expect(typeof result.ffmpegCommand).toBe("function")
      expect(typeof result.cssFilter).toBe("function")
    })

    it("should create ffmpegCommand function from template", () => {
      const result = processEffect(mockRawEffect)
      const command = result.ffmpegCommand({ radius: 10 })

      expect(command).toBe("blur=10")
    })

    it("should create cssFilter function from template", () => {
      const result = processEffect(mockRawEffect)
      const filter = result.cssFilter!({ radius: 8 })

      expect(filter).toBe("blur(8px)")
    })

    it("should handle missing cssFilter", () => {
      const rawEffectWithoutCss = { ...mockRawEffect }
      rawEffectWithoutCss.cssFilter = undefined

      const result = processEffect(rawEffectWithoutCss)

      expect(result.cssFilter).toBeUndefined()
    })

    it("should handle template with multiple parameters", () => {
      const complexRawEffect = {
        ...mockRawEffect,
        ffmpegCommand: "blur={radius}:brightness={brightness}",
        cssFilter: "blur({radius}px) brightness({brightness})",
      }

      const result = processEffect(complexRawEffect)
      const command = result.ffmpegCommand({ radius: 5, brightness: 1.2 })
      const filter = result.cssFilter!({ radius: 5, brightness: 1.2 })

      expect(command).toBe("blur=5:brightness=1.2")
      expect(filter).toBe("blur(5px) brightness(1.2)")
    })

    it("should handle missing parameters in template", () => {
      const result = processEffect(mockRawEffect)
      const command = result.ffmpegCommand({ intensity: 50 }) // radius отсутствует

      expect(command).toBe("blur={radius}") // Параметр остается как есть
    })
  })

  describe("processEffects", () => {
    it("should process array of raw effects", () => {
      const rawEffects = [
        mockRawEffect,
        {
          ...mockRawEffect,
          id: "test-brightness",
          name: "Test Brightness",
          type: "brightness",
          ffmpegCommand: "brightness={value}",
          cssFilter: "brightness({value})",
        },
      ]

      const result = processEffects(rawEffects)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe("test-blur")
      expect(result[1].id).toBe("test-brightness")
      expect(typeof result[0].ffmpegCommand).toBe("function")
      expect(typeof result[1].ffmpegCommand).toBe("function")
    })

    it("should handle empty array", () => {
      const result = processEffects([])
      expect(result).toEqual([])
    })
  })

  describe("validateEffect", () => {
    it("should validate correct effect structure", () => {
      const result = validateEffect(mockRawEffect)
      expect(result).toBe(true)
    })

    it("should reject effect missing required fields", () => {
      const invalidEffect = { ...mockRawEffect }
      invalidEffect.id = undefined

      const result = validateEffect(invalidEffect)
      expect(result).toBe(false)
    })

    it("should reject effect missing name", () => {
      const invalidEffect = { ...mockRawEffect }
      invalidEffect.name = undefined

      const result = validateEffect(invalidEffect)
      expect(result).toBe(false)
    })

    it("should reject effect missing description", () => {
      const invalidEffect = { ...mockRawEffect }
      invalidEffect.description = undefined

      const result = validateEffect(invalidEffect)
      expect(result).toBe(false)
    })

    it("should reject null or undefined", () => {
      expect(validateEffect(null)).toBe(false)
      expect(validateEffect(undefined)).toBe(false)
    })
  })

  describe("validateEffectsData", () => {
    it("should validate correct effects data structure", () => {
      const validData = {
        version: "1.0.0",
        totalEffects: 1,
        lastUpdated: "2024-01-01",
        effects: [mockRawEffect],
      }

      const result = validateEffectsData(validData)
      expect(result).toBe(true)
    })

    it("should reject data without effects array", () => {
      const invalidData = {
        version: "1.0.0",
        totalEffects: 0,
      }

      const result = validateEffectsData(invalidData)
      expect(result).toBe(false)
    })

    it("should reject data with invalid effects", () => {
      const invalidData = {
        effects: [
          { id: "invalid" }, // Отсутствуют обязательные поля
        ],
      }

      const result = validateEffectsData(invalidData)
      expect(result).toBe(false)
    })

    it("should reject null or undefined data", () => {
      expect(validateEffectsData(null)).toBe(false)
      expect(validateEffectsData(undefined)).toBe(false)
    })

    it("should handle data without metadata", () => {
      const dataWithoutMeta = {
        effects: [mockRawEffect],
      }

      const result = validateEffectsData(dataWithoutMeta)
      expect(result).toBe(true)
    })
  })

  describe("createFallbackEffect", () => {
    it("should create valid fallback effect", () => {
      const fallback = createFallbackEffect("test-fallback")

      expect(fallback.id).toBe("test-fallback")
      expect(fallback.name).toBe("Неизвестный эффект")
      expect(fallback.type).toBe("brightness")
      expect(fallback.category).toBe("color-correction")
      expect(fallback.complexity).toBe("basic")
      expect(typeof fallback.ffmpegCommand).toBe("function")
      expect(typeof fallback.cssFilter).toBe("function")
    })

    it("should have working ffmpegCommand function", () => {
      const fallback = createFallbackEffect("test")
      const command = fallback.ffmpegCommand({})

      expect(command).toBe("brightness=1")
    })

    it("should have working cssFilter function", () => {
      const fallback = createFallbackEffect("test")
      const filter = fallback.cssFilter!({})

      expect(filter).toBe("brightness(1)")
    })

    it("should have all required labels", () => {
      const fallback = createFallbackEffect("test")

      expect(fallback.labels.ru).toBeDefined()
      expect(fallback.labels.en).toBeDefined()
      expect(fallback.labels.es).toBeDefined()
      expect(fallback.labels.fr).toBeDefined()
      expect(fallback.labels.de).toBeDefined()
    })

    it("should have description in multiple languages", () => {
      const fallback = createFallbackEffect("test")

      expect(fallback.description.ru).toBe("Эффект не найден")
      expect(fallback.description.en).toBe("Effect not found")
    })
  })
})
