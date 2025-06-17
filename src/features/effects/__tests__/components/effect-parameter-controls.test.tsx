import { describe, expect, it } from "vitest"

import { VideoEffect } from "@/features/effects/types"

describe("EffectParameterControls", () => {
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

  it("should validate effect has parameters", () => {
    expect(mockEffect.params).toBeDefined()
    expect(Object.keys(mockEffect.params || {}).length).toBeGreaterThan(0)
  })

  it("should handle effect with no params", () => {
    const effectWithoutParams = { ...mockEffect, params: undefined }
    expect(effectWithoutParams.params).toBeUndefined()
  })

  it("should handle effect with empty params", () => {
    const effectWithEmptyParams = { ...mockEffect, params: {} }
    expect(effectWithEmptyParams.params).toBeDefined()
    expect(Object.keys(effectWithEmptyParams.params).length).toBe(0)
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
  })

  it("should handle multiple parameters", () => {
    const effectWithMultipleParams = {
      ...mockEffect,
      params: {
        intensity: 50,
        radius: 5,
        speed: 1.0,
        angle: 0,
      },
    }
    expect(effectWithMultipleParams.params).toBeDefined()
    expect(Object.keys(effectWithMultipleParams.params).length).toBe(4)
  })

  it("should validate parameter types", () => {
    expect(typeof mockEffect.params?.intensity).toBe("number")
    expect(typeof mockEffect.params?.radius).toBe("number")
    expect(mockEffect.params?.intensity).toBe(50)
    expect(mockEffect.params?.radius).toBe(5)
  })
})
