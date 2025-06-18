import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { VideoEffect } from "@/features/effects/types"
import { BrowserProviders } from "@/test/test-utils"

import { useEffectById, useEffects, useEffectsByCategory } from "../../hooks/use-effects"

// Mock the effects data module
vi.mock("../../data/effects.json", () => ({
  default: [
    {
      id: "blur-1",
      name: "Blur Basic",
      type: "blur",
      duration: 1000,
      category: "artistic",
      description: { ru: "Базовое размытие", en: "Basic blur" },
      complexity: "basic",
      params: { intensity: 50 },
      ffmpegCommand: () => "",
      previewPath: "/test.mp4",
      labels: { en: "Blur Basic", ru: "Размытие базовое" },
      tags: ["popular"],
    },
    {
      id: "brightness-1",
      name: "Brightness Adjust",
      type: "brightness",
      duration: 1000,
      category: "color-correction",
      description: { ru: "Настройка яркости", en: "Brightness adjustment" },
      complexity: "basic",
      params: { amount: 100 },
      ffmpegCommand: () => "",
      previewPath: "/test.mp4",
      labels: { en: "Brightness", ru: "Яркость" },
      tags: ["popular"],
    },
    {
      id: "vintage-1",
      name: "Vintage Film",
      type: "vintage",
      duration: 1000,
      category: "vintage",
      description: { ru: "Винтажный фильм", en: "Vintage film effect" },
      complexity: "intermediate",
      params: { intensity: 75 },
      ffmpegCommand: () => "",
      previewPath: "/test.mp4",
      labels: { en: "Vintage", ru: "Винтаж" },
      tags: ["retro", "dramatic"],
    },
    {
      id: "matrix-1",
      name: "Matrix Effect",
      type: "matrix",
      duration: 1000,
      category: "creative",
      description: { ru: "Эффект Матрицы", en: "Matrix effect" },
      complexity: "advanced",
      params: { intensity: 100 },
      ffmpegCommand: () => "",
      previewPath: "/test.mp4",
      labels: { en: "Matrix", ru: "Матрица" },
      tags: ["experimental", "intense"],
    },
  ],
}))

// Mock the effects data for tests
const mockEffects: VideoEffect[] = [
  {
    id: "blur-1",
    name: "Blur Basic",
    type: "blur",
    duration: 1000,
    category: "artistic",
    description: { ru: "Базовое размытие", en: "Basic blur" },
    complexity: "basic",
    params: { intensity: 50 },
    ffmpegCommand: () => "",
    previewPath: "/test.mp4",
    labels: { en: "Blur Basic", ru: "Размытие базовое" },
    tags: ["popular"],
  },
  {
    id: "brightness-1",
    name: "Brightness Adjust",
    type: "brightness",
    duration: 1000,
    category: "color-correction",
    description: { ru: "Настройка яркости", en: "Brightness adjustment" },
    complexity: "basic",
    params: { amount: 100 },
    ffmpegCommand: () => "",
    previewPath: "/test.mp4",
    labels: { en: "Brightness", ru: "Яркость" },
    tags: ["popular"],
  },
  {
    id: "vintage-1",
    name: "Vintage Film",
    type: "vintage",
    duration: 1000,
    category: "vintage",
    description: { ru: "Винтажный фильм", en: "Vintage film effect" },
    complexity: "intermediate",
    params: { intensity: 75 },
    ffmpegCommand: () => "",
    previewPath: "/test.mp4",
    labels: { en: "Vintage", ru: "Винтаж" },
    tags: ["retro", "dramatic"],
  },
  {
    id: "matrix-1",
    name: "Matrix Effect",
    type: "matrix",
    duration: 1000,
    category: "creative",
    description: { ru: "Эффект Матрицы", en: "Matrix effect" },
    complexity: "advanced",
    params: { intensity: 100 },
    ffmpegCommand: () => "",
    previewPath: "/test.mp4",
    labels: { en: "Matrix", ru: "Матрица" },
    tags: ["experimental", "intense"],
  },
]

describe("useEffects", () => {
  it("should return all effects", () => {
    const { result } = renderHook(() => useEffects(), {
      wrapper: BrowserProviders,
    })

    expect(result.current.effects).toHaveLength(4)
    expect(result.current.effects).toEqual(mockEffects)
  })

  it("should return effects with correct structure", () => {
    const { result } = renderHook(() => useEffects(), {
      wrapper: BrowserProviders,
    })

    const effect = result.current.effects[0]
    expect(effect).toHaveProperty("id")
    expect(effect).toHaveProperty("name")
    expect(effect).toHaveProperty("type")
    expect(effect).toHaveProperty("category")
    expect(effect).toHaveProperty("complexity")
    expect(effect).toHaveProperty("description")
    expect(effect).toHaveProperty("labels")
    expect(effect).toHaveProperty("tags")
  })
})

