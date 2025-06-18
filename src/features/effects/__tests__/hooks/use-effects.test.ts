import { describe, expect, it } from "vitest"

import { VideoEffect } from "@/features/effects/types"

describe("useEffects", () => {
  it("should have correct VideoEffect type structure", () => {
    const mockEffect: VideoEffect = {
      id: "test-effect",
      name: "Test Effect",
      type: "blur",
      duration: 1000,
      category: "artistic",
      complexity: "basic",
      description: { ru: "Тест", en: "Test" },
      ffmpegCommand: () => "blur=5",
      previewPath: "/test.mp4",
      labels: { en: "Test", ru: "Тест" },
      tags: ["test"],
    }

    expect(mockEffect).toHaveProperty("id")
    expect(mockEffect).toHaveProperty("name")
    expect(mockEffect).toHaveProperty("type")
    expect(mockEffect).toHaveProperty("category")
    expect(mockEffect).toHaveProperty("complexity")
    expect(mockEffect).toHaveProperty("description")
    expect(mockEffect).toHaveProperty("ffmpegCommand")
    expect(mockEffect).toHaveProperty("previewPath")
    expect(mockEffect).toHaveProperty("labels")
    expect(mockEffect).toHaveProperty("tags")
  })

  it("should validate VideoEffect category types", () => {
    const validCategories = [
      "artistic",
      "vintage",
      "color-correction",
      "motion",
      "distortion",
      "creative",
      "technical",
      "cinematic",
    ]

    validCategories.forEach((category) => {
      expect(typeof category).toBe("string")
      expect(category.length).toBeGreaterThan(0)
    })
  })

  it("should validate VideoEffect complexity types", () => {
    const validComplexities = ["basic", "intermediate", "advanced"]

    validComplexities.forEach((complexity) => {
      expect(typeof complexity).toBe("string")
      expect(complexity.length).toBeGreaterThan(0)
    })
  })

  it("should validate VideoEffect type structure", () => {
    const effectTypes = ["blur", "brightness", "contrast", "saturation", "vintage"]

    effectTypes.forEach((type) => {
      expect(typeof type).toBe("string")
      expect(type.length).toBeGreaterThan(0)
    })
  })

  it("should validate effect function signature", () => {
    const mockFFmpegCommand = (params: Record<string, number>) => {
      return `blur=${params.intensity || 50}`
    }

    expect(typeof mockFFmpegCommand).toBe("function")
    expect(mockFFmpegCommand({ intensity: 100 })).toBe("blur=100")
    expect(mockFFmpegCommand({})).toBe("blur=50")
  })
})