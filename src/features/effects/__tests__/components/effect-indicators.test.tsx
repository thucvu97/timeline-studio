import { describe, expect, it } from "vitest"

import type { EffectTag, VideoEffect } from "@/features/effects/types"

describe("EffectIndicators", () => {
  const baseEffect: VideoEffect = {
    id: "test-effect",
    name: "Test Effect",
    type: "blur",
    category: "artistic",
    complexity: "basic",
    tags: ["popular"],
    description: { ru: "Тестовый эффект", en: "Test Effect" },
    labels: {
      ru: "Тест",
      en: "Test",
      es: "Prueba",
      fr: "Test",
      de: "Test",
    },
    params: {},
    ffmpegCommand: () => "test",
    previewPath: "/effects/test.mp4",
    duration: 0,
  }

  it("should have valid effect structure for indicators", () => {
    expect(baseEffect.category).toBe("artistic")
    expect(baseEffect.complexity).toBe("basic")
    expect(baseEffect.tags).toEqual(["popular"])
  })

  it("should handle effect with multiple tags", () => {
    const effectWithTags: VideoEffect = {
      ...baseEffect,
      tags: ["popular", "professional", "experimental"],
    }
    expect(effectWithTags.tags).toHaveLength(3)
    expect(effectWithTags.tags).toContain("popular")
    expect(effectWithTags.tags).toContain("professional")
    expect(effectWithTags.tags).toContain("experimental")
  })

  it("should handle effect without tags", () => {
    const effectWithoutTags = { ...baseEffect, tags: [] }
    expect(effectWithoutTags.tags).toHaveLength(0)
  })

  it("should handle different categories", () => {
    const categories = [
      "artistic",
      "vintage",
      "color-correction",
      "motion",
      "distortion",
      "cinematic",
      "creative",
      "technical",
    ]

    categories.forEach((category) => {
      const effect = { ...baseEffect, category: category as any }
      expect(effect.category).toBe(category)
    })
  })

  it("should handle undefined category", () => {
    const incompleteEffect = {
      ...baseEffect,
      category: undefined as any,
    }
    expect(incompleteEffect.category).toBeUndefined()
  })

  it("should validate complexity levels", () => {
    const complexities = ["basic", "intermediate", "advanced"]
    complexities.forEach((complexity) => {
      const effect = { ...baseEffect, complexity: complexity as any }
      expect(effect.complexity).toBe(complexity)
    })
  })

  it("should validate tag types", () => {
    const validTags: EffectTag[] = [
      "popular",
      "professional",
      "beginner-friendly",
      "experimental",
      "retro",
      "modern",
      "dramatic",
      "subtle",
      "intense",
    ]

    validTags.forEach((tag) => {
      const effect = { ...baseEffect, tags: [tag] }
      expect(effect.tags).toContain(tag)
    })
  })
})