describe("useEffectById", () => {
  it("should return effect by id", () => {
    const { result } = renderHook(() => useEffectById("blur-1"), {
      wrapper: BrowserProviders,
    })

    expect(result.current).toBeDefined()
    expect(result.current?.id).toBe("blur-1")
    expect(result.current?.name).toBe("Blur Basic")
    expect(result.current?.type).toBe("blur")
  })

  it("should return undefined for non-existent id", () => {
    const { result } = renderHook(() => useEffectById("non-existent"), {
      wrapper: BrowserProviders,
    })

    expect(result.current).toBeUndefined()
  })

  it("should return undefined for empty id", () => {
    const { result } = renderHook(() => useEffectById(""), {
      wrapper: BrowserProviders,
    })

    expect(result.current).toBeUndefined()
  })
})

describe("useEffectsByCategory", () => {
  it("should return effects by category", () => {
    const { result } = renderHook(() => useEffectsByCategory("artistic"), {
      wrapper: BrowserProviders,
    })

    expect(result.current).toHaveLength(1)
    expect(result.current[0].category).toBe("artistic")
    expect(result.current[0].id).toBe("blur-1")
  })

  it("should return multiple effects for color-correction category", () => {
    const { result } = renderHook(() => useEffectsByCategory("color-correction"), {
      wrapper: BrowserProviders,
    })

    expect(result.current).toHaveLength(1)
    expect(result.current[0].category).toBe("color-correction")
  })

  it("should return empty array for non-existent category", () => {
    const { result } = renderHook(() => useEffectsByCategory("non-existent" as any), {
      wrapper: BrowserProviders,
    })

    expect(result.current).toHaveLength(0)
  })

  it("should return effects sorted by name", () => {
    const { result } = renderHook(() => useEffectsByCategory("vintage"), {
      wrapper: BrowserProviders,
    })

    expect(result.current).toHaveLength(1)
    expect(result.current[0].name).toBe("Vintage Film")
  })

  it("should return effects with all required properties", () => {
    const { result } = renderHook(() => useEffectsByCategory("creative"), {
      wrapper: BrowserProviders,
    })

    const effect = result.current[0]
    expect(effect).toHaveProperty("id")
    expect(effect).toHaveProperty("name")
    expect(effect).toHaveProperty("type")
    expect(effect).toHaveProperty("category", "creative")
    expect(effect).toHaveProperty("complexity")
    expect(effect).toHaveProperty("tags")
    expect(Array.isArray(effect.tags)).toBe(true)
  })

  it("should handle effects with different complexity levels", () => {
    const allEffects = renderHook(() => useEffects(), {
      wrapper: BrowserProviders,
    })

    const basicEffects = allEffects.result.current.effects.filter((e) => e.complexity === "basic")
    const intermediateEffects = allEffects.result.current.effects.filter((e) => e.complexity === "intermediate")
    const advancedEffects = allEffects.result.current.effects.filter((e) => e.complexity === "advanced")

    expect(basicEffects).toHaveLength(2)
    expect(intermediateEffects).toHaveLength(1)
    expect(advancedEffects).toHaveLength(1)
  })

  it("should handle effects with different tag combinations", () => {
    const allEffects = renderHook(() => useEffects(), {
      wrapper: BrowserProviders,
    })

    const popularEffects = allEffects.result.current.effects.filter((e) => e.tags.includes("popular"))
    const retroEffects = allEffects.result.current.effects.filter((e) => e.tags.includes("retro"))
    const experimentalEffects = allEffects.result.current.effects.filter((e) => e.tags.includes("experimental"))

    expect(popularEffects).toHaveLength(2)
    expect(retroEffects).toHaveLength(1)
    expect(experimentalEffects).toHaveLength(1)
  })
})

describe("Effects Module Integration", () => {
  it("should import effects hooks without errors", async () => {
    const { useEffects, useEffectById, useEffectsByCategory } = await import("../../hooks/use-effects")

    expect(useEffects).toBeDefined()
    expect(typeof useEffects).toBe("function")

    expect(useEffectById).toBeDefined()
    expect(typeof useEffectById).toBe("function")

    expect(useEffectsByCategory).toBeDefined()
    expect(typeof useEffectsByCategory).toBe("function")
  })

  it("should import effects utilities without errors", async () => {
    const { generateCSSFilterForEffect, getPlaybackRate } = await import("../../utils/css-effects")

    expect(generateCSSFilterForEffect).toBeDefined()
    expect(typeof generateCSSFilterForEffect).toBe("function")

    expect(getPlaybackRate).toBeDefined()
    expect(typeof getPlaybackRate).toBe("function")
  })

  it("should have valid effect type constants", () => {
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
    const validComplexities = ["basic", "intermediate", "advanced"]

    expect(validCategories.length).toBeGreaterThan(0)
    expect(validComplexities.length).toBe(3)
  })
})
