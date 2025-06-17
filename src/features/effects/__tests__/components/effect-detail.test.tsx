import { describe, expect, it } from "vitest"

import { VideoEffect } from "@/features/effects/types"

describe("EffectDetail", () => {
  const mockEffect: VideoEffect = {
    id: "test-effect",
    name: "Test Effect",
    type: "blur",
    duration: 1000,
    category: "artistic",
    complexity: "basic",
    tags: ["popular"],
    description: { ru: "Тестовый эффект", en: "Test effect" },
    ffmpegCommand: (params) => `blur=${params.intensity || 50}`,
    params: {
      intensity: 50,
      radius: 5,
    },
    previewPath: "/test-preview.mp4",
    labels: {
      ru: "Тестовый эффект",
      en: "Test Effect",
      es: "Efecto de prueba",
      fr: "Effet de test",
      de: "Testeffekt",
    },
  }

  it("should have valid effect structure", () => {
    expect(mockEffect).toBeDefined()
    expect(mockEffect.id).toBe("test-effect")
    expect(mockEffect.name).toBe("Test Effect")
    expect(mockEffect.type).toBe("blur")
    expect(mockEffect.category).toBe("artistic")
    expect(mockEffect.complexity).toBe("basic")
  })

  it("should have params object", () => {
    expect(mockEffect.params).toBeDefined()
    expect(mockEffect.params?.intensity).toBe(50)
    expect(mockEffect.params?.radius).toBe(5)
  })

  it("should have ffmpegCommand function", () => {
    expect(typeof mockEffect.ffmpegCommand).toBe("function")
    const command = mockEffect.ffmpegCommand({ intensity: 25 })
    expect(command).toBe("blur=25")
  })

  it("should handle effect without params", () => {
    const effectWithoutParams = { ...mockEffect, params: undefined }
    expect(effectWithoutParams.params).toBeUndefined()
    const command = effectWithoutParams.ffmpegCommand({})
    expect(command).toBe("blur=50")
  })

  it("should handle effect with presets", () => {
    const effectWithPresets = {
      ...mockEffect,
      presets: {
        light: {
          name: { ru: "Легкий", en: "Light" },
          params: { intensity: 25, radius: 2 },
          description: { ru: "Легкий эффект", en: "Light effect" },
        },
      },
    }
    expect(effectWithPresets.presets).toBeDefined()
    expect(effectWithPresets.presets?.light).toBeDefined()
    expect(effectWithPresets.presets?.light.params.intensity).toBe(25)
  })
})
